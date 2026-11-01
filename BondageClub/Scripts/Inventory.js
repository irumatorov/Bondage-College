"use strict";

/**
 * Add a new item by group & name to character inventory
 * @param {Character} C - The character that gets the new item added to her inventory
 * @param {AssetName} NewItemName - The name of the new item to add
 * @param {AssetGroupName} NewItemGroup - The group name of the new item to add
 * @param {boolean} [Push] - Set to TRUE to push to the server
 */
function InventoryAdd(C, NewItemName, NewItemGroup, Push=true) {

	// First, we check if the inventory already exists, exit if it's the case
	if (InventoryAvailable(C, NewItemName, NewItemGroup)) {
		return;
	}

	// Create the new item for current character's asset family, group name and item name
	const NewItem = InventoryItemCreate(C, NewItemGroup, NewItemName);

	// Only add the item if we found the asset
	if (NewItem) {
		// Pushes the new item to the inventory queue
		C.Inventory.push(NewItem);

		// Sends the new item to the server if it's for the current player
		if ((C.IsPlayer()) && ((Push == null) || Push))
			ServerPlayerInventorySync();
	}
}

/**
 * Adds multiple new items by group & name to the character inventory
 * @param {Character} C - The character that gets the new items added to her inventory
 * @param {InventoryBundle[]} NewItems - The new items to add
 * @param {boolean} [Push] - Set to TRUE to push to the server, pushed by default
 */
function InventoryAddMany(C, NewItems, Push=true) {

	// Return if data is invalid
	if (C == null || !Array.isArray(NewItems)) return;

	let ShouldSync = false;

	// Add each items
	for (let NI = 0; NI < NewItems.length; NI++) {
		// First, we check if the item already exists in the inventory, continue if it's the case
		if (!InventoryAvailable(C, NewItems[NI].Name, NewItems[NI].Group)) {
			// Create the new item for current character's asset family, group name and item name
			const NewItem = InventoryItemCreate(C, NewItems[NI].Group, NewItems[NI].Name);

			// Only add the item if we found the asset
			if (NewItem) {
				// Pushes the new item to the inventory and flag the refresh
				C.Inventory.push(NewItem);
				ShouldSync = true;
			}
		}
	}

	// Sends the new item(s) to the server if it's for the current player and an item was added
	if ((C.IsPlayer()) && ((Push == null) || Push) && ShouldSync) ServerPlayerInventorySync();
}

/**
 * Creates a new item for a character based on asset group and name
 * @param {Character} C - The character to create the item for
 * @param {AssetGroupName} Group - The name of the asset group the item belongs to
 * @param {AssetName} Name - The name of the asset for the item
 * @returns {InventoryItem | null} A new item for character using the specified asset name, or null if the specified asset could not be
 *     found in the named group
 */
function InventoryItemCreate(C, Group, Name) {
	const item = AppearanceItem.fromName(Group, Name);
	return item ? Object.assign(item, { Group: item.Asset.Group.Name, Name: item.Asset.Name }) : null;
}

/**
 * Deletes an item from the character inventory
 * @param {Character} C - The character on which we should remove the item
 * @param {AssetName} DelItemName - The name of the item to delete
 * @param {AssetGroupName} DelItemGroup - The group name of the item to delete
 * @param {boolean} [Push] - Set to TRUE to push to the server
 * @returns {InventoryItem | null}
 */
function InventoryDelete(C, DelItemName, DelItemGroup, Push=true) {
	// First, we remove the item from the player inventory
	const idx = C.Inventory.findIndex(i => i.Name === DelItemName && i.Group === DelItemGroup);
	if (idx === -1) return null;
	const item = C.Inventory.splice(idx, 1);
	// Next, we call the player account service to remove the item
	if ((C.IsPlayer()) && ((Push == null) || Push))
		ServerPlayerInventorySync();

	return item ? item[0] : null;
}

/**
 * Deletes all currently-owned items from a given group.
 *
 * @param {Character} C - The character to remove items from
 * @param {AssetGroupName} group - The group name to clear
 * @param {boolean} [push] - Whether to send an update to the server
 * @returns {InventoryItem[]} The list of deleted items
 */
function InventoryDeleteGroup(C, group, push=true) {
	const deleted = [];

	for (let I = 0; I < C.Inventory.length; I++) {
		let item = C.Inventory[I];
		if (item.Group != group) continue;

		deleted.push(item);
		C.Inventory.splice(I, 1);
		// Move back one to not skip over items
		I--;
	}

	if (deleted.length > 0 && (C.IsPlayer()) && ((push == null) || push))
		ServerPlayerInventorySync();

	return deleted;
}

/**
 * Loads the current inventory for a character, can be loaded from an object of Name/Group or a compressed array using LZString
 * @param {string | (readonly ItemBundle[]) | Partial<Record<AssetGroupName, readonly AssetName[]>>} Inventory - An array of Name / Group of items to load
 * @param {string} InventoryData
 * @returns {InventoryBundle[]}
 */
function InventoryLoad(Inventory, InventoryData) {
	if (typeof InventoryData === "string" && InventoryData !== "") {
		return InventoryLoadCompressedData(InventoryData);
	}
	/** @type {InventoryBundle[]} */
	// Since InventoryData wasn't found (R104 and before), we load the old-style inventory object
	if (Inventory == null) return [];
	const items = [];
	if (typeof Inventory === "string") {
		try {
			const str = LZString.decompressFromUTF16(Inventory);
			if (!str) throw new Error(`failed LZString decompression`);
			const inv = JSON.parse(str);
			if (!CommonIsArray(inv)) throw new Error(`failed parsing inventory`);
			for (const item of inv) {
				if (!CommonIsArray(item)) continue;
				items.push(/** @type {InventoryBundle} */({ Group: item[1], Name: item[0] }));
			}
		} catch (_err) {
			console.log("Error while loading compressed inventory, no inventory loaded.");
		}
	} else if (CommonIsArray(Inventory)) {
		for (let I = 0; I < Inventory.length; I++) {
			items.push(Inventory[I]);
		}
	} else if (CommonIsObject(Inventory)) {
		for (const G of CommonKeys(Inventory)) {
			if (!Inventory[G]) continue;
			for (const A of Inventory[G]) {
				items.push({ Group: G, Name: A });
			}
		}
	}
	return items;
}

/**
 * Decompress inventory data into an item bundle
 * @param {string} Data - The string of data to load
 * @returns {InventoryBundle[]}
 */
function InventoryLoadCompressedData(Data) {
	/** @type {ItemBundle[]} */
	const items = [];
	// For each character in the string
	let Pos = 0;
	let LastID = -1;
	while (Pos < Data.length) {

		// Get the InventoryID of that character, if it's a range separator (58), we stay on that position for the full range
		let ID = Data.charCodeAt(Pos);
		if (ID == 58) {
			ID = LastID + 1;
			if ((Pos + 1 < Data.length) && (ID + 1 < Data.charCodeAt(Pos + 1))) Pos--;
		}

		// Adds all the assets linked to that inventory ID
		const A = Asset.find(a => a.InventoryID === ID);
		if (A) {
			items.push({ Group: A.Group.Name, Name: A.Name });
		} else {
			console.error(`unable to find asset for InventoryID: ${ID}, skipping`);
		}

		// Keeps the last ID for ranges and jump to the next position
		LastID = ID;
		Pos++;

	}
	return items;
}

/**
 * Creates the inventory data string from current inventory
 * @param {Character} C - The character on which we should load the inventory data string
 */
function InventoryDataBuild(C) {

	// Loops in the character inventory to build a list of IDs
	let IDList = [];
	for (let I of C.Inventory)
		if ((I.Asset.InventoryID != null) && (IDList.indexOf(I.Asset.InventoryID) < 0))
			IDList.push(I.Asset.InventoryID);

	// Sort the IDs from lowest to highest
	IDList.sort(function(a, b) { return a - b; });

	// Replace ranges by 58 (:), 101, 102, 103, 104 becomes 101, 58, 104
	if (IDList.length >= 3)
		for (let I = 1; I < IDList.length - 1; I++) {
			if ((IDList[I - 1] + 1 == IDList[I]) && (IDList[I + 1] - 1 == IDList[I]))
				IDList[I] = 58;
			else
				if ((IDList[I - 1] == 58) && (IDList[I + 1] - 1 == IDList[I])) {
					IDList.splice(I, 1);
					I--;
				}
		}

	// Builds the final compressed string
	let Data = "";
	for (let I of IDList)
		Data = Data + String.fromCharCode(I);

	return Data;
}

/**
 * Checks if the character has the inventory available
 * @param {Character} C - The character on which we should remove the item
 * @param {AssetName} Name - The name of the item to validate
 * @param {AssetGroupName} Group - The group name of the item to validate
 * @returns {boolean} Whether the given item is in the given character's inventory.
 */
function InventoryAvailable(C, Name, Group) {
	if (C.Inventory.find(i => i.Group === Group && i.Name === Name)) {
		return true;
	}
	let asset = AssetGet(C.AssetFamily, Group, Name);
	if (!asset) {
		return false;
	} else if (asset.AvailableLocations.some(loc => CurrentScreen.startsWith(loc) || ChatSearchGetSpace() === loc)) {
		return true;
	} else if (asset.Value === 0) {
		return true;
	} else if (asset.BuyGroup != null) {
		return AssetBuyGroupMap.get(asset.BuyGroup)?.some(a => a.Value === 0) ?? false;
	} else {
		return false;
	}
}

/**
 * Returns an error message if a prerequisite clashes with the character's items and clothes
 * @param {Character} C - The character on which we check for prerequisites
 * @param {AssetPrerequisite} Prerequisite - The name of the prerequisite
 * @param {null | Asset} asset - The asset (if any) for whom the prerequisite is checked
 * @returns {AssetPrerequisiteCheck} - The error tag, can be converted to an error message
 */
