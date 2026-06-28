/**
 * Web Search Extension — Search Orchestrator
 *
 * Cascade: Tavily → Exa → Serper.dev
 * Each engine tried in order. If one fails, next is attempted.
 * All engines need API keys configured via /web_search config or env vars.
 */

import type { SearchResult, EngineResult } from "./engines";
import { searchTavily, searchExa, searchSerper } from "./engines";

export type SearchSource = "tavily" | "exa" | "serper";

export interface SearchOutput {
	query: string;
	source: SearchSource;
	results: SearchResult[];
	error?: string;
}

export { SearchResult };
export type { EngineResult };

/**
 * Search via engine cascade: Tavily → Exa → Serper.dev.
 */
export async function search(
	query: string,
	signal?: AbortSignal,
): Promise<SearchOutput> {
	// 1. Tavily
	const tavily = await searchTavily(query, signal);
	if (tavily.results.length > 0) {
		return { query, source: "tavily", results: tavily.results };
	}

	// 2. Exa
	const exa = await searchExa(query, signal);
	if (exa.results.length > 0) {
		return {
			query,
			source: "exa",
			results: exa.results,
			error: tavily.error ? `Tavily failed: ${tavily.error}` : undefined,
		};
	}

	// 3. Serper.dev
	const serper = await searchSerper(query, signal);
	if (serper.results.length > 0) {
		return {
			query,
			source: "serper",
			results: serper.results,
			error: [
				tavily.error ? `Tavily: ${tavily.error}` : null,
				exa.error ? `Exa: ${exa.error}` : null,
			].filter(Boolean).join(" | "),
		};
	}

	// All failed
	const errors = [tavily.error, exa.error, serper.error]
		.filter((e): e is string => !!e);
	return {
		query,
		source: "serper",
		results: [],
		error: errors.length > 0
			? `All engines failed: ${errors.join(" | ")}`
			: "No search providers configured. Use /web_search config <provider> <key>",
	};
}
