export const config = {
  /** URL of the local LLM server */
  llamaServerUrl: process.env.NEXT_PUBLIC_LLAMA_SERVER_URL ?? 'http://localhost:8080',

  /** Default model to use when no model is selected (e.g., "llama3.1") */
  defaultModel: process.env.NEXT_PUBLIC_DEFAULT_MODEL,

  /** Maximum code size in bytes (default: 100KB) */
  maxCodeSize: parseInt(process.env.MAX_CODE_SIZE ?? '102400', 10),
} as const;
