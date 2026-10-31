"use strict";
var InformationSheetBackground = "Sheet";
/**
 * The character we're showing the information of.
 *
 * Also used by OnlineProfile.js
 * @type {null | Character | NPCCharacter}
 */
var InformationSheetSelection = null;
/** @type {ScreenSpecifier | null} */
var InformationSheetReturnScreen = null;

const InformationSheetIDs = Object.freeze({
	screen: "information-sheet-screen",
	exit: "information-sheet-exit",
	title: "information-sheet-title",
	preference: "information-sheet-preference",
	friendList: "information-sheet-friend-list",
	profile: "information-sheet-profile",
	ownersNotes: "information-sheet-owners-notes",
	tooltip: "information-sheet-tooltip",
});

/** @type {HTMLDivElement | null} */
let InformationSheetTooltip = null;

/** @type {HTMLCanvasElement | null} */
let InformationSheetPortrait = null;
/**
 * Loads the Information Sheet, cache the sub screens
 * @type {ScreenLoadHandler}
 */
async function InformationSheetLoad() {
	if (!InformationSheetSelection) throw new Error("No character selected");

	await Promise.all([
		TextPrefetch("Character", "FriendList").loadedPromise,
		TextPrefetch("Character", "Preference").loadedPromise,
		TextPrefetch("Character", "Title").loadedPromise,
	]);

	const C = InformationSheetSelection;

	const screen = ElementDOMScreen.getTemplate(InformationSheetIDs.screen, {
		menubarButtons: InformationSheetMenuButtons(C),
		mainContent: [InformationSheetContent(C)],
		parent: document.body,
	});

	const menu = ElementWrap(`${InformationSheetIDs.screen}-menu`);
	menu?.setAttribute("aria-orientation", "vertical");
	menu?.setAttribute("data-direction", "ltr");

	InformationSheetTooltip = ElementCreate({
		tag: "div",
		attributes: { id: InformationSheetIDs.tooltip, role: "tooltip", hidden: true },
		parent: screen,
	});
	InformationSheetPortrait = /** @type {HTMLCanvasElement} */ (ElementWrap("information-sheet-portrait"));

	if (!C.IsPlayer()) return;

	const dropdownOptions = Object.values(AllowedInteractions)
		.map((e) => /** @type {Omit<HTMLOptions<"option">, "tag">} */({
			attributes: {
				value: e.toString(),
				label: TextGet("AllowedInteraction" + e.toString()),
				selected: e === Player.AllowedInteractions
			}
		}));

	ElementCreate({
		tag: "label",
		attributes: {
			id: "AllowedInteractions-dropdown-container",
			for: "AllowedInteractions-dropdown"
		},
		style: {
			display: "grid",
			"grid-template-rows": "max-content max-content",
			"grid-template-columns": "auto",
			"gap": "var(--gap)"
		},
		children: [
			{
				tag: "span",
				attributes: { id: "AllowedInteractions-dropdown-label" },
				children: [TextGet("AllowedInteractions")],
				style: { "user-select": "none" }
			},
			ElementDropdown.Create("AllowedInteractions-dropdown", dropdownOptions, function (ev) {
				ev.preventDefault();
				if (this.value in Object.values(AllowedInteractions) === false) return;
				Player.AllowedInteractions = /** @type {AllowedInteractions} */ (CommonParseInt(this.value));
				if (Player.GetDifficulty() >= Difficulty.EXTREME) LoginExtremeItemSettings(Player.AllowedInteractions === AllowedInteractions.Everyone);

				const P = {
					ItemPermission: Player.AllowedInteractions,
					AllowedInteractions: Player.AllowedInteractions,
					...ServerPackItemPermissions(Player.PermissionItems),
				};
				ServerAccountUpdate.QueueData(P);
			})
		],
		parent: document.body
	});
}

/**
 * Main function of the character info screen. It's called continuously, so be careful
 * to add time consuming functions or loops here
 * @returns {void} - Nothing
 */
