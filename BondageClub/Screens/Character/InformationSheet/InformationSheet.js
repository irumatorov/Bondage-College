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

/** @type {Readonly<Record<0 | 1 | 2, "Dating" | "Engaged" | "Married">>} */
const InformationSheetLoverStages = {
	0: "Dating",
	1: "Engaged",
	2: "Married",
};

/**
 * Skill rows whose modifier can expire while the sheet is open.
 * @type {{ type: SkillType, value: HTMLElement, modifier: HTMLElement }[]}
 */
let InformationSheetSkillWatches = [];
/** @type {number} */
let InformationSheetSkillRefreshAt = 0;

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

	InformationSheetSkillWatches = [];

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
	InformationSheetSkillRefreshAt = CurrentTime + 1000;

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
	DrawCharacter(C, 0, 0, 1, true, ctx);

	if (!C.IsPlayer() || InformationSheetSkillWatches.length === 0) return;
	if (CurrentTime < InformationSheetSkillRefreshAt) return;
	InformationSheetSkillRefreshAt = CurrentTime + 1000;
	InformationSheetRefreshSkills(C);
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
	InformationSheetSkillWatches = [];
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
 * Portrait on the left. Identity and skills stack on one side, with reputation beside the skills.
 * Owner and significant others stay on the right.
 * @param {Character} C
 * @returns {HTMLDivElement}
 */
function InformationSheetContent(C) {
	/** @type {HTMLElement[]} */
	const sections = [
		ElementCreate({
			tag: "div",
			classList: ["information-sheet-identity-slot"],
			children: [InformationSheetIdentity(C)],
		}),
		ElementCreate({
			tag: "div",
			classList: ["information-sheet-relations-slot"],
			children: [
				InformationSheetColumn("Owner", [InformationSheetOwnership(C)], "Unowned", undefined, false),
				InformationSheetRelationshipColumn(C),
			],
		}),
	];
	if (C.IsPlayer()) sections.push(InformationSheetSkillColumn(C));
	if (C.IsPlayer() || C.IsOnline()) sections.push(InformationSheetReputationColumn(C));

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
				dataAttributes: { layout: InformationSheetLayout(C) },
				children: sections,
			},
		],
	});
}

/**
 * @param {Character} C
 * @returns {"player" | "online" | "npc" | "basic"}
 */
