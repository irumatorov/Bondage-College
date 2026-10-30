"use strict";

/**
 * Property.js
 * -----------
 * A module with common helper functions for the handling of specific {@link ItemProperties} properties.
 * Note that more generic extended item functions should be confined to `ExtendedItem.js`.
 */

/**
 * A Map that maps input element IDs to their original value is defined in, _.e.g_, {@link PropertyOpacityLoad}.
 * Used as fallback in case an invalid opacity value is encountered when exiting.
 * @type {Map<string, any>}
 */
const PropertyOriginalValue = new Map([]);

/**
 * Construct an item-specific ID for a properties input element (_e.g._ an opacity slider).
 * @param {string} Name - The name of the input element
 * @param {Item | null} Item - The item for whom the ID should be constructed; defaults to {@link DialogFocusItem}
 * @returns {string} - The ID of the property
 */
function PropertyGetID(Name, Item=DialogFocusItem) {
	if (!Item) return "";
	return `${Item.Asset.Group.Name}${Item.Asset.Name}${Name}`;
}

/**
 * Throttled callback for opacity slider changes
 * @param {Character} C - The character being modified
 * @param {Item} item - The item being modified
 * @param {number} Opacity - The new opacity to set on the item
 * @returns {void} - Nothing
 */
const PropertyOpacityChange = CommonLimitFunction((C, Item, Opacity) => {
	if (Array.isArray(Item.Property.Opacity)) {
		for (const [i, layer] of Item.Asset.Layer.entries()) {
			Item.Property.Opacity[i] = CommonClamp(Opacity, layer.MinOpacity, layer.MaxOpacity);
		}
	} else {
		Item.Property.Opacity = Opacity;
	}
	CharacterLoadCanvas(C);
});

/** @type {ExtendedItemScriptHookCallbacks.Init<ExtendedItemData<any>>} */
function PropertyOpacityInit({ asset }, originalFunction, C, item, push=true, refresh=true) {
	if (!CommonIsObject(item.Property)) {
		item.Property = {};
	}

	// Abort prematurely if all opacity values are within bounds; no need for any refreshes or pushes as nothing was changed
	const opacity = item.Property.Opacity;
	if (CommonIsFinite(opacity) && item.Asset.Layer.every(l => CommonClamp(opacity, l.MinOpacity, l.MaxOpacity) === opacity)) {
		return originalFunction?.(C, item, push, refresh) ?? false;
	} else if (
		CommonIsArray(opacity)
		&& opacity.length === asset.Layer.length
		&& opacity.every((o, i) => CommonIsFinite(o, asset.Layer[i].MinOpacity, asset.Layer[i].MaxOpacity))
	) {
		return originalFunction?.(C, item, push, refresh) ?? false;
	}

	// Illegal or uninitialized opacity value; restore a valid default and perform the whole push + refresh dance
	item.Property.Opacity = asset.Layer.map(l => l.Opacity);

	if (originalFunction) originalFunction(C, item, false, false);
	if (refresh) CharacterRefresh(C, push, false);
	if (push) ChatRoomCharacterItemUpdate(C, asset.Group.Name);
	return true;
}

/**
 * Load function for items with opacity sliders. Constructs the opacity slider.
 * @param {ExtendedItemData<any>} Data - The items extended item data
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {ThumbIcon} thumbIcon The icon to use for the range input's "thumb" (handle).
 * @returns {HTMLInputElement} - The new or pre-existing range input element of the opacity slider
 * @satisfies {ExtendedItemScriptHookCallbacks.Load<ExtendedItemData<any>>}
 */
function PropertyOpacityLoad({ asset, dialogPrefix }, OriginalFunction, thumbIcon="blindfold") {
	OriginalFunction();
	const ID = PropertyGetID("Opacity");

	if (!PropertyOriginalValue.has(ID) && DialogFocusItem?.Property?.Opacity) {
		PropertyOriginalValue.set(ID, DialogFocusItem.Property.Opacity);
	}

	/** @type {number | number[] | undefined} */
	const propertyOpacity = DialogFocusItem?.Property?.Opacity;
	const opacityValue = CommonIsArray(propertyOpacity) && CommonIsNumeric(propertyOpacity[0])
			? propertyOpacity[0]
			: (/** @type {number} */ (propertyOpacity ?? 1));
	const opacity = CommonClamp(opacityValue, 0, 1);
	const minOpacity = Math.min(...asset.Layer.map(l => l.MinOpacity));
	const maxOpacity = Math.max(...asset.Layer.map(l => l.MaxOpacity));
	const opacitySlider = ElementCreateRangeInput(
		ID,
		opacity,
		minOpacity,
		maxOpacity,
		0.01,
		thumbIcon,
	);

	if (opacitySlider) {
		const C = CharacterGetCurrent();
		opacitySlider.addEventListener("input", (e) => PropertyOpacityChange(C, DialogFocusItem, Number(/** @type {HTMLInputElement} */ (e.target).value)));
		return opacitySlider;
	} else {
		return /** @type {HTMLInputElement} */(document.getElementById(ID));
	}
}

/**
 * Draw function for items with opacity sliders. Draws the opacity slider and further opacity-related information.
 * @param {ExtendedItemData<any>} Data - The items extended item data
 * @param {() => void} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {number} XOffset - An offset for all text and slider X coordinates
 * @param {number} YOffset - An offset for all text and slider Y coordinates
 * @param {TextKeysInterface} LabelKeyword - The keyword of the opacity label
 * @returns {void} Nothing
 * @satisfies {ExtendedItemScriptHookCallbacks.Draw<ExtendedItemData<any>>}
 */
