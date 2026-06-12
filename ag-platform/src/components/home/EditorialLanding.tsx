// AG Associates landing — Editorial theme, ported from the claude.ai/design handoff.
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, AgLogo, MONO, SERIF } from '../ag/primitives';
import { LANDING_AGENTS, LANDING_STEPS, COMPARE, FLYWHEEL } from '../ag/landingData';
import type { LandingAgent } from '../ag/landingData';
import '../../styles/ag-editorial.css';

const sectionHeading: CSSProperties = {
  fontFamily: SERIF,
  fontSize: 'clamp(40px, 5.5vw, 72px)',
  lineHeight: 1,
  letterSpacing: '-.03em',
  fontWeight: 320,
  margin: '24px 0 16px',
};

function Nav() {
  const linkStyle: CSSProperties = { color: 'var(--ink)', textDecoration: 'none', fontSize: 13, opacity: 0.75 };
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--line)',
        background: 'rgba(245,241,232,.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="ag-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AgLogo />
          <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.5, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Banking Panel · Thane, MH
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#workforce" style={linkStyle}>Workforce</a>
          <a href="#workflow" style={linkStyle}>Workflow</a>
          <a href="#manifesto" style={linkStyle}>Manifesto</a>
          <a href="#flywheel" style={linkStyle}>Flywheel</a>
          <Link to="/login" style={linkStyle}>Sign in</Link>
          <Link
            to="/console"
            style={{
              ...linkStyle,
              opacity: 1,
              padding: '8px 14px',
              border: '1px solid var(--line)',
              borderRadius: 999,
              fontWeight: 500,
            }}
          >
            Live Dashboard →
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{ padding: '120px 0 80px', position: 'relative' }}>
      <div className="ag-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'baseline' }}>
          {/* LEFT — masthead */}
          <div>
            <div
              className="ag-rise-lg"
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '.3em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                borderBottom: '1px solid var(--line)',
                paddingBottom: 12,
                marginBottom: 28,
              }}
            >
              VOL. I &nbsp;·&nbsp; NO. 26 &nbsp;·&nbsp; THANE &nbsp;·&nbsp; APRIL MMXXVI
            </div>
            <h1
              className="ag-rise-lg"
              style={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontSize: 'clamp(64px, 9vw, 132px)',
                lineHeight: 0.9,
                letterSpacing: '-.04em',
                margin: '0 0 32px',
                animationDelay: '.1s',
              }}
            >
              The banking panel <em style={{ fontWeight: 300, color: 'var(--accent)' }}>without</em> a chamber of associates.
            </h1>
            <p
              className="ag-rise-lg"
              style={{
                fontFamily: SERIF,
                fontSize: 22,
                lineHeight: 1.4,
                color: 'var(--ink)',
                opacity: 0.85,
                fontStyle: 'italic',
                maxWidth: 540,
                margin: '0 0 28px',
                animationDelay: '.2s',
                fontWeight: 300,
              }}
            >
              An essay, in six agents, on what becomes of a banking-panel practice when the title search is instant, the
              mortgage deed drafts itself, and the CERSAI filing needs no clerk.
            </p>
            <div className="ag-rise-lg" style={{ display: 'flex', gap: 16, alignItems: 'center', animationDelay: '.35s' }}>
              <a
                href="#workflow"
                style={{
                  fontFamily: SERIF,
                  fontSize: 16,
                  color: 'var(--ink)',
                  borderBottom: '1px solid var(--accent)',
                  paddingBottom: 2,
                  textDecoration: 'none',
                  fontStyle: 'italic',
                }}
              >
                Read the dossier →
              </a>
              <span style={{ fontSize: 11, fontFamily: MONO, color: 'var(--muted)', letterSpacing: '.2em' }}>13 MIN</span>
            </div>
          </div>

          {/* RIGHT — opening paragraph as drop cap article */}
          <div className="ag-rise-lg" style={{ animationDelay: '.3s' }}>
            <div
              style={{
                border: '1px solid var(--line)',
                padding: 32,
                background: 'rgba(255,255,255,.4)',
                fontFamily: SERIF,
                fontSize: 17,
                lineHeight: 1.6,
                color: 'var(--ink)',
              }}
            >
              <p style={{ margin: 0, textIndent: 0 }}>
                <span
                  style={{
                    float: 'left',
                    fontFamily: SERIF,
                    fontSize: 88,
                    lineHeight: 0.85,
                    paddingRight: 10,
                    paddingTop: 6,
                    color: 'var(--accent)',
                    fontWeight: 400,
                  }}
                >
                  A
                </span>
                t the offices of Maharashtra's bank home loan panels one might still find rooms where title deeds
                accumulate and junior associates compile reports. Adv.&nbsp;Aditya&nbsp;Gade keeps no such rooms. The loan
                file arrives from the bank; an agent named <em>Aisha</em> receives it. Four hours later, a
                SARFAESI-compliant mortgage deed is registered and the CERSAI charge filed — and not one human associate
                has touched the papers.
              </p>
              <p style={{ margin: '18px 0 0', color: 'var(--muted)', fontStyle: 'italic' }}>
                —&nbsp;On a quiet Tuesday in Thane, the firm cleared twenty-three home loan files before lunch.
              </p>
            </div>

            {/* byline */}
            <div
              style={{
                marginTop: 18,
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '.2em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
              }}
            >
              <span>Adv. Aditya Gade</span>
              <span>Architect &amp; Counsel</span>
            </div>
          </div>
        </div>

        {/* stats — editorial style: rule + figures */}
        <div
          className="ag-rise-lg"
          style={{
            marginTop: 96,
            borderTop: '2px solid var(--ink)',
            paddingTop: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 32,
            animationDelay: '.5s',
          }}
        >
          {([
            ['IV', 'hours, file to CERSAI'],
            ['VI', 'autonomous agents'],
            ['0', 'human staff'],
            ['100%', 'local inference'],
          ] as [string, string][]).map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: SERIF, fontSize: 64, fontWeight: 300, lineHeight: 1, letterSpacing: '-.04em', color: 'var(--accent)' }}>
                {v}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.18em', marginTop: 10, fontFamily: MONO }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section id="manifesto" style={{ padding: '120px 0', borderTop: '1px solid var(--line)' }}>
      <div className="ag-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start', marginBottom: 48 }}>
          <div>
            <Eyebrow>§ Manifesto</Eyebrow>
            <h2 style={{ ...sectionHeading, lineHeight: 1.0, margin: '24px 0 0' }}>
              Linear scaling <em>breaks</em>.<br />Exponential scaling <em>thrives</em>.
            </h2>
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 19, lineHeight: 1.6, color: 'var(--muted)', paddingTop: 32, fontStyle: 'italic' }}>
            The traditional banking-panel practice hires junior associates to chase title chains and draft mortgage
            deeds. Each new empanelled bank requires another head, another error surface, another compliance gap. We
            chose the other path: six agents with perfect recall of SARFAESI, RBI circulars, and Maharashtra stamp duty
            schedules — and zero fatigue.
          </p>
        </div>

        {/* comparison table */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,.4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.5fr 1.5fr',
              padding: '14px 24px',
              borderBottom: '1px solid var(--line)',
              color: 'var(--muted)',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
            }}
          >
            <span>Dimension</span>
            <span style={{ color: '#ff8087' }}>✕ Traditional</span>
            <span style={{ color: '#22c55e' }}>✓ Agentic</span>
          </div>
          {COMPARE.map(([d, t, a], i) => (
            <div
              key={d}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr 1.5fr',
                padding: '22px 24px',
                borderBottom: i < COMPARE.length - 1 ? '1px solid var(--line)' : 'none',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 500, fontFamily: SERIF, fontSize: 17 }}>{d}</span>
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>{t}</span>
              <span style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>{a}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentCard({ agent }: { agent: LandingAgent }) {
  return (
    <article
      style={{
        padding: '32px 28px',
        background: 'rgba(255,255,255,.5)',
        border: '1px solid var(--line)',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span style={{ position: 'absolute', top: 14, right: 18, fontFamily: MONO, fontSize: 11, letterSpacing: '.2em', color: 'var(--accent)' }}>
        № {agent.glyph}
      </span>
      <h3 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 400, margin: '0 0 4px', letterSpacing: '-.02em', color: 'var(--ink)' }}>
        <em>{agent.name}</em>
      </h3>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16 }}>
        {agent.role}
      </div>
      <p style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.55, color: 'var(--ink)', opacity: 0.85, margin: '0 0 24px', fontStyle: 'italic', fontWeight: 300 }}>
        {agent.desc}
      </p>
      <div style={{ paddingTop: 14, borderTop: '1px solid var(--line)', fontFamily: MONO, fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {agent.spec}
      </div>
    </article>
  );
}

