"use strict";

/**
 * @file This file handles the chat lobby search & filter screen
 */

/** Background image */
var ChatSearchBackground = "Introduction";
/**
 * The list of tags allowed as backgrounds for the room edit screens
 * @type {BackgroundTag[]}
 */
var ChatSearchBackgroundTagList = [];
/** @type {ChatRoomSearchResult[]} */
var ChatSearchResult = [];
/** @type {ChatRoomSearchResult[]} */
var ChatSearchHiddenResult = [];
/**
 * @type {never}
 * @deprecated Use {@link ServerRoomSearch()}
 */
var ChatSearchLastSearchDataJSON = /** @type {never} */ (null);
var ChatSearchLastQuerySearchTime = 0;
var ChatSearchLastQueryJoin = "";
var ChatSearchLastQueryJoinTime = 0;
var ChatSearchResultOffset = 0;
/** The room grid's left offset */
var ChatSearchPageX = 25;
/** The room grid's top offset */
var ChatSearchPageY = 135;
var ChatSearchRoomsPerRow = 3;
var ChatSearchRoomsPerColumn = 8;
/**
 * Layout parameters for the room grid
 * @type {CommonGenerateGridParameters}
 */
var ChatSearchListParams = {
	x: ChatSearchPageX,
	y: ChatSearchPageY,
	width: MainCanvasWidth - 2 * ChatSearchPageX,
	height: (20 + 85) * ChatSearchRoomsPerColumn,
	itemWidth: 630,
	itemHeight: 85,
	minMarginY: 24,
};
/** Pre-calculated. Must be updated if you change the grid parameters */
var ChatSearchRoomsPerPage = ChatSearchRoomsPerRow * ChatSearchRoomsPerColumn;
/** @type {ScreenSpecifier} */
var ChatSearchReturnScreen = ["Room", "MainHall"];
/** @type {null | Item[]} */
var ChatSearchSafewordAppearance = null;
/** @type {null | Partial<Record<AssetPoseCategory, AssetPoseName>>} */
var ChatSearchSafewordPose = null;
/** @type {null | Partial<Record<AssetPoseCategory, AssetPoseName>>} */
var ChatSearchPreviousActivePose = null;
/** @type {number[]} */
var ChatSearchTempHiddenRooms = [];
/** @type {"" | "Filter"} */
var ChatSearchMode = "";
var ChatSearchGhostPlayerOnClickActive = false;
var ChatSearchShowHiddenRoomsActive = false;
/** @type {null | { Index: number, RoomLabel: string, MemberLabel: string, WordsLabel: string }} */
var ChatSearchFilterUnhideConfirm = null;
var ChatSearchRejoinIncrement = 1;
/**
 * @deprecated
 * @type {never}
 */
var ChatSearchReturnToScreen;
/** @type {string} */
var ChatSearchQueryString = "";
/** @type {"" | ServerChatRoomLanguage} */
var ChatSearchLanguage = "";
/** @type {never} */
var ChatSearchLanguageTemp;
/** @type {ServerChatRoomGame} */
var ChatSearchGame = "";
/** @type {ServerChatRoomSpace | null} */
var ChatSearchSpace = null;
var ChatSearchFilterTermsTemp = "";
var ChatSearchCurrentRoomSpaceIndex = 0;

/** @type {HTMLDivElement | null} */
var ChatSearchRoomHeader;
/** @type {HTMLDivElement | null} */
var ChatSearchRoomGrid;
/** @type {HTMLFieldSetElement | null} */
var ChatSearchSearchMenu;
/** @type {HTMLDivElement | null} */
var ChatSearchPageCountElement;
/** @type {HTMLDialogElement | null} */
var ChatSearchDialogElement;
/** @type {HTMLButtonElement | null} */
var ChatSearchSearchMenuButton;
/** @type {HTMLDivElement | null} */
var ChatSearchSearchBodyElement;
/** @type {HTMLDialogElement | null} */
var ChatSearchFilterUnhideConfirmElement;
/** @type {HTMLDialogElement | null} */
var ChatSearchFilterHelpScreenElement;

/**
 * Starts the chatroom selection screen.
 * @param {ServerChatRoomSpace} space - Name of the chatroom space
 * @param {ScreenSpecifier | undefined} returnScreen - Screen to go back to when exiting leaving the lobby.
 * @param {ChatSearchLobbyOptions} [options]
 * @returns {SafePromise<void>} - Nothing.
 */
async function ChatSearchStart(space, returnScreen, options) {
	const validSpaces = /** @type {ServerChatRoomSpace[]} */ (["X", "", "M", "Asylum"]);
	if (!validSpaces.includes(space)) {
		console.error(`invalid space ${space}`);
		return;
	}
	if (!returnScreen) {
		console.error("invalid return screen:", returnScreen);
		return;
	}
	ChatSearchSpace = space;
	ChatSearchGame = options?.Game ?? "";
	ChatSearchReturnScreen = returnScreen;
	ChatSearchBackground = options?.Background ?? "Introduction";
	ChatSearchBackgroundTagList = options?.BackgroundTagList ?? BackgroundsTagList;
	ChatSearchQueryString = "";
	const [module, screen] = CommonGetScreen();
	if (module === "Online" && screen === "ChatSearch") {
		// Already on screen
		return Promise.resolve();
	}
	return CommonSetScreen("Online", "ChatSearch");
}

/**
 * Loads the chat search screen properties, creates the inputs and loads up the first 24 rooms.
 * @type {ScreenLoadHandler}
 */
