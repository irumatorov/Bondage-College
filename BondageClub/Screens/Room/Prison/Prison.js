"use strict";
var PrisonBackground = "Prison";
/** @type {null | number} */
var PrisonNextEventTimer = null;
var PrisonNextEvent = false;

var PrisonBehavior = 0;

/** @type {NPCCharacter} */
var PrisonMaid = /** @type {never} */ (null);
/** @type {null | Item[]} */
var PrisonMaidAppearance = null;
var PrisonMaidIsPresent = true;
var PrisonMaidIsAngry =false;
/** @type {null | string} */
var PrisonMaidCharacter = null;
var PrisonMaidCharacterList = ["Friendly", "Neutral", "Evil", "Chaotic"];
/** @type {number} */
var PrisonMaidChaotic = 0;

/** @type {NPCCharacter} */
var PrisonSub = /** @type {never} */ (null);
/** @type {Item[]} */
var PrisonSubAppearance = [];
var PrisonSubBehindBars = false;
var PrisonSubSelfCuffed = false;
var PrisonSubIsPresent = false;
var PrisonSubAskedCuff = false;
var PrisonSubIsLeaveOut = true;
var PrisonSubIsStripSearch = false;

/** @type {NPCCharacter} */
var PrisonPolice = /** @type {never} */ (null);
var PrisonPoliceIsPresent = false;
var PrisonPlayerCatchedBadGirl = false;

/** @type {Item[]} */
var PrisonPlayerAppearance = [];
var PrisonPlayerBehindBars = false;
var PrisonPlayerForIllegalChange = false;

// functions for Dialogs
function PrisonPlayerIsHandcuffed() {return InventoryIsWorn(Player, "ItemArms", "MetalCuffs");}
function PrisonPlayerIsPanelGag()   {return InventoryIsWorn(Player, "ItemMouth", "HarnessPanelGag");}
function PrisonPlayerIsLegTied()    {return InventoryIsWorn(Player, "ItemLegs", "LeatherBelt");}
function PrisonPlayerIsFeetTied()   {return InventoryIsWorn(Player, "ItemFeet", "LeatherBelt");}
function PrisonPlayerIsOTMGag()     {return InventoryIsWorn(Player, "ItemMouth", "ClothGag");}
function PrisonPlayerIsStriped()    {return !InventoryGet(Player, "Cloth");}
function PrisonPlayerIsBadGirl()    {return LogQuery("Joined", "BadGirl");}
function PrisonPlayerIsBadGirlThief() {return (LogQuery("Joined", "BadGirl") && (LogQuery("Stolen", "BadGirl") || LogQuery("Hide", "BadGirl") || LogQuery("Caught", "BadGirl")));}
function PrisonPlayerHasSleepingPills() {return (InventoryAvailable(Player, "RegularSleepingPill", "ItemMouth"));}
function PrisonPlayerHasSpankingToys() {return (InventoryAvailable(Player, "Crop", "ItemHandheld"));}
function PrisonPlayerHasKeys() {return (InventoryAvailable(Player, "MetalPadlockKey", "ItemMisc") || InventoryAvailable(Player, "MetalCuffsKey", "ItemMisc"));}
function PrisonSubIsHandcuffedOut() {return (PrisonSubSelfCuffed && !PrisonSubBehindBars);}
function PrisonSubIsBehindBars()    {return PrisonSubBehindBars;}
function PrisonSubIsFree()          {return (!PrisonSubBehindBars && !PrisonSubSelfCuffed);}
function PrisonSubAskForCuff()      {return (!PrisonSubAskedCuff);}
function PrisonSubCanStripSearch()  {return  (!PrisonSubIsStripSearch && PrisonSubBehindBars);}
function PrisonSubCanClothBack()    {return  (PrisonSubIsStripSearch && PrisonSubBehindBars);}

/**
 * Loads the Prison screen
 * @type {ScreenLoadHandler}
 */
