"use strict";

/** @type {ChatColorThemeType[]} */
var PreferenceChatColorThemeList = ["Light", "Dark", "Light2", "Dark2"];
/** @type {ChatEnterLeaveType[]} */
var PreferenceChatEnterLeaveList = ["Normal", "Smaller", "Hidden"];
/** @type {ChatMemberNumbersType[]} */
var PreferenceChatMemberNumbersList = ["Always", "Never", "OnMouseover"];
/** @type {ChatFontSizeType[]} */
var PreferenceChatFontSizeList = ["Small", "Medium", "Large"];

var PreferenceSettingsSensitivityList = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var PreferenceSettingsSensitivityIndex = 13;
var PreferenceSettingsDeadZoneList = [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
var PreferenceSettingsDeadZoneIndex = 1;
var PreferenceCalibrationStage = 0;

/** @type {ImmersionSensDepName[]} */
var PreferenceSettingsSensDepList = ["SensDepLight", "Normal", "SensDepNames", "SensDepTotal", "SensDepExtreme"];
/** @type {LockTimerLimitName[]} */
var PreferenceSettingsLockTimerLimitList = ["LockTimerLimitDefault", "LockTimerLimitDay", "LockTimerLimitWeek", "LockTimerLimitMonth", "LockTimerLimitYear", "LockTimerLimitUnlimited"];

/** @type {GraphicsVFXName[]} */
var PreferenceSettingsVFXList = ["VFXInactive", "VFXSolid", "VFXAnimatedTemp", "VFXAnimated"];
/** @deprecated */
var PreferenceSettingsVFXIndex = 0;
/** @type {GraphicsVFXVibratorName[]} */
var PreferenceSettingsVFXVibratorList = ["VFXVibratorInactive", "VFXVibratorSolid", "VFXVibratorAnimated"];
/** @deprecated */
var PreferenceSettingsVFXVibratorIndex = 0;
/** @type {GraphicsVFXFilterName[]} */
var PreferenceSettingsVFXFilterList = ["VFXFilterNone", "VFXFilterLight", "VFXFilterMedium", "VFXFilterHeavy"];
/** @deprecated */
var PreferenceSettingsVFXFilterIndex = 0;
/** @type {GraphicsFontName[]} */
var PreferenceGraphicsFontList = ["Arial", "TimesNewRoman", "Papyrus", "ComicSans", "Impact", "HelveticaNeue", "Verdana", "CenturyGothic", "Georgia", "CourierNew", "Copperplate"];
/** @type {WebGLPowerPreference[]} */
var PreferenceGraphicsPowerModes = ["low-power", "default", "high-performance"];
/** @deprecated */
var PreferenceGraphicsFontIndex = 0;
/** @deprecated @type {number} */
var PreferenceGraphicsAnimationQualityIndex = -1;
/** @deprecated @type {number} */
var PreferenceGraphicsPowerModeIndex = -1;
var PreferenceGraphicsAnimationQualityList = [10000, 2000, 200, 100, 50, 0];
var PreferenceGraphicsFrameLimit = [0, 10, 15, 30, 60];
/** @type {GraphicsShowFullscreenButton[]} */
var PreferenceGraphicsFullscreenButtonList = ["on", "off", "on_when_mobile"];

/** @type {ArousalActiveName[]} */
var PreferenceArousalActiveList = ["Inactive", "NoMeter", "Manual", "Hybrid", "Automatic"];
var PreferenceArousalActiveIndex = 0;
/** @type {ArousalVisibleName[]} */
var PreferenceArousalVisibleList = ["All", "Access", "Self"];
var PreferenceArousalVisibleIndex = 0;
/** @type {ArousalAffectStutterName[]} */
var PreferenceArousalAffectStutterList = ["None", "Arousal", "Vibration", "All"];
var PreferenceArousalAffectStutterIndex = 0;
/**
 * Initialized by {@link PreferenceSubscreenArousalLoad}
 * @type {ActivityName[]}
 */
var PreferenceArousalActivityList;
var PreferenceArousalActivityIndex = 0;
/**
 * @type {never}
 * @deprecated
 */
var PreferenceArousalActivityFactorSelf;
/**
 * @type {never}
 * @deprecated
 */
var PreferenceArousalActivityFactorOther;
/**
 * @type {never}
 * @deprecated
 */
var PreferenceArousalZoneFactor;
/**
 * Initialized by {@link PreferenceSubscreenArousalLoad}
 * @type {FetishName[]}
 */
var PreferenceArousalFetishList;
var PreferenceArousalFetishIndex = 0;
/**
 * @type {never}
 * @deprecated
 */
var PreferenceArousalFetishFactor;

/**
 * Get the sensory deprivation setting for the player
 * @returns {boolean} - Return true if sensory deprivation is active, false otherwise
 */
function PreferenceIsPlayerInSensDep() {
	return (
		Player.GameplaySettings
		&& ((Player.GameplaySettings.SensDepChatLog == "SensDepNames") || (Player.GameplaySettings.SensDepChatLog == "SensDepTotal") || (Player.GameplaySettings.SensDepChatLog == "SensDepExtreme"))
		&& (Player.GetDeafLevel() >= 3)
		&& (Player.GetBlindLevel() >= 3 || ChatRoomSenseDepBypass)
	);
}

/**
 * Compares the arousal preference level and returns TRUE if that level is met, or an higher level is met
 * @param {Character} C - The player who performs the sexual activity
 * @param {ArousalActiveName} Level - The name of the level ("Inactive", "NoMeter", "Manual", "Hybrid", "Automatic")
 * @returns {boolean} - Returns TRUE if the level is met or more
 */
function PreferenceArousalAtLeast(C, Level) {
	if (AsylumGGTSIsEnabled() && AsylumGGTSGetLevel(C) >= 4) {
		if (InventoryIsWorn(C, "ItemPelvis", "FuturisticChastityBelt") || InventoryIsWorn(C, "ItemPelvis", "FuturisticTrainingBelt") || InventoryIsWorn(C, "ItemDevices", "FuckMachine"))
			return true;
	}
	if ((C.ArousalSettings == null) || (C.ArousalSettings.Active == null)) return false;
	if (Level === C.ArousalSettings.Active) return true;
	if (C.ArousalSettings.Active == "Automatic") return true;
	if ((Level == "Manual") && (C.ArousalSettings.Active == "Hybrid")) return true;
	if ((Level == "NoMeter") && ((C.ArousalSettings.Active == "Manual") || (C.ArousalSettings.Active == "Hybrid"))) return true;
	return false;
}

/**
 * Gets the effect of a sexual activity on the player
 * @param {Character} C - The player who performs the sexual activity
 * @param {ActivityName} Type - The type of the activity that is performed
 * @param {boolean} Self - Determines, if the current player is giving (false) or receiving (true)
 * @returns {ArousalFactor} - Returns the love factor of the activity for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetActivityFactor(C, Type, Self) {
	const activity = AssetGetActivity(C.AssetFamily, Type);
	if (!activity || !CommonIsNonNegativeInteger(activity.ActivityID)) return 0;

	// Gets the value and make sure it's valid
	let Value = C.ArousalSettings.Activity.charCodeAt(activity.ActivityID) - 100;
	if (Self) Value = Value % 10;
	else Value = Math.floor(Value / 10);

	return /** @type {ArousalFactor} */ (Value >= 0 && Value <= 4 ? Value : 2);
}

