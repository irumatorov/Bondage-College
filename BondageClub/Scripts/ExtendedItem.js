"use strict";
/**
 * Utility file for handling extended items
 */

/**
 * An enum encapsulating the available extended item archetypes
 * @satisfies {Record<Uppercase<ExtendedArchetype>, ExtendedArchetype>}
 */
const ExtendedArchetype = /** @type {const} */ ({
	MODULAR: "modular",
	TYPED: "typed",
	VIBRATING: "vibrating",
	VARIABLEHEIGHT: "variableheight",
	TEXT: "text",
	NOARCH: "noarch",
});

/**
 * A lookup for the current pagination offset for all extended item options. Offsets are only recorded if the extended
 * item requires pagination. Example format:
 * ```json
 * {
 *     "ItemArms/HempRope": 4,
 *     "ItemArms/Web": 0
 * }
 * ```
 * @type {Record<string, number>}
 * @constant
 */
var ExtendedItemOffsets = {};

/**
 * A set of properties to-be ignored by the `Init()` validation.
 * This more relaxed validation is required as these properties can be fully configured by the user in one way or another
 * and are thus not guaranteed to be linked to specific `TypeRecord` values
 * @type {ReadonlySet<keyof ItemProperties>}
 */
const ExtendedItemInitPropertyIgnore = new Set(/** @type {const} */([
	"OverridePriority",
	"DrawingTop",
	"DrawingLeft",
	"Opacity",
	"LayerTranslationX",
	"LayerTranslationY",
	"LayerScaleX",
	"LayerScaleY",
	"LayerRotation",
	"TranslationX",
	"TranslationY",
	"ScaleX",
	"ScaleY",
	"Rotation",
]));

/**
 * The X & Y co-ordinates of each option's button, based on the number to be displayed per page.
 * @type {[number, number][][]}
 */
const ExtendedXY = [
	[], //0 placeholder
	[[1385, 500]], //1 option per page
	[[1185, 500], [1590, 500]], //2 options per page
	[[1080, 500], [1385, 500], [1695, 500]], //3 options per page
	[[1185, 400], [1590, 400], [1185, 700], [1590, 700]], //4 options per page
	[[1080, 400], [1385, 400], [1695, 400], [1185, 700], [1590, 700]], //5 options per page
	[[1080, 400], [1385, 400], [1695, 400], [1080, 700], [1385, 700], [1695, 700]], //6 options per page
	[[1020, 400], [1265, 400], [1510, 400], [1755, 400], [1080, 700], [1385, 700], [1695, 700]], //7 options per page
	[[1020, 400], [1265, 400], [1510, 400], [1755, 400], [1020, 700], [1265, 700], [1510, 700], [1755, 700]], //8 options per page
];

/**
 * The X & Y co-ordinates of each option's button, based on the number to be displayed per page.
 * @type {[number, number][][]}
 */
const ExtendedXYWithoutImages = [
	[], //0 placeholder
	[[1385, 450]], //1 option per page
	[[1260, 450], [1510, 450]], //2 options per page
	[[1135, 450], [1385, 450], [1635, 450]], //3 options per page
	[[1260, 450], [1510, 450], [1260, 525], [1510, 525]], //4 options per page
	[[1135, 450], [1385, 450], [1635, 450], [1260, 525], [1510, 525]], //5 options per page
	[[1135, 450], [1385, 450], [1635, 450], [1135, 525], [1385, 525], [1635, 525]], //6 options per page
	[[1010, 450], [1260, 450], [1510, 450], [1760, 450], [1135, 525], [1385, 525], [1635, 525]], //7 options per page
	[[1010, 450], [1260, 450], [1510, 450], [1760, 450], [1010, 525], [1260, 525], [1510, 525], [1760, 525]], //8 options per page
	[[1135, 450], [1385, 450], [1635, 450], [1135, 525], [1385, 525], [1635, 525], [1135, 600], [1385, 600], [1635, 600]], //9 options per page
];

/**
 * The X & Y co-ordinates of each option's button, based on the number to be displayed per page.
 * @type {[number, number][][]}
 */
const ExtendedXYClothes = [
	[], //0 placeholder
	[[1385, 450]], //1 option per page
	[[1220, 450], [1550, 450]], //2 options per page
	[[1140, 450], [1385, 450], [1630, 450]], //3 options per page
	[[1220, 400], [1550, 400], [1220, 700], [1550, 700]], //4 options per page
	[[1140, 400], [1385, 400], [1630, 400], [1220, 700], [1550, 700]], //5 options per page
	[[1140, 400], [1385, 400], [1630, 400], [1140, 700], [1385, 700], [1630, 700]], //6 options per page
];


/**
 * The X & Y co-ordinates of each option's button, based on the number to be displayed per page.
 * @type {[number, number][][]}
 */
const ExtendedXYClothesWithoutImages = [
	[], //0 placeholder
	[[1385, 450]], //1 option per page
	[[1220, 450], [1550, 450]], //2 options per page
	[[1140, 450], [1385, 450], [1630, 450]], //3 options per page
	[[1220, 400], [1550, 400], [1220, 525], [1550, 525]], //4 options per page
	[[1140, 400], [1385, 400], [1630, 400], [1220, 525], [1550, 525]], //5 options per page
	[[1140, 400], [1385, 400], [1630, 400], [1140, 525], [1385, 525], [1630, 525]], //6 options per page
];

// eslint-disable-next-line jsdoc/require-param
/** Memoization of the requirements check */
const ExtendedItemRequirementCheckMessageMemo = CommonMemoize(ExtendedItemRequirementCheckMessage, [
	(data) => data ? data.Archetype : "",
	(character) => character.ID.toString(),
	(item) => `${item.Asset.Group.Name}${item.Asset.Name}`,
	(option) => option.Name,
	(currentOption) => currentOption.Name,
]);

/**
 * The current display mode
 * @type {boolean}
 */
var ExtendedItemPermissionMode = false;

/**
 * Tracks whether a selected option's subscreen is active - if active, the value is the name of the current subscreen's
 * corresponding option
 * @type {string|null}
 */
var ExtendedItemSubscreen = null;

/**
 * @template {object[]} T
 * @template RT
 * @template {ExtendedItemOption} Option
 * @param {ExtendedItemData<Option>} data
 * @param {keyof ExtendedItemScriptHookStruct<any, any>} name
 * @param {null | ExtendedItemCallback<T, RT>} originalFunction
 */
function ExtendedItemCreateCallback(data, name, originalFunction) {
	const suffix = CommonCapitalize(name);
	const prefix = ["afterDraw", "beforeDraw", "scriptDraw"].includes(name) ? data.dynamicAssetsFunctionPrefix : data.functionPrefix;
	const funcName = `${prefix}${suffix}`;
	/** @type {null | ((data: any, originalFunction: any, ...args: any[]) => any)} */
	const scriptHook = data.scriptHooks[name];
	const namespace = /** @type {Record<string, unknown>} */ (globalThis);
	if (scriptHook != null) {
		/** @type {ExtendedItemCallback<T, RT>} */
		namespace[funcName] = (...args) => scriptHook(data, originalFunction, ...args);
	} else if (originalFunction != null) {
		namespace[funcName] = originalFunction;
	}
}

/**
 * Construct the extended item's archetypical callbacks and place them in the main namespace.
 * Also sets {@link Asset.DynamicAfterDraw}, {@link Asset.DynamicScriptDraw} and/or {@link Asset.DynamicAfterDraw} if the appropriate callback is passed.
 * @template {ExtendedItemOption} T
 * @param {ExtendedItemData<T>} data - The extended item data
 * @param {ExtendedItemCallbackStruct<T>} defaults - The default archetypical callbacks
 */
function ExtendedItemCreateCallbacks(data, defaults) {
	const dynamicDrawNames = /** @type {const} */(["beforeDraw", "afterDraw", "scriptDraw"]);
	/** @type {(keyof ExtendedItemCallbackStruct<T>)[]} */
	const ExtendedItemCreate = [
		"load",
		"click",
		"draw",
		"exit",
		"validate",
		"publishAction",
		"init",
		"setOption",
		...dynamicDrawNames,
	];

	const extraKeys = CommonKeys(defaults).filter(i => !ExtendedItemCreate.includes(i));
	if (extraKeys.length !== 0) {
		console.error(`Found ${extraKeys.length} non-existent script hooks in the passed ${data.asset.Name} extended item data`);
	}

	ExtendedItemCreate.forEach(k => ExtendedItemCreateCallback(data, k, /** @type {ExtendedItemCallback<T[], never>} */(defaults[k])));
	for (const name of dynamicDrawNames) {
		if (data.scriptHooks[name] || defaults[name]) {
			const asset = /** @type {Mutable<Asset>} */(data.asset);
			asset[`Dynamic${CommonCapitalize(name)}`] = true;
		}
	}
}

