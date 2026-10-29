import { Game } from "./Utils";

Game.load("../Scripts/Game.js");
Game.load("../Scripts/Common.js");
Game.load("../Scripts/ImageCache.js");


function deferred<T = unknown>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

/** Let every pending promise chain settle */
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function makeBitmap(width = 32, height = 16) {
	return { width, height, close: jest.fn() };
}

function makeBlob() {
	return new Blob(["png"], { type: "image/png" });
}

function okResponse(blob = makeBlob()) {
	return {
		ok: true,
		status: 200,
		headers: { get: (name: string) => name.toLowerCase() === "content-type" ? blob.type : null },
		blob: jest.fn(async () => blob),
	} as unknown as Response;
}

function errorResponse(status: number) {
	return { ok: false, status, blob: jest.fn(async () => makeBlob()) } as unknown as Response;
}

const URL_A = "https://example.test/images/a.png";
const URL_B = "https://example.test/images/b.png";

let cache: ImageCache<{ width: number, height: number, close?: () => void }>;
let now: number;
let createImageBitmap: jest.Mock;

beforeEach(() => {
	now = 1_000_000;

	Game.CommonFetch = jest.fn();
	Game.CommonTime = jest.fn(() => now);
	Game.CurrentTime = now;
	Game.Character = [];
	// eslint-disable-next-line no-global-assign
	createImageBitmap = jest.fn(async () => makeBitmap());
	Game.createImageBitmap = createImageBitmap;

	jest.spyOn(console, "log").mockImplementation(() => undefined);
	jest.spyOn(console, "warn").mockImplementation(() => undefined);
	jest.spyOn(console, "error").mockImplementation(() => undefined);

	cache = makeCache();
});

function makeCache(browserCache: BrowserCache | null = null) {
	return new Game.ImageCacheClass("test", browserCache, {
		decode: (blob: Blob) => Game.createImageBitmap(blob, { premultiplyAlpha: "none" }),
		dispose: (data: { close?: () => void }) => { data.close?.(); },
	});
}

afterEach(() => {
	// @ts-expect-error
	delete Game.caches;
	// @ts-expect-error
	delete Game.Request;
	jest.restoreAllMocks();
});

describe("get() over the network", () => {
	it("dedupes in-flight loads to one CommonFetch and one entry", async () => {
		Game.CommonFetch.mockReturnValue(deferred().promise);

		const first = cache.get(URL_A);
		const second = cache.get(URL_A);
		await flush();

		expect(second).toBe(first);
		expect(Game.CommonFetch).toHaveBeenCalledTimes(1);
		expect(Game.CommonFetch).toHaveBeenCalledWith(URL_A);
		expect(first.state).toBe(Game.CachedImageState.LOADING);
		expect(first.isLoading()).toBe(true);
		expect(first.lastUsed).toBe(now);
		expect(cache.totalImages()).toBe(1);
		expect(cache.has(URL_A)).toBe(true);
	});

	it("stores an ImageBitmap on success", async () => {
		const blob = makeBlob();
		const bitmap = makeBitmap(100, 50);
		Game.CommonFetch.mockResolvedValue(okResponse(blob));
		createImageBitmap.mockResolvedValue(bitmap);

		const img = cache.get(URL_A);
		expect(img.data).toBeNull();
		await flush();

		expect(img.state).toBe(Game.CachedImageState.LOADED);
		expect(img.isLoaded()).toBe(true);
		expect(img.data).toBe(bitmap);
		expect(Game.createImageBitmap).toHaveBeenCalledWith(blob, { premultiplyAlpha: "none" });

		expect(img.width).toBe(100);
		expect(img.height).toBe(50);
	});

	it("does not reload an already loaded image", async () => {
		Game.CommonFetch.mockResolvedValue(okResponse());
		const img = cache.get(URL_A);
		await flush();

		expect(cache.get(URL_A)).toBe(img);
		await flush();
		expect(Game.CommonFetch).toHaveBeenCalledTimes(1);
	});

	it("ends FAILED when CommonFetch rejects", async () => {
		Game.CommonFetch.mockRejectedValue(new TypeError("network down"));

		const img = cache.get(URL_A);
		await flush();

		expect(img.state).toBe(Game.CachedImageState.FAILED);
		expect(img.isDoneLoading()).toBe(true);
		expect(img.isFailing()).toBe(true);
		expect(img.isLoaded()).toBe(false);
		expect(img.data).toBeNull();
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining("Failed to load image " + URL_A),
			expect.any(TypeError),
		);
		expect(Game.createImageBitmap).not.toHaveBeenCalled();

		// FAILED is final: no further fetches
		cache.get(URL_A);
		await flush();
		expect(Game.CommonFetch).toHaveBeenCalledTimes(1);
		expect(img.state).toBe(Game.CachedImageState.FAILED);
	});

	it("ends FAILED when the response is not ok", async () => {
		Game.CommonFetch.mockResolvedValue(errorResponse(404));

		const img = cache.get(URL_A);
		await flush();

		expect(img.state).toBe(Game.CachedImageState.FAILED);
		expect(Game.createImageBitmap).not.toHaveBeenCalled();
	});

	it("ends FAILED when the response is not an image", async () => {
		Game.CommonFetch.mockResolvedValue(okResponse(new Blob(["<!DOCTYPE html>"], { type: "text/html;charset=UTF-8" })));

		const img = cache.get(URL_A);
		await flush();

		expect(img.state).toBe(Game.CachedImageState.FAILED);
		expect(img.data).toBeNull();
		expect(Game.createImageBitmap).not.toHaveBeenCalled();
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining("Failed to load image " + URL_A),
			expect.objectContaining({ message: expect.stringContaining("text/html") }),
		);
	});

	it("ends FAILED when the bytes cannot be decoded", async () => {
		Game.CommonFetch.mockResolvedValue(okResponse());
		createImageBitmap.mockRejectedValue(new DOMException("bad image", "InvalidStateError"));

		const img = cache.get(URL_A);
		await flush();

		expect(img.state).toBe(Game.CachedImageState.FAILED);
		expect(img.data).toBeNull();
		expect(console.error).toHaveBeenCalledWith(
			expect.stringContaining("Failed to load image " + URL_A),
			expect.any(DOMException),
		);
	});
});

