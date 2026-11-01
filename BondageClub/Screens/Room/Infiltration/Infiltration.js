"use strict";
var InfiltrationBackground = "Infiltration";
/** @type {NPCCharacter} */
var InfiltrationSupervisor = /** @type {never} */ (null);
/** @type {InfiltrationMissionStateType | null } */
var InfiltrationMissionState = null;
/** @type {InfiltrationMissionType[]} */
var InfiltrationMissionType = ["Rescue", "Kidnap", "Retrieve", "CatBurglar", "ReverseMaid"];
/** @type {InfiltrationObjectListType[]} */
var InfiltrationObjectList = ["USBKey", "BDSMPainting", "GoldCollar", "GeneralLedger", "SilverVibrator", "DiamondRing", "SignedPhoto"];
var InfiltrationCollectRansom = false;
/** @type {null | NPCCharacter} */
var InfiltrationKidnapper = null;
/** @type {null | NPCCharacter} */
var InfiltrationPandoraPrisoner = null;
/** @type {null | NPCCharacter} */
var InfiltrationPartyPrisoner = null;
var InfiltrationPenitentiaryMinutes = 0;
var InfiltrationPenitentiaryAmount = 0;
/** @type {"G" | "I"} */
var InfiltrationPenitentiaryRole = "I";

/**
 * Returns TRUE if the mission can complete as a success
 * @returns {boolean} - TRUE if successful
 */
function InfiltrationCanSuccess() { return InfiltrationMissionState?.Found === true; }

/**
 * Returns TRUE if the mission can complete as a failure
 * @returns {boolean} - TRUE if successful
 */
function InfiltrationCanFail() { return !!InfiltrationMissionState && InfiltrationMissionState.Found !== true; }

/**
 * Returns TRUE if the player can go back to Pandora's Box to pursue her mission
 * @returns {boolean} - TRUE if successful
 */
function InfiltrationCanGoBack() { return !!InfiltrationMissionState && InfiltrationMissionState.Fail !== true && !InfiltrationCanSuccess(); }

/**
 * Returns TRUE if the player can start the Pandora Padlock Mission, needs to be missing the item and infiltration 6 or more
 * @returns {boolean} - TRUE if successful
 */
function InfiltrationCanGetPandoraLock() { return (SkillGetLevel(Player, "Infiltration") >= 6 && (!InventoryAvailable(Player, "PandoraPadlock", "ItemMisc") || !InventoryAvailable(Player, "PandoraPadlockKey", "ItemMisc"))); }

/**
 * Returns TRUE if the player can ask to get Pandora's locks as a reward for the mission
 * @returns {boolean} - TRUE if successful
 */
function InfiltrationCanAskForPandoraLock() { return InfiltrationMissionState?.Mission === "Retrieve" && InfiltrationMissionState?.Target === "PandoraPadlockKeys"; }

/**
 * Returns TRUE if the player can turn in the cat burglar mission
 * @returns {boolean} - TRUE if possible
 */
function InfiltrationCatBurglarHasMoney() { return (PandoraMoney > 0); }

/**
 * Returns TRUE if the player can complete the reverse maid mission, at least 50% of the job must be done
 * @returns {boolean} - TRUE if possible
 */
function InfiltrationReverseMaidCanComplete() { return PandoraReverseMaidDone * 2 >= PandoraReverseMaidTotal && InfiltrationMissionState?.Mission === "ReverseMaid"; }

/**
 * Returns TRUE if the player hasat least 1 NPC from Pandora in their private room and has reached 5 infiltration
 * @returns {boolean} - TRUE if successful
 */
function InfiltrationPandoraPrisonerPresent() { return (InfiltrationPandoraPrisoner != null && SkillGetLevel(Player, "Infiltration") >= 5);}

/**
 * Returns TRUE if the player brought back a Mistress from Pandoras Box
 * @returns {boolean} - TRUE if successful
 */
function InfiltrationPartyPrisonerIsMistress() { return !!InfiltrationPartyPrisoner && (InfiltrationPartyPrisoner.Archetype === "Mistress");}

/**
 * Returns TRUE if there is still free space in private room.
 * @returns {boolean} - TRUE if successful
 */
