"use strict";

/**
 * The main BC image cache.
 *
 * Each instance stores a caller-chosen payload in memory (ImageBitmap for 2D,
 * WebGLTextureData for GL) and is backed by the browser Cache API
 * (bc-images-v1 is the cache name).
 *
 * It bypasses the /R\d+/ version slug in the BC urls so that files can be
 * kept around even if the URL changes every release; only their mtime matters.
 *
 * The stored images are also kept on disk: a hit is returned immediately, but
 * will get revalidated and swapped in in the background; a 304 status keeps the
 * entry; a 200 replaces it and the in-memory payload is rebuilt.
 *
 * When the Cache API isn't available, `browserCache` stays unset and fetches fall
 * through to CommonFetch as usual.
 */

/**
 * What state is the image in.
 *
 * - UNCACHED (initial) -> LOADING
 * - LOADING -> LOADED (final)
 * - LOADING -> FAILED (final)
 *
 * @enum {string}
 */
var CachedImageState = {
	/** Image is known, but not yet cached */
	UNCACHED: 'uncached',
	/** Image is currently being loaded */
	LOADING: 'loading',
	/** Image is available in cache */
	LOADED: 'loaded',
	/** Image couldn't be cached */
	FAILED: 'failed',
};

/**
 * Cached image data
 * @template {{ width: number, height: number }} T
 */
class CachedImage {
	/**
	 * Create a new cached image.
	 *
	 * @param {ImageCache<T>} cache - The cache holding the image
	 * @param {string} url - The URL for the image to cache
	 */
	constructor(cache, url) {
		/**
		 * Only used to inform the cache of loading progress
		 * @type {ImageCache<T>}
		 * @private
		 */
		this.cache = cache;
		/** @type {string} */
		this.url = url;
		/** @type {CachedImageState} */
		this.state = CachedImageState.UNCACHED;
		/**
		 * The decoded payload; `null` until decoding completes.
		 * @type {T | null}
		 */
		this.data = null;
		/** @type {number} */
		this.lastUsed = 0;
		/**
		 * Bumped on every unload so that in-flight asynchronous work knows its
		 * result is no longer wanted.
		 * @type {number}
		 * @private
		 */
		this._generation = 0;
	}

	/**
	 * Load the cached image if it's not already available.
	 *
	 * Reports its outcome through the state, and never rejects.
	 * @param {Error} [errCause] - An error object the be attached as cause for failed fetch responses. Used primarily for extending the traceback
	 */
	async _load(errCause) {
		// Ensure there's only one image load in progress
		if (this.isLoading() || this.isDoneLoading()) return;

		this.state = CachedImageState.LOADING;
		const generation = this._generation;

		try {
			const blob = await this._fetch(generation, errCause);
			if (generation !== this._generation) return;

			const data = await this._decode(blob, generation);
			if (data == null) return;

			// A background update already applied newer bytes
			if (this.state !== CachedImageState.LOADING) {
				this.cache._dispose?.(data);
				return;
			}

			this.data = data;
			this.state = CachedImageState.LOADED;
			this.cache._imageStateDidChange(this);
		} catch (err) {
			if (generation !== this._generation) return;
			if (this.state !== CachedImageState.LOADING) return;

			// Load failed. Display the error in the console and mark it as failed.
			console.error("Failed to load image " + this.url, err);
			this.state = CachedImageState.FAILED;
			this.cache._imageStateDidChange(this);
		}
	}

	/**
	 * Unload the image from the cache
	 */
	unload() {
		if (this.state === CachedImageState.UNCACHED) return;

		// Anything still in flight for this entry must drop its result
		this._generation += 1;

		this._dispose();

		this.state = CachedImageState.UNCACHED;
	}

	/**
	 * Release the stored payload, if any.
	 * @private
	 */
	_dispose() {
		if (this.data) {
			this.cache._dispose?.(this.data);
			this.data = null;
		}
	}

