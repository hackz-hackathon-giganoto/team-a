variable "CERTIFICATE_ARN" {
  type        = string
  description = "SSL Certificate arn for ALB"
}

## prefix
variable "prefix" {
  default = "giganoto-kisei"
}

## environment
variable "env" {
  default = "test"
}
