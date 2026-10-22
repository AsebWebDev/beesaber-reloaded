# An email when the subscription's costs this month reach half the budget,
# all of it, or are on course to. It only warns; nothing is stopped. It is
# there for the day the cost-saving mode is switched off and forgotten.

data "azurerm_subscription" "current" {}

resource "azurerm_consumption_budget_subscription" "monthly" {
  name            = "budget-${var.name}"
  subscription_id = data.azurerm_subscription.current.id
  amount          = var.budget_amount
  time_grain      = "Monthly"

  time_period {
    # Budgets start on the first day of a month; this is the month the
    # subscription was set up
    start_date = "2026-10-01T00:00:00Z"
  }

  notification {
    operator       = "GreaterThanOrEqualTo"
    threshold      = 50
    threshold_type = "Actual"
    contact_emails = [var.budget_alert_email]
  }

  notification {
    operator       = "GreaterThanOrEqualTo"
    threshold      = 100
    threshold_type = "Actual"
    contact_emails = [var.budget_alert_email]
  }

  # Azure's estimate for the end of the month, which warns days before the
  # actual costs get there
  notification {
    operator       = "GreaterThanOrEqualTo"
    threshold      = 100
    threshold_type = "Forecasted"
    contact_emails = [var.budget_alert_email]
  }
}