async function ChatSearchLoad() {
	CurrentDarkFactor = 0.5;
	if (ChatSearchSafewordAppearance == null) {
		ChatSearchSafewordAppearance = Player.Appearance.slice(0);
		ChatSearchSafewordPose = Player.ActivePoseMapping;
	}
	AsylumGGTSIntroDone = false;
	AsylumGGTSTask = null;
	AsylumGGTSPreviousPose = { ...Player.PoseMapping };
	Player.ArousalSettings.OrgasmCount = 0;
	ChatSearchLanguage = Player.ChatSearchSettings.Language;

	ChatSearchPageCountElement = ElementCreate({
		tag: "div",
		attributes: {
			id: "chat-search-page-count",
		},
		children: [
			`0 / 0`,
		],
	});
	const minRoomSizeInput = ElementCreate({
		tag: "input",
		attributes: {
			id: "chat-search-search-menu-room-size-min",
			type: "number",
			inputmode: "numeric",
			value: Player.ChatSearchSettings.RoomMinSize,
			min: 2,
			max: 20,
			step: 1,
			required: true,
		},
		classList: ["chat-search-room-size-input"],
		eventListeners: {
			change: () => {
				const min = parseInt(minRoomSizeInput.value, 10);
				if (!minRoomSizeInput.validity.valid) return;

				Player.ChatSearchSettings.RoomMinSize = min;
				minRoomSizeInput.valueAsNumber = min;
				maxRoomSizeInput.min = String(min);
				ChatSearchUpdateSearchSettings();
			}
		}
	});
	const maxRoomSizeInput = ElementCreate({
		tag: "input",
		attributes: {
			id: "chat-search-search-menu-room-size-max",
			type: "number",
			inputmode: "numeric",
			value: Player.ChatSearchSettings.RoomMaxSize,
			min: 1,
			max: 20,
			step: 1,
			required: true,
		},
		classList: ["chat-search-room-size-input"],
		eventListeners: {
			change: () => {
				let max = parseInt(maxRoomSizeInput.value, 10);
				if (!maxRoomSizeInput.validity.valid) return;

				Player.ChatSearchSettings.RoomMaxSize = max;
				maxRoomSizeInput.valueAsNumber = max;
				minRoomSizeInput.max = String(max);
				ChatSearchUpdateSearchSettings();
			}
		}
	});
	const space = ChatSearchGetSpace();
	if (space && !Player.ChatSearchSettings.Space.includes(space)) {
		Player.ChatSearchSettings.Space = space;
	}
	const searchInput = ElementCreateSearchInput(
		"InputSearch",
		() => {
			const rooms = ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult;
			return rooms.map(i => i.DisplayName).sort();
		},
		{
			maxLength: 200,
			value: ChatSearchQueryString,
			placeholder: TextGet("SearchRoom"),
			onInput: function (ev) {
				ChatSearchQueryString = this.value;
			},
			onKeydown: ChatSearchKeyDownListener,
		},
		{ search: { classList: ["chat-search-input-search-box"] } },
	);

	const filterInput = ElementCreateInput("InputFilter", "text", Player.ChatSearchSettings.FilterTerms);
	ElementSetAttribute("InputFilter", "placeholder", TextGet("FilterExcludeTerms"));
	filterInput.toggleAttribute("hidden", true);
	filterInput.classList.add("chat-search-input-filter-box");
	filterInput.addEventListener("input", function () {
		Player.ChatSearchSettings.FilterTerms = this.value;
	});
	filterInput.addEventListener("keydown", (event) => {
		if (event.repeat || !CommonKey.IsPressed(event, "Enter")) return;
		ChatSearchSaveFilterTerms();
	});

	const clearButton = ElementButton.Create("chat-search-clear-input-search", function (ev) {
		switch (ChatSearchMode) {
			case "":
				ElementValue("InputSearch", "");
				ChatSearchQuery("");
				break;
			case "Filter":
				ElementValue("InputFilter", "");
				break;
		}
	}, {
		image: "Icons/cross.svg",
		noStyling: true,
	}, {
		button: {
			classList: ["chat-search-room-button"],
		},
	});
	ChatSearchSearchMenuButton = ElementButton.Create(
		"chat-search-room-open-search-menu",
		function () {
			const img = this.querySelector('.button-image');
			if (!img) return;
			const open = this.getAttribute("aria-expanded") === "true";
			if (open) {
				this.setAttribute("aria-expanded", "false");
				ElementButton.SetImage(this, "Icons/CaretUp.svg");
			} else {
				this.setAttribute("aria-expanded", "true");
				ElementButton.SetImage(this, "Icons/CaretDown.svg");
				if (document.activeElement?.id !== "InputSearch") {
					ElementFocus("InputSearch");
				}
			}
			ElementUnpackIDs.fromAttribute(this, "aria-controls").forEach(el => el.hidden = open);
		},
		{
			tooltip: TextGet("SearchMenuButton"),
			tooltipPosition: "bottom",
			image: "Icons/CaretUp.svg",
		}, {
			button: {
				classList: ["chat-search-room-button"], attributes: {
					"aria-expanded": "false",
					"aria-controls": "chat-search-search-menu"
				}
			}
		});
	ChatSearchRoomHeader = ElementCreate(
		{
			tag: "div",
			attributes: { id: "chat-search-room-header" },
			children: [
				{
					tag: "div",
					attributes: {
						id: "chat-search-room-search-section",
					},
					classList: ["chat-search-room-header-section"],
					children: [
						{
							tag: "div",
							attributes: { id: "chat-search-input-search" },
							children: [
								searchInput,
								filterInput,
								clearButton,
							],
						},
						ElementButton.Create(
							"chat-search-room-search-button",
							() => {
								if (ChatSearchSearchMenuButton?.getAttribute("aria-expanded") === "true") {
									ChatSearchSearchMenuButton.click();
								}
								ChatSearchQuery(ChatSearchQueryString);
							},
							{
								tooltip: TextGet("Search"),
								tooltipPosition: "bottom",
								image: "Icons/Search.png",
							},
							{
								button: { classList: ["chat-search-room-button"] },
							},
						),
						ChatSearchSearchMenuButton,
						ElementButton.Create(
							"chat-search-room-prev-page",
							() => ChatSearchSetPageRelative(-1),
							{
								tooltip: TextGet("Prev"),
								tooltipPosition: "bottom",
								image: "Icons/Prev.png",
							},
							{
								button: {
									classList: ["chat-search-room-button"],
									attributes: { "aria-controls": "chat-search-room-grid" },
								},
							},
						),
						ChatSearchPageCountElement,
						ElementButton.Create(
							"chat-search-room-next-page",
							() => ChatSearchSetPageRelative(1),
							{
								tooltip: TextGet("Next"),
								tooltipPosition: "bottom",
								image: "Icons/Next.png",
							},
							{
								button: {
									classList: ["chat-search-room-button"],
									attributes: { "aria-controls": "chat-search-room-grid" },
								},
							},
						),
						ElementButton.Create("chat-search-hide-rooms", function () {
							ChatSearchToggleSearchMode();
						}, {
							tooltip: TextGet(ChatSearchMode != "Filter" ? "FilterMode" : "NormalMode"),
							tooltipPosition: "bottom",
							role: "checkbox",
							image: "Icons/Private.png",
						}, {
							button: {
								classList: ["chat-search-room-button"],
								dataAttributes: {
									mode: ChatSearchMode == "Filter" ? "FilterMode" : "NormalMode",
								},
							},
						}),
					],
				},
				{
					tag: "div",
					attributes: {
						id: "chat-search-room-filter-section",
						role: "radiogroup",
						"aria-required": "true",
						hidden: true
					},
					classList: ["chat-search-room-header-section"],
					children: [
						ElementButton.Create("chat-search-temp-hide-button", function () {
							ChatSearchGhostPlayerOnClickActive = false;
						}, {
							role: "radio",
							tooltip: TextGet("TempHideOnClick"),
							tooltipPosition: "bottom",
							image: "Icons/Trash.png",
						}, {
							button: {
								classList: ["chat-search-room-button"],
								attributes: {
									"aria-checked": !ChatSearchGhostPlayerOnClickActive ? "true" : "false",
								},
							},
						}),
						ElementButton.Create("chat-search-ghost-list-button", function () {
							ChatSearchGhostPlayerOnClickActive = true;
						}, {
							role: "radio",
							tooltip: TextGet("GhostPlayerOnClick"),
							tooltipPosition: "bottom",
							image: "Icons/GhostList.png",
						}, {
							button: {
								classList: ["chat-search-room-button"],
								attributes: {
									"aria-checked": ChatSearchGhostPlayerOnClickActive ? "true" : "false",
								},
							},
						}),
						ElementButton.Create(
							"chat-search-room-show-hidden-rooms-button",
							() => ChatSearchToggleHiddenMode(),
							{
								role: "checkbox",
								tooltip: TextGet("ShowHiddenRooms"),
								tooltipPosition: "bottom",
								image: "Icons/InspectLock.png",
							},
							{
								button: { classList: ["chat-search-room-button"] },
							},
						),
						ElementButton.Create(
							"chat-search-room-help-button",
							() => {
								if (ChatSearchFilterHelpScreenElement?.open) {
									return ChatSearchFilterHelpScreenElement.close();
								}
								ChatSearchFilterHelpScreenElement?.showModal();
								ElementPositionFixed(ChatSearchFilterHelpScreenElement, 25, 135, 1900, 800);
								ChatSearchFilterHelpScreenElement?.addEventListener("keydown", (ev) => {
									if (ev.key === "Escape") {
										ChatSearchFilterHelpScreenElement?.close();
										return;
									}
								}, { once: true });
								ChatSearchFilterHelpScreenElement?.focus();
							},
							{
								tooltip: TextGet("Help"),
								tooltipPosition: "bottom",
								image: "Icons/Question.png",
							},
							{
								button: { classList: ["chat-search-room-button"] },
							},
						),
					],
				},
				{
					tag: "div",
					attributes: { id: "chat-search-room-navigation-section" },
					classList: ["chat-search-room-header-section"],
					children: [
						ElementButton.Create(
							"chat-search-room-create-room-button",
							() => ChatAdminShowCreate(),
							{
								tooltip: TextGet("CreateRoom"),
								tooltipPosition: "bottom",
								image: "Icons/Plus.png",
							},
							{
								button: { classList: ["chat-search-room-button"] },
							},
						),
						ElementButton.Create(
							"chat-search-room-friend-list-button",
							() => {
								FriendListReturn = { Screen: CurrentScreen, Module: CurrentModule };
								CommonSetScreen("Character", "FriendList");
							},
							{
								tooltip: TextGet("FriendList"),
								tooltipPosition: "bottom",
								image: "Icons/FriendList.png",
							},
							{
								button: { classList: ["chat-search-room-button"] },
							},
						),
						ElementButton.Create(
							"chat-search-room-exit-button",
							() => ChatSearchExit(false),
							{
								tooltip: TextGet("Exit"),
								tooltipPosition: "bottom",
								image: "Icons/Exit.png",
							},
							{
								button: { classList: ["chat-search-room-button"] },
							},
						),
					],
				},
			],
			parent: document.body,
		}
	);
	ChatSearchSearchBodyElement = ElementCreateDiv("chat-search-body");
	ChatSearchSearchMenu = ElementCreate(
		{
			tag: "fieldset",
			attributes: {
				id: "chat-search-search-menu",
				hidden: true,
			},
			children: [
				// Room type
				{
					tag: "div",
					attributes: {
						id: "chat-search-search-menu-room-type",
					},
					classList: ["chat-search-search-menu-grid-item"],
					children: [
						ElementCreateSettingsLabel(TextGet("RoomType"), "chat-search-search-menu-room-type-radio-group"),
						ElementCreateRadioButtonGroup(
							"chat-search-search-menu-room-type-radio-group",
							function() {
								const key = /** @type {"None" | ChatRoomMapType} */ (this.value);
								if (key === "None") {
									Player.ChatSearchSettings.MapTypes = "";
								} else {
									Player.ChatSearchSettings.MapTypes = key;
								}
								ChatSearchUpdateSearchSettings();
							},
							!Player.ChatSearchSettings.MapTypes ? "None" : Player.ChatSearchSettings.MapTypes,
							[
								{
									options: { image: "Icons/cross.svg", tooltip: TextGet("AllRooms"), },
									htmlOptions: { button: { attributes: { value: "None" } } }
								},
								{
									options: { image: "Icons/RoomTypeNormal.svg", tooltip: TextGet("NormalRooms") },
									htmlOptions: { button: { attributes: { value: "Never" } } }
								},
								{
									options: { image: "Icons/RoomTypeHybrid.svg", tooltip: TextGet("HybridRooms") },
									htmlOptions: { button: { attributes: { value: "Hybrid" } } }
								},
								{
									options: { image: "Icons/RoomTypeMap.svg", tooltip: TextGet("MapRooms") },
									htmlOptions: { button: { attributes: { value: "Always" } } }
								},
							]),
					],
				},
				// Lobby
				{
					tag: "div",
					attributes: {
						id: "chat-search-search-menu-room-lobby",
					},
					classList: ["chat-search-search-menu-grid-item"],
					children: [
						ElementCreateSettingsLabel(TextGet("Lobby"), "chat-search-search-menu-room-lobby-radio-group"),
						ElementCreateRadioButtonGroup(
							"chat-search-search-menu-room-lobby-radio-group",
							function() {
								const key = /** @type {ServerChatRoomSpace} */ (this.value);
								Player.ChatSearchSettings.Space = ChatSearchSpace = key;
								ChatSearchUpdateSearchSettings();
							},
							ChatSearchGetSpace() ?? "",
							[
								Player.GetGenders().includes("F") && {
									options: { image: "Icons/Female.svg", tooltip: TextGet("Female") },
									htmlOptions: { button: { attributes: { value: "" } } }
								},
								{
									options: { image: "Icons/Gender.svg", tooltip: TextGet("Mixed") },
									htmlOptions: { button: { attributes: { value: "X" } } }
								},
								Player.GetGenders().includes("M") && {
									options: { image: "Icons/Male.svg", tooltip: TextGet("Male") },
									htmlOptions: { button: { attributes: { value: "M" } } }
								},
								ChatSearchGetSpace() === "Asylum" && {
									options: { image: "Icons/Asylum.png", tooltip: TextGet("Asylum") },
									htmlOptions: { button: { attributes: { value: "Asylum" } } }
								},
							].filter(Boolean),
						),
					],
				},
				// Full rooms
				{
					tag: "div",
					attributes: {
						id: "chat-search-search-menu-full-rooms",
					},
					dataAttributes: {
						checkbox: true,
					},
					classList: ["chat-search-search-menu-grid-item"],
					children: [
						ElementCreateSettingsLabel(TextGet("ShowFullRooms"), "chat-search-search-menu-full-rooms-input", { position: "left" }),
						ElementCheckbox.Create("chat-search-search-menu-full-rooms-input", function (ev) {
							Player.ChatSearchSettings.FullRooms = this.checked;
							ChatSearchUpdateSearchSettings();
						}, {
							checked: Player.ChatSearchSettings.FullRooms,
						})
					],
				},
				// Locked rooms
				{
					tag: "div",
					attributes: {
						id: "chat-search-search-menu-locked-rooms",
					},
					dataAttributes: {
						checkbox: true,
					},
					classList: ["chat-search-search-menu-grid-item"],
					children: [
						ElementCreateSettingsLabel(TextGet("ShowLockedRooms"), "chat-search-search-menu-locked-rooms-input", { position: "left" }),
						ElementCheckbox.Create("chat-search-search-menu-locked-rooms-input", function (ev) {
							Player.ChatSearchSettings.ShowLocked = this.checked;
							ChatSearchUpdateSearchSettings();
						}, {
							checked: Player.ChatSearchSettings.ShowLocked,
						})
					],
				},
				// Search description
				{
					tag: "div",
					attributes: {
						id: "chat-search-search-menu-search-description",
					},
					dataAttributes: {
						checkbox: true,
					},
					classList: ["chat-search-search-menu-grid-item"],
					children: [
						ElementCreateSettingsLabel(TextGet("SearchDescription"), "chat-search-search-menu-search-description-input", { position: "left" }),
						ElementCheckbox.Create("chat-search-search-menu-search-description-input", function () {
							Player.ChatSearchSettings.SearchDescriptions = this.checked;
							ChatSearchUpdateSearchSettings();
						}, {
							checked: Player.ChatSearchSettings.SearchDescriptions,
						}),
					],
				},
				// Game
				{
					tag: "div",
					attributes: {
						id: "chat-search-search-menu-room-game",
					},
					classList: ["chat-search-search-menu-grid-item"],
					children: [
						ElementCreateSettingsLabel(TextGet("GameLabel"), "chat-search-search-menu-room-game-dropdown"),
						ElementDropdown.Create(
							"chat-search-search-menu-room-game-dropdown",
							[
								...[...ChatAdminGameList, "Prison"].map(game => (
									{ children: [TextGet(`Game${game === "" ? "AllRooms" : game}`)], attributes: { value: game, selected: ChatSearchGame == game } }
								)),
							],
							function (ev) {
								ChatSearchGame = Player.ChatSearchSettings.Game = /** @type {ServerChatRoomGame} */ (this.value);
								ChatSearchUpdateSearchSettings();
							},
							null,
							{
								select: {
									attributes: {
										value: ChatSearchGame,
									}
								}
							}
						),
					],
				},
				// Language
				{
					tag: "div",
					attributes: { id: "chat-search-search-menu-room-language" },
					classList: ["chat-search-search-menu-grid-item"],
					children: [
						ElementCreateSettingsLabel("Language", "chat-search-search-menu-room-language-dropdown"),
						ElementDropdown.Create(
							"chat-search-search-menu-room-language-dropdown",
							[
								.../** @type {ServerChatRoomLanguage[]} */([...ServerChatRoomSupportedLanguages, ""]).map(lang => (
									{ children: [ChatSearchGetLanguageName(lang)], attributes: { value: lang, selected: Player.ChatSearchSettings.Language == lang } }
								)),
							],
							function (ev) {
								Player.ChatSearchSettings.Language = ChatSearchLanguage = /** @type {ServerChatRoomLanguage} */ (this.value);
								ChatSearchUpdateSearchSettings();
							},
							{ required: true }
						),
					],
				},
				// Room size
				{
					tag: "div",
					attributes: { id: "chat-search-search-menu-room-size" },
					classList: ["chat-search-search-menu-grid-item"],
					children: [
						ElementCreateSettingsLabel("Room Size", "chat-search-search-menu-room-size-grid"),
						{
							tag: "div",
							attributes: { id: "chat-search-search-menu-room-size-grid" },
							children: [
								minRoomSizeInput,
								"/",
								maxRoomSizeInput,
								{
									tag: "span",
									classList: ["chat-search-search-menu-room-size-label"],
									children: ["min"],
									attributes: { "for": "chat-search-search-menu-room-size-min" }
								},
								{
									tag: "span",
									classList: ["chat-search-search-menu-room-size-label"],
									children: ["max"],
									style: { "grid-column": "3/3" },
									attributes: { "for": "chat-search-search-menu-room-size-max" },
								},
							],
						}
					]
				},
				ElementButton.Create("chat-search-search-menu-search-button", function () {
					const elements = /** @type {HTMLCollectionOf<Element & { validity: ValidityState, reportValidity(): boolean }>} */(ChatSearchSearchMenu?.elements) ?? [];
					for (const el of elements) {
						if (!el.validity.valid) {
							el.reportValidity();
							return;
						}
					}
					ChatSearchQuery(ChatSearchQueryString);
				}, null, {
					button: {
						classList: ["chat-search-search-menu-search-button"],
						children: [
							TextGet("Search"),
						],
					},
				}),
			],
			parent: document.body,
		});

	if (ChatSearchGetSpace() === "Asylum") {
		ElementWrap("chat-search-search-menu-room-lobby-radio-group")?.toggleAttribute("disabled", true);
	}

	ChatSearchRoomGrid = ElementCreateDiv("chat-search-room-grid");
	ChatSearchFilterHelpScreenElement = ElementCreate({
		tag: "dialog",
		attributes: {
			id: "chat-search-filter-help-screen",
		},
		children: [
			{
				tag: "ul",
				classList: ["chat-search-filter-help-screen-content"],
				children: CommonRange(1, 6).map(n => ({
					tag: "li",
					children: [TextGet(`HelpText${n}`)],
				})),
			},
			ElementButton.Create("chat-search-filter-help-screen-close", function () {
				ChatSearchFilterHelpScreenElement?.close();
			}, null, {
				button: {
					classList: ["chat-search-filter-help-screen-close-button"],
					children: [
						TextGet("CloseHelp"),
					],
				},
			}),
		],
		parent: document.body,
	});
	ChatSearchQuery(ChatSearchQueryString);
	ChatRoomNotificationReset();
	ChatSearchRejoinIncrement = 1;
	TextPrefetch("Character", "FriendList");
	TextPrefetch("Online", "ChatAdmin");
	TextPrefetch("Online", "ChatRoom");
}

