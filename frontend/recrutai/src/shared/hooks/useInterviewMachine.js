import { useReducer, useCallback, useRef } from 'react';
import { sendVideo } from '../api/interviews';
import { useVideoRecorder } from './useVideoRecorder';

// Discriminated state — impossible states are unrepresentable.
const INITIAL = { status: 'IDLE', qIdx: -1, error: null };

function reducer(state, event) {
  switch (event.type) {
    case 'START':
      return { ...state, status: 'RECORDING', qIdx: 0, error: null };
    case 'SUBMITTING':
      return { ...state, status: 'SUBMITTING' };
    case 'NEXT':
      return { ...state, status: 'RECORDING', qIdx: state.qIdx + 1, error: null };
    case 'DONE':
      return { ...state, status: 'DONE' };
    case 'ERROR':
      return { ...state, status: 'ERROR', error: event.error };
    default:
      return state;
  }
}

export function useInterviewMachine(interviewId, questions, videoRef) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const recorder = useVideoRecorder(videoRef);
  const stateRef = useRef(state);
  stateRef.current = state;

  const start = useCallback(async () => {
    dispatch({ type: 'START' });
    await recorder.start();
  }, [recorder]);

  const next = useCallback(async () => {
    if (stateRef.current.status !== 'RECORDING') return;
    dispatch({ type: 'SUBMITTING' });

    const { qIdx } = stateRef.current;
    const blob = await recorder.stopAndGetBlob();

    if (blob) {
      const fd = new FormData();
      fd.append('video', blob, `q${qIdx + 1}_interview${interviewId}.webm`);
      fd.append('questionId', questions[qIdx].id);
      fd.append('interviewId', interviewId);
      try {
        await sendVideo(fd);
      } catch (err) {
        dispatch({ type: 'ERROR', error: err?.message ?? 'Upload failed' });
        return;
      }
    }

    const isLast = qIdx >= questions.length - 1;
    if (isLast) {
      recorder.teardown();
      dispatch({ type: 'DONE' });
    } else {
      dispatch({ type: 'NEXT' });
      await recorder.start();
    }
  }, [recorder, interviewId, questions]);

  const finish = useCallback(async () => {
    if (stateRef.current.status !== 'RECORDING') return;
    await next();
  }, [next]);

  return { state, start, next, finish };
}
