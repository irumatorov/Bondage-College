"use strict";
var SkillModifier = 0;
var SkillModifierMax = 5;
var SkillModifierMin = -10;
var SkillLevelMaximum = 10;
var SkillLevelMinimum = 0;
var SkillProgressMax = 1000;

/** @type {SkillType[]} */
var SkillValidSkills = ["Bondage", "SelfBondage", "LockPicking", "Evasion", "Willpower", "Infiltration", "Dressage"];

/**
 * Returns the data for a given skill from a character
 *
 * @param {Character} C - The character to get skills from.
 * @param {SkillType} skillType The skill to get
 * @returns {Skill | undefined}
 */
function SkillGet(C, skillType) {
	return C.IsPlayer() ? C.Skill.find(s => s.Type === skillType) : undefined;
}

/**
 * When the player progresses in a skill. Also validates the values to make sure they are within the proper ranges once changed. (level 0-10, progress 0-100)
 * @param {Character} C - The character to get skills from.
 * @param {SkillType} SkillType - Name of the skill to set the value for
 * @param {number} SkillLevel - Level to set for the given skill
 * @param {number} Progress - Progress to set for the given skill
 * @param {boolean} [Push] - Pushes the skills to the server if TRUE
 * @returns {void} - Nothing
 */
function SkillChange(C, SkillType, SkillLevel, Progress, Push=true) {

	if (!SkillValidSkills.includes(SkillType)) {
		console.error(`Invalid skill type "${SkillType}"`);
		return;
	}

	if (!C.IsPlayer()) return;

	// Make sure the progress and level are valid
	if ((Progress < 0) || (Progress >= 1000)) Progress = 0;
	if ((SkillLevel < 0) || (SkillLevel > 10)) SkillLevel = 0;

	// If the skill already exists, we update it
	const skill = SkillGet(Player, SkillType);
	if (skill) {
		skill.Level = SkillLevel;
		skill.Progress = Progress;
		if ((Push == null) || Push) {
			ServerPlayerSkillSync();
		}
		return;
	} else {
		// Create a new skill
		const NewSkill = {
			Type: SkillType,
			Level: SkillLevel,
			Progress: Progress
		};
		C.Skill.push(NewSkill);
	}

	if ((Push == null) || Push) {
		ServerPlayerSkillSync();
	}
}

/**
 * Loads the skill data from the server on login
 * @param {readonly Skill[]} [NewSkill] - The player skills array sent by the server
 * @returns {void} - Nothing
 */
function SkillLoad(NewSkill) {

	// Make sure we have something to load
	if (!NewSkill) return;

	// Add each skill entry one by one
	for (const skill of NewSkill) {
		SkillChange(Player, skill.Type, skill.Level, skill.Progress, false);
		if (skill.Ratio != null) {
			SkillSetRatio(Player, skill.Type, skill.Ratio, false);
		}
		if (skill.ModifierLevel != null) {
			SkillSetModifier(Player, skill.Type, skill.ModifierLevel, (skill.ModifierTimeout ?? 0) - CurrentTime, false);
		}
	}
}

/**
 * Get a specific skill modifier from a character
 * @param {Character} C
 * @param {SkillType} SkillType
 */
function SkillGetModifier(C, SkillType) {
	const skill = SkillGet(C, SkillType);
	if (!skill) return 0;

	let modifier = typeof skill.ModifierLevel === "number" ? skill.ModifierLevel : 0;
	const timeout = skill.ModifierTimeout ?? 0;
	if (CurrentTime > timeout) {
		// Modifier expired, reset
		delete skill.ModifierLevel;
		delete skill.ModifierTimeout;
		return 0;
	}

	return CommonClamp(modifier, SkillModifierMin, SkillModifierMax);
}

/**
 * Get the timeout value on a skill modifier
 *
 * @param {Character} C - The character to get skills from
 * @param {SkillType} SkillType
 * @returns {number} At which (absolute) time will the modifier expire
 */
function SkillGetModifierDuration(C, SkillType) {
	const skill = SkillGet(C, SkillType);
	if (!skill || !skill.ModifierLevel) return 0;

	return (skill.ModifierTimeout ?? 0) - CurrentTime;
}

/**
 * Set a specific skill modifier to apply for a given duration on the target character.
 * @param {Character} C - The character to change the modifier on
 * @param {SkillType} SkillType - The skill the modifier applies to
 * @param {number} Value - The new value of the modifier
 * @param {number} Duration - The length of the modifier effect, in ms
 * @param {boolean} [Push] - Pushes the skills to the server if TRUE
 * @returns {boolean} true if the new value was valid, false if it got capped.
 */
