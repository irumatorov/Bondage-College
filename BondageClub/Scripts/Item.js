"use strict";

/**
 * Detects specific voice commands from a chat message.
 *
 * This is shared by most voice-detection items that pass in their configured trigger values,
 * and gives back the matching indexes of those.
 *
 * @param {string} msg
 * @param {readonly string[]} TriggerValues
 * @returns {number[]}
 */
function ItemModuleVoiceCommandDetect(msg, TriggerValues) {
	/** @type {number[]} */
	const commandsReceived = [];

	// If the message is OOC, just return immediately
	if (msg.startsWith('(')) return commandsReceived;

	for (const [i, triggervalue] of TriggerValues.entries()) {
		// Don't execute arbitrary regex
		let regexString = triggervalue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

		// Allow `*` wildcard, and normalize case
		regexString = regexString.replace(/\*/g, ".*");
		regexString = regexString.toUpperCase();

		const nonLatinCharRegex = new RegExp('^([^\\x20-\\x7F]|\\\\.\\*)+$');
		let triggerRegex;

		// In general, in most of the Asian language, the full sentence will be considered as one whole word
		// Because how regex consider word boundaries to be position between \w -> [A-Za-z0-9_] and \W.

		// So if commands are set to those languages, the command will never be triggered.
		// Or if the command is not a word
		// This enhancement should allow Asian language commands, and also emoji/special characters
		// (e.g. A symbol such as ↑ or ↓, Languages in CJK group such as Chinese, Japanese, and Korean.)
		// This should be a fun addition to boost the user's experience.
		if (nonLatinCharRegex.test(regexString)) {
			triggerRegex = new RegExp(regexString);
		} else {
			triggerRegex = new RegExp(`\\b${regexString}\\b`);
		}
		const success = triggerRegex.test(msg);

		if (success) commandsReceived.push(i);
	}
	return commandsReceived;
}

/**
 * Handles the generic processing of voice commands.
 *
 * This is used by most voice detection items to get back a list of triggers
 * from the last time the chat log was processed.
 *
 * @param {Character} C
 * @param {Item} item
 * @param {number} LastTime
 * @param {readonly VoiceTriggerType[]} VoiceTriggers
 * @param {readonly string[]} TriggerValues
 * @returns {VoiceTriggerType[]}
 */
function ItemModuleVoiceCommandHandle(C, item, LastTime, VoiceTriggers, TriggerValues) {
	/** @type {VoiceTriggerType[]} */
	const triggers = [];
	if (!item) return triggers;

	// Search from latest message backwards, allowing early exit
	for (let CH = ChatRoomChatLog.length - 1; CH >= 0; CH--) {
		const logEntry = ChatRoomChatLog[CH];

		// Messages are in order, no need to keep looping
		if (logEntry.Time <= LastTime) break;

		// Skip messages from unauthorized users
		const sender = ChatRoomCharacter.find(c => c.MemberNumber === logEntry.SenderMemberNumber);
		if (!sender || !ServerChatRoomGetAllowItem(sender, C)) continue;
		if (item.Property?.AccessMode === ItemVulvaFuturisticVibratorAccessMode.PROHIBIT_SELF && logEntry.SenderMemberNumber === C.MemberNumber) continue;
		if (item.Property?.AccessMode === ItemVulvaFuturisticVibratorAccessMode.LOCK_MEMBER_ONLY && logEntry.SenderMemberNumber !== item.Property.LockMemberNumber) continue;

		let msg = ItemModuleVoiceCommandDetect(logEntry.Chat.toUpperCase(), TriggerValues);

		if (msg.length > 0) {
			for (let i = 0; i < msg.length; i++) {
				triggers.push(VoiceTriggers[msg[i]]);
			}
		}
	}
	return triggers;
}


/**
 * @param {Character} C
 * @param {Item} item
 * @param {number} shockCooldown
 * @param {AssetGroupItemName[]} tamperZones
 */
