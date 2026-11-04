"use strict";
var NurseryBackground = "Nursery";
/** @type {null | string} */
var NurserySituation = null;
var NurseryJustClicked = false;
/** @type {NPCCharacter} */
var NurseryNurse = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var NurseryABDL1 = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var NurseryABDL2 = /** @type {never} */ (null);
/** 0 = Good girl; 1 = ready to be forgiven; >= 2 = severity of naughtiness. */
var NurseryPlayerBadBabyStatus = 0;
var NurseryCoolDownTime = 0;
/** @type {Item[]} */
var NurseryPlayerAppearance = [];
//var NurseryNurseAppearance = null;
//var NurseryAdultBabyAppearance = null;
var RandomNumber = 0;
/** @type {null | BCColor} */
/** @type {null | boolean} */
var NurseryPlayerKeepsLoosingBinky = null;
const NurseryLeaveMessages = Object.freeze({
	EasyEscape: "EasyEscape",
	NoEasyEscape: "NoEasyEscape",
	EscapeSuccess: "EscapeSuccess",
	EscapeFailQuietly: "EscapeFailQuietly",
	EscapeFailQuietlyAndVibrator: "EscapeFailQuietlyAndVibrator",
	EscapeFailNoisy: "EscapeFailNoisy",
	EscapeFailNoisyAndVibrator: "EscapeFailNoisyAndVibrator",
});

/** @type {BCColor[]} */
const NurseryDressColors = [
	"Default", "#808080", "#aa8080", "#80aa80", "#8080aa", "#8194ff",
	"#80aaaa", "#aa80aa", "#898c00", "#008402", "#840000", "#5f38ff"
];
/** @type {BCColor[]} */
const NurseryDiaperColors = [
	"Default", "#808080", "#aa8080", "#80aa80", "#8080aa", "#8194ff",
	"#80aaaa", "#aa80aa"
];
/** @type {AssetName[]} */
let NurseryDresses;
/** @type {{Small: AssetName[], Medium: AssetName[], Large: AssetName[]}} */
let NurseryDiapers;
/** @type {{Normal: AssetName[], Restrained: AssetName[]}} */
let NurseryPacifiers;
/**
 * message about nursery gate
 * @type {null | boolean}
 */
var NurseryGateMsg = null;
/**
 * message about ease of opening nursery gate
 * @type {keyof typeof NurseryLeaveMessages | null}
 */
var NurseryLeaveMessage = null;
/** @type {number} */
var NurseryEscapeAttempts = 0;
/** @type {number} */
var NurseryRepeatOffender = 0;

/**
 * @param {Character} character
 * @returns {boolean}
 */
function NurseryCanSpitOutPacifier(character=Player) {
	const pacifiers = NurseryGetPacifiers(character);
	return pacifiers.length > 0 && pacifiers.every((item) => {
		return !NurseryIsRestrainedPacifier(item.Asset);
	});
}

/**
 * @param {Character} character
 * @returns {boolean}
 */
function NurseryIsDiapered(character=Player) {
	return CharacterHasItemWithAttribute(character, "Diaper");
}

/**
 * @param {Character} character
 * @returns {Item[]}
 */
function NurseryGetPacifiers(character=Player) {
	const slots = /** @type {const} */ (["ItemMouth", "ItemMouth2", "ItemMouth3"]);
	const items = slots.map((slot) => InventoryGet(character, slot));
	return /** @type {Item[]} */ (items.filter(item => item && item.Asset.Attribute.includes("Pacifier")));
}
/**
 * @param {Character} character
 * @returns {boolean}
 */
function NurseryIsPacified(character=Player) {
	return CharacterHasItemWithAttribute(character, "Pacifier");
}

/**
 *
 * @param {Asset} item
 * @returns {boolean}
 */
function NurseryIsRestrainedPacifier(item) {
	return item?.Difficulty > 3;
}

