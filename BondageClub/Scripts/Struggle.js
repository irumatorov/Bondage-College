"use strict";
/** @type {number[]} */
var StruggleLockPickOrder = [];
/** @type {boolean[]} */
var StruggleLockPickSet = [];
/** @type {boolean[]} */
var StruggleLockPickSetFalse = [];
/** @type {number[]} */
var StruggleLockPickOffset = [];
/** @type {number[]} */
var StruggleLockPickOffsetTarget = [];
/** @type {number[]} */
var StruggleLockPickImpossiblePins = [];
var StruggleLockPickProgressSkill = 0;
var StruggleLockPickProgressSkillLose = 0;
var StruggleLockPickProgressChallenge = 0;
var StruggleLockPickProgressMaxTries = 0;
var StruggleLockPickProgressCurrentTries = 0;
var StruggleLockPickSuccessTime = 0;
var StruggleLockPickFailTime = 0;
var StruggleLockPickArousalTick = 0;
var StruggleLockPickArousalTickTime = 12000;
var StruggleLockPickArousalText = "";
var StruggleLockPickFailTimeout = 30000;
var StruggleLockPickTotalTries = 0;

var StruggleProgressStruggleCount = 0;
var StruggleProgressAuto = 0;
var StruggleProgressOperation = "...";
/**
 * How much experience should be gained on success.
 *
 * FIXME: the value is calculated by the minigame, but the skill is selected by Dialog when the minigame stops.
 */
var StruggleProgressSkill = 0;
/** @type {string | null} */
var StruggleProgressLastKeyPress = null;
/**
 * The difficulty of the struggle minigame.
 */
var StruggleProgressChallenge = 0;

/**
 * Threshold at which actually succeeding the minigame becomes impossible.
 */
const STRUGGLE_THRESHOLD_IMPOSSIBLE = 6;

/**
 * Threshold at which the loosen option appears.
 */
const STRUGGLE_THRESHOLD_CAN_LOOSEN = 9;

/**
 * Number of struggle attempts to do before the challenge value is revealed
 */
const STRUGGLE_THRESHOLD_REVEAL = 50;

var StruggleLoosenSpeed = 400; // Higher number gives slower spin speed
var StruggleLoosenAngle = 0;
var StruggleLoosenHoleAngle = Math.PI; // 6.28 for a full 360 circle

/**
 * Character expression at the beginning of the minigame; player-only
 * @type {Partial<Record<ExpressionGroupName, ExpressionName>> | undefined}
 */
var StruggleExpressionStore = undefined;

/**
 * The struggle minigame progress
 *
 * -1 means there's no game running. 0 and StruggleProgressCurrentMinigame
 * indicates the player hasn't selected a game yet.
 *
 * @type {number}
 */
let StruggleProgress = -1;

/**
 * The minigame currently running
 * @type {StruggleKnownMinigames | ""}
 */
var StruggleProgressCurrentMinigame = "";

/**
 * The item worn at the beginning of the minigame.
 *
 * This is a (shallow) copy so that changes made outside of the minigame
 * don't cause crashes if the data gets changed externally —
 * which can happen if someone else removes the item we're currently
 * struggling with. Changes made to it might be ignored!
 *
 * @type {Item | null}
 */
var StruggleProgressPrevItem = null;

/**
 * The item that should be worn at the end of the minigame
 *
 * This is a (shallow) copy so that changes made outside of the minigame
 * don't cause crashes if the data gets changed externally —
 * which can happen if someone else removes the item we're currently
 * struggling with. Changes made to it might be ignored!
 *
 * @type {DialogInventoryItem | null}
 */
var StruggleProgressNextItem = null;

/**
 * A function called when the struggle minigame completes
 * @type {StruggleCompletionCallback | null}
 */
var StruggleExitFunction = null;

// For flexibility
/** @type {{ X: number, Y: number, Size: number, Velocity: number }[]} */
var StruggleProgressFlexCircles = [];
var StruggleProgressFlexTimer = 0;
var StruggleProgressFlexMaxX = 300;
var StruggleProgressFlexMaxY = 150;
var StruggleProgressFlexCirclesRate = 200;

// For dexterity
var StruggleProgressDexTarget = 0;
var StruggleProgressDexCurrent = 0;
var StruggleProgressDexMax = 300;
var StruggleProgressDexDirectionRight = false; // Moves left when false, right when true


/** @type {Record<StruggleKnownMinigames, StruggleMinigame>} */
const StruggleMinigames = {
	Strength: {
		Setup: StruggleStrengthSetup,
		Draw: StruggleStrengthDraw,
		HandleEvent: StruggleStrengthHandleEvent,
		DisablingCraftedProperty: "Strong",
	},
	Flexibility: {
		Setup: StruggleFlexibilitySetup,
		Draw: StruggleFlexibilityDraw,
		HandleEvent: StruggleFlexibilityHandleEvent,
		DisablingCraftedProperty: "Flexible",
	},
	Dexterity: {
		Setup: StruggleDexteritySetup,
		Draw: StruggleDexterityDraw,
		HandleEvent: StruggleDexterityHandleEvent,
		DisablingCraftedProperty: "Nimble",
	},
	Loosen: {
		Setup: StruggleLoosenSetup,
		Draw: StruggleLoosenDraw,
		HandleEvent: StruggleLoosenHandleEvent,
		DisablingCraftedProperty: "Nimble",
	},
	LockPick: {
		Setup: StruggleLockPickSetup,
		Draw: StruggleLockPickDraw,
		HandleEvent: StruggleLockPickHandleEvent,
	}
};

/**
 * List of expressions to go through while struggling, keyed by duration
 * @type {Record<number, Partial<Record<ExpressionGroupName, ExpressionName>>>}
 */
const StruggleFacesList = {
	5: {
		Blush: "Low",
		Fluids: "DroolLow",
		Eyebrows: "Soft",
		Mouth: null
	},
	10: {
		Blush: "Medium",
		Fluids: "DroolMedium",
		Eyebrows: "Raised",
		Mouth: "Pout"
	},
	20: {
		Blush: "High",
		Fluids: "DroolSides",
		Eyebrows: "Lowered",
		Mouth: "LipBite"
	},
	35: {
		Blush: "VeryHigh",
		Fluids: "DroolMessy",
		Eyebrows: "OneRaised",
		Mouth: "Frown"
	},
	60: {
		Blush: "Extreme",
		Fluids: "DroolTearsMedium",
		Eyebrows: "Harsh",
		Mouth: "Pained"
	},
	90: {
		Blush: "ShortBreath",
		Fluids: "DroolTearsHigh",
		Eyebrows: "Angry",
		Mouth: "Angry"
	}
};

/**
 * Get the list of struggle minigames.
 * @returns {[Exclude<StruggleKnownMinigames, "LockPick" | "Loosen">, StruggleMinigame][]}
 */
function StruggleGetMinigames() {
	return CommonEntries(CommonOmit(StruggleMinigames, ["LockPick", "Loosen"]));
}

/**
 * Main handler for drawing the struggle minigame screen
 *
 * This function is responsible for drawing either the minigame themselves, or
 * the minigame selection screen if it's not yet running.
 *
 * @param {Character} C
 * @returns {boolean} Whether the draw handler ran
 */
function StruggleMinigameDraw(C) {
	if (StruggleProgressCurrentMinigame !== "") {
		// There's a minigame running, use its draw handler
		StruggleMinigames[StruggleProgressCurrentMinigame].Draw(C);
		return true;
	}
	return false;
}

/**
 * Construct and return the struggle text associated with using x% of a character's skill
 * @param {Character} C - The character who acts
 * @param {SkillType} skillType - Name of the skill to get the value of
 * @returns {string}
 */
function StruggleGetSkillRatioText(C, skillType) {
	const skill = SkillGetRatio(Player, skillType);
	const skillRounded = /** @type {0 | 25 | 50 | 75 | 100} */(Math.round(skill * 4) * 25);
	return InterfaceTextGet(`Using${skillRounded}`);
}

/**
 * Gets the correct label for the current operation (struggling, removing, swaping, adding, etc.)
 * @param {Character} C - The character who acts
 * @param {Item | null} PrevItem - The first item that's part of the action
 * @param {Item | null} NextItem - The second item that's part of the action
 * @returns {string} - The appropriate dialog option
 */
function StruggleProgressGetOperation(C, PrevItem, NextItem) {
	if ((PrevItem != null) && (NextItem != null)) return InterfaceTextGet("Swapping");
	if ((C.IsPlayer()) && (PrevItem != null) && (SkillGetRatio(Player, "Evasion") != 1)) return StruggleGetSkillRatioText(Player, "Evasion");
	if (PrevItem && InventoryItemHasEffect(PrevItem, "Lock", true) && !DialogCanUnlock(C, PrevItem)) return InterfaceTextGet("Struggling");
	if ((PrevItem != null) && !Player.CanInteract() && !InventoryItemHasEffect(PrevItem, "Block", true)) return InterfaceTextGet("Struggling");
	if (PrevItem && InventoryItemHasEffect(PrevItem, "Lock", true)) return InterfaceTextGet("Unlocking");
	if ((PrevItem != null) && InventoryItemHasEffect(PrevItem, "Mounted", true)) return InterfaceTextGet("Dismounting");
	if ((PrevItem != null) && InventoryItemHasEffect(PrevItem, "Enclose", true)) return InterfaceTextGet("Escaping");
	if (PrevItem != null) return InterfaceTextGet("Removing");
	if ((PrevItem == null) && (NextItem != null) && (SkillGetRatio(Player, "Bondage") != 1)) return StruggleGetSkillRatioText(Player, "Bondage");
	if (NextItem && InventoryItemHasEffect(NextItem, "Lock", true)) return InterfaceTextGet("Locking");
	if ((PrevItem == null) && (NextItem != null)) return InterfaceTextGet("Adding");
	return "...";
}

/**
 * We can loosen if the item allows it, if enough time was spent and if the challenge is between 1 and 9
 * @returns {boolean} - TRUE if it's allowed
 */
function StruggleAllowLoosen() {
	if (StruggleProgressStruggleCount < 50) return false;
	if (StruggleProgressChallenge >= STRUGGLE_THRESHOLD_CAN_LOOSEN) return false;
	if (!StruggleProgressPrevItem?.Asset.AllowTighten || InventoryItemHasEffect(StruggleProgressPrevItem, "Lock")) return false;
	return true;
}

/**
 * Handles the minigames' KeyDown event.
 *
 * Only applicable for the Strength minigame.
 *
 * Increases or decreases the struggle mini-game, if a/A or s/S were pressed.
 * @type {KeyboardEventListener}
 */
function StruggleKeyDown(event) {
	if (event.repeat || CommonKey.GetModifiers(event)) return false;

	if (!StruggleMinigameIsRunning() || !StruggleProgressCurrentMinigame) return false;

	if (event.key === "Escape") {
		StruggleMinigameStop();
		return true;
	}

	if (!StruggleMinigames[StruggleProgressCurrentMinigame].HandleEvent) return false;

	StruggleMinigames[StruggleProgressCurrentMinigame].HandleEvent?.("KeyDown", event);
	return true;
}

