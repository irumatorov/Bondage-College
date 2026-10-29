"use strict";
var InformationSheetBackground = "Sheet";
/**
 * The character we're showing the information of.
 *
 * Also used by OnlineProfile.js
 * @type {null | Character | NPCCharacter}
 */
var InformationSheetSelection = null;
/** @type {ScreenSpecifier | null} */
var InformationSheetReturnScreen = null;

/**
 * Loads the Information Sheet, cache the sub screens
 * @type {ScreenLoadHandler}
 */
async function InformationSheetLoad() {
	if (!InformationSheetSelection) throw new Error("No character selected");

	await Promise.all([
		TextPrefetch("Character", "FriendList").loadedPromise,
		TextPrefetch("Character", "Preference").loadedPromise,
		TextPrefetch("Character", "Title").loadedPromise,
	]);

	const C = InformationSheetSelection;

	if (!C.IsPlayer()) return;

	const dropdownOptions = Object.values(AllowedInteractions)
		.map((e) => /** @type {Omit<HTMLOptions<"option">, "tag">} */({
			attributes: {
				value: e.toString(),
				label: TextGet("AllowedInteraction" + e.toString()),
				selected: e === Player.AllowedInteractions
			}
		}));

	ElementCreate({
		tag: "label",
		attributes: {
			id: "AllowedInteractions-dropdown-container",
			for: "AllowedInteractions-dropdown"
		},
		style: {
			display: "grid",
			"grid-template-rows": "max-content max-content",
			"grid-template-columns": "auto",
			"gap": "var(--gap)"
		},
		children: [
			{
				tag: "span",
				attributes: { id: "AllowedInteractions-dropdown-label" },
				children: [TextGet("AllowedInteractions")],
				style: { "user-select": "none" }
			},
			ElementDropdown.Create("AllowedInteractions-dropdown", dropdownOptions, function (ev) {
				ev.preventDefault();
				if (this.value in Object.values(AllowedInteractions) === false) return;
				Player.AllowedInteractions = /** @type {AllowedInteractions} */ (CommonParseInt(this.value));
				if (Player.GetDifficulty() >= Difficulty.EXTREME) LoginExtremeItemSettings(Player.AllowedInteractions === AllowedInteractions.Everyone);

				const P = {
					ItemPermission: Player.AllowedInteractions,
					AllowedInteractions: Player.AllowedInteractions,
					...ServerPackItemPermissions(Player.PermissionItems),
				};
				ServerAccountUpdate.QueueData(P);
			})
		],
		parent: document.body
	});
}

/**
 * Main function of the character info screen. It's called continuously, so be careful
 * to add time consuming functions or loops here
 * @returns {void} - Nothing
 */
function InformationSheetRun() {}

/**
 * Handles the click events on the screen
 * @type {MouseEventListener}
 */
function InformationSheetClick() {}

function InformationSheetResize() {
	if (!InformationSheetSelection) return;
	const C = InformationSheetSelection;
	if (C.IsPlayer()) {
		ElementSetPosition("AllowedInteractions-dropdown-container", 550, 800);
		ElementSetSize("AllowedInteractions-dropdown", 600);
		ElementSetFontSize("AllowedInteractions-dropdown-container", "auto");
	}
}

/**
 * Cleanup all elements, if the user exits the screen
 * @type {ScreenExitHandler}
 */
function InformationSheetExit() {
	if (InformationSheetReturnScreen) {
		CommonSetScreen(...InformationSheetReturnScreen);
	}
	InformationSheetReturnScreen = null;
}

function InformationSheetUnload() {
	ElementRemove("AllowedInteractions-dropdown-container");
}

/**
 * Loads the information sheet for a character
 * @param {Character} C - The character whose information sheet should be displayed
 * @returns {void} - Nothing
 */
function InformationSheetLoadCharacter(C) {
	InformationSheetSelection = C;
	if (!InformationSheetReturnScreen) {
		InformationSheetReturnScreen = CommonGetScreen();
	}
	CommonSetScreen("Character", "InformationSheet");
}
