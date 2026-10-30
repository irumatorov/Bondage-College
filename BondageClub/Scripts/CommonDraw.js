"use strict";

/**
 * Prepares the character's drawing canvases before drawing the character's appearance.
 * @param {Character} C - The character to prepare
 * @returns {void} - Nothing
 */
function CommonDrawCanvasPrepare(C) {
	if (C.Canvas == null) {
		C.Canvas = document.createElement("canvas");
		C.Canvas.width = 500;
		C.Canvas.height = CanvasDrawHeight;
	} else C.Canvas.getContext("2d")?.clearRect(0, 0, 500, CanvasDrawHeight);
	if (C.CanvasBlink == null) {
		C.CanvasBlink = document.createElement("canvas");
		C.CanvasBlink.width = 500;
		C.CanvasBlink.height = CanvasDrawHeight;
	} else C.CanvasBlink.getContext("2d")?.clearRect(0, 0, 500, CanvasDrawHeight);

	C.MustDraw = true;
	C.DrawnAssets = new Set();
}

/**
 * @param {Character} C - The character to prepare
 * @param {AssetGroup} group - The asset group
 * @param {AssetGroupName} groupName -  The asset group.
 * @param {AssetPoseName | PoseType | NullPoseType} pose - The pose the user is in.
 * @param {AssetLayer} layer - the layer of the asset.
 * @param {string} layerType - CLT layer name, e.g. typed3
 * @param {Asset} asset - target asset
 * @returns {string} baseURL - URL pointing to asset art to load
 */
function AssetBaseURL(C, group, groupName, pose, layer, layerType, asset) {
	// determine what body is selected
	const bodyStyle = /** @type {Asset} */ (InventoryGet(C, "BodyStyle")?.Asset ?? AssetGet("Female3DCG", "BodyStyle", "Original"));
	const layerTypeNumber = parseInt(layerType.slice(5), 10);

	// set base body url
	const poseSegment = pose ? pose + "/" : "";
	let baseURL = `Assets/${group.Family}/${groupName}/${poseSegment}`;
	if (bodyStyle?.Layer[0].StyleOverride?.includes(groupName) || layer.StyleOverride?.includes(bodyStyle.Name)) {
		if (!layer.CreateLayerTypesOverride?.length || layer.CreateLayerTypesOverride?.includes(layerTypeNumber)) {
			baseURL = `Assets/${group.Family}/Override/${bodyStyle.Name}/${groupName}/${poseSegment}`;
		}
	}

	return baseURL;
}

/**
 * @typedef { Map<AssetGroupName, TextureAlphaMask[]> } MaskLayersMap
 * @param {Character} C - The character to prepare
 * @returns { { maskLayers: MaskLayersMap, maskLayersBlink: MaskLayersMap} } - The grouped mask layers for the character's appearance
 */
