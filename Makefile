# AG Associates — Master Makefile
# Common development and deployment tasks

.PHONY: help env prod-env deploy provision runner smoke test lint build clean backup logs status

# Default target
help:
	@echo "AG Associates — Automation Commands"
	@echo ""
	@echo "Environment:"
	@echo "  env           Create local .env from .env.example (interactive)"
	@echo "  prod-env      Write production .env to VPS (run after provision)"
	@echo ""
	@echo "Development:"
	@echo "  dev           Start local dev stack (Docker Compose)"
	@echo "  dev-ai        Start ag-associates-ai dev stack"
	@echo "  dev-platform  Start ag-platform dev stack"
	@echo "  test          Run all tests"
	@echo "  lint          Run all linters"
	@echo "  build         Build all Docker images"
	@echo ""
	@echo "Production Deployment:"
	@echo "  provision     Provision new VPS (Hetzner + Cloudflare + DNS)"
	@echo "  deploy        Deploy to existing VPS via GitHub Actions"
	@echo "  runner        Setup GitHub Actions self-hosted runner"
	@echo "  dns           Update Cloudflare DNS records"
	@echo "  smoke         Run smoke tests against production"
	@echo "  deploy-all    Full automated deployment (provision + deploy + runner + dns + smoke)"
	@echo "  teardown      Destroy VPS and cleanup (DANGEROUS)"
	@echo ""
	@echo "Maintenance:"
	@echo "  backup        Run backup manually on VPS"
	@echo "  logs          Stream production logs"
	@echo "  status        Check production service status"
	@echo "  ssh           SSH into production VPS"
	@echo "  clean         Clean Docker images/volumes"

# ── Environment ──────────────────────────────────────────────────────────────

env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example"; \
		echo "EDIT .env and fill in all REPLACE_WITH_* values"; \
	else \
		echo ".env already exists"; \
	fi

prod-env:
	bash scripts/deploy-all.sh write-env

# ── Local Development ────────────────────────────────────────────────────────

dev:
	docker compose up -d

dev-ai:
	cd ag-associates-ai && docker compose up -d

dev-platform:
	cd ag-platform && npm run dev

test:
	cd ag-platform && npm test

lint:
	cd ag-platform && npm run lint
	cd ag-associates-ai/frontend && npm run lint

build:
	docker compose -f docker-compose.prod.yml build

# ── Production Deployment ────────────────────────────────────────────────────

provision:
	bash scripts/deploy-all.sh provision

deploy:
	bash scripts/deploy-all.sh deploy

runner:
	bash scripts/deploy-all.sh runner

dns:
	bash scripts/deploy-all.sh dns

smoke:
	bash scripts/deploy-all.sh smoke

deploy-all:
	bash scripts/deploy-all.sh all

teardown:
	bash scripts/deploy-all.sh teardown

# ── Maintenance ──────────────────────────────────────────────────────────────

backup:
	ssh deploy@$$(grep VPS_IP scripts/deploy-all.sh 2>/dev/null | head -1 | cut -d= -f2 || echo "VPS_IP") "sudo /usr/local/sbin/ag-backup"

logs:
	ssh deploy@$$(terraform output -raw vps_ip 2>/dev/null || echo "VPS_IP") "docker logs -f --tail 100 ag_ai_backend"

status:
	ssh deploy@$$(terraform output -raw vps_ip 2>/dev/null || echo "VPS_IP") "docker ps --filter name=ag_ --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

ssh:
	ssh deploy@$$(terraform output -raw vps_ip 2>/dev/null || echo "VPS_IP")

clean:
	docker system prune -af --volumes
	cd ag-platform && npm run clean 2>/dev/null || true

# ── GitHub Actions ───────────────────────────────────────────────────────────

gh-secrets:
	@echo "Setting GitHub repository secrets..."
	@gh secret set HETZNER_API_TOKEN --body "$$HETZNER_API_TOKEN"
	@gh secret set CLOUDFLARE_API_TOKEN --body "$$CLOUDFLARE_API_TOKEN"
	@gh secret set CLOUDFLARE_ZONE_ID --body "$$CLOUDFLARE_ZONE_ID"
	@gh secret set GH_PAT --body "$$GH_PAT"
	@gh secret set GROQ_API_KEY --body "$$GROQ_API_KEY"
	@gh secret set SUPABASE_URL --body "$$SUPABASE_URL"
	@gh secret set SUPABASE_SERVICE_ROLE_KEY --body "$$SUPABASE_SERVICE_ROLE_KEY"
	@gh secret set SUPABASE_ANON_KEY --body "$$SUPABASE_ANON_KEY"
	@gh secret set SUPABASE_JWT_SECRET --body "$$SUPABASE_JWT_SECRET"
	@gh secret set RESEND_API_KEY --body "$$RESEND_API_KEY"
	@gh secret set TELEGRAM_BOT_TOKEN --body "$$TELEGRAM_BOT_TOKEN"
	@gh secret set TELEGRAM_GROUP_ID --body "$$TELEGRAM_GROUP_ID"
	@gh secret set WHATSAPP_ACCESS_TOKEN --body "$$WHATSAPP_ACCESS_TOKEN"
	@gh secret set WHATSAPP_PHONE_NUMBER_ID --body "$$WHATSAPP_PHONE_NUMBER_ID"
	@gh secret set WHATSAPP_BUSINESS_ACCOUNT_ID --body "$$WHATSAPP_BUSINESS_ACCOUNT_ID"
	@gh secret set WHATSAPP_VERIFY_TOKEN --body "$$WHATSAPP_VERIFY_TOKEN"
	@gh secret set NESL_API_KEY --body "$$NESL_API_KEY"
	@gh secret set NESL_CLIENT_ID --body "$$NESL_CLIENT_ID"
	@gh secret set NESL_CLIENT_SECRET --body "$$NESL_CLIENT_SECRET"
	@gh secret set IGR_PORTAL_USERNAME --body "$$IGR_PORTAL_USERNAME"
	@gh secret set IGR_PORTAL_PASSWORD --body "$$IGR_PORTAL_PASSWORD"
	@gh secret set GOOGLE_GENERATIVE_AI_API_KEY --body "$$GOOGLE_GENERATIVE_AI_API_KEY"
	@gh variable set PROD_DOMAIN --body "advadiityagade.com"
	@gh variable set SUPABASE_URL --body "$$SUPABASE_URL"
	@gh variable set SUPABASE_ANON_KEY --body "$$SUPABASE_ANON_KEY"

gh-workflows:
	gh workflow run deploy.yml
	gh workflow run nextjs.yml

# ── Utility ──────────────────────────────────────────────────────────────────

check-env:
	@bash -c 'source .env && \
		for v in DOMAIN ACME_EMAIL POSTGRES_PASSWORD REDIS_PASSWORD JWT_SECRET \
			LLM_API_KEY SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY \
			SUPABASE_JWT_SECRET RESEND_API_KEY EMAIL_IMAP_PASS TELEGRAM_BOT_TOKEN \
			N8N_BASIC_AUTH_PASSWORD_HASH N8N_WEBHOOK_KEY; do \
			val=$${!v}; \
			if [ -z "$$val" ] || [[ "$$val" == REPLACE_WITH_* ]]; then \
				echo "MISSING: $$v"; \
			else \
				echo "OK: $$v=$${val:0:8}..."; \
			fi; \
		done'

.DEFAULT_GOAL := help
