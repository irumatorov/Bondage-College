"use strict";
var SarahRoomAvailable = true;
var SarahBackground = "";
/** @type {"" | "Owned" | "Curfew" | "SchoolMate" | "Lover" | "ExLover" | "WillBePunished" | "CameWithPlayer" | "InPrivateRoom"} */
var SarahStatus = "";
/** @type {"" | "SchoolMate" | "Lover" | "ExLover" | "Owned" | "Curfew" | "Owner" | "ExOwner" | "InPrivateRoom"} */
var AmandaStatus = "";
var SophieStatus = "";
/** @type {NPCCharacter} */
var Sarah = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var Amanda = /** @type {never} */ (null);
/** @type {NPCCharacter} */
var Sophie = /** @type {never} */ (null);
var SarahInside = true;
var AmandaInside = false;
var SophieInside = false;
var SarahUnlockQuest = false;
/** @type {Character[]} */
var SarahCharacter = [];
var SophieUpsetCount = 0;
var SophieFightDone = false;
var SophiePunishmentStage = 0;
var SophieOrgasmGameCount = 0;
var SophieOrgasmGamePleasure = 0;

/** @param {string} QueryStatus */
function SarahStatusIs(QueryStatus) { return (QueryStatus == SarahStatus); }
/** @param {string} QueryStatus */
function SarahAmandaStatusIs(QueryStatus) { return (QueryStatus == AmandaStatus); }
function SarahCanKissLover() { return (Player.CanTalk() && Sarah.CanTalk() && Player.IsLoverOfCharacter(Sarah)); }
function SarahCanKissNotLover() { return (Player.CanTalk() && Sarah.CanTalk() && !Player.IsLoverOfCharacter(Sarah)); }
function SarahCanSpankOwner() { return Player.CanInteract() && Sarah.IsOwnedByPlayer(); }
function SarahCanSpankNotOwner() { return Player.CanInteract() && !Sarah.IsOwnedByPlayer(); }
function SarahCanReleaseToClub() { return (!SophieInside && !DialogIsRestrained("CurrentCharacter")); }
function SarahCanInviteToRoomFriend() { return (Player.CanWalk() && Sarah.CanWalk() && !SophieInside && !Sarah.IsOwnedByPlayer() && PrivateHasEmptySlot()); }
function SarahCanInviteToRoomSlave() { return (Player.CanWalk() && Sarah.CanWalk() && !SophieInside && Sarah.IsOwnedByPlayer() && PrivateHasEmptySlot()); }
function SarahCanInviteAmandaToRoom() { return (Player.CanWalk() && Amanda.CanWalk() && !SophieInside && (!SarahInside || Amanda.IsOwnedByPlayer()) && PrivateHasEmptySlot()); }
function SarahCanInviteAmandaToRoomRefuse() { return (Player.CanWalk() && Amanda.CanWalk() && !SophieInside && SarahInside && !Amanda.IsOwnedByPlayer() && PrivateHasEmptySlot()); }
function SarahCanInviteSophieToRoom() { return (Player.CanWalk() && Sophie.CanWalk() && PrivateHasEmptySlot()); }
function SarahCanInviteSophieToRoomAccept() { return (Player.CanWalk() && Sophie.CanWalk() && PrivateHasEmptySlot() && (SophieUpsetCount >= 0) && (SophieUpsetCount <= 2)); }
function SarahCanInviteSophieToRoomRefuse() { return (Player.CanWalk() && Sophie.CanWalk() && PrivateHasEmptySlot() && ((SophieUpsetCount < 0) || (SophieUpsetCount > 2))); }
function SarahCanKickAmandaOut() { return (Amanda.CanWalk() && !Player.IsOwnedByCharacter(Amanda) && (!SarahInside || Amanda.IsOwnedByPlayer())); }
function SarahCanKickAmandaOutRefuse() { return (Amanda.CanWalk() && !Player.IsOwnedByCharacter(Amanda) && SarahInside && !Amanda.IsOwnedByPlayer()); }
function SarahShackled() { return (SarahInside && (Sarah != null) && InventoryIsWorn(Sarah, "ItemArms", "FourLimbsShackles")); }
function SarahAmandaHasStrapon() { return (Player.CanInteract() && AmandaInside && (Amanda != null) && InventoryIsWorn(Amanda, "ItemPelvis", "StraponPanties")); }
function SarahAmandaHasNoStrapon() { return (Player.CanInteract() && AmandaInside && (Amanda != null) && !Amanda.IsVulvaChaste()); }
function SarahKnowAmandaInRoom() { return (SarahInside && AmandaInside && (Sarah != null) && (Amanda != null) && !Sarah.CanInteract() && (!Sarah.IsBlind() || Amanda.CanTalk())); }
function SarahAmandaCanKiss() { return (AmandaInside && (Amanda != null) && Player.CanTalk() && Amanda.CanTalk() && Player.IsLoverOfCharacter(Amanda)); }
function SarahIsClubSlave() { return InventoryIsWorn(Player, "ItemNeck", "ClubSlaveCollar"); }
function SarahCanKissSophie() { return (Player.CanTalk() && Sophie.CanTalk()); }
function SarahCanFightSophie() { return (!SophieFightDone && Player.CanInteract()); }
/** @param {number} Stage  */
function SarahSophiePunishmentStageIs(Stage) { return (SophiePunishmentStage === Stage); }
function SarahSophieLikesPlayer() { return ((SophieUpsetCount >= 0) && (SophieUpsetCount <= 2)); }
function SarahCanStrip() { return (!Sarah.IsRestrained() && !Sarah.IsNaked()); }

