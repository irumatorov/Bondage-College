import vm from "vm";
import fs from "fs";
import path from "path";

import { NEEDED_FILES, BASE_PATH, error, loadCSV, fromEntries, enumerate, keys, entries, errorState } from "./Common.js";

// XXX: this must all be checked
const knownMissingOverrides = new Set([
	"ItemArms:ArmbinderSuit:HBelts",
	"ItemArms:Chains:null",
	"ItemArms:DuctTape:null",
	"ItemArms:HempRope:null",
	"ItemHood:Balloon:Head",
	"ItemHood:Balloon:Shine",
	"Panties:WaistLegHarness:BeltsA",
	"Panties:WaistLegHarness:BeltsA2",
	"Panties:WaistLegHarness:BeltsB",
	"Panties:WaistLegHarness:BeltsC",
	"Panties:WaistLegHarness:MetalA",
	"Panties:WaistLegHarness:MetalB",
	"Panties:WaistLegHarness:MetalC",
]);

/**
 * Checks for {@link AssetDefinition.DynamicGroupName}
 * @param {readonly AssetGroupDefinition[]} groupDefinitions
 */
function testDynamicGroupName(groupDefinitions) {
	/** @type {[AssetGroupDefinition, AssetDefinition][]} */
	const assetsList = [];
	for (const groupDef of groupDefinitions) {
		for (const asset of groupDef.Asset) {
			if (typeof asset !== "string") {
				assetsList.push([groupDef, asset]);
			}
		}
	}

	// If `DynamicGroupName` is set, check whether the dynamically referenced item actually exists
	for (const [groupDef, assetDef] of assetsList) {
		const DynamicGroupName = (assetDef.DynamicGroupName !== undefined) ? assetDef.DynamicGroupName : groupDef.DynamicGroupName;
		if (
			DynamicGroupName !== undefined
			&& DynamicGroupName !== groupDef.Group
			&& !assetsList.some(([g, a]) => a.Name === assetDef.Name && g.Group === DynamicGroupName)
		) {
			error(`${groupDef.Group}:${assetDef.Name}: Missing DynamicGroupName-referenced item: ${DynamicGroupName}:${assetDef.Name}`);
		}
	}
}

/**
 * Flatten and yield all combined Asset/Group configs and names
 * @param {ExtendedItemMainConfig} extendedItemConfig
 */
function* flattenExtendedConfig(extendedItemConfig) {
	for (const [groupName, groupConfig] of Object.entries(extendedItemConfig)) {
		for (const [assetName, assetConfig] of Object.entries(groupConfig)) {
			yield { groupName, assetName, groupConfig, assetConfig };
		}
	}
}

/**
 * Checks for the option names of typed items
 * @param {Record<ExtendedArchetype, Record<string, AssetArchetypeData>>} dataSuperRecord The extended item data
 * @param {string[][]} dialogArray The dialog array as created from `AssetStrings.csv`
 */
function testExtendedItemDialog(dataSuperRecord, dialogArray) {
	const dialogSet = new Set(dialogArray.map(i => i[0]));
	let first = true;
	for (const dataRecord of Object.values(dataSuperRecord)) {
		for (const data of Object.values(dataRecord)) {
			const groupName = data.asset.Group.Name;
			const assetName = data.asset.Name;

			/** @type {Set<string>} */
			let missingDialog;
			switch (data.archetype) {
				case "vibrating":
				case "typed":
				case "variableheight":
				case "text":
				case "noarch":
					missingDialog = testTypedItemDialog(groupName, assetName, data, dialogSet);
					break;
				case "modular":
					missingDialog = testModularItemDialog(groupName, assetName, data, dialogSet);
					break;
				default:
					throw new Error(`Unknown archetype "${/** @type {{ archetype: string }} */(data).archetype}"`);
			}

			if (missingDialog.size !== 0) {
				if (first) {
					first = false;
					console.error('\nERROR: Missing dialog key(s) in "BondageClub/Assets/AssetStrings.csv":');
				}

				const missingString = Array.from(missingDialog).sort();
				error(`${groupName}:${assetName}: found ${missingDialog.size} missing dialog keys: ${missingString}`);
			}
		}
	}
}

/**
 * Construct all prefix/suffix combinations and add them to `diffSet` if they are not part of `referenceSet`.
 * Performs an inplace update of `diffSet`.
 * @param {readonly (undefined | string)[]} prefixIter
 * @param {readonly (undefined | string)[]} suffixIter
 * @param {ReadonlySet<string>} referenceSet
 * @param {Set<string>} diffSet
 */
function gatherDifference(prefixIter, suffixIter, referenceSet, diffSet) {
	for (const prefix of prefixIter) {
		if (prefix === undefined) {
			continue;
		}
		for (const suffix of suffixIter) {
			if (suffix === undefined) {
				continue;
			}
			const key =`${prefix}${suffix}`;
			if (!referenceSet.has(key)) {
				diffSet.add(key);
			}
		}
	}
}

/**
 * Version of {@link gatherDifference} designed for handling the `fromTo` typed item chat setting.
 * @param {readonly (undefined | string)[]} prefixIter
 * @param {readonly (undefined | string)[]} suffixIter
 * @param {ReadonlySet<string>} referenceSet
 * @param {Set<string>} diffSet
 */
function gatherDifferenceFromTo(prefixIter, suffixIter, referenceSet, diffSet) {
	for (const prefix of prefixIter) {
		if (prefix === undefined) {
			continue;
		}
		for (const suffix1 of suffixIter) {
			for (const suffix2 of suffixIter) {
				if (suffix1 === suffix2 || suffix1 === undefined || suffix2 === undefined) {
					continue;
				}
				const key =`${prefix}${suffix1}To${suffix2}`;
				if (!referenceSet.has(key)) {
					diffSet.add(key);
				}
			}
		}
	}
}

/**
 * Return a set of all expected typed item dialog keys that are absent for a given iten.
 * Helper function for {@link testExtendedItemDialog}.
 * @param {AssetGroupName} groupName
 * @param {string} assetName
 * @param {TypedItemData | VibratingItemData | VariableHeightData | TextItemData | NoArchItemData} data
 * @param {ReadonlySet<string>} dialogSet The set of all `AssetStrings.csv` dialog keys
 * @returns {Set<string>} The missing dialog keys
 */
function testTypedItemDialog(groupName, assetName, data, dialogSet) {
	/** @type {Partial<(typeof data)["dialogPrefix"]>} */
	const dialogConfig = { ...data.dialogPrefix };

	if (
		typeof dialogConfig.chat === "function"  // Can't validate callables via the CI
		|| data.chatSetting === "silent"  // No dialog when silent
		|| !groupName.includes("Item")  // Type changes of clothing based items never have a chat message
	) {
		dialogConfig.chat = undefined;
	}
	if (typeof dialogConfig.header === "function") {
		dialogConfig.header = undefined;
	}

	/** @type {Set<string>} */
	const missingDialog = new Set();

	/** @type {(undefined | string)[]} */
	let optionSuffices = [];
	/** @type {(undefined | string)[]} */
	let chatSuffices = [];
	switch (data.archetype) {
		case "typed":
			optionSuffices = chatSuffices = data.options.map(o => !o.HasSubscreen ? o.Name : undefined);
			break;
		case "vibrating": {
			const direction = ["Increase", "Decrease"];
			/** @type {VibratorIntensity[]} */
			const intensity = [-1, 0, 1, 2, 3];
			chatSuffices = direction.flatMap(dir => intensity.map(i => `${dir}To${i}`));
			chatSuffices.push(...data.options.filter(o => o.Advanced).map(o => o.Name));
			optionSuffices = data.options.map(o => !o.HasSubscreen ? o.Name : undefined);
		}
	}
	if ("option" in dialogConfig) {
		gatherDifference([dialogConfig.option], optionSuffices, dialogSet, missingDialog);
	}
	gatherDifference([dialogConfig.header], [""], dialogSet, missingDialog);
	switch (data.chatSetting) {
		case "default":
			gatherDifference([dialogConfig.chat], chatSuffices, dialogSet, missingDialog);
			break;
		case "fromTo":
			gatherDifferenceFromTo([dialogConfig.chat], chatSuffices, dialogSet, missingDialog);
			break;
	}
	return missingDialog;
}

