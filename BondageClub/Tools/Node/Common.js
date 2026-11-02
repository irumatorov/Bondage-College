/** Common utility scripts for the test suite. */

import fs from "fs";

/** Files needed to check the Female3DCG assets. */
export const NEEDED_FILES = [
	"Scripts/Common.js",
	"Scripts/Dialog.js",
	"Scripts/Pose.js",
	"Scripts/Asset.js",
	"Scripts/ExtendedItem.js",
	"Scripts/ModularItem.js",
	"Scripts/TypedItem.js",
	"Scripts/VariableHeight.js",
	"Scripts/VibratorMode.js",
	"Scripts/Property.js",
	"Scripts/TextItem.js",
	"Scripts/NoArch.js",
	"Scripts/PortalLink.js",
	"Screens/Inventory/Futuristic/Futuristic.js",
	"Screens/Inventory/ItemTorso/FuturisticHarness/FuturisticHarness.js",
	"Screens/Inventory/ItemNeckAccessories/CollarNameTag/CollarNameTag.js",
	"Screens/Inventory/ItemArms/FullLatexSuit/FullLatexSuit.js",
	"Screens/Inventory/ItemButt/InflVibeButtPlug/InflVibeButtPlug.js",
	"Screens/Inventory/ItemDevices/VacBedDeluxe/VacBedDeluxe.js",
	"Screens/Inventory/ItemDevices/WoodenBox/WoodenBox.js",
	"Screens/Inventory/ItemPelvis/SciFiPleasurePanties/SciFiPleasurePanties.js",
	"Screens/Inventory/ItemNeckAccessories/CollarShockUnit/CollarShockUnit.js",
	"Screens/Inventory/ItemVulva/ClitAndDildoVibratorbelt/ClitAndDildoVibratorbelt.js",
	"Screens/Inventory/ItemBreast/FuturisticBra/FuturisticBra.js",
	"Screens/Inventory/ItemArms/TransportJacket/TransportJacket.js",
	"Screens/Inventory/ItemMouth/FuturisticPanelGag/FuturisticPanelGag.js",
	"Screens/Inventory/ItemNeckAccessories/CollarAutoShockUnit/CollarAutoShockUnit.js",
	"Screens/Inventory/ItemArms/PrisonLockdownSuit/PrisonLockdownSuit.js",
	"Screens/Inventory/ItemPelvis/LoveChastityBelt/LoveChastityBelt.js",
	"Screens/Inventory/ItemButt/AnalBeads2/AnalBeads2.js",
	"Screens/Inventory/ItemDevices/LuckyWheel/LuckyWheel.js",
	"Screens/Inventory/ItemDevices/FuturisticCrate/FuturisticCrate.js",
	"Screens/Inventory/Cloth/CheerleaderTop/CheerleaderTop.js",
	"Screens/Inventory/ClothAccessory/Bib/Bib.js",
	"Screens/Inventory/BodyMarkings/BodyWritings/BodyWritings.js",
	"Screens/Inventory/FaceMarkings/FaceWritings/FaceWritings.js",
	"Screens/Inventory/ItemDevices/DollBox/DollBox.js",
	"Screens/Inventory/ItemDevices/PetBowl/PetBowl.js",
	"Screens/Inventory/ItemDevices/BarStool/BarStool.js",
	"Screens/Inventory/ItemHead/DroneMask/DroneMask.js",
	"Screens/Inventory/ItemHandheld/Plushies/Plushies.js",
	"Screens/Inventory/ItemMisc/WoodenSign/WoodenSign.js",
	"Screens/Inventory/ItemHood/CanvasHood/CanvasHood.js",
	"Screens/Inventory/ItemPelvis/ObedienceBelt/ObedienceBelt.js",
	"Screens/Inventory/ItemPelvis/ModularChastityBelt/ModularChastityBelt.js",
	"Screens/Inventory/ItemNeckAccessories/CustomCollarTag/CustomCollarTag.js",
	"Screens/Inventory/ItemNeckAccessories/ElectronicTag/ElectronicTag.js",
	"Screens/Inventory/ItemNeckRestraints/PetPost/PetPost.js",
	"Screens/Inventory/ItemVulva/FuturisticVibrator/FuturisticVibrator.js",
	"Screens/Inventory/ItemVulva/TechnoChastityCage/TechnoChastityCage.js",
	"Screens/Inventory/ItemPelvis/FuturisticTrainingBelt/FuturisticTrainingBelt.js",
	"Screens/Inventory/ItemDevices/KabeshiriWall/KabeshiriWall.js",
	"Screens/Inventory/ItemDevices/FuckMachine/FuckMachine.js",
	"Screens/Inventory/ItemDevices/CardBoardBox/CardBoardBox.js",
	"Screens/Inventory/ItemBreast/ForbiddenChastityBra/ForbiddenChastityBra.js",
	"Screens/Inventory/Suit/LatexCatsuit/LatexCatsuit.js",
	"Screens/Inventory/ItemNeck/FuturisticCollar/FuturisticCollar.js",
	"Screens/Inventory/ItemNeck/SlaveCollar/SlaveCollar.js",
	"Screens/Inventory/ItemDevices/WheelFortune/WheelFortune.js",
	"Screens/Inventory/ItemMisc/IntricatePadlock/IntricatePadlock.js",
	"Screens/Inventory/ItemMisc/TimerPadlock/TimerPadlock.js",
	"Screens/Inventory/ItemMisc/CombinationPadlock/CombinationPadlock.js",
	"Screens/Inventory/ItemMisc/HighSecurityPadlock/HighSecurityPadlock.js",
	"Screens/Inventory/ItemMisc/PasswordPadlock/PasswordPadlock.js",
	"Screens/Inventory/ItemMisc/SafewordPadlock/SafewordPadlock.js",
	"Screens/Inventory/ItemMisc/TimerPasswordPadlock/TimerPasswordPadlock.js",
	"Screens/Inventory/ItemMisc/MistressTimerPadlock/MistressTimerPadlock.js",
	"Screens/Inventory/ItemMisc/OwnerTimerPadlock/OwnerTimerPadlock.js",
	"Screens/Inventory/ItemMisc/OwnerPadlock/OwnerPadlock.js",
	"Screens/Inventory/ItemMisc/LoversTimerPadlock/LoversTimerPadlock.js",
	"Screens/Inventory/ItemMisc/FamilyPadlock/FamilyPadlock.js",
	"Screens/Inventory/ItemMisc/MistressPadlock/MistressPadlock.js",
	"Screens/Inventory/ItemHandheld/ToyHammer/ToyHammer.js",
	"Screens/Inventory/ItemMisc/ExclusivePadlock/ExclusivePadlock.js",
	"Screens/Inventory/ItemNeck/PetSuitShockCollar/PetSuitShockCollar.js",
	"Screens/Inventory/Wings/SteampunkWings/SteampunkWings.js",
	"Screens/Inventory/ItemFeet/NylonRope/NylonRope.js",
	"Screens/Inventory/ItemArms/NylonRope/NylonRope.js",
	"Screens/Inventory/ItemFeet/HempRope/HempRope.js",
	"Screens/Inventory/ItemArms/HempRope/HempRope.js",
	"Screens/Inventory/ItemPelvis/FuturisticChastityBelt/FuturisticChastityBelt.js",
	"Screens/Inventory/ItemNipples/LactationPump/LactationPump.js",
	"Screens/Inventory/ItemNeckRestraints/CollarLeash/CollarLeash.js",
	"Screens/Inventory/ItemDevices/Kennel/Kennel.js",
	"Assets/Female3DCG.js",
	"Scripts/Drawing.js",
	"Scripts/Server.js",
	"Scripts/Item.js",
	"Assets/Female3DCGExtended.js",
	"Screens/Room/Shop2/Shop2.js",
	"Scripts/Notification.js",
	"Scripts/Preference.js",
	"Scripts/Translation.js",
	"Scripts/Text.js",
	"Screens/Character/ItemColor/ItemColor.js",
	"Screens/Room/Crafting/Crafting.js",
	"Scripts/Testing.js",
];

