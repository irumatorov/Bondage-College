"use strict";

/**
 * Callback to be executed upon exiting the color picker subscreen.
 * @type {null | ItemColorExitListener}
 */
let ColorPickerExitCallback = null;

// NOTE: Do not attach this one as a proper event listener as we need to be able to easily swap it
/**
 * The input callback to be executed upon color or opacity changes.
 * This callback should be responsible for propagating the updated element state to external variables (_e.g._ {@link ItemColorState}).
 * @type {null | ColorPickerInitOptions["onInput"]}
 */
let ColorPickerInputCallback = null;

/**
 * The default saved custom colors (see {@link GetDefaultSavedColors})
 * @type {HSVColor[]}
 */
var DefaultSavedColors = [];

/** The number of colors a player is allowed to save (see {@link DefaultSavedColors} and {@link PlayerCharacter.SavedColors}) */
const ColorPickerNumSaved = 18; //

/**
 * Parameters to be passed to {@link ColorPickerLoad}.
 * Do _not_ modify directly; use {@link ColorPickerInit} instead.
 * @type {null | Readonly<ColorPickerInitOptions>}
 */
let ColorPickerInitOptions = null;

/**
 * Gets the coordinates of the current event on the canvas
 * @deprecated
 * @param {MouseEvent|TouchEvent} Event - The touch/mouse event
 * @returns {{X: number, Y: number}} - Coordinates of the click/touch event on the canvas
 */
function ColorPickerGetCoordinates(Event) {
	return { X: 0, Y: 0 };
}

/**
 * Hide the color picker from the canvas.
 * @returns {void} - Nothing
 */
function ColorPickerHide() {
	ColorPickerUnload();
}

/**
 * Draws the color picker on the canvas
 * @param {number} X - Coordinate on the X axis
 * @param {number} Y - Coordinate on the Y axis
 * @param {number} Width - Width of the color picker
 * @param {number} Height - Height of the color picker
 * @param {HTMLInputElement} Src - Input element that can contain a hex color code
 * @param {ItemColorExitListener} [Callback] - Callback to execute when the selected color changes
 * @returns {void} - Nothing
 * @deprecated
 */
function ColorPickerDraw(X, Y, Width, Height, Src, Callback) {
}

/**
 * Parses a hex color code and converts it to a HSV object
 * @param {HexColor} Color - The RGB or RGBA hex color code
 * @param {HSVColor} [DefaultHSV] - The HSV to output if the color is not valid
 * @returns {HSVColor} - The HSV color from a hex color code
 * @see {@link https://gist.github.com/mjackson/5311256}
 */