function InformationSheetRun() {
	const C = InformationSheetSelection;
	if (!C) return;

	if (!InformationSheetPortrait) return;
	const ctx = InformationSheetPortrait.getContext("2d");
	if (!ctx) return;
	ctx.clearRect(0, 0, InformationSheetPortrait.width, InformationSheetPortrait.height);
	DrawCharacter(C, 0, 0, 0.9, undefined, ctx);
}

/**
 * Handles the click events on the screen
 * @type {MouseEventListener}
 */
function InformationSheetClick() {}

function InformationSheetResize() {
	if (!InformationSheetSelection || !ElementWrap(InformationSheetIDs.screen)) return;
	InformationSheetHideTooltip();
	ElementPositionFixed(InformationSheetIDs.screen, 50, 70, 1900, 870);

	if (!InformationSheetSelection.IsPlayer()) return;

	ElementSetPosition("AllowedInteractions-dropdown-container", 550, 800);
	ElementSetSize("AllowedInteractions-dropdown", 600);
	ElementSetFontSize("AllowedInteractions-dropdown-container", "auto");
}

/**
 * Cleanup all elements, if the user exits the screen
 * @type {ScreenExitHandler}
 */
function InformationSheetExit() {
	if (InformationSheetReturnScreen) {
		CommonSetScreen(...InformationSheetReturnScreen);
	}
	InformationSheetReturnScreen = null;
}

function InformationSheetUnload() {
	InformationSheetHideTooltip();
	InformationSheetTooltip = null;
	ElementRemove(InformationSheetIDs.screen);
	ElementRemove("AllowedInteractions-dropdown-container");
}

/**
 * Loads the information sheet for a character
 * @param {Character} C - The character whose information sheet should be displayed
 * @returns {void} - Nothing
 */
function InformationSheetLoadCharacter(C) {
	InformationSheetSelection = C;
	if (!InformationSheetReturnScreen) {
		InformationSheetReturnScreen = CommonGetScreen();
	}
	CommonSetScreen("Character", "InformationSheet");
}

/**
 * Icon buttons for the screen menu. The column runs downward from the exit button.
 * Profile and owner notes share one row, with notes to the left.
 * @param {Character} C
 * @returns {HTMLElement[]}
 */
function InformationSheetMenuButtons(C) {
	/** @type {HTMLElement[]} */
	const buttons = [
		InformationSheetMenuButton(InformationSheetIDs.exit, InformationSheetExit, "Icons/Exit.png", TextGet("MenuExit")),
	];

	if (!C.IsPlayer() && !C.IsOnline()) {
		return buttons;
	}

	if (C.IsPlayer()) {
		if (!TitleIsForced(TitleGet(C))) {
			buttons.push(InformationSheetMenuButton(
				InformationSheetIDs.title,
				() => { CommonSetScreen("Character", "Title"); },
				"Icons/Title.png",
				TextGet("MenuTitle"),
			));
		}
		buttons.push(
			InformationSheetMenuButton(
				InformationSheetIDs.preference,
				() => { CommonSetScreen("Character", "Preference"); },
				"Icons/Preference.png",
				TextGet("MenuPreference"),
			),
			InformationSheetMenuButton(
				InformationSheetIDs.friendList,
				() => { CommonSetScreen("Character", "FriendList"); },
				"Icons/FriendList.png",
				TextGet("MenuFriendList"),
			),
		);
	}

	const showNotes = C.HasOwnerNotes() || C.IsFullyOwnedByPlayer();
	buttons.push(
		InformationSheetMenuButton(
			InformationSheetIDs.profile,
			() => OnlineProfileStart("description"),
			"Icons/Introduction.png",
			TextGet("MenuProfile"),
		),
		...(showNotes ? [InformationSheetMenuButton(
			InformationSheetIDs.ownersNotes,
			() => OnlineProfileStart("ownersNotes"),
			"Icons/Management.png",
			TextGet("MenuOwnersNotes"),
		)] : []),
	);

	return buttons;
}

