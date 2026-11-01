"use strict";

// How to make your item futuristic!

// In the load function, add this before your load function, without changing functions from the
// futuristic panel gag functions. Just make sure your item loads after the panel gag and not before in index.html:
/*
 	if (!FuturisticAccessLoad(data, originalFunction)) {
		return;
	}
*/

// In the draw function, add:
/*
 	if (!FuturisticAccessDraw(data, originalFunction)) {
		return;
	}
*/

// In the click function, add:
/*
 	if (!FuturisticAccessClick(data, originalFunction)) {
		return;
	}
*/

// In the exit function, add:
/*
	FuturisticAccessExit()
*/

// In the validate function, add:
/*
 	return InventoryItemFuturisticValidate(C, Item)
*/

var FuturisticAccessDeniedMessage = "";

var FuturisticAccessCollarGroups = ["ItemNeck", "ItemNeckAccessories", "ItemEars", "ItemHead", "ItemHood", "ItemMouth", "ItemMouth2", "ItemMouth3", "ItemDevices"];
var FuturisticAccessArmGroups = ["ItemArms", "ItemHands"];
var FuturisticAccessLegGroups = ["ItemLegs", "ItemFeet", "ItemBoots"];
var FuturisticAccessChastityGroups = ["ItemPelvis", "ItemTorso", "ItemButt", "ItemVulva", "ItemVulvaPiercings", "ItemBreast", "ItemNipples", "ItemNipplesPiercings"];

/**
 * Helper function for the futuristic hook scripts.
 * @param {ExtendedItemData<any>} data
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {(data: ExtendedItemData<any>) => void} DeniedFunction - The function that is called when validation fails.
 * @returns {boolean} - Whether the validation was successful or not.
 */
function FuturisticAccess(data, OriginalFunction, DeniedFunction) {
	const C = CharacterGetCurrent();
	if (!C) return false;
	if (InventoryItemFuturisticValidate(C)) {
		DialogExtendedMessage = AssetTextGet("FuturisticItemLoginScreen");
		DeniedFunction(data);
		return false;
	} else {
		if (OriginalFunction != null) {
			OriginalFunction();
		}
		return true;
	}
}

/**
 * Hook script for injecting futuristic features into an archetypical item
 * @param {ExtendedItemData<any>} Data - The extended item data (if any)
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @returns {boolean} - Whether the validation was successful or not.
 */
function FuturisticAccessLoad(Data, OriginalFunction=null) {
	return FuturisticAccess(Data, OriginalFunction, InventoryItemFuturisticLoadAccessDenied);
}

/**
 * Hook script for injecting futuristic features into an archetypical item
 * @param {ExtendedItemData<any>} Data - The extended item data (if any)
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @returns {boolean} - Whether the validation was successful or not.
 */
function FuturisticAccessClick(Data, OriginalFunction=null) {
	return FuturisticAccess(Data, OriginalFunction, InventoryItemFuturisticClickAccessDenied);
}

/**
 * Hook script for injecting futuristic features into an archetypical item
 * @param {ExtendedItemData<any>} Data - The extended item data (if any)
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @returns {boolean} - Whether the validation was successful or not.
 */
function FuturisticAccessDraw(Data, OriginalFunction=null) {
	return FuturisticAccess(Data, OriginalFunction, InventoryItemFuturisticDrawAccessDenied);
}

/**
 * Hook script for injecting futuristic features into an archetypical item
 * @returns {void} - Nothing
 */
function FuturisticAccessExit() {
	ElementRemove("PasswordField");
	FuturisticAccessDeniedMessage = "";
}

/**
 * Hook script for injecting futuristic features into a typed or modular item
 * @type {ExtendedItemScriptHookCallbacks.Validate<ExtendedItemData<any>, any>}
 */
function FuturisticAccessValidate(Data, OriginalFunction, C, Item, Option, CurrentOption, permitExisting) {
	return InventoryItemFuturisticValidate(C, Item, CurrentOption.ChangeWhenLocked) ?? OriginalFunction?.(C, Item, Option, CurrentOption, permitExisting);
}

// Load the futuristic item ACCESS DENIED screen
function InventoryItemFuturisticLoadAccessDenied() {
	const elem = ElementCreateInput("PasswordField", "text", "", "12");
	FuturisticAccessDeniedMessage ??= "";

	const locks = /** @type {const} */(["PasswordPadlock", "TimerPasswordPadlock", "CombinationPadlock"]);
	if (!CommonIncludes(locks, DialogFocusItem?.Property?.LockedBy)) {
		elem.disabled = true;
		elem.placeholder = AssetTextGet("CantChangeWhileLockedFuturistic");
	}
}

/**
 * Draw the futuristic item ACCESS DENIED screen
 * @param {ExtendedItemData<any>} data
 */
