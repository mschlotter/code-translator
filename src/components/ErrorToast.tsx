'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ErrorToastProps {
  error: string;
  onClose: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose }) => (
  <div className="fixed bottom-8 right-8 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg shadow-md backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 max-w-sm">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="font-bold">Error:</span> {error}
      </div>
      <button onClick={onClose} className="shrink-0 p-1 hover:bg-red-500/20 rounded transition-colors">
        <X size={14} />
      </button>
    </div>
  </div>
);
