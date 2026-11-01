"use strict";

var PhotographicBackground = "grey";
/** @type {NPCCharacter} */
var PhotographicSub = /** @type {never} */ (null);
var PhotographicGroupStarted = false;
var PhotographicCurrendGroup = null;
/** @type {null | Item[]} */
var PhotographicSubAppearance = null;
var PhotographicSelectText = "";


// Returns TRUE if the player has maids disabled
/**
 * Checks if the player is helpless (maids disabled) or not.
 * @returns {boolean} - Returns true if the player still has time remaining after asking the maids to stop helping
 */
function PhotographicIsMaidsDisabled() { const expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime ; return (expire > 0 ); }

function PhotographicPlayerCanChangeCloth() {return Player.CanChangeOwnClothes();}
function PhotographicPlayerHatAvailable() {return PhotographicAppearanceAvailable(Player, "Hat");}
function PhotographicPlayerGlovesAvailable() {return PhotographicAppearanceAvailable(Player, "Gloves");}
function PhotographicPlayerClothAvailable() {return PhotographicAppearanceAvailable(Player, "Cloth");}
function PhotographicPlayerClothLowerAvailable() {return PhotographicAppearanceAvailable(Player, "ClothLower");}
function PhotographicPlayerShoesAvailable() {return PhotographicAppearanceAvailable(Player, "Shoes");}
function PhotographicPlayerSocksAvailable() {return (PhotographicAppearanceAvailable(Player, "Socks")&&!PhotographicAppearanceAvailable(Player, "Shoes"));}
function PhotographicPlayerBraAvailable() {return (PhotographicAppearanceAvailable(Player, "Bra")&&!PhotographicAppearanceAvailable(Player, "Cloth"));}
function PhotographicPlayerPantiesAvailable() {return (PhotographicAppearanceAvailable(Player, "Panties")&&!PhotographicAppearanceAvailable(Player, "Cloth")&&!PhotographicAppearanceAvailable(Player, "ClothLower"));}

function PhotographicSubIsRestrained() {return PhotographicSub.IsRestrained();}
function PhotographicSubHatAvailable() {return PhotographicAppearanceAvailable(PhotographicSub, "Hat");}
function PhotographicSubGlovesAvailable() {return PhotographicAppearanceAvailable(PhotographicSub, "Gloves");}
function PhotographicSubClothAvailable() {return PhotographicAppearanceAvailable(PhotographicSub, "Cloth");}
function PhotographicSubClothLowerAvailable() {return PhotographicAppearanceAvailable(PhotographicSub, "ClothLower");}
function PhotographicSubShoesAvailable() {return PhotographicAppearanceAvailable(PhotographicSub, "Shoes");}
function PhotographicSubSocksAvailable() {return (PhotographicAppearanceAvailable(PhotographicSub, "Socks")&&!PhotographicAppearanceAvailable(PhotographicSub, "Shoes"));}
function PhotographicSubBraAvailable() {return (PhotographicAppearanceAvailable(PhotographicSub, "Bra")&&!PhotographicAppearanceAvailable(PhotographicSub, "Cloth"));}
function PhotographicSubPantiesAvailable() {return (PhotographicAppearanceAvailable(PhotographicSub, "Panties")&&!PhotographicAppearanceAvailable(PhotographicSub, "Cloth")&&!PhotographicAppearanceAvailable(PhotographicSub, "ClothLower"));}
function PhotographicSubCanAskForPhoto() {return Player.CanTalk() && !PhotographicSub.IsRestrained();}
function PhotographicSubCanWinkForPhoto() {return !Player.CanTalk() && !PhotographicSub.IsRestrained();}

function PhotographicIsRestrainedWithLock() { return (Player.IsRestrained() && (InventoryCharacterHasLockedRestraint(Player))); }
function PhotographicIsRestrainedWithoutLock() { return (Player.IsRestrained() && !InventoryCharacterHasLockedRestraint(Player)); }
function PhotographicIsRestrainedWithLockAndMaidsNotDisabled() { return (Player.IsRestrained() && (InventoryCharacterHasLockedRestraint(Player)) && !PhotographicIsMaidsDisabled()); }
function PhotographicIsRestrainedWithoutLockAndMaidsNotDisabled() { return (Player.IsRestrained() && !InventoryCharacterHasLockedRestraint(Player) && !PhotographicIsMaidsDisabled()); }
function PhotographicIsMaidsDisabledAndRestrained() { return (Player.IsRestrained() && PhotographicIsMaidsDisabled() ); }

