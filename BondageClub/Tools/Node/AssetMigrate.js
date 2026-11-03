import fs from "fs";
import fsPromises from "fs/promises";
import os from "os";
import path from "path";
import { pathToFileURL } from "node:url";
import minimist from "minimist";

import {
	ASSETS_PAPERDOLL_DIR,
	BASE_PATH,
	female3DCGMigratedFolderRel,
	isManifest,
	loadDefaultPoseFolderByGroup,
	loadExpressionGroups,
	loadSingletonAssetGroups,
} from "./Common.js";

/**
 * True when this file is the Node entry point.
 * `node AssetMigrate` leaves the `.js` extension off `process.argv[1]`.
 * @returns {boolean}
 */
function isDirectRun() {
	const entry = process.argv[1];
	if (!entry) return false;
	const entryUrl = pathToFileURL(path.resolve(entry)).href;
	return import.meta.url === entryUrl || import.meta.url === `${entryUrl}.js`;
}

const HELP = `\
Migrate Female3DCG asset files from legacy locations to the asset-first layout.

Usage:
	npm --prefix BondageClub/ run assets:migrate -- --asset HempRope [options]
	npm --prefix BondageClub/ run assets:migrate -- --asset HempRope,NylonRope [options]

Required:
	--asset <names>        Asset name prefix, or comma-separated list (e.g. HempRope,NylonRope)

Options:
	-n, --dry-run          Print planned moves without writing
	-v, --verbose          Print each file move and removed directory
	-j, --jobs <count>     Parallel file operations (default: CPU count)
	-h, --help             Show this help
`;

const args = minimist(process.argv.slice(2), {
	boolean: ["dry-run", "help", "verbose"],
	string: ["asset", "jobs"],
	alias: {
		h: "help",
		j: "jobs",
		n: "dry-run",
		v: "verbose",
	},
});

const isCli = isDirectRun();

if (isCli && args.help) {
	console.log(HELP);
	process.exit(0);
}

/** @type {string[]} */
const assets = [...new Set(String(args.asset ?? "")
	.split(",")
	.map((name) => name.trim())
	.filter(Boolean))];

/**
 * @param {string} name
 * @returns {boolean}
 */
function isValidAssetName(name) {
	return name.length > 0
		&& !name.includes("/")
		&& !name.includes("\\")
		&& !name.includes("..");
}

const invalidAssets = assets.filter((name) => !isValidAssetName(name));
if (isCli && invalidAssets.length > 0) {
	console.error(`Invalid asset name(s): ${invalidAssets.join(", ")}`);
	process.exit(1);
}

if (isCli && assets.length === 0) {
	console.error("Missing --asset.\n");
	console.error(HELP);
	process.exit(1);
}

const rootAbs = path.resolve(process.cwd(), BASE_PATH);
const assetsRootAbs = path.join(rootAbs, "Assets");
const femaleRootAbs = path.join(assetsRootAbs, "Female3DCG");
const migratedAssetsRootAbs = path.join(assetsRootAbs, ASSETS_PAPERDOLL_DIR);
const legacyMigratedAssetsRootAbs = path.join(femaleRootAbs, ASSETS_PAPERDOLL_DIR);
const manifestRel = "Assets/Migration.json";
const manifestAbs = path.join(rootAbs, manifestRel);
const scriptReferenceFiles = ["index.html", "brawl.html", "Tools/Node/Common.js"];
const dryRun = !!args["dry-run"];
const verbose = !!args.verbose;
const jobs = Math.max(1, Number.parseInt(String(args.jobs ?? os.cpus().length), 10) || os.cpus().length);
const defaultPoseFolderByGroup = loadDefaultPoseFolderByGroup(rootAbs);
const expressionGroups = loadExpressionGroups(rootAbs);
const singletonAssetGroups = loadSingletonAssetGroups(rootAbs);
/** Assets that intentionally keep the legacy group-first layout. */
const nonMigratableAssets = new Set(["Icon"]);
/** Groups whose art should not be moved to the asset-first layout. */
const nonMigratableGroups = new Set(["Activity"]);
/** Body-style overrides that only restyle other assets. */
const nonMigratableBodyStyles = new Set(["EchoV1", "EchoV2", "Original"]);
/** Pronoun settings without standalone art. */
const nonMigratablePronouns = new Set(["SheHer", "HeHim", "TheyThem", "ItIt"]);

