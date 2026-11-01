"use strict";

/** @type {VoiceTriggerType[]} */
var InventoryItemPelvisModularChastityBeltVoiceTriggers = ["Increase", "Decrease", "Disable", "Inflate", "Deflate", "Empty", "Shock"];
/** @type {string[]} */
var InventoryItemPelvisModularChastityBeltVoiceTriggerValues = [];

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemPelvisModularChastityBeltDrawHook(data, OriginalFunction) {
	OriginalFunction();
	const item = DialogFocusItem;
	if (!item) return;
	//Base screen
	if (data.currentModule === ModularItemBase) {
		InventoryItemPelvisModularChastityBeltDrawBase(item, 75);
	}

	if (data.currentModule === "Intensity") {
		InventoryItemPelvisModularChastityBeltDrawIntensity(item, 75);
	}

	if (data.currentModule === "ShockModule") {
		InventoryItemPelvisModularChastityBeltDrawShockModule(item, 0);
	}

	if (data.currentModule === "VoiceControl") {
		InventoryItemPelvisModularChastityBeltDrawVoiceControl(item, 0);
	} else {
		InventoryItemPelvisModularChastityBeltDrawVoiceControlCleanup();
	}
}

/**
 * @param {Item} item
 * @param {number} _offset - How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltDrawBase(item, _offset) {
	MainCanvas.textAlign = "left";

	DrawText(AssetTextGet("ModularChastityBeltTimeWorn") + ":", 1320, 550 + 0*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltTimeSinceLastOrgasm") + ":", 1320, 550 + 1*75 + _offset, "White", "Gray");

	const opts = { includeYears: true, includeMonths: true, includeDays: true };
	const timeWorn = CommonFormatDurationRange(CommonTime(), item.Property?.TimeWorn ?? 0, opts);
	const timeSinceLastOrgasm = CommonFormatDurationRange(CommonTime(), item.Property?.TimeSinceLastOrgasm ?? 0, opts);

	DrawText(timeWorn, 1655, 550 + 0*75 + _offset, "White", "Gray");
	DrawText(timeSinceLastOrgasm, 1655, 550 + 1*75 + _offset, "White", "Gray");

	MainCanvas.textAlign = "center";
}

/**
 * @param {Item} item
 * @param {number} _offset - How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltDrawIntensity(item, _offset)
{
	// Display option information
	MainCanvas.textAlign = "left";

	DrawText(AssetTextGet("ModularChastityBeltOrgasmCount") + ":", 1515, 550 + 0*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltDenyCount") + ":", 1515, 550 + 1*75 + _offset, "White", "Gray");

	DrawText(`${item.Property?.OrgasmCount}`, 1690, 550 + 0*75 + _offset, "White", "Gray");
	DrawText(`${item.Property?.RuinedOrgasmCount}`, 1690, 550 + 1*75 + _offset, "White", "Gray");

	MainCanvas.textAlign = "center";

	// Display the ShowText checkbox

	// Display the manual button
	ExtendedItemCustomDraw("ModularChastityBeltResetOrgasm", 1260, 550-27 + 0*75 + _offset, null, false, false);
	ExtendedItemCustomDraw("ModularChastityBeltResetDeny", 1260, 550-27 + 1*75 + _offset, null, false, false);
}

/**
 * @param {Item} item
 * @param {number} _offset - How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltDrawShockModule(item, _offset)
{

	// Display option information
	MainCanvas.textAlign = "right";
	DrawText(AssetTextGet("ModularChastityBeltShockCount") + ":", 1650, 550 + 0*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ShowMessageInChat") + ":", 1500, 550 + 1*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltPunishOrgasm") + ":", 1500, 550 + 2*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltPunishTamperSelf") + ":", 1500, 550 + 3*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltPunishTamperOther") + ":", 1500, 550 + 4*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("ModularChastityBeltPunishStanding") + ":", 1500, 550 + 5*75 + _offset, "White", "Gray");

	MainCanvas.textAlign = "left";
	DrawText(`${item.Property?.TriggerCount}`, 1660, 550 + 0*75 + _offset, "White", "Gray");
	MainCanvas.textAlign = "center";

	// Display checkbox
	ExtendedItemDrawCheckbox("ShowText", 1510, 520 + 1*75 + _offset, item.Property?.ShowText ?? false, { changeWhenLocked: false });
	ExtendedItemDrawCheckbox("PunishOrgasm", 1510, 520 + 2*75 + _offset, item.Property?.PunishOrgasm ?? false, { changeWhenLocked: false });
	ExtendedItemDrawCheckbox("PunishStruggle", 1510, 520 + 3*75 + _offset, item.Property?.PunishStruggle ?? false, { changeWhenLocked: false });
	ExtendedItemDrawCheckbox("PunishStruggleOther", 1510, 520 + 4*75 + _offset, item.Property?.PunishStruggleOther ?? false, { changeWhenLocked: false });
	ExtendedItemDrawCheckbox("PunishStandup", 1510, 520 + 5*75 + _offset, item.Property?.PunishStandup ?? false, { changeWhenLocked: false });

	//Draw button
	ExtendedItemCustomDraw("ModularChastityBeltTriggerShock", 1010, 550-27 + 0*75 + _offset, null, false, false);
	ExtendedItemCustomDraw("ModularChastityBeltResetShock", 1260, 550-27 + 0*75 + _offset, null, false, false);
}

/**
 * @param {Item} item
 * @param {number} _offset - How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltDrawVoiceControl(item, _offset)
{
	// PAGE 1
	//Create inputs
	item.Property ??= {};
	if (!item.Property.TriggerValues) item.Property.TriggerValues = InventoryItemPelvisModularChastityBeltVoiceTriggers.join(",");
	InventoryItemPelvisModularChastityBeltVoiceTriggerValues = item.Property.TriggerValues.split(',');
	// Only create the inputs if the zone isn't blocked
	InventoryItemPelvisModularChastityBeltVoiceTriggers.forEach((trigger, i) => {
		const input = ElementCreateInput("ModularChastityBelt" + trigger, "text", "", "10");
		if (input) input.setAttribute("placeholder", InventoryItemPelvisModularChastityBeltVoiceTriggerValues[i]);
	});

	InventoryItemPelvisModularChastityBeltVoiceTriggers.forEach((trigger, i) => {
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet("ModularChastityBelt" + trigger), 1480, 550 + i*60 + _offset, "white", "gray");
		MainCanvas.textAlign = "center";
		ElementPosition("ModularChastityBelt" + trigger, 1625, 550 + i*60 + _offset, 225, 50);
	});

	// Draw the save button
	ExtendedItemCustomDraw("FuturisticVibratorSaveVoiceCommands", 1510, 550-27 + InventoryItemPelvisModularChastityBeltVoiceTriggers.length*60 + _offset, null, false, false);

	// Draw the BackNext button
	DrawBackNextButton(1260, 550-27 + InventoryItemPelvisModularChastityBeltVoiceTriggers.length*60 + _offset, 225, 50, AssetTextGet("FuturisticVibratorPermissions" + (item.Property.AccessMode ?? "")), "White", "",
		() => AssetTextGet("FuturisticVibratorPermissions" + InventoryItemVulvaFuturisticVibratorPreviousAccessMode(item.Property?.AccessMode ?? "")),
		() => AssetTextGet("FuturisticVibratorPermissions" + InventoryItemVulvaFuturisticVibratorNextAccessMode(item.Property?.AccessMode ?? ""))
	);


}

function InventoryItemPelvisModularChastityBeltDrawVoiceControlCleanup() {
	InventoryItemPelvisModularChastityBeltVoiceTriggers.forEach(i => ElementRemove(`ModularChastityBelt${i}`));
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<ModularItemData>} */
function InventoryItemPelvisModularChastityBeltExitHook(data, originalFunction) {
	InventoryItemPelvisModularChastityBeltDrawVoiceControlCleanup();
}