/**
 * Sets the love factor of a sexual activity for the character
 * @param {Character} C - The character for whom the activity factor should be set
 * @param {ActivityName} Type - The type of the activity that is performed
 * @param {boolean} Self - Determines, if the current player is giving (false) or receiving (true)
 * @param {ArousalFactor} Factor - The factor of the sexual activity (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceSetActivityFactor(C, Type, Self, Factor) {
	// Make sure the Activity data is valid
	if ((typeof Factor !== "number") || (Factor < 0) || (Factor > 4)) return;

	const activity = AssetGetActivity(C.AssetFamily, Type);
	if (!activity || !CommonIsNonNegativeInteger(activity.ActivityID)) return;

	// Gets and sets the factors
	let SelfFactor = PreferenceGetActivityFactor(C, Type, true);
	let OtherFactor = PreferenceGetActivityFactor(C, Type, false);
	if (Self) {
		SelfFactor = Factor;
	} else {
		OtherFactor = Factor;
	}

	const val = PreferenceArousalActivityToChar(SelfFactor, OtherFactor);
	const def = PreferenceArousalActivityToChar(PreferenceActivityEnjoymentDefault.Self, PreferenceActivityEnjoymentDefault.Other);
	C.ArousalSettings.Activity = CommonStringSplice(C.ArousalSettings.Activity, activity.ActivityID, val, def);
}

/**
 * Gets the factor of a fetish for the player, "2" for normal is default if factor isn't found
 * @param {Character} C - The character to query
 * @param {FetishName} Type - The name of the fetish
 * @returns {ArousalFactor} - Returns the love factor of the fetish for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetFetishFactor(C, Type) {
	// Finds the ID of the fetish specified
	const fetish = AssetGetFetish(C.AssetFamily, Type);
	if (!fetish || !CommonIsNonNegativeInteger(fetish.FetishID)) return 0;

	// If value is between 0 and 4, we return it
	let Value = C.ArousalSettings.Fetish.charCodeAt(fetish.FetishID) - 100;
	return /** @type {ArousalFactor} */ (Value >= 0 && Value <= 4 ? Value : 2);
}

/**
 * Sets the arousal factor of a fetish for a character
 * @param {Character} C - The character to set
 * @param {FetishName} Type - The name of the fetish
 * @param {ArousalFactor} Factor - New arousal factor for that fetish (0 is horrible, 2 is normal, 4 is great)
 * @returns {void} - Nothing
 */
function PreferenceSetFetishFactor(C, Type, Factor) {
	// Make sure the fetish data is valid
	if ((typeof Factor !== "number") || (Factor < 0) || (Factor > 4)) return;

	const fetish = AssetGetFetish(C.AssetFamily, Type);
	if (!fetish || !CommonIsNonNegativeInteger(fetish.FetishID)) return;

	// Sets the Fetish in the compressed string
	const val = PreferenceArousalFetishToChar(Factor);
	const def = PreferenceArousalFetishToChar(PreferenceArousalFetishDefault.Factor);
	C.ArousalSettings.Fetish = CommonStringSplice(C.ArousalSettings.Fetish, fetish.FetishID, val, def);
}

/**
 * Validates the character arousal object and converts it's objects to compressed string if needed
 * @param {ArousalFactor} factor - The factor of enjoyability from 0 (turn off) to 4 (very high)
 * @param {boolean} allowOrgasm - Whether the zone can give an orgasm
 * @returns {string} - A string of 1 char that represents the compressed zone
 */
function PreferenceArousalZoneToChar(factor, allowOrgasm) {
	if ((factor < 0) || (factor > 4)) factor = 2;
	return String.fromCharCode(100 + factor + (allowOrgasm ? 10 : 0));
}

/**
 * Turn a fetish factor value into its serialized character representation
 * @param {ArousalFactor} factor - The factor of enjoyability from 0 (turn off) to 4 (very high)
 * @returns {string} - A string of 1 char that represents the compressed zone
 */
function PreferenceArousalFetishToChar(factor) {
	if ((factor < 0) || (factor > 4)) factor = 2;
	return String.fromCharCode(100 + factor);
}

/**
 * Validates the character arousal object and converts it's objects to compressed string if needed
 * @param {number} selfFactor - The first factor of enjoyability from 0 (turn off) to 4 (very high)
 * @param {number} otherFactor - The second factor of enjoyability from 0 (turn off) to 4 (very high)
 * @returns {string} - A string of 1 char that represents the compressed zone
 */
function PreferenceArousalActivityToChar(selfFactor, otherFactor) {
	if ((selfFactor < 0) || (selfFactor > 4)) selfFactor = 2;
	if ((otherFactor < 0) || (otherFactor > 4)) otherFactor = 2;
	return String.fromCharCode(100 + selfFactor + (otherFactor * 10));
}

/**
 * Gets the corresponding arousal zone definition from a player's preferences (if the group's activities are mirrored,
 * returns the arousal zone definition for the mirrored group).
 * @param {Character} C - The character for whom to get the arousal zone
 * @param {AssetGroupItemName} ZoneName - The name of the zone to get
 * @returns {null | ArousalZone} - Returns the arousal zone preference object,
 * or null if a corresponding zone definition could not be found.
 */
function PreferenceGetArousalZone(C, ZoneName) {
	// Finds the asset group and make sure the string contains it
	let Group = AssetGroupGet(C.AssetFamily, ZoneName);
	if (!Group || !CommonIsNonNegativeInteger(Group.ArousalZoneID) || (C.ArousalSettings.Zone.length <= Group.ArousalZoneID)) return null;

	const Value = C.ArousalSettings.Zone.charCodeAt(Group.ArousalZoneID) - 100;
	let Factor = /** @type {ArousalFactor} */ (CommonClamp(Value % 10, 0, 4));
	return {
		Name: ZoneName,
		Factor: Factor,
		Orgasm: (Value >= 10)
	};
}

/**
 * Gets the love factor of a zone for the character
 * @param {Character} C - The character for whom the love factor of a particular zone should be gotten
 * @param {AssetGroupItemName} ZoneName - The name of the zone to get the love factor for
 * @returns {ArousalFactor} - Returns the love factor of a zone for the character (0 is horrible, 2 is normal, 4 is great)
 */
function PreferenceGetZoneFactor(C, ZoneName) {
	const Zone = PreferenceGetArousalZone(C, ZoneName);
	if (!Zone) return 0;
	return Zone.Factor;
}

/**
 * Sets the arousal zone data for a specific body zone on the player
 * @param {Character} C - The character, for whom the love factor of a particular zone should be set
 * @param {AssetGroupItemName} ZoneName - The name of the zone, the factor should be set for
 * @param {null | ArousalFactor} [Factor] - The factor of the zone (0 is horrible, 2 is normal, 4 is great)
 * @param {null | boolean} [CanOrgasm] - Sets, if the character can cum from the given zone (true) or not (false)
 * @returns {void} - Nothing
 */
function PreferenceSetArousalZone(C, ZoneName, Factor, CanOrgasm) {
	// Gets the zone object
	let Zone = PreferenceGetArousalZone(C, ZoneName);
	if (!Zone) return;

	const Group = AssetGroupGet(C.AssetFamily, ZoneName);
	if (!Group || typeof Group.ArousalZoneID !== "number") {
		console.error('PreferenceSetArousalZone: Invalid group name or missing group ID', Group?.ArousalZoneID);
		return;
	}

	if (typeof Factor === "number") {
		Zone.Factor = Factor;
	}
	if (typeof CanOrgasm === "boolean") {
		Zone.Orgasm = CanOrgasm;
	}

	// Creates the new char and slides it in the compressed string
	const val = PreferenceArousalZoneToChar(Zone.Factor, Zone.Orgasm);
	const def = PreferenceArousalZoneToChar(PreferenceArousalZoneDefault.Factor, PreferenceArousalZoneDefault.Orgasm);
	C.ArousalSettings.Zone = CommonStringSplice(C.ArousalSettings.Zone, Group.ArousalZoneID, val, def);
}

/**
 * Determines, if a player can reach on orgasm from a particular zone
 * @param {Character} C - The character whose ability to orgasm we check
 * @param {AssetGroupItemName} ZoneName - The name of the zone to check
 * @returns {boolean} - Returns true if the zone allows orgasms for a character, false otherwise
 */
function PreferenceGetZoneOrgasm(C, ZoneName) {
	const Zone = PreferenceGetArousalZone(C, ZoneName);
	return !!Zone && !!Zone.Orgasm;
}

