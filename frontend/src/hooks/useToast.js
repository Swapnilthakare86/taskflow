// Purpose: Encapsulates reusable React stateful logic.
import { useState, useCallback, useRef } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  // Display toast notification with optional auto-dismiss
  const showToast = useCallback((msg, type = 'success', duration = 3200) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type });
    // Auto-hide toast after duration
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  // Manually hide toast and clear timer
  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}