/**
 * Handles the minigames' mouse down event, whether on the selection screen or in the minigame themselves.
 *
 * @type {MouseEventListener}
 */
function StruggleMouseDown(event) {
	if (!StruggleMinigameIsRunning() || !StruggleProgressCurrentMinigame) return;

	if (!StruggleMinigames[StruggleProgressCurrentMinigame].HandleEvent) return;

	StruggleMinigames[StruggleProgressCurrentMinigame].HandleEvent?.("MouseDown", event);
}

/**
 * Handles the minigames' Click event, whether on the selection screen or in the minigame themselves.
 *
 * @returns {boolean} - Nothing
 */
function StruggleMinigameClick() {
	if (!StruggleMinigameIsRunning() || !StruggleProgressCurrentMinigame) return false;

	if (!StruggleMinigames[StruggleProgressCurrentMinigame].HandleEvent) return false;

	StruggleMinigames[StruggleProgressCurrentMinigame].HandleEvent?.("Click", null);
	return true;
}

/**
 * Handle the common progress and drawing of the minigame
 *
 * This function draws the minigame common UI, and updates the progress if it should
 * do so automatically.
 *
 * @param {number} [Offset]
 */
function StruggleMinigameDrawCommon(Offset) {
	if (!Offset) Offset = 0;
	// Draw one or both items
	if ((StruggleProgressPrevItem != null) && (StruggleProgressNextItem != null)) {
		DrawItemPreview(StruggleProgressPrevItem, Player, 1200, 250 + Offset);
		DrawItemPreview(StruggleProgressNextItem, Player, 1575, 250 + Offset);
	} else {
		let Item = /** @type {Item} */ (StruggleProgressPrevItem != null ? StruggleProgressPrevItem : StruggleProgressNextItem);
		DrawItemPreview(Item, Player, 1387, 250 + Offset);
	}

	// Add or subtract to the automatic progression, doesn't move in color picking mode
	StruggleProgress = StruggleProgress + StruggleProgressAuto;
	if (StruggleProgress < 0) StruggleProgress = 0;

	// Change the operation to "Impossible" if applicable once the player struggled enough, or they're bypassing
	if ((StruggleProgressStruggleCount >= STRUGGLE_THRESHOLD_REVEAL || StruggleMinigameShouldBypass()) && StruggleMinigameIsImpossible() && (StruggleProgressAuto < 0)) {
		StruggleProgressOperation = InterfaceTextGet("StruggleImpossible");
	}
}

/**
 * Check if the minigame has been interrupted and we should bail out
 *
 * @param {Character} C
 * @returns {boolean}
 */
function StruggleMinigameCheckCancel(C) {
	const interrupted = StruggleMinigameWasInterrupted(C);
	if (!interrupted) return false;

	/** @type {StruggleCompletionData} */
	// @ts-ignore Strict-TS: bit of a mess of whether prev, next or neither
	const data = {
		Progress: StruggleProgress,
		PrevItem: StruggleProgressPrevItem,
		NextItem: StruggleProgressNextItem,
		Skill: 0,
		Attempts: 0,
		Interrupted: true,
	};

	const Game = StruggleProgressCurrentMinigame;

	// Reset the minigame state and call the minigame end callback
	StruggleMinigameStop();
	if (StruggleExitFunction && Game !== "")
		StruggleExitFunction(C, Game, data);

	return true;
}

/**
 * Helper used to tell if something interrupted the minigame.
 * @param {Character} C
 * @returns {boolean}
 */
function StruggleMinigameWasInterrupted(C) {
	// The player can no longer interact
	if (C != Player && !Player.CanInteract())
		return true;

	const PrevItem = StruggleProgressPrevItem;
	const NextItem = StruggleProgressNextItem;
	const CurrentItem = InventoryGet(C, PrevItem ? PrevItem.Asset.Group.Name : NextItem?.Asset.Group.Name);

	// We were removing an item, and it's already gone
	if (NextItem == null && !CurrentItem)
		return true;

	// We were adding an item, and something else was added first
	if (PrevItem == null && CurrentItem)
		return true;

	// We were swapping items, and the current item isn't what we started with
	if (NextItem != null && PrevItem != null
			&& (!CurrentItem || CurrentItem.Asset.Name != PrevItem.Asset.Name))
		return true;

	// A new item blocked access
	if (C.FocusGroup && InventoryGroupIsBlocked(C, C.FocusGroup.Name))
		return true;

	// The item we're applying is now disallowed
	if (NextItem != null && !InventoryAllow(C, NextItem.Asset))
		return true;

	if (StruggleProgressCurrentMinigame === "LockPick") {
		// Skip a false-positive if we succeeded but ended up
		// drawing the UI before it fully updated
		if (StruggleLockPickOrder === null)
			return false;

		// The character we're picking the lock on has left
		if (CurrentScreen === "ChatRoom" && !ChatRoomCharacter.find(c => c.MemberNumber === C.MemberNumber))
			return true;

		// The lock is gone from the item
		const newPrevItem = PrevItem ? InventoryGet(C, PrevItem.Asset.Group.Name) : null;
		if (PrevItem && newPrevItem && !InventoryItemIsPickable(newPrevItem))
			return true;

		// We lost access to a lockpick (likely the one we were lent broke)
		if (!Player.CanPickLocks())
			return true;
	}
	return false;
}

/**
 * Handles making the character's expression when struggling.
 *
 * @param {boolean} [Decrease] - Whether the game progressed or not that tick.
 */
function StruggleMinigameHandleExpression(Decrease) {

	const Count = StruggleProgressStruggleCount;
	if (!Decrease && Player.OnlineSharedSettings.ItemsAffectExpressions) {
		// At 15 hit: Eyes angry
		if (StruggleProgressCurrentMinigame === "Strength") {
			if (Count >= 15) CharacterSetFacialExpression(Player, "Eyes", "Angry", 3);
		}
		// At 25 hit: Eyes Lewd
		if (StruggleProgressCurrentMinigame === "Flexibility") {
			if (Count >= 25) CharacterSetFacialExpression(Player, "Eyes", "Lewd", 3);
		}
		// At 25 hit: Eyes dazed
		if (StruggleProgressCurrentMinigame === "Dexterity") {
			if (Count >= 25) CharacterSetFacialExpression(Player, "Eyes", "Dazed", 3);
		}

		// Each click accelerates ExpressionQueue timers 1 second.
		for (const item of Player.ExpressionQueue ?? []) {
			item.Time += -1000;
		}
	}
}

/**
 * Helper function that handles checking and completing the minigame
 *
 * @param {Character} C - The character to check for progress.
 * @returns {boolean}
 */
function StruggleProgressCheckEnd(C) {
	if (StruggleProgress < 100)
		return false;

	/** @type {StruggleCompletionData} */
	// @ts-ignore Strict-TS: bit of a mess of whether prev, next or neither
	const data = {
		PrevItem: StruggleProgressPrevItem,
		NextItem: StruggleProgressNextItem,
		Skill: StruggleProgressSkill,
		Progress: StruggleProgress,
		Attempts: StruggleProgressStruggleCount,
		Interrupted: false,
		Auto: StruggleProgressAuto < 0
	};

	const Game = StruggleProgressCurrentMinigame;

	// Reset the minigame state and call the minigame end callback
	StruggleMinigameStop();
	if (StruggleExitFunction && Game !== "") {
		StruggleExitFunction(C, Game, data);
	}

	return true;
}


/**
 * Check if there's a struggling minigame started.
 *
 * @returns {boolean}
 */
function StruggleMinigameIsRunning() {
	return (StruggleProgressCurrentMinigame !== "");
}

/**
 * Starts the given struggle minigame.
 *
 * This function initializes the common state and calls the requested minigame
 * setup function.
 *
 * @param {Character} C - The character currently doing the struggling, either on itself (ie. as Player), or on someone else.
 * @param {StruggleKnownMinigames} MiniGame - The minigame to start
 * @param {Item | null} PrevItem - The item currently being present on the character, or null if none
 * @param {DialogInventoryItem | null} NextItem - The item currently being added on the character, or null if it's a removal
 * @param {StruggleCompletionCallback} Completion - A callback that will be called when the minigame ends
 */
function StruggleMinigameStart(C, MiniGame, PrevItem, NextItem, Completion) {

	if (!StruggleMinigames[MiniGame])
		return;

	// Prepares the progress bar and timer
	StruggleProgressCurrentMinigame = MiniGame;
	StruggleProgress = 0;
	StruggleProgressPrevItem = PrevItem ? { ...PrevItem } : null;
	StruggleProgressNextItem = NextItem ? { ...NextItem } : null;
	StruggleProgressOperation = StruggleProgressGetOperation(C, StruggleProgressPrevItem, StruggleProgressNextItem);
	StruggleProgressStruggleCount = 0;
	StruggleExitFunction = Completion;

	StruggleMinigames[MiniGame].Setup(C, StruggleProgressPrevItem, StruggleProgressNextItem);

	// The progress bar will not go down if the player can use her hands for a new item, or if she has the key for the locked item
	if ((StruggleProgressAuto < 0) && Player.CanInteract() && (PrevItem == null)) StruggleProgressAuto = 0;
	if ((StruggleProgressAuto < 0) && Player.CanInteract() && (PrevItem != null) && (!InventoryItemHasEffect(PrevItem, "Lock", true) || DialogCanUnlock(C, PrevItem)) && !InventoryItemHasEffect(PrevItem, "Mounted", true)) StruggleProgressAuto = 0;

	// If the minigame should be bypassed, force the auto-progress value and set the gained XP to 5
	if (StruggleMinigameShouldBypass() && !StruggleMinigameIsImpossible()) {
		StruggleProgressAuto = 1;
		StruggleProgressSkill = 5;
	}

	// If expressions are enabled, do struggle faces
	if (C.OnlineSharedSettings && C.OnlineSharedSettings.ItemsAffectExpressions) {
		// Grab a copy of the player's expressions and apply timers for the new ones
		// Eyes are set by struggle count in StruggleMinigameHandleExpression()
		StruggleExpressionStore = WardrobeGetExpression(Player);
		for (const [Time, List] of CommonEntries(StruggleFacesList)) {
			for (const [group, expression] of CommonEntries(List)) {
				TimerExpressionQueuePush(C, group, Time, expression);
			}
		}
	} else {
		StruggleExpressionStore = undefined;
	}

	// Applying or removing specific items can trigger an audio sound to play
	if (StruggleProgressCurrentMinigame !== "LockPick") {
		let played = false;
		if (NextItem && NextItem.Asset)
			played = AudioPlaySoundForAsset(C, NextItem.Asset);
		if (!played && PrevItem && PrevItem.Asset)
			AudioPlaySoundForAsset(C, PrevItem.Asset);
	}
}

