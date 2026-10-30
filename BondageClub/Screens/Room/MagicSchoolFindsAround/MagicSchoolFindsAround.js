"use strict";
var MagicSchoolFindsAroundBackground = "Castle";
/** @type {"" | "Garden" | "Forest"} */
var MagicSchoolFindsAroundArea = "";
/** @type {NPCCharacter} */
var MagicSchoolFindsAroundKitsune = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var MagicSchoolFindsAroundTheresa = /** @type {never} */ (null);
var MagicSchoolFindsAroundSpellCount = 0;
/** @type {MagicSchoolSpell | undefined} */
var MagicSchoolFindsAroundLastSpell;
/** @satisfies {Record<string, RectTuple>} */
var MagicSchoolFindsAroundButtons = ({
	exit: [1885, 25, 90, 90],
	profile: [1885, 145, 90, 90],
	goToGarden: [1885, 265, 90, 90],
	goToForest: [1885, 385, 90, 90],
	soloCharacter: [750, 0, 500, 1000],
	dualCharacterFirst: [500, 0, 500, 1000],
	dualCharacterSecond: [1000, 0, 500, 1000],
});

/**
 * Uncompress a string containing an appearance, then applies that appearance data to the NPC
 * @param {NPCCharacter} C - The NPC character that loads its new appearance
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundDressUpKitsune(C) {

	CharacterNaked(C, false);
	CharacterRelease(C, false);

	InventoryWear(C, "EchoV2", "BodyStyle", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "Eyebrows1", "Eyebrows", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "NoEars", "Head", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "Large", "BodyLower", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "Normal", "BodyUpper", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "H0970", "Height", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "Full", "Mouth", "#520808", undefined, undefined, undefined, false);
	InventoryWear(C, "HairBack75", "HairBack", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "HairFront9", "HairFront", "#1F1F1F", undefined, undefined, undefined, false);
	InventoryWear(C, "Eyes14", "Eyes",  ["Default", "#AB1633", "#4B4B4B", "Default", "#FFFFFF", "#000000"], undefined, undefined, undefined, false);
	InventoryWear(C, "Eyes14", "Eyes2", ["Default", "#AB1633", "#4B4B4B", "Default", "#FFFFFF", "#000000"], undefined, undefined, undefined, false);

	// ACCESSORIES / CLOTHING
	InventoryWear(C, "SunstripePanties1", "Panties", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "ChineseBra1", "Bra", "#0c0c0c", undefined, undefined, undefined, false);
	InventoryWear(C, "LongFishnets", "SuitLower", "#252525", undefined, undefined, undefined, false);
	InventoryWear(C, "ElegantSkirt", "ClothLower", ["#000000", "Default"], undefined, undefined, undefined, false);
	InventoryWear(C, "Pantyhose1", "Socks", "#010101", undefined, undefined, undefined, false);
	InventoryWear(C, "HaremStockings", "SocksRight", ["#370F0F", "#585858"], undefined, undefined, undefined, false);
	InventoryWear(C, "HaremStockings", "SocksLeft", ["Default", "#515151"], undefined, undefined, undefined, false);
	InventoryWear(C, "Ribbon", "AnkletRight", "#CECECE", undefined, undefined, undefined, false);
	InventoryWear(C, "Ribbon", "AnkletLeft", "#CECECE", undefined, undefined, undefined, false);
	InventoryWear(C, "Geta", "Shoes", ["#430D0D", "#D8D8D8"], undefined, undefined, undefined, false);
	InventoryWear(C, "Band2", "Hat", "#414141", undefined, undefined, undefined, false);
	InventoryWear(C, "RosePendant", "Necklace", ["#1E1E1E", "#820202"], undefined, undefined, undefined, false);
	InventoryWear(C, "KitsuneTailStraps", "TailStraps", undefined, undefined, undefined, undefined, false);
	InventoryWear(C, "FaceVeil", "Mask", ["#2A2A2A", "#141414"], undefined, undefined, undefined, false);
	InventoryWear(C, "SmallBlurred", "EyeShadow", "#8E2C40", undefined, undefined, undefined, false);
	InventoryWear(C,"CustomizableFluffyEars2","HairAccessory2", ["#262626", "#1F1D1D", "#AE2F2F", "#3B0E0E", ...Array(25).fill("Default")], undefined, undefined, undefined, false);

	// GLOVES
	const gloves = InventoryWear(C, "HaremGlove", "Gloves", ["Default", "#A2A2A2"], undefined, undefined, undefined, false);
	if (gloves) {
		gloves.Property ??= {};
		CommonAssign(gloves.Property, { OverridePriority: { Bands: 33, Fabric: 0 } });
	}

	// HAND ACCESSORY
	const rings = InventoryWear(C,"Rings","HandAccessoryRight", ["Default","Default","Default","Default","#A48537","Default","#707070","#00D307","#222222","#CC3333","#222222","#CC3333"], undefined, undefined, undefined, false);
	if (rings) {
		rings.Property ??= {};
		CommonAssign(rings.Property, { TypeRecord: { r: 1, t: 1 }, OverridePriority: 34 });
	}

	// MAIN CLOTH
	const cloth = InventoryWear(C,"EveningGown","Cloth",["#681111", "Default", "Default", "#FFFFFF"],undefined,undefined,undefined,false);
	if (cloth) {
		cloth.Property ??= {};
		CommonAssign(cloth.Property, { Opacity: [0,1,0,0], OverridePriority: { Back: 0, Bottom: 0, Silk: 0 } });
	}

	// GARTERS
	const garters = InventoryWear(C,"ComboBelt","Garters",["#DD8B8B", "#AEAEAE", "#080808"],undefined,undefined,undefined,false);
	if (garters) {
		garters.Property ??= {};
		CommonAssign(garters.Property, { OverridePriority: { Belt: 17, Detail: 11 }, TypeRecord: { c: 1 } });
	}

	CharacterRefresh(C);
}

/**
 * Uncompress a string containing an appearance, then applies that appearance data to the NPC
 * @param {NPCCharacter} C - The NPC character that loads its new appearance
 * @param {"Angel" | "Nun"} outfit - The outfit to use
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundDressUpTheresa(C, outfit) {

	CharacterNaked(C, false);
	CharacterRelease(C, false);

	switch (outfit) {
		case "Angel": {
			InventoryWear(C, "Original", "BodyStyle", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "Eyebrows1", "Eyebrows", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "Default", "Head", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "Normal", "BodyLower", "White", undefined, undefined, undefined, false);
			InventoryWear(C, "XLarge", "BodyUpper", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "H0900", "Height", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "Regular", "Mouth", ["#A68096", "Default"], undefined, undefined, undefined, false);
			InventoryWear(C, "HairBack80", "HairBack", ["#DCBB19", "#7486C7", "#3D3D81", "#524ABB"], undefined, undefined, undefined, false);
			InventoryWear(C, "HairFront64", "HairFront", ["#DCBB19", "#67B3B1"], undefined, undefined, undefined, false);
			InventoryWear(C, "Eyes11", "Eyes", ["#7EDBE3"], undefined, undefined, undefined, false);
			InventoryWear(C, "Eyes11", "Eyes2", ["#3645BA"], undefined, undefined, undefined, false);

			// Angel accessories and clothing
			InventoryWear(C, "Panties14", "Panties", ["#CBE9E6"], undefined, undefined, undefined, false);
			InventoryWear(C, "SleevelessSlimLatexLeotard", "Bra", ["#A4A4A4"], undefined, undefined, undefined, false);
			InventoryWear(C, "RuffledSkirt", "ClothLower", ["#898989"], undefined, undefined, undefined, false);
			InventoryWear(C, "Stockings2", "Socks", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "SeraphWings", "Wings", ["#868383", "#868383", "#868383", "#868383", "#868383", "#868383", "#868383", "#868383", "#868383", "#969797", "#969797", "#969797", "#969797", "#969797", "#969797"], undefined, undefined, undefined, false);
			InventoryWear(C, "ShoulderlessTop", "Cloth", ["#828282"], undefined, undefined, undefined, false);
			InventoryWear(C, "TightCorset", "Corset", ["#D9D9D9", "#ADADAD"], undefined, undefined, undefined, false);
			InventoryWear(C, "FaceScars", "BodyMarkings", ["#EEE08C"], undefined, undefined, undefined, false);
			InventoryWear(C, "BodyChainNecklace", "Necklace", ["#D2B51A", "#D2B51A"], undefined, undefined, undefined, false);
			InventoryWear(C, "WitchShawl", "ClothAccessory", ["#B0B5FF", "#B0B5FF", "#B0B5FF", "#B0B5FF", "#B0B5FF", "#B0B5FF", "#B0B5FF"], undefined, undefined, undefined, false);

			// HALO
			const halo = InventoryWear(C, "Halo", "HairAccessory1", ["#FDF8EE", "#FFEB87", "#FFD800"], undefined, undefined, undefined, false);
			if (halo) {
				halo.Property ??= {};
				CommonAssign(halo.Property, { Opacity: 0.85});
			}
			break;
		}

		case "Nun": {
			InventoryWear(C, "EchoV2", "BodyStyle", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "Eyebrows1", "Eyebrows", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "Default", "Head", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "Normal", "BodyLower", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "Large", "BodyUpper", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "H0940", "Height", undefined, undefined, undefined, undefined, false);
			InventoryWear(C, "Regular", "Mouth", ["#BE737E", "Default"], undefined, undefined, undefined, false);
			InventoryWear(C, "HairBack76b", "HairBack", ["#5A1D1D"], undefined, undefined, undefined, false);
			InventoryWear(C, "HairFront25", "HairFront", ["#5A1D1D"], undefined, undefined, undefined, false);
			InventoryWear(C, "Eyes11", "Eyes", ["#7EDBE3"], undefined, undefined, undefined, false);
			InventoryWear(C, "Eyes11", "Eyes2", ["#3645BA"], undefined, undefined, undefined, false);

			// Angel accessories and clothing
			InventoryWear(C, "StringPasty1", "Panties", ["#181818"], undefined, undefined, undefined, false);
			InventoryWear(C, "StrapBra", "Bra", ["#2B2B2B"], undefined, undefined, undefined, false);
			InventoryWear(C, "LongFishnets", "Socks", ["#121212"], undefined, undefined, undefined, false);
			InventoryWear(C, "Socks5", "SocksLeft", ["#222222"], undefined, undefined, undefined, false);
			InventoryWear(C, "Socks5", "SocksRight", ["#222222"], undefined, undefined, undefined, false);
			InventoryWear(C, "NunRobes", "Cloth", ["#494949", "Default", "Default", "#424242"], undefined, undefined, undefined, false);
			InventoryWear(C, "Corset1", "Corset", ["#1C1C1C"], undefined, undefined, undefined, false);
			InventoryWear(C, "Glitter", "Mask", ["#E3C6B6", "#E3C6B6"], undefined, undefined, undefined, false);
			InventoryWear(C, "AnkleStrapShoes", "Shoes", ["#381717"], undefined, undefined, undefined, false);
			InventoryWear(C, "NunVeil", "Hat", ["Default", "#343434", "#515151"], undefined, undefined, undefined, false);
			InventoryWear(C, "Gloves2", "Gloves", ["#222222"], undefined, undefined, undefined, false);
			InventoryWear(C, "Wings", "EyeShadow", ["#919F9E", "#131313"], undefined, undefined, undefined, false);

			// JEWEL
			const jewel = InventoryWear(C, "JewelrySet", "Jewelry", ["#908B3A", "#908B3A", "#908B3A"], undefined, undefined, undefined, false);
			if (jewel) {
				jewel.Property ??= {};
				CommonAssign(jewel.Property, { TypeRecord: {e: 3, a: 3, n: 0, f: 0} });
			}
		}
	}

	CharacterRefresh(C);
}

// #region Screen management

/**
 * Loads the magic school finds around screen and the NPC
 * @type {ScreenLoadHandler}
 */
