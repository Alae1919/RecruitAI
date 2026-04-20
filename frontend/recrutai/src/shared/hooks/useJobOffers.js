import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listOffers, createOffer, editOffer, deleteOffer, listCandidates } from '../api/jobOffers';

export const JOB_OFFERS_KEY = ['jobOffers'];

export function useJobOffers() {
  return useQuery({ queryKey: JOB_OFFERS_KEY, queryFn: listOffers });
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
