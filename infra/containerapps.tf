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

# Signs the session cookies. Whoever knows it could forge a session, so it is
# generated here and handed to the app as a secret.
resource "random_password" "auth_secret" {
  length  = 48
  special = false
}

locals {
  app_name = "ca-${var.name}"
  # Every app in the environment gets an address below its default domain
  app_url = "https://${local.app_name}.${azurerm_container_app_environment.main.default_domain}"
  # The server's public name points into the private DNS zone, so it only
  # resolves inside the network. verify-full encrypts and also checks that
  # the certificate belongs to this server; with "require", postgres.js
  # would encrypt without checking who answers.
  database_url = join("", [
    "postgres://", azurerm_postgresql_flexible_server.main.administrator_login,
    ":", random_password.database.result,
    "@", azurerm_postgresql_flexible_server.main.fqdn,
    ":5432/", azurerm_postgresql_flexible_server_database.beesaber.name,
    "?sslmode=verify-full",
  ])
}

resource "azurerm_container_app" "main" {
  name                         = local.app_name
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  workload_profile_name        = "Consumption"
  # One version of the app at a time. A new image replaces the old one.
  revision_mode = "Single"

  # The app's identity, which it uses to read its secrets from the vault
  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  # Stored encrypted by Azure and handed to the container as environment
  # variables. They never appear in the image. The first two are made by
  # Terraform; the third comes from the vault (keyvault.tf).
  secret {
    name  = "database-url"
    value = local.database_url
  }
  secret {
    name  = "auth-secret"
    value = random_password.auth_secret.result
  }
  # A reference to the vault, not the value: Azure fetches it with the app's
  # identity. Without a version, it follows the newest one, so a new secret
  # in the vault reaches the app without a change here.
  secret {
    name                = "google-client-secret"
    key_vault_secret_id = "${azurerm_key_vault.main.vault_uri}secrets/google-client-secret"
    identity            = azurerm_user_assigned_identity.app.id
  }

  template {
    # The server must run as one instance at most: its rate limits, job
    # queue and live feed live in its memory. With cost saving on, it may
    # also be stopped while nobody uses the app.
    min_replicas = var.cost_saving ? 0 : 1
    max_replicas = 1

    container {
      name   = "app"
      image  = var.image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
      env {
        name        = "AUTH_SECRET"
        secret_name = "auth-secret"
      }
      env {
        name  = "GOOGLE_CLIENT_ID"
        value = var.google_client_id
      }
      env {
        name        = "GOOGLE_CLIENT_SECRET"
        secret_name = "google-client-secret"
      }
      env {
        name  = "APP_URL"
        value = local.app_url
      }
      # Requests reach the app through Azure's proxy, which tells the
      # caller's address in X-Forwarded-For
      env {
        name  = "TRUST_PROXY"
        value = "true"
      }
      # A container that is stopped most of the time has no use for the
      # feed; it catches up on old scores when it starts
      env {
        name  = "LIVE_FEED"
        value = tostring(!var.cost_saving)
      }

      # Starting includes the database migrations, so the first answer may
      # take a while: up to 30 tries, 5 seconds apart
      startup_probe {
        transport               = "HTTP"
        port                    = 5001
        path                    = "/api/health"
        interval_seconds        = 5
        failure_count_threshold = 30
      }
      # Answers, and reaches the database: then it gets requests
      readiness_probe {
        transport        = "HTTP"
        port             = 5001
        path             = "/api/health"
        interval_seconds = 10
      }
      # Stopped answering altogether: then it is restarted
      liveness_probe {
        transport        = "HTTP"
        port             = 5001
        path             = "/api/health"
        interval_seconds = 30
      }
    }
  }

  ingress {
    # Reachable from the internet, over HTTPS only. Azure provides the
    # certificate for the default address.
    external_enabled           = true
    target_port                = 5001
    allow_insecure_connections = false

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  tags = local.tags

  # The app may only start reading once it is allowed to
  depends_on = [azurerm_role_assignment.app_reads_secrets]
}

output "app_url" {
  description = "Where the app is reached"
  value       = local.app_url
}