function InventoryPrerequisiteMessage(C, Prerequisite, asset=null) {
	switch (Prerequisite) {
		// Basic pose prerequisites
		case "CanBaseUpper": return !PoseAvailable(C, "BodyUpper", "BaseUpper") ? "CannotBaseUpper" : "";
		case "CanBackBoxTie": return !PoseAvailable(C, "BodyUpper", "BackBoxTie") ? "CannotBackBoxTie" : "";
		case "CanBackCuffs": return !PoseAvailable(C, "BodyUpper", "BackCuffs") ? "CannotBackCuffs" : "";
		case "CanBackElbowTouch": return !PoseAvailable(C, "BodyUpper", "BackElbowTouch") ? "CannotBackElbowTouch" : "";
		case "CanOverTheHead": return !PoseAvailable(C, "BodyUpper", "OverTheHead") ? "CannotOverTheHead" : "";
		case "CanYoked": return !PoseAvailable(C, "BodyUpper", "Yoked") ? "CannotYoked" : "";
		case "CanTapedHands": return !PoseAvailable(C, "BodyHands", "TapedHands") ? "CannotTapedHands" : "";
		case "CanBaseLower": return !PoseAvailable(C, "BodyLower", "BaseLower") ? "CannotBaseLower" : "";
		case "CanKneel": return !PoseAvailable(C, "BodyLower", "Kneel") ? "CannotKneel" : "";
		case "CanKneelingSpread": return !PoseAvailable(C, "BodyLower", "KneelingSpread") ? "CannotKneelingSpread" : "";
		case "CanLegsClosed": return !PoseAvailable(C, "BodyLower", "LegsClosed") ? "CannotLegsClosed" : "";
		case "CanSpread": return !PoseAvailable(C, "BodyLower", "Spread") ? "CannotSpread" : "";
		case "CanHogtied": return !PoseAvailable(C, "BodyFull", "Hogtied") ? "CannotHogtied" : "";
		case "CanAllFours": return !PoseAvailable(C, "BodyFull", "AllFours") ? "CannotAllFours" : "";
		case "CanSuspension": return !PoseAvailable(C, "BodyAddon", "Suspension") ? "CannotSuspension" : "";

		// Basic prerequisites that can apply to many items
		case "NoItemFeet": return (InventoryGet(C, "ItemFeet") != null) ? "MustFreeFeetFirst" : "";
		case "NoItemArms": return (InventoryGet(C, "ItemArms") != null) ? "MustFreeArmsFirst" : "";
		case "NoItemLegs": return (InventoryGet(C, "ItemLegs") != null) ? "MustFreeLegsFirst" : "";
		case "NoItemHands": return (InventoryGet(C, "ItemHands") != null) ? "MustFreeHandsFirst" : "";
		case "NotKneeling": {
			return (
				PoseAllKneeling.some(p => C.PoseMapping.BodyLower === p)
				&& !PoseAllStanding.some(p => PoseAvailable(C, "BodyLower", p))
			 ) ? "MustStandUpFirst" : "";
		}
		case "NotMounted": return C.Effect.includes("Mounted") ? "CannotBeUsedWhenMounted" : "";
		case "NotSuspended": return C.IsSuspended() ? "RemoveSuspensionForItem" : "";
		case "NotLifted": return C.Effect.includes("Lifted") ? "RemoveSuspensionForItem" : "";
		case "NotChaste": return C.Effect.includes("Chaste") ? "RemoveChastityFirst" : "";
		case "NotChained": return C.Effect.includes("IsChained") ? "RemoveChainForItem" : "";
		case "Collared": return (InventoryGet(C, "ItemNeck") == null) ? "MustCollaredFirst" : "";
		case "CannotBeSuited": return InventoryIsItemInList(C, "ItemArms", ["FullLatexSuit"]) ? "CannotBeSuited" : "";
		case "CannotHaveWand": return InventoryIsItemInList(C, "ItemVulva", ["WandBelt", "HempRopeBelt"]) ? "CannotHaveWand" : "";
		case "OnBed": return !C.Effect.includes("OnBed") ? "MustBeOnBed" : "";
		case "CuffedArms": return  !C.Effect.includes("CuffedArms") ? "MustBeArmCuffedFirst" : "";
		case "CuffedLegs": return !C.Effect.includes("CuffedFeet") ? "MustBeFeetCuffedFirst" : "";
		case "CuffedFeet": return !C.Effect.includes("CuffedFeet") ? "MustBeFeetCuffedFirst" : "";
		case "CuffedArmsOrEmpty": return (InventoryGet(C, "ItemArms") != null && !C.Effect.includes("CuffedArms")) ? "MustFreeArmsFirst" : "";
		case "CuffedLegsOrEmpty": return (InventoryGet(C, "ItemLegs") != null && !C.Effect.includes("CuffedLegs")) ? "MustFreeLegsFirst" : "";
		case "CuffedFeetOrEmpty": return (InventoryGet(C, "ItemFeet") != null && !C.Effect.includes("CuffedFeet")) ? "MustFreeFeetFirst" : "";
		case "NoOuterClothes": return InventoryHasItemInAnyGroup(C, ["Cloth", "ClothLower", "ClothOuter"]) ? "RemoveClothesForItem" : "";
		case "NoClothLower": return InventoryHasItemInAnyGroup(C, ["ClothLower"]) ? "RemoveClothesForItem" : "";
		case "NoMaidTray": return InventoryIsItemInList(C, "ItemMisc", ["WoodenMaidTray", "WoodenMaidTrayFull"]) ? "CannotBeUsedWhileServingDrinks" : "";
		case "CanBeCeilingTethered": return InventoryHasItemInAnyGroup(C, ["ItemArms", "ItemTorso", "ItemTorso2", "ItemPelvis"]) ? "" : "AddItemsToUse";

		// Checks for body
		case "HasBreasts": return !InventoryIsItemInList(C, "BodyUpper", ["XLarge", "Large", "Normal", "Small"]) ? "MustHaveBreasts" : "";
		case "HasFlatChest": return !InventoryIsItemInList(C, "BodyUpper", ["FlatSmall", "FlatMedium"]) ? "MustHaveFlatChest" : "";

		// Checks for genitalia
		case "HasVagina": return !InventoryIsItemInList(C, "Pussy", ["Pussy1", "Pussy2", "Pussy3"]) ? "MustHaveVagina" : "";
		case "HasPenis": return !InventoryIsItemInList(C, "Pussy", ["Penis"]) ? "MustHavePenis" : "";
		case "CanHaveErection": {
			if (!InventoryIsItemInList(C, "Pussy", ["Penis"]))
				return "MustHavePenis";
			if (C.HasEffect("Chaste"))
				return "CantHaveErection";
			return "";
		}
		case "CanBeLimp": {
			if (!InventoryIsItemInList(C, "Pussy", ["Penis"]))
				return "MustHavePenis";
			if (C.HasEffect("ForcedErection"))
				return "CantBeLimp";
			return "";
		}


		// Checks for chastity cages, in case of penis protruding items.
		case "NoChastityCage": return InventoryIsItemInList(C, "ItemVulva", ["TechnoChastityCage", "PlasticChastityCage1", "PlasticChastityCage2", "FlatChastityCage", "ChastityPouch", "Ballspreader"]) ? "MustRemoveChastityCage" : "";
		case "NoErection": return C.HasEffect("ForcedErection") ? "MustNotHaveForcedErection" : "";

		// Checks for penis protruding items, to block chastity cages.
		case "AccessFullPenis": return InventoryIsItemInList(C, "ItemArms", []) ? "MustHaveFullPenisAccess" : "";
		// Checks for torso access based on clothes
		case "AccessTorso": {
			const doItemsExposeGroup = InventoryDoItemsExposeGroup(C, "ItemTorso", ["Cloth", "ClothOuter"]);
			if (doItemsExposeGroup) return "";

			if (asset) {
				const itemsRequireExposing = ["HarnessBra1", "LeatherBreastBinder", "LeatherStrapBra1", "HarnessBra2", "NavelBar1"];
				return itemsRequireExposing.some(name => asset.Name === name) ? "RemoveClothesForItem" : "";
			}
			return "RemoveClothesForItem";
		}

		// Breast items can be blocked by clothes
		case "AccessBreast": return !InventoryDoItemsExposeGroup(C, "ItemBreast", ["Cloth", "ClothOuter"]) || !InventoryDoItemsExposeGroup(
			C, "ItemBreast", ["Bra"]) ? "RemoveClothesForItem" : "";
		case "AccessBreastSuitZip": return !InventoryDoItemsExposeGroup(C, "ItemNipplesPiercings", ["Cloth", "ClothOuter"]) || !InventoryDoItemsExposeGroup(
			C, "ItemNipplesPiercings", ["Suit"]) ? "UnZipSuitForItem" : "";

		// Vulva/Butt items can be blocked by clothes, panties and some socks, as well as chastity
		case "AccessButt":
		case "AccessVulva": {
			const target = Prerequisite === "AccessVulva" ? "ItemVulva" : "ItemButt";

			if (InventoryDoItemsBlockGroup(C, target, ["Cloth", "Panties", "Socks", "ClothLower"]) || !InventoryDoItemsExposeGroup(C, target, ["ClothLower", "Panties"]))
				return "RemoveClothesForItem";

			// Some chastity belts have removable vulva shields. This checks for those for items that wish to add something externally.
			if (InventoryDoItemsBlockGroup(C, target, ["ItemPelvis", "ItemVulvaPiercings"])
				|| Prerequisite === "AccessVulva" && C.IsVulvaChaste()
				|| Prerequisite === "AccessButt" && C.IsButtChaste())
				return "RemoveChastityFirst";

			return "";
		}

		case "AccessCrotch":
			return (InventoryDoItemsBlockGroup(C, "ItemPelvis", ["Cloth", "ClothLower", "ClothOuter", "Socks", "Panties"])
				|| (!InventoryDoItemsExposeGroup(C, "ItemVulva", ["ClothLower", "Panties"])
				&& !InventoryDoItemsExposeGroup(C, "ItemVulvaPiercings", ["ClothLower", "Panties"])
				&& !InventoryDoItemsExposeGroup(C, "ItemButt", ["ClothLower", "Panties"])))
				? "RemoveClothesForItem" : "";

		case "CanCoverVulva":
			return C.HasEffect("VulvaShaft") ? "CantCloseOnShaft" : "";

		// Items that require access to a certain character's zone
		case "AccessMouth": return InventoryPrerequisiteConflicts.GagEffect(C, ["BlockMouth"], asset);
		case "BlockedMouth": return InventoryPrerequisiteConflicts.GagEffect(C, ["BlockMouth"], asset, { errMessage: "MustBeUsedOverGag", invert: true });
		case "HoodEmpty": return InventoryGet(C, "ItemHood") ? "CannotBeUsedOverMask" : "";
		case "EyesEmpty": return InventoryGet(C, "ItemHead") ? "CannotBeUsedOverHood" : "";

		// Ensure crotch is empty
		case "VulvaEmpty": return (InventoryGet(C, "ItemVulva") != null) ? "MustFreeVulvaFirst" : "";
		case "ClitEmpty": return ((InventoryGet(C, "ItemVulvaPiercings") != null)) ? "MustFreeClitFirst" : "";
		case "ButtEmpty": return ((InventoryGet(C, "ItemButt") != null)) ? "MustFreeButtFirst" : "";

		// For body parts that must be naked
		case "NakedFeet": return InventoryHasItemInAnyGroup(C, ["ItemBoots", "Socks", "Shoes"]) ? "RemoveClothesForItem" : "";
		case "NakedHands": return InventoryHasItemInAnyGroup(C, ["ItemHands", "Gloves"]) ? "RemoveClothesForItem" : "";

		// Display Frame
		case "DisplayFrame": return InventoryHasItemInAnyGroup(C, ["ItemArms", "ItemLegs", "ItemFeet", "ItemBoots"])
			? "RemoveRestraintsFirst"
			: InventoryHasItemInAnyGroup(C, ["Cloth", "ClothLower", "Shoes"])
			? "RemoveClothesForItem" : "";

		// Gas mask (Or face covering items going below the chin)
		case "GasMask": return InventoryIsItemInList(C, "ItemArms", ["Pillory"]) || InventoryIsItemInList(C, "ItemDevices", ["TheDisplayFrame"]) ? "RemoveRestraintsFirst" : "";
		case "NotMasked": return InventoryIsItemInList(C, "ItemHood", ["OldGasMask"]) ? "RemoveFaceMaskFirst" : "";

		// Blocked remotes on self
		case "RemotesAllowed": return LogQuery("BlockRemoteSelf", "OwnerRule") && C.IsPlayer() ? "OwnerBlockedRemotes" : "";

		// Layered Gags, prevent gags from being equipped over other gags they are incompatible with
		case "GagUnique": return InventoryPrerequisiteConflicts.GagPrerequisite(C, ["GagFlat", "GagCorset", "GagUnique"], asset);
		case "GagCorset": return InventoryPrerequisiteConflicts.GagPrerequisite(C, ["GagCorset"], asset);

		// There's something in the mouth that's too large to allow that item on
		case "NotProtrudingFromMouth": return InventoryPrerequisiteConflicts.GagEffect(C, ["ProtrudingMouth"], asset, { errMessage: "CannotBeUsedOverGag" });

		case "NeedsNippleRings": return !InventoryIsItemInList(C, "ItemNipplesPiercings", ["RoundPiercing"]) ? "NeedsNippleRings" : "";
		case "CanAttachMittens": return !CharacterHasItemWithAttribute(C, "CanAttachMittens") ? "CantAttachMittens" : "";
		case "NeedsChestHarness": return !CharacterHasItemWithAttribute(C, "IsChestHarness") ? "NeedsChestHarness" : "";
		case "NeedsHipHarness": return !CharacterHasItemWithAttribute(C, "IsHipHarness") ? "NeedsHipHarness" : "";

		// Returns no message, indicating that all prerequisites are fine
		case "GagFlat": return "";
		default: {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			console.error(`Unknown asset prerequisite "${Prerequisite}"`);
			return "";
		}
	}
}

