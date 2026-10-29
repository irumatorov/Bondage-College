"use strict";

/**
 * Namespace with functions for managing the layering sub screen
 *
 * Below is an example of some basic usage of the {@link Layering} subscreen,
 * including a `Click` function for initializing the screen and a set of
 * `Resize` and `Exit` functions for, respectively, handling the screens
 * drawing/resizing and exiting
 *
 * @namespace
 * @example
 *
 * let FancyScreenMode: "default" | "layering" = "default";
 *
 * // Make sure the fancy screen mode is changed back to its default upon exiting the layering subscreen
 * Layering.RegisterExitCallbacks({
 * 	screen: "FancyScreen",
 * 	callback: () => FancyScreenMode = "default",
 * });
 *
 * function FancyScreenClick() {
 * 	const C: Character;
 * 	const item: Item;
 * 		switch (FancyScreenMode) {
 * 		case "default": {
 * 			if Mousein(...) {
 * 				FancyScreenMode = "layering";
 * 				Layering.Init(C, item);
 * 			}
 * 			return;
 * 		}
 * 	}
 * }
 *
 * function FancyScreenResize(load) {
 * 	switch (FancyScreenMode) {
 * 		case "layering":
 * 			Layering.Resize(load);
 * 			return;
 * 	}
 * }
 *
 * function FancyScreenExit() {
 * 	switch (FancyScreenMode) {
 * 		case "layering":
 * 			Layering.Exit();
 * 			return;
 * 	}
 * }
 */
