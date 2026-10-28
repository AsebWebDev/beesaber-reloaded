# Everything BeeSaber needs in Azure, described as what should exist.
# Terraform compares this with what it created before (the state) and with
# Azure, and creates, changes or deletes only the difference. See
# infra/README.md for how to run it.

provider "azurerm" {
  subscription_id = var.subscription_id
  features {}
}

# On every resource that takes tags. Azure's cost analysis and searches can
# group by them, and policy.tf makes managed-by compulsory.
locals {
  tags = {
    app         = var.name
    environment = "production"
    # Changes made by hand in the portal are undone by the next apply
    managed-by = "terraform"
    repository = "github.com/AsebWebDev/beesaber-reloaded"
  }
}

# A folder for all of BeeSaber's resources. Deleting it deletes all of them.
resource "azurerm_resource_group" "main" {
  name     = "rg-${var.name}"
  location = var.location
  tags     = local.tags
}

# Collects the logs of the app, so they can be searched in the portal.
# Azure bills by the gigabyte that comes in; the first 5 GB a month are free.
# The daily cap stops collecting at 0.15 GB a day, about 4.5 GB a month, so
# logs can never cost money. What comes in after the cap is lost until the
# next day.
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${var.name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  # Kept for 30 days, which is included in the price
  retention_in_days = 30
  daily_quota_gb    = 0.15
  tags              = local.tags
}
