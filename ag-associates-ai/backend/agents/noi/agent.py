"""NOI Agent — Notice of Intimation workflow specialist."""

import logging
from typing import Optional

from agents.base_agent import BaseAgent, AgentResponse
from agents.agent_memory import get_or_create_conversation, add_message, get_context_window
from .prompts import NOI_PERSONA

logger = logging.getLogger(__name__)


class NOIAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="noi",
            persona_prompt=NOI_PERSONA,
            required_permission="agent.noi.access",
        )

    async def process_request(self, user_message, user_id, user_role="CLERK", conversation_id=None):
        if not self.check_access(user_role):
            return AgentResponse("❌ NOI agent ke liye aapke paas permission nahi hai.")
        conv_id = conversation_id or get_or_create_conversation(self.name, user_id, title=user_message[:100])
        add_message(self.name, conv_id, "user", user_message)
        context = get_context_window(self.name, conv_id)
        reply = await self.think(user_message, context)
        add_message(self.name, conv_id, "assistant", reply)
        return AgentResponse(reply)


noi = NOIAgent()
