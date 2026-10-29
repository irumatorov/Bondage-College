"use strict";

const ChatRoomMapViewName = "Map";
var ChatRoomMapViewPerceptionRange = 4;
var ChatRoomMapViewPerceptionRangeMin = 1;
var ChatRoomMapViewPerceptionRangeMax = 7;
/** @type {ChatRoomMapViewEditModeType} */
var ChatRoomMapViewEditMode = "";
var ChatRoomMapViewEditPath = "";
var ChatRoomMapViewLastSearch = "";
/** @type {"" | ChatRoomMapTileType | ChatRoomMapObjectType} */
var ChatRoomMapViewEditSubMode = "";
/** Currently dragging the mouse with an active tool */
var ChatRoomMapViewEditStarted = false;
/** @type {ChatRoomMapViewToolName | ""} */
var ChatRoomMapViewActiveTool = "";
/** @type {null | ChatRoomMapDoodad} */
var ChatRoomMapViewEditObject = null;
/**
 * @type {number[]}
 * @deprecated Use {@link ChatRoomMapViewPixelToTileCoordinates} and {@link ChatRoomMapViewEditRange}
 */
var ChatRoomMapViewEditSelection = [];
var ChatRoomMapViewEditRange = 1;
var ChatRoomMapViewMaxEditRange = 5;
/**
 * @type {ServerChatRoomMapData[]}
 * @deprecated Handled internally by {@link MapManager}.
 */
var ChatRoomMapViewEditBackup = [];
/** @type {null | number} */
var ChatRoomMapViewUpdateRoomNext = null;
/** @type {null | number} */
var ChatRoomMapViewUpdatePlayerNext = null;
/** @type {null | number} */
var ChatRoomMapViewUpdateLastMapDataNext = null;
/** @type {null | OnlineCharacter} */
var ChatRoomMapViewFocusedCharacter = null;
var ChatRoomMapViewFocusedCharacterX = 0;
var ChatRoomMapViewFocusedCharacterY = 0;
var ChatRoomMapViewSuperPowersActive = false;
// The base number of miliseconds required to reach a new tile
var ChatRoomMapViewBaseMovementSpeed = 200;
/** @type {null | ChatRoomMapMovement} */
var ChatRoomMapViewMovement = null;
/** @type {ChatRoomMapType[]} */
var ChatRoomMapViewTypeList = ["Never", "Hybrid", "Always"];
var ChatRoomMapViewUpdatePlayerTime = 500;
const ChatRoomMapViewWhisperRange = 1;
const ChatRoomMapViewInteractionRange = 1;
const ChatRoomMapViewRemoteRange = ChatRoomMapViewPerceptionRangeMax;
const ChatRoomMapSignTextMaxLength = 150;
var ChatRoomMapViewEditorMaxRecentElements = 16;

/**
 * @type {boolean[]}
 * @deprecated Use {@link MapManager.Map.isTileVisible()}
 */
var ChatRoomMapViewVisibilityMask = [];
/**
 * @type {boolean[]}
 * @deprecated Use {@link MapManager.Map.isTileHearable()}
 */
var ChatRoomMapViewAudibilityMask = [];
/** @type {Uint16Array | null} */
var ChatRoomMapViewTileFog = null;
/** @type {Uint16Array | null} */
var ChatRoomMapViewObjectFog = null;
var ChatRoomMapViewKeysPressed = {
	North: false,
	South: false,
	West: false,
	East: false,
};
var ChatRoomMapViewStartOfKeyPress = 0;
/** @type {Map<number, OnlineCharacter[]>} */
var ChatRoomMapViewCharacterMap = new Map();
/** @type {{ C: OnlineCharacter, rect: RectTuple, charX: number, charY: number }[]} */
var ChatRoomMapViewNameTags = [];
/** TRUE while an admin picks where the selected teleport pad sends to */
var ChatRoomMapViewTeleportPadPicking = false;
/** @type {null | number} - The teleport pad whose menu is open */
var ChatRoomMapViewTeleportPadIndex = null;
/** @type {null | { indexes: number[], color: HexColor }} - The teleport pads shown in the color being picked for them */
var ChatRoomMapViewTeleportPadPreview = null;
/** TRUE while the color picker is open over the chat log */
var ChatRoomMapViewColorPicker = false;
/** @type {Map<string, HTMLCanvasElement>} - Map object images already colorized, by image and color */
var ChatRoomMapViewColoredImages = new Map();
/** @type {null | HTMLElement} */
var ChatRoomMapViewDialogMenu = null;
/** @type {HTMLElement} */
var ChatRoomMapViewPanel;
/** @type {HTMLElement} */
var ChatRoomMapViewPanelContainer;
/** @type {null | number} */
var ChatRoomMapViewSelectedObjectIndex = null;

document.addEventListener("blur", () => {
	if (ChatRoomMapViewIsActive()) ChatRoomMapViewBlur();
});

/**
 * Returns TRUE if the player is an admin and activated her super powers on the map
 * @returns {boolean} - TRUE if super powers are active
 */
function ChatRoomMapViewHasSuperPowers() { return ChatRoomMapViewSuperPowersActive && ChatRoomPlayerIsAdmin(); }

/**
 * When the screen loses focus, we clear the keys pressed because we don't want movement to get stuck
 */
function ChatRoomMapViewBlur() {
	ChatRoomMapViewKeysPressed = {South: false, West: false, East: false, North: false};
}

/**
 * Initializes the map to its default blank state
 * @param {ChatRoomMapType} mode
 * @returns {ServerChatRoomMapData}
 */
function ChatRoomMapViewInitialize(mode) {
	const defaultMap = String.fromCharCode(ChatRoomMapViewObjectStartID).repeat(ChatRoomMapViewWidth * ChatRoomMapViewHeight);
	return {
		Type: mode,
		Tiles: defaultMap,
		Objects: defaultMap,
		Effects: undefined,
	};
}

/**
 * Initializes the character's map data to its default blank state
 * @param {Character} C - The character to be initialized
 * @returns {ChatRoomMapData | null}
 */
function ChatRoomMapViewInitializeCharacter(C) {
	if (ChatRoomData?.MapData?.Type !== "Always" && ChatRoomData?.MapData?.Type !== "Hybrid") return null;
	// We use LastMapData here in case it's a relog into the room
	const oldData = C.MapData ??
		(C.IsPlayer() && Player.ImmersionSettings.ReturnToChatRoom && Player.LastChatRoom?.Name === ChatRoomData?.Name ?
			Player.LastMapData
			: undefined
		);
	C.LastMapData = C.MapData = ServerAccountDataSyncedValidate.MapData(oldData, C);
	if (C.IsPlayer()) {
		// We throw in an update so that everyone sees us at the proper location
		ServerSend("ChatRoomCharacterMapDataUpdate", C.MapData);
	}
	return C.MapData;
}

/**
 * Validate the passed chat room map positions.
 * @param {unknown} position
 * @returns {ChatRoomMapPos}
 */
function ChatRoomMapViewValidatePosition(position) {
	const pos = /** @type {ChatRoomMapPos} */ (position);
	return ServerAccountDataSyncedValidate.MapData.Pos(pos, Player);
}

/**
 * Checks if the coordinates are out of bounds relative to the map
 * @param {ChatRoomMapPos} position
 */
function ChatRoomMapViewIsOutOfBounds(position) {
	return position.X > ChatRoomMapViewWidth || 0 > position.X || position.Y > ChatRoomMapViewHeight || 0 > position.Y;
}

/**
 * Performs cleanup when leaving the chat room map
 * @deprecated
 * @returns {void} - Nothing
 */
function ChatRoomMapViewLeave() {
	ChatRoomMapViewDeactivate();
	ChatRoomActivateView(ChatRoomCharacterViewName);
	Player.MapData = undefined;
}

/**
 * Activates the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewActivate() {
	MapManager.OnViewActivate();
	ChatRoomMapViewCreateUI();
}

function ChatRoomMapViewCreateUI() {
	if (!ElementWrap("chat-room-map-view-panel")) ChatRoomMapViewPanel = ElementCreate({
		tag: "div",
		attributes: { id: "chat-room-map-view-panel" },
		parent: document.body,
	});

	if (!ElementWrap("chat-room-map-view-panel-container"))	ChatRoomMapViewPanelContainer = ElementCreate({
		tag: "div",
		attributes: { id: "chat-room-map-view-panel-container" },
		parent: ChatRoomMapViewPanel,
	});

	ChatRoomMapViewShowEditor();
	ChatRoomMapViewCreateDialogMenu();
}

function ChatRoomMapViewCreateDialogMenu() {
	if (ElementWrap("chat-room-map-view-dialog-menu")) return;
	ChatRoomMapViewDialogMenu = ElementCreate({
		tag: "div",
		classList: ["chat-room-map-view-dialog"],
		attributes: { id: "chat-room-map-view-dialog-menu", hidden: "true" },
		children: [
			{
				tag: "header",
				classList: ["chat-room-map-view-dialog-header"],
				children: [
					{
						tag: "div",
						classList: ["chat-room-map-view-dialog-header-title"],
						textContent: "Title"
					},
					ElementButton.Create(null, () => {
						ChatRoomMapViewHideDialogMenu();
					},
					{
						tooltip: "Close",
					},
					{
						button: {
							classList: ["chat-room-map-view-dialog-header-close-button"],
							children: [
								"×"
							]
						}
					}),
				]
			},
			{
				tag: "div",
				classList: ["chat-room-map-view-dialog-content"],
				children: [
				]
			},
			{
				tag: "footer",
				classList: ["chat-room-map-view-dialog-footer"],
				children: [
				]
			},
		],
		parent: ChatRoomMapViewPanelContainer,
	});
}

/**
 * @param {string} title
 * @param {HTMLElement} content
 * @param {HTMLElement} [footer]
 */
function ChatRoomMapViewShowDialogMenu(title, content, footer) {
	if (ElementWrap("chat-room-map-view-dialog-menu")) ChatRoomMapViewCreateDialogMenu();
	ChatRoomMapViewDialogMenu?.removeAttribute("hidden");
	const titleElement = ChatRoomMapViewDialogMenu?.querySelector(".chat-room-map-view-dialog-header-title");
	if (titleElement) titleElement.textContent = title;
	ChatRoomMapViewDialogMenu?.querySelector(".chat-room-map-view-dialog-content")?.replaceChildren(content);
	ChatRoomMapViewDialogMenu?.querySelector(".chat-room-map-view-dialog-footer")?.replaceChildren(footer ?? "");
}

function ChatRoomMapViewHideDialogMenu() {
	ChatRoomMapViewDialogMenu?.setAttribute("hidden", "true");
	ChatRoomMapViewTeleportPadIndex = null;
	ChatRoomMapViewTeleportPadPicking = false;
}

function ChatRoomMapViewShowEditor() {
	if (ElementWrap("chat-room-map-view-panel-editor")) return;

	ElementCreate({
		tag: "div",
		attributes: {
			id: "chat-room-map-view-panel-editor",
			"data-is-admin": ChatRoomPlayerIsAdmin() ? "true" : undefined
		},
		children: [
			// search
			{
				tag: "div",
				attributes: { id: "chat-room-map-view-panel-editor-search" },
				children: [
					{
						tag: "img",
						attributes: {
							id: "chat-room-map-view-panel-editor-search-icon",
							src: "Icons/Search.svg",
							"aria-hidden": "true",
						},
					},
					{
						tag: "input",
						attributes: {
							id: "chat-room-map-view-panel-editor-search-input",
							type: "search",
							autofocus: true,
							autocomplete: "off",
						},
						eventListeners: {
							keyup: function (e) {
								if (!ChatRoomMapViewKeyUp(e)) {
									ChatRoomMapViewReloadEditorPanel(false, this.value);
								}
							},
						}
					}
				]
			},
			{
				tag: "div",
				attributes: { id: "chat-room-map-view-panel-editor-content" },
				children: [
					{
						tag: "div",
						attributes: { id: "chat-room-map-view-panel-editor-buttons-list", role: "group" },
						children: [],
					},
					{
						tag: "div",
						attributes: { id: "chat-room-map-view-panel-editor-items"},
						children: [
							ElementCreateRadioButtonGroup("chat-room-map-view-panel-editor-items-grid",
								() => {},
								"",
								[]
							),
							{
								"tag": "div",
								"attributes": { id: "chat-room-map-view-panel-editor-recent-items" },
								children: [
									{
										"tag": "div",
										"attributes": { id: "chat-room-map-view-panel-editor-recent-items-label"},
										children: [TextGet("ChatRoomMapViewRecentItemsLabel")]
									},
									ElementCreateRadioButtonGroup("chat-room-map-view-panel-editor-recent-items-grid",
										() => {},
										"",
										[]
									)
								]
							},
							{
								"tag": "div",
								"attributes": { id: "chat-room-map-view-panel-editor-selection"  },
								children: []
							}
						]

					},
				],
			},
		],
		parent: ChatRoomMapViewPanelContainer,
	});
	ChatRoomMapViewReloadEditorPanel();
	ChatRoomMapViewResize(true);
}

/**
 * Switches the editor palette mode.
 *
 * Changing mode or submode clears the selected doodad.
 * A tool that can no longer paint is cleared too.
 * @param {ChatRoomMapViewEditModeType} mode
 * @param {"" | ChatRoomMapTileType | ChatRoomMapObjectType} subMode
 */
function ChatRoomMapViewEditorSetMode(mode, subMode) {
	if (ChatRoomMapViewEditMode === mode && ChatRoomMapViewEditSubMode === subMode) return;
	ChatRoomMapViewEditMode = mode;
	ChatRoomMapViewEditSubMode = subMode;
	ChatRoomMapViewEditObject = null;
	const activeTool = ChatRoomMapViewGetActiveTool();
	if (activeTool && !activeTool.canPaint()) ChatRoomMapViewSetActiveTool("");
}

