import { NextResponse } from 'next/server';
import { config } from '@/config/server';
import { SUPPORTED_LANGUAGES } from '@/config/languages';

if (!process.env.NEXT_PUBLIC_DEFAULT_MODEL) {
  throw new Error('NEXT_PUBLIC_DEFAULT_MODEL environment variable is required');
}

export async function POST(req: Request) {
  try {
    const { sourceLanguage, targetLanguage, question, sourceCode, targetCode, model, serverUrl } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Missing required field: question' }, { status: 400 });
    }

    if (!sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceLanguage and targetLanguage are required' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(sourceLanguage)) {
      return NextResponse.json(
        { error: `Unsupported source language: ${sourceLanguage}` },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(targetLanguage)) {
      return NextResponse.json(
        { error: `Unsupported target language: ${targetLanguage}` },
        { status: 400 }
      );
    }

    if (sourceCode) {
      const sourceBytes = new TextEncoder().encode(sourceCode).length;
      if (sourceBytes > config.maxCodeSize) {
        const sizeInKB = (sourceBytes / 1024).toFixed(1);
        const maxKB = (config.maxCodeSize / 1024).toFixed(1);
        return NextResponse.json(
          { error: `Source code size (${sizeInKB}KB) exceeds the maximum allowed size of ${maxKB}KB.` },
          { status: 400 }
        );
      }
    }

    if (targetCode) {
      const targetBytes = new TextEncoder().encode(targetCode).length;
      if (targetBytes > config.maxCodeSize) {
        const sizeInKB = (targetBytes / 1024).toFixed(1);
        const maxKB = (config.maxCodeSize / 1024).toFixed(1);
        return NextResponse.json(
          { error: `Target code size (${sizeInKB}KB) exceeds the maximum allowed size of ${maxKB}KB.` },
          { status: 400 }
        );
      }
    }

    const codeContext: string[] = [];
    if (sourceCode) {
      codeContext.push(`Source code (${sourceLanguage}):\n${sourceCode}`);
    }
    if (targetCode) {
      codeContext.push(`Translated code (${targetLanguage}):\n${targetCode}`);
    }

    const systemPrompt = `You are a code assistant that helps users understand code. Answer questions about source code, translated code, or comparisons between them. Be concise, accurate, and provide specific explanations with code references when helpful. If a question cannot be answered from the provided code, explain what information is missing.`;

    let userPrompt = `I have the following code available for reference:\n\n${codeContext.join('\n\n')}\n\n`;
    userPrompt += `Question: ${question}`;

    const finalUrl = serverUrl ?? process.env.NEXT_PUBLIC_LLAMA_SERVER_URL;
    const completionsUrl = `${finalUrl.replace(/\/$/, '')}/v1/chat/completions`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    let response;
    try {
      response = await fetch(completionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || config.defaultModel,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Llama server error (${response.status}):`, errorData);
      throw new Error(`Llama server responded with status: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content.trim();

    return NextResponse.json({ answer });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Chat error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
