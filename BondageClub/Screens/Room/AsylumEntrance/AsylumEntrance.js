"use strict";
var AsylumEntranceBackground = "AsylumEntrance";
/** @type {NPCCharacter} */
var AsylumEntranceNurse = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var AsylumEntranceKidnapNurse = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var AsylumEntranceEscapedPatient = /** @type {never} */ (null);
var AsylumEntranceEscapedPatientWillBribe = false;
var AsylumEntranceEscapedPatientWillJoin = false;

/**
 * Longest asylum commitment accepted on load. The game never commits anyone for
 *  anywhere near this long; anything further out is treated as corrupt, as
 *  CellLoad does for long cell timers.
 */
var AsylumEntranceMaxCommitment = 7 * 24 * 60 * 60 * 1000;

/**
 * Checks, if the player is able to leave the Asylum
 * @returns {boolean} - Returns true, if the player is able to leave, false otherwise
 */
function AsylumEntranceCanWander() { return (Player.CanWalk() && (!AsylumIsCommitted() || !AsylumIsIsolated() || (AsylumGGTSGetLevel(Player) >= 6) || ((ReputationGet("Asylum") >= 1) && AsylumEntranceIsWearingNurseClothes()))); }
/**
 * Checks, if the player can bring the nurse to her private room
 * @returns {boolean} - Returns true, if the player can drag the nurse to her private roo, false otherwise
 */
function AsylumEntranceCanTransferToRoom() { return PrivateHasEmptySlot(); }
/**
 * CHecks if the player can kiss the nurse
 * @returns {boolean} - Returns true, if the player can kiss the nurse, false otherwise
 */
function AsylumEntranceCanKiss() { return (Player.CanTalk() && !!CurrentCharacter?.CanTalk()); }
/**
 * Checks if the player can have a nurse uniform of her own
 * @returns {boolean} - Returns true, if the player can have her own nurse uniform, false otherwise
 */
function AsylumEntranceCanGetNurseUniform() { return ((ReputationGet("Asylum") >= 50) && (!DialogInventoryAvailable("NurseUniform", "Cloth") || !DialogInventoryAvailable("NurseCap", "Hat"))); }
/**
 * Returns TRUE if the nurse is collared by GGTS
 * @returns {boolean} - Returns TRUE if the nurse is collared by GGTS
 */
function AsylumEntranceNurseHasGGTSCollar() { return (AsylumGGTSGetLevel(Player) >= 4); }
/**
 * Returns TRUE if the player and the current character can play Club Card
 * @returns {boolean} - Returns TRUE if both aren't restrained
 */
function AsylumEntranceCanPlayClubCard() { return (!Player.IsRestrained() && !CurrentCharacter?.IsRestrained() && !Player.IsGagged() && !CurrentCharacter?.IsGagged()); }

/**
 * Whether the player has been isolated to the asylum
 * @returns {boolean}
 */
function AsylumIsIsolated() { return (LogValue("Isolated", "Asylum") ?? 0) >= CurrentTime; }

/**
 * Whether the player is committed to the asylum
 * @returns {boolean}
 */
function AsylumIsCommitted() { return (LogValue("Committed", "Asylum") ?? 0) >= CurrentTime; }

/**
 * Whether the player is forced to do GGTS time
 * @returns {boolean}
 */
function AsylumHasForcedGGTSTime() { return (LogValue("ForceGGTS", "Asylum") ?? 0) > 0; }

/**
 * Whether the player has escaped the asylum
 * @returns {boolean}
 */
function AsylumHasEscaped() { return (LogValue("Escaped", "Asylum") ?? 0) >= CurrentTime; }

/**
 * Loads the room and generates the nurse. Is called dynamically
 * @type {ScreenLoadHandler}
 */
