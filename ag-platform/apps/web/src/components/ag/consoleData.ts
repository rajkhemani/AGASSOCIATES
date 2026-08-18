// AG Console mock data — banking panel, home loan practice (design handoff).
import type { PillTone } from './primitives';

export interface ConsoleCase {
  id: string;
  client: string;
  property: string;
  loan: string;
  bank: string;
  stage: string;
  stageIdx: number;
  sla: string;
  status: 'live' | 'closed' | 'flagged';
  opened: string;
  priority: 'standard' | 'urgent';
}

export const CASES: ConsoleCase[] = [
  { id: 'AG-26-0418', client: 'Mr. & Mrs. Sharma', property: 'Hiranandani Estate, Ghodbunder Rd', loan: '₹ 1,85,00,000', bank: 'HDFC Bank', stage: 'Auditor', stageIdx: 3, sla: '4m 12s', status: 'live', opened: '14:02', priority: 'standard' },
  { id: 'AG-26-0417', client: 'Ms. Pooja Iyer', property: 'Lodha Amara, Kolshet Road', loan: '₹ 78,40,000', bank: 'ICICI Bank', stage: 'Drafter', stageIdx: 2, sla: '7m 03s', status: 'live', opened: '13:48', priority: 'urgent' },
  { id: 'AG-26-0416', client: 'Mr. Anand Deshpande', property: 'Rustomjee Urbania, Majiwada', loan: '₹ 2,40,00,000', bank: 'Axis Bank', stage: 'Vyasa', stageIdx: 1, sla: '12m 40s', status: 'live', opened: '13:31', priority: 'standard' },
  { id: 'AG-26-0415', client: 'Dr. Reema Kulkarni', property: 'Dosti Imperia, Manpada', loan: '₹ 1,12,00,000', bank: 'State Bank of India', stage: 'Filed', stageIdx: 5, sla: '—', status: 'closed', opened: '12:55', priority: 'standard' },
  { id: 'AG-26-0414', client: 'Mr. Vivek Gokhale', property: 'Tata Amantra, Bhiwandi', loan: '₹ 64,00,000', bank: 'Kotak Mahindra', stage: 'Filed', stageIdx: 5, sla: '—', status: 'closed', opened: '12:31', priority: 'standard' },
  { id: 'AG-26-0413', client: 'Mrs. Sunita Joshi', property: 'Raunak Unnathi, Owale', loan: '₹ 92,50,000', bank: 'Bank of Baroda', stage: 'Filed', stageIdx: 5, sla: '—', status: 'closed', opened: '11:48', priority: 'standard' },
  { id: 'AG-26-0412', client: 'Mr. Karan Mehta', property: 'Puranik City Reserva, Ghodbunder', loan: '₹ 1,55,00,000', bank: 'HDFC Bank', stage: 'Held', stageIdx: 3, sla: 'paused', status: 'flagged', opened: '11:22', priority: 'urgent' },
];

export interface ConsoleAgent {
  name: string;
  role: string;
  glyph: string;
  desc: string;
  spec: string;
  load: number;
  queued: number;
}