function InventoryItemFuturisticDrawAccessDenied(data) {
	NoArch.Draw(data);

	const elem = /** @type {null | HTMLInputElement} */(document.getElementById("PasswordField"));
	const disabled = elem?.disabled ?? true;

	ElementPosition("PasswordField", 1505, 750, 350);
	if (disabled) {
		DrawText(AssetTextGet("FuturisticItemPassword"), 1500, 700, "White", "Gray");
	}
	DrawButton(
		1400, 800, 200, 64, AssetTextGet("FuturisticItemLogIn"),
		disabled ? "Gray" : "White", undefined, undefined, disabled,
	);

	if (FuturisticAccessDeniedMessage && FuturisticAccessDeniedMessage != "") DrawText(FuturisticAccessDeniedMessage, 1500, 963, "Red", "Black");

}

/**
 * Click the futuristic item ACCESS DENIED screen.
 * @param {ExtendedItemData<any>} data
 */
function InventoryItemFuturisticClickAccessDenied(data) {
	if (NoArch.Click(data)) {
		return;
	}
	const C = CharacterGetCurrent();
	if (!C) return;

	if (MouseIn(1400, 800, 200, 64)) {
		const elem = /** @type {HTMLInputElement | null} */(document.getElementById("PasswordField"));
		if (!elem || (elem?.disabled ?? true)) {
			return;
		}

		const pw = elem.value.toUpperCase();
		if (DialogFocusItem && DialogFocusItem.Property && DialogFocusItem.Property.LockedBy == "PasswordPadlock" && pw == DialogFocusItem.Property.Password) {
			CommonPadlockUnlock(C, DialogFocusItem);
			DialogLeaveFocusItem();
		} else if (DialogFocusItem && DialogFocusItem.Property && DialogFocusItem.Property.LockedBy == "TimerPasswordPadlock" && pw == DialogFocusItem.Property.Password) {
			CommonPadlockUnlock(C, DialogFocusItem);
			DialogLeaveFocusItem();
		} else if (DialogFocusItem && DialogFocusItem.Property && DialogFocusItem.Property.LockedBy == "CombinationPadlock" && pw == DialogFocusItem.Property.CombinationNumber) {
			CommonPadlockUnlock(C, DialogFocusItem);
			DialogLeaveFocusItem();
		} else {
			FuturisticAccessDeniedMessage = AssetTextGet("CantChangeWhileLockedFuturistic");
			AudioPlayInstantSound("Audio/AccessDenied.mp3");
			InventoryItemFuturisticPublishAccessDenied(C);
		}
	}
}

/**
 * Validates, if the chosen option is possible. Sets the global variable 'DialogExtendedMessage' to the appropriate error message, if not.
 * @param {Character} C - The character to validate the option
 * @param {Item | null} Item - The equipped item
 * @param {boolean} [changeWhenLocked] - See {@link ExtendedItemOption.ChangeWhenLocked}
 * @returns {string | null} - Returns an explanation for the failed validation if the chosen option is not possible, or null.
 */
function InventoryItemFuturisticValidate(C, Item = DialogFocusItem, changeWhenLocked=false) {
	let Allowed = null;

	/**
	 * TODO: Find a better way for dealing with the crafting preview character rather
	 * than just hard-coding it as an exception here.
	 */
	if (
		Item
		&& Item.Property
		&& Item.Property.LockedBy
		&& !DialogCanUnlock(C, Item)
		&& !changeWhenLocked
		&& (!CraftingPreview || C.ID !== CraftingPreview.ID)
	) {
		const collar = InventoryGet(C, "ItemNeck");
		if (!collar || (!collar.Property ||
			(FuturisticAccessCollarGroups.includes(Item.Asset.Group.Name) && collar.Property.OpenPermission != true) ||
			(FuturisticAccessArmGroups.includes(Item.Asset.Group.Name) && collar.Property.OpenPermissionArm != true) ||
			(FuturisticAccessLegGroups.includes(Item.Asset.Group.Name) && collar.Property.OpenPermissionLeg != true) ||
			(FuturisticAccessChastityGroups.includes(Item.Asset.Group.Name) && collar.Property.OpenPermissionChastity != true))) {
			Allowed = DialogExtendedMessage = AssetTextGet("CantChangeWhileLockedFuturistic");
		}
	}

	return Allowed;
}

/**
 * Publish a chat message for denied access.
 *
 * @param {Character} C - The character that got denied access.
 */
function InventoryItemFuturisticPublishAccessDenied(C) {
	if (!C.FocusGroup) return;
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacter(C)
		.focusGroup(C.FocusGroup.Name)
		.build();
	ChatRoomPublishCustomAction("FuturisticItemLoginLoginAttempt", true, Dictionary);
}
