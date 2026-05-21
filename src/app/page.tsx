"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SUPPORTED_LANGUAGES } from '@/config/languages';
import { config } from '@/config/server';
import { ArrowRightLeft, Code2, Sparkles, Loader2, Settings, X } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { go } from '@codemirror/lang-go';
import { rust } from '@codemirror/lang-rust';
import { php } from '@codemirror/lang-php';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { StreamLanguage } from '@codemirror/language';
import { fortran } from '@codemirror/legacy-modes/mode/fortran';
import { julia } from '@codemirror/legacy-modes/mode/julia';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { perl } from '@codemirror/legacy-modes/mode/perl';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { octave } from '@codemirror/legacy-modes/mode/octave';
import { cobol } from '@codemirror/legacy-modes/mode/cobol';
import { eiffel } from '@codemirror/legacy-modes/mode/eiffel';
import { erlang } from '@codemirror/legacy-modes/mode/erlang';
import { mathematica } from '@codemirror/legacy-modes/mode/mathematica';
import { pascal } from '@codemirror/legacy-modes/mode/pascal';
import { r } from '@codemirror/legacy-modes/mode/r';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { swift } from '@codemirror/legacy-modes/mode/swift';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { tcl } from '@codemirror/legacy-modes/mode/tcl';
import { powerShell } from '@codemirror/legacy-modes/mode/powershell';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const editorTheme = EditorView.theme({
  "&": { height: "100%", overflow: "hidden" },
  ".cm-scroller": { overflow: "auto" },
});

function getLanguageExtensions(lang: string): Extension[] {
  const ext = getLanguageExtension(lang);
  return ext ? [ext] : [];
}

function getLanguageExtension(lang: string): Extension | null {
  switch (lang) {
    case "Python": return python();
    case "Javascript":
    case "Typescript": return javascript();
    case "C":
    case "C++": return cpp();
    case "Java": return java();
    case "Go": return go();
    case "Rust": return rust();
    case "PHP": return php();
    case "Fortran": return StreamLanguage.define(fortran);
    case "Julia": return StreamLanguage.define(julia);
    case "Lua": return StreamLanguage.define(lua);
    case "Perl": return StreamLanguage.define(perl);
    case "Ruby": return StreamLanguage.define(ruby);
    case "Matlab": return StreamLanguage.define(octave);
    case "COBOL": return StreamLanguage.define(cobol);
    case "Eiffel": return StreamLanguage.define(eiffel);
    case "Erlang": return StreamLanguage.define(erlang);
    case "Mathematica": return StreamLanguage.define(mathematica);
    case "Pascal": return StreamLanguage.define(pascal);
    case "R": return StreamLanguage.define(r);
    case "Shell": return StreamLanguage.define(shell);
    case "Powershell": return StreamLanguage.define(powerShell);
    case "Swift": return StreamLanguage.define(swift);
    case "TeX": return StreamLanguage.define(stex);
    case "TCL": return StreamLanguage.define(tcl);
    default: return null;
  }
}

