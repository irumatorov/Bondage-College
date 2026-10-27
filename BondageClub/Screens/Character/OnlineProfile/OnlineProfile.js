"use strict";

var OnlineProfileBackground = "Sheet";

const OnlineProfileTextDescMaxLen = 10000;
const OnlineProfileTextOwnersNotesMaxLen = 4000;

/**
 * Leading character used to signal that description is compressed
 * @readonly
 */
const ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC = String.fromCharCode(9580);

/**
 * Setup OnlineProfile UI in a specific mode.
 *
 * @param {"Description" | "OwnersNotes"} mode - Initial display mode.
 * @returns {void}
 */
function OnlineProfileStart(mode) {
	CommonSetScreen("Character", "OnlineProfile");
}

/**
 * Loads the online profile screen by creating its input
 * @type {ScreenLoadHandler}
 */
async function OnlineProfileLoad() {
	if (!InformationSheetSelection) {
		throw new Error('Missing "InformationSheetSelection" data');
	}
}

/**
 * Handles unloading the online profile screen
 * @returns {void}
 */
function OnlineProfileUnload() {}

/**
 * Runs and draws the online profile screen
 * @returns {void} - Nothing
 */
function OnlineProfileRun() {}

/**
 * Handles clicks in the online profile screen
 * @returns {void} - Nothing
 */
function OnlineProfileClick() {}

/**
 * Handles exiting while in the online profile screen. It removes the input and saves the description.
 * @param {boolean} [Save] - Whether or not we should save the changes
 * @returns {void} - Nothing
 */
function OnlineProfileExit(Save=false) {
	if (!InformationSheetSelection) return;
	if (Save) { /* nothing */ }
	CommonSetScreen("Character", "InformationSheet");
}
