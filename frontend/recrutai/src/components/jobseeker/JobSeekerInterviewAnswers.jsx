import React, { useEffect, useState } from 'react';
import { fetchAnswers } from '../../services/api';
import { resolveMediaUrl } from '../../shared/http/client';
import { ArrowLeft, VideoOff, FileText, Mic } from 'lucide-react';
import EvaluationPanel from '../interviews/EvaluationPanel';

const ArrowLeftIcon = ({ size = 14 }) => <ArrowLeft size={size} strokeWidth={2.5} />;
const VideoOffIcon  = ({ size = 22 }) => <VideoOff size={size} strokeWidth={1.5} />;
const FileTextIcon  = ({ size = 14 }) => <FileText size={size} />;
const MicIcon       = ({ size = 22 }) => <Mic size={size} strokeWidth={1.5} />;

/* ── Skeleton ───────────────────────────────────────────────────────── */
function SkeletonAnswers() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="rounded-xl p-5 space-y-3 animate-pulse" style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
        <div className="h-3 w-20 rounded" style={{ background: 'rgba(35,42,62,0.8)' }} />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-9 rounded-lg" style={{ background: 'rgba(35,42,62,0.6)' }} />
        ))}
      </div>
      <div className="md:col-span-2 space-y-4 animate-pulse">
        <div className="aspect-video rounded-2xl" style={{ background: 'rgba(35,42,62,0.5)' }} />
        <div className="rounded-xl p-5 space-y-2" style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
          <div className="h-3 w-24 rounded" style={{ background: 'rgba(35,42,62,0.8)' }} />
          <div className="h-4 rounded" style={{ background: 'rgba(35,42,62,0.6)' }} />
          <div className="h-4 w-5/6 rounded" style={{ background: 'rgba(35,42,62,0.5)' }} />
        </div>
      </div>
    </div>
  );
}

export default function JobSeekerInterviewAnswers({ interviewId, onBack }) {
  const [answers, setAnswers]                   = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAnswers(interviewId);
        if (!alive) return;
        if (Array.isArray(data.answers)) {
          setAnswers(data.answers);
        } else {
          setError('Unexpected data format from server.');
        }
      } catch {
        if (alive) setError('Failed to load answers. Please try again.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [interviewId]);

  const selected = answers[selectedQuestion];

  return (
    <div className="flex-1 animate-fadeIn">
      {/* Topbar */}
      <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <button onClick={onBack} className="w-8 h-8 rounded-lg grid place-items-center text-brand-text-muted transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ArrowLeftIcon />
        </button>
        <div className="flex-1">
          <h1 className="text-[15px] font-semibold text-brand-text-primary">Interview Answers</h1>
        </div>
        {!loading && answers.length > 0 && (
          <span className="text-xs text-brand-text-disabled font-mono">
            {answers.length} question{answers.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="px-8 py-6 max-w-[1200px] mx-auto">

        {/* Loading */}
        {loading && <SkeletonAnswers />}

        {/* Error */}
        {!loading && error && (
          <div className="px-4 py-3 rounded-xl text-sm text-red-300 flex items-center justify-between"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
            <button onClick={() => window.location.reload()} className="text-xs underline hover:text-red-200">Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && answers.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl grid place-items-center text-brand-text-disabled"
              style={{ background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)' }}>
              <MicIcon />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-brand-text-primary">No answers recorded</div>
              <div className="text-xs text-brand-text-muted mt-1">No answers were found for this interview.</div>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && answers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Question list */}
            <div className="rounded-xl p-4 h-fit sticky top-20"
              style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled mb-3">
                Questions
              </div>
              <ul className="space-y-1">
                {answers.map((a, i) => (
                  <li key={a.question_id}>
                    <button
                      onClick={() => setSelectedQuestion(i)}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all"
                      style={selectedQuestion === i
                        ? { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }
                        : { background: 'transparent', border: '1px solid transparent', color: '#9BA6C4' }}
                      onMouseEnter={e => selectedQuestion !== i && (e.currentTarget.style.background = 'rgba(35,42,62,0.5)')}
                      onMouseLeave={e => selectedQuestion !== i && (e.currentTarget.style.background = 'transparent')}>
                      <span className="text-[10px] font-mono font-semibold mr-1.5 opacity-60">Q{i + 1}</span>
                      <span className="text-xs leading-relaxed line-clamp-2">{a.question_text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Video + transcript */}
            <div className="md:col-span-2 space-y-4">
              {/* Video */}
              {selected?.video_url ? (
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: '#000', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
                  <video
                    key={selected.video_url}
                    controls
                    className="w-full"
                  >
                    <source
                      src={resolveMediaUrl(selected.video_url)}
                      type="video/webm"
                    />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="aspect-video rounded-2xl flex flex-col items-center justify-center gap-3"
                  style={{ background: 'rgba(35,42,62,0.3)', border: '1px solid rgba(35,42,62,0.6)', borderStyle: 'dashed' }}>
                  <div className="w-12 h-12 rounded-xl grid place-items-center text-brand-text-disabled"
                    style={{ background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)' }}>
                    <VideoOffIcon />
                  </div>
                  <p className="text-sm text-brand-text-disabled">No video recorded for this question</p>
                </div>
              )}

              {/* Question display */}
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#F59E0B' }}>
                  Question {selectedQuestion + 1}
                </div>
                <p className="text-sm text-brand-text-primary font-medium leading-relaxed">
                  {selected?.question_text}
                </p>
              </div>

              {/* Transcript */}
              {selected?.transcript && (
                <div className="rounded-xl p-5"
                  style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FileTextIcon />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled">Transcript</span>
                  </div>
                  <p className="text-sm text-brand-text-muted leading-relaxed">
                    {selected.transcript}
                  </p>
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={selectedQuestion === 0}
                  onClick={() => setSelectedQuestion(i => i - 1)}
                  className="h-8 px-4 rounded-lg text-xs font-medium text-brand-text-muted inline-flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid rgba(35,42,62,0.7)', background: 'rgba(35,42,62,0.3)' }}
                  onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)')}>
                  <ArrowLeftIcon /> Previous
                </button>
                <span className="text-xs text-brand-text-disabled font-mono">
                  {selectedQuestion + 1} / {answers.length}
                </span>
                <button
                  disabled={selectedQuestion === answers.length - 1}
                  onClick={() => setSelectedQuestion(i => i + 1)}
                  className="h-8 px-4 rounded-lg text-xs font-medium text-brand-text-muted inline-flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ border: '1px solid rgba(35,42,62,0.7)', background: 'rgba(35,42,62,0.3)' }}
                  onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)')}>
                  Next <ArrowLeftIcon size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evaluation section */}
        {!loading && !error && answers.length > 0 && (
          <div className="mt-6 rounded-2xl p-6"
            style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
            <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled mb-4">
              Interview Evaluation
            </div>
            <EvaluationPanel interviewId={interviewId} readOnly />
          </div>
        )}
      </div>
    </div>
  );
}
