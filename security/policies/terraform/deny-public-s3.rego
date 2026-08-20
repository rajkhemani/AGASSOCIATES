# Terraform Public S3 Deny Policy for AGASSOCIATES
# Place in: security/policies/terraform/

package terraform

# =============================================================================
# DENY PUBLIC S3 BUCKETS
# =============================================================================

# Deny S3 buckets with public access
deny[msg] {
    input.type == "aws_s3_bucket"
    input.values.acl
    input.values.acl == "public-read"
    msg := sprintf("S3 bucket '%s' has public-read ACL. Use private ACL.", [input.name])
}

deny[msg] {
    input.type == "aws_s3_bucket"
    input.values.acl
    input.values.acl == "public-read-write"
    msg := sprintf("S3 bucket '%s' has public-read-write ACL. Use private ACL.", [input.name])
}

deny[msg] {
    input.type == "aws_s3_bucket"
    input.values.acl
    input.values.acl == "authenticated-read"
    msg := sprintf("S3 bucket '%s' has authenticated-read ACL. Use private ACL.", [input.name])
}

# Deny S3 bucket policies allowing public access
deny[msg] {
    input.type == "aws_s3_bucket_policy"
    policy := json.unmarshal(input.values.policy)
    statement := policy.Statement[_]
    statement.Effect == "Allow"
    statement.Principal == "*"
    msg := sprintf("S3 bucket policy '%s' allows public access (*). Restrict to specific principals.", [input.name])
}

deny[msg] {
    input.type == "aws_s3_bucket_policy"
    policy := json.unmarshal(input.values.policy)
    statement := policy.Statement[_]
    statement.Effect == "Allow"
    statement.Principal.AWS == "*"
    msg := sprintf("S3 bucket policy '%s' allows public access (Principal.AWS: *).", [input.name])
}

# Deny S3 bucket website configuration (makes bucket public)
deny[msg] {
    input.type == "aws_s3_bucket_website_configuration"
    msg := sprintf("S3 bucket '%s' configured as static website. This makes bucket publicly accessible.", [input.name])
}

# Deny S3 bucket ACLs that grant public access
deny[msg] {
    input.type == "aws_s3_bucket_acl"
    input.values.acl == "public-read"
    msg := sprintf("S3 bucket ACL '%s' grants public-read access.", [input.name])
}

deny[msg] {
    input.type == "aws_s3_bucket_acl"
    input.values.acl == "public-read-write"
    msg := sprintf("S3 bucket ACL '%s' grants public-read-write access.", [input.name])
}

# =============================================================================
# REQUIRE PUBLIC ACCESS BLOCK
# =============================================================================

deny[msg] {
    input.type == "aws_s3_bucket"
    not has_public_access_block(input.name)
    msg := sprintf("S3 bucket '%s' must have Public Access Block configured.", [input.name])
}

# Check if Public Access Block exists (simulated)
has_public_access_block(bucket_name) {
    # In real implementation, check for aws_s3_bucket_public_access_block resource
    # For static analysis, check for annotation/label
    input.metadata.annotations["s3-public-access-block"] == "true"
}

# =============================================================================
# DENY PUBLIC SNAPSHOTS/IMAGES
# =============================================================================

# Deny public EBS snapshots
deny[msg] {
    input.type == "aws_ebs_snapshot"
    input.values.tags["Public"] == "true"
    msg := sprintf("EBS snapshot '%s' is marked as public.", [input.name])
}

# Deny public AMIs
deny[msg] {
    input.type == "aws_ami"
    input.values.public == true
    msg := sprintf("AMI '%s' is public. Use private AMIs only.", [input.name])
}

# Deny public RDS snapshots
deny[msg] {
    input.type == "aws_db_snapshot"
    input.values.public == true
    msg := sprintf("RDS snapshot '%s' is public. Use private snapshots only.", [input.name])
}

# Deny public ElastiCache snapshots
deny[msg] {
    input.type == "aws_elasticache_snapshot"
    input.values.public == true
    msg := sprintf("ElastiCache snapshot '%s' is public. Use private snapshots only.", [input.name])
}

# =============================================================================
# DENY PUBLIC SECURITY GROUP RULES
# =============================================================================