/**
 * @param {ChatRoomMapDoodad} item
 * @param {MapDataDoodadType} type
 * @param {boolean} [updateRecent]
 * @deprecated Use {@link ChatRoomMapViewEditorSetSelection} instead
 * @returns {void}
 */
function ChatRoomMapViewSetSelection(item, type, updateRecent=true) {
	ChatRoomMapViewEditorSetSelection(item, type, updateRecent);
}

/**
 * @param {ChatRoomMapDoodad} item
 * @param {MapDataDoodadType} type
 * @param {boolean} [updateRecent]
 * @returns {void}
 */
function ChatRoomMapViewEditorSetSelection(item, type, updateRecent=true) {
	/** @type {"" | ChatRoomMapTileType | ChatRoomMapObjectType} */
	let subMode = "";
	if (MapDoodadIsObject(item) || MapDoodadIsTile(item)) {
		subMode = item.Type;
	}
	ChatRoomMapViewEditorSetMode(type, subMode);
	ChatRoomMapViewEditObject = CommonCloneDeep(item);
	ChatRoomMapViewSetActiveTool("Brush");
	if (MapDoodadIsObject(item)) {
		if ((item.AssetName != null) && (item.AssetGroup != null) && !InventoryAvailable(Player, item.AssetName, item.AssetGroup)) return;
	}
	document.getElementById("chat-room-map-view-panel-editor-recent-items-grid")?.setAttribute("value", item.ID, );
	if (updateRecent) {
		Player.RecentlyUsedMapElements = [
			item,
			...Player.RecentlyUsedMapElements.filter((existingItem) => existingItem.DoodadType !== item.DoodadType || existingItem.ID !== item.ID),
		].slice(0, ChatRoomMapViewEditorMaxRecentElements);
		ServerSend('AccountUpdate', {
			RecentlyUsedMapElements: MapPackDoodads(Player.RecentlyUsedMapElements),
		});
		ChatRoomMapViewReloadEditorPanel(true);
		return;
	}
	document.getElementById("chat-room-map-view-panel-editor-selection")?.replaceChildren?.(...ChatRoomMapViewGetSelection());
}

/**
 * Refreshes the UI
 * @param {boolean} [selectionOnly]
 * @param {string} [search]
 */
function ChatRoomMapViewReloadEditorPanel(selectionOnly=false, search="") {
	if (search != null) ChatRoomMapViewLastSearch = search;

	document.getElementById("chat-room-map-view-panel-editor-recent-items-grid")?.replaceChildren?.(...ChatRoomMapViewGetRecentItems());
	document.getElementById("chat-room-map-view-panel-editor-selection")?.replaceChildren?.(...ChatRoomMapViewGetSelection());
	if (selectionOnly) return;

	document.getElementById("chat-room-map-view-panel-editor-items-grid")?.replaceChildren?.(...ChatRoomMapViewGetItems(search));
	document.getElementById("chat-room-map-view-panel-editor-buttons-list")?.replaceChildren?.(...ChatRoomMapViewGetButtons());

	const panel = document.getElementById("chat-room-map-view-panel-editor");
	if (panel == null) return;

	if (ChatRoomMapViewEditMode !== "") {
		panel.setAttribute("data-edit-mode", ChatRoomMapViewEditMode);
	} else {
		panel.removeAttribute("data-edit-mode");
	}

	if (ChatRoomMapViewEditSubMode !== "") {
		panel.setAttribute("data-edit-mode-sub", ChatRoomMapViewEditSubMode);
	} else {
		panel.removeAttribute("data-edit-mode-sub");
	}
}

function ChatRoomMapViewGetButtons() {
	const zoomButtons = [
		ChatMapRoomViewCreateCategoryButton(() => {
			ChatRoomMapViewPerceptionRange = CommonClamp(ChatRoomMapViewPerceptionRange - 1, ChatRoomMapViewPerceptionRangeMin, ChatRoomMapViewPerceptionRangeMax);
		},"Icons/Plus.png", TextGet("EditorButtonTextZoomIn")),

		ChatMapRoomViewCreateCategoryButton(() => {
			ChatRoomMapViewPerceptionRange = CommonClamp(ChatRoomMapViewPerceptionRange + 1,ChatRoomMapViewPerceptionRangeMin, ChatRoomMapViewPerceptionRangeMax);
		}, "Icons/Minus.png", TextGet("EditorButtonTextZoomOut")),
	];

	if (!ChatRoomPlayerIsAdmin()) return zoomButtons;
	const backButton = ChatMapRoomViewCreateCategoryButton(() => {
		switch (ChatRoomMapViewEditMode) {
			case "Object":
				ChatRoomMapViewEditorSetMode("ObjectType", "");
				break;
			case "Tile":
				ChatRoomMapViewEditorSetMode("TileType", "");
				break;
			case "ObjectType":
			case "TileType":
			case "Effect":
				ChatRoomMapViewEditorSetMode("", "");
				break;
			case "":
				break;
		}
		ChatRoomMapViewReloadEditorPanel();
	}, "Icons/MapView.png", TextGet("EditorButtonTextBack"));

	const editRangeButton = ElementButton.Create(null, function () {
		ChatRoomMapViewEditRange = CommonParseInt(this.getAttribute("aria-valuenow") ?? "") ?? 1;
		this.querySelector(".button-image")?.setAttribute("src",  `Icons/Range/${ChatRoomMapViewEditRange.toString()}.png`);
	}, { image: `Icons/Range/${ChatRoomMapViewEditRange.toString()}.png`,
		tooltip:  TextGet("EditorButtonTextEditRange"),
		tooltipPosition: "right",
	 }, {
		button: { classList: ["chat-room-map-view-category-button"],
			attributes:{
				role: "spinbutton",
				"aria-valuenow": ChatRoomMapViewEditRange,
				"aria-valuemin": 1,
				"aria-valuemax": ChatRoomMapViewMaxEditRange,
			}
		 }
	});

	const buttons = [
		...zoomButtons,
		ElementButton.Create(null, function () {
			if (!ChatRoomPlayerIsAdmin()) return;
			MapManager.Map.hasFogEnabled = !MapManager.Map.hasFogEnabled;
			this.querySelector(".button-image")?.setAttribute("src", `Icons/Fog${ChatRoomMapFogIsActive() ? "Active" : "Inactive"}.png`);
		}, { image: `Icons/Fog${ChatRoomMapFogIsActive() ? "Active" : "Inactive"}.png`,
			tooltip: TextGet("EditorButtonTextToggleFog"),
			tooltipPosition: "right",
		}, {
			button: { classList: ["chat-room-map-view-category-button"],
				attributes:{
					role: "checkbox",
				}
			}
		}),
		ChatMapRoomViewCreateCategoryButton(() => {
			if (!ChatRoomPlayerIsAdmin()) return;
			ChatRoomMapViewUndo();
		}, "Icons/Undo.png", TextGet("EditorButtonTextUndo")),


	];

	const objectEditing = ChatRoomMapViewEditMode === "Object" || ChatRoomMapViewEditMode === "ObjectType";
	const eraserButton = ElementWrap("chat-room-map-view-eraser") ?? ElementButton.Create("chat-room-map-view-eraser", function () {
		if (this.getAttribute("aria-checked") === "true") {
			ChatRoomMapViewSetActiveTool("Eraser");
		} else if (ChatRoomMapViewTools.Brush.canPaint()) {
			ChatRoomMapViewSetActiveTool("Brush");
		} else {
			ChatRoomMapViewSetActiveTool("");
		}
	}, {
		image: "Icons/Eraser.svg",
		tooltip: objectEditing ? TextGet("EditorButtonTextEraserAlt") : TextGet("EditorButtonTextEraser"),
		tooltipPosition: "right",
	}, {
		button: {
			classList: ["chat-room-map-view-category-button"],
			attributes: {
				role: "checkbox",
				"aria-checked": ChatRoomMapViewActiveTool === "Eraser" ? "true" : "false",
			},
		},
	});
	const eraserButtons = ChatRoomMapViewTools.Eraser.canPaint() ? [eraserButton] : [];

	switch (ChatRoomMapViewEditMode) {
		case "":
			return [
				ChatMapRoomViewCreateCategoryButton(() => {
					if (!ChatRoomPlayerIsAdmin()) return;
					ChatRoomMapViewEditMode = "TileType";
					ChatRoomMapViewEditSubMode = "";
					ChatRoomMapViewReloadEditorPanel();
				}, "Icons/EditTile.png", TextGet("EditorButtonTextEditTiles")),

				ChatMapRoomViewCreateCategoryButton(() => {
					if (!ChatRoomPlayerIsAdmin()) return;
					ChatRoomMapViewEditMode = "ObjectType";
					ChatRoomMapViewEditSubMode = "";
					ChatRoomMapViewReloadEditorPanel();
				}, "Icons/EditObject.png", TextGet("EditorButtonTextEditObjects")),

				ChatMapRoomViewCreateCategoryButton(() => {
					if (!ChatRoomPlayerIsAdmin()) return;
					ChatRoomMapViewEditorSetSelection(MapDataGetEffect(AssetsMapDataEffects[1].ID), "Effect", false);
					ChatRoomMapViewReloadEditorPanel();
				}, "Icons/Light.png", TextGet("EditorButtonTextEditEffects")),
				...buttons,
			];
		case "ObjectType":
			return [
				backButton,
				editRangeButton,
				...eraserButtons,
				...[...MapDataObjectTypes].map((type) => {
					return ChatMapRoomViewCreateCategoryButton(() => {
						ChatRoomMapViewEditorSetMode("Object", type);
						ChatRoomMapViewReloadEditorPanel();

					}, MapGetAssetUrl("Object") + "Type/" + type + ".png", TextGet("ObjectTypeName" + type));
				}),
				...buttons,
			];
		case "TileType":
			return [
				backButton,
				editRangeButton,
				...eraserButtons,
				...[...MapDataTileTypes].map((type) => {
					return ChatMapRoomViewCreateCategoryButton(() => {
						ChatRoomMapViewEditorSetMode("Tile", type);
						ChatRoomMapViewReloadEditorPanel();

					}, MapGetAssetUrl("Tile") + "Type/" + type + ".png", TextGet("TileTypeName" + type));
				}),
				...buttons,
			];
		default: {
			return [
				backButton,
				editRangeButton,
				...eraserButtons,
				...buttons,
			];
		}
	}
}

/**
 * Creates a category button
 * @param {(this: HTMLButtonElement, ev: PointerEvent) => void} callback
 * @param {string} image
 * @param {string} [tooltip]
 */
function ChatMapRoomViewCreateCategoryButton(callback, image, tooltip) {
	return ElementButton.Create(null, callback, { image,
		tooltip: tooltip,
		tooltipPosition: "right",
	 }, {
		button: { classList: ["chat-room-map-view-category-button"] }
	});
}

/**
 * Returns the list of items for the current mode
 * @param {string} [search]
 * @returns {Element[]}
 */
function ChatRoomMapViewGetItems(search) {
	if (search) { // can't search / didn't bother for effects because they have no name like "red" or "yellow tint"
		let items = [...MapDataTiles.values(), ...MapDataObjects.values(), ...MapDataEffects.values()];
		if (ChatRoomMapViewEditSubMode != "") {
			items = items.filter((item) => item.Type == ChatRoomMapViewEditSubMode);
		}

		const searchTokens = search.toLowerCase().trim().split(/\s+/);
		items = items.filter((item) => {
			if (MapDoodadIsDeprecated(item)) return false;
			if (!MapDoodadIsPhysicalElement(item) || !item.Style) return false;

			const styleWords = CommonUncamelize(item.Style);
			return searchTokens.every((sToken) =>
				styleWords.some((sWord) => sWord.includes(sToken))
			);
		});
		return [...items].map((item) => ChatRoomMapViewCreateMapElementItem(item));
	}
	switch (ChatRoomMapViewEditMode) {
		case "Tile":
		case "TileType": {
			const items = [...MapDataTiles.values()].filter((tile) => tile.Type == ChatRoomMapViewEditSubMode);
			return [...items].map((item) => ChatRoomMapViewCreateMapElementItem(item));
		}
		case "Object": {
			const items = [...MapDataObjects.values()].filter((object) => object.Type == ChatRoomMapViewEditSubMode && object.DeprecatedID === undefined);
			return [...items].map((item) => ChatRoomMapViewCreateMapElementItem(item));
		}
		case "Effect":
			return [...MapDataEffects.values()].map((item) => ChatRoomMapViewCreateMapElementItem(item));
		default:
			return [];
	}
}

/**
 * Typecheck for {@link ChatRoomMapEffect}
 * @param {ChatRoomMapDoodad} element - The element to check
 * @returns {element is ChatRoomMapEffect}
 * @deprecated Use {@link MapDoodadIsEffect}
 */
function ChatRoomMapViewIsChatRoomMapEffect(element) {
	return element.DoodadType === "Effect";
}

/**
 * Typecheck for {@link ChatRoomMapPhysicalElement}
 * @param {ChatRoomMapDoodad} element - The element to check
 * @returns {element is ChatRoomMapPhysicalElement}
 * @deprecated Use {@link MapDoodadIsPhysicalElement}
 */
function ChatRoomMapViewIsChatRoomMapPhysicalElement(element) {
	return "Style" in element;
}

/**
 * Typecheck for {@link ChatRoomMapObject}
 * @param {ChatRoomMapDoodad} element - The element to check
 * @returns {element is ChatRoomMapObject}
 * @deprecated Use {@link MapDoodadIsObject}
 */
function ChatRoomMapViewIsChatRoomMapObject(element) {
	return element.DoodadType === "Object";
}

/**
 * Typecheck for {@link ChatRoomMapTile}
 * @param {ChatRoomMapDoodad} element - The element to check
 * @returns {element is ChatRoomMapTile}
 * @deprecated Use {@link MapDoodadIsTile}
 */
