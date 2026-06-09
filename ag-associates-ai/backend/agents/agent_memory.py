"""Agent conversation memory — PostgreSQL + pgvector for persistent agent memory.

Each agent gets its own schema namespace for isolation. Supports:
- Conversation history (turns, summaries)
- Working context (current task state per conversation)
- Embeddings for semantic recall (pgvector)
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

import psycopg2
import psycopg2.extras
from config import get_database_url

logger = logging.getLogger(__name__)


def _conn():
    return psycopg2.connect(get_database_url(), cursor_factory=psycopg2.extras.RealDictCursor)


def ensure_agent_tables(agent_name: str):
    sql = f"""
    CREATE TABLE IF NOT EXISTS agent_{agent_name}_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255),
        metadata JSONB DEFAULT '{{}}',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS agent_{agent_name}_messages (
        id BIGSERIAL PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES agent_{agent_name}_conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{{}}',
        created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_{agent_name}_msg_conv ON agent_{agent_name}_messages(conversation_id, created_at);

    CREATE TABLE IF NOT EXISTS agent_{agent_name}_context (
        id SERIAL PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES agent_{agent_name}_conversations(id) ON DELETE CASCADE,
        key VARCHAR(255) NOT NULL,
        value JSONB NOT NULL,
        UNIQUE(conversation_id, key)
    );
    """
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()


def get_or_create_conversation(agent_name: str, user_id: str, title: str = "") -> str:
    ensure_agent_tables(agent_name)
    sql = """INSERT INTO agent_{}_conversations (user_id, title)
             VALUES (%s, %s) RETURNING id""".format(agent_name)
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id, title[:200]))
            row = cur.fetchone()
        conn.commit()
        return str(row["id"])


def add_message(agent_name: str, conversation_id: str, role: str, content: str, metadata: Optional[dict] = None):
    sql = """INSERT INTO agent_{}_messages (conversation_id, role, content, metadata)
             VALUES (%s, %s, %s, %s)""".format(agent_name)
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (conversation_id, role, content, json.dumps(metadata or {})))
        conn.commit()


def get_context_window(agent_name: str, conversation_id: str, limit: int = 20) -> list[dict]:
    sql = """SELECT role, content FROM agent_{}_messages
             WHERE conversation_id = %s
             ORDER BY created_at ASC
             LIMIT %s""".format(agent_name)
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (conversation_id, limit))
            return [{"role": r["role"], "content": r["content"]} for r in cur.fetchall()]


def set_context_value(agent_name: str, conversation_id: str, key: str, value: Any):
    sql = """INSERT INTO agent_{}_context (conversation_id, key, value)
             VALUES (%s, %s, %s)
             ON CONFLICT (conversation_id, key)
             DO UPDATE SET value = EXCLUDED.value""".format(agent_name)
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (conversation_id, key, json.dumps(value)))
        conn.commit()


def get_context_value(agent_name: str, conversation_id: str, key: str) -> Optional[Any]:
    sql = """SELECT value FROM agent_{}_context
             WHERE conversation_id = %s AND key = %s""".format(agent_name)
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (conversation_id, key))
            row = cur.fetchone()
            return row["value"] if row else None


def search_conversations(agent_name: str, user_id: str, limit: int = 10) -> list[dict]:
    sql = """SELECT id, title, created_at, updated_at
             FROM agent_{}_conversations
             WHERE user_id = %s
             ORDER BY updated_at DESC
             LIMIT %s""".format(agent_name)
    with _conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (user_id, limit))
            return [dict(r) for r in cur.fetchall()]