async function AsylumEntranceLoad() {
	// Mirror CellLoad: discard commitments beyond anything the game creates
	if ((LogValue("Committed", "Asylum") ?? 0) > CurrentTime + AsylumEntranceMaxCommitment)
		LogDelete("Committed", "Asylum");

	AsylumEntranceBackground = "AsylumEntrance";
	if (!AsylumEntranceNurse) {
		AsylumEntranceNurse = CharacterLoadNPC("NPC_AsylumEntrance_Nurse");
		AsylumEntranceWearNurseClothes(AsylumEntranceNurse);
		AsylumEntranceNurse.AllowItem = false;
	}
	if (AsylumGGTSGetLevel(Player) >= 4) InventoryWear(AsylumEntranceNurse, "FuturisticCollar", "ItemNeck");
}

/**
 * // Runs the room (shows the nurse, player, icons and committed time).
 * Is called over and over again, so don't call expensive functions or loops from here.
 * @returns {void} - Nothing
 */
function AsylumEntranceRun() {
	DrawCharacter(Player, 500, 0, 1);
	DrawCharacter(AsylumEntranceNurse, 1000, 0, 1);
	if (Player.CanWalk() && !AsylumIsIsolated() && !AsylumIsCommitted() && AsylumGGTSGetLevel(Player) <= 5 && !AsylumHasForcedGGTSTime())
		DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
	if (AsylumEntranceCanWander()) DrawButton(1885, 265, 90, 90, "", "White", "Icons/Chat.png", TextGet("ChatRoom"));
	if (AsylumEntranceCanWander()) DrawButton(1885, 385, 90, 90, "", "White", "Icons/Bedroom.png", TextGet("Bedroom"));
	if (AsylumEntranceCanWander()) DrawButton(1885, 505, 90, 90, "", "White", "Icons/FriendList.png", TextGet("Meeting"));
	if (AsylumEntranceCanWander()) DrawButton(1885, 625, 90, 90, "", "White", "Icons/Therapy.png", TextGet("Therapy"));
	if (AsylumEntranceCanWander() || AsylumHasForcedGGTSTime()) DrawButton(1885, 745, 90, 90, "", "White", "Icons/GGTS.png", TextGet("GGTS"));
	if (AsylumIsIsolated()) {
		DrawText(TextGet("IsolationTime"), 1800, 915, "white", "gray");
		DrawText(TimerToString((LogValue("Isolated", "Asylum") ?? 0) - CurrentTime), 1800, 965, "white", "gray");
	} else if (AsylumIsCommitted()) {
		DrawText(TextGet("RemainingTime"), 1800, 915, "white", "gray");
		DrawText(TimerToString((LogValue("Committed", "Asylum") ?? 0) - CurrentTime), 1800, 965, "white", "gray");
	}
	if (AsylumHasForcedGGTSTime()) {
		DrawText(TextGet("ForceGGTS"), 200, 915, "white", "gray");
		DrawText(TimerToString(LogValue("ForceGGTS", "Asylum") ?? 0), 200, 965, "white", "gray");
	}
}

/**
 * Handles the click events. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function AsylumEntranceClick() {
	if (MouseIn(500, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (MouseIn(1000, 0, 500, 1000)) {
		if (AsylumGGTSGetLevel(Player) >= 6) AsylumEntranceNurse.Stage = "400";
		else if (AsylumIsIsolated()) AsylumEntranceNurse.Stage = "200";
		else if (AsylumIsCommitted()) AsylumEntranceNurse.Stage = "100";
		else if (AsylumEntranceNurse.Stage == "100") AsylumEntranceNurse.Stage = "0";
		if (!AsylumIsIsolated() && AsylumHasEscaped() && !AsylumEntranceNurse.IsRestrained()) AsylumEntranceNurse.Stage = "140";
		ManagementClubSlaveDialog(AsylumEntranceNurse);
		CharacterSetCurrent(AsylumEntranceNurse);
	}
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk() && !AsylumIsCommitted() && !AsylumIsIsolated() && AsylumGGTSGetLevel(Player) <= 5 && !AsylumHasForcedGGTSTime())
		CommonSetScreen("Room", "MainHall");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
	if (MouseIn(1885, 265, 90, 90) && AsylumEntranceCanWander()) AsylumEntranceStartChat();
	if (MouseIn(1885, 385, 90, 90) && AsylumEntranceCanWander()) CommonSetScreen("Room", "AsylumBedroom");
	if (MouseIn(1885, 505, 90, 90) && AsylumEntranceCanWander()) CommonSetScreen("Room", "AsylumMeeting");
	if (MouseIn(1885, 625, 90, 90) && AsylumEntranceCanWander()) CommonSetScreen("Room", "AsylumTherapy");
	if (MouseIn(1885, 745, 90, 90) && (AsylumEntranceCanWander() || AsylumHasForcedGGTSTime())) CommonSetScreen("Room", "AsylumGGTS");
}

/**
 * Enters the online chat room in "Asylum mode"
 * @returns {void} - Nothing
 */
