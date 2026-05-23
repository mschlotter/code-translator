import { useState, useCallback } from 'react';
import { useAutoDismiss } from './useAutoDismiss';
import { TIMEOUT } from '@/config/constants';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  reasoningText: string;
  error: string | null;
  sendMessage: (
    question: string,
    sourceCode: string,
    targetCode: string,
    sourceLanguage: string,
    targetLanguage: string,
    model: string,
    serverUrl: string,
  ) => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [reasoningText, setReasoningText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useAutoDismiss(error, () => setError(null));

  const sendMessage = useCallback(async (
    question: string,
    sourceCode: string,
    targetCode: string,
    sourceLanguage: string,
    targetLanguage: string,
    model: string,
    serverUrl: string,
  ) => {
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setReasoningText('');

    setMessages(prev => [...prev, { role: 'user', content: question.trim() }]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT.TRANSLATION_FETCH);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          sourceCode,
          targetCode,
          sourceLanguage,
          targetLanguage,
          model,
          serverUrl,
          stream: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get response');
      }

      setIsLoading(false);
      setIsStreaming(true);
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) {
            done = true;
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('chunk:')) {
              const text = decodeURIComponent(line.slice(6));
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + text };
                }
                return updated;
              });
            }
            if (line.startsWith('reasoning:')) {
              const text = decodeURIComponent(line.slice(10));
              setReasoningText(prev => prev + text);
            }
            if (line === 'done') {
              done = true;
            }
          }
        }

        if (buffer) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('chunk:')) {
              const text = decodeURIComponent(line.slice(6));
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + text };
                }
                return updated;
              });
            }
            if (line.startsWith('reasoning:')) {
              const text = decodeURIComponent(line.slice(10));
              setReasoningText(prev => prev + text);
            }
          }
        }
      }
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e.name !== 'AbortError') {
        setError(e.message || 'An unexpected error occurred');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  return { messages, isLoading, isStreaming, reasoningText, error, sendMessage };
}
