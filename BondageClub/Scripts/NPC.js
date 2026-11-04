"use strict";
/**
 * List for all possible pairs of NPC traits. A pair defines opposites.
 * @constant
 * @type {[NPCTraitType, NPCTraitType][]}
 */
var NPCTrait = [
	["Dominant", "Submissive"],
	["Violent", "Peaceful"],
	["Horny", "Frigid"],
	["Rude", "Polite"],
	["Wise", "Dumb"],
	["Serious", "Playful"],
];

/**
 * Sets a specific trait for a NPC
 * @param {NPCCharacter} C - NPC to set the trait for
 * @param {NPCTraitType} TraitName - Name of the trait to set
 * @param {number} TraitValue - Value of the trait to set
 * @returns {void} - Nothing
 */
function NPCTraitSet(C, TraitName, TraitValue) {
	if (!C.IsNpc()) return;
	const ReverseName = NPCTraitReverse(TraitName);
	C.Trait ??= [];
	for (let T = 0; T < C.Trait.length; T++)
		if ((C.Trait[T].Name == TraitName) || (C.Trait[T].Name == ReverseName))
			C.Trait.splice(T, 1);
	C.Trait.push({ Name: TraitName, Value: TraitValue });
}

/**
 * Generate random traits for a NPC (70% odds for each traits, can switch on both sides, strength is from 1 to 100). Will generate at least one trait.
 * @param {NPCCharacter} C - NPC to generate the trait for
 * @returns {void} - Nothing
 */
function NPCTraitGenerate(C) {
	C.Trait = [];
	while (C.Trait.length == 0) {
		for (let T = 0; T < NPCTrait.length; T++)
			if (Math.random() >= 0.3) {
				var NewTrait = {
					Name: NPCTrait[T][Math.floor(Math.random() * 2)],
					Value: Math.floor(Math.random() * 100) + 1
				};
				C.Trait.push(NewTrait);
			}
	}
}

/**
 * Get the opposite trait of a specified trait.
 * @param {NPCTraitType} Trait - Name of the trait to find the opposite of.
 * @returns {NPCTraitType} - Name of the opposite trait.
 */
function NPCTraitReverse(Trait) {
	for (const [positiveTrait, negativeTrait] of NPCTrait) {
		if (Trait === positiveTrait) return negativeTrait;
		if (Trait === negativeTrait) return positiveTrait;
	}
	// NPCTrait covers all traits, so it's safe to return whatever
	return /** @type {never} */ (null);
}


/**
 * Returns the weight value of the specified option (The higher the value, the higher the chances the option will be picked, an opposite trait will always result as an option that's not picked)
 * @param {string} TraitSpec - Specified dialog line with the affecting traits.
 * @param {readonly NPCTrait[]} Trait - List of traits of the NPC.
 * @returns {number} - Weight of the dialog option
 */
function NPCTraitGetOptionValue(TraitSpec, Trait) {
	if ((TraitSpec != null) && (Trait != null)) {
		var Value = 0;
		var DialogTrait = TraitSpec.split("|");
		for (let T = 0; T < DialogTrait.length; T++) {
			const traitName = /** @type {NPCTraitType} */ (DialogTrait[T].trim());
			for (let N = 0; N < Trait.length; N++)
				if (Trait[N].Name != null) {
					if (Trait[N].Name.trim() === traitName)
						Value = Value + Trait[N].Value;
					else if (Trait[N].Name.trim() == NPCTraitReverse(traitName))
						Value = Value - 10000;
				}
		}
		return Value;
	} else return 0;
}

/**
 * Finds and keeps the best possible option for a specified NPC dialog group. A group is a list of similar options where each option is influenced by a specified trait.
 * @param {NPCCharacter} C - NPC to get the dialog of
 * @param {string} Group - Name of the dialog group to look for
 * @returns {void} - Nothing.
 */
function NPCTraitKeepBestOption(C, Group) {
	if (!C.IsNpc()) return;

	// For each dialog option of that group
	let Best = -1;
	let Pos = -1;
	for (const [D, dialog] of C.Dialog.entries()) {
		if (dialog.Group === Group) {
			const Value = NPCTraitGetOptionValue(dialog.Trait ?? "", C.Trait ?? []);
			if (Value > Best) { Best = Value; Pos = D; }
		}
	}

	// If we found the best possibility, we remove all the others
	if (Pos >= 0)
		for (let D = 0; D < C.Dialog.length; D++)
			if ((D != Pos) && C.Dialog[D].Group === Group) {
				C.Dialog.splice(D, 1);
				Pos--;
				D--;
			}

}

