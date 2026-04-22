import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Lock, Unlock, MessageSquare } from 'lucide-react';
import { useQuestionSets, useCreateQuestionSet, usePatchQuestionSet, useDeleteQuestionSet, useRegenerateQuestionSet, useCreateQuestion, usePatchQuestion, useDeleteQuestion } from '../../../shared/hooks/useQuestionSets';
import { useToast } from '../../../hooks/useToast';
import AsyncTaskBanner from '../../ui/AsyncTaskBanner';
import GenerateQuestionSetForm from './GenerateQuestionSetForm';
import QuestionEditor from './QuestionEditor';

const STATUS_CONFIG = {
  draft:  { label: 'Draft',  bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.3)',   color: '#F59E0B' },
  ready:  { label: 'Ready',  bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  color: '#10B981' },
  locked: { label: 'Locked', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)',  color: '#818CF8' },
};

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export default function InterviewQuestionsPage() {
  const { offerId } = useParams();
  const navigate    = useNavigate();
  const { toast }   = useToast();

  const { data: qsList = [], isLoading } = useQuestionSets(offerId);
  const [activeQsId, setActiveQsId] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showRegen, setShowRegen]   = useState(false);

  const createMut   = useCreateQuestionSet(offerId);
  const patchMut    = usePatchQuestionSet(offerId);
  const regenMut    = useRegenerateQuestionSet(offerId);
  const createQMut  = useCreateQuestion(offerId);
  const patchQMut   = usePatchQuestion(offerId);
  const deleteQMut  = useDeleteQuestion(offerId);

  const latestQs = qsList.length ? qsList[qsList.length - 1] : null;
  const activeQs = activeQsId ? qsList.find(qs => qs.id === activeQsId) : latestQs;

  const isGenerating = activeQs?.status === 'draft' && activeQs?.task_id && (!activeQs.questions || activeQs.questions.length === 0);
  const isLocked     = activeQs?.status === 'locked';
  const isReady      = activeQs?.status === 'ready';

  const handleGenerate = async (data) => {
    try {
      await createMut.mutateAsync(data);
      setShowGenerate(false);
      toast.success('Generating questions… this may take a moment.');
    } catch {
      toast.error('Failed to start generation.');
    }
  };

  const handleRegen = async (data) => {
    if (!activeQs) return;
    try {
      await regenMut.mutateAsync({ id: activeQs.id, data: { recruiter_instructions: data.recruiter_instructions } });
      setShowRegen(false);
      toast.success('Regeneration started.');
    } catch {
      toast.error('Failed to regenerate.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeQs) return;
    try {
      await patchMut.mutateAsync({ id: activeQs.id, data: { status: newStatus } });
      toast.success(`Question set marked as ${newStatus}.`);
    } catch (err) {
      toast.error(err?.message || 'Failed to update status.');
    }
  };

  const handleSaveQuestion = async (questionId, data) => {
    try {
      await patchQMut.mutateAsync({ id: questionId, data });
    } catch {
      toast.error('Failed to save question.');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await deleteQMut.mutateAsync(questionId);
    } catch {
      toast.error('Failed to delete question.');
    }
  };

  const handleAddQuestion = async () => {
    if (!activeQs) return;
    try {
      await createQMut.mutateAsync({
        questionSetId: activeQs.id,
        data: { text: 'New question — click to edit', question_type: activeQs.question_type || 'technical' },
      });
    } catch {
      toast.error('Failed to add question.');
    }
  };

  return (
    <div className="flex-1 animate-fadeIn">
      {/* Topbar */}
      <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg grid place-items-center text-brand-text-muted transition-colors"
          style={{ border: '1px solid rgba(35,42,62,0.7)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.5)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-mono text-brand-text-disabled mb-0.5">Job offers / offer #{offerId}</div>
          <h1 className="text-[15px] font-semibold text-brand-text-primary flex items-center gap-2">
            <MessageSquare size={15} className="text-indigo-400" />
            Interview Questions
            {activeQs && <StatusChip status={activeQs.status} />}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && !isLocked && activeQs && (
            <>
              <button onClick={() => setShowRegen(true)}
                className="h-8 px-3 text-xs rounded-lg inline-flex items-center gap-1.5 transition-all text-brand-text-muted"
                style={{ border: '1px solid rgba(35,42,62,0.7)', background: 'rgba(16,20,32,0.6)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#F59E0B'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)'; }}>
                <RefreshCw size={12} /> Regenerate
              </button>
              {isReady && (
                <button onClick={() => handleStatusChange('locked')}
                  className="h-8 px-3 text-xs rounded-lg font-semibold inline-flex items-center gap-1.5 transition-all"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818CF8' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}>
                  <Lock size={12} /> Lock
                </button>
              )}
              {activeQs.status === 'draft' && (activeQs.questions?.length ?? 0) > 0 && (
                <button onClick={() => handleStatusChange('ready')}
                  className="h-8 px-3 text-xs rounded-lg font-semibold inline-flex items-center gap-1.5 transition-all"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}>
                  <Unlock size={12} /> Mark ready
                </button>
              )}
            </>
          )}
          {!isLoading && (
            <button
              onClick={() => setShowGenerate(true)}
              className="h-8 px-3 text-xs rounded-lg font-semibold inline-flex items-center gap-1.5 transition-all active:scale-[.97]"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 16px rgba(245,158,11,0.3)' }}>
              <Plus size={13} /> {qsList.length ? 'New version' : 'Generate'}
            </button>
          )}
        </div>
      </div>

      <div className="px-8 py-6 max-w-[920px] mx-auto">

        {/* Version selector */}
        {qsList.length > 1 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {qsList.map(qs => (
              <button key={qs.id}
                onClick={() => setActiveQsId(qs.id)}
                className="h-7 px-3 text-xs rounded-lg transition-all"
                style={{
                  background: activeQs?.id === qs.id ? 'rgba(245,158,11,0.12)' : 'rgba(35,42,62,0.4)',
                  border: `1px solid ${activeQs?.id === qs.id ? 'rgba(245,158,11,0.3)' : 'rgba(35,42,62,0.7)'}`,
                  color: activeQs?.id === qs.id ? '#F59E0B' : '#9BA6C4',
                }}>
                v{qs.version}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(35,42,62,0.4)' }} />)}
          </div>
        )}

        {!isLoading && !activeQs && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl grid place-items-center text-brand-text-disabled"
              style={{ background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)' }}>
              <MessageSquare size={22} />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-brand-text-primary">No question sets yet</div>
              <div className="text-xs text-brand-text-muted mt-1">Click "Generate" to create the first set.</div>
            </div>
          </div>
        )}

        {!isLoading && activeQs && (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="rounded-xl p-4 text-sm"
              style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Type', value: activeQs.question_type || '—' },
                  { label: 'Target', value: `${activeQs.target_count} Qs` },
                  { label: 'Version', value: `v${activeQs.version}` },
                  { label: 'Questions', value: activeQs.questions?.length ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[10px] font-mono text-brand-text-disabled uppercase tracking-wider mb-0.5">{label}</div>
                    <div className="text-sm font-medium text-brand-text-primary">{value}</div>
                  </div>
                ))}
              </div>
              {activeQs.recruiter_instructions && (
                <div className="mt-3 pt-3 border-t text-xs text-brand-text-muted" style={{ borderColor: 'rgba(35,42,62,0.6)' }}>
                  <span className="text-brand-text-disabled">Instructions: </span>
                  {activeQs.recruiter_instructions}
                </div>
              )}
            </div>

            {/* Generation in progress */}
            {isGenerating && (
              <AsyncTaskBanner state="pending" label="AI is generating questions" />
            )}

            {/* Status banners */}
            {isLocked && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', color: '#818CF8' }}>
                <Lock size={14} /> This version is locked and in use by candidates. Start a new version to make changes.
              </div>
            )}
            {isReady && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}>
                <Unlock size={14} /> Ready for candidates. Lock this version when you're satisfied.
              </div>
            )}

            {/* Question list */}
            {(activeQs.questions?.length ?? 0) > 0 && (
              <div className="space-y-2">
                {activeQs.questions.map(q => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    readOnly={isLocked}
                    onSave={handleSaveQuestion}
                    onDelete={handleDeleteQuestion}
                    isSaving={patchQMut.isPending && patchQMut.variables?.id === q.id}
                    isDeleting={deleteQMut.isPending && deleteQMut.variables === q.id}
                  />
                ))}
              </div>
            )}

            {/* Add question button */}
            {!isLocked && !isGenerating && (
              <button
                onClick={handleAddQuestion}
                disabled={createQMut.isPending}
                className="w-full py-3 rounded-xl text-sm text-brand-text-muted transition-all disabled:opacity-50"
                style={{ border: '1.5px dashed rgba(35,42,62,0.8)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#EEF0F8'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; e.currentTarget.style.color = ''; }}>
                <Plus size={14} className="inline mr-1" /> Add question
              </button>
            )}
          </div>
        )}
      </div>

      <GenerateQuestionSetForm
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        onSubmit={handleGenerate}
        loading={createMut.isPending}
      />

      <GenerateQuestionSetForm
        isOpen={showRegen}
        onClose={() => setShowRegen(false)}
        onSubmit={handleRegen}
        loading={regenMut.isPending}
        defaultInstructions={activeQs?.recruiter_instructions ?? ''}
      />
    </div>
  );
}
