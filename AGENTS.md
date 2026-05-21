<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Code Translator Agent Guidance

## Architecture & Stack
- **Framework**: Next.js (App Router), TypeScript, Tailwind CSS.
- **Editors**: CodeMirror 6.
- **Backend**: Local `llama-server` (llama.cpp) via OpenAI-compatible API.
- **Proxy**: `/api/translate` acts as a bridge to the local LLM server.

## Critical Quirks & Constraints
- **LLM API**: Requests to `llama-server` MUST include the `model` field, otherwise the server returns a 400 error.
- **CodeMirror Scrolling**: To maintain fixed window height and enable scrolling, you MUST use `EditorView.theme` with:
  - `&`: `{ height: "100%" }`
  - `.cm-scroller`: `{ overflow: "auto" }`
- **Hydration**: Use a `mounted` state check in components that access `localStorage` to prevent Next.js hydration mismatches.

## Configuration & Persistence
- **Default Server URL**: Defined in `.env.local` as `LLAMA_SERVER_URL`.
- **User Settings**: Persisted in `localStorage` using keys:
  - `translator_server_url`
  - `translator_selected_model`
- **Supported Languages**: Managed in `src/config/languages.ts`.