/**
 * @type {ScreenLoadHandler}
 */
async function PhotographicLoad() {
	if (PhotographicSub == null) {
		PhotographicSub = CharacterLoadNPC("NPC_Photographic_Sub");
		PhotographicSubAppearance = PhotographicSub.Appearance.slice();
		PhotographicSub.AllowItem = true;
	}
}

function PhotographicRun() {
	DrawCharacter(Player, 250, 0, 1);
	DrawCharacter(PhotographicSub, 750, 0, 1);
	if (Player.CanWalk()) DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
	if (Player.CanInteract()) DrawButton(1885, 265, 90, 90, "", "White", "Icons/Camera.png");
	if (Player.CanKneel()) DrawButton(1885, 385, 90, 90, "", "White", "Icons/Kneel.png");
	DrawButton(1885, 505, 90, 90, "", Player.CanChangeOwnClothes() ? "White" : "Pink", "Icons/Dress.png");
}

function PhotographicClick() {
	if (MouseIn(250, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (MouseIn(750, 0, 500, 1000)) CharacterSetCurrent(PhotographicSub);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) {
		CharacterRefresh(Player);
		CommonSetScreen("Room", "MainHall");
	}
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
	if (MouseIn(1885, 265, 90, 90) && Player.CanInteract()) CommonTakePhoto(750, 0, 500, 1000);
	if (MouseIn(1885, 385, 90, 90)  && Player.CanKneel()) PoseSetActive(Player, Player.ActivePoseMapping.BodyLower !== "Kneel" ? "Kneel" : "BaseLower", true);
	if (MouseIn(1885, 505, 90, 90) && Player.CanChangeOwnClothes()) CharacterAppearanceLoadCharacter(Player);
}

function PhotographicShotThePlayerPhoto() {
	CommonTakePhoto(0, 0, 500, 1000);
}

/**
 * @param {AssetGroupName} Group
 */
function PhotographicPlayerClothRemove(Group) {
	InventoryRemove(Player, Group);
}

/**
 * @param {Character} C
 * @param {AssetGroupName} Group
 */
function PhotographicAppearanceAvailable(C, Group) {
	for (let I = 0; I < C.Appearance.length; I++) {
		if (C.Appearance[I].Asset.Group.Name == Group) {
			return true;
		}
	}
	return false;
}

/**
 * @param {AssetName} Asset
 * @param {AssetGroupName} Group
 * @deprecated
 */
function PhotographicPlayerAssetAvailable(Asset, Group) {
	for (let I = Player.Inventory.length - 1; I > -1; I--)
		if ((Player.Inventory[I].Name == Asset) && (Player.Inventory[I].Group == Group)) {return true;}
	return false;
}

function PhotographicPlayerRelease() {
	if (!PhotographicSub.IsRestrained()) {
		CharacterRelease(Player);
	} else {
		PhotographicSub.Stage = "0";
		PhotographicSub.CurrentDialog = DialogFind(PhotographicSub, "PhotographicSubTied");
	}
}

/**
 * @param {AssetName} Asset
 * @param {AssetGroupName} Group
 * @deprecated
 */
function PhotographicUseAsset(Asset,Group) {
	InventoryWear(Player, Asset, Group);
	CharacterRefresh(Player);
}

function PhotographicPlayerDressBack() {
	DialogLeave();
	CharacterAppearanceLoadCharacter(Player);
}

function PhotographicSubDressBack() {
	CharacterDress(PhotographicSub, PhotographicSubAppearance ?? []);
}

/**
 * @param {AssetPoseCategory} PoseCategory
 * @returns {boolean}
 */
function PhotographicSubPoseCategoryAllowed(PoseCategory) {
	return PoseCategoryAvailable(PhotographicSub, PoseCategory);
}

/**
 * @param {AssetPoseName} PoseName
 */
function PhotographicSubSetPose(PoseName) {
	PoseSetActive(PhotographicSub, PoseName);
}

/**
 * @param {AssetGroupName} Group
 */
function PhotographicSubClothRemove(Group) {
	InventoryRemove(PhotographicSub, Group);
}

/**
 * @param {AssetGroupName} ItemGroup
 */
function PhotographicStartInventoryPlayer(ItemGroup) {
	DialogLeaveItemMenu();
	DialogChangeFocusToGroup(Player, ItemGroup);
}
