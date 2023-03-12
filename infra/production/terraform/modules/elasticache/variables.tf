variable "vpc_id" {
  type = string
}

variable "vpc_cidr_block" {
  type = string
}

variable "cluster_name" {
  type    = string
  default = "test-redis"
}

variable "number_cache_clusters" {
  type    = number
  default = 2
}

variable "engine" {
  type    = string
  default = "redis"
}

variable "engine_version" {
  type    = string
  default = "5.0.6"
}

variable "node_type" {
  type    = string
  default = "cache.m5.large"
}

variable "family" {
  type    = string
  default = "redis5.0"
}

variable "port" {
  type    = number
  default = 6379
}

variable "parameter_group_name" {
  type    = string
  default = "default.redis5.0"
}

variable "automatic_failover_enabled" {
  type    = bool
  default = true
}

variable "multi_az_enabled" {
  type    = bool
  default = true
}

variable "snapshot_window" {
  type    = string
  default = "17:00-18:00"
}

variable "snapshot_retention_limit" {
  type    = number
  default = 2
}

variable "maintenance_window" {
  type    = string
  default = "Sat:18:00-Sat:19:00"
}

variable "transit_encryption_enabled" {
  type    = bool
  default = false
}

variable "at_rest_encryption_enabled" {
  type    = bool
  default = false
}

variable "apply_immediately" {
  type    = bool
  default = true
}

variable "subnet_ids" {
  type = list(string)
}
