# TabiCat by SELOdev

TabiCat is a Chrome side panel extension from SELOdev that keeps AI assistance in your workflow without recurring SaaS fees. Pair it with a locally hosted Ollama model to get instant responses, prompt templates, and model profiles directly beside any page.

## Features

- **Local-first AI** — Connects to Ollama at `http://localhost:11434` so you control the model and data.
- **Context menu capture** — Highlight text and send it to TabiCat via “Ask TabiCat about…”.
- **Prompt templates** — Store reusable prompts for common tasks like summaries, replies, or brainstorming.
- **Model profiles** — Switch between Ollama models and system prompts with one click.
- **Session history** — Conversations persist between panel sessions for effortless follow-up.

## Requirements

- Chrome or another Chromium browser with side panel support.
- Ollama running locally (`ollama serve`) with your preferred models available.
- Access to `http://localhost:11434/api/chat` (default Ollama endpoint).

## Installation

1. Clone this repository.
2. Install and start Ollama if you haven’t already.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Choose **Load unpacked** and select the project directory.
5. Click the TabiCat action icon or use the context menu to open the side panel.

## Usage

1. Ensure Ollama is running (e.g., `ollama serve`).
2. Open the TabiCat side panel.
3. Type or paste a prompt, pick a template, or send highlighted text from any page.
4. Choose a model profile to tailor tone, creativity, or task behavior.
5. Review previous conversations anytime—TabiCat remembers them for you.

## Branding & Sharing

Share TabiCat freely with friends who want a free, local, privacy-respecting AI Browser integration. Because it relies on your own hardware, there are no monthly subscription costs and no third-party servers in the loop.

## Contributing

Issues and pull requests are welcome. Whether you want new prompt packs, better styling, or expanded model support, we’d love to collaborate.

---

**SELOdev** · Building local-first tools that make your workflow smarter without surrendering control.
