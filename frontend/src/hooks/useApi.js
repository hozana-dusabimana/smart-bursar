import { useState, useCallback } from 'react';

export function useApi() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const execute = useCallback(async (apiFn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn();
      setData(result.data);
      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, setData };
}
