"use strict";

/** @type {{ Group: AssetGroup, Assets: { Asset: Asset, Hidden: boolean, Blocked: boolean, Limited: boolean }[]}[]} */
var PreferenceVisibilityGroupList = [];
var PreferenceVisibilityGroupIndex = 0;
var PreferenceVisibilityAssetIndex = 0;
var PreferenceVisibilityHideChecked = false;
var PreferenceVisibilityBlockChecked = false;
var PreferenceVisibilityCanBlock = true;
/**
 * Bound to screen lifetime
 * @type {Asset}
 */
var PreferenceVisibilityPreviewAsset;
/** @deprecated See {@link PreferenceSubscreenVisibilityOnResetClick}. */
var PreferenceVisibilityResetClicked = false;
/** @type {Partial<Record<AssetFullPath, ItemPermissions>>} */
var PreferenceVisibilityRecord = {};

const PreferenceSubscreenVisibilityIDs = Object.freeze({
	grid: "preference-visibility-grid",
	controls: "preference-visibility-controls",
	groupRow: "preference-visibility-group-row",
	assetRow: "preference-visibility-asset-row",
	groupSelect: "preference-visibility-group",
	assetSelect: "preference-visibility-asset",
	hideCheckbox: "preference-visibility-hide",
	blockCheckbox: "preference-visibility-block",
	hideWarning: "preference-visibility-hide-warning",
	resetButton: "preference-visibility-reset",
	preview: "preference-visibility-preview",
	locked: "preference-visibility-locked",
	saveButton: "preference-visibility-save",
	cancelButton: "preference-visibility-cancel",
});

const PreferenceVisibilityHiddenWarningIcon = "./Screens/Character/Player/HiddenItem.png";

/**
 * Handles the loading of the visibility settings of a player
 * @returns {void} - Nothing
 */
function PreferenceSubscreenVisibilityLoad() {
	ElementWrap(PreferenceIDs.exit)?.toggleAttribute("hidden", true);
	PreferenceVisibilityRecord = { ...Player.PermissionItems };
	PreferenceVisibilityGroupList = [];
	const hideableGroups = AssetGroup.filter(g => AssetGroupIsHideable(g));
	for (const group of hideableGroups) {
		const hideableAssets = [];
		for (const asset of group.Asset) {
			if (!asset.Visible) continue;
			hideableAssets.push({
				Asset: asset,
				Hidden: CharacterAppearanceItemIsHidden(asset.Name, group.Name),
				Blocked: InventoryIsPermissionBlocked(Player, asset.Name, group.Name),
				Limited: InventoryIsPermissionLimited(Player, asset.Name, group.Name),
			});
		}
		if (hideableAssets.length > 0) {
			PreferenceVisibilityGroupList.push({
				Group: group,
				Assets: hideableAssets.sort((a, b) =>
					a.Asset.Description.localeCompare(b.Asset.Description))
			});
		}
	}
	PreferenceVisibilityGroupList.sort((a, b) =>
		a.Group.Category.localeCompare(b.Group.Category) || a.Group.Description.localeCompare(b.Group.Description)
	);
	PreferenceVisibilityGroupIndex = 0;
	PreferenceVisibilityAssetIndex = 0;

	PreferenceSubscreenVisibilityBuildLayout();
	PreferenceVisibilityAssetChanged(true);
	PreferenceSubscreenVisibilityRefreshUI();
}

/**
 * Sets the item visibility preferences for a player. Redirected to from the main Run function if the player is in the
 * visibility settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenVisibilityRun() {
	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles the click events for the visibility settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenVisibilityClick() {
}

function PreferenceSubscreenVisibilityUnload() {
	PreferenceVisibilityGroupList = [];
	PreferenceVisibilityRecord = {};
}

/**
 * Positions the visibility subscreen elements on resize.
 */
function PreferenceSubscreenVisibilityResize() {
	const { x, y } = PreferenceSubscreenMainGrid;
	const grid = ElementWrap(PreferenceSubscreenVisibilityIDs.grid);
	if (grid) ElementSetPosition(grid, x, y);
	const locked = ElementWrap(PreferenceSubscreenVisibilityIDs.locked);
	if (locked) ElementSetPosition(locked, x, y);
}

