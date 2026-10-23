# The app's own domain and its www form, each with a certificate that Azure
# issues and renews for free.
#
# Azure issues a certificate only for a domain already added to the app, and
# the app can only use it once it exists. Terraform adds the domains and
# requests the certificates; binding a certificate to its domain is one
# command afterwards (see infra/README.md), which Terraform then leaves
# alone.

locals {
  # How Azure checks that each domain points to the app before it issues a
  # certificate. The bare domain cannot have a CNAME, so it is checked over
  # HTTP.
  domains = {
    (var.domain)          = "HTTP"
    ("www.${var.domain}") = "CNAME"
  }
}

resource "azurerm_container_app_custom_domain" "main" {
  for_each         = local.domains
  name             = each.key
  container_app_id = azurerm_container_app.main.id

  lifecycle {
    # Set when the certificate is bound, outside of Terraform
    ignore_changes = [certificate_binding_type]
  }
}

resource "azurerm_container_app_environment_managed_certificate" "main" {
  for_each                     = local.domains
  name                         = replace(each.key, ".", "-")
  container_app_environment_id = azurerm_container_app_environment.main.id
  subject_name                 = each.key
  domain_control_validation    = each.value
  tags                         = local.tags

  depends_on = [azurerm_container_app_custom_domain.main]
}

output "certificate_ids" {
  description = "The managed certificate for each domain, to bind it with az containerapp hostname bind"
  value       = { for domain, certificate in azurerm_container_app_environment_managed_certificate.main : domain => certificate.id }
}
