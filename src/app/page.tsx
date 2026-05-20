"use client";

import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '@/config/languages';
import { ArrowRightLeft, Code2, Sparkles, Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeTranslator() {
  const [mounted, setMounted] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [sourceLang, setSourceLang] = useState(SUPPORTED_LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState(SUPPORTED_LANGUAGES[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleTranslate = async () => {
    if (!sourceCode) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          code: sourceCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Translation failed');
      }

      const data = await response.json();
      setTargetCode(data.translatedCode);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20">
            <Sparkles size={14} />
            <span>AI Powered Translation</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Code Translator
          </h1>
          <p className="text-slate-400 max-w-2xl">
            Seamlessly translate your code between {SUPPORTED_LANGUAGES.length} different programming languages using local LLMs.
          </p>
        </header>

        {/* Translator UI */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          {/* Source Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Code2 size={16} /> Source
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div className="relative group">
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                placeholder="Paste your code here..."
                className="w-full h-[400px] md:h-[600px] p-4 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm resize-none shadow-2xl"
              />
            </div>
          </div>

          {/* Action Section */}
          <div className="flex lg:flex-col justify-center items-center gap-4 py-4 lg:py-0">
            <button
              onClick={swapLanguages}
              className="p-3 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
              title="Swap Languages"
            >
              <ArrowRightLeft size={20} />
            </button>
            <button
              onClick={handleTranslate}
              disabled={isLoading || !sourceCode}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {isLoading ? 'Translating...' : 'Translate'}
            </button>
          </div>

          {/* Target Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Code2 size={16} /> Result
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div className="relative h-[400px] md:h-[600px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-[#1e1e1e]">
              {mounted && targetCode ? (
                <SyntaxHighlighter
                  language={targetLang.toLowerCase()}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '1rem', height: '100%', fontSize: '0.875rem' }}
                >
                  {targetCode}
                </SyntaxHighlighter>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-600 font-mono text-sm italic">
                  {targetCode ? 'Loading highlighter...' : 'Translated code will appear here...'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="fixed bottom-8 right-8 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