function AsylumEntranceStartChat() {
	ChatSearchStart("Asylum", ["Room", "AsylumEntrance"], { Background: "AsylumEntrance", BackgroundTagList: [BackgroundsTagAsylum], });
}

// Wears the nurse clothes on a character (same as nursery)
/**
 * Dresses a given character as a nurse
 * @param {Character} C - The character to dress
 * @returns {void} - Nothing
 */
function AsylumEntranceWearNurseClothes(C) {
	InventoryWear(C, "NurseUniform", "Cloth", "#848080");
	InventoryWear(C, "NurseCap", "Hat", "Default");
	InventoryWear(C, "Stockings2", "Socks", "Default");
	InventoryRemove(C, "ClothLower");
	InventoryRemove(C, "ClothAccessory");
}

/**
 * Dresses the player as a patient. Used in dialogs.
 */
function AsylumEntrancePlayerWearPatientClothes() {
	AsylumEntranceWearPatientClothes(Player);
}

/**
 * Dresses a given character as a patient. Removes all clothes and respects cosplay rules
 * @param {Character} C - The character to dress
 * @param {boolean} [ExtraEvent] - Should we process extra events for login or GGTS
 * @returns {void} - Nothing
 */
function AsylumEntranceWearPatientClothes(C, ExtraEvent) {
	InventoryWear(C, "TShirt1", "Cloth", "#500028");
	InventoryWear(C, "Pajama1", "ClothLower", "#FF0080");
	InventoryWear(C, "Socks2", "Socks", "#CCCCCC");
	InventoryRemove(C, "Shoes");
	InventoryRemove(C, "Gloves");
	InventoryRemove(C, "HairAccessory1");
	if (C.IsNpc() || C.OnlineSharedSettings && !C.OnlineSharedSettings.BlockBodyCosplay) {
		InventoryRemove(C, "HairAccessory2");
		InventoryRemove(C, "Wings");
		InventoryRemove(C, "TailStraps");
	}
	InventoryRemove(C, "HairAccessory3");
	InventoryRemove(C, "Hat");

	// Wears the GGTS items based on the player level
	if (ExtraEvent && AsylumIsIsolated()) {
		CharacterRelease(C);
		if (AsylumGGTSGetLevel(C) >= 2) {
			InventoryWear(C, "FuturisticCuffs", "ItemArms");
			InventoryWear(C, "FuturisticAnkleCuffs", "ItemFeet");
		}
		if (AsylumGGTSGetLevel(C) >= 3) CharacterNaked(C);
		if (AsylumGGTSGetLevel(C) >= 4) {
			InventoryWear(C, "FuturisticChastityBelt", "ItemPelvis");
			let Item = InventoryGet(Player, "ItemPelvis");
			if ((Item != null) && (Item.Asset != null) && (Item.Asset.Name == "FuturisticChastityBelt")) {
				ExtendedItemSetOptionByRecord(Player, Item, { m: 0, f: 1, b: 1, t: 0, o: 0 });
				Item.Color = ["#D06060", "#803030", "Default", "Default", "Default", "Default", "#222222", "Default"];
			}
			InventoryWear(C, "FuturisticBra", "ItemBreast");
			InventoryWear(C, "FuturisticHarness", "ItemTorso");
		}
		if (AsylumGGTSGetLevel(C) >= 5) {
			if ((InventoryGet(C, "ItemNeck") == null) || !Player.IsOwned()) InventoryWear(C, "FuturisticCollar", "ItemNeck");
			InventoryWear(C, "FuturisticEarphones", "ItemEars");
			InventoryWear(C, "FuturisticMask", "ItemHead");
		}
	}

	// Adds an extra strait-jacket for seasoned patients
	if (ExtraEvent && (ReputationGet("Asylum") <= -50) && (InventoryGet(C, "ItemArms") == null)) AsylumEntrancePlayerJacket("Normal");

}