function ItemModulePunishCheck(C, item, shockCooldown, tamperZones) {
	const { PunishOrgasm, PunishStruggle, PunishStruggleOther, PunishStandup, NextShockTime = 0} = item.Property ??= {};
	if ((CommonTime() > NextShockTime) && PunishOrgasm && C.ArousalSettings && C.ArousalSettings.OrgasmStage > 1) {
		// Punish the player if they orgasm
		item.Property.NextShockTime = CurrentTime + shockCooldown;
		return "Orgasm";
	} else if (PunishStruggleOther && C.FocusGroup && StruggleProgressPrevItem != null && StruggleProgressStruggleCount > 0 && (StruggleProgress > 3 || StruggleLockPickProgressCurrentTries > 0)) {
		// Punish the player if they Struggle with any item
		return "StruggleOther";
	} else if (PunishStruggle && StruggleProgressPrevItem != null && StruggleProgressStruggleCount > 0 && (StruggleProgress > 3 || StruggleLockPickProgressCurrentTries > 0)) {
		if (tamperZones.some(zone => C.FocusGroup?.Name === zone))
			return "Struggle";
	} else if (PunishStandup && C.CanKneel(PoseChangeStatus.NEVER_WITHOUT_AID) && C.IsStanding() && ServerPlayerIsInChatRoom() && shockCooldown < CommonTime()) {
		// Punish the player if they stand up
		return "StandUp";
	}
	return null;
}

/**
 * Namespace for constructing {@link Item} objects.
 */
var AppearanceItem = {
	/**
	 * Construct an item from the passed asset
	 * @param {Asset} asset The asset in question
	 * @param {null | Item.Options} options Further options
	 * @returns {Item} The new item
	 */
	fromAsset: function fromAsset(asset, options=null) {
		options ??= {};
		return {
			Asset: asset,
			Color: ServerParseColor(asset, options.color, asset.Group.ColorSchema),
			Difficulty: options.difficulty ?? 0,
			Property: options.property ? CommonCloneDeep(options.property) : {},
			Craft: options.craft ? CommonCloneDeep(options.craft) : undefined,
		};
	},

	/**
	 * Construct an item from the passed group- and asset names
	 * @param {AssetGroupName} groupName The asset's group name
	 * @param {AssetName} assetName The asset's name
	 * @param {null | Item.Options} options Further options
	 * @returns {null | Item} The new item or `null` if no matching asset can be found
	 */
	fromName: function fromName(groupName, assetName, options=null) {
		const asset = AssetGet("Female3DCG", groupName, assetName);
		if (!asset) {
			return null;
		} else {
			return AppearanceItem.fromAsset(asset, options);
		}
	},
};

/**
 * Dummy character for {@link ItemPropertiesDecompress} validation
 * @type {null | Character}
 */
let ItemPropertiesDummy = null;

/**
 * Copy and extract all {@link ItemBundle.Property} keys from the passed item, returning them in addition to all extended item options associated with the item's current state
 * @param {Item} item The item whose properties are to be extracted
 * @param {object} [options]
 * @param {Iterable<keyof ItemProperties>} [options.omit] Properties that should always be omitted
 * @param {boolean} [options.allowLocks] Whether to return lock-specific options and properties if present
 * @returns {{ properties: Set<keyof ItemProperties>, extendedOptions: ExtendedItemOptionUnion[] }} The filtered item property names and the matching extended item options
 */