function PropertyOpacityDraw(Data, OriginalFunction, XOffset=0, YOffset=0, LabelKeyword="OpacityLabel") {
	OriginalFunction();
	const ID = PropertyGetID("Opacity");

	MainCanvas.textAlign = "right";
	DrawTextFit(
		InterfaceTextGet(LabelKeyword), 1375 + XOffset, 450 + YOffset,
		400, "#FFFFFF", "#000",
	);
	ElementPosition(ID, 1625 + XOffset, 450 + YOffset, 400);
	/** @type {number | number[] | undefined} */
	const propertyOpacity = DialogFocusItem?.Property?.Opacity;
	const opacityValue = CommonIsArray(propertyOpacity) && CommonIsNumeric(propertyOpacity[0])
			? propertyOpacity[0]
			: (/** @type {number} */ (propertyOpacity ?? 1));
	const opacity = CommonClamp(opacityValue, 0, 1);
	DrawTextFit(
		`${Math.round(opacity * 100)}%`, 1925 + XOffset, 450 + YOffset,
		400, "#FFFFFF", "#000",
	);
	MainCanvas.textAlign = "center";
}

/**
 * Exit function for items with opacity sliders. Updates the items opacity, deletes the slider and (optionally) refreshes the character and item.
 * @param {ExtendedItemData<any>} Data - The items extended item data
 * @param {null | (() => void)} OriginalFunction - The function that is normally called when an archetypical item reaches this point (if any).
 * @param {boolean} Refresh - Whether character parameters and the respective item should be refreshed or not
 * @returns {boolean} Whether the opacity was updated or not
 * @satisfies {ExtendedItemScriptHookCallbacks.Exit<ExtendedItemData<any>>}
 */
function PropertyOpacityExit({ asset }, OriginalFunction, Refresh=true) {
	if (OriginalFunction != null) {
		OriginalFunction();
	}

	const ID = PropertyGetID("Opacity");
	const C = CharacterGetCurrent();
	if (!C) return false;
	const Opacity = Number(ElementValue(ID));

	// Restore the original opacity if the new opacity is invalid
	const minOpacity = Math.min(...asset.Layer.map(l => l.MinOpacity));
	const maxOpacity = Math.max(...asset.Layer.map(l => l.MaxOpacity));
	if (!(Opacity <= maxOpacity && Opacity >= minOpacity) && DialogFocusItem?.Property) {
		DialogFocusItem.Property.Opacity = PropertyOriginalValue.get(ID);
		ElementRemove(ID);
		PropertyOriginalValue.delete(ID);
		return false;
	}

	// Remove the element after calling `CharacterRefresh`
	// The latter will call `Load`, which would otherwise restore the slider again
	if (Refresh) {
		CharacterRefresh(C, true, false);
		ChatRoomCharacterItemUpdate(C, asset.Group.Name);
	}
	ElementRemove(ID);
	PropertyOriginalValue.delete(ID);
	return true;
}

/**
 * Helper fuction for publishing shock-related actions.
 * @param {Character} C - The shocked character; defaults to the {@link CharacterGetCurrent} output
 * @param {Item} Item - The shocking item; defaults to {@link DialogFocusItem}
 * @param {boolean} Automatic - Whether the shock was triggered automatically or otherwise manually
 */
function PropertyShockPublishAction(C, Item, Automatic=false) {
	if (!C || !Item) return;

	// Get item-specific properties and choose a suitable default if absent
	const ShockLevel = (Item?.Property?.ShockLevel != null) ? Item.Property.ShockLevel : 1;
	const ShowText = (Item?.Property?.ShowText != null) ? Item.Property.ShowText : true;
	if (Item?.Property?.TriggerCount != null) {
		Item.Property.TriggerCount++;
	}

	if (C.ID === Player.ID) {
		// The Player shocks herself
		ActivityArousalItem(C, C, Item.Asset);
	}
	InventoryShockExpression(C);

	const Dictionary = new DictionaryBuilder()
		.destinationCharacterName(C)
		.asset(Item.Asset, "AssetName", Item.Craft && Item.Craft.Name)
		.shockIntensity(ShockLevel * 1.5)
		.focusGroup(Item.Asset.Group.Name)
		.if(Automatic)
		.markAutomatic()
		.endif()
		.build();

	const ActionTag = `TriggerShock${ShockLevel}`;

	// Manually play audio and flash the screen when not in a chatroom
	if (CurrentScreen !== "ChatRoom") {
		AudioPlaySoundEffect("Shocks", 3 + (3 * ShockLevel));
		if (C.ID === Player.ID) {
			const duration = (Math.random() + ShockLevel * 1.5) * 500;
			DrawFlashScreen("#FFFFFF", duration, 500);
		}
	}

	// Publish the action, be it either quietly or not
	if (ShowText && CurrentScreen === "ChatRoom") {
		ChatRoomPublishCustomAction(ActionTag, false, Dictionary);
	} else if (CurrentScreen === "ChatRoom") {
		ChatRoomMessage({ Content: ActionTag, Type: "Action", Sender: Player.MemberNumber, Dictionary: Dictionary });
	}

	// Exit the dialog menu when triggering a manual shock
	if (!Automatic) {
		ExtendedItemCustomExit(ActionTag);
	}
}

/**
 * A set of group names whose auto-punishment has successfully been handled by {@link PropertyAutoPunishDetectSpeech}.
 * If a group name is absent from the set then it's eligible for action-based punishment triggers.
 * The initial set is populated by {@link AssetLoadAll} after all asset groups are defined.
 * @type {Set<AssetGroupName>}
 */
let PropertyAutoPunishHandled = new Set();

/**
 * A set with the names of all activities as performed by the player.
 * Functions as a cache for {@link PropertyPunishActivityCheck} and can be automatically emptied out by the latter.
 * @type {Set<ActivityName>}
 */
let PropertyPunishActivityCache = new Set();

/**
 * A list of keywords that can trigger automatic punishment when included in `/me`- or `*`-based messages
 * @type {readonly string[]}
 */
const PropertyAutoPunishKeywords = [
	"moan",
	"whimper",
	"shout",
	"scream",
	"whine",
	"growl",
	"laugh",
	"giggle",
	"mutter",
	"stutter",
	"stammer",
	"grunt",
	"hiss",
	"screech",
	"bark",
	"mumble",
];

