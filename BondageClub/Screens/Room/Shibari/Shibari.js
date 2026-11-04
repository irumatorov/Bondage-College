"use strict";
var ShibariBackground = "Shibari";
/** @type {NPCCharacter} */
var ShibariTeacher = /** @type {never} */ (null);
/** @type {Item[]} */
var ShibariTeacherAppearance = [];
var ShibariAllowTeacherItem = false;
/** @type {NPCCharacter} */
var ShibariStudent = /** @type {never} */ (null);
/** @type {null | Item[]} */
var ShibariPlayerAppearance = null;
var ShibariSubCommentDone = false;
var ShibariDomCommentDone = false;
var ShibariSurrenderDone = false;
var ShibariSpankDone = false;
/** @type {null | number} */
let ShibariTeacherReleaseTimer = null;
var ShibariRescueScenario = "";
var ShibariRescueScenarioList = ["JapaneseGirl", "RebelStudent", "SelfBondage", "HeadMistress"];
var ShibariTrainingPrice = 20;
var ShibariTrainingPriceList = [20, 40, 75, 125, 200, 300, 450, 600, 800, 1000];

/**
 * Checks if the player can restrain the Shibari dojo teacher.
 * @returns {boolean} - Returns TRUE if the player is able to restrain the teacher.
 */
function ShibariAllowTeacherBondage() { return (!ShibariAllowTeacherItem && ReputationGet("Dominant") >= 75); }
/**
 * Checks if the player can strip the Shibari dojo teacher.
 * @returns {boolean} - Returns TRUE if the player is able to strip the teacher.
 */
function ShibariAllowTeacherStrip() { return (ShibariAllowTeacherItem && !ShibariTeacher.IsRestrained() && (InventoryGet(ShibariTeacher, "Cloth") != null) && ShibariTeacher.CanTalk()); }
/**
 * Checks if the player can be restrained by the Shibari dojo teacher.
 * @returns {boolean} - Returns TRUE if the player can be restrained by the teacher.
 */
function ShibariAllowPlayerBondage() { return !Player.IsRestrained() && !ShibariTeacher.IsRestrained(); }
/**
 * Checks if the player can spank the Shibari dojo teacher.
 * @returns {boolean} - Returns TRUE if the player can spank the teacher.
 */
function ShibariAllowSpank() { return !!CurrentCharacter && (((CurrentCharacter.ID == ShibariTeacher.ID) ? ShibariTeacher.IsInverted() : ShibariStudent.IsInverted()) && Player.CanInteract()); }
/**
 * Checks if the given maid rescue scenario name is currently active in the shibari dojo.
 * @param {string} ScenarioName - Name of the scenario to check for.
 * @returns {boolean} - Returns TRUE if the given scenario is active.
 */
function ShibariIsRescueScenario(ScenarioName) { return (ShibariRescueScenario == ScenarioName); }
/**
 * Checks if the Shibari dojo teacher is restrained.
 * @returns {boolean} - Returns TRUE if the teacher is restrained.
 */
function ShibariIsTeacherRestrained() { return (ShibariTeacher.IsRestrained() || !ShibariTeacher.CanTalk()); }
/**
 * Checks if the player can be trained in a given skill type.
 * @param {SkillType} SkillType - Name of the skill to check for.
 * @returns {boolean} - Returns TRUE if the player can receive a training.
 */
function ShibariCanTrainSkill(SkillType) { return (SkillGetLevelReal(Player, SkillType) < 10); }
/**
 * Checks if the player can pay for a training.
 * @returns {boolean} - Returns TRUE if the player can pay for the requested training.
 */
function ShibariCanPayForTraining() { return (Player.Money >= ShibariTrainingPrice); }
/**
 * Checks if the player can pay for a training.
 * @returns {boolean} - Returns TRUE if the player can pay for the requested training.
 */
function ShibariCanTrain() { return (!Player.IsRestrained() && !LogQuery("Training", "Shibari")); }
/**
 * Checks if the player can pay for a training.
 * @returns {boolean} - Returns TRUE if the player can pay for the requested training.
 */
function ShibariCannotTrainDelay() { return (!Player.IsRestrained() && LogQuery("Training", "Shibari")); }
/**
 * Returns TRUE if the player and the current character can play Club Card
 * @returns {boolean} - Returns TRUE if both aren't restrained
 */
function ShibariCanPlayClubCard() { return !Player.IsRestrained() && !!CurrentCharacter && !CurrentCharacter.IsRestrained() && !Player.IsGagged() && !CurrentCharacter.IsGagged(); }

/**
 * Puts a character in a random bondage position.
 * @param {Character} C - Character to restrain.
 * @param {number} Level - Level of bondage, higher is more complex bondage
 * @returns {void} - Nothing
 */
