"use strict";
var ChatAdminRoomCustomizationBackground = "Sheet";
/** @type {null | ServerChatRoomCustomData} */
var ChatAdminRoomCustomizationCurrent = null;
/** @type {null | HTMLAudioElement} */
var ChatAdminRoomCustomizationAudio = null;
const ChatAdminRoomCustomizationImageFormats = [".jpg", ".jpeg", ".png", ".webp"];
var ChatAdminRoomCustomizationMusicLibrary = [
	{
		Name: "FantasyAmbience",
		URL: "https://bondageprojects.com/music/FantasyAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=enk9srBmTqQ&ab_channel=Jota-RMusicChannel"
	},
	{
		Name: "HorrorAmbience",
		URL: "https://bondageprojects.com/music/HorrorAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=1JnPSMNuHtw&ab_channel=MarcvanderMeulen%E2%99%AB"
	},
	{
		Name: "WesternAmbience",
		URL: "https://bondageprojects.com/music/WesternAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=wTm-WFM0v-g&ab_channel=MrSnoozeIBackgroundMusicforVideos"
	},
	{
		Name: "MetalInstrumental2021",
		URL: "https://bondageprojects.com/music/MetalInstrumental2021.mp3",
		Source: "https://www.youtube.com/watch?v=AZum7ymw_Ws&ab_channel=MaximumOfHeaven"
	},
	{
		Name: "Pop2020",
		URL: "https://bondageprojects.com/music/Pop2020.mp3",
		Source: "https://www.youtube.com/watch?v=Y7Dk3_hA3-8&ab_channel=therealahmedtn"
	},
	{
		Name: "Pop2022",
		URL: "https://bondageprojects.com/music/Pop2022.mp3",
		Source: "https://www.youtube.com/watch?v=IW0QkXpQs3k&ab_channel=MusicToListen"
	},
	{
		Name: "ProgressiveHouse2022",
		URL: "https://bondageprojects.com/music/ProgressiveHouse2022.mp3",
		Source: "https://www.youtube.com/watch?v=u6PUX87ZaX0&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroDance2022",
		URL: "https://bondageprojects.com/music/ElectroDance2022.mp3",
		Source: "https://www.youtube.com/watch?v=oqGEyAFf6MI&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroDance2023",
		URL: "https://bondageprojects.com/music/ElectroDance2023.mp3",
		Source: "https://www.youtube.com/watch?v=7IjvFZox1Jc&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroRoyKnox",
		URL: "https://bondageprojects.com/music/ElectroRoyKnox.mp3",
		Source: "https://www.youtube.com/watch?v=dh01eSOn9_E&ab_channel=MagicMusic"
	},
	{
		Name: "DanceElectroPop",
		URL: "https://bondageprojects.com/music/DanceElectroPop.mp3",
		Source: "https://www.youtube.com/watch?v=MEkaqZecpUQ&ab_channel=NoCopyrightSounds"
	},
	{
		Name: "DarkTechno",
		URL: "https://bondageprojects.com/music/DarkTechno.mp3",
		Source: "https://www.youtube.com/watch?v=iAguE62acA8&ab_channel=AimToHeadOfficial"
	}
];

const ChatAdminRoomCustomizationIDs = Object.freeze({
	subscreen: "chatroom-admin-subscreen",
	title: "chatroom-admin-subscreen-hgroup",
	main: "chatroom-admin-subscreen-main",
	grid: "chatroom-admin-subscreen-grid",
	cancelButton: "chatroom-admin-subscreen-cancel",
	clearButton: "chatroom-admin-subscreen-clear",
	saveButton: "chatroom-admin-subscreen-save",
	imageURLInput: "InputImageURL",
	filterPicker: "room-custom-filter-picker",
	filterLabel: "room-custom-filter-label",
	imageFillModeSelect: "SelectImageFillMode",
	musicURLInput: "InputMusicURL",
	musicPlayButton: "room-custom-music-play",
	musicSyncCheckbox: "InputMusicSync",
	openLibraryButton: "OpenLibraryButton",
	library: "room-custom-library",
	libraryReturn: "room-custom-library-return",
	stage: "room-custom-stage",
	previewFrame: "room-custom-preview-frame",
	previewImage: "room-custom-preview-image",
	previewFilter: "room-custom-preview-filter",
});