async function PrisonLoad() {
	if (PrisonMaid == null) {
		PrisonMaid = CharacterLoadNPC("NPC_Prison_Maid");
		PrisonMaidCharacter = CommonRandomItemFromList(PrisonMaidCharacter, PrisonMaidCharacterList);
		PrisonMaidAppearance = PrisonMaid.Appearance.slice();
		if (LogQuery("LeadSorority", "Maid") && !PrisonPlayerBehindBars) {
			PrisonMaid.AllowItem = true;
		} else {
			PrisonMaid.AllowItem = false;
		}
	}
	if (PrisonPolice == null) {
		PrisonPolice = CharacterLoadNPC("NPC_Prison_Police");
		PrisonWearPoliceEquipment(PrisonPolice);
		PrisonPolice.AllowItem = false;
	}
	PrisonPlayerAppearance = Player.Appearance.slice();
	PrisonNextEventTimer = new Date().getTime() + (20000 * Math.random()) + (10000);

	if (MaidQuartersCurrentRescue === "Prison" && !MaidQuartersCurrentRescueStarted && !PrisonSubBehindBars && !MaidQuartersCurrentRescueCompleted) {
		PrisonSub = CharacterLoadNPC("NPC_Prison_Sub");
	}
	if (GamblingIllegalChange) {
		GamblingIllegalChange = false;
		CharacterSetCurrent(PrisonMaid);
		PrisonMaid.Stage = "20";
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonIllegalChangeIntro");
	}
}

/** @type {ScreenRunHandler} */
function PrisonRun() {
	if (PrisonNextEventTimer == null) PrisonNextEventTimer = new Date().getTime() + (20000 * Math.random()) + (10000);
	if (new Date().getTime() > PrisonNextEventTimer) {
		PrisonNextEventTimer = new Date().getTime() + (20000 * Math.random()) + (10000);
		PrisonNextEvent = true;
	}

	if ((MaidQuartersCurrentRescue == "Prison") && !MaidQuartersCurrentRescueCompleted) {
		//Player is Maid and NPC is Visitor
		if (!PrisonSubBehindBars) {
			DrawImage("Screens/Room/Prison/Cage_open.png", 0, 0);
			if (PrisonSubIsPresent) DrawCharacter(PrisonSub, 500, 0, 1);
		} else {
			//Draw Prisoner smaller
			if (PrisonSubIsPresent) DrawCharacter(PrisonSub, 500, 50, 0.95);
			DrawImage("Screens/Room/Prison/Cage_close.png", 0, 0);
		}
		DrawCharacter(Player, 1000, 0, 1);
		DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
		if (PrisonSubIsPresent) {
			DrawButton(1885, 25, 90, 90, "", "White", "Screens/Room/Prison/eye.png");
		} else if (Player.CanWalk()) {
			DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
		}
		if (PrisonNextEvent && !PrisonSubIsPresent) {
			CharacterDelete(PrisonSub);

			PrisonSub = CharacterLoadNPC("NPC_Prison_Sub");
			PrisonSubAppearance = PrisonSub.Appearance.slice();
			PrisonSubAskedCuff = false;
			PrisonSubIsPresent = true;
			PrisonSubIsLeaveOut = false;
			PrisonNextEvent = false;
		} else if (PrisonNextEvent) {
			PrisonNextEvent = false;
		}
	} else if (PrisonPlayerCatchedBadGirl) {
		// Player is Catch Bad Girl
		if (PrisonPlayerBehindBars) {
			DrawCharacter(Player, 500, 50, 0.95);
			DrawImage("Screens/Room/Prison/Cage_close.png", 0, 0);
		} else {
			DrawImage("Screens/Room/Prison/Cage_open.png", 0, 0);
			DrawCharacter(Player, 500, 0, 1);
		}
		if (PrisonPoliceIsPresent) DrawCharacter(PrisonPolice, 1000, 0, 1);
		if (Player.CanWalk() && !PrisonPlayerBehindBars) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
		if (PrisonPlayerBehindBars) DrawButton(1885, 25, 90, 90, "", "White", "Screens/Room/Prison/ButtonBar.png");
		DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
		if (PrisonNextEvent && PrisonPoliceIsPresent) {
			CharacterDelete(PrisonPolice);

			PrisonPolice = CharacterLoadNPC("NPC_Prison_Police");
			PrisonWearPoliceEquipment(PrisonPolice);
			PrisonNextEvent = false;
			PrisonPoliceIsPresent = true;
		} else if (PrisonNextEvent) {
			PrisonNextEvent = false;
		}

	} else {
		//Player is Vistor an Maid is NPC
		if (PrisonPlayerBehindBars) {
			DrawCharacter(Player, 500, 50, 0.95);
			DrawImage("Screens/Room/Prison/Cage_close.png", 0, 0);
		} else {
			DrawImage("Screens/Room/Prison/Cage_open.png", 0, 0);
			DrawCharacter(Player, 500, 0, 1);
		}
		if (PrisonMaidIsPresent) DrawCharacter(PrisonMaid, 1000, 0, 1);
		if (Player.CanWalk() && !PrisonPlayerBehindBars) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
		if (PrisonPlayerBehindBars) DrawButton(1885, 25, 90, 90, "", "White", "Screens/Room/Prison/ButtonBar.png");
		DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
		// Check if the new maid come
		if (PrisonNextEvent && PrisonMaidIsPresent) {
			CharacterDelete(PrisonMaid);

			PrisonMaid = CharacterLoadNPC("NPC_Prison_Maid");
			PrisonMaidCharacter = CommonRandomItemFromList(PrisonMaidCharacter, PrisonMaidCharacterList);
			PrisonNextEvent = false;
			PrisonMaidIsPresent = true;
			PrisonMaidIsAngry = false;
			PrisonMaid.Stage = "20";
		} else if (PrisonNextEvent) {
			PrisonNextEvent = false;
		}
	}
}