/**
 * Prerequisite utility function that returns TRUE if the given character has an item equipped in the provided group
 * whose name matches one of the names in the provided list.
 * @param {Character} C - The character for whom to check equipped items
 * @param {AssetGroupName} ItemGroup - The name of the item group to check
 * @param {readonly AssetName[]} ItemList - A list of item names to check against
 * @returns {boolean} - TRUE if the character has an item from the item list equipped in the named slot, FALSE
 * otherwise
 */
function InventoryIsItemInList(C, ItemGroup, ItemList) {
	const Item = InventoryGet(C, ItemGroup);
	return !!Item && ItemList.includes(Item.Asset.Name);
}

/**
 * Prerequisite utility function that returns TRUE if the given character has an item equipped in the provided group
 * which has the provided prerequisite.
 * @param {Character} C - The character whose items should be checked
 * @param {AssetGroupName} ItemGroup - The name of the item group to check
 * @param {AssetPrerequisite} Prerequisite - The name of the prerequisite to look for
 * @returns {boolean} - TRUE if the character has an item equipped in the named slot which has the named prerequisite,
 * FALSE otherwise
 * @deprecated
 */
function InventoryDoesItemHavePrerequisite(C, ItemGroup, Prerequisite) {
	const Item = InventoryGet(C, ItemGroup);
	return !!Item && Item.Asset.Prerequisite && Item.Asset.Prerequisite.includes(Prerequisite);
}

/**
 * Prerequisite utility function to check whether the target group for the given character is blocked by any of the
 * given groups to check.
 * @param {Character} C - The character whose items should be checked
 * @param {AssetGroupItemName} TargetGroup - The name of the group that should be checked for being blocked
 * @param {readonly AssetGroupName[]} GroupsToCheck - The name(s) of the groups whose items should be checked
 * @returns {boolean} - TRUE if the character has an item equipped in any of the given groups to check which blocks the
 * target group, FALSE otherwise.
 */
function InventoryDoItemsBlockGroup(C, TargetGroup, GroupsToCheck) {
	return GroupsToCheck.some((Group) => {
		const Item = InventoryGet(C, Group);
		return !!Item && InventoryGetItemProperty(Item, "Block")?.includes(TargetGroup);
	});
}

/**
 * Prerequisite utility function to check whether the target group for the given character is exposed by all of the
 * given groups to check.
 * @param {Character} C - The character whose items should be checked
 * @param {AssetGroupItemName} TargetGroup - The name of the group that should be checked for being exposed
 * @param {readonly AssetGroupName[]} GroupsToCheck - The name(s) of the groups whose items should be checked
 * @returns {boolean} - FALSE if the character has an item equipped in ANY of the given groups to check that does not
 * expose the target group. Returns TRUE otherwise.
 */
function InventoryDoItemsExposeGroup(C, TargetGroup, GroupsToCheck) {
	return GroupsToCheck.every((Group) => {
		const Item = InventoryGet(C, Group);
		return !Item || InventoryGetItemProperty(Item, "Expose")?.includes(TargetGroup);
	});
}

/**
 * Prerequisite utility function that returns TRUE if the given character has an item equipped in any of the named group
 * slots.
 * @param {Character} C - The character whose items should be checked
 * @param {readonly AssetGroupName[]} GroupList - The list of groups to check for items in
 * @returns {boolean} - TRUE if the character has any item equipped in any of the named groups, FALSE otherwise.
 */
function InventoryHasItemInAnyGroup(C, GroupList) {
	return GroupList.some(GroupName => !!InventoryGet(C, GroupName));
}

// FIXME: The `asset` parameters should not accept `null`, but we cannot easily guarantee that it isn't due to
// `InventoryPrerequisiteMessage` not always having access to the asset (e.g. when checking action
// prerequisites, for which there really *is* no relevant asset)
/**
 * Namespace with functions for identifying asset prerequisite conflicts.
 * @namespace
 */
var InventoryPrerequisiteConflicts = {
	/**
	 * The effective "layering" priorities of gags and (potentially) gag-like objects.
	 * Used for prerequisite checks that only apply to lower gags.
	 * @type {Partial<Record<AssetGroupName, number>>}
	 */
	GagPriorities: {
		ItemNeck: 0,
		ItemMouth: 1,
		ItemMouth2: 2,
		ItemMouth3: 3,
		ItemHead: 4,
		Mask: 5,
		ItemHood: 6,
	},

	/**
	 * @private
	 * @template {keyof PropertiesArray} T
	 * @param {T} fieldName
	 * @param {Character} C - The character on which we check for prerequisites
	 * @param {PropertiesArray[T]} blockingPrereqs - The prerequisites we check for on lower gags
	 * @param {Asset|null} asset - The new gag
	 * @param {object} [options]
	 * @param {InventoryPrerequisiteConflicts.ErrMessage} [options.errMessage] - The to-be returned message if the gag is blocked
	 * @param {boolean} [options.invert] - Whether the prerequisite check should be inverted (_i.e._ if "not any" instead of "any")
	 * @returns {InventoryPrerequisiteConflicts.ErrMessage} - Returns the error message if the gag is blocked, or an empty string if not
	 */
	_GagCheck: function _GagCheck(fieldName, C, blockingPrereqs, asset=null, options) {
		/** @type {(readonly unknown[]) | undefined | null} */
		const blockingPrereqsUnknown = blockingPrereqs;
		const errMessage = options?.errMessage ?? "CannotBeUsedOverGag";
		const invert = options?.invert ?? false;

		/** @type {number | undefined} */
		const gagPriority = asset?.Group?.Name ? InventoryPrerequisiteConflicts.GagPriorities[asset.Group.Name] : undefined;
		const gagItems = CommonKeys(InventoryPrerequisiteConflicts.GagPriorities).map(group => InventoryGet(C, group));

		// Find all lower gags in which there is a prerequisite that blocks the new gag
		const prereqConflicts = gagItems.slice(0, gagPriority).filter(item => {
			if (!item) return false;
			/** @type {(readonly unknown[]) | undefined | null} */
			const prereqs = InventoryGetItemProperty(item, fieldName);
			return prereqs?.some((p) => blockingPrereqsUnknown?.includes(p));
		}).filter((item) => item != null);

		const hasConflict = invert ? prereqConflicts.length === 0 : prereqConflicts.length > 0;
		return hasConflict ? errMessage : "";
	},

	/**
	 * Check if there are any lower gags with prerequisites that block the new gag from being applied
	 * @param {Character} C - The character on which we check for prerequisites
	 * @param {readonly AssetPrerequisite[]} blockingPrereqs - The prerequisites we check for on lower gags
	 * @param {Asset|null} asset - The new gag
	 * @param {object} [options]
	 * @param {InventoryPrerequisiteConflicts.ErrMessage} [options.errMessage] - The to-be returned message if the gag is blocked
	 * @param {boolean} [options.invert] - Whether the prerequisite check should be inverted (_i.e._ if "not any" instead of "any")
	 * @returns {InventoryPrerequisiteConflicts.ErrMessage} - Returns the error message if the gag is blocked, or an empty string if not
	 */
	GagPrerequisite: function GagPrerequisite(C, blockingPrereqs, asset=null, options) {
		return InventoryPrerequisiteConflicts._GagCheck("Prerequisite", C, blockingPrereqs, asset, options);
	},

	/**
	 * Check if there are any lower gags with effects that block the new gag from being applied
	 * @param {Character} C - The character on which we check for prerequisites
	 * @param {readonly EffectName[]} blockingEffects - The prerequisites we check for on lower gags
	 * @param {Asset|null} [asset] - The new gag
	 * @param {object} [options]
	 * @param {InventoryPrerequisiteConflicts.ErrMessage} [options.errMessage] - The to-be returned message if the gag is blocked
	 * @param {boolean} [options.invert] - Whether the prerequisite check should be inverted (_i.e._ if "not any" instead of "any")
	 * @returns {InventoryPrerequisiteConflicts.ErrMessage} - Returns the error message if the gag is blocked, or an empty string if not
	 */
	GagEffect: function GagEffect(C, blockingEffects, asset=null, options) {
		return InventoryPrerequisiteConflicts._GagCheck("Effect", C, /** @type {EffectName[]} */(blockingEffects), asset, options);
	},
};