// Returns TRUE to know if the girls are inside the room
function SarahIsInside() { return (SarahInside && (Sarah != null)); }
function SarahAmandaIsInside() { return (AmandaInside && (Amanda != null)); }
function SarahAndAmandaAreInside() { return (SarahIsInside() && SarahAmandaIsInside()); }
function SarahOrAmandaAreInside() { return (SarahIsInside() || SarahAmandaIsInside()); }
function SarahIsPlayerSlave() { return Sarah != null && Sarah.IsOwnedByPlayer(); }
function SarahAmandaIsPlayerSlave() { return ((Amanda != null) && Amanda.IsOwnedByPlayer()); }
function SarahAmandaAndSarahArePlayerSlave() { return (SarahAmandaIsPlayerSlave() && SarahIsPlayerSlave()); }

// Returns the correct label for Sarah's room
function SarahRoomLabel() {
	if (!SarahInside) return "ExploreClub";
	if ((SarahStatus != "") && (!SarahIntroDone) && (LogQuery("SarahWillBePunished", "NPC-SarahIntro") || LogQuery("SarahWillBePunished", "NPC-SarahIntro"))) return "SearchSarah";
	if ((SarahStatus != "") && (!SarahIntroDone) && !LogQuery("SarahWillBePunished", "NPC-SarahIntro") && !LogQuery("SarahWillBePunished", "NPC-SarahIntro")) return "ExploreClub";
	if (SarahIntroDone) return "SarahBedroom";
	return "ExploreClub";
}

// Sets Sarah and Amanda status
function SarahSetStatus() {

	// Sarah status depends on Bondage College imported data
	if (LogQuery("BondageCollege", "Import")) SarahStatus = "SchoolMate";
	if (LogQuery("SarahLover", "NPC-Sarah") && (Player.Lover == "NPC-Sarah")) SarahStatus = "Lover";
	if (LogQuery("SarahLover", "NPC-Sarah") && (Player.Lover != "NPC-Sarah")) SarahStatus = "ExLover";
	if (LogQuery("SarahCollared", "NPC-Sarah")) SarahStatus = "Owned";
	if (LogQuery("SarahCollaredWithCurfew", "NPC-Sarah")) SarahStatus = "Curfew";
	if (LogQuery("SarahWillBePunished", "NPC-SarahIntro")) SarahStatus = "WillBePunished";
	if (LogQuery("SarahCameWithPlayer", "NPC-SarahIntro")) SarahStatus = "CameWithPlayer";

	// Amanda status depends on Bondage College imported data
	if (LogQuery("BondageCollege", "Import")) AmandaStatus = "SchoolMate";
	if (LogQuery("AmandaLover", "NPC-Amanda") && (Player.Lover == "NPC-Amanda")) AmandaStatus = "Lover";
	if (LogQuery("AmandaLover", "NPC-Amanda") && (Player.Lover != "NPC-Amanda")) AmandaStatus = "ExLover";
	if (LogQuery("AmandaCollared", "NPC-Amanda")) AmandaStatus = "Owned";
	if (LogQuery("AmandaCollaredWithCurfew", "NPC-Amanda")) AmandaStatus = "Curfew";
	if (LogQuery("AmandaMistress", "NPC-Amanda") && (Player.IsOwned() === "npc" && Player.OwnerName() === "Amanda")) AmandaStatus = "Owner";
	if (LogQuery("AmandaMistress", "NPC-Amanda") && (Player.IsOwned() === "npc" && Player.OwnerName() !== "Amanda")) AmandaStatus = "ExOwner";

	// They are not accessible if they already are in the private room
	for (let P = 1; P < PrivateCharacter.length; P++) {
		if (PrivateCharacter[P].Name.trim() == "Sarah") { SarahStatus = "InPrivateRoom"; SarahInside = false; }
		if (PrivateCharacter[P].Name.trim() == "Amanda") AmandaStatus = "InPrivateRoom";
		if (PrivateCharacter[P].Name.trim() == "Sophie") SophieStatus = "InPrivateRoom";
	}
}

/**
 * Loads the Sarah room
 * @type {ScreenLoadHandler}
 */
