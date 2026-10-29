"use strict";

var ChatRoomCharacterViewInitialize = true;
var ChatRoomCharacterViewSlideWeight = 9;
var ChatRoomCharacterViewX_Upper = 0;
var ChatRoomCharacterViewX_Lower = 0;
var ChatRoomCharacterViewZoom = 1;
/** @type {number} */
var ChatRoomCharacterViewCharacterCount = 0;
/** @type {number} */
var ChatRoomCharacterViewCharacterCountTotal = 0;
/** @type {null | number} */
var ChatRoomCharacterViewMoveTarget = null;
/** @type {number} */
var ChatRoomCharacterViewOffset = 0;

const ChatRoomCharacterViewWidth = MainCanvasWidth / 2;
const ChatRoomCharacterViewHeight = MainCanvasHeight;
const ChatRoomCharacterViewCharactersPerRow = 5;

/**
 * The name of the chat room character view.
 * @type {"Character"}
 */
const ChatRoomCharacterViewName = "Character";

/**
 * Indicates if the chat room character view is active or not
 * @returns {boolean} - TRUE if the chat room character view is active, false if not
 */
function ChatRoomCharacterViewIsActive() {
	return ChatRoomIsViewActive(ChatRoomCharacterViewName);
}

/**
 * Run handler for the chat room character view
 * @type {ScreenRunHandler}
 */
function ChatRoomCharacterViewRun() {
}

/**
 * Handles clicks the chatroom screen view.
 * @type {MouseEventListener}
 */
function ChatRoomCharacterViewClick(event) {

	// Intercepts the online game chat room clicks if we need to
	if (OnlineGameClick()) return;

	// Checks if there was a click on a character
	ChatRoomCharacterViewLoopCharacters((charIdx, charX, charY, space, zoom) => {
		if (MouseIn(charX, charY, space, 1000 * zoom)) {
			return ChatRoomCharacterViewClickCharacter(ChatRoomCharacterDrawlist[charIdx], charX, charY, zoom, (MouseX - charX) / zoom, (MouseY - charY) / zoom);
		}
	});

}

/** @type {KeyboardEventListener} */
function ChatRoomCharacterViewKeyDown(event) {
	return false;
}

/**
 * Returns TRUE if the player can leave
 * @returns {boolean} - True if the player can leave
 */
function ChatRoomCharacterViewCanLeave() {
	return true;
}

/**
 * Take a screenshot of all characters in the chatroom
 * @returns {void} - Nothing
 */
function ChatRoomCharacterViewScreenshot() {
	// Get the room dimensions
	const charCount = ChatRoomCharacterViewCharacterCount;
	const charsPerRow = ChatRoomCharacterViewCharactersPerRow;
	const viewWidth = ChatRoomCharacterViewWidth;
	const viewHeight = ChatRoomCharacterViewHeight;
	let Space = charCount >= 2 ? viewWidth / Math.min(charCount, charsPerRow) : viewWidth / 2;
	let Zoom = charCount >= 3 && charCount <= charsPerRow ? Space / 400 : 1;
	let X = charCount === 1 ? 250 : 0;
	let Y = charCount <= charsPerRow ? viewWidth * (1 - Zoom) / 2 : 0;
	let Width = charCount === 1 ? viewWidth / 2 : viewWidth;

	// Take the photo
	ChatRoomPhoto(X, Y, Width, viewHeight * Zoom, ChatRoomCharacter);
}

/**
 * Returns TRUE if the map button can be used
 * @deprecated
 * @returns {boolean} - TRUE if can be used
 */
function ChatRoomCharacterViewShowMapButton() {
	return (!ChatRoomIsViewActive(ChatRoomMapViewName) && ChatRoomData?.MapData?.Type != "Never");
}

/**
 * Called when character is clicked
 * @param {OnlineCharacter} C The target character
 * @param {number} CharX Character's X position on canvas
 * @param {number} CharY Character's Y position on canvas
 * @param {number} Zoom Room zoom
 * @param {number} ClickX Click X postion relative to character, without zoom
 * @param {number} ClickY Click Y postion relative to character, without zoom
 */
