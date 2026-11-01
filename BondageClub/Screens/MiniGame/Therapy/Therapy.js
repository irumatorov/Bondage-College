"use strict";
var TherapyBackground = "AsylumTherapy";
/** @type {null | NPCCharacter | PlayerCharacter} */
var TherapyCharacterLeft = null;
/** @type {null | NPCCharacter} */
var TherapyCharacterRight = null;
var TherapyMoves = [0, 0, 0, 0, 0, 0];
var TherapyGenerateMoveTimer = 0;
var TherapyStress = 0;

/**
 * Loads the therapy mini game and sets the difficulty. The game is a little faster on mobile since its easier.
 * @type {ScreenLoadHandler}
 */
async function TherapyLoad() {
	CurrentDarkFactor = 0.5;
	TherapyMoves = [0, 0, 0, 0, 0, 0];
	TherapyStress = 0;
	MiniGameDifficultyRatio = 2000;
	if (MiniGameDifficultyMode == "Normal") MiniGameDifficultyRatio = 1500;
	if (MiniGameDifficultyMode == "Hard") MiniGameDifficultyRatio = 1000;
	if (CommonIsMobile) MiniGameDifficultyRatio = Math.round(MiniGameDifficultyRatio * 0.75);
}

/**
 * Runs the therapy mini game.
 * @returns {void} - Nothing
 */
function TherapyRun() {

	// Draw the characters
	if (TherapyCharacterLeft) DrawCharacter(TherapyCharacterLeft, 0, 0, 1);
	if (TherapyCharacterRight) DrawCharacter(TherapyCharacterRight, 500, 0, 1);
	MiniGameTimer = MiniGameTimer + Math.round(TimerRunInterval);

	// If we must draw the progress bars
	if (MiniGameStarted) {
		DrawProgressBar(1100, 770, 800, 60, MiniGameProgress);
		DrawText(TextGet("Progress"), 1500, 800, "white");
		DrawProgressBar(1100, 870, 800, 60, TherapyStress * 5);
		DrawText(TextGet("Stress"), 1500, 900, "white");
	} else {
		DrawText(TextGet("Intro1"), 1500, 760, "white");
		DrawText(TextGet("Intro2"), 1500, 840, "white");
		DrawText(TextGet("Start"), 1500, 920, "white");
	}

	// If the mini game is running
	if (MiniGameRunning()) {

		// Generates new moves if we need to
		if (TherapyGenerateMoveTimer < CurrentTime) {
			if (MiniGameProgress < 0) MiniGameProgress = 0;
			TherapyGenerateMoveTimer = TherapyGenerateMoveTimer + 100;
			for (let M = 0; M < TherapyMoves.length; M++) {
				if ((TherapyMoves[M] > 0) && (TherapyMoves[M] <= CurrentTime)) {
					TherapyStress++;
					TherapyMoves[M] = 0;
					TherapyVerifyEnd();
				}
				if ((TherapyMoves[M] <= CurrentTime) && (Math.random() >= 0.95))
					TherapyMoves[M] = CurrentTime + MiniGameDifficultyRatio;
			}
		}

		// Draws the move
		for (let M = 0; M < TherapyMoves.length; M++)
			if (TherapyMoves[M] >= CurrentTime)
				DrawCircle(1250 + ((M % 3) * 250), 200 + Math.floor(M / 3) * 300, 100, 25, "cyan");

	} else if (MiniGameEnded) {

		// Draw the end message
		if (MiniGameVictory && (TherapyStress == 0)) DrawText(TextGet("Perfect"), 1500, 250, "white");
		else if (MiniGameVictory) DrawText(TextGet("Victory"), 1500, 250, "white");
		else DrawText(TextGet("Defeat"), 1500, 250, "white");
		DrawText(TextGet("ClickContinue"), 1500, 350, "white");

	}

}

/**
 * Checks if the therapy minigame should end. It ends when the therapy is completed, or when the patient is too stressed out.
 * @returns {void} - Nothing
 */
function TherapyVerifyEnd() {
	if (MiniGameProgress >= 100) {
		MiniGameVictory = true;
		MiniGameEnded = true;
		MiniGameProgress = 100;
	}
	if (TherapyStress >= 20) {
		MiniGameVictory = false;
		MiniGameEnded = true;
		TherapyStress = 20;
	}
}

/**
 * Handles a given move type and validates it
 * @param {number} MoveType - Move type (Index of the TherapyMoves array)
 * @returns {void} - Nothing
 */
function TherapyDoMove(MoveType) {

	// Checks if the move is valid
	if ((MoveType >= 0) && (TherapyMoves[MoveType] >= CurrentTime)) {
		MiniGameProgress++;
		TherapyMoves[MoveType] = 0;
	} else TherapyStress++;
	TherapyVerifyEnd();

}

/**
 * Handles clicks in the therapy mini game
 * @returns {void} - Nothing
 */
function TherapyClick() {

	if (!MiniGameStarted) {
		MiniGameStarted = true;
		TherapyGenerateMoveTimer = CurrentTime;
	}

	// If the game is over, clicking on the image will end it
	else if (MiniGameEnded && MouseIn(0, 0, 500, 1000))
		MiniGameEnd();

}

/**
 * Handles mouse downs in the therapy mini game
 * @returns {void} - Nothing
 */
function TherapyMouseDown() {

	// If the game has started, we check the click position and send it as a move
	if (MiniGameRunning() && (MouseX >= 1000) && (MiniGameProgress != -1)) {

		// Gets the move type and sends it
		var MoveType = -1;
		for (let M = 0; M < TherapyMoves.length; M++) {
			const moveX = (M % 3) * 250;
			const moveY = Math.floor(M / 3) * 300;
			if (MouseIn(1125 + moveX, 75 + moveY, 250, 250))
				MoveType = M;
		}
		TherapyDoMove(MoveType);

	}

}

/**
 * Handles the key press in the therapy mini game, the C cheat key reduces the patient stress
 * @type {KeyboardEventListener}
 */
function TherapyKeyDown(event) {
	if (MiniGameCheatKeyDown(event)) {
		TherapyStress = TherapyStress - 4;
		if (TherapyStress < 0) TherapyStress = 0;
		return true;
	}
	return false;
}
