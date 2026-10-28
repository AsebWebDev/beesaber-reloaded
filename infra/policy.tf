# Rules that Azure enforces in the resource group for every change, whoever
# makes it: Terraform, someone in the portal, or a script with the CLI. Both
# are Microsoft's built-in definitions; assigning them costs nothing.
#
# A rule applies to resources created or changed after it is assigned, and
# takes up to half an hour to start. Resources from before that break it
# are listed as non-compliant, not removed.

data "azurerm_policy_definition" "require_tag" {
  display_name = "Require a tag on resources"
}

data "azurerm_policy_definition" "allowed_locations" {
  display_name = "Allowed locations"
}

# A resource without managed-by is refused. Whoever finds something in the
# group knows where it is described, and one-off resources from scripts,
# like the load test's job, have to say so too.
resource "azurerm_resource_group_policy_assignment" "require_managed_by" {
  name                 = "require-managed-by-tag"
  display_name         = "Every resource says what manages it"
  resource_group_id    = azurerm_resource_group.main.id
  policy_definition_id = data.azurerm_policy_definition.require_tag.id

  parameters = jsonencode({
    tagName = { value = "managed-by" }
  })

  non_compliance_message {
    content = "Add the tag managed-by, for example managed-by = terraform. See infra/README.md."
  }
}

# Everything lives in France Central (see "Choosing a region" in
# infra/README.md). A resource elsewhere is refused, so none ends up in
# another region by mistake. Resources without a region, like the private
# DNS zone ("global"), are not affected.
resource "azurerm_resource_group_policy_assignment" "allowed_locations" {
  name                 = "allowed-locations"
  display_name         = "Resources stay in ${var.location}"
  resource_group_id    = azurerm_resource_group.main.id
  policy_definition_id = data.azurerm_policy_definition.allowed_locations.id

  parameters = jsonencode({
    listOfAllowedLocations = { value = [var.location] }
  })

  non_compliance_message {
    content = "Resources of BeeSaber stay in ${var.location}. See infra/README.md."
  }
}
