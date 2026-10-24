# The database: PostgreSQL run by Azure, which takes care of installing,
# patching and backing it up. It lives in the database subnet and has no
# address on the internet.

# The server's built-in administrator needs a password, even though the app
# signs in with its managed identity and nobody uses this one. Long and
# random; it ends up in the Terraform state, which is why the state is kept
# encrypted in Azure.
resource "random_password" "database" {
  length  = 48
  special = false
}

# Trivy's check for connection throttling was written for the retired
# Single Server; Flexible Server has no such setting.
#trivy:ignore:AZU-0021
resource "azurerm_postgresql_flexible_server" "main" {
  name                = "psql-${var.name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  version             = "18"

  # The smallest size: 1 vCPU, 2 GB memory, and a CPU that may run at full
  # speed for short bursts. Free for the first 12 months of a new account,
  # like 32 GB of storage and 32 GB of backups.
  sku_name   = "B_Standard_B1ms"
  storage_mb = 32768

  # Backups of the last 7 days, kept in this region only. A copy in a second
  # region would cost extra.
  backup_retention_days        = 7
  geo_redundant_backup_enabled = false

  # Inside the private network, and nowhere else
  delegated_subnet_id           = azurerm_subnet.database.id
  private_dns_zone_id           = azurerm_private_dns_zone.postgres.id
  public_network_access_enabled = false

  administrator_login    = "beesaber"
  administrator_password = random_password.database.result

  # Sign-in with a token from Microsoft Entra ID, which identities like the
  # app's get without any password. Passwords still work until the app has
  # moved over.
  authentication {
    active_directory_auth_enabled = true
    password_auth_enabled         = true
    tenant_id                     = data.azurerm_client_config.current.tenant_id
  }

  tags = local.tags

  # The DNS zone has to be linked to the network before the server can
  # register its name in it
  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]

  lifecycle {
    # Terraform refuses any plan that would delete the server, and with it
    # the data. Deleting it on purpose means removing this line first.
    prevent_destroy = true
    # Azure picks an availability zone when the server is created; the
    # server must not be recreated just because nothing asked for one
    ignore_changes = [zone]
  }
}

# The person running Terraform administers the database with their Entra
# account. Only such an administrator may turn other Entra identities, like
# the app's, into database roles.
resource "azurerm_postgresql_flexible_server_active_directory_administrator" "admin" {
  server_name         = azurerm_postgresql_flexible_server.main.name
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  object_id           = data.azurerm_client_config.current.object_id
  principal_name      = var.database_admin
  principal_type      = "User"
}

# The database inside the server that the app uses
resource "azurerm_postgresql_flexible_server_database" "beesaber" {
  name      = var.name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"

  lifecycle {
    prevent_destroy = true
  }
}

# Azure has both of these on already. Written down here so that they stay on
# if Azure ever changes its defaults.

# Every sign-in, successful or not, goes to the server log, where someone
# trying passwords shows up
resource "azurerm_postgresql_flexible_server_configuration" "log_connections" {
  name      = "log_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# The database's regular writes to disk go to the log as well, which helps
# to explain a slow moment
resource "azurerm_postgresql_flexible_server_configuration" "log_checkpoints" {
  name      = "log_checkpoints"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}