/**
 * Stop the struggle minigame and reset it so it can be reentered.
 *
 * If the game was already played a bit, it will also log the failure in chat.
 *
 * Do not call this from within minigames, use {@link StruggleMinigameCheckCancel}
 * and {@link StruggleProgressCheckEnd} instead so whoever started the minigame
 * knows it has ended and can react accordingly.
 *
 * @returns {void}
 */
function StruggleMinigameStop() {
	// Stops the dialog sounds
	AudioDialogStop();

	if (StruggleExpressionStore) {
		// Clear ExpressionQueue
		Player.ExpressionQueue = [];

		// Reset player expressions to default
		CharacterResetFacialExpression(Player);

		// Set player expressions to store
		for (const [group, name] of CommonEntries(StruggleExpressionStore)) {
			CharacterSetFacialExpression(Player, group, name);
		}
	}

	StruggleProgress = -1;
	StruggleProgressCurrentMinigame = "";
}

/**
 * Checks if the player wants to bypass the struggle minigame entirely
 */
function StruggleMinigameShouldBypass() {
	// Check the setting
	if (!Player.RestrictionSettings.BypassStruggle) return false;

	// Only allow bypass in online rooms
	if (!ServerPlayerIsInChatRoom()) return false;

	return true;
}

/**
 * Checks if the struggle challenge can actually be completed
 */
function StruggleMinigameIsImpossible() {
	return (StruggleProgressChallenge > STRUGGLE_THRESHOLD_IMPOSSIBLE);
}

////////////////////////////STRUGGLE MINIGAME: BRUTE FORCE//////////////////////////////
/*
Featuring:
-Quick time events!
-Smooth gameplay!
-Innovative strategies!

Game description: Mash A and D until you get out
*/

/**
 * Perform setup for the Strength minigame.
 *
 * Called by StruggleMinigameStart. Calculates the challenge level based on the
 * base item difficulty, the skill of the rigger and the escapee and modified,
 * if the escapee is bound in a way.
 *
 * @param {Character} C - The character who tries to struggle
 * @param {Item | null} PrevItem - The item, the character wants to struggle out of
 * @param {Item | null} [NextItem] - The item that should substitute the first one
 * @returns {void} - Nothing
 */
function StruggleStrengthSetup(C, PrevItem, NextItem) {
	const StruggleDiff = StruggleStrengthGetDifficulty(C, PrevItem, NextItem);
	StruggleProgressAuto = StruggleDiff.auto;  // S: -9 is floor level to always give a false hope
	StruggleProgressSkill = StruggleDiff.timer;
	StruggleProgressChallenge = StruggleDiff.difficulty * -1;
	StruggleProgressLastKeyPress = "";
}

/**
 * Strength minigame main drawing routine.
 *
 * @param {Character} C - The character for whom the struggle dialog is drawn. That can be the player or another character.
 * @returns {void} - Nothing
 */
function StruggleStrengthDraw(C) {

	// Draw the base controls
	if (StruggleMinigameCheckCancel(C) || StruggleProgressCheckEnd(C)) return;
	StruggleMinigameDrawCommon();

	// Draw the current operation and progress
	if (StruggleProgressAuto < 0) {
		const revealChallenge = StruggleProgressStruggleCount >= STRUGGLE_THRESHOLD_REVEAL || StruggleMinigameShouldBypass();
		const challengeValue = revealChallenge ? StruggleProgressChallenge.toString() : "???";
		const challengeLabel = `${InterfaceTextGet("Challenge")} ${challengeValue}`;
		DrawText(challengeLabel, 1500, 150, "White", "Black");
	}
	DrawText(StruggleProgressOperation, 1500, 650, "White", "Black");
	DrawProgressBar(1200, 700, 600, 100, StruggleProgress);

	// Draw the tighten/loosen button or the explaination message
	if (StruggleAllowLoosen())
		DrawButton(1300, 880, 400, 65, InterfaceTextGet("TryLoosen"), "White");
	else {
		/** @type {"ProgressKeys" | "ProgressClick" | "ProgressKeysController"} */
		let msg = "ProgressKeys";
		if (CommonIsMobile) {
			msg = "ProgressClick";
		} else if (ControllerIsActive()) {
			msg = "ProgressKeysController";
		}
		DrawText(InterfaceTextGet(msg), 1500, 900, "White", "Black");
	}

}

/**
 * Handle events for the Strength minigame
 *
 * @type {StruggleEventListener}
 */
function StruggleStrengthHandleEvent(...args) {
	const [EventType, event] = args;

	// Minigame is not running
	if (StruggleProgress < 0) return false;

	if (EventType === "KeyDown") {
		if (CommonKeyMove(event) === "West" || CommonKeyMove(event) === "East") {
			StruggleStrengthProcess((StruggleProgressLastKeyPress == event.key));
			StruggleProgressLastKeyPress = event.key;
			return true;
		}
	} else if (EventType === "MouseDown") {

		// Only mobile users get to click, otherwise it's too easy.
		if (CommonIsMobile) {
			StruggleStrengthProcess();
			return true;
		}

	} else if (EventType === "Click") {

		// If we must enter the loosen mini-game
		if (MouseIn(1300, 880, 400, 65) && StruggleAllowLoosen()) {
			StruggleLoosenSetup();
			return true;
		}

	}
	return false;
}

/**
 * Advances the Struggle minigame progress
 *
 * The change of facial expressions during struggling is done here
 * @param {boolean} [Decrease] - If set to true, the progress is decreased
 * @returns {void} - Nothing
 */
function StruggleStrengthProcess(Decrease) {

	// Progress calculation
	let P = 42 / (StruggleProgressSkill * CheatFactor("DoubleItemSpeed", 0.5)); // Regular progress, slowed by long timers, faster with cheats
	P = P * (100 / (StruggleProgress + 50));  // Faster when the dialog starts, longer when it ends
	if (StruggleMinigameIsImpossible() && (StruggleProgress > 50) && (StruggleProgressAuto < 0)) {
		// Beyond challenge 6, it becomes impossible after 50% progress
		P = P * (1 - ((StruggleProgress - 50) / 50));
	}
	P = P * (Decrease ? -1 : 1); // Reverses the progress if the user pushed the same key twice

	// Sets the new progress and writes the "Impossible" message if we need to
	StruggleProgress = StruggleProgress + P;
	if (StruggleProgress < 0) StruggleProgress = 0;
	if ((StruggleProgress >= 100) && StruggleMinigameIsImpossible() && (StruggleProgressAuto < 0)) StruggleProgress = 99;
	if (!Decrease) StruggleProgressStruggleCount++;
	StruggleMinigameHandleExpression(Decrease);

}

/**
 * Performs the difficulty calculation for the Strength minigame
 *
 * This function calculates the challenge level based on the base item
 * difficulty, the skill of the rigger and the escapee, accounting for the
 * escapee being bound in a way.
 *
 * @param {Character} C - The character who tries to struggle
 * @param {Item | null} PrevItem - The item, the character wants to struggle out of
 * @param {Item | null} [NextItem] - The item that should substitute the first one
 * @returns {{difficulty: number; auto: number; timer: number; }} - Nothing
 */
function StruggleStrengthGetDifficulty(C, PrevItem, NextItem) {
	let S = 0;
	if ((PrevItem != null) && (C.IsPlayer())) {
		S = S + SkillGetWithRatio(Player, "Evasion"); // Add the player evasion level (modified by the effectiveness ratio)
		if (PrevItem.Difficulty != null) S = S - PrevItem.Difficulty; // Subtract the item difficulty (regular difficulty + player that restrained difficulty)
		if ((PrevItem.Property != null) && (PrevItem.Property.Difficulty != null)) S = S - PrevItem.Property.Difficulty; // Subtract the additional item difficulty for expanded items only
	}
	if ((!C.IsPlayer()) || ((C.IsPlayer()) && (PrevItem == null))) S = S + SkillGetLevel(Player, "Bondage"); // Adds the bondage skill if no previous item or playing with another player
	if (Player.IsEnclose() || Player.IsMounted()) S = S - 2; // A little harder if there's an enclosing or mounting item
	if (PrevItem && InventoryItemHasEffect(PrevItem, "Lock", true) && !DialogCanUnlock(C, PrevItem)) S = S - 4; // Harder to struggle from a locked item

	// When struggling to remove or swap an item while being blocked from interacting
	if ((C.IsPlayer()) && !C.CanInteract() && (PrevItem != null)) {
		if (!InventoryItemHasEffect(PrevItem, "Block", true)) S = S - 4; // Non-blocking items become harder to struggle out when already blocked
		const armsItem = InventoryGet(C, "ItemArms");
		if ((PrevItem.Asset.Group.Name != "ItemArms") && armsItem && InventoryItemHasEffect(armsItem, "Block", true)) S = S - 4; // Harder If we don't target the arms while arms are restrained
		const handsItem = InventoryGet(C, "ItemHands");
		if ((PrevItem.Asset.Group.Name != "ItemHands") && handsItem && InventoryItemHasEffect(handsItem, "Block", true)) S = S - 4; // Harder If we don't target the hands while hands are restrained
		if ((PrevItem.Asset.Group.Name != "ItemMouth") && (PrevItem.Asset.Group.Name != "ItemMouth2") && (PrevItem.Asset.Group.Name != "ItemMouth3") && (PrevItem.Asset.Group.Name != "ItemHead") && (PrevItem.Asset.Group.Name != "ItemHood") && !C.CanTalk()) S = S - 2; // A little harder if we don't target the head while gagged
		if ((ChatRoomStruggleAssistTimer >= CurrentTime) && (ChatRoomStruggleAssistBonus >= 1) && (ChatRoomStruggleAssistBonus <= 6)) S = S + ChatRoomStruggleAssistBonus; // If assisted by another player, the player can get a bonus to struggle out
	}

	// Gets the standard time to do the operation
	let Timer = 0;
	if ((PrevItem != null) && (PrevItem.Asset != null) && (PrevItem.Asset.RemoveTime != null)) Timer = Timer + PrevItem.Asset.RemoveTime; // Adds the time to remove the previous item
	if ((NextItem != null) && (NextItem.Asset != null) && (NextItem.Asset.WearTime != null)) Timer = Timer + NextItem.Asset.WearTime; // Adds the time to add the new item
	if (Player.IsBlind() || Player.IsSuspended()) Timer = Timer * 2; // Double the time if suspended from the ceiling or blind
	Timer /= Math.max(1,2 * (PrevItem?.Craft?.Effects?.Malleable ?? 0) + (NextItem?.Craft?.Effects?.Malleable ?? 0));
	Timer *= Math.max(1,2 * (PrevItem?.Craft?.Effects?.Rigid ?? 0) + (NextItem?.Craft?.Effects?.Rigid ?? 0));

	if (Timer < 1) Timer = 1; // Nothing shorter than 1 second

	// If there's a locking item, we add the time of that lock
	if ((PrevItem != null) && (NextItem == null) && InventoryItemHasEffect(PrevItem, "Lock", true) && DialogCanUnlock(C, PrevItem)) {
		const Lock = InventoryGetLock(PrevItem);
		if ((Lock != null) && (Lock.Asset != null) && (Lock.Asset.RemoveTime != null)) Timer = Timer + Lock.Asset.RemoveTime;
	}

	return {
		difficulty: S,
		auto: TimerRunInterval * (0.22 + (((S <= -10) ? -9 : S) * 0.11)) / (Timer * CheatFactor("DoubleItemSpeed", 0.5)),
		timer: Timer
	};
}

