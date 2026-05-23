'use client';

import { useEffect, useState, useCallback } from 'react';
import { Settings, Sun, Moon, Check, Copy, MessageCircle } from 'lucide-react';
import { TIMEOUT } from '@/config/constants';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { useChat } from '@/hooks/useChat';
import { Header } from '@/components/Header';
import { EditorPanel } from '@/components/EditorPanel';
import { TranslationControls } from '@/components/TranslationControls';
import { SettingsModal } from '@/components/SettingsModal';
import { ErrorToast } from '@/components/ErrorToast';
import { ChatPanel } from '@/components/ChatPanel';
import { ReasoningPanel } from '@/components/ReasoningPanel';

const THEME_KEY = 'translator_theme';

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
    reasoningText,
    error, setError,
    lastTranslatedLang, setLastTranslatedLang,
    translate,
  } = useTranslation();

  const [sourceLang, setSourceLang] = useState('Python');
  const [targetLang, setTargetLang] = useState('C++');
  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const { messages, isLoading: chatLoading, isStreaming: chatStreaming, sendMessage: sendChatMessage } = useChat();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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
      setTimeout(() => setCopied(false), TIMEOUT.COPY_TOAST_DURATION);
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
    <main className="min-h-screen p-2 md:p-4 font-sans relative" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-4 right-20 p-2 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] z-40"
        title="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 p-2 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] z-40"
        title="Settings"
      >
        <Settings size={20} />
      </button>
      <button
        onClick={() => setShowChat(!showChat)}
        className={`fixed top-4 right-36 p-2 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors z-40 ${
          showChat
            ? 'text-indigo-400 border-indigo-500/30'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        title="Ask about code"
      >
        <MessageCircle size={20} />
      </button>

      <Header theme={theme} />

      <div className="max-w-[1600px] mx-auto space-y-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          <EditorPanel
            label="Source"
            lang={sourceLang}
            onLangChange={setSourceLang}
            code={sourceCode}
            onCodeChange={setSourceCode}
            theme={theme}
          />

          <TranslationControls
            isLoading={isLoading}
            hasSource={!!sourceCode}
            onTranslate={handleTranslate}
            onSwap={handleSwap}
          />

          <div className="flex flex-col">
            <EditorPanel
              label="Result"
              lang={targetLang}
              onLangChange={setTargetLang}
              code={targetCode}
              onCodeChange={() => {}}
              readOnly
              lastTranslatedLang={lastTranslatedLang}
              theme={theme}
              isStreaming={isLoading}
              copyButton={
                targetCode && (
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )
              }
            />

            <ReasoningPanel content={reasoningText} isStreaming={isLoading} />
          </div>
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
        theme={theme}
      />

      {error && <ErrorToast error={error} onClose={() => setError(null)} />}

      <ChatPanel
        open={showChat}
        onClose={() => setShowChat(false)}
        messages={messages}
        isLoading={chatLoading}
        isStreaming={chatStreaming}
        onSend={(question) => sendChatMessage(question, sourceCode, targetCode, sourceLang, targetLang, selectedModel, serverUrl)}
      />
    </main>
  );
}
