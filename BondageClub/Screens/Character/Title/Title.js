"use strict";
var TitleBackground = "Sheet";
/**
 * Bound to screen lifetime
 * @type {TitleName}
 */
var TitleSelectedTitle;
/** @type {null | NicknameStatus} */
var TitleNicknameStatus = null;
/** @deprecated */
let TitleOffset = 0;
/** @type {{ Name: TitleName; Requirement: () => boolean; Earned?: boolean, Force?: boolean }[]} */
let TitleListFiltered = [];
/** @deprecated */
const TitlePerPage = 28;

const TitleSelec = Object.freeze({
	subscreen: 'title-subscreen',
	nicknameInputGroup: "input-nickname-group",
	nicknameInput: "InputNickname",
	searchInput: "input-search",
	exit: "title-exit",
	titleGroup: "title-subscreen-hgroup",
	titleStatus: "title-subscreen-status",
	titleMain: "title-subscreen-main",
	titleButtonContainer: "title-subscreen-titlebuttons",
	/** @param {TitleName} title */
	titleButtonId(title) { return `title-button-${title}`; },
	titleButtonClass: "title-button",
});

/**
 * Sets the new title of the player, if the title has changed
 * @param {TitleName} NewTitle - The new title for the player
 * @returns {TitleName} - The new title of the player
 */
function TitleSet(NewTitle) {
	if (NewTitle != Player.Title) {
		Player.Title = NewTitle;
		ServerAccountUpdate.QueueData({ Title: NewTitle });
	}
	return NewTitle;
}

/**
 * Selects a title, updating the UI
 * @param {TitleName} title - The title to select
 */
function TitleSelect(title) {
	if (title === TitleSelectedTitle) return;

	ElementWrap(TitleSelec.titleButtonId(TitleSelectedTitle))?.toggleAttribute("active", false);
	TitleSelectedTitle = title;
	ElementWrap(TitleSelec.titleButtonId(TitleSelectedTitle))?.toggleAttribute("active", true);
}

/**
 * Returns the current title of the given player. If an invalid title is found or the player has to wear a certain title
 * the correct title is pushed to the player's attributes
 * @param {Character} C - The player, whose title we want to get
 * @returns {TitleName} - The title of the given player
 */
function TitleGet(C) {

	// If we find a title that we must force, we set it and return it
	if (C.IsPlayer())
		for (const title of TitleList)
			if (title.Requirement() && title.Force != null && title.Force)
				return TitleSet(title.Name);

	// No title or other character titles aren't validated
	if (!C.Title || (C.Title == "None")) return "None";
	if (!C.IsPlayer()) return C.Title;

	// If we find a valid title, we return it
	for (const title of TitleList)
		if (C.Title == title.Name && title.Requirement())
			return C.Title;

	// If the title is invalid, we set it to none
	return TitleSet("None");
}

/**
 * Returns the title as a localized string
 *
 * The title translation file must be prefetched with `TextPrefetch("Character", "Title")`
 *
 * @param {string} title
 */
function TitleGetName(title) {
	const file = ScreenFileGetPath("Text_Title.csv", "Character", "Title");
	return TextGetInScope(file, `Title${title}`);
}

/**
 * Checks, if the given title is forced a forced title like 'Club Slave' or 'Escaped Patient'
 * @param {TitleName} Title - The title to check
 * @returns {boolean} - Result of the check
 */
function TitleIsForced(Title) {
	if (!Title || (Title == "None")) return false;
	for (const title of TitleList)
		if (Title == title.Name && title.Force != null && title.Force)
			return true;
	return false;
}

/**
 * Checks, if the given title is earned a earned title is any title that doesn't always return true such as 'Switch', 'Doll' & 'Angel'
 * @param {TitleName} Title - The title to check
 * @returns {boolean} - Result of the check
 */
function TitleIsEarned(Title) {
	if (!Title || (Title == "None")) return false;
	for (const title of TitleList)
		if (Title == title.Name && title.Earned != null && title.Earned)
			return true;
	return false;
}

/**
 * When the title screen is loaded
 * @type {ScreenLoadHandler}
 */
