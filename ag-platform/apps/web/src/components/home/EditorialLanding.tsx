// AG Associates landing — Editorial theme, ported from the claude.ai/design handoff.
import type { CSSProperties } from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, AgLogo, MONO, SERIF } from '../ag/primitives';
import { LANDING_AGENTS, LANDING_STEPS, COMPARE, FLYWHEEL } from '../ag/landingData';
import type { LandingAgent } from '../ag/landingData';
import { TweaksPanel, TweakSection, TweakRadio, TweakToggle, shouldShowTweaks, getThemeFromUrl, DEFAULT_TWEAKS } from '../dev/TweaksPanel';
import type { AGTheme, AGTweakState } from '../dev/TweaksPanel';
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

function HeroBlueprint() {
  return (
    <section style={{ padding: '120px 0 80px', position: 'relative' }}>
      <div className="ag-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div
              className="ag-rise-lg"
              style={{
                fontFamily: MONO, fontSize: 11, letterSpacing: '.3em', textTransform: 'uppercase',
                color: 'var(--accent-2)', borderBottom: '1px solid var(--line)',
                paddingBottom: 12, marginBottom: 28,
              }}
            >
              AG ASSOCIATES · INTELLIGENCE PLATFORM v2.0
            </div>
            <h1
              className="ag-rise-lg"
              style={{
                fontFamily: SERIF, fontWeight: 300,
                fontSize: 'clamp(56px, 8vw, 112px)', lineHeight: 0.9,
                letterSpacing: '-.04em', margin: '0 0 32px', animationDelay: '.1s',
              }}
            >
              The banking panel <em style={{ color: 'var(--accent-3)' }}>without</em> associates.
            </h1>
            <p
              className="ag-rise-lg"
              style={{
                fontSize: 18, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: 520,
                margin: '0 0 32px', animationDelay: '.2s',
              }}
            >
              Six autonomous agents process home loan files from bank intake through CERSAI registration in under four hours. No junior associates. No shift handoffs. No errors.
            </p>
            <div className="ag-rise-lg" style={{ display: 'flex', gap: 20, alignItems: 'center', animationDelay: '.35s' }}>
              <Link
                to="/console"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 6,
                  background: 'linear-gradient(135deg, var(--accent-2), var(--accent-3))',
                  color: '#fff', fontWeight: 500, fontSize: 14, textDecoration: 'none',
                }}
              >
                Live Dashboard →
              </Link>
              <a
                href="#workflow"
                style={{ fontSize: 14, color: 'var(--accent-2)', borderBottom: '1px solid var(--accent-2)', paddingBottom: 2, textDecoration: 'none' }}
              >
                How it works →
              </a>
            </div>
          </div>

          {/* right — agent metrics panel mockup */}
          <div className="ag-rise-lg" style={{ animationDelay: '.3s' }}>
            <div
              style={{
                border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden',
                background: 'rgba(255,255,255,.04)', backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Agent Cluster · Online</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: '#22c55e' }}>● All 6 active</span>
                </div>
                {['Aisha', 'Kasun', 'Ravi', 'Lakshmi', 'Priya', 'Arjun'].map((name, i) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: i > 0 ? '1px solid var(--line)' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(91, 141, 239, 0.2)', display: 'grid', placeItems: 'center', fontFamily: MONO, fontSize: 10, color: 'var(--accent-2)' }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span style={{ flex: 1, fontSize: 13 }}>{name}</span>
                    <div style={{ width: 80, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
                      <div style={{ width: `${60 + i * 6}%`, height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, var(--accent-2), var(--accent-3))' }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--muted)' }}>{60 + i * 6}%</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '14px 24px', background: 'rgba(255,255,255,.03)', display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, color: 'var(--muted)' }}>
                <span>Today: 23 files</span>
                <span>Avg TAT: 3.2h</span>
                <span>CERSAI: 19 filed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ag-rise-lg" style={{ marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, borderTop: '1px solid var(--line)', paddingTop: 28, animationDelay: '.5s' }}>
          {([
            ['4 hrs', 'Avg. file-to-CERSAI'],
            ['6', 'Autonomous agents'],
            ['3.2', 'Median TAT (hours)'],
            ['100%', 'Local inference'],
          ]).map(([v, l]) => (
            <div key={l}>
              <div style={{ fontFamily: SERIF, fontSize: 56, fontWeight: 300, lineHeight: 1, letterSpacing: '-.04em', color: 'var(--accent-3)' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.18em', marginTop: 8, fontFamily: MONO }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroBrutalist() {
  return (
    <section style={{ padding: '120px 0 80px', position: 'relative' }}>
      <div className="ag-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'baseline' }}>
          <div>
            <div
              className="ag-rise-lg"
              style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase',
                color: 'var(--accent-3)', marginBottom: 28,
              }}
            >
              ⚡ AG ASSOCIATES / THANE
            </div>
            <h1
              className="ag-rise-lg"
              style={{
                fontFamily: MONO, fontWeight: 600,
                fontSize: 'clamp(52px, 7vw, 96px)', lineHeight: 0.85,
                letterSpacing: '-.04em', margin: '0 0 32px', textTransform: 'uppercase',
                animationDelay: '.1s', color: 'var(--ink)',
              }}
            >
              BANKING PANEL <span style={{ background: 'var(--accent)', color: '#000', padding: '0 8px' }}>WITHOUT</span> THE STAFF
            </h1>
            <p
              className="ag-rise-lg"
              style={{
                fontFamily: MONO, fontSize: 13, lineHeight: 1.45, color: 'var(--muted)',
                maxWidth: 500, margin: '0 0 28px', animationDelay: '.2s',
              }}
            >
              Six agents. Zero associates. Full SARFAESI compliance. Title search to CERSAI deed in under four hours — running entirely on local inference.
            </p>
            <div className="ag-rise-lg" style={{ display: 'flex', gap: 16, alignItems: 'center', animationDelay: '.35s' }}>
              <Link
                to="/console"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 28px', border: '3px solid var(--ink)', background: 'var(--accent)',
                  color: '#000', fontWeight: 700, fontSize: 13, textDecoration: 'none',
                  fontFamily: MONO, textTransform: 'uppercase',
                }}
              >
                → Live Dashboard
              </Link>
              <a
                href="#workforce"
                style={{ fontFamily: MONO, fontSize: 12, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 4 }}
              >
                Meet the agents ↓
              </a>
            </div>
          </div>

          {/* right — bold stat board */}
          <div className="ag-rise-lg" style={{ animationDelay: '.3s' }}>
            <div style={{ border: '3px solid var(--ink)', background: '#fff', padding: 0 }}>
              <div style={{ borderBottom: '3px solid var(--ink)', padding: '16px 24px', background: 'var(--ink)', color: 'var(--accent)' }}>
                <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase' }}>SYS.REPORT / $(date)</span>
              </div>
              {([
                ['TODAY', '23', 'files processed'],
                ['MEDIAN TAT', '3.2h', 'bank→CERSAI'],
                ['ERROR RATE', '0.0%', 'last 500 files'],
                ['HUMAN STAFF', '0', 'full-time equivalent'],
              ] as [string, string, string][]).map(([label, val, unit], i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: i < 3 ? '1px solid var(--line)' : 'none' }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, lineHeight: 1, color: 'var(--ink)' }}>{val}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--muted)', display: 'block', marginTop: 2 }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
  const [tweaks, setTweaks] = useState<AGTweakState>(() => {
    const urlTheme = getThemeFromUrl();
    return { ...DEFAULT_TWEAKS, ...(urlTheme ? { theme: urlTheme } : {}) };
  });

  const showTweaks = shouldShowTweaks();

  useEffect(() => {
    if (showTweaks) {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('theme') && tweaks.theme !== DEFAULT_TWEAKS.theme) {
        params.set('theme', tweaks.theme);
        window.history.replaceState(null, '', `?${params.toString()}`);
      }
    }
  }, [tweaks.theme, showTweaks]);

  const setTheme = (theme: AGTheme) => setTweaks((t) => ({ ...t, theme }));

  const HeroComponent = tweaks.theme === 'blueprint' ? HeroBlueprint : tweaks.theme === 'brutalist' ? HeroBrutalist : Hero;

  return (
    <div className="ag-editorial ag-landing" data-theme={tweaks.theme}>
      <div className="ag-grid-bg" aria-hidden="true" />
      <Nav />
      <HeroComponent />
      <Manifesto />
      <Roster />
      {tweaks.showWorkflow && <Workflow />}
      {tweaks.showFlywheel && <Flywheel />}
      <Footer />

      {showTweaks && (
        <TweaksPanel title="AG Tweaks">
          <TweakSection label="Theme" />
          <TweakRadio
            label="Variant"
            value={tweaks.theme}
            options={[
              { value: 'blueprint', label: 'Blueprint' },
              { value: 'editorial', label: 'Editorial' },
              { value: 'brutalist', label: 'Brutalist' },
            ]}
            onChange={(v) => setTheme(v as AGTheme)}
          />
          <TweakSection label="Sections" />
          <TweakToggle label="Show Workflow" value={tweaks.showWorkflow} onChange={(v) => setTweaks((t) => ({ ...t, showWorkflow: v }))} />
          <TweakToggle label="Show Flywheel" value={tweaks.showFlywheel} onChange={(v) => setTweaks((t) => ({ ...t, showFlywheel: v }))} />
        </TweaksPanel>
      )}
    </div>
  );
}
