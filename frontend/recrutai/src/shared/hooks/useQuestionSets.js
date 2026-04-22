import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listQuestionSets, createQuestionSet, patchQuestionSet, deleteQuestionSet,
  regenerateQuestionSet, createQuestion, patchQuestion, deleteQuestion,
} from '../api/questionSets';

const qsKey = (offerId) => ['questionSets', offerId];

const PENDING_STATUSES = ['draft'];

export function useQuestionSets(offerId) {
  return useQuery({
    queryKey: qsKey(offerId),
    queryFn: () => listQuestionSets(offerId),
    enabled: !!offerId,
    refetchInterval: (data) => {
      const list = Array.isArray(data?.state?.data) ? data.state.data : [];
      const hasPending = list.some(
        qs => PENDING_STATUSES.includes(qs.status) && qs.task_id && qs.questions?.length === 0
      );
      return hasPending ? 3000 : false;
    },
  });
}

export function useCreateQuestionSet(offerId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createQuestionSet(offerId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qsKey(offerId) }),
  });
}

export function usePatchQuestionSet(offerId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => patchQuestionSet(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qsKey(offerId) }),
  });
}

export function useDeleteQuestionSet(offerId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestionSet,
    onSuccess: () => qc.invalidateQueries({ queryKey: qsKey(offerId) }),
  });
}

export function useRegenerateQuestionSet(offerId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => regenerateQuestionSet(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qsKey(offerId) }),
  });
}

export function useCreateQuestion(offerId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionSetId, data }) => createQuestion(questionSetId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qsKey(offerId) }),
  });
}

export function usePatchQuestion(offerId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => patchQuestion(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qsKey(offerId) }),
  });
}

export function useDeleteQuestion(offerId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => qc.invalidateQueries({ queryKey: qsKey(offerId) }),
  });
}