/**
 * Returns an error message if we cannot add the item, no other items must block that prerequisite; `null` is returned otherwise
 * @param {Character} C - The character on which we check for prerequisites
 * @param {Asset} asset - The asset for which prerequisites should be checked. Any item equipped in the asset's group
 * will be ignored for the purposes of the prerequisite check.
 * @param {AssetPrerequisite | readonly AssetPrerequisite[]} [prerequisites] - An array of prerequisites or a string for a single
 * prerequisite. If nothing is provided, the asset's default prerequisites will be used
 * @param {readonly AssetPoseName[]} [allowActivePose]
 * @returns {string | null} - An error message (if any)
 */
function InventoryDisallow(C, asset, prerequisites = asset.Prerequisite, allowActivePose = asset.AllowActivePose) {
	// Prerequisite can be a string
	if (typeof prerequisites === "string") {
		prerequisites = [prerequisites];
	}

	// If prerequisite isn't a valid array, return true
	if (!CommonIsArray(prerequisites)) {
		return null;
	}

	// Create/load a simple character for prerequisite checking
	const checkCharacter = CharacterLoadSimple("InventoryAllow");
	checkCharacter.Appearance = C.Appearance.filter((item) => item.Asset.Group.Name !== asset.Group.Name);
	CharacterLoadEffect(checkCharacter);
	PoseRefresh(checkCharacter);

	/** @type {ReturnType<typeof InventoryPrerequisiteMessage>} */
	let Msg = "";
	const posePrereq = /** @type {PosePrerequisite[]} */(prerequisites.filter(p => p.slice(3) in PoseRecord));
	if (posePrereq.length === 0) {
		prerequisites.some(prereq => (Msg = InventoryPrerequisiteMessage(checkCharacter, prereq, asset)));
	} else {
		// In the case of poses the `SetPose`-based prerequisite can fall back to any `AllowActivePose` member of the same category
		const poseMapping = PoseToMapping.Array(allowActivePose ?? [], "Asset.AllowActivePose");
		for (const prereq of prerequisites) {
			if (CommonIncludes(posePrereq, prereq)) {
				const setPose = PoseRecord[/** @type {AssetPoseName} */(prereq.slice(3))];
				const allowedActivePoses = [...(poseMapping[setPose.Category] || [setPose.Name]), ...(poseMapping.BodyFull || [])];
				const messages = allowedActivePoses.map(p => InventoryPrerequisiteMessage(checkCharacter, `Can${p}`, asset));
				if (messages.every(Boolean)) {
					Msg = messages[0];
				}
			} else {
				Msg = InventoryPrerequisiteMessage(checkCharacter, prereq, asset);
			}
			if (Msg) {
				break;
			}
		}
	}

	return Msg ? InterfaceTextGet(`Prerequisite${Msg}`) : null;
}

/**
 * Returns TRUE if we can add the item, no other items must block that prerequisite
 * @param {Character} C - The character on which we check for prerequisites
 * @param {Asset} asset - The asset for which prerequisites should be checked. Any item equipped in the asset's group
 * will be ignored for the purposes of the prerequisite check.
 * @param {AssetPrerequisite | readonly AssetPrerequisite[]} [prerequisites] - An array of prerequisites or a string for a single
 * prerequisite. If nothing is provided, the asset's default prerequisites will be used
 * @param {boolean} [setDialog] - If TRUE, set the screen dialog message at the same time
 * @param {readonly AssetPoseName[]} [allowActivePose]
 * @returns {boolean} - TRUE if the item can be added to the character
 */
function InventoryAllow(C, asset, prerequisites = asset.Prerequisite, setDialog = true, allowActivePose = asset.AllowActivePose) {
	const errMessage = InventoryDisallow(C, asset, prerequisites, allowActivePose);

	// If no error message was found, we return TRUE, if a message was found, we can show it in the dialog
	if (errMessage && setDialog) DialogSetStatus(errMessage, DialogTextDefaultDuration);
	return errMessage === null;
}

/**
 * Gets the current item / cloth worn a specific area (AssetGroup)
 * @param {Character} C - The character on which we must check the appearance
 * @param {AssetGroupName|null|undefined} AssetGroup - The name of the asset group to scan
 * @returns {Item|null} - Returns the appearance which is the item / cloth asset, color and properties
 */
function InventoryGet(C, AssetGroup) {
	return C.Appearance.find(A => A.Asset.Group.Family === C.AssetFamily && A.Asset.Group.Name === AssetGroup) ?? null;
}

/**
 * Applies crafted properties to the item used
 * @param {null | Character} Source - The character that used the item (if any)
 * @param {Character} Target - The character on which the item is used
 * @param {AssetGroupItemName} GroupName - The name of the asset group to scan
 * @param {CraftingItem | CraftingPartialItem} Craft - The crafted properties to apply
 * @param {boolean} Refresh - TRUE if we must refresh the character
 * @param {boolean} PreConfigureItem - TRUE if the default, pre-configured item state of the crafted item must be (re-)applied
 * @param {boolean} CraftWarn - Whether a warning should logged whenever the crafting validation fails
 * @returns {void}
 */
function InventoryCraft(Source, Target, GroupName, Craft, Refresh, PreConfigureItem=true, CraftWarn=true) {
	// Gets the item first
	if ((Target == null) || (GroupName == null)) return;
	let Item = InventoryGet(Target, GroupName);
	if ((Item == null) || !CraftingValidate(/** @type {CraftingItem} */(Craft), Item.Asset, CraftWarn, Source?.IsPlayer(), Craft.Partial ?? true)) return;

	Item.Craft ??= Craft;
	Item.Property ??= {};
	Item.Difficulty ??= Item.Asset.Difficulty;

	// Sets the crafter name and ID (if not already set)
	if (Source) {
		Item.Craft.MemberNumber ??= Source.MemberNumber;
		Item.Craft.MemberName ??= CharacterNickname(Source);
	}

	// Abort; the properties below are pre-configured by crafted items the first time they're applied,
	// but should otherwise not be touched by this function lest they undo any further item customization applied after the fact
	if (!PreConfigureItem) {
		return;
	}

	// Applies the color schema, separated by commas
	if (CraftingIsNonPartial(Craft)) {
		Item.Color = /** @type {BCColor[]} */(Craft.Color.replace(" ", "").split(","));

		// Set extended item properties
		ExtendedItemSetOptionByRecord(
			Target, Item, Craft.TypeRecord,
			{ push: false, refresh: false, C_Source: Source ?? undefined, properties: Craft.ItemProperty ?? undefined },
		);

		// Applies a lock to the item
		if (Craft.Lock != "") {
			InventoryLock(Target, Item, Craft.Lock, Source, false);
		}

		// Update the item's difficulty
		Item.Difficulty += Craft.DifficultyFactor ?? 0;
	}

	if (Item.Craft.Effects?.Decoy) {
		Item.Difficulty = -50;
	}
	Item.Difficulty += 4 * (Item.Craft.Effects?.Secure ?? 0);
	Item.Difficulty -= 4 * (Item.Craft.Effects?.Loose ?? 0);

	if (Item.Craft.Effects?.Painful) {
		InventoryExpressionTriggerApply(Target, [
			{ Group: "Blush", Name: "ShortBreath", Timer: 10 },
			{ Group: "Eyes", Name: "Angry", Timer: 10 },
			{ Group: "Eyes2", Name: "Angry", Timer: 10 },
			{ Group: "Eyebrows", Name: "Angry", Timer: 10 },
		]);
		Item.Property.Fetish = CommonArrayConcatDedupe(Item.Property.Fetish || [], ["Masochism"]);
	}

	if (Item.Craft.Effects?.Comfy) {
		InventoryExpressionTriggerApply(Target, [
			{ Group: "Blush", Name: "Low", Timer: 10 },
			{ Group: "Eyes", Name: "Horny", Timer: 10 },
			{ Group: "Eyes2", Name: "Horny", Timer: 10 },
			{ Group: "Eyebrows", Name: "Raised", Timer: 10 },
		]);
	}

	// Refreshes the character if needed
	if (Refresh) {
		CharacterRefresh(Target, true);
	}
}

/**
 * Returns the number of items on a character with a specific property
 * @param {Character} C - The character to validate
 * @param {CraftingPropertyType} Property - The property to count
 * @param {boolean} Stacking - Whether to account for property stacking
 * @returns {number} - The number of times the property is found
 */
function InventoryCraftCount(C, Property, Stacking = false) {
	if ((C == null) || (C.Appearance == null)) return 0;
	if (Stacking) return C.Appearance.reduce((acc, a) => acc + (a?.Craft?.Effects?.[Property] ?? 0), 0);
	return C.Appearance.filter(a => (a?.Craft?.Effects?.[Property] ?? 0) > 0).length;
}

/**
 * @deprecated - Superseded by {@link CraftingCraftGetEffect}
 * Returns TRUE if an item as the specified crafted property
 * @returns {void}
 */
function InventoryCraftPropertyIs() {}

/**
 * Makes the character wear an item on a body area
 * @param {Character} C - The character that must wear the item
 * @param {AssetName} AssetName - The name of the asset to wear
 * @param {AssetGroupName} AssetGroup - The name of the asset group to wear
 * @param {null | Readonly<ItemColor>} [ItemColor] - The hex color of the item, can be undefined or "Default"
 * @param {null | number} [Difficulty] - The difficulty, on top of the base asset difficulty, to assign to the item
 * @param {null | number} [MemberNumber] - The member number of the character putting the item on - defaults to -1
 * @param {null | Readonly<CraftingItem> | Readonly<CraftingPartialItem>} [Craft] - The crafting properties of the item
 * @param {boolean} [Refresh] - Whether to refresh the character and push the changes to the server
 * @returns {Item | null} - Thew newly created item or `null` if the asset does not exist
 */
function InventoryWear(C, AssetName, AssetGroup, ItemColor=null, Difficulty=null, MemberNumber=null, Craft=null, Refresh=true) {
	const A = AssetGet(C.AssetFamily, AssetGroup, AssetName);
	if (!A) return null;
	ItemColor ??= "Default";
	const color = ItemColor === "Default" ? [...A.DefaultColor] : ItemColor;
	const item = CharacterAppearanceSetItem(C, AssetGroup, A, color, Difficulty, MemberNumber);
	if (!item) return null;

	/**
	 * TODO: grant tighter control over setting expressions.
	 * As expressions handle a "first come, first served" principle this can currently override extended
	 * item option-specific expressions and crafting property-specific expressions (see {@link InventoryCraft})
	 */
	if (A.ExpressionTrigger != null) {
		InventoryExpressionTriggerApply(C, A.ExpressionTrigger);
	}

	if (Craft) {
		// Restore the item color if it has been explicitly passed; keep using the `Craft.Color`-assigned color otherwise
		const C_Source = Character.find(c => c.MemberNumber === MemberNumber) ?? null;
		const backupColor = item.Color;
		InventoryCraft(C_Source, C, /** @type {AssetGroupItemName} */(AssetGroup), CommonCloneDeep(Craft), false);
		if (ItemColor !== "Default") {
			item.Color = backupColor;
		}
	}

	if (Refresh) {
		CharacterRefresh(C, true);
	}
	return item;
}

