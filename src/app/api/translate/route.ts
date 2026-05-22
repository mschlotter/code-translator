import { NextResponse } from 'next/server';
import { config } from '@/config/server';
import { SUPPORTED_LANGUAGES } from '@/config/languages';
import { callLlm } from '@/lib/callLlm';

if (!process.env.NEXT_PUBLIC_DEFAULT_MODEL) {
  throw new Error('NEXT_PUBLIC_DEFAULT_MODEL environment variable is required');
}

export async function POST(req: Request) {
  try {
    const { sourceLanguage, targetLanguage, code, model, serverUrl } = await req.json();

    if (!sourceLanguage || !targetLanguage || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    const codeBytes = new TextEncoder().encode(code).length;
    if (codeBytes > config.maxCodeSize) {
      const sizeInKB = (codeBytes / 1024).toFixed(1);
      const maxKB = (config.maxCodeSize / 1024).toFixed(1);
      return NextResponse.json(
        { error: `Code size (${sizeInKB}KB) exceeds the maximum allowed size of ${maxKB}KB. Please split your code into smaller files or remove unnecessary content.` },
        { status: 400 }
      );
    }

    const prompt = `Translate the following code from ${sourceLanguage} to ${targetLanguage}. 
Provide ONLY the translated code. Do not include any explanations, markdown code blocks, or additional text.

Source code (${sourceLanguage}):
${code}`;

    const finalUrl = serverUrl ?? process.env.NEXT_PUBLIC_LLAMA_SERVER_URL;

    const translatedCode = await callLlm({
      serverUrl: finalUrl,
      model,
      messages: [
        { role: 'system', content: 'You are an expert code translator. Your task is to translate code between programming languages accurately and efficiently.' },
        { role: 'user', content: prompt },
      ],
    });

    return NextResponse.json({ translatedCode });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Translation error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
