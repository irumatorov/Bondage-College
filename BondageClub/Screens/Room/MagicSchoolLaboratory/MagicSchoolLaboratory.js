"use strict";
var MagicSchoolLaboratoryBackground = "MagicSchoolLaboratory";
/** @type {NPCCharacter} */
var MagicSchoolLaboratoryTeacher = /** @type {never} */ (null);
/** @type {null | NPCCharacter} */
var MagicSchoolLaboratoryStudent = null;
var MagicSchoolLaboratoryBattleWage = "";
/** @type {MagicSchoolSpell | undefined} */
var MagicSchoolLaboratoryLastSpell;
var MagicSchoolLaboratorySpellCount = 0;

/**
 * Dresses a character C as a witch, the colors and clothes can changes based on the house
 * @param {Character} C - The character that will wear the clothes
 * @param {"" | "Maiestas" | "Vincula" | "Amplector" | "Corporis"} House - The house name
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryPrepareNPC(C, House) {
	if (!C.IsPlayer()) {
		C.Stage = "0";
		C.AllowItem = false;
		C.House = House;
	}
	/** @type {BCColor} */
	let DarkColor = "#555555";
	/** @type {BCColor} */
	let LightColor = "#777777";
	if (House == "Maiestas") { DarkColor = "#DFAC13"; LightColor = "#FFCC33"; }
	if (House == "Vincula") { DarkColor = "#447744"; LightColor = "#559955"; }
	if (House == "Amplector") { DarkColor = "#335577"; LightColor = "#4477AA"; }
	if (House == "Corporis") { DarkColor = "#BB4422"; LightColor = "#EE6022"; }
	InventoryRemove(C, "HairAccessory1");
	InventoryRemove(C, "HairAccessory2");
	InventoryRemove(C, "HairAccessory3");
	InventoryRemove(C, "ClothAccessory");
	InventoryRemove(C, "Necklace");
	InventoryRemove(C, "Gloves");
	InventoryRemove(C, "Socks");
	let hands = InventoryGet(C, "ItemHandheld");
	if (hands && hands.Asset.Name !== "RainbowWand") {
		const itemMap = /** @type {const} */ ({
			"": undefined,
			"Maiestas": "Whip",
			"Vincula": "Belt",
			"Amplector": "Feather",
			"Corporis": "CandleWax",
		});
		const item = itemMap[House] ?? "Broom";
		InventoryWear(C, item, "ItemHandheld");
	}
	InventoryWear(C, "Bra1", "Bra", LightColor);
	InventoryWear(C, "Panties1", "Panties", LightColor);
	InventoryWear(C, "LongSkirt1", "ClothLower", LightColor);
	InventoryWear(C, "GrandMage", "Cloth", DarkColor);
	InventoryWear(C, "ThighHighLatexHeels", "Shoes", DarkColor);
	InventoryWear(C, "WitchHat1", "Hat", LightColor);
	if (House == "Vincula") {
		InventoryWear(C, "NecklaceBallGag", "Necklace");
		InventoryWear(C, "Bodice1", "Cloth", DarkColor);
	}
	if (House == "Corporis") {
		InventoryWear(C, "LatexAnkleShoes", "Shoes", DarkColor);
		InventoryWear(C, "BlackHeart", "Necklace");
		InventoryWear(C, "PleatedSkirt", "ClothLower", DarkColor);
	}
	if (House == "Amplector") {
		InventoryWear(C, "ElegantHeartNecklace", "Necklace");
		InventoryWear(C, "Sandals", "Shoes", DarkColor);
	}
	if (House == "Maiestas") {
		InventoryWear(C, "Tiara1", "Hat", "#AAAAAA");
		InventoryWear(C, "Necklace4", "Necklace", "#999999");
		InventoryWear(C, "Gloves2", "Gloves", "#AAAAAA");
		InventoryWear(C, "AnkleStrapShoes", "Shoes", DarkColor);
	}

}

/**
 * Loads the magic school laboratory and the teacher
 * @type {ScreenLoadHandler}
 */
