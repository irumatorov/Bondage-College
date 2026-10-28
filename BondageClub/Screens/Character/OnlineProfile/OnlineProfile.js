"use strict";

var OnlineProfileBackground = "Sheet";

const OnlineProfileTextDescMaxLen = 10000;
const OnlineProfileTextOwnersNotesMaxLen = 4000;

/**
 * Leading character used to signal that description is compressed
 * @readonly
 */
const ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC = String.fromCharCode(9580);

const OnlineProfile = {
	IDs: Object.freeze({
		screen: "online-profile-screen",
		saveButton: "online-profile-save-button",
		cancelButton: "online-profile-cancel-button",
		ownersNotesButton: "online-profile-owners-notes-button",
		description: "online-profile-description-input",
		ownersNotes: "online-profile-owners-notes-input",
	}),
	/** @type { "description" | "ownersNotes" } */
	mode: "description",
	description: () => typeof InformationSheetSelection?.Description === "string"  ? InformationSheetSelection.Description : "",
	ownersNotes: () => typeof InformationSheetSelection?.Ownership?.Notes === "string" ? InformationSheetSelection.Ownership.Notes : "",
	notesAvailable: () => InformationSheetSelection?.IsFullyOwnedByPlayer() || OnlineProfile.ownersNotes() !== "",
	/**
	 * @param {"description" | "ownersNotes"} mode
	 * @returns {boolean}
	 */
	canEdit: (mode) => {
		if (!InformationSheetSelection) return false;
		return (mode === "description" && InformationSheetSelection.IsPlayer())
			|| (mode === "ownersNotes" && InformationSheetSelection.IsFullyOwnedByPlayer());
	},
};

/**
 * Loads the online profile screen by creating its input
 * @type {ScreenLoadHandler}
 */
async function OnlineProfileLoad() {
	if (!InformationSheetSelection) {
		throw new Error('Missing "InformationSheetSelection" data');
	}

	const cancelButton = ElementButton.Create(OnlineProfile.IDs.cancelButton, () => OnlineProfileExit(false), {
		image: "Icons/Exit.png",
		tooltip: TextGet("Leave"),
	});
	const saveButton = ElementButton.Create(OnlineProfile.IDs.saveButton, () => OnlineProfileExit(true), {
		image: "Icons/Accept.png",
		tooltip: TextGet("LeaveSave"),
	});
	const ownersNotesButton = ElementButton.Create(OnlineProfile.IDs.ownersNotesButton, () => OnlineProfileSetMode(OnlineProfile.mode === "description" ? "ownersNotes" : "description"), {
		image: "Icons/Management.png",
		tooltip: TextGet("OwnersNotes"),
		role: "menuitemcheckbox",
		ariaChecked: OnlineProfile.mode === "ownersNotes",
	});

	const descriptionInput = ElementInput.Create(OnlineProfile.IDs.description,
		{
			type: "textarea",
		},
		{
			attributes: { maxlength: OnlineProfileTextDescMaxLen, readonly: !InformationSheetSelection.IsPlayer() },
			children: [OnlineProfile.description()],
		}
	);

	const ownersNotesInput = ElementInput.Create(OnlineProfile.IDs.ownersNotes,
		{
			type: "textarea",
		},
		{
			attributes: { maxlength: OnlineProfileTextOwnersNotesMaxLen, readonly: !InformationSheetSelection.IsFullyOwnedByPlayer() },
			children: [OnlineProfile.ownersNotes()],
		}
	);

	ElementDOMScreen.getTemplate(OnlineProfile.IDs.screen, {
		header: "I'm silly ©Deep",
		hgroupInHeader: true,
		menubarButtons: [
			cancelButton,
			saveButton,
			...(OnlineProfile.notesAvailable() ? [ownersNotesButton] : []),
		],
		mainContent: [
			descriptionInput,
			ownersNotesInput,
		],
		parent: document.body,
	});
	OnlineProfileSetMode(OnlineProfile.mode);
}

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

function OnlineProfileResize() {
	ElementPositionFixed(OnlineProfile.IDs.screen, 50, 50, 1900, 900);
}

