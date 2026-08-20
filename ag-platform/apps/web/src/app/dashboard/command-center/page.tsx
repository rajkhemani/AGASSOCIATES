"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  Card,
  Badge,
  Table,
  Th,
  Td,
  Input,
  Select,
  Modal,
  Panel,
} from "@ag/ui";
import { useTheme } from "@ag/ui";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────

interface Case {
  id: string;
  case_number: string;
  borrower_name: string;
  case_type: string;
  status: string;
  bank_id: string;
  loan_amount: number;
  sla_deadline: string;
  assigned_executive_id?: string;
  recovery_status?: string;
  risk_level?: "critical" | "warning" | "normal";
  hours_until_sla?: number;
  is_overdue?: boolean;
}

interface ApprovalRequest {
  id: string;
  case_id: string;
  object_type: string;
  requested_by: string;
  required_approvers: string[];
  status: string;
  requested_at: string;
  expires_at: string;
}

interface AiRun {
  id: string;
  case_id: string;
  agent: string;
  model_route: string;
  confidence: number;
  risk_flags: string[];
  status: string;
  created_at: string;
}

interface Deadline {
  id: string;
  case_id: string;
  deadline_type: "statutory" | "sla" | "internal" | "escalation";
  label: string;
  due_at: string;
  hours_until_due: number;
  status: "pending" | "triggered" | "completed" | "breached";
}

interface ExternalAction {
  id: string;
  case_id: string;
  action_type: string;
  channel: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "retrying";
  adapter_mode: "LIVE" | "SANDBOX" | "MOCK";
  attempt_count: number;
  last_attempt_at?: string;
}

interface BankActivity {
  bank_id: string;
  short_code: string;
  name: string;
  case_count: number;
  active_cases: number;
  avg_tat_hours: number;
  sla_breaches: number;
}

interface SystemHealth {
  database: "healthy" | "degraded" | "down";
  redis: "healthy" | "degraded" | "down";
  aiBackend: "healthy" | "degraded" | "down";
  externalAdapters: Record<string, "LIVE" | "SANDBOX" | "MOCK" | "NOT_CONFIGURED">;
}

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  isDefault?: boolean;
}

// ─── Mock Data (replace with real API calls) ──────────────────────────

const MOCK_CASES: Case[] = [
  {
    id: "1",
    case_number: "LA-2024-001",
    borrower_name: "ABC Corp Ltd",
    case_type: "MORTGAGE_REGISTRATION",
    status: "IN_PROGRESS",
    bank_id: "SBI",
    loan_amount: 50000000,
    sla_deadline: "2024-01-20T17:00:00Z",
    assigned_executive_id: "exec-1",
    recovery_status: "active",
    risk_level: "critical",
    hours_until_sla: 12,
    is_overdue: false,
  },
  {
    id: "2",
    case_number: "LA-2024-002",
    borrower_name: "XYZ Industries",
    case_type: "TITLE_SEARCH",
    status: "DOCUMENT_COLLECTION",
    bank_id: "HDFC",
    loan_amount: 25000000,
    sla_deadline: "2024-01-19T10:00:00Z",
    assigned_executive_id: "exec-2",
    recovery_status: "active",
    risk_level: "warning",
    hours_until_sla: 36,
    is_overdue: false,
  },
  {
    id: "3",
    case_number: "LA-2024-003",
    borrower_name: "PQR Builders",
    case_type: "LEGAL_VETTING",
    status: "ASSIGNED",
    bank_id: "ICICI",
    loan_amount: 75000000,
    sla_deadline: "2024-01-18T15:00:00Z",
    assigned_executive_id: "exec-1",
    recovery_status: "active",
    risk_level: "normal",
    hours_until_sla: 48,
    is_overdue: false,
  },
];

const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: "ap-1",
    case_id: "1",
    object_type: "document_generation",
    requested_by: "advocate-1",
    required_approvers: ["principal-1"],
    status: "pending",
    requested_at: "2024-01-18T09:00:00Z",
    expires_at: "2024-01-20T09:00:00Z",
  },
  {
    id: "ap-2",
    case_id: "2",
    object_type: "external_action",
    requested_by: "exec-2",
    required_approvers: ["principal-1", "approver-1"],
    status: "pending",
    requested_at: "2024-01-18T10:30:00Z",
    expires_at: "2024-01-19T10:30:00Z",
  },
];

