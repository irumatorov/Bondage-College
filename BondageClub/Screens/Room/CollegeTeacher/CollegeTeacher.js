"use strict";
var CollegeTeacherBackground = "CollegeTeacherLounge";
/** @type {NPCCharacter} */
var CollegeTeacherMildred = /** @type {never} */ (null);
var CollegeTeacherMildredLove = 0;

// Returns TRUE if the dialog option should be shown
/**
 * Checks, if the teacher can be invited to the player's room
 * @returns {boolean} - Returns true, if the player can invite the teacher to her room, false otherwise
 */
function CollegeTeacherCanInviteToPrivateRoom() { return PrivateHasEmptySlot(); }

/**
 * Checks, if Mildred's love level is higher than a given value
 * @param {number} LoveLevel - The level of love to check against
 * @returns {boolean} - Returns true, if Mildred's love is equal or higher than the given level, false otherwise
 */
function CollegeTeacherMildredLoveIs(LoveLevel) { return CollegeTeacherMildredLove >= LoveLevel; }

/**
 * Checks, if Mildred won the Literature Class quiz and player is not owned
 * @returns {boolean} - Returns true if Mildred is Dominant and player is not owned
 */
function CollegeTeacherIsMildredDominant() { return (DialogLogQuery("Dominant", "NPC-Mildred") && !(Player.Owner)); }

/**
 * Checks, if Mildred lost the Literature Class quiz
 * @returns {boolean} - Returns true if Mildred is Submissive
 */
function CollegeTeacherIsMildredSubmissive() { return (DialogLogQuery("Submissive", "NPC-Mildred")); }


/**
 * Fully dress-up Mildred
 * @param {Character} C - The character object to dress up
 * @returns {void} - Nothing
 */
function CollegeTeacherMildredClothes(C) {
	CharacterNaked(C);
	InventoryWear(C, "TeacherOutfit1", "Cloth", "Default");
	InventoryWear(C, "Pussy3", "Pussy", "#333333");
	InventoryWear(C, "Eyes1", "Eyes", "#a57b78");
	InventoryWear(C, "Eyes1", "Eyes2", "#a57b78");
	InventoryWear(C, "Glasses4", "Glasses", "#333333");
	InventoryWear(C, "Regular", "Mouth", "Default");
	InventoryWear(C, "H0940", "Height", "Default");
	InventoryWear(C, "Normal", "BodyUpper", "White");
	InventoryWear(C, "Normal", "BodyLower", "White");
	InventoryWear(C, "Normal", "HandsLeft", "Default");
	InventoryWear(C, "Normal", "HandsRight", "Default");
	InventoryWear(C, "Default", "Head", "Default");
	InventoryWear(C, "HairBack21", "HairBack", "#626060");
	InventoryWear(C, "HairFront3", "HairFront", "#626060");
	InventoryWear(C, "Bra1", "Bra", "#2222AA");
	InventoryWear(C, "Panties11", "Panties", "#2222AA");
	InventoryWear(C, "Socks5", "Socks", "#111111");
	InventoryWear(C, "Heels1", "Shoes", "#222222");
}

// Generates Mildred
/**
 * Loads the teacher's lounge and generates Mildred
 * @type {ScreenLoadHandler}
 */
async function CollegeTeacherLoad() {

	// Generates a full Mildred model based on the Bondage College template
	if (!CollegeTeacherMildred && !PrivateCharacterIsInRoom("Mildred")) {
		// Generates the model
		CollegeTeacherMildred = CharacterLoadNPC("NPC_CollegeTeacher_Mildred");
		CollegeTeacherMildred.AllowItem = false;
		CollegeTeacherMildred.Name = "Mildred";
		CollegeTeacherMildredClothes(CollegeTeacherMildred);
		CharacterRefresh(CollegeTeacherMildred);

	}

}

/**
 * Runs the room (shows the player and Mildred)
 * @returns {void} - Nothing
 */
