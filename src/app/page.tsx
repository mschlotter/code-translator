'use client';

import { useEffect, useState, useCallback } from 'react';
import { Settings, Check, Copy } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Header,
  EditorPanel,
  TranslationControls,
  SettingsModal,
  ErrorToast,
} from '@/components/translator';

export default function CodeTranslator() {
  const {
    mounted, serverUrl, setServerUrl,
    selectedModel, setSelectedModel,
    availableModels, isFetchingModels, fetchModels,
    modelsError,
  } = useSettings();

  const {
    sourceCode, setSourceCode,
    targetCode, setTargetCode, isLoading,
    error, setError,
    lastTranslatedLang, setLastTranslatedLang,
    translate,
  } = useTranslation();

  const [sourceLang, setSourceLang] = useState('Python');
  const [targetLang, setTargetLang] = useState('C++');
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = useCallback(() => {
    translate(sourceLang, targetLang, sourceCode, selectedModel, serverUrl);
  }, [translate, sourceLang, targetLang, sourceCode, selectedModel, serverUrl]);

  const handleSwap = useCallback(() => {
    setSourceCode(targetCode);
    setTargetCode(sourceCode);
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setLastTranslatedLang(sourceLang);
  }, [targetCode, sourceCode, targetLang, sourceLang, setSourceCode, setTargetCode]);

  const handleCopy = useCallback(() => {
    if (!targetCode) return;
    navigator.clipboard.writeText(targetCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [targetCode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading && sourceCode) handleTranslate();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isLoading, sourceCode, handleTranslate]);

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

      <Header />

      <div className="max-w-[1600px] mx-auto space-y-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          <EditorPanel
            label="Source"
            lang={sourceLang}
            onLangChange={setSourceLang}
            code={sourceCode}
            onCodeChange={setSourceCode}
          />

          <TranslationControls
            isLoading={isLoading}
            hasSource={!!sourceCode}
            onTranslate={handleTranslate}
            onSwap={handleSwap}
          />

          <EditorPanel
            label="Result"
            lang={targetLang}
            onLangChange={setTargetLang}
            code={targetCode}
            onCodeChange={() => {}}
            readOnly
            lastTranslatedLang={lastTranslatedLang}
            copyButton={
              targetCode && (
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )
            }
          />
        </div>
      </div>

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        serverUrl={serverUrl}
        onServerUrlChange={setServerUrl}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={availableModels}
        isFetchingModels={isFetchingModels}
        onRefreshModels={() => fetchModels(selectedModel)}
        modelsError={modelsError}
      />

      {error && <ErrorToast error={error} onClose={() => setError(null)} />}
    </main>
  );
}