async function MagicSchoolFindsAroundLoad() {
	if (MagicSchoolFindsAroundKitsune == null) {
		// Load Kitsune NPC and prepare her appearance
		MagicSchoolFindsAroundKitsune = CharacterLoadNPC("NPC_MagicSchoolFindsAround_Kitsune");
		MagicSchoolFindsAroundDressUpKitsune(MagicSchoolFindsAroundKitsune);
		// FIXME: janky wait to make sure the dialog's done loading
		await CommonWaitFor(() => MagicSchoolFindsAroundKitsune.Dialog.length !== 0);
		MagicSchoolFindsAroundKitsune.LabelColor = "#4E1313";
		MagicSchoolFindsAroundKitsune.AllowItem = false;
		MagicSchoolFindsAroundKitsune.Name = "Daji";
		MagicSchoolFindsAroundKitsune.Stage = "0";
		MagicSchoolFindsAroundKitsuneQuestUpdate();
	}

	if (MagicSchoolFindsAroundTheresa == null) {
		MagicSchoolFindsAroundTheresa = CharacterLoadNPC("NPC_MagicSchoolFindsAround_Theresa");
		// FIXME: janky wait to make sure the dialog's done loading
		await CommonWaitFor(() => MagicSchoolFindsAroundTheresa.Dialog.length !== 0);
		MagicSchoolFindsAroundTheresa.LabelColor = "#5FEBE8";
		MagicSchoolFindsAroundTheresa.AllowItem = false;
	}

	MagicSchoolFindsAroundTheresaQuestUpdate();
}