async function SarahLoad() {

	// Add the player if we need too
	if (SarahCharacter.length == 0)
		SarahCharacter.push(Player);

	// If Sarah is inside the room
	if (SarahInside && (SarahStatus != "InPrivateRoom")) {

		// If we must show the intro scene
		if (!SarahIntroDone) {
			CommonSetScreen("Cutscene", "SarahIntro");
			SarahIntroDone = true;
		} else if (Sarah == null) {

			// Creates Sarah and equips her like in the Bondage Club original story
			Sarah = CharacterLoadNPC("NPC_Sarah");
			Sarah.Name = "Sarah";
			Sarah.AllowItem = false;
			CharacterNaked(Sarah);
			InventoryWear(Sarah, "Nipples1", "Nipples", "Default");
			InventoryWear(Sarah, "Pussy1", "Pussy", "#edd6b0");
			InventoryWear(Sarah, "Eyes1", "Eyes", "#b98364");
			InventoryWear(Sarah, "Eyes1", "Eyes2", "#b98364");
			InventoryWear(Sarah, "Regular", "Mouth", "Default");
			InventoryWear(Sarah, "H0930", "Height", "Default");
			InventoryWear(Sarah, "Small", "BodyUpper", "White");
			InventoryWear(Sarah, "Small", "BodyLower", "White");
			InventoryWear(Sarah, "Small", "HandsLeft", "Default");
			InventoryWear(Sarah, "Small", "HandsRight", "Default");
			InventoryWear(Sarah, "Default", "Head", "Default");
			InventoryWear(Sarah, "HairBack19", "HairBack", "#edd6b0");
			InventoryWear(Sarah, "HairFront11", "HairFront", "#edd6b0");
			InventoryWear(Sarah, "Bra2", "Bra", "#a02424");
			InventoryWear(Sarah, "Panties7", "Panties", "#a02424");
			InventoryWear(Sarah, "FourLimbsShackles", "ItemArms");
			InventoryWear(Sarah, "StuddedBlindfold", "ItemHead");
			InventoryAdd(Sarah, "StuddedBlindfold", "ItemHead");
			if ((SarahStatus == "Owned") || (SarahStatus == "Curfew")) {
				InventoryWear(Sarah, "SlaveCollar", "ItemNeck");
				Sarah.Owner = Player.Name;
			}
			PoseSetActive(Sarah, "Kneel", true);
			AmandaIntroTime = CurrentTime + 400000;
			SarahCharacter.push(Sarah);

		}
	}

	// Loads Amanda if we need
	if (AmandaInside && (Amanda == null) && (AmandaStatus != "InPrivateRoom")) {

		// Creates Sarah and equips her like in the Bondage Club original story
		Amanda = CharacterLoadNPC("NPC_Amanda");
		Amanda.Name = "Amanda";
		Amanda.AllowItem = true;
		CharacterNaked(Amanda);
		InventoryWear(Amanda, "Nipples3", "Nipples", "Default");
		InventoryWear(Amanda, "Pussy3", "Pussy", "#623123");
		InventoryWear(Amanda, "Eyes7", "Eyes", "#3f289f");
		InventoryWear(Amanda, "Eyes7", "Eyes2", "#3f289f");
		InventoryWear(Amanda, "Regular", "Mouth", "Default");
		InventoryWear(Amanda, "H0950", "Height", "Default");
		InventoryWear(Amanda, "Normal", "BodyUpper", "White");
		InventoryWear(Amanda, "Normal", "BodyLower", "White");
		InventoryWear(Amanda, "Normal", "HandsLeft", "Default");
		InventoryWear(Amanda, "Normal", "HandsRight", "Default");
		InventoryWear(Amanda, "Default", "Head", "Default");
		InventoryWear(Amanda, "HairBack15", "HairBack", "#623123");
		InventoryWear(Amanda, "HairFront4", "HairFront", "#623123");
		InventoryAdd(Amanda, "StraponPanties", "ItemPelvis");
		InventoryWear(Amanda, "StraponPanties", "ItemPelvis");
		InventoryWear(Amanda, "HempRope", "ItemArms");
		InventoryWear(Amanda, "DuctTape", "ItemMouth");
		if ((AmandaStatus == "Owned") || (AmandaStatus == "Curfew")) {
			InventoryWear(Amanda, "SlaveCollar", "ItemNeck");
			Amanda.Owner = Player.Name;
		}
		SophieIntroTime = CurrentTime + 400000;
		SarahCharacter.splice(1, 0, Amanda);

	}

	// Loads Mistress Sophie if we need
	if (SophieInside && (Sophie == null) && (SophieStatus != "InPrivateRoom")) {

		// Creates Sophie and equips her like in the Bondage Club original story
		Sophie = CharacterLoadNPC("NPC_Sophie");
		Sophie.Name = "Mistress Sophie";
		Sophie.AllowItem = false;
		CharacterNaked(Sophie);
		InventoryWear(Sophie, "Nipples2", "Nipples", "Default");
		InventoryWear(Sophie, "Stockings4", "Socks", "#222222");
		InventoryWear(Sophie, "Corset3", "Bra", "#222222");
		InventoryWear(Sophie, "Panties13", "Panties", "#222222");
		InventoryWear(Sophie, "Pussy1", "Pussy", "#555555");
		InventoryWear(Sophie, "Eyes1", "Eyes", "#b08061");
		InventoryWear(Sophie, "Eyes1", "Eyes2", "#b08061");
		InventoryWear(Sophie, "Glasses5", "Glasses", "#222222");
		InventoryWear(Sophie, "Regular", "Mouth", "Default");
		InventoryWear(Sophie, "H0970", "Height", "Default");
		InventoryWear(Sophie, "Large", "BodyUpper", "White");
		InventoryWear(Sophie, "Large", "BodyLower", "White");
		InventoryWear(Sophie, "Large", "HandsLeft", "Default");
		InventoryWear(Sophie, "Large", "HandsRight", "Default");
		InventoryWear(Sophie, "Default", "Head", "Default");
		InventoryWear(Sophie, "HairBack16", "HairBack", "#CCCCCC");
		InventoryWear(Sophie, "HairFront1", "HairFront", "#CCCCCC");
		CharacterArchetypeClothes(Sophie, "Mistress", "#222222");
		SarahCharacter.splice(1, 0, Sophie);

	}

}

// Loads the Amanda character
function AmandaLoad() {

	// If we must show the intro scene
	if (!AmandaIntroDone) {
		if (CurrentCharacter != null) DialogLeave();
		SarahIntroType = "AmandaExplore";
		CommonSetScreen("Cutscene", "SarahIntro");
		AmandaInside = true;
		AmandaIntroDone = true;
	}

}

// Loads the Sophie character
function SophieLoad() {

	// If we must show the intro scene
	if (!SophieIntroDone) {
		if (CurrentCharacter != null) DialogLeave();
		SarahIntroType = "Sophie";
		CommonSetScreen("Cutscene", "SarahIntro");
		SophieInside = true;
		SophieIntroDone = true;
	}

}

// Check to load new characters
function SarahLoadNewCharacter() {

	// Amanda can be loaded if Sarah isn't there or after a while with Sarah.  She must not be in the player room.
	if (!AmandaInside && (AmandaStatus != "InPrivateRoom") && ((AmandaIntroTime <= CurrentTime) && (AmandaIntroTime > 0))) AmandaLoad();
	if (!AmandaInside && (AmandaStatus != "InPrivateRoom") && !AmandaIntroDone && !SarahInside) AmandaLoad();

	// Sophie can be loaded if Sarah & Amanda aren't there or after a while with Amanda.  She must not be in the player room.
	if (!SophieInside && (SophieStatus != "InPrivateRoom") && (SophieIntroTime <= 0) && ((AmandaIntroTime <= CurrentTime) && (AmandaIntroTime > 0)) && (AmandaStatus == "InPrivateRoom")) SophieLoad();
	if (!SophieInside && (SophieStatus != "InPrivateRoom") && ((SophieIntroTime <= CurrentTime) && (SophieIntroTime > 0))) SophieLoad();
	if (!SophieInside && (SophieStatus != "InPrivateRoom") && !SophieIntroDone && !AmandaInside && !SarahInside) SophieLoad();

}

