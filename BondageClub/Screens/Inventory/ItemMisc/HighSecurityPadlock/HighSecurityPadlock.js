"use strict";

var InventoryItemMiscHighSecurityPadlockPlayerCanUnlock = true;
var HighSecurityPadlockConfigOwner = true;
var HighSecurityPadlockConfigLover = true;
var HighSecurityPadlockConfigWhitelist = false;

/** @type {ExtendedItemScriptHookCallbacks.Init<NoArchItemData>} */
function InventoryItemMiscHighSecurityPadlockInitHook({ asset }, originalFunction, C, item, push, refresh) {
	if (!CommonIsObject(item.Property)) {
		item.Property = {};
	}

	if (item.Property.LockMemberNumber && !item.Property.MemberNumberListKeys) {
		item.Property.MemberNumberListKeys = item.Property.LockMemberNumber.toString();
	} else {
		return (originalFunction == null) ? false : originalFunction(C, item, push, refresh);
	}

	originalFunction(C, item, false, false);
	if (refresh) CharacterRefresh(C, push, false);
	if (push) ChatRoomCharacterItemUpdate(C, asset.Group.Name);
	return true;
}

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemMiscHighSecurityPadlockLoadHook(data, originalFunction) {
	originalFunction();
	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!C || !C.FocusGroup || !lockItem || !item) return;
	InventoryItemMiscHighSecurityPadlockPlayerCanUnlock = true;

	// Only create the inputs if the zone isn't blocked
	if (!InventoryGroupIsBlocked(C, C.FocusGroup.Name)) {
		if (item != null && ((item.Property?.MemberNumberListKeys && CommonConvertStringToArray("" + item.Property.MemberNumberListKeys).indexOf(Player.MemberNumber) >= 0))) {
			if (!((document.getElementById("MemberNumberList") != null) && ElementValue("MemberNumberList") && ElementValue("MemberNumberList").length > 1)) { // Only update if there isnt text already..
				ElementCreateTextArea("MemberNumberList");
				document.getElementById("MemberNumberList")?.setAttribute("maxLength", 250);
				document.getElementById("MemberNumberList")?.setAttribute("autocomplete", "off");
				ElementValue("MemberNumberList", item.Property.MemberNumberListKeys);
			}

			if (!InventoryItemMiscHighSecurityPadlockPlayerHasKeys(C, lockItem)) {
				InventoryItemMiscHighSecurityPadlockPlayerCanUnlock = false;
			}
		}
	}
}

// FIXME: should be merged into either DialogHasKey or DialogCanUnlock
/**
 * @param {Character} C
 * @param {Item} item
 * @returns {boolean}
 */
