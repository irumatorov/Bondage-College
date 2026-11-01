"use strict";
var MainHallBackground = "MainHall";
/** @type {null | number} */
var MainHallStartEventTimer = null;
/** @type {null | number} */
var MainHallNextEventTimer = null;
var MainHallRandomEventOdds = 0;
/** @type {NPCCharacter} */
var MainHallMaid = /** @type {never} */ (null);
/** The max number of known tips */
var MainHallMaxTip = 38;
/** The index of the current tip */
var MainHallTip = 0;
/** The max delay to wait before changing the current tip */
var MainHallTipCycleDelay = 10000;
/**
 * The timer that tracks the last time the tip cycled
 * @type {number}
 */
var MainHallTipCycleTimer = 0;
var MainHallMaidWasCalledManually = false;
var MainHallAsylumOpen = true;
/**
 * Whether the player just got safeworded out of a chatroom and needs punishment
 */
var MainHallBeingPunished = false;
var MainHallFirstFrame = true;
/** @type {AssetLockType[]} */
var MainHallStrongLocks = ["CombinationPadlock", "PasswordPadlock", "TimerPasswordPadlock", "HighSecurityPadlock"];

/** @type {Partial<Record<AssetGroupItemName, AssetName>>[]} */

var MainHallPunishmentList = [
	{ ItemMouth: "BallGag", ItemHead: "LeatherBlindfold", ItemHands: "DuctTape" },
	{ ItemMouth: "HarnessBallGag", ItemArms: "LeatherArmbinder", ItemLegs: "LegBinder", ItemPelvis: "PolishedChastityBelt", ItemBreast: "PolishedChastityBra", ItemVulva: "VibratingDildo", ItemBoots: "LockingHeels",  ItemHead: "LeatherBlindfold", ItemHands: "LeatherMittens" },
	{ ItemMouth: "DildoPlugGag", ItemArms: "LeatherArmbinder", ItemLegs: "LeatherLegCuffs", ItemFeet: "LeatherAnkleCuffs", ItemPelvis: "PolishedChastityBelt", ItemBreast: "PolishedChastityBra", ItemVulva: "VibratingEgg", ItemBoots:"LockingHeels", ItemHead: "LeatherBlindfold", ItemHands: "LeatherMittens" },
	{ ItemMouth: "LatexBallMuzzleGag", ItemArms: "LatexBoxtieLeotard", ItemLegs: "LegBinder", ItemPelvis: "PolishedChastityBelt", ItemBreast: "PolishedChastityBra", ItemVulva: "WiredEgg", ItemBoots: "LockingHeels",  ItemHead: "LatexBlindfold", ItemHands: "LeatherMittens" },
	{ ItemMouth: "StitchedMuzzleGag", ItemArms: "StraitDress", ItemLegs: "HobbleSkirt", ItemPelvis: "PolishedChastityBelt", ItemBreast: "PolishedChastityBra", ItemVulva: "WiredEgg", ItemBoots: "LockingHeels",  ItemHead: "LeatherSlimMask", ItemHands: "LeatherMittens" },
	{ ItemMouth: "MuzzleGag", ItemArms: "BoxTieArmbinder", ItemLegs: "LeatherBelt", ItemPelvis: "PolishedChastityBelt", ItemBreast: "PolishedChastityBra", ItemVulva: "VibratingEgg", ItemBoots: "LockingHeels",  ItemHead: "LeatherBlindfold", ItemHands: "LeatherMittens" },
	{ ItemMouth: "HarnessPanelGag", ItemArms: "OrnateCuffs", ItemLegs: "OrnateLegCuffs", ItemFeet: "OrnateAnkleCuffs", ItemPelvis: "OrnateChastityBelt", ItemBreast: "OrnateChastityBra", ItemVulva: "VibratingDildo", ItemBoots:"LockingHeels", ItemHead: "FullBlindfold", ItemHands: "PolishedMittens "}
];

var MainHallPunishmentChoice = 0;
/** @type {BCColor} */
var MainHallRopeColor = "Default";

/**
 * Checks to see if the player needs help in any way
 * @returns {boolean} - True if player has any restraints or locks, False otherwise
 */
function MainHallPlayerNeedsHelpAndHasNoOwnerOrLoverItem() {
	var needsHelp = false;

	for (const appearance of Player.Appearance) {
		if (appearance.Asset.IsRestraint) {
			needsHelp = true;
			break;
		}

		for (const lock of MainHallStrongLocks) {
			if (appearance.Property?.LockedBy == lock) {
				needsHelp = true;
				break;
			}
		}
	}

	return needsHelp && !MainHallHasOwnerOrLoverItem();

}

/**
 * Checks if the maid will help the player or not.  Maids are disabled from the quarters or when playing hardcore.
 * @returns {boolean} - Returns true if the player still has time remaining after asking the maids to stop helping in the maid quarters
 */
function MainHallIsMaidsDisabled() { return MaidQuartersIsMaidsDisabled(); }

/**
 * Checks if the maid will not help the player because she's playing on hardcore
 * @returns {boolean} - Returns TRUE if the difficulty is hardcore or more
 */
function MainHallMaidsPlayingHardcore() { return (Player.GetDifficulty() >= 2); }

/**
 * Checks for the dialog options to help the player know how much time is left before the maids can help them
 * @returns {boolean} - Returns TRUE if the remaining duration fits within the time range
 */
