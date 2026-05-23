import { useState, useCallback } from 'react';
import { TIMEOUT } from '@/config/constants';
import { useAutoDismiss } from './useAutoDismiss';

export function useTranslation() {
  const [sourceCode, setSourceCode] = useState('print("Hello World")');
  const [targetCode, setTargetCode] = useState('');
  const [reasoningText, setReasoningText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTranslatedLang, setLastTranslatedLang] = useState('');

  useAutoDismiss(error, () => setError(null));

  const translate = useCallback(async (
    sourceLang: string,
    targetLang: string,
    code: string,
    model: string,
    serverUrl: string,
    enableReasoning: boolean,
  ) => {
    if (!code) return;
    setIsLoading(true);
    setError(null);
    setTargetCode('');
    setReasoningText('');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT.TRANSLATION_FETCH);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          code,
          model,
          serverUrl,
          enableReasoning,
          stream: true,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        let message = 'Translation failed';
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          const text = await response.text();
          message = text || message;
        }
        throw new Error(message);
      }

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
              setTargetCode(prev => prev + text);
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

        if (!buffer) {
          setLastTranslatedLang(targetLang);
        } else {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('chunk:')) {
              const text = decodeURIComponent(line.slice(6));
              setTargetCode(prev => prev + text);
            }
            if (line.startsWith('reasoning:')) {
              const text = decodeURIComponent(line.slice(10));
              setReasoningText(prev => prev + text);
            }
          }
          setLastTranslatedLang(targetLang);
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
    }
  }, []);

  return {
    sourceCode,
    setSourceCode,
    targetCode,
    setTargetCode,
    reasoningText,
    isLoading,
    error,
    setError,
    lastTranslatedLang,
    setLastTranslatedLang,
    translate,
  };
}