describe("dropping in-flight loads", () => {
	it("a delete before the fetch resolves discards the result", async () => {
		const fetchResult = deferred<{ ok: boolean, status: number, blob: () => Promise<Blob> }>();
		Game.CommonFetch.mockReturnValue(fetchResult.promise);

		const img = cache.get(URL_A);
		cache.delete(URL_A);
		expect(cache.has(URL_A)).toBe(false);
		expect(img.state).toBe(Game.CachedImageState.UNCACHED);

		fetchResult.resolve(okResponse());
		await flush();

		expect(Game.createImageBitmap).not.toHaveBeenCalled();
		expect(img.state).toBe(Game.CachedImageState.UNCACHED);
		expect(img.data).toBeNull();
		expect(cache.totalImages()).toBe(0);
	});

	it("an unload while the bitmap is being created closes it", async () => {
		const bitmap = makeBitmap();
		const bitmapResult = deferred<ReturnType<typeof makeBitmap>>();
		Game.CommonFetch.mockResolvedValue(okResponse());
		createImageBitmap.mockReturnValue(bitmapResult.promise);

		const img = cache.get(URL_A);
		await flush();
		expect(Game.createImageBitmap).toHaveBeenCalledTimes(1);

		img.unload();
		bitmapResult.resolve(bitmap);
		await flush();

		expect(bitmap.close).toHaveBeenCalledTimes(1);
		expect(img.data).toBeNull();
		expect(img.state).toBe(Game.CachedImageState.UNCACHED);
	});

	it("a failure arriving after a delete is ignored", async () => {
		const fetchResult = deferred();
		Game.CommonFetch.mockReturnValue(fetchResult.promise);

		const img = cache.get(URL_A);
		cache.delete(URL_A);
		fetchResult.reject(new Error("late"));
		await flush();

		expect(img.state).toBe(Game.CachedImageState.UNCACHED);
		expect(console.error).not.toHaveBeenCalled();
	});
});

describe("background updates from the persistent store", () => {
	/** Stub the store so the test controls when a revalidation arrives */
	function stubFetch() {
		const cached = okResponse();
		const resolvers: Array<(response: Response | null) => void> = [];
		const match = jest.fn(async () => cached);
		const revalidate = jest.fn(() => new Promise<Response | null>((resolve) => {
			resolvers.push(resolve);
		}));
		const remove = jest.fn(async () => true);
		cache.browserCache = { match, revalidate, put: jest.fn(), delete: remove } as unknown as BrowserCache;
		return {
			revalidate,
			remove,
			update: (response: Response, index = resolvers.length - 1) => resolvers[index](response),
		};
	}

	it("revalidates a cached image without waiting on it", async () => {
		const rc = stubFetch();
		const img = cache.get(URL_A);
		await flush();

		expect(rc.revalidate).toHaveBeenCalledWith(URL_A, expect.anything());
		expect(img.isLoaded()).toBe(true);
	});

	it("swaps the bitmap in and rebuilds what depended on the old one", async () => {
		const rc = stubFetch();
		const oldBitmap = makeBitmap(10, 10);
		const newBitmap = makeBitmap(20, 20);
		createImageBitmap.mockResolvedValueOnce(oldBitmap).mockResolvedValueOnce(newBitmap);

		const img = cache.get(URL_A);
		await flush();
		expect(img.data).toBe(oldBitmap);

		const freshBlob = makeBlob();
		rc.update(okResponse(freshBlob));
		await flush();

		expect(Game.createImageBitmap).toHaveBeenLastCalledWith(freshBlob, { premultiplyAlpha: "none" });
		expect(oldBitmap.close).toHaveBeenCalledTimes(1);
		expect(img.data).toBe(newBitmap);
		expect(img.state).toBe(Game.CachedImageState.LOADED);
		expect(img.width).toBe(20);
	});

	it("marks characters wearing an updated asset for redraw", async () => {
		const rc = stubFetch();
		const wearing = { Appearance: [{ Asset: { Name: "Cloth", Group: { Name: "Cloth" } } }], MustDraw: false };
		Game.Character = [wearing];

		cache.get("Assets/Female3DCG/Cloth/Cloth_Red.png");
		await flush();
		wearing.MustDraw = false;

		rc.update(okResponse());
		await flush();

		expect(wearing.MustDraw).toBe(true);
	});

	it("drops an update for an image that was unloaded meanwhile", async () => {
		const rc = stubFetch();
		const newBitmap = makeBitmap();

		const img = cache.get(URL_A);
		await flush();
		cache.delete(URL_A);

		createImageBitmap.mockResolvedValueOnce(newBitmap);
		rc.update(okResponse());
		await flush();

		expect(newBitmap.close).toHaveBeenCalledTimes(1);
		expect(img.data).toBeNull();
		expect(img.state).toBe(Game.CachedImageState.UNCACHED);
	});

	it("drops an update that arrives after a reload", async () => {
		const rc = stubFetch();
		const img = cache.get(URL_A);
		await flush();

		// Unload and reload: a new generation, with its own revalidation
		img.unload();
		cache.get(URL_A);
		await flush();
		const reloaded = img.data;
		expect(rc.revalidate).toHaveBeenCalledTimes(2);

		const stale = makeBitmap();
		createImageBitmap.mockResolvedValueOnce(stale);
		rc.update(okResponse(), 0);
		await flush();

		expect(stale.close).toHaveBeenCalledTimes(1);
		expect(img.data).toBe(reloaded);
	});

	it("keeps the current bitmap if the update is not an image", async () => {
		const rc = stubFetch();
		const img = cache.get(URL_A);
		await flush();
		const current = img.data;

		rc.update(okResponse(new Blob(["<!DOCTYPE html>"], { type: "text/html" })));
		await flush();

		expect(img.data).toBe(current);
		expect(img.isLoaded()).toBe(true);
		expect(rc.remove).toHaveBeenCalledWith(URL_A);
		expect(Game.createImageBitmap).toHaveBeenCalledTimes(1);
		expect(console.warn).not.toHaveBeenCalled();
	});

	it("keeps the current bitmap if the update cannot be decoded", async () => {
		const rc = stubFetch();
		const img = cache.get(URL_A);
		await flush();
		const current = img.data;

		createImageBitmap.mockRejectedValueOnce(new DOMException("bad", "InvalidStateError"));
		rc.update(okResponse());
		await flush();

		expect(img.data).toBe(current);
		expect(img.isLoaded()).toBe(true);
		expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Failed to update image: " + URL_A), expect.any(DOMException));
	});

	it("applies an update that arrives while the first decode is still in flight", async () => {
		const rc = stubFetch();
		const loadBitmap = deferred<ReturnType<typeof makeBitmap>>();
		const fresh = makeBitmap(20, 20);
		createImageBitmap
			.mockReturnValueOnce(loadBitmap.promise)
			.mockResolvedValueOnce(fresh);

		const img = cache.get(URL_A);
		await flush();
		expect(img.isLoading()).toBe(true);

		rc.update(okResponse());
		await flush();

		expect(img.data).toBe(fresh);
		expect(img.isLoaded()).toBe(true);

		const stale = makeBitmap(10, 10);
		loadBitmap.resolve(stale);
		await flush();

		expect(stale.close).toHaveBeenCalledTimes(1);
		expect(img.data).toBe(fresh);
	});

	it("recovers a FAILED entry when revalidation returns new bytes", async () => {
		const rc = stubFetch();
		createImageBitmap.mockRejectedValueOnce(new DOMException("bad", "InvalidStateError"));

		const img = cache.get(URL_A);
		await flush();
		expect(img.isFailing()).toBe(true);

		const recovered = makeBitmap(12, 8);
		createImageBitmap.mockResolvedValueOnce(recovered);
		rc.update(okResponse());
		await flush();

		expect(img.isLoaded()).toBe(true);
		expect(img.data).toBe(recovered);
		expect(img.width).toBe(12);
	});

	it("does not mark FAILED if a late load error arrives after an update", async () => {
		const rc = stubFetch();
		const loadBitmap = deferred<ReturnType<typeof makeBitmap>>();
		const fresh = makeBitmap(20, 20);
		createImageBitmap
			.mockReturnValueOnce(loadBitmap.promise)
			.mockResolvedValueOnce(fresh);

		const img = cache.get(URL_A);
		await flush();

		rc.update(okResponse());
		await flush();
		expect(img.isLoaded()).toBe(true);

		loadBitmap.reject(new DOMException("late", "InvalidStateError"));
		await flush();

		expect(img.isLoaded()).toBe(true);
		expect(img.data).toBe(fresh);
		expect(console.error).not.toHaveBeenCalled();
	});
});

