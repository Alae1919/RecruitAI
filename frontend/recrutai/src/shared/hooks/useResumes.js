import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listMyResumes, createResume, patchResume, deleteResume } from '../api/resumes';

const RESUMES_KEY = ['resumes'];

const TERMINAL = ['READY', 'FAILED'];

export function useMyResumes() {
  return useQuery({
    queryKey: RESUMES_KEY,
    queryFn: listMyResumes,
    refetchInterval: (data) => {
      const list = Array.isArray(data?.state?.data) ? data.state.data : [];
      return list.some(r => !TERMINAL.includes(r.parsing_status)) ? 3000 : false;
    },
  });
}

export function useUploadResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, label, makeDefault }) => createResume(file, label, makeDefault),
    onSuccess: () => qc.invalidateQueries({ queryKey: RESUMES_KEY }),
  });
}

export function useSetDefaultResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => patchResume(id, { is_default: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: RESUMES_KEY }),
  });
}

export function usePatchResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => patchResume(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: RESUMES_KEY }),
  });
}

export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteResume,
    onSuccess: () => qc.invalidateQueries({ queryKey: RESUMES_KEY }),
  });
}
