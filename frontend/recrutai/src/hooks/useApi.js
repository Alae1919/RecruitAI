import { useCallback, useEffect, useRef, useState } from 'react';

export function useApi(apiFn, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const cancelRef             = useRef(false);

  const execute = useCallback(async () => {
    cancelRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn();
      if (!cancelRef.current) setData(result.data ?? result);
    } catch (err) {
      if (!cancelRef.current) setError(err?.response?.data?.detail || err?.message || 'Something went wrong');
    } finally {
      if (!cancelRef.current) setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    execute();
    return () => { cancelRef.current = true; };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