function CommonDrawAppearancePrepareMaskLayers(C) {
	/** @type {{ maskLayers: MaskLayersMap, maskLayersBlink: MaskLayersMap}} */
	const maskLayers = (C.AppearanceMasks ?? []).reduce(
		(acc, layer) => {
			// Same as url logic in CommonDrawAppearanceBuild, but masks should use its own properties
			// Also masks don't have colorization, so we don't need to check for it

			const asset = layer.Asset;
			const group = asset.Group;
			let item = /** @type {Item} */ (C.Appearance.find((i) => i.Asset === asset));
			let groupName = asset.DynamicGroupName;

			// If there's a pose style we must add (items take priority over groups, layers may override completely)
			let pose = CommonDrawResolveAssetPose(C, layer);

			// If the layer belongs to a specific parent group, grab the group's current asset name to use it as a suffix
			/** @type {"" | AssetName} */
			let parentAssetName = "";
			const parentGroupName =
				pose ? layer.ParentGroup[pose] ?? layer.ParentGroup[PoseType.DEFAULT] : layer.ParentGroup[PoseType.DEFAULT];
			if (parentGroupName) {
				const parentItem = C.Appearance.find(
					(Item) => Item.Asset.Group.Name === parentGroupName,
				);
				if (parentItem) parentAssetName = parentItem.Asset.Name;
			}

			// Check if we need to draw a different expression (for facial features)
			const currentExpression = CommonDrawResolveLayerExpression(
				C,
				item,
				layer,
			);
			const expressionSegment = currentExpression
				? currentExpression + "/"
				: "";
			const blinkExpressionSegment = (
				asset.OverrideBlinking ? !group.DrawingBlink : group.DrawingBlink
			)
				? "Closed/"
				: expressionSegment;

			// Find the X and Y position to draw on
			let { X, Y } = CommonDrawComputeDrawingCoordinates(
				C,
				asset,
				layer,
				groupName,
				item.Property,
			);

			// Check if we need to draw a different variation (from type property)
			const typeRecord = (item.Property && item.Property.TypeRecord) || {};
			let layerSegment = "";
			let layerType = "";
			if (layer.CreateLayerTypes.length > 0) {
				layerType = layer.CreateLayerTypes.map(
					(k) => `${k}${typeRecord[k] || 0}`,
				).join("");
			}
			if (layer.Name) layerSegment = layer.Name;

			// If blending mode is not set correctly, skip the layer
			/** @type {"destination-in" | "destination-out"} */
			let blendingMode = "destination-in";
			if (
				layer.BlendingMode === "destination-in" ||
				layer.BlendingMode === "destination-out"
			) {
				blendingMode = layer.BlendingMode;
			} else if (layer.BlendingMode) return acc;

			// Safeguard against a null pose
			if (typeof pose !== "string") pose = /** @type {AssetPoseName} */ ("");

			// Check the current pose against the assets' supported pose mapping
			/** @type {AssetPoseName | NullPoseType} */
			let poseSegment;
			if (pose === null || pose === "") {
				poseSegment = null;
			} else if (
				(layer.PoseMapping[pose] === PoseType.HIDE ||
				layer.PoseMapping[pose] === PoseType.DEFAULT)
			) {
				poseSegment = null;
			} else {
				poseSegment = /** @type {AssetPoseName} */ (layer.PoseMapping[pose]);
			}

			// set the base url for the body
			let baseURL = AssetBaseURL(C, group, groupName, poseSegment, layer, layerType, asset);

			const baseURLExpression = `${baseURL}${expressionSegment}`;
			const baseURLBlink = `${baseURL}${blinkExpressionSegment}`;

			const urlParts = [
				asset.Name,
				parentAssetName,
				layerType,
				layerSegment,
			].filter((c) => c);
			const layerURL = urlParts.join("_") + ".png";

			const maskPriority = layer.TextureMask?.ApplyToAbove ?
				-1
				: typeof item.Property?.OverridePriority === "number" ?
					item.Property?.OverridePriority
					: (item.Property?.OverridePriority?.[layer.Name ?? ""] ?? layer.Priority);

			/** @type {TextureAlphaMask} */
			const maskLayer = {
				Url: baseURLExpression + layerURL,
				X,
				Y,
				Mode: blendingMode,
				Priority: maskPriority,
			};

			/** @type {TextureAlphaMask} */
			const maskLayerBlink = {
				Url: baseURLBlink + layerURL,
				X,
				Y,
				Mode: blendingMode,
				Priority: maskPriority,
			};

			const groups = layer.TextureMask?.Groups ?? [group.Name];

			for (const maskedGroup of groups) {
				if (!acc.maskLayers.has(maskedGroup))
					acc.maskLayers.set(maskedGroup, [maskLayer]);
				else acc.maskLayers.get(maskedGroup)?.push(maskLayer);
				if (!acc.maskLayersBlink.has(maskedGroup))
					acc.maskLayersBlink.set(maskedGroup, [maskLayerBlink]);
				else acc.maskLayersBlink.get(maskedGroup)?.push(maskLayerBlink);
			}

			return acc;
		},
		/** @type {{ maskLayers: MaskLayersMap, maskLayersBlink: MaskLayersMap}} */ ({
			maskLayers: new Map(),
			maskLayersBlink: new Map(),
		}),
	);
	return maskLayers;
}

/**
 * Draws the given character's appearance using the provided drawing callbacks
 * @param {Character} C - The character whose appearance to draw
 * @param {CommonDrawCallbacks} callbacks - The drawing callbacks to be used
 */
