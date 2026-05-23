import { config } from '@/config/server';
import { LLM, TIMEOUT } from '@/config/constants';

interface CallLlmParams {
  serverUrl: string;
  model: string | undefined;
  messages: Array<{ role: string; content: string }>;
}

function buildRequestBody(model: string | undefined, messages: Array<{ role: string; content: string }>, includeReasoning = true) {
  const resolvedModel = model || (config.defaultModel as string);
  if (includeReasoning) {
    return JSON.stringify({
      model: resolvedModel,
      messages,
      temperature: LLM.TEMPERATURE,
      max_tokens: LLM.MAX_TOKENS,
      thinking_budget_tokens: LLM.MAX_REASONING_TOKENS,
    });
  }
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

function stripThinkingTags(content: string): string {
  return content.replace(/<thinking>\s*([\s\S]*?)<\/thinking>/gi, '').replace(/<think>\s*([\s\S]*?)<\/think>/gi, '').trim();
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
    let content = data?.choices?.[0]?.message?.content || '';
    content = stripThinkingTags(content);
    if (!content) {
      throw new Error('The model returned an empty or invalid response');
    }
    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

const THINK_OPEN = ['<thinking>', '<think>'];
const THINK_CLOSE = ['</thinking>', '</think>'];

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
          thinking_budget_tokens: LLM.MAX_REASONING_TOKENS,
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
        let inThinking = false;
        let thinkingBuffer = '';
        let contentBuffer = '';

        function flushContent(): void {
          if (contentBuffer) {
            controller.enqueue(`chunk:${encodeURIComponent(contentBuffer)}\n`);
            contentBuffer = '';
          }
        }

        function flushThinking(): void {
          if (thinkingBuffer) {
            controller.enqueue(`reasoning:${encodeURIComponent(thinkingBuffer)}\n`);
            thinkingBuffer = '';
          }
        }

        function processText(text: string): void {
          while (text.length > 0) {
            if (inThinking) {
              let foundClose = -1;
              let closeLen = 0;
              for (const tag of THINK_CLOSE) {
                const idx = text.indexOf(tag);
                if (idx !== -1 && (foundClose === -1 || idx < foundClose)) {
                  foundClose = idx;
                  closeLen = tag.length;
                }
              }
              if (foundClose === -1) {
                thinkingBuffer += text;
                text = '';
                break;
              }
              thinkingBuffer += text.slice(0, foundClose);
              text = text.slice(foundClose + closeLen);
              inThinking = false;
            } else {
              let foundOpen = -1;
              let openLen = 0;
              for (const tag of THINK_OPEN) {
                const idx = text.indexOf(tag);
                if (idx !== -1 && (foundOpen === -1 || idx < foundOpen)) {
                  foundOpen = idx;
                  openLen = tag.length;
                }
              }
              if (foundOpen === -1) {
                contentBuffer += text;
                text = '';
                break;
              }
              contentBuffer += text.slice(0, foundOpen);
              text = text.slice(foundOpen + openLen);
              inThinking = true;
            }
          }
        }

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
              const content = delta?.content || '';
              if (content) {
                processText(content);
              }
            } catch {
              continue;
            }
          }
        }

        flushContent();
        flushThinking();
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