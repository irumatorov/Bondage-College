import { Game } from "./Utils";

// Mock out all the stuff that's required before ChatRoom.js can load
Game.ChatRoomCharacterViewRun = () => {};
Game.ChatRoomCharacterViewDraw = () => {};
Game.ChatRoomCharacterViewDrawUi = () => {};
Game.ChatRoomCharacterViewClick = () => {};
Game.ChatRoomCharacterViewKeyDown = () => {};
Game.ChatRoomCharacterViewCanLeave = () => {};
Game.ChatRoomCharacterViewScreenshot = () => {};
Game.ChatRoomCharacterViewActivate = () => {};

Game.ChatRoomMapViewRun = () => {};
Game.ChatRoomMapViewDraw = () => {};
Game.ChatRoomMapViewDrawUi = () => {};
Game.ChatRoomMapViewClick = () => {};
Game.ChatRoomMapViewKeyDown = () => {};
Game.ChatRoomMapViewKeyUp = () => {};
Game.ChatRoomMapViewMouseDown = () => {};
Game.ChatRoomMapViewMouseUp = () => {};
Game.ChatRoomMapViewMouseMove = () => {};
Game.ChatRoomMapViewMouseWheel = () => {};
Game.ChatRoomMapViewRoomUpdated = () => {};
Game.ChatRoomMapViewCanStartWhisper = () => {};
Game.ChatRoomMapViewCanLeave = () => {};
Game.ChatRoomMapViewScreenshot = () => {};
Game.ChatRoomMapViewActivate = () => {};
Game.ChatRoomMapViewDeactivate = () => {};
Game.ChatRoomMapViewResize = () => {};

Game.load("../Scripts/lib/LZString.js");

Game.load("../Scripts/Common.js");
Game.load("../Scripts/BitString.js");
Game.load("../Screens/Online/ChatRoom/ChatRoom.js");
Game.load("../Screens/Online/ChatRoom/ChatRoomMapView.js");

Game.load("../Assets/MapData.js");
Game.load("../Scripts/Map.js");

Game.MapDataLoad();

Game.Player = {};
Game.Player.MapData = null;

beforeEach(() => {
	Game.ChatRoomData = {};
	Game.ChatRoomData.MapData = Game.ChatRoomMapViewInitialize("Always");
	Game.MapManager.Map.loadGlobalMapData(Game.ChatRoomData.MapData);
});

afterEach(() => {
	Game.MapManager.Map.clear();
	document.body.replaceChildren();
});

function resetEditor() {
	Game.ChatRoomMapViewActiveTool = "";
	Game.ChatRoomMapViewEditStarted = false;
	Game.ChatRoomMapViewEditMode = "";
	Game.ChatRoomMapViewEditSubMode = "";
	Game.ChatRoomMapViewEditObject = null;
	Game.ChatRoomMapViewEditRange = 1;
}

function paintAt(x: number, y: number, altKey = false) {
	const tileSize = 1000 / ((Game.ChatRoomMapViewPerceptionRange * 2) + 1);
	const offsetX = (Game.ChatRoomMapViewSplitPosition - tileSize) / 2;
	const offsetY = (1000 - tileSize) / 2;
	Game.MouseX = offsetX + (x + 0.5) * tileSize;
	Game.MouseY = offsetY + (y + 0.5) * tileSize;
	Game.ChatRoomMapViewMouseMove({ altKey });
}

function beginPaint() {
	Game.CurrentScreen = "ChatRoom";
	Game.ChatRoomActiveView = Game.ChatRoomViews.Map;
	Game.ChatRoomMapViewEditStarted = true;
	Game.ChatRoomMapViewEditRange = 1;
	Game.ChatRoomMapViewActiveTool = "Brush";
}

