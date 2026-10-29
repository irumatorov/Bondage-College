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
Game.load("../Scripts/DictionaryBuilder.js");
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
});

describe("MapManager", () => {
	const blankTile = Game.MapDataGetTile(Game.ChatRoomMapViewObjectStartID);
	expect(blankTile).not.toBe(null);

	const stoneWall = Game.MapDataGetTile(1030);
	expect(stoneWall).not.toBe(null);

	const roomEntry = Game.MapDataGetObject(110); // Unique
	expect(roomEntry).not.toBe(null);

	const blankObject = Game.MapDataGetObject(Game.ChatRoomMapViewObjectStartID);
	expect(blankObject).not.toBe(null);

	const table = Game.MapDataGetObject(140);
	expect(table).not.toBe(null);

	const blankEffect = Game.MapDataGetEffect(Game.ChatRoomMapViewEffectStartID);
	expect(blankEffect).not.toBe(null);

	const shadowMediumEffect = Game.MapDataGetEffect(12);
	expect(shadowMediumEffect).not.toBe(null);

	const tintBlueEffect = Game.MapDataGetEffect(15);
	expect(tintBlueEffect).not.toBe(null);

	describe("setTile", () => {
		it('should set a tile (x,y)', () => {
			expect(Game.MapManager.Map.setTile(10, 10, stoneWall)).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(stoneWall);
		});

		it('should set a tile (index)', () => {
			expect(Game.MapManager.Map.setTile(40, stoneWall)).toBe(true);
			expect(Game.MapManager.Map.getTile(40)).toEqual(stoneWall);
		});

		it('should set a tile in a range', () => {
			expect(Game.MapManager.Map.setTile(10, 10, stoneWall, 1)).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(10, 11)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(11, 10)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(11, 11)).toEqual(stoneWall);
		});

		it('should consider a negative range 0', () => {
			expect(Game.MapManager.Map.setTile(10, 10, stoneWall, -1)).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(10, 11)).toEqual(blankTile);
			expect(Game.MapManager.Map.getTile(11, 10)).toEqual(blankTile);
			expect(Game.MapManager.Map.getTile(11, 11)).toEqual(blankTile);
		});

		it('should fail to set tiles out of bound', () => {
			expect(Game.MapManager.Map.setTile(-10, -10, stoneWall)).toBe(false);
		});
	});

	describe("canSetObject", () => {
		it('should set an object (x,y)', () => {
			expect(Game.MapManager.Map.canSetObject(10, 10, table)).toBe(true);
		});

		it('should set an object (index)', () => {
			expect(Game.MapManager.Map.canSetObject(40, table)).toBe(true);
		});

		it('should fail to set objects out of bounds', () => {
			expect(Game.MapManager.Map.canSetObject(-10, -10, table)).toBe(false);
		});
	});

	describe("setObject", () => {
		it('should set an object (x,y)', () => {
			expect(Game.MapManager.Map.setObject(10, 10, table)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(table);
		});

		it('should set an object (index)', () => {
			expect(Game.MapManager.Map.setObject(40, table)).toBe(true);
			expect(Game.MapManager.Map.getObject(40)).toEqual(table);
		});

		it('should set an object in a range', () => {
			expect(Game.MapManager.Map.setObject(10, 10, table, 1)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(table);
			expect(Game.MapManager.Map.getObject(10, 11)).toEqual(table);
			expect(Game.MapManager.Map.getObject(11, 10)).toEqual(table);
			expect(Game.MapManager.Map.getObject(11, 11)).toEqual(table);
		});

		it('should consider a negative range 0', () => {
			expect(Game.MapManager.Map.setObject(10, 10, table, -1)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(table);
			expect(Game.MapManager.Map.getObject(10, 11)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 11)).toEqual(blankObject);
		});

		it('should fail to set objects out of bounds', () => {
			expect(Game.MapManager.Map.setObject(-10, -10, table)).toBe(false);
		});

		it('should keep unique objects unique', () => {
			expect(Game.MapManager.Map.setObject(10, roomEntry)).toBe(true);
			expect(Game.MapManager.Map.setObject(12, roomEntry)).toBe(true);
			expect(Game.MapManager.Map.getObject(10)).toBe(blankObject);
			expect(Game.MapManager.Map.getObject(12)).toBe(roomEntry);
		});

		it('should ignore range for unique objects', () => {
			expect(Game.MapManager.Map.setObject(10, 10, roomEntry, 1)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(roomEntry);
			expect(Game.MapManager.Map.getObject(10, 11)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 11)).toEqual(blankObject);
		});
	});

	describe("setEffects", () => {
		it('should set effects (x,y)', () => {
			expect(Game.MapManager.Map.setEffects(10, 10, [shadowMediumEffect, tintBlueEffect])).toBe(true);
			expect(Game.MapManager.Map.getEffects(10, 10)).toEqual([shadowMediumEffect, tintBlueEffect]);
		});

		it('should set effects (index)', () => {
			expect(Game.MapManager.Map.setEffects(40, [shadowMediumEffect, tintBlueEffect])).toBe(true);
			expect(Game.MapManager.Map.getEffects(40)).toEqual([shadowMediumEffect, tintBlueEffect]);
		});

		it('should fail to set effects out of bounds', () => {
			expect(Game.MapManager.Map.setEffects(-10, -10, table)).toBe(false);
		});

		it('should set effects in a range', () => {
			expect(Game.MapManager.Map.setEffects(10, 10, [shadowMediumEffect, tintBlueEffect], 1)).toBe(true);
			expect(Game.MapManager.Map.getEffects(10, 10)).toEqual([shadowMediumEffect, tintBlueEffect]);
			expect(Game.MapManager.Map.getEffects(10, 11)).toEqual([shadowMediumEffect, tintBlueEffect]);
			expect(Game.MapManager.Map.getEffects(11, 10)).toEqual([shadowMediumEffect, tintBlueEffect]);
			expect(Game.MapManager.Map.getEffects(11, 11)).toEqual([shadowMediumEffect, tintBlueEffect]);
		});

		it('should overwrite previous effects (index)', () => {
			expect(Game.MapManager.Map.setEffects(40, [shadowMediumEffect])).toBe(true);
			expect(Game.MapManager.Map.getEffects(40)).toEqual([shadowMediumEffect]);
			expect(Game.MapManager.Map.setEffects(40, [tintBlueEffect])).toBe(true);
			expect(Game.MapManager.Map.getEffects(40)).toEqual([tintBlueEffect]);
		});
	});

	describe("undo", () => {
		it("should return false if there's nothing to undo", () => {
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("should return true if there's something to undo", () => {
			expect(Game.MapManager.Map.setObject(10, 10, table)).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
		});

		it("can undo setTile", () => {
			expect(Game.MapManager.Map.setTile(10, 10, stoneWall)).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(blankTile);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setTile with a range", () => {
			expect(Game.MapManager.Map.setTile(10, 10, stoneWall, 1)).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(11, 10)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(10, 11)).toEqual(stoneWall);
			expect(Game.MapManager.Map.getTile(11, 11)).toEqual(stoneWall);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getTile(10, 10)).toEqual(blankTile);
			expect(Game.MapManager.Map.getTile(11, 10)).toEqual(blankTile);
			expect(Game.MapManager.Map.getTile(10, 11)).toEqual(blankTile);
			expect(Game.MapManager.Map.getTile(11, 11)).toEqual(blankTile);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setObject", () => {
			expect(Game.MapManager.Map.setObject(10, 10, table)).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setObject with a range", () => {
			expect(Game.MapManager.Map.setObject(10, 10, table, 1)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(table);
			expect(Game.MapManager.Map.getObject(11, 10)).toEqual(table);
			expect(Game.MapManager.Map.getObject(10, 11)).toEqual(table);
			expect(Game.MapManager.Map.getObject(11, 11)).toEqual(table);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(10, 11)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(11, 11)).toEqual(blankObject);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setObject for an unique object", () => {
			expect(Game.MapManager.Map.setObject(10, 10, table)).toBe(true);
			expect(Game.MapManager.Map.setObject(10, 10, roomEntry)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 20, roomEntry)).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(20, 20)).toEqual(blankObject);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(roomEntry);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(table);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toEqual(blankObject);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setEffect", () => {
			expect(Game.MapManager.Map.setEffects(10, 10, [shadowMediumEffect])).toBe(true);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getEffects(10, 10)).toEqual([blankEffect]);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});

		it("can undo setEffect with a range", () => {
			expect(Game.MapManager.Map.setEffects(10, 10, [shadowMediumEffect], 1)).toBe(true);
			expect(Game.MapManager.Map.getEffects(10, 10)).toEqual([shadowMediumEffect]);
			expect(Game.MapManager.Map.getEffects(11, 10)).toEqual([shadowMediumEffect]);
			expect(Game.MapManager.Map.getEffects(10, 11)).toEqual([shadowMediumEffect]);
			expect(Game.MapManager.Map.getEffects(11, 11)).toEqual([shadowMediumEffect]);
			expect(Game.MapManager.Map.undo()).toBe(true);
			expect(Game.MapManager.Map.getEffects(10, 10)).toEqual([blankEffect]);
			expect(Game.MapManager.Map.getEffects(11, 10)).toEqual([blankEffect]);
			expect(Game.MapManager.Map.getEffects(10, 11)).toEqual([blankEffect]);
			expect(Game.MapManager.Map.getEffects(11, 11)).toEqual([blankEffect]);
			expect(Game.MapManager.Map.undo()).toBe(false);
		});
	});

	describe("teleport pads", () => {
		const pad = Game.MapDataGetObject(3530);
		const colors = ["#3C8CFF", "#FF4060", "#40D080", "#FFC830", "#A050FF", "#FF60C0", "#FF8A30", "#30E0E0"];
		expect(pad?.DefaultObjectConfig).toEqual({ Type: "Teleporter", Shared: true });

		it("should give a placed pad its default config", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toEqual({ Type: "Teleporter", Shared: true, Color: colors[0] });
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).not.toBe(pad.DefaultObjectConfig);
		});

		it("should keep the color and sharing when the destination is removed", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 15, pad)).toBe(true);
			expect(Game.MapManager.Map.setTeleporterDestination(10, 10, null)).toBe(true);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toEqual({ Type: "Teleporter", Shared: true, Color: colors[0] });
		});

		it("should send nowhere until it has a pair", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.getTeleporterDestination(10, 10)).toBe(null);
			expect(Game.MapManager.Map.getTeleporterDestination(11, 10)).toBe(null);
		});

		it("should pair two pads placed in a row both ways", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 15, pad)).toBe(true);
			expect(Game.MapManager.Map.getTeleporterDestination(10, 10)).toEqual({ X: 20, Y: 15 });
			expect(Game.MapManager.Map.getTeleporterDestination(20, 15)).toEqual({ X: 10, Y: 10 });
			expect(Game.MapManager.Map.setObject(5, 5, pad)).toBe(true);
			expect(Game.MapManager.Map.getTeleporterDestination(5, 5)).toBe(null);
			expect(Game.MapManager.Map.setObject(6, 6, pad)).toBe(true);
			expect(Game.MapManager.Map.getTeleporterDestination(5, 5)).toEqual({ X: 6, Y: 6 });
		});

		it("should pair pads placed from the editor, which places a copy of the object", () => {
			expect(Game.MapManager.Map.setObject(10, 10, Game.CommonCloneDeep(pad))).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 15, Game.CommonCloneDeep(pad))).toBe(true);
			expect(Game.MapManager.Map.getTeleporterDestination(10, 10)).toEqual({ X: 20, Y: 15 });
			expect(Game.MapManager.Map.getTeleporterDestination(20, 15)).toEqual({ X: 10, Y: 10 });
		});

		it("should not pair with a pad another pad sends to", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 15, pad)).toBe(true);
			expect(Game.MapManager.Map.setTeleporterDestination(20, 15, null)).toBe(true);
			expect(Game.MapManager.Map.setObject(5, 5, pad)).toBe(true);
			expect(Game.MapManager.Map.getTeleporterDestination(5, 5)).toBe(null);
		});

		it("should keep where a pad sends to when it's placed again", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 15, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.getTeleporterDestination(10, 10)).toEqual({ X: 20, Y: 15 });
		});

		it("should forget an old destination left on a cell that wasn't a pad", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 15, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 15, table)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 15, pad)).toBe(true);
			expect(Game.MapManager.Map.getTeleporterDestination(20, 15)).toBe(null);
		});

		it("should ignore range for pads", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad, 1)).toBe(true);
			expect(Game.MapManager.Map.getObject(10, 10)).toBe(pad);
			expect(Game.MapManager.Map.getObject(11, 11)).toBe(blankObject);
		});

		it("should send one way to any floor tile", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.setTeleporterDestination(10, 10, { X: 30, Y: 2 })).toBe(true);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toEqual({ Type: "Teleporter", Shared: true, Destination: { X: 30, Y: 2 }, Color: colors[0] });
			expect(Game.MapManager.Map.getTeleporterDestination(10, 10)).toEqual({ X: 30, Y: 2 });
		});

		it("should give out a copy of where it sends to", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 15, pad)).toBe(true);
			const destination = Game.MapManager.Map.getTeleporterDestination(10, 10);
			destination.X = 0;
			expect(Game.MapManager.Map.getTeleporterDestination(10, 10)).toEqual({ X: 20, Y: 15 });
		});

		it("should allow cycles", () => {
			expect(Game.MapManager.Map.setObject(1, 1, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(2, 2, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(3, 3, pad)).toBe(true);
			expect(Game.MapManager.Map.setTeleporterDestination(1, 1, { X: 2, Y: 2 })).toBe(true);
			expect(Game.MapManager.Map.setTeleporterDestination(2, 2, { X: 3, Y: 3 })).toBe(true);
			expect(Game.MapManager.Map.setTeleporterDestination(3, 3, { X: 1, Y: 1 })).toBe(true);
			expect(Game.MapManager.Map.getTeleporterDestination(3, 3)).toEqual({ X: 1, Y: 1 });
		});

		it("should refuse to send to itself, a wall or outside the map", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.setTile(12, 12, stoneWall)).toBe(true);
			expect(Game.MapManager.Map.setTeleporterDestination(10, 10, { X: 10, Y: 10 })).toBe(false);
			expect(Game.MapManager.Map.setTeleporterDestination(10, 10, { X: 12, Y: 12 })).toBe(false);
			expect(Game.MapManager.Map.setTeleporterDestination(10, 10, { X: -1, Y: 3 })).toBe(false);
			expect(Game.MapManager.Map.setTeleporterDestination(10, 10, { X: 3, Y: 40 })).toBe(false);
			expect(Game.MapManager.Map.getTeleporterDestination(10, 10)).toBe(null);
		});

		it("should give each new pair its own color", () => {
			expect(Game.MapManager.Map.setObject(1, 1, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(2, 2, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(3, 3, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(4, 4, pad)).toBe(true);
			expect(Game.MapManager.Map.getTeleporterColor(1, 1)).toBe(colors[0]);
			expect(Game.MapManager.Map.getTeleporterColor(2, 2)).toBe(colors[0]);
			expect(Game.MapManager.Map.getTeleporterColor(3, 3)).toBe(colors[1]);
			expect(Game.MapManager.Map.getTeleporterColor(4, 4)).toBe(colors[1]);
		});

		it("should change a pad's color but keep where it sends to", () => {
			expect(Game.MapManager.Map.setObject(1, 1, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(2, 2, pad)).toBe(true);
			expect(Game.MapManager.Map.setTeleporterColor(1, 1, colors[4])).toBe(true);
			expect(Game.MapManager.Map.getTeleporterColor(1, 1)).toBe(colors[4]);
			expect(Game.MapManager.Map.getTeleporterDestination(1, 1)).toEqual({ X: 2, Y: 2 });
			expect(Game.MapManager.Map.setTeleporterDestination(1, 1, null)).toBe(true);
			expect(Game.MapManager.Map.getTeleporterColor(1, 1)).toBe(colors[4]);
		});

		it("should take any color, but only a color", () => {
			expect(Game.MapManager.Map.setObject(1, 1, pad)).toBe(true);
			expect(Game.MapManager.Map.setTeleporterColor(1, 1, "#123456")).toBe(true);
			expect(Game.MapManager.Map.setTeleporterColor(1, 1, "Default")).toBe(false);
			expect(Game.MapManager.Map.getTeleporterColor(1, 1)).toBe("#123456");
		});

		it("should keep pads paired and colored when the map is saved and loaded", () => {
			expect(Game.MapManager.Map.setObject(10, 10, pad)).toBe(true);
			expect(Game.MapManager.Map.setObject(20, 15, pad)).toBe(true);
			expect(Game.MapManager.Map.setTeleporterColor(10, 10, "#12345680")).toBe(true);
			expect(Game.MapManager.Map.updateGlobalMapData()).toBe(true);
			Game.MapManager.Map.loadGlobalMapData(Game.ChatRoomData.MapData);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toEqual({ Type: "Teleporter", Shared: true, Color: "#12345680", Destination: { X: 20, Y: 15 } });
			expect(Game.MapManager.Map.getTeleporterDestination(20, 15)).toEqual({ X: 10, Y: 10 });
		});

		it("should not set a destination on something that isn't a pad", () => {
			expect(Game.MapManager.Map.setObject(10, 10, table)).toBe(true);
			expect(Game.MapManager.Map.setTeleporterDestination(10, 10, { X: 3, Y: 3 })).toBe(false);
			expect(Game.MapManager.Map.getObjectConfig(10, 10)).toBeUndefined();
		});
	});
});

