import { NextResponse } from 'next/server';
import { callLlm, callLlmStream } from '@/lib/callLlm';
import {
  errorResponse,
  validateLanguage,
  validateCodeSize,
  resolveServerUrl,
  handleServerError,
} from '@/lib/apiValidators';

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_DEFAULT_MODEL) {
      return errorResponse('NEXT_PUBLIC_DEFAULT_MODEL environment variable is required', 500);
    }

    const { sourceLanguage, targetLanguage, code, model, serverUrl, enableReasoning, stream } = await req.json();

    if (!sourceLanguage || !targetLanguage || !code) {
      return errorResponse('Missing required fields', 400);
    }

    const langError = validateLanguage(sourceLanguage, 'source') ?? validateLanguage(targetLanguage, 'target');
    if (langError) return langError;

    const sizeError = validateCodeSize(code, 'Code');
    if (sizeError) return sizeError;

    const prompt = `Translate the following code from ${sourceLanguage} to ${targetLanguage}.
Provide ONLY the translated code. Do not include any explanations, markdown code blocks, or additional text.

Source code (${sourceLanguage}):
${code}`;

    const messages = [
      { role: 'system', content: 'You are an expert code translator. Your task is to translate code between programming languages accurately and efficiently.' },
      { role: 'user', content: prompt },
    ];

    const resolvedServerUrl = resolveServerUrl(serverUrl);

    if (stream) {
      const stream = callLlmStream({
        serverUrl: resolvedServerUrl,
        model,
        messages,
        enableReasoning: enableReasoning !== false,
      });
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const translatedCode = await callLlm({
      serverUrl: resolvedServerUrl,
      model,
      messages,
      enableReasoning: enableReasoning !== false,
    });

    return NextResponse.json({ translatedCode });
  } catch (error: unknown) {
    return handleServerError(error, 'Translation');
  }
}