/**
 * Handles exiting while in the online profile screen. It removes the input and saves the description.
 * @param {boolean} [Save] - Whether or not we should save the changes
 * @returns {void} - Nothing
 */
function OnlineProfileExit(Save=false) {
	if (!InformationSheetSelection) return;
	if (Save) {
		const description = ElementValue(OnlineProfile.IDs.description).slice(0, OnlineProfileTextDescMaxLen);
		const ownersNotes = ElementValue(OnlineProfile.IDs.ownersNotes).slice(0, OnlineProfileTextOwnersNotesMaxLen);

		OnlineProfileSaveDescription(description);
		CharacterSetOwnersNotes(InformationSheetSelection, ownersNotes);
	}

	CommonSetScreen("Character", "InformationSheet");
}

/**
 * Handles unloading the online profile screen
 * @returns {void}
 */
function OnlineProfileUnload() {
	ElementRemove(OnlineProfile.IDs.screen);
	OnlineProfile.mode = "description";
}

/**
 * Saves the description to the server
 * @param {string} description - The description to save
 * @returns {void}
 */
function OnlineProfileSaveDescription(description) {
	if (!InformationSheetSelection) return;
	if (!InformationSheetSelection.IsPlayer()) return;
	if (InformationSheetSelection.Description === description) return;

	InformationSheetSelection.Description = description;
	const compVal = ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC + LZString.compressToUTF16(description);
	if (compVal.length < description.length || description.startsWith(ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC)) description = compVal;
	ServerAccountUpdate.QueueData({ Description: description });
}

/**
 * Sets the mode of the online profile screen.
 *
 * @param {"description" | "ownersNotes"} mode - The mode to set.
 * @returns {void}
 */
function OnlineProfileSetMode(mode) {
	if (!InformationSheetSelection) return;

	const screen = ElementWrap(OnlineProfile.IDs.screen);

	screen?.setAttribute("data-mode", mode);
	OnlineProfile.mode = mode;

	const isEditMode = OnlineProfile.canEdit(mode);
	ElementWrap(OnlineProfile.IDs.saveButton)?.toggleAttribute("hidden", !isEditMode);
	const cancelButton = ElementWrap(OnlineProfile.IDs.cancelButton);
	if (cancelButton) {
		ElementButton.SetImage(cancelButton, isEditMode ? "Icons/Cancel.png" : "Icons/Exit.png");
		const tooltip = cancelButton.querySelector(".button-tooltip");
		if (tooltip) tooltip.textContent = TextGet(isEditMode ? "LeaveNoSave" : "Leave");
	}

	const textTag = (() => {
		switch (mode) {
			case "description":
				return InformationSheetSelection.IsPlayer() ? "EnterDescription" : "ViewDescription";
			case "ownersNotes":
				return InformationSheetSelection.IsFullyOwnedByPlayer() ? "EnterOwnersNotes" : "ViewOwnersNotes";
		}
	})();
	ElementDOMScreen.setHeading(OnlineProfile.IDs.screen, TextSubstitute(textTag, {
		MAXLEN: mode === "description" ? OnlineProfileTextDescMaxLen : OnlineProfileTextOwnersNotesMaxLen,
		CharacterName: CharacterNickname(InformationSheetSelection),
		OwnerName: InformationSheetSelection.Ownership?.Name ?? "",
	}).join(""));

	const focusInputId = (() => {
		switch (mode) {
			case "description":
				return OnlineProfile.IDs.description;
			case "ownersNotes":
				return OnlineProfile.IDs.ownersNotes;
		}
	})();
	const focusInput = /** @type {HTMLTextAreaElement | null} */ (ElementWrap(focusInputId));
	focusInput?.focus();
	focusInput?.setSelectionRange(focusInput.value.length, null);
}

/**
 * Setup OnlineProfile UI in a specific mode.
 *
 * @param {"description" | "ownersNotes"} mode - Initial display mode.
 * @returns {void}
 */
function OnlineProfileStart(mode) {
	OnlineProfile.mode = mode;
	CommonSetScreen("Character", "OnlineProfile");
}