/**
 * Runs the room
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundRun() {
	if (MagicSchoolFindsAroundArea === "") {
		/** @type {RectTuple} */
		const introRect = [100, 800, 1782, 200];
		DrawTextWrap(TextGet("ScreenIntro"), ...(RectGetFrame(RectOffset(RectMakeRect(...introRect), 2, 2))), "Black");
		DrawTextWrap(TextGet("ScreenIntro"), ...introRect, "White");
	}
	DrawButton(...MagicSchoolFindsAroundButtons.exit, "", Player.CanWalk() ? "White" : "Pink", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(...MagicSchoolFindsAroundButtons.profile, "", "White", "Icons/Character.png", TextGet("Profile"));
	if (MagicSchoolFindsAroundArea === "") {
		DrawButton(...MagicSchoolFindsAroundButtons.goToGarden, "", "White", "Icons/Flower.png", TextGet("GoToGarden"));
		DrawButton(...MagicSchoolFindsAroundButtons.goToForest, "", "White", "Icons/Tree.png", TextGet("GoToForest"));
	} else if (MagicSchoolFindsAroundArea == "Forest") {
		if (MagicSchoolFindsAroundKitsune) {
			DrawCharacter(Player, ...RectGetOrigin(MagicSchoolFindsAroundButtons.dualCharacterFirst), 1);
			DrawCharacter(MagicSchoolFindsAroundKitsune, ...RectGetOrigin(MagicSchoolFindsAroundButtons.dualCharacterSecond), 1);
		}
	} else if (MagicSchoolFindsAroundArea == "Garden") {
		if (MagicSchoolFindsAroundTheresa && !MagicSchoolFindsAroundTheresaVanished()) {
			DrawCharacter(Player, ...RectGetOrigin(MagicSchoolFindsAroundButtons.dualCharacterFirst), 1);
			DrawCharacter(MagicSchoolFindsAroundTheresa, ...RectGetOrigin(MagicSchoolFindsAroundButtons.dualCharacterSecond), 1);
		} else {
			DrawCharacter(Player, ...RectGetOrigin(MagicSchoolFindsAroundButtons.soloCharacter), 1);
		}
	}
}