// Make sure the background is proper
function SarahLoadBackground() {
	SarahBackground = "SarahBedroom0";
	SarahBackground = "SarahBedroom" + (SarahCharacter.length - 2).toString();
	if (!SarahInside || (Sarah == null) || !Sarah.IsKneeling()) SarahBackground = "SarahBedroom3";
}

// Run the main introduction room, draw all 3 characters
function SarahRun() {
	SarahLoadNewCharacter();
	SarahLoadBackground();
	for (let C = 0; C < SarahCharacter.length; C++)
		DrawCharacter(SarahCharacter[C], 1000 - (SarahCharacter.length * 250) + (C * 500), (SarahCharacter[C].IsKneeling()) ? -270 : 0, 1);
	if (Player.CanWalk()) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
}

// When the user clicks in the introduction room
function SarahClick() {
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "MainHall");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
	for (let C = 0; C < SarahCharacter.length; C++)
		if (MouseIn(1000 - (SarahCharacter.length * 250) + (C * 500), 0, 500, 1000) && (MouseX < 1885)) {
			if ((SarahCharacter[C].Name == "Mistress Sophie") || (SarahCharacter[C].Name == "Sophie")) SarahSophieSetPunishmentIntro(0);
			if ((SarahCharacter[C].IsPlayer()) || (SarahCharacter[C].Name == "Mistress Sophie") || (SarahCharacter[C].Name == "Sophie") || !SophieInside || (Sophie == null) || ((Sophie.Stage != "200") && (Sophie.Stage != "201")))
				CharacterSetCurrent(SarahCharacter[C]);
		}
}

// Increments the number of activities done with Sarah & Amanda for Amanda & Sophie to come in
function SarahActivityRun() {
	if (AmandaIntroTime > 0) AmandaIntroTime = AmandaIntroTime - MS_PER_MIN;
	if (SophieIntroTime > 0) SophieIntroTime = SophieIntroTime - MS_PER_MIN;
	SarahLoadNewCharacter();
}

// Checks Sarah shackles
function SarahCheckShackles() {
	if (!CurrentCharacter) return;
	SarahActivityRun();
	const focus = CurrentCharacter.FocusGroup = AssetGroupGet(CurrentCharacter.AssetFamily, "ItemArms");
	if (!focus) return;
	DialogInventoryBuild(CurrentCharacter, focus, true);
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "FoundWayToUnlock");
}

// Starts the Sarah unlock quest
function SarahStartUnlockQuest() {
	SarahUnlockQuest = true;
	DialogLeave();
}

// Unlocks Sarah from her predicament
function SarahUnlock() {
	CharacterRelease(Sarah);
	SarahUnlockQuest = false;
	Sarah.Stage = "200";
	PoseSetActive(Sarah, null);
}

function SarahEvasion() {
	SarahUnlock();
	DialogLeave();
}

// When Sarah leaves the room
function SarahLeaveRoom() {
	for (let C = 1; C < SarahCharacter.length; C++)
		if (SarahCharacter[C].Name == "Sarah")
			SarahCharacter.splice(C, 1);
	SarahInside = false;
	DialogLeave();
}

// When Sarah transfers to the player room
function SarahTransferToRoom() {
	SarahLeaveRoom();
	CharacterRelease(Sarah);
	InventoryWear(Sarah, "CollegeOutfit1", "Cloth");
	InventoryWear(Sarah, "CollegeSkirt", "ClothLower");
	InventoryWear(Sarah, "Socks4", "Socks", "#AAAAAA");
	InventoryWear(Sarah, "Shoes2", "Shoes", "#222222");
	InventoryAdd(Player, "StuddedBlindfold", "ItemHead");
	CommonSetScreen("Room", "Private");
	const C = PrivateAddCharacter(Sarah, null, true);
	NPCTraitSet(C, "Submissive", 70);
	NPCTraitSet(C, "Violent", 50);
	NPCTraitSet(C, "Horny", 40);
	NPCTraitSet(C, "Dumb", 20);
	NPCTraitSet(C, "Playful", 90);
	C.Love = 20;
	if (Sarah.IsOwnedByPlayer()) {
		NPCEventAdd(C, "NPCCollaring", CurrentTime);
		InventoryWear(C, "SlaveCollar", "ItemNeck");
		C.Owner = Player.Name;
		C.Love = 100;
	}
	if (Player.Lover == "NPC-Sarah") {
		NPCEventAdd(C, "Girlfriend", CurrentTime);
		C.Lover = Player.Name;
		C.Love = 100;
	}
	if (LogQuery("AmandaSarahLovers", "NPC-AmandaSarah")) C.Lover = "NPC-Amanda";
	NPCTraitDialog(C);
	ServerPrivateCharacterSync();
}

// When Sarah leaves the room
function SarahAmandaLeaveRoom() {
	for (let C = 1; C < SarahCharacter.length; C++)
		if (SarahCharacter[C].Name == "Amanda")
			SarahCharacter.splice(C, 1);
	AmandaInside = false;
	DialogLeave();
}

// When Sophie leaves the room
function SarahSophieLeaveRoom() {
	for (let C = 1; C < SarahCharacter.length; C++)
		if ((SarahCharacter[C].Name == "Sophie") || (SarahCharacter[C].Name == "Mistress Sophie"))
			SarahCharacter.splice(C, 1);
	SophieInside = false;
	DialogLeave();
}

