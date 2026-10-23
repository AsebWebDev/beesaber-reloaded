# What GitHub Actions needs to deploy a new version of the app, and nothing
# more. It signs in without a password: GitHub hands each workflow run a
# short-lived token that says which repository and environment it runs for,
# and Azure trusts exactly that (OpenID Connect).

variable "github_repository" {
  description = "The repository whose workflows may deploy, as owner/name"
  type        = string
  default     = "AsebWebDev/beesaber-reloaded"
}

# The identity deployments run as
resource "azurerm_user_assigned_identity" "deploy" {
  name                = "id-${var.name}-deploy"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

# Azure accepts GitHub's token for this identity only from a workflow job
# that runs in the repository's "production" environment. Other branches,
# pull requests and other repositories get nothing.
resource "azurerm_federated_identity_credential" "github_production" {
  name      = "github-production"
  parent_id = azurerm_user_assigned_identity.deploy.id
  audience  = ["api://AzureADTokenExchange"]
  issuer    = "https://token.actions.githubusercontent.com"
  subject   = "repo:${var.github_repository}:environment:production"
}

# Exactly what switching the app to a new image takes. Contributor on the
# app would not be enough, since an update also touches the environment and
# the app's identity; Contributor on the resource group would allow far
# more, like changing the database or the vault.
resource "azurerm_role_definition" "deployer" {
  name        = "BeeSaber Deployer"
  scope       = azurerm_resource_group.main.id
  description = "Updates BeeSaber's container app to a new image and reads its revisions"

  permissions {
    actions = [
      "Microsoft.App/containerApps/read",
      "Microsoft.App/containerApps/write",
      "Microsoft.App/containerApps/revisions/read",
      "Microsoft.App/containerApps/revisions/replicas/read",
      "Microsoft.App/managedEnvironments/read",
      # An app has to be allowed into its environment on every update
      "Microsoft.App/managedEnvironments/join/action",
      # The app runs as id-beesaber, which an update hands to it again
      "Microsoft.ManagedIdentity/userAssignedIdentities/assign/action",
    ]
  }

  assignable_scopes = [azurerm_resource_group.main.id]
}

resource "azurerm_role_assignment" "deployer" {
  scope              = azurerm_resource_group.main.id
  role_definition_id = azurerm_role_definition.deployer.role_definition_resource_id
  principal_id       = azurerm_user_assigned_identity.deploy.principal_id
}

# What the workflow needs to know to sign in. None of it is secret.
output "deploy_client_id" {
  description = "AZURE_CLIENT_ID for the GitHub environment"
  value       = azurerm_user_assigned_identity.deploy.client_id
}

output "tenant_id" {
  description = "AZURE_TENANT_ID for the GitHub environment"
  value       = data.azurerm_client_config.current.tenant_id
}
