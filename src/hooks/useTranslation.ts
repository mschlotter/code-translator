import { useState, useCallback } from 'react';
import { TIMEOUT } from '@/config/constants';
import { useAutoDismiss } from './useAutoDismiss';

export function useTranslation() {
  const [sourceCode, setSourceCode] = useState('print("Hello World")');
  const [targetCode, setTargetCode] = useState('');
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
  ) => {
    if (!code) return;
    setIsLoading(true);
    setError(null);
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
      const data = await response.json();
      setTargetCode(data.translatedCode);
      setLastTranslatedLang(targetLang);
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
    isLoading,
    error,
    setError,
    lastTranslatedLang,
    setLastTranslatedLang,
    translate,
  };
}
