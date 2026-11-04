"use strict";

var StableBackground = "HorseStable";
/** @type {NPCCharacter} */
var StableTrainer = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var StablePony = /** @type {never} */ (null);
var StablePonyPass = false;
var StablePonyFail = false;
/** @type {Item[] | null} */
var StablePlayerAppearance = null;
/** @type {"Pony" | "Trainer" | null} */
var StablePlayerOutfitWorn = null;
var StablePlayerTrainingActiv = false;
var StablePlayerTrainingLessons = 0;
var StablePlayerTrainingBehavior = 0;
var StableTrainerTrainingExercises = 0;
var StablePlayerInIsolation = false;
/** @type {number} */
var StablePlayerInIsolationStart = 0;
/** @type {number} */
var StablePlayerInIsolationEnd = 0;
var StableExamPoint = 0;

////////////////////////////////////////////////////////////////////////////////////////////
//General Room function
////////////////////////////////////////////////////////////////////////////////////////////
// functions for Dialogs
function StablePlayerIsPony() {
	return (LogQuery("Pony", "JoinedStable") && (ReputationGet("Dominant") < -30)) && !StablePlayerIsWearingOutfit("Pony");
}

function StablePlayerIsExamPony() {
	return LogQuery("PonyExam", "JoinedStable");
}

function StablePlayerIsTrainer() {
	return (LogQuery("Trainer", "JoinedStable") && (ReputationGet("Dominant") > 30));
}

function StablePlayerIsExamTrainer() {
	return LogQuery("TrainerExam", "JoinedStable");
}

function StablePlayerCanTrainPony() {
	return (StablePlayerIsTrainer() || StablePlayerIsExamTrainer()) && !StablePlayerIsWearingOutfit("Trainer");
}

function StablePlayerIsReadyToTrain() {
	return (StablePlayerIsTrainer() || StablePlayerIsExamTrainer()) && StablePlayerIsWearingOutfit("Trainer");
}

function StablePlayerIsNewby() {
	return (!LogQuery("Pony", "JoinedStable") && !LogQuery("Trainer", "JoinedStable"));
}
/**
 * Check what outfit the player is currently wearing.
 * @param {"Pony" | "Trainer" | null} Outfit
 */
function StablePlayerIsWearingOutfit(Outfit) {
	return Outfit == StablePlayerOutfitWorn;
}
function StablePlayerIsCollared() {return InventoryGet(Player, "ItemNeck") !== null;}
function StablePlayerOtherPony()  {return StableTrainer.Stage == "StableTrainingOtherPoniesBack" || StableTrainer.Stage == "StableTrainingEnd";}
function StablePlayerIsolation()  {return StableTrainer.Stage == "StableTrainingIsolationBack";}
function StableTrainingExercisesAvailable() {return (StableTrainerTrainingExercises > 0);}
function StablePlayerAllowedPonyExamen() {return (!StablePlayerIsExamPony() && StablePlayerIsPony() && (SkillGetLevel(Player, "Dressage") >= 6));}
function StablePlayerDisallowedPonyExamen() {return (!StablePlayerIsExamPony() && StablePlayerIsPony() && (SkillGetLevel(Player, "Dressage") < 6));}
function StablePlayerAllowedTrainerExamen() {return (!StablePlayerIsExamTrainer() && StablePlayerIsTrainer() && (SkillGetLevel(Player, "Dressage") >= 6));}
function StablePlayerDisallowedTrainerExamen() {return (!StablePlayerIsExamTrainer() && StablePlayerIsTrainer() && (SkillGetLevel(Player, "Dressage") < 6));}
function StableCanHideDice() {return (LogQuery("Joined", "BadGirl") && LogQuery("Stolen", "BadGirl") && !LogQuery("Hide", "BadGirl"));}
/**
 * Returns TRUE if the player and the current character can play Club Card
 * @returns {boolean} - Returns TRUE if both aren't restrained
 */
function StableCanPlayClubCard() { return (!Player.IsRestrained() && !!CurrentCharacter && !CurrentCharacter.IsRestrained() && !Player.IsGagged() && !CurrentCharacter.IsGagged()); }

/**
 * Loads the stable characters with many restraints
 * @type {ScreenLoadHandler}
 */
async function StableLoad() {
	// Give items to the player in case they completed the exam before they were added
	if (StablePlayerIsExamTrainer() || StablePlayerIsExamPony()) {
		/** @type {ItemBundle[]} */
		var ItemsToEarn = [];
		ItemsToEarn.push({Name: "PonyBoots", Group: "Shoes"});
		ItemsToEarn.push({Name: "HarnessPonyBits", Group: "ItemMouth"});
		InventoryAddMany(Player, ItemsToEarn);
	}

	// Default load
	if (StableTrainer == null) {
		StableTrainer = CharacterLoadNPC("NPC_Stable_Trainer");
		StableWearTrainerEquipment(StableTrainer);
		if (StablePlayerIsExamTrainer()) {
			StableTrainer.AllowItem = true;
		} else {
			StableTrainer.AllowItem = false;
		}
		StablePony = CharacterLoadNPC("NPC_Stable_Pony");
		CharacterNaked(StablePony);
		InventoryWear(StablePony, "LeatherCollar", "ItemNeck");
		StableWearPonyEquipment(StablePony);
		if (StablePlayerIsExamTrainer()) {
			StablePony.AllowItem = false;
		} else {
			StablePony.AllowItem = false;
		}
	}
	StablePlayerInIsolation = false;
}

// Run the stable, draw all 3 characters
function StableRun() {
	if (StableProgress >= 0) {
		StableGenericDrawProgress();
	} else if (StablePlayerInIsolation == true) {
		DrawCharacter(Player, 750, 0, 1);
		DrawText(TextGet("InStable"), 1750, 925, "White", "Black");
		DrawProgressBar(1525, 955, 450, 35, (1 - ((StablePlayerInIsolationEnd - CommonTime()) / (StablePlayerInIsolationEnd - StablePlayerInIsolationStart))) * 100);
		if ((StablePlayerInIsolationEnd != null) && (CommonTime() >= StablePlayerInIsolationEnd)) {
			StablePlayerInIsolation = false;
		}
	} else {
		DrawCharacter(Player, 250, 0, 1);
		DrawCharacter(StableTrainer, 750, 0, 1);
		DrawCharacter(StablePony, 1250, 0, 1);
		if (Player.CanWalk() && (!StablePlayerTrainingActiv || StablePlayerIsExamPony())) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
		DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
		if (StableCanHideDice()) DrawButton(1885, 265, 90, 90, "", "White", "Icons/DiceHide.png", TextGet("HideDice"));
		//DrawButton(1885, 265, 90, 90, "", "White", "Screens/Room/Stable/Horse.png");
	}
}

