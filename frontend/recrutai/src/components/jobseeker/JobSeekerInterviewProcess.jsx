import React, { useEffect, useRef, useState } from 'react';
import { fetchQuestions, sendVideo } from '../../services/api';
import { Clipboard, Mic, ArrowRight, ArrowLeft, Check, X, Loader2 } from 'lucide-react';

const ClipboardIcon  = ({ size = 22 }) => <Clipboard size={size} strokeWidth={1.5} />;
const MicIcon        = ({ size = 22 }) => <Mic size={size} strokeWidth={1.5} />;
const ArrowRightIcon = ({ size = 14 }) => <ArrowRight size={size} strokeWidth={2.5} />;
const ArrowLeftIcon  = ({ size = 14 }) => <ArrowLeft size={size} strokeWidth={2.5} />;
const CheckIcon      = ({ size = 14 }) => <Check size={size} strokeWidth={2.5} />;
const XIcon          = ({ size = 16 }) => <X size={size} />;
const Spinner        = () => <Loader2 size={16} className="animate-spin" />;

/* ── Step indicator ─────────────────────────────────────────────────── */
function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            style={i + 1 < current
              ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#34D399' }
              : i + 1 === current
                ? { background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 14px rgba(245,158,11,0.35)' }
                : { background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)', color: '#59628A' }}>
            {i + 1 < current ? <CheckIcon size={11} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className="w-8 h-px" style={{ background: i + 1 < current ? 'rgba(16,185,129,0.4)' : 'rgba(35,42,62,0.8)' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function JobSeekerInterviewProcess({ interview, onClose }) {
  const [step, setStep]                                   = useState(1);
  const videoRef                                          = useRef(null);
  const [recording, setRecording]                         = useState(false);
  const [mediaRecorder, setMediaRecorder]                 = useState(null);
  const [questions, setQuestions]                         = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex]   = useState(-1);
  const [recordedVideos, setRecordedVideos]               = useState([]);
  const [interviewStarted, setInterviewStarted]           = useState(false);
  const [loadingQuestions, setLoadingQuestions]           = useState(true);
  const videosRef  = useRef([]);
  const timerRefs  = useRef([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchQuestions(interview.id);
        setQuestions(data);
        setRecordedVideos(new Array(data.length).fill(null));
      } catch {}
      setLoadingQuestions(false);
    })();
    return () => timerRefs.current.forEach(clearTimeout);
  }, [interview.id]);

  useEffect(() => {
    if (interviewStarted && currentQuestionIndex >= 0) startNewRecording();
  }, [currentQuestionIndex]); // eslint-disable-line

  const startNewRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 },
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs="vp9,opus"', videoBitsPerSecond: 2500000, audioBitsPerSecond: 192000 });
      let chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        if (chunks.length) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          videosRef.current[currentQuestionIndex] = blob;
          setRecordedVideos([...videosRef.current]);
          chunks = [];
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {}
  };

  const handleStartInterview = () => {
    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
    setStep(3);
  };

  const submitCurrentVideo = () => {
    if (mediaRecorder) mediaRecorder.stop();
    const tid = setTimeout(() => {
      const blob = videosRef.current[currentQuestionIndex];
      if (blob) {
        const fd = new FormData();
        fd.append('video', blob, `question_${currentQuestionIndex + 1}_interview${interview.id}.webm`);
        fd.append('questionId', questions[currentQuestionIndex].id);
        fd.append('interviewId', interview.id);
        sendVideo(fd);
      }
    }, 1000);
    timerRefs.current.push(tid);
  };

  const handleNextQuestion = () => {
    submitCurrentVideo();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleEndInterview = () => {
    if (mediaRecorder) {
      mediaRecorder.stream.getTracks().forEach(t => { t.stop(); t.enabled = false; });
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    submitCurrentVideo();
    onClose();
  };

  return (
    <div className="flex-1 animate-fadeIn">
      {/* Topbar */}
      <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <button onClick={onClose} className="w-8 h-8 rounded-lg grid place-items-center text-brand-text-muted transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ArrowLeftIcon />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-brand-text-primary truncate">
            Interview — <span style={{ color: '#F59E0B' }}>{interview.offerName}</span>
          </h1>
        </div>
        <StepIndicator current={step} total={3} />
      </div>

      <div className="px-8 py-8 max-w-[960px] mx-auto">

        {/* Step 1: Instructions */}
        {step === 1 && (
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-8"
              style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div className="w-12 h-12 rounded-xl grid place-items-center mb-6"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60A5FA' }}>
                <ClipboardIcon />
              </div>
              <h2 className="text-lg font-bold text-brand-text-primary mb-2">Before you start</h2>
              <p className="text-sm text-brand-text-muted mb-6">
                Read through these guidelines to ensure the best experience.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Find a quiet place with good lighting',
                  'Each question will be recorded as a separate video',
                  'Take your time to answer clearly and completely',
                  'Click "Next" when finished with each answer',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-brand-text-muted">
                    <span className="w-5 h-5 rounded-full grid place-items-center shrink-0 mt-0.5 text-[10px] font-bold"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>

              {loadingQuestions ? (
                <div className="flex items-center gap-2 text-sm text-brand-text-muted mb-6">
                  <Spinner /> Loading questions…
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-6 text-sm"
                  style={{ color: '#F59E0B' }}>
                  <span className="font-mono font-bold">{questions.length}</span>
                  <span className="text-brand-text-muted">question{questions.length !== 1 ? 's' : ''} in this interview</span>
                </div>
              )}

              <button
                disabled={loadingQuestions || questions.length === 0}
                onClick={() => setStep(2)}
                className="w-full h-10 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 16px rgba(245,158,11,0.25)' }}>
                Continue <ArrowRightIcon />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Tech check */}
        {step === 2 && (
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-8"
              style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div className="w-12 h-12 rounded-xl grid place-items-center mb-6"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                <MicIcon />
              </div>
              <h2 className="text-lg font-bold text-brand-text-primary mb-2">Technical check</h2>
              <p className="text-sm text-brand-text-muted mb-8">
                Make sure your camera and microphone are working. You'll need both to record your answers.
                Your browser will request permission when you start.
              </p>

              <div className="rounded-xl p-4 mb-8"
                style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#F59E0B' }} />
                  <p className="text-xs text-brand-text-muted leading-relaxed">
                    When prompted by your browser, click <strong className="text-brand-text-primary">Allow</strong> to grant camera and microphone access. This is required to proceed.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-10 rounded-xl text-sm font-medium text-brand-text-muted transition-colors"
                  style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(35,42,62,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(35,42,62,1)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'}>
                  Back
                </button>
                <button
                  onClick={handleStartInterview}
                  className="flex-1 h-10 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 16px rgba(245,158,11,0.25)' }}>
                  Start Interview <ArrowRightIcon />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Recording */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video feed */}
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl overflow-hidden aspect-video"
                style={{ background: '#000', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
                <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                {recording && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'rgba(239,68,68,0.9)', backdropFilter: 'blur(8px)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    REC
                  </div>
                )}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                  Q{currentQuestionIndex + 1}/{questions.length}
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mt-4 px-1">
                {questions.map((_, i) => (
                  <div key={i} className="h-1 rounded-full flex-1 transition-all"
                    style={{
                      background: i < currentQuestionIndex
                        ? 'rgba(16,185,129,0.6)'
                        : i === currentQuestionIndex
                          ? '#F59E0B'
                          : 'rgba(35,42,62,0.8)'
                    }} />
                ))}
              </div>
            </div>

            {/* Controls panel */}
            <div className="flex flex-col gap-4">
              {/* Current question */}
              <div className="rounded-xl p-5 flex-1"
                style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled mb-3">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                <p className="text-sm font-medium text-brand-text-primary leading-relaxed">
                  {questions[currentQuestionIndex]?.question_text}
                </p>
              </div>

              {/* Answered list */}
              {currentQuestionIndex > 0 && (
                <div className="rounded-xl p-4"
                  style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#34D399' }}>
                    Answered
                  </div>
                  <div className="space-y-1">
                    {questions.slice(0, currentQuestionIndex).map((q, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-brand-text-muted">
                        <CheckIcon size={10} />
                        <span className="truncate">Q{i + 1}: {q.question_text?.slice(0, 35)}{q.question_text?.length > 35 ? '…' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action button */}
              <div>
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    className="w-full h-10 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all"
                    onClick={handleNextQuestion}
                    style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 16px rgba(245,158,11,0.25)' }}>
                    Next Question <ArrowRightIcon />
                  </button>
                ) : (
                  <button
                    className="w-full h-10 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all"
                    onClick={handleEndInterview}
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)', color: '#111827', boxShadow: '0 0 16px rgba(16,185,129,0.25)' }}>
                    <CheckIcon /> Finish Interview
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
