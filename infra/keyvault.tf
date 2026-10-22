# A vault for secrets that come from outside, like the Google client secret.
# A person puts them in once, in the portal; the app reads them with its own
# identity. Terraform creates the vault and decides who may do what, but
# never sees what is inside, so these secrets are neither on a laptop nor in
# the Terraform state.

# Who runs Terraform: the tenant to create the vault in, and the person who
# gets to put secrets into it
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                = "kv-${var.name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # Access by Azure roles, the same way as everywhere else. Managing the
  # vault and reading its secrets are separate roles, so not even an owner
  # of the subscription can read a secret without being given one.
  rbac_authorization_enabled = true

  # A deleted secret, or the whole vault, can be brought back for 90 days,
  # and nobody can skip that wait, not even an owner
  soft_delete_retention_days = 90
  purge_protection_enabled   = true

  # Turns everyone away who is not on this list, before a role is even
  # looked at: the app's subnet, which reaches the vault on a direct path
  # inside Azure (the service endpoint in network.tf), and the addresses of
  # whoever puts secrets in. "AzureServices" lets Azure's own trusted
  # services through, such as its backups.
  network_acls {
    default_action             = "Deny"
    bypass                     = "AzureServices"
    virtual_network_subnet_ids = [azurerm_subnet.apps.id]
    ip_rules                   = var.admin_ip_ranges
  }

  tags = local.tags
}

# The person running Terraform may put secrets in and manage them
resource "azurerm_role_assignment" "vault_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# The app's identity: Azure knows that the app's container is this identity
# and hands it short-lived tokens. No password exists that could leak.
resource "azurerm_user_assigned_identity" "app" {
  name                = "id-${var.name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

# The app may read secrets from the vault, and do nothing else with it
resource "azurerm_role_assignment" "app_reads_secrets" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}
