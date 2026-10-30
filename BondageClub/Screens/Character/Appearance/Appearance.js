"use strict";
var AppearanceBackground = "Dressing";
/** Offset for the group view */
var CharacterAppearanceOffset = 0;
/** Number of entries per group page */
var CharacterAppearanceNumGroupPerPage = 9;

/** Number of entries per cloth page */
var CharacterAppearanceNumClothPerPage = 9;

/** @deprecated */
var CharacterAppearanceWardrobeNumPerPage = 6;

var CharacterAppearanceHeaderText = "";
var CharacterAppearanceHeaderTextTime = 0;
/**
 * The appearance the character we're editing had when entering the screen.
 *
 * Must stay valid for as long as the screen is up.
 *
 * @type {string}
 */
var CharacterAppearanceBackup;
/**
 * Backup of the current appearance; used when canceling out of loading a wardrobe outfit.
 *
 * @type {undefined | string}
 * @deprecated
 */
var CharacterAppearanceInProgressBackup = undefined;

/**
 * The list of all customizable groups
 * @type {AssetGroup[]}
 */
var CharacterAppearanceGroups = [];
/**
 * The list of all assets (owned or available)
 * @deprecated
 * @type {never[]}
 */
var CharacterAppearanceAssets = [];
/**
 * The list of all appearance assets (owned or available) grouped by group name
 *
 * Only valid when the Appearance screen is up.
 * @type {Map<AssetGroupBodyName, Asset[]>}
 */
var CharacterAppearanceGroupedAssets = new Map();
/** @type {AssetGroupName} */
var CharacterAppearanceColorPickerGroupName = /** @type {never} */ (null);
/** @type {ItemColor | undefined} */
var CharacterAppearanceColorPickerBackup = undefined;
var CharacterAppearanceColorPickerRefreshTimer = undefined;
/**
 * The character we're editing the appearance of.
 *
 * Must stay valid for as long as the screen is up.
 *
 * @type {Character}
 */
var CharacterAppearanceSelection;
/**
 * The callback to perform when closing the appearance screen.
 * Must stay valid for as long as the screen is up.
 *
 * @type {((accept: boolean) => void)}
 */
var CharacterAppearanceResultCallback;
/** @type {ScreenSpecifier} */
var CharacterAppearanceReturnScreen = ["Room", "MainHall"];
/** @deprecated */
var CharacterAppearanceWardrobeOffset = 0;
/** @deprecated */
var CharacterAppearanceWardrobeText = "";
/** @deprecated */
var CharacterAppearanceWardrobeName = "";
var CharacterAppearanceForceUpCharacter = -1;
/** @type {"" | ExpressionNameMap["Emoticon"]} */
var CharacterAppearancePreviousEmoticon = "";
/** @type {"" | "Cloth" | "Color" | "Permissions"} */
var CharacterAppearanceMode = "";
/** @type {"" | "Cloth" | "Color" | "Permissions"} */
var CharacterAppearanceMenuMode = "";
/** @type {null | Item} */
var CharacterAppearanceCloth = null;
/** @type {AssetGroup | null} */
var CharacterAppearanceSelectedGroup = null;
/** @type {AppearanceMenuButtonType[]} */
var AppearanceMenu = [];
/** @type {Character[]} */
var AppearancePreviews = [];
var AppearanceUseCharacterInPreviewsSetting = false;

/**
 * List of item indices collected for swapping.
 * @type {number[]}
 * @deprecated
 */
let AppearanceWardrobeReorderList = [];

/**
 * @type {WardrobeReorderType}
 * @deprecated
 */
let AppearanceWardrobeReorderMode = "None";

const CanvasUpperOverflow = 700;
const CanvasLowerOverflow = 150;
/** The draw width of the character canvas */
const CanvasDrawWidth = 500;
/** The draw height of the character canvas */
const CanvasDrawHeight = 1000 + CanvasUpperOverflow + CanvasLowerOverflow;

const AppearancePermissionColors = {
	red: ["pink", "red"],
	amber: ["#fed8b1", "orange"],
	green: ["lime", "green"],
};

/**
 * Builds all the assets that can be used to dress up the character
 * @param {Character} C - The character whose appearance is modified
 * @deprecated Use {@link AssetGetAllAppearanceForCharacter} instead
 * @returns {void} - Nothing
 */
function CharacterAppearanceBuildAssets(C) {}

/**
 * Makes sure the character appearance is valid from inventory and asset requirement. This function is called during the login process.
 * @param {PlayerCharacter} C - The character whose appearance is checked
 * @returns {void} - Nothing
 */
function CharacterAppearanceValidate(C) {

	var Refresh = false;
	// We iterate over a copy because we're gonna remove, possibly layered things, and the index cannot be stable
	const appCopy = [...C.Appearance];
	for (let idx = appCopy.length - 1; idx >= 0; idx--) {
		const A = appCopy[idx];
		if (A.Asset.Group.IsAppearance() && !InventoryAvailable(C, A.Asset.Name, A.Asset.Group.Name)) {
			// Remove any appearance item that's not in inventory
			InventoryRemove(C, A.Asset.Group.Name, false);
			Refresh = true;
		} else if ((LogQuery("Committed", "Asylum") || !Player.GameplaySettings.DisableAutoRemoveLogin) && A.Asset.RemoveAtLogin) {
			// Remove items flagged as "Remove At Login"
			InventoryRemove(C, A.Asset.Group.Name, false);
			Refresh = true;
		}
	}


	// Dress back if there are missing appearance items
	for (const group of AssetGroup) {
		if (group.AllowNone || InventoryGet(C, group.Name) !== null) continue;
		for (const asset of group.Asset) {
			CharacterAppearanceSetItem(C, group.Name, asset, group.ColorSchema[0]);
			Refresh = true;
			break;
		}
	}

	// Updates the character's leash state
	CharacterRefreshLeash(C);

	// If we must refresh the character and push the appearance to the server
	if (Refresh) CharacterRefresh(C);

}

/**
 * Resets the character to it's default appearance
 * @param {Character} C - The character to redress to its default appearance
 * @returns {void} - Nothing
 */
function CharacterAppearanceSetDefault(C) {

	// Resets the current appearance and prepares the assets
	if (!AppearanceGroupAllowed(C, "ALL")) return;
	C.Appearance = [];
	C.PoseMapping = {};
	const assetGroups = AssetGetAllAppearanceForCharacter(C);

	// For each items in the character appearance assets
	for (const group of assetGroups.keys()) {
		const assets = assetGroups.get(group) ?? [];
		if (!assets[0].Group.IsDefault) continue;

		// If there's no item in a slot, the first one becomes the default
		const MustWear = InventoryGet(C, group) === null;

		// No item, we wear it with the default color
		if (MustWear) {
			CharacterAppearanceSetItem(
				C,
				group,
				assets[0],
			);
		}
	}

	// Loads the new character canvas and just refresh the entire thing
	CharacterRefresh(C, false, false);
}

/**
 * Checks wether an item group is required for this asset
 * @param {Character} C - The character, whose assets are used for the check
 * @param {AssetGroupBodyName} GroupName - The name of the group to check
 * @returns {boolean} - Returns TRUE if the item group is required from
 */
function CharacterAppearanceRequired(C, GroupName) {
	for (let A = 0; A < C.Appearance.length; A++)
		if ((C.Appearance[A].Asset.Require != null) && (C.Appearance[A].Asset.Require.indexOf(GroupName) >= 0))
			return true;
	return false;
}

/**
 * Checks, wether the item group must be hidden for a certain asset
 * @param {Character} C - The character, whose assets are used for the check
 * @param {AssetGroupName} GroupName - The name of the group to check
 * @returns {boolean} - Returns TRUE if the item group must be hidden and not chosen
 */
function CharacterAppearanceMustHide(C, GroupName) {
	return C.Appearance.some(item => item.Asset.Hide?.includes(GroupName) || item.Property?.Hide?.includes(GroupName));
}

/**
 * Sets a full random set of items for a character. Only items that do not have the "Random" property set to false will be used.
 * @param {Character} C - The character to dress
 * @param {boolean} [ClothOnly] - Defines, if only clothes should be used
 * @param {boolean} [refresh] - Whether the character should be refreshed.
 * @returns {void} - Nothing
 */
function CharacterAppearanceFullRandom(C, ClothOnly=false, refresh=true) {

	const allAssetsGroups = AssetGetAllAppearanceForCharacter(C);

	// Clear the current appearance
	const items = C.Appearance.filter(item => item.Asset.Group.IsAppearance() && (!ClothOnly || item.Asset.Group.AllowNone) && AppearanceGroupAllowed(C, item.Asset.Group.Name));
	InventoryRemoveItems(C, items, { refresh: false });

	// Need to add chest and genitals first to allow associated Has<BodyPart> prerequisites on clothing to pass
	const firstGroups = ["BodyUpper", "Pussy"];
	const assetGroupList = ClothOnly ? AssetGroup :
		AssetGroup.filter(g => firstGroups.includes(g.Name)).concat(AssetGroup.filter(g => !firstGroups.includes(g.Name)));

	// For each item group (non default items only show at a 8% rate, if it can occasionally happen)
	for (const group of assetGroupList) {
		if (group.IsAppearance() && (group.IsDefault || (group.Random && Math.random() < 0.08) || CharacterAppearanceRequired(C, group.Name)) && (!CharacterAppearanceMustHide(C, group.Name) || !group.AllowNone) && InventoryGet(C, group.Name) === null && AppearanceGroupAllowed(C, group.Name)) {

			// Get the parent size
			const ParentSize = group.ParentSize != "" ? InventoryGet(C, group.ParentSize)?.Asset.Name : "";

			// Check for a parent
			/** @type {Asset[]} */
			const R = [];
			for (const asset of allAssetsGroups.get(group.Name) ?? []) {
				if (asset.ParentItem && (ParentSize == "") || (asset.Name === ParentSize)) {
					const parentAsset = C.Appearance.find(item => item.Asset.Name === asset.ParentItem);
					if (parentAsset) {
						R.push(asset);
						break;
					}
				}
			}

			// Since there was no parent, get all the possible items
			if (R.length == 0) {
				for (const asset of allAssetsGroups.get(group.Name) ?? []) {
					if (asset.Random && !asset.ParentItem && (ParentSize == "" || asset.Name == ParentSize)) {
						R.push(asset);
					}
				}
			}

			// Picks a random item and color and add it
			if (R.length > 0) {
				var SelectedAsset = InventoryGetRandom(C, group.Name, R);
				// If we found no asset, just move to next group
				if (!SelectedAsset)
					continue;
				/** @type {Readonly<ItemColor> | undefined} */
				let SelectedColor = SelectedAsset.Group.ColorSchema[Math.floor(Math.random() * SelectedAsset.Group.ColorSchema.length)];
				if ((SelectedAsset.Group.ColorSchema[0] == "Default") && (Math.random() < 0.5)) SelectedColor = "Default";
				if (SelectedAsset.Group.InheritColor != null) SelectedColor = "Default";
				else if (SelectedAsset.Group.ParentColor != "") {
					SelectedColor = ItemGetColor(C, SelectedAsset.Group.ParentColor);
				}
				// Rare chance of keeping eyes of a different color
				if (SelectedAsset.Group.Name == "Eyes2" && Math.random() < 0.995) {
					const eye = C.Appearance.find(item => item.Asset.Group.Name === "Eyes");
					if (eye && eye.Color) {
						SelectedColor = eye.Color;
					}
				}
				if (SelectedColor == "Default") SelectedColor = SelectedAsset.DefaultColor;
				const NA = AppearanceItem.fromAsset(SelectedAsset, { color: SelectedColor });
				C.Appearance.push(NA);
			}
		}
	}

	// Random December hats (25% odds)
	if ((new Date().getMonth() == 11) && (Math.random() < 0.25) && (InventoryGet(C, "Hat") == null)) {
		/** @type {AssetName} */
		const randomItem = CommonGetRandomItemFromList(["Santa1", "ReindeerBand"]);
		if (randomItem) {
			InventoryWear(C, randomItem, "Hat", undefined, undefined, undefined, undefined, false);
		}
	}

	// Refreshes the character
	if (refresh) {
		CharacterRefresh(C, false);
	}
}