/** @type {{ relative: string, fileName: string, rootSegment: string }[] | null} */
let legacyPngIndex = null;

if (isCli) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}

/**
 * @typedef {'ready' | 'already_migrated' | 'no_moves' | 'no_legacy' | 'skipped'} AssetPlanStatus
 * @typedef {{ asset: string, moves: { source: string, destination: string }[], groups: string[], status: AssetPlanStatus, skipReason?: string }} AssetPlan
 * @typedef {{ version?: number, assets?: Record<string, { migratedAt?: string, groups?: string[] }> }} Manifest
 */

/**
 * @returns {Promise<void>}
 */
async function main() {
	const migratedRootSegments = loadMigratedRootSegments(manifestAbs);
	const plans = await mapWithConcurrency(assets, jobs, async (asset) => planAssetMigration(asset, migratedRootSegments));

	for (let i = 0; i < plans.length; i++) {
		if (i > 0) {
			console.log("");
		}
		reportPlan(plans[i]);
	}

	const readyPlans = plans.filter((plan) => plan.status === "ready");
	const noLegacyPlans = plans.filter((plan) => plan.status === "no_legacy");

	if (readyPlans.length === 0 || dryRun) {
		if (noLegacyPlans.length > 0 && readyPlans.length === 0) {
			console.error(`\nNo migratable assets found. ${noLegacyPlans.length} asset(s) had no legacy files.`);
			process.exit(1);
		}
		return;
	}

	const allMoves = readyPlans.flatMap((plan) => plan.moves);
	if (!validateGlobalMoves(allMoves)) {
		process.exit(1);
	}

	if (!(await executeMoves(allMoves))) {
		process.exit(1);
	}

	updateScriptReferencesBatch(readyPlans);
	removeEmptyDirectories(collectAllCleanupDirs(readyPlans));
	updateMigrationManifestBatch(manifestAbs, readyPlans);
	console.log(`Updated migration manifest: ${manifestRel}`);

	if (noLegacyPlans.length > 0) {
		console.error(`\nWarning: skipped ${noLegacyPlans.length} asset(s) with no legacy files: ${noLegacyPlans.map((plan) => plan.asset).join(", ")}`);
	}
}

/**
 * @param {string} asset
 * @returns {string | null}
 */
function getSkipReason(asset) {
	if (nonMigratableGroups.has(asset)) {
		return `${asset} is a non-migratable group`;
	}
	if (/^H\d{4}$/.test(asset)) {
		return `${asset} is a height modifier with no art files`;
	}
	if (nonMigratableBodyStyles.has(asset)) {
		return `${asset} is a body style override with no standalone art`;
	}
	if (nonMigratablePronouns.has(asset)) {
		return `${asset} is a pronoun setting with no art files`;
	}
	return null;
}

/**
 * @param {string} asset
 * @param {ReadonlySet<string>} migratedRootSegments
 * @returns {Promise<AssetPlan>}
 */