describe("unload()", () => {
	it("releases a network-loaded image", async () => {
		const bitmap = makeBitmap();
		Game.CommonFetch.mockResolvedValue(okResponse());
		createImageBitmap.mockResolvedValue(bitmap);

		const img = cache.get(URL_A);
		await flush();

		img.unload();

		expect(bitmap.close).toHaveBeenCalledTimes(1);
		expect(img.data).toBeNull();
		expect(img.state).toBe(Game.CachedImageState.UNCACHED);
		expect(img.width).toBe(0);
	});

	it("can be reloaded afterwards", async () => {
		Game.CommonFetch.mockResolvedValue(okResponse());
		const img = cache.get(URL_A);
		await flush();
		img.unload();

		expect(cache.get(URL_A)).toBe(img);
		await flush();

		expect(Game.CommonFetch).toHaveBeenCalledTimes(2);
		expect(img.isLoaded()).toBe(true);
		expect(img.data).not.toBeNull();
	});

	it("is a no-op on an UNCACHED image", () => {
		const img = new Game.CachedImageClass(cache, URL_A);
		img.unload();
		expect(img.data).toBeNull();
	});
});

describe("cache bookkeeping", () => {
	it("delete() unloads loaded and failed entries", async () => {
		Game.CommonFetch.mockImplementation(async (url: string) =>
			url === URL_A ? okResponse() : errorResponse(500));

		const a = cache.get(URL_A);
		const b = cache.get(URL_B);
		await flush();
		expect(a.isLoaded()).toBe(true);
		expect(b.isFailing()).toBe(true);

		cache.delete(URL_A);
		expect(a.state).toBe(Game.CachedImageState.UNCACHED);
		expect(cache.has(URL_A)).toBe(false);
		expect(cache.has(URL_B)).toBe(true);

		cache.delete(URL_B);
		expect(b.state).toBe(Game.CachedImageState.UNCACHED);
		expect(cache.totalImages()).toBe(0);

		// Unknown URLs are ignored
		cache.delete("nope");
	});

	it("clear() unloads everything", async () => {
		const bitmap = makeBitmap();
		Game.CommonFetch.mockResolvedValue(okResponse());
		createImageBitmap.mockResolvedValue(bitmap);

		const a = cache.get(URL_A);
		const b = cache.get(URL_B);
		await flush();

		cache.clear();

		expect(a.state).toBe(Game.CachedImageState.UNCACHED);
		expect(b.state).toBe(Game.CachedImageState.UNCACHED);
		expect(bitmap.close).toHaveBeenCalledTimes(2);
		expect(cache.totalImages()).toBe(0);
	});

	it("forEach() visits every entry with its URL", () => {
		Game.CommonFetch.mockReturnValue(deferred().promise);
		const a = cache.get(URL_A);
		const b = cache.get(URL_B);
		const seen: [string, CachedImage<{ width: number, height: number }>][] = [];
		cache.forEach((img, url) => seen.push([url, img]));
		expect(seen).toEqual([[URL_A, a], [URL_B, b]]);
	});

	it("stats() reports counts derived from the entries", async () => {
		Game.CommonFetch.mockImplementation(async (url: string) =>
			url === URL_A ? okResponse() : errorResponse(404));
		cache.get(URL_A);
		cache.get(URL_B);
		await flush();

		cache.stats();

		expect(console.log).toHaveBeenCalledWith("Cache test stats: total: 2, loaded: 1, missing: 1, gen0: 1");
	});
});

