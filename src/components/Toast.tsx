import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

let toastCount = 0;
let listeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

export const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  const id = `${Date.now()}-${toastCount++}`;
  toasts = [...toasts, { id, message, type }];
  listeners.forEach(l => l(toasts));
  
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(l => l(toasts));
  }, 3000);
};

export default function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {currentToasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl min-w-[300px] border ${
              toast.type === 'success' 
                ? 'bg-white border-green-100 text-green-800' 
                : 'bg-white border-red-100 text-red-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="font-bold text-sm">{toast.message}</span>
            <button 
              onClick={() => {
                toasts = toasts.filter(t => t.id !== toast.id);
                listeners.forEach(l => l(toasts));
              }}
              className="ml-auto p-1 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
