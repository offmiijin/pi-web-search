/**
 * Tests for individual engines
 */

import { describe, it, expect, vi, afterEach } from "vitest";

// Mock config so all keys appear configured
vi.mock("../config", () => ({
	getSerperKey: () => "mock-key",
	getExaKey: () => "mock-key",
	getTavilyKey: () => "mock-key",
}));

import { searchSerper } from "../engines/serper";
import { searchExa } from "../engines/exa";
import { searchTavily } from "../engines/tavily";

function okResponse(data: unknown): Response {
	return {
		ok: true,
		status: 200,
		json: async () => data,
		text: async () => "",
	} as Response;
}

function errResponse(status: number): Response {
	return {
		ok: false,
		status,
		json: async () => ({}),
		text: async () => `HTTP ${status}`,
	} as Response;
}

// ---------------------------------------------------------------------------
// Serper.dev
// ---------------------------------------------------------------------------
describe("searchSerper", () => {
	afterEach(() => { vi.unstubAllGlobals(); });

	it("returns results from valid response", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
			okResponse({
				organic: [
					{ title: "Result A", link: "https://a.com", snippet: "Snippet A" },
					{ title: "Result B", link: "https://b.com", snippet: "Snippet B" },
				],
			}),
		));
		const result = await searchSerper("test");
		expect(result.results).toHaveLength(2);
		expect(result.results[0].title).toBe("Result A");
		expect(result.results[0].url).toBe("https://a.com");
	});

	it("returns error on HTTP failure", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errResponse(401)));
		const result = await searchSerper("fail");
		expect(result.results).toEqual([]);
		expect(result.error).toContain("401");
	});

	it("returns error when no organic results", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({})));
		const result = await searchSerper("empty");
		expect(result.results).toEqual([]);
		expect(result.error).toMatch(/no results/i);
	});

	it("handles network error", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ENOTFOUND")));
		const result = await searchSerper("fail");
		expect(result.results).toEqual([]);
		expect(result.error).toContain("ENOTFOUND");
	});
});

// ---------------------------------------------------------------------------
// Exa
// ---------------------------------------------------------------------------
describe("searchExa", () => {
	afterEach(() => { vi.unstubAllGlobals(); });

	it("returns results from valid response", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
			okResponse({
				results: [
					{ title: "Exa One", url: "https://exa1.com", text: "Exa content one" },
					{ title: "Exa Two", url: "https://exa2.com", text: "Exa content two" },
				],
			}),
		));
		const result = await searchExa("test");
		expect(result.results).toHaveLength(2);
		expect(result.results[0].title).toBe("Exa One");
		expect(result.results[0].url).toBe("https://exa1.com");
	});

	it("returns error on HTTP failure", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errResponse(403)));
		const result = await searchExa("fail");
		expect(result.results).toEqual([]);
		expect(result.error).toContain("403");
	});

	it("handles network error", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
		const result = await searchExa("fail");
		expect(result.results).toEqual([]);
		expect(result.error).toContain("ECONNREFUSED");
	});

	it("skips results without url", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
			okResponse({
				results: [
					{ title: "No URL", text: "no url here" },
					{ title: "Has URL", url: "https://valid.com", text: "valid" },
				],
			}),
		));
		const result = await searchExa("test");
		expect(result.results).toHaveLength(1);
		expect(result.results[0].url).toBe("https://valid.com");
	});
});

// ---------------------------------------------------------------------------
// Tavily
// ---------------------------------------------------------------------------
describe("searchTavily", () => {
	afterEach(() => { vi.unstubAllGlobals(); });

	it("returns results from valid response", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
			okResponse({
				results: [
					{ title: "Tavily One", url: "https://tav1.com", content: "Content one" },
				],
			}),
		));
		const result = await searchTavily("test");
		expect(result.results).toHaveLength(1);
		expect(result.results[0].title).toBe("Tavily One");
		expect(result.results[0].url).toBe("https://tav1.com");
	});

	it("returns error on HTTP failure", async () => {
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errResponse(429)));
		const result = await searchTavily("fail");
		expect(result.results).toEqual([]);
		expect(result.error).toContain("429");
	});

	it("handles network error", async () => {
		vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ETIMEDOUT")));
		const result = await searchTavily("fail");
		expect(result.results).toEqual([]);
		expect(result.error).toContain("ETIMEDOUT");
	});
});
