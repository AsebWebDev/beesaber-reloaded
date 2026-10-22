#!/usr/bin/env bash
# Creates the place where Terraform keeps its state: a storage account in a
# resource group of its own. Run once per subscription, before the first
# `terraform init`. Running it again changes nothing.
#
# Terraform cannot create this itself: it needs the storage account before it
# can start. And it lives apart from rg-beesaber, so that deleting the app's
# resources never takes Terraform's memory of them along.
#
# Needs the Azure CLI, signed in with `az login`.
set -euo pipefail

# Git Bash on Windows turns arguments that look like paths, such as the
# scope /subscriptions/..., into Windows paths. Azure then finds no
# subscription in them.
export MSYS_NO_PATHCONV=1

LOCATION=germanywestcentral
GROUP=rg-beesaber-tfstate
# Part of a web address, so it has to be unique across all of Azure
ACCOUNT=stbeesabertfstate
CONTAINER=tfstate

echo "Resource group $GROUP"
az group create --name "$GROUP" --location "$LOCATION" \
  --tags app=beesaber purpose=terraform-state --output none

echo "Storage account $ACCOUNT"
# - Standard_LRS: three copies in one data centre, the cheapest kind
# - no shared keys: access only with an Azure login and a role (below),
#   never with one of the account's master keys
# - no public blobs, TLS 1.2 or newer
az storage account create --name "$ACCOUNT" --resource-group "$GROUP" \
  --location "$LOCATION" --sku Standard_LRS --kind StorageV2 \
  --min-tls-version TLS1_2 --allow-blob-public-access false \
  --allow-shared-key-access false --tags app=beesaber purpose=terraform-state \
  --output none

echo "Versions and soft delete"
# Every write of the state keeps the previous version, and a deleted state
# can be brought back for 30 days
az storage account blob-service-properties update --account-name "$ACCOUNT" \
  --resource-group "$GROUP" --enable-versioning true \
  --enable-delete-retention true --delete-retention-days 30 \
  --enable-container-delete-retention true \
  --container-delete-retention-days 30 --output none

echo "Access for the signed-in user"
# The id of whoever is signed in, read from their access token. Without
# shared keys, reading and writing blobs needs this role on the account.
USER_ID=$(az account get-access-token --query accessToken --output tsv |
  cut -d. -f2 | tr '_-' '/+' |
  # The token leaves out base64's padding, so base64 complains about the
  # end, after it has decoded everything that matters
  { base64 -d 2>/dev/null || true; } |
  sed -n 's/.*"oid":"\([^"]*\)".*/\1/p')
if [ -z "$USER_ID" ]; then
  echo "Could not read the id of the signed-in user. Run az login." >&2
  exit 1
fi
ACCOUNT_ID=$(az storage account show --name "$ACCOUNT" \
  --resource-group "$GROUP" --query id --output tsv)
az role assignment create --assignee-object-id "$USER_ID" \
  --assignee-principal-type User --role "Storage Blob Data Contributor" \
  --scope "$ACCOUNT_ID" --output none

echo "Container $CONTAINER"
# A new role takes a minute or two to take effect, so this may need a retry
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if az storage container create --name "$CONTAINER" \
    --account-name "$ACCOUNT" --auth-mode login --output none 2>/dev/null; then
    break
  fi
  if [ "$attempt" = 10 ]; then
    echo "The container could not be created. Run the script again in a minute." >&2
    exit 1
  fi
  echo "  waiting for the role to take effect ($attempt)"
  sleep 20
done

echo "Delete lock on $GROUP"
# Azure refuses to delete the group or anything in it while the lock is on.
# To delete it on purpose, remove the lock first.
az lock create --name do-not-delete --lock-type CanNotDelete \
  --resource-group "$GROUP" \
  --notes "Holds the Terraform state of BeeSaber" --output none

echo "Done. Terraform's state goes to $ACCOUNT/$CONTAINER."
