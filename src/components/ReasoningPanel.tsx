'use client';

import { useState, useRef, useEffect } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface ReasoningPanelProps {
  content: string;
  isStreaming: boolean;
}

export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ content, isStreaming }) => {
  const [expanded, setExpanded] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, expanded]);

  if (!content && !isStreaming) return null;

  return (
    <div className="mt-3 rounded-xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-panel)] shadow-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer select-none"
      >
        <span className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
          <Brain size={16} className="text-amber-500" />
          {isStreaming ? 'Thinking...' : 'Reasoning'}
        </span>
        <span className="text-[var(--text-secondary)]">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {expanded && (
        <div
          ref={contentRef}
          className="px-4 pb-3 pt-1 max-h-[240px] overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-[var(--text-secondary)] reasoning-content"
        >
          {content}
          {isStreaming && <span className="inline-block w-1.5 h-3 ml-0.5 align-text-bottom bg-indigo-500 animate-pulse" />}
        </div>
      )}
    </div>
  );
};