async function MagicSchoolLaboratoryLoad() {
	MagicPuzzleBackground = MagicSchoolLaboratoryBackground;
	if (!MagicSchoolLaboratoryTeacher) {
		MagicSchoolLaboratoryTeacher = CharacterLoadNPC("NPC_MagicSchoolLaboratory_Teacher");
		MagicSchoolLaboratoryPrepareNPC(MagicSchoolLaboratoryTeacher, "");
	}
}

/**
 * Runs the room
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryRun() {
	DrawCharacter(Player, 500, 0, 1);
	DrawCharacter(MagicSchoolLaboratoryTeacher, 1000, 0, 1);
	DrawButton(1885, 25, 90, 90, "", Player.CanWalk() ? "White" : "Pink", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
	if (!MagicSchoolLaboratoryInHouse("")) DrawButton(1885, 265, 90, 90, "", "White", "Icons/Wardrobe.png", TextGet("Dress"));
	if (!MagicSchoolLaboratoryInHouse("")) DrawButton(1885, 385, 90, 90, "", "White", "Icons/Explore.png", TextGet("Explore"));
	if (!MagicSchoolLaboratoryInHouse("")) DrawButton(1885, 505, 90, 90, "", "White", "Icons/Castle.png", TextGet("ExploreAround"));
	if (!MagicSchoolLaboratoryInHouse("")) DrawButton(1885, 625, 90, 90, "", "White", "Icons/Kidnap.png", TextGet("Escape"));
}

/**
 * Handles the click events.  Called from CommonClick()
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryClick() {
	if (MouseIn(1000, 0, 500, 1000)) CharacterSetCurrent(MagicSchoolLaboratoryTeacher);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "MainHall");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
	if (MouseIn(1885, 265, 90, 90) && !MagicSchoolLaboratoryInHouse("")) MagicSchoolLaboratoryDressHouse();
	if (MouseIn(1885, 385, 90, 90) && !MagicSchoolLaboratoryInHouse("")) MagicSchoolLaboratoryFindStudent();
	if (MouseIn(1885, 505, 90, 90) && !MagicSchoolLaboratoryInHouse("")) CommonSetScreen("Room", "MagicSchoolFindsAround");
	if (MouseIn(1885, 625, 90, 90) && !MagicSchoolLaboratoryInHouse("")) CommonSetScreen("Room", "MagicSchoolEscape");
}

/**
 * When the user wants to practice a spell
 * @param {number} SpellNumber - The spell number (0 to strip, etc.)
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratorySpellPractice(SpellNumber) {
	MagicPuzzleSpell = SpellNumber;
	MagicPuzzleAutoExit = false;
	MiniGameStart("MagicPuzzle", 0, () => { MagicSchoolLaboratorySpellPracticeEnd(); });
}

/**
 * When the magic spell practice puzzle ends
 * @returns {SafePromise<void>}
 */
async function MagicSchoolLaboratorySpellPracticeEnd() {
	await CommonSetScreen("Room", "MagicSchoolLaboratory");
	CharacterSetCurrent(MagicSchoolLaboratoryTeacher);
	MagicSchoolLaboratoryTeacher.CurrentDialog = DialogFind(MagicSchoolLaboratoryTeacher, MiniGameVictory ? "PracticeSuccess" : "PracticeFail");
}

/**
 * Check if someone is a member of a magic house or not
 * @param {"" | "Maiestas" | "Vincula" | "Amplector" | "Corporis"} House - The house name
 * @returns {boolean} - TRUE if a member, FALSE if not
 */
function MagicSchoolLaboratoryInHouse(House) {
	if (House == "") return ((ReputationGet("HouseMaiestas") <= 0) && (ReputationGet("HouseVincula") <= 0) && (ReputationGet("HouseAmplector") <= 0) && (ReputationGet("HouseCorporis") <= 0));
	return (ReputationGet(`House${House}`) > 0);
}