/** @type {ScreenResizeHandler} */
function ChatSearchResize() {
	ElementPositionFixed(ChatSearchRoomGrid, ChatSearchListParams.x, ChatSearchListParams.y, ChatSearchListParams.width, ChatSearchListParams.height);
	ElementPositionFixed(ChatSearchRoomHeader, 25, 25, 1950, 90);
	ElementPositionFixed(ChatSearchSearchMenu, 25, 115, 810, 480);
	ElementPositionFixed(ChatSearchSearchBodyElement, 25, 115, 810, 480);
	if (document.getElementById("chat-search-room-page")) ElementPositionFixed("chat-search-room-page", (2000 - 1200) / 2, (1000 - 700) / 2, 1200, 700);
	document.querySelectorAll('.chat-search-room-title').forEach(ElementFitText);
	ElementPositionFixed(ChatSearchFilterHelpScreenElement, 25, 135, 1900, 800);
	if (ChatSearchFilterUnhideConfirmElement) {
		ElementPositionFixed(ChatSearchFilterUnhideConfirmElement, 50, 135, 1900, 800);
	}
}

/** @type {ScreenUnloadHandler} */
function ChatSearchUnload() {
	ElementRemove(ChatSearchRoomHeader);
	ChatSearchRoomHeader = null;
	ElementRemove(ChatSearchSearchMenu);
	ChatSearchSearchMenu = null;
	ElementRemove(ChatSearchRoomGrid);
	ChatSearchRoomGrid = null;
	ElementRemove(ChatSearchSearchBodyElement);
	ChatSearchSearchBodyElement = null;
	ElementRemove(ChatSearchPageCountElement);
	ChatSearchPageCountElement = null;
	ElementRemove(ChatSearchDialogElement);
	ChatSearchDialogElement = null;
	ElementRemove(ChatSearchSearchMenuButton);
	ChatSearchSearchMenuButton = null;
	ElementRemove(ChatSearchFilterHelpScreenElement);
	ChatSearchFilterHelpScreenElement = null;
	ChatRoomStimulationMessage("Walk");
}

