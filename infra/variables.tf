variable "subscription_id" {
  description = "The Azure subscription everything goes into. Set it in terraform.tfvars, see terraform.tfvars.example."
  type        = string
}

variable "location" {
  description = "The Azure region for everything"
  type        = string
  default     = "francecentral"
}

variable "name" {
  description = "Short name that every resource name is built from"
  type        = string
  default     = "beesaber"
}

variable "image" {
  description = "The app's Docker image, with the tag of the commit it was built from, like ghcr.io/asebwebdev/beesaber:93b9d02"
  type        = string
}

variable "cost_saving" {
  description = "true: the app stops when nobody uses it and starts on the next visit, without the live feed. false: it runs all the time and follows ScoreSaber's live feed."
  type        = bool
  default     = true
}

variable "google_client_id" {
  description = "The OAuth client for sign-in with Google, made for this deployment. Its redirect URI is <app address>/api/auth/callback/google. Its secret goes into the key vault, see infra/README.md."
  type        = string
}

variable "admin_ip_ranges" {
  description = "Public IP addresses allowed to manage the key vault's secrets, like your own. A home connection's address can change; update it here when the portal says access is denied."
  type        = list(string)
  default     = []
}