/**
 * Joins a specific magic house, sets the reputation to 1 and clear all other reputations
 * @param {"" | MagicSchoolHouse} House - The house name
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryJoinHouse(House) {
	DialogSetReputation("HouseMaiestas", 0);
	DialogSetReputation("HouseVincula", 0);
	DialogSetReputation("HouseAmplector", 0);
	DialogSetReputation("HouseCorporis", 0);
	LogDelete("Mastery", "MagicSchool");
	if ((Player.Game != null) && (Player.Game.MagicBattle != null)) {
		delete Player.Game.MagicBattle;
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	}
	if (House != "") {
		DialogSetReputation(`House${House}`, 1);
		MagicSchoolLaboratoryPrepareNPC(Player, House);
	}
}

/**
 * Dresses the player as it's current magic school house
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryDressHouse() {
	/** @type {"" | MagicSchoolHouse} */
	let House = "";
	if (ReputationGet("HouseMaiestas") > 0) House = "Maiestas";
	if (ReputationGet("HouseVincula") > 0) House = "Vincula";
	if (ReputationGet("HouseAmplector") > 0) House = "Amplector";
	if (ReputationGet("HouseCorporis") > 0) House = "Corporis";
	if (House != "") MagicSchoolLaboratoryPrepareNPC(Player, House);
}

/**
 * Check if a NPC is a member of a magic house or not
 * @param {MagicSchoolHouse} House - The house name
 * @returns {boolean} - TRUE if a member, FALSE if not
 */
function MagicSchoolLaboratoryFromHouse(House) {
	if ((CurrentCharacter == null) || (CurrentCharacter.House == null) || (CurrentCharacter.House == "")) return false;
	return (House == CurrentCharacter.House);
}

/**
 * Check if a NPC is a member of the player's house
 * @param {MagicSchoolHouse} House - The house name
 * @returns {boolean} - TRUE if from same house, FALSE if not
 * @deprecated
 */
function MagicSchoolLaboratoryFromSameHouse(House) {
	if ((CurrentCharacter == null) || (CurrentCharacter.House == null) || (CurrentCharacter.House == "")) return false;
	if ((House == "Maiestas") && (ReputationGet("HouseMaiestas") > 0)) return true;
	if ((House == "Vincula") && (ReputationGet("HouseVincula") > 0)) return true;
	if ((House == "Amplector") && (ReputationGet("HouseAmplector") > 0)) return true;
	if ((House == "Corporis") && (ReputationGet("HouseCorporis") > 0)) return true;
	return false;
}

/**
 * Check if a NPC is a member of the player's rival house
 * @param {MagicSchoolHouse} House - The house name
 * @returns {boolean} - TRUE if a rival, FALSE if not
 */
function MagicSchoolLaboratoryFromRivalHouse(House) {
	if ((CurrentCharacter == null) || (CurrentCharacter.House == null) || (CurrentCharacter.House == "")) return false;
	if (House != CurrentCharacter.House) return false;
	if ((CurrentCharacter.House == "Maiestas") && (ReputationGet("HouseVincula") > 0)) return true;
	if ((CurrentCharacter.House == "Vincula") && (ReputationGet("HouseMaiestas") > 0)) return true;
	if ((CurrentCharacter.House == "Amplector") && (ReputationGet("HouseCorporis") > 0)) return true;
	if ((CurrentCharacter.House == "Corporis") && (ReputationGet("HouseAmplector") > 0)) return true;
	return false;
}

/**
 * Starts a practice battle against the school teacher
 * @param {number} Difficulty - The difficulty level from 0 to 10 (hardest)
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryMagicBattleStart(Difficulty) {
	MagicBattleStart(MagicSchoolLaboratoryTeacher, Difficulty, MagicSchoolLaboratoryBackground, () => { MagicSchoolLaboratoryMagicBattleEnd(); });
}

/**
 * When the magic battle practice ends
 * @returns {SafePromise<void>} - Nothing
 */
async function MagicSchoolLaboratoryMagicBattleEnd() {
	await CommonSetScreen("Room", "MagicSchoolLaboratory");
	CharacterAppearanceRestore(Player, MagicBattlePlayerAppearance);
	CharacterRefresh(Player);
	CharacterAppearanceRestore(MagicSchoolLaboratoryTeacher, MagicBattleOpponentAppearance);
	CharacterRefresh(MagicSchoolLaboratoryTeacher);
	CharacterSetCurrent(MagicSchoolLaboratoryTeacher);
	MagicSchoolLaboratoryTeacher.CurrentDialog = DialogFind(MagicSchoolLaboratoryTeacher, MiniGameVictory ? "BattleSuccess" : "BattleFail");
}