async function TitleLoad() {
	TitleSelectedTitle = TitleGet(Player);
	TitleListFiltered = TitleList
		.filter(T => T.Requirement())
		.sort((a, b) => {
			if (a.Name === 'None') return -1;
			if (b.Name === 'None') return 1;
			return TextGet("Title" + a.Name).localeCompare(TextGet("Title" + b.Name));
		});
	TitleNicknameStatus = null;

	let nicknameInput = ElementCreateInput(TitleSelec.nicknameInput, "text", Player.Nickname, "20");
	if (!CharacterCanChangeNickname(Player)) {
		nicknameInput.style.backgroundColor = "#DFDFDF";
		nicknameInput.removeAttribute("onfocus");
		nicknameInput.setAttribute("disabled", "disabled");
	}
	nicknameInput.addEventListener("input", () => {
		const value = nicknameInput.value.trim();
		if (value !== "") {
			TitleNicknameStatus = CharacterValidateNickname(Player, value, false);
			nicknameInput.setCustomValidity(TitleNicknameStatus ?? "");
		}
	});

	const labeledInput = ElementCreate({
		tag: "label",
		attributes: {
			for: TitleSelec.nicknameInput,
			id: TitleSelec.nicknameInputGroup
		},
		children: [
			TextGet(CharacterCanChangeNickname(Player) ? "Nickname" : "NicknameLocked"),
			nicknameInput
		]
	});

	const searchInput = ElementCreateSearchInput(
		TitleSelec.searchInput,
		() => TitleListFiltered.map(T => TextGet("Title" + T.Name)),
		{ placeholder: TextGet("SearchTitle"), onInput: () => TitleSearch() },
	);

	const titleButtons = TitleListFiltered.map((title, I) => {
		return ElementButton.Create(
			TitleSelec.titleButtonId(title.Name),
			function () {
				TitleSelect(title.Name);
			},
			{
				label: TextGet("Title" + title.Name),
			},
			{
				button: {
					classList: [TitleSelec.titleButtonClass],
					attributes: {
						active: (title.Name === TitleSelectedTitle)
					}
				}
			}
		);});

	ElementDOMScreen.getTemplate(
		TitleSelec.subscreen,
		{
			menubarButtons: [ElementButton.Create(TitleSelec.exit, TitleExit, { image: "Icons/Exit.png" })],
			header: TextGet("SelectTitle"),
			parent: document.body,
			mainContent: [
				labeledInput,
				searchInput,
				{
					tag: "section",
					attributes: {
						id: TitleSelec.titleButtonContainer
					},
					classList: ["scroll-box"],
					children: titleButtons
				}
			]
		},
	);
}

/** @type {ScreenUnloadHandler} */
function TitleUnload() {
	ElementRemove(TitleSelec.subscreen);
}

/**
 * Runs the title selection screen. This function is called dynamically on a repeated basis,
 * so don't use complex loops or call extended functions from here.
 * @returns {void} - Nothing
 */
function TitleRun() {
	const e = ElementWrap(TitleSelec.titleStatus);
	if (!e) return;
	e.textContent = TitleNicknameStatus ? TextGet(TitleNicknameStatus) : "";
}

/**
 * Handles the click events in the title selection screen. Clicks are forwarded from CommonClick()
 * @returns {void} - Nothing
 */
function TitleClick() {
}

// when the user exit this screen
/**
 * Exits the title selection screen and brings the player back to the InformationSheet
 * @type {ScreenExitHandler}
 */
function TitleExit() {
	let Nick = ElementValue("InputNickname");
	if (Nick == null) Nick = "";
	const status = CharacterSetNickname(Player, Nick);
	if (status === "NicknameLocked") {
		// Just ignore that
	} else if (status) {
		TitleNicknameStatus = status;
		return;
	}

	TitleSet(TitleSelectedTitle);

	// Nickname was fine, return to the Info sheet
	CommonSetScreen("Character", "InformationSheet");
}

function TitleResize() {
	ElementSetPosition(TitleSelec.exit, 1815, 75);
	ElementPositionFixed(TitleSelec.titleGroup, 100, 75, 1615, 90);
	ElementPositionFixed(TitleSelec.titleMain, 100, 175, 1775, 750);
}

function TitleSearch() {
	const search = ElementValue(TitleSelec.searchInput)?.toLowerCase();
	const buttons = document.querySelectorAll(`.${TitleSelec.titleButtonClass}`);

	buttons.forEach((b) => {
		const label = b.querySelector(".button-label")?.textContent;
		const isShouldBeHidden = !label?.toLowerCase()?.includes(search);

		b.toggleAttribute("hidden", isShouldBeHidden);
	});
}