function ChatRoomCharacterViewClickCharacter(C, CharX, CharY, Zoom, ClickX, ClickY) {

	// Click on name
	if (ClickY > 900) {

		// Clicking on self or current target removes whisper target
		if (C.IsPlayer() || ChatRoomTargetMemberNumber === C.MemberNumber) {
			ChatRoomSetTarget(-1);
			return;
		}

		// BlockWhisper rule, if owner is in chatroom
		if (ChatRoomOwnerPresenceRule("BlockWhisper", C)) return;

		// Sensory deprivation setting: Total (no whispers) blocks whispers while blind unless both players are in the virtual realm. Then they can text each other.
		if (Player.GameplaySettings.SensDepChatLog === "SensDepExtreme" && Player.GetBlindLevel() >= 3 && !(Player.Effect.includes("VRAvatars") && C.Effect.includes("VRAvatars"))) return;

		// Sets the target
		ChatRoomSetTarget(C.MemberNumber);
		return;
	}

	// Moving character inside room
	if (ChatRoomCharacterViewMoveTarget !== null) {
		const MoveTargetPos = ChatRoomCharacter.findIndex(c => c.MemberNumber === ChatRoomCharacterViewMoveTarget);
		if (MoveTargetPos < 0) {
			ChatRoomCharacterViewMoveTarget = null;
		} else {
			const Pos = ChatRoomCharacter.findIndex(c => c.MemberNumber === C.MemberNumber);
			if (Pos < MoveTargetPos && MouseIn(CharX + 100 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom)) {
				// Move left
				for (let i = 0; i < MoveTargetPos - Pos; i++) {
					ServerSend("ChatRoomAdmin", {
						MemberNumber: ChatRoomCharacterViewMoveTarget,
						Action: "MoveLeft",
						Publish: i === 0
					});
				}
				ChatRoomCharacterViewMoveTarget = null;
			} else if (MouseIn(CharX + 200 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom)) {
				// Swap or cancel
				if (ChatRoomCharacterViewMoveTarget !== C.MemberNumber) {
					ServerSend("ChatRoomAdmin", {
						MemberNumber: Player.ID,
						TargetMemberNumber: ChatRoomCharacterViewMoveTarget,
						DestinationMemberNumber: C.MemberNumber,
						Action: "Swap"
					});
				}
				ChatRoomCharacterViewMoveTarget = null;
			} else if ( Pos > MoveTargetPos && MouseIn(CharX + 300 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom)) {
				// Move right
				for (let i = 0; i < Pos - MoveTargetPos; i++) {
					ServerSend("ChatRoomAdmin", {
						MemberNumber: ChatRoomCharacterViewMoveTarget,
						Action: "MoveRight",
						Publish: i === 0
					});
				}
				ChatRoomCharacterViewMoveTarget = null;
			}
			return;
		}
	}

	// Disable examining when blind setting. If both players are in the virtual realm, then they can examine each other.
	if (Player.GameplaySettings.BlindDisableExamine && !(Player.Effect.includes("VRAvatars") && C.Effect.includes("VRAvatars")) && !C.IsPlayer() && Player.GetBlindLevel() >= 3) {
		return;
	}

	// If the arousal meter is shown for that character, we can interact with it
	if (PreferenceArousalAtLeast(C, "Manual")) {
		let MeterShow = C.IsPlayer();
		if (!C.IsPlayer() && Player.ArousalSettings.ShowOtherMeter && C.ArousalSettings) {
			if (C.ArousalSettings.Visible === "Access") {
				MeterShow = C.AllowItem;
			} else if (C.ArousalSettings.Visible === "All") {
				MeterShow = true;
			}
		}
		if (MeterShow) {
			// The arousal meter can be maximized or minimized by clicking on it
			if (MouseIn(CharX + 60 * Zoom, CharY + 400 * Zoom, 80 * Zoom, 100 * Zoom) && !C.ArousalZoom) { C.ArousalZoom = true; return; }
			if (MouseIn(CharX + 50 * Zoom, CharY + 615 * Zoom, 100 * Zoom, 85 * Zoom) && C.ArousalZoom) { C.ArousalZoom = false; return; }

			// If the player can manually control her arousal, we set the progress manual and change the facial expression, it can trigger an orgasm at 100%
			if (C.IsPlayer() && MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 500 * Zoom) && C.ArousalZoom) {
				if (PreferenceArousalAtLeast(Player, "Manual") && !PreferenceArousalAtLeast(Player, "Automatic")) {
					var Arousal = Math.round((CharY + 625 * Zoom - MouseY) / (4 * Zoom));
					ActivitySetArousal(Player, Arousal);
					ActivityExpression(Player, Player.ArousalSettings.Progress);
					if (Player.ArousalSettings.Progress == 100) ActivityOrgasmPrepare(Player);
				}
				return;
			}

			// Don't do anything if the thermometer is clicked without access to it
			if (MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 415 * Zoom) && C.ArousalZoom) return;
		}
	}

	// Intercepts the online game character clicks if we need to
	if (OnlineGameClickCharacter(C)) return;

	// Gives focus to the character
	ChatRoomFocusCharacter(C);
}

/**
 * Draws the chatroom characters.
 * @returns {void} - Nothing.
 */
