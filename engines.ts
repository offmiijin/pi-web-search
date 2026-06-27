/**
 * Web Search Extension — Engine Barrel
 *
 * Re-exports all engines from the engines/ directory.
 * Each engine lives in its own file under engines/ for maintainability:
 *   - engines/duckduckgo.ts  — DuckDuckGo (lite + html)
 *   - engines/bing.ts        — Bing RSS
 *   - engines/brave.ts       — Brave HTML scraping
 *   - engines/http.ts        — Shared HTTP helpers
 *   - engines/types.ts       — Shared types
 */

// Types
export type { SearchResult, EngineResult } from "./engines/types";

// DuckDuckGo
export {
	isBlockPage,
	parseLiteHtml,
	parseHtmlEndpoint,
	searchDDGLite,
	searchDDGHtml,
} from "./engines/duckduckgo";

// Bing
export { parseBingRss, searchBing } from "./engines/bing";

// Brave
export { parseBraveHtml, searchBrave } from "./engines/brave";