// When the user clicks in the stable
function StableClick() {
	if (StablePlayerInIsolation == true) {
		if (MouseIn(750, 0, 500, 1000)) CharacterSetCurrent(Player);
	} else if (StableProgress >= 0) {
		// If the user wants to speed up the add / swap / remove progress
		if (MouseIn(0, 200, 2000, 800) && (StableProgress >= 0) && CommonIsMobile) StableGenericRun(false);
		if (MouseIn(1750, 25, 225, 75)) StableGenericCancel();
	} else {
		if (MouseIn(250, 0, 500, 1000)) CharacterSetCurrent(Player);
		if (MouseIn(750, 0, 500, 1000)) CharacterSetCurrent(StableTrainer);
		if (MouseIn(1250, 0, 500, 1000)) CharacterSetCurrent(StablePony);
		if (MouseIn(1885, 25, 90, 90) && Player.CanWalk() && (!StablePlayerTrainingActiv || StablePlayerIsExamPony())) CommonSetScreen("Room", "MainHall");
		if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
		if (MouseIn(1885, 265, 90, 90) && StableCanHideDice()) StableHideDice();
	}
}

////////////////////////////////////////////////////////////////////////////////////////////
//Special Room function - Player is Pony
////////////////////////////////////////////////////////////////////////////////////////////
//Start the Demo for a Ponytraining
function StableTrialPonyTraining() {
	StableGenericProgressStart(60, 0, 0, "Screens/Room/Stable/toyhorse.png", "HorseStable", StableTrainer, null, "0", "StableTrainerToyHorseFin", "0", "StableTrainerToyHorseCancel", 2,  "Toyhorse");
	SkillProgress(Player, "Dressage", 15);
}

//Start the Demo for a Trainer-training
function StableTrialTrainerTraining() {
	MiniGameStart("HorseWalk", "WhipPony", () => { StableTrialTrainerTrainingEnd(); });
}

/**
 * @returns {SafePromise<void>}
 */
async function StableTrialTrainerTrainingEnd() {
	await CommonSetScreen("Room", "Stable");
	CharacterSetCurrent(StableTrainer);
	if (MiniGameVictory) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainerToyHorseFin");
	} else {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainerToyHorseCancel");
	}
}

/**
 * @param {StableFeeType} Fee
 * @returns {number}
 */
function StableFeeValue(Fee) {
	switch (Fee) {
		case "PonyExam":
			return 50;
		case "TrainPony":
			return 10;
		case "TrainerExam":
			return 50;
		case "BecomeTrainer":
			return 500;
		case "WhiskeyRounds":
			return 50;
	}
	return 0;
}

/**
 * @param {StableFeeType} Fee
 * @returns {boolean}
 */
function StableCanPayTheFee(Fee) {
	let value = StableFeeValue(Fee);
	// When you succeed the Trainer exam, you pay the rounds to the other trainers
	if (Fee === "TrainerExam")
		value += StableFeeValue("WhiskeyRounds");
	return Player.Money >= value;
}

/**
 * @param {StableFeeType} Fee
 */
function StablePayTheFee(Fee) {
	CharacterChangeMoney(Player, -StableFeeValue(Fee));
}

//Check if the Player can become a Pony
function StableCanBecomePony() {
	if (ReputationGet("Dominant") > -30) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableBecomePonySubIntro");
	} else if (!(InventoryAvailable(Player, "HarnessBallGag", "ItemMouth") && InventoryAvailable(Player, "LeatherArmbinder", "ItemArms") && InventoryAvailable(Player, "LeatherHarness", "ItemTorso") && InventoryAvailable(Player, "HorsetailPlug", "ItemButt"))) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableBecomePonyEquipmentIntro");
		StableTrainer.Stage = "StableBecomePonyEquipment";
	} else if (!InventoryGet(Player, "ItemNeck")) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableBecomePonyCollarIntro");
	} else if (!StableCanPayTheFee("PonyExam")) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableBecomePonyMoneyIntro");
	} else {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableBecomePonyTrueIntro");
		StableTrainer.Stage = "StableBecomePonyTrue";
	}
}

//Check if the Player can Start a Lesson
function StablePlayerStartTrainingLesson() {
	if (!StablePlayerIsCollared()) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingStartCollar");
	} else {
		StablePlayerTrainingActiv = true;
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingStartIntro");
		StableTrainer.Stage = "StableTrainingStart";
	}
}

//Select a Lesson
function StablePlayerGetTrainingLesson() {
	if (StablePlayerTrainingLessons > 5) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingEndIntro");
		StableTrainer.Stage = "StableTrainingEnd";
	} else {
		var TrainSelection = Math.random() * (10 + SkillGetLevel(Player, "Dressage"));
		if (TrainSelection < 3) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingGallopIntro");
			StableTrainer.Stage = "StableTrainingGallop";
		} else if (TrainSelection < 5) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingWalkIntro");
			StableTrainer.Stage = "StableTrainingWalk";
		} else if (TrainSelection < 7) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingDanceIntro");
			StableTrainer.Stage = "StableTrainingDance";
		} else if (TrainSelection < 8) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingTreadmillIntro");
			StableTrainer.Stage = "StableTrainingTreadmill";
		} else if (TrainSelection < 9) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingCarriageIntro");
			StableTrainer.Stage = "StableTrainingCarriage";
		} else if (TrainSelection < 10) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingCarrotsIntro");
			StableTrainer.Stage = "StableTrainingCarrots";
		} else if (TrainSelection < 11) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingHurdlesIntro");
			StableTrainer.Stage = "StableTrainingHurdles";
		} else if (TrainSelection < 12) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingRaceIntro");
			StableTrainer.Stage = "StableTrainingRace";
		} else if (TrainSelection < 13) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingDanceIntro");
			StableTrainer.Stage = "StableTrainingDance";
		} else if (TrainSelection < 14) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingHurdlesIntro");
			StableTrainer.Stage = "StableTrainingHurdles";
		} else if (TrainSelection < 15) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingTreadmillIntro");
			StableTrainer.Stage = "StableTrainingTreadmill";
		} else if (TrainSelection < 16) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingStrongRaceIntro");
			StableTrainer.Stage = "StableTrainingStrongRace";
		} else if (TrainSelection < 17) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingCarriageIntro");
			StableTrainer.Stage = "StableTrainingCarriage";
		} else if (TrainSelection < 18) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingHurdlesIntro");
			StableTrainer.Stage = "StableTrainingHurdles";
		} else if (TrainSelection < 19) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingStrongTreadmillIntro");
			StableTrainer.Stage = "StableTrainingStrongTreadmill";
		} else if (TrainSelection < 20) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingStrongCarriageIntro");
			StableTrainer.Stage = "StableTrainingStrongCarriage";
		}
	}
}

