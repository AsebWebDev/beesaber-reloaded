# Which Terraform and which providers this configuration needs. A provider is
# the plugin that knows how to talk to one service, here Azure.
terraform {
  required_version = ">= 1.9"

  # Where Terraform keeps its state: in Azure, created by bootstrap-state.sh.
  # Encrypted, versioned, locked while someone applies, and reachable from
  # any machine signed in with `az login`.
  backend "azurerm" {
    resource_group_name  = "rg-beesaber-tfstate"
    storage_account_name = "stbeesabertfstate"
    container_name       = "tfstate"
    key                  = "beesaber.tfstate"
    # Sign in with the Azure login; the account has no keys to use
    use_azuread_auth = true
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    # Makes the database password, so that no person ever types or sees it
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}
