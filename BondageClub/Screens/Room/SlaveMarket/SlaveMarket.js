"use strict";
var SlaveMarketBackground = "SlaveMarket";
/** @type {NPCCharacter} */
var SlaveMarketMistress = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var SlaveMarketSlave = /** @type {never} */ (null);
/** @type {null | NPCCharacter} */
var SlaveMarketSlaveToTrain = null;
var SlaveMarketTrainingBackgroundList = ["BDSMRoomBlue", "BDSMRoomPurple", "BDSMRoomRed"];
/** @type {NPCCharacter} */
var SlaveMarketBuyer = /** @type {never} */ (null);

/**
 * Checks if an auction can be started.
 * @returns {boolean} - Returns TRUE if the player has room in her private room and is dominant enough to participate in an auction
 */
function SlaveMarketCanStartAuction() { return ((ReputationGet("Dominant") >= -50) && ManagementCanTransferToRoom()); }
/**
 * Checks if an auction cannot be started due to being too submissive.
 * @returns {boolean} - Returns TRUE if the player is not dominant enough to participate in an auction
 */
function SlaveMarketCannotStartAuctionSubmissive() { return (ReputationGet("Dominant") < -50); }
/**
 * Checks if an auction cannot be started due to lack of space in the player's private room
 * @returns {boolean} - Returns TRUE if the player is dominant enough to participate in an auction, but does not have space in her private room
 */
function SlaveMarketCannotStartAuctionRoom() { return ((ReputationGet("Dominant") >= -50) && !ManagementCanTransferToRoom()); }
/**
 * Checks if the player can be auctioned.  Must not be owned, must be submissive, must not be restrained, must have space in room and must not have been auctioned in the last seven days
 * @returns {boolean} - Returns TRUE if the player can be auctioned
 */
function SlaveMarketCanBeAuctioned() { return (!Player.IsOwned() && !PrivateOwnerInRoom() && !Player.IsRestrained() && !Player.IsChaste() && (ReputationGet("Dominant") < 0) && !LogQuery("Auctioned", "SlaveMarket") && ManagementCanTransferToRoom()); }
/**
 * Checks if the character has a specific title
 * @param {TitleName} Title - The title to check for
 * @returns {boolean} - TRUE if the character has the title in the parameter
 */
function SlaveMarketSlaveTitleIs(Title) { return SlaveMarketSlave.Title === Title; }

/**
 * Loads the Slave Market room, generates the Mistress and slave
 * @type {ScreenLoadHandler}
 */
async function SlaveMarketLoad() {
	if (SlaveMarketMistress == null) {
		SlaveMarketMistress = CharacterLoadNPC("NPC_SlaveMarket_Mistress");
		SlaveMarketMistress.AllowItem = false;
		SlaveMarketBuyer = CharacterLoadNPC("NPC_SlaveMarket_Buyer");
	}
	if (SlaveMarketSlave == null) SlaveMarketNewSlave();
}

/**
 * Runs and draws the slave market, the screen can be used to search for a daily job.
 * @returns {void} - Nothing
 */
function SlaveMarketRun() {
	if (!DailyJobSubSearchIsActive()) DrawCharacter(Player, 250, 0, 1);
	if (!DailyJobSubSearchIsActive()) DrawCharacter(SlaveMarketMistress, 750, 0, 1);
	if (!DailyJobSubSearchIsActive()) DrawCharacter(SlaveMarketSlave, 1250, 0, 1);
	if (Player.CanWalk()) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
	DailyJobSubSearchRun();
}

/**
 * Handles clicks in the slave market.
 * @returns {void} - Nothing
 */