/** @type {Readonly<Record<number, "fill" | "cover" | "contain">>} */
const ChatAdminRoomCustomizationSizeFit = {
	[DrawingResizeMode.Fill]: "fill",
	[DrawingResizeMode.FillOriginalRatio]: "cover",
	[DrawingResizeMode.ShowFullOriginalRatio]: "contain",
};

/**
 * Loads the chat Admin Custom screen properties and creates the inputs
 * @type {ScreenLoadHandler}
 */
async function ChatAdminRoomCustomizationLoad() {
	if (!ChatAdminData) {
		return;
	}
	const canEditCustom = ChatAdminRoomCustomizationCanEdit();
	const adminData = ChatAdminData;

	ChatAdminRoomCustomizationCurrent = null;
	const data = ChatAdminRoomCustomizationCurrent = ChatAdminData.Custom ? CommonCloneDeep(ChatAdminData.Custom) : { ImageURL: "", ImageFilter: "", MusicURL: "", SizeMode: DrawingResizeMode.Fill };
	data.SizeMode ??= DrawingResizeMode.Fill;

	const clearButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.clearButton, () => {
		if (!canEditCustom) return;
		data.SizeMode = DrawingResizeMode.Fill;
		ElementValue(ChatAdminRoomCustomizationIDs.imageURLInput, "");
		ElementValue(ChatAdminRoomCustomizationIDs.imageFillModeSelect, DrawingResizeMode.Fill.toString());
		data.ImageFilter = "";
		ElementValue(ChatAdminRoomCustomizationIDs.musicURLInput, "");
		ElementSetChecked(ChatAdminRoomCustomizationIDs.musicSyncCheckbox, false);
		ChatAdminRoomCustomizationRefreshPreview();
	},
	{
		image: "Icons/Reset.svg",
		tooltip: TextGet("ResetButtonTooltip"),
		disabled: !canEditCustom,
	});
	const saveButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.saveButton, () => {
		const MusicURL = ElementValue(ChatAdminRoomCustomizationIDs.musicURLInput).trim();
		const syncCheckbox = /** @type {HTMLInputElement} */ (ElementWrap(ChatAdminRoomCustomizationIDs.musicSyncCheckbox));
		// When syncing, preserve the original sync start, unless the track is different
		const MusicStart = syncCheckbox?.checked ?
			MusicURL === ChatRoomData?.Custom?.MusicURL ?
				data.MusicStart ?? CurrentTime
				: CurrentTime
			: undefined;
		adminData.Custom = ServerChatRoomDataValidationRecord.Custom({
			...adminData.Custom ?? {},
			ImageURL: ElementValue(ChatAdminRoomCustomizationIDs.imageURLInput).trim(),
			SizeMode: CommonParseInt(ElementValue(ChatAdminRoomCustomizationIDs.imageFillModeSelect)) ?? DrawingResizeMode.Fill,
			ImageFilter: data.ImageFilter,
			MusicURL,
			MusicStart,
		});
		ChatAdminRoomCustomizationExit();
	},
	{
		image: "Icons/Accept.png",
		tooltip: TextGet("SaveButtonTooltip"),
		disabled: !canEditCustom,
	});
	const cancelButton = ElementButton.Create(ChatAdminRoomCustomizationIDs.cancelButton, ChatAdminRoomCustomizationExit, {
		image: "Icons/Cancel.png",
		tooltip: TextGet("CancelButtonTooltip"),
	});

	ElementDOMScreen.getTemplate(
		ChatAdminRoomCustomizationIDs.subscreen,
		{
			menubarButtons: [
				cancelButton,
				saveButton,
				clearButton,
			],
			header: TextGet("Title"),
			hgroupInHeader: true,
			parent: document.body,
		},
	);

	const main = ElementWrap(ChatAdminRoomCustomizationIDs.main);

	const imageInput = ElementInput.Create(ChatAdminRoomCustomizationIDs.imageURLInput, { type: "text" },
		{
			attributes: {
				placeholder: "https://bondageprojects.com/images/school.jpg",
				autocomplete: "off",
				spellcheck: "false",
				"aria-label": TextGet("BackgroundImageLabel"),
				value: data.ImageURL ?? "",
				maxlength: "250",
				disabled: !canEditCustom,
			},
			eventListeners: {
				input: function() {
					data.ImageURL = this.value.trim();
					imageFillSelect.querySelector("select")?.toggleAttribute("disabled", !canEditCustom || !data.ImageURL);
					ChatAdminRoomCustomizationRefreshPreview();
				}
			}
		}
	);

	const options = Object.entries(DrawingResizeMode).map(([key, value]) => /** @type {Omit<HTMLOptions<"option">, "tag">} */({ attributes: { value, label: TextGet(`BackgroundSizeMode${key}`), selected: value === data.SizeMode } }));

	const imageFillSelect = ElementDropdown.CreateLabelled(ChatAdminRoomCustomizationIDs.imageFillModeSelect, options, TextGet("FillModeShort"), function () {
		data.SizeMode = Number(this.value);
		ChatAdminRoomCustomizationRefreshPreview();
	}, { disabled: !canEditCustom || !imageInput.value.trim() });

	const filterButton = ElementButton.Create(
		ChatAdminRoomCustomizationIDs.filterPicker,
		() => ChatAdminRoomCustomizationOpenFilterPicker(),
		{ disabled: !canEditCustom },
	);
	const filterLabel = ElementCreateSettingsLabel(
		TextGet("BackgroundFilterLabel"),
		filterButton,
		{ position: "left" },
	);
	filterLabel.id = ChatAdminRoomCustomizationIDs.filterLabel;

	const musicSyncInput = ElementCheckbox.CreateLabelled(
		ChatAdminRoomCustomizationIDs.musicSyncCheckbox,
		TextGet("BackgroundMusicSync"),
		null,
		{
			checked: data.MusicStart !== undefined
		},
		{
			"container": {
				parent: document.body
			},
			checkbox: {
				attributes: {
					disabled: !canEditCustom || !data.MusicURL,
				}
			}
		}
	);
	const musicInput = ElementInput.Create(ChatAdminRoomCustomizationIDs.musicURLInput, { type: "text" }, {
		attributes: {
			placeholder: "https://bondageprojects.com/music/relax.mp3",
			autocomplete: "off",
			spellcheck: "false",
			"aria-label": TextGet("BackgroundMusicLabel"),
			value: data.MusicURL ?? "",
			maxlength: "250",
			disabled: !canEditCustom,
		},
		eventListeners: {
			input: function() {
				data.MusicURL = this.value.trim();
				musicSyncInput.querySelector("input")?.toggleAttribute("disabled", !canEditCustom || !data.MusicURL);
				ChatAdminRoomCustomizationUpdateMusicPreview();
				ChatAdminRoomCustomizationRefreshPreview();
			},
		}
	});

	const playButton = ElementButton.Create(
		ChatAdminRoomCustomizationIDs.musicPlayButton,
		() => ChatAdminRoomCustomizationToggleMusic(),
		{
			image: "Icons/Play.svg",
			tooltip: TextGet("MusicPlay"),
			tooltipPosition: "bottom",
			disabled: !ServerChatRoomDataValidationRecord.Custom.MusicURL(data.MusicURL),
		},
		{
			button: {
				classList: ["room-custom-music-play"],
				attributes: { "aria-pressed": "false" },
			},
		}
	);

	const openLibraryButton = ElementButton.Create(
		ChatAdminRoomCustomizationIDs.openLibraryButton,
		() => {
			ChatAdminRoomCustomizationSetLibraryOpen(true);
		},
		{
			image: "Icons/Online.png",
			tooltip: TextGet("OpenLibraryButtonTooltip"),
			disabled: !canEditCustom,
			ariaExpanded: false,
			ariaControls: ChatAdminRoomCustomizationIDs.library,
		},
		{
			button: { classList: ["room-custom-text-button"] },
		}
	);

	const returnButton = ElementButton.Create(
		ChatAdminRoomCustomizationIDs.libraryReturn,
		() => {
			ChatAdminRoomCustomizationSetLibraryOpen(false);
		},
		{
			label: TextGet("Return"),
		},
		{
			button: { classList: ["room-custom-text-button"] },
		}
	);

	const tracks = ChatAdminRoomCustomizationMusicLibrary.map((music) => {
		const selectTrack = ElementButton.Create(
			null,
			() => {
				if (!canEditCustom) return;
				ElementValue(ChatAdminRoomCustomizationIDs.musicURLInput, music.URL);
			},
			{
				label: TextGet("MusicLibrary" + music.Name),
				disabled: !canEditCustom,
			},
			{
				button: {
					classList: ["room-custom-track-select"],
					attributes: { "aria-pressed": String(data.MusicURL === music.URL) },
					dataAttributes: { url: music.URL },
				},
			}
		);

		const openSource = ElementButton.Create(
			null,
			() => {
				window.open(music.Source, "_blank")?.focus();
			},
			{
				image: "Icons/YouTube.png",
				tooltip: TextGet("MusicSource"),
				tooltipPosition: "left",
			},
			{
				button: { classList: ["room-custom-track-source"] },
			}
		);

		return /** @type {HTMLOptions<"div">} */ ({
			tag: "div",
			classList: ["room-custom-track"],
			children: [selectTrack, openSource],
		});
	});

	const previewImage = ElementCreate({
		tag: "img",
		attributes: {
			id: ChatAdminRoomCustomizationIDs.previewImage,
			alt: "",
			draggable: "false",
			referrerpolicy: "no-referrer",
			decoding: "async",
		},
		eventListeners: {
			load: function() {
				if (this.dataset.pending && this.getAttribute("src") === this.dataset.pending) {
					ElementWrap(ChatAdminRoomCustomizationIDs.previewFrame)?.toggleAttribute("data-empty", false);
				}
			},
			error: function() {
				ElementWrap(ChatAdminRoomCustomizationIDs.previewFrame)?.toggleAttribute("data-empty", true);
			}
		}
	});

	const imageHint = ElementText.CreateHint(null, TextGet("BackgroundImageNote"), "left");
	const filterHint = ElementText.CreateHint(null, TextGet("BackgroundFilterNote"), "left");
	const musicHint = ElementText.CreateHint(null, TextGet("BackgroundMusicNote"), "left");

	const intro = ElementText.CreateNote(TextGet("Desc"));
	intro.classList.add("room-custom-intro");

	ElementCreate({
		tag: "div",
		parent: main,
		attributes: { id: ChatAdminRoomCustomizationIDs.grid },
		classList: ["room-custom-board"],
		children: [
			{
				tag: "div",
				classList: ["room-custom-fields", "scroll-box"],
				children: [
					{
						tag: "section",
						classList: ["room-custom-section"],
						children: [
							{ tag: "h2", children: [TextGet("SectionBackground")] },
							{
								tag: "div",
								classList: ["room-custom-field"],
								children: [imageInput, imageHint],
							},
							imageFillSelect,
							{
								tag: "div",
								classList: ["room-custom-filter"],
								children: [filterLabel, filterButton, filterHint],
							},
						],
					},
					{
						tag: "section",
						classList: ["room-custom-section"],
						children: [
							{ tag: "h2", children: [TextGet("SectionMusic")] },
							{
								tag: "div",
								classList: ["room-custom-music-row"],
								children: [musicInput, playButton, openLibraryButton, musicHint],
							},
							musicSyncInput,
						],
					},
				],
			},
			{
				tag: "div",
				classList: ["room-custom-stage"],
				attributes: { id: ChatAdminRoomCustomizationIDs.stage, "data-mode": "preview" },
				children: [
					{
						tag: "div",
						classList: ["room-custom-frame"],
						attributes: { id: ChatAdminRoomCustomizationIDs.previewFrame, "data-empty": true, "data-fit": "fill" },
						children: [
							previewImage,
							{
								tag: "div",
								classList: ["room-custom-preview-filter"],
								attributes: { id: ChatAdminRoomCustomizationIDs.previewFilter, "aria-hidden": "true" },
							},
							{
								tag: "p",
								classList: ["room-custom-empty"],
								children: [TextGet("PreviewEmpty")],
							},
						],
					},
					{
						tag: "div",
						classList: ["room-custom-library"],
						attributes: { id: ChatAdminRoomCustomizationIDs.library },
						children: [
							{
								tag: "div",
								classList: ["room-custom-library-header"],
								children: [
									returnButton,
									{
										tag: "p",
										classList: ["room-custom-hint"],
										children: [TextGet("TitleMusicLibrary")],
									},
								],
							},
							{
								tag: "div",
								classList: ["room-custom-library-grid", "scroll-box"],
								children: tracks,
							},
						],
					},
				],
			},
			intro,
		],
	});

	ChatAdminRoomCustomizationRefreshPreview();
}