/**
 * @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>}
 */
function InventoryItemPelvisModularChastityBeltClickHook(data, OriginalFunction) {
	const C = CharacterGetCurrent();
	const item = DialogFocusItem;
	if (!C || !item) return;

	if (data.currentModule === "Intensity") {
		InventoryItemPelvisModularChastityBeltClickIntensity(C, item, 75);
	}

	if (data.currentModule === "ShockModule") {
		InventoryItemPelvisModularChastityBeltClickShockModule(C, item, 0);
	}

	if (data.currentModule === "VoiceControl") {
		InventoryItemPelvisModularChastityBeltClickVoiceControl(C, item, 0);
	}

	OriginalFunction();
}


/**
 * @param {Character} C
 * @param {Item} item
 * @param {number} _offset - How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltClickIntensity(C, item, _offset){
	//Click Orgasm Reset
	if (MouseIn(1260, 550-27 + 0*75 + _offset, 225, 55)) {
		ExtendedItemCustomClick("ModularChastityBeltResetOrgasm", () => InventoryItemPelvisModularChastityBeltResetOrgasm(C, item), false, false);
		return;
	}

	//Click Deny Reset
	if (MouseIn(1260, 550-27 + 1*75 + _offset, 225, 55)) {
		ExtendedItemCustomClick("ModularChastityBeltResetDeny", () => InventoryItemPelvisModularChastityBeltResetDeny(C, item), false, false);
		return;
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {number} _offset - How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltClickVoiceControl(C, item, _offset){
	//Click Save
	if (MouseIn(1510, 550-27 + InventoryItemPelvisModularChastityBeltVoiceTriggers.length*60 + _offset, 225, 55)) {
		ExtendedItemCustomClick("FuturisticVibratorSaveVoiceCommands", () => InventoryItemPelvisModularChastityBeltVoiceControlClickSet(C, item), false, false);
		return;
	}

	//Click BackNext
	if (MouseIn(1260, 550-27 + InventoryItemPelvisModularChastityBeltVoiceTriggers.length*60 + _offset, 225, 55)) {
		if (MouseX < 1260 + (225 / 2)) {
			ExtendedItemCustomClick("", () => InventoryItemPelvisModularChastityBeltVoicePrevious(C, item), false, false);
		} else {
			ExtendedItemCustomClick("", () => InventoryItemPelvisModularChastityBeltVoiceNext(C, item), false, false);
		}
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 * @returns {void}
 */
