resource "aws_ecr_repository" "GiganotoKiseiInternalApiRepository" {
  encryption_configuration {
    encryption_type = "KMS"
  }

  image_scanning_configuration {
    scan_on_push = "true"
  }

  image_tag_mutability = "MUTABLE"
  name                 = "giganoto-kisei-internal-api"

  tags = {
    Name  = "giganoto-kisei-internal-api-repository"
    Group = "test"
  }

  tags_all = {
    Name  = "giganoto-kisei-internal-api-repository"
    Group = "test"
  }
}

resource "aws_ecr_repository" "GiganotoKiseiFastApiRepository" {
  encryption_configuration {
    encryption_type = "KMS"
  }

  image_scanning_configuration {
    scan_on_push = "true"
  }

  image_tag_mutability = "MUTABLE"
  name                 = "giganoto-kisei-fastapi"

  tags = {
    Name  = "giganoto-kisei-fastapi-repository"
    Group = "test"
  }

  tags_all = {
    Name  = "giganoto-kisei-fastapi-repository"
    Group = "test"
  }
}
