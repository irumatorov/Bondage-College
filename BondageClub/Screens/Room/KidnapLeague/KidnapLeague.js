"use strict";
var KidnapLeagueBackground = "KidnapLeague";
/** @type {NPCCharacter} */
var KidnapLeagueTrainer = /** @type {never} */ (null);
/** @type {null | NPCCharacter} */
var KidnapLeagueRandomKidnapper = null;
var KidnapLeagueRandomKidnapperScenario = "0";
var KidnapLeagueRandomKidnapperDifficulty = 0;
/** @type {null | "" | "Maid" | "Mistress" | "AnimeGirl"} */
var KidnapLeagueArchetype = null;
var KidnapLeagueWillPayForFreedom = false;
/** @type {KidnapActivity[]} */
var KidnapLeagueRandomActivityList = ["AddGag", "RemoveGag", "AddFeet", "RemoveFeet", "AddLegs", "RemoveLegs", "Tickle", "Spank", "Kiss", "Fondle"];
/** @type {KidnapActivity | ""} */
var KidnapLeagueRandomActivity = "";
var KidnapLeagueRandomActivityCount = 0;
/** @type {null | { Bounty: NPCCharacter; Difficulty: number; Location: string; Victory?: boolean }} */
var KidnapLeagueBountyState = null;
/**
 * @type {null | NPCCharacter}
 * @deprecated
 */
var KidnapLeagueBounty = null;
/**
 * @type {null | number}
 * @deprecated
 */
var KidnapLeagueBountyDifficulty = null;
/** @deprecated */
var KidnapLeagueBountyLocation = "";
var KidnapLeagueBountyLocationList = ["Introduction", "MaidQuarters", "Shibari", "Shop"];
/**
 * @type {null | boolean}
 * @deprecated
 */
var KidnapLeagueBountyVictory = null;
var KidnapLeagueVisitRoom = false;

/** @type {number[]} */
var KidnapLeagueSearchingPlayers = [];
var KidnapLeagueSearchFinishTime = 0;
var KidnapLeagueSearchFinishDuration = 5*60*1000; // 15 mins
var KidnapLeagueOnlineBountyTarget = 0;
var KidnapLeagueOnlineBountyTargetStartedTime = 0;

/**
 * Checks if the player can be kidnapped
 * @returns {boolean} - Returns TRUE if the player is restrained and the trainer is not.
 */
function KidnapLeagueAllowKidnap() { return (!Player.IsRestrained() && !KidnapLeagueTrainer.IsRestrained()); }
/**
 * Checks if the kidnap league trainer is restrained.
 * @returns {boolean} - Returns TRUE if the kidnap league trainer is restrained.
 */
function KidnapLeagueIsTrainerRestrained() { return KidnapLeagueTrainer.IsRestrained(); }
/**
 * Checks if the player can take a new kidnap league bounty.
 * @returns {boolean} - Returns TRUE if the player has no active bounty.
 */
function KidnapLeagueCanTakeBounty() { return (ReputationGet("Kidnap") > 0) && !KidnapLeagueBountyState; }
/**
 * Checks if a kidnap league bounty was taken.
 * @returns {boolean} - Returns TRUE if the player has an active and unfinished bounty.
 */
function KidnapLeagueBountyTaken() { return (ReputationGet("Kidnap") > 0) && !!KidnapLeagueBountyState && KidnapLeagueBountyState?.Victory === undefined; }
/**
 * Checks if the current bounty resulted in a victory.
 * @returns {boolean} - Returns TRUE if the current bounty resulted in a victory.
 */
function KidnapLeagueBountyWasVictory() { return (ReputationGet("Kidnap") > 0) && KidnapLeagueBountyState?.Victory === true; }
/**
 * Checks if the current bounty resulted in a defeat.
 * @returns {boolean} - Returns TRUE if the current bounty resulted in a defeat.
 */
function KidnapLeagueBountyWasDefeat() { return (ReputationGet("Kidnap") > 0) && KidnapLeagueBountyState?.Victory === false; }
/**
 * Checks if a NPC can be transfered to the player's private room.
 * @returns {boolean} - Returns TRUE if the player has an accessible private room and a free spot for a NPC.
 */