/**
 * When the chat Search screen runs, draws the screen
 * @type {ScreenRunHandler}
 */
function ChatSearchRun() {

	// Calls the other screens that could trigger
	KidnapLeagueResetOnlineBountyProgress();
	PandoraPenitentiaryCreate();

	// Hidden rooms view only shows a back button
	if (ChatSearchShowHiddenRoomsActive) {
		DrawButton(1885, 25, 90, 90, "", "White", "Icons/DialogNormalMode.png", TextGet("NormalFilterMode"));
		return;
	}
}

/**
 * Handles the click events on the chat search screen. Is called from CommonClick()
 * @type {MouseEventListener}
 */
function ChatSearchClick() {
	// Handle back button for hidden rooms view
	if (ChatSearchShowHiddenRoomsActive) {
		if (MouseIn(1885, 25, 90, 90)) ChatSearchToggleHiddenMode();
		return;
	}
}

/**
 * Returns the rooms to be displayed
 * @returns {ChatRoomSearchResult[]}
 */
function ChatSearchGetRooms() {
	if (ChatSearchShowHiddenRoomsActive) {
		return ChatSearchHiddenResult;
	}
	if (ChatSearchMode == "Filter") {
		return [...ChatSearchResult, ...ChatSearchHiddenResult];
	}
	return ChatSearchResult.filter(room => !ChatSearchHiddenResult.includes(room));
}
/**
 * Gets the pagination information for the current page.
 * @returns {{currentPage: number, total: number}}
 */
function ChatSearchGetPagination() {
	const rooms = ChatSearchGetRooms();
	if (!rooms.length) {
		// We have no rooms, hence no page
		return { currentPage: 0, total: 0 };
	}
	let total = Math.ceil(rooms.length / ChatSearchRoomsPerPage);
	let currentPage = ChatSearchResultOffset / ChatSearchRoomsPerPage + 1;
	return { currentPage, total };
}

/**
 * Sets the page based on the passed page number.
 * @param {number} page
 */
function ChatSearchSetPage(page) {
	const { total } = ChatSearchGetPagination();
	page = total !== 0 ? CommonClamp(page, 1, total) : page;
	ChatSearchResultOffset = Math.max(0, (page - 1) * ChatSearchRoomsPerPage);
	if (ChatSearchPageCountElement) {
		ChatSearchPageCountElement.textContent = `${page} / ${total}`;
	}
	ChatSearchGridUpdate(ChatSearchGetRooms().slice(ChatSearchResultOffset, ChatSearchResultOffset + ChatSearchRoomsPerPage));
}

/**
 * Relatively sets the page based on the passed offsets.
 * @param {number} offset
 */
function ChatSearchSetPageRelative(offset) {
	const { currentPage, total } = ChatSearchGetPagination();
	let page = (currentPage + offset) % (total + 1);
	if (page === 0 && Math.sign(offset) === -1) page = total;
	ChatSearchSetPage(page);
}

/**
 * While in filter view, called when player clicks apply, presses enter, or returns to the normal view.
 * Saves the "temp" options into their normal variables, and sends them to the server.
 * Also refreshes the displayed rooms accordingly.
 * @returns {void} - Nothing
 */
function ChatSearchSaveFilterTerms() {
	let changed = false;

	// Save Filter Terms option
	if (Player.ChatSearchSettings.FilterTerms !== ChatSearchFilterTermsTemp) {
		ChatSearchFilterTermsTemp = Player.ChatSearchSettings.FilterTerms;
		ChatSearchUpdateSearchSettings();
		changed = true;

		// Re-apply the filter client side immediately - in case searching doesn't update fast enough
		ChatSearchResult.unshift(...ChatSearchHiddenResult);
		ChatSearchQuerySort();
		ChatSearchApplyFilterTerms();
	}

	// If either/both options changed, refresh the room list
	if (changed)
		ChatSearchQuery(ChatSearchQueryString);
}

/**
 * Handles the key presses while in the chat search screen.
 * @type {KeyboardEventListener}
 */
function ChatSearchKeyDown(event) {
	/** @type {HTMLInputElement | null} */
	const searchInput = document.querySelector("input#InputSearch");
	/** @type {HTMLInputElement | null} */
	const filterInput = document.querySelector("input#InputFilter");
	if (searchInput &&CommonKey.InputKeyDown(searchInput, event)) {
		return true;
	} else if (filterInput && CommonKey.InputKeyDown(filterInput, event)) {
		return true;
	}
	return false;
}

/** @type {ClipboardEventListener} */
function ChatSearchPaste(event) {
	const searchInput = document.getElementById("InputSearch");
	if (searchInput instanceof HTMLInputElement) {
		CommonKey.InputPaste(searchInput, event);
	}
}

/**
 * Handles the key presses while in the chat search screen.
 * When the user presses enter, we launch the search query or save the temp options.
 * @type {(this: HTMLInputElement, ev: KeyboardEvent) => void}
 */
function ChatSearchKeyDownListener(event) {
	if (event.repeat || !CommonKey.IsPressed(event, "Enter")) return;
	ChatSearchQuery(ChatSearchQueryString);
	if (ChatSearchSearchMenuButton?.getAttribute("aria-expanded") === "true") {
		ChatSearchSearchMenuButton.click();
	}
}

/**
 * Handles exiting from the chat search screen, removes the input.
 * @type {ScreenExitHandler & { closeSubElements?: boolean }}
 * @param {boolean} [exitScreen] - Whether to exit the screen or just menus within
 */
function ChatSearchExit(exitScreen = false) {
	const interupt = ChatSearchBack();
	if (!exitScreen && interupt) return;
	ChatSearchMode = "";
	ChatSearchShowHiddenRoomsActive = false;
	ChatSearchFilterUnhideConfirm = null;
	ChatSearchPreviousActivePose = { ...Player.ActivePoseMapping };
	ChatRoomSetLastChatRoom(null);
	ElementRemove("InputSearch");
	CommonSetScreen(...ChatSearchReturnScreen);
	DrawingGetTextSize.clearCache();
}

function ChatSearchBack() {
	if (ChatSearchFilterHelpScreenElement?.open) {
		ChatSearchFilterHelpScreenElement.close();
		return true;
	}
	if (ChatSearchDialogElement?.open) {
		ChatSearchDialogElement.close();
		return true;
	}
	if (!ChatSearchSearchMenu?.hidden) {
		ChatSearchSearchMenuButton?.click();
		return true;
	}
	return false;
}
/**
 * Draws the filter mode help screen: just text and a back button.
 * @returns {void} - Nothing
 */
function ChatSearchFilterHelpDraw() {
	DrawRect(50, 135, 1900, 800, "White");
	DrawEmptyRect(50, 135, 1900, 800, "Black");
	for (let i = 0; i < 7; i++)
		DrawTextWrap(TextGet("HelpText" + (i + 1)), 70, 135 + i * 100, 1860, 70, "Black", undefined, 2);
}

/**
 * Creates the filter mode unhide confirm screen: just text and confirm/cancel buttons.
 * @param {string} roomLabel
 * @param {string} memberLabel
 * @param {string} wordsLabel
 * @param {ChatRoomSearchResult} room
 * @returns {void} - Nothing
 */