////////////////////////////STRUGGLE MINIGAME: LOOSEN//////////////////////////////

/**
 * Loosen minigame main drawing routine.
 * @param {Character} C - The character for whom the struggle dialog is drawn. That can be the player or another character.
 * @returns {void} - Nothing
 */
function StruggleLoosenDraw(C) {

	// Draws the mini-game circles
	DrawImage("Screens/MiniGame/ChestLockpick/Circle.png", 1200, 150);
	DrawImage("Screens/MiniGame/ChestLockpick/Hole.png", 1500 - 35 + Math.sin(StruggleLoosenHoleAngle) * 260, 450 - 35 + Math.cos(StruggleLoosenHoleAngle) * 260);
	DrawImage("Screens/MiniGame/ChestLockpick/Lockpick.png", 1500 - 35 + Math.sin(StruggleLoosenAngle) * 260, 450 - 35 + Math.cos(StruggleLoosenAngle) * 260);

	// Draw the number of spins left and game instructions
	const item = /** @type {Item} */ (StruggleProgressPrevItem);
	DrawText(item.Asset.Description, 1500, 70, "White", "Black");
	MainCanvas.font = CommonGetFont(300);
	DrawText(StruggleProgressStruggleCount.toString(), 1500, 470, "White", "Black");
	MainCanvas.font = CommonGetFont(36);
	DrawText(InterfaceTextGet("LoosenPossible"), 1500, 850, "White", "Black");
	DrawText(InterfaceTextGet("LoosenClick"), 1500, 930, "White", "Black");

	// Spins the angle, from clockwise to counter, according to the mini-game challenge
	if (StruggleProgressStruggleCount % 2 == 0) StruggleLoosenAngle = StruggleLoosenAngle + (TimerRunInterval / StruggleLoosenSpeed);
	else StruggleLoosenAngle = StruggleLoosenAngle - (TimerRunInterval / StruggleLoosenSpeed);

}

/**
 * Loosen minigame main setup.
 * @returns {void} - Nothing
 */
function StruggleLoosenSetup() {
	StruggleProgressCurrentMinigame = "Loosen";
	StruggleLoosenAngle = 0; // Starting angle for the circle
	StruggleLoosenHoleAngle = Math.PI; // 6.28 for a full 360 circle
	StruggleLoosenSpeed = 400; // Higher number gives slower spin speed
	StruggleProgressStruggleCount = StruggleProgressChallenge;
}

/**
 * Handle events for the loosen minigame
 * @type {StruggleEventListener}
 */
function StruggleLoosenHandleEvent(...args) {
	const [EventType, event] = args;

	// When clicking in the mini-game, we check if it was close enough to the hole for a success
	if (EventType === "MouseDown" || (EventType === "KeyDown" && event.code === "Space")) {
		if (StruggleProgressStruggleCount > 0) {
			let Diff = Math.abs(StruggleLoosenHoleAngle - StruggleLoosenAngle) % (Math.PI * 2);
			if ((Diff > 0.26) && (Diff < (Math.PI * 2) - 0.26)) {
				StruggleLoosenSetup();
			} else {
				StruggleProgressStruggleCount--;
				if (StruggleProgressStruggleCount <= 0) {
					// FIXME: this should be handled by Dialog, using the minigame completion callback.
					// It cannot at the time, as this was entered forcibly through calling StruggleLoosenSetup
					// directly, which makes Dialog severely out-of-sync with what's going on.
					SkillProgress(Player, "Evasion", (StruggleProgressChallenge + 1) * 5);
					if (DialogStrugglePrevItem) {
						if (DialogStrugglePrevItem.Difficulty == null) DialogStrugglePrevItem.Difficulty = 0;
						DialogStrugglePrevItem.Difficulty = DialogStrugglePrevItem.Difficulty - 2;
					}
					CharacterRefresh(Player);
					if (ServerPlayerIsInChatRoom()) {
						ChatRoomCharacterUpdate(Player);
						ChatRoomPublishAction(Player, "ActionLoosenStruggle", DialogStrugglePrevItem, null);
						DialogLeave();
					} else {
						StruggleMinigameStop();
					}
				} else {
					StruggleLoosenSpeed = StruggleLoosenSpeed * 0.95;
					StruggleLoosenHoleAngle = StruggleLoosenHoleAngle + Math.PI / 2 + Math.random() * Math.PI;
				}
			}
		}
	}
	return true;
}

////////////////////////////STRUGGLE MINIGAME: USE FLEXIBILITY//////////////////////////////
/*
Represents squeezing out of a restraint by being limber or having good leverage

Does not get more difficult with a lock on the item
Tightness of the item has extra weight

Game description:
*/


/**
 * Starts the dialog progress bar for struggling out of bondage and keeps the items that needs to be added / swapped / removed.
 * First the challenge level is calculated based on the base item difficulty, the skill of the rigger and the escapee and modified, if
 * the escapee is bound in a way. Also blushing and drooling, as well as playing a sound is handled in this function.
 * @param {Character} C - The character who tries to struggle
 * @param {Item | null} PrevItem - The item, the character wants to struggle out of
 * @param {Item | null} [NextItem] - The item that should substitute the first one
 * @returns {void} - Nothing
 */
function StruggleFlexibilitySetup(C, PrevItem, NextItem) {

	// Gets the required skill / challenge level based on player/rigger skill and item difficulty (0 by default is easy to struggle out)
	let S = 0;
	if ((PrevItem != null) && (C.IsPlayer())) {
		S = S + SkillGetWithRatio(Player, "Evasion"); // Add the player evasion level (modified by the effectiveness ratio)
		if (PrevItem.Difficulty != null) S = S - PrevItem.Difficulty; // Subtract the item difficulty (regular difficulty + player that restrained difficulty)
		if ((PrevItem.Property != null) && (PrevItem.Property.Difficulty != null)) S = S - PrevItem.Property.Difficulty; // Subtract the additional item difficulty for expanded items only
	}
	if ((!C.IsPlayer()) || ((C.IsPlayer()) && (PrevItem == null))) S = S + SkillGetLevel(Player, "Bondage"); // Adds the bondage skill if no previous item or playing with another player
	if (Player.IsEnclose() || Player.IsMounted()) S = S - 4; // Harder if there's an enclosing or mounting item
	if (PrevItem && InventoryItemHasEffect(PrevItem, "Lock", true) && !DialogCanUnlock(C, PrevItem)) S = S - 2; // Locking the item has less effect on flexibility escapes

	// When struggling to remove or swap an item while being blocked from interacting
	if ((C.IsPlayer()) && !C.CanInteract() && (PrevItem != null)) {
		if (!InventoryItemHasEffect(PrevItem, "Block", true)) S = S - 4; // Non-blocking items become harder to struggle out when already blocked
		if (PrevItem.Asset.Category && PrevItem.Asset.Fetish) {
			if (PrevItem.Asset.Fetish.includes("Metal")) S = S - 2; // Metal items are very inflexible
			if (PrevItem.Asset.Fetish.includes("Latex")) S = S + 1; // Latex items are flexible
			if (PrevItem.Asset.Fetish.includes("Nylon")) S = S + 2; // Nylon items are very flexible
		}
		const armsItem = InventoryGet(C, "ItemArms");
		if ((PrevItem.Asset.Group.Name != "ItemArms") && armsItem && InventoryItemHasEffect(armsItem, "Block", true)) S = S - 4; // Harder If we don't target the arms while arms are restrained
		const legsItem = InventoryGet(C, "ItemLegs");
		if ((PrevItem.Asset.Group.Name != "ItemLegs") && legsItem && InventoryItemHasEffect(legsItem, "Block", true)) S = S - 4; // Harder If we don't target the legs while arms are restrained
		const handsItem = InventoryGet(C, "ItemHands");
		if ((PrevItem.Asset.Group.Name != "ItemHands") && handsItem && InventoryItemHasEffect(handsItem, "Block", true)) S = S - 1; // Harder If we don't target the hands while hands are restrained
		const feetItem = InventoryGet(C, "ItemFeet");
		if ((PrevItem.Asset.Group.Name != "ItemFeet") && feetItem && InventoryItemHasEffect(feetItem, "Block", true)) S = S - 2; // Harder if you can't split your feet apart

		if ((PrevItem.Asset.Group.Name == "ItemMouth") || (PrevItem.Asset.Group.Name == "ItemMouth2") || (PrevItem.Asset.Group.Name == "ItemMouth3") || (PrevItem.Asset.Group.Name == "ItemNeck") || (PrevItem.Asset.Group.Name == "ItemHood")) S = S - 4; // The head is not very flexible


		if ((ChatRoomStruggleAssistTimer >= CurrentTime) && (ChatRoomStruggleAssistBonus >= 1) && (ChatRoomStruggleAssistBonus <= 6)) S = S + ChatRoomStruggleAssistBonus; // If assisted by another player, the player can get a bonus to struggle out
	}

	// Gets the standard time to do the operation
	let Timer = 0;
	if ((PrevItem != null) && (PrevItem.Asset != null) && (PrevItem.Asset.RemoveTime != null)) Timer = Timer + PrevItem.Asset.RemoveTime; // Adds the time to remove the previous item
	if ((NextItem != null) && (NextItem.Asset != null) && (NextItem.Asset.WearTime != null)) Timer = Timer + NextItem.Asset.WearTime; // Adds the time to add the new item
	if (Player.IsBlind() || Player.IsSuspended()) Timer = Timer * 2; // Double the time if suspended from the ceiling or blind
	if (Timer < 1) Timer = 1; // Nothing shorter than 1 second

	// If there's a locking item, we add the time of that lock
	if ((PrevItem != null) && (NextItem == null) && InventoryItemHasEffect(PrevItem, "Lock", true) && DialogCanUnlock(C, PrevItem)) {
		const Lock = InventoryGetLock(PrevItem);
		if ((Lock != null) && (Lock.Asset != null) && (Lock.Asset.RemoveTime != null)) Timer = Timer + Lock.Asset.RemoveTime;
	}

	StruggleProgressAuto = TimerRunInterval * (0.22 + (((S <= -10) ? -9 : S) * 0.11)) / (Timer * CheatFactor("DoubleItemSpeed", 0.5));  // S: -9 is floor level to always give a false hope
	StruggleProgressSkill = Timer;
	StruggleProgressChallenge = S * -1;

	StruggleProgressFlexCircles = [];
	StruggleProgressFlexTimer = 0;
}

