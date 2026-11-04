"use strict";
var IntroductionBackground = "Introduction";
/** @type {NPCCharacter} */
var IntroductionMaid = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var IntroductionSub = /** @type {never} */ (null);
var IntroductionMaidOpinion = 0;
var IntroductionHasBasicItems = false;
var IntroductionSubRestrained = false;
/** @type {IntroductionRescueJobType | null} */
var IntroductionRescueScenario = null;
/** @type {IntroductionRescueJobType[]} */
var IntroductionRescueScenarioList = ["LatexWoman", "Newcomer", "MaidFight", "SalesWoman"];
/** @type {IntroductionJobType[]} */
var IntroductionJobList = ["DomPuppy", "DomLock", "DomKidnap", "DomTrainer", "SubSearch", "SubDojo", "SubActivity", "SubMaid"];
/** @type {IntroductionJobType | null} */
var IntroductionJobCurrent = null;
var IntroductionJobCount = 1;
/** @type {undefined | string} */
var IntroductionJobParam = undefined;
/** @type {{ Active: boolean; X: number; Y: number } & ({} | { ClickScreen: string; ClickX: number; ClickY: number })} */
var IntroductionJobPosition = { Active: false, X: 1000, Y: 1000 };
/** @type {AssetLockType[]} */
var IntroductionJobLockList = ["MetalPadlock", "IntricatePadlock", "TimerPadlock", "CombinationPadlock", "ExclusivePadlock"];
/** @type {ModuleScreens["Room"][]} */
var IntroductionJobSearchList = ["MaidQuarters", "LARP", "KidnapLeague", "SlaveMarket"];
/** @type {number[]} */
var IntroductionJobMember = [];

/**
 * Checks if the introduction room is currently the scenario for maid rescue mission.
 * @param {string} ScenarioName - Name of the rescue scenario to check for.
 * @returns {boolean} - Returns TRUE if the given scenario is the current active one.
 */
function IntroductionIsRescueScenario(ScenarioName) { return IntroductionRescueScenario === ScenarioName; }
/**
 * Checks if the two NPCs in the introduction room are free.
 * @returns {boolean} - Returns TRUE if both the maid and the sub is free.
 */
function IntroductionIsBothFree() { return (!IntroductionMaid.IsRestrained() && IntroductionMaid.CanTalk() && !IntroductionSub.IsRestrained() && IntroductionMaid.CanTalk()); }
/**
 * Checks if the introduction maid is restrained.
 * @returns {boolean} - Returns TRUE if the introduction maid is restrained
 */
function IntroductionIsMaidRestrained() { return (IntroductionMaid.IsRestrained() || !IntroductionMaid.CanTalk()); }
/**
 * Checks if the player has no title
 * @returns {boolean} - Returns TRUE if the player is not a maid or a mistress.
 */
function IntroductionNoTitle() { return (!LogQuery("JoinedSorority", "Maid") && !LogQuery("ClubMistress", "Management")); }
/**
 * Checks if the introduction job is completed
 * @returns {boolean} - Returns TRUE if the introduction job was done.
 */
function IntroductionJobIsComplete() { return (IntroductionJobCount <= 0); }
/**
 * Checks if the player can take a job.
 * @returns {boolean} - Returns TRUE if a job is available and the player is able to take one.
 */
function IntroductionCanTakeJob() { return (IntroductionJobAnyAvailable() && !Player.IsRestrained() && Player.CanTalk() && !IntroductionMaid.IsRestrained() && IntroductionMaid.CanTalk() && !ManagementIsClubSlave()); }
/**
 * Checks if the player is able to take a job, but none are available.
 * @returns {boolean} - Returns TRUE if there is no job available while the player is able to take one.
 */
function IntroductionCannotTakeJobDone() { return (!IntroductionJobAnyAvailable() && !Player.IsRestrained() && Player.CanTalk() && !IntroductionMaid.IsRestrained() && IntroductionMaid.CanTalk() && !ManagementIsClubSlave()); }
/**
 * Checks if the player has jobs available, but is restrained
 * @returns {boolean} - Returns TRUE if the players is restrained while a job is available.
 */
function IntroductionCannotTakeJobRestrained() { return (IntroductionJobAnyAvailable() && (Player.IsRestrained() || !Player.CanTalk() || IntroductionMaid.IsRestrained() || !IntroductionMaid.CanTalk()) && !ManagementIsClubSlave()); }
/**
 * Returns TRUE if the player and the current character can play Club Card
 * @returns {boolean} - Returns TRUE if both aren't restrained
 */
function IntroductionCanPlayClubCard() { return !Player.IsRestrained() && !!CurrentCharacter && !CurrentCharacter.IsRestrained() && !Player.IsGagged() && !CurrentCharacter.IsGagged(); }

