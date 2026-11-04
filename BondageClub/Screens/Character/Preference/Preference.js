"use strict";
/**
 * The background to use for the settings screen
 */
var PreferenceBackground = "Sheet";

/**
 * A message shown by some subscreen
 * @type {string}
 */
var PreferenceMessage = "";

/**
 * The currently active subscreen
 *
 * @type {PreferenceSubscreen | null}
 */
var PreferenceSubscreen;

/**
 * All the base settings screens
 * @type {PreferenceSubscreen[]}
 */
const PreferenceSubscreens = [
	{
		name: "Main",
		hidden: true,
		load: () => PreferenceSubscreenMainLoad(),
		run: () => PreferenceSubscreenMainRun(),
		click: () => PreferenceSubscreenMainClick(),
		resize: (onLoad) => PreferenceSubscreenMainResize(onLoad),
		unload: () => PreferenceSubscreenMainUnload(),
		exit: () => PreferenceSubscreenMainExit(),
	},
	{
		name: "General",
		load: () => PreferenceSubscreenGeneralLoad(),
		run: () => PreferenceSubscreenGeneralRun(),
		click: () => PreferenceSubscreenGeneralClick(),
		exit: () => PreferenceSubscreenGeneralExit(),
		unload: () => PreferenceSubscreenGeneralUnload(),
		resize: (onLoad) => PreferenceSubscreenGeneralResize(onLoad),
	},
	{
		name: "Difficulty",
		load: () => PreferenceSubscreenDifficultyLoad(),
		run: () => PreferenceSubscreenDifficultyRun(),
		click: () => PreferenceSubscreenDifficultyClick(),
		exit: () => PreferenceSubscreenDifficultyExit(),
		resize: (onLoad) => PreferenceSubscreenDifficultyResize(onLoad),
	},
	{
		name: "Restriction",
		load: () => PreferenceSubscreenRestrictionLoad(),
		run: () => PreferenceSubscreenRestrictionRun(),
		click: () => PreferenceSubscreenRestrictionClick(),
		resize: (onLoad) => PreferenceSubscreenRestrictionResize(onLoad),
	},
	{
		name: "Chat",
		load: () => PreferenceSubscreenChatLoad(),
		run: () => PreferenceSubscreenChatRun(),
		click: () => PreferenceSubscreenChatClick(),
		exit: () => PreferenceSubscreenChatExit(),
		resize: (onLoad) => PreferenceSubscreenChatResize(onLoad),
	},
	{
		name: "CensoredWords",
		load: () => PreferenceSubscreenCensoredWordsLoad(),
		run: () => PreferenceSubscreenCensoredWordsRun(),
		click: () => PreferenceSubscreenCensoredWordsClick(),
		exit: () => PreferenceSubscreenCensoredWordsExit(),
		unload: () => PreferenceSubscreenCensoredWordsUnload(),
		resize: (onLoad) => PreferenceSubscreenCensoredWordsResize(onLoad),
	},
	{
		name: "Audio",
		load: () => PreferenceSubscreenAudioLoad(),
		run: () => PreferenceSubscreenAudioRun(),
		click: () => PreferenceSubscreenAudioClick(),
		exit: () => PreferenceSubscreenAudioExit(),
		unload: () => PreferenceSubscreenAudioUnload(),
		resize: (onLoad) => PreferenceSubscreenAudioResize(onLoad),
	},
	{
		name: "Arousal",
		load: () => PreferenceSubscreenArousalLoad(),
		run: () => PreferenceSubscreenArousalRun(),
		click: () => PreferenceSubscreenArousalClick(),
		exit: () => PreferenceSubscreenArousalExit(),
		unload: () => PreferenceSubscreenArousalUnload(),
	},
	{
		name: "Security",
		load: () => PreferenceSubscreenSecurityLoad(),
		run: () => PreferenceSubscreenSecurityRun(),
		click: () => PreferenceSubscreenSecurityClick(),
		exit: () => PreferenceSubscreenSecurityExit(),
		unload: () => PreferenceSubscreenSecurityUnload(),
		resize: (onLoad) => PreferenceSubscreenSecurityResize(onLoad),
	},
	{
		name: "Online",
		load: () => PreferenceSubscreenOnlineLoad(),
		run: () => PreferenceSubscreenOnlineRun(),
		click: () => PreferenceSubscreenOnlineClick(),
		resize: (onLoad) => PreferenceSubscreenOnlineResize(onLoad),
	},
	{
		name: "Visibility",
		load: () => PreferenceSubscreenVisibilityLoad(),
		run: () => PreferenceSubscreenVisibilityRun(),
		click: () => PreferenceSubscreenVisibilityClick(),
		unload: () => PreferenceSubscreenVisibilityUnload(),
		resize: () => PreferenceSubscreenVisibilityResize(),
	},
	{
		name: "Immersion",
		load: () => PreferenceSubscreenImmersionLoad(),
		run: () => PreferenceSubscreenImmersionRun(),
		click: () => PreferenceSubscreenImmersionClick(),
		resize: (onLoad) => PreferenceSubscreenImmersionResize(onLoad),
	},
	{
		name: "Graphics",
		load: () => PreferenceSubscreenGraphicsLoad(),
		run: () => PreferenceSubscreenGraphicsRun(),
		click: () => PreferenceSubscreenGraphicsClick(),
		exit: () => PreferenceSubscreenGraphicsExit(),
		unload: () => PreferenceSubscreenGraphicsUnload(),
		resize: (onLoad) => PreferenceSubscreenGraphicsResize(onLoad),
	},
	{
		name: "Notifications",
		load: () => PreferenceSubscreenNotificationsLoad(),
		run: () => PreferenceSubscreenNotificationsRun(),
		click: () => PreferenceSubscreenNotificationsClick(),
		exit: () => PreferenceSubscreenNotificationsExit(),
		unload: () => PreferenceSubscreenNotificationsUnload(),
	},
	{
		name: "Gender",
		load: () => PreferenceSubscreenGenderLoad(),
		run: () => PreferenceSubscreenGenderRun(),
		click: () => PreferenceSubscreenGenderClick(),
		resize: (onLoad) => PreferenceSubscreenGenderResize(onLoad),
	},
	{
		name: "Scripts",
		load: () => PreferenceSubscreenScriptsLoad(),
		run: () => PreferenceSubscreenScriptsRun(),
		click: () => PreferenceSubscreenScriptsClick(),
		exit: () => PreferenceSubscreenScriptsExit(),
		unload: () => PreferenceSubscreenScriptsUnload(),
		resize: (onLoad) => PreferenceSubscreenScriptsResize(onLoad),
	},
	{
		name: "Keybindings",
		icon: "Icons/Keyboard.png",
		load: () => PreferenceSubscreenKeybindingsLoad(),
		run: () => PreferenceSubscreenKeybindingsRun(),
		click: () => PreferenceSubscreenKeybindingsClick(),
		exit: () => PreferenceSubscreenKeybindingsExit(),
		resize: (onLoad) => PreferenceSubscreenKeybindingsResize(onLoad),
	},
	{
		name: "Extensions",
		load: () => PreferenceSubscreenExtensionsLoad(),
		run: () => PreferenceSubscreenExtensionsRun(),
		click: () => PreferenceSubscreenExtensionsClick(),
		exit: () => PreferenceSubscreenExtensionsExit(),
		unload: () => PreferenceSubscreenExtensionsUnload(),
		resize: (onLoad) => PreferenceSubscreenExtensionsResize(onLoad),
	},
];

