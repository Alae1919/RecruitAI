import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/navigation/PublicHeader';
import Avatar from '../components/ui/Avatar';

/* ── Icons ─────────────────────────────────────────────────────────── */
function ArrowRight({ size = 14 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
}
function Check({ size = 10 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function Sparkles({ size = 11 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8"/></svg>;
}
function Star({ size = 16 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function FileIcon({ size = 12 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function TargetIcon({ size = 12 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
function MessageIcon({ size = 12 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function Globe({ size = 14 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
function Github({ size = 14 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>;
}
function Linkedin({ size = 14 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
}
function FilterIcon({ size = 12 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
}

/* ── Hooks ─────────────────────────────────────────────────────────── */
function useTilt() {
  const [t, setT] = useState({ x: 0, y: 0, active: false });
  const onMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    setT({ x: dy * -10, y: dx * 10, active: true });
  }, []);
  const onLeave = useCallback(() => setT({ x: 0, y: 0, active: false }), []);
  return { t, onMove, onLeave };
}

function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── Match Ring ────────────────────────────────────────────────────── */
function MatchRing({ score, size = 48, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  const color = score >= 80 ? '#F59E0B' : score >= 60 ? '#eab308' : '#64748b';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#232A3E" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeLinecap="round" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} style={{ filter: `drop-shadow(0 0 4px ${color}aa)` }}/>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="font-bold font-mono" style={{ fontSize: size * 0.3, color, textShadow: `0 0 10px ${color}88` }}>{score}</div>
      </div>
    </div>
  );
}

/* ── Demo widgets ──────────────────────────────────────────────────── */
function ParseDemo() {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-base/80 p-4 font-mono text-[11px] leading-relaxed"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
      <div className="text-brand-text-disabled mb-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot inline-block" />
        amira-cv.pdf → parsed
      </div>
      <div><span className="text-brand-text-disabled">name</span>{'     '}<span className="text-brand-text-primary">"Amira El-Khalil"</span></div>
      <div><span className="text-brand-text-disabled">years</span>{'    '}<span className="text-brand-accent" style={{ textShadow: '0 0 12px rgba(245,158,11,0.5)' }}>7</span></div>
      <div><span className="text-brand-text-disabled">skills</span>{'   '}<span className="text-brand-text-primary">[react, typescript,</span></div>
      <div className="pl-[72px] text-brand-text-primary">graphql, design-systems]</div>
      <div><span className="text-brand-text-disabled">seniority</span>{' '}<span className="text-violet-300">"staff"</span></div>
      <div className="mt-2 text-emerald-400 flex items-center gap-1.5">
        <Check size={10} /> parsed in 340ms
      </div>
    </div>
  );
}

function MatchDemo() {
  const rows = [
    { k: 'React · 7yrs', v: 100 },
    { k: 'TypeScript', v: 95 },
    { k: 'Design systems', v: 92 },
    { k: 'GraphQL', v: 70 },
    { k: 'Team leadership', v: 45 },
  ];
  return (
    <div className="rounded-xl border border-brand-border bg-brand-base/80 p-4 space-y-2"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-brand-text-primary">vs. Senior Frontend JD</div>
        <div className="font-mono font-bold text-brand-accent" style={{ textShadow: '0 0 15px rgba(245,158,11,0.5)' }}>94</div>
      </div>
      {rows.map(r => (
        <div key={r.k} className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-brand-text-muted">
            <span>{r.k}</span>
            <span className={r.v >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{r.v}%</span>
          </div>
          <div className="h-1 rounded-full bg-brand-elevated overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${r.v}%`, background: r.v >= 70 ? 'linear-gradient(90deg, #F59E0B, #FCD34D)' : '#eab308',
                boxShadow: r.v >= 70 ? '0 0 8px rgba(245,158,11,0.5)' : 'none' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InterviewDemo() {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-base/80 p-4 space-y-3"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
      <div className="text-[11px] font-mono text-brand-text-disabled uppercase tracking-widest">Generated · 8 questions</div>
      {[
        'Walk us through the API design of your last component library.',
        'When does tokens-as-CSS-vars break down in practice?',
        'Describe a time you pushed back on a design decision.',
      ].map((q, i) => (
        <div key={i} className="flex gap-3">
          <span className="w-6 h-6 rounded-md bg-brand-accent/15 text-brand-accent grid place-items-center font-mono text-[10px] shrink-0"
            style={{ boxShadow: '0 0 10px rgba(245,158,11,0.15)' }}>
            Q{i + 1}
          </span>
          <p className="text-[13px] text-brand-text-primary leading-relaxed">{q}</p>
        </div>
      ))}
      <div className="pt-2 border-t border-brand-border flex items-center gap-2 text-[11px] font-mono text-brand-text-disabled">
        <Sparkles /> tuned to this candidate's resume
      </div>
    </div>
  );
}

/* ── Product Shot (browser mock) ───────────────────────────────────── */
function ProductShotHero() {
  const candidates = [
    { name: 'Amira El-Khalil', title: 'Staff Frontend Engineer · Stripe', match: 94, stage: 'Interview' },
    { name: 'Tomás Ribeiro', title: 'Senior Frontend Engineer · Remote', match: 88, stage: 'Screening' },
    { name: 'Priya Nair', title: 'Principal Engineer · Gojek', match: 82, stage: 'Interview' },
    { name: 'Miguel Santos', title: 'Frontend Engineer · Freelance', match: 76, stage: 'Applied' },
  ];
  const stageColor = (s) =>
    s === 'Interview' ? 'text-brand-accent bg-brand-accent/10 border-brand-accent/30' :
    s === 'Offer'     ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' :
    'text-brand-text-muted bg-brand-elevated border-brand-border';

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.25) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      <div className="relative rounded-2xl overflow-hidden border border-brand-border/60 bg-brand-surface"
        style={{ boxShadow: '0 40px 120px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05), 0 0 80px -30px rgba(245,158,11,0.2)' }}>
        {/* Window chrome */}
        <div className="h-9 px-4 border-b border-brand-border bg-brand-surface flex items-center gap-3"
          style={{ background: 'linear-gradient(180deg, #181E2E 0%, #101420 100%)' }}>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto px-3 h-5 rounded-md bg-brand-elevated text-[10px] font-mono text-brand-text-disabled flex items-center gap-1.5">
            <Globe size={10} /> app.recrutai.io / candidates
          </div>
        </div>
        {/* App body */}
        <div className="grid grid-cols-[180px_1fr] h-[480px] bg-brand-base">
          {/* Sidebar */}
          <div className="border-r border-brand-border p-3 space-y-0.5"
            style={{ background: 'linear-gradient(180deg, #101420 0%, #090C14 100%)' }}>
            <div className="px-3 py-2 text-[11px] font-mono text-brand-text-disabled tracking-widest uppercase">Hiring</div>
            {['Dashboard', 'Job offers', 'Candidates', 'Pipeline', 'Analytics'].map((l, i) => (
              <div key={l} className={`h-8 px-3 rounded-lg flex items-center gap-2 text-[13px] transition-colors ${
                i === 2
                  ? 'text-brand-accent font-medium nav-active-glow'
                  : 'text-brand-text-muted'}`}
                style={i === 2 ? { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' } : {}}>
                <span className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-brand-accent' : 'bg-brand-text-disabled'}`} />
                {l}
                {i === 1 && <span className="ml-auto text-[10px] font-mono text-brand-text-disabled">5</span>}
                {i === 2 && <span className="ml-auto text-[10px] font-mono text-brand-accent bg-brand-accent/10 px-1 rounded">47</span>}
              </div>
            ))}
          </div>
          {/* Main */}
          <div className="p-5 overflow-hidden" style={{ background: '#090C14' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] font-mono text-brand-text-disabled">candidates / senior-frontend-eng</div>
                <div className="text-base font-semibold mt-0.5 text-brand-text-primary">
                  47 applicants · <span className="text-brand-text-muted font-normal text-sm">12 shortlisted</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-7 px-2 rounded-lg border border-brand-border bg-brand-elevated text-xs flex items-center gap-1.5 text-brand-text-muted">
                  <FilterIcon />3 filters
                </div>
                <div className="h-7 px-2 rounded-lg text-brand-base text-xs flex items-center gap-1.5 font-semibold"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', boxShadow: '0 0 15px rgba(245,158,11,0.4)' }}>
                  <Sparkles />Rank with AI
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {candidates.map((c, i) => (
                <div key={c.name}
                  className={`h-[68px] border rounded-lg px-4 flex items-center gap-3 transition-all ${
                    i === 0 ? 'border-brand-accent/40 bg-brand-accent/5' : 'border-brand-border bg-brand-surface/40 hover:border-brand-accent/25'
                  }`}>
                  <MatchRing score={c.match} size={44} stroke={3.5} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand-text-primary">{c.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${stageColor(c.stage)}`}>{c.stage}</span>
                    </div>
                    <div className="text-xs text-brand-text-muted truncate mt-0.5">{c.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────────── */
function StatCard({ value, label, sub, delay = 0 }) {
  return (
    <div data-reveal data-delay={delay}
      className="relative group cursor-default p-6 rounded-2xl border border-brand-border card-shine transition-all duration-500 hover:-translate-y-1"
      style={{ background: 'linear-gradient(135deg, rgba(24,30,46,0.9) 0%, rgba(9,12,20,0.9) 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)' }} />
      <div className="text-5xl font-bold font-mono tracking-tight text-brand-accent relative"
        style={{ textShadow: '0 0 40px rgba(245,158,11,0.45)' }}>
        {value}
      </div>
      <div className="text-sm text-brand-text-muted mt-2 font-medium">{label}</div>
      <div className="text-[11px] font-mono text-brand-text-disabled mt-1">{sub}</div>
      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)' }} />
    </div>
  );
}

/* ── Pillar Card ───────────────────────────────────────────────────── */
function PillarCard({ n, title, Icon, body, demo, delay }) {
  return (
    <div data-reveal data-delay={delay}
      className="relative group rounded-2xl p-8 flex flex-col overflow-hidden cursor-default card-shine transition-all duration-500 hover:-translate-y-2"
      style={{
        background: 'linear-gradient(145deg, rgba(24,30,46,0.95) 0%, rgba(9,12,20,0.98) 100%)',
        border: '1px solid rgba(35,42,62,0.8)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}>
      {/* Hover gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(245,158,11,0.07) 0%, transparent 60%)' }} />
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }} />

      <div className="flex items-center gap-2 text-[11px] font-mono text-brand-text-disabled tracking-widest relative">
        <span>{n}</span>
        <span className="w-6 h-px bg-brand-border" />
        <span className="text-brand-accent opacity-70"><Icon /></span>
      </div>
      <h3 className="text-2xl font-bold text-brand-text-primary mt-4 tracking-tight relative group-hover:text-brand-accent-bright transition-colors duration-300">
        {title}
      </h3>
      <p className="text-sm text-brand-text-muted mt-2 leading-relaxed relative">{body}</p>
      <div className="mt-6 relative">{demo}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN HOME PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function Home() {
  useScrollReveal();
  const { t, onMove, onLeave } = useTilt();

  return (
    <div className="min-h-screen bg-brand-base text-brand-text-primary font-sans overflow-x-hidden">

      {/* ── Sticky Nav ─────────────────────────────────────────────── */}
      <nav className="h-14 px-6 sticky top-0 z-40 flex items-center"
        style={{ background: 'rgba(9,12,20,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(35,42,62,0.7)' }}>
        <Link to="/"><Logo /></Link>
        <div className="flex items-center gap-6 ml-10 text-sm text-brand-text-muted">
          {['Product', 'Customers', 'Pricing', 'Changelog'].map(l => (
            <span key={l} className="hover:text-brand-text-primary transition-colors duration-200 cursor-pointer">{l}</span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/login" className="h-8 px-3 text-xs rounded-lg font-medium text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-elevated/50 transition-all inline-flex items-center">
            Sign in
          </Link>
          <Link to="/register"
            className="h-8 px-3 text-xs rounded-lg text-gray-900 font-semibold inline-flex items-center gap-1.5 transition-all shadow-glow"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)' }}>
            Get started <ArrowRight />
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden hero-mesh" style={{ minHeight: '100vh' }}>
        {/* 3D perspective grid floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[55%] pointer-events-none overflow-hidden">
          <div className="perspective-grid absolute inset-0" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, transparent 0%, #090C14 70%)' }} />
        </div>

        {/* Grid backdrop */}
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

        {/* Floating orbs */}
        <div className="orb orb-amber w-[500px] h-[500px] top-[-100px] left-[-80px] opacity-60" />
        <div className="orb orb-violet w-[600px] h-[600px] top-[10%] right-[-120px] opacity-50" />
        <div className="orb orb-blue w-[300px] h-[300px] bottom-[20%] left-[40%] opacity-40" />

        <div className="relative max-w-[1180px] mx-auto px-8 pt-28 pb-20">
          {/* Announcement pill */}
          <div className="flex justify-center mb-10 animate-fadeIn">
            <div className="group inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-full cursor-pointer transition-all"
              style={{ background: 'rgba(24,30,46,0.8)', border: '1px solid rgba(245,158,11,0.25)', backdropFilter: 'blur(10px)', boxShadow: '0 0 20px rgba(245,158,11,0.1)' }}>
              <span className="px-1.5 py-0.5 rounded-full text-brand-accent text-[10px] font-semibold tracking-wider"
                style={{ background: 'rgba(245,158,11,0.15)' }}>NEW</span>
              <span className="text-brand-text-muted text-xs group-hover:text-brand-text-primary transition-colors">Interview question generator is live</span>
              <ArrowRight size={12} />
            </div>
          </div>

          {/* Hero title */}
          <h1 className="text-center font-extrabold tracking-tight leading-[0.96] text-[58px] md:text-[86px] max-w-[940px] mx-auto animate-slideUp">
            <span className="text-brand-text-primary">The hiring loop,</span>
            <br />
            <span className="gradient-title">closed by AI.</span>
          </h1>

          <p className="text-center text-lg text-brand-text-muted mt-7 max-w-[620px] mx-auto leading-relaxed animate-fadeIn">
            recrutai reads every resume, ranks every candidate, and drafts every question —
            so your recruiters spend their time on the humans that matter.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-3 mt-10 animate-fadeIn">
            <Link to="/register"
              className="group h-12 px-7 text-sm rounded-xl text-gray-900 font-bold inline-flex items-center gap-2 transition-all active:scale-[.97]"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', boxShadow: '0 0 30px rgba(245,158,11,0.4), 0 4px 12px rgba(245,158,11,0.3)' }}>
              Start free trial
              <span className="transition-transform duration-200 group-hover:translate-x-0.5"><ArrowRight size={15} /></span>
            </Link>
            <button className="h-12 px-7 text-sm rounded-xl font-medium text-brand-text-primary transition-all active:scale-[.97]"
              style={{ border: '1px solid rgba(35,42,62,0.9)', background: 'rgba(16,20,32,0.8)', backdropFilter: 'blur(10px)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(35,42,62,0.9)'}>
              Watch 90-sec demo
            </button>
          </div>

          <div className="flex items-center justify-center gap-5 mt-5 text-[11px] font-mono text-brand-text-disabled uppercase tracking-wider animate-fadeIn">
            <span>14-day trial</span>
            <span className="w-1 h-1 rounded-full bg-brand-text-disabled/40" />
            <span>No card required</span>
            <span className="w-1 h-1 rounded-full bg-brand-text-disabled/40" />
            <span>SOC 2 Type II</span>
          </div>

          {/* 3D tilt product shot */}
          <div className="mt-20"
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={{
              transform: `perspective(1200px) rotateX(${t.x}deg) rotateY(${t.y}deg)`,
              transition: t.active ? 'transform 0.12s linear' : 'transform 0.7s cubic-bezier(0.16,1,0.3,1)',
              willChange: 'transform',
            }}>
            <div className="animate-tilt-in">
              <ProductShotHero />
            </div>
          </div>
        </div>
      </section>

      {/* ── Logo strip ─────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(35,42,62,0.6)', borderBottom: '1px solid rgba(35,42,62,0.6)', background: 'rgba(16,20,32,0.5)' }}>
        <div className="max-w-[1180px] mx-auto px-8 py-8">
          <div className="overflow-hidden">
            <div className="flex items-center gap-16 animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
              {['LINEARLIKE', 'VELOCITY', 'NORTHSTAR', 'ORBIT·IO', 'STRIDE', 'FOUNDRY', 'LINEARLIKE', 'VELOCITY', 'NORTHSTAR', 'ORBIT·IO', 'STRIDE', 'FOUNDRY'].map((n, i) => (
                <div key={i} className="text-sm font-bold tracking-[0.22em] text-brand-text-disabled/50">{n}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Three pillars ──────────────────────────────────────────── */}
      <section className="relative py-32">
        {/* Section ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.04) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        <div className="relative max-w-[1180px] mx-auto px-8">
          <div className="max-w-[680px] mb-20">
            <div data-reveal
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-brand-accent text-[11px] font-medium mb-5"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 0 20px rgba(245,158,11,0.08)' }}>
              <Sparkles /> How it works
            </div>
            <h2 data-reveal data-delay="1" className="text-4xl md:text-5xl font-extrabold text-brand-text-primary tracking-tight leading-[1.05]">
              Three models.<br /><span className="gradient-title">One honest shortlist.</span>
            </h2>
            <p data-reveal data-delay="2" className="text-brand-text-muted mt-5 leading-relaxed text-base">
              Every candidate passes through the same pipeline: parse, match, interview.
              Every decision is explained — never a black box.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: '01', title: 'Parse', Icon: FileIcon, body: 'Resumes become structured data — skills, years, domains, tools — regardless of layout. 42 languages.', demo: <ParseDemo />, delay: '1' },
              { n: '02', title: 'Match', Icon: TargetIcon, body: 'Every candidate gets a match score against the JD. We show you the why — not a vibes-based number.', demo: <MatchDemo />, delay: '2' },
              { n: '03', title: 'Interview', Icon: MessageIcon, body: 'Role-specific questions, generated per candidate from their resume and the job requirements.', demo: <InterviewDemo />, delay: '3' },
            ].map(p => <PillarCard key={p.n} {...p} />)}
          </div>
        </div>
      </section>

      {/* ── For recruiters / for candidates ───────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(35,42,62,0.6)', background: 'rgba(16,20,32,0.3)' }}>
        <div className="max-w-[1180px] mx-auto px-8 py-28 grid md:grid-cols-2 gap-20">
          {[
            {
              who: 'For recruiters', title: 'Hire the signal,\nskip the stack.',
              bullets: ['AI-drafted job descriptions in seconds', 'Ranked applicants with written explanations', 'Generated interview questions per candidate', 'One-click rejection with feedback emails'],
              action: 'Post your first job →', to: '/register', delay: '1',
            },
            {
              who: 'For candidates', title: 'Fewer ghost jobs.\nFaster answers.',
              bullets: ['AI-matched roles that actually fit your skills', 'Upload once, apply to multiple roles', 'Transparent match scores — no mystery', 'Practice interviews with AI before the real thing'],
              action: 'Create your profile →', to: '/register', delay: '2',
            },
          ].map((s, i) => (
            <div key={i} data-reveal data-delay={s.delay} className="space-y-5">
              <div className="text-[11px] font-mono tracking-widest uppercase text-brand-accent" style={{ textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>{s.who}</div>
              <h3 className="text-3xl font-bold tracking-tight text-brand-text-primary whitespace-pre-line leading-tight">{s.title}</h3>
              <ul className="space-y-3.5 mt-6">
                {s.bullets.map(b => (
                  <li key={b} className="flex items-start gap-3 text-sm text-brand-text-muted">
                    <span className="mt-0.5 w-5 h-5 rounded-full grid place-items-center shrink-0"
                      style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                      <Check />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link to={s.to} className="text-sm font-semibold text-brand-accent hover:text-brand-accent-bright flex items-center gap-1.5 mt-6 transition-colors group">
                {s.action}
                <span className="transition-transform duration-200 group-hover:translate-x-1"><ArrowRight size={13} /></span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <section className="py-24" style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
        <div className="max-w-[1180px] mx-auto px-8">
          <div className="text-center mb-14" data-reveal>
            <h2 className="text-3xl font-bold text-brand-text-primary tracking-tight">Numbers that speak first</h2>
            <p className="text-brand-text-muted mt-2 text-sm">Real outcomes from teams that switched to AI-native hiring</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { value: '3.4h', label: 'Time to shortlist', sub: 'down from 14 days', delay: '1' },
              { value: '2.1×', label: 'Interview signal', sub: 'predictive vs. gut feel', delay: '2' },
              { value: '+62', label: 'Candidate NPS', sub: 'industry avg: +8', delay: '3' },
              { value: '4.8', label: 'Hires per week', sub: 'per recruiter', delay: '4' },
            ].map(s => <StatCard key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── Testimonial ────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(35,42,62,0.6)', background: 'rgba(16,20,32,0.35)' }}>
        <div className="max-w-[900px] mx-auto px-8 py-28 text-center">
          <div data-reveal className="text-brand-accent mb-8 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }}><Star /></span>
            ))}
          </div>
          <blockquote data-reveal data-delay="1"
            className="text-2xl md:text-[32px] font-medium text-brand-text-primary leading-[1.3] tracking-tight">
            "We cut our time-to-offer from{' '}
            <span className="text-brand-accent" style={{ textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>6 weeks</span>{' '}
            to{' '}
            <span className="text-brand-accent" style={{ textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>11 days</span>.
            The interviewers actually{' '}
            <em className="text-brand-accent not-italic">want</em>{' '}
            to read the AI shortlist now — that's the real signal."
          </blockquote>
          <div data-reveal data-delay="2" className="flex items-center justify-center gap-3 mt-12">
            <Avatar name="Mathieu Laurent" size={48} />
            <div className="text-left">
              <div className="text-sm font-semibold text-brand-text-primary">Mathieu Laurent</div>
              <div className="text-xs text-brand-text-muted">Head of Talent, Foundry (Series C, 240 people)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
        {/* Big glow behind text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[350px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.1) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-[1180px] mx-auto px-8 py-32 text-center relative">
          <h2 data-reveal
            className="text-4xl md:text-[64px] font-extrabold tracking-tight leading-[1.0]">
            <span className="text-brand-text-primary">Post your first job</span>
            <br />
            <span className="gradient-title">in 90 seconds.</span>
          </h2>
          <div data-reveal data-delay="1" className="flex items-center justify-center gap-3 mt-12">
            <Link to="/register"
              className="group h-12 px-8 text-sm rounded-xl text-gray-900 font-bold inline-flex items-center gap-2 transition-all active:scale-[.97]"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', boxShadow: '0 0 40px rgba(245,158,11,0.4), 0 4px 12px rgba(245,158,11,0.25)' }}>
              Get started free
              <span className="group-hover:translate-x-0.5 transition-transform duration-200"><ArrowRight size={15} /></span>
            </Link>
            <Link to="/login"
              className="h-12 px-8 text-sm rounded-xl font-medium text-brand-text-primary inline-flex items-center gap-2 transition-all active:scale-[.97]"
              style={{ border: '1px solid rgba(35,42,62,0.9)', background: 'rgba(16,20,32,0.7)', backdropFilter: 'blur(10px)' }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(35,42,62,0.6)', background: 'rgba(9,12,20,0.8)' }}>
        <div className="max-w-[1180px] mx-auto px-8 py-14 grid md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <Logo />
            <p className="text-sm text-brand-text-muted mt-4 max-w-[280px] leading-relaxed">AI-native recruiting, for teams that hire on substance.</p>
            <div className="flex gap-2 mt-5">
              {[Github, Linkedin, Globe].map((Ic, i) => (
                <button key={i} className="w-8 h-8 rounded-lg grid place-items-center text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-elevated transition-all"
                  style={{ border: '1px solid rgba(35,42,62,0.8)' }}>
                  <Ic size={14} />
                </button>
              ))}
            </div>
          </div>
          {[
            { h: 'Product', items: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
            { h: 'Company', items: ['About', 'Customers', 'Careers', 'Contact'] },
            { h: 'Legal', items: ['Privacy', 'Terms', 'Security', 'DPA'] },
          ].map(col => (
            <div key={col.h}>
              <div className="text-[11px] font-mono uppercase tracking-widest text-brand-text-disabled mb-4">{col.h}</div>
              <ul className="space-y-2.5 text-sm text-brand-text-muted">
                {col.items.map(item => (
                  <li key={item}><button className="hover:text-brand-text-primary transition-colors">{item}</button></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
          <div className="max-w-[1180px] mx-auto px-8 py-5 flex justify-between items-center text-[11px] font-mono text-brand-text-disabled">
            <span>© 2026 recrutai, s.a.r.l. — Casablanca · Paris · Lisbon</span>
            <span className="flex items-center gap-2">
              All systems operational
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot inline-block"
                style={{ boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
