import { NextResponse } from 'next/server';
import { config } from '@/config/server';

export async function POST(req: Request) {
  try {
    const { sourceLanguage, targetLanguage, code, model, serverUrl } = await req.json();

    if (!sourceLanguage || !targetLanguage || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (code.length > config.maxCodeSize) {
      const sizeInKB = (code.length / 1024).toFixed(1);
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
    const completionsUrl = `${finalUrl.replace(/\/$/, '')}/v1/chat/completions`;

    const response = await fetch(completionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || "unsloth/gemma-4-31B-it-GGUF:Q4_K_XL",
        messages: [
          {
            role: 'system',
            content: 'You are an expert code translator. Your task is to translate code between programming languages accurately and efficiently.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Llama server error (${response.status}):`, errorData);
      throw new Error(`Llama server responded with status: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const translatedCode = data.choices[0].message.content.trim();

    return NextResponse.json({ translatedCode });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Translation error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