	/**
	 * Fetch the raw bytes of the image.
	 *
	 * @param {number} generation - The generation the fetch belongs to
	 * @param {undefined | Error} errCause - An error object the be attached as cause for failed fetch responses. Used primarily for extending the traceback
	 * @returns {Promise<Blob>}
	 * @private
	 */
	async _fetch(generation, errCause=undefined) {
		const store = this.cache.browserCache;
		/** @type {Response} */
		let response;
		if (store) {
			const cached = await store.match(this.url);
			if (!cached) {
				response = await CommonFetch(this.url, { headers: [["accept", "image/*"]] });
				if (this._isImage(response))
					await store.put(this.url, response);
			} else if (this._isImage(cached)) {
				void store.revalidate(this.url, cached).then((fresh) => {
					if (!fresh) return;
					// The store keeps any cacheable body. This one cannot be
					// decoded, so drop it and leave the bitmap we already have.
					if (!this._isImage(fresh)) {
						void store.delete(this.url);
						return;
					}
					void this._update(generation, fresh);
				});
				response = cached;
			} else {
				// The stored body cannot be decoded. Drop it, and fetch again without them.
				await store.delete(this.url);
				response = await CommonFetch(this.url, { headers: [["accept", "image/*"]] });
				if (this._isImage(response))
					await store.put(this.url, response);
			}
		} else {
			response = await CommonFetch(this.url, { headers: [["accept", "image/*"]] });
		}
		if (!response.ok)
			throw new Error(`HTTP ${response.status}`, { cause: errCause });
		this._assertImage(response, errCause);
		return response.blob();
	}

	/**
	 * Does this response carry an image media type?
	 *
	 * @param {Response} response
	 * @returns {boolean}
	 * @private
	 */
	_isImage(response) {
		const type = (response.headers.get("Content-Type") ?? "").split(";")[0].trim().toLowerCase();
		return !type || type.startsWith("image/");
	}

	/**
	 * Ensure a response carries an image media type.
	 *
	 * @param {Response} response
	 * @param {undefined | Error} [errCause]
	 * @returns {void}
	 * @private
	 */
	_assertImage(response, errCause) {
		if (this._isImage(response)) return;
		const type = (response.headers.get("Content-Type") ?? "").split(";")[0].trim().toLowerCase();
		throw new Error(`Expected an image, got ${type}`, { cause: errCause });
	}

	/**
	 * Decode fetched bytes into the cache's payload.
	 *
	 * If this entry was unloaded while decoding, the result is disposed and
	 * `null` is returned.
	 *
	 * @param {Blob} blob - The image bytes
	 * @param {number} generation - The generation the decode belongs to
	 * @returns {Promise<T | null>}
	 * @private
	 */
	async _decode(blob, generation) {
		const data = await this.cache._decode(blob);
		if (generation !== this._generation) {
			this.cache._dispose?.(data);
			return null;
		}
		return data;
	}

	/**
	 * Swap in a newer version of the image found by a background revalidation.
	 *
	 * Behaves like an unload immediately followed by a load, so that anything
	 * derived from the old payload is rebuilt.
	 *
	 * @param {number} generation - The generation of the load that got updated
	 * @param {Response} response - The fresh response
	 * @returns {Promise<void>}
	 * @private
	 */
	async _update(generation, response) {
		try {
			this._assertImage(response);
			const blob = await response.blob();
			const data = await this._decode(blob, generation);
			if (data == null) return;

			this._dispose();
			this.data = data;
			this.state = CachedImageState.LOADED;
			this.cache._imageStateDidChange(this);
		} catch (err) {
			// The version we have is still perfectly usable
			console.warn(`Failed to update image: ${this.url}`, err);
		}
	}

	/**
	 * Is the image an asset image?
	 * @returns {boolean}
	 */
	isAsset() { return (this.url.indexOf("Assets") >= 0); }

	/**
	 * Is the image currently being loaded?
	 */
	isLoading() { return this.state == CachedImageState.LOADING; }

	/**
	 * Is the image loading complete (either succesfully or not)?
	 */
	isDoneLoading() { return [CachedImageState.LOADED, CachedImageState.FAILED].includes(this.state); }

	/**
	 * Is the image experiencing problems loading?
	 */
	isFailing() { return this.state == CachedImageState.FAILED; }

