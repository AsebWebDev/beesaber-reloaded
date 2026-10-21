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
