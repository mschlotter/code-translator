import { useState, useCallback, useEffect, useRef } from 'react';
import { config } from '@/config/server';

export function useSettings() {
  const [mounted, setMounted] = useState(false);
  const [serverUrl, setServerUrl] = useState(config.llamaServerUrl);
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const serverUrlRef = useRef(serverUrl);

  useEffect(() => {
    serverUrlRef.current = serverUrl;
  }, [serverUrl]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (modelsError) {
      const timer = setTimeout(() => setModelsError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [modelsError]);

  const fetchModels = useCallback(async (model: string) => {
    setIsFetchingModels(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const url = `${serverUrlRef.current.replace(/\/$/, '')}/v1/models`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      const models = (data.data as Record<string, unknown>[]).map((m) => String(m.id));
      setAvailableModels(models);
      if (models.length > 0 && !model) setSelectedModel(models[0]);
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name !== 'AbortError') {
        setModelsError('Could not fetch models from server.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsFetchingModels(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const savedModel = localStorage.getItem('translator_selected_model');
    const savedUrl = localStorage.getItem('translator_server_url');
    const model = savedModel || config.defaultModel || '';
    const url = savedUrl || config.llamaServerUrl;
    setSelectedModel(model);
    setServerUrl(url);
    fetchModels(model);
  }, [mounted, fetchModels]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('translator_server_url', serverUrl);
    localStorage.setItem('translator_selected_model', selectedModel);
  }, [mounted, serverUrl, selectedModel]);

  return {
    mounted,
    serverUrl,
    setServerUrl,
    selectedModel,
    setSelectedModel,
    availableModels,
    isFetchingModels,
    modelsError,
    fetchModels,
  };
}