function Roster() {
  return (
    <section id="workforce" style={{ padding: '120px 0', borderTop: '1px solid var(--line)' }}>
      <div className="ag-container">
        <div style={{ maxWidth: 760, marginBottom: 64 }}>
          <Eyebrow>§ The Workforce</Eyebrow>
          <h2 style={sectionHeading}>
            Six agents.<br /><em>One firm.</em>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.6, maxWidth: 560 }}>
            Each agent owns a deterministic seat — no overlapping responsibilities, no human ambiguity, no shift change.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {LANDING_AGENTS.map((a) => (
            <AgentCard key={a.name} agent={a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section id="workflow" style={{ padding: '120px 0', borderTop: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
      <div className="ag-container">
        <div style={{ maxWidth: 760, marginBottom: 80 }}>
          <Eyebrow>§ End-to-End</Eyebrow>
          <h2 style={sectionHeading}>
            Same business day,<br /><em>file to registration.</em>
          </h2>
        </div>

        <div style={{ position: 'relative' }}>
          {/* connector */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 32,
              height: 1,
              background: 'var(--accent)',
              opacity: 0.35,
              transform: 'scaleX(0)',
              transformOrigin: 'left',
              animation: 'ag-draw-line 1.4s .3s cubic-bezier(.22,1,.36,1) forwards',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {LANDING_STEPS.map((s, i) => (
              <div key={s.t} className="ag-rise-lg" style={{ textAlign: 'center', animationDelay: `${0.4 + i * 0.1}s` }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    margin: '0 auto 18px',
                    border: '1px solid var(--accent)',
                    background: 'rgba(255,255,255,.6)',
                    display: 'grid',
                    placeItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{s.t}</span>
                </div>
                <h4 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, margin: '0 0 6px', fontStyle: 'italic' }}>{s.label}</h4>
                <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--muted)', margin: 0, padding: '0 6px' }}>{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Flywheel() {
  return (
    <section id="flywheel" style={{ padding: '120px 0', borderTop: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
      <div className="ag-container" style={{ position: 'relative' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 64px' }}>
          <Eyebrow>§ Synthesis</Eyebrow>
          <h2 style={sectionHeading}>
            The flywheel <em>compounds.</em>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.6, maxWidth: 560, margin: '16px auto 0' }}>
            Three forces interlock. Each filing makes the next one cheaper, faster, more accurate.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {FLYWHEEL.map((f, i) => (
            <div
              key={f.k}
              style={{
                padding: 32,
                border: '1px solid var(--line)',
                borderRadius: 14,
                background: 'rgba(255,255,255,.5)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.25em', color: 'var(--accent)', marginBottom: 14 }}>
                0{i + 1} / 03
              </div>
              <h3 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: '0 0 12px', letterSpacing: '-.02em' }}>{f.k}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--muted)', margin: 0 }}>{f.v}</p>
            </div>
          ))}
        </div>

        {/* pull quote */}
        <blockquote style={{ margin: '80px auto 0', maxWidth: 880, textAlign: 'center', padding: '40px 32px', borderLeft: '2px solid var(--accent)' }}>
          <p style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1.4, fontWeight: 320, margin: 0, fontStyle: 'italic', letterSpacing: '-.01em' }}>
            “Agentic AI is not a chatbot. It is a perfectly loyal, hyper-efficient state machine — and with every
            transaction, the database grows smarter, until the marginal cost approaches zero.”
          </p>
          <footer style={{ marginTop: 24, fontFamily: MONO, fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            — Adv. Aditya Gade, AG Associates
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="dashboard" style={{ padding: '64px 0 48px', borderTop: '1px solid var(--line)' }}>
      <div className="ag-container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, alignItems: 'start' }}>
          <div>
            <AgLogo />
            <p style={{ marginTop: 18, color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, maxWidth: 340 }}>
              Banking-panel home loan counsel, Thane, Maharashtra. Title verification, SARFAESI mortgage deeds, and
              CERSAI filings — fully automated, end to end.
            </p>
          </div>
          {([
            ['Practice', ['Mortgage Deeds', 'CERSAI Filing', 'Title Verification', 'SARFAESI Compliance']],
            ['System', ['Live Dashboard', 'API Status', 'Audit Log', 'Templates']],
            ['Contact', ['advocate@ag-associates.in', '+91 · WhatsApp Only', 'Thane · MH', 'GitHub']],
          ] as [string, string[]][]).map(([h, items]) => (
            <div key={h}>
              <h5 style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', margin: '0 0 16px', color: 'var(--accent)' }}>
                {h}
              </h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((x) => (
                  <li key={x} style={{ fontSize: 13, color: 'var(--ink)', opacity: 0.85 }}>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}
        >
          <span>© MMXXVI · AG Associates</span>
          <span>Bar Council of Maharashtra · ENR/THN/2024</span>
          <span>Built with the ₹7T prompter methodology</span>
        </div>
      </div>
    </footer>
  );
}

export default function EditorialLanding() {
  return (
    <div className="ag-editorial ag-landing">
      <div className="ag-grid-bg" aria-hidden="true" />
      <Nav />
      <Hero />
      <Manifesto />
      <Roster />
      <Workflow />
      <Flywheel />
      <Footer />
    </div>
  );
}
