"use strict";

/** @type {ExtendedItemScriptHookCallbacks.AfterDraw<TextItemData>} */
function AssetsFaceMarkingsFaceWritingsAfterDrawHook(data, originalFunction, {
	C, A, CA, X, Y, drawCanvas, drawCanvasBlink, AlphaMasks, L, Color
}) {
	if (L !== "Text")
		return;

	// We set up a canvas
	const Height = 65;
	const Width = 200;
	const TempCanvas = AnimationGenerateTempCanvas(C, A, Width, Height);
	let offset; // we need a bit of offset for lower lines to follow the face shape when writing on cheeks

	/** @type {DynamicDrawOptions} */
	const drawOptions = {
		fontSize: 9,
		// disabled - fontFamily now gets set at 'style' switch
		//fontFamily: data.font,
		color: Color,
		width: Width,
	};

	switch (CA.Property?.TypeRecord?.s) {
		case 0: // Print
			drawOptions.fontFamily = "Ananda Black";
			break;
		case 1: // Cursive
			drawOptions.fontFamily = "Satisfy";
			break;
		case 2: // Boilerplate
			drawOptions.fontFamily = "Saira Stencil One";
			break;
		default:
			return;
	}

	switch (CA.Property.TypeRecord.p) {
		case 0: // Cheek L
			X-=24;
			Y-=182;
			drawOptions.textAlign = "center";
			offset = 2;
			break;
		case 1: // Forehead
			Y-=240;
			drawOptions.textAlign = "center";
			offset = 0;
			break;
		case 2: // Cheek R
			X+=24;
			Y-=182;
			drawOptions.textAlign = "center";
			offset = -2;
			break;
		default:
			return;
	}

	TextItem.Init(data, C, CA, false, false);
	const [text1, text2, text3] = [CA.Property.Text ?? "", CA.Property.Text2 ?? "", CA.Property.Text3 ?? ""];

	// We draw the desired info on that canvas
	const ctx = TempCanvas.getContext('2d');
	if (!ctx) return;
	DynamicDrawText(text1, ctx, Width / 2, Height / 2 - 10, drawOptions);
	DynamicDrawText(text2, ctx, Width / 2 + offset, Height / 2, drawOptions);
	DynamicDrawText(text3, ctx, Width / 2 + offset * 2, Height / 2 + 10, drawOptions);

	// We print the canvas to the character based on the asset position
	drawCanvas(TempCanvas, X + Width/2, Y + Height/2 , AlphaMasks);
	drawCanvasBlink(TempCanvas, X + Width/2, Y + Height/2 , AlphaMasks);
}

