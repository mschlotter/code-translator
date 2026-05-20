"use client";

import React, { useState, useEffect, useRef } from 'react';
import { SUPPORTED_LANGUAGES } from '@/config/languages';
import { ArrowRightLeft, Code2, Sparkles, Loader2, Settings, X } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const LANGUAGE_MAP: Record<string, string> = {
  "Python": "python",
  "C": "cpp",
  "C++": "cpp",
  "Java": "java",
  "Javascript": "javascript",
  "Typescript": "typescript",
  "Matlab": "matlab",
  "Lua": "lua",
  "Scala": "scala",
  "Julia": "julia",
  "Go": "go",
  "C#": "csharp",
  "Perl": "perl",
  "PHP": "php",
  "Ruby": "ruby",
  "Rust": "rust",
  "Fortran": "fortran",
};

export default function CodeTranslator() {
  const [mounted, setMounted] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [sourceLang, setSourceLang] = useState(SUPPORTED_LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState(SUPPORTED_LANGUAGES[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTranslatedLang, setLastTranslatedLang] = useState(SUPPORTED_LANGUAGES[1]);

  // Settings state

  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:8080');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedUrl = localStorage.getItem('translator_server_url');
    const savedModel = localStorage.getItem('translator_selected_model');
    if (savedUrl) setServerUrl(savedUrl);
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('translator_server_url', serverUrl);
      localStorage.setItem('translator_selected_model', selectedModel);
    }
  }, [mounted, serverUrl, selectedModel]);

  const fetchModels = async () => {
    setIsFetchingModels(true);
    try {
      const url = serverUrl.endsWith('/v1/models') ? serverUrl : `${serverUrl.replace(/\/$/, '')}/v1/models`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      const models = data.data.map((m: any) => m.id);
      setAvailableModels(models);
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0]);
      }
    } catch (err: any) {
      console.error('Error fetching models:', err);
      setError('Could not fetch models from server. Please check the URL.');
    } finally {
      setIsFetchingModels(false);
    }
  };

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
          model: selectedModel,
          serverUrl: serverUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Translation failed');
      }

      const data = await response.json();
      setTargetCode(data.translatedCode);
      setLastTranslatedLang(targetLang);
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

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-2 md:p-4 font-sans relative">
      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 p-2 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white z-40"
        title="Settings"
      >
        <Settings size={20} />
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold">Server Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Server URL</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://localhost:8080"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Model</label>
                <div className="flex gap-2">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={availableModels.length === 0}
                    className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                  >
                    {availableModels.length > 0 ? (
                      availableModels.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))
                    ) : (
                      <option value="">No models found</option>
                    )}
                  </select>
                  <button
                    onClick={fetchModels}
                    disabled={isFetchingModels}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-lg transition-colors"
                    title="Refresh Models"
                  >
                    {isFetchingModels ? <Loader2 className="animate-spin" size={18} /> : 'Refresh'}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto space-y-6 pt-4">
        {/* Header */}
        <header className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
            <Sparkles size={12} />
            <span>AI Powered Translation</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Code Translator
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm md:text-base">
            Seamlessly translate your code between {SUPPORTED_LANGUAGES.length} different programming languages using local LLMs.
          </p>
        </header>

        {/* Translator UI */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          {/* Source Section */}
          <div className="flex flex-col gap-3 min-w-0">
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
            <div className="relative h-[400px] md:h-[600px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-[#1e1e1e]">
              <Editor
                height="100%"
                defaultLanguage={LANGUAGE_MAP[sourceLang] || 'plaintext'}
                language={LANGUAGE_MAP[sourceLang] || 'plaintext'}
                theme="vs-dark"
                value={sourceCode}
                onChange={(value) => setSourceCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: MONO_FONT,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                }}
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
          <div className="flex flex-col gap-3 min-w-0">
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
                <Editor
                  height="100%"
                  defaultLanguage={LANGUAGE_MAP[lastTranslatedLang] || 'plaintext'}
                  language={LANGUAGE_MAP[lastTranslatedLang] || 'plaintext'}
                  theme="vs-dark"
                  value={targetCode}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: MONO_FONT,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                  }}
                />
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
// (End of file)


