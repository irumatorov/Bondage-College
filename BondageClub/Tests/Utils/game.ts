import path from "path";
import fs from "fs";
import vm from "vm";
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from "util";
import { loadImage } from "canvas";
import { Blob } from "node:buffer";

class SocketMock {
	private listeners: { [k in keyof ServerToClientEvents]?: ServerToClientEvents[k][] };

	get io() {
		return this;
	}

	constructor() {
		this.listeners = {};
	}

	on<T extends keyof ServerToClientEvents>(ev: T, listener: ServerToClientEvents[T]) {
		// @ts-expect-error
		(this.listeners[ev] ??= []).push(listener);
	}

	emit<T extends keyof ClientToServerEvents>(ev: T, ...args: Parameters<ClientToServerEvents[T]>) {}

	mockResponse<T extends keyof ServerToClientEvents>(ev: T, ...args: Parameters<ServerToClientEvents[T]>) {
		// @ts-expect-error
		this.listeners[ev]?.forEach(func => func(...args));
	}
}

function resolvePath(parentFile: string, relativePath: string): string {
	const parentDir = path.dirname(parentFile);
	return path.join(parentDir, relativePath);
}

/** Required BC symbol overrides to be inserted after the VM has run its course (see {@link Game.load}) */
const postVMMocks = {
	CommonGet: (file: string, callback: (this: XMLHttpRequest, xhr: XMLHttpRequest) => void): void => {
		const data = fs.readFileSync(file, "utf8");
		const obj = {
			status: 200,
			responseText: data,
		} as XMLHttpRequest;
		callback.call(obj, obj);
	},
	CommonFetch: async (request: RequestInfo | URL): Promise<Response> => {
		if (typeof request !== "string") throw Error("not implemented");
		const bytes = fs.readFileSync(`${request}`);
		const obj = {
			status: 200,
			statusText: "OK",
			ok: true,
			async text() { return bytes.toString("utf8"); },
			async blob() { return new Blob([bytes]); },
		} as Response;
		return obj;
	},
	CommonGetServer: (): string => Game.ServerURL as string,
	io: (url: string): SocketIO.Socket => new SocketMock() as never,
	createImageBitmap: async (blob: Blob) => {
		const image = await loadImage(Buffer.from(await blob.arrayBuffer())) as unknown as ImageBitmap;
		image.close = () => {};
		return image;
	},
};

// Defined as constants in Common.js
const MS_PER_SEC = 1000;
const MS_PER_MIN = 60 * MS_PER_SEC; // 60_000
const MS_PER_HOUR = 60 * MS_PER_MIN; // 3_600_000
const MS_PER_DAY = 24 * MS_PER_HOUR; // 86_400_000
const MS_PER_WEEK = 7 * MS_PER_DAY; // 604_800_000
const MS_PER_YEAR = 365 * MS_PER_DAY; // 31_536_000_000
const FETCH_MAX_RETRIES = 10;

const CONSTANTS = {
	MS_PER_SEC,
	MS_PER_MIN,
	MS_PER_HOUR,
	MS_PER_DAY,
	MS_PER_WEEK,
	MS_PER_YEAR,
	FETCH_MAX_RETRIES,
};

const _Game = {
	...global,
	...CONSTANTS,
	window: window,
	document: document,
	console: Object.assign(
		console,
		{
			// NOTE: Use `jest.spyOn(console, foo).mockImplementation(() => undefined)` for checking console output during the tests
			// Make sure to only do this _after_ calling `Game.load()`
			trace: () => undefined,
			debug: () => undefined,
			info: () => undefined,
			log: () => undefined,
			warn: () => undefined,
			error: () => undefined,
		},
	),
	XMLHttpRequest: XMLHttpRequest,
	Image: Image,
	Element,
	HTMLElement,
	HTMLCanvasElement,
	HTMLImageElement,
	HTMLInputElement,
	HTMLSelectElement,
	HTMLTextAreaElement,
	customElements,
	MutationObserver,
	Node,
	TextEncoder: NodeTextEncoder,
	TextDecoder: NodeTextDecoder,
	URL,
	Worker: class {
		constructor(scriptURL: string | URL, options: WorkerOptions) {
		}
		terminate() {}
	},
	matchMedia(query: string): MediaQueryList {
		return { matches: false } as MediaQueryList;
	},
	Audio: class {
		src?: string;
		volume: number;
		paused: boolean;
		constructor(src?: string) {
			this.src = src;
			this.volume = 1;
			this.paused = true;
		}
		play() {
			this.paused = false;
			return Promise.resolve();
		}
		pause() {
			this.paused = true;
		}
		addEventListener() {}
		removeEventListener() {}
		load() {}
	},
	fetch: (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
		// #TODO: implement fetch functionality
		return new Promise((resolve, reject) => {});
	},
	load(file: string): void {
		const realFile = path.resolve(path.dirname(__dirname), file);
		const contents = fs.readFileSync(realFile, { encoding: "utf8" });
		for (const _key in global) {
			const key = _key as keyof typeof globalThis;
			if (
				Object.prototype.hasOwnProperty.call(global, key) &&
				this[key] === undefined
			) {
				// @ts-expect-error: TS is bad at iterating over interfaces
				this[key] = global[key];
			}
		}

		if (file.endsWith(".html")) {
			// Inject HTML into the JSDOM environment
			// eslint-disable-next-line nounsanitized/property
			document.documentElement.innerHTML = contents;
			const scripts = document.querySelectorAll("script[src]");
			scripts.forEach((s) => {
				const src = s.getAttribute("src") as string;
				this.load(resolvePath(file, src));
			});
		} else {
			const script = new vm.Script(contents, { filename: file });
			script.runInNewContext(this);
			Object.assign(this, postVMMocks);
		}
	},
	async loadAll(): Promise<void> {
		this.load("../index.html");
		const promise: Promise<void> = this.GameStart(true);
		return promise;
	},

	// Symbol initialized after `loadAll`
	GameStart: undefined as never as (isNode?: boolean) => Promise<void>,
};

export const Game = _Game as typeof _Game & Record<string, any>;