function InfiltrationCanJoinPrivateRoom() { return PrivateHasEmptySlot(); }
/**
 * Returns TRUE if the player and the current character can play Club Card
 * @returns {boolean} - Returns TRUE if both aren't restrained and gagged
 */
function InfiltrationCanPlayClubCard() { return !!CurrentCharacter && (!Player.IsRestrained() && !CurrentCharacter.IsRestrained() && !Player.IsGagged() && !CurrentCharacter.IsGagged()); }

/**
 * Returns TRUE if the player has free space and is skilled enough.
 * @returns {boolean} - * Returns TRUE if the player has free space and is skilled enough.
 */
function InfiltrationCanBrainwashCaptive() { return (InfiltrationCanJoinPrivateRoom() && SkillGetLevel(Player, "Infiltration") >= 5);}

/**
 * Loads the infiltration screen by generating the supervisor.
 * @type {ScreenLoadHandler}
 */
async function InfiltrationLoad() {
	// If there's a private room character from Pandora, set character at random.
	InfiltrationSetPandoraPrisoner();

	// If there's a party coming with the player, it can complete the mission or trigger a ransom
	InfiltrationBackground = "Infiltration";
	InfiltrationCollectRansom = false;
	if ((PandoraParty != null) && (PandoraParty.length > 0)) {
		for (let P = 0; P < PandoraParty.length; P++) {
			if (InfiltrationMissionState && "Target" in InfiltrationMissionState && InfiltrationMissionState?.Target === "NPC" && PandoraParty[P].Name == InfiltrationMissionState.Name) InfiltrationMissionState.Found = true;
			if (PandoraParty[P].Archetype === "Mistress" || PandoraParty[P].Archetype === "Maid" || PandoraParty[P].Archetype === "Guard") {
				InfiltrationCollectRansom = true;
				InfiltrationPartyPrisoner = PandoraParty[P]; //If party is employed by Pandora, stash NPC for possible interrogation
			}
		}
		PandoraParty = [];
	}

	// Creates the supervisor if she doesn't exist
	if (InfiltrationSupervisor == null) {
		InfiltrationSupervisor = CharacterLoadNPC("NPC_Infiltration_Supervisor");
		InfiltrationSupervisor.AllowItem = false;
		CharacterNaked(InfiltrationSupervisor);
		InventoryWear(InfiltrationSupervisor, "ReverseBunnySuit", "Suit", "#400000");
		InventoryWear(InfiltrationSupervisor, "ReverseBunnySuit", "SuitLower", "#400000");
		InventoryWear(InfiltrationSupervisor, "FishnetBikini1", "Bra", "#222222");
		InventoryWear(InfiltrationSupervisor, "BondageDress1", "Cloth");
		InventoryWear(InfiltrationSupervisor, "LatexAnkleShoes", "Shoes", "#222222");
	}
}

/**
 * Runs and draws the infiltration screen.  Shows the player and the opponent.
 * @returns {void} - Nothing
 */
function InfiltrationRun() {
	DrawCharacter(Player, 500, 0, 1);
	DrawCharacter(InfiltrationSupervisor, 1000, 0, 1);
	if ((InfiltrationSupervisor.Stage !== "End") && Player.CanWalk()) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
	DrawButton(1885, 265, 90, 90, "", "White", "Icons/Infiltration.png", TextGet("Perks"));
}

/**
 * Handles clicks in the infiltration screen
 * @returns {void} - Nothing
 */
function InfiltrationClick() {
	if (MouseIn(1000, 0, 500, 1000)) {
		if (InfiltrationCollectRansom) InfiltrationSupervisor.Stage = "Ransom0";
		CharacterSetCurrent(InfiltrationSupervisor);
	}
	if ((InfiltrationSupervisor.Stage !== "End") && MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "MainHall");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
	if (MouseIn(1885, 265, 90, 90)) CommonSetScreen("Room", "InfiltrationPerks");
}

/**
 * Sets the infiltration mission challenge difficulty
 * @param {0 | 1 | 2 | 3 | 4} Difficulty
 * @returns {void} - Nothing
 */
function InfiltrationSelectChallenge(Difficulty) {
	if (!InfiltrationMissionState) return;
	InfiltrationMissionState.Difficulty = Difficulty;
}

/**
 * Prepares the mission and presents it to the player
 * @returns {void} - Nothing
 */