function KidnapLeagueCanTransferToRoom() { return PrivateHasEmptySlot(); }
/**
 * Checks if the NPC will not visit the player's private room.
 * @returns {boolean} - Returns TRUE if the NPC won't come to the private room even if it's possible
 */
function KidnapLeagueWontVisitRoom() { return (!KidnapLeagueVisitRoom && KidnapLeagueCanTransferToRoom()); }
/**
 * Checks if both players can kiss.
 * @returns {boolean} - Returns TRUE if both players are able to talk which means they can kiss.
 */
function KidnapLeagueCanKiss() { return !!CurrentCharacter && Player.CanTalk() && CurrentCharacter.CanTalk(); }


/**
 * Checks if the player has public permissions (up to Owners, Whitelist, and Dominants)
 * @returns {boolean} - Returns TRUE if the player can start the online bounty game
 */
function KidnapLeagueHasBountyPermissions() {
	return (Player.AllowedInteractions <= AllowedInteractions.OwnerLoversWhitelistAndDomsOnly);
}
/**
 * Checks if the player has public permissions (up to Owners, Whitelist, and Dominants)
 * @returns {boolean} - Returns TRUE if the player cannot start the online bounty game
 */
function KidnapLeagueDoesNotHaveBountyPermissions() {
	return (Player.AllowedInteractions > AllowedInteractions.OwnerLoversWhitelistAndDomsOnly);
}
/**
 * Checks if the player can take up the online bounty quest
 * @returns {boolean} - Returns TRUE if the player can start the online bounty game
 */
function KidnapLeagueCanStartOnlineBounty() {
	return ReputationGet("Kidnap") > 0 && Player.CanTalk() && !!CurrentCharacter && CurrentCharacter.CanTalk() && CurrentCharacter.CanInteract() && InventoryIsWorn(Player, "ItemMisc", "None");
}
/**
 * Checks if the player can end early the online bounty quest
 * @returns {boolean} - Returns TRUE if the player can end the online bounty game
 */
function KidnapLeagueOnlineBountyOngoing() {
	return !!CurrentCharacter && CurrentCharacter.CanTalk() && CurrentCharacter.CanInteract() && InventoryIsWorn(Player, "ItemMisc", "BountySuitcase");
}
/**
 * Checks if the player can end the online bounty quest
 * @returns {boolean} - Returns TRUE if the player can end the online bounty game
 */
function KidnapLeagueOnlineBountyEnded() {
	return !!CurrentCharacter && CurrentCharacter.CanTalk() && CurrentCharacter.CanInteract() && InventoryIsWorn(Player, "ItemMisc", "BountySuitcaseEmpty");
}

/**
 * Starts the online bounty game
 * @returns {void} - Nothing
 */
function KidnapLeagueOnlineBountyStart() {
	InventoryWear(Player, "BountySuitcase", "ItemMisc");
	KidnapLeagueSearchingPlayers = [];
}
/**
 * Ends the online bounty game early
 * @returns {void} - Nothing
 */
function KidnapLeagueOnlineBountyCancel() {
	InventoryRemove(Player, "ItemMisc");
}
/**
 * Ends the online bounty game and pays
 * @returns {void} - Nothing
 */
function KidnapLeagueOnlineBountyFinish() {
	let money = 25;
	let misc = InventoryGet(Player, "ItemMisc");
	if (misc && misc.Property && misc.Property.Iterations && typeof misc.Property.Iterations === "number") {
		money += 15 * misc.Property.Iterations;
	}

	InventoryRemove(Player, "ItemMisc");
	KidnapLeagueTrainer.CurrentDialog = KidnapLeagueTrainer.CurrentDialog.replace("MONEYAMOUNT", CharacterMoneyFormat(money));
	CharacterChangeMoney(Player, money);
	ReputationProgress("Kidnap", 1);
}

/**
 * Ends the online bounty game for the kidnapper
 * @returns {void} - Nothing
 */
function KidnapLeagueResetOnlineBountyProgress() {
	KidnapLeagueSearchingPlayers = [];
	KidnapLeagueOnlineBountyTarget = 0;
}

/**
 * Loads the kidnap league NPC
 * @type {ScreenLoadHandler}
 */
