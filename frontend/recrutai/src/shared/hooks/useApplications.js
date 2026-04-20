import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobSeekerApplications, applyForJob, acceptCandidate, rejectCandidate } from '../api/applications';
import { listAllOffers } from '../api/jobOffers';

export const APPLICATIONS_KEY = ['applications'];
export const ALL_OFFERS_KEY   = ['allOffers'];

export function useJobSeekerApplications() {
  return useQuery({ queryKey: APPLICATIONS_KEY, queryFn: getJobSeekerApplications });
}

export function useAllJobOffers() {
  return useQuery({ queryKey: ALL_OFFERS_KEY, queryFn: listAllOffers });
}

export function useApplyForJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: applyForJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: APPLICATIONS_KEY }),
  });
}

export function useAcceptCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acceptCandidate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
}

export function useRejectCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectCandidate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
}