function InfiltrationPrepareMission() {
	const lastMission = InfiltrationMissionState?.Mission ?? "";
	const Mission = /** @type {InfiltrationMissionType} */ (CommonRandomItemFromList(lastMission, InfiltrationMissionType));
	/** @type {InfiltrationMissionStateType} */
	let state;
	if (Mission === "Rescue" || Mission === "Kidnap") {
		state = {
			Mission,
			Difficulty: 0,
			Target: "NPC",
			Name: CharacterGenerateRandomName(),
			PrivateRoom: false,
			Found: false,
		};
	} else if (Mission === "Retrieve" || Mission === "Steal") {
		let PreviousTarget = InfiltrationMissionState && "Target" in InfiltrationMissionState ? InfiltrationMissionState.Target : "";
		if (PreviousTarget === "NPC") PreviousTarget = "";
		const Target = /** @type {InfiltrationObjectListType} */ (CommonRandomItemFromList(PreviousTarget, InfiltrationObjectList));
		state = {
			Mission,
			Difficulty: 0,
			Target,
			Name: DialogFind(InfiltrationSupervisor, "Object" + Target),
			Found: false,
		};
	} else {
		state = {
			Mission,
			Difficulty: 0,
			Found: false,
		};
	}
	InfiltrationMissionState = state;
	InfiltrationSupervisor.Stage = state.Mission;
	InfiltrationSupervisor.CurrentDialog = DialogFind(InfiltrationSupervisor, state.Mission + "Intro");
	if ("Name" in state) {
		InfiltrationSupervisor.CurrentDialog = InfiltrationSupervisor.CurrentDialog.replace("TargetName", state.Name);
	}
}

/**
 * Starts the mission and jumps to Pandora's box
 * @returns {SafePromise<void>}
 */
async function InfiltrationStartMission() {
	PandoraWillpower = 20 + (SkillGetLevel(Player, "Willpower") * 2) + (InfiltrationPerksActive("Resilience") ? 5 : 0) + (InfiltrationPerksActive("Endurance") ? 5 : 0);
	PandoraMaxWillpower = PandoraWillpower;
	PandoraTimer = CommonTime() + MS_PER_HOUR;
	PandoraChestCount = 0;
	PandoraMoney = 0;
	PandoraPaint = false;
	DialogLeave();
	await CommonSetScreen("Room", "Pandora");
	PandoraBuildMainHall();
}

/**
 * Returns to Pandora's box with the same stats and room layout
 * @returns {void} - Nothing
 */
function InfiltrationReturnMission() {
	DialogLeave();
	CommonSetScreen("Room", "Pandora");
}

/**
 * When the player completes the mission, she gains
 * @returns {void} - Nothing
 */
function InfiltrationCompleteMission() {
	if (!InfiltrationMissionState) return;
	if (InfiltrationMissionState.Difficulty == 0) SkillProgress(Player, "Infiltration", 100);
	if (InfiltrationMissionState.Difficulty == 1) SkillProgress(Player, "Infiltration", 200);
	if (InfiltrationMissionState.Difficulty == 2) SkillProgress(Player, "Infiltration", 350);
	if (InfiltrationMissionState.Difficulty == 3) SkillProgress(Player, "Infiltration", 600);
	if (InfiltrationMissionState.Difficulty == 4) SkillProgress(Player, "Infiltration", 1000);
	let Money = (InfiltrationMissionState.Mission != "CatBurglar") ? 12 + (InfiltrationMissionState.Difficulty * 6) : 0;
	if ((InfiltrationMissionState.Mission == "ReverseMaid") && (PandoraReverseMaidDone >= PandoraReverseMaidTotal)) Money = Math.round(Money * 1.5);
	Money = Money + Math.round(PandoraMoney / 2);
	if (InfiltrationPerksActive("Negotiation")) Money = Math.round(Money * 1.2);
	CharacterChangeMoney(Player, Money);
	if (InfiltrationMissionState.Mission === "Rescue" && InfiltrationMissionState.Target == "NPC" && InfiltrationMissionState.PrivateRoom) {
		if (PrivateRansomCharacter) {
			NPCEventAdd(PrivateRansomCharacter, "Kidnap", CurrentTime);
			if ((PrivateRansomCharacter.Love ?? 0) < 50) PrivateRansomCharacter.Love = 50;
		}
		ServerPrivateCharacterSync();
	}
}