/**
 * Return a set of all expected modular item dialog keys that are absent for a given iten.
 * Helper function for {@link testExtendedItemDialog}.
 * @param {AssetGroupName} groupName
 * @param {string} assetName
 * @param {ModularItemData} data
 * @param {ReadonlySet<string>} dialogSet The set of all `AssetStrings.csv` dialog keys
 * @returns {Set<string>} The missing dialog keys
 */
function testModularItemDialog(groupName, assetName, data, dialogSet) {
	/** @type {Partial<ModularItemData["dialogPrefix"]>} */
	const dialogConfig = { ...data.dialogPrefix };

	if (typeof dialogConfig.chat === "function" || !groupName.includes("Item")) {
		dialogConfig.chat = undefined;
	}
	if (typeof dialogConfig.header === "function") {
		dialogConfig.header = undefined;
	}

	const modulesNames = data.modules.map(m => m.Name);
	/** @type {(string | undefined)[]} */
	const optionNames = [];
	for (const module of data.modules) {
		// Options with a subscreen or their own label (see `ElementMetaData.label`) have no dialog key
		optionNames.push(...module.Options.map((o, i) => !o.HasSubscreen && !module.drawData.elementData[i]?.label ? o.Name : undefined));
	}

	/** @type {Set<string>} */
	const missingDialog = new Set();
	gatherDifference([dialogConfig.header, dialogConfig.module], modulesNames, dialogSet, missingDialog);
	gatherDifference([dialogConfig.option], optionNames, dialogSet, missingDialog);
	switch (data.chatSetting) {
		case "default":
			gatherDifference([dialogConfig.chat], optionNames, dialogSet, missingDialog);
			break;
		case "perModule": {
			// Ignore a module if every single one of its options links to a subscreen
			const modulesNamesNoSubscreen = data.modules.map(m => m.Options.every(o => o.HasSubscreen) ? undefined : m.Name) ?? [];
			gatherDifference([dialogConfig.chat], modulesNamesNoSubscreen, dialogSet, missingDialog);
			break;
		}
	}
	return missingDialog;
}

/**
 * Check that all expected color-group entries are present in the .csv file
 * @param {TestingStruct<string>[]} missingGroups A list of all missing color groups
 */
function testColorGroups(missingGroups) {
	if (!Array.isArray(missingGroups)) {
		error("MISSING_COLOR_GROUPS not found");
		return;
	} else if (!missingGroups.length) {
		return;
	} else {
		console.error('\nERROR: Missing color group(s) in "BondageClub/Assets/ColorGroups.csv":');
	}

	for (const { Group, Name, Invalid } of missingGroups) {
		error(`${Group}:${Name}: Missing color group "${Invalid}"`);
	}
}

/**
 * Check that all expected color-layer entries are present in the .csv file
 * @param {TestingStruct<string>[]} missingLayers A list of all missing color layers
 */
function testColorLayers(missingLayers) {
	if (!Array.isArray(missingLayers)) {
		error("MISSING_COLOR_LAYERS not found");
		return;
	} else if (!missingLayers.length) {
		return;
	} else {
		console.error('\nERROR: Missing color layer(s) in "BondageClub/Assets/LayerNames.csv":');
	}

	for (const { Group, Name, Invalid } of missingLayers) {
		error(`${Group}:${Name}: Missing color layer "${Invalid}"`);
	}
}

/**
 * Test whether all asset default colors are valid.
 * @param {TestingStruct<string[]>[]} invalidDefaults A list of all missing color layers
 */
function testDefaultColor(invalidDefaults) {
	if (!Array.isArray(invalidDefaults)) {
		error("TestingInvalidDefaultColor not found");
		return;
	}
	for (const { Group, Name, Invalid } of invalidDefaults) {
		error(`${Group}:${Name}: ${Invalid.length} invalid color defaults "${Invalid}"`);
	}
}

/**
 * Gather all duplicate module/option names from the passed module/option list
 * @param {readonly { Name: string }[]} options
 * @returns {string[]}
 */
function gatherDuplicateOptionNames(options) {
	/** @type {Record<string, number>} */
	const nameCount = {};
	for (const option of options) {
		if (option.Name in nameCount) {
			nameCount[option.Name] += 1;
		} else {
			nameCount[option.Name] = 1;
		}
	}

	/** @type {string[]} */
	const duplicates = [];
	for (const [name, count] of Object.entries(nameCount)) {
		if (count > 1) {
			duplicates.push(name);
		}
	}
	return duplicates;
}

/**
 * Check whether all extended item options and modules are (at least) of length 1.
 * @param {ExtendedItemMainConfig} config
 */
function testModuleOptionLength(config) {
	for (const { groupName, assetName, assetConfig } of flattenExtendedConfig(config)) {
		switch (assetConfig?.Archetype) {
			case "typed": {
				testModuleOptionLengthTyped(groupName, assetName, assetConfig);
				break;
			}
			case "modular": {
				testModuleOptionLengthModular(groupName, assetName, assetConfig);
				break;
			}
		}
	}
}

/**
 * @param {string} groupName
 * @param {string} assetName
 * @param {TypedItemConfig} config
 */
function testModuleOptionLengthTyped(groupName, assetName, config) {
	if (config.CopyConfig && !config?.Options) {
		return;
	}

	const options = config.Options ?? [];
	if (options.length === 0) {
		error(`${groupName}:${assetName}: typed item require at least one option`);
	}

	const duplicateNames = gatherDuplicateOptionNames(options);
	if (duplicateNames.length) {
		error(`${groupName}:${assetName}: found ${duplicateNames.length} typed item options with a duplicate Name: ${duplicateNames}`);
	}
}

/**
 * @param {string} groupName
 * @param {string} assetName
 * @param {ModularItemConfig} config
 */
function testModuleOptionLengthModular(groupName, assetName, config) {
	if (config.CopyConfig && !config?.Modules) {
		return;
	}

	const modules = config.Modules ?? [];
	if (modules.length === 0) {
		error(`${groupName}:${assetName}: modular item requires at least one option`);
	}

	for (const mod of modules) {
		if (mod.Options.length === 0) {
			error(`${groupName}:${assetName}: modular item module "${mod}" requires at least one option`);
		}
	}

	const duplicateNames = gatherDuplicateOptionNames(modules);
	if (duplicateNames.length) {
		error(`${groupName}:${assetName}: found ${duplicateNames.length} modular item modules with a duplicate Name: ${duplicateNames}`);
	}
}

/**
 * Return the intersection between the passed sets
 * @param {Set<string>[]} args
 * @returns {string[]}
 */
