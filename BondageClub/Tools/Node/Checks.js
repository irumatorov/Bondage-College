import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
	colorizeOutput,
	formatDivider,
	formatFailureHeading,
	formatRunningHeader,
	formatStatusLine,
	formatSummaryCounts,
	formatWarningHeading,
	outputHasWarnings,
} from "./ChecksFormat.js";

// #region Configuration

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");

const CHEAP_CHECKS = /** @type {const} */([
	"tools:typecheck",
	"assets:check",
	"assets:prettier",
	"assets:eslint",
	"scripts:typecheck",
	"scripts:lint",
	"files:case",
	"files:csvtypescript",
	"test",
	"tests:lint",
]);

const FULL_CHECKS = /** @type {const} */([
	...CHEAP_CHECKS,
	"scripts:typecheck-expensive",
	"styles:prettier",
]);

/** @typedef {typeof FULL_CHECKS[number]} CheckName */
/** @typedef {{ name: CheckName, code: number, output: string, duration?: number }} CheckResult */

// #endregion

// #region Check execution

/**
 * Creates a child process, buffering the output and resolving with the result.
 * @param {CheckName} name
 * @returns {Promise<CheckResult>}
 */
function runCheck(name) {
	return new Promise((resolve) => {
		/** @type {string[]} */
		const output = [];
		const npmExecPath = process.env.npm_execpath;
		const useNodeForNpm = typeof npmExecPath === "string" && /\.m?js$/i.test(npmExecPath);
		const command = useNodeForNpm ? process.execPath : "npm";
		/** @type {string[]} */
		const args = useNodeForNpm
			? [npmExecPath, "run", "--silent", name]
			: ["run", "--silent", name];

		/** @type {(chunk: string) => (number | undefined)} */
		let onData = (chunk) => output.push(chunk);
		/** @type {(code?: number) => void} */
		let onClose = (code) => {
			resolve({
				name,
				code: code ?? 1,
				output: output.join("").trimEnd(),
				duration: performance.now() - startTime,
			});
		};
		/** @type {(err: unknown) => void} */
		const onError = (err) => {
			resolve({
				name,
				code: 1,
				output: String(err),
				duration: performance.now() - startTime,
			});
		};

		const env = { ...process.env };
		switch (name) {
			case "files:csvtypescript": {
				// Filter and _only_ look at `csvtypescript_tmp_output`-related content
				const textKeys = /'TextKeys([a-zA-Z0-9_]+)'/;
				onData = (chunk) => chunk.includes("csvtypescript_tmp_output") || textKeys.test(chunk) ? output.push(chunk) : undefined;
				onClose = () => {
					resolve({
						name,
						code: output.length === 0 ? 0 : 1,
						output: output.join("").trimEnd(),
						duration: performance.now() - startTime,
					});
				};
				break;
			}
		}

		const startTime = performance.now();
		const child = spawn(command, args, {
			cwd: ROOT,
			env,
			stdio: ["ignore", "pipe", "pipe"],
		});

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", onData);
		child.stderr.on("data", onData);
		child.on("close", onClose);
		child.on("error", onError);
	});
}

/**
 * Runs all checks in parallel and returns the results.
 * @param {readonly CheckName[]} names
 * @returns {Promise<CheckResult[]>}
 */
async function runChecks(names) {
	/** @type {Map<string, CheckResult>} */
	const resultsByName = new Map();

	await Promise.all(
		names.map(async (name) => {
			resultsByName.set(name, await runCheck(name));
		}),
	);

	return names.map((name) => resultsByName.get(name) ?? {
		name,
		code: 1,
		output: "Check did not run",
	});
}

// #endregion

// #region Console output

/**
 * Prints the failure output for a check result.
 * @param {CheckResult} result
 */
function printFailureOutput(result) {
	console.log("\u200B");
	console.log(formatFailureHeading(result.name));
	console.log(colorizeOutput(result.output));
}

/**
 * Prints the warning output for a check that passed but reported warnings.
 * @param {CheckResult} result
 */
function printWarningOutput(result) {
	console.log("\u200B");
	console.log(formatWarningHeading(result.name));
	console.log(colorizeOutput(result.output));
}

/**
 * Prints the summary of the check results.
 * @param {readonly CheckResult[]} results
 */
function printSummary(results) {
	const failed = results.filter((result) => result.code !== 0);
	const passed = results.length - failed.length;

	console.log("\u200B");
	console.log(formatDivider());
	console.log(formatSummaryCounts(passed, failed.length));
	console.log("\u200B");

	for (const result of results) {
		console.log(formatStatusLine(result));
	}

	console.log(formatDivider());
}

// #endregion

// #region Entry point

/**
 * @param {readonly CheckName[]} names
 * @param {boolean} silent
 * @returns {Promise<number>}
 */
async function main(names, silent) {
	if (!silent) {
		console.log(formatRunningHeader(names.length));
	}

	const results = await runChecks(names);

	for (const result of results) {
		if (result.code !== 0) {
			printFailureOutput(result);
		} else if (outputHasWarnings(result.output)) {
			printWarningOutput(result);
		}
	}

	if (!silent) {
		printSummary(results);
	}

	return results.some((result) => result.code !== 0) ? 1 : 0;
}

const cheap = process.argv.includes("--cheap") || process.argv.includes("-c");
const isSilent = process.argv.includes("--silent") || process.argv.includes("-s");
process.exitCode = await main(cheap ? CHEAP_CHECKS : FULL_CHECKS, isSilent);

// #endregion