/**
 * Before all missions, the player can wear random clothes
 * @returns {void} - Nothing
 */
function InfiltrationRandomClothes() {
	CharacterNaked(Player);
	CharacterAppearanceFullRandom(Player, true);
	CharacterRelease(Player);
	InventoryRemove(Player, "ItemHandheld");
	PandoraClothes = "Random";
}

/**
 * Before the cat burglar mission, we dress the player in black latex
 * @returns {void} - Nothing
 */
function InfiltrationCatBurglarClothes() {
	CharacterNaked(Player);
	CharacterRelease(Player);
	InventoryRemove(Player, "ItemHandheld");
	if (Math.random() >= 0.5) InventoryWear(Player, "LatexAnkleShoes", "Shoes", "#373636");
	else InventoryWear(Player, "AnkleStrapShoes", "Shoes", "#282828");
	if (Math.random() >= 0.5) InventoryWear(Player, "LatexSkirt2", "ClothLower", "#4A4A4A");
	else InventoryWear(Player, "LatexPants1", "ClothLower");
	if (Math.random() >= 0.5) InventoryWear(Player, "DominoMask", "Mask");
	if (Math.random() >= 0.5) InventoryWear(Player, "LeatherCorsetTop1", "Cloth");
	else InventoryWear(Player, "LatexTop", "Cloth");
	InventoryWear(Player, "Catsuit", "Suit", "#202020");
	InventoryWear(Player, "Catsuit", "SuitLower", "#202020");
	InventoryWear(Player, "Catsuit", "Gloves", "#202020");
	PandoraClothes = "CatBurglar";
}

/**
 * When the infiltration supervisor pays the player for ransoming a Dominatrix
 * @param {string} Type - The ransom type to be paid (Money, Skill or None)
 * @returns {void} - Nothing
 */
function InfiltrationPayRansom(Type) {
	InfiltrationCollectRansom = false;
	if (!InfiltrationMissionState) return;
	if (Type == "Money") {
		let Money = 10 + (InfiltrationMissionState.Difficulty * 4);
		if (InfiltrationPerksActive("Negotiation")) Money = Math.round(Money * 1.2);
		if (InfiltrationPartyPrisoner && InfiltrationPartyPrisoner.Archetype != "Mistress") Money = Math.round(Money / 2); //Pay half as much for non-mistress
		CharacterChangeMoney(Player, Money);
	} else if (Type == "Skill") {
		if (InfiltrationMissionState.Difficulty == 0) SkillProgress(Player, "Infiltration", 100);
		if (InfiltrationMissionState.Difficulty == 1) SkillProgress(Player, "Infiltration", 150);
		if (InfiltrationMissionState.Difficulty == 2) SkillProgress(Player, "Infiltration", 225);
		if (InfiltrationMissionState.Difficulty == 3) SkillProgress(Player, "Infiltration", 300);
		if (InfiltrationMissionState.Difficulty == 4) SkillProgress(Player, "Infiltration", 400);
	} else if (Type == "Private") {
		if (!InfiltrationPartyPrisoner) return;
		//Add prisoner to private room
		/** @type {NPCArchetype | undefined} */
		let PrisonerArchetype = undefined;
		if (InfiltrationPartyPrisoner.Archetype === "Slave") {
			PrisonerArchetype = "Submissive";
		} else if (InfiltrationPartyPrisoner.Archetype === "Mistress") {
			PrisonerArchetype = "Mistress";
		}
		const C = PrivateAddCharacter(InfiltrationPartyPrisoner, PrisonerArchetype, true);
		C.FromPandora = true;
		NPCEventAdd(C,"LastInteraction",CurrentTime+20000);
		//Set PandoraPrisoner to new private room character and send to interrogation
		InfiltrationPandoraPrisoner = C;
		ServerPrivateCharacterSync();
		InfiltrationPandoraPrisonerBrainwash();
	}

	if ((InfiltrationMissionState.Mission == "CatBurglar") || (InfiltrationMissionState.Mission == "ReverseMaid")) {
		InfiltrationSupervisor.Stage = InfiltrationMissionState.Mission + "End";
	} else {
		InfiltrationSupervisor.Stage = "End";
	}
}

