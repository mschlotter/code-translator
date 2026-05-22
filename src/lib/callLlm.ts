import { config } from '@/config/server';
import { LLM, TIMEOUT } from '@/config/constants';

interface CallLlmParams {
  serverUrl: string;
  model: string | undefined;
  messages: Array<{ role: string; content: string }>;
}

export async function callLlm({ serverUrl, model, messages }: CallLlmParams): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT.SERVER_FETCH);

  try {
    const completionsUrl = `${serverUrl.replace(/\/$/, '')}/v1/chat/completions`;

    const resolvedModel = model || (config.defaultModel as string);
    const body = JSON.stringify({
      model: resolvedModel,
      messages,
      temperature: LLM.TEMPERATURE,
      max_tokens: LLM.MAX_TOKENS,
    });
    console.log('[callLlm] URL:', completionsUrl, 'Model:', resolvedModel, 'Messages:', messages.length, 'Total body bytes:', new TextEncoder().encode(body).length);
    const start = Date.now();

    const response = await fetch(completionsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Llama server error (${response.status}):`, errorData);
      if (response.status === 0) {
        throw new Error('The LLM server did not respond. Is it running?');
      }
      throw new Error(`Llama server responded with status: ${response.status} - ${errorData}`);
    }

    console.log('[callLlm] Response:', response.status, 'in', ((Date.now() - start) / 1000).toFixed(1), 's');

    const data = await response.json();
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('The model returned an empty or invalid response');
    }
    return data.choices[0].message.content.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}
