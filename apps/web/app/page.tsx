import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { RiCalendarScheduleLine, RiArrowRightLine } from "@remixicon/react"

// ── Product card data ──────────────────────────────────────────────────────
const CARD_EMPLOYEES = [
  { name: "Alice M.",   color: "#F0B429", shifts: ["AM",  null, "AM",  null, "PM",  null,  null] },
  { name: "Bob K.",     color: "#2DD4BF", shifts: [null,  "PM", null,  "AM", null,  "AM",  null] },
  { name: "Charlie D.", color: "#A78BFA", shifts: ["EVE", null, "PM",  "PM", null,  null,  null] },
  { name: "Diana L.",   color: "#F97316", shifts: [null,  "AM", null,  null, "AM",  "PM",  null] },
]
const CARD_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const SHIFT_COLORS: Record<string, string> = {
  AM:  "#F0B429",
  PM:  "#2DD4BF",
  EVE: "#A78BFA",
}

// ── Constraint library (all 11 types) ─────────────────────────────────────
const CONSTRAINT_TYPES = [
  { key: "max_hours_per_week",          color: "#F0B429" },
  { key: "unavailability",              color: "#2DD4BF" },
  { key: "min_rest_between_shifts",     color: "#A78BFA" },
  { key: "max_consecutive_days",        color: "#F97316" },
  { key: "required_skill",              color: "#EC4899" },
  { key: "weekend_fairness",            color: "#34D399" },
  { key: "shift_preference",            color: "#60A5FA" },
  { key: "min_employees_per_shift",     color: "#FB923C" },
  { key: "max_employees_per_shift",     color: "#C084FC" },
  { key: "holiday",                     color: "#F43F5E" },
  { key: "preferred_consecutive_days",  color: "#22D3EE" },
]

// ── Marquee rows ───────────────────────────────────────────────────────────
const MARQUEE_TOP = ["max_hours_per_week", "unavailability", "min_rest_between_shifts", "max_consecutive_days", "required_skill", "weekend_fairness", "holiday"]
const MARQUEE_BTM = ["shift_preference", "min_employees_per_shift", "max_employees_per_shift", "preferred_consecutive_days", "max_consecutive_days", "required_skill"]

// ── Features ───────────────────────────────────────────────────────────────
const FEATURES = [
  {
    num: "01",
    title: "Constraint Engine",
    body: "Define hard and soft rules — max hours, unavailability windows, rest periods, skill requirements, fairness caps. Khedra handles every combination.",
    tag: "11 built-in rule types",
  },
  {
    num: "02",
    title: "Plain Language Rules",
    body: "Type \"Alice can't work Mondays\" and Khedra translates it into a precise scheduling constraint. No configuration required.",
    tag: "Powered by Claude AI",
  },
  {
    num: "03",
    title: "Instant Optimization",
    body: "Google OR-Tools CP-SAT finds the optimal schedule in seconds. Not hours. Not spreadsheets. Done.",
    tag: "< 3s average solve time",
  },
]

