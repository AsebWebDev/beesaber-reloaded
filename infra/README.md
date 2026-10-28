# BeeSaber on Azure

This folder describes BeeSaber's Azure environment as Terraform code. It
creates:

| Resource                           | Name                                    | Purpose                                                                            |
| ---------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| Resource group                     | `rg-beesaber`                           | Holds everything below                                                             |
| Log Analytics workspace            | `log-beesaber`                          | The app's logs, 30 days, capped at 0.15 GB a day                                   |
| Virtual network                    | `vnet-beesaber`                         | Private network with one subnet for the app and one for the database               |
| Private DNS zone                   | `beesaber.private.…`                    | Resolves the database's name inside the network only                               |
| Network security group             | `nsg-database`                          | Lets only the app subnet reach the database                                        |
| PostgreSQL Flexible Server         | `psql-beesaber`                         | The database, B1ms, without a public endpoint                                      |
| Key vault                          | `kv-beesaber`                           | Secrets that come from outside, like the Google client secret                      |
| Managed identity                   | `id-beesaber`                           | The app's identity; it may read secrets from the vault                             |
| Container Apps environment and app | `cae-beesaber`, `ca-beesaber`           | Runs the Docker image, with HTTPS and health checks                                |
| Budget                             | `budget-beesaber`                       | Emails when the month's costs reach half the budget, all of it, or are forecast to |
| Action group and alerts            | `ag-beesaber-owner`, `alert-beesaber-*` | Email when the app restarts, errs or runs out of memory, or the database fills up  |
| Availability test                  | `appi-beesaber`                         | Calls `/api/health` from Paris and Amsterdam; only with cost saving off            |

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

4. **The domain's DNS.** Set `domain` in `terraform.tfvars` if it is not
   `beesaber.de`, and add these records at the domain's registrar:

   | Name        | Type  | Value                                    |
   | ----------- | ----- | ---------------------------------------- |
   | `@`         | A     | the environment's static IP              |
   | `www`       | CNAME | `ca-beesaber.<default domain>`           |
   | `asuid`     | TXT   | the environment's domain verification id |
   | `asuid.www` | TXT   | the same id                              |

   ```sh
   az containerapp env show --resource-group rg-beesaber --name cae-beesaber \
     --query "properties.[staticIp, defaultDomain, customDomainConfiguration.customDomainVerificationId]" \
     --output tsv
   ```

   The TXT records prove to Azure that whoever controls the domain wants it
   on this environment, so nobody else can attach it to their app.

5. **Sign-in with Google.** Create an OAuth client of type "Web
   application" at <https://console.cloud.google.com/auth/clients>, made for
   this deployment only, with the redirect URI
   `https://<domain>/api/auth/callback/google`. Put its client id into
   `terraform.tfvars`. Put its secret into the vault, in the portal: open
   `kv-beesaber`, then Secrets, Generate/Import, name it
   `google-client-secret`. It is never written to a file.

   The secret that signs the session cookies goes into the vault too, as a
   random value that nobody ever sees:

   ```sh
   az keyvault secret set --vault-name kv-beesaber --name auth-secret \
     --value "$(openssl rand -base64 48)" --output none
   ```

   Running the same command again replaces it, which signs everybody out.

6. **The image.** The registry has to hold the image before the app can
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

7. **Everything else.** Empty `admin_ip_ranges` again, which closes the
   vault to every address, then:

   ```sh
   terraform apply
   ```

   The first start takes about half a minute: Azure pulls the image, and the
   server applies the database migrations before it answers. The
   certificates take a few minutes more.

8. **The certificates.** Azure issues a certificate only for a domain that
   is already on the app, so Terraform adds the domains without one. Once
   the apply is done, bind each certificate to its domain. This changes the
   ingress only; the app keeps running:

   ```sh
   for pair in "beesaber.de beesaber-de HTTP" "www.beesaber.de www-beesaber-de CNAME"; do
     set -- $pair
     az containerapp hostname bind --resource-group rg-beesaber \
       --name ca-beesaber --environment cae-beesaber \
       --hostname "$1" --certificate "$2" --validation-method "$3"
   done
   ```

   Azure renews the certificates by itself. The app sends visitors of the
   www address on to the domain itself.