/**
 * Checks, if the player is dressed as a patient
 * @returns {boolean} - Returns true, if the player is dressed as a patient, false otherwise
 */
function AsylumEntranceIsWearingPatientClothes() {
	if (InventoryGet(Player, "Cloth")?.Asset.Name !== "TShirt1") return false;
	if (InventoryGet(Player, "ClothLower")?.Asset.Name !== "Pajama1") return false;
	if (InventoryGet(Player, "Socks")?.Asset.Name !== "Socks2") return false;
	if (InventoryGet(Player, "Shoes") != null) return false;
	if (InventoryGet(Player, "Gloves") != null) return false;
	if (InventoryGet(Player, "HairAccessory1") != null) return false;
	if (InventoryGet(Player, "HairAccessory2") != null && !Player.OnlineSharedSettings.BlockBodyCosplay) return false;
	if (InventoryGet(Player, "Wings") != null && !Player.OnlineSharedSettings.BlockBodyCosplay) return false;
	if (InventoryGet(Player, "TailStraps") != null && !Player.OnlineSharedSettings.BlockBodyCosplay) return false;
	if (InventoryGet(Player, "HairAccessory3") != null) return false;
	if (InventoryGet(Player, "Hat") != null) return false;
	return true;
}

/**
 * Checks, if the player is dressed as a nurse
 * @returns {boolean} - Returns true, if the player is dressed as a nurse, false otherwise
 */
function AsylumEntranceIsWearingNurseClothes() {
	if (InventoryGet(Player, "Cloth")?.Asset.Name !== "NurseUniform") return false;
	if (InventoryGet(Player, "Hat")?.Asset.Name !== "NurseCap") return false;
	if (InventoryGet(Player, "Socks")?.Asset.Name !== "Stockings2") return false;
	return true;
}

// When a patient gets committed
/**
 * Commits a player to the asylum for a given time and changes the players reputation
 * @param {number} Duration - The time (in micro seconds) the player gets committed for
 * @param {number} ReputationChange - The amount the player's reputation is going to change
 * @returns {void} - Nothing
 */
function AsylumEntranceCommitPatient(Duration, ReputationChange) {
	LogAdd("Committed", "Asylum", CurrentTime + Duration);
	if (ReputationGet("Asylum") >= 0) DialogSetReputation("Asylum", -1);
	DialogChangeReputation("Asylum", ReputationChange * -1);
}

/**
 * The player starts working as a nurse for the Asylum. Dresses the player and sets her reputation to 1
 * @returns {void} - Nothing
 */
function AsylumEntranceStartNurse() {
	AsylumEntranceWearNurseClothes(Player);
	if (ReputationGet("Asylum") <= 0) DialogSetReputation("Asylum", 1);
}

// When a patient player fights for her freedom against the nurse
/**
 * Starts the fight for freedom between the player and the nurse
 * @returns {void} - Nothing
 */
function AsylumEntranceFightNurse() {
	KidnapStart(AsylumEntranceNurse, "AsylumEntrance", 7, (victory) => CommonPromiseCatch(AsylumEntranceFightNurseEnd(victory)));
}

/**
 * Resolves the result of the fight against the nurse
 * @param {boolean} victory - Wether the player won or not
 * @returns {SafePromise<void>}
 */