/** @type {MouseEventListener} */
function PrisonClick() {
	if ((MaidQuartersCurrentRescue == "Prison") && !MaidQuartersCurrentRescueCompleted) {
		if (MouseIn(1000, 0, 500, 1000)) CharacterSetCurrent(Player);
		if (MouseIn(500, 0, 500, 1000) && PrisonSubIsPresent) CharacterSetCurrent(PrisonSub);
	} else if (PrisonPlayerCatchedBadGirl == true) {
		if (MouseIn(500, 0, 500, 1000)) CharacterSetCurrent(Player);
		if (MouseIn(1000, 0, 500, 1000) && PrisonPoliceIsPresent) CharacterSetCurrent(PrisonPolice);
	} else {
		if (MouseIn(500, 0, 500, 1000)) CharacterSetCurrent(Player);
		if (MouseIn(1000, 0, 500, 1000) && PrisonMaidIsPresent) CharacterSetCurrent(PrisonMaid);
	}
	if (MouseIn(1885, 25, 90, 90)) {
		if (MaidQuartersCurrentRescue == "Prison" && !MaidQuartersCurrentRescueCompleted && PrisonSubIsPresent) {
			CharacterSetCurrent(Player);
			Player.CurrentDialog = TextGet("Watch");
		} else if ((Player.CanWalk() && !PrisonPlayerBehindBars)) {
			PrisonLeaveCell();
		} else if (PrisonPlayerBehindBars) {
			CharacterSetCurrent(Player);
			Player.CurrentDialog = TextGet("LockKey");
		}
	}
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
}

// #region Player

/**
 * Player going in cell
 */
function PrisonCellPlayerIn() {
	PrisonMaidIsAngry = true;
	PrisonPlayerBehindBars = true;
}

/**
 * Player leave in cell
 */
function PrisonCellPlayerOut() {
	PrisonPlayerBehindBars = false;
	PrisonRestoreConfiscatedItems();
}

/**
 * Add the item as a confiscated item
 * @param {InventoryItem[]} items
 */
function PrisonSaveConfiscatedItems(items) {
	for (const item of items) {
		if (Player.ConfiscatedItems.find(i => i.Group === item.Group && i.Name === item.Name))
			continue;

		Player.ConfiscatedItems.push({ Group: item.Group, Name: item.Name });
	}

	ServerAccountUpdate.QueueData({ ConfiscatedItems: Player.ConfiscatedItems });
}

/**
 * Restore all of the confiscated items and clear the list
 */
function PrisonRestoreConfiscatedItems() {
	if (Array.isArray(Player.ConfiscatedItems))
		InventoryAddMany(Player, Player.ConfiscatedItems);

	Player.ConfiscatedItems = [];
	ServerAccountUpdate.QueueData({ ConfiscatedItems: Player.ConfiscatedItems });
}

/**
 * Maid leave the Prison for 5-15 second
 */
function PrisonMaidLeave() {
	PrisonMaidIsPresent = false;
}

/**
 * Player releases and get back his Cloth, only if the Maid is not angry
 * @param {Character} C
 */
function PrisonCellRelease(C) {
	if (PrisonMaidIsAngry) {
		PrisonMaid.Stage = "20";
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidReleaseIsAngry");
	} else {
		PrisonMaid.Stage = "22";
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidReleaseIsNotAngry");
		Player.Appearance = PrisonPlayerAppearance;
		CharacterRelease(C);
		PrisonCellPlayerOut();
		CharacterRefresh(C);
	}
}

/**
 * The Strip Search Process for the Player
 * @param {Character} C
 */
