"use strict";
var CollegeDetentionBackground = "CollegeDetention";
/** @type {NPCCharacter} */
var CollegeDetentionYuki = /** @type {never} */ (null);
var CollegeDetentionYukiLove = 0;
var CollegeDetentionYukiWillReleaseAt = 0;

// Returns TRUE if the dialog option should be shown
/**
 * Checks, if Yuki can be invited to the private room
 * @returns {boolean} - Returns true, if Yuki can be invited, false otherwise
 */
function CollegeDetentionCanInviteToPrivateRoom() { return PrivateHasEmptySlot(); }

/**
 * Adds the sleeping pill to the player's invertory
 * @returns {void} - Nothing
 */
function CollegeDetentionGetSleepingPills() { InventoryAdd(Player, "RegularSleepingPill", "ItemMouth"); }

/**
 * Adds the teacher key to the players 'inventory'
 * @returns {void} - Nothing
 */
function CollegeDetentionGetTeacherKey() { LogAdd("TeacherKey", "College"); }

/**
 * Checks, if Yuki will release the player
 * @returns {boolean} - Returns true if the detention time is over, flase otherwise
 */
function CollegeDetentionYukiWillRelease() { return (CollegeDetentionYukiWillReleaseAt < CurrentTime); }

/**
 * Checks, if Yuki dominated the player in the library and player is not owned
 * @returns {boolean} - Returns true if Yuki is Dominant and player is not owned
 */
function CollegeDetentionIsYukiDominant() { return (DialogLogQuery("Dominant", "NPC-Yuki") && !(Player.Owner)); }

/**
 * Checks, if Yuki was blackmailed in the library
 * @returns {boolean} - Returns true if Yuki is Submissive
 */
function CollegeDetentionIsYukiSubmissive() { return (DialogLogQuery("Submissive", "NPC-Yuki")); }

/**
 * Creates a fully dressed Yuki
 * @param {Character} C - The character object to dress up
 * @returns {void} - Nothing
 */
function CollegeDetentionYukiClothes(C) {
	CharacterNaked(C);
	InventoryWear(C, "TeacherOutfit1", "Cloth", "Default");
	InventoryWear(C, "Pussy3", "Pussy", "#333333");
	InventoryWear(C, "Eyes1", "Eyes", "#a57b78");
	InventoryWear(C, "Eyes1", "Eyes2", "#a57b78");
	InventoryWear(C, "Glasses1", "Glasses", "#333333");
	InventoryWear(C, "Regular", "Mouth", "Default");
	InventoryWear(C, "H0920", "Height", "Default");
	InventoryWear(C, "Small", "BodyUpper", "Asian");
	InventoryWear(C, "Small", "BodyLower", "Asian");
	InventoryWear(C, "Small", "HandsLeft", "Default");
	InventoryWear(C, "Small", "HandsRight", "Default");
	InventoryWear(C, "Default", "Head", "Default");
	InventoryWear(C, "HairBack6", "HairBack", "#603022");
	InventoryWear(C, "HairFront4", "HairFront", "#603022");
	InventoryWear(C, "Ribbons2", "HairAccessory1", "#111111");
	InventoryWear(C, "Bra1", "Bra", "#2222AA");
	InventoryWear(C, "Panties11", "Panties", "#2222AA");
	InventoryWear(C, "Socks5", "Socks", "#444458");
	InventoryWear(C, "Shoes2", "Shoes", "#111111");
}

/**
 * Loads the room and generates Yuki
 * @type {ScreenLoadHandler}
 */
async function CollegeDetentionLoad() {

	// Generates a full Yuki model based on the Bondage College template
	if (!CollegeDetentionYuki && !PrivateCharacterIsInRoom("Yuki")) {
		// Generates the model
		CollegeDetentionYuki = CharacterLoadNPC("NPC_CollegeDetention_Yuki");
		CollegeDetentionYuki.AllowItem = false;
		CollegeDetentionYuki.Name = "Yuki";
		CollegeDetentionYukiClothes(CollegeDetentionYuki);
		CharacterRefresh(CollegeDetentionYuki);

	}

}

/**
 * Runs the room (shows the player and Yuki)
 * @returns {void} - Nothing
 */