// When Amanda transfers to the room
function SarahTransferAmandaToRoom() {
	SarahAmandaLeaveRoom();
	CharacterRelease(Amanda);
	if (InventoryIsWorn(Amanda, "ItemPelvis", "StraponPanties")) InventoryRemove(Amanda, "ItemPelvis");
	InventoryWear(Amanda, "CollegeOutfit1", "Cloth");
	InventoryWear(Amanda, "CollegeSkirt", "ClothLower");
	InventoryWear(Amanda, "Socks4", "Socks", "#AAAAAA");
	InventoryWear(Amanda, "Shoes1", "Shoes", "#222222");
	InventoryWear(Amanda, "Bra1", "Bra", "#bbbbbb");
	InventoryWear(Amanda, "Panties1", "Panties", "#bbbbbb");
	InventoryAdd(Player, "StraponPanties", "ItemPelvis");
	CommonSetScreen("Room", "Private");
	const C = PrivateAddCharacter(Amanda, null, true);
	NPCTraitSet(C, "Peaceful", 70);
	NPCTraitSet(C, "Wise", 90);
	NPCTraitSet(C, "Serious", 30);
	NPCTraitSet(C, "Polite", 50);
	C.Love = 20;
	if (Amanda.IsOwnedByPlayer()) {
		NPCEventAdd(C, "NPCCollaring", CurrentTime);
		InventoryWear(C, "SlaveCollar", "ItemNeck");
		C.Owner = Player.Name;
		C.Love = 100;
	}
	if (Player.Lover == "NPC-Amanda") {
		NPCEventAdd(C, "Girlfriend", CurrentTime);
		C.Lover = Player.Name;
		C.Love = 100;
	}
	if (Player.IsOwnedByCharacter(Amanda)) {
		NPCEventAdd(C, "PlayerCollaring", CurrentTime);
		NPCEventAdd(C, "LastGift", CurrentTime);
		C.Love = 100;
	}
	if (LogQuery("AmandaSarahLovers", "NPC-AmandaSarah")) C.Lover = "NPC-Sarah";
	NPCTraitDialog(C);
	ServerPrivateCharacterSync();
}

/**
 * When Sophie gets too upset, she might kick the player out
 * @param {number} Offset
 */
function SarahUpsetSophie(Offset) {
	SophieUpsetCount += Offset;
	if (SophieUpsetCount >= 5) {
		Sophie.CurrentDialog = DialogFind(Sophie, "ExpelPlayer");
		Sophie.Stage = "80";
	}
}

/**
 * When a the player gets restrained by Sophie on different phases
 * @param {number} phase
 * @param {number} domRep
 */
function SarahRestrainedBySophie(phase, domRep) {
	if (domRep != 0) ReputationChange("Dominant", domRep);
	if (domRep > 0) SarahUpsetSophie(domRep);
	if (SophieUpsetCount <= 4) {
		if (phase == 0) { InventoryRemove(Player, "ItemArms"); InventoryWear(Player, "LeatherCuffs", "ItemArms"); }
		if (phase == 1) {
			InventoryRemove(Player, "ItemFeet");
			InventoryRemove(Player, "ItemLegs");
			InventoryWear(Player, "LeatherBelt", "ItemFeet");
			InventoryWear(Player, "LeatherBelt", "ItemLegs");
		}
		if (phase == 2) SarahSophiePreparePunishCharacter(Player);
	}
}

/**
 * When a fight starts between the player and Sophie
 */
function SarahFightSophie() {
	Sophie.Name = "Sophie";
	KidnapStart(Sophie, SarahBackground, 10, (victory) => CommonPromiseCatch(SarahFightSophieEnd(victory)));
}

/**
 * When the fight against Sophie ends
 * @param {boolean} victory - Wether the player won or not
 */
async function SarahFightSophieEnd(victory) {
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(Sophie));
	Sophie.Name = "Mistress Sophie";
	SophieFightDone = true;
	SophieUpsetCount = -100;
	Sophie.AllowItem = victory;
	Sophie.Stage = victory ? "60" : "70";
	if (!victory && Player.IsNaked()) Sophie.Stage = "50";
	if (!victory) CharacterRelease(Sophie);
	else CharacterRelease(Player);
	if (victory) LogAdd("KidnapSophie", "Sarah");
	InventoryRemove(Sophie, "ItemHead");
	InventoryRemove(Sophie, "ItemMouth");
	InventoryRemove(Player, "ItemHead");
	InventoryRemove(Player, "ItemMouth");
	await CommonSetScreen("Room", "Sarah");
	CharacterSetCurrent(Sophie);
	Sophie.CurrentDialog = DialogFind(Sophie, victory ? "FightVictory" : "FightDefeat");
}

// Gets the next punishment that Sophie will inflict to the girls
function SarahSophiePunishGirls() {

	// Sets the correct stage & dialog
	if ((SophiePunishmentStage % 2 == 0) && !SarahInside && !AmandaInside) SophiePunishmentStage++;
	Sophie.CurrentDialog = DialogFind(Sophie, "PlayerPunishmentStage" + SophiePunishmentStage.toString());

}

// When Sophie frees Sarah because she's already owned
function SarahSophieFreeSarahAndLeave() {
	SarahUnlock();
	SarahSophieLeaveRoom();
}

// When Sophie frees Amanda and kicks both her and the player out
function SarahSophieFreePlayerAndAmandaTheyLeave() {
	if (PrivateHasEmptySlot()) {
		SarahTransferAmandaToRoom();
		CommonSetScreen("Room", "Private");
	}
	else {
		DialogLeave();
		CommonSetScreen("Room", "MainHall");
	}
	SarahRoomAvailable = false;
}

// When the player gets kicked out and locked out of the room
function SarahKickPlayerOut() {
	DialogLeave();
	SarahRoomAvailable = false;
	CommonSetScreen("Room", "MainHall");
}

/**
 * When Sophie transfers to the room (the player will follow if it was a kidnapping)
 * @param {number} Love
 */