9. **The app's role in the database.** The app signs in as its managed
   identity `id-beesaber`, with tokens; the server accepts no passwords.
   The identity needs a role in Postgres, which only the database's Entra
   administrator (you, `database_admin`) can create. Until it exists, the
   app fails to start, and Azure keeps trying.

   ```sql
   -- in the database postgres
   select * from pgaadauth_create_principal('id-beesaber', false, false);
   -- in the database beesaber: the app creates its tables itself, in its
   -- migrations, and so owns them
   grant create on database beesaber to "id-beesaber";
   grant usage, create on schema public to "id-beesaber";
   ```

   The database has no address outside the network, so this runs in a
   one-off job in the environment: a [Container Apps job][jobs] with the
   image `postgres:18-alpine`, started by hand, that pipes the statements
   into `psql`. It signs in as you, with `PGUSER` set to your Entra user
   name and `PGPASSWORD` to a token, handed to the job as a secret:

   ```sh
   az account get-access-token --resource-type oss-rdbms \
     --query accessToken --output tsv
   ```

   Set `PGHOST` to the server's name, `PGSSLMODE=verify-full` and
   `PGSSLROOTCERT=system`. The token is valid for about an hour. Read the
   job's output in Log Analytics (`ContainerAppConsoleLogs_CL`), then
   delete the job.

[jobs]: https://learn.microsoft.com/azure/container-apps/jobs

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
2. The job `Deploy to Azure` runs in the GitHub environment `production`,
   which only `main` may deploy to. A merge to `main` goes live without
   anyone approving it. To make deployments wait for approval again, add a
   required reviewer to the environment in the repository's settings.
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
   way as every deployment.
3. Revert the faulty change on `main` (`git revert`). Otherwise the next
   deployment brings it back.

### Cost saving

`cost_saving = true`, the default, lets the app stop when nobody uses it and
start on the next visit, which then takes a few seconds longer. The live
feed is off; the server catches up on stale scores when it starts.

`cost_saving = false` keeps one instance running all the time with the live
feed on, as production with many users would. It costs about 12 to 15 € a
month, and the availability test about 10 € more. The test runs only in this
mode: with cost saving on, its calls would keep waking the app up.

An alert sends one email when it fires and one when it resolves, not one
per check.

The app never runs as more than one instance; see "One instance" in the
main README.

### Restoring the database

Azure backs the database up every day and keeps every change in between,
for 7 days. It can restore any moment of those days, to the second, into a
**new** server; the old one stays as it is.

1. Restore to a moment before the damage, into the same subnet and DNS zone:

   ```sh
   az postgres flexible-server restore --resource-group rg-beesaber \
     --name psql-beesaber-restore --source-server psql-beesaber \
     --restore-time 2026-10-25T10:05:28Z \
     --subnet "$(az network vnet subnet show --resource-group rg-beesaber \
       --vnet-name vnet-beesaber --name snet-database --query id --output tsv)" \
     --private-dns-zone "$(az postgres flexible-server show \
       --resource-group rg-beesaber --name psql-beesaber \
       --query network.privateDnsZoneArmResourceId --output tsv)"
   ```

   The new server brings everything along: Entra sign-in only, the same
   Entra administrator, the app's role and its tables. In the drill on
   2026-10-25 it was ready after 8 and a half minutes.

2. Check it before trusting it, with a one-off job as in setup step 9: the
   newest `players.scores_synced_at` has to lie before the moment chosen.

3. Point the app at it: change the host in `DATABASE_URL` to
   `psql-beesaber-restore.postgres.database.azure.com`. The quickest way is
   `az containerapp update --set-env-vars`; Terraform still describes the old
   server, so the next apply would switch back. To keep the restored server
   for good, bring it into Terraform (`terraform import`) in place of the
   old one, which needs `prevent_destroy` lifted for the swap.

To practise, stop after step 2 and delete the restored server again:
`az postgres flexible-server delete --name psql-beesaber-restore`.

### Changing a secret

The vault accepts no address except the app's subnet. To change a secret,
open it for yourself for the time it takes:

1. Put your current public address into `admin_ip_ranges` and apply. Pause
   a VPN first: its address is shared with everybody else on the same VPN
   server, and the rule would let all of them past the firewall.
