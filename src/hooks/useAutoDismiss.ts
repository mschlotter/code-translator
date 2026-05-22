import { useEffect } from 'react';
import { TIMEOUT } from '@/config/constants';

export function useAutoDismiss(error: string | null, dismiss: () => void) {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(dismiss, TIMEOUT.ERROR_AUTO_DISMISS);
      return () => clearTimeout(timer);
    }
  }, [error, dismiss]);
}
