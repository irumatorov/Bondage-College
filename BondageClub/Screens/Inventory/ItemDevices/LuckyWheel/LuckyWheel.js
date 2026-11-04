"use strict";
var ItemDevicesLuckyWheelMinTexts = 2;
var ItemDevicesLuckyWheelMaxTexts = 8;
var ItemDevicesLuckyWheelMaxTextLength = 12;
var ItemDevicesLuckyWheelFont = "'Nanum Pen Script', 'Arial', sans-serif";
// Speed are calculated "Steps" aka degrees out of 360, so  360/speed * frametime is the time for one rotation
var ItemDevicesLuckyWheelAnimationMaxSpeed = 80;
var ItemDevicesLuckyWheelAnimationMinSpeed = 4;
var ItemDevicesLuckyWheelAnimationSpeedStep = 1;
var ItemDevicesLuckyWheelAnimationFrameTime = 80;

/**
 * Helper to generate section labels
 * @param {number} num
 * @returns {string}
 */
function ItemDevicesLuckyWheelLabelForNum(num) {
	return AssetTextGet("LuckyWheelSectionDefaultLabel").replace("NUM", num.toString());
}

/** @type {ExtendedItemScriptHookCallbacks.Draw<ModularItemData>} */
function InventoryItemDevicesLuckyWheelDrawHook(data, next) {
	if (data.currentModule === "Game")
		DrawButton(1370, 800, 260, 64, AssetTextGet("LuckyWheelTrigger"), "white");
	next();
}

/** @type {ExtendedItemScriptHookCallbacks.Click<ModularItemData>} */
function InventoryItemDevicesLuckyWheelClickHook(data, next) {
	if (data.currentModule === "Game") {
		if (MouseIn(1370, 800, 260, 64)) {
			InventoryItemDevicesLuckyWheelTrigger();
			return;
		}
	}

	next();
}

/** @type {ExtendedItemScriptHookCallbacks.Init<ModularItemData>} */
function InventoryItemDevicesLuckyWheelInitHook(data, originalFunction, character, item, push, refresh) {
	// NOTE: We can't pass `Texts` to `ModularItemData.BaselineProperty` as `AssetTextGet` has yet to be initialized at the time
	const Texts = [ItemDevicesLuckyWheelLabelForNum(1), ItemDevicesLuckyWheelLabelForNum(2)];
	let ret = originalFunction(character, item, false, false);
	ret = ExtendedItemInitNoArch(character, item, { Texts }, push, refresh) || ret;
	return ret;
}

/** @type {ExtendedItemScriptHookCallbacks.Load<NoArchItemData>} */
function InventoryItemDevicesLuckyWheelg0LoadHook(data, originalFunction) {
	originalFunction();
	if (!DialogFocusItem) return;
	const texts = (DialogFocusItem.Property?.Texts ?? []);
	for (const [i, text] of texts.entries()) {
		const input = ElementCreateInput(`LuckyWheelText${i}`, "input", text, ItemDevicesLuckyWheelMaxTextLength);
		if (input) {
			input.pattern = DynamicDrawTextInputPattern;
			input.addEventListener("change", InventoryItemDevicesLuckyWheelUpdate);
		}
	}
	InventoryItemDevicesLuckyWheelUpdate();
}

var ItemDevicesLuckyWheelRowTop = 500;
var ItemDevicesLuckyWheelRowLeft = 1380;
var ItemDevicesLuckyWheelRowHeight = 60;
var ItemDevicesLuckyWheelRowLength = 350;

/** @type {ExtendedItemScriptHookCallbacks.Draw<NoArchItemData>} */
function InventoryItemDevicesLuckyWheelg0DrawHook(data, originalFunction) {
	originalFunction();

	if (!DialogFocusItem) return;
	// Section labels & remove buttons grid
	let top = ItemDevicesLuckyWheelRowTop;
	let left = ItemDevicesLuckyWheelRowLeft;
	const texts = (DialogFocusItem.Property?.Texts ?? []);
	for (const [i] of texts.entries()) {
		let topRow = (i % (ItemDevicesLuckyWheelMaxTexts / 2) * ItemDevicesLuckyWheelRowHeight);
		let leftCol = Math.floor(i / (ItemDevicesLuckyWheelMaxTexts / 2)) * ItemDevicesLuckyWheelRowLength;
		ElementPosition(`LuckyWheelText${i}`, left + leftCol, top + topRow, 300);
	}

	const disabledAdd = texts.length >= ItemDevicesLuckyWheelMaxTexts;
	DrawButton(1360, 720, 120, 48, AssetTextGet("LuckyWheelAddSection"), disabledAdd ? "#888" : "white", null, null, disabledAdd);

	const disabledRemove = texts.length <= ItemDevicesLuckyWheelMinTexts;
	DrawButton(1530, 720, 120, 48, AssetTextGet("LuckyWheelRemoveSection"), disabledRemove ? "#888" : "white", null, null, disabledRemove);

}

