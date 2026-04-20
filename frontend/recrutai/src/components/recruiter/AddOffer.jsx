import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJobOffer } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Bell } from 'lucide-react';
import { Stepper } from './add-offer/shared';
import StepDescribe from './add-offer/StepDescribe';
import StepDetails from './add-offer/StepDetails';
import StepRequirements from './add-offer/StepRequirements';
import StepScreening from './add-offer/StepScreening';
import StepPreview from './add-offer/StepPreview';

const STEPS = ['Describe', 'Details', 'Requirements', 'Screening', 'Preview'];

const EMPTY = {
  title: '', department: 'Engineering', location: '', type: 'Full-time',
  salary_range: '', description: '', requirements: '',
  mustSkills: [], niceSkills: [], yearsMin: 3, yearsMax: 8,
  screening: { cv: true, cover: false, video: true, questions: 3 },
};

export default function AddOffer() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(EMPTY);
  const [publishing, setPublishing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePublish = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { toast.error('Authentication required.'); return; }
    setPublishing(true);
    try {
      await createJobOffer({
        title: data.title,
        description: data.description,
        requirements: [...data.mustSkills, ...data.niceSkills].join(', ') || data.requirements,
        salary_range: data.salary_range,
        location: data.location,
      }, token);
      toast.success('Offer published!');
      navigate('/recruiter-dashboard/view-offers');
    } catch {
      toast.error('Failed to publish offer. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex-1 animate-fadeIn">
      {/* Topbar */}
      <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-mono text-brand-text-disabled mb-0.5">Job offers / new</div>
          <h1 className="text-[15px] font-semibold text-brand-text-primary">New job offer</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Bell size={15} />
          </button>
          <button onClick={() => navigate('/recruiter-dashboard/view-offers')}
            className="h-8 px-3 text-xs rounded-lg text-brand-text-muted transition-all"
            style={{ border: '1px solid rgba(35,42,62,0.7)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(35,42,62,0.5)'; e.currentTarget.style.color = '#EEF0F8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ''; }}>
            Cancel
          </button>
        </div>
      </div>

      <div className="max-w-[980px] mx-auto px-8 py-8">
        <Stepper steps={STEPS} current={step} />
        {step === 0 && <StepDescribe onDrafted={draft => { setData(d => ({ ...d, ...draft })); setStep(1); }} onSkip={() => setStep(1)} />}
        {step === 1 && <StepDetails data={data} setData={setData} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
        {step === 2 && <StepRequirements data={data} setData={setData} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <StepScreening data={data} setData={setData} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <StepPreview data={data} onBack={() => setStep(3)} onPublish={handlePublish} publishing={publishing} />}
      </div>
    </div>
  );
}