function PrisonHavySearch(C) {
	if (!PrisonPlayerIsStriped()) {
		PrisonMaidIsAngry = true;
		InventoryRemove(C, "Hat");
		InventoryRemove(C, "Shoes");
		InventoryRemove(C, "Gloves");
		InventoryRemove(C, "Cloth");
		InventoryRemove(C, "ClothLower");
		InventoryWear(C, "MetalCuffs", "ItemArms");
		InventoryWear(C, "LeatherBelt", "ItemLegs");
		InventoryWear(C, "LeatherBelt", "ItemFeet");
		InventoryWear(C, "HarnessPanelGag", "ItemMouth");
		PrisonDisableKey(C);
		PrisonMaid.Stage = "21";
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidHavySearch");
		PrisonMaidLeave();
	} else {
		PrisonMaid.Stage = "21";
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidHavySearchNot");
		PrisonMaidLeave();
	}
}

/**
 * The Light Search Prozess for the Player
 * @param {Character} C
 */
function PrisonLightSearch(C) {
	if (Player.ConfiscatedItems.length === 0) {
		PrisonMaidIsAngry = true;
		InventoryWear(C, "MetalCuffs", "ItemArms");
		if (!C.CanTalk) InventoryWear(Player, "HarnessBallGag", "ItemMouth");
		PrisonDisableKey(C);
		PrisonMaid.Stage = "21";
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidLightSearch");
		PrisonMaidLeave();
	} else {
		PrisonMaid.Stage = "21";
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidLightSearchNot");
		PrisonMaidLeave();
	}
}

/**
 * The Cloth Back Prozess for Prisoner
 * @param {Character} C
 */
function PrisonerClothBack(C) {
	PrisonMaidIsAngry = true;
	if (PrisonPlayerIsStriped()) {
		for (let A = 0; A < PrisonPlayerAppearance.length; A++) {
			if (PrisonPlayerAppearance[A].Asset.Group.Name == "Hat") {
				InventoryWear(C, PrisonPlayerAppearance[A].Asset.Name, "Hat", PrisonPlayerAppearance[A].Color );
			}
			if (PrisonPlayerAppearance[A].Asset.Group.Name == "Shoes") {
				InventoryWear(C, PrisonPlayerAppearance[A].Asset.Name, "Shoes", PrisonPlayerAppearance[A].Color );
			}
			if (PrisonPlayerAppearance[A].Asset.Group.Name == "Gloves") {
				InventoryWear(C, PrisonPlayerAppearance[A].Asset.Name, "Gloves", PrisonPlayerAppearance[A].Color );
			}
			if (PrisonPlayerAppearance[A].Asset.Group.Name == "Cloth") {
				InventoryWear(C, PrisonPlayerAppearance[A].Asset.Name, "Cloth", PrisonPlayerAppearance[A].Color );
			}
			if (PrisonPlayerAppearance[A].Asset.Group.Name == "ClothLower") {
				InventoryWear(C, PrisonPlayerAppearance[A].Asset.Name, "ClothLower", PrisonPlayerAppearance[A].Color );
			}
		}
		CharacterRefresh(C);
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidClothBack");
	} else {
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidClothBackNot");
	}
}

/**
 * Remove the Letherbelts from the Prisoner
 */
function PrisonCuffsRelief() {
	PrisonMaidIsAngry = true;
	if (PrisonPlayerIsPanelGag() || PrisonPlayerIsLegTied() || PrisonPlayerIsFeetTied()) {
		PrisonMaidIsAngry = true;
		CharacterRelease(Player);
		InventoryWear(Player, "MetalCuffs", "ItemArms");
		CharacterRefresh(Player);
		PrisonMaid.Stage = "20";
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidCuffsRelief");
	} else {
		PrisonMaid.Stage = "20";
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidCuffsReliefNot");
	}
}

/**
 * Light Torture for the Prison Player
 */
function PrisonMaidLightTorture() {
	PrisonMaidIsAngry = true;
	PrisonMaid.Stage = "PrisonerTortured";
	const torture = Math.random() * 4;
	if (torture < 1) {
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidTortureFondleButt");
	} else if (torture < 2) {
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidTortureFondleBreast");
	} else if (torture < 3) {
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidTortureMassage");
	} else if (torture < 4) {
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidTortureTickle");
	}
}

/**
 * Heavy Torture for the Prison Player
 */
function PrisonMaidHevyTorture() {
	PrisonMaidIsAngry = true;
	PrisonMaid.Stage = "PrisonerTortured";
	const torture = Math.random() * 5;
	if (torture < 1) {
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidTortureWhipping");
	} else if (torture < 2) {
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidTortureSpankButt");
	} else if (torture < 3) {
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidTortureSpankBreast");
	} else if (torture < 4) {
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidTortureSlap");
	} else if (torture < 5) {
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidTortureCrop");
	}
}

/**
 * Get Hadcuffed Key from Prisoner
 * @param {Character} C
 */
