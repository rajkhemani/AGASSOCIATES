// AG Console screens — Dashboard, Cases, Case Detail, Client Portal, Deed Preview, Workforce.
// Ported from the claude.ai/design handoff (Editorial theme). Data is mock/demo.
import type { CSSProperties } from 'react';
import { Eyebrow, Pill, MONO, SERIF, SANS } from '../ag/primitives';
import { CASES, CONSOLE_AGENTS, CONSOLE_STEPS, ACTIVITY, KPIS, BANK_VOLUMES } from '../ag/consoleData';
import type { PillTone } from '../ag/primitives';

const card: CSSProperties = { border: '1px solid var(--line)', borderRadius: 6, background: 'var(--paper)' };

const tableHead: CSSProperties = {
  padding: '12px 18px',
  borderBottom: '1px solid var(--line)',
  background: 'var(--paper-2)',
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: '.18em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};

const monoLabel: CSSProperties = {
  fontFamily: MONO,
  fontSize: 10.5,
  letterSpacing: '.18em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};

const sectionH2: CSSProperties = {
  fontFamily: SERIF,
  fontSize: 28,
  fontWeight: 340,
  letterSpacing: '-.02em',
  margin: '8px 0 18px',
};

function hoverable(e: React.MouseEvent<HTMLDivElement>, on: boolean) {
  e.currentTarget.style.background = on ? 'rgba(154,107,30,.04)' : 'transparent';
}

export function Dashboard() {
  return (
    <div className="ag-rise" style={{ padding: '28px 36px' }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '2px solid var(--ink)', borderBottom: '1px solid var(--line)' }}>
        {KPIS.map((k, i) => (
          <div key={k.l} style={{ padding: '24px 28px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 300, lineHeight: 1, letterSpacing: '-.03em', color: 'var(--accent)' }}>{k.v}</div>
            <div style={{ ...monoLabel, fontSize: 11, marginTop: 10 }}>{k.l}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4, fontStyle: 'italic' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-col: live cases + activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, marginTop: 32 }}>
        {/* Live cases */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <Eyebrow>§ In flight</Eyebrow>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>auto-refresh · 3s</span>
          </div>
          <h2 style={{ ...sectionH2, margin: '0 0 18px' }}>Live cases on the desk</h2>

          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ ...tableHead, display: 'grid', gridTemplateColumns: '120px 1.5fr 1fr 110px 100px 80px' }}>
              <span>File №</span>
              <span>Borrower / Property</span>
              <span>Bank</span>
              <span>Loan</span>
              <span>Stage</span>
              <span style={{ textAlign: 'right' }}>SLA</span>
            </div>
            {CASES.filter((c) => c.status !== 'closed').map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1.5fr 1fr 110px 100px 80px',
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--line)',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => hoverable(e, true)}
                onMouseLeave={(e) => hoverable(e, false)}
              >
                <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--accent)' }}>{c.id}</span>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic' }}>{c.client}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{c.property}</div>
                </div>
                <span style={{ fontSize: 13 }}>{c.bank}</span>
                <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500 }}>{c.loan}</span>
                <span>
                  <Pill tone={c.status === 'flagged' ? 'warn' : 'live'}>{c.stage}</Pill>
                </span>
                <span style={{ textAlign: 'right', fontFamily: MONO, fontSize: 11.5, color: c.status === 'flagged' ? 'var(--red)' : 'var(--muted)' }}>
                  {c.sla}
                </span>
              </div>
            ))}
          </div>

          {/* Agent load */}
          <div style={{ marginTop: 32 }}>
            <Eyebrow>§ Agent load</Eyebrow>
            <h2 style={sectionH2}>The workforce, this minute</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {CONSOLE_AGENTS.map((a) => (
                <div key={a.name} style={{ ...card, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: SERIF, fontSize: 20, fontStyle: 'italic' }}>{a.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--accent)' }}>№ {a.glyph}</span>
                  </div>
                  <div style={{ ...monoLabel, marginTop: 4 }}>{a.role}</div>
                  <div style={{ marginTop: 14, height: 4, background: 'rgba(26,31,46,.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${a.load}%`, height: '100%', background: 'var(--accent)', transition: 'width .6s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: 'var(--muted)' }}>
                    <span>load · {a.load}%</span>
                    <span>queued · {a.queued}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity log */}
        <div>
          <Eyebrow>§ Chamber log</Eyebrow>
          <h2 style={sectionH2}>Activity, today</h2>
          <div style={{ ...card, padding: 18 }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: i < ACTIVITY.length - 1 ? '1px dashed var(--line)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--accent)' }}>{a.t}</span>
                  <Pill tone={a.tone}>{a.who}</Pill>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)' }}>{a.msg}</p>
              </div>
            ))}
          </div>

          {/* Bank load */}
          <div style={{ ...card, marginTop: 24, padding: 18 }}>
            <div style={{ ...monoLabel, letterSpacing: '.22em', marginBottom: 14 }}>Volume by panel · today</div>
            {BANK_VOLUMES.map(([b, n, v]) => (
              <div key={b} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, borderBottom: '1px dashed var(--line)' }}>
                <span style={{ fontFamily: SERIF, fontStyle: 'italic' }}>{b}</span>
                <span style={{ color: 'var(--muted)' }}>
                  {n} file · <span style={{ color: 'var(--ink)', fontFamily: MONO }}>{v}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CasesScreen() {
  return (
    <div className="ag-rise" style={{ padding: '28px 36px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
        <input
          placeholder="Search by file no., borrower, bank…"
          aria-label="Search case files"
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid var(--line)',
            borderRadius: 6,
            background: 'var(--paper)',
            fontSize: 14,
            fontFamily: SANS,
            color: 'var(--ink)',
          }}
        />
        {['All', 'Live', 'Held', 'Closed'].map((f, i) => (
          <button
            key={f}
            style={{
              padding: '10px 16px',
              border: '1px solid var(--line)',
              borderRadius: 6,
              background: i === 0 ? 'var(--ink)' : 'var(--paper)',
              color: i === 0 ? 'var(--paper)' : 'var(--ink)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ ...tableHead, display: 'grid', gridTemplateColumns: '120px 1.4fr 1.4fr 1fr 110px 110px 90px', padding: '14px 20px' }}>
          <span>File №</span>
          <span>Borrower</span>
          <span>Property</span>
          <span>Bank</span>
          <span>Loan</span>
          <span>Stage</span>
          <span style={{ textAlign: 'right' }}>Status</span>
        </div>
        {CASES.map((c) => (
          <div
            key={c.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1.4fr 1.4fr 1fr 110px 110px 90px',
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => hoverable(e, true)}
            onMouseLeave={(e) => hoverable(e, false)}
          >
            <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--accent)' }}>{c.id}</span>
            <span style={{ fontFamily: SERIF, fontSize: 15, fontStyle: 'italic' }}>{c.client}</span>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{c.property}</span>
            <span style={{ fontSize: 13 }}>{c.bank}</span>
            <span style={{ fontFamily: MONO, fontSize: 12.5 }}>{c.loan}</span>
            <span>
              <Pill tone={c.status === 'flagged' ? 'warn' : c.status === 'closed' ? 'closed' : 'live'}>{c.stage}</Pill>
            </span>
            <span style={{ textAlign: 'right' }}>
              <Pill tone={c.status as PillTone}>{c.status}</Pill>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseDetail() {
  const c = CASES[0]; // AG-26-0418
  return (
    <div className="ag-rise" style={{ padding: '28px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <Eyebrow>§ File · live</Eyebrow>
          <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 340, letterSpacing: '-.02em', margin: '10px 0 4px' }}>
            <em>{c.client}</em>
          </h2>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            {c.property} · {c.bank}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: 'var(--accent)', letterSpacing: '.2em' }}>FILE №</div>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontStyle: 'italic', marginTop: 4 }}>{c.id}</div>
        </div>
      </div>

      {/* Pipeline */}
      <div style={{ position: 'relative', marginBottom: 36 }}>
        <div style={{ position: 'absolute', left: '4%', right: '4%', top: 18, height: 1, background: 'var(--accent)', opacity: 0.3 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, position: 'relative' }}>
          {CONSOLE_STEPS.map((s, i) => {
            const done = i <= c.stageIdx;
            const active = i === c.stageIdx;
            return (
              <div key={s.t} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    margin: '0 auto 12px',
                    background: done ? 'var(--accent)' : 'var(--paper)',
                    border: '1px solid var(--accent)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: MONO,
                    fontSize: 10,
                    color: done ? 'var(--paper)' : 'var(--accent)',
                    fontWeight: 500,
                    boxShadow: active ? '0 0 0 6px rgba(154,107,30,.18)' : 'none',
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: 'var(--muted)' }}>{s.t}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
        {/* Left: facts + audit log */}
        <div>
          <div style={{ ...card, padding: 24, marginBottom: 18 }}>
            <Eyebrow>§ Mortgage particulars</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px', marginTop: 14 }}>
              {([
                ['Borrower', 'Mr. Aniket Sharma'],
                ['Co-borrower', 'Mrs. Priya Sharma'],
                ['Property', 'Flat 18-A, Hiranandani Estate, Tower Cypress, Patlipada'],
                ['Built-up area', '1,420 sq.ft.'],
                ['Sanctioned amount', c.loan],
                ['Tenor', '20 years · 8.45% p.a.'],
                ['Stamp duty', '₹ 9,25,000 (5%, urban)'],
                ['Registration fee', '₹ 30,000'],
                ['Property card no.', 'PT/THN/2604/A18'],
                ['Mutation status', 'Recorded · 2024-08-12'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <div style={{ ...monoLabel, fontSize: 10, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14, fontFamily: k.includes('amount') || k.includes('duty') || k.includes('fee') ? MONO : 'inherit' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, padding: 24 }}>
            <Eyebrow>§ Audit ledger</Eyebrow>
            <div style={{ marginTop: 14 }}>
              {([
                ['14:18:42', 'Auditor', 'Stamp duty ₹ 9,25,000 matches IGR-MH ready reckoner Patlipada zone IV.', 'good'],
                ['14:17:11', 'Auditor', 'Tripartite agreement clause 14(b) verified against HDFC panel template v.18.', 'good'],
                ['14:15:33', 'Drafter', 'MODT v3 generated. 22 pages. Pagination + watermark applied.', 'info'],
                ['14:13:02', 'Vyasa', 'Title chain validated. 4 conveyances 1992→2026. No encumbrance.', 'good'],
                ['14:11:48', 'Vyasa', 'Aadhaar OCR confidence 99.6%. PAN 99.8%. Property card OCR 97.2%.', 'info'],
                ['14:08:12', 'Aisha', 'Form 60 received from borrower via WhatsApp · 12 KB scan.', 'info'],
              ] as [string, string, string, PillTone][]).map(([t, who, msg, tone], i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 90px 1fr',
                    gap: 14,
                    padding: '10px 0',
                    borderBottom: i < 5 ? '1px dashed var(--line)' : 'none',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--accent)' }}>{t}</span>
                  <span>
                    <Pill tone={tone}>{who}</Pill>
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: documents + actions */}
        <div>
          <div style={{ ...card, padding: 20, marginBottom: 18 }}>
            <Eyebrow>§ Documents</Eyebrow>
            <div style={{ marginTop: 12 }}>
              {([
                ['Mortgage Deed (MODT) v3', '22 pp · 184 KB', 'draft'],
                ['Tripartite Agreement', '9 pp · 76 KB', 'draft'],
                ['Sanction Letter — HDFC', '3 pp · 48 KB', 'received'],
                ['Property Card', '1 pp · 22 KB', 'verified'],
                ['Encumbrance Cert.', '4 pp · 34 KB', 'verified'],
                ['Aadhaar — Borrower', '1 pp · 18 KB', 'verified'],
                ['PAN — Borrower', '1 pp · 14 KB', 'verified'],
              ] as [string, string, string][]).map(([n, m, s], i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < 6 ? '1px dashed var(--line)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontFamily: SERIF, fontStyle: s === 'draft' ? 'italic' : 'normal' }}>{n}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO, marginTop: 2 }}>{m}</div>
                  </div>
                  <Pill tone={s === 'draft' ? 'info' : 'good'}>{s}</Pill>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 20, border: '1px solid var(--accent)', borderRadius: 6, background: 'rgba(154,107,30,.06)' }}>
            <Eyebrow>§ Next action · Auditor</Eyebrow>
            <p style={{ fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', lineHeight: 1.5, margin: '12px 0 16px' }}>
              Final compliance pass in progress. Hold release expected at 14:23.
            </p>
            <button
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid var(--ink)',
                background: 'var(--ink)',
                color: 'var(--paper)',
                borderRadius: 6,
                fontSize: 13,
                letterSpacing: '.05em',
                cursor: 'pointer',
              }}
            >
              Release to Executor →
            </button>
            <button
              style={{
                width: '100%',
                padding: 12,
                marginTop: 8,
                border: '1px solid var(--line)',
                background: 'transparent',
                color: 'var(--ink)',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Send for human review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClientPortal() {
  return (
    <div className="ag-rise" style={{ padding: '28px 36px', maxWidth: 880, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '40px 0 28px', borderBottom: '1px solid var(--line)' }}>
        <Eyebrow>§ Borrower view · AG-26-0418</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 300, letterSpacing: '-.03em', margin: '14px 0 8px' }}>
          Welcome, <em>Mr. Sharma.</em>
        </h2>
        <p style={{ fontFamily: SERIF, fontSize: 17, color: 'var(--muted)', fontStyle: 'italic', maxWidth: 540, margin: '0 auto' }}>
          Your home loan paperwork is being prepared by AG Associates on behalf of HDFC Bank. We will message you on
          WhatsApp the moment a signature is required.
        </p>
      </div>

      {/* Progress */}
      <div style={{ padding: '32px 0', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontStyle: 'italic' }}>Stage 4 of 6</span>
          <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--accent)' }}>EST. COMPLETION 14:30 · 8 MIN</span>
        </div>
        <div style={{ height: 6, background: 'rgba(26,31,46,.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: '66%', height: '100%', background: 'var(--accent)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginTop: 18 }}>
          {['Intake', 'KYC', 'Drafted', 'Audit', 'Stamp & File', 'Complete'].map((s, i) => (
            <div key={s} style={{ textAlign: 'center', opacity: i <= 3 ? 1 : 0.35 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  margin: '0 auto 6px',
                  background: i <= 3 ? 'var(--accent)' : 'transparent',
                  border: '1px solid var(--accent)',
                }}
              />
              <div style={{ fontSize: 11.5, fontStyle: 'italic', fontFamily: SERIF }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What's needed */}
      <div style={{ padding: '28px 0', borderBottom: '1px solid var(--line)' }}>
        <Eyebrow>§ Nothing pending from you</Eyebrow>
        <p style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1.6, marginTop: 12, fontStyle: 'italic' }}>
          All KYC documents have been verified. The next time you hear from us will be the e-Sign OTP — likely within
          ten minutes.
        </p>
      </div>

      {/* Loan summary */}
      <div style={{ padding: '28px 0' }}>
        <Eyebrow>§ Your loan, in one page</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 32px', marginTop: 18 }}>
          {([
            ['Sanctioned', '₹ 1,85,00,000'],
            ['Interest', '8.45% p.a. floating'],
            ['Tenor', '240 months'],
            ['EMI (estimated)', '₹ 1,59,840'],
            ['Stamp duty (you)', '₹ 9,25,000'],
            ['Registration (you)', '₹ 30,000'],
            ['Bank', 'HDFC Bank · Thane Branch'],
            ['Property', 'Hiranandani Estate, Patlipada'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={{ paddingBottom: 14, borderBottom: '1px dashed var(--line)' }}>
              <div style={{ ...monoLabel, marginBottom: 4 }}>{k}</div>
              <div style={{ fontFamily: SERIF, fontSize: 20, fontStyle: v.startsWith('₹') ? 'normal' : 'italic' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DeedPreview() {
  return (
    <div className="ag-rise" style={{ padding: '28px 36px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 28 }}>
      {/* Document */}
      <div
        style={{
          background: '#fdfbf3',
          border: '1px solid var(--line)',
          borderRadius: 4,
          padding: '56px 64px',
          minHeight: 900,
          boxShadow: '0 1px 0 rgba(0,0,0,.04), 0 24px 60px rgba(26,31,46,.08)',
          fontFamily: SERIF,
          color: 'var(--ink)',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 24, right: 32, fontFamily: MONO, fontSize: 10, letterSpacing: '.22em', color: 'var(--muted)' }}>
          DRAFT v3 · 14:15 · 22 OF 22
        </div>

        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--ink)', paddingBottom: 18, marginBottom: 32 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.32em', color: 'var(--accent)', marginBottom: 10 }}>
            ON A NON-JUDICIAL E-STAMP PAPER OF ₹ 9,25,000
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 400, letterSpacing: '-.02em', margin: '4px 0' }}>Memorandum of Deposit of Title Deeds</h2>
          <div style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--muted)', marginTop: 6 }}>
            executed at Thane, Maharashtra, this twenty-eighth day of April, two thousand and twenty-six
          </div>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.75, margin: '0 0 16px' }}>
          <span style={{ fontSize: 48, float: 'left', lineHeight: 0.85, paddingRight: 8, paddingTop: 4, color: 'var(--accent)' }}>T</span>
          his Memorandum is executed by <strong>Mr. Aniket Anil Sharma</strong>, son of Mr. Anil Sharma, aged 38 years,
          residing at Flat 18-A, Hiranandani Estate, Tower Cypress, Patlipada, Thane (West) — 400&nbsp;607, hereinafter
          referred to as the <em>Borrower</em> — in favour of <strong>HDFC Bank Limited</strong>, a banking company
          incorporated under the Companies Act and having its Thane branch at Cosmos Plaza, Wagle Estate, Thane (West),
          hereinafter the <em>Bank</em>.
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.75, margin: '0 0 16px' }}>
          <strong>Whereas</strong> the Bank has, by its sanction letter dated <em>2026-04-22</em> bearing reference{' '}
          <em>HDFC/THN/2604/HL/00318</em>, sanctioned to the Borrower a housing loan of{' '}
          <strong>Rupees One Crore Eighty-Five Lakhs only (₹ 1,85,00,000/-)</strong> repayable in two hundred and forty
          equated monthly instalments at the rate of 8.45% per annum floating;
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.75, margin: '0 0 16px' }}>
          <strong>And whereas</strong> the Borrower has, in consideration of the said advance, agreed to deposit with
          the Bank the original title deeds in respect of the Property described in Schedule&nbsp;A hereto, with intent
          to create thereby a security by way of equitable mortgage…
        </p>

        <div
          style={{
            marginTop: 32,
            padding: '18px 22px',
            background: 'rgba(154,107,30,.06)',
            border: '1px solid rgba(154,107,30,.25)',
            borderLeft: '3px solid var(--accent)',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
            Auditor note · automatic
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, fontStyle: 'italic' }}>
            Clause 14(b) cross-checked against HDFC panel template v.18. Stamp duty matches IGR-MH ready reckoner
            Patlipada zone IV. No discrepancies. Ready for Executor.
          </p>
        </div>
      </div>

      {/* Inspector */}
      <aside>
        <div style={{ ...card, padding: 18, marginBottom: 14 }}>
          <Eyebrow>§ Inspector</Eyebrow>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              ['Drafted by', 'Drafter'],
              ['Template', 'HDFC panel v.18'],
              ['Pages', '22'],
              ['Stamp value', '₹ 9,25,000'],
              ['e-Stamp serial', 'MH-26-04-018472'],
              ['Pending sigs', '2 (Borrower, Co-borrower)'],
              ['Audit', 'Pass · 14:18'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, paddingBottom: 8, borderBottom: '1px dashed var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>{k}</span>
                <span style={{ fontFamily: SERIF, fontStyle: k === 'Drafted by' ? 'italic' : 'normal' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid var(--ink)',
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          Send for e-Sign →
        </button>
        <button
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid var(--line)',
            background: 'transparent',
            color: 'var(--ink)',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Download PDF
        </button>
      </aside>
    </div>
  );
}

export function AgentsScreen() {
  return (
    <div className="ag-rise" style={{ padding: '28px 36px' }}>
      <div style={{ maxWidth: 680, marginBottom: 32 }}>
        <p style={{ fontFamily: SERIF, fontSize: 19, lineHeight: 1.55, fontStyle: 'italic', color: 'var(--ink-2)' }}>
          The chamber, expressed in agents. Each owns a deterministic seat — no overlapping responsibilities, no
          ambiguity, no shift change.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {CONSOLE_AGENTS.map((a) => (
          <div key={a.name} style={{ ...card, padding: '28px 26px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 14, right: 18, fontFamily: MONO, fontSize: 11, letterSpacing: '.22em', color: 'var(--accent)' }}>
              № {a.glyph}
            </span>
            <h3 style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 400, margin: '0 0 4px', letterSpacing: '-.02em' }}>
              <em>{a.name}</em>
            </h3>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>
              {a.role}
            </div>
            <p style={{ fontFamily: SERIF, fontSize: 15, lineHeight: 1.55, margin: '0 0 22px', fontStyle: 'italic', color: 'var(--ink-2)' }}>{a.desc}</p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 14,
                borderTop: '1px solid var(--line)',
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              <span>{a.spec}</span>
              <span>load · {a.load}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