function ColorPickerCSSToHSV(Color, DefaultHSV) {
	Color = Color || "#FFFFFF";
	var M = Color.match(/^#(([0-9a-f]{3})|([0-9a-f]{6})|([0-9a-f]{8}))$/i);
	var [R, G, B] = [NaN, NaN, NaN];
	if (M) {
		var GRP = M[1];
		if (GRP.length == 3) {
			R = Number.parseInt(GRP[0] + GRP[0], 16) / 255;
			G = Number.parseInt(GRP[1] + GRP[1], 16) / 255;
			B = Number.parseInt(GRP[2] + GRP[2], 16) / 255;
		} else {
			R = Number.parseInt(GRP[0] + GRP[1], 16) / 255;
			G = Number.parseInt(GRP[2] + GRP[3], 16) / 255;
			B = Number.parseInt(GRP[4] + GRP[5], 16) / 255;
		}
	}

	if (isNaN(R) || isNaN(G) || isNaN(B)) {
		return DefaultHSV ? DefaultHSV : { H: 0, S: 0, V: 1 };
	}

	var Max = Math.max(R, G, B);
	var Min = Math.min(R, G, B);
	var D = Max - Min;
	var H = 0;
	var S = (Max == 0) ? 0 : D / Max;
	var V = Max;

	if (D == 0) {
		H = 0;
	} else {
		if (Max == R) {
			H = (G - B) / D + (G < B ? 6 : 0);
		} else if (Max == G) {
			H = (B - R) / D + 2;
		} else {
			H = (R - G) / D + 4;
		}
		H /= 6;
	}

	return { H: H, S: S, V: V };
}

/**
 * Converts a HSV object into a valid hex code to use in the css
 * @param {HSVColor} HSV - HSV value to convert
 * @returns {HexColor} - Hex color code corresponding to the given HSV
 */
function ColorPickerHSVToCSS(HSV) {
	var [R, G, B] = [NaN, NaN, NaN];
	var H = HSV.H, S = HSV.S, V = HSV.V;
	var I = Math.floor(H * 6);
	var F = H * 6 - I;
	var P = V * (1 - S);
	var Q = V * (1 - F * S);
	var T = V * (1 - (1 - F) * S);

	switch (I % 6) {
		case 0: R = V; G = T; B = P; break;
		case 1: R = Q; G = V; B = P; break;
		case 2: R = P; G = V; B = T; break;
		case 3: R = P; G = Q; B = V; break;
		case 4: R = T; G = P; B = V; break;
		case 5: R = V; G = P; B = Q; break;
	}

	var RS = Math.floor(R * 255).toString(16).toUpperCase().padStart(2, "0");
	var GS = Math.floor(G * 255).toString(16).toUpperCase().padStart(2, "0");
	var BS = Math.floor(B * 255).toString(16).toUpperCase().padStart(2, "0");
	return `#${RS}${GS}${BS}`;
}

/**
 * Translates a CSS hex color into the uppercase `#RRGGBB` and `[0, 1]` opacity used by the color picker.
 * `#RGB` is expanded. `#RRGGBBAA` keeps its alpha byte; shorter hex is fully opaque.
 * @param {string | undefined} color
 * @returns {null | { color: HexColor, opacity: number }} `null` when `color` is not a hex color
 */
function ColorPickerCSSToColor(color) {
	const parsed = ColorPicker._setColorParseColor({ colorString: color ?? "" }, null, null);
	if (!parsed.hsv || !CommonIsColor(parsed.output)) return null;
	const alpha = ColorPicker._setColorParseOpacity({ colorString: color ?? "" });
	return { color: /** @type {HexColor} */(parsed.output), opacity: (alpha ?? 255) / 255 };
}

/**
 * Translates a color-picker color and `[0, 1]` opacity back into a CSS hex color.
 * Fully opaque colors omit the alpha byte.
 * @param {string} color
 * @param {number} opacity
 * @returns {null | HexColor} `null` when `color` is not a hex color or `opacity` is not a finite number
 */
function ColorPickerColorToCSS(color, opacity) {
	if (!CommonIsFinite(opacity, 0, 1)) return null;
	const parsed = ColorPicker._setColorParseColor({ colorString: color }, null, Math.round(opacity * 255));
	return parsed.hsv && CommonIsColor(parsed.output, { allowAlpha: true }) ? /** @type {HexColor} */(parsed.output) : null;
}

/**
 * Returns the array of default colors for the list of favorite colors.
 * @returns {HSVColor[]} - Array of default colors
 */
function GetDefaultSavedColors() {

	if (DefaultSavedColors.length == 0) { //sets custom default values if not set yet
		DefaultSavedColors[0] = {H: 0, S: 0, V: 0.12549019607843137};
		DefaultSavedColors[1] = {H: 0, S: 0, V: 0.5019607843137255};
		DefaultSavedColors[2] = {H: 0, S: 0, V: 0.7333333333333333};
		DefaultSavedColors[3] = {H: 0, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[4] = {H: 0.3333333333333333, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[5] = {H: 0.6666666666666666, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[6] = {H: 0.16666666666666666, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[7] = {H: 0.5, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[8] = {H: 0.8333333333333334, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[9] = {H: 0, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[10] = {H: 0.3333333333333333, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[11] = {H: 0.6666666666666666, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[12] = {H: 0.16666666666666666, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[13] = {H: 0.5, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[14] = {H: 0.8333333333333334, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[15] = {H: 0, S: 0, V: 0.12549019607843137};
		DefaultSavedColors[16] = {H: 0, S: 0, V: 0.5019607843137255};
		DefaultSavedColors[17] = {H: 0, S: 0, V: 0.7333333333333333};
		DefaultSavedColors[18] = {H: 0, S: 0.24705882352941172, V: 0.6666666666666666};

		for (let i = 0; i < ColorPickerNumSaved; i++) { //fill rest of slots with white
			if (typeof DefaultSavedColors[i] != "object") {
				DefaultSavedColors[i] = {H: 0, S: 0, V: 1};
			}
		}
	}

	var SavedColors = [];
	for (let i = 0; i < ColorPickerNumSaved; i++) {
		SavedColors[i] = { ...DefaultSavedColors[i]};
	}
	return SavedColors;
}

/** Namespace for constructing and managing color pickers */
var ColorPicker = {
	/**
	 * Element IDs for the {@link ColorPicker} namespace.
	 * @readonly
	 */
	ids: Object.freeze({
		root: "color-picker",
	}),

	/**
	 * The default shape of the color picker screen
	 * @readonly
	 * @type {Readonly<RectTuple>}
	 */
	defaultShape: Object.freeze([1090, 15, 910, 970]),

	/**
	 * A weakmap mapping color picker root elements to their respective {@link ScreenResizeHandler} shape
	 * @readonly
	 * @private
	 * @type {WeakMap<Element, Readonly<RectTuple>>}
	 */
	_shapes: new WeakMap,

	/**
	 * @readonly
	 * @satisfies {Record<string, (this: HTMLElement, ev: Event) => any>}
	 */
	eventListeners: {
		/** @type {(this: HTMLInputElement | HTMLColorTintElement, ev: Event) => void} */
		inputColor: function (ev) {
			if (this.validity.valid) {
				this.closest("fieldset")?.dispatchEvent(new CustomEvent("input", { detail: { source: this.name } }));
			}
		},

		/** @type {(this: HTMLInputElement, ev: FocusEvent) => void} */
		focusColor: function (ev) {
			this.setSelectionRange(0, this.value.length);
		},

		/** @type {(this: HTMLInputElement | HTMLColorTintElement, ev: FocusEvent) => void} */
		blurColor: function (ev) {
			this.reportValidity();
		},

		/**
		 * Perform a color or opacity change originating from manually dispatched events by the underlying inputs.
		 * Execute the logic on the fieldset because the states of the underlying inputs are _very_ strongly intertwined.
		 *
		 * See {@link ColorPicker.blurColor.inputItemColor} for the (default) callback responsible for coupling the input changes to `ItemColor...` variable states.
		 * @type {(this: HTMLFieldSetElement, ev: Event) => void}
		 */
		inputFieldset: function (ev) {
			const elements = ColorPicker._unpackColorPickerFieldset(this, { checkValidity: true });
			if (elements == null) {
				ev.stopImmediatePropagation();
				return;
			} else if (!(ev instanceof CustomEvent)) {
				return;
			}
			const [hueInput, opacityInput, tintInput, outputInput] = [elements.hue, elements.opacity, elements.tint, elements.output];

			switch (ev.detail.source) {
				case "output": {
					if (!CommonIsColor(outputInput.value, { allowAlpha: true })) {
						break;
					}
					const rgb = CommonColorTrimAlpha(outputInput.value);

					const opacityMin = CommonParseInt(opacityInput.min, 10) ?? 0;
					const opacityMax = CommonParseInt(opacityInput.max, 10) ?? Infinity;
					const opacityCandidate = CommonParseInt(outputInput.value.slice(7), 16);
					if (!opacityInput.disabled) {
						if (opacityCandidate != null) {
							opacityInput.valueAsNumber = CommonClamp(opacityCandidate, opacityMin, opacityMax);
						} else {
							opacityInput.value = opacityInput.max;
						}
					}

					const hsv = ColorPickerCSSToHSV(rgb);
					hueInput.valueAsNumber = Math.round(hsv.H * 360);
					this.style.setProperty("--hue", hueInput.value);
					tintInput.value = rgb;
					break;
				}
				case "opacity":
				case "tint":
				case "hue": {
					const hsv = {
						H: hueInput.validity.valid ? hueInput.valueAsNumber / 360 : 0,
						S: tintInput.validity.valid ? tintInput.saturation / 255 : 0,
						V: tintInput.validity.valid ? tintInput.brightness / 255 : 1,
					};

					// If we're dealing with an `opacity`-triggered input event:
					// (1 Only modify the output textbox if it is backed by valid hex color (so no `Default`, `White`, etc)
					// (2 Do not touch the hue or tint inputs, as this could potentially erase aforementioned non-hex colors
					if (ev.detail.source !== "opacity" || CommonIsColor(outputInput.value.slice(0, 7))) {
						// Simplify RGBA to RGB when fully opaque
						const opacity = opacityInput.validity.valid && opacityInput.valueAsNumber < 255 ? opacityInput.valueAsNumber.toString(16).toUpperCase().padStart(2, "0") : "";
						const rgb = ColorPickerHSVToCSS(hsv);
						outputInput.value = `${rgb}${opacity}`;
						if (ev.detail.source === "opacity") {
							break;
						}
					}

					this.style.setProperty("--hue", hueInput.value);
					tintInput.valueAsHSV = hsv;
					hueInput.valueAsNumber = Math.round(hsv.H * 360);
					break;
				}
			}
			ColorPickerInputCallback?.(this, ev);
		},

		/**
		 * Load a saved color or revert back to the item's initial color
		 * @type {(this: HTMLInputElement, ev: Event) => void}
		 */
		changeRadio: function (ev) {
			/** @type {null | HTMLFieldSetElement} */
			const group = this.closest("fieldset[name='color-picker']");
			if (!group) {
				return;
			}

			const elements = ColorPicker._unpackColorPickerFieldset(group);
			if (!elements) {
				return;
			}
			const [outputInput, saveButton] = [elements.output, elements.save];

			if (this.value) {
				// Switch to a saved color
				ColorPicker.setColor(group, { colorString: this.value });
				saveButton.disabled = false;
			} else {
				// The first option; reset to the initial color
				let colorString = "";
				if (ItemColorState && ItemColorItem) {
					// The subscreen is backed by an actual item and proper color state: the default colors can restored accurately
					const item = ItemColorItem;
					const colorState = ItemColorState;
					ItemColorPickerIndices.forEach(i => {
						colorState.colors[i] = colorState.intermediateSavedColors[i];
						item.Color[i] = colorState.intermediateSavedColors[i];
					});

					const colors = ItemColorPickerIndices.map(i => colorState.colors[i] ?? colorState.defaultColors[i]);
					colorString = (colors.length >= 1 && colors.every(i => i === colors[0])) ? colors[0] : "";
				} else {
					// The subscreen lacks an underlying item or proper color state: the default colors can restored approximately
					// Note that this approximation does become exact when a single layer is being modified or when all layers happen to have the same default color
					colorString = CommonIsColor(outputInput.defaultValue, { allowAlpha: true }) ? CommonColorTrimAlpha(outputInput.defaultValue) : outputInput.defaultValue;
				}

				ColorPicker.setColor(group, { colorString });
				if (ItemColorCharacter) {
					CharacterLoadCanvas(ItemColorCharacter);
				}
				saveButton.disabled = true;
			}

			// Change the background color of the saved color output element
			const menu = this.closest("[role='menu']");
			/** @type {null | HTMLOutputElement} */
			const output = document.querySelector(`output[for~="${menu?.id}"]`);
			if (output) {
				output.replaceChildren(...Array.from(this.labels ?? []).map(i => i.textContent.replace(" ", "")));
				output.style.backgroundColor = this.value;
			}
		},

		/**
		 * Ensure that mouse clicks close the saved color menu.
		 * Put this here rather than in `change` in order to prevent keyboard navigation from auto-closing the menu upon triggering a change.
		 * @type {(this: HTMLInputElement, ev: PointerEvent) => void}
		 */
		pointerupRadio: function (ev) {
			this.blur();
		},

		/**
		 * Ensure that `Enter` and `Space` key presses close the saved color menu while focused.
		 * @type {(this: HTMLInputElement, ev: KeyboardEvent) => void}
		 */
		keydownRadio: function (ev) {
			if (CommonKey.IsPressed(ev, "Enter") || CommonKey.IsPressed(ev, " ")) {
				this.blur();
			}
		},

		/**
		 * Save the current RGB color to the player's saved color list
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickSaveColor: function (ev) {
			/** @type {null | HTMLFieldSetElement} */
			const group = this.closest("fieldset[name='color-picker']");
			if (!group) {
				return;
			}

			const elements = ColorPicker._unpackColorPickerFieldset(group, { checkValidity: true });
			if (!elements) {
				return;
			}

			const [colorInput, savedColorOutput, savedColorGroup] = [elements.output, elements.savedColorOutput, elements.savedColorGroup];
			const savedColorInput = /** @type {null | HTMLInputElement} */(savedColorGroup?.querySelector("input:checked"));
			if (!savedColorInput) {
				return;
			}

			const index = Array.from(savedColorGroup.querySelectorAll(`input[name='${savedColorInput.name}']`)).indexOf(savedColorInput);
			if (index === -1) {
				return;
			}

			if (!CommonIsColor(colorInput.value, { allowAlpha: true })) {
				return;
			}
			const rgb = CommonColorTrimAlpha(colorInput.value);

			savedColorInput.value = rgb;
			Array.from(savedColorInput.labels ?? []).forEach(el => {
				el.style.backgroundColor = rgb;
				el.querySelector(".checkbox-label")?.replaceChildren(`${index.toString().padStart(2, " ")}: ${rgb}`);
			});

			savedColorOutput.style.backgroundColor = rgb;
			savedColorOutput.replaceChildren(`${index.toString().padStart(2, " ")}:${rgb}`);

			Player.SavedColors[index - 1] = ColorPickerCSSToHSV(rgb);
			ServerSend("AccountUpdate", { SavedColors: Player.SavedColors });
		},

		/**
		 * Exit the screen while triggering a save.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickExit: function (ev) {
			const root = /** @type {null | HTMLElement} */(this.closest(".screen"));
			const state = root ? ColorPicker.getColor(root) : null;
			const save = this.name === "accept";
			if (!save) {
				ItemColorRevert("intermediateSaved");
			}
			if (root && state) {
				ColorPickerExitCallback?.(state, save, root);
			} else {
				console.error("uhoh");
			}
			ColorPickerUnload();
		},

		/**
		 * Revert to the item's default color and opacity.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickReset: function (ev) {
			if (ItemColorState) {
				ItemColorRevert("default");
			} else {
				const root = this.closest(".screen");
				/** @type {null | undefined | HTMLFieldSetElement} */
				const fieldset = root?.querySelector("fieldset[name='color-picker']");
				for (const e of (fieldset?.elements ?? [])) {
					if (e instanceof HTMLInputElement || e instanceof HTMLColorTintElement) {
						e.value = e.defaultValue;
					}
				}
			}
			ColorPickerReload({ root: this.closest(".screen")?.id });
		},

		/**
		 * Copy the current color.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickCopy: function (ev) {
			const root = this.closest(".screen");
			if (!root) {
				return;
			}

			const colorState = ColorPicker.getColor(root);
			if (!colorState) {
				ElementDOMScreen.setStatus(root, CommonStringPartitionReplace("Internal error: failed to retrieve {root} color state", {
					"{root}": ElementCreate({ tag: "q", children: [root.id] }),
				}));
				return;
			}

			/** @type {string} */
			let color;
			let opacity = 1;
			const allColors = new Set(colorState.colors);
			const allOpacities = new Set(colorState.opacity);
			if (allColors.size === 1) {
				color = /** @type {string} */(allColors.values().next().value);
			} else {
				ElementDOMScreen.setStatus(root, TextSubstitute(
					"CopyFail",
					{ "{nColors}": ElementCreate({ tag: "q", children: [allColors.size.toString()] }) },
					{ textCache: ItemColorText }
				));
				return;
			}
			if (allOpacities.size === 1) {
				opacity = /** @type {number} */(allOpacities.values().next().value);
			}

			const isHexColor = CommonIsColor(color);
			if (opacity !== 1 && isHexColor) {
				if (color.length === 4) {
					color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
				}
				color += Math.round(opacity * 255).toString(16).padStart(2, "0");
			}

			CommonClipboardWrite(color, (res) => {
				if (res.err) {
					ElementDOMScreen.setStatus(root, res.errorAsDOM(ItemColorText.get("CopyFailBrowser")));
					return;
				}

				/** @type {Element} */
				let colorTextElem;
				if (isHexColor) {
					colorTextElem = ElementCreate({ tag: "q", children: [
						{ tag: "span", children: ["◼ "], style: { "color": color.slice(0, 7) } },
						{ tag: "span", children: [color], style: { "font-family": "monospace" } },
					]});
				} else {
					colorTextElem = ElementCreate({ tag: "q", children: [color] });
				}
				ElementDOMScreen.setStatus(root, TextSubstitute(
					"CopySuccess",
					{ "{color}": colorTextElem },
					{ textCache: ItemColorText },
				));
			});
		},

		/**
		 * Paste the current color.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickPaste: function (ev) {
			const root = this.closest(".screen");
			if (!root) {
				return;
			}

			CommonClipboardRead((res) => {
				if (!res.ok) {
					ElementDOMScreen.setStatus(root, res.errorAsDOM(ItemColorText.get("PasteFailBrowser")));
					return;
				}
				const color = res.value;
				if (!color) return;

				const colorSchema = ItemColorItem?.Asset.Group.ColorSchema ?? [];
				/** @type {Element} */
				let colorTextElem;
				let statusKey = "";
				if (CommonIsColor(color, { allowAlpha: true })) {
					statusKey = "PasteSuccess";
					colorTextElem = ElementCreate({ tag: "q", children: [
						{ tag: "span", children: ["◼ "], style: { "color": CommonColorTrimAlpha(color) } },
						{ tag: "span", children: [color], style: { "font-family": "monospace" } },
					]});
					ColorPicker.setColor(root, { colorString: color });
				} else if (colorSchema.includes(color)) {
					statusKey = "PasteSuccess";
					colorTextElem = ElementCreate({ tag: "q", children: [color] });
					ColorPicker.setColor(root, { colorString: color });
				} else {
					statusKey = "PasteFailInvalid";
					colorTextElem = ElementCreate({
						tag: "q", children: [color.length >= 100 ? `${color.slice(0, 100)}…` : color],
					});
				}
				ElementDOMScreen.setStatus(root, TextSubstitute(
					statusKey,
					{ "{color}": colorTextElem },
					{ textCache: ItemColorText }
				));
			});
		},

		/**
		 * The default input listener responsible for coupling any slider input changes to the states of `ColorPicker...` variables.
		 * @type {ColorPickerInitOptions["onInput"]}
		 */
		inputItemColor: function (elem, ev) {
			const item = ItemColorItem;
			const colorState = ItemColorState;
			const elements = ColorPicker._unpackColorPickerFieldset(elem);
			if (!elements || !item || !colorState || !ItemColorCharacter) {
				ev.stopImmediatePropagation();
				return;
			}
			const [outputInput, opacityInput] = [elements.output, elements.opacity];

			const colorValue = outputInput.value;
			if (CommonIsColor(colorValue, { allowAlpha: true })) {
				const hexColorValue = CommonColorTrimAlpha(colorValue);
				ItemColorPickerIndices.forEach(i => {
					colorState.colors[i] = hexColorValue;
					item.Color[i] = hexColorValue;
				});
			} else if (CommonIncludes(item.Asset.Group.ColorSchema, colorValue)) {
				ItemColorPickerIndices.forEach(i => {
					colorState.colors[i] = colorValue;
					item.Color[i] = colorValue;
				});
			}

			if (colorState.editOpacity) {
				for (const [i, layer] of ItemColorPickerLayers.entries()) {
					const opacityValue = CommonClamp(opacityInput.valueAsNumber / 255, layer.MinOpacity, layer.MaxOpacity);
					colorState.opacity[i] = opacityValue;
					item.Property.Opacity[i] = opacityValue;
				}
			}

			CharacterLoadCanvas(ItemColorCharacter);
		},

		/**
		 * Focusout listener for the saved color menu. Automatically closes the menu upon losing focus.
		 * @type {(this: HTMLFieldSetElement, ev: FocusEvent) => void}
		 */
		focusoutFieldset: function (ev) {
			const menuID = this.closest("[role='menu']")?.id;
			/** @type {null | HTMLButtonElement} */
			const controller = document.querySelector(`button[aria-controls~="${menuID}"]`);
			if (!controller) {
				ev.stopImmediatePropagation();
				return;
			}

			const target = ev.relatedTarget;
			if (
				target instanceof Element
				&& (this.contains(target) || Array.from(controller.labels ?? []).some(el => el.contains(target)))
			) {
				return;
			} else if (controller.getAttribute("aria-expanded") === "true") {
				controller.click();
			}
		},

		/**
		 * Click listener for opening the saved color menu.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickComboBox: function (ev) {
			const hidden = this.getAttribute("aria-expanded") === "false";
			const elems = ElementUnpackIDs.fromAttribute(this, "aria-controls");
			if (elems.length === 0) {
				ev.stopImmediatePropagation();
				return;
			}

			elems.forEach(e => e.toggleAttribute("hidden", hidden));
			if (!hidden) {
				const input = (
					CommonFindMap(elems, (el) => /** @type {null | HTMLInputElement} */(el.querySelector("input:checked")))
					?? CommonFindMap(elems, (el) => /** @type {null | HTMLInputElement} */(el.querySelector("input")))
					?? elems[0]
				);
				input.focus();
			}
		},

		/**
		 * Blur the label children upon receiving focus
		 * @type {(this: HTMLElement, ev: FocusEvent) => void}
		 */
		focusComboLabel: function (ev) {
			// The label children are only able to receive focus due to a technicality in `focusoutFieldset`,
			// as they otherwise wouldn't appear in `FocusEvent.relatedTarget`
			this.blur();
		},
	},

	/**
	 * Unpack and validate the {@link HTMLFieldSetElement.elements} of the passed `fieldset[name='color-picker']` element.
	 * @private
	 * @param {HTMLFieldSetElement} fieldset
	 * @param {null | { checkValidity?: boolean }} options
	 */
	_unpackColorPickerFieldset(fieldset, options=null) {
		options ??= {};
		const checkValidity = options.checkValidity ?? false;

		const hue = fieldset.elements.namedItem("hue");
		const opacity = fieldset.elements.namedItem("opacity");
		const tint = fieldset.elements.namedItem("tint");
		const output = fieldset.elements.namedItem("output");
		const savedColorGroup = fieldset.elements.namedItem("saved-colors-group");
		const savedColorOutput = fieldset.elements.namedItem("saved-colors-output");
		const save = fieldset.elements.namedItem("save");
		if (
			hue instanceof HTMLInputElement && (!checkValidity || hue.validity.valid)
			&& opacity instanceof HTMLInputElement && (!checkValidity || opacity.validity.valid)
			&& tint instanceof HTMLColorTintElement && (!checkValidity || tint.validity.valid)
			&& output instanceof HTMLInputElement && (!checkValidity || output.validity.valid)
			&& savedColorGroup instanceof HTMLFieldSetElement && (!checkValidity || savedColorGroup.validity.valid)
			&& savedColorOutput instanceof HTMLOutputElement && (!checkValidity || savedColorOutput.validity.valid)
			&& save instanceof HTMLButtonElement && (!checkValidity || save.validity.valid)
		) {
			return { hue, opacity, tint, output, savedColorGroup, savedColorOutput, save };
		} else {
			return null;
		}
	},

	/**
	 * @param {null | string} id
	 * @param {readonly { value: string, label: string }[]} optionList
	 * @returns {HTMLElement}
	 */
	_getDropdownWidget(id, optionList) {
		id ??= ElementGenerateID();
		const comboboxID = `${id}-combobox`;
		return ElementCreate({
			tag: "div",
			classList: ["color-picker-dropdown"],
			attributes: { role: "group" },
			children: [
				ElementButton.Create(
					comboboxID,
					ColorPicker.eventListeners.clickComboBox,
					{ role: "combobox", ariaControls: id, ariaHasPopup: "menu", name: "saved-colors-combobox" },
				),
				{
					tag: "output",
					attributes: { name: "saved-colors-output", for: id, tabindex: -1 },
					children: ["-"],
					eventListeners: {
						focus: ColorPicker.eventListeners.focusComboLabel,
					},
				},
				{
					tag: "div",
					attributes: { role: "menu", id, hidden: true },
					children: [
						{
							tag: "fieldset",
							classList: ["scroll-box"],
							attributes: { name: "saved-colors-group", role: "radiogroup" },
							eventListeners: { focusout: ColorPicker.eventListeners.focusoutFieldset },
							children: [
								{ tag: "legend", children: [ItemColorText.get("SavedColors")] },
								ElementCheckbox.CreateLabelled(
									null, "-", ColorPicker.eventListeners.changeRadio,
									{ checked: true, type: "radio", name: "saved-colors", value: "" },
									{
										checkbox: {
											attributes: { role: "menuitemradio" },
											eventListeners: { pointerup: ColorPicker.eventListeners.pointerupRadio, keydown: ColorPicker.eventListeners.keydownRadio },
										},
										label: { style: { "text-align": "center" } },
										container: { attributes: { tabindex: -1 } },
									},
								),
								{ tag: "hr" },
								...optionList.map(({ value, label }) => {
									return ElementCheckbox.CreateLabelled(
										null, label, ColorPicker.eventListeners.changeRadio,
										{ type: "radio", name: "saved-colors", value },
										{
											checkbox: {
												attributes: { role: "menuitemradio" },
												eventListeners: { pointerup: ColorPicker.eventListeners.pointerupRadio, keydown: ColorPicker.eventListeners.keydownRadio },
											},
											container: { attributes: { tabindex: -1 }, style: { "background-color": value } },
										},
									);
								}),
							],
						},
					],
				},
			],
		});
	},

	/**
	 * Construct a new fieldset with the main color input elements
	 * @param {null | string} id - The ID of the element
	 * @param {null | Pick<ColorPickerInitOptions, "colorState" | "onInput">} options
	 * @returns {HTMLFieldSetElement} - The newly created color picker fieldset containing all interactive sliders and such
	 */
	create(id, options=null) {
		options ??= {};
		id ??= ElementGenerateID();
		const hueID = ElementGenerateID();
		const opacityID = ElementGenerateID();
		const tintID = ElementGenerateID();
		const outputID = ElementGenerateID();
		const datalistID = ElementGenerateID();
		const dropdownID = ElementGenerateID();

		const defaultColors = GetDefaultSavedColors().map((hsvBackup, i) => {
			const hsv = Player.SavedColors[i] ?? hsvBackup;
			const rgb = ColorPickerHSVToCSS(hsv);
			return { value: rgb, label: `${(i + 1).toString().padStart(2, " ")}: ${rgb}` };
		});

		let ret = /** @type {null | HTMLFieldSetElement} */(document.getElementById(id));
		if (!ret) {
			ret = ElementCreate({
				tag: "fieldset",
				attributes: { id, name: "color-picker" },
				style: { "--hue": "0" },
				classList: ["color-picker"],
				eventListeners: {
					input: ColorPicker.eventListeners.inputFieldset,
				},
				children: [
					{
						tag: "input",
						attributes: {
							id: hueID,
							type: "range",
							size: 0,
							min: 0,
							max: 360,
							value: 0,
							name: "hue",
							"aria-label": "hue",
							"aria-controls": `${tintID} ${opacityID}`,
						},
						classList: ["hue-input"],
						eventListeners: {
							input: ColorPicker.eventListeners.inputColor,
							blur: ColorPicker.eventListeners.blurColor,
						},
					},
					{
						tag: "div",
						classList: ["opacity-background"],
						children: [
							{
								tag: "div",
								classList: ["opacity-color-background"],
								children: [
									{
										tag: "input",
										attributes: { id: opacityID, type: "range", size: 0, min: 0, max: 255, value: 255, name: "opacity", "aria-label": "opacity" },
										classList: ["opacity-input"],
										eventListeners: {
											input: ColorPicker.eventListeners.inputColor,
											blur: ColorPicker.eventListeners.blurColor,
										},
									},
								],
							},
						],
					},
					{
						tag: "bc-tint-input",
						attributes: { id: tintID, value: "#FFFFFF", name: "tint", "aria-label": "tint" },
						classList: ["tint-input"],
						eventListeners: {
							input: ColorPicker.eventListeners.inputColor,
							blur: ColorPicker.eventListeners.blurColor,
						},
					},
					{
						tag: "label",
						children: [
							{ tag: "span", children: ["RGB(A)"] },
							{
								tag: "output",
								attributes: {
									id: outputID,
									for: `${tintID} ${opacityID} ${hueID}`,
								},
								children: [
									{
										tag: "input",
										attributes: {
											type: "text",
											maxlength: 9,
											size: 8,
											value: "",
											spellcheck: "false",
											name: "output",
											placeholder: "#RRGGBB",
											"aria-controls": `${tintID} ${opacityID} ${hueID}`,
											list: datalistID,
										},
										eventListeners: {
											focus: ColorPicker.eventListeners.focusColor,
											input: ColorPicker.eventListeners.inputColor,
											blur: ColorPicker.eventListeners.blurColor,
										},
										children: [{
											tag: "datalist",
											attributes: { id: datalistID },
										}],
									},
								],
							},
						],
					},
					{
						tag: "label",
						children: [
							{ tag: "span", children: [ItemColorText.get("SavedColors")] },
							ColorPicker._getDropdownWidget(dropdownID, defaultColors),
						],
						attributes: { tabindex: -1 },
						eventListeners: {
							focus: ColorPicker.eventListeners.focusComboLabel,
						},
					},
					ElementButton.Create(
						null,
						ColorPicker.eventListeners.clickSaveColor,
						{ label: ItemColorText.get("SaveColor"), name: "save", disabled: true, ariaControls: dropdownID },
					),
				],
			});
		}

		ColorPickerInputCallback = options.onInput;
		if (options.colorState) {
			ColorPickerReload({ root: ret, colorState: options.colorState });
		}
		return ret;
	},

	/**
	 * {@link ColorPicker.setColor} helper for parsing color values (be it stringified or as HSV)
	 * @private
	 * @param {Pick<ColorPickerColorInput, "colorString" | "hsv">} value
	 * @param {null | HTMLInputElement} outputInput - Current text input, used when `value` carries neither a string nor an HSV color
	 * @param {null | number} opacity - Opacity byte in `[0, 255]`. `255` and `null` leave the color without an alpha byte
	 * @returns {{ hsv: null | HSVColor, output: string }}
	 */
	_setColorParseColor(value, outputInput, opacity) {
		let output = "";
		let colorIsHex = true;
		/** @type {null | HSVColor} */
		let hsv = null;
		if (value.colorString != null) {
			const color = value.colorString;
			if (!CommonIsColor(color, { allowAlpha: true })) {
				output = color;
			} else if (color.length === 4) {
				output = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
				hsv = ColorPickerCSSToHSV(color);
			} else {
				output = CommonColorTrimAlpha(color).toUpperCase();
				hsv = ColorPickerCSSToHSV(color);
			}
		} else if (value.hsv) {
			hsv = { ...value.hsv };
			colorIsHex = true;
			output = ColorPickerHSVToCSS(hsv);
		} else {
			const current = outputInput?.value ?? "";
			if (CommonIsColor(current, { allowAlpha: true })) {
				colorIsHex = true;
				output = CommonColorTrimAlpha(current);
			} else {
				colorIsHex = false;
				output = current;
			}
		}

		if (opacity != null && opacity !== 255 && colorIsHex) {
			output += opacity.toString(16).padStart(2, "0").toUpperCase();
		}
		return { hsv, output };
	},

	/**
	 * {@link ColorPicker.setColor} helper for parsing opacity values
	 * @private
	 * @param {Pick<ColorPickerColorInput, "opacity" | "colorString">} value
	 * @param {null | HTMLInputElement} [opacityInput] - Slider whose min, max, and disabled state clamp the result. Omitted, the byte is clamped to `[0, 255]`
	 * @param {null | { overrideEditOpacity?: boolean }} options
	 * @returns {null | number}
	 */
	_setColorParseOpacity(value, opacityInput=null, options=null) {
		options ??= {};
		if (opacityInput?.disabled && !options.overrideEditOpacity) {
			return null;
		}

		/** @type {null | number} */
		let opacity = null;
		if (CommonIsFinite(value.opacity, 0, 1)) {
			opacity = Math.round(value.opacity * 255);
		} else if (value.colorString != null && CommonIsColor(value.colorString, { allowAlpha: true }) && value.colorString.length > 7) {
			const opacityCandidate = CommonParseInt(value.colorString.slice(7, 9), 16);
			if (CommonIsInteger(opacityCandidate, 0, 255)) {
				opacity = opacityCandidate;
			}
		}

		if (opacity != null) {
			const opacityMin = CommonParseInt(opacityInput?.min ?? "") ?? 0;
			const opacityMax = CommonParseInt(opacityInput?.max ?? "") ?? 255;
			return CommonClamp(opacity, opacityMin, opacityMax);
		} else {
			return null;
		}
	},

	/**
	 * Set the color and/or opacity of the passed color picker screen
	 * @param {ElementHelp.ElementOrId} root - The color picker screen or its ID
	 * @param {ColorPickerColorInput} value - The passed color (be it as string or HSV object) and opacity
	 * @param {null | { overrideEditOpacity?: boolean, dispatch?: boolean }} options
	 */
	setColor(root, value, options=null) {
		options ??= {};
		const screen = ElementWrap(root);
		const fieldset = /** @type {null | HTMLFieldSetElement} */(!screen || screen.matches("fieldset[name='color-picker']") ? screen : screen.querySelector("fieldset[name='color-picker']"));
		if (!fieldset) {
			return;
		}

		const elements = ColorPicker._unpackColorPickerFieldset(fieldset);
		if (!elements) {
			return;
		}
		const [outputInput, hueInput, tintInput, opacityInput] = [elements.output, elements.hue, elements.tint, elements.opacity];

		// Parse the opacities
		const opacity = ColorPicker._setColorParseOpacity(value, opacityInput, options);

		// Parse the color (if provided) and identify whether we're dealing with hexcodes or not (Default, White, etc.)
		let { hsv, output } = ColorPicker._setColorParseColor(value, outputInput, opacity);

		if (hsv != null) {
			hueInput.valueAsNumber = CommonClamp(Math.round(hsv.H * 360), 0, 360);
			tintInput.valueAsHSV = hsv;
			fieldset.style.setProperty("--hue", hueInput.value);
		}

		if (opacity != null) {
			opacityInput.valueAsNumber = opacity;
		}

		outputInput.value = output;
		if (options.dispatch ?? true) {
			fieldset.dispatchEvent(new CustomEvent("input", { detail: { source: outputInput.name } }));
		}
	},

	/**
	 * Get the color and opacity of the passed color picker screen
	 * @param {ElementHelp.ElementOrId} root - The color picker screen or its ID
	 * @returns {null | ItemColorExitState}
	 */
	getColor(root) {
		const screen = ElementWrap(root);
		if (!screen) {
			return null;
		}

		/** @type {ItemColorExitState} */
		let exitState;
		const colorState = ItemColorState;
		if (colorState) {
			// Plan A: the color picker is backed by an `ItemColorState`
			const layerIndices = Array.from(ItemColorPickerLayers.keys());
			exitState = {
				colors: ItemColorPickerIndices.map(i => colorState.colors[i]),
				opacity: layerIndices.map(i => colorState.opacity[i]),
				initialColors: ItemColorPickerIndices.map(i => colorState.intermediateSavedColors[i]),
				initialOpacity: layerIndices.map(i => colorState.intermediateSavedOpacity[i]),
				defaultColors: [...colorState.defaultColors],
				defaultOpacity: [...colorState.defaultOpacity],
				editOpacity: colorState.editOpacity,
			};
		} else {
			// Plan B: There's no `ItemColorState`; directly extract values and initial values from the input elements
			/** @type {null | HTMLFieldSetElement} */
			const fieldset = screen?.querySelector("fieldset[name='color-picker']");
			if (!fieldset) {
				return null;
			}
			const elements = ColorPicker._unpackColorPickerFieldset(fieldset);
			if (!elements) {
				return null;
			}
			const [opacityInput, outputInput] = [elements.opacity, elements.output];

			const initialOpacity = (opacityInput ? CommonParseInt(opacityInput.defaultValue) : null) ?? 255;
			let initialColor = (outputInput ? /** @type {BCColor} */(outputInput.defaultValue) : "Default") || "Default";
			if (CommonIsColor(initialColor, { allowAlpha: true })) {
				initialColor = CommonColorTrimAlpha(initialColor);
			}

			const opacity = opacityInput?.validity.valid ? opacityInput.valueAsNumber : initialOpacity;
			let color = initialColor;
			if (!outputInput?.validity.valid) {
				color = initialColor;
			} else if (outputInput.value === "Default") {
				color = "Default";
			} else if (CommonIsColor(outputInput.value, { allowAlpha: true })) {
				color = CommonColorTrimAlpha(outputInput.value);
			}

			exitState = {
				colors: [color],
				opacity: [opacity / 255],
				initialColors: [initialColor],
				initialOpacity: [initialOpacity / 255],
				defaultColors: [initialColor],
				defaultOpacity: [initialOpacity / 255],
				editOpacity: (opacityInput?.disabled ?? true) == false,
			};
		}
		return exitState;
	},

	/**
	 * Toggle the `disabled` state of the passed color picker using {@link Element.toggleAttribute}-like semantics.
	 * @param {ElementHelp.ElementOrId} root - The color picker screen or its ID
	 * @param {null | boolean} force - Toggle the `disabled` attributes if unspecified or, if a boolean is passed, force the provided value
	 * @returns {boolean} - The new `disabled` state
	 */
	toggleDisabled(root, force=null) {
		const screen = ElementWrap(root);
		if (!screen) {
			return false;
		}

		const fieldset = /** @type {null | HTMLFieldSetElement} */(screen.matches("fieldset[name='color-picker']") ? screen : screen.querySelector("fieldset[name='color-picker']"));
		if (!fieldset) {
			return false;
		}
		const disabled = force ?? !fieldset.disabled;
		fieldset.disabled = disabled;

		// Also disable the accept and reset buttons
		const menubarButtons = Array.from(screen.closest(".screen")?.querySelectorAll("[role='menuitem'][name='reset'], [role='menuitem'][name='accept']") ?? []);
		menubarButtons.forEach(button => button.setAttribute("aria-disabled", disabled.toString()));
		return disabled;
	},
};

/**
 * Call {@link ColorPickerLoad} with the passed parameters and perform a resize.
 * @param {null | ColorPickerInitOptions} options - The load parameters
 * @returns {Promise<HTMLElement>} - The root element of the color picker subscreen
 */
async function ColorPickerInit(options=null) {
	options ??= {};
	options.reset ??= true;
	ColorPickerInitOptions = options;
	await ColorPickerLoad();
	ColorPickerInitOptions = null;
	ColorPickerResize(true);
	return /** @type {HTMLElement} */(ElementWrap(options.root ?? ColorPicker.ids.root));
}

/** @type {ScreenLoadHandler} */
async function ColorPickerLoad() {
	const options = ColorPickerInitOptions ?? {};
	let root = ElementWrap(options.root ?? ColorPicker.ids.root);
	if (root) {
		root.toggleAttribute("hidden", false);
		ColorPickerReload(options);
		return;
	}

	const colorFieldset = ColorPicker.create(null, { onInput: options.onInput ?? ColorPicker.eventListeners.inputItemColor });
	root = ElementDOMScreen.getTemplate(ColorPicker.ids.root, {
		menubarButtons: [
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickExit,
				{ image: "./Icons/Accept.png", tooltip: ItemColorText.get("Accept"), name: "accept", tooltipPosition: "left" },
			),
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickExit,
				{ image: "./Icons/Cancel.png", tooltip: ItemColorText.get("Cancel"), name: "cancel", tooltipPosition: "left" },
			),
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickPaste,
				{ image: "./Icons/Paste.svg", tooltip: ItemColorText.get("Paste"), name: "paste", tooltipPosition: "left" },
			),
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickCopy,
				{ image: "./Icons/Copy.svg", tooltip: ItemColorText.get("Copy"), name: "copy", tooltipPosition: "left" },
			),
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickReset,
				{ image: "./Icons/Reset.png", tooltip: ItemColorText.get("Reset"), name: "reset", tooltipPosition: "left" },
			),
		],
		mainContent: [colorFieldset],
		parent: document.body,
	});
	colorFieldset.setAttribute("aria-labelledby", root.querySelector("h1")?.id ?? "");
	ColorPickerReload(options);
}