function PrisonDisableKey(C) {
	/** @type {AssetName[]} */
	const keys = ["MetalCuffsKey", "MetalPadlockKey"];

	for (const keyName of keys) {
		const item = InventoryDelete(Player, keyName, "ItemMisc", false);
		if (!item) continue;

		PrisonSaveConfiscatedItems([item]);
	}

	ServerPlayerInventorySync();
}

// #endregion

// #region Dialog

/**
 * Player Ask in Dialog
 */
function PrisonCellPlayerAsk() {
	if (PrisonMaidCharacter == "Chaotic") PrisonMaidChaotic = Math.random();
	if (PrisonMaidCharacter == "Friendly" || (PrisonMaidCharacter == "Chaotic" && PrisonMaidChaotic < 0.33)) {
		InventoryWear(Player, "ClothGag", "ItemMouth");
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidLightGag");
	} else if (PrisonMaidCharacter == "Neutral" || (PrisonMaidCharacter == "Chaotic" && PrisonMaidChaotic < 0.66)) {
		InventoryWear(Player, "HarnessBallGag", "ItemMouth");
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidNeutralGag");
	} else {
		InventoryWear(Player, "HarnessPanelGag", "ItemMouth");
		PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidHevyGag");
	}
	PrisonMaidIsAngry =true;
	PrisonMaid.Stage = "20";
}

/**
 * Player Shake the Cellbars
 */
function PrisonCellPlayerShake() {
	if (PrisonMaidCharacter == "Chaotic") PrisonMaidChaotic = Math.random();
	if (PrisonMaidCharacter == "Friendly" || (PrisonMaidCharacter == "Chaotic" && PrisonMaidChaotic < 0.33)) {
		PrisonLightSearch(Player);
	} else if (PrisonMaidCharacter == "Neutral" || (PrisonMaidCharacter == "Chaotic" && PrisonMaidChaotic < 0.66)) {
		PrisonMaidLightTorture();
	} else {
		PrisonHavySearch(Player);
	}
	PrisonMaidIsAngry =true;
}

/**
 * Player try to escape
 */
function PrisonCellPlayerTry() {
	if (PrisonMaidCharacter == "Chaotic") PrisonMaidChaotic = Math.random();
	if (PrisonMaidCharacter == "Friendly" || (PrisonMaidCharacter == "Chaotic" && PrisonMaidChaotic < 0.33)) {
		PrisonCellRelease(Player);
	} else if (PrisonMaidCharacter == "Neutral" || (PrisonMaidCharacter == "Chaotic" && PrisonMaidChaotic < 0.66)) {
		//ToDo Dialog
		PrisonMaidLightTorture();
	} else {
		PrisonHavySearch(Player);
	}
}

/**
 * Player Wimper to Maid
 */
function PrisonCellPlayerWimper() {
	if (PrisonMaidCharacter == "Chaotic") PrisonMaidChaotic = Math.random();
	if (PrisonMaidCharacter == "Friendly" || (PrisonMaidCharacter == "Chaotic" && PrisonMaidChaotic < 0.33)) {
		PrisonerClothBack(Player);
	} else if (PrisonMaidCharacter == "Neutral" || (PrisonMaidCharacter == "Chaotic" && PrisonMaidChaotic < 0.66)) {
		PrisonCellRelease(Player);
	} else {
		PrisonMaidHevyTorture();
	}
}

/**
 * Player wait for Maids-Action
 */
function PrisonCellPlayerWait() {
	if (PrisonMaidCharacter == "Chaotic") PrisonMaidChaotic = Math.random();
	if (PrisonMaidCharacter == "Friendly" || (PrisonMaidCharacter == "Chaotic" && PrisonMaidChaotic < 0.33)) {
		PrisonCuffsRelief();
	} else if (PrisonMaidCharacter == "Neutral" || (PrisonMaidCharacter == "Chaotic" && PrisonMaidChaotic < 0.66)) {
		PrisonLightSearch(Player);
	} else {
		PrisonMaidHevyTorture();
	}
}

// #endregion

// #region NPC

/**
 * PrisonSub leave the Room
 */
function PrisonSubSendAway() {
	PrisonSubIsPresent = false;
	DialogLeave();
}

/**
 * Check if Prison NPC Wear Handcuffes
 */
function PrisonSubHandcuffing() {
	if (Math.random() > 0.5) {
		InventoryWear(PrisonSub, "MetalCuffs", "ItemArms");
		PrisonSubSelfCuffed = true;
		PrisonSub.CurrentDialog = DialogFind(PrisonSub, "PrisonSubInterrest");
	} else {
		PrisonSub.CurrentDialog = DialogFind(PrisonSub, "PrisonSubNoInterrest");
	}
	PrisonSubAskedCuff = true;
}