function SarahTransferSophieToRoom(Love) {
	if (SarahShackled()) SarahUnlock();
	SarahSophieLeaveRoom();
	/** @type {ItemBundle[]} */
	var ItemsToEarn = [];
	ItemsToEarn.push({Name: "LeatherCuffs", Group: "ItemArms"});
	ItemsToEarn.push({Name: "Baguette", Group: "ItemHandheld"});
	InventoryAddMany(Player, ItemsToEarn);
	CharacterRelease(Sophie);
	CharacterArchetypeClothes(Sophie, "Mistress", "#333333");
	CommonSetScreen("Room", "Private");
	const C = PrivateAddCharacter(Sophie, "Mistress", true);
	C.Name = "Sophie";
	NPCTraitSet(C, "Dominant", 90);
	NPCTraitSet(C, "Violent", 70);
	NPCTraitSet(C, "Wise", 30);
	NPCTraitSet(C, "Serious", 50);
	NPCTraitSet(C, "Frigid", 10);
	C.Love = Love;
	NPCTraitDialog(C);
	ServerPrivateCharacterSync();
	C.AllowItem = (ReputationGet("Dominant") + 25 >= NPCTraitGet(C, "Dominant"));
	if (Love >= 0) CommonSetScreen("Room", "Sarah");
}

/**
 * When we need to set Sophie intro
 * @param {number} DomRep
 */
function SarahSophieSetPunishmentIntro(DomRep) {
	SarahSophiePunishEvent("", DomRep);
	if (Sophie.Stage == "201") {
		Sophie.Stage = "200";
		SophiePunishmentStage++;
		SarahSophiePunishGirls();
	}
}

/**
 * Strips and restrains a character
 * @param {Character} C
 */
function SarahSophiePreparePunishCharacter(C) {
	CharacterNaked(C);
	CharacterRelease(C);
	InventoryRemove(C, "ItemPelvis");
	InventoryRemove(C, "ItemBreast");
	InventoryRemove(C, "ItemNipples");
	InventoryRemove(C, "ItemVulva");
	InventoryRemove(C, "ItemButt");
	InventoryWear(C, "LeatherCuffs", "ItemArms");
	InventoryWear(C, "LeatherBelt", "ItemFeet");
	InventoryWear(C, "LeatherBelt", "ItemLegs");
	var Cuffs = InventoryGet(C, "ItemArms");
	if (Cuffs) {
		TypedItemSetOptionByName(C, Cuffs, "Wrist");
		CharacterRefresh(C);
	}
}

/**
 * When Sophie starts a character vibrator
 * @param {Character} C
 * @param {string|number} Intensity
 */
function SarahSophieStartBuzz(C, Intensity) {
	Intensity = typeof Intensity !== "number" ? CommonParseInt(Intensity, 10) ?? 0 : Intensity;
	if (Intensity <= -1 || Intensity >= 3) return;

	const Egg = InventoryGet(C, "ItemVulva");
	if (Egg) {
		const newOption = /** @type {VibratingItemOptionConfig} */ (VibratorModeOptions[VibratorModeSet.STANDARD].find(o => o.Property.Intensity === Intensity));
		VibratorModeSetOptionByName(C, Egg, newOption.Name);
		CharacterRefresh(C);
	}
}

/**
 * Sets the Sophie punishment for the player
 * @param {string} EventType
 * @param {number} DomRep
 */
function SarahSophiePunishEvent(EventType, DomRep) {
	if (DomRep != 0) ReputationChange("Dominant", DomRep);
	if (DomRep > 0) SophieUpsetCount = SophieUpsetCount + DomRep;
	if ((EventType == "RestrainOther") && (Amanda != null) && AmandaInside) SarahSophiePreparePunishCharacter(Amanda);
	if ((EventType == "RestrainOther") && (Sarah != null) && SarahInside) { SarahUnlock(); SarahSophiePreparePunishCharacter(Sarah); }
	if (EventType == "Clamps") { InventoryRemove(Player, "ItemNipples"); InventoryWear(Player, "NippleClamp", "ItemNipples"); }
	if ((EventType == "ClampsOther") && (Amanda != null) && AmandaInside) { InventoryRemove(Amanda, "ItemNipples"); InventoryWear(Amanda, "NippleClamp", "ItemNipples"); }
	if ((EventType == "ClampsOther") && (Sarah != null) && SarahInside) { InventoryRemove(Sarah, "ItemNipples"); InventoryWear(Sarah, "NippleClamp", "ItemNipples"); }
	if (EventType == "ChastityBra") { InventoryRemove(Player, "ItemBreast"); InventoryWear(Player, "MetalChastityBra", "ItemBreast"); InventoryLock(Player, "ItemBreast", "MistressPadlock", Sophie); }
	if ((EventType == "ChastityBraOther") && (Amanda != null) && AmandaInside) { InventoryRemove(Amanda, "ItemBreast"); InventoryWear(Amanda, "MetalChastityBra", "ItemBreast"); InventoryLock(Amanda, "ItemBreast", "MistressPadlock", Sophie); }
	if ((EventType == "ChastityBraOther") && (Sarah != null) && SarahInside) { InventoryRemove(Sarah, "ItemBreast"); InventoryWear(Sarah, "MetalChastityBra", "ItemBreast"); InventoryLock(Sarah, "ItemBreast", "MistressPadlock", Sophie); }
	if (EventType == "EggAndPlug") { InventoryRemove(Player, "ItemVulva"); InventoryWear(Player, "VibratingEgg", "ItemVulva"); InventoryRemove(Player, "ItemButt"); InventoryWear(Player, "BlackButtPlug", "ItemButt"); }
	if ((EventType == "EggAndPlugOther") && (Amanda != null) && AmandaInside) { InventoryRemove(Amanda, "ItemVulva"); InventoryWear(Amanda, "VibratingEgg", "ItemVulva"); InventoryRemove(Amanda, "ItemButt"); InventoryWear(Amanda, "BlackButtPlug", "ItemButt"); }
	if ((EventType == "EggAndPlugOther") && (Sarah != null) && SarahInside) { InventoryRemove(Sarah, "ItemVulva"); InventoryWear(Sarah, "VibratingEgg", "ItemVulva"); InventoryRemove(Sarah, "ItemButt"); InventoryWear(Sarah, "BlackButtPlug", "ItemButt"); }
	if (EventType == "ChastityBelt") { InventoryRemove(Player, "ItemPelvis"); InventoryWear(Player, "MetalChastityBelt", "ItemPelvis"); InventoryLock(Player,"ItemPelvis", "MistressPadlock", Sophie); }
	if ((EventType == "ChastityBeltOther") && (Amanda != null) && AmandaInside) { InventoryRemove(Amanda, "ItemPelvis"); InventoryWear(Amanda, "MetalChastityBelt", "ItemPelvis"); InventoryLock(Amanda, "ItemPelvis", "MistressPadlock", Sophie); }
	if ((EventType == "ChastityBeltOther") && (Sarah != null) && SarahInside) { InventoryRemove(Sarah, "ItemPelvis"); InventoryWear(Sarah, "MetalChastityBelt", "ItemPelvis"); InventoryLock(Sarah, "ItemPelvis", "MistressPadlock", Sophie); }
	if (EventType == "Buzz") SarahSophieStartBuzz(Player, 3);
	if ((EventType == "Buzz") && (Amanda != null) && AmandaInside) SarahSophieStartBuzz(Amanda, 3);
	if ((EventType == "Buzz") && (Sarah != null) && SarahInside) SarahSophieStartBuzz(Sarah, 3);
}