function CommonDrawAppearanceBuild(
	C,
	{
		clearRect,
		clearRectBlink,
		drawCanvas,
		drawCanvasBlink,
		drawImage,
		drawImageBlink,
		drawImageColorize,
		drawImageColorizeBlink,
	},
) {
	// Prepare masks for the character's appearance
	const { maskLayers: maskTexLayers, maskLayersBlink: maskTexLayersBlink } =
		CommonDrawAppearancePrepareMaskLayers(C);

	/** @type {Map<Item, ExtendedItemOptionConfig["DrawOptions"]>} */
	const drawOptionsMap = new Map();

	// Loop through all layers in the character appearance
	for (const layer of C.AppearanceLayers ?? []) {
		const asset = layer.Asset;
		const group = asset.Group;
		let item = /** @type {Item} */ (C.Appearance.find((i) => i.Asset === asset));
		let groupName = asset.DynamicGroupName;

		// If there's a pose style we must add (items take priority over groups, layers may override completely)
		let pose = CommonDrawResolveAssetPose(C, layer);

		// If the layer belongs to a specific parent group, grab the group's current asset name to use it as a suffix
		/** @type {"" | AssetName} */
		let parentAssetName = "";
		const parentGroupName =
			pose ? layer.ParentGroup[pose] ?? layer.ParentGroup[PoseType.DEFAULT] : layer.ParentGroup[PoseType.DEFAULT];
		if (parentGroupName) {
			const parentItem = C.Appearance.find(
				(Item) => Item.Asset.Group.Name === parentGroupName,
			);
			if (parentItem) parentAssetName = parentItem.Asset.Name;
		}

		// Check if we need to draw a different expression (for facial features)
		const currentExpression = CommonDrawResolveLayerExpression(C, item, layer);
		const expressionSegment = currentExpression ? currentExpression + "/" : "";
		const blinkExpressionSegment = (
			asset.OverrideBlinking ? !group.DrawingBlink : group.DrawingBlink
		)
			? "Closed/"
			: expressionSegment;

		// Find the X and Y position to draw on
		let { X, Y, fixedYOffset } = CommonDrawComputeDrawingCoordinates(
			C,
			asset,
			layer,
			groupName,
			item.Property,
		);

		CommonDrawApplyLayerAlphaMasks(
			C,
			layer,
			fixedYOffset,
			clearRect,
			clearRectBlink,
		);

		// Check if we need to draw a different variation (from type property)
		const typeRecord = (item.Property && item.Property.TypeRecord) || {};
		let layerSegment = "";
		let layerType = "";
		if (layer.CreateLayerTypes.length > 0) {
			layerType = layer.CreateLayerTypes.map(
				(k) => `${k}${typeRecord[k] || 0}`,
			).join("");
		}
		if (layer.Name) layerSegment = layer.Name;

		let opacity =
			item.Property && typeof item.Property.Opacity === "number"
				? item.Property.Opacity
				: layer.Opacity;
		if (item.Property && CommonIsArray(item.Property.Opacity)) {
			let Pos = 0;
			if (CommonIsArray(item.Asset.Layer)) {
				for (
					let P = 0;
					P < item.Asset.Layer.length && P < item.Property.Opacity.length;
					P++
				)
					if (layer.Name == item.Asset.Layer[P].Name) Pos = P;
			}
			if (CommonIsNumeric(item.Property.Opacity[Pos])) {
				opacity = item.Property.Opacity[Pos];
			}
		}
		let blendingMode = layer.BlendingMode;
		opacity = Math.min(layer.MaxOpacity, Math.max(layer.MinOpacity, opacity));
		let masks = layer.GroupAlpha?.filter(
			({ Pose: P }) => !P || !!CommonDrawFindPose(C, P),
		).reduce((Acc, { Masks }) => {
			Acc.push(...Masks);
			return Acc;
		}, /** @type {RectTuple[]} */ ([]));

		// Resolve the layer color; handles color inheritance and schema validation
		let layerColor = CommonDrawResolveLayerColor(C, item, layer, groupName);

		// Before drawing hook, receives all processed data. Any of them can be overridden if returned inside an object.
		// CAREFUL! The dynamic function should not contain heavy computations, and should not have any side effects.
		// Watch out for object references.
		if (asset.DynamicBeforeDraw && !C.IsGhosted()) {
			const transforms = CommonDrawResolveLayerTransforms(item, layer);
			/** @type {DynamicDrawingData} */
			const DrawingData = {
				C,
				X,
				Y,
				CA: item,
				GroupName: groupName,
				Color: layerColor,
				Opacity: opacity,
				Property: item.Property ?? {},
				A: asset,
				G: parentAssetName,
				AG: group,
				L: layerSegment,
				Pose: pose,
				LayerType: layerType,
				BlinkExpression: blinkExpressionSegment,
				drawCanvas: CommonDrawWithLayerTransforms(drawCanvas, transforms),
				drawCanvasBlink: CommonDrawWithLayerTransforms(drawCanvasBlink, transforms),
				AlphaMasks: masks ?? [],
				Transforms: transforms,
				PersistentData: () => AnimationPersistentDataGet(C, asset),
			};
			/** @type {DynamicBeforeDrawOverrides} */
			const OverriddenData = CommonCallFunctionByNameWarn(
				`Assets${asset.Group.Name}${asset.Name}BeforeDraw`,
				DrawingData,
			);
			if (CommonIsObject(OverriddenData)) {
				if (OverriddenData.Property !== undefined) item.Property = OverriddenData.Property;
				if (OverriddenData.CA !== undefined) item = OverriddenData.CA;
				if (OverriddenData.GroupName !== undefined) groupName = OverriddenData.GroupName;
				if (OverriddenData.Color !== undefined) layerColor = OverriddenData.Color;
				if (OverriddenData.Opacity !== undefined) opacity = OverriddenData.Opacity;
				if (OverriddenData.X !== undefined) X = OverriddenData.X;
				if (OverriddenData.Y !== undefined) Y = OverriddenData.Y;
				if (OverriddenData.LayerType !== undefined) layerType = OverriddenData.LayerType;
				if (OverriddenData.L !== undefined) layerSegment = OverriddenData.L;
				if (OverriddenData.AlphaMasks !== undefined) masks = OverriddenData.AlphaMasks;
				if (OverriddenData.Pose !== undefined) pose = OverriddenData.Pose;
			}
		}

		// Safeguard against a null pose
		if (typeof pose !== "string") pose = /** @type {AssetPoseName} */ ("");

		// Redo some checks in case BeforeDraw overrode the color back to default.
		if (layerColor === "Default" && asset.DefaultColor) {
			layerColor = CommonDrawResolveLayerColor(
				C,
				item,
				layer,
				groupName,
				layerColor,
			);
		}

		masks = masks?.map(([x, y, w, h]) => [
			x,
			y + CanvasUpperOverflow + fixedYOffset,
			w,
			h,
		]);

		let drawOptions = drawOptionsMap.get(item);
		if (!drawOptions) {
			const opts = ExtendedItemGetDrawingOptions(item);
			drawOptionsMap.set(item, opts);
			drawOptions = opts;
		}
		let mirrored = drawOptions?.Mirror ?? false;
		let inverted = drawOptions?.Invert ?? false;

		if (asset.FixedPosition && C.IsInverted()) {
			mirrored = !mirrored;
			inverted = !inverted;
		}

		const itemIsLocked = !!(item.Property && item.Property.LockedBy);

		// Check the current pose against the assets' supported pose mapping
		/** @type {AssetPoseName | NullPoseType}  */
		let poseSegment;
		if (pose === null || pose === "") {
			poseSegment = null;
		} else if (
			layer.PoseMapping[pose] === PoseType.HIDE ||
			layer.PoseMapping[pose] === PoseType.DEFAULT
		) {
			poseSegment = null;
		} else {
			poseSegment = /** @type {AssetPoseName} */ (layer.PoseMapping[pose]);
		}

		if (layer.HasImage && (!layer.LockLayer || itemIsLocked)) {
			// Handle the layer's color suffix mapping, transforming it back into a named color so we still use the correct base
			/** @type {BCColor | undefined} */
			let colorSuffix = undefined;
			if (layer.ColorSuffix && layerColor) {
				colorSuffix =
					layerColor[0] === "#"
						? layer.ColorSuffix.HEX_COLOR
						: layer.ColorSuffix[layerColor];
				if (colorSuffix && colorSuffix[0] === "#") {
					layerColor = colorSuffix;
					colorSuffix = undefined;
				}
			}

			let baseURL = AssetBaseURL(
				C,
				group,
				groupName,
				poseSegment,
				layer,
				layerType,
				asset,
			);

			// combine the baseurl with the expression and blink segments.
			const baseURLExpression = `${baseURL}${expressionSegment}`;
			const baseURLBlink = `${baseURL}${blinkExpressionSegment}`;

			/** @type {(color: BCColor) => color is HexColor} */
			const shouldColorize = (color) => layer.AllowColorize && color && color[0] === "#";
			let colorSegment = "";

			if (shouldColorize(layerColor)) {
				// The layer is colorizable and has an explicit hexcode, it needs to be drawn colorized
				colorSegment = colorSuffix != undefined ? colorSuffix : "";
			} else {
				// The layer isn't colorizable, so validate that the layer color is a named color
				// If a color suffix is specified and isn't Default, it'll completely override the final color
				if (
					layerColor != null &&
					layerColor !== "Default" &&
					layerColor[0] !== "#"
				) {
					colorSegment = layerColor;
				}
				if (colorSuffix) {
					colorSegment = colorSuffix !== "Default" ? colorSuffix : "";
				}
			}

			const urlParts = [
				asset.Name,
				parentAssetName,
				layerType,
				colorSegment,
				layerSegment,
			].filter((c) => c);
			const layerURL = urlParts.join("_") + ".png";

			// prepare mask layers for the current group
			const maskLayer = (maskTexLayers.get(group.Name) ?? []).filter(
				(m) => m.Priority < 0 || m.Priority >= layer.Priority,
			);
			const maskLayerBlink = (maskTexLayersBlink.get(group.Name) ?? []).filter(
				(m) => m.Priority < 0 || m.Priority >= layer.Priority,
			);

			const transforms = CommonDrawResolveLayerTransforms(item, layer);

			const drawX = X + transforms.TranslationX;
			const drawY = Y + transforms.TranslationY;

			if (shouldColorize(layerColor)) {
				drawImageColorize(baseURLExpression + layerURL, drawX, drawY, {
					HexColor: layerColor,
					FullAlpha: layer.FullAlpha,
					AlphaMasks: masks,
					Alpha: opacity,
					Invert: inverted,
					Mirror: mirrored,
					BlendingMode: blendingMode,
					TextureAlphaMask: maskLayer,
					...transforms,
				});
				drawImageColorizeBlink(baseURLBlink + layerURL, drawX, drawY, {
					HexColor: layerColor,
					FullAlpha: layer.FullAlpha,
					AlphaMasks: masks,
					Alpha: opacity,
					Invert: inverted,
					Mirror: mirrored,
					BlendingMode: blendingMode,
					TextureAlphaMask: maskLayerBlink,
					...transforms,
				});
			} else {
				drawImage(baseURLExpression + layerURL, drawX, drawY, {
					AlphaMasks: masks,
					Alpha: opacity,
					Invert: inverted,
					Mirror: mirrored,
					BlendingMode: blendingMode,
					TextureAlphaMask: maskLayer,
					...transforms,
				});
				drawImageBlink(baseURLBlink + layerURL, drawX, drawY, {
					AlphaMasks: masks,
					Alpha: opacity,
					Invert: inverted,
					Mirror: mirrored,
					BlendingMode: blendingMode,
					TextureAlphaMask: maskLayerBlink,
					...transforms,
				});
			}
		}

		// After drawing hook, receives all processed data.
		// CAREFUL! The dynamic function should not contain heavy computations, and should not have any side effects.
		// Watch out for object references.
		if (asset.DynamicAfterDraw && !C.IsGhosted()) {
			const transforms = CommonDrawResolveLayerTransforms(item, layer);
			/** @type {DynamicDrawingData} */
			const DrawingData = {
				C,
				X,
				Y,
				CA: item,
				GroupName: groupName,
				Property: item.Property ?? {},
				Color: layerColor,
				Opacity: opacity,
				A: asset,
				G: parentAssetName,
				AG: group,
				L: layerSegment,
				Pose: pose,
				LayerType: layerType,
				BlinkExpression: blinkExpressionSegment,
				drawCanvas: CommonDrawWithLayerTransforms(drawCanvas, transforms),
				drawCanvasBlink: CommonDrawWithLayerTransforms(drawCanvasBlink, transforms),
				AlphaMasks: masks ?? [],
				Transforms: transforms,
				PersistentData: () => AnimationPersistentDataGet(C, asset),
			};
			CommonCallFunctionByNameWarn(
				`Assets${asset.Group.Name}${asset.Name}AfterDraw`,
				DrawingData,
			);
		}
	}
}