/**
 * Start Training Gallop
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingGallop(Behavior) {
	StablePlayerTrainingLessons++;
	StablePlayerTrainingBehavior += Behavior;
	var StableDressage = SkillGetLevel(Player, "Dressage");
	var StableDifficulty = 3;
	SkillProgress(Player, "Dressage", StableDifficulty * 5);
	if ((Math.random() * StableDifficulty) < StableDressage) {
		StablePlayerTrainingBehavior += 2;
		if (StablePlayerTrainingBehavior > 2) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSuccessPassIntro");
			StableTrainer.Stage = "StableTrainingSuccessPass";
		} else {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSuccessFailIntro");
			StableTrainer.Stage = "StableTrainingSuccessFail";
		}
	} else {
		StablePlayerTrainingBehavior -= 2;
		if (StablePlayerTrainingBehavior >= 0) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingPassPunishIntro");
			StableTrainer.Stage = "StableTrainingPassPunish";
		} else {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailPunishIntro");
			StableTrainer.Stage = "StableTrainingPunishFail";
		}
	}
}

/**
 * Start Training Walk
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingWalk(Behavior) {
	StablePlayerTrainingLessons++;
	StablePlayerTrainingBehavior += Behavior;
	var StableDressage = SkillGetLevel(Player, "Dressage");
	var StableDifficulty = 6;
	SkillProgress(Player, "Dressage", StableDifficulty * 5);
	if ((Math.random() * StableDifficulty) < StableDressage) {
		StablePlayerTrainingBehavior += 2;
		if (StablePlayerTrainingBehavior > 2) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSuccessPassIntro");
			StableTrainer.Stage = "StableTrainingSuccessPass";
		} else {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSuccessFailIntro");
			StableTrainer.Stage = "StableTrainingSuccessFail";
		}
	} else {
		StablePlayerTrainingBehavior -= 2;
		if (StablePlayerTrainingBehavior >= 0) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingPassPunishIntro");
			StableTrainer.Stage = "StableTrainingPassPunish";
		} else {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailPunishIntro");
			StableTrainer.Stage = "StableTrainingPunishFail";
		}
	}
}

/**
 * Start Training Dance
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingDance(Behavior) {
	StablePlayerTrainingLessons++;
	StablePlayerTrainingBehavior += Behavior;
	var StableDressage = SkillGetLevel(Player, "Dressage");
	var StableDifficulty = 9;
	SkillProgress(Player, "Dressage", StableDifficulty * 5);
	if ((Math.random() * StableDifficulty) < StableDressage) {
		StablePlayerTrainingBehavior += 2;
		if (StablePlayerTrainingBehavior > 2) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSuccessPassIntro");
			StableTrainer.Stage = "StableTrainingSuccessPass";
		} else {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSuccessFailIntro");
			StableTrainer.Stage = "StableTrainingSuccessFail";
		}
	} else {
		StablePlayerTrainingBehavior -= 2;
		if (StablePlayerTrainingBehavior >= 0) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingPassPunishIntro");
			StableTrainer.Stage = "StableTrainingPassPunish";
		} else {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailPunishIntro");
			StableTrainer.Stage = "StableTrainingPunishFail";
		}
	}
}

/**
 * Start Training Hurdle
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingHurdles(Behavior) {
	StablePlayerTrainingBehavior += Behavior;
	MiniGameStart("HorseWalk", "Hurdle", () => { StablePlayerTrainingHurdlesEnd(); });
	StablePlayerTrainingLessons += 2;
}

/**
 * @returns {SafePromise<void>}
 */
async function StablePlayerTrainingHurdlesEnd() {
	await CommonSetScreen("Room", "Stable");
	CharacterSetCurrent(StableTrainer);
	if (MiniGameVictory) {
		StablePlayerTrainingBehavior += 2;
		if (StablePlayerTrainingBehavior > 2) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSuccessPassIntro");
			StableTrainer.Stage = "StableTrainingSuccessPass";
		} else {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSuccessFailIntro");
			StableTrainer.Stage = "StableTrainingSuccessFail";
		}
	} else {
		StablePlayerTrainingBehavior -= 2;
		if (StablePlayerTrainingBehavior >= 0) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingPassPunishIntro");
			StableTrainer.Stage = "StableTrainingPassPunish";
		} else {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailPunishIntro");
			StableTrainer.Stage = "StableTrainingPunishFail";
		}
	}
}