/**
 * Generates a random student from the same house as the player (sister)
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryBuildSister() {
	/** @type {MagicSchoolHouse} */
	let NPCHouse = "Maiestas";
	if (ReputationGet("HouseVincula") > 0) NPCHouse = "Vincula";
	if (ReputationGet("HouseAmplector") > 0) NPCHouse = "Amplector";
	if (ReputationGet("HouseCorporis") > 0) NPCHouse = "Corporis";
	if (MagicSchoolLaboratoryStudent) {
		CharacterDelete(MagicSchoolLaboratoryStudent);
		MagicSchoolLaboratoryStudent = null;
	}

	MagicSchoolLaboratoryStudent = CharacterLoadNPC("NPC_MagicSchoolLaboratory_Sister");
	CharacterRelease(MagicSchoolLaboratoryStudent);
	MagicSchoolLaboratoryPrepareNPC(MagicSchoolLaboratoryStudent, NPCHouse);
	CharacterSetCurrent(MagicSchoolLaboratoryStudent);
}

/**
 * Generates a random student that will meet the player
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryFindStudent() {

	// 20% odds of spawning a friendly student from the same house
	if (Math.random() > 0.80) return MagicSchoolLaboratoryBuildSister();

	// Builds a list of all possible houses for that student, based on the player house
	/** @type {MagicSchoolHouse[]} */
	let Houses = [];
	if (ReputationGet("HouseMaiestas") > 0) {
		Houses.push("Vincula");
		Houses.push("Vincula");
		Houses.push("Amplector");
		Houses.push("Corporis");
		if ((ReputationGet("HouseMaiestas") >= 100) && !LogQuery("Mastery", "MagicSchool") && InventoryAvailable(Player, "RainbowWand", "ItemHandheld")) Houses.push("Maiestas");
	}
	if (ReputationGet("HouseVincula") > 0) {
		Houses.push("Maiestas");
		Houses.push("Maiestas");
		Houses.push("Amplector");
		Houses.push("Corporis");
		if ((ReputationGet("HouseVincula") >= 100) && !LogQuery("Mastery", "MagicSchool") && InventoryAvailable(Player, "RainbowWand", "ItemHandheld")) Houses.push("Vincula");
	}
	if (ReputationGet("HouseAmplector") > 0) {
		Houses.push("Maiestas");
		Houses.push("Vincula");
		Houses.push("Corporis");
		Houses.push("Corporis");
		if ((ReputationGet("HouseAmplector") >= 100) && !LogQuery("Mastery", "MagicSchool") && InventoryAvailable(Player, "RainbowWand", "ItemHandheld")) Houses.push("Amplector");
	}
	if (ReputationGet("HouseCorporis") > 0) {
		Houses.push("Maiestas");
		Houses.push("Vincula");
		Houses.push("Amplector");
		Houses.push("Amplector");
		if ((ReputationGet("HouseCorporis") >= 100) && !LogQuery("Mastery", "MagicSchool") && InventoryAvailable(Player, "RainbowWand", "ItemHandheld")) Houses.push("Corporis");
	}

	// Creates the student NPC and gives her a house
	let NPCHouse = CommonGetRandomItemFromList(Houses);
	let NPCType = (ReputationGet(`House${NPCHouse}`) >= 100) ? "Master" : "Student";

	if (MagicSchoolLaboratoryStudent) {
		CharacterDelete(MagicSchoolLaboratoryStudent);
		MagicSchoolLaboratoryStudent = null;
	}

	MagicSchoolLaboratoryStudent = CharacterLoadNPC("NPC_MagicSchoolLaboratory_" + NPCType);
	CharacterRelease(MagicSchoolLaboratoryStudent);
	MagicSchoolLaboratoryPrepareNPC(MagicSchoolLaboratoryStudent, NPCHouse);

	// At 50 reputation or more, can randomly span the rainbow wand (15% odds)
	if ((Math.random() > 0.85) && !InventoryAvailable(Player, "RainbowWand", "ItemHandheld") && ((ReputationGet("HouseMaiestas") >= 50) || (ReputationGet("HouseVincula") >= 50) || (ReputationGet("HouseAmplector") >= 50) || (ReputationGet("HouseCorporis") >= 50))) {
		InventoryWear(MagicSchoolLaboratoryStudent, "RainbowWand", "ItemHandheld");
		CharacterRefresh(MagicSchoolLaboratoryStudent);
	}
	CharacterSetCurrent(MagicSchoolLaboratoryStudent);

}