describe("purge()", () => {
	const delay = 60 * 60 * 1000;

	it("removes failed and stale entries but keeps fresh ones", async () => {
		const stale = "https://example.test/images/stale.png";
		Game.CommonFetch.mockImplementation(async (url: string) =>
			url === URL_B ? errorResponse(404) : okResponse());

		const staleImg = cache.get(stale);
		cache.get(URL_B);
		await flush();

		// Move time forward past half a purge delay, then touch a fresh image
		now += delay / 2 + 1;
		Game.CurrentTime = now;
		cache.get(URL_A);
		await flush();

		expect(cache.totalImages()).toBe(3);
		cache.lastPurge = now - delay - 1;
		cache.purge();

		expect(cache.has(URL_A)).toBe(true);
		expect(cache.has(URL_B)).toBe(false);
		expect(cache.has(stale)).toBe(false);
		expect(staleImg.state).toBe(Game.CachedImageState.UNCACHED);
		expect(cache.lastPurge).toBe(now);
		expect(cache.totalImages()).toBe(1);
		expect(console.log).toHaveBeenCalledWith("Cache test purged, 2 images removed");
	});

	it("skips a purge that comes too soon unless forced", async () => {
		Game.CommonFetch.mockResolvedValue(errorResponse(404));
		cache.get(URL_A);
		await flush();

		cache.lastPurge = now - 1000;
		cache.purge();
		expect(cache.has(URL_A)).toBe(true);

		cache.purge(true);
		expect(cache.has(URL_A)).toBe(false);
	});
});

describe("character refresh for assets", () => {
	function wearer(group: string, asset: string) {
		return { Appearance: [{ Asset: { Name: asset, Group: { Name: group } } }], MustDraw: false };
	}

	it("marks characters wearing a loaded asset", async () => {
		const wearing = wearer("Cloth", "Cloth");
		const other = wearer("Hat", "Hat");
		Game.Character = [wearing, other];
		Game.CommonFetch.mockResolvedValue(okResponse());

		cache.get("Assets/Female3DCG/Cloth/Cloth_Red.png");
		await flush();

		expect(wearing.MustDraw).toBe(true);
		expect(other.MustDraw).toBe(false);
	});

	it("also refreshes on failure so a fallback gets drawn", async () => {
		const wearing = wearer("Cloth", "Cloth");
		Game.Character = [wearing];
		Game.CommonFetch.mockResolvedValue(errorResponse(404));

		cache.get("Assets/Female3DCG/Cloth/Cloth_Red.png");
		await flush();

		expect(wearing.MustDraw).toBe(true);
	});

	it("understands override and pose directories", async () => {
		const overridden = wearer("Cloth", "Cloth");
		const posed = wearer("Shoes", "Boots");
		Game.Character = [overridden, posed];
		Game.CommonFetch.mockResolvedValue(okResponse());

		cache.get("https://example.test/Assets/Female3DCG/Override/Some/Cloth/Cloth_Red.png");
		cache.get("Assets/Female3DCG/Shoes/Kneel/Boots_Black.png");
		await flush();

		expect(overridden.MustDraw).toBe(true);
		expect(posed.MustDraw).toBe(true);
	});

	it("ignores a query string or hash on the file name", async () => {
		const wearing = wearer("Cloth", "Cloth");
		Game.Character = [wearing];
		Game.CommonFetch.mockResolvedValue(okResponse());

		cache.get("Assets/Female3DCG/Cloth/Cloth_Red.png?v=2#x");
		await flush();

		expect(wearing.MustDraw).toBe(true);
	});

	it("matches on the dynamic group name too", async () => {
		const dyn = { Appearance: [{ Asset: { Name: "Cloth", Group: { Name: "Other" }, DynamicGroupName: "Cloth" } }], MustDraw: false };
		Game.Character = [dyn];
		Game.CommonFetch.mockResolvedValue(okResponse());

		cache.get("Assets/Female3DCG/Cloth/Cloth_Red.png");
		await flush();

		expect(dyn.MustDraw).toBe(true);
	});

	it("ignores non-asset URLs and non-Female3DCG assets", async () => {
		const wearing = wearer("Cloth", "Cloth");
		Game.Character = [wearing];
		Game.CommonFetch.mockResolvedValue(okResponse());

		cache.get("Backgrounds/Cloth_Red.png");
		cache.get("Assets/Other/Cloth/Cloth_Red.png");
		await flush();

		expect(wearing.MustDraw).toBe(false);
	});
});

describe("with the real CommonFetch", () => {
	let mockFetch: jest.Mock<Promise<Response>, [url: RequestInfo | URL, options?: RequestInit]>;

	beforeEach(() => {
		mockFetch = jest.fn();
		Game.CommonSleep = jest.fn(() => Promise.resolve());
		Game.CommonFetch = async (request: RequestInfo | URL) => {
			const asRequest = request as Request;
			const isRequestObject = typeof request === "object" && request !== null && "url" in request;
			const method = isRequestObject ? asRequest.method : "GET";
			const url = isRequestObject ? asRequest.url : request;

			for (let attempt = 0; attempt <= Game.FETCH_MAX_RETRIES; attempt++) {
				let retryAfter: number | null | undefined;
				let reply: Response | undefined;
				try {
					reply = await mockFetch(request);

					if (!Game.CommonRequestShouldRetry(reply.status)) {
						return reply;
					}

					if (attempt === Game.FETCH_MAX_RETRIES) {
						console.error(`${method} request to ${url} failed (${reply.status}) - no more retries`);
						return reply;
					}

					retryAfter = Game.CommonRequestParseRetryAfter(reply.headers.get("Retry-After"));
				} catch (err) {
					if (attempt === Game.FETCH_MAX_RETRIES) {
						throw err;
					}
				}

				const delay = retryAfter ?? Game.CommonRequestRetryDelay(attempt);
				if (attempt !== Game.FETCH_MAX_RETRIES) {
					console.error(`${method} request to ${url} failed (${reply?.status}) - retrying in ${delay.toFixed(1)}s`);
				}
				await Game.CommonSleep(delay * 1000);
			}

			throw new Error("CommonFetch exhausted retry loop unexpectedly");
		};
	});

	function response(status: number, blob = makeBlob(), retryAfter: string | null = null) {
		return {
			ok: status >= 200 && status < 300,
			status,
			headers: { get: (name: string) => (name === "Retry-After" ? retryAfter : null) },
			blob: jest.fn(async () => blob),
		} as unknown as Response;
	}

	it("a 500 followed by a 200 ends LOADED", async () => {
		mockFetch
			.mockResolvedValueOnce(response(500))
			.mockResolvedValueOnce(response(200));

		const img = cache.get(URL_A);
		await flush();

		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(mockFetch).toHaveBeenCalledWith(URL_A);
		expect(Game.CommonSleep).toHaveBeenCalledTimes(1);
		expect(img.state).toBe(Game.CachedImageState.LOADED);
	});

	it("a 404 ends FAILED after a single attempt", async () => {
		mockFetch.mockResolvedValue(response(404));

		const img = cache.get(URL_A);
		await flush();

		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(Game.CommonSleep).not.toHaveBeenCalled();
		expect(img.state).toBe(Game.CachedImageState.FAILED);
	});

	it("a fetch that keeps throwing ends FAILED once retries run out", async () => {
		mockFetch.mockRejectedValue(new TypeError("offline"));

		const img = cache.get(URL_A);
		await flush();

		expect(mockFetch).toHaveBeenCalledTimes(Game.FETCH_MAX_RETRIES + 1);
		expect(img.state).toBe(Game.CachedImageState.FAILED);
	});

	it("a server that keeps erroring ends FAILED once retries run out", async () => {
		mockFetch.mockResolvedValue(response(503, makeBlob(), "0"));

		const img = cache.get(URL_A);
		await flush();

		expect(mockFetch).toHaveBeenCalledTimes(Game.FETCH_MAX_RETRIES + 1);
		expect(img.state).toBe(Game.CachedImageState.FAILED);
	});
});