/**
 * Trigger a subscreen exit
 * @param {boolean} SaveChanges - If TRUE, this will commit the configuration
 * @returns {void} - Nothing
 */
function PreferenceVisibilityExit(SaveChanges) {
	if (SaveChanges) ServerPlayerBlockItemsSync();
	PreferenceVisibilityRecord = {};

	CommonPromiseCatch(PreferenceSubscreenExit());
}

/**
 * Builds the DOM layout for the visibility subscreen.
 */
function PreferenceSubscreenVisibilityBuildLayout() {
	const subscreen = ElementWrap(PreferenceIDs.subscreen);
	if (!subscreen) return;

	// In Extreme mode, only show a notice and skip building the controls
	if (Player.GetDifficulty() > 2) {
		ElementCreate({
			tag: "p",
			classList: ["preference-visibility-locked"],
			attributes: { id: PreferenceSubscreenVisibilityIDs.locked },
			children: [TextGet("VisibilityLocked")],
			parent: subscreen,
		});
		ElementWrap(PreferenceIDs.exit)?.toggleAttribute("hidden", false);
		return;
	}

	const groupOptions = PreferenceSubscreenVisibilityGetGroupOptions();
	const assetOptions = PreferenceSubscreenVisibilityGetAssetOptions(PreferenceVisibilityGroupIndex);

	const groupSelect = ElementCreateSearchableDropdown(
		PreferenceSubscreenVisibilityIDs.groupSelect,
		groupOptions,
		(value) => PreferenceSubscreenVisibilityOnGroupChange(/** @type {AssetGroupName} */(value)),
		{
			value: groupOptions[PreferenceVisibilityGroupIndex]?.value,
			placeholder: TextGet("VisibilityGroup"),
			searchPlaceholder: TextGet("VisibilitySearchPlaceholder"),
			emptyText: TextGet("VisibilityNoResults"),
		}
	);

	const assetSelect = ElementCreateSearchableDropdown(
		PreferenceSubscreenVisibilityIDs.assetSelect,
		assetOptions,
		(value) => PreferenceSubscreenVisibilityOnAssetChange(value),
		{
			value: assetOptions[PreferenceVisibilityAssetIndex]?.value,
			placeholder: TextGet("VisibilityAsset"),
			searchPlaceholder: TextGet("VisibilitySearchPlaceholder"),
			emptyText: TextGet("VisibilityNoResults"),
		}
	);

	const groupRow = ElementCreate({
		tag: "div",
		classList: ["preference-visibility-row"],
		attributes: { id: PreferenceSubscreenVisibilityIDs.groupRow },
		children: [
			{
				tag: "label",
				attributes: { for: `${PreferenceSubscreenVisibilityIDs.groupSelect}-trigger` },
				children: [TextGet("VisibilityGroup")],
			},
			groupSelect,
		],
	});

	const assetRow = ElementCreate({
		tag: "div",
		classList: ["preference-visibility-row"],
		attributes: { id: PreferenceSubscreenVisibilityIDs.assetRow },
		children: [
			{
				tag: "label",
				attributes: { for: `${PreferenceSubscreenVisibilityIDs.assetSelect}-trigger` },
				children: [TextGet("VisibilityAsset")],
			},
			assetSelect,
		],
	});

	const hideCheckbox = ElementCheckbox.CreateLabelled(
		PreferenceSubscreenVisibilityIDs.hideCheckbox,
		TextGet("VisibilityCheckboxHide"),
		function () {
			PreferenceVisibilityHideChange();
			if (PreferenceVisibilityHideChecked != PreferenceVisibilityBlockChecked && PreferenceVisibilityCanBlock) {
				PreferenceVisibilityBlockChange();
			}
			PreferenceSubscreenVisibilityRefreshUI();
		},
		{ checked: PreferenceVisibilityHideChecked }
	);

	const blockCheckbox = ElementCheckbox.CreateLabelled(
		PreferenceSubscreenVisibilityIDs.blockCheckbox,
		TextGet("VisibilityCheckboxBlock"),
		function () {
			if (!PreferenceVisibilityCanBlock) return;
			PreferenceVisibilityBlockChange();
		},
		{ checked: PreferenceVisibilityBlockChecked, disabled: !PreferenceVisibilityCanBlock }
	);

	const hideWarning = ElementCreate({
		tag: "div",
		classList: ["preference-visibility-warning"],
		attributes: { id: PreferenceSubscreenVisibilityIDs.hideWarning, concealed: !PreferenceVisibilityHideChecked },
		children: [
			{
				tag: "img",
				attributes: { src: PreferenceVisibilityHiddenWarningIcon, alt: "" },
			},
			{
				tag: "span",
				children: [TextGet("VisibilityWarning")],
			},
		],
	});

	const resetButton = ElementButton.Create(
		PreferenceSubscreenVisibilityIDs.resetButton,
		() => PreferenceSubscreenVisibilityOnResetClick(),
		{
			label: TextGet("VisibilityReset"),
			labelPosition: "center",
		}
	);

	const controls = ElementCreate({
		tag: "fieldset",
		classList: ["preference-visibility-controls"],
		attributes: { id: PreferenceSubscreenVisibilityIDs.controls },
		children: [groupRow, assetRow, hideCheckbox, blockCheckbox, resetButton],
	});

	const previewAsset = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Asset;

	const preview = ElementButton.CreateForAsset(
		null,
		previewAsset,
		Player,
		null,
		null,
		{
			button: { attributes: { id: PreferenceSubscreenVisibilityIDs.preview } },
		},
	);

	ElementCreate({
		tag: "div",
		classList: ["preference-visibility-grid"],
		attributes: { id: PreferenceSubscreenVisibilityIDs.grid },
		children: [controls, preview, hideWarning],
		parent: subscreen,
	});

	// Add Save / Cancel buttons to the menubar
	const menubar = ElementWrap(`${PreferenceIDs.subscreen}-menu`);
	if (menubar) {
		const cancelButton = ElementButton.Create(
			PreferenceSubscreenVisibilityIDs.cancelButton,
			() => PreferenceVisibilityExit(false),
			{ image: "Icons/Cancel.png", tooltip: TextGet("LeaveNoSave") }
		);
		const saveButton = ElementButton.Create(
			PreferenceSubscreenVisibilityIDs.saveButton,
			() => PreferenceSubscreenVisibilityCommit(),
			{ image: "Icons/Accept.png", tooltip: TextGet("LeaveSave") }
		);
		menubar.append(cancelButton, saveButton);
	}
	PreferenceSubscreenVisibilityRefreshPreview();
}