/**
 * Convert that passed extended item config script hooks into their item data counterpart.
 * @template {ExtendedItemOption} OptionType
 * @template {ExtendedItemData<OptionType>} DataType
 * @param {ExtendedItemCapsScriptHooksStruct<DataType, OptionType>} scriptHooks - The extended item config script hooks
 * @returns {ExtendedItemScriptHookStruct<DataType, OptionType>} - The extended item data script hooks
 */
function ExtendedItemParseScriptHooks(scriptHooks) {
	return {
		load: typeof scriptHooks.Load === "function" ? scriptHooks.Load : null,
		click: typeof scriptHooks.Click === "function" ? scriptHooks.Click : null,
		draw: typeof scriptHooks.Draw === "function" ? scriptHooks.Draw : null,
		exit: typeof scriptHooks.Exit === "function" ? scriptHooks.Exit : null,
		validate: typeof scriptHooks.Validate === "function" ? scriptHooks.Validate : null,
		publishAction: typeof scriptHooks.PublishAction === "function" ? scriptHooks.PublishAction : null,
		init: typeof scriptHooks.Init === "function" ? scriptHooks.Init : null,
		setOption: typeof scriptHooks.SetOption === "function" ? scriptHooks.SetOption : null,
		beforeDraw: typeof scriptHooks.BeforeDraw === "function" ? scriptHooks.BeforeDraw : null,
		afterDraw: typeof scriptHooks.AfterDraw === "function" ? scriptHooks.AfterDraw : null,
		scriptDraw: typeof scriptHooks.ScriptDraw === "function" ? scriptHooks.ScriptDraw : null,
	};
}

/**
 * Initialize the extended item properties
 * @param {Character} C - The character that has the item equiped
 * @param {Item} Item - The item in question
 * @param {boolean} Push - Whether to push to changes to the server
 * @param {boolean} Refresh - Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
 * @returns {boolean} Whether properties were updated or not
 */
function ExtendedItemInit(C, Item, Push=true, Refresh=true) {
	if (Item == null || C == null || !Item.Asset.Extended) {
		return false;
	}

	/** @type {Parameters<ExtendedItemCallbacks.Init>} */
	const args = [C, Item, Push, Refresh];
	let ret = CommonCallFunctionByNameWarn(`Inventory${Item.Asset.Group.Name}${Item.Asset.Name}Init`, ...args);
	if (Item.Property.LockedBy && Item.Asset.AllowLock) {
		ret = CommonCallFunctionByNameWarn(`InventoryItemMisc${Item.Property.LockedBy}Init`, ...args) || ret;
	}
	return ret ?? false;
}

/**
 * Initialize the subscreen properties of the passed extended item option (if any)
 * @param {ExtendedItemOptionUnion} option - The extended item option
 * @param {Item} item - The item in question
 * @param {Character} C - The character that has the item equiped
 * @param {boolean} [push] - Whether to push to changes to the server
 * @param {boolean} [refresh] - Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
 * @returns {boolean} Whether properties were updated or not
 */
function ExtendedItemInitSubscreen(option, item, C, push=false, refresh=false) {
	if (option.ArchetypeData) {
		/** @type {Parameters<ExtendedItemCallbacks.Init>} */
		const args = [C, item, push, refresh];
		return CommonCallFunctionByName(`${option.ArchetypeData.functionPrefix}Init`, ...args) ?? false;
	} else {
		return false;
	}
}

/**
 * Helper init function for extended items without an archetype.
 * Note that on the long term this function should ideally be removed in favor of adding appropriate archetypes.
 * @param {Character} C - The character that has the item equiped
 * @param {Item} Item - The item in question
 * @param {ItemProperties} Properties - A record that maps property keys to their default value.
 *        The type of each value is used for basic validation.
 * @param {boolean} Push - Whether to push to changes to the server
 * @param {boolean} Refresh - Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
 * @returns {boolean} Whether properties were updated or not
 */
function ExtendedItemInitNoArch(C, Item, Properties, Push=true, Refresh=true) {
	if (!CommonIsObject(Item.Property)) {
		Item.Property = {};
	}

	let Update = false;
	const PropertiesCopy = CommonCloneDeep(Properties);
	for (const [name, value] of CommonEntries(PropertiesCopy)) {
		if (Item.Property[name] == null) {
			Update = true;
			PropertyAssign(Item.Property, name, value);
		}
	}

	if (Refresh) {
		CharacterRefresh(C, Push, false);
	}
	if (Push) {
		ChatRoomCharacterItemUpdate(C, Item.Asset.Group.Name);
	}
	return Update;
}

/**
 * Loads the item's extended item menu
 * @template {ExtendedItemOption} Option
 * @param {ExtendedItemData<Option>} data
 * @returns {void} Nothing
 */
function ExtendedItemLoad(data) {
	const { functionPrefix, dialogPrefix, parentOption } = data;
	if (ExtendedItemSubscreen && parentOption == null) {
		CommonCallFunctionByNameWarn(`${functionPrefix}${ExtendedItemSubscreen}Load`);
		return;
	}

	if (ExtendedItemOffsets[ExtendedItemOffsetKey()] == null) ExtendedItemSetOffset(0);
	const focusedCharacter = CharacterGetCurrent();
	if (typeof dialogPrefix.header === "string") {
		DialogExtendedMessage = AssetTextGet(dialogPrefix.header);
	} else if (typeof dialogPrefix.header === "function" && focusedCharacter && DialogFocusItem) {
		DialogExtendedMessage = dialogPrefix.header(data, focusedCharacter, DialogFocusItem);
	} else {
		DialogExtendedMessage = "";
	}
}

/**
 * Draw a single button in the extended item type selection screen.
 * @param {ExtendedItemOption | ModularItemModule} Option - The new extended item option
 * @param {ExtendedItemOption} CurrentOption - The current extended item option
 * @param {string} DialogPrefix - The prefix to the dialog keys for the display strings describing each extended type.
 *     The full dialog key will be <Prefix><Option.Name>
 * @param {ElementData<ElementMetaData>} buttonData - The X coordinate of the button
 * @param {Item} Item - The item in question; defaults to {@link DialogFocusItem}
 * @param {boolean | null} IsSelected - Whether the button is already selected or not. If `null` compute this value by checking if the item's current type matches `Option`.
 * @see {@link TypedItemDraw}
 */
function ExtendedItemDrawButton(Option, CurrentOption, DialogPrefix, buttonData, Item, IsSelected=null) {
	if (!Item && DialogFocusItem) {
		Item = DialogFocusItem;
	}
	if (buttonData.hidden || !Item) {
		return;
	}

	/** @type {[null | string, null | string, boolean]} */
	let [Type, AssetSource, IsFavorite] = [null, null, false];
	const Asset = Item.Asset;
	const C = CharacterGetCurrent();
	if (!C) {
		return;
	}
	const [x, y, width, height] = buttonData.position;
	const Hover = MouseIn(...buttonData.position) && !CommonIsMobile;
	let Effect = null;

	if (Option.OptionType === "ModularItemModule") {
		if (buttonData.imagePath != null) {
			AssetSource = buttonData.imagePath;
		} else {
			// Grab the `imagePath` of the selected option
			const optionIndex = Option.Options.findIndex(o => o.Name === CurrentOption.Name);
			AssetSource = Option.drawData.elementData[optionIndex].imagePath;
		}
		IsSelected = (IsSelected == null) ? false : IsSelected;
	} else {
		switch (Option.OptionType) {
			case "ModularItemOption":
			case "VibratingItemOption":
			case "TypedItemOption": {
				const typeRecord = Option.Property?.TypeRecord ?? {};
				const entries = Object.entries(typeRecord);
				Type = entries.map(([k, v]) => `${k}${v}`).join("");
				if (IsSelected == null) {
					const itemTypeRecord = Item.Property?.TypeRecord;
					if (ExtendedItemPermissionMode && entries.every(([k, v]) => v === 0 && itemTypeRecord?.[k] === 0)) {
						IsSelected = true;
					} else {
						IsSelected = entries.every(([k, v]) => itemTypeRecord?.[k] === v);
					}
				}
				break;
			}
			case "VariableHeightOption":
			case "ExtendedItemOption":
				Type = Option.Name;
				break;
			default:
				console.error(`Unsupported extended item option type: ${Option.OptionType}`);
				return;
		}
		Effect = Option.Property && Option.Property.Effect || null;
		IsFavorite = InventoryIsFavorite(ExtendedItemPermissionMode ? Player : C, Asset.Name, Asset.Group.Name, Type);
		AssetSource = buttonData.imagePath ?? null;
	}

	if (IsSelected == null) IsSelected = false;
	const ButtonColor = ExtendedItemGetButtonColor(CurrentOption.ParentData, C, Option, CurrentOption, Hover, IsSelected, Item);
	DrawButton(...buttonData.position, "", ButtonColor, null, null, IsSelected);
	if (buttonData.drawImage) {
		let imageWidthHeight = Math.min(width - 4, height);
		const imageX = x + (width - imageWidthHeight) / 2;
		const imageY = y + (height - imageWidthHeight - 54) / 2;
		if (AssetSource) DrawImageResize(AssetSource, imageX, imageY, imageWidthHeight, imageWidthHeight);
		if (Option.OptionType !== "ModularItemModule") {
			DrawPreviewIcons(ExtendItemGetIcons(C, Asset, Type, Effect), x + 2, y);
		}
	}
	const label = buttonData.label ? buttonData.label() : AssetTextGet(DialogPrefix + Option.Name);
	DrawTextFit(
		(IsFavorite && !buttonData.drawImage ? "★ " : "") + label,
		x + width / 2,
		y + height - 25,
		width, "black",
	);

	ControllerAddActiveArea(x + width / 2, y + height / 2);
}