function InventoryItemPelvisModularChastityBeltVoicePrevious(C, item) {
	InventoryItemVulvaFuturisticVibratorSetAccessMode(C, item, InventoryItemVulvaFuturisticVibratorPreviousAccessMode(item.Property?.AccessMode ?? ""));
}

/**
 * @param {Character} C
 * @param {Item} item
 * @returns {void}
 */
function InventoryItemPelvisModularChastityBeltVoiceNext(C, item) {
	InventoryItemVulvaFuturisticVibratorSetAccessMode(C, item, InventoryItemVulvaFuturisticVibratorNextAccessMode(item.Property?.AccessMode ?? ""));
}

/**
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemPelvisModularChastityBeltVoiceControlClickSet(C, item) {
	const InventoryItemPelvisModularChastityBeltVoiceTriggerValuesTemp = [];
	for (const [i, trigger] of InventoryItemPelvisModularChastityBeltVoiceTriggers.entries()) {
		const triggerValue = ElementValue(`ModularChastityBelt${trigger}`);
		const value = triggerValue !== "" ? triggerValue : InventoryItemPelvisModularChastityBeltVoiceTriggerValues[i];
		InventoryItemPelvisModularChastityBeltVoiceTriggerValuesTemp.push(value);
	}

	InventoryItemPelvisModularChastityBeltVoiceTriggerValues = InventoryItemPelvisModularChastityBeltVoiceTriggerValuesTemp;

	const temp = InventoryItemPelvisModularChastityBeltVoiceTriggerValues.join(",");

	if (temp != "" && typeof temp === "string") {
		item.Property ??= {};
		item.Property.TriggerValues = temp;
		if (ServerPlayerIsInChatRoom()) {
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.destinationCharacter(C)
				.asset(item.Asset, "AssetName", item.Craft && item.Craft.Name)
				.build();
			ChatRoomPublishCustomAction("FuturisticVibratorSaveVoiceCommandsAction", true, Dictionary);
		}
		DialogLeave();
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemPelvisModularChastityBeltResetOrgasm(C, item) {
	// Gets the current item and character
	item.Property ??= {};
	item.Property.OrgasmCount = 0;
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacterName(C)
		.asset(item.Asset, "AssetName", item.Craft && item.Craft.Name)
		.build();

	if (item.Property.ShowText) {
		ChatRoomPublishCustomAction("OrgasmCountReset", false, Dictionary);
	} else {
		ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);
	}
	if (C.IsPlayer()) {
		ServerPlayerAppearanceSync();
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemPelvisModularChastityBeltResetDeny(C, item) {
	// Gets the current item and character
	item.Property ??= {};
	item.Property.RuinedOrgasmCount = 0;
	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacterName(C)
		.asset(item.Asset, "AssetName", item.Craft && item.Craft.Name)
		.build();

	if (item.Property.ShowText) {
		ChatRoomPublishCustomAction("RuinCountReset", false, Dictionary);
	} else {
		ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);
	}
	if (C.IsPlayer()) {
		ServerPlayerAppearanceSync();
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {number} _offset - How many pixels down will the UI be shifted
 */