function ChatRoomMapViewIsChatRoomMapTile(element) {
	return element.DoodadType === "Tile";
}

/**
 * Creates an item for the chat room map view
 * @param {ChatRoomMapDoodad} item - The map element to create
 * @param {boolean} [updateRecent]
 * @param {boolean} [readOnly]
 * @returns {Element} - The created item
 */
function ChatRoomMapViewCreateMapElementItem(item, updateRecent=true, readOnly=false) {
	/** @type {Record<string, string>} */
	const buttonStyle = {};
	let imageUrl = null;
	/** @type {MapDataDoodadType} */
	let type = "Tile";
	let isOwned = true;
	let rotation = 0;
	if (MapDoodadIsObject(item)) {
		type = "Object";
		imageUrl = MapGetAssetUrl("Object", item.Type, item.PaletteImage ?? item.Style);
		if (item.Rotation != null) rotation = item.Rotation;
		if ((item.AssetName != null) && (item.AssetGroup != null) && !InventoryAvailable(Player, item.AssetName, item.AssetGroup)) isOwned = false;
	} else if (MapDoodadIsTile(item)) {
		type = "Tile";
		if (item.Rotation != null) rotation = item.Rotation;
		imageUrl = MapGetAssetUrl("Tile", item.Type, item.PaletteImage ?? item.Style);
	} else if (MapDoodadIsEffect(item)) {
		type = "Effect";
		buttonStyle.Background = RgbaArrayToHTMLColor(item.Color);
		imageUrl = null;
	} else {
		console.warn("Unknown map element type: " + JSON.stringify(item));
	}
	const classList = ["element-button-group-button", "chat-room-map-view-item-button"];
	const selected = ChatRoomMapViewEditObject?.ID === item.ID && ChatRoomMapViewEditObject.Type === item.Type;
	if (selected) {
		classList.push("chat-room-map-view-item-selected");
	}
	const element = ElementButton.Create(null, function () {
		ChatRoomMapViewEditorSetSelection(item, type, updateRecent);
	}, {
		image: imageUrl?.endsWith("/Blank.png") != false ? undefined : imageUrl,
	}, {
		button: {
			classList,
			style: buttonStyle,
			attributes: {
				role: "radio",
				disabled: !isOwned || readOnly,
				"aria-hidden": readOnly ? "true" : undefined,
				value: `${type}-${item.Type}-${item.ID}`,
				tabindex: "-1",
				"aria-checked": selected ? "true" : "false",
				"readonly": readOnly ? "true" : undefined
			},
		}
	});

	if (rotation) {
		element.style.setProperty("--rotation", `${rotation}deg`);
	}

	return element;
}

function ChatRoomMapViewGetSelection() {
	let tooltip = null;
	const item = ChatRoomMapViewEditObject;

	/** @type {(string: string) => string} */
	const format = (string) => CommonUncamelize(string).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
	if (item != null)  {

		if (MapDoodadIsObject(item)) {
			tooltip = `${TextGet(`ObjectTypeName${item.Type}`)}/${item.Name ?? format(item.Style)} (${item.ID})`;
		} else if (MapDoodadIsTile(item)) {
			tooltip = `${TextGet(`TileTypeName${item.Type}`)}/${item.Name ?? format(item.Style)} (${item.ID})`;
		} else if (MapDoodadIsEffect(item)) {
			tooltip = `${TextGet(`EffectTypeName${item.Type}`)}/${item.Name ?? "Effect"} ${item.ID}`;
		} else {
			console.warn("Unknown map element type: " + JSON.stringify(item));
		}
		const button = ChatRoomMapViewCreateMapElementItem(item, false, true);
		return [button, ElementCreate({
			tag: "label",
			children: [tooltip]
		})];
	}
	if (ChatRoomMapViewEditSubMode == "") {
		tooltip = ChatRoomMapViewEditMode;
	} else if (ChatRoomMapViewEditMode === "Object") {
		tooltip = ChatRoomMapViewEditSubMode + "/";
	} else if (ChatRoomMapViewEditMode === "Tile") {
		tooltip = ChatRoomMapViewEditSubMode + "/";
	} else if (ChatRoomMapViewEditMode === "Effect") {
		tooltip = ChatRoomMapViewEditSubMode + "/";
	}
	return [ElementCreate({
		tag: "label",
		children: [tooltip]
	})];
}

/**
 * Returns the last 8 recently used items
 * @returns {Element[]}
 */
function ChatRoomMapViewGetRecentItems() {
	return Player.RecentlyUsedMapElements
		.slice(0, ChatRoomMapViewEditorMaxRecentElements)
		.map(item => ChatRoomMapViewCreateMapElementItem(item, false));
}

/** @type {ScreenResizeHandler} */
function ChatRoomMapViewResize() {
	if (ElementWrap("chat-room-map-view-panel-editor")) ElementPositionFixed("chat-room-map-view-panel-editor", 0, 0, 300, 800);
	if (ElementWrap("chat-room-map-view-panel")) ElementPositionFixed("chat-room-map-view-panel", 0, 0, 1000, 1000);
	if (ChatRoomMapViewColorPicker) ColorPickerResize(false);
}

/**
 * Opens the color picker over the chat log, or closes it if it's open. The chat input is disabled while it's open,
 * and closing it drops the teleport pad color preview.
 * @param {ColorPickerInitOptions} [options] - The color picker options, used when opening it
 * @returns {void}
 */
function ChatRoomMapViewColorPickerToggle(options) {
	const chatInput = /** @type {null | HTMLTextAreaElement} */(ElementWrap("InputChat"));
	if (!ChatRoomMapViewColorPicker) {
		CommonPromiseCatch(
			ColorPickerInit({
				...options,
				shape: ChatRoomDivRect,
				onExit: (state, save, root) => {
					ChatRoomMapViewColorPickerToggle();
					options?.onExit?.(state, save, root);
				},
			}).then(root => {
				root.classList.add("chat-room-map-view-color-picker");
				ElementSetDataAttribute(root, "ColorTheme", Player.ChatSettings.ColorTheme);
			})
		);
		chatInput?.blur();
	} else {
		ColorPickerHide();
		ChatRoomMapViewTeleportPadPreview = null;
		const root = ElementWrap(ColorPicker.ids.root);
		root?.classList.remove("chat-room-map-view-color-picker");
		root?.removeAttribute("data-colortheme");
	}
	ChatRoomMapViewColorPicker = !ChatRoomMapViewColorPicker;
	if (chatInput) chatInput.disabled = ChatRoomMapViewColorPicker;
}

/**
 * Deactivates the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDeactivate() {
	ChatRoomMapViewDestroyElements();
}

function ChatRoomMapViewDestroyElements() {
	document.removeEventListener("blur", ChatRoomMapViewBlur);
	if (ChatRoomMapViewColorPicker) ChatRoomMapViewColorPickerToggle();
	if (ElementWrap("chat-room-map-view-panel")) {
		ElementRemove("chat-room-map-view-panel");
	}
}

/**
 * Indicates if the chat room map view is active or not
 * @returns {boolean} - TRUE if the chat room character view is active, false if not
 */
function ChatRoomMapViewIsActive() {
	return ChatRoomIsViewActive(ChatRoomMapViewName);
}

/** @type {ScreenRunHandler} */
function ChatRoomMapViewRun(time) {

	// Syncs the room map data with the server if needed
	ChatRoomMapViewMovementProcess();
	ChatRoomMapViewLeash();
	ChatRoomMapViewUpdateRoomSync();
	ChatRoomMapViewUpdatePlayerSync();
	ChatRoomMapViewUpdateLastMapDataSync();
	if (ChatRoomMapViewKeysPressed.North) {
		ChatRoomMapViewMove("North");
	} else if (ChatRoomMapViewKeysPressed.South) {
		ChatRoomMapViewMove("South");
	} else if (ChatRoomMapViewKeysPressed.West) {
		ChatRoomMapViewMove("West");
	} else if (ChatRoomMapViewKeysPressed.East) {
		ChatRoomMapViewMove("East");
	}
}

/**
 * Returns TRUE if the player can leave from the map
 * @returns {boolean} - True if the player can leave
 */
function ChatRoomMapViewCanLeave() {

	// Out of map mode and if player hasn't checked the immersion option, we allow leaving
	if ((ChatRoomData == null) || (ChatRoomData?.MapData?.Type === "Never") || !ChatRoomMapViewIsActive()) return true;
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return true;
	if ((Player.ImmersionSettings == null) || !Player.ImmersionSettings.ChatRoomMapLeaveOnExit) return true;

	// Scan 2 tiles grid around the player, if there's an exit flag in it, we allow leaving
	for (let X = Player.MapData.Pos.X - 2; X <= Player.MapData.Pos.X + 2; X++)
		for (let Y = Player.MapData.Pos.Y - 2; Y <= Player.MapData.Pos.Y + 2; Y++) {
			let Obj = MapManager.Map.getObject(X, Y);
			if ((Obj != null) && Obj.Exit) return true;
		}

	// If there's no exit at all, we always allow leaving
	let ExitCount = 0;
	// XXX: should move to MapManager because oof
	for (let Obj of AssetsMapDataObjects)
		if ((Obj.Exit === true) && ((ChatRoomData?.MapData?.Objects?.indexOf(String.fromCharCode(Obj.ID)) ?? -1) >= 0))
			ExitCount++;
	if (ExitCount == 0) return true;

	// If nothing allows leaving
	return false;

}

/**
 * Take a screenshot of the current section of the map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewScreenshot() {
	ChatRoomPhoto(0, 0, 1000, 1000, ChatRoomCharacter);
}

/**
 * Returns TRUE if the player can enter in whisper mode on the current view with the currently focused character
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE is whipser can be started
 */
function ChatRoomMapViewCanStartWhisper(C) {
	return ChatRoomMapViewCharacterOnWhisperRange(C);
}

/**
 * Handles the reception of the room properties from the server.
 * @returns {void} - Nothing.
 */
function ChatRoomMapViewRoomUpdated() {
	// If the chat room map is visible, we need to update the perception map
	ChatRoomMapViewReloadEditorPanel(false, ChatRoomMapViewLastSearch);
	MapManager.OnMapDataUpdated();
}

/**
 * Gets a index number for the tile and obejct lists and returns the corrosponting coordinates in X and Y
 * @param {number} index - Index number for the tile and object lists
 * @returns {ChatRoomMapPos} - Object containing the resulting x and y coordinates.
 * @deprecated moved to {@link MapIndexToCoordinates}
 */
function ChatRoomMapViewIndexToCoordinates(index) {
	return MapIndexToCoordinates(index);
}

/**
 * Gets coordinates in X and Y and returns the corrosponding index number for the tile and object list
 * @param {number} x - X-coordinate to be translated
 * @param {number} y - Y-coordinate to be translated
 * @returns {number} - Index number for the tile and object lists
 * @deprecated moved to {@link MapCoordinatesToIndex}
 */
function ChatRoomMapViewCoordinatesToIndex(x, y) {
	return MapCoordinatesToIndex(x, y);
}

/**
 * Calculates the visibility mask and audibility mask for the map
 * @deprecated Use {@link MapManager.Map.updatePlayerPerception()}
 * @returns {void} - Nothing
 */
function ChatRoomMapViewCalculatePerceptionMasks() {
	MapManager.Map.updatePlayerPerception();
}

/**
 * Returns the sight range for the current player, based on the blindness level
 * @returns {number} - The number of visible tiles
 */
function ChatRoomMapViewGetSightRange() {
	if (ChatRoomMapViewHasSuperPowers()) return ChatRoomMapViewPerceptionRangeMax;
	return Math.max(ChatRoomMapViewPerceptionRangeMax - Player.GetBlindLevel() * 2, 1);
}

/**
 * Returns the hearing range for the current player, based on the deafness level
 * @returns {number} - The number of tiles
 */
function ChatRoomMapViewGetHearingRange() {
	return Math.max(ChatRoomMapViewPerceptionRangeMax - Player.GetDeafLevel(), 0);
}

/**
 * Returns TRUE if the player can see a character at her sight range
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if visible
 */
function ChatRoomMapViewCharacterIsVisible(C) {
	if (!C?.MapData) return false;
	if (!Player?.MapData?.Pos) return false;
	return MapManager.Map.isTileVisible(C.MapData.Pos.X, C.MapData.Pos.Y);
}

/**
 * Returns TRUE if the player can see hear a character at her hearing range
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if hearable
 */
function ChatRoomMapViewCharacterIsHearable(C) {
	if (!C?.MapData) return false;
	if (!Player?.MapData?.Pos) return false;
	return MapManager.Map.isTileHearable(C.MapData.Pos.X, C.MapData.Pos.Y);
}

/**
 * Returns TRUE if the player is on whisper range to another character (1 tile)
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if on whisper range
 */
function ChatRoomMapViewCharacterOnWhisperRange(C) {
	if ((C == null) || (C.MapData == null) || (C.MapData.Pos == null) || (C.MapData.Pos.X == null) || (C.MapData.Pos.Y == null)) return false;
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return false;
	let Distance = Math.max(Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X), Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y));
	return (Distance <= ChatRoomMapViewWhisperRange);
}

/**
 * Returns TRUE if the player is within interaction range of another character
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if on interaction range
 */
function ChatRoomMapViewCharacterOnInteractionRange(C) {
	if ((C == null) || (C.MapData == null) || (C.MapData.Pos == null) || (C.MapData.Pos.X == null) || (C.MapData.Pos.Y == null)) return false;
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return false;
	let Distance = Math.max(Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X), Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y));
	return (Distance <= ChatRoomMapViewInteractionRange);
}