/**
 * Sets the difficulty to remove an item for a body area
 * @param {Character} C - The character that is wearing the item
 * @param {AssetGroupItemName} AssetGroup - The name of the asset group
 * @param {number} Difficulty - The new difficulty level to escape from the item
 */
function InventorySetDifficulty(C, AssetGroup, Difficulty) {
	const item = InventoryGet(C, AssetGroup);
	if (!item) return;
	item.Difficulty = CommonClamp(Difficulty, 0, 100);

	if ((CurrentModule != "Character") && (C.IsPlayer())) ServerPlayerAppearanceSync();
}

/**
 * Returns TRUE if there's already a locked item at a given body area
 * @param {Character} C - The character that is wearing the item
 * @param {AssetGroupItemName} AssetGroup - The name of the asset group (body area)
 * @param {boolean} CheckProperties - Set to TRUE to check for additionnal properties
 * @returns {boolean} - TRUE if the item is locked
 */
function InventoryLocked(C, AssetGroup, CheckProperties) {
	const item = InventoryGet(C, AssetGroup);
	if (!item) return false;
	return InventoryItemHasEffect(item, "Lock", CheckProperties);
}

/**
 * Makes the character wear a random item from a body area
 * @param {Character} C - The character that must wear the item
 * @param {AssetGroupName} GroupName - The name of the asset group (body area)
 * @param {null | number} [Difficulty] - The difficulty, on top of the base asset difficulty, to assign to the item
 * @param {null | boolean} [Refresh] - Do not call CharacterRefresh if false
 * @param {null | boolean} [MustOwn] - If TRUE, only assets that the character owns can be worn. Otherwise any asset can
 * be used
 * @param {boolean} [Extend] - Whether or not to randomly extend the item (i.e. set the item type), provided it has
 * an archetype that supports random extension
 * @param {readonly AssetName[]} [AllowedAssets] - A list of assets from which one must be selected
 * @param {boolean} [IgnoreRequirements] - If True, the group being blocked and prerequisites will not prevent the item being added.
 *  NOTE: Long-term this should be replaced with better checks before calling this function.
 * @returns {Item | null} - The equipped item (if any)
 */
function InventoryWearRandom(C, GroupName, Difficulty, Refresh = true, MustOwn = false, Extend = true, AllowedAssets = undefined, IgnoreRequirements = false) {
	Difficulty ??= 0;
	if (InventoryLocked(C, /** @type {AssetGroupItemName} */(GroupName), true)) {
		return null;
	}

	// Finds the asset group and make sure it's not blocked
	const Group = AssetGroupGet(C.AssetFamily, GroupName);
	if (!Group || !IgnoreRequirements && (!Group || InventoryGroupIsBlocked(C, /** @type {AssetGroupItemName} */(GroupName)))) {
		return null;
	}
	const IsClothes = Group.Clothing;

	// Build the list of assets we can use and filter it down if needed
	const groupAssets = Asset.filter(a =>
		a.Group.Family === C.AssetFamily &&
		a.Group.Name === GroupName &&
		(AllowedAssets || a.Random) &&
		CharacterAppearanceGenderAllowed(a) &&
		(!MustOwn || InventoryAvailable(C, a.Name, a.Group.Name)));
	const AssetList = AllowedAssets ? AllowedAssets.map(assetName => groupAssets.find(a => a.Name === assetName)).filter(Boolean) : groupAssets;

	// Get and apply a random asset
	const SelectedAsset = InventoryGetRandom(C, GroupName, AssetList, IgnoreRequirements);
	if (!SelectedAsset) return null;

	// Pick a random color for clothes from their schema
	const SelectedColor = IsClothes ? SelectedAsset.Group.ColorSchema[Math.floor(Math.random() * SelectedAsset.Group.ColorSchema.length)] : undefined;

	let item = CharacterAppearanceSetItem(C, GroupName, SelectedAsset, SelectedColor, Difficulty);
	if (Extend) {
		InventoryRandomExtend(C, GroupName, undefined, false, false);
	}

	if (Refresh) {
		CharacterRefresh(C);
	}
	return item;
}

/**
 * Randomly extends an item (sets an item type, etc.) on a character
 * @param {Character} C - The character wearing the item
 * @param {AssetGroupName} GroupName - The name of the item's group
 * @param {Character | undefined} [C_Source] - The character setting the new item option. If `null`, assume that it is _not_ the player character.
 * @param {boolean} [push] - Whether the change should be pushed.
 * @param {boolean} [refresh] - Whether the character's appearance should be refreshed.
 * @returns {Item | null} - The equipped item (if any)
 */
function InventoryRandomExtend(C, GroupName, C_Source=undefined, push=undefined, refresh=undefined) {
	const Item = InventoryGet(C, GroupName);

	if (!Item || !Item.Asset.Archetype) {
		return null;
	}

	switch (Item.Asset.Archetype) {
		case ExtendedArchetype.TYPED:
			TypedItemSetRandomOption(C, Item, push, C_Source, refresh);
			break;
		default:
			// Archetype does not yet support random extension
			break;
	}
	return Item;
}

/**
 * Select a random asset from a group, narrowed to the most preferable available options (i.e
 * unblocked/visible/unlimited) based on their binary "rank"
 * @param {Character} C - The character to pick the asset for
 * @param {AssetGroupName | undefined} GroupName - The asset group to pick the asset from. Set to an empty string to not filter by group.
 * @param {readonly Asset[]} [AllowedAssets] - Optional parameter: A list of assets from which one can be selected. If not provided,
 *     the full list of all assets is used.
 * @param {boolean} [IgnorePrerequisites] - If True, skip the step to check whether prerequisites are met
 *  NOTE: Long-term this should be replaced with better checks before calling this function.
 * @returns {Asset|null} - The randomly selected asset or `undefined` if none found
 */
function InventoryGetRandom(C, GroupName, AllowedAssets, IgnorePrerequisites = false) {
	/** @type {{ Asset: Asset, Rank: number }[]} */
	const List = [];
	const AssetList = AllowedAssets || Asset;
	const RandomOnly = (AllowedAssets == null);

	let MinRank = Math.pow(2, 10);
	const BlockedRank = Math.pow(2, 2);
	const HiddenRank = Math.pow(2, 1);
	const LimitedRank = Math.pow(2, 0);

	for (let A = 0; A < AssetList.length; A++)
		if (((AssetList[A].Group.Name == GroupName && AssetList[A].Wear) || !GroupName)
			&& (RandomOnly == false || AssetList[A].Random)
			&& AssetList[A].Enable
			&& (IgnorePrerequisites || InventoryAllow(C, AssetList[A], undefined, false)))
		{
			let CurrRank = 0;

			if (InventoryIsPermissionBlocked(C, AssetList[A].Name, AssetList[A].Group.Name)) {
				if (BlockedRank > MinRank) continue;
				else CurrRank += BlockedRank;
			}

			if (GroupName && CharacterAppearanceItemIsHidden(AssetList[A].Name, GroupName)) {
				if (HiddenRank > MinRank) continue;
				else CurrRank += HiddenRank;
			}

			if (InventoryIsPermissionLimited(C, AssetList[A].Name, AssetList[A].Group.Name)) {
				if (LimitedRank > MinRank) continue;
				else CurrRank += LimitedRank;
			}

			MinRank = Math.min(MinRank, CurrRank);
			List.push({ Asset: AssetList[A], Rank: CurrRank });
		}

	const PreferredList = List.filter(L => L.Rank == MinRank);
	if (PreferredList.length == 0) return null;

	return PreferredList[Math.floor(Math.random() * PreferredList.length)].Asset;
}

/**
 * See {@link InventoryRemove}
 * @private
 * @param {Character} C
 * @param {Set<number>} outputIndices
 * @param {Item[]} outputItems
 * @param {Item} superItem
 * @param {null | readonly RemoveOnItemRemove[]} removeItemOnRemove
 */
function _InventoryRemoveDFS(C, outputIndices, outputItems, superItem, removeItemOnRemove=null) {
	removeItemOnRemove ??= superItem.Asset.RemoveItemOnRemove;
	for (const { Name, Group, TypeRecord } of removeItemOnRemove) {
		const subItem = CommonFindMap(
			C.Appearance,
			(item, index) => item.Asset.Group.Name === Group ? { item, index } : undefined,
		);
		if (!subItem || outputIndices.has(subItem.index)) {
			// Item was not found or we've got some cyclic `Asset.RemoveItemOnRemove` logic going on
			continue;
		}

		let isMatch = true;
		if (Name) {
			isMatch &&= Name === subItem.item.Asset.Name;
		}
		if (TypeRecord) {
			isMatch &&= CommonObjectIsSubset(TypeRecord, subItem.item.Property?.TypeRecord ?? {});
		}

		if (isMatch) {
			outputIndices.add(subItem.index);
			outputItems.push(subItem.item);
			_InventoryRemoveDFS(C, outputIndices, outputItems, subItem.item);
		}
	}
}

/**
 * Removes one or more specific items from a character body area via their group name(s)
 * @param {Character} C - The character on which we must remove the item
 * @param {AssetGroupName | readonly AssetGroupName[]} AssetGroup - The name of the asset group(s)
 * @param {boolean | null | InventoryRemoveOptions} [options] - Further options. A boolean is interpreted as the `refresh` option.
 * @returns {Item[]} - The removed items
 */
function InventoryRemove(C, AssetGroup, options=null) {
	if (!CommonIsArray(AssetGroup)) {
		AssetGroup = [AssetGroup];
	}
	const items = AssetGroup.map(group => InventoryGet(C, group)).filter(i => i != null);
	const optionsObject = typeof options === "boolean" ? { refresh: options } : options;
	return InventoryRemoveItems(C, items, optionsObject);
}

/**
 * Removes one or more specific items from a character
 * @param {Character} C - The character on which we must remove the item
 * @param {Item | readonly Item[]} items - The item(s) in question
 * @param {null | InventoryRemoveOptions} [options] - Further options
 * @returns {Item[]} - The removed items
 */