async function KidnapLeagueLoad() {
	KidnapLeagueBackground = "KidnapLeague";
	if (KidnapLeagueTrainer) {
		CharacterDelete(KidnapLeagueTrainer);
		KidnapLeagueTrainer = /** @type {never} */ (null);
	}
	KidnapLeagueTrainer = CharacterLoadNPC("NPC_KidnapLeague_Trainer");
	KidnapLeagueTrainer.AllowItem = ((KidnapLeagueTrainer.Stage == "100") || (KidnapLeagueTrainer.Stage == "110"));
}

/**
 * Runs and draws the kidnap league,  this room can be used for daily job search
 * @returns {void} - Nothing
 */
function KidnapLeagueRun() {
	if (!DailyJobSubSearchIsActive()) DrawCharacter(Player, 500, 0, 1);
	if (!DailyJobSubSearchIsActive()) DrawCharacter(KidnapLeagueTrainer, 1000, 0, 1);
	if (Player.CanWalk()) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
	DailyJobSubSearchRun();
}

/**
 * Handles clicks in the kidnap league room, this room can be used for daily job search
 * @returns {void} - Nothing
 */
function KidnapLeagueClick() {
	if (!DailyJobSubSearchIsActive() && MouseIn(500, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (!DailyJobSubSearchIsActive() && MouseIn(1000, 0, 500, 1000)) {
		ManagementClubSlaveDialog(KidnapLeagueTrainer);
		CharacterSetCurrent(KidnapLeagueTrainer);
	}
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) {
		if (Player.CanChangeOwnClothes() && (InventoryGet(Player, "Cloth") == null) && (KidnapPlayerCloth != null)) {
			InventoryWear(Player, KidnapPlayerCloth.Asset.Name, "Cloth", KidnapPlayerCloth.Color);
			if (KidnapPlayerClothAccessory != null) InventoryWear(Player, KidnapPlayerClothAccessory.Asset.Name, "ClothAccessory", KidnapPlayerClothAccessory.Color);
			if (KidnapPlayerClothLower != null) InventoryWear(Player, KidnapPlayerClothLower.Asset.Name, "ClothLower", KidnapPlayerClothLower.Color);
		}
		CommonSetScreen("Room", "MainHall");
	}
	DailyJobSubSearchClick();
}

/**
 * Triggered when the player takes a bounty of a given difficulty. An easy bounty lowers the kidnap reputation.
 * @param {number} difficulty - Difficulty factor of the bounty.
 * @returns {void} - Nothing
 */
function KidnapLeagueTakeBounty(difficulty) {
	const lastLocation = KidnapLeagueBountyState?.Location;
	if (KidnapLeagueBountyState) {
		CharacterDelete(KidnapLeagueBountyState.Bounty);
		KidnapLeagueBountyState = null;
	}
	const Bounty = CharacterLoadNPC("NPC_KidnapLeague_RandomKidnapper");
	const Difficulty = difficulty + Math.floor(Math.random() * 4);
	const Location = CommonRandomItemFromList(lastLocation ?? "", KidnapLeagueBountyLocationList);
	KidnapLeagueBountyState = { Bounty, Difficulty, Location, };

	KidnapLeagueArchetype = (Location == "MaidQuarters") ? "Maid" : null;
	KidnapLeagueBountyRemind();
	if (Location == "MaidQuarters") {
		InventoryWear(Bounty, "MaidOutfit1", "Cloth", "Default");
		InventoryWear(Bounty, "MaidHairband1", "Hat", "Default");
	} else if (Location == "Shibari") {
		InventoryWear(Bounty, "ChineseDress1", "Cloth");
	}
}

/**
 * Triggered when the league trainer reminds the player of her current bounty. The proper character dialog for it is set.
 * @returns {void} - Nothing
 */
function KidnapLeagueBountyRemind() {
	if (!KidnapLeagueBountyState) return;
	KidnapLeagueTrainer.CurrentDialog = DialogFind(KidnapLeagueTrainer, "Bounty" + KidnapLeagueBountyState.Location).replace("BOUNTYNAME", KidnapLeagueBountyState.Bounty.Name).replace("BOUNTYAMOUNT", CharacterMoneyFormat(25 + KidnapLeagueBountyState.Difficulty * 2));
}

/**
 * Starts the bounty hunter mission in the kidnap league screen.
 * @returns {SafePromise<void>} - Nothing
 */
async function KidnapLeagueBountyStart() {
	if (!KidnapLeagueBountyState) return;
	await CommonSetScreen("Room", "KidnapLeague");
	const { Bounty, Location } = KidnapLeagueBountyState;
	KidnapLeagueBackground = Location;
	Bounty.Stage = "50";
	CharacterSetCurrent(Bounty);
	Bounty.CurrentDialog = DialogFind(Bounty, "Bounty" + Location);
}

/**
 * Starts the bounty hunter fight with its settings.
 * @returns {void} - Nothing
 */
function KidnapLeagueBountyFightStart() {
	if (!KidnapLeagueBountyState) return;
	const { Bounty, Location, Difficulty } = KidnapLeagueBountyState;
	KidnapStart(Bounty, Location, Difficulty, (victory) => CommonPromiseCatch(KidnapLeagueBountyFightEnd(victory)));
}

/**
 * Ends the bounty hunter fight and goes back to the kidnap league screen.
 * @param {boolean} victory - Whether the player won the encounter
 * @returns {SafePromise<void>} - Nothing
 */
async function KidnapLeagueBountyFightEnd(victory) {
	if (!KidnapLeagueBountyState) return;
	CurrentDarkFactor = 1.0;
	KidnapLeagueRandomActivityCount = 0;
	const { Bounty, Location } = KidnapLeagueBountyState;
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(Bounty));
	Bounty.AllowItem = victory;
	KidnapLeagueBountyState.Victory = victory;
	Bounty.Stage = victory ? "101" : "201";
	KidnapLeagueRandomKidnapper = Bounty;
	if (!victory) CharacterRelease(Bounty);
	await CommonSetScreen("Room", "KidnapLeague");
	KidnapLeagueBackground = Location;
	CharacterSetCurrent(Bounty);
	Bounty.CurrentDialog = DialogFind(Bounty, victory ? "BountyVictory" : "BountyDefeat");
	KidnapLeagueWillPayForFreedom = false;
}

