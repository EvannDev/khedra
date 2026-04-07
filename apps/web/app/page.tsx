import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { RiCalendarScheduleLine, RiArrowRightLine } from "@remixicon/react"

// ── Schedule grid data ─────────────────────────────────────────────────────
const SCHEDULE = [
  { label: "AM",  color: "#F0B429", dim: "rgba(240,180,41,0.15)",  slots: [true,  false, true,  true,  false, true,  false] },
  { label: "PM",  color: "#2DD4BF", dim: "rgba(45,212,191,0.15)",  slots: [false, true,  true,  false, true,  false, false] },
  { label: "EVE", color: "#A78BFA", dim: "rgba(167,139,250,0.15)", slots: [true,  true,  false, true,  true,  false, false] },
]
const DAYS = ["M", "T", "W", "T", "F", "S", "S"]

// ── Constraint marquee ─────────────────────────────────────────────────────
const CONSTRAINTS = [
  "max_hours_per_week",
  "unavailability",
  "min_rest_between_shifts",
  "max_consecutive_days",
  "required_skill",
  "weekend_fairness",
  "shift_preference",
  "min_employees_per_shift",
]

// ── Features ───────────────────────────────────────────────────────────────
const FEATURES = [
  {
    num: "01",
    title: "Constraint Engine",
    body: "Define hard and soft rules — max hours, unavailability windows, rest periods, skill requirements, fairness caps. Khedra handles every combination.",
  },
  {
    num: "02",
    title: "Plain Language Rules",
    body: "Type \"Alice can't work Mondays\" and Khedra translates it into a precise scheduling constraint. No configuration required.",
  },
  {
    num: "03",
    title: "Instant Optimization",
    body: "Google OR-Tools CP-SAT finds the optimal schedule in seconds. Not hours. Not spreadsheets. Done.",
  },
]

// ── Steps ──────────────────────────────────────────────────────────────────
const STEPS = [
  { n: "1", title: "Set up your team", body: "Add employees, define roles, list skills. One-time setup that stays accurate." },
  { n: "2", title: "Define constraints", body: "Use the builder or just write in plain English. Khedra captures every rule." },
  { n: "3", title: "Generate & export", body: "Hit solve. Review the optimal schedule. Export to whatever you use." },
]

// ── Stats ──────────────────────────────────────────────────────────────────
const STATS = [
  { value: "500+",  label: "Teams scheduled" },
  { value: "< 3s",  label: "Average solve time" },
  { value: "Zero",  label: "Scheduling conflicts" },
]

