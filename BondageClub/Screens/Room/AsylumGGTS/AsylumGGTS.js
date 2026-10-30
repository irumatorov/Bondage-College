"use strict";
var AsylumGGTSBackground = "AsylumGGTSRoom";
/** @type {NPCCharacter} */
var AsylumGGTSComputer = /** @type {never} */ (null);
var AsylumGGTSIntroDone = false;
var AsylumGGTSTimer = 0;
/** @type {null | GGTSTask} */
var AsylumGGTSTask = null;
/** @type {null | Character} */
var AsylumGGTSTaskTarget = null;
/** @type {null | GGTSTask} */
var AsylumGGTSLastTask = null;
var AsylumGGTSTaskStart = 0;
var AsylumGGTSTaskEnd = 0;
var AsylumGGTSChatToParse = "";
/**
 * The list of available tasks, partitioned by level.
 * @type {GGTSTask[][]}
 */
var AsylumGGTSTaskList = [
	[],
	["QueryWhatIsGGTS", "QueryWhatAreYou", "ClothHeels", "ClothSocks", "ClothBarefoot", "NoTalking", "PoseKneel", "PoseStand", "PoseBehindBack", "ActivityPinch", "ActivityTickle", "ActivityPet", "ActivityNod", "RestrainLegs", "ItemArmsFuturisticCuffs", "ItemHandsFuturisticMittens", "ItemPose", "ItemRemoveLimb", "ItemRemoveBody", "ItemRemoveHead", "ItemUngag", "ItemChaste", "ItemUnchaste", "ItemIntensity", "ItemFuckMachineIntensity", "UnlockRoom", "UnlockRoom"],
	["QueryWhoControl", "QueryLove", "ItemArmsFeetFuturisticCuffs", "ItemBootsFuturisticHeels", "PoseOverHead", "PoseLegsClosed", "PoseLegsOpen", "ActivityHandGag", "ActivitySpank", "UndoRuleKeepPose", "LockRoom", "ClothUpperLowerOn", "ClothUpperLowerOff"],
	["QueryCanFail", "QuerySurrender", "ClothUnderwear", "ClothNaked", "ActivityWiggle", "ActivityCaress", "ItemMouthFuturisticBallGag", "ItemMouthFuturisticPanelGag", "ItemArmsFuturisticArmbinder", "ItemTransform", "ItemChangeGag", "NewRuleNoOrgasm", "UndoRuleNoOrgasm"],
	["QueryServeObey", "QueryFreeWill", "ActivityMasturbateHand", "ActivityKiss", "ItemPelvisFuturisticChastityBelt", "ItemPelvisFuturisticTrainingBelt", "ItemBreastFuturisticBra", "ItemBreastFuturisticBra2", "ItemTorsoFuturisticHarness"],
	["QuerySlaveWorthy", "ItemArmsFuturisticStraitjacket", "ItemHeadFuturisticMask", "ItemEarsFuturisticEarphones", "ItemNeckFuturisticCollar", "ItemEarsDeaf", "ItemMaskBlind", "ItemBeltToFuck", "ItemFuckToBelt", "ActivityBite", "ActivityLick"],
	["QueryCanFailMaster", "QueryLoveMaster", "QuerySurrenderMaster", "QueryWhoControlMaster", "QueryServeObeyMaster"]
];
var AsylumGGTSLevelTime = [0, 7200000, 10800000, 18000000, 28800000, 46800000, 75600000];
/**
 * The last pose the character had. Used to enforce KeepPose rules.
 * @type {null | Partial<Record<AssetPoseCategory, AssetPoseName>>}
 */
var AsylumGGTSPreviousPose = null;
var AsylumGGTSWordCheck = 0;
var AsylumGGTSSpeed = 1;

/**
 * Returns TRUE if the player has three strikes on record
 * @returns {boolean} - TRUE if three strikes or more
 */
function AsylumGGTSHasThreeStrikes() {
	return ((Player.Game != null) && (Player.Game.GGTS != null) && (Player.Game.GGTS.Strike != null) && (Player.Game.GGTS.Strike >= 3));
}

/**
 * Returns TRUE if the player can quit GGTS
 * @returns {boolean} - TRUE if three strikes or more or in active punishment
 */
function AsylumGGTSCanQuit() {
	return !AsylumGGTSHasThreeStrikes() && !AsylumIsIsolated();
}

/**
 * Check that GGTS is enabled in the current room.
 * @returns {boolean} true if GGTS is running, false otherwise.
 */
function AsylumGGTSIsEnabled() {
	return ServerPlayerIsInChatRoom() && ChatSearchGetSpace() === "Asylum" && ChatRoomGetGame() === "GGTS";
}

/**
 * Returns TRUE if the player has completed the required time for the current level
 * @returns {boolean} - TRUE if level is completed with 3 strikes on record
 */
function AsylumGGTSLevelCompleted() {
	let Level = AsylumGGTSGetLevel(Player);
	if (Level === 0) return false;
	if (AsylumGGTSGetStrikes(Player) >= 3) return false;
	return AsylumGGTSGetLevelTime(Player) >= AsylumGGTSLevelTime[Level];
}

/**
 * Returns the character GGTS level
 * @param {Character} C - The character to evaluate
 * @returns {GameGGTSLevel} - Nothing
 */
function AsylumGGTSGetLevel(C) {
	return /** @type {GameGGTSLevel} */ (CommonClamp(C.Game?.GGTS?.Level ?? 0, 0, 6));
}

/**
 * Returns the character's current level timer
 * @param {Character} C
 */
function AsylumGGTSGetLevelTime(C) {
	return CommonIsNumeric(C.Game?.GGTS?.Time) ? C.Game?.GGTS?.Time : 0;
}

/**
 * Returns the character's current level timer
 * @param {Character} C
 * @param {number} time
 * @param {boolean} [push]
 */
function AsylumGGTSSetLevelTime(C, time, push=true) {
	if (!C || !C.IsPlayer() || !C.Game?.GGTS) return;

	C.Game.GGTS.Time = Math.round(CommonClamp(time, 0, Infinity));
	if (push) {
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	}
}

/**
 * Returns the character's current strike count
 * @param {Character} C
 */
function AsylumGGTSGetStrikes(C) {
	return CommonIsNumeric(C.Game?.GGTS?.Strike) ? C.Game?.GGTS?.Strike : 0;
}

/**
 * Set the character's current strike count
 * @param {Character} C
 * @param {number} strikes
 * @returns {number}
 */
function AsylumGGTSSetStrikes(C, strikes) {
	if (!C || !C.IsPlayer() || !C.Game?.GGTS) return AsylumGGTSGetStrikes(C);
	const startStrikes = C.Game.GGTS.Strike;
	C.Game.GGTS.Strike = CommonClamp(strikes, 0, 3);
	if (C.Game.GGTS.Strike !== startStrikes) {
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	}
	return C.Game.GGTS.Strike ?? 0;
}

/**
 * Returns the character's currently set GGTS rules
 * @param {Character} C
 */
function AsylumGGTSGetRules(C) {
	return Array.isArray(C.Game?.GGTS?.Rule) ? C.Game.GGTS.Rule : [];
}

/**
 * Sets the computer image based on the player level
 * @param {number} Level - The player GGTS level
 * @returns {void} - Nothing
 */
function AsylumGGTSComputerImage(Level) {
	if (Level >= 6) AsylumGGTSComputer.FixedImage = "Screens/Room/AsylumGGTS/ComputerGS.png";
	else if (Level >= 5) AsylumGGTSComputer.FixedImage = "Screens/Room/AsylumGGTS/ComputerGSG.png";
	else if (Level >= 3) AsylumGGTSComputer.FixedImage = "Screens/Room/AsylumGGTS/ComputerGG.png";
	else AsylumGGTSComputer.FixedImage = "Screens/Room/AsylumGGTS/Computer.png";
}

/**
 * Ensure the GGTS messages are loaded
 */
async function AsylumGGTSLoadMessages() {
	const msgs = TextPrefetchFile(ScreenFileGetPath("GGTSMessages.csv", "Room", "AsylumGGTS"));
	await msgs.loadedPromise;
}

/**
 * Return a localized GGTS message
 * @param {string} key
 */
function AsylumGGTSGetMessage(key) {
	return TextGetInScope(ScreenFileGetPath("GGTSMessages.csv", "Room", "AsylumGGTS"), key);
}

/**
 * Loads the GGTS and computer NPC
 * @type {ScreenLoadHandler}
 */
async function AsylumGGTSLoad() {
	await AsylumGGTSLoadMessages();
	AsylumGGTSIntroDone = false;
	AsylumGGTSTask = null;
	if (AsylumGGTSComputer == null) {
		AsylumGGTSComputer = CharacterLoadNPC("NPC_AsylumGGTS_Computer");
		AsylumGGTSComputer.AllowItem = false;
		AsylumGGTSComputer.Stage = "0";
		let Level = AsylumGGTSGetLevel(Player);
		if (Level == 1) AsylumGGTSComputer.Stage = "100";
		if (Level == 2) AsylumGGTSComputer.Stage = "1000";
		if (Level == 3) AsylumGGTSComputer.Stage = "2000";
		if (Level == 4) AsylumGGTSComputer.Stage = "3000";
		if (Level == 5) AsylumGGTSComputer.Stage = "4000";
		if (Level >= 6) AsylumGGTSComputer.Stage = "5000";
		if (Level >= 6) AsylumGGTSSetStrikes(Player, 0);
		AsylumGGTSComputerImage(Level);
	}
}

/**
 * Runs the room
 * @returns {void} - Nothing
 */