/**
 * Checks, if the arousal activity controls must be activated
 * @returns {boolean} - Returns true if we must activate the preference controls, false otherwise
 */
function PreferenceArousalIsActive() {
	return (PreferenceArousalActiveList[PreferenceArousalActiveIndex] != "Inactive");
}

/**
 * Initialize and validates the character settings
 * @param {Character} C - The character, whose preferences are initialized
 * @returns {void} - Nothing
 */
function PreferenceInit(C) {
	C.ArousalSettings = ValidationApplyRecord(C.ArousalSettings, C, PreferenceArousalSettingsValidate);
}

/**
 * Initialize and validates Player settings
 * @param {PlayerCharacter} C
 * @param {Partial<ServerAccountData>} data
 * @returns {void} - Nothing
 */
function PreferenceInitPlayer(C, data) {

	/**
	 * Save settings for comparison
	 * @satisfies {Partial<Record<keyof ServerAccountData, string>>}
	 */
	const PrefBefore = {
		ArousalSettings: JSON.stringify(data.ArousalSettings) ?? "",
		ChatSettings: JSON.stringify(data.ChatSettings) ?? "",
		VisualSettings: JSON.stringify(data.VisualSettings) ?? "",
		AudioSettings: JSON.stringify(data.AudioSettings) ?? "",
		ControllerSettings: JSON.stringify(data.ControllerSettings) ?? "",
		GameplaySettings: JSON.stringify(data.GameplaySettings) ?? "",
		ImmersionSettings: JSON.stringify(data.ImmersionSettings) ?? "",
		RestrictionSettings: JSON.stringify(data.RestrictionSettings) ?? "",
		OnlineSettings: JSON.stringify(data.OnlineSettings) ?? "",
		OnlineSharedSettings: JSON.stringify(data.OnlineSharedSettings) ?? "",
		GraphicsSettings: JSON.stringify(data.GraphicsSettings) ?? "",
		NotificationSettings: JSON.stringify(data.NotificationSettings) ?? "",
		GenderSettings: JSON.stringify(data.GenderSettings) ?? "",
		LabelColor: JSON.stringify(data.LabelColor) ?? "",
	};

	C.LabelColor = ServerAccountDataSyncedValidate.LabelColor(data.LabelColor, C);
	C.AllowedInteractions = data.AllowedInteractions ?? data.ItemPermission ?? 2;

	// Erections used to follow the facial expressions setting
	if (CommonIsObject(data.ArousalSettings) && data.ArousalSettings.AffectErection == null)
		data.ArousalSettings.AffectErection = data.ArousalSettings.AffectExpression;
	C.ArousalSettings = ValidationApplyRecord(data.ArousalSettings, C, PreferenceArousalSettingsValidate);
	C.AudioSettings = ValidationApplyRecord(data.AudioSettings, C, PreferenceAudioSettingsValidate);

	// @ts-expect-error: Just backward-compat cleanup
	delete data.ChatSettings?.AutoBanBlackList;
	// @ts-expect-error: Just backward-compat cleanup
	delete data.ChatSettings?.AutoBanGhostList;
	// @ts-expect-error: Just backward-compat cleanup
	delete data.ChatSettings?.SearchFriendsFirst;
	// @ts-expect-error: Just backward-compat cleanup
	delete data.ChatSettings?.DisableAnimations;
	// @ts-expect-error: Just backward-compat cleanup
	delete data.ChatSettings?.SearchShowsFullRooms;
	// @ts-expect-error: Just backward-compat cleanup
	delete data.OnlineSettings?.EnableWardrobeIcon;
	C.ChatSettings = ValidationApplyRecord(data.ChatSettings, C, PreferenceChatSettingsValidate);

	// @ts-expect-error: checking for old-style mapping
	if (data.ControllerSettings && typeof data.ControllerSettings?.ControllerA === "number") {
		// Port over to new mapping
		const s = /** @type {ControllerSettingsOld} */(/** @type {unknown} */(data.ControllerSettings));
		const buttonsMapping = {
			[ControllerButton.A]: s.ControllerA,
			[ControllerButton.B]: s.ControllerB,
			[ControllerButton.X]: s.ControllerX,
			[ControllerButton.Y]: s.ControllerY,
			[ControllerButton.DPadU]: s.ControllerDPadUp,
			[ControllerButton.DPadD]: s.ControllerDPadDown,
			[ControllerButton.DPadL]: s.ControllerDPadLeft,
			[ControllerButton.DPadR]: s.ControllerDPadRight,
		};
		const axisMapping = {
			[ControllerAxis.StickLV]: s.ControllerStickUpDown,
			[ControllerAxis.StickLH]: s.ControllerStickLeftRight,
		};
		ControllerLoadMapping(buttonsMapping, axisMapping);
		// Delete the old mapping

		const oldKeys = /** @type {never[]} */([
			"ControllerA",
			"ControllerB",
			"ControllerX",
			"ControllerY",
			"ControllerStickUpDown",
			"ControllerStickLeftRight",
			"ControllerStickRight",
			"ControllerStickDown",
			"ControllerDPadUp",
			"ControllerDPadDown",
			"ControllerDPadLeft",
			"ControllerDPadRight",
		]);
		for (const old of oldKeys) {
			delete data.ControllerSettings[old];
		}
		// @ts-expect-error we don't have all the buttons
		data.ControllerSettings.Buttons = buttonsMapping;
		// @ts-expect-error we don't have all the axis
		data.ControllerSettings.Axis = axisMapping;
	}

	C.ControllerSettings = ValidationApplyRecord(data.ControllerSettings, C, PreferenceControllerSettingsValidate);
	ControllerLoadMapping(C.ControllerSettings.Buttons, C.ControllerSettings.Axis);

	ControllerStart();

	C.GameplaySettings = ValidationApplyRecord(data.GameplaySettings, C, PreferenceGameplaySettingsValidate);
	C.GraphicsSettings = ValidationApplyRecord(data.GraphicsSettings, C, PreferenceGraphicsSettingsValidate);
	C.GenderSettings = ValidationApplyRecord(data.GenderSettings, C, PreferenceGenderSettingsValidate);
	C.ImmersionSettings = ValidationApplyRecord(data.ImmersionSettings, C, PreferenceImmersionSettingsValidate);
	C.OnlineSettings = ValidationApplyRecord(data.OnlineSettings, C, PreferenceOnlineSettingsValidate, true);
	const extraKeys = CommonKeys(C.OnlineSettings).filter(i => !(i in PreferenceOnlineSettingsValidate));
	if (extraKeys.length) {
		console.error(`Found extra keys ${extraKeys} in Player.OnlineSettings. Please move those to Player.ExtensionSettings`);
	}
	C.OnlineSharedSettings = ValidationApplyRecord(data.OnlineSharedSettings, C, PreferenceOnlineSharedSettingsValidate, true);
	C.RestrictionSettings = ValidationApplyRecord(data.RestrictionSettings, C, PreferenceRestrictionSettingsValidate);
	C.VisualSettings = ValidationApplyRecord(data.VisualSettings, C, PreferenceVisualSettingsValidate);
	C.NotificationSettings = ValidationApplyRecord(data.NotificationSettings, C, PreferenceNotificationSettingsValidate);

	// Forces some preferences depending on difficulty

	// Difficulty: non-Roleplay settings
	if (C.GetDifficulty() >= Difficulty.REGULAR) {
		C.RestrictionSettings.BypassStruggle = false;
		C.RestrictionSettings.SlowImmunity = false;
		C.RestrictionSettings.BypassNPCPunishments = false;
		C.RestrictionSettings.NoSpeechGarble = false;
	}

	// Difficulty: Hardcore settings
	if (C.GetDifficulty() >= Difficulty.HARDCORE) {
		C.GameplaySettings.EnableSafeword = false;
		C.GameplaySettings.DisableAutoMaid = true;
		C.GameplaySettings.OfflineLockedRestrained = true;
	}

	// Difficulty: Extreme settings
	if (C.GetDifficulty() >= Difficulty.EXTREME) {
		C.GameplaySettings.SensDepChatLog = "SensDepExtreme";
		C.GameplaySettings.BlindDisableExamine = true;
		C.GameplaySettings.DisableAutoRemoveLogin = true;
		C.ArousalSettings.DisableAdvancedVibes = false;
		C.GameplaySettings.ImmersionLockSetting = true;
		C.ImmersionSettings.StimulationEvents = true;
		C.ImmersionSettings.ReturnToChatRoom = true;
		C.ImmersionSettings.ReturnToChatRoomAdmin = true;
		C.ImmersionSettings.ChatRoomMapLeaveOnExit = true;
		C.ImmersionSettings.SenseDepMessages = true;
		C.ImmersionSettings.ChatRoomMuffle = true;
		C.ImmersionSettings.BlindAdjacent = true;
		C.ImmersionSettings.AllowTints = true;
		C.ImmersionSettings.ShowUngarbledMessages = false;
		C.OnlineSharedSettings.AllowPlayerLeashing = true;
		C.OnlineSharedSettings.AllowRename = true;
	}

	// Sync settings if anything changed
	/** @type {{ [k in keyof typeof PrefBefore]?: PlayerCharacter[k] }} */
	const toUpdate = {};

	for (const [prop, stringPrefBefore] of CommonEntries(PrefBefore))
		if (JSON.stringify(C[prop]) !== stringPrefBefore)
			/** @type {Unknown<typeof toUpdate>} */(toUpdate)[prop] = data[prop];

	if (CommonVersionUpdated && (toUpdate != null) && (toUpdate.OnlineSharedSettings != null))
		toUpdate.OnlineSharedSettings.GameVersion = GameVersion;

	if (Object.keys(toUpdate).length > 0)
		ServerAccountUpdate.QueueData(toUpdate);

	Fullscreen.UpdateButton();
}