/**
 * When a fight begins between the player and a student
 * @param {string} Type - The type of battle to do (Normal, Wage or Honor)
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryBattleStudentStart(Type) {
	if (!MagicSchoolLaboratoryStudent) return;
	MagicSchoolLaboratoryBattleWage = Type;
	if (Type == "Wage25") CharacterChangeMoney(Player, -25);
	let Difficulty = 2;
	if (Type == "Wage25") Difficulty = 4;
	if (Type == "Honor") Difficulty = 6;
	if (Type == "RainbowWand") Difficulty = 8;
	MagicBattleStart(MagicSchoolLaboratoryStudent, Difficulty, MagicSchoolLaboratoryBackground, () => { MagicSchoolLaboratoryBattleStudentEnd(); });
}

/**
 * When a student battle ends, we release the winner, change reputation or give some money based on the wage
 * @returns {SafePromise<void>} - Nothing
 */
async function MagicSchoolLaboratoryBattleStudentEnd() {
	await CommonSetScreen("Room", "MagicSchoolLaboratory");
	if (!MagicSchoolLaboratoryStudent) return;
	CharacterSetCurrent(MagicSchoolLaboratoryStudent);
	if (MiniGameVictory) {
		MagicSchoolLaboratoryStudent.AllowItem = true;
		CharacterAppearanceRestore(Player, MagicBattlePlayerAppearance);
		CharacterRefresh(Player);
		if (MagicSchoolLaboratoryBattleWage == "Wage25") CharacterChangeMoney(Player, 50);
		if (MagicSchoolLaboratoryBattleWage == "RainbowWand") {
			InventoryAdd(Player, "RainbowWand", "ItemHandheld");
			InventoryWear(Player, "RainbowWand", "ItemHandheld");
			CharacterRefresh(Player);
		}
		let RepGain = (MagicSchoolLaboratoryBattleWage == "Honor") ? 6 : 3;
		if (ReputationGet("HouseMaiestas") > 0) DialogChangeReputation("HouseMaiestas", RepGain);
		if (ReputationGet("HouseVincula") > 0) DialogChangeReputation("HouseVincula", RepGain);
		if (ReputationGet("HouseAmplector") > 0) DialogChangeReputation("HouseAmplector", RepGain);
		if (ReputationGet("HouseCorporis") > 0) DialogChangeReputation("HouseCorporis", RepGain);
		MagicSchoolLaboratoryStudent.Stage = "100";
		if (MagicSchoolLaboratoryBattleWage == "RainbowWand")
			MagicSchoolLaboratoryStudent.CurrentDialog = DialogFind(MagicSchoolLaboratoryStudent, "BattleSuccessRainbowWand");
		else
			MagicSchoolLaboratoryStudent.CurrentDialog = DialogFind(MagicSchoolLaboratoryStudent, "BattleSuccess" + MagicSchoolLaboratoryStudent.House);
	} else {
		CharacterAppearanceRestore(MagicSchoolLaboratoryStudent, MagicBattleOpponentAppearance);
		CharacterRefresh(MagicSchoolLaboratoryStudent);
		if ((MagicSchoolLaboratoryBattleWage == "Honor") || (MagicSchoolLaboratoryBattleWage == "RainbowWand")) {
			let RepChange = (MagicSchoolLaboratoryBattleWage == "Honor") ? -2 : -5;
			if (ReputationGet("HouseMaiestas") >= 3) DialogChangeReputation("HouseMaiestas", RepChange);
			if (ReputationGet("HouseVincula") >= 3) DialogChangeReputation("HouseVincula", RepChange);
			if (ReputationGet("HouseAmplector") >= 3) DialogChangeReputation("HouseAmplector", RepChange);
			if (ReputationGet("HouseCorporis") >= 3) DialogChangeReputation("HouseCorporis", RepChange);
		}
		MagicSchoolLaboratorySpellCount = 0;
		MagicSchoolLaboratoryStudent.Stage = "200";
		if (MagicSchoolLaboratoryBattleWage == "RainbowWand")
			MagicSchoolLaboratoryStudent.CurrentDialog = DialogFind(MagicSchoolLaboratoryStudent, "BattleFailRainbowWand");
		else
			MagicSchoolLaboratoryStudent.CurrentDialog = DialogFind(MagicSchoolLaboratoryStudent, "BattleFail" + MagicSchoolLaboratoryStudent.House);
	}
}

