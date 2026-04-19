import React, { useEffect, useRef, useState } from 'react';
import { fetchQuestions, sendVideo } from '../../services/api';
import { Button, Card, Badge } from '../ui/index';
import Spinner from '../ui/Spinner';

export default function JobSeekerInterviewProcess({ interview, onClose }) {
  const [step, setStep]                         = useState(1);
  const videoRef                                = useRef(null);
  const [recording, setRecording]               = useState(false);
  const [mediaRecorder, setMediaRecorder]       = useState(null);
  const [questions, setQuestions]               = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [recordedVideos, setRecordedVideos]     = useState([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
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

  const handleNextQuestion = async () => {
    submitCurrentVideo();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleEndInterview = async () => {
    if (mediaRecorder) {
      mediaRecorder.stream.getTracks().forEach(t => { t.stop(); t.enabled = false; });
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    submitCurrentVideo();
    onClose();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-brand-text-primary">
          Interview — <span className="text-brand-accent">{interview.offerName}</span>
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant={step === 1 ? 'info' : step === 2 ? 'warning' : 'success'}>
            Step {step}/3
          </Badge>
        </div>
      </div>

      {/* Step 1: Instructions */}
      {step === 1 && (
        <Card className="max-w-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl">📋</div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-brand-text-primary">Before you start</h2>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-brand-text-muted">
              <li className="flex items-start gap-2"><span className="text-brand-accent font-bold mt-0.5">•</span>Find a quiet place with good lighting</li>
              <li className="flex items-start gap-2"><span className="text-brand-accent font-bold mt-0.5">•</span>Each question will be recorded as a separate video</li>
              <li className="flex items-start gap-2"><span className="text-brand-accent font-bold mt-0.5">•</span>Take your time to answer clearly and completely</li>
              <li className="flex items-start gap-2"><span className="text-brand-accent font-bold mt-0.5">•</span>Click "Next" when finished with each answer</li>
            </ul>
            {loadingQuestions ? (
              <div className="flex items-center gap-2 text-sm text-gray-400"><Spinner size="sm" /> Loading questions...</div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-brand-text-muted">{questions.length} question{questions.length !== 1 ? 's' : ''} total</p>
            )}
            <Button onClick={() => setStep(2)} disabled={loadingQuestions || questions.length === 0}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Tech check */}
      {step === 2 && (
        <Card className="max-w-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl">🎤</div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-brand-text-primary">Technical check</h2>
            <p className="text-sm text-gray-600 dark:text-brand-text-muted">
              Make sure your camera and microphone are working. You'll need them to record your answers.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleStartInterview}>Start Interview</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Recording */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video feed */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden border border-surface-border dark:border-brand-border bg-black aspect-video">
              <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
              {recording && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Recording
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Badge variant="neutral" className="bg-black/50 text-white border-white/20">
                  Q{currentQuestionIndex + 1}/{questions.length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            <Card>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-brand-text-muted uppercase tracking-wide mb-2">
                Question {currentQuestionIndex + 1}
              </h3>
              <p className="text-sm font-medium text-gray-900 dark:text-brand-text-primary leading-relaxed">
                {questions[currentQuestionIndex]?.question_text}
              </p>
            </Card>

            <div className="mt-auto">
              {currentQuestionIndex < questions.length - 1 ? (
                <Button className="w-full" onClick={handleNextQuestion}>
                  Next Question
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Button>
              ) : (
                <Button className="w-full" onClick={handleEndInterview}>
                  Finish Interview ✓
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