function ItemPropertiesGetBundleProperties(item, options=undefined) {
	item.Property ??= {};
	options ??= {};

	// Initialize it with the known set of (legal) fully user-customizable properties
	const allowedProperties = new Set(ExtendedItemInitPropertyIgnore);

	/** @type {EffectName[]} */
	const allowedEffects = ["IsLeashed"];
	for (const effect of allowedEffects) {
		if (item.Asset.AllowEffect?.includes(effect)) {
			allowedProperties.add("Effect");
			break;
		}
	}

	// FIXME: Temporary backwards compatiblity.
	// Either port these properties over to BC or switch them out for a pre-existing BC equivalent.
	// @ts-expect-error
	allowedProperties.add("LayerOverrides"); // LSCG as of v0.8.17
	// @ts-expect-error
	allowedProperties.add("wceOverrideHide"); // WCE as of v6.3.19

	const extendedOptions = item.Asset.Extended ? ExtendedItemGatherOptions(item) : [];
	for (const option of extendedOptions) {
		switch (option.OptionType) {
			case "VariableHeightOption":
				allowedProperties.add("OverrideHeight");
				break;
			case "TypedItemOption":
			case "ModularItemOption":
			case "VibratingItemOption":
				allowedProperties.add("TypeRecord");
				break;
		}
		for (const key of CommonKeys(option.ParentData.baselineProperty ?? {})) {
			allowedProperties.add(key);
		}
	}

	const allowLocks = options.allowLocks ?? true;
	lockedBy: if (allowLocks && item.Property.LockedBy) {
		const lockData = NoArchItemDataLookup[`ItemMisc${item.Property.LockedBy}`];
		if (!lockData) {
			break lockedBy;
		}
		extendedOptions.push({ Name: "NewOption", OptionType: "NoArchItemOption", ParentData: lockData, Property: {} });
		for (const key of CommonKeys(lockData.baselineProperty ?? {})) {
			allowedProperties.add(key);
		}
	}

	for (const prop of options?.omit ?? []) {
		allowedProperties.delete(prop);
	}

	return { properties: allowedProperties, extendedOptions: extendedOptions };
}

/**
 * Compress the passed item's properties in preparation for {@link ItemBundle} creation.
 * @param {Item} item The item whose properties are to be minimized
 * @param {object} [options]
 * @param {Iterable<keyof ItemProperties>} [options.omit] Properties that should always be omitted
 * @param {boolean} [options.allowLocks] Whether to return lock-specific options and properties if present
 * @returns {ItemPropertiesMinimized | undefined} The minimized item properties
 */
function ItemPropertiesCompress(item, options=undefined) {
	if (!item.Property) {
		return undefined;
	}

	const { properties: allowedProperties, extendedOptions } = ItemPropertiesGetBundleProperties(item, options);

	/** @type {ItemProperties} */
	const baseline = {};
	for (const option of extendedOptions) {
		CommonAssign(baseline, option.Property, option.ParentData.baselineProperty);
	}
	delete baseline.LockedBy;

	// Basic property validation is conducted later on via CraftingValidate
	/** @type {ItemPropertiesMinimized} */
	const ret = {};
	for (const propName of allowedProperties) {
		if (item.Property[propName] === undefined) {
			continue;
		}
		const propValue = CommonCloneDeep(item.Property[propName]);
		const baselineValue = baseline[propName];

		/** @type {undefined | PropertyDataEntry<any>} */
		const entry = PropertyData[propName];
		if (!entry) {
			/** @type {Unknown<ItemPropertiesMinimized>} */(ret)[propName] = propValue === baselineValue ? undefined : propValue;
		} else {
			CommonAssign(ret, entry.compress(propValue, { asset: item.Asset }, baselineValue));
		}
	}
	return Object.values(ret).every(i => i === undefined) ? undefined : ret;
}

// TODO: Use this for the merging of modular item properties
/**
 * Merge the passed item properties into a single property set.
 *
 * By default, properties follow a "first non-nullish entry wins" approach if no property-specific merge function is available.
 * @param {readonly ItemProperties[]} propertyList The list of to-be merged property objects
 * @param {Asset} asset The asset
 * @param {ItemProperties} [output] The object in which the merged properties will be stored and returned
 * @returns {ItemProperties}
 */
function ItemPropertiesUnion(propertyList, asset, output=undefined) {
	/** @type {ItemProperties} */
	const ret = output ?? {};
	for (const properties of propertyList) {
		if (properties === output) {
			// Don't bother going through the output twice if it happens to be included in `propertyList` as well
			continue;
		}
		for (const [propName, propValue] of CommonEntries(properties)) {
			/** @type {undefined | PropertyDataEntry<any>} */
			const entry = PropertyData[propName];
			const value = entry?.union([ret[propName], propValue], { asset }) ?? propValue;
			if (value !== undefined) {
				/** @type {Unknown<ItemProperties>} */(ret)[propName] = value;
			}
		}
	}
	return ret;
}

