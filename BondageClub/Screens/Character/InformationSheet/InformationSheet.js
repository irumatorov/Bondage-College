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
var InformationSheetSecondScreen = false;

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
	const CurrentTitle = TitleGet(C);

	// Draw the character base values
	DrawCharacter(C, 50, 50, 0.9);
	MainCanvas.textAlign = "left";

	const spacing = 55;
	const spacingLarge = 75;
	let currentY = 125;

	DrawTextFit(TextGet("Name") + " " + C.Name, 550, currentY, 450, "Black", "Gray");
	currentY += spacing;
	if (C.Name !== CharacterNickname(C)) {
		DrawTextFit(TextGet("Nickname") + " " + CharacterNickname(C), 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
	}
	if (CurrentTitle !== "None") {
		DrawTextFit(TextGet("Title") + " " + TitleGetName(CurrentTitle), 550, currentY, 450, TitleIsForced(CurrentTitle) ? "Red" : TitleIsEarned(CurrentTitle) ? "#0000BF" : "Black", "Gray");
		currentY += spacing;
	}
	if (C.MemberNumber != null) {
		DrawTextFit(TextGet("MemberNumber") + " " + C.MemberNumber.toString(), 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
	}
	DrawTextFit(TextGet("Pronouns") + " " + CharacterPronounDescription(C), 550, currentY, 450, "Black", "Gray");

	currentY += spacingLarge;

	if ((C.IsPlayer() || C.IsOnline()) && C.Creation !== undefined) {
		const memberLabel = TextGet(C.IsBirthday() ? "Birthday" : "MemberFor");
		const creationFormatted = CommonFormatDurationRange(CurrentTime, C.Creation, { showFull: true, includeYears: true, includeMonths: true, includeDays: true });
		const memberForLabel = `${memberLabel} ${creationFormatted}`;
		DrawTextFit(memberForLabel, 550, currentY, 450, (C.IsBirthday() ? "Blue" : "Black"), "Gray");
		const y = currentY;
		if (MouseIn(550, y - 20, 450, 40)) {
			const createdDate = new Date(C.Creation).toLocaleString(undefined, {
				dateStyle: "medium",
				timeStyle: "short",
			});
			const createdDayDuration = CommonFormatDurationRange(CurrentTime, C.Creation, { showFull: true });

			DrawHoverElements.push(() => {
				DrawButtonHover(550, y - 20, 450, 40, `${createdDate} – ${createdDayDuration}`);
			});
		}
		currentY += spacing;

		if (C.IsPlayer()) {
			let moneyLine = TextGet("Money") + ` $${C.Money}`;
			DrawTextFit(moneyLine, 550, currentY, 450, "Black", "Gray");
			currentY += spacing;
		}
	} else if (C.IsNpc()) {
		const friendshipDate = NPCEventGet(C, "PrivateRoomEntry");

		const friendshipDurationFormatted = CommonFormatDurationRange(CurrentTime, friendshipDate, { showFull: true, includeYears: true, includeMonths: true, includeDays: true });
		const friendsFor = `${TextGet("FriendsFor")} ${friendshipDurationFormatted}`;
		DrawTextFit(friendsFor, 550, currentY, 450, "Black", "Gray");
		const y = currentY;
		if (MouseIn(550, y - 20, 450, 40)) {
			const friendshipStartDate = new Date(NPCEventGet(C, "PrivateRoomEntry")).toLocaleString(undefined, {
				dateStyle: "medium",
				timeStyle: "short",
			});
			const friendshipDayDuration = CommonFormatDurationRange(CurrentTime, friendshipDate, { showFull: true });
			DrawHoverElements.push(() => {
				DrawButtonHover(550, y - 20, 450, 40, `${friendshipStartDate} — ${friendshipDayDuration}`);
			});
		}
		currentY += spacing;

		const Love = C.Love ?? 0;
		let relationshipQualifier = "";
		if (Love >= 100) relationshipQualifier = "RelationshipPerfect";
		else if (Love >= 75) relationshipQualifier = "RelationshipGreat";
		else if (Love >= 50) relationshipQualifier = "RelationshipGood";
		else if (Love >= 25) relationshipQualifier = "RelationshipFair";
		else if (Love > -25) relationshipQualifier = "RelationshipNeutral";
		else if (Love > -50) relationshipQualifier = "RelationshipPoor";
		else if (Love > -75) relationshipQualifier = "RelationshipBad";
		else if (Love > -100) relationshipQualifier = "RelationshipHorrible";
		else relationshipQualifier = "RelationshipAtrocious";

		let loveLine = TextGet("Relationship") + " " + Love.toString() + " " + TextGet(relationshipQualifier);
		DrawTextFit(loveLine, 550, currentY, 450, "Black", "Gray");
		currentY += spacing;
	}
	currentY += spacingLarge;

	// For the current player or an online player
	if (C.IsPlayer() || C.IsOnline()) {

		// Shows the difficulty level
		let difficultyLine = `${TextGet("DifficultyLevel" + C.GetDifficulty())} ${TextGet("DifficultyTitle")}`;
		if (C.IsPlayer()) {
			const DifficultyChangeMaxDelay = 7;
			const LastChangeTime = typeof C.Difficulty?.LastChange === "number" ? C.Difficulty.LastChange : C.Creation;
			const DaysSinceLastChange = Math.floor((CurrentTime - LastChangeTime) / MS_PER_DAY);
			const RemainingDays = DaysSinceLastChange >= DifficultyChangeMaxDelay ? 0 : DifficultyChangeMaxDelay - DaysSinceLastChange;
			difficultyLine += TextGet("DifficultyDaysTillCanChange").replace("NumberOfDays", RemainingDays.toString());
		}
		DrawTextFit(difficultyLine, 550, currentY, 450, "Black", "Gray");
		currentY += spacing;

		// Shows the owner
		if (!C.IsOwned()) {
			DrawTextFit(TextGet("Unowned"), 550, currentY, 450, "Black", "Gray");
			currentY += spacing;
		}
		if (C.IsOwned() && C.IsOwned() != "ggts") {
			const stageText = C.IsFullyOwned() ? "Collared" : "Trial";
			const ownedDate = C.OwnedSinceMs();

			const ownerStageLabel = `${TextGet(`${stageText}By`)} ${C.OwnerName()}${C.OwnerNumber() !== -1 ? ` (${C.OwnerNumber()})` : ""}`;
			DrawTextFit(ownerStageLabel, 550, currentY, 450, "Black", "Gray");
			currentY += spacing;
			if (C.OwnedSinceMs() > 0) {
				const ownedDurationFormatted = CommonFormatDurationRange(CurrentTime, ownedDate, { showFull: true, includeYears: true, includeMonths: true, includeDays: true });
				const ownerDurationLabel = `${TextGet("For")} ${ownedDurationFormatted}`;
				DrawTextFit(ownerDurationLabel, 550, currentY, 450, "Black", "Gray");
				const y = currentY;
				if (MouseIn(550, y - 20, 450, 40)) {
					const ownedStartDate = new Date(C.OwnedSinceMs()).toLocaleString(undefined, {
						dateStyle: "medium",
						timeStyle: "short",
					});
					const ownedDayDuration = CommonFormatDurationRange(CurrentTime, ownedDate, { showFull: true });
					DrawHoverElements.push(() => {
						DrawButtonHover(550, y - 20, 450, 40, `${ownedStartDate} — ${ownedDayDuration}`);
					});
				}
				currentY += spacing;
			}
		}

		currentY = 800;

		// Shows the member number and online permissions for other online players

		if (C.IsOnline()) {
			DrawTextFit(TextGet("AllowedInteractions"), 550, currentY, 450, "Black", "Gray");
			currentY += spacing;
			DrawTextFit(TextGet("AllowedInteraction" + C.AllowedInteractions.toString()), 550, currentY, 450, "Black", "Gray");
			currentY += spacing;
		}
	}

	// Draw the buttons on the right side
	MainCanvas.textAlign = "center";
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if (C.IsPlayer()) {
		if (!TitleIsForced(CurrentTitle)) DrawButton(1815, 190, 90, 90, "", "White", "Icons/Title.png");
		DrawButton(1815, 305, 90, 90, "", "White", "Icons/Preference.png");
		DrawButton(1815, 420, 90, 90, "", "White", "Icons/FriendList.png");
		DrawButton(1815, 535, 90, 90, "", "White", "Icons/Introduction.png");
		if (C.HasOwnerNotes())
			DrawButton(1715, 535, 90, 90, "", "White", "Icons/Management.png");
		DrawButton(1815, 765, 90, 90, "", "White", "Icons/Next.png");
	} else if (C.IsOnline()) {
		DrawButton(1815, 190, 90, 90, "", "White", "Icons/Introduction.png");
		if (C.HasOwnerNotes() || C.IsFullyOwnedByPlayer())
			DrawButton(1715, 190, 90, 90, "", "White", "Icons/Management.png");
		DrawButton(1815, 765, 90, 90, "", "White", "Icons/Next.png");
	}

	// Draw the second screen for reputation & skills
	MainCanvas.textAlign = "left";
	if (InformationSheetSecondScreen) return InformationSheetSecondScreenRun();

	// For player and online characters, we show the lover list (NPC or online)
	if ((C.IsPlayer() || C.IsOnline()) && C.GetLovership().length > 0) {
		const stageQualifier = Object.freeze({
			0: "Dating",
			1: "Engaged",
			2: "Married",
		});
		DrawText(TextGet("Relationships"), 1200, 125, "Black", "Gray");
		const lovership = C.GetLovership();
		if (lovership.length < 1) DrawText(TextGet("None"), 1200, 200, "Black", "Gray");
		for (let [L, lover] of lovership.entries()) {
			const loveStart = lover.Start ?? 0;
			const stageText = stageQualifier[lover.Stage ?? 0];
			const relationStageLabel = `${TextGet(`${stageText}With`)} ${lover.Name}${lover.MemberNumber ? ` (${lover.MemberNumber})` : ""}`;
			DrawTextFit(relationStageLabel, 1200, 200 + L * 150, 600, "Black", "Gray");
			const relationDurationLabel = `${TextGet("For")} ${CommonFormatDurationRange(CurrentTime, loveStart, { showFull: true, includeYears: true, includeMonths: true, includeDays: true })}`;
			DrawTextFit(relationDurationLabel, 1200, 260 + L * 150, 600, "Black", "Gray");
			const hoverY = 260 + L * 150 - 20;
			if (MouseIn(1200, hoverY, 600, 40)) {
				const relationStartDate = new Date(loveStart).toLocaleString(undefined, {
					dateStyle: "medium",
					timeStyle: "short",
				});
				const relationDurationLabelShort = CommonFormatDurationRange(CurrentTime, loveStart, { showFull: true });

				DrawHoverElements.push(() => {
					DrawButtonHover(1200, hoverY, 450, 40, `${relationStartDate} – ${relationDurationLabelShort}`);
				});
			}
		}
	} else if (C.IsNpc()) {
		const stageQualifier = Object.freeze({
			0: "Dating",
			1: "Engaged",
			2: "Married",
		});
		// For NPC characters, shows the lover, owner & traits
		const lovership = C.GetLovership();
		const playerLove = lovership.find(l => l.MemberNumber === Player.MemberNumber);

		if (!C.LoverName() && !playerLove) {
			DrawText(`${TextGet("Lover")} ${TextGet("None")}`, 550, currentY, "Black", "Gray");
			currentY += spacing;
		}
		if (playerLove) {
			const stageText = stageQualifier[playerLove.Stage ?? 0];
			const loveStart = playerLove.Start ?? 0;

			const loverStageLabel = `${TextGet(`${stageText}With`)} ${C.LoverName()}`;
			DrawText(loverStageLabel, 550, currentY, "Black", "Gray");
			currentY += spacing;
			const loverDurationLabel = `${TextGet("For")} ${CommonFormatDurationRange(CurrentTime, loveStart, { showFull: true, includeYears: true, includeMonths: true, includeDays: true })}`;
			DrawText(loverDurationLabel, 550, currentY, "Black", "Gray");
			const y = currentY - 20;
			if (MouseIn(550, y, 450, 40))
				DrawHoverElements.push(() => {
					const loverStartDate = new Date(loveStart).toLocaleString(undefined, {
						dateStyle: "medium",
						timeStyle: "short",
					});
					const loverDurationTooltip = `${loverStartDate} – ${CommonFormatDurationRange(CurrentTime, loveStart, { showFull: true })}`;
					DrawButtonHover(550, y, 450, 40, loverDurationTooltip);
				});
			currentY += spacing;
		}

		if (!C.IsOwned()) {
			DrawText(`${TextGet("Owner")} ${TextGet("None")}`, 550, currentY, "Black", "Gray");
			currentY += spacing;
		} else if (C.IsOwned()) {
			const ownedDate = C.OwnedSinceMs();

			const stageText = C.IsFullyOwned() ? "Collared" : "Trial";
			const ownedByLabel = `${TextGet(`${stageText}By`)} ${C.OwnerName()}`;
			DrawText(ownedByLabel, 550, currentY, "Black", "Gray");
			currentY += spacing;
			const ownedDurationFormatted = CommonFormatDurationRange(CurrentTime, ownedDate, { showFull: true, includeYears: true, includeMonths: true, includeDays: true });
			const ownedStageLabel = `${TextGet(`For`)} ${ownedDurationFormatted}`;
			DrawText(ownedStageLabel, 550, currentY, "Black", "Gray");
			const y = currentY - 20;
			if (MouseIn(550, y, 450, 40)) {
				const ownedStartDate = new Date(C.OwnedSinceMs()).toLocaleString(undefined, {
					dateStyle: "medium",
					timeStyle: "short",
				});
				const ownedDayDuration = CommonFormatDurationRange(CurrentTime, ownedDate, { showFull: true });
				DrawHoverElements.push(() => {
					DrawButtonHover(550, y, 450, 40, `${ownedStartDate} – ${ownedDayDuration}`);
				});
			}
			currentY += spacing;
		}
		DrawText(TextGet("Trait"), 1000, 125, "Black", "Gray");

		// After one week we show the traits, after two weeks we show the level
		if (CurrentTime >= NPCEventGet(C, "PrivateRoomEntry") * CheatFactor("AutoShowTraits", 0) + MS_PER_WEEK) {
			let Pos = 0;
			for (const trait of C.Trait ?? []) {
				DrawText(TextGet("Trait" + ((trait.Value > 0) ? trait.Name : NPCTraitReverse(trait.Name))) + " " + ((CurrentTime >= NPCEventGet(C, "PrivateRoomEntry") * CheatFactor("AutoShowTraits", 0) + 1209600000) ? Math.abs(trait.Value).toString() : "??"), 1000, 200 + Pos * 75, "Black", "Gray");
				Pos++;
			}
		} else DrawText(TextGet("TraitUnknown"), 1000, 200, "Black", "Gray");

	}
	MainCanvas.textAlign = "center";

}

/**
 * Display the second part of the information sheet for reputation & skills
 * @returns {void} - Nothing
 */
function InformationSheetSecondScreenRun() {
	const C = InformationSheetSelection;
	if (!C) return;
	// For current player and online characters
	if (C.IsPlayer() || C.IsOnline()) {
		const lineHeight = 55;
		// Draw the reputation section
		DrawText(TextGet("Reputation"), 1000, 125, "Black", "Gray");
		let pos = 0;
		for (let R = 0; R < C.Reputation.length; R++)
			if (C.Reputation[R].Value != 0) {
				const label = ReputationLabel(C.Reputation[R].Type, C.Reputation[R].Value);
				if (!label) continue;
				DrawText(`${label}: ${Math.abs(C.Reputation[R].Value)}`, 1000, 200 + pos * lineHeight, "Black", "Gray");
				pos++;
			}
		if (pos == 0) DrawText(TextGet("ReputationNone"), 1000, 200, "Black", "Gray");

		// Draw the skill section
		DrawText(TextGet("Skill"), 1425, 125, "Black", "Gray");
		if (!C.IsPlayer()) {
			DrawText(TextGet("Unknown"), 1425, 200, "Black", "Gray");
		} else {
			let skillLine = 0;
			if (C.Skill.length == 0) {
				DrawText(TextGet("SkillNone"), 1425, 200, "Black", "Gray");
			} else {
				for (const type of SkillValidSkills) {
					const name = TextGet(`Skill${type}`);
					const level = SkillGetLevel(C, type);
					const progress = SkillGetProgress(C, type);
					if (level === 0 && progress === 0) continue;
					const ratio = SkillGetRatio(C, type);
					const modifier = SkillGetModifier(C, type);
					const duration = SkillGetModifierDuration(C, type);

					const skillText = `${name} ${level} (${progress / 10}%)`;
					const color = ratio !== 1 ? "Red" : "Black";
					DrawText(skillText, 1425, 200 + skillLine * lineHeight, color, "Gray");
					skillLine++;
					if (modifier && modifier !== 0) {
						/** @type {CommonSubtituteSubstitution[]} */
						const subst = [
							["ABS", (modifier > 0 ? "+" : "-")],
							["VAL", modifier.toString()],
							["DURATION", TimermsToTime(duration)],
						];
						const modifierColor = modifier > 0 ? "Green" : "Red";
						const modifierText = CommonStringSubstitute(TextGet("SkillModifier"), subst);
						DrawText(modifierText, 1440, 200 + skillLine * lineHeight, modifierColor, "Gray");
						skillLine++;
					}
				}
			}
		}
	}
	MainCanvas.textAlign = "center";

}

/**
 * Handles the click events on the screen
 * @type {MouseEventListener}
 */
function InformationSheetClick() {
	const C = InformationSheetSelection;
	if (!C) return;
	if (MouseIn(1815, 75, 90, 90)) InformationSheetExit();
	if (C.IsPlayer()) {
		if (MouseIn(1815, 190, 90, 90) && !TitleIsForced(TitleGet(C))) CommonSetScreen("Character", "Title");
		if (MouseIn(1815, 305, 90, 90)) CommonSetScreen("Character", "Preference");
		if (MouseIn(1815, 420, 90, 90)) CommonSetScreen("Character", "FriendList");
		if (MouseIn(1815, 535, 90, 90)) OnlineProfileStart("Description");
		if (MouseIn(1715, 535, 90, 90) && C.HasOwnerNotes()) {
			OnlineProfileStart("OwnersNotes");
		}
		if (MouseIn(1815, 765, 90, 90)) InformationSheetSecondScreen = !InformationSheetSecondScreen;
	} else if (C.IsOnline()) {
		if (MouseIn(1815, 190, 90, 90)) OnlineProfileStart("Description");
		if (MouseIn(1715, 190, 90, 90) && (C.HasOwnerNotes() || C.IsFullyOwnedByPlayer())) {
			OnlineProfileStart("OwnersNotes");
		}
		if (MouseIn(1815, 765, 90, 90)) InformationSheetSecondScreen = !InformationSheetSecondScreen;
	}
}

/**
 * Cleanup all elements, if the user exits the screen
 * @type {ScreenExitHandler}
 */
function InformationSheetExit() {
	InformationSheetSecondScreen = false;
	if (InformationSheetReturnScreen) {
		CommonSetScreen(...InformationSheetReturnScreen);
	}
	InformationSheetReturnScreen = null;
}

function InformationSheetUnload() {
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

function InformationSheetResize() {
	if (!InformationSheetSelection) return;
	const C = InformationSheetSelection;
	if (C.IsPlayer()) {
		ElementSetPosition("AllowedInteractions-dropdown-container", 550, 800);
		ElementSetSize("AllowedInteractions-dropdown", 600);
		ElementSetFontSize("AllowedInteractions-dropdown-container", "auto");
	}
}
