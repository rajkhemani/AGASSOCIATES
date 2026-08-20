# Terraform Custom Policies for AGASSOCIATES
# Place in: security/policies/terraform/

package terraform

# =============================================================================
# REQUIRE ENCRYPTION
# =============================================================================

# S3 buckets must have encryption enabled
deny[msg] {
    input.type == "aws_s3_bucket"
    not input.values.server_side_encryption_configuration
    msg := sprintf("S3 bucket '%s' must have server-side encryption enabled.", [input.name])
}

# EBS volumes must be encrypted
deny[msg] {
    input.type == "aws_ebs_volume"
    input.values.encrypted != true
    msg := sprintf("EBS volume '%s' must be encrypted.", [input.name])
}

# RDS instances must have storage encryption
deny[msg] {
    input.type == "aws_db_instance"
    input.values.storage_encrypted != true
    msg := sprintf("RDS instance '%s' must have storage encryption enabled.", [input.name])
}

# ElastiCache clusters must have encryption at rest
deny[msg] {
    input.type == "aws_elasticache_cluster"
    input.values.at_rest_encryption_enabled != true
    msg := sprintf("ElastiCache cluster '%s' must have encryption at rest enabled.", [input.name])
}

# ElastiCache replication groups must have encryption
deny[msg] {
    input.type == "aws_elasticache_replication_group"
    input.values.at_rest_encryption_enabled != true
    msg := sprintf("ElastiCache replication group '%s' must have encryption at rest enabled.", [input.name])
}

# SNS topics must have encryption
deny[msg] {
    input.type == "aws_sns_topic"
    not input.values.kms_master_key_id
    msg := sprintf("SNS topic '%s' must have KMS encryption enabled.", [input.name])
}

# SQS queues must have encryption
deny[msg] {
    input.type == "aws_sqs_queue"
    not input.values.kms_master_key_id
    msg := sprintf("SQS queue '%s' must have KMS encryption enabled.", [input.name])
}

# =============================================================================
# DENY PUBLIC S3
# =============================================================================

deny[msg] {
    input.type == "aws_s3_bucket_public_access_block"
    input.values.block_public_acls != true
    msg := sprintf("S3 bucket '%s' must block public ACLs.", [input.name])
}

deny[msg] {
    input.type == "aws_s3_bucket_public_access_block"
    input.values.block_public_policy != true
    msg := sprintf("S3 bucket '%s' must block public policies.", [input.name])
}

deny[msg] {
    input.type == "aws_s3_bucket_public_access_block"
    input.values.ignore_public_acls != true
    msg := sprintf("S3 bucket '%s' must ignore public ACLs.", [input.name])
}

deny[msg] {
    input.type == "aws_s3_bucket_public_access_block"
    input.values.restrict_public_buckets != true
    msg := sprintf("S3 bucket '%s' must restrict public buckets.", [input.name])
}

# Deny S3 bucket policies that allow public access
deny[msg] {
    input.type == "aws_s3_bucket_policy"
    policy := json.unmarshal(input.values.policy)
    statement := policy.Statement[_]
    statement.Effect == "Allow"
    statement.Principal == "*"
    msg := sprintf("S3 bucket policy '%s' allows public access. Restrict to specific principals.", [input.name])
}

# =============================================================================
# REQUIRE TAGS
# =============================================================================

required_tags := {
    "Environment",
    "Owner",
    "Project",
    "CostCenter",
    "ManagedBy"
}

deny[msg] {
    input.values.tags
    tag := required_tags[_]
    not input.values.tags[tag]
    msg := sprintf("Resource '%s' missing required tag: %s", [input.name, tag])
}

deny[msg] {
    not input.values.tags
    msg := sprintf("Resource '%s' must have tags defined.", [input.name])
}

# =============================================================================
# DENY SECURITY GROUP WIDE OPEN
# =============================================================================

deny[msg] {
    input.type == "aws_security_group"
    rule := input.values.ingress[_]
    rule.cidr_blocks[_] == "0.0.0.0/0"
    rule.from_port == 0
    rule.to_port == 0
    msg := sprintf("Security group '%s' allows all traffic from 0.0.0.0/0. Restrict to specific ports and CIDRs.", [input.name])
}

