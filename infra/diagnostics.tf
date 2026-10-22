# Many Azure services keep their own logs to themselves until told where to
# send them. These send them to the Log Analytics workspace, where they can
# be searched and kept for 30 days.

# Every access to the vault's secrets, allowed or refused: who read which
# secret, and when
resource "azurerm_monitor_diagnostic_setting" "key_vault" {
  name                       = "to-log-analytics"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category_group = "audit"
  }
}

# The database server's log, with the sign-ins and checkpoints switched on in
# database.tf
resource "azurerm_monitor_diagnostic_setting" "database" {
  name                       = "to-log-analytics"
  target_resource_id         = azurerm_postgresql_flexible_server.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "PostgreSQLLogs"
  }
}
