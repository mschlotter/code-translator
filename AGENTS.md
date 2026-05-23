<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Code Translator Agent Guidance

## Architecture & Stack

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Editors**: CodeMirror 6 (`@uiw/react-codemirror`)
- **Chat**: `react-markdown` + `remark-gfm` for markdown rendering
- **Backend**: Local LLM server (llama.cpp / Ollama) via OpenAI-compatible API
- **API Routes**: `/api/translate` and `/api/chat` bridge to the local LLM server
- **LLM Client**: `src/lib/callLlm.ts` — shared LLM fetch wrapper used by both API routes
- **Validation**: `src/lib/apiValidators.ts` — shared validation utilities for both API routes
- **Theme**: CSS custom properties (`:root` / `[data-theme="dark"]`) in `src/app/globals.css`
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── translate/route.ts     # POST → /api/translate — translates code
│   │   └── chat/route.ts          # POST → /api/chat — answers code questions
│   ├── globals.css                # CSS variables for light/dark themes + markdown styles
│   ├── layout.tsx                 # Root layout (Geist fonts, metadata)
│   └── page.tsx                   # Orchestrator: wires hooks + components
├── components/
│   ├── ChatPanel.tsx              # Draggable chat panel with markdown rendering
│   ├── EditorPanel.tsx            # CodeMirror editor with language selector
│   ├── ErrorToast.tsx             # Fixed-position error notification
│   ├── Header.tsx                 # App title header with gradient
│   ├── SettingsModal.tsx          # Server URL and model selector modal
│   └── TranslationControls.tsx    # Translate and swap buttons
├── hooks/
│   ├── useAutoDismiss.ts          # Generic auto-dismiss hook (used for errors)
│   ├── useChat.ts                 # Chat message state + /api/chat API calls
│   ├── useSettings.ts             # Server URL, model state + model fetching
│   └── useTranslation.ts          # Translation state + /api/translate API calls
├── lib/
│   ├── apiValidators.ts           # Shared API validation (languages, code size, errors)
│   └── callLlm.ts                 # LLM server fetch wrapper with AbortController
└── config/
    ├── constants.ts               # TIMEOUT, CHAT_PANEL, LLM constants
    ├── languages.ts               # 27 supported languages (including Powershell)
    └── server.ts                  # Server config (llamaServerUrl, defaultModel, maxCodeSize)
```

## Critical Quirks & Constraints

### LLM API
- Requests to the LLM server **MUST** include a `model` field or the server returns 400.
- All `fetch()` calls to the LLM server **MUST** include an `AbortController` with a timeout to prevent hanging requests:
  - `TIMEOUT.SERVER_FETCH` (120s) — direct LLM calls via `callLlm.ts`
  - `TIMEOUT.TRANSLATION_FETCH` (150s) — client → `/api/translate`
  - `TIMEOUT.MODELS_FETCH` (10s) — model listing via `useSettings`
- Both `/api/translate` and `/api/chat` routes validate `sourceLanguage` and `targetLanguage` against `SUPPORTED_LANGUAGES` to prevent prompt injection.
- Code size is checked using `TextEncoder().encode(code).length` (byte count, not string length).

### CodeMirror
- To maintain fixed window height with internal scrolling, use `EditorView.theme` with:
  - `&`: `{ height: "100%", overflow: "hidden" }`
  - `.cm-scroller`: `{ overflow: "auto" }`
- The editor body is styled via `EditorView.theme` (dark mode) or `lightEditorTheme` (light mode).
- Syntax highlighting is resolved via `getLanguageExtensions(lang)` — never instantiate all modes at import time.
- `Extension` type comes from `@codemirror/state`, **not** `@codemirror/view`.

### Theme System
- Theme is controlled via `[data-theme="dark"]` attribute on `<html>`.
- Page chrome uses CSS variables (`--bg-page`, `--bg-panel`, `--text-secondary`, etc.) defined in `globals.css`.
- Editor panels stay dark by default; when `theme === 'light'`, the panel background switches to `#ffffff` and `lightEditorTheme` is applied.
- Theme preference is persisted in `localStorage` under key `translator_theme`.

### Chat Feature
- Draggable floating panel (`ChatPanel`) centered on mount, position adjustable via mouse drag.
- Messages use `react-markdown` + `remark-gfm` for assistant responses.
- Keyboard shortcut `Ctrl+Enter` / `Cmd+Enter` sends chat messages (separate from translation shortcut).
- `ChatMessage` interface: `{ role: 'user' | 'assistant'; content: string }`.

### Hydration
- Components that access `localStorage` must use a `mounted` state check (return `null` until mounted) to prevent hydration mismatches.
- `setMounted(true)` in a separate `useEffect` with `[]` deps is the correct pattern — do not suppress the ESLint rule.

### State Management
- **`useSettings` hook** — owns server URL, selected model, available models. Persists `translator_server_url` and `translator_selected_model` to `localStorage`. Auto-fetches models on mount.
- **Theme** — managed as local state in `page.tsx` with its own `useState` / `useEffect` for `localStorage` persistence (`translator_theme`) and `data-theme` DOM attribute.
- **`useTranslation` hook** — owns `sourceCode`, `targetCode`, `isLoading`, `error`, `lastTranslatedLang`. The `translate()` function accepts all 5 parameters explicitly rather than reading from closure.
- **`useChat` hook** — owns `messages`, `isLoading`, `error`. The `sendMessage()` function accepts all 7 parameters explicitly. Appends user message optimistically before API call.
- Error messages auto-dismiss after 30 seconds (`TIMEOUT.ERROR_AUTO_DISMISS`).
- All state setters are stable — they do **not** need to be in `useCallback` dependency arrays.

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|---|---|---|---|
| `NEXT_PUBLIC_LLAMA_SERVER_URL` | Yes | URL of local LLM server | `http://localhost:8080` |
| `NEXT_PUBLIC_DEFAULT_MODEL` | Yes | Default model for translations | (none — throws at build if missing) |
| `MAX_CODE_SIZE` | No | Max code size in bytes | `102400` (100KB) |

### localStorage Keys
- `translator_server_url` — LLM server URL
- `translator_selected_model` — Selected model ID
- `translator_theme` — `'dark'` or `'light'`

## Coding Standards

- **No `any` types** — use `unknown` with type guards instead.
- **No hardcoded magic numbers** — use CSS variables or constants.
- **No module-level side effects** — language extensions must be resolved lazily.
- **No suppressed ESLint directives without explanation** — if needed, configure the ESLint rules globally.
- **Components must be pure** — accept props, render, no side effects. Side effects belong in hooks.
- **Hooks own their logic** — a hook should be self-contained and testable independently.
- **AbortController for all external fetch calls** — with explicit timeouts from `TIMEOUT` constants.
- **Keyboard shortcut**: `Ctrl+Enter` / `Cmd+Enter` triggers translation (fires when `!isLoading` and source code non-empty) and sends chat messages.

## Running the Project

```bash
npm run dev    # Development server
npm run build  # Production build
npm start      # Production server
npm run lint   # ESLint
```