/**
 * Initialise the Notifications settings, converting the old boolean types to objects
 * @param {boolean} setting - The old version of the setting
 * @param {NotificationAudioType} audio - The audio setting
 * @param {NotificationAlertType} [defaultAlertType] - The default AlertType to use
 * @returns {NotificationSetting} - The setting to use
 * @deprecated
 */
function PreferenceInitNotificationSetting(setting, audio, defaultAlertType) {
	const alertType = typeof setting === "boolean" && setting === true ? NotificationAlertType.TITLEPREFIX : defaultAlertType ?? NotificationAlertType.NONE;
	return {
		AlertType: alertType,
		Audio: audio,
	};
}

/**
 * Namespace with default values for {@link ActivityEnjoyment} properties.
 * @satisfies {ActivityEnjoyment}
 * @namespace
 */
var PreferenceActivityEnjoymentDefault = {
	Name: /** @type {never} */ (undefined),
	/** @type {ArousalFactor} */
	Self: 2,
	/** @type {ArousalFactor} */
	Other: 2,
};

/**
 * Namespace with default values for {@link ArousalFetish} properties.
 * @satisfies {ArousalFetish}
 * @namespace
 */
var PreferenceArousalFetishDefault = {
	Name: /** @type {never} */ (undefined),
	/** @type {ArousalFactor} */
	Factor: 2,
};

/**
 * Namespace with default values for {@link ArousalZone} properties.
 * @satisfies {ArousalZone}
 * @namespace
 */
var PreferenceArousalZoneDefault = {
	Name: /** @type {never} */ (undefined),
	/** @type {ArousalFactor} */
	Factor: 2,
	/** @type {boolean} */
	Orgasm: false,
};

/**
 * Which zones are considered erogenous by default
 * @type {AssetGroupName[]}
 */
var PreferenceArousalZoneOrgasmDefault = ["ItemVulva", "ItemVulvaPiercings"];

/**
 * Namespace with default values for {@link ArousalSettingsType} properties.
 * @type {Required<ArousalSettingsType>}
 * @namespace
 */
var PreferenceArousalSettingsDefault = {
	Active: "Hybrid",
	Visible: "Access",
	ShowOtherMeter: true,
	AffectExpression: true,
	AffectStutter: "All",
	VFX: "VFXAnimatedTemp",
	VFXVibrator: "VFXVibratorAnimated",
	VFXFilter: "VFXFilterLight",
	Progress: 0,
	ProgressTimer: 0,
	VibratorLevel: 0,
	ChangeTime: 0,
	// Next three are initialized lazily since they depend on the loaded assets
	Activity: "",
	Zone: "",
	Fetish: "",
	OrgasmTimer: 0,
	OrgasmStage: 0,
	OrgasmCount: 0,
	DisableAdvancedVibes: false,
	AffectErection: true,
};

/**
 * Updates all of the validation "keys" based on the currently registered assets, groups, and activities
 */
function PreferenceArousalUpdateValidation() {
	// Indexed by ActivityID, which has holes, so size it to the highest ID rather than the activity count
	const activityIDs = AssetAllActivities("Female3DCG").map((a) => a.ActivityID).filter((id) => CommonIsNonNegativeInteger(id));
	PreferenceArousalSettingsDefault.Activity = PreferenceArousalActivityToChar(PreferenceActivityEnjoymentDefault.Self, PreferenceActivityEnjoymentDefault.Other)
		.repeat(Math.max(-1, ...activityIDs) + 1);

	// By default on new characters, all zones are of neutral preference and vulva/clit can trigger an orgasm
	const zones = AssetGroup.map((group) =>
		({
			...PreferenceArousalZoneDefault,
			Name: (group?.IsItem() && group.ArousalZoneID !== undefined) ? group.Name : undefined,
			Orgasm: PreferenceArousalZoneOrgasmDefault.includes(group.Name),
		}))
		.filter(({ Name }) => Name !== undefined)
		.sort(({ Name: aName }, { Name: bName }) =>
			// @ts-ignore Strict-TS: We're guaranteed to only have arousal groups in there
			AssetGroupGet("Female3DCG", aName).ArousalZoneID - AssetGroupGet("Female3DCG", bName).ArousalZoneID);
	PreferenceArousalSettingsDefault.Zone = zones
		.map(act => PreferenceArousalZoneToChar(act.Factor, act.Orgasm))
		.join("");

	const fetishes = AssetAllFetishes("Female3DCG")
		.filter(f => f.FetishID != null)
		.map(({ Name }) => ({ ...PreferenceArousalFetishDefault, Name }))
		.sort(({ Name: aName }, { Name: bName }) =>
			// @ts-ignore Strict-TS: We're guaranteed to only have known fetishes
			AssetGetFetish("Female3DCG", aName).FetishID - AssetGetFetish("Female3DCG", bName).FetishID);
	PreferenceArousalSettingsDefault.Fetish = fetishes
		.map(fet => PreferenceArousalFetishToChar(fet.Factor))
		.join("");
}

/**
 * Namespace with functions for validating {@link ArousalSettingsType} properties
 * @type {{ [k in keyof Required<ArousalSettingsType>]: (arg: ArousalSettingsType[k], C: Character) => ArousalSettingsType[k] }}
 * @namespace
 */