/**
 * Shoves NPC in Cell
 */
function PrisonCellSubIn() {
	PrisonSubBehindBars = true;
	PrisonSub.AllowItem = true;
}

/**
 * Strip Search the NPC
 */
function PrisonSubHavySearch() {
	InventoryRemove(PrisonSub, "Hat");
	InventoryRemove(PrisonSub, "Shoes");
	InventoryRemove(PrisonSub, "Gloves");
	InventoryRemove(PrisonSub, "Cloth");
	InventoryRemove(PrisonSub, "ClothLower");
	InventoryWear(PrisonSub, "MetalCuffs", "ItemArms");
	InventoryWear(PrisonSub, "LeatherBelt", "ItemLegs");
	InventoryWear(PrisonSub, "LeatherBelt", "ItemFeet");
	InventoryWear(PrisonSub, "HarnessPanelGag", "ItemMouth");
	PrisonSubIsStripSearch = true;
}

/**
 * Let NPC out of Cell
 */
function PrisonCellSubOut() {
	PrisonSubBehindBars = false;
	PrisonSubIsLeaveOut = true;
	CharacterRelease(PrisonSub);
	PrisonSub.AllowItem = false;
	PrisonSubSelfCuffed = false;
	PrisonSub.Appearance = PrisonSubAppearance;
	CharacterRefresh(PrisonSub);
}

/**
 * The Prison NPC Leave the Cell
 */
function PrisonLeaveCell() {
	if (!PrisonSubBehindBars) {
		PrisonSubIsPresent = false;
		PrisonSubSelfCuffed = false;
	}
	if (MaidQuartersCurrentRescue == "Prison") MaidQuartersCurrentRescueCompleted = true;
	CommonSetScreen("Room", "MainHall");
}

/**
 * Give Cloth back to Sub
 */
function PrisonSubClothBack() {
	for (let A = 0; A < PrisonSubAppearance.length; A++) {
		if (PrisonSubAppearance[A].Asset.Group.Name == "Hat") {
			InventoryWear(PrisonSub, PrisonSubAppearance[A].Asset.Name, "Hat", PrisonSubAppearance[A].Color );
		}
		if (PrisonSubAppearance[A].Asset.Group.Name == "Shoes") {
			InventoryWear(PrisonSub, PrisonSubAppearance[A].Asset.Name, "Shoes", PrisonSubAppearance[A].Color );
		}
		if (PrisonSubAppearance[A].Asset.Group.Name == "Gloves") {
			InventoryWear(PrisonSub, PrisonSubAppearance[A].Asset.Name, "Gloves", PrisonSubAppearance[A].Color );
		}
		if (PrisonSubAppearance[A].Asset.Group.Name == "Cloth") {
			InventoryWear(PrisonSub, PrisonSubAppearance[A].Asset.Name, "Cloth", PrisonSubAppearance[A].Color );
		}
		if (PrisonSubAppearance[A].Asset.Group.Name == "ClothLower") {
			InventoryWear(PrisonSub, PrisonSubAppearance[A].Asset.Name, "ClothLower", PrisonSubAppearance[A].Color );
		}
	}
	PrisonSubIsStripSearch = false;
	CharacterRefresh(PrisonSub);
}

// #endregion

// #region Bad Girls Gang

/*
career of the bad girls
-------
catch/erwischen
fight/kampf
arrest/verhaften
frisk/durchsuchen
interrogation/Verhör
punish/bestrafung
release/entlassung
*/

/**
 * Become a Member of the BadGirlGang
 */
function PrisonBecomeBadGirl() {
	LogAdd("Joined", "BadGirl");
}

/**
 * Leave the BadGirlGang
 */
function PrisonLeaveBadGirl() {
	LogDelete("Joined", "BadGirl");
}

/**
 * Wear NPC as Police
 * @param {Character} C
 */
function PrisonWearPoliceEquipment(C) {
	InventoryWear(C, "Jeans1", "ClothLower", "#3333cc");
	InventoryWear(C, "Boots1", "Shoes", "#202020");
	InventoryWear(C, "TShirt1", "Cloth", "#3333cc");
	InventoryWear(C, "PoliceWomanHat", "Hat");
	InventoryWear(C, "Crop", "ItemHandheld");
}

/**
 * Determine how strongly the player is wanted for MainHall
 */
function PrisonWantedPlayer() {
	if (LogQuery("Caught", "BadGirl")) return 7;
	else if (LogQuery("Hide", "BadGirl")) return 5;
	else if (LogQuery("Stolen", "BadGirl")) return 3;
	else if (LogQuery("Joined", "BadGirl")) return 1;
	return 0;
}