/**
 * Loads the introduction room and its 2 NPCS
 * @type {ScreenLoadHandler}
 */
async function IntroductionLoad() {

	// Checks if the player already has the basic items
	IntroductionHasBasicItems = (InventoryAvailable(Player, "NylonRope", "ItemFeet") && InventoryAvailable(Player, "NylonRope", "ItemLegs") && InventoryAvailable(Player, "NylonRope", "ItemArms") && InventoryAvailable(Player, "ClothGag", "ItemMouth"));

	// Creates two characters to begin with
	IntroductionMaid = CharacterLoadNPC("NPC_Introduction_Maid");
	IntroductionSub = CharacterLoadNPC("NPC_Introduction_Sub");

	// Rescue mission load
	if ((MaidQuartersCurrentRescue == "IntroductionClass") && !MaidQuartersCurrentRescueStarted) {
		MaidQuartersCurrentRescueStarted = true;
		InventoryAdd(IntroductionMaid, "LeatherArmbinder", "ItemArms");
		InventoryAdd(IntroductionMaid, "LeatherBelt", "ItemLegs");
		InventoryAdd(IntroductionMaid, "LeatherBelt", "ItemFeet");
		InventoryWear(IntroductionMaid, "LeatherArmbinder", "ItemArms");
		InventoryWear(IntroductionMaid, "LeatherBelt", "ItemLegs");
		InventoryWear(IntroductionMaid, "LeatherBelt", "ItemFeet");
		InventoryWearRandom(IntroductionMaid, "ItemMouth");
		InventoryAdd(IntroductionSub, "LeatherArmbinder", "ItemArms");
		InventoryAdd(IntroductionSub, "LeatherBelt", "ItemLegs");
		InventoryAdd(IntroductionSub, "LeatherBelt", "ItemFeet");
		InventoryWear(IntroductionSub, "LeatherArmbinder", "ItemArms");
		InventoryWear(IntroductionSub, "LeatherBelt", "ItemLegs");
		InventoryWear(IntroductionSub, "LeatherBelt", "ItemFeet");
		InventoryWearRandom(IntroductionSub, "ItemMouth");
		IntroductionMaid.Stage = "MaidRescue";
		IntroductionMaid.AllowItem = true;
		IntroductionSub.Stage = "MaidRescue";
		IntroductionRescueScenario = CommonRandomItemFromList(IntroductionRescueScenario, IntroductionRescueScenarioList);
	}

}

/**
 * Runs and draws the main introduction room with its 3 characters.
 * @returns {void} - Nothing
 */
function IntroductionRun() {
	IntroductionSubRestrained = (!IntroductionSub.CanTalk() && !IntroductionSub.CanWalk() && !IntroductionSub.CanInteract());
	DrawCharacter(Player, 250, 0, 1);
	DrawCharacter(IntroductionMaid, 750, 0, 1);
	DrawCharacter(IntroductionSub, 1250, 0, 1);
	if (Player.CanWalk()) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
}

/**
 * Handles clicks in the introduction room.
 * @returns {void} - Nothing
 */