/**
 * Triggered when the player pays for a kidnap league bounty.
 * @returns {void} - Nothing
 */
function KidnapLeagueBountyPay() {
	if (!KidnapLeagueBountyState) return;
	const { Difficulty } = KidnapLeagueBountyState;
	KidnapLeagueTrainer.CurrentDialog = DialogFind(KidnapLeagueTrainer, "BountyPay").replace("BOUNTYAMOUNT", CharacterMoneyFormat(25 + Difficulty * 2));
	CharacterChangeMoney(Player, 25 + Difficulty * 2);
	KidnapLeagueBountyReset();
}

/**
 * Resets the current kidnap league bounty so another one can be taken. The harder the battle, the more reputation the player gains.
 * @returns {void} - Nothing
 */
function KidnapLeagueBountyReset() {
	if (!KidnapLeagueBountyState) return;
	const { Bounty, Difficulty, Victory } = KidnapLeagueBountyState;
	ReputationProgress("Kidnap", Victory ? 2 + Math.floor(Difficulty / 2) : 1);
	CharacterDelete(Bounty);
	KidnapLeagueBountyState = null;
}

/**
 * Starts a kidnap game with the player against the trainer. An easy fight will lower the player dominant reputation.
 * @param {number} Difficulty - Difficulty ratio of the encounter
 * @returns {void} - Nothing
 */
function KidnapLeagueStartKidnap(Difficulty) {
	if (Difficulty < 0) ReputationProgress("Dominant", -2);
	KidnapStart(KidnapLeagueTrainer, "KidnapLeague", Difficulty, (victory) => CommonPromiseCatch(KidnapLeagueEndKidnap(victory)));
}

/**
 * Ends a kidnap match ends. Send the player to the kidnap league screen and sets the right trainer dialog.
 * @param {boolean} victory - Whether the player won the encounter
 * @returns {SafePromise<void>} - Nothing
 */