/**
 * Start Training Treadmill
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingTreadmill(Behavior) {
	StablePlayerTrainingBehavior += Behavior;
	var StableDressage = SkillGetLevel(Player, "Dressage");
	var StableDifficulty = 6;
	SkillProgress(Player, "Dressage", StableDifficulty * 5);
	StableGenericProgressStart((StableDifficulty + StableDressage) * 20, StableDressage, StableDressage, "Screens/Room/Stable/treadmill.png", "HorseStable", StableTrainer, null, "StableTrainingPass", "StableTrainingPassIntro", "StableTrainingFail", "StableTrainingFailIntro", 2, "Treadmill");
	StablePlayerTrainingLessons += 2;
}

/**
 * Start Training Strong Treadmill
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingStrongTreadmill(Behavior) {
	StablePlayerTrainingBehavior += Behavior;
	var StableDressage = SkillGetLevel(Player, "Dressage");
	var StableDifficulty = 2;
	InventoryWear(Player, "LeatherBelt", "ItemLegs");
	SkillProgress(Player, "Dressage", (StableDifficulty + 6) * 10);
	StableGenericProgressStart((StableDifficulty + StableDressage) * 20, StableDressage - 6, StableDressage, "Screens/Room/Stable/treadmill.png", "HorseStable", StableTrainer, null, "StableTrainingPass", "StableTrainingPassIntro", "StableTrainingFail", "StableTrainingFailIntro", 2, "Treadmill");
	StablePlayerTrainingLessons += 2;
}

/**
 * Start Training Carriage
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingCarriage(Behavior) {
	StablePlayerTrainingBehavior += Behavior;
	var StableDressage = SkillGetLevel(Player, "Dressage");
	var StableDifficulty = 9;
	SkillProgress(Player, "Dressage", StableDifficulty * 5);
	StableGenericProgressStart((StableDifficulty + StableDressage) * 20, StableDressage, StableDressage, "Screens/Room/Stable/horsecarriage.png", "HorseStable", StableTrainer, null, "StableTrainingPass", "StableTrainingPassIntro", "StableTrainingFail", "StableTrainingFailIntro", 2, "Carriage");
	StablePlayerTrainingLessons += 2;
}

/**
 * Start Training Strong Carriage
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingStrongCarriage(Behavior) {
	StablePlayerTrainingBehavior += Behavior;
	var StableDressage = SkillGetLevel(Player, "Dressage");
	var StableDifficulty = 3;
	InventoryWear(Player, "LeatherBelt", "ItemLegs");
	SkillProgress(Player, "Dressage", (StableDifficulty + 6) * 10);
	StableGenericProgressStart((StableDifficulty + StableDressage) * 20, StableDressage - 6, StableDressage, "Screens/Room/Stable/horsecarriage.png", "HorseStable", StableTrainer, null, "StableTrainingPass", "StableTrainingPassIntro", "StableTrainingFail", "StableTrainingFailIntro", 2, "Carriage");
	StablePlayerTrainingLessons += 2;
}

/**
 * Start Training Race
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingRace(Behavior) {
	StablePlayerTrainingBehavior += Behavior;
	var StableDressage = SkillGetLevel(Player, "Dressage");
	var StableDifficulty = 9;
	SkillProgress(Player, "Dressage", StableDifficulty * 5);
	StableGenericProgressStart((StableDifficulty + StableDressage) * 20, StableDressage, StableDressage + 1, "Screens/Room/Stable/treadmill.png", "HorseStable", StableTrainer, StablePony, "StableTrainingPass", "StableTrainingPassIntro", "StableTrainingFail", "StableTrainingFailIntro", 2, "Treadmill");
	StablePlayerTrainingLessons += 2;
}

/**
 * Start Training Strong Race
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingStrongRace(Behavior) {
	StablePlayerTrainingBehavior += Behavior;
	var StableDressage = SkillGetLevel(Player, "Dressage");
	var StableDifficulty = 9;
	SkillProgress(Player, "Dressage", StableDifficulty * 5);
	StableGenericProgressStart((StableDifficulty + StableDressage) * 20, StableDressage, StableDressage + 3, "Screens/Room/Stable/treadmill.png", "HorseStable", StableTrainer, StablePony, "StableTrainingPass", "StableTrainingPassIntro", "StableTrainingFail", "StableTrainingFailIntro", 2, "Treadmill");
	StablePlayerTrainingLessons += 2;
}

/**
 * Start Training Carrots - MiniGame
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingCarrots(Behavior) {
	StablePlayerTrainingBehavior += Behavior;
	MiniGameStart("HorseWalk", "Carrot", () => { StablePlayerTrainingCarrotsEnd(); });
	StablePlayerTrainingLessons += 2;
}

/**
 * End Traning Carrots - MiniGame
 * @returns {SafePromise<void>}
 */
async function StablePlayerTrainingCarrotsEnd() {
	await CommonSetScreen("Room", "Stable");
	CharacterSetCurrent(StableTrainer);
	if (MiniGameVictory) {
		StablePlayerTrainingBehavior += 2;
		if (StablePlayerTrainingBehavior > 2) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSuccessPassIntro");
			StableTrainer.Stage = "StableTrainingSuccessPass";
		} else {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSuccessFailIntro");
			StableTrainer.Stage = "StableTrainingSuccessFail";
		}
	} else {
		StablePlayerTrainingBehavior -= 2;
		if (StablePlayerTrainingBehavior >= 0) {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingPassPunishIntro");
			StableTrainer.Stage = "StableTrainingPassPunish";
		} else {
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailPunishIntro");
			StableTrainer.Stage = "StableTrainingPunishFail";
		}
	}
}

/**
 * Reward for passed
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingPass(Behavior) {
	StablePlayerTrainingBehavior += Behavior;
	if (StablePlayerTrainingBehavior <= 0) {
		StableCheckEquipment();
	} else {
		var PassSelection = Math.random() * 7;
		if (PassSelection < 1) {
			StablePlayerTrainingBehavior -= 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingPettingIntro");
			StableTrainer.Stage = "StableTrainingPetting";
		} else if (PassSelection < 2) {
			StablePlayerTrainingBehavior -= 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingScratchingIntro");
			StableTrainer.Stage = "StableTrainingScratching";
		} else if (PassSelection < 3) {
			StablePlayerTrainingBehavior -= 2;
			StablePonyStraightens(Player);
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingStraightenIntro");
			StableTrainer.Stage = "StableTrainingStraighten";
		} else if (PassSelection < 4) {
			StablePlayerTrainingBehavior -= 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingSpongeIntro");
			StableTrainer.Stage = "StableTrainingSponge";
		} else if (PassSelection < 5) {
			StablePlayerTrainingBehavior -= 2;
			InventoryRemove(Player, "ItemMouth");
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingOoatcakeIntro");
			StableTrainer.Stage = "StableTrainingOatcake";
		} else if (PassSelection < 6) {
			StablePlayerTrainingBehavior -= 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingOtherPoniesIntro");
			StableTrainer.Stage = "StableTrainingOtherPonies";
		} else if (PassSelection < 7) {
			StablePlayerTrainingBehavior -= 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingRunOutIntro");
			StableTrainer.Stage = "StableTrainingRunOut";
		}
	}
}

/**
 * Guarantee for failed
 *
 * @param {number} Behavior
 */
