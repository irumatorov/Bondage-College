"use strict";
var DailyJobBackground = "MainHall";
/** @type {null | NPCCharacter} */
var DailyJobOpponent = null;
/** @type {null | NPCCharacter} */
var DailyJobPuppyMistress = null;
/** @type {null | NPCCharacter} */
var DailyJobPuppy1 = null;
/** @type {null | NPCCharacter} */
var DailyJobPuppy2 = null;
/** @type {null | NPCCharacter} */
var DailyJobPuppy3 = null;
/** @type {null | NPCCharacter} */
var DailyJobPuppy4 = null;
/** @type {null | NPCCharacter} */
var DailyJobDojoTeacher = null;

/**
 * Triggered when a player is fully restrained from a daily job dialog
 * @returns {void} - Nothing
 */
function DailyJobPlayerFullRestrain() { CharacterFullRandomRestrain(Player, "ALL"); }

/**
 * @typedef {{
 *  "0": PlayerCharacter;
 *  "1": NPCCharacter;
 *  "2": NPCCharacter;
 *  "3": NPCCharacter;
 *  "4": NPCCharacter;
 * }} DailyJobPuppyNums
 */

/**
 * Loads a puppy girl and fully restrain her
 * @template {keyof DailyJobPuppyNums} Num
 * @param {Num} GirlNum - Number of the puppy to load
 * @returns {DailyJobPuppyNums[Num]} - The generated puppy girl
 */
function DailyJobPuppyLoad(GirlNum) {
	const C = (GirlNum == "0") ? Player : CharacterLoadNPC("NPC_DailyJob_PuppyGirl" + GirlNum);
	CharacterNaked(C);
	InventoryWearRandom(C, "ItemArms", 8, null, false, true, ["BitchSuit", "HempRope", "Chains", "ArmbinderJacket", "StraitLeotard", "LeatherStraitJacket", "BoxTieArmbinder", "Bolero", "PantyhoseBodyOpen", "SeamlessStraitDress", "SeamlessStraitDressOpen"], true);
	InventoryWearRandom(C, "HairAccessory1", 8, null, false, true, ["Ears1", "Ears2", "PonyEars1", "BunnyEars1", "BunnyEars2", "PuppyEars1", "FoxEars1", "WolfEars1", "WolfEars2", "FoxEars2", "FoxEars3", "PuppyEars2"], true);
	InventoryWearRandom(C, "TailStraps", 8, null, false, true, ["FoxTailsStrap", "PuppyTailStrap", "RaccoonStrap", "PuppyTailStrap1", "FoxTailStrap", "WolfTailStrap1", "WolfTailStrap2", "WolfTailStrap3"], true);
	if (InventoryGet(C, "ItemMouth") == null) InventoryWearRandom(C, "ItemMouth", 8);
	if (InventoryGet(C, "ItemNeck") == null) InventoryWearRandom(C, "ItemNeck", 8);
	if (InventoryGet(C, "ItemNeckRestraints") == null) InventoryWear(C, "ChainLeash", "ItemNeckRestraints", null, 8);
	if (GirlNum != "0") PoseSetActive(C, "Kneel", true);
	return /** @type {PlayerCharacter} */(C);
}

/**
 * Loads the daily job room screen characters. This changes based on the current job being performed.
 * @type {ScreenLoadHandler}
 */
async function DailyJobLoad() {
	DailyJobBackground = "MainHall";
	switch (IntroductionJobCurrent) {
		case "DomKidnap":
			if (!DailyJobOpponent) {
				DailyJobOpponent = CharacterLoadNPC("NPC_DailyJob_Opponent");
				DailyJobOpponent.AllowItem = false;
			}
			break;
		case "DomPuppy":
			if (!DailyJobPuppyMistress) {
				DailyJobPuppyMistress = CharacterLoadNPC("NPC_DailyJob_PuppyMistress");
				DailyJobPuppyMistress.AllowItem = false;
				DailyJobPuppy1 = DailyJobPuppyLoad("1");
				DailyJobPuppy2 = DailyJobPuppyLoad("2");
				DailyJobPuppy3 = DailyJobPuppyLoad("3");
				DailyJobPuppy4 = DailyJobPuppyLoad("4");
			}
			break;
		case "SubDojo":
			if (!DailyJobDojoTeacher) {
				DailyJobDojoTeacher = CharacterLoadNPC("NPC_DailyJob_DojoTeacher");
				CharacterNaked(DailyJobDojoTeacher);
				InventoryWear(DailyJobDojoTeacher, CommonGetRandomItemFromList(["ChineseDress1", "ChineseDress2"]), "Cloth");
				InventoryWear(DailyJobDojoTeacher, "Ribbons4", "HairAccessory1");
			}
			break;
		case "SubSearch":
			break;
		case "DomLock":
			break;
		case "SubActivity":
			break;
	}
}