describe("editor palette", () => {
	it("clears the selected doodad when the edit mode changes", () => {
		Game.ChatRoomMapViewEditMode = "Object";
		Game.ChatRoomMapViewEditSubMode = "EmptySpace";
		const emptySpace = Game.MapDataGetObject(100);
		Game.ChatRoomMapViewEditObject = emptySpace;

		Game.ChatRoomMapViewEditorSetMode("Object", "EmptySpace");
		expect(Game.ChatRoomMapViewEditObject).toBe(emptySpace);
		expect(Game.ChatRoomMapViewEditSubMode).toBe("EmptySpace");

		Game.ChatRoomMapViewEditorSetMode("ObjectType", "");
		expect(Game.ChatRoomMapViewEditMode).toBe("ObjectType");
		expect(Game.ChatRoomMapViewEditSubMode).toBe("");
		expect(Game.ChatRoomMapViewEditObject).toBeNull();

		Game.ChatRoomMapViewEditorSetMode("Object", "Bedroom");
		expect(Game.ChatRoomMapViewEditMode).toBe("Object");
		expect(Game.ChatRoomMapViewEditSubMode).toBe("Bedroom");
		expect(Game.ChatRoomMapViewEditObject).toBeNull();

		Game.ChatRoomMapViewEditorSetMode("Object", "LivingRoom");
		expect(Game.ChatRoomMapViewEditSubMode).toBe("LivingRoom");
		expect(Game.ChatRoomMapViewEditObject).toBeNull();

		Game.ChatRoomMapViewEditMode = "Tile";
		Game.ChatRoomMapViewEditSubMode = "Floor";
		Game.ChatRoomMapViewEditObject = Game.MapDataGetTile(100);
		Game.ChatRoomMapViewEditorSetMode("TileType", "");
		expect(Game.ChatRoomMapViewEditSubMode).toBe("");
		expect(Game.ChatRoomMapViewEditObject).toBeNull();

		resetEditor();
	});
});

describe("brush", () => {
	it("paints only while a doodad is selected in tile, object, or effect mode", () => {
		const map = Game.MapManager.Map;
		beginPaint();

		Game.ChatRoomMapViewEditMode = "Object";
		Game.ChatRoomMapViewEditSubMode = "Bedroom";
		Game.ChatRoomMapViewEditObject = null;
		map.setObject(1, 1, Game.MapDataGetObject(2010), 0);
		paintAt(1, 1);
		expect(map.getObjectId(1, 1)).toBe(2010);

		const emptySpace = Game.MapDataGetObject(100);
		Game.ChatRoomMapViewEditObject = emptySpace;
		paintAt(1, 1);
		expect(map.getObjectId(1, 1)).toBe(100);

		map.setTile(2, 2, Game.MapDataGetTile(101), 0);
		Game.ChatRoomMapViewEditMode = "TileType";
		Game.ChatRoomMapViewEditObject = Game.MapDataGetTile(100);
		paintAt(2, 2);
		expect(map.getTileId(2, 2)).toBe(101);
		expect(Game.ChatRoomMapViewEditMode).toBe("TileType");

		map.setObject(3, 3, Game.MapDataGetObject(2010), 0);
		Game.ChatRoomMapViewEditMode = "ObjectType";
		Game.ChatRoomMapViewEditObject = emptySpace;
		paintAt(3, 3);
		expect(map.getObjectId(3, 3)).toBe(2010);
		expect(Game.ChatRoomMapViewEditMode).toBe("ObjectType");

		resetEditor();
	});

	it("selects the brush when a doodad is chosen", () => {
		const tile = Game.MapDataGetTile(101);
		Game.ChatRoomMapViewEditorSetSelection(tile, "Tile", false);
		expect(Game.ChatRoomMapViewActiveTool).toBe("Brush");
		expect(Game.ChatRoomMapViewEditMode).toBe("Tile");
		expect(Game.ChatRoomMapViewEditObject.ID).toBe(tile.ID);

		resetEditor();
	});
});