function InformationSheetLayout(C) {
	if (C.IsNpc()) return "npc";
	if (C.IsPlayer()) return "player";
	if (C.IsOnline()) return "online";
	return "basic";
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

/**
 * @param {Character} C
 * @returns {HTMLElement}
 */
function InformationSheetOwnership(C) {
	if (!C.IsOwned()) {
		return ElementCreate({
			tag: "p",
			classList: ["information-sheet-owner"],
			children: [TextGet("Unowned")],
		});
	}

	const stageText = C.IsFullyOwned() ? "Collared" : "Trial";
	const ownerNumber = C.OwnerNumber();
	const since = C.OwnedSinceMs();
	return ElementCreate({
		tag: "div",
		classList: ["information-sheet-ownership"],
		children: [
			{
				tag: "p",
				classList: ["information-sheet-owner"],
				children: [
					`${TextGet(`${stageText}By`)} `,
					InformationSheetCopy(C.OwnerName()),
					ownerNumber !== -1 ? " (" : null,
					ownerNumber !== -1 ? InformationSheetCopy(ownerNumber.toString()) : null,
					ownerNumber !== -1 ? ")" : null,
				],
			},
			since > 0 ? InformationSheetDuration(since) : null,
		],
	});
}

/**
 * @param {string} titleKey
 * @param {readonly HTMLElement[]} entries
 * @param {string} [emptyKey]
 * @param {string} [area]
 * @param {boolean} [scroll]
 * @returns {HTMLElement}
 */
function InformationSheetColumn(titleKey, entries, emptyKey = "None", area, scroll = true) {
	return ElementCreate({
		tag: "section",
		classList: [
			"information-sheet-column",
			"information-sheet-panel",
			scroll ? "scroll-box" : null,
			area ? `information-sheet-area-${area}` : null,
		],
		eventListeners: scroll ? {
			scroll: InformationSheetHideTooltip,
		} : {},
		children: [
			{ tag: "h3", children: [TextGet(titleKey)] },
			...(entries.length ? entries : [/** @type {HTMLOptions<"p">} */({
				tag: "p",
				classList: ["information-sheet-empty"],
				children: [TextGet(emptyKey)],
			})]),
		],
	});
}

/**
 * @param {Character} C
 * @returns {HTMLElement}
 */
function InformationSheetRelationshipColumn(C) {
	/** @type {HTMLElement[]} */
	const entries = [];

	if (C.IsNpc()) {
		entries.push(InformationSheetAffection(C.Love ?? 0));
		const playerLove = C.GetLovership().find((lover) => lover.MemberNumber === Player.MemberNumber);
		if (playerLove) {
			entries.push(InformationSheetLoverEntry(C.LoverName() || playerLove.Name, playerLove.Stage, playerLove.Start ?? 0));
		} else if (!C.LoverName()) {
			entries.push(ElementCreate({
				tag: "p",
				classList: ["information-sheet-empty"],
				children: [`${TextGet("Lover")} ${TextGet("None")}`],
			}));
		}
	} else {
		for (const lover of C.GetLovership()) {
			entries.push(InformationSheetLoverEntry(lover.Name, lover.Stage, lover.Start ?? 0, lover.MemberNumber));
		}
	}

	const titleKey = C.IsNpc() ?  "YourRelations" : "Relationships";

	return InformationSheetColumn(titleKey, entries);
}

/**
 * @param {string} name
 * @param {0 | 1 | 2 | undefined} stage
 * @param {number} start
 * @param {number} [memberNumber]
 * @returns {HTMLElement}
 */
function InformationSheetLoverEntry(name, stage, start, memberNumber) {
	const stageKey = InformationSheetLoverStages[stage ?? 0];
	return ElementCreate({
		tag: "article",
		classList: ["information-sheet-entry"],
		children: [
			{
				tag: "p",
				classList: ["information-sheet-entry-title"],
				children: [
					`${TextGet(`${stageKey}With`)} `,
					InformationSheetCopy(name),
					memberNumber != null ? " (" : null,
					memberNumber != null ? InformationSheetCopy(memberNumber.toString()) : null,
					memberNumber != null ? ")" : null,
				],
			},
			start > 0 ? InformationSheetDuration(start) : null,
		],
	});
}

/**
 * @param {number} love
 * @returns {string}
 */
function InformationSheetLoveQualifier(love) {
	if (love >= 100) return "RelationshipPerfect";
	if (love >= 75) return "RelationshipGreat";
	if (love >= 50) return "RelationshipGood";
	if (love >= 25) return "RelationshipFair";
	if (love > -25) return "RelationshipNeutral";
	if (love > -50) return "RelationshipPoor";
	if (love > -75) return "RelationshipBad";
	if (love > -100) return "RelationshipHorrible";
	return "RelationshipAtrocious";
}

/**
 * @param {number} love
 * @returns {HTMLDivElement}
 */
function InformationSheetAffection(love) {
	return InformationSheetTextStat(
		"",
		`${love} ${TextGet(InformationSheetLoveQualifier(love))}`,
		[InformationSheetBimeter(love, 100)],
		["information-sheet-entry"],
	);
}

/**
 * Zero sits on the center line. Negative values grow left, positive values grow right.
 * @param {number} value
 * @param {number} max
 * @param {readonly string[]} [classList]
 * @param {string} [color]
 * @returns {HTMLDivElement}
 */
function InformationSheetBimeter(value, max, classList, color) {
	const magnitude = Math.min(max, Math.abs(value));
	const pct = max > 0 ? magnitude / max * 50 : 0;
	return ElementCreate({
		tag: "div",
		classList: ["information-sheet-bimeter", ...(classList ?? [])],
		attributes: { "aria-hidden": true },
		children: [
			{
				tag: "span",
				classList: ["information-sheet-bimeter-fill"],
				dataAttributes: { sign: value < 0 ? "negative" : "positive" },
				style: { width: `${pct}%`, "background-color": color },
			},
			{ tag: "span", classList: ["information-sheet-bimeter-axis"] },
		],
	});
}

/**
 * @param {number} start
 * @returns {HTMLParagraphElement}
 */
function InformationSheetDuration(start) {
	const formatted = CommonFormatDurationRange(CurrentTime, start, {
		showFull: true,
		includeYears: true,
		includeMonths: true,
		includeDays: true,
	});
	const line = ElementCreate({
		tag: "p",
		classList: ["information-sheet-duration"],
		children: [`${TextGet("For")} ${formatted}`],
	});
	InformationSheetHover(line, InformationSheetTimestampTooltip(start));
	return line;
}

/**
 * @param {PlayerCharacter} C
 * @returns {HTMLElement}
 */
function InformationSheetSkillColumn(C) {
	/** @type {HTMLElement[]} */
	const entries = [];
	for (const type of SkillValidSkills) {
		if (SkillGetLevelReal(C, type) === 0 && SkillGetProgress(C, type) === 0) continue;
		entries.push(InformationSheetSkill(C, type));
	}
	return InformationSheetColumn("Skill", entries, "SkillNone", "skills");
}

/**
 * @param {PlayerCharacter} C
 * @param {SkillType} type
 * @returns {HTMLDivElement}
 */
function InformationSheetSkill(C, type) {
	const real = SkillGetLevelReal(C, type);
	const progress = SkillGetProgress(C, type);
	const ratio = SkillGetRatio(C, type);
	const modifier = SkillGetModifier(C, type);
	const value = ElementCreate({
		tag: "span",
		classList: ["information-sheet-stat-value"],
		children: [InformationSheetSkillValue(C, type)],
	});

	/** @type {HTMLElement | null} */
	let modifierEl = null;
	if (modifier) {
		modifierEl = ElementCreate({
			tag: "span",
			classList: [
				"information-sheet-modifier",
				modifier > 0 ? "information-sheet-positive" : "information-sheet-negative",
			],
			children: [InformationSheetModifierText(modifier, SkillGetModifierDuration(C, type))],
		});
		InformationSheetSkillWatches.push({ type, value, modifier: modifierEl });
	}

	const skill = ElementCreate({
		tag: "div",
		classList: ["information-sheet-skill"],
		children: [
			InformationSheetTextStat(
				TextGet(`Skill${type}`),
				ElementCreate({
					tag: "span",
					classList: ["information-sheet-skill-figures"],
					children: [modifierEl, value],
				}),
				[InformationSheetSkillPips(real, progress, ratio)],
			),
		],
	});
	if (ratio !== 1) InformationSheetHover(skill, InformationSheetSkillRatioText(type, ratio));
	return skill;
}

/**
 * One pip per level. Levels already reached are full, and the current level is filled by its progress.
 * A ratio below 1 hatches the difference between the skill in use and the skill earned.
 * @param {number} level
 * @param {number} progress
 * @param {number} ratio
 * @returns {HTMLDivElement}
 */
function InformationSheetSkillPips(level, progress, ratio) {
	const earned = level + progress / SkillProgressMax;
	const used = earned * ratio;
	/** @type {HTMLOptionsUnion[]} */
	const pips = [];
	for (let i = 0; i < SkillLevelMaximum; i++) {
		const solid = Math.max(0, Math.min(i + 1, used) - i);
		const hatch = Math.max(0, Math.min(i + 1, earned) - Math.max(i, used));
		/** @type {HTMLOptionsUnion[]} */
		const segments = [];
		if (solid > 0) {
			segments.push({
				tag: "span",
				classList: ["information-sheet-pip-fill"],
				style: { width: `${solid * 100}%` },
			});
		}
		if (hatch > 0) {
			segments.push({
				tag: "span",
				classList: ["information-sheet-pip-hatch"],
				style: { width: `${hatch * 100}%` },
			});
		}
		pips.push({
			tag: "span",
			classList: ["information-sheet-pip"],
			children: segments,
		});
	}
	return ElementCreate({
		tag: "div",
		classList: ["information-sheet-pips"],
		attributes: { "aria-hidden": true },
		style: { "--information-sheet-pips": String(SkillLevelMaximum) },
		children: pips,
	});
}

/**
 * @param {PlayerCharacter} C
 * @param {SkillType} type
 * @returns {string}
 */
function InformationSheetSkillValue(C, type) {
	const level = SkillGetLevel(C, type);
	const progress = SkillGetProgress(C, type);
	const parens = level === SkillLevelMaximum ? TextGet("SkillLevelMaximum") : `${(progress / 10).toFixed(0)}%`;
	return `${level.toString().padStart(2, " ")} (${parens.padStart(3, " ")})`;
}

/**
 * Why a lowered ratio hatches part of the skill bar. Bondage and evasion are the skills a player can turn down.
 * @param {SkillType} type
 * @param {number} ratio
 * @returns {string}
 */
function InformationSheetSkillRatioText(type, ratio) {
	const key = type === "Bondage" || type === "Evasion" ? `SkillRatio${type}` : "SkillRatio";
	return TextSubstitute(key, {
		RATIO: Math.round(ratio * 100).toString(),
	}).join("");
}

/**
 * @param {number} modifier
 * @param {number} duration
 * @returns {string}
 */
function InformationSheetModifierText(modifier, duration) {
	/** @type {CommonSubtituteSubstitution[]} */
	const subst = [
		["ABS", modifier > 0 ? "+" : "-"],
		["VAL", Math.abs(modifier).toString()],
		["DURATION", TimermsToTime(duration)],
	];
	return CommonStringSubstitute(TextGet("SkillModifier"), subst);
}

/**
 * @param {PlayerCharacter} C
 */
function InformationSheetRefreshSkills(C) {
	for (const watch of InformationSheetSkillWatches) {
		const modifier = SkillGetModifier(C, watch.type);
		watch.value.textContent = InformationSheetSkillValue(C, watch.type);
		if (!modifier) {
			watch.modifier.hidden = true;
			continue;
		}
		watch.modifier.hidden = false;
		watch.modifier.textContent = InformationSheetModifierText(modifier, SkillGetModifierDuration(C, watch.type));
		watch.modifier.classList.toggle("information-sheet-positive", modifier > 0);
		watch.modifier.classList.toggle("information-sheet-negative", modifier < 0);
	}
}

/**
 * @param {Character} C
 * @returns {HTMLElement}
 */
function InformationSheetReputationColumn(C) {
	/** @type {HTMLElement[]} */
	const entries = [InformationSheetDualReputation(C, "Dominant", ReputationGet(C, "Dominant"))];
	const rest = C.Reputation
		.filter((reputation) => reputation.Type !== "Dominant" && reputation.Value !== 0)
		.sort((a, b) => InformationSheetCompareText(
			ReputationLabel(a.Type, a.Value) ?? "",
			ReputationLabel(b.Type, b.Value) ?? "",
		));

	for (const reputation of rest) {
		if (ReputationConfig[reputation.Type]?.negative === true) {
			entries.push(InformationSheetDualReputation(C, reputation.Type, reputation.Value));
		} else {
			const magnitude = Math.abs(reputation.Value);
			entries.push(InformationSheetMeterStat(
				ReputationLabel(reputation.Type, reputation.Value) ?? "",
				magnitude.toString(),
				magnitude,
				100,
				ReputationConfig[reputation.Type].color,
			));
		}
	}
	return InformationSheetColumn("Reputation", entries, "ReputationNone", "reputation");
}

/**
 * @param {Character} C
 * @param {ReputationType} type
 * @param {number} value
 * @returns {HTMLDivElement}
 */
function InformationSheetDualReputation(C, type, value) {
	return InformationSheetTextStat(
		ReputationLabel(type, value) ?? "",
		Math.abs(value).toString(),
		[InformationSheetBimeter(value, 100, ["information-sheet-reputation-bimeter"], ReputationConfig[type].color)],
	);
}

/** @type {Record<ServerChatRoomLanguage | "TW", string>} */
const InformationSheetSortLocale = {
	EN: "en",
	DE: "de",
	FR: "fr",
	ES: "es",
	RU: "ru",
	CN: "zh-CN",
	TW: "zh-TW",
	UA: "uk",
};

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function InformationSheetCompareText(a, b) {
	const locale = InformationSheetSortLocale[TranslationLanguage] ?? "en";
	return a.localeCompare(b, locale, { sensitivity: "base" });
}

/**
 * @param {string} label
 * @param {string} value
 * @param {number} amount
 * @param {number} max
 * @param {string} color
 * @returns {HTMLDivElement}
 */
function InformationSheetMeterStat(label, value, amount, max, color) {
	const pct = max > 0 ? Math.max(0, Math.min(100, amount / max * 100)) : 0;
	return InformationSheetTextStat(label, value, [
		ElementCreate({
			tag: "div",
			classList: ["information-sheet-meter"],
			attributes: { "aria-hidden": true },
			children: [
				{
					tag: "span",
					classList: ["information-sheet-meter-fill"],
					style: { width: `${pct}%`, "background-color": color },
				},
			],
		}),
	]);
}

/**
 * Label and value on one row. Further nodes, such as a meter, sit under that row.
 * Pass an element for `value` when the value is not plain text.
 * @param {string} label
 * @param {string | HTMLElement} value
 * @param {readonly HTMLElement[]} [extra]
 * @param {readonly string[]} [classList]
 * @returns {HTMLDivElement}
 */
function InformationSheetTextStat(label, value, extra, classList) {
	return ElementCreate({
		tag: "div",
		classList: ["information-sheet-stat", ...(classList ?? [])],
		children: [
			{ tag: "span", classList: ["information-sheet-stat-label"], children: [label] },
			typeof value === "string"
				? { tag: "span", classList: ["information-sheet-stat-value"], children: [value] }
				: value,
			...(extra ?? []),
		],
	});
}
