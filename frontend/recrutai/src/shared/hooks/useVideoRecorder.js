import { useRef, useCallback } from 'react';

export function useVideoRecorder(videoRef) {
  const recorderRef = useRef(null);
  const streamRef   = useRef(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 },
    });
    streamRef.current = stream;
    if (videoRef?.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
    }
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs="vp9,opus"',
      videoBitsPerSecond: 2_500_000,
      audioBitsPerSecond: 192_000,
    });
    recorderRef.current = recorder;
    recorder.start();
  }, [videoRef]);

  const stopAndGetBlob = useCallback(() => new Promise((resolve) => {
    const recorder = recorderRef.current;
    if (!recorder) { resolve(null); return; }
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: 'video/webm' }) : null);
    recorder.stop();
  }), []);

  const teardown = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef?.current) videoRef.current.srcObject = null;
  }, [videoRef]);

  return { start, stopAndGetBlob, teardown };
}