function CollegeTeacherRun() {
	DrawCharacter(Player, 0, 0, 1);
	if (CollegeTeacherMildred) DrawCharacter(CollegeTeacherMildred, 500, 0, 1);
	DrawButton(1885, 25, 90, 90, "", Player.CanWalk() ? "White" : "Pink", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
}

/**
 * Handles the click events. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function CollegeTeacherClick() {
	if (MouseIn(500, 0, 500, 1000) && CollegeTeacherMildred) CharacterSetCurrent(CollegeTeacherMildred);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "CollegeEntrance");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
}

/**
 * When Mildred love towards the player changes, it can also trigger an event.
 * When a good or bad move is done, her expression will change quickly.
 * @param {number} LoveChange - The amount, the teacher's love changes
 * @param {"Pillory" | "Lock" | "Crop" | "Hit" | "Gag"} [Event] - The event to trigger
 * @returns {void} - Nothing
 */
function CollegeTeacherMildredLoveChange(LoveChange, Event) {
	CollegeTeacherMildredLove += LoveChange;
	if (LoveChange < 0) CharacterSetFacialExpression(CollegeTeacherMildred, "Eyes", "Dazed", 2);
	if (LoveChange > 0) CharacterSetFacialExpression(CollegeTeacherMildred, "Blush", "Low", 2);
	if (Event == "Pillory") InventoryWear(Player, "Pillory", "ItemArms");
	if (Event == "Lock") InventoryLock(Player, "ItemArms", "IntricatePadlock", CollegeTeacherMildred);
	if (Event == "Crop") {
		InventoryWear(CollegeTeacherMildred, "Crop", "ItemHandheld");
	}
	if (Event == "Hit") {
		CharacterSetFacialExpression(Player, "Eyes", "Closed", 3);
		CharacterSetFacialExpression(Player, "Blush", "Medium", 3);
	}
	if (Event == "Gag") InventoryWear(Player, "DogMuzzleExposed", "ItemMouth");
}

/**
 * Dress back the player and Mildred
 * @returns {void} - Nothing
 */
function CollegeTeacherDressBack() {
	CharacterRelease(Player);
	CharacterRelease(CollegeTeacherMildred);
	InventoryRemove(CollegeTeacherMildred, "ItemHandheld");
	CollegeEntranceWearStudentClothes(Player);
	CollegeTeacherMildredClothes(CollegeTeacherMildred);
}

/**
 * Sets the current background for the scene
 * @param {string} New - The name of the new background
 * @returns {void} - Nothing
 */
function CollegeTeacherNewBackground(New) {
	CollegeTeacherBackground = New;
}

//
/**
 * When the plater invites Mildred to her room, she gets the pillory
 * @param {string} Role - How Mildred should join private room (Default: "None")
 * @returns {void} - Nothing
 */
function CollegeTeacherInviteToPrivateRoom(Role="None") {
	CollegeTeacherDressBack();
	InventoryAdd(Player, "Pillory", "ItemArms");
	const C = PrivateAddCharacter(CollegeTeacherMildred, null, true);
	NPCTraitSet(C, "Dominant", 60);
	NPCTraitSet(C, "Violent", 50);
	NPCTraitSet(C, "Frigid", 40);
	NPCTraitSet(C, "Polite", 20);
	NPCTraitSet(C, "Wise", 30);
	NPCTraitSet(C, "Serious", 80);
	C.Love = 20;
	if (Role == "Submissive") {
		NPCTraitSet(C, "Dominant", 40);
		NPCEventAdd(C, "NPCCollaring", CurrentTime);
		InventoryWear(C, "SlaveCollar", "ItemNeck");
		C.Owner = Player.Name;
		C.Love = 100;
	}
	if (Role == "Dominant") {
		NPCTraitSet(C, "Dominant", 80);
		NPCEventAdd(C, "PlayerCollaring", CurrentTime);
		NPCEventAdd(C, "LastGift", CurrentTime);
		InventoryWear(Player, "SlaveCollar", "ItemNeck");
		Player.Owner = "NPC-Mildred";
		C.Love = 100;
	}
	NPCTraitDialog(C);
	ServerPrivateCharacterSync();
	DialogLeave();
	CharacterDelete(CollegeTeacherMildred);
	CollegeTeacherMildred = /** @type {never} */ (null);

	CommonSetScreen("Room", "Private");
}