/**
 * The current page ID for multi-page screens.
 *
 * This is automatically reset to 1 when a screen loads
 */
var PreferencePageCurrent = 1;

/** @type {Record<string,PreferenceExtensionsSettingItem>} */
let PreferenceExtensionsSettings = {};

/**
 * Open a specific subscreen
 * @param {PreferenceSubscreenName} subscreen
 * @param {number} page
 */
async function PreferenceOpenSubscreen(subscreen, page = 1) {
	if (CurrentModule !== "Character" || CurrentScreen !== "Preference") {
		InformationSheetLoadCharacter(Player);
		await CommonSetScreen("Character", "Preference");
	}
	PreferenceSubscreenUnload();

	PreferenceSubscreen = PreferenceSubscreens.find(s => s.name === subscreen) ?? null;
	if (!CommonIsNonNegativeInteger(page)) page = 1;
	PreferencePageCurrent = page;
	PreferenceMessage = "";

	PreferenceSubscreenCreateSubscreen(subscreen);
	await PreferenceSubscreen?.load?.();
	PreferenceResize(true);
}

const PreferenceIDs = Object.freeze({
	subscreen: 'preference-subscreen',
	exit: 'preference-exit',
	title: 'preference-subscreen-hgroup',
});

/**
 * Loads the preference screen. This function is called dynamically, when the character enters the preference screen
 * for the first time
 * @type {ScreenLoadHandler}
 */
