'use client';

import React from 'react';
import { SUPPORTED_LANGUAGES } from '@/config/languages';
import { Code2 } from 'lucide-react';
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

const darkEditorTheme = EditorView.theme({
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

export const EditorPanel: React.FC<EditorPanelProps> = ({
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
              extensions={[(isDark ? darkEditorTheme : lightEditorTheme), ...(readOnly ? getLanguageExtensions(lastTranslatedLang || lang) : getLanguageExtensions(lang))]}
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
