"use strict";

/** @type {VoiceTriggerType[]} */
var InventoryItemVulvaTechnoChastityCageVoiceTriggers = ["Increase", "Decrease", "Disable", "Shock"];
/** @type {string[]} */
var InventoryItemVulvaTechnoChastityCageVoiceTriggerValues = [];

/** @type {{EXCITED: "Excited", AROUSED: "Aroused", HORNY: "Horny"}} */
const ItemVulvaChastityCageExcitementLevel = {
	HORNY: "Horny",
	AROUSED: "Aroused",
	EXCITED: "Excited",
};
const ItemVulvaChastityCageExcitementLevels = Object.values(ItemVulvaChastityCageExcitementLevel);

/** @type {Record<ItemVulvaChastityCageExcitementLevel, number>} */
const ItemVulvaChastityCageExcitementLevelThresholdMap = {
	[ItemVulvaChastityCageExcitementLevel.HORNY]: 90,
	[ItemVulvaChastityCageExcitementLevel.AROUSED]: 60,
	[ItemVulvaChastityCageExcitementLevel.EXCITED]: 30,
};

/**
 * @param {ItemVulvaChastityCageExcitementLevel} currentPunishmentMode
 */
const ItemVulvaTechnoChastityCageGetArousalThreshold = (currentPunishmentMode) => {
	return ItemVulvaChastityCageExcitementLevelThresholdMap[currentPunishmentMode] ?? ItemVulvaChastityCageExcitementLevelThresholdMap[ItemVulvaChastityCageExcitementLevel.HORNY];
};

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemVulvaTechnoChastityCageDrawHook(data, OriginalFunction) {
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

	if (data.currentModule === "Arousal") {
		InventoryItemVulvaChastityCageScriptDrawArousalPunishment(item, 0);
	}

	if (data.currentModule === "VoiceControl") {
		InventoryItemVulvaChastityCageDrawVoiceControl(item, 0);
	} else {
		InventoryItemVulvaTechnoChastityCageDrawVoiceControlCleanup();
	}
}

/**
 * @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>}
 */
function InventoryItemVulvaTechnoChastityCageClickHook(data, OriginalFunction) {
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
		InventoryItemVulvaTechnoChastityCageClickVoiceControl(C, item, 0);
	}

	if (data.currentModule === "Arousal") {
		InventoryItemVulvaChastityCageClickArousalPunishment(C, item, 0);
	}

	OriginalFunction();
}

/**
 * @param {Item} item
 * @param {number} _offset How many pixels down will the UI be shifted
 */
function InventoryItemVulvaChastityCageDrawVoiceControl(item, _offset) {
	//Create inputs
	item.Property ??= {};
	if (!item.Property.TriggerValues) item.Property.TriggerValues = InventoryItemVulvaTechnoChastityCageVoiceTriggers.join(",");
	InventoryItemVulvaTechnoChastityCageVoiceTriggerValues = item.Property.TriggerValues.split(',');
	// Only create the inputs if the zone isn't blocked
	InventoryItemVulvaTechnoChastityCageVoiceTriggers.forEach((trigger, i) => {
		const input = ElementCreateInput("TechnoChastityCage" + trigger, "text", "", "10");
		if (input) input.setAttribute("placeholder", InventoryItemVulvaTechnoChastityCageVoiceTriggerValues[i]);
	});

	InventoryItemVulvaTechnoChastityCageVoiceTriggers.forEach((trigger, i) => {
		MainCanvas.textAlign = "right";
		DrawText(AssetTextGet("ModularChastityBelt" + trigger), 1480, 550 + i*60 + _offset, "white", "gray");
		MainCanvas.textAlign = "center";
		ElementPosition("TechnoChastityCage" + trigger, 1625, 550 + i*60 + _offset, 225, 50);
	});

	// Draw the save button
	ExtendedItemCustomDraw("FuturisticVibratorSaveVoiceCommands", 1510, 550-27 + InventoryItemVulvaTechnoChastityCageVoiceTriggers.length*60 + _offset, null, false, false);

	// Draw the BackNext button
	DrawBackNextButton(1260, 550-27 + InventoryItemVulvaTechnoChastityCageVoiceTriggers.length*60 + _offset, 225, 50, AssetTextGet("FuturisticVibratorPermissions" + (item.Property.AccessMode ?? "")), "White", "",
		() => AssetTextGet("FuturisticVibratorPermissions" + InventoryItemVulvaFuturisticVibratorPreviousAccessMode(item.Property?.AccessMode ?? "")),
		() => AssetTextGet("FuturisticVibratorPermissions" + InventoryItemVulvaFuturisticVibratorNextAccessMode(item.Property?.AccessMode ?? ""))
	);
}

