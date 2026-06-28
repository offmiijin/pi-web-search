/**
 * Web Search Extension — Engine Barrel
 *
 * Three configurable API-based engines: Tavily → Exa → Serper.dev
 */

export type { SearchResult, EngineResult } from "./engines/types";

export { searchTavily } from "./engines/tavily";
export { searchExa } from "./engines/exa";
export { searchSerper } from "./engines/serper";