/**
 * When the player plays Sophie Orgasm Game
 * @param {number} Factor
 */
function SarahSophieOrgasmGame(Factor) {

	// Increments the game parameters
	SophieOrgasmGameCount++;
	SophieOrgasmGamePleasure += Factor;

	// Once the factor reaches 12, the player loses
	if (SophieOrgasmGamePleasure >= 12) {
		Sophie.CurrentDialog = DialogFind(Sophie, "SophieOrgasmGameDefeat");
		Sophie.Stage = "290";
		SophieUpsetCount = -100;
		return;
	}

	// Gets the number of tries the player must hold to win (hard if Amanda plays, easy if only Sarah plays)
	var WinCount = 5;
	if (SarahAmandaIsInside()) WinCount = 7;
	if (SarahIsInside() && !SarahAmandaIsInside()) WinCount = 3;

	// If the players held for long enough, she wins
	if (SophieOrgasmGameCount >= WinCount) {
		Sophie.CurrentDialog = DialogFind(Sophie, "SophieOrgasmGameVictory");
		Sophie.Stage = "280";
		return;
	}

}

// When Sophie releases all the characters but Sarah
function SarahSophieReleaseEveryoneButSarah() {
	CharacterRelease(Player);
	InventoryRemove(Player, "ItemPelvis");
	InventoryRemove(Player, "ItemBreast");
	InventoryRemove(Player, "ItemNipples");
	InventoryRemove(Player, "ItemVulva");
	InventoryRemove(Player, "ItemButt");
	if (SarahAmandaIsInside()) {
		CharacterRelease(Amanda);
		InventoryRemove(Amanda, "ItemPelvis");
		InventoryRemove(Amanda, "ItemBreast");
		InventoryRemove(Amanda, "ItemNipples");
		InventoryRemove(Amanda, "ItemVulva");
		InventoryRemove(Amanda, "ItemButt");
	}
}

// When the player starts the girls punishment
function SarahPlayerPunishGirls() {
	if (SarahShackled()) SarahUnlock();
	if (Amanda != null) Amanda.Stage = "1000";
	if (Sarah != null) Sarah.Stage = "1000";
}

/**
 * Returns TRUE if the current slave(s) are naked and without restrains
 * @param {NPCCharacter} [C]
 * @returns {boolean}
 */
function SarahSlaveNakedWithoutRestrains(C) {
	if (C == null) {
		if (SarahAndAmandaAreInside()) return SarahSlaveNakedWithoutRestrains(Sarah) && SarahSlaveNakedWithoutRestrains(Amanda);
		else if (SarahIsInside()) return SarahSlaveNakedWithoutRestrains(Sarah);
		else return SarahSlaveNakedWithoutRestrains(Amanda);
	} else return (C.IsNaked() && C.HasNoItem());
}

/**
 * Returns TRUE if the current slave(s) are wearing clamps, egg and butt plug
 * @param {NPCCharacter} [C]
 * @returns {boolean}
 */
function SarahSlaveWithClampEggPlug(C) {
	if (C == null) {
		if (SarahAndAmandaAreInside()) return SarahSlaveWithClampEggPlug(Sarah) && SarahSlaveWithClampEggPlug(Amanda);
		else if (SarahIsInside()) return SarahSlaveWithClampEggPlug(Sarah);
		else return SarahSlaveWithClampEggPlug(Amanda);
	} else {
		if (!InventoryIsWorn(C, "ItemNipples", "NippleClamps")) return false;
		if (!InventoryIsWorn(C, "ItemVulva", "VibratingEgg")) return false;
		if (!InventoryIsWorn(C, "ItemButt", "BlackButtPlug")) return false;
		return true;
	}
}

/**
 * Returns TRUE if the current slave(s) are wearing clamps, egg, butt plug, chastity belt & bra
 * @param {NPCCharacter} [C]
 * @returns {boolean}
 */
