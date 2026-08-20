#!/usr/bin/env python3
"""
Secret Rotation Script for AGASSOCIATES Stack
Rotates secrets every 90 days via Coolify API
Compatible with Coolify deployment
"""

import os
import sys
import json
import time
import logging
import argparse
import hashlib
import secrets
import string
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# Configuration
@dataclass
class CoolifyConfig:
    api_url: str
    api_token: str
    project_uuid: str
    verify_ssl: bool = True
    timeout: int = 30


@dataclass
class SecretConfig:
    name: str
    description: str
    generator: str  # 'random', 'uuid', 'jwt', 'rsa', 'ecdsa'
    length: int = 64
    rotation_days: int = 90
    services: List[str] = None
    env_files: List[str] = None
    k8s_secrets: List[str] = None


@dataclass
class RotationResult:
    secret_name: str
    success: bool
    old_value_hash: str
    new_value_hash: str
    rotated_at: str
    error: Optional[str] = None
    affected_services: List[str] = None


# Secret generators
def generate_random_string(length: int = 64, alphabet: str = None) -> str:
    """Generate a cryptographically secure random string."""
    if alphabet is None:
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*_-+=?"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_uuid() -> str:
    """Generate a UUID v4."""
    import uuid
    return str(uuid.uuid4())


def generate_jwt_secret() -> str:
    """Generate a JWT secret (base64url encoded)."""
    import base64
    return base64.urlsafe_b64encode(secrets.token_bytes(64)).decode('ascii').rstrip('=')


def generate_rsa_key_pair(key_size: int = 2048) -> Dict[str, str]:
    """Generate RSA key pair."""
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization

    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
    )

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

    return {
        'private_key': private_pem,
        'public_key': public_pem
    }


def generate_ecdsa_key_pair(curve: str = 'secp256r1') -> Dict[str, str]:
    """Generate ECDSA key pair."""
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import serialization

    curve_map = {
        'secp256r1': ec.SECP256R1(),
        'secp384r1': ec.SECP384R1(),
        'secp521r1': ec.SECP521R1(),
    }

    private_key = ec.generate_private_key(curve_map[curve])

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

    return {
        'private_key': private_pem,
        'public_key': public_pem
    }


def hash_value(value: str) -> str:
    """Create SHA256 hash of a value for logging/comparison."""
    return hashlib.sha256(value.encode()).hexdigest()[:16]


