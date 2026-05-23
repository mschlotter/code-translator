import { useState, useCallback, useEffect, useRef } from 'react';
import { config } from '@/config/server';
import { TIMEOUT } from '@/config/constants';
import { useAutoDismiss } from './useAutoDismiss';

export function useSettings() {
  const [mounted, setMounted] = useState(false);
  const [serverUrl, setServerUrl] = useState(config.llamaServerUrl);
  const [selectedModel, setSelectedModel] = useState('');
  const [enableReasoning, setEnableReasoning] = useState(true);
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

  useAutoDismiss(modelsError, () => setModelsError(null));

  const fetchModels = useCallback(async (model: string) => {
    setIsFetchingModels(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT.MODELS_FETCH);
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
    const savedReasoning = localStorage.getItem('translator_enable_reasoning');
    const model = savedModel || config.defaultModel || '';
    const url = savedUrl || config.llamaServerUrl;
    const reasoning = savedReasoning === null ? true : savedReasoning === 'true';
    setSelectedModel(model);
    setServerUrl(url);
    setEnableReasoning(reasoning);
    fetchModels(model);
  }, [mounted, fetchModels]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('translator_server_url', serverUrl);
    localStorage.setItem('translator_selected_model', selectedModel);
    localStorage.setItem('translator_enable_reasoning', String(enableReasoning));
  }, [mounted, serverUrl, selectedModel, enableReasoning]);

  return {
    mounted,
    serverUrl,
    setServerUrl,
    selectedModel,
    setSelectedModel,
    enableReasoning,
    setEnableReasoning,
    availableModels,
    isFetchingModels,
    modelsError,
    fetchModels,
  };
}