/**
 * Picks the dialog group option that fits mosts with the NPC traits
 * @param {NPCCharacter} C - NPC to get the dialog options of
 * @returns {void} - Nothing.
 */
function NPCTraitDialog(C) {

	// For each dialog option
	for (const dialog of C.Dialog) {
		const { Group, Function } = dialog;
		if (Group !== null) NPCTraitKeepBestOption(C, Group);
		if (Function !== null) dialog.Function = Function.replace("MainHall", "");
	}
}

/**
 * Sets the arousal settings for a NPC if it's not already done
 * @param {NPCCharacter} C - NPC to set the arousal stats of
 * @returns {void} - Nothing.
 */
function NPCSetupArousal(C) {
	PreferenceInit(C);

	const Dominant = NPCTraitGet(C, "Dominant");
	const Horny = NPCTraitGet(C, "Horny");

	// Generates love/hate for all activities
	C.ArousalSettings.Activity = PreferenceArousalSettingsDefault.Activity;
	for (let A of ActivityFemale3DCG) {
		// Picks a random love factor for the activity (highest values have less chances)
		let LoveSelf = /** @type {ArousalFactor} */(Math.round((Math.random() * 4) + 0.5));

		// Horny NPC have higher love for sexual activities
		if (Horny + 125 > Math.random() * 250) LoveSelf += 1;
		if (Horny + 125 < Math.random() * 250) LoveSelf -= 1;

		// Dominant NPC usually prefer to do activities on others
		let LoveOther = /** @type {ArousalFactor} */(LoveSelf);
		if (Dominant + 125 > Math.random() * 250) LoveSelf -= 1;
		if (Dominant + 125 > Math.random() * 250) LoveOther += 1;
		if (Dominant + 125 < Math.random() * 250) LoveSelf += 1;
		if (Dominant + 125 < Math.random() * 250) LoveOther -= 1;

		// 0 and 4 are the limits
		LoveSelf = /** @type {ArousalFactor} */ (CommonClamp(LoveSelf, 0, 4));
		LoveOther = /** @type {ArousalFactor} */ (CommonClamp(LoveOther, 0, 4));

		// Sets the final values
		PreferenceSetActivityFactor(C, A.Name, true, LoveSelf);
		PreferenceSetActivityFactor(C, A.Name, false, LoveOther);
	}

	// Picks a random zone that's sure to trigger an orgasm, each girl has a perfect zone
	const OrgasmZones = ["ItemBreast", "ItemButt"];
	const Orgasm = CommonRandomItemFromList("", OrgasmZones);

	// Go through all zones
	const zones = /** @type {AssetItemGroup[]} */ (AssetGroup.filter(g => g.IsItem() && g.ArousalZoneID != null));
	for (let group of zones) {
		// Gets the current factors for that character
		let Zone = PreferenceGetArousalZone(C, group.Name);
		if (!Zone) continue;

		// Orgasm zone is always maxed, if not it's randomized
		if (Zone.Orgasm || Zone.Name == Orgasm) {
			PreferenceSetArousalZone(C, Zone.Name, 4, true);
		} else {
			let Factor = /** @type {ArousalFactor} */(Math.round((Math.random() * 4) + 0.5));
			let CanOrgasm = ((Factor > 0) && (OrgasmZones.indexOf(Zone.Name) >= 0) && (Math.random() > 0.5));
			PreferenceSetArousalZone(C, Zone.Name, Factor, CanOrgasm);
		}
	}

	// Forces the automatic meter and resets it
	C.ArousalSettings.Active = "Automatic";
	C.ArousalSettings.Progress = 0;
	C.ArousalSettings.ProgressTimer = 0;
}

/**
 * Returns the trait value of an NPC. If the opposite trait is found, it will return a negative value.
 * @param {NPCCharacter} C - NPC to get the trait of
 * @param {NPCTraitType} TraitType - Name of the trait to get the value of
 * @returns {number} - Value of the trait, returns 0 if it was never set.
 */