// Returns TRUE if
function NurseryPlayerIsPacified() { return InventoryIsWorn(Player, "ItemMouth", "PacifierGag"); }
function NurseryPlayerIsHarnessPacified() { return InventoryIsWorn(Player, "ItemMouth", "HarnessPacifierGag"); }
function NurseryPlayerLostBinky() { return Player.CanTalk() && !NurseryPlayerKeepsLoosingBinky; }
function NurseryPlayerLostBinkyAgain() { return Player.CanTalk() && NurseryPlayerKeepsLoosingBinky; }
function NurseryPlayerWearingBabyDress() {
	const dress = InventoryGet(Player, "Cloth");
	if (!dress) return false;
	return NurseryDresses.includes(dress.Asset.Name);
}
function NurseryPlayerReadyToAppologise() { return (NurseryPlayerBadBabyStatus <= 1); }
function NurseryPlayerDiapered() {
	return InventoryGet(Player, "Panties")?.Asset.Name.toLowerCase().includes("diaper");
}
function NurseryPlayerReadyDiapered() { return (NurseryIsDiapered(Player) && !NurseryIsClothingInappropriate()); }
function NurseryPlayerCanRegress() { return !InventoryGet(Player, "ItemMouth3") && !InventoryGroupIsBlocked(Player, "ItemMouth3"); }


/**
 * Loads the nursery room
 * @type {ScreenLoadHandler}
 */
async function NurseryLoad() {
	NurseryPlayerAppearance = Player.Appearance.slice();
	NurseryDresses = Asset.filter((asset) => asset.Attribute.includes("IsNurseryOutfit") && asset.Group.Name == "Cloth").map((asset) => asset.Name);
	NurseryPacifiers = Asset.filter((asset) => asset.Attribute.includes("Pacifier") && asset.Group.Name == "ItemMouth").reduce((acc, asset) => {
		if (!NurseryIsRestrainedPacifier(asset)) {
			acc.Normal.push(asset.Name);
		}
		else {
			acc.Restrained.push(asset.Name);
		}
		return acc;
	},
	{ Normal: /** @type {string[]} */ ([]), Restrained: /** @type {string[]} */ ([]) });
	NurseryDiapers = Asset.reduce((acc, asset) => {
		if (asset.Group.Name !== "Panties" || !asset.Attribute.includes("Diaper")) return acc;

		if (asset.Attribute.includes("DiaperSmall")) {
			acc.Small.push(asset.Name);
		}
		else if (asset.Attribute.includes("DiaperMedium")) {
			acc.Medium.push(asset.Name);
		}
		else if (asset.Attribute.includes("DiaperLarge")) {
			acc.Large.push(asset.Name);
		}
		return acc;
	}, { Small: /** @type {string[]} */ ([]), Medium: /** @type {string[]} */ ([]), Large: /** @type {string[]} */ ([]) });
	NurseryNurse = CharacterLoadNPC("NPC_Nursery_Nurse");
	NurseryNurseOutfitForNPC(NurseryNurse);
	NurseryABDL1 = CharacterLoadNPC("NPC_Nursery_ABDL1");
	if (!NurseryIsDiapered(NurseryABDL1)) NurseryABDLOutfitForNPC(NurseryABDL1);
	NurseryABDL2 = CharacterLoadNPC("NPC_Nursery_ABDL2");
	if (!NurseryIsDiapered(NurseryABDL2)) NurseryABDLOutfitForNPC(NurseryABDL2);
	NurseryNurse.AllowItem = false;
	if (NurserySituation == null) return;
	const isInappropriate = NurseryIsClothingInappropriate();
	if (isInappropriate) {
		NurseryPlayerNeedsPunishing(1);
		NurseryNurse.Stage = "270";
		NurseryLoadNurse();
		return;
	}
	if (!NurseryIsDiapered(Player)) {
		NurseryPlayerNeedsPunishing(2);
		NurseryNurse.Stage = "260";
		NurseryLoadNurse();
	}
}