/**
 * Get the layer's resolved & validated current expression.
 *
 * Resolution handles mirroring from another group, and validation checks its value against the asset definition.
 *
 * @param {Character} C
 * @param {Item} item
 * @param {AssetLayer} layer
 */
function CommonDrawResolveLayerExpression(C, item, layer) {
	// Check if we need to draw a different expression (for facial features)
	let currentExpression = InventoryGetItemProperty(item, "Expression");
	if (!currentExpression && layer.MirrorExpression) {
		const MirroredItem = InventoryGet(C, layer.MirrorExpression);
		if (MirroredItem) {
			const expr = InventoryGetItemProperty(MirroredItem, "Expression");
			if (expr && CharacterIsExpressionAllowed(C, item, expr)) {
				currentExpression = expr;
			}
		}
	}
	return currentExpression;
}

/**
 * Get the X and Y drawing coordinates for a layer
 *
 * @param {Character} C
 * @param {Asset} asset
 * @param {AssetLayer} layer
 * @param {AssetGroupName} groupName
 * @param {null | ItemProperties} properties
 */
function CommonDrawComputeDrawingCoordinates(C, asset, layer, groupName, properties=null) {
	const bodyStyle = /** @type {Asset} */ (InventoryGet(C, "BodyStyle")?.Asset);
	const originX = PropertyLayerOrigin.resolveLayer(layer, "DrawingLeft", properties);
	const originY = PropertyLayerOrigin.resolveLayer(layer, "DrawingTop", properties);
	let X = originX[C.DrawPose.find((p) => originX[p] != null) ?? PoseType.DEFAULT] ?? 0;
	let Y = originY[C.DrawPose.find((p) => originY[p] != null) ?? PoseType.DEFAULT] ?? 0;
	for (const drawPose of C.DrawPose) {
		const PoseDef = PoseRecord[drawPose];
		if (PoseDef && PoseDef.MovePosition) {
			const MovePosition = PoseDef.MovePosition.find(
				(MP) => MP.Group === groupName,
			);
			if (MovePosition) {
				X += MovePosition.X;
				Y += MovePosition.Y;
			}
		}
	}

	// Offset Y to counteract height modifiers for fixed-position assets
	let fixedYOffset = 0;
	if (asset.FixedPosition || layer.FixedPosition) {
		if (C.IsInverted()) {
			fixedYOffset =
				-Y +
				1000 -
				(Y +
					CharacterAppearanceYOffset(C, C.HeightRatio, true) / C.HeightRatio);
		} else {
			fixedYOffset =
				C.HeightModifier +
				(1000 * (1 - C.HeightRatio) * (1 - (C.HeightRatioProportion ?? 0))) /
					C.HeightRatio;
		}
	}
	Y += fixedYOffset;

	// Adjust for the increased canvas size
	Y += CanvasUpperOverflow;

	const drawOffset = bodyStyle.DrawOffset?.find(
		(offset) =>
			offset.Group === groupName &&
			(offset.Asset === undefined || offset.Asset === asset.Name) &&
			(offset.Layer === undefined || offset.Layer.includes(layer.Name ?? "")),
	);

	if (drawOffset) {
		X += drawOffset.X ?? 0;
		Y += drawOffset.Y ?? 0;
	}

	return { X, Y, fixedYOffset };
}