/**
 * Removes all items that can be removed, making the character naked. Checks for a blocking of CosPlayItem removal.
 * @param {Character} C - The character to undress
 * @returns {void} - Nothing
 */
function CharacterAppearanceNaked(C) {
	const keepCosplay = (C.IsPlayer() || C.IsOnline()) && C.OnlineSharedSettings?.BlockBodyCosplay;
	C.Appearance = C.Appearance.filter(({ Asset: { Group } }) => {
		// Appearance or mandatory groups stay
		if (!Group.IsAppearance() || !Group.AllowNone)
			return true;

		// If it's cosplay, it stays on
		if (keepCosplay && Group.BodyCosplay)
			return true;

		return false;
	});

	// Loads the new character canvas
	CharacterLoadCanvas(C);

}

/**
 * Removes one layer of clothing: outer clothes, then underwear, then body-cosplay clothes, then nothing
 * @param {Character} C - The character to undress
 * @returns {void} - Nothing
 */
function CharacterAppearanceStripLayer(C) {
	var HasClothes = false;
	var HasUnderwear = false;
	var HasBodyCosplay = false;

	// Find out what the top layer currently is
	for (let A = 0; A < C.Appearance.length; A++) {
		if (!WardrobeGroupAccessible(C, C.Appearance[A].Asset.Group)) continue;
		if (!AppearanceGroupAllowed(C, C.Appearance[A].Asset.Group.Name)) continue;
		if (C.Appearance[A].Asset.Group.BodyCosplay || C.Appearance[A].Asset.BodyCosplay) HasBodyCosplay = true;
		else if (C.Appearance[A].Asset.Group.Underwear) HasUnderwear = true;
		else if (C.Appearance[A].Asset.Group.Clothing) { HasClothes = true; break; }
	}

	// Check if there's anything to remove
	if (!HasClothes && !HasUnderwear && !HasBodyCosplay) return;

	// Ensure only the top layer is 'true'
	HasBodyCosplay = HasBodyCosplay && !HasUnderwear && !HasClothes;
	HasUnderwear = HasUnderwear && !HasClothes;

	// Remove assets from the top layer only
	/** @type {Item[]} */
	const items = [];
	for (const item of C.Appearance) {
		if (!WardrobeGroupAccessible(C, item.Asset.Group)) continue;
		if (!AppearanceGroupAllowed(C, item.Asset.Group.Name)) continue;
		if (item.Asset.Group.BodyCosplay || item.Asset.BodyCosplay) {
			if (HasBodyCosplay) items.push(item);
		} else if (item.Asset.Group.Underwear) {
			if (HasUnderwear) items.push(item);
		} else if (item.Asset.Group.Clothing) {
			if (HasClothes) items.push(item);
		}
	}
	InventoryRemoveItems(C, items, { refresh: false });

	// Loads the new character canvas
	CharacterLoadCanvas(C);
}

/**
 * Check whether a layer must be visible given a provided type record.
 * @param {AllowTypes.Data} allowTypes - The layer's allowed types
 * @param {TypeRecord|null|undefined} typeRecord - The type record in question.
 * @returns {boolean} - Whether the layer should be visible
 */
function CharacterAppearanceAllowForTypes(allowTypes, typeRecord) {
	if (!allowTypes || !typeRecord) {
		return false;
	}

	/** @type {Set<number>} */
	const idUnion = new Set();
	/** @type {Set<string>} */
	const typeKeys = new Set();
	for (const [key, index] of Object.entries(typeRecord)) {
		const idSet = allowTypes.TypeToID[`${key}${index}`];
		if (idSet == null) {
			continue;
		}
		typeKeys.add(key);
		idSet.forEach(i => idUnion.add(i));
	}

	// Now verify whether the typerecord _fully_ intersects with any of the identified `AllowTypes` key/value groups.
	// Only relevant when there is an AND condition involving multiple modules/subscreens.
	for (const id of idUnion) {
		if (allowTypes.IDToTypeKey[id] === undefined) {
			console.error(id, allowTypes, typeRecord);
		}
		if (allowTypes.IDToTypeKey[id].every(i => typeKeys.has(i))) {
			return true;
		}
	}
	return false;
}

/**
 * Determines whether an asset layer should be rendered, assuming the asset itself is visible.
 * @param {Character} C - The character wearing the item
 * @param {AssetLayer} layer - The layer to check visibility for
 * @param {Asset} asset - The asset that the layer belongs to
 * @param {null | TypeRecord} [typeRecord] - The item's type, if it has one
 * @returns {boolean} - TRUE if the layer should be visible, FALSE otherwise
 */
function CharacterAppearanceIsLayerVisible(C, layer, asset, typeRecord=null) {
	if (layer.AllowTypes && !CharacterAppearanceAllowForTypes(layer.AllowTypes, typeRecord)) {
		return false;
	}

	// Hide the layer if its HideAs proxy asset should be hidden
	if (layer.HideAs && !CharacterAppearanceVisible(C, layer.HideAs.Asset, layer.HideAs.Group))
		return false;

	// Hide the layer if it should be hidden for the current pose
	const pose = CommonDrawResolveAssetPose(C, layer);
	if (pose && layer.PoseMapping[pose] === PoseType.HIDE)
		return false;

	// Hide the layer if the character has any matching attribute
	if (layer.HideForAttribute && layer.HideForAttribute.some((attribute) => C.HasAttribute(attribute)))
		return false;

	// Hide the layer if the character has no matching attribute
	if (layer.ShowForAttribute && layer.ShowForAttribute.every((attribute) => !C.HasAttribute(attribute)))
		return false;

	return true;
}

/**
 * Gets the layer as the item draws it, with the pose mapping and fixed position of the item's selected options
 * @param {AssetLayer} layer - The layer
 * @param {ExtendedItemOptionConfig["DrawOptions"]} drawOptions - The item's draw options, from {@link ExtendedItemGetDrawingOptions}
 * @returns {AssetLayer} - The layer, or a copy of it changed by the draw options
 */
function CharacterAppearanceGetItemLayer(layer, drawOptions) {
	if (!drawOptions?.PoseMapping && !drawOptions?.FixedPosition) return layer;
	return {
		...layer,
		PoseMapping: drawOptions.PoseMapping ?? layer.PoseMapping,
		FixedPosition: layer.FixedPosition || !!drawOptions.FixedPosition,
	};
}

/**
 * Builds a filtered and sorted set of appearance layers, each representing a drawable layer of a character's current appearance. Layers
 * that will not be drawn (because their asset is not visible or they do not permit the current asset type) are filtered out at this stage.
 * @param {Character} C - The character to build the layers for
 * @returns {Mutable<AssetLayer>[]} - A sorted set of (shallow copied) layers, sorted by layer drawing priority
 */
function CharacterAppearanceSortLayers(C) {
	/** @type {Partial<Record<AssetGroupName, Alpha.Data[]>>} */
	const groupAlphas = {};
	const layers = C.DrawAppearance.reduce((layersAcc, item) => {
		const asset = item.Asset;
		// Only include layers for visible assets
		if (asset.Visible && CharacterAppearanceVisible(C, asset.Name, asset.Group.Name) && InventoryChatRoomAllow(asset.Category ?? [])) {
			// Check if we need to draw a different variation (from type property)
			const typeRecord = item.Property && item.Property.TypeRecord;
			const drawOptions = asset.Extended ? ExtendedItemGetDrawingOptions(item) : undefined;
			const layersToDraw = asset.Layer
				.map(layer => CharacterAppearanceGetItemLayer(layer, drawOptions))
				.filter(layer => CharacterAppearanceIsLayerVisible(C, layer, asset, typeRecord) && !layer.TextureMask)
				.map(layer => {
					/** @type {Mutable<AssetLayer>} */
					const drawLayer = { ...layer };
					// Store any group-level alpha mask definitions
					drawLayer.Alpha.forEach(alpha => {
						if (alpha.Group && (!alpha.AllowTypes || !CharacterAppearanceAllowForTypes(alpha.AllowTypes, typeRecord))) {
							alpha.Group.forEach(groupName => {
								groupAlphas[groupName] = groupAlphas[groupName] || [];
								groupAlphas[groupName].push({ Pose: alpha.Pose, Masks: alpha.Masks, AllowTypes: null });
							});
						}
					});
					// If the item has an OverridePriority property, it completely overrides the layer priority
					const layerName = layer.Name ?? "";
					if (item.Property) {
						if (typeof item.Property.OverridePriority === "number")
							drawLayer.Priority = item.Property.OverridePriority;
						else if (CommonIsObject(item.Property.OverridePriority) && typeof item.Property.OverridePriority[layerName] === "number") {
							drawLayer.Priority = item.Property.OverridePriority[layerName];
						}
					}
					return drawLayer;
				});
			layersAcc.push(...layersToDraw);
		}
		return layersAcc;
	}, /** @type {Mutable<AssetLayer>[]} */([]));

	// Run back over the layers to apply the group-level alpha mask definitions to the appropriate layers
	layers.forEach(layer => {
		// If the layer has a HideAs proxy group name, apply those alphas rather than the actual group alphas
		const groupName = (layer.HideAs && layer.HideAs.Group) || layer.Asset.Group.Name;
		if (groupAlphas[groupName]) {
			layer.GroupAlpha = [...groupAlphas[groupName]];
		} else {
			layer.GroupAlpha = [];
		}
	});

	return AssetLayerSort(layers);
}

/**
 * Builds a map of all mask layers in a character's appearance, grouped by the asset groups they affect.
 * Only includes mask layers from visible assets that aren't blocked and are allowed in the current chat room.
 *
 * @param {Character} C - The character whose masks should be built
 * @returns {AssetLayer[]} A map of group names to arrays of mask layers that affect them
 */
