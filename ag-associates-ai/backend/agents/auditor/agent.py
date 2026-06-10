"""Auditor Agent — conversational financial auditor with Hinglish personality.

Wraps the BaseAgent with Auditor-specific tools and personality.
Can audit Excel files, detect anomalies, and proactively DM critical findings.
"""

import logging
from typing import Optional

from agents.base_agent import BaseAgent, AgentResponse
from agents.agent_memory import (
    get_or_create_conversation,
    add_message,
    get_context_window,
)
from .prompts import AUDITOR_PERSONA
from . import tools

logger = logging.getLogger(__name__)


class AuditorAgent(BaseAgent):
    """Financial Auditor — bank statements, anomalies, balance sheets."""

    def __init__(self):
        super().__init__(
            name="auditor",
            persona_prompt=AUDITOR_PERSONA,
            required_permission="agent.auditor.access",
        )
        self.register_tool(
            "audit_excel",
            tools.audit_excel,
            "Audit an Excel file (.xlsx) for financial analysis",
        )
        self.register_tool(
            "check_balance_sheet",
            tools.check_balance_sheet,
            "Verify Assets = Liabilities + Equity",
        )
        self.register_tool(
            "detect_duplicates", tools.detect_duplicates, "Find duplicate transactions"
        )
        self.register_tool(
            "rent_roll_summary",
            tools.rent_roll_summary,
            "Generate NOI rent roll summary",
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
                "❌ Auditor agent ke liye aapke paas permission nahi hai. "
                "Executive ya upar ke role required hai."
            )

        conv_id = conversation_id or get_or_create_conversation(
            self.name, user_id, title=user_message[:100]
        )
        add_message(self.name, conv_id, "user", user_message)
        context = get_context_window(self.name, conv_id)

        # Check for explicit tool invocation patterns in message
        tool_result = None
        msg_lower = user_message.lower()

        if (
            "excel" in msg_lower
            or "xlsx" in msg_lower
            or "statement" in msg_lower
            or "audit" in msg_lower
        ):
            tool_result = (
                "📎 <b>File Instructions:</b>\n"
                "Agar aapke paas Excel file hai, toh mujhe forward karein — "
                "mein analyze karunga. Abhi text mode mein baat kar rahe hain."
            )

        reply = await self.think(user_message, context)

        if tool_result:
            reply = tool_result + "\n\n" + reply

        add_message(self.name, conv_id, "assistant", reply)
        return AgentResponse(reply)

    async def handle_file(
        self,
        file_bytes: bytes,
        filename: str,
        user_id: str,
        user_role: str = "CLERK",
        conversation_id: Optional[str] = None,
    ) -> Optional[AgentResponse]:
        if not self.check_access(user_role):
            return AgentResponse(
                "❌ Auditor agent ke liye aapke paas permission nahi hai."
            )

        conv_id = conversation_id or get_or_create_conversation(
            self.name, user_id, title=f"File: {filename}"
        )

        add_message(self.name, conv_id, "user", f"[Uploaded file: {filename}]")

        if filename.lower().endswith((".xlsx", ".xls")):
            report = await tools.audit_excel(file_bytes, filename)
        else:
            report = f"Unsupported file type: {filename}. Main sirf Excel files (.xlsx) analyze kar sakta hoon."

        add_message(self.name, conv_id, "assistant", report)
        return AgentResponse(report)


# Singleton for import convenience
auditor = AuditorAgent()