function ShibariRandomBondage(C, Level) {

	// For NPCs, we give the items
	if (!C.IsPlayer()) {
		InventoryAdd(C, "HempRope", "ItemArms");
		InventoryAdd(C, "HempRope", "ItemLegs");
		InventoryAdd(C, "HempRope", "ItemFeet");
		InventoryAdd(C, "HempRopeHarness", "ItemTorso");
		InventoryAdd(C, "BambooGag", "ItemMouth");
	}

	// At a level of 0, we pick a random level, over zero, we apply restrains
	if (Level >= 0) {

		// Wears more item with higher levels
		if (Level >= 1) InventoryWear(C, "HempRope", "ItemArms", "Default", (Level - 1) * 3);
		if (Level >= 2) InventoryWear(C, "HempRope", "ItemLegs", "Default", (Level - 1) * 3);
		if (Level >= 2) InventoryWear(C, "HempRope", "ItemFeet", "Default", (Level - 1) * 3);
		if ((Level >= 3) && (InventoryGet(C, "Cloth") == null) && (InventoryGet(C, "ItemTorso") == null)) {
			const torsoItem = InventoryWear(C, "HempRopeHarness", "ItemTorso", "Default", (Level - 1) * 3);
			if (!torsoItem) return;
			if (Math.random() > 0.66) {
				TypedItemSetOptionByName(C, torsoItem, "Diamond");
			} else if (Math.random() > 0.5) {
				TypedItemSetOptionByName(C, torsoItem, "Harness");
			}
		}
		if (Level >= 4) InventoryWear(C, "BambooGag", "ItemMouth");

		// At 3 or more, there's a random chance of a more complicated bondage
		if (Level >= 3) {
			Level = Math.floor(Math.random() * 4);
			if (Level == 1) {
				TypedItemSetOptionByName(C, "ItemFeet", "Suspension");
			} else if (Level == 2) {
				TypedItemSetOptionByName(C, "ItemArms", "Hogtied");
			} else if (Level == 3) {
				const armsItem = InventoryGet(C, "ItemArms");
				if (!armsItem) return;
				TypedItemSetOptionByName(C, armsItem, "SuspensionHogtied");
				const height = 0.67 * Math.random();
				armsItem.Property ??= {};
				armsItem.Property.OverrideHeight = {
					Height: height * (Pose.find(p => p.Name == "Hogtied")?.OverrideHeight?.Height ?? 1),
					HeightRatioProportion: height,
					Priority: 0,
				};
			}
		}
		CharacterRefresh(C);
	}
}

/**
 * Loads the shibari dojo and its two characters.
 * @type {ScreenLoadHandler}
 */
async function ShibariLoad() {

	// Default load
	if (ShibariPlayerAppearance == null) ShibariPlayerAppearance = Player.Appearance.slice();
	if (ShibariTeacher == null) {
		ShibariTeacher = CharacterLoadNPC("NPC_Shibari_Teacher");
		ShibariTeacher.AllowItem = ShibariAllowTeacherItem;
		InventoryWear(ShibariTeacher, CommonGetRandomItemFromList(["ChineseDress1", "ChineseDress2"]), "Cloth");
		InventoryRemove(ShibariTeacher, "ClothLower");
		ShibariTeacherAppearance = ShibariTeacher.Appearance.slice();
		ShibariStudent = CharacterLoadNPC("NPC_Shibari_Student");
		CharacterNaked(ShibariStudent);
		ShibariRandomBondage(ShibariStudent, 4);
	}

	// Rescue mission load
	if ((MaidQuartersCurrentRescue == "ShibariDojo") && !MaidQuartersCurrentRescueStarted) {
		MaidQuartersCurrentRescueStarted = true;
		CharacterNaked(ShibariStudent);
		ShibariStudent.Stage = "MaidRescue";
		CharacterNaked(ShibariTeacher);
		ShibariTeacher.Stage = "MaidRescue";
		ShibariStartTeacherBondage();
		ShibariRescueScenario = CommonRandomItemFromList(ShibariRescueScenario, ShibariRescueScenarioList);
		ShibariRandomBondage(ShibariTeacher, 4);
		ShibariRandomBondage(ShibariStudent, 4);
	}

}

/**
 * Runs and draws the shibari dojo, with its 3 characters
 * @returns {void} - Nothing
 */
function ShibariRun() {
	DrawCharacter(Player, 250, 0, 1);
	DrawCharacter(ShibariTeacher, 750, 0, 1);
	DrawCharacter(ShibariStudent, 1250, 0, 1);
	if (Player.CanWalk()) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
	if (Player.CanChangeOwnClothes()) DrawButton(1885, 265, 90, 90, "", "White", "Icons/DressReset.png");
	if (Player.CanChangeOwnClothes()) DrawButton(1885, 385, 90, 90, "", "White", "Icons/Naked.png");
}

/**
 * Handles clicks in the shibari dojo
 * @returns {void} - Nothing
 */