function CharacterAppearanceBuildMasks(C) {
	/** @type {AssetLayer[]} */
	const masks = C.DrawAppearance.reduce((acc, item) => {
		const asset = item.Asset;
		// The filter logic here is much the same as in `CharacterAppearanceSortLayers`, but we're only interested in mask layers
		if (asset.Visible && CharacterAppearanceVisible(C, asset.Name, asset.Group.Name) && InventoryChatRoomAllow(asset.Category)) {
			const typeRecord = item.Property && item.Property.TypeRecord;
			asset.Layer.filter(layer => CharacterAppearanceIsLayerVisible(C, layer, asset, typeRecord) && layer.TextureMask).reduce((acc_, layer) => {
				acc_.push(layer);
				return acc_;
			}, acc);
		}
		return acc;
	}, /** @type {AssetLayer[]} */([]));
	return masks;
}

/**
 * Determines whether an item or a whole item group is visible or not
 * @param {Character} C - The character whose assets are checked
 * @param {AssetName | undefined} AssetName - The name of the asset to check
 * @param {AssetGroupName} GroupName - The name of the item group to check
 * @param {boolean} Recursive - If TRUE, then other items which are themselves hidden will not hide this item. Parameterising this prevents
 *     infinite loops.
 * @returns {boolean} - Returns TRUE if we can show the item or the item group
 */
function CharacterAppearanceVisible(C, AssetName, GroupName, Recursive = true) {
	if (AssetName && CharacterAppearanceItemIsHidden(AssetName, GroupName)) {
		C.HasHiddenItems = true;
		return false;
	}

	if (!C.DrawAppearance) C.DrawAppearance = C.Appearance;

	// TODO: `HideAs` is currently relying on this function returning `true` even when the `AssetGet()` fails.
	// This is, to put it mildly, highly questionable behavior that should be fixed
	const assetToCheck = AssetGet(C.AssetFamily, GroupName, AssetName ?? "");
	if (assetToCheck) {
		if (!CharacterAppearanceGenderAllowed(assetToCheck)) {
			return false;
		}
	}

	const scriptItem = InventoryGet(C, "ItemScript");
	if (scriptItem && scriptItem.Property && scriptItem.Property.UnHide && scriptItem.Property.UnHide.includes(GroupName)) {
		return true;
	}

	if (C.Pose.some(p => assetToCheck && assetToCheck.Layer.every(l => l.PoseMapping[p] === PoseType.HIDE))) return false;

	for (const item of C.DrawAppearance) {
		if (CharacterAppearanceItemIsHidden(item.Asset.Name, item.Asset.Group.Name)) continue;
		let HidingItem = false;
		const HideItemExclude = InventoryGetItemProperty(item, "HideItemExclude");
		const Excluded = HideItemExclude?.includes(GroupName + AssetName);
		if ((item.Asset.Hide != null) && (item.Asset.Hide.indexOf(GroupName) >= 0) && !Excluded) HidingItem = true;
		else if (!Excluded && item.Asset.HideItemAttribute.length && assetToCheck?.Attribute?.length) {
			HidingItem = item.Asset.HideItemAttribute.some((val) => assetToCheck.Attribute.indexOf(val) !== -1);
		}
		else if ((item.Property != null) && (item.Property.Hide != null) && (item.Property.Hide.indexOf(GroupName) >= 0) && !Excluded) HidingItem = true;
		else if ((item.Asset.HideItem != null) && (item.Asset.HideItem.indexOf(GroupName + AssetName) >= 0)) HidingItem = true;
		else if ((item.Property != null) && (item.Property.HideItem != null) && (item.Property.HideItem.indexOf(GroupName + AssetName) >= 0)) HidingItem = true;
		if (HidingItem) {
			if (Recursive) {
				if (CharacterAppearanceVisible(C, item.Asset.Name, item.Asset.Group.Name, false) && !CharacterAppearanceIsHiddenByOptionPose(C, item)) {
					return false;
				}
			}
			else return false;
		}
	}
	return true;
}

/**
 * Determines whether the pose mapping of an item's selected options hides the item in the character's current pose
 * @param {Character} C - The character wearing the item
 * @param {Item} item - The item to check
 * @returns {boolean} - TRUE if the item's options hide it in the current pose
 */
function CharacterAppearanceIsHiddenByOptionPose(C, item) {
	if (!item.Asset.Extended) return false;
	const poseMapping = ExtendedItemGetDrawingOptions(item)?.PoseMapping;
	return !!poseMapping && C.Pose.some(p => poseMapping[p] === PoseType.HIDE);
}

/**
 * Determines whether the player has set this item to not appear on screen
 * @param {AssetName} AssetName - The name of the asset to check
 * @param {AssetGroupName} GroupName - The name of the item group to check
 * @returns {boolean} - TRUE if the item is hidden
 */
function CharacterAppearanceItemIsHidden(AssetName, GroupName) {
	return Player.PermissionItems[`${GroupName}/${AssetName}`]?.Hidden ?? false;
}

/**
 * Calculates and sets the height modifier which affects the character's vertical position on screen
 * @param {Character} C - The character whose height modifier must be calculated
 * @returns {void} - Nothing
 */
function CharacterAppearanceSetHeightModifiers(C) {
	if (CharacterAppearanceForceUpCharacter != C.MemberNumber) {
		let Height = 0;
		let HeightRatioProportion = 1;

		// Check if there is any setting to override the standard asset height modifiers
		/** @type {(AssetOverrideHeight|undefined)[]} */
		const TempOverrides = [];
		let PoseOverrides = Pose.filter(P => P.OverrideHeight != null && C.PoseMapping[P.Category] === P.Name).map(P => P.OverrideHeight);
		let AssetOverrides = C.DrawAppearance.filter(A => A.Asset.OverrideHeight != null).map(A => A.Asset.OverrideHeight);
		let PropertyOverrides = C.DrawAppearance.filter(A => A.Property && A.Property.OverrideHeight != null).map(A => A.Property?.OverrideHeight);
		/** @type {(AssetOverrideHeight)[]} */
		const HeightOverrides = TempOverrides.concat(PoseOverrides, AssetOverrides, PropertyOverrides).filter(Boolean);

		if (HeightOverrides.length > 0) {
			// Use the override with highest priority
			let TopOverride = HeightOverrides.reduce((a, b) => a.Priority >= b.Priority ? a : b);
			Height = TopOverride.Height || 0;
			if (TopOverride.HeightRatioProportion != null) HeightRatioProportion = TopOverride.HeightRatioProportion;
		}
		else {
			// Adjust the height based on modifiers on the assets
			for (const item of C.DrawAppearance) {
				if (!CharacterAppearanceVisible(C, item.Asset.Name, item.Asset.Group.Name)) continue;
				Height += item.Property?.HeightModifier ?? item.Asset.HeightModifier;
			}
		}

		// Limit values affectable by Property settings in case invalid values were set via console
		if (Height > CanvasLowerOverflow) Height = CanvasLowerOverflow;
		if (Height < -CanvasUpperOverflow) Height = -CanvasUpperOverflow;
		if (HeightRatioProportion > 1) HeightRatioProportion = 1;
		if (HeightRatioProportion < 0) HeightRatioProportion = 0;

		// Set the final modifier values for the character
		C.HeightModifier = Height;
		C.HeightRatioProportion = HeightRatioProportion;
	}

	// Set the height ratio here to avoid lookin it up when drawing. The setting can make all characters full height
	C.HeightRatio = Player.VisualSettings?.ForceFullHeight ? 1 : CharacterGetHeight(C);
}

/**
 * Draws the character canvas
 * @param {Character} C - The character to draw
 * @returns {void} - Nothing
 */
function CharacterAppearanceBuildCanvas(C) {
	/**
	 *
	 * @param {HTMLCanvasElement | null} canvas
	 */
	function getCanvasContext(canvas) {
		const ctx = canvas?.getContext("2d");
		if (!ctx) throw Error("Failed to get context from canvas!");
		return ctx;
	}

	// Revert to 2D canvas if webgl isn't active or its context has been lost
	if (GLVersion === "No WebGL" || !GLDrawCanvas || !GLDrawCanvas.GL || GLDrawCanvas.GL.isContextLost()) {
		CommonDrawCanvasPrepare(C);
		CommonDrawAppearanceBuild(C, {
			clearRect: (x, y, w, h) => DrawClearRect(getCanvasContext(C.Canvas), x, y, w, h),
			clearRectBlink: (x, y, w, h) => DrawClearRect(getCanvasContext(C.CanvasBlink), x, y, w, h),
			drawImage: (src, x, y, opts) => {
				CommonDrawMarkDrawnAsset(C, src);
				DrawImageCanvas(src, getCanvasContext(C.Canvas), x, y, opts);
			},
			drawImageBlink: (src, x, y, opts) => {
				CommonDrawMarkDrawnAsset(C, src);
				DrawImageCanvas(src, getCanvasContext(C.CanvasBlink), x, y, opts);
			},
			drawImageColorize: (src, x, y, opts) => {
				CommonDrawMarkDrawnAsset(C, src);
				DrawImageCanvas(src, getCanvasContext(C.Canvas), x, y, opts);
			},
			drawImageColorizeBlink: (src, x, y, opts) => {
				CommonDrawMarkDrawnAsset(C, src);
				DrawImageCanvas(src, getCanvasContext(C.CanvasBlink), x, y, opts);
			},
			drawCanvas: (Img, x, y, alphaMasks, maskLayers, transforms) => {
				CommonDrawMarkDrawnAsset(C, Img);
				DrawCanvas(Img, getCanvasContext(C.Canvas), x, y, alphaMasks ?? [], maskLayers ?? [], transforms);
			},
			drawCanvasBlink: (Img, x, y, alphaMasks, maskLayers, transforms) => {
				CommonDrawMarkDrawnAsset(C, Img);
				DrawCanvas(Img, getCanvasContext(C.CanvasBlink), x, y, alphaMasks ?? [], maskLayers ?? [], transforms);
			},
		});
	} else {
		GLDrawAppearanceBuild(C);
	}
}

/**
 * Get the current color of an item.
 *
 * @param {Character} C
 * @param {Item | AssetGroupName} itemOrGroupName
 * @returns {BCColor[] | undefined}
 */
function ItemGetColor(C, itemOrGroupName) {
	const item = typeof itemOrGroupName === "string" ? InventoryGet(C, itemOrGroupName) : itemOrGroupName;
	if (!item) return undefined;
	if (typeof item.Color === "string") {
		return Array(item.Asset.ColorableLayerCount).fill(item.Color);
	}
	return !item.Color || ItemColorIsDefault(item) ? [...item.Asset.DefaultColor] : item.Color;
}

