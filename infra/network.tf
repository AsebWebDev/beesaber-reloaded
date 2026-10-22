# A private network for BeeSaber. The app and the database talk to each
# other inside it; the database gets no address on the internet at all.

resource "azurerm_virtual_network" "main" {
  name                = "vnet-${var.name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = ["10.10.0.0/16"]
  tags                = local.tags
}

# Where the Container Apps environment places the app. /23 is the size that
# every kind of environment accepts.
resource "azurerm_subnet" "apps" {
  name                 = "snet-apps"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.10.0.0/23"]
  # A direct path to the key vault inside Azure's network. The vault lets
  # this subnet in and turns the rest of the internet away.
  service_endpoints = ["Microsoft.KeyVault"]

  # Handed over to Container Apps, which places its own network interfaces
  # in it. Nothing else can be put there.
  delegation {
    name = "container-apps"

    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Where the database lives, reachable only from inside the network
resource "azurerm_subnet" "database" {
  name                 = "snet-database"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.10.2.0/24"]
  # PostgreSQL adds this itself when it moves in: its backups and write-ahead
  # log go to Azure Storage on this direct path. Without it here, Terraform
  # would take it away again.
  service_endpoints = ["Microsoft.Storage"]

  delegation {
    name = "postgresql"

    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Turns the database's name into its private address. The zone answers only
# inside the networks linked to it, so from the internet the name does not
# resolve at all. Its name has to end like this for PostgreSQL to use it.
resource "azurerm_private_dns_zone" "postgres" {
  name                = "${var.name}.private.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "link-${var.name}"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.main.id
  # Nothing in the network registers itself in this zone; PostgreSQL writes
  # its own entry
  registration_enabled = false
  tags                 = local.tags
}

# A firewall in front of the database subnet. Without it, anything placed in
# the network later could reach the database; with it, only the app can.
resource "azurerm_network_security_group" "database" {
  name                = "nsg-database"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags

  security_rule {
    name                       = "allow-app-to-postgres"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefixes    = azurerm_subnet.apps.address_prefixes
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "5432"
  }

  # Azure's own traffic between the parts of the database service in its
  # subnet
  security_rule {
    name                       = "allow-within-database-subnet"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefixes    = azurerm_subnet.database.address_prefixes
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "*"
  }

  # Overrides Azure's built-in rule that lets everything in the network in
  security_rule {
    name                       = "deny-rest-of-network"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_address_prefix      = "VirtualNetwork"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "database" {
  subnet_id                 = azurerm_subnet.database.id
  network_security_group_id = azurerm_network_security_group.database.id
}