var PreferenceArousalSettingsValidate = {
	Active: (arg, C) => {
		return CommonIncludes(PreferenceArousalActiveList, arg) ? arg : PreferenceArousalSettingsDefault.Active;
	},
	Visible: (arg, C) => {
		return CommonIncludes(PreferenceArousalVisibleList, arg) ? arg : PreferenceArousalSettingsDefault.Visible;
	},
	ShowOtherMeter: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalSettingsDefault.ShowOtherMeter;
	},
	AffectExpression: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalSettingsDefault.AffectExpression;
	},
	AffectStutter: (arg, C) => {
		return CommonIncludes(PreferenceArousalAffectStutterList, arg) ? arg : PreferenceArousalSettingsDefault.AffectStutter;
	},
	VFX: (arg, C) => {
		return CommonIncludes(PreferenceSettingsVFXList, arg) ? arg : PreferenceArousalSettingsDefault.VFX;
	},
	VFXVibrator: (arg, C) => {
		return CommonIncludes(PreferenceSettingsVFXVibratorList, arg) ? arg : PreferenceArousalSettingsDefault.VFXVibrator;
	},
	VFXFilter: (arg, C) => {
		return CommonIncludes(PreferenceSettingsVFXFilterList, arg) ? arg : PreferenceArousalSettingsDefault.VFXFilter;
	},
	Progress: (arg, C) => {
		return CommonIsInteger(arg, 0, 100) ? arg : PreferenceArousalSettingsDefault.Progress;
	},
	ProgressTimer: (arg, C) => {
		return CommonIsInteger(arg, 0, 100) ? arg : PreferenceArousalSettingsDefault.ProgressTimer;
	},
	VibratorLevel: (arg, C) => {
		return CommonIsInteger(arg, 0, 4) ? /** @type {0 | 1 | 2 | 3 | 4} */(arg) : PreferenceArousalSettingsDefault.VibratorLevel;
	},
	ChangeTime: (arg, C) => {
		return CommonIsInteger(arg, 0, CommonTime()) ? arg : PreferenceArousalSettingsDefault.ChangeTime;
	},
	Activity: (arg, C) => {
		if (PreferenceArousalSettingsDefault.Activity === "") {
			PreferenceArousalUpdateValidation();
		}
		if (CommonIsArray(arg)) {
			// Old object-based activities
			let newActivity = PreferenceArousalSettingsDefault.Activity;
			const objectArousalSettings = /** @type {{ Name: string, Self: number, Other: number}[]} */ (/** @type {unknown} */ (arg));
			for (let oldActivity of objectArousalSettings) {
				if (!CommonIsObject(oldActivity) || typeof oldActivity.Name !== "string" || typeof oldActivity.Self === "number" || typeof oldActivity.Other === "number") continue;

				const activity = AssetGetActivity(C.AssetFamily, oldActivity.Name);
				if (!activity) continue;

				newActivity = newActivity.substring(0, activity.ActivityID) + PreferenceArousalActivityToChar(oldActivity.Self, oldActivity.Other) + newActivity.substring(activity.ActivityID + 1);
			}
			return newActivity;
		}
		if (typeof arg !== "string") return PreferenceArousalSettingsDefault.Activity;

		while (arg.length < PreferenceArousalSettingsDefault.Activity.length)
			arg = arg + PreferenceArousalActivityToChar(PreferenceActivityEnjoymentDefault.Self, PreferenceActivityEnjoymentDefault.Other);
		if (arg.length > PreferenceArousalSettingsDefault.Activity.length)
			arg = arg.substring(0, PreferenceArousalSettingsDefault.Activity.length);
		return arg;
	},
	Zone: (arg, C) => {
		// Set up the defaults for arousal zones now that we're done loading groups
		if (PreferenceArousalSettingsDefault.Zone === "") {
			PreferenceArousalUpdateValidation();
		}
		if (CommonIsArray(arg)) {
			// Old object-based zones
			let newZone = PreferenceArousalSettingsDefault.Zone;
			const objectZoneSettings = /** @type {{ Name: AssetGroupItemName, Factor: ArousalFactor, Orgasm: boolean }[]} */ (/** @type {unknown} */ (arg));
			for (let oldZone of objectZoneSettings) {
				if (!CommonIsObject(oldZone) || typeof oldZone.Name !== "string" || typeof oldZone.Factor !== "number" || typeof oldZone.Orgasm !== "boolean") continue;

				const group = AssetGroupGet(C.AssetFamily, oldZone.Name);
				if (!group || !group.IsItem() || group.ArousalZoneID === undefined) continue;

				newZone = newZone.substring(0, group.ArousalZoneID) + PreferenceArousalZoneToChar(oldZone.Factor, oldZone.Orgasm) + newZone.substring(group.ArousalZoneID + 1);
			}
			return newZone;
		}
		if (typeof arg !== "string") return PreferenceArousalSettingsDefault.Zone;

		while (arg.length < PreferenceArousalSettingsDefault.Zone.length)
			arg = arg + PreferenceArousalZoneToChar(PreferenceArousalZoneDefault.Factor, PreferenceArousalZoneDefault.Orgasm);
		if (arg.length > PreferenceArousalSettingsDefault.Zone.length)
			arg = arg.substring(0, PreferenceArousalSettingsDefault.Zone.length);
		return arg;
	},
	Fetish: (arg, C) => {
		if (PreferenceArousalSettingsDefault.Fetish === "") {
			PreferenceArousalUpdateValidation();
		}
		if (CommonIsArray(arg)) {
			// Old object-based fetishes
			let newFetish = PreferenceArousalSettingsDefault.Fetish;
			const objectFetishSettings = /** @type {{ Name: FetishName, Factor: ArousalFactor }[]} */ (/** @type {unknown} */ (arg));
			for (let oldFetish of objectFetishSettings) {
				if (!CommonIsObject(oldFetish) || typeof oldFetish.Name !== "string" || typeof oldFetish.Factor !== "number") continue;

				const fetish = AssetGetFetish(C.AssetFamily, oldFetish.Name);
				if (!fetish) continue;

				newFetish = newFetish.substring(0, fetish.FetishID) + PreferenceArousalFetishToChar(oldFetish.Factor) + newFetish.substring(fetish.FetishID + 1);
			}
			return newFetish;
		}
		if (typeof arg !== "string") return PreferenceArousalSettingsDefault.Fetish;

		while (arg.length < PreferenceArousalSettingsDefault.Fetish.length)
			arg = arg + PreferenceArousalFetishToChar(PreferenceArousalFetishDefault.Factor);
		if (arg.length > PreferenceArousalSettingsDefault.Fetish.length)
			arg = arg.substring(0, PreferenceArousalSettingsDefault.Fetish.length);
		return arg;
	},
	OrgasmTimer: (arg, C) => {
		return CommonIsFinite(arg, 0) ? arg : PreferenceArousalSettingsDefault.OrgasmTimer;
	},
	OrgasmStage: (arg, C) => {
		return CommonIsInteger(arg, 0, 2) ? /** @type {0 | 1 | 2} */(arg) : PreferenceArousalSettingsDefault.OrgasmStage;
	},
	OrgasmCount: (arg, C) => {
		return CommonIsInteger(arg, 0) ? arg : PreferenceArousalSettingsDefault.OrgasmCount;
	},
	DisableAdvancedVibes: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalSettingsDefault.DisableAdvancedVibes;
	},
	AffectErection: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceArousalSettingsDefault.AffectErection;
	},
};

/**
 * Namespace with default values for {@link CharacterOnlineSharedSettings} properties.
 * @type {CharacterOnlineSharedSettings}
 * @namespace
 */
var PreferenceOnlineSharedSettingsDefault = {
	GameVersion: undefined,
	AllowFullWardrobeAccess: false,
	BlockBodyCosplay: false,
	AllowPlayerLeashing: true,
	AllowRename: true,
	DisablePickingLocksOnSelf: false,
	ItemsAffectExpressions: true,
	WheelFortune: "", // Initialized in `WheelFortune.js`
	ScriptPermissions: {
		Hide: { permission: 0 },
		Block: { permission: 0 },
	},
	LockTimerLimit: "LockTimerLimitDefault"
};

/**
 * Namespace with default values for {@link CharacterOnlineSharedSettings} properties.
 * @type {{ [k in keyof Required<CharacterOnlineSharedSettings>]: (arg: CharacterOnlineSharedSettings[k], C: Character) => CharacterOnlineSharedSettings[k] }}
 * @namespace
 */