	/**
	 * Is the image loaded and ready?
	 *
	 * When this is true, `data` is available.
	 * @returns {this is LoadedCachedImage<T>}
	 */
	isLoaded() { return this.state == CachedImageState.LOADED; }

	get complete() {
		return this.isLoaded();
	}

	/**
	 * Get the image's width
	 * @returns {number}
	 */
	get width() {
		return this.isLoaded() ? this.data.width : 0;
	}

	/**
	 * Get the image's height
	 * @returns {number}
	 */
	get height() {
		return this.isLoaded() ? this.data.height : 0;
	}
};

/**
 * Persistent browser-level Cache store.
 *
 * What it keeps depends only on the URL and the response's caching headers.
 * Callers decide whether a stored body is one they can use, and delete it
 * themselves when it is not.
 */
class BrowserCache {
	/**
	 * @param {Cache} cache
	 * @param {string} name
	 * @param {string[] | undefined} origins
	 * @private
	 */
	constructor(cache, name, origins) {
		if (!cache) throw new Error("BrowserCache requires an open Cache");
		/**
		 * Name of the Cache bucket. Bump only if what's stored in it
		 * changes shape.
		 * @type {string}
		 */
		this.name = name;
		/**
		 * The opened Cache.
		 * @type {Cache}
		 */
		this.cache = cache;
		/**
		 * Matches the release directory at the start of a resource path, e.g. the
		 * `/R123/` in `/R123/Game/Assets/...`.
		 * @type {RegExp}
		 * @private
		 */
		this._releasePattern = /^\/R\d+[^/]*\//;
		/**
		 * Keys that have been revalidated this session.
		 * @type {Set<string>}
		 * @private
		 */
		this._revalidated = new Set();
		/**
		 * Revalidations still in flight, so a second hit can wait on them.
		 * @type {Map<string, Promise<Response | null>>}
		 * @private
		 */
		this._revalidating = new Map();
		/**
		 * Origins this store will keep. Unset means any http(s) URL.
		 * @type {Set<string> | null}
		 * @private
		 */
		this._origins = origins ? new Set(origins.map((origin) => new URL(origin).origin)) : null;
	}

	/**
	 * Open the named bucket.
	 *
	 * @param {string[]} [origins] When set, only these origins are stored. Entries from anywhere else are removed.
	 * @returns {Promise<BrowserCache>}
	 */
	static async open(origins) {
		if (typeof caches === "undefined") throw new Error("Cache API unavailable");
		const cacheName = "bc-images-v1";
		const store = new BrowserCache(await caches.open(cacheName), cacheName, origins);
		CommonPromiseCatch(store.purge());
		return store;
	}

	/**
	 * Compute the key an image URL is stored under.
	 *
	 * The R$VERSION directory, query string and fragment are dropped, so that the
	 * same file can be reused across versions, assuming its mtime doesn't change.
	 *
	 * @param {string} url
	 * @returns {string}
	 */
	key(url) {
		const parsed = new URL(url, location.href);
		parsed.pathname = parsed.pathname.replace(this._releasePattern, "/");
		parsed.search = "";
		parsed.hash = "";
		return parsed.href;
	}

	/**
	 * Get the cache control directives from a response.
	 *
	 * @param {Response} response
	 * @returns {Map<string, string | null>}
	 * @private
	 */
	_cacheDirectives(response) {
		const header = response.headers.get("Cache-Control") ?? "";
		/** @type {Map<string, string | null>} */
		const directives = new Map();
		for (const part of header.split(",")) {
			const eq = part.indexOf("=");
			const name = (eq === -1 ? part : part.slice(0, eq)).trim().toLowerCase();
			if (!name) continue;
			directives.set(name, eq === -1 ? null : part.slice(eq + 1).trim());
		}
		return directives;
	}

	/**
	 * Can this response go in the store?
	 *
	 * Only complete, successful, readable responses are worth keeping. Opaque
	 * ones have a status of 0, so they're excluded by the status check.
	 *
	 * @param {Response} response
	 * @returns {boolean}
	 * @private
	 */
	_isStorable(response) {
		if (response.status !== 200) return false;

		const directives = this._cacheDirectives(response);
		if (directives.has("no-store") || directives.has("no-cache")) return false;
		if (directives.get("max-age") === "0") return false;
		return true;
	}

