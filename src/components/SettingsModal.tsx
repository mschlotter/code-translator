'use client';

import React from 'react';
import { Loader2, X } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: string[];
  isFetchingModels: boolean;
  onRefreshModels: () => void;
  modelsError: string | null;
  theme: 'dark' | 'light';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  serverUrl,
  onServerUrlChange,
  selectedModel,
  onModelChange,
  availableModels,
  isFetchingModels,
  onRefreshModels,
  modelsError,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] w-full max-w-md rounded-2xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Server Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-[var(--text-secondary)]">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Server URL</label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => onServerUrlChange(e.target.value)}
              placeholder="http://localhost:8080"
              className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-[var(--text-primary)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Model</label>
            {modelsError && (
              <p className="text-xs text-red-400">{modelsError}</p>
            )}
            <div className="flex gap-2">
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={availableModels.length === 0}
                className="flex-1 p-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 text-[var(--text-primary)]"
              >
                {availableModels.length > 0 ? (
                  availableModels.map(m => <option key={m} value={m}>{m}</option>)
                ) : (
                  <option value="">No models found</option>
                )}
              </select>
              <button
                onClick={onRefreshModels}
                disabled={isFetchingModels}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[var(--bg-panel)] rounded-lg transition-colors text-white"
              >
                {isFetchingModels ? <Loader2 className="animate-spin" size={18} /> : 'Refresh'}
              </button>
            </div>
          </div>
          <button onClick={onClose} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all">
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
