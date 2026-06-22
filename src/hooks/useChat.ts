import { useState, useCallback, useRef, useEffect } from 'react';
import { useAutoDismiss } from './useAutoDismiss';
import { TIMEOUT, isErrorWithMessage } from '@/config/constants';
import { parseStreamLine } from '@/lib/streamParser';

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
    enableReasoning: boolean,
  ) => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [reasoningText, setReasoningText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useAutoDismiss(error, () => setError(null));

  const sendMessage = useCallback(async (
    question: string,
    sourceCode: string,
    targetCode: string,
    sourceLanguage: string,
    targetLanguage: string,
    model: string,
    serverUrl: string,
    enableReasoning: boolean,
  ) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setReasoningText('');

    setMessages(prev => [...prev, { role: 'user', content: question.trim() }]);

    const controller = new AbortController();
    abortRef.current = controller;
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
          enableReasoning,
          stream: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      abortRef.current = null;

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
            const result = parseStreamLine(line);
            if (result?.chunk !== undefined) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + result.chunk! };
                }
                return updated;
              });
            }
            if (result?.reasoning) {
              setReasoningText(prev => prev + result.reasoning);
            }
            if (result?.done) {
              done = true;
            }
          }
        }

        // Process any remaining buffer
        if (buffer) {
          for (const line of buffer.split('\n')) {
            const result = parseStreamLine(line);
            if (result?.chunk !== undefined) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + result.chunk! };
                }
                return updated;
              });
            }
            if (result?.reasoning) {
              setReasoningText(prev => prev + result.reasoning);
            }
          }
        }
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      abortRef.current = null;
      if (isErrorWithMessage(err)) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return { messages, isLoading, isStreaming, reasoningText, error, sendMessage };
}