function ChatSearchCreateFilterUnhideConfirm(roomLabel, memberLabel, wordsLabel, room) {
	if (ChatSearchFilterUnhideConfirmElement) {
		ElementRemove(ChatSearchFilterUnhideConfirmElement);
	}
	ChatSearchFilterUnhideConfirmElement = ElementCreate(
		{
			tag: "dialog",
			attributes: {
				id: "chat-search-filter-unhide-confirm",
			},
			children: [
				{
					tag: "div",
					classList: ["chat-search-filter-unhide-confirm-container"],
					children: [
						{
							tag: "p",
							children: [TextGet("UnhideConfirmRoom").replace("{RoomLabel}", roomLabel)]
						},
						{
							tag: "ul",
							children: [
								memberLabel != "" ? ({
									tag: "li",
									children: [TextGet("UnhideConfirmMember").replace("{MemberLabel}", memberLabel)]
								}) : undefined,
								wordsLabel != "" ? ({
									tag: "li",
									children: [TextGet("UnhideConfirmWords").replace("{WordsLabel}", wordsLabel)]
								}) : undefined,
							],
						},
					],
				},
				{
					tag: "p",
					classList: ["chat-search-filter-unhide-confirm-end"],
					children: [TextGet("UnhideConfirmEnd")],
				},
				{
					tag: "div",
					classList: ["chat-search-filter-unhide-confirm-buttons"],
					children: [
						ElementButton.Create("chat-search-filter-unhide-confirm-cancel", function () {
							if (ChatSearchFilterUnhideConfirmElement) {
								ElementRemove(ChatSearchFilterUnhideConfirmElement);
								ChatSearchFilterUnhideConfirmElement = null;
							}
						}, null, {
							button: {
								children: [
									TextGet("UnhideCancel"),
								],
							},
						},
						),
						ElementButton.Create("chat-search-filter-unhide-confirm-confirm", function () {
							ChatSearchClickUnhideRoom(room, true);
							if (ChatSearchFilterUnhideConfirmElement) {
								ElementRemove(ChatSearchFilterUnhideConfirmElement);
								ChatSearchFilterUnhideConfirmElement = null;
							}
						}, null, {
							button: {
								children: [
									TextGet("UnhideConfirm"),
								],
							},
						},
						),
					],
				}
			],
			parent: document.body,
		}
	);
	ElementPositionFixed(ChatSearchFilterUnhideConfirmElement, 50, 50, 1900, 800);
	ChatSearchFilterUnhideConfirmElement.showModal();
	ChatSearchFilterUnhideConfirmElement.focus();
}


/**
 * Returns the translated language name for the given code.
 * @param {ServerChatRoomLanguage} languageCode
 */
function ChatSearchGetLanguageName(languageCode) {
	/** @type {Record<ServerChatRoomLanguage | "", string>} */
	const languageDictionary = {
		ES: TextGet("LanguageES"),
		EN: TranslationGetLanguageName("EN", true),
		CN: TranslationGetLanguageName("CN", true),
		RU: TranslationGetLanguageName("RU", true),
		FR: TranslationGetLanguageName("FR", true),
		UA: TranslationGetLanguageName("UA", true),
		DE: TranslationGetLanguageName("DE", true),
		"": TextGet("AnyLanguage"),
	};
	return languageDictionary[languageCode];
}

/**
 * Returns the translated room type for the given code.
 * @param {ChatRoomMapType} roomType
 */
function ChatSearchGetRoomTypeName(roomType) {
	const roomTypeDictionary = {
		Always: TextGet("MapRooms"),
		Hybrid: TextGet("HybridRooms"),
		Never: TextGet("NormalRooms"),
	};
	return roomTypeDictionary[roomType];
}

/**
 * Returns the translated space for the given code.
 * @param {"" | "X" | "M" | "Asylum"} space
 */
function ChatSearchGetSpaceName(space) {
	const spaceDictionary = {
		"": TextGet("Female"),
		X: TextGet("Mixed"),
		M: TextGet("Male"),
		Asylum: TextGet("Asylum"),
	};
	return spaceDictionary[space];
}

/**
 * Updates the room grid with the given rooms
 * @param {ChatRoomSearchResult[]} rooms
 */
function ChatSearchGridUpdate(rooms) {
	if (!ChatSearchRoomGrid) return;
	ChatSearchRoomGrid.innerHTML = "";
	for (const [index, room] of rooms.entries()) {
		ChatSearchCreateGridRoom(room, index);
	}

	document.querySelectorAll('.chat-search-room-title').forEach(ElementFitText);
}

/**
 * Handle clicks on room buttons
 * @param {ChatRoomSearchResult} room
 * @returns {boolean}
 */
function ChatSearchClickRoom(room) {
	if (ChatSearchMode == "Filter") {
		if (ChatSearchShowHiddenRoomsActive) return ChatSearchClickUnhideRoom(room, false);
		if (ChatSearchHiddenResult.includes(room)) return ChatSearchClickUnhideRoom(room, false);

		ChatSearchHiddenResult.push(room);
		const roomIdx = ChatSearchResult.findIndex(r => r.Name === room.Name);
		if (roomIdx >= 0) ChatSearchResult.splice(roomIdx, 1);
		const roomElem = document.getElementById(`chat-search-room-join-button-${room.Order}`);
		roomElem?.setAttribute("data-temporary-hidden", "true");
		if (ChatSearchGhostPlayerOnClickActive) {
			ChatRoomListUpdate(Player.GhostList, true, room.CreatorMemberNumber);
			return true;
		}

		ChatSearchTempHiddenRooms.push(room.CreatorMemberNumber);
		return true;
	} else if (ChatSearchMode === "") {
		ChatSearchJoin(room.Name);
		return true;
	}
	return false;
}

/**
 * Creates a grid button for the given room
 * @param {ChatRoomSearchResult} room
 * @param {number} index
 */
function ChatSearchCreateGridRoom(room, index) {
	const isBlocked = CharacterHasBlockedItem(Player, room.BlockCategory);
	const tooltipElement = ChatSearchCreateGridRoomTooltip(room, index);

	// Calculate tooltip position directly
	const isLastRow = index >= ChatSearchRoomsPerPage - ChatSearchRoomsPerRow;
	const tooltipPosition = isLastRow ? "top" : "bottom";


	const icons = ChatSearchGridRoomGetIcons(room);

	/** @type {(null | undefined | string | Node | HTMLOptionsUnion)[]} */
	const content = [
		ElementButton.Create(`chat-search-room-join-button-${room.Order}`, () => {
			ChatSearchClickRoom(room);
		}, {
			tooltipPosition: tooltipPosition,
			tooltip: tooltipElement,
			clickDisabled() {
				// We still try to join in case the server state is different
				ChatSearchClickRoom(room);
			},
		}, {
			button: {
				classList: ["chat-search-room-join-button"],
				attributes: {
					"aria-disabled": room.MemberCount >= room.MemberLimit ? "true" : "false",
				},
				dataAttributes: {
					locked: !room.CanJoin ? "true" : "false",
					full: room.MemberCount >= room.MemberLimit ? "true" : "false",
					withFriends: room.Friends.length > 0 ? "true" : "false",
					blocked: isBlocked ? "true" : "false",
					game: room.Game != "" ? "true" : "false",
					temporaryHidden: ChatSearchHiddenResult.includes(room) ? "true" : "false",
				},
			},
		}),
		icons.length > 0 ? {
			tag: "div",
			classList: ["chat-search-room-icons"],
			children: [
				...icons.map((value) => ElementCreate({
					tag: "img",
					classList: ["chat-search-room-icon"],
					attributes: { src: value ?? "" },
				})),
			],
		} : undefined,
		{
			tag: "p",
			classList: ["chat-search-room-title"],
			children: [
				{
					tag: "span",
					classList: ["chat-search-room-name"],
					children: [room.Name]
				},
				"-",
				{
					tag: "span",
					classList: ["chat-search-room-creator"],
					children: [room.Creator]
				},
				{
					tag: "span",
					classList: ["chat-search-room-members"],
					children: [`${room.MemberCount}/${room.MemberLimit}`]
				},
			],
		},
		{
			tag: "p",
			classList: ["chat-search-room-description"],
			children: [room.Description]
		},
		ElementButton.Create(`chat-search-room-page-button-${room.Order}`, () => {
			ChatSearchShowRoomPage(room);
		}, {
			tooltipPosition: "bottom",
			tooltip: TextGet("ShowRoomPage"),
			image: "Icons/Information.svg",
		}, {
			button: {
				classList: ["chat-search-room-page-button"],
			},
		}),
	];
	ElementCreate(
		{
			tag: "div",
			classList: ["chat-search-room"],
			attributes: {
				id: `chat-search-room-${room.Order}`,
			},
			children: content,
			parent: ChatSearchRoomGrid ?? undefined,
		}
	);
}

/**
 * Returns the list of icons for the given room
 * @param {ChatRoomSearchResult} room
 * @returns {string[]}
 */
function ChatSearchGridRoomGetIcons(room) {
	const icons = [];
	const hasMap = room.MapType === "Always" || room.MapType === "Hybrid";

	if (hasMap) icons.push(`Icons/MapType${room.MapType}.png`);
	if (ChatRoomDataIsPrivate(room)) icons.push("Icons/Private.png");
	if (ChatRoomDataIsLocked(room)) icons.push(room.CanJoin ? "Icons/CheckUnlocked.png" : "Icons/CheckLocked.png");
	return icons;
}

/**
 * Returns whether the given room can be joined
 * @param {ChatRoomSearchResult} room
 * @returns {boolean}
 */
function ChatSearchGridRoomCanJoin(room) {
	return room.CanJoin && room.MemberCount < room.MemberLimit;
}