/**
 * Builds the dropdown options for the group selector.
 * @returns {{ value: AssetGroupName, label: string, group: "Appearance" | "Item" | "Script" }[]}
 */
function PreferenceSubscreenVisibilityGetGroupOptions() {
	return PreferenceVisibilityGroupList.map(({ Group }) => ({
		value: Group.Name,
		label: Group.Description,
		group: Group.Category,
	}));
}

/**
 * Builds the dropdown options for the asset selector based on the currently selected group.
 * @param {number} groupIndex
 * @returns {{ value: AssetName, label: string }[]}
 */
function PreferenceSubscreenVisibilityGetAssetOptions(groupIndex) {
	const group = PreferenceVisibilityGroupList[groupIndex];
	if (!group) return [];
	return group.Assets.map(({ Asset }) => ({
		value: Asset.Name,
		label: Asset.Description,
	}));
}

/**
 * Handles selection changes on the group dropdown.
 * @param {AssetGroupName} value
 */
function PreferenceSubscreenVisibilityOnGroupChange(value) {
	const newIndex = PreferenceVisibilityGroupList.findIndex(g => g.Group.Name === value);
	if (newIndex < 0) return;
	PreferenceVisibilityGroupIndex = newIndex;
	PreferenceVisibilityAssetIndex = 0;

	const assetOptions = PreferenceSubscreenVisibilityGetAssetOptions(PreferenceVisibilityGroupIndex);
	const dropdown = /** @type {ElementSearchableDropdown.SearchableDropdownElement | HTMLSelectElement} */ (ElementWrap(PreferenceSubscreenVisibilityIDs.assetSelect));
	const dropdownReplacement = ElementCreateSearchableDropdown(
		null,
		assetOptions,
		(i) => PreferenceSubscreenVisibilityOnAssetChange(i),
		{
			value: assetOptions[PreferenceVisibilityAssetIndex]?.value,
			placeholder: TextGet("VisibilityAsset"),
			searchPlaceholder: TextGet("VisibilitySearchPlaceholder"),
			emptyText: TextGet("VisibilityNoResults"),
		}
	);
	dropdown.replaceWith(dropdownReplacement);
	dropdownReplacement.id = PreferenceSubscreenVisibilityIDs.assetSelect;

	PreferenceVisibilityAssetChanged(true);
	PreferenceSubscreenVisibilityRefreshUI();
}

