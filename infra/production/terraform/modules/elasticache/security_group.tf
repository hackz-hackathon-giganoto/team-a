resource "aws_security_group" "this" {
  name        = "${var.cluster_name}-sg"
  description = "Security Group for Elasticahe"
  vpc_id      = var.vpc_id

  tags = {
    Name = "${var.cluster_name}-sg"
  }

  ## Rule
  ingress {
    from_port = 6379
    to_port   = 6379
    protocol  = "tcp"

    cidr_blocks = [
      var.vpc_cidr_block,
    ]

  }

  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"

    cidr_blocks = [
      "0.0.0.0/0",
    ]
  }
}