/**
 * Reload and refresh the color picker based on the current item color data.
 * @param {null | ColorPickerInitOptions} options
 * @returns {null | HTMLElement} The paseed root element
 */
function ColorPickerReload(options=null) {
	options ??= {};
	if (!options.colorState && !(ItemColorState && ItemColorCharacter)) {
		return null;
	}

	const root = ElementWrap(options.root ?? ColorPicker.ids.root);
	if (!root) {
		return null;
	}

	if (options.onExit) {
		ColorPickerExitCallback = options.onExit;
	} else if (options.reset) {
		ColorPickerExitCallback = null;
	}

	if (options.heading) {
		ElementDOMScreen.setHeading(root, options.heading);
	} else if (options.reset) {
		ElementDOMScreen.setHeading(root, []);
	}

	// Grab all colors and opacity and identify a suitable "singular" value for the inputs
	// When dealing with items or color groups (_i.e._ a set with potentially multiple distinct colors/opacities) the best you can do is attempt to pick the value that is the _least_ bullshit
	/** @type {number[]} */
	let opacities;
	/** @type {number[]} */
	let defaultOpacities;
	/** @type {string[]} */
	let colors;
	/** @type {string[]} */
	let defaultColors;
	if (options.colorState) {
		opacities = options.colorState.opacity;
		colors = options.colorState.colors;
		defaultOpacities = [...(options.colorState.defaultOpacity ?? opacities)];
		defaultColors = [...(options.colorState.defaultColors ?? colors)];
	} else if (ItemColorState) {
		const colorState = ItemColorState;
		opacities = Array.from(ItemColorPickerLayers.keys()).map(i => colorState.opacity[i]);
		colors = ItemColorPickerIndices.map(i => colorState.colors[i]);
		defaultOpacities = Array.from(ItemColorPickerLayers.keys()).map(i => colorState.intermediateSavedOpacity[i]);
		defaultColors = ItemColorPickerIndices.map(i => colorState.intermediateSavedColors[i]);
	} else {
		return null;
	}
	const singularOpacity = opacities.length === 0 ? 1 : Math.max(...opacities);
	const singularColor = (colors.length >= 1 && colors.every(i => i === colors[0])) ? colors[0] : "";
	const singularDefaultOpacity = defaultOpacities.length === 0 ? 1 : Math.max(...defaultOpacities);
	const singularDefaultColor = (defaultColors.length >= 1 && defaultColors.every(i => i === defaultColors[0])) ? defaultColors[0] : "";

	// Gather the elements
	const fieldset = /** @type {null | HTMLFieldSetElement} */(root.matches("fieldset[name='color-picker']") ? root : root.querySelector("fieldset[name='color-picker']"));
	if (!fieldset) {
		return root;
	}
	const elements = ColorPicker._unpackColorPickerFieldset(fieldset);
	if (!elements) {
		return root;
	}
	const [savedColor, savedColorOutput, hueInput, opacityInput, tintInput, outputInput] = [
		elements.savedColorGroup, elements.savedColorOutput, elements.hue, elements.opacity, elements.tint, elements.output,
	];

	if (options.colorState?.editOpacity ?? ItemColorState?.editOpacity) {
		// Configure the min/max opacity and whether the opacity is configurable in the first place
		let opacityMin = null;
		let opacityMax = null;
		for (const layer of ItemColorPickerLayers.values()) {
			opacityMin = Math.min(opacityMin ?? 1, layer.MinOpacity);
			opacityMax = Math.max(opacityMax ?? 0, layer.MaxOpacity);
		}
		opacityMin ??= 0;
		opacityMax ??= 1;

		opacityInput.style.width = `${100 * (opacityMax - opacityMin)}%`;
		opacityInput.style.left = `${100 * opacityMin}%`;
		opacityInput.min = Math.round(opacityMin * 255).toString();
		opacityInput.max = Math.round(opacityMax * 255).toString();
		opacityInput.disabled = false;
	} else {
		// Ignore the automatic width adjustments when editing is disabled as the layout tends to get wonky when `left: 100%` or when `min == max == value`
		opacityInput.style.removeProperty("width");
		opacityInput.style.removeProperty("left");
		opacityInput.min = "0";
		opacityInput.max = "255";
		opacityInput.disabled = true;
	}

	// Apply the new color and opacity
	ColorPicker.setColor(fieldset, { colorString: singularColor, opacity: singularOpacity }, { overrideEditOpacity: true, dispatch: options.dispatch });
	if (ItemColorCharacter) {
		CharacterLoadCanvas(ItemColorCharacter);
	}

	// Reset the default values
	const defaultOpacityParsed = ColorPicker._setColorParseOpacity({ opacity: singularDefaultOpacity }, opacityInput, { overrideEditOpacity: true });
	const defaultColorParsed = ColorPicker._setColorParseColor({ colorString: singularDefaultColor }, outputInput, defaultOpacityParsed);
	outputInput.defaultValue = defaultColorParsed.output;
	opacityInput.defaultValue = (defaultOpacityParsed ?? 255).toString();
	if (defaultColorParsed.hsv != null) {
		tintInput.defaultValue = ColorPickerHSVToCSS(defaultColorParsed.hsv);
		hueInput.defaultValue = defaultColorParsed.hsv.H.toString();
	} else {
		tintInput.defaultValue = "#FFFFFF";
		hueInput.defaultValue = "0";
	}

	// Reset the search suggestions in the RGB text input based on one's color history + any supported non-hex colors (Default, White, Asian, etc.)
	const prevColors = Array.from(ItemColorHistory);
	if (!options.colorState) {
		prevColors.push(...(ItemColorItem?.Asset.Group.ColorSchema ?? []).filter(i => !CommonIsColor(i)));
	}
	prevColors.sort();
	outputInput.list?.replaceChildren(...prevColors.map(value => {
		return ElementCreate({ tag: "option", attributes: { value }});
	}));

	// Repopulate the saved colors as based on `Player.SavedColors`
	/** @type {NodeListOf<HTMLInputElement>} */
	const radioInputs = savedColor.querySelectorAll("input[type='radio']");
	radioInputs.forEach((input, i) => {
		// The default (valueless) option `-`
		if (!input.value) {
			input.checked = true;
			savedColorOutput.replaceChildren(...Array.from(input.labels ?? []).map(el => el.textContent.replace(" ", "")));
			savedColorOutput.style.removeProperty("background-color");
			return root;
		}

		const hsv = Player.SavedColors[i - 1];
		const rgb = ColorPickerHSVToCSS(hsv);
		input.value = rgb;
		Array.from(input.labels ?? []).forEach(el => {
			el.querySelector(".checkbox-label")?.replaceChildren(`${i.toString().padStart(2, " ")}: ${rgb}`);
			el.style.backgroundColor = rgb;
		});
	});

	if (options.disabled != null) {
		ColorPicker.toggleDisabled(root, options.disabled);
	} else if (options.reset) {
		ColorPicker.toggleDisabled(root, false);
	}

	// Set the shape of the screen
	if (options.shape) {
		ColorPicker._shapes.set(root, options.shape);
	} else if (options.reset || !ColorPicker._shapes.has(root)) {
		ColorPicker._shapes.set(root, ColorPicker.defaultShape);
	}
	return root;
}