function getIntersection(...args) {
	if (args.length === 0) {
		return [];
	}

	const intersection = new Set();
	const elementsVisited = new Set(args[0]);
	for (const set of args.slice(1)) {
		for (const i of set) {
			if (elementsVisited.has(i)) {
				intersection.add(i);
			} else {
				elementsVisited.add(i);
			}
		}
	}
	return Array.from(intersection).sort();
}

/**
 * @param {Record<string, ModularItemData>} dataRecord
 */
function testModularItemPropertyDisjoint(dataRecord) {
	if (dataRecord === null || typeof dataRecord !== "object") {
		error("ModularItemDataLookup not found");
		return;
	}

	// Non-array item properties with special casing for dealing with inter-module intersections
	const propertyWhitelist = new Set(["Difficulty", "OverrideHeight", "TypeRecord", "OverridePriority", "CustomBlindBackground", "Intensity"]);
	const assetWhitelist = new Set();

	for (const data of Object.values(dataRecord)) {
		if (assetWhitelist.has(`${data.asset.Group.Name}:${data.asset.Name}`)) {
			continue;
		}

		/** @type {Record<string, Set<string>>} */
		const properties = {};
		for (const mod of data.modules) {
			properties[mod.Key] = new Set();
			for (const option of mod.Options) {
				for (const [k, v] of Object.entries(option.Property || {})) {
					if (!Array.isArray(v) && !propertyWhitelist.has(k)) {
						properties[mod.Key].add(k);
					}
				}
			}
		}
		const intersection = getIntersection(...Object.values(properties));
		if (intersection.length > 0) {
			error(
				`${data.asset.Group.Name}:${data.asset.Name}: found ${intersection.length} intersecting `
				+ `cross-module item properties: ${intersection}`
			);
		}
	}
}

/**
 * @param {string} dir
 * @param {Set<string>} pathSet
 * @param {(file: string) => boolean} filter
 */
function recursivelyListDir(dir, pathSet, filter) {
	fs.readdirSync(dir).forEach(f => {
		let dirPath = `${dir}/${f}`;
		const isDirectory = fs.statSync(dirPath).isDirectory();
		if (isDirectory) {
			recursivelyListDir(dirPath, pathSet, filter);
		} else if (filter(f)) {
			const offset = BASE_PATH.length;
			pathSet.add(`${dir.slice(offset)}/${f}`);
		}
	});
}

/**
 *
 * @param {string} filePath
 * @returns {boolean}
 */
function fileExists(filePath) {
	return !!fs.statSync(filePath, { throwIfNoEntry: false });
}

/**
 *
 * @param  {Record<ExtendedArchetype, Record<string, AssetArchetypeData>>} dataSuperRecord
 */
function testExtendedItemButtonImage(dataSuperRecord) {
	// Load all the default available images
	/** @type {Set<string>} */
	const availableImages = new Set();
	recursivelyListDir(`${BASE_PATH}Screens/Inventory`, availableImages, i => i.endsWith(".png"));

	// Gather all expected image paths
	/** @type {Set<string>} */
	const requiredImages = new Set();

	/**
	 * @param {ExtendedItemDrawData<ElementMetaData>} drawData
	 */
	const parseDrawData = (drawData) => {
		for (const buttonData of drawData.elementData) {
			if (buttonData.drawImage === false) continue;
			if (buttonData.hidden === true) continue;
			if (buttonData.imagePath != null) {
				requiredImages.add(buttonData.imagePath);
				if (fileExists(path.join(BASE_PATH, buttonData.imagePath))) {
					availableImages.add(buttonData.imagePath);
				}
			}
		}
	};

	for (const [archetype, dataRecord] of Object.entries(dataSuperRecord)) {
		if (dataRecord === null || typeof dataRecord !== "object") {
			error(`${archetype} data lookup not found`);
			continue;
		}

		for (const data of Object.values(dataRecord)) {
			if (data.archetype === "modular") {
				// Check the modules' drawdata as well
				for (const mod of data.modules) {
					parseDrawData(mod.drawData);
				}
			}
			parseDrawData(data.drawData);
		}
	}

	// Identify all missing and extra images
	for (const imagePath of requiredImages) {
		if (!availableImages.has(imagePath)) {
			error(`Missing extended item button image ${imagePath}`);
		}
	}
	for (const imagePath of availableImages) {
		if (!requiredImages.has(imagePath)) {
			// FIXME: just because I want AssetCheck to shut up.
			// This asset has both a clothing and restraint, but they have mismatching types
			// Yet, they use DynamicGroupName, which causes one to look up the files of the other
			// and the simpler one warns because it doesn't expect so many options.
			if (imagePath.includes("ItemHead/RubberMask")) continue;
			error(`Unexpected extra extended item button image ${imagePath}`);
		}
	}
}

/**
 * @param {readonly Asset[]} assets
 */
function testAssetLayerNames(assets) {
	if (assets === null || !Array.isArray(assets)) {
		error("Asset not found");
		return;
	}

	for (const asset of assets) {
		/** @type {Record<string, number>} */
		const layerCount = {};
		for (const layer of asset.Layer) {
			layerCount[layer.Name ?? ""] = 1 + (layerCount[layer.Name ?? ""] || 0);
		}

		const duplicateLayers = Object.entries(layerCount).filter(([_, j]) => j > 1).map(([i, _]) => i);
		if (duplicateLayers.length > 0) {
			error(
				`${asset.Group.Name}:${asset.Name}: found ${duplicateLayers.length} layers `
				+ `with duplicate names: ${duplicateLayers}`
			);
		}
	}
}

/**
 * Test whether a subset of asset and extended item properties are disjoint.
 * The subset concerns those properties that BC always checks at both the asset and item level.
 * @param {Record<ExtendedArchetype, Record<string, AssetArchetypeData>>} dataSuperRecord
 */
function testAssetAndExtendedPropertyIsDisjoint(dataSuperRecord) {
	/**
	 * All array-like properties that BC checks at both the asset and item level.
	 * @satisfies {readonly (keyof ItemProperties)[]}
	 */
	const propNames = /** @type {const} */([
		"Effect",
		"Hide",
		"HideItem",
		"HideItemExclude",
		"Block",
		"AllowActivityOn",
		"Fetish",
	]);

	// Gather all expected image paths
	for (const [archetype, dataRecord] of Object.entries(dataSuperRecord)) {
		if (dataRecord === null || typeof dataRecord !== "object") {
			error(`${archetype} data lookup not found`);
			continue;
		}

		for (const data of Object.values(dataRecord)) {
			/** @type {ExtendedItemOption[]} */
			const options = [];
			if (data.archetype === "modular") {
				// Check the modules' drawdata as well
				for (const mod of data.modules) {
					options.push(...mod.Options);
				}
			} else {
				if ("options" in data && Array.isArray(data.options)) {
					options.push(...data.options);
				}
			}

			const asset = data.asset;
			for (const propName of propNames) {
				if (propName === "Effect") {
					testAssetAndExtendedEffectIsDisjoint(options, asset);
				}

				/** @type {Set<string>} */
				const propSet = new Set();
				for (const option of options) {
					/** @type {string[]} */
					const propArray = (option.Property && option.Property[propName]) || [];
					for (const i of propArray) {
						propSet.add(i);
					}
				}

				/** @type {string[]} */
				const intersection = (asset[propName] || []).filter(i => propSet.has(i)).sort();
				if (intersection.length > 0) {
					error(
						`${asset.Group.Name}:${asset.Name}: found ${intersection.length} intersection(s) `
						+ `between asset and extended item option "${propName}" properties: ${intersection}`
					);
				}
			}
		}
	}
}

