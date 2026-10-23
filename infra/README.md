# BeeSaber on Azure

This folder describes BeeSaber's Azure environment as Terraform code. It
creates:

| Resource                           | Name                          | Purpose                                                                            |
| ---------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| Resource group                     | `rg-beesaber`                 | Holds everything below                                                             |
| Log Analytics workspace            | `log-beesaber`                | The app's logs, 30 days, capped at 0.15 GB a day                                   |
| Virtual network                    | `vnet-beesaber`               | Private network with one subnet for the app and one for the database               |
| Private DNS zone                   | `beesaber.private.…`          | Resolves the database's name inside the network only                               |
| Network security group             | `nsg-database`                | Lets only the app subnet reach the database                                        |
| PostgreSQL Flexible Server         | `psql-beesaber`               | The database, B1ms, without a public endpoint                                      |
| Key vault                          | `kv-beesaber`                 | Secrets that come from outside, like the Google client secret                      |
| Managed identity                   | `id-beesaber`                 | The app's identity; it may read secrets from the vault                             |
| Container Apps environment and app | `cae-beesaber`, `ca-beesaber` | Runs the Docker image, with HTTPS and health checks                                |
| Budget                             | `budget-beesaber`             | Emails when the month's costs reach half the budget, all of it, or are forecast to |

The key vault's access log and the database server's log, with every
sign-in, go to the Log Analytics workspace.

Azure adds two resource groups of its own: `rg-beesaber-apps-infra` for the
Container Apps environment's network parts, and `NetworkWatcherRG`. Neither
is managed here; leave them as they are.

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli),
  signed in with `az login`
