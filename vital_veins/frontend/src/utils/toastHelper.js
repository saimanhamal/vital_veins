import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export const showToast = (message, type = 'success', duration = 4000) => {
  toast.custom((t) => (
    <div className={`flex items-center justify-between gap-3 p-4 rounded-lg text-white ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
    }`}>
      <span>{message}</span>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="p-1 hover:bg-white/20 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  ), { duration });
};

export const showSuccessToast = (message, duration = 4000) => showToast(message, 'success', duration);
export const showErrorToast = (message, duration = 4000) => showToast(message, 'error', duration);
export const showInfoToast = (message, duration = 4000) => showToast(message, 'info', duration);