/**
 * @param {string} id
 * @param {(this: HTMLButtonElement, ev: PointerEvent) => void} onClick
 * @param {string} image
 * @param {string} tooltip
 * @param {readonly string[]} [classList]
 * @returns {HTMLButtonElement}
 */
function InformationSheetMenuButton(id, onClick, image, tooltip, classList) {
	return ElementButton.Create(id, onClick, {
		image,
		tooltip,
		tooltipPosition: "left",
		role: "menuitem",
	}, {
		button: { classList: classList ? [...classList] : [] },
	});
}

/**
 * Sheet body. The portrait column is left empty so the canvas character shows through.
 * @param {Character} C
 * @returns {HTMLDivElement}
 */
function InformationSheetContent(C) {
	return ElementCreate({
		tag: "div",
		classList: ["information-sheet"],
		children: [
			{
				tag: "canvas",
				classList: ["information-sheet-portrait"],
				attributes: { id: "information-sheet-portrait", "aria-hidden": true, width: "500", height: "1000" },
			},
			{
				tag: "div",
				classList: ["information-sheet-body"],
				children: [
					{
						tag: "div",
						classList: ["information-sheet-identity-slot"],
						children: [InformationSheetIdentity(C)],
					},
				],
			},
		],
	});
}

/**
 * @param {Character} C
 * @returns {HTMLElement}
 */
function InformationSheetIdentity(C) {
	/** @type {HTMLElement[]} */
	const facts = [
		...InformationSheetFact(TextGet("Name"), C.Name, null, true),
	];
	if (C.Name !== CharacterNickname(C)) {
		facts.push(...InformationSheetFact(TextGet("Nickname"), CharacterNickname(C), null, true));
	}

	const title = TitleGet(C);
	if (title !== "None") {
		const titleClass = (() => {
			if (TitleIsForced(title)) return "information-sheet-title-forced";
			if (TitleIsEarned(title)) return "information-sheet-title-earned";
			return null;
		})();
		facts.push(...InformationSheetFact(TextGet("Title"), TitleGetName(title), titleClass, true));
	}
	if (C.MemberNumber != null) {
		facts.push(...InformationSheetFact(TextGet("MemberNumber"), C.MemberNumber.toString(), null, true));
	}
	facts.push(...InformationSheetFact(TextGet("Pronouns"), CharacterPronounDescription(C)));

	/** @type {HTMLElement[]} */
	const notes = [];
	if (C.IsPlayer()) {
		facts.push(...InformationSheetFact(TextGet("Money"), `$${C.Money}`));
		notes.push(InformationSheetSince(
			TextGet(C.IsBirthday() ? "Birthday" : "MemberFor"),
			C.Creation,
			C.IsBirthday() ? ["information-sheet-birthday"] : [],
		));
		notes.push(InformationSheetDifficulty(C));
	} else if (C.IsOnline()) {
		if (C.Creation != null) {
			notes.push(InformationSheetSince(
				TextGet(C.IsBirthday() ? "Birthday" : "MemberFor"),
				C.Creation,
				C.IsBirthday() ? ["information-sheet-birthday"] : [],
			));
		}
		notes.push(InformationSheetDifficulty(C));
		facts.push(...InformationSheetFact(
			TextGet("AllowedInteractions"),
			TextGet("AllowedInteraction" + C.AllowedInteractions.toString()),
		));
	} else if (C.IsNpc()) {
		notes.push(InformationSheetSince(TextGet("FriendsFor"), NPCEventGet(C, "PrivateRoomEntry")));
	}

	return ElementCreate({
		tag: "div",
		classList: ["information-sheet-identity", "information-sheet-panel"],
		children: [
			{
				tag: "dl",
				classList: ["information-sheet-facts"],
				children: facts,
			},
			...notes,
		],
	});
}

/**
 * @param {string} label
 * @param {string} value
 * @param {string | null} [valueClass]
 * @param {boolean} [copy]
 * @returns {[HTMLElement, HTMLElement]}
 */
