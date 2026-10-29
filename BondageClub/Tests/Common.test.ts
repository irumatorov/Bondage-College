import { Game } from "./Utils";

Game.load("../Scripts/Common.js");

Game.load("../Scripts/Drawing.js"); // DrawingResizeMode
Game.load("../Scripts/Server.js"); // ServerAccountEmailRegex

Game.PreferenceCensoredWordsList = [];

describe("CommonIsNumeric", () => {
	it("should return true for string of digits", () => {
		expect(Game.CommonIsNumeric("123")).toBe(true);
	});

	it("should return false for non-numeric string", () => {
		expect(Game.CommonIsNumeric("abc")).toBe(false);
	});

	it("should return true for number", () => {
		expect(Game.CommonIsNumeric(123)).toBe(true);
	});

	it("should return false for null value", () => {
		expect(Game.CommonIsNumeric(null)).toBe(false);
	});
});

describe("CommonParseInt", () => {
	it("should return 123 for string of digits", () => {
		expect(Game.CommonParseInt("123")).toBe(123);
	});

	it("should return -123 for number with negative sign", () => {
		expect(Game.CommonParseInt("-123")).toBe(-123);
	});

	it("should return null for non-numeric string", () => {
		expect(Game.CommonParseInt("abc")).toBe(null);
	});

	it("should return 123 for number", () => {
		expect(Game.CommonParseInt(123)).toBe(123);
	});

	it("should return 1 for number with radix 2", () => {
		expect(Game.CommonParseInt(123, 2)).toBe(1);
	});

	it("should return null for null value", () => {
		expect(Game.CommonParseInt(null)).toBe(null);
	});
});

describe("CommonParseCSV", () => {
	it("parses comma-separated values", () => {
		expect(Game.CommonParseCSV("hello,world\n")).toEqual([["hello", "world"]]);
	});

	it("parses multi-line csv", () => {
		expect(Game.CommonParseCSV("hello,world\nand,more\nor,less\n")).toEqual([
			["hello", "world"],
			["and", "more"],
			["or", "less"],
		]);
	});
});

describe("CommonDynamicFunction", () => {
	// I do not bother resolving this because it seems that these functions are like rusty bolts; no one likes to touch them
	xit("should return true for function that exists", () => {
		expect(Game.CommonDynamicFunction("CommonNoop()", Game)).toBe(true);
	});

	xit("should return false for function that doesn't exist", () => {
		expect(Game.CommonDynamicFunction("CommonImaginaryFunction()", Game)).toBe(false);
	});
});

// I don't bother fixing this test at the moment
describe("CommonDynamicFunctionParams", () => {
	xit("should return true for function that exists which has parameters", () => {
		expect(Game.CommonDynamicFunction(`CommonDynamicFunctionParams("CommonIsColor('#FF5733')")`, Game)).toBe(true);
	});
});

describe("CommonSetScreen", () => {
	// Test is currently disabled
	// it("should change the screen to InformationSheet", () => {
	// Game.CommonSetScreen("Character", "InformationSheet");
	// expect(Game.CurrentScreen).toBe("InformationSheet");
	// });
});

// CommonIsColor
describe("CommonIsColor", () => {
	it("should return true for 6 digit hex color", () => {
		expect(Game.CommonIsColor("#FF5733", { allowAlpha: true })).toBe(true);
	});

	it("should return true for 3 digit hex color", () => {
		expect(Game.CommonIsColor("#F53", { allowAlpha: true })).toBe(true);
	});

	it("should return true for RGBA hex color", () => {
		expect(Game.CommonIsColor("#FF57330A", { allowAlpha: true })).toBe(true);
	});

	it("should return false for invalid hex color", () => {
		expect(Game.CommonIsColor("white", { allowAlpha: true })).toBe(false);
	});
});