function InventoryItemPelvisModularChastityBeltClickShockModule(C, item, _offset){
	//Click Manual Shock
	if (MouseIn(1010, 550-27 + 0*75 + _offset, 225, 55)) {
		ExtendedItemCustomClick("ModularChastityBeltTriggerShock", () => PropertyShockPublishAction(C, item), false, false);
		return;
	}
	//Click Shock Reset
	if (MouseIn(1260, 550-27 + 0*75 + _offset, 225, 55)) {
		ExtendedItemCustomClick("ModularChastityBeltResetShock", InventoryItemNeckAccessoriesCollarShockUnitResetCount, false, false);
		return;
	}

	const property = (item.Property ??= {});
	if (MouseIn(1510, 520 + 1*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(C, item, "ShowText", () => property.ShowText = !property.ShowText, false, false);
		return;
	}
	if (MouseIn(1510, 520 + 2*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(C, item, "PunishOrgasm", () => property.PunishOrgasm = !property.PunishOrgasm, false, false);
		return;
	}
	if (MouseIn(1510, 520 + 3*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(C, item, "PunishStruggle", () => property.PunishStruggle = !property.PunishStruggle, false, false);
		return;
	}
	if (MouseIn(1510, 520 + 4*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(C, item, "PunishStruggleOther", () => property.PunishStruggleOther = !property.PunishStruggleOther, false, false);
		return;
	}
	if (MouseIn(1510, 520 + 5*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(C, item, "PunishStandup", () => property.PunishStandup = !property.PunishStandup, false, false);
		return;
	}
}

/**
 * @typedef {{Cooldown?: number, LastMessage?: number, DenyDetected?: boolean, OrgasmDetected?: boolean, ChatroomCheck?: boolean, SyncNeeded?: boolean, SyncCooldown?: number} & AnimationPersistentData} ModularChastityBeltPersistentData
 */

/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ModularItemData, ModularChastityBeltPersistentData>} */
function InventoryItemPelvisModularChastityBeltScriptDrawHook(data, originalFunction, drawData) {
	// Only run updates on the player and NPCs
	if (!drawData.C.IsPlayer() && drawData.C.MemberNumber !== null) return;

	const item = drawData.Item;
	const C = drawData.C;
	const property = (item.Property ??= {});
	const persistentData = drawData.PersistentData();
	const itemType = property.TypeRecord ?? {};

	// check and define necessary properties
	InventoryItemPelvisModularChastityBeltPropertiesCheck(persistentData, item);

	// Cooldown check
	InventoryItemPelvisModularChastityBeltCooldownCheck(persistentData, item);

	// Orgasm is comming check
	InventoryItemPelvisModularChastityBeltOrgasmCheck(persistentData, C, property);

	// Voice control check
	InventoryItemPelvisModularChastityBeltVoiceControlCheck(persistentData, C, item, itemType, InventoryItemPelvisModularChastityBeltVoiceTriggers);

	// Shock check
	InventoryItemPelvisModularChastityBeltShockCheck(C, item, itemType);

	// Sync check
	InventoryItemPelvisModularChastityBeltNeedSync(persistentData, C, item);
}

/**
 * @param {ModularChastityBeltPersistentData} persistentData
 * @param {Item} item
 */
function InventoryItemPelvisModularChastityBeltPropertiesCheck(persistentData, item) {
	if (typeof persistentData.Cooldown !== "number") persistentData.Cooldown = 0;
	if (typeof persistentData.LastMessage !== "number") persistentData.LastMessage = CommonTime();
	if (typeof persistentData.DenyDetected !== "boolean") persistentData.DenyDetected = false;
	if (typeof persistentData.OrgasmDetected !== "boolean") persistentData.OrgasmDetected = false;
	if (typeof persistentData.ChatroomCheck !== "boolean") persistentData.ChatroomCheck = false;
	if (typeof persistentData.SyncNeeded !== "boolean") persistentData.SyncNeeded = false;
	if (typeof persistentData.SyncCooldown !== "number") persistentData.SyncCooldown = CommonTime() + MS_PER_MIN;
	if (typeof item.Property.NextShockTime !== "number") item.Property.NextShockTime = 0;
}

/**
 * @param {ModularChastityBeltPersistentData} persistentData
 * @param {Item} item
 */
function InventoryItemPelvisModularChastityBeltCooldownCheck(persistentData, item) {
	if (typeof persistentData.Cooldown !== "number") persistentData.Cooldown = 0;

	if (persistentData.Cooldown > CommonTime()) {
		return; //If cooldown hasn't passed yet, do nothing
	}

	const isPlayerInChatRoom = ServerPlayerIsInChatRoom();


	if (!persistentData.ChatroomCheck) {
		//Player freshly entered a room
		item.Property.NextShockTime = CommonTime() + 500;
	}
	persistentData.Cooldown = CommonTime() + 500;
	persistentData.ChatroomCheck = isPlayerInChatRoom;
}

/**
 * @param {ModularChastityBeltPersistentData} persistentData
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemPelvisModularChastityBeltNeedSync(persistentData, C, item) {
	if (typeof persistentData.SyncCooldown !== "number") persistentData.SyncCooldown = CommonTime() + MS_PER_MIN;

	if (persistentData.SyncNeeded && CommonTime() > persistentData.SyncCooldown) {
		//Reset flags
		persistentData.SyncNeeded = false;
		persistentData.SyncCooldown = CommonTime() + MS_PER_MIN;

		//Sync
		ServerPlayerAppearanceSync();
		ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);
	}
}


/**
 * @param {ModularChastityBeltPersistentData} persistentData
 * @param {Character} C
 * @param {ItemProperties} property
 */
function InventoryItemPelvisModularChastityBeltOrgasmCheck(persistentData, C, property) {
	if (typeof persistentData.SyncCooldown !== "number") persistentData.SyncCooldown = CommonTime() + MS_PER_MIN;

	if (C.ArousalSettings.OrgasmTimer > 0) {
		//Player has orgasm imminent
		if (!persistentData.DenyDetected) {
			property.RuinedOrgasmCount ??= 0;
			property.RuinedOrgasmCount += 1;
			persistentData.DenyDetected = true;

			//Delay Sync for at least 15 seconds so potential orgasm synces in this very cycle.
			persistentData.SyncCooldown = Math.min(persistentData.SyncCooldown, CommonTime() + 15000);
			persistentData.SyncNeeded = true;
		}
	} else {
		persistentData.DenyDetected = false;
	}

	//Orgasm check
	if (C.ArousalSettings.OrgasmStage > 1) {
		//Player is having an orgasm
		if (!persistentData.OrgasmDetected) {
			property.OrgasmCount ??= 0;
			property.OrgasmCount += 1;
			property.RuinedOrgasmCount = 0;
			property.TimeSinceLastOrgasm = CommonTime();
			persistentData.OrgasmDetected = true;

			persistentData.SyncNeeded = true;
		}
	} else {
		persistentData.OrgasmDetected = false;
	}
}

/**
 * @param {ModularChastityBeltPersistentData} persistentData
 * @param {Character} C
 * @param {Item} item
 * @param {TypeRecord} itemType
 * @param {VoiceTriggerType[]} voiceTriggers
 */
function InventoryItemPelvisModularChastityBeltVoiceControlCheck(persistentData, C, item, itemType, voiceTriggers) {
	if (typeof persistentData.LastMessage !== "number") persistentData.LastMessage = CommonTime();

	let lastMsgIndex = ChatRoomChatLog.length - 1;
	if (lastMsgIndex >= 0 && ChatRoomChatLog[lastMsgIndex].Time > persistentData.LastMessage) {
		if (itemType.v !== 0) {
			let TriggerValues = item.Property?.TriggerValues?.split(',') ?? [];
			if (!TriggerValues) TriggerValues = voiceTriggers;
			const triggers = ItemModuleVoiceCommandHandle(C, item, persistentData.LastMessage, voiceTriggers, TriggerValues);
			InventoryItemPelvisModularChastityBeltHandleChat(C, item, triggers);
		}
		persistentData.LastMessage = ChatRoomChatLog[lastMsgIndex].Time;
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {TypeRecord} itemType
 */
function InventoryItemPelvisModularChastityBeltShockCheck(C, item, itemType) {
	if (itemType.s !== 0) {
		//Automatic shock can happen once every 0.5 seconds and only if Shock Module is not off
		const punishment = ItemModulePunishCheck(C, item, FuturisticChastityBeltShockCooldownOrgasm, InventoryItemPelvisFuturisticChastityBeltTamperZones);
		if (punishment) {
			switch (punishment) {
				case "Orgasm":
					PropertyShockPublishAction(C, item, true);
					break;
				case "StruggleOther":
				case "Struggle":
					PropertyShockPublishAction(C, item, true);
					StruggleProgressStruggleCount = 0;
					StruggleProgress = 0;
					DialogLeaveDueToItem = true;
					break;
				case "StandUp":
					PropertyShockPublishAction(C, item, true);
					InventoryItemPelvisModularChastityBeltForceKneel(C);
					break;
			}
		}
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {VoiceTriggerType[]} triggers
 */
function InventoryItemPelvisModularChastityBeltHandleChat(C, item, triggers) {
	item.Property ??= {};
	const ItemType = (item.Property.TypeRecord ??= {});
	//vibrator modes, can only pick one
	let chatMessageV;
	if (triggers.includes("Increase") && ItemType.i < 4) {
		ItemType.i = ItemType.i + 1;
		chatMessageV = `${item.Asset.Group.Name}${item.Asset.Name}Seti${ItemType.i}`;
	} else if (triggers.includes("Decrease") && ItemType.i > 0) {
		ItemType.i = ItemType.i - 1;
		chatMessageV = `${item.Asset.Group.Name}${item.Asset.Name}Seti${ItemType.i}`;
	} else if (triggers.includes("Disable") && ItemType.i !== 0) {
		ItemType.i = 0;
		chatMessageV = `${item.Asset.Group.Name}${item.Asset.Name}Seti${ItemType.i}`;
	}

	//plug modes, can only pick one
	let chatMessageP;
	if (triggers.includes("Inflate") && ItemType.p < 4) {
		ItemType.p = ItemType.p + 1;
		chatMessageP = `${item.Asset.Group.Name}${item.Asset.Name}Setp${ItemType.p}`;
	} else if (triggers.includes("Deflate") && ItemType.p > 0) {
		ItemType.p = ItemType.p - 1;
		chatMessageP = `${item.Asset.Group.Name}${item.Asset.Name}Setp${ItemType.p}`;
	} else if (triggers.includes("Empty") && ItemType.p !== 0) {
		ItemType.p = 0;
		chatMessageP = `${item.Asset.Group.Name}${item.Asset.Name}Setp${ItemType.p}`;
	}

	if (chatMessageV || chatMessageP) {
		// WORKAROUND: This will remove "Vibrating" effect from the item if vibrator is supposed to be off
		// Should be harmless even after the FIXME is resolved.
		if (ItemType.i === 0) {
			let index = item.Property?.Effect?.indexOf("Vibrating") ?? -1;
			if (index !== -1) {
				item.Property?.Effect?.splice(index, 1);
			}
		}

		// WORKAROUND: This will remove "Slow", "FillVulva" and "IsPlugged" effect from the item and blocking bodyparts "ItemVulva" and "ItemButt" if plugs are not bloated enough or deflated
		// Should be harmless even after the FIXME is resolved.
		if (ItemType.p < 3) {
			let index = item.Property?.Effect?.indexOf("Slow") ?? -1;
			if (index !== -1) {
				item.Property?.Effect?.splice(index, 1);
			}
		}
		if (ItemType.p === 0) {
			let index = item.Property?.Block?.indexOf("ItemVulva") ?? -1;
			if (index !== -1) {
				item.Property?.Block?.splice(index, 1);
			}
			index = item.Property?.Block?.indexOf("ItemButt") ?? -1;
			if (index !== -1) {
				item.Property?.Block?.splice(index, 1);
			}

			index = item.Property?.Effect?.indexOf("FillVulva") ?? -1;
			if (index !== -1) {
				item.Property?.Effect?.splice(index, 1);
			}
			index = item.Property?.Effect?.indexOf("IsPlugged") ?? -1;
			if (index !== -1) {
				item.Property?.Effect?.splice(index, 1);
			}
		}

		// FIXME: this needs to cause an actual update of the item's effects
		ExtendedItemSetOptionByRecord(C, item, ItemType, {push: true});

		if (chatMessageV) {
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.destinationCharacter(C)
				.asset(item.Asset, "AssetName", item.Craft && item.Craft.Name)
				.build();
			ChatRoomPublishCustomAction(chatMessageV, true, Dictionary);
		}
		if (chatMessageP) {
			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.destinationCharacter(C)
				.asset(item.Asset, "AssetName", item.Craft && item.Craft.Name)
				.build();
			ChatRoomPublishCustomAction(chatMessageP, true, Dictionary);
		}
	}

	//triggered actions
	if (triggers.includes("Shock")) {
		PropertyShockPublishAction(C, item, true);
	}
}

/**
 * @param {Character} C
 */
function InventoryItemPelvisModularChastityBeltForceKneel(C) {
	PoseSetActive(C, "Kneel");
	ServerSend("ChatRoomCharacterPoseUpdate", { Pose: C.ActivePose });
}