function InventoryRemoveItems(C, items, options=null) {
	if (!CommonIsArray(items)) {
		items = [items];
	}

	/** @type {Set<number>} */
	const removalIndices = new Set;
	/** @type {Item[]} */
	const removalItems = [];
	const itemEntries = items.map(item => /** @type {const} */([C.Appearance.indexOf(item), item]));

	for (const [i, item] of itemEntries) {
		if (i === -1 || removalIndices.has(i)) {
			continue;
		}
		removalItems.push(item);
		removalIndices.add(i);
		_InventoryRemoveDFS(C, removalIndices, removalItems, item, options?.removeItemOnRemove);
	}
	if (!removalIndices.size) {
		return [];
	}

	const removalsSorted = Array.from(removalIndices).sort((a, b) => b - a);
	for (const index of removalsSorted) {
		// NOTE: This is the _only_ place in the codebase where entries should be removed from the Appearance array
		// TODO: Review `Appearance.filter` usage throughout the code base
		C.Appearance.splice(index, 1);
	}
	if (C.IsPlayer()) {
		BlindFlashQueue = true;
	}

	if (options?.refresh ?? true) {
		CharacterRefresh(C);
	}
	return removalItems;
}

/**
 * Returns TRUE if the body area (Asset Group) for a character is blocked for either restraints (default) or activities and cannot be used
 * @param {Character} C - The character on which we validate the group
 * @param {AssetGroupItemName} GroupName - The name of the asset group (body area), defaults to `C.FocusGroup`
 * @param {boolean} [Activity] - if TRUE check if activity is allowed on the asset group
 * @returns {boolean} - TRUE if the group is blocked
 */
function InventoryGroupIsBlockedForCharacter(C, GroupName, Activity=false) {
	const restraints = C.Appearance.filter(i => i.Asset.Group.IsItem());

	if (Activity && !restraints.some(i => i.Asset.AllowActivityOn.includes(GroupName) || i.Property?.AllowActivityOn?.includes(GroupName))) {
		Activity = false;
	}

	// Items can block each other (hoods blocks gags, belts blocks eggs, etc.)
	if (!Activity && restraints.some(i => i.Asset.Block?.includes(GroupName) || i.Property?.Block?.includes(GroupName))) {
		return true;
	}

	// If another character is enclosed, items other than the enclosing one cannot be used
	if (!C.IsPlayer() && C.IsEnclose()) {
		return !restraints.some(i => i.Asset.Group.Name == GroupName && InventoryItemHasEffect(i, "Enclose", true));
	} else {
		return false;
	}
}

/**
 * Returns TRUE if no item can be used by the player on the character because of the map distance
 * @param {Character} C - The character on which we validate the distance
 * @returns {boolean} - TRUE if distance is too far
 */
function InventoryIsBlockedByDistance(C) {
	if ((C == null) || C.IsPlayer()) return false;
	if ((CurrentScreen !== "ChatRoom") || !ChatRoomIsViewActive(ChatRoomMapViewName)) return false;
	if (ChatRoomMapViewHasSuperPowers() || ChatRoomMapViewCharacterOnInteractionRange(C)) return false;
	return true;
}

/**
 * Returns TRUE if the body area is blocked by an owner rule
 * @param {Character} C - The character on which we validate the group
 * @param {AssetGroupName} GroupName - The name of the asset group (body area)
 * @returns {boolean} - TRUE if the group is blocked
 */
function InventoryGroupIsBlockedByOwnerRule(C, GroupName) {
	if (!C.IsPlayer()) return false;
	if (!Player.IsOwned()) return false;
	if (CurrentCharacter == null) return false;

	const blocked = LogGetString("BlockItemGroup", "OwnerRule");
	if (!blocked || !Array.isArray(blocked)) return false;

	return blocked.includes(GroupName);
}

/**
 * Returns an error message if the body area (Asset Group) for a character is blocked, and `null` otherwise.
 *
 * Similar to {@link InventoryGroupIsBlockedForCharacter} but also checks for map range and owner rules.
 * @param {Character} C - The character on which we validate the group
 * @param {AssetGroupItemName} GroupName - The name of the asset group (body area)
 * @param {boolean} [Activity] - if TRUE check if activity is allowed on the asset group
 * @returns {null | string} - The error message (if any)
 */
function InventoryGroupIsAvailable(C, GroupName, Activity=false) {
	// Checks for regular blocks and enclose effects
	if (InventoryGroupIsBlockedForCharacter(C, GroupName, Activity)) {
		return InterfaceTextGet("ZoneBlocked");
	}

	// Check for map range
	if (InventoryIsBlockedByDistance(C)) {
		return InterfaceTextGet("ZoneBlockedRange");
	}

	// Checks if there's an owner rule that blocks the group
	if (InventoryGroupIsBlockedByOwnerRule(C, GroupName)) {
		return InterfaceTextGet("ZoneBlockedOwner");
	}

	// Nothing is preventing the group from being used
	return null;
}

/**
 * Returns TRUE if the body area (Asset Group) for a character is blocked and cannot be used.
 *
 * Similar to {@link InventoryGroupIsBlockedForCharacter} but also checks for map range and owner rules.
 * @param {Character} C - The character on which we validate the group
 * @param {AssetGroupItemName} GroupName - The name of the asset group (body area)
 * @param {boolean} [Activity] - if TRUE check if activity is allowed on the asset group
 * @returns {boolean} - TRUE if the group is blocked
 */
function InventoryGroupIsBlocked(C, GroupName, Activity=false) {
	return InventoryGroupIsAvailable(C, GroupName, Activity) !== null;
}

/**
 * Returns TRUE if an item has a specific effect
 * @param {Item} Item - The item from appearance that must be validated
 * @param {EffectName} [Effect] - The name of the effect to validate, can be undefined to check for any effect
 * @param {boolean} [CheckProperties] - If properties should be checked (defaults to `true`)
 * @returns {boolean} `true` if the effect is on the item
 */
function InventoryItemHasEffect(Item, Effect, CheckProperties = true) {
	if (!Item) return false;
	if (!Effect) {
		return !!(
			(Item.Asset && Array.isArray(Item.Asset.Effect) && Item.Asset.Effect.length > 0) ||
			(CheckProperties && Item.Property && Array.isArray(Item.Property.Effect) && Item.Property.Effect.length > 0)
		);
	} else {
		return !!(
			(Item.Asset && Array.isArray(Item.Asset.Effect) && Item.Asset.Effect.includes(Effect)) ||
			(CheckProperties && Item.Property && Array.isArray(Item.Property.Effect) && Item.Property.Effect.includes(Effect))
		);
	}
}

/**
 * Returns TRUE if an item lock is pickable
 * @param {Item} Item - The item from appearance that must be validated
 * @returns {boolean} - TRUE if PickDifficulty is on the item
 */
function InventoryItemIsPickable(Item) {
	if (!Item) return false;
	const lock = InventoryGetLock(Item);
	if (lock && lock.Asset && lock.Asset.PickDifficulty && lock.Asset.PickDifficulty > 0) return true;
	else return false;
}

/** @satisfies {Set<keyof PropertiesArray>} */
const PropertiesArrayLike = new Set(/** @type {const} */([
	"Attribute", "Block", "Category", "DefaultColor", "Effect", "Expose", "ExpressionTrigger", "Prerequisite", "Require", "Fetish", "Tint",
	"AllowActivePose", "SetPose",
	"AllowActivity", "AllowActivityOn",
	"Hide", "HideItem", "HideItemExclude", "UnHide",
	"MemberNumberList", "Texts",
	"AllowBlock", "AllowEffect", "AllowExpression", "AllowHide", "AllowHideItem",
	"AvailableLocations", "ExpressionPrerequisite",
]));

/** @satisfies {Set<keyof PropertiesRecord>} */
const PropertiesObjectLike = new Set(/** @type {const} */([
	"ActivityExpression", "PoseMapping", "RemoveItemOnRemove", "TypeRecord", "AllowLockType",
]));

/**
 * Returns the value of a given property of an appearance item, prioritizes the Property object.
 * @template {keyof ItemProperties | keyof Asset | keyof AssetGroup} Name
 * @param {Item} Item - The appearance item to scan
 * @param {Name} PropertyName - The property name to get.
 * @param {boolean} [CheckGroup] - Whether or not to fall back to the item's group if the property is not found on
 * Property or Asset.
 * @returns {(ItemProperties & Asset & AssetGroup)[Name] | undefined} - The value of the requested property for the given item.
 * Returns either undefined, an empty array or object if the property or the item itself does not exist.
 */
function InventoryGetItemProperty(Item, PropertyName, CheckGroup=false) {
	/** @type {(ItemProperties & Asset & AssetGroup)[Name] | undefined} */
	let value = undefined;

	// @ts-expect-error Transparently return an empty array, which confuses TS
	if (PropertiesArrayLike.has(PropertyName)) value = [];
	// @ts-expect-error Transparently return an empty object, which confuses TS
	else if (PropertiesObjectLike.has(PropertyName)) value = {};

	if (!Item || !PropertyName || !Item.Asset) return value;
	const PropertyRecords = /** @type {(ItemProperties & Asset & AssetGroup)[]} */(
		[Item.Property || {}, Item.Asset, (CheckGroup) ? Item.Asset.Group : {}]
	);

	for (const record of PropertyRecords) {
		// If the collected property doesn't exist, or is set to null, fall-through so
		// we return the type-appropriate default
		if (record[PropertyName] !== undefined && record[PropertyName] !== null) {
			return record[PropertyName];
		}
	}
	return value;
}

/**
 * Apply an item's expression trigger to a character if able
 * @param {Character} C - The character to update
 * @param {readonly ExpressionTrigger[]} expressions - The expression change to apply to each group
 */
function InventoryExpressionTriggerApply(C, expressions) {
	// NPCs and simple character usually lack `OnlineSharedSettings.ItemsAffectExpressions` unless explicitly added
	let expressionsAllowed = C.OnlineSharedSettings && C.OnlineSharedSettings.ItemsAffectExpressions;
	if (expressionsAllowed === undefined) {
		expressionsAllowed = true;
	}

	if (expressionsAllowed) {
		expressions.forEach(expression => {
			const targetGroupItem = InventoryGet(C, expression.Group);
			if (!targetGroupItem || !targetGroupItem.Property || !targetGroupItem.Property.Expression) {
				CharacterSetFacialExpression(C, expression.Group, expression.Name, expression.Timer);
			}
		});
	}
}

/**
 * Returns the padlock item that locks another item
 * @param {Item} item - The item from appearance that must be scanned
 * @returns {Item|null} - A padlock item or NULL if none
 */
function InventoryGetLock(item) {
	if (!item?.Property?.LockedBy) return null;
	const asset = Asset.find(a => a.IsLock && a.Name === item.Property?.LockedBy);
	if (!asset) return null;
	return AppearanceItem.fromAsset(asset);
}

/**
 * Returns TRUE if the item has an OwnerOnly flag, such as the owner padlock
 * @param {Item} Item - The item from appearance that must be scanned
 * @returns {boolean} - TRUE if owner only
 */
function InventoryOwnerOnlyItem(Item) {
	if (!Item) return false;
	if (Item.Asset.OwnerOnly) return true;
	if (Item.Asset.Group.Category !== "Item") return false;

	const Lock = InventoryGetLock(Item);
	return Lock?.Asset.OwnerOnly ?? false;
}