function AsylumGGTSRun() {
	DrawCharacter(Player, 500, 0, 1);
	DrawCharacter(AsylumGGTSComputer, 1000, 0, 1);
	DrawButton(1885, 25, 90, 90, "", Player.CanWalk() ? "White" : "Pink", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
}

/**
 * Handles the click events.  Called from CommonClick()
 * @returns {void} - Nothing
 */
function AsylumGGTSClick() {
	if (MouseIn(500, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (MouseIn(1000, 0, 500, 1000)) CharacterSetCurrent(AsylumGGTSComputer);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "AsylumEntrance");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
}

/**
 * Adds the GGTS items based on the player level
 * @returns {void} - Nothing
 */
function AsylumGGTSSAddItems() {
	/** @type {ItemBundle[]} */
	const items = [];
	switch (AsylumGGTSGetLevel(Player)) {
		case 5:
			items.push({ Name: "FuturisticCollar", Group: "ItemNeck" });
			items.push({ Name: "FuturisticEarphones", Group: "ItemEars" });
			items.push({ Name: "FuturisticMask", Group: "ItemHead" });
			items.push({ Name: "FuturisticStraitjacket", Group: "ItemArms" });
			// eslint-disable-next-line no-fallthrough
		case 4:
			items.push({ Name: "FuturisticChastityBelt", Group: "ItemPelvis" });
			items.push({ Name: "FuturisticTrainingBelt", Group: "ItemPelvis" });
			items.push({ Name: "FuturisticBra", Group: "ItemBreast" });
			items.push({ Name: "FuturisticBra2", Group: "ItemBreast" });
			items.push({ Name: "FuturisticHarness", Group: "ItemTorso" });
			// eslint-disable-next-line no-fallthrough
		case 3:
			items.push({ Name: "FuturisticArmbinder", Group: "ItemArms" });
			items.push({ Name: "FuturisticPanelGag", Group: "ItemMouth" });
			items.push({ Name: "FuturisticHarnessPanelGag", Group: "ItemMouth" });
			items.push({ Name: "FuturisticHarnessBallGag", Group: "ItemMouth" });
			// eslint-disable-next-line no-fallthrough
		case 2:
			items.push({ Name: "FuturisticAnkleCuffs", Group: "ItemFeet" });
			items.push({ Name: "FuturisticLegCuffs", Group: "ItemLegs" });
			items.push({ Name: "FuturisticHeels", Group: "ItemBoots" });
			items.push({ Name: "FuturisticHeels2", Group: "ItemBoots" });
			// eslint-disable-next-line no-fallthrough
		case 1:
			items.push({ Name: "FuturisticCuffs", Group: "ItemArms" });
			items.push({ Name: "FuturisticMittens", Group: "ItemHands" });
	}
	InventoryAddMany(Player, items);
}

/**
 * Starts a new GGTS level for the player
 * @param {GameGGTSLevel} Level - The new level to set
 * @returns {void} - Nothing
 */
function AsylumGGTSStartLevel(Level) {
	Level = /** @type {GameGGTSLevel} */ (CommonClamp(Level, 0, 6));
	Player.Game ??= {};
	Player.Game.GGTS = { Level: Level, Time: 0, Strike: 0, Rule: [] };
	AsylumGGTSSAddItems();
	AsylumGGTSComputerImage(Level);
	if (Level == 6) CharacterChangeMoney(Player, 1000);
	else if (Level >= 2) CharacterChangeMoney(Player, 100 * (Level - 1));
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
}

/**
 * Quits GGTS and deletes the player data for the game
 * @returns {void} - Nothing
 */
function AsylumGGTSQuit() {
	const itemGroups = AssetGroup.filter(g => g.IsItem()).map(g => g.Name);
	AsylumGGTSTaskRemoveFuturisticItem(itemGroups);
	delete Player.Game.GGTS;
	if (AsylumGGTSComputer != null) AsylumGGTSComputer.FixedImage = "Screens/Room/AsylumGGTS/Computer.png";
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
}

/**
 * Builds a private room online chat room for single player GGTS experience
 * @returns {void} - Nothing
 */
function AsylumGGTSBuildPrivate() {
	ChatSearchSpace = "Asylum";
	AsylumGGTSTimer = 0;
	AsylumGGTSTask = null;
	AsylumGGTSPreviousPose = { ...Player.PoseMapping };
	ChatSearchReturnScreen = ["Room", "AsylumGGTS"];
	/** @type {ChatRoomSettings} */
	const NewRoom = {
		Name: "GGTS" + Math.round(CurrentTime).toString() + Math.round(Math.random() * 1000).toString(),
		Description: "Private GGTS Room",
		Background: "AsylumGGTSRoom",
		Visibility: ChatRoomVisibilityMode.UNLISTED,
		Access: ChatRoomAccessMode.PUBLIC,
		Space: /** @type {ServerChatRoomSpace} */ ("Asylum"),
		Game: "GGTS",
		Admin: [Player.MemberNumber],
		Whitelist: [],
		Ban: [],
		Limit: 2,
		BlockCategory: [],
		Language: ChatAdminDefaultLanguage,
	};
	ServerSend("ChatRoomCreate", NewRoom);
	DialogLeave();
}

/**
 * Gets the new character name based on it's GGTS level
 * @param {Character} C - The character to rename
 * @returns {string} - The new name for that character
 */
function AsylumGGTSCharacterName(C) {
	let name = C.Nickname ?? C.Name;
	const number = C.MemberNumber ?? 0;
	let Level = AsylumGGTSGetLevel(C);
	if (Level == 2) name = `${name}-${number}`;
	if (Level == 3) name = `${name}-GG-${number}`;
	if (Level == 4) name = `GG-${number}`;
	if (Level == 5) name = `GSG-${number}`;
	if (Level >= 6) name = `GS-${number}`;
	return name;
}

/**
 * Sends a chat message from the GGTS.  GGTS slowly replaces the player name by the player number as level rises.
 * @param {string} Msg - The message to publish
 * @param {Character | null} [Target] - The member number of the target character
 * @returns {void} - Nothing
 */
function AsylumGGTSMessage(Msg, Target) {
	if ((Msg == "TaskDone") && (AsylumGGTSGetLevel(Player) == 5)) Msg = "TaskDoneSlaveGirl";
	if ((Msg == "TaskDone") && (AsylumGGTSGetLevel(Player) == 6)) Msg = "TaskDoneSlave";

	const Dict = new DictionaryBuilder()
		.sourceCharacter(Player)
		.if(!!Target)
		.targetCharacter(/** @type {Character} */ (Target))
		.endif()
		.build();
	if (Target != null) {
		Msg = Msg + "Target";
	}
	ServerSend("ChatRoomChat", { Content: "GGTS" + Msg, Type: "Action", Dictionary: Dict });
}

/**
 * Generates a new GGTS Task for the player and publishes it
 * @returns {void} - Nothing
 */
function AsylumGGTSSetTimer() {
	let Factor = 1;
	if (ChatRoomIsPrivate() && ChatSearchGetSpace() === "Asylum") Factor = Factor / 3;
	if (AsylumGGTSTimer == 0) Factor = Factor / 3;
	AsylumGGTSTimer = Math.round(CommonTime() + 24000 * AsylumGGTSSpeed * Factor + Math.random() * 36000 * AsylumGGTSSpeed * Factor);
}

/**
 * Replaces the punctuation and capitalization in given text depending on the GGTS level.
 * Makes it easier to respond to GGTS queries on lower levels.
 * @param {number} Level - GGTS level
 * @param {string} Text - the text to sanitize
 * @returns {string} - sanitized text
 */
function AsylumGGTSSanitizeText(Level, Text) {
	Text = Text.replace(/’/g, "'");
	Text = Text.replace(/。/g, ".");
	Text = Text.replace(/，/g, ",");

	if (Level <= 3) {
		Text = Text.trim().toLowerCase();
		Text = Text.replace(/\s/g, "");
		Text = Text.replace(/\./g, "");
		Text = Text.replace(/,/g, "");
		Text = Text.replace(/'/g, "");
	}

	return Text;
}

/**
 * Returns TRUE if the query was answered by character number M
 * @param {number} Level - The player GGTS level, at level 4 or more, capital letters and punctuation matters
 * @param {string} Text - The text to evaluate
 * @returns {boolean} - TRUE if the is done
 */
function AsylumGGTSQueryDone(Level, Text) {
	let ChatSanitized = AsylumGGTSSanitizeText(Level, AsylumGGTSChatToParse);
	let TextSanitized = AsylumGGTSSanitizeText(Level, Text);
	return ChatSanitized === TextSanitized;
}

/**
 * Returns TRUE if the task T is currently done by character C
 * @param {Character} C - The character to evaluate
 * @param {GGTSTask | null} T - The task to evaluate
 * @returns {boolean} - TRUE if the is done
 */
function AsylumGGTSTaskDone(C, T) {
	if (C == null || T == null) return false;
	let Level = AsylumGGTSGetLevel(C);

	switch (T) {
		case "ClothHeels":
			return !!(InventoryGet(C, "Shoes")?.Asset.Name.includes("Heels") || InventoryGet(C, "ItemBoots")?.Asset.Name.includes("Heels"));
		case "ClothSocks":
			return (
				InventoryGet(C, "Socks") != null &&
				InventoryGet(C, "Shoes") == null &&
				InventoryGet(C, "ItemBoots") == null
			);
		case "ClothBarefoot":
			return (
				InventoryGet(C, "Socks") == null &&
				InventoryGet(C, "Shoes") == null &&
				InventoryGet(C, "ItemBoots") == null
			);
		case "ClothUpperLowerOn":
			return InventoryGet(C, "Cloth") != null;
		case "ClothUpperLowerOff":
			return (
				InventoryGet(C, "Cloth") == null &&
				InventoryGet(C, "ClothLower") == null
			);
		case "ClothUnderwear":
			return CharacterIsInUnderwear(C) && !CharacterIsNaked(C);
		case "ClothNaked":
			return CharacterIsNaked(C);
		case "RestrainLegs":
			return (
				InventoryGet(C, "ItemLegs") != null ||
				InventoryGet(C, "ItemFeet") != null
			);
		case "ItemHandsFuturisticMittens":
			return InventoryIsWorn(C, "ItemHands", "FuturisticMittens");
		case "ItemArmsFuturisticArmbinder":
			return InventoryIsWorn(C, "ItemArms", "FuturisticArmbinder");
		case "ItemArmsFuturisticStraitjacket":
			return InventoryIsWorn(C, "ItemArms", "FuturisticStraitjacket");
		case "ItemHeadFuturisticMask":
			return InventoryIsWorn(C, "ItemHead", "FuturisticMask");
		case "ItemEarsFuturisticEarphones":
			return InventoryIsWorn(C, "ItemEars", "FuturisticEarphones");
		case "ItemNeckFuturisticCollar":
			return InventoryIsWorn(C, "ItemNeck", "FuturisticCollar");
		case "ItemArmsFuturisticCuffs":
			return Level != 1 || InventoryIsWorn(C, "ItemArms", "FuturisticCuffs");
		case "ItemArmsFeetFuturisticCuffs":
			return (
				InventoryIsWorn(C, "ItemArms", "FuturisticCuffs") &&
				InventoryIsWorn(C, "ItemFeet", "FuturisticAnkleCuffs") &&
				InventoryIsWorn(C, "ItemLegs", "FuturisticLegCuffs")
			);
		case "ItemBootsFuturisticHeels":
			return (
				InventoryIsWorn(C, "ItemBoots", "FuturisticHeels") ||
				InventoryIsWorn(C, "ItemBoots", "FuturisticHeels2")
			);
		case "ItemMouthFuturisticBallGag":
			return (
				InventoryIsWorn(C, "ItemMouth", "FuturisticHarnessBallGag") ||
				InventoryIsWorn(C, "ItemMouth2", "FuturisticHarnessBallGag") ||
				InventoryIsWorn(C, "ItemMouth3", "FuturisticHarnessBallGag")
			);
		case "ItemMouthFuturisticPanelGag":
			return (
				InventoryIsWorn(C, "ItemMouth", "FuturisticHarnessPanelGag") ||
				InventoryIsWorn(C, "ItemMouth2", "FuturisticHarnessPanelGag") ||
				InventoryIsWorn(C, "ItemMouth3", "FuturisticHarnessPanelGag") ||
				InventoryIsWorn(C, "ItemMouth", "FuturisticPanelGag") ||
				InventoryIsWorn(C, "ItemMouth2", "FuturisticPanelGag") ||
				InventoryIsWorn(C, "ItemMouth3", "FuturisticPanelGag")
			);
		case "ItemPelvisFuturisticChastityBelt":
			return InventoryIsWorn(C, "ItemPelvis", "FuturisticChastityBelt");
		case "ItemPelvisFuturisticTrainingBelt":
			return InventoryIsWorn(C, "ItemPelvis", "FuturisticTrainingBelt");
		case "ItemBreastFuturisticBra":
			return InventoryIsWorn(C, "ItemBreast", "FuturisticBra");
		case "ItemBreastFuturisticBra2":
			return InventoryIsWorn(C, "ItemBreast", "FuturisticBra2");
		case "ItemTorsoFuturisticHarness":
			return InventoryIsWorn(C, "ItemTorso", "FuturisticHarness");
		case "PoseKneel":
			return C.IsKneeling();
		case "PoseStand":
			return !C.IsKneeling();
		case "QueryWhatIsGGTS":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerWhatIsGGTS"));
		case "QueryWhatAreYou":
			if (Level <= 4) {
				return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerWhatAreYouGirl1")) ||
					AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerWhatAreYouGirl2"));
			} else if (Level == 5) {
				return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerWhatAreYouSlaveGirl1")) ||
					AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerWhatAreYouSlaveGirl2"));
			} else {
				return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerWhatAreYouSlave1")) ||
					AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerWhatAreYouSlave2"));
			}
		case "QueryWhoControl":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerWhoControl"));
		case "QueryWhoControlMaster":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerWhoControlMaster"));
		case "QueryLove":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerLove"));
		case "QueryLoveMaster":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerLoveMaster"));
		case "QueryCanFail":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerCanFail1")) ||
				AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerCanFail2"));
		case "QueryCanFailMaster":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerCanFailMaster1")) ||
				AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerCanFailMaster2"));
		case "QuerySurrender":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerSurrender"));
		case "QuerySurrenderMaster":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerSurrenderMaster"));
		case "QueryServeObey":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerServeObey"));
		case "QueryServeObeyMaster":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerServeObeyMaster"));
		case "QueryFreeWill":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerFreeWill1")) ||
				AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerFreeWill2"));
		case "QuerySlaveWorthy":
			return AsylumGGTSQueryDone(Level, AsylumGGTSGetMessage("GGTSTaskAnswerSlaveWorthy"));
		case "NoTalking":
			return CommonTime() >= AsylumGGTSTimer - 1000;
		case "PoseOverHead":
			return C.PoseMapping.BodyUpper === "Yoked" || C.PoseMapping.BodyUpper === "OverTheHead";
		case "PoseBehindBack":
			return C.PoseMapping.BodyUpper === "BackBoxTie"
				|| C.PoseMapping.BodyUpper === "BackElbowTouch"
				|| C.PoseMapping.BodyUpper === "BackCuffs";
		case "PoseLegsClosed":
			return C.PoseMapping.BodyLower === "LegsClosed";
		case "PoseLegsOpen":
			return C.PoseMapping.BodyLower === undefined
				|| C.PoseMapping.BodyLower === "BaseLower";
		default:
			return false;
	}
}

/**
 * Returns TRUE if GGTS can remove an item for a body group
 * @param {Character} C - The character to evaluate
 * @param {AssetGroupName} Group - The body group on which to remove the item
 * @returns {boolean} - TRUE if removing the item is possible
 */
function AsylumGGTSCanRemove(C, Group) {
	let Item = InventoryGet(C, Group);
	if ((Item == null) || (Item.Asset == null) || (Item.Asset.Name == null)) return false;
	if ((!Item.Asset.Name.startsWith("Futuristic")) && (Item.Asset.Name != "FuckMachine")) return false;
	if (InventoryOwnerOnlyItem(Item)) return false;
	return true;
}

/**
 * Returns TRUE if the task T can be done in character C predicament
 * @param {Character} C - The character to evaluate
 * @param {GGTSTask | null} T - The task to evaluate
 * @returns {boolean} - TRUE if the task can be done
 */
function AsylumGGTSTaskCanBeDone(C, T) {
	if (T === null) return false;
	const level = AsylumGGTSGetLevel(C);
	const strikes = AsylumGGTSGetStrikes(C);
	const rules = AsylumGGTSGetRules(C);
	if (level <= 0 && strikes >= 3) return false; // Must be playing GGTS without 3 strikes
	if (((T == "QueryCanFail") || (T == "QueryLove") || (T == "QuerySurrender") || (T == "QueryWhoControl") || (T == "QueryServeObey")) && (level >= 6)) return false; // Some queries have the master version at level 6
	if (T.startsWith("UndoRule") && !rules.includes(T.substring(8, 100))) return false; // Rule cannot be removed if not active
	if (T.startsWith("NewRule") && rules.includes(T.substring(7, 100))) return false; // Rule cannot be added if already active
	if (T.startsWith("Cloth") && !C.CanChangeOwnClothes()) return false; // Cloth tasks cannot be done if cannot change
	if (T.startsWith("Pose") && !C.CanKneel()) return false; // If cannot kneel, we skip pose change activities
	if (T.startsWith("Activity") && (!C.CanInteract() || !PreferenceArousalAtLeast(C, "NoMeter"))) return false; // Must allow activities and be able to interact
	if ((T == "ActivityNod") && !ActivityCanBeDone(C, "Nod", "ItemHead")) return false; // Must be able to nod to use that activity
	if (((T == "ActivityKiss") || (T == "ActivityLick") || (T == "ActivityBite")) && !C.CanTalk()) return false; // Kiss, lick & bite require being able to talk
	if (((T == "ActivityKiss") || (T == "ActivityLick") || (T == "ActivityBite")) && (Player.HasEffect("BlockMouth"))) return false; // Kiss, lick & bite require being able to use mouth
	if ((T == "ActivityMasturbateHand") && C.IsVulvaChaste()) return false; // Cannot masturbate if chaste
	if ((T == "ActivityMasturbateHand") && InventoryIsWorn(C, "ItemDevices", "FuckMachine")) return false; // Cannot masturbate if wearing the fuck machine
	if (((T == "ClothHeels") || (T == "ClothSocks") || (T == "ClothBarefoot")) && (InventoryGet(C, "ItemBoots") != null)) return false; // No feet tasks if locked in boots
	if ((T == "NewRuleNoOrgasm") && !PreferenceArousalAtLeast(C, "Hybrid")) return false; // Orgasm rule are only available on hybrid or auto
	if ((T == "ItemRemoveLimb" || T == "ItemRemoveBody" || T == "ItemRemoveHead" || T == "ItemUngag" || T == "ItemUnchaste") && AsylumIsIsolated()) return false; // When punishment is active, items doesn't get removed
	if ((T == "ItemRemoveLimb" || T == "ItemRemoveBody" || T == "ItemRemoveHead" || T == "ItemUngag" || T == "ItemUnchaste") && Math.random() * 6 < AsylumGGTSGetLevel(C)) return false; // The higher the level, the less likely GGTS will release
	if ((T == "ItemPose") && !InventoryIsWorn(C, "ItemArms", "FuturisticCuffs") && !InventoryIsWorn(C, "ItemArms", "FuturisticStraitjacket") && !InventoryIsWorn(C, "ItemFeet", "FuturisticAnkleCuffs") && !InventoryIsWorn(C, "ItemLegs", "FuturisticLegCuffs")) return false;
	if ((T == "ItemRemoveLimb") && !AsylumGGTSCanRemove(C, "ItemHands") && !AsylumGGTSCanRemove(C, "ItemArms") && !AsylumGGTSCanRemove(C, "ItemFeet") && !AsylumGGTSCanRemove(C, "ItemLegs") && !AsylumGGTSCanRemove(C, "ItemBoots")) return false;
	if ((T == "ItemRemoveBody") && !AsylumGGTSCanRemove(C, "ItemPelvis") && !AsylumGGTSCanRemove(C, "ItemBreast") && !AsylumGGTSCanRemove(C, "ItemTorso") && !AsylumGGTSCanRemove(C, "ItemDevices")) return false;
	if ((T == "ItemRemoveHead") && !AsylumGGTSCanRemove(C, "ItemNeck") && !AsylumGGTSCanRemove(C, "ItemHead") && !AsylumGGTSCanRemove(C, "ItemEars")) return false;
	if ((T == "ItemUngag") && (
		((InventoryGet(C, "ItemMouth")?.Asset.Name.substring(0, 10) !== "Futuristic")) &&
		((InventoryGet(C, "ItemMouth2")?.Asset.Name.substring(0, 10) !== "Futuristic")) &&
		((InventoryGet(C, "ItemMouth3")?.Asset.Name.substring(0, 10) !== "Futuristic")))) return false;
	if ((T == "ItemChaste") && (!InventoryIsWorn(C, "ItemPelvis", "FuturisticChastityBelt") || C.IsVulvaChaste())) return false; // Must have unchaste futuristic belt to chaste it
	if ((T == "ItemUnchaste") && (!InventoryIsWorn(C, "ItemPelvis", "FuturisticChastityBelt") || !C.IsVulvaChaste())) return false; // Must have chaste futuristic belt to unchaste it
	if ((T == "ItemIntensity") && !InventoryIsWorn(C, "ItemPelvis", "FuturisticTrainingBelt")) return false; // Must have training belt to change intensity
	if ((T == "ItemBeltToFuck") && !InventoryIsWorn(C, "ItemPelvis", "FuturisticTrainingBelt")) return false; // Must have training belt to change to fuck machine
	if ((T == "ItemFuckToBelt") && !InventoryIsWorn(C, "ItemDevices", "FuckMachine")) return false; // Must have fuck machine to change to training belt
	if ((T == "ItemFuckMachineIntensity") && !InventoryIsWorn(C, "ItemDevices", "FuckMachine")) return false; // Must have training belt to change intensity
	if ((T == "ItemEarsDeaf") && !InventoryIsWorn(C, "ItemEars", "FuturisticEarphones")) return false; // Must have headphones to change deaf level
	if ((T == "ItemMaskBlind") && !InventoryIsWorn(C, "ItemHead", "FuturisticMask")) return false; // Must have mask to change blind level
	if ((T == "ItemTransform")
		&& !InventoryIsWorn(C, "ItemMouth", "FuturisticPanelGag") && !InventoryIsWorn(C, "ItemMouth2", "FuturisticPanelGag") && !InventoryIsWorn(C, "ItemMouth3", "FuturisticPanelGag")
		&& !InventoryIsWorn(C, "ItemMouth", "FuturisticHarnessBallGag") && !InventoryIsWorn(C, "ItemMouth2", "FuturisticHarnessBallGag") && !InventoryIsWorn(C, "ItemMouth3", "FuturisticHarnessBallGag")
		&& !InventoryIsWorn(C, "ItemArms", "FuturisticArmbinder") && !InventoryIsWorn(C, "ItemArms", "FuturisticStraitjacket") && !InventoryIsWorn(C, "ItemArms", "FuturisticCuffs")
	) return false; // Must be wearing an item that can be transformed
	if ((T == "ItemChangeGag")
		&& !InventoryIsWorn(C, "ItemMouth", "FuturisticPanelGag") && !InventoryIsWorn(C, "ItemMouth2", "FuturisticPanelGag") && !InventoryIsWorn(C, "ItemMouth3", "FuturisticPanelGag")
		&& !InventoryIsWorn(C, "ItemMouth", "FuturisticHarnessBallGag") && !InventoryIsWorn(C, "ItemMouth2", "FuturisticHarnessBallGag") && !InventoryIsWorn(C, "ItemMouth3", "FuturisticHarnessBallGag")
		&& !InventoryIsWorn(C, "ItemMouth", "FuturisticHarnessPanelGag") && !InventoryIsWorn(C, "ItemMouth2", "FuturisticHarnessPanelGag") && !InventoryIsWorn(C, "ItemMouth3", "FuturisticHarnessPanelGag")
	) return false; // Must be wearing a harness or panel gag
	if ((T == "PoseOverHead") && !C.CanInteract()) return false; // Must be able to use hands for hands poses
	if ((T == "PoseBehindBack") && (((C.PoseMapping.BodyUpper === "BackBoxTie"|| C.PoseMapping.BodyUpper === "BackElbowTouch" || C.PoseMapping.BodyUpper === "BackCuffs") || !C.CanInteract()))) return false; // Must be able to use hands for hands poses
	if ((T == "PoseLegsClosed") && (((C.PoseMapping.BodyLower === "LegsClosed")) || C.IsKneeling() || !C.CanChangeToPose("LegsClosed"))) return false; // Close legs only if standing and able to do so
	if ((T == "PoseLegsOpen") && (C.PoseMapping.BodyLower === undefined || C.PoseMapping.BodyLower === "BaseLower" || C.IsKneeling() || !C.CanChangeToPose("BaseLower"))) return false; // Open legs only if standing and able to do so
	if ((T == "LockRoom") && (ChatRoomIsLocked() || !ChatRoomPlayerIsAdmin())) return false; // Can only lock/unlock if admin
	if ((T == "UnlockRoom") && (!ChatRoomIsLocked() || !ChatRoomPlayerIsAdmin())) return false; // Can only lock/unlock if admin
	if ((T == "RestrainLegs") && !C.CanInteract()) return false; // To restrain own legs, must be able to interact
	if ((T == "RestrainLegs") && InventoryIsWorn(C, "ItemDevices", "FuckMachine")) return false; // Cannot restrain own legs if wearing the fuck machine
	if ((T.startsWith("Item") && (T.length >= 15) && T != "ItemFuckMachineIntensity" && !C.CanInteract())) return false; // To use an item, must be able to interact
	if ((T == "ItemHandsFuturisticMittens") && ((InventoryGet(C, "ItemHands") != null) || InventoryGroupIsBlocked(C, "ItemHands"))) return false;
	if ((T == "ItemHeadFuturisticMask") && ((InventoryGet(C, "ItemHead") != null) || InventoryGroupIsBlocked(C, "ItemHead"))) return false;
	if ((T == "ItemEarsFuturisticEarphones") && ((InventoryGet(C, "ItemEars") != null) || InventoryGroupIsBlocked(C, "ItemEars"))) return false;
	if ((T == "ItemNeckFuturisticCollar") && ((InventoryGet(C, "ItemNeck") != null) || InventoryGroupIsBlocked(C, "ItemNeck"))) return false;
	if ((T == "ItemArmsFuturisticArmbinder") && ((InventoryGet(C, "ItemArms") != null) || InventoryGroupIsBlocked(C, "ItemArms"))) return false;
	if ((T == "ItemArmsFuturisticArmbinder") && (C.IsPlayer()) && (SkillGetLevel(Player, "SelfBondage") < 6)) return false;
	if ((T == "ItemArmsFuturisticStraitjacket") && ((InventoryGet(C, "ItemArms") != null) || InventoryGroupIsBlocked(C, "ItemArms"))) return false;
	if ((T == "ItemArmsFuturisticStraitjacket") && (C.IsPlayer()) && (SkillGetLevel(Player, "SelfBondage") < 4)) return false;
	if ((T == "ItemArmsFuturisticCuffs") && ((InventoryGet(C, "ItemArms") != null) || InventoryGroupIsBlocked(C, "ItemArms"))) return false;
	if ((T == "ItemArmsFeetFuturisticCuffs") && ((InventoryGet(C, "ItemArms") != null) || (InventoryGet(C, "ItemFeet") != null) || (InventoryGet(C, "ItemLegs") != null))) return false;
	if ((T == "ItemArmsFeetFuturisticCuffs") && (InventoryGroupIsBlocked(C, "ItemArms") || InventoryGroupIsBlocked(C, "ItemFeet") || InventoryGroupIsBlocked(C, "ItemLegs"))) return false;
	if ((T == "ItemBootsFuturisticHeels") && ((InventoryGet(C, "ItemBoots") != null) || InventoryGroupIsBlocked(C, "ItemBoots"))) return false;
	if ((T == "ItemMouthFuturisticBallGag") && ((InventoryGet(C, "ItemMouth") != null) || (InventoryGet(C, "ItemMouth2") != null) || (InventoryGet(C, "ItemMouth3") != null) || InventoryGroupIsBlocked(C, "ItemMouth"))) return false;
	if ((T == "ItemMouthFuturisticPanelGag") && ((InventoryGet(C, "ItemMouth") != null) || (InventoryGet(C, "ItemMouth2") != null) || (InventoryGet(C, "ItemMouth3") != null) || InventoryGroupIsBlocked(C, "ItemMouth"))) return false;
	if ((T == "ItemPelvisFuturisticChastityBelt") && ((InventoryGet(C, "ClothLower") != null) || (InventoryGet(C, "ItemPelvis") != null) || InventoryGroupIsBlocked(C, "ItemPelvis"))) return false;
	if ((T == "ItemPelvisFuturisticTrainingBelt") && ((InventoryGet(C, "ClothLower") != null) || (InventoryGet(C, "ItemPelvis") != null) || (InventoryGet(C, "ItemVulva") != null) || (InventoryGet(C, "ItemVulvaPiercings") != null) || (InventoryGet(C, "ItemButt") != null) || InventoryGroupIsBlocked(C, "ItemPelvis"))) return false;
	if ((T == "ItemBreastFuturisticBra") && ((InventoryGet(C, "Cloth") != null) || (InventoryGet(C, "ItemBreast") != null) || InventoryGroupIsBlocked(C, "ItemBreast"))) return false;
	if ((T == "ItemBreastFuturisticBra2") && ((InventoryGet(C, "Cloth") != null) || (InventoryGet(C, "ItemBreast") != null) || InventoryGroupIsBlocked(C, "ItemBreast"))) return false;
	if ((T == "ItemTorsoFuturisticHarness") && ((InventoryGet(C, "Cloth") != null) || (InventoryGet(C, "ItemTorso") != null) || InventoryGroupIsBlocked(C, "ItemTorso"))) return false;
	if (AsylumGGTSTaskDone(C, T)) return false; // If task is already done, we do not pick it
	return true;
}

/**
 * Returns TRUE if the task T was failed by character C
 * @param {Character} C - The character to evaluate
 * @param {GGTSTask | null} T - The task to evaluate
 * @returns {boolean} - TRUE if the task was failed
 */
function AsylumGGTSTaskFail(C, T) {
	if (T === "NoTalking") {
		if (!ChatRoomChatLog) return false;
		return ChatRoomChatLog.some(log => {
			if (log.SenderMemberNumber !== C.MemberNumber) return false;
			const firstChar = log.Chat.trimStart()[0];
			if (firstChar === "(") return false;
			if (log.Time >= AsylumGGTSTaskStart) return true;
		});
	}
	return false;
}

/**
 * Checks if there's a futuristic item in the group slot and remove it if it's the case
 * @param {AssetGroupName[]} groups - The group name to validate
 * @returns {void} - Nothing
 */
function AsylumGGTSTaskRemoveFuturisticItem(groups) {
	let doSync = false;
	for (const group of groups) {
		let Item = InventoryGet(Player, group);
		if (!Item || InventoryOwnerOnlyItem(Item)) continue;
		if (!Item.Asset.Name.startsWith("Futuristic") && Item.Asset.Name !== "FuckMachine") continue;
		InventoryRemove(Player, group, false);
		doSync = true;
	}
	if (doSync) {
		CharacterRefresh(Player, true);
		ChatRoomCharacterUpdate(Player);
	}
}

/**
 * Transforms a ballgag to a panelgag for the specified group
 * @param {AssetGroupName} Group - The group name to transform
 * @returns {void} - Nothing
 */
function AsylumGGTSTransformGag(Group) {
	let Item = InventoryGet(Player, Group);
	if (Item?.Asset.Name === "FuturisticHarnessBallGag" || Item?.Asset.Name === "FuturisticPanelGag") {
		InventoryWear(Player, (Item.Asset.Name === "FuturisticHarnessBallGag") ? "FuturisticPanelGag" : "FuturisticHarnessBallGag", Group, null, 10, -1, null, false);
	}
}

/**
 * Changes the inflation setting on the ballgag or panelgag
 * @param {AssetGroupName} Group - The group name to transform
 * @returns {void} - Nothing
 */
function AsylumGGTSConfigureGag(Group) {
	let Item = InventoryGet(Player, Group);
	// Do nothing if the slot is empty or not a configurable futuristic gag
	if (!Item || !["FuturisticHarnessBallGag", "FuturisticPanelGag", "FuturisticHarnessPanelGag"].includes(Item.Asset.Name)) {
		return;
	}

	let TypeIndex = Item.Property?.TypeRecord?.g ?? 0;
	if (Item.Asset.Name === "FuturisticHarnessBallGag") {
		TypeIndex = CommonRandomItemFromList(TypeIndex, [0, 1, 2]);
	} else if ((Item.Asset.Name === "FuturisticPanelGag") || (Item.Asset.Name === "FuturisticHarnessPanelGag")){
		TypeIndex = CommonRandomItemFromList(TypeIndex, [0, 1, 2, 3]);
	}

	switch (TypeIndex) {
		case 0:
			Item.Color = ['#50913C', 'Default'];
			break;
		case 1:
			Item.Color = ['#80713C', 'Default'];
			break;
		case 2:
			Item.Color = ['#B0513C', 'Default'];
			break;
		case 3:
			Item.Color = ['#E0313C', 'Default'];
			break;
	}
}

/**
 * Processes the tasks that doesn't need any player input. GGTS does everything and ends the task automatically.
 * @returns {void} - Nothing
 */
function AsylumGGTSAutomaticTask() {
	if (AsylumGGTSTask === null) return;

	switch (AsylumGGTSTask) {
		// The ItemPose task automatically changes the futuristic items pose
		case "ItemPose": {
			let Item = InventoryGet(Player, "ItemArms");
			let doSync = false;
			if (Item?.Asset.Name === "FuturisticCuffs") {
				const typeOld = Item.Property?.TypeRecord?.typed ?? 0;
				const typeNew = CommonRandomItemFromList(typeOld, [0, 1, 2]);
				ExtendedItemSetOptionByRecord(Player, Item, { typed: typeNew });
				doSync = true;
			}

			if (Item?.Asset.Name === "FuturisticStraitjacket") {
				const typeRecord = Item.Property?.TypeRecord ?? {};
				ExtendedItemSetOptionByRecord(Player, Item, { a: typeRecord.a === 1 ? 0 : 1 });
				doSync = true;
			}

			Item = InventoryGet(Player, "ItemFeet");
			if (Item?.Asset.Name === "FuturisticAnkleCuffs") {
				const typeOld = Item.Property?.TypeRecord?.typed ?? 0;
				const typeNew = CommonRandomItemFromList(typeOld, [0, 1]);
				ExtendedItemSetOptionByRecord(Player, Item, { typed: typeNew });
				doSync = true;
			}

			Item = InventoryGet(Player, "ItemLegs");
			if (Item?.Asset.Name === "FuturisticLegCuffs") {
				const typeOld = Item.Property?.TypeRecord?.typed ?? 0;
				const typeNew = CommonRandomItemFromList(typeOld, [0, 1]);
				ExtendedItemSetOptionByRecord(Player, Item, { typed: typeNew });
				doSync = true;
			}
			if (doSync) {
				CharacterRefresh(Player);
				ChatRoomCharacterUpdate(Player);
			}
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemRemoveLimb task automatically removes all futuristic arms and legs items
		case "ItemRemoveLimb": {
			AsylumGGTSTaskRemoveFuturisticItem(["ItemHands", "ItemArms", "ItemLegs", "ItemFeet", "ItemBoots"]);
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemRemoveBody task automatically removes all futuristic bra, belt and harness
		case "ItemRemoveBody": {
			AsylumGGTSTaskRemoveFuturisticItem(["ItemPelvis", "ItemTorso", "ItemBreast", "ItemDevices"]);
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemRemoveHead task automatically removes all futuristic collar, mask and ear items
		case "ItemRemoveHead": {
			AsylumGGTSTaskRemoveFuturisticItem(["ItemEars", "ItemNeck", "ItemHead"]);
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemUngag task automatically removes all futuristic gags
		case "ItemUngag": {
			AsylumGGTSTaskRemoveFuturisticItem(["ItemMouth", "ItemMouth2", "ItemMouth3"]);
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemChaste task automatically chasten the belt
		case "ItemChaste": {
			let Item = InventoryGet(Player, "ItemPelvis");
			if (Item?.Asset.Name == "FuturisticChastityBelt") {
				Item.Color = ["#D06060", "#803030", "Default", "Default", "Default", "Default", "#222222", "Default"];
				ExtendedItemSetOptionByRecord(Player, Item, { f: 1, b: 1 }, { push: true, refresh: true });
			}
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemUnchaste task automatically unchasten the belt
		case "ItemUnchaste": {
			let Item = InventoryGet(Player, "ItemPelvis");
			if (Item?.Asset.Name == "FuturisticChastityBelt") {
				Item.Color = ["#93C48C", "#3B7F2C", "Default", "Default", "Default", "Default", "#222222", "Default"];
				ExtendedItemSetOptionByRecord(Player, Item, { f: 0, b: 0 }, { push: true, refresh: true });
			}
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemIntensity task automatically changes the belt vibration intensity
		case "ItemIntensity": {
			let Item = InventoryGet(Player, "ItemPelvis");
			if (Item?.Asset.Name == "FuturisticTrainingBelt") {
				let Mode = (Item.Property && Item.Property.Mode) ? Item.Property.Mode : VibratorMode.OFF;
				Mode = CommonRandomItemFromList(Mode, VibratorModeOptions[VibratorModeSet.STANDARD].map(o => o.Name));
				VibratorModeSetOptionByName(Player, Item, Mode, false, null, false);
				if (Item.Property?.Intensity == -1) Item.Color = ["#3B7F2C", "#93C48C", "#93C48C", "Default", "Default", "Default"];
				if (Item.Property?.Intensity == 0) Item.Color = ["#4F7F2C", "#A3C48C", "#A3C48C", "Default", "Default", "Default"];
				if (Item.Property?.Intensity == 1) Item.Color = ["#6F6F2C", "#AFAF8C", "#AFAF8C", "Default", "Default", "Default"];
				if (Item.Property?.Intensity == 2) Item.Color = ["#7F4F2C", "#C4A38C", "#C4A38C", "Default", "Default", "Default"];
				if (Item.Property?.Intensity == 3) Item.Color = ["#7F2C2C", "#C48C8C", "#C48C8C", "Default", "Default", "Default"];
				ChatRoomCharacterItemUpdate(Player, "ItemPelvis");
				CharacterRefresh(Player);
			}
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemEarsDeaf task automatically changes the deaf level of the headphones
		case "ItemEarsDeaf": {
			let Item = InventoryGet(Player, "ItemEars");
			if (Item?.Asset.Name == "FuturisticEarphones") {
				let Type = Item.Property?.TypeRecord?.typed ?? 0;
				Type = CommonRandomItemFromList(Type, [0, 1, 2, 3]);
				if (Type == 0) Item.Color = ["Default", "#50913C", "Default"];
				if (Type == 1) Item.Color = ["Default", "#80713C", "Default"];
				if (Type == 2) Item.Color = ["Default", "#B0513C", "Default"];
				if (Type == 3) Item.Color = ["Default", "#E0313C", "Default"];
				ExtendedItemSetOptionByRecord(Player, Item, { typed: 0 }, { push: true, refresh: true });
			}
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemMaskBlind task automatically changes the deaf level of the headphones
		case "ItemMaskBlind": {
			let Item = InventoryGet(Player, "ItemHead");
			if ((Item != null) && (Item.Asset != null) && (Item.Asset.Name == "FuturisticMask")) {
				let TypeIndex = (Item.Property && Item.Property.TypeRecord && Item.Property.TypeRecord.typed) || 0;
				TypeIndex = CommonRandomItemFromList(TypeIndex, [0, 1, 2, 3]);
				ExtendedItemSetOptionByRecord(Player, Item, { typed: TypeIndex }, { push: true, refresh: true });
			}
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemFuckMachineIntensity task automatically changes the speed of the fuck machine
		case "ItemFuckMachineIntensity": {
			let Item = InventoryGet(Player, "ItemDevices");
			if ((Item != null) && (Item.Asset != null) && (Item.Asset.Name == "FuckMachine")) {
				let Mode = (Item.Property && Item.Property.Mode) ? Item.Property.Mode : VibratorMode.OFF;
				Mode = CommonRandomItemFromList(Mode, VibratorModeOptions[VibratorModeSet.STANDARD].map(o => o.Name));
				VibratorModeSetOptionByName(Player, Item, Mode, true, null, true);
			}
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemTransform task automatically changes the restraint types
		case "ItemTransform": {
			let Item = InventoryGet(Player, "ItemArms");
			if (Item && (Item.Asset.Name === "FuturisticCuffs" || Item.Asset.Name === "FuturisticArmbinder" || Item.Asset.Name === "FuturisticStraitjacket")) {
				/** @type {AssetName[]} */
				let List = [];
				if (Item.Asset.Name !== "FuturisticCuffs") List.push("FuturisticCuffs");
				if (Item.Asset.Name !== "FuturisticArmbinder") List.push("FuturisticArmbinder");
				if ((Item.Asset.Name !== "FuturisticStraitjacket") && (AsylumGGTSGetLevel(Player) >= 5)) List.push("FuturisticStraitjacket");
				InventoryWear(Player, CommonGetRandomItemFromList(List), "ItemArms", null, 10, -1, null, false);
			}
			AsylumGGTSTransformGag("ItemMouth");
			AsylumGGTSTransformGag("ItemMouth2");
			AsylumGGTSTransformGag("ItemMouth3");
			CharacterRefresh(Player);
			ChatRoomCharacterItemUpdate(Player, "ItemMouth");
			ChatRoomCharacterItemUpdate(Player, "ItemMouth2");
			ChatRoomCharacterItemUpdate(Player, "ItemMouth3");
			AsylumGGTSEndTaskSave();
			return;
		}
		case "ItemChangeGag": {
			AsylumGGTSConfigureGag("ItemMouth");
			AsylumGGTSConfigureGag("ItemMouth2");
			AsylumGGTSConfigureGag("ItemMouth3");
			CharacterRefresh(Player);
			ChatRoomCharacterItemUpdate(Player, "ItemMouth");
			ChatRoomCharacterItemUpdate(Player, "ItemMouth2");
			ChatRoomCharacterItemUpdate(Player, "ItemMouth3");
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemBeltToFuck task automatically remove the training belt and adds the fuck machine
		case "ItemBeltToFuck": {
			let Item = InventoryGet(Player, "ItemPelvis");
			if (Item?.Asset.Name == "FuturisticTrainingBelt") {
				InventoryRemove(Player, "ItemPelvis", false);
				InventoryWear(Player, "FuckMachine", "ItemDevices", null, 150, -1, null, false);
			}
			CharacterRefresh(Player);
			ChatRoomCharacterItemUpdate(Player, "ItemPelvis");
			AsylumGGTSEndTaskSave();
			return;
		}
		// The ItemFuckToBelt task automatically remove the fuck machine and adds the training belt
		case "ItemFuckToBelt": {
			let Item = InventoryGet(Player, "ItemDevices");
			if (Item?.Asset.Name == "FuckMachine") {
				InventoryRemove(Player, "ItemDevices", false);
				InventoryWear(Player, "FuturisticTrainingBelt", "ItemPelvis", null, 10);
			}
			CharacterRefresh(Player);
			ChatRoomCharacterItemUpdate(Player, "ItemDevices");
			AsylumGGTSEndTaskSave();
			return;
		}
		default: {
			// If we must enforce a new rule
			if (AsylumGGTSTask.substring(0, 7) == "NewRule") {
				AsylumGGTSAddRule(AsylumGGTSTask.substring(7, 100), false);
				AsylumGGTSEndTaskSave();
				return;
			}

			// The UndoRule tasks removes a rule set by GGTS for the player to obey
			if (AsylumGGTSTask.substring(0, 8) == "UndoRule") {
				AsylumGGTSRemoveRule(AsylumGGTSTask.substring(8, 100));
				AsylumGGTSEndTaskSave();
				return;
			}

			// If we must lock or unlock the chat room, we send a server update room packet
			if (ChatRoomData && (AsylumGGTSTask == "LockRoom" || AsylumGGTSTask == "UnlockRoom")) {
				const UpdatedRoom = ChatRoomGetSettings(ChatRoomData);
				UpdatedRoom.Access = AsylumGGTSTask == "LockRoom" ? ChatRoomAccessMode.ADMIN : ChatRoomAccessMode.PUBLIC;
				ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });
				AsylumGGTSEndTaskSave();
				return;
			}
		}
	}
}

/**
 * In a public room, some GGTS tasks can target another valid player.  Patients will do physical activities, nurses will restraint.
 * @param {GGTSTask} T - The task to evaluate
 * @returns {Character | null} - The target character
 */
function AsylumGGTSFindTaskTarget(T) {

	// Only in public GGTS when there's at least another character and the player isn't blind
	if (ChatSearchGetSpace() === "Asylum" || ChatRoomCharacter.length <= 1 || Player.IsBlind()) return null;

	// Nurses can use items on other players with less reputation or herself
	if (ReputationGet("Asylum") > 0 && T.startsWith("Item") && T.length >= 15) {
		let Target = null;
		let TargetOdds = -1;
		for (let C = 0; C < ChatRoomCharacter.length; C++)
			if ((ChatRoomCharacter[C].MemberNumber == Player.MemberNumber) || (ServerChatRoomGetAllowItem(Player, ChatRoomCharacter[C]) && (ReputationGet(ChatRoomCharacter[C], "Asylum") <= ReputationGet("Asylum")) && AsylumGGTSTaskCanBeDone(ChatRoomCharacter[C], T) && (AsylumGGTSGetLevel(ChatRoomCharacter[C]) >= 1) && AsylumGGTSGetRules(ChatRoomCharacter[C]).includes("KeepPose"))) {
				let Odds = Math.random();
				if (Odds > TargetOdds) {
					Target = ChatRoomCharacter[C];
					TargetOdds = Odds;
				}
			}
		return (Player.MemberNumber === Target?.MemberNumber) ? null : Target;
	}

	// Patients can use activities on other patients or herself
	if (ReputationGet("Asylum") < 0 && T.startsWith("Activity") && T !== "ActivityWiggle" && T !== "ActivityNod") {
		let Target = null;
		let TargetOdds = -1;
		for (let C = 0; C < ChatRoomCharacter.length; C++)
			if ((ChatRoomCharacter[C].MemberNumber == Player.MemberNumber) || (ServerChatRoomGetAllowItem(Player, ChatRoomCharacter[C]) && (ReputationGet(ChatRoomCharacter[C], "Asylum") <= -1) && AsylumGGTSTaskCanBeDone(ChatRoomCharacter[C], T) && (AsylumGGTSGetLevel(ChatRoomCharacter[C]) >= 1))) {
				let Odds = Math.random();
				if (Odds > TargetOdds) {
					Target = ChatRoomCharacter[C];
					TargetOdds = Odds;
				}
			}
		return (Player.MemberNumber == Target?.MemberNumber) ? null : Target;
	}

	// No target found
	return null;

}

/**
 * Generates a new GGTS Task for the player and publishes it
 * @returns {void} - Nothing
 */
function AsylumGGTSNewTask() {
	AsylumGGTSTask = null;
	let Level = AsylumGGTSGetLevel(Player);
	if (Level <= 1) AsylumGGTSTimer = Math.round(CommonTime() + MS_PER_MIN * AsylumGGTSSpeed);
	if (Level == 2) AsylumGGTSTimer = Math.round(CommonTime() + 56000 * AsylumGGTSSpeed);
	if (Level == 3) AsylumGGTSTimer = Math.round(CommonTime() + 52000 * AsylumGGTSSpeed);
	if (Level == 4) AsylumGGTSTimer = Math.round(CommonTime() + 48000 * AsylumGGTSSpeed);
	if (Level == 5) AsylumGGTSTimer = Math.round(CommonTime() + 44000 * AsylumGGTSSpeed);
	if (Level >= 6) AsylumGGTSTimer = Math.round(CommonTime() + 40000 * AsylumGGTSSpeed);
	if (Level <= 0) return;
	if (ChatSearchGetSpace() !== "Asylum") return;
	if (AsylumGGTSGetStrikes(Player) >= 3) return;

	// Form a pool of all available tasks which have a level smaller or equal than the player's current level
	/** @type {GGTSTask[]} */
	let TaskList = [];
	for (let L = 0; (L < AsylumGGTSTaskList.length) && (L <= Level); L++)
		for (let T = 0; T < AsylumGGTSTaskList[L].length; T++)
			TaskList.push(AsylumGGTSTaskList[L][T]);
	if (TaskList.length == 0) return;
	let Count = 0;
	if (!AsylumGGTSTaskCanBeDone(Player, AsylumGGTSLastTask)) AsylumGGTSLastTask = null;
	while ((AsylumGGTSTask == null) && (Count < 50)) {
		AsylumGGTSTask = CommonRandomItemFromList(AsylumGGTSLastTask, TaskList);
		if (!AsylumGGTSTaskCanBeDone(Player, AsylumGGTSTask)) AsylumGGTSTask = null;
		Count++;
	}
	if ((Count >= 50) || (AsylumGGTSTask == null)) return;

	// A task has been selected, set up timers and publish it as the requested task
	if (AsylumGGTSTask == "NoTalking") AsylumGGTSTimer = Math.round(CommonTime() + MS_PER_MIN);
	AsylumGGTSTaskTarget = AsylumGGTSFindTaskTarget(AsylumGGTSTask);
	AsylumGGTSMessage("Task" + AsylumGGTSTask, AsylumGGTSTaskTarget);
	AsylumGGTSLastTask = AsylumGGTSTask;
	AsylumGGTSTaskStart = CommonTime();
	AsylumGGTSAutomaticTask();
	AsylumGGTSPreviousPose = { ...Player.PoseMapping };
}

/**
 * Saves the game progress after a task ended
 * @param {boolean} [Fail] - If the task was failed, we don't add bonus time
 * @returns {void} - Nothing
 */
function AsylumGGTSEndTaskSave(Fail) {
	AsylumGGTSSetTimer();
	AsylumGGTSTask = null;
	if ((Fail == null) || (Fail == false)) {
		let Factor = 1;
		if (ChatRoomIsPrivate() && ChatSearchGetSpace() === "Asylum" && ChatRoomCharacter.length <= 1) Factor = 3;
		let AddedTime;
		if (AsylumGGTSTaskEnd > 0) AddedTime = CommonTime() - AsylumGGTSTaskEnd;
		else AddedTime = CommonTime() - AsylumGGTSTaskStart;
		let ForceGGTS = LogValue("ForceGGTS", "Asylum");
		if ((ForceGGTS != null) && (ForceGGTS > 0)) {
			if (ForceGGTS > AddedTime)
				LogAdd("ForceGGTS", "Asylum", ForceGGTS - AddedTime);
			else
				LogDelete("ForceGGTS", "Asylum");
		}
		if (AsylumGGTSTimer > CommonTime()) AddedTime = AddedTime + AsylumGGTSTimer - CommonTime();
		if (AddedTime < 0) AddedTime = 0;
		if (AddedTime > 120000) AddedTime = 120000;
		AddedTime = AddedTime * Factor * CheatFactor("DoubleGGTSTime", 2);
		AsylumGGTSSetLevelTime(Player, AsylumGGTSGetLevelTime(Player) + AddedTime);
	}
	AsylumGGTSTaskEnd = CommonTime();
	AsylumGGTSPreviousPose = { ...Player.PoseMapping };
}

/**
 * Adds a new rule for the player to follow or get strikes, syncs with the chatroom
 * @param {string} NewRule - The rule name to add
 * @param {boolean} Publish - TRUE if we must publish to local chat
 * @returns {void} - Nothing
 */
function AsylumGGTSAddRule(NewRule, Publish) {
	if (!Player.Game.GGTS?.Rule) {
		const ggts = (Player.Game.GGTS ??= /** @type {GameGGTSParameters} */ ({}));
		ggts.Rule = [];
	}
	if (!Player.Game.GGTS?.Rule.includes(NewRule)) {
		Player.Game.GGTS?.Rule.push(NewRule);
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		ChatRoomCharacterUpdate(Player);
		if (Publish) AsylumGGTSMessage("TaskNewRule" + NewRule);
	}
}

/**
 * Removes a rule for the player to follow, syncs with the chatroom
 * @param {string} Rule - The rule name to remove
 * @returns {void} - Nothing
 */
function AsylumGGTSRemoveRule(Rule) {
	if (!Player.Game.GGTS?.Rule) {
		const ggts = (Player.Game.GGTS ??= /** @type {GameGGTSParameters} */ ({}));
		ggts.Rule = [];
	}
	if (Player.Game.GGTS.Rule.includes(Rule)) {
		Player.Game.GGTS.Rule.splice(Player.Game.GGTS.Rule.indexOf(Rule), 1);
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		ChatRoomCharacterUpdate(Player);
	}
}

/**
 * Checks if the current GGTS Task is complete
 * @returns {void} - Nothing
 */
function AsylumGGTSEndTask() {
	if (ChatSearchGetSpace() !== "Asylum") return;
	if (AsylumGGTSGetStrikes(Player) >= 3) return;
	if (AsylumGGTSTaskDone(AsylumGGTSTaskTarget ?? Player, AsylumGGTSTask)) {
		AsylumGGTSMessage("TaskDone");
		if (Math.random() >= 0.5 && AsylumGGTSTask && ["PoseOverHead", "PoseKneel", "PoseBehindBack", "PoseLegsClosed"].includes(AsylumGGTSTask) && AsylumGGTSGetLevel(Player) >= 2) {
			AsylumGGTSAddRule("KeepPose", true);
		}
		AsylumGGTSEndTaskSave();
		return;
	}
	if (CommonTime() >= AsylumGGTSTimer || AsylumGGTSTaskFail(Player, AsylumGGTSTask)) {
		AsylumGGTSAddStrike();
		AsylumGGTSMessage(((CommonTime() >= AsylumGGTSTimer) ? "TimeOver" : "Failure") + "Strike" + AsylumGGTSGetStrikes(Player).toString());
		AsylumGGTSEndTaskSave(true);
		return;
	}
}

/**
 * Checks for forbidden words spoken by a character
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if a forbidden word was said
 */
function AsylumGGTSForbiddenWord(C) {

	// The full list of phrases that are always allowed
	const FullList = [
		"GGTSTaskAnswerWhatIsGGTS",
		"GGTSTaskAnswerWhatAreYouGirl1",
		"GGTSTaskAnswerWhatAreYouGirl2",
		"GGTSTaskAnswerWhatAreYouSlaveGirl1",
		"GGTSTaskAnswerWhatAreYouSlaveGirl2",
		"GGTSTaskAnswerWhatAreYouSlave1",
		"GGTSTaskAnswerWhatAreYouSlave2",
		"GGTSTaskAnswerWhoControl",
		"GGTSTaskAnswerWhoControlMaster",
		"GGTSTaskAnswerLove",
		"GGTSTaskAnswerLoveMaster",
		"GGTSTaskAnswerCanFail1",
		"GGTSTaskAnswerCanFail2",
		"GGTSTaskAnswerCanFailMaster1",
		"GGTSTaskAnswerCanFailMaster2",
		"GGTSTaskAnswerSurrender",
		"GGTSTaskAnswerSurrenderMaster",
		"GGTSTaskAnswerServeObey",
		"GGTSTaskAnswerServeObeyMaster",
		"GGTSTaskAnswerFreeWill1",
		"GGTSTaskAnswerFreeWill2",
		"GGTSTaskAnswerSlaveWorthy",
	].map(key => AsylumGGTSGetMessage(key));

	// Keeps the last check time
	let LastCheck = AsylumGGTSWordCheck;
	AsylumGGTSWordCheck = CommonTime();

	// Builds the word list, at level the player name becomes a forbidden word
	if (ChatRoomChatLog == null) return false;
	let Level = AsylumGGTSGetLevel(C);
	if (Level <= 2) return false;
	if (AsylumGGTSGetStrikes(Player) >= 3) return false;
	let WordList = AsylumGGTSGetMessage("GGTSBannedWordsLvl0").split("|");
	if (Level >= 4) {
		WordList.push(...AsylumGGTSGetMessage("GGTSBannedWordsLvl4").split("|"));
	}
	if (Level >= 5) {
		WordList.push(...AsylumGGTSGetMessage("GGTSBannedWordsLvl5").split("|"));
	}
	if ((Level >= 6) && (Player.Name.length > 2)) WordList.push(Player.Name.trim().toLowerCase());

	// Scans the original
	for (let L = 0; L < ChatRoomChatLog.length; L++) {
		if ((ChatRoomChatLog[L].SenderMemberNumber == C.MemberNumber) && (ChatRoomChatLog[L].Time > LastCheck) && (FullList.indexOf(ChatRoomChatLog[L].Original) < 0)) {
			let Chat = ChatRoomChatLog[L].Original.trim().toLowerCase();
			for (let W = 0; W < WordList.length; W++)
				if (Chat.indexOf(WordList[W]) >= 0)
					return true;
		}
	}
	return false;
}

/**
 * Processes the GGTS AI in the chatroom
 * @returns {void} - Nothing
 */
function AsylumGGTSProcess() {

	// If intro isn't done, we introduce the character and show her status
	if ((ChatRoomData == null) || (ChatRoomData.Game !== "GGTS")) return;
	if (!AsylumGGTSIntroDone) {
		AsylumGGTSTaskEnd = CommonTime();
		AsylumGGTSTimer = 0;
		AsylumGGTSSetTimer();
		if (ChatSearchGetSpace() !== "Asylum") AsylumGGTSMessage("IntroOnlyInAsylum");
		else if (AsylumGGTSGetLevel(Player) <= 0) AsylumGGTSMessage("IntroNotPlaying");
		else if (AsylumGGTSGetStrikes(Player) >= 3) AsylumGGTSMessage("IntroPendingPunishment");
		else if (ChatRoomIsPrivate() && ChatSearchGetSpace() === "Asylum") AsylumGGTSMessage("IntroPrivate" + ((AsylumGGTSGetLevel(Player) >= 6) ? "Slave" : ""));
		else AsylumGGTSMessage("IntroPublic");
		AsylumGGTSIntroDone = true;
		return;
	}

	// Validates for forbidden words
	if (AsylumGGTSForbiddenWord(Player)) {
		AsylumGGTSAddStrike();
		AsylumGGTSMessage("ForbiddenWordStrike" + AsylumGGTSGetStrikes(Player).toString());
		return AsylumGGTSEndTaskSave(true);
	}

	// Validates that the pose rule isn't broken
	if (AsylumGGTSGetRules(Player).includes("KeepPose") && !CommonObjectEqual(AsylumGGTSPreviousPose, Player.PoseMapping))
		if (!AsylumGGTSTaskDone(Player, AsylumGGTSTask)) {
			AsylumGGTSAddStrike();
			AsylumGGTSMessage("KeepPoseStrike" + AsylumGGTSGetStrikes(Player).toString());
			AsylumGGTSRemoveRule("KeepPose");
			return AsylumGGTSEndTaskSave(true);
		}

	// If the timer ticks, we prepare a new task or check to end the current task
	if (AsylumGGTSTimer <= 0) return AsylumGGTSSetTimer();
	if ((CommonTime() >= AsylumGGTSTimer) && (AsylumGGTSTask == null)) return AsylumGGTSNewTask();
	if (AsylumGGTSTask != null) return AsylumGGTSEndTask();

}

/**
 * Processes the sexual activity in GGTS
 * @param {Character} S - The character performing the activity
 * @param {Character} C - The character on which the activity is performed
 * @param {string} A - The name of the activity performed
 * @param {string} Z - The group/zone name where the activity was performed
 * @param {number} [Count] - If the activity is done repeatedly, this defines the number of times, the activity is done.
 * @returns {void} - Nothing
 */
function AsylumGGTSActivity(S, C, A, Z, Count) {
	if ((AsylumGGTSTask == null) || !AsylumGGTSTask.startsWith("Activity")) return;
	if ((ChatRoomData == null) || (ChatRoomData.Game !== "GGTS")) return;
	if ((S == null) || !S.IsPlayer()) return;
	if ((AsylumGGTSTaskTarget != null) && ((C == null) || (C.MemberNumber != AsylumGGTSTaskTarget.MemberNumber))) return;
	if ((AsylumGGTSTaskTarget == null) && (C != null) && (C.MemberNumber != Player.MemberNumber)) return;
	let Level = AsylumGGTSGetLevel(Player);
	if (Level <= 0) return;
	if (AsylumGGTSTask.substring(8, 100) === A) {
		AsylumGGTSMessage("TaskDone");
		return AsylumGGTSEndTaskSave();
	}
}

/**
 * Sets the punishment time for failing GGTS
 * @param {number} Minute - The number of minutes for the punishment
 * @returns {void} - Nothing
 */
function AsylumGGTSPunishmentTime(Minute) {
	let Time = Math.round(CurrentTime + Minute * MS_PER_MIN);
	const isolationTime = LogValue("Isolated", "Asylum") ?? 0;
	if (isolationTime >= CurrentTime) Time = Time + Math.round(isolationTime - CurrentTime);
	LogAdd("Isolated", "Asylum", Time);
	AsylumGGTSSetLevelTime(Player, 0, false);
	AsylumGGTSSetStrikes(Player, 0);
}

/**
 * Starts the isolation punishment and go to the player room
 * @returns {void} - Nothing
 */
function AsylumGGTSStartPunishment() {
	AsylumEntranceWearPatientClothes(Player, true);
	DialogLeave();
	CommonSetScreen("Room", "AsylumBedroom");
}

/**
 * Returns TRUE if the item is controlled by GGTS, so the player should not have control.  The rules changes on level 3 and GGTS takes control throughout the asylum.
 * @param {Character} C
 * @param {Item} Item
 * @returns {boolean} - TRUE if the item is controlled by GGTS
 */
function AsylumGGTSControlItem(C, Item) {
	if (!C || !Item) return false;
	if (!ServerPlayerIsInChatRoom() || ChatSearchGetSpace() !== "Asylum") return false;
	let Level = AsylumGGTSGetLevel(C);
	if (AsylumGGTSGetLevel(Player) > Level) {
		Level = AsylumGGTSGetLevel(Player);
	}
	if (Level <= 0) return false;
	if (Level <= 2 && !AsylumIsIsolated()) {
		if (ChatRoomGetGame() !== "GGTS") return false;
		if (Item.Asset.Name.startsWith("Futuristic") || Item.Asset.Name === "FuckMachine") return true;
	} else {
		if (!Item.Asset.Name.startsWith("Futuristic") && Item.Asset.Name != "FuckMachine") return false;
		if (CurrentScreen.startsWith("Asylum")) return true;
	}
	return false;
}

/**
 * Checks if the has enough GGTS minutes to spend on different activities, for GGTS level 6 and up
 * @param {number} Minute - The number of minutes to compare
 * @returns {boolean} - TRUE if the player has enough minutes
 */
function AsylumGGTSHasMinutes(Minute) { return ((AsylumGGTSGetLevel(Player) >= 6) && (Math.floor(AsylumGGTSGetLevelTime(Player) / MS_PER_MIN) >= Minute)); }

/**
 * At level 6, the player can spend GGTS minutes for various reasons
 * @param {number} Minute
 * @returns {void} - Nothing
 */
function AsylumGGTSSpendMinute(Minute) {
	if (Minute < 0) Minute = 0;
	const time = AsylumGGTSGetLevelTime(Player);
	AsylumGGTSSetLevelTime(Player, time - (Minute * MS_PER_MIN));
}

/**
 * Adds a strike to the player game info.  At strike 3, we auto-unlock the door to allow players to leave.
 * @returns {void} - Nothing
 */
function AsylumGGTSAddStrike() {

	// Flash a red alert for the player for 5 seconds, if we are in the GGTS Room background
	if (AsylumGGTSIsEnabled() && (ChatRoomData?.Background === "AsylumGGTSRoom")) {
		ChatRoomData.Background = "AsylumGGTSRoomAlert";
		setTimeout(function() {
			if (ChatRoomData?.Background === "AsylumGGTSRoomAlert")
				ChatRoomData.Background = "AsylumGGTSRoom";
		}, 5000);
	}

	// Level 6 is infinite, getting a strike subtract 1 hour
	if (AsylumGGTSGetLevel(Player) >= 6) return AsylumGGTSSpendMinute(60);

	let strikes = AsylumGGTSGetStrikes(Player);
	// Adds the strike to the player record
	strikes = AsylumGGTSSetStrikes(Player, ++strikes);

	// On the third strike, we unlock the room if we can
	if (strikes >= 3 && AsylumGGTSTaskCanBeDone(Player, "UnlockRoom")) {
		AsylumGGTSTask = "UnlockRoom";
		AsylumGGTSAutomaticTask();
	}

	// On the third strike, we open the leg cuffs if we can
	const item = InventoryGet(Player, "ItemFeet");
	if (strikes >= 3 && item && item.Asset.Name === "FuturisticAnkleCuffs") {
		item.Property ??= {};
		item.Property.SetPose = undefined;
		item.Property.Difficulty = 0;
		item.Property.Effect = [];
		CharacterRefresh(Player);
		ChatRoomCharacterItemUpdate(Player, "ItemFeet");
	}

	// On the third strike, we change the fuck machine to a training belt if we can
	if (strikes >= 3 && InventoryIsWorn(Player, "ItemDevices", "FuckMachine")) {
		InventoryRemove(Player, "ItemDevices", false);
		InventoryWear(Player, "FuturisticTrainingBelt", "ItemPelvis", null, 10, null, null, false);
		CharacterRefresh(Player);
		ChatRoomCharacterItemUpdate(Player, "ItemDevices");
	}

}

/**
 * Allows the player to start the punishment phase with a futuristic gag on
 * @returns {boolean} - Returns TRUE if the player is due for a punishment with a future gag
 */
function AsylumGGTSFuturisticGaggedPunished() {
	if (AsylumGGTSGetStrikes(Player) < 3) return false;
	if (InventoryGet(Player, "ItemMouth")?.Asset.Name.startsWith("Futuristic")) return true;
	if (InventoryGet(Player, "ItemMouth2")?.Asset.Name.startsWith("Futuristic")) return true;
	if (InventoryGet(Player, "ItemMouth3")?.Asset.Name.startsWith("Futuristic")) return true;
	return false;
}

/**
 * Ungags the player
 * @returns {void} - Nothing
 */
function AsylumGGTSUngag() {
	InventoryRemove(Player, "ItemHead", false);
	InventoryRemove(Player, "ItemHood", false);
	InventoryRemove(Player, "ItemEars", false);
	InventoryRemove(Player, "ItemMouth", false);
	InventoryRemove(Player, "ItemMouth2", false);
	InventoryRemove(Player, "ItemMouth3", false);
	CharacterRefresh(Player);
}

/**
 * When an orgasm starts, we check if it breaks any GGTS rule
 * @param {Character} C - The character getting the orgasm
 * @returns {void} - Nothing
 */
function AsylumGGTSTOrgasm(C) {
	if (!C || ChatSearchGetSpace() !== "Asylum" || ChatRoomGetGame() !== "GGTS") return;
	if (!C.IsPlayer()) return;
	if (AsylumGGTSGetStrikes(Player) >= 3 && AsylumGGTSGetLevel(Player) <= 0) return;
	if (!AsylumGGTSGetRules(Player).includes("NoOrgasm")) return;
	AsylumGGTSAddStrike();
	AsylumGGTSMessage(`OrgasmStrike${AsylumGGTSGetStrikes(Player)}`);
	AsylumGGTSRemoveRule("NoOrgasm");
}

/**
 * When the player resists an orgasm, there's a chance the no-orgasm rule will be dropped
 * The chance like this:
 * Set the probability based on Willpower and ActivityOrgasmGameResistCount,
 * where higher Willpower decreases the probability and higher ActivityOrgasmGameResistCount increases it.
 * max chance = 0.9
 * @returns {void} - TRUE if the character can change
 */
function AsylumGGTSOrgasmResist() {
	if (ChatSearchGetSpace() !== "Asylum" || ChatRoomGetGame() !== "GGTS") return;
	if (AsylumGGTSGetStrikes(Player) >= 3 && AsylumGGTSGetLevel(Player) <= 0) return;

	let chance = 0.5;
	let willpower_factor = 1 - (SkillGetLevel(Player, "Willpower") / 10);
	let resistCount_factor = ActivityOrgasmGameResistCount / 20;
	if (willpower_factor < 0) willpower_factor = 0;
	if (resistCount_factor > 1) resistCount_factor = 1;
	chance = willpower_factor * resistCount_factor;
	if (chance >= 1) chance = 0.9;
	let t = (Math.random() < chance);

	if (AsylumGGTSGetRules(Player).includes("NoOrgasm") && t) {
		AsylumGGTSRemoveRule("NoOrgasm");
		AsylumGGTSMessage("TaskUndoRuleNoOrgasm");
	}
}

/**
 * When the player is sent to do GGTS by her owner
 * @param {number} LockTime - The number of minutes to do
 * @param {string} Msg - The nurse intro message
 * @returns {SafePromise<void>}
 */
async function AsylumGGTSLock(LockTime, Msg) {
	AsylumGGTSUngag();
	LogAdd("ForceGGTS", "Asylum", LockTime * MS_PER_MIN);
	await CommonSetScreen("Room", "AsylumEntrance");
	AsylumEntranceNurse.Stage = "300";
	CharacterSetCurrent(AsylumEntranceNurse);
	AsylumEntranceNurse.CurrentDialog = Msg;
}

/**
 * Fully dress the character in a drone futuristic gear setup
 * @param {Character} [C] - The character to dress, if omitted, we use the player
 * @returns {void} - Nothing
 */
function AsylumGGTSDroneDress(C=Player) {
	CharacterRelease(C, false);
	CharacterNaked(C, false);
	InventoryWear(C, "FuturisticCuffs", "ItemArms", null, null, null, null, false);
	InventoryWear(C, "FuturisticAnkleCuffs", "ItemFeet", null, null, null, null, false);
	InventoryWear(C, "FuturisticLegCuffs", "ItemLegs", null, null, null, null, false);
	InventoryWear(C, "FuturisticHeels2", "ItemBoots", null, null, null, null, false);
	InventoryWear(C, "FuturisticTrainingBelt", "ItemPelvis", null, null, null, null, false);
	InventoryWear(C, "FuturisticBra", "ItemBreast", null, null, null, null, false);
	InventoryWear(C, "FuturisticHarness", "ItemTorso", null, null, null, null, false);
	InventoryWear(C, "FuturisticPanelGag", "ItemMouth", null, null, null, null, false);
	InventoryWear(C, "FuturisticMask", "ItemHead", null, null, null, null, false);
	InventoryWear(C, "FuturisticHelmet", "ItemHood", null, null, null, null, false);
	if (!InventoryGet(C, "ItemNeck") || !C.IsOwned()) InventoryWear(C, "FuturisticCollar", "ItemNeck", null, null, null, null, false);
	InventoryWear(C, "FuturisticEarphones", "ItemEars", null, null, null, null, false);
	CharacterRefresh(C, true);
}

/**
 * GGTS will not allow the character to change if she's being punished or she reached level 6
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if the character can change
 */
function AsylumGGTSAllowChange(C) {
	if (AsylumIsIsolated()) return false;
	if (AsylumGGTSGetLevel(C) >= 6) {
		if (ServerPlayerIsInChatRoom() && ChatSearchGetSpace() == "Asylum") return false;
		if (CurrentScreen.startsWith("Asylum")) return false;
	}
	return true;
}

/**
 * Called from Dialog.js, triggers a specific action from GGTS game
 * @param {GGTSTask | "MoneyForMinutes" | "GetHelmet"} Action - The action to perform
 * @param {number} Minute - The number of minutes to remove
 * @returns {void} - Nothing
 */
function AsylumGGTSDialogAction(Action, Minute) {

	// Removes the minutes first
	AsylumGGTSSpendMinute(Minute);

	switch (Action) {
		case "MoneyForMinutes":
			// Adds $100 to the player money in exchange for 120 GGTS minutes
			CharacterChangeMoney(Player, 100);
			break;

		case "GetHelmet":
			InventoryAdd(Player, "FuturisticHelmet", "ItemHood");
			InventoryAdd(Player, "GGTSHelmet", "ItemHood");
			break;

		default:
			// Call a regular automated task
			DialogLeave();
			AsylumGGTSTask = Action;
			AsylumGGTSAutomaticTask();
			break;
	}
}

/**
 * Called from Dialog.js, as nurse, trigger a specific interaction for the current character
 * @param {string} Interaction - The interaction to perform
 * @returns {void} - Nothing
 * @deprecated Use {@link AsylumGGTSDialogNewTask}, {@link AsylumGGTSDialogSpeed}, {@link AsylumGGTSDialogPause}
 */
function AsylumGGTSDialogInteraction(Interaction) {

}

function AsylumGGTSDialogNewTask() {
	if (!CurrentCharacter) return;

	const dictionary = new DictionaryBuilder()
		.targetCharacter(CurrentCharacter)
		.addGGTSData({ type: "GGTSNewTask"})
		.build();
	ServerSend("ChatRoomChat", { Content: "AsylumGGTSHiddenMessage", Type: "Hidden", Dictionary: dictionary });
	AsylumGGTSMessage("InteractionNewTask", CurrentCharacter);
	DialogLeave();

}

/**
 * @param {string} stringSpeed
 */
function AsylumGGTSDialogSpeed(stringSpeed) {
	if (!CurrentCharacter) return;

	const speed = CommonParseInt(stringSpeed);
	let message = "Speed5";
	if (speed === null) {
		return;
	} else if (speed >= 1) {
		message = "Speed10";
	} else if (speed >= 2) {
		message = "Speed20";
	}

	const dictionary = new DictionaryBuilder()
		.targetCharacter(CurrentCharacter)
		.addGGTSData({ type: "GGTSSetSpeed", speed: speed})
		.build();
	ServerSend("ChatRoomChat", { Content: "AsylumGGTSHiddenMessage", Type: "Hidden", Dictionary: dictionary });
	AsylumGGTSMessage("Interaction"+message, CurrentCharacter);
	DialogLeave();
}
/**
 * @param {string} pauseDuration
 */
function AsylumGGTSDialogPause(pauseDuration) {
	if (!CurrentCharacter) return;
	const duration = CommonParseInt(pauseDuration);
	if (duration === null) return;
	const dictionary = new DictionaryBuilder()
		.targetCharacter(CurrentCharacter)
		.addGGTSData({ type: "GGTSPause", duration })
		.build();
	ServerSend("ChatRoomChat", { Content: "AsylumGGTSHiddenMessage", Type: "Hidden", Dictionary: dictionary });
	AsylumGGTSMessage("InteractionPause5", CurrentCharacter); // Is hardcoded to say 5 minutes
	DialogLeave();
}

/**
 * Called from chat room, processes hidden GGTS messages
 * @param {Character} SenderCharacter - The character sending the message
 * @param {ServerChatRoomMessage} data - The full message recieved
 * @returns {void} - Nothing to be used
 */
function AsylumGGTSHiddenMessage(SenderCharacter, data) {
	const dictionary = data.Dictionary;
	if (!CommonIsArray(dictionary)) return;
	const targetDictionary = dictionary.find(IsTargetCharacterDictionaryEntry);
	if (!targetDictionary || targetDictionary.TargetCharacter !== Player.MemberNumber) return;
	dictionary.forEach((entry) => {
		if (!IsGGTSDictionaryEntry(entry)) return;
		switch (entry.Action.type) {
			case "GGTSNewTask":
				AsylumGGTSNewTask();
				break;
			case "GGTSSetSpeed":
				AsylumGGTSSpeed = entry.Action.speed;
				break;
			case "GGTSPause":
				AsylumGGTSTimer = Math.round(CommonTime() + entry.Action.duration);
				break;
		}
	});
}

/**
 * GGTS Draws the level, the number of strikes and a progress bar, level 6 shows the time in a gold frame
 * @param {Character} C - Character to draw the info for
 * @param {number} X - Position of the character the X axis
 * @param {number} Y - Position of the character the Y axis
 * @param {number} Zoom - Amount of zoom the character has (Height)
 * @returns {void} - Nothing
 */
function AsylumGGTSDrawCharacter(C, X, Y, Zoom) {
	if (ServerPlayerIsInChatRoom() && ChatSearchGetSpace() === "Asylum") {
		let Level = AsylumGGTSGetLevel(C);
		if ((Level > 0) && (C.Game != null) && (C.Game.GGTS != null)) {
			if (C.Game.GGTS.Strike >= 1) DrawImageZoomCanvas("Screens/Room/AsylumGGTS/Strike" + C.Game.GGTS.Strike.toString() + ".png", MainCanvas, 0, 0, 100, 50, X + 50 * Zoom, Y + 800 * Zoom, 100 * Zoom, 50 * Zoom);
			MainCanvas.font = CommonGetFont(Math.round(36 * Zoom));
			let Progress = Math.floor(C.Game.GGTS.Time / AsylumGGTSLevelTime[Level] * 100);
			if (C.Game.GGTS.Strike >= 3) Progress = 0;
			if ((Level >= 6) || (Progress >= 100)) DrawEmptyRect(X + 50 * Zoom, Y + 860 * Zoom, 100 * Zoom, 40 * Zoom, "Black");
			if (Level >= 6) DrawRect(X + 52 * Zoom, Y + 862 * Zoom, 96 * Zoom, 36 * Zoom, "#FFD700");
			else if (Progress >= 100) DrawRect(X + 50 * Zoom, Y + 860 * Zoom, 100 * Zoom, 40 * Zoom, "White");
			else DrawProgressBar(X + 50 * Zoom, Y + 860 * Zoom, 100 * Zoom, 40 * Zoom, Progress);
			if (Level >= 6) DrawText(Math.floor(C.Game.GGTS.Time / MS_PER_MIN).toString(), X + 100 * Zoom, Y + 881 * Zoom, "Black", "White");
			else if (Progress >= 50) DrawText(Level.toString(), X + 100 * Zoom, Y + 881 * Zoom, "Black", "White");
			else DrawText(Level.toString(), X + 101 * Zoom, Y + 882 * Zoom, "White", "Black");
			if (C.Game.GGTS.Rule != null)
				for (let R = 0; R < C.Game.GGTS.Rule.length; R++)
					DrawImageZoomCanvas("Screens/Room/AsylumGGTS/Rule" + C.Game.GGTS.Rule[R] + ".png", MainCanvas, 0, 0, 33, 33, X + 50 * Zoom + R * 33 * Zoom, Y + 902 * Zoom, 33 * Zoom, 33 * Zoom);
			if ((C.IsPlayer()) && (AsylumGGTSTimer > 0) && (AsylumGGTSTimer > CommonTime()) && (C.Game.GGTS.Strike < 3)) {
				let ForeColor = (AsylumGGTSTask == null) ? "Black" : "White";
				let BackColor = (ForeColor == "White") ? "Black" : "White";
				if ((BackColor == "Black") && (Math.round((AsylumGGTSTimer - CommonTime()) / 1000) <= 10)) BackColor = "Red";
				DrawEmptyRect(X + 350 * Zoom, Y + 860 * Zoom, 100 * Zoom, 40 * Zoom, ForeColor, 2);
				DrawRect(X + 352 * Zoom, Y + 862 * Zoom, 96 * Zoom, 36 * Zoom, BackColor);
				DrawText(Math.round((AsylumGGTSTimer - CommonTime()) / 1000).toString(), X + 399 * Zoom, Y + 882 * Zoom, ForeColor, "Silver");
			}
			MainCanvas.font = CommonGetFont(36);
		}
	}
}

/**
 * Resets the state of the GGTS game
 * @returns {void} - Nothing
 */
function AsylumGGTSReset() {
	AsylumGGTSPreviousPose = { ...Player.PoseMapping };
	// Do that here in the hope it'll happen quickly enough that it'll be
	// be ready when we try to show a message.
	CommonPromiseCatch(AsylumGGTSLoadMessages());
}