/**
 *
 * @param {"" | "Forest" | "Garden"} screenName
 */
function MagicSchoolFindsAroundChangeScreen(screenName) {
	MagicSchoolFindsAroundArea = screenName;
	if (MagicSchoolFindsAroundArea == "Forest") {
		MagicSchoolFindsAroundBackground = "ForestPath";
		if (MagicSchoolFindsAroundKitsune) {
			CharacterSetCurrent(MagicSchoolFindsAroundKitsune);
		}
	} else if (MagicSchoolFindsAroundArea == "Garden") {
		MagicSchoolFindsAroundBackground = "Garden1";
		if (MagicSchoolFindsAroundTheresa && !MagicSchoolFindsAroundTheresaVanished()) {
			CharacterSetCurrent(MagicSchoolFindsAroundTheresa);
		}
	} else {
		MagicSchoolFindsAroundBackground = "Castle";
	}
}

/**
 * Handles the click events.  Called from CommonClick()
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundClick() {
	if (MouseIn(...MagicSchoolFindsAroundButtons.exit) && Player.CanWalk()) {
		if (MagicSchoolFindsAroundArea !== "") {
			MagicSchoolFindsAroundChangeScreen("");
		} else {
			CommonSetScreen("Room", "MagicSchoolLaboratory");
		}
	}
	if (MouseIn(...MagicSchoolFindsAroundButtons.profile)) {
		InformationSheetLoadCharacter(Player);
	}

	if (MagicSchoolFindsAroundArea === "") {
		if (MouseIn(...MagicSchoolFindsAroundButtons.goToGarden)) {
			MagicSchoolFindsAroundChangeScreen("Garden");
			return;
		}
		if (MouseIn(...MagicSchoolFindsAroundButtons.goToForest)) {
			MagicSchoolFindsAroundChangeScreen("Forest");
			MagicSchoolFindsAroundKitsuneQuestUpdate();
			return;
		}
	}

	// Check for clicks on the characters
	if (MagicSchoolFindsAroundArea === "") {
		if (MouseIn(...MagicSchoolFindsAroundButtons.soloCharacter)) {
			CharacterSetCurrent(Player);
		}
	} else if (MagicSchoolFindsAroundArea === "Forest") {
		if (MouseIn(...MagicSchoolFindsAroundButtons.dualCharacterFirst)) {
			CharacterSetCurrent(Player);
		}
		if (MouseIn(...MagicSchoolFindsAroundButtons.dualCharacterSecond)) {
			CharacterSetCurrent(MagicSchoolFindsAroundKitsune);
		}
	} else if (MagicSchoolFindsAroundArea === "Garden") {
		if (MagicSchoolFindsAroundTheresaVanished()) {
			if (MouseIn(...MagicSchoolFindsAroundButtons.soloCharacter)) {
				CharacterSetCurrent(Player);
			}
		} else {
			if (MouseIn(...MagicSchoolFindsAroundButtons.dualCharacterFirst)) {
				CharacterSetCurrent(Player);
			}
			if (MouseIn(...MagicSchoolFindsAroundButtons.dualCharacterSecond)) {
				CharacterSetCurrent(MagicSchoolFindsAroundTheresa);
			}
		}
	}
}

// #endregion

// #region Shared

/**
 * Returns the fully initialized and validated parameters for the FindsAround game
 * @returns {Required<GameMagicSchoolFindsAroundParameters>} - Nothing
 */