function ChatRoomCharacterViewDraw() {

	// Check if we should use a custom background
	const backgroundURL = DrawGetBackgroundURL(false);

	const charCount = ChatRoomCharacterViewCharacterCount;
	const charsPerRow = ChatRoomCharacterViewCharactersPerRow;
	const viewWidth = ChatRoomCharacterViewWidth;
	const viewHeight = ChatRoomCharacterViewHeight;
	const opts = {
		inverted: Player.GraphicsSettings.InvertRoom && Player.IsInverted(),
		blur: Player.GetBlurLevel(),
		darken: DrawGetDarkFactor(),
		tints: Player.GetTints(),
		sizeMode: ChatRoomData?.Custom?.SizeMode,
	};

	// Loop over the room's characters to draw each of them
	ChatRoomCharacterViewLoopCharacters((charIdx, charX, charY, _space, roomZoom) => {

		// Draw the background every five characters, this fixes clipping errors
		if (backgroundURL && charIdx % charsPerRow === 0) {
			const Y = charCount <= charsPerRow ? viewHeight * (1 - roomZoom) / 2 : 0;
			const bgRect = RectMakeRect(0, Y + charIdx * 100, viewWidth, viewHeight * roomZoom);
			DrawRoomBackground(backgroundURL, bgRect, opts);
		}

		// Draw the character, it's status bubble and it's overlay
		DrawCharacter(ChatRoomCharacterDrawlist[charIdx], charX, charY, roomZoom);
		DrawStatus(ChatRoomCharacterDrawlist[charIdx], charX, charY, roomZoom);
		if (ChatRoomCharacterDrawlist[charIdx].MemberNumber != null) {
			ChatRoomCharacterViewDrawOverlay(ChatRoomCharacterDrawlist[charIdx], charX, charY, roomZoom);
		}
	});

}

/**
 * Draws extra controls on the character view UI
 * @returns {void} - Nothing
 */
function ChatRoomCharacterViewDrawUi() {
}

/**
 * Iterate over a room's characters
 *
 * This function takes a callback it will call for each character in turn after having
 * calculated their respective drawing parameters (location), accounting for the smooth zoom effect
 * @param {(charIdx: number, charX: number, charY: number, space: number, zoom: number) => boolean | void} callback
 */
function ChatRoomCharacterViewLoopCharacters(callback) {

	const charCount = ChatRoomCharacterViewCharacterCount;
	const charsPerRow = ChatRoomCharacterViewCharactersPerRow;
	const viewWidth = ChatRoomCharacterViewWidth;
	const viewHeight = ChatRoomCharacterViewHeight;

	// Determine the horizontal & vertical position and zoom levels to fit all characters evenly in the room
	const Space = charCount >= 2 ? viewWidth / Math.min(charCount, 5) : viewWidth / 2;

	// Gradually slide the characters around to make room
	let weight = ChatRoomCharacterViewSlideWeight;
	// Calculate a multiplier based on current framerate to keep the speed of the animation consistent across different framerates
	let frametimeAdjustment = TimerRunInterval / (1000 / 30);
	if (ChatRoomCharacterViewInitialize || !(Player.GraphicsSettings && Player.GraphicsSettings.SmoothZoom)) {
		ChatRoomCharacterViewInitialize = false;
		weight = 0;
	}

	/** @param {number} current */
	const zoomFrameStep = (current) => (current * weight + ((charCount >= 3 ? Space / 400 : 1))) / (weight + 1);
	/** @param {number} current */
	const slideUpperFrameStep = (current) => (current * weight + 500 - 0.5 * Space * Math.min(charCount, charsPerRow))/(weight + 1);
	/** @param {number} current */
	const slideLowerFrameStep = (current) => (current * weight + 500 - 0.5 * Space * Math.max(1, charCount - charsPerRow))/(weight + 1);

	let zoom = ChatRoomCharacterViewZoom;
	let upperX = ChatRoomCharacterViewX_Upper;
	let lowerX = ChatRoomCharacterViewX_Lower;
	for (let i = 0; i < frametimeAdjustment; i++) {
		const nextZoom = zoomFrameStep(zoom);
		const nextUpperX = slideUpperFrameStep(upperX);
		const nextLowerX = slideLowerFrameStep(lowerX);

		if (weight === 0) {
			// skip unnecessary calculations
			zoom = nextZoom;
			upperX = nextUpperX;
			lowerX = nextLowerX;
			break;
		}

		const frametimeRemainder = frametimeAdjustment - i;
		if (frametimeRemainder >= 1) {
			zoom = nextZoom;
			upperX = nextUpperX;
			lowerX = nextLowerX;
		} else {
			zoom += (nextZoom - zoom) * frametimeRemainder;
			upperX += (nextUpperX - upperX) * frametimeRemainder;
			lowerX += (nextLowerX - lowerX) * frametimeRemainder;
		}
	}

	ChatRoomCharacterViewZoom = zoom;
	ChatRoomCharacterViewX_Upper = upperX;
	ChatRoomCharacterViewX_Lower = lowerX;

	// The more players, the higher the zoom, also changes the drawing coordinates
	const Zoom = zoom;
	const X = charCount >= 3 ? (Space - viewWidth / 2 * Zoom) / 2 : 0;
	const Y = charCount <= 5 ? viewHeight * (1 - Zoom) / 2 : 0;

	// Draw the characters (in click mode, we can open the character menu or start whispering to them)
	for (let C = 0; C < ChatRoomCharacterDrawlist.length; C++) {

		// Finds the X and Y position of the character based on it's room position
		let offsetX = 0;
		if (Player.GraphicsSettings?.CenterChatrooms) offsetX = C >= charsPerRow ? lowerX : upperX;
		const CharX = offsetX + (charCount == 1 ? 0 : X + (C % charsPerRow) * Space);
		const CharY = charCount == 1 ? 0 : Y + Math.floor(C / charsPerRow) * CanvasDrawWidth;
		if ((charCount == 1) && (ChatRoomCharacterViewCharacterCountTotal <= 10) && !ChatRoomCharacterDrawlist[C].IsPlayer()) continue;

		const res = callback(C, CharX, CharY, Space, Zoom);
		if (res) break;
	}
}