async function KidnapLeagueEndKidnap(victory) {
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(KidnapLeagueTrainer));
	KidnapLeagueTrainer.AllowItem = victory;
	KidnapLeagueTrainer.Stage = victory ? "100" : "200";
	if (!victory) CharacterRelease(KidnapLeagueTrainer);
	await CommonSetScreen("Room", "KidnapLeague");
	CharacterSetCurrent(KidnapLeagueTrainer);
	KidnapLeagueTrainer.CurrentDialog = DialogFind(KidnapLeagueTrainer, victory ? "KidnapVictory" : "KidnapDefeat");
}

/**
 * Resets the player and teacher for another kidnapping by releasing them and dressing them up.
 * @returns {void} - Nothing
 */
function KidnapLeagueResetTrainer() {
	KidnapLeagueTrainer.AllowItem = false;
	CharacterRelease(Player);
	CharacterRelease(KidnapLeagueTrainer);
	if ((InventoryGet(Player, "Cloth") == null) && (KidnapPlayerCloth != null)) {
		InventoryWear(Player, KidnapPlayerCloth.Asset.Name, "Cloth", KidnapPlayerCloth.Color);
		if (KidnapPlayerClothAccessory != null) InventoryWear(Player, KidnapPlayerClothAccessory.Asset.Name, "ClothAccessory", KidnapPlayerClothAccessory.Color);
		if (KidnapPlayerClothLower != null) InventoryWear(Player, KidnapPlayerClothLower.Asset.Name, "ClothLower", KidnapPlayerClothLower.Color);
	}
	if ((InventoryGet(KidnapLeagueTrainer, "Cloth") == null) && (KidnapOpponentCloth != null)) {
		InventoryWear(KidnapLeagueTrainer, KidnapOpponentCloth.Asset.Name, "Cloth", KidnapOpponentCloth.Color);
		if (KidnapOpponentClothAccessory != null) InventoryWear(KidnapLeagueTrainer, KidnapOpponentClothAccessory.Asset.Name, "ClothAccessory", KidnapOpponentClothAccessory.Color);
		if (KidnapOpponentClothLower != null) InventoryWear(KidnapLeagueTrainer, KidnapOpponentClothLower.Asset.Name, "ClothLower", KidnapOpponentClothLower.Color);
	}
}

/**
 * Triggered at the start of a match, sets a random intro sequence.
 * @returns {Promise<void>} - Nothing
 */
async function KidnapLeagueRandomIntro() {

	// Sets the kidnapping scene
	await CommonSetScreen("Room", "KidnapLeague");
	KidnapLeagueBackground = "MainHall";
	if (KidnapLeagueRandomKidnapper) {
		CharacterDelete(KidnapLeagueRandomKidnapper, false);
		KidnapLeagueRandomKidnapper = null;
	}
	KidnapLeagueRandomKidnapper = CharacterLoadNPC("NPC_KidnapLeague_RandomKidnapper");
	CharacterSetCurrent(KidnapLeagueRandomKidnapper);

	// A Mistress can pop if the player is a master kidnapper
	if ((ReputationGet("Kidnap") >= 100) && (Math.floor(Math.random() * 10) == 0)) {
		CharacterArchetypeClothes(KidnapLeagueRandomKidnapper, "Mistress");
		KidnapLeagueRandomKidnapperScenario = "7";
		KidnapLeagueRandomKidnapperDifficulty = 10;
		KidnapLeagueArchetype = "Mistress";
	} else {
		KidnapLeagueRandomKidnapperScenario = (Math.floor(Math.random() * 7)).toString();
		KidnapLeagueRandomKidnapperDifficulty = Math.floor(Math.random() * 7);
		KidnapLeagueArchetype = "";
		if (KidnapLeagueRandomKidnapperScenario == "6") {
			CharacterArchetypeClothes(KidnapLeagueRandomKidnapper, "AnimeGirl");
			KidnapLeagueArchetype = "AnimeGirl";
		}
	}

	// If the player is already tied up, we skip the fight
	if (Player.CanInteract()) {
		KidnapLeagueRandomKidnapper.Stage = KidnapLeagueRandomKidnapperScenario.toString();
		KidnapLeagueRandomKidnapper.CurrentDialog = DialogFind(KidnapLeagueRandomKidnapper, "Intro" + KidnapLeagueRandomKidnapperScenario);
	} else {
		KidnapLeagueRandomKidnapper.Stage = "202";
		KidnapLeagueRandomKidnapper.CurrentDialog = DialogFind(KidnapLeagueRandomKidnapper, "Automatic" + KidnapLeagueRandomKidnapperScenario);
	}
}