2. Change the secret in the portal, or with `az keyvault secret set`.
3. Restart the app, which reads its secrets only when it starts:

   ```sh
   az containerapp revision restart --resource-group rg-beesaber \
     --name ca-beesaber --revision "$(az containerapp show \
     --resource-group rg-beesaber --name ca-beesaber \
     --query properties.latestRevisionName --output tsv)"
   ```

4. Empty `admin_ip_ranges` and apply.

## Limits and trade-offs

What this setup does not do, on purpose, and what it would take. Each was
chosen for a small app with a few users and a budget of 10 € a month, and
each is where to look first if that changes.

### One instance

1. **It runs as exactly one instance.** The rate limits count in the
   process's memory, and the job queue's workers and the live feed run
   inside it. More instances would need the counters in Postgres or Redis,
   and one instance chosen to hold the live feed, or every instance would
   process every score; pg-boss already works with several. Until then a
   crash is a short outage, and growing means a bigger instance.
2. **One instance with a quarter core** answers fast up to about 60
   requests a second and is full at about 130 (see `loadtest/README.md`).
   More comes from more cores (`cpu` in `containerapps.tf`).

### Availability

3. **Cost saving stops the app** when nobody uses it. The next visitor waits
   for it to start, a few seconds, and more than 30 when a new revision
   starts at the same time. The live feed is off; scores arrive when the
   app wakes.
4. **The database has no standby** (no high availability, one zone). When
   its server fails, the app is down until Azure restarts it. With the
   Container Apps SLA, the two together promise about 99.85 % a month.
5. **Backups stay in the region:** 7 days, to any moment, in France Central
   only. If the whole region fails, so does access to them until it is back.
6. **A restore takes 15 to 20 minutes** all in all (see "Restoring the
   database"), and afterwards Terraform still describes the old server
   until it is brought in by hand.

### Security

7. **The rate limits count per address.** Visitors behind one VPN server,
   company network or mobile carrier share a limit, and an attacker with
   many addresses gets many limits.
8. **The Terraform state's storage account is reachable from the
   internet**, guarded by Entra ID sign-in and roles only. A firewall would
   lock out GitHub's runners, which have no fixed addresses.
9. **Opening the vault goes by address** (`admin_ip_ranges`), which a VPN
   shares with strangers; the roles still keep them out.
10. **The Log Analytics workspace accepts shared keys**, which Container
    Apps needs in its simple log mode.
11. **Changes by hand run with the owner's rights** of whoever is signed in
    to the Azure CLI, not with an identity limited to the task.
12. **No web application firewall or CDN** in front of the app; it is
    reached through Azure's proxy only. Azure Front Door with a WAF starts
    at about 35 $ a month.

### Operations

13. **Alerts come by email only.** In a test, the "resolved" email arrived
    long after the event. There is no second channel and nobody on call.
14. **The availability test runs only with cost saving off**, where it is
    worth its cost; with cost saving on, nothing notices from outside when
    the app is gone.
15. **Logs are kept for 30 days and capped at 0.15 GB a day.** What comes in
    after the cap is lost until the next day, which during an attack would
    be the part worth reading.
16. **The app depends on ScoreSaber.** If its API changes or shuts out
    BeeSaber, the core of the app stops. A weekly workflow
    (`.github/workflows/scoresaber-api.yml`) notices when the API's
    description changes.
17. **There is no staging environment.** Every merge to `main` goes to
    production, guarded by the checks, the review, the health check of
    each new revision and a rollback that has been tried.

## Costs

| Resource                                   | Cost                                                 |
| ------------------------------------------ | ---------------------------------------------------- |
| PostgreSQL B1ms with 32 GB and its backups | Free for the first 12 months of a new account        |
| Container App, cost saving on              | Within Container Apps' free monthly grant at low use |
| Container App, cost saving off             | About 12 to 15 € a month                             |
| Log Analytics                              | Within the free 5 GB a month                         |
| Alerts on metrics, emails                  | Free: up to 10 watched metrics, 1000 emails a month  |
| Availability test, cost saving off         | About 10 € a month: two places, every 5 minutes      |
| Private DNS zone                           | About 0.50 € a month                                 |
| Key vault, storage account, network        | Cents                                                |

The budget only sends emails. It does not stop anything.

## Removing everything

`terraform destroy` stops at the database, which `prevent_destroy`
protects. Remove those lines first if the data really is to go. The key
vault keeps its name reserved for 90 days after deletion, and the state's
resource group has a delete lock that has to be removed by hand.