/** @type {ScreenResizeHandler} */
function ColorPickerResize() {
	const root = document.getElementById(ColorPicker.ids.root);
	const shape = ColorPicker._shapes.get(/** @type {HTMLElement} */(root));
	if (root && shape) {
		ElementPositionFixed(root, ...shape);
	}

	/** Manually set the tint input's height due to iOS bugs (https://gitgud.io/BondageProjects/Bondage-College/-/merge_requests/6146) */
	const picker = root?.querySelector("bc-tint-input");
	if (picker) {
		const shapeRect = picker.getBoundingClientRect();
		picker.style.setProperty("height", `${shapeRect.width}px`);
	}
}

/** @type {ScreenUnloadHandler} */
function ColorPickerUnload() {
	ElementDOMScreen.clearStatus(ColorPicker.ids.root);
	document.getElementById(ColorPicker.ids.root)?.toggleAttribute("hidden", true);
}

/**
 * @param {boolean} [forceExit]
 * @satisfies {ScreenExitHandler}
 */
function ColorPickerExit(forceExit=false) {
	/** @type {null | HTMLButtonElement} */
	const combobox = document.querySelector(`#${ColorPicker.ids.root} button[role='combobox'][aria-expanded='true']`);
	if (!forceExit && combobox) {
		combobox.click();
		return;
	}
	ColorPickerExitCallback = null;
	ColorPickerInputCallback = null;
	document.getElementById(ColorPicker.ids.root)?.remove();
}
