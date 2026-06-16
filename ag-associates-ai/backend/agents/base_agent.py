"""Base Agent class — shared foundation for all conversational agents.

Every agent:
- Has a persona (system prompt with language style)
- Communicates via the Agent Bus
- Uses PostgreSQL for persistent conversation memory
- Checks RBAC before handling requests
- Shares the Qwen2.5 LLM at http://localhost:8000/v1
- Can initiate Telegram DMs via the messenger module
- Supports ReAct tool-calling loop with chain-of-thought
- Any-to-any: auto-detect files and route to correct processor
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from datetime import datetime
from typing import Any, Callable, Dict, Optional

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from config import (
    LLM_BASE_URL,
    LLM_MODEL_NAME,
    AGENT_MAX_TOOL_CALLS,
)
from auth.rbac import Role, can as rbac_can

from . import agent_bus
from . import agent_memory as memory

logger = logging.getLogger(__name__)

# ── Tool Registry Decorator ──────────────────────────────────────────────

_global_tool_registry: Dict[str, Dict[str, Any]] = {}


def register_tool(
    name: str,
    description: str = "",
    *,
    agent: str = "any",
    category: str = "general",
):
    """Decorator: register a function as a tool available to agents.

    Can be used standalone or as a class method:
        @register_tool("search_docs", "Search legal documents", agent="vyasa")
        async def search_docs(query: str) -> str: ...

    Tools without an agent name are available to ALL agents.
    """

    def decorator(fn: Callable):
        _global_tool_registry[name] = {
            "fn": fn,
            "description": description or (fn.__doc__ or "").strip(),
            "agent": agent,
            "category": category,
            "is_async": asyncio.iscoroutinefunction(fn),
        }
        return fn

    return decorator


def get_tools_for_agent(agent_name: str) -> Dict[str, Dict[str, Any]]:
    """Return all tools available to a given agent (including 'any')."""
    result = {}
    for tool_name, info in _global_tool_registry.items():
        if info["agent"] in ("any", agent_name):
            result[tool_name] = info
    return result


# ── Agent Response ────────────────────────────────────────────────────────


class AgentResponse:
    """Structured response from an agent."""

    def __init__(
        self,
        text: str,
        *,
        data: Optional[dict] = None,
        dm: bool = False,
        thinking: str = "",
        file_output: Optional[bytes] = None,
        file_type: str = "",
    ):
        self.text = text
        self.data = data or {}
        self.dm = dm
        self.thinking = thinking  # CoT reasoning visible to user
        self.file_output = file_output  # Generated file (PDF, etc.)
        self.file_type = file_type  # MIME type of file output


# ── Base Agent ────────────────────────────────────────────────────────────


class BaseAgent:
    """Base class for all multi-agent system agents.

    Subclasses override persona_prompt and register tools via
    the @register_tool decorator or self.register_tool().

    Key capabilities:
    - Chain-of-thought prompting in think()
    - ReAct tool-calling loop in think_with_tools()
    - Auto file detection and processing via process_file()
    - Bus messaging, DMs, conversation memory
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

    # ── LLM ──────────────────────────────────────────────────────────────

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

    # ── Tool Registration ────────────────────────────────────────────────

    def register_tool(self, name: str, fn: Callable, description: str = ""):
        self.tools[name] = fn
        _global_tool_registry.setdefault(
            name,
            {
                "fn": fn,
                "description": description or (fn.__doc__ or "").strip(),
                "agent": self.name,
                "category": "general",
                "is_async": asyncio.iscoroutinefunction(fn),
            },
        )

    def check_access(self, user_role: str) -> bool:
        if self.required_permission:
            return rbac_can(user_role, self.required_permission)
        try:
            role = Role.from_str(user_role) if isinstance(user_role, str) else user_role
        except ValueError:
            return False
        return role.value >= self.min_role.value

    # ── Tool Description Formatting ──────────────────────────────────────

    def _all_tools(self) -> Dict[str, Any]:
        """Merge instance tools with global registry tools for this agent."""
        merged = {}
        for t_name, t_info in get_tools_for_agent(self.name).items():
            merged[t_name] = t_info
        for t_name, fn in self.tools.items():
            merged[t_name] = {
                "fn": fn,
                "description": fn.__doc__ or "",
                "agent": self.name,
                "category": "local",
                "is_async": asyncio.iscoroutinefunction(fn),
            }
        return merged

    def get_tool_descriptions(self) -> str:
        tools = self._all_tools()
        if not tools:
            return ""
        lines = []
        for name, info in tools.items():
            desc = info.get("description", "").replace("\n", " ")[:120]
            lines.append(f"  • {name}: {desc}")
        return "\n".join(lines)

    # ── Chain-of-Thought Thinking ────────────────────────────────────────

    async def think(
        self,
        message: str,
        context_messages: list[dict],
        *,
        temperature: float = 0.3,
        use_cot: bool = True,
    ) -> str:
        """Single-turn LLM call with optional chain-of-thought.

        When use_cot=True, the system prompt instructs the model to think
        step by step before answering.
        """
        llm = self.get_llm(temperature)
        tools_desc = self.get_tool_descriptions()

        cot_instruction = ""
        if use_cot:
            cot_instruction = (
                "\n\nBefore answering, think step by step: "
                "(1) What is the user asking? "
                "(2) What do I know about this? "
                "(3) What information am I missing? "
                "(4) What is my final conclusion?"
            )

        sys_prompt = self.persona_prompt.format(
            current_time=datetime.now().isoformat(),
            tools=tools_desc,
        ) + cot_instruction

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

    # ── ReAct Tool-Calling Loop ──────────────────────────────────────────

    async def think_with_tools(
        self,
        message: str,
        context_messages: list[dict],
        *,
        temperature: float = 0.2,
    ) -> dict:
        """Multi-turn ReAct loop: Think → Act → Observe → Think → Answer.

        Returns: {"thinking": "...", "text": "...", "tool_calls": [...]}
        """
        thinking_log = []
        tool_results = []
        history = list(context_messages)

        for turn in range(AGENT_MAX_TOOL_CALLS):
            tools_desc = self.get_tool_descriptions()

            react_prompt = self.persona_prompt.format(
                current_time=datetime.now().isoformat(), tools=tools_desc
            )
            react_prompt += (
                "\n\nIMPORTANT: You MUST respond in JSON format:\n"
                '{"thinking": "your step-by-step reasoning", '
                '"action": {"tool": "tool_name", "args": {...}} or null, '
                '"final": "your final answer" or null}\n\n'
                "If you need to use a tool, set action to the tool call. "
                "If you have enough information to answer, set final to your answer. "
                "Never set both action and final in the same response."
            )

            llm = self.get_llm(temperature)
            prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", react_prompt),
                    *[
                        {"role": m["role"], "content": m["content"]}
                        for m in history[-10:]
                    ],
                    ("human", "{message}"),
                ]
            )

            try:
                chain = prompt | llm
                response = chain.invoke({"message": message})
                raw = response.content if hasattr(response, "content") else str(response)
            except Exception as e:
                logger.error("[%s] ReAct LLM error (turn %d): %s", self.name, turn, e)
                return {
                    "thinking": "\n".join(thinking_log),
                    "text": "Maaf kijiye, processing mein error aaya.",
                    "tool_calls": tool_results,
                }

            parsed = self._parse_react_json(raw)
            if parsed is None:
                # Couldn't parse JSON — treat as direct answer
                thinking_log.append(f"[Turn {turn+1}] " + raw[:200])
                return {
                    "thinking": "\n".join(thinking_log),
                    "text": raw,
                    "tool_calls": tool_results,
                }

            thinking_log.append(f"[Turn {turn+1}] {parsed.get('thinking', '')}")

            action = parsed.get("action")
            final = parsed.get("final")

            if final and not action:
                return {
                    "thinking": "\n".join(thinking_log),
                    "text": final,
                    "tool_calls": tool_results,
                }

            if action and isinstance(action, dict) and "tool" in action:
                tool_name = action["tool"]
                tool_args = action.get("args", {})

                tool_result = await self._call_tool(tool_name, tool_args)
                result_text = (
                    tool_result
                    if isinstance(tool_result, str)
                    else json.dumps(tool_result, default=str)
                )
                tool_results.append(
                    {"tool": tool_name, "args": tool_args, "result": result_text[:500]}
                )
                turn += 1

                history.append(
                    {
                        "role": "assistant",
                        "content": f"[Tool call: {tool_name}({json.dumps(tool_args)})]",
                    }
                )
                history.append(
                    {
                        "role": "system",
                        "content": f"[Tool result from {tool_name}]: {result_text}",
                    }
                )
                message = (
                    f"The tool {tool_name} returned this result. "
                    f"Use it to answer the original question: {result_text}"
                )
                continue

            # No clear action or final — return what we have
            return {
                "thinking": "\n".join(thinking_log),
                "text": parsed.get("thinking", raw),
                "tool_calls": tool_results,
            }

        return {
            "thinking": "\n".join(thinking_log),
            "text": "Main ne multiple tools try kiye lekin final answer nahi nikaal paaya."
            " Thoda aur specific poochhiye.",
            "tool_calls": tool_results,
        }

    # ── Tool Execution Helpers ───────────────────────────────────────────

    def _parse_react_json(self, raw: str) -> Optional[dict]:
        """Extract JSON from LLM response (handles markdown code blocks)."""
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
        m = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw)
        if m:
            try:
                return json.loads(m.group(1))
            except json.JSONDecodeError:
                pass
        m = re.search(r"\{[\s\S]*\"thinking\"[\s\S]*\}", raw)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                pass
        return None

    async def _call_tool(self, tool_name: str, args: dict) -> Any:
        """Execute a tool from instance or global registry."""
        tools = self._all_tools()

        if tool_name not in tools:
            available = ", ".join(tools.keys())
            return f"Tool '{tool_name}' not found. Available: {available}"

        tool_info = tools[tool_name]
        fn = tool_info["fn"]
        is_async = tool_info.get("is_async", False)

        try:
            if is_async:
                result = await fn(**args)
            else:
                result = fn(**args)
            return result
        except TypeError as e:
            return f"Tool args error for '{tool_name}': {e}. Expected args: check tool signature."
        except Exception as e:
            logger.error("[%s] Tool '%s' error: %s", self.name, tool_name, e)
            return f"Tool '{tool_name}' failed: {e}"

    # ── Any-to-Any File Processing ───────────────────────────────────────

    async def process_file(
        self, file_bytes: bytes, filename: str, mime_type: str = ""
    ) -> str:
        """Auto-detect file type and route to the correct processor.

        Returns extracted text that can be passed to think() for analysis.
        """
        from media.router import process_file as media_process_file

        return await media_process_file(file_bytes, filename, mime_type)

    # ── Bus Messaging ────────────────────────────────────────────────────

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

    # ── Bus Message Handler ──────────────────────────────────────────────

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
                    payload={
                        "text": result.text,
                        "data": result.data,
                        "thinking": result.thinking,
                    },
                    correlation_id=correlation_id,
                    conversation_id=conversation_id,
                )

    # ── Main Request Handler ─────────────────────────────────────────────

    async def process_request(
        self,
        user_message: str,
        user_id: str,
        user_role: str = "CLERK",
        conversation_id: Optional[str] = None,
        *,
        use_react: bool = True,
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

        if use_react and self._all_tools():
            result = await self.think_with_tools(user_message, context)
            reply = result.get("text", "")
            thinking = result.get("thinking", "")
            data = result.get("tool_calls", [])
        else:
            reply = await self.think(user_message, context, use_cot=True)
            thinking = ""
            data = []

        memory.add_message(self.name, conv_id, "assistant", reply)

        return AgentResponse(text=reply, data=data, thinking=thinking)