/** Just enough of a Response for what the persistent store reads */
class StoreResponse {
	status: number;
	ok: boolean;
	body: string;
	_headers: Map<string, string>;
	headers: { get: (name: string) => string | null };

	constructor(status: number, { headers = {}, body = "" }: { headers?: Record<string, string>, body?: string } = {}) {
		this.status = status;
		this.ok = status >= 200 && status < 300;
		this.body = body;
		this._headers = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
		this.headers = { get: name => this._headers.get(name.toLowerCase()) ?? null };
	}
	clone() {
		return new StoreResponse(this.status, { headers: Object.fromEntries(this._headers), body: this.body });
	}
	async blob() { return this.body; }
}

/** The double only implements what the store reads. */
function asResponse(response: StoreResponse): Response {
	return response as unknown as Response;
}

class FakeCache {
	store = new Map<string, StoreResponse>();
	put = jest.fn(async (key: string, response: StoreResponse) => { this.store.set(key, response); });
	async match(key: string) {
		const hit = this.store.get(key);
		return hit ? hit.clone() : undefined;
	}
	async keys() {
		return [...this.store.keys()].map((url) => ({ url }));
	}
	delete = jest.fn(async (request: { url: string } | string) => {
		const url = typeof request === "string" ? request : request.url;
		return this.store.delete(url);
	});
}

class FakeCacheStorage {
	caches = new Map<string, FakeCache>();
	open = jest.fn(async (name: string) => {
		let entry = this.caches.get(name);
		if (!entry) {
			entry = new FakeCache();
			this.caches.set(name, entry);
		}
		return entry;
	});
	delete = jest.fn(async (name: string) => this.caches.delete(name));
}

class FakeRequest {
	url: string;
	method: string;
	headers: Map<string, string>;

	constructor(url: string, init: { method?: string, headers?: Record<string, string> } = {}) {
		this.url = url;
		this.method = init.method ?? "GET";
		this.headers = new Map(Object.entries(init.headers ?? {}));
	}
}

