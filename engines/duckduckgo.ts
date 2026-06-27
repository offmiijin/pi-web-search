/**
 * Web Search Extension — DuckDuckGo Engine
 *
 * Two search methods:
 *   - Lite (table-based HTML, primary)
 *   - HTML endpoint (div-based, fallback)
 *
 * Both use POST form-urlencoded requests.
 */

import * as cheerio from "cheerio";
import { postForm } from "./http";
import type { SearchResult, EngineResult } from "./types";

// ---------------------------------------------------------------------------
// Block / captcha detection
// ---------------------------------------------------------------------------

const BLOCK_INDICATORS = [
	"please confirm that you are a human",
	"unusual traffic",
	"captcha",
	"please try again later",
	"automated requests",
	"blocked",
	"our systems have detected",
];

/**
 * Check if the response HTML is a captcha, block, or rate-limit page
 * rather than actual search results.
 */
/** @visibleForTesting */
export function isBlockPage(html: string): boolean {
	const lower = html.toLowerCase();
	return BLOCK_INDICATORS.some((indicator) => lower.includes(indicator));
}

// ---------------------------------------------------------------------------
// Lite parser
// ---------------------------------------------------------------------------

/**
 * Parse DuckDuckGo Lite HTML (table-based).
 *
 * Structure:
 *   <table> / <tr class="result">
 *     <td class="result-snippet">
 *       <a rel="nofollow" href="URL">TITLE</a>
 *     </td>
 *   </tr>
 *   <tr>
 *     <td class="snippet">SNIPPET</td>
 *   </tr>
 */
/** @visibleForTesting */
export function parseLiteHtml(html: string): SearchResult[] {
	const $ = cheerio.load(html);
	const results: SearchResult[] = [];

	$('a[rel="nofollow"]').each((_i, el) => {
		const $el = $(el);
		const url = $el.attr("href")?.trim();
		const title = $el.text().trim();

		if (!url || !title) return;
		if (url.startsWith("/")) return;

		const $resultRow = $el.closest("tr");
		const $snippetCell = $resultRow.next("tr").find("td.snippet");
		const snippet = $snippetCell.first().text().trim();

		results.push({ title, url, snippet });
	});

	return results;
}

// ---------------------------------------------------------------------------
// HTML endpoint parser
// ---------------------------------------------------------------------------

/**
 * Parse DuckDuckGo HTML endpoint (div-based).
 *
 * Structure:
 *   <div class="result">
 *     <h2 class="result__title">
 *       <a class="result__a" href="URL">TITLE</a>
 *     </h2>
 *     <span class="result__snippet">SNIPPET</span>
 *   </div>
 */
/** @visibleForTesting */
export function parseHtmlEndpoint(html: string): SearchResult[] {
	const $ = cheerio.load(html);
	const results: SearchResult[] = [];

	$(".result").each((_i, el) => {
		const $el = $(el);
		const $link = $el.find(".result__a").first();
		const url = $link.attr("href")?.trim();
		const title = $link.text().trim();

		if (!url || !title) return;
		if (url.startsWith("/")) return;

		const snippet = $el.find(".result__snippet").first().text().trim();

		results.push({ title, url, snippet });
	});

	return results;
}

// ---------------------------------------------------------------------------
// Search functions
// ---------------------------------------------------------------------------

/**
 * Search via DuckDuckGo Lite endpoint.
 */
export async function searchDDGLite(
	query: string,
	signal?: AbortSignal,
): Promise<EngineResult> {
	try {
		const body = new URLSearchParams({ q: query });
		const response = await postForm("https://lite.duckduckgo.com/lite/", body, signal);

		if (!response.ok) {
			return { results: [], error: `HTTP ${response.status}` };
		}

		const html = await response.text();

		if (isBlockPage(html)) {
			return { results: [], error: "BLOCKED — DuckDuckGo returned a captcha or rate-limit page. Wait before retrying." };
		}

		const results = parseLiteHtml(html);

		if (results.length === 0) {
			return { results: [], error: "no results found" };
		}

		return { results };
	} catch (err) {
		return { results: [], error: err instanceof Error ? err.message : String(err) };
	}
}

/**
 * Search via DuckDuckGo HTML endpoint (fallback).
 *
 * Note: the `b=` parameter is sent empty (DDG expects it).
 */
export async function searchDDGHtml(
	query: string,
	signal?: AbortSignal,
): Promise<EngineResult> {
	try {
		const body = new URLSearchParams({ q: query, b: "" });
		const response = await postForm("https://html.duckduckgo.com/html", body, signal);

		if (!response.ok) {
			return { results: [], error: `HTTP ${response.status}` };
		}

		const html = await response.text();

		if (isBlockPage(html)) {
			return { results: [], error: "BLOCKED — DuckDuckGo returned a captcha or rate-limit page. Wait before retrying." };
		}

		const results = parseHtmlEndpoint(html);

		if (results.length === 0) {
			return { results: [], error: "no results found" };
		}

		return { results };
	} catch (err) {
		return { results: [], error: err instanceof Error ? err.message : String(err) };
	}
}