describe("eraser", () => {
	it("erases to the default doodad for the current palette", () => {
		const map = Game.MapManager.Map;
		beginPaint();
		Game.ChatRoomMapViewActiveTool = "Eraser";

		map.setTile(1, 1, Game.MapDataGetTile(101), 0);
		Game.ChatRoomMapViewEditMode = "Tile";
		paintAt(1, 1, true);
		expect(map.getTileId(1, 1)).toBe(100);

		map.setObject(2, 2, Game.MapDataGetObject(2010), 0);
		Game.ChatRoomMapViewEditMode = "Object";
		paintAt(2, 2, false);
		expect(map.getObjectId(2, 2)).toBe(100);
		paintAt(2, 2, true);
		expect(map.getObjectId(2, 2)).toBe(101);

		map.addEffect(3, 3, Game.MapDataGetEffect(11), 0);
		Game.ChatRoomMapViewEditMode = "Effect";
		paintAt(3, 3, true);
		expect(map.getEffects(3, 3)).toEqual([]);

		map.setTile(1, 2, Game.MapDataGetTile(101), 0);
		Game.ChatRoomMapViewEditMode = "TileType";
		paintAt(1, 2, false);
		expect(map.getTileId(1, 2)).toBe(100);
		expect(Game.ChatRoomMapViewEditMode).toBe("TileType");

		map.setObject(4, 0, Game.MapDataGetObject(2010), 0);
		Game.ChatRoomMapViewEditMode = "ObjectType";
		paintAt(4, 0, true);
		expect(map.getObjectId(4, 0)).toBe(101);
		expect(Game.ChatRoomMapViewEditMode).toBe("ObjectType");

		resetEditor();
	});

	it("selects the brush for a doodad and clears a tool that can no longer paint", () => {
		const tile = Game.MapDataGetTile(101);
		Game.ChatRoomMapViewActiveTool = "Eraser";
		Game.ChatRoomMapViewEditorSetSelection(tile, "Tile", false);
		expect(Game.ChatRoomMapViewActiveTool).toBe("Brush");

		Game.ChatRoomMapViewEditorSetMode("TileType", "");
		expect(Game.ChatRoomMapViewActiveTool).toBe("");
		expect(Game.ChatRoomMapViewEditObject).toBeNull();

		Game.ChatRoomMapViewActiveTool = "Eraser";
		Game.ChatRoomMapViewEditMode = "Object";
		Game.ChatRoomMapViewEditSubMode = "Bedroom";
		Game.ChatRoomMapViewEditObject = Game.MapDataGetObject(100);
		Game.ChatRoomMapViewEditorSetMode("ObjectType", "");
		expect(Game.ChatRoomMapViewActiveTool).toBe("Eraser");
		expect(Game.ChatRoomMapViewEditObject).toBeNull();

		Game.ChatRoomMapViewEditorSetMode("", "");
		expect(Game.ChatRoomMapViewActiveTool).toBe("");

		resetEditor();
	});

	it("does not paint without an active tool", () => {
		const map = Game.MapManager.Map;
		beginPaint();
		Game.ChatRoomMapViewActiveTool = "";
		Game.ChatRoomMapViewEditMode = "Tile";
		Game.ChatRoomMapViewEditObject = Game.MapDataGetTile(100);
		map.setTile(1, 1, Game.MapDataGetTile(101), 0);
		paintAt(1, 1);
		expect(map.getTileId(1, 1)).toBe(101);

		resetEditor();
	});
});

describe("recent items", () => {
	it("keeps a single copy of a doodad", () => {
		Game.ServerSend = () => {};
		Game.Player.RecentlyUsedMapElements = [];
		const effect = Game.MapDataGetEffect(11);
		Game.ChatRoomMapViewEditorSetSelection(effect, "Effect", true);
		Game.ChatRoomMapViewEditorSetSelection(effect, "Effect", true);
		expect(Game.Player.RecentlyUsedMapElements).toEqual([effect]);

		const copy = { ...effect, Color: [...effect.Color] };
		Game.ChatRoomMapViewEditorSetSelection(copy, "Effect", true);
		expect(Game.Player.RecentlyUsedMapElements).toEqual([copy]);

		resetEditor();
	});
});

describe("editor selection", () => {
	it("marks the selected doodad after the palette is rebuilt", () => {
		Game.ElementButton = {
			Create: (_id: unknown, _onClick: unknown, _options: unknown, html: { button: { attributes: Record<string, unknown> } }) => {
				const button = document.createElement("button");
				for (const [key, value] of Object.entries(html.button.attributes) as [string, string][]) {
					if (value != null) button.setAttribute(key, value);
				}
				return button;
			},
		};
		const shadow = Game.MapDataGetEffect(11);
		const tint = Game.MapDataGetEffect(14);
		Game.ChatRoomMapViewEditObject = { ...shadow };
		const selected = Game.ChatRoomMapViewCreateMapElementItem(shadow, false, true);
		const other = Game.ChatRoomMapViewCreateMapElementItem(tint, false, true);
		expect(selected.getAttribute("aria-checked")).toBe("true");
		expect(other.getAttribute("aria-checked")).toBe("false");

		resetEditor();
	});
});
