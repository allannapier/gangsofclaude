import { useEffect } from 'react';
import { useGameStore } from '../store';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export function ToastContainer() {
  const toasts = useGameStore(state => state.toasts);
  const removeToast = useGameStore(state => state.removeToast);

  return (
    <div className="fixed top-16 right-4 z-[60] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
  };

  const colors = {
    success: 'border-green-800/60 bg-green-950/90',
    error: 'border-red-800/60 bg-red-950/90',
    warning: 'border-amber-800/60 bg-amber-950/90',
    info: 'border-blue-800/60 bg-blue-950/90',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm shadow-lg
        ${colors[toast.type]}
        animate-[slideIn_0.3s_ease-out]`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      {icons[toast.type]}
      <p className="text-sm text-zinc-200 flex-1">{toast.message}</p>
      <button onClick={onDismiss} className="text-zinc-500 hover:text-zinc-300 flex-shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
