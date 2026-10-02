import { useQuery } from '@tanstack/react-query';
import { getPipelineSummary } from '../api/applications';

export const PIPELINE_KEY = ['pipelineSummary'];

/** Sidebar counts for recruiters: offers, candidates and candidates per stage. */
export function usePipelineSummary() {
  return useQuery({
    queryKey: PIPELINE_KEY,
    queryFn: getPipelineSummary,
    staleTime: 30_000,
  });
}