// ── Steps ──────────────────────────────────────────────────────────────────
const STEPS = [
  { n: "1", title: "Set up your team",      body: "Add employees, define roles, list skills. One-time setup that stays accurate." },
  { n: "2", title: "Define constraints",    body: "Use the builder or just write in plain English. Khedra captures every rule." },
  { n: "3", title: "Generate & export",     body: "Hit solve. Review the optimal schedule. Export to whatever you use." },
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
        <div className="lp-hero-dotgrid" />
        <div className="lp-hero-glow" />

        <div className="lp-hero-layout">

          {/* Left: copy */}
          <div className="lp-hero-left">
            <div className="lp-label lp-fade" style={{ animationDelay: "0ms" }}>
              Constraint-aware shift optimization
            </div>
            <h1 className="lp-h1 lp-fade" style={{ animationDelay: "70ms" }}>
              Stop guessing.<br />
              <span className="lp-h1-accent">Start scheduling.</span>
            </h1>
            <p className="lp-sub lp-fade" style={{ animationDelay: "140ms" }}>
              Generate optimal shift schedules from your constraints — hours, skills,
              availability, and fairness rules. Describe rules in plain English.
              Get a perfect schedule in seconds.
            </p>
            <div className="lp-cta-row lp-fade" style={{ animationDelay: "210ms" }}>
              <Link href="/sign-in" className="lp-btn-primary lp-btn-lg">
                Get started free <RiArrowRightLine style={{ width: 16, height: 16 }} />
              </Link>
              <a href="#how-it-works" className="lp-btn-ghost lp-btn-lg">
                See how it works
              </a>
            </div>
            <div className="lp-trust-row lp-fade" style={{ animationDelay: "280ms" }}>
              {["No credit card", "Set up in minutes", "Free to start"].map((t) => (
                <span key={t} className="lp-trust-item">
                  <span className="lp-trust-check">✓</span>{t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: product card */}
          <div className="lp-hero-right lp-fade" style={{ animationDelay: "180ms" }}>
            <div className="lp-product-card">
              {/* Window chrome */}
              <div className="lp-card-chrome">
                <div className="lp-chrome-dots">
                  <span className="lp-chrome-dot" style={{ background: "#FF5F57" }} />
                  <span className="lp-chrome-dot" style={{ background: "#FFBD2E" }} />
                  <span className="lp-chrome-dot" style={{ background: "#28CA41" }} />
                </div>
                <span className="lp-chrome-title">Team Alpha · Week of Jan 13</span>
                <span className="lp-solve-badge">Solved · 2.1s</span>
              </div>

              {/* Schedule table */}
              <div className="lp-card-body">
                <table className="lp-card-table">
                  <thead>
                    <tr>
                      <th className="lp-ct-emp" />
                      {CARD_DAYS.map((d, i) => (
                        <th key={d} className={`lp-ct-day${i >= 5 ? " lp-ct-day--wknd" : ""}`}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CARD_EMPLOYEES.map((emp) => (
                      <tr key={emp.name}>
                        <td className="lp-ct-name">
                          <span className="lp-ct-avatar" style={{ background: emp.color + "30", borderColor: emp.color + "60" }}>
                            {emp.name[0]}
                          </span>
                          {emp.name}
                        </td>
                        {emp.shifts.map((shift, ci) => (
                          <td key={ci} className={`lp-ct-cell${ci >= 5 ? " lp-ct-cell--wknd" : ""}`}>
                            {shift && (
                              <span
                                className="lp-shift-pill"
                                style={{
                                  background: SHIFT_COLORS[shift] + "20",
                                  color: SHIFT_COLORS[shift],
                                  borderColor: SHIFT_COLORS[shift] + "55",
                                }}
                              >
                                {shift}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card footer */}
              <div className="lp-card-footer">
                <div className="lp-card-legend">
                  {Object.entries(SHIFT_COLORS).map(([name, color]) => (
                    <span key={name} className="lp-card-legend-item">
                      <span className="lp-card-legend-dot" style={{ background: color }} />
                      {name}
                    </span>
                  ))}
                </div>
                <span className="lp-card-score">Score: 94 / 100</span>
              </div>
            </div>
          </div>

        </div>
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

      {/* ── Double marquee ────────────────────────────────────────────── */}
      <div className="lp-marquee-wrap">
        <div className="lp-marquee">
          {[...MARQUEE_TOP, ...MARQUEE_TOP].map((c, i) => (
            <span key={i} className="lp-marquee-item">
              <span className="lp-marquee-dot" />
              {c}
            </span>
          ))}
        </div>
        <div className="lp-marquee lp-marquee--rev">
          {[...MARQUEE_BTM, ...MARQUEE_BTM].map((c, i) => (
            <span key={i} className="lp-marquee-item">
              <span className="lp-marquee-dot" style={{ background: "#2DD4BF" }} />
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
                <span className="lp-feature-tag">
                  <span className="lp-feature-tag-dot" />
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Constraint library ────────────────────────────────────────── */}
      <section className="lp-section lp-section--alt">
        <div className="lp-container">
          <div className="lp-section-header">
            <div className="lp-label">Constraint library</div>
            <h2 className="lp-h2">11 built-in rule types.<br />Every edge case covered.</h2>
            <p className="lp-section-sub">
              Mix and match hard constraints with soft preferences. Khedra finds the schedule that satisfies them all.
            </p>
          </div>
          <div className="lp-constraints-grid">
            {CONSTRAINT_TYPES.map((c) => (
              <div
                key={c.key}
                className="lp-constraint-pill"
                style={{
                  background: c.color + "15",
                  borderColor: c.color + "45",
                }}
              >
                <span className="lp-constraint-dot" style={{ background: c.color }} />
                <span className="lp-constraint-key">{c.key}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="lp-section" id="how-it-works">
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
            <p className="lp-cta-sub">Set up in minutes. No credit card required.</p>
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
  /* ── Tokens ── */
  :root {
    --lp-amber:    #F0B429;
    --lp-amber-10: rgba(240,180,41,0.10);
    --lp-amber-20: rgba(240,180,41,0.20);
    --lp-amber-40: rgba(240,180,41,0.40);
    --lp-border:   rgba(255,255,255,0.07);
    --lp-surface:  #111113;
    --lp-muted:    #5C5C68;
    --lp-display:  var(--font-fraunces, Georgia, serif);
    --lp-mono:     var(--font-ibm-mono, monospace);
  }

  /* ── Keyframes ── */
  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-marquee-fwd {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes lp-marquee-rev {
    from { transform: translateX(-50%); }
    to   { transform: translateX(0); }
  }
  @keyframes lp-float {
    0%, 100% { transform: translateY(0px) rotate(-1deg); }
    50%       { transform: translateY(-10px) rotate(-1deg); }
  }

  /* ── Fade-up helper ── */
  .lp-fade {
    opacity: 0;
    animation: lp-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* ── Nav ── */
  .lp-nav {
    position: sticky; top: 0; z-index: 50;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 clamp(20px, 5vw, 60px);
    height: 58px;
    background: rgba(10,10,11,0.85);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--lp-border);
  }
  .lp-logo {
    display: flex; align-items: center; gap: 9px;
    text-decoration: none;
  }
  .lp-logo-icon {
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    border-radius: 8px;
    background: var(--lp-amber);
    flex-shrink: 0;
  }
  .lp-logo-text {
    font-family: var(--lp-display);
    font-size: 18px; font-weight: 600;
    color: #F0EFE8; letter-spacing: -0.3px;
  }
  .lp-nav-right { display: flex; align-items: center; gap: 12px; }
  .lp-nav-link {
    font-size: 14px; color: var(--lp-muted);
    text-decoration: none; transition: color 0.2s;
  }
  .lp-nav-link:hover { color: #F0EFE8; }

  /* ── Buttons ── */
  .lp-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    background: var(--lp-amber); color: #0A0A0B;
    font-weight: 600; border-radius: 9px;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    white-space: nowrap;
  }
  .lp-btn-primary:hover {
    background: #FFCC44;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(240,180,41,0.40);
  }
  .lp-btn-sm  { padding: 7px 14px;  font-size: 13px; }
  .lp-btn-lg  { padding: 12px 22px; font-size: 15px; }
  .lp-btn-xl  { padding: 15px 28px; font-size: 16px; border-radius: 11px; }
  .lp-btn-ghost {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 12px 22px; font-size: 15px; font-weight: 500;
    color: var(--lp-muted);
    border: 1px solid var(--lp-border); border-radius: 9px;
    text-decoration: none; transition: color 0.2s, border-color 0.2s;
  }
  .lp-btn-ghost:hover { color: #F0EFE8; border-color: rgba(255,255,255,0.20); }

  /* ── Hero ── */
  .lp-hero {
    position: relative;
    padding: clamp(64px, 9vw, 110px) clamp(20px, 5vw, 60px) clamp(56px, 8vw, 96px);
    overflow: hidden;
  }
  .lp-hero-dotgrid {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px);
    background-size: 24px 24px;
    pointer-events: none; z-index: 0;
  }
  .lp-hero-glow {
    position: absolute; top: -140px; left: 50%;
    transform: translateX(-50%);
    width: 900px; height: 650px;
    background: radial-gradient(ellipse at center, rgba(240,180,41,0.09) 0%, transparent 65%);
    pointer-events: none; z-index: 0;
  }

  /* Hero two-column layout */
  .lp-hero-layout {
    position: relative; z-index: 1;
    max-width: 1120px; margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(40px, 6vw, 80px);
    align-items: center;
  }
  .lp-hero-left {
    display: flex; flex-direction: column; align-items: flex-start;
  }
  .lp-hero-right {
    display: flex; justify-content: center;
  }

  /* Label */
  .lp-label {
    font-family: var(--lp-mono);
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--lp-amber); margin-bottom: 20px;
  }

  /* Headings */
  .lp-h1 {
    font-family: var(--lp-display);
    font-size: clamp(42px, 5.5vw, 72px);
    font-weight: 500; line-height: 1.04;
    letter-spacing: -2px; color: #F0EFE8;
    margin-bottom: 22px;
  }
  .lp-h1-accent { color: var(--lp-amber); }
  .lp-h2 {
    font-family: var(--lp-display);
    font-size: clamp(30px, 4vw, 50px);
    font-weight: 500; line-height: 1.1;
    letter-spacing: -1.5px; color: #F0EFE8;
    margin-top: 12px;
  }

  /* Subtext */
  .lp-sub {
    max-width: 460px; font-size: 16px; line-height: 1.7;
    color: var(--lp-muted); margin-bottom: 30px;
  }

  /* CTA row */
  .lp-cta-row {
    display: flex; align-items: center;
    gap: 12px; flex-wrap: wrap;
    margin-bottom: 28px;
  }

  /* Trust items */
  .lp-trust-row {
    display: flex; align-items: center; gap: 20px;
    flex-wrap: wrap;
  }
  .lp-trust-item {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; color: var(--lp-muted);
  }
  .lp-trust-check {
    color: var(--lp-amber); font-weight: 700; font-size: 12px;
  }

  /* ── Product card ── */
  .lp-product-card {
    width: 100%; max-width: 520px;
    background: #0E0E10;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 14px;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04),
      0 24px 60px rgba(0,0,0,0.65),
      0 4px 16px rgba(0,0,0,0.4);
    animation: lp-float 7s ease-in-out infinite;
    transform-origin: center;
  }
  .lp-card-chrome {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.025);
  }
  .lp-chrome-dots { display: flex; gap: 6px; flex-shrink: 0; }
  .lp-chrome-dot  { width: 10px; height: 10px; border-radius: 50%; opacity: 0.9; }
  .lp-chrome-title {
    font-family: var(--lp-mono); font-size: 11px;
    color: var(--lp-muted); flex: 1; text-align: center;
  }
  .lp-solve-badge {
    font-family: var(--lp-mono); font-size: 10px; font-weight: 600;
    color: #28CA41; letter-spacing: 0.04em;
    background: rgba(40,202,65,0.12);
    border: 1px solid rgba(40,202,65,0.25);
    border-radius: 5px; padding: 2px 7px;
    white-space: nowrap; flex-shrink: 0;
  }
  .lp-card-body { padding: 14px 14px 0; overflow-x: auto; }
  .lp-card-table {
    width: 100%; border-collapse: collapse;
    font-size: 12px; white-space: nowrap;
  }
  .lp-card-table thead th { padding: 0 6px 10px; }
  .lp-ct-emp  { width: 90px; }
  .lp-ct-day  {
    font-family: var(--lp-mono); font-size: 10px; font-weight: 600;
    text-align: center; color: var(--lp-muted);
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .lp-ct-day--wknd { opacity: 0.38; }
  .lp-ct-name {
    display: flex; align-items: center; gap: 7px;
    padding: 6px 0; color: rgba(240,239,232,0.75);
    font-size: 11px; font-weight: 500;
  }
  .lp-ct-avatar {
    display: inline-flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 50%;
    border: 1px solid; flex-shrink: 0;
    font-size: 9px; font-weight: 700;
    color: rgba(240,239,232,0.9);
  }
  .lp-ct-cell {
    text-align: center; padding: 5px 4px;
    border-left: 1px solid rgba(255,255,255,0.04);
  }
  .lp-ct-cell--wknd { background: rgba(255,255,255,0.015); }
  .lp-shift-pill {
    display: inline-flex; align-items: center; justify-content: center;
    font-family: var(--lp-mono); font-size: 9px; font-weight: 700;
    letter-spacing: 0.06em;
    border: 1px solid; border-radius: 4px;
    padding: 2px 5px;
  }
  .lp-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px;
    border-top: 1px solid rgba(255,255,255,0.06);
    margin-top: 12px;
  }
  .lp-card-legend { display: flex; gap: 12px; }
  .lp-card-legend-item {
    display: flex; align-items: center; gap: 5px;
    font-family: var(--lp-mono); font-size: 9px;
    color: var(--lp-muted); text-transform: uppercase; letter-spacing: 0.05em;
  }
  .lp-card-legend-dot {
    width: 7px; height: 7px; border-radius: 50%;
  }
  .lp-card-score {
    font-family: var(--lp-mono); font-size: 10px; font-weight: 600;
    color: var(--lp-amber); letter-spacing: 0.04em;
  }

  /* ── Stats bar ── */
  .lp-stats-bar {
    display: flex; align-items: center; justify-content: center;
    border-top: 1px solid var(--lp-border);
    border-bottom: 1px solid var(--lp-border);
    background: var(--lp-surface);
  }
  .lp-stat {
    flex: 1; max-width: 260px;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 28px 20px;
    border-right: 1px solid var(--lp-border);
  }
  .lp-stat:last-child { border-right: none; }
  .lp-stat-value {
    font-family: var(--lp-display);
    font-size: 36px; font-weight: 600;
    color: var(--lp-amber); letter-spacing: -1px; line-height: 1;
  }
  .lp-stat-label {
    font-family: var(--lp-mono); font-size: 11px;
    color: var(--lp-muted); letter-spacing: 0.06em; text-transform: uppercase;
  }

  /* ── Double marquee ── */
  .lp-marquee-wrap {
    overflow: hidden;
    border-bottom: 1px solid var(--lp-border);
    background: #0A0A0B;
    display: flex; flex-direction: column; gap: 0;
  }
  .lp-marquee {
    display: flex; width: max-content;
    animation: lp-marquee-fwd 28s linear infinite;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .lp-marquee--rev {
    animation: lp-marquee-rev 28s linear infinite;
  }
  .lp-marquee-item {
    font-family: var(--lp-mono); font-size: 11px;
    color: var(--lp-muted);
    padding: 0 24px;
    display: flex; align-items: center; gap: 10px;
    white-space: nowrap;
  }
  .lp-marquee-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: var(--lp-amber); opacity: 0.55; flex-shrink: 0;
  }

  /* ── Sections ── */
  .lp-section { padding: clamp(70px, 8vw, 110px) clamp(20px, 5vw, 60px); }
  .lp-section--alt {
    background: var(--lp-surface);
    border-top: 1px solid var(--lp-border);
    border-bottom: 1px solid var(--lp-border);
  }
  .lp-container { max-width: 960px; margin: 0 auto; }
  .lp-section-header { text-align: center; margin-bottom: 52px; }
  .lp-section-sub {
    max-width: 440px; margin: 16px auto 0;
    font-size: 15px; line-height: 1.65; color: var(--lp-muted);
  }

  /* ── Features ── */
  .lp-features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 2px;
    border: 1px solid var(--lp-border); border-radius: 16px;
    overflow: hidden; background: var(--lp-border);
  }
  .lp-feature-card {
    background: #0A0A0B; padding: 36px 32px;
    display: flex; flex-direction: column; gap: 12px;
    transition: background 0.2s;
  }
  .lp-feature-card:hover { background: #0F0F11; }
  .lp-feature-num {
    font-family: var(--lp-mono); font-size: 11px; font-weight: 600;
    color: var(--lp-amber); letter-spacing: 0.08em;
  }
  .lp-feature-title {
    font-family: var(--lp-display);
    font-size: 22px; font-weight: 500;
    color: #F0EFE8; letter-spacing: -0.5px;
  }
  .lp-feature-body {
    font-size: 14px; line-height: 1.65; color: var(--lp-muted);
    flex: 1;
  }
  .lp-feature-tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--lp-mono); font-size: 10px; font-weight: 600;
    color: var(--lp-amber); letter-spacing: 0.06em; text-transform: uppercase;
    background: var(--lp-amber-10); border: 1px solid var(--lp-amber-20);
    border-radius: 6px; padding: 4px 9px; align-self: flex-start;
  }
  .lp-feature-tag-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--lp-amber); flex-shrink: 0;
  }

  /* ── Constraint library ── */
  .lp-constraints-grid {
    display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
  }
  .lp-constraint-pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 15px; border-radius: 9999px;
    border: 1px solid;
    transition: opacity 0.2s;
    cursor: default;
  }
  .lp-constraint-pill:hover { opacity: 0.8; }
  .lp-constraint-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  }
  .lp-constraint-key {
    font-family: var(--lp-mono); font-size: 11px; font-weight: 500;
    color: rgba(240,239,232,0.80); letter-spacing: 0.02em;
  }

  /* ── Steps ── */
  .lp-steps {
    display: flex; flex-direction: column;
    max-width: 640px; margin: 0 auto;
    position: relative;
  }
  .lp-step { display: flex; gap: 28px; position: relative; }
  .lp-step-num {
    font-family: var(--lp-display);
    font-size: 48px; font-weight: 500;
    color: var(--lp-amber); line-height: 1;
    flex-shrink: 0; width: 52px;
    letter-spacing: -2px; opacity: 0.9;
  }
  .lp-step-content { padding: 6px 0 44px; }
  .lp-step-title {
    font-size: 18px; font-weight: 600;
    color: #F0EFE8; margin-bottom: 8px; letter-spacing: -0.3px;
  }
  .lp-step-body { font-size: 14px; line-height: 1.65; color: var(--lp-muted); }
  .lp-step-line {
    position: absolute; left: 24px; top: 52px; bottom: 0;
    width: 1px; background: var(--lp-border);
  }

  /* ── CTA section ── */
  .lp-cta-section {
    padding: clamp(80px, 10vw, 130px) clamp(20px, 5vw, 60px);
    overflow: hidden;
  }
  .lp-cta-inner {
    max-width: 640px; margin: 0 auto; text-align: center;
    display: flex; flex-direction: column; align-items: center;
    position: relative;
  }
  .lp-cta-glow {
    position: absolute; top: -80px; left: 50%;
    transform: translateX(-50%);
    width: 500px; height: 300px;
    background: radial-gradient(ellipse at center, rgba(240,180,41,0.12) 0%, transparent 68%);
    pointer-events: none;
  }
  .lp-cta-h2 {
    font-family: var(--lp-display);
    font-size: clamp(34px, 5vw, 56px);
    font-weight: 500; letter-spacing: -1.5px;
    line-height: 1.07; color: #F0EFE8;
    margin: 12px 0 16px;
  }
  .lp-cta-sub { font-size: 15px; color: var(--lp-muted); margin-bottom: 32px; }

  /* ── Footer ── */
  .lp-footer {
    border-top: 1px solid var(--lp-border);
    padding: 28px clamp(20px, 5vw, 60px);
  }
  .lp-footer-inner {
    display: flex; align-items: center;
    justify-content: space-between; flex-wrap: wrap; gap: 16px;
  }
  .lp-footer-copy {
    font-family: var(--lp-mono); font-size: 12px; color: var(--lp-muted);
  }

  /* ── Responsive ── */
  @media (max-width: 860px) {
    .lp-hero-layout {
      grid-template-columns: 1fr;
    }
    .lp-hero-left {
      align-items: center; text-align: center;
    }
    .lp-hero-left .lp-sub { max-width: 100%; }
    .lp-hero-left .lp-cta-row { justify-content: center; }
    .lp-hero-left .lp-trust-row { justify-content: center; }
    .lp-product-card { animation: none; transform: none; }
  }
  @media (max-width: 600px) {
    .lp-stats-bar { flex-direction: column; }
    .lp-stat {
      border-right: none;
      border-bottom: 1px solid var(--lp-border);
      width: 100%; max-width: 100%;
    }
    .lp-stat:last-child { border-bottom: none; }
    .lp-h1 { letter-spacing: -1px; }
    .lp-step-num { font-size: 36px; }
    .lp-constraint-key { font-size: 10px; }
  }
`