/**
 * Sets the correct wall tile based on it's surrounding (North-West, North-Center, etc.)
 * @param {boolean} CW - If Center West is a wall
 * @param {boolean} CE - If Center East is a wall
 * @param {boolean} SW - If South West is a wall
 * @param {boolean} SC - If South Center is a wall
 * @param {boolean} SE - If South East is a wall
 * @returns {number} - a number linked on the image to use
 */
function ChatRoomMapViewFindWallEffectTile(CW, CE, SW, SC, SE) {

	if (CW && CE && SW && SC && SE) return 0;
	if (!CW && !CE && !SC) return 1;
	if (!CW && CE && !SC) return 2;
	if (CW && !CE && !SC) return 3;
	if (CW && CE && !SC) return 4;

	if (!CW && !CE && SW && SC && SE) return 5;
	if (!CW && !CE && SW && SC && !SE) return 6;
	if (!CW && !CE && !SW && SC && SE) return 7;

	if (CW && CE && !SW && SC && !SE) return 8;
	if (!CW && CE && !SW && SC && !SE) return 9;
	if (CW && !CE && !SW && SC && !SE) return 10;

	if (!CW && !CE && !SE && SC && !SW) return 11;
	if (CW && !CE && !SE && SC && !SW) return 12;
	if (!CW && CE && !SE && SC && !SW) return 13;

	if (!CW && CE && SE && SC && SW) return 14;
	if (CW && !CE && SE && SC && SW) return 15;

	if (CW && !CE && SW && SC) return 16;
	if (!CW && CE && SC && SE) return 17;

	if (CW && CE && SW && SC && !SE) return 18;
	if (CW && CE && !SW && SC && SE) return 19;

	if (!CW && CE && SW && SC && !SE) return 20;
	if (CW && !CE && !SW && SC && SE) return 21;

	return -1;

}

/**
 * Returns TRUE if the X and Y coordinates is a wall tile, if out of bound we also return TRUE
 * @param {number} x - The X position on the map
 * @param {number} y - The Y position on the map
 * @returns {boolean} - TRUE if it's a wall
 */
function ChatRoomMapViewIsWall(x, y) {
	if ((x < 0) || (y < 0) || (x >= ChatRoomMapViewWidth) || (y >= ChatRoomMapViewHeight)) return true;
	return MapManager.Map.getTile(x,y)?.Type === "Wall";
}

/**
 * Checks for connectivity in 4 directions based on a provided validation function
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @param {function(number, number): boolean} Condition - Function that returns true if the position is connected
 * @returns {{ North: boolean, South: boolean, East: boolean, West: boolean }} - The connectivity status
 */
function ChatRoomMapViewGetConnectivityDirections(X, Y, Condition) {
	return {
		North: Condition(X, Y - 1),
		South: Condition(X, Y + 1),
		East: Condition(X + 1, Y),
		West: Condition(X - 1, Y)
	};
}

/**
 * Returns the object located at a X and Y position on the map, or NULL if nothing
 * @param {number} x - The X position on the map
 * @param {number} y - The Y position on the map
 * @returns {ChatRoomMapTile | null} - The object at the position
 * @deprecated since August 2026, use {@link MapManager.Map.getTile}
 */
function ChatRoomMapViewGetTileAtPos(x, y) {
	return MapManager.Map.getTile(x, y);
}

/**
 * Returns the object located at a X and Y position on the map, or NULL if nothing
 * @param {number} x - The X position on the map
 * @param {number} y - The Y position on the map
 * @returns {ChatRoomMapObject | null} - The object at the position
 * @deprecated since August 2026, use {@link MapManager.Map.getObject}
 */
function ChatRoomMapViewGetObjectAtPos(x, y) {
	return MapManager.Map.getObject(x, y);
}

/**
 * True when the player cannot stand on this object right now.
 * @param {ChatRoomMapObject} object
 * @returns {boolean}
 */
function ChatRoomMapViewObjectBlocksStanding(object) {
	return !!object.CanEnter && object.CanEnter("") === false;
}

/**
 * Draws a red X over a cell the player cannot stand on.
 * @param {Rect} rect
 * @returns {void}
 */
function ChatRoomMapViewDrawObstacleMark(rect) {
	const insetX = rect.w * 0.18;
	const insetY = rect.h * 0.18;
	const x0 = rect.x + insetX;
	const y0 = rect.y + insetY;
	const x1 = rect.x + rect.w - insetX;
	const y1 = rect.y + rect.h - insetY;
	MainCanvas.save();
	MainCanvas.beginPath();
	MainCanvas.lineWidth = Math.max(2, Math.min(rect.w, rect.h) * 0.08);
	MainCanvas.lineCap = "round";
	MainCanvas.strokeStyle = "#e02020";
	MainCanvas.moveTo(x0, y0);
	MainCanvas.lineTo(x1, y1);
	MainCanvas.moveTo(x1, y0);
	MainCanvas.lineTo(x0, y1);
	MainCanvas.stroke();
	MainCanvas.restore();
}

/**
 * Returns TRUE if a given position cannot be entered
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if the position is blocked
 */
function ChatRoomMapViewPositionIsBlocked(X, Y) {
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return true;
	if (!Player.MapData) return true;
	/** @type {ChatRoomMapDirectionWithEmptySpace} */
	let dir = "";
	if (Player.MapData.Pos.X < X) dir = "East";
	else if (Player.MapData.Pos.X > X) dir = "West";
	else if (Player.MapData.Pos.Y < Y) dir = "South";
	else if (Player.MapData.Pos.Y > Y) dir = "North";
	// We do objects first, and always respect their `CanEnter` return;
	// this is so that an open door on a wall can let you pass
	const O = MapManager.Map.getObject(X, Y);
	if (O && O.CanEnter) {
		return !O.CanEnter(dir);
	}
	const T = MapManager.Map.getTile(X, Y);
	if (T && T.CanEnter) {
		return !T.CanEnter(dir);
	}
	return false;
}

/**
 * Returns TRUE if the fog of war feature is currently activated on the map
 * @returns {boolean} - TRUE if fog of war is active
 */
function ChatRoomMapFogIsActive() {
	return MapManager.Map.hasFogEnabled;
}

/**
 * Returns TRUE if a tile is fully hidden from hide
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if the tile is hidden
 */
function ChatRoomMapViewTileIsHidden(X, Y) {
	return !MapManager.Map.isTileVisible(X, Y) && (ChatRoomMapViewTileFog?.[X + Y * ChatRoomMapViewWidth] == 0);
}

/**
 * Apply a wall "3D" effect on the curent map
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @param {number} ScreenX - The X position on the screen
 * @param {number} ScreenY - The Y position on the screen
 * @param {number} TileWidth - The visible width of a tile
 * @param {number} TileHeight - The visible height of a tile
 * @returns {void} - Nothing
 */
function ChatRoomMapViewWallEffect(X, Y, ScreenX, ScreenY, TileWidth, TileHeight) {

	// Find all other walls around the current tile
	let CW = ChatRoomMapViewIsWall(X - 1, Y) || ChatRoomMapViewTileIsHidden(X - 1, Y);
	let CE = ChatRoomMapViewIsWall(X + 1, Y) || ChatRoomMapViewTileIsHidden(X + 1, Y);
	let SW = ChatRoomMapViewIsWall(X - 1, Y + 1) || ChatRoomMapViewTileIsHidden(X - 1, Y + 1);
	let SC = ChatRoomMapViewIsWall(X, Y + 1) || ChatRoomMapViewTileIsHidden(X, Y + 1);
	let SE = ChatRoomMapViewIsWall(X + 1, Y + 1) || ChatRoomMapViewTileIsHidden(X + 1, Y + 1);

	// Finds the proper effect and draws it
	let Effect = ChatRoomMapViewFindWallEffectTile(CW, CE, SW, SC, SE);
	DrawImageResize(MapGetAssetUrl("Tile", "WallEffect", `${Effect}`), Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));

}

/**
 * Apply a wall "3D" effect on the curent map
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {number} - The effect number
 */
function ChatRoomMapViewFloorWallEffect(X, Y) {

	// No effect on the very last row
	if (Y >= ChatRoomMapViewHeight - 1) return -1;

	// Find the soutern wall positions
	let SW = ChatRoomMapViewIsWall(X - 1, Y + 1);
	let SC = ChatRoomMapViewIsWall(X, Y + 1);
	let SE = ChatRoomMapViewIsWall(X + 1, Y + 1);

	// If here is halfWall
	if (MapManager.Map.getTile(X,Y)?.Style == "HalfWall"){

		//Finds the proper effect and returns it
		if (!SW && SC && !SE) return 11;
		if (!SW && SC && SE) return 12;
		if (SW && SC && !SE) return 13;
		if (SW && SC && SE) return 0;
	}

	// Find the "3D" wall effect and returns it
	if (!SW && SC && !SE) return 50;
	if (!SW && SC && SE) return 51;
	if (SW && SC && !SE) return 52;
	if (SW && SC && SE) return 53;
	return -1;

}

/**
 * Manages collisions, moves the player if she's on a tile that cannot be entered
 * @returns {void} - Nothing
 */
function ChatRoomMapViewCollision() {

	// Exits right away if no player data or the tile is valid to stand there
	if ((Player.MapData == null) || ((Player.MapData.Pos.X == null)) || ((Player.MapData.Pos.Y == null))) return;
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y) > 0) return;

	// Since there's a collision, we try to find good spots to move the player
	let Tiles = [];
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 1, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X - 1, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 1, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X + 1, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y - 1) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y - 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y + 1) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y + 1 });

	// If we found a tile next to the player
	if (Tiles.length > 0) {
		let Tile = CommonGetRandomItemFromList(Tiles);
		Player.MapData.Pos.X = Tile.X;
		Player.MapData.Pos.Y = Tile.Y;
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);
		return;
	}

	// Tries the current tile corners next
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 1, Player.MapData.Pos.Y - 1) > 0) Tiles.push({ X: Player.MapData.Pos.X - 1, Y: Player.MapData.Pos.Y - 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 1, Player.MapData.Pos.Y - 1) > 0) Tiles.push({ X: Player.MapData.Pos.X + 1, Y: Player.MapData.Pos.Y - 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 1, Player.MapData.Pos.Y + 1) > 0) Tiles.push({ X: Player.MapData.Pos.X - 1, Y: Player.MapData.Pos.Y + 1 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 1, Player.MapData.Pos.Y + 1) > 0) Tiles.push({ X: Player.MapData.Pos.X + 1, Y: Player.MapData.Pos.Y + 1 });

	// If we found a tile in the corner of the player
	if (Tiles.length > 0) {
		let Tile = CommonGetRandomItemFromList(Tiles);
		Player.MapData.Pos.X = Tile.X;
		Player.MapData.Pos.Y = Tile.Y;
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);
		return;
	}

	// Tries 2 tiles away next
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X - 2, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X - 2, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X + 2, Player.MapData.Pos.Y) > 0) Tiles.push({ X: Player.MapData.Pos.X + 2, Y: Player.MapData.Pos.Y });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y - 2) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y - 2 });
	if (ChatRoomMapViewCanEnterTile(Player.MapData.Pos.X, Player.MapData.Pos.Y + 2) > 0) Tiles.push({ X: Player.MapData.Pos.X, Y: Player.MapData.Pos.Y + 2 });

	// If we found a tile next to the player
	if (Tiles.length > 0) {
		let Tile = CommonGetRandomItemFromList(Tiles);
		Player.MapData.Pos.X = Tile.X;
		Player.MapData.Pos.Y = Tile.Y;
		// Update the change instantly so other players don't see this player in a wall
		ChatRoomMapViewUpdatePlayerFlag(-ChatRoomMapViewUpdatePlayerTime);
		return;
	}

}

/**
 * Find the first {@link ChatRoomCharacter} members at the specified X & Y position
 * @param {number} X - The X position on the screen
 * @param {number} Y - The Y position on the screen
 * @returns {null | OnlineCharacter} A character at the specified X & Y position or, if none can be found, `null`
 */
function ChatRoomMapViewGetCharacterAtPos(X, Y) {
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return null;
	return ChatRoomMapViewCharacterMap.get(X + Y * ChatRoomMapViewWidth)?.[0] ?? null;
}

/**
 * Returns a object that contains the entry flag's position with x and y parameters or null if no entry flag is set
 * @returns {ChatRoomMapPos|null}
 */
function ChatRoomMapViewGetEntryFlagPosition() {
	if (!ChatRoomData?.MapData?.Objects) return null;

	const index = ChatRoomData?.MapData?.Objects.indexOf(String.fromCharCode(ChatRoomMapViewObjectEntryID));
	if (index < 0) return null;

	return MapIndexToCoordinates(index);
}

