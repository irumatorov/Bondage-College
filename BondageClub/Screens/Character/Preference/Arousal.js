"use strict";

function PreferenceSubscreenArousalLoad() {
	CharacterAppearanceForceUpCharacter = Player.MemberNumber;
	PreferenceArousalActiveIndex = (PreferenceArousalActiveList.indexOf(Player.ArousalSettings.Active) < 0) ? 0 : PreferenceArousalActiveList.indexOf(Player.ArousalSettings.Active);
	PreferenceArousalVisibleIndex = (PreferenceArousalVisibleList.indexOf(Player.ArousalSettings.Visible) < 0) ? 0 : PreferenceArousalVisibleList.indexOf(Player.ArousalSettings.Visible);
	PreferenceArousalAffectStutterIndex = (PreferenceArousalAffectStutterList.indexOf(Player.ArousalSettings.AffectStutter) < 0) ? 0 : PreferenceArousalAffectStutterList.indexOf(Player.ArousalSettings.AffectStutter);

	// Prepares the activity list
	PreferenceArousalActivityList = [];
	if (Player.AssetFamily == "Female3DCG")
		for (let A = 0; A < ActivityFemale3DCG.length; A++)
			PreferenceArousalActivityList.push(ActivityFemale3DCG[A].Name);
	PreferenceArousalActivityIndex = 0;

	// Prepares the fetish list
	PreferenceArousalFetishList = [];
	if (Player.AssetFamily == "Female3DCG")
		for (let A = 0; A < FetishFemale3DCG.length; A++)
			PreferenceArousalFetishList.push(FetishFemale3DCG[A].Name);
	PreferenceArousalFetishIndex = 0;
}

/**
 * Sets the arousal preferences for a player. Redirected to from the main Run function if the player is in the arousal
 * settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenArousalRun() {

	// Draws the main labels and player
	DrawCharacter(Player, 50, 50, 0.9, false);
	MainCanvas.textAlign = "left";
	DrawText(TextGet("ArousalActive"), 550, 225, "Black", "Gray");
	DrawText(TextGet("ArousalStutter"), 550, 460, "Black", "Gray");
	DrawCheckbox(550, 276, 64, 64, TextGet("ArousalShowOtherMeter"), Player.ArousalSettings.ShowOtherMeter);
	DrawCheckbox(550, 356, 64, 64, TextGet("ArousalDisableAdvancedVibes"), Player.ArousalSettings.DisableAdvancedVibes, Player.GetDifficulty() >= 3);


	// The other controls are only drawn if the arousal is active
	if (PreferenceArousalIsActive()) {

		// Draws the labels and check boxes
		DrawCheckbox(1250, 276, 64, 64, TextGet("ArousalAffectExpression"), Player.ArousalSettings.AffectExpression);
		DrawCheckbox(1505, 356, 64, 64, TextGet("ArousalAffectErection"), Player.ArousalSettings.AffectErection);
		DrawText(TextGet("ArousalVisible"), 1240, 225, "Black", "Gray");
		DrawText(TextGet("ArousalFetish"), 550, 555, "Black", "Gray");
		DrawText(TextGet("ArousalActivity"), 550, 640, "Black", "Gray");
		DrawText(TextGet("ArousalActivityLoveSelf"), 550, 725, "Black", "Gray");
		DrawText(TextGet("ArousalActivityLoveOther"), 1255, 725, "Black", "Gray");

		// Draws all the available character zones
		for (let Group of AssetGroup) {
			if (Group.IsItem() && !Group.MirrorActivitiesFrom && AssetActivitiesForGroup("Female3DCG", Group.Name).length)
				DrawAssetGroupZone(Player, Group.Zone, 0.9, 50, 50, 1, "#808080FF", 3, PreferenceGetFactorColor(PreferenceGetZoneFactor(Player, Group.Name)));
		}

		// The zones can be selected and drawn on the character
		if (Player.FocusGroup != null) {
			DrawCheckbox(1230, 853, 64, 64, TextGet("ArousalAllowOrgasm"), PreferenceGetZoneOrgasm(Player, Player.FocusGroup.Name));
			DrawText(TextGet("ArousalZone" + Player.FocusGroup.Name) + " - " + TextGet("ArousalConfigureErogenousZones"), 550, 795, "Black", "Gray");
			DrawAssetGroupZone(Player, Player.FocusGroup.Zone, 0.9, 50, 50, 1, "cyan");
			DrawBackNextButton(550, 853, 600, 64, TextGet("ArousalZoneLove" + PreferenceGetZoneFactor(Player, Player.FocusGroup.Name)), PreferenceGetFactorColor(PreferenceGetZoneFactor(Player, Player.FocusGroup.Name)), "", () => "", () => "");
		}
		else DrawText(TextGet("ArousalSelectErogenousZones"), 550, 795, "Black", "Gray");

		// Draws the sub-selection controls
		DrawBackNextButton(1505, 193, 400, 64, TextGet("ArousalVisible" + PreferenceArousalVisibleList[PreferenceArousalVisibleIndex]), "White", "", () => "", () => "");
		DrawBackNextButton(900, 598, 500, 64, ActivityDictionaryText("Activity" + PreferenceArousalActivityList[PreferenceArousalActivityIndex]), "White", "", () => "", () => "");
		const selfFactor = PreferenceGetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], true);
		const otherFactor = PreferenceGetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], false);
		DrawBackNextButton(900, 683, 300, 64, TextGet("ArousalActivityLove" + selfFactor), PreferenceGetFactorColor(selfFactor), "", () => "", () => "");
		DrawBackNextButton(1605, 683, 300, 64, TextGet("ArousalActivityLove" + otherFactor), PreferenceGetFactorColor(otherFactor), "", () => "", () => "");

		// Fetish elements
		DrawBackNextButton(900, 513, 500, 64, TextGet("ArousalFetish" + PreferenceArousalFetishList[PreferenceArousalFetishIndex]), "White", "", () => "", () => "");
		const fetishFactor = PreferenceGetFetishFactor(Player, PreferenceArousalFetishList[PreferenceArousalFetishIndex]);
		DrawBackNextButton(1455, 513, 450, 64, TextGet("ArousalFetishLove" + fetishFactor), PreferenceGetFactorColor(fetishFactor), "", () => "", () => "");
	}

	// We always draw the active & stutter control
	DrawBackNextButton(750, 193, 450, 64, TextGet("ArousalActive" + PreferenceArousalActiveList[PreferenceArousalActiveIndex]), "White", "", () => "", () => "");
	DrawBackNextButton(900, 428, 500, 64, TextGet("ArousalStutter" + PreferenceArousalAffectStutterList[PreferenceArousalAffectStutterIndex]), "White", "", () => "", () => "");
}

/**
 * Gets a color code for a given arousal factor
 * @param {number} Factor - The factor that should be translated in a color code
 * @returns {string} - The color for the given factor in the format "#rrggbbaa"
 */