const MOCK_AI_TASKS: AiRun[] = [
  {
    id: "ai-1",
    case_id: "1",
    agent: "document_analyzer",
    model_route: "gemini-1.5-pro",
    confidence: 0.87,
    risk_flags: ["missing_signature", "date_mismatch"],
    status: "completed",
    created_at: "2024-01-18T08:00:00Z",
  },
  {
    id: "ai-2",
    case_id: "2",
    agent: "title_search",
    model_route: "gemini-1.5-flash",
    confidence: 0.92,
    risk_flags: [],
    status: "in_progress",
    created_at: "2024-01-18T11:00:00Z",
  },
];

const MOCK_DEADLINES: Deadline[] = [
  {
    id: "dl-1",
    case_id: "1",
    deadline_type: "statutory",
    label: "Section 89B Filing Window",
    due_at: "2024-01-20T17:00:00Z",
    hours_until_due: 12,
    status: "pending",
  },
  {
    id: "dl-2",
    case_id: "2",
    deadline_type: "sla",
    label: "Document Collection SLA",
    due_at: "2024-01-19T10:00:00Z",
    hours_until_due: 36,
    status: "pending",
  },
];

const MOCK_EXTERNAL_ACTIONS: ExternalAction[] = [
  {
    id: "ea-1",
    case_id: "1",
    action_type: "igr_registration",
    channel: "igr_maharashtra",
    status: "failed",
    adapter_mode: "LIVE",
    attempt_count: 3,
    last_attempt_at: "2024-01-18T12:00:00Z",
  },
  {
    id: "ea-2",
    case_id: "3",
    action_type: "cercai_search",
    channel: "cersai",
    status: "completed",
    adapter_mode: "LIVE",
    attempt_count: 1,
    last_attempt_at: "2024-01-18T09:30:00Z",
  },
];

const MOCK_BANK_ACTIVITY: BankActivity[] = [
  {
    bank_id: "SBI",
    short_code: "SBI",
    name: "State Bank of India",
    case_count: 45,
    active_cases: 23,
    avg_tat_hours: 48,
    sla_breaches: 2,
  },
  {
    bank_id: "HDFC",
    short_code: "HDFC",
    name: "HDFC Bank",
    case_count: 32,
    active_cases: 18,
    avg_tat_hours: 36,
    sla_breaches: 0,
  },
  {
    bank_id: "ICICI",
    short_code: "ICICI",
    name: "ICICI Bank",
    case_count: 28,
    active_cases: 15,
    avg_tat_hours: 52,
    sla_breaches: 1,
  },
];

const MOCK_SYSTEM_HEALTH: SystemHealth = {
  database: "healthy",
  redis: "healthy",
  aiBackend: "healthy",
  externalAdapters: {
    igr_maharashtra: "LIVE",
    cersai: "LIVE",
    gras: "SANDBOX",
    ne_sl: "MOCK",
  },
};

const SAVED_VIEWS: SavedView[] = [
  { id: "default", name: "Default", filters: {}, isDefault: true },
  { id: "my_matters", name: "My Matters", filters: { owner: "current_user" } },
  { id: "needs_attention", name: "Needs Attention", filters: { risk_level: ["critical", "warning"] } },
  { id: "deadline_week", name: "Deadline This Week", filters: { hours_until_sla: { lte: 168 } } },
  { id: "awaiting_approval", name: "Awaiting Approval", filters: { has_pending_approval: true } },
  { id: "action_failed", name: "Action Failed", filters: { external_action_status: "failed" } },
  { id: "bank_recovery", name: "Bank Recovery", filters: { case_type: ["MORTGAGE_REGISTRATION", "INTIMATION_MORTGAGE"] } },
  { id: "recently_updated", name: "Recently Updated", filters: { updated_at: { gte: "7_days_ago" } } },
];

// ─── Helper Functions ────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRelativeTime(hours: number): string {
  if (hours < 1) return "< 1 hour";
  if (hours < 24) return `${Math.round(hours)} hours`;
  return `${Math.round(hours / 24)} days`;
}

