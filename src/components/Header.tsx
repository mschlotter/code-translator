'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
}

export const Header: React.FC<HeaderProps> = ({ theme }) => {
  const titleFrom = theme === 'dark' ? 'from-white' : 'from-[var(--text-primary)]';
  const titleTo = theme === 'dark' ? 'to-slate-400' : 'to-[var(--text-secondary)]';

  return (
    <header className="flex flex-col items-center text-center space-y-3">
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
        <Sparkles size={12} />
        <span>AI Powered Translation</span>
      </div>
      <h1 className={`text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r ${titleFrom} ${titleTo} bg-clip-text text-transparent`}>
        Code Translator
      </h1>
      <p className="text-[var(--text-secondary)] max-w-2xl text-sm md:text-base">
        Translate code between 26 languages using local LLMs.
      </p>
    </header>
  );
};