function PreferenceGetFactorColor(Factor) {
	if (Factor == 0) return "#FF000088";
	if (Factor == 1) return "#FF000044";
	if (Factor == 3) return "#00FF0044";
	if (Factor == 4) return "#00FF0088";
	return "#80808044";
}

/**
 * Handles the click events for the arousal settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenArousalClick() {

	// Arousal active control
	if (MouseIn(750, 193, 450, 64)) {
		if (MouseX <= 975) PreferenceArousalActiveIndex = (PreferenceArousalActiveList.length + PreferenceArousalActiveIndex - 1) % PreferenceArousalActiveList.length;
		else PreferenceArousalActiveIndex = (PreferenceArousalActiveIndex + 1) % PreferenceArousalActiveList.length;
		Player.ArousalSettings.Active = PreferenceArousalActiveList[PreferenceArousalActiveIndex];
	}

	// Speech stuttering control
	if (MouseIn(900, 428, 500, 64)) {
		if (MouseX <= 1150) PreferenceArousalAffectStutterIndex = (PreferenceArousalAffectStutterList.length + PreferenceArousalAffectStutterIndex - 1) % PreferenceArousalAffectStutterList.length;
		else PreferenceArousalAffectStutterIndex = (PreferenceArousalAffectStutterIndex + 1) % PreferenceArousalAffectStutterList.length;
		Player.ArousalSettings.AffectStutter = PreferenceArousalAffectStutterList[PreferenceArousalAffectStutterIndex];
	}

	// Show other player meter check box
	if (MouseIn(550, 276, 64, 64))
		Player.ArousalSettings.ShowOtherMeter = !Player.ArousalSettings.ShowOtherMeter;

	// Block advanced modes check box
	if (MouseIn(550, 356, 64, 64) && Player.GetDifficulty() < 3)
		Player.ArousalSettings.DisableAdvancedVibes = !Player.ArousalSettings.DisableAdvancedVibes;

	// If the arousal is active, we allow more controls
	if (PreferenceArousalIsActive()) {

		// Meter affect your facial expressions check box
		if (MouseIn(1250, 276, 64, 64))
			Player.ArousalSettings.AffectExpression = !Player.ArousalSettings.AffectExpression;

		// Meter affect your erection check box
		if (MouseIn(1505, 356, 64, 64))
			Player.ArousalSettings.AffectErection = !Player.ArousalSettings.AffectErection;

		// Arousal visible control
		if (MouseIn(1505, 193, 400, 64)) {
			if (MouseX <= 1705) PreferenceArousalVisibleIndex = (PreferenceArousalVisibleList.length + PreferenceArousalVisibleIndex - 1) % PreferenceArousalVisibleList.length;
			else PreferenceArousalVisibleIndex = (PreferenceArousalVisibleIndex + 1) % PreferenceArousalVisibleList.length;
			Player.ArousalSettings.Visible = PreferenceArousalVisibleList[PreferenceArousalVisibleIndex];
		}

		// Fetish master control
		if (MouseIn(900, 513, 500, 64)) {
			if (MouseX <= 1150) PreferenceArousalFetishIndex = (PreferenceArousalFetishList.length + PreferenceArousalFetishIndex - 1) % PreferenceArousalFetishList.length;
			else PreferenceArousalFetishIndex = (PreferenceArousalFetishIndex + 1) % PreferenceArousalFetishList.length;
		}

		// Fetish love control
		if (MouseIn(1455, 513, 450, 64)) {
			const step = MouseX <= 1680 ? -1 : +1;
			let factor = PreferenceGetFetishFactor(Player, PreferenceArousalFetishList[PreferenceArousalFetishIndex]);
			factor = /** @type {ArousalFactor} */ (CommonModulo(factor + step, 5));
			PreferenceSetFetishFactor(Player, PreferenceArousalFetishList[PreferenceArousalFetishIndex], factor);
		}

		// Arousal activity control
		if (MouseIn(900, 598, 500, 64)) {
			if (MouseX <= 1150) PreferenceArousalActivityIndex = (PreferenceArousalActivityList.length + PreferenceArousalActivityIndex - 1) % PreferenceArousalActivityList.length;
			else PreferenceArousalActivityIndex = (PreferenceArousalActivityIndex + 1) % PreferenceArousalActivityList.length;
		}

		// Arousal activity love on self control
		if (MouseIn(900, 683, 300, 64)) {
			const step = MouseX <= 1050 ? -1 : +1;
			let factor = PreferenceGetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], true);
			factor = /** @type {ArousalFactor} */ (CommonModulo(factor + step, 5));
			PreferenceSetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], true, factor);
		}

		// Arousal activity love on other control
		if (MouseIn(1605, 683, 300, 64)) {
			const step = MouseX <= 1755 ? -1 : +1;
			let factor = PreferenceGetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], false);
			factor = /** @type {ArousalFactor} */ (CommonModulo(factor + step, 5));
			PreferenceSetActivityFactor(Player, PreferenceArousalActivityList[PreferenceArousalActivityIndex], false, factor);
		}

		// Arousal zone love control
		if ((Player.FocusGroup != null) && MouseIn(550, 853, 600, 64)) {
			const step = MouseX <= 850 ? -1 : +1;
			const zone = PreferenceGetArousalZone(Player, Player.FocusGroup.Name);
			if (zone) {
				const factor = /** @type {ArousalFactor} */ (CommonModulo(zone.Factor + step, 5));
				PreferenceSetArousalZone(Player, zone.Name, factor);
			}
		}

		// Arousal zone orgasm check box
		if ((Player.FocusGroup != null) && MouseIn(1230, 853, 64, 64))
			PreferenceSetArousalZone(Player, Player.FocusGroup.Name, null, !PreferenceGetZoneOrgasm(Player, Player.FocusGroup.Name));

		// In arousal mode, the player can click on her zones
		for (const Group of AssetGroup) {
			if (Group.IsItem() && !Group.MirrorActivitiesFrom && AssetActivitiesForGroup("Female3DCG", Group.Name).length) {
				const Zone = Group.Zone.find(z => DialogClickedInZone(Player, z, 0.9, 50, 50, 1));
				if (Zone) {
					Player.FocusGroup = Group;
				}
			}
		}
	}
}

/**
 * Loads the activity factor combo boxes based on the current activity selected
 * @returns {void} - Nothing
 * @deprecated
 */
function PreferenceLoadActivityFactor() {}

/**
 * Loads the fetish factor combo boxes based on the current fetish selected
 * @returns {void} - Nothing
 * @deprecated
 */
function PreferenceLoadFetishFactor() {}

/**
 * Increment the passed arousal factor.
 * @deprecated
 * @param {ArousalFactor} factor
 * @returns {ArousalFactor}
 */
function PreferenceIncrementArousalFactor(factor) {
	return /** @type {ArousalFactor} */((factor + 1) % 5);
}

/**
 * Decrement the passed arousal factor.
 * @deprecated
 * @param {ArousalFactor} factor
 * @returns {ArousalFactor}
 */
function PreferenceDecrementArousalFactor(factor) {
	return /** @type {ArousalFactor} */((5 + factor - 1) % 5);
}

/**
 * Exits the preference screen
 */
function PreferenceSubscreenArousalExit() {
	return true;
}

function PreferenceSubscreenArousalUnload() {
	Player.FocusGroup = null;
	CharacterAppearanceForceUpCharacter = -1;
	CharacterLoadCanvas(Player);
}