/**
 * Subtract the passed item properties from each other into a single property set.
 * @param {readonly ItemProperties[]} propertyList The list of to-be differenced property objects
 * @param {Asset} asset The asset
 * @param {ItemProperties} [output] The object in which the differenced properties will be stored and returned
 * @returns {ItemProperties}
 */
function ItemPropertiesDifference(propertyList, asset, output=undefined) {
	/** @type {ItemProperties} */
	const ret = output ?? {};
	for (const [propName, propValue] of CommonEntries(ret)) {
		if (propValue === undefined) {
			continue;
		}

		/** @type {undefined | PropertyDataEntry<any>} */
		const entry = PropertyData[propName];
		const propList = [propValue, ...propertyList.map(properties => properties[propName])];
		if (entry) {
			/** @type {Unknown<ItemProperties>} */(ret)[propName] = entry.difference(propList, { asset });
		} else if (propList.filter(i => i != null).length >= 2) {
			delete ret[propName];
		}
	}
	return ret;
}

/**
 * @param {ItemProperties} properties
 * @param {Asset} asset The asset
 * @param {object} [options]
 * @param {Character} [options.C] The character wearing/intended to wear the item
 * @returns {ItemProperty.ValidationMultiOutput}
 */
function ItemPropertiesValidate(properties, asset, options=undefined) {
	/** @satisfies {Record<ItemProperty.ValidationStatus, number>} */
	const statusMapping = /** @type {const} */({
		ok: 0,
		error: 1,
		criticalError: 2,
	});

	const { extendedOptions } = ItemPropertiesGetBundleProperties(AppearanceItem.fromAsset(asset, { property: properties }));
	/** @type {ItemProperties} */
	const defaults = {};
	for (const option of extendedOptions) {
		CommonAssign(defaults, option.Property, option.ParentData.baselineProperty);
	}

	/** @type {Omit<ItemProperty.ValidationMultiOutput, "status"> & { status: 0 | 1 | 2 }} */
	const ret = {
		value: {},
		status: statusMapping.ok,
		errorDescriptions: {},
	};
	for (const [propName, propValue] of CommonEntries(properties)) {
		/** @type {undefined | PropertyDataEntry<any>} */
		const entry = PropertyData[propName];
		if (!entry) {
			ret.status = statusMapping.criticalError;
			ret.errorDescriptions[propName] = `Missing "${propName}" validator function`;
			continue;
		}

		const output = entry.validate(propValue, { asset, C: options?.C }, defaults[propName]);
		switch (output.status) {
			case "ok":
				/** @type {Unknown<ItemProperties>} */(ret.value)[propName] = output.value;
				break;
			case "error":
				ret.status = CommonMax(ret.status, statusMapping[output.status]);
				/** @type {Unknown<ItemProperties>} */(ret.value)[propName] = output.value;
				ret.errorDescriptions[propName] = output.errorDescription;
				break;
			case "criticalError":
				ret.status = statusMapping.criticalError;
				ret.errorDescriptions[propName] = output.errorDescription;
				break;
		}
	}
	return { ...ret, status: CommonObjectFlip(statusMapping)[ret.status] };
}

/**
 * Check whether all properties between the passed objects are equivalent
 * @param {ItemProperties} properties1 The first property set
 * @param {ItemProperties} properties2 The second property set
 * @param {Asset} asset The asset
 * @param {object} [options]
 * @param {boolean} [options.gatherNonEquivalancies] Whether to gather and return the names of all non-equivalent properties.
 * The returned set will always be empty otherwise. Defaults to `false`.
 * @param {boolean} [options.eqOrSubset] Whether to check whether the properties are either equivalent or form a (deep)
 * subset of each other (see {@link ItemPropertiesIsSubset}). Defaults to `false`.
 * @returns {{ result: boolean, nonEquivalencies: Set<keyof ItemProperties> }}
 */