/**
 * Sets an emote for the student when there's an activity
 * @param {ExpressionNameMap["Blush"]} Blush
 * @param {ExpressionNameMap["Eyes"]} Eyes
 * @returns {void}
 */
function MagicSchoolLaboratoryStudentEmote(Blush, Eyes) {
	if (!MagicSchoolLaboratoryStudent) return;
	CharacterSetFacialExpression(MagicSchoolLaboratoryStudent, "Blush", Blush, 5);
	CharacterSetFacialExpression(MagicSchoolLaboratoryStudent, "Eyes", Eyes, 5);
}

/**
 * Checks, if the player can bring the student to her private room
 * @returns {boolean} - Returns true, if the player can
 */
function MagicSchoolLaboratoryCanTransferToRoom() { return PrivateHasEmptySlot(); }

/**
 * Triggered when the player transfers the student to her private room
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryTransferToRoom() {
	if (!MagicSchoolLaboratoryStudent) return;
	DialogLeave();
	CommonSetScreen("Room", "Private");
	PrivateAddCharacter(MagicSchoolLaboratoryStudent, MagicSchoolLaboratoryStudent.House);
}

/**
 * Triggered when the player won and ungag the student to talk with her
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryUngagStudent() {
	if (!MagicSchoolLaboratoryStudent) return;
	InventoryRemove(MagicSchoolLaboratoryStudent, "ItemMouth");
	InventoryRemove(MagicSchoolLaboratoryStudent, "ItemMouth2");
	InventoryRemove(MagicSchoolLaboratoryStudent, "ItemMouth3");
}

/**
 * Triggered when the player lost and get ungagged by the student, can affect reputation
 * @param {number} RepChange
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryUngagPlayer(RepChange) {
	DialogChangeReputation("Dominant", RepChange);
	InventoryRemove(Player, "ItemMouth");
	InventoryRemove(Player, "ItemMouth2");
	InventoryRemove(Player, "ItemMouth3");
}

/**
 * Triggered when the player lost and get untied by the student, can affect reputation
 * @param {number} RepChange
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryReleasePlayer(RepChange) {
	DialogChangeReputation("Dominant", RepChange);
	CharacterRelease(Player);
}

/**
 * @param {NPCCharacter} npc
 */
function MagicSchoolLaboratoryGetAllSpellsForNpc(npc) {
	/** @type {MagicSchoolSpell[]} */
	const allCommonSpells = ["Hogtie", "ReleaseHogtie", "SwitchRope", "SwitchChain", "Fail", "Tight"];
	switch (npc.House) {
		case "Maiestas":
			allCommonSpells.push("Arousal");
			break;
		case "Vincula":
			allCommonSpells.push("FlyingHogtie");
			break;
		case "Amplector":
			allCommonSpells.push("Tickle");
			break;
		case "Corporis":
			allCommonSpells.push("Pain");
			break;
	}
	return allCommonSpells;
}

/**
 * @param {NPCCharacter} npc
 * @param {MagicSchoolSpell | undefined} lastSpell
 */
