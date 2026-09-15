type ToastType = 'success' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener([...items]));
}

function push(type: ToastType, message: string, durationMs = 3200) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  items = [...items, { id, type, message }];
  emit();
  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    emit();
  }, durationMs);
}

export const toast = {
  success(message: string) {
    push('success', message);
  },
  error(message: string) {
    push('error', message);
  },
};

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener([...items]);
  return () => {
    listeners.delete(listener);
  };
}