/**
 * Determine the background color for the item option's button
 * @param {ExtendedItemData<ExtendedItemOption>} data - The extended item data
 * @param {Character} C - The character wearing the item
 * @param {ExtendedItemOption | ModularItemModule} Option - A type for the extended item
 * @param {ExtendedItemOption} CurrentOption - The currently selected option for the item
 * @param {boolean} Hover - TRUE if the mouse cursor is on the button
 * @param {boolean} IsSelected - TRUE if the item's current type matches Option
 * @param {Item} Item - The item in question; defaults to {@link DialogFocusItem}
 * @returns {string} The name or hex code of the color
 */
function ExtendedItemGetButtonColor(data, C, Option, CurrentOption, Hover, IsSelected, Item) {
	if (!Item && DialogFocusItem) {
		Item = DialogFocusItem;
	}
	if (!Item) {
		return "White";
	}
	/** @type {[null | string, boolean, boolean, boolean]} */
	let [Type, IsFirst, HasSubscreen, FailSkillCheck] = [null, false, false, false];

	// Identify appropriate values for each type of item option/module
	switch (Option.OptionType) {
		case "ModularItemModule":
			break;
		case "ModularItemOption":
		case "VibratingItemOption":
		case "TypedItemOption": {
			const typeRecord = Option.Property?.TypeRecord;
			const entry = typeRecord && Object.entries(typeRecord)[0];
			if (entry) {
				const [key, value] = entry;
				Type = `${key}${value}`;
				IsFirst = value === 0;
			}
			break;
		}
		case "VariableHeightOption":
		case "ExtendedItemOption":
			Type = Option.Name;
			break;
		default:
			console.error(`Unsupported extended item option type: ${Option.OptionType}`);
			return "Red";
	}
	if (Option.OptionType !== "ModularItemModule") {
		HasSubscreen = Option.HasSubscreen || false;
		FailSkillCheck = !!ExtendedItemRequirementCheckMessageMemo(data, C, Item, Option, CurrentOption);
	}

	let ButtonColor;
	if (ExtendedItemPermissionMode) {
		const IsSelfBondage = C.IsPlayer();
		const PlayerBlocked = InventoryIsPermissionBlocked(
			Player, Item.Asset.DynamicName(Player), Item.Asset.Group.Name, Type,
		);
		const PlayerLimited = InventoryIsPermissionLimited(
			Player, Item.Asset.Name, Item.Asset.Group.Name, Type
		);

		if ((IsSelfBondage && IsSelected) || IsFirst) {
			ButtonColor = "#888888";
		} else if (PlayerBlocked) {
			ButtonColor = Hover ? "red" : "pink";
		} else if (PlayerLimited) {
			ButtonColor = Hover ? "orange" : "#fed8b1";
		} else {
			ButtonColor = Hover ? "green" : "lime";
		}
	} else {
		const BlockedOrLimited = InventoryBlockedOrLimited(C, Item, Type);
		if (IsSelected && !HasSubscreen) {
			ButtonColor = "#888888";
		} else if (BlockedOrLimited) {
			ButtonColor = "Red";
		} else if (FailSkillCheck) {
			ButtonColor = "Pink";
		} else if (IsSelected && HasSubscreen) {
			ButtonColor = Hover ? "Cyan" : "LightGreen";
		} else {
			ButtonColor = Hover ? "Cyan" : "White";
		}
	}
	return ButtonColor;
}

/**
 * Exit function for the extended item dialog.
 *
 * This function will check if there's an extended subscreen and unload it to move back
 * to the main extended subscreen, or unload the whole extended subscreen and unfocus the item.
 *
 * It will cleanup the shared state from extended screens appropriately, call their unload (Exit)
 * callback, and set either {@link DialogFocusItem} or {@link ExtendedItemSubscreen} back to `null`.
 *
 * Note that you shouldn't need to call this function directly. The correct way to "exit" from an
 * extended item is to call {@link DialogLeaveFocusItem}, which will call this and refresh the dialog
 * UI.
 * @returns {void} - Nothing
 */
function ExtendedItemExit() {
	const item = DialogFocusItem;
	if (!item) return;
	// invalidate the cache
	ExtendedItemRequirementCheckMessageMemo.clearCache();

	if (ExtendedItemSubscreen) {
		// Run the subscreen's Exit function if any
		CommonCallFunctionByName(`${ExtendedItemFunctionPrefix(item)}${ExtendedItemSubscreen}Exit`);
		ExtendedItemSubscreen = null;
		ExtendedItemPermissionMode = false;
	} else if (DialogFocusItem) {
		CommonCallFunctionByName(`${ExtendedItemFunctionPrefix(item)}Exit`);
		DialogFocusItem = null;
		DialogFocusItemName = null;
		DialogExtendedMessage = "";
	} else {
		CommonCallFunctionByName(`Inventory${DialogFocusItemName}Exit`);
		DialogFocusItem = null;
		DialogFocusItemName = null;
		DialogExtendedMessage = "";
	}
}

/**
 * Sets a typed item's type and properties to the option provided.
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item whose type to set
 * @param {ItemProperties} previousProperty - The typed item options for the item
 * @param {ItemProperties} newProperty - The option to set
 * @param {boolean} push - Whether to push to changes to the server
 * @param {boolean} refresh - Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
 * @returns {void} Nothing
 */
function ExtendedItemSetProperty(C, item, previousProperty, newProperty, push=false, refresh=true) {
	// Delete properties added by the previous option and clone the new properties
	if (!item.Property) {
		item.Property = {};
	}
	const Property = item.Property;
	PropertyDifference(Property, previousProperty);
	PropertyUnion(Property, newProperty);

	// If the item is locked, ensure it has the "Lock" effect
	if (Property.LockedBy && !(Property.Effect || []).includes("Lock")) {
		Property.Effect = (Property.Effect || []);
		Property.Effect.push("Lock");
	}

	if (!InventoryDoesItemAllowLock(item)) {
		// If the new type does not permit locking, remove the lock
		ValidationDeleteLock(Property, false);
	}

	if (refresh || push) {
		CharacterRefresh(C, push, false);
	}
}

/**
 * Checks whether the character meets the requirements for an extended type option. This will check against their Bondage
 * skill if applying the item to another character, or their Self Bondage skill if applying the item to themselves.
 * @template {ExtendedItemOption} T
 * @param {null | ExtendedItemData<T>} data
 * @param {Character} C - The character in question
 * @param {Item} item - The item in question
 * @param {T} Option - The selected type definition
 * @param {T} CurrentOption - The current type definition
 * @param {boolean} permitExisting - Determines whether the validation should allow the new option and previous option
 * to be identical. Defaults to false.
 * @returns {string|null} null if the player meets the option requirements. Otherwise a string message informing them
 * of the requirements they do not meet
 */
function ExtendedItemRequirementCheckMessage(data, C, item, Option, CurrentOption, permitExisting = false) {
	return TypedItemValidateOption(data, C, item, Option, CurrentOption, permitExisting)
		|| ExtendedItemCheckSelfSelect(C, Option)
		|| ExtendedItemCheckBuyGroups(Option)
		|| ExtendedItemCheckSkillRequirements(C, item, Option);
}

/**
 * Checks whether the player is able to select an option based on it's self-selection criteria (whether or not the
 * wearer may select the option)
 * @param {Character} C - The character on whom the bondage is applied
 * @param {ExtendedItemOption} Option - The option whose requirements should be checked against
 * @returns {string | null} - undefined if the
 */
