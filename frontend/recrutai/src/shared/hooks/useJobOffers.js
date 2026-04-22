import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listOffers, createOffer, editOffer, deleteOffer, listCandidates, generateJobDescription } from '../api/jobOffers';

export const JOB_OFFERS_KEY = ['jobOffers'];

export function useJobOffers(params = {}) {
  return useQuery({
    queryKey: [...JOB_OFFERS_KEY, params],
    queryFn: () => listOffers(params),
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOffer,
    onSuccess: () => qc.invalidateQueries({ queryKey: JOB_OFFERS_KEY }),
  });
}

export function useEditOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => editOffer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: JOB_OFFERS_KEY }),
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOffer,
    onSuccess: () => qc.invalidateQueries({ queryKey: JOB_OFFERS_KEY }),
  });
}

export function useCandidates(jobOfferId) {
  return useQuery({
    queryKey: ['candidates', jobOfferId],
    queryFn: () => listCandidates(jobOfferId),
    enabled: !!jobOfferId,
  });
}

export function useGenerateJobDescription() {
  return useMutation({ mutationFn: generateJobDescription });
}