function StablePlayerTrainingFail(Behavior) {
	StablePlayerTrainingBehavior += Behavior;
	if (StablePlayerTrainingBehavior >= 0) {
		StableCheckEquipment();
	} else {
		var FailSelection = Math.random() * 8;
		if (FailSelection < 1) {
			StablePlayerTrainingBehavior += 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailPopsIntro");
			StableTrainer.Stage = "StableTrainingFailPops";
		} else if (FailSelection < 2) {
			StablePlayerTrainingBehavior += 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailBackIntro");
			StableTrainer.Stage = "StableTrainingFailBack";
		} else if (FailSelection < 3) {
			StablePlayerTrainingBehavior += 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailHipIntro");
			StableTrainer.Stage = "StableTrainingFailHip";
		} else if (FailSelection < 4) {
			StablePlayerTrainingBehavior += 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailButtIntro");
			StableTrainer.Stage = "StableTrainingFailButt";
		} else if (FailSelection < 5) {
			StablePlayerTrainingBehavior += 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailLegsIntro");
			StableTrainer.Stage = "StableTrainingFailLegs";
		} else if (FailSelection < 6) {
			StablePlayerTrainingBehavior += 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailBreastIntro");
			StableTrainer.Stage = "StableTrainingFailBreast";
		} else if (FailSelection < 7) {
			StablePlayerTrainingBehavior += 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailWaterIntro");
			StableTrainer.Stage = "StableTrainingFailWater";
		} else if (FailSelection < 8) {
			StablePlayerTrainingBehavior += 2;
			StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingFailStableIntro");
			StableTrainer.Stage = "StableTrainingFailStable";
		}
	}
}

function StablePlayerOtherPonys() {
	CharacterSetCurrent(StablePony);
	StableTrainer.Stage = "StableTrainingOtherPoniesBack";
}

function StablePlayerToStable() {
	StablePlayerInIsolation = true;
	StablePlayerInIsolationStart = CommonTime();
	StablePlayerInIsolationEnd = CommonTime() + 40000 + Math.floor(Math.random() * 40000);
	InventoryWear(Player, "LeatherBelt", "ItemFeet");
	StableTrainer.Stage = "StableTrainingIsolationBack";
	DialogLeave();
}

//Start the Pony introduction
function StableDressPonyStart() {
	if (!StablePlayerAppearance) StablePlayerAppearance = Player.Appearance.slice();
	StablePlayerOutfitWorn = "Pony";
	CharacterNaked(Player);
}

// When the player becomes a pony
function StableBecomePonyFin() {
	InventoryWear(Player, "Ears2", "Hat");
	LogAdd("Pony", "JoinedStable");
}

//Stop the Traning and Remove some Items
function StableTrainingStoped() {
	StablePlayerTrainingActiv = false;
	StablePony.AllowItem = false;
	InventoryRemove(Player, "ItemArms");
	StablePlayerTrainingLessons = 0;
}

//Player can go to ponies after training
function StablePlayerToHerd() {
	StableWearPonyEquipment(Player);
	StablePony.AllowItem = true;
	CharacterSetCurrent(StablePony);
}

//Dress Caracter Back
function StableDressBackPlayer() {
	CharacterRelease(Player);
	CharacterNaked(Player);
	//Release Harnes, Plug, Ears2
	InventoryRemove(Player, ["ItemTorso", "Hat", "ItemButt"], { refresh: false });
	if (StablePlayerAppearance) {
		CharacterDress(Player, StablePlayerAppearance);
	}
	StablePlayerOutfitWorn = null;
	StablePony.AllowItem = false;
	CharacterRefresh(Player);
	StableTrainerTrainingExercises = 0;
}

//Start the Equipment Check
function StableCheckEquipment() {
	StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableTrainingCheckEquipmentIntro");
	StableTrainer.Stage = "StableTrainingCheckEquipment";
}

/**
 * Dress the Equipment to the Player
 *
 * @param {number} Behavior
 */
function StablePlayerWearEquipment(Behavior) {
	StablePlayerTrainingBehavior = 0;
	StablePlayerTrainingBehavior += Behavior;
	StableWearPonyEquipment(Player);
	if (!StablePlayerIsCollared()) InventoryWear(Player, "LeatherCollar", "ItemNeck");
	StablePlayerGetTrainingLesson();
}

/**
 * Dress Character like a Pony
 * @param {Character} C
 */
function StableWearPonyEquipment(C) {
	CharacterNaked(C);
	InventoryWear(C, "PonyEars1", "Hat");
	InventoryWear(C, "LeatherHarness", "ItemTorso");
	InventoryWear(C, "HarnessPonyBits", "ItemMouth");
	InventoryWear(C, "LeatherArmbinder", "ItemArms");
	InventoryWear(C, "HorsetailPlug", "ItemButt");
	InventoryWear(C, "PonyBoots", "Shoes");
	InventoryRemove(C, "ItemLegs");
	CharacterRefresh(C);
}

////////////////////////////////////////////////////////////////////////////////////////////
//Special Room function - Player Pony Exam
////////////////////////////////////////////////////////////////////////////////////////////
function StablePlayerStartExam() {
	StablePayTheFee("PonyExam");
	if (!StablePlayerAppearance) StablePlayerAppearance = Player.Appearance.slice();
	if (!StablePlayerIsCollared()) InventoryWear(Player, "LeatherCollar", "ItemNeck");
	StableWearPonyEquipment(Player);
	StableExamPoint = 0;
	StablePlayerOutfitWorn = "Pony";
	StablePlayerTrainingActiv = true;
	StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamHurdlesIntro");
	StableTrainer.Stage = "StableExamHurdle";
}

function StablePlayerExamHurdles() {
	MiniGameStart("HorseWalk", "Hurdle", () => { StablePlayerExamHurdlesEnd(); });
}

/**
 * @returns {SafePromise<void>}
 */
async function StablePlayerExamHurdlesEnd() {
	await CommonSetScreen("Room", "Stable");
	CharacterSetCurrent(StableTrainer);
	if (MiniGameVictory) {
		StableExamPoint++;
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamRaceIntro");
		StableTrainer.Stage = "StableExamRace";
	} else {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamFailIntro");
		StableTrainer.Stage = "StableExamFail";
	}
}

function StablePlayerExamRace() {
	var StableDressage = SkillGetLevel(Player, "Dressage");
	var StableDifficulty = 9;
	SkillProgress(Player, "Dressage", StableDifficulty * 5);
	StableGenericProgressStart((StableDifficulty + StableDressage) * 20, StableDressage, StableDressage + 2, "Screens/Room/Stable/treadmill.png", "HorseStable", StableTrainer, StablePony, "StableExamDressage", "StableExamDressageIntro", "StableExamFail", "StableExamFailIntro", 2, "Treadmill");
}

function StablePlayerExamDressage() {
	var StableDressage = SkillGetLevel(Player, "Dressage");
	SkillProgress(Player, "Dressage", 50);
	if ((Math.random() * 6) < (StableDressage - 5)) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamPassIntro");
		StableTrainer.Stage = "StableExamPass";
	} else {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamFailIntro");
		StableTrainer.Stage = "StableExamFail";
	}
}

