import { config } from '@/config/server';
import { LLM, TIMEOUT } from '@/config/constants';

interface CallLlmParams {
  serverUrl: string;
  model: string | undefined;
  messages: Array<{ role: string; content: string }>;
}

function buildRequestBody(model: string | undefined, messages: Array<{ role: string; content: string }>) {
  const resolvedModel = model || (config.defaultModel as string);
  return JSON.stringify({
    model: resolvedModel,
    messages,
    temperature: LLM.TEMPERATURE,
    max_tokens: LLM.MAX_TOKENS,
  });
}

function checkResponseOk(response: Response): void {
  if (!response.ok) {
    if (response.status === 0) {
      throw new Error('The LLM server did not respond. Is it running?');
    }
    throw new Error(`Llama server responded with status: ${response.status}`);
  }
}

export async function callLlm({ serverUrl, model, messages }: CallLlmParams): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT.SERVER_FETCH);

  try {
    const completionsUrl = `${serverUrl.replace(/\/$/, '')}/v1/chat/completions`;

    const response = await fetch(completionsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildRequestBody(model, messages),
      signal: controller.signal,
    });

    checkResponseOk(response);

    const data = await response.json();
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('The model returned an empty or invalid response');
    }
    return data.choices[0].message.content.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

export function callLlmStream({ serverUrl, model, messages }: CallLlmParams): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      const fetchController = new AbortController();
      const timeoutId = setTimeout(() => fetchController.abort(), TIMEOUT.SERVER_FETCH);

      try {
        const completionsUrl = `${serverUrl.replace(/\/$/, '')}/v1/chat/completions`;

        const resolvedModel = model || (config.defaultModel as string);
        const body = JSON.stringify({
          model: resolvedModel,
          messages,
          temperature: LLM.TEMPERATURE,
          max_tokens: LLM.MAX_TOKENS,
          stream: true,
        });
        const response = await fetch(completionsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: fetchController.signal,
        });

        checkResponseOk(response);

        if (!response.body) {
          controller.error(new Error('No response body'));
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta;
              const reasoningContent = delta?.reasoning_content;
              if (reasoningContent) {
                controller.enqueue(`reasoning:${encodeURIComponent(reasoningContent)}\n`);
              }
              const content = delta?.content;
              if (content) {
                controller.enqueue(`chunk:${encodeURIComponent(content)}\n`);
              }
            } catch {
              continue;
            }
          }
        }

        controller.enqueue('done\n');
        controller.close();
        clearTimeout(timeoutId);
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        controller.error(err);
      }
    },
  });
}