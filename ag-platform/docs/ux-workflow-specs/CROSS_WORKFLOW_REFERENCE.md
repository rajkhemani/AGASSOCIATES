# Legal Workflow UX Specifications — Cross-Workflow Reference

**Version:** 1.0.0  
**Generated from:** Migrations 0009/0010 (workflow_persistence, approval_requests, audit, external_actions, bank_recovery_workflow, noi_pipeline)

---

## 1. Workflow Comparison Matrix

| Aspect | Bank Recovery | NOI | Mortgage Registration | Public Notice |
|--------|---------------|-----|----------------------|---------------|
| **Slug** | `bank_recovery` | `noi` | `mortgage_registration` | `public_notice` |
| **States** | 17 | 10 | 8 | 9 |
| **Terminal States** | 3 (SETTLED, ESCALATED, CONTINUE_RECOVERY) | 2 (COMPLETED, REJECTED) | 2 (CLOSED, CANCELLED) | 1 (CLOSED) |
| **Exception States** | 2 (REJECTED, DEADLINE_BREACHED) | 2 (RECTIFY, MISMATCH) | 2 (ON_HOLD, CANCELLED) | 2 (OBJECTION_RECEIVED, ESCALATED, ON_HOLD) |
| **Mandatory Gates** | 2 (Legal Basis, Approval) | 1 (Section 89B Window) | 1 (Internal Review) | 1 (Objection Window) |
| **Approval Required** | Yes (PRINCIPAL/ADVOCATE) | No | No | No |
| **Policy Gates** | 2 (notice_dispatch, external_action) | 0 | 0 | 0 |
| **Action Gateway** | Yes (7 channels) | No (GRAS/IGR direct) | No (SRO direct) | No (Newspaper direct) |
| **Statutory Deadlines** | 8 (incl. Section 89B 30d) | 1 (Section 89B 30d) | 0 (operational SLAs only) | 1 (Objection window 7/15/30d) |
| **AI Integration** | Full (extraction, drafting, confidence) | Partial (extraction) | Partial (drafting) | Partial (drafting) |
| **Audit Capture** | Comprehensive (all events) | Standard | Standard | Standard |

---

## 2. Common UX Patterns (Reusable Components)

### 2.1 Mandatory Gate Modal Pattern
**Used by:** Bank Recovery (Legal Basis, Approval), NOI (Verification), Mortgage (Internal Review), Public Notice (Title Verification)

```typescript
interface MandatoryGateModalProps {
  title: string;
  warningLevel: 'critical' | 'high' | 'medium';
  requiredFields: GateField[];
  evidenceSplitView?: SplitViewProps;
  onConfirm: (data: GateSubmission) => Promise<void>;
  onBack: () => void;
  roleRequired: UserRole[]; // e.g., ['ADVOCATE', 'PRINCIPAL']
}
```

### 2.2 Evidence-First Split View Pattern
**Used by:** All workflows at drafting/review stages

```typescript
interface EvidenceSplitViewProps {
  leftPane: ArtifactPane;    // Notice, deed, challan, draft
  rightPane: EvidencePane;   // Extracted fields, source docs, confidence
  resizable: true;
  defaultSplit: 60;
  onArtifactAction: (action: 'download' | 'edit' | 'regenerate') => void;
}
```

### 2.3 Statutory Deadline Countdown Pattern
**Used by:** Bank Recovery (8 deadlines), NOI (1), Public Notice (1)

```typescript
interface StatutoryDeadlineProps {
  label: string;
  type: 'statutory' | 'sla' | 'internal' | 'escalation';
  dueAt: Date;
  startsFrom: string;
  blocking: boolean;
  status: DeadlineStatus;
  windowDays?: number[];
  onBreach: () => void; // Triggers workflow transition
}
```

### 2.4 Approval Decision Screen Pattern
**Used by:** Bank Recovery only (mandatory approval gate)

```typescript
interface ApprovalDecisionScreenProps {
  caseSummary: CaseSummary;
  artifactPreview: ArtifactPreview; // Split view
  policyEvaluation: PolicyEvaluation;
  requiredApprovers: UserRole[];
  minApprovals: number;
  onApprove: (reason: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onEscalate: (reason: string) => Promise<void>;
}
```

