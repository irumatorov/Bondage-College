"use strict";
var NPCSlaveAuctionBackground = "SlaveMarket";
/** @type {NPCCharacter | PlayerCharacter} */
var NPCSlaveAuctionVendor = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var NPCSlaveAuctionSlave = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var NPCSlaveAuctionMistress = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var NPCSlaveAuctionGirlLeft = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var NPCSlaveAuctionGirlRight = /** @type {never} */ (null);
var NPCSlaveAuctionAmount = 0;

/**
 * Loads the slave auction cutscene by creating the NPCs and setting the stage.
 * @type {ScreenLoadHandler}
 */
async function NPCSlaveAuctionLoad() {
	CutsceneStage = 0;
	NPCSlaveAuctionMistress = CharacterLoadNPC("NPC_Mistress");
	NPCSlaveAuctionGirlLeft = CharacterLoadNPC("NPC_GirlLeft");
	NPCSlaveAuctionGirlRight = CharacterLoadNPC("NPC_GirlRight");
}

/**
 * Runs and draws the slave auction cutscene
 * @returns {void} - Nothing
 */
function NPCSlaveAuctionRun() {
	DrawCharacter(NPCSlaveAuctionVendor, 400, 0, 1);
	if (CutsceneStage <= 6) DrawCharacter(NPCSlaveAuctionSlave, 800, 0, 1);
	DrawCharacter(NPCSlaveAuctionMistress, 1200, 0, 1);
	if ((CutsceneStage >= 2) && (CutsceneStage <= 6)) DrawCharacter(NPCSlaveAuctionGirlLeft, 0, 0, 1);
	if ((CutsceneStage >= 2) && (CutsceneStage <= 6)) DrawCharacter(NPCSlaveAuctionGirlRight, 1600, 0, 1);
	const Text = TextSubstitute(`NPCSlaveAuction${CutsceneStage}`, {
		AuctionAmount: CharacterMoneyFormat(NPCSlaveAuctionAmount),
		DoubleAmount: CharacterMoneyFormat(NPCSlaveAuctionAmount * 2),
	}).join("");
	DrawText(Text, 1000, 980, "White", "Black");
}

/**
 * Handles clicks during the slave auction cutscene. Clicking anywhere on the screen advances the cutscene. At the end of the cutscene, the player is sent back to the main hall and private NPCs are saved.
 * @returns {void} - Nothing
 */
function NPCSlaveAuctionClick() {
	CutsceneStage++;
	if (CutsceneStage > 8) {
		ServerPrivateCharacterSync();
		CommonSetScreen("Room", "MainHall");
	}
}