function NPCTraitGet(C, TraitType) {
	if (!C.IsNpc()) return 0;
	// For each NPC trait
	const Reverse = NPCTraitReverse(TraitType);
	const found = (C.Trait ?? []).find(trait => trait.Name === TraitType || trait.Name === Reverse);
	if (!found) return 0;
	return found.Name === Reverse ? -found.Value : found.Value;
}

/**
 * Adds a new event in a specified NPC log or updates an existing event if it was previously logged.
 * @param {NPCCharacter} C - NPC for which to add the event to
 * @param {NPCEventType} EventName - Name of the even to add
 * @param {number} EventValue - Value of the even to add (time in ms)
 * @returns {void} - Nothing
 */
function NPCEventAdd(C, EventName, EventValue) {
	if (!C.IsNpc()) return;
	if (C.Event == null) C.Event = [];
	for (let E = 0; E < C.Event.length; E++)
		if (C.Event[E].Name == EventName) {
			C.Event[E].Value = EventValue;
			return;
		}
	var NewEvent = {
		Name: EventName,
		Value: EventValue
	};
	C.Event.push(NewEvent);
}


/**
 * Deletes a specified NPC event from the log
 * @param {NPCCharacter} C - NPC for which to delete the event
 * @param {NPCEventType} EventName - Name of the even to delete
 * @returns {void} - Nothing
 */
function NPCEventDelete(C, EventName) {
	if (!C.IsNpc()) return;
	if (C.Event == null) C.Event = [];
	for (let E = C.Event.length - 1; E >= 0; E--)
		if (C.Event[E].Name == EventName)
			C.Event.splice(E, 1);
}

/**
 * Returns a specified NPC event value.
 * @param {NPCCharacter} C - NPC to get the event value of
 * @param {NPCEventType} EventName - Name of the even to get the value of
 * @returns {number} - Value of the event as the time in ms, returns 0 if it was never logged
 */
function NPCEventGet(C, EventName) {
	if (!C.IsNpc()) return 0;
	if (C.Event != null)
		for (let E = 0; E < C.Event.length; E++)
			if (C.Event[E].Name == EventName)
				return C.Event[E].Value;
	return 0;
}

/**
 * For longer events like a collaring, the serious trait will dictate the time (1 day if playful, 3 days if nothing, 7 days if serious)
 * @param {NPCCharacter} C - NPC to get the event delay of
 * @returns {number} - Delay required for the event.
 */
function NPCLongEventDelay(C) {
	var T = NPCTraitGet(C, "Serious");
	if (T > 0) return MS_PER_WEEK;
	if (T < 0) return MS_PER_DAY;
	return 259200000;
}

/**
 * The horny / frigid trait comes into play when a NPC decides if it can take the player as a lover. (1 week if horny, 2 weeks if nothing, 4 weeks if frigid)
 * @param {NPCCharacter} C - NPC to get the event delay of
 * @returns {number} - Delay required for the lover event.
 */
function NPCLongLoverEventDelay(C) {
	var T = NPCTraitGet(C, "Horny");
	if (T > 0) return MS_PER_WEEK;
	if (T < 0) return 2419200000;
	return 1209600000;
}

/**
 * Changes the love factor for a specified NPC, will stay within the -100 to 100 range, 60 is max out of a relationship
 * @param {NPCCharacter} C - NPC to change the love factor of
 * @param {number} LoveFactor - Amount to add to the current love factor (can be negative).
 * @returns {void} - Nothing
 */
function NPCLoveChange(C, LoveFactor) {
	if (!C.IsNpc()) return;
	C.Love ??= 0;
	C.Love = CommonClamp(C.Love + LoveFactor, -100, 100);
	// Cap based on whether the NPC is our lover, sub, or owner
	if (C.Love > 60 && !C.IsLoverOfPlayer() && !C.IsOwnedByPlayer() && !C.IsOwner() && (NPCEventGet(C, "EndSubTrial") <= 0)) {
		C.Love = 60;
	}
}

/**
 * Raises the love factor progressively with interaction time
 * @param {NPCCharacter} C
 * @returns {void} - Nothing
 */
function NPCInteraction(C) {
	if (C?.IsNpc() && CurrentTime >= NPCEventGet(C, "LastInteraction")) {
		NPCEventAdd(C, "LastInteraction", CurrentTime + 15000);
		NPCLoveChange(C, 1);
	}
}