function MainHallMaidsDisabledMinutesLeft() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire > 0 && expire < 600000 && Player.GetDifficulty() < 2); }
function MainHallMaidsDisabledHourLeft() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire >= 600000 && expire < MS_PER_HOUR && Player.GetDifficulty() < 2); }
function MainHallMaidsDisabledDaysLeft1() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire >= MS_PER_HOUR && expire < MS_PER_DAY && Player.GetDifficulty() < 2); }
function MainHallMaidsDisabledDaysLeft2() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire >= 1 * MS_PER_DAY && expire < 2 * MS_PER_DAY && Player.GetDifficulty() < 2); }
function MainHallMaidsDisabledDaysLeft3() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire >= 2 * MS_PER_DAY && expire < 3 * MS_PER_DAY && Player.GetDifficulty() < 2); }
function MainHallMaidsDisabledDaysLeft4() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire >= 3 * MS_PER_DAY && expire < 4 * MS_PER_DAY && Player.GetDifficulty() < 2); }
function MainHallMaidsDisabledDaysLeft5() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire >= 4 * MS_PER_DAY && expire < 5 * MS_PER_DAY && Player.GetDifficulty() < 2); }
function MainHallMaidsDisabledDaysLeft6() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire >= 5 * MS_PER_DAY && expire < 6 * MS_PER_DAY && Player.GetDifficulty() < 2); }
function MainHallMaidsDisabledDaysLeft7() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire >= 6 * MS_PER_DAY && expire < MS_PER_WEEK && Player.GetDifficulty() < 2); }
function MainHallMaidsDisabledBegForMore() { return (LogValue("MaidsDisabled", "Maid") ?? 0) > CurrentTime && Player.GetDifficulty() < 2; }

/**
 * Checks for the dialog options to help the maid determine which dialog options she can give the player to extend the duration
 * @returns {boolean} - Returns TRUE if the remaining duration fits within the time range
 */
function MainHallMaidsDisabledAtLeast30MinutesLeft() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire < 30 * MS_PER_MIN); }
function MainHallMaidsDisabledAtLeast1HourLeft() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire < MS_PER_HOUR); }
function MainHallMaidsDisabledAtLeast12HourLeft() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire < 12 * MS_PER_HOUR); }
function MainHallMaidsDisabledAtLeastDaysLeft1() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire < MS_PER_DAY); }
function MainHallMaidsDisabledAtLeastDaysLeft3() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire < 3 * MS_PER_DAY); }
function MainHallMaidsDisabledAtLeastDaysLeft7() { var expire = (LogValue("MaidsDisabled", "Maid") ?? 0) - CurrentTime; return (expire < MS_PER_WEEK); }

/**
 * Checks if the dialog option to trick the maid is available
 * @returns {boolean} - Returns TRUE if the maid can be tricked
 */
function MainHallCanTrickMaid() { return (ManagementIsClubSlave() && SarahUnlockQuest); }

/**
 * Checks, if the player has an owner or lover lock on her
 * @returns {boolean} - Returns true, if the player has either a lover or owner item on herself, false otherwise
 */
function MainHallHasOwnerOrLoverItem() { return InventoryCharacterHasOwnerOnlyRestraint(Player) || InventoryCharacterHasLoverOnlyRestraint(Player) || InventoryCharacterHasFamilyOnlyRestraint(Player); }
function MainHallHasOwnerOrLoverItemAndMaidsNotDisabled() { return !MainHallIsMaidsDisabled() && MainHallHasOwnerOrLoverItem(); }
function MainHallHasNoOwnerOrLoverItemAndMaidsNotDisabled() { return !MainHallIsMaidsDisabled() && !MainHallHasOwnerOrLoverItem(); }
function MainHallHasOwnerItemAndMaidsNotDisabled() { return !MainHallIsMaidsDisabled() && InventoryCharacterHasOwnerOnlyRestraint(Player); }
function MainHallHasLoverItemAndMaidsNotDisabled() { return !MainHallIsMaidsDisabled() && InventoryCharacterHasLoverOnlyRestraint(Player); }
function MainHallHasFamilyItemAndMaidsNotDisabled() { return !MainHallIsMaidsDisabled() && InventoryCharacterHasFamilyOnlyRestraint(Player); }
function MainHallHasSlaveCollarAndMaidsNotDisabled() { return !MainHallIsMaidsDisabled() && InventoryIsWorn(Player, "ItemNeck", "SlaveCollar"); }
function MainHallPlayerNeedsHelpAndHasNoOwnerOrLoverItemAndMaidsNotDisabled() { return !MainHallIsMaidsDisabled() && MainHallPlayerNeedsHelpAndHasNoOwnerOrLoverItem(); }

/**
 * Returns TRUE if the main hall sub-screen is allowed for the player, check for owner rules
 * @param {keyof typeof MainHallAllowIDToScreenMap} room - The screen ID to validate (A is club shop)
 * @returns {boolean} - Returns true, if the screen is allowed
 */
function MainHallAllow(room) {
	if (!Player.IsOwned()) return true;
	const ID = MainHallAllowIDToScreenMap[room];
	if (!ID) return true;
	return !LogContain("BlockScreen", "OwnerRule", ID);
}

/**
 * Loads the main hall by setting up the NPCs, CSVs and global variables required.
 * @type {ScreenLoadHandler}
 */
async function MainHallLoad() {

	// Loads the variables and dialog
	ChatSearchSafewordAppearance = null;
	PoseSetActive(Player, null);
	if (ChatSearchPreviousActivePose != null) {
		ServerSend("ChatRoomCharacterPoseUpdate", { Pose: Player.ActivePose });
		ChatSearchPreviousActivePose = null;
	}
	MainHallBackground = Player.VisualSettings.MainHallBackground ?? "MainHall";
	MainHallStartEventTimer = null;
	MainHallNextEventTimer = null;
	if (MainHallMaid) {
		CharacterDelete(MainHallMaid);
		MainHallMaid = /** @type {never} */ (null);
	}
	MainHallMaid = CharacterLoadNPC("NPC_MainHall_Maid");
	MainHallMaid.AllowItem = false;
	await CommonReadCSV(ScreenFileGetDialog("NPC_Management_RandomGirl", "Room", "Management"));
	await CommonReadCSV(ScreenFileGetDialog("NPC_KidnapLeague_RandomKidnapper", "Room", "KidnapLeague"));
	await CommonReadCSV(ScreenFileGetDialog("NPC_Private_Custom", "Room", "Private"));
	await CommonReadCSV(ScreenFileGetDialog("NPC_AsylumEntrance_KidnapNurse", "Room", "AsylumEntrance"));
	await CommonReadCSV(ScreenFileGetDialog("NPC_AsylumEntrance_EscapedPatient", "Room", "AsylumEntrance"));
	await CommonReadCSV(ScreenFileGetDialog("NPC_Prison_Police", "Room", "Prison"));
	TextPrefetch("Character", "Appearance");
	TextPrefetch("Character", "InformationSheet");
	TextPrefetch("Character", "Relog");
	TextPrefetch("Online", "ChatSearch");
}