/**
 * Draw the Flexibility minigame
 * @param {Character} C - The character for whom the struggle dialog is drawn. That can be the player or another character.
 * @returns {void} - Nothing
 */
function StruggleFlexibilityDraw(C) {
	if (StruggleMinigameCheckCancel(C) || StruggleProgressCheckEnd(C)) return;

	if (StruggleProgressFlexTimer < CurrentTime) {
		StruggleProgressFlexTimer = CurrentTime + StruggleProgressFlexCirclesRate + StruggleProgressFlexCirclesRate * Math.random();
		StruggleProgressFlexCircles.push({
			X: Math.random()*StruggleProgressFlexMaxX*2 - StruggleProgressFlexMaxX,
			Y: -StruggleProgressFlexMaxY,
			Size: 37 + Math.floor(Math.random() * 50),
			Velocity: Math.random()*3 + 1,
		});
	}

	for (let RR = 0; RR < StruggleProgressFlexCircles.length; RR++) {
		let R = StruggleProgressFlexCircles[RR];
		if (R.X && R.Y && R.Size) {
			DrawImageResize("Icons/Struggle/Rope.png", 1485 + R.X - R.Size, 625+ R.Y - R.Size, R.Size*2, R.Size*2);
		}

		if (R.Y && R.Velocity)
			R.Y += (R.Velocity + Math.max(0, -StruggleProgressAuto));
	}

	// Check if one of the circles hit the bottom, and decrease the progress for each
	for (let RR = 0; RR < StruggleProgressFlexCircles.length; RR++) {
		let R = StruggleProgressFlexCircles[RR];
		if (R.Y > StruggleProgressFlexMaxY) {
			if (!StruggleMinigameShouldBypass())
				StruggleFlexibilityProcess(true);
			StruggleProgressFlexCircles.splice(RR,1);
			break;
		}
	}

	// Advance the minigame's state
	StruggleFlexibilityProcess();

	StruggleMinigameDrawCommon(-150);

	// Draw the current operation and progress
	if (StruggleProgressAuto < 0) {
		const revealChallenge = StruggleProgressStruggleCount >= STRUGGLE_THRESHOLD_REVEAL || StruggleMinigameShouldBypass();
		const challengeValue = revealChallenge ? StruggleProgressChallenge.toString() : "???";
		const challengeLabel = `${InterfaceTextGet("Challenge")} ${challengeValue}`;
		DrawText(challengeLabel, 1500, 425, "White", "Black");
	}
	DrawText(StruggleProgressOperation, 1500, 476, "White", "Black");
	DrawProgressBar(1200, 800, 600, 100, StruggleProgress);
	if (StruggleAllowLoosen())
		DrawButton(1300, 925, 400, 65, InterfaceTextGet("TryLoosen"), "White");
	else
		DrawText(InterfaceTextGet("ProgressFlex"), 1500, 950, "White", "Black");
}


/**
 * Checks for collision with the mouse
 * @returns {boolean} - Result of check
 */
function StruggleFlexibilityCheck() {

	for (let RR = 0; RR < StruggleProgressFlexCircles.length; RR++) {
		const R = StruggleProgressFlexCircles[RR];

		if (R.X && R.Y && R.Size) {
			const Smod = (CommonIsMobile) ? 1.0 : 0.5;
			if (MouseIn(1485 + R.X - R.Size*Smod, 625 + R.Y - R.Size*Smod, R.Size*2*Smod, R.Size*2*Smod)) {
				StruggleProgressFlexCircles.splice(RR,1);
				return true;
			}
		}
	}
	return false;
}


/**
 * Handle events for the Flexibility minigame
 *
 * @type {StruggleEventListener}
 */
function StruggleFlexibilityHandleEvent(EventType, _event) {

	// Minigame is not running
	if (StruggleProgress < 0) {
		return false;
	}

	// Click events
	if (EventType === "MouseDown") {
		// Process the flex game
		StruggleFlexibilityProcess();
	} else if (EventType === "Click") {
		// If we must enter the loosen mini-game
		if (MouseIn(1300, 925, 400, 65) && StruggleAllowLoosen()) {
			StruggleLoosenSetup();
			return true;
		}
	}
	return false;
}

/**
 * Advances the Flexibility minigame progress
 *
 * @param {boolean} [Decrease] - If set to true, the progress is decreased
 * @returns {void} - Nothing
 */
function StruggleFlexibilityProcess(Decrease) {

	// When increasing, hit-check with the circles. If there's no circle near,
	// abort the increase. This is done this way because this also doubles as
	// the click handler.
	if (!Decrease && !StruggleFlexibilityCheck())
		return;

	// Progress calculation
	let P = 60 / (StruggleProgressSkill/3 * CheatFactor("DoubleItemSpeed", 0.5)); // Regular progress, slowed by long timers, faster with cheats

	if (StruggleMinigameIsImpossible() && (StruggleProgress > 50) && (StruggleProgressAuto < 0)) {
		// Beyond challenge 6, it becomes impossible after 50% progress
		P = P * (1 - ((StruggleProgress - 50) / 50));
	}
	P = P * (Decrease ? -1 : 1); // Reverses the progress if the user pushed the same key twice

	// Sets the new progress and writes the "Impossible" message if we need to
	StruggleProgress = StruggleProgress + P;
	if (StruggleProgress < 0) StruggleProgress = 0;
	if ((StruggleProgress >= 100) && StruggleMinigameIsImpossible() && (StruggleProgressAuto < 0)) StruggleProgress = 99;
	if (!Decrease) StruggleProgressStruggleCount += 3;
	StruggleMinigameHandleExpression(Decrease);
}

////////////////////////////STRUGGLE MINIGAME: DEXTERITY//////////////////////////////
/*
Represents using a sharp object or corner to undo the buckles on a restraint
Much easier if you have legs, arms, hands, toes, or mouth free than brute force
Much harder if you have neither
Extremely ineffective if there is a lock on the item

Game description:
*/



/**
 * Starts the dialog progress bar for struggling out of bondage and keeps the items that needs to be added / swapped / removed.
 * First the challenge level is calculated based on the base item difficulty, the skill of the rigger and the escapee and modified, if
 * the escapee is bound in a way. Also blushing and drooling, as well as playing a sound is handled in this function.
 * @param {Character} C - The character who tries to struggle
 * @param {Item | null} PrevItem - The item, the character wants to struggle out of
 * @param {Item | null} [NextItem] - The item that should substitute the first one
 * @returns {void} - Nothing
 */
function StruggleDexteritySetup(C, PrevItem, NextItem) {

	// Gets the required skill / challenge level based on player/rigger skill and item difficulty (0 by default is easy to struggle out)
	let S = 0;
	if ((PrevItem != null) && (C.IsPlayer())) {
		S = S + SkillGetWithRatio(Player, "Evasion"); // Add the player evasion level (modified by the effectiveness ratio)
		if (PrevItem.Difficulty != null) S = S - PrevItem.Difficulty; // Subtract the item difficulty (regular difficulty + player that restrained difficulty)
		if ((PrevItem.Property != null) && (PrevItem.Property.Difficulty != null)) S = S - PrevItem.Property.Difficulty; // Subtract the additional item difficulty for expanded items only
	}
	if ((!C.IsPlayer()) || ((C.IsPlayer()) && (PrevItem == null))) S = S + SkillGetLevel(Player, "Bondage"); // Adds the bondage skill if no previous item or playing with another player
	if (Player.IsEnclose() || Player.IsMounted()) S = S - 1; // A little harder if there's an enclosing or mounting item
	if (PrevItem && InventoryItemHasEffect(PrevItem, "Lock", true) && !DialogCanUnlock(C, PrevItem)) S = S - 12; // Very hard to struggle from a locked item

	// When struggling to remove or swap an item while being blocked from interacting
	if ((C.IsPlayer()) && !C.CanInteract() && (PrevItem != null)) {
		if (!InventoryItemHasEffect(PrevItem, "Block", true)) S = S - 2; // Non-blocking items become slightly harder to struggle out when already blocked

		if (PrevItem.Asset.Category && PrevItem.Asset.Fetish) {
			if (PrevItem.Asset.Fetish.includes("Tape")) S = S - 3; // Tape is pretty hard to unfasten
		}

		let blockedAreas = 0;

		const armsItem = InventoryGet(C, "ItemArms");
		if (armsItem && InventoryItemHasEffect(armsItem, "Block", true) || InventoryGroupIsBlocked(Player, "ItemArms")) {S = S - 2; blockedAreas += 1;} // Harder if arms are blocked
		const legsItem = InventoryGet(C, "ItemLegs");
		if (legsItem && InventoryItemHasEffect(legsItem, "Block", true) || InventoryGroupIsBlocked(Player, "ItemLegs")) blockedAreas += 1;
		const handsItem = InventoryGet(C, "ItemHands");
		if (handsItem && InventoryItemHasEffect(handsItem, "Block", true) || InventoryGroupIsBlocked(Player, "ItemHands")) blockedAreas += 1;
		if (!C.CanTalk()) blockedAreas += 1;
		const feetItem = InventoryGet(C, "ItemFeet");
		if (feetItem && InventoryItemHasEffect(feetItem, "Block", true) || InventoryGroupIsBlocked(Player, "ItemFeet")) blockedAreas += 1;
		const bootsItem = InventoryGet(C, "ItemBoots");
		if (bootsItem && InventoryItemHasEffect(bootsItem, "Block", true) || InventoryGroupIsBlocked(Player, "ItemBoots")) blockedAreas += 1;

		if (blockedAreas >= 1) S = S - 1; // Little bit harder if only one area is blocked, but you can still manipulate using other parts...
		if (blockedAreas >= 2) S = S - 2; // But wait, it gets harder...
		if (blockedAreas >= 3) S = S - 3; // And harder....
		if (blockedAreas >= 4) S = S - 4; // After a certain point it's pointless
		if (blockedAreas >= 5) S = S - 5; // After a certain point it's pointless

		if (Player.IsBlind()) S = S - 2; // Harder if blind
		if ((ChatRoomStruggleAssistTimer >= CurrentTime) && (ChatRoomStruggleAssistBonus >= 1) && (ChatRoomStruggleAssistBonus <= 6)) S = S + ChatRoomStruggleAssistBonus; // If assisted by another player, the player can get a bonus to struggle out
	}

	// Gets the standard time to do the operation
	let Timer = 0;
	if ((PrevItem != null) && (PrevItem.Asset != null) && (PrevItem.Asset.RemoveTime != null)) Timer = Timer + PrevItem.Asset.RemoveTime; // Adds the time to remove the previous item
	if ((NextItem != null) && (NextItem.Asset != null) && (NextItem.Asset.WearTime != null)) Timer = Timer + NextItem.Asset.WearTime; // Adds the time to add the new item
	if (Player.IsBlind() || Player.IsSuspended()) Timer = Timer * 2; // Double the time if suspended from the ceiling or blind
	if (Timer < 1) Timer = 1; // Nothing shorter than 1 second

	// If there's a locking item, we add the time of that lock
	if ((PrevItem != null) && (NextItem == null) && InventoryItemHasEffect(PrevItem, "Lock", true) && DialogCanUnlock(C, PrevItem)) {
		const Lock = InventoryGetLock(PrevItem);
		if ((Lock != null) && (Lock.Asset != null) && (Lock.Asset.RemoveTime != null)) Timer = Timer + Lock.Asset.RemoveTime;
	}

	// Prepares the progress bar and timer
	StruggleProgressAuto = TimerRunInterval * (0.22 + (((S <= -10) ? -9 : S) * 0.11)) / (Timer * CheatFactor("DoubleItemSpeed", 0.5));  // S: -9 is floor level to always give a false hope
	StruggleProgressSkill = Timer;
	StruggleProgressChallenge = S * -1;

	StruggleProgressDexTarget = Math.random() * 2 * StruggleProgressDexMax - StruggleProgressDexMax;
	StruggleProgressDexCurrent = 0;
	StruggleProgressDexDirectionRight = false;
}