/** @type {ExtendedItemScriptHookCallbacks.Click<NoArchItemData>} */
function InventoryItemDevicesLuckyWheelg0ClickHook(data, originalFunction) {
	originalFunction();
	if (!DialogFocusItem) return;
	const texts = (DialogFocusItem?.Property?.Texts ?? []);
	if (MouseIn(1360, 720, 120, 48)) {
		if (texts.length >= ItemDevicesLuckyWheelMaxTexts) return;

		let last = texts.length;
		const label = ItemDevicesLuckyWheelLabelForNum(last + 1);
		const input = ElementCreateInput(`LuckyWheelText${last}`, "input", label, ItemDevicesLuckyWheelMaxTextLength);
		if (input) {
			input.pattern = DynamicDrawTextInputPattern;
			input.addEventListener("change", InventoryItemDevicesLuckyWheelUpdate);
		}
		DialogFocusItem.Property?.Texts?.push(label);
		InventoryItemDevicesLuckyWheelUpdate();
		return;
	}

	if (MouseIn(1530, 720, 120, 48)) {
		if (texts.length <= ItemDevicesLuckyWheelMinTexts) return;

		const num = texts.length - 1;
		DialogFocusItem?.Property?.Texts?.splice(num, 1);
		ElementRemove(`LuckyWheelText${num}`);
		InventoryItemDevicesLuckyWheelUpdate();
		return;
	}
}

/** @type {ExtendedItemScriptHookCallbacks.Exit<NoArchItemData>} */
function InventoryItemDevicesLuckyWheelg0ExitHook(data, originalFunction) {
	const C = CharacterGetCurrent();
	if (!DialogFocusItem || !C) return;

	DialogFocusItem.Property ??= {};
	DialogFocusItem.Property.Texts ??= [];

	const texts = DialogFocusItem.Property.Texts;
	for (let num = 0; num < ItemDevicesLuckyWheelMaxTexts; num++) {
		if (num < texts.length) {
			const text = ElementValue(`LuckyWheelText${num}`);
			if (text != texts[num]) {
				texts[num] = text;
			}
		}

		ElementRemove(`LuckyWheelText${num}`);
	}

	ChatRoomCharacterItemUpdate(C);
	CharacterRefresh(C, true, false);

	ExtendedItemSubscreen = null;
	if (originalFunction) originalFunction();
}

function InventoryItemDevicesLuckyWheelUpdate() {
	const C = CharacterGetCurrent();
	if (!C) return;
	CharacterRefresh(C, false);
}

function InventoryItemDevicesLuckyWheelTrigger() {
	const C = CharacterGetCurrent();
	if (!C || !DialogFocusItem) return;

	const randomAngle = Math.round(Math.random() * 360);
	DialogFocusItem.Property ??= {};
	DialogFocusItem.Property.TargetAngle = randomAngle;
	ChatRoomCharacterItemUpdate(C);

	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.destinationCharacter(C)
		.build();
	ChatRoomPublishCustomAction("LuckyWheelStartTurning", true, Dictionary);
}

/**
 * @param {Character} C
 * @param {Item} Item
 * @param {number} Angle
 */
function InventoryItemDevicesLuckyWheelStoppedTurning(C, Item, Angle) {
	if (!C.IsPlayer() || Item.Asset.Name !== "LuckyWheel") return;

	let storedTexts = Array.isArray(Item.Property?.Texts) ? Item.Property.Texts.filter(T => typeof T === "string") : [];
	storedTexts = storedTexts.map(T => T.substring(0, ItemDevicesLuckyWheelMaxTextLength));
	const nbTexts = Math.max(Math.min(ItemDevicesLuckyWheelMaxTextLength, storedTexts.length), ItemDevicesLuckyWheelMinTexts);
	const sectorAngleSize = 360 / nbTexts;


	const startingAngle = sectorAngleSize * (Math.floor(nbTexts / 2) - 1);
	const landedIn = (nbTexts - Math.floor((Angle - startingAngle) / sectorAngleSize)) % nbTexts;
	const section = storedTexts[landedIn];

	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(C)
		.text("SectionName", section)
		.build();

	ChatRoomPublishCustomAction("LuckyWheelStoppedTurning", true, Dictionary);
}

