# Emails when something is wrong, before a friend writes that the app is
# down.
#
# The alerts on metrics are free: Azure charges for them from the eleventh
# watched metric on. The test from outside is charged by the call, so it
# only runs while the app is always on (cost_saving = false); with cost
# saving on, its calls would also keep waking the app up.

# Who gets told, and how. Alerts point here instead of naming an address
# each.
resource "azurerm_monitor_action_group" "owner" {
  name                = "ag-${var.name}-owner"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = var.name
  tags                = local.tags

  email_receiver {
    name                    = "owner"
    email_address           = var.budget_alert_email
    use_common_alert_schema = true
  }
}

locals {
  # Each alert: what it watches, when it fires, and what that means
  metric_alerts = {
    app-restarts = {
      scope       = azurerm_container_app.main.id
      namespace   = "Microsoft.App/containerApps"
      metric      = "RestartCount"
      aggregation = "Maximum"
      operator    = "GreaterThan"
      threshold   = 2
      severity    = 1
      description = "The app's container keeps restarting: it crashes, or fails its health checks. Its log in Log Analytics (ContainerAppConsoleLogs_CL) says why."
      dimension   = null
    }
    app-server-errors = {
      scope       = azurerm_container_app.main.id
      namespace   = "Microsoft.App/containerApps"
      metric      = "Requests"
      aggregation = "Total"
      operator    = "GreaterThan"
      threshold   = 5
      severity    = 2
      description = "The app answered more than 5 requests with a server error (5xx) within 15 minutes."
      dimension   = { name = "statusCodeCategory", values = ["5xx"] }
    }
    app-memory = {
      scope       = azurerm_container_app.main.id
      namespace   = "Microsoft.App/containerApps"
      metric      = "MemoryPercentage"
      aggregation = "Average"
      operator    = "GreaterThan"
      threshold   = 90
      severity    = 2
      description = "The app uses more than 90 % of its memory. At 100 % the container is killed and restarted."
      dimension   = null
    }
    database-storage = {
      scope       = azurerm_postgresql_flexible_server.main.id
      namespace   = "Microsoft.DBforPostgreSQL/flexibleServers"
      metric      = "storage_percent"
      aggregation = "Average"
      operator    = "GreaterThan"
      threshold   = 80
      severity    = 2
      description = "The database's disk is more than 80 % full. When it is full, the server stops accepting writes."
      dimension   = null
    }
    database-cpu = {
      scope       = azurerm_postgresql_flexible_server.main.id
      namespace   = "Microsoft.DBforPostgreSQL/flexibleServers"
      metric      = "cpu_percent"
      aggregation = "Average"
      operator    = "GreaterThan"
      threshold   = 80
      severity    = 3
      description = "The database's CPU has been above 80 % for 15 minutes. The B1ms size may run at full speed only in short bursts, so it is about to slow down."
      dimension   = null
    }
  }
}

resource "azurerm_monitor_metric_alert" "main" {
  for_each            = local.metric_alerts
  name                = "alert-${var.name}-${each.key}"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [each.value.scope]
  description         = each.value.description
  severity            = each.value.severity
  # Looks at the last 15 minutes, every 5 minutes
  frequency   = "PT5M"
  window_size = "PT15M"
  tags        = local.tags

  criteria {
    metric_namespace = each.value.namespace
    metric_name      = each.value.metric
    aggregation      = each.value.aggregation
    operator         = each.value.operator
    threshold        = each.value.threshold

    dynamic "dimension" {
      for_each = each.value.dimension == null ? [] : [each.value.dimension]
      content {
        name     = dimension.value.name
        operator = "Include"
        values   = dimension.value.values
      }
    }
  }

  action {
    action_group_id = azurerm_monitor_action_group.owner.id
  }
}

# The test from outside: the same request a visitor's browser sends, from
# two places in Europe. It sees what visitors see, DNS, the certificate and
# Azure's proxy included, which no metric of the app can.

resource "azurerm_application_insights" "main" {
  count               = var.cost_saving ? 0 : 1
  name                = "appi-${var.name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = local.tags
}

resource "azurerm_application_insights_standard_web_test" "health" {
  count                   = var.cost_saving ? 0 : 1
  name                    = "webtest-${var.name}-health"
  resource_group_name     = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  application_insights_id = azurerm_application_insights.main[0].id
  enabled                 = true
  frequency               = 300
  timeout                 = 30
  # Paris and Amsterdam
  geo_locations = ["emea-fr-pra-edge", "emea-nl-ams-azr"]
  tags          = local.tags

  request {
    url = "${local.app_url}/api/health"
  }

  validation_rules {
    expected_status_code = 200
    # Azure renews the certificate by itself; this notices if it ever does
    # not
    ssl_check_enabled           = true
    ssl_cert_remaining_lifetime = 14
  }
}

resource "azurerm_monitor_metric_alert" "health" {
  count               = var.cost_saving ? 0 : 1
  name                = "alert-${var.name}-unreachable"
  resource_group_name = azurerm_resource_group.main.name
  scopes = [
    azurerm_application_insights_standard_web_test.health[0].id,
    azurerm_application_insights.main[0].id,
  ]
  description = "https://${var.domain}/api/health failed from both test locations. Visitors cannot reach the app."
  severity    = 0
  tags        = local.tags

  # Both places at once, so one place's network trouble raises no alarm
  application_insights_web_test_location_availability_criteria {
    web_test_id           = azurerm_application_insights_standard_web_test.health[0].id
    component_id          = azurerm_application_insights.main[0].id
    failed_location_count = 2
  }

  action {
    action_group_id = azurerm_monitor_action_group.owner.id
  }
}