// Run the nursery
function NurseryRun() {
	if (NurserySituation == null) {
		DrawCharacter(Player, 500, 0, 1);
		DrawCharacter(NurseryNurse, 1000, 0, 1);
		if (Player.CanChangeOwnClothes()) DrawButton(1885, 265, 90, 90, "", "White", "Icons/Dress.png");
	}
	if (NurserySituation == "Admitted") {
		DrawCharacter(Player, 250, 0, 1);
		DrawCharacter(NurseryABDL1, 750, 0, 1);
		DrawCharacter(NurseryABDL2, 1250, 0, 1);
		if (Player.CanKneel()) DrawButton(1885, 505, 90, 90, "", "White", "Icons/Kneel.png");
	}
	if (NurserySituation == "AtGate") {
		DrawCharacter(Player, 500, 0, 1);
		DrawImage("Screens/Room/Nursery/NurseryGate.png", 0, 0);
		if (Player.CanWalk()) DrawButton(1500, 25, 300, 75, TextGet("Escape"), "White");
	}
	if (Player.CanWalk()) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
	if (NurserySituation == ("AtGate") || NurserySituation == ( "Admitted")) {
		DrawButton(1885, 265, 90, 90, "", "White", "Icons/Crying.png");
	}
	NurseryGoodBehaviour();
	NurseryDrawText();
}

// When the user clicks in the nursery
function NurseryClick() {
	if (NurserySituation == null) {
		if (MouseIn(500, 0, 500, 1000)) CharacterSetCurrent(Player);
		if (MouseIn(1000, 0, 500, 1000)) NurseryLoadNurse();
		if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) {
			NurseryPlayerAppearance = [];
			CommonSetScreen("Room", "MainHall");
		}
		if ((MouseX >= 1885) && (MouseX < 1975) && (MouseY >= 265) && (MouseY < 355) && Player.CanChangeOwnClothes()) CharacterAppearanceLoadCharacter(Player);
	}
	if (NurserySituation == "Admitted") {
		if (MouseIn(250, 0, 500, 1000)) CharacterSetCurrent(Player);
		if (MouseIn(750, 0, 500, 1000)) CharacterSetCurrent(NurseryABDL1);
		if (MouseIn(1250, 0, 500, 1000)) CharacterSetCurrent(NurseryABDL2);
		if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) {
			NurserySituation = "AtGate";
			NurseryGateMsg = true;
			NurseryJustClicked = true;
		}
		if (MouseIn(1885, 505, 90, 90) && Player.CanKneel()) PoseSetActive(Player, (Player.ActivePoseMapping.BodyLower !== "Kneel") ? "Kneel" : "BaseLower", true);
	}
	if (NurserySituation == "AtGate") {
		if (MouseIn(500, 0, 500, 1000)) CharacterSetCurrent(Player);
		if (MouseIn(1885, 25, 90, 90) && Player.CanWalk() && !NurseryJustClicked) NurserySituation = "Admitted";
		if (MouseIn(1500, 25, 300, 75) && Player.CanWalk()) NurseryEscapeGate();
	}
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
	if (NurserySituation == "AtGate" || NurserySituation == "Admitted") {
		if (MouseIn(1885, 265, 90, 90)) {
			NurseryLoadNurse();
		}
	}
	NurseryJustClicked = false;
}

// Hold selected text on screen
function NurseryDrawText() {
	if (NurserySituation != "AtGate") {
		NurseryGateMsg = null;
		NurseryLeaveMessage = null;
		return;
	}
	if (NurseryGateMsg) {
		DrawTextWrap(TextGet("ChildGate"), 1025, 200, 840, 160, "White");
		if (!Player.IsRestrained()) NurseryLeaveMessage = NurseryLeaveMessages.EasyEscape;
		if (NurseryLeaveMessage == null) NurseryLeaveMessage = NurseryLeaveMessages.NoEasyEscape;
	}

	if (NurseryLeaveMessage == null) return;
	DrawTextWrap(TextGet(NurseryLeaveMessage), 1025, 500, 840, 160, "White");
}

