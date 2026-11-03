"use strict";
var MaidDrinksBackground = "Bar";
/** @type {NPCCharacter} */
var MaidDrinksCustomerLeft = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var MaidDrinksCustomerRight = /** @type {never} */ (null);
var MaidDrinksCustomerLeftTimer = -1;
var MaidDrinksCustomerRightTimer = -1;
var MaidDrinksCustomerLeftVisible = false;
var MaidDrinksCustomerRightVisible = false;
var MaidDrinksMaxSequence = 1000;
/** @type {{ Type: number, Time: number, FadeAt?: number }[]} */
var MaidDrinksMove = [];
var MaidDrinksLastMoveType = -1;
var MaidDrinksLastMoveTypeTimer = -1;

// The game is played using the S, D, K & L keys
var MaidDrinksKeys = ["S", "D", "K", "L"];

/**
 * Generates a full sequence
 * @param {number} StartTime - Start time of the sequence
 */
function MaidDrinksGenerateMove(StartTime) {

	// Full the sequence
	var CurTimer = StartTime + 3500;
	var Seq = 0;
	MaidDrinksMove = [];
	while (Seq < MaidDrinksMaxSequence) {

		// Create a new move to do at a random position
		MaidDrinksMove[MaidDrinksMove.length] = { Type: Math.floor(Math.random() * 4), Time: CurTimer };
		CurTimer = CurTimer + Math.floor(Math.random() * 800) + 400;
		Seq++;

	}

}

/**
 * Loads the maid drinks mini game and its NPCs
 * @type {ScreenLoadHandler}
 */
async function MaidDrinksLoad() {
	InventoryWear(Player, "WoodenMaidTrayFull", "ItemMisc");
	MaidDrinksCustomerLeftVisible = false;
	MaidDrinksCustomerLeftTimer = -1;
	MaidDrinksCustomerLeft = CharacterLoadNPC("NPC_Customer_Left");
	CharacterAppearanceFullRandom(MaidDrinksCustomerLeft);
	MaidDrinksCustomerRightVisible = false;
	MaidDrinksCustomerRightTimer = -1;
	MaidDrinksCustomerRight = CharacterLoadNPC("NPC_Customer_Right");
	CharacterAppearanceFullRandom(MaidDrinksCustomerRight);
	MaidDrinksGenerateMove(0);
	if (MiniGameDifficultyMode == "Easy") MiniGameDifficultyRatio = 1.0;
	if (MiniGameDifficultyMode == "Normal") MiniGameDifficultyRatio = 1.5;
	if (MiniGameDifficultyMode == "Hard") MiniGameDifficultyRatio = 2.0;
}

/**
 * Draws the icons for the mini game
 * @returns {void} - Nothing
 */
function MaidDrinksDrawIcons() {

	// Scroll the icons with time
	var Seq = 0;
	while (Seq < MaidDrinksMove.length) {

		const move = MaidDrinksMove[Seq];
		// Draw the move from 3.5 seconds before to 1 second after
		if (move.Time <= MiniGameTimer + 3500) {
			const X = 1200 + (move.Type * 200);
			const Y = 675 + Math.floor((MiniGameTimer - move.Time) / 4);
			const Alpha = move.FadeAt == null ? 1.0 : 1.0 - (MiniGameTimer - move.FadeAt) / 200;
			// DrawText(`${MiniGameTimer - MaidDrinksMove[Seq].Time}`, X, Y + 200, "white");
			DrawImageEx("Screens/" + CurrentModule + "/" + CurrentScreen + "/Icon" + move.Type + ".png", MainCanvas, X, Y, { Alpha });
		}

		// Remove the move from the sequence if it's past due
		if (move.FadeAt == null && move.Time < MiniGameTimer - 800) {
			move.FadeAt = MiniGameTimer;
			MaidDrinksMiss();
		}

		if (move.FadeAt != null && MiniGameTimer - move.FadeAt >= 200)
			MaidDrinksMove.splice(Seq, 1);
		else Seq = Seq + 1;

		// Beyond 3.5 seconds forward, we exit
		if (Seq < MaidDrinksMove.length)
			if (move.Time > MiniGameTimer + 3500)
				return;

	}

}

/**
 * Draws the bars to tell when the moves will hit
 * @param {number} SquareType - Type of the bar to draw (0 to 3)
 * @returns {void} - Nothing
 */
function MaidDrinksDrawBar(SquareType) {

	// The color changes when it's clicked or pressed
	DrawRect(1210 + (SquareType * 200), 750, 180, 50, "White");
	if ((MaidDrinksLastMoveType == SquareType) && (MaidDrinksLastMoveTypeTimer >= MiniGameTimer))
		DrawRect(1212 + (SquareType * 200), 752, 176, 46, "#66FF66");
	else
		DrawRect(1212 + (SquareType * 200), 752, 176, 46, "Red");
	if (!CommonIsMobile) DrawText(MaidDrinksKeys[SquareType], 1300 + (SquareType * 200), 775, "white");

}

