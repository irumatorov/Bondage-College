"use strict";

{
	const hookRoot = /** @type {any} */ (globalThis);
	hookRoot.__BCBuilderTextHooks ??= {};
	/** @type {ExtendedItemScriptHookCallbacks.AfterDraw<TextItemData>} */
	const handler = function(data, originalFunction, { C, A, CA, G, X, Y, Property, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color }) {
		/** @type {(layerName: string, providedColor: any, cardDefault: string) => string} */
		const textMasterColor = (layerName, providedColor, cardDefault) => {
			const layers = Array.isArray(A.Layer) ? A.Layer : [];
			let index = 0;
			let masterIndex = -1;
			for (const layer of layers) {
				if (layer.Name === layerName) { masterIndex = layer.AllowColorize === false ? -1 : index; break; }
				if (!layer.CopyLayerColor && layer.AllowColorize !== false) index++;
			}
			const wornColor = Array.isArray(CA.Color) && masterIndex >= 0 ? CA.Color[masterIndex] :
				(typeof CA.Color === "string" ? CA.Color : undefined);
			const assetColor = Array.isArray(A.DefaultColor) && masterIndex >= 0 ? A.DefaultColor[masterIndex] :
				(typeof A.DefaultColor === "string" ? A.DefaultColor : undefined);
			const candidates = masterIndex < 0 ? [cardDefault, providedColor] : [wornColor, assetColor, providedColor, cardDefault];
			for (const color of candidates) {
				if (typeof color === "string" && color && color !== "Default" && color !== "None") return color;
			}
			return "#FFFFFF";
		};
		/** @type {(draw: (options: DynamicDrawOptions) => void, options: DynamicDrawOptions) => void} */
		const drawStrokeBehindFill = (draw, options) => {
			if (options.strokeColor && Number(options.strokeWidth) > 0) {
				draw({ ...options, color: options.strokeColor });
				draw({ ...options, strokeColor: undefined });
			} else {
				draw(options);
			}
		};
		const textActivePoses = Array.isArray(C?.ActivePose) ? C.ActivePose : [];
		const textWholeBody = textActivePoses.includes("AllFours") || textActivePoses.includes("Hogtied");
		if (textWholeBody && textActivePoses.some(p => ["Hogtied"].includes(p))) return;
		if (!textWholeBody && textActivePoses.some(p => ["BackBoxTie", "BackElbowTouch", "Hogtied"].includes(p))) return;
		if (L === "TextA1Fill" && (Property?.TypeRecord?.a ?? 0) === 1) {
			const width = 108;
			const height = 55;
			const fontFamily = "Archivo Black";
			const TempCanvas = AnimationGenerateTempCanvas(C, A, width, height);
			const ctx = TempCanvas.getContext("2d");
			if (!ctx) return;
			const fillColor = textMasterColor("TextA1Fill", Color, "#FF0000");
			TextItem.Init(TextItemDataLookup.ItemHandheldToyHammera1 ?? data, C, CA, false, false);
			/** @type {DynamicDrawOptions} */
			const textDefaults = {
				fontFamily,
				color: fillColor,
				textAlign: "center",
				textBaseline: "middle",
			};
			drawStrokeBehindFill((opts) => DynamicDrawTextFromTo(Property?.Text ?? "", ctx, [14, 37], [99, 15], opts), { ...textDefaults, fontSize: 35, textAlign: "center", textBaseline: "middle", width: 0, contain: true });
			/** @type {Partial<Record<string, { x: number, y: number }>>} */
			const poseOffsets = {
				"BaseUpper": { x: 281, y: 368 },
				"BackCuffs": { x: 395, y: 336 },
				"Yoked": { x: 58, y: 74 },
				"OverTheHead": { x: 187, y: 54 },
				"AllFours": { x: 192, y: 270 },
			};
			const activePoses = Array.isArray(C?.ActivePose) ? C.ActivePose : [];
			const wholeBody = activePoses.includes("AllFours") || activePoses.includes("Hogtied");
			const posePriority = ["TapedHands", "BackBoxTie", "BackCuffs", "BackElbowTouch", "Yoked", "OverTheHead", "AllFours", "Hogtied"];
			let poseOffset = { x: 0, y: 0 };
			let chosenPose = "";
			for (const name of posePriority) {
				if (wholeBody && name !== "AllFours" && name !== "Hogtied") continue;
				if (activePoses.includes(name) && poseOffsets[name]) { chosenPose = name; break; }
			}
			const hasActiveNonBasePose = posePriority.some(name =>
				activePoses.includes(name) && (!wholeBody || name === "AllFours" || name === "Hogtied"));
			if (!chosenPose && !hasActiveNonBasePose) chosenPose = poseOffsets.BaseUpper ? "BaseUpper" : "";
			if (chosenPose) poseOffset = poseOffsets[chosenPose] ?? { x: 0, y: 0 };
			const poseYOffset = (chosenPose === "AllFours" || chosenPose === "Hogtied")
				? poseOffset.y - (0) : poseOffset.y;
			const drawX = X + (0) + poseOffset.x;
			const drawY = Y + (0) + poseYOffset;
			drawCanvas(TempCanvas, drawX, drawY, AlphaMasks);
			drawCanvasBlink(TempCanvas, drawX, drawY, AlphaMasks);
			return;
		}
	};
	hookRoot.__BCBuilderTextHooks.AssetsItemHandheldToyHammerAfterDrawHook = handler;
}
