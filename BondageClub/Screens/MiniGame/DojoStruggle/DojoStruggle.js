"use strict";
var DojoStruggleBackground = "Shibari";
var DojoStrugglePosition = 450;
var DojoStruggleImpulse = 0;
/** @type {number[]} */
var DojoStruggleRope = [];

/**
 * Loads the dojo struggle mini game and prepare the rope walls
 * @type {ScreenLoadHandler}
 */
async function DojoStruggleLoad() {
	DojoStruggleReset();
}

function DojoStruggleReset() {
	DojoStrugglePosition = 450;
	if (MiniGameProgress < 0) MiniGameProgress = 0;
	MiniGameTimer = 0;
	DojoStruggleRope = [];
	for (let P = 0; P < 25; P++)
		DojoStruggleRope.push(Math.floor(Math.random() * 651) + 175);
}

/**
 * Runs the dojo struggle mini game and draws the relevant information on screen
 * @returns {void} - Nothing
 */
function DojoStruggleRun() {

	// Draw the character
	DrawCharacter(Player, 850, -400, 3, false);
	if (MiniGameStarted)
		MiniGameTimer += Math.round(TimerRunInterval);

	// Draw the check boxes to show the number of tries
	DrawImage("Screens/MiniGame/DojoStruggle/" + ((MiniGameProgress <= 0) ? "Success" : "Fail") + ".png", 1875, 250);
	DrawImage("Screens/MiniGame/DojoStruggle/" + ((MiniGameProgress <= 1) ? "Success" : "Fail") + ".png", 1875, 400);
	DrawImage("Screens/MiniGame/DojoStruggle/" + ((MiniGameProgress <= 2) ? "Success" : "Fail") + ".png", 1875, 550);

	// If the mini game is running
	if (MiniGameRunning()) {

		// The game ends after 71 seconds with a victory
		if (MiniGameTimer >= 71000) {
			MiniGameVictory = true;
			MiniGameEnded = true;
		} else {

			// Applies gravity & impulse on the rope
			DojoStrugglePosition = DojoStrugglePosition + (TimerRunInterval - DojoStruggleImpulse) * 0.43;
			DojoStruggleImpulse = DojoStruggleImpulse - TimerRunInterval * 0.43;
			if (DojoStruggleImpulse < 0) DojoStruggleImpulse = 0;
			if (DojoStrugglePosition < 25) DojoStrugglePosition = 25;
			if (DojoStrugglePosition > 975) DojoStrugglePosition = 975;

			// Draw the obstacles
			let C = 25;
			for (let P = 0; P < 25; P++) {
				const X = 1000 + (P * 500) - (MiniGameTimer / 5);
				if (X < 150) C--;
				if ((X > 0) && (X < 1200) && (DojoStruggleRope[P] > 150)) DrawImageZoomCanvas("Screens/MiniGame/DojoStruggle/RopeVertical.png", MainCanvas, 0, 0, 50, DojoStruggleRope[P] - 150, X, 0, 50, DojoStruggleRope[P] - 150);
				if ((X > 0) && (X < 1200) && (DojoStruggleRope[P] < 850)) DrawImageZoomCanvas("Screens/MiniGame/DojoStruggle/RopeVertical.png", MainCanvas, 0, 0, 50, 900, X, DojoStruggleRope[P] + 150, 50, 900);
				if ((X >= 200) && (X <= 250) && ((DojoStrugglePosition < DojoStruggleRope[P] - 125) || (DojoStrugglePosition > DojoStruggleRope[P] + 125))) {

					// When the player rope hits another rope, it resets the game 3 times before failing
					MiniGameStarted = false;
					MiniGameTimer = 0;
					MiniGameProgress++;
					DojoStruggleReset();
					if (MiniGameProgress >= 3) {
						MiniGameVictory = false;
						MiniGameEnded = true;
					}

				}
			}

			// Draw the number of ropes left
			DrawText(C.toString(), 50, 50, "White", "Black");

		}

	}

	// Draw the player rope
	DrawImage("Screens/MiniGame/DojoStruggle/RopeHorizontal.png", 0, DojoStrugglePosition - 25);

	// Shows the intro text before the mini game begins
	if (!MiniGameStarted) {
		DrawRect(0, 950, 2000, 50, "black");
		DrawText(TextGet("Intro"), 1000, 975, "white");
	}

	// Draw the end message when the game is over
	if (MiniGameEnded) {
		DrawRect(0, 950, 2000, 50, "black");
		if (MiniGameVictory && (MiniGameProgress == 0)) DrawText(TextGet("Perfect"), 1000, 975, "white");
		else if (MiniGameVictory) DrawText(TextGet("Victory"), 1000, 975, "white");
		else DrawText(TextGet("Defeat"), 1000, 975, "white");
	}

}

/**
 * Handles clicks during the dojo struggle mini game
 * @returns {void} - Nothing
 */
function DojoStruggleClick() {

	// If the game is over, clicking on the image will end it
	if (MiniGameEnded && (MouseX >= 1250))
		MiniGameEnd();

	// If the hame hasn't started, start it
	else if (!MiniGameStarted)
		MiniGameStarted = true;

}

/**
 * Handles mouse down during the dojo struggle mini game
 * @returns {void} - Nothing
 */
function DojoStruggleMouseDown() {

	// If the game has started, we check the click position and send it as a move
	if (MiniGameRunning() && (MouseX <= 1250))
		DojoStruggleImpulse = 86;

}

/**
 * Handles key presses during the dojo struggle mini game. A space bar is handled just like a click is.  The C cheat key has a little less impulse.
 * @type {KeyboardEventListener}
 */
function DojoStruggleKeyDown(event) {
	if (event.repeat) return false;

	if (!MiniGameEnded && CommonKey.IsPressed(event, "Space")) {
		if (!MiniGameStarted)
			MiniGameStarted = true;
		else
			DojoStruggleImpulse = 86;
		return true;
	} else if (MiniGameCheatKeyDown(event)) {
		DojoStruggleImpulse = 76;
		return true;
	}
	return false;
}