/**
 * The revenge kidnapping can happen when infiltration level is at 4 or more, in that case, a Pandora girl can try to kidnap the player from the club and bring her to a Pandora's Box prison
 * @returns {SafePromise<void>}
 */
async function InfiltrationStartKidnapping() {
	let Type = "Kidnapper";
	if ((InventoryAvailable(Player, "PandoraPadlock", "ItemMisc") || InventoryAvailable(Player, "PandoraPadlockKey", "ItemMisc")) && (Math.random() >= 0.5)) Type = "Dominatrix";
	let IntroText = TextGet("Pandora" + Type + "Intro" + Math.floor(Math.random() * 5));
	IntroText = IntroText.replace("DialogPlayerName", CharacterNickname(Player));
	await CommonSetScreen("Room", "Infiltration");
	InfiltrationBackground = MainHallBackground;
	if (InfiltrationKidnapper) {
		CharacterDelete(InfiltrationKidnapper);
	}

	InfiltrationKidnapper = CharacterLoadNPC("NPC_Infiltration_" + Type);
	CharacterRelease(InfiltrationKidnapper);
	InfiltrationKidnapper.Stage = "0";
	if (Type == "Kidnapper") {
		CharacterAppearanceFullRandom(InfiltrationKidnapper);
		CharacterRefresh(InfiltrationKidnapper, false);
	} else PandoraDress(InfiltrationKidnapper, "Mistress");
	CharacterSetCurrent(InfiltrationKidnapper);
	InfiltrationKidnapper.CurrentDialog = IntroText;
}

/**
 * Ends the revenge kidnapping scenario and goes back to the main hall
 * @param {"Money"|"Skill"|"Private"} [Reward]
 * @returns {void} - Nothing
 */
function InfiltrationEndKidnapping(Reward) {
	if (!CurrentCharacter || !CurrentCharacter.IsNpc()) return;
	if (Reward === "Money") CharacterChangeMoney(Player, 18);
	if (Reward === "Skill") SkillProgress(Player, "Infiltration", 400);
	if (Reward === "Private") {
		const isMistress = InventoryIsWorn(CurrentCharacter, "Shoes", "MistressBoots");
		const C = PrivateAddCharacter(CurrentCharacter, isMistress ? "Mistress" : "");
		C.Love = -80;
		C.FromPandora = true;
		if (isMistress) {
			// Pandora mistresses have their own title
			C.Title = "Dominatrix";
		}
		ServerPrivateCharacterSync();
		DialogLeave();
		CommonSetScreen("Room", "Private");
		return;
	}
	CommonSetScreen("Room", "MainHall");
	DialogLeave();
}

/**
 * When the player surrenders to her kidnapper
 * @returns {void} - Nothing
 */
function InfiltrationKidnapperSurrender() {
	CharacterFullRandomRestrain(Player, "ALL", true);
}

/**
 * Starts the fight with the NPC kidnapper
 * @returns {void} - Nothing
 */
function InfiltrationKidnapperStartFight() {
	if (!CurrentCharacter) return;
	const Difficulty = CommonClamp(SkillGetLevel(Player, "Infiltration") - 3 + Math.floor(Math.random() * 7), 0, 10);
	KidnapStart(CurrentCharacter, InfiltrationBackground, Difficulty, (victory) => CommonPromiseCatch(InfiltrationKidnapperEndFight(victory)));
}

/**
 * Ends the fight with the NPC kidnapper
 * @param {boolean} victory - Whether the player won the encounter
 * @returns {SafePromise<void>}
 */
async function InfiltrationKidnapperEndFight(victory) {
	if (!InfiltrationKidnapper) return;
	CharacterSetCurrent(InfiltrationKidnapper);
	if (!CurrentCharacter) return;
	const C = CurrentCharacter;
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(C));
	C.Stage = victory ? "100" : "200";
	CharacterRelease(victory ? Player : C);
	C.AllowItem = victory;
	await CommonSetScreen("Room", "Infiltration");
	InfiltrationBackground = MainHallBackground;
	C.CurrentDialog = DialogFind(C, victory ? "FightVictory" : "FightDefeat");
}

