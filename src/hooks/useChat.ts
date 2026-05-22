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
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e.name !== 'AbortError') {
        setError(e.message || 'An unexpected error occurred');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, error, sendMessage };
}