/**
 * Triggered at the end of a match, sets a random outro sequence.
 * @param {boolean} victory - Wether the player won or not
 * @param {boolean} surrender - Wether the player surrendered or not
 * @returns {SafePromise<void>} - Nothing
 */
async function KidnapLeagueRandomOutro(victory, surrender) {
	if (!KidnapLeagueRandomKidnapper) return;
	KidnapLeagueRandomActivityCount = 0;
	await CommonSetScreen("Room", "KidnapLeague");
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(KidnapLeagueRandomKidnapper));
	KidnapLeagueBackground = "MainHall";
	if (!surrender) ReputationProgress("Kidnap", victory ? 4 : 2);
	KidnapLeagueRandomKidnapper.AllowItem = victory;
	KidnapLeagueRandomKidnapper.Stage = victory ? "100" : "200";
	KidnapLeagueWillPayForFreedom = (Math.random() >= 0.5);
	if (!victory) CharacterRelease(KidnapLeagueRandomKidnapper);
	CharacterSetCurrent(KidnapLeagueRandomKidnapper);
	if (surrender) {
		KidnapLeagueRandomKidnapper.Stage = "205";
		InventoryWearRandom(Player, "ItemArms", KidnapLeagueRandomKidnapperDifficulty);
		KidnapLeagueRandomKidnapper.CurrentDialog = DialogFind(KidnapLeagueRandomKidnapper, "Surrender" + KidnapLeagueRandomKidnapperScenario);
	} else {
		KidnapLeagueRandomKidnapper.CurrentDialog = DialogFind(KidnapLeagueRandomKidnapper, (victory ? "Victory" : "Defeat") + KidnapLeagueRandomKidnapperScenario);
	}
}

/**
 * Triggered when a random kidnap match starts. We start the kidnap minigame with the appropriate settings.
 * @returns {void} - Nothing
 */
function KidnapLeagueRandomStart() {
	if (!KidnapLeagueRandomKidnapper) return;
	KidnapStart(KidnapLeagueRandomKidnapper, "MainHall", KidnapLeagueRandomKidnapperDifficulty, (victory, surrender) => CommonPromiseCatch(KidnapLeagueRandomOutro(victory, surrender)));
}

/**
 * Triggered when a the player successfully bribes her way out of a fight
 * @param {number} Amount - Amount paid (positive number)
 * @returns {void} - Nothing
 */
function KidnapLeagueRandomBribe(Amount) {
	CharacterChangeMoney(Player, Amount * -1);
	DialogLeave();
	CommonSetScreen("Room", "MainHall");
}

/**
 * Triggered when the player surrenders during a kidnap match, the match ends early.
 * @returns {void} - Nothing
 */
function KidnapLeagueRandomSurrender() {
	KidnapVictory = false;
	KidnapLeagueRandomOutro(false, true);
}

/**
 * Triggered at the end of a kidnap match. Player is sent to the main hall, dressed back and is unable to do another match for 3 minutes.
 * @returns {void} - Nothing
 */