/**
 * Clears out rects based on the layer's alpha masks
 *
 * @param {Character} C
 * @param {AssetLayer} layer
 * @param {number} fixedYOffset
 * @param {ClearRectCallback} clearRect
 * @param {ClearRectCallback} clearRectBlink
 */
function CommonDrawApplyLayerAlphaMasks(
	C,
	layer,
	fixedYOffset,
	clearRect,
	clearRectBlink,
) {
	for (const AlphaDef of layer.Alpha) {
		// If no groups are defined and the character's pose matches one of the allowed poses (or no poses are defined)
		if (
			(!AlphaDef.Group || !AlphaDef.Group.length) &&
			(!AlphaDef.Pose || !!CommonDrawFindPose(C, AlphaDef.Pose))
		) {
			AlphaDef.Masks.forEach((rect) => {
				clearRect(
					rect[0],
					rect[1] + CanvasUpperOverflow + fixedYOffset,
					rect[2],
					rect[3],
				);
				clearRectBlink(
					rect[0],
					rect[1] + CanvasUpperOverflow + fixedYOffset,
					rect[2],
					rect[3],
				);
			});
		}
	}
}

/**
 * Resolve and validates a layer's color, given a character, an item and a layer.
 *
 * This handles grabbing the user-specified color, or the default one, or inherit it from another group, and
 * checks it for validity.
 *
 * @param {Character} C
 * @param {Item} item
 * @param {AssetLayer} layer
 * @param {AssetGroupName} groupName
 * @param {BCColor} [initialColor] Used as the starting value to check that specific color and fully resolve it
 */