# Coolify API Client
class CoolifyClient:
    def __init__(self, config: CoolifyConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {config.api_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        })
        self.session.verify = config.verify_ssl

        # Configure retries
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "PUT", "DELETE", "OPTIONS", "TRACE", "POST"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def _request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        url = f"{self.config.api_url.rstrip('/')}/api/v1{endpoint}"
        kwargs.setdefault('timeout', self.config.timeout)
        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response

    def get_applications(self) -> List[Dict]:
        """Get all applications in the project."""
        response = self._request('GET', f'/projects/{self.config.project_uuid}/applications')
        return response.json()

    def get_application(self, app_uuid: str) -> Dict:
        """Get application details."""
        response = self._request('GET', f'/applications/{app_uuid}')
        return response.json()

    def get_application_env_vars(self, app_uuid: str) -> List[Dict]:
        """Get environment variables for an application."""
        response = self._request('GET', f'/applications/{app_uuid}/envs')
        return response.json()

    def update_application_env_var(self, app_uuid: str, env_id: str, value: str) -> Dict:
        """Update an environment variable."""
        response = self._request('PATCH', f'/applications/{app_uuid}/envs/{env_id}', json={'value': value})
        return response.json()

    def create_application_env_var(self, app_uuid: str, key: str, value: str, is_secret: bool = True) -> Dict:
        """Create a new environment variable."""
        response = self._request('POST', f'/applications/{app_uuid}/envs', json={
            'key': key,
            'value': value,
            'is_secret': is_secret
        })
        return response.json()

    def deploy_application(self, app_uuid: str, force: bool = False) -> Dict:
        """Trigger application deployment."""
        response = self._request('POST', f'/applications/{app_uuid}/deploy', json={'force': force})
        return response.json()

    def get_deployment_status(self, deployment_uuid: str) -> Dict:
        """Get deployment status."""
        response = self._request('GET', f'/deployments/{deployment_uuid}')
        return response.json()

    def wait_for_deployment(self, deployment_uuid: str, timeout: int = 300) -> Dict:
        """Wait for deployment to complete."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            status = self.get_deployment_status(deployment_uuid)
            if status.get('status') in ['success', 'failed', 'cancelled']:
                return status
            time.sleep(5)
        raise TimeoutError(f"Deployment {deployment_uuid} timed out after {timeout}s")


# Secret Manager
class SecretManager:
    def __init__(self, coolify: CoolifyClient, config_dir: Path):
        self.coolify = coolify
        self.config_dir = config_dir
        self.secrets_config = self._load_secrets_config()
        self.rotation_history = self._load_rotation_history()

    def _load_secrets_config(self) -> Dict[str, SecretConfig]:
        """Load secrets configuration from YAML/JSON file."""
        config_file = self.config_dir / 'secrets-config.yaml'
        if not config_file.exists():
            config_file = self.config_dir / 'secrets-config.json'

        if config_file.exists():
            if config_file.suffix == '.yaml' or config_file.suffix == '.yml':
                import yaml
                with open(config_file) as f:
                    data = yaml.safe_load(f)
            else:
                with open(config_file) as f:
                    data = json.load(f)

            secrets = {}
            for item in data.get('secrets', []):
                secrets[item['name']] = SecretConfig(**item)
            return secrets
        else:
            # Default configuration
            return self._default_secrets_config()

    def _default_secrets_config(self) -> Dict[str, SecretConfig]:
        """Default secrets configuration for AGASSOCIATES stack."""
        return {
            'DATABASE_PASSWORD': SecretConfig(
                name='DATABASE_PASSWORD',
                description='PostgreSQL database password',
                generator='random',
                length=32,
                rotation_days=90,
                services=['ag-ai-backend', 'ag-platform', 'intake-api', 'coordinator'],
            ),
            'REDIS_PASSWORD': SecretConfig(
                name='REDIS_PASSWORD',
                description='Redis password',
                generator='random',
                length=32,
                rotation_days=90,
                services=['ag-ai-backend', 'ag-platform', 'intake-api', 'coordinator'],
            ),
            'JWT_SECRET': SecretConfig(
                name='JWT_SECRET',
                description='JWT signing secret',
                generator='jwt',
                rotation_days=90,
                services=['ag-ai-backend', 'ag-platform', 'intake-api', 'coordinator'],
            ),
            'ENCRYPTION_KEY': SecretConfig(
                name='ENCRYPTION_KEY',
                description='Application encryption key (32 bytes base64)',
                generator='random',
                length=44,  # 32 bytes = 44 base64 chars
                rotation_days=90,
                services=['ag-ai-backend', 'ag-platform', 'intake-api', 'coordinator'],
            ),
            'WEBHOOK_SECRET': SecretConfig(
                name='WEBHOOK_SECRET',
                description='Webhook signature verification secret',
                generator='random',
                length=64,
                rotation_days=90,
                services=['ag-ai-backend', 'intake-api'],
            ),
            'N8N_WEBHOOK_KEY': SecretConfig(
                name='N8N_WEBHOOK_KEY',
                description='n8n webhook authentication key',
                generator='uuid',
                rotation_days=90,
                services=['n8n', 'ag-ai-backend'],
            ),
            'TELEGRAM_BOT_TOKEN': SecretConfig(
                name='TELEGRAM_BOT_TOKEN',
                description='Telegram bot token',
                generator='random',
                length=64,
                rotation_days=90,
                services=['coordinator'],
            ),
            'GEMINI_API_KEY': SecretConfig(
                name='GEMINI_API_KEY',
                description='Google Gemini API key',
                generator='random',
                length=64,
                rotation_days=90,
                services=['ag-platform', 'coordinator'],
            ),
            'GROQ_API_KEY': SecretConfig(
                name='GROQ_API_KEY',
                description='Groq API key for LLM',
                generator='random',
                length=64,
                rotation_days=90,
                services=['ag-ai-backend'],
            ),
            'SENTRY_DSN': SecretConfig(
                name='SENTRY_DSN',
                description='Sentry DSN for error tracking',
                generator='random',
                length=64,
                rotation_days=90,
                services=['ag-platform'],
            ),
            'SUPABASE_SERVICE_ROLE_KEY': SecretConfig(
                name='SUPABASE_SERVICE_ROLE_KEY',
                description='Supabase service role key',
                generator='random',
                length=64,
                rotation_days=90,
                services=['ag-platform', 'intake-api'],
            ),
            'SUPABASE_ANON_KEY': SecretConfig(
                name='SUPABASE_ANON_KEY',
                description='Supabase anonymous key',
                generator='random',
                length=64,
                rotation_days=90,
                services=['ag-platform', 'intake-api'],
            ),
            'COOLIFY_API_TOKEN': SecretConfig(
                name='COOLIFY_API_TOKEN',
                description='Coolify API token for deployments',
                generator='random',
                length=64,
                rotation_days=90,
                services=['coordinator'],
            ),
            'SMTP_PASSWORD': SecretConfig(
                name='SMTP_PASSWORD',
                description='SMTP password for email sending',
                generator='random',
                length=32,
                rotation_days=90,
                services=['ag-ai-backend', 'ag-platform'],
            ),
            'TWILIO_AUTH_TOKEN': SecretConfig(
                name='TWILIO_AUTH_TOKEN',
                description='Twilio auth token for SMS',
                generator='random',
                length=64,
                rotation_days=90,
                services=['intake-api'],
            ),
        }

    def _load_rotation_history(self) -> List[Dict]:
        """Load rotation history from file."""
        history_file = self.config_dir / 'rotation-history.json'
        if history_file.exists():
            with open(history_file) as f:
                return json.load(f)
        return []

    def _save_rotation_history(self):
        """Save rotation history to file."""
        history_file = self.config_dir / 'rotation-history.json'
        with open(history_file, 'w') as f:
            json.dump(self.rotation_history, f, indent=2, default=str)

    def generate_secret(self, config: SecretConfig) -> Any:
        """Generate a new secret value based on configuration."""
        if config.generator == 'random':
            return generate_random_string(config.length)
        elif config.generator == 'uuid':
            return generate_uuid()
        elif config.generator == 'jwt':
            return generate_jwt_secret()
        elif config.generator == 'rsa':
            return generate_rsa_key_pair()
        elif config.generator == 'ecdsa':
            return generate_ecdsa_key_pair()
        else:
            raise ValueError(f"Unknown generator: {config.generator}")

    def get_secret_value_for_service(self, secret_value: Any, service: str) -> str:
        """Extract the appropriate secret value for a service."""
        if isinstance(secret_value, dict):
            # For key pairs, return private key by default
            if 'private_key' in secret_value:
                return secret_value['private_key']
            elif 'private' in secret_value:
                return secret_value['private']
        return str(secret_value)

    def rotate_secret(self, secret_name: str, dry_run: bool = False) -> RotationResult:
        """Rotate a single secret across all configured services."""
        config = self.secrets_config.get(secret_name)
        if not config:
            return RotationResult(
                secret_name=secret_name,
                success=False,
                old_value_hash='',
                new_value_hash='',
                rotated_at=datetime.utcnow().isoformat(),
                error=f"Secret configuration not found: {secret_name}",
            )

        secret_ref = hashlib.sha256(str(secret_name).encode("utf-8")).hexdigest()[:12]
        logger.info(f"Rotating secret [id={secret_ref}]")

        # Generate new secret
        new_secret = self.generate_secret(config)
        new_secret_str = json.dumps(new_secret) if isinstance(new_secret, dict) else str(new_secret)
        new_hash = hash_value(new_secret_str)

        # Get current secret values from Coolify (for hash comparison)
        old_hashes = {}
        affected_services = []

        for service_name in config.services:
            try:
                apps = self.coolify.get_applications()
                app = next((a for a in apps if a.get('name') == service_name), None)
                if not app:
                    logger.warning(f"Service not found in Coolify: {service_name}")
                    continue

                env_vars = self.coolify.get_application_env_vars(app['uuid'])
                env_var = next((e for e in env_vars if e.get('key') == secret_name), None)
                if env_var:
                    old_hashes[service_name] = hash_value(env_var.get('value', ''))
                    affected_services.append(service_name)

                    if not dry_run:
                        # Update the secret
                        new_value = self.get_secret_value_for_service(new_secret, service_name)
                        self.coolify.update_application_env_var(app['uuid'], env_var['id'], new_value)
                        logger.info(f"Updated {secret_name} for {service_name}")
                else:
                    # Create new env var if it doesn't exist
                    if not dry_run:
                        new_value = self.get_secret_value_for_service(new_secret, service_name)
                        self.coolify.create_application_env_var(app['uuid'], secret_name, new_value)
                        logger.info(f"Created {secret_name} for {service_name}")
                        affected_services.append(service_name)

            except Exception as e:
                logger.error(f"Error updating {secret_name} for {service_name}: {e}")
                return RotationResult(
                    secret_name=secret_name,
                    success=False,
                    old_value_hash='',
                    new_value_hash=new_hash,
                    rotated_at=datetime.utcnow().isoformat(),
                    error=str(e),
                    affected_services=affected_services,
                )

        # Record rotation
        result = RotationResult(
            secret_name=secret_name,
            success=True,
            old_value_hash=json.dumps(old_hashes),
            new_value_hash=new_hash,
            rotated_at=datetime.utcnow().isoformat(),
            affected_services=affected_services,
        )

        self.rotation_history.append(asdict(result))
        self._save_rotation_history()

        if not dry_run:
            # Trigger redeployment of affected services
            self._redeploy_services(affected_services)

        return result

    def _redeploy_services(self, service_names: List[str]):
        """Trigger redeployment of services after secret rotation."""
        apps = self.coolify.get_applications()
        for service_name in service_names:
            app = next((a for a in apps if a.get('name') == service_name), None)
            if app:
                logger.info(f"Triggering redeployment for {service_name}")
                try:
                    deployment = self.coolify.deploy_application(app['uuid'], force=True)
                    deployment_uuid = deployment.get('deployment_uuid') or deployment.get('uuid')
                    if deployment_uuid:
                        status = self.coolify.wait_for_deployment(deployment_uuid)
                        if status.get('status') != 'success':
                            logger.error(f"Deployment failed for {service_name}: {status}")
                        else:
                            logger.info(f"Deployment successful for {service_name}")
                except Exception as e:
                    logger.error(f"Deployment error for {service_name}: {e}")

    def rotate_all_secrets(self, dry_run: bool = False, force: bool = False) -> List[RotationResult]:
        """Rotate all secrets that are due for rotation."""
        results = []
        now = datetime.utcnow()

        for secret_name, config in self.secrets_config.items():
            # Check if rotation is due
            last_rotation = self._get_last_rotation(secret_name)
            if last_rotation and not force:
                last_rotated = datetime.fromisoformat(last_rotation['rotated_at'])
                days_since = (now - last_rotated).days
                if days_since < config.rotation_days:
                    logger.info(f"Skipping {secret_name}: only {days_since} days since last rotation (need {config.rotation_days})")
                    continue

            result = self.rotate_secret(secret_name, dry_run=dry_run)
            results.append(result)

            if not result.success:
                logger.error(f"Failed to rotate {secret_name}: {result.error}")

        return results

    def _get_last_rotation(self, secret_name: str) -> Optional[Dict]:
        """Get the last rotation record for a secret."""
        for record in reversed(self.rotation_history):
            if record['secret_name'] == secret_name and record['success']:
                return record
        return None

    def check_rotation_status(self) -> Dict[str, Any]:
        """Check rotation status for all secrets."""
        now = datetime.utcnow()
        status = {
            'checked_at': now.isoformat(),
            'secrets': {},
            'due_for_rotation': [],
            'overdue': [],
        }

        for secret_name, config in self.secrets_config.items():
            last_rotation = self._get_last_rotation(secret_name)
            if last_rotation:
                last_rotated = datetime.fromisoformat(last_rotation['rotated_at'])
                days_since = (now - last_rotated).days
                days_until = config.rotation_days - days_since
            else:
                days_since = None
                days_until = 0

            secret_status = {
                'last_rotated': last_rotation['rotated_at'] if last_rotation else None,
                'days_since_rotation': days_since,
                'rotation_interval_days': config.rotation_days,
                'days_until_due': days_until,
                'is_due': days_until <= 0,
                'is_overdue': days_until < -7,
            }

            status['secrets'][secret_name] = secret_status

            if secret_status['is_due']:
                status['due_for_rotation'].append(secret_name)
            if secret_status['is_overdue']:
                status['overdue'].append(secret_name)

        return status


# Notification handlers
class NotificationManager:
    def __init__(self, config: Dict):
        self.config = config
        self.webhook_urls = config.get('webhooks', {})
        self.smtp_config = config.get('smtp', {})

    def send_rotation_notification(self, results: List[RotationResult], status: Dict):
        """Send notification about rotation results."""
        # Prepare message
        successful = [r for r in results if r.success]
        failed = [r for r in results if not r.success]

        subject = f"AGASSOCIATES Secret Rotation Report - {datetime.utcnow().strftime('%Y-%m-%d')}"
        body = self._format_report(successful, failed, status)

        # Send to webhooks
        for name, url in self.webhook_urls.items():
            try:
                requests.post(url, json={
                    'subject': subject,
                    'body': body,
                    'timestamp': datetime.utcnow().isoformat(),
                }, timeout=10)
                logger.info(f"Notification sent to {name}")
            except Exception as e:
                logger.error(f"Failed to send notification to {name}: {e}")

        # Send email if configured
        if self.smtp_config:
            self._send_email(subject, body)

    def _format_report(self, successful: List[RotationResult], failed: List[RotationResult], status: Dict) -> str:
        lines = [
            "AGASSOCIATES Secret Rotation Report",
            "=" * 50,
            f"Generated: {datetime.utcnow().isoformat()}",
            "",
            f"Successful rotations: {len(successful)}",
            f"Failed rotations: {len(failed)}",
            f"Secrets due for rotation: {len(status.get('due_for_rotation', []))}",
            f"Secrets overdue: {len(status.get('overdue', []))}",
            "",
        ]

        if successful:
            lines.append("Successfully Rotated:")
            lines.append("-" * 30)
            for r in successful:
                lines.append(f"  ✓ {r.secret_name}")
                lines.append(f"    Services: {', '.join(r.affected_services or [])}")
                lines.append(f"    Rotated at: {r.rotated_at}")
            lines.append("")

        if failed:
            lines.append("Failed Rotations:")
            lines.append("-" * 30)
            for r in failed:
                lines.append(f"  ✗ {r.secret_name}")
                lines.append(f"    Error: {r.error}")
            lines.append("")

        if status.get('overdue'):
            lines.append("OVERDUE Secrets (require immediate attention):")
            lines.append("-" * 30)
            for name in status['overdue']:
                lines.append(f"  !! {name}")
            lines.append("")

        return "\n".join(lines)

    def _send_email(self, subject: str, body: str):
        """Send email notification."""
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart()
        msg['From'] = self.smtp_config.get('from')
        msg['To'] = ', '.join(self.smtp_config.get('to', []))
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        try:
            with smtplib.SMTP(self.smtp_config.get('host'), self.smtp_config.get('port', 587)) as server:
                server.starttls()
                server.login(self.smtp_config.get('username'), self.smtp_config.get('password'))
                server.send_message(msg)
            logger.info("Email notification sent")
        except Exception as e:
            logger.error(f"Failed to send email: {e}")


# Main CLI
def setup_logging(verbose: bool = False):
    """Configure logging."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('/var/log/agassociates/secret-rotation.log')
        ]
    )
    return logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description='Rotate secrets for AGASSOCIATES stack via Coolify API')
    parser.add_argument('--config-dir', default='/etc/agassociates/secrets', help='Configuration directory')
    parser.add_argument('--coolify-url', default=os.getenv('COOLIFY_API_URL'), help='Coolify API URL')
    parser.add_argument('--coolify-token', default=os.getenv('COOLIFY_API_TOKEN'), help='Coolify API token')
    parser.add_argument('--project-uuid', default=os.getenv('COOLIFY_PROJECT_UUID'), help='Coolify project UUID')
    parser.add_argument('--dry-run', action='store_true', help='Perform dry run without making changes')
    parser.add_argument('--force', action='store_true', help='Force rotation even if not due')
    parser.add_argument('--secret', help='Rotate specific secret only')
    parser.add_argument('--check-only', action='store_true', help='Only check rotation status')
    parser.add_argument('--notify', action='store_true', help='Send notifications')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    args = parser.parse_args()

    global logger
    logger = setup_logging(args.verbose)

    # Validate required config
    if not all([args.coolify_url, args.coolify_token, args.project_uuid]):
        logger.error("Missing required configuration: COOLIFY_API_URL, COOLIFY_API_TOKEN, COOLIFY_PROJECT_UUID")
        sys.exit(1)

    config_dir = Path(args.config_dir)
    config_dir.mkdir(parents=True, exist_ok=True)

    # Initialize clients
    coolify_config = CoolifyConfig(
        api_url=args.coolify_url,
        api_token=args.coolify_token,
        project_uuid=args.project_uuid,
    )
    coolify = CoolifyClient(coolify_config)
    secret_manager = SecretManager(coolify, config_dir)

    if args.check_only:
        status = secret_manager.check_rotation_status()
        print(json.dumps(status, indent=2, default=str))
        return

    # Perform rotation
    if args.secret:
        results = [secret_manager.rotate_secret(args.secret, dry_run=args.dry_run)]
    else:
        results = secret_manager.rotate_all_secrets(dry_run=args.dry_run, force=args.force)

    # Print results
    for result in results:
        status = "✓" if result.success else "✗"
        print(f"{status} {result.secret_name}: {result.error or 'OK'}")

    # Send notifications
    if args.notify:
        status = secret_manager.check_rotation_status()
        notification_config = {
            'webhooks': {
                'slack': os.getenv('SLACK_WEBHOOK_URL'),
                'teams': os.getenv('TEAMS_WEBHOOK_URL'),
            },
            'smtp': {
                'host': os.getenv('SMTP_HOST'),
                'port': int(os.getenv('SMTP_PORT', '587')),
                'username': os.getenv('SMTP_USERNAME'),
                'password': os.getenv('SMTP_PASSWORD'),
                'from': os.getenv('SMTP_FROM'),
                'to': os.getenv('SMTP_TO', '').split(','),
            }
        }
        # Filter out None values
        notification_config['webhooks'] = {k: v for k, v in notification_config['webhooks'].items() if v}
        notification_config['smtp'] = {k: v for k, v in notification_config['smtp'].items() if v}

        notifier = NotificationManager(notification_config)
        notifier.send_rotation_notification(results, status)

    # Exit with error code if any failures
    if any(not r.success for r in results):
        sys.exit(1)


if __name__ == '__main__':
    main()