function InventoryItemMiscHighSecurityPadlockPlayerHasKeys(C, item) {
	if (LogQuery("KeyDeposit", "Cell")) return false;
	let UnlockName = /** @type {const} */(`Unlock${item.Asset.Name}`);
	if ((item != null) && (item.Property != null) && (item.Property.LockedBy != null)) UnlockName = `Unlock${item.Property.LockedBy}`;

	const key = Asset.find(a => InventoryItemHasEffect(AppearanceItem.fromAsset(a), /** @type {EffectName} */ (UnlockName)));
	if (key && InventoryAvailable(Player, key.Name, key.Group.Name)) {
		const Lock = InventoryGetLock(item);
		if (Lock != null) {
			if (Lock.Asset.LoverOnly && !C.IsLoverOfPlayer()) return false;
			if (Lock.Asset.OwnerOnly && !C.IsOwnedByPlayer()) return false;
			if (Lock.Asset.FamilyOnly && !C.IsFamilyOfPlayer()) return false;
			return true;
		} else {
			return true;
		}
	}
	return true;
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemMiscHighSecurityPadlockDrawHook(data, originalFunction) {
	originalFunction();

	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!C || !C.FocusGroup || !item || !lockItem) {
		return;
	}

	if (typeof item.Property?.LockMemberNumber === "number")
		DrawText(InterfaceTextGet("LockMemberNumber") + " " + item.Property.LockMemberNumber.toString(), 1500, 650, "white", "gray");

	if (!InventoryGroupIsBlocked(C, C.FocusGroup.Name) && CommonConvertStringToArray(item.Property?.MemberNumberListKeys ?? "").includes(Player.MemberNumber)) {
		DrawText(AssetTextGet("HighSecuritySaveIntro"), 1500, 600, "white", "gray");
		ElementPosition("MemberNumberList", 1260, 780, 300, 170);
		DrawButton(1135, 920, 230, 64, AssetTextGet("HighSecuritySave"), "White", "");

		MainCanvas.textAlign = "left";
		DrawCheckbox(1450, 700, 64, 64, AssetTextGet("HighSecurityAppendOwner"), HighSecurityPadlockConfigOwner, false, "White");
		DrawCheckbox(1450, 780, 64, 64, AssetTextGet("HighSecurityAppendLover"), HighSecurityPadlockConfigLover, false, "White");
		DrawCheckbox(1450, 860, 64, 64, AssetTextGet("HighSecurityAppendWhitelist"), HighSecurityPadlockConfigWhitelist, false, "White");
		MainCanvas.textAlign = "center";


		if (!InventoryItemMiscHighSecurityPadlockPlayerCanUnlock) {
			DrawText(AssetTextGet("HighSecurityWarning"), 1500, 550, "red", "gray");
		}
	} else {
		DrawText(AssetTextGet(lockItem.Asset.Group.Name + lockItem.Asset.Name + "Intro"), 1500, 600, "white", "gray");
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemMiscHighSecurityPadlockClickHook(data, originalFunction) {
	originalFunction();

	const C = CharacterGetCurrent();
	const item = DialogFocusSourceItem;
	const lockItem = DialogFocusItem;
	if (!C || !C.FocusGroup || !item || !lockItem) {
		return;
	}
	if (!InventoryGroupIsBlocked(C, C.FocusGroup.Name) && CommonConvertStringToArray(item.Property?.MemberNumberListKeys ?? "").includes(Player.MemberNumber)) {
		if (MouseIn(1135, 920, 230, 64)) {
			let list = new Set(CommonConvertStringToArray("" + ElementValue("MemberNumberList").trim()));
			if (!InventoryItemMiscHighSecurityPadlockPlayerCanUnlock && list.has(Player.MemberNumber)) {
				list.delete(Player.MemberNumber);
			}

			if (HighSecurityPadlockConfigOwner && Player.IsOwned() == "online") {
				list.add(Player.OwnerNumber());
			}
			if (HighSecurityPadlockConfigLover) {
				Player.GetLoversNumbers(true).forEach(n => list.add(n));
			}
			if (HighSecurityPadlockConfigWhitelist) {
				Player.WhiteList.forEach(n => list.add(n));
			}

			// Convert to array and back; can only save strings on server
			item.Property ??= {};
			item.Property.MemberNumberListKeys = [...list.values()].join(",");
			ElementValue("MemberNumberList", item.Property.MemberNumberListKeys);

			if (ServerPlayerIsInChatRoom()) {
				const Dictionary = new DictionaryBuilder()
					.sourceCharacter(Player)
					.destinationCharacter(C)
					.focusGroup(C.FocusGroup.Name)
					.build();
				ChatRoomPublishCustomAction("HighSecurityUpdate", true, Dictionary);
			}
			else {
				CharacterRefresh(C);
				DialogLeaveFocusItem();
			}
			return;
		}
		if (MouseIn(1450, 700, 64, 64)) {HighSecurityPadlockConfigOwner = !HighSecurityPadlockConfigOwner; return;}
		if (MouseIn(1450, 780, 64, 64)) {HighSecurityPadlockConfigLover = !HighSecurityPadlockConfigLover; return;}
		if (MouseIn(1450, 860, 64, 64)) {HighSecurityPadlockConfigWhitelist = !HighSecurityPadlockConfigWhitelist; return;}
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<NoArchItemData>} */
function InventoryItemMiscHighSecurityPadlockExitHook(data, originalFunction) {
	if (originalFunction) originalFunction();
	ElementRemove("MemberNumberList");
}