// Loads the nurse and correct stage for particular situations
function NurseryLoadNurse() {
	if (NurserySituation == "AtGate") NurserySituation = "Admitted";
	if (NurseryPlayerBadBabyStatus > 0 && !Player.IsRestrained() && NurseryNurse.Stage == "200") NurseryNurse.Stage = "250";
	// first offence
	if (NurseryNurse.Stage == "250") NurseryNurse.CurrentDialog = DialogFind(NurseryNurse, "CaughtHandsFree");
	if (NurseryNurse.Stage == "260") NurseryNurse.CurrentDialog = DialogFind(NurseryNurse, "CaughtNoDiapers");
	if (NurseryNurse.Stage == "270") NurseryNurse.CurrentDialog = DialogFind(NurseryNurse, "CaughtWrongCloth");
	if (NurseryNurse.Stage == "280") NurseryNurse.CurrentDialog = DialogFind(NurseryNurse, "CaughtLeaving");
	// repeat offence
	if (NurseryNurse.Stage >= "250" && NurseryNurse.Stage <= "299") {
		NurseryRepeatOffender++;
		if (NurseryRepeatOffender == 2) NurseryNurse.Stage = "290";
		if (NurseryRepeatOffender >= 3) NurseryNurse.Stage = "295";
	}
	if (NurseryNurse.Stage == "290") NurseryNurse.CurrentDialog = DialogFind(NurseryNurse, "CaughtRepeat");
	if (NurseryNurse.Stage == "295") NurseryNurse.CurrentDialog = DialogFind(NurseryNurse, "CaughtPersistent");
	CharacterSetCurrent(NurseryNurse);
}

// Checks players diapered is not obscured by Inappropriate cloth
function NurseryIsClothingInappropriate() {
	const inappropriateCloth = [
		"MaidOutfit1", "StudentOutfit1", "StudentOutfit2", "BabydollDress1",
		"TeacherOutfit1", "ChineseDress2", "MistressTop", "NurseUniform"
	];

	const inappropriateClothLower = [
		"CollegeSkirt", "Skirt1", "Jeans1", "Shorts1", "MistressBottom"
	];

	const currentCloth = InventoryGet(Player, "Cloth")?.Asset?.Name;
	const currentClothLower = InventoryGet(Player, "ClothLower")?.Asset?.Name;
	if (!currentCloth || !currentClothLower) return true;

	return inappropriateCloth.includes(currentCloth) || inappropriateClothLower.includes(currentClothLower);
}

/**
 * Sets the outfit for the NPC Nurse
 *
 * @param {NPCCharacter} CurrentNPC
 */
function NurseryNurseOutfitForNPC(CurrentNPC) {
	InventoryWear(CurrentNPC, "NurseUniform", "Cloth", "Default");
	InventoryWear(CurrentNPC, "NurseCap", "Hat", "Default");
	InventoryWear(CurrentNPC, "Stockings2", "Socks", "Default");
}

/**
 * Sets the outfit for the NPC ABDL
 * @param {NPCCharacter} CurrentNPC
 */
function NurseryABDLOutfitForNPC(CurrentNPC) {
	CharacterNaked(CurrentNPC);
	const dress = NurseryRandomDress(CurrentNPC);
	const color = NurseryRandomColor(CurrentNPC);
	InventoryWear(CurrentNPC, dress, "Cloth", color);
	InventoryWear(CurrentNPC, "Diapers1", "Panties", "Default");
	RandomNumber = Math.floor(Math.random() * 8);
	NurseryNPCRestrained(CurrentNPC, RandomNumber);
}

/**
 *
 * @param {NPCCharacter} CurrentNPC
 * @param {number} restraintSet
 */
