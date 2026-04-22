import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInterviewEvaluation, overrideDecision } from '../api/evaluations';

const evalKey = (interviewId) => ['evaluation', interviewId];

export function useInterviewEvaluation(interviewId) {
  return useQuery({
    queryKey: evalKey(interviewId),
    queryFn: async () => {
      try {
        return await getInterviewEvaluation(interviewId);
      } catch (err) {
        if (err?.status === 202) return null;
        throw err;
      }
    },
    enabled: !!interviewId,
    refetchInterval: (data) => {
      return data?.state?.data === null ? 5000 : false;
    },
  });
}

export function useOverrideDecision(interviewId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => overrideDecision(interviewId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: evalKey(interviewId) }),
  });
}