export default async function LandingPage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  return (
    <div style={{ background: "#0A0A0B", color: "#F0EFE8", fontFamily: "var(--font-sans, sans-serif)", overflowX: "hidden" }}>
      <style>{STYLES}</style>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <header className="lp-nav">
        <Link href="/" className="lp-logo">
          <div className="lp-logo-icon">
            <RiCalendarScheduleLine style={{ width: 16, height: 16, color: "#0A0A0B" }} />
          </div>
          <span className="lp-logo-text">khedra</span>
        </Link>
        <div className="lp-nav-right">
          <Link href="/sign-in" className="lp-nav-link">Sign in</Link>
          <Link href="/sign-in" className="lp-btn-primary lp-btn-sm">
            Get started <RiArrowRightLine style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">

          {/* Label */}
          <div className="lp-label lp-fade" style={{ animationDelay: "0ms" }}>
            Constraint-aware shift optimization
          </div>

          {/* Headline */}
          <h1 className="lp-h1 lp-fade" style={{ animationDelay: "80ms" }}>
            Stop guessing.<br />
            <span className="lp-h1-accent">Start scheduling.</span>
          </h1>

          {/* Sub */}
          <p className="lp-sub lp-fade" style={{ animationDelay: "160ms" }}>
            Khedra generates optimal shift schedules from your constraints — hours, skills,
            availability, and fairness rules. Describe rules in plain English. Get a perfect
            schedule in seconds.
          </p>

          {/* CTAs */}
          <div className="lp-cta-row lp-fade" style={{ animationDelay: "240ms" }}>
            <Link href="/sign-in" className="lp-btn-primary lp-btn-lg">
              Get started free <RiArrowRightLine style={{ width: 16, height: 16 }} />
            </Link>
            <a href="#how-it-works" className="lp-btn-ghost lp-btn-lg">
              See how it works
            </a>
          </div>

          {/* Schedule grid */}
          <div className="lp-grid-wrap lp-fade" style={{ animationDelay: "320ms" }}>
            <div className="lp-grid-header">
              <div className="lp-grid-corner" />
              {DAYS.map((d, i) => (
                <div key={i} className={`lp-grid-day${i >= 5 ? " lp-grid-day--weekend" : ""}`}>{d}</div>
              ))}
            </div>
            {SCHEDULE.map((row, ri) => (
              <div key={ri} className="lp-grid-row">
                <div className="lp-grid-label" style={{ color: row.color }}>{row.label}</div>
                {row.slots.map((active, ci) => {
                  const delay = (ri * 7 + ci) * 55
                  return (
                    <div
                      key={ci}
                      className={`lp-grid-cell${active ? " lp-grid-cell--active" : ""}`}
                      style={active ? {
                        background: row.dim,
                        borderColor: row.color,
                        animationDelay: `${320 + delay}ms`,
                      } : {
                        animationDelay: `${320 + delay}ms`,
                      }}
                    >
                      {active && <div className="lp-grid-dot" style={{ background: row.color }} />}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

        </div>

        {/* Background glow */}
        <div className="lp-hero-glow" />
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <div className="lp-stats-bar">
        {STATS.map((s, i) => (
          <div key={i} className="lp-stat">
            <span className="lp-stat-value">{s.value}</span>
            <span className="lp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Marquee ───────────────────────────────────────────────────── */}
      <div className="lp-marquee-wrap">
        <div className="lp-marquee">
          {[...CONSTRAINTS, ...CONSTRAINTS].map((c, i) => (
            <span key={i} className="lp-marquee-item">
              <span className="lp-marquee-dot" />
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-label">What Khedra does</div>
            <h2 className="lp-h2">Everything you need.<br />Nothing you don&apos;t.</h2>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div key={f.num} className="lp-feature-card">
                <span className="lp-feature-num">{f.num}</span>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="lp-section lp-section--alt" id="how-it-works">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-label">The process</div>
            <h2 className="lp-h2">From constraints<br />to schedule in minutes.</h2>
          </div>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-num">{s.n}</div>
                <div className="lp-step-content">
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-body">{s.body}</p>
                </div>
                {i < STEPS.length - 1 && <div className="lp-step-line" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-container">
          <div className="lp-cta-inner">
            <div className="lp-cta-glow" />
            <div className="lp-label" style={{ color: "#F0B429" }}>Ready when you are</div>
            <h2 className="lp-cta-h2">
              Your team deserves<br />a better schedule.
            </h2>
            <p className="lp-cta-sub">
              Set up in minutes. No credit card required.
            </p>
            <Link href="/sign-in" className="lp-btn-primary lp-btn-xl">
              Start scheduling free <RiArrowRightLine style={{ width: 18, height: 18 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <Link href="/" className="lp-logo">
            <div className="lp-logo-icon">
              <RiCalendarScheduleLine style={{ width: 14, height: 14, color: "#0A0A0B" }} />
            </div>
            <span className="lp-logo-text" style={{ fontSize: 15 }}>khedra</span>
          </Link>
          <p className="lp-footer-copy">© 2025 Khedra. Smarter shifts, happier teams.</p>
        </div>
      </footer>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const STYLES = `
  /* Tokens */
  :root {
    --lp-amber: #F0B429;
    --lp-amber-10: rgba(240,180,41,0.10);
    --lp-amber-20: rgba(240,180,41,0.20);
    --lp-amber-40: rgba(240,180,41,0.40);
    --lp-border: rgba(255,255,255,0.07);
    --lp-surface: #111113;
    --lp-muted: #5C5C68;
    --lp-display: var(--font-fraunces, Georgia, serif);
    --lp-mono: var(--font-ibm-mono, monospace);
  }

  /* Keyframes */
  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-cell-in {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes lp-marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes lp-pulse-amber {
    0%, 100% { box-shadow: 0 0 0 0 rgba(240,180,41,0); }
    50%       { box-shadow: 0 0 12px 2px rgba(240,180,41,0.25); }
  }

  /* Fade utility */
  .lp-fade {
    opacity: 0;
    animation: lp-fade-up 0.55s ease forwards;
  }

  /* Nav */
  .lp-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 clamp(20px, 5vw, 60px);
    height: 58px;
    background: rgba(10,10,11,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--lp-border);
  }
  .lp-logo {
    display: flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
  }
  .lp-logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--lp-amber);
    flex-shrink: 0;
  }
  .lp-logo-text {
    font-family: var(--lp-display);
    font-size: 18px;
    font-weight: 600;
    color: #F0EFE8;
    letter-spacing: -0.3px;
  }
  .lp-nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .lp-nav-link {
    font-size: 14px;
    color: var(--lp-muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .lp-nav-link:hover { color: #F0EFE8; }

  /* Buttons */
  .lp-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--lp-amber);
    color: #0A0A0B;
    font-weight: 600;
    border-radius: 9px;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    white-space: nowrap;
  }
  .lp-btn-primary:hover {
    background: #FFCC44;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(240,180,41,0.35);
  }
  .lp-btn-sm  { padding: 7px 14px; font-size: 13px; }
  .lp-btn-lg  { padding: 12px 22px; font-size: 15px; }
  .lp-btn-xl  { padding: 15px 28px; font-size: 16px; border-radius: 11px; }

  .lp-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 12px 22px;
    font-size: 15px;
    font-weight: 500;
    color: var(--lp-muted);
    border: 1px solid var(--lp-border);
    border-radius: 9px;
    text-decoration: none;
    transition: color 0.2s, border-color 0.2s;
  }
  .lp-btn-ghost:hover {
    color: #F0EFE8;
    border-color: rgba(255,255,255,0.2);
  }

  /* Hero */
  .lp-hero {
    position: relative;
    padding: clamp(70px, 10vw, 120px) clamp(20px, 5vw, 60px) clamp(60px, 8vw, 100px);
    overflow: hidden;
  }
  .lp-hero-inner {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0;
  }
  .lp-hero-glow {
    position: absolute;
    top: -120px;
    left: 50%;
    transform: translateX(-50%);
    width: 700px;
    height: 500px;
    background: radial-gradient(ellipse at center, rgba(240,180,41,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* Label */
  .lp-label {
    font-family: var(--lp-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-amber);
    margin-bottom: 20px;
  }

  /* Headline */
  .lp-h1 {
    font-family: var(--lp-display);
    font-size: clamp(44px, 7vw, 80px);
    font-weight: 500;
    line-height: 1.04;
    letter-spacing: -2px;
    color: #F0EFE8;
    margin-bottom: 24px;
  }
  .lp-h1-accent {
    color: var(--lp-amber);
  }
  .lp-h2 {
    font-family: var(--lp-display);
    font-size: clamp(32px, 4.5vw, 52px);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -1.5px;
    color: #F0EFE8;
    margin-top: 12px;
  }

  /* Sub */
  .lp-sub {
    max-width: 520px;
    font-size: 17px;
    line-height: 1.65;
    color: var(--lp-muted);
    margin-bottom: 32px;
  }

  .lp-cta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 52px;
  }

  /* Schedule Grid */
  .lp-grid-wrap {
    width: 100%;
    max-width: 640px;
    background: var(--lp-surface);
    border: 1px solid var(--lp-border);
    border-radius: 16px;
    padding: 20px;
    position: relative;
    z-index: 1;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
  }
  .lp-grid-header, .lp-grid-row {
    display: grid;
    grid-template-columns: 44px repeat(7, 1fr);
    gap: 6px;
    margin-bottom: 6px;
  }
  .lp-grid-corner { width: 44px; }
  .lp-grid-day {
    font-family: var(--lp-mono);
    font-size: 11px;
    font-weight: 500;
    color: var(--lp-muted);
    text-align: center;
    padding: 4px 0;
  }
  .lp-grid-day--weekend { opacity: 0.45; }
  .lp-grid-label {
    font-family: var(--lp-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    padding-right: 8px;
  }
  .lp-grid-cell {
    height: 36px;
    border-radius: 7px;
    border: 1px solid transparent;
    background: rgba(255,255,255,0.03);
    opacity: 0;
    animation: lp-cell-in 0.3s ease forwards;
    transition: transform 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .lp-grid-cell--active {
    animation: lp-cell-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }
  .lp-grid-cell--active:hover {
    transform: scale(1.06);
  }
  .lp-grid-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    opacity: 0.8;
  }

  /* Stats bar */
  .lp-stats-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    border-top: 1px solid var(--lp-border);
    border-bottom: 1px solid var(--lp-border);
    background: var(--lp-surface);
  }
  .lp-stat {
    flex: 1;
    max-width: 260px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 28px 20px;
    border-right: 1px solid var(--lp-border);
  }
  .lp-stat:last-child { border-right: none; }
  .lp-stat-value {
    font-family: var(--lp-display);
    font-size: 36px;
    font-weight: 600;
    color: var(--lp-amber);
    letter-spacing: -1px;
    line-height: 1;
  }
  .lp-stat-label {
    font-family: var(--lp-mono);
    font-size: 11px;
    color: var(--lp-muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* Marquee */
  .lp-marquee-wrap {
    overflow: hidden;
    border-bottom: 1px solid var(--lp-border);
    padding: 14px 0;
    background: #0A0A0B;
  }
  .lp-marquee {
    display: flex;
    width: max-content;
    animation: lp-marquee 22s linear infinite;
  }
  .lp-marquee-item {
    font-family: var(--lp-mono);
    font-size: 12px;
    color: var(--lp-muted);
    padding: 0 28px;
    display: flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
  }
  .lp-marquee-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--lp-amber);
    opacity: 0.6;
    flex-shrink: 0;
  }

  /* Sections */
  .lp-section {
    padding: clamp(70px, 8vw, 110px) clamp(20px, 5vw, 60px);
  }
  .lp-section--alt {
    background: var(--lp-surface);
    border-top: 1px solid var(--lp-border);
    border-bottom: 1px solid var(--lp-border);
  }
  .lp-container {
    max-width: 960px;
    margin: 0 auto;
  }
  .lp-section-header {
    text-align: center;
    margin-bottom: 56px;
  }

  /* Features */
  .lp-features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 2px;
    border: 1px solid var(--lp-border);
    border-radius: 16px;
    overflow: hidden;
    background: var(--lp-border);
  }
  .lp-feature-card {
    background: #0A0A0B;
    padding: 36px 32px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: background 0.2s;
  }
  .lp-feature-card:hover { background: #0F0F11; }
  .lp-feature-num {
    font-family: var(--lp-mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--lp-amber);
    letter-spacing: 0.08em;
  }
  .lp-feature-title {
    font-family: var(--lp-display);
    font-size: 22px;
    font-weight: 500;
    color: #F0EFE8;
    letter-spacing: -0.5px;
  }
  .lp-feature-body {
    font-size: 14px;
    line-height: 1.65;
    color: var(--lp-muted);
  }

  /* Steps */
  .lp-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
    max-width: 640px;
    margin: 0 auto;
    position: relative;
  }
  .lp-step {
    display: flex;
    gap: 28px;
    position: relative;
  }
  .lp-step-num {
    font-family: var(--lp-display);
    font-size: 48px;
    font-weight: 500;
    color: var(--lp-amber);
    line-height: 1;
    flex-shrink: 0;
    width: 52px;
    letter-spacing: -2px;
    opacity: 0.9;
  }
  .lp-step-content {
    padding: 6px 0 44px;
  }
  .lp-step-title {
    font-size: 18px;
    font-weight: 600;
    color: #F0EFE8;
    margin-bottom: 8px;
    letter-spacing: -0.3px;
  }
  .lp-step-body {
    font-size: 14px;
    line-height: 1.65;
    color: var(--lp-muted);
  }
  .lp-step-line {
    position: absolute;
    left: 24px;
    top: 52px;
    bottom: 0;
    width: 1px;
    background: var(--lp-border);
  }

  /* CTA section */
  .lp-cta-section {
    padding: clamp(80px, 10vw, 130px) clamp(20px, 5vw, 60px);
    overflow: hidden;
  }
  .lp-cta-inner {
    max-width: 640px;
    margin: 0 auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    position: relative;
  }
  .lp-cta-glow {
    position: absolute;
    top: -80px;
    left: 50%;
    transform: translateX(-50%);
    width: 500px;
    height: 300px;
    background: radial-gradient(ellipse at center, rgba(240,180,41,0.10) 0%, transparent 70%);
    pointer-events: none;
  }
  .lp-cta-h2 {
    font-family: var(--lp-display);
    font-size: clamp(36px, 5vw, 58px);
    font-weight: 500;
    letter-spacing: -1.5px;
    line-height: 1.07;
    color: #F0EFE8;
    margin: 12px 0 16px;
  }
  .lp-cta-sub {
    font-size: 15px;
    color: var(--lp-muted);
    margin-bottom: 32px;
  }

  /* Footer */
  .lp-footer {
    border-top: 1px solid var(--lp-border);
    padding: 28px clamp(20px, 5vw, 60px);
  }
  .lp-footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }
  .lp-footer-copy {
    font-family: var(--lp-mono);
    font-size: 12px;
    color: var(--lp-muted);
  }

  /* Mobile tweaks */
  @media (max-width: 600px) {
    .lp-stats-bar { flex-direction: column; }
    .lp-stat { border-right: none; border-bottom: 1px solid var(--lp-border); width: 100%; max-width: 100%; }
    .lp-stat:last-child { border-bottom: none; }
    .lp-h1 { letter-spacing: -1px; }
    .lp-step-num { font-size: 36px; }
  }
`
