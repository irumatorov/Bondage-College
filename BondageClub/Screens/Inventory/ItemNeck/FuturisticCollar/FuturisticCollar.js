"use strict";


var FuturisticCollarPage = 0;
var FuturisticCollarMaxPage = 2;

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemNeckFuturisticCollarLoadHook(data, originalFunction) {
	if (!FuturisticAccessLoad(data, originalFunction)) {
		return;
	}

	ElementCreateInput("FutureCollarPasswordField", "text", "", "8");
	ElementCreateInput("FutureCollarTimeField", "text", "", "4");
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemNeckFuturisticCollarDrawHook(data, originalFunction) {
	if (!FuturisticAccessDraw(data, originalFunction)) {
		return;
	}

	const C = CharacterGetCurrent();
	if (!C) return;
	const item = DialogFocusItem;
	if (!item) return;
	item.Property ??= {};
	if (FuturisticCollarPage == 0) {
		if ((item.Property.LockedBy && !DialogCanUnlock(C, item))) {
			DrawText(AssetTextGet("FuturisticCollarOptionsLockout"), 1500, 375, "White", "Gray");
		}


		MainCanvas.textAlign = "left";
		DrawButton(1125, 395, 64, 64, "", "White", item.Property.OpenPermission ? "Icons/Checked.png" : "");
		DrawText(AssetTextGet("FuturisticCollarOpenPermission"), 1200, 425, "White", "Gray");
		DrawButton(1125, 495, 64, 64, "", "White", item.Property.BlockRemotes ? "Icons/Checked.png" : "");
		DrawText(AssetTextGet("FuturisticCollarBlockRemotes"), 1200, 525, "White", "Gray");
		DrawButton(1125, 595, 64, 64, "", "White", item.Property.OpenPermissionChastity ? "Icons/Checked.png" : "");
		DrawText(AssetTextGet("FuturisticCollarOpenPermissionChastity"), 1200, 625, "White", "Gray");
		DrawButton(1125, 695, 64, 64, "", "White", item.Property.OpenPermissionArm ? "Icons/Checked.png" : "");
		DrawText(AssetTextGet("FuturisticCollarOpenPermissionArm"), 1200, 725, "White", "Gray");
		DrawButton(1125, 795, 64, 64, "", "White", item.Property.OpenPermissionLeg ? "Icons/Checked.png" : "");
		DrawText(AssetTextGet("FuturisticCollarOpenPermissionLeg"), 1200, 825, "White", "Gray");

		MainCanvas.textAlign = "center";

		ElementPosition("FutureCollarPasswordField", 3050, 750, 400); // Hide it off the canvas
		ElementPosition("FutureCollarTimeField", 3050, 805, 400);
	} else if (FuturisticCollarPage == 1 || FuturisticCollarPage == 2) {
		var FuturisticCollarStatus = "NoItems";
		var FuturisticCollarItems = InventoryItemNeckFuturisticCollarGetItems(C);
		var FuturisticCollarItemsUnlockable = InventoryItemNeckFuturisticCollarGetItems(C, true);
		var lockedItems = 0;
		for (const futuItem of FuturisticCollarItems) {
			if (InventoryGetLock(futuItem)) {
				lockedItems += 1;
			}
		}
		if (FuturisticCollarItems.length > 0) {
			if (lockedItems == 0) FuturisticCollarStatus = "NoLocks";
			else if (lockedItems < FuturisticCollarItems.length) FuturisticCollarStatus = "PartialLocks";
			else if (lockedItems == FuturisticCollarItems.length) FuturisticCollarStatus = "FullyLocked";
		}

		DrawText(AssetTextGet("FuturisticCollarOptions" + FuturisticCollarStatus), 1500, 380, "White", "Gray");

		if (FuturisticCollarItems.length > 0 && lockedItems < FuturisticCollarItems.length) {
			if (FuturisticCollarPage == 1) {
				DrawButton(1250, 410, 200, 55, AssetTextGet("FuturisticCollarLockMetal"), InventoryItemNeckFuturisticCollarCanLock(C, "MetalPadlock") ? "White" : "Pink");
				DrawButton(1550, 410, 200, 55, AssetTextGet("FuturisticCollarLockExclusive"), InventoryItemNeckFuturisticCollarCanLock(C, "ExclusivePadlock") ? "White" : "Pink");
				DrawButton(1250, 470, 200, 55, AssetTextGet("FuturisticCollarLockIntricate"), InventoryItemNeckFuturisticCollarCanLock(C, "IntricatePadlock") ? "White" : "Pink");
				DrawButton(1550, 470, 200, 55, AssetTextGet("FuturisticCollarLockHighSec"), InventoryItemNeckFuturisticCollarCanLock(C, "HighSecurityPadlock") ? "White" : "Pink");
				DrawButton(1250, 530, 200, 55, AssetTextGet("FuturisticCollarLockTimer"), InventoryItemNeckFuturisticCollarCanLock(C, "TimerPadlock") ? "White" : "Pink");
				DrawButton(1550, 530, 200, 55, AssetTextGet("FuturisticCollarLockMistress"), InventoryItemNeckFuturisticCollarCanLock(C, "MistressPadlock") ? "White" : "Pink");
				DrawButton(1250, 590, 200, 55, AssetTextGet("FuturisticCollarLockLover"), InventoryItemNeckFuturisticCollarCanLock(C, "LoversPadlock") ? "White" : "Pink");
				DrawButton(1550, 590, 200, 55, AssetTextGet("FuturisticCollarLockOwner"), InventoryItemNeckFuturisticCollarCanLock(C, "OwnerPadlock") ? "White" : "Pink");
				DrawButton(1250, 650, 200, 55, AssetTextGet("FuturisticCollarLockPandora"), InventoryItemNeckFuturisticCollarCanLock(C, "PandoraPadlock") ? "White" : "Pink");
				DrawButton(1550, 650, 200, 55, AssetTextGet("FuturisticCollarLockCombination"), InventoryItemNeckFuturisticCollarCanLock(C, "CombinationPadlock") ? "White" : "Pink");
				DrawButton(1250, 710, 200, 55, AssetTextGet("FuturisticCollarLockPassword"), InventoryItemNeckFuturisticCollarCanLock(C, "PasswordPadlock") ? "White" : "Pink");
				DrawButton(1550, 710, 200, 55, AssetTextGet("FuturisticCollarLockSafeword"), InventoryItemNeckFuturisticCollarCanLock(C, "SafewordPadlock") ? "White" : "Pink");

				ElementPosition("FutureCollarTimeField", 3050, 805, 400);
			} else {
				DrawButton(1250, 410, 200, 55, AssetTextGet("FuturisticCollarLockTimerMiss"), InventoryItemNeckFuturisticCollarCanLock(C, "MistressTimerPadlock") ? "White" : "Pink");
				DrawButton(1550, 410, 200, 55, AssetTextGet("FuturisticCollarLockTimerPassword"), InventoryItemNeckFuturisticCollarCanLock(C, "TimerPasswordPadlock") ? "White" : "Pink");
				DrawButton(1250, 470, 200, 55, AssetTextGet("FuturisticCollarLockTimerLovers"), InventoryItemNeckFuturisticCollarCanLock(C, "LoversTimerPadlock") ? "White" : "Pink");
				DrawButton(1550, 470, 200, 55, AssetTextGet("FuturisticCollarLockTimerOwner"), InventoryItemNeckFuturisticCollarCanLock(C, "OwnerTimerPadlock") ? "White" : "Pink");

				DrawText(AssetTextGet("FuturisticCollarTime"), 1250, 710, "White", "Gray");
				ElementPosition("FutureCollarTimeField", 1650, 705, 400);
			}
		} else {
			ElementPosition("FutureCollarTimeField", 3050, 805, 400);
			ElementPosition("FutureCollarPasswordField", 3050, 750, 400); // Hide it off the canvas
		}

		let drawCode = false;
		if (FuturisticCollarItemsUnlockable.length > 0) {
			DrawButton(1400, 850, 200, 55, AssetTextGet("FuturisticCollarUnlock"), "White");
			drawCode = true;
		}
		if (FuturisticCollarItems.length > 0 && !(item.Property.LockedBy && !DialogCanUnlock(C, item))) {
			DrawButton(1400, 910, 200, 55, AssetTextGet("FuturisticCollarColor"), "White");
			drawCode = true;
		}
		if (drawCode) {
			DrawText(AssetTextGet("FuturisticCollarPassword"), 1350, 810, "White", "Gray");
			ElementPosition("FutureCollarPasswordField", 1650, 805, 400);
		} else {
			ElementPosition("FutureCollarPasswordField", 3050, 750, 400); // Hide it off the canvas
		}
	}

	// Draw the back/next button
	const currPage = FuturisticCollarPage + 1;
	const totalPages = FuturisticCollarMaxPage + 1;
	DrawBackNextButton(1675, 240, 300, 90, AssetTextGet("FuturisticCollarPage") + " " + currPage.toString() + " / " + totalPages.toString(), "White", "", () => "", () => "");
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<NoArchItemData>} */
function InventoryItemNeckFuturisticCollarExitHook() {
	ElementRemove("FutureCollarPasswordField");
	ElementRemove("FutureCollarTimeField");
	FuturisticAccessExit();
}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemNeckFuturisticCollarClickHook(data, originalFunction) {
	if (!FuturisticAccessClick(data, originalFunction)) {
		return;
	}

	const C = CharacterGetCurrent();
	if (!C) return;
	const item = DialogFocusItem;
	if (!item) return;
	/**
	 * 0 - nothing, 1 - Lock, 2 - Unlock, 3 - Color
	 * @type {0 | 1 | 2 | 3}
	 */
	let CollarAction = 0;
	const canUnlock = !InventoryItemHasEffect(item, "Lock", true) || DialogCanUnlock(C, item);
	if (FuturisticCollarPage == 0) {
		if (MouseIn(1125, 395, 64, 64) && canUnlock) InventoryItemNeckFuturisticCollarTogglePermission(C, item, "Collar");
		else if (MouseIn(1125, 495, 64, 64) && canUnlock) InventoryItemNeckFuturisticCollarToggleRemotes(C, item);
		else if (MouseIn(1125, 595, 64, 64) && canUnlock) InventoryItemNeckFuturisticCollarTogglePermission(C, item, "Chastity");
		else if (MouseIn(1125, 695, 64, 64) && canUnlock) InventoryItemNeckFuturisticCollarTogglePermission(C, item, "Arm");
		else if (MouseIn(1125, 795, 64, 64) && canUnlock) InventoryItemNeckFuturisticCollarTogglePermission(C, item, "Leg");
	} else if (FuturisticCollarPage == 1 || FuturisticCollarPage == 2) {
		var FuturisticCollarItems = InventoryItemNeckFuturisticCollarGetItems(C);
		var FuturisticCollarItemsUnlockable = InventoryItemNeckFuturisticCollarGetItems(C, true);
		var lockedItems = 0;
		for (const futuItem of FuturisticCollarItems) {
			if (InventoryGetLock(futuItem)) {
				lockedItems += 1;
			}
		}

		if (FuturisticCollarItems.length > 0 ) {
			if (lockedItems < FuturisticCollarItems.length) {
				if (FuturisticCollarPage == 1) {
					     if (MouseIn(1250, 410, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "MetalPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "MetalPadlock"); CollarAction = 1;}
					else if (MouseIn(1550, 410, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "ExclusivePadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "ExclusivePadlock"); CollarAction = 1;}
					else if (MouseIn(1250, 470, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "IntricatePadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "IntricatePadlock"); CollarAction = 1;}
					else if (MouseIn(1550, 470, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "HighSecurityPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "HighSecurityPadlock"); CollarAction = 1;}
					else if (MouseIn(1250, 530, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "TimerPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "TimerPadlock"); CollarAction = 1;}
					else if (MouseIn(1550, 530, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "MistressPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "MistressPadlock"); CollarAction = 1;}
					else if (MouseIn(1250, 590, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "LoversPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "LoversPadlock"); CollarAction = 1;}
					else if (MouseIn(1550, 590, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "OwnerPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "OwnerPadlock"); CollarAction = 1;}
					else if (MouseIn(1250, 650, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "PandoraPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "PandoraPadlock"); CollarAction = 1;}
					else if (MouseIn(1550, 650, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "CombinationPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "CombinationPadlock"); CollarAction = 1;}
					else if (MouseIn(1250, 710, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "PasswordPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "PasswordPadlock"); CollarAction = 1;}
					else if (MouseIn(1550, 710, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "SafewordPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "SafewordPadlock"); CollarAction = 1;}
				} else {
					     if (MouseIn(1250, 410, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "MistressTimerPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "MistressTimerPadlock"); CollarAction = 1;}
					else if (MouseIn(1550, 410, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "TimerPasswordPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "TimerPasswordPadlock"); CollarAction = 1;}
					else if (MouseIn(1250, 470, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "LoversTimerPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "LoversTimerPadlock"); CollarAction = 1;}
					else if (MouseIn(1550, 470, 200, 55) && InventoryItemNeckFuturisticCollarCanLock(C, "OwnerTimerPadlock")) { InventoryItemNeckFuturisticCollarLockdown(C, "OwnerTimerPadlock"); CollarAction = 1;}
				}
			}
		}
		if (MouseIn(1400, 850, 200, 55) && FuturisticCollarItemsUnlockable.length > 0) { InventoryItemNeckFuturisticCollarUnlock(C); CollarAction = 2;}
		if (MouseIn(1400, 910, 200, 55) && FuturisticCollarItems.length > 0 && canUnlock) {
			InventoryItemNeckFuturisticCollarColor(C, item); CollarAction = 3;
		}
	}
	if (CollarAction > 0) DialogLeaveFocusItem();

	// Pagination buttons
	if (MouseIn(1675, 240, 150, 90) && FuturisticCollarPage > 0) {
		FuturisticCollarPage = FuturisticCollarPage - 1;
	}
	else if (MouseIn(1825, 240, 150, 90) && FuturisticCollarPage < FuturisticCollarMaxPage) {
		FuturisticCollarPage = FuturisticCollarPage + 1;
	}
}

/**
 * @param {Character} C
 * @param {AssetLockType} LockType
 * @returns {boolean}
 */
function InventoryItemNeckFuturisticCollarCanLock(C, LockType) {
	// First, we check if the inventory already exists, exit if it's the case
	var LockAsset = InventoryAvailable(Player, LockType, "ItemMisc") ? AssetGet(Player.AssetFamily, "ItemMisc", LockType) : null;

	// Next we check if the target player has it, but not for the mistress, owner, or lover locks
	if (LockAsset == null && LockType != "MistressPadlock" && LockType != "FamilyPadlock" && LockType != "LoversPadlock" && LockType != "OwnerPadlock") {
		LockAsset = InventoryAvailable(C, LockType, "ItemMisc") ? AssetGet(C.AssetFamily, "ItemMisc", LockType) : null;
	}

	if (LockAsset && !(InventoryBlockedOrLimited(C, AppearanceItem.fromAsset(LockAsset)))) {
		// Make sure we do not add owner/lover only items for invalid characters, owner/lover locks can be applied on the player by the player for self-bondage
		if (LockAsset.OwnerOnly && !C.IsOwnedByPlayer())
			if (!C.IsPlayer() || !C.IsOwned() || (C.IsPlayer() && LogQuery("BlockOwnerLockSelf", "OwnerRule")))
				return false;
		if (LockAsset.LoverOnly && !C.IsLoverOfPlayer())
			if ((!C.IsPlayer()) || (C.Lovership.length == 0) || ((C.IsPlayer()) && C.GetLoversNumbers(true).length == 0))
				return false;
		if (LockAsset.FamilyOnly && !C.IsFamilyOfPlayer())
			if (!C.IsPlayer() || !C.IsOwned() || (C.IsPlayer() && LogQuery("BlockOwnerLockSelf", "OwnerRule")))
				return false;

		if (LockAsset.Name == "TimerPasswordPadlock" || LockAsset.Name == "MistressTimerPadlock" || LockAsset.Name == "LoversTimerPadlock" || LockAsset.Name == "OwnerTimerPadlock") {
			if (!(parseInt(ElementValue("FutureCollarTimeField")) > 0)) return false;
		}

		if (LockAsset.Name == "CombinationPadlock" && !ValidationCombinationNumberRegex.test(ElementValue("FutureCollarPasswordField"))) return false;
		if (LockAsset.Name == "TimerPasswordPadlock" && !ValidationPasswordRegex.test(ElementValue("FutureCollarPasswordField").toUpperCase())) return false;
		if (LockAsset.Name == "PasswordPadlock" && !ValidationPasswordRegex.test(ElementValue("FutureCollarPasswordField").toUpperCase())) return false;
		if (LockAsset.Name == "SafewordPadlock" && !ValidationPasswordRegex.test(ElementValue("FutureCollarPasswordField").toUpperCase())) return false;
		return true;
	}
	return false;
}

/**
 * @param {Character} C
 * @param {boolean} [OnlyUnlockable]
 * @returns {Item[]}
 */
function InventoryItemNeckFuturisticCollarGetItems(C, OnlyUnlockable) {
	const items = [];

	for (const item of C.Appearance) {
		if (!InventoryGetItemProperty(item, "Attribute")?.includes("FuturisticLock")) continue;
		if (OnlyUnlockable && item.Asset.Group.Name === "ItemNeck") continue;
		if (!item.Asset.AllowLock) continue;
		if (OnlyUnlockable) {
			const lock = InventoryGetLock(item);
			if (!lock) continue;
			if (!InventoryItemHasEffect(item, "Lock", true)) continue;
			if (!InventoryItemNeckFuturisticCollarCanUnlock(C, item, lock, true)) continue;
		}
		items.push(item);
	}

	return items;
}

/**
 * @param {Character} C
 * @param {AssetLockType} LockType
 */
function InventoryItemNeckFuturisticCollarLockdown(C, LockType) {
	for (const item of [...C.Appearance].reverse()) {
		if (!InventoryGetItemProperty(item, "Attribute")?.includes("FuturisticLock")) continue;
		// Skip if item can't be or is already locked
		if (!item.Asset.AllowLock || InventoryGetLock(item)) continue;
		item.Property ??= {};
		InventoryLock(C, item, LockType, Player, false);
		const LockItem = InventoryGetLock(item);
		if (!LockItem) continue;

		if (LockItem.Asset.Name == "TimerPasswordPadlock" || LockItem.Asset.Name == "MistressTimerPadlock" || LockItem.Asset.Name == "LoversTimerPadlock" || LockItem.Asset.Name == "OwnerTimerPadlock") {
			const timer = CommonParseInt(ElementValue("FutureCollarTimeField"));
			if (timer !== null && timer > 0) {
				item.Property.RemoveItem ??= false;
				item.Property.ShowTimer ??= true;
				item.Property.EnableRandomInput ??= false;
				item.Property.MemberNumberList ??= [];

				const maxTimerMinutes = (C.GetLockTimerLimit() ?? LockItem.Asset.MaxTimer ?? 300) / 60;
				const durationMinutes = Math.max(1, Math.min(maxTimerMinutes, timer));
				item.Property.RemoveTimer = CurrentTime + durationMinutes * MS_PER_MIN;
			}
		}

		if (LockItem.Asset.Name == "CombinationPadlock") {
			item.Property.CombinationNumber = ElementValue("FutureCollarPasswordField");
		} else if (LockItem.Asset.Name == "TimerPasswordPadlock" || LockItem.Asset.Name == "PasswordPadlock" || LockItem.Asset.Name == "SafewordPadlock") {
			item.Property.Password = ElementValue("FutureCollarPasswordField").toUpperCase();
			item.Property.Hint = "~Locked by " + Player.Name;
			item.Property.LockSet = true;
			item.Property.RemoveOnUnlock = LockItem.Asset.Name == "SafewordPadlock";
		}
	}

	ChatRoomCharacterUpdate(C);
	CharacterRefresh(C, true);

	if (ServerPlayerIsInChatRoom()) {
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.destinationCharacterName(C)
			.build();

		ServerSend("ChatRoomChat", { Content: "FuturisticCollarTriggerLockdown", Type: "Action", Dictionary });
	}
}

/**
 * @param {Character} C
 * @param {Item} Item
 * @param {Item} LockItem
 * @param {boolean} Attempt
 * @returns {boolean}
 */
function InventoryItemNeckFuturisticCollarCanUnlock(C, Item, LockItem, Attempt) {
	if (LockItem.Asset.Name == "CombinationPadlock")
		return Attempt || Item.Property?.CombinationNumber == ElementValue("FutureCollarPasswordField");
	if (LockItem.Asset.Name == "TimerPasswordPadlock" || LockItem.Asset.Name == "PasswordPadlock" || LockItem.Asset.Name == "SafewordPadlock")
		return Attempt || Item.Property?.Password == ElementValue("FutureCollarPasswordField").toUpperCase();

	return DialogCanUnlock(C, Item);
}

/**
 * @param {Character} C
 */
function InventoryItemNeckFuturisticCollarUnlock(C) {
	for (const item of C.Appearance) {
		if (!InventoryGetItemProperty(item, "Attribute")?.includes("FuturisticLock")) continue;
		if (item.Asset.Group.Name === "ItemNeck") continue;
		const lock = InventoryGetLock(item);
		if (!lock) continue;
		if (!InventoryItemHasEffect(item, "Lock", true)) continue;
		if (!InventoryItemNeckFuturisticCollarCanUnlock(C, item, lock, false)) continue;
		InventoryUnlock(C, item);
	}

	ChatRoomCharacterUpdate(C);
	CharacterRefresh(C, true);

	if (ServerPlayerIsInChatRoom()) {
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.destinationCharacterName(C)
			.build();

		ServerSend("ChatRoomChat", { Content: "FuturisticCollarTriggerUnlock", Type: "Action", Dictionary });
	}

}

/**
 * @param {Character} C
 * @param {Item} FromItem
 */
function InventoryItemNeckFuturisticCollarColor(C, FromItem) {
	/** @type {readonly BCColor[]} */
	let fromColors;
	if (typeof FromItem.Color === "string") {
		fromColors = Array(FromItem.Asset.ColorableLayerCount).fill(FromItem.Color);
	} else if (CommonIsArray(FromItem.Color)) {
		fromColors = FromItem.Color;
	} else {
		fromColors = FromItem.Asset.DefaultColor;
	}

	for (const item of C.Appearance) {
		const canRecolor = InventoryGetItemProperty(item, "Attribute")?.includes("FuturisticRecolor");
		if (item.Asset && canRecolor && item.Asset.Group.Name != "ItemNeck") {

			/** @type {BCColor[] | null} */
			let colors = null;
			if (item.Asset.Layer.length > 1 && typeof item.Color === "string") {
				let color = item.Color;
				item.Color = [];
				for (let L = item.Asset.Layer.length - 1; L >= 0; L--) {
					item.Color.push(color);
				}
				colors = item.Color;
			} else if (Array.isArray(item.Color)) {
				colors = item.Color;
			} else {
				continue;
			}

			for (let L = item.Asset.Layer.length - 1; L >= 0; L--) {

				const canRecolorDisplay = InventoryGetItemProperty(item, "Attribute")?.includes("FuturisticRecolorDisplay");
				if (item.Asset.Layer[L].Name != "Light" && item.Asset.Layer[L].Name != "Shine") {
					FromItem.Color ??= [];
					if (!item.Asset.Layer[L].Name) {
						if (FromItem.Color[3] != "Default")
							item.Color = Array(item.Asset.ColorableLayerCount).fill(canRecolorDisplay ? fromColors[0] : fromColors[3]);
					} else if (item.Asset.Layer[L].Name == "Lock") {
						if (FromItem.Color[3] != "Default")
							colors[L] = fromColors[3];
					} else if (item.Asset.Layer[L].Name == "Display" || item.Asset.Layer[L].Name == "Screen" || item.Asset.Layer[L].Name == "Ball") {
						if (FromItem.Color[0] != "Default")
							colors[L] = fromColors[0];
					} else if (item.Asset.Layer[L].Name != "Mesh" && item.Asset.Layer[L].Name != "Text") {
						if (FromItem.Color[1] != "Default")
							colors[L] = fromColors[1];
					} else if (item.Asset.Layer[L].Name != "Text") {
						if (FromItem.Color[2] != "Default")
							colors[L] = fromColors[2];
					}
				}
			}
		}
	}

	ChatRoomCharacterUpdate(C);
	CharacterRefresh(C, true);

	if (ServerPlayerIsInChatRoom()) {
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(Player)
			.destinationCharacterName(C)
			.build();

		ServerSend("ChatRoomChat", { Content: "FuturisticCollarTriggerColor", Type: "Action", Dictionary });
	}

}

/**
 * @param {Character} C
 * @param {Item} Item
 * @param {"Leg"|"Arm"|"Chastity"|"Collar"} Permission
 */
function InventoryItemNeckFuturisticCollarTogglePermission(C, Item, Permission) {
	Item.Property ??= {};
	if (typeof Item.Property.OpenPermission !== "boolean") return;

	const mapping = /** @type {const} */ ({
		"Arm": "OpenPermissionArm",
		"Chastity": "OpenPermissionChastity",
		"Collar": "OpenPermission",
		"Leg": "OpenPermissionLeg",
	});
	const property = mapping[Permission];
	if (Item.Property && Item.Property[property] != undefined) {
		Item.Property[property] = !Item.Property[property];

		ChatRoomCharacterUpdate(C);
		CharacterRefresh(C, true);

		if (ServerPlayerIsInChatRoom()) {
			const Message = "FuturisticCollarSetOpenPermission" + Permission + (Item.Property[property] ? "On" : "Off");

			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.destinationCharacterName(C)
				.build();

			ServerSend("ChatRoomChat", { Content: Message, Type: "Action", Dictionary });
		}
	}
}

/**
 * @param {Character} C
 * @param {Item} Item
 */
function InventoryItemNeckFuturisticCollarToggleRemotes(C, Item) {
	Item.Property ??= {};
	if (!DialogFocusItem) return;
	if (Item.Property && Item.Property.BlockRemotes != null) {
		Item.Property.BlockRemotes = !Item.Property.BlockRemotes;

		// Default the previous Property and Type to the first option if not found on the current item
		var PreviousProperty = DialogFocusItem.Property;

		// Create a new Property object based on the previous one
		var NewProperty = { ...PreviousProperty };


		NewProperty.Effect = [];

		// If the item is locked, ensure it has the "Lock" effect
		if (NewProperty.LockedBy && !(NewProperty.Effect || []).includes("Lock")) {
			NewProperty.Effect = (NewProperty.Effect || []);
			NewProperty.Effect.push("Lock");
		}

		// If the item is locked, ensure it has the "Lock" effect
		if (Item.Property.BlockRemotes) {
			NewProperty.Effect = (NewProperty.Effect || []);
			NewProperty.Effect.push("BlockRemotes");
		}

		DialogFocusItem.Property = NewProperty;


		ChatRoomCharacterUpdate(C);
		CharacterRefresh(C, true);

		if (ServerPlayerIsInChatRoom()) {
			const Message = "FuturisticCollarSetBlockRemotes" + (Item.Property.BlockRemotes ? "On" : "Off");

			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.destinationCharacterName(C)
				.build();

			ServerSend("ChatRoomChat", { Content: Message, Type: "Action", Dictionary });
		}
	}
}