function MagicSchoolFindsAroundGetData() {
	if (!CommonIsObject(Player.Game.MagicSchoolFindsAround)) Player.Game.MagicSchoolFindsAround = {};
	const data = /** @type {Required<GameMagicSchoolFindsAroundParameters>} */ (Player.Game.MagicSchoolFindsAround);
	data.KitsuneQuestProgress = CommonClamp(data.KitsuneQuestProgress ?? -1, -1, 9);
	data.TheresaQuestProgress = CommonClamp(data.TheresaQuestProgress ?? -1, -1, 6);
	data.TheresaBadWords = data.TheresaBadWords ?? [];
	data.TheresaHideUntil = data.TheresaHideUntil ?? 0;
	return data;
}

/**
 * Gives the player the reward tails
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundGiveTails() {
	InventoryAdd(Player, "KitsuneTailStraps", "TailStraps");
}

/**
 * Gives the player the reward wings
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundGiveWings() {
	InventoryAdd(Player, "SeraphWings", "Wings");
}

/**
 * Triggered when the player lost and get untied by the Kitsune, can affect reputation
 * @param {number} RepChange
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundReleasePlayer(RepChange) {
	DialogChangeReputation("Dominant", RepChange);
	CharacterRelease(Player);
}

/**
 * Returns the player in the main hall in her current bondage
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundPlayerMainHall() {
	DialogLeave();
	CommonSetScreen("Room", "MainHall");
}

// #endregion

// #region Kitsune

/**
 * Starts the quest to gather essences for Kitsune
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundKitsuneStartQuest() {
	const data = MagicSchoolFindsAroundGetData();
	data.KitsuneQuestProgress = 0;
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	MagicSchoolFindsAroundKitsuneQuestUpdate();
}

/**
 * Return the current progress of the Kitsune quest
 * @returns {number}
 */
function MagicSchoolFindsAroundKitsuneGetQuestProgress() {
	const data = MagicSchoolFindsAroundGetData();
	return data.KitsuneQuestProgress ?? -1;
}

/**
 * Is the Kitsune quest in-progress?
 * @returns {boolean} - True if in progress
 */
function MagicSchoolFindsAroundKitsuneQuestStarted() {
	return MagicSchoolFindsAroundKitsuneGetQuestProgress() >= 0;
}

/**
 * Is the Kitsune quest complete?
 * @returns {boolean} - True if completed
 */
function MagicSchoolFindsAroundKitsuneQuestCompleted() {
	return MagicSchoolFindsAroundKitsuneGetQuestProgress() >= 9;
}

/**
 * Magic School Finds Around Kitsune Quest in progress?
 * True if started but not completed (0–8)
 * @returns {boolean}
 */
function DialogKitsuneQuestInProgress() {
	const p = MagicSchoolFindsAroundKitsuneGetQuestProgress();
	return p >= 0 && p < 9;
}