	/**
	 * Check if a given URL can be cached.
	 * @param {string} url
	 * @returns {boolean}
	 * @private
	 */
	_isCacheable(url) {
		let parsed;
		try {
			parsed = new URL(url, location.href);
		} catch {
			return false;
		}
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
		if (this._origins && !this._origins.has(parsed.origin)) return false;
		return true;
	}

	/**
	 * Store a response into the cache.
	 *
	 * @param {string} key The cache key of the resource
	 * @param {Response} response - The response to store.
	 * @returns {Promise<boolean>} Whether the response was stored.
	 * @private
	 */
	async _put(key, response) {
		// Ignore storage failures (quota, eviction) to not stop the fetch.
		try {
			await this.cache.put(key, response.clone());
			return true;
		} catch (err) {
			console.warn(`Failed to cache image "${key}"`, err);
			return false;
		}
	}

	/**
	 * The response stored for this URL, if there is one.
	 *
	 * @param {string} url
	 * @returns {Promise<Response | undefined>}
	 */
	async match(url) {
		if (!this._isCacheable(url)) return undefined;
		return this.cache.match(this.key(url));
	}

	/**
	 * Ask the server whether a stored response is still current.
	 *
	 * Runs at most once per key per session. Resolves with the fresh storable
	 * response, or null when the stored one stands.
	 *
	 * @param {string} url
	 * @param {Response} cached
	 * @returns {Promise<Response | null>}
	 */
	revalidate(url, cached) {
		if (!this._isCacheable(url)) return Promise.resolve(null);
		const key = this.key(url);
		const pending = this._revalidating.get(key);
		if (pending !== undefined) return pending;
		if (this._revalidated.has(key)) return Promise.resolve(null);
		this._revalidated.add(key);

		/** @type {Record<string, string>} */
		const headers = {};
		const lastModified = cached.headers.get("Last-Modified");
		if (lastModified) headers["If-Modified-Since"] = lastModified;
		const etag = cached.headers.get("ETag");
		if (etag) headers["If-None-Match"] = etag;

		const revalidation = (async () => {
			try {
				const response = await CommonFetch(new Request(url, { headers }));
				if (response.status === 304) return null;
				if (!this._isStorable(response)) return null;

				// _put stores a clone, so this body stays readable for the caller.
				await this._put(key, response);
				return response;
			} catch (err) {
				// The cached copy stays in use; we'll try again next session
				console.warn(`Failed to revalidate image "${url}"`, err);
				return null;
			} finally {
				this._revalidating.delete(key);
			}
		})();
		this._revalidating.set(key, revalidation);
		return revalidation;
	}

	/**
	 * Keep a response when it is allowed to be stored.
	 *
	 * @param {string} url
	 * @param {Response} response
	 * @returns {Promise<void>}
	 */
	async put(url, response) {
		if (!this._isCacheable(url) || !this._isStorable(response)) return;
		const key = this.key(url);
		if (await this._put(key, response))
			this._revalidated.add(key);
	}

	/**
	 * Remove the stored response for a URL.
	 *
	 * The entry's caching directives are not consulted.
	 *
	 * @param {string} url
	 * @returns {Promise<boolean>} Whether an entry was removed
	 */
	async delete(url) {
		if (!this._isCacheable(url)) return false;
		const key = this.key(url);
		// The next revalidate in this session has to hit the network. The
		// body we just dropped must not count as already checked.
		this._revalidated.delete(key);
		return this._remove(key);
	}

	/**
	 * Remove one cache key. An in-flight revalidation of that key is left
	 * to finish; forgetting it here would let a second request start.
	 *
	 * @param {string} key
	 * @returns {Promise<boolean>}
	 * @private
	 */
	async _remove(key) {
		try {
			return await this.cache.delete(key);
		} catch (err) {
			console.warn(`Failed to delete cached response "${key}"`, err);
			return false;
		}
	}