var PreferenceOnlineSharedSettingsValidate = {
	GameVersion: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceOnlineSharedSettingsDefault.GameVersion;
	},
	AllowFullWardrobeAccess: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.AllowFullWardrobeAccess;
	},
	BlockBodyCosplay: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.BlockBodyCosplay;
	},
	AllowPlayerLeashing: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.AllowPlayerLeashing;
	},
	AllowRename: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.AllowRename;
	},
	DisablePickingLocksOnSelf: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.DisablePickingLocksOnSelf;
	},
	ItemsAffectExpressions: (arg, C) => {
		return typeof arg === "boolean" ? arg : PreferenceOnlineSharedSettingsDefault.ItemsAffectExpressions;
	},
	WheelFortune: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceOnlineSharedSettingsDefault.WheelFortune;
	},
	ScriptPermissions: (arg, C) => {
		if (!CommonIsObject(arg)) {
			return CommonCloneDeep(PreferenceOnlineSharedSettingsDefault.ScriptPermissions);
		}

		return {
			Hide: {
				permission: CommonIsInteger(arg.Hide?.permission, 0, maxScriptPermission) ? arg.Hide.permission : 0,
			},
			Block: {
				permission: CommonIsInteger(arg.Block?.permission, 0, maxScriptPermission) ? arg.Block.permission : 0,
			},
		};
	},
	LockTimerLimit: (arg, C) => {
		return PreferenceSettingsLockTimerLimitList.includes(arg) ? arg : PreferenceOnlineSettingsDefault.LockTimerLimit;
	},
};


/**
 * Namespace with default values for {@link ChatSettingsType} properties.
 * @type {Required<ChatSettingsType>}
 * @namespace
 */
var PreferenceChatSettingsDefault = {
	ColorActions: true,
	ColorActivities: true,
	ColorEmotes: true,
	ColorNames: true,
	ColorTheme: "Light",
	DisplayTimestamps: true,
	EnterLeave: "Normal",
	FontSize: "Medium",
	MemberNumbers: "Always",
	MuStylePoses: false,
	ShowActivities: true,
	ShowAutomaticMessages: false,
	ShowBeepChat: true,
	ShowChatHelp: true,
	ShrinkNonDialogue: false,
	WhiteSpace: "Preserve",
	CensoredWordsList: "",
	CensoredWordsLevel: 0,
	PreserveChat: true,
	OOCAutoClose: true,
	DisableReplies: false,
	ShowFriendRequestMessages: true,
};

/**
 * Namespace with functions for validating {@link ChatSettingsType} properties
 * @type {{ [k in keyof Required<ChatSettingsType>]: (arg: ChatSettingsType[k], C: Character) => ChatSettingsType[k] }}
 * @namespace
 */
var PreferenceChatSettingsValidate = {
	ColorActions: ServerValidation.isBool(PreferenceChatSettingsDefault.ColorActions),
	ColorActivities: ServerValidation.isBool(PreferenceChatSettingsDefault.ColorActivities),
	ColorEmotes: ServerValidation.isBool(PreferenceChatSettingsDefault.ColorEmotes),
	ColorNames: ServerValidation.isBool(PreferenceChatSettingsDefault.ColorNames),
	ColorTheme: ServerValidation.isItem(PreferenceChatColorThemeList, PreferenceChatSettingsDefault.ColorTheme),
	DisplayTimestamps: ServerValidation.isBool(PreferenceChatSettingsDefault.DisplayTimestamps),
	EnterLeave: ServerValidation.isItem(PreferenceChatEnterLeaveList, PreferenceChatSettingsDefault.EnterLeave),
	FontSize: ServerValidation.isItem(PreferenceChatFontSizeList, PreferenceChatSettingsDefault.FontSize),
	MemberNumbers: ServerValidation.isItem(PreferenceChatMemberNumbersList, PreferenceChatSettingsDefault.MemberNumbers),
	MuStylePoses: ServerValidation.isBool(PreferenceChatSettingsDefault.MuStylePoses),
	ShowActivities: ServerValidation.isBool(PreferenceChatSettingsDefault.ShowActivities),
	ShowAutomaticMessages: ServerValidation.isBool(PreferenceChatSettingsDefault.ShowAutomaticMessages),
	ShowBeepChat: ServerValidation.isBool(PreferenceChatSettingsDefault.ShowBeepChat),
	ShowChatHelp: ServerValidation.isBool(PreferenceChatSettingsDefault.ShowChatHelp),
	ShrinkNonDialogue: ServerValidation.isBool(PreferenceChatSettingsDefault.ShrinkNonDialogue),
	WhiteSpace: ServerValidation.isItem(["", "Preserve"], PreferenceChatSettingsDefault.WhiteSpace),
	CensoredWordsList: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceChatSettingsDefault.CensoredWordsList;
	},
	CensoredWordsLevel: (arg, C) => {
		return CommonIsInteger(arg, 0, 2) ? arg : PreferenceChatSettingsDefault.CensoredWordsLevel;
	},
	PreserveChat: ServerValidation.isBool(PreferenceChatSettingsDefault.PreserveChat),
	OOCAutoClose: ServerValidation.isBool(PreferenceChatSettingsDefault.OOCAutoClose),
	DisableReplies: ServerValidation.isBool(PreferenceChatSettingsDefault.DisableReplies),
	ShowFriendRequestMessages: ServerValidation.isBool(PreferenceChatSettingsDefault.ShowFriendRequestMessages),
};

/**
 * Namespace with default values for {@link VisualSettingsType} properties.
 * @type {VisualSettingsType}
 * @namespace
 */
var PreferenceVisualSettingsDefault = {
	ForceFullHeight: false,
	UseCharacterInPreviews: false,
	ShowCharactersInWardrobe: false,
	MainHallBackground: undefined,
	PrivateRoomBackground: undefined,
};

/**
 * Namespace with functions for validating {@link VisualSettingsType} properties
 * @type {{ [k in keyof Required<VisualSettingsType>]: (arg: VisualSettingsType[k], C: Character) => VisualSettingsType[k] }}
 * @namespace
 */
var PreferenceVisualSettingsValidate = {
	ForceFullHeight: ServerValidation.isBool(PreferenceVisualSettingsDefault.ForceFullHeight),
	UseCharacterInPreviews: ServerValidation.isBool(PreferenceVisualSettingsDefault.UseCharacterInPreviews),
	ShowCharactersInWardrobe: ServerValidation.isBool(PreferenceVisualSettingsDefault.ShowCharactersInWardrobe),
	MainHallBackground: (arg, C) => {
		return typeof arg === "string" && arg.length && arg !== "MainHall" ? arg : PreferenceVisualSettingsDefault.MainHallBackground;
	},
	PrivateRoomBackground: (arg, C) => {
		return typeof arg === "string" && arg.length && arg !== "Private" ? arg : PreferenceVisualSettingsDefault.PrivateRoomBackground;
	}
};

/**
 * Namespace with default values for {@link AudioSettingsType} properties.
 * @type {Required<AudioSettingsType>}
 * @namespace
 */
var PreferenceAudioSettingsDefault = {
	Volume: 1,
	MusicVolume: 1,
	PlayItem: false,
	PlayItemPlayerOnly: false,
	Notifications: false,
	// @ts-expect-error deprecated
	PlayBeeps: undefined,
};

/**
 * Namespace with functions for validating {@link AudioSettingsType} properties
 * @type {{ [k in keyof Required<AudioSettingsType>]: (arg: AudioSettingsType[k], C: Character) => AudioSettingsType[k] }}
 * @namespace
 */
var PreferenceAudioSettingsValidate = {
	Volume: (arg) => {
		return CommonIsFinite(arg, 0, 1) ? arg : PreferenceAudioSettingsDefault.Volume;
	},
	MusicVolume: (arg) => {
		return CommonIsFinite(arg, 0, 1) ? arg : PreferenceAudioSettingsDefault.MusicVolume;
	},
	PlayItem: ServerValidation.isBool(PreferenceAudioSettingsDefault.PlayItem),
	PlayItemPlayerOnly: ServerValidation.isBool(PreferenceAudioSettingsDefault.PlayItemPlayerOnly),
	Notifications: ServerValidation.isBool(PreferenceAudioSettingsDefault.Notifications),
	// @ts-expect-error deprecated
	PlayBeeps: (arg) => undefined,
};

/**
 * Namespace with default values for {@link ControllerSettingsType} properties.
 * @type {Required<ControllerSettingsType>}
 * @namespace
 */