/** @type {Set<GagEffectName>} */
const GAG_EFFECTS = new Set([
	"GagVeryLight",
	"GagEasy",
	"GagLight",
	"GagNormal",
	"GagMedium",
	"GagHeavy",
	"GagVeryHeavy",
	"GagTotal",
	"GagTotal2",
	"GagTotal3",
	"GagTotal4",
]);

/** @type {Set<BlindEffectName>} */
const BLIND_EFFECTS = new Set([
	"BlindLight",
	"BlindNormal",
	"BlindHeavy",
	"BlindTotal",
]);


/** @type {Set<BlurEffectName>} */
const BLUR_EFFECTS = new Set([
	"BlurLight",
	"BlurNormal",
	"BlurHeavy",
	"BlurTotal",
]);


/** @type {Set<DeafEffectName>} */
const DEAF_EFFECTS = new Set([
	"DeafLight",
	"DeafNormal",
	"DeafHeavy",
	"DeafTotal",
]);

/**
 * A {@link Set.has} variant for string-based sets that returns a typeguard.
 * @template {string} T
 * @param {Set<T>} set
 * @param {string} value
 * @returns {value is T}
 */
function setHas(set, value) {
	return set.has(/** @type {T} */(value));
}

/**
 * A helper for {@link testAssetAndExtendedPropertyIsDisjoint} that performs a stricter check for `Effect` disjointment.
 * More specifically, this checks whether only a single effect (at most) of each of the following effect categories is present:
 *
 * - Gag level
 * - Blindness level
 * - Deafness level
 * - Blur level
 * @param {readonly ExtendedItemOption[]} options
 * @param {Asset} asset
 */
function testAssetAndExtendedEffectIsDisjoint(options, asset) {
	/** @type {Set<string>} */
	const propSet = new Set();
	for (const option of options) {
		const propArray = (option.Property && option.Property.Effect) || [];
		for (const i of propArray) {
			if (setHas(GAG_EFFECTS, i)) {
				propSet.add("Gag level");
			}
			if (setHas(BLIND_EFFECTS, i)) {
				propSet.add("Blind level");
			}
			if (setHas(BLUR_EFFECTS, i)) {
				propSet.add("Blur level");
			}
			if (setHas(DEAF_EFFECTS, i)) {
				propSet.add("Deaf level");
			}
		}
	}

	/** @type {string[]} */
	const intersection = [];
	for (const i of asset.Effect) {
		if (setHas(GAG_EFFECTS, i) && propSet.has("Gag level")) {
			intersection.push("Gag level");
		}
		if (setHas(DEAF_EFFECTS, i) && propSet.has("Blind level")) {
			intersection.push("Blind level");
		}
		if (setHas(BLUR_EFFECTS, i) && propSet.has("Blur level")) {
			intersection.push("Blur level");
		}
		if (setHas(DEAF_EFFECTS, i) && propSet.has("Deaf level")) {
			intersection.push("Deaf level");
		}
	}
	if (intersection.length > 0) {
		intersection.sort();
		error(
			`${asset.Group.Name}:${asset.Name}: found ${intersection.length} intersection(s) `
			+ `between asset and extended item option "Effect" properties categories: ${intersection}`
		);
	}
}

/**
 * Validate that all types referenced in {@link AssetLayer.AllowTypes} actually exist.
 * @param {Record<ExtendedArchetype, Record<string, AssetArchetypeData>>} dataSuperRecord
 */
function testAllowTypes(dataSuperRecord) {
	/** @type {(data: AssetArchetypeData, typeSet: Set<PartialType>) => Set<PartialType>} */
	function _dfs(data, typeSet) {
		/** @type {AssetArchetypeData[]} */
		const subscreenData = [];
		switch (data.archetype) {
			case "typed":
			case "vibrating": {
				/** @type {(VibratingItemOption | TypedItemOption)[]} */
				const options = data.options;
				for (const [i, option] of enumerate(options)) {
					typeSet.add(`${data.name}${i}`);
					if (option.ArchetypeData) {
						subscreenData.push(option.ArchetypeData);
					}
				}
				break;
			}
			case "modular": {
				const options = data.modules.flatMap(m => m.Options);
				for (const option of options) {
					typeSet.add(option.Name);
					if (option.ArchetypeData) {
						subscreenData.push(option.ArchetypeData);
					}
				}
				break;
			}
		}
		subscreenData.forEach(d => _dfs(d, typeSet));
		return typeSet;
	}

	for (const dataRecord of Object.values(dataSuperRecord)) {
		for (const data of Object.values(dataRecord)) {
			if (data.parentOption != null || data.archetype === "text") {
				continue;
			}

			const asset = data.asset;
			const allowedTypes = _dfs(data, new Set());
			for (const layer of asset.Layer) {
				if (!layer.AllowTypes) {
					continue;
				}

				const invalid = keys(layer.AllowTypes.TypeToID).filter(k => !allowedTypes.has(k));
				if (invalid.length > 0) {
					error(
						`${asset.Group.Name}:${asset.Name}: found ${invalid.length} invalid types `
						+ `in the AllowTypes array of layer ${layer.Name}: ${invalid}`
					);
				}
			}
		}
	}
}

/**
 * @param {readonly Asset[]} assets
 */
function testCopyLayerColor(assets) {
	for (const asset of assets) {
		const layerNames = asset.Layer.map(l => l.Name);
		for (const layer of asset.Layer) {
			if (layer.CopyLayerColor == null) {
				continue;
			}
			if (!layerNames.includes(layer.CopyLayerColor)) {
				error(
					`${asset.Group.Name}:${asset.Name}: found an invalid `
					+ `CopyLayerColor value in layer ${layer.Name}: ${layer.CopyLayerColor}`
				);
			}
		}
	}
}

/**
 * Validate whether all extended item prerequisites of the default option are a subset of the asset-level prerequisites.
 * @param {Record<ExtendedArchetype, Record<string, AssetArchetypeData>>} dataSuperRecord
 */
function testExtendedPrerequisite(dataSuperRecord) {
	for (const dataRecord of Object.values(dataSuperRecord)) {
		for (const data of Object.values(dataRecord)) {
			const asset = data.asset;

			/** @type {AssetPrerequisite[]} */
			const extendedPrereq = [];
			switch (data.archetype) {
				case "typed":
				case "vibrating": {
					const prereq = data.options[0].Prerequisite;
					if (Array.isArray(prereq)) {
						extendedPrereq.push(...prereq);
					} else if (typeof prereq === "string") {
						extendedPrereq.push(prereq);
					}
					break;
				}
				case "modular": {
					for (const mod of data.modules) {
						const prereq = mod.Options[0].Prerequisite;
						if (Array.isArray(prereq)) {
							extendedPrereq.push(...prereq);
						} else if (typeof prereq === "string") {
							extendedPrereq.push(prereq);
						}
					}
					break;
				}
				default:
					break;
			}

			if (extendedPrereq.length === 0) {
				continue;
			}

			/** @type {AssetPrerequisite[]} */
			const invalidSuperset = [];
			for (const prereq of extendedPrereq) {
				if (!asset.Prerequisite.includes(prereq)) {
					invalidSuperset.push(prereq);
				}
			}

			if (invalidSuperset.length > 0) {
				invalidSuperset.sort();
				error(
					`${asset.Group.Name}:${asset.Name}: default extended item prerequisites must `
					+ `be a subset of asset-level prerequisites; offending members: ${invalidSuperset}`
				);
			}
		}
	}
}