function ExtendedItemCheckSelfSelect(C, Option) {
	if (C.IsPlayer() && Option.AllowSelfSelect === false) {
		return InterfaceTextGet("CannotSelfSelect");
	}
	return null;
}

/**
 * Checks whether the player meets an option's self-bondage/bondage skill level requirements
 * @param {Character} C - The character on whom the bondage is applied
 * @param {Item} Item - The item whose options are being checked
 * @param {ExtendedItemOption} Option - The option whose requirements should be checked against
 * @returns {string|null} - Returns a string message informing them of the requirements they do not meet, otherwise null.
 */
function ExtendedItemCheckSkillRequirements(C, Item, Option) {
	const SelfBondage = C.IsPlayer();
	if (SelfBondage) {
		let RequiredLevel = Option.SelfBondageLevel;
		if (typeof RequiredLevel !== "number") RequiredLevel = Math.max(Item.Asset.SelfBondage, Option.BondageLevel ?? 0);
		if (SkillGetLevelReal(Player, "SelfBondage") < RequiredLevel) {
			return InterfaceTextGet("RequireSelfBondage").replace("ReqLevel", RequiredLevel.toString());
		}
	} else {
		let RequiredLevel = Option.BondageLevel || 0;
		if (SkillGetLevelReal(Player, "Bondage") < RequiredLevel) {
			return InterfaceTextGet("RequireBondageLevel").replace("ReqLevel", `${RequiredLevel}`);
		}
	}
	return null;
}

/**
 * Checks whether the character meets an option's required bought items
 * @param {ExtendedItemOption} Option - The option being checked
 * @returns {string|null} undefined if the requirement is met, otherwise the error message
 */
function ExtendedItemCheckBuyGroups(Option) {
	if (Option.PrerequisiteBuyGroup) {
		const requiredAsset = Asset.find(A => A.BuyGroup && A.BuyGroup === Option.PrerequisiteBuyGroup);
		if (requiredAsset && !InventoryAvailable(Player, requiredAsset.Name, requiredAsset.Group.Name)) {
			return InterfaceTextGet("OptionNeedsToBeBought");
		}
	}
	return null;
}

/**
 * Checks whether a change from the given current option to the newly selected option is valid.
 * @template {ExtendedItemOption} T
 * @param {null | ExtendedItemData<T>} data - The extended item data
 * @param {Character} C - The character wearing the item
 * @param {Item} Item - The extended item to validate
 * @param {T} newOption - The selected option
 * @param {T} previousOption - The currently applied option on the item
 * @param {boolean} [permitExisting] - Determines whether the validation should allow the new option and previous option
 * to be identical. Defaults to false.
 * @returns {string | null} - Returns a reason if the item failed validation, or null otherwise
 */
function ExtendedItemValidate(data, C, Item, newOption, previousOption, permitExisting = false) {
	// In the case of subscreens the super screens `ChangeWhenLocked` value takes priority
	let canChangeWhenLocked = true;
	if (data && data.parentOption && typeof data.parentOption.ChangeWhenLocked === "boolean") {
		canChangeWhenLocked = data.parentOption.ChangeWhenLocked;
	} else if (typeof previousOption.ChangeWhenLocked === "boolean") {
		canChangeWhenLocked = previousOption.ChangeWhenLocked;
	}
	const currentLockedBy = InventoryGetItemProperty(Item, "LockedBy");

	// If we're dealing with simple characters (e.g. `CraftingPreview`) then a number of checks should be disabled
	const isPreviewChar = C.IsSimple();

	if (newOption.Name === previousOption.Name && !permitExisting) {
		return newOption.HasSubscreen ? "" : InterfaceTextGet("AlreadySet");
	} else if (!isPreviewChar && !canChangeWhenLocked && currentLockedBy && !DialogCanUnlock(C, Item)) {
		// If the option can't be changed when locked, ensure that the player can unlock the item (if it's locked)
		return InterfaceTextGet("CantChangeWhileLocked");
	} else if (newOption.Prerequisite && !InventoryAllow(C, Item.Asset, newOption.Prerequisite, true, newOption.Property?.AllowActivePose)) {
		// Otherwise use the standard prerequisite check
		const statusID = DialogGetMenu(DialogMenuMode)?.ids.status;
		if (statusID) {
			// No idea what's going on there… Are we setting that at one point?
			return (document.getElementById(statusID)?.textContent ?? "error");
		}
		return InventoryDisallow(C, Item.Asset, newOption.Prerequisite, newOption.Property?.AllowActivePose);
	} else if (previousOption.AllowLock && !newOption.AllowLock && InventoryItemHasEffect(Item, "Lock", true)) {
		// We're switching from a locked, lockable option to one that can't be locked. Prevent that.
		return InterfaceTextGet("ExtendedItemUnlockBeforeChange");
	} else if (newOption.OptionType === "ExtendedItemOption" && isPreviewChar) {
		// Disable things like the shock button while modifying the crafting preview character
		return InterfaceTextGet("ExtendedItemNoCraftingScreen");
	}

	return null;
}

/**
 * Simple getter for the function prefix used for the passed extended item - used for calling standard
 * extended item functions (e.g. if the currently focused it is the hemp rope arm restraint, this will return
 * "InventoryItemArmsHempRope", allowing functions like InventoryItemArmsHempRopeLoad to be called)
 * @param {Item} Item - The extended item in question; defaults to {@link DialogFocusItem}
 * @returns {`Inventory${AssetGroupName}${string}`} The extended item function prefix for the currently focused item
 */
function ExtendedItemFunctionPrefix(Item) {
	if (!Item && DialogFocusItem) {
		Item = DialogFocusItem;
	}
	if (!Item) {
		throw new Error("called without a focused extended item");
	}
	const Asset = Item.Asset;
	return `Inventory${Asset.Group.Name}${Asset.Name}`;
}

/**
 * Simple getter for the key of the currently focused extended item in the ExtendedItemOffsets lookup
 * @returns {string} The offset lookup key for the currently focused extended item
 */
function ExtendedItemOffsetKey() {
	if (!DialogFocusItem) {
		throw new Error("called without a focused extended item");
	}
	var Asset = DialogFocusItem.Asset;
	return Asset.Group.Name + "/" + Asset.Name;
}

/**
 * Gets the pagination offset of the currently focused extended item
 * @returns {number} The pagination offset for the currently focused extended item
 */
function ExtendedItemGetOffset() {
	return ExtendedItemOffsets[ExtendedItemOffsetKey()];
}

/**
 * Sets the pagination offset for the currently focused extended item
 * @param {number} Offset - The new offset to set
 * @returns {void} Nothing
 */
function ExtendedItemSetOffset(Offset) {
	ExtendedItemOffsets[ExtendedItemOffsetKey()] = Offset;
}

/**
 * Maps a chat tag to a dictionary entry for use in item chatroom messages.
 * @param {DictionaryBuilder} dictionary - The to-be updated dictionary builder
 * @param {Character} C - The target character
 * @param {Item} item - The typed item
 * @param {CommonChatTags} tag - The tag to map to a dictionary entry
 * @returns {DictionaryBuilder} - The originally passed dictionary builder, modified inplace
 */
function ExtendedItemMapChatTagToDictionaryEntry(dictionary, C, { Asset, Craft }, tag) {
	switch (tag) {
		case CommonChatTags.SOURCE_CHAR:
			return dictionary.sourceCharacter(Player);
		case CommonChatTags.DEST_CHAR:
			return dictionary.destinationCharacter(C);
		case CommonChatTags.DEST_CHAR_NAME:
			return dictionary.destinationCharacterName(C);
		case CommonChatTags.TARGET_CHAR:
			return dictionary.targetCharacter(C);
		case CommonChatTags.TARGET_CHAR_NAME:
			return dictionary.targetCharacterName(C);
		case CommonChatTags.ASSET_NAME:
			return dictionary.asset(Asset, "AssetName", Craft && Craft.Name);
		case CommonChatTags.AUTOMATIC:
			return dictionary.markAutomatic();
		default:
			console.error(`Unknown ${Asset.Group.Name}:${Asset.Name} chat tag "${tag}"`);
			return dictionary;
	}
}

/**
 * Construct an array of inventory icons for a given asset and type
 * @param {Character} C - The target character
 * @param {Asset} Asset - The asset for the typed item
 * @param {string | null} [Type] - The type of the asset
 * @param {(readonly EffectName[]) | null} [Effects]
 * @returns {InventoryIcon[]} - The inventory icons
 */