/**
 * Required screen tick.
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationRun() {}

/**
 * Handles the click events on the admin custom screen. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationClick() {}

/**
 * Handles exiting from the admin custom screen, removes the inputs
 * @type {ScreenExitHandler}
 */
function ChatAdminRoomCustomizationExit() {
	CommonSetScreen("Online", "ChatAdmin");
}

function ChatAdminRoomCustomizationResize() {
	ElementPositionFixed(ChatAdminRoomCustomizationIDs.subscreen, 50, 50, 1900, 900);
	if (ElementWrap(ColorPicker.ids.root)) ColorPickerResize(false);
}

function ChatAdminRoomCustomizationUnload() {
	ChatAdminRoomCustomizationStopMusic();
	ChatAdminRoomCustomizationAudio = null;
	ElementRemove(ChatAdminRoomCustomizationIDs.subscreen);
	if (ElementWrap(ColorPicker.ids.root)) ColorPickerExit(true);
}

/**
 * Color picker state for a background filter. An empty filter starts fully transparent.
 * @param {string | undefined} value
 * @returns {NonNullable<ColorPickerInitOptions["colorState"]>}
 */
function ChatAdminRoomCustomizationFilterState(value) {
	const parsed = ColorPickerCSSToColor(value);
	return {
		colors: [parsed?.color ?? "#000000"],
		defaultColors: ["#000000"],
		opacity: [parsed?.opacity ?? 0],
		defaultOpacity: [0],
		editOpacity: true,
	};
}

