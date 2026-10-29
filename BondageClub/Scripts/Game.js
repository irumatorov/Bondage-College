"use strict";

/** BC's version */
var GameVersion = "R133";

const GameVersionFormat = /^R([0-9]+)(?:(Alpha|Beta)([0-9]+)?)?$/;

/** @type {number | null} */
var GameAnimationFrameId = null;
/** @type {Worker | null} */
var GameWorker = null;

var CommonVersionUpdated = false;

/** @type {TouchList | null} */
var CommonTouchList = null;

/** @type {BrowserCache} */
var BrowserStorageCache;

/**
 * Start BC after the webpage has fully loaded
 * @param {boolean} isNode Whether BC is run through the browser or via Node (_i.e._ the testing suite)
 */
async function GameStart(isNode=false) {
	ServerURL = CommonGetServer();
	//CheatImport();
	console.log("Version: " + GameVersion + ", Server: " + ServerURL);
	if (!GameVersionFormat.test(GameVersion)) console.error("GameVersion is not valid!");
	CurrentTime = CommonTime();

	CommonIsMobile = CommonDetectMobile();
	TranslationLoad();
	try {
		BrowserStorageCache = await BrowserCache.open([location.origin]);
	} catch (err) {
		if (typeof caches !== "undefined")
			console.warn("Persistent image cache unavailable", err);
	}
	DrawLoad();
	GLDrawLoad(null, false);
	AssetLoadAll();
	MapDataLoad();
	await AssetInventoryIDValidate();
	CommandsLoad();
	ControllerStart();
	await TextPrefetchFile(InterfaceStringsPath).loadedPromise;
	ServerInit();
	Fullscreen.Init();

	// Create a blank character for our player. Its actual ID will be set when LoginResponse happens
	Player = /** @type {PlayerCharacter} */ (CharacterCreate("Female3DCG", CharacterType.SIMPLE, ""));
	Player.Log = [];
	PreferenceInitPlayer(Player, {});

	// Those event listeners are all going through a lambda so that mods can
	// correctly hook into them. Using the functions directly causes a copy of
	// them to be made (well, their code, actually), breaking that ability.
	document.addEventListener("keydown", (e) => GameKeyDown(e));
	document.addEventListener("keyup", (e) => GameKeyUp(e));
	document.addEventListener("paste", (e) => GamePaste(e));

	const canvas = document.getElementById("MainCanvas");
	if (!(canvas instanceof HTMLCanvasElement)) {
		// Canvas is already initialized by index.html; this code path should _never_ occur
		throw new Error("Canvas is null");
	}

	canvas.addEventListener("wheel", (e) => GameMouseWheel(e));

	canvas.addEventListener("pointerdown", (e) => GamePointerDown(e, canvas));
	canvas.addEventListener("pointerup", (e) => GamePointerUp(e, canvas));
	canvas.addEventListener("pointermove", (e) => GamePointerMove(e));
	canvas.addEventListener("pointercancel", (e) => GamePointerCancel(e, canvas));
	canvas.addEventListener("pointerout", (e) => GamePointerOut(e));
	canvas.addEventListener("touchend", (e) => GameTouchEnd(e));

	canvas.addEventListener("click", (e) => GameClick(e));

	GameAnimationFrameId = requestAnimationFrame(GameRun);
	// Can't use setInterval, chrome throttles it to 1 minute on inactive pages, but not in workers...
	GameWorker = new Worker("Scripts/GameWorker.js");
	GameWorker.onmessage = GameFallbackTimer;

	if (isNode) {
		return;
	}
	return CommonSetScreen("Character", "Login");
}

/** Promises that resolve upon reaching specific stages of the BC loading and login process. */
const GameReadyState = {
	/**
	 * Promise that resolves upon fully loading BC (but before logging in).
	 * This promise can safely be accessed starting from the `interactive` document ready state.
	 * @readonly
	 * @type {Promise<void>}
	 */
	load: new Promise(resolve => window.addEventListener("load", () => {
		// When the code is loaded, we start the game engine
		CommonPromiseCatch(GameStart().then(resolve));
	})),
	/**
	 * Promise that resolves upon succesfully logging in.
	 * Should not be called directly; use {@link ServerIsLoggedInAsync} instead.
	 * @private
	 * @type {undefined | Promise<void>}
	 */
	login: undefined,
};

