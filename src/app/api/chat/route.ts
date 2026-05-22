import { NextResponse } from 'next/server';
import { callLlm } from '@/lib/callLlm';
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

    const { sourceLanguage, targetLanguage, question, sourceCode, targetCode, model, serverUrl } = await req.json();

    if (!question) {
      return errorResponse('Missing required field: question', 400);
    }

    if (!sourceLanguage || !targetLanguage) {
      return errorResponse('Missing required fields: sourceLanguage and targetLanguage are required', 400);
    }

    const langError = validateLanguage(sourceLanguage, 'source') ?? validateLanguage(targetLanguage, 'target');
    if (langError) return langError;

    if (sourceCode) {
      const sizeError = validateCodeSize(sourceCode, 'Source');
      if (sizeError) return sizeError;
    }

    if (targetCode) {
      const sizeError = validateCodeSize(targetCode, 'Target');
      if (sizeError) return sizeError;
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

    const answer = await callLlm({
      serverUrl: resolveServerUrl(serverUrl),
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return NextResponse.json({ answer });
  } catch (error: unknown) {
    return handleServerError(error, 'Chat');
  }
}
