# Hierarchical Multi-Agent Coordinator

A Telegram bot that coordinates a team of specialized AI agents in a hierarchical architecture.

## Architecture

```
USER → [COORDINATOR] → [SPECIALIST AGENTS] → [RESULT AGGREGATOR] → USER
                      ↖      ↑      ↗
                    PARALLEL EXECUTION
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables in `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   GEMINI_API_KEY=your_gemini_api_key
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=ag_coordinator
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```

3. Initialize database:
   ```bash
   npm run dev
   ```
   (The bot will automatically create required tables on startup)

4. Start the bot:
   ```bash
   npm run dev
   ```

## Usage in Telegram

- `/agent <request>` - Execute a complex task using the hierarchical agent system
- `/status` - View recent executions
- `/help` - Show detailed help and architecture diagram

## Example Requests

```
/agent Research current RBI home loan policies and create a summary for first-time buyers
/agent Analyze the pros and cons of fixed vs floating rate mortgages for 20-year terms
/agent Generate a Python script to calculate EMI with optional prepayment and tax benefits
/agent Review this loan agreement clause for potential issues and suggest improvements
```

## Response Format

The bot returns:
1. **Execution time** - Total duration
2. **Hierarchy status** - Visual status of each agent layer
3. **Final answer** - Synthesized result from all agents