### 2.5 Channel Dispatch Pattern (Action Gateway)
**Used by:** Bank Recovery only

```typescript
interface ChannelDispatchProps {
  channels: ChannelConfig[];
  idempotencyKey: string;
  retryPolicy: RetryPolicy;
  onDispatch: (selectedChannels: ChannelConfig[]) => Promise<void>;
  onProofOfService: (channel: string, proof: File) => Promise<void>;
}

interface ChannelConfig {
  id: string;
  name: string;
  mode: 'LIVE' | 'SANDBOX' | 'MOCK';
  health: 'healthy' | 'degraded' | 'down';
  payloadPreview: JSON;
}
```

---

## 3. Shared State Definitions (TypeScript)

```typescript
// Common workflow state types
type WorkflowSlug = 'bank_recovery' | 'noi' | 'mortgage_registration' | 'public_notice';

type WorkflowState = 
  // Bank Recovery
  | 'BANK_REFERRAL_RECEIVED' | 'CASE_CREATED' | 'DOCUMENTS_COLLECTED'
  | 'AI_EXTRACTION_COMPLETE' | 'LEGAL_BASIS_CONFIRMED' | 'NOTICE_DRAFTED'
  | 'LEGAL_VALIDATION_PENDING' | 'LEGAL_VALIDATION_COMPLETE'
  | 'APPROVAL_REQUESTED' | 'APPROVAL_GRANTED' | 'EXTERNAL_ACTION_DISPATCHED'
  | 'PROOF_OF_SERVICE_RECEIVED' | 'DEADLINE_TRACKING' | 'BORROWER_RESPONSE_RECEIVED'
  | 'SETTLED' | 'ESCALATED' | 'CONTINUE_RECOVERY' | 'REJECTED' | 'DEADLINE_BREACHED'
  // NOI
  | 'DOCUMENTS_RECEIVED' | 'CHALLAN_GENERATED' | 'CHALLAN_PAID' | 'VERIFIED'
  | 'NOI_DROP_RECEIVED' | 'RECTIFY' | 'NOI_FILED' | 'ACKNOWLEDGED' | 'COMPLETED' | 'MISMATCH'
  // Mortgage Registration
  | 'DRAFT_PREPARED' | 'INTERNAL_REVIEW' | 'APPROVED' | 'REGISTRATION_SCHEDULED'
  | 'REGISTERED' | 'DOCUMENTS_COLLECTED' | 'CLOSED' | 'CANCELLED' | 'ON_HOLD'
  // Public Notice
  | 'TITLE_VERIFICATION' | 'DRAFTED' | 'PUBLISHED' | 'AWAITING_OBJECTIONS'
  | 'OBJECTION_RECEIVED' | 'ESCALATED' | 'CLEAR';

type WorkflowStateCategory = 
  | 'initial' | 'process' | 'gate' | 'exception' | 'terminal';

interface WorkflowStateMetadata {
  slug: WorkflowSlug;
  state: WorkflowState;
  label: string;
  category: WorkflowStateCategory;
  allowedTransitions: WorkflowState[];
  deadlines: DeadlineConfig[];
  tasks: TaskDefinition[];
  requiresRole?: UserRole[];
  isBlocking?: boolean;
}
```

---

## 4. Screen Inventory Summary (All Workflows)

| Workflow | Screens | Unique Screens | Shared Pattern Screens |
|----------|---------|----------------|------------------------|
| Bank Recovery | 13 | 7 | 6 (Gate, Split View, Deadline, Approval, Dispatch, Task) |
| NOI | 9 | 4 | 5 (Gate, Split View, Deadline, Task, Rectification) |
| Mortgage Registration | 9 | 4 | 5 (Gate, Split View, Task, Scheduling, On Hold) |
| Public Notice | 10 | 4 | 6 (Gate, Split View, Deadline, Task, Publication, Objection) |
| **Total** | **41** | **19** | **22 shared pattern instances** |

### 4.1 Recommended Component Library