function ExtendItemGetIcons(C, Asset, Type=undefined, Effects=undefined) {
	const IsBlocked = InventoryIsPermissionBlocked(C, Asset.Name, Asset.Group.Name, Type);
	const IsLimited = InventoryIsPermissionLimited(C, Asset.Name, Asset.Group.Name, Type);

	/** @type {InventoryIcon[]} */
	const icons = [];
	if (!C.IsPlayer() && !IsBlocked && IsLimited) {
		icons.push("AllowedLimited");
	}
	const FavoriteDetails = DialogGetFavoriteStateDetails(C, Asset, Type);
	if (FavoriteDetails && FavoriteDetails.Icon) {
		icons.push(FavoriteDetails.Icon);
	}

	if (Array.isArray(Effects)) {
		icons.push(...DialogEffectIcons.GetEffectIcons(Effects));
	}

	return icons;
}

/**
 * Creates an asset's extended item NPC dialog function
 * @template {ExtendedItemOption} [OptionType=ExtendedItemOption]
 * @param {Asset} Asset - The asset for the typed item
 * @param {string} FunctionPrefix - The prefix of the new `NpcDialog` function
 * @param {string | ExtendedItemNPCCallback<OptionType>} NpcPrefix - A dialog prefix or a function for creating one
 * @returns {void} - Nothing
 */
function ExtendedItemCreateNpcDialogFunction(Asset, FunctionPrefix, NpcPrefix) {
	const npcDialogFunctionName = `${FunctionPrefix}NpcDialog`;
	const namespace = /** @type {Record<string, unknown>} */ (globalThis);
	if (typeof NpcPrefix === "function") {
		/** @type {(C: Character, Option: OptionType, PreviousOption: OptionType) => void} */
		namespace[npcDialogFunctionName] = function (C, Option, PreviousOption) {
			const Prefix = NpcPrefix(C, Option, PreviousOption);
			C.CurrentDialog = DialogFind(C, Prefix, Asset.Group.Name);
		};
	} else {
		/** @type {(C: Character, Option: OptionType, PreviousOption: OptionType) => void} */
		namespace[npcDialogFunctionName] = function (C, Option, PreviousOption) {
			C.CurrentDialog = DialogFind(C, `${NpcPrefix}${Option.Name}`, Asset.Group.Name);
		};
	}
}

/**
 * Helper click function for creating custom buttons, including extended item permission support.
 * @param {string} Name - The name of the button and its pseudo-type
 * @param {number} X - The X coordinate of the button
 * @param {number} Y - The Y coordinate of the button
 * @param {string | null} imagePath — The pa
 * @param {boolean} IsSelected - Whether the button is selected or not
 * @param {boolean} ChangeWhenLocked - Whether the button can be clicked when locked
 * @returns {void} Nothing
 */
function ExtendedItemCustomDraw(Name, X, Y, imagePath=null, IsSelected=false, ChangeWhenLocked=true) {
	const item = DialogFocusItem;
	if (!item) return;
	// Use a `name` for a "fictional" item option for interfacing with the extended item API
	// TODO: Add a proper archetype rather than relying on `ParentData == null`
	const newOption = /** @type {ExtendedItemOption} */ (/** @type {unknown} */ ({ OptionType: "ExtendedItemOption", Name: Name, ParentData: null, ChangeWhenLocked }));
	const previousOption = /** @type {ExtendedItemOption} */ (/** @type {unknown} */ ({ OptionType: "ExtendedItemOption", Name: `${Name}Previous`, ParentData: null, ChangeWhenLocked }));
	/** @type {ElementData<{ drawImage: boolean, imagePath: string | null }>} */
	const elementData = {
		position: [X, Y, 225, imagePath != null ? 275 : 50],
		drawImage: imagePath != null,
		imagePath,
	};
	return ExtendedItemDrawButton(newOption, previousOption, "", elementData, item, IsSelected);
}

/**
 * Helper click function for creating custom check boxes, including extended item permission support.
 * @param {string} name - The name of the checkbox and its pseudo-type
 * @param {number} x - The X coordinate of the checkbox
 * @param {number} y - The Y coordinate of the checkbox
 * @param {boolean} isChecked - Whether the checkbox is checked or not
 * @param {object} [options]
 * @param {string} [options.text] - Label associated with the checkbox
 * @param {number} [options.width] - Width of the checkbox
 * @param {number} [options.height] - Height of the checkbox
 * @param {boolean} [options.changeWhenLocked] - Whether the checkbox can be toggled when locked
 * @param {string} [options.textColor]
 */
function ExtendedItemDrawCheckbox(name, x, y, isChecked, options) {
	const { text, width, height, changeWhenLocked = true, textColor } = options || {};

	// TODO: Add a proper archetype rather than relying on `ParentData == null`
	const newOption = /** @type {ExtendedItemOption} */ (/** @type {unknown} */ ({
		OptionType: "ExtendedItemOption",
		Name: name,
		ParentData: null,
		ChangeWhenLocked: changeWhenLocked,
	}));
	const previousOption = /** @type {ExtendedItemOption} */ (/** @type {unknown} */ ({
		OptionType: "ExtendedItemOption",
		Name: `${name}Previous`,
		ParentData: null,
		ChangeWhenLocked: changeWhenLocked,
	}));

	const C = CharacterGetCurrent();
	const item = DialogFocusItem;
	if (!C || !item) return;
	const msg = ExtendedItemRequirementCheckMessageMemo(
		null, C, item, newOption, previousOption,
	);
	const disabled = !!(msg || ExtendedItemPermissionMode);
	DrawCheckbox(x, y, width || 64, height || 64, text || "", isChecked, disabled, textColor || "Black");
}

/**
 * Helper click function for creating custom buttons, including extended item permission support.
 * @param {string} Name - The name of the button and its pseudo-type
 * @param {() => void} Callback - A callback to be executed whenever the button is clicked and all requirements are met
 * @param {boolean} Worn - `true` if the player is changing permissions for an item they're wearing
 * @param {boolean} ChangeWhenLocked - `true` if the item can be modified while locked
 * @returns {boolean} `false` if the item's requirement check failed and `true` otherwise
 */
function ExtendedItemCustomClick(Name, Callback, Worn=false, ChangeWhenLocked=true) {
	const C = CharacterGetCurrent();
	const item = DialogFocusItem;
	if (!C || !item) {
		return false;
	}
	// Use a `name` for a "fictional" item option for interfacing with the extended item API
	if (ExtendedItemPermissionMode) {
		InventoryTogglePermission(item, Name, Worn);
		return true;
	} else {
		// Check if the option is blocked/limited/etc.
		// TODO: Add a proper archetype rather than relying on `ParentData == null`
		/** @type {ExtendedItemOption} */
		const newOption = { OptionType: "ExtendedItemOption", Name: Name, ParentData: /** @type {never} */(null), ChangeWhenLocked };
		/** @type {ExtendedItemOption} */
		const previousOption = { OptionType: "ExtendedItemOption", Name: `${Name}Previous`, ParentData: /** @type {never} */(null), ChangeWhenLocked };
		const requirementMessage = ExtendedItemRequirementCheckMessage(null, C, item, newOption, previousOption);
		if (requirementMessage) {
			DialogExtendedMessage = requirementMessage;
			return false;
		} else {
			// Requirement checks have passed; execute the callback
			Callback();
			return true;
		}
	}
}

/**
 * Helper click function for creating custom buttons, including extended item permission support, and pushing the changes to the server.
 * @param {Character} C - The character
 * @param {Item} item - The item
 * @param {string} name - The name of the button and its pseudo-type
 * @param {() => void} callback - A callback to be executed whenever the button is clicked and all requirements are met
 * @param {boolean} worn - `true` if the player is changing permissions for an item they're wearing
 * @param {boolean} changeWhenLocked - Whether the button r
 * @returns {boolean} `false` if the item's requirement check failed and `true` otherwise
 */
function ExtendedItemCustomClickAndPush(C, item, name, callback, worn=false, changeWhenLocked=true) {
	const status = ExtendedItemCustomClick(name, callback, worn, changeWhenLocked);
	if (ExtendedItemPermissionMode) {
		return status;
	}

	if (C.IsPlayer()) {
		ServerPlayerAppearanceSync();
	}
	ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);
	return status;
}

/**
 * Helper publish + exit function for creating custom buttons whose clicks exit the dialog menu.
 *
 * If exiting the dialog menu is undesirable then something akin to the following example should be used instead:
 * @example
 * if (ServerPlayerIsInChatRoom()) {
 *     ChatRoomPublishCustomAction(Name, false, Dictionary);
 * }
 * @param {string} Name - Tag of the action to send
 * @param {ChatMessageDictionary | null} Dictionary - Dictionary of tags and data to send to the room (if any).
 * @returns {void} Nothing
 */
function ExtendedItemCustomExit(Name, Dictionary=null) {
	// The logic below is largely adapted from the exiting functionality within `TypedItemSetType`
	if (ServerPlayerIsInChatRoom()) {
		if (Dictionary != null) {
			ChatRoomPublishCustomAction(Name, true, Dictionary);
		} else {
			DialogLeave();
		}
	} else {
		DialogLeaveFocusItem();
	}
}

