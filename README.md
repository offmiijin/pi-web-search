# pi-web-search

**Pi extension** — search the web via Tavily, Exa, and Serper.dev APIs.

Registers three tools:

- **`web_search`** — Searches via Tavily → Exa → Serper.dev auto-fallback. Returns up to 10 results (title, URL, snippet) per query.
- **`web_fetch`** — Fetches full page content from URLs, strips HTML/navigation, saves clean text.
- **`web_agent`** — Orchestrates multi-branch research: tracks searches + fetches, suggests next steps.

Also adds a command:

- **`/web_search config <serper|exa|tavily> <key>`** — Save an API key.

## Install

```bash
# npm
pi install npm:@offmiijin/pi-web-search

# git
pi install git:github.com/offmiijin/pi-web-search
```

## API Keys

Configure at least one provider. Cascade: **Tavily → Exa → Serper.dev**.

### Via command (recommended)

```text
/web_search config serper <your-serper-key>
/web_search config exa <your-exa-key>
/web_search config tavily <your-tavily-key>
```

Keys saved to `~/.config/pi-web-search/config.json`.

### Via environment variables

```bash
export SERPER_API_KEY="..."
export EXA_API_KEY="..."
export TAVILY_API_KEY="..."
```

Env vars override config file values.

### Provider free tiers

| Provider | Free tier | Sign up |
|----------|-----------|---------|
| **Serper.dev** | 2,500 queries/mo, no CC | https://serper.dev |
| **Exa** | 1,000 queries/mo, requires CC | https://exa.ai |
| **Tavily** | 1,000 queries/mo, requires CC | https://tavily.com |

## Usage

```text
web_search({ query: "latest Python version 2026" })
→ 10 results with title, URL, snippet

web_fetch({ urls: ["https://python.org/downloads/"] })
→ Clean text saved to /tmp/page_<date>_<random>/

web_agent({ goal: "Research best CLI tools" })
→ Starts tracked research session
```

## Development

```bash
npm install
npx vitest run
```

## How it works

1. `web_search` calls `search()` which tries Tavily first
2. If Tavily fails (no key, HTTP error, timeout), falls back to Exa
3. If Exa also fails, falls back to Serper.dev
4. If all fail, returns a clear error with configuration instructions

## License

MIT