function NurseryNPCRestrained(CurrentNPC, restraintSet) {
	CharacterRelease(CurrentNPC);
	if (restraintSet >= 1 && restraintSet <= 2) InventoryWear(CurrentNPC, "PacifierGag", "ItemMouth");
	if (restraintSet == 3) {
		InventoryWear(CurrentNPC, "PacifierGag", "ItemMouth");
		InventoryWear(CurrentNPC, "PaddedMittens", "ItemHands");
	}
	if (restraintSet == 4) {
		InventoryWear(CurrentNPC, "PacifierGag", "ItemMouth");
		InventoryWear(CurrentNPC, "AdultBabyHarness", "ItemTorso");
		const handsItem = InventoryWear(CurrentNPC, "PaddedMittens", "ItemHands");
		if (handsItem) {
			TypedItemSetOptionByName(CurrentNPC, handsItem, "Chained");
		}
	}
	if (restraintSet == 5) {
		const mouthItem = InventoryWear(CurrentNPC, "HarnessPacifierGag", "ItemMouth");
		const torsoItem = InventoryWear(CurrentNPC, "AdultBabyHarness", "ItemTorso");
		const handsItem = InventoryWear(CurrentNPC, "PaddedMittens", "ItemHands");
		if (handsItem) {
			TypedItemSetOptionByName(CurrentNPC, handsItem, "Chained");
		}
		InventoryLock(CurrentNPC, mouthItem, "IntricatePadlock", "Nursery property");
		InventoryLock(CurrentNPC, torsoItem, "IntricatePadlock", "Nursery property");
		InventoryLock(CurrentNPC, handsItem, "IntricatePadlock", "Nursery property");
	}
	if (restraintSet >= 6) InventoryWear(CurrentNPC, "PaddedMittens", "ItemHands");
}

/**
 * Random diaper selection
 * @param {Character} character
 * @param {keyof typeof NurseryDiapers} size
 * @returns {AssetName}
 */
function NurseryRandomDiaper(character, size) {
	const currentDiaper = InventoryGet(character, "Panties")?.Asset.Name ?? "";
	return CommonRandomItemFromList(currentDiaper, NurseryDiapers[size]);
}

/**
 * Random dress selection
 * @param {Character} character
 * @returns {AssetName}
 */
function NurseryRandomDress(character) {
	const currentDress = InventoryGet(character, "Cloth")?.Asset.Name ?? "";
	return CommonRandomItemFromList(currentDress, NurseryDresses);
}

/**
 * Random selection for dress colors
 * @param {Character} character
 * @param {BCColor[]} colors
 * @returns {BCColor}
 */
function NurseryRandomColor(character, colors=NurseryDressColors) {
	const currentColors = InventoryGet(character, "Cloth")?.Color ?? "Default";
	const currentColor = CommonIsArray(currentColors) ? currentColors[0] : currentColors;
	return CommonRandomItemFromList(currentColor, colors);
}


/**
 * Remove baby dresses from inventory for testing only
 */
function NurseryDeleteItem() {
	//InventoryDelete(Player, "Padlock", "ItemArms");
	//InventoryDelete(Player, "PadlockKey", "ItemArms");
	//InventoryDelete(Player, "AdultBabyDress3", "Cloth");
}

/**
 * When the player undresses ready to join the nursery
 * @param {number} Cost
 */
function NurseryPlayerUndress(Cost) {
	CharacterChangeMoney(Player, Cost);
	CharacterRelease(Player);
	InventoryRemove(Player, "ItemTorso");
	CharacterNaked(Player);
}

/**
 * @param {Character} character
 * @returns {number}
 */
function NurseryGetRegressionScore(character) {
	const submission = ReputationGet(character, "Dominant");
	const regression = ReputationGet(character, "ABDL");
	return (1+submission/100) * (1+regression/100) * (1+NurseryPlayerBadBabyStatus);
}

/**
 * When the player puts on diapers or has them put on
 * @param {number} [domChange]
 * @param {keyof typeof NurseryDiapers} [size]
 */
