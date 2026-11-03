"use strict";

/** @type {undefined | string} */
var ChestLockpickBackground = undefined;
var ChestLockpickChestImage = "";
var ChestLockpickSpeed = 500; // Higher number gives slower spin speed
var ChestLockpickAngle = 0;
var ChestLockpickHoleAngle = Math.PI; // 6.28 for a full 360 circle
var ChestLockpickCount = 8;

/**
 * Loads the mini game, resets the speed and difficulty
 * @type {ScreenLoadHandler}
 */
async function ChestLockpickLoad() {
	ChestLockpickAngle = 0;
	ChestLockpickHoleAngle = Math.PI;
	ChestLockpickSpeed = 500;
	ChestLockpickCount = 5 + MiniGameDifficulty - (InfiltrationPerksActive("Lockpicker") ? 1 : 0);
	MiniGameTimer = 0;
}

/**
 * Runs the chest lock pick mini game and draws its components on screen
 * @returns {void} - Nothing
 */
function ChestLockpickRun() {

	// Draw the chest and the circle
	DrawRect(0, 0, 2000, 1000, "#00000080");
	DrawImageZoomCanvas(ChestLockpickChestImage, MainCanvas, 0, 600, 500, 400, 250, -275, 1500, 1200);
	DrawImage("Screens/MiniGame/ChestLockpick/Circle.png", 700, 150);
	DrawImage("Screens/MiniGame/ChestLockpick/Hole.png", 1000 - 35 + Math.sin(ChestLockpickHoleAngle) * 260, 450 - 35 + Math.cos(ChestLockpickHoleAngle) * 260);
	DrawImage("Screens/MiniGame/ChestLockpick/Lockpick.png", 1000 - 35 + Math.sin(ChestLockpickAngle) * 260, 450 - 35 + Math.cos(ChestLockpickAngle) * 260);

	// Draw the number of spins left
	MainCanvas.font = CommonGetFont(300);
	DrawText(ChestLockpickCount.toString(), 1000, 470, "White", "Black");
	MainCanvas.font = CommonGetFont(36);

	// Draw the end message
	if (MiniGameEnded) {
		if (MiniGameVictory) DrawText(TextGet("Victory"), 1000, 900, "White", "Silver");
		else DrawText(TextGet("Defeat"), 1000, 900, "White", "Silver");
		DrawText(TextGet("ClickContinue"), 1000, 965, "White", "Silver");
		return;
	}

	MiniGameTimer = MiniGameTimer + Math.round(TimerRunInterval);

	// Draws the help message
	DrawText(TextGet("Intro1"), 1000, 900, "White", "Silver");

	// Spins the angle, from clockwise to counter
	if (ChestLockpickCount % 2 == 0) ChestLockpickAngle = ChestLockpickAngle + (TimerRunInterval / ChestLockpickSpeed);
	else ChestLockpickAngle = ChestLockpickAngle - (TimerRunInterval / ChestLockpickSpeed);

}

/**
 * Handles mouse down during the mini game
 * @returns {void} - Nothing
 */
function ChestLockpickMouseDown() {

	// When clicking in the mini-game, we check if it was close enough to the hole for a success
	if (!MiniGameEnded) {
		let Diff = Math.abs(ChestLockpickHoleAngle - ChestLockpickAngle) % (Math.PI * 2);
		if ((Diff > 0.26) && (Diff < (Math.PI * 2) - 0.26)) {
			MiniGameEnded = true;
			MiniGameVictory = false;
		} else {
			ChestLockpickCount--;
			if (ChestLockpickCount <= 0) {
				MiniGameEnded = true;
				MiniGameVictory = true;
			} else {
				ChestLockpickSpeed = ChestLockpickSpeed * 0.9;
				ChestLockpickHoleAngle = ChestLockpickHoleAngle + Math.PI / 2 + Math.random() * Math.PI;
			}
		}
	}

}

/**
 * Handles clicks during the mini game
 * @returns {void} - Nothing
 */
function ChestLockpickClick() {

	// If the game is over, clicking on the bottom will end it
	if (MiniGameEnded && MouseIn(0, 875, 2000, 125)) {
		MiniGameEnd();
	}

}

/**
 * Handles the key press in the mini game
 * @type {KeyboardEventListener}
 */
function ChestLockpickKeyDown(event) {

	// The C cheat key removes a pick lock requirement
	if (MiniGameCheatKeyDown(event) && (ChestLockpickCount >= 2)) {
		ChestLockpickCount--;
		return true;
	}

	// The Space bar is like a click
	if (CommonKey.IsPressed(event, "Space")) {
		ChestLockpickMouseDown();
		return true;
	}

	// Key isn't handled
	return false;

}