/**
 * Generates random customers for the mini game (makes them visible for a random amount of time)
 * @returns {void} - Nothing
 */
function MaidDrinksCustomers() {

	// Manages the left customer
	if (MiniGameTimer >= MaidDrinksCustomerLeftTimer) {
		if (MaidDrinksCustomerLeftVisible == false) {
			MaidDrinksCustomerLeftVisible = true;
			MaidDrinksCustomerLeftTimer = MiniGameTimer + 6000 + Math.random() * 8000;
		} else {
			CharacterAppearanceFullRandom(MaidDrinksCustomerLeft);
			MaidDrinksCustomerLeftVisible = false;
			MaidDrinksCustomerLeftTimer = MiniGameTimer + 3000 + Math.random() * 4000;
		}
	}

	// Manages the right customer
	if (MiniGameTimer >= MaidDrinksCustomerRightTimer) {
		if (MaidDrinksCustomerRightVisible == false) {
			MaidDrinksCustomerRightVisible = true;
			MaidDrinksCustomerRightTimer = MiniGameTimer + 6000 + Math.random() * 8000;
		} else {
			CharacterAppearanceFullRandom(MaidDrinksCustomerRight);
			MaidDrinksCustomerRightVisible = false;
			MaidDrinksCustomerRightTimer = MiniGameTimer + 3000 + Math.random() * 4000;
		}
	}

}

/**
 * Runs and draws the maid drinks mini game
 * @returns {void} - Nothing
 */
function MaidDrinksRun() {

	// Draw the characters
	if (MaidDrinksCustomerLeftVisible) DrawCharacter(MaidDrinksCustomerLeft, -50, 0, 1);
	if (MaidDrinksCustomerRightVisible) DrawCharacter(MaidDrinksCustomerRight, 750, 0, 1);
	DrawCharacter(Player, 350, 0, 1);
	DrawRect(1200, 0, 800, 1000, "Black");

	// Increments the timer (altered by the difficulty, the more difficult, the faster it goes)
	if (MiniGameStarted) MiniGameTimer = MiniGameTimer + Math.round(TimerRunInterval * MiniGameDifficultyRatio);

	// Draw the mini game icons and rectangles
	MaidDrinksDrawBar(0);
	MaidDrinksDrawBar(1);
	MaidDrinksDrawBar(2);
	MaidDrinksDrawBar(3);

	// If there's no moves left, we full the move list again, there's no tie match
	if ((MaidDrinksMove.length == 0) && (!MiniGameEnded))
		MaidDrinksGenerateMove(MiniGameTimer);

	// Draw the mini game icons and bottom info when the game is running
	if (MiniGameRunning()) {
		MaidDrinksCustomers();
		MaidDrinksDrawIcons();
	}

	// Draw a gradient over the icons when the player in blindfolded
	const BlindLevel = Player.GetBlindLevel();
	if (BlindLevel > 0) {
		// Maximum blind level is 3, tab bar is at 750. This means at maximum blindness, drinks will appear just before the tab bar!
		const y1 = BlindLevel * 250;
		const Grad = MainCanvas.createLinearGradient(0, y1 - 50, 0, y1);
		Grad.addColorStop(0, '#000');
		Grad.addColorStop(1, 'rgba(0,0,0,0)');
		MainCanvas.fillStyle = Grad;
		MainCanvas.fillRect(1200, 0, 800, y1);
	}

	// Draw the UI
	if (MiniGameRunning()) {
		DrawProgressBar(1200, 975, 800, 25, MiniGameProgress);
	} else if (!MiniGameStarted) {
		DrawText(TextGet(CommonIsMobile ? "StartMobile" : "Start"), 1600, 910, "white");
		DrawText(TextGet("Difficulty") + " " + TextGet(MiniGameDifficultyMode), 1600, 955, "white");
	} else {
		if ((MiniGameProgress >= 100) && MiniGamePerfect) DrawText(TextGet("Perfect"), 1600, 150, "white");
		if ((MiniGameProgress >= 100) && !MiniGamePerfect) DrawText(TextGet("Victory"), 1600, 150, "white");
		if (MiniGameProgress <= 0) DrawText(TextGet("Defeat"), 1600, 150, "white");
		DrawText(TextGet("ClickContinue"), 1600, 300, "white");
	}

}

/**
 * Ends the maid drinks mini game and sends the result back to the screen
 * @param {boolean} Victory - Whether or not the player one the mini game
 * @returns {void} - Nothing
 */