function SkillSetModifier(C, SkillType, Value, Duration, Push=true) {
	const skill = SkillGet(C, SkillType);
	if (!skill || Duration < 0) return false;

	let modifier = CommonClamp(Value, SkillModifierMin, SkillModifierMax);
	skill.ModifierLevel = modifier;
	skill.ModifierTimeout = CurrentTime + Duration;
	if (Push == null || Push) {
		ServerPlayerSkillSync();
	}
	return modifier === Value;
}

/**
 * Get a specific skill level from a character WITH the current modifier applied
 * @param {Character} C - Character for which we want to query a skill
 * @param {SkillType} SkillType - Name of the skill to get the value of
 * @returns {number} - Current level for the given skill.
 */
function SkillGetLevel(C, SkillType) {
	const skill = SkillGet(C, SkillType);
	if (!skill) return 0;

	return CommonClamp(skill.Level + SkillGetModifier(C, SkillType),
		SkillLevelMinimum + SkillModifierMin,
		SkillLevelMaximum + SkillModifierMax
	);
}

/**
 * Get a specific skill level from a character WITHOUT the modifier applied
 * @param {Character} C - Character for which we want to query a skill
 * @param {SkillType} SkillType - Name of the skill to get the value of
 * @returns {number} - Current real level for the given skill.
 */
function SkillGetLevelReal(C, SkillType) {
	const skill = SkillGet(C, SkillType);
	if (!skill) return 0;
	return skill.Level;
}

/**
 * Get a specific skill progress from a character
 * @param {Character} C - Character for which we want to query a skill
 * @param {SkillType} SkillType - Name of the skill to get the progress of
 * @returns {number} - Current progress for the given skill.
 */
function SkillGetProgress(C, SkillType) {
	const skill = SkillGet(C, SkillType);
	if (!skill) return 0;
	return skill.Progress;
}

/**
 * Add progress to a skill, the skill progresses slower for each level, takes into account cheaters version.
 * @param {Character} C - The character to get skills from
 * @param {SkillType} SkillType - Name of the skill to add progress to
 * @param {number} Progress - Progress to be made before the ratios are applied
 * @returns {void} - Nothing
 */
function SkillProgress(C, SkillType, Progress) {

	// Makes sure there's a progress, we cannot go beyond level 10
	let L = SkillGetLevelReal(C, SkillType);
	let P = Math.round(Progress * 3 / (L ** 2 + 1));
	P = P * CheatFactor("DoubleSkill", 2);
	if ((P > 0) && (L < SkillLevelMaximum)) {

		// Raises the actual progress and gains a level if 1000 or more
		P = P + SkillGetProgress(C, SkillType);
		if (P >= SkillProgressMax) {
			L++;
			P = 0;
		}

		// Updates the skill object and push to the server
		SkillChange(C, SkillType, L, P);
	}
}

/**
 * Sets the ratio % of a skill that's going to be used by the player
 * @param {Character} C - The character to get the skill from
 * @param {SkillType} SkillType - Name of the skill to get the value of
 * @param {number} Ratio - The ratio to set for a given skill (0 to 1)
 * @param {boolean} [Push] - Pushes the skills to the server if TRUE
 */
function SkillSetRatio(C, SkillType, Ratio, Push) {
	const skill = SkillGet(C, SkillType);
	if (!skill) return;

	Ratio = Math.max(0, Math.min(1, Ratio));
	if (Ratio == 1) {
		delete skill.Ratio;
	} else {
		skill.Ratio = Ratio;
	}

	if ((Push == null) || Push) {
		ServerPlayerSkillSync();
	}
}

/**
 * Gets the ratio % of effectiveness of a skill for a character
 * @param {Character} C - The character to get the skill from
 * @param {SkillType} SkillType - Name of the skill to get the value of
 * @returns {number} - The current active ratio for the given skill
 */
function SkillGetRatio(C, SkillType) {
	let ratio = 1;
	const skill = SkillGet(C, SkillType);
	if (!skill) return 1;
	ratio = skill.Ratio ?? 0;
	if (typeof skill.Ratio !== "number") ratio = 1;
	return Math.max(0, Math.min(1, ratio));
}

/**
 * Gets a skill level with the current ratio applied to it, if the current skill has a % modifier.
 * @param {Character} C - The character to get the skill from
 * @param {SkillType} SkillType - Name of the skill to get the value of
 * @returns {number} - The skill level with the ratio % applied
 */
function SkillGetWithRatio(C, SkillType) {
	return Math.round(SkillGetLevel(C, SkillType) * SkillGetRatio(C, SkillType));
}
