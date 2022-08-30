locals {
  application_name = "skulder"
  region           = "eu-north-1"
  account_id       = "852264810958"
}

provider "aws" {
  region = local.region

}



module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "0.10.0"

  name          = "${local.application_name}-http"
  description   = "Skulder HTTP API Gateway"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_headers = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods = ["*"]
    allow_origins = ["*"]
  }

  # Custom domain
  domain_name                 = "skulder.stafre.se"
  domain_name_certificate_arn = "arn:aws:acm:${local.region}:${local.account_id}:certificate/a73c2e80-7cfa-43f0-a57d-6f2557d3c2ae"

  default_stage_access_log_destination_arn = aws_cloudwatch_log_group.logs.arn
  default_stage_access_log_format          = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId $context.integrationErrorMessage"


  integrations = {
    "POST /" = {
      lambda_arn             = module.lambda_entry_writer.lambda_function_arn
      payload_format_version = "2.0"
      timeout_milliseconds   = 12000
    }
     "GET /" = {
      lambda_arn             = module.lambda_entries_getter.lambda_function_arn
      payload_format_version = "2.0"
      timeout_milliseconds   = 12000
    }
  }

  tags = {
    Name        = "http-apigateway"
    Application = "${local.application_name}"
  }
}

module "records" {
  source  = "terraform-aws-modules/route53/aws//modules/records"
  version = "~> 2.0"

  zone_name = "stafre.se"

  records = [
    {
      name    = "skulder"
      type    = "CNAME"
      records = ["${module.api_gateway.this_apigatewayv2_domain_name_target_domain_name}"]
      zone_id = "Z0558704PABIEWFOHFEE"
      ttl     = 5
    },
  ]
}


module "lambda_entry_writer" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "entry-writer"
  description   = "Lambda handler"
  handler       = "index.handler"
  runtime       = "nodejs16.x"

  source_path = "../src/entry-writer"
  publish     = true

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "arn:aws:execute-api:${local.region}:${local.account_id}:bj16nmfrqb/*/*/*"
    }
  }

  attach_policy = true
  policy        = "arn:aws:iam::852264810958:policy/skulder-dynamodb"

  tags = {
    Name        = "skulder"
    Application = "${local.application_name}"
  }
}

module "lambda_entries_getter" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "entries-getter"
  description   = "Lambda handler"
  handler       = "index.handler"
  runtime       = "nodejs16.x"

  source_path = "../src/entries-getter"
  publish     = true

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "arn:aws:execute-api:${local.region}:${local.account_id}:bj16nmfrqb/*/*/*"
    }
  }

  attach_policy = true
  policy        = "arn:aws:iam::852264810958:policy/skulder-dynamodb"

  tags = {
    Name        = "skulder"
    Application = "${local.application_name}"
  }
}

resource "aws_cloudwatch_log_group" "logs" {
  name = local.application_name
}

module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name     = "${local.application_name}-debts"
  hash_key = "id"

  attributes = [
    {
      name = "id"
      type = "S"
    }
  ]
}

module "iam_policy" {
  source = "terraform-aws-modules/iam/aws//modules/iam-policy"

  name        = "${local.application_name}-dynamodb"
  path        = "/"
  description = "DynamoDB access"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement":[{
    "Effect": "Allow",
    "Action": [
     "dynamodb:BatchGetItem",
     "dynamodb:GetItem",
     "dynamodb:Query",
     "dynamodb:Scan",
     "dynamodb:BatchWriteItem",
     "dynamodb:PutItem",
     "dynamodb:UpdateItem"
    ],
    "Resource": "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${local.application_name}-debts"
   }
  ]
}
EOF
}