/**
 * Enter Pandora's Box as the kidnapper victim
 * @returns {SafePromise<void>}
 */
async function InfiltrationKidnapperEnterPandora() {
	await CommonSetScreen("Room", "Pandora");
	PandoraPunishmentIntro(true);
}

/**
 * Removes the gag from the kidnapper
 * @returns {void} - Nothing
 */
function InfiltrationKidnapperUngag() {
	if (!CurrentCharacter) return;
	InventoryRemove(CurrentCharacter, "ItemHead");
	InventoryRemove(CurrentCharacter, "ItemHood");
	InventoryRemove(CurrentCharacter, "ItemNose");
	InventoryRemove(CurrentCharacter, "ItemMouth");
	InventoryRemove(CurrentCharacter, "ItemMouth2");
	InventoryRemove(CurrentCharacter, "ItemMouth3");
}

/**
 * Returns TRUE if the player can bring the current NPC to her room
 * @returns {boolean} - TRUE if it's possible
 */
function InfiltrationCanBringToRoom() { return PrivateHasEmptySlot(); }

/**
 * Removes the Pandora Locks and Keys from the player inventory, ends the scene
 * @returns {void} - Nothing
 */
function InfiltrationStealItems() {
	InventoryDelete(Player, "PandoraPadlock", "ItemMisc");
	InventoryDelete(Player, "PandoraPadlockKey", "ItemMisc");
	InfiltrationEndKidnapping();
}

/**
 * Starts the Pandora's padlock special mission, cannot be given randomly
 * @returns {void} - Nothing
 */
function InfiltrationStartPandoraLock() {
	InfiltrationMissionState = {
		Mission: "Retrieve",
		Difficulty: 4,
		Target: "PandoraPadlockKeys",
		Name: DialogFind(InfiltrationSupervisor, "ObjectPandoraPadlockKeys"),
		Found: false,
	};
	InfiltrationRandomClothes();
}

/**
 * Add the Pandora locks and keys to the player inventory
 * @returns {void} - Nothing
 */
function InfiltrationGetPandoraLock() {
	InventoryAdd(Player, "PandoraPadlock", "ItemMisc");
	InventoryAdd(Player, "PandoraPadlockKey", "ItemMisc");
}

/**
 * Pays for the ransom to free a friend from the private room
 * @returns {void} - Nothing
 */
function InfiltrationRansomFriend() {
	if (!PrivateRansomCharacter) return;
	NPCEventAdd(PrivateRansomCharacter, "Kidnap", CurrentTime);
	if ((PrivateRansomCharacter.Love ?? 0) < 0) PrivateRansomCharacter.Love = 0;
	ServerPrivateCharacterSync();
	CharacterChangeMoney(Player, -100);
}

/**
 * Starts a rescue mission for the NPC in the private room
 * @returns {void} - Nothing
 */
function InfiltrationStartNPCRescue() {
	if (!PrivateRansomCharacter) return;
	InfiltrationMissionState = {
		Mission: "Rescue",
		Difficulty: 2,
		Target: "NPC",
		Name: PrivateRansomCharacter.Name,
		PrivateRoom: true,
		Found: false, // XXX
	};
	InfiltrationRandomClothes();
}

/**
 * Dresses the player as a maid for the reverse maid mission
 * @param {number} Rep - The reputation change to apply
 * @returns {void} - Nothing
 */
function InfiltrationDressMaid(Rep) {
	PandoraDress(Player, "Maid");
	if (Rep) ReputationProgress("Dominant", Rep);
	PandoraClothes = "Maid";
}

/**
 * Takes captured infiltrator for brainwashing.
 * @returns {void} - Nothing
 */