function CommonDrawResolveLayerColor(C, item, layer, groupName, initialColor) {
	// Pick the layer's color out of the item's Color property based on the layer's index, or default it to what the group says
	let layerColor = initialColor ?? item.Asset.Group.ColorSchema[0];
	if (Array.isArray(item.Color)) {
		layerColor = item.Color[layer.ColorIndex];
	} else {
		layerColor = item.Color ?? "Default";
	}

	// Fix to legacy appearance data when Hands could be different to BodyUpper
	if (groupName === "HandsLeft" || groupName === "HandsRight")
		layerColor = "Default";

	// If the item specifies a default color, use that
	// Used by extended assets to specify a different default color for a layer depending on its item type
	if (layerColor === "Default" && item.Property) {
		layerColor = Array.isArray(item.Property.DefaultColor)
			? (item.Property.DefaultColor[layer.ColorIndex] ?? "Default")
			: item.Property.DefaultColor ?? "Default";
	}

	if (!CommonDrawColorValid(layerColor, item.Asset.Group)) {
		layerColor = "Default";
	}

	// Check if we need to copy the color of another asset
	let colorGroup = layerColor == "Default" ? layer.InheritColor : null;
	while (colorGroup != null) {
		const parentItem = InventoryGet(C, colorGroup);
		if (parentItem != null) {
			const parentColor = Array.isArray(parentItem.Color)
				? parentItem.Color[0]
				: parentItem.Color ?? "Default";
			const inheritedColor =
				parentColor === "Default" && parentItem.Asset.InheritColor;
			if (inheritedColor) {
				colorGroup = inheritedColor;
			} else {
				layerColor = CommonDrawColorValid(parentColor, parentItem.Asset.Group)
					? parentColor
					: "Default";
				colorGroup = null;
			}
		} else {
			colorGroup = null;
		}
	}

	return layerColor;
}

