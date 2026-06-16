"""Supervisor Agent — orchestrator that routes user intent to specialist agents.

The Supervisor:
1. Receives user query
2. Classifies intent using LLM → which agent(s) to route to
3. Routes to the right agent(s) using Agent Bus (request_response)
4. Can chain multiple agents (pipeline orchestration)
5. Returns aggregated result to the user
"""

import asyncio
import json
import logging
from typing import Optional

from agents.base_agent import BaseAgent, AgentResponse
from agents.agent_memory import (
    get_or_create_conversation,
    add_message,
)
from agents import agent_registry
from agents import agent_bus
from .prompts import SUPERVISOR_PERSONA, SUPERVISOR_CLASSIFIER_PROMPT

logger = logging.getLogger(__name__)


class SupervisorAgent(BaseAgent):
    """Orchestrator — routes user intent to the right specialist agent(s)."""

    def __init__(self):
        super().__init__(
            name="supervisor",
            persona_prompt=SUPERVISOR_PERSONA,
            required_permission="",
            min_role=None,
        )
        self._classifier_llm = None

    def _get_classifier_llm(self):
        if self._classifier_llm is None:
            from langchain_openai import ChatOpenAI
            import os
            from config import LLM_BASE_URL, LLM_MODEL_NAME

            self._classifier_llm = ChatOpenAI(
                model=LLM_MODEL_NAME or "qwen2.5-7b-instruct",
                openai_api_base=LLM_BASE_URL,
                openai_api_key=os.environ.get("LLM_API_KEY", "") or "not-needed",
                temperature=0.1,
            )
        return self._classifier_llm

    async def classify_intent(self, message: str) -> list[dict]:
        """Classify user message → ordered list of target agents with reasons."""
        available = agent_registry.list_agents()
        agent_list = ", ".join(f"{a['name']} ({a['description']})" for a in available)

        prompt = SUPERVISOR_CLASSIFIER_PROMPT.format(
            message=message[:1000],
            available_agents=agent_list,
        )

        try:
            llm = self._get_classifier_llm()
            response = await asyncio.to_thread(llm.invoke, prompt)
            text = response.content if hasattr(response, "content") else str(response)
            text = text.strip()
            if text.startswith("```"):
                text = text.strip("`").strip()
                if text.startswith("json"):
                    text = text[4:].strip()
            result = json.loads(text)
            if isinstance(result, list) and len(result) > 0:
                return result[:5]
        except Exception as e:
            logger.warning("[SUPERVISOR] Classification failed: %s", e)

        return [{"name": "aisha", "reason": "classification failed, fallback"}]

    async def route_to_agent(
        self,
        agent_name: str,
        user_message: str,
        user_id: str,
        user_role: str = "CLERK",
        conversation_id: Optional[str] = None,
    ) -> Optional[AgentResponse]:
        """Route to a specialist agent via Agent Bus request_response."""
        if agent_name == "aisha":
            return None

        try:
            result = await agent_bus.request_response(
                source="supervisor",
                target=agent_name,
                payload={
                    "text": user_message,
                    "user_id": user_id,
                    "user_role": user_role,
                    "reply_to_bus": True,
                },
                timeout=60.0,
                conversation_id=conversation_id,
            )
            if result:
                payload = result.get("payload", {})
                text = payload.get("text", "") if isinstance(payload, dict) else ""
                if not text and isinstance(payload, str):
                    text = payload
                return AgentResponse(text=text, data=result.get("data", {}))
        except Exception as e:
            logger.error("[SUPERVISOR] Route to %s failed: %s", agent_name, e)

        return None

    async def process_request(
        self,
        user_message: str,
        user_id: str,
        user_role: str = "CLERK",
        conversation_id: Optional[str] = None,
    ) -> Optional[AgentResponse]:
        conv_id = conversation_id or get_or_create_conversation(
            self.name, user_id, title=user_message[:100]
        )
        add_message(self.name, conv_id, "user", user_message)

        targets = await self.classify_intent(user_message)
        logger.info(
            "[SUPERVISOR] %s classified targets: %s",
            user_id,
            [t["name"] for t in targets],
        )

        if len(targets) == 1 and targets[0]["name"] == "aisha":
            add_message(self.name, conv_id, "assistant", "[routed to aisha]")
            return None

        responses = []
        for target in targets:
            resp = await self.route_to_agent(
                agent_name=target["name"],
                user_message=user_message,
                user_id=user_id,
                user_role=user_role,
                conversation_id=conv_id,
            )
            if resp:
                responses.append({"agent": target["name"], "response": resp.text})

        if responses:
            summary_lines = []
            for r in responses:
                summary_lines.append(
                    f"🤖 <b>{r['agent'].title()}</b> ne kaha:\n{r['response']}"
                )
            combined = "\n\n---\n\n".join(summary_lines)
            add_message(self.name, conv_id, "assistant", combined)
            return AgentResponse(combined)

        add_message(
            self.name, conv_id, "assistant", "[no specialist matched, routing to aisha]"
        )
        return None


supervisor = SupervisorAgent()