/**
 * Draw the map grid and character on screen
 * @param {number} Left - The X position on the screen
 * @param {number} Top - The Y position on the screen
 * @param {number} Width - The width size of the drawn map
 * @param {number} Height - The height size of the drawn map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDrawGrid(Left, Top, Width, Height) {

	ChatRoomMapViewCharacterMap.clear();
	for(let C of ChatRoomCharacter) {
		if (!C.MapData?.Pos) continue;
		const index = C.MapData.Pos.X + C.MapData.Pos.Y * ChatRoomMapViewWidth;
		const stack = ChatRoomMapViewCharacterMap.get(index);
		if (!stack) {
			ChatRoomMapViewCharacterMap.set(index, [C]);
		} else if (C.IsPlayer()) {
			stack.unshift(C);
		} else {
			stack.push(C);
		}
	}
	/** @type {{ stack: OnlineCharacter[], x: number, y: number, charX: number, charY: number }[]} */
	const sharedTiles = [];
	// While a teleport pad's menu is open, the pad and where it sends to are outlined
	const padMenuIndex = ChatRoomMapViewTeleportPadIndex != null && !ChatRoomMapViewDialogMenu?.hidden ? ChatRoomMapViewTeleportPadIndex : null;
	const padDestination = padMenuIndex != null ? MapManager.Map.getTeleporterDestination(padMenuIndex) : null;

	// Manages collisions, moves the player if she's on a tile that cannot be entered
	ChatRoomMapViewCollision();

	// Defines the width and height of the visible tile
	let TileWidth = Width / ((ChatRoomMapViewPerceptionRange * 2) + 1);
	let TileHeight = Height / ((ChatRoomMapViewPerceptionRange * 2) + 1);
	let EditWidth = (ChatRoomMapViewEditRange - 1) * TileWidth;
	let EditHeight = (ChatRoomMapViewEditRange - 1) * TileHeight;
	const activeTool = ChatRoomMapViewGetActiveTool();
	const MaxVisibleRange = ChatRoomMapViewGetSightRange();
	let CharacterUnderCursor = null;
	let FogActive = ChatRoomMapFogIsActive();

	// Clears the tile and character selection
	ChatRoomMapViewFocusedCharacter = null;

	// Prepares the fog if needed
	if (!ChatRoomMapViewTileFog || ChatRoomMapViewTileFog.length != ChatRoomMapViewWidth * ChatRoomMapViewHeight) {
		ChatRoomMapViewTileFog = new Uint16Array(ChatRoomMapViewWidth * ChatRoomMapViewHeight);
	}
	if (!ChatRoomMapViewObjectFog || ChatRoomMapViewObjectFog.length != ChatRoomMapViewWidth * ChatRoomMapViewHeight) {
		ChatRoomMapViewObjectFog = new Uint16Array(ChatRoomMapViewWidth * ChatRoomMapViewHeight);
	}

	const { X: PlayerX = 0, Y: PlayerY = 0 } = Player.MapData?.Pos ?? {};

	// For each tiles in the grid
	for (let Pos = 0; Pos < ChatRoomMapViewWidth * ChatRoomMapViewHeight; Pos++) {

		// Find the X & Y position of the grid
		const { X, Y } = MapIndexToCoordinates(Pos);

		// Only process if the X & Y are within the visible sight range
		let MaxRange = Math.max(Math.abs(X - PlayerX), Math.abs(Y - PlayerY));
		if (MaxRange > MaxVisibleRange) continue;

		// Defines the screen X and Y positions
		let ScreenX = (X - PlayerX) * TileWidth + ChatRoomMapViewPerceptionRange * TileWidth;
		let ScreenY = (Y - PlayerY) * TileHeight + ChatRoomMapViewPerceptionRange * TileWidth;

		// If this tile's coordinates are out of the view range, we don't have to bother with it
		if ((ScreenX < 0) || (ScreenX >= Width) || (ScreenY < 0) || (ScreenY >= Height)) continue;

		// Drawing variables
		const TileCanvasX = Left + ScreenX;
		const TileCanvasY = Top + ScreenY;
		let FloorWallEffect = -1;
		let TileID = MapManager.Map.getTileId(Pos) ?? -1; //ChatRoomData?.MapData?.Tiles?.charCodeAt(Pos) ?? -1;
		let TileData = null;
		let TileImage = null;
		/** @type {ChatRoomMapObject | null} */
		let ObjectData = null;
		let ObjectImage = null;

		// Out of sight, we draw the fog
		let Fog = false;
		if (FogActive && !MapManager.Map.isTileVisible(Pos)) {
			if (ChatRoomMapViewTileFog[Pos] == 0) {
				DrawImageResize(MapGetAssetUrl("Tile", "Fog", "Full"), Math.floor(TileCanvasX), Math.floor(TileCanvasY), Math.ceil(TileWidth), Math.ceil(TileHeight));
				continue;
			}
			TileID = ChatRoomMapViewTileFog[Pos];
			Fog = true;
		}

		// Finds the tile to draw and keeps it
		TileData = MapDataTiles.get(TileID);

		// Draw the tile on the grid
		if (TileData) {
			const url = MapGetDoodadAssetUrl(TileData);
			TileImage = url ? DrawGetImage(url) : undefined;
			if (TileImage) {
				const { Width: WidthScale = 1, Height: HeightScale = 1, Rotation, Left: TileLeft = 0, Top: TileTop = 0 } = TileData;
				const width = Math.ceil(TileWidth * WidthScale);
				const height = Math.ceil(TileHeight * HeightScale);
				const x = Math.floor(TileCanvasX) + TileWidth * TileLeft;
				const y = Math.floor(TileCanvasY) + TileHeight * TileTop;
				DrawImageResize(TileImage, x, y, width, height, {Rotation});
			}

			if (TileData.Type == "Wall") ChatRoomMapViewWallEffect(X, Y, Left + ScreenX, Top + ScreenY, Math.ceil(TileWidth), Math.ceil(TileHeight));
			else FloorWallEffect = ChatRoomMapViewFloorWallEffect(X, Y);
		}

		// Finds the object and updates the fog data
		let ObjectID = Fog ? ChatRoomMapViewObjectFog[Pos] : MapManager.Map.getObjectId(Pos) ?? -1;
		ChatRoomMapViewTileFog[Pos] = TileID;
		ChatRoomMapViewObjectFog[Pos] = ObjectID;

		// Draw the non blank object next
		if (ObjectID > ChatRoomMapViewObjectStartID) {
			const Obj = MapDataObjects.get(ObjectID);
			// No object to draw here
			if (!Obj) continue;

			let Char = ChatRoomMapViewGetCharacterAtPos(X, Y);
			let shouldRender = true;
			if (Obj.Type == "WallDecoration") shouldRender = !ChatRoomMapViewTileIsHidden(X, Y + 1);
			else if (Obj.Type === "EmptySpace") shouldRender = false;
			else if (Obj.IsVisible && !ChatRoomMapViewHasSuperPowers() && !Obj.IsVisible()) shouldRender = false;
			else if (Char && Obj?.AssetGroup && Obj?.AssetName && InventoryIsWorn(Char, Obj.AssetGroup, Obj.AssetName)) shouldRender = false;

			if (shouldRender) {
				let ImageName = Obj.BuildImageName?.(X, Y) ?? Obj.Style;
				if (Char && Obj.OccupiedStyle) ImageName = Obj.OccupiedStyle;
				ObjectData = Obj;
				ObjectImage = MapGetAssetUrl("Object", Obj.Type, ImageName);
				const color = Obj.BuildImageColor?.(X, Y);
				const opacity = color?.length === 9 ? parseInt(color.slice(7), 16) / 255 : 1;
				// While building, admins get a faint circle around objects colored nearly invisible so they can find them
				const building = ["Tile", "Object", "Effect"].includes(ChatRoomMapViewEditMode)
					|| (ChatRoomMapViewTeleportPadIndex === X + Y * ChatRoomMapViewWidth && !ChatRoomMapViewDialogMenu?.hidden);
				const nearlyInvisible = opacity < 0.3 && building && ChatRoomPlayerIsAdmin();

				DrawImageResize(color ? ChatRoomMapViewGetColoredImage(ObjectImage, CommonColorTrimAlpha(color)) : ObjectImage,
					Math.floor(Left + ScreenX + ((Obj.Left == null) ? 0 : TileWidth * Obj.Left)),
					Math.floor(Top + ScreenY + ((Obj.Top == null) ? 0 : TileHeight * Obj.Top)),
					Math.ceil(TileWidth * ((Obj.Width == null) ? 1 : Obj.Width)),
					Math.ceil(TileHeight * ((Obj.Height == null) ? 1 : Obj.Height)),
					{ Rotation: Obj.Rotation, Alpha: opacity }
				);
				if (nearlyInvisible) DrawCircle(Left + ScreenX + TileWidth / 2, Top + ScreenY + TileHeight / 2, TileWidth * 0.47, 1.5, "#FFFFFF80");
			}
			// While placing empty space, show what currently blocks standing, including an impassable cell with no sprite
			if (!Fog && ChatRoomMapViewEditMode === "Object" && ChatRoomMapViewEditSubMode === "EmptySpace" && ChatRoomMapViewObjectBlocksStanding(Obj)) {
				ChatRoomMapViewDrawObstacleMark({ x: Left + ScreenX, y: Top + ScreenY, w: TileWidth, h: TileHeight });
			}
		}

		const leftMousePos = Left + ScreenX - EditWidth;
		const topMousePos = Top + ScreenY - EditHeight;
		const mouseInTile = MouseIn(leftMousePos, topMousePos, EditWidth + TileWidth, EditHeight + TileHeight);
		const mouseOverButtons = ChatRoomPlayerIsAdmin() && MouseIn(790, 860, 60, 60)
			|| MouseIn(860, 860, 60, 60)
			|| MouseIn(790, 930, 60, 60)
			|| MouseIn(860, 930, 60, 60)
			|| MouseIn(930, 930, 60, 60);

		// Keeps the tile as selected if the mouse is within selection
		const DrawSelectionRect = (activeTool != null && activeTool.canPaint() && mouseInTile && !mouseOverButtons);

		// For each characters in the chat room (don't draw when there's fog)
		if (!Fog) {
			let C = ChatRoomMapViewGetCharacterAtPos(X, Y);
			if (C) {

				// Draws the character on the grid
				DrawCharacter(C, Left + ScreenX + (TileWidth * 0.05), Top + ScreenY - (TileHeight * 0.85), TileHeight * 1.8 / 1000);
				const stack = ChatRoomMapViewCharacterMap.get(X + Y * ChatRoomMapViewWidth);
				if (stack && stack.length > 1) {
					sharedTiles.push({
						stack,
						x: Left + ScreenX + TileWidth / 2,
						y: Top + ScreenY - TileHeight * 0.85,
						charX: Left + ScreenX + TileWidth * 0.05,
						charY: Top + ScreenY - TileHeight * 0.85,
					});
				}
				DrawStatus(C, Left + ScreenX + (TileWidth * 0.05), Top + ScreenY - (TileHeight * 0.85), TileHeight * 1.8 / 1000);

				// Keeps the character under the cursor
				if ((MouseX >= Left + ScreenX + (TileWidth * 0.05)) && (MouseX <= Left + ScreenX + (TileWidth * 0.95)) && (MouseY >= Top + ScreenY - (TileHeight * 0.85)) && (MouseY <= Top + ScreenY + (TileHeight * 0.95))) {
					ChatRoomMapViewFocusedCharacter = C;
					ChatRoomMapViewFocusedCharacterX = Left + ScreenX + (TileWidth * 0.05);
					ChatRoomMapViewFocusedCharacterY = Top + ScreenY - (TileHeight * 0.85);
					CharacterUnderCursor = { Character: C, StatusBaseX: TileCanvasX + (TileWidth / 2), StatusBaseY: TileCanvasY + TileHeight - 20 };
				}

				// Draw the water effect if character stands in water
				if (TileImage != null && TileData != null && TileData.Type == "Water") {
					const Transparency = (TileData.Transparency) ? TileData.Transparency : 0.0;
					const TransparencyCutoutHeight = (TileData.TransparencyCutoutHeight) ? TileData.TransparencyCutoutHeight : 1.0;
					DrawImageEx(TileImage, MainCanvas, TileCanvasX, TileCanvasY, {Width: TileWidth, Height: TileHeight, Alpha: Transparency, AlphaMasks: [[TileCanvasX, TileCanvasY, TileImage.width, TileImage.height * TransparencyCutoutHeight]]});
				}

				// Draw the transparency effect for objects
				if (TileImage && (ObjectImage != null) && (ObjectData != null) && (ObjectData.Transparency != null) && (ObjectData.TransparencyCutoutHeight != null)) {
					let ImgX = Math.floor(Left + ScreenX + ((ObjectData.Left == null) ? 0 : TileWidth * ObjectData.Left));
					let ImgY = Math.floor(Top + ScreenY + ((ObjectData.Top == null) ? 0 : TileHeight * ObjectData.Top));
					let W = Math.ceil(TileWidth * ((ObjectData.Width == null) ? 1 : ObjectData.Width));
					let H = Math.ceil(TileHeight * ((ObjectData.Height == null) ? 1 : ObjectData.Height));
					let WA = Math.ceil(TileImage.width * 2 * ((ObjectData.Width == null) ? 1 : ObjectData.Width));
					let HA = Math.ceil(TileImage.height * ObjectData.TransparencyCutoutHeight * ((ObjectData.Height == null) ? 1 : ObjectData.Height));
					DrawImageEx(ObjectImage, MainCanvas, ImgX, ImgY, {Width: W, Height: H, Alpha: ObjectData.Transparency, AlphaMasks: [[ImgX, ImgY, WA, HA]]});
				}

			}
		}

		// Draw the floor wall effect and rectancle if needed at the end
		if (FloorWallEffect != -1) DrawImageResize(MapGetAssetUrl("Tile", "WallEffect", `${FloorWallEffect}`), Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));
		if (DrawSelectionRect && activeTool) DrawEmptyRect(Left + ScreenX, Top + ScreenY, TileWidth, TileHeight, activeTool.selectionColor, 3);
		if (padMenuIndex === X + Y * ChatRoomMapViewWidth) DrawEmptyRect(Left + ScreenX, Top + ScreenY, TileWidth, TileHeight, "white", 2);
		if (padDestination?.X === X && padDestination?.Y === Y) DrawEmptyRect(Left + ScreenX, Top + ScreenY, TileWidth, TileHeight, "cyan", 5);
		if (ChatRoomMapViewTeleportPadPicking && MouseIn(Left + ScreenX, Top + ScreenY, TileWidth, TileHeight)) DrawRect(Left + ScreenX, Top + ScreenY, TileWidth, TileHeight, "#00FFFF60");

	}

	for (let X = 0; X < ChatRoomMapViewWidth; X++) {
		for (let Y = 0; Y < ChatRoomMapViewHeight; Y++) {
			const tileEffects = MapManager.Map.getEffects(X, Y);
			let MaxRange = Math.max(
				Math.abs(X - PlayerX),
				Math.abs(Y - PlayerY),
			);
			if (MaxRange > MaxVisibleRange) continue;

			// Calculate Screen Positions
			let currentX =
				Left +
				(X - PlayerX) * TileWidth +
				ChatRoomMapViewPerceptionRange * TileWidth;
			let currentY =
				Top +
				(Y - PlayerY) * TileHeight +
				ChatRoomMapViewPerceptionRange * TileWidth;

			// Bounds Check
			if (
				currentX < 0 ||
				currentX >= Width ||
				currentY < 0 ||
				currentY >= Height
			)
				continue;

			// Pixel Snapping (Prevents gaps and borders)
			const nextX =
				Left +
				(X + 1 - PlayerX) * TileWidth +
				ChatRoomMapViewPerceptionRange * TileWidth;
			const nextY =
				Top +
				(Y + 1 - PlayerY) * TileHeight +
				ChatRoomMapViewPerceptionRange * TileWidth;

			const drawX = Math.floor(currentX);
			const drawY = Math.floor(currentY);
			const drawW = Math.floor(nextX) - drawX;
			const drawH = Math.floor(nextY) - drawY;
			/**
			 * @type {[number, number, number, number]}
			 */
			const drawRect = [drawX, drawY, drawW, drawH];

			// Currently we only have simple effects, so we can
			// draw all the effects as simple rects. In the future, we must
			// implement a special rendering function which would check the effect's Type
			// and draw it appropriately.
			for (const effect of tileEffects) {
				DrawRect(...drawRect, RgbaArrayToHTMLColor(effect.Color));
			}
		}
	}

	// For each tiles in the grid, we draw the fog
	if (FogActive && !ChatRoomMapViewHasSuperPowers())
		for (let Pos = 0; Pos < ChatRoomMapViewWidth * ChatRoomMapViewHeight; Pos++) {

			// Find the X & Y position of the grid
			const { X, Y }= MapIndexToCoordinates(Pos);


			// Only process if the X & Y are within the visible sight range
			let MaxRange = Math.max(Math.abs(X - PlayerX), Math.abs(Y - PlayerY));
			if (MaxRange > MaxVisibleRange) continue;

			// Defines the screen X and Y positions
			let ScreenX = (X - PlayerX) * TileWidth + ChatRoomMapViewPerceptionRange * TileWidth;
			let ScreenY = (Y - PlayerY) * TileHeight + ChatRoomMapViewPerceptionRange * TileWidth;

			// If this tile's coordinates are out of the view range, we don't have to bother with it
			if ((ScreenX < 0) || (ScreenX >= Width) || (ScreenY < 0) || (ScreenY >= Height)) continue;

			// Out of sight and with known data, we draw the half fog effect
			if (!MapManager.Map.isTileVisible(Pos))
				if (ChatRoomMapViewTileFog[Pos] > 0)
					DrawImageResize(MapGetAssetUrl("Tile", "Fog", "Half"), Math.floor(ScreenX), Math.floor(ScreenY), Math.ceil(TileWidth), Math.ceil(TileHeight));
		}

	// Name tags to pick each character sharing a tile, hidden while editing since clicks place doodads then
	ChatRoomMapViewNameTags = [];
	MainCanvas.font = CommonGetFont(24);
	if (!activeTool || !activeTool.canPaint()) {
		/** @type {{ C: OnlineCharacter, name: string, rect: RectTuple, charX: number, charY: number }[]} */
		const placed = [];
		/** @type {(rect: RectTuple) => boolean} */
		const overlaps = (rect) => placed.some(tag => RectOverlapsWithRect(rect, tag.rect));
		const tagHeight = 36;
		for (const shared of sharedTiles.sort((a, b) => a.y - b.y)) {
			const tags = shared.stack.map(C => {
				const name = CharacterNickname(C);
				return { C, name, width: Math.min(TileWidth * 3, Math.max(80, MainCanvas.measureText(name).width + 24)) };
			});
			tags.sort((a, b) => b.width - a.width);
			let tagY = shared.y;
			for (const tag of tags) {
				let tagX = CommonClamp(shared.x - tag.width / 2, Left, Left + Width - tag.width);
				tagY -= tagHeight + 3;
				// A tag covering one already placed moves up, or to the side when there's no room left above
				for (let tries = 0; tries < 40 && (tagY < Top || overlaps([tagX, tagY, tag.width, tagHeight])); tries++) {
					if (tagY - tagHeight - 3 >= Top) {
						tagY -= tagHeight + 3;
					} else {
						tagY = shared.y - tagHeight - 3;
						tagX = CommonClamp(tagX + tag.width + 6, Left, Left + Width - tag.width);
					}
				}
				tagY = Math.max(Top, tagY);
				placed.push({ C: tag.C, name: tag.name, rect: [tagX, tagY, tag.width, tagHeight], charX: shared.charX, charY: shared.charY });
			}
		}
		for (const tag of placed) {
			const [x, y, width, height] = tag.rect;
			const hover = MouseIn(x, y, width, height);
			const color = CommonIsColor(tag.C.LabelColor) ? tag.C.LabelColor : "White";
			DrawRect(x, y, width, height, hover ? "#505050E0" : "#000000B0");
			DrawEmptyRect(x, y, width, height, tag.C.IsPlayer() ? "Cyan" : color, 2);
			DrawTextFit(tag.name, x + width / 2, y + height / 2 + 1, width - 12, color, "Black");
			ChatRoomMapViewNameTags.push({ C: tag.C, rect: tag.rect, charX: tag.charX, charY: tag.charY });
			if (hover) {
				ChatRoomMapViewFocusedCharacter = tag.C;
				ChatRoomMapViewFocusedCharacterX = tag.charX;
				ChatRoomMapViewFocusedCharacterY = tag.charY;
				CharacterUnderCursor = null;
			}
		}
	}
	MainCanvas.font = CommonGetFont(36);

	// If the user hovers the mouse over a tile occupied by a character
	if (CharacterUnderCursor) {
		DrawText(CharacterNickname(CharacterUnderCursor.Character), CharacterUnderCursor.StatusBaseX, CharacterUnderCursor.StatusBaseY, (CommonIsColor(CharacterUnderCursor.Character.LabelColor)) ? CharacterUnderCursor.Character.LabelColor : "White", "Black");
		ChatRoomDrawCharacterStatusIcons(CharacterUnderCursor.Character, CharacterUnderCursor.StatusBaseX - 125, CharacterUnderCursor.StatusBaseY - 40, 0.5);
	}

}