/**
 * Draw the struggle dialog
 * @param {Character} C - The character for whom the struggle dialog is drawn. That can be the player or another character.
 * @returns {void} - Nothing
 */
function StruggleDexterityDraw(C) {
	if (StruggleMinigameCheckCancel(C) || StruggleProgressCheckEnd(C)) return;

	StruggleMinigameDrawCommon();

	DrawImageResize("Icons/Struggle/Buckle.png", 1420 + StruggleProgressDexTarget, 625, 150, 150);
	DrawImageResize("Icons/Struggle/Player.png", 1420 + StruggleProgressDexCurrent, 625, 150, 150);

	const speed = (5 + Math.max(0, -StruggleProgressAuto*7));

	StruggleProgressDexCurrent += (StruggleProgressDexDirectionRight) ? speed : -speed;

	if (StruggleProgressDexCurrent > StruggleProgressDexMax) {
		StruggleProgressDexCurrent = StruggleProgressDexMax;
		StruggleProgressDexDirectionRight = false;
	}
	if (StruggleProgressDexCurrent < -StruggleProgressDexMax) {
		StruggleProgressDexCurrent = -StruggleProgressDexMax;
		StruggleProgressDexDirectionRight = true;
	}

	// Draw the current operation and progress
	if (StruggleProgressAuto < 0) {
		const revealChallenge = StruggleProgressStruggleCount >= STRUGGLE_THRESHOLD_REVEAL || StruggleMinigameShouldBypass();
		const challengeValue = revealChallenge ? StruggleProgressChallenge.toString() : "???";
		const challengeLabel = `${InterfaceTextGet("Challenge")} ${challengeValue}`;
		DrawText(challengeLabel, 1500, 150, "White", "Black");
	}
	DrawText(StruggleProgressOperation, 1500, 600, "White", "Black");
	DrawProgressBar(1200, 800, 600, 100, StruggleProgress);
	if (StruggleAllowLoosen())
		DrawButton(1300, 925, 400, 65, InterfaceTextGet("TryLoosen"), "White");
	else
		DrawText(InterfaceTextGet("ProgressDex"), 1500, 950, "White", "Black");
}


/**
 * Handle events for the Dexterity minigame
 *
 * @type {StruggleEventListener}
 */
function StruggleDexterityHandleEvent(EventType, _event) {

	// Minigame is not running
	if (StruggleProgress < 0) {
		return false;
	}

	// Click events
	if (EventType === "MouseDown") {

		// Process the dex game
		StruggleDexterityProcess();

	} else if (EventType === "Click") {

		// If we must enter the loosen mini-game
		if (MouseIn(1300, 925, 400, 65) && StruggleAllowLoosen()) {
			StruggleLoosenSetup();
			return true;
		}
	}
	return false;
}

/**
 * Advances the Dexterity minigame progress
 *
 * @returns {void} - Nothing
 */
function StruggleDexterityProcess() {

	// Progress calculation
	let P = 200 / (StruggleProgressSkill/3.5 * CheatFactor("DoubleItemSpeed", 0.5)); // Regular progress, slowed by long timers, faster with cheats
	if ((StruggleProgressChallenge > STRUGGLE_THRESHOLD_IMPOSSIBLE) && (StruggleProgress > 50) && (StruggleProgressAuto < 0)) {
		// Beyond challenge 6, it becomes impossible after 50% progress
		P = P * (1 - ((StruggleProgress - 50) / 50));
	}
	const distMult = Math.max(-0.5, Math.min(1, (85 - Math.abs(StruggleProgressDexTarget - StruggleProgressDexCurrent))/75));
	P = P * distMult; // Reverses the progress if too far
	if (P > 0) StruggleProgressDexTarget = Math.random() * 2 * StruggleProgressDexMax - StruggleProgressDexMax;

	// Sets the new progress and writes the "Impossible" message if we need to
	StruggleProgress = StruggleProgress + P;
	if (StruggleProgress < 0) StruggleProgress = 0;
	if ((StruggleProgress >= 100) && (StruggleProgressChallenge > STRUGGLE_THRESHOLD_IMPOSSIBLE) && (StruggleProgressAuto < 0)) StruggleProgress = 99;
	StruggleProgressStruggleCount += Math.max(1, 3*(distMult + 0.5));
	StruggleMinigameHandleExpression();

}


////////////////////////////STRUGGLE MINIGAME: LOCK PICKING//////////////////////////////
/*
Game description: There is a persistent, correct combination which you must find. You have to set the pins in order, but many pins will set falsely, and you will only discover this after attempting to set other pins.
Meanwhile, you have a limited number of pin uses before you have to restart. Restart too many times, and you will become tired for 30s and be unable to pick during that time!

Only applies to locks at the moment
*/



/**
 * Handles events for the LockPicking minigame
 * @type {StruggleEventListener}
 */
function StruggleLockPickHandleEvent(EventType, _event) {
	if (EventType === "Click") {
		StruggleLockPickProcess();
		return true;
	}
	return false;
}

/**
 * Advances the lock picking dialog
 * @returns {void} - Nothing
 */
function StruggleLockPickProcess() {
	const X = 1475;
	const Y = 500;
	const PinSpacing = 100;
	const PinWidth = 200;
	const PinHeight = 200;
	const skill = Math.min(10, SkillGetWithRatio(Player, "LockPicking"));
	const current_pins = StruggleLockPickSet.filter(x => x==true).length;
	const false_set_chance = 0.75 - 0.15 * skill/10;
	const unset_false_set_chance = 0.1 + 0.2 * skill/10;
	if (current_pins < StruggleLockPickSet.length && (LogValue("FailedLockPick", "LockPick") ?? 0) < CurrentTime)
		for (let P = 0; P < StruggleLockPickSet.length; P++) {
			if (!StruggleLockPickSet[P]) {
				const XX = X - PinWidth/2 + (0.5-StruggleLockPickSet.length/2 + P) * PinSpacing;
				if (MouseIn(XX + PinSpacing/2, Y - PinHeight, PinSpacing, PinWidth+PinHeight)) {
					if (StruggleLockPickProgressCurrentTries < StruggleLockPickProgressMaxTries) {

						if (StruggleLockPickOrder[current_pins] == P && StruggleLockPickImpossiblePins.filter(x => x==P).length == 0) {
							// Successfully set the pin
							StruggleLockPickSet[P] = true;
							StruggleLockPickArousalText = ""; // Reset arousal text
							// We also unset any false set pins
							if (current_pins+1 < StruggleLockPickOrder.length && StruggleLockPickSetFalse[StruggleLockPickOrder[current_pins+1]] == true) {
								StruggleLockPickSetFalse[StruggleLockPickOrder[current_pins+1]] = false;
								StruggleLockPickProgressCurrentTries += 1;
							}
						} else {
							StruggleLockPickTotalTries += 1;
							// There is a chance we false set
							if (Math.random() < false_set_chance && StruggleLockPickImpossiblePins.filter(x => x==P).length == 0) {
								StruggleLockPickSetFalse[P] = true;
							} else if (StruggleLockPickSetFalse[P] == false) {
							// Otherwise: fail
								StruggleLockPickProgressCurrentTries += 1;
							}
						}
						if (StruggleLockPickProgressCurrentTries < StruggleLockPickProgressMaxTries) {
							let incrementTries = false;
							for (let PP = 0; PP < StruggleLockPickSetFalse.length; PP++) {
								if (P != PP && StruggleLockPickSetFalse[PP] == true && Math.random() < unset_false_set_chance) {
									StruggleLockPickSetFalse[PP] = false;
									incrementTries = true;
									break;
								}
							}
							if (incrementTries) StruggleLockPickProgressCurrentTries += 1;
						}
						const order = Math.max(0, StruggleLockPickOrder.indexOf(P)-current_pins)/Math.max(1, StruggleLockPickSet.length-current_pins) * (0.25+0.75*skill/10); // At higher skills you can see which pins are later in the order
						StruggleLockPickOffsetTarget[P] = (StruggleLockPickSet[P] || StruggleLockPickSetFalse[P]) ? PinHeight : PinHeight*(0.1+0.8*order);

						if (StruggleLockPickProgressCurrentTries == StruggleLockPickProgressMaxTries && StruggleLockPickSet.filter(x => x==false).length > 0 ) {
							SkillProgress(Player, "LockPicking", StruggleLockPickProgressSkillLose);

						}
					}

					break;
				}
			}
		}

	if (current_pins >= StruggleLockPickSet.length - 1 && StruggleLockPickSet.filter(x => x==false).length == 0 ) {
		StruggleLockPickSuccessTime = CurrentTime + 1000;
	}
}


/**
 * Draw the lockpicking dialog
 * @param {Character} C - The character for whom the lockpicking dialog is drawn. That can be the player or another character.
 * @returns {void} - Nothing
 */