# Deny security group ingress from 0.0.0.0/0 on sensitive ports
sensitive_ports := {
    22,    # SSH
    23,    # Telnet
    3389,  # RDP
    1433,  # SQL Server
    1521,  # Oracle
    3306,  # MySQL
    5432,  # PostgreSQL
    6379,  # Redis
    27017, # MongoDB
    9200,  # Elasticsearch
    8086,  # InfluxDB
}

deny[msg] {
    input.type == "aws_security_group"
    rule := input.values.ingress[_]
    rule.cidr_blocks[_] == "0.0.0.0/0"
    rule.from_port == rule.to_port
    rule.from_port in sensitive_ports
    msg := sprintf("Security group '%s' exposes sensitive port %d to 0.0.0.0/0.", [input.name, rule.from_port])
}

# Deny security group egress to 0.0.0.0/0 (should use NAT)
deny[msg] {
    input.type == "aws_security_group"
    rule := input.values.egress[_]
    rule.cidr_blocks[_] == "0.0.0.0/0"
    rule.from_port == 0
    rule.to_port == 0
    msg := sprintf("Security group '%s' allows all egress to 0.0.0.0/0. Use NAT Gateway for outbound.", [input.name])
}

# =============================================================================
# DENY PUBLIC LOAD BALANCERS (without WAF)
# =============================================================================

deny[msg] {
    input.type == "aws_lb"
    input.values.internal != true
    not has_waf_association(input.name)
    msg := sprintf("Public ALB '%s' must have WAF association.", [input.name])
}

has_waf_association(lb_name) {
    # Check for WAF association resource
    input.metadata.annotations["waf-associated"] == "true"
}

# =============================================================================
# DENY PUBLIC API GATEWAY (without auth)
# =============================================================================

deny[msg] {
    input.type == "aws_api_gateway_rest_api"
    input.values.endpoint_configuration.types[_] == "EDGE"
    not has_authorizer(input.name)
    msg := sprintf("Public API Gateway '%s' must have an authorizer.", [input.name])
}

has_authorizer(api_name) {
    input.metadata.annotations["has-authorizer"] == "true"
}

# =============================================================================
# DENY PUBLIC CLOUDFRONT (without WAF)
# =============================================================================

deny[msg] {
    input.type == "aws_cloudfront_distribution"
    input.values.default_cache_behavior.forwarded_values.query_string != false
    not has_waf_association(input.name)
    msg := sprintf("CloudFront distribution '%s' must have WAF association.", [input.name])
}

# =============================================================================
# DENY PUBLIC DATABASE ENDPOINTS
# =============================================================================

deny[msg] {
    input.type == "aws_db_instance"
    input.values.publicly_accessible == true
    msg := sprintf("RDS instance '%s' is publicly accessible. Set publicly_accessible = false.", [input.name])
}

deny[msg] {
    input.type == "aws_elasticache_cluster"
    input.values.engine == "redis"
    input.values.port == 6379
    # Check if security group allows 0.0.0.0/0
    # This is a simplified check
    msg := sprintf("ElastiCache cluster '%s' should not be publicly accessible.", [input.name])
}

# =============================================================================
# DENY PUBLIC KUBERNETES API
# =============================================================================

deny[msg] {
    input.type == "aws_eks_cluster"
    input.values.vpc_config.public_access_cidrs[_] == "0.0.0.0/0"
    msg := sprintf("EKS cluster '%s' allows public access to Kubernetes API. Restrict to specific CIDRs.", [input.name])
}

# =============================================================================
# DENY PUBLIC ECS SERVICES
# =============================================================================

deny[msg] {
    input.type == "aws_ecs_service"
    input.values.launch_type == "FARGATE"
    input.values.network_configuration.assign_public_ip == true
    msg := sprintf("ECS Fargate service '%s' assigns public IP. Use private subnets with NAT.", [input.name])
}

# =============================================================================
# AGGREGATE PUBLIC RESOURCE CHECK
# =============================================================================

# Count public resources
public_resources[count] {
    resources := find_public_resources()
    count := length(resources)
}

find_public_resources() = resources {
    resources := []
    # This would be implemented with actual data queries
    resources
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# Helper to check if a string contains a pattern
contains(haystack, needle) {
    regex := sprintf(".*%s.*", [needle])
    re_match(regex, haystack)
}

startswith(str, prefix) {
    substr(str, 0, count(prefix)) == prefix
}