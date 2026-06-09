"""Agent Registry — discoverable registry of all conversational agents.

Maps agent_name → BaseAgent instance. Exposes lookup, RBAC, and bus routes.
RBAC permissions are added here and also written to auth/rbac.py for consistency.
"""

from __future__ import annotations

import logging
from typing import Optional

from auth.rbac import Permission, Role

logger = logging.getLogger(__name__)

# Per-agent RBAC permissions (also registered in rbac.py ALL_PERMISSIONS)
AGENT_PERMISSIONS = [
    Permission("agent.auditor.access", "Access Auditor agent", Role.EXECUTIVE.value),
    Permission("agent.vyasa.access", "Access Vyasa agent", Role.CLERK.value),
    Permission("agent.bouncer.access", "Access Bouncer agent", Role.EXECUTIVE.value),
    Permission(
        "agent.accountant.access", "Access Accountant agent", Role.ADVOCATE.value
    ),
    Permission("agent.noi.access", "Access NOI agent", Role.ADVOCATE.value),
    Permission("agent.executor.access", "Access Executor agent", Role.PRINCIPAL.value),
    Permission("agent.drafter.access", "Access Drafter agent", Role.ADVOCATE.value),
]

AGENT_PERMISSION_MAP = {p.code: p for p in AGENT_PERMISSIONS}

# Default role levels per agent
AGENT_ROLE_MAP: dict[str, Role] = {
    "aisha": Role.CLERK,
    "auditor": Role.EXECUTIVE,
    "vyasa": Role.CLERK,
    "bouncer": Role.EXECUTIVE,
    "accountant": Role.ADVOCATE,
    "noi": Role.ADVOCATE,
    "executor": Role.PRINCIPAL,
    "drafter": Role.ADVOCATE,
}

AGENT_DESCRIPTIONS: dict[str, str] = {
    "aisha": "Chief of Staff — general assistant, coordination, admin tasks",
    "auditor": "Financial Auditor — bank statements, Excel audit, anomalies",
    "vyasa": "Legal Researcher — case law, property law, compliance",
    "bouncer": "Math Validator — stamp duty calculations, numeric sanity checks",
    "accountant": "Accountant — financial reports, billing, receivables",
    "noi": "NOI Specialist — Notice of Intimation workflow, GRAS/IGR filings",
    "executor": "Executor — run RPA automations, portal operations",
    "drafter": "Document Drafter — generate legal agreements, notices",
}

_registry: dict[str, object] = {}


def register(agent_name: str, agent_instance: object):
    _registry[agent_name] = agent_instance
    logger.info("[REGISTRY] Registered agent: %s", agent_name)


def get_agent(agent_name: str) -> Optional[object]:
    return _registry.get(agent_name)


def list_agents(user_role: str = "") -> list[dict]:
    results = []
    try:
        role = Role.from_str(user_role) if user_role else None
    except ValueError:
        role = None

    for name in sorted(_registry.keys()):
        min_role = AGENT_ROLE_MAP.get(name, Role.CLERK)
        accessible = role is None or role.value >= min_role.value
        results.append(
            {
                "name": name,
                "description": AGENT_DESCRIPTIONS.get(name, ""),
                "accessible": accessible,
                "min_role": min_role.label if not accessible else None,
            }
        )
    return results


def get_accessible_agents(user_role: str) -> list[str]:
    try:
        role = Role.from_str(user_role)
    except ValueError:
        return []
    return [
        name
        for name in _registry
        if role.value >= AGENT_ROLE_MAP.get(name, Role.CLERK).value
    ]
