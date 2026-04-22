import { useState, useEffect, useRef, useCallback } from 'react';
import { request, ApiError } from '../http/client';

type PollingState = 'idle' | 'pending' | 'success' | 'failed' | 'timeout';

interface TaskResult {
  status: string;
  result?: unknown;
}

interface UseTaskPollingOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onDone?: (result: unknown) => void;
  onFail?: (err: ApiError) => void;
}

interface UseTaskPollingReturn {
  state: PollingState;
  result?: unknown;
  error?: ApiError;
}

const TERMINAL_STATUSES = ['SUCCESS', 'FAILURE', 'REVOKED'];

export function useTaskPolling(
  taskId: string | null,
  options: UseTaskPollingOptions = {}
): UseTaskPollingReturn {
  const { intervalMs = 2000, timeoutMs = 60000, onDone, onFail } = options;

  const [state, setState] = useState<PollingState>(taskId ? 'pending' : 'idle');
  const [result, setResult] = useState<unknown>();
  const [error, setError] = useState<ApiError>();

  const startedAt = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (!taskId) {
      setState('idle');
      return;
    }

    setState('pending');
    startedAt.current = Date.now();

    const poll = async () => {
      if (!mounted.current) return;

      if (Date.now() - (startedAt.current ?? 0) > timeoutMs) {
        stop();
        setState('timeout');
        return;
      }

      try {
        const data = await request<TaskResult>({ method: 'GET', url: `/interviews/tasks/${taskId}/` });
        if (!mounted.current) return;

        if (data.status === 'SUCCESS') {
          stop();
          setResult(data.result);
          setState('success');
          onDone?.(data.result);
        } else if (TERMINAL_STATUSES.includes(data.status) && data.status !== 'SUCCESS') {
          stop();
          setState('failed');
        }
        // PENDING/STARTED → keep polling
      } catch (err) {
        if (!mounted.current) return;
        const apiErr = err instanceof ApiError ? err : new ApiError({ status: 0, code: 'UNKNOWN', message: String(err), fields: null });
        stop();
        setError(apiErr);
        setState('failed');
        onFail?.(apiErr);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, intervalMs);

    return stop;
  }, [taskId, intervalMs, timeoutMs, onDone, onFail, stop]);

  return { state, result, error };
}
