import { useEffect, useState } from 'react';
import { TOAST_DISMISS_MS } from '../../constants';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

type Listener = (toasts: Toast[]) => void;

let nextId = 1;
let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(toasts);
}

function push(toast: Omit<Toast, 'id'>): number {
  const id = nextId++;
  toasts = [...toasts, { id, ...toast }];
  emit();
  setTimeout(() => dismiss(id), TOAST_DISMISS_MS);
  return id;
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success(title: string, body?: string) {
    return push({ kind: 'success', title, body });
  },
  error(title: string, body?: string) {
    return push({ kind: 'error', title, body });
  },
  info(title: string, body?: string) {
    return push({ kind: 'info', title, body });
  },
};

/**
 * React hook returning the current toast queue. Used by `<ToastViewport />`.
 */
export function useToasts(): Toast[] {
  const [snapshot, setSnapshot] = useState<Toast[]>(toasts);
  useEffect(() => {
    const listener: Listener = (next) => setSnapshot(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return snapshot;
}
