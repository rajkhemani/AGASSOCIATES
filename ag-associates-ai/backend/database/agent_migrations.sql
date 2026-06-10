-- Agent System migrations
-- Run once: psql -U agadmin -d agdb -f backend/database/agent_migrations.sql

-- Agent conversation storage per agent
DO $$
DECLARE
    agent_name text;
    agents text[] := ARRAY['auditor', 'vyasa', 'bouncer', 'accountant', 'noi', 'executor', 'drafter'];
BEGIN
    FOREACH agent_name IN ARRAY agents
    LOOP
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS agent_%s_conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) NOT NULL,
                title VARCHAR(255),
                metadata JSONB DEFAULT ''{}''::jsonb,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            );', agent_name);

        EXECUTE format('
            CREATE TABLE IF NOT EXISTS agent_%s_messages (
                id BIGSERIAL PRIMARY KEY,
                conversation_id UUID NOT NULL REFERENCES agent_%s_conversations(id) ON DELETE CASCADE,
                role VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                metadata JSONB DEFAULT ''{}''::jsonb,
                created_at TIMESTAMPTZ DEFAULT now()
            );', agent_name, agent_name);

        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%s_msg_conv ON agent_%s_messages(conversation_id, created_at);', agent_name, agent_name);

        EXECUTE format('
            CREATE TABLE IF NOT EXISTS agent_%s_context (
                id SERIAL PRIMARY KEY,
                conversation_id UUID NOT NULL REFERENCES agent_%s_conversations(id) ON DELETE CASCADE,
                key VARCHAR(255) NOT NULL,
                value JSONB NOT NULL,
                UNIQUE(conversation_id, key)
            );', agent_name, agent_name);
    END LOOP;
END $$;

-- Agent bus log (for auditing inter-agent communication)
CREATE TABLE IF NOT EXISTS agent_bus_log (
    id BIGSERIAL PRIMARY KEY,
    message_id UUID,
    source VARCHAR(100) NOT NULL,
    target VARCHAR(100) NOT NULL,
    msg_type VARCHAR(50) NOT NULL,
    payload JSONB,
    conversation_id UUID,
    correlation_id UUID,
    hop_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bus_log_source ON agent_bus_log(source);
CREATE INDEX IF NOT EXISTS idx_bus_log_created ON agent_bus_log(created_at);

-- User-Telegram chat_id mapping for DMs
CREATE TABLE IF NOT EXISTS user_telegram_map (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    chat_id BIGINT NOT NULL UNIQUE,
    username VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent role overrides (per-user overrides to default RBAC)
CREATE TABLE IF NOT EXISTS agent_access_grants (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    granted_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, agent_name)
);