function GameHandleError() {
	if (GameAnimationFrameId != null) {
		cancelAnimationFrame(GameAnimationFrameId);
		GameAnimationFrameId = null;
	}
	if (GameWorker != null) {
		GameWorker.onmessage = null;
		GameWorker.terminate();
		GameWorker = null;
	}
}

/**
 * Periodically called in the background with low frequency, so the game doesn't freeze, even if the user switches to a different tab.
 * @returns {void}
 */
function GameFallbackTimer() {
	let Timestamp = performance.now();
	if (Timestamp - TimerLastTime > 500) {
		GameRunBackground(Timestamp);
	}
}

/**
 * Main game running state, runs the drawing
 * @param {number} Timestamp
 */
function GameRun(Timestamp) {
	Timestamp ??= 0; // Safety in case it's called from the console without an argument
	try {
		GameAnimationFrameId = null;

		if (TimerLastTime > 0 && Timestamp > 0) {
			// Default to 30 fps outside the game
			const maxUnfocusedFPS = document.hasFocus() ? 0 : Player?.GraphicsSettings?.MaxUnfocusedFPS ?? 0;
			const maxFocusedFPS = Player?.GraphicsSettings?.MaxFPS ?? DEFAULT_FRAMERATE;
			const maxFPS = maxUnfocusedFPS === 0 ? maxFocusedFPS :
				maxFocusedFPS === 0 ? maxUnfocusedFPS :
				Math.min(maxUnfocusedFPS, maxFocusedFPS);

			if (TimerLastTime + ((1000 / maxFPS) | 0) > Timestamp) {
				GameAnimationFrameId = requestAnimationFrame(GameRun);
				return;
			}
		}

		let frameTime = 10000;
		if (Timestamp > 0) {
			frameTime = Timestamp - TimerLastTime;
		}

		// Increments the time from the last frame
		TimerRunInterval = Timestamp - TimerLastTime;
		TimerLastTime = Timestamp;
		CurrentTime += TimerRunInterval;

		DrawProcess(Timestamp);
		ControllerProcess();
		TimerProcess();

		ServerSendQueueProcess();

		GameAnimationFrameId = requestAnimationFrame(GameRun);

		if (Timestamp > 0 && Player?.GraphicsSettings?.ShowFPS) {
			MainCanvas.textAlign = "center";
			DrawTextFit((Math.round(10000 / frameTime / 10)).toString(), 15, 12, 30, "white", "black");
		}
	} catch (e) {
		GameHandleError();
		throw e;
	}

}

/**
 * Main game running state, when in the background. Skips drawing if possible.
 * @param {number} Timestamp
 */
function GameRunBackground(Timestamp) {
	try {
		// Increments the time from the last frame
		TimerRunInterval = Timestamp - TimerLastTime;
		TimerLastTime = Timestamp;
		CurrentTime = CurrentTime + TimerRunInterval;

		if (CurrentCharacter == null && !ScreenIsLoading) {
			CurrentScreenFunctions.Run(Timestamp);
		}
		// Ignore gamepad when in the background
		TimerProcess();

		ServerSendQueueProcess();
	} catch (e) {
		GameHandleError();
		throw e;
	}
}

/**
 * When the user presses a key, we send the KeyDown event to the current screen if it can accept it
 * @param {KeyboardEvent} event
 */