	/**
	 * Remove stored entries this store is not allowed to keep.
	 * @returns {Promise<void>}
	 */
	async purge() {
		if (!this._origins) return;
		const requests = await this.cache.keys();
		await Promise.all(requests.map(async (request) => {
			if (this._isCacheable(request.url)) return;
			try {
				const key = this.key(request.url);
				this._revalidated.delete(key);
				this._revalidating.delete(key);
			} catch {
				// The entry's URL is unusable. It is still removed below.
			}
			await this.cache.delete(request);
		}));
	}

	/**
	 * Throw the whole persistent store away and open a fresh bucket.
	 * @returns {Promise<boolean>} Whether there was a store to delete
	 */
	async clear() {
		this._revalidated.clear();
		this._revalidating.clear();
		const deleted = await caches.delete(this.name);
		this.cache = await caches.open(this.name);
		return deleted;
	}
};

/**
 * The delay between each cache purge event, in milliseconds.
 *
 * When the cache purges, this value is halved, and used to find any assets that
 * haven't been used. Those are the ones that will be removed.
 */
var ImageCachePurgeDelay = 1 * MS_PER_HOUR;

/**
 * The class responsible for loading and caching images
 * @template {{ width: number, height: number }} T
 */
class ImageCache {
	/**
	 * @param {string} name
	 * @param {BrowserCache | null} browserCache
	 * @param {ImageCache.Options<T>} options How to turn bytes into a payload, and how to free it
	 */
	constructor(name, browserCache, options) {
		/** @type {Map<string, CachedImage<T>>} */
		this.cache = new Map();
		this.name = name;
		this.lastPurge = CurrentTime;
		/**
		 * Persistent byte store, or null if the Cache API isn't usable.
		 * @type {BrowserCache | null}
		 */
		this.browserCache = browserCache;
		/** @type {(blob: Blob) => T | Promise<T>} */
		this._decode = options.decode;
		/** @type {((data: T) => void) | undefined} */
		this._dispose = options.dispose;
	}

	/**
	 * Check whether an image is in the cache
	 *
	 * @param {string} url - The URL of the image to lookup
	 */
	has(url) {
		return !!this.cache.get(url);
	}

	/**
	 * Get a cached image from the cache.
	 *
	 * @param {string} url - The URL of the image to lookup
	 * @returns {CachedImage<T>} The cached image
	 */
	get(url) {
		let image = this.cache.get(url);
		if (!image) {
			image = new CachedImage(this, url);
			this.cache.set(url, image);
		}

		image.lastUsed = CommonTime();

		// start loading the image
		// Pass along a _synchronously_ constructed error in order to have its traceback suplement any async tracebacks
		CommonPromiseCatch(image._load(new Error()));

		// returns the final image
		return image;
	}

	/**
	 * Remove a cached image by its URL.
	 * @param {string} url - The URL of the image to delete
	 */
	delete(url) {
		const known = this.cache.get(url);
		if (!known) return;

		known.unload();
		this.cache.delete(url);
	}

	/**
	 * Iterate over all cached images
	 * @param {(img: CachedImage<T>, key: string, map: Map<string, CachedImage<T>>) => void} callback - The callback to call on each (URL, image) pair
	 */
	forEach(callback) {
		this.cache.forEach(callback);
	}

	/**
	 * Clear all cached images
	 */
	clear() {
		this.cache.forEach(img => {
			img.unload();
		});
		this.cache.clear();
	}

	/**
	 * Private function called when an image state changes.
	 *
	 * @param {CachedImage<T>} image - The image whose state changed
	 */
	_imageStateDidChange(image) {
		// Ignore images that aren't in the cache, which can happen if they get
		// pruned while their load is still in progress.
		if (!this.cache.has(image.url)) return;

		if (image.state == CachedImageState.LOADED) {
			this._refreshCharactersForImage(image);
		} else if (image.state == CachedImageState.FAILED) {
			// CommonFetch already did the retrying, this is final
			this._refreshCharactersForImage(image);
		}
	}