/**
 * Returns TRUE if the item has a LoverOnly flag, such as the lover padlock
 * @param {Item} Item - The item from appearance that must be scanned
 * @returns {boolean} - TRUE if lover only
 */
function InventoryLoverOnlyItem(Item) {
	if (Item == null) return false;
	if (Item.Asset.LoverOnly) return true;
	if (Item.Asset.Group.Category !== "Item") return false;

	const Lock = InventoryGetLock(Item);
	return Lock?.Asset.LoverOnly ?? false;
}

/**
 * Returns TRUE if the item has a FamilyOnly flag, such as the D/s family padlock
 * @param {Item} Item - The item from appearance that must be scanned
 * @returns {boolean} - TRUE if family only
 */
function InventoryFamilyOnlyItem(Item) {
	if (Item == null) return false;
	if (Item.Asset.FamilyOnly) return true;
	if (Item.Asset.Group.Category !== "Item") return false;

	const Lock = InventoryGetLock(Item);
	return Lock?.Asset.FamilyOnly ?? false;
}

/**
 * Returns TRUE if the character is wearing at least one restraint that's locked with an extra lock
 * @param {Character} C - The character to scan
 * @returns {boolean} - TRUE if one restraint with an extra lock is found
 */
function InventoryCharacterHasLockedRestraint(C) {
	return C.Appearance.some(item => item.Asset.IsRestraint && InventoryGetLock(item));
}

/**
 *
 * @param {Character} C - The character to scan
 * @param {AssetLockType} LockName - The type of lock to check for
 * @returns {boolean} - Returns TRUE if any item has the specified lock locked onto it
 */
function InventoryCharacterIsWearingLock(C, LockName) {
	return C.Appearance.some(item => item.Property?.LockedBy === LockName);
}

/**
 * Returns TRUE if the character is wearing at least one item that's a restraint with a OwnerOnly flag, such as the
 * owner padlock
 * @param {Character} C - The character to scan
 * @returns {boolean} - TRUE if one owner only restraint is found
 */
function InventoryCharacterHasOwnerOnlyRestraint(C) {
	if (!C.IsOwned()) return false;
	return C.Appearance.some(item => item.Asset.IsRestraint && InventoryOwnerOnlyItem(item));
}

/**
 * Returns TRUE if the character is wearing at least one item that's a restraint with a LoverOnly flag, such as the
 * lover padlock
 * @param {Character} C - The character to scan
 * @returns {boolean} - TRUE if one lover only restraint is found
 */
function InventoryCharacterHasLoverOnlyRestraint(C) {
	if (C.GetLoversNumbers().length == 0) return false;
	return C.Appearance.some(item => item.Asset.IsRestraint && InventoryLoverOnlyItem(item));
}

/**
 * Returns TRUE if the character is wearing at least one item that's a restraint with a FamilyOnly flag
 * @param {Character} C - The character to scan
 * @returns {boolean} - TRUE if one family only restraint is found
 */
function InventoryCharacterHasFamilyOnlyRestraint(C) {
	return C.Appearance.some(item => item.Asset.IsRestraint && InventoryFamilyOnlyItem(item));
}

/**
 * Returns TRUE if at least one item on the character can be locked
 * @param {Character} C - The character to scan
 * @returns {boolean} - TRUE if at least one item can be locked
 */
function InventoryHasLockableItems(C) {
	return C.Appearance.some((item) => InventoryDoesItemAllowLock(item) && InventoryGetLock(item) == null);
}

/**
 * Determines whether an item in its current state permits locks.
 * @param {Item} item - The item to check
 * @returns {boolean} - TRUE if the asset's current type permits locks
 */
function InventoryDoesItemAllowLock(item) {
	const asset = item.Asset;
	const typeRecord = item.Property && item.Property.TypeRecord;
	const allowLockType = asset.AllowLockType;
	if (allowLockType && CommonIsObject(typeRecord)) {
		const entries = Object.entries(typeRecord);
		return entries.some(([k, i]) => allowLockType[k]?.has(i));
	} else {
		return asset.AllowLock;
	}
}

/**
 * Applies a lock to an appearance item of a character
 * @param {Character} C - The character on which the lock must be applied
 * @param {Item|AssetGroupName|null} ItemOrGroupName - The item from appearance to lock
 * @param {Item|AssetLockType} LockOrLockType - The asset of the lock or the name of the lock asset
 * @param {null|Character|string} [AppliedBy] - The character applying the lock, or message to show
 * @param {boolean} [Update] - Whether or not to update the character
 */
function InventoryLock(C, ItemOrGroupName, LockOrLockType, AppliedBy = null, Update = true) {
	/** @type {Item | null} */
	let item;
	/** @type {Item | null} */
	let Lock = null;
	if (typeof ItemOrGroupName === 'string') {
		item = InventoryGet(C, ItemOrGroupName);
	} else {
		item = ItemOrGroupName;
	}
	if (typeof LockOrLockType === 'string') {
		const lock = AssetGet(C.AssetFamily, "ItemMisc", LockOrLockType);
		if (lock) {
			Lock = AppearanceItem.fromAsset(lock);
		}
	} else {
		Lock = LockOrLockType;
	}
	if (!item || !Lock || !Lock.Asset || !Lock.Asset.IsLock || !InventoryDoesItemAllowLock(item)) return;

	// Protect against using the PortalLink lock on incompatible items
	if (Lock.Asset.Name === "PortalLinkPadlock" && !InventoryGetItemProperty(item, "Attribute")?.includes("PortalLinkLockable"))
		return;

	if (item.Property == null) item.Property = {};
	if (item.Property.Effect == null) item.Property.Effect = [];
	if (item.Property.Effect.indexOf("Lock") < 0) item.Property.Effect.push("Lock");

	item.Property.LockedBy = /** @type {AssetLockType} */(Lock.Asset.Name);

	if (typeof AppliedBy === "string") {
		item.Property.LockMessage = AppliedBy;
	} else {
		/** @type {Character | undefined} */
		let char;
		if (CommonIsInteger(AppliedBy)) {
			char = Character.find(c => c.MemberNumber === AppliedBy);
		} else if (CommonIsCharacter(AppliedBy)) {
			char = AppliedBy;
		}
		if (char?.IsNpc()) {
			item.Property.LockMemberNumber = -1;
			item.Property.LockMemberName = `${char.Title ? char.Title + " " : ""}${char.Name}`;
		} else if (char?.IsOnline() || char?.IsPlayer()) {
			item.Property.LockMemberNumber = char.MemberNumber;
			item.Property.LockMemberName = char.Name;
		}
	}

	/** @type {Parameters<ExtendedItemCallbacks.Init>} */
	const args = [C, item, false, false];
	CommonCallFunctionByName(`Inventory${Lock.Asset.Group.Name}${Lock.Asset.Name}Init`, ...args);
	if (Update) {
		if (Lock.Asset.RemoveTimer > 0) TimerInventoryRemoveSet(C, item.Asset.Group.Name, Lock.Asset.RemoveTimer);
		CharacterRefresh(C, true, false);
	}
}

/**
 * Unlocks an item and removes all related properties
 * @param {Character} C - The character on which the item must be unlocked
 * @param {Item|AssetGroupItemName} ItemOrGroupName - The item from appearance to unlock
 * @param {boolean} [refreshDialog] - Refreshes the character dialog
 */
function InventoryUnlock(C, ItemOrGroupName, refreshDialog=true) {
	/** @type {Item | null} */
	let Item;
	if (typeof ItemOrGroupName === 'string') {
		Item = InventoryGet(C, ItemOrGroupName);
	} else {
		Item = ItemOrGroupName;
	}
	if (Item && Item.Property && Item.Property.Effect) {
		ValidationDeleteLock(Item.Property, false);
		CharacterRefresh(C, true, refreshDialog);
	}
}

/**
 * Applies a random lock on an item
 * @param {Character} C - The character on which the item must be locked
 * @param {Item} item - The item from appearance to lock
 * @param {Character} AppliedBy - Set to TRUE if the source is the owner, to apply owner locks
 */
function InventoryLockRandom(C, item, AppliedBy) {
	if (!InventoryDoesItemAllowLock(item)) return false;

	const locks = Asset.filter(a => a.IsLock && a.Random && !a.LoverOnly && !a.FamilyOnly && (AppliedBy.IsOwner() || !a.OwnerOnly));
	const randomLock = InventoryGetRandom(C, undefined, locks);
	if (!randomLock) return false;
	InventoryLock(C, item, AppearanceItem.fromAsset(randomLock), AppliedBy);
}

/**
 * Applies random locks on each character items that can be locked
 * @param {Character} C - The character on which the items must be locked
 * @param {Character} AppliedBy - The character applying the lock
 */
function InventoryFullLockRandom(C, AppliedBy) {
	for (const item of C.Appearance) {
		if (InventoryGetLock(item)) continue;
		InventoryLockRandom(C, item, AppliedBy);
	}
}

/**
 * Applies a specific lock on each character items that can be locked
 * @param {Character} C - The character on which the items must be locked
 * @param {AssetLockType} LockType - The lock type to apply
 * @param {Character} [AppliedBy] - The character applying the lock
 */
function InventoryFullLock(C, LockType, AppliedBy) {
	for (const item of C.Appearance) {
		if (!InventoryDoesItemAllowLock(item)) continue;
		InventoryLock(C, item, LockType, AppliedBy, false);
	}
	CharacterRefresh(C);
	ChatRoomCharacterUpdate(C);
}

/**
 * Removes all common keys from the player inventory
 */
function InventoryConfiscateKey() {
	InventoryDelete(Player, "MetalCuffsKey", "ItemMisc");
	InventoryDelete(Player, "MetalPadlockKey", "ItemMisc");
	InventoryDelete(Player, "Lockpicks", "ItemMisc");
}

/**
 * Removes the remotes of the vibrators from the player inventory
 */
function InventoryConfiscateRemote() {
	InventoryDelete(Player, "VibratorRemote", "ItemVulva");
	InventoryDelete(Player, "VibratorRemote", "ItemNipples");
	InventoryDelete(Player, "LoversVibratorRemote", "ItemVulva");
	InventoryDelete(Player, "VibeRemote", "ItemHandheld");
}

/**
 * Returns TRUE if character wears any of the requested items in the given group
 * @param {Character} C - The character to scan
 * @param {AssetGroupName} group - The asset group name to scan
 * @param {"None" | AssetName | readonly (AssetName | "None")[]} assetName - The asset / item names to scan. `null` means none is worn. Multiple names means any of them.
 * @returns {boolean} - TRUE if item is worn
 */
