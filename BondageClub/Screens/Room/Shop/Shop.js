"use strict";
var ShopBackground = "Shop";
/** @type {null | NPCCharacter} */
var ShopVendor = null;
/** @type {null | NPCCharacter} */
var ShopCustomer = null;
var ShopVendorAllowItem = false;
var ShopBoughtEverything = false;
var ShopRescueScenario = "";
var ShopRescueScenarioList = ["BoughtEverything", "CatBurglar", "BoredVendor", "SleepingAtWork"];
var ShopDemoItemPayment = 0;
/** @type {"" | AssetGroupItemName} */
var ShopDemoItemGroup = "";
/** @type {AssetGroupItemName[]} */
var ShopDemoItemGroupList = ["ItemHead", "ItemMouth", "ItemArms", "ItemLegs", "ItemFeet"];

/**
 * Checks if the vendor is restrained
 * @returns {boolean} - Returns TRUE if the vendor is restrained or gagged
 */
function ShopIsVendorRestrained() {
	return ShopVendor ? (ShopVendor.IsRestrained() || !ShopVendor.CanTalk()) : false;
}

/**
 * Checks if the current rescue scenario corresponds to the given one
 * @param {string} ScenarioName - Name of the rescue scenario to check for
 * @returns {boolean} - Returns TRUE if the current rescue scenario is the given one
 */
function ShopIsRescueScenario(ScenarioName) { return (ShopRescueScenario == ScenarioName); }

/**
 * Entry point for accessing the actual shop from the NPC dialog menu
 */
function ShopEnter() {
	DialogLeave();
	Shop2.Init();
}

/**
 * Loads the shop room and its NPC
 * @type {ScreenLoadHandler}
 */
async function ShopLoad() {
	TextPrefetch("Room", "Shop2");

	// Creates the shop vendor always at full height to be able to click on her zones correctly
	ShopVendor = CharacterLoadNPC("NPC_Shop_Vendor");
	InventoryWear(ShopVendor, "H1000", "Height", "Default");
	ShopVendor.AllowItem = ShopVendorAllowItem;

	// Rescue mission load
	if ((MaidQuartersCurrentRescue == "Shop") && !MaidQuartersCurrentRescueCompleted) ShopVendor.AllowItem = true;
	if ((MaidQuartersCurrentRescue == "Shop") && !MaidQuartersCurrentRescueStarted) {
		MaidQuartersCurrentRescueStarted = true;
		InventoryWearRandom(ShopVendor, "ItemFeet");
		InventoryWearRandom(ShopVendor, "ItemLegs");
		InventoryWearRandom(ShopVendor, "ItemArms");
		InventoryWearRandom(ShopVendor, "ItemNeck");
		InventoryWearRandom(ShopVendor, "ItemMouth");
		InventoryWearRandom(ShopVendor, "ItemHead");
		ShopVendor.Stage = "MaidRescue";
		ShopRescueScenario = CommonRandomItemFromList(ShopRescueScenario, ShopRescueScenarioList);
	}

}

/**
 * Runs and draws the shop screen.
 * @returns {void} - Nothing
 */
function ShopRun() {
	if (!ShopVendor) {
		return;
	}

	// Draw both characters
	DrawCharacter(Player, 0, 0, 1);
	DrawCharacter(ShopVendor, 500, 0, 1);
	DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png");
}

/**
 * Checks if an asset can be bought. An asset is considered missing if it is not owned and has a value greater than 0.
 * (0 is a default item, -1 is a non-purchasable item)
 * @param {Asset} Asset - The asset to check for availability
 * @returns {boolean} - Returns TRUE if the item is purchasable and unowned.
 * @deprecated
 */
function ShopAssetMissing(Asset) {
	return (Asset != null) && (Asset.Group != null) && (Asset.Value > 0) && !InventoryAvailable(Player, Asset.Name, Asset.Group.Name) && !ShopHideGenderedAsset(Asset);
}

/**
 * Check if the player configured settings to hide items only for a specific gender
 * @param {Asset} Asset - The asset to check
 * @returns {boolean} - Returns whether the asset should be hidden
 */
function ShopHideGenderedAsset(Asset) {
	return (Player.GenderSettings.HideShopItems.Female && Asset.Gender == "F")
		|| (Player.GenderSettings.HideShopItems.Male && Asset.Gender == "M");
}