/**
 * Catch by Police in MainHall
 * @param {string} RoomBackground
 * @returns {SafePromise<void>}
 */
async function PrisonMeetPoliceIntro(RoomBackground) {
	const aggressive = PrisonWantedPlayer() >= 4;

	await CommonSetScreen("Room", "Prison");
	PrisonBackground = RoomBackground; //"MainHall","Gambling","HorseStable"
	CharacterDelete(PrisonPolice, false);

	PrisonPolice = CharacterLoadNPC("NPC_Prison_Police");
	PrisonPolice.AllowItem = false;
	PrisonWearPoliceEquipment(PrisonPolice);
	CharacterSetCurrent(PrisonPolice);
	PrisonPolice.Stage = aggressive ? "CatchAggressive" : "Catch";
	PrisonPolice.CurrentDialog = aggressive ? DialogFind(PrisonPolice, "CatchIntroAggressive") : DialogFind(PrisonPolice, "CatchIntro");
}

function PrisonPutHandsInTheAir() {
	PoseSetActive(Player, "Yoked", true);
	if (Math.floor(PrisonWantedPlayer() * Math.random()) >= 3) {
		// cop yells at player to raise her hands higher
		PrisonPolice.Stage = "CatchAggressiveHigher";
		PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "CatchAggressiveHandsHigher");
	} else {
		PrisonPolice.Stage = "CatchAggressive2";
		PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "CatchAggressiveHandsInAir");
	}
}

function PrisonRaiseHandsHigher() {
	PoseSetActive(Player, "OverTheHead", true);
	PrisonPolice.Stage = "CatchAggressive2";
	PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "CatchAggressiveHandsInAir");
}

function PrisonCatchKneel() {
	PoseSetActive(Player, "Kneel", false);
	PrisonPolice.Stage = "CatchAggressive3";
	PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "CatchAggressiveKneeling");
}

function PrisonCatchHandcuffed() {
	InventoryWear(Player, "MetalCuffs", "ItemArms");
	PrisonPolice.Stage = "CatchAggressive4";
	PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "CatchAggressiveHandcuffed");
}

/**
 * player fails to escape if they try after kneeling, Police puts them in hogtie as punishment
 */
function PrisonCatchKneelingEscape() {
	PoseSetActive(Player, null, true);
	const item = InventoryWear(Player, "Chains", "ItemArms", "Default", 3);
	if (item) {
		TypedItemSetOptionByName(Player, item, "Hogtied");
		CharacterRefresh(Player);
	}
	PrisonPolice.Stage = "CatchAggressive5";
	PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "CatchAggressiveFailedEscape");
}

function PrisonCatchComplain() {
	InventoryWear(Player, "BallGag", "ItemMouth");
	PrisonPolice.Stage = "CatchAggressive6";
	PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "CatchAggressiveComplained");
}

function PrisonCatchAdmitDefeat() {
	PrisonPolice.Stage = "CatchAggressive6";
	PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "CatchAggressiveAdmittedDefeat");
}

/**
 * When a fight starts between the player and the Police
 */
function PrisonFightPolice() {
	PoseSetActive(Player, null, true);
	KidnapStart(PrisonPolice, PrisonBackground, 5 + Math.floor(Math.random() * 5), (victory) => CommonPromiseCatch(PrisonFightPoliceEnd(victory)));
}

/**
 * When the fight against Police ends
 * @param {boolean} victory - Whether the player won the encounter
 */
async function PrisonFightPoliceEnd(victory) {
	await CommonSetScreen("Room", "Prison");
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(PrisonPolice));
	if (!victory) {
		CharacterRelease(PrisonPolice);
		InventoryRemove(PrisonPolice, "ItemNeck");
		PrisonWearPoliceEquipment(PrisonPolice);
		PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "CatchDefeat");
		PrisonPolice.Stage = "Catch";
	}else{
		PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "CatchVictoryIntro");
		PrisonPolice.Stage = "CatchVictory";
	}
	CharacterSetCurrent(PrisonPolice);
}

/**
 * Outro for the Fight if Player win
 */
function PrisonFightPoliceOutro() {
	DialogLeave();
	CommonSetScreen("Room", "MainHall");
	PrisonBackground = "Prison";
}

/**
 * Player is caught by Police and imprisoned
 */
