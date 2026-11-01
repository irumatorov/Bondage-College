"use strict";

/** @type {Record<ReputationType, { negative?: true }>} */
var ReputationConfig = {
	ABDL: {},
	Asylum: { negative: true },
	Dominant: { negative: true },
	Gambling: {},
	Gaming: {},
	Kidnap: {},
	LARP: {},
	Maid: {},
	HouseAmplector: {},
	HouseCorporis: {},
	HouseMaiestas: {},
	HouseVincula: {},
};

/** @type {ReputationType[]} */
var ReputationValidReputations = CommonKeys(ReputationConfig);

/**
 * Alters a given reputation value for the player
 * @param {ReputationType} RepType - The name/type of the reputation to alter
 * @param {number} RepValue - Reputation to add/subtract to the current reputation value.
 * @param {boolean} [Push] - Pushes the reputation to the server if TRUE
 * @returns {void} - Nothing
 */
function ReputationChange(RepType, RepValue, Push=true) {

	if (!ReputationConfig[RepType]) {
		console.error(`Invalid reputation type "${RepType}"`);
		return;
	}
	if (typeof RepValue === "string") {
		RepValue = CommonParseInt(RepValue) ?? 0;
	}

	if (RepValue === 0) return;

	const minValue = ReputationConfig[RepType].negative ? -100 : 0;
	let rep = Player.Reputation.find(r => r.Type === RepType);
	if (rep) {
		rep.Value = CommonClamp(rep.Value + RepValue, minValue, 100);
	} else {
		Player.Reputation.push({
			Type: RepType,
			Value: CommonClamp(RepValue, minValue, 100),
		});
	}
	if (Push) ServerPlayerReputationSync();
}

/**
 * Get the human-readable label for a given reputation type and value
 *
 * Because there's a couple "mirrored" reputation, where a positive value is labelled one way,
 * and a negative one another way, this allows getting the proper name based on the value it has.
 *
 * @param {ReputationType} type
 * @param {number} value
 * @returns {string | null}
 */
function ReputationLabel(type, value) {
	/**
	 * @param {ReputationType} t
	 * @returns {t is "Asylum" | "Dominant"}
	 */
	const isDualReputation = (t) => {
		return ReputationConfig[t].negative ?? false;
	};
	if (isDualReputation(type)) {
		return value < 0 ?
			InterfaceTextGet(`Reputation${type}Negative`)
			: InterfaceTextGet(`Reputation${type}Positive`);
	}
	return InterfaceTextGet(`Reputation${type}`);
}

/**
 * Loads the reputation data from the server
 * @param {readonly Reputation[]} [NewRep] - The array of reputation-value pairs to load for the current player
 * @returns {void} - Nothing
 */
function ReputationLoad(NewRep) {
	// Make sure we have something to load
	if (NewRep != null) {

		// Add each reputation entry one by one
		for (const rep of NewRep)
			ReputationChange(rep.Type, rep.Value, false);

	}

}

/**
 * Returns the reputation value of a given character
 * @overload
 * @param {Character} C - The character to get the reputation of
 * @param {ReputationType} RepType - Type/name of the reputation to get the value of.
 * @returns {number}
 */
/**
 * Returns the reputation value of the player
 * @overload
 * @param {ReputationType} ReputationType - Gets the reputation value from the player
 * @returns {number}
 */
/**
 * Returns the reputation value of a given character
 * @param {Character | ReputationType} character - The character to get the reputation of
 * @param {ReputationType} [repType] - Type/name of the reputation to get the value of.
 * @returns {number} - Returns the value of the reputation. It can range from 100 to -100, and it defaults to 0 if the player never earned this type of reputation before.
 */
function ReputationGet(character, repType) {
	if (typeof character === "string") {
		repType = character;
		character = Player;
	}

	const rep = character.Reputation.find(r => r.Type === repType);
	return rep?.Value ?? 0;
}

/**
 * Returns a specific reputation value for a given character
 * @param {Character} character - Character to get the reputation for.
 * @param {ReputationType} repType - Type/name of the reputation to get the value of.
 * @returns {number} - Returns the value of the reputation. It can range from 100 to -100, and it defaults to 0 if the given character never earned this type of reputation before.
 * @deprecated - Deprecated alias for {@link ReputationGet}
 */
function ReputationCharacterGet(character, repType) {
	return ReputationGet(character, repType);
}

/**
 * Alter the reputation progress by a factor. The higher the rep, the slower it gets, a reputation is easier to break than to build. Takes the cheater version factor into account.
 * @param {ReputationType} RepType - Type/name of the reputation
 * @param {number} Value - Value of the reputation change before the factor is applied
 * @returns {void} - Nothing
 */
function ReputationProgress(RepType, Value) {
	if (Value === 0) return;
	const V = ReputationGet(RepType);
	Value = Value * CheatFactor("DoubleReputation", 2);
	if (Value > 0) {
		if ((V >= 70) && (V <= 100)) ReputationChange(RepType, Math.floor(Value / 3));
		if ((V >= 30) && (V < 70)) ReputationChange(RepType, Math.floor(Value / 2));
		if ((V > -30) && (V < 30)) ReputationChange(RepType, Value);
		if ((V > -70) && (V <= -30)) ReputationChange(RepType, Value * 2);
		if ((V >= -100) && (V <= -70)) ReputationChange(RepType, Value * 4);
	} else {
		if ((V >= -100) && (V <= -70)) ReputationChange(RepType, Math.floor(Value * -1 / 3) * -1);
		if ((V > -70) && (V <= -30)) ReputationChange(RepType, Math.floor(Value * -1 / 2) * -1);
		if ((V > -30) && (V < 30)) ReputationChange(RepType, Value);
		if ((V >= 30) && (V < 70)) ReputationChange(RepType, Value * 2);
		if ((V >= 70) && (V <= 100)) ReputationChange(RepType, Value * 4);
	}
}