function StablePlayerExamPass() {
	LogAdd("PonyExam", "JoinedStable");
	LoginStableItems();
	StablePlayerExamEnd();
	StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamAwardIntro");
	StableTrainer.Stage = "StableExamAward1";
}

function StablePlayerExamEnd() {
	StablePlayerTrainingActiv = false;
	CharacterRelease(Player);
	CharacterNaked(Player);
	//Release Harnes, Plug, Ears2
	InventoryRemove(Player, ["ItemTorso", "Hat", "ItemButt"], false);
	if (StablePlayerAppearance) {
		CharacterDress(Player, StablePlayerAppearance);
	}
	StablePlayerOutfitWorn = null;
	StablePony.AllowItem = false;
	CharacterRefresh(Player);
}

////////////////////////////////////////////////////////////////////////////////////////////
//Special Room function - Player is Trainer
////////////////////////////////////////////////////////////////////////////////////////////
//Check if the Player can become a Trainer
function StableCanBecomeTrainer() {
	/** @type {[AssetName, AssetGroupItemName][]} */
	const needed = [
		["Crop", "ItemHandheld"],
		["Whip", "ItemHandheld"],
		["LeatherBelt", "ItemLegs"],
		["LeatherBelt", "ItemFeet"]
	];
	if (SkillGetLevel(Player, "Dressage") < 3) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableBecomeTrainerDressageIntro");
	} else if (ReputationGet("Dominant") < 30) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableBecomeTrainerDomIntro");
	} else if (!needed.every(i => InventoryAvailable(Player, i[0], i[1]))) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableBecomeTrainerEquipmentIntro");
	} else if (!StableCanPayTheFee("BecomeTrainer")) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableBecomeTrainerMoneyIntro");
	} else {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableBecomeTrainerTrueIntro");
		StableTrainer.Stage = "StableBecomeTrainerTrue";
	}
}

//Player become a Trainer
function StableBecomeTrainer() {
	StablePayTheFee("BecomeTrainer");
	LogAdd("Trainer", "JoinedStable");
	if (!StablePlayerAppearance) StablePlayerAppearance = Player.Appearance.slice();
	StableWearTrainerEquipment(Player);
	StableTrainerTrainingExercises = 3 + SkillGetLevel(Player, "Dressage");
	StablePlayerOutfitWorn = "Trainer";
}

/**
 * Dress as Trainer
 * @param {Character} C
 */
function StableWearTrainerEquipment(C) {
	InventoryWear(C, "Jeans1", "ClothLower", "#bbbbbb");
	InventoryWear(C, "Boots1", "Shoes", "#3d0200");
	InventoryWear(C, "Gloves1", "Gloves", "#cccccc");
	InventoryWear(C, "TShirt1", "Cloth", "#aa8080");
	InventoryWear(C, "Beret1", "Hat", "#202020");
}

//Player Start as a Trainer a rotine
function StableTrainerStart() {
	if (!StablePlayerAppearance) StablePlayerAppearance = Player.Appearance.slice();
	StablePayTheFee("TrainPony");
	StableWearTrainerEquipment(Player);
	StableTrainerTrainingExercises = 3 + SkillGetLevel(Player, "Dressage");
	StablePlayerOutfitWorn = "Trainer";
	StablePony.AllowItem = true;
}

//Dress the Equipment to the Pony
function StablePonyWearEquipment() {
	StablePonyPass = false;
	StablePonyFail = false;
	StableWearPonyEquipment(StablePony);
	var PonyBehavior = Math.random();
	if (PonyBehavior < 0.4) {
		StablePony.CurrentDialog = DialogFind(StablePony, "StablePonyCheckEquipmentWait");
		StablePonyPass = true;
	} else if (PonyBehavior < 0.8) {
		StablePony.CurrentDialog = DialogFind(StablePony, "StablePonyCheckEquipmentWhinny");
	} else {
		StablePony.CurrentDialog = DialogFind(StablePony, "StablePonyCheckEquipmentKick");
		StablePonyFail = true;
	}
}

/**
 * @param {number} probability
 */
function StablePonyTraining(probability) {
	if (probability > Math.random() * 100) {
		StablePony.CurrentDialog = DialogFind(StablePony, "StablePonyPassIntro");
		SkillProgress(Player, "Dressage", (100 - probability));
		StablePony.Stage = "23";
		StablePonyPass = true;
	} else {
		StablePony.CurrentDialog = DialogFind(StablePony, "StablePonyFailIntro");
		StablePony.Stage = "24";
		StablePonyFail = true;
	}
	StableTrainerTrainingExercises -= 1;
}

//Start Traning Hurdle for Player as Trainer
function StablePonyTrainingHurdles() {
	MiniGameStart("HorseWalk", "HurdleTraining", () => { StablePonyTrainingHurdlesEnd(); });
	StableTrainerTrainingExercises -= 2;
}

/**
 * @returns {SafePromise<void>}
 */
async function StablePonyTrainingHurdlesEnd() {
	await CommonSetScreen("Room", "Stable");
	CharacterSetCurrent(StablePony);
	if (MiniGameVictory) {
		StablePony.CurrentDialog = DialogFind(StablePony, "StablePonyPassIntro");
		StablePony.Stage = "23";
		StablePonyPass = true;
	} else {
		StablePony.CurrentDialog = DialogFind(StablePony, "StablePonyFailIntro");
		StablePony.Stage = "24";
		StablePonyFail = true;
	}
}

//Start the Trainer-training
function StableTrainerWhip() {
	MiniGameStart("HorseWalk", "WhipPony", () => { StableTrainerWhipEnd(); });
	StableTrainerTrainingExercises -= 2;
}

/**
 * @returns {SafePromise<void>}
 */
async function StableTrainerWhipEnd() {
	await CommonSetScreen("Room", "Stable");
	CharacterSetCurrent(StablePony);
	if (MiniGameVictory) {
		StablePony.CurrentDialog = DialogFind(StablePony, "StablePonyPassIntro");
		StablePony.Stage = "23";
		StablePonyPass = true;
	} else {
		StablePony.CurrentDialog = DialogFind(StablePony, "StablePonyFailIntro");
		StablePony.Stage = "24";
		StablePonyFail = true;
	}
}

/**
 *
 * @param {Character | undefined} [C]
 */
function StablePonyStraightens(C) {
	C = C ? C : StablePony;
	const Color = ItemGetColor(C, "HairBack");
	CharacterAppearanceNextItem(C, "HairBack");
	const hairBack = InventoryGet(C, "HairBack");
	if (hairBack && Color) {
		hairBack.Color = Color;
	}
	CharacterRefresh(C);
}

