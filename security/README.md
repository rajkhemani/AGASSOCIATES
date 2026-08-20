# AGASSOCIATES Security Configuration

This directory contains all security hardening configurations for the AGASSOCIATES stack, designed for Coolify deployment.

## Directory Structure

```
security/
├── README.md                    # This file
├── mtls-config.yaml            # mTLS configuration for service-to-service communication
├── network-policies.yaml       # Kubernetes NetworkPolicies for Coolify services
├── trivy-config.yaml           # Trivy vulnerability scanning configuration
├── secrets-config.yaml         # Secret rotation configuration
├── risk-acceptance.md          # Risk acceptance register
├── email-template.html         # Security alert email template
└── policies/                   # Custom OPA/Rego policies (optional)
    ├── kubernetes/
    │   ├── deny-privileged.rego
    │   ├── require-resource-limits.rego
    │   └── require-network-policies.rego
    ├── docker/
    │   ├── deny-root-user.rego
    │   └── require-healthcheck.rego
    └── terraform/
        ├── require-encryption.rego
        └── deny-public-s3.rego
```

## Quick Start

### 1. Caddy WAF with ModSecurity

The WAF configuration is in the root directory:

```bash
# Main Caddyfile with ModSecurity
Caddyfile.waf

# Deploy with Coolify
# 1. Add Caddyfile.waf to your Coolify application as the Caddyfile
# 2. Ensure ModSecurity module is enabled in your Caddy build
# 3. OWASP CRS rules will be automatically downloaded
```

### 2. mTLS Configuration

Apply the mTLS configuration:

```bash
# For Kubernetes (Coolify on K8s)
kubectl apply -f security/mtls-config.yaml

# For Docker Compose (Coolify standalone)
# Configure each service with the certificate paths from mtls-config.yaml
```

### 3. Network Policies

Apply Kubernetes NetworkPolicies:

```bash
# Create namespace if not exists
kubectl create namespace agassociates

# Apply network policies
kubectl apply -f security/network-policies.yaml

# Verify
kubectl get networkpolicies -n agassociates
```

### 4. Secret Rotation

Set up automated secret rotation:

```bash
# 1. Copy secrets-config.yaml to /etc/agassociates/secrets/
sudo mkdir -p /etc/agassociates/secrets
sudo cp security/secrets-config.yaml /etc/agassociates/secrets/

# 2. Set environment variables
export COOLIFY_API_URL="https://coolify.example.com"
export COOLIFY_API_TOKEN="your-token"
export COOLIFY_PROJECT_UUID="your-project-uuid"

# 3. Test rotation (dry run)
python3 scripts/rotate_secrets.py --dry-run --check-only

# 4. Run actual rotation
python3 scripts/rotate_secrets.py --force --notify

# 5. Set up cron for daily checks
# 0 2 * * * /usr/bin/python3 /path/to/scripts/rotate_secrets.py --notify
```

### 5. Vulnerability Scanning

Run Trivy scans locally:

```bash
# Install Trivy
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v0.54.0

# Scan container images
trivy image --config security/trivy-config.yaml ghcr.io/rajkhemani/ag-ai-backend:latest

# Scan filesystem
trivy fs --config security/trivy-config.yaml ag-associates-ai/backend

# Scan Kubernetes
trivy k8s --config security/trivy-config.yaml --namespace agassociates

# Generate SBOM
trivy image --format cyclonedx --output sbom.json ghcr.io/rajkhemani/ag-ai-backend:latest
```

### 6. CI/CD Integration

The GitHub Actions workflow is at `.github/workflows/security-scan.yml`. It runs automatically on:
- Push to main/develop
- Pull requests
- Daily schedule (2 AM UTC)
- Manual trigger

## Configuration Details

### ModSecurity WAF (Caddyfile.waf)

**Features:**
- OWASP CRS 4.x rule set
- Custom rules for AGASSOCIATES stack
- Rate limiting (100 req/5min per IP)
- SQL injection protection
- XSS protection
- Path traversal blocking
- Command injection blocking
- Bot detection
- Geo-blocking (configurable)
- Security headers (CSP, HSTS, etc.)
- TLS 1.2+ with modern ciphers

