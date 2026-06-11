"""Agent initialisation — registers all agents, starts bus listeners.

Call init_agents() at app startup to:
1. Register all agents in the registry
2. Start background bus listeners for each agent
3. Return agent dict for routing
"""

import asyncio
import logging
from typing import Optional

from . import agent_bus
from . import agent_registry
from .auditor.agent import auditor
from .vyasa.agent import vyasa
from .bouncer.agent import bouncer
from .accountant.agent import accountant
from .noi.agent import noi
from .executor.agent import executor
from .drafter.agent import drafter
from .supervisor.agent import supervisor

logger = logging.getLogger(__name__)

_bus_tasks: list[asyncio.Task] = []


def register_all():
    """Register all agents in the registry."""
    agent_registry.register("supervisor", supervisor)
    agent_registry.register("auditor", auditor)
    agent_registry.register("vyasa", vyasa)
    agent_registry.register("bouncer", bouncer)
    agent_registry.register("accountant", accountant)
    agent_registry.register("noi", noi)
    agent_registry.register("executor", executor)
    agent_registry.register("drafter", drafter)
    logger.info("[INIT] All agents registered")


async def start_bus_listeners():
    """Start background bus listeners for all registered agents."""
    loop = asyncio.get_event_loop()

    for name, instance in [
        ("supervisor", supervisor),
        ("auditor", auditor),
        ("vyasa", vyasa),
        ("bouncer", bouncer),
        ("accountant", accountant),
        ("noi", noi),
        ("executor", executor),
        ("drafter", drafter),
    ]:
        task = loop.create_task(
            agent_bus.listen_agent(name, instance.handle_bus_message)
        )
        _bus_tasks.append(task)
        logger.info("[INIT] Bus listener started for: %s", name)


async def init_agents():
    """Full initialisation — register + start listeners."""
    register_all()
    await start_bus_listeners()


def get_agent(agent_name: str) -> Optional[object]:
    return agent_registry.get_agent(agent_name)