/**
 * @typedef {{ AnimationAngleState?: number, AnimationSpeed?: number, ChangeTime?: number, LightStep?: number, Spinning?: boolean } & AnimationPersistentData} LuckyWheelPersistentData
 */

/** @type {ExtendedItemCallbacks.ScriptDraw<LuckyWheelPersistentData>} */
function AssetsItemDevicesLuckyWheelScriptDraw({ C, PersistentData, Item }) {
	const Data = PersistentData();
	const Properties = Item.Property || {};
	const TargetAngle = Math.min(Math.max(Properties.TargetAngle || 0, 0), 360);
	const FrameTime = ItemDevicesLuckyWheelAnimationFrameTime;

	// Initialized to a non-spinning value (aka target value), to avoid "misfires" on asset load
	if (typeof Data.AnimationAngleState !== "number") Data.AnimationAngleState = TargetAngle;
	if (typeof Data.AnimationSpeed !== "number") Data.AnimationSpeed = ItemDevicesLuckyWheelAnimationMaxSpeed;
	if (typeof Data.ChangeTime !== "number") Data.ChangeTime = CommonTime() + FrameTime;
	if (typeof Data.LightStep !== "number" || isNaN(Data.LightStep)) Data.LightStep = 0;
	if (typeof Data.Spinning !== "boolean") Data.Spinning = false;

	if (Data.AnimationAngleState != TargetAngle && !Data.Spinning) {
		Data.Spinning = true;
		Data.AnimationSpeed = ItemDevicesLuckyWheelAnimationMaxSpeed;
		Data.LightStep = 0;
	}

	if (Data.Spinning && Data.ChangeTime < CommonTime()) {
		Data.AnimationSpeed = Math.max(Data.AnimationSpeed - ItemDevicesLuckyWheelAnimationSpeedStep, ItemDevicesLuckyWheelAnimationMinSpeed);
		Data.AnimationAngleState = (Data.AnimationAngleState + Data.AnimationSpeed) % 360;

		// Stop detected
		if (Data.AnimationSpeed == ItemDevicesLuckyWheelAnimationMinSpeed && Math.abs(Data.AnimationAngleState - TargetAngle) <= ItemDevicesLuckyWheelAnimationMinSpeed) {
			Data.Spinning = false;
			Data.AnimationAngleState = TargetAngle;
			InventoryItemDevicesLuckyWheelStoppedTurning(C, Item, TargetAngle);
		}

		Data.ChangeTime = CommonTime() + FrameTime;
		AnimationRequestRefreshRate(C, FrameTime);
		AnimationRequestDraw(C);
	}
}