/**
 * Sets the next update flag for the room if it's not already set, the delay is 5 seconds
 * @returns {void} - Nothing
 * @deprecated since August 2026, {@link MapManager.Map.updateGlobalMapData} handles map updates
 */
function ChatRoomMapViewUpdateFlag() {}

/**
 * Sets the next update flags for the player if it's not already set, the delay is 1 seconds for live data and 10 seconds for last map data
 * @param {number} UpdateTimeOffset - A offset for the update time. This can be positive to increase the update time or negative to reduce it.
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdatePlayerFlag(UpdateTimeOffset = 0) {
	if (ChatRoomMapViewUpdatePlayerNext == null)
		ChatRoomMapViewUpdatePlayerNext = CommonTime() + ChatRoomMapViewUpdatePlayerTime + UpdateTimeOffset;
	if (Player.ImmersionSettings && Player.ImmersionSettings.ReturnToChatRoom && (ChatRoomMapViewUpdateLastMapDataNext == null))
		ChatRoomMapViewUpdateLastMapDataNext = CommonTime() + 10000;
}

/**
 * Schedule a map update to be sent to the server.
 *
 * The update will only happen once at the end of a 5s period.
 * Do note that calling {@link MapManager.Map.updateGlobalMapData()} will also
 * cause an update to be sent out, while making sure the data we're sending *is*
 * the current map data.
 *
 * @returns {void} - Nothing
 */
function ChatRoomMapViewScheduleMapUpdate() {
	if (ChatRoomMapViewUpdateRoomNext == null) ChatRoomMapViewUpdateRoomNext = CommonTime() + 5000;
}

/**
 * Updates the room data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdateRoomSync() {
	if (!ChatRoomData) return;
	if ((ChatRoomMapViewUpdateRoomNext == null) || (ChatRoomMapViewUpdateRoomNext > CommonTime())) return;
	if (!ChatRoomPlayerIsAdmin()) return;
	ChatRoomMapViewUpdateRoomNext = null;
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: ChatRoomGetSettings(ChatRoomData), Action: "Update" });
}

/**
 * Updates the player map data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdatePlayerSync() {
	if (!Player.MapData) return;
	if ((ChatRoomMapViewUpdatePlayerNext == null) || (ChatRoomMapViewUpdatePlayerNext > CommonTime())) return;
	ChatRoomMapViewUpdatePlayerNext = null;
	ServerSend("ChatRoomCharacterMapDataUpdate", Player.MapData);
}

/**
 * Updates a character's map data
 * @param {ServerMapDataResponse} data - Data object containing the new character map data.
 * @returns {void} - Nothing.
 */
function ChatRoomMapViewSyncMapData(data) {
	// Exits if we're not in a room
	if (!ChatRoomData) return;

	// Exit if the packet is invalid
	if (!CommonIsObject(data) || typeof data.MemberNumber !== "number") return;

	const char = ChatRoomCharacter.find(c => c.MemberNumber === data.MemberNumber);
	if (!char || char.IsPlayer()) return;

	// Assigns the MapData to the chatroom character
	char.MapData = ServerAccountDataSyncedValidate.MapData(data.MapData, char);
}

/**
 * Updates the player last map data if needed
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUpdateLastMapDataSync() {
	if ((ChatRoomMapViewUpdateLastMapDataNext == null) || (ChatRoomMapViewUpdateLastMapDataNext > CommonTime())) return;
	ChatRoomMapViewUpdateLastMapDataNext = null;
	ServerAccountUpdate.QueueData({ LastMapData: Player.MapData }, true);
}

/**
 * Characters can stand together on a shared object (teleport pads), where a teleport pad sends to,
 * and on the tiles right around them, so a group arriving at once can always walk off
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {boolean} - TRUE if more than one character can stand on that tile
 */
function ChatRoomMapViewTileIsShared(X, Y) {
	for (let dX = -1; dX <= 1; dX++) {
		for (let dY = -1; dY <= 1; dY++) {
			if (X + dX < 0 || Y + dY < 0 || X + dX >= ChatRoomMapViewWidth || Y + dY >= ChatRoomMapViewHeight) continue;
			const config = MapManager.Map.getObjectConfig(X + dX, Y + dY);
			if ((config?.Type === "Teleporter" && config.Shared) || MapManager.Map.isTeleporterDestination(X + dX, Y + dY)) return true;
		}
	}
	return false;
}

/**
 * Gets a map object image colorized the way clothes are, it's only colorized once and then reused
 * @param {string} url - The image
 * @param {HexColor} color - The color
 * @returns {DrawSource} - The colorized image, or the image itself while it's still loading
 */
function ChatRoomMapViewGetColoredImage(url, color) {
	const key = url + color;
	const cached = ChatRoomMapViewColoredImages.get(key);
	if (cached) return cached;
	const image = DrawGetImage(url);
	if (!image) return url;
	const canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	const context = canvas.getContext("2d");
	if (!context) return url;
	DrawImageEx(image, context, 0, 0, { HexColor: color, FullAlpha: true });
	// The color picker makes a new color with every move, those don't all need to stay
	if (ChatRoomMapViewColoredImages.size >= 64) ChatRoomMapViewColoredImages.clear();
	ChatRoomMapViewColoredImages.set(key, canvas);
	return canvas;
}

/**
 * Sends the player from the teleport pad she's standing on to where it points, if she can stand there
 * @returns {boolean} - TRUE if the player was teleported
 */
function ChatRoomMapViewTeleportPad() {
	if (Player.X < 0 || Player.Y < 0) return false;
	const destination = MapManager.Map.getTeleporterDestination(Player.X, Player.Y);
	if (!destination || !ChatRoomMapViewCanEnterTile(destination.X, destination.Y)) return false;
	ChatRoomMapViewMovement = null;
	Player.Position = destination;
	return true;
}

/**
 * Processes the character movement when the timer has expired
 * @returns {void} - Nothing
 */
function ChatRoomMapViewMovementProcess() {
	if (!Player.MapData || !ChatRoomMapViewMovement || ChatRoomMapViewMovement.TimeEnd > CommonTime()) return;
	Player.MapData.Pos.X = ChatRoomMapViewMovement.X;
	Player.MapData.Pos.Y = ChatRoomMapViewMovement.Y;
	// Set the update flag and reduce the wait time by the time the player already waited
	ChatRoomMapViewUpdatePlayerFlag(ChatRoomMapViewMovement.TimeStart - ChatRoomMapViewMovement.TimeEnd);
	ChatRoomMapViewMovement = null;
	// After we moved, calculate the new perception masks
	MapManager.Map.updatePlayerPerception();
	// Get the tile and object we entered
	const newTile = MapManager.Map.getTile(Player.MapData.Pos.X, Player.MapData.Pos.Y);
	const newObject = MapManager.Map.getObject(Player.MapData.Pos.X, Player.MapData.Pos.Y);
	// If the current tile or object have OnEnter functions, execute them
	if(newTile && newTile.OnEnter) newTile.OnEnter();
	if(newObject && newObject.OnEnter) newObject.OnEnter();
}

/**
 * Checks if the player is leashed and if she should follow the leash holder
 * @returns {void} - Nothing
 */