function InventoryIsWorn(C, group, assetName) {
	if (AssetGroupGet("Female3DCG", group)) {
		// our group is a group, yay
	} else if (AssetGroupGet("Female3DCG", /** @type {AssetGroupName} */ (assetName))) {
		// Backward compatibility: our group isn't a group, flip everything
		[group, assetName] = [/** @type {AssetGroupName} */ (assetName), /** @type {AssetName} */(group)];
	} else {
		return false;
	}
	if (!C) return false;
	const names = !Array.isArray(assetName) ? [assetName] : assetName;
	const allowsNone = names.includes("None");
	const wearsAny = C.Appearance.some(i => i.Asset.Group.Name === group && names.some(a => i.Asset.Name === a));
	return wearsAny || allowsNone && !C.Appearance.some(i => i.Asset.Group.Name === group);
}

/**
 * Set the item's permission to a specific value for the player.
 * @param {AssetGroupName} groupName
 * @param {AssetName} assetName
 * @param {ItemPermissionMode} permissionType
 * @param {null | string} type - The relevant extended item option identifier of the item (if any)
 * @param {boolean} push - Whether to push the permission changes to the server
 * @returns {void} - Nothing
 */
function InventorySetPermission(groupName, assetName, permissionType, type=null, push=false) {
	let update = false;
	const itemPermissions = Player.PermissionItems[`${groupName}/${assetName}`] ??= PreferencePermissionGetDefault();
	if (type == null) {
		update = itemPermissions.Permission !== permissionType;
		itemPermissions.Permission = permissionType;
	} else {
		update = itemPermissions.TypePermissions[type] !== permissionType;
		itemPermissions.TypePermissions[type] = permissionType;
	}

	if (push && update) {
		ServerPlayerBlockItemsSync();
	}
}

/**
 * Toggles an item's permission for the player
 * @param {Item} Item - Appearance item to toggle
 * @param {string|null} [Type] - The relevant extended item option identifier of the item (if any)
 * @param {boolean} [Worn] - True if the player is changing permissions for an item they're wearing or if it's the first option
 * @param {boolean} push - Whether to push the permission changes to the server
 * @returns {ItemPermissionMode} - The new item permission
 */
function InventoryTogglePermission(Item, Type=null, Worn=false, push=true) {
	const onExtreme = Player.GetDifficulty() >= 3;
	const blockAllowed = !Worn && !onExtreme;
	const limitedAllowed = !Worn && (!onExtreme || MainHallStrongLocks.includes(/** @type {AssetLockType} */(Item.Asset.Name)));

	const assetName = Item.Asset.Name;
	const groupName = Item.Asset.Group.Name;
	const key = /** @type {const} */(`${groupName}/${assetName}`);
	const permission = (Type ? Player.PermissionItems[key]?.TypePermissions[Type] : Player.PermissionItems[key]?.Permission) ?? "Default";
	switch (permission) {
		case "Default":
			InventorySetPermission(groupName, assetName, "Favorite", Type, push);
			return "Favorite";
		case "Favorite":
			if (blockAllowed) {
				InventorySetPermission(groupName, assetName, "Block", Type, push);
				return "Block";
			} else if (limitedAllowed) {
				InventorySetPermission(groupName, assetName, "Limited", Type, push);
				return "Limited";
			} else {
				InventorySetPermission(groupName, assetName, "Default", Type, push);
				return "Default";
			}
		case "Block":
			if (limitedAllowed) {
				InventorySetPermission(groupName, assetName, "Limited", Type, push);
				return "Limited";
			} else {
				InventorySetPermission(groupName, assetName, "Default", Type, push);
				return "Default";
			}
		case "Limited":
			InventorySetPermission(groupName, assetName, "Default", Type, push);
			return "Default";
	}
}

/**
 * Returns TRUE if a specific item / asset is blocked by the character item permissions
 * @param {Character} C - The character on which we check the permissions
 * @param {AssetName} AssetName - The asset / item name to scan
 * @param {AssetGroupName} AssetGroup - The asset group name to scan
 * @param {string | null} [AssetType] - The asset type to scan
 * @returns {boolean} - TRUE if asset / item is blocked
 */
function InventoryIsPermissionBlocked(C, AssetName, AssetGroup, AssetType) {
	if (!AssetType) {
		return C.PermissionItems[`${AssetGroup}/${AssetName}`]?.Permission === "Block";
	} else {
		return C.PermissionItems[`${AssetGroup}/${AssetName}`]?.TypePermissions?.[AssetType] === "Block";
	}
}


/**
 * Returns TRUE if a specific item / asset is favorited by the character item permissions
 * @param {Character} C - The character on which we check the permissions
 * @param {AssetName} AssetName - The asset / item name to scan
 * @param {AssetGroupName} AssetGroup - The asset group name to scan
 * @param {string | null} [AssetType] - The asset type to scan
 * @returns {boolean} - TRUE if asset / item is a favorite
 */
function InventoryIsFavorite(C, AssetName, AssetGroup, AssetType) {
	if (!AssetType) {
		return C.PermissionItems[`${AssetGroup}/${AssetName}`]?.Permission === "Favorite";
	} else {
		return C.PermissionItems[`${AssetGroup}/${AssetName}`]?.TypePermissions?.[AssetType] === "Favorite";
	}
}

/**
 * Returns TRUE if a specific item / asset is limited by the character item permissions
 * @param {Character} C - The character on which we check the permissions
 * @param {AssetName} AssetName - The asset / item name to scan
 * @param {AssetGroupName} AssetGroup - The asset group name to scan
 * @param {string | null} [AssetType] - The asset type to scan
 * @returns {boolean} - TRUE if asset / item is limited
 */
function InventoryIsPermissionLimited(C, AssetName, AssetGroup, AssetType) {
	if (!AssetType) {
		return C.PermissionItems[`${AssetGroup}/${AssetName}`]?.Permission === "Limited";
	} else {
		return C.PermissionItems[`${AssetGroup}/${AssetName}`]?.TypePermissions?.[AssetType] === "Limited";
	}
}

/**
 * Returns TRUE if the item is not limited, if the player is an owner or a lover of the character, or on their whitelist
 * @param {Character} C - The character on which we check the limited permissions for the item
 * @param {Item} Item - The item being interacted with
 * @param {string | null} [ItemType] - The asset type to scan
 * @returns {boolean} - TRUE if item is allowed
 */
function InventoryCheckLimitedPermission(C, Item, ItemType) {
	if (!InventoryIsPermissionLimited(C, Item.Asset.DynamicName(Player), Item.Asset.Group.Name, ItemType)) return true;
	if ((C.IsPlayer()) || C.IsLoverOfPlayer() || C.IsOwnedByPlayer()) return true;
	if ((C.AllowedInteractions < AllowedInteractions.OwnerLoversWhitelistOnly) && C.HasOnWhitelist(Player)) return true;
	return false;
}

/**
 * Returns TRUE if a specific item / asset is blocked or limited for the player by the character item permissions
 * @param {Character} C - The character on which we check the permissions
 * @param {Item} Item - The item being interacted with
 * @param {string | undefined | null} [ItemType] - The asset type to scan
 * @returns {boolean} - Returns TRUE if the item cannot be used
 */
function InventoryBlockedOrLimited(C, Item, ItemType) {
	const Blocked = InventoryIsPermissionBlocked(C, Item.Asset.DynamicName(Player), Item.Asset.Group.Name, ItemType);
	const Limited = !InventoryCheckLimitedPermission(C, Item, ItemType);
	return Blocked || Limited;
}

/**
 * Determines whether a given item is an allowed limited item for the player (i.e. has limited permissions, but can be
 * used by the player)
 * @param {Character} C - The character whose permissions to check
 * @param {Item} item - The item to check
 * @param {string | undefined | null} [type] - the item type to check
 * @returns {boolean} - Returns TRUE if the given item & type is limited but allowed for the player
 */
function InventoryIsAllowedLimited(C, item, type) {
	return !InventoryBlockedOrLimited(C, item, type) &&
		InventoryIsPermissionLimited(C, item.Asset.Name, item.Asset.Group.Name, type);
}

/**
 * Returns TRUE if the item is a key, having the effect of unlocking other items
 * @param {Item} Item - The item to validate
 * @returns {boolean} - TRUE if item is a key
 */
function InventoryIsKey(Item) {
	if ((Item == null) || (Item.Asset == null) || (Item.Asset.Effect == null)) return false;
	for (let E = 0; E < Item.Asset.Effect.length; E++)
		if (Item.Asset.Effect[E].startsWith("Unlock"))
			return true;
	return false;
}

/**
 * Serialises the provided character's inventory into a string for easy comparisons, inventory items are uniquely
 * identified by their name and group
 * @param {PlayerCharacter} C - The character whose inventory we should serialise
 * @returns {string} - A simple string representation of the character's inventory
 */
function InventoryStringify(C) {
	if (!C || !Array.isArray(C.Inventory)) return "";
	return C.Inventory.map(({ Name, Group }) => Group + Name ).join();
}

/**
 * Returns TRUE if all of the asset categories are allowed in the current chat room
 * @param {(readonly AssetCategory[]) | undefined} Category - An array of string containing all the categories to validate
 * @returns {boolean} - TRUE if it's allowed
 */
function InventoryChatRoomAllow(Category) {
	if (CurrentScreen !== "ChatRoom" || !ChatRoomData || !Category) return true;
	return !ChatRoomData.BlockCategory.some(c => (Category ?? []).some(t => c === t));
}

/**
 * Applies a preset expression from being shocked to the character if able
 * @param {Character} C - The character to update
 * @returns {void} - Nothing
 */
function InventoryShockExpression(C) {
	/** @type {ExpressionTrigger[]} */
	const expressions = [
		{ Group: "Eyebrows", Name: "Soft", Timer: 10 },
		{ Group: "Blush", Name: "Medium", Timer: 15 },
		{ Group: "Eyes", Name: "Closed", Timer: 5 },
	];
	InventoryExpressionTriggerApply(C, expressions);
}

/**
 * Extracts all lock-related properties from an item's property object
 * @param {ItemProperties} property - The property object to extract from
 * @returns {ItemProperties} - A property object containing only the lock-related properties from the provided property
 * object
 * @deprecated
 */
function InventoryExtractLockProperties(property) {
	/** @type {ItemProperties} */
	const lockProperties = {};
	for (const key of CommonKeys(property)) {
		if (ValidationAllLockProperties.includes(key)) {
			/** @type {Unknown<ItemProperties>} */(lockProperties)[key] = CommonCloneDeep(property[key]);
		}
	}
	return lockProperties;
}

/**
 * Check whether the passed inventory icon belongs to a padlock
 * @param {InventoryIcon} icon
 * @returns {icon is AssetLockType}
 */
function InventoryIconIsPadlock(icon) {
	return icon.endsWith("Padlock");
}
