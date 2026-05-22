import { NextResponse } from 'next/server';
import { config } from '@/config/server';
import { SUPPORTED_LANGUAGES } from '@/config/languages';

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function isLanguageSupported(lang: string): boolean {
  return SUPPORTED_LANGUAGES.includes(lang);
}

export function validateLanguage(lang: string, label: string): NextResponse | null {
  if (!isLanguageSupported(lang)) {
    return errorResponse(`Unsupported ${label} language: ${lang}`, 400);
  }
  return null;
}

export function validateCodeSize(code: string, label: string): NextResponse | null {
  const bytes = new TextEncoder().encode(code).length;
  if (bytes > config.maxCodeSize) {
    const sizeInKB = (bytes / 1024).toFixed(1);
    const maxKB = (config.maxCodeSize / 1024).toFixed(1);
    return errorResponse(`${label} code size (${sizeInKB}KB) exceeds the maximum allowed size of ${maxKB}KB.`, 400);
  }
  return null;
}

export function resolveServerUrl(serverUrl: string | undefined): string {
  return serverUrl ?? process.env.NEXT_PUBLIC_LLAMA_SERVER_URL!;
}

export function handleServerError(error: unknown, context: string): NextResponse {
  const message = error instanceof Error ? error.message : 'Internal Server Error';
  if (process.env.NODE_ENV !== 'production') {
    console.error(`${context} error:`, error);
  }
  return errorResponse(message, 500);
}