/**
 * Resolves a layer's transformations (set on the layering screen), combining the item's and the layer's own.
 * @param {Item} item
 * @param {AssetLayer} layer
 * @returns {DrawTransforms}
 */
function CommonDrawResolveLayerTransforms(item, layer) {
	const getTransform = (/** @type {"TranslationX" | "TranslationY" | "ScaleX" | "ScaleY" | "Rotation"} */ propName, /** @type {number} */ defaultValue) => {
		const layerName = layer.Name ?? "";
		/** @type {ItemProperties} */
		const props = item.Property ?? {};
		const key = /** @type {const} */(`Layer${propName}`);
		const layerVal = props[key]?.[layerName];
		const assetVal = props[propName];

		const safeVal = (/** @type {any} */ v) => (v === undefined || v === null || Number.isNaN(v)) ? undefined : v;

		const safeLayerVal = safeVal(layerVal);
		const safeAssetVal = safeVal(assetVal);

		// Translation and Rotation: Additive blending
		if (propName === "TranslationX" || propName === "TranslationY" || propName === "Rotation") {
			const combined = (safeLayerVal ?? 0) + (safeAssetVal ?? 0);
			if (propName === "Rotation") {
				return Math.max(-180, Math.min(180, combined));
			}
			return combined;
		}

		// Scale: Multiplicative blending
		if (propName === "ScaleX" || propName === "ScaleY") {
			let val = safeAssetVal ?? 1;
			if (safeLayerVal !== undefined) val *= safeLayerVal;
			return Math.max(0.01, Math.min(3.0, val));
		}

		return safeLayerVal ?? safeAssetVal ?? defaultValue;
	};

	return {
		TranslationX: getTransform("TranslationX", 0),
		TranslationY: getTransform("TranslationY", 0),
		ScaleX: getTransform("ScaleX", 1),
		ScaleY: getTransform("ScaleY", 1),
		Rotation: getTransform("Rotation", 0),
	};
}