describe("with a test map", () => {
	// Shamelessly lifted from Velvet District.
	// Rows are Y. Each cell is [tileId, objectId, effectIds] at that X.
	const mapData = "N4IgKgngDgpiBcICCAbA7gQwgZxAGnAEsUZdEAJyq68gL4GvGnmWnbAWkHcCfgTzn8wAggQ4SIatxzBhECtIM2kRBAO2WKBAEI0CxtHbr07JgLBAIAGrWM1Jheo1qbd7QHXnAJZfk3gEEBHYxlLO2VoK2drZafp6AMiDRjuSOLo6AGIC+9BzsgM0ggI0gjIANIIBNIDnBYaJ+8YkJHonOKbTk7KYaVtYqLaraNHFUNXUNlhDWIoPagHCAVTRuNZyZ6YwF6UVhyuGp8c4eLoBb4BOS9b1NCxoqy7Rl7o4btBs+O/0B+/aaS9pVa/FbLpP1vF8Hdk9+CTWblc3V4jF4gkGJVS+lhklhCMRfmwKNRaJqiMxBjYaNx2BqAi4ROJAjomMk2BceKpBIAJvSGaTBNIWazlsjUTp0ZIBAzAEIgAqZAgAHqKxezUpyNhdOTzbHyAAUKgTDQRi8U1FGXaUy/FyjSK5WUASAEhB1SaJbQtTrdQTbFwFYAF8CF6tFlqlur1bAEAuJXBdrsUms5Vtl3qdXDCqpFgc1VNxNJ5SsjmmNAiOQmDeK1SYVKbsZKRONRym53uJjOGElYofjKPjdIZ9JV1ZYoezXr8UKEhaLWL0fixgEvgIc9gQjzNdwB0IFP2DOZ3Op8csfTVEpaW0u8p6IpDjvN/RCZEuNET/7KM3BIztOnFPvt/9D8N6eRVbTBORGVfmzflIAwECnJg/0fJkXxfUlFHfUl0x/LdFD/fp+mAg8jy4BkiRVccPyECdf3giAgMA5ZeQvF9hggy8SNpY4BHoKcEMQhjiPpN8qFJL9eVg1IBCQxCICYsQBEiekz0vT9qO/A9aB4iB53nfpmLAytyEg6DIKkmS+L44iL1Y8jITHaFpO7aETJ7DpqHaCzLMYCzVUofAQAAeQAIwAKxgABjAAXMgQCbALAqC4L6UAJORaUAP+hADOYQBzmEAU5haXC2lADIYQAh+EABhhAAPoWlspCvKGUANAhAB3wQA05EAIMAAHTaUASMASqK+lAEvwWlADGgZraQrWlAE6QTr8q67qetShlAADAQBAwF6ziGUAB/Bpum2kZsmwKCsAR/AlqbFaGQAII2gA02ldsAH+AAsAD/BABAYCKTsAIAh6QuwBn8EAX/BgsAIehADGYAAq17nsAXphnuCwAW+CCwAuIDugH6SO2kbqCwACCFpQAfQACpraQRpsACKQsANkB8uhwAT8CbCrABOgelAACYQA6+E+wA+mE+4Kwd6hlYs+97voZQBgwAZQA18FpQxDCCq7aUAKggMdpHmAsAP0BAH9AAXaQAGLKhkKu2qqQohpsNhChWm0AX0B6XxvG8bVgK7tuhkMaFptAGAYWkcdSwacfpQA9QAqh3bdpEGaeC3n6RK96SoihlAGmYc36UALORABH4QP6W6uaZsjqP+p6wLAFIIALIehkL3aC93Y7ytOGWz13gsAPvgXtpdL0rzhlAGgIek0YFyvAabQBQwCbVLACvoWlABnoWlACaYMvgoqyWqsAavhAtt3QnZC1baQnkKWfpQAnQCCwAooFpFOe5CzxAp1nXCdXwKADK0d32laACqqF6XwABQDyiep6CtvAAWYelHo7hlJa1+kCp3ptj6N3HaT7vWAq12rvSWuIVAALQGApsvsIoFVgbSYOn8abJyCpnJsihsD5QHs9TKgAQwFpM+VeoDaREICpfBkLs868xXgySGud6Rk19k2BBvUI401YSFU2+dACMMAyTheUyZWzJqvaG38LYA0AG5AfMmzz0AHfgDIF5yPnk2CKptHr5wivnU2uVD6u13nI+kCidHBRtgyQAAUABTRoAGyAl7BUAO3wsCP5BRNIFP8DJnE0OChLUWYsq6BWej7WkeNTYBIDmbAKdC/70lsfohkjckb43pCYmhjcAoyNsTTFJtI8GRNpJY9x9Jd6WLyjLWkCoDEBQCZlfxTZJGBVqU2GxcUradyEYFJJddAoRJCvHQAKUCADygWkJoikMksQAHfpNA/ODIpmRUCowwAychW3mbSRhAVGHm0GrSAOWNE6ILLiAAAvkAA===@EgCpABoDQAYyaRIGYQHHIQICPGEiBmIAxiEdQj1ncwZnDtchHTI9Z3MGYA4nICUC/kXnX0I9ERXRDkQFtUNTAeUQVwg4BILAPKMEChkVUQ5GBZVDUgHtEFcIOAQVwhwZEjRRAzgGExAMUQAA";
	const cells: [tileId: number, objectId: number, effectIds: number[]][][] = [
		[[200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1204, 100, [11]], [1204, 5010, [11]], [1010, 100, [11]], [1204, 3070, []], [1204, 3302, []], [1204, 3303, []], [1204, 3301, []], [1010, 100, [11]], [1204, 5010, [11]]],
		[[200, 100, [11]], [1040, 100, []], [1040, 3110, []], [1040, 4034, []], [1040, 3120, []], [1040, 3040, []], [1040, 100, []], [1040, 3040, []], [1040, 100, []], [1040, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [235, 2070, [11]], [121, 2012, [11]], [1205, 5014, [11]], [235, 386, []], [235, 151, []], [235, 100, []], [235, 393, []], [1205, 5014, [11]], [121, 2012, [11]]],
		[[200, 100, [11]], [1040, 100, []], [110, 2025, []], [110, 100, []], [110, 710, []], [110, 710, []], [1040, 100, []], [132, 1010, []], [132, 1010, []], [132, 1010, []], [1040, 100, []], [250, 100, []], [235, 1209, []], [235, 1209, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [235, 1209, []], [235, 1209, []], [235, 1209, []], [235, 1209, []], [250, 100, []], [1050, 4034, [11]], [121, 100, [11]], [172, 100, [11]], [132, 100, [11]], [235, 384, []], [235, 385, []], [132, 100, [11]], [172, 100, [11]], [121, 100, [11]]],
		[[200, 100, [11]], [1040, 100, []], [132, 100, []], [132, 100, []], [132, 100, []], [132, 100, []], [1040, 100, []], [132, 100, []], [132, 100, []], [132, 1040, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [215, 2032, []], [215, 2032, []], [215, 2032, []], [210, 2032, []], [210, 2032, []], [200, 100, []], [210, 2032, []], [210, 2032, []], [260, 2032, []], [215, 2032, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [235, 2070, [11]], [121, 2033, [11]], [172, 2033, [11]], [132, 100, [11]], [132, 100, [11]], [132, 100, [11]], [132, 100, [11]], [172, 2033, [11]], [121, 2033, [11]]],
		[[200, 100, [11]], [1040, 100, []], [132, 100, []], [132, 130, []], [132, 130, []], [132, 150, []], [1040, 100, []], [132, 150, []], [132, 100, []], [132, 1020, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [260, 2040, []], [1100, 3076, []], [1100, 3070, []], [1100, 3076, []], [215, 2050, []], [200, 100, []], [215, 100, []], [210, 2050, []], [215, 2035, []], [280, 2045, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1204, 100, []], [1204, 100, [11]], [1203, 3010, [11]], [1201, 3270, [11]], [235, 170, [11]], [235, 170, [11]], [1200, 3270, [11]], [1202, 3261, [11]], [1200, 3270, [11]]],
		[[200, 100, [11]], [1040, 100, []], [132, 100, []], [132, 100, []], [132, 100, []], [132, 100, []], [1040, 100, []], [1040, 100, []], [1040, 4020, []], [1040, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [215, 100, []], [210, 570, []], [280, 2045, []], [210, 570, []], [215, 100, []], [200, 100, []], [210, 2040, []], [280, 100, []], [215, 2035, []], [215, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [200, 2080, []], [1204, 100, [11]], [121, 380, [11]], [172, 100, [11]], [132, 100, [11]], [132, 100, [11]], [172, 100, [11]], [121, 100, [11]], [121, 2025, [11]]],
		[[200, 100, [11]], [1040, 100, []], [110, 2025, []], [110, 100, []], [110, 100, []], [110, 100, []], [110, 100, []], [110, 100, []], [110, 100, []], [110, 162, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [200, 310, []], [200, 100, []], [215, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [200, 2080, []], [1204, 100, [11]], [121, 2020, [11]], [172, 100, [11]], [132, 100, [11]], [132, 100, [11]], [172, 100, [11]], [121, 151, [11]], [121, 740, [11]]],
		[[200, 100, [11]], [1040, 100, []], [1040, 3200, []], [1040, 4014, []], [1040, 3261, []], [1040, 3262, []], [1040, 3261, []], [1040, 100, []], [1040, 100, []], [1040, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [270, 2040, []], [280, 100, []], [215, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [210, 100, []], [210, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1204, 100, []], [1204, 3302, [11]], [1201, 3303, [11]], [1203, 3261, [11]], [235, 170, [11]], [235, 170, [11]], [1202, 3261, [11]], [1200, 3270, [11]], [1203, 100, [11]]],
		[[200, 100, [11]], [1040, 100, []], [132, 387, []], [132, 100, []], [132, 100, []], [132, 100, []], [132, 2006, []], [1040, 100, []], [110, 1050, []], [110, 1050, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [215, 100, []], [210, 100, []], [215, 2050, []], [215, 100, []], [200, 100, []], [210, 2090, []], [210, 310, []], [2010, 100, []], [210, 100, []], [210, 2050, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1204, 100, []], [121, 382, [11]], [121, 383, [11]], [172, 310, [11]], [132, 100, [11]], [132, 100, [11]], [172, 100, [11]], [121, 140, [11]], [121, 386, [11]]],
		[[200, 100, [11]], [1040, 100, []], [132, 100, []], [132, 151, []], [132, 150, []], [132, 151, []], [132, 100, []], [110, 100, []], [110, 100, []], [110, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [215, 100, []], [210, 2035, []], [280, 100, []], [210, 100, []], [200, 100, []], [215, 100, []], [2010, 100, []], [250, 2010, []], [2010, 100, []], [215, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1204, 100, []], [121, 151, [11]], [121, 100, [11]], [172, 100, [11]], [132, 100, [11]], [132, 100, [11]], [172, 100, [11]], [121, 100, [11]], [121, 381, [11]]],
		[[200, 100, [11]], [1040, 100, []], [132, 151, []], [132, 740, []], [132, 740, []], [132, 740, []], [132, 151, []], [1040, 100, []], [110, 100, []], [110, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [280, 2045, []], [215, 2050, []], [215, 2035, []], [215, 100, []], [200, 100, []], [215, 100, []], [210, 310, []], [2010, 100, []], [210, 2050, []], [210, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1204, 3075, []], [1204, 100, [11]], [121, 2020, [11]], [1204, 100, []], [1204, 4034, []], [1204, 4034, []], [1204, 100, []], [121, 2020, [11]], [1204, 100, [11]]],
		[[200, 100, [11]], [1040, 100, []], [132, 350, []], [132, 151, []], [132, 151, []], [132, 151, []], [132, 350, []], [1040, 100, []], [110, 570, []], [110, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [210, 100, []], [215, 100, []], [215, 100, []], [215, 100, []], [200, 100, []], [210, 100, []], [210, 100, []], [215, 100, []], [215, 100, []], [210, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [200, 2090, []], [1204, 100, []], [1204, 100, []], [1204, 5014, []], [235, 170, []], [235, 170, []], [1204, 5014, []], [1204, 3070, []], [1204, 100, []]],
		[[200, 100, [11]], [1040, 100, []], [1040, 3275, []], [1040, 3075, []], [1040, 100, []], [1040, 100, []], [1040, 100, []], [1040, 5018, []], [1040, 4036, []], [1040, 5018, []], [1040, 100, []], [250, 100, []], [235, 1209, []], [235, 1209, []], [250, 100, []], [250, 2032, []], [250, 2032, []], [250, 2032, []], [250, 2032, []], [250, 100, []], [250, 2032, []], [250, 2032, []], [250, 2032, []], [250, 2032, []], [250, 2032, []], [250, 100, []], [235, 1209, []], [235, 1209, []], [235, 1209, []], [235, 1209, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 2085, []], [250, 100, []], [250, 100, []]],
		[[250, 100, []], [250, 100, []], [250, 100, []], [250, 2080, []], [250, 2080, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 2090, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 2090, []], [250, 100, []], [235, 1209, []], [235, 1209, []], [235, 1209, []], [235, 1209, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []]],
		[[250, 2090, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 2090, []], [250, 100, []], [250, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [1010, 4030, []], [1010, 3010, []], [1010, 3270, []], [1010, 100, []], [1010, 3120, []], [1010, 3120, []], [1040, 100, []], [200, 100, []]],
		[[250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [210, 2059, []], [115, 100, []], [115, 100, []], [115, 310, []], [115, 310, []], [115, 100, []], [115, 100, []], [210, 2059, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [100, 570, []], [100, 100, []], [100, 100, []], [100, 100, []], [100, 100, []], [100, 389, []], [1040, 100, []], [200, 100, []]],
		[[200, 100, []], [1040, 100, []], [1205, 4034, []], [1205, 3050, []], [1205, 100, []], [1205, 3020, []], [1205, 100, []], [1205, 3250, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [100, 151, []], [100, 140, []], [100, 151, []], [1090, 100, []], [1090, 4011, []], [1090, 100, []], [1040, 100, []], [200, 100, []]],
		[[200, 100, []], [1040, 100, []], [120, 100, []], [120, 350, []], [120, 250, []], [120, 250, []], [120, 250, []], [120, 350, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 2033, []], [2010, 100, []], [2010, 100, []], [250, 2033, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [132, 100, []], [132, 387, []], [132, 100, []], [1090, 100, []], [160, 100, []], [160, 370, []], [1040, 100, []], [270, 100, []]],
		[[200, 100, []], [1040, 100, []], [120, 100, []], [120, 100, []], [120, 100, []], [120, 650, []], [120, 100, []], [120, 2080, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [2010, 100, []], [2010, 100, []], [2010, 100, []], [2010, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [132, 100, []], [132, 100, []], [132, 100, []], [1090, 100, []], [160, 260, []], [160, 100, []], [1040, 100, []], [200, 100, []]],
		[[200, 100, []], [1040, 100, []], [1060, 100, []], [120, 740, []], [120, 740, []], [120, 740, []], [120, 740, []], [1060, 3200, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [2010, 100, []], [2010, 100, []], [2010, 100, []], [2010, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [132, 166, []], [132, 310, []], [132, 166, []], [1010, 100, []], [160, 250, []], [2000, 100, []], [1040, 100, []], [200, 100, []]],
		[[200, 100, []], [1040, 100, []], [120, 151, []], [120, 100, []], [120, 650, []], [120, 650, []], [120, 100, []], [120, 320, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 2033, []], [2010, 100, []], [2010, 100, []], [250, 2033, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [1090, 3020, []], [1090, 3280, []], [1010, 100, []], [1010, 100, []], [1010, 3010, []], [1010, 3020, []], [1040, 100, []], [200, 100, []]],
		[[200, 100, []], [1040, 100, []], [120, 140, []], [120, 100, []], [120, 100, []], [120, 151, []], [120, 100, []], [120, 100, []], [110, 2070, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [160, 250, []], [2000, 100, []], [1010, 100, []], [132, 100, []], [132, 100, []], [132, 310, []], [1040, 100, []], [270, 100, []]],
		[[200, 100, []], [1040, 100, []], [120, 151, []], [120, 100, []], [120, 151, []], [120, 140, []], [120, 151, []], [120, 100, []], [110, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [210, 2059, []], [115, 100, []], [115, 100, []], [115, 310, []], [115, 310, []], [115, 100, []], [115, 100, []], [210, 2059, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [160, 100, []], [160, 100, []], [1010, 100, []], [132, 720, []], [132, 720, []], [132, 100, []], [1040, 100, []], [200, 100, []]],
		[[200, 100, []], [1040, 3275, []], [1040, 3070, []], [110, 2070, []], [110, 2070, []], [110, 2070, []], [1040, 100, []], [1040, 4036, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [160, 100, []], [160, 100, []], [1010, 100, []], [132, 100, []], [132, 100, []], [132, 100, []], [1040, 100, []], [200, 100, []]],
		[[250, 100, []], [250, 2080, []], [250, 2080, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [235, 1209, []], [235, 1209, []], [235, 1209, []], [235, 1209, []], [250, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [110, 110, []], [110, 115, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [1010, 4011, []], [1010, 3270, []], [1010, 3040, []], [100, 388, []], [100, 100, []], [100, 270, []], [1040, 100, []], [270, 100, []]],
		[[235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 100, []], [115, 100, []], [210, 2059, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [210, 2059, []], [115, 100, []], [115, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [100, 320, []], [100, 100, []], [100, 100, []], [100, 100, []], [100, 100, []], [100, 570, []], [1040, 100, []], [270, 100, []]],
		[[235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [115, 2090, []], [115, 2080, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 100, []], [115, 2080, []], [115, 2090, []], [250, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 3262, []], [1040, 3275, []], [1040, 100, []], [1040, 100, []], [1040, 100, []], [1040, 100, []], [1040, 4036, []], [1040, 100, []], [200, 100, []]],
		[[250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [235, 1209, []], [235, 1209, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [235, 1209, []], [235, 1209, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []]],
		[[1001, 3075, [12]], [1001, 4030, [12]], [1040, 3121, [12]], [1040, 100, []], [200, 100, [11]], [1040, 100, [12]], [1001, 3075, [12]], [1001, 4030, [12]], [1040, 100, [12]], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [1070, 100, []], [1070, 100, []], [1204, 100, []], [1070, 3262, []], [1070, 4034, []], [1070, 4034, []], [1070, 3262, []], [1204, 100, []], [1070, 100, []], [1070, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []], [250, 100, []]],
		[[100, 2080, [12]], [100, 100, [12]], [110, 250, [12]], [1040, 100, []], [200, 100, [11]], [1040, 100, [12]], [110, 2020, [12]], [100, 570, [12]], [110, 630, [12]], [1040, 100, []], [250, 2090, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [110, 370, []], [110, 100, []], [235, 2030, []], [110, 100, []], [132, 100, []], [132, 100, []], [110, 650, []], [235, 2030, []], [110, 100, []], [110, 370, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [1040, 100, []], [1010, 3070, []], [1100, 3075, []], [1010, 3010, []], [1100, 4030, []], [1100, 3070, []], [1010, 4030, []], [1100, 3075, []], [1010, 3040, []], [1040, 100, []], [200, 100, []]],
		[[200, 166, [12]], [100, 100, [12]], [100, 100, [12]], [1040, 100, []], [200, 100, [11]], [1040, 100, [12]], [100, 100, [12]], [100, 100, [12]], [100, 100, [12]], [1040, 100, [12]], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [110, 100, []], [110, 166, []], [235, 2030, []], [110, 100, []], [110, 100, []], [110, 100, []], [110, 650, []], [235, 2030, []], [110, 166, []], [110, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [1040, 100, []], [270, 100, []], [100, 100, []], [100, 100, []], [200, 100, []], [270, 2020, []], [200, 100, []], [100, 100, []], [200, 100, []], [1040, 100, []], [200, 100, []]],
		[[100, 640, [12]], [100, 100, [12]], [100, 100, [12]], [1040, 100, []], [200, 100, [11]], [1040, 100, [12]], [100, 310, [12]], [100, 620, [12]], [100, 650, [12]], [1040, 100, [12]], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [110, 100, []], [110, 100, []], [1030, 100, []], [1070, 4023, []], [235, 2070, []], [235, 2070, []], [235, 2070, []], [1030, 100, []], [110, 100, []], [110, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [1040, 100, []], [200, 1060, []], [200, 100, []], [100, 100, []], [100, 100, []], [200, 100, []], [100, 100, []], [100, 100, []], [200, 1030, []], [1040, 100, []], [200, 100, []]],
		[[110, 100, [12]], [100, 1060, [12]], [200, 100, [11]], [1040, 100, []], [200, 100, [11]], [1040, 100, [12]], [110, 2080, [12]], [100, 100, [12]], [100, 100, [12]], [1040, 100, [12]], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [110, 310, []], [110, 100, []], [1030, 100, []], [121, 100, []], [121, 383, []], [121, 382, []], [121, 383, []], [1030, 100, []], [110, 100, []], [110, 310, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [1040, 100, []], [1010, 100, []], [1100, 3270, []], [1010, 3070, []], [100, 100, []], [100, 100, []], [100, 740, []], [1010, 3075, []], [1010, 3070, []], [1040, 100, []], [270, 100, []]],
		[[1040, 3075, [12]], [1001, 100, [12]], [200, 100, [11]], [1040, 100, []], [200, 100, [11]], [1040, 100, [12]], [1040, 100, [12]], [1001, 3075, [12]], [1001, 100, [12]], [1040, 100, [12]], [250, 100, []], [235, 100, []], [235, 100, []], [250, 2090, []], [1040, 100, []], [110, 100, []], [110, 100, []], [1030, 100, []], [121, 100, []], [235, 100, []], [235, 151, []], [235, 100, []], [1030, 100, []], [1070, 4023, []], [235, 2030, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [1040, 100, []], [100, 389, []], [200, 100, []], [200, 2025, []], [100, 100, []], [100, 100, []], [100, 100, []], [200, 151, []], [270, 740, []], [1040, 100, []], [200, 100, []]],
		[[110, 2020, [12]], [100, 100, [12]], [100, 100, [12]], [1040, 100, []], [200, 100, [11]], [1040, 100, [12]], [100, 100, [12]], [200, 2080, [12]], [100, 389, [12]], [1040, 100, [12]], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [235, 2030, []], [1070, 4023, []], [1030, 100, []], [121, 100, []], [121, 100, []], [121, 100, []], [121, 100, []], [1030, 100, []], [121, 100, []], [121, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [1040, 100, []], [100, 389, []], [100, 100, []], [270, 100, []], [200, 100, []], [100, 388, []], [200, 100, []], [200, 100, []], [200, 151, []], [1040, 100, []], [200, 100, []]],
		[[100, 620, [12]], [100, 1060, [12]], [100, 100, [12]], [1040, 100, []], [200, 100, [11]], [1040, 100, [12]], [100, 166, [12]], [100, 620, [12]], [100, 100, [12]], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [121, 100, []], [121, 100, []], [1030, 100, []], [121, 386, []], [121, 100, []], [121, 100, []], [121, 160, []], [1030, 100, []], [121, 100, []], [121, 650, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [1040, 100, []], [1100, 3070, []], [100, 100, []], [100, 100, []], [1010, 3040, []], [1100, 3270, []], [1010, 3070, []], [100, 100, []], [100, 100, []], [1040, 100, []], [200, 100, []]],
		[[200, 630, [12]], [100, 100, [12]], [100, 100, [12]], [1040, 100, []], [200, 100, [11]], [1040, 100, [12]], [100, 100, [12]], [100, 100, [12]], [110, 630, [12]], [1040, 100, [12]], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [121, 650, []], [121, 100, []], [1070, 100, []], [1070, 3301, []], [1070, 4034, []], [1070, 4034, []], [1070, 3250, []], [1070, 3262, []], [121, 100, []], [121, 100, []], [1040, 100, []], [250, 100, []], [235, 100, []], [235, 100, []], [1040, 100, []], [100, 2020, []], [100, 100, []], [100, 100, []], [200, 100, []], [100, 100, []], [100, 100, []], [100, 100, []], [100, 100, []], [1040, 100, []], [270, 100, []]],
		[[200, 100, [12]], [110, 100, [12]], [100, 570, [12]], [1040, 100, []], [200, 100, [11]], [1040, 100, [12]], [110, 100, [12]], [100, 100, [12]], [110, 100, [12]], [1040, 100, [12]], [250, 2090, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, []], [121, 100, []], [121, 100, []], [121, 100, []], [121, 100, []], [121, 100, []], [121, 100, []], [121, 100, []], [121, 100, []], [121, 100, []], [121, 100, []], [1040, 100, []], [250, 2085, []], [235, 660, []], [235, 670, []], [1040, 100, []], [200, 1060, []], [200, 620, []], [100, 100, []], [270, 100, []], [200, 100, []], [100, 100, []], [200, 620, []], [270, 220, []], [1040, 100, []], [200, 100, []]],
		[[1040, 3275, [11]], [1040, 3070, [11]], [1040, 4030, [11]], [1040, 100, [11]], [200, 100, [11]], [1040, 100, [11]], [1040, 4030, [11]], [1040, 100, [11]], [1040, 100, [11]], [1040, 3070, [11]], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [1040, 100, [11]], [1040, 100, [11]], [1040, 3275, [11]], [1040, 100, [11]], [1040, 5011, [11]], [1040, 4034, [11]], [1040, 4034, [11]], [1040, 5011, [11]], [1040, 100, [11]], [1040, 3275, [11]], [1040, 100, [11]], [1040, 100, [11]], [250, 100, []], [235, 100, []], [235, 100, []], [1040, 100, []], [1040, 3275, []], [1040, 100, []], [1040, 3075, []], [1040, 100, []], [1040, 4034, []], [1040, 100, []], [1040, 100, []], [1040, 3075, []], [1040, 100, []], [200, 100, []]],
		[[200, 2020, [11]], [200, 2085, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [250, 100, []], [235, 100, []], [235, 100, []], [250, 100, []], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [200, 100, [11]], [250, 100, []], [235, 100, []], [235, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [200, 100, []], [270, 100, []], [200, 100, []], [200, 100, []], [200, 100, []]],
	];

	beforeEach(() => {
		Game.ChatRoomData = {};
		Game.ChatRoomData.MapData = Game.ChatRoomMapViewInitialize("Always");
		expect(Game.MapManager.Map.importString(mapData)).toBe(true);
	});

	it("loads every cell", () => {
		for (let y = 0; y < cells.length; y++) {
			for (let x = 0; x < cells[y].length; x++) {
				const [tile, object, effects] = cells[y][x];
				expect({
					tile: Game.MapManager.Map.getTileId(x, y),
					object: Game.MapManager.Map.getObjectId(x, y),
					effects: Game.MapManager.Map.getEffects(x, y).map((effect: ChatRoomMapEffect) => effect.ID),
				}, `(${x}, ${y})`).toEqual({ tile, object, effects });
			}
		}
	});
});

describe("deprecated objects", () => {
	it("replaces a deprecated object with another on load", () => {
		const passable = Game.MapDataGetObject(100);
		expect(passable.Type).toBe("EmptySpace");
		expect(passable.Style).toBe("Passable");

		const impassable = Game.MapDataGetObject(101);
		expect(impassable.ID).toBe(101);
		expect(impassable.Type).toBe("EmptySpace");
		expect(impassable.Style).toBe("Impassable");
		expect(impassable.CanEnter?.("")).toBe(false);

		for (const deprecatedId of [211, 249, 342, 400, 200, 500, 600, 700, 800, 1000, 1100, 1200, 1300, 1399, 2000, 3000, 3281, 3499, 4000, 4500, 5000]) {
			expect(Game.MapDataGetObject(deprecatedId)).toBe(passable);
		}

		const length = Game.ChatRoomMapViewWidth * Game.ChatRoomMapViewHeight;
		const objects = Array.from({ length }, () => String.fromCharCode(100));
		objects[3] = String.fromCharCode(2000);
		objects[4] = String.fromCharCode(101);
		if (!Game.ChatRoomData?.MapData) throw new Error("No map");
		Game.ChatRoomData.MapData.Objects = objects.join("");
		expect(Game.MapManager.Map.loadGlobalMapData(Game.ChatRoomData.MapData)).toBe(true);
		expect(Game.MapManager.Map.getObjectId(3)).toBe(100);
		expect(Game.MapManager.Map.getObject(3)).toBe(passable);
		expect(Game.MapManager.Map.getObjectId(4)).toBe(101);
	});
});

describe("tether points", () => {
	const lampPost = Game.MapDataGetObject(2090);
	const pole = Game.MapDataGetObject(1090);
	const table = Game.MapDataGetObject(140);
	const emptySpace = Game.MapDataGetObject(2000);

	beforeEach(() => {
		Game.ChatRoomData.Admin = [];
		Game.ChatRoomCharacter = [];
		Game.Player.MapData = { Pos: { X: 5, Y: 6 }, PrivateState: {} };
		Object.assign(Game.Player, {
			GetBlindLevel: () => 0,
			GetDeafLevel: () => 0,
			GetSlowLevel: () => 0,
			IsEnclose: () => false,
			IsSuspended: () => false,
			IsMounted: () => false,
			IsPlugged: () => false,
			HasEffect: () => false,
			CanWalk: () => true,
			CanKneel: () => true,
		});
	});

	afterEach(() => {
		Game.Player.MapData = null;
	});

	it("can be made from floor obstacles and poles", () => {
		expect(lampPost.CanBeTetherPoint).toBe(true);
		expect(pole.CanBeTetherPoint).toBe(true);
		expect(table.CanBeTetherPoint).toBeFalsy();
		expect(emptySpace.CanBeTetherPoint).toBeFalsy();
	});

	it("keeps tether configs only on objects that can be tether points", () => {
		Game.MapManager.Map.setObject(5, 5, lampPost);
		Game.MapManager.Map.setObject(6, 5, table);
		Game.MapManager.Map.setObjectConfig(5, 5, { Type: "Tether" });
		Game.MapManager.Map.setObjectConfig(6, 5, { Type: "Tether" });
		Game.MapManager.Map.setObjectConfig(7, 5, { Type: "Tether" });
		Game.MapManager.Map.validateMap();
		expect(Game.MapManager.Map.getObjectConfig(5, 5)).toEqual({ Type: "Tether" });
		expect(Game.MapManager.Map.getObjectConfig(6, 5)).toBeUndefined();
		expect(Game.MapManager.Map.getObjectConfig(7, 5)).toBeUndefined();
	});

	it("sanitizes tether configs when loading a map", () => {
		Game.ChatRoomData.MapData.CellData = { 1: { Type: "Tether", Text: "extra" }, 2: { Type: "Unknown" } };
		Game.MapManager.Map.loadGlobalMapData(Game.ChatRoomData.MapData);
		expect(Game.MapManager.Map.getObjectConfig(1)).toEqual({ Type: "Tether" });
		expect(Game.MapManager.Map.getObjectConfig(2)).toBeUndefined();
	});

	it("offers to tie a character only within reach of both her and the player", () => {
		Game.MapManager.Map.setObject(5, 5, lampPost);
		Game.MapManager.Map.setObject(6, 5, pole);
		Game.MapManager.Map.setObjectConfig(5, 5, { Type: "Tether" });
		Game.MapManager.Map.setObjectConfig(6, 5, { Type: "Tether" });
		const realCanBeLeashedBy = Game.ChatRoomCanBeLeashedBy;
		Game.ChatRoomCanBeLeashedBy = () => true;
		Game.ServerChatRoomGetAllowItem = () => true;
		Game.Player.CanInteract = () => true;
		Game.Player.IsPlayer = () => true;
		const near = { MapData: { Pos: { X: 4, Y: 6 } }, IsPlayer: () => false, AllowedInteractions: 0, OnlineSharedSettings: {} };
		expect(Game.ChatRoomMapViewCanTetherTie(near, { X: 5, Y: 5 })).toBe(true);
		expect(Game.ChatRoomMapViewCanTetherTie(near, { X: 6, Y: 5 })).toBe(false);
		expect(Game.ChatRoomMapViewCanTetherTie(Game.Player, { X: 6, Y: 5 })).toBe(true);
		Game.MapManager.Map.setObjectConfig(5, 5, undefined);
		expect(Game.ChatRoomMapViewCanTetherTie(near, { X: 5, Y: 5 })).toBe(false);
		Game.ChatRoomCanBeLeashedBy = realCanBeLeashedBy;
	});

	it("pulls the player back within leash range", () => {
		Game.Player.MapData.Pos = { X: 9, Y: 5 };
		Game.ChatRoomMapViewPullWithinLeashRange({ X: 5, Y: 5 });
		expect(Game.Player.MapData.Pos).toEqual({ X: 7, Y: 5 });
		Game.ChatRoomMapViewPullWithinLeashRange({ X: 5, Y: 5 });
		expect(Game.Player.MapData.Pos).toEqual({ X: 7, Y: 5 });
	});

	it("ignores a tie request while the leash is already tied", () => {
		const tether = { Position: { X: 5, Y: 5 }, MemberNumber: 2 };
		Game.Player.MapData.Tether = tether;
		const sender = { MemberNumber: 3, MapData: { Pos: { X: 6, Y: 6 } } };
		const data = { Dictionary: [{ Tag: "MapViewTether", Tether: { Position: { X: 5, Y: 5 }, MemberNumber: 3 } }] };
		Game.ChatRoomMapViewTetherHiddenMessage(sender, data);
		expect(Game.Player.MapData.Tether).toBe(tether);
	});

	describe("holding the player", () => {
		const realCanBeLeashedBy = Game.ChatRoomCanBeLeashedBy;
		const member = (MemberNumber: number) => ({ MemberNumber, IsPlayer: () => false });

		beforeEach(() => {
			Game.ChatRoomCanBeLeashedBy = () => true;
			Game.Player.IsPlayer = () => true;
			Game.Player.MemberNumber = 1;
			Game.Player.MapData.Tether = { Position: { X: 5, Y: 5 }, MemberNumber: 2 };
			Game.MapManager.Map.setObject(5, 5, lampPost);
			Game.MapManager.Map.setObjectConfig(5, 5, { Type: "Tether" });
			Game.MapManager.Map.updateGlobalMapData();
		});

		afterEach(() => {
			Game.ChatRoomCanBeLeashedBy = realCanBeLeashedBy;
		});

		it("holds her only while whoever tied her or a room admin is in the room", () => {
			Game.ChatRoomData.Admin = [1, 4];
			Game.ChatRoomCharacter = [Game.Player];
			expect(Game.ChatRoomMapViewTetherHolds()).toBe(false);
			Game.ChatRoomCharacter = [Game.Player, member(3)];
			expect(Game.ChatRoomMapViewTetherHolds()).toBe(false);
			Game.ChatRoomCharacter = [Game.Player, member(2)];
			expect(Game.ChatRoomMapViewTetherHolds()).toBe(true);
			Game.ChatRoomCharacter = [Game.Player, member(4)];
			expect(Game.ChatRoomMapViewTetherHolds()).toBe(true);
		});

		it("lets her go when the tether point was removed while the map wasn't showing", () => {
			Game.ChatRoomCharacter = [Game.Player, member(2)];
			Game.MapManager.Map.setObjectConfig(5, 5, undefined);
			Game.MapManager.Map.updateGlobalMapData();
			const withoutTetherPoint = Game.CommonCloneDeep(Game.ChatRoomData.MapData);
			Game.MapManager.Map.setObjectConfig(5, 5, { Type: "Tether" });
			Game.MapManager.Map.updateGlobalMapData();
			expect(Game.ChatRoomMapViewTetherHolds()).toBe(true);
			Game.ChatRoomData.MapData = withoutTetherPoint;
			expect(Game.ChatRoomMapViewTetherHolds()).toBe(false);
		});

		it("lets her go when the room has no map anymore", () => {
			Game.ChatRoomCharacter = [Game.Player, member(2)];
			Game.ChatRoomData.MapData = { Type: "Never" };
			expect(Game.ChatRoomMapViewTetherHolds()).toBe(false);
		});
	});
});

describe("map positions", () => {
	it("gets the distance between two positions in tiles", () => {
		expect(Game.MapGetDistance({ X: 5, Y: 5 }, { X: 5, Y: 5 })).toBe(0);
		expect(Game.MapGetDistance({ X: 5, Y: 5 }, { X: 6, Y: 6 })).toBe(1);
		expect(Game.MapGetDistance({ X: 5, Y: 5 }, { X: 2, Y: 7 })).toBe(3);
	});

	it("checks that a value is a position within the map", () => {
		expect(Game.MapIsPosition({ X: 0, Y: 0 })).toBe(true);
		expect(Game.MapIsPosition({ X: Game.ChatRoomMapViewWidth - 1, Y: Game.ChatRoomMapViewHeight - 1 })).toBe(true);
		expect(Game.MapIsPosition({ X: Game.ChatRoomMapViewWidth, Y: 0 })).toBe(false);
		expect(Game.MapIsPosition({ X: 0, Y: Game.ChatRoomMapViewHeight })).toBe(false);
		expect(Game.MapIsPosition({ X: -1, Y: 0 })).toBe(false);
		expect(Game.MapIsPosition({ X: 1.5, Y: 0 })).toBe(false);
		expect(Game.MapIsPosition({ X: "1", Y: 0 })).toBe(false);
		expect(Game.MapIsPosition({ X: 1 })).toBe(false);
		expect(Game.MapIsPosition(null)).toBe(false);
	});
});