////////////////////////////////////////////////////////////////////////////////////////////
//Special Room function - Player Trainer Exam
////////////////////////////////////////////////////////////////////////////////////////////
function StablePlayerStartTExam() {
	StablePayTheFee("TrainerExam");
	if (!StablePlayerAppearance) StablePlayerAppearance = Player.Appearance.slice();
	StableWearTrainerEquipment(Player);
	StablePlayerOutfitWorn = "Trainer";
	StablePony.AllowItem = true;
	StableExamPoint = 0;
	StablePlayerTrainingActiv = true;
	StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamTKnowIntro");
	StableTrainer.Stage = "StableExamTKnow";
}

function StablePlayerTExamKnow() {
	var StableDressage = SkillGetLevel(Player, "Dressage");
	SkillProgress(Player, "Dressage", 50);
	if ((Math.random() * 6) < (StableDressage - 5)) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamTWhipIntro");
		StableTrainer.Stage = "StableExamTWhipe";
	} else {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamFailIntro");
		StableTrainer.Stage = "StableExamFail";
	}
}

function StablePlayerTExamWhip() {
	MiniGameStart("HorseWalk", "WhipPony", () => { StablePlayerTExamWhipEnd(); });
}

/**
 * @returns {SafePromise<void>}
 */
async function StablePlayerTExamWhipEnd() {
	await CommonSetScreen("Room", "Stable");
	CharacterSetCurrent(StableTrainer);
	if (MiniGameVictory) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamTHurdlesIntro");
		StableTrainer.Stage = "StableExamTHurdle";
	} else {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamFailIntro");
		StableTrainer.Stage = "StableExamFail";
	}
}

function StablePlayerTExamHurdles() {
	MiniGameStart("HorseWalk", "HurdleTraining", () => { StablePlayerTExamHurdlesEnd(); });
}

/**
 * @returns {SafePromise<void>}
 */
async function StablePlayerTExamHurdlesEnd() {
	await CommonSetScreen("Room", "Stable");
	CharacterSetCurrent(StableTrainer);
	if (MiniGameVictory) {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamTPassIntro");
		StableTrainer.Stage = "StableExamTPass";
	} else {
		StableTrainer.CurrentDialog = DialogFind(StableTrainer, "StableExamFailIntro");
		StableTrainer.Stage = "StableExamFail";
	}
}

function StablePlayerTExamPass() {
	LogAdd("TrainerExam", "JoinedStable");
	LoginStableItems();
	StablePayTheFee("WhiskeyRounds");
	StablePlayerTExamEnd();
}

function StablePlayerTExamEnd() {
	StablePlayerTrainingActiv = false;
	if (StablePlayerAppearance) {
		CharacterDress(Player, StablePlayerAppearance);
	}
	StablePlayerOutfitWorn = null;
	StablePony.AllowItem = false;
	CharacterRefresh(Player);
}

////////////////////////////////////////////////////////////////////////////////////////////
//Run the Line
////////////////////////////////////////////////////////////////////////////////////////////
var StableProgress = -1;
var StableSecondProgress = -1;
var StableProgressAuto = 0;
var StableSecondProgressAuto = 0;
var StableProgressClick = 0;
/** @type {string} */
var StableProgressLastKeyPress = "";
var StableProgressItem = '';
var StableProgressFinished = false;
/** @type {Character} */
var StableProgressCharacter = /** @type {never} */ (null);
/** @type {Character | null} */
var StableProgressSecondCharacter = null;
var StableProgressEndStage = "0";
var StableProgressEndDialog = "";
var StableProgressCancelStage = "";
var StableProgressCancelDialog = "";
var StableProgressBehavior = 0;
/** @type {StableProgressType | "StruggleImpossible"} */
var StableProgressOperation = /** @type {never} */ (null);
var StableProgressStruggleCount = 0;

/**
 * @param {number} Timer
 * @param {number} S
 * @param {number} S2
 * @param {string} Item
 * @param {string} Background
 * @param {Character} Character
 * @param {Character | null} SecondCharacter
 * @param {string} Stage
 * @param {string} CurrentDialog
 * @param {string} CancelStage
 * @param {string} CancelCurrentDialog
 * @param {*} Behavior
 * @param {StableProgressType} ProgressOperation
 */
function StableGenericProgressStart(Timer, S, S2, Item, Background, Character, SecondCharacter, Stage, CurrentDialog, CancelStage, CancelCurrentDialog, Behavior, ProgressOperation) {
	DialogLeave();
	if (Timer < 1) Timer = 1;
	//Charakter
	StableProgressAuto = TimerRunInterval * (0.1333 + (S * 0.1333)) / (Timer * CheatFactor("DoubleItemSpeed", 0.5));
	StableProgressClick = TimerRunInterval * 2.5 / (Timer * CheatFactor("DoubleItemSpeed", 0.5));
	StableProgress = 0;
	if (S < 0) { StableProgressAuto = StableProgressAuto / 2; StableProgressClick = StableProgressClick / 2; }
	//Second Caracter
	StableSecondProgressAuto = TimerRunInterval * (0.1333 + (S2 * 0.1333)) / (Timer * CheatFactor("DoubleItemSpeed", 0.5));
	if (S2 < 0) { StableSecondProgressAuto = StableSecondProgressAuto / 2; }
	StableSecondProgress = 0;

	StableBackground = Background;
	StableProgressItem = Item;
	StableProgress = 0;
	StableProgressFinished = false;
	StableProgressCharacter = Character;
	StableProgressSecondCharacter = SecondCharacter;
	StableProgressEndStage = Stage;
	StableProgressEndDialog = CurrentDialog;
	StableProgressCancelStage = CancelStage;
	StableProgressCancelDialog = CancelCurrentDialog;
	StableProgressBehavior = Behavior;
	StableProgressStruggleCount = 0;
	StableProgressOperation = ProgressOperation;
}