/**
 * Draws any overlays on top of character
 * @param {OnlineCharacter} C The target character
 * @param {number} CharX Character's X position on canvas
 * @param {number} CharY Character's Y position on canvas
 * @param {number} Zoom Room zoom
 */
function ChatRoomCharacterViewDrawOverlay(C, CharX, CharY, Zoom) {

	// Draw the ghostlist/friendlist, whitelist/blacklist, admin icons, etc. above the character
	if (ChatRoomHideIconState == ChatRoomHideIconStateType.SHOW_ALL) {
		ChatRoomDrawCharacterStatusIcons(C, CharX, CharY, Zoom);
	}

	// Draws the whisper bubble if we hover over a character
	if (ChatRoomTargetMemberNumber == C.MemberNumber && ChatRoomHideIconState <= ChatRoomHideIconStateType.NO_ICONS) {
		DrawImage("Icons/Whisper.png", CharX + 75 * Zoom, CharY + 950 * Zoom);
	}

	// Draws the move/swap buttons if there's a target to assign
	if (ChatRoomCharacterViewMoveTarget !== null) {
		const MoveTargetPos = ChatRoomCharacter.findIndex(c => c.MemberNumber === ChatRoomCharacterViewMoveTarget);
		if (MoveTargetPos < 0) {
			ChatRoomCharacterViewMoveTarget = null;
		} else {
			if (ChatRoomCharacterViewMoveTarget === C.MemberNumber) {
				DrawButton(CharX + 200 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom, "", "White");
				DrawImageResize("Icons/Remove.png", CharX + 202 * Zoom, CharY + 752 * Zoom, 86 * Zoom, 86 * Zoom);
			} else {
				const Pos = ChatRoomCharacter.findIndex(c => c.MemberNumber === C.MemberNumber);
				if (Pos < MoveTargetPos) {
					DrawButton(CharX + 100 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom, "", "White");
					DrawImageResize("Icons/Here.png", CharX + 102 * Zoom, CharY + 752 * Zoom, 86 * Zoom, 86 * Zoom);
				}
				DrawButton(CharX + 200 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom, "", "White");
				DrawImageResize("Icons/Swap.png", CharX + 202 * Zoom, CharY + 752 * Zoom, 86 * Zoom, 86 * Zoom);
				if (Pos > MoveTargetPos) {
					DrawButton(CharX + 300 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom, "", "White");
					DrawImageResize("Icons/Here.png", CharX + 302 * Zoom, CharY + 752 * Zoom, 86 * Zoom, 86 * Zoom);
				}
			}
		}
	}

	// Draws the red prison timer for Pandora prisoners and green timer for guards
	if (ChatRoomGetGame() === "Prison") {
		const time = C.Game?.Prison?.Timer ?? CurrentTime;
		const color = PandoraPenitentiaryIsInmate(C) ? "#FF8080" : PandoraPenitentiaryIsGuard(C) ? "#80FF80" : "";
		DrawText(TimerToString(time - CurrentTime), CharX + 252 * Zoom, CharY + 922 * Zoom, color, "Black");
	}
}