async function AsylumEntranceFightNurseEnd(victory) {
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(AsylumEntranceNurse));
	AsylumEntranceNurse.Stage = victory ? "120" : "130";
	DialogChangeReputation("Asylum", -6);
	CharacterRelease(victory ? Player : AsylumEntranceNurse);
	AsylumEntranceWearNurseClothes(AsylumEntranceNurse);
	AsylumEntranceWearPatientClothes(Player);
	InventoryRemove(AsylumEntranceNurse, "ItemHead");
	InventoryRemove(AsylumEntranceNurse, "ItemHood");
	InventoryRemove(AsylumEntranceNurse, "ItemNose");
	InventoryRemove(AsylumEntranceNurse, "ItemMouth");
	InventoryRemove(AsylumEntranceNurse, "ItemFeet");
	InventoryRemove(AsylumEntranceNurse, "ItemNeck");
	InventoryRemove(Player, "ItemHead");
	InventoryRemove(Player, "ItemHood");
	InventoryRemove(Player, "ItemNose");
	InventoryRemove(Player, "ItemMouth");
	InventoryRemove(Player, "ItemFeet");
	await CommonSetScreen("Room", "AsylumEntrance");
	CharacterSetCurrent(AsylumEntranceNurse);
	AsylumEntranceNurse.CurrentDialog = DialogFind(AsylumEntranceNurse, victory ? "FightVictory" : "FightDefeat");
}

/**
 * Restrains the player in a straitjacket with a custom difficulty
 * @param {string} Pose - The tightness of the straitjacket
 * @returns {void} - Nothing
 */
function AsylumEntrancePlayerJacket(Pose) {
	const item = InventoryWear(Player, "StraitJacket", "ItemArms", "Default", 3);
	if (item) {
		TypedItemSetOptionByName(Player, item, Pose);
	}
}

/**
 * Handles the theft of the nurse's clothes by the player
 * @param {number} RepChange - The amount of reputation change
 * @returns {void} - Nothing
 */
function AsylumEntrancePlayerNurseClothes(RepChange) {
	DialogChangeReputation("Dominant", RepChange);
	AsylumEntranceWearNurseClothes(Player);
}

/**
 * When the nurse is forced to be a patient (player will be tracked down for a full day after and a title will be forced)
 * @returns {void} - Nothing
 */
function AsylumEntranceNurseBecomePatient() {
	LogAdd("Escaped", "Asylum", CurrentTime + MS_PER_DAY);
	MainHallRandomEventOdds = 0;
	TitleSet("EscapedPatient");
	LogDelete("Committed", "Asylum");
	AsylumEntranceWearPatientClothes(AsylumEntranceNurse);
}

/**
 * Handles the restraining of the nurse by the player
 * @param {number} RepChange - The amount of reputation change for the player
 * @returns {void} - Nothing
 */
function AsylumEntranceNurseStrap(RepChange) {
	DialogChangeReputation("Dominant", RepChange);
	InventoryWear(AsylumEntranceNurse, "StraitJacket", "ItemArms");
	InventoryWear(AsylumEntranceNurse, "SmallBlindfold", "ItemHead");
	InventoryWear(AsylumEntranceNurse, "MuzzleGag", "ItemMouth");
}

//
/**
 * When the player gets committed again after escaping, she is restraint tightly and has to stay for a full day
 * @returns {void} - Nothing
 */
function AsylumEntranceRecommit() {
	DialogChangeReputation("Asylum", -3);
	LogAdd("Committed", "Asylum", CurrentTime + MS_PER_DAY);
	LogDelete("Escaped", "Asylum");
	TitleSet("None");
	CharacterRelease(Player);
	AsylumEntranceWearPatientClothes(Player);
	AsylumEntrancePlayerJacket("Tight");
}

/**
 * Handles the player being caught by a nurse, after escaping the Asylum. The player is brought back and the doors locked
 * @returns {SafePromise<void>}
 */
