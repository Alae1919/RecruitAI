import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerRecruiter } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Check } from 'lucide-react';

const EMPTY = {
  full_name: '', email: '', password: '', phone: '',
  company_phone: '', company_name: '', company_website: '',
  industry: '', adress: '', position: '',
};

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <div className="text-[10px] font-mono tracking-[0.18em] uppercase"
        style={{ color: '#F59E0B', textShadow: '0 0 12px rgba(245,158,11,0.35)' }}>
        {children}
      </div>
      <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.12)' }} />
    </div>
  );
}

function SuccessState() {
  return (
    <div className="text-center py-10 space-y-4 animate-fadeIn">
      <div className="w-16 h-16 rounded-full mx-auto grid place-items-center"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 30px rgba(245,158,11,0.15)' }}>
        <Check size={28} strokeWidth={2.5} stroke="#F59E0B" />
      </div>
      <h3 className="text-lg font-bold text-brand-text-primary">Account created!</h3>
      <p className="text-sm text-brand-text-muted">Your recruiter account is ready. Sign in to start hiring with AI.</p>
      <Link to="/login"
        className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-gray-900 font-bold text-sm mt-2 transition-all active:scale-[.98]"
        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', boxShadow: '0 0 24px rgba(245,158,11,0.3)' }}>
        Sign in now
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </Link>
    </div>
  );
}

export default function RecruiterForm() {
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [done, setDone]         = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerRecruiter(formData);
      setDone(true);
      toast.success('Account created! You can now sign in.');
      setFormData(EMPTY);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return <SuccessState />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-300 animate-slideUp"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {/* Personal */}
      <SectionLabel>Personal Info</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Jane Doe" required />
        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@company.com" required />
        <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
        <Input label="Personal Phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+212 6..." required />
        <Input label="Address" name="adress" value={formData.adress} onChange={handleChange} placeholder="City, Country" required containerClassName="sm:col-span-2" />
      </div>

      {/* Company */}
      <SectionLabel>Company Details</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Company Name" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="Acme Corp" required />
        <Input label="Your Position" name="position" value={formData.position} onChange={handleChange} placeholder="HR Manager" required />
        <Input label="Company Phone" name="company_phone" value={formData.company_phone} onChange={handleChange} placeholder="+212 5..." required />
        <Input label="Industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="Technology" required={false} />
        <Input label="Company Website" name="company_website" type="url" value={formData.company_website} onChange={handleChange} placeholder="https://..." required={false} containerClassName="sm:col-span-2" />
      </div>

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Create recruiter account
      </Button>
    </form>
  );
}