/**
 * Handles selection changes on the asset dropdown.
 * @param {AssetName} value
 */
function PreferenceSubscreenVisibilityOnAssetChange(value) {
	const group = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex];
	if (!group) return;
	const newIndex = group.Assets.findIndex(a => a.Asset.Name === value);
	if (newIndex < 0) return;
	PreferenceVisibilityAssetIndex = newIndex;

	PreferenceVisibilityAssetChanged(true);
	PreferenceSubscreenVisibilityRefreshUI();
}

/**
 * Prompts via the browser confirmation dialog before clearing all Hidden flags
 * and exiting with save.
 */
function PreferenceSubscreenVisibilityOnResetClick() {
	if (!window.confirm(TextGet("VisibilityResetDescription"))) return;

	Object.values(Player.PermissionItems).forEach(i => { if (i) i.Hidden = false; });
	PreferenceVisibilityExit(true);
}

/**
 * Commits the staged permission record to the player and exits the screen, saving changes.
 */
function PreferenceSubscreenVisibilityCommit() {
	for (const [key, permission] of CommonEntries(PreferenceVisibilityRecord)) {
		if (!permission) continue;
		Player.PermissionItems[key] ??= PreferencePermissionGetDefault();
		Player.PermissionItems[key].Hidden = permission.Hidden;
		Player.PermissionItems[key].Permission = permission.Permission;
	}
	PreferenceVisibilityExit(true);
}

/**
 * Synchronises the DOM controls with the current state.
 */
function PreferenceSubscreenVisibilityRefreshUI() {
	const hideCheckbox = /** @type {HTMLInputElement | null} */ (ElementWrap(PreferenceSubscreenVisibilityIDs.hideCheckbox));
	if (hideCheckbox) hideCheckbox.checked = PreferenceVisibilityHideChecked;

	const blockCheckbox = /** @type {HTMLInputElement | null} */ (ElementWrap(PreferenceSubscreenVisibilityIDs.blockCheckbox));
	if (blockCheckbox) {
		blockCheckbox.checked = PreferenceVisibilityBlockChecked;
		blockCheckbox.disabled = !PreferenceVisibilityCanBlock;
	}

	ElementWrap(PreferenceSubscreenVisibilityIDs.hideWarning)?.toggleAttribute("concealed", !PreferenceVisibilityHideChecked);

	const groupDropdown = /** @type {ElementSearchableDropdown.SearchableDropdownElement | HTMLSelectElement} */ (ElementWrap(PreferenceSubscreenVisibilityIDs.groupSelect));
	const currentGroup = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex]?.Group.Name;
	if (groupDropdown && currentGroup) {
		if (groupDropdown instanceof HTMLSelectElement) {
			groupDropdown.value = currentGroup;
		} else {
			groupDropdown.bcSetNewValue?.(currentGroup);
		}
	}

	const assetDropdown = /** @type {ElementSearchableDropdown.SearchableDropdownElement | HTMLSelectElement} */ (ElementWrap(PreferenceSubscreenVisibilityIDs.assetSelect));
	const currentAsset = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex]?.Assets[PreferenceVisibilityAssetIndex]?.Asset.Name;
	if (assetDropdown && currentAsset) {
		if (assetDropdown instanceof HTMLSelectElement) {
			assetDropdown.value = currentAsset;
		} else {
			assetDropdown.bcSetNewValue?.(currentAsset);
		}
	}

	PreferenceSubscreenVisibilityRefreshPreview();
}