describe("CommonEmailIsValid", () => {
	it("should return false for invalid email", () => {
		expect(Game.CommonEmailIsValid("hello")).toBe(false);
	});

	it("should return true for valid email", () => {
		expect(Game.CommonEmailIsValid("hello@world.com")).toBe(true);
	});

	it("should return false for empty string", () => {
		expect(Game.CommonEmailIsValid("")).toBe(false);
	});

	it("should return false for null value", () => {
		expect(Game.CommonEmailIsValid(null)).toBe(false);
	});
});

describe("CommonRemoveItemFromList", () => {
	it("should remove item at valid index and return it", () => {
		const arr = [1, 2, 3, 4, 5];
		const result = Game.CommonRemoveItemFromList(arr, 2);
		expect(result).toBe(3);
		expect(arr).toEqual([1, 2, 4, 5]);
	});

	it("should not modify array and return undefined for invalid index", () => {
		const arr = [1, 2, 3, 4, 5];
		const result = Game.CommonRemoveItemFromList(arr, 10);
		expect(result).toBeUndefined();
		expect(arr).toEqual([1, 2, 3, 4, 5]);
	});

	it("should return undefined for empty array", () => {
		const arr: unknown[] = [];
		const result = Game.CommonRemoveItemFromList(arr, 0);
		expect(result).toBeUndefined();
		expect(arr).toEqual([]);
	});
});

describe("CommonRemoveRandomItemFromList", () => {
	it("should remove and return the only item from a single-element array", () => {
		const arr = [1];
		const result = Game.CommonRemoveRandomItemFromList(arr);
		expect(result).toBe(1);
		expect(arr).toEqual([]);
	});

	it("should return undefined for empty array and not change it", () => {
		const arr: unknown[] = [];
		const result = Game.CommonRemoveRandomItemFromList(arr);
		expect(result).toBeUndefined();
		expect(arr).toEqual([]);
	});
});

describe("CommonConvertStringToArray", () => {
	// this function is named ConvertStringToArray but it only handles numbers?
	it("converts comma-separated numeric string to array of numbers", () => {
		expect(Game.CommonConvertStringToArray("13,15")).toEqual([13, 15]);
	});

	it("filters out non-numeric values", () => {
		expect(Game.CommonConvertStringToArray("nan,123,2e")).toEqual([123]);
	});
});

describe("CommonArraysEqual", () => {
	it("returns true for equal arrays", () => {
		expect(Game.CommonArraysEqual([13, 15], [13, 15])).toBe(true);
	});

	it("returns false for nested arrays (not deep)", () => {
		expect(Game.CommonArraysEqual([13, [23]], [13, [23]])).toBe(false);
	});

	it("returns false for different arrays", () => {
		expect(Game.CommonArraysEqual([13, 15], [13, 16])).toBe(false);
	});

	it("returns false for different array types", () => {
		expect(Game.CommonArraysEqual([13, 15], new Set([13, 15]))).toBe(false);
	});
});

describe("CommonDeepEqual", () => {
	it("returns true for deeply equal arrays", () => {
		expect(Game.CommonDeepEqual([13, [15, [23]]], [13, [15, [23]]])).toBe(true);
	});

	it("returns false for different nested arrays", () => {
		expect(Game.CommonDeepEqual([13, [15, [23]]], [13, [15, [24]]])).toBe(false);
	});

	it("returns false for structurally different arrays", () => {
		expect(Game.CommonDeepEqual([13, [15, [23]]], [13, [15, 23]])).toBe(false);
	});
});

