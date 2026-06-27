/**
 * Web Search Extension — Bing Engine
 *
 * Uses Bing RSS endpoint (?format=rss) — clean XML, no API key needed.
 */

import * as cheerio from "cheerio";
import { get } from "./http";
import type { SearchResult, EngineResult } from "./types";

/**
 * Parse Bing RSS XML feed into SearchResult items.
 *
 * Structure:
 *   <rss><channel>
 *     <item>
 *       <title>Page Title</title>
 *       <link>https://...</link>
 *       <description>Snippet text</description>
 *     </item>
 *   </channel></rss>
 */
/** @visibleForTesting */
export function parseBingRss(xml: string): SearchResult[] {
	const $ = cheerio.load(xml, { xmlMode: true });
	const results: SearchResult[] = [];

	$("item").each((_i, el) => {
		const $el = $(el);
		const title = $el.find("title").first().text().trim();
		const url = $el.find("link").first().text().trim();
		const snippet = $el.find("description").first().text().trim();

		if (!title || !url) return;
		results.push({ title, url, snippet });
	});

	return results;
}

/**
 * Search Bing via RSS feed.
 *
 * Bing offers results in RSS XML format via ?format=rss.
 * No API key needed — respects the RSS terms of use.
 */
export async function searchBing(
	query: string,
	signal?: AbortSignal,
): Promise<EngineResult> {
	try {
		const url = `https://www.bing.com/search?format=rss&q=${encodeURIComponent(query)}`;
		const response = await get(url, signal);

		if (!response.ok) {
			return { results: [], error: `Bing HTTP ${response.status}` };
		}

		const xml = await response.text();
		const results = parseBingRss(xml);

		if (results.length === 0) {
			return { results: [], error: "Bing: no results found" };
		}

		return { results };
	} catch (err) {
		return { results: [], error: `Bing: ${err instanceof Error ? err.message : String(err)}` };
	}
}