/**
 * Give player essence from defeated student
 * @param {number} Amount - The amount of essence to give
 * @returns {void} - Nothing
 */
function DialogKitsuneGiveEssence(Amount) {
	if (!CurrentCharacter) return;
	DialogRemove();
	PoseSetActive(CurrentCharacter, 'Kneel');
	const data = MagicSchoolFindsAroundGetData();
	data.KitsuneQuestProgress += Amount;
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	MagicSchoolFindsAroundKitsuneQuestUpdate();
}

function MagicSchoolFindsAroundKitsuneDisappear() {
	DialogHideNPC(MagicSchoolFindsAroundKitsune);
	MagicSchoolFindsAroundGiveTails();
}

/**
 * Update the Kitsune NPC's quest status as it progresses
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundKitsuneQuestUpdate() {
	if (MagicSchoolFindsAroundKitsune == null) return;
	if (!MagicSchoolFindsAroundKitsuneQuestStarted()) return;
	let Defeats = MagicSchoolFindsAroundKitsuneGetQuestProgress();
	// Quest already started, so set the state directly
	if (Defeats !== -1) MagicSchoolFindsAroundKitsune.Stage = "100";
	if (Defeats < 0) Defeats = 0;
	let MissingDefeats = 9 - Defeats;
	if (MissingDefeats !== 0) {
		MagicSchoolFindsAroundKitsune.CurrentDialog = DialogFind(MagicSchoolFindsAroundKitsune, "100").replace("LEFTDEFEATCOUNT", MissingDefeats.toString());
	} else {
		MagicSchoolFindsAroundKitsune.CurrentDialog = DialogFind(MagicSchoolFindsAroundKitsune, "CompleteQuestRelief");
	}
}

/**
 * Starts a magic battle with the Kitsune NPC
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundMagicBattleStart() {
	MagicBattleStart(MagicSchoolFindsAroundKitsune, 9, MagicSchoolLaboratoryBackground, () => { MagicSchoolFindsAroundKitsuneMagicBattleEnd(); });
}

/**
 * When the magic battle practice ends
 * @returns {SafePromise<void>} - Nothing
 */
async function MagicSchoolFindsAroundKitsuneMagicBattleEnd() {
	await CommonSetScreen("Room", "MagicSchoolFindsAround");
	CharacterSetCurrent(MagicSchoolFindsAroundKitsune);
	if (!CurrentCharacter) return;
	if (MiniGameVictory) {
		MagicSchoolFindsAroundKitsune.Stage = "70";
		PoseSetActive(CurrentCharacter,'Kneel');
		CharacterAppearanceRestore(Player, MagicBattlePlayerAppearance);
		CharacterRefresh(Player);
	} else {
		MagicSchoolFindsAroundKitsune.Stage = "200";
		MagicSchoolFindsAroundSpellCount = 0;
		CharacterAppearanceRestore(MagicSchoolFindsAroundKitsune, MagicBattleOpponentAppearance);
		CharacterRefresh(MagicSchoolFindsAroundKitsune);
	}
	MagicSchoolFindsAroundKitsune.CurrentDialog = DialogFind(MagicSchoolFindsAroundKitsune, MiniGameVictory ? "BattleSuccess" : "BattleFail");
}

/**
 * When the player starts a club card game
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundClubCardStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, ClubCardBuilderDefaultDeck, () => { MagicSchoolFindsAroundClubCardEnd(); });
}

/**
 * When the player ends a club card game
 * @returns {SafePromise<void>}
 */
async function MagicSchoolFindsAroundClubCardEnd() {
	await CommonSetScreen("Room", "MagicSchoolFindsAround");
	CharacterSetCurrent(MagicSchoolFindsAroundKitsune);
	if (!CurrentCharacter) return;
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, MiniGameVictory ? "ClubCardVictory" : "ClubCardDefeat");
}