async function planAssetMigration(asset, migratedRootSegments) {
	const skipReason = getSkipReason(asset);
	if (skipReason) {
		return { asset, moves: [], groups: [], status: "skipped", skipReason };
	}
	if (nonMigratableAssets.has(asset)) {
		return { asset, moves: [], groups: [], status: "no_legacy" };
	}
	const candidates = collectLegacyAssetPaths(femaleRootAbs, asset, migratedRootSegments);
	/** @type {{ source: string, destination: string }[]} */
	const moves = [];
	/** @type {Map<string, string>} */
	const moveMap = new Map();
	/** @type {Set<string>} */
	const groups = new Set();

	for (const sourceRel of candidates) {
		const parsed = parseLegacyPath(sourceRel);
		if (!parsed) continue;
		const destinationRel = buildTargetPath(asset, parsed);
		if (destinationRel === sourceRel) continue;
		addMove(moves, moveMap, sourceRel, destinationRel);
		if (parsed.group) {
			groups.add(parsed.group);
		}
	}

	for (const move of await collectMigratedRootPaths(asset)) {
		addMove(moves, moveMap, move.source, move.destination);
		const parts = move.source.split("/");
		const paperDollPos = parts.indexOf(ASSETS_PAPERDOLL_DIR);
		const rootSegment = paperDollPos >= 0 ? parts[paperDollPos + 1] : null;
		if (rootSegment?.startsWith(`${asset}-`)) {
			groups.add(rootSegment.slice(asset.length + 1));
		}
	}

	for (const move of await collectMigratedPreviewPathMoves(asset)) {
		addMove(moves, moveMap, move.source, move.destination);
	}

	for (const group of await collectInventoryGroups(asset)) {
		groups.add(group);
	}

	if (fs.existsSync(manifestAbs)) {
		const manifest = JSON.parse(fs.readFileSync(manifestAbs, { encoding: "utf8" }));
		if (isManifest(manifest)) {
			for (const group of manifest.assets?.[asset]?.groups ?? []) {
				if (typeof group === "string") groups.add(group);
			}
		}
	}

	for (const move of await collectInventoryAssetMoves(asset, [...groups])) {
		addMove(moves, moveMap, move.source, move.destination);
	}

	const sortedGroups = [...groups].sort();
	if (moves.length === 0) {
		if (isAssetMigrated(manifestAbs, asset)) {
			return { asset, moves, groups: sortedGroups, status: "already_migrated" };
		}
		if (candidates.length === 0) {
			return { asset, moves, groups: sortedGroups, status: "no_legacy" };
		}
		return { asset, moves, groups: sortedGroups, status: "no_moves" };
	}

	return { asset, moves, groups: sortedGroups, status: "ready" };
}

/**
 * @param {AssetPlan} plan
 * @returns {void}
 */
function reportPlan(plan) {
	switch (plan.status) {
		case "skipped":
			console.log(`Skipping ${plan.asset}: ${plan.skipReason ?? "not migratable"}.`);
			break;
		case "already_migrated":
			console.log(`Asset ${plan.asset} is already migrated.`);
			break;
		case "no_moves":
			console.log(`No moves required for ${plan.asset}`);
			break;
		case "no_legacy":
			console.error(`No legacy files found for asset ${plan.asset}`);
			break;
		case "ready":
			console.log(`Asset: ${plan.asset}`);
			console.log(`Moves: ${plan.moves.length}`);
			if (verbose || dryRun) {
				for (const move of plan.moves) {
					console.log(`${move.source} -> ${move.destination}`);
				}
			}
			break;
	}
}

/**
 * @param {{ source: string, destination: string }[]} moves
 * @returns {boolean}
 */
function validateGlobalMoves(moves) {
	/** @type {Map<string, string>} */
	const sourceToDestination = new Map();
	/** @type {Set<string>} */
	const destinations = new Set();
	for (const move of moves) {
		if (sourceToDestination.has(move.source)) {
			console.error(`Duplicate source across assets: ${move.source}`);
			return false;
		}
		if (destinations.has(move.destination)) {
			console.error(`Duplicate destination across assets: ${move.destination}`);
			return false;
		}
		sourceToDestination.set(move.source, move.destination);
		destinations.add(move.destination);
	}
	return true;
}

/**
 * @param {AssetPlan[]} plans
 * @returns {string[]}
 */
function collectAllCleanupDirs(plans) {
	/** @type {Set<string>} */
	const dirs = new Set();
	for (const plan of plans) {
		for (const directory of [
			...collectInventoryCleanupDirs(plan.moves),
			...collectAssetCleanupDirs(plan.moves),
		]) {
			dirs.add(directory);
		}
	}
	return [...dirs].sort((a, b) => b.split("/").length - a.split("/").length || a.localeCompare(b));
}