function InfiltrationPandoraPrisonerBrainwash() {
	const C = InfiltrationPandoraPrisoner;
	if (!C) return;
	//Hide character for 1 day
	NPCEventAdd(C, "NPCBrainwashing", CurrentTime + MS_PER_DAY);
	//Remove Pandora flag
	C.FromPandora = false;
	//Enslave to player
	NPCEventDelete(C, "EndSubTrial");
	NPCEventAdd(C, "NPCCollaring", CurrentTime);
	C.Owner = Player.Name;
	//Interrogation restraints - Not strictly required, just flavor for Private Room NPC profile.
	CharacterNaked(C);
	CharacterReleaseTotal(C);
	InventoryWear(C, "SlaveCollar", "ItemNeck");
	InventoryWear(C,"SteelCuffs","ItemArms");
	InventoryWear(C,"SteelAnkleCuffs","ItemFeet");
	InventoryWear(C,"WoodenRack","ItemDevices");
	ExtendedItemSetOptionByRecord(C, "ItemDevices", { f: 1, t: 4, b: 4 }, { push: true });
	//Move towards submission by a random amount between 0-10 + Infiltration skill adjustment between 50-100
	const S = Math.floor(Math.random()*10) + (SkillGetLevel(Player, "Infiltration") * 10) + (Math.round(SkillGetProgress(Player, "Infiltration") / 100));
	let T = NPCTraitGet(C, "Dominant") - S;
	if (T < -100) { T = -100; }
	NPCTraitSet(C, "Dominant", T);
	//Neutralize relation, will further decay over time to represent resentment from sending to interrogation
	C.Love = 0;
	//Reset and recheck for smoother dialog
	InfiltrationSetPandoraPrisoner();
	ServerPrivateCharacterSync();
}

/**
 * Picks captured infiltrator at random.
 * @returns {void} - Nothing
 */
function InfiltrationSetPandoraPrisoner() {
	const candidates = PrivateCharacter.filter(c => c.FromPandora);
	if (candidates.length === 0) {
		InfiltrationPandoraPrisoner = null;
	} else if (candidates.length === 1) {
		InfiltrationPandoraPrisoner = candidates[0];
	} else {
		InfiltrationPandoraPrisoner = CommonRandomItemFromList(InfiltrationPandoraPrisoner, candidates);
	}
}

/**
 * When the player starts a club card game against the supervisor
 * @returns {void} - Nothing
 */
function InfiltrationClubCardStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, ClubCardBuilderLiabilityDeck, () => { InfiltrationClubCardEnd(); });
}

/**
 * When the player ends a club card game against the supervisor
 * @returns {SafePromise<void>}
 */
async function InfiltrationClubCardEnd() {
	await CommonSetScreen("Room", "Infiltration");
	CharacterSetCurrent(InfiltrationSupervisor);
	if (!CurrentCharacter) return;
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, MiniGameVictory ? "ClubCardVictory" : "ClubCardDefeat");
}

/**
 * Checks if the role in parameter is the current player role
 * @param {string} Role - The role to evaluate (I for Inmate, G for Guard)
 * @returns {boolean} - TRUE if the role matches the parameter
 */
function InfiltrationPenitentiaryRoleIs(Role) {
	const CurrentRole = PandoraPenitentiaryIsGuard(Player) ? "G" : "I";
	return (CurrentRole === Role);
}

/**
 * Starts the Pandora's padlock special mission, cannot be given randomly
 * @param {number} Minutes - The number of minutes to lock the player
 * @param {number} Amount - The money amount and infiltration skill gained
 * @param {"G" | "I"} Role - The role to take (I for Inmate or G for Guard)
 * @returns {void} - Nothing
 */
function InfiltrationPreparePenitentiary(Minutes, Amount, Role) {
	InfiltrationPenitentiaryMinutes = Minutes;
	InfiltrationPenitentiaryAmount = Amount;
	InfiltrationPenitentiaryRole = Role;
}

/**
 * Starts the Pandora's padlock special mission, cannot be given randomly
 * @param {"New"} [Param] - An optional NEW param to create a new room
 * @returns {void} - Nothing
 */
function InfiltrationStartPenitentiary(Param) {
	if (Param === "New") PandoraPenitentiaryStartNewRoom = true;
	if (!PandoraPenitentiaryIsGuard(Player) && !PandoraPenitentiaryIsInmate(Player)) {
		CharacterChangeMoney(Player, InfiltrationPenitentiaryAmount);
		SkillProgress(Player, "Infiltration", InfiltrationPenitentiaryAmount * 10);
	}
	PandoraPenitentiaryStart(InfiltrationPenitentiaryMinutes, InfiltrationPenitentiaryRole);
}

/**
 * When the player asks to be costumed as a guard
 * @returns {void} - Nothing
 */
function InfiltrationGuardDressUp() {
	PandoraDress(Player, "Guard");
}