function SarahSlaveChaste(C) {
	if (C == null) {
		if (SarahAndAmandaAreInside()) return SarahSlaveChaste(Sarah) && SarahSlaveChaste(Amanda);
		else if (SarahIsInside()) return SarahSlaveChaste(Sarah);
		else return SarahSlaveChaste(Amanda);
	} else {
		if (!InventoryIsWorn(C, "ItemNipples", "NippleClamps")) return false;
		if (!InventoryIsWorn(C, "ItemVulva", "VibratingEgg")) return false;
		if (!InventoryIsWorn(C, "ItemButt", "BlackButtPlug")) return false;
		if (!InventoryIsWorn(C, "ItemPelvis", "MetalChastityBelt")) return false;
		if (!InventoryIsWorn(C, "ItemBreast", "MetalChastityBra")) return false;
		return true;
	}
}

/**
 * Returns TRUE if the current slave(s) are wearing clamps, egg, butt plug, chastity belt, bra & locked cuffs
 * @param {NPCCharacter} [C]
 * @returns {boolean}
 */
function SarahSlaveLockedCuffs(C) {
	if (C == null) {
		if (SarahAndAmandaAreInside()) return SarahSlaveLockedCuffs(Sarah) && SarahSlaveLockedCuffs(Amanda);
		else if (SarahIsInside()) return SarahSlaveLockedCuffs(Sarah);
		else return SarahSlaveLockedCuffs(Amanda);
	} else {
		if (!InventoryIsWorn(C, "ItemNipples", "NippleClamps")) return false;
		if (!InventoryIsWorn(C, "ItemVulva", "VibratingEgg")) return false;
		if (!InventoryIsWorn(C, "ItemButt", "BlackButtPlug")) return false;
		if (!InventoryIsWorn(C, "ItemPelvis", "MetalChastityBelt")) return false;
		if (!InventoryIsWorn(C, "ItemBreast", "MetalChastityBra")) return false;
		if (!InventoryIsWorn(C, "ItemArms", "LeatherCuffs")) return false;
		const armsItem = InventoryGet(C, "ItemArms");
		if (
			!armsItem
			|| armsItem.Asset.Name !== "LeatherCuffs"
			|| !armsItem.Property
			|| !armsItem.Property.TypeRecord
			|| !armsItem.Property.TypeRecord.typed
		) {
			return false;
		} else {
			return true;
		}
	}
}

/**
 * Returns TRUE if the current slave(s) had their orgasms
 * @returns {boolean}
 */
function SarahSlaveOrgasm() {
	if (SarahAndAmandaAreInside()) return !!Sarah.OrgasmDone && !!Amanda.OrgasmDone;
	else if (SarahIsInside()) return !!Sarah.OrgasmDone;
	else return !!Amanda.OrgasmDone;
}

/**
 * Gives the restrains temporarily to Sarah and Amanda so they can be punished
 * @param {NPCCharacter} [C]
 */
function SarahGiveFirstSlaveItem(C) {
	if (C == null) {
		if (SarahIsInside()) SarahGiveFirstSlaveItem(Sarah);
		if (SarahAmandaIsInside()) SarahGiveFirstSlaveItem(Amanda);
	} else {
		InventoryAdd(C, "NippleClamp", "ItemNipples");
		InventoryAdd(C, "BlackButtPlug", "ItemButt");
		InventoryAdd(C, "VibratingEgg", "ItemVulva");
	}
}

/**
 * Gives the second set of restrains temporarily to Sarah and Amanda so they can be punished
 * @param {NPCCharacter} [C]
 */
function SarahGiveSecondSlaveItem(C) {
	if (C == null) {
		if (SarahIsInside()) SarahGiveSecondSlaveItem(Sarah);
		if (SarahAmandaIsInside()) SarahGiveSecondSlaveItem(Amanda);
	} else {
		InventoryAdd(C, "MetalChastityBra", "ItemBreast");
		InventoryAdd(C, "MetalChastityBelt", "ItemPelvis");
	}
}

/**
 * Gives the third set of restrains temporarily to Sarah and Amanda so they can be punished
 * @param {NPCCharacter} [C]
 */
function SarahGiveThirdSlaveItem(C) {
	if (C == null) {
		if (SarahIsInside()) SarahGiveThirdSlaveItem(Sarah);
		if (SarahAmandaIsInside()) SarahGiveThirdSlaveItem(Amanda);
	} else {
		InventoryAdd(C, "LeatherCuffs", "ItemArms");
	}
}

/**
 * Gives the fourth set of restrains temporarily to Sarah and Amanda so they can be punished
 * @param {NPCCharacter} [C]
 */
function SarahGiveFourthSlaveItem(C) {
	if (C == null) {
		if (SarahIsInside()) SarahGiveFourthSlaveItem(Sarah);
		if (SarahAmandaIsInside()) SarahGiveFourthSlaveItem(Amanda);
	} else {
		InventoryAdd(C, "VibratorRemote", "ItemVulva");
		InventoryAdd(C, "Whip", "ItemHandheld");
		InventoryAdd(C, "Crop", "ItemHandheld");
		C.Stage = "1010";
		C.OrgasmMeter = 0;
		C.OrgasmDone = false;
	}
}

/**
 * Build the orgasm meter for the slaves
 * @param {number} Pleasure
 * @param {number} Bonus
 * @param {number} Intensity
 */
function SarahSlaveOrgasmBuild(Pleasure, Bonus, Intensity) {
	if (!CurrentCharacter) return;
	CurrentCharacter.OrgasmMeter ??= 0;
	CurrentCharacter.OrgasmMeter = CurrentCharacter.OrgasmMeter + Pleasure + Bonus;
	if (Intensity >= -1) SarahSophieStartBuzz(CurrentCharacter, Intensity);
	if ((CurrentCharacter.OrgasmMeter >= 10) && (Pleasure >= 2)) {
		CurrentCharacter.OrgasmDone = true;
		CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "OrgasmStart");
		CurrentCharacter.Stage = "1030";
	}
}

// Resets the slave stage
function SarahSlaveReset() {
	if (SarahIsInside()) Sarah.Stage = "200";
	if (SarahAmandaIsInside()) Amanda.Stage = "0";
}
