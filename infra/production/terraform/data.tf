# account id
data "aws_caller_identity" "current" {}

# data "aws_elasticache_cluster" "TestRedis" {
#   cluster_id = module.elasticache.cluster_id
# }

data "aws_elasticache_replication_group" "GiganotoKiseiElasticache" {
  replication_group_id = module.elasticache.replication_group_id
}