/**
 * @returns {{ relative: string, fileName: string, rootSegment: string }[]}
 */
function getLegacyPngIndex() {
	if (legacyPngIndex) return legacyPngIndex;
	/** @type {{ relative: string, fileName: string, rootSegment: string }[]} */
	const out = [];
	/**
	 * @param {string} directory
	 * @returns {void}
	 */
	const visit = (directory) => {
		if (!fs.existsSync(directory)) return;
		for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
			const absolute = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				visit(absolute);
				continue;
			}
			if (!entry.name.endsWith(".png")) continue;
			const relative = path.relative(rootAbs, absolute).split(path.sep).join("/");
			if (!relative.startsWith("Assets/Female3DCG/") && !relative.startsWith(`Assets/${ASSETS_PAPERDOLL_DIR}/`)) continue;
			const parts = relative.split("/");
			const assetsPos = parts.indexOf("Assets");
			if (assetsPos < 0) continue;
			let rootPos = assetsPos + 1;
			if (parts[rootPos] === ASSETS_PAPERDOLL_DIR) {
				rootPos++;
			} else if (parts[rootPos] === "Female3DCG" && parts[rootPos + 1] === ASSETS_PAPERDOLL_DIR) {
				rootPos += 2;
			}
			out.push({
				relative,
				fileName: entry.name,
				rootSegment: parts[rootPos] ?? "",
			});
		}
	};
	visit(femaleRootAbs);
	visit(migratedAssetsRootAbs);
	visit(legacyMigratedAssetsRootAbs);
	legacyPngIndex = out;
	return legacyPngIndex;
}

/**
 * @param {string} root
 * @param {string} asset
 * @param {ReadonlySet<string>} migratedRootSegments
 * @returns {string[]}
 */
function collectLegacyAssetPaths(root, asset, migratedRootSegments) {
	const prefix = `${asset}_`;
	return getLegacyPngIndex()
		.filter((entry) => {
			if (nonMigratableAssets.has(asset)) return false;
			if (nonMigratableGroups.has(entry.rootSegment)) return false;
			if (entry.fileName !== `${asset}.png` && !entry.fileName.startsWith(prefix)) return false;
			if (migratedRootSegments.has(entry.rootSegment)) return false;
			if (entry.rootSegment.startsWith(`${asset}-`)) return false;
			if (entry.rootSegment === asset) {
				// Singleton assets still live under a group folder named after the asset.
				return entry.fileName === `${asset}.png`;
			}
			const parts = entry.relative.split("/");
			const femalePos = parts.indexOf("Female3DCG");
			return !(entry.rootSegment === "Override" && parts[femalePos + 3] === asset);
		})
		.map((entry) => entry.relative)
		.sort();
}

/**
 * @returns {{ name: string, abs: string }[]}
 */
function listMigratedAssetDirs() {
	/** @type {{ name: string, abs: string }[]} */
	const dirs = [];
	/**
	 * @param {string} parentAbs
	 * @returns {void}
	 */
	const collect = (parentAbs) => {
		if (!fs.existsSync(parentAbs)) return;
		for (const entry of fs.readdirSync(parentAbs, { withFileTypes: true })) {
			if (!entry.isDirectory() || !entry.name.includes("-")) continue;
			dirs.push({ name: entry.name, abs: path.join(parentAbs, entry.name) });
		}
	};
	collect(migratedAssetsRootAbs);
	collect(legacyMigratedAssetsRootAbs);
	return dirs;
}

/**
 * @template T, R
 * @param {readonly T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
async function mapWithConcurrency(items, concurrency, worker) {
	if (items.length === 0) return [];
	const results = new Array(items.length);
	const limit = Math.max(1, Math.min(concurrency, items.length));
	let nextIndex = 0;
	/**
	 * @returns {Promise<void>}
	 */
	const runWorker = async () => {
		while (true) {
			const index = nextIndex++;
			if (index >= items.length) return;
			results[index] = await worker(items[index], index);
		}
	};
	await Promise.all(Array.from({ length: limit }, runWorker));
	return results;
}

