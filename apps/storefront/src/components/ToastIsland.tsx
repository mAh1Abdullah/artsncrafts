import { useEffect, useState } from 'react';
import { CheckCircle2, Info, X, AlertCircle } from 'lucide-react';
import {
  dismissToast,
  getStoreSnapshot,
  subscribeStore,
  type ToastItem,
} from '../lib/store';

export function ToastIsland() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const sync = () => setToasts(getStoreSnapshot().toasts);
    sync();
    return subscribeStore(sync);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-md text-sm ${
            toast.tone === 'success'
              ? 'bg-[#FAF9F6] border-[#4D6B59] text-[#221E1B]'
              : toast.tone === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-[#FAF9F6] border-[#D8CFC3] text-[#221E1B]'
          }`}
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[#4D6B59] shrink-0 mt-0.5" />
          ) : toast.tone === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 text-[#B84A27] shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="text-[#6E6359] hover:text-[#221E1B] p-0.5"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