function ShibariClick() {
	if (MouseIn(250, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (MouseIn(750, 0, 500, 1000)) CharacterSetCurrent(ShibariTeacher);
	if (MouseIn(1250, 0, 500, 1000)) CharacterSetCurrent(ShibariStudent);
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
	if (MouseIn(1885, 265, 90, 90) && Player.CanChangeOwnClothes() && ShibariPlayerAppearance) CharacterDress(Player, ShibariPlayerAppearance);
	if (MouseIn(1885, 385, 90, 90) && Player.CanChangeOwnClothes()) CharacterNaked(Player);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk() && ShibariPlayerAppearance) {
		CharacterDress(Player, ShibariPlayerAppearance);
		ShibariPlayerAppearance = null;
		CommonSetScreen("Room", "MainHall");
	}
}

/**
 * Triggered when the player is allowed to restrain the teacher.
 * @returns {void} - Nothing
 */
function ShibariStartTeacherBondage() {
	ShibariAllowTeacherItem = true;
	ShibariTeacher.AllowItem = true;
}

/**
 * Triggered when the player gets restrained by the teacher, the teacher will not release the player for a minute after this.
 * @param {number} Level
 * @returns {void} - Nothing
 */
function ShibariRestrainPlayer(Level) {
	ShibariRandomBondage(Player, Level);
	ShibariTeacherReleaseTimer = CommonTime() + MS_PER_MIN;
}

/**
 * Triggered on the first time the player says something submissive, it lowers the dominant score.
 * @returns {void} - Nothing
 */
function ShibariSubComment() {
	if (!ShibariSubCommentDone) {
		ReputationProgress("Dominant", -2);
		ShibariSubCommentDone = true;
	}
}

/**
 * Triggered on the first time the player says something dominant, it raises the dominant score.
 * @returns {void} - Nothing
 */
function ShibariDomComment() {
	if (!ShibariDomCommentDone) {
		ReputationProgress("Dominant", 2);
		ShibariDomCommentDone = true;
	}
}

/**
 * Triggered on the first time the player surrenders to the teacher, it lowers the dominant score.
 * @returns {void} - Nothing
 */
function ShibariSurrenderToTeacher() {
	if (ShibariTeacherReleaseTimer !== null && CommonTime() >= ShibariTeacherReleaseTimer) {
		CharacterRelease(Player);
		if (InventoryGet(Player, "Cloth") == null) InventoryRemove(Player, "ItemTorso");
		if (!ShibariSurrenderDone) {
			ReputationProgress("Dominant", -2);
			ShibariSurrenderDone = true;
		}
		ShibariTeacher.Stage = "0";
		ShibariTeacher.CurrentDialog = DialogFind(ShibariTeacher, "TeacherRelease");
	}
}

/**
 * Triggered on the first time the player spanks the submissive or the teacher, it raises the dominant score.
 * @returns {void} - Nothing
 */
function ShibariSpank() {
	if (!ShibariSpankDone) {
		ReputationProgress("Dominant", 2);
		ShibariSpankDone = true;
	}
}

/**
 * Triggered when the player rescues the teacher and completes the mission for the maid rescue mission.
 * @returns {void} - Nothing
 */
function ShibariCompleteRescue() {
	ShibariAllowTeacherItem = false;
	ShibariTeacher.AllowItem = false;
	CharacterRelease(ShibariTeacher);
	CharacterDress(ShibariTeacher, ShibariTeacherAppearance);
	MaidQuartersCurrentRescueCompleted = true;
	ShibariStudent.Stage = "0";
}

/**
 * Calculates the training price, it is linked to the current skill level of the player
 * @param {SkillType} SkillType - Name of the skill to calculate the price of
 * @returns {void} - Nothing
 */
function ShibariCalculateTrainingPrice(SkillType) {
	ShibariTrainingPrice = ShibariTrainingPriceList[SkillGetLevelReal(Player, SkillType)];
	ShibariTeacher.CurrentDialog = ShibariTeacher.CurrentDialog.replace("MoneyAmount", CharacterMoneyFormat(-ShibariTrainingPrice));
}

/**
 * Triggered when the player pays to get trained in a given skill.
 * @param {SkillType} SkillType - Name of the skill being bought
 * @returns {void} - Nothing
 */
function ShibariPayForTraining(SkillType) {
	if (Player.Money - ShibariTrainingPrice < 0) return;

	// Raises the actual progress by 25 to 50%, can gain a level
	let L = SkillGetLevelReal(Player, SkillType);
	let P = SkillGetProgress(Player, SkillType) + 250 + Math.round(Math.random() * 250);
	if (P >= SkillProgressMax) {
		L++;
		P = 0;
	}

	// Updates the player skill and money
	SkillChange(Player, SkillType, L, P);
	CharacterChangeMoney(Player, ShibariTrainingPrice * -1);

	// The next training will be available in 1 hour
	LogAdd("Training", "Shibari", CurrentTime + 60 * 60 * 1000);

}

/**
 * When the player starts a club card game against the shibari student
 * @returns {void} - Nothing
 */
function ShibariClubCardStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, ClubCardBuilderDominantDeck, () => { ShibariClubCardEnd(); });
}

/**
 * When the player ends a club card game against the shibari student
 * @returns {SafePromise<void>}
 */
async function ShibariClubCardEnd() {
	if (!CurrentCharacter) return;
	await CommonSetScreen("Room", "Shibari");
	CharacterSetCurrent(ShibariStudent);
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, MiniGameVictory ? "ClubCardVictory" : "ClubCardDefeat");
}