/**
 * Opens the color picker for the background filter. Accept writes the chosen color back onto the form.
 * @returns {void}
 */
function ChatAdminRoomCustomizationOpenFilterPicker() {
	const data = ChatAdminRoomCustomizationCurrent;
	const picker = ElementWrap(ColorPicker.ids.root);
	if (!data || !ChatAdminRoomCustomizationCanEdit() || (picker && !picker.hidden)) return;

	CommonPromiseCatch(ColorPickerInit({
		colorState: ChatAdminRoomCustomizationFilterState(data.ImageFilter),
		heading: TextGet("BackgroundFilterLabel"),
		onInput: () => null,
		onExit: (state, save) => {
			if (!save) return;
			data.ImageFilter = ChatAdminRoomCustomizationFilterFromState(state);
			ChatAdminRoomCustomizationRefreshPreview();
		},
	}).then(root => root.classList.add("room-custom-color-picker")));
}

/**
 * Builds a background filter hex from a color picker result. Fully transparent values count as no filter.
 * @param {ItemColorExitState} state
 * @returns {string}
 */
function ChatAdminRoomCustomizationFilterFromState(state) {
	const opacity = CommonClamp(state.opacity[0] ?? 1, 0, 1);
	if (Math.round(opacity * 255) === 0) return "";
	return ColorPickerColorToCSS(state.colors[0] ?? "", opacity) ?? "";
}

