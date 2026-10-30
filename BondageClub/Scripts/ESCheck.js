"use strict";

/**
 * See {@link ESCheckEntries}
 * @typedef {2020 | 2021 | 2022 | 2023 | 2024 | 2025} ESVersions
 */

// Use Map as, contrary to plain objects, it guarantees that iteration order follows insertion order
/**
 * ES versions and {@link eval} code strings for verifying support for its features
 * @type {Map<ESVersions, Record<string, string>>}
 */
var ESCheckEntries = new Map(/** @type {[ESVersions, Record<string, string>][]} */([
	[
		2020,
		{
			["?. operator"]: "({})?.foo",
			["?? operator"]: "null ?? null",
			["??= operator"]: "let foo = null; foo ??= null;",
			["globalThis object"]: "globalThis",
			["String.matchAll()"]: "'foo'.matchAll('foo')",
			["Promise.allSettled()"]: "Promise.allSettled([null])",
		},
	],
	[
		2021,
		{
			["String.replaceAll()"]: "'1'.replaceAll('1', '2')",
			["Numeric Separator"]: "100_00",
			["Promise.any()"]: "Promise.any([null])",
		},
	],
	[
		2022,
		{
			["Array.at()"]: "[1].at(0)",
			["String.at()"]: "'1'.at(0)",
			["Class field declarations"]: "class Foo { bar = 1; }",
			["Private methods and fields"]: "class Foo { #bar = 1; }",
			["error.cause"]: "new Error().cause",
			["Object.hasOwn()"]: "Object.hasOwn({}, 'foo')",
		},
	],
	[
		2023,
		{
			["Array.findLast()"]: "[1].findLast(i => i === 1)",
			["Array.findLastIndex()"]: "[1].findLastIndex(i => i === 1)",
			["Array.toReversed()"]: "[1].toReversed()",
			["Array.toSorted()"]: "[1].toSorted()",
			["Array.toSpliced()"]: "[1].toSpliced(0, 1)",
			["Array.with()"]: "[1].with(0, 2)",
		},
	],
	[
		2024,
		{
			["Object.groupBy()"]: "Object.groupBy([{ foo: 1 }], () => 'bar')",
			["Map.groupBy()"]: "Map.groupBy([{ foo: 1 }], () => 'bar')",
			["String isWellFormed()"]: "'foo'.isWellFormed()",
			["String.toWellFormed()"]: "'foo'.toWellFormed()",
			["Promise.withResolvers()"]: " Promise.withResolvers()",
		},
	],
	[
		2025,
		{
			["RegExp /v flag"]: "/foo/v",
			["RegExp.escape()"]: "RegExp.escape('foo')",
			["Float16Array"]: "new Float16Array()",
			["Math.f16round()"]: "Math.f16round(1)",
			["Promise.try()"]: "Promise.try(() => undefined)",

			// New Set Features
			["Set.union()"]: "const a = new Set([1]); const b = new Set([2]); a.union(b)",
			["Set.intersection()"]: "const a = new Set([1]); const b = new Set([2]); a.intersection(b)",
			["Set.difference()"]: "const a = new Set([1]); const b = new Set([2]); a.difference(b)",
			["Set.symmetricDifference()"]: "const a = new Set([1]); const b = new Set([2]); a.symmetricDifference(b)",
			["Set.isSubsetOf()"]: "const a = new Set([1]); const b = new Set([2]); a.isSubsetOf(b)",
			["Set.isSupersetOf()"]: "const a = new Set([1]); const b = new Set([2]); a.isSupersetOf(b)",
			["Set.isDisjointFrom()"]: "const a = new Set([1]); const b = new Set([2]); a.isDisjointFrom(b)",

			// New Iterator Helpers
			["Iterator.drop()"]: "const a = [1, 2, 3].values(); a.drop(1)",
			["Iterator.every()"]: "const a = [1, 2, 3].values(); a.every(i => i === 1)",
			["Iterator.some()"]: "const a = [1, 2, 3].values(); a.some(i => i === 1)",
			["Iterator.filter()"]: "const a = [1, 2, 3].values(); a.filter(i => i === 1)",
			["Iterator.find()"]: "const a = [1, 2, 3].values(); a.find(i => i === 1)",
			["Iterator.flatMap()"]: "const a = [1, 2, 3].values(); a.flatMap(i => [1, 2])",
			["Iterator.forEach()"]: "const a = [1, 2, 3].values(); a.forEach(i => undefined)",
			["Iterator.map()"]: "const a = [1, 2, 3].values(); a.map(i => i)",
			["Iterator.reduce()"]: "const a = [1, 2, 3].values(); a.reduce((i, j) => i + j)",
			["Iterator.take()"]: "const a = [1, 2, 3].values(); a.take(1)",
			["Iterator.from()"]: "Iterator.from([1, 2, 3])",
		},
	],
]));

/**
 * Check if the player's browser supports up to and including the provided ES version
 * @param {ESVersions} minVersion
 */
function ESCheck(minVersion) {
	for (const [version, entries] of ESCheckEntries.entries()) {
		if (version > minVersion) {
			break;
		}

		/** @type {string[]} */
		const errs = [];
		/** @type {unknown} */
		let errCause = undefined;
		for (const [name, evalContent] of Object.entries(entries)) {
			try {
				// eslint-disable-next-line no-eval
				eval(evalContent);
			} catch (error) {
				errCause ??= error;
				errs.push(name);
			}
		}
		if (errs.length) {
			const missingFeatures = errs.map(i => `    * ${i}`).join("\n");
			const err = `Outdated browser error.\nIf you see this message, it means that your browser lacks ES${version} support and will not be working in Bondage Club.\nMissing features:\n${missingFeatures}`;
			window.alert(err);
			window.stop();
			throw new Error(err, { cause: errCause });
		}
	}
	console.log(`Successfully verified ES${minVersion} browser support`);
}

ESCheck(2022);