function NurseryPlayerGetsDiapered(domChange=0, size=undefined) {
	ReputationProgress("Dominant", domChange);
	ReputationProgress("ABDL", 1);
	NurseryPlayerAdmitted();
	const color = NurseryRandomColor(Player, NurseryDiaperColors);

	const luckScore = Math.random() * 4 * NurseryGetRegressionScore(Player);

	if (luckScore > 2.5) {
		size ??= "Large";
	} else if (luckScore > 1.5) {
		size ??= "Medium";
	} else {
		size ??= "Small";
	}
	// 4. Apply the item if a size was determined
	const diaper = NurseryRandomDiaper(Player, size);
	InventoryWear(Player, diaper, "Panties", color);
}

// When the player is admitted
function NurseryPlayerAdmitted() {
	NurserySituation = "Admitted";
}

// When the player puts on a AB dress or has it put on
function NurseryPlayerWearBabyDress() {
	const dress = NurseryRandomDress(Player);
	const color = NurseryRandomColor(Player);
	InventoryWear(Player, dress, "Cloth", color);
}

/**
 * Restraints used on player
 * @param {number} restraintSet
 */
function NurseryPlayerRestrained(restraintSet) {
	if (restraintSet == 1) {
		InventoryWear(Player, "PaddedMittens", "ItemHands", "Default");
		NurseryPlayerRePacified();
	}
	if (restraintSet == 2) {
		InventoryWear(Player, "AdultBabyHarness", "ItemTorso", "Default");
		const handsItem = InventoryWear(Player, "PaddedMittens", "ItemHands", "Default");
		if (handsItem) {
			TypedItemSetOptionByName(Player, handsItem, "Chained");
		}
	}
	if (restraintSet == 3 || restraintSet == 5 || restraintSet == 6) {
		const mouthItem = InventoryWear(Player, "HarnessPacifierGag", "ItemMouth", "Default");
		const torsoItem = InventoryWear(Player, "AdultBabyHarness", "ItemTorso", "Default");
		const handsItem = InventoryWear(Player, "PaddedMittens", "ItemHands", "Default");
		if (handsItem) {
			TypedItemSetOptionByName(Player, handsItem, "Chained");
		}
		InventoryLock(Player, mouthItem, "IntricatePadlock", "Nursery property");
		InventoryLock(Player, torsoItem, "IntricatePadlock", "Nursery property");
		InventoryLock(Player, handsItem, "IntricatePadlock", "Nursery property");
		NurseryPlayerNeedsPunishing(2);
		if (restraintSet == 5) {
			InventoryWear(Player, "LeatherBlindfold", "ItemHead", "#cccccc");
		}
		if (restraintSet == 6) {
			PoseSetActive(Player, "Kneel", true);
			InventoryWear(Player, "LeatherBelt", "ItemLegs", "#cccccc");
			NurseryPlayerNeedsPunishing(2);
		}
	}
	if (restraintSet == 4) {
		if (!Player.IsRestrained()) {
			const torsoItem = InventoryWear(Player, "AdultBabyHarness", "ItemTorso", "Default");
			const handsItem = InventoryWear(Player, "PaddedMittens", "ItemHands", "Default");
			if (handsItem) {
				TypedItemSetOptionByName(Player, handsItem, "Chained");
			}
			InventoryLock(Player, torsoItem, "IntricatePadlock", "Nursery property");
			InventoryLock(Player, handsItem, "IntricatePadlock", "Nursery property");
		}
	}
}

// Player can spits out regular pacifier
function NurseryPlayerRePacified(character=Player) {
	if (NurseryPlayerKeepsLoosingBinky) {
		const pacifier = CommonRandomItemFromList(InventoryGet(character, "ItemMouth")?.Asset.Name ?? "", NurseryPacifiers.Restrained);
		InventoryWear(character, pacifier, "ItemMouth");
		NurseryPlayerKeepsLoosingBinky = false;
		return;
	} else {
		const pacifier = CommonRandomItemFromList(InventoryGet(character, "ItemMouth")?.Asset.Name ?? "", NurseryPacifiers.Normal);
		InventoryWear(character,pacifier, "ItemMouth");
		NurseryPlayerKeepsLoosingBinky = true;
	}
}