/**
 * Creates the tooltip for the given room
 * @param {ChatRoomSearchResult} room
 * @param {number} index
 * @returns {HTMLDivElement | undefined}
 */
function ChatSearchCreateGridRoomTooltip(room, index) {
	/** @type {HTMLOptionsUnion[]} */
	const children = [];
	if (room.Friends.length > 0) {
		children.push({
			tag: "span",
			classList: ["chat-search-room-tooltip-entry", "chat-search-room-tooltip-friends"],
			children: [
				TextGet("FriendsInRoom") + " " + room.Friends.map(f => `${f.MemberName} (${f.MemberNumber})`).join(", "),
			]
		});
	}
	if (room.Game != "") {
		children.push({
			tag: "span",
			classList: ["chat-search-room-tooltip-entry", "chat-search-room-tooltip-game"],
			children: [
				TextGet("GameLabel") + " " + TextGet("Game" + room.Game),
			],
		});
	}
	if (room.BlockCategory.length > 0) {
		children.push({
			tag: "span",
			classList: ["chat-search-room-tooltip-entry", "chat-search-room-tooltip-blocked"],
			children: [
				TextGet("Block") + " " + room.BlockCategory.map(c => TextGet(c)).join(", "),
			],
		});
	}
	const filterReasons = ChatSearchGetFilterReasons(room);
	if (filterReasons.length > 0) {
		// We remove everything, as having a reason means we're filtering
		children.splice(0, children.length);
		children.push({
			tag: "span",
			classList: ["chat-search-room-tooltip-entry", "chat-search-room-tooltip-blocked"],
			children: [
				TextGet("FilteredBecause") + " " + filterReasons.map(r => TextGet(`FilterReason${r}`)).join(", "),
			]
		});
	}
	if (!children.length) return undefined;
	return ElementCreate({
		tag: "div",
		attributes: { id: `chat-search-room-tooltip-${index}` },
		classList: ["chat-search-room-tooltip"],
		children,
	});
}

/**
 * Creates the tags for the room page
 * @param {ChatRoomSearchResult} room
 * @returns {HTMLElement[]}
 */
function ChatSearchCreateRoomPageTags(room) {
	/** @type {HTMLElement[]} */
	let roomPageTags = [];

	/**
	 * Creates a tag for the room page
	 * @param {string} tag - The tag name
	 * @param {string} value - The text to display
	 * @param {ElementButton.StaticNode} [tooltip] - The tooltip to display
	 */
	function AddTag(tag, value, tooltip) {
		roomPageTags.push(ElementButton.Create(null,
			() => null,
			{
				tooltipPosition: "bottom",
				tooltip: tooltip,
			},
			{
				button: {
					classList: ["chat-search-room-page-tag", "chat-search-room-page-tag-" + tag],
					children: [value],
					attributes: { "aria-disabled": "true", },
				},
			}
		));
	}

	// Default tags
	AddTag(
		"space",
		ChatSearchGetSpaceName(room.Space),
		TextGet(`${room.Space}SpaceDescription`)
	);
	AddTag(
		"language",
		ChatSearchGetLanguageName(/** @type {ServerChatRoomLanguage} */(room.Language)),
		TextGet("LanguageDescription").replace("%LANGUAGE%", ChatSearchGetLanguageName(/** @type {ServerChatRoomLanguage} */(room.Language)))
	);

	// Additional tags
	if (room.Game !== "") AddTag(
		"game",
		TextGet(`Game${room.Game}`),
		TextGet(`${room.Game}RoomGameDescription`)
	);
	if (room.MapType !== "Never") AddTag(
		"map",
		ChatSearchGetRoomTypeName(/** @type {ChatRoomMapType} */(room.MapType)),
		TextGet(`${room.MapType}MapDescription`)
	);
	if (room.Friends.length > 0) AddTag(
		"friends",
		TextGet("FriendList"),
		{ tag: /** @type {const} */("ul"), children: room.Friends.map(f => { return { tag: "li", children: [`${f.MemberName} (${f.MemberNumber})`] }; }) },
	);

	// Tags with multiple values
	for (let blockCategory of room.BlockCategory) {
		AddTag("block",
			`${TextGet("Block")} ${TextGet(blockCategory)}`,
			TextGet(`${blockCategory}BlockDescription`)
		);
	}
	for (let access of room.Access) {
		if (access === "All") continue;
		AddTag(
			"access",
			TextGet(`${access}Access`)
		);
	}

	return roomPageTags;
}

/**
 * Shows the room page for the given room
 * @param {ChatRoomSearchResult} room
 */
function ChatSearchShowRoomPage(room) {
	if (ChatSearchDialogElement) {
		ElementRemove(ChatSearchDialogElement);
	}
	const roomPageElements = [
		ElementCreate({
			tag: "h2",
			classList: ["chat-search-room-page-title"],
			children: [
				room.Name,
			],
		}),
		ElementCreate({
			tag: "p",
			classList: ["chat-search-room-page-creator"],
			children: [
				`By ${room.Creator}`
			],
		}),
		ElementCreate({
			tag: "p",
			classList: ["chat-search-room-page-description"],
			children: [
				room.Description === "" ? "No description" : room.Description,
			],
		}),
		ElementCreate({
			tag: "div",
			classList: ["chat-search-room-page-tags"],
			children: ChatSearchCreateRoomPageTags(room),
		}),
		ElementButton.Create("chat-search-room-page-exit", () => {
			ChatSearchDialogElement?.close();
		}, {
			image: "Icons/cross.svg",
		}, {
			button: {
				classList: ["chat-search-room-page-exit-button"],
			},
		},
		)
	];
	const roomPageFooter = ElementCreate(
		{
			tag: "footer",
			classList: ["chat-search-room-page-footer"],
			children: [
				{
					tag: "div",
					classList: ["chat-search-room-page-member-count"],
					children: [
						`${room.MemberCount} / ${room.MemberLimit}`,
					],
				},
				ElementButton.Create("chat-search-room-page-join",
					() => {
						ChatSearchDialogElement?.close();
						ChatSearchJoin(room.Name);
					}, null, {
						button: {
							classList: ["chat-search-room-page-join-button"],
							attributes: {
								autofocus: true,
							},
							children: [
							ChatSearchGridRoomCanJoin(room) ? TextGet("JoinRoom") : TextGet("RoomUnavailable"),
							],
						},
					},
				),
			],
		}
	);
	ChatSearchDialogElement = ElementCreate({
		tag: "dialog",
		attributes: {
			id: "chat-search-room-page-dialog",
		},
		children: [
			{
				tag: "div",
				attributes: {
					id: "chat-search-room-page",
				},
				style: {
					backgroundImage: "var(--background)",
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				},
				children: [
					...roomPageElements,
					roomPageFooter,
				]
			},
		],
		parent: document.body,
	});
	ElementPositionFixed("chat-search-room-page", (2000 - 1200) / 2, (1000 - 700) / 2, 1200, 700);
	ChatSearchDialogElement.addEventListener("keydown", (ev) => {
		if (ev.key === "Escape") {
			ChatSearchDialogElement?.close();
			return;
		}
		if (ev.key === "Enter") {
			ChatSearchDialogElement?.close();
			ChatSearchJoin(room.Name);
		}
	}, { once: true });

	ChatSearchDialogElement.showModal();
	ChatSearchDialogElement.focus();
}

/**
 * Garbles based on immersion settings
 * @param {string} Text - The text to garble
 * @returns {string} - Garbled text
 */
function ChatSearchMuffle(Text) {
	let ret = Text;
	if (Player.ImmersionSettings && Player.ImmersionSettings.ChatRoomMuffle && Player.GetBlindLevel() > 0) {
		ret = SpeechGarbleByGagLevel(Player.GetBlindLevel() * Player.GetBlindLevel(), Text, true);
		if (ret.length == 0)
			return "...";
		return ret;
	}
	return ret;
}

/**
 * Joins the room with the given name
 * @param {string} RoomName - The name of the room to join
 * @returns {void} - Nothing
 */
function ChatSearchJoin(RoomName) {
	if (ChatSearchLastQueryJoin != RoomName || (ChatSearchLastQueryJoin == RoomName && ChatSearchLastQueryJoinTime + 1000 < CommonTime())) {
		ChatSearchLastQueryJoinTime = CommonTime();
		ChatSearchLastQueryJoin = RoomName;
		ServerSend("ChatRoomJoin", { Name: RoomName });
	}
}

/**
 * Switch the search screen between the normal view and the filter mode which allows hiding of rooms
 * @returns {void} - Nothing
 */