/** @type {ExtendedItemCallbacks.AfterDraw<LuckyWheelPersistentData>} */
function AssetsItemDevicesLuckyWheelAfterDraw({ C, PersistentData, A, CA, X, Y, L, Property, drawCanvas, drawCanvasBlink, AlphaMasks, Color, Opacity }) {
	const height = 500;
	const width = 500;

	if (L === "BlinkingLights") {
		const Data = PersistentData();

		/** Only draw lights when spinning */
		if (!Data.Spinning)
			return;

		Data.LightStep ??= 0;

		const tmpCanvas = AnimationGenerateTempCanvas(C, A, width, height);
		const ctx = tmpCanvas.getContext("2d");
		if (!ctx) return;

		if (C.IsInverted()) {
			ctx.rotate(Math.PI);
			ctx.translate(-tmpCanvas.width, -tmpCanvas.height);
			Y -= 500;
		}

		if ((Data.AnimationSpeed ?? 1) < 2 * ItemDevicesLuckyWheelAnimationMinSpeed) {
			// Start blinking
			Data.LightStep = (++Data.LightStep) % 2;

			if (Data.LightStep === 0)
				return;

			const image = "Assets/Female3DCG/ItemDevices/LuckyWheel_BlinkingLights_All.png";
			DrawImageCanvas(image, ctx, 0, 0, { AlphaMasks });
		} else {
			// Light trace
			Data.LightStep = (++Data.LightStep) % 3;

			const image = "Assets/Female3DCG/ItemDevices/LuckyWheel_BlinkingLights_" + (Data.LightStep + 1) + ".png";
			DrawImageCanvas(image, ctx, 0, 0, { AlphaMasks });
		}

		drawCanvas(tmpCanvas, X, Y, AlphaMasks);
		drawCanvasBlink(tmpCanvas, X, Y, AlphaMasks);
	}

	if (L === "Text") {
		const Data = PersistentData();
		const CurrentAngle = Data.AnimationAngleState ?? 0;
		const Properties = Property || {};

		DynamicDrawLoadFont(ItemDevicesLuckyWheelFont);

		// Determine Color Layer/Text Status
		let storedTexts = Properties.Texts && Array.isArray(Properties.Texts) ? Properties.Texts.filter(T => typeof T === "string") : [];
		storedTexts = storedTexts.map(T => T.substring(0, ItemDevicesLuckyWheelMaxTextLength));
		const nbTexts = Math.max(Math.min(ItemDevicesLuckyWheelMaxTextLength, storedTexts.length), ItemDevicesLuckyWheelMinTexts);

		// Draw
		const diameter = height / 2;
		/** @type {(degrees: number) => number} */
		const degreeToRadians = (degrees) => degrees * Math.PI / 180;
		const tmpCanvas = AnimationGenerateTempCanvas(C, A, width, height);
		const ctx = tmpCanvas.getContext("2d");
		if (!ctx) return;

		if (C.IsInverted()) {
			ctx.rotate(Math.PI);
			ctx.translate(-tmpCanvas.width, -tmpCanvas.height);
			Y -= 500;
		}

		// Draw Background Colors
		// Save the canvas state and rotate by the calculated angle about the center point
		ctx.save();
		ctx.translate(diameter, diameter);
		ctx.rotate(degreeToRadians(CurrentAngle));
		ctx.translate(-diameter, -diameter);

		/** @type {Record<number, number>} */
		const SectionsPerNumTexts = {
			2: 2,
			3: 3,
			4: 2,
			5: 3,
			6: 3,
			7: 3,
			8: 2,
		};

		/** @type {readonly BCColor[]} */
		let itemColors;
		if (typeof CA.Color === "string") {
			itemColors = Array(CA.Asset.ColorableLayerCount).fill(CA.Color);
		} else if (CommonIsArray(CA.Color)) {
			itemColors = CA.Color;
		} else {
			itemColors = CA.Asset.DefaultColor;
		}

		// Draw the background
		const colorLayerID = 10;
		for (let sectionID = 0; sectionID < SectionsPerNumTexts[nbTexts]; sectionID++) {
			const image = "Assets/Female3DCG/ItemDevices/LuckyWheel_" + nbTexts + "_" + (sectionID + 1) + ".png";
			const color = itemColors[colorLayerID + sectionID] || "#888";
			DrawImageCanvas(image, ctx, 0, 0, { HexColor: CommonIsColor(color) ? color : undefined, AlphaMasks });
		}


		// Restore the canvas rotation
		ctx.restore();

		// Validate & Draw Texts
		for (let i = 0; i < nbTexts; i++) {
			// Validate
			const validatedText = (storedTexts[i] && DynamicDrawTextRegex.test(storedTexts[i]) ? storedTexts[i] : ItemDevicesLuckyWheelLabelForNum(i + 1));

			// Print text at an angle
			const sectorAngleSize = 360 / nbTexts;
			// coordinate of the end of the text being drawn: nth sector + center of current sector + offset from the spinning
			const coordDegree = (sectorAngleSize) * (i) + (sectorAngleSize / 2) + (CurrentAngle);
			const to = [
				height / 2,
				width / 2
			]; // Center of the wheel + constant
			const from = [
				diameter + diameter * Math.cos(degreeToRadians(coordDegree + 90 + (nbTexts % 2 !== 0 ? sectorAngleSize / 2 : 0))),
				diameter + diameter * Math.sin(degreeToRadians(coordDegree + 90 + (nbTexts % 2 !== 0 ? sectorAngleSize / 2 : 0)))
			]; // Appropriate point on the perimeter of a circle
			DynamicDrawTextFromTo(validatedText, ctx, from, to, {
				fontSize: 32,
				fontFamily: ItemDevicesLuckyWheelFont,
				color: Color,
				width: diameter - 40
			});
		}

		// We print the canvas on the character based on the asset position
		drawCanvas(tmpCanvas, X, Y, AlphaMasks);
		drawCanvasBlink(tmpCanvas, X, Y, AlphaMasks);
	}
}