/**
 * @param {{ source: string, destination: string }[]} moves
 * @returns {Promise<boolean>}
 */
async function executeMoves(moves) {
	/** @type {string | null} */
	let validationError = null;
	await mapWithConcurrency(moves, jobs, async (move) => {
		if (validationError) return;
		const sourceAbs = path.join(rootAbs, move.source);
		const destinationAbs = path.join(rootAbs, move.destination);
		if (!fs.existsSync(sourceAbs)) {
			validationError = `Missing source file: ${move.source}`;
			return;
		}
		if (sourceAbs !== destinationAbs && fs.existsSync(destinationAbs)) {
			validationError = `Destination already exists: ${move.destination}`;
		}
	});
	if (validationError) {
		console.error(validationError);
		return false;
	}

	const destinationDirs = [...new Set(moves.map((move) => path.dirname(path.join(rootAbs, move.destination))))];
	await mapWithConcurrency(destinationDirs, jobs, async (destinationDir) => {
		await fsPromises.mkdir(destinationDir, { recursive: true });
	});

	/** @type {string | null} */
	let moveError = null;
	await mapWithConcurrency(moves, jobs, async (move) => {
		if (moveError) return;
		const sourceAbs = path.join(rootAbs, move.source);
		const destinationAbs = path.join(rootAbs, move.destination);
		try {
			await fsPromises.rename(sourceAbs, destinationAbs);
		} catch (error) {
			moveError = `Failed to move ${move.source} -> ${move.destination}: ${error instanceof Error ? error.message : String(error)}`;
		}
	});
	if (moveError) {
		console.error(moveError);
		return false;
	}
	return true;
}

/**
 * @param {string} manifestPath
 * @returns {ReadonlySet<string>}
 */
function loadMigratedRootSegments(manifestPath) {
	if (!fs.existsSync(manifestPath)) return new Set();
	try {
		const parsed = JSON.parse(fs.readFileSync(manifestPath, { encoding: "utf8" }));
		if (!isManifest(parsed) || !parsed.assets) return new Set();
		/** @type {Set<string>} */
		const segments = new Set();
		for (const [assetName, entry] of Object.entries(parsed.assets)) {
			for (const group of entry.groups ?? []) {
				segments.add(`${assetName}-${group}`);
			}
		}
		return segments;
	} catch {
		return new Set();
	}
}

/**
 * @param {string} asset
 * @returns {Promise<{ source: string, destination: string }[]>}
 */
async function collectMigratedRootPaths(asset) {
	/** @type {{ source: string, destination: string }[]} */
	const moves = [];
	for (const { name, abs } of listMigratedAssetDirs()) {
		if (!name.startsWith(`${asset}-`)) continue;
		const group = name.slice(asset.length + 1);
		const defaultPose = defaultFolderForGroup(group);
		if (!defaultPose) continue;
		collectRootPngMoves(path.join(abs, ""), female3DCGMigratedFolderRel(name), defaultPose, asset, moves);
		const overrideAbs = path.join(abs, "Override");
		if (fs.existsSync(overrideAbs)) {
			for (const styleEntry of await fsPromises.readdir(overrideAbs, { withFileTypes: true })) {
				if (!styleEntry.isDirectory()) continue;
				collectRootPngMoves(
					path.join(overrideAbs, styleEntry.name),
					female3DCGMigratedFolderRel(name, "Override", styleEntry.name),
					defaultPose,
					asset,
					moves,
				);
			}
		}
	}
	return moves.sort((a, b) => a.source.localeCompare(b.source));
}

/**
 * @param {{ source: string, destination: string }[]} moves
 * @param {Map<string, string>} moveMap
 * @param {string} source
 * @param {string} destination
 * @returns {void}
 */