function KidnapLeagueRandomEnd() {
	if (!KidnapLeagueRandomKidnapper) return;
	if ((InventoryGet(Player, "Cloth") == null) && (KidnapPlayerCloth != null)) {
		InventoryWear(Player, KidnapPlayerCloth.Asset.Name, "Cloth", KidnapPlayerCloth.Color);
		if (KidnapPlayerClothAccessory != null) InventoryWear(Player, KidnapPlayerClothAccessory.Asset.Name, "ClothAccessory", KidnapPlayerClothAccessory.Color);
		if (KidnapPlayerClothLower != null) InventoryWear(Player, KidnapPlayerClothLower.Asset.Name, "ClothLower", KidnapPlayerClothLower.Color);
	}
	if ((InventoryGet(KidnapLeagueRandomKidnapper, "Cloth") == null) && (KidnapOpponentCloth != null)) {
		InventoryWear(KidnapLeagueRandomKidnapper, KidnapOpponentCloth.Asset.Name, "Cloth", KidnapOpponentCloth.Color);
		if (KidnapOpponentClothAccessory != null) InventoryWear(KidnapLeagueRandomKidnapper, KidnapOpponentClothAccessory.Asset.Name, "ClothAccessory", KidnapOpponentClothAccessory.Color);
		if (KidnapOpponentClothLower != null) InventoryWear(KidnapLeagueRandomKidnapper, KidnapOpponentClothLower.Asset.Name, "ClothLower", KidnapOpponentClothLower.Color);
	}
	DialogLeave();
	CommonSetScreen("Room", "MainHall");
}

/**
 * Triggered when we need to show the amount of money the NPC offers to get out.
 * @returns {void} - Nothing
 */
function KidnapLeagueRandomMoneyAmount() {
	if (!KidnapLeagueRandomKidnapper) return;
	KidnapLeagueRandomKidnapper.CurrentDialog = KidnapLeagueRandomKidnapper.CurrentDialog.replace("DIALOGMONEY", (10 + KidnapLeagueRandomKidnapperDifficulty * 2).toString());
}

/**
 * Triggered when accepts the NPC's offer to pay for freedom, we lower the kidnap reputation.
 * @returns {void} - Nothing
 */
function KidnapLeagueRandomEndMoney() {
	CharacterChangeMoney(Player, 10 + KidnapLeagueRandomKidnapperDifficulty * 2);
	ReputationProgress("Kidnap", -2);
	KidnapLeagueRandomEnd();
}

/**
 * When a random activity starts, set the related NPC dialog and stage
 * @param {string} A - Name of the activity to perform.
 * @returns {void} - Nothing
 */
function KidnapLeagueRandomActivityStart(A) {
	if (!KidnapLeagueRandomKidnapper) return;
	KidnapLeagueRandomKidnapper.CurrentDialog = DialogFind(KidnapLeagueRandomKidnapper, "Activity" + A + "Intro");
	KidnapLeagueRandomKidnapper.Stage = "Activity" + A;
}

/**
 * Triggered when the kidnapper does a random activity on the player.
 * @returns {void} - Nothing
 */
function KidnapLeagueRandomActivityLaunch() {

	// After 4 activities, there's more and more chances that the player will be released
	KidnapLeagueRandomActivityCount++;
	if (Math.random() * KidnapLeagueRandomActivityCount >= 4) {
		KidnapLeagueRandomActivityCount = 0;
		if ((InventoryGet(Player, "Cloth") == null) && (KidnapPlayerCloth != null)) {
			InventoryWear(Player, KidnapPlayerCloth.Asset.Name, "Cloth", KidnapPlayerCloth.Color);
			if (KidnapPlayerClothAccessory != null) InventoryWear(Player, KidnapPlayerClothAccessory.Asset.Name, "ClothAccessory", KidnapPlayerClothAccessory.Color);
			if (KidnapPlayerClothLower != null) InventoryWear(Player, KidnapPlayerClothLower.Asset.Name, "ClothLower", KidnapPlayerClothLower.Color);
		}
		if ((!InventoryCharacterHasOwnerOnlyRestraint(Player)) && (!InventoryCharacterHasLoverOnlyRestraint(Player)) && (!InventoryCharacterHasFamilyOnlyRestraint(Player))){
			CharacterRelease(Player);
			KidnapLeagueRandomActivityStart("End");
			KidnapLeagueVisitRoom = ((Math.random() >= 0.5) && KidnapLeagueCanTransferToRoom());
		} else KidnapLeagueRandomActivityStart("EndNoRelease");
		return;
	}

	const targetGroups = /** @type {const} */ ({
		"AddGag": "ItemMouth",
		"RemoveGag": "ItemMouth",
		"AddFeet": "ItemFeet",
		"RemoveFeet": "ItemFeet",
		"AddLegs": "ItemLegs",
		"RemoveLegs": "ItemLegs",
	});

	// Finds an activity to do on the player
	while (true) {

		// Picks an activity at random
		KidnapLeagueRandomActivity = CommonRandomItemFromList(KidnapLeagueRandomActivity, KidnapLeagueRandomActivityList);

		// Add or remove an item
		switch (KidnapLeagueRandomActivity) {
			case "AddGag":
			case "AddFeet":
			case "AddLegs": {
				const group = targetGroups[KidnapLeagueRandomActivity];
				if (!InventoryIsWorn(Player, group, "None")) continue;
				if ((group === "ItemLegs" || group === "ItemFeet") && !Player.IsKneeling()) continue;
				InventoryWearRandom(Player, group, KidnapLeagueRandomKidnapperDifficulty);
				KidnapLeagueRandomActivityStart(KidnapLeagueRandomActivity);
				return;
			}

			case "RemoveGag":
			case "RemoveFeet":
			case "RemoveLegs": {
				const group = targetGroups[KidnapLeagueRandomActivity];
				const item = InventoryGet(Player, group);
				if (!item) continue;
				if (InventoryOwnerOnlyItem(item) || InventoryLoverOnlyItem(item) || InventoryFamilyOnlyItem(item)) continue;
				InventoryRemove(Player, group);
				KidnapLeagueRandomActivityStart(KidnapLeagueRandomActivity);
				return;
			}

			// Physical activities
			case "Kiss":
				if (!InventoryIsWorn(Player, "ItemMouth", "None")) continue;
				KidnapLeagueRandomActivityStart(KidnapLeagueRandomActivity);
				return;

			case "Tickle":
			case "Spank":
			case "Fondle":
				KidnapLeagueRandomActivityStart(KidnapLeagueRandomActivity);
				return;

			default:
				break;
		}
	}
}