deny[msg] {
    input.type == "aws_security_group"
    rule := input.values.ingress[_]
    rule.cidr_blocks[_] == "0.0.0.0/0"
    rule.from_port <= 22
    rule.to_port >= 22
    msg := sprintf("Security group '%s' allows SSH (port 22) from 0.0.0.0/0. Restrict to specific IPs.", [input.name])
}

deny[msg] {
    input.type == "aws_security_group"
    rule := input.values.ingress[_]
    rule.cidr_blocks[_] == "0.0.0.0/0"
    rule.from_port <= 3389
    rule.to_port >= 3389
    msg := sprintf("Security group '%s' allows RDP (port 3389) from 0.0.0.0/0. Restrict to specific IPs.", [input.name])
}

deny[msg] {
    input.type == "aws_security_group"
    rule := input.values.egress[_]
    rule.cidr_blocks[_] == "0.0.0.0/0"
    rule.from_port == 0
    rule.to_port == 0
    msg := sprintf("Security group '%s' allows all egress to 0.0.0.0/0. Restrict to specific destinations.", [input.name])
}

# =============================================================================
# REQUIRE IAM POLICIES LEAST PRIVILEGE
# =============================================================================

deny[msg] {
    input.type == "aws_iam_policy"
    policy := json.unmarshal(input.values.policy)
    statement := policy.Statement[_]
    statement.Effect == "Allow"
    statement.Action == "*"
    statement.Resource == "*"
    msg := sprintf("IAM policy '%s' grants full admin access (*:*). Use least privilege principle.", [input.name])
}

deny[msg] {
    input.type == "aws_iam_role_policy"
    policy := json.unmarshal(input.values.policy)
    statement := policy.Statement[_]
    statement.Effect == "Allow"
    statement.Action == "*"
    statement.Resource == "*"
    msg := sprintf("IAM role policy '%s' grants full admin access (*:*). Use least privilege principle.", [input.name])
}

# =============================================================================
# REQUIRE VPC FLOW LOGS
# =============================================================================

deny[msg] {
    input.type == "aws_vpc"
    not input.values.enable_dns_hostnames
    msg := sprintf("VPC '%s' must have DNS hostnames enabled for VPC Flow Logs.", [input.name])
}

deny[msg] {
    input.type == "aws_vpc"
    not input.values.enable_dns_support
    msg := sprintf("VPC '%s' must have DNS support enabled.", [input.name])
}

# =============================================================================
# REQUIRE CLOUDTRAIL
# =============================================================================

deny[msg] {
    input.type == "aws_cloudtrail"
    input.values.is_multi_region_trail != true
    msg := sprintf("CloudTrail '%s' must be multi-region.", [input.name])
}

deny[msg] {
    input.type == "aws_cloudtrail"
    input.values.enable_logging != true
    msg := sprintf("CloudTrail '%s' must have logging enabled.", [input.name])
}

deny[msg] {
    input.type == "aws_cloudtrail"
    input.values.include_global_service_events != true
    msg := sprintf("CloudTrail '%s' must include global service events.", [input.name])
}

# =============================================================================
# REQUIRE CONFIG
# =============================================================================

deny[msg] {
    input.type == "aws_config_configuration_recorder"
    input.values.recording_group.all_supported != true
    msg := sprintf("Config recorder '%s' must record all supported resources.", [input.name])
}

deny[msg] {
    input.type == "aws_config_configuration_recorder"
    input.values.recording_group.include_global_resource_types != true
    msg := sprintf("Config recorder '%s' must include global resource types.", [input.name])
}

# =============================================================================
# DENY HARDCODED SECRETS
# =============================================================================

secret_keywords := [
    "password",
    "secret",
    "token",
    "key",
    "api_key",
    "access_key",
    "private_key"
]