function StableGenericDrawProgress() {
	if (StableProgress >= 0) {
		DrawButton(1750, 25, 225, 75, "Cancel", "White");
		StableProgress = StableProgress + StableProgressAuto;
		if (StableProgress < 0) StableProgress = 0;
		var StableGenericPlayerPosition = (1700 * StableProgress/100) + 50;

		StableSecondProgress = StableSecondProgress + StableSecondProgressAuto;
		if (StableSecondProgress < 0) StableSecondProgress = 0;
		var StableGenericSecondPosition = (1700 * StableSecondProgress/100) + 50;


		if (StableProgressSecondCharacter == null) {
			DrawRect(300, 25, 225, 225, "white");
			DrawImage(StableProgressItem, 302, 27);
			const opName = StableProgressOperation === "StruggleImpossible" ? InterfaceTextGet("StruggleImpossible") : TextGet(StableProgressOperation);
			DrawText(opName, 1000, 50, "White", "Black");
			DrawText(InterfaceTextGet((CommonIsMobile) ? "ProgressClick" : "ProgressKeys"), 1000, 150, "White", "Black");
			DrawRect(200, 300, 20, 675, "white");
			DrawRect(1800, 300, 20, 675, "white");
			DrawCharacter(Player, StableGenericPlayerPosition, 300, 0.7);
		} else {
			DrawText(InterfaceTextGet((CommonIsMobile) ? "ProgressClick" : "ProgressKeys"), 600, 25, "White", "Black");
			DrawRect(200, 200, 20, 800, "white");
			DrawRect(1800, 200, 20, 800, "white");
			DrawCharacter(Player, StableGenericPlayerPosition, 200, 0.4);
			DrawCharacter(StableProgressSecondCharacter, StableGenericSecondPosition, 600, 0.4);
		}
		if (StableProgress >= 100) {
			StableGenericFinished();
		} else if (StableSecondProgress >= 100) {
			StableGenericCancel();
		}
	}
}

function StableGenericFinished() {
	StableProgressFinished = true;
	StableGenericProgressEnd();
}

function StableGenericCancel() {
	StableProgressFinished = false;
	StableGenericProgressEnd();
}

function StableGenericProgressEnd() {
	StableProgress = -1;
	StableBackground = "HorseStable";
	CharacterSetCurrent(StableProgressCharacter);
	if (StableProgressFinished) {
		StableProgressCharacter.Stage = StableProgressEndStage;
		StableProgressCharacter.CurrentDialog = DialogFind(StableProgressCharacter, StableProgressEndDialog);
		StablePlayerTrainingBehavior += StableProgressBehavior;
	} else {
		StableProgressCharacter.Stage = StableProgressCancelStage;
		StableProgressCharacter.CurrentDialog = DialogFind(StableProgressCharacter, StableProgressCancelDialog);
		StablePlayerTrainingBehavior -= StableProgressBehavior;
	}
}

/** @type {KeyboardEventListener} */
function StableKeyDown(event) {
	if (event.repeat || CommonKey.GetModifiers(event)) return false;

	if (StableProgress >= 0 && (CommonKeyMove(event) === "West" || CommonKeyMove(event) === "East")) {
		StableGenericRun((StableProgressLastKeyPress == event.code));
		StableProgressLastKeyPress = event.code;
		return true;
	}
	return false;
}

/**
 *
 * @param {boolean} Reverse
 */
function StableGenericRun(Reverse) {
	if (StableProgressAuto >= 0)
		StableProgress = StableProgress + StableProgressClick * (Reverse ? -1 : 1);
	else
		StableProgress = StableProgress + StableProgressClick * (Reverse ? -1 : 1) + ((100 - StableProgress) / 50);
	if (StableProgress < 0) StableProgress = 0;
	StableProgressStruggleCount++;
	if ((StableProgressStruggleCount >= 50) && (StableProgressClick == 0)) StableProgressOperation = "StruggleImpossible";
}

////////////////////////////////////////////////////////////////////////////////////////////
//Help function & BadGirlClub
////////////////////////////////////////////////////////////////////////////////////////////

// Try to Hide the Dice for BadGirlsClub
function StableHideDice() {
	if (Math.random() < 0.25) {
		LogAdd("Caught", "BadGirl");
		PrisonMeetPoliceIntro("HorseStable");
	} else {
		CharacterSetCurrent(Player);
		Player.CurrentDialog = TextGet("SuccessHide");
		LogDelete("Stolen", "BadGirl");
		LogAdd("Hide", "BadGirl");
	}
}

/**
 * When the player starts a club card game
 * @returns {void} - Nothing
 */
function StableClubCardStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, ClubCardBuilderABDLDeck, () => { StableClubCardEnd(); });
}

/**
 * When the player ends a club card game
 * @returns {SafePromise<void>}
 */
async function StableClubCardEnd() {
	await CommonSetScreen("Room", "Stable");
	CharacterSetCurrent(StableTrainer);
	if (!CurrentCharacter) return;
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, MiniGameVictory ? "ClubCardVictory" : "ClubCardDefeat");
}

////////////////////////////////////////////////////////////////////////////////////////////
//Multiplayer
////////////////////////////////////////////////////////////////////////////////////////////
var StableActivityList = ["Stand", "Trot", "Gallop", "Passage", "Pirouette"];

/**
 * Runs the pony command from the online chat box
 * @param {string} Activity - The activity to validate
 * @returns {void} - Nothing
 */
function StableDoActivity(Activity) {

	// Make sur the source/player is a pony
	if (!LogQuery("Pony", "JoinedStable"))
		return ChatRoomSendLocal(TextGet("PonyNotJoin"), 10_000);

	// Make sure the activity is valid
	if (Activity != null) {
		Activity = Activity.trim();
		Activity = Activity.charAt(0).toUpperCase() + Activity.substring(1).toLowerCase();
	}

	// Difficulty of the exercise
	let StableDifficulty;
	switch (Activity) {
		case "Stand":
			StableDifficulty = 0;
			break;
		case "Trot":
			StableDifficulty = 2;
			break;
		case "Gallop":
			StableDifficulty = 4;
			break;
		case "Passage":
			StableDifficulty = 6;
			break;
		case "Pirouette":
			StableDifficulty = 8;
			break;
		default:
			return ChatRoomSendLocal(TextGet("PonyInvalidActivity"), 10_000);
	}

	//result 2d6 + Skill - Difficulty, min 0 max 10
	var StablePerformance = Math.floor(Math.random() * 6) + 1;
	StablePerformance += (Math.floor(Math.random() * 6)) + 1;
	StablePerformance += SkillGetLevel(Player, "Dressage");
	StablePerformance -= StableDifficulty;
	if (StablePerformance < 0) StablePerformance = 0;
	if (StablePerformance > 9) StablePerformance = 10;

	SkillProgress(Player, "Dressage", StablePerformance * 5);

	let Dict = new DictionaryBuilder()
		.sourceCharacter(Player)
		.text("StablePerformance", StablePerformance.toString())
		.textLookup("StableResult", "StableResult" + StablePerformance)
		.build();
	ServerSend("ChatRoomChat", { Content: ( "StableActivity" + Activity), Type: "Action", Dictionary: Dict });

}