function StruggleLockPickDraw(C) {
	// Place where to draw the pins
	const X = 1475;
	const Y = 500;
	const PinSpacing = 100;
	const PinWidth = 200;
	const PinHeight = 200;
	for (let P = 0; P < StruggleLockPickSet.length; P++) {
		const XX = X - PinWidth/2 + (0.5-StruggleLockPickSet.length/2 + P) * PinSpacing;

		if (StruggleLockPickOffset[P] < StruggleLockPickOffsetTarget[P]) {

			if ( StruggleLockPickOffsetTarget[P] == 0)
				StruggleLockPickOffset[P] = 0;
			else
				StruggleLockPickOffset[P] += 1 + Math.abs(StruggleLockPickOffsetTarget[P] - StruggleLockPickOffset[P])/4;
		}
		if (StruggleLockPickOffset[P] >= StruggleLockPickOffsetTarget[P]) {
			if (StruggleLockPickOffsetTarget[P] != 0)
				StruggleLockPickOffset[P] = StruggleLockPickOffsetTarget[P];
			if (StruggleLockPickOffsetTarget[P] != PinHeight || (!StruggleLockPickSetFalse[P] && !StruggleLockPickSet[P])) {
				StruggleLockPickOffsetTarget[P] = 0;
				StruggleLockPickOffset[P] -= 1 + Math.abs(StruggleLockPickOffsetTarget[P] - StruggleLockPickOffset[P])/8;
			}
		}

		DrawImageResize("Screens/MiniGame/Lockpick/Cylinder.png", XX, Y - PinHeight, PinWidth, PinWidth + PinHeight);
		DrawImageResize("Screens/MiniGame/Lockpick/Pin.png", XX, Y - StruggleLockPickOffset[P], PinWidth, PinWidth);
		if (MouseIn(XX + PinSpacing/2, Y - PinHeight, PinSpacing, PinWidth+PinHeight))
			DrawImageResize("Screens/MiniGame/Lockpick/Arrow.png", XX, Y + 25, PinWidth, PinWidth);
	}


	DrawText(InterfaceTextGet("LockpickTriesRemaining") + (StruggleLockPickProgressMaxTries - StruggleLockPickProgressCurrentTries), X, 212, "white");
	const lastFail = LogValue("FailedLockPick", "LockPick") ?? 0;
	if (lastFail > CurrentTime)
		DrawText(InterfaceTextGet("LockpickFailedTimeout") + TimerToString(lastFail - CurrentTime), X, 262, "red");
	else {
		if (StruggleLockPickProgressCurrentTries >= StruggleLockPickProgressMaxTries && StruggleLockPickSuccessTime == 0) {
			if (StruggleLockPickFailTime > 0) {
				if (StruggleLockPickFailTime < CurrentTime) {
					StruggleLockPickFailTime = 0;

					StruggleLockPickSetup(C, StruggleProgressPrevItem);

				}
				else {
					DrawText(InterfaceTextGet("LockpickFailed"), X, 262, "red");
				}
			} else if (Math.random() < 0.25 && StruggleLockPickTotalTries > 5) {
				// StruggleLockPickTotalTries is meant to give players a bit of breathing room so they don't get tired right away
				if (DialogLentLockpicks)  {
					DialogLentLockpicks = false;
					if (ServerPlayerIsInChatRoom()) {
						const Dictionary = new DictionaryBuilder()
							.sourceCharacter(Player)
							.destinationCharacterName(C)
							.build();
						ChatRoomPublishCustomAction("LockPickBreak", false, Dictionary);
					}
				} else {
					/*
					 * Scale time penalty by skill level -- low skill levels give full penalty,
					 * reducing to zero time at level 10, with each skill level granting a
					 * greater time reduction.
					 */
					const skill_norm = SkillGetLevel (Player, "LockPicking") / SkillLevelMaximum;
					const scalar = Math.sqrt (1.0 - skill_norm * skill_norm);
					if (Math.abs (scalar) > 0.00001) {
						/*  Impose time penalty.  */
						StruggleLockPickFailTime = CurrentTime + StruggleLockPickFailTimeout * scalar;
						StruggleLockPickTotalTries = 0;
						LogAdd("FailedLockPick", "LockPick", StruggleLockPickFailTime);
					} else {
						/*  She's an expert; just jam the lock.  */
						StruggleLockPickFailTime = CurrentTime + 1500;
					}
				}
			} else
				StruggleLockPickFailTime = CurrentTime + 1500;
		}
		if (StruggleLockPickArousalText != "") {
			DrawText(StruggleLockPickArousalText, X, 170, "pink");
		}
	}


	DrawText(InterfaceTextGet("LockpickIntro"), X, 800, "white");
	DrawText(InterfaceTextGet("LockpickIntro2"), X, 850, "white");
	DrawText(InterfaceTextGet("LockpickIntro3"), X, 900, "white");

	if (StruggleMinigameCheckCancel(C)) {
		// We got interrupted
		return;
	} else if (StruggleLockPickSuccessTime != 0 && CurrentTime > StruggleLockPickSuccessTime) {
		StruggleLockPickSuccessTime = 0;

		/** @type {StruggleCompletionData} */
		// @ts-ignore Strict-TS: bit of a mess of whether prev, next or neither
		const data = {
			Progress: 100,
			PrevItem: StruggleProgressPrevItem,
			NextItem: StruggleProgressNextItem,
			Skill: StruggleLockPickProgressSkill,
			Attempts: 0,
			Interrupted: false,
		};

		if (StruggleExitFunction && StruggleProgressCurrentMinigame !== "")
			StruggleExitFunction(C, StruggleProgressCurrentMinigame, data);

		StruggleMinigameStop();
		return;
	} else {
		if ( Player.ArousalSettings && (Player.ArousalSettings.Active != "Inactive" && Player.ArousalSettings.Active != "NoMeter") && Player.ArousalSettings.Progress > 20 && StruggleLockPickProgressCurrentTries < StruggleLockPickProgressMaxTries && StruggleLockPickProgressCurrentTries > 0) {
			if (CurrentTime > StruggleLockPickArousalTick) {
				const arousalmaxtime = 2.6 - 2.0*Player.ArousalSettings.Progress/100;
				if (StruggleLockPickArousalTick - CurrentTime > CurrentTime + StruggleLockPickArousalTickTime*arousalmaxtime) {
					StruggleLockPickArousalTick = CurrentTime + StruggleLockPickArousalTickTime*arousalmaxtime; // In case it gets set out way too far
				}
				const totalSet = StruggleLockPickSet.filter(x => x==true).length + StruggleLockPickSetFalse.filter(x => x==true).length;
				if (StruggleLockPickArousalTick > 0 && totalSet > 0) {
					const RealUnsetChance = StruggleLockPickSet.filter(x => x==true).length / (totalSet);
					if (Math.random() < RealUnsetChance) {
						if (StruggleLockPickSet.filter(x => x==true).length > 0) {
							if (StruggleLockPickSet.filter(x => x==true).length < StruggleLockPickSet.length) {
								for (let P = StruggleLockPickOrder.length; P >= 0; P--) {
									if (StruggleLockPickSet[StruggleLockPickOrder[P]] == true) {
										StruggleLockPickOffsetTarget[StruggleLockPickOrder[P]] = 0;
										StruggleLockPickSet[StruggleLockPickOrder[P]] = false;
										break;
									}
								}
							}
						}
					} else {
						if (StruggleLockPickSetFalse.filter(x => x==true).length > 0) {
							if (StruggleLockPickSetFalse.filter(x => x==true).length < StruggleLockPickSetFalse.length) {
								const startLoop = Math.floor(Math.random() * StruggleLockPickOrder.length);
								let looped = false;
								let P = startLoop;
								while (!looped) {
									if (StruggleLockPickSetFalse[P] == true) {
										StruggleLockPickOffsetTarget[P] = 0;
										StruggleLockPickSetFalse[P] = false;
										break;
									}
									P += 1;
									if (P >= StruggleLockPickOrder.length) P = 0;
									if (P == startLoop) looped = true;
								}
							}
						}
					}

					StruggleLockPickArousalText = InterfaceTextGet("LockPickArousal");
				}
				const arousalmod = (0.3 + Math.random()*0.7) * (arousalmaxtime); // happens very often at 100 arousal
				StruggleLockPickArousalTick = CurrentTime + StruggleLockPickArousalTickTime * arousalmod;
			}
			let alpha = "10";
			if (StruggleLockPickArousalTick - CurrentTime < 1000) alpha = "70";
			else if (StruggleLockPickArousalTick - CurrentTime < 2000) alpha = "50";
			else if (StruggleLockPickArousalTick - CurrentTime < 3000) alpha = "30";
			else if (StruggleLockPickArousalTick - CurrentTime < 5000) alpha = "20";
			DrawRect(0, 0, 2000, 1000, "#FFB0B0" + alpha);
		} else {
			StruggleLockPickArousalText = "";
		}
	}

}

/**
 * Gets the correct label for the current operation (struggling, removing, swaping, adding, etc.)
 * @param {Character} C - The character who acts
 * @param {Item} Item - The item that's part of the action
 * @returns {string} - The appropriate dialog option
 */
function StruggleLockPickProgressGetOperation(C, Item) {
	const lock = InventoryGetLock(Item);
	if ((Item != null && lock != null)) {
		if (lock.Asset.Name == "CombinationPadlock" || lock.Asset.Name == "PasswordPadlock") return InterfaceTextGet("Decoding");
		if (Item.Asset.Name.indexOf("Futuristic") >= 0 || Item.Asset.Name.indexOf("Interactive") >= 0) return InterfaceTextGet("Hacking");
		return InterfaceTextGet("Picking");
	}
	return "...";
}

/**
 * Starts the dialog progress bar for picking a lock
 * First the challenge level is calculated based on the base lock difficulty, the skill of the rigger and the escapee
 * @param {Character} C - The character who tries to struggle
 * @param {Item | null} Item - The item, the character wants to unlock
 * @returns {void} - Nothing
 */