/**
 * Common draw function for drawing the header of the extended item menu screen.
 * Automatically applies any Locked and/or Vibrating options to the preview.
 * @param {Item} Item - The item for whom the preview box should be drawn
 * @param {number} X - Position of the preview box on the X axis
 * @param {number} Y - Position of the preview box on the Y axis
 * @returns {void} Nothing
 */
function ExtendedItemDrawHeader(Item, X=1387, Y=55) {
	if (!Item && DialogFocusItem) {
		Item = DialogFocusItem;
	}
	if (!Item) {
		return;
	}
	DrawItemPreview(Item, Player, X, Y);
}

/**
 * Extract the passed item's data from one of the extended item lookup tables
 * @template {ExtendedArchetype} Archetype
 * @param {Asset} asset - The item whose data should be extracted
 * @param {Archetype} Archetype - The archetype corresponding to the lookup table
 * @param {string} [Type] - The item's type. Only relevant in the case of {@link VariableHeightData}
 * @returns {null | AssetArchetypeGetData<Archetype>} The item's data or `null` if the lookup failed
 */
function ExtendedItemGetData(asset, Archetype, Type) {
	if (asset == null) {
		return null;
	}

	/** @type {AssetArchetypeData} */
	let Data;
	const Key = `${asset.Group.Name}${asset.Name}${Type == null ? "" : Type}`;
	switch (Archetype) {
		case ExtendedArchetype.TYPED:
			Data = TypedItemDataLookup[Key];
			break;
		case ExtendedArchetype.MODULAR:
			Data = ModularItemDataLookup[Key];
			break;
		case ExtendedArchetype.VIBRATING:
			Data = VibratorModeDataLookup[Key];
			break;
		case ExtendedArchetype.VARIABLEHEIGHT:
			Data = VariableHeightDataLookup[Key];
			break;
		case ExtendedArchetype.TEXT:
			Data = TextItemDataLookup[Key];
			break;
		case ExtendedArchetype.NOARCH:
			Data = NoArchItemDataLookup[Key];
			break;
		default:
			return null;
	}

	if (Data === undefined) {
		console.error(`No key "${Key}" in "${Archetype}" lookup table`);
		return null;
	} else {
		return Data;
	}
}

/**
 * Constructs the chat message dictionary for the extended item based on the items configuration data.
 * @template {ExtendedItemOption} OptionType
 * @param {ExtendedItemChatData<OptionType>} chatData - The chat data that triggered the message.
 * @param {ExtendedItemData<OptionType>} data - The extended item data for the asset
 * @param {Item} item
 * @returns {DictionaryBuilder} - The dictionary for the item based on its required chat tags
 */
function ExtendedItemBuildChatMessageDictionary(chatData, { chatTags, dictionary }, item) {
	const dictBuilder = new DictionaryBuilder();
	chatTags.forEach(tag => ExtendedItemMapChatTagToDictionaryEntry(dictBuilder, chatData.C, item, tag));
	dictionary.forEach(entry => entry(dictBuilder, chatData));
	return dictBuilder;
}

/**
 * Return {@link ExtendedItemDialog.chat} if it's a string or call it using chat data based on a fictional extended item option.
 * Generally used for getting a chat prefix for extended item buttons with custom functionality.
 * @param {string} Name - The name of the pseudo-type
 * @param {ExtendedItemData<any>} Data - The extended item data
 * @returns {string} The dialogue prefix for the custom chatroom messages
 */
function ExtendedItemCustomChatPrefix(Name, Data) {
	const C = CharacterGetCurrent();
	if (!C) {
		return "";
	}
	const chat = Data.dialogPrefix.chat;
	if (typeof chat === "function") {
		return chat({
			C,
			previousOption: { OptionType: "ExtendedItemOption", Name: Name, ParentData: Data },
			newOption: { OptionType: "ExtendedItemOption", Name: Name, ParentData: Data },
			previousIndex: -1,
			newIndex: -1,
		});
	}
	return chat ?? "";
}

/**
 * Gather and return all subscreen properties of the passed option.
 * @param {Item} item - The item in question
 * @param {ExtendedItemOption} option - The extended item option
 * @returns {ItemProperties} - The item properties of the option's subscreen (if any)
 */
function ExtendedItemGatherSubscreenProperty(item, option) {
	const data = option.ArchetypeData;
	if (!data) {
		return {};
	}

	switch (data.archetype) {
		case ExtendedArchetype.VIBRATING:
			return TypedItemFindPreviousOption(data, item).Property;
		case ExtendedArchetype.VARIABLEHEIGHT:
			return { OverrideHeight: item.Property.OverrideHeight };
		case ExtendedArchetype.NOARCH:
			return Object.fromEntries(CommonKeys(data.baselineProperty ?? {}).map(k => [k, item.Property[k]]));
		case ExtendedArchetype.TEXT:
			return Object.fromEntries(data.textNames.map(k => [k, item.Property[k]]));
		default:
			return {};
	}
}

/**
 * Sets an extended item's type and properties to the option provided.
 * @template {ModularItemOption | TypedItemOption | VibratingItemOption} OptionType
 * @param {ModularItemData | TypedItemData | VibratingItemData} data - The extended item data
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item whose type to set
 * @param {OptionType} newOption - The to-be applied extended item option
 * @param {OptionType} previousOption - The previously applied extended item option
 * @param {boolean} push - Whether to push to changes to the server
 * @param {boolean} refresh - Whether to refresh the character. This should generally be `true`, with custom script hooks being a potential exception.
 */
function ExtendedItemSetOption(data, C, item, newOption, previousOption, push=false, refresh=true) {
	/** @type {ItemProperties} */
	let previousOptionProperty;
	/** @type {ItemProperties} */
	let newOptionProperty;
	switch (newOption.OptionType) {
		case "ModularItemOption": {
			const moduleData = /** @type {ModularItemData} */(data);
			const previousModuleValues = ModularItemParseCurrent(moduleData, item.Property.TypeRecord);
			const moduleIndex = moduleData.modules.findIndex(m => m.Name === newOption.ModuleName);
			const newModuleValues = [...previousModuleValues];
			newModuleValues[moduleIndex] = newOption.Index;

			newOptionProperty = ModularItemMergeModuleValues(moduleData, newModuleValues);
			previousOptionProperty = ModularItemMergeModuleValues(moduleData, previousModuleValues);
			break;
		}
		case "VibratingItemOption":
		case "TypedItemOption":
			newOptionProperty = CommonCloneDeep(newOption.Property);
			previousOptionProperty = { ...previousOption.Property };
			break;
		default:
			console.error(`Unsupported archetype: ${data.asset.Archetype}`);
			return;
	}

	if (newOption.HasSubscreen) {
		/** @type {Parameters<ExtendedItemCallbacks.Init>} */
		const args = [C, item, false, false];
		CommonCallFunctionByNameWarn(`${data.functionPrefix}${newOption.Name}Init`, ...args);
	}

	const newProperty = PropertyUnion(
		newOptionProperty,
		ExtendedItemGatherSubscreenProperty(item, newOption),
	);
	const previousProperty = PropertyUnion(
		previousOptionProperty,
		ExtendedItemGatherSubscreenProperty(item, previousOption),
	);
	CommonKeys(data.baselineProperty || {}).forEach(i => delete previousProperty[i]);
	ExtendedItemSetProperty(C, item, previousProperty, newProperty, push, refresh);

	if (newOption.Expression) {
		InventoryExpressionTriggerApply(C, newOption.Expression);
	}
}