function addMove(moves, moveMap, source, destination) {
	const knownDestination = moveMap.get(source);
	if (knownDestination) {
		if (knownDestination !== destination) {
			throw new Error(`Conflicting destination for "${source}": "${knownDestination}" vs "${destination}"`);
		}
		return;
	}
	moveMap.set(source, destination);
	moves.push({ source, destination });
}

/**
 * @param {string} asset
 * @returns {Promise<{ source: string, destination: string }[]>}
 */
async function collectMigratedPreviewPathMoves(asset) {
	/** @type {{ source: string, destination: string }[]} */
	const moves = [];
	for (const { name, abs } of listMigratedAssetDirs()) {
		if (!name.startsWith(`${asset}-`)) continue;
		const assetRootRel = female3DCGMigratedFolderRel(name);
		const assetRootAbs = abs;
		await collectFileMoves(
			path.join(assetRootAbs, "Preview"),
			(relativePath) => `${assetRootRel}/Previews/${relativePath}`,
			moves,
		);
		const overrideAbs = path.join(assetRootAbs, "Override");
		if (!fs.existsSync(overrideAbs)) continue;
		for (const styleEntry of await fsPromises.readdir(overrideAbs, { withFileTypes: true })) {
			if (!styleEntry.isDirectory()) continue;
			const styleRootAbs = path.join(overrideAbs, styleEntry.name);
			const styleRootRel = `${assetRootRel}/Override/${styleEntry.name}`;
			await collectFileMoves(
				path.join(styleRootAbs, "Preview"),
				(relativePath) => `${styleRootRel}/Previews/${relativePath}`,
				moves,
			);
		}
	}
	return moves.sort((a, b) => a.source.localeCompare(b.source));
}

/**
 * @param {string} asset
 * @param {string[]} groups
 * @returns {Promise<{ source: string, destination: string }[]>}
 */
async function collectInventoryAssetMoves(asset, groups) {
	/** @type {{ source: string, destination: string }[]} */
	const moves = [];
	for (const group of groups) {
		if (nonMigratableGroups.has(group)) continue;
		const sourceDirRel = `Screens/Inventory/${group}/${asset}`;
		const sourceDirAbs = path.join(rootAbs, sourceDirRel);
		if (!fs.existsSync(sourceDirAbs)) continue;
		const targetRootRel = female3DCGMigratedFolderRel(`${asset}-${group}`);
		await collectFileMoves(sourceDirAbs, (relativePath) => {
			return relativePath.endsWith(".png")
				? `${targetRootRel}/Previews/${relativePath}`
				: `${targetRootRel}/${relativePath}`;
		}, moves);
	}
	return moves.sort((a, b) => a.source.localeCompare(b.source));
}

/**
 * @param {string} asset
 * @returns {Promise<string[]>}
 */
async function collectInventoryGroups(asset) {
	const inventoryRootAbs = path.join(rootAbs, "Screens", "Inventory");
	if (!fs.existsSync(inventoryRootAbs)) return [];
	/** @type {string[]} */
	const groups = [];
	for (const groupEntry of await fsPromises.readdir(inventoryRootAbs, { withFileTypes: true })) {
		if (!groupEntry.isDirectory()) continue;
		if (singletonAssetGroups.has(groupEntry.name) && asset !== groupEntry.name) continue;
		const candidateDir = path.join(inventoryRootAbs, groupEntry.name, asset);
		if (fs.existsSync(candidateDir) && fs.statSync(candidateDir).isDirectory()) {
			groups.push(groupEntry.name);
		}
	}
	return groups.sort();
}

/**
 * @param {{ source: string, destination: string }[]} moves
 * @returns {string[]}
 */
function collectInventoryCleanupDirs(moves) {
	return collectCleanupDirsForPrefix(moves, "Screens/Inventory/");
}

/**
 * @param {{ source: string, destination: string }[]} moves
 * @returns {string[]}
 */