/**
 * Updates the asset preview image and description.
 */
function PreferenceSubscreenVisibilityRefreshPreview() {
	const preview = ElementWrap(PreferenceSubscreenVisibilityIDs.preview);
	if (!preview) return;

	const asset = PreferenceVisibilityPreviewAsset;
	if (!asset) return;

	const newPreview = ElementButton.CreateForAsset(
		null,
		asset,
		Player,
		null,
		{
			role: "none",
			disabled: true,
			noStyling: true,
			labelPosition: "bottom"
		},
		{
			button: { classList: ["preference-visibility-preview"], attributes: { id: PreferenceSubscreenVisibilityIDs.preview } },
			img: { classList: ["preference-visibility-preview-image"] },
			label: { classList: ["preference-visibility-preview-label"] },
		},
	);

	newPreview.toggleAttribute("data-hidden", PreferenceVisibilityHideChecked);
	preview.replaceWith(newPreview);
}

/**
 * Update the checkbox settings and asset preview image based on the new asset selection
 * @param {boolean} RefreshCheckboxes - If TRUE, load the new asset settings. If FALSE, a checkbox was just manually
 *     changed so don't refresh them
 * @returns {void} - Nothing
 */
function PreferenceVisibilityAssetChanged(RefreshCheckboxes) {
	const CurrAsset = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex];

	if (RefreshCheckboxes) {
		PreferenceVisibilityHideChecked = CurrAsset.Hidden;
		PreferenceVisibilityBlockChecked = CurrAsset.Blocked;
	}

	// Can't change the Block setting if the item is worn or set to limited permissions
	const WornItem = InventoryGet(Player, PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Group.Name);
	PreferenceVisibilityCanBlock = (WornItem == null || WornItem.Asset.Name != CurrAsset.Asset.Name) && !CurrAsset.Limited;

	PreferenceVisibilityPreviewAsset = CurrAsset.Asset;
}

/**
 * Toggles the Hide checkbox state and updates the staged permission record.
 * @returns {void} - Nothing
 */
function PreferenceVisibilityHideChange() {
	PreferenceVisibilityHideChecked = !PreferenceVisibilityHideChecked;
	PreferenceVisibilityCheckboxChanged(PreferenceVisibilityRecord, PreferenceVisibilityHideChecked, "Hidden");
	PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Hidden = PreferenceVisibilityHideChecked;
	PreferenceVisibilityAssetChanged(false);
}

/**
 * Toggles the Block checkbox state and updates the staged permission record.
 * @returns {void} - Nothing
 */
function PreferenceVisibilityBlockChange() {
	PreferenceVisibilityBlockChecked = !PreferenceVisibilityBlockChecked;
	PreferenceVisibilityCheckboxChanged(PreferenceVisibilityRecord, PreferenceVisibilityBlockChecked, "Block");
	PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Blocked = PreferenceVisibilityBlockChecked;
	PreferenceVisibilityAssetChanged(false);
}

/**
 * Adds or removes the current item to/from the list based on the new state of the corresponding checkbox
 * @param {Partial<Record<AssetFullPath, ItemPermissions>>} permissionRecord - The record to add or remove the item from
 * @param {boolean} CheckSetting - The new true/false setting of the checkbox
 * @param {"Hidden" | "Block"} Type
 */
function PreferenceVisibilityCheckboxChanged(permissionRecord, CheckSetting, Type) {
	const CurrGroup = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Group.Name;
	const CurrAsset = PreferenceVisibilityGroupList[PreferenceVisibilityGroupIndex].Assets[PreferenceVisibilityAssetIndex].Asset.Name;
	const permission = permissionRecord[`${CurrGroup}/${CurrAsset}`] ??= PreferencePermissionGetDefault();
	switch (Type) {
		case "Block":
			permission.Permission = CheckSetting ? "Block" : "Default";
			break;
		case "Hidden":
			permission.Hidden = CheckSetting;
			break;
	}
}