/**
 * Click handler for the shop screen
 * @returns {void} - Nothing
 */
function ShopClick() {
	if (!ShopVendor) {
		return;
	}
	if (MouseIn(0, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (MouseIn(500, 0, 500, 1000)) CharacterSetCurrent(ShopVendor);
	if (MouseIn(1885, 25, 90, 90)) CommonSetScreen("Room", "MainHall");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
}

/**
 * Triggered when the player rescues the shop vendor
 * @returns {void} - Nothing
 */
function ShopCompleteRescue() {
	if (!ShopVendor) {
		return;
	}
	ShopVendor.AllowItem = ShopVendorAllowItem;
	CharacterRelease(ShopVendor);
	MaidQuartersCurrentRescueCompleted = true;
}

/**
 * Checks if the player bought all items that can be bought, including appearance items
 * @returns {void} - Nothing
 */
function ShopCheckBoughtEverything() {
	ShopBoughtEverything = false;
	for (let A = 0; A < Asset.length; A++)
		if ((Asset[A] != null) && (Asset[A].Group != null) && (Asset[A].Value > 0) && !InventoryAvailable(Player, Asset[A].Name, Asset[A].Group.Name))
			return;
	ShopBoughtEverything = true;
}

/**
 * Allows the player to tie the shop vendor if the player has bought everything
 * @returns {void} - Nothing
 */
function ShopVendorBondage() {
	if (!ShopVendor) {
		return;
	}
	ShopVendorAllowItem = true;
	ShopVendor.AllowItem = true;
}

/**
 * Restrains the player with a random shop item before the shop demo job starts. The customer will have a 50/50 chance of being willing to
 * release the player
 * @returns {void} - Nothing
 */
function ShopJobRestrain() {
	if (!ShopVendor) {
		return;
	}
	// First, we find a body part where we can use the item
	DialogChangeReputation("Dominant", -1);
	const availableGroups = ShopJobFilterAvailableGroups();
	if (availableGroups.length > 0) {
		ShopDemoItemGroup = /** @type {AssetGroupItemName} */(CommonRandomItemFromList("", availableGroups));
	} else {
		ShopVendor.Stage = "30";
		return;
	}

	// Add a random item on that body part and creates a customer
	const item = InventoryWearRandom(Player, ShopDemoItemGroup, 3);
	if (!item) {
		return;
	}
	ShopDemoItemPayment = Math.round(item.Asset.Value / 10);
	if ((ShopDemoItemPayment == null) || (ShopDemoItemPayment < 7)) ShopDemoItemPayment = 7;
	ShopCustomer = CharacterLoadNPC("NPC_Shop_Customer");
	ShopCustomer.AllowItem = false;
	ShopCustomer.Stage = ShopDemoItemGroup + "0";
	if (Math.random() >= 0.5) ShopCustomer.WillRelease = function () { return true; };
	else ShopCustomer.WillRelease = function () { return false; };

}

/**
 * Handles starting the shop demo job, the player is sent in an empty room with a customer
 * @returns {void} - Nothing
 */
function ShopJobStart() {
	if (!ShopCustomer) {
		return;
	}
	DialogLeave();
	EmptyBackground = "Shop";
	EmptyCharacterOffset = -500;
	EmptyCharacter = [];
	EmptyCharacter.push(Player);
	EmptyCharacter.push(ShopCustomer);
	CommonSetScreen("Room", "Empty");
}

/**
 * Filters the list of shop demo items down to the groups that are currently available on the player
 * @returns {AssetGroupItemName[]} - The filtered list demo item groups that are both empty and unblocked
 */
function ShopJobFilterAvailableGroups() {
	return ShopDemoItemGroupList.filter((group) => {
		return !InventoryGet(Player, group) && !InventoryGroupIsBlocked(Player, group);
	});
}

/**
 * Checks whether or not the player is able to retry the shop job after completing one
 * @returns {boolean} - Returns true if the player is able to continue running shop jobs (are able to interact, not all
 * demo item groups are occupied/blocked)
 */
function ShopJobCanGoAgain() {
	return Player.CanInteract() && ShopJobFilterAvailableGroups().length > 0;
}