var PreferenceControllerSettingsDefault = {
	ControllerActive: false,
	ControllerSensitivity: 5,
	ControllerDeadZone: 0.01,
	Buttons: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16 },
	Axis: {0: 0, 1: 1, 2: 2, 3: 3},
};

/**
 * Namespace with functions for validating {@link ControllerSettingsType} properties
 * @type {{ [k in keyof Required<ControllerSettingsType>]: (arg: ControllerSettingsType[k], C: Character) => ControllerSettingsType[k] }}
 * @namespace
 */
var PreferenceControllerSettingsValidate = {
	ControllerActive: ServerValidation.isBool(PreferenceControllerSettingsDefault.ControllerActive),
	ControllerSensitivity: ServerValidation.isItem(PreferenceSettingsSensitivityList, PreferenceControllerSettingsDefault.ControllerSensitivity),
	ControllerDeadZone: ServerValidation.isItem(PreferenceSettingsDeadZoneList, PreferenceControllerSettingsDefault.ControllerDeadZone),
	Buttons: (arg) => { return arg; },
	Axis: (arg) => { return arg; },
};

/**
 * Namespace with default values for {@link GameplaySettingsType} properties.
 * @type {Required<GameplaySettingsType>}
 * @namespace
 */
var PreferenceGameplaySettingsDefault = {
	SensDepChatLog: "Normal",
	BlindDisableExamine: false,
	DisableAutoRemoveLogin: false,
	ImmersionLockSetting: false,
	EnableSafeword: true,
	DisableAutoMaid: false,
	OfflineLockedRestrained: false,
};

/**
 * Namespace with functions for validating {@link GameplaySettingsType} properties
 * @type {{ [k in keyof Required<GameplaySettingsType>]: (arg: GameplaySettingsType[k], C: Character) => GameplaySettingsType[k] }}
 * @namespace
 */
var PreferenceGameplaySettingsValidate = {
	SensDepChatLog: ServerValidation.isItem(PreferenceSettingsSensDepList, PreferenceGameplaySettingsDefault.SensDepChatLog),
	BlindDisableExamine: ServerValidation.isBool(PreferenceGameplaySettingsDefault.BlindDisableExamine),
	DisableAutoRemoveLogin: ServerValidation.isBool(PreferenceGameplaySettingsDefault.DisableAutoRemoveLogin),
	ImmersionLockSetting: ServerValidation.isBool(PreferenceGameplaySettingsDefault.ImmersionLockSetting),
	EnableSafeword: ServerValidation.isBool(PreferenceGameplaySettingsDefault.EnableSafeword),
	DisableAutoMaid: ServerValidation.isBool(PreferenceGameplaySettingsDefault.DisableAutoMaid),
	OfflineLockedRestrained: ServerValidation.isBool(PreferenceGameplaySettingsDefault.OfflineLockedRestrained),
};

/**
 * Namespace with default values for {@link ImmersionSettingsType} properties.
 * @type {Required<ImmersionSettingsType>}
 * @namespace
 */
var PreferenceImmersionSettingsDefault = {
	StimulationEvents: true,
	ReturnToChatRoom: false,
	ReturnToChatRoomAdmin: false,
	ChatRoomMapLeaveOnExit: false,
	SenseDepMessages: false,
	ChatRoomMuffle: false,
	BlindAdjacent: false,
	AllowTints: true,
	ShowUngarbledMessages: true,
	// @ts-expect-error deprecated
	BlockGaggedOOC: undefined,
};

/**
 * Namespace with functions for validating {@link ImmersionSettingsType} properties
 * @type {{ [k in keyof Required<ImmersionSettingsType>]: (arg: ImmersionSettingsType[k], C: Character) => ImmersionSettingsType[k] }}
 * @namespace
 */
var PreferenceImmersionSettingsValidate = {
	StimulationEvents: ServerValidation.isBool(PreferenceImmersionSettingsDefault.StimulationEvents),
	ReturnToChatRoom: ServerValidation.isBool(PreferenceImmersionSettingsDefault.ReturnToChatRoom),
	ReturnToChatRoomAdmin: ServerValidation.isBool(PreferenceImmersionSettingsDefault.ReturnToChatRoomAdmin),
	ChatRoomMapLeaveOnExit: ServerValidation.isBool(PreferenceImmersionSettingsDefault.ChatRoomMapLeaveOnExit),
	SenseDepMessages: ServerValidation.isBool(PreferenceImmersionSettingsDefault.SenseDepMessages),
	ChatRoomMuffle: ServerValidation.isBool(PreferenceImmersionSettingsDefault.ChatRoomMuffle),
	BlindAdjacent: ServerValidation.isBool(PreferenceImmersionSettingsDefault.BlindAdjacent),
	AllowTints: ServerValidation.isBool(PreferenceImmersionSettingsDefault.AllowTints),
	ShowUngarbledMessages: ServerValidation.isBool(PreferenceImmersionSettingsDefault.ShowUngarbledMessages),
	// @ts-expect-error deprecated
	BlockGaggedOOC: (arg) => undefined,
};

/**
 * Namespace with default values for {@link RestrictionSettingsType} properties.
 * @type {Required<RestrictionSettingsType>}
 * @namespace
 */
var PreferenceRestrictionSettingsDefault = {
	BypassStruggle: false,
	SlowImmunity: false,
	BypassNPCPunishments: false,
	NoSpeechGarble: false,
};

/**
 * Namespace with functions for validating {@link RestrictionSettingsType} properties
 * @type {{ [k in keyof Required<RestrictionSettingsType>]: (arg: RestrictionSettingsType[k], C: Character) => RestrictionSettingsType[k] }}
 * @namespace
 */
var PreferenceRestrictionSettingsValidate = {
	BypassStruggle: ServerValidation.isBool(PreferenceRestrictionSettingsDefault.BypassStruggle),
	SlowImmunity: ServerValidation.isBool(PreferenceRestrictionSettingsDefault.SlowImmunity),
	BypassNPCPunishments: ServerValidation.isBool(PreferenceRestrictionSettingsDefault.BypassNPCPunishments),
	NoSpeechGarble: ServerValidation.isBool(PreferenceRestrictionSettingsDefault.NoSpeechGarble),
};

/**
 * Namespace with default values for {@link PlayerOnlineSettings} properties.
 * @type {Required<PlayerOnlineSettings>}
 * @namespace
 */
var PreferenceOnlineSettingsDefault = {
	AutoBanBlackList: false,
	AutoBanGhostList: true,
	RespondRemoteModListQueries: true,
	DisableAnimations: false,
	SearchFriendsFirst: false,
	EnableAfkTimer: true,
	ShowStatus: true,
	SendStatus: true,
	FriendListAutoRefresh: true,
	ShowRoomCustomization: 1,
	DefaultChatRoomBackground: "CosyChalet",
	// @ts-expect-error Deprecated
	SearchShowsFullRooms: undefined,
	LockTimerLimit: "LockTimerLimitDefault"
};

/**
 * Namespace with functions for validating {@link PlayerOnlineSettings} properties
 * @type {{ [k in keyof Required<PlayerOnlineSettings>]: (arg: PlayerOnlineSettings[k], C: Character) => PlayerOnlineSettings[k] }}
 * @namespace
 */