/**
 * Run out of the Findings room
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundRunAway() {
	DialogLeave();
	CommonSetScreen("Room", "MagicSchoolLaboratory");
}

/**
 * Run out of the Findings room and reset NPC
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundRunAwayEnd() {
	DialogLeave();
	DialogRevealNPC(MagicSchoolFindsAroundKitsune);
	CharacterRelease(MagicSchoolFindsAroundKitsune);
	PoseSetActive(MagicSchoolFindsAroundKitsune, 'BaseLower');
	MagicSchoolFindsAroundGiveTails();
	const data = MagicSchoolFindsAroundGetData();
	if (data.KitsuneQuestProgress == 9) {
		data.KitsuneQuestProgress = -1;
	}
	MagicSchoolFindsAroundKitsune.Stage = "0";
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	CommonSetScreen("Room", "MagicSchoolLaboratory");
}

/**
 * Triggered when the player lost and get ungagged by the Kitsune, can affect reputation
 * @param {number} RepChange
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundUngagPlayer(RepChange) {
	DialogChangeReputation("Dominant", RepChange);
	InventoryRemove(Player, "ItemMouth");
	InventoryRemove(Player, "ItemMouth2");
	InventoryRemove(Player, "ItemMouth3");
}

/**
 * When the player lost a battle and the Kitsune tests a spell on her
 * @param {number} RepChange
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundLoserSpell(RepChange) {

	// If we must change the player dom/sub reputation
	DialogChangeReputation("Dominant", RepChange);

	// After many spells, the event ends CHANGE TO 5
	if (MagicSchoolFindsAroundSpellCount >= 5) {
		MagicSchoolFindsAroundKitsune.Stage = "240";
		MagicSchoolFindsAroundKitsune.CurrentDialog = DialogFind(MagicSchoolFindsAroundKitsune, "SpellEnd");
		return;
	}

	const Spell = MagicSchoolLaboratoryApplyRandomSpellEffects(MagicSchoolFindsAroundKitsune, MagicSchoolFindsAroundLastSpell);

	// Shows the spell dialog
	MagicSchoolFindsAroundLastSpell = Spell;
	MagicSchoolFindsAroundKitsune.Stage = "Spell" + Spell;
	MagicSchoolFindsAroundSpellCount++;
	MagicSchoolFindsAroundKitsune.CurrentDialog = DialogFind(MagicSchoolFindsAroundKitsune, "Spell" + Spell + "Intro");
}

// #endregion Kitsune

// #region Theresa

/**
 * Starts the quest to gather essences for Theresa
 * @param {"bad"} [type] - Unused and no idea what it's supposed to do (a development leftover maybe)?
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundTheresaStartQuest(type) {
	const data = MagicSchoolFindsAroundGetData();
	if (data.TheresaTooRude && data.TheresaBadWords.length >= 3 ) {
		MagicSchoolFindsAroundTheresa.Stage = "0";
		MagicSchoolFindsAroundTheresa.CurrentDialog = DialogFind(MagicSchoolFindsAroundTheresa, "TooRudeRepeat");
		data.TheresaBadWords = [];
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		return;
	}
	if (data.TheresaBadWords.length >= 3) {
		MagicSchoolFindsAroundTheresa.Stage = "0";
		MagicSchoolFindsAroundTheresa.CurrentDialog = DialogFind(MagicSchoolFindsAroundTheresa, "TooRude");
		data.TheresaTooRude = true;
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		return;
	}
	data.TheresaQuestProgress = 0;
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	MagicSchoolFindsAroundTheresaQuestUpdate();
}

/**
 * Return the current progress of the Theresa quest
 * @returns {number}
 */
function MagicSchoolFindsAroundTheresaGetQuestProgress() {
	const data = MagicSchoolFindsAroundGetData();
	return data.TheresaQuestProgress;
}

/** Whether the Theresa quest has started */
function MagicSchoolFindsAroundTheresaQuestStarted() { return MagicSchoolFindsAroundTheresaGetQuestProgress() !== -1; }
/** Whether the Theresa quest is ongoing */
function MagicSchoolFindsAroundTheresaQuestIsOngoing() { return MagicSchoolFindsAroundTheresaQuestStarted() && !MagicSchoolFindsAroundTheresaQuestCompleted(); }
/** Whether the Theresa quest is complete and can be rewarded */
function MagicSchoolFindsAroundTheresaQuestCompleted() { return MagicSchoolFindsAroundTheresaGetQuestProgress() >= 6; }
/** Whether it's the first time we meet Theresa */
function MagicSchoolFindsAroundTheresaFirstMet() { return !MagicSchoolFindsAroundTheresaQuestStarted() && !MagicSchoolFindsAroundTheresaBeenRudeBefore(); }
/** Whether we've been rude to Theresa already */
function MagicSchoolFindsAroundTheresaBeenRudeBefore() { return MagicSchoolFindsAroundGetData().TheresaTooRude && !MagicSchoolFindsAroundTheresaQuestStarted(); }
/** Whether we've been rude to Theresa already */
function MagicSchoolFindsAroundTheresaVanished() { return CurrentTime < MagicSchoolFindsAroundGetData().TheresaHideUntil; }
/** Whether the player owns the reward */
function MagicSchoolFindsAroundTheresaTimerUp() {
	const data = MagicSchoolFindsAroundGetData();
	return data.TheresaHideUntil !== 0 && CurrentTime >= data.TheresaHideUntil;
}