export default function CodeTranslator() {
  const [mounted, setMounted] = useState(false);
  const [sourceCode, setSourceCode] = useState('print("Hello World")');
  const [targetCode, setTargetCode] = useState('');
  const [sourceLang, setSourceLang] = useState('Python');
  const [targetLang, setTargetLang] = useState(SUPPORTED_LANGUAGES[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTranslatedLang, setLastTranslatedLang] = useState(SUPPORTED_LANGUAGES[1]);
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(config.llamaServerUrl);
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const serverUrlRef = useRef(serverUrl);

  useEffect(() => {
    serverUrlRef.current = serverUrl;
  }, [serverUrl]);

  const fetchModels = useCallback(async (currentSelectedModel: string) => {
    setIsFetchingModels(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const url = `${serverUrlRef.current.replace(/\/$/, '')}/v1/models`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      const models = (data.data as Record<string, unknown>[]).map((m) => String(m.id));
      setAvailableModels(models);
      if (models.length > 0 && !currentSelectedModel) setSelectedModel(models[0]);
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name !== 'AbortError') {
        setError('Could not fetch models from server.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsFetchingModels(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const savedModel = localStorage.getItem('translator_selected_model');
    const savedUrl = localStorage.getItem('translator_server_url');
    const model = savedModel || config.defaultModel || '';
    const url = savedUrl || config.llamaServerUrl;
    setSelectedModel(model);
    setServerUrl(url);
    fetchModels(model);
  }, [mounted, fetchModels]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('translator_server_url', serverUrl);
    localStorage.setItem('translator_selected_model', selectedModel);
  }, [mounted, serverUrl, selectedModel]);

  const handleTranslate = useCallback(async () => {
    if (!sourceCode) return;
    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          code: sourceCode,
          model: selectedModel,
          serverUrl,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Translation failed');
      }
      const data = await response.json();
      setTargetCode(data.translatedCode);
      setLastTranslatedLang(targetLang);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e.name !== 'AbortError') {
        setError(e.message || 'An unexpected error occurred');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [sourceCode, sourceLang, targetLang, selectedModel, serverUrl]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-2 md:p-4 font-sans relative">
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 p-2 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white z-40"
        title="Settings"
      >
        <Settings size={20} />
      </button>

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
                  placeholder={config.llamaServerUrl}
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
                    {availableModels.length > 0 ? availableModels.map(m => <option key={m} value={m}>{m}</option>) : <option value="">No models found</option>}
                  </select>
                  <button
                    onClick={() => fetchModels(selectedModel)}
                    disabled={isFetchingModels}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-lg transition-colors"
                  >
                    {isFetchingModels ? <Loader2 className="animate-spin" size={18} /> : 'Refresh'}
                  </button>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all">
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto space-y-6 pt-4">
        <header className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
            <Sparkles size={12} />
            <span>AI Powered Translation</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Code Translator
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm md:text-base">
            Translate code between {SUPPORTED_LANGUAGES.length} languages using local LLMs.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between px-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2"><Code2 size={16} /> Source</label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
            <div className="relative h-[400px] md:h-[600px] rounded-xl border border-slate-800 shadow-2xl bg-[#1e1e1e] overflow-hidden">
              <div className="absolute inset-0">
                <CodeMirror
                  value={sourceCode}
                  theme="dark"
                  extensions={[editorTheme, ...getLanguageExtensions(sourceLang)]}
                  onChange={setSourceCode}
                  className="text-sm font-mono h-full"
                  style={{ fontFamily: MONO_FONT }}
                />
              </div>
            </div>
          </div>

          <div className="flex lg:flex-col justify-center items-center gap-4 py-4 lg:py-0">
            <button
              onClick={() => { setSourceCode(targetCode); setTargetCode(sourceCode); setSourceLang(targetLang); setTargetLang(sourceLang); }}
              className="p-3 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
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

          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between px-2">
              <label className="text-sm font-medium text-slate-400 flex items-center gap-2"><Code2 size={16} /> Result</label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
            <div className="relative h-[400px] md:h-[600px] overflow-hidden rounded-xl border border-slate-800 shadow-2xl bg-[#1e1e1e]">
              <div className="absolute inset-0">
                {mounted && targetCode ? (
                <CodeMirror
                  value={targetCode}
                  theme="dark"
                  extensions={[editorTheme, ...getLanguageExtensions(lastTranslatedLang)]}
                  readOnly
                  className="text-sm font-mono h-full"
                  style={{ fontFamily: MONO_FONT }}
                />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600 font-mono text-sm italic">
                    {targetCode ? 'Loading...' : 'Translated code will appear here...'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="fixed bottom-8 right-8 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2"><span className="font-bold">Error:</span> {error}</div>
          </div>
        )}
      </div>
    </main>
  );
}