function MaidDrinksEnd(Victory) {
	MaidDrinksLastMoveType = -1;
	CharacterDelete(MaidDrinksCustomerLeft);
	MaidDrinksCustomerLeft = /** @type {never} */ (null);
	CharacterDelete(MaidDrinksCustomerRight);
	MaidDrinksCustomerRight = /** @type {never} */ (null);
	InventoryWear(Player, "WoodenMaidTray", "ItemMisc");
	if (Victory) MiniGameProgress = 100;
	else MiniGameProgress = 0;
	MiniGameVictory = Victory;
	MiniGameEnded = true;
}

/**
 * Used when the player hits, at 100 progress the player wins and the game ends
 * @returns {void} - Nothing
 */
function MaidDrinksHit() {
	MiniGameProgress = MiniGameProgress + 1;
	if (MiniGameProgress >= 100)
		MaidDrinksEnd(true);
}

/**
 * Used when the player misses, the penalty is bigger on higher difficulties. When below zero progress, the player fails the mini game.
 * @returns {void} - Nothing
 */
function MaidDrinksMiss() {
	MiniGamePerfect = false;
	if (MiniGameDifficultyMode == "Easy") MiniGameProgress = MiniGameProgress - 2;
	if (MiniGameDifficultyMode == "Normal") MiniGameProgress = MiniGameProgress - 3;
	if (MiniGameDifficultyMode == "Hard") MiniGameProgress = MiniGameProgress - 4;
	if (MiniGameProgress <= 0) MaidDrinksEnd(false);
}

/**
 * Used when the player tries to do a specific move type
 * @param {number} MoveType - Type of move made by the player
 * @returns {void} - Nothing
 */
function MaidDrinksDoMove(MoveType) {

	// Below zero is always a miss
	var Hit = false;
	if ((MoveType >= 0) && (MaidDrinksMove.length > 0)) {

		// For each moves in the list
		var Seq = 0;
		while (Seq < MaidDrinksMove.length) {

			// If the move connects (good timing and good type)
			// The glass is centered on the bar when MaidDrinksMove[Seq].Time == MiniGameTimer. It touches the bar around -465 (would be (200/2)*4 - 25 = 475 normally, but the sprite doesn't fit the 200x200 image exactly), and on the other side falls off around 455-460 (the images not 100% symetrical). But when we the user presses the button, it will be highlighted for 200.
			if ((MaidDrinksMove[Seq].FadeAt == null) && (MaidDrinksMove[Seq].Time <= MiniGameTimer + 600) && (MaidDrinksMove[Seq].Time >= MiniGameTimer - 450) && (MoveType == MaidDrinksMove[Seq].Type)) {
				MaidDrinksMove[Seq].FadeAt = MiniGameTimer;
				Hit = true;
			}
			Seq++;

			// Beyond 0.5 seconds forward, we give up
			if (Seq < MaidDrinksMove.length)
				if (MaidDrinksMove[Seq].Time > MiniGameTimer + 400)
					Seq = MaidDrinksMove.length;

		}

	}

	// Depending on hit or miss, we change the progress of the mini game
	MaidDrinksLastMoveType = MoveType;
	MaidDrinksLastMoveTypeTimer = MiniGameTimer + 200;
	if (Hit) MaidDrinksHit();
	else MaidDrinksMiss();

}

/**
 * Handles key presses during the maid drinks mini game. (Both keyboard and mobile)
 * @type {KeyboardEventListener}
 */
function MaidDrinksKeyDown(event) {
	if (event.repeat) return false;

	if (!MiniGameStarted) {
		MiniGameStarted = true;
		MiniGameProgress = 50;
		return true;
	}
	// If the game has started, we check the key pressed and send it as a move
	else if (!MiniGameEnded) {
		const MoveType = MaidDrinksKeys.findIndex(k => k === event.key.toUpperCase());
		MaidDrinksDoMove(MoveType);
		return true;
	} else if (MiniGameCheatKeyDown(event)) {
		MiniGameProgress = MiniGameProgress + 15;
		if (MiniGameProgress >= 100) MiniGameProgress = 99;
		return true;
	}
	return false;
}

/**
 * Handles clicks during the maid drinks mini game (only on mobile, to replace the keyboard)
 * @returns {void} - Nothing
 */
function MaidDrinksClick() {

	// If the game is over, clicking on the image will end it
	if (MiniGameEnded && MouseIn(350, 0, 500, 1000))
		MiniGameEnd();

	// Only use mouse clicks on mobile
	if (!CommonIsMobile) return;

	if (!MiniGameStarted) {
		MiniGameStarted = true;
		MiniGameProgress = 50;
	}
	// If the game has started, we check the click position and send it as a move
	else if (!MiniGameEnded) {
		var MoveType = -1;
		if (MouseIn(1200, 700, 200, 150)) MoveType = 0;
		if (MouseIn(1400, 700, 200, 150)) MoveType = 1;
		if (MouseIn(1600, 700, 200, 150)) MoveType = 2;
		if (MouseIn(1800, 700, 200, 150)) MoveType = 3;
		MaidDrinksDoMove(MoveType);
	}

}
