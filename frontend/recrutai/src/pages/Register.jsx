import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RecruiterForm from '../components/registration/RecruiterForm';
import JobSeekerForm from '../components/registration/JobSeekerForm';
import { Logo } from '../components/navigation/PublicHeader';
import { ArrowLeft, ArrowRight, Check, Briefcase, Search, Rocket, Sparkles, Shield } from 'lucide-react';

const BackIcon      = ({ size = 12 }) => <ArrowLeft size={size} />;
const CheckIcon     = ({ size = 9  }) => <Check size={size} strokeWidth={3} />;
const BriefcaseIcon = ({ size = 24 }) => <Briefcase size={size} strokeWidth={1.8} />;
const SearchIcon    = ({ size = 24 }) => <Search size={size} strokeWidth={1.8} />;
const RocketIcon    = ({ size = 13 }) => <Rocket size={size} />;
const SparkIcon     = ({ size = 13 }) => <Sparkles size={size} />;
const ShieldIcon    = ({ size = 13 }) => <Shield size={size} />;

/* ── Left Panel ─────────────────────────────────────────────────────── */
function LeftPanel({ step, role }) {
  const benefits = [
    { Icon: RocketIcon, text: 'Up and running in under 5 minutes' },
    { Icon: SparkIcon, text: 'AI-powered screening from day one' },
    { Icon: CheckIcon, text: '14-day free trial, no card required' },
    { Icon: ShieldIcon, text: 'SOC 2 certified, GDPR compliant' },
  ];

  return (
    <aside className="relative hidden md:flex flex-col justify-between p-10 overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #0F1520 0%, #090C14 60%, #111929 100%)', borderRight: '1px solid rgba(35,42,62,0.6)' }}>

      {/* Grid backdrop */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      {/* Ambient orbs */}
      <div className="absolute top-[-60px] right-[-40px] w-[320px] h-[320px] rounded-full pointer-events-none animate-float-slow"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-[15%] left-[-30px] w-[280px] h-[280px] rounded-full pointer-events-none animate-float"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(35px)' }} />

      {/* 3D floating shapes */}
      <div className="absolute top-[22%] left-[14%] pointer-events-none animate-float-fast">
        <div className="w-12 h-12 rounded-xl opacity-25"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.7) 0%, rgba(245,158,11,0.1) 100%)', border: '1px solid rgba(245,158,11,0.35)', transform: 'perspective(180px) rotateX(20deg) rotateY(-12deg)', boxShadow: '0 6px 16px rgba(245,158,11,0.12)' }} />
      </div>
      <div className="absolute top-[48%] right-[10%] pointer-events-none" style={{ animation: 'float 10s ease-in-out infinite 1.5s' }}>
        <div className="w-7 h-7 rounded-lg opacity-30"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.8) 0%, rgba(124,58,237,0.1) 100%)', border: '1px solid rgba(124,58,237,0.4)', transform: 'perspective(100px) rotateX(-18deg) rotateY(22deg) rotate(12deg)' }} />
      </div>
      <div className="absolute bottom-[32%] right-[18%] pointer-events-none animate-float-slow">
        <div className="w-5 h-5 rounded-full opacity-35"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.9) 0%, transparent 70%)', boxShadow: '0 0 14px rgba(245,158,11,0.25)' }} />
      </div>

      {/* Logo */}
      <div className="relative"><Logo /></div>

      {/* Content */}
      <div className="relative space-y-6 max-w-[380px]">
        {/* Step pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent pulse-dot" />
          {step === 0 ? 'CHOOSE YOUR ROLE' : `ACCOUNT SETUP · ${role === 'recruiter' ? 'RECRUITER' : 'JOB SEEKER'}`}
        </div>

        <h2 className="text-[26px] font-bold tracking-tight leading-tight text-brand-text-primary">
          {step === 0
            ? <>Join the next gen<br /><span className="gradient-title">of AI hiring.</span></>
            : <>Almost there —<br /><span className="gradient-title">let's get you in.</span></>}
        </h2>

        <div className="space-y-4 pt-1">
          {benefits.map(({ Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3 text-sm" style={{ color: '#B8C2DC' }}>
              <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                <Icon />
              </span>
              {text}
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="mt-4 p-4 rounded-2xl" style={{ background: 'rgba(9,12,20,0.6)', border: '1px solid rgba(35,42,62,0.7)' }}>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" style={{ filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.5))' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
          </div>
          <p className="text-[12px] text-brand-text-muted leading-relaxed italic">
            "Cut our time-to-hire from 6 weeks to 11 days."
          </p>
          <p className="text-[11px] font-mono text-brand-text-disabled mt-1.5">— Head of Talent, Foundry (Series C)</p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative flex items-center gap-2 text-[11px] font-mono text-brand-text-disabled">
        <ShieldIcon size={10} />
        SOC 2 · GDPR · ISO-27001
      </div>
    </aside>
  );
}

/* ── Role Card ──────────────────────────────────────────────────────── */
function RoleCard({ id, Icon, title, description, onClick }) {
  const tilt3d = (e, enter) => {
    if (enter) {
      const r = e.currentTarget.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      e.currentTarget.style.transform = `perspective(800px) rotateX(${dy * -6}deg) rotateY(${dx * 8}deg) translateY(-4px)`;
      e.currentTarget.style.borderColor = 'rgba(245,158,11,0.45)';
      e.currentTarget.style.boxShadow = '0 24px 60px rgba(0,0,0,0.6), 0 0 30px rgba(245,158,11,0.12)';
    } else {
      e.currentTarget.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
      e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
    }
  };

  return (
    <button type="button" onClick={onClick}
      className="group text-left w-full cursor-pointer overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(24,30,46,0.95) 0%, rgba(9,12,20,0.98) 100%)',
        border: '1px solid rgba(35,42,62,0.7)',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
      }}
      onMouseMove={e => tilt3d(e, true)}
      onMouseLeave={e => tilt3d(e, false)}>

      {/* Top accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)' }} />

      <div className="flex items-center gap-5">
        {/* Icon box */}
        <div className="w-14 h-14 rounded-2xl shrink-0 grid place-items-center transition-all duration-300 group-hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.06) 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#F59E0B',
            boxShadow: '0 0 20px rgba(245,158,11,0.08)',
          }}>
          <Icon />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-brand-text-primary text-[15px] group-hover:text-brand-accent-bright transition-colors duration-200">{title}</div>
          <div className="text-[13px] text-brand-text-muted mt-0.5 leading-relaxed">{description}</div>
        </div>

        {/* Arrow */}
        <div className="text-brand-text-disabled group-hover:text-brand-accent group-hover:translate-x-1 transition-all duration-200 shrink-0">
          <ArrowRight size={18} />
        </div>
      </div>
    </button>
  );
}

