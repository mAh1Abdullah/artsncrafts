import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#8B4513] text-white border border-[#A0522D] shadow-2xl rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-bottom-5 transition-all"
        >
          {toast.type === 'success' && (
            <div className="w-5 h-5 rounded-full bg-white text-[#8B4513] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              ✓
            </div>
          )}
          {toast.type === 'info' && (
            <div className="w-5 h-5 rounded-full bg-amber-200 text-[#8B4513] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              i
            </div>
          )}
          {toast.type === 'warning' && (
            <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-950 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              !
            </div>
          )}

          <div className="flex-1 pr-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-200">{toast.title}</p>
            <p className="text-xs text-amber-50 mt-0.5 leading-snug">{toast.message}</p>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-amber-200/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