/**
 * Runs and draws the daily job room. Empty as daily jobs are ran from other rooms.
 * @returns {void} - Nothing
 */
function DailyJobRun() {
}


/**
 * Handles clicks in the daily job room. Empty as daily jobs are ran from other rooms.
 * @returns {void} - Nothing
 */
function DailyJobClick() {
}

/**
 * In search mission, draws the extra button for the job
 * @returns {void} - Nothing
 */
function DailyJobSubSearchRun() {
	if (IntroductionJobCurrent == "SubSearch") {
		DrawButton(1885, 885, 90, 90, "", "White", "Icons/Search.png");
	}

	if (!DailyJobSubSearchIsActive() || !("ClickScreen" in IntroductionJobPosition)) return;
	if (IntroductionJobCount > 0 && IntroductionJobPosition.ClickScreen == CurrentScreen)
		DrawEmptyRect(IntroductionJobPosition.ClickX - 100, IntroductionJobPosition.ClickY - 100, 200, 200, "Cyan", 3);
	if (IntroductionJobCount <= 0)
		DrawImage("Screens/Room/DailyJob/Jewelry.png", 730, 290);
}

/**
 * In search mission, handles clicks on the extra button for the job
 * @returns {void} - Nothing
 */
function DailyJobSubSearchClick() {
	if (IntroductionJobCurrent == "SubSearch") {
		if (MouseIn(1885, 885, 90, 90)) IntroductionJobPosition.Active = !IntroductionJobPosition.Active;
	}

	if (!DailyJobSubSearchIsActive()) return;

	if (MouseIn(IntroductionJobPosition.X - 100, IntroductionJobPosition.Y - 100, 200, 200))
		IntroductionJobProgress("SubSearch", CurrentScreen);
	if (IntroductionJobCount > 0 && MouseX <= 1900) {
		CommonAssign(IntroductionJobPosition, {
			ClickX: MouseX,
			ClickY: MouseY,
			ClickScreen: CurrentScreen,
		});
	}
}

/**
 * Checks if the player is currently searching for a daily job
 * @returns {boolean} - Returns TRUE if the job search process is active
 */
function DailyJobSubSearchIsActive() {
	return ((IntroductionJobCurrent == "SubSearch") && IntroductionJobPosition.Active);
}

/**
 * Triggered when the kidnap daily job fight minigame is started
 * @returns {void} - Nothing
 */
function DailyJobKidnapStart() {
	if (!DailyJobOpponent) return;
	KidnapStart(DailyJobOpponent, "MainHall", 7, (victory) => CommonPromiseCatch(DailyJobKidnapEnd(victory)));
}


/**
 * Triggered at the end of the kidnap daily job fight mini-game
 * @param {boolean} victory - Whether the player won the encounter
 * @returns {SafePromise<void>}
 */
async function DailyJobKidnapEnd(victory) {
	if (!DailyJobOpponent) return;
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(DailyJobOpponent));
	DailyJobOpponent.Stage = victory ? "100" : "200";
	CharacterRelease(victory ? Player : DailyJobOpponent);
	if (victory) DailyJobOpponent.AllowItem = true;
	await CommonSetScreen("Room", "DailyJob");
	CharacterSetCurrent(DailyJobOpponent);
	DailyJobOpponent.CurrentDialog = DialogFind(DailyJobOpponent, victory ? "KidnapVictory" : "KidnapDefeat");
}