async function AsylumEntranceNurseCatchEscapedPlayer() {
	await CommonSetScreen("Room", "AsylumEntrance");
	AsylumEntranceBackground = "MainHall";
	CharacterDelete(AsylumEntranceKidnapNurse);

	AsylumEntranceKidnapNurse = CharacterLoadNPC("NPC_AsylumEntrance_KidnapNurse");
	AsylumEntranceWearNurseClothes(AsylumEntranceKidnapNurse);
	AsylumEntranceKidnapNurse.Stage = "0";
	AsylumEntranceKidnapNurse.CurrentDialog = DialogFind(AsylumEntranceKidnapNurse, (Player.CanInteract() ? "Intro" : "Automatic") + (Math.floor(Math.random() * 3)).toString());
	AsylumEntranceKidnapNurse.AllowItem = false;
	CharacterSetCurrent(AsylumEntranceKidnapNurse);
}

/**
 * Handled the player'S fight against the kidnap nurse
 * @returns {void} - Nothing
 */
function AsylumEntranceKidnapNurseFight() {
	DialogChangeReputation("Dominant", 4);
	KidnapStart(AsylumEntranceKidnapNurse, "MainHall", 7, (victory, surrender) => CommonPromiseCatch(AsylumEntranceKidnapNurseFightOutro(victory, surrender)));
}

/**
 * Resolved the fight against the kidnap nurse
 * @param {boolean} victory - Wether the player won or not
 * @param {boolean} surrender - Wether the player surrendered or not
 * @returns {SafePromise<void>}
 */
async function AsylumEntranceKidnapNurseFightOutro(victory, surrender) {
	await CommonSetScreen("Room", "AsylumEntrance");
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(AsylumEntranceKidnapNurse));
	if (surrender) DialogChangeReputation("Dominant", -3);
	AsylumEntranceKidnapNurse.Stage = victory ? "100" : "200";
	if (!victory) CharacterRelease(AsylumEntranceKidnapNurse);
	CharacterSetCurrent(AsylumEntranceKidnapNurse);
	AsylumEntranceKidnapNurse.CurrentDialog = DialogFind(AsylumEntranceKidnapNurse, victory ? "Victory" : "Defeat");
}

/**
 * Handles the bribe attempt of the kidnapping nurse
 * @param {number} BribeAmount - The offered bribe amount
 * @param {number} BribeOdds - The odds of a succesful bribe attempt
 * @returns {void} - Nothing
 */
function AsylumEntranceKidnapNurseBribe(BribeAmount, BribeOdds) {
	if (BribeOdds > Math.random() * 100) {
		CharacterChangeMoney(Player, BribeAmount * -1);
		AsylumEntranceKidnapNurse.Stage = "12";
		AsylumEntranceKidnapNurse.CurrentDialog = DialogFind(AsylumEntranceKidnapNurse, "BribeSuccess");
	} else {
		AsylumEntranceKidnapNurse.Stage = "11";
		AsylumEntranceKidnapNurse.CurrentDialog = DialogFind(AsylumEntranceKidnapNurse, "BribeFailure");
	}
}

/**
 * When the player transfers the kidnap nurse to her room
 * @returns {void} - Nothing
 */
function AsylumEntranceKidnapNurseTransferToRoom() {
	AsylumEntranceWearNurseClothes(AsylumEntranceKidnapNurse);
	CharacterRelease(Player);
	CommonSetScreen("Room", "Private");
	PrivateAddCharacter(AsylumEntranceKidnapNurse, "Nurse");
	DialogLeave();
}

/**
 * When the player leaves the kidnap nurse
 * @type {ScreenExitHandler}
 */
function AsylumEntranceKidnapNurseExit() {
	DialogLeave();
	CommonSetScreen("Room", "MainHall");
}

/**
 * When the escaped player walks back to the asylum
 * @returns {void} - Nothing
 */
function AsylumEntranceGoToAsylum() {
	AsylumEntranceBackground = "AsylumEntrance";
	LogAdd("Committed", "Asylum", CurrentTime + MS_PER_DAY);
	LogDelete("Escaped", "Asylum");
	TitleSet("None");
}

/**
 * When the escaped player is dressed back as a patient
 * @returns {void} - Nothing
 */
function AsylumEntranceBackAsPatient() {
	CharacterRelease(Player);
	AsylumEntranceWearPatientClothes(Player);
	CharacterRelease(AsylumEntranceNurse);
	AsylumEntranceWearNurseClothes(AsylumEntranceNurse);
}