function ChatRoomMapViewLeash() {

	// Finds the leash holder character
	if (ChatRoomLeashPlayer == null) return;
	for (let C of ChatRoomCharacter)
		if ((C.MemberNumber == ChatRoomLeashPlayer) && !C.IsPlayer()) {

			// Validates the data first
			if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return;
			if ((C.MapData?.Pos == null) || (C.MapData.Pos.X == null) || (C.MapData.Pos.Y == null)) return;

			// Leash range is 2 tiles
			let Distance = Math.max(Math.abs(Player.MapData.Pos.X - C.MapData.Pos.X), Math.abs(Player.MapData.Pos.Y - C.MapData.Pos.Y));
			if (Distance <= 2) return;

			// The X and Y variance tells us where to pull the character
			let VarX = Player.MapData.Pos.X - C.MapData.Pos.X;
			let VarY = Player.MapData.Pos.Y - C.MapData.Pos.Y;
			let TargetX = Player.MapData.Pos.X;
			let TargetY = Player.MapData.Pos.Y;
			if (VarX > 2) TargetX = C.MapData.Pos.X + 2;
			if (VarX < -2) TargetX = C.MapData.Pos.X - 2;
			if (VarY > 2) TargetY = C.MapData.Pos.Y + 2;
			if (VarY < -2) TargetY = C.MapData.Pos.Y - 2;

			// If the new target tile cannot be entered, we try another one nearby
			if (ChatRoomMapViewCanEnterTile(TargetX, TargetY) <= 0) {

				// Tries to bring the character one extra tile toward the leash holder on the invert axis (X instead of Y or vice versa)
				if ((Math.abs(VarX) > 2) && (Math.abs(VarX) > Math.abs(VarY)) && (VarY > 0)) TargetY--;
				if ((Math.abs(VarX) > 2) && (Math.abs(VarX) > Math.abs(VarY)) && (VarY < 0)) TargetY++;
				if ((Math.abs(VarY) > 2) && (Math.abs(VarX) < Math.abs(VarY)) && (VarX > 0)) TargetX--;
				if ((Math.abs(VarY) > 2) && (Math.abs(VarX) < Math.abs(VarY)) && (VarX < 0)) TargetX++;

				// If we still cannot move there
				if (ChatRoomMapViewCanEnterTile(TargetX, TargetY) <= 0) {

					// Bring the character 1 tile near the leash holder
					if (VarX > 1) TargetX = C.MapData.Pos.X + 1;
					if (VarX < -1) TargetX = C.MapData.Pos.X - 1;
					if (VarY > 1) TargetY = C.MapData.Pos.Y + 1;
					if (VarY < -1) TargetY = C.MapData.Pos.Y - 1;

					// If it still doesn't work, we give up
					if (ChatRoomMapViewCanEnterTile(TargetX, TargetY) <= 0) return;

				}

			}

			// Sends the movement packet
			Player.MapData.Pos.X = TargetX;
			Player.MapData.Pos.Y = TargetY;
			ChatRoomMapViewUpdatePlayerFlag();
			return;

		}

}


/**
 * Draws the map and characters of the chat room map on the left side of the screen
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDraw() {
	ChatRoomMapViewDrawGrid(0, 0, 1000, 1000);
}

/**
 * Draws the buttons of the chat room map
 * @returns {void} - Nothing
 */
function ChatRoomMapViewDrawUi() {
	ChatRoomMapViewCreateUI();

	// Admins can grant themselves super powers (teleport, far hearing, etc.)
	if (ChatRoomPlayerIsAdmin())
		DrawButton(790, 860, 60, 60, "", "White", "Icons/" + ((ChatRoomMapViewSuperPowersActive) ? "SuperPowersActive" : "SuperPowersInactive") + ".png");

	// Draw the movement buttons
	if (ChatRoomMapViewMovement == null) {
		DrawButton(860, 860, 60, 60, "", "White", "Icons/North.png");
		DrawButton(790, 930, 60, 60, "", "White", "Icons/West.png");
		DrawButton(860, 930, 60, 60, "", "White", "Icons/South.png");
		DrawButton(930, 930, 60, 60, "", "White", "Icons/East.png");
	} else {
		DrawButton(860, 860, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "North") ? "White" : "#80FF80", "Icons/North.png");
		DrawButton(930, 860, 60, 60, "", "White", "Icons/Cancel.png");
		DrawButton(790, 930, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "West") ? "White" : "#80FF80", "Icons/West.png");
		DrawButton(860, 930, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "South") ? "White" : "#80FF80", "Icons/South.png");
		DrawButton(930, 930, 60, 60, "", (ChatRoomMapViewMovement.Direction !== "East") ? "White" : "#80FF80", "Icons/East.png");
		let Progress = (CommonTime() - ChatRoomMapViewMovement.TimeStart) / (ChatRoomMapViewMovement.TimeEnd - ChatRoomMapViewMovement.TimeStart) * 100;
		DrawProgressBar(790, 992, 200, 8, Progress);
	}
}

/**
 * Change the key of charachter - sender
 * @param {Character} target
 * @param {("gold" | "silver" | "bronze")[]} keys
 * @param {boolean} give
 */
function ChatRoomMapViewChangeKey(target, keys, give) {
	if (!ChatRoomPlayerIsAdmin()) return;

	const dictionary = new DictionaryBuilder().mapViewChangeKey(keys, give).build();
	ServerSend("ChatRoomChat", { Content: "ChatRoomMapViewChangeKey", Type: "Hidden", Dictionary: dictionary, Target: target?.MemberNumber });
}

/**
 * Change a key from a character from a hidden message - reciver
 * @param {OnlineCharacter} sender
 * @param {ServerChatRoomMessage} data
 */
function ChatRoomMapViewChangeKeyHiddenMessage(sender, data) {
	if (!ChatRoomCharacterIsAdmin(sender) || !Player.MapData) return;
	const playerData = Player.MapData;

	data.Dictionary?.map((entry) => {
		if (!IsMapViewChangeKeyEventDictionaryEntry(entry)) return;
		const HasKey = `HasKey${entry.Key.charAt(0).toUpperCase() + entry.Key.slice(1)}`;
		playerData.PrivateState[HasKey] = entry.Bool;
	});
}

/**
 * Teleport a character to a specific tile
 * @param {Character} target
 * @param {ChatRoomMapPos} position
 */
function ChatRoomMapViewTeleport(target, position) {
	if (!ChatRoomPlayerIsAdmin()) return;
	if (Player.MemberNumber === target.MemberNumber) Player.Position = position;

	const dictionary = new DictionaryBuilder().mapViewTeleport(position).build();
	ServerSend("ChatRoomChat", { Content: "ChatRoomMapViewTeleport", Type: "Hidden", Dictionary: dictionary, Target: target?.MemberNumber });
}

/**
 * Teleport a character to a specific tile from a hidden message
 * @param {OnlineCharacter} sender
 * @param {ServerChatRoomMessage} data
 */
function ChatRoomMapViewTeleportHiddenMessage(sender, data) {
	if (!ChatRoomCharacterIsAdmin(sender)) return;
	const entry = data.Dictionary?.find(e => IsMapViewTeleportEventDictionaryEntry(e));
	if (entry) {
		ChatRoomMapViewMovement = null;
		Player.Position = entry.Position;
	}
}

/**
 * Check if a tile on the map can be entered by a player, and return the number of milliseconds required to reach it
 * @param {number} X - The X position on the map
 * @param {number} Y - The Y position on the map
 * @returns {number} - The number of milliseconds
 */
function ChatRoomMapViewCanEnterTile(X, Y) {

	// Out of map bound or walls cannot enter, super powers skip everything
	if ((X < 0) || (Y < 0) || (X >= ChatRoomMapViewWidth) || (Y >= ChatRoomMapViewHeight)) return 0;
	if (ChatRoomMapViewHasSuperPowers()) {
		if (CommonTime() - ChatRoomMapViewStartOfKeyPress < 300) return ChatRoomMapViewBaseMovementSpeed;
		return ChatRoomMapViewBaseMovementSpeed / 10;
	}

	// Enclosed or suspended players cannot change tiles
	if (Player.IsEnclose() || Player.IsSuspended() || Player.IsMounted()) return 0;

	// The MapImmobile effect prevents players from moving
	if (Player.HasEffect("MapImmobile")) return 0;

	// Cannot enter a tile occupied by another player, unless that tile can be shared (around teleport pads)
	if (!ChatRoomMapViewTileIsShared(X, Y) && ChatRoomCharacter.some(c => !c.IsPlayer() && c.MapData?.Pos.X === X && c.MapData?.Pos.Y === Y)) return 0;

	if (ChatRoomMapViewPositionIsBlocked(X, Y)) return 0;

	// Base movement speed first, water tiles are slower
	let Speed = ChatRoomMapViewBaseMovementSpeed;

	const Tile = MapManager.Map.getTile(X, Y);
	// Slowed down if not under the MapSwim effect
	if (Tile?.Type === "Water" && Tile?.Style !== "Lava" && !Player.HasEffect("MapSwim"))
		Speed = Speed * 2.5;

	// The hogtied/bound/slow/plugged modificator
	if (Player.Pose?.includes("Hogtied")) Speed = Speed * 12;
	else if (!Player.CanWalk()) Speed = Speed * 6;
	else if (Player.GetSlowLevel() > 0) Speed = Speed * Player.GetSlowLevel() * 2;
	else if (!Player.CanKneel()) Speed = Speed * 1.5;
	else if (Player.IsPlugged()) Speed = Speed * 1.2;

	// Returns the final calculated speed
	return Speed;

}

/**
 * Moves the player
 * @param {ChatRoomMapDirection} D - The direction being travelled (North, South, East, West)
 * @param {boolean} Force - Force the movement
 * @returns {void} - Nothing
 */
function ChatRoomMapViewMove(D, Force = false) {

	// Nothing to do if that current move is in progress
	if ((Player.MapData == null) || (Player.MapData.Pos.X == null) || (Player.MapData.Pos.Y == null)) return;
	if ((ChatRoomMapViewMovement != null) && (ChatRoomMapViewMovement.Direction === D)) return;

	// Gets the new position
	let X = Player.MapData.Pos.X + ((D == "West") ? -1 : 0) + ((D == "East") ? 1 : 0);
	let Y = Player.MapData.Pos.Y + ((D == "North") ? -1 : 0) + ((D == "South") ? 1 : 0);
	let Time = ChatRoomMapViewCanEnterTile(X, Y);

	// If we can enter the tile
	if (Time > 0) {
		ChatRoomMapViewMovement = {
			X: X,
			Y: Y,
			Direction: D,
			TimeStart: CommonTime(),
			TimeEnd: CommonTime() + (Force ? 0 : Time)
		};
	}

}

/**
 * Undoes the changes made to the map, from the latest backup in the stack
 * @returns {void} - Nothing
 */
function ChatRoomMapViewUndo() {
	if (!ChatRoomData?.MapData) return;
	MapManager.Map.undo();
	MapManager.Map.updatePlayerPerception();
}

/**
 * Handles keyboard keys in the chat room map screen
 * @type {KeyboardEventListener}
 */
function ChatRoomMapViewKeyDown(event) {

	// Nothing to do if a character dialog is open
	if (CurrentCharacter != null) return false;
	if (document.activeElement && (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName) ||
		document.activeElement === ElementWrap("InputChat")
		|| document.activeElement === ElementWrap("chat-room-map-view-panel-editor-search-input"))) return false;

	const move = CommonKeyMove(event);
	if (!move) return false;

	const isDirectional = ["North", "South", "West", "East"].includes(move);
	const noKeyPressed = !Object.values(ChatRoomMapViewKeysPressed).some(Boolean);

	if (noKeyPressed && isDirectional) {
		ChatRoomMapViewStartOfKeyPress = CommonTime();
	}

	ChatRoomMapViewKeysPressed = {
		North: move === "North",
		South: move === "South",
		West: move === "West",
		East: move === "East",
	};
	return true;
}

/**
 * Handles keyboard up keys in the chat room map screen
 * @type {KeyboardEventListener}
 */
function ChatRoomMapViewKeyUp(event) {
	switch (CommonKeyMove(event, true, false)) {
		case "North":
			ChatRoomMapViewKeysPressed.North = false;
			return true;
		case "West":
			ChatRoomMapViewKeysPressed.West = false;
			return true;
		case "South":
			ChatRoomMapViewKeysPressed.South = false;
			return true;
		case "East":
			ChatRoomMapViewKeysPressed.East = false;
			return true;
		default:
			return false;
	}
}

/**
 * Handles clicks the chatroom screen view.
 * @returns {void} - Nothing.
 */
