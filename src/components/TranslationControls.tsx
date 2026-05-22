'use client';

import React from 'react';
import { ArrowRightLeft, Sparkles, Loader2 } from 'lucide-react';

interface TranslationControlsProps {
  isLoading: boolean;
  hasSource: boolean;
  onTranslate: () => void;
  onSwap: () => void;
}

export const TranslationControls: React.FC<TranslationControlsProps> = ({
  isLoading,
  hasSource,
  onTranslate,
  onSwap,
}) => (
  <div className="flex lg:flex-col justify-center items-center gap-4 py-4 lg:py-0">
    <button
      onClick={onSwap}
      className="p-3 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    >
      <ArrowRightLeft size={20} />
    </button>
    <button
      onClick={onTranslate}
      disabled={isLoading || !hasSource}
      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[var(--bg-panel)] disabled:text-[var(--text-secondary)] text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20"
    >
      {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
      {isLoading ? 'Translating...' : 'Translate'}
    </button>
  </div>
);