function collectAssetCleanupDirs(moves) {
	return [
		...collectCleanupDirsForPrefix(moves, "Assets/Female3DCG/"),
		...collectCleanupDirsForPrefix(moves, `Assets/${ASSETS_PAPERDOLL_DIR}/`),
	];
}

/**
 * @param {{ source: string, destination: string }[]} moves
 * @param {string} prefix
 * @returns {string[]}
 */
function collectCleanupDirsForPrefix(moves, prefix) {
	/** @type {Set<string>} */
	const dirs = new Set();
	for (const move of moves) {
		if (!move.source.startsWith(prefix)) continue;
		let directory = path.posix.dirname(move.source);
		while (directory.startsWith(prefix)) {
			dirs.add(directory);
			directory = path.posix.dirname(directory);
		}
	}
	return [...dirs].sort((a, b) => b.split("/").length - a.split("/").length || a.localeCompare(b));
}

/**
 * @param {string[]} directoriesRel
 * @returns {void}
 */
function removeEmptyDirectories(directoriesRel) {
	for (const directoryRel of directoriesRel) {
		const directoryAbs = path.join(rootAbs, directoryRel);
		if (!fs.existsSync(directoryAbs)) continue;
		let entries;
		try {
			entries = fs.readdirSync(directoryAbs);
		} catch {
			continue;
		}
		if (entries.length > 0) continue;
		fs.rmdirSync(directoryAbs);
		if (verbose) {
			console.log(`Removed empty directory: ${directoryRel}`);
		}
	}
}

/**
 * @param {string} sourceRootAbs
 * @param {(relativePath: string) => string} destinationFn
 * @param {{ source: string, destination: string }[]} moves
 * @returns {Promise<void>}
 */
async function collectFileMoves(sourceRootAbs, destinationFn, moves) {
	if (!fs.existsSync(sourceRootAbs)) return;
	/**
	 * @param {string} directoryAbs
	 * @returns {Promise<void>}
	 */
	const visit = async (directoryAbs) => {
		for (const entry of await fsPromises.readdir(directoryAbs, { withFileTypes: true })) {
			const entryAbs = path.join(directoryAbs, entry.name);
			if (entry.isDirectory()) {
				await visit(entryAbs);
				continue;
			}
			const sourceRel = path.relative(rootAbs, entryAbs).split(path.sep).join("/");
			const relativePath = path.relative(sourceRootAbs, entryAbs).split(path.sep).join("/");
			const destinationRel = destinationFn(relativePath);
			moves.push({ source: sourceRel, destination: destinationRel });
		}
	};
	await visit(sourceRootAbs);
}

/**
 * @param {string} directoryAbs
 * @param {string} directoryRel
 * @param {string} defaultPose
 * @param {string} asset
 * @param {{ source: string, destination: string }[]} moves
 * @returns {void}
 */
function collectRootPngMoves(directoryAbs, directoryRel, defaultPose, asset, moves) {
	if (!fs.existsSync(directoryAbs)) return;
	const prefix = `${asset}_`;
	for (const entry of fs.readdirSync(directoryAbs, { withFileTypes: true })) {
		if (!entry.isFile() || !entry.name.endsWith(".png")) continue;
		const sourceRel = `${directoryRel}/${entry.name}`;
		const fileName = entry.name.startsWith(prefix) ? entry.name.slice(prefix.length) : entry.name;
		const destinationRel = `${directoryRel}/${defaultPose}/${fileName}`;
		if (sourceRel === destinationRel) continue;
		moves.push({ source: sourceRel, destination: destinationRel });
	}
}

/**
 * @param {string} sourceRel
 * @returns {null | { style: string | null, group: string, between: string[], fileName: string, isPreview: boolean }}
 */