/**
 * Updates the image preview and selected library track from the current form data.
 */
function ChatAdminRoomCustomizationRefreshPreview() {
	const data = ChatAdminRoomCustomizationCurrent;
	const frame = ElementWrap(ChatAdminRoomCustomizationIDs.previewFrame);
	const image = /** @type {HTMLImageElement | null} */ (ElementWrap(ChatAdminRoomCustomizationIDs.previewImage));
	const filter = ElementWrap(ChatAdminRoomCustomizationIDs.previewFilter);
	if (!data || !frame || !image || !filter) return;

	const fit = ChatAdminRoomCustomizationSizeFit[data.SizeMode ?? DrawingResizeMode.Fill] ?? "fill";
	frame.setAttribute("data-fit", fit);

	const url = ServerChatRoomDataValidationRecord.Custom.ImageURL(data.ImageURL) ?? "";
	if (!url) {
		image.dataset.pending = "";
		image.removeAttribute("src");
		frame.toggleAttribute("data-empty", true);
	} else if (image.dataset.pending !== url) {
		image.dataset.pending = url;
		frame.toggleAttribute("data-empty", true);
		image.src = url;
	}

	const filterValue = data.ImageFilter ?? "";
	const filterColor = CommonIsColor(filterValue, { allowAlpha: true }) ? filterValue : "";
	filter.style.backgroundColor = filterColor;
	ElementWrap(ChatAdminRoomCustomizationIDs.filterPicker)?.style.setProperty("--button-color", filterColor || "#ffffff");

	const musicURL = data.MusicURL ?? "";
	ElementWrap(ChatAdminRoomCustomizationIDs.library)?.querySelectorAll(".room-custom-track-select").forEach((button) => {
		button.setAttribute("aria-pressed", button.getAttribute("data-url") === musicURL ? "true" : "false");
	});
}