describe("CommonDeepIsSubset", () => {
	it("returns true for identical numbers", () => {
		expect(Game.CommonDeepIsSubset(1, 1)).toBe(true);
	});

	it("returns false for different strings", () => {
		expect(Game.CommonDeepIsSubset("a", "b")).toBe(false);
	});

	it("returns true for null equality", () => {
		expect(Game.CommonDeepIsSubset(null, null)).toBe(true);
	});

	it("returns true for subset object (fewer keys)", () => {
		expect(Game.CommonDeepIsSubset({ a: 1 }, { a: 1, b: 2 })).toBe(true);
	});

	it("returns false for object with key not in super", () => {
		expect(Game.CommonDeepIsSubset({ a: 1, c: 3 }, { a: 1, b: 2 })).toBe(false);
	});

	it("returns true for nested subset object", () => {
		expect(Game.CommonDeepIsSubset({ user: { id: 1 } }, { user: { id: 1, name: "Alice" }, status: "ok" })).toBe(true);
	});

	it("returns true for array subset (order-independent)", () => {
		expect(Game.CommonDeepIsSubset([1, 2], [2, 1, 3])).toBe(true);
	});

	it("returns true for array of objects (deep subset match)", () => {
		expect(Game.CommonDeepIsSubset([{ id: 1 }], [{ id: 2 }, { id: 1, extra: true }])).toBe(true);
	});

	it("returns false for array with missing element", () => {
		expect(Game.CommonDeepIsSubset([1, 4], [1, 2, 3])).toBe(false);
	});
});