function MagicSchoolLaboratoryApplyRandomSpellEffects(npc, lastSpell) {

	const allSpells = MagicSchoolLaboratoryGetAllSpellsForNpc(npc);

	// Finds a valid spell based on the player current predicament.  Some spells can only be done by specific houses.
	/** @type {MagicSchoolSpell | undefined} */
	let Spell;
	while (!Spell) {
		Spell = CommonRandomItemFromList(lastSpell, allSpells);
		if ((Spell == "Hogtie") && Player.PoseMapping.BodyFull === "Hogtied") Spell = undefined;
		if ((Spell == "ReleaseHogtie") && Player.PoseMapping.BodyFull !== "Hogtied") Spell = undefined;
		if ((Spell == "FlyingHogtie") && Player.PoseMapping.BodyFull !== "Hogtied") Spell = undefined;
		if (Spell == "SwitchRope" && (InventoryIsWorn(Player, "ItemArms", "HempRope") || Player.PoseMapping.BodyFull === "Hogtied")) Spell = undefined;
		if (Spell == "SwitchChain" && (InventoryIsWorn(Player, "ItemArms", "Chains") || Player.PoseMapping.BodyFull === "Hogtied")) Spell = undefined;
	}

	// Applies the spell effect
	if (Spell == "Arousal") { CharacterSetFacialExpression(Player, "Blush", "High", 8); CharacterSetFacialExpression(Player, "Eyes", "Horny", 8); }
	if (Spell == "Tickle") { CharacterSetFacialExpression(Player, "Blush", "Medium", 8); CharacterSetFacialExpression(Player, "Eyes", "Surprised", 8); }
	if (Spell == "Pain") { CharacterSetFacialExpression(Player, "Blush", "Medium", 8); CharacterSetFacialExpression(Player, "Eyes", "Closed", 8); }
	if (Spell == "Tight") { CharacterSetFacialExpression(Player, "Blush", "Low", 8); CharacterSetFacialExpression(Player, "Eyes", "Closed", 8); }
	if (Spell == "Fail") { CharacterSetFacialExpression(npc, "Blush", "Medium", 8); CharacterSetFacialExpression(npc, "Eyes", "Angry", 8); }
	if (Spell == "FlyingHogtie") {
		const item = InventoryGet(Player, "ItemArms");
		if (!item) return;
		TypedItemSetOptionByName(Player, item, "SuspensionHogtied");
		const Height = 0.67 * Math.random();
		item.Property.OverrideHeight = {
			Height: Height * (Pose.find(p => p.Name === "Hogtied")?.OverrideHeight?.Height ?? 1),
			HeightRatioProportion: Height,
			Priority: 0,
		};
		CharacterSetFacialExpression(Player, "Blush", "High", 8);
		CharacterSetFacialExpression(Player, "Eyes", "Surprised", 8);
	}
	if (Spell == "Hogtie") {
		TypedItemSetOptionByName(Player, "ItemArms", "Hogtied");
	}
	if (Spell == "ReleaseHogtie") {
		TypedItemSetOptionByName(Player, "ItemArms", "Basic");
	}
	if (Spell == "SwitchRope") {
		if (InventoryGet(Player, "ItemLegs") != null) InventoryWear(Player, "HempRope", "ItemLegs");
		if (InventoryGet(Player, "ItemFeet") != null) InventoryWear(Player, "HempRope", "ItemFeet");
		if (InventoryGet(Player, "ItemTorso") != null) InventoryWear(Player, "HempRopeHarness", "ItemTorso");
		if (InventoryGet(Player, "ItemArms") != null) InventoryWear(Player, "HempRope", "ItemArms");
	}
	if (Spell == "SwitchChain") {
		if (InventoryGet(Player, "ItemLegs") != null) InventoryWear(Player, "Chains", "ItemLegs");
		if (InventoryGet(Player, "ItemFeet") != null) InventoryWear(Player, "Chains", "ItemFeet");
		if (InventoryGet(Player, "ItemTorso") != null) InventoryWear(Player, "CrotchChain", "ItemTorso");
		if (InventoryGet(Player, "ItemArms") != null) InventoryWear(Player, "Chains", "ItemArms");
	}
	if ((Spell == "FlyingHogtie") || (Spell == "Hogtie") || (Spell == "ReleaseHogtie") || (Spell == "SwitchRope") || (Spell == "SwitchChain")) {
		CharacterRefresh(Player);
	}
	return Spell;
}

