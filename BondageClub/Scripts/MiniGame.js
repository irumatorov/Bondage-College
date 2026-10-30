"use strict";
var MiniGameType = "";
var MiniGameVictory = false;
var MiniGamePerfect = true;
/** @type {number} */
var MiniGameDifficulty = 0;
/** @type {string} */
var MiniGameDifficultyMode = "";
var MiniGameDifficultyRatio = 1;
var MiniGameAdvancedPayment = 0;
/** @type {string | (() => void) | null} */
var MiniGameReturnFunction = null;
var MiniGameProgress = -1;
var MiniGameTimer = 0;
var MiniGameStarted = false;
var MiniGameEnded = false;
var MiniGameCheatAvailable = false;
let KDPatched = false;

/**
 * @type {ScreenLoadHandler}
 */
async function MiniGameLoad() {
	if (CurrentScreen == "Kidnap" || CurrentScreen == "HorseWalk") CurrentDarkFactor = 0.5;
}

/**
 * Starts a given mini game at a set difficulty and keeps
 * @param {ModuleScreens["MiniGame"]} GameType - Name of the mini-game to launch
 * @param {number|string} Difficulty - Difficulty Ration for the mini-game
 * @param {(() => void)} ReturnFunction - Callback name to execute once the mini-game is over
 * @returns {SafePromise<void>} - Nothing
 */
async function MiniGameStart(GameType, Difficulty, ReturnFunction) {
	MiniGameType = GameType;
	MiniGameDifficulty = 0;
	MiniGameDifficultyMode = "";

	if (CommonIsNumeric(Difficulty))
		MiniGameDifficulty = Difficulty;
	else
		MiniGameDifficultyMode = Difficulty;
	MiniGameDifficultyRatio = 1;
	MiniGameReturnFunction = ReturnFunction;
	MiniGameVictory = (Math.random() > 0.5);
	MiniGamePerfect = true;
	MiniGameProgress = -1;
	MiniGameTimer = 0;
	MiniGameStarted = false;
	MiniGameEnded = false;
	MiniGameCheatAvailable = (CheatFactor("MiniGameBonus", 0) == 0);

	// FIXME: Consider integrating this check directly into `CommonSetScreen`
	if (CurrentCharacter) {
		DialogLeave();
	}
	await CommonSetScreen("MiniGame", GameType);
}

function MiniGameEnd() {
	if (typeof MiniGameReturnFunction === "string") {
		CommonDynamicFunction(MiniGameReturnFunction + "()");
	} else if (typeof MiniGameReturnFunction === "function") {
		MiniGameReturnFunction();
	}
	MiniGameReturnFunction = null;
}

/**
 * @returns {boolean} - TRUE if the game has started, but not yet ended.
 */
function MiniGameRunning() {
	return MiniGameStarted && !MiniGameEnded;
}

/**
 * Checks if the C key is being pressed and if cheats are available
 * @param {KeyboardEvent} event
 * @returns {boolean} - TRUE if C and cheats are allowed
 */
function MiniGameCheatKeyDown(event) {
	if (event.repeat || CommonKey.GetModifiers(event)) return false;

	if (MiniGameCheatAvailable && (event.key === "c" || event.key === "C")) {
		MiniGameCheatAvailable = false;
		return true;
	} else return false;
}