/**
 * Matches the play button icon, label, and disabled state to the preview audio.
 */
function ChatAdminRoomCustomizationSyncPlayButton() {
	const button = /** @type {HTMLButtonElement | null} */ (ElementWrap(ChatAdminRoomCustomizationIDs.musicPlayButton));
	if (!button) return;

	const audio = ChatAdminRoomCustomizationAudio;
	const playing = !!audio && !audio.paused && !audio.ended;
	button.disabled = !playing && !ChatAdminRoomCustomizationCurrent?.MusicURL;
	button.setAttribute("aria-pressed", String(playing));
	const label = TextGet(playing ? "MusicPause" : "MusicPlay");
	const tooltip = button.querySelector(".button-tooltip");
	if (tooltip) tooltip.textContent = label;
	ElementButton.SetImage(button, playing ? "Icons/Pause.svg" : "Icons/Play.svg");
}

/**
 * Stops music preview.
 */
function ChatAdminRoomCustomizationStopMusic() {
	ChatAdminRoomCustomizationAudio?.pause();
	ChatAdminRoomCustomizationSyncPlayButton();
}

/**
 * Starts preview playback. An aborted play is ignored when this preview is no longer the active one.
 * @param {HTMLAudioElement} player
 * @param {string} url
 */
function ChatAdminRoomCustomizationPlayPreview(player, url) {
	player.play().catch((error) => {
		if (player !== ChatAdminRoomCustomizationAudio || player.dataset.source !== url || !player.paused) return;
		console.error("Caught an unhandled promise:", error);
		ChatAdminRoomCustomizationStopMusic();
	});
}

/**
 * Plays or pauses the music URL currently entered on the form.
 */
