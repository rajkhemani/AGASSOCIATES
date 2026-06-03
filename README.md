# AG Associates AI — Legal Tech Platform

[![CI](https://github.com/rajkhemani/AGASSOCIATES/actions/workflows/main.yml/badge.svg)](https://github.com/rajkhemani/AGASSOCIATES/actions)
[![License](https://img.shields.io/badge/license-Proprietary-gold)](./LICENSE)

The next-generation legal operations platform for **Adv. Aditya Gade & AG Associates**. Designed with "Luxurious Restraint" for high-precision legal automation and case management.

---

## 🏛 Platform Overview

This monorepo contains a suite of AI-integrated tools for legal practice automation:

1.  **AI Dashboard (`ag-associates-ai/frontend`)**: A high-fidelity Next.js 15 application featuring the "Luxurious Restraint" aesthetic (#0A0A0A dark mode with gold accents).
2.  **Unified AI Controller (Stitch)**: A backend orchestration layer that connects frontend interfaces to a swarm of specialist agents.
3.  **Aisha AI Assistant**: A real-time chat interface integrated into all platform views, powered by the Unified Controller.
4.  **NOI Pipeline**: Automated "Notice of Intimation" workflow from document intake to IGR filing.
5.  **Multi-Agent Backend**: LangGraph-powered agents for auditing, drafting, and compliance.

---

## 🏗 Project Structure

```text
.
├── ag-associates-ai/
│   ├── backend/             # 🧠 LangGraph Agents + FastAPI
│   └── frontend/            # 💎 Next.js 15 Dashboard (Luxurious UI)
├── ag-platform/             # 🏢 Core Operations Platform (Vite + Express)
├── services/
│   ├── intake-api/          # 📥 Fastify SMS/Webhook Intake
│   └── coordinator/         # 🎛️ Hierarchical Agent Coordinator
├── prototype/
│   └── noi-dashboard/       # 🧪 NOI Automation Prototype
├── apps/
│   └── agos-android/        # 📱 Jetpack Compose Android Client
└── docker-compose.prod.yml  # 🐳 10-service production stack
```

---

## 🚀 Key Features

### 💎 Luxurious Restraint UI
A high-precision aesthetic designed for the modern advocate:
- **Dark Mode First**: #0A0A0A background for reduced eye strain during late-night drafting.
- **Gold Accents**: #D4AF37 highlighting for essential actions and brand identity.
- **Hairline Precision**: Ultra-thin borders and refined typography for a professional look.

### 🤖 Unified Aisha AI (Stitch)
A centralized intelligence layer that orchestrates multiple specialists:
- **Unified Controller**: Handles complex queries by routing to specific agents (Vyasa, Executor, Accountant).
- **Tool Integration**: Direct access to database records, document generation, and external portals.
- **Context-Aware Chat**: Remembers case details and user preferences across sessions.

### 📋 Automated NOI Pipeline
End-to-end automation of the Notice of Intimation process:
- **Email Intake**: Auto-detection of loan sanction emails and document attachments.
- **OCR Extraction**: High-accuracy parsing of banking documents and Index II records.
- **Challan Generation**: Automatic calculation and generation of GRAS payment challans.
- **Portal Filing**: (In progress) RPA-driven filing on the IGR Maharashtra portal.

---

## 🚢 Deployment Architecture

The platform is deployed on a **Hetzner Cloud VPS** via a fully automated GitHub Actions pipeline.

- **Reverse Proxy**: Caddy 2 with auto-TLS.
- **Containerization**: Docker Compose (10 services).
- **Database**: Supabase (PostgreSQL + pgvector).
- **Domain**: [advadiityagade.com](https://advadiityagade.com)

---

## 🤝 Contributing

This codebase is built and maintained by a team of AI engineering agents. See [AGENTS.md](./AGENTS.md) for session guidance and architecture rules.

---

<p align="center">
  <sub>Built for <strong>AG Associates</strong> · Thane, Maharashtra</sub>
  <br/>
  <sub>Powered by LangGraph, Next.js, and Gemini 2.0</sub>
</p>