function ChatSearchToggleSearchMode() {
	switch (ChatSearchMode) {
		case "":
			// Switch to filter mode
			ChatSearchRoomGrid?.classList.add("chat-search-filter-search");
			ElementWrap("InputSearch")?.toggleAttribute("hidden", true);
			ElementWrap("InputFilter")?.toggleAttribute("hidden", false);
			document.getElementById("chat-search-room-search-button")?.toggleAttribute("disabled", true);
			if (ChatSearchSearchMenuButton?.getAttribute("aria-expanded") === "true") {
				ChatSearchSearchMenuButton.click();
			}
			ChatSearchSearchMenuButton?.toggleAttribute("disabled", true);

			// Save the current search query and load the filter string
			ChatSearchQueryString = ElementValue("InputSearch");
			ChatSearchFilterTermsTemp = Player.ChatSearchSettings.FilterTerms;
			ElementValue("InputFilter", ChatSearchFilterTermsTemp);
			ChatSearchMode = "Filter";
			ChatSearchQuery("");
			break;

		case "Filter":
			// Switch to Normal mode
			ChatSearchRoomGrid?.classList.remove("chat-search-filter-search");
			ElementWrap("InputSearch")?.toggleAttribute("hidden", false);
			ElementWrap("InputFilter")?.toggleAttribute("hidden", true);
			document.getElementById("chat-search-room-search-button")?.toggleAttribute("disabled", false);
			ChatSearchSearchMenuButton?.toggleAttribute("disabled", false);
			ChatSearchSaveFilterTerms();
			ChatSearchMode = "";
			ChatSearchQuery(ChatSearchQueryString);
			break;
	}
	ElementWrap('chat-search-room-filter-section')?.toggleAttribute("hidden", ChatSearchMode != "Filter");
	ElementWrap('chat-search-room-navigation-section')?.toggleAttribute("hidden", ChatSearchMode == "Filter");
	const filterButton = document.getElementById('chat-search-hide-rooms');
	if (filterButton) {
		const tooltip = filterButton.querySelector(".button-tooltip");
		if (tooltip) {
			tooltip.textContent = TextGet(ChatSearchMode != "Filter" ? "FilterMode" : "NormalMode");
		}
		filterButton.dataset.mode = ChatSearchMode == "Filter" ? "FilterMode" : "NormalMode";
	}
	ChatSearchSetPageRelative(0);
}

/**
 * Switch to the Hidden Rooms view or back again.
 * Correctly handles adding/removing the input box as needed.
 * @returns {void} - Nothing
 */
function ChatSearchToggleHiddenMode() {
	ChatSearchShowHiddenRoomsActive = !ChatSearchShowHiddenRoomsActive;
	ChatSearchSetPageRelative(0);
}

/**
 * Does whatever is necessary to unhide a room.
 * Shows a confirmation screen first, unless the only reason is "TempHidden".
 * This is called when clicking a room in the list and also, if a confirmation is shown, called again when the confirm button is clicked.
 *
 * @param {ChatRoomSearchResult | number} C - Index of the room within ChatSearchHiddenResult
 * @param {boolean} Confirmed - False when clicking on room list, true when clicking Confirm button
 * @returns {boolean}
 */
function ChatSearchClickUnhideRoom(C, Confirmed) {
	/** @type {ChatRoomSearchResult} */
	const Room = typeof C === "number" ? ChatSearchHiddenResult[C] : C;
	const roomIdx = ChatSearchHiddenResult.findIndex(r => r.Name === Room.Name);
	if (roomIdx === -1) return false;

	const Reasons = ChatSearchGetFilterReasons(Room);
	const ReasonsHasWord = (Reasons.indexOf("Word") != -1);
	const ReasonsHasTempHidden = (Reasons.indexOf("TempHidden") != -1);
	const ReasonsHasGhostList = (Reasons.indexOf("GhostList") != -1);

	// If the only reason is "TempHidden" we don't need a confirmation screen so just act like we clicked the confirm button already
	if (Reasons.length == 1 && ReasonsHasTempHidden) Confirmed = true;

	// If room matches filtered words, calculate the words to be removed/kept
	let KeepTerms = [], RemoveTerms = [];
	if (ReasonsHasWord) {
		let OldTerms = Player.ChatSearchSettings.FilterTerms.split(',').filter(s => s);
		for (let Idx = 0; Idx < OldTerms.length; Idx++)
			if (ChatSearchMatchesTerms(Room, [OldTerms[Idx].toUpperCase()]))
				RemoveTerms.push(OldTerms[Idx]);
			else
				KeepTerms.push(OldTerms[Idx]);
	}

	// If not confirmed, store data for later and show confirm screen
	if (!Confirmed) {
		const MemberLabel = ChatSearchMuffle(Room.Creator) + " (" + Room.CreatorMemberNumber + ")";
		ChatSearchCreateFilterUnhideConfirm(ChatSearchMuffle(Room.DisplayName) + " - " + MemberLabel, MemberLabel, RemoveTerms.join(','), Room);
		return true;
	}

	if (ReasonsHasWord) {
		// Remove all filtered terms that this room matches
		Player.ChatSearchSettings.FilterTerms = KeepTerms.join(',');
		ChatSearchUpdateSearchSettings();
		// Update the temp var too because we don't reload it when we exit the hidden room list
		ChatSearchFilterTermsTemp = Player.ChatSearchSettings.FilterTerms;
	}
	if (ReasonsHasTempHidden) {
		// Remove from Temp Hidden list
		const Idx = ChatSearchTempHiddenRooms.indexOf(Room.CreatorMemberNumber);
		ChatSearchTempHiddenRooms.splice(Idx, 1);
	}
	if (ReasonsHasGhostList) {
		// Remove creator from ghostlist
		ChatRoomListUpdate(Player.GhostList, false, Room.CreatorMemberNumber);
	}

	// Move the room from the hidden result to the normal result
	ChatSearchResult.push(Room);
	ChatSearchHiddenResult.splice(roomIdx, 1);
	const roomElem = document.getElementById(`chat-search-room-join-button-${Room.Order}`);
	roomElem?.setAttribute("data-temporary-hidden", "false");
	return true;
}

/**
 * Handles the reception of the server response when joining a room or when getting banned/kicked
 * @param {ServerChatRoomJoinResponse} data - Response from the server
 * @returns {void} - Nothing
 */
function ChatSearchResponse(data) {
	if (typeof data !== "string") return;
	if (((data == "RoomBanned") || (data == "RoomKicked")) && ServerPlayerIsInChatRoom()) {
		// Break all leashes when that happens
		// Can't do a proper ChatRoomStopHoldLeash() here because we're already gone from the room
		ChatRoomBreakLeash(null);
		ChatRoomLeashList = [];
		// This will cause us to send an extra ChatRoomLeave message
		ChatRoomLeave(true);
		CommonSetScreen("Online", "ChatSearch");
	}
	ChatSearchSendToast(data);
}

/**
 * Sends a toast message based on the given response type
 * @param {ServerChatRoomJoinResponse | "ServerTimeoutError" | "ServerInProgressError"} type
 */
function ChatSearchSendToast(type) {
	ToastManager.dismissByCategory("ChatSearch");

	if (["AlreadyInRoom", "RoomBanned", "RoomKicked", "RoomLocked", "RoomFull"].includes(type)) {
		ToastManager.warning(TextGet("Response" + type), { category: "ChatSearch" });
		return;
	}
	if (["CannotFindRoom", "AccountError", "InvalidRoomData", "ServerTimeoutError", "ServerInProgressError"].includes(type)) {
		ToastManager.error(TextGet("Response" + type), { category: "ChatSearch" });
		return;
	}
}

/**
 * Censors the chat search result name and description based on the player preference
 * @param {ServerChatRoomSearchData} searchData - The (potentially) to-be censored search result
 * @returns {null | { DisplayName: string, Description: string }} - The censored name and description or, if fully censored, return `null` instead
 */
function ChatSearchCensor(searchData) {
	const DisplayName = CommonCensor(searchData.Name);
	const Description = CommonCensor(searchData.Description);
	if (DisplayName === "¶¶¶" || Description === "¶¶¶") {
		return null;
	} else {
		return { DisplayName, Description };
	}
}

/**
 * Parse the passed server search data, ensuring that all required fields are present.
 * @param {ServerChatRoomSearchResultResponse} searchResults - The unparsed search data as received from the server
 * @returns {(ServerChatRoomSearchData & { DisplayName: string, Order: number })[]} - The fully parsed room search data
 */
function ChatSearchParseResponse(searchResults) {
	if (!CommonIsArray(searchResults)) {
		return [];
	}

	/** @type {(ServerChatRoomSearchData & { DisplayName: string, Order: number })[]} */
	const ret = [];
	let i = 0;
	for (const result of searchResults) {
		const censoredData = ChatSearchCensor(result);
		if (censoredData === null) {
			continue;
		}
		if (result.MemberLimit < Player.ChatSearchSettings.RoomMinSize || result.MemberLimit > Player.ChatSearchSettings.RoomMaxSize) {
			continue;
		}
		ret.push(/** @type {ChatRoomSearchResult} */({ ...result, ...censoredData, Order: i }));
		i++;
	}
	return ret;
}

/**
 * Handles the reception of the server data when it responds to the search query
 * @param {ServerChatRoomSearchResultResponse} data - Response from the server, contains the room list matching the query
 * @returns {void} - Nothing
 */
function ChatSearchResultResponse(data) {
	if (PandoraPenitentiaryIsInmate(Player)) {
		PandoraPenitentiaryResult(ChatSearchParseResponse(data));
		return;
	}
	ElementClearContents("InputSearch-datalist");
	ChatSearchResult = ChatSearchParseResponse(data);
	ChatSearchResultOffset = 0;
	ChatSearchQuerySort();
	ChatSearchApplyFilterTerms();
	ChatSearchAutoJoinRoom();
	ChatSearchSetPageRelative(0); // Refreshes the pagination
}

