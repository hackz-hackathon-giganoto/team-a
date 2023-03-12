output "security_group_id" {
  value = aws_security_group.this.id
}

output "primary_endpoint_address" {
  value = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "reader_endpoint_address" {
  value = aws_elasticache_replication_group.this.reader_endpoint_address
}

output "replication_group_id" {
  value = aws_elasticache_replication_group.this.id
}
