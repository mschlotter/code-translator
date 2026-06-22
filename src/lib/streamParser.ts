export interface StreamParseResult {
  chunk?: string;
  reasoning?: string;
  done?: boolean;
}

export function parseStreamLine(line: string): StreamParseResult | null {
  if (line.startsWith('chunk:')) {
    return { chunk: decodeURIComponent(line.slice(6)) };
  }
  if (line.startsWith('reasoning:')) {
    return { reasoning: decodeURIComponent(line.slice(10)) };
  }
  if (line === 'done') {
    return { done: true };
  }
  return null;
}
