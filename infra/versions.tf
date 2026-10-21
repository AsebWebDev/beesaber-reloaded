# Which Terraform and which providers this configuration needs. A provider is
# the plugin that knows how to talk to one service, here Azure.
terraform {
  required_version = ">= 1.9"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}