/* ── Step Indicator ─────────────────────────────────────────────────── */
function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold transition-all duration-300"
              style={i < current
                ? { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#F59E0B' }
                : i === current
                  ? { background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#090C14', boxShadow: '0 0 12px rgba(245,158,11,0.4)' }
                  : { background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)', color: '#59628A' }}>
              {i < current ? <CheckIcon size={8} /> : i + 1}
            </div>
            <span className="text-[11px] font-mono hidden sm:inline"
              style={{ color: i === current ? '#9BA6C4' : '#59628A' }}>
              {i === 0 ? 'Role' : 'Details'}
            </span>
          </div>
          {i < total - 1 && (
            <div className="flex-1 h-px max-w-[40px]"
              style={{ background: i < current ? 'rgba(245,158,11,0.3)' : 'rgba(35,42,62,0.6)' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Roles config ───────────────────────────────────────────────────── */
const ROLES = [
  {
    id: 'recruiter',
    Icon: BriefcaseIcon,
    title: "I'm hiring",
    description: 'Post jobs, rank candidates with AI, and manage the full hiring pipeline from one dashboard.',
  },
  {
    id: 'job_seeker',
    Icon: SearchIcon,
    title: "I'm looking for a job",
    description: 'Build your profile, apply to matched roles, and practice with AI-powered interview prep.',
  },
];

/* ── Main Register ──────────────────────────────────────────────────── */
export default function Register() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(null);

  const handleRoleSelect = (id) => {
    setRole(id);
    setStep(1);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-[1fr_520px]" style={{ background: '#090C14' }}>
      <LeftPanel step={step} role={role} />

      {/* Right panel */}
      <main className="flex items-center justify-center p-6 md:p-10 overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #0D1018 0%, #090C14 100%)' }}>
        <div className="w-full max-w-md animate-fadeIn">

          {step === 0 ? (
            /* ── STEP 0: Role chooser ── */
            <>
              <Link to="/" className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary mb-8 transition-colors group">
                <span className="group-hover:-translate-x-0.5 transition-transform"><BackIcon /></span>
                Back to home
              </Link>

              <StepIndicator current={0} total={2} />

              <h1 className="text-[30px] font-extrabold tracking-tight text-brand-text-primary">Who's signing up?</h1>
              <p className="text-sm text-brand-text-muted mt-1.5">We'll tailor recrutai to your role from day one.</p>

              <div className="flex flex-col gap-3 mt-8 relative">
                {ROLES.map(r => (
                  <RoleCard key={r.id} {...r} onClick={() => handleRoleSelect(r.id)} />
                ))}
              </div>

              <p className="text-center text-sm text-brand-text-muted mt-8">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-accent hover:text-brand-accent-bright font-semibold transition-colors">Sign in</Link>
              </p>
            </>
          ) : (
            /* ── STEP 1: Form ── */
            <>
              <button type="button" onClick={() => setStep(0)}
                className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary mb-8 transition-colors group">
                <span className="group-hover:-translate-x-0.5 transition-transform"><BackIcon /></span>
                Change role
              </button>

              <StepIndicator current={1} total={2} />

              {/* Role badge */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono mb-4"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                {role === 'recruiter' ? <BriefcaseIcon size={11} /> : <SearchIcon size={11} />}
                {role === 'recruiter' ? 'RECRUITER ACCOUNT' : 'JOB SEEKER ACCOUNT'}
              </div>

              <h1 className="text-[28px] font-extrabold tracking-tight text-brand-text-primary">Create your account</h1>
              <p className="text-sm text-brand-text-muted mt-1 mb-7">Takes under a minute. No credit card required.</p>

              {role === 'recruiter' && <RecruiterForm />}
              {role === 'job_seeker' && <JobSeekerForm />}

              <p className="text-center text-sm text-brand-text-muted mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-accent hover:text-brand-accent-bright font-semibold transition-colors">Sign in</Link>
              </p>

              {/* Compliance */}
              <div className="flex items-center gap-3 mt-6">
                <div className="flex-1 h-px" style={{ background: 'rgba(35,42,62,0.5)' }} />
                <span className="text-[11px] font-mono text-brand-text-disabled">Secured by recrutai</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(35,42,62,0.5)' }} />
              </div>
              <div className="flex justify-center gap-4 mt-2.5 text-[10px] font-mono text-brand-text-disabled">
                <span>256-bit TLS</span><span>·</span><span>SOC 2</span><span>·</span><span>GDPR</span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