describe("CommonArrayConcatDedupe", () => {
	it("concatenates arrays with some overlap", () => {
		expect(Game.CommonArrayConcatDedupe([1, 2, null], [null, 4, 5])).toEqual([1, 2, null, 4, 5]);
	});

	it("handles nested arrays (does not deep dedupe)", () => {
		expect(Game.CommonArrayConcatDedupe([1, 2, [1]], [null, 4, 5, [1]])).toEqual([1, 2, [1], null, 4, 5, [1]]);
	});

	it("concatenates arrays with no overlap", () => {
		expect(Game.CommonArrayConcatDedupe([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
	});

	it("dedupes identical arrays", () => {
		expect(Game.CommonArrayConcatDedupe([1, 2], [1, 2])).toEqual([1, 2]);
	});
});

describe("CommonStringSubstitute", () => {
	it("performs basic substitution", () => {
		expect(Game.CommonStringSubstitute("Hello, NAME!", [["NAME", "Alice"]])).toBe("Hello, Alice!");
	});

	it("replaces repeated placeholders", () => {
		expect(Game.CommonStringSubstitute("AUGEND + ADDEND = SUM", [
			["AUGEND", "2"],
			["ADDEND", "2"],
			["SUM", "4"],
		])).toBe("2 + 2 = 4");
	});

	it("handles multiple placeholders", () => {
		expect(Game.CommonStringSubstitute("NAME is AGE years old.", [
			["NAME", "Bob"],
			["AGE", "30"],
		])).toBe("Bob is 30 years old.");
	});

	it("handles multiple overlapping placeholders", () => {
		expect(Game.CommonStringSubstitute("NAMEFULL's nickname is NAME.", [
			["NAME", "Bob"],
			["NAMEFULL", "Robert Baker"],
		])).toBe("Robert Baker's nickname is Bob.");

		expect(Game.CommonStringSubstitute("NAMEFULL's nickname is NAME.", [
			["NAMEFULL", "Robert Baker"],
			["NAME", "Bob"],
		])).toBe("Robert Baker's nickname is Bob.");
	});
});

describe("CommonArrayJoinPretty", () => {
	// Requires interface texts
	xit("returns single item as is", () => {
		expect(Game.CommonArrayJoinPretty(["Alice"])).toBe("Alice");
	});
	xit("joins two items with 'and'", () => {
		expect(Game.CommonArrayJoinPretty(["Alice", "Bob"])).toBe("Alice and Bob");
	});
	xit("joins three items with commas and 'and'", () => {
		expect(Game.CommonArrayJoinPretty(["Alice", "Bob", "Charlie"])).toBe("Alice, Bob, and Charlie");
	});
});

describe("CommonStringTitlecase", () => {
	it("capitalizes first letter of the string", () => {
		expect(Game.CommonStringTitlecase("hello world")).toBe("Hello world");
	});
});

describe("CommonCensor", () => {
	it("returns original string when no censored words present", () => {
		expect(Game.CommonCensor("Hello world", {
			ChatSettings: {
				CensoredWordsLevel: 0,
				CensoredWordsList: "apple|banana|cherry",
			},
		})).toBe("Hello world");
	});

	it("censores a single word with *** (level 0)", () => {
		expect(Game.CommonCensor("Hello apple", {
			ChatSettings: {
				CensoredWordsLevel: 0,
				CensoredWordsList: "apple",
			},
		})).toBe("Hello ***");
	});

	it("censores multiple words with *** (level 0)", () => {
		expect(Game.CommonCensor("I like apple and banana.", {
			ChatSettings: {
				CensoredWordsLevel: 0,
				CensoredWordsList: "apple|banana",
			},
		})).toBe("I like *** and ***.");
	});

	it("censores entire string when level 1", () => {
		expect(Game.CommonCensor("This sentence contains an apple.", {
			ChatSettings: {
				CensoredWordsLevel: 1,
				CensoredWordsList: "apple",
			},
		})).toBe("***");
	});

	it("uses alternative symbols for level 2", () => {
		expect(Game.CommonCensor("Don't eat that banana!", {
			ChatSettings: {
				CensoredWordsLevel: 2,
				CensoredWordsList: "banana",
			},
		})).toBe("¶¶¶");
	});
});

describe("CommonIsObject", () => {
	it("returns true for empty object", () => {
		expect(Game.CommonIsObject({})).toBe(true);
	});

	it("returns true for object with properties", () => {
		expect(Game.CommonIsObject({ a: 1 })).toBe(true);
	});

	it("returns false for array", () => {
		expect(Game.CommonIsObject([])).toBe(false);
	});

	it("returns false for null", () => {
		expect(Game.CommonIsObject(null)).toBe(false);
	});
});

describe("CommonCloneDeep", () => {
	it("deep clones a nested object", () => {
		const obj = { a: 1, b: { c: 2 } };
		const clone = Game.CommonCloneDeep(obj);
		expect(clone).toEqual({ a: 1, b: { c: 2 } });
		expect(clone).not.toBe(obj);
	});

	it("deep clones a nested array", () => {
		const arr = [1, 2, [3, 4]];
		const clone = Game.CommonCloneDeep(arr);
		expect(clone).toEqual([1, 2, [3, 4]]);
		expect(clone).not.toBe(arr);
	});

	it("deep clones mixed nested structures", () => {
		const mixed = { a: 1, b: [2, 3], c: { d: 4 } };
		const clone = Game.CommonCloneDeep(mixed);
		expect(clone).toEqual({ a: 1, b: [2, 3], c: { d: 4 } });
		expect(clone).not.toBe(mixed);
	});
});

describe("CommonIsNonNegativeInteger", () => {
	it("returns true for zero", () => {
		expect(Game.CommonIsNonNegativeInteger(0)).toBe(true);
	});

	it("returns true for positive integer", () => {
		expect(Game.CommonIsNonNegativeInteger(5)).toBe(true);
	});

	it("returns false for negative integer", () => {
		expect(Game.CommonIsNonNegativeInteger(-1)).toBe(false);
	});

	it("returns false for non-integer number", () => {
		expect(Game.CommonIsNonNegativeInteger(3.14)).toBe(false);
	});

	it("returns false for string representation of a number", () => {
		expect(Game.CommonIsNonNegativeInteger("5")).toBe(false);
	});
});

describe("CommonIsInteger", () => {
	it("returns true for zero", () => {
		expect(Game.CommonIsInteger(0)).toBe(true);
	});

	it("returns false for null", () => {
		expect(Game.CommonIsInteger(null)).toBe(false);
	});

	it("returns true for positive integer", () => {
		expect(Game.CommonIsInteger(120)).toBe(true);
	});

	it("returns true for negative integer", () => {
		expect(Game.CommonIsInteger(-13)).toBe(true);
	});

	it("returns false for non-integer number", () => {
		expect(Game.CommonIsInteger(Math.PI)).toBe(false);
	});

	it("returns false for string representation of a number", () => {
		expect(Game.CommonIsInteger("15")).toBe(false);
	});
});

describe("CommonIsFinite", () => {
	it("returns true for zero", () => {
		expect(Game.CommonIsFinite(0)).toBe(true);
	});

	it("returns true for positive integer", () => {
		expect(Game.CommonIsFinite(120)).toBe(true);
	});

	it("returns true for negative integer", () => {
		expect(Game.CommonIsFinite(-13)).toBe(true);
	});

	it("returns true for non-integer number", () => {
		expect(Game.CommonIsFinite(Math.PI)).toBe(true);
	});

	it("returns false for Infinity", () => {
		expect(Game.CommonIsFinite(Infinity)).toBe(false);
	});

	it("returns false for negative Infinity", () => {
		expect(Game.CommonIsFinite(-Infinity)).toBe(false);
	});

	it("returns false for NaN", () => {
		expect(Game.CommonIsFinite(NaN)).toBe(false);
	});
});

describe("CommonIsArray", () => {
	it("returns true for empty array", () => {
		expect(Game.CommonIsArray([])).toBe(true);
	});

	it("returns true for array of numbers", () => {
		expect(Game.CommonIsArray([1, 2, 3])).toBe(true);
	});

	it("returns false for object", () => {
		expect(Game.CommonIsArray({})).toBe(false);
	});

	it("returns false for null", () => {
		expect(Game.CommonIsArray(null)).toBe(false);
	});
});

describe("CommonGenerateGridCoords", () => {
	it("generates coordinates for grid with 6 items", () => {
		const gridConfig = {
			x: 0,
			y: 0,
			width: 300,
			height: 200,
			itemWidth: 100,
			itemHeight: 100,
			itemMarginX: 0,
			itemMarginY: 50,
		};
		expect(Game.CommonGenerateGridCoords(6, gridConfig)).toEqual([
			[0, 0, 100, 100],
			[100, 0, 100, 100],
			[200, 0, 100, 100],
			[0, 150, 100, 100],
			[100, 150, 100, 100],
			[200, 150, 100, 100],
		]);
	});
});

describe("CommonOmit", () => {
	it("omits one key", () => {
		expect(Game.CommonOmit({ a: 1, b: 2, c: 3 }, ["b"])).toEqual({ a: 1, c: 3 });
	});

	it("omits multiple keys", () => {
		expect(Game.CommonOmit({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ b: 2 });
	});

	it("does nothing when omitting non-existent key", () => {
		expect(Game.CommonOmit({ a: 1, b: 2, c: 3 }, ["d"])).toEqual({ a: 1, b: 2, c: 3 });
	});
});

describe("CommonPick", () => {
	it("picks multiple keys", () => {
		expect(Game.CommonPick({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ a: 1, c: 3 });
	});

	it("picks one key", () => {
		expect(Game.CommonPick({ a: 1, b: 2, c: 3 }, ["b"])).toEqual({ b: 2 });
	});

	it("returns empty object when picking non-existent key", () => {
		expect(Game.CommonPick({ a: 1, b: 2, c: 3 }, ["d"])).toEqual({});
	});
});

describe("CommonClamp", () => {
	it("returns value when in range", () => {
		expect(Game.CommonClamp(5, 1, 10)).toBe(5);
	});

	it("returns min when value below min", () => {
		expect(Game.CommonClamp(0, 1, 10)).toBe(1);
	});

	it("returns max when value above max", () => {
		expect(Game.CommonClamp(11, 1, 10)).toBe(10);
	});
});

describe("CommonModulo", () => {
	it("returns remainder for positive numbers", () => {
		expect(Game.CommonModulo(5, 3)).toBe(2);
	});

	it("returns positive remainder for negative value", () => {
		expect(Game.CommonModulo(-5, 3)).toBe(2);
	});

	it("works with non-integer divisor", () => {
		expect(Game.CommonModulo(8.25, 0.5)).toBe(0.25);
	});

	it("can cycle between divisor and min", () => {
		let val = 1;
		expect(Game.CommonModulo(++val, 3, 1)).toBe(2);
		expect(Game.CommonModulo(++val, 3, 1)).toBe(3);
		expect(Game.CommonModulo(++val, 3, 1)).toBe(1);
		expect(Game.CommonModulo(--val, 3, 1)).toBe(3);
		expect(Game.CommonModulo(--val, 3, 1)).toBe(2);
		expect(Game.CommonModulo(--val, 3, 1)).toBe(1);
		expect(Game.CommonModulo(--val, 3, 1)).toBe(3);
	});
});

describe("CommonCycle", () => {
	const cycle = ["A", "B", "C"];
	it("returns the first value in case of an invalid parameter", () => {
		expect(Game.CommonCycle(null, cycle, true)).toBe("A");
	});

	it("cycles a value forward through an array", () => {
		let value = "A";
		value = Game.CommonCycle(value, cycle, 1);
		expect(value).toBe("B");
		value = Game.CommonCycle(value, cycle, 1);
		expect(value).toBe("C");
		value = Game.CommonCycle(value, cycle, 1);
		expect(value).toBe("A");
		value = Game.CommonCycle(value, cycle, 1);
		expect(value).toBe("B");
		value = Game.CommonCycle(value, cycle, 1);
		expect(value).toBe("C");
		value = Game.CommonCycle(value, cycle, 1);
		expect(value).toBe("A");
	});

	it("cycles a value backward through an array", () => {
		let value = "A";
		value = Game.CommonCycle(value, cycle, -1);
		expect(value).toBe("C");
		value = Game.CommonCycle(value, cycle, -1);
		expect(value).toBe("B");
		value = Game.CommonCycle(value, cycle, -1);
		expect(value).toBe("A");
		value = Game.CommonCycle(value, cycle, -1);
		expect(value).toBe("C");
		value = Game.CommonCycle(value, cycle, -1);
		expect(value).toBe("B");
		value = Game.CommonCycle(value, cycle, -1);
		expect(value).toBe("A");
	});
});

describe("CommonObjectEqual", () => {
	it("returns true for equal objects", () => {
		expect(Game.CommonObjectEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 })).toBe(true);
	});

	it("returns false for different objects", () => {
		expect(Game.CommonObjectEqual({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 4 })).toBe(false);
	});
});

// half of Common.js is tested,
// all functions after CommonObjectEqual are not tested

describe("CommonFilterMap", () => {
	it("return all `>= 2` values multiplied by 10", () => {
		const callback = (i: number): null | number => i >= 2 ? i * 10 : null;
		expect(Game.CommonFilterMap([0, 1, 1, 2, 3], callback)).toEqual([20, 30]);
	});

	it("return an empty array", () => {
		const callback = (i: number): null | number => i >= 99 ? i * 10 : null;
		expect(Game.CommonFilterMap([0, 1, 1, 2, 3], callback)).toEqual([]);
	});
});

describe("CommonUncamelize", () => {
	it("uncamelizes a string", () => {
		expect(Game.CommonUncamelize("fooBar")).toEqual(["foo", "bar"]);
	});

	it("uncamelizes a string with multiple words", () => {
		expect(Game.CommonUncamelize("fooBarBaz")).toEqual(["foo", "bar", "baz"]);
	});

	it("uncamelizes a string with punctuation", () => {
		expect(Game.CommonUncamelize("bee SAY Bzzz!")).toEqual(["bee", "say", "bzzz!"]);
	});
});

describe("CommonRange", () => {
	it("returns a range including its end", () => {
		expect(Game.CommonRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
	});

	it("returns a range with a given step", () => {
		expect(Game.CommonRange(1, 5, 2)).toEqual([1, 3, 5]);
	});

	it("starts at 0 when only the end is given", () => {
		expect(Game.CommonRange(3)).toEqual([0, 1, 2, 3]);
	});
});