async function PreferenceLoad() {
	await PreferenceOpenSubscreen("Main");
}

/**
 * Runs the preference screen. This function is called dynamically on a repeated basis.
 * So don't use complex loops or other function calls within this method
 * @returns {void} - Nothing
 */
function PreferenceRun() {
	// Backward-compatibility: automatically substitute strings for the actual subscreen
	if (typeof PreferenceSubscreen === "string") {
		const subscreenName = PreferenceSubscreen === "" ? "Main" : PreferenceSubscreen;
		const screen = PreferenceSubscreens.find(s => s.name === subscreenName);
		if (screen) {
			PreferenceSubscreen = screen;
		} else {
			PreferenceSubscreen = /** @type {PreferenceSubscreen} */ (PreferenceSubscreens.find(s => s.name === "Main"));
		}
	}
	PreferenceSubscreen?.run();
}

/**
 * Handles click events in the preference screen that are propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceClick() {
	PreferenceSubscreen?.click();
}

/**
 * Is called when the player exits the preference screen. All settings of the preference screen are sent to the server.
 * If the player is in a subscreen, they exit to the main preferences menu instead.
 * @type {ScreenExitHandler}
 */
function PreferenceExit() {
	if (PreferenceSubscreen?.name !== "Main") {
		// If we are in a subscreen, the only exit is to the main preference screen
		CommonPromiseCatch(PreferenceSubscreenExit());
		return;
	}


	// Exit the preference menus
	// Only a normal exit triggers an update to server. so we don't send data in unload function,
	// which could be called from disconnects
	const P = {
		ArousalSettings: Player.ArousalSettings,
		ChatSettings: Player.ChatSettings,
		VisualSettings: Player.VisualSettings,
		AudioSettings: Player.AudioSettings,
		GameplaySettings: Player.GameplaySettings,
		ImmersionSettings: Player.ImmersionSettings,
		RestrictionSettings: Player.RestrictionSettings,
		OnlineSettings: Player.OnlineSettings,
		OnlineSharedSettings: Player.OnlineSharedSettings,
		GraphicsSettings: Player.GraphicsSettings,
		NotificationSettings: Player.NotificationSettings,
		GenderSettings: Player.GenderSettings,
		ItemPermission: Player.AllowedInteractions,
		AllowedInteractions: Player.AllowedInteractions,
		LabelColor: Player.LabelColor,
		...ServerPackItemPermissions(Player.PermissionItems),
	};
	ServerAccountUpdate.QueueData(P);
	CommonSetScreen("Character", "InformationSheet");
}

/**
 * Clear all GUI data and DOM elements creates by the preference screen load function
 * We don't do this in exit function for disconnects do not trigger the exit function
 * @type {ScreenUnloadHandler}
 */
function PreferenceUnload() {
	PreferenceSubscreenUnload();
}

/** @type {ScreenResizeHandler} */
function PreferenceResize(onLoad) {
	PreferenceSubscreenResize?.(onLoad);
	PreferenceSubscreen?.resize?.(onLoad);
}

