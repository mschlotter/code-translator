<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Code Translator Agent Guidance

## Architecture & Stack

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Editors**: CodeMirror 6 (`@uiw/react-codemirror`)
- **Backend**: Local LLM server (llama.cpp / Ollama) via OpenAI-compatible API
- **Proxy**: `src/app/api/translate/route.ts` bridges to the local LLM server
- **Theme**: CSS custom properties (`:root` / `[data-theme="dark"]`) in `src/app/globals.css`
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   ├── api/translate/route.ts     # POST → /api/translate — validates input, forwards to LLM
│   ├── globals.css                # CSS variables for light/dark themes
│   ├── layout.tsx                 # Root layout (fonts, metadata)
│   └── page.tsx                   # Orchestrator: wires hooks + components
├── components/
│   └── translator.tsx             # Header, EditorPanel, TranslationControls, SettingsModal, ErrorToast
├── hooks/
│   ├── useSettings.ts             # Server URL, model state + model fetching
│   └── useTranslation.ts          # Translation state, API call, error auto-dismiss
└── config/
    ├── languages.ts               # 26 supported language strings
    └── server.ts                  # Server config (llamaServerUrl, defaultModel, maxCodeSize)
```

## Critical Quirks & Constraints

### LLM API
- Requests to the LLM server **MUST** include a `model` field or the server returns 400.
- All `fetch()` calls to the LLM server **MUST** include an `AbortController` with a timeout (default 120s) to prevent hanging requests.
- The `/api/translate` route validates `sourceLanguage` and `targetLanguage` against `SUPPORTED_LANGUAGES` to prevent prompt injection.
- Code size is checked using `TextEncoder().encode(code).length` (byte count, not string length).

### CodeMirror
- To maintain fixed window height with internal scrolling, use `EditorView.theme` with:
  - `&`: `{ height: "100%", overflow: "hidden" }`
  - `.cm-scroller`: `{ overflow: "auto" }`
- The editor body is styled via `EditorView.theme` (dark mode) or `lightEditorTheme` (light mode).
- Syntax highlighting is resolved **lazily** via `getLanguageExtensions(lang)` — never instantiate all 26 modes at import time.
- `Extension` type comes from `@codemirror/state`, **not** `@codemirror/view`.

### Theme System
- Theme is controlled via `[data-theme="dark"]` attribute on `<html>`.
- Page chrome uses CSS variables (`--bg-page`, `--bg-panel`, `--text-secondary`, etc.) defined in `globals.css`.
- Editor panels stay dark by default; when `theme === 'light'`, the panel background switches to `#ffffff` and `lightEditorTheme` is applied.
- Theme preference is persisted in `localStorage` under key `translator_theme`.

### Hydration
- Components that access `localStorage` must use a `mounted` state check (return `null` until mounted) to prevent hydration mismatches.
- `setMounted(true)` in a separate `useEffect` with `[]` deps is the correct pattern — do not suppress the ESLint rule.

### State Management
- **`useSettings` hook** — owns server URL, selected model, available models. Persists `translator_server_url` and `translator_selected_model` to `localStorage`.
- **Theme** — managed as local state in `page.tsx` with its own `useState` / `useEffect` for `localStorage` persistence (`translator_theme`) and `data-theme` DOM attribute.
- **`useTranslation` hook** — owns `sourceCode`, `targetCode`, `isLoading`, `error`, `lastTranslatedLang`. The `translate()` function accepts all 5 parameters explicitly rather than reading from closure.
- Error messages auto-dismiss after 5 seconds.
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
- **AbortController for all external fetch calls** — with explicit timeouts.
- **Keyboard shortcut**: `Ctrl+Enter` / `Cmd+Enter` triggers translation. Only fires when `!isLoading` and source code is non-empty.

## Running the Project

```bash
npm run dev    # Development server
npm run build  # Production build
npm start      # Production server
npm run lint   # ESLint
```
