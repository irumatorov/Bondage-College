"use strict";

/**
 * Tied to the screen's lifetime
 * @type {WebGLContextAttributes}
 */
var PreferenceGraphicsWebGLOptions;

const PreferenceSubscreenGraphicsIDs = Object.freeze({
	grid: "preference-graphics-grid",
	noWebGL: "preference-graphics-no-webgl",
});

/**
 * Prepares the graphics settings subscreen
 */
function PreferenceSubscreenGraphicsLoad() {
	PreferenceGraphicsWebGLOptions = GLDrawGetOptions();

	const dropdownHtmlOptions = { container: { classList: ["preference-settings-dropdown"] } };
	const checkboxHtmlOptions = { container: { classList: ["preference-settings-checkbox"] } };

	const vfxOptions = PreferenceSettingsVFXList.map((v) => ({
		attributes: {
			value: v,
			label: TextGet(v),
			selected: v === Player.ArousalSettings.VFX,
		},
	}));

	const vfxDropdown = ElementDropdown.CreateLabelled("preference-graphics-vfx", vfxOptions, TextGet("VFX"),
		function (ev) {
			ev.preventDefault();
			const next = /** @type {GraphicsVFXName} */ (this.value);
			if (PreferenceSettingsVFXList.indexOf(next) < 0) return;
			Player.ArousalSettings.VFX = next;
		},
		null,
		dropdownHtmlOptions
	);

	const fontOptions = PreferenceGraphicsFontList.map((f) => ({
		attributes: {
			value: f,
			label: TextGet(f),
			selected: f === Player.GraphicsSettings.Font,
		},
	}));

	const fontDropdown = ElementDropdown.CreateLabelled("preference-graphics-font", fontOptions, TextGet("GraphicsFont"),
		function (ev) {
			ev.preventDefault();
			const next = /** @type {GraphicsFontName} */ (this.value);
			if (PreferenceGraphicsFontList.indexOf(next) < 0) return;
			Player.GraphicsSettings.Font = next;
			CommonGetFont.clearCache();
			CommonGetFontName.clearCache();
			DrawingGetTextSize.clearCache();
		},
		null,
		{
			container: {
				classList: ["preference-settings-dropdown"],
				children: [
					ElementText.CreateHint("preference-graphics-font-hint", TextGet("GraphicsFontDisclaimer"), "left"),
				],
			},
		}
	);

	const invertRoom = ElementCheckbox.CreateLabelled(
		"preference-graphics-invert-room",
		TextGet("GraphicsInvertRoom"),
		function () {
			Player.GraphicsSettings.InvertRoom = this.checked;
		},
		{ checked: Player.GraphicsSettings.InvertRoom },
		checkboxHtmlOptions
	);

	const stimulationFlash = ElementCheckbox.CreateLabelled(
		"preference-graphics-stimulation-flash",
		TextGet("GraphicsStimulationFlash"),
		function () {
			Player.GraphicsSettings.StimulationFlash = this.checked;
		},
		{ checked: Player.GraphicsSettings.StimulationFlash },
		checkboxHtmlOptions
	);

	const doBlindFlash = ElementCheckbox.CreateLabelled(
		"preference-graphics-do-blind-flash",
		TextGet("DoBlindFlash"),
		function () {
			Player.GraphicsSettings.DoBlindFlash = this.checked;
		},
		{ checked: Player.GraphicsSettings.DoBlindFlash },
		checkboxHtmlOptions
	);

	const animationQualityOptions = PreferenceGraphicsAnimationQualityList.map((q) => ({
		attributes: {
			value: q.toString(),
			label: TextGet("GeneralAnimationQuality" + q.toString()),
			selected: q === Player.GraphicsSettings.AnimationQuality,
		},
	}));

	const animationQualityDropdown = ElementDropdown.CreateLabelled("preference-graphics-animation-quality", animationQualityOptions, TextGet("GeneralAnimationQualityText"),
		function (ev) {
			ev.preventDefault();
			const q = CommonParseInt(this.value) ?? PreferenceGraphicsSettingsDefault.AnimationQuality;
			if (!PreferenceGraphicsAnimationQualityList.includes(q)) return;
			Player.GraphicsSettings.AnimationQuality = q;
		},
		null,
		{
			container: {
				classList: ["preference-settings-dropdown"],
				children: [
					ElementText.CreateHint("preference-graphics-animation-quality-hint", TextGet("GeneralAnimationQualityHint"), "left"),
				],
			}
		}
	);

	/** @type {HTMLElement[]} */
	const webglBlock = [];
	if (GLVersion !== "No WebGL") {
		const antialiasingCheckbox = ElementCheckbox.CreateLabelled(
			"preference-graphics-antialias",
			TextGet("GraphicsAntialiasing"),
			function () {
				PreferenceGraphicsWebGLOptions.antialias = this.checked;
			},
			{ checked: PreferenceGraphicsWebGLOptions.antialias },
			{ container: { children: [ElementText.CreateHint("preference-graphics-antialias-hint", TextGet("GraphicsSupportHint"), "left")], classList: ["preference-settings-checkbox"] } }
		);

		const powerModeOptions = PreferenceGraphicsPowerModes.map((m) => ({
			attributes: {
				value: m,
				label: TextGet("PowerMode" + m),
				selected: m === PreferenceGraphicsWebGLOptions.powerPreference,
			},
		}));

		const powerModeDropdown = ElementDropdown.CreateLabelled("preference-graphics-power-mode", powerModeOptions, TextGet("GraphicsPowerMode"),
			function (ev) {
				ev.preventDefault();
				const next = /** @type {WebGLPowerPreference} */ (this.value);
				if (PreferenceGraphicsPowerModes.indexOf(next) < 0) return;
				PreferenceGraphicsWebGLOptions.powerPreference = next;
			}, null, { container: { classList: ["preference-settings-dropdown"], children: [ElementText.CreateHint("preference-graphics-power-mode-hint", TextGet("GraphicsSupportHint"), "left")] } }
		);
		webglBlock.push(antialiasingCheckbox, powerModeDropdown);
	} else {
		webglBlock.push(ElementCreate({
			tag: "p",
			attributes: { id: PreferenceSubscreenGraphicsIDs.noWebGL },
			classList: ["preference-graphics-no-webgl"],
			children: [TextGet("GraphicsNoWebGL")],
		}));
	}

	const vfxFilterOptions = PreferenceSettingsVFXFilterList.map((v) => ({
		attributes: {
			value: v,
			label: TextGet(v),
			selected: v === Player.ArousalSettings.VFXFilter,
		},
	}));

	const vfxFilterDropdown = ElementDropdown.CreateLabelled("preference-graphics-vfx-filter", vfxFilterOptions, TextGet("VFXFilter"),
		function (ev) {
			ev.preventDefault();
			const next = /** @type {GraphicsVFXFilterName} */ (this.value);
			if (PreferenceSettingsVFXFilterList.indexOf(next) < 0) return;
			Player.ArousalSettings.VFXFilter = next;
		},
		null,
		dropdownHtmlOptions
	);

	const vfxVibratorOptions = PreferenceSettingsVFXVibratorList.map((v) => ({
		attributes: {
			value: v,
			label: TextGet(v),
			selected: v === Player.ArousalSettings.VFXVibrator,
		},
	}));

	const vfxVibratorDropdown = ElementDropdown.CreateLabelled("preference-graphics-vfx-vibrator", vfxVibratorOptions, TextGet("VFXVibrator"),
		function (ev) {
			ev.preventDefault();
			const next = /** @type {GraphicsVFXVibratorName} */ (this.value);
			if (PreferenceSettingsVFXVibratorList.indexOf(next) < 0) return;
			Player.ArousalSettings.VFXVibrator = next;
		},
		null,
		dropdownHtmlOptions
	);

	const smoothZoom = ElementCheckbox.CreateLabelled(
		"preference-graphics-smooth-zoom",
		TextGet("SmoothZoom"),
		function () {
			Player.GraphicsSettings.SmoothZoom = this.checked;
		},
		{ checked: Player.GraphicsSettings.SmoothZoom },
		checkboxHtmlOptions
	);

	const centerChatrooms = ElementCheckbox.CreateLabelled(
		"preference-graphics-center-chatrooms",
		TextGet("CenterChatrooms"),
		function () {
			Player.GraphicsSettings.CenterChatrooms = this.checked;
		},
		{ checked: Player.GraphicsSettings.CenterChatrooms },
		checkboxHtmlOptions
	);

	const allowBlur = ElementCheckbox.CreateLabelled(
		"preference-graphics-allow-blur",
		TextGet("AllowBlur"),
		function () {
			Player.GraphicsSettings.AllowBlur = this.checked;
		},
		{ checked: Player.GraphicsSettings.AllowBlur },
		{ container: { children: [ElementText.CreateHint("preference-graphics-allow-blur-hint", TextGet("AllowBlurHint"), "left")], classList: ["preference-settings-checkbox"] } }
	);

	const maxFpsOptions = PreferenceGraphicsFrameLimit.map((n) => ({
		attributes: {
			value: n.toString(),
			label: TextGet("MaxFPS" + n.toString()),
			selected: n === Player.GraphicsSettings.MaxFPS,
		},
	}));

	const maxFpsDropdown = ElementDropdown.CreateLabelled("preference-graphics-max-fps", maxFpsOptions, TextGet("FPSFocusedLimit"),
		function (ev) {
			ev.preventDefault();
			const n = CommonParseInt(this.value) ?? PreferenceGraphicsSettingsDefault.MaxFPS;
			if (!PreferenceGraphicsFrameLimit.includes(n)) return;
			Player.GraphicsSettings.MaxFPS = n;
		},
		null,
		dropdownHtmlOptions
	);

	const maxUnfocusedFpsOptions = PreferenceGraphicsFrameLimit.map((n) => ({
		attributes: {
			value: n.toString(),
			label: TextGet("MaxFPS" + n.toString()),
			selected: n === Player.GraphicsSettings.MaxUnfocusedFPS,
		},
	}));

	const maxUnfocusedFpsDropdown = ElementDropdown.CreateLabelled("preference-graphics-max-unfocused-fps", maxUnfocusedFpsOptions, TextGet("FPSUnfocusedLimit"),
		function (ev) {
			ev.preventDefault();
			const n = CommonParseInt(this.value) ?? PreferenceGraphicsSettingsDefault.MaxUnfocusedFPS;
			if (!PreferenceGraphicsFrameLimit.includes(n)) return;
			Player.GraphicsSettings.MaxUnfocusedFPS = n;
		},
		null,
		dropdownHtmlOptions
	);

	const showFps = ElementCheckbox.CreateLabelled(
		"preference-graphics-show-fps",
		TextGet("ShowFPS"),
		function () {
			Player.GraphicsSettings.ShowFPS = this.checked;
		},
		{ checked: Player.GraphicsSettings.ShowFPS },
		checkboxHtmlOptions
	);

	const showFullscreenButtonOptions = PreferenceGraphicsFullscreenButtonList.map((v) => ({
		attributes: {
			value: v,
			label: TextGet("ShowFullscreenButton" + v),
			selected: v === Player.GraphicsSettings.ShowFullscreenButton,
		},
	}));

	const showFullscreenButton = ElementDropdown.CreateLabelled("preference-graphics-show-fullscreen-button", showFullscreenButtonOptions, TextGet("ShowFullscreenButton"),
		function (ev) {
			ev.preventDefault();
			const next = /** @type {GraphicsShowFullscreenButton} */ (this.value);
			if (!PreferenceGraphicsFullscreenButtonList.includes(next)) return;
			Player.GraphicsSettings.ShowFullscreenButton = next;
			Fullscreen.UpdateButton();
		},
		null,
		{
			container: {
				classList: ["preference-settings-dropdown"],
				children: [
					ElementText.CreateHint("preference-graphics-show-fullscreen-button-hint", TextGet("ShowFullscreenButtonHint"), "left"),
				],
			},
		}
	);

	ElementCreate({
		tag: "div",
		classList: ["preference-settings-grid", "preference-settings-aligned-grid", "scroll-box"],
		attributes: { id: PreferenceSubscreenGraphicsIDs.grid },
		children: [
			vfxDropdown,
			vfxFilterDropdown,
			vfxVibratorDropdown,
			fontDropdown,
			invertRoom,
			smoothZoom,
			centerChatrooms,
			stimulationFlash,
			doBlindFlash,
			animationQualityDropdown,
			...webglBlock,
			allowBlur,
			maxFpsDropdown,
			maxUnfocusedFpsDropdown,
			showFps,
			showFullscreenButton,
		],
		parent: ElementWrap(PreferenceIDs.subscreen)
	});
}