var PreferenceOnlineSettingsValidate = {
	AutoBanBlackList: ServerValidation.isBool(PreferenceOnlineSettingsDefault.AutoBanBlackList),
	AutoBanGhostList: ServerValidation.isBool(PreferenceOnlineSettingsDefault.AutoBanGhostList),
	RespondRemoteModListQueries: ServerValidation.isBool(PreferenceOnlineSettingsDefault.RespondRemoteModListQueries),
	DisableAnimations: ServerValidation.isBool(PreferenceOnlineSettingsDefault.DisableAnimations),
	SearchFriendsFirst: ServerValidation.isBool(PreferenceOnlineSettingsDefault.SearchFriendsFirst),
	EnableAfkTimer: ServerValidation.isBool(PreferenceOnlineSettingsDefault.EnableAfkTimer),
	ShowStatus: ServerValidation.isBool(PreferenceOnlineSettingsDefault.ShowStatus),
	SendStatus: ServerValidation.isBool(PreferenceOnlineSettingsDefault.SendStatus),
	FriendListAutoRefresh: ServerValidation.isBool(PreferenceOnlineSettingsDefault.FriendListAutoRefresh),
	ShowRoomCustomization: ServerValidation.isInt(0, 4, PreferenceOnlineSettingsDefault.ShowRoomCustomization),
	DefaultChatRoomBackground: (arg, C) => {
		return typeof arg === "string" ? arg : PreferenceOnlineSettingsDefault.DefaultChatRoomBackground;
	},
	LockTimerLimit: ServerValidation.isItem(PreferenceSettingsLockTimerLimitList, PreferenceOnlineSettingsDefault.LockTimerLimit),
};

/**
 * Namespace with default values for {@link GraphicsSettingsType} properties.
 * @type {Required<GraphicsSettingsType>}
 * @namespace
 */
var PreferenceGraphicsSettingsDefault = {
	Font: "Arial",
	InvertRoom: true,
	StimulationFlash: false,
	DoBlindFlash: false,
	AnimationQuality: 100,
	SmoothZoom: true,
	CenterChatrooms: true,
	AllowBlur: true,
	MaxFPS: DEFAULT_FRAMERATE,
	MaxUnfocusedFPS: 0,
	ShowFPS: false,
	ShowFullscreenButton: "on_when_mobile",
};

/**
 * Namespace with functions for validating {@link GraphicsSettingsType} properties
 * @type {{ [k in keyof Required<GraphicsSettingsType>]: (arg: GraphicsSettingsType[k], C: Character) => GraphicsSettingsType[k] }}
 * @namespace
 */
var PreferenceGraphicsSettingsValidate = {
	Font: ServerValidation.isItem(PreferenceGraphicsFontList, PreferenceGraphicsSettingsDefault.Font),
	InvertRoom: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.InvertRoom),
	StimulationFlash: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.StimulationFlash),
	DoBlindFlash: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.DoBlindFlash),
	AnimationQuality: ServerValidation.isItem(PreferenceGraphicsAnimationQualityList, PreferenceGraphicsSettingsDefault.AnimationQuality),
	SmoothZoom: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.SmoothZoom),
	CenterChatrooms: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.CenterChatrooms),
	AllowBlur: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.AllowBlur),
	MaxFPS: ServerValidation.isItem(PreferenceGraphicsFrameLimit, PreferenceGraphicsSettingsDefault.MaxFPS),
	MaxUnfocusedFPS: ServerValidation.isItem(PreferenceGraphicsFrameLimit, PreferenceGraphicsSettingsDefault.MaxUnfocusedFPS),
	ShowFPS: ServerValidation.isBool(PreferenceGraphicsSettingsDefault.ShowFPS),
	ShowFullscreenButton: ServerValidation.isItem(PreferenceGraphicsFullscreenButtonList, PreferenceGraphicsSettingsDefault.ShowFullscreenButton),
};

/**
 * Namespace with default values for {@link GenderSettingsType} properties.
 * @type {Required<GenderSettingsType>}
 * @namespace
 */
var PreferenceGenderSettingsDefault = {
	AutoJoinSearch: { Female: false, Male: false },
	HideShopItems: { Female: false, Male: false },
	HideTitles: { Female: false, Male: false },
};

/**
 * Namespace with functions for validating {@link GenderSettingsType} properties
 * @type {{ [k in keyof Required<GenderSettingsType>]: (arg: GenderSettingsType[k], C: Character) => GenderSettingsType[k] }}
 * @namespace
 */
var PreferenceGenderSettingsValidate = {
	AutoJoinSearch: ServerValidation.hasSameShape(PreferenceGenderSettingsDefault.AutoJoinSearch),
	HideShopItems: ServerValidation.hasSameShape(PreferenceGenderSettingsDefault.HideShopItems),
	HideTitles: ServerValidation.hasSameShape(PreferenceGenderSettingsDefault.HideTitles),
};

/**
 * Namespace with default values for {@link NotificationSettingsType} properties.
 * @type {Required<NotificationSettingsType>}
 * @namespace
 */
var PreferenceNotificationSettingsDefault = {
	Beeps: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.POPUP },
	ChatMessage: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.NONE, Normal: true, Whisper: true, Activity: false, Mention: false },
	ChatJoin: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.NONE, Owner: false, Lovers: false, Friendlist: false, Subs: false },
	Disconnect: { Audio: NotificationAudioType.FIRST, AlertType: NotificationAlertType.NONE },
	Larp: { Audio: NotificationAudioType.NONE, AlertType: NotificationAlertType.NONE },
	Test: { Audio: NotificationAudioType.NONE, AlertType: NotificationAlertType.TITLEPREFIX },
};

/**
 * Namespace with functions for validating {@link NotificationSettingsType} properties
 * @type {{ [k in keyof Required<NotificationSettingsType>]: (arg: Partial<NotificationSettingsType[k]>, C: Character) => NotificationSettingsType[k] }}
 * @namespace
 */
var PreferenceNotificationSettingsValidate = {
	Beeps: ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.Beeps),
	ChatMessage: (arg) => {
		return {
			...ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.ChatMessage)(arg),
			Normal: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatMessage.Normal)(arg?.Normal),
			Whisper: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatMessage.Whisper)(arg?.Whisper),
			Activity: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatMessage.Activity)(arg?.Activity),
			Mention: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatMessage.Mention)(arg?.Mention),
		};
	},
	ChatJoin: (arg) => {
		return {
			...ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.ChatJoin)(arg),
			Owner: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatJoin.Owner)(arg?.Owner),
			Lovers: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatJoin.Lovers)(arg?.Lovers),
			Friendlist: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatJoin.Friendlist)(arg?.Friendlist),
			Subs: ServerValidation.isBool(PreferenceNotificationSettingsDefault.ChatJoin.Subs)(arg?.Subs),
		};
	},
	Disconnect: ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.Disconnect),
	Larp: ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.Larp),
	Test: ServerValidation.isValidNotification(PreferenceNotificationSettingsDefault.Test),
};

/**
 * Registers a new extension setting to the preference screen
 * @public
 * @param {PreferenceExtensionsSettingItem} Setting - The extension setting to register
 * @returns {void} - Nothing
 */
function PreferenceRegisterExtensionSetting(Setting) {
	if((typeof Setting.Identifier !== "string" || Setting.Identifier.length < 1)
		|| typeof Setting.load !== "function"
		|| typeof Setting.run !== "function"
		|| typeof Setting.click !== "function"
		|| (typeof Setting.ButtonText !== "string" && typeof Setting.ButtonText !== "function")
		|| (typeof Setting.Image !== "string" && typeof Setting.Image !== "function" && typeof Setting.Image !== "undefined")) {
		console.error("Invalid extension setting");
		return;
	}
	// Setting Names must be unique
	const existing = PreferenceExtensionsSettings[Setting.Identifier];
	if(existing) {
		console.error(`Extension setting "${existing.Identifier}" already exists`);
		return;
	}
	PreferenceExtensionsSettings[Setting.Identifier] = Setting;

	PreferenceExtensionsSettings = Object.fromEntries(
		Object.entries(PreferenceExtensionsSettings)
			.sort(([, a], [, b]) => {
				const textA = typeof a.ButtonText === "function" ? a.ButtonText() : a.ButtonText;
				const textB = typeof b.ButtonText === "function" ? b.ButtonText() : b.ButtonText;
				return textA.localeCompare(textB);
			})
	);
}

/**
 * Return a new object with default item permissions
 * @returns {ItemPermissions} - The item permissions
 */
function PreferencePermissionGetDefault() {
	return {
		Hidden: false,
		Permission: "Default",
		TypePermissions: {},
	};
}