/**
 * Automatically join a room, for example due to leashes or reconnect
 * @returns {void} - Nothing
 */
function ChatSearchAutoJoinRoom() {
	// This is a search triggered from a relog
	if (Player.ImmersionSettings && Player.ImmersionSettings.ReturnToChatRoom && Player.LastChatRoom && !PandoraPenitentiaryIsInmate(Player) && ((ChatSearchReturnScreen?.[1] !== "AsylumEntrance") || (AsylumGGTSGetLevel(Player) <= 0))) {
		let roomFound = false;
		let roomIsFull = false;
		// Try joining our previous room
		for (let R = 0; R < ChatSearchResult.length; R++) {
			const room = ChatSearchResult[R];
			if (room.Name === Player.LastChatRoom.Name && room.Game == "") {
				if (room.MemberCount < room.MemberLimit) {
					const RoomName = room.Name;
					roomFound = true;
					ChatSearchJoin(RoomName);
					break;
				} else {
					roomIsFull = true;
					break;
				}
			}
		}

		// The room is gone, create from our previous room data if appropriate
		if (!roomFound) {
			if (Player.ImmersionSettings.ReturnToChatRoomAdmin
				&& Player.LastChatRoom.Admin
				&& Player.LastChatRoom.Background
				&& Player.LastChatRoom.Visibility != null
				&& Player.LastChatRoom.Limit
				&& Player.LastChatRoom.Description != null
				&& Player.LastChatRoom.Name) {

				if ((ChatAdminMessage === "ResponseRoomAlreadyExist" || roomIsFull) && ChatSearchRejoinIncrement < 50) {
					// The ChatRoomCreate call below failed. Append prefix and try again
					ChatSearchRejoinIncrement += 1;
					const ChatRoomSuffix = " " + ChatSearchRejoinIncrement;
					Player.LastChatRoom.Name = Player.LastChatRoom.Name.substring(0, Math.min(Player.LastChatRoom.Name.length, 19 - ChatRoomSuffix.length)) + ChatRoomSuffix; // Added
					ChatAdminMessage = "";
					ChatSearchQuery(ChatSearchQueryString);
				} else {
					/** @type {ChatRoomSettings} */
					const NewRoom = {
						Name: Player.LastChatRoom.Name.trim(),
						Description: Player.LastChatRoom.Description.trim(),
						Admin: [Player.MemberNumber],
						Whitelist: [],
						Ban: [],
						Background: Player.LastChatRoom.Background,
						Limit: Math.min(Math.max(Player.LastChatRoom.Limit, 2), 10),
						Game: "",
						Visibility: Player.LastChatRoom.Visibility,
						Access: ChatRoomAccessMode.PUBLIC,
						BlockCategory: Player.LastChatRoom.BlockCategory,
						Language: Player.LastChatRoom.Language,
						Space: Player.LastChatRoom.Space,
						Custom: Player.LastChatRoom.Custom,
						MapData: Player.LastChatRoom.MapData,
					};
					ServerSend("ChatRoomCreate", NewRoom);
					ChatAdminMessage = "CreatingRoom";

					// Actually set the real Admin list. This will get restored by ChatRoomRecreate when it runs
					if (Player.ImmersionSettings.ReturnToChatRoomAdmin && Player.LastChatRoom.Admin) {
						NewRoom.Admin = Player.LastChatRoom.Admin;
						ChatRoomNewRoomToUpdate = NewRoom;
						ChatRoomNewRoomToUpdateTimer = CurrentTime + 1000;
					}
				}
			} else {
				ChatSearchSendToast(roomIsFull ? "RoomFull" : "CannotFindRoom");
				ChatRoomSetLastChatRoom(null);
			}
		}
	}
}

const ChatSearchUpdateSearchSettings = CommonLimitFunction(function () {
	ServerAccountUpdate.QueueData({ ChatSearchSettings: Player.ChatSearchSettings });
}, 0, 3000);

/**
 * Sends the search query data to the server. The response will be handled by ChatSearchResponse once it is received
 * @param {string} Query - The search term to look for
 * @returns {SafePromise<void>} - Nothing
 */
async function ChatSearchQuery(Query) {
	if (Player.LastChatRoom?.Name) {
		if (Player.ImmersionSettings.ReturnToChatRoom) {
			Query = Player.LastChatRoom.Name.toUpperCase().trim();
		} else {
			// Just blank that out; the setting's disabled
			ChatRoomSetLastChatRoom(null);
		}
	} else {
		ChatSearchRejoinIncrement = 1; // Reset the join increment
	}

	/** @type {ServerChatRoomSearchRequest} */
	const SearchData = {
		Query: Query.toUpperCase().trim(),
		Language: ChatSearchLanguage,
		Space: ChatSearchGetSpace() ?? "",
		Game: ChatSearchGame,
		FullRooms: Player.ChatSearchSettings.FullRooms,
		ShowLocked: Player.ChatSearchSettings.ShowLocked,
		MapTypes: Player.ChatSearchSettings.MapTypes ? [Player.ChatSearchSettings.MapTypes] : [],
		SearchDescs: Player.ChatSearchSettings.SearchDescriptions,
	};

	const res = await ServerRoomSearch(Query.toUpperCase().trim(), SearchData);
	if (res.err) {
		if (res.error?.name === "ServerTimeoutError" || res.error?.name === "ServerInProgressError") {
			ChatSearchSendToast(res.error?.name);
		} else {
			console.log(res.error);
		}
		return;
	}

	ChatSearchResultResponse(res.value ?? []);
}

/**
 * Sorts the room result based on a player's settings
 * @returns {void} - Nothing
 */
function ChatSearchQuerySort() {
	// Send full rooms to the back of the list and save the order of creation.
	ChatSearchResult.sort((R1, R2) => Number(R1.MemberCount >= R1.MemberLimit) - Number(R2.MemberCount >= R2.MemberLimit) || R1.Order - R2.Order);

	// Friendlist option overrides basic order, but keeps full rooms at the back for each number of each different total of friends.
	if (Player.OnlineSettings.SearchFriendsFirst) {
		ChatSearchResult.sort((R1, R2) => R2.Friends.length - R1.Friends.length);
	}
}

/**
 * Remove any rooms from the room list which contain the player's filter terms in the name
 * @returns {void} - Nothing
 */
function ChatSearchApplyFilterTerms() {
	ChatSearchHiddenResult = ChatSearchResult.filter(room => { return ChatSearchGetFilterReasons(room).length != 0; });
	ChatSearchResult = ChatSearchResult.filter(room => { return ChatSearchGetFilterReasons(room).length == 0; });
}

/**
 * Get a list of reasons why a room should be hidden.
 * If the returned array is empty, the room should be shown.
 * @param {{ Name: string, CreatorMemberNumber: number }} Room - the room object to check
 * @returns {string[]} - list of reasons
 */
function ChatSearchGetFilterReasons(Room) {
	const Reasons = [];

	// for an exact room name match, ignore filters
	if (ChatSearchMode == "" && Room.Name.toUpperCase() == ElementValue("InputSearch").toUpperCase().trim())
		return [];

	// are any words filtered?
	if (ChatSearchMatchesTerms(Room, Player.ChatSearchSettings.FilterTerms.split(',').filter(s => s).map(s => s.toUpperCase())))
		Reasons.push("Word");

	// is room temp hidden?
	if (ChatSearchTempHiddenRooms.indexOf(Room.CreatorMemberNumber) != -1)
		Reasons.push("TempHidden");

	// is creator on ghostlist?
	if (Player.HasOnGhostlist(Room.CreatorMemberNumber))
		Reasons.push("GhostList");

	return Reasons;
}

/**
 * Check if a room matches filtered-out terms and should thus be hidden.
 * Also used when deciding which terms need to be removed from the filter option in order to make a room be no longer hidden.
 * Only checks the room name, not the description.
 * @param {{ Name: string }} Room - the room object to check
 * @param {string[]} Terms - list of terms to check
 * @returns {boolean} - true if room matches, false otherwise
 */
function ChatSearchMatchesTerms(Room, Terms) {
	const roomName = Room.Name.toUpperCase();
	return Terms.some(term => roomName.includes(term));
}

/**
 * Calculates starting offset for the ignored rooms list when displaying results in filter/permission mode.
 * @param {number} shownRooms - Number of rooms shown before the ignored rooms.
 * @returns {number} - Starting offset for ingored rooms
 * @deprecated
 */
function ChatSearchCalculateIgnoredRoomsOffset(shownRooms) {
	return ChatSearchResultOffset + shownRooms - ChatSearchResult.length;
}

/**
 * Return the space we're currently in.
 * Note that it will look at both the current room's, and if we're not in one, the current lobby
 * @returns {ServerChatRoomSpace}
 */
function ChatSearchGetSpace() {
	return ChatRoomData?.Space ?? ChatSearchSpace ?? ChatRoomSpaceType.MIXED;
}
