// Landing-page content — AG Associates banking-panel home-loan practice (design handoff).

export interface LandingAgent {
  name: string;
  role: string;
  glyph: string;
  desc: string;
  spec: string;
}

export const LANDING_AGENTS: LandingAgent[] = [
  {
    name: 'Aisha',
    role: 'Loan File Intake',
    glyph: '01',
    desc: "Receives loan files from bank's home loan department. Extracts borrower details, property address, loan amount, and tenure. Chases missing documents automatically.",
    spec: 'Qwen 2.5 · n8n · WhatsApp',
  },
  {
    name: 'Vyasa',
    role: 'Title & KYC Verifier',
    glyph: '02',
    desc: 'Multimodal OCR on Aadhaar, PAN, and property documents. Runs title search across 30-year ownership chain. Flags encumbrances and litigation risks.',
    spec: 'Qwen-VL · pdfplumber · EC Check',
  },
  {
    name: 'Drafter',
    role: 'Legal Architect',
    glyph: '03',
    desc: 'RAG against mortgage deed templates. Drafts Mortgage Deed, Loan Agreement, and Hypothecation under SARFAESI Act — with 100% field coverage, zero blank clauses.',
    spec: 'pgvector · Ollama · SARFAESI',
  },
  {
    name: 'Auditor',
    role: 'Compliance Gatekeeper',
    glyph: '04',
    desc: 'Strict SARFAESI and RBI guideline checker. Halts on any discrepancy between sanction letter and deed. Loops drafter until compliance score ≥ 85.',
    spec: 'LangGraph · Llama 3 · NHB',
  },
  {
    name: 'Executor',
    role: 'Registration Operator',
    glyph: '05',
    desc: 'Generates execution-ready PDF. Schedules Sub-Registrar slot. Triggers CERSAI charge registration and stamps duty calculation for Maharashtra.',
    spec: 'FastAPI · CERSAI · IGR',
  },
  {
    name: 'Accountant',
    role: 'Fee Reconciliation',
    glyph: '06',
    desc: 'Parses bank panel fee schedules. Reconciles professional fees per loan tranche. Raises GST invoices and updates master ledger via gspread.',
    spec: 'pdfplumber · gspread · GST',
  },
];

export const LANDING_STEPS = [
  { t: '00:00', label: 'Bank Sends File', note: "Loan file received from bank's home loan department via secure channel." },
  { t: '00:30', label: 'Vyasa — Title Search', note: 'Scans 30-year ownership chain, encumbrance certificate, mutation entries.' },
  { t: '01:00', label: 'KYC Cleared', note: 'Borrower Aadhaar, PAN, CIBIL score verified. Forgery flags cleared.' },
  { t: '02:00', label: 'Drafter — Deed', note: 'Mortgage Deed + Hypothecation drafted against SARFAESI templates.' },
  { t: '02:30', label: 'Auditor Pass', note: 'Compliance score 92/100. Sanction letter vs deed — zero discrepancies.' },
  { t: '04:00', label: 'Filed & Registered', note: 'CERSAI charge registered. Sub-Registrar slot booked. Bank notified.' },
];

export const COMPARE: [string, string, string][] = [
  ['Title Search', 'Manual EC pulls, 3–5 days', 'AI chain scan, 30 minutes'],
  ['Deed Drafting', 'Junior associate, error-prone', 'SARFAESI-compliant, automated'],
  ['Compliance Check', 'Senior review, 1 day', 'Deterministic audit, instant'],
  ['CERSAI Filing', 'Manual portal entry', 'API-triggered, zero errors'],
  ['Fee Reconciliation', 'Manual spreadsheet', 'Auto-ledger, GST-ready'],
];

export const FLYWHEEL = [
  { k: 'Panel-Grade Accuracy', v: 'Every deed drafted against live RBI, NHB, and SARFAESI guidelines. Banks trust the output.' },
  { k: 'Volume Without Headcount', v: 'Processes 20+ loan files per day. One advocate, no associates, no paralegal overhead.' },
  { k: 'Institutional Memory', v: 'Every filed deed trains the vector database. Each case makes the next faster.' },
];