/** @type {KeyboardEventListener} */
function PreferenceKeyUp(event) {
	return PreferenceSubscreen?.keyUp?.(event) ?? false;
}

/**
 * @param {PreferenceSubscreenName} subscreenName
 * @returns {HTMLDivElement}
 */
function PreferenceSubscreenCreateSubscreen(subscreenName) {
	const subscreenTitle = subscreenName === "Main" ? "Preferences" : `${subscreenName}Preferences`;
	const subscreen = ElementDOMScreen.getTemplate(
		PreferenceIDs.subscreen,
		{
			menubarButtons: [ElementButton.Create(PreferenceIDs.exit, PreferenceSubscreenExit, { image: "Icons/Exit.png" })],
			header: TextGet(subscreenTitle),
			parent: document.body,
			hgroupInHeader: true,
		},
	);
	subscreen.setAttribute("data-subscreen", subscreenName);

	return subscreen;
}

/** @type {ScreenResizeHandler} */
function PreferenceSubscreenResize(onLoad) {
	ElementPositionFixed(PreferenceIDs.subscreen, 0, 0, 2000, 1000);
	ElementPositionFixed(PreferenceIDs.title, 500, 100, 1000, 45);
	ElementSetPosition(`${PreferenceIDs.subscreen}-menu`, 1905, 75, "top-right");
}

/**
 * Exit from a specific subscreen by running its handler and checking its validity
 */
async function PreferenceSubscreenExit() {
	const validExit = await PreferenceSubscreen?.exit?.();

	// Only when the results is false (not undefined)
	// The exit is just a exit of the subscreen's substate, return to block more exit.
	if (validExit === false) return;

	// The exit is a full exit of the subscreen, unload resources
	await PreferenceOpenSubscreen("Main");
}

function PreferenceSubscreenUnload() {
	PreferenceSubscreen?.unload?.();
	ElementRemove(PreferenceIDs.subscreen);
}

/**
 * Draw a button to navigate multiple pages in a preference subscreen
 * @param {number} Left - The X co-ordinate of the button
 * @param {number} Top - The Y co-ordinate of the button
 * @param {number} TotalPages - The total number of pages on the subscreen
 * @returns {void} - Nothing
 */
function PreferencePageChangeDraw(Left, Top, TotalPages) {
	DrawBackNextButton(Left, Top, 200, 90, TextGet("Page") + " " + PreferencePageCurrent.toString() + "/" + TotalPages.toString(), "White", "", () => "", () => "");
}

/**
 * Handles clicks of the button to navigate multiple pages in a preference subscreen
 * @param {number} Left - The X co-ordinate of the button
 * @param {number} Top - The Y co-ordinate of the button
 * @param {number} TotalPages - The total number of pages on the subscreen
 * @returns {void} - Nothing
 */
function PreferencePageChangeClick(Left, Top, TotalPages) {
	if (MouseIn(Left, Top, 100, 90)) {
		PreferencePageCurrent--;
		if (PreferencePageCurrent < 1) PreferencePageCurrent = TotalPages;
	}
	else if (MouseIn(Left + 100, Top, 100, 90)) {
		PreferencePageCurrent++;
		if (PreferencePageCurrent > TotalPages) PreferencePageCurrent = 1;
	}
}

/**
 * Draws a back/next button for use on preference pages
 * @param {number} Left - The left offset of the button
 * @param {number} Top - The top offset of the button
 * @param {number} Width - The width of the button
 * @param {number} Height - The height of the button
 * @param {readonly string[]} List - The preference list that the button should be associated with
 * @param {number} Index - The current preference index for the given preference list
 * @deprecated use {@link DrawBackNextButton}
 * @returns {void} - Nothing
 */
function PreferenceDrawBackNextButton(Left, Top, Width, Height, List, Index) {
	DrawBackNextButton(Left, Top, Width, Height, TextGet(List[Index]), "White", "",
		() => TextGet(List[CommonModulo(Index - 1, List.length)]),
		() => TextGet(List[CommonModulo(Index + 1, List.length)]),
	);
}
