# Where the app runs: Azure Container Apps. Azure runs the containers, gives
# them an HTTPS address and restarts them when they fail; nobody manages a
# server.

# The environment the app runs in: which network, where the logs go, and how
# compute is billed. It costs nothing by itself.
resource "azurerm_container_app_environment" "main" {
  name                = "cae-${var.name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  # Inside the private network, next to the database. The subnet is
  # delegated to Container Apps, which needs an environment with workload
  # profiles (below).
  infrastructure_subnet_id = azurerm_subnet.apps.id
  # Azure keeps the network parts it runs the environment on, like its load
  # balancer, in a resource group of its own. Named here, it does not get an
  # invented name.
  infrastructure_resource_group_name = "rg-${var.name}-apps-infra"
  # The app gets an address on the internet; the database does not
  internal_load_balancer_enabled = false

  logs_destination           = "log-analytics"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  # Billed by the second a container runs, nothing while none does
  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
  }

  tags = local.tags
}