/**
 * Wraps a canvas drawing callback for the dynamic drawing hooks, so what they draw is moved, rotated and scaled
 * like the layer's images (as set on the layering screen)
 * @param {DrawCanvasCallback} drawCanvas
 * @param {DrawTransforms} transforms - The layer's transformations
 * @returns {DrawCanvasCallback}
 */
function CommonDrawWithLayerTransforms(drawCanvas, transforms) {
	return (Img, x, y, alphaMasks, maskLayers) => drawCanvas(
		Img, x + transforms.TranslationX, y + transforms.TranslationY, alphaMasks, maskLayers, transforms,
	);
}

/**
 * Determines whether the provided color is valid
 * @param {string} Color - The color
 * @param {AssetGroup} AssetGroup - The asset group the color is being used fo
 * @returns {Color is BCColor} - Whether the color is valid
 */
function CommonDrawColorValid(Color, AssetGroup) {
	if (typeof Color !== "string") {
		return false;
	}

	if (Color.match(/#(?:[0-9a-f]{6}|[0-9a-f]{3})/i)) {
		// Hexcode colors are always valid
		return true;
	}

	// Otherwise it's a named color, and must appear in the schema
	return CommonIncludes(AssetGroup.ColorSchema, Color);
}

/**
 * Finds the correct pose to draw for drawable layer for the provided character from the provided list of allowed poses
 * @param {Character} C - The character to check for poses against
 * @param {Partial<Record<AssetPoseCategory, readonly AssetPoseName[]>>} AllowedPoses - The list of permitted poses for the current layer
 * @returns {AssetPoseName | NullPoseType} - The name of the pose to draw for the layer, or an empty string if no pose should be drawn
 */
function CommonDrawFindPose(C, AllowedPoses) {
	for (const [category, poses] of CommonEntries(AllowedPoses)) {
		const drawPose = C.DrawPoseMapping[category];
		if (CommonIncludes(poses ?? [], drawPose)) {
			return drawPose;
		}
	}
	return null;
}

/**
 * Finds the pose that should be used when a given asset (and optionally layer) is drawn.
 * @param {Character} C - The character whose poses to check
 * @param {AssetLayer} Layer - The layer to check
 * @returns {AssetPoseName | NullPoseType} - The pose to use when drawing the given asset (or layer)
 */
function CommonDrawResolveAssetPose(C, Layer) {
	const poseEntries = CommonEntries(Layer.PoseMapping);
	const poses = poseEntries
		.filter((ij) => ij[1] !== PoseType.DEFAULT)
		.map((i) => i[0])
		.sort((p1, p2) => {
			const prio1 = PoseCategoryPriority[PoseRecord[p1]?.Category] ?? 0;
			const prio2 = PoseCategoryPriority[PoseRecord[p2]?.Category] ?? 0;
			return prio2 - prio1;
		});

	return CommonDrawFindPose(C, PoseToMapping.Array(poses, "Layer.PoseMapping"));
}

/**
 * A helper function used by the character drawing to track which resources it needed for a given character
 * @param {Character} C
 * @param {string | HTMLImageElement | HTMLCanvasElement} src
 */
function CommonDrawMarkDrawnAsset(C, src) {
	let URL = null;
	if (typeof src === "string") {
		URL = src;
	} else if (src instanceof HTMLImageElement) {
		URL = src.src;
	} else {
		return;
	}

	C.DrawnAssets.add(URL);
}

/**
 * A helper function that keeps drawn asset on a character in the cache
 */
function CommonDrawWarmDrawnAssets() {
	DrawLastCharacters.forEach((C) => {
		C.DrawnAssets.forEach((item) => {
			if (DrawImageCache.has(item)) {
				DrawImageCache.get(item);
			}
			if (GLDrawImageCache?.has(item)) {
				GLDrawImageCache?.get(item);
			}
		});
	});
}
