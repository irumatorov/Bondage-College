"use strict";
var GetUpVelocity = 0;
var GetUpPosition = 0;
var GetUpAcceleration = 0;
var GetUpMaxPosition = 100;
var GetUpGameDuration = 5000;
var GetUpNextTick = 0;
var GetUpText = "";
var GetUpChallenge = 0;
var GetUpBackground = "Introduction";

/**
 * Ends the game and sends the result back to the screen
 * @param {boolean} Victory - Whether or not the player has won
 * @returns {void} - Nothing
 */
function GetUpEnd(Victory) {
	MiniGameVictory = Victory;
	MiniGameEnded = true;
	MiniGameTimer = CommonTime();
}



/**
 * Loads the Get Up mini game
 * @type {ScreenLoadHandler}
 */
async function GetUpLoad() {
	GetUpBackground = ChatRoomGetBackgroundURL();

	GetUpVelocity = 0;
	GetUpPosition = 0;
	GetUpAcceleration = 0;

	// One extra second per challenge level, minus a third of a second per evasion.
	GetUpGameDuration = 5000 + 1000 * (MiniGameDifficulty - SkillGetLevel(Player, "Evasion") * 0.33);
	GetUpChallenge = MiniGameDifficulty;
	GetUpMaxPosition = 400 - GetUpChallenge * 40;
}

/**
 * @param {number} delta
 */
function GetUpPhysics(delta) {
	const timeElapsed = 3 + (GetUpGameDuration +  CommonTime() - MiniGameTimer) / 2000;

	if (CommonTime() > GetUpNextTick) {
		GetUpNextTick = CommonTime() + 400;
		GetUpAcceleration = -timeElapsed*1 + 1.3*timeElapsed*Math.random();
	}
	GetUpVelocity = Math.min(GetUpVelocity, GetUpVelocity + GetUpAcceleration * 0.25);

	if (Math.abs(GetUpPosition) <= GetUpMaxPosition)
		GetUpPosition += GetUpVelocity / 1000 * delta * 3.5;


	GetUpPosition = Math.max(-GetUpMaxPosition*1.1, Math.min(GetUpPosition, GetUpMaxPosition*1.1));
}

/**
 * Runs the get up mini game and draws the characters and items on screen
 * @returns {void} - Nothing
 */
function GetUpRun() {
	GetUpBackground = ChatRoomGetBackgroundURL();

	DrawRect(0, 0, 1000, 1000, "Black");

	// The game ends if the time runs out
	const Time = CommonTime();
	if (MiniGameRunning()) {
		if (Math.abs(GetUpPosition) > GetUpMaxPosition) {
			GetUpEnd(false);
			SkillProgress(Player, "Evasion",  GetUpChallenge/2 + 1);
		} else if (Time >= MiniGameTimer) {
			GetUpEnd(true);
			SkillProgress(Player, "Evasion",  GetUpChallenge/2 + 1);
		} else {
			GetUpPhysics(TimerRunInterval);
		}
	}
	if (MiniGameStarted && Time >= MiniGameTimer + 750) MiniGameEnd();


	DrawProgressBar(500 - GetUpMaxPosition, 500, 2*GetUpMaxPosition, 50, 50*((GetUpPosition + GetUpMaxPosition)/GetUpMaxPosition));
	DrawCharacter(Player, 400 + GetUpPosition, 300, 0.4);


	if (!MiniGameEnded) {
		GetUpText = TextGet("GetUpObjective");
	} else if (MiniGameVictory) {
		GetUpText = TextGet("GetUpPass");
	} else {
		GetUpText = TextGet("GetUpFail");
	}
	DrawText(GetUpText, 500, 927, "white", "black");


	if (!MiniGameStarted)
		DrawText(TextGet("GetUpStart"), 500, 977, "white", "black");

}

/**
 * Handles mouse click events for the get up mini game
 * @returns {void} - Nothing
 */
function GetUpMouseDown() {
	if (MiniGameStarted) GetUpVelocity += 20;
}

/**
 * Handles mouse click events for the get up mini game
 * @returns {void} - Nothing
 */
function GetUpClick() {
	if (!MiniGameStarted) {
		MiniGameStarted = true;
		MiniGameTimer = CommonTime() + GetUpGameDuration;
	}
}