/** Copy of the definition in Asset.js */
const PoseType = /** @type {const} */({
	/**
	 * Ensures that the asset is hidden for a specific pose.
	 * Supercedes the old `HideForPose` property.
	 */
	HIDE: "Hide",
	/**
	 * Ensures that the default (pose-agnostic) asset used for a particular pose.
	 * Supercedes the old `AllowPose` property.
	 */
	DEFAULT: "",
});

/**
 * Convert a flattened list of pose names to a record mapping pose categories to their respective names.
 * @param {readonly AssetPoseName[]} poses - A list of to-be mapped poses
 * @param {Record<AssetPoseCategory, Set<AssetPoseName>>} referencePoseMap - A record containing all pose categories and all their respective members
 * @returns {Partial<Record<AssetPoseCategory, AssetPoseName[]>>} - A record containing all the subset of pose categories and members member names as specified in `poses`
 */
function poseToPoseMap(poses, referencePoseMap) {
	/** @type {Partial<Record<AssetPoseCategory, AssetPoseName[]>>} */
	const poseMap = {};
	for (const pose of poses) {
		for (const [_category, poseSet] of Object.entries(referencePoseMap)) {
			const category = /** @type {AssetPoseCategory} */(_category);
			if (poseSet.has(pose)) {
				poseMap[category] = [...(poseMap[category] || []), pose];
				break;
			}
		}
	}
	return poseMap;
}

/**
 * Test that `AllowActivePose` is, on pose category by category basis, a superset of `PoseMapping` key.
 * @param {readonly Asset[]} assets
 * @param {Record<AssetPoseCategory, Set<AssetPoseName>>} poseMap
 */
function testActivePose(assets, poseMap) {
	for (const asset of assets) {
		// TODO: For archetypical items we have to check against a `AllowActivePose` union involving all extended item option allowed poses
		if (!asset.AllowActivePose || asset.Archetype) {
			continue;
		}

		for (const layer of asset.Layer) {
			const allowPoseMap = poseToPoseMap(/** @type {AssetPoseName[]} */(Object.keys(layer.PoseMapping)), poseMap);
			const allowActivePoseMap = poseToPoseMap(asset.AllowActivePose ?? [], poseMap);

			for (const [_category, allowActivePoseList] of Object.entries(allowActivePoseMap)) {
				const category = /** @type {AssetPoseCategory} */(_category);
				const allowPoseList = allowPoseMap[category];
				if (!allowPoseList) {
					continue;
				}

				const invalidSuperset = allowPoseList.filter(p => !allowActivePoseList.includes(p) && layer.PoseMapping[p] !== PoseType.DEFAULT && layer.PoseMapping[p] !== PoseType.HIDE);
				if (invalidSuperset.length > 0) {
					invalidSuperset.sort();
					error(
						`${asset.Group.Name}:${asset.Name}:${layer.Name}: PoseMapping keys must be a subset of AllowActivePose for a given pose category; `
						+ `found ${invalidSuperset.length} offending members in category "${category}": ${invalidSuperset}`
					);
				}
			}
		}

		// TODO: Run this over all extended item options
		if (!asset.SetPose) {
			error(`${asset.Group.Name}:${asset.Name}: Cannot define "AllowActivePose" without "SetPose"`);
		}
	}
}

/**
 * Check that all assets have a preview image
 * @param {readonly Asset[]} assets
 */
function testHasPreview(assets) {
	for (const asset of assets) {
		const assetPath = `${BASE_PATH}Assets/${asset.Group.Family}/${asset.DynamicGroupName}/Preview/${asset.Name}.png`;
		if (asset.Visible && asset.Group.AllowNone && !fs.existsSync(assetPath)) {
			error(`${asset.Group.Name}:${asset.Name}: Missing preview image at "${assetPath}"`);
		}
	}
}

/**
 *
 * @param {Asset} asset
 * @param {Record<ExtendedArchetype, Record<string, AssetArchetypeData>>} extendedDataRecords
 * @returns {Record<string, ExtendedItemOptionUnion[]>}
 */
function getExtendedOptions(asset, extendedDataRecords) {
	/** @type {(data: AssetArchetypeData, optionRecord: Record<string, ExtendedItemOptionUnion[]>) => void} */
	function _dfs(data, optionRecord) {
		/** @type {ExtendedItemOptionUnion[]} */
		let options = [];
		switch (data.archetype) {
			case "typed":
			case "vibrating":
				options = data.options;
				optionRecord[data.name] = data.options;
				break;
			case "modular":
				options = data.modules.flatMap(m => m.Options);
				data.modules.forEach(m => optionRecord[m.Key] = m.Options);
				break;
		}
		for (const o of options) {
			if (o.ArchetypeData) {
				_dfs(o.ArchetypeData, optionRecord);
			}
		}
	}

	/** @type {Record<string, ExtendedItemOptionUnion[]>} */
	const ret = {};
	const rootData = extendedDataRecords[/** @type {ExtendedArchetype} */(asset.Archetype)]?.[`${asset.Group.Name}${asset.Name}`];
	if (rootData) {
		_dfs(rootData, ret);
	}
	return ret;
}

/**
 * @param {AssetPoseMapping} poseMapping
 * @param {Record<AssetPoseName, Pose>} poseRecord
 * @returns {AssetPoseMapping}
 */
function padPoseMapping(poseMapping, poseRecord) {
	const categories = new Set(keys(poseMapping).map(p => poseRecord[p].Category));
	if (categories.has("BodyUpper") || categories.has("BodyLower")) {
		categories.add("BodyFull");
	}

	return fromEntries(Array.from(categories).flatMap(c => {
		return Object.values(poseRecord).filter(p => {
			return p.Category === c;
		}).map(p => {
			return [p.Name, poseMapping[p.Name] ?? PoseType.DEFAULT];
		});
	}));
}

/**
 * Check that all assets have the expected .png images.
 * @param {readonly Asset[]} assets
 * @param {Record<ExtendedArchetype, Record<string, AssetArchetypeData>>} extendedDataRecords
 * @param {Record<AssetPoseName, Pose>} poseRecord
 */