function IntroductionClick() {
	if (MouseIn(250, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (MouseIn(750, 0, 500, 1000)) CharacterSetCurrent(IntroductionMaid);
	if (MouseIn(1250, 0, 500, 1000)) CharacterSetCurrent(IntroductionSub);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "MainHall");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
}

/**
 * Change the opinion the maid has on the player, it will affect the global player Domme/sub reputation at the end of the first training
 * @param {number} Bonus - Number representing the bonus to the current opinion the maid has.
 * @returns {void} - Nothing
 */
function IntroductionChangeMaidOpinion(Bonus) {
	IntroductionMaidOpinion += Bonus;
}

/**
 * Gives focus on certain body parts with its zone
 * @param {AssetGroupItemName} NewZone - Zone to set as the new focus group
 * @returns {void} - Nothing
 */
function IntroductionSetZone(NewZone) {
	// Force a focus group change to not break out of dialog mode while still showing the group outlines
	if (!CurrentCharacter) return;
	CurrentCharacter.FocusGroup = Player.FocusGroup = AssetGroupGet("Female3DCG", NewZone);
}

/**
 * Clears the body part focus zones
 * @returns {void} - Nothing
 */
function IntroductionClearZone() {
	if (!CurrentCharacter) return;
	Player.FocusGroup = null;
	CurrentCharacter.FocusGroup = null;
}

/**
 * Triggered when the maid gives basic items to the player
 * @returns {void} - Nothing
 */
function IntroductionGetBasicItems() {
	/** @type {ItemBundle[]} */
	const ItemsToEarn = [];
	ItemsToEarn.push({Name: "NylonRope", Group: "ItemFeet"});
	ItemsToEarn.push({Name: "NylonRope", Group: "ItemLegs"});
	ItemsToEarn.push({Name: "NylonRope", Group: "ItemArms"});
	ItemsToEarn.push({Name: "ClothGag", Group: "ItemMouth"});
	ItemsToEarn.push({Name: "ClothGag", Group: "ItemMouth2"});
	ItemsToEarn.push({Name: "ClothGag", Group: "ItemMouth3"});
	InventoryAddMany(Player, ItemsToEarn);
	IntroductionHasBasicItems = true;
}

/**
 * Saves the maid opinion of the player to the log
 * @returns {void} - Nothing
 */
function IntroductionSaveMaidOpinion() {
	if (!LogQuery("MaidOpinion", "Introduction")) {
		LogAdd("MaidOpinion", "Introduction");
		ReputationProgress("Dominant", IntroductionMaidOpinion);
	}
}

/**
 * Checks if the introduction maid can restrain the player.
 * @returns {boolean} - Returns TRUE if the maid can restrain the player
 */
function IntroductionAllowRestrainPlayer() {
	return (Player.CanInteract() && IntroductionMaid.CanInteract());
}

/**
 * Gags the player unless she's head maid during the introduction dialog.
 * @returns {void} - Nothing
 */
function IntroductionGagPlayer() {
	if (DialogIsHeadMaid()) {
		CharacterRelease(Player);
		IntroductionMaid.CurrentDialog = DialogFind(IntroductionMaid, "ReleaseHeadMaid");
		IntroductionMaid.Stage = "370";
	} else DialogWearItem("ClothGag", "ItemMouth");
}

/**
 * Triggered when the player rescues both girls and completes the maid rescue mission
 * @returns {void} - Nothing
 */
function IntroductionCompleteRescue() {
	IntroductionMaid.AllowItem = LogQuery("LeadSorority", "Maid");
	CharacterRelease(IntroductionMaid);
	CharacterRelease(IntroductionSub);
	MaidQuartersCurrentRescueCompleted = true;
	IntroductionSub.Stage = "0";
}

/**
 * Triggered at the end of a job. The time is logged and a new job will be available the next day. The day is based on the server time.
 * @returns {void} - Nothing
 */
function IntroductionJobDone() {
	CharacterChangeMoney(Player, 120);
	const NextDay = Math.floor(CurrentTime / (24 * 60 * 60 * 1000)) + 1;
	LogAdd("DailyJobDone", "Introduction", NextDay * 24 * 60 * 60 * 1000);
	IntroductionJobCurrent = null;
}

/**
 * Checks if a specific daily job is available. Each job is available in a rotating fashion. Certain jobs are only available for doms or subs.
 * @param {string} JobName - Name of the job to check for.
 * @returns {boolean} - Returns TRUE if a specific daily job is available for the player.
 */
function IntroductionJobAvailable(JobName) {
	if (LogQuery("DailyJobDone", "Introduction")) return false;
	if ((JobName.startsWith("Dom")) && (ReputationGet("Dominant") <= -50)) return false;
	if ((JobName.startsWith("Sub")) && (ReputationGet("Dominant") >= 50)) return false;
	const Day = Math.floor(CurrentTime / (24 * 60 * 60 * 1000));
	if (Day % (IntroductionJobList.length / 2) != IntroductionJobList.indexOf(JobName) % (IntroductionJobList.length / 2)) return false;
	return true;
}

/**
 * Checks if there is a daily job available
 * @returns {boolean} - Returns TRUE if any job is available for the player
 */
function IntroductionJobAnyAvailable() {
	for (let J = 0; J < IntroductionJobList.length; J++)
		if (IntroductionJobAvailable(IntroductionJobList[J]))
			return true;
	return false;
}

/**
 * Starts a given daily job with the given goal.
 * @param {IntroductionJobType} JobName - Name of the job to start
 * @param {number} JobCount - Treshold to consider the job complete
 * @returns {void} - Nothing
 */
function IntroductionJobStart(JobName, JobCount) {
	IntroductionJobCurrent = JobName;
	IntroductionJobCount = JobCount;
	IntroductionJobParam = undefined;
	if (JobName == "DomLock") {
		const Day = Math.floor(CurrentTime / (24 * 60 * 60 * 1000));
		IntroductionJobParam = IntroductionJobLockList[Day % IntroductionJobLockList.length];
	}
	if (JobName == "SubActivity") IntroductionJobParam = "100";
	if (JobName == "SubSearch") {
		IntroductionJobParam = IntroductionJobSearchList[Math.floor(Math.random() * IntroductionJobSearchList.length)];
		IntroductionJobPosition = { Active: false, X: Math.floor(Math.random() * 1700) + 100, Y: Math.floor(Math.random() * 800) + 100 };
	}
	IntroductionJobMember = [];
}

/**
 * Cancels the current daily job, it hurts the reputation of the player.
 * @returns {void} - Nothing
 */
function IntroductionJobGiveUp() {
	if (ReputationGet("Dominant") < 0) DialogChangeReputation("Dominant", 1);
	if (ReputationGet("Dominant") > 0) DialogChangeReputation("Dominant", -1);
	IntroductionJobCurrent = null;
}

/**
 * Shows the lock description that the player must apply
 * @returns {void} - Nothing
 */
function IntroductionJobLockType() {
	if (!IntroductionJobParam) return;
	const Item = CommonIncludes(IntroductionJobLockList, IntroductionJobParam) ? AssetGet(Player.AssetFamily, "ItemMisc", IntroductionJobParam) : null;
	if (Item != null) IntroductionMaid.CurrentDialog = DialogFind(IntroductionMaid, "JobLockType").replace("LockType", Item.Description);
}

/**
 * Validates progress for a daily job. When a member number needs to be unique, it may not progress.
 * @param {IntroductionJobType} JobName - Name of the job for which to register progress
 * @param {string} [Param] - Optional parameter for the job to check for. Can be the name of an asset or anything required by the specific job.
 * @param {boolean} [UniqueMember] - If the member number should be unique.
 * @returns {void} - Nothing
 */
function IntroductionJobProgress(JobName, Param = undefined, UniqueMember = false) {
	if (UniqueMember && CurrentScreen !== "ChatRoom") return;
	if (IntroductionJobCurrent === JobName && IntroductionJobParam === Param) {
		if (UniqueMember && (!CurrentCharacter || CurrentCharacter.IsPlayer() || CurrentCharacter.MemberNumber !== undefined && IntroductionJobMember.indexOf(CurrentCharacter.MemberNumber) >= 0)) return;
		if (UniqueMember && CurrentCharacter?.MemberNumber !== undefined) IntroductionJobMember.push(CurrentCharacter.MemberNumber);
		IntroductionJobCount--;
	}
}

/**
 * Starts the daily kidnapping job.
 * @returns {SafePromise<void>} - Nothing
 */
async function IntroductionJobBouncerStart() {
	await CommonSetScreen("Room", "DailyJob");
	if (!DailyJobOpponent) return;
	CharacterSetCurrent(DailyJobOpponent);
	CharacterRelease(DailyJobOpponent);
	DailyJobOpponent.CurrentDialog = DialogFind(IntroductionMaid, "JobKidnapIntro" + DailyJobOpponent.Stage.toString() + Math.floor(Math.random() * 4).toString());
}

/**
 * Starts the daily dog walking job.
 * @returns {SafePromise<void>} - Nothing
 */
async function IntroductionJobPuppyStart() {
	await CommonSetScreen("Room", "DailyJob");
	if (!DailyJobPuppyMistress) return;
	CharacterSetCurrent(DailyJobPuppyMistress);
	DailyJobPuppyMistress.CurrentDialog = DialogFind(IntroductionMaid, "JobPuppyIntro" + DailyJobPuppyMistress.Stage.toString() + Math.floor(Math.random() * 4).toString());
}

/**
 * Starts the Shibari dojo daily job.
 * @returns {SafePromise<void>} - Nothing
 */
async function IntroductionJobDojoStart() {
	await CommonSetScreen("Room", "DailyJob");
	DailyJobBackground = "Shibari";
	if (!DailyJobDojoTeacher) return;
	CharacterSetCurrent(DailyJobDojoTeacher);
	DailyJobDojoTeacher.CurrentDialog = DialogFind(IntroductionMaid, "JobDojoIntro" + DailyJobDojoTeacher.Stage.toString() + Math.floor(Math.random() * 4).toString());
}

/**
 * When the player starts a club card game
 * @returns {void} - Nothing
 */
function IntroductionClubCardStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, ClubCardBuilderMaidDeck, () => { IntroductionClubCardEnd(); });
}

/**
 * When the player ends a club card game
 * @returns {SafePromise<void>}
 */
async function IntroductionClubCardEnd() {
	await CommonSetScreen("Room", "Introduction");
	if (!IntroductionMaid) return;
	CharacterSetCurrent(IntroductionMaid);
	IntroductionMaid.CurrentDialog = DialogFind(IntroductionMaid, MiniGameVictory ? "ClubCardVictory" : "ClubCardDefeat");
}