function SlaveMarketClick() {
	if (!DailyJobSubSearchIsActive() && MouseIn(250, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (!DailyJobSubSearchIsActive() && MouseIn(750, 0, 500, 1000)) CharacterSetCurrent(SlaveMarketMistress);
	if (!DailyJobSubSearchIsActive() && MouseIn(1250, 0, 500, 1000)) CharacterSetCurrent(SlaveMarketSlave);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "MainHall");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
	DailyJobSubSearchClick();
}

/**
 * Triggered when the auction starts, the mini game is launched
 * @returns {void} - Nothing
 */
function SlaveMarketAuctionStart() {
	InventoryWear(SlaveMarketSlave, "CollarChainShort", "ItemNeckRestraints");
	SlaveAuctionVendor = SlaveMarketMistress;
	SlaveAuctionSlave = SlaveMarketSlave;
	MiniGameStart("SlaveAuction", "", () => { SlaveMarketAuctionEnd(); });
}

/**
 * Triggered when the auction ends.
 * If the player was the last bidder, she buys the slave and gets in a dialog with her, otherwise she returns to the main area of the slave market
 * @returns {SafePromise<void>}
 */
async function SlaveMarketAuctionEnd() {
	await CommonSetScreen("Room", "SlaveMarket");
	if (SlaveAuctionBidCurrent == "Player") {
		CharacterChangeMoney(Player, SlaveAuctionBidAmount * -1);
		let NewChar = PrivateAddCharacter(SlaveMarketSlave,  "Submissive");
		if (SlaveMarketSlave.Title === "Succubus") NewChar.Title = "Succubus";
		CharacterSetCurrent(SlaveMarketSlave);
		SlaveMarketSlave.Stage = "10";
		SlaveMarketSlave.CurrentDialog = DialogFind(SlaveMarketSlave, "AuctionBuy");
		SlaveMarketMistress.Stage = "22";
	} else {
		CharacterSetCurrent(SlaveMarketMistress);
		SlaveMarketMistress.CurrentDialog = DialogFind(SlaveMarketMistress, "AuctionFail");
		SlaveMarketMistress.Stage = "23";
	}
}

/**
 * Generates a new slave for the slave market
 * @returns {void} - Nothing
 */
function SlaveMarketNewSlave() {
	SlaveMarketSlave = CharacterLoadNPC("NPC_SlaveMarket_Slave");
	SlaveMarketSlave.AllowItem = false;
	CharacterAppearanceFullRandom(SlaveMarketSlave);
	CharacterNaked(SlaveMarketSlave);
	if (Math.random() >= 0.85) {
		let Color = CommonGetRandomItemFromList(/** @type {const} */(["Default", "#222222", "#BBBBBB", "#882222"]));
		InventoryWear(SlaveMarketSlave, CommonGetRandomItemFromList(["CatEye", "CatEye2", "LargeSolid", "SuperstarBlurred", "UndershadowedSolid"]), "EyeShadow", Color);
		InventoryWear(SlaveMarketSlave, "SuccubusHorns", "HairAccessory1", Color);
		InventoryWear(SlaveMarketSlave, CommonGetRandomItemFromList(["SuccubusTailStrap", "SuccubusHeartTailStrap"]), "TailStraps", Color);
		InventoryWear(SlaveMarketSlave, CommonGetRandomItemFromList(["BatWings", "DevilWings", "SuccubusWings"]), "Wings", Color);
		SlaveMarketSlave.Title = "Succubus";
	} else SlaveMarketSlave.Title = undefined;
	InventoryWear(SlaveMarketSlave, "LeatherCollar", "ItemNeck");
	InventoryWear(SlaveMarketSlave, "CollarChainLong", "ItemNeckRestraints");
	if (CurrentCharacter != null) DialogLeave();
}

/**
 * Triggered when the player brings the slave to her room, the player is sent to her private room with the NPC.
 * @returns {void} - Nothing
 */
function SlaveMarketVisitRoom() {
	DialogLeave();
	SlaveMarketNewSlave();
	CommonSetScreen("Room", "Private");
}

/**
 * Triggered when the slave training start. Sets the NPC and dialog before sending the player to an empty room with the trainee.
 * @returns {SafePromise<void>}
 */
async function SlaveMarketTrainingStart() {
	let Intro = Math.floor(Math.random() * 6);
	SlaveMarketSlaveToTrain = CharacterLoadNPC("NPC_SlaveMarket_SlaveToTrain");
	SlaveMarketSlaveToTrain.Stage = (Intro * 100).toString();
	SlaveMarketSlaveToTrain.ExpectedTraining = Intro % 3;
	SlaveMarketSlaveToTrain.CurrentTraining = -1;
	SlaveMarketSlaveToTrain.TrainingIntensity = 0;
	SlaveMarketSlaveToTrain.TrainingCount = 0;
	SlaveMarketSlaveToTrain.TrainingCountLow = 0;
	SlaveMarketSlaveToTrain.TrainingCountPerfect = 0;
	SlaveMarketSlaveToTrain.TrainingCountHigh = 0;
	if (Intro >= 3) InventoryWear(SlaveMarketSlaveToTrain, "SlaveCollar", "ItemNeck");
	CharacterNaked(SlaveMarketSlaveToTrain);
	DialogLeave();
	EmptyBackground = CommonGetRandomItemFromList(SlaveMarketTrainingBackgroundList);
	EmptyCharacterOffset = 0;
	EmptyCharacter = [];
	EmptyCharacter.push(Player);
	EmptyCharacter.push(SlaveMarketSlaveToTrain);
	await CommonSetScreen("Room", "Empty");
	if (!SlaveMarketSlaveToTrain) return;
	CharacterBuildDialog(SlaveMarketSlaveToTrain, CommonCSVCache["Screens/Room/SlaveMarket/Dialog_NPC_SlaveMarket_SlaveToTrain.csv"], "Empty");
}

/**
 * Triggered when the auctioned player gets stripped and chained
 * @returns {void} - Nothing
 */
function SlaveMarketAuctionPlayerStrip() {
	CharacterRelease(Player);
	CharacterNaked(Player);
	InventoryRemove(Player, "ItemNeck", false);
	InventoryWear(Player, "LeatherCollar", "ItemNeck", "Default", 10);
	InventoryWear(Player, "CollarChainLong", "ItemNeckRestraints", "Default", 10);
	CharacterRefresh(Player);
}

/**
 * Triggered when the player auction starts
 * @returns {void} - Nothing
 */
function SlaveMarketAuctionPlayerStart() {
	DialogLeave();
	MiniGameStart("PlayerAuction", "", () => { SlaveMarketPlayerAuctionEnd(); });
}

/**
 * Triggered when the player auction ends, we create the buyer and activate her
 * @returns {SafePromise<void>}
 */
async function SlaveMarketPlayerAuctionEnd() {
	CharacterRelease(Player);
	LogAdd("Auctioned", "SlaveMarket", CurrentTime + MS_PER_WEEK);
	CharacterChangeMoney(Player, (PlayerAuctionBidAmount / 2) + 5);
	await CommonSetScreen("Room", "SlaveMarket");
	SlaveMarketBuyer.AllowItem = false;
	SlaveMarketBuyer.Appearance = PlayerAuctionCustomer[PlayerAuctionBidCurrent].Appearance.slice(0);
	SlaveMarketBuyer.Archetype = PlayerAuctionCustomer[PlayerAuctionBidCurrent].Archetype;
	CharacterRefresh(SlaveMarketBuyer);
	if (SlaveMarketBuyer.Archetype === "Succubus") SlaveMarketBuyer.CurrentDialog = DialogFind(SlaveMarketBuyer, "IntroSuccubus");
	else SlaveMarketBuyer.CurrentDialog = DialogFind(SlaveMarketBuyer, "Intro" + Math.floor(Math.random() * 3).toString());
	CharacterSetCurrent(SlaveMarketBuyer);
}

/**
 * Triggered when the player auction has ended and both characters are transferred to the player room
 * @returns {void} - Nothing
 */
function SlaveMarketPlayerAuctionTransfer() {
	DialogLeave();
	CommonSetScreen("Room", "Private");
	const C = PrivateAddCharacter(SlaveMarketBuyer, SlaveMarketBuyer.Archetype);
	NPCTraitSet(C, "Dominant", 50 + Math.floor(Math.random() * 51));
	C.Love = 30;
	NPCEventAdd(C, "EndSubTrial", CurrentTime + NPCLongEventDelay(C));
	ServerPrivateCharacterSync();
}
