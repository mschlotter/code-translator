# Code Translator

Translate code between programming languages using local LLMs via a clean, modern editor interface. This tool is built for educational purposes and shall not be used for production-level code!

<div align="center">
  <img src="docs/images/screenshot_dark.png" alt="screenshot dark theme" width="360" style="border-radius: 2px;">
  &nbsp;&nbsp;
  <img src="docs/images/screenshot_light.png" alt="screenshot light theme" width="360" style="border-radius: 2px;">
</div>

## Features

- **>25 languages** — Python, JavaScript, TypeScript, C/C++, Java, Go, Rust, PHP, Ruby, Swift, Shell, Powershell, and more
- **Local-first** — All translations run on your machine via `llama-server` (llama.cpp)
- **AI chat** — Ask questions about your source and translated code in a floating chat panel
- **Syntax highlighting** — Real-time language-aware highlighting powered by CodeMirror 6
- **Dark & light themes** — Toggle with one click; preferences persist in localStorage
- **Keyboard shortcuts** — `Ctrl+Enter` / `Cmd+Enter` to translate instantly
- **Copy to clipboard** — One-click copy for translated output

## Quick Start

### Prerequisites

1. **Node.js 18+** and **npm**
2. **llama.cpp** with the OpenAI-compatible server — either from [llama.cpp](https://github.com/ggerganov/llama.cpp) or [Ollama](https://ollama.com/)

### Install & Run

```bash
# Clone and install dependencies
git clone https://github.com/mschlotter/code-translator.git
cd code-translator
npm install

# Configure the LLM server
cp .env.example .env.local
# then edit .env.local and set your server URL and model name

# Start the development server
npm run dev

# Build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and set the following:

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_LLAMA_SERVER_URL` | Yes | URL of your local LLM server | `http://localhost:11435` |
| `NEXT_PUBLIC_DEFAULT_MODEL` | Yes | Default model to use | `unsloth/Qwen3.6-35B-A3B-GGUF:Q5_K_XL` |
| `MAX_CODE_SIZE` | No | Max code size in bytes (default: 100KB) | `102400` |

### LLM Servers

#### Llama.cpp in router mode

For example:
```bash
llama-server --models-dir ./models --port 11435
```
Or using a configuration file:
```bash
llama-server --models-preset ./models.ini --port 8080
```

## Project Structure

```
code-translator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── translate/route.ts   # POST → translates code
│   │   │   └── chat/route.ts        # POST → answers code questions
│   │   ├── globals.css              # CSS variables + markdown styles
│   │   ├── layout.tsx               # Root layout (Geist fonts, metadata)
│   │   └── page.tsx                 # Main orchestrator component
│   ├── components/
│   │   ├── ChatPanel.tsx            # Draggable chat panel with markdown
│   │   ├── EditorPanel.tsx          # CodeMirror editor + language selector
│   │   ├── ErrorToast.tsx           # Fixed-position error notification
│   │   ├── Header.tsx               # App title header with gradient
│   │   ├── SettingsModal.tsx        # Server URL and model selector modal
│   │   └── TranslationControls.tsx  # Translate and swap buttons
│   ├── config/
│   │   ├── constants.ts             # TIMEOUT, CHAT_PANEL, LLM constants
│   │   ├── languages.ts             # 27 supported languages
│   │   └── server.ts                # Server config constants
│   ├── hooks/
│   │   ├── useAutoDismiss.ts        # Generic auto-dismiss hook
│   │   ├── useChat.ts               # Chat message state + API calls
│   │   ├── useSettings.ts           # Server URL, model state + model fetching
│   │   └── useTranslation.ts        # Translation state + API calls
│   └── lib/
│       ├── apiValidators.ts         # Shared API validation utilities
│       └── callLlm.ts               # LLM server fetch wrapper
├── public/                          # Static assets
├── .env.example                     # Template env file
├── package.json
└── tsconfig.json
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Editors**: CodeMirror 6
- **Chat**: react-markdown + remark-gfm
- **Icons**: Lucide React
- **LLM Backend**: llama.cpp (llama-server) via OpenAI-compatible API

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge).

## License

This project is licensed under the MIT License.