/**
 * Triggered when the kidnap daily job fight mini-game is won. Sends the player back to the main hall.
 * @returns {void} - Nothing
 */
function DailyJobKidnapSuccess() {
	CommonSetScreen("Room", "MainHall");
	DialogLeave();
	IntroductionMaid.Stage = "432";
	IntroductionJobCount = 0;
}

/**
 * Triggered when the kidnap daily job fight mini-game is lost. Sends the player back to the main hall and allow the player to retry later.
 * @returns {void} - Nothing
 */
function DailyJobKidnapFail() {
	CommonSetScreen("Room", "MainHall");
	if (DailyJobOpponent) {
		DailyJobOpponent.Stage = "10";
	}
	DialogLeave();
	DialogChangeReputation("Dominant", -1);
}

/**
 * Triggered when the puppy walker job minigame is started
 * @returns {void} - Nothing
 */
function DailyJobPuppyGameStart() {
	MiniGameStart("PuppyWalker", 0, () => { DailyJobPuppyGameEnd(); });
}

/**
 * Triggered at the end of the puppy walker job fight mini-game
 * @returns {SafePromise<void>}
 */
async function DailyJobPuppyGameEnd() {
	await CommonSetScreen("Room", "DailyJob");
	if (!DailyJobPuppyMistress) return;
	DailyJobPuppyMistress.Stage = (MiniGameVictory) ? "100" : "200";
	CharacterSetCurrent(DailyJobPuppyMistress);
	if (MiniGameVictory) IntroductionJobDone();
	IntroductionMaid.Stage = "0";
	DailyJobPuppyMistress.CurrentDialog = DialogFind(DailyJobPuppyMistress, (MiniGameVictory) ? "PuppyVictory" : "PuppyDefeat");
}

/**
 * Triggered when a daily job ends, sends the player back to the main hall
 * @returns {void} - Nothing
 */
function DailyJobEnd() {
	CommonSetScreen("Room", "MainHall");
	DialogLeave();
}

/**
 * Triggered when the player is turned into a puppy by the Mistress
 * @returns {void} - Nothing
 */
function DailyJobPuppyPlayer() {
	DailyJobPuppyLoad("0");
}

/**
 * Triggered when the player is restrained during the dojo minigame
 * @returns {void} - Nothing
 */
function DailyJobDojoRestrainPlayer() {
	InventoryWear(Player, "HempRope", "ItemArms", "Default", undefined, undefined, undefined, false);
	if (!InventoryGet(Player, "ItemTorso")) {
		const item = InventoryWear(Player, "HempRopeHarness", "ItemTorso", "Default", undefined, undefined, undefined, false);
		if (item) {
			TypedItemSetOptionByName(Player, item, "Harness", false);
		}
	}
	CharacterRefresh(Player);
}

/**
 * Triggered when the dojo struggle job minigame is started
 * @returns {void} - Nothing
 */
function DailyJobDojoGameStart() {
	MiniGameStart("DojoStruggle", 0, () => { DailyJobDojoGameEnd(); });
}

/**
 * Triggered at the end of the dojo struggle job minigame
 * @returns {SafePromise<void>}
 */
async function DailyJobDojoGameEnd() {
	if (!DailyJobDojoTeacher) return;
	await CommonSetScreen("Room", "DailyJob");

	DailyJobDojoTeacher.Stage = (MiniGameVictory) ? "100" : "200";
	CharacterSetCurrent(DailyJobDojoTeacher);
	if (MiniGameVictory) {
		IntroductionJobDone();
		let refresh = false;
		if (InventoryGet(Player, "ItemArms")?.Asset.Name === "HempRope") {
			InventoryRemove(Player, "ItemArms", false);
			refresh = true;
		}
		if (InventoryGet(Player, "ItemTorso")?.Asset.Name === "HempRopeHarness") {
			InventoryRemove(Player, "ItemTorso", false);
			refresh = true;
		}
		if (refresh) {
			CharacterRefresh(Player);
		}
	}
	IntroductionMaid.Stage = "0";
	DailyJobDojoTeacher.CurrentDialog = DialogFind(DailyJobDojoTeacher, (MiniGameVictory) ? "DojoStruggleVictory" : "DojoStruggleDefeat");
}