function StruggleLockPickSetup(C, Item) {
	StruggleLockPickArousalText = "";
	StruggleLockPickArousalTick = 0;

	const lock = Item && InventoryGetLock(Item);
	let LockRating = 1;
	let LockPickingImpossible = false;
	if (Item != null && lock) {
		// Gets the lock rating
		const BondageLevel = Item.Difficulty - Item.Asset.Difficulty;

		// Gets the required skill / challenge level based on player/rigger skill and item difficulty (0 by default is easy to pick)
		let S = 0;
		S = S + SkillGetWithRatio(Player, "LockPicking"); // Add the player evasion level (modified by the effectiveness ratio)
		if (lock.Asset.PickDifficulty && lock.Asset.PickDifficulty > 0) {
			S = S - lock.Asset.PickDifficulty; // Subtract the item difficulty (regular difficulty + player that restrained difficulty)
			LockRating = lock.Asset.PickDifficulty; // Some features of the minigame are independent of the relative skill level
		}
		//if (Item.Asset && Item.Asset.Difficulty) {
		//S -= BondageLevel/2 // Adds the bondage skill of the item but not the base difficulty!
		//}

		if (Player.IsEnclose() || Player.IsMounted()) S = S - 2; // A little harder if there's an enclosing or mounting item

		// When struggling to pick a lock while being blocked from interacting (for the future if we allow picking locks while bound -Ada)
		if (!Player.CanInteract() && (Item != null)) {

			if (InventoryItemHasEffect(Item, "NotSelfPickable", true))
			{
				S = S - 50;
				LockPickingImpossible = true;
			} // Impossible if the item is such that it can't be picked alone (e.g yokes or elbow cuffs)
			else {
				const armsItem = InventoryGet(Player, "ItemArms");
				if (armsItem && InventoryItemHasEffect(armsItem, "Block", true)) {
					if (Item.Asset.Group.Name != "ItemArms" && Item.Asset.Group.Name != "ItemHands")
						S = S - 50; // MUST target arms item or hands item if your arrms are bound
					else
						S = S - 2; // Harder If arms are restrained
				}
				const itemHands = InventoryGet(Player, "ItemHands");
				if (itemHands && InventoryItemHasEffect(itemHands, "Block", true)) {
					if (!LogQuery("KeyDeposit", "Cell") && DialogHasKey(Player, Item))// If you have keys, its just a matter of getting the keys into the lock~
						S = S - 4;
					else // Otherwise it's not possible to pick a lock. Too much dexterity required
						S = S - 50;
					// With key, the difficulty is as follows:
					// Mittened and max Lockpinking, min bondage: Metal padlock is easy, intricate is also easy, anything above will be slightly more challenging than unmittened
					// Mittened, arms bound, and max Lockpinking, min bondage: Metal padlock is easy, intricate is somewhat hard, high security is very hard, combo impossible
				}

				if (S < -6) {
					LockPickingImpossible = true; // The above stuff can make picking the lock impossible. Everything else will make it incrementally harder
				}

				if (!C.CanTalk()) S = S - 1; // A little harder while gagged, but it wont make it impossible
				const legsItem = InventoryGet(Player, "ItemLegs");
				if (legsItem && InventoryItemHasEffect(legsItem, "Block", true)) S = S - 1; // A little harder while legs bound, but it wont make it impossible
				const feetItem = InventoryGet(Player, "ItemFeet");
				if (feetItem && InventoryItemHasEffect(feetItem, "Block", true)) S = S - 1; // A little harder while legs bound, but it wont make it impossible
				if (InventoryGroupIsBlocked(Player, "ItemFeet")) S = S - 1; // A little harder while wearing something like a legbinder as well
				if (Player.IsBlind()) S = S - 1; // harder while blind
				if (Player.GetDeafLevel() > 0) S = S - Math.ceil(Player.GetDeafLevel()/2); // harder while deaf

				// No bonus from struggle assist. Lockpicking is a solo activity!
			}
		}

		// Gets the number of pins on the lock
		let NumPins = 4;
		if (LockRating >= 6) NumPins += 2; // 6 pins for the intricate lock
		if (LockRating >= 8) NumPins += 1; // 7 pins for the exclusive lock
		if (LockRating >= 10) NumPins += 1; // 8 pins for the high security lock
		if (LockRating >= 11) NumPins += 2; // Cap at 10 pins

		StruggleLockPickOrder = [];
		StruggleLockPickSet = [];
		StruggleLockPickSetFalse = [];
		StruggleLockPickOffset = [];
		StruggleLockPickOffsetTarget = [];
		StruggleLockPickImpossiblePins = [];

		StruggleProgressOperation = StruggleLockPickProgressGetOperation(C, Item);
		StruggleLockPickProgressSkill = Math.floor(NumPins*NumPins/2) + Math.floor(Math.max(0, -S)*Math.max(0, -S)); // Scales squarely, so that more difficult locks provide bigger reward!
		StruggleLockPickProgressSkillLose = NumPins*NumPins/2; // Even if you lose you get some reward. You get this no matter what if you run out of tries.
		StruggleLockPickProgressChallenge = S * -1;
		StruggleLockPickProgressCurrentTries = 0;
		StruggleLockPickSuccessTime = 0;
		StruggleLockPickFailTime = 0;

		for (let P = 0; P < NumPins; P++) {
			StruggleLockPickOrder.push(P);
			StruggleLockPickSet.push(false);
			StruggleLockPickSetFalse.push(false);
			StruggleLockPickOffset.push(0);
			StruggleLockPickOffsetTarget.push(0);
		}
		/* Randomize array in-place using Durstenfeld shuffle algorithm */
		// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
		for (var i = StruggleLockPickOrder.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = StruggleLockPickOrder[i];
			StruggleLockPickOrder[i] = StruggleLockPickOrder[j];
			StruggleLockPickOrder[j] = temp;
		}

		// Save the pins to the item
		if (Item.Property == null) {
			Item.Property = {};
		}

		if (Item.Property.LockPickSeed == null || typeof Item.Property.LockPickSeed !== "string") {
			// Old seed is invalid, use the one we just built
			Item.Property.LockPickSeed = StruggleLockPickOrder.join(",");
			StruggleLockPickTotalTries = 0;
			ChatRoomCharacterItemUpdate(C, Item.Asset.Group.Name);
		} else {
			// Load the seed and type-check it. If anything is wrong, use the one we built
			let conv = CommonConvertStringToArray(Item.Property.LockPickSeed);
			if (!conv.every(num => typeof num === "number")) {
				Item.Property.LockPickSeed = StruggleLockPickOrder.join(",");
				ChatRoomCharacterItemUpdate(C, Item.Asset.Group.Name);
				conv = StruggleLockPickOrder;
			}
			StruggleLockPickOrder = conv;
		}

		if (S < -6 && LockPickingImpossible) {
			// if picking is impossible, then some pins will never set
			StruggleLockPickImpossiblePins.push(StruggleLockPickOrder[StruggleLockPickOrder.length-1]);
			if (NumPins >= 6) StruggleLockPickImpossiblePins.push(StruggleLockPickOrder[StruggleLockPickOrder.length-2]);
			if (NumPins >= 8) StruggleLockPickImpossiblePins.push(StruggleLockPickOrder[StruggleLockPickOrder.length-3]);
		}

		// At 4 pins we have a base of 16 tries, with 10 maximum permutions possible
		// At 10 pins we have a base of 40-30 tries, with 55 maximum permutions possible
		const NumTries = Math.max(Math.floor(NumPins * (1.5 - 0.3*BondageLevel/10)),
			Math.ceil(NumPins * (3.25 - BondageLevel/10) - Math.max(0, (StruggleLockPickProgressChallenge + BondageLevel/2)*1.5)));
			// negative skill of 1 subtracts 2 from the normal lock and 4 from 10 pin locks,
			// negative skill of 6 subtracts 12 from all locks

		// More of less tries if the item is crafted with specific properties
		StruggleLockPickProgressMaxTries = Math.max(1, NumTries - NumPins);

		StruggleLockPickProgressMaxTries += 2 * (Item?.Craft?.Effects.Simple ?? 0);
		StruggleLockPickProgressMaxTries = Math.max(1, StruggleLockPickProgressMaxTries - 1 * (Item?.Craft?.Effects.Puzzling ?? 0));
	}
}

/**
 * Starts the online chat room struggle progress
 * @param {Item} item
 * @returns {void} - Nothing
 */
function StruggleChatRoomStart(item) {
	ChatRoomPublishAction(Player, "ChatRoomStruggleStart", item, null);
	let Diff = StruggleStrengthGetDifficulty(Player, item, null);
	if (Diff.timer < 0) Diff.timer = 0;
	Diff.timer = Diff.timer + 10;

	/**
	 * @param {AssetExpressionGroup["Name"]} group
	 * @returns {ExpressionName | undefined}
	 */
	const getExpressionFromGroup = (group) => {
		return [group].map(g => InventoryGet(Player, g)).map(i => i?.Property.Expression).filter(Boolean)[0] ?? null;
	};

	ChatRoomStruggleData = {
		Item: { ...item },
		Progress: 0,
		LoosenMode: false,
		AllowLoosen: false,
		Difficulty: Diff.difficulty,
		Timer: Diff.timer,
		Start: CommonTime(),
		LastRun: CommonTime(),
		NextAnim: CommonTime() + 1000 + Math.floor(Math.random() * 3000),
		StartExpressionEyes: getExpressionFromGroup("Eyes"),
		StartExpressionBlush: getExpressionFromGroup("Blush"),
		StartExpressionMouth: getExpressionFromGroup("Mouth"),
		StartExpressionEyebrows: getExpressionFromGroup("Eyebrows"),
	};
	DialogLeave();
}

/**
 * Starts the loosen progress bar
 * @returns {void} - Nothing
 */
function StruggleChatRoomLoosenStart() {
	if (!ChatRoomStruggleData) return;
	ChatRoomStruggleData.LoosenMode = true;
	ChatRoomStruggleData.Progress = 0;
	ChatRoomStruggleData.AllowLoosen = false;
	ChatRoomStruggleData.Start = CommonTime();
	ChatRoomStruggleData.LastRun = CommonTime();
}

/**
 * Ends the loosen progress bar, reducing the difficulty to struggle
 * @returns {void} - Nothing
 */
function StruggleChatRoomLoosenComplete() {
	if (!ChatRoomStruggleData) return;
	ChatRoomPublishAction(Player, "ChatRoomStruggleLoosenComplete" + Math.floor(Math.random() * 5).toString(), ChatRoomStruggleData.Item, null);
	ChatRoomStruggleData.Difficulty++;
	ChatRoomStruggleData.LoosenMode = false;
	ChatRoomStruggleData.Progress = 0;
	ChatRoomStruggleData.AllowLoosen = false;
	ChatRoomStruggleData.Start = CommonTime();
	ChatRoomStruggleData.LastRun = CommonTime();
}

/**
 * Restores the previous expressions and ends the struggling
 * @returns {void} - Nothing
 */
function StruggleChatRoomEndAmination() {
	if (Player.OnlineSharedSettings.ItemsAffectExpressions && ChatRoomStruggleData) {
		CharacterSetFacialExpression(Player, "Eyes", ChatRoomStruggleData.StartExpressionEyes);
		CharacterSetFacialExpression(Player, "Blush", ChatRoomStruggleData.StartExpressionBlush);
		CharacterSetFacialExpression(Player, "Mouth", ChatRoomStruggleData.StartExpressionMouth);
		CharacterSetFacialExpression(Player, "Eyebrows", ChatRoomStruggleData.StartExpressionEyebrows);
	}
	ChatRoomStruggleData = null;
}

/**
 * Ends the online chat room struggle progress
 * @returns {void} - Nothing
 */
function StruggleChatRoomStop() {
	if (!ChatRoomStruggleData) return;
	ChatRoomPublishAction(Player, "ChatRoomStruggleGiveUp", ChatRoomStruggleData.Item, null);
	StruggleChatRoomEndAmination();
}

/**
 * Ends the online chat room struggle progress, interrupted by another player
 * @returns {void} - Nothing
 */
function StruggleChatRoomInterrupt() {
	if (!ChatRoomStruggleData) return;
	ChatRoomPublishAction(Player, "ChatRoomStruggleInterrupt", ChatRoomStruggleData.Item, null);
	StruggleChatRoomEndAmination();
}

/**
 * Ends the online chat room struggle progress
 * @returns {void} - Nothing
 */
function StruggleChatRoomSuccess() {
	if (!ChatRoomStruggleData) return;
	if (DialogStrugglePrevItem != null) {
		ChatRoomPublishAction(Player, "ChatRoomStruggleSuccess", ChatRoomStruggleData.Item, null);
		InventoryRemove(Player, ChatRoomStruggleData.Item.Asset.Group.Name);
		ChatRoomCharacterItemUpdate(Player, ChatRoomStruggleData.Item.Asset.Group.Name);
	}
	StruggleChatRoomEndAmination();
}