function CollegeDetentionRun() {
	DrawCharacter(Player, 500, 0, 1);
	if (CollegeDetentionYuki) DrawCharacter(CollegeDetentionYuki, 1000, 0, 1);
	DrawButton(1885, 25, 90, 90, "", Player.CanWalk() ? "White" : "Pink", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
}

/**
 * Handles the click events. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function CollegeDetentionClick() {
	if (MouseIn(1000, 0, 500, 1000) && CollegeDetentionYuki) CharacterSetCurrent(CollegeDetentionYuki);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "CollegeEntrance");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
}

/**
 * When Yuki's love towards the player changes, it can also trigger an event.
 * When a good or bad move is done, her expression will change quickly.
 * @param {number} LoveChange - The amount the love of Yuki towards the player is altered
 * @returns {void} - Nothing
 */
function CollegeDetentionYukiLoveChange(LoveChange) {
	CollegeDetentionYukiLove += LoveChange;
	if (LoveChange < 0) {
		CharacterSetFacialExpression(CollegeDetentionYuki, "Eyes", "Dazed", 2);
		if (CollegeDetentionYukiLove <= -5) {
			CollegeDetentionYuki.Stage = "1000";
			CollegeDetentionYuki.CurrentDialog = DialogFind(CollegeDetentionYuki, "YukiHadEnough");
		}
	}
	if (LoveChange > 0) {
		CharacterSetFacialExpression(CollegeDetentionYuki, "Blush", "Low", 2);
		if (CollegeDetentionYukiLove > 10) {
			CollegeDetentionYuki.Stage = "2000";
			CollegeDetentionYukiLove = 0;
			CollegeDetentionYukiWillReleaseAt = 0;
			CollegeDetentionYuki.CurrentDialog = DialogFind(CollegeDetentionYuki, "YukiPropose");
		}
	}
}

/**
 * Dress the player and Yuki back
 * @returns {void} - Nothing
 */
function CollegeDetentionDressBack() {
	CharacterRelease(Player);
	CharacterRelease(CollegeDetentionYuki);
	CollegeEntranceWearStudentClothes(Player);
	CollegeDetentionYukiClothes(CollegeDetentionYuki);
}

/**
 * Strips both the player and Yuki
 * @returns {void} - Nothing
 */
function CollegeDetentionBothNaked() {
	CharacterNaked(Player);
	CharacterNaked(CollegeDetentionYuki);
}

/**
 * When the player pleases Yuki, it's a race against the clock to make her orgasm
 * @param {number} Factor - The factor that alters Yuki's love towards the player
 * @returns {void} - Nothing
 */
function CollegeDetentionPleaseYuki(Factor) {
	CollegeDetentionYukiWillReleaseAt++;
	CollegeDetentionYukiLove += Factor;
	if (CollegeDetentionYukiLove >= 6) {
		CollegeDetentionYuki.Stage = "2100";
		CollegeDetentionYuki.CurrentDialog = DialogFind(CollegeDetentionYuki, "Orgasm");
		return;
	}
	if (CollegeDetentionYukiWillReleaseAt >= 6) {
		CollegeDetentionYuki.Stage = "2200";
		CollegeDetentionYuki.CurrentDialog = DialogFind(CollegeDetentionYuki, "NoOrgasm");
		return;
	}
}

/**
 * Yuki restraints the player
 * @param {"Arms" | "Legs" | "Mouth"} Type - The type of restraint to use
 * @returns {void} - Nothing
 */
function CollegeDetentionRestrainPlayer(Type) {
	if (Type == "Arms") InventoryWearRandom(Player, "ItemArms", 4);
	if (Type == "Legs") { InventoryWearRandom(Player, "ItemFeet", 4); InventoryWearRandom(Player, "ItemLegs", 4); }
	if (Type == "Mouth") { InventoryWearRandom(Player, "ItemMouth", 4); CollegeDetentionYukiWillReleaseAt = CurrentTime + 120000; }
}

/**
 * The player invites Yuki to her room. Add her ribbon and the sleeping pill to the player's inventory
 * @param {string} Role - How Yuki should join private room (Default: "None")
 * @returns {void} - Nothing
 */
function CollegeDetentionInviteToPrivateRoom(Role="None") {
	CollegeDetentionDressBack();

	/** @type {ItemBundle[]} */
	var ItemsToEarn = [];
	ItemsToEarn.push({Name: "Ribbons2", Group: "HairAccessory1"});
	ItemsToEarn.push({Name: "Ribbons2", Group: "HairAccessory3"});
	ItemsToEarn.push({Name: "RegularSleepingPill", Group: "ItemMouth"});
	InventoryAddMany(Player, ItemsToEarn);

	const C = PrivateAddCharacter(CollegeDetentionYuki, null, true);
	NPCTraitSet(C, "Dominant", 20);
	NPCTraitSet(C, "Horny", 80);
	NPCTraitSet(C, "Rude", 60);
	NPCTraitSet(C, "Serious", 40);
	C.Love = 20;
	if (Role == "Submissive") {
		NPCEventAdd(C, "NPCCollaring", CurrentTime);
		InventoryWear(C, "SlaveCollar", "ItemNeck");
		C.Owner = Player.Name;
		C.Love = 100;
	}
	if (Role == "Dominant") {
		NPCEventAdd(C, "PlayerCollaring", CurrentTime);
		NPCEventAdd(C, "LastGift", CurrentTime);
		InventoryWear(Player, "SlaveCollar", "ItemNeck");
		Player.Owner = "NPC-Yuki";
		C.Love = 100;
	}
	NPCTraitDialog(C);
	ServerPrivateCharacterSync();
	DialogLeave();
	CharacterDelete(CollegeDetentionYuki);
	CollegeDetentionYuki = /** @type {never} */ (null);

	CommonSetScreen("Room", "Private");
}