export const CONSOLE_AGENTS: ConsoleAgent[] = [
  { name: 'Aisha', role: 'Frontline Intake', glyph: '01', desc: 'WhatsApp + n8n. Receives loan-package referrals from bank RMs; chases missing KYC.', spec: 'Qwen 2.5 · n8n', load: 62, queued: 3 },
  { name: 'Vyasa', role: 'KYC & Title Vision', glyph: '02', desc: 'Multimodal OCR on Aadhaar, PAN, sale-deed scans, encumbrance certificates. Flags forgery.', spec: 'Qwen-VL · pdfplumber', load: 48, queued: 1 },
  { name: 'Drafter', role: 'Mortgage Architect', glyph: '03', desc: 'RAG against pgvector. Generates mortgage deeds, MODT, tripartite agreements per bank panel format.', spec: 'pgvector · Ollama', load: 74, queued: 2 },
  { name: 'Auditor', role: 'Compliance Boss', glyph: '04', desc: 'Strict gatekeeper. Halts on a 1-rupee discrepancy or stamp-duty mismatch. Loops drafter on failure.', spec: 'LangGraph · Llama 3', load: 31, queued: 1 },
  { name: 'Executor', role: 'Sub-Registrar Operator', glyph: '05', desc: 'Triggers e-Stamping, generates SARFAESI-compliant payloads, files MODT with sub-registrar.', spec: 'FastAPI · IGR-MH API', load: 18, queued: 0 },
  { name: 'Accountant', role: 'Reconciliation', glyph: '06', desc: 'Parses bank disbursement memos, reconciles stamp-duty receipts via gspread. Zero-touch books.', spec: 'pdfplumber · gspread', load: 11, queued: 0 },
];

export const CONSOLE_STEPS = [
  { t: '00:00', label: 'Bank Referral', note: 'RM forwards loan-sanction letter via WhatsApp.' },
  { t: '00:04', label: 'Vyasa', note: 'Title chain verified. Encumbrance certificate parsed.' },
  { t: '00:09', label: 'Drafter', note: 'MODT + mortgage deed drafted to bank panel format.' },
  { t: '00:14', label: 'Auditor', note: 'Stamp duty cross-checked against IGR-MH ready reckoner.' },
  { t: '00:19', label: 'Executor', note: 'e-Stamp purchased. Sub-registrar slot booked.' },
  { t: '00:25', label: 'Filed', note: 'MODT lodged. Sanction unlocked at the bank.' },
];

export interface ActivityEntry {
  t: string;
  who: string;
  msg: string;
  tone: PillTone;
}

export const ACTIVITY: ActivityEntry[] = [
  { t: '14:02:11', who: 'Aisha', msg: 'Intake received from HDFC RM Sandeep K. · Borrower: Sharma, A.', tone: 'info' },
  { t: '14:01:48', who: 'Auditor', msg: 'Case AG-26-0418 audit pass. Stamp duty ₹ 9,25,000 matched.', tone: 'good' },
  { t: '14:00:33', who: 'Executor', msg: 'Case AG-26-0415 filed. MODT receipt 26-MOD-018472.', tone: 'good' },
  { t: '13:58:02', who: 'Auditor', msg: 'Case AG-26-0412 HELD. Property card mismatch — escalating.', tone: 'warn' },
  { t: '13:54:29', who: 'Vyasa', msg: 'Title chain verified for AG-26-0416. 4 deeds, 1992 → 2026.', tone: 'info' },
  { t: '13:51:10', who: 'Drafter', msg: 'Mortgage deed v3 generated for AG-26-0417 (ICICI).', tone: 'info' },
  { t: '13:47:55', who: 'Aisha', msg: 'KYC chase fired to client AG-26-0418 (Form 60 missing).', tone: 'info' },
  { t: '13:43:12', who: 'Accountant', msg: 'Reconciled stamp-duty challan ₹ 9,25,000 → IGR-MH/CH-2604.', tone: 'good' },
];

export const KPIS = [
  { v: '7', l: 'Live cases', sub: '2 urgent' },
  { v: '₹ 9.27 cr', l: 'In flight', sub: 'across 6 banks' },
  { v: '24:18', l: 'Median TAT today', sub: 'goal 25:00' },
  { v: '1', l: 'Held for review', sub: 'AG-26-0412' },
];

export const BANK_VOLUMES: [string, number, string][] = [
  ['HDFC Bank', 2, '₹ 3.40 cr'],
  ['ICICI Bank', 1, '₹ 78 L'],
  ['Axis Bank', 1, '₹ 2.40 cr'],
  ['SBI', 1, '₹ 1.12 cr'],
  ['Kotak', 1, '₹ 64 L'],
  ['Bank of Baroda', 1, '₹ 92.5 L'],
];