describe("persistent store", () => {
	const LAST_MODIFIED = "Wed, 01 Jan 2025 00:00:00 GMT";
	const INTERSTITIAL = "private, no-cache, no-store, must-revalidate, max-age=0";
	const URL_V122 = "https://frontend.server/R122/Game/Assets/Female3DCG/Cloth/Cloth_Red.png";
	const URL_V123 = "https://frontend.server/R123/Game/Assets/Female3DCG/Cloth/Cloth_Red.png";
	const KEY = "https://frontend.server/Game/Assets/Female3DCG/Cloth/Cloth_Red.png";

	let storage: FakeCacheStorage;

	/** The cache bucket the script uses, creating it if needed */
	async function bucket() {
		return storage.open(cache.browserCache!.name);
	}

	beforeEach(async () => {
		storage = new FakeCacheStorage();
		// @ts-expect-error
		Game.caches = storage;
		// @ts-expect-error
		Game.Request = FakeRequest;
		cache = makeCache(await Game.BrowserCacheClass.open());
	});

	describe("key", () => {
		it("drops the release directory, query string and fragment", () => {
			expect(cache.browserCache!.key(URL_V123 + "?v=2#frag")).toBe(KEY);
			expect(cache.browserCache!.key(URL_V122)).toBe(KEY);
		});

		it("accepts suffixed release names", () => {
			expect(cache.browserCache!.key("https://frontend.server/R123Beta2/Game/Assets/x.png"))
				.toBe("https://frontend.server/Game/Assets/x.png");
		});

		it("leaves paths that merely start with R alone", () => {
			expect(cache.browserCache!.key("https://frontend.server/Resources/x.png"))
				.toBe("https://frontend.server/Resources/x.png");
		});

		it("only strips a release directory at the root of the path", () => {
			expect(cache.browserCache!.key("https://frontend.server/R123/Game/Assets/R2/x.png"))
				.toBe("https://frontend.server/Game/Assets/R2/x.png");
			expect(cache.browserCache!.key("https://frontend.server/Game/R123/x.png"))
				.toBe("https://frontend.server/Game/R123/x.png");
		});

		it("resolves relative URLs against the page", () => {
			expect(cache.browserCache!.key("Assets/x.png")).toBe("http://localhost/Assets/x.png");
		});
	});

	describe("put", () => {
		it("stores a clone and leaves the response the caller holds", async () => {
			const response = new StoreResponse(200, { body: "png", headers: { "Last-Modified": LAST_MODIFIED } });

			await cache.browserCache!.put(URL_V123, asResponse(response));

			const store = await bucket();
			expect(store.put).toHaveBeenCalledTimes(1);
			const stored = store.store.get(KEY);
			expect(stored).not.toBe(response);
			expect(stored!.body).toBe("png");
			expect(response.body).toBe("png");
			expect(stored!.headers.get("Last-Modified")).toBe(LAST_MODIFIED);
		});

		it("marks the key revalidated so a later check does not hit the network", async () => {
			await cache.browserCache!.put(URL_V123, asResponse(new StoreResponse(200, { body: "png" })));

			const cached = await cache.browserCache!.match(URL_V123);
			await cache.browserCache!.revalidate(URL_V123, cached!);
			await flush();

			expect(cached!.body).toBe("png");
			expect(Game.CommonFetch).not.toHaveBeenCalled();
		});

		it("does not store a response the server marked uncacheable", async () => {
			await cache.browserCache!.put(URL_V123, asResponse(new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: { "Content-Type": "text/html", "Cache-Control": INTERSTITIAL },
			})));

			expect((await bucket()).store.size).toBe(0);
		});

		it("stores a cacheable response whatever its media type", async () => {
			await cache.browserCache!.put(URL_V123, asResponse(new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=31536000" },
			})));

			expect((await bucket()).store.get(KEY)!.body).toBe("<!DOCTYPE html>");
		});

		it("does not store failures or partial content", async () => {
			await cache.browserCache!.put(URL_V123, asResponse(new StoreResponse(404)));
			await cache.browserCache!.put(URL_V123, asResponse(new StoreResponse(206, { body: "part" })));

			expect((await bucket()).store.size).toBe(0);
		});

		it("survives a storage failure", async () => {
			const response = new StoreResponse(200, { body: "png" });
			const store = await bucket();
			store.put.mockRejectedValue(new DOMException("full", "QuotaExceededError"));

			await expect(cache.browserCache!.put(URL_V123, asResponse(response))).resolves.toBeUndefined();

			expect(response.body).toBe("png");
			expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Failed to cache image"), expect.any(DOMException));
		});
	});

	describe("cache hit", () => {
		/** Put an old copy in the bucket, as a previous session would have */
		async function seed(body = "old") {
			const store = await bucket();
			store.store.set(KEY, new StoreResponse(200, { body, headers: { "Last-Modified": LAST_MODIFIED } }));
			return store;
		}

		it("serves the cached copy without waiting on the network", async () => {
			await seed();
			Game.CommonFetch.mockReturnValue(new Promise(() => {}));

			const result = await cache.browserCache!.match(URL_V123);
			void cache.browserCache!.revalidate(URL_V123, result!);

			expect(result!.status).toBe(200);
			expect(result!.body).toBe("old");
		});

		it("revalidates once with a conditional request", async () => {
			await seed();
			Game.CommonFetch.mockResolvedValue(new StoreResponse(304));
			const cached = await cache.browserCache!.match(URL_V123);

			const first = cache.browserCache!.revalidate(URL_V123, cached!);
			const second = cache.browserCache!.revalidate(URL_V123, cached!);
			await flush();

			expect(second).toBe(first);
			await expect(first).resolves.toBeNull();
			expect(Game.CommonFetch).toHaveBeenCalledTimes(1);
			const request = Game.CommonFetch.mock.calls[0][0];
			expect(request).toBeInstanceOf(FakeRequest);
			expect(request.url).toBe(URL_V123);
			expect(request.headers.get("If-Modified-Since")).toBe(LAST_MODIFIED);
			expect(request.headers.has("If-None-Match")).toBe(false);
			expect((await bucket()).store.get(KEY)!.body).toBe("old");
		});

		it("sends If-None-Match when an ETag was stored", async () => {
			const store = await bucket();
			store.store.set(KEY, new StoreResponse(200, { body: "old", headers: { ETag: '"abc"' } }));
			Game.CommonFetch.mockResolvedValue(new StoreResponse(304));

			const cached = await cache.browserCache!.match(URL_V123);
			await cache.browserCache!.revalidate(URL_V123, cached!);
			await flush();

			const request = Game.CommonFetch.mock.calls[0][0];
			expect(request.headers.get("If-None-Match")).toBe('"abc"');
			expect(request.headers.has("If-Modified-Since")).toBe(false);
		});

		it("replaces the entry and reports a 200", async () => {
			await seed();
			const fresh = new StoreResponse(200, { body: "new", headers: { "Last-Modified": "Thu, 02 Jan 2025 00:00:00 GMT" } });
			Game.CommonFetch.mockResolvedValue(fresh);

			const cached = await cache.browserCache!.match(URL_V123);
			const delivered = await cache.browserCache!.revalidate(URL_V123, cached!);

			expect(cached!.body).toBe("old");
			expect(delivered).toBe(fresh);
			expect((await bucket()).store.get(KEY)).not.toBe(fresh);
			expect((await bucket()).store.get(KEY)!.body).toBe("new");
		});

		it("ignores a failed revalidation and keeps the cached copy", async () => {
			await seed();
			Game.CommonFetch
				.mockRejectedValueOnce(new TypeError("offline"));

			const cached = await cache.browserCache!.match(URL_V123);
			await expect(cache.browserCache!.revalidate(URL_V123, cached!)).resolves.toBeNull();

			expect(cached!.body).toBe("old");
			expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Failed to revalidate image \"" + URL_V123), expect.any(TypeError));
			expect((await bucket()).store.get(KEY)!.body).toBe("old");
		});

		it("does not replace the entry with an error response", async () => {
			await seed();
			Game.CommonFetch.mockResolvedValue(new StoreResponse(500));

			const cached = await cache.browserCache!.match(URL_V123);
			await expect(cache.browserCache!.revalidate(URL_V123, cached!)).resolves.toBeNull();

			expect((await bucket()).store.get(KEY)!.body).toBe("old");
		});

		it("does not replace a stored image with an uncacheable response", async () => {
			await seed();
			Game.CommonFetch.mockResolvedValue(new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: { "Content-Type": "text/html", "Cache-Control": INTERSTITIAL },
			}));

			const cached = await cache.browserCache!.match(URL_V123);
			await expect(cache.browserCache!.revalidate(URL_V123, cached!)).resolves.toBeNull();

			expect(cached!.body).toBe("old");
			expect((await bucket()).store.get(KEY)!.body).toBe("old");
		});

		it("replaces a stored response with a cacheable one of any media type", async () => {
			await seed();
			const fresh = new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=31536000" },
			});
			Game.CommonFetch.mockResolvedValue(fresh);

			const cached = await cache.browserCache!.match(URL_V123);
			await expect(cache.browserCache!.revalidate(URL_V123, cached!)).resolves.toBe(fresh);

			expect((await bucket()).store.get(KEY)!.body).toBe("<!DOCTYPE html>");
		});

		it("does not replace a stored response with an uncacheable image", async () => {
			await seed();
			Game.CommonFetch.mockResolvedValue(new StoreResponse(200, {
				body: "new",
				headers: { "Content-Type": "image/png", "Cache-Control": "no-cache, max-age=0" },
			}));

			const cached = await cache.browserCache!.match(URL_V123);
			await expect(cache.browserCache!.revalidate(URL_V123, cached!)).resolves.toBeNull();

			expect((await bucket()).store.get(KEY)!.body).toBe("old");
		});

		it("replaces a stored non-image when revalidation returns one", async () => {
			const store = await bucket();
			store.store.set(KEY, new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: {
					"Content-Type": "text/html",
					"Cache-Control": "public, max-age=31536000",
					"Last-Modified": "Thu, 02 Jan 2026 00:00:00 GMT",
					ETag: '"check-page"',
				},
			}));
			const fresh = new StoreResponse(200, {
				body: "png",
				headers: { "Content-Type": "image/png", "Last-Modified": LAST_MODIFIED },
			});
			Game.CommonFetch.mockResolvedValue(fresh);

			const cached = await cache.browserCache!.match(URL_V123);
			const delivered = await cache.browserCache!.revalidate(URL_V123, cached!);

			expect(cached!.body).toBe("<!DOCTYPE html>");
			expect(delivered).toBe(fresh);
			const request = Game.CommonFetch.mock.calls[0][0];
			expect(request.headers.get("If-Modified-Since")).toBe("Thu, 02 Jan 2026 00:00:00 GMT");
			expect(request.headers.get("If-None-Match")).toBe('"check-page"');
			expect(store.store.get(KEY)).not.toBe(fresh);
			expect(store.store.get(KEY)!.body).toBe("png");
		});

		it("finishes an image load that hit a stale text/html entry", async () => {
			const store = await bucket();
			store.store.set(KEY, new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: { "Content-Type": "text/html" },
			}));
			Game.CommonFetch.mockResolvedValue(new StoreResponse(200, {
				body: "png",
				headers: { "Content-Type": "image/png", "Last-Modified": LAST_MODIFIED },
			}));
			createImageBitmap.mockResolvedValue(makeBitmap(8, 8));

			const img = cache.get(URL_V123);
			await flush();

			expect(img.isLoaded()).toBe(true);
			expect(img.data).toEqual(expect.objectContaining({ width: 8, height: 8 }));
			expect(store.store.get(KEY)!.headers.get("Content-Type")).toBe("image/png");
			expect(console.error).not.toHaveBeenCalled();
		});

		it("fails the load when revalidation of a stale text/html entry is not an image", async () => {
			const store = await bucket();
			store.store.set(KEY, new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: { "Content-Type": "text/html" },
			}));
			Game.CommonFetch.mockResolvedValue(new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: { "Content-Type": "text/html", "Cache-Control": INTERSTITIAL },
			}));

			const img = cache.get(URL_V123);
			await flush();

			expect(img.isFailing()).toBe(true);
			expect(store.store.has(KEY)).toBe(false);
			expect(Game.createImageBitmap).not.toHaveBeenCalled();
			expect(console.error).toHaveBeenCalledWith(
				expect.stringContaining("Failed to load image " + URL_V123),
				expect.objectContaining({ message: expect.stringContaining("text/html") }),
			);
		});

		it("clears a cached non-image even when the fresh response is cacheable HTML", async () => {
			const store = await bucket();
			store.store.set(KEY, new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: {
					"Content-Type": "text/html; charset=utf-8",
					"Cache-Control": "public, max-age=31536000",
					"Last-Modified": "Thu, 02 Jan 2026 00:00:00 GMT",
					ETag: '"check-page"',
				},
			}));
			Game.CommonFetch.mockResolvedValue(new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=31536000" },
			}));

			const img = cache.get(URL_V123);
			await flush();

			expect(img.isFailing()).toBe(true);
			expect(store.store.has(KEY)).toBe(false);
			expect(Game.CommonFetch).toHaveBeenCalledWith(URL_V123);
			expect(Game.createImageBitmap).not.toHaveBeenCalled();
		});

		it("clears a cached non-image when the refetch fails", async () => {
			const store = await bucket();
			store.store.set(KEY, new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: {
					"Content-Type": "text/html",
					"Cache-Control": "public, max-age=31536000",
					"Last-Modified": "Thu, 02 Jan 2026 00:00:00 GMT",
				},
			}));
			Game.CommonFetch.mockRejectedValue(new TypeError("offline"));

			const img = cache.get(URL_V123);
			await flush();

			expect(img.isFailing()).toBe(true);
			expect(store.store.has(KEY)).toBe(false);
			expect(Game.createImageBitmap).not.toHaveBeenCalled();
		});

		it("loads an older image that would 304 against a cached check page", async () => {
			const store = await bucket();
			store.store.set(KEY, new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: {
					"Content-Type": "text/html",
					"Cache-Control": "public, max-age=31536000",
					"Last-Modified": "Thu, 02 Jan 2026 00:00:00 GMT",
					ETag: '"check-page"',
				},
			}));
			const image = new StoreResponse(200, {
				body: "png",
				headers: { "Content-Type": "image/png", "Last-Modified": LAST_MODIFIED },
			});
			Game.CommonFetch.mockImplementation((fetched: unknown) => {
				if (fetched instanceof FakeRequest) {
					const headers = fetched.headers;
					if (headers.has("If-Modified-Since") || headers.has("If-None-Match"))
						return new StoreResponse(304);
				}
				return image;
			});
			createImageBitmap.mockResolvedValue(makeBitmap(8, 8));

			const img = cache.get(URL_V123);
			await flush();

			expect(img.isLoaded()).toBe(true);
			expect(img.data).toEqual(expect.objectContaining({ width: 8, height: 8 }));
			expect(Game.CommonFetch).toHaveBeenCalledWith(URL_V123);
			expect(store.store.get(KEY)!.headers.get("Content-Type")).toBe("image/png");
			expect(store.store.get(KEY)!.body).toBe("png");
		});

		it("loads an uncacheable image found in place of a stored non-image and drops that entry", async () => {
			const store = await bucket();
			store.store.set(KEY, new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: {
					"Content-Type": "text/html",
					"Cache-Control": "public, max-age=31536000",
					"Last-Modified": "Thu, 02 Jan 2026 00:00:00 GMT",
					ETag: '"check-page"',
				},
			}));
			Game.CommonFetch.mockResolvedValue(new StoreResponse(200, {
				body: "png",
				headers: { "Content-Type": "image/png", "Cache-Control": "no-cache, max-age=0" },
			}));
			createImageBitmap.mockResolvedValue(makeBitmap(4, 4));

			const img = cache.get(URL_V123);
			await flush();

			expect(img.isLoaded()).toBe(true);
			expect(store.store.has(KEY)).toBe(false);
			expect(Game.CommonFetch).toHaveBeenCalledWith(URL_V123);
		});

		it("does not keep a cacheable non-image fetched on a miss", async () => {
			Game.CommonFetch.mockResolvedValue(new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=31536000" },
			}));

			const img = cache.get(URL_V123);
			await flush();

			expect(img.isFailing()).toBe(true);
			expect((await bucket()).store.size).toBe(0);
		});

		it("drops a cacheable non-image that a revalidation stored over an image", async () => {
			const store = await seed();
			Game.CommonFetch.mockResolvedValue(new StoreResponse(200, {
				body: "<!DOCTYPE html>",
				headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=31536000" },
			}));
			createImageBitmap.mockResolvedValue(makeBitmap(8, 8));

			const img = cache.get(URL_V123);
			await flush();

			expect(img.isLoaded()).toBe(true);
			expect(img.data).toEqual(expect.objectContaining({ width: 8, height: 8 }));
			expect(store.store.has(KEY)).toBe(false);
			expect(console.warn).not.toHaveBeenCalled();
		});

		it("finds an entry stored under a previous release", async () => {
			await seed();
			Game.CommonFetch.mockResolvedValue(new StoreResponse(304));

			// Stored from an R122 URL, requested with R123
			const result = await cache.browserCache!.match(URL_V123);
			await cache.browserCache!.revalidate(URL_V123, result!);

			expect(result!.body).toBe("old");
			expect(Game.CommonFetch).toHaveBeenCalledTimes(1);
			expect(Game.CommonFetch.mock.calls[0][0].url).toBe(URL_V123);
		});
	});

	describe("without a usable Cache API", () => {
		it("leaves browserCache unset when caches is missing", async () => {
			// @ts-expect-error
			delete Game.caches;
			cache = makeCache();
			await flush();

			expect(cache.browserCache).toBeNull();
			expect(console.warn).not.toHaveBeenCalled();

			Game.CommonFetch.mockResolvedValue(okResponse());
			const img = cache.get(URL_A);
			await flush();

			expect(img.isLoaded()).toBe(true);
			expect(Game.CommonFetch).toHaveBeenCalledTimes(1);
			expect(Game.CommonFetch).toHaveBeenCalledWith(URL_A);
		});

		it("BrowserCache.open throws when opening is refused", async () => {
			storage.open.mockRejectedValue(new DOMException("nope", "SecurityError"));
			storage.open.mockClear();

			await expect(Game.BrowserCacheClass.open()).rejects.toBeInstanceOf(DOMException);
			expect(storage.open).toHaveBeenCalledTimes(1);

			cache = makeCache();
			Game.CommonFetch.mockResolvedValue(okResponse());
			cache.get(URL_A);
			cache.get(URL_B);
			await flush();

			expect(storage.open).toHaveBeenCalledTimes(1);
			expect(Game.CommonFetch).toHaveBeenCalledTimes(2);
		});
	});

	describe("origins", () => {
		const MOD = "https://cdn.jsdelivr.net/gh/SugarChain-Studio/echo-clothing-ext@feae46427eb16ab1dc1e29ec1d323a167309e75f/resources/Assets/x.png";

		it("drops entries from other origins and refuses to store new ones", async () => {
			const store = await bucket();
			store.store.set(KEY, new StoreResponse(200, { body: "png" }));
			store.store.set(MOD, new StoreResponse(200, { body: "mod" }));

			const limited = await Game.BrowserCacheClass.open(["https://frontend.server"]);
			// The origin purge walks the bucket in the background, so opening does not wait on it.
			await flush();

			expect(store.store.has(KEY)).toBe(true);
			expect(store.store.has(MOD)).toBe(false);

			await limited.put(MOD, asResponse(new StoreResponse(200, { body: "mod" })));
			expect(store.store.has(MOD)).toBe(false);
			expect(await limited.match(MOD)).toBeUndefined();

			await limited.put(URL_V123, asResponse(new StoreResponse(200, { body: "fresh" })));
			expect(store.store.get(KEY)!.body).toBe("fresh");
		});

		it("leaves every entry in place when no origins were given", async () => {
			const store = await bucket();
			store.store.set(MOD, new StoreResponse(200, { body: "mod" }));

			await Game.BrowserCacheClass.open();

			expect(store.store.has(MOD)).toBe(true);
		});
	});

	describe("clear", () => {
		it("deletes the bucket and forgets what was revalidated", async () => {
			await cache.browserCache!.put(URL_V123, asResponse(new StoreResponse(200, {
				body: "png",
				headers: { "Last-Modified": LAST_MODIFIED },
			})));
			const cached = await cache.browserCache!.match(URL_V123);
			await cache.browserCache!.revalidate(URL_V123, cached!);
			expect(Game.CommonFetch).not.toHaveBeenCalled();
			expect(storage.caches.has(cache.browserCache!.name)).toBe(true);

			await expect(cache.browserCache!.clear()).resolves.toBe(true);

			expect(storage.delete).toHaveBeenCalledWith(cache.browserCache!.name);

			// A previous-session entry in the fresh bucket is checked again
			const reopened = storage.caches.get(cache.browserCache!.name)!;
			reopened.store.set(KEY, new StoreResponse(200, {
				body: "png",
				headers: { "Last-Modified": LAST_MODIFIED },
			}));
			Game.CommonFetch.mockResolvedValue(new StoreResponse(304));
			const again = await cache.browserCache!.match(URL_V123);
			await cache.browserCache!.revalidate(URL_V123, again!);
			expect(Game.CommonFetch).toHaveBeenCalledTimes(1);
			expect(storage.open).toHaveBeenCalledTimes(2);
		});
	});
});
