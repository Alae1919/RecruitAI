import React, { useState, useRef, useEffect } from "react";
import { fetchQuestions, sendVideo } from "../../services/api";

const JobSeekerInterviewProcess = ({ interview, onClose }) => {
  const [step, setStep] = useState(1);
  const videoRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [recordedVideos, setRecordedVideos] = useState([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const videosRef = useRef([]);
  const timerRefs = useRef([]);

  useEffect(() => {
    const fetchInterviewQuestions = async () => {
      try {
        const data = await fetchQuestions(interview.id);
        setQuestions(data);
        setRecordedVideos(new Array(data.length).fill(null));
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };
    fetchInterviewQuestions();
  }, [interview.id]);

  useEffect(() => {
    return () => timerRefs.current.forEach(clearTimeout);
  }, []);

  const startNewRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16,
        },
      });

      if (!videoRef.current) {
        console.error("videoRef is null, cannot set srcObject.");
        return;
      }
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;

      const options = {
        mimeType: 'video/webm;codecs="vp9,opus"',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 192000,
      };

      const recorder = new MediaRecorder(stream, options);
      let chunks = [];

      let stopResolve;
      const stopPromise = new Promise((resolve) => {
        stopResolve = resolve;
      });

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = () => {
        if (chunks.length === 0) {
          console.warn("No data recorded.");
          stopResolve();
          return;
        }
        const blob = new Blob(chunks, { type: "video/webm" });
        videosRef.current[currentQuestionIndex] = blob;
        setRecordedVideos([...videosRef.current]);
        chunks = [];
        stopResolve();
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      return stopPromise;
    } catch (error) {
      console.error("Error starting recording:", error);
      return Promise.resolve();
    }
  };

  const handleStartInterview = async () => {
    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
    setStep(3);
  };

  const handleNextQuestion = async () => {
    try {
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
      const tid = setTimeout(() => {
        const videoBlob = videosRef.current[currentQuestionIndex];
        if (videoBlob) {
          const formData = new FormData();
          const filename = `question_${currentQuestionIndex + 1}_interview${interview.id}.webm`;
          formData.append("video", videoBlob, filename);
          formData.append("questionId", questions[currentQuestionIndex].id);
          formData.append("interviewId", interview.id);
          sendVideo(formData);
        }
      }, 1000);
      timerRefs.current.push(tid);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error handling next question:", error);
    }
  };

  const handleEndInterview = async () => {
    if (mediaRecorder) {
      mediaRecorder.stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      videoRef.current.srcObject = null;
    }
    const tid = setTimeout(() => {
      const videoBlob = videosRef.current[currentQuestionIndex];
      if (videoBlob) {
        const formData = new FormData();
        const filename = `question_${currentQuestionIndex + 1}_interview${interview.id}.webm`;
        formData.append("video", videoBlob, filename);
        formData.append("questionId", questions[currentQuestionIndex].id);
        formData.append("interviewId", interview.id);
        sendVideo(formData);
      }
    }, 1000);
    timerRefs.current.push(tid);
    onClose();
  };

  useEffect(() => {
    if (interviewStarted && currentQuestionIndex >= 0) {
      startNewRecording();
    }
  }, [currentQuestionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Entretien - {interview.offerName}</h2>

      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold">📌 Étape 1 : Instructions</h3>
          <p className="text-gray-700">
            Lisez attentivement les instructions avant de commencer.
          </p>
          <button
            onClick={() => setStep(2)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Suivant
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold">🎤 Vérification technique</h3>
          <p className="text-gray-700">
            Vérifiez votre micro et caméra avant de commencer.
          </p>
          <button
            onClick={handleStartInterview}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Commencer l'entretien
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="relative">
              <video ref={videoRef} autoPlay className="border rounded-lg w-full aspect-video"></video>
              {recording && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  🔴 Enregistrement
                </div>
              )}
            </div>
          </div>

          <div className="w-96 flex flex-col gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">
                Question {currentQuestionIndex + 1}/{questions.length}
              </h3>
              <p className="text-gray-700">
                {questions[currentQuestionIndex]?.question_text}
              </p>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Question suivante →
                </button>
              ) : (
                <button
                  onClick={handleEndInterview}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Terminer l'entretien
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSeekerInterviewProcess;