function testAssetHasPNG(assets, extendedDataRecords, poseRecord) {
	const expressionGroups = new Set(assets.filter(a => a.Group.AllowExpression).map(a => a.Group.Name));
	const assetGroups = /** @type {Record<AssetGroupName, AssetGroup>} */({});
	const assetGroupMap = /** @type {Record<AssetGroupName, { F: Set<string>, M: Set<string>, FM: Set<string> }>} */({});
	for (const asset of assets) {
		const gender = asset.Gender ?? "FM";
		if (!(asset.Group.Name in assetGroupMap)) {
			assetGroupMap[asset.Group.Name] = { "F": new Set(), "M": new Set(), "FM": new Set() };
		}

		if (gender === "FM") {
			assetGroupMap[asset.Group.Name].F.add(asset.Name);
			assetGroupMap[asset.Group.Name].M.add(asset.Name);
			assetGroupMap[asset.Group.Name].FM.add(asset.Name);
		} else {
			assetGroupMap[asset.Group.Name][gender].add(asset.Name);
			assetGroupMap[asset.Group.Name].FM.add(asset.Name);
		}
		assetGroups[asset.Group.Name] = asset.Group;
	}

	for (const asset of assets) {
		if (!asset.Visible) {
			continue;
		}

		for (const layer of asset.Layer) {
			if (!layer.HasImage) {
				continue;
			}

			// Combinations involving pose-specific directories
			const poseMapping = asset.AllowActivePose ? layer.PoseMapping : padPoseMapping(layer.PoseMapping, poseRecord);
			const poses = new Set(Object.values(poseMapping).filter(p => p !== PoseType.HIDE));
			if (poses.size === 0) {
				poses.add(PoseType.DEFAULT);
			}

			// Combinations involving archetypical items
			/** @type {[type: PartialType | null, poses: Iterable<AssetPoseName | PoseType>][]} */
			let layerTypes = [[null, poses]];
			const optionsRecord = getExtendedOptions(asset, extendedDataRecords);
			if (asset.Name === "SlaveCollar") {
				layerTypes = [];
				for (let i = 0; i <= 21; i++) {
					layerTypes.push([/** @type {PartialType} */ (`noarch${i}`), poses]);
				}
			} else if (layer.CreateLayerTypes.length || layer.AllowTypes) {
				/** @type {PartialType[]} */
				const partialLayerTypes = [];
				/** @type {ExtendedItemOption[]} */
				let options = [];
				if (layer.CreateLayerTypes.length) {
					const allTypes = layer.AllowTypes?.AllTypes ?? {};
					options = layer.CreateLayerTypes.flatMap(screenKey => {
						if (!optionsRecord[screenKey]) {
							error(`${asset.Group.Name}:${asset.Name}:${layer.Name}: missing extended options. Possibly a missing CopyConfig directive?`);
							return /** @type {never} */({});
						}
						return optionsRecord[screenKey].map((o, i) => {
							if (allTypes[screenKey]?.has(i) ?? true) {
								partialLayerTypes.push(`${screenKey}${i}`);
								return o;
							} else {
								return /** @type {never} */(null);
							}
						}).filter(i => i != null);
					});
				} else if (layer.AllowTypes) {
					// Filter out `undefined` in case someone messes up `layer.AllowTypes`
					options = Object.entries(layer.AllowTypes.AllTypes).flatMap(([screenKey, indexSet]) => {
						if (!optionsRecord[screenKey]) {
							error(`${asset.Group.Name}:${asset.Name}:${layer.Name}: missing extended options. Possibly a missing CopyConfig directive?`);
							return /** @type {never} */({});
						}
						return Array.from(indexSet).map(i => {
							partialLayerTypes.push(`${screenKey}${i}`);
							return optionsRecord[screenKey][i];
						}).filter(o => o !== undefined);
					});
				}

				if (options.length > 0) {
					layerTypes = options.map((o, i) => {
						const optionPoses = o.Property?.AllowActivePose ?? asset.AllowActivePose ?? keys(poseMapping);
						let mappedPoses = optionPoses.map(p => poseMapping[p] ?? PoseType.DEFAULT);
						if (mappedPoses.length && mappedPoses.every(p => p === PoseType.HIDE)) {
							mappedPoses = [];
						} else {
							mappedPoses = mappedPoses.filter(p => p !== PoseType.HIDE && p !== PoseType.DEFAULT);
							if (mappedPoses.length === 0) {
								mappedPoses.push(PoseType.DEFAULT);
							}
						}
						return [layer.CreateLayerTypes.length ? partialLayerTypes[i] : null, mappedPoses];
					});
				}
			}

			// Combinations involving non-hex based colors (white, black, asian, etc)
			/** @type {(string | null)[]} */
			let colors;
			if (layer.InheritColor) {
				let colorParent = assetGroups[layer.InheritColor];
				while (colorParent.InheritColor) {
					colorParent = assetGroups[colorParent.InheritColor];
				}
				colors = colorParent.ColorSchema.map(i => layer.ColorSuffix?.[i] ?? i).filter(i => i !== "Default" && !i.startsWith("#"));
			} else {
				colors = asset.Group.ColorSchema.filter(i => i !== "Default" && !i.startsWith("#"));
			}
			if (colors.length === 0) {
				colors = [null];
			}

			// Combinations involving expressions
			/** @type {readonly (null | ExpressionName)[]} */
			let expressions = [null, ...(layer.Asset.AllowExpression ?? layer.Asset.Group.AllowExpression ?? [])];
			if (
				!(expressionGroups.has(asset.Group.Name) || layer.MirrorExpression)
				|| (asset.Group.Name === "Pussy" && asset.Name.startsWith("Pussy"))
			) {
				expressions = [null];
			}

			for (const iter of [colors, expressions, layerTypes]) {
				if (Array.from(/** @type {Iterable<unknown>} */(iter)).length === 0) {
					error(`${asset.Group.Name}:${asset.Name}:${layer.Name}: Internal error; zero-length list encountered!`);
				}
			}

			// Combinations involving BodyStyle
			const DEFAULT_STYLE = "DEFAULT_STYLE";
			let bodyStyles = layer.StyleOverride ?? ["DEFAULT_STYLE"];
			bodyStyles.splice(0, 0, DEFAULT_STYLE);

			for (const style of bodyStyles) {
				const styleSubpath = style !== DEFAULT_STYLE ? `Override/${style}/` : "";
				const root = `${BASE_PATH}Assets/${asset.Group.Family}/${styleSubpath}${asset.DynamicGroupName}/`;
				for (const color of colors) {
					for (const expression of expressions) {
						for (const [type, poseList] of layerTypes) {
							for (const pose of poseList) {
								/** @type {undefined | "" | AssetGroupName} */
								const parentGroup = layer.ParentGroup[pose] ?? layer.ParentGroup[PoseType.DEFAULT];
								const parentNames = !parentGroup ? new Set([null]) : assetGroupMap[parentGroup][asset.Gender ?? "FM"];
								if (parentNames.size === 0) {
									error(`${asset.Group.Name}:${asset.Name}:${layer.Name}: Internal error; zero-length list encountered!`);
								}

								for (const parent of parentNames) {
									const pngPath = (
										root
										+ (pose ? `${pose}/` : "")
										+ (expression ? `${expression}/` : "")
									);
									const fileParts = [];
									if (asset.Name) fileParts.push(asset.Name);
									if (parent) fileParts.push(parent);
									if (type) fileParts.push(type);
									if (color) fileParts.push(color);
									if (layer.Name) fileParts.push(layer.Name);
									const file = pngPath + fileParts.join("_") + ".png";
									const key = `${asset.DynamicGroupName}:${asset.Name}:${layer.Name}`;
									if (!fs.existsSync(file)) {
										if (style === DEFAULT_STYLE) {
											error(`${key}: Missing layer file "${file}"`);
										} else if (!knownMissingOverrides.has(key)) {
											error(`${key}: Missing override layer file for style ${style} "${file}"`);
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

/**
 * Check that {@link Asset.SetPose} contains only one pose per category.
 * @param {readonly Asset[]} assets
 * @param {readonly Pose[]} poses
 */
function testSetPose(assets, poses) {
	const poseRecord = fromEntries(poses.map(p => [p.Name, p]));
	for (const asset of assets) {
		const setPose = asset.SetPose;
		if (!setPose) {
			continue;
		}

		/** @type {Partial<Record<AssetPoseCategory, { n: number, poses: Pose[] }>> }} */
		const categories = {};
		for (const poseName of setPose) {
			const pose = poseRecord[poseName];
			const rec = categories[pose.Category];
			if (rec) {
				rec.n += 1;
				rec.poses.push(pose);
			} else {
				categories[pose.Category] = { n: 1, poses: [pose] };
			}
		}

		if ("BodyFull" in categories && ("BodyUpper" in categories || "BodyLower" in categories)) {
			const invalidPoses = [
				...(categories.BodyFull?.poses ?? []),
				...(categories.BodyUpper?.poses ?? []),
				...(categories.BodyLower?.poses ?? []),
			].map(p => p.Name);
			error(
				`${asset.Group.Name}:${asset.Name}: Cannot have both BodyFull and BodyUpper/BodyLower poses specified in SetPose`
				+ `; offending members: ${invalidPoses}`,
			);
		}

		const duplicates = Object.values(categories).filter(pose => pose.n > 1).flatMap(pose => pose.poses.map(p => p.Name));
		if (duplicates.length > 0) {
			error(
				`${asset.Group.Name}:${asset.Name}: Cannot have both multiple poses of the same category specified in SetPose`
				+ `; offending members: ${duplicates}`,
			);
		}
	}
}

/**
 * Check that asset groups referenced in `AssetFemale3DCGExtended` match those in `AssetFemale3DCG`.
 * @param {ExtendedItemMainConfig} extendedItemRecords
 * @param {readonly Asset[]} assets
 */
function testExtendedItemGroupName(extendedItemRecords, assets) {
	/** @type {Record<string, AssetGroupName[]>} */
	const assetMapping = {};
	for (const asset of assets) {
		assetMapping[asset.Name] ??= [];
		assetMapping[asset.Name].push(asset.Group.Name);
	}

	for (const [group, groupConfig] of entries(extendedItemRecords)) {
		for (const asset of keys(groupConfig)) {
			const validGroups = assetMapping[asset];
			if (!validGroups.includes(group)) {
				error(
					`${asset}: Extended asset declares an invalid group ("${group}") in AssetFemale3DCGExtended; `
					+ `valid available groups: ${validGroups.sort()}`
				);
			}
		}
	}
}

/**
 * Check that the console did not log any runtime warnings.
 * @param {Record<"warn" | "error", [src: string, ...rest: unknown[]][]>} logOutput
 */
function testConsoleLog(logOutput) {
	const logs = [
		...logOutput.warn.filter(i => i.length > 0),
		...logOutput.error.filter(i => i.length > 0),
	];
	if (logs.length > 0) {
		const stringLogs = logs.map(([source, ...args]) => {
			return source ? `${source}: ${args.join(", ")}` : args.join(", ");
		}).join("\n\t");
		error(`Found ${logs.length} unexpected console warnings:\n\t${stringLogs}`);
	}
}

/**
 * Test that appropriate callbacks exist for:
 * - {@link Asset.DynamicAfterDraw}
 * - {@link Asset.DynamicBeforeDraw}
 * - {@link Asset.DynamicScriptDraw}
 * @param {readonly Asset[]} assets
 * @param {Record<string, unknown>} window
 */
function testDrawCallbacks(assets, window) {
	const propertyNames = /** @type {const} */({
		AfterDraw: "DynamicAfterDraw",
		BeforeDraw: "DynamicBeforeDraw",
		ScriptDraw: "DynamicScriptDraw",
	});

	for (const asset of assets) {
		for (const [funcSuffix, fieldName] of Object.entries(propertyNames)) {
			const funcName = `Assets${asset.Group.Name}${asset.Name}${funcSuffix}`;
			const func = window[funcName];
			if (!asset[fieldName] && func !== undefined) {
				error(`${asset.Group.Name}:${asset.Name}: cannot define "${funcName}" without specifying "Asset.${fieldName}"`);
			} else if (asset[fieldName] && typeof func !== "function") {
				error(`${asset.Group.Name}:${asset.Name}: cannot specify "Asset.${fieldName}" without defining "${funcName}"`);
			}
		}
	}
}

/**
 * @param {readonly Asset[]} assets
 * @param {Record<ExtendedArchetype, Record<string, AssetArchetypeData>>} extendedDataRecords
 */
function testSelfBlock(assets, extendedDataRecords) {
	for (const asset of assets) {
		/** @type {readonly AssetGroupName[]} */
		const blocks = asset.Block ?? [];
		if (blocks.includes(asset.Group.Name)) {
			error(`${asset.Group.Name}:${asset.Name}: item must not block its own group`);
		}

		/** @type {Record<string, ExtendedItemOption[]>} */
		const extendedOptions = getExtendedOptions(asset, extendedDataRecords);
		for (const [extendedName, options] of Object.entries(extendedOptions)) {
			/** @type {readonly AssetGroupName[]} */
			const extendedBlocks = options.flatMap(o => o.Property?.Block ?? []);
			if (extendedBlocks.includes(asset.Group.Name)) {
				error(`${asset.Group.Name}:${asset.Name}:${extendedName} extended item must not block its own group`);
			}
		}
	}
}

/**
 * Strigify and parse the passed object to get the correct Array and Object prototypes, because VM uses different ones.
 * This unfortunately results in Functions being lost and replaced with a dummy function
 * @template {object} T
 * @param {T} input The to-be sanitized input
 * @returns {T} The sanitized output
 */
function sanitizeVMOutput(input) {
	return /** @type {T} */ (JSON.parse(
		JSON.stringify(
			input,
			(key, value) => typeof value === "function" ? "__FUNCTION__" : value,
		),
		(key, value) => value === "__FUNCTION__" ? () => { return; } : value,
	));
}

(function () {
	const [commonFile, ...neededFiles] = NEEDED_FILES;

	/** @type {Record<"warn" | "error", [src: string, ...rest: unknown[]][]>} */
	const logOutput = {
		warn: [],
		error: [],
	};
	const context = vm.createContext({
		OuterArray: Array,
		Object: Object,
		TestingColorLayers: new Set(loadCSV("Assets/LayerNames.csv", 2).map(i => i[0])),
		TestingColorGroups: new Set(loadCSV("Assets/ColorGroups.csv", 2).map(i => i[0])),
		CharacterMoneyFactor : 1.0,
		PreferenceArousalUpdateValidation: () => null,
		setTimeout: setTimeout,
		console: {
			...console,
			warn: function warn(...args) {
				// Identify the function responsible for issuing the warning via the stack trace
				const trace = (new Error()).stack;
				const source = trace ? trace.split("\n")[2].trim() : "";
				logOutput.warn.push([source, ...args]);
			},
			// eslint-disable-next-line @typescript-eslint/no-shadow
			error: function error(...args) {
				const trace = (new Error()).stack;
				const source = trace ? trace.split("\n")[2].trim() : "";
				logOutput.error.push([source, ...args]);
			},
		},
	});
	vm.runInContext(fs.readFileSync(BASE_PATH + commonFile, { encoding: "utf-8" }), context, {
		filename: commonFile,
	});

	// Only patch `CommonGet` after loading `Common`, lest our monkey patch will be overriden again
	context.CommonGet = (file, callback) => {
		const data = fs.readFileSync(`../../${file}`, "utf8");
		const obj = {
			status: 200,
			responseText: data,
		};
		callback.bind(obj)(obj);
	};
	context.CommonFetch = async (url) => {
		const data = fs.readFileSync(`../../${url}`, "utf8");
		// Quacks like a Request object
		const obj = {
			status: 200,
			text: async function() {
				return data;
			}
		};
		return obj;
	};
	for (const file of neededFiles) {
		vm.runInContext(fs.readFileSync(BASE_PATH + file, { encoding: "utf-8" }), context, {
			filename: file,
		});
	}

	/** @type {AssetGroupDefinition[]} */
	const AssetFemale3DCG = sanitizeVMOutput(context.AssetFemale3DCG);
	/** @type {ExtendedItemMainConfig} */
	const AssetFemale3DCGExtended = sanitizeVMOutput(context.AssetFemale3DCGExtended);
	/** @type {TestingStruct<string>[]} */
	const missingColorLayers = sanitizeVMOutput(context.TestingMisingColorLayers);
	/** @type {TestingStruct<string>[]} */
	const missingColorGroups = sanitizeVMOutput(context.TestingMisingColorGroups);
	/** @type {TestingStruct<string[]>[]} */
	const invalidColorDefaults = sanitizeVMOutput(context.TestingInvalidDefaultColor);
	/** @type {Record<string, ModularItemData>} */
	const ModularItemDataLookup = context.TestingModularItemDataLookup;
	/** @type {Record<string, TypedItemData>} */
	const TypedItemDataLookup = context.TestingTypedItemDataLookup;
	/** @type {Record<string, VibratingItemData>} */
	const VibratingItemDataLookup = context.TestingVibratingItemDataLookup;
	/** @type {Record<string, TextItemData>} */
	const TextItemDataLookup = context.TestingTextItemDataLookup;
	/** @type {Record<string, VariableHeightData>} */
	const VariableHeightItemDataLookup = context.TestingVariableHeightItemDataLookup;
	/** @type {Record<string, NoArchItemData>} */
	const NoArchItemDataLookup = context.TestingNoArchItemDataLookup;
	/** @type {Asset[]} */
	const assetList = context.Asset;
	/** @type {AssetGroup[]} */
	const groupList = context.AssetGroup;
	/** @type {Record<AssetPoseCategory, Set<AssetPoseName>>} */
	const poseMap = context.TestingPoseMap;
	/** @type {Pose[]} */
	const pose = context.PoseFemale3DCG;
	const poseRecord = fromEntries(pose.map(p => [p.Name, p]));

	const extendedItemSuperRecord = {
		modular: ModularItemDataLookup,
		text: TextItemDataLookup,
		typed: TypedItemDataLookup,
		variableheight: VariableHeightItemDataLookup,
		vibrating: VibratingItemDataLookup,
		noarch: NoArchItemDataLookup,
	};

	if (!Array.isArray(AssetFemale3DCG)) {
		error("AssetFemale3DCG not found");
		return;
	}

	const assetDescriptions = loadCSV("Assets/Female3DCG.csv", 3);
	const dialogArray = loadCSV("Assets/AssetStrings.csv", 2);

	// No further checks if initial data load failed
	if (errorState.local) {
		return;
	}

	// Check all groups
	for (const Group of AssetFemale3DCG) {
		errorState.local = false;

		// Check all assets in groups
		for (const Asset of Group.Asset) {
			if (typeof Asset === "string") {
				continue;
			}
			errorState.local = false;

			// Check any extended item config
			if (Asset.Extended) {
				const groupConfig = AssetFemale3DCGExtended[Group.Group] || {};
				const assetConfig = groupConfig[Asset.Name];
				if (assetConfig) {
					const archetype = assetConfig.Archetype;
					if (archetype) {
						const propList = ["AllowEffect", "AllowBlock", "AllowHide", "AllowHideItem", "AllowType", "AllowLockType"];
						for (const name of propList) {
							if (Asset[name] !== undefined && Asset.Name !== "SlaveCollar") {
								error(`${Group.Group}:${Asset.Name}: Archetypical extended items must NOT set ${name}`);
							}
						}
					}
				}
			}

			if (Array.isArray(Asset.Layer)) {
				if (Asset.Layer.length === 0) {
					error(`${Group.Group}:${Asset.Name}: Asset must contain at least one layer when explicitly specified`);
				}
				for (const layerDef of Asset.Layer) {
					// Check for conflicting layer properties
					if (Array.isArray(layerDef.HideForAttribute) && Array.isArray(layerDef.ShowForAttribute)) {
						for (const attribute of layerDef.HideForAttribute) {
							if (layerDef.ShowForAttribute.includes(attribute)) {
								error(`Layer ${Group.Group}:${Asset.Name}:${layerDef.Name}: Attribute "${attribute}" should NOT appear in both HideForAttribute and ShowForAttribute`);
							}
						}
					}
				}
			}
		}
	}

	if (errorState.global) {
		console.log("WARNING: Type errors detected, skipping other checks");
		return;
	}

	// Check all type-valid groups for specific data
	let descriptionFirst = true;
	for (const Group of groupList) {
		// Description name
		const descriptionIndex = assetDescriptions.findIndex(d => d[0] === Group.Name && d[1] === "");
		if (descriptionIndex < 0) {
			if (descriptionFirst) {
				descriptionFirst = false;
				console.error('\nERROR: Missing asset- and/or group-description(s) in "BondageClub/Assets/Female3DCG.csv":');
			}
			error(`No description for group "${Group.Name}"`);
		} else {
			assetDescriptions.splice(descriptionIndex, 1);
		}

		// Check all type-valid assets for specific data
		for (const Asset of Group.Asset) {
			if (Asset.DynamicGroupName !== Group.Name) {
				continue;
			}
			if (Asset.Name === "" && !Group.AllowCustomize) {
				// Special case for the "static" body groups (arms and hands)
				continue;
			}

			// Description name
			const descriptionIndexAsset = assetDescriptions.findIndex(d => d[0] === Group.Name && d[1] === Asset.Name);
			if (descriptionIndexAsset < 0) {
				if (descriptionFirst) {
					descriptionFirst = false;
					console.error('\nERROR: Missing asset- and/or group-description(s) in "BondageClub/Assets/Female3DCG.csv":');
				}
				error(`No description for asset "${Group.Name}:${Asset.Name}"`);
			} else {
				assetDescriptions.splice(descriptionIndexAsset, 1);
			}
		}
	}

	// Check for extra descriptions
	for (const desc of assetDescriptions) {
		error(`Unused Asset/Group description: ${desc.join(",")}`);
	}

	testConsoleLog(logOutput);
	testExtendedItemGroupName(AssetFemale3DCGExtended, assetList);
	testDrawCallbacks(assetList, context);
	testDynamicGroupName(AssetFemale3DCG);
	testExtendedItemDialog(extendedItemSuperRecord, dialogArray);
	testColorGroups(missingColorGroups);
	testColorLayers(missingColorLayers);
	testModuleOptionLength(AssetFemale3DCGExtended);
	testDefaultColor(invalidColorDefaults);
	testModularItemPropertyDisjoint(ModularItemDataLookup);
	testExtendedItemButtonImage(extendedItemSuperRecord);
	testAssetLayerNames(assetList);
	testAssetAndExtendedPropertyIsDisjoint(extendedItemSuperRecord);
	testAllowTypes(extendedItemSuperRecord);
	testCopyLayerColor(assetList);
	testExtendedPrerequisite(extendedItemSuperRecord);
	testActivePose(assetList, poseMap);
	testHasPreview(assetList);
	testAssetHasPNG(assetList, extendedItemSuperRecord, poseRecord);
	testSetPose(assetList, pose);
	testSelfBlock(assetList, extendedItemSuperRecord);
})();
