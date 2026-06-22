import { useState, useCallback, useRef, useEffect } from 'react';
import { TIMEOUT, isErrorWithMessage } from '@/config/constants';
import { useAutoDismiss } from './useAutoDismiss';
import { parseStreamLine } from '@/lib/streamParser';

export function useTranslation() {
  const [sourceCode, setSourceCode] = useState('print("Hello World")');
  const [targetCode, setTargetCode] = useState('');
  const [reasoningText, setReasoningText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTranslatedLang, setLastTranslatedLang] = useState('');
  const abortRef = useRef<AbortController | null>(null);

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
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setIsLoading(true);
    setError(null);
    setTargetCode('');
    setReasoningText('');
    const controller = new AbortController();
    abortRef.current = controller;
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
      abortRef.current = null;
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
            const result = parseStreamLine(line);
            if (result?.chunk !== undefined) {
              setTargetCode(prev => prev + result.chunk);
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
              setTargetCode(prev => prev + result.chunk);
            }
            if (result?.reasoning) {
              setReasoningText(prev => prev + result.reasoning);
            }
          }
        }
        setLastTranslatedLang(targetLang);
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
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
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