function parseLegacyPath(sourceRel) {
	const parts = sourceRel.split("/");
	const femalePos = parts.indexOf("Female3DCG");
	if (femalePos < 0) return null;
	let pos = femalePos + 1;
	const hasOverride = parts[pos] === "Override";
	const style = hasOverride ? (parts[pos + 1] ?? null) : null;
	if (hasOverride) {
		pos += 2;
	}
	const group = parts[pos];
	const fileName = parts[parts.length - 1];
	if (!group || !fileName) return null;
	const between = parts.slice(pos + 1, parts.length - 1);
	return { style, group, between, fileName, isPreview: between.includes("Preview") || between.includes("Previews") };
}

/**
 * Pose folder for body-parented groups, or `Default` for expression groups.
 * @param {string} group
 * @returns {string | null}
 */
function defaultFolderForGroup(group) {
	return defaultPoseFolderByGroup[group] ?? (expressionGroups.has(group) ? "Default" : null);
}

/**
 * @param {string} asset
 * @param {{ style: string | null, group: string, between: string[], fileName: string, isPreview: boolean }} parsed
 * @returns {string}
 */
function buildTargetPath(asset, parsed) {
	const defaultFolder = defaultFolderForGroup(parsed.group);
	const between = parsed.between.length > 0
		? parsed.between
		: defaultFolder ? [defaultFolder] : [];

	const fileName = parsed.isPreview || !parsed.fileName.startsWith(`${asset}_`)
		? parsed.fileName
		: parsed.fileName.slice(asset.length + 1);

	return [
		"Assets",
		ASSETS_PAPERDOLL_DIR,
		`${asset}-${parsed.group}`,
		...(parsed.style ? ["Override", parsed.style] : []),
		...(parsed.isPreview ? ["Previews"] : between),
		fileName,
	].join("/");
}

/**
 * @param {AssetPlan[]} plans
 * @returns {void}
 */
function updateScriptReferencesBatch(plans) {
	for (const fileRel of scriptReferenceFiles) {
		const fileAbs = path.join(rootAbs, fileRel);
		if (!fs.existsSync(fileAbs)) continue;
		let contents = fs.readFileSync(fileAbs, { encoding: "utf8" });
		/** @type {string[]} */
		const changedAssets = [];
		for (const plan of plans) {
			/** @type {[from: string, to: string][]} */
			const rewrites = plan.moves
				.filter((move) => move.source.startsWith("Screens/Inventory/") && move.source.endsWith(".js"))
				.map((move) => [move.source, move.destination]);
			let changed = false;
			for (const [from, to] of rewrites) {
				if (!contents.includes(from)) continue;
				contents = contents.split(from).join(to);
				changed = true;
			}
			if (changed) {
				changedAssets.push(plan.asset);
			}
		}
		if (changedAssets.length > 0) {
			fs.writeFileSync(fileAbs, contents);
			console.log(`Updated script references for ${changedAssets.join(", ")} in ${fileRel}`);
		}
	}
}

/**
 * @param {string} manifestPath
 * @param {string} asset
 * @returns {boolean}
 */
function isAssetMigrated(manifestPath, asset) {
	if (!fs.existsSync(manifestPath)) return false;
	try {
		const parsed = JSON.parse(fs.readFileSync(manifestPath, { encoding: "utf8" }));
		return isManifest(parsed) && !!parsed.assets && asset in parsed.assets;
	} catch {
		return false;
	}
}

/**
 * @param {string} manifestPath
 * @param {AssetPlan[]} plans
 * @returns {void}
 */
function updateMigrationManifestBatch(manifestPath, plans) {
	/** @type {Manifest} */
	let manifest = { version: 1, assets: {} };
	if (fs.existsSync(manifestPath)) {
		const parsed = JSON.parse(fs.readFileSync(manifestPath, { encoding: "utf8" }));
		if (isManifest(parsed)) manifest = parsed;
	}
	if (!manifest.assets) manifest.assets = {};
	manifest.version = Number(manifest.version) || 1;
	const migratedAt = new Date().toISOString();
	for (const plan of plans) {
		manifest.assets[plan.asset] = { migratedAt, groups: plan.groups };
	}
	fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t") + "\n");
}

