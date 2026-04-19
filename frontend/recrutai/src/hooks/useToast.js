import { useToastContext } from '../context/ToastContext';

export function useToast() {
  const { toast, dismiss } = useToastContext();
  return { toast, dismiss };
}