/**
 * The player meets  an escaped patient while on nurse duty
 * @returns {SafePromise<void>}
 */
async function AsylumEntranceEscapedPatientMeet() {
	await CommonSetScreen("Room", "AsylumEntrance");
	AsylumEntranceBackground = "MainHall";
	CharacterDelete(AsylumEntranceEscapedPatient);

	AsylumEntranceEscapedPatient = CharacterLoadNPC("NPC_AsylumEntrance_EscapedPatient");
	AsylumEntranceWearPatientClothes(AsylumEntranceEscapedPatient);
	AsylumEntranceEscapedPatient.Stage = "0";
	AsylumEntranceEscapedPatient.CurrentDialog = DialogFind(AsylumEntranceEscapedPatient, "Intro" + (Math.floor(Math.random() * 3)).toString());
	AsylumEntranceEscapedPatient.AllowItem = false;
	AsylumEntranceEscapedPatientWillBribe = (Math.random() > 0.667);
	AsylumEntranceEscapedPatientWillJoin = ((Math.random() > 0.667) && AsylumEntranceCanTransferToRoom());
	CharacterSetCurrent(AsylumEntranceEscapedPatient);
}

/**
 * When the player starts a fight against the escaped patient
 * @returns {void} - Nothing
 */
function AsylumEntranceEscapedPatientFight() {
	DialogChangeReputation("Asylum", 2);
	DialogChangeReputation("Dominant", 2);
	KidnapStart(AsylumEntranceEscapedPatient, "MainHall", 4, (victory, surrender) => CommonPromiseCatch(AsylumEntranceEscapedPatientFightOutro(victory, surrender)));
}

/**
 * Resolves the fight against an escaped patient
 * @param {boolean} victory - Wether the player won or not
 * @param {boolean} surrender - Wether the player surrendered or not
 * @returns {SafePromise<void>}
 */
async function AsylumEntranceEscapedPatientFightOutro(victory, surrender) {
	await CommonSetScreen("Room", "AsylumEntrance");
	AsylumEntranceBackground = "MainHall";
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(AsylumEntranceEscapedPatient));
	if (surrender) DialogChangeReputation("Dominant", -3);
	AsylumEntranceEscapedPatient.Stage = victory ? "100" : "200";
	if (!victory) CharacterRelease(AsylumEntranceEscapedPatient);
	InventoryRemove(Player, "ItemMouth");
	InventoryRemove(AsylumEntranceEscapedPatient, "ItemMouth");
	CharacterSetCurrent(AsylumEntranceEscapedPatient);
	AsylumEntranceEscapedPatient.CurrentDialog = DialogFind(AsylumEntranceEscapedPatient, victory ? "Victory" : "Defeat");
}

/**
 * Resolves the bribe attempt towards the player by an escaped patient
 * @returns {void} - Nothing
 */
function AsylumEntranceEscapedPatientBribe() {
	CharacterChangeMoney(Player, 5);
	DialogChangeReputation("Asylum", -1);
}

/**
 * When the player transfers a patient to her room
 * @returns {void} - Nothing
 */
function AsylumEntranceEscapedPatientTransferToRoom() {
	AsylumEntranceWearPatientClothes(AsylumEntranceEscapedPatient);
	CharacterRelease(Player);
	CommonSetScreen("Room", "Private");
	PrivateAddCharacter(AsylumEntranceEscapedPatient, "Patient");
	DialogLeave();
}

/**
 * Handles the returning of an escaped patient by the player
 * @returns {void} - Nothing
 */
function AsylumEntranceEscapedPatientTransferToAsylum() {
	AsylumEntranceBackground = "AsylumEntrance";
	CharacterChangeMoney(Player, 15);
	DialogChangeReputation("Asylum", 4);
	CharacterRelease(AsylumEntranceEscapedPatient);
	AsylumEntranceWearPatientClothes(AsylumEntranceEscapedPatient);
	InventoryWear(AsylumEntranceEscapedPatient, "StraitJacket", "ItemArms");
	InventoryWear(AsylumEntranceEscapedPatient, "SmallBlindfold", "ItemHead");
	InventoryWear(AsylumEntranceEscapedPatient, "MuzzleGag", "ItemMouth");
}