function ChatAdminRoomCustomizationToggleMusic() {
	const url = ChatAdminRoomCustomizationCurrent?.MusicURL;
	const audio = ChatAdminRoomCustomizationAudio;
	if (!url || (audio && !audio.paused && audio.dataset.source === url)) {
		ChatAdminRoomCustomizationStopMusic();
		return;
	}

	const player = audio ?? (ChatAdminRoomCustomizationAudio = new Audio());
	if (!audio) {
		player.loop = true;
		player.addEventListener("play", ChatAdminRoomCustomizationSyncPlayButton);
		player.addEventListener("pause", ChatAdminRoomCustomizationSyncPlayButton);
		player.addEventListener("ended", ChatAdminRoomCustomizationSyncPlayButton);
	}
	player.volume = CommonClamp(Player.AudioSettings.MusicVolume, 0, 1);
	if (player.dataset.source !== url) {
		player.dataset.source = url;
		player.src = url;
	}
	ChatAdminRoomCustomizationPlayPreview(player, url);
}

/**
 * Keeps preview playback aligned with the music field.
 * An empty field stops preview. Picking a library track while preview is playing switches to that track.
 */
function ChatAdminRoomCustomizationUpdateMusicPreview() {
	const url = ChatAdminRoomCustomizationCurrent?.MusicURL;
	const audio = ChatAdminRoomCustomizationAudio;
	const playing = !!audio && !audio.paused && !audio.ended;
	if (audio && playing && audio.dataset.source !== url) {
		if (!ChatAdminRoomCustomizationCurrent?.MusicURL) {
			ChatAdminRoomCustomizationStopMusic();
			return;
		}
		if (url && ChatAdminRoomCustomizationMusicLibrary.some((music) => music.URL === url)) {
			audio.dataset.source = url;
			audio.src = url;
			ChatAdminRoomCustomizationPlayPreview(audio, url);
		}
	}
	ChatAdminRoomCustomizationSyncPlayButton();
}

/**
 * Shows or hides the in-screen music library.
 * @param {boolean} open
 */
function ChatAdminRoomCustomizationSetLibraryOpen(open) {
	const stage = ElementWrap(ChatAdminRoomCustomizationIDs.stage);
	stage?.setAttribute("data-mode", open ? "library" : "preview");
	ElementWrap(ChatAdminRoomCustomizationIDs.openLibraryButton)?.setAttribute("aria-expanded", open ? "true" : "false");
	const focusTarget = open ? ChatAdminRoomCustomizationIDs.libraryReturn : ChatAdminRoomCustomizationIDs.openLibraryButton;
	const focusElement = ElementWrap(focusTarget);
	if (focusElement && document.activeElement !== focusElement) focusElement.focus();
}

/**
 * Checks whether the player is allowed to change customization settings
 * @returns {boolean} - true if the player is allowed to change customization settings, false otherwise
 */
function ChatAdminRoomCustomizationCanEdit() {
	// Either the player is creating the room or they're an admin of an existing one
	return (ChatRoomData === null) || ChatRoomPlayerIsAdmin();
}