/**
 * Returns a value from the character current appearance
 * @template {keyof CharacterAppearanceValues} T
 * @param {Character} C - The character to get values from
 * @param {AssetGroupName} Group - The name of the group, whose values we want to get
 * @param {T} Type - The name of the value, we want to get
 * @deprecated Use {@link InventoryGet}, {@link InventoryIsWorn}, {@link ItemGetColor}, etc.
 * @returns {CharacterAppearanceValues[T] | "None"} - The return value
 */
function CharacterAppearanceGetCurrentValue(C, Group, Type) {
	/** @type {"None" | CharacterAppearanceValues[keyof CharacterAppearanceValues]} */
	let ret = "None";
	for (const [i, item] of C.Appearance.entries()) {
		if (item.Asset.Group.Family == C.AssetFamily && item.Asset.Group.Name == Group) {
			switch (Type) {
				case "Name":
					ret = item.Asset.Name;
					break;
				case "Description":
					ret = item.Asset.Description;
					break;
				case "Color":
					ret = ItemGetColor(C, item) ?? "Default";
					break;
				case "ID":
					ret = i;
					break;
				case "Effect":
					ret = item.Asset.Effect;
					break;
				case "Asset":
					ret = item.Asset;
					break;
				case "Full":
					ret = item;
					break;
				case "Zoom":
					ret = item.Asset.ZoomModifier;
					break;
			}
		}
	}
	// @ts-expect-error: TS is very bad at linking `Type` to `Type`-specific return values
	return ret;
}

/**
 * Repositions the character horizonally to centre them, since shorter characters will shrink towards the left
 * @param {Character} C - The character to reposition
 * @param {number} HeightRatio - The character's height ratio
 * @returns {number} - The amount to move the character along the X co-ordinate
 */
function CharacterAppearanceXOffset(C, HeightRatio) {
	return 500 * (1 - HeightRatio) / 2;
}

/**
 * Repositions the character vertically towards the bottom of the canvas (the 'floor'), since shorter characters will be shrunk towards the
 * top HeightRatioProportion controls how much of this offset applies with 1 (max) positioning them on the "floor" and 0 (min) leaving them
 * up at the 'ceiling'
 * @param {Character} C - The character to reposition
 * @param {number} HeightRatio - The character's height ratio
 * @param {boolean} [IgnoreUpButton] - Whether or not to ignore the up button status
 * @returns {number} - The amounnt to move the character along the Y co-ordinate
 */
function CharacterAppearanceYOffset(C, HeightRatio, IgnoreUpButton=false) {
	let HeightModifier = C.HeightModifier;
	if (!IgnoreUpButton && CharacterAppearanceForceUpCharacter == C.MemberNumber) {
		HeightModifier = 0;
	}
	return 1000 * (1 - HeightRatio) * (C.HeightRatioProportion ?? 1) - HeightModifier * HeightRatio;
}

/**
 * Loads the character appearance screen and keeps a backup of the previous appearance. The function name is created dynamically.
 * @type {ScreenLoadHandler}
 */
async function AppearanceLoad() {
	DialogFocusItem = null;
	CharacterAppearanceMode = "";
	CharacterAppearanceOffset = 0;
	const C = CharacterAppearanceSelection;
	// Build the list of customizable groups for the selected character
	CharacterAppearanceGroups = AssetGroup.filter(g => g.Family === C.AssetFamily && g.IsAppearance() && g.AllowCustomize);
	CharacterAppearanceGroupedAssets = AssetGetAllAppearanceForCharacter(C);
	AppearanceMenuBuild(C, null);
	AppearanceUseCharacterInPreviewsSetting = Player.CharacterID !== "" ? Player.VisualSettings.UseCharacterInPreviews : false;
}

/**
 * Build the buttons in the top menu
 * @param {Character} C - The character the appearance is being set for
 * @param {AssetGroup | null} group - The currently selected group
 * @returns {void} - Nothing
 */
function AppearanceMenuBuild(C, group) {
	AppearanceMenu = [];

	switch (CharacterAppearanceMode) {
		case "":
			if (C.IsPlayer()) {
				AppearanceMenu.push(LogQuery("Wardrobe", "PrivateRoom") ? "Wardrobe" : "WardrobeDisabled");
				if (!LogQuery("Wardrobe", "PrivateRoom") && AppearanceGroupAllowed(C, "ALL")) AppearanceMenu.push("Reset");
				AppearanceMenu.push("WearRandom");
				AppearanceMenu.push("Random", "Copy", "Paste");
			} else AppearanceMenu.push(LogQuery("Wardrobe", "PrivateRoom") ? "Wardrobe" : "WardrobeDisabled");
			AppearanceMenu.push("Naked", "Character", "Prev", "Next");
			break;
		case "Cloth": {
			if (!group) return;
			let Item = InventoryGet(C, group.Name);
			if (Item?.Asset.Extended) AppearanceMenu.push(InventoryBlockedOrLimited(C, Item) ? "UseDisabled" : "Use");
			if (C.IsPlayer()) AppearanceMenu.push("WearRandom");
			if (C.IsPlayer()) AppearanceMenu.push("PermissionMode");
			if (group.AllowNone) AppearanceMenu.push("Naked");
			if (Item && DialogCanColor(C, Item)) {
				/** @type {AppearanceMenuButtonType} */
				let ButtonName;
				if (ItemColorIsSimple(Item)) {
					ButtonName = InventoryBlockedOrLimited(C, Item) ? "ColorChangeDisabled" : "ColorChange";
				} else {
					ButtonName = InventoryBlockedOrLimited(C, Item) ? "ColorChangeMultiDisabled" : "ColorChangeMulti";
				}
				AppearanceMenu.push(ButtonName);
			}
			if (DialogInventory.length > CharacterAppearanceNumClothPerPage) AppearanceMenu.push("Prev", "Next");
			break;
		}
		case "Permissions":
			if (DialogInventory.length > CharacterAppearanceNumClothPerPage) AppearanceMenu.push("Prev", "Next");
			break;
	}

	// Add the exit buttons
	if (CharacterAppearanceMode !== "Color") {
		if (DialogMenuMode !== "permissions") AppearanceMenu.push("Cancel");
		AppearanceMenu.push("Accept");
	}
}

/**
 * Checks if the appearance is locked for the current player
 * @param {Character} C - The character to validate
 * @param {"ALL" | AssetGroupName} GroupName - The group name to validate, can be "ALL" to check all groups
 * @returns {boolean} - Return TRUE if the appearance group isn't blocked
 */
function AppearanceGroupAllowed(C, GroupName) {
	if (CurrentScreen != "Appearance") return true;
	if (!C.IsPlayer()) return true;
	if (Player.IsOwned() == false) return true;
	if (!Player.IsOwned()) return true;

	const blocked = LogGetStringArray("BlockAppearance", "OwnerRule");
	if (!blocked) return true;

	if (GroupName === "ALL")
		return blocked.length > 0;

	return !blocked.includes(GroupName);
}

/**
 * Run the character appearance selection screen. The function name is created dynamically.
 * @returns {void} - Nothing
 */