function getRiskColor(risk: string): "danger" | "warning" | "success" | "info" {
  switch (risk) {
    case "critical":
      return "danger";
    case "warning":
      return "warning";
    case "normal":
      return "success";
    default:
      return "info";
  }
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "warning",
    in_progress: "info",
    completed: "success",
    failed: "danger",
    retrying: "warning",
  };
  return colors[status] || "default";
}

// ─── Signal Panel Components ─────────────────────────────────────────

function ActiveMattersPanel({ cases }: { cases: Case[] }) {
  const activeCases = cases.filter((c) => c.status !== "CLOSED" && c.status !== "REJECTED");
  const criticalCount = activeCases.filter((c) => c.risk_level === "critical").length;

  return (
    <Card className="h-full" theme="glass">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Active Matters</h3>
        <Badge variant={criticalCount > 0 ? "danger" : "success"} theme="glass">
          {activeCases.length} Active
        </Badge>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activeCases.length === 0 ? (
          <p className="text-white/50 text-center py-8">No active matters</p>
        ) : (
          activeCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => window.location.href = `/cases/${caseItem.id}`}
              tabIndex={0}
              role="button"
              aria-label={`View case ${caseItem.case_number}`}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") window.location.href = `/cases/${caseItem.id}`; }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{caseItem.case_number}</p>
                <p className="text-white/60 text-sm truncate">{caseItem.borrower_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={getRiskColor(caseItem.risk_level || "normal")}
                  theme="glass"
                  className="text-xs"
                >
                  {caseItem.risk_level?.toUpperCase() || "NORMAL"}
                </Badge>
                <span className="text-white/50 text-xs">
                  {formatRelativeTime(caseItem.hours_until_sla || 0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-white/10">
        <Button variant="ghost" className="w-full text-sm text-white/70 hover:text-white" onClick={() => window.location.href = "/cases"}>
          View All Matters →
        </Button>
      </div>
    </Card>
  );
}

function SLARiskPanel({ cases }: { cases: Case[] }) {
  const atRisk = cases.filter((c) => c.risk_level === "critical" || c.risk_level === "warning");
  const criticalCount = cases.filter((c) => c.risk_level === "critical").length;
  const warningCount = cases.filter((c) => c.risk_level === "warning").length;

  return (
    <Card className="h-full" theme="glass">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">SLA Risk</h3>
        <Badge variant={criticalCount > 0 ? "danger" : warningCount > 0 ? "warning" : "success"} theme="glass">
          {atRisk.length} At Risk
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-2xl font-bold">{criticalCount}</p>
          <p className="text-white/60 text-xs">Critical</p>
        </div>
        <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-2xl font-bold">{warningCount}</p>
          <p className="text-white/60 text-xs">Warning</p>
        </div>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {atRisk.slice(0, 5).map((caseItem) => (
          <div key={caseItem.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
            <span className="text-white/80 text-sm truncate">{caseItem.case_number}</span>
            <Badge variant={getRiskColor(caseItem.risk_level || "normal")} theme="glass" className="text-xs">
              {caseItem.risk_level?.toUpperCase()}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PendingApprovalsPanel({ approvals }: { approvals: ApprovalRequest[] }) {
  const pending = approvals.filter((a) => a.status === "pending");
  const urgentCount = pending.filter((a) => new Date(a.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000)).length;

  return (
    <Card className="h-full" theme="glass">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Pending Approvals</h3>
        <Badge variant={urgentCount > 0 ? "danger" : "info"} theme="glass">
          {pending.length} Pending
        </Badge>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {pending.length === 0 ? (
          <p className="text-white/50 text-center py-8">No approvals awaiting review</p>
        ) : (
          pending.map((approval) => (
            <div key={approval.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium text-sm">{approval.object_type.replace("_", " ")}</span>
                <span className="text-white/50 text-xs">
                  Expires: {formatRelativeTime((new Date(approval.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))}
                </span>
              </div>
              <div className="flex items-center justify-between text-white/60 text-xs">
                <span>Requested by: {approval.requested_by}</span>
                <span>{approval.required_approvers.length} approvers</span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-white/10">
        <Button variant="ghost" className="w-full text-sm text-white/70 hover:text-white" onClick={() => window.location.href = "/approvals"}>
          View All Approvals →
        </Button>
      </div>
    </Card>
  );
}

function AIReviewRequiredPanel({ aiTasks }: { aiTasks: AiRun[] }) {
  const needsReview = aiTasks.filter((t) => t.risk_flags.length > 0);
  const inProgress = aiTasks.filter((t) => t.status === "in_progress");

  return (
    <Card className="h-full" theme="glass">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">AI Review Required</h3>
        <Badge variant={needsReview.length > 0 ? "warning" : "success"} theme="glass">
          {needsReview.length} Need Review
        </Badge>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {needsReview.length === 0 && inProgress.length === 0 ? (
          <p className="text-white/50 text-center py-8">No AI tasks requiring review</p>
        ) : (
          [...needsReview, ...inProgress].slice(0, 5).map((task) => (
            <div key={task.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium text-sm capitalize">{task.agent.replace("_", " ")}</span>
                <Badge variant={task.status === "in_progress" ? "info" : "warning"} theme="glass" className="text-xs">
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                {task.risk_flags.map((flag) => (
                  <Badge key={flag} variant="danger" theme="glass" className="text-xs">
                    {flag.replace("_", " ")}
                  </Badge>
                ))}
              </div>
              <p className="text-white/50 text-xs">Confidence: {Math.round(task.confidence * 100)}%</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function UpcomingDeadlinesPanel({ deadlines }: { deadlines: Deadline[] }) {
  const pending = deadlines.filter((d) => d.status === "pending" || d.status === "triggered");
  const todayCount = pending.filter((d) => d.hours_until_due <= 24).length;

  return (
    <Card className="h-full" theme="glass">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Upcoming Deadlines</h3>
        <Badge variant={todayCount > 0 ? "danger" : "info"} theme="glass">
          {todayCount} Due Today
        </Badge>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {pending.length === 0 ? (
          <p className="text-white/50 text-center py-8">No upcoming deadlines</p>
        ) : (
          pending
            .sort((a, b) => a.hours_until_due - b.hours_until_due)
            .slice(0, 5)
            .map((deadline) => (
              <div key={deadline.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium text-sm">{deadline.label}</span>
                  <Badge
                    variant={deadline.hours_until_due <= 24 ? "danger" : deadline.hours_until_due <= 72 ? "warning" : "success"}
                    theme="glass"
                    className="text-xs"
                  >
                    {formatRelativeTime(deadline.hours_until_due)}
                  </Badge>
                </div>
                <p className="text-white/60 text-xs">
                  Type: {deadline.deadline_type} • Status: {deadline.status}
                </p>
              </div>
            ))
        )}
      </div>
    </Card>
  );
}

function FailedExternalActionsPanel({ actions }: { actions: ExternalAction[] }) {
  const failed = actions.filter((a) => a.status === "failed");
  const retrying = actions.filter((a) => a.status === "retrying");

  return (
    <Card className="h-full" theme="glass">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Failed External Actions</h3>
        <Badge variant={failed.length > 0 ? "danger" : "success"} theme="glass">
          {failed.length} Failed
        </Badge>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {failed.length === 0 && retrying.length === 0 ? (
          <p className="text-white/50 text-center py-8">No failed actions</p>
        ) : (
          [...failed, ...retrying].slice(0, 5).map((action) => (
            <div key={action.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium text-sm">{action.action_type.replace("_", " ")}</span>
                <Badge variant={action.status === "failed" ? "danger" : "warning"} theme="glass" className="text-xs">
                  {action.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-white/60 text-xs">
                <span>Channel: {action.channel}</span>
                <span>Attempts: {action.attempt_count}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function InstitutionActivityPanel({ banks }: { banks: BankActivity[] }) {
  return (
    <Card className="h-full" theme="glass">
      <h3 className="text-lg font-semibold text-white mb-4">Institution Activity</h3>
      <div className="overflow-x-auto">
        <Table theme="glass" aria-label="Institution activity summary">
          <thead>
            <tr>
              <Th scope="col">Bank</Th>
              <Th scope="col">Total Cases</Th>
              <Th scope="col">Active</Th>
              <Th scope="col">Avg TAT</Th>
              <Th scope="col">SLA Breaches</Th>
            </tr>
          </thead>
          <tbody>
            {banks.map((bank) => (
              <tr key={bank.bank_id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{bank.short_code}</span>
                    <span className="text-white/50 text-xs">{bank.name}</span>
                  </div>
                </Td>
                <Td className="text-white">{bank.case_count}</Td>
                <Td className="text-white">{bank.active_cases}</Td>
                <Td className="text-white">{bank.avg_tat_hours}h</Td>
                <Td>
                  <Badge
                    variant={bank.sla_breaches > 0 ? "danger" : "success"}
                    theme="glass"
                  >
                    {bank.sla_breaches}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}

function SystemHealthPanel({ health }: { health: SystemHealth }) {
  const allHealthy = Object.values(health).every(
    (v) => (typeof v === "string" ? v === "healthy" : Object.values(v).every((s) => s !== "NOT_CONFIGURED"))
  );

  return (
    <Card className="h-full" theme="glass">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">System Health</h3>
        <Badge variant={allHealthy ? "success" : "warning"} theme="glass">
          {allHealthy ? "All Healthy" : "Issues Detected"}
        </Badge>
      </div>
      <div className="space-y-3">
        {[
          { label: "Database", status: health.database },
          { label: "Redis", status: health.redis },
          { label: "AI Backend", status: health.aiBackend },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
            <span className="text-white">{item.label}</span>
            <Badge
              variant={item.status === "healthy" ? "success" : item.status === "degraded" ? "warning" : "danger"}
              theme="glass"
            >
              {item.status.toUpperCase()}
            </Badge>
          </div>
        ))}
        <div className="pt-2 border-t border-white/10">
          <h4 className="text-white/70 text-xs font-medium mb-2">External Adapters</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(health.externalAdapters).map(([channel, status]) => (
              <div key={channel} className="p-2 bg-white/5 rounded border border-white/10">
                <p className="text-white/80 text-sm capitalize">{channel.replace("_", " ")}</p>
                <Badge
                  variant={status === "LIVE" ? "success" : status === "SANDBOX" ? "info" : status === "MOCK" ? "warning" : "danger"}
                  theme="glass"
                  className="text-xs"
                >
                  {status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Command Center Component ──────────────────────────────────

export default function CommandCenterPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [savedView, setSavedView] = useState<SavedView>(SAVED_VIEWS[0]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Data Fetching (replace with real API hooks) ──────────────────
  const [cases] = useState<Case[]>(MOCK_CASES);
  const [approvals] = useState<ApprovalRequest[]>(MOCK_APPROVALS);
  const [aiTasks] = useState<AiRun[]>(MOCK_AI_TASKS);
  const [deadlines] = useState<Deadline[]>(MOCK_DEADLINES);
  const [externalActions] = useState<ExternalAction[]>(MOCK_EXTERNAL_ACTIONS);
  const [bankActivity] = useState<BankActivity[]>(MOCK_BANK_ACTIVITY);
  const [systemHealth] = useState<SystemHealth>(MOCK_SYSTEM_HEALTH);

  // ─── Auto-refresh ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
      // In real app: refetch data here
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // In real app: await refetch()
    await new Promise((r) => setTimeout(r, 500));
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  }, []);

  // ─── Keyboard Shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === "Escape") {
        setShowCommandPalette(false);
        setShowViewModal(false);
      }
      if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleRefresh();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRefresh]);

  // ─── Deep Linking / URL State ─────────────────────────────────────
  const viewParam = searchParams.get("view");
  useEffect(() => {
    if (viewParam) {
      const view = SAVED_VIEWS.find((v) => v.id === viewParam);
      if (view) setSavedView(view);
    }
  }, [viewParam]);

  const handleViewChange = (view: SavedView) => {
    setSavedView(view);
    router.push(`/dashboard/command-center?view=${view.id}`);
  };

  // ─── Export CSV ───────────────────────────────────────────────────
  const handleExport = () => {
    const data = cases.map((c) => ({
      "Case Number": c.case_number,
      Borrower: c.borrower_name,
      Type: c.case_type,
      Status: c.status,
      Bank: c.bank_id,
      Amount: formatCurrency(c.loan_amount),
      "SLA Deadline": c.sla_deadline,
      "Risk Level": c.risk_level,
      "Hours Until SLA": c.hours_until_sla,
    }));
    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `command-center-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ───────────────────────────────────────────────────────
  const roleBasedTitle = {
    ADVOCATE: "My Matters",
    BANK_VIEWER: "Recovery Portfolio",
    EXECUTIVE: "Operations Overview",
    PRINCIPAL: "Command Center",
    CLERK: "My Matters",
  };

  const currentRole = "PRINCIPAL"; // In real app: from auth context
  const title = roleBasedTitle[currentRole as keyof typeof roleBasedTitle] || "Command Center";

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--bg)" }}>
      {/* ARIA Live Region for auto-refresh announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Last refreshed: {lastRefreshed.toLocaleTimeString()}
      </div>

      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-white/50 text-sm mt-1">
            Real-time operational overview — Last updated {lastRefreshed.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Saved View Selector */}
          <Select
            value={savedView.id}
            onValueChange={(value) => handleViewChange(SAVED_VIEWS.find((v) => v.id === value) || SAVED_VIEWS[0])}
            className="w-48"
            aria-label="Saved views"
          >
            {SAVED_VIEWS.map((view) => (
              <Select.Item key={view.id} value={view.id} className="text-white">
                {view.name}
              </Select.Item>
            ))}
          </Select>
          <Button variant="outline" onClick={handleExport} aria-label="Export CSV">
            Export CSV
          </Button>
          <Button
            variant="default"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
            aria-label="Refresh data"
          >
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowCommandPalette(true)}
            aria-label="Open command palette (Cmd+K)"
            className="text-white/70 hover:text-white"
          >
            ⌘K
          </Button>
        </div>
      </header>

      {/* 8 Signal Panels Grid */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4" aria-label="Command center signals">
        {/* Active Matters - span 2 on lg, 1 on md */}
        <ActiveMattersPanel cases={cases} className="lg:col-span-2 md:col-span-1" />

        {/* SLA Risk - span 2 on lg, 1 on md */}
        <SLARiskPanel cases={cases} className="lg:col-span-2 md:col-span-1" />

        {/* Pending Approvals - span 2 on lg, 1 on md */}
        <PendingApprovalsPanel approvals={approvals} className="lg:col-span-2 md:col-span-1" />

        {/* AI Review Required - span 2 on lg, 1 on md */}
        <AIReviewRequiredPanel aiTasks={aiTasks} className="lg:col-span-2 md:col-span-1" />

        {/* Upcoming Deadlines - span 2 on lg, 1 on md */}
        <UpcomingDeadlinesPanel deadlines={deadlines} className="lg:col-span-2 md:col-span-1" />

        {/* Failed External Actions - span 2 on lg, 1 on md */}
        <FailedExternalActionsPanel actions={externalActions} className="lg:col-span-2 md:col-span-1" />

        {/* Institution Activity - span 2 on lg, 1 on md */}
        <InstitutionActivityPanel banks={bankActivity} className="lg:col-span-2 md:col-span-1" />

        {/* System Health - span 2 on lg, 1 on md */}
        <SystemHealthPanel health={systemHealth} className="lg:col-span-2 md:col-span-1" />
      </main>

      {/* Command Palette Modal */}
      <Modal
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        title="Command Palette"
        theme="glass"
      >
        <div className="space-y-4">
          <Input
            placeholder="Type a command or search…"
            className="mb-4"
            autoFocus
            aria-label="Command palette search"
          />
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Create New Case", action: () => router.push("/cases/new") },
              { label: "View All Approvals", action: () => router.push("/approvals") },
              { label: "Open Calendar", action: () => router.push("/calendar") },
              { label: "Search Matters", action: () => router.push("/search") },
              { label: "Refresh Data", action: handleRefresh },
              { label: "Export Dashboard", action: handleExport },
              { label: "Toggle Theme", action: () => {} },
              { label: "Open Settings", action: () => router.push("/settings") },
            ].map((item, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full justify-start"
                onClick={() => { item.action(); setShowCommandPalette(false); }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Saved View Modal */}
      <Modal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Save Current View"
        theme="glass"
      >
        <div className="space-y-4">
          <Input placeholder="View name" aria-label="View name" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowViewModal(false)}>Cancel</Button>
            <Button variant="default" onClick={() => { /* save logic */ setShowViewModal(false); }}>
              Save View
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}