function ChatRoomMapViewClick() {

	// Out of chatroom, exit right away
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;

	if (ChatRoomMapViewTeleportPadPicking && ChatRoomMapViewTeleportPadIndex != null) {
		const tile = ChatRoomMapViewPixelToTileCoordinates(MouseX, MouseY);
		if (tile) {
			ChatRoomMapViewTeleportPadPick(tile);
			return;
		}
	}

	// Taps don't hover first, so the name tags are checked on click too
	const nameTag = ChatRoomMapViewNameTags.find(tag => MouseIn(...tag.rect));
	if (nameTag) {
		ChatRoomMapViewFocusedCharacter = nameTag.C;
		ChatRoomMapViewFocusedCharacterX = nameTag.charX;
		ChatRoomMapViewFocusedCharacterY = nameTag.charY;
	}

	// Toggle the superpowers on and off
	if (ChatRoomPlayerIsAdmin() && MouseIn(790, 860, 60, 60)) {
		ChatRoomMapViewSuperPowersActive = !ChatRoomMapViewSuperPowersActive;
		MapManager.Map.updatePlayerPerception();
		return;
	}

	// Regular movement buttons
	if (MouseIn(930, 860, 60, 60) && ChatRoomMapViewMovement) {
		ChatRoomMapViewMovement = null;
		return;
	}
	if (MouseIn(860, 860, 60, 60)) {
		ChatRoomMapViewMove("North");
		return;
	}
	if (MouseIn(790, 930, 60, 60)) {
		ChatRoomMapViewMove("West");
		return;
	}
	if (MouseIn(860, 930, 60, 60)) {
		ChatRoomMapViewMove("South");
		return;
	}
	if (MouseIn(930, 930, 60, 60)) {
		ChatRoomMapViewMove("East");
		return;
	}

	// When clicking on a character
	if ((MouseX <= 1000) && (ChatRoomMapViewFocusedCharacter != null) && (ChatRoomMapViewEditMode != "Tile") && (ChatRoomMapViewEditMode != "Object") && !ChatRoomMapViewEditStarted) {

		// Checks if the arousal meter is showing
		let MeterShow = ChatRoomMapViewFocusedCharacter.IsPlayer();
		if (!ChatRoomMapViewFocusedCharacter.IsPlayer() && Player.ArousalSettings.ShowOtherMeter && ChatRoomMapViewFocusedCharacter.ArousalSettings) {
			if (ChatRoomMapViewFocusedCharacter.ArousalSettings.Visible === "Access") {
				MeterShow = ChatRoomMapViewFocusedCharacter.AllowItem;
			} else if (ChatRoomMapViewFocusedCharacter.ArousalSettings.Visible === "All") {
				MeterShow = true;
			}
		}

		// If we clicked on the thermometer, we zoom/unzoom it
		if (MeterShow) {

			// Defines the X, Y and zoom of the character
			let CharX = ChatRoomMapViewFocusedCharacterX;
			let CharY = ChatRoomMapViewFocusedCharacterY;
			let Zoom = (1 / ((ChatRoomMapViewPerceptionRange * 2) + 1)) * 1.8;

			// Zoom or unzoom
			if (MouseIn(CharX + 60 * Zoom, CharY + 400 * Zoom, 80 * Zoom, 100 * Zoom) && !ChatRoomMapViewFocusedCharacter.ArousalZoom) { ChatRoomMapViewFocusedCharacter.ArousalZoom = true; return; }
			if (MouseIn(CharX + 50 * Zoom, CharY + 615 * Zoom, 100 * Zoom, 85 * Zoom) && ChatRoomMapViewFocusedCharacter.ArousalZoom) { ChatRoomMapViewFocusedCharacter.ArousalZoom = false; return; }

			// If the player can manually control her arousal, we set the progress manual and change the facial expression, it can trigger an orgasm at 100%
			if (ChatRoomMapViewFocusedCharacter.IsPlayer() && MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 500 * Zoom) && ChatRoomMapViewFocusedCharacter.ArousalZoom) {
				if (PreferenceArousalAtLeast(Player, "Manual") && !PreferenceArousalAtLeast(Player, "Automatic")) {
					var Arousal = Math.round((CharY + 625 * Zoom - MouseY) / (4 * Zoom));
					ActivitySetArousal(Player, Arousal);
					ActivityExpression(Player, Player.ArousalSettings.Progress);
					if (Player.ArousalSettings.Progress == 100) ActivityOrgasmPrepare(Player);
				}
				return;
			}

			// Don't do anything if the thermometer is clicked without access to it
			if (MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 415 * Zoom) && ChatRoomMapViewFocusedCharacter.ArousalZoom) return;

		}

		// Focuses on the character
		ChatRoomFocusCharacter(ChatRoomMapViewFocusedCharacter);

	}

	const pos = ChatRoomMapViewPixelToTileCoordinates(MouseX, MouseY);
	if (!pos) {
		ChatRoomMapViewSetSelectedTile(undefined);
		return;
	}

	// If we are in edit mode, we can change the tile or object
	ChatRoomMapViewSetSelectedTile(pos);
}

/**
 * @param {{ X: number, Y: number} | undefined} pos
 */
function ChatRoomMapViewSetSelectedTile(pos) {
	ChatRoomMapViewHideDialogMenu();
	if (!pos) {
		ChatRoomMapViewSelectedObjectIndex = null;
		return;
	}
	const objectId = MapManager.Map.getObjectId(pos.X, pos.Y);
	const [index] = MapManager.Map.unpackIndex(pos.Y, pos.Y);
	ChatRoomMapViewSelectedObjectIndex = index;
	if (objectId) {
		const object = MapGetDoodad("Object", objectId);
		object?.OnClick?.(pos.X, pos.Y);
	}
}

/**
 * Mouse down event is used to draw on screen and handle the tiles buttons
 * @type {MouseEventListener}
 */
function ChatRoomMapViewMouseDown(event) {

	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive() || ChatRoomMapViewTeleportPadPicking) return;

	// In tile edit mode
	else if ((ChatRoomMapViewEditMode == "Tile") && MouseIn(0, 0, 1000, 1000)) {
		if (MouseIn(10, 10, 60, 60)) { return; }
		if (MouseIn(10, 80, 60, 60)) { return; }

		// Enter the drawing mode
		ChatRoomMapViewEditStarted = true;
		ChatRoomMapViewMouseMove(event);
		return;

	// In object edit mode
	} else if ((ChatRoomMapViewEditMode == "Object") && MouseIn(0, 0, 1000, 1000)) {
		if (MouseIn(10, 10, 60, 60)) { return; }
		if (MouseIn(10, 80, 60, 60)) { return; }

		// Enter the drawing mode
		ChatRoomMapViewEditStarted = true;
		ChatRoomMapViewMouseMove(event);
		return;

	} else if ((ChatRoomMapViewEditMode === "Effect") && MouseIn(0, 0, 1000, 1000)) {
		// Check if we are clicking a menu button (Exit button)
		if (MouseIn(10, 10, 60, 60)) { return; }
		// If we aren't clicking a button, we are painting the map!
		ChatRoomMapViewEditStarted = true;
		ChatRoomMapViewMouseMove(event);
		return;

	// A tool that accepts this palette can paint here, including from a category screen
	} else if (ChatRoomMapViewGetActiveTool()?.canPaint() && MouseIn(0, 0, 1000, 1000)) {
		if (MouseIn(10, 10, 60, 60)) { return; }
		if (MouseIn(10, 80, 60, 60)) { return; }
		ChatRoomMapViewEditStarted = true;
		ChatRoomMapViewMouseMove(event);
		return;
	}

}

/**
 *
 * @param {ChatRoomData | null} data
 * @returns {data is ChatRoomData & { MapData: { Objects: string, Tiles: string }}}
 */
function validMapData(data) {
	return !!data && !!data.MapData && !!data.MapData.Objects && !!data.MapData.Tiles;
}

/**
 * Convert a pixel coordinate into a tile
 * @param {number} pixelX
 * @param {number} pixelY
 * @returns {{ X: number, Y: number } | null}
 */
function ChatRoomMapViewPixelToTileCoordinates(pixelX, pixelY) {
	const [Left, Top, Width, Height] = [0, 0, 1000, 1000]; // From ChatRoomMapViewDrawGrid

	const TileWidth = Width / ((ChatRoomMapViewPerceptionRange * 2) + 1);
	const TileHeight = Height / ((ChatRoomMapViewPerceptionRange * 2) + 1);
	const { X: PlayerX = 0, Y: PlayerY = 0 } = Player.MapData?.Pos ?? {};

	const ScreenX = pixelX - Left;
	const ScreenY = pixelY - Top;
	if (ScreenX < 0 || ScreenX >= Width || ScreenY < 0 || ScreenY >= Height) return null;

	// ScreenY's centering term is TileWidth, matching the draw loop.
	const X = Math.floor(ScreenX / TileWidth) - ChatRoomMapViewPerceptionRange + PlayerX;
	const Y = Math.floor((ScreenY - ChatRoomMapViewPerceptionRange * TileWidth) / TileHeight) + PlayerY;

	return { X, Y };
}

/**
 * Mouse move event is used to draw on screen
 * @type {MouseEventListener}
 */
function ChatRoomMapViewMouseMove(event) {

	// Only in edit mode
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive() || !validMapData(ChatRoomData)) return;
	if (!ChatRoomMapViewEditStarted) return;

	const pos = ChatRoomMapViewPixelToTileCoordinates(MouseX, MouseY);
	if (!pos) return;

	const tool = ChatRoomMapViewGetActiveTool();
	if (!tool || !tool.canPaint()) return;
	tool.paint(pos.X, pos.Y, ChatRoomMapViewEditRange - 1, event);

	// Encode the changed map and write it to the global ChatRoomData.MapData.
	// This is somewhat inefficient since we don't have to actually encode the string
	// before we need to send it to the server, but it would suffice for now.
	// See ChatRoomMapManager.Map.updateGlobalMapData documentation for more details.
	MapManager.Map.updateGlobalMapData();
}

/**
 * The tool currently painting, if one is selected.
 * @returns {ChatRoomMapViewTool | null}
 */
function ChatRoomMapViewGetActiveTool() {
	if (ChatRoomMapViewActiveTool === "") return null;
	return ChatRoomMapViewTools[ChatRoomMapViewActiveTool];
}

/**
 * Selects the paint tool and updates its button, if that button is on screen.
 * @param {ChatRoomMapViewToolName | ""} tool
 */
function ChatRoomMapViewSetActiveTool(tool) {
	ChatRoomMapViewActiveTool = tool;
	document.getElementById("chat-room-map-view-eraser")?.setAttribute("aria-checked", tool === "Eraser" ? "true" : "false");
}

/**
 * The map editing tools.
 * @satisfies {Record<string, ChatRoomMapViewTool>}
 */
const ChatRoomMapViewTools = {
	Brush: {
		selectionColor: "cyan",
		canPaint: () => {
			const mode = ChatRoomMapViewEditMode;
			return (mode === "Tile" || mode === "Object" || mode === "Effect") && ChatRoomMapViewEditObject != null;
		},
		paint: (x, y, range, _event) => {
			switch (ChatRoomMapViewEditMode) {
				case "Tile":
					MapManager.Map.setTile(x, y, /** @type {ChatRoomMapTile} */ (ChatRoomMapViewEditObject), range);
					break;
				case "Object":
					MapManager.Map.setObject(x, y, /** @type {ChatRoomMapObject} */ (ChatRoomMapViewEditObject), range);
					break;
				case "Effect": {
					const effect = /** @type {ChatRoomMapEffect} */ (ChatRoomMapViewEditObject);
					if (effect == null || effect.ID === ChatRoomMapViewEffectStartID) {
						MapManager.Map.setEffects(x, y, [], range);
					} else {
						MapManager.Map.addEffect(x, y, effect, range);
					}
					break;
				}
			}
		},
	},
	// Ignores the selected doodad. Alt while erasing objects paints EmptySpace/Impassable.
	Eraser: {
		selectionColor: "red",
		canPaint: () => ChatRoomMapViewEditMode !== "",
		paint: (x, y, range, event) => {
			switch (ChatRoomMapViewEditMode) {
				case "Tile":
				case "TileType":
					MapManager.Map.setTile(x, y, MapDataGetTile(ChatRoomMapViewObjectStartID), range);
					break;
				case "Object":
				case "ObjectType":
					MapManager.Map.setObject(x, y, MapDataGetObject(event.altKey ? 101 : ChatRoomMapViewObjectStartID), range);
					break;
				case "Effect":
					MapManager.Map.setEffects(x, y, [], range);
					break;
			}
		},
	},
};

/**
 * Mouse up event is used to stop drawing
 * @type {MouseEventListener}
 */
function ChatRoomMapViewMouseUp() {
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;
	ChatRoomMapViewEditStarted = false;
}

/**
 * Mouse wheel event is used to zoom the map
 * @type {MouseWheelEventListener}
 */
function ChatRoomMapViewMouseWheel(Event) {
	if ((CurrentScreen != "ChatRoom") || !ChatRoomMapViewIsActive()) return;
	if ((MouseX <= 1000) && (Event.deltaY < 0) && (ChatRoomMapViewPerceptionRange > ChatRoomMapViewPerceptionRangeMin)) ChatRoomMapViewPerceptionRange--;
	if ((MouseX <= 1000) && (Event.deltaY > 0) && (ChatRoomMapViewPerceptionRange < ChatRoomMapViewPerceptionRangeMax)) ChatRoomMapViewPerceptionRange++;
}

/**
 * Copies the current map in the clipboard.  Called from the chat field command "mapcopy"
 * @returns {void} - Nothing
 */
function ChatRoomMapViewCopy() {
	// Make sure there's a valid map to copy first
	if (ChatRoomData?.MapData?.Type == null || ChatRoomData?.MapData?.Type === "Never") {
		ChatRoomSendLocal(TextGet("MapCopyError"));
		return;
	}

	const mapString = MapManager.Map.exportString();
	if (mapString === undefined) {
		ChatRoomSendLocal(TextGet("MapCopyError"));
		return;
	}

	CommonClipboardWrite(mapString, (res) => {
		if (res.err) {
			ToastManager.error(res.errorAsDOM(TextGet("MapCopyError")));
		} else {
			ToastManager.success(TextGet("MapCopyDone"));
		}
	});
}

/**
 * Pastes the current map Param data to load it.  Called from the chat field command "mappaste"
 * @param {string} Param - The parameter that comes with the command
 * @returns {void} - Nothing
 */
function ChatRoomMapViewPaste(Param) {
	// Validates the data first
	if (typeof Param !== "string" || Param.length === 0) {
		ToastManager.error(TextGet("MapPasteError"));
		return;
	}

	// Only admins can paste/edit the map
	if (!ChatRoomPlayerIsAdmin()) {
		ToastManager.error(TextGet("MapPasteAdmin"));
		return;
	}

	if (!MapManager.Map.importString(Param)) {
		ToastManager.error(TextGet("MapPasteError"));
		return;
	}

	ToastManager.info(TextGet("MapPasteDone"));
}

/**
 * Converts the color in R [0; 255], G [0; 255], B [0; 255], A [0.0; 1.0] format
 * to an HTML color function.
 * @param {[number, number, number, number]} rgba
 * @returns {string}
 */
function RgbaArrayToHTMLColor(rgba) {
	return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`;
}