/**
 * When the player lost a battle and the student tests a spell on her
 * @param {number} RepChange
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryLoserSpell(RepChange) {
	if (!MagicSchoolLaboratoryStudent) return;
	// If we must change the player dom/sub reputation
	DialogChangeReputation("Dominant", RepChange);

	// After many spells, the event ends CHANGE TO 5
	if (MagicSchoolLaboratorySpellCount >= 5) {
		MagicSchoolLaboratoryStudent.Stage = "240";
		MagicSchoolLaboratoryStudent.CurrentDialog = DialogFind(MagicSchoolLaboratoryStudent, "SpellEnd");
		return;
	}

	const Spell = MagicSchoolLaboratoryApplyRandomSpellEffects(MagicSchoolLaboratoryStudent, MagicSchoolLaboratoryLastSpell);

	// Shows the spell dialog
	MagicSchoolLaboratoryLastSpell = Spell;
	MagicSchoolLaboratoryStudent.Stage = "Spell" + Spell;
	MagicSchoolLaboratorySpellCount++;
	MagicSchoolLaboratoryStudent.CurrentDialog = DialogFind(MagicSchoolLaboratoryStudent, "Spell" + Spell + "Intro");
}

/**
 * Returns the player in the main hall in her current bondage
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryPlayerMainHall() {
	DialogLeave();
	CommonSetScreen("Room", "MainHall");
}

/**
 * Starts a max difficulty battle against the master
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryBattleMasterStart() {
	if (!MagicSchoolLaboratoryStudent) return;
	MagicBattleStart(MagicSchoolLaboratoryStudent, 10, MagicSchoolLaboratoryBackground, () => { MagicSchoolLaboratoryBattleMasterEnd(); });
}

/**
 * When the magic battle against the master ends
 * @returns {SafePromise<void>} - Nothing
 */
async function MagicSchoolLaboratoryBattleMasterEnd() {
	if (!MagicSchoolLaboratoryStudent) return;
	await CommonSetScreen("Room", "MagicSchoolLaboratory");
	CharacterSetCurrent(MagicSchoolLaboratoryStudent);
	CharacterAppearanceRestore(Player, MagicBattlePlayerAppearance);
	CharacterRefresh(Player);
	if (MiniGameVictory) {
		MagicSchoolLaboratoryStudent.Stage = "100";
		MagicSchoolLaboratoryStudent.CurrentDialog = DialogFind(MagicSchoolLaboratoryStudent, "BattleSuccess");
	} else {
		CharacterAppearanceRestore(MagicSchoolLaboratoryStudent, MagicBattleOpponentAppearance);
		CharacterRefresh(MagicSchoolLaboratoryStudent);
		MagicSchoolLaboratoryStudent.Stage = "200";
		MagicSchoolLaboratoryStudent.CurrentDialog = DialogFind(MagicSchoolLaboratoryStudent, "BattleFail");
	}
}

/**
 * When the player learns the master technique from it's house
 * @returns {void} - Nothing
 */
function MagicSchoolLaboratoryLearnMastery() {
	if (!MagicSchoolLaboratoryStudent) return;
	CharacterAppearanceRestore(MagicSchoolLaboratoryStudent, MagicBattleOpponentAppearance);
	CharacterRefresh(MagicSchoolLaboratoryStudent);
	LogAdd("Mastery", "MagicSchool");
}

/**
 * Returns TRUE if the rainbow wand can be waged in a magic fight
 * @returns {boolean} - TRUE if it can be waged
 */
function MagicSchoolLaboratoryCanWageWand() {
	if (!MagicSchoolLaboratoryStudent) return false;
	return InventoryIsWorn(MagicSchoolLaboratoryStudent, "ItemHandheld", "RainbowWand");
}
