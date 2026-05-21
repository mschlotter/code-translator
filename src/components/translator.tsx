'use client';

import React from 'react';
import { SUPPORTED_LANGUAGES } from '@/config/languages';
import { ArrowRightLeft, Code2, Sparkles, Loader2, X } from 'lucide-react';
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
    className="bg-slate-900 border border-slate-800 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
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
}) => (
  <div className="flex flex-col gap-3 min-w-0">
    <div className="flex items-center justify-between px-2">
      <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
        <Code2 size={16} /> {label}
      </label>
      <div className="flex items-center gap-2">
        {copyButton}
        <LanguageSelector value={lang} onChange={onLangChange} />
      </div>
    </div>
    <div className="relative h-[400px] md:h-[600px] overflow-hidden rounded-xl border border-slate-800 shadow-2xl bg-[#1e1e1e]">
      <div className="absolute inset-0">
        {code ? (
          <CodeMirror
            value={code}
            theme="dark"
            extensions={[editorTheme, ...(readOnly ? getLanguageExtensions(lastTranslatedLang || lang) : getLanguageExtensions(lang))]}
            onChange={onCodeChange}
            readOnly={readOnly}
            className="text-sm font-mono h-full"
            style={{ fontFamily: MONO_FONT }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600 font-mono text-sm italic">
            {label === 'Result' ? 'Translated code will appear here...' : ''}
          </div>
        )}
      </div>
    </div>
  </div>
);

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
      className="p-3 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
    >
      <ArrowRightLeft size={20} />
    </button>
    <button
      onClick={onTranslate}
      disabled={isLoading || !hasSource}
      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
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
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold">Server Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Server URL</label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => onServerUrlChange(e.target.value)}
              placeholder="http://localhost:8080"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Model</label>
            {modelsError && (
              <p className="text-xs text-red-400">{modelsError}</p>
            )}
            <div className="flex gap-2">
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={availableModels.length === 0}
                className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 rounded-lg transition-colors"
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

const Header: React.FC = () => (
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
);

// --- ErrorToast ---

interface ErrorToastProps {
  error: string;
  onClose: () => void;
}

const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose }) => (
  <div className="fixed bottom-8 right-8 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 max-w-sm">
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

export {
  Header,
  EditorPanel,
  TranslationControls,
  SettingsModal,
  ErrorToast,
};