var Layering = {
	/**
	 * A set with all item property names that one may or may not assign via the layering subscreen
	 * @readonly
	 * @type {ReadonlySet<keyof ItemProperties>}
	 */
	PropertyNames: new Set(/** @type {const} */([
		"OverridePriority",
		"LayerTranslationX",
		"LayerTranslationY",
		"LayerScaleX",
		"LayerScaleY",
		"LayerRotation",
		"TranslationX",
		"TranslationY",
		"ScaleX",
		"ScaleY",
		"Rotation",
	])),

	/**
	 * Default, unmodified, item-specific property values.
	 *
	 * This value is purely dependant on the extended item's type, with all values being undefined for type-less or non-extended items.
	 * @type {null | Readonly<ItemProperties>}
	 */
	Defaults: null,

	/**
	 * The character in question
	 * @type {null | Character}
	 */
	Character: null,

	/**
	 * The currently active tab
	 * @type {"priority" | "translation" | "scale" | "rotate"}
	 */
	activeTab: "priority",

	/**
	 * The (rectangular) shape and inter-button gap of the layering screen
	 * @type {null | LayeringDisplay}
	 */
	Display: null,

	/**
	 * The selected item in question
	 * @type {null | Item}
	 */
	Item: null,

	/**
	 * Get or set whether the layering screen is readonly
	 * @type {boolean}
	 */
	get Readonly() {
		return this._Readonly;
	},
	set Readonly(value) {
		if (value !== this._Readonly && this.IsActive()) {
			this._ApplyReadonly(value);
		}
		this._Readonly = value;
	},

	/**
	 * Get the item's asset
	 * @readonly
	 * @type {Asset}
	 */
	get Asset() {
		if (!this.Item) throw new Error("called before Layering.Init()");
		return this.Item.Asset;
	},

	/**
	 * Get or set the items `Property.OverridePriority`
	 * @returns {undefined | AssetLayerOverridePriority}
	 */
	get OverridePriority() {
		if (!this.Item) throw new Error("called before Layering.Init()");
		return this.Item.Property.OverridePriority;
	},
	set OverridePriority(value) {
		if (!this.Item) throw new Error("called before Layering.Init()");
		this.Item.Property.OverridePriority = value;
	},

	/**
	 * Whether the layering screen is readonly or not
	 * @private
	 * @see {@link Layering.Readonly}
	 * @type {boolean}
	 */
	_Readonly: false,

	/**
	 * Update an item's property, optionally for a specific layer, and refresh the character.
	 * @param {Item} item - The item to update.
	 * @param {"Priority" | "TranslationX" | "TranslationY" | "ScaleX" | "ScaleY" | "Rotation"} propName - The property name (e.g., "Rotation", "ScaleX").
	 * @param {number} value - The new value.
	 * @param {LayerName} [layerName] - Optional layer name to update. If provided, updates layer-specific property.
	 */
	UpdateProperty(item, propName, value, layerName) {
		if (!this.Character) throw new Error("called before Layering.Init()");
		if (!item.Property) item.Property = {};

		if (layerName) {
			if (propName === "Priority") {
				if (!CommonIsObject(item.Property.OverridePriority)) {
					item.Property.OverridePriority = {};
				}
				item.Property.OverridePriority[layerName] = value;
			} else {
				(item.Property[`Layer${propName}`] ??= {})[layerName] = value;
			}
		} else {
			if (propName === "Priority") {
				item.Property.OverridePriority = value;
			} else {
				item.Property[propName] = value;
			}
		}
		this._CharacterRefresh(this.Character, false, false);
	},

	/**
	 * Return whether the layering sub screen has currently been initialized (be it either active or unloaded)
	 * @returns {this is typeof this & Pick<Required<typeof this>, "Character" | "Display" | "Item">}
	 */
	IsActive() { return !!document.getElementById(this.ID.root); },

	/**
	 * The default (rectangular) shape and inter-button gap of the layering screen
	 * @readonly
	 * @type {Readonly<LayeringDisplay>}
	 */
	DisplayDefault: Object.freeze({
		buttonGap: 20,
		x: 2000 - (9 * 110),
		y: 0,
		w: (9 * 110),
		h: 1000,
	}),

	/**
	 * The IDs of layering-specific DOM elements
	 * @readonly
	 */
	ID: Object.freeze({
		root: "layering",

		resetButton: "layering-reset-button",
		exitButton: "layering-exit-button",
		hideButton: "layering-hide-button",
		hideTooltip: "layering-hide-button-tooltip",
		lockButton: "layering-lock-button",

		assetHeader: "layering-asset-header",
		assetGrid: "layering-asset-grid",

		layerHeader: "layering-layer-header",
		layerDIV: "layering-layer-div",
		layerOuterGrid: "layering-layer-outer-grid",
	}),

	/**
	 * Screen-specific callbacks that will be executed after calling {@link Layering.Exit}.
	 *
	 * Used as helpers for setting up the next screen.
	 * @private
	 * @readonly
	 * @type {((screen: string, C: Character, item: Item) => void)[]}
	 * @see {@link Layering.RegisterExitCallbacks}
	 */
	_ExitCallbacks: [],

	/**
	 * Initialize the object-based variant of {@link AssetLayerOverridePriority}
	 * @private
	 */
	_InitOverridePriorityObject() {
		this.OverridePriority = {};
		const layerElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-layer-priority]"));
		for (const e of layerElements) {
			const value = e.valueAsNumber;
			if (!Number.isNaN(value) && value.toString() !== e.dataset.layerPriority) {
				this.OverridePriority[e.dataset.name ?? ""] = CommonClamp(Math.round(value), -99, 99);
			}
		}
	},

	/**
	 * @private
	 * @param {LayerName | AssetName} name - The name of the layer
	 * @param {number} priority - The stringified layer priority
	 * @param {string} defaultPriority - The stringified default priority of the layer
	 */
	_ApplyLayerPriority(name, priority, defaultPriority) {
		if (!this.OverridePriority || !this.Character) throw new Error("called before Layering.Init()");
		const old = CommonIsObject(this.OverridePriority) ? this.OverridePriority[name] : this.OverridePriority;
		if (!CommonIsObject(this.OverridePriority)) {
			this._UpdateInputColors("layer-priority");
			this._InitOverridePriorityObject();
		}
		// Should never happen; _InitOverridePriorityObject() turns that into an object
		if (!CommonIsObject(this.OverridePriority)) return;

		if (!Number.isNaN(priority) && priority.toString() !== defaultPriority) {
			this.OverridePriority[name] = CommonClamp(priority, -99, 99);
		} else {
			delete this.OverridePriority[name];
		}

		if (old !== this.OverridePriority[name]) {
			this._CharacterRefresh(this.Character, false, false);
		}
	},

	/**
	 * @private
	 * @param {number} priority - The layer priority
	 * @param {string} defaultPriority - The stringified default priority of the layer
	 */
	_ApplyAssetPriority(priority, defaultPriority) {
		if (!this.Character) throw new Error("called before Layering.Init()");
		const old = this.OverridePriority;
		if (!Number.isInteger(old)) {
			this._UpdateInputColors("asset-priority");
		}

		if (!Number.isNaN(priority) && priority.toString() !== defaultPriority) {
			this.OverridePriority = CommonClamp(Math.round(priority), -99, 99);
		} else {
			this.OverridePriority = undefined;
		}

		if (old !== this.OverridePriority) {
			this._CharacterRefresh(this.Character, false, false);
		}
	},

	/**
	 * Event listener for `input` events involving layer priorities
	 * @private
	 * @param {Event} event
	 */
	_LayerInputListener(event) {
		const target = /** @type {HTMLInputElement} */(event.target);
		this._ApplyLayerPriority(target.dataset.name ?? "", target.valueAsNumber, target.dataset.layerPriority ?? "");
	},

	/**
	 * Event listener for `input` events involving asset priorities
	 * @private
	 * @param {Event} event
	 */
	_AssetInputListener(event) {
		const target = /** @type {HTMLInputElement} */(event.target);
		this._ApplyAssetPriority(target.valueAsNumber, target.dataset.assetPriority ?? "");
	},

	/**
	 * A limited version of {@link CharacterRefresh}
	 * @private
	 */
	_CharacterRefresh: CommonLimitFunction(CharacterRefresh, 100, 100),

	/**
	 * Event listener for `click` events of the reset button
	 * @this {HTMLButtonElement}
	 * @param {Event} _event
	 * @private
	 */
	_ResetClickListener(_event) {
		if (!Layering.Character) throw new Error("called before Layering.Init()");

		const item = Layering.Item;
		const defaults = Layering.Defaults;
		if (!item || !defaults) {
			return;
		}

		// Reset UI
		switch (Layering.activeTab) {
			case "priority": {
				/** @type {NodeListOf<HTMLInputElement>} */
				const layerElements = document.querySelectorAll("input[data-layer-priority]");
				/** @type {NodeListOf<HTMLInputElement>} */
				const assetElements = (document.querySelectorAll("input[data-asset-priority]"));
				layerElements.forEach(e => e.value = e.dataset.layerPriority ?? "");
				assetElements.forEach(e => e.value = e.dataset.assetPriority ?? "");
				break;
			}
			case "rotate":
			case "scale":
			case "translation": {
				const container = document.getElementById("layering-content-container");
				if (container) {
					container.innerHTML = "";
					const content = Layering._GetTabContents(Layering.activeTab);
					content.forEach(c => container.appendChild(c));
					Layering._ApplyTranslations();
				}
				break;
			}
		}

		// Reset item property values
		switch (Layering.activeTab) {
			case "priority":
				item.Property.OverridePriority = defaults.OverridePriority == null ? undefined : CommonCloneDeep(defaults.OverridePriority);
				break;
			case "rotate":
				item.Property.Rotation = defaults.Rotation == null ? undefined : defaults.Rotation;
				item.Property.LayerRotation = defaults.LayerRotation == null ? undefined : CommonCloneDeep(defaults.LayerRotation);
				break;
			case "scale":
				item.Property.ScaleX = defaults.ScaleX == null ? undefined : defaults.ScaleX;
				item.Property.ScaleY = defaults.ScaleY == null ? undefined : defaults.ScaleY;
				item.Property.LayerScaleX = defaults.LayerScaleX == null ? undefined : CommonCloneDeep(defaults.LayerScaleX);
				item.Property.LayerScaleY = defaults.LayerScaleY == null ? undefined : CommonCloneDeep(defaults.LayerScaleY);
				break;
			case "translation":
				item.Property.TranslationX = defaults.TranslationX == null ? undefined : defaults.TranslationX;
				item.Property.TranslationY = defaults.TranslationY == null ? undefined : defaults.TranslationY;
				item.Property.LayerTranslationX = defaults.LayerTranslationX == null ? undefined : CommonCloneDeep(defaults.LayerTranslationX);
				item.Property.LayerTranslationY = defaults.LayerTranslationY == null ? undefined : CommonCloneDeep(defaults.LayerTranslationY);
				break;
		}
		Layering._CharacterRefresh(Layering.Character, false, false);
	},


	/**
	 * Event listener for `click` events of the show hidden layers button
	 * @this {HTMLButtonElement}
	 * @param {Event} _event
	 * @private
	 */
	_ShowLayersClickListener(_event) {
		if (!Layering.Character) throw new Error("called before Layering.Init()");

		const container = document.getElementById("layering-content-container");
		if (container) {
			container.innerHTML = "";
			const content = Layering._GetTabContents(Layering.activeTab);
			content.forEach(c => container.appendChild(c));
			Layering._ApplyTranslations();
		}

		Layering._CharacterRefresh(Layering.Character, false, false);
	},

	/**
	 * Update the background colors of the `number`-based input elements, the color change depending on whether one is changing an asset- or layer-specific priority.
	 * @private
	 * @param {"layer-priority" | "asset-priority"} activeType
	 */
	_UpdateInputColors(activeType) {
		const layerElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-layer-priority]"));
		const assetElements = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll("[data-asset-priority]"));
		if (activeType === "layer-priority") {
			layerElements.forEach(e => e.classList.remove("layering-input-unfocused"));
			assetElements.forEach(e => e.classList.add("layering-input-unfocused"));
		} else {
			layerElements.forEach(e => e.classList.add("layering-input-unfocused"));
			assetElements.forEach(e => e.classList.remove("layering-input-unfocused"));
		}
	},

	/**
	 * Cache for layering inputs to avoid DOM lookups
	 * @private
	 * @type {Record<string, HTMLInputElement[]>}
	 */
	_inputCache: {},

	/**
	 * Updates the input validation limits for all relevant inputs based on the current combined values.
	 * @private
	 */
	_UpdateLimits() {
		if (!this.Item) throw new Error("called before Layering.Init()");
		const props = /** @type {const} */ (["TranslationX", "TranslationY", "ScaleX", "ScaleY", "Rotation"]);
		const isPussy = this._IsPussy(this.Asset.Group);

		for (const prop of props) {
			const isScale = prop.startsWith('Scale');
			const isRotation = prop === 'Rotation';

			const minBound = isScale ? (isPussy ? 0.5 : 0.01) : (isRotation ? -180 : -500);
			const maxBound = isScale ? (isPussy ? 1.5 : 3.0) : (isRotation ? 180 : 500);

			// For Pussy/Penis uniform scale, use ScaleX as base for limits
			// FIXME: const baseProp = (isPussy && isScale) ? "ScaleX" : prop;
			// We need the *other* component to calculate the limit for the current component
			// FIXME: const otherComponent = prop === "ScaleX" ? "ScaleY" : (prop === "ScaleY" ? "ScaleX" : null);

			// Logic: CombinedScale = AssetScale * LayerScale
			// AllowedCombined = [0.5, 1.5]
			// Constraint: Min <= AssetScale * LayerScale <= Max

			const inputs = this._inputCache[prop] || [];
			for (const input of inputs) {
				// Identify if this is an asset-level input or layer-level input
				// FIXME: const isLayer = input.id.includes('Layer');

				/** @type {number} */
				let minAllowed;
				/** @type {number} */
				let maxAllowed;
				const assetVal = this.Item.Property?.[prop] ?? 0;
				if (isScale) {
					maxAllowed = maxBound / Math.max(0.1, assetVal);
					minAllowed = minBound / Math.max(0.1, assetVal);
				} else {
					// Translate/Rotate - Additive
					maxAllowed = maxBound - assetVal;
					minAllowed = minBound - assetVal;
				}

				input.max = maxAllowed.toString();
				input.min = minAllowed.toString();
			}
		}
	},

	/**
	 * Insert soft hyphens between all upper- and lower cased letters, signaling them as valid word break points.
	 * @private
	 * @param {string} txt
	 * @returns {string}
	 */
	_TextInsertBreakpoints(txt) {
		const softHyphen = "\u00AD";
		let ret = "";
		for (const i of txt) {
			if (i === i.toUpperCase() && ret) {
				ret += softHyphen;
			}
			ret += i;
		}
		return ret;
	},

	/**
	 * @private
	 * @param {"Scale" | "Rotation" | "Translation"} propType
	 * @param {("ScaleX" | "ScaleY" |"Rotation" | "TranslationX" | "TranslationY")[]} properties
	 * @param {number} min
	 * @param {number} max
	 * @param {number} step
	 * @param {number} defaultValue
	 * @param {boolean} isShowingHiddenLayers
	 * @param {Record<string, [min: number, max: number]>} [constraints]
	 * @returns {Element[]}
	 */
	_CreateTabContent(propType, properties, min, max, step, defaultValue, isShowingHiddenLayers, constraints = {}) {
		if (!this.Item || !this.Character) throw new Error("called before Layering.Init()");
		const item = this.Item;
		const character = this.Character;

		// Reset cache for this tab
		this._inputCache = {};

		return [
			{
				tag: /** @type {const} */("fieldset"),
				children: [{
					tag: /** @type {const} */("div"),
					classList: ["layering-pair", "layering-asset-pair"],
					children: [
						{
							tag: /** @type {const} */("label"),
							classList: ["layering-pair-text"],
							children: [InterfaceTextGet(`Layering${propType}`)],
						},
						{
							tag: /** @type {const} */("div"),
							classList: ["layering-inputs-group"],
							children: properties.map(prop => {
								const [propMin, propMax] = constraints[prop] ?? [min, max];
								return ({
									tag: "span",
									classList: ["layering-input-wrapper"],
									children: [
										{
											tag: "label",
											children: [propType === "Rotation" ? "" : (prop.endsWith('X') ? 'X:' : prop.endsWith('Y') ? 'Y:' : prop)],
											for: `layering-input-${prop}-item`,
										},
										{
											tag: "input",
											attributes: {
												type: "number",
												value: (this._IsPussy(this.Asset.Group) && propType === "Scale" ? (item.Property.ScaleX ?? defaultValue) : (item.Property[prop] ?? defaultValue)),
												step, min: propMin, max: propMax,
												id: `layering-input-${prop}-item`,
												class: `layering-input-${prop.replace(/[XY]/, '')} layering-number-input`,
												inputmode: (propType === 'Translation' || propType === 'Rotation' ? 'numeric' : 'decimal'),
											},
											eventListeners: {
												input: (/** @type {Event} */ event) => {
													const target = /** @type {HTMLInputElement} */(event.target);
													const val = target.valueAsNumber;
													const minLimit = parseFloat(target.min);
													const maxLimit = parseFloat(target.max);
													const clampedVal = Number.isNaN(val) ? defaultValue : Math.max(minLimit, Math.min(maxLimit, val));

													// Uniform scale for Pussy/Penis
													if (this._IsPussy(this.Asset.Group) && propType === "Scale") {
														item.Property.ScaleX = clampedVal;
														item.Property.ScaleY = clampedVal;
													} else {
														item.Property[prop] = clampedVal;
													}
													target.value = clampedVal.toString();
													this._CharacterRefresh(character, false, false);
													this._UpdateLimits();
												},
											},
										},
									],
								});
							}),
						}
					],
				}],
			},
			{ tag: /** @type {const} */("h2"), children: [InterfaceTextGet(`LayeringLayer${propType}`)] },
			...this.Asset.Layer.map(layer => this._CreateLayerFieldset(layer, propType, properties, min, max, step, defaultValue, isShowingHiddenLayers, constraints))
		].map(/** @type {never} */(ElementCreate));
	},

	/**
	 * @private
	 * @param {AssetLayer} layer
	 * @param {"Rotation" | "Scale" | "Translation"} propType
	 * @param {("ScaleX" | "ScaleY" |"Rotation" | "TranslationX" | "TranslationY")[]} properties
	 * @param {number} min
	 * @param {number} max
	 * @param {number} step
	 * @param {number} defaultValue
	 * @param {boolean} isShowingHiddenLayers
	 * @param {Record<string, [min: number, max: number]>} constraints
	 */
	_CreateLayerFieldset(layer, propType, properties, min, max, step, defaultValue, isShowingHiddenLayers, constraints) {
		if (!this.Item || !this.Character) throw new Error("called before Layering.Init()");
		const item = this.Item;
		const character = this.Character;
		const layerName = layer.Name ?? "";
		const isVisible = CharacterAppearanceIsLayerVisible(character, CharacterAppearanceGetItemLayer(item, layer), layer.Asset, item.Property?.TypeRecord);
		return {
			tag: "fieldset",
			classList: ["layering-layer-fieldset"],
			attributes: { hidden: !isShowingHiddenLayers && !isVisible },
			children: [
				{
					tag: "div",
					classList: ["layering-pair"],
					children: [
						{
							tag: "label",
							classList: ["layering-pair-text", "layering-layer-name"],
							children: [Layering._TextInsertBreakpoints(layer.Name ?? this.Asset.Name)],
						},
						{
							tag: "div",
							classList: ["layering-inputs-container"],
							children: properties.map(prop => {
								const [propMin, propMax] = constraints[prop] ?? [min, max];

								// Create the input element configuration
								const inputConfig = {
									tag: "input",
									attributes: {
										type: "number",
										value: (this._IsPussy(this.Asset.Group) && propType === "Scale" ? ((item.Property.LayerScaleX ?? {})[layerName] ?? defaultValue) : ((item.Property[`Layer${prop}`] ?? {})[layerName] ?? defaultValue)),
										step, min: propMin, max: propMax,
										id: `layering-input-${prop}-${layerName}`,
										class: `layering-input-${prop.replace(/[XY]/, '')} layering-number-input`,
										inputmode: (propType === 'Translation' || propType === 'Rotation' ? 'numeric' : 'decimal'),
									},
									eventListeners: {
										input: (/** @type {Event} */ event) => {
											const target = /** @type {HTMLInputElement} */(event.target);
											const val = target.valueAsNumber;
											const clampedVal = Number.isNaN(val) ? defaultValue : Math.max(propMin, Math.min(propMax, val));

											// Uniform scale for Pussy/Penis layers
											if (this._IsPussy(this.Asset.Group) && propType === "Scale") {
												(item.Property.LayerScaleX ??= {})[layerName] = clampedVal;
												(item.Property.LayerScaleY ??= {})[layerName] = clampedVal;
											} else {
												(item.Property[`Layer${prop}`] ??= {})[layerName] = clampedVal;
											}
											target.value = clampedVal.toString();
											this._CharacterRefresh(character, false, false);
											this._UpdateLimits();
										},
									},
								};

								// Register in cache AFTER element creation
								// We need the ID to be present, and this is called by ElementCreate
								// So we push a function to register it once created.
								// Actually, let's just add a temporary ID reference or find it later.
								// A better way is to add it to cache after the DOM is fully rendered.
								// For now, let's just use the current approach of find in `_UpdateLimits`
								// or build a map in `Load`.
								// Since this is called in `_GetTabContents`, let's do it there.

								return ({
									tag: "span",
									classList: ["layering-input-wrapper"],
									children: [
										{ tag: "label", children: [prop.endsWith('X') ? 'X:' : prop.endsWith('Y') ? 'Y:' : ''], attributes: { for: `layering-input-${prop}-${layerName}` } },
										inputConfig,
									],
								});
							}),
						},
					],
				},
			],
		};
	},

	/**
	 * @private
	 * @param {AssetGroup} group
	 * @returns {boolean}
	 */
	_IsBlacklisted(group) {
		return !group.AllowNone && !this._IsPussy(group);
	},

	/**
	 * @private
	 * @param {AssetGroup} group
	 * @returns {boolean}
	 */
	_IsPussy(group) {
		return group.Name === "Pussy";
	},

	/**
	 * @private
	 * @param {"priority" | "translation" | "scale" | "rotate"} tabKey
	 * @returns {Element[]}
	 */
	_GetTabContents(tabKey) {
		if (!this.Character) throw new Error("called before Layering.Init()");
		const character = this.Character;

		const itemPriority = typeof this.OverridePriority === "number" ? this.OverridePriority : this.Asset.Group.DrawingPriority;
		const hideButton = document.getElementById(this.ID.hideButton);
		const isShowingHiddenLayers = hideButton?.getAttribute("aria-checked") === "true";

		// Block transformations for blacklisted groups
		if (this._IsBlacklisted(this.Asset.Group) && tabKey !== 'priority') {
			return [ElementCreate({ tag: "h2", children: [InterfaceTextGet("LayeringTransformationDisabled")] })];
		}

		// Pussy constraints
		let content;
		if (this._IsPussy(this.Asset.Group) && tabKey !== 'priority') {
			if (tabKey === 'translation') {
				content = this._CreateTabContent("Translation", ["TranslationX", "TranslationY"], 0, 0, 1, 0, isShowingHiddenLayers, { TranslationY: [-20, 20] });
			} else if (tabKey === 'scale') {
				// Pussy/Penis uniform scale, 0.5 - 1.5 cap
				content = this._CreateTabContent("Scale", ["ScaleX", "ScaleY"], 0.5, 1.5, 0.01, 1.0, isShowingHiddenLayers);
			} else {
				return [ElementCreate({ tag: "h2", children: [InterfaceTextGet("LayeringTransformationDisabled")] })];
			}
		} else {
			// Regular tabs
			/** @satisfies {Record<typeof tabKey, Element[]>} */
			const tabMap = {
				priority: [
					ElementCreate({
						tag: /** @type {const} */("fieldset"),
						children: [
							{
								tag: /** @type {const} */("div"),
								classList: ["layering-pair", "layering-asset-pair"],
								children: [
									{
										tag: /** @type {const} */("label"),
										classList: ["layering-pair-text"],
										children: [InterfaceTextGet("LayeringPriority")],
									},
									{
										tag: /** @type {const} */("input"),
										attributes: { type: "number", value: itemPriority, id: "layering-input-asset", inputmode: "numeric" },
										dataAttributes: { assetPriority: itemPriority },
										eventListeners: {
											input: (/** @type {Event} */ event) => {
												this._ApplyAssetPriority(/** @type {HTMLInputElement} */(event.target).valueAsNumber, "-99");
												this._CharacterRefresh(character, false, false);
											},
										},
									},
								],
							},
						],
					}),
					ElementCreate({ tag: /** @type {const} */("h2"), children: [InterfaceTextGet("LayeringLayerPriority")] }),
					this._BuildLayerPriorityFieldset(isShowingHiddenLayers),
				],
				translation: this._CreateTabContent("Translation", ["TranslationX", "TranslationY"], -500, 500, 1, 0, isShowingHiddenLayers),
				scale: this._CreateTabContent("Scale", ["ScaleX", "ScaleY"], 0.1, 3.0, 0.01, 1.0, isShowingHiddenLayers),
				rotate: this._CreateTabContent("Rotation", ["Rotation"], -180, 180, 1, 0, isShowingHiddenLayers),
			};
			content = tabMap[tabKey];
		}

		// After content is generated, populate the input cache
		this._inputCache = {};
		const inputs = document.querySelectorAll('.layering-number-input');
		inputs.forEach(input => {
			const id = input.id;
			for (const prop of ["TranslationX", "TranslationY", "ScaleX", "ScaleY", "Rotation", "priority"]) {
				if (id.includes(prop) || (prop === "priority" && id.includes("priority"))) {
					this._inputCache[prop] ??= [];
					this._inputCache[prop].push(/** @type {HTMLInputElement} */(input));
				}
			}
		});

		return content;
	},

	/**
	 * Helper to build priority fieldset to avoid repetition
	 * @param {boolean} isShowingHiddenLayers
	 * @private
	 */
	_BuildLayerPriorityFieldset(isShowingHiddenLayers) {
		if (!this.Item || !this.Character) throw new Error("called before Layering.Init()");
		const item = this.Item;
		const character = this.Character;

		const layerGroupings = this._GroupLayers(this.Asset.Layer);
		return ElementCreate({
			tag: /** @type {const} */("fieldset"),
			attributes: { id: this.ID.layerDIV, "aria-labelledby": this.ID.layerHeader },
			children: [
				{
					tag: /** @type {const} */("div"),
					attributes: { id: this.ID.layerOuterGrid },
					children: /** @type {HTMLOptionsUnion[]} */(Object.entries(layerGroupings).map(([layerGroupName, layerList]) => {
						const headingID = ElementGenerateID();
						return {
							tag: /** @type {const} */("fieldset"),
							classList: ["layering-layer-inner-grid"],
							attributes: { "aria-labelledby": headingID },
							children: [
								{
									tag: /** @type {const} */("legend"),
									dataAttributes: { layeringGroup: layerGroupName },
									children: [layerGroupName],
								},
								.../** @type {HTMLOptionsUnion[]} */(layerList.map((layer) => {
									const name = layer.Name ?? "";
									const inputValue = (CommonIsObject(this.OverridePriority) ? this.OverridePriority[name]: this.OverridePriority) ?? layer.Priority;
									return {
										tag: /** @type {const} */("div"),
										classList: ["layering-pair"],
										attributes: { hidden: !isShowingHiddenLayers && !CharacterAppearanceIsLayerVisible(character, CharacterAppearanceGetItemLayer(item, layer), layer.Asset, item.Property?.TypeRecord) },
										children: [
											{
												tag: /** @type {const} */("label"),
												attributes: { for: `layering-input-${layerGroupName}-${name}` },
												classList: ["layering-pair-text"],
												children: [Layering._TextInsertBreakpoints(layer.Name ?? this.Asset.Name)],
											},
											{
												tag: /** @type {const} */("input"),
												attributes: { type: "number", value: inputValue, id: `layering-input-${layerGroupName}-${name}`, inputmode: "numeric" },
												dataAttributes: { name, layerPriority: layer.Priority },
												eventListeners: {
													input: (/** @type {Event} */ event) => {
														const target = /** @type {HTMLInputElement} */(event.target);
														this._ApplyLayerPriority(name, target.valueAsNumber, "-99");
														this._CharacterRefresh(character, false, false);
													},
												},
											},
										],
									};
								})),
							],
						};
					})),
				},
			],
		});
	},

	/**
	 * Group all layers by their {@link AssetLayer.CopyLayerColor} properties
	 * @private
	 * @param {readonly AssetLayer[]} layers
	 * @returns {Record<"" | LayerName, AssetLayer[]>}
	 */
	_GroupLayers(layers) {
		/** @type {Record<"" | LayerName, AssetLayer[]>} */
		const ret = {};
		for (const layer of layers) {
			const name = layer.CopyLayerColor ?? layer.Name ?? "";
			ret[name] ??= [];
			ret[name].push(layer);
		}

		for (const layerList of Object.values(ret)) {
			layerList.sort((l1, l2) => {
				const name1 = l1.Name ?? l1.Asset.Name;
				const name2 = l2.Name ?? l2.Asset.Name;
				return name1.localeCompare(name2);
			});
		}
		return ret;
	},

	/**
	 * Return the default item property values for those specified in {@link Layering.PropertyNames}.
	 *
	 * Values are generally undefined, with the extended item options of certain items overwriting them.
	 * @private
	 * @returns {ItemProperties}
	 */
	_GetDefaults() {
		if (!this.Item || !this.Character) throw new Error("called before Layering.Init()");
		if (!this.Item.Property.TypeRecord) {
			return {};
		}

		// Recreate the items default state (given a provided type record) and extract its default priority
		const item = AppearanceItem.fromAsset(this.Item.Asset);
		ExtendedItemInit(this.Character, item, false, false);
		ExtendedItemSetOptionByRecord(this.Character, item, this.Item.Property.TypeRecord, { push: false, refresh: false });
		return CommonPick(item.Property, Layering.PropertyNames);
	},

	/**
	 * Update all input elements and buttons with the passed {@link Layering.Readonly} status.
	 * @param {boolean} isReadonly
	 * @private
	 */
	_ApplyReadonly(isReadonly) {
		/** @type {NodeListOf<HTMLFieldSetElement>} */
		const elements = document.querySelectorAll(`#${Layering.ID.root} fieldset`);

		document.getElementById(this.ID.resetButton)?.setAttribute("aria-disabled", isReadonly);
		for (const e of Array.from(elements)) {
			e.disabled = isReadonly;
		}

		const lockButton = document.getElementById(this.ID.lockButton);
		lockButton?.toggleAttribute("hidden", !isReadonly);
	},

	/**
	 * Initialize the layering subscreen
	 * @param {Item} item - The affected item
	 * @param {Character} character - The item's owning character
	 * @param {null | Partial<LayeringDisplay>} display - The shape of the layering subscreen
	 * @param {boolean} reload - Whether we're loading or reloading the screen.
	 * A reload pushes any current changes towards the server and reinitializes all DOM elements.
	 * @param {boolean} readonly - Mark the subscreen as readonly.
	 * @returns {Promise<HTMLDivElement>} The div containing the layering subscreen
	 */
	async Init(item, character, display=null, reload=false, readonly=false) {
		if (this.IsActive()) {
			if (reload) {
				this.Exit(true);
			} else {
				console.error('Layering screen is already active; re-initialization requires passing the "reload" parameter');
				return /** @type {HTMLDivElement} */(document.getElementById(this.ID.root));
			}
		}

		this.Item = item;
		this.Item.Property ??= {};
		this.Character = character;
		this.activeTab = "priority";
		this.Display = {
			...this.DisplayDefault,
			...(display ?? {}),
		};
		this.Readonly = readonly;
		await this.Load();
		return /** @type {HTMLDivElement} */(document.getElementById(this.ID.root));
	},

	/**
	 * Apply translation to the layering screen
	 * @private
	 */
	_ApplyTranslations() {
		if (!this.Item || !this.Character) throw new Error("called before Layering.Init()");
		TextCache.buildAsync(`Assets/LayerNames.csv`).then((cache) => {
			const headers = /** @type {NodeListOf<HTMLHeadingElement>} */(document.querySelectorAll("[data-layering-group]"));
			headers.forEach(h => {
				const key = `${this.Asset.DynamicGroupName}${this.Asset.Name}${h.dataset.layeringGroup}`;
				h.innerText = cache.cache[key] ?? (h.dataset.layeringGroup || this.Asset.Description);
			});
		}).catch((e) => {
			console.error(e);
		});
	},

	/** @type {ScreenLoadHandler} */
	async Load() {
		if (!this.Item || !this.Character) throw new Error("called before Layering.Init()");
		const cache = await TextCache.buildAsync(`Assets/LayerNames.csv`);

		let root = document.getElementById(this.ID.root);
		if (root != null) {
			root.toggleAttribute("hidden", false);
			this.Resize(true);
			return;
		}

		this.Defaults = this._GetDefaults();

		const tabs = {
			priority: "Layer",
			translation: "Move",
			scale: "Resize",
			rotate: "Rotate",
		};

		const mainContentFieldset = ElementCreate({
			tag: /** @type {const} */("fieldset"),
			attributes: { name: "layering", "aria-labelledby": this.ID.assetHeader },
			children: [
				ElementMenu.Create(
					ElementGenerateID(),
					CommonEntries(tabs).map(([key, label]) => {
						const btn = ElementButton.Create(
							`layering-tab-${key}`,
							() => {
								this.activeTab = key;
								const container = document.getElementById("layering-content-container");
								if (container) {
									container.innerHTML = "";
									const content = this._GetTabContents(this.activeTab);
									content.forEach(c => container.appendChild(c));
									this._ApplyTranslations();
								}
							},
							{ ariaChecked: key === this.activeTab, role: "menuitemradio" },
						);
						btn.classList.add("layering-tab-button");
						btn.innerText = label;
						return btn;
					}),
					undefined,
					{ menu: { classList: ["layering-tabs"] } },
				),
				{
					tag: /** @type {const} */("div"),
					attributes: { id: "layering-content-container" },
					children: this._GetTabContents("priority")
				}
			]
		});

		root = ElementDOMScreen.getTemplate(
			this.ID.root,
			{
				header: TextSubstitute(
					"LayeringAsset",
					{ "{asset}": ElementCreate({ tag: "q", children: [this.Asset.Description] }) },
					{ textCache: TextAllScreenCache.get(InterfaceStringsPath) },
				),

				menubarButtons: [
					ElementButton.Create(
						this.ID.exitButton,
						() => this.Exit(),
						{ tooltip: InterfaceTextGet("LayeringExit"), image: "Icons/Exit.png" },
					),
					ElementButton.Create(
						this.ID.resetButton,
						this._ResetClickListener,
						{ tooltip: InterfaceTextGet("LayeringReset"), image: "Icons/Reset.png" },
					),
					ElementButton.Create(
						this.ID.hideButton, this._ShowLayersClickListener,
						{ role: "menuitemcheckbox", image: "Icons/Visibility.png", ariaChecked: false },
						{
							tooltip: { children: [
								{ tag: "span", attributes: { id: `${this.ID.hideTooltip}-hide` }, children: [InterfaceTextGet("LayeringHide")] },
								{ tag: "span", attributes: { id: `${this.ID.hideTooltip}-show` }, children: [InterfaceTextGet("LayeringShow")] },
							]},
						},
					),
					ElementButton.Create(
						this.ID.lockButton,
						() => null,
						{ tooltip: InterfaceTextGet("LayeringLock"), image: "Icons/Lock.png", disabled: true },
					),
				],
				mainContent: [mainContentFieldset],
			},
		);

		root.setAttribute("aria-busy", "true");
		document.body.append(root);

		// Manually set translated text for headers
		const headers = /** @type {NodeListOf<HTMLHeadingElement>} */(root.querySelectorAll("[data-layering-group]"));
		headers.forEach(h => {
			const key = `${this.Asset.DynamicGroupName}${this.Asset.Name}${h.dataset.layeringGroup}`;
			h.innerText = cache.cache[key] ?? (h.dataset.layeringGroup || this.Asset.Description);
		});
		root.setAttribute("aria-busy", "false");

		this.Resize(true);
		this._ApplyReadonly(this.Readonly);
	},

	/**
	 * Can be also be used, alternatively, as a {@link ScreenFunctions.Draw} function
	 * @type {ScreenResizeHandler}
	 */
	Resize(_load) {
		if (!this.Display) throw new Error("called before Layering.Init()");
		ElementPositionFixed(this.ID.root, this.Display.x, this.Display.y, this.Display.w, this.Display.h);
	},

	/** @type {ScreenUnloadHandler} */
	Unload() {
		// Need the null check here due to `CommonSetScreen` calling `Unload` after `Exit`
		document.getElementById(this.ID.root)?.toggleAttribute("hidden", true);
	},

	/**
	 * @satisfies {ScreenExitHandler}
	 * @param {boolean} reload - Whether the exit call is part of a reload (see {@link Layering.Init})
	 */
	Exit(reload=false) {
		if (!this.Character || !this.Item) throw new Error("called before Layering.Init()");
		ElementRemove(this.ID.root);

		if (!reload) {
			for (const func of this._ExitCallbacks) {
				func(CurrentScreen, this.Character, this.Item);
			}
		}

		this.Item = null;
		this.Character = null;
		this.Display = null;
		this._Readonly = false;
		this.Defaults = null;
	},

	/**
	 * Register screen-specific callbacks to-be executed after calling {@link Layering.Exit}.
	 *
	 * Callbacks registered herein must be used _exclusively_ for setting up the next screen, and not for tearing down the layering sub screen.
	 * As such, they are ignored when performing a reload of the layering sub screen (see {@link Layering.Init})
	 * @param {readonly LayeringExitOptions[]} options
	 */
	RegisterExitCallbacks(...options) {
		for (let { screen, callback } of options) {
			if (screen) {
				callback ??= CommonNoop;
				this._ExitCallbacks.push((currentScreen, ...args) => currentScreen === screen ? callback?.(...args) : undefined);
			} else if (callback) {
				this._ExitCallbacks.push((_currentScreen, ...args) => callback?.(...args));
			}
		}
	},
};

Layering.RegisterExitCallbacks(
	{
		screen: "Crafting",
		callback: (_C, item) => {
			if (!CraftingSelectedItem) return;
			for (const propName of Layering.PropertyNames) {
				/** @type {Unknown<ItemProperties>} */(CraftingSelectedItem.ItemProperty)[propName] = item.Property[propName];
			}
			CraftingModeSet("Name");
		},
	},
	{
		callback: (C, item) => {
			if (DialogMenuMode === "layering") {
				DialogChangeMode("items");
				ChatRoomCharacterItemUpdate(C, item.Asset.Group.Name);
				if (C.IsPlayer()) {
					ServerPlayerAppearanceSync();
				}
			}
		},
	},
	{
		screen: "Shop2",
		callback: () => {
			Shop2Vars.Mode = "Preview";
			CommonPromiseCatch(Shop2Load());
		},
	},
);