async function PrisonCatchByPolice() {
	PrisonBackground = "Prison";
	await CommonSetScreen("Room", "Prison");
	PrisonPlayerBehindBars = true;
	PrisonPlayerCatchedBadGirl = true;
	PrisonPolice.CurrentDialog = DialogFind(PrisonPolice, "ArrestIntro");
	PrisonPolice.Stage = "Arrest0";
	CharacterSetCurrent(PrisonPolice);
	//LogDelete("Stolen", "BadGirl");
	//LogDelete("Hide", "BadGirl");
	//DialogLeave();
}

/**
 * Change the Prison Behavior >0 Good, <0 Bad
 * @param {number} Behavior
 */
function PrisonSetBehavior(Behavior) {
	PrisonBehavior = PrisonBehavior + Behavior;
}

function PrisonArrestHandoverDices() {
	PrisonDiceBack();
	PrisonSetBehavior(2);
}

function PrisonArrestHandoverKeys() {
	PrisonDisableKey(Player);
	PrisonSetBehavior(1);
}

function PrisonArrestHandoverSleepingPills() {
	const pills = InventoryDelete(Player, "RegularSleepingPill", "ItemMouth");
	if (pills) {
		PrisonSaveConfiscatedItems([pills]);
	}
	PrisonSetBehavior(1);
}

function PrisonArrestHandoverSpankingToys() {
	PrisonSaveConfiscatedItems(InventoryDeleteGroup(Player, "ItemHandheld"));
	PrisonSetBehavior(1);
}

function PrisonArrestStripOuterCloth() {
	CharacterAppearanceStripLayer(Player);
	PrisonSetBehavior(-1);
}

function PrisonCharacterIsInUnderwear() {
	return CharacterIsInUnderwear(Player);
}

function PrisonArrestStripUnderware() {
	CharacterNaked(Player);
	PrisonSetBehavior(1);
}

function PrisonArrestSuit() {
	// reset character pose
	PoseSetActive(Player, null, true);
	InventoryWear(Player, "TShirt1", "Cloth", "#644000");
	InventoryWear(Player, "Pajama1", "ClothLower", "#ffa500");
	InventoryWear(Player, "Socks2", "Socks", "#CCCCCC");
	PrisonArrestShackle();
}

function PrisonArrestShackle() {
	CharacterRelease(Player);
	if (PrisonBehavior > 0) {
		InventoryWear(Player, "FullBodyShackles", "ItemArms");
		InventoryLock(Player, "ItemArms", "MetalPadlock", PrisonPolice);

	} else {
		InventoryWear(Player, "Manacles", "ItemArms");
		InventoryLock(Player, "ItemArms", "IntricatePadlock", PrisonPolice);
		InventoryWear(Player, "SpiderGag", "ItemMouth");
	}
}

function PrisonArrestEquipmentSearch() {
	if (LogQuery("Stolen", "BadGirl")) {
		PrisonPolice.Stage = "Arrest10";
	} else if (PrisonPlayerHasKeys()) {
		PrisonPolice.Stage = "Arrest11";
	} else if (PrisonPlayerHasSpankingToys()) {
		PrisonPolice.Stage = "Arrest12";
	} else if (PrisonPlayerHasSleepingPills()) {
		PrisonPolice.Stage = "Arrest13";
	} else {
		PrisonPolice.Stage = "Arrest14";
	}
}

function PrisonArrestConfiscatDices() {
	PrisonDiceBack();
	PrisonSetBehavior(-2);
	PrisonArrestEquipmentSearch();
}

function PrisonArrestConfiscatKeys() {
	PrisonDisableKey(Player);
	PrisonSetBehavior(-1);
	PrisonArrestEquipmentSearch();
}

function PrisonArrestConfiscatSleepingPills() {
	const pills = InventoryDelete(Player, "RegularSleepingPill", "ItemMouth");
	if (pills) {
		PrisonSaveConfiscatedItems([pills]);
	}
	PrisonSetBehavior(-1);
	PrisonArrestEquipmentSearch();
}

function PrisonArrestConfiscatSpankingToys() {
	PrisonSaveConfiscatedItems(InventoryDeleteGroup(Player, "ItemHandheld"));
	PrisonSetBehavior(-1);
	PrisonArrestEquipmentSearch();
}

function PrisonArrestLeave() {
	DialogLeave();
	PrisonPlayerCatchedBadGirl = false;
	PrisonPoliceIsPresent = false;
	PrisonMaid.Stage = "20";
	PrisonMaid.CurrentDialog = DialogFind(PrisonMaid, "PrisonMaidReleaseIsAngry");
}


//ToDo (Helpfunction)
function PrisonDiceBack() {
	LogDelete("Stolen", "BadGirl");
	LogDelete("Hide", "BadGirl");
	LogDelete("Caught", "BadGirl");
}
