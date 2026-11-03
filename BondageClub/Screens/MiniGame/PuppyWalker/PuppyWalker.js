"use strict";
var PuppyWalkerBackground = "Garden1";
var PuppyWalkerMoves = [0, 0, 0, 0];
var PuppyWalkerMovesTimer = [0, 0, 0, 0];
var PuppyWalkerEscape = [0, 0, 0, 0];
var PuppyWalkerGenerateMoveTimer = 0;

/**
 * Loads the puppy walker mini game and sets the difficulty, it's a little faster on mobile because it's easier.
 * @type {ScreenLoadHandler}
 */
async function PuppyWalkerLoad() {
	PuppyWalkerMoves = [0, 0, 0, 0];
	PuppyWalkerEscape = [0, 0, 0, 0];
	PuppyWalkerMovesTimer = [0, 0, 0, 0];
	MiniGameDifficultyRatio = 1600;
	if (CommonIsMobile) MiniGameDifficultyRatio = Math.round(MiniGameDifficultyRatio * 0.75);
}

/**
 * Draws the puppy girl if she hasn't escaped
 * @param {Character} Puppy - The puppy character to draw
 * @param {number} X - Position on the X axis
 * @param {number} Fail - Amount of failures for this puppy
 * @returns {void} - Nothing
 */
function PuppyWalkerDrawPuppy(Puppy, X, Fail) {
	if (Fail < 3) DrawCharacter(Puppy, X, 0, 1);
	DrawImage("Screens/MiniGame/PuppyWalker/" + ((Fail <= 0) ? "Success" : "Fail") + ".png", X + 60, 100);
	DrawImage("Screens/MiniGame/PuppyWalker/" + ((Fail <= 1) ? "Success" : "Fail") + ".png", X + 190, 100);
	DrawImage("Screens/MiniGame/PuppyWalker/" + ((Fail <= 2) ? "Success" : "Fail") + ".png", X + 320, 100);
}

/**
 * Runs the puppy walker mini game and draws the relevant information on the screen
 * @returns {void} - Nothing
 */
function PuppyWalkerRun() {

	// Draw the characters
	if (DailyJobPuppy1) PuppyWalkerDrawPuppy(DailyJobPuppy1, -50, PuppyWalkerEscape[0]);
	if (DailyJobPuppy2) PuppyWalkerDrawPuppy(DailyJobPuppy2, 350, PuppyWalkerEscape[1]);
	DrawCharacter(Player, 750, 0, 1);
	if (DailyJobPuppy3) PuppyWalkerDrawPuppy(DailyJobPuppy3, 1150, PuppyWalkerEscape[2]);
	if (DailyJobPuppy4) PuppyWalkerDrawPuppy(DailyJobPuppy4, 1550, PuppyWalkerEscape[3]);
	if (MiniGameStarted)
		MiniGameTimer = MiniGameTimer + Math.round(TimerRunInterval);

	// Shows the intro text before the mini game begins
	if (!MiniGameStarted) {
		DrawRect(0, 950, 2000, 50, "black");
		DrawText(TextGet("Intro"), 1000, 975, "white");
		return;
	}

	// If the mini game is running
	if (!MiniGameEnded) {

		// Draws the progress bar based on the timer
		var Progress = 100;
		if (MiniGameStarted) Progress = (60 - (MiniGameTimer / 1000)) * 100 / 60;
		DrawProgressBar(0, 950, 2000, 50, Progress);

		// If the mini-game is running
		if (PuppyWalkerGenerateMoveTimer < CurrentTime) {

			// Ends moves and generates new moves if we need to
			PuppyWalkerGenerateMoveTimer = PuppyWalkerGenerateMoveTimer + 100;
			for (let M = 0; M < PuppyWalkerMoves.length; M++) {
				if ((PuppyWalkerMoves[M] > 0) && (PuppyWalkerMoves[M] <= CurrentTime))
					PuppyWalkerDoMove(M);
				if ((PuppyWalkerMoves[M] <= CurrentTime) && (PuppyWalkerMovesTimer[M] < CurrentTime) && (Math.random() >= 0.95))
					PuppyWalkerMoves[M] = CurrentTime + MiniGameDifficultyRatio;
			}

		}

		// Draws the move & checks if the game must end
		if (PuppyWalkerMoves[0] >= CurrentTime) DrawCircle(200, 500, 100, 25, "yellow");
		if (PuppyWalkerMoves[1] >= CurrentTime) DrawCircle(600, 500, 100, 25, "yellow");
		if (PuppyWalkerMoves[2] >= CurrentTime) DrawCircle(1400, 500, 100, 25, "yellow");
		if (PuppyWalkerMoves[3] >= CurrentTime) DrawCircle(1800, 500, 100, 25, "yellow");
		PuppyWalkerVerifyEnd();

	} else {

		// Draw the end message
		DrawRect(0, 950, 2000, 50, "black");
		if (MiniGameVictory && (PuppyWalkerEscape[0] + PuppyWalkerEscape[1] + PuppyWalkerEscape[2] + PuppyWalkerEscape[3] == 0)) DrawText(TextGet("Perfect"), 1000, 975, "white");
		else if (MiniGameVictory) DrawText(TextGet("Victory"), 1000, 975, "white");
		else DrawText(TextGet("Defeat"), 1000, 975, "white");

	}

}

