/**
 * Web Search Extension — Brave Search Engine
 *
 * Uses HTML scraping with structural selectors (no API key needed).
 * Best-effort parsing — DOM structure changes gracefully return 0 results.
 */

import * as cheerio from "cheerio";
import { get } from "./http";
import type { SearchResult, EngineResult } from "./types";

/**
 * Parse Brave Search HTML into SearchResult items.
 *
 * Structure uses Svelte-hashed class names, so we rely on attribute-contains
 * selectors and DOM position rather than fixed class names.
 *
 * Pattern observed:
 *   <a class="desktop-heading-h3 svelte-XXXXX" href="URL">TITLE</a>
 *   <div class="generic-snippet svelte-XXXXX">
 *     <div class="content ...">SNIPPET</div>
 *   </div>
 *   <cite class="snippet-url ...">URL</cite>
 */
/** @visibleForTesting */
export function parseBraveHtml(html: string): SearchResult[] {
	const $ = cheerio.load(html);
	const results: SearchResult[] = [];

	// Find result title links — look for <a> with heading-like classes
	// inside the snippet container (not navigation links)
	$('a[class*="desktop-heading-"]').each((_i, el) => {
		const $el = $(el);
		const href = $el.attr("href");
		const title = $el.text().trim();

		if (!href || !title) return;
		if (!href.startsWith("http")) return; // skip internal links

		// Try to find the snippet — look for generic-snippet nearby
		let snippet = "";
		const $parent = $el.closest("div");
		// Search up to 3 parent levels for generic-snippet
		const $snippetDiv = $parent.find('div[class*="generic-snippet"]').first();
		if ($snippetDiv.length) {
			snippet = $snippetDiv.text().trim();
		} else {
			// Fallback: search siblings
			const $siblingSnippet = $el
				.parentsUntil(".snippet")
				.last()
				.find('div[class*="generic-snippet"]')
				.first();
			if ($siblingSnippet.length) {
				snippet = $siblingSnippet.text().trim();
			}
		}

		results.push({ title, url: href, snippet });
	});

	return results;
}

/**
 * Search Brave Search via HTML scraping.
 *
 * Best-effort parsing — if the DOM structure changes significantly,
 * this returns 0 results and the orchestrator falls through to the
 * next engine.
 */
export async function searchBrave(
	query: string,
	signal?: AbortSignal,
): Promise<EngineResult> {
	try {
		const url = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
		const response = await get(url, signal);

		if (!response.ok) {
			return { results: [], error: `Brave HTTP ${response.status}` };
		}

		const html = await response.text();

		if (html.includes("captcha")) {
			return { results: [], error: "Brave: captcha blocked" };
		}

		const results = parseBraveHtml(html);

		if (results.length === 0) {
			return { results: [], error: "Brave: no results found" };
		}

		return { results };
	} catch (err) {
		return { results: [], error: `Brave: ${err instanceof Error ? err.message : String(err)}` };
	}
}