/**
 * When the player leaves the escaped patient
 * @returns {void} - Nothing
 */
function AsylumEntranceEscapedPatientLeave() {
	CommonSetScreen("Room", "MainHall");
	DialogLeave();
}

/**
 * The player gets a nurse uniform of her own
 * @returns {void} - Nothing
 */
function AsylumEntranceGiveNurseUniform() {
	/** @type {ItemBundle[]} */
	const ItemsToEarn = [];
	ItemsToEarn.push({Name: "NurseUniform", Group: "Cloth"});
	ItemsToEarn.push({Name: "NurseCap", Group: "Hat"});
	InventoryAddMany(Player, ItemsToEarn);
}

/**
 * Whether or not a patient has earned a set of Asylum restraints.
 * @returns {boolean} - TRUE if the the player is a patient but is not eligible for their own set of Asylum restraints,
 * FALSE otherwise.
 */
function AsylumEntrancePatientCannotGetRestraints() {
	const reputation = ReputationGet("Asylum");
	return reputation <= -1 && reputation > -100 && !LogQuery("ReputationMaxed", "Asylum");
}

/**
 * Whether or not a patient has earned a set of Asylum restraints.
 * @returns {boolean} - TRUE if the the player is a patient and is eligible for their own set of Asylum restraints,
 * FALSE otherwise.
 */
function AsylumEntrancePatientCanGetRestraints() {
	const reputation = ReputationGet("Asylum");
	return reputation <= -100 && !LogQuery("ReputationMaxed", "Asylum");
}

/**
 * Whether or not a nurse has earned a set of Asylum restraints.
 * @returns {boolean} - TRUE if the the player is a nurse but is not eligible for their own set of Asylum restraints,
 * FALSE otherwise.
 */
function AsylumEntranceNurseCannotGetRestraints() {
	const reputation = ReputationGet("Asylum");
	return reputation >= 1 && reputation < 100 && !LogQuery("ReputationMaxed", "Asylum");
}

/**
 * Whether or not a nurse has earned a set of Asylum restraints.
 * @returns {boolean} - TRUE if the the player is a nurse and is eligible for their own set of Asylum restraints,
 * FALSE otherwise
 */
function AsylumEntranceNurseCanGetRestraints() {
	const reputation = ReputationGet("Asylum");
	return reputation >= 100 && !LogQuery("ReputationMaxed", "Asylum");
}

/**
 * Called when the player has earned their own set of Asylum restraints.
 * @returns {void} - Nothing
 */
function AsylumEntranceGiveRestraints() {
	LogAdd("ReputationMaxed", "Asylum");
	InventoryAddMany(Player, [
		{ Name: "MedicalBedRestraints", Group: "ItemArms" },
		{ Name: "MedicalBedRestraints", Group: "ItemLegs" },
		{ Name: "MedicalBedRestraints", Group: "ItemFeet" },
		{ Name: "MedicalBed", Group: "ItemDevices" },
	]);
}

/**
 * When the user removes 10 GGTS minutes from her bank to leave the asylum
 * @returns {void} - Nothing
 */
function AsylumEntrancePayTenMinutes() {
	AsylumGGTSSpendMinute(10);
}

/**
 * When the player starts a club card game
 * @returns {void} - Nothing
 */
function AsylumEntranceClubCardStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, ClubCardBuilderAsylumDeck, () => { AsylumEntranceClubCardEnd(); });
}

/**
 * When the player ends a club card game
 * @returns {SafePromise<void>}
 */
async function AsylumEntranceClubCardEnd() {
	await CommonSetScreen("Room", "AsylumEntrance");
	CharacterSetCurrent(AsylumEntranceNurse);
	AsylumEntranceNurse.CurrentDialog = DialogFind(AsylumEntranceNurse, MiniGameVictory ? "ClubCardVictory" : "ClubCardDefeat");
}
