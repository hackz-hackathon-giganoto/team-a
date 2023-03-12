resource "aws_elasticache_replication_group" "this" {
  replication_group_id          = var.cluster_name
  replication_group_description = var.cluster_name
  engine                        = var.engine
  engine_version                = var.engine_version
  node_type                     = var.node_type
  number_cache_clusters         = var.number_cache_clusters
  parameter_group_name          = var.parameter_group_name
  port                          = var.port
  subnet_group_name             = aws_elasticache_subnet_group.this.name

  security_group_ids = [aws_security_group.this.id, ]

  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = var.snapshot_window

  maintenance_window = var.maintenance_window

  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled

  transit_encryption_enabled = var.transit_encryption_enabled
  at_rest_encryption_enabled = var.at_rest_encryption_enabled

  apply_immediately = var.apply_immediately
}
