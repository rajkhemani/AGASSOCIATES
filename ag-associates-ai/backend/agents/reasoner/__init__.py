"""Vyasa Deep Reasoner — multi-step legal reasoning agent.

Export:
    reasoner: Singleton ReasoningAgent instance
"""

from .agent import ReasoningAgent, reasoner

__all__ = ["ReasoningAgent", "reasoner"]