| Component | Workflows Using | Priority |
|-----------|----------------|----------|
| `MandatoryGateModal` | All 4 | P0 |
| `EvidenceSplitView` | All 4 | P0 |
| `StatutoryDeadlineBanner` | Bank Recovery, NOI, Public Notice | P0 |
| `StatutoryDeadlineDashboard` | Bank Recovery, NOI, Public Notice | P1 |
| `ApprovalDecisionScreen` | Bank Recovery | P0 |
| `ChannelDispatchPanel` | Bank Recovery | P0 |
| `TaskAssignmentCard` | All 4 | P1 |
| `WorkflowProgressTracker` | All 4 | P1 |
| `AuditHistoryPanel` | All 4 | P2 |
| `OnHoldManagement` | Mortgage, Public Notice | P2 |
| `RectificationFlow` | NOI | P1 |
| `SROSchedulingPanel` | Mortgage | P1 |
| `PublicationProofManager` | Public Notice | P1 |
| `ObjectionManagement` | Public Notice | P1 |

---

## 5. Integration Architecture (Frontend ↔ Backend)

### 5.1 Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend API    │     │   Database      │
│   (React/Vite)  │────▶│   (Express)      │────▶│   (PostgreSQL)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ State Machine   │     │ Workflow Engine  │     │ Tables:         │
│ Hook (useWorkflow)    │ (transitions,    │     │ workflow_instances│
│  - currentState │     │  tasks, deadlines)    │     │ tasks             │
│  - canTransition│     │                  │     │ deadlines         │
│  - transition() │     │ Policy Engine    │     │ approval_requests │
└─────────────────┘     │ (evaluations)    │     │ external_actions  │
                        │                  │     │ action_attempts   │
                        │ Action Gateway   │     │ audit_trail       │
                        │ (dispatch)       │     │ audit_log         │
                        └──────────────────┘     └─────────────────┘
