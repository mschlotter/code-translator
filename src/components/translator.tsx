'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SUPPORTED_LANGUAGES } from '@/config/languages';
import { ArrowRightLeft, Code2, Sparkles, Loader2, X, MessageCircle, Send } from 'lucide-react';
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

const lightEditorTheme = EditorView.theme({
  "&": { height: "100%", overflow: "hidden" },
  ".cm-scroller": { overflow: "auto" },
  ".cm-content": { color: "#24292f" },
  ".cm-gutters": { background: "#f6f8fa", color: "#1b1f24", border: "none" },
  ".cm-activeLineGutter": { background: "#f6f8fa" },
  ".cm-selectionBackground": { background: "#0000001a !important" },
  ".cm-cursor": { borderLeftColor: "#24292f" },
  ".cm-lineNumbers": { color: "#1b1f24" },
  ".cm-special": { color: "#6f42c1" },
});

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

export function getLanguageExtensions(lang: string): Extension[] {
  const ext = getLanguageExtension(lang);
  return ext ? [ext] : [];
}

// --- LanguageSelector ---

interface LanguageSelectorProps {
  value: string;
  onChange: (lang: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-[var(--bg-panel)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
  >
    {SUPPORTED_LANGUAGES.map(lang => (
      <option key={lang} value={lang}>{lang}</option>
    ))}
  </select>
);

// --- EditorPanel ---

interface EditorPanelProps {
  label: string;
  lang: string;
  onLangChange: (lang: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
  readOnly?: boolean;
  lastTranslatedLang?: string;
  copyButton?: React.ReactNode;
  theme?: 'dark' | 'light';
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  label,
  lang,
  onLangChange,
  code,
  onCodeChange,
  readOnly,
  lastTranslatedLang,
  copyButton,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  return (
  <div className="flex flex-col gap-3 min-w-0">
    <div className="flex items-center justify-between px-2">
      <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
        <Code2 size={16} /> {label}
      </label>
      <div className="flex items-center gap-2">
        {copyButton}
        <LanguageSelector value={lang} onChange={onLangChange} />
      </div>
    </div>
    <div className={`relative h-[400px] md:h-[600px] overflow-hidden rounded-xl border ${isDark ? 'shadow-2xl border-slate-800 bg-[#1e1e1e]' : 'shadow-lg border-[var(--border-color)] bg-[#ffffff]'}`}>
      <div className="absolute inset-0">
        {readOnly && !code ? (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)] font-mono text-sm italic">
            Translated code will appear here...
          </div>
        ) : (
          <CodeMirror
            value={code}
            theme={isDark ? 'dark' : 'none'}
            extensions={[(isDark ? editorTheme : lightEditorTheme), ...(readOnly ? getLanguageExtensions(lastTranslatedLang || lang) : getLanguageExtensions(lang))]}
            onChange={onCodeChange}
            readOnly={readOnly}
            className="text-sm font-mono h-full"
            style={{ fontFamily: MONO_FONT }}
          />
        )}
      </div>
    </div>
  </div>
  );
};

// --- TranslationControls ---

interface TranslationControlsProps {
  isLoading: boolean;
  hasSource: boolean;
  onTranslate: () => void;
  onSwap: () => void;
}

const TranslationControls: React.FC<TranslationControlsProps> = ({
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

// --- SettingsModal ---

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

const SettingsModal: React.FC<SettingsModalProps> = ({
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

// --- Header ---

interface HeaderProps {
  theme: 'dark' | 'light';
}

const Header: React.FC<HeaderProps> = ({ theme }) => {
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
        Translate code between {SUPPORTED_LANGUAGES.length} languages using local LLMs.
      </p>
    </header>
  );
};

// --- ErrorToast ---

interface ErrorToastProps {
  error: string;
  onClose: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose }) => (
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

// --- ChatPanel ---

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  messages: { role: 'user' | 'assistant'; content: string }[];
  isLoading: boolean;
  onSend: (question: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  open,
  onClose,
  messages,
  isLoading,
  onSend,
}) => {
  const [question, setQuestion] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(() => {
    if (question.trim() && !isLoading) {
      onSend(question.trim());
      setQuestion('');
    }
  }, [question, isLoading, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-end justify-end pointer-events-none">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      <div className="relative w-full md:w-[480px] h-[70vh] md:h-[80vh] md:max-h-[600px] mr-4 mb-4 md:mb-8 md:mr-8 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <MessageCircle size={18} />
              Ask About Code
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Analyzing: Source + Translated Code
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--bg-hover)] rounded-full transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
              <MessageCircle size={32} className="mb-3 opacity-50" />
              <p className="text-sm font-medium">Ask a question about your code</p>
              <p className="text-xs mt-1 opacity-70">
                I can help explain, compare, or answer questions about your source and translated code.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[var(--bg-hover)] text-[var(--text-primary)] px-3.5 py-2.5 rounded-2xl rounded-bl-md">
                <Loader2 className="animate-spin" size={16} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-[var(--border-color)] shrink-0">
          <div className="flex gap-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={2}
              className="flex-1 resize-none bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-[var(--text-primary)] text-sm placeholder:text-[var(--text-secondary)]"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !question.trim()}
              className="self-end px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[var(--bg-panel)] disabled:text-[var(--text-secondary)] text-white rounded-xl transition-all shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] text-center mt-1.5">
            Ctrl+Enter to send
          </p>
        </div>
      </div>
    </div>
  );
};

export {
  Header,
  EditorPanel,
  TranslationControls,
  SettingsModal,
  ErrorToast,
  ChatPanel,
};

