"""Drafter Agent — legal document generation specialist."""

import logging

from agents.base_agent import BaseAgent, AgentResponse
from agents.agent_memory import (
    get_or_create_conversation,
    add_message,
    get_context_window,
)
from .prompts import DRAFTER_PERSONA

logger = logging.getLogger(__name__)


class DrafterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="drafter",
            persona_prompt=DRAFTER_PERSONA,
            required_permission="agent.drafter.access",
        )

    async def process_request(
        self, user_message, user_id, user_role="CLERK", conversation_id=None
    ):
        if not self.check_access(user_role):
            return AgentResponse(
                "❌ Drafter agent ke liye aapke paas permission nahi hai."
            )
        conv_id = conversation_id or get_or_create_conversation(
            self.name, user_id, title=user_message[:100]
        )
        add_message(self.name, conv_id, "user", user_message)
        context = get_context_window(self.name, conv_id)
        reply = await self.think(user_message, context)
        add_message(self.name, conv_id, "assistant", reply)
        return AgentResponse(reply)


drafter = DrafterAgent()