function InventoryItemVulvaTechnoChastityCageDrawVoiceControlCleanup() {
	InventoryItemVulvaTechnoChastityCageVoiceTriggers.forEach(i => ElementRemove(`TechnoChastityCage${i}`));
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<ModularItemData>} */
function InventoryItemVulvaTechnoChastityCageExitHook(data, originalFunction) {
	InventoryItemVulvaTechnoChastityCageDrawVoiceControlCleanup();
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {number} _offset How many pixels down will the UI be shifted
 */
function InventoryItemVulvaTechnoChastityCageClickVoiceControl(C, item, _offset){
	//Click Save
	if (MouseIn(1510, 550-27 + InventoryItemVulvaTechnoChastityCageVoiceTriggers.length*60 + _offset, 225, 55)) {
		ExtendedItemCustomClick("FuturisticVibratorSaveVoiceCommands", () => InventoryItemVulvaChastityCageVoiceControlClickSet(C, item), false, false);
		return;
	}

	//Click BackNext
	if (MouseIn(1260, 550-27 + InventoryItemVulvaTechnoChastityCageVoiceTriggers.length*60 + _offset, 225, 55)) {
		if (MouseX < 1260 + (225 / 2)) {
			ExtendedItemCustomClick("", () => InventoryItemVulvaTechnoChastityCageVoicePrevious(C, item), false, false);
		} else {
			ExtendedItemCustomClick("", () => InventoryItemVulvaTechnoChastityCageVoiceNext(C, item), false, false);
		}
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemVulvaChastityCageVoiceControlClickSet(C, item) {
	let triggerValuesTemp = [];
	for (const [i, trigger] of InventoryItemVulvaTechnoChastityCageVoiceTriggers.entries()) {
		const triggerValue = ElementValue(`TechnoChastityCage${trigger}`);
		const value = triggerValue !== "" ? triggerValue : InventoryItemVulvaTechnoChastityCageVoiceTriggerValues[i];
		triggerValuesTemp.push(value);
	}

	InventoryItemVulvaTechnoChastityCageVoiceTriggerValues = triggerValuesTemp;

	const temp = InventoryItemVulvaTechnoChastityCageVoiceTriggerValues.join(",");

	if (temp != "" && typeof temp === "string") {
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
 * @returns {void}
 */
function InventoryItemVulvaTechnoChastityCageVoicePrevious(C, item) {
	InventoryItemVulvaFuturisticVibratorSetAccessMode(C, item, InventoryItemVulvaFuturisticVibratorPreviousAccessMode(item.Property?.AccessMode ?? ""));
}

/**
 * @param {Character} C
 * @param {Item} item
 * @returns {void}
 */
function InventoryItemVulvaTechnoChastityCageVoiceNext(C, item) {
	InventoryItemVulvaFuturisticVibratorSetAccessMode(C, item, InventoryItemVulvaFuturisticVibratorNextAccessMode(item.Property?.AccessMode ?? ""));
}

/**
 * @typedef {{NextShrinkTime?: number, LastShrinkWarningTime?: number, ShrinkCooldown?: number} & ModularChastityBeltPersistentData} TechnoChastityCagePersistentData
 */

/** @type {ExtendedItemScriptHookCallbacks.ScriptDraw<ModularItemData, TechnoChastityCagePersistentData>} */
function InventoryItemVulvaChastityCageScriptDrawHook(data, originalFunction, drawData) {
	// Only run updates on the player and NPCs
	if (!drawData.C.IsPlayer() && drawData.C.MemberNumber !== null) return;

	const item = drawData.Item;
	const C = drawData.C;
	const property = (item.Property ??= {});
	const persistentData = drawData.PersistentData();
	const itemType = property.TypeRecord ?? {};

	// check and define necessary properties
	InventoryItemPelvisModularChastityBeltPropertiesCheck(persistentData, item);
	InventoryItemVulvaTechnoChastityCagePropertiesCheck(item);

	// Cooldown check
	InventoryItemPelvisModularChastityBeltCooldownCheck(persistentData, item);

	// Orgasm is comming check
	InventoryItemPelvisModularChastityBeltOrgasmCheck(persistentData, C, property);

	// Voice control check
	InventoryItemPelvisModularChastityBeltVoiceControlCheck(persistentData, C, item, itemType, InventoryItemVulvaTechnoChastityCageVoiceTriggers);

	// Shock check
	InventoryItemPelvisModularChastityBeltShockCheck(C, item, itemType);

	// Shrink check
	InventoryItemVulvaChastityCageShrinkCheck(C, item, itemType);

	// Sync check
	InventoryItemPelvisModularChastityBeltNeedSync(persistentData, C, item);
}


/**
 * @param {Item} item
 */
function InventoryItemVulvaTechnoChastityCagePropertiesCheck(item) {
	if (typeof item.Property.NextShrinkTime !== "number") item.Property.NextShrinkTime = 0;
	if (typeof item.Property.LastShrinkWarningTime !== "number") item.Property.LastShrinkWarningTime = 0;
	if (typeof item.Property.ShrinkCooldown !== "number") item.Property.ShrinkCooldown = 0;
}

/**
 * @param {Item} item
 * @param {number} _offset - How many pixels down will the UI be shifted
 */
function InventoryItemVulvaChastityCageScriptDrawArousalPunishment(item, _offset) {
	// Display option information
	MainCanvas.textAlign = "right";
	DrawText(AssetTextGet("ShowMessageInChat") + ":", 1500, 480 + 1*75 + _offset, "White", "Gray");
	DrawText(AssetTextGet("TechnoChastityCageArousalPunishmentState") + ":", 1500, 560 + 1*75 + _offset, "White", "Gray");

	// MainCanvas.textAlign = "left";
	MainCanvas.textAlign = "center";

	// Display checkbox
	ExtendedItemDrawCheckbox("ShowShrinkText", 1510, 450 + 1*75 + _offset, item.Property?.ShowShrinkText ?? false, { changeWhenLocked: false });

	// Draw the BackNext button
	DrawBackNextButton(1510, 430 + ItemVulvaChastityCageExcitementLevels.length*60 + _offset, 225, 50, AssetTextGet("TechnoChastityCageArousalPunishment" + (item.Property.ArousalLvl ?? "")), "White", "",
		() => AssetTextGet("TechnoChastityCageArousalPunishment" + InventoryItemVulvaChastityCagePreviousArousalPunishmentMode(item.Property?.ArousalLvl ?? "Horny")),
		() => AssetTextGet("TechnoChastityCageArousalPunishment" + InventoryItemVulvaChastityCageNextArousalPunishmentMode(item.Property?.ArousalLvl ?? "Horny"))
	);
}

/**
 * @param {ItemVulvaChastityCageExcitementLevel} current
 * @returns {ItemVulvaChastityCageExcitementLevel}
 */
function InventoryItemVulvaChastityCagePreviousArousalPunishmentMode(current) {
	return ItemVulvaChastityCageExcitementLevels[(ItemVulvaChastityCageExcitementLevels.indexOf(current) + ItemVulvaChastityCageExcitementLevels.length - 1) % ItemVulvaChastityCageExcitementLevels.length];
}

/**
 * @param {ItemVulvaChastityCageExcitementLevel} current
 * @returns {ItemVulvaChastityCageExcitementLevel}
 */
function InventoryItemVulvaChastityCageNextArousalPunishmentMode(current) {
	return ItemVulvaChastityCageExcitementLevels[(ItemVulvaChastityCageExcitementLevels.indexOf(current) + 1) % ItemVulvaChastityCageExcitementLevels.length];
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {number} _offset - How many pixels down will the UI be shifted
 */
function InventoryItemVulvaChastityCageClickArousalPunishment(C, item, _offset) {
	const property = (item.Property ??= {});
	if (MouseIn(1510, 450 + 1*75 + _offset, 64, 64) && !ExtendedItemPermissionMode) {
		ExtendedItemCustomClickAndPush(C, item, "ShowShrinkText", () => property.ShowShrinkText = !property.ShowShrinkText, false, false);
		return;
	}

	//Click BackNext
	if (MouseIn(1510, 430 + ItemVulvaChastityCageExcitementLevels.length*60 + _offset, 225, 55)) {
		if (MouseX < 1510 + (225 / 2)) {
			ExtendedItemCustomClick("", () => InventoryItemVulvaChastityCageArousalPrevious(C, item), false, false);
		} else {
			ExtendedItemCustomClick("", () => InventoryItemVulvaChastityCageArousalNext(C, item), false, false);
		}
	}
}

/**
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemVulvaChastityCageArousalPrevious(C, item) {
	InventoryItemVulvaChastityCageSetArousalMode(C, item, InventoryItemVulvaChastityCagePreviousArousalPunishmentMode(item.Property?.ArousalLvl ?? "Horny"));
}

/**
 * @param {Character} C
 * @param {Item} item
 */
function InventoryItemVulvaChastityCageArousalNext(C, item) {
	InventoryItemVulvaChastityCageSetArousalMode(C, item, InventoryItemVulvaChastityCageNextArousalPunishmentMode(item.Property?.ArousalLvl ?? "Horny"));
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {ItemVulvaChastityCageExcitementLevel} Mode
 */
function InventoryItemVulvaChastityCageSetArousalMode(C, item, Mode) {
	item.Property ??= {};
	item.Property.ArousalLvl = Mode;
	CharacterRefresh(C);
	ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {TypeRecord} itemType
 */
function InventoryItemVulvaChastityCageShrinkCheck(C, item, itemType) {
	if (typeof item.Property.ShrinkCooldown !== "number") item.Property.ShrinkCooldown = 0;
	if (!item.Property.ArousalLvl) item.Property.ArousalLvl = "Horny";

	// still on cooldown, return
	if (item.Property.ShrinkCooldown !== 0 && (CommonTime() < item.Property.ShrinkCooldown)) return;
	// if the function isnt set or cage is already the smallest, there's no point to do anything else
	if (!C.ArousalSettings || itemType.a === 0 || itemType.t === 2) return;

	const threshold = ItemVulvaTechnoChastityCageGetArousalThreshold(item.Property.ArousalLvl);
	const isBeyondThreshold = C.ArousalSettings.Progress >= threshold;
	if (!isBeyondThreshold && item.Property.LastShrinkWarningTime !== 0) {
		// player calmed down after warning given, setting up some cooldown to prevent spam
		item.Property.LastShrinkWarningTime = 0;
		item.Property.ShrinkCooldown = CommonTime() + 5 * 1000;
		return;
	} else if (!isBeyondThreshold) return;

	const punishmentResult = InventoryItemVulvaChastityCageArousalPunishmentResult(item);
	if (!punishmentResult) return;

	InventoryItemVulvaChastityCageArousalPunishmentRun(C, item, itemType, punishmentResult);
}

/**
 * @param {Item} item
 * @returns {ItemVulvaChastityCageArousalPunishmentType}
 */
function InventoryItemVulvaChastityCageArousalPunishmentResult(item) {
	if (typeof item.Property.LastShrinkWarningTime !== "number") item.Property.LastShrinkWarningTime = 0;

	/** @type {ItemVulvaChastityCageArousalPunishmentType} */
	let result = "";
	let warningDuration = 5 * 60 * 1000;

	if (item.Property.LastShrinkWarningTime === 0) {
		result = "Warning";
	} else if ((CommonTime() - item.Property.LastShrinkWarningTime) > warningDuration) {
		result = "Shrink";
	}

	return result;
}

/**
 * @param {Character} C
 * @param {Item} item
 * @param {TypeRecord} itemType
 * @param {string} punishmentResult
 */
function InventoryItemVulvaChastityCageArousalPunishmentRun(C, item, itemType, punishmentResult) {
	item.Property ??= {};
	/** @type {string} */
	let actionTag = "";
	const isShrinkage = punishmentResult === "Shrink";

	if (!isShrinkage) {
		// give player a warning to calm down
		item.Property.LastShrinkWarningTime = CommonTime();
		actionTag = `${item.Asset.Group.Name}${item.Asset.Name}Warning`;
	} else if (isShrinkage) {
		// player did not calm down, shrink the cage
		item.Property.LastShrinkWarningTime = 0;

		// setting cooldown before next warning happen... if happen
		item.Property.ShrinkCooldown = CommonTime() + 5 * 1000;
		itemType.t = itemType.t + 1;
		actionTag = `${item.Asset.Group.Name}${item.Asset.Name}Shrink${itemType.t}`;
	}

	ExtendedItemSetOptionByRecord(C, item, itemType, {push: true});

	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacter(C)
		.asset(item.Asset, "AssetName", item.Craft && item.Craft.Name)
		.build();

	if (item.Property.ShowShrinkText && CurrentScreen === "ChatRoom") {
		ChatRoomPublishCustomAction(actionTag, false, Dictionary);
	} else if (CurrentScreen === "ChatRoom") {
		ChatRoomMessage({ Content: actionTag, Type: "Action", Sender: Player.MemberNumber, Dictionary: Dictionary });
	}

	if (isShrinkage) {
		// play some fun little animation on shrink ;)
		TightenLoosenFacialExpression(C, "Medium", "Surprised", "Harsh");
	}
}