/**
 * Runs the main hall screen
 * @returns {void} - Nothing
 */
function MainHallRun() {
	// A maid will introduce the player to the club and explain the basic rules
	MainHallMaidIntroduction();

	// Calls the other screens that could trigger
	KidnapLeagueResetOnlineBountyProgress();
	MainHallCycleTips();
	PandoraPenitentiaryCreate();

	// Out of punishment mode
	if (!MainHallBeingPunished) {

		const maidIsReady = MainHallMaid && MainHallMaid.Dialog && MainHallMaid.Dialog.length > 0;

		// We return to the last online chat room if possible
		if (MainHallFirstFrame) {
			if (Player.LastChatRoom?.Space !== undefined && AsylumGGTSGetLevel(Player) <= 5 && (!MainHallMaid || MainHallMaid.Stage === "0")) {
				if (Player.ImmersionSettings?.ReturnToChatRoom) {
					const { Female, Male } = Player.GenderSettings.AutoJoinSearch;
					/** @type {ScreenSpecifier} */
					let screen = Female || Male ? ["Room", "MainHall"] : ["Online", "ChatSelect"];
					/** @type {ChatSearchLobbyOptions} */
					const options = {};
					if (Player.LastChatRoom.Space === "Asylum") {
						options.Background = "AsylumEntrance";
						options.BackgroundTagList = [BackgroundsTagAsylum];
						screen = ["Room", "AsylumEntrance"];
					}
					ChatSearchStart(Player.LastChatRoom.Space, screen, options);
					return;
				} else {
					ChatRoomSetLastChatRoom(null);
				}
			}
			MainHallFirstFrame = false;
		} else if (!CurrentCharacter && maidIsReady) {
			// We're not talking to anyone, and the maid is here

			// If the player logged into new version
			if (CommonVersionUpdated) {
				CommonVersionUpdated = false;
				CharacterSetCurrent(MainHallMaid);
				MainHallMaid.Stage = "200";
				MainHallMaid.CurrentDialog = DialogFind(MainHallMaid, "ClubUpdated");
				return;
			}

			// If the player is dressed up while being a club slave, the maid intercepts her
			if (ManagementIsClubSlave() && LogQuery("BlockChange", "Rule") && !Player.IsNaked()) {
				MainHallMaid.Stage = "50";
				MainHallMaid.CurrentDialog = DialogFind(MainHallMaid, "ClubSlaveMustBeNaked");
				CharacterRelease(MainHallMaid);
				CharacterSetCurrent(MainHallMaid);
				MainHallStartEventTimer = null;
				MainHallNextEventTimer = null;
				return;
			}

			// If the player is a Mistress but her Dominant reputation has fallen & stage is not
			if (LogQuery("ClubMistress", "Management") && (ReputationGet("Dominant") < 50) && (CheatFactor("CantLoseMistress", 0) == 1) && Player.CanTalk()) {
				CharacterSetCurrent(MainHallMaid);
				MainHallMaid.Stage = "60";
				MainHallMaid.CurrentDialog = DialogFind(MainHallMaid, "MistressExpulsionIntro");
				return;
			}

		}

	}

	// If we must send a maid to rescue the player
	if (MainHallMaid !== null && (MainHallNextEventTimer != null) && (CommonTime() >= MainHallNextEventTimer)) {
		MainHallMaid.Stage = "0";
		CharacterRelease(MainHallMaid);
		CharacterSetCurrent(MainHallMaid);
		MainHallStartEventTimer = null;
		MainHallNextEventTimer = null;
		MainHallMaidWasCalledManually = false;
	}

	// Start the rescue progress, if needed
	if ((MainHallStartEventTimer == null) && (MainHallNextEventTimer == null)) {
		if ( (!Player.GameplaySettings || !Player.GameplaySettings.DisableAutoMaid) && ((!Player.CanInteract() || !Player.CanWalk() || !Player.CanTalk() || Player.IsShackled()))) {
			MainHallStartEventTimer = CommonTime();
			MainHallNextEventTimer = CommonTime() + 40000 + Math.floor(Math.random() * 40000);
		}
		MainHallMaidWasCalledManually = false;
	} else if (!MainHallMaidWasCalledManually && !((!Player.CanInteract() || !Player.CanWalk() || !Player.CanTalk() || Player.IsShackled()))) {
		MainHallStartEventTimer = null;
		MainHallNextEventTimer = null;
	}

}

/**
 * Draws the main hall screen
 * @returns {void} - Nothing
 */