/**
 * Triggered when the player transfers the kidnapper to her room, they are sent to the private room.
 * @returns {void} - Nothing
 */
function KidnapLeagueTransferToRoom() {
	if (!KidnapLeagueRandomKidnapper) return;
	KidnapLeagueRandomEnd();
	CharacterRelease(Player);
	CommonSetScreen("Room", "Private");
	PrivateAddCharacter(KidnapLeagueRandomKidnapper, KidnapLeagueArchetype);
}

/**
 * When the player starts a club card game
 * @returns {void} - Nothing
 */
function KidnapLeagueRandomClubCardStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, ClubCardBuilderPornDeck, () => { KidnapLeagueRandomClubCardEnd(); });
}

/**
 * When the player ends a club card game
 * @returns {SafePromise<void>}
 */
async function KidnapLeagueRandomClubCardEnd() {
	if (!KidnapLeagueRandomKidnapper) return;
	await CommonSetScreen("Room", "KidnapLeague");
	CharacterSetCurrent(KidnapLeagueRandomKidnapper);
	KidnapLeagueRandomKidnapper.CurrentDialog = DialogFind(KidnapLeagueRandomKidnapper, MiniGameVictory ? "ClubCardVictory" : "ClubCardDefeat");
	if (!MiniGameVictory) InventoryWearRandom(Player, "ItemArms", 8);
	KidnapLeagueRandomActivityCount = 0;
	KidnapLeagueRandomKidnapper.AllowItem = MiniGameVictory;
	KidnapLeagueRandomKidnapper.Stage = (MiniGameVictory) ? "100" : "200";
}

/**
 * Returns TRUE if the player can get the anime girl costume
 * @returns {boolean} - TRUE if it's possible
 */
function KidnapLeagueCanGetAnimeGirl() {
	return !InventoryAvailable(Player, "AnimeGirl", "Cloth") && (KidnapLeagueArchetype == "AnimeGirl");
}

/**
 * Gives the anime girl costume to the player and wear it
 * @returns {void} - Nothing
 */
function KidnapLeagueWearAnimeGirl() {
	CharacterArchetypeClothes(Player, "AnimeGirl");
	ServerPlayerInventorySync();
}

/**
 * Returns TRUE if the player is wearing the anime girl costume
 * @returns {boolean} - TRUE if wearing
 */
function KidnapLeaguePlayerIsAnimeGirl() {
	return InventoryIsWorn(Player, "Cloth", "AnimeGirl");
}