```

### 5.2 Key API Endpoints (Per Workflow)

| Endpoint | Method | Workflow(s) | Purpose |
|----------|--------|-------------|---------|
| `/api/workflows/:slug/instances` | GET/POST | All | List/create workflow instances |
| `/api/workflows/:slug/instances/:id` | GET/PATCH | All | Get/update instance (state transition) |
| `/api/workflows/:slug/instances/:id/tasks` | GET/POST | All | List/create tasks |
| `/api/workflows/:slug/instances/:id/deadlines` | GET | All | Get deadlines with countdown |
| `/api/approvals/requests` | GET/POST | Bank Recovery | Approval queue |
| `/api/approvals/requests/:id/decision` | POST | Bank Recovery | Submit approval decision |
| `/api/external-actions` | POST | Bank Recovery | Dispatch via Action Gateway |
| `/api/external-actions/:id/attempts` | GET/POST | Bank Recovery | Track dispatch attempts |
| `/api/documents/:caseId/versions` | GET | All | Evidence for split view |
| `/api/ai/runs` | GET | Bank Recovery, NOI, Mortgage, Public Notice | Extraction/drafting runs |

---

## 6. Role-Based Screen Access

| Screen Pattern | ADVOCATE | PRINCIPAL | EXECUTIVE | CLERK | BANK_VIEWER | OPERATIONS |
|----------------|----------|-----------|-----------|-------|-------------|------------|
| Mandatory Gate Modal | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Evidence Split View | ✅ | ✅ | ✅ | ✅ | ✅ (read) | ✅ |
| Approval Decision | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Channel Dispatch | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Deadline Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Task Assignment | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Audit History | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SRO Scheduling | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Publication Management | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Objection Handling | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 7. Responsive Breakpoint Specifications

| Component | Mobile (< 640px) | Tablet (640-1024px) | Desktop (> 1024px) |
|-----------|------------------|---------------------|-------------------|
| EvidenceSplitView | Stacked (evidence below), full-width tabs | Side-by-side 50/50, collapsible evidence | 60/40 split, persistent evidence panel |
| MandatoryGateModal | Full-screen, bottom-sheet animation | Centered modal 90vw max-width | Centered modal 720px max-width |
| StatutoryDeadlineBanner | Full-width, sticky top, compact countdown | Sticky top, expanded with progress | Sticky sidebar widget + top banner |
| ApprovalDecisionScreen | Full-screen, stepper layout | Two-column (artifact left, decision right) | Three-column (case, artifact, decision) |
| ChannelDispatchPanel | Accordion per channel | Grid 2-col, sticky actions | Grid 3-4 col, persistent summary |
| WorkflowProgressTracker | Horizontal scroll tabs | Horizontal tabs with labels | Vertical sidebar with state details |
| TaskAssignmentCard | Stacked list, swipe actions | Card grid 2-col | Card grid 3-4 col with filters |

---

## 8. Accessibility Checklist (WCAG 2.2 AA)

### 8.1 All Components Must:
- [ ] Semantic HTML structure (headings, landmarks, lists)
- [ ] Focus management (traps in modals, returns to trigger)
- [ ] Color contrast ≥ 4.5:1 (text), ≥ 3:1 (UI components)
- [ ] Color not sole indicator (icons + text for status)
- [ ] Keyboard operable (Tab, Enter, Escape, Arrow keys)
- [ ] Screen reader labels (aria-label, aria-describedby)
- [ ] Live regions for dynamic content (countdowns, status changes)
- [ ] Reduced motion respected (no auto-play animation)
- [ ] Text resize to 200% without loss of function
- [ ] Touch targets ≥ 44×44px

### 8.2 Workflow-Specific:
- [ ] **Deadline countdowns:** aria-live="polite", announced at 1h, 30m, 10m, 5m, 1m
- [ ] **Gate modals:** aria-modal="true", aria-labelledby="gate-title"
- [ ] **Split views:** role="region", aria-label="Evidence panel"
- [ ] **Channel badges:** Text equivalents for LIVE/SANDBOX/MOCK
- [ ] **Approval decisions:** Confirmation dialog before irreversible actions

---

## 9. Implementation Priority (MVP)

### Phase 1 (Core - Bank Recovery Golden Path)
1. `WorkflowProgressTracker` — Universal state visualization
2. `EvidenceSplitView` — Bank Recovery notice drafting + NOI challan + Mortgage draft + Public Notice draft
3. `MandatoryGateModal` — Bank Recovery Legal Basis + Approval
4. `StatutoryDeadlineBanner` — Bank Recovery (8), NOI (1), Public Notice (1)
5. `ApprovalDecisionScreen` — Bank Recovery approval queue
6. `ChannelDispatchPanel` — Bank Recovery Action Gateway
6. `TaskAssignmentCard` — All workflows

### Phase 2 (Workflow Completion)
7. `RectificationFlow` — NOI
8. `SROSchedulingPanel` — Mortgage Registration
9. `PublicationProofManager` — Public Notice
10. `ObjectionManagement` — Public Notice
11. `OnHoldManagement` — Mortgage, Public Notice

### Phase 3 (Dashboard & Analytics)
12. `StatutoryDeadlineDashboard` — Portfolio view
13. `AuditHistoryPanel` — All workflows
14. Role-based navigation & permissions

---

## 10. File Inventory (This Deliverable)

```
AGASSOCIATES/ag-platform/docs/ux-workflow-specs/
├── BANK_RECOVERY_WORKFLOW_UX.md          (17 states, golden path)
├── NOI_WORKFLOW_UX.md                     (10 states, Section 89B window)
├── MORTGAGE_REGISTRATION_WORKFLOW_UX.md   (8 states, SRO integration)
├── PUBLIC_NOTICE_WORKFLOW_UX.md           (9 states, objection window)
└── CROSS_WORKFLOW_REFERENCE.md            (this file)
```

---

## 11. Next Steps for Team

| Team Member | Action Items |
|-------------|--------------|
| **interaction-designer** | Convert split-view, gate modal, deadline patterns to Figma components |
| **design-system** | Build reusable React components from patterns in Section 2 |
| **accessibility** | Audit all patterns against WCAG 2.2 AA checklist (Section 8) |
| **ux-writer** | Create copy decks for gate modals, approval screens, deadline messages |
| **frontend-arch** | Implement `useWorkflow` hook, API client, state machine integration |
| **ia-architect** | Map screens to IA navigation, define deep-linking for task assignments |

---

*Document Version: 1.0.0*  
*Part of: Luxor9 Legal OS MVP UI/UX Implementation*