/**
 * Validates if the mini game must end. The mini game ends when the timer is up or if a puppy escaped. Failing 3 moves of a given type counts as an escape.
 * @returns {void} - Nothing
 */
function PuppyWalkerVerifyEnd() {
	if ((PuppyWalkerEscape[0] >= 3) || (PuppyWalkerEscape[1] >= 3) || (PuppyWalkerEscape[2] >= 3) || (PuppyWalkerEscape[3] >= 3)) {
		MiniGameVictory = false;
		MiniGameEnded = true;
	}
	if (!MiniGameEnded && (MiniGameTimer >= MS_PER_MIN)) {
		MiniGameVictory = true;
		MiniGameEnded = true;
	}
}

/**
 * Validate the moves, we raise the escape counter if it was invalid
 * @param {number} MoveType - Type of move done, goes from 0 to 3. It represents the index of the PuppyWalkerEscape array
 * @returns {void} - Nothing
 */
function PuppyWalkerDoMove(MoveType) {
	if (PuppyWalkerMoves[MoveType] <= CurrentTime) PuppyWalkerEscape[MoveType]++;
	PuppyWalkerMoves[MoveType] = 0;
	PuppyWalkerMovesTimer[MoveType] = CurrentTime + (MiniGameDifficultyRatio * 0.5);
	PuppyWalkerVerifyEnd();
}

/**
 * Handles clicks during the puppy walker minigame
 * @returns {void} - Nothing
 */
function PuppyWalkerClick() {

	if (!MiniGameStarted) {
		MiniGameStarted = true;
		PuppyWalkerGenerateMoveTimer = CurrentTime;
	}

	// If the game is over, clicking on the image will end it
	if (MiniGameEnded && MouseIn(800, 0, 400, 1000))
		MiniGameEnd();

}

/**
 * Handles mouse downs during the puppy walker minigame
 * @returns {void} - Nothing
 */
function PuppyWalkerMouseDown() {

	// If the game has started, we check the click position and send it as a move
	if (MiniGameStarted && MouseYIn(350, 300) && !MiniGameEnded) {
		if (MouseXIn(50, 300)) PuppyWalkerDoMove(0);
		if (MouseXIn(450, 300)) PuppyWalkerDoMove(1);
		if (MouseXIn(1250, 300)) PuppyWalkerDoMove(2);
		if (MouseXIn(1650, 300)) PuppyWalkerDoMove(3);
	}

}
