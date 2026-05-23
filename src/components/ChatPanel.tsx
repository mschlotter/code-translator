'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CHAT_PANEL } from '@/config/constants';
import { X, MessageCircle, Send, Loader2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming?: boolean;
  onSend: (question: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  open,
  onClose,
  messages,
  isLoading,
  isStreaming,
  onSend,
}) => {
  const [question, setQuestion] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useEffect(() => {
    const center = () => setPos({
      left: Math.max(0, (window.innerWidth - CHAT_PANEL.WIDTH) / 2),
      top: Math.max(0, (window.innerHeight - CHAT_PANEL.HEIGHT) / 2),
    });
    center();
    window.addEventListener('resize', center);
    return () => window.removeEventListener('resize', center);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePanelMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    requestAnimationFrame(() => {
      panel.style.transition = 'none';
    });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setPos({
        left: e.clientX - dragOffsetRef.current.x,
        top: e.clientY - dragOffsetRef.current.y,
      });
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      setPos((prev) => ({
        left: Math.max(0, Math.min(prev.left, window.innerWidth - CHAT_PANEL.WIDTH)),
        top: Math.max(0, Math.min(prev.top, window.innerHeight - CHAT_PANEL.HEIGHT)),
      }));
      if (panelRef.current) {
        panelRef.current.style.transition = 'left 0.2s, top 0.2s';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col overflow-hidden rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-color)] shadow-2xl"
      style={{
        width: CHAT_PANEL.WIDTH,
        height: CHAT_PANEL.HEIGHT,
        left: pos.left,
        top: pos.top,
        transition: isDragging ? 'none' : 'left 0.2s, top 0.2s',
      }}
    >
      <div
        className="flex items-center justify-between p-4 border-b border-[var(--border-color)] shrink-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handlePanelMouseDown}
      >
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

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-md'
                  : 'bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-bl-md'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].content === '' && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-hover)] text-[var(--text-primary)] px-3.5 py-2.5 rounded-2xl rounded-bl-md">
              <Loader2 className="animate-spin" size={16} />
            </div>
          </div>
        )}
        {isStreaming && (
          <div className="streaming-cursor-dot" />
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
  );
};