function AppearanceRun() {

	// Draw the background and the character twice
	const C = CharacterAppearanceSelection;
	if (!C) return;
	if (CharacterAppearanceHeaderTextTime < CommonTime() && CharacterAppearanceMode == "Cloth")
		CharacterAppearanceHeaderText = "";
	if (CharacterAppearanceHeaderText == "") {
		if (C.IsPlayer()) CharacterAppearanceHeaderText = TextGet("SelectYourAppearance");
		else CharacterAppearanceHeaderText = TextGet("SelectSomeoneAppearance").replace("TargetCharacterName", CharacterNickname(C));
	}
	DrawCharacter(C, -600, -100 + 4 * C.HeightModifier, 4, false);
	if (C.IsPlayer()) DrawCharacter(C, 660, 90, 0.95);
	else DrawCharacter(C, 660, 0, 1);
	DrawText(CharacterAppearanceHeaderText, 400, 40, "White", "Black");

	// When there is an extended item
	if (DialogFocusItem != null) {
		CommonDynamicFunction("Inventory" + DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Draw()");
		DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
		return;
	} else if (Layering.IsActive()) {
		return;
	}

	// As soon as the appearance mode changes, rebuild the menu button list
	if (CharacterAppearanceMenuMode !== CharacterAppearanceMode) {
		CharacterAppearanceMenuMode = CharacterAppearanceMode;
		AppearanceMenuBuild(C, CharacterAppearanceSelectedGroup);
	}

	// Draw the menu buttons at the top
	AppearanceMenuDraw();

	// In regular dress-up mode
	if (CharacterAppearanceMode == "") {

		// Creates buttons for all groups
		for (let A = CharacterAppearanceOffset; A < CharacterAppearanceGroups.length && A < CharacterAppearanceOffset + CharacterAppearanceNumGroupPerPage; A++) {
			const Group = CharacterAppearanceGroups[A];
			if (!Group.IsAppearance()) continue;

			// If it's a locked group, just draw a label and continue
			if (!AppearanceGroupAllowed(C, Group.Name)) {
				DrawText(Group.Description + " " + TextGet("OwnerBlock"), 1600, 177 + (A - CharacterAppearanceOffset) * 95, "White", "Silver");
				continue;
			}

			const Item = InventoryGet(C, Group.Name);
			const canAccess = WardrobeGroupAccessible(C, Group);
			const ButtonColor = canAccess ? "White" : "#888";

			// Draw Strip & Use button
			if (Item) {
				let leftPos = 1120;
				if (Item.Asset.Extended) {
					const canUse = !InventoryBlockedOrLimited(C, Item);
					DrawButton(leftPos, 145 + (A - CharacterAppearanceOffset) * 95, 65, 65, "", (canUse ? "White" : "#888"), "Icons/Use.png", TextGet("Use"));
					leftPos -= (65 + 25);
				}

				if (Group.AllowNone)
					DrawButton(leftPos, 145 + (A - CharacterAppearanceOffset) * 95, 65, 65, "", ButtonColor, "Icons/Naked.png", TextGet("StripItem"));
			}

			// Draw Next/Previous widget
			/** @type {(prev: boolean) => string} */
			const prevNextButtonHandler = (prev) => {
				if (canAccess) {
					const asset = CharacterAppearanceNextItem(C, Group.Name, prev);
					return asset ? asset.Description : TextGet("None");
				}
				return "";
			};
			const buttonLabel = Group.Description + ": " + (InventoryGet(C, Group.Name)?.Asset.Description ?? TextGet("None"));
			DrawBackNextButton(1210, 145 + (A - CharacterAppearanceOffset) * 95, 400, 65, buttonLabel, ButtonColor, "",
				() => prevNextButtonHandler(false),
				() => prevNextButtonHandler(true),
				!canAccess,
				Group.AllowNone || AppearancePreviewUseCharacter(Group) ? 65 : undefined);

			const Color = ItemGetColor(C, Group.Name) ?? "Default";
			const ColorButtonText = ItemColorGetColorButtonText(Color);
			const ColorButtonColor = ColorButtonText.startsWith("#") ? ColorButtonText : "#fff";
			const CanCycleColors = !!Item && canAccess && (Item.Asset.ColorableLayerCount > 0 || Item.Asset.Group.ColorSchema.length > 1) && !InventoryBlockedOrLimited(C, Item);
			const CanPickColor = CanCycleColors && Group.AllowColorize;
			const ColorIsSimple = !Item || ItemColorIsSimple(Item);

			// Draw color swatch and picker widgets
			const layeringEnabled = Item && !C.IsNpc();
			DrawButton(1635, 145 + (A - CharacterAppearanceOffset) * 95, 65, 65, "", layeringEnabled ? "#fff" : "#aaa", "Icons/Layering.png", TextGet("Layering"), !layeringEnabled);
			DrawButton(1725, 145 + (A - CharacterAppearanceOffset) * 95, 160, 65, ColorButtonText, CanCycleColors ? ColorButtonColor : "#aaa", undefined, undefined, !CanCycleColors);
			DrawButton(1910, 145 + (A - CharacterAppearanceOffset) * 95, 65, 65, "", CanPickColor ? "#fff" : "#aaa", CanPickColor ? ColorIsSimple ? "Icons/ColorChange.png" : "Icons/ColorChangeMulti.png" : "Icons/ColorBlocked.png", undefined, !CanPickColor);
		}
	}


	// In item coloring mode
	if (CharacterAppearanceMode == "Color") {
		// Leave the color picker if the item is gone.
		if (!InventoryGet(C, CharacterAppearanceColorPickerGroupName)) ItemColorCancelAndExit();
		// Draw the color picker
		ItemColorDraw(CharacterAppearanceSelection, CharacterAppearanceColorPickerGroupName, 1095, 25, 880, 950);
	}

	// In cloth selection mode
	if (CharacterAppearanceMode == "Cloth" || CharacterAppearanceMode === "Permissions") {
		// Prepares a 3x3 square of clothes to present all the possible options
		let X = 1250;
		let Y = 125;
		for (let I = DialogInventoryOffset; (I < DialogInventory.length) && (I < DialogInventoryOffset + CharacterAppearanceNumClothPerPage); I++) {
			const Item = DialogInventory[I];
			const Hover = MouseIn(X, Y, 225, 275) && !CommonIsMobile;
			const Background = AppearanceGetPreviewImageColor(C, Item, Hover);

			if (CharacterAppearanceItemIsHidden(Item.Asset.Name, Item.Asset.Group.Name)) {
				DrawPreviewBox(X, Y, "Icons/HiddenItem.png", Item.Asset.Description, { Background });
			} else if (CharacterAppearanceSelectedGroup && AppearancePreviewUseCharacter(CharacterAppearanceSelectedGroup) && CharacterAppearanceSelectedGroup.PreviewZone) {
				const Z = CharacterAppearanceSelectedGroup.PreviewZone;
				const PreviewCanvas = DrawCharacterSegment(AppearancePreviews[I % CharacterAppearanceNumClothPerPage], Z[0], Z[1], Z[2], Z[3]);
				DrawCanvasPreview(X, Y, PreviewCanvas, Item.Asset.Description, { Background, Vibrating: Item.Vibrating, Icons: Item.Icons });
			} else {
				DrawItemPreview(Item, Player, X, Y, { Hover: true, Background });
			}

			ControllerAddActiveArea(X, Y);
			X = X + 250;
			if (X > 1800) {
				X = 1250;
				Y = Y + 300;
			}
		}
	}
}

/** @type {ScreenResizeHandler} */
function AppearanceResize(load) {
	if (Layering.IsActive()) {
		Layering.Resize(load);
	}
}

/** @type {KeyboardEventListener} */
function AppearanceKeyDown(event) {
	return false;
}

/**
 * Calculates the background color of the preview image for and item
 * @param {Character} C - The character whose appearance we are viewing
 * @param {DialogInventoryItem} item - The item to calculate the color for
 * @param {boolean} hover - Whether or not the item is currently hovering over the preview image
 * @returns {string} - A CSS color string determining the color that the preview icon should be drawn in
 */
function AppearanceGetPreviewImageColor(C, item, hover) {
	switch (CharacterAppearanceMode) {
		case "Permissions": {
			/** @type {keyof typeof AppearancePermissionColors} */
			let permission = "green";
			if (item.Worn) {
				return "gray";
			} else if (InventoryIsPermissionBlocked(C, item.Asset.Name, item.Asset.Group.Name)) {
				permission = "red";
			} else if (InventoryIsPermissionLimited(C, item.Asset.Name, item.Asset.Group.Name)) {
				permission = "amber";
			}
			return AppearancePermissionColors[permission][hover ? 1 : 0];
		}
		default: {
			const Unusable = item.SortOrder.startsWith(DialogSortOrder.Unusable.toString())
				|| item.SortOrder.startsWith(DialogSortOrder.TargetFavoriteUnusable.toString())
				|| item.SortOrder.startsWith(DialogSortOrder.PlayerFavoriteUnusable.toString());
			const Blocked = item.SortOrder.startsWith(DialogSortOrder.Blocked.toString());
			if (hover && !Blocked) return "cyan";
			else if (item.Worn) return "pink";
			else if (Blocked) return "red";
			else if (Unusable) return "gray";
			else if ((item.Craft != null) && (item.Craft.Name != null)) return "#FFFFAF";
			else return "white";
		}
	}
}

/**
 * Draw the top-row menu buttons for the appearance screen
 * @returns {void} - Nothing
 */
function AppearanceMenuDraw() {
	const X = 2000 - AppearanceMenu.length * 117;
	for (let B = 0; B < AppearanceMenu.length; B++) {
		const ButtonName = AppearanceMenu[B].replace(/Disabled$/, "");
		const ButtonSuffix = AppearanceMenu[B] === "Character" && !AppearanceUseCharacterInPreviewsSetting ? "Off" : "";
		const ButtonColor = DialogGetMenuButtonColor(AppearanceMenu[B]);
		const ButtonDisabled = DialogIsMenuButtonDisabled(AppearanceMenu[B]);
		DrawButton(X + 117 * B, 25, 90, 90, "", ButtonColor, "Icons/" + ButtonName + ButtonSuffix + ".png", TextGet(AppearanceMenu[B]), ButtonDisabled);
	}
}

/**
 * Create a list of characters with different items from the group applied, to use as the preview images
 * @param {Character} C - The character that the dialog inventory has been loaded for
 * @param {AssetGroup} focusGroup - The group being previewed
 * @param {boolean} buildCanvases - Determines whether the preview canvases need to be (re)built, e.g. for the initial load or due to an appearance change
 * @returns {void} - Nothing
 */
function AppearancePreviewBuild(C, focusGroup, buildCanvases) {
	if (!focusGroup) return;

	AppearancePreviews = [];
	if (AppearancePreviewUseCharacter(focusGroup) && DialogInventory) {
		// Create a copy of the character appearance without items
		const baseAppearance = buildCanvases ? C.Appearance.filter(A => A.Asset.Group.Category === "Appearance") : null;
		// If the group being viewed is underwear, remove outer clothes
		if (baseAppearance && (focusGroup.Underwear || focusGroup.Name.startsWith("Suit"))) {
			for (let A = baseAppearance.length - 1; A >= 0; A--) {
				let assetGroup = baseAppearance[A].Asset.Group;
				if (assetGroup.Clothing && !assetGroup.Underwear && !assetGroup.BodyCosplay) {
					baseAppearance.splice(A, 1);
				}
			}
		}
		// Add each preview character to the list, building their canvas if necessary
		DialogInventory.slice(DialogInventoryOffset, DialogInventoryOffset + CharacterAppearanceNumClothPerPage).forEach(item => {
			let PreviewChar = CharacterLoadSimple("AppearancePreview-" + item.Asset.Name);
			if (buildCanvases && baseAppearance) {
				PreviewChar.Appearance = Array.from(baseAppearance);
				CharacterAppearanceSetItem(PreviewChar, item.Asset.Group.Name, item.Asset);
				CharacterRefresh(PreviewChar, false);
			}
			AppearancePreviews.push(PreviewChar);
		});
	}
}

/**
 * Delete all characters created for preview images
 * @returns {void} - Nothing
 */
function AppearancePreviewCleanup() {
	AppearancePreviews = [];
	const previews = Character.filter(c => c.CharacterID.startsWith("AppearancePreview-"));
	for (const preview of previews) {
		CharacterDelete(preview);
	}
}

/**
 * Returns whether the the 3x3 grid "Cloth" appearance mode should include the character in the preview images
 * @param {AssetGroup | null} assetGroup - The group to check
 * @returns {boolean} - If TRUE the previews will be drawn with the character
 */
function AppearancePreviewUseCharacter(assetGroup) {
	return AppearanceUseCharacterInPreviewsSetting && !!assetGroup?.PreviewZone;
}

/**
 * Sets an item in the character appearance
 * @param {Character} C - The character whose appearance should be changed
 * @param {AssetGroupName} Group - The name of the corresponding groupr for the item
 * @param {Asset|null} ItemAsset - The asset collection of the item to be changed. Passing a `null` is equivalent to removing an item (see {@link InventoryRemove})
 * @param {null | Readonly<ItemColor>} [NewColor] - The new color (as "#xxyyzz" hex value) for that item
 * @param {null | number} [DifficultyFactor] - The difficulty, on top of the base asset difficulty, that should be assigned
 * to the item
 * @param {null | number} [ItemMemberNumber] - The member number of the player adding the item - defaults to -1
 * @returns {Item | null} - Thew newly created item or `undefined` if the asset does not exist
 */
function CharacterAppearanceSetItem(C, Group, ItemAsset, NewColor=null, DifficultyFactor=null, ItemMemberNumber=null) {

	// Sets the difficulty factor
	DifficultyFactor ??= 0;

	// Removes the previous if we need to
	const prevItem = InventoryGet(C, Group);
	if (prevItem) {
		// Do not remove any sub items if the new asset also supports them (e.g. don't remove bed-specific restraints when swapping the bed for the medical bed)
		const removeItemOnRemove = AssetGetRemoveOnItemRemoveDiff(prevItem.Asset.RemoveItemOnRemove, ItemAsset?.RemoveItemOnRemove ?? []);
		InventoryRemoveItems(C, prevItem, { removeItemOnRemove, refresh: false });
	}

	if (!ItemAsset) {
		return null;
	}

	if (prevItem && !ItemColorIsDefault(prevItem)) {
		NewColor ??= prevItem.Color;
	}

	// Add the new item to the character appearance
	const NA = AppearanceItem.fromAsset(ItemAsset, { color: NewColor ?? undefined, difficulty: ItemAsset.Difficulty + DifficultyFactor });
	ExtendedItemInit(C, NA, false, false);
	C.Appearance.push(NA);
	return NA;
}

/**
 * Cycle in the appearance assets to find the next item in a group
 * @param {Character} C - The character whose assets are used
 * @param {AssetGroupBodyName} Group - The name of the group to cycle
 * @param {boolean} [Forward] - Sets the direction of the cycling
 * @returns {Asset|null} - The next item to select, or null if there's none applicable
 */
function CharacterAppearanceNextItem(C, Group, Forward=true) {
	const Current = InventoryGet(C, Group)?.Asset.Name;
	const CAA = (CharacterAppearanceGroupedAssets.get(Group) ?? []).filter(a => a.Group.Name == Group && InventoryAllow(C, a, a.Prerequisite, false));
	if (CAA.length == 0) return null;
	if (Current) {
		// If we found the item we move forward or backward if possible
		var I = CAA.findIndex(a => a.Name == Current);
		if (I >= 0) {
			if (Forward == null || Forward) {
				if (I + 1 < CAA.length) {
					return CAA[I + 1];
				}
			} else {
				if (I - 1 >= 0) {
					return CAA[I - 1];
				}
			}
		}
	}
	// Since we didn't found any item, we pick "None" if we had an item or the first or last item
	const AG = AssetGroup.find(g => g.Name == Group);
	if (Current && AG?.AllowNone) {
		return null;
	} else if (Forward == null || Forward) {
		return CAA[0];
	} else {
		return CAA[CAA.length - 1];
	}
}

/**
 * Find the next color for the item
 * @param {Character} C - The character whose items are cycled
 * @param {AssetGroupName} Group - The name of the group for which we are color cycling
 * @returns {void} - Nothing
 */
function CharacterAppearanceNextColor(C, Group) {

	// For each item, we first find the item and pick the next one
	const item = InventoryGet(C, Group);
	if (!item) return;

	const Color = item.Color;
	const G = item.Asset.Group;

	// Finds the next color
	let Pos = 0;
	if (ItemColorIsDefault(item)) {
		Pos = CommonClamp(1, 0, G.ColorSchema.length);
	} else if (Color.every(c => c === Color[0])) {
		Pos = CommonClamp(G.ColorSchema.indexOf(Color[0]) + 1, 0, G.ColorSchema.length);
	}
	const newColor = G.ColorSchema[Pos];

	// Sets the color
	if (newColor == "Default") {
		item.Color = [...item.Asset.DefaultColor];
	} else {
		item.Color = Array(item.Asset.ColorableLayerCount).fill(newColor);
	}

	// Reloads the character canvas
	CharacterLoadCanvas(C);
}

/**
 * Moves the offset to get new character appearance items
 * @param {Character} C - The character whose visible groups are used for calculation
 * @param {number} Move - The amount the next asset group should be moved before it is displayed
 * @returns {void} - Nothing
 */
function CharacterAppearanceMoveGroup(C, Move) {
	// Calculate the new offset
	CharacterAppearanceOffset = CharacterAppearanceOffset + Move * CharacterAppearanceNumGroupPerPage;
	if (CharacterAppearanceOffset >= CharacterAppearanceGroups.length) CharacterAppearanceOffset = 0;
	if (CharacterAppearanceOffset < 0)
		CharacterAppearanceOffset = Math.floor((CharacterAppearanceGroups.length - 1) / CharacterAppearanceNumGroupPerPage) * CharacterAppearanceNumGroupPerPage;
}

/**
 * Sets the color for a specific group
 * @param {Character} C - The character whose item group should be colored
 * @param {BCColor} Color - The color (in the format "#rrggbb") to be applied to the group
 * @param {AssetGroupName} Group - The name of the group, whose color should be changed
 * @returns {void} - Nothing
 */
function CharacterAppearanceSetColorForGroup(C, Color, Group) {
	const item = InventoryGet(C, Group);
	if (item) {
		item.Color = Array(item.Asset.ColorableLayerCount).fill(Color);
		CharacterLoadCanvas(C);
	}
}

/**
 * Handle the clicks in the character appearance selection screen. The function name is created dynamically.
 * @returns {void} - Nothing
 */
function AppearanceClick() {
	const C = CharacterAppearanceSelection;
	if (!C) return;

	ControllerClearAreas();
	// When there is an extended item
	if (DialogFocusItem != null) {
		CommonDynamicFunction("Inventory" + DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Click()");
	}

	// In item coloring mode
	else if (CharacterAppearanceMode == "Color") {
		ItemColorClick(CharacterAppearanceSelection, CharacterAppearanceColorPickerGroupName, 1095, 25, 880, 950);
	}

	// Selecting a button in the row at the top
	else if (MouseYIn(25, 90)) AppearanceMenuClick(C);

	// In regular dress-up mode
	else if (CharacterAppearanceMode == "") {

		for (let A = CharacterAppearanceOffset; A < CharacterAppearanceGroups.length && A < CharacterAppearanceOffset + CharacterAppearanceNumGroupPerPage; A++) {
			const Group = CharacterAppearanceGroups[A];
			if (!Group.IsAppearance() || !WardrobeGroupAccessible(C, Group) || !AppearanceGroupAllowed(C, Group.Name))
				continue;

			const Item = InventoryGet(C, Group.Name);
			// Handle the Strip & Use button
			if (Item) {
				let clickOn = null;
				if (MouseIn(1120, 145 + (A - CharacterAppearanceOffset) * 95, 65, 65)) {
					if (Item.Asset.Extended && !InventoryBlockedOrLimited(C, Item)) {
						clickOn = "Use";
					} else if (Group.AllowNone) {
						clickOn = "Strip";
					}
				} else if (MouseIn(1030, 145 + (A - CharacterAppearanceOffset) * 95, 65, 65)) {
					if (Group.AllowNone) {
						clickOn = "Strip";
					}
				}

				if (clickOn === "Use") {
					// Set the focus, as changing extended items depends on that
					C.FocusGroup = /** @type {AssetItemGroup} */ (/** @type {unknown} */ (Group));
					DialogExtendItem(Item);
					return;
				} else if (clickOn === "Strip") {
					InventoryRemove(C, Group.Name, false);
					CharacterRefresh(C, false);
					return;
				}
			}

			// Handle the cloth selector
			if (MouseIn(1210, 145 + (A - CharacterAppearanceOffset) * 95, 400, 65)) {
				CharacterAppearanceSelectedGroup = null;
				if (!Group.AllowNone && !AppearancePreviewUseCharacter(Group)) {
					const asset = CharacterAppearanceNextItem(C, Group.Name, MouseX > 1410);
					CharacterAppearanceSetItem(C, Group.Name, asset);
					CharacterRefresh(C);
					return;
				}
				else if (MouseXIn(1210, 65)) {
					const asset = CharacterAppearanceNextItem(C, Group.Name, false);
					CharacterAppearanceSetItem(C, Group.Name, asset);
					CharacterRefresh(C);
					return;
				}
				else if (MouseXIn(1545, 65)) {
					const asset = CharacterAppearanceNextItem(C, Group.Name, true);
					CharacterAppearanceSetItem(C, Group.Name, asset);
					CharacterRefresh(C);
					return;
				}
				else {
					// Open the clothing group screen
					CharacterAppearanceSelectedGroup = Group;
					DialogInventoryBuild(C, Group, true, false);
					AppearancePreviewBuild(C, Group, true);
					CharacterAppearanceCloth = InventoryGet(C, Group.Name);
					CharacterAppearanceMode = "Cloth";
					return;
				}
			}

			if (MouseIn(1635, 145 + (A - CharacterAppearanceOffset) * 95, 65, 65)) {
				if (Item && !C.IsNpc()) {
					CommonPromiseCatch(Layering.Init(Item, C, { x: Layering.DisplayDefault.x - 2, buttonGap: 27 }));
				}
				return;
			}

			// Handle color cycling
			if (MouseIn(1725, 145 + (A - CharacterAppearanceOffset) * 95, 160, 65)) {
				if (Item && (Item.Asset.ColorableLayerCount > 0 || Item.Asset.Group.ColorSchema.length > 1) && !InventoryBlockedOrLimited(C, Item)) {
					CharacterAppearanceNextColor(C, Group.Name);
					return;
				}
			}

			// Handle color chooser
			if (MouseIn(1910, 145 + (A - CharacterAppearanceOffset) * 95, 65, 65)) {
				if (Group.AllowColorize && Item && Item.Asset.ColorableLayerCount > 0 && !InventoryBlockedOrLimited(C, Item)) {
					AppearanceItemColor(C, Item, Group, "");
					return;
				}
			}
		}
		return;
	}


	// In cloth selection mode
	else if ((CharacterAppearanceMode == "Cloth" || CharacterAppearanceMode == "Permissions") && CharacterAppearanceSelectedGroup) {

		// Prepares a 3x3 square of clothes to present all the possible options
		var X = 1250;
		var Y = 125;
		for (let I = DialogInventoryOffset; (I < DialogInventory.length) && (I < DialogInventoryOffset + CharacterAppearanceNumClothPerPage); I++) {
			if ((MouseX >= X) && (MouseX < X + 225) && (MouseY >= Y) && (MouseY < Y + 275)) {
				const Item = DialogInventory[I];
				const CurrentItem = InventoryGet(C, CharacterAppearanceSelectedGroup.Name);
				const worn = (!!CurrentItem && (CurrentItem.Asset.Name == Item.Asset.Name));

				// In permission mode, we toggle the settings for an item
				if (CharacterAppearanceMode === "Permissions") {
					DialogInventoryTogglePermission(Item, worn);
				} else {
					if (InventoryBlockedOrLimited(C, Item)) return;
					if (InventoryAllow(C, Item.Asset)) {
						if (worn && CurrentItem.Asset.Extended) {
							DialogExtendItem(CurrentItem);
						} else {
							const group = CharacterAppearanceSelectedGroup;
							if (!group) return;
							CharacterAppearanceSetItem(C, group.Name, DialogInventory[I].Asset);
							CharacterRefresh(C);
							DialogInventoryBuild(C, group);
							AppearancePreviewBuild(C, group, true);
							AppearanceMenuBuild(C, group);
						}
					}
				}
				return;
			}
			X = X + 250;
			if (X > 1800) {
				X = 1250;
				Y = Y + 300;
			}
		}
	}
}

/**
 * Handles the Click events for the top-row buttons in the Appearance screen
 * @param {Character} C - The character the appearance is being set for
 * @returns {void} - Nothing
 */
function AppearanceMenuClick(C) {
	const X = 2000 - AppearanceMenu.length * 117;
	for (let B = 0; B < AppearanceMenu.length; B++) {
		if (MouseXIn(X + 117 * B, 90)) {
			let Button = AppearanceMenu[B];
			switch (CharacterAppearanceMode) {
				case "":
					if (Button === "Reset") CharacterAppearanceSetDefault(C);
					if (Button === "Wardrobe") CharacterAppearanceWardrobeLoad(C);
					if (Button === "WearRandom") CharacterAppearanceFullRandom(C, true);
					if (Button === "Random") CharacterAppearanceFullRandom(C);
					if (Button === "Naked") CharacterAppearanceStripLayer(C);
					if (Button === "Character")  AppearanceUseCharacterInPreviewsSetting = !AppearanceUseCharacterInPreviewsSetting;
					if (Button === "Copy") CharacterAppearanceCopyToClipboard(C);
					if (Button === "Paste") {
						CommonClipboardRead((res) => {
							if (res.ok && res.value) {
								CharacterAppearancePaste(C, res.value, false);
							} else if (res.err) {
								ToastManager.error(res.errorAsDOM(InterfaceTextGet("AppPasteError")));
							}
						});
					}
					if (Button === "Prev") CharacterAppearanceMoveGroup(C, -1);
					if (Button === "Next") CharacterAppearanceMoveGroup(C, 1);
					if (Button === "Cancel") CharacterAppearanceExit(C);
					if (Button === "Accept") CharacterAppearanceReady(C);
					if (Button === "WardrobeDisabled") CharacterAppearanceHeaderText = TextGet("WardrobeDisabled");
					break;
				case "Cloth":
					if (!CharacterAppearanceSelectedGroup) return;

					// Extends the current item
					if (Button === "Use") {
						const Item = InventoryGet(C, CharacterAppearanceSelectedGroup.Name);
						if (Item && Item.Asset.Extended) DialogExtendItem(Item);
					}

					// Picks and colors a random item from the group
					if (Button === "WearRandom") InventoryWearRandom(C, CharacterAppearanceSelectedGroup.Name, undefined, true, true);

					// Opens permission mode
					if (Button === "PermissionMode") {
						CharacterAppearanceMode = "Permissions";
						// Need to temporary (manually) switch the dialog mode because we're, per usual, abusing the hell out of global variables 🥳
						DialogMenuMode = "permissions";
						DialogInventoryBuild(C, CharacterAppearanceSelectedGroup, true, false, false);
						DialogMenuMode = null;
						AppearancePreviewBuild(C, CharacterAppearanceSelectedGroup, true);
					}

					// Strips the current item
					if (Button === "Naked") {
						CharacterAppearanceSetItem(C, CharacterAppearanceSelectedGroup.Name, null);
						CharacterRefresh(C);
					}

					// Jumps to the cloth page
					if (Button === "Next" || Button === "Prev") {
						const offset = Button === "Next" ? CharacterAppearanceNumClothPerPage : -CharacterAppearanceNumClothPerPage;
						DialogInventoryOffset = DialogInventoryOffset + offset;
						if (DialogInventoryOffset >= DialogInventory.length) DialogInventoryOffset = 0;
						if (DialogInventoryOffset < 0)
							DialogInventoryOffset = Math.floor((DialogInventory.length - 1) / CharacterAppearanceNumClothPerPage) * CharacterAppearanceNumClothPerPage;
						AppearancePreviewBuild(C, CharacterAppearanceSelectedGroup, true);
					}

					// Opens the color picker
					if (Button === "ColorChange" || Button === "ColorChangeMulti") {
						const Item = InventoryGet(C, CharacterAppearanceSelectedGroup.Name);
						if (Item) {
							AppearanceItemColor(C, Item, CharacterAppearanceSelectedGroup, "Cloth");
						}
					}

					// Cancels the selected cloth and reverts it back
					if (Button === "Cancel") {
						const item = CharacterAppearanceSetItem(C, CharacterAppearanceSelectedGroup.Name, CharacterAppearanceCloth?.Asset ?? null, CharacterAppearanceCloth?.Color ?? undefined);
						if (item && CharacterAppearanceCloth?.Property) {
							item.Property = CharacterAppearanceCloth.Property;
						}
						CharacterRefresh(C, false);
						if (AppearancePreviewUseCharacter(CharacterAppearanceSelectedGroup)) AppearancePreviewCleanup();
						AppearanceExit();
					}

					// Accepts the new selection
					if (Button === "Accept") {
						if (AppearancePreviewUseCharacter(CharacterAppearanceSelectedGroup)) AppearancePreviewCleanup();
						AppearanceExit();
					}

					// Rebuild the menu buttons as selecting a button here can change what should appear
					AppearanceMenuBuild(C, CharacterAppearanceSelectedGroup);
					break;
				case "Permissions":
					// Jumps to the cloth page
					if (Button === "Next" || Button === "Prev") {
						if (!CharacterAppearanceSelectedGroup) return;
						const offset = Button === "Next" ? CharacterAppearanceNumClothPerPage : -CharacterAppearanceNumClothPerPage;
						DialogInventoryOffset = DialogInventoryOffset + offset;
						if (DialogInventoryOffset >= DialogInventory.length) DialogInventoryOffset = 0;
						if (DialogInventoryOffset < 0)
							DialogInventoryOffset = Math.floor((DialogInventory.length - 1) / CharacterAppearanceNumClothPerPage) * CharacterAppearanceNumClothPerPage;
						AppearancePreviewBuild(C, CharacterAppearanceSelectedGroup, true);
					}

					// Accepts the new selection
					if (Button === "Accept" || Button === "Cancel") {
						CharacterAppearanceMode = "Cloth";
					}

					// Rebuild the menu buttons as selecting a button here can change what should appear
					AppearanceMenuBuild(C, CharacterAppearanceSelectedGroup);
					break;
			}
		}
	}
}

/**
 * Handle the exiting of the appearance screen. The function name is created dynamically.
 * @type {ScreenExitHandler}
 */
function AppearanceExit() {
	// We quit the extended item menu instead, if applicable.
	if (CharacterAppearanceMode == "Cloth" && DialogFocusItem) {
		DialogLeaveFocusItem();
		return;
	} else if (Layering.IsActive()) {
		Layering.Exit();
		return;
	}

	if (CharacterAppearanceMode === "Color") {
		return ItemColorExitClick();
	}

	if (CharacterAppearanceMode != "") {
		CharacterAppearanceMode = "";
		CharacterAppearanceHeaderText = "";
	} else {
		CharacterAppearanceExit(CharacterAppearanceSelection);
	}

	CharacterAppearanceSelection.FocusGroup = null;
}

/**
 * Common cleanup that must happen when the appearance editor closes
 */
function CharacterAppearanceClose() {
	CharacterAppearanceMode = "";
	CharacterAppearanceHeaderText = "";
	AppearancePreviewCleanup();
	if (Player.IsPlayer() && Player.CharacterID !== "" && AppearanceUseCharacterInPreviewsSetting !== Player.VisualSettings.UseCharacterInPreviews) {
		Player.VisualSettings.UseCharacterInPreviews = AppearanceUseCharacterInPreviewsSetting;
		ServerAccountUpdate.QueueData({ VisualSettings: Player.VisualSettings });
	}
}

/**
 * Restore the characters appearance backup, if the exit button is clicked
 * @param {Character} C - The character, whose appearance backup should be used
 * @returns {void} - Nothing
 */
function CharacterAppearanceExit(C) {
	CharacterAppearanceClose();
	CharacterAppearanceRestore(C, CharacterAppearanceBackup);
	CharacterLoadCanvas(C);
	CharacterAppearanceResultCallback(false);
}

/**
 * Handle the confirmation click in the wardrobe screen.
 * @param {Character} C - The character who has been changed
 * @returns {void} - Nothing
 */
function CharacterAppearanceReady(C) {
	CharacterAppearanceClose();

	// If the character is logged in, we sync its appearance
	if (C.IsPlayer() && C.CharacterID != "") {
		ServerPlayerAppearanceSync();
	}
	if (C.IsNpc()) {
		/** @type {Item[]} */
		const oldAppearance = AppearanceItemParse(CharacterAppearanceBackup);
		const pronounGroup = oldAppearance.find(a => a.Asset.Group.Name === "Pronouns");

		const oldPronouns = pronounGroup ? pronounGroup.Asset.Name : "SheHer";

		if (oldPronouns != C.GetPronouns()) {
			CommonPromiseCatch(CharacterLoadCSVDialog(C));
		}
	}
	CharacterAppearanceResultCallback(true);
}

/**
 * Copy the appearance from a character to another
 * @param {Character} FromC - The character to copy from
 * @param {Character} ToC - The character to copy to
 */
function CharacterAppearanceCopy(FromC, ToC) {

	// Removes any previous appearance asset
	const items = ToC.Appearance.filter(item => item.Asset.Group.IsAppearance());
	InventoryRemoveItems(ToC, items, { refresh: false });

	// Adds all appearance assets from the first character to the second
	for (let A = 0; A < FromC.Appearance.length; A++)
		if ((FromC.Appearance[A].Asset != null) && (FromC.Appearance[A].Asset.Group.Category == "Appearance"))
			ToC.Appearance.push(FromC.Appearance[A]);

	// Refreshes the second character and saves it if it's the player
	CharacterRefresh(ToC);
	if (ToC.IsPlayer()) ServerPlayerAppearanceSync();

}

/**
 * Loads the appearance editing screen for a character
 * @param {Character} C - The character for whom the appearance screen should be loaded
 * @param {(result: boolean) => void} [resultCallback] - A callback executed when the appearance editor closes.
 *  If not specified, it will change back to the previous screen automatically, otherwise the caller is
 *  reponsible for screen changes, and `result` will be true if the appearance change was made, false otherwise.
 * @returns {void} - nothing
 */
function CharacterAppearanceLoadCharacter(C, resultCallback) {
	CharacterAppearanceSelection = C;
	CharacterAppearanceBackup = CharacterAppearanceStringify(C);

	CharacterAppearanceReturnScreen = CommonGetScreen();
	if (!resultCallback) {
		CharacterAppearanceResultCallback = (_result) => {
			CommonSetScreen(...CharacterAppearanceReturnScreen);
		};
	} else {
		CharacterAppearanceResultCallback = resultCallback;
	}
	CommonSetScreen("Character", "Appearance");
}

/**
 * Open the wardrobe screen for the character currently in the appearance editor.
 * @param {Character} C - The character whose wardrobe should be loaded
 * @returns {void} - Nothing
 */
function CharacterAppearanceWardrobeLoad(C) {
	CommonPromiseCatch(WardrobeOpenCharacter(C));
}

/**
 * Serialises a character's appearance into an abbreviated string for backup purposes
 * @param {Character} C - The character whose appearance should be serialised
 * @returns {string} - A serialised version of the character's current appearance
 */
function CharacterAppearanceStringify(C) {
	return AppearanceItemStringify(C.Appearance);
}

/**
 * Serialize items to JSON, breaking the cyclic link between Item, Asset & Group
 * by serializing that into a single string representing the link.
 * @param {(readonly Item[]) | Item | any} Item
 * @returns {string}
 */
function AppearanceItemStringify(Item) {
	return JSON.stringify(Item, (key, value) => {
		if (key === "Asset") {
			return value.Group.Family + "/" + value.Group.Name + "/" + value.Name;
		}
		return value;
	});
}

/**
 * Restores a character's appearance from a serialised string generated by CharacterAppearanceStringify
 * @param {Character} C - The character whose appearance should be restored
 * @param {string | null} backup - The serialised appearance to restore
 * @returns {void} - Nothing
 */
function CharacterAppearanceRestore(C, backup) {
	if (typeof backup !== "string") return;
	C.Appearance = AppearanceItemParse(backup);
}

/**
 * @param {string} stringified
 * @returns {Item[]}
 */
function AppearanceItemParse(stringified) {
	const data = JSON.parse(stringified, (key, value) => {
		if (key === "Asset") {
			const FGA = value.split("/");
			return AssetGet(FGA[0], FGA[1], FGA[2]);
		}
		return value;
	});
	return /** @type {Item[]} */ (data);
}

/**
 * Opens the color picker for a selected item
 * @param {Character} C - The character the appearance is being changed for
 * @param {Item} Item - The currently selected item
 * @param {AssetGroup} AssetGroup - The focused group
 * @param {"" | "Cloth" | "Color"} CurrentMode - The mode to revert to on exiting the color picker
 * @returns {void}
 */
function AppearanceItemColor(C, Item, AssetGroup, CurrentMode) {
	ItemColorLoad(C, Item, 1095, 25, 880, 950, true).then(() => {
		// Keeps the previous color in backup and creates a text box to enter the color
		CharacterAppearanceMode = "Color";
		CharacterAppearanceColorPickerGroupName = AssetGroup.Name;
		CharacterAppearanceColorPickerBackup = ItemGetColor(C, CharacterAppearanceColorPickerGroupName);
		ItemColorOnExit(({ colors, initialColors, opacity, initialOpacity }, save) => {
			CharacterAppearanceMode = CurrentMode;
			if (AppearancePreviewUseCharacter(AssetGroup)) {
				if (save && (!CommonArraysEqual(colors, initialColors) || !CommonArraysEqual(opacity, initialOpacity))) {
					AppearancePreviewBuild(C, AssetGroup, true);
				}
			}
		});
	}).catch((err) => {
		console.error(`Failed to load "${CurrentModule}/${CurrentScreen}" item color subscreen:\n`, err);
		ToastManager.error(`Failed to load "${CurrentModule}/${CurrentScreen}" item color subscreen`);
	});
}

/**
 * Combine two sets of appearance changes from the same base, favouring the newer changes where conflicting
 * @param {Item[]} BaseAppearance - The previous appearance before either of the other two sets of changes were made
 * @param {Item[]} PrevAppearance - The first set of appearance changes
 * @param {Item[]} NewAppearance - The second set of appearance changes, overriding any conflicts with the first
 * @returns {Item[]} - The final merged appearance
 */
function CharacterAppearanceResolveAppearance(BaseAppearance, PrevAppearance, NewAppearance) {
	for (const group of AssetGroup) {
		if (group.Category == "Appearance") {
			const baseItem = BaseAppearance.find(A => A.Asset.Group.Name == group.Name);
			const prevItem = PrevAppearance.find(A => A.Asset.Group.Name == group.Name);
			const newItem = NewAppearance.find(A => A.Asset.Group.Name == group.Name);
			const resolvedItem = CharacterAppearanceResolveItem(baseItem, prevItem, newItem);

			// Remove and replace the group's item
			PrevAppearance = PrevAppearance.filter(A => A.Asset.Group.Name !== group.Name);
			if (resolvedItem) {
				PrevAppearance = PrevAppearance.concat(resolvedItem);
			}
		}
	}

	return PrevAppearance;
}

/**
 * Select from two potential changes to an item, preferring the newer if different to the original item
 * @param {Item | undefined} BaseItem - The item before any changes were made
 * @param {Item | undefined} PrevItem - The first item change
 * @param {Item | undefined} NewItem - The second item change
 * @returns {Item | null} - The item to keep
 */
function CharacterAppearanceResolveItem(BaseItem, PrevItem, NewItem) {
	if (!BaseItem) {
		// Add the new item if added, otherwise use the previous item whether one was added or still empty
		return NewItem ?? PrevItem ?? null;
	} else if (!NewItem) {
		// Remove the item if the newest change removed it
		return NewItem ?? null;
	} else if (AppearanceItemStringify(BaseItem) != AppearanceItemStringify(NewItem)) {
		// Use the newest item if changed from the original at all. In future could possibly compare/merge settings instead
		return NewItem;
	} else {
		// Otherwise keep the previous change
		return PrevItem ?? null;
	}
}

/**
 * Merge the incoming appearance changes from the online sync to the currently selected appearance
 * @param {Character} C - The character with changes to merge
 * @param {Item[]} currentAppearance - The appearance before the sync's changes are applied
 * @returns {void} - Nothing
 */
function CharacterAppearanceResolveSync(C, currentAppearance) {
	if (CurrentScreen == "Appearance" && C.ID == CharacterAppearanceSelection.ID) {
		const baseAppearance = AppearanceItemParse(CharacterAppearanceBackup);

		// Update the individual clothing item to revert to upon exiting the group's menu
		if (CharacterAppearanceCloth != null) {
			const appearance = CharacterAppearanceCloth;
			const baseCloth = baseAppearance.find(A => A.Asset.Group.Name == appearance.Asset.Group.Name);
			const incomingCloth = C.Appearance.find(A => A.Asset.Group.Name == appearance.Asset.Group.Name);
			CharacterAppearanceCloth = CharacterAppearanceResolveItem(baseCloth, incomingCloth, CharacterAppearanceCloth);
		}

		// Update the appearance backup to use the synced version
		CharacterAppearanceBackup = AppearanceItemStringify(C.Appearance);
		// Merge the synced appearance with the ongoing appearance edits
		C.Appearance = CharacterAppearanceResolveAppearance(baseAppearance, C.Appearance, currentAppearance);
	}
}

/**
 * Returns whether an asset with a specific gender is allowed in the current chatroom space
 * @param {Asset} asset
 */
function CharacterAppearanceGenderAllowed(asset) {
	return !asset.Gender || !ServerPlayerIsInChatRoom() || ChatSelectGendersAllowed(ChatSearchGetSpace(), [asset.Gender]);
}

/**
 * If the player is in the chat room, we display a local message for him/her
 * @param {string} Msg
 * @deprecated
 */
function CharacterAppearanceChatRoomMessage(Msg) {
	ChatRoomSendLocal(TextGet(Msg));
}

/**
 * Creates a compressed string of a character appearance and saves it to the clipboard
 * @param {Character} C - The character to copy from
 */
function CharacterAppearanceCopyToClipboard(C) {

	// If the data is invalid, we exit right away
	if ((C == null) || (C.Appearance == null) || !C.IsPlayer()) return;

	// Preoares an array with a full copy of the character appearance, excluding items
	/** @type {ClipboardAppearanceBundle} */
	let App = [];
	for (let A of C.Appearance)
		if ((A.Asset != null) && (A.Asset.Group != null) && (A.Asset.Group.Category == "Appearance") && A.Asset.Group.AllowCustomize) {
			App.push({ A: A.Asset.Name, G: A.Asset.Group.Name, C: A.Color });
		}

	// Stringify and compress the clothing data in a string
	if (App.length == 0) return;
	let S = JSON.stringify(App);
	S = LZString.compressToBase64(S);
	CommonClipboardWrite(S, (res) => {
		if (res.err) {
			ToastManager.error(res.errorAsDOM(InterfaceTextGet("AppCopyError")));
		} else {
			ToastManager.success(InterfaceTextGet("AppCopyDone"));
		}
	});
}

/**
 * Uncompress a string containing an appearance, then applies that appearance data to the character
 * @param {Character} C - The character that loads its new appearance
 * @param {string} CompApp - The compressed string of appaearance data
 * @param {boolean} ChatRoomRefresh - TRUE if the character should be refreshed online
 */
function CharacterAppearancePaste(C, CompApp, ChatRoomRefresh) {

	// If the data is invalid, we exit right away
	if ((C == null) || (C.Appearance == null) || !C.IsPlayer())
		return ChatRoomSendLocal(InterfaceTextGet("AppPasteError"));

	// If the player cannot change, we show an error in chat
	if (!C.CanChangeOwnClothes()) {
		ToastManager.error(InterfaceTextGet("AppPasteBlocked"));
		return;
	}

	// Validates the compressed string first
	if (typeof CompApp !== "string" || CompApp.length === 0) {
		ToastManager.error(InterfaceTextGet("AppPasteError"));
		return;
	}

	// Try to decompress the data
	let DecompressedData = null;
	try {
		DecompressedData = LZString.decompressFromBase64(CompApp);
	} catch {
		DecompressedData = null;
	}

	// If we failed to decompress
	if (DecompressedData == null) {
		ToastManager.error(InterfaceTextGet("AppPasteError"));
		return;
	}

	// Tries to get the appearance bundle object
	/** @type {ClipboardAppearanceBundle | null} */
	let App = null;
	try {
		const json = JSON.parse(DecompressedData);
		// We're being careful below, so this is okay
		App = /** @type {ClipboardAppearanceBundle} */(json);
	} catch {
		App = null;
	}

	// If the loaded data is invalid
	if ((App == null) || !Array.isArray(App) || (App.length == 0)) {
		ToastManager.error(InterfaceTextGet("AppPasteError"));
		return;
	}

	// Restores the appearance rows that are valid
	let MustRefresh = false;
	for (let AppRow of App)
		if ((AppRow.A != null) && (typeof AppRow.A == "string") && (AppRow.G != null) && (typeof AppRow.G == "string") && AppearanceGroupAllowed(C, AppRow.G)) {

			// On the first update, we clear the current appearance
			if (!MustRefresh) {
				const items = C.Appearance.filter(({ Asset: { Group } }) => Group.IsAppearance() && Group.AllowCustomize && Group.AllowNone && AppearanceGroupAllowed(C, Group.Name));
				InventoryRemoveItems(C, items, { refresh: false });
			}

			// Apply potential fixups when pasting
			const fixup = LoginInventoryFixups.find(f => f.Old.Group === AppRow.G && (f.Old.Name === AppRow.A || f.Old.Name === "*"));
			if (fixup) {
				AppRow.G = fixup.New.Group;
				if (fixup.New.Name) {
					AppRow.A = fixup.New.Name;
				}
			}

			// Wear the appearance asset and flags for a refresh
			InventoryWear(C, AppRow.A, AppRow.G, AppRow.C, undefined, undefined, undefined, false);
			MustRefresh = true;

		}

	// If at least one appearace row was updated, we refresh the character
	if (MustRefresh) {
		CharacterRefresh(C, false);
		if (ChatRoomRefresh) ChatRoomCharacterUpdate(C);
		ToastManager.info(InterfaceTextGet("AppPasteDone"));
	} else {
		ToastManager.error(InterfaceTextGet("AppPasteError"));
	}

}
