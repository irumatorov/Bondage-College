"use strict";

/** The module storing where the plushie is (in hands, on head or on the floor) */
const InventoryItemHandheldPlushiesPositionModule = "Position";

/** The first menu page, leading to the position or to the plushie groups ({@link ModularItemBase}) */
const InventoryItemHandheldPlushiesMenu = "Menu";

/** The buttons of the first menu page, and the page each one leads to */
const InventoryItemHandheldPlushiesMenuButtons = [
	{
		page: InventoryItemHandheldPlushiesPositionModule,
		position: /** @type {RectTuple} */ ([
			...ExtendedXYWithoutImages[2][0],
			225,
			55,
		]),
	},
	{
		page: ModularItemBase,
		position: /** @type {RectTuple} */ ([
			...ExtendedXYWithoutImages[2][1],
			225,
			55,
		]),
	},
];

/**
 * Gets the modules holding the plushies, which are all of them but the position
 * @param {ModularItemData} data
 * @returns {ModularItemModule[]}
 */
function InventoryItemHandheldPlushiesGetGroups(data) {
	return data.modules.filter(
		(module) => module.Name !== InventoryItemHandheldPlushiesPositionModule,
	);
}

/**
 * Gets the draw data of the plushie groups page, laid out as if the groups were the only modules
 * @param {ModularItemData} data
 * @returns {ExtendedItemDrawData<ElementMetaData.Modular>}
 */
function InventoryItemHandheldPlushiesGetGroupsDrawData(data) {
	return TypedItemGetDrawData(
		data.asset,
		undefined,
		InventoryItemHandheldPlushiesGetGroups(data),
		{ drawImage: false, imagePath: null },
	);
}

/** @type {ExtendedItemScriptHookCallbacks.Load<ModularItemData>} */
function InventoryItemHandheldPlushiesLoadHook(data, originalFunction) {
	originalFunction();
	ModularItemModuleTransition(InventoryItemHandheldPlushiesMenu, data);
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemHandheldPlushiesDrawHook(data, originalFunction) {
	if (data.currentModule === InventoryItemHandheldPlushiesMenu) {
		if (!DialogFocusItem) {
			return;
		}
		ExtendedItemDrawHeader(DialogFocusItem);
		DrawText(DialogExtendedMessage, 1500, 375, "#fff", "808080");
		const icon = ExtendedItemPermissionMode
			? "Icons/DialogNormalMode.png"
			: "Icons/DialogPermissionMode.png";
		const label = InterfaceTextGet(
			ExtendedItemPermissionMode
				? "DialogMenuNormalMode"
				: "DialogMenuPermissionMode",
		);
		DrawButton(1775, 25, 90, 90, "", "White", icon, label);
		for (const { page, position } of InventoryItemHandheldPlushiesMenuButtons) {
			DrawButton(
				...position,
				AssetTextGet(data.dialogPrefix.module + page),
				"White",
			);
		}
	} else if (data.currentModule === ModularItemBase) {
		const currentValues = ModularItemParseCurrent(
			data,
			DialogFocusItem?.Property?.TypeRecord,
		);
		/** @type {ModularItemButtonDefinition[]} */
		const buttonDefinitions = InventoryItemHandheldPlushiesGetGroups(data).map(
			(module) => [
				module,
				module.Options[currentValues[data.modules.indexOf(module)]],
				data.dialogPrefix.module,
			],
		);
		ModularItemDrawCommon(
			ModularItemBase,
			buttonDefinitions,
			data,
			InventoryItemHandheldPlushiesGetGroupsDrawData(data),
		);
	} else {
		originalFunction();
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>} */
function InventoryItemHandheldPlushiesClickHook(data, originalFunction) {
	const currentModule = data.currentModule;
	if (currentModule === InventoryItemHandheldPlushiesMenu) {
		if (MouseIn(1885, 25, 90, 90)) {
			DialogLeaveFocusItem();
			ExtendedItemPermissionMode = false;
			return;
		} else if (MouseIn(1775, 25, 90, 90)) {
			if (ExtendedItemPermissionMode) {
				ChatRoomCharacterUpdate(Player);
				ExtendedItemRequirementCheckMessageMemo.clearCache();
			}
			ExtendedItemPermissionMode = !ExtendedItemPermissionMode;
			return;
		}
		const button = InventoryItemHandheldPlushiesMenuButtons.find(
			({ position }) => MouseIn(...position),
		);
		if (button) {
			ModularItemModuleTransition(button.page, data);
		}
	} else if (currentModule === ModularItemBase) {
		const groups = InventoryItemHandheldPlushiesGetGroups(data);
		const drawData = InventoryItemHandheldPlushiesGetGroupsDrawData(data);
		ModularItemClickCommon(
			data,
			drawData,
			() =>
				ModularItemModuleTransition(InventoryItemHandheldPlushiesMenu, data),
			(i) => {
				const module = groups[i];
				if (module) {
					ModularItemModuleTransition(module.Name, data);
					return true;
				}
				return false;
			},
			(delta) => ModularItemChangePage(ModularItemBase, delta, data, drawData),
			Math.min(drawData.pageCount - 1, data.pages[ModularItemBase] ?? 0),
		);
	} else {
		originalFunction();
		// Leaving the position page goes back to the first menu page, not to the plushie groups
		if (
			currentModule === InventoryItemHandheldPlushiesPositionModule &&
			data.currentModule === ModularItemBase
		) {
			ModularItemModuleTransition(InventoryItemHandheldPlushiesMenu, data);
		}
	}
}

/** @type {ExtendedItemScriptHookCallbacks.SetOption<ModularItemData, ModularItemOption>} */
function InventoryItemHandheldPlushiesSetOptionHook(
	data,
	originalFunction,
	C,
	item,
	newOption,
	previousOption,
	push,
	refresh,
) {
	// Toggle the new option within the active module as per usual
	originalFunction?.(C, item, newOption, previousOption, false, false);

	// Set the options within all other plushie modules to 0, unless only the position changed
	const currentModuleName = newOption.ModuleName;
	const positionChanged =
		currentModuleName === InventoryItemHandheldPlushiesPositionModule;
	const currentOptionIndices = ModularItemParseCurrent(
		data,
		item.Property?.TypeRecord ?? null,
	);
	for (const [
		otherModuleIndex,
		otherOptionIndex,
	] of currentOptionIndices.entries()) {
		// Make sure to not reset the current module and check if there is actually anything to reset (i.e. non-zero option index)
		const otherModuleName = data.modules[otherModuleIndex].Name;
		if (
			!positionChanged &&
			otherModuleName !== InventoryItemHandheldPlushiesPositionModule &&
			otherModuleName !== currentModuleName &&
			otherOptionIndex !== 0
		) {
			const otherOldOption =
				data.modules[otherModuleIndex].Options[otherOptionIndex];
			const otherNewOption = data.modules[otherModuleIndex].Options[0];
			originalFunction?.(C, item, otherNewOption, otherOldOption, false, false);
		}
	}
	CharacterRefresh(C, push, false);
}
