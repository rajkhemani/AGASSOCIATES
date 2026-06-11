"""Vyasa Deep Reasoner — multi-step legal reasoning agent.

Capabilities:
- Multi-step chain-of-thought reasoning
- Legal knowledge base search (pgvector RAG)
- Cross-referencing across documents
- Citation generation
- Structured legal opinions
"""

from .prompts import REASONER_PERSONA

from ..base_agent import BaseAgent, AgentResponse, register_tool


@register_tool(
    "search_legal_knowledge",
    "Search the legal knowledge base for relevant case law, provisions, "
    "stamp duty schedules, property act sections, and compliance rules. "
    "Args: query (string) — the search query",
    agent="reasoner",
    category="legal",
)
async def search_legal_knowledge(query: str) -> str:
    """Search pgvector for relevant legal documents."""
    try:
        from ..db import similarity_search
        results = similarity_search(query, limit=5)
        if not results:
            return "No relevant legal documents found for this query."
        return "\n\n---\n".join(
            f"[Source: {r.get('title', 'Unknown')}]\n{r.get('content', '')[:500]}"
            for r in results
        )
    except ImportError:
        return "Legal knowledge base not available (pgvector not configured)."
    except Exception as e:
        return f"Knowledge search failed: {e}"


@register_tool(
    "cross_reference_documents",
    "Cross-reference facts across multiple documents for consistency. "
    "Args: documents (list of strings) — document texts to compare",
    agent="reasoner",
    category="legal",
)
async def cross_reference_documents(documents: list[str]) -> str:
    """Compare documents for consistency and highlight discrepancies."""
    if not documents or len(documents) < 2:
        return "Need at least 2 documents to cross-reference."

    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI
    from config import LLM_BASE_URL, LLM_MODEL_NAME

    llm = ChatOpenAI(
        model=LLM_MODEL_NAME,
        openai_api_base=LLM_BASE_URL,
        temperature=0.1,
    )

    docs_text = "\n\n---\n".join(
        f"Document {i+1}:\n{doc[:1000]}"
        for i, doc in enumerate(documents)
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a legal document cross-referencing expert. "
            "Compare these documents and identify:\n"
            "1. Consistency issues (conflicting facts, dates, amounts)\n"
            "2. Missing information across documents\n"
            "3. Potential compliance issues\n"
            "Return a structured analysis."
        )),
        ("human", "{docs}"),
    ])

    try:
        chain = prompt | llm
        response = chain.invoke({"docs": docs_text})
        return response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        return f"Cross-reference failed: {e}"


@register_tool(
    "cite_legal_sources",
    "Generate formal citations for legal conclusions. "
    "Args: claim (string) — the legal claim to cite sources for",
    agent="reasoner",
    category="legal",
)
async def cite_legal_sources(claim: str) -> str:
    """Generate proper legal citations for a claim."""
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_openai import ChatOpenAI
    from config import LLM_BASE_URL, LLM_MODEL_NAME

    llm = ChatOpenAI(
        model=LLM_MODEL_NAME,
        openai_api_base=LLM_BASE_URL,
        temperature=0.1,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are a legal citation expert. For the given legal claim, "
            "provide relevant citations from Indian law (Maharashtra Rent "
            "Control Act, Transfer of Property Act, Registration Act, "
            "Stamp Act, etc.). Include: act name, section number, and "
            "a brief explanation of applicability."
        )),
        ("human", "{claim}"),
    ])

    try:
        chain = prompt | llm
        response = chain.invoke({"claim": claim})
        return response.content if hasattr(response, "content") else str(response)
    except Exception as e:
        return f"Citation generation failed: {e}"


class ReasoningAgent(BaseAgent):
    """Deep reasoning agent for complex legal analysis.

    Uses multi-step reasoning, legal knowledge base search,
    and cross-referencing to produce thorough legal opinions.
    """

    def __init__(self):
        super().__init__(
            name="reasoner",
            persona_prompt=REASONER_PERSONA,
            min_role=None,
        )
        from auth.rbac import Role
        self.min_role = Role.CLERK

    async def process_request(
        self,
        user_message: str,
        user_id: str,
        user_role: str = "CLERK",
        conversation_id: str | None = None,
    ) -> AgentResponse | None:
        """Handle a request with deep reasoning.

        Uses the ReAct loop to search knowledge base, cross-reference,
        and generate citations before producing a final answer.
        """
        if not self.check_access(user_role):
            return AgentResponse(
                "Aapke paas reasoner agent ke liye permission nahi hai."
            )

        from .. import agent_memory as memory

        conv_id = conversation_id or memory.get_or_create_conversation(
            self.name, user_id, title=user_message[:100]
        )
        memory.add_message(self.name, conv_id, "user", user_message)

        context = memory.get_context_window(self.name, conv_id)

        # Use ReAct loop for deep reasoning
        result = await self.think_with_tools(user_message, context)

        reply = result.get("text", "")
        thinking = result.get("thinking", "")
        tool_calls = result.get("tool_calls", [])

        if thinking:
            reply = f"*Reasoning:*\n{thinking}\n\n*Conclusion:*\n{reply}"

        memory.add_message(self.name, conv_id, "assistant", reply)

        return AgentResponse(
            text=reply,
            data={"tool_calls": tool_calls} if tool_calls else {},
            thinking=thinking,
        )


# Singleton
reasoner = ReasoningAgent()