/** A temporary hack for registering extra archetypes for a single screen. */
function ExtendedItemManualRegister() {
	/** @type {{ group: AssetGroupName, name: AssetName, config: AssetArchetypeConfig }[]} */
	const items = [
		{
			group: "ItemArms",
			name: "TransportJacket",
			config: {
				Archetype: ExtendedArchetype.TEXT,
				MaxLength: { Text: 14 },
				Font: "'Saira Stencil One', 'Arial', sans-serif",
				DrawData: {
					elementData: [
						{ position: [1505, 850] },
					],
				},
				DialogPrefix: {
					Header: "ItemArmsTransportJacketSelect",
				},
			},
		},
		{
			group: "ItemDevices",
			name: "WoodenBox",
			config: {
				Archetype: ExtendedArchetype.TEXT,
				MaxLength: { Text: 20 },
				Font: "'Saira Stencil One', 'Arial', sans-serif",
				PushOnPublish: false,
				DrawData: {
					elementData: [
						{ position: [1505, 850] },
					],
				},
				DialogPrefix: {
					Header: "ItemDevicesWoodenBoxSelect",
				},
			},
		},
		{
			group: "ItemDevices",
			name: "TransportWoodenBox",
			config: {
				Archetype: ExtendedArchetype.TEXT,
				MaxLength: { Text: 20 },
				Font: "'Saira Stencil One', 'Arial', sans-serif",
				PushOnPublish: false,
				DrawData: {
					elementData: [
						{ position: [1505, 850] },
					],
				},
				DialogPrefix: {
					Header: "ItemDevicesWoodenBoxSelect",
				},
			},
		},
		{
			group: "ItemDevices",
			name: "KabeshiriWall",
			config: {
				Archetype: ExtendedArchetype.TEXT,
				MaxLength: { Text: 10, Text2: 10 },
				Font: "Caveat-Bold",
				DrawData: {
					elementData: [
						{ position: [1505, 750] },
						{ position: [1505, 825] },
					],
				},
				DialogPrefix: {
					Header: "ItemDevicesKabeshiriWallSelectBase",
				},
			},
		},
		{
			group: "Suit",
			name: "LatexCatsuit",
			config: {
				Archetype: ExtendedArchetype.TEXT,
				MaxLength: { Text: 14, Text2: 10, Text3: 14, },
				Font: "'Saira Stencil One', 'Arial', sans-serif",
				DrawData: {
					elementData: [
						{ position: [1505, 750] },
						{ position: [1505, 800] },
						{ position: [1505, 850] },
					],
				},
				DialogPrefix: {
					Header: "SuitLatexCatsuitSelect",
				},
			},
		},
	];

	for (const { group, name, config } of items) {
		const asset = AssetGet("Female3DCG", group, name);
		if (!asset) continue;
		AssetBuildExtended(asset, config, AssetFemale3DCGExtended, null, false);
	}
}

/**
 * Parse the passed draw data as passed via the extended item config
 * @template {ElementMetaData} MetaData
 * @param {ExtendedItemConfigDrawData<Partial<MetaData>> | undefined} drawData - The to-be parsed draw data
 * @param {Pick<ExtendedItemDrawData<MetaData>, "elementData" | "itemsPerPage">} defaults - The default draw data
 * @returns {ExtendedItemDrawData<MetaData>} - The parsed draw data
 */
function ExtendedItemGetDrawData(drawData, defaults) {
	if (!drawData) {
		drawData = {};
	}

	const itemsPerPage = drawData.itemsPerPage == null ? defaults.itemsPerPage : drawData.itemsPerPage;

	/** @type {ElementData<MetaData>[]} */
	let elementData;
	if (Array.isArray(drawData.elementData)) {
		const elementDataConfig = drawData.elementData;
		if (elementDataConfig.length > defaults.elementData.length) {
			throw new Error(`Custom DrawData.elementData length (${elementDataConfig.length}) larger than expected length (${defaults.elementData.length})`);
		}
		elementData = defaults.elementData.map((buttonDataRef, i) => {
			const buttonData = elementDataConfig[i];
			/** @type {RectTuple} */
			let position;
			const positionOverride = buttonData?.position;
			if (positionOverride) {
				position = /** @type {RectTuple} */(buttonDataRef.position.map((j, idx) => {
					return positionOverride[idx] || j;
				}));
			} else {
				position = buttonDataRef.position;
			}

			return {
				...buttonDataRef,
				...(buttonData ?? {}),
				position,
			};
		});
	} else {
		elementData = CommonCloneDeep(defaults.elementData);
	}

	for (const buttonData of elementData) {
		if (buttonData.hidden === true) {
			buttonData.drawImage = false;
			buttonData.imagePath = null;
		} else if (buttonData.drawImage === false) {
			buttonData.imagePath = null;
		}
	}

	return {
		itemsPerPage,
		elementData,
		paginate: elementData.length > itemsPerPage,
		pageCount: Math.ceil(elementData.length / itemsPerPage),
	};
}

/**
 * Return a list with all active extended item options (be it via a subscreen or otherwise) for the passed item
 * @param item - The item in question
 * @returns The list of active extended item options
 */
const ExtendedItemGatherOptions = (function () {
	/** @type {(item: Item) => ExtendedItemOptionUnion[]} */
	function gatherOptions(item) {
		/** @type {ExtendedItemOptionUnion[]} */
		const options = [];
		const archetype = item.Asset.Archetype;
		const data = archetype && ExtendedItemGetData(item.Asset, archetype);
		const typeKeySet = new Set(Object.keys(item.Property?.TypeRecord ?? {}));
		if (data) {
			_dfs(data, item, options, typeKeySet);
		}
		for (const unknownLeftoverKey of typeKeySet) {
			delete item.Property?.TypeRecord?.[unknownLeftoverKey];
		}
		return options;
	}

	/**
	 * Depth first search helper for gathering all (subscreen-embedded) extended item options
	 * @private
	 * @param {AssetArchetypeData} data - The extended item data
	 * @param {Item} item - The item in question
	 * @param {ExtendedItemOption[]} optionList - The to-be populated list of extended item options
	 * @param {Set<string>} typeKeySet - A set of all type record keys minus the ones that have already been visited
	 * @returns {void}
	 */
	function _dfs(data, item, optionList, typeKeySet) {
		/** @type {ExtendedItemOption[]} */
		const newOptions = [];
		const archetype = data.archetype;
		switch (archetype) {
			case ExtendedArchetype.NOARCH: {
				typeKeySet.delete("noarch");
				newOptions.push({
					Name: "NewOption",
					OptionType: "NoArchItemOption",
					ParentData: data,
					Property: Object.fromEntries(CommonKeys(data.baselineProperty ?? {}).map(k => [k, item.Property?.[k]]))
				});
				break;
			}
			case ExtendedArchetype.TEXT:
				newOptions.push(TextItemConstructOptions(data, item).newOption);
				break;
			case ExtendedArchetype.VARIABLEHEIGHT:
				newOptions.push(VariableHeightConstructOptions(data, item).newOption);
				break;
			case ExtendedArchetype.VIBRATING:
			case ExtendedArchetype.TYPED: {
				typeKeySet.delete(data.name);
				const index = item.Property?.TypeRecord?.[data.name] ?? 0;
				newOptions.push(data.options[index] ?? data.options[0]);
				break;
			}
			case ExtendedArchetype.MODULAR:
				newOptions.push(...data.modules.map(mod => {
					typeKeySet.delete(mod.Key);
					const index = item.Property?.TypeRecord?.[mod.Key] ?? 0;
					return mod.Options[index] ?? mod.Options[0];
				}));
				break;
			default:
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				console.error(`Unsupported archetype: "${archetype}"`);
				break;
		}

		optionList.push(...newOptions);
		for (const option of newOptions) {
			if (option.ArchetypeData) {
				_dfs(option.ArchetypeData, item, optionList, typeKeySet);
			}
		}
	}

	return gatherOptions;
})();

/**
 * @param {Asset} asset
 * @param {ItemPropertiesConfig} properties
 * @returns {ItemProperties}
 */
function ExtendedItemParseProperties(asset, properties) {
	/** @type {ItemProperties} */
	const ret = CommonOmit(properties, ["DrawingTop", "DrawingLeft"]);
	if (properties.DrawingLeft) {
		ret.DrawingLeft = ItemParseTopLeft(properties.DrawingLeft, `${asset.Name}/DrawingLeft`);
	}
	if (properties.DrawingTop) {
		ret.DrawingTop = ItemParseTopLeft(properties.DrawingTop, `${asset.Name}/DrawingTop`);
	}
	return ret;
}

/**
 * Pre-process the passed extended item option and return a shallow copy.
 * @template {Pick<ExtendedItemOption, "Property" | "Prerequisite"> | Pick<ExtendedItemOptionConfig, "Property" | "Prerequisite">} T
 * @param {T} option The to-be processed extended item option
 * @param {Asset} asset
 * @returns {T}
 */
function ExtendedItemParseOptions(option, asset) {
	const parsedOption = { ...option };
	if (!parsedOption.Property) {
		return parsedOption;
	}
	const property = parsedOption.Property;

	if (parsedOption.Property.SetPose || parsedOption.Property.AllowActivePose) {
		const prereq = parsedOption.Prerequisite;
		const data = {
			AllowActivePose: property.AllowActivePose,
			SetPose: property.SetPose,
			Prerequisite: Array.isArray(prereq) ? prereq : (prereq != null ? [prereq] : undefined),
			Effect: property.Effect,
		};
		const { Prerequisite, AllowActivePose, SetPose } = AssetParsePosePrerequisite(data);
		parsedOption.Prerequisite = Prerequisite;
		property.AllowActivePose = AllowActivePose;
		property.SetPose = SetPose;
	}
	return parsedOption;
}