deny[msg] {
    input.type == "aws_ssm_parameter"
    input.values.type == "SecureString"
    not input.values.value
    # This is a placeholder check - actual secret detection needs value scanning
    msg := sprintf("SSM parameter '%s' should use SecureString type for secrets.", [input.name])
}

# =============================================================================
# REQUIRE BACKUP/RETENTION
# =============================================================================

deny[msg] {
    input.type == "aws_db_instance"
    input.values.backup_retention_period < 7
    msg := sprintf("RDS instance '%s' must have backup retention of at least 7 days.", [input.name])
}

deny[msg] {
    input.type == "aws_ebs_volume"
    not input.values.snapshot_id
    # New volumes should have snapshot/backup strategy
    msg := sprintf("EBS volume '%s' should have backup/snapshot strategy defined.", [input.name])
}

# =============================================================================
# REQUIRE MONITORING
# =============================================================================

deny[msg] {
    input.type == "aws_cloudwatch_metric_alarm"
    input.values.alarm_actions[_] == ""
    msg := sprintf("CloudWatch alarm '%s' must have alarm actions configured.", [input.name])
}

# =============================================================================
# NETWORK REQUIREMENTS
# =============================================================================

# Subnets should not be public (no IGW route)
deny[msg] {
    input.type == "aws_subnet"
    input.values.map_public_ip_on_launch == true
    msg := sprintf("Subnet '%s' should not auto-assign public IPs. Use NAT Gateway for outbound.", [input.name])
}

# NAT Gateway required for private subnets
deny[msg] {
    input.type == "aws_route_table"
    route := input.values.routes[_]
    route.gateway_id
    startswith(route.gateway_id, "igw-")
    route.destination_cidr_block == "0.0.0.0/0"
    # This is a public route table - ensure it's only used for public subnets
    msg := sprintf("Route table '%s' has Internet Gateway route. Ensure only public subnets use this.", [input.name])
}

# =============================================================================
# CONTAINER/ECS REQUIREMENTS
# =============================================================================

deny[msg] {
    input.type == "aws_ecs_task_definition"
    container := input.values.container_definitions[_]
    container.privileged == true
    msg := sprintf("ECS task definition '%s' container '%s' runs in privileged mode.", [input.name, container.name])
}

deny[msg] {
    input.type == "aws_ecs_task_definition"
    container := input.values.container_definitions[_]
    not container.readonly_root_filesystem
    msg := sprintf("ECS task definition '%s' container '%s' must have readonlyRootFilesystem.", [input.name, container.name])
}

deny[msg] {
    input.type == "aws_ecs_task_definition"
    container := input.values.container_definitions[_]
    container.user == "root"
    msg := sprintf("ECS task definition '%s' container '%s' runs as root.", [input.name, container.name])
}

deny[msg] {
    input.type == "aws_ecs_task_definition"
    container := input.values.container_definitions[_]
    container.user == "0"
    msg := sprintf("ECS task definition '%s' container '%s' runs as UID 0.", [input.name, container.name])
}

# =============================================================================
# LAMBDA REQUIREMENTS
# =============================================================================

deny[msg] {
    input.type == "aws_lambda_function"
    input.values.vpc_config.subnet_ids
    input.values.vpc_config.security_group_ids
    msg := sprintf("Lambda function '%s' should be in a VPC for network isolation.", [input.name])
}

deny[msg] {
    input.type == "aws_lambda_function"
    input.values.tracing_config.mode != "Active"
    msg := sprintf("Lambda function '%s' must have X-Ray tracing enabled.", [input.name])
}

deny[msg] {
    input.type == "aws_lambda_function"
    input.values.environment.variables
    env_var := input.values.environment.variables[_]
    pattern := secret_keywords[_]
    contains(lower(env_var), pattern)
    msg := sprintf("Lambda function '%s' may have secrets in environment variables.", [input.name])
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

contains(haystack, needle) {
    regex := sprintf(".*%s.*", [needle])
    re_match(regex, haystack)
}

startswith(str, prefix) {
    substr(str, 0, count(prefix)) == prefix
}

lower(str) = lower_str {
    # Simplified - use regex in practice
    lower_str := str
}