	/**
	 * Given an image, refresh all characters that would be impacted by its load
	 *
	 * @param {CachedImage<T>} img
	 * @returns {void}
	 */
	_refreshCharactersForImage(img) {
		if (!img || !img.isAsset()) return;

		// Go through URL so a query string or hash doesn't stick to the file name
		const path = new URL(img.url, location.href).pathname;
		const parts = path.split("/");
		let pathPos = parts.indexOf("Assets");
		if (pathPos === -1) return;

		const segment = parts[++pathPos];
		if (segment === "PaperDoll") {
			// Migrated assets live at Assets/PaperDoll/<asset>-<group>/...
		} else if (segment !== "Female3DCG") {
			return;
		}

		const rootSegment = parts[++pathPos];
		if (rootSegment === "Override") {
			// Legacy global overrides: Override/<style>/<group-or-asset>/...
			pathPos += 2;
		} else if (parts[pathPos + 1] === "Override") {
			// Migrated co-located overrides: <asset>/Override/<style>/...
			pathPos += 3;
		}
		const layerName = parts[parts.length - 1];
		if (!layerName.endsWith(".png")) return;

		/** @type {string} */
		let assetName;
		/** @type {AssetGroupName | null} */
		let groupName = null;
		const migratedRoot = AssetParseMigratedRoot(rootSegment);
		if (migratedRoot != null) {
			assetName = migratedRoot.assetName;
			groupName = migratedRoot.groupName;
		} else {
			assetName = layerName.split("_")[0].replace(".png", "");
			if (!assetName) return;
			const groupCandidate = [
				...parts.slice(pathPos + 1, parts.length - 1).reverse(),
				parts[pathPos],
			].find((part) => AssetGroupGet("Female3DCG", /** @type {AssetGroupName} */ (part)));
			if (groupCandidate) {
				groupName = /** @type {AssetGroupName} */ (groupCandidate);
			}
		}

		const wearing = Character.filter(c => c.Appearance.some((i) => (
			i.Asset.Name === assetName
			&& (
				groupName == null
				|| i.Asset.Group.Name === groupName
				|| i.Asset.DynamicGroupName === groupName
			)
		)));
		for (const char of wearing) {
			char.MustDraw = true;
		}
	}

	/**
	 * Purge all images errored or not used in the last half-purge delay
	 * @param {boolean} force
	 */
	purge(force = false) {
		// Only perform a purge if the last purge time makes sense, and its delta
		// is greater than the purge delay.
		const delta = (CurrentTime - this.lastPurge);
		if (!force && delta > 0 && delta < ImageCachePurgeDelay)
			return;

		const startingTotal = this.totalImages();
		this.cache.forEach((image, url) => {
			// Clear images experiencing problems, or that were loaded for longer
			// than half a purge delay
			if (image.state == CachedImageState.FAILED
				|| image.lastUsed && (image.lastUsed + (ImageCachePurgeDelay / 2)) < CommonTime()) {
				this.delete(url);
			}
		});
		console.log(`Cache ${this.name} purged, ${startingTotal - this.totalImages()} images removed`);
		this.lastPurge = CurrentTime;
		this.stats();
	}

	/**
	 * Output some stats about the cache
	 */
	stats() {
		/** @type {{ [key: string]: number}} */
		let stats = { total: this.cache.size, loaded: 0, missing: 0 };
		this.cache.forEach((image) => {
			// Clear errored images
			if (image.state == CachedImageState.FAILED) {
				stats.missing += 1;
			} else if (image.state == CachedImageState.LOADED) {
				stats.loaded += 1;
				// Sort loaded images into 5-minute wide "generations"
				const key = `gen${Math.floor((CurrentTime - image.lastUsed) / (5 * 60 * 1000))}`;
				stats[key] = (stats[key] || 0) + 1;
			}
		});

		console.log(`Cache ${this.name} stats: ${[...Object.entries(stats)].map(e => e[0] + ": " + e[1]).join(", ")}`);
	}

	/**
	 * Get the count of cached images.
	 */
	totalImages() { return this.cache.size; }
};

// Exported for tests
var CachedImageClass = CachedImage;
var BrowserCacheClass = BrowserCache;
var ImageCacheClass = ImageCache;