/**
 * Set an extended items properties based on the passed type record
 * @param {Character} C - The character in question
 * @param {AssetGroupName | Item} itemOrGroupName - The item or the item's group
 * @param {null | TypeRecord} typeRecord - The archetypical items type record. If `null` only apply `options.properties`
 * @param {object} [options]
 * @param {boolean} [options.push] - Whether to push the item changes to the server
 * @param {null | Character} [options.C_Source] - The character updating the item (if any)
 * @param {boolean} [options.refresh] - Whether to refresh the character after setting the item properties
 * @param {ItemProperties} [options.properties] - Extra item properties to be set on the item, the allowed list of properties being defined by {@link ExtendedItemData.baselineProperty}
 * @returns {void}
 */
function ExtendedItemSetOptionByRecord(C, itemOrGroupName, typeRecord=null, options) {
	const { push, C_Source, refresh, properties } = options || {};
	const item = typeof itemOrGroupName === "string" ? InventoryGet(C, itemOrGroupName) : itemOrGroupName;
	if (!item) return;

	/** @type {Set<keyof ItemProperties>} */
	const propertyKeys = new Set();
	const whiteListKeys = new Set(ExtendedItemInitPropertyIgnore);
	if (!item.Asset.EditOpacity) {
		whiteListKeys.delete("Opacity");
	}

	for (const key of whiteListKeys) {
		if (properties?.[key]) {
			propertyKeys.add(key);
		}
	}
	const previousOptions = item.Asset.Archetype == null ? [] : ExtendedItemGatherOptions(item);

	if (typeRecord != null) {
		const assetName = item.Asset.Name;
		const groupName = item.Asset.Group.Name;
		const newOptions = ExtendedItemGatherOptions({
			...item,
			Property: {
				...(item.Property || {}),
				TypeRecord: {
					...((item.Property && item.Property.TypeRecord) || {}),
					...typeRecord,
				},
			},
		});

		/** @type {TypedItemOption | ModularItemOption | VibratingItemOption} */
		let previousOption;
		for (const newOption of newOptions) {
			switch (newOption.OptionType) {
				case "ModularItemOption": {
					const module = newOption.ParentData.modules.find(m => m.Name === newOption.ModuleName);
					if (!module) {
						continue;
					}
					previousOption = /** @type {typeof previousOption[]} */(previousOptions).find(o => "ModuleName" in o && o.ModuleName === module.Name) || module.Options[0];
					break;
				}
				case "TypedItemOption":
				case "VibratingItemOption": {
					previousOption = /** @type {typeof previousOption[]} */(previousOptions).find(o => o.ParentData.name === newOption.ParentData.name) || newOption.ParentData.options[0];
					break;
				}
				default:
					continue;

			}

			const baseline = newOption.ParentData.baselineProperty;
			for (const prop of CommonKeys(baseline ?? {})) {
				propertyKeys.add(prop);
			}

			/** @type {ExtendedItemOption} */
			const option = newOption;
			/** @type {ExtendedItemOption} */
			const previous = previousOption;
			/** @type {ExtendedItemData<any>} */
			const data = newOption.ParentData;
			const requirementMessage = (C_Source && C_Source.IsPlayer())
				? ExtendedItemRequirementCheckMessage(data, C, item, option, previous)
				: TypedItemValidateOption(data, C, item, option, previous);
			if (requirementMessage && newOption.Name !== previousOption.Name) {
				console.error(`Cannot set option for ${groupName}:${assetName} to ${newOption.Name}: ${requirementMessage}`);
			} else {
				ExtendedItemSetOption(newOption.ParentData, C, item, newOption, previousOption, false, false);
			}
		}
	} else if (properties != null) {
		previousOptions.forEach(option => {
			const baseline = option.ParentData.baselineProperty;
			for (const prop of CommonKeys(baseline ?? {})) {
				propertyKeys.add(prop);
			}
		});
	} else {
		return;
	}

	if (properties != null) {
		const invalidProperties = CommonKeys(properties).filter(i => !propertyKeys.has(i));
		if (invalidProperties.length > 0) {
			console.error("Ignoring unsanctioned/invalid item properties", invalidProperties.sort());
		}
		CommonAssign((item.Property ??= {}), CommonPick(properties, propertyKeys));
	}

	if (refresh || refresh == null) {
		CharacterRefresh(C, push);
	}
	if (push) {
		ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);
	}
}

/**
 * Take an old {@link ItemProperties.Type} and convert it into a {@link ItemProperties.TypeRecord}.
 * @param {Asset} asset - The asset in question
 * @param {null | string} type - The to-be convert type string
 * @returns {TypeRecord} The newly created type record
 */
function ExtendedItemTypeToRecord(asset, type) {
	const archetype = asset.Archetype;
	const data = archetype && ExtendedItemGetData(asset, archetype);
	if (data == null || typeof type !== "string") {
		return {};
	}

	switch (data.archetype) {
		case ExtendedArchetype.TYPED:
		case ExtendedArchetype.VIBRATING: {
			const index = data.options.findIndex(o => o.Name === type) || 0;
			return { [data.name]: index };
		}
		case ExtendedArchetype.MODULAR: {
			/** @type {TypeRecord} */
			const typeRecord = {};
			const typeList = type.split(/([a-zA-Z]+\d+)/).filter(Boolean).map(i => i.split(/([a-zA-Z]+)(\d+)/));
			for (const [, k, i] of typeList) {
				const module = data.modules.find(m => m.Key === k);
				const parsedIndex = Number(i);
				const index = module && module.Options[parsedIndex] ? parsedIndex : null;
				if (index != null) {
					typeRecord[k] = index;
				}
			}
			return typeRecord;
		}
		default:
			return {};
	}
}

/**
 * Collect draw options for an item, given its current configuration
 * @param {Item} item
 * @returns {ExtendedItemOptionConfig["DrawOptions"]}
 */
function ExtendedItemGetDrawingOptions(item) {
	// Safety because ExtendedItemGatherOptions crashes if it's missing
	const options = ExtendedItemGatherOptions(item);
	/** @type {ExtendedItemOptionConfig["DrawOptions"]} */
	const init = { Mirror: false, Invert: false };
	return options.reduce((stack, value) => {
		if (value.DrawOptions?.Invert)
			stack.Invert = !stack.Invert;
		if (value.DrawOptions?.Mirror)
			stack.Mirror = !stack.Mirror;
		if (value.DrawOptions?.PoseMapping)
			stack.PoseMapping = { ...stack.PoseMapping, ...value.DrawOptions.PoseMapping };
		if (value.DrawOptions?.FixedPosition)
			stack.FixedPosition = true;
		return stack;
	}, init);
}

/**
 * Namespace with extended item functions for accessing the tighten/loosen menu.
 * @namespace
 */
const ExtendedItemTighten = {
	/**
	 * Draw function for tightening/loosening.
	 * @template {ExtendedItemOption} Option
	 * @param {ExtendedItemData<Option>} data The extended item data
	 * @param {Item} item The item in question
	 * @param {RectTuple} buttonCoords A 4-tuple with the buttons coordinates
	 */
	Draw: function ({ asset }, item, buttonCoords) {
		if (asset.AllowTighten && !TightenLoosenScreenBlacklist.has(CurrentScreen)) {
			const Difficulty = item.Difficulty ?? 0;
			DrawText(`${InterfaceTextGet("Tightness")} ${Difficulty}`, 1200, 140, "White", "Silver");

			const C = CharacterGetCurrent();
			const canUnlock = !!C && (Player.CanInteract() && (!InventoryItemHasEffect(item, "Lock") || DialogCanUnlock(C, item)));
			if (canUnlock) {
				DrawButton(...buttonCoords, InterfaceTextGet("AdjustTightness"), "White");
			} else {
				DrawButton(...buttonCoords, InterfaceTextGet("AdjustTightness"), "Gray", undefined, undefined, true);
			}
		}
	},

	/**
	 * Click function for tightening/loosening.
	 * @param {ExtendedItemData<any>} data The extended item data
	 * @param {Item} item The item in question
	 * @param {RectTuple} buttonCoords A 4-tuple with the buttons coordinates
	 * @returns {boolean} Whether the button was clicked or not
	 */
	Click: function ({ asset }, item, buttonCoords) {
		if (!MouseIn(...buttonCoords)) {
			return false;
		}

		const C = CharacterGetCurrent();
		const canUnlock = !!C && (Player.CanInteract() && (!InventoryItemHasEffect(item, "Lock") || DialogCanUnlock(C, item)));
		if (
			asset.AllowTighten
			&& canUnlock
			&& !TightenLoosenScreenBlacklist.has(CurrentScreen)
		) {
			DialogSetTightenLoosenItem(item);
		}
		return true;
	},
};
