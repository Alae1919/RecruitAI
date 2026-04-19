import React, { useEffect, useState } from 'react';
import { fetchAnswers } from '../../services/api';
import { Button, Card } from '../ui/index';
import Spinner from '../ui/Spinner';

export default function JobSeekerInterviewAnswers({ interviewId, onBack }) {
  const [answers, setAnswers]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
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

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-brand-text-primary">Interview Answers</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <Card>
          <p className="text-sm text-red-400 text-center py-4">{error}</p>
        </Card>
      )}

      {!loading && !error && answers.length === 0 && (
        <Card>
          <p className="text-sm text-gray-500 dark:text-brand-text-muted text-center py-6">No answers recorded for this interview.</p>
        </Card>
      )}

      {!loading && !error && answers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Question list */}
          <Card className="md:col-span-1 h-fit">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-brand-text-muted uppercase tracking-wide mb-3">Questions</h3>
            <ul className="space-y-1">
              {answers.map((a, i) => (
                <li key={a.question_id}>
                  <button
                    onClick={() => setSelectedQuestion(i)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                      selectedQuestion === i
                        ? 'bg-brand-accent/10 text-brand-accent font-medium'
                        : 'text-gray-600 dark:text-brand-text-muted hover:bg-gray-100 dark:hover:bg-brand-elevated'
                    }`}
                  >
                    <span className="text-xs font-semibold opacity-50 mr-1">Q{i + 1}</span>
                    {a.question_text}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Video + transcript */}
          <div className="md:col-span-2 space-y-4">
            {answers[selectedQuestion]?.video_url ? (
              <video
                key={answers[selectedQuestion].video_url}
                controls
                className="w-full rounded-xl border border-surface-border dark:border-brand-border bg-black"
              >
                <source
                  src={`${process.env.REACT_APP_BACKEND_URL}${answers[selectedQuestion].video_url}`}
                  type="video/webm"
                />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="aspect-video rounded-xl border border-surface-border dark:border-brand-border bg-gray-100 dark:bg-brand-elevated flex items-center justify-center">
                <p className="text-sm text-gray-400 dark:text-brand-text-disabled">No video recorded</p>
              </div>
            )}

            {answers[selectedQuestion]?.transcript && (
              <Card>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-brand-text-muted uppercase tracking-wide mb-2">Transcript</h4>
                <p className="text-sm text-gray-700 dark:text-brand-text-muted leading-relaxed">
                  {answers[selectedQuestion].transcript}
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