- [Terraform](https://developer.hashicorp.com/terraform/install) 1.9 or newer
- Docker and the [GitHub CLI](https://cli.github.com/), to publish the image
- An Azure subscription with these resource providers registered:

  ```sh
  for provider in Microsoft.App Microsoft.OperationalInsights \
    Microsoft.DBforPostgreSQL Microsoft.KeyVault Microsoft.ManagedIdentity; do
    az provider register --namespace "$provider"
  done
  ```

On Git Bash for Windows, prefix `az` commands that take a resource id, like
`--scope /subscriptions/...`, with `MSYS_NO_PATHCONV=1`. Otherwise Git Bash
turns the id into a Windows path. Do not set it for other commands such as
`pnpm`, which rely on that conversion.

## Choosing a region

Everything runs in one region, set by `location` in `variables.tf`. Some
subscriptions, free trials in particular, are not allowed to create
PostgreSQL servers in every region. Check before choosing:

```sh
az postgres flexible-server list-skus --location <region> \
  --query "[0].reason" --output tsv
```

An empty answer means servers can be created there. Any text, such as
"Provisioning is restricted in this region", means they cannot.

## First setup

1. **Storage for the Terraform state.** Terraform keeps track of what it
   created in a state file. It lives in a storage account that Terraform
   cannot create itself, since it needs it to start:

   ```sh
   bash infra/bootstrap-state.sh
   ```

   The script creates `rg-beesaber-tfstate` with a delete lock, and a storage
   account without access keys: only signed-in users with a role get in.
   Storage account names are unique across all of Azure; if the name is
   taken, change it in the script and in the `backend` block of
   `versions.tf`.

2. **Settings.** Copy `terraform.tfvars.example` to `terraform.tfvars`,
   which git ignores, and fill in the subscription id, the image, the
   budget email and, under `admin_ip_ranges`, your current public address
   (`curl https://api.ipify.org`).

3. **The vault and the environment first.** The app reads a secret that
   has to be in the vault before the app starts, and the app's address is
   only known once its environment exists:

   ```sh
   cd infra
   terraform init
   terraform apply \
     -target=azurerm_role_assignment.vault_officer \
     -target=azurerm_role_assignment.app_reads_secrets \
     -target=azurerm_container_app_environment.main
   ```

   The app's address is `https://ca-beesaber.<default domain>`:

   ```sh
   az containerapp env show --resource-group rg-beesaber \
     --name cae-beesaber --query properties.defaultDomain --output tsv
   ```

4. **Sign-in with Google.** Create an OAuth client of type "Web
   application" at <https://console.cloud.google.com/auth/clients>, made for
   this deployment only, with the redirect URI
   `https://<app address>/api/auth/callback/google`. Put its client id into
   `terraform.tfvars`. Put its secret into the vault, in the portal: open
   `kv-beesaber`, then Secrets, Generate/Import, name it
   `google-client-secret`. It is never written to a file.

5. **The image.** The registry has to hold the image before the app can
   start. Build it from a clean checkout of `main` and tag it with the
   commit:

   ```sh
   gh auth refresh --hostname github.com --scopes write:packages
   gh auth token | docker login ghcr.io --username <github user> --password-stdin
   tag=$(git rev-parse --short=7 origin/main)
   docker build --tag ghcr.io/<github user>/beesaber:$tag .
   docker push ghcr.io/<github user>/beesaber:$tag
   ```

   A new package on GitHub is private. Make it public in the package's
   settings, so Azure can pull it without credentials. The image holds no
   secrets; they reach the container from Azure when it starts.

6. **Everything else.** Empty `admin_ip_ranges` again, which closes the
   vault to every address, then:

   ```sh
   terraform apply
   terraform output app_url
   ```

   The first start takes about half a minute: Azure pulls the image, and the
   server applies the database migrations before it answers.

## Making changes

Always read the plan before applying it, and apply exactly the plan that
was read:

```sh
terraform plan -out=change.tfplan
terraform apply change.tfplan
```

Things to look out for in a plan:

- `-/+` means the resource is deleted and created again. For the database,
  `prevent_destroy` stops such a plan.
- `~` on a resource nobody changed usually means Azure added something to it
  that the code does not know about. Applying would take it away again. Add
  it to the code instead.
- Right after a resource group or other resource was deleted, a new one
  under the same name can get contradictory answers from Azure for several
  minutes, and plans can claim resources are missing that exist. Wait, and
  plan again until two plans in a row agree.

### A new version of the app

Every merge to `main` is deployed by CI (`.github/workflows/ci.yml`), once
the checks have passed:

1. The image that was built and scanned is pushed to the registry, tagged
   with the commit.
2. The job `Deploy to Azure` waits for approval: open the run on GitHub and
   choose "Review deployments". It runs in the GitHub environment
   `production`, which only `main` may deploy to.
3. It signs in to Azure as `id-beesaber-deploy`, without a password, and
   switches the app to the image's digest. That identity may update this one
   app and nothing else.
4. It checks that the newest revision runs that image, is healthy and gets
   all the traffic. Until then, the previous version keeps serving.

Terraform sets the first image from `image` in `terraform.tfvars` and leaves
it alone after that.

The `production` environment needs the secrets `AZURE_CLIENT_ID`
(`terraform output deploy_client_id`), `AZURE_TENANT_ID`
(`terraform output tenant_id`) and `AZURE_SUBSCRIPTION_ID`. They are not
secret, but the workflow logs of a public repository are public, and GitHub
masks secrets in them.

### Rolling back

When a deployed version misbehaves, put the last one that worked back
first and find the fault afterwards:

1. Find the commit of the last good version, for example in the list of
   runs of the `CI` workflow on GitHub.
2. In the Actions tab, choose the workflow `Roll back`, then "Run workflow",
   and give that commit. It deploys the image CI published for it, the same
   way as every deployment, approval included.
3. Revert the faulty change on `main` (`git revert`). Otherwise the next
   deployment brings it back.

### Cost saving

`cost_saving = true`, the default, lets the app stop when nobody uses it and
start on the next visit, which then takes a few seconds longer. The live
feed is off; the server catches up on stale scores when it starts.

`cost_saving = false` keeps one instance running all the time with the live
feed on, as production with many users would. It costs about 12 to 15 € a
month.

The app never runs as more than one instance; see "One instance" in the
main README.

### Changing a secret

The vault accepts no address except the app's subnet. To change a secret,
open it for yourself for the time it takes:

1. Put your current public address into `admin_ip_ranges` and apply.
2. Change the secret in the portal. The app picks up the newest version of
   a secret within about half an hour, or at its next restart.
3. Empty `admin_ip_ranges` and apply.

## Costs

| Resource                                   | Cost                                                 |
| ------------------------------------------ | ---------------------------------------------------- |
| PostgreSQL B1ms with 32 GB and its backups | Free for the first 12 months of a new account        |
| Container App, cost saving on              | Within Container Apps' free monthly grant at low use |
| Container App, cost saving off             | About 12 to 15 € a month                             |
| Log Analytics                              | Within the free 5 GB a month                         |
| Private DNS zone                           | About 0.50 € a month                                 |
| Key vault, storage account, network        | Cents                                                |

The budget only sends emails. It does not stop anything.

## Removing everything

`terraform destroy` stops at the database, which `prevent_destroy`
protects. Remove those lines first if the data really is to go. The key
vault keeps its name reserved for 90 days after deletion, and the state's
resource group has a delete lock that has to be removed by hand.
