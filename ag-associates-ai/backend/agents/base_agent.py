"""Base Agent class — shared foundation for all conversational agents.

Every agent:
- Has a persona (system prompt with language style)
- Communicates via the Agent Bus
- Uses PostgreSQL for persistent conversation memory
- Checks RBAC before handling requests
- Shares the Qwen2.5 LLM at http://localhost:8000/v1
- Can initiate Telegram DMs via the messenger module
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Callable, Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from config import LLM_BASE_URL, LLM_MODEL_NAME
from auth.rbac import Role, can as rbac_can

from . import agent_bus
from . import agent_memory as memory

logger = logging.getLogger(__name__)


class AgentResponse:
    """Structured response from an agent."""

    def __init__(self, text: str, *, data: Optional[dict] = None, dm: bool = False):
        self.text = text
        self.data = data or {}
        self.dm = dm  # True = send as private DM, not bus response


class BaseAgent:
    """Base class for all multi-agent system agents.

    Subclasses override persona_prompt and register_tools.
    """

    def __init__(
        self,
        name: str,
        persona_prompt: str,
        *,
        required_permission: str = "",
        min_role: Role = Role.CLERK,
    ):
        self.name = name
        self.persona_prompt = persona_prompt
        self.required_permission = required_permission
        self.min_role = min_role
        self.tools: dict[str, Callable] = {}
        self._llm: Optional[ChatOpenAI] = None

    def get_llm(self, temperature: float = 0.3) -> ChatOpenAI:
        if self._llm is None:
            self._llm = ChatOpenAI(
                model=LLM_MODEL_NAME,
                openai_api_base=LLM_BASE_URL,
                openai_api_key=os.environ.get("LLM_API_KEY", "") or "not-needed",
                temperature=temperature,
            )
        self._llm.temperature = temperature
        return self._llm

    def register_tool(self, name: str, fn: Callable, description: str = ""):
        self.tools[name] = fn

    def check_access(self, user_role: str) -> bool:
        if self.required_permission:
            return rbac_can(user_role, self.required_permission)
        try:
            role = Role.from_str(user_role) if isinstance(user_role, str) else user_role
        except ValueError:
            return False
        return role.value >= self.min_role.value

    def get_tool_descriptions(self) -> str:
        if not self.tools:
            return ""
        lines = []
        for name in self.tools:
            fn = self.tools[name]
            desc = getattr(fn, "__doc__", "") or ""
            lines.append(f"  • {name}: {desc}")
        return "\n".join(lines)

    async def think(
        self,
        message: str,
        context_messages: list[dict],
        *,
        temperature: float = 0.3,
    ) -> str:
        llm = self.get_llm(temperature)
        tools_desc = self.get_tool_descriptions()

        sys_prompt = self.persona_prompt.format(
            current_time=datetime.now().isoformat(),
            tools=tools_desc,
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", sys_prompt),
                *[
                    {
                        "role": m["role"],
                        "content": m["content"].replace("{", "{{").replace("}", "}}"),
                    }
                    for m in context_messages[-15:]
                ],
                ("human", "{message}"),
            ]
        )

        try:
            chain = prompt | llm
            response = chain.invoke({"message": message})
            text = response.content if hasattr(response, "content") else str(response)
            return text
        except Exception as e:
            logger.error("[%s] LLM error: %s", self.name, e)
            return (
                "Maaf kijiye, main abhi available nahi hoon. Thodi der mein poochhiye."
            )

    async def send_bus(self, target: str, payload: dict, **kwargs):
        return await agent_bus.send_message(self.name, target, payload, **kwargs)

    async def respond_bus(
        self, target: str, payload: dict, correlation_id: str, **kwargs
    ):
        await agent_bus.publish_response(
            self.name, target, payload, correlation_id, **kwargs
        )

    async def send_dm(self, chat_id: int, text: str):
        try:
            from telegram_bot.private_messenger import send_dm

            await send_dm(chat_id, text)
        except ImportError:
            logger.warning("[%s] private_messenger not available for DM", self.name)

    async def handle_bus_message(self, msg: dict):
        logger.debug("[%s] Bus msg: %s", self.name, msg.get("type"))
        msg_type = msg.get("type", "request")
        payload = msg.get("payload", {})
        correlation_id = msg.get("correlation_id", "")
        conversation_id = msg.get("conversation_id", "")

        if msg_type == "request":
            result = await self.process_request(
                user_message=payload.get("text", ""),
                user_id=payload.get("user_id", "bus"),
                user_role=payload.get("user_role", "CLERK"),
                conversation_id=conversation_id,
            )
            if result and correlation_id and payload.get("reply_to_bus", True):
                await self.respond_bus(
                    target=msg["source"],
                    payload={"text": result.text, "data": result.data},
                    correlation_id=correlation_id,
                    conversation_id=conversation_id,
                )

    async def process_request(
        self,
        user_message: str,
        user_id: str,
        user_role: str = "CLERK",
        conversation_id: Optional[str] = None,
    ) -> Optional[AgentResponse]:
        if not self.check_access(user_role):
            return AgentResponse(
                "❌ Aapke paas is agent ke liye permission nahi hai. "
                "Principal se baat karein."
            )

        conv_id = conversation_id or memory.get_or_create_conversation(
            self.name, user_id, title=user_message[:100]
        )
        memory.add_message(self.name, conv_id, "user", user_message)

        context = memory.get_context_window(self.name, conv_id)
        reply = await self.think(user_message, context)
        memory.add_message(self.name, conv_id, "assistant", reply)

        return AgentResponse(reply)
