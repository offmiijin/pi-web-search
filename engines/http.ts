/**
 * Web Search Extension — HTTP Helpers
 *
 * Shared fetch wrappers with timeout, abort wiring, and throttle.
 */

import { randomUserAgent, randomDelay, throttleSearch, SEARCH_TIMEOUT_MS } from "../utils";

/** POST form-urlencoded — used by DuckDuckGo */
export async function postForm(
	url: string,
	body: URLSearchParams,
	signal?: AbortSignal,
): Promise<Response> {
	const controller = new AbortController();

	const abortHandler = () => controller.abort(signal?.reason);
	if (signal) {
		signal.addEventListener("abort", abortHandler, { once: true });
	}

	await Promise.all([randomDelay(), throttleSearch()]);

	const timer = setTimeout(() => controller.abort(new Error("TIMEOUT")), SEARCH_TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"User-Agent": randomUserAgent(),
				"Content-Type": "application/x-www-form-urlencoded",
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
			},
			body: body.toString(),
			signal: controller.signal,
		});

		return response;
	} finally {
		clearTimeout(timer);
		if (signal) {
			signal.removeEventListener("abort", abortHandler);
		}
	}
}

/** GET with common headers + timeout — used by Bing and Brave */
export async function get(url: string, signal?: AbortSignal): Promise<Response> {
	const controller = new AbortController();

	const abortHandler = () => controller.abort(signal?.reason);
	if (signal) {
		signal.addEventListener("abort", abortHandler, { once: true });
	}

	const timer = setTimeout(() => controller.abort(new Error("TIMEOUT")), SEARCH_TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent": randomUserAgent(),
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.9",
			},
		});
		return response;
	} finally {
		clearTimeout(timer);
		if (signal) {
			signal.removeEventListener("abort", abortHandler);
		}
	}
}