/**
 * Check if a given message warants automatic punishment given the provided sensitivety level
 * @param {0 | 1 | 2 | 3} Sensitivity - The auto-punishment sensitivety
 * @param {string} msg - The to-be checked message
 * @returns {boolean} Whether the passed message should trigger automatic speech-based punishment
 */
function PropertyAutoPunishParseMessage(Sensitivity, msg) {
	// Remove the OOC component(s) from the message, as those are never punishable
	const oocRanges = SpeechGetOOCRanges(msg).reverse();
	const arrayMsg = Array.from(msg);
	oocRanges.forEach(({ start, length }) => arrayMsg.splice(start, length));
	msg = arrayMsg.join("");

	// Conditions that are always punishable
	const PunishableSpeech = (
		msg.includes('!')
		|| msg.includes('！')
		|| (msg === msg.toUpperCase() && msg !== msg.toLowerCase())
	);

	// Check for sensitivity-specific conditions
	let PunishableKeywords = false;
	switch (Sensitivity) {
		case 1:
			return (
				!msg.startsWith("*")
				&& !msg.startsWith("/")
				&& (msg.replace(/[^\p{P} ~+=^$|\\<>`]+/ug, '') !== msg && PunishableSpeech)
			);
		case 2:
			return (
				!msg.startsWith("*")
				&& !msg.startsWith("/")
				&& (
					msg.length > 25
					|| (msg.replace(/[^\p{P} ~+=^$|\\<>`]+/ug, '') !== msg && PunishableSpeech)
				)
			);
		case 3:
			PunishableKeywords = PropertyAutoPunishKeywords.some((k) => msg.includes(k));
			if (PunishableKeywords && (msg.startsWith("/me") || msg.startsWith("*"))) {
				return true;
			}

			return (
				!msg.startsWith("*")
				&& !msg.startsWith("/")
				&& (msg.replace(/[^\p{P} ~+=^$|\\<>`]+/ug, '') !== msg || PunishableSpeech)
			);
		default:
			return false;
	}
}

/**
 * Check whether the last uttered message should trigger automatic punishment from the provided item
 * @param {Item} Item - The item in question
 * @param {number | null} LastMessageLen - The length of {@link ChatRoomLastMessage} prior to the last message (if applicable)
 * @returns {boolean} Whether the last message should trigger automatic speech-based punishment
 */
function PropertyAutoPunishDetectSpeech(Item, LastMessageLen=null) {
	const GroupName = Item.Asset.Group.Name;
	const GagAction = !PropertyAutoPunishHandled.has(GroupName);
	PropertyAutoPunishHandled.add(GroupName);

	// Abort the item does not have `AutoPunish` set
	if (!Item.Property || !Item.Property.AutoPunish) {
		return false;
	}

	// Gag actions at maximum `AutoPunish` values always inflate
	if (Item.Property.AutoPunish === 3 && GagAction) {
		return true;
	}

	// Abort on whispers or if no new messages have been submitted
	if (ChatRoomTargetMemberNumber >= 0 || !ChatRoomLastMessage || ChatRoomLastMessage.length === LastMessageLen) {
		return false;
	}

	const msg = ChatRoomLastMessage[ChatRoomLastMessage.length - 1];
	return PropertyAutoPunishParseMessage(Item.Property.AutoPunish, msg);
}

/**
 * Check if the player character has performed one or more of the passed activities ever since the last {@link PropertyPunishActivityNames} refresh.
 * @param {null | ActivityName | readonly ActivityName[]} name - The name(s) of the activity to check. If `null`, check if any activity at all is present
 * @param {boolean} clearCache - Whether to automatically remove `name` from the {@link PropertyPunishActivityNames} cache.
 * `name == null` implies that all entries should be removed.
 * @returns {boolean}
 */
function PropertyPunishActivityCheck(name=null, clearCache=true) {
	/** @type {boolean} */
	let punish;
	if (typeof name === "string") {
		punish = PropertyPunishActivityCache.has(name);
		if (clearCache) { PropertyPunishActivityCache.delete(name); }
	} else if (CommonIsArray(name)) {
		punish = name.some(PropertyPunishActivityCache.has);
		if (clearCache) { name.forEach(PropertyPunishActivityCache.delete); }
	} else {
		punish = PropertyPunishActivityCache.size > 0;
		if (clearCache) { PropertyPunishActivityCache.clear(); }
	}
	return punish;
}

/**
 * Assign a property on an {@link ItemProperties} record via dynamic key.
 * Used by {@link PropertyUnion} and {@link PropertyDifference} where keys are only known at runtime.
 * @template {ItemProperties} T
 * @template {keyof T} K
 * @param {T} output
 * @param {K} key
 * @param {T[K]} value
 */
function PropertyAssign(output, key, value) {
	output[key] = value;
}

/**
 * Merge all passed item properties into the passed output, merging (and shallow copying) arrays if necessary.
 * @param {ItemProperties} output - The to be updated properties
 * @param {readonly ItemProperties[]} args - The additional item properties to be merged into the output
 * @returns {ItemProperties} - The passed output modified inplace
 */
function PropertyUnion(output, ...args) {
	for (const property of args) {
		for (const [key, value] of CommonEntries(property)) {
			switch (key) {
				case "Tint": {
					if (!Array.isArray(value)) {
						break;
					}
					const previousValue = Array.isArray(output[key]) ? [...output[key]] : [];
					output[key] = [
						...previousValue,
						.../** @type {TintDefinition[]} */ (value.filter(i => !previousValue.some(j => CommonObjectEqual(i, j)))),
					];
					break;
				}
				case "HeightModifier":
				case "Difficulty": {
					const newValue = (output[key] || 0) + (/** @type {number} */ (value) || 0);
					PropertyAssign(output, key, newValue);
					break;
				}
				case "TypeRecord": {
					output.TypeRecord = {
						...(output.TypeRecord || {}),
						.../** @type {TypeRecord} */ (value),
					};
					break;
				}
				default: {
					if (Array.isArray(value)) {
						const arrayKey = /** @type {keyof PropertiesArray.Item} */ (key);
						const previousValue = Array.isArray(output[arrayKey]) ? [...output[arrayKey]] : [];
						PropertyAssign(output, arrayKey, /** @type {PropertiesArray.Item[typeof arrayKey]} */ ([
							...previousValue,
							...value.filter(i => !previousValue.includes(i)),
						]));
					} else {
						const propertyKey = /** @type {keyof PropertiesNoArray.Item} */ (key);
						PropertyAssign(output, propertyKey, /** @type {PropertiesNoArray.Item[typeof propertyKey]} */ (value));
					}
				}
			}
		}
	}
	return output;
}

/**
 * Remove all passed item properties from the passed output, removing (and shallow copying) array entries if necessary.
 * @param {ItemProperties} output - The to-be updated properties
 * @param {readonly ItemProperties[]} args - The additional item properties to be removed from the output
 * @returns {ItemProperties} - The passed output modified inplace
 */
function PropertyDifference(output, ...args) {
	for (const property of args) {
		for (const [key, value] of CommonEntries(property)) {
			switch (key) {
				case "Tint": {
					if (!Array.isArray(value)) {
						break;
					}
					const previousValue = Array.isArray(output[key]) ? output[key] : [];
					output[key] = previousValue.filter(i => !value.some(j => CommonObjectEqual(i, j)));
					break;
				}
				case "HeightModifier":
				case "Difficulty": {
					const newValue = (output[key] || 0) - (/** @type {number} */ (value) || 0);
					PropertyAssign(output, key, newValue);
					break;
				}
				case "TypeRecord": {
					output.TypeRecord = CommonOmit(output.TypeRecord || {}, Object.keys(/** @type {TypeRecord} */ (value)));
					break;
				}
				default: {
					if (Array.isArray(value)) {
						const arrayKey = /** @type {keyof PropertiesArray.Item} */ (key);
						const previousValue = Array.isArray(output[arrayKey]) ? output[arrayKey] : [];
						PropertyAssign(output, arrayKey, /** @type {PropertiesArray.Item[typeof arrayKey]} */ (
							previousValue.filter(i => !value.includes(i))
						));
						if (output[arrayKey]?.length) {
							break;
						}
					}
					delete /** @type {ItemProperties} */ (output)[/** @type {keyof ItemProperties} */ (key)];
				}
			}
		}
	}
	return output;
}

/**
 * Convert the passed type record into a list of stringified key/value pairs.
 * @param {TypeRecord} typeRecord
 * @returns {string[]}
 */
function PropertyTypeRecordToStrings(typeRecord) {
	return Object.entries(typeRecord).map(([i, j]) => `${i}${j}`);
}

/**
 * @namespace
 * Namespace with helper functions for managing {@link ItemProperties["DrawingLeft"]}/{@link ItemProperties["DrawignTop"]} data.
 */
var PropertyLayerOrigin = {
	/**
	 * Resolve the `Left/Top` data for the specified item, including any {@link ItemProperties}-based corrections.
	 * @param {Item} item
	 * @param {"DrawingTop" | "DrawingLeft"} fieldName
	 * @returns {Partial<Record<LayerName, Mutable<TopLeft.Data>>>}
	 */
	resolveItem: function resolveItem(item, fieldName) {
		return Object.fromEntries(item.Asset.Layer.map(l => [l.Name ?? "", PropertyLayerOrigin.resolveLayer(l, fieldName, item.Property)]));
	},

	/**
	 * Resolve the `Left/Top` data for the specified layer, including any {@link ItemProperties}-based corrections.
	 * @param {AssetLayer} layer
	 * @param {"DrawingTop" | "DrawingLeft"} fieldName
	 * @param {null | ItemProperties} properties
	 * @returns {Mutable<TopLeft.Data>}
	 */
	resolveLayer: function resolveLayer(layer, fieldName, properties=null) {
		const layerName = layer.Name ?? "";
		/** @type {Mutable<TopLeft.Data>} */
		const ret = { ...layer[fieldName] };

		const extendedData = properties?.[fieldName];
		const extendedOverride = extendedData?.[AssetOverride];
		if (extendedData) {
			if (extendedData[layerName]) {
				CommonAssign(ret, extendedData[layerName]);
			} else if (extendedOverride) {
				CommonKeys(ret).forEach((poseName) => ret[poseName] += (extendedOverride[poseName] ?? 0));
			}
		}
		return ret;
	},

	/**
	 * Get the item's original `Left/Top` data as determined by its layer- and extended item data; any user-made alterations are removed.
	 * @param {Item} item
	 * @param {"DrawingTop" | "DrawingLeft"} fieldName
	 * @returns {Partial<Record<LayerName, Mutable<TopLeft.Data>>>}
	 */
	getOriginal: function getOriginal(item, fieldName) {
		if (item.Asset.Extended && item.Property?.TypeRecord) {
			const itemOriginal = AppearanceItem.fromAsset(item.Asset);
			ExtendedItemSetOptionByRecord(Player, itemOriginal, { ...item.Property?.TypeRecord }, { refresh: false });
			return PropertyLayerOrigin.resolveItem(itemOriginal, fieldName);
		} else {
			return PropertyLayerOrigin.resolveItem(item, fieldName);
		}
	},
};

/**
 * @template {keyof ItemProperties} T
 * @implements {ItemProperty.EntryNullable<T>}
 */
class PropertyDataEntry {
	/**
	 * @readonly
	 * @private
	 * @type {Map<keyof ItemProperties, PropertyDataEntry<any>>}
	 */
	static _entries = new Map();

	/**
	 * @readonly
	 * @type {NonNullable<ItemProperty.PropertyMetaData[T]>}
	 */
	metaData;

	/**
	 * @readonly
	 * @type {T}
	 */
	name;

	/**
	 * @private
	 * @type {undefined | ItemProperty.Compress<T>}
	 */
	_compress;

	/**
	 * @private
	 * @type {undefined | ItemProperty.Decompress<T>}
	 */
	_decompress;

	/**
	 * @private
	 * @type {undefined | ItemProperty.Union<T>}
	 */
	_union;

	/**
	 * @private
	 * @type {undefined | ItemProperty.Difference<T>}
	 */
	_difference;

	/**
	 * @private
	 * @type {undefined | ItemProperty.Compare<T>}
	 */
	_compare;

	/**
	 * @private
	 * @type {undefined | ItemProperty.Validate<T>}
	 */
	_validate;

	/**
	 * @private
	 * @type {undefined | ItemProperty.IsSubset<T>}
	 */
	_isSubset;

	/**
	 * @param {T} name
	 * @param {ItemProperty.PropertyMetaData[T]} metaData
	 * @param {Omit<ItemProperty.Entry<T>, "metaData">} functions
	 */
	constructor(name, metaData, functions) {
		this.name = name;
		this.metaData = metaData ?? /** @type {NonNullable<typeof metaData>} */({});

		const { compress, decompress, union, difference, compare, validate, isSubset } = functions;
		this._compress = compress;
		this._decompress = decompress;
		this._union = union;
		this._difference = difference;
		this._compare = compare;
		this._validate = validate;
		this._isSubset = isSubset;
		PropertyDataEntry._entries.set(name, this);
	}

	/**
	 * Compress the passed item property
	 * @param {ItemProperties[T]} property The item property value
	 * @param {ItemProperty.DataBundle} itemData The item data
	 * @param {ItemProperties[T]} [defaults] The default value of the property (if any)
	 * @returns {ItemPropertiesMinimized} The compressed property
	 */
	compress(property, itemData, defaults=undefined) {
		if (property === undefined) {
			return {};
		} else if (this._compress !== undefined) {
			return this._compress.call(this, property, itemData, defaults ?? undefined) ?? {};
		} else if (defaults !== undefined && this.compare(property, defaults, itemData)) {
			return {};
		} else {
			return { [this.name]: property };
		}
	}

	/**
	 * Decompress the passed item property
	 * @param {ItemPropertiesMinimized[T] | ItemProperties[T]} property The item property value. This property value _should_ be compressed though decompressed value _must_ be handled correctly.
	 * @param {ItemProperty.DataBundle} itemData The item data
	 * @returns {ItemProperties} The decompressed property
	 */
	decompress(property, itemData) {
		if (property === undefined) {
			return {};
		} else if (this._decompress === undefined) {
			return { [this.name]: property };
		} else {
			return this._decompress.call(this, property, itemData) ?? {};
		}
	}

	/**
	 * Property union function.
	 *
	 * By default, properties follow a "first non-nullish entry wins" approach if no property-specific merge function is available.
	 * @param {readonly ItemProperties[T][]} properties The to-be merged property values
	 * @param {ItemProperty.DataBundle} itemData The item data
	 * @returns {undefined | ItemProperties[T]} The merged property
	 */
	union(properties, itemData) {
		// TODO: Swap `!= null` for `!== undefined` once all the validation is hooked up
		const propNonNull = properties.filter(i => i != null);
		if (this._union === undefined || propNonNull.length === 0) {
			return propNonNull[0];
		} else {
			const arrayNonEmpty = /** @type {[p0: NonNullable<ItemProperties[T]>, ...pN: NonNullable<ItemProperties[T]>[]]} */(propNonNull);
			return this._union.call(this, arrayNonEmpty, itemData);
		}
	}

	/**
	 * Property difference function.
	 * @param {readonly ItemProperties[T][]} properties The to-be differenced property values
	 * @param {ItemProperty.DataBundle} itemData The item data
	 * @returns {undefined | ItemProperties[T]} The differenced property
	 */
	difference(properties, itemData) {
		const propNonNull = properties.filter(i => i !== undefined);
		if (propNonNull.length <= 1) {
			return propNonNull[0];
		} else if (this._difference === undefined) {
			return undefined;
		} else {
			const arrayNonEmpty = /** @type {[p0: NonNullable<ItemProperties[T]>, p1: NonNullable<ItemProperties[T]>, ...pN: NonNullable<ItemProperties[T]>[]]} */(propNonNull);
			return this._difference.call(this, arrayNonEmpty, itemData);
		}
	}

	/**
	 * Property comparison function
	 * @param {ItemProperties[T]} prop1 The firs to-be compared property
	 * @param {ItemProperties[T]} prop2 The firs to-be compared property
	 * @param {ItemProperty.DataBundle} itemData The item data
	 * @returns {boolean} whether both properties are equivalent
	 */
	compare(prop1, prop2, itemData) {
		if (prop1 === undefined && prop2 === undefined) {
			return true;
		} else if (prop1 === undefined || prop2 === undefined) {
			return false;
		} else if (this._compare === undefined) {
			return prop1 === prop2;
		} else {
			return this._compare.call(this, prop1, prop2, itemData);
		}
	}

	/**
	 * Property subset-or-equivalency comparison function
	 * @param {ItemProperties[T]} subProp The firs to-be compared property
	 * @param {ItemProperties[T]} superProp The firs to-be compared property
	 * @param {ItemProperty.DataBundle} itemData The item data
	 * @returns {boolean} whether both properties are equivalent _or_ whether `subProp` represents a property subset of `superProp`
	 */
	isSubset(subProp, superProp, itemData) {
		if (subProp === undefined) {
			// `{ Foo: undefined }` (i.e. `{}`) is a subset of any other object (or is equivalent)
			return true;
		} else if (superProp !== undefined && this._isSubset !== undefined){
			return this._isSubset.call(this, subProp, superProp, itemData);
		} else if (superProp !== undefined && this._compare !== undefined){
			return this._compare.call(this, subProp, superProp, itemData);
		} else {
			return false;
		}
	}

	/**
	 * Property comparison function
	 * @param {ItemProperties[T]} prop The firs to-be compared property
	 * @param {ItemProperty.DataBundle} itemData The item data
	 * @param {ItemProperties[T]} [defaults] The default value of the property (if any)
	 * @returns {ItemProperty.ValidationOutput<ItemProperties[T]>} whether both properties are equivalent
	 */
	validate(prop, itemData, defaults=undefined) {
		if (prop === undefined) {
			return { status: "ok", value: undefined };
		} else if (this._validate === undefined) {
			return { status: "criticalError", errorDescription: `Missing "${this.name}" validator function` };
		} else {
			return this._validate.call(this, prop, itemData, defaults);
		}
	}

	/**
	 * Construct a new entry via shallow copying and renaming an existing one.
	 *
	 * Note that both new- and old-entries _must_ have the same property- and metadata types.
	 * @template {keyof ItemProperties} T
	 * @param {keyof ItemProperties} fromName The old property name of the to-be copied entry object
	 * @param {T} toName The new property name
	 * @param {ItemProperty.Entry<T>} [override] Override specific entries from the copied data
	 * @returns {PropertyDataEntry<T>} The newly copied entry
	 */
	static copyFrom(fromName, toName, override=undefined) {
		/** @type {undefined | PropertyDataEntry<any>} */
		let entry = PropertyDataEntry._entries.get(/** @type {keyof ItemProperties} */(fromName));
		if (!entry) {
			throw new Error(`Failed to copy unregistered entry "${String(fromName)}"`);
		}

		const kwargs = {
			compress: entry._compress,
			decompress: entry._decompress,
			union: entry._union,
			difference: entry._difference,
			compare: entry._compare,
			isSubset: entry._isSubset,
			validate: entry._validate,
			metaData: entry.metaData,
			...(override ?? {}),
		};
		return new PropertyDataEntry(toName, kwargs.metaData, kwargs);
	}

	/**
	 * Character code offset for excluding ASCII control characters.
	 * @readonly
	 */
	static ASCIIControlOffset = /** @type {const} */(32);

	/**
	 * Compress an object with layer-specific numeric entries into a string.
	 *
	 * The string is of length `<= Asset.Layer.length`,
	 * with the character code of each substring mapping to their layer-specific numeric entry per `charCodeCallback`.
	 *
	 * The utilized UTF16 character code ranges (_i.e._ `uint16`) are as following:
	 * - `[0, 31]` reserved; ASCII control character range. The `0` code is used for padding
	 * - `[32, 2**15 - 1]` positive number range
	 * - `[2**15, 2**15 + 31]` reserved; mirroring the (offsetted) ASCII control character range
	 * - `[2**15 + 32, 2**16 - 1]` negative number range; offset and represented by their absolute value
	 *
	 * Floating point values (defined per {@link PropertyDataEntry.metaData.stepSize}) are represented with a decimal resolution of 0.01,
	 * _i.e._ multiplied by 100 and rounded to the nearest integer.
	 * @param {Partial<Record<LayerName | "", number>>} value The to-be compressed value
	 * @param {Asset} asset The asset
	 * @param {undefined | Partial<Record<LayerName | "", number>>} defaults Layer-specific default values (if any)
	 * @returns {undefined | string} The compressed entries
	 */
	compressNumberRecord(value, asset, defaults) {
		defaults ??= {};
		const { isInteger, defaultNumber: defaultCandidate } = this.metaData;
		const stepSize = (isInteger ?? true) ? 1 : 0.01;
		const valueCompressed = asset.Layer.map(layer => {
			const layerValue = value[layer.Name ?? ""];
			if (!CommonIsFinite(layerValue)) {
				return 0;
			}
			const defaultValue = defaults[layer.Name ?? ""] ?? defaultCandidate ?? 0;
			return layerValue === defaultValue ? 0 : PropertyDataEntry.compressNumber(layerValue, stepSize);
		});
		for (let i = valueCompressed.length; i >= 0; i--) {
			if (!valueCompressed[i]) {
				valueCompressed.splice(i, 1); // Trim trailing 0s
			} else {
				break;
			}
		}
		return valueCompressed.length ? valueCompressed.map(i => String.fromCharCode(i)).join("") : undefined;
	}

	/**
	 * Decompress a string back into an object with layer-specific numeric entries
	 *
	 * The is expected to be string of length `<= Asset.Layer.length`,
	 * with the character code of each substring mapping to their layer-specific numeric entry per `charCodeCallback`.
	 * @param {string} value The to-be decompressed value
	 * @param {Asset} asset The asset
	 * @returns {undefined | Partial<Record<LayerName | "", number>>} The decompressed entries
	 */
	decompressNumberRecord(value, asset) {
		const { isInteger, min, max } = this.metaData;
		const stepSize = (isInteger ?? true) ? 1 : 0.01;
		const ret = asset.Layer.map((layer, layerIndex) => {
			const layerMappedValue = value.charCodeAt(layerIndex);
			if (!layerMappedValue) {
				return undefined;
			}
			const layerValue = CommonClamp(PropertyDataEntry.decompressNumber(layerMappedValue, stepSize), min ?? -Infinity, max ?? Infinity);
			return /** @type {const} */([layer.Name ?? "", layerValue]);
		}).filter(i => i !== undefined);
		return ret.length !== 0 ? CommonFromEntries(ret) : undefined;
	}

	/**
	 * Compress a number into the `uint16` range from `float64`.
	 * @param {number} value
	 * @param {1 | 0.01} [floatResolution]
	 * @returns {number}
	 */
	static compressNumber(value, floatResolution=undefined) {
		floatResolution ??= 1;
		const int16Max = 2**15;
		const extrema = int16Max - PropertyDataEntry.ASCIIControlOffset;
		const valueInt = CommonClamp(Math.round(value / floatResolution), -extrema, extrema - 1);
		if (value < 0) {
			return -valueInt + PropertyDataEntry.ASCIIControlOffset + int16Max;
		} else {
			return valueInt + PropertyDataEntry.ASCIIControlOffset;
		}
	}

	/**
	 * Decompress a number from the `uint16` range into `float64`.
	 * @param {number} value
	 * @param {1 | 0.01} [floatResolution]
	 * @returns {number}
	 */
	static decompressNumber(value, floatResolution=undefined) {
		floatResolution ??= 1;
		const int16Max = 2**15;
		if (value >= int16Max) {
			return -1 * (value - PropertyDataEntry.ASCIIControlOffset - int16Max) * floatResolution;
		} else {
			return (value - PropertyDataEntry.ASCIIControlOffset) * floatResolution;
		}
	}

	/**
	 * Comparison function for set-like arrays
	 * @satisfies {ItemProperty.Compare<keyof ItemProperties>}
	 * @template {string | boolean | number} T
	 * @param {readonly T[]} value1
	 * @param {readonly NoInfer<T>[]} value2
	 * @returns {boolean}
	 */
	static compareSetLikeArrays(value1, value2) {
		return CommonArraysEqual(value1, value2, true);
	}

	/**
	 * Comparison function for simple objects with scalar values (numbers, strings, etc.)
	 * @satisfies {ItemProperty.Union<keyof ItemProperties>}
	 * @template {string | boolean | number} T
	 * @param {readonly (readonly T[])[]} values
	 * @returns {T[]}
	 */
	static unionSetLikeArrays(values) {
		return Array.from(new Set(values.flat()));
	}
	/**
	 * Comparison function for simple objects with scalar values (numbers, strings, etc.)
	 * @satisfies {ItemProperty.Compare<keyof ItemProperties>}
	 * @template {Readonly<Record<string, undefined | null | string | boolean | number>>} T
	 * @param {T} value1
	 * @param {Readonly<Record<string, undefined | null | string | boolean | number>>} value2
	 * @returns {value2 is T}
	 */
	static compareShallowObjects(value1, value2) {
		return CommonObjectEqual(value1, value2);
	}

	/**
	 * Comparison function for simple objects with scalar values (numbers, strings, etc.)
	 * @satisfies {ItemProperty.Union<keyof ItemProperties>}
	 * @template {Record<string, undefined | null | string | boolean | number>} T
	 * @param {readonly Readonly<T>[]} values
	 * @returns {T}
	 */
	static unionShallowObjects(values) {
		/** @type {Record<string, undefined | null | string | boolean | number>} */
		const ret = {};
		for (const value of values) {
			for (const [k, v] of Object.entries(value)) {
				if (v !== undefined) {
					ret[k] ??= v;
				}
			}
		}
		return /** @type {T} */(ret);
	}
}

/**
 * Item property specific metadata and utility functions (compression, validation, merging, _etc._)
 * @satisfies {{ [k in keyof ItemProperties]?: PropertyDataEntry<k> }}
 */
var PropertyData = {
	AccessMode: undefined,
	AllowActivePose: undefined,
	AllowActivity: undefined,
	AllowActivityOn: undefined,
	ArousalLvl: undefined,
	Attribute: undefined,
	AutoPunish: undefined,
	AutoPunishUndoTime: undefined,
	AutoPunishUndoTimeSetting: undefined,
	BlinkState: new PropertyDataEntry("BlinkState", undefined, {
		compress() {
			return undefined; // Local-only property; should never be synced
		},
	}),
	Block: new PropertyDataEntry("Block", undefined, {
		compare: PropertyDataEntry.compareSetLikeArrays,
		union: PropertyDataEntry.unionSetLikeArrays,
	}),
	BlockRemotes: new PropertyDataEntry("BlockRemotes", undefined, {
		decompress(prop) {
			return prop ? { BlockRemotes: prop, Effect: ["BlockRemotes"] } : { BlockRemotes: prop };
		},
	}),
	CombinationNumber: undefined,
	CustomBlindBackground: undefined,
	DefaultColor: undefined,
	Difficulty: undefined,
	Door: undefined,
	DrawingLeft: undefined,
	DrawingTop: undefined,
	Effect: new PropertyDataEntry("Effect", undefined, {
		compare: PropertyDataEntry.compareSetLikeArrays,
		union: PropertyDataEntry.unionSetLikeArrays,
		compress(prop, { asset }) {
			/** @type {Mandatory<ItemPropertiesMinimized, "Effect">} */
			const ret = { Effect: /** @type {never} */(undefined) };
			if (asset.AllowEffect?.includes("IsLeashed") && prop.includes("IsLeashed")) {
				ret.IsLeashed = true;
			}
			return ret;
		},
	}),
	EnableRandomInput: undefined,
	Expression: undefined,
	Fetish: undefined,
	HeartRate: PropertyDataEntry.copyFrom("BlinkState", "HeartRate"),
	HeightModifier: undefined,
	Hide: PropertyDataEntry.copyFrom("Block", "Hide"),
	HideItem: PropertyDataEntry.copyFrom("Block", "HideItem"),
	HideItemExclude: undefined,
	Hint: undefined,
	InflateLevel: undefined,
	InsertedBeads: undefined,
	Intensity: undefined,
	IsLeashed: new PropertyDataEntry("IsLeashed", undefined, {
		decompress(prop) {
			return prop ? { IsLeashed: /** @type {never} */(undefined), Effect: ["IsLeashed"] } : undefined;
		},
	}),
	Iterations: undefined,
	LastShrinkWarningTime: undefined,
	LayerRotation: new PropertyDataEntry("LayerRotation",
		{ defaultNumber: 0, min: -180, max: 180 },
		{
			compare: PropertyDataEntry.compareShallowObjects,
			union: PropertyDataEntry.unionShallowObjects,
			compress(prop, { asset }, defaults) {
				if (_ItemPropertiesR134Compression) {
					const value = this.compressNumberRecord(prop, asset, defaults);
					return value ? { [this.name]: value } : undefined;
				} else {
					// Remove as of R134Alpha
					return { [this.name]: /** @type {never} */(prop) };
				}
			},
			decompress(prop, { asset }) {
				if (typeof prop === "string") {
					const value = this.decompressNumberRecord(prop, asset);
					return value ? { [this.name]: value } : undefined;
				} else {
					return { [this.name]: prop };
				}
			},
		},
	),
	LayerScaleX: PropertyDataEntry.copyFrom("LayerRotation", "LayerScaleX",
		{ metaData: { defaultNumber: 1.0, min: 0.01, max: 3.00, isInteger: false } },
	),
	LayerScaleY: PropertyDataEntry.copyFrom("LayerScaleX", "LayerScaleY"),
	LayerTranslationX: PropertyDataEntry.copyFrom("LayerScaleX", "LayerTranslationX",
		{ metaData: { defaultNumber: 0, min: -500, max: 500 } },
	),
	LayerTranslationY: PropertyDataEntry.copyFrom("LayerTranslationX", "LayerTranslationY"),
	LockButt: undefined,
	LockMemberName: undefined,
	LockMemberNumber: undefined,
	LockMessage: undefined,
	LockPickSeed: undefined,
	LockSet: undefined,
	LockedBy: undefined,
	MemberNumberList: new PropertyDataEntry("MemberNumberList", undefined, {
		compare: PropertyDataEntry.compareSetLikeArrays,
		union: PropertyDataEntry.unionSetLikeArrays,
	}),
	MemberNumberListKeys: undefined,
	Mode: undefined,
	NextShockTime: undefined,
	NextShrinkTime: undefined,
	Opacity: undefined,
	OpenPermission: undefined,
	OpenPermissionArm: undefined,
	OpenPermissionChastity: undefined,
	OpenPermissionLeg: undefined,
	OrgasmCount: undefined,
	OriginalSetting: undefined,
	OverrideHeight: undefined,
	OverridePriority: new PropertyDataEntry("OverridePriority",
		{ min: -99, max: 99 },
		{
			compare(prop1, prop2, { asset }) {
				if (typeof prop1 === "number" && typeof prop2 === "number") {
					return prop1 === prop2;
				}
				if (typeof prop1 === "number") {
					const prop1Num = prop1;
					prop1 = CommonFromEntries(asset.Layer.map(l => [l.Name ?? "", prop1Num]));
				}
				if (typeof prop2 === "number") {
					const prop2Num = prop2;
					prop2 = CommonFromEntries(asset.Layer.map(l => [l.Name ?? "", prop2Num]));
				}
				return PropertyDataEntry.compareShallowObjects(prop1, prop2);
			},
			union(properties, { asset }) {
				if (properties.every(i => typeof i === "number")) {
					return properties.at(-1);
				}
				const propOjbects = properties.map(i => {
					if (typeof i === "number") {
						return CommonFromEntries(asset.Layer.map(l => [l.Name ?? "", i]));
					} else {
						return i;
					}
				});
				return PropertyDataEntry.unionShallowObjects(propOjbects);
			},
			compress(prop, { asset }, defaults) {
				if (_ItemPropertiesR134Compression) {
					/** @type {Partial<Record<LayerName, number>>} */
					// @ts-ignore: Non-strict fails to narrow this down to an object; presumably due to `undefined` shenanigens
					const defaultsObj = CommonIsObject(defaults) ? defaults : CommonFromEntries(asset.Layer.map(l => [l.Name ?? "", defaults ?? l.Priority]));
					if (typeof prop === "number") {
						return Object.values(defaultsObj).every(i => i === prop) ? undefined : { [this.name]: prop };
					} else {
						const value = this.compressNumberRecord(prop, asset, defaultsObj);
						return value ? { [this.name]: value } : undefined;
					}
				} else {
					// Remove the `!_ItemPropertiesR134Compression` branch as of R134Alpha
					return { [this.name]: /** @type {never} */(prop) };
				}
			},
			decompress(prop, { asset }) {
				if (typeof prop === "string") {
					const value = this.decompressNumberRecord(prop, asset);
					return value ? { [this.name]: value } : undefined;
				} else {
					return { [this.name]: prop };
				}
			},
		},
	),
	Padding: undefined,
	Password: undefined,
	PortalLinkCode: undefined,
	PublicModeCurrent: undefined,
	PublicModePermission: undefined,
	PunishActivity: undefined,
	PunishOrgasm: undefined,
	PunishProhibitedSpeech: undefined,
	PunishProhibitedSpeechWords: undefined,
	PunishRequiredSpeech: undefined,
	PunishRequiredSpeechWord: undefined,
	PunishSpeech: undefined,
	PunishStandup: undefined,
	PunishStruggle: undefined,
	PunishStruggleOther: undefined,
	RemoveItem: undefined,
	RemoveOnUnlock: undefined,
	RemoveTimer: undefined,
	Revert: undefined,
	Rotation: undefined,
	RuinedOrgasmCount: undefined,
	ScaleX: undefined,
	ScaleY: undefined,
	SelfUnlock: undefined,
	SetPose: undefined,
	ShockLevel: undefined,
	ShowShrinkText: undefined,
	ShowText: undefined,
	ShowTimer: undefined,
	ShrinkCooldown: undefined,
	State: undefined,
	SuctionLevel: undefined,
	TargetAngle: undefined,
	Text: undefined,
	Text2: undefined,
	Text3: undefined,
	Texts: undefined,
	TimeSinceLastOrgasm: new PropertyDataEntry("TimeSinceLastOrgasm", undefined, {
		compress(prop) {
			// Never compress
			return { [this.name]: prop };
		},
	}),
	TimeWorn: new PropertyDataEntry("TimeWorn", undefined, {
		compress(prop) {
			// Never compress
			return { [this.name]: prop };
		},
	}),
	Tint: undefined,
	TranslationX: undefined,
	TranslationY: undefined,
	TriggerCount: undefined,
	TriggerValues: undefined,
	Type: undefined,
	TypeRecord: new PropertyDataEntry("TypeRecord", undefined, {
		compress(prop) {
			const entries = CommonEntries(prop ?? {}).filter(([k, v]) => !!v);
			return entries.length ? { [this.name]: CommonFromEntries(entries) } : undefined;
		},
		compare: PropertyDataEntry.compareShallowObjects,
		union: PropertyDataEntry.unionShallowObjects,
	}),
	UnHide: PropertyDataEntry.copyFrom("Block", "UnHide"),
};