// Nurse will not remove a bad babies harness pacifier
function NurseryPlayerDePacified() {
	if (NurseryPlayerBadBabyStatus >=2) DialogFind(NurseryNurse, "BadBaby");
	else DialogRemoveItem("ItemMouth");
}

// Player released and changed back into regular clothes
function NurseryPlayerRedressed() {
	NurseryPlayerUndress(0);
	CharacterDress(Player, NurseryPlayerAppearance);
	NurserySituation = null;
}

// Nurse punishes all the adult babies for misbehaving
function NurseryBadBabies() {
	NurseryPlayerRestrained(3);
	NurseryNPCRestrained(NurseryABDL1, 5);
	NurseryNPCRestrained(NurseryABDL2, 5);
}

// Player will loose skill progress or level from drinking special milk
function NurseryPlayerSkillsAmnesia() {
	const Modifier = SkillGetModifier(Player, "Evasion");
	SkillSetModifier(Player, "Evasion", Modifier - 1, MS_PER_HOUR);
	/** @type {ItemBundle[]} */
	const ItemsToEarn = [];
	ItemsToEarn.push({Name: "RegressedMilk", Group: "ItemMouth"});
	ItemsToEarn.push({Name: "RegressedMilk", Group: "ItemMouth2"});
	ItemsToEarn.push({Name: "RegressedMilk", Group: "ItemMouth3"});
	InventoryAddMany(Player, ItemsToEarn);
	InventoryWear(Player, "RegressedMilk", "ItemMouth3");
}

// Repair Lost skills
function NurseryReplaceSkill() {
	//SkillProgress("Bondage", 200000);
	//SkillProgress("Evasion", 200000);
	//SkillProgress("Willpower", 200000);
	//SkillProgress("Dressage", 200000);
}

// Player changes dress
function NurseryPlayerChangeDress() {
	CharacterChangeMoney(Player, -5);
	NurseryPlayerWearBabyDress();
}

// Player changes dress
function NurseryPlayerChangeDressColor() {
	CharacterChangeMoney(Player, -5);
	const color = NurseryRandomColor(Player);
	CharacterAppearanceSetColorForGroup(Player, color, "Cloth");
}

// Player changes dress
function NurseryPlayerRemoveDress() {
	InventoryRemove(Player, "Cloth");
}

/**
 * Player gives an adorable ABDL reply
 */
function NurseryPlayerCuteReply() {
	DialogChangeReputation("ABDL", 1);
	DialogRemove();
}