function MainHallDraw() {

	// Draws the character and main hall buttons
	DrawCharacter(Player, 750, 0, 1);
	MainCanvas.font = "italic " + CommonGetFont(30);
	DrawTextWrap(TextGet("Tip" + MainHallTip), 100, 800, 500, 200, "White");
	MainCanvas.font = CommonGetFont(36);

	// Char, Dressing, Exit & Chat
	DrawButton(1645, 25, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
	if (Player.CanChangeOwnClothes()) DrawButton(1765, 25, 90, 90, "", "White", "Icons/Dress.png", TextGet("Appearance"));
	DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(1645, 145, 90, 90, "", "White", "Icons/Chat.png", TextGet("ChatRooms"));

	// The options below are only available if the player can move
	if (Player.CanWalk() && (!Player.IsRestrained() || !Player.GameplaySettings.OfflineLockedRestrained)) {

		// Shop & Private Room
		if (MainHallAllow("Shop")) DrawButton(1765, 145, 90, 90, "", "White", "Icons/Shop.png", TextGet("Shop"));
		if (!LogQuery("LockOutOfPrivateRoom", "Rule") && MainHallAllow("Private")) DrawButton(1885, 145, 90, 90, "", "White", "Icons/Private.png", TextGet("PrivateRoom"));

		// Introduction, Maid & Management
		if (MainHallAllow("Introduction")) DrawButton(1645, 265, 90, 90, "", "White", "Icons/Introduction.png", TextGet("IntroductionClass"));
		if (MainHallAllow("MaidQuarters")) DrawButton(1765, 265, 90, 90, "", "White", "Icons/Maid.png", TextGet("MaidQuarters"));
		DrawButton(1885, 265, 90, 90, "", "White", "Icons/Management.png", TextGet("ClubManagement"));

		// Kidnap League, Dojo, Explore/Sarah
		if (MainHallAllow("ClubCard")) DrawButton(1525, 385, 90, 90, "", "White", "Icons/ClubCard.png", TextGet("ClubCard"));
		if (MainHallAllow("KidnapLeague")) DrawButton(1645, 385, 90, 90, "", "White", "Icons/Kidnap.png", TextGet("KidnapLeague"));
		if (MainHallAllow("ShibariDojo")) DrawButton(1765, 385, 90, 90, "", "White", "Icons/Dojo.png", TextGet("ShibariDojo"));
		if (SarahRoomAvailable && MainHallAllow("Sarah")) DrawButton(1885, 385, 90, 90, "", "White", "Icons/Explore.png", TextGet(SarahRoomLabel()));

		// Cell, Slave Market & Look for trouble
		if (MainHallAllow("Crafting")) DrawButton(1525, 505, 90, 90, "", "White", "Icons/Crafting.png", TextGet("Crafting"));
		if (MainHallAllow("Trouble")) DrawButton(1645, 505, 90, 90, "", "White", "Icons/Question.png", TextGet("LookForTrouble"));
		if (MainHallAllow("SlaveMarket")) DrawButton(1765, 505, 90, 90, "", "White", "Icons/Gavel.png", TextGet("SlaveMarket"));
		if (MainHallAllow("Cell")) DrawButton(1885, 505, 90, 90, "", "White", "Icons/Cell.png", TextGet("Cell"));

		// Asylum, College & LARP battles
		if (!ManagementIsClubSlave() && MainHallAllow("Platform")) DrawButton(1525, 625, 90, 90, "", "White", "Icons/Platform.png", TextGet("Platform"));
		if (!ManagementIsClubSlave() && MainHallAllow("LARPBattle")) DrawButton(1645, 625, 90, 90, "", "White", "Icons/Battle.png", TextGet("LARPBattle"));
		if (!ManagementIsClubSlave() && MainHallAllow("College")) DrawButton(1765, 625, 90, 90, "", "White", "Icons/College.png", TextGet("College"));
		if (MainHallAsylumOpen && MainHallAllow("Asylum")) DrawButton(1885, 625, 90, 90, "", "White", "Icons/Asylum.png", TextGet("Asylum"));

		// Movie Studio (Must be able to change to enter it)
		if (Player.CanChangeOwnClothes() && MainHallAllow("MagicSchool")) DrawButton(1525, 745, 90, 90, "", "White", "Icons/MagicSchool.png", TextGet("MagicSchool"));
		if (Player.CanChangeOwnClothes() && Player.CanTalk() && MainHallAllow("Poker")) DrawButton(1645, 745, 90, 90, "", "White", "Icons/Poker.png", TextGet("Poker"));
		if (Player.CanChangeOwnClothes() && MainHallAllow("Infiltration")) DrawButton(1765, 745, 90, 90, "", "White", "Icons/Infiltration.png", TextGet("Infiltration"));
		if (Player.CanChangeOwnClothes() && MainHallAllow("MovieStudio")) DrawButton(1885, 745, 90, 90, "", "White", "Icons/MovieStudio.png", TextGet("MovieStudio"));

		// Draws the custom content rooms - Gambling, Prison & Photographic
		if (MainHallAllow("Photographic")) DrawButton(265, 25, 90, 90, "", "White", "Icons/Camera.png", TextGet("Photographic"));
		if (MainHallAllow("Prison")) DrawButton(145, 25, 90, 90, "", "White", "Icons/Cage.png", TextGet("Prison"));
		if (MainHallAllow("Gambling")) DrawButton(25, 25, 90, 90, "", "White", "Icons/Random.png", TextGet("Gambling"));

		// Stable, Magic-Theater & Nursery
		if (MainHallAllow("Nursery")) DrawButton(265, 145, 90, 90, "", "White", "Icons/Diaper.png", TextGet("Nursery"));
		if (MainHallAllow("MagicSchool")) DrawButton(145, 145, 90, 90, "", "White", "Icons/Magic.png", TextGet("Magic"));
		if (MainHallAllow("Stable")) DrawButton(25, 145, 90, 90, "", "White", "Icons/Horse.png", TextGet("Stable"));

		// Cafe, Arcade
		if (MainHallAllow("Arcade")) DrawButton(145, 265, 90, 90, "", "White", "Icons/Arcade.png", TextGet("Arcade"));
		if (MainHallAllow("Cafe")) DrawButton(25, 265, 90, 90, "", "White", "Icons/Refreshsments.png", TextGet("Cafe"));

	} else {

		// Special permission to enter the maid quarters and cafe if doing the maid serving drinks quest while being restrained
		if (Player.CanWalk() && MaidQuartersOnlineDrinkStarted) {
			DrawButton(1765, 265, 90, 90, "", "White", "Icons/Maid.png", TextGet("MaidQuarters"));
			DrawButton(25, 265, 90, 90, "", "White", "Icons/Refreshsments.png", TextGet("Cafe"));
		}
		// Special permission to enter the kidnappers league if doing the online bounty quest while being restrained
		if (Player.CanWalk() && (InventoryIsWorn(Player, "ItemMisc", "BountySuitcase") || InventoryIsWorn(Player, "ItemMisc", "BountySuitcaseEmpty")))
			DrawButton(1645, 385, 90, 90, "", "White", "Icons/Kidnap.png", TextGet("KidnapLeague"));

	}

	// If we must show a progress bar for the rescue maid.  If not, we show the number of online players or a button to request the maid
	if (MainHallStartEventTimer === null || MainHallNextEventTimer === null) {
		MainCanvas.textAlign = "right";
		DrawText(TextGet("OnlinePlayers") + " " + CurrentOnlinePlayers.toString(), 1740, 950, "White", "Black");
		MainCanvas.textAlign = "center";
		DrawButton(1775, 900, 90, 90, "", "White", "Icons/Changelog.png", TextGet("OpenChangelog"));
		DrawButton(1885, 900, 90, 90, "", "White", "Icons/ServiceBell.png", TextGet("RequestMaid"));
	} else {
		DrawText(TextGet("RescueIsComing"), 1750, 925, "White", "Black");
		DrawProgressBar(1525, 955, 450, 35, (1 - ((MainHallNextEventTimer - CommonTime()) / (MainHallNextEventTimer - MainHallStartEventTimer))) * 100);
	}

}

/**
 * Randomly select a new tip to display
 */
function MainHallCycleTips() {
	if (MainHallTipCycleTimer + MainHallTipCycleDelay <= CommonTime()) {
		MainHallTip = Math.floor(Math.random() * MainHallMaxTip);
		MainHallTipCycleTimer = CommonTime();
	}
}

/**
 * Validates the player's move into a new room. Before entering the requested rooms, the player can be attacked by random kidnappers or intercepted by various NPC types
 * @param {RoomName | "Trouble"} RoomName - Name of the room the player is heading to
 * @returns {void} - Nothing
 */
function MainHallWalk(RoomName) {

	// Each time the player travels from room to room, the odds raises for a random event
	if ((Math.random() * 100 < MainHallRandomEventOdds) || (RoomName == "Trouble")) {

		// Some circumstantial events have better odds of happening (player is club slave or escaped patient)
		MainHallRandomEventOdds = 0;
		var PlayerClubSlave = (ManagementIsClubSlave()) ? (Math.random() * 3) : 0;
		var PlayerEscapedAsylum = (AsylumHasEscaped() && (CheatFactor("BlockRandomKidnap", 0) == 1)) ? (Math.random() * 3) : 0;
		var MeetEscapedPatient = ((ReputationGet("Asylum") > 0) && !Player.IsRestrained() && AsylumEntranceIsWearingNurseClothes()) ? (Math.random() * 2) : 0;
		var MeetKidnapper = ((ReputationGet("Kidnap") > 0) && !KidnapLeagueBountyState && (CheatFactor("BlockRandomKidnap", 0) == 1)) ? Math.random() : 0;
		var MeetClubSlave = Math.random();
		var MeetPolice = (LogQuery("Joined", "BadGirl")) ? (Math.random() * PrisonWantedPlayer()) : 0;
		var PandoraRevenge = (SkillGetLevel(Player, "Infiltration") >= 3) ? Math.random() * (SkillGetLevel(Player, "Infiltration") / 7) : 0;
		var MeetNPCOwner = ((Player.IsOwned() === "npc") && PrivateOwnerInRoom()) ? Math.random() : 0;

		// Starts the event with the highest value (picked at random)
		if ((MeetNPCOwner > PandoraRevenge) && (MeetNPCOwner > MeetPolice) && (MeetNPCOwner > PlayerClubSlave) && (MeetNPCOwner > PlayerEscapedAsylum) && (MeetNPCOwner > MeetEscapedPatient) && (MeetNPCOwner > MeetKidnapper) && (MeetNPCOwner > MeetClubSlave)) PrivateOwnerInMainHall();
		else if ((PandoraRevenge > MeetPolice) && (PandoraRevenge > PlayerClubSlave) && (PandoraRevenge > PlayerEscapedAsylum) && (PandoraRevenge > MeetEscapedPatient) && (PandoraRevenge > MeetKidnapper) && (PandoraRevenge > MeetClubSlave)) InfiltrationStartKidnapping();
		else if ((MeetPolice > PlayerClubSlave) && (MeetPolice > PlayerEscapedAsylum) && (MeetPolice > MeetEscapedPatient) && (MeetPolice > MeetKidnapper) && (MeetPolice > MeetClubSlave)) CommonPromiseCatch(PrisonMeetPoliceIntro("MainHall"));
		else if ((PlayerClubSlave > PlayerEscapedAsylum) && (PlayerClubSlave > MeetEscapedPatient) && (PlayerClubSlave > MeetKidnapper) && (PlayerClubSlave > MeetClubSlave)) ManagementClubSlaveRandomIntro();
		else if ((PlayerEscapedAsylum > MeetEscapedPatient) && (PlayerEscapedAsylum > MeetKidnapper) && (PlayerEscapedAsylum > MeetClubSlave)) AsylumEntranceNurseCatchEscapedPlayer();
		else if ((MeetEscapedPatient > MeetKidnapper) && (MeetEscapedPatient > MeetClubSlave)) AsylumEntranceEscapedPatientMeet();
		else if (MeetKidnapper > MeetClubSlave) CommonPromiseCatch(KidnapLeagueRandomIntro());
		else ManagementFindClubSlaveRandomIntro();

	} else {

		// Each time the player travels, the odds get better for a random event
		MainHallRandomEventOdds = MainHallRandomEventOdds + 2;
		if (ManagementIsClubSlave()) MainHallRandomEventOdds = MainHallRandomEventOdds + 4;
		if (KidnapLeagueBountyState && KidnapLeagueBountyState.Location === RoomName && KidnapLeagueBountyState.Victory === undefined && Player.CanInteract() && (ReputationGet("Kidnap") > 0)) {
			KidnapLeagueBountyStart();
		} else {
			CommonSetScreen(.../** @type {ScreenSpecifier} */(["Room", RoomName]));
		}

	}

}

/**
 * Handles clicks in the main hall screen
 * @returns {void} - Nothing
 */
function MainHallClick() {

	// Character, Dressing, Exit & Chat
	if (MouseIn(750, 0, 500, 1000)) CharacterSetCurrent(Player);
	if (MouseIn(1645, 25, 90, 90)) InformationSheetLoadCharacter(Player);
	if (MouseIn(1765, 25, 90, 90) && Player.CanChangeOwnClothes()) CharacterAppearanceLoadCharacter(Player);
	if (MouseIn(1885, 25, 90, 90)) {
		if (window.confirm(TextGet("ExitConfirm"))) {
			ServerAccountUpdate.SyncToServer();
			window.location.reload();
		}
	}

	if (MouseIn(1645, 145, 90, 90)) MainHallMoveToChatSelect();

	// The options below are only available if the player can move
	if (Player.CanWalk() && (!Player.IsRestrained() || !Player.GameplaySettings.OfflineLockedRestrained)) {

		// Chat, Shop & Private Room
		if (MouseIn(1765, 145, 90, 90) && MainHallAllow("Shop")) MainHallWalk("Shop");
		if (MouseIn(1885, 145, 90, 90) && !LogQuery("LockOutOfPrivateRoom", "Rule") && MainHallAllow("Private")) MainHallWalk("Private");

		// Introduction, Maid & Management
		if (MouseIn(1645, 265, 90, 90) && MainHallAllow("Introduction")) MainHallWalk("Introduction");
		if (MouseIn(1765, 265, 90, 90) && MainHallAllow("MaidQuarters")) MainHallWalk("MaidQuarters");
		if (MouseIn(1885, 265, 90, 90)) MainHallWalk("Management");

		// Kidnap League, Dojo & Explore/Sarah
		if (MouseIn(1525, 385, 90, 90) && MainHallAllow("ClubCard")) MainHallWalk("ClubCardLounge");
		if (MouseIn(1645, 385, 90, 90) && MainHallAllow("KidnapLeague")) MainHallWalk("KidnapLeague");
		if (MouseIn(1765, 385, 90, 90) && MainHallAllow("ShibariDojo")) MainHallWalk("Shibari");
		if (MouseIn(1885, 385, 90, 90) && SarahRoomAvailable && MainHallAllow("Sarah")) MainHallWalk("Sarah");

		// Cell, Slave Market & Look for trouble
		if (MouseIn(1525, 505, 90, 90) && MainHallAllow("Crafting")) CraftingShowScreen(false);
		if (MouseIn(1645, 505, 90, 90) && MainHallAllow("Trouble")) MainHallWalk("Trouble");
		if (MouseIn(1765, 505, 90, 90) && MainHallAllow("SlaveMarket")) MainHallWalk("SlaveMarket");
		if (MouseIn(1885, 505, 90, 90) && MainHallAllow("Cell")) MainHallWalk("Cell");

		// Asylum & College
		if (MouseIn(1525, 625, 90, 90) && !ManagementIsClubSlave() && MainHallAllow("Platform")) MainHallWalk("PlatformIntro");
		if (MouseIn(1645, 625, 90, 90) && !ManagementIsClubSlave() && MainHallAllow("LARPBattle")) MainHallWalk("LARP");
		if (MouseIn(1765, 625, 90, 90) && !ManagementIsClubSlave() && MainHallAllow("College")) MainHallWalk("CollegeEntrance");
		if (MouseIn(1885, 625, 90, 90) && MainHallAsylumOpen && MainHallAllow("Asylum")) MainHallWalk("AsylumEntrance");

		// Movie Studio (Must be able to change to enter it)
		if (MouseIn(1525, 745, 90, 90) && Player.CanChangeOwnClothes() && MainHallAllow("MagicSchool")) MainHallWalk("MagicSchoolLaboratory");
		if (MouseIn(1645, 745, 90, 90) && Player.CanChangeOwnClothes() && !Player.IsRestrained() && Player.CanTalk() && MainHallAllow("Poker")) MainHallWalk("Poker");
		if (MouseIn(1765, 745, 90, 90) && Player.CanChangeOwnClothes() && MainHallAllow("Infiltration")) MainHallWalk("Infiltration");
		if (MouseIn(1885, 745, 90, 90) && Player.CanChangeOwnClothes() && MainHallAllow("MovieStudio")) MainHallWalk("MovieStudio");

		// Custom content rooms - Gambling, Prison & Photographic
		if (MouseIn(25, 25, 90, 90) && MainHallAllow("Gambling")) MainHallWalk("Gambling");
		if (MouseIn(145, 25, 90, 90) && MainHallAllow("Prison")) MainHallWalk("Prison");
		if (MouseIn(265, 25, 90, 90) && MainHallAllow("Photographic")) MainHallWalk("Photographic");

		// Stable, Magic-Theater & Nursery
		if (MouseIn(25, 145, 90, 90) && MainHallAllow("Stable")) MainHallWalk("Stable");
		if (MouseIn(145, 145, 90, 90) && MainHallAllow("Magic")) MainHallWalk("Magic");
		if (MouseIn(265, 145, 90, 90) && MainHallAllow("Nursery")) MainHallWalk("Nursery");

		// Cafe, Arcade
		if (MouseIn(25, 265, 90, 90) && MainHallAllow("Cafe")) MainHallWalk("Cafe");
		if (MouseIn(145, 265, 90, 90) && MainHallAllow("Arcade")) MainHallWalk("Arcade");

	} else {

		// Special permission to enter the maid quarters and cafe if doing the maid serving drinks quest while being restrained
		if (Player.CanWalk() && MaidQuartersOnlineDrinkStarted) {
			if (MouseIn(1765, 265, 90, 90))
				MainHallWalk("MaidQuarters");
			if (MouseIn(25, 265, 90, 90))
				MainHallWalk("Cafe");
		}
		// Special permission to enter the kidnappers league if doing the online bounty quest while being restrained
		if (Player.CanWalk() && (InventoryIsWorn(Player, "ItemMisc", "BountySuitcase") || InventoryIsWorn(Player, "ItemMisc", "BountySuitcaseEmpty")))
			if (MouseIn(1645, 385, 90, 90))
				MainHallWalk("KidnapLeague");

	}

	// When the player calls for a rescue maid
	if ((MainHallStartEventTimer == null) && (MainHallNextEventTimer == null)) {
		if (MouseIn(1885, 900, 90, 90)) {
			if (MainHallNextEventTimer == null) {
				AudioPlayInstantSound("Audio/BellSmall.mp3");
				MainHallStartEventTimer = CommonTime();
				MainHallNextEventTimer = CommonTime() + 40000 + Math.floor(Math.random() * 40000);
				MainHallMaidWasCalledManually = true;
			}
		} else if (MouseIn(1775, 900, 90, 90)) {
			MainHallOpenChangelog();
		}
	}

}

/**
 * Triggered when the player chooses to open changelog.
 */
function MainHallOpenChangelog() {
	window.open("./changelog.html", "_blank");
	DialogLeave();
}

/**
 * Triggered when the player asks for release, the player is freed from restraints and any combo locks
 * @returns {void} - Nothing
 */
function MainHallMaidReleasePlayer() {
	if (MainHallMaid.CanInteract()) {
		for (const dialog of MainHallMaid.Dialog)
			if (dialog.Stage == "0" && dialog.Option === null)
				dialog.Result = DialogFind(MainHallMaid, "AlreadyReleased");
		CharacterRelease(Player);
		for (const lock of MainHallStrongLocks)
			CharacterReleaseFromLock(Player, lock);
		if (LogQuery("MaidsDisabled", "Maid"))
			LogDelete("MaidsDisabled", "Maid");
		MainHallMaid.Stage = "10";
	} else MainHallMaid.CurrentDialog = DialogFind(MainHallMaid, "CannotRelease");
}

/**
 * Triggered when the maid is angry at the player, she might gag or tie her up if the player is not dominant or not a head maid
 * @returns {void} - Nothing
 */
function MainHallMaidAngry() {
	if ((ReputationGet("Dominant") < 30) && !DialogIsHeadMaid()) {
		for (const dialog of MainHallMaid.Dialog)
			if (dialog.Stage == "PlayerGagged" && dialog.Option === null)
				dialog.Result = DialogFind(MainHallMaid, "LearnedLesson");
		ReputationProgress("Dominant", 1);
		InventoryWearRandom(Player, "ItemMouth");
		if (Player.CanInteract()) {
			InventoryWear(Player, "LeatherArmbinder", "ItemArms");
			MainHallMaid.CurrentDialog = DialogFind(MainHallMaid, "TeachLesson");
		}
	} else MainHallMaid.CurrentDialog = DialogFind(MainHallMaid, "Cower");
}

/**
 * Triggered when the maid is tricked into releasing Sarah
 * @returns {void} - Nothing
 */
function MainHallFreeSarah() {
	ReputationProgress("Dominant", -4);
	SarahUnlock();
	DialogLeave();
}

/**
 * Triggered when the player calls the maids from a chat room
 * @returns {void} - Nothing
 */
function MainHallPunishFromChatroom() {
	MainHallBeingPunished = true;
	MainHallMaid.Stage = "1100";
	CharacterRelease(MainHallMaid);
	CharacterSetCurrent(MainHallMaid);
	if (ReputationGet("Dominant") > 10) ReputationProgress("Dominant", -10);
	if (ReputationGet("Dominant") < -10) ReputationProgress("Dominant", 10);
}

/**
 * Triggered when the maid unlocks the player from a chat room
 * @returns {void} - Nothing
 */
function MainHallPunishFromChatroomStartPunishment() {
	CharacterRelease(Player);
	CharacterNaked(Player);

	// Apply one of several preset restraints
	// Also  apply timer locks to everything
	var I = Math.floor(Math.random() * MainHallPunishmentList.length);
	MainHallPunishmentChoice = I;
}


/**
 * Triggered when the maid unlocks the player from a chat room
 * @deprecated
 * @returns {void} - Nothing
 */
function MainHallPunishFromListEnd() {
	ChatRoomSetLastChatRoom(null);
}

/**
 * Triggered when the maid unlocks the player from a chat room
 * @returns {void} - Nothing
 */
function MainHallPunishFromChatroomInsertToy() {
	const choice = MainHallPunishmentList[MainHallPunishmentChoice];
	// We might lock in a toy under the chastity
	if (choice.ItemVulva && InventoryGet(Player, "ItemVulva") == null) {
		const item = InventoryWear(Player, choice.ItemVulva, "ItemVulva");
		if (item) {
			VibratorModeSetOptionByName(Player, item, VibratorMode.MEDIUM);
		}
	}
	CharacterRefresh(Player);
}

/**
 * Triggered when the maid unlocks the player from a chat room
 * @returns {void} - Nothing
 */
function MainHallPunishFromChatroomApplyChastity() {
	const choice = MainHallPunishmentList[MainHallPunishmentChoice];
	if (choice.ItemPelvis && InventoryGet(Player, "ItemPelvis") == null) {
		InventoryWear(Player, choice.ItemPelvis, "ItemPelvis", "Default", Math.floor(Math.random()*10));
	}
	if (choice.ItemBreast && InventoryGet(Player, "ItemBreast") == null) {
		InventoryWear(Player, choice.ItemBreast, "ItemBreast", "Default", Math.floor(Math.random()*10));
	}

	CharacterRefresh(Player);
}


/**
 * Triggered when the maid unlocks the player from a chat room
 * @returns {void} - Nothing
 */
function MainHallPunishFromChatroomLockChastity() {
	var I = MainHallPunishmentChoice;
	if (MainHallPunishmentList[I].ItemPelvis && InventoryGet(Player, "ItemPelvis") == null) {
		InventoryLock(Player, "ItemPelvis", "TimerPadlock", MainHallMaid);
	}
	if (MainHallPunishmentList[I].ItemBreast && InventoryGet(Player, "ItemBreast") == null) {
		InventoryLock(Player, "ItemBreast", "TimerPadlock", MainHallMaid);
	}

	CharacterRefresh(Player);
}

/**
 * Triggered when the maid unlocks the player from a chat room
 * @returns {void} - Nothing
 */
function MainHallPunishFromChatroomGag() {
	const choice = MainHallPunishmentList[MainHallPunishmentChoice];

	if (choice.ItemMouth) {
		InventoryWear(Player, choice.ItemMouth, "ItemMouth", "Default", Math.floor(Math.random()*10));
		InventoryLock(Player, "ItemMouth", "TimerPadlock", MainHallMaid);
	}
	CharacterRefresh(Player);
}

/**
 * Triggered when the maid unlocks the player from a chat room
 * @returns {void} - Nothing
 */
function MainHallPunishFromChatroomArms() {
	const choice = MainHallPunishmentList[MainHallPunishmentChoice];
	if (MainHallPunishmentChoice == 0) {
		// We do rope bondage, excluding the feet, but with a ballgag

		MainHallRopeColor = "#F49EFF";
		const roperand = Math.random();
		if (roperand > 0.33) // Random chance of different color
			MainHallRopeColor = "#FF0000";
		else if (roperand > 0.67)
			MainHallRopeColor = "Default";

		// Wears more item with higher levels
		const item = InventoryWear(Player, "HempRope", "ItemArms", MainHallRopeColor, Math.floor(Math.random()*10));
		if (item && Math.random() > 0.5) {
			// Random chance of wrist elbow tie instead of boxtie
			TypedItemSetOptionByName(Player, item, "WristElbowHarnessTie");
		}
	} else if (choice.ItemArms) {
		/** @type {BCColor} */
		let ArmsColor = "Default";
		if (choice.ItemArms === "LatexBoxtieLeotard" || choice.ItemArms === "SeamlessStraitDress" ) {
			ArmsColor = "#252525";
		}
		InventoryWear(Player, choice.ItemArms, "ItemArms", ArmsColor, Math.floor(Math.random()*10));
		InventoryLock(Player, "ItemArms", "TimerPadlock", MainHallMaid);
	}


	if (choice.ItemHands && Math.random() > 0.33) {
		InventoryWear(Player, choice.ItemHands, "ItemHands", "Default", Math.floor(Math.random()*10));
		InventoryLock(Player, "ItemHands", "TimerPadlock", MainHallMaid);
	}
	CharacterRefresh(Player);
}

/**
 * Triggered when the maid unlocks the player from a chat room
 * @returns {void} - Nothing
 */
function MainHallPunishFromChatroomRest() {
	const I = MainHallPunishmentChoice;

	if (I == 0) {
		// We do rope bondage, excluding the feet, but with a ballgag
		InventoryWear(Player, "HempRope", "ItemLegs", MainHallRopeColor, Math.floor(Math.random()*10));
	} else {
		if (MainHallPunishmentList[I].ItemLegs) {
			InventoryWear(Player, MainHallPunishmentList[I].ItemLegs, "ItemLegs", "Default", Math.floor(Math.random()*10));
			InventoryLock(Player, "ItemLegs", "TimerPadlock", MainHallMaid);
		}
		if (MainHallPunishmentList[I].ItemFeet) {
			InventoryWear(Player, MainHallPunishmentList[I].ItemFeet, "ItemFeet", "Default", Math.floor(Math.random()*10));
			InventoryLock(Player, "ItemFeet", "TimerPadlock", MainHallMaid);
		}
		if (MainHallPunishmentList[I].ItemHead && Math.random() > 0.33) {
			InventoryWear(Player, MainHallPunishmentList[I].ItemHead, "ItemHead", "Default", Math.floor(Math.random()*10));
			InventoryLock(Player, "ItemHead", "TimerPadlock", MainHallMaid);
		}
		if (MainHallPunishmentList[I].ItemBoots && Math.random() > 0.33) {
			InventoryWear(Player, MainHallPunishmentList[I].ItemBoots, "ItemBoots", "Default", Math.floor(Math.random()*10));
			InventoryLock(Player, "ItemBoots", "TimerPadlock", MainHallMaid);
		}
	}

	CharacterRefresh(Player);

	MainHallBeingPunished = false;
	ChatRoomSetLastChatRoom(null);
}



/**
 * Triggered when the maid unlocks the player from an owner
 * @returns {void} - Nothing
 */
function MainHallMaidShamePlayer() {
	CharacterRelease(Player);
	MainHallMaidPunishmentPlayer();
}

/**
 * Triggered when the maid resets the slave collar to default. The player is punished after.
 * @returns {void} - Nothing
 */
function MainHallMaidChangeCollarPlayer() {
	for (const appearance of Player.Appearance)
		if (appearance.Asset.Name == "SlaveCollar") {
			appearance.Property = CommonCloneDeep(InventoryItemNeckSlaveCollarTypes[0].Property);
			appearance.Color = [...appearance.Asset.DefaultColor];
		}
	MainHallMaidPunishmentPlayer();
}

/**
 * Triggered when the maid punishes the player. The player is stripped and loses dominant/submissive reputation.
 * @returns {void} - Nothing
 */
function MainHallMaidPunishmentPlayer() {
	CharacterNaked(Player);
	LogAdd("BlockChange","Rule", CurrentTime + MS_PER_HOUR);
	if (ReputationGet("Dominant") > 10) ReputationProgress("Dominant", -10);
	if (ReputationGet("Dominant") < -10) ReputationProgress("Dominant", 10);
}

/**
 * Triggered when the maid catches the club slave player with clothes. The player is stripped and the timer is restarted.
 * @returns {void} - Nothing
 */
function MainHallResetClubSlave() {
	CharacterNaked(Player);
	LogAdd("ClubSlave", "Management", CurrentTime + MS_PER_HOUR);
	LogAdd("BlockChange", "Rule", CurrentTime + MS_PER_HOUR);
	TitleSet("ClubSlave");
}

/**
 * Triggered when the player needs to be brought to the club management room to be expelled
 * @returns {Promise<void>} - Nothing
 */
async function MainHallMistressExpulsion() {
	await CommonSetScreen("Room", "Management");
	ManagementMistress.Stage = "500";
	ManagementMistress.CurrentDialog = DialogFind(MainHallMaid, "MistressExpulsion");
	CharacterSetCurrent(ManagementMistress);
}

/**
 * Sets the maid dialog stage to the introduction for new players
 * @returns {void} - Nothing
 */
function MainHallMaidIntroduction() {
	if (!LogQuery("IntroductionDone", "MainHall") && Player.CanTalk()) {
		MainHallMaid.Stage = "1000";
		MainHallMaid.CurrentDialog = DialogFindPlayer("IntroductionMaidGreetings");
		CharacterSetCurrent(MainHallMaid);
	}
}

/**
 * Flags the introduction as done
 * @returns {void} - Nothing
 */
function MainHallMaidIntroductionDone() {
	LogAdd("IntroductionDone", "MainHall");
}

/**
 * @param {number} minutes
 */
function MainHallSetMaidsDisabled(minutes) {
	var millis = minutes * MS_PER_MIN;
	LogAdd("MaidsDisabled", "Maid", CurrentTime + millis);
}

function MainHallMoveToChatSelect() {
	CommonSetScreen("Online", "ChatSelect");
}