/**
 * Reconfigures the chat room's customisation
 * @param {string[]} args - The value to set in that property
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationCommand(args) {
	if (!ChatRoomData) {
		throw new Error('Missing "ChatRoomData" data');
	}

	if (!args.length) {
		if (!ChatRoomData.Custom) {
			ChatRoomSendLocal("No custom room data");
			return;
		}
		const str = [];
		if (ChatRoomData.Custom.ImageURL) str.push(`Background image: ${ChatRoomData.Custom.ImageURL}`);
		if (ChatRoomData.Custom.ImageFilter) str.push(`Background filter: ${ChatRoomData.Custom.ImageFilter}`);
		if (ChatRoomData.Custom.MusicURL) str.push(`Background music: ${ChatRoomData.Custom.MusicURL}`);
		str.push(`Music sync is: ${ChatRoomData.Custom.MusicStart !== undefined ? "on" : "off"}`);
		ChatRoomSendLocal("Custom room info:\n" + str.map(s => `- ${s}`).join("\n"));
		return;
	}

	/** @type {ServerChatRoomCustomData | undefined} */
	const customData = CommonCloneDeep(ChatRoomData.Custom) ?? {};
	const seen = new Set();
	let param;
	while ((param = args.shift()?.trim())) {
		switch (param) {
			case "enable":
			case "disable": {
				ChatRoomUpdateCustomization(param === "enable");
				break;
			}
			case "image": {
				if (!ChatRoomPlayerIsAdmin()) {
					ChatRoomSendLocal("Editing the room customization requires administrator privileges.");
					break;
				}
				if (seen.has(param)) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				seen.add(param);
				const arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				if (arg === "-") {
					customData.ImageURL = undefined;
					break;
				}
				const safeArg = ServerChatRoomDataValidationRecord.Custom.ImageURL(arg);
				if (!safeArg) {
					ChatRoomSendLocal(`Invalid value "${arg}" for "${param}" parameter. It needs an URL or a BC resource path.`);
					return;
				}
				customData.ImageURL = safeArg;
				break;
			}
			case "filter": {
				if (!ChatRoomPlayerIsAdmin()) {
					ChatRoomSendLocal("Editing the room customization requires administrator privileges.");
					break;
				}
				if (seen.has(param)) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				seen.add(param);
				const arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				if (arg === "-") {
					customData.ImageFilter = undefined;
					break;
				}
				const safeArg = ServerChatRoomDataValidationRecord.Custom.ImageFilter(arg);
				if (!safeArg) {
					ChatRoomSendLocal(`Invalid value "${arg}" for "${param}" parameter. It needs an HexColor.`);
					return;
				}
				customData.ImageFilter = safeArg;
				break;
			}
			case "music": {
				if (!ChatRoomPlayerIsAdmin()) {
					ChatRoomSendLocal("Editing the room customization requires administrator privileges.");
					break;
				}
				if (seen.has(param)) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				seen.add(param);
				const arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				if (arg.trim() === "-") {
					customData.MusicURL = undefined;
					break;
				}
				const safeArg = ServerChatRoomDataValidationRecord.Custom.MusicURL(arg);
				if (!safeArg) {
					ChatRoomSendLocal(`Invalid value "${arg}" "${param}" for parameter. It needs an URL.`);
					return;
				}
				customData.MusicURL = safeArg;
				break;
			}
			case "sync": {
				if (!ChatRoomPlayerIsAdmin()) {
					ChatRoomSendLocal("Editing the room customization requires administrator privileges.");
					break;
				}
				if (seen.has(param)) {
					ChatRoomSendLocal(`Duplicate "${param}" parameter`);
					return;
				}
				seen.add(param);
				let arg = args.shift()?.trim();
				if (!arg) {
					ChatRoomSendLocal(`Missing argument for "${param}" parameter`);
					return;
				}
				arg = arg.trim();
				/** @type {Record<string, boolean | undefined>} */
				const boolParams = {
					"1": true,
					"0": false,
					"on": true,
					"off": false,
					"true": true,
					"false": false,
					"-": false,
				};
				if (boolParams[arg] === undefined) {
					ChatRoomSendLocal(`Invalid value "${arg}" "${param}" for parameter. Recognized values are ${Object.keys(boolParams).map(v => `'${v}'`).join(" ")}`);
					return;
				}
				if (boolParams[arg]) {
					customData.MusicStart = CurrentTime;
				} else {
					customData.MusicStart = undefined;
				}
				break;
			}
			default:
				ChatRoomSendLocal(`Unknown parameter "${param}"`);
				return;
		}
	}

	// Update the room's custom data
	const UpdatedRoom = ChatRoomGetSettings(ChatRoomData);
	UpdatedRoom.Custom = ServerChatRoomDataValidationRecord.Custom(customData);
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });
}

/**
 * Runs the customization on the current screen, can be called from elsewhere
 * @deprecated DrawProcess knows how to handle custom backgrounds, and the music support is highly specific
 * @param {ServerChatRoomCustomData | null} Custom - The customization to apply
 * @param {Rect | null} DrawBGToRect - If non-null draw the background to these coordinates. Online chat rooms will use the tracked values elsewhere
 * @param {boolean} DrawBGEffects - If true and drawing a background then apply blur/dark/tint
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationProcess(Custom, DrawBGToRect, DrawBGEffects) {}