// Player can try to escape the nursery as an ABDL
function NurseryEscapeGate() {
	if (NurseryLeaveMessage == NurseryLeaveMessages.EasyEscape || NurseryLeaveMessage == NurseryLeaveMessages.EscapeSuccess) {
		NurserySituation = "Admitted";
		CommonSetScreen("Room", "MainHall");
		return;
	}
	// Calculate Escape score
	// Base luck value
	RandomNumber = Math.floor(Math.random() * 10);

	// Escape attempts effect
	RandomNumber = RandomNumber + NurseryEscapeAttempts;

	// Evasion skill effect
	RandomNumber = RandomNumber - SkillGetLevel(Player, "Evasion");

	// level of bondage effects
	/** @type {{group: AssetGroupName, penalty: number}[]} */
	const bondagePenalties = [
		{ group: "ItemHead", penalty: 6 },
		{ group: "ItemButt", penalty: 1 },
		{ group: "ItemVulva", penalty: 4 },
		{ group: "ItemLegs", penalty: 2 },
		{ group: "ItemTorso", penalty: 2 },
		{ group: "ItemBreast", penalty: 1 },
		{ group: "ItemMouth", penalty: 1 }
	];
	bondagePenalties.forEach(bp => {
		if (InventoryGet(Player, bp.group) != null) {
			RandomNumber = RandomNumber + bp.penalty;
		}
	});
	const hasVulvaToy = InventoryGet(Player, "ItemVulva") != null;

	// base level for item arms assumes player is bound with mittens (no harness) or metal cuffs
	const arms = InventoryGet(Player, "ItemArms");
	if (arms != null) {
		/** @type {Record<string, number>} */
		const armPenalties = {
			"NylonRope": 3,
			"HempRope": 3,
			"PaddedMittensHarness": 2,
			"PaddedMittensHarnessLocked": 2,
			"LeatherArmbinder": 6,
		};
		RandomNumber = RandomNumber + (armPenalties[arms.Asset.Name] ?? 0);
	}

	// Work out escape result
	if (RandomNumber <= 2) { // Player manages to open gate
		NurseryLeaveMessage = NurseryLeaveMessages.EscapeSuccess;
		return;
	}
	// Player fails to escape....
	if (RandomNumber > (14 - NurseryEscapeAttempts)) { // and nurse notices player
		NurseryEscapeAttempts = NurseryEscapeAttempts - 4;
		NurseryNurse.Stage = "280";
		NurseryLoadNurse();
		NurseryEscapeAttempts++;
		return;
	}
	NurseryEscapeAttempts++;
	if (RandomNumber > 8) {
		// and makes a lot of noise
		NurseryLeaveMessage = NurseryLeaveMessages.EscapeFailNoisy;
		NurseryEscapeAttempts++;
		if (hasVulvaToy) NurseryLeaveMessage = NurseryLeaveMessages.EscapeFailNoisyAndVibrator; // and makes a lot of noise and vibrator
		return;
	}
	// and failed quietly
	NurseryLeaveMessage = NurseryLeaveMessages.EscapeFailQuietly;
	if (hasVulvaToy) NurseryLeaveMessage = NurseryLeaveMessages.EscapeFailQuietlyAndVibrator; // and failed quietly, distracted by vibrator
}

// Player is forgiven for misbehaving
function NurseryPlayerForgiven() {
	//InventoryRemove(Player, "ItemArms");
	CharacterRelease(Player);
	NurseryPlayerBadBabyStatus = 0;
	NurseryEscapeAttempts = 0;

}

// Player is a bad baby and nurse finds her unrestrained
function NurseryPlayerReadmitted() {
	NurseryPlayerUndress(0);
	NurseryPlayerGetsDiapered();
	NurseryPlayerRestrained(3);
}

// Nurse removes inappropriate cloth and lower cloth from player
function NurseryPlayerRemoveCloth() {
	InventoryRemove(Player, "Cloth");
	InventoryRemove(Player, "ClothLower");
}

/**
 * Player needs more discipline
 * @param {number} severity
 */
function NurseryPlayerNeedsPunishing(severity) {
	NurseryPlayerBadBabyStatus = CommonClamp(1, NurseryPlayerBadBabyStatus + severity, 6);
}

/**
 * Player is punished by nurse
 * @param {number} severity
 */
function NurseryPlayerPunished(severity) {
	NurseryPlayerBadBabyStatus = CommonClamp(1, NurseryPlayerBadBabyStatus - severity, 6);
}

// Player bad baby status can reduce with time until she is ready to apologise
function NurseryGoodBehaviour() {
	if (NurseryPlayerBadBabyStatus <= 1) {
		NurseryCoolDownTime = 0;
		return;
	}
	if (NurseryCoolDownTime == 0) NurseryCoolDownTime = CommonTime() + 180000;
	if (CommonTime() >= NurseryCoolDownTime) {
		NurseryPlayerBadBabyStatus--;
		NurseryCoolDownTime = 0;
	}
}