/** The base path for any BC asset/script lookup. */
export const BASE_PATH = "../../";

export const errorState = {
	local: false,
	global: false,
};

/**
 * Logs the error to console and sets erroneous exit code
 * @param {string} text The error
 */
export function error(text) {
	console.error("ERROR:", text);
	process.exitCode = 1;
	errorState.local = true;
	errorState.global = true;
}

/** @see {@link Object.entries} */
export const entries = /** @type {<KT extends string, VT>(record: Partial<Record<KT, VT>>) => [key: KT, value: VT][]} */(Object.entries);

/** @see {@link Object.keys} */
export const keys = /** @type {<KT extends string>(record: Partial<Record<KT, unknown>>) => KT[]} */(Object.keys);

/** @see {@link Object.fromEntries} */
export const fromEntries = /** @type {<KT extends string, VT>(list: Iterable<readonly [key: KT, value: VT]>) => Record<KT, VT>} */(Object.fromEntries);

/**
 * Return whether the passed object is a record/interface.
 * @type {(obj: unknown) => obj is Record<string, unknown>}
 */
export function isObject(obj) {
	return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

/**
 * Parse a CSV file content into an array
 * @param {string} str - Content of the CSV
 * @returns {string[][]} Array representing each line of the parsed content, each line itself is split by commands and stored within an array.
 */
export function parseCSV(str) {
	/** @type {string[][]} */
	let arr = [];
	let quote = false; // true means we're inside a quoted field
	let c;
	let col;
	// We remove whitespace on start and end
	str = str.trim().replace(/\r\n/g, "\n") + "\n";

	// iterate over each character, keep track of current row and column (of the returned array)
	for (let row = (col = c = 0); c < str.length; c++) {
		var cc = str[c],
			nc = str[c + 1]; // current character, next character
		arr[row] = arr[row] || []; // create a new row if necessary
		arr[row][col] = arr[row][col] || ""; // create a new column (start with empty string) if necessary

		// If the current character is a quotation mark, and we're inside a
		// quoted field, and the next character is also a quotation mark,
		// add a quotation mark to the current column and skip the next character
		if (cc == '"' && quote && nc == '"') {
			arr[row][col] += cc;
			++c;
			continue;
		}

		// If it's just one quotation mark, begin/end quoted field
		if (cc == '"') {
			quote = !quote;
			continue;
		}

		// If it's a comma and we're not in a quoted field, move on to the next column
		if (cc == "," && !quote) {
			++col;
			continue;
		}

		// If it's a newline and we're not in a quoted field, move on to the next
		// row and move to column 0 of that new row
		if (cc == "\n" && !quote) {
			++row;
			col = 0;
			continue;
		}

		// Otherwise, append the current character to the current column
		arr[row][col] += cc;
	}
	return arr;
}

/**
 * Loads a CSV file and verifies correct column widths
 * @param {string} path Path to file, relative to BondageClub directory
 * @param {number} expectedWidth Expected number of columns
 */
export function loadCSV(path, expectedWidth) {
	const data = parseCSV(fs.readFileSync(BASE_PATH + path, { encoding: "utf-8" }));
	for (let line = 0; line < data.length; line++) {
		if (data[line].length !== expectedWidth) {
			error(`Bad width of line ${line + 1} (${data[line].length} vs ${expectedWidth}) in ${path}`);
		}
	}
	return data;
}

/**
 * Construct an array that aggregates elements from two other arrays.
 * @template T1
 * @template T2
 * @param {readonly T1[]} lst1
 * @param {readonly T2[]} lst2
 * @returns {[T1, T2][]}
 */
export function zip(lst1, lst2) {
	const length = Math.min(lst1.length, lst2.length);
	/** @type {[T1, T2][]} */
	const ret = [];
	for (let i=0; i < length; i++) {
		ret.push([lst1[i], lst2[i]]);
	}
	return ret;
}

/**
 * Validate the passed command line arguments
 * @template {Record<string, unknown>} T
 * @param {import("minimist").ParsedArgs} argv The unparsed command line arguments
 * @param {Readonly<T>} template A record containing *all* allowed keys and their default values
 * @returns {T}
 */
export function validateArgv(argv, template) {
	const { _, ...kwargs } = argv;

	/** @type {string[]} */
	const invalidArguments = [];
	invalidArguments.push(..._);

	const ret = { ...template };
	for (const [k, v] of Object.entries(kwargs)) {
		if (k in ret) {
			// @ts-ignore
			ret[k] = v;
		} else {
			invalidArguments.push(k);
		}
	}

	if (invalidArguments.length > 0) {
		throw new Error(`Found ${invalidArguments.length} unknown arguments: ${invalidArguments.join()}`);
	} else if (!Object.values(ret).some(Boolean)) {
		throw new Error(`Expected at least one argument`);
	}
	return ret;
}

/**
 * Iterate through the passed iterable and yield index/value pairs.
 * @template T
 * @param {Iterable<T>} iterable
 * @param {number} start
 * @param {number} step
 * @returns {Generator<[index: number, value: T], void>}
 */
export function *enumerate(iterable, start=0, step=1) {
	let i = start;
	for (const j of iterable) {
		yield [i, j];
		i += step;
	}
}