function GameKeyDown(event) {

	if (ScreenIsLoading) return;

	let handled = false;
	handleKeyDown: {
		if (ControllerIsActive() && ControllerSupportKeyDown(event)) {
			handled = true;
			break handleKeyDown;
		}

		if (CurrentScreen === "Preference" && PreferenceSubscreen?.name === "Keybindings" && KeyGUI.selectedAction) {
			handled = true;
			break handleKeyDown;
		}

		if (KeyManager.handleKeyPress(event)) {
			handled = true;
			break handleKeyDown;
		}

		if (CommonKey.IsPressed(event, "Escape")) {
			if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
				document.activeElement.blur();
				handled = true;
				break handleKeyDown;
			} else if (CurrentCharacter) {
				DialogMenuBack();
				handled = true;
				break handleKeyDown;
			} else {
				CurrentScreenFunctions.Exit();
				handled = true;
				break handleKeyDown;
			}
		}

		if (DialogKeyDown(event)) {
			handled = true;
			break handleKeyDown;
		}

		if (CurrentScreenFunctions.KeyDown(event)) {
			handled = true;
			break handleKeyDown;
		}
	}


	if (handled) {
		event.preventDefault();
		event.stopImmediatePropagation();
	}
	return handled;
}

/** @type {KeyboardEventListener} */
function GameKeyUp(event) {
	if (ScreenIsLoading) return false;
	if (StruggleMinigameIsRunning()) { return false; }
	const handled = CurrentScreenFunctions.KeyUp(event);
	if (handled) {
		event.preventDefault();
		event.stopImmediatePropagation();
	}
	return handled;
}

/** @type {ClipboardEventListener} */
function GamePaste(event) {
	if (!ScreenIsLoading) {
		CurrentScreenFunctions.Paste(event);
	}
}

/**
 * If the user presses the mouse button, we fire the mousedown event for other screens
 * @param {PointerEvent} event
 * @param {HTMLCanvasElement} canvas
 */
function GamePointerDown(event, canvas) {
	CommonMouseDown(event);
	// Guarantees that a `pointdown` event is followed up with `pointerup`
	canvas.setPointerCapture(event.pointerId);
}

/**
 * If the user releases the mouse button, we fire the mouseup and click events for other screens
 * @param {PointerEvent} event
 * @param {HTMLCanvasElement} canvas
 */
function GamePointerUp(event, canvas) {
	GamePointerMove(event, false);
	CommonMouseUp(event);
	canvas.releasePointerCapture(event.pointerId);
}

/**
 * If the user stops touching the screen (mobile only), we fire the mouseup event for other screens
 * @param {TouchEvent} event
 */
function GameTouchEnd(event) {
	CommonTouchList = event.touches;
}

/**
 * If the user rolls the mouse wheel, we fire the mousewheel event for other screens
 * @type {MouseWheelEventListener}
 */
function GameMouseWheel(event) {
	CommonMouseWheel(event);
}

/**
 * If the user moves the mouse mouse, we keep the mouse position for other scripts and fire the mousemove event for other screens
 * @param {PointerEvent} event
 * @param {boolean} forwardToScreens
 */
function GamePointerMove(event, forwardToScreens = true) {
	MouseX = Math.round((event.clientX - MainCanvas.canvas.offsetLeft) * 2000 / MainCanvas.canvas.clientWidth);
	MouseY = Math.round((event.clientY - MainCanvas.canvas.offsetTop) * 1000 / MainCanvas.canvas.clientHeight);
	if (forwardToScreens) {
		CommonMouseMove(event);
	}
}

/**
 * Only fire canvas clicks via the `click` event, lest there is the possibility of a canvas click and DOM click firing twice on certain
 * platforms (_e.g._ Android) due to said mobile browsers firing both `touch<x>` and `mouse<x>` events
 * @param {PointerEvent} event
 */
function GameClick(event) {
	CommonClick(event);
}

/**
 * @param {PointerEvent} event
 * @param {HTMLCanvasElement} canvas
 */
function GamePointerCancel(event, canvas) {
	MouseX = -1;
	MouseY = -1;
	CommonTouchList = null;
	canvas.releasePointerCapture(event.pointerId);
}

/**
 * @param {PointerEvent} event
 */
function GamePointerOut(event) {
	// Cannot reliably use `pointerout` on mobile as it fires after every `pointerdown` (why?)
	// This breaks things badly on Chromium, this listener firing _before_ `click` and thus resetting the mouse coordinates
	if (event.pointerType === "mouse") {
		MouseX = -1;
		MouseY = -1;
	}
}
