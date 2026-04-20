import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Logo } from '../components/navigation/PublicHeader';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Briefcase, Users, Check, Shield, Zap, BarChart2 } from 'lucide-react';

const BackIcon      = ({ size = 12 }) => <ArrowLeft size={size} />;
const EyeIcon       = ({ size = 14 }) => <Eye size={size} />;
const EyeOffIcon    = ({ size = 14 }) => <EyeOff size={size} />;
const MailIcon      = ({ size = 15 }) => <Mail size={size} />;
const BriefcaseIcon = ({ size = 13 }) => <Briefcase size={size} />;
const UsersIcon     = ({ size = 13 }) => <Users size={size} />;
const CheckIcon     = ({ size = 9  }) => <Check size={size} strokeWidth={3} />;
const ShieldIcon    = ({ size = 13 }) => <Shield size={size} />;
const ZapIcon       = ({ size = 13 }) => <Zap size={size} />;
const BarIcon       = ({ size = 13 }) => <BarChart2 size={size} />;

/* ── 3D Floating shapes (pure CSS) ─────────────────────────────────── */
function FloatingShape({ style, children }) {
  return (
    <div className="absolute pointer-events-none select-none" style={style}>
      {children}
    </div>
  );
}

export default function Login() {
  const [role, setRole] = useState('RECRUITER');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { refetch } = useAuth();
  const { toast } = useToast();

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser({ ...formData, role });
      localStorage.setItem('accessToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      await refetch();
      toast.success('Welcome back!');
      navigate(role === 'RECRUITER' ? '/recruiter-dashboard' : '/jobseeker-dashboard');
    } catch {
      setError('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { Icon: ZapIcon, text: 'Parse 500 resumes in under a minute' },
    { Icon: BarIcon, text: 'Explained match scores, not black-box vibes' },
    { Icon: ShieldIcon, text: 'Interview questions tuned per candidate' },
    { Icon: CheckIcon, text: 'One dashboard — from post to offer' },
  ];

  return (
    <div className="min-h-screen grid md:grid-cols-[1fr_520px]" style={{ background: '#090C14' }}>

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <aside className="relative hidden md:flex flex-col justify-between p-10 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0F1520 0%, #090C14 60%, #111929 100%)', borderRight: '1px solid rgba(35,42,62,0.6)' }}>

        {/* Grid backdrop */}
        <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />

        {/* Ambient orbs */}
        <div className="absolute top-[-80px] left-[-60px] w-[350px] h-[350px] rounded-full pointer-events-none animate-float-slow"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[10%] right-[-40px] w-[250px] h-[250px] rounded-full pointer-events-none animate-float"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', filter: 'blur(35px)' }} />

        {/* 3D floating geometric shapes */}
        <FloatingShape style={{ top: '18%', right: '12%', animation: 'float 9s ease-in-out infinite', animationDelay: '0.5s' }}>
          <div className="w-16 h-16 rounded-2xl opacity-20"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.6) 0%, rgba(245,158,11,0.1) 100%)',
              border: '1px solid rgba(245,158,11,0.3)',
              transform: 'perspective(200px) rotateX(25deg) rotateY(-15deg)',
              boxShadow: '0 8px 20px rgba(245,158,11,0.1)',
            }} />
        </FloatingShape>
        <FloatingShape style={{ top: '55%', right: '22%', animation: 'float 11s ease-in-out infinite', animationDelay: '2s' }}>
          <div className="w-8 h-8 rounded-lg opacity-30"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.6) 0%, rgba(124,58,237,0.1) 100%)',
              border: '1px solid rgba(124,58,237,0.35)',
              transform: 'perspective(100px) rotateX(-20deg) rotateY(20deg) rotate(15deg)',
            }} />
        </FloatingShape>
        <FloatingShape style={{ bottom: '28%', left: '8%', animation: 'float 7s ease-in-out infinite', animationDelay: '1s' }}>
          <div className="w-10 h-10 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(245,158,11,0.7) 0%, transparent 70%)',
              boxShadow: '0 0 20px rgba(245,158,11,0.2)',
            }} />
        </FloatingShape>

        {/* Logo */}
        <div className="relative"><Logo /></div>

        {/* Benefits */}
        <div className="relative space-y-6 max-w-[380px]">
          <div className="text-[11px] font-mono tracking-[0.2em] text-brand-accent uppercase"
            style={{ textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
            WHY RECRUTAI
          </div>
          <h2 className="text-[28px] font-bold tracking-tight leading-tight text-brand-text-primary">
            The fastest path from open role to{' '}
            <span className="gradient-title">right hire.</span>
          </h2>
          <div className="space-y-4 pt-1">
            {benefits.map(({ Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-brand-text-muted"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="mt-0.5 w-7 h-7 rounded-lg grid place-items-center shrink-0 text-brand-accent"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Icon />
                </span>
                <span className="leading-relaxed text-[#B8C2DC]">{text}</span>
              </div>
            ))}
          </div>

          {/* Mini stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(35,42,62,0.8)' }}>
            {[
              { v: '12k+', l: 'hires made' },
              { v: '94%', l: 'satisfaction' },
            ].map(({ v, l }) => (
              <div key={l} className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(16,20,32,0.7)', border: '1px solid rgba(35,42,62,0.7)' }}>
                <div className="text-xl font-bold font-mono text-brand-accent" style={{ textShadow: '0 0 15px rgba(245,158,11,0.4)' }}>{v}</div>
                <div className="text-[11px] text-brand-text-disabled mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer compliance */}
        <div className="relative flex items-center gap-2 text-[11px] font-mono text-brand-text-disabled">
          <ShieldIcon size={10} />
          SOC 2 · GDPR · ISO-27001
        </div>
      </aside>

      {/* ── Right form panel ────────────────────────────────────────── */}
      <main className="flex items-center justify-center p-6 md:p-10 overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #0D1018 0%, #090C14 100%)' }}>
        <div className="w-full max-w-md animate-fadeIn">
          <Link to="/" className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-primary mb-8 transition-colors group">
            <span className="group-hover:-translate-x-0.5 transition-transform"><BackIcon /></span>
            Back to home
          </Link>

          <h1 className="text-[30px] font-extrabold tracking-tight text-brand-text-primary">Welcome back</h1>
          <p className="text-sm text-brand-text-muted mt-1.5">Sign in to continue hiring smarter.</p>

          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl text-sm text-red-300 animate-slideUp"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            {/* Role selector */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-brand-text-muted">I am a</label>
              <div className="grid grid-cols-2 rounded-xl p-1 gap-1"
                style={{ background: '#181E2E', border: '1px solid rgba(35,42,62,0.8)' }}>
                {[
                  { v: 'RECRUITER', l: 'Recruiter', Icon: BriefcaseIcon },
                  { v: 'JOBSEEKER', l: 'Job seeker', Icon: UsersIcon },
                ].map(opt => (
                  <button key={opt.v} type="button" onClick={() => setRole(opt.v)}
                    className="h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-200"
                    style={role === opt.v
                      ? { background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#090C14', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }
                      : { color: '#9BA6C4' }}>
                    <opt.Icon /> {opt.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-brand-text-muted">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-disabled pointer-events-none"><MailIcon /></div>
                <input
                  name="email" type="email" required
                  value={formData.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full text-sm rounded-xl text-brand-text-primary placeholder:text-brand-text-disabled pl-10 pr-3 py-3 transition-all outline-none"
                  style={{
                    background: '#101420',
                    border: '1px solid rgba(35,42,62,0.8)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="block text-xs font-medium text-brand-text-muted">
                  Password <span className="text-red-400">*</span>
                </label>
                <button type="button" className="text-xs text-brand-accent hover:text-brand-accent-bright transition-colors">Forgot?</button>
              </div>
              <div className="relative">
                <input
                  name="password" type={showPassword ? 'text' : 'password'} required
                  value={formData.password} onChange={handleChange}
                  placeholder="Your password"
                  className="w-full text-sm rounded-xl text-brand-text-primary placeholder:text-brand-text-disabled px-3 py-3 pr-11 transition-all outline-none"
                  style={{
                    background: '#101420',
                    border: '1px solid rgba(35,42,62,0.8)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-disabled hover:text-brand-text-muted transition-colors">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 text-xs text-brand-text-muted cursor-pointer group">
              <input type="checkbox" defaultChecked className="accent-amber-400 rounded w-3.5 h-3.5" />
              <span className="group-hover:text-brand-text-primary transition-colors">Remember me for 30 days</span>
            </label>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full mt-2 h-12 px-6 rounded-xl text-gray-900 font-bold text-sm inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', boxShadow: '0 0 30px rgba(245,158,11,0.35), 0 4px 12px rgba(245,158,11,0.2)' }}>
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" opacity=".25"/>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
              ) : <><span>Sign in</span> <ArrowRight /></>}
            </button>
          </form>

          <p className="text-center text-sm text-brand-text-muted mt-6">
            No account yet?{' '}
            <Link to="/register" className="text-brand-accent hover:text-brand-accent-bright font-semibold transition-colors">Create one</Link>
          </p>

          {/* Divider with compliance */}
          <div className="flex items-center gap-3 mt-8">
            <div className="flex-1 h-px" style={{ background: 'rgba(35,42,62,0.6)' }} />
            <span className="text-[11px] font-mono text-brand-text-disabled">Secured by recrutai</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(35,42,62,0.6)' }} />
          </div>
          <div className="flex justify-center gap-4 mt-3 text-[10px] font-mono text-brand-text-disabled">
            <span>256-bit TLS</span>
            <span>·</span>
            <span>SOC 2</span>
            <span>·</span>
            <span>GDPR compliant</span>
          </div>
        </div>
      </main>
    </div>
  );
}