function InformationSheetFact(label, value, valueClass, copy = false) {
	return [
		ElementCreate({ tag: "dt", children: [label] }),
		ElementCreate({
			tag: "dd",
			classList: valueClass ? [valueClass] : [],
			children: [copy ? InformationSheetCopy(value) : value],
		}),
	];
}

/**
 * Copies the value on press.
 * @param {string} text
 * @returns {HTMLSpanElement}
 */
function InformationSheetCopy(text) {
	return ElementCreate({
		tag: "span",
		classList: ["information-sheet-copy"],
		eventListeners: {
			click(ev) {
				ev.preventDefault();
				CommonClipboardWrite(text);
			},
		},
		children: [text],
	});
}

/**
 * @param {Character} C
 * @returns {HTMLParagraphElement}
 */
function InformationSheetDifficulty(C) {
	let text = `${TextGet("DifficultyLevel" + C.GetDifficulty())} ${TextGet("DifficultyTitle")}`;
	if (C.IsPlayer()) {
		const maxDelay = 7;
		const lastChange = typeof C.Difficulty.LastChange === "number" ? C.Difficulty.LastChange : C.Creation;
		const daysSince = Math.floor((CurrentTime - lastChange) / MS_PER_DAY);
		const remaining = daysSince >= maxDelay ? 0 : maxDelay - daysSince;
		text += TextGet("DifficultyDaysTillCanChange").replace("NumberOfDays", remaining.toString());
	}
	return ElementCreate({
		tag: "p",
		classList: ["information-sheet-note"],
		children: [text],
	});
}

/**
 * @param {string} label
 * @param {number} start
 * @param {readonly string[]} [classList]
 * @returns {HTMLParagraphElement}
 */
function InformationSheetSince(label, start, classList) {
	const formatted = CommonFormatDurationRange(CurrentTime, start, {
		showFull: true,
		includeYears: true,
		includeMonths: true,
		includeDays: true,
	});
	const line = ElementCreate({
		tag: "p",
		classList: ["information-sheet-since", ...(classList ?? [])],
		children: [`${label} ${formatted}`],
	});
	if (start > 0) InformationSheetHover(line, InformationSheetTimestampTooltip(start));
	return line;
}

/**
 * @param {number} start
 * @returns {string}
 */
function InformationSheetTimestampTooltip(start) {
	const startDate = new Date(start).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
	const precise = CommonFormatDurationRange(CurrentTime, start, { showFull: true });
	return `${startDate} — ${precise}`;
}

/**
 * @param {HTMLElement} host
 * @param {string} text
 */
function InformationSheetHover(host, text) {
	host.classList.add("information-sheet-hover");
	host.addEventListener("pointerenter", () => InformationSheetShowTooltip(host, text));
	host.addEventListener("pointerleave", InformationSheetHideTooltip);
}

/**
 * @param {HTMLElement} anchor
 * @param {string} text
 */
function InformationSheetShowTooltip(anchor, text) {
	const tip = InformationSheetTooltip;
	if (!tip) return;
	tip.textContent = text;
	tip.removeAttribute("hidden");
	tip.style.setProperty("left", "0px");
	tip.style.setProperty("top", "0px");

	const anchorRect = anchor.getBoundingClientRect();
	const tipRect = tip.getBoundingClientRect();
	const margin = 8;
	let left = anchorRect.left;
	let top = anchorRect.bottom + 6;
	if (left + tipRect.width > window.innerWidth - margin) {
		left = Math.max(margin, window.innerWidth - tipRect.width - margin);
	}
	if (top + tipRect.height > window.innerHeight - margin) {
		top = Math.max(margin, anchorRect.top - tipRect.height - 6);
	}
	tip.style.setProperty("left", `${left}px`);
	tip.style.setProperty("top", `${top}px`);
}

function InformationSheetHideTooltip() {
	const tip = InformationSheetTooltip;
	if (!tip) return;
	tip.textContent = "";
	tip.setAttribute("hidden", true);
}
