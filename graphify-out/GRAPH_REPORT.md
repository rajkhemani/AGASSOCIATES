# Graph Report - /home/luxor9/AGASSOCIATES-github  (2026-08-02)

## Corpus Check
- 196 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1497 nodes · 2741 edges · 108 communities (81 shown, 27 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 125 edges (avg confidence: 0.6)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 104

## God Nodes (most connected - your core abstractions)
1. `BaseAgent` - 37 edges
2. `AgentResponse` - 33 edges
3. `NeslClient` - 28 edges
4. `get_database_url()` - 26 edges
5. `record_activity()` - 24 edges
6. `UnifiedController` - 23 edges
7. `main()` - 22 edges
8. `get_or_create_conversation()` - 20 edges
9. `add_message()` - 19 edges
10. `AuthContext` - 19 edges

## Surprising Connections (you probably didn't know these)
- `_legal_draft()` --indirect_call--> `process_rental_request()`  [INFERRED]
  ag-associates-ai/backend/aisha_core.py → ag-associates-ai/backend/agents/__init__.py
- `AccountantAgent` --uses--> `BaseAgent`  [INFERRED]
  ag-associates-ai/backend/agents/accountant/agent.py → ag-associates-ai/backend/agents/base_agent.py
- `build_agent_graph()` --indirect_call--> `aisha_intake_node()`  [INFERRED]
  ag-associates-ai/backend/agents/graph.py → ag-associates-ai/backend/agents/aisha.py
- `build_agent_graph()` --indirect_call--> `auditor_node()`  [INFERRED]
  ag-associates-ai/backend/agents/graph.py → ag-associates-ai/backend/agents/auditor.py
- `AuditorAgent` --uses--> `BaseAgent`  [INFERRED]
  ag-associates-ai/backend/agents/auditor/agent.py → ag-associates-ai/backend/agents/base_agent.py

## Import Cycles
- None detected.

## Communities (108 total, 27 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (53): AgentState, aisha_intake_node(), auditor_node(), bouncer_node(), build_agent_graph(), drafter_node(), _extract_numeric(), generate_embedding() (+45 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (59): aisha_command(), aisha_message_handler(), audit_command(), _autoforward_key(), autootp_command(), button_callback(), _call_aisha_and_reply(), _call_aisha_api() (+51 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (31): AdvisorCockpit(), ApplicantDashboard(), BankPortal(), EmptyState(), EmptyStateProps, ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (47): AnyInputRouter, _classify_content(), _detect_type(), Any-to-Any Input Router — universal input type detection and routing. Detects…, Detect input type from filename extension or MIME., Route to the correct media processor., Try to extract structured fields from documents., Classify content as legal, financial, or general. (+39 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (46): get_agent(), _admin_command(), classify_intent(), _delegate_to_agent(), _general_chat(), handle_message(), _legal_draft(), Any (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (34): _decode_session(), google_callback(), login(), logout(), me(), _mint_session(), get, post (+26 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (23): CircuitBreaker, CircuitBreakerConfig, CircuitState, get_breaker(), Enum, Redis, Redis-backed circuit breaker for RPA portal automations. Prevents account…, IgrRpaExecutor (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (20): Accountant Agent — financial reports and billing., Agent initialisation — registers all agents, starts bus listeners. Call…, add_message(), _conn(), ensure_agent_tables(), get_context_value(), get_context_window(), get_or_create_conversation() (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (17): NOIAgent, Any, Fetch case details from Supabase (or Redis/in-memory fallback)., Update the NOI status of a case in Supabase + record timeline. Validates…, Seed a test case in Redis (shared across workers) for development/testing.…, Append to case_timeline table., Step 1: Generate GRAS challan for the NOI case. Returns challan details…, Step 2: Verify documents against NOI checklist. (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (22): get_accessible_agents(), list_agents(), Agent Registry — discoverable registry of all conversational agents. Maps…, _fetch_role(), Role, FastAPI dependencies that bridge Google OAuth → RBAC AuthContext. Combines…, Lookup user's role from Supabase profiles table. Falls back to BANK_VIEWER when…, FastAPI dependency factory — gates an endpoint by permission. Usage:… (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (13): ConversationService, Wrapper for the OpenAI Conversations API. Manages stateful conversation objects…, Creates a new conversation and returns its ID., Adds a text message item to the conversation., Adds a tool response item to the conversation., Retrieves conversation details., Lists items in a conversation., MCPClient (+5 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (16): COMPARE, FLYWHEEL, LANDING_AGENTS, LANDING_STEPS, LandingAgent, AGTheme, AGTweakState, DEFAULT_TWEAKS (+8 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): ActivityFeed(), Comment, CommentThreadProps, LivePresence(), NotificationBell(), COLUMNS, Task, TaskBoard() (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (26): analyze_agreement_amounts(), audit_excel(), check_balance_sheet(), detect_duplicates(), Auditor agent tools — financial analysis functions. Wraps existing…, Generate a rent roll summary for NOI portfolio analysis. Args: properties: List…, Audit an Excel file (.xlsx/.xls) — bank statement, balance sheet, or P&L. Args:…, Compare agreement rent amounts with actual bank transactions. Args:… (+18 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (18): PaymentRecord, PaymentStatus, Enum, create_payment_intent(), _get_stripe_client(), _get_webhook_handler(), post, Request (+10 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (12): BaseAgent, get_tools_for_agent(), Any, Role, Base class for all multi-agent system agents. Subclasses override…, Merge instance tools with global registry tools for this agent., Single-turn LLM call with optional chain-of-thought. When use_cot=True, the…, Multi-turn ReAct loop: Think → Act → Observe → Think → Answer. Returns:… (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (12): AccountantAgent, AuditorAgent, Financial Auditor — bank statements, anomalies, balance sheets., Auditor Agent — Hinglish financial auditor for AG Associates., AgentResponse, Structured response from an agent., DrafterAgent, ExecutorAgent (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (20): aisha_intake_node(), AgentState, traceable, Node 1: Aisha — Intake agent that extracts structured fields from raw text., Extract intake variables from the user's raw text., auditor_node(), AgentState, Node 3: Auditor — quality-assurance check on the drafted document. (+12 more)

### Community 18 - "Community 18"
Cohesion: 0.11
Nodes (24): create_case(), decode_str(), extract_loan_details(), extract_payment_from_image(), fetch_new_emails(), health_server(), is_bank_email(), LoanSanctionExtract (+16 more)

### Community 19 - "Community 19"
Cohesion: 0.13
Nodes (19): GrasRPAExecutor, Any, Agent 5: The Executor (RPA & API Operations) Uses Playwright to completely…, Notifies staff via Telegram that an OTP is needed, then waits for it to arrive…, Takes mathematically validated JSON and auto-fills the GRAS portal. Completely…, # NOTE: The below selectors are placeholders for the actual GRAS portal DOM, _bot_url(), configured() (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (14): FilePreviewer(), FilePreviewerProps, FileUploader(), FileUploaderProps, getFileIcon(), VersionHistoryProps, downloadFile(), getSignedUrl() (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (18): build_agent_graph(), _check_bouncer(), _check_guardrail(), process_rental_request(), AgentState, Any, StateGraph, StateGraph wiring + public entrypoint for the pipeline. (+10 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (10): NeslClient, Any, NeslClient — Dual-mode NeSL (National e-Services Ltd) e-filing client. Modes…, Obtain NeSL API access token using client credentials., Playwright-based IGR portal e-filing fallback., Simulated filing — returns fake acknowledgment after configured delay., Check filing status on NeSL/IGR portal., NeSL e-filing client with automatic mode selection. (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.27
Nodes (19): assign_task(), capability_matrix(), case_timeline(), _exec(), grant_capability(), list_activity(), list_capabilities(), list_staff() (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (18): AGENTS, BANK_COLORS, CaseCard(), cn(), daysUntil(), EscalationMatrix(), EscalationTier, formatCurrency() (+10 more)

### Community 25 - "Community 25"
Cohesion: 0.12
Nodes (14): Decorator: register a function as a tool available to agents. Can be used…, register_tool(), cite_legal_sources(), cross_reference_documents(), Vyasa Deep Reasoner — multi-step legal reasoning agent. Capabilities: - Multi-…, Deep reasoning agent for complex legal analysis. Uses multi-step reasoning,…, Handle a request with deep reasoning. Uses the ReAct loop to search knowledge…, Search pgvector for relevant legal documents. (+6 more)

### Community 26 - "Community 26"
Cohesion: 0.14
Nodes (14): get_database_url(), generate_embeddings(), Embedding generator script for legal templates Generates vector embeddings for…, Generate embeddings for all templates without embeddings, check(), _conn(), get_config(), invalidate() (+6 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (18): nesl_execute(), NeslExecuteRequest, NeslExecuteResponse, noi_seed(), noi_status(), noi_webhook(), noi_workflow(), NOISeedRequest (+10 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (17): ACTIVITY, ActivityEntry, BANK_VOLUMES, CASES, CONSOLE_AGENTS, CONSOLE_STEPS, ConsoleAgent, ConsoleCase (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (12): _persist_outputs(), AgentState, Write the Markdown and (best-effort) PDF to OUTPUT_DIR., AgreementPDFGenerator, convert_to_pdf(), PDF Generator Module for AG Associates AI Converts markdown/text agreements to…, Parse markdown content into ReportLab flowables, Generate a PDF from agreement content Args: content: The agreement… (+4 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (18): _archive_audio(), confirm_voice_command(), handle_voice_command(), list_voice_tools(), get, post, Upload the raw audio to the S3 vault for later replay. Returns the S3 key on…, Receive an audio blob, transcribe it, route to a tool, gate by risk. (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (11): Register all agents in the registry., register_all(), register(), generate_report(), Any, BaseModel, Dispatch a tool by name. Raises KeyError if the tool isn't registered., status_query() (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.21
Nodes (11): get_nesl_client(), MockNeslClient, NeslClient, NeslFilingRequest, NeslFilingResult, ProductionNeslClient, BaseModel, NeSL filing client. Two implementations behind one interface, selected by… (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.20
Nodes (11): Message, cn(), LoginPage(), Role, ProtectedRoute(), ProtectedRouteProps, supabase, AuthSession (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (10): GeneratedOutput, OutputGenerator, Any-to-Any Output Generator — multi-format response generation. Routes agent…, Format as PDF document using ReportLab., Format as audio using Piper TTS., Output from the generator., Generate output in any format from agent responses., Generate output in the requested format. Args: response_text: The agent's text… (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.20
Nodes (9): _get_nesl_client(), MockNeslClient, nesl_file(), NeslClient, NeslFilingRequest, NeslFilingResult, ProductionNeslClient, Unified NeSL client — picks mock or production based on env. (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (9): Vyasa Voice Control — Phase 1. Open-source voice-to-action pipeline: audio →…, _process_transcript(), Admin Voice Control API — Phase 1. Hardened entrypoint for the voice automation…, Shared route+risk+execute pipeline used by mic, wake-word, and WhatsApp., _record_activity(), _risk_of(), get_vox_router(), Uses LLM to route transcribed voice commands to specific tools. (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.28
Nodes (5): HITLQueue, HITLTaskStatus, Enum, Redis, Human-in-the-Loop (HITL) task queue for RPA circuit breaker fallback. When a…

### Community 38 - "Community 38"
Cohesion: 0.27
Nodes (13): _conn(), get_latest_pending_for_user(), get_pending(), log_command(), mark_confirmed(), mark_denied(), Any, Append-only audit log for the voice command system. Writes are best-effort: an… (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.19
Nodes (12): AgLogo(), Eyebrow(), LiveDot(), Pill(), PILL_TONES, SANS, SERIF, ConsoleRoute (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.21
Nodes (12): ActivityTab(), CasesTab(), CaseStatus, cn(), formatCurrency(), MobileCase, MOCK_MOBILE_CASES, ScannerTab() (+4 more)

### Community 41 - "Community 41"
Cohesion: 0.26
Nodes (12): ensure_bus_group(), get_bus_redis(), listen_agent(), publish_response(), Any, Redis, Agent Bus — Redis Streams based agent-to-agent communication. Message schema…, _redis_url() (+4 more)

### Community 42 - "Community 42"
Cohesion: 0.23
Nodes (10): bouncer_node(), AgentState, traceable, Node 1.7: Bouncer — mathematical sanity check on stamp duty paid., Verify stamp duty paid ≈ 0.3% of (rent × months) within ₹50 tolerance., duration_to_months(), extract_numeric(), Shared stamp duty validation — used by both LangGraph rental pipeline and NOI… (+2 more)

### Community 43 - "Community 43"
Cohesion: 0.17
Nodes (10): FastAPI dependency — produces AuthContext from session cookie. Usage:…, require_auth(), AuthContext, Injected into request handlers after auth verification., hitl_claim_task(), hitl_complete_task(), HITLClaimRequest, HITLCompleteRequest (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.19
Nodes (10): AppShell(), ConsoleApp, EditorialLanding, Navigation(), NoiPipeline, useChromeless(), WorkflowDashboard, CaseOption (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.26
Nodes (11): add_to_whitelist(), broadcast_to_role(), get_redis(), get_whitelist(), is_whitelisted(), Redis, Private Messenger — agent-initiated Telegram DMs. Agents can send proactive…, Send a Telegram DM to a whitelisted user. (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.17
Nodes (6): Test that extract_text_from_pdf raises an error if the path is a directory., Test that extract_text_from_pdf raises an error if the file exceeds the 10MB…, Test that extract_text_from_pdf raises an error if the file is not a valid PDF., Test that valid PDF text is successfully extracted and sanitized., Test that extract_text_from_pdf raises an error for non-existent files., TestAccountantAgentSecurity

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (8): ThemeContext, ThemeContextValue, ThemeProvider(), baseTokens, editorialTokens, glassTokens, ThemeMode, TokenSet

### Community 49 - "Community 49"
Cohesion: 0.27
Nodes (9): generate_embedding(), get_db_connection(), _get_embedding_model(), Any, Postgres + pgvector helpers shared across the pipeline nodes., Create a connection with pgvector registered. Caller closes., Generate a vector embedding. Returns zero vector if model unavailable., Vector similarity search across legal_templates. (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.24
Nodes (6): Any, The main autonomous controller for AG Associates. Orchestrates workforce tasks…, Discovers and caches tools from all configured MCP servers., Main entry point for handling a user request via the unified controller., Directly executes an MCP action and returns result., UnifiedController

### Community 51 - "Community 51"
Cohesion: 0.27
Nodes (10): AgreementRequest, generate_agreement(), n8n_intake_webhook(), Any, post, Entry point for n8n WhatsApp triggers — routes through unified Aisha. Expects…, Direct API entry for generating rental agreements — routes through unified…, Stub webhook for n8n intake. Acknowledges receipt only — the LangGraph/CrewAI… (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.24
Nodes (6): BaseModel, Assigns a task to a member (human or agent)., Allows agents to self-report their health/status., WorkforceMember, WorkforceService, WorkforceTask

### Community 53 - "Community 53"
Cohesion: 0.33
Nodes (7): MONO, ConnectionIndicator(), LiveDashboard(), ActivityUpdate, CaseUpdate, isConfigured(), useDashboardRealtime()

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (8): guardrail_node(), AgentState, traceable, Node 1.5: Guardrail — regex anti-hallucination checks on Aisha's output., Hard-fail if critical extracted fields are missing or implausible., AgentState, TypedDict, State schema for the agent workflow. Tracks all variables through the pipeline:…

### Community 56 - "Community 56"
Cohesion: 0.22
Nodes (9): circuit_breaker_status(), health_check(), hitl_list_tasks(), get, Returns 200 OK if the system is fully operational., List pending HITL tasks (circuit breaker fallbacks requiring human action)., Get status of all RPA circuit breakers., scalar_html() (+1 more)

### Community 57 - "Community 57"
Cohesion: 0.22
Nodes (3): btn, User, Win

### Community 58 - "Community 58"
Cohesion: 0.28
Nodes (8): cn(), DashboardStatus, getAgentForStep(), STEP_COLORS, WORKFLOW_STEPS, WorkflowDashboard(), WorkflowState, WorkflowStep

### Community 59 - "Community 59"
Cohesion: 0.25
Nodes (7): ConsoleApp(), ConsoleAppProps, TITLES, AgentsScreen(), CaseDetail(), ClientPortal(), DeedPreview()

### Community 60 - "Community 60"
Cohesion: 0.25
Nodes (7): init_agents(), Full initialisation — register + start listeners., _shutdown_nesl(), shutdown_nesl_client(), _shutdown_playground(), _startup_store(), on_event

### Community 61 - "Community 61"
Cohesion: 0.25
Nodes (6): Activity, Capability, Grant, Staff, Summary, TimelineEntry

### Community 62 - "Community 62"
Cohesion: 0.39
Nodes (6): POLICY_CONTACT_EMAIL, POLICY_DPO_EMAIL, POLICY_LAST_UPDATED, POLICY_SECTIONS, PolicySection, PrivacyPolicy()

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (4): AccountantAgent, Any, Parses an IDBI bank statement PDF and validates the UTR + credited amount.…, Agent 6: The Accountant Deterministic financial reconciliation using pdfplumber…

### Community 64 - "Community 64"
Cohesion: 0.33
Nodes (6): generate_presigned_upload_url(), generate_presigned_url(), Generate a presigned URL to share an S3 object securely. `expiration` defaults…, Generate a presigned URL to upload an S3 object securely. `expiration` defaults…, Return a short-lived presigned URL the admin UI can use to replay the original…, voice_audio()

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (6): check_and_consume(), _client(), get_limit_for_capability(), Sliding-window rate limiter backed by Redis. Bucket key shape:…, Read the per-hour limit from Postgres. Cached for 30 s., Consume one slot. Returns {allowed, remaining, limit, reason}.

### Community 66 - "Community 66"
Cohesion: 0.33
Nodes (5): get_current_user(), Verify Supabase JWT token and extract user information. SUPABASE_JWT_SECRET is…, Dependency to get current authenticated user., verify_supabase_token(), HTTPAuthorizationCredentials

### Community 67 - "Community 67"
Cohesion: 0.67
Nodes (5): async_endpoint(), benchmark(), mock_db_call(), run_benchmark(), sync_endpoint()

### Community 68 - "Community 68"
Cohesion: 0.33
Nodes (5): classify_reply(), WhatsApp bridge — outbound confirmation prompts + inbound reply parsing.…, Send a 'reply YES to execute' message. Returns True on 2xx., Return 'approve' | 'deny' | 'unknown'., send_confirm_prompt()

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (3): get_whisper_service(), # NOTE: In a production environment with vLLM/GPU, use faster-whisper., WhisperService

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (5): BrainstormHub(), cn(), members, WorkforceControl(), WorkforceMember

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (4): _get_voice(), Piper TTS wrapper. Lazy-loads the voice model on first call. Falls back to…, Return WAV bytes for the given text. Empty bytes on failure/silent mode., synthesize()

### Community 72 - "Community 72"
Cohesion: 0.60
Nodes (4): main(), _post_command(), Standalone "Hey Vyasa" wake-word listener. Run this as its own process on the…, _record_wav()

### Community 74 - "Community 74"
Cohesion: 0.83
Nodes (3): decrypt_ciphertext(), encrypt_plaintext(), _get_key_bytes()

### Community 77 - "Community 77"
Cohesion: 0.83
Nodes (3): decryptPii(), encryptPii(), getKey()

## Knowledge Gaps
- **91 isolated node(s):** `deploy_agents.sh script`, `EditorialLanding`, `ConsoleApp`, `WorkflowDashboard`, `NoiPipeline` (+86 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_database_url()` connect `Community 26` to `Community 0`, `Community 65`, `Community 64`, `Community 4`, `Community 36`, `Community 38`, `Community 7`, `Community 49`, `Community 23`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `record_activity()` connect `Community 0` to `Community 4`, `Community 5`, `Community 6`, `Community 36`, `Community 8`, `Community 42`, `Community 17`, `Community 22`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `audit_excel()` connect `Community 13` to `Community 1`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `BaseAgent` (e.g. with `AccountantAgent` and `AuditorAgent`) actually correct?**
  _`BaseAgent` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `AgentResponse` (e.g. with `AccountantAgent` and `AuditorAgent`) actually correct?**
  _`AgentResponse` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `NeslClient` (e.g. with `AgreementRequest` and `HITLClaimRequest`) actually correct?**
  _`NeslClient` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `deploy_agents.sh script`, `EditorialLanding`, `ConsoleApp` to the rest of the system?**
  _91 weakly-connected nodes found - possible documentation gaps or missing edges._