**Custom Rules:**
- Blocks known malicious User-Agents
- Blocks suspicious paths (wp-admin, phpmyadmin, etc.)
- Protects internal endpoints
- Requires API keys for /api/* endpoints
- Limits upload sizes

### mTLS Configuration (mtls-config.yaml)

**Features:**
- Certificate Authority hierarchy (Root + Intermediate)
- 90-day certificate rotation
- Per-service certificate configuration
- STRICT mTLS mode
- TLS 1.3 with modern ciphers
- OCSP stapling
- Automated renewal
- Coolify integration

**Services Configured:**
- ag-ai-backend (ports 8000/8001)
- ag-ai-dashboard (ports 3000/3443)
- ag-platform (ports 3001/3444)
- intake-api (ports 3000/3445)
- coordinator (ports 3005/3446)
- postgres (ports 5432/5433)
- redis (ports 6379/6380)
- n8n (ports 5678/5679)
- caddy (ports 80/443/8443)

### Network Policies (network-policies.yaml)

**Policies Included:**
- Default deny all (ingress + egress)
- DNS resolution for all pods
- Caddy ingress/egress (Internet → Backends)
- Service-specific policies for each microservice
- Database access (PostgreSQL, Redis)
- Monitoring access (Prometheus, Grafana)
- Management/backup access
- Coolify proxy integration
- Emergency break-glass policy (commented)

**Default Deny Model:**
All traffic is blocked unless explicitly allowed by a policy.

### Trivy Configuration (trivy-config.yaml)

**Scanners Enabled:**
- Vulnerability (OS + Library)
- Misconfiguration (Kubernetes, Docker, Terraform)
- Secret detection
- License compliance
- SBOM generation (CycloneDX + SPDX)

**Integrations:**
- GitHub Code Scanning (SARIF)
- GitHub Dependency Graph (SBOM)
- Coolify deployment gates
- Slack/Teams/Email notifications

**Severity Thresholds:**
- Block deployment: CRITICAL, HIGH
- Warn: MEDIUM
- Info: LOW

### Secret Rotation (secrets-config.yaml + rotate_secrets.py)

**Secrets Managed:**
- Database passwords (PostgreSQL, Redis)
- JWT secrets
- Encryption keys
- Webhook secrets
- API keys (Groq, Gemini, Telegram, Twilio, etc.)
- SMTP credentials
- Supabase keys
- Coolify API token
- mTLS certificates

**Rotation Schedule:**
- Check daily at 2 AM UTC
- Rotate every 90 days
- Force rotation quarterly
- Notifications via Slack/Teams/Email

## Coolify Integration

### Environment Variables Required

Add these to your Coolify project environment:

```bash
# Coolify API (for secret rotation)
COOLIFY_API_URL=https://coolify.example.com
COOLIFY_API_TOKEN=your-api-token
COOLIFY_PROJECT_UUID=your-project-uuid

# Notification webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...

# Email (for alerts)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=alerts@example.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=security@agassociates.com
SECURITY_ALERT_EMAIL=security-team@agassociates.com

# Kubernetes (for K8s scanning)
KUBECONFIG=base64-encoded-kubeconfig
```

### Coolify Application Labels

Add these labels to each Coolify application:

```yaml
# Caddy
labels:
  - "app=caddy"
  - "coolify.io/proxy=true"

# ag-ai-backend
labels:
  - "app=ag-ai-backend"

# ag-ai-dashboard
labels:
  - "app=ag-ai-dashboard"

# ag-platform
labels:
  - "app=ag-platform"

# intake-api
labels:
  - "app=intake-api"

# coordinator
labels:
  - "app=coordinator"

# postgres
labels:
  - "app=postgres"

# redis
labels:
  - "app=redis"

# n8n
labels:
  - "app=n8n"
```

### Deployment Gates

The security-scan workflow can be used as a deployment gate:

```yaml
# In your deploy workflow
jobs:
  security-check:
    uses: ./.github/workflows/security-scan.yml
    with:
      scan_type: 'image'
      target_images: '${{ needs.build.outputs.images }}'
    secrets: inherit

  deploy:
    needs: [build, security-check]
    if: needs.security-check.result == 'success'
    # ... deploy steps
```

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Certificate Expiration**: Alert at 90, 60, 30, 14, 7, 3, 1 days
2. **Secret Rotation**: Alert if rotation fails or is overdue
3. **Vulnerability Count**: Track CRITICAL/HIGH/MEDIUM over time
4. **Network Policy Violations**: Monitor denied connections
5. **WAF Blocked Requests**: Track attack attempts

### Recommended Alerting Rules

```yaml
# Prometheus alerts
groups:
  - name: agassociates-security
    rules:
      - alert: CertificateExpiringSoon
        expr: certificate_expiration_days < 30
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Certificate expiring in {{ $value }} days"

      - alert: SecretRotationOverdue
        expr: secret_rotation_overdue == 1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Secret rotation overdue for {{ $labels.secret_name }}"

      - alert: CriticalVulnerabilityDetected
        expr: trivy_critical_vulnerabilities > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "{{ $value }} critical vulnerabilities in {{ $labels.image }}"

      - alert: WAFHighBlockRate
        expr: rate(caddy_waf_blocked_total[5m]) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High WAF block rate detected"
```

## Compliance Mapping

| Control | Implementation | Status |
|---------|---------------|--------|
| **NIST 800-53 SC-8** | mTLS for all service communication | ✅ Implemented |
| **NIST 800-53 SC-7** | Network segmentation via NetworkPolicies | ✅ Implemented |
| **NIST 800-53 SI-3** | WAF with OWASP CRS | ✅ Implemented |
| **NIST 800-53 CM-8** | SBOM generation for all images | ✅ Implemented |
| **NIST 800-53 SI-2** | Automated vulnerability scanning | ✅ Implemented |
| **PCI DSS 6.5.6** | Injection protection (SQL, XSS, CMD) | ✅ Implemented |
| **PCI DSS 8.2.3** | Secret rotation (90 days) | ✅ Implemented |
| **ISO 27001 A.12.6** | Technical vulnerability management | ✅ Implemented |
| **CIS Kubernetes 1.7** | Network policies, RBAC, pod security | ✅ Implemented |
| **CIS Docker 1.2** | Image scanning, read-only fs, non-root | ✅ Implemented |

## Troubleshooting

### Common Issues

**ModSecurity blocking legitimate traffic:**
```bash
# Check audit logs
tail -f /var/log/caddy/modsec_audit.log

# Add rule exclusion in Caddyfile.waf
SecRuleRemoveById 942100
```

**mTLS connection failures:**
```bash
# Verify certificates
openssl verify -CAfile ca/root-ca.pem certs/service.pem

# Check certificate expiration
openssl x509 -in certs/service.pem -noout -dates
```

**Network policy not working:**
```bash
# Check policy status
kubectl get networkpolicies -n agassociates -o wide

# Test connectivity
kubectl run test-pod --image=busybox -it --rm -- nc -zv target-service 8001
```

**Secret rotation failing:**
```bash
# Check Coolify API connectivity
curl -H "Authorization: Bearer $COOLIFY_API_TOKEN" $COOLIFY_API_URL/api/v1/projects/$COOLIFY_PROJECT_UUID/applications

# Run with debug
python3 scripts/rotate_secrets.py --verbose --dry-run
```

**Trivy scan failures:**
```bash
# Update vulnerability database
trivy image --download-db-only

# Clear cache
trivy image --clear-cache

# Debug scan
trivy image --debug ghcr.io/rajkhemani/ag-ai-backend:latest
```

## Maintenance

### Weekly
- [ ] Review Trivy scan results in GitHub Security tab
- [ ] Check secret rotation logs
- [ ] Verify certificate expiration dates
- [ ] Review WAF blocked requests

### Monthly
- [ ] Update Trivy vulnerability database
- [ ] Review and update NetworkPolicies if services changed
- [ ] Rotate any manually managed secrets
- [ ] Update OWASP CRS rules if new version available

### Quarterly
- [ ] Review risk acceptance register
- [ ] Conduct penetration testing
- [ ] Review and update security configurations
- [ ] Update base images in Dockerfiles
- [ ] Review compliance mappings

### Annually
- [ ] Rotate Root CA certificate (10-year lifecycle)
- [ ] Rotate Intermediate CA certificate (5-year lifecycle)
- [ ] Full security architecture review
- [ ] Update incident response procedures
- [ ] Conduct security training for team

## References

- [OWASP CRS Rules](https://coreruleset.org/)
- [Caddy ModSecurity Module](https://caddyserver.com/docs/modules/http.handlers.modsecurity)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Kubernetes NetworkPolicies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- [Coolify Documentation](https://coolify.io/docs)
- [NIST 800-53 Controls](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)

## Support

For security issues or questions:
- Create an issue in the repository with the `security` label
- Email: security@agassociates.com
- For urgent issues: PagerDuty / on-call rotation