export const config = {
  /** URL of the local LLM server */
  llamaServerUrl: process.env.LLAMA_SERVER_URL ?? 'http://localhost:8080/v1/chat/completions',

  /** Maximum code size in bytes (default: 100KB) */
  maxCodeSize: parseInt(process.env.MAX_CODE_SIZE ?? '102400', 10),
} as const;