/**
 * Sets the graphical preferences for a player. Redirected to from the main Run function if the player is in the
 * graphics settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGraphicsRun() {
	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles click events for the graphics preference settings. Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGraphicsClick() {}

/** @type {ScreenResizeHandler} */
function PreferenceSubscreenGraphicsResize() {
	const { x, y } = PreferenceSubscreenMainGrid;
	ElementSetPosition(PreferenceSubscreenGraphicsIDs.grid, x, y + 10);
	ElementSetSize(PreferenceSubscreenGraphicsIDs.grid, 1400, 800);
}

function PreferenceSubscreenGraphicsExit() {
	return true;
}

/**
 * Finalize graphics setting when the screen is unloaded
 */
function PreferenceSubscreenGraphicsUnload() {
	// Reload WebGL if graphic settings have changed.
	const currentOptions = GLDrawGetOptions();
	if (
		GLVersion !== "No WebGL" &&
		(currentOptions.powerPreference != PreferenceGraphicsWebGLOptions.powerPreference ||
			currentOptions.antialias != PreferenceGraphicsWebGLOptions.antialias)
	) {
		// This uses localStorage so the option is taken into account even at the login screen,
		// since we don't have any idea about the user's GL configuration at that point.
		GLDrawSetOptions(PreferenceGraphicsWebGLOptions);
		GLDrawResetCanvas();
	}
}