function ItemPropertiesCompare(properties1, properties2, asset, options=undefined) {
	options ??= {};

	/** @type {{ result: boolean, nonEquivalencies: Set<keyof ItemProperties> }} */
	const ret = { result: true, nonEquivalencies: new Set() };
	const propNames = new Set([
		...(CommonFilterMap(CommonEntries(properties1), (([k, v]) => v !== undefined ? k : undefined))),
		...(CommonFilterMap(CommonEntries(properties2), (([k, v]) => v !== undefined ? k : undefined))),
	]);
	const comparisonFunc = options.eqOrSubset ? "isSubset" : "compare";
	propLoop: for (const propName of propNames) {
		const propValue1 = properties1[propName];
		const propValue2 = properties2[propName];
		/** @type {undefined | PropertyDataEntry<any>} */
		const entry = PropertyData[propName];
		const isEquiv = entry?.[comparisonFunc](propValue1, propValue2, { asset }) ?? propValue1 === propValue2;
		if (!isEquiv) {
			ret.result = false;
			if (options.gatherNonEquivalancies) {
				ret.nonEquivalencies.add(propName);
			} else {
				break propLoop;
			}
		}
	}
	return ret;
}

/**
 * Check whether all properties between the passed objects are either equivalent or form a subset of each other (_i.e._ a non-proper subset)
 * @param {ItemProperties} subProperties The (potential) property subset
 * @param {ItemProperties} superProperties The (potential) property superset
 * @param {Asset} asset The asset
 * @param {object} [options]
 * @param {boolean} [options.gatherNonEquivalancies] Whether to gather and return the names of all non-equivalent properties.
 * The returned set will always be empty otherwise. Defaults to `false`.
 * @returns {{ result: boolean, nonEquivalencies: Set<keyof ItemProperties> }}
 */
function ItemPropertiesIsSubset(subProperties, superProperties, asset, options=undefined) {
	options ??= {};
	return ItemPropertiesCompare(subProperties, superProperties, asset, { ...options, eqOrSubset: true });
}

/**
 * Copy and decompress the passed item budle properties in preparation for {@link Item} creation.
 * @param {Item} item The final item in which the properties will end up
 * @param {undefined | Readonly<ItemPropertiesMinimized>} properties The minimized item properties
 * @param {object} [options]
 * @param {boolean} [options.initExtendedItem] Whether to re-initialize any extended item options (including locks)
 * @returns {ItemProperties} The maximized item properties
 */
function ItemPropertiesDecompress(item, properties, options=undefined) {
	properties ??= {};
	if (!CommonIsObject(properties)) {
		console.error(`Invalid property data for item: "${item.Asset.Group.Name}/${item.Asset.Name}"`, properties);
		return item.Property;
	}

	const propertyList = CommonEntries(properties).map(([propName, propValue]) => {
		/** @type {undefined | PropertyDataEntry<any>} */
		const entry = PropertyData[propName];
		if (entry) {
			return entry.decompress(propValue, { asset: item.Asset });
		} else if (propValue !== undefined) {
			return { [propName]: propValue };
		} else {
			return {};
		}
	});
	item.Property = ItemPropertiesUnion(propertyList, item.Asset, item.Property);

	if (item.Craft?.Effects?.Painful) {
		CommonArrayConcatDedupe(item.Property.Fetish ??= [], ["Masochism"]);
	}

	const C = ItemPropertiesDummy ??= CharacterLoadSimple("ItemBundleDummy");
	if (options?.initExtendedItem ?? true) {
		if (item.Asset.Extended) {
			// Init will respect the `TypeRecord` values assigned further up above via `ItemPropertiesMerge()`
			ExtendedItemInit(C, item, false, false);
		} else if (properties.LockedBy) {
			// Code branch already taken care of by `ExtendedItemInit` for extended items
			/** @type {Parameters<ExtendedItemCallbacks.Init>} */
			const args = [C, item, false, false];
			CommonCallFunctionByNameWarn(`InventoryItemMisc${properties.LockedBy}Init`, ...args);
		}
	}
	return item.Property;
}