/**
 * Update the Theresa NPC's quest status as it progresses
 * @returns {void} - Nothing
 */
function MagicSchoolFindsAroundTheresaQuestUpdate() {
	if (MagicSchoolFindsAroundTheresa == null) return;
	if (MagicSchoolFindsAroundTheresaQuestIsOngoing()) {
		let helped = MagicSchoolFindsAroundTheresaGetQuestProgress();
		if (helped < 0) helped = 0;
		let remaining = 6 - helped;
		const line = MagicSchoolFindsAroundTheresa.Dialog.find(({Stage, NextStage}) => Stage === "0" && NextStage === "22");
		if (!line) {
			console.error("failed to locate line");
		} else {
			line.Result = line.Result?.replace(/(REMAINING|\d+)/, remaining.toString()) ?? null;
		}
	}
	if (MagicSchoolFindsAroundTheresaTimerUp()) {
		if (MagicSchoolFindsAroundTheresaVanished()) {
			DialogHideNPC(MagicSchoolFindsAroundTheresa);
		} else {
			if (MagicSchoolFindsAroundTheresaGetQuestProgress() >= 6) {
				DialogRevealNPC(MagicSchoolFindsAroundTheresa);
				MagicSchoolFindsAroundDressUpTheresa(MagicSchoolFindsAroundTheresa, "Angel");
				MagicSchoolFindsAroundTheresa.Name = "Theresa";
			} else {
				DialogRevealNPC(MagicSchoolFindsAroundTheresa);
				MagicSchoolFindsAroundDressUpTheresa(MagicSchoolFindsAroundTheresa, "Nun");
				MagicSchoolFindsAroundTheresa.Name = "Theresa";
			}
		}
	} else if (MagicSchoolFindsAroundTheresaQuestCompleted()) {
		MagicSchoolFindsAroundDressUpTheresa(MagicSchoolFindsAroundTheresa, "Angel");
		if (MagicSchoolFindsAroundTheresa.Stage == "0") {
			MagicSchoolFindsAroundTheresa.Name = "Angel";
		} else {
			MagicSchoolFindsAroundTheresa.Name = "Theresa";
		}
	} else {
		MagicSchoolFindsAroundDressUpTheresa(MagicSchoolFindsAroundTheresa, "Nun");
		MagicSchoolFindsAroundTheresa.Name = "Theresa";
	}
}

/**
 * Give player essence from rescued person
 * @param {number} Amount - The amount of essence to give
 * @returns {void} - Nothing
 */
function DialogTheresaGiveEssence(Amount) {
	if (!CurrentCharacter) return;
	if (!MagicSchoolFindsAroundTheresaQuestIsOngoing()) return;
	DialogRemove();
	PoseSetActive(CurrentCharacter, 'Kneel');
	const data = MagicSchoolFindsAroundGetData();
	data.TheresaQuestProgress += Amount ?? 0;
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	MagicSchoolFindsAroundTheresaQuestUpdate();
}

/**
 * @param {number} stage
 */
function MagicSchoolFindsAroundTheresaGiveBadWordPoint(stage) {
	const data = MagicSchoolFindsAroundGetData();
	if (!data.TheresaBadWords.includes(stage)) {
		data.TheresaBadWords.push(stage);
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	}
}

function MagicSchoolFindsAroundTheresaGiveGift() {
	MagicSchoolFindsAroundGiveWings();
	DrawFlashScreen("#FFFFFF", 2000, 300);
	MagicSchoolFindsAroundTheresa.Name = "Theresa";
}

function MagicSchoolFindsAroundHideTheresa() {
	DialogHideNPC(MagicSchoolFindsAroundTheresa);
	const data = MagicSchoolFindsAroundGetData();
	// Hide for 42 hours
	data.TheresaHideUntil = CurrentTime + 42 * 60 * 60 * 1000;
	data.TheresaQuestProgress = 7;
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
}
