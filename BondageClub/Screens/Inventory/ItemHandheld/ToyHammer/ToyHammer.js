"use strict";

/** @type {ExtendedItemScriptHookCallbacks.AfterDraw<TextItemData>} */
function AssetsItemHandheldToyHammerAfterDrawHook(data, originalFunction, { C, A, X, Y, Property, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color }) {
	if (L === "TextA1Fill" && (Property?.TypeRecord?.a ?? 0) === 1) {
		const canvas = AnimationGenerateTempCanvas(C, A, 108, 55);
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		DynamicDrawTextFromTo(Property?.Text ?? "", ctx, [14, 37], [99, 15], { fontFamily: "Archivo Black", color: Color, fontSize: 35, textAlign: "center", textBaseline: "middle", width: 0, contain: true });
		drawCanvas(canvas, X, Y, AlphaMasks);
		drawCanvasBlink(canvas, X, Y, AlphaMasks);
		return;
	}
}
