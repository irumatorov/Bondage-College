"use strict";
var GameLARPBackground = "Sheet";
var GameLARPClass = [
	{
		Name: "Matron",
		Bonus: [0.20, 0.00],
		Ability: ["Charge", "Control", "Detain"]
	},
	{
		Name: "Seducer",
		Bonus: [0.16, 0.04],
		Ability: ["Expose", "Inspire", "Seduce"]
	},
	{
		Name: "Trickster",
		Bonus: [0.12, 0.08],
		Ability: ["Confuse", "Hide", "Immobilize"]
	},
	{
		Name: "Artist",
		Bonus: [0.08, 0.12],
		Ability: ["Cheer", "Costume", "Evasion"]
	},
	{
		Name: "Servant",
		Bonus: [0.04, 0.16],
		Ability: ["Rescue", "Silence", "Ungag"]
	},
	{
		Name: "Protector",
		Bonus: [0.00, 0.20],
		Ability: ["Cover", "Dress", "Support"]
	},
];
var GameLARPTeamList = ["None", "Red", "Green", "Blue", "Yellow", "Cyan", "Purple", "Orange", "White", "Gray", "Black"];
var GameLARPTimerDelay = [20, 60];
var GameLARPEntryClass = "";
var GameLARPEntryTeam = "";
/** @type { { Sender: number, Time: number, RNG: number, Data: ServerChatRoomGameResponseBase<ServerGameLARPData>["Data"], Success?: boolean }[] } */
var GameLARPProgress = [];
/** @type {OnlineCharacter[]} */
var GameLARPPlayer = [];
/** @type {GameLARPOption[]} */
var GameLARPOption = [];
/** @type {GameLARPActionName | null} */
var GameLARPAction = null;
/** @type {Asset[]} */
var GameLARPInventory = [];
var GameLARPInventoryOffset = 0;
var GameLARPTurnAdmin = 0;
var GameLARPTurnPosition = 0;
var GameLARPTurnAscending = true;
/** @type {number} */
var GameLARPTurnTimer = 0;
var GameLARPTurnTimerDelay = GameLARPTimerDelay[0];
/** @type {null | Character} */
var GameLARPTurnFocusCharacter = null;
/** @type {null | string} */
var GameLARPTurnFocusGroup = null;

/**
 * Gets the current state of LARP.
 * @returns {OnlineGameStatus}
 */
function GameLARPGetStatus() {
	if (Player.Game?.LARP?.Status && ["", "Running"].includes(Player.Game?.LARP?.Status))
		return Player.Game.LARP.Status;
	return "";
}

/**
 * Set the current state of LARP.
 * @param {OnlineGameStatus} NewStatus
 * @returns {void}
 */
function GameLARPSetStatus(NewStatus) {

	if (!["", "Running"].includes(NewStatus)) return;

	let ForceUpdate = false;
	if (Player.Game == null || Player.Game.LARP == null) {
		ForceUpdate = true;
		GameLARPInitialize();
	}

	if (ForceUpdate || (NewStatus !== Player.Game?.LARP?.Status)) {
		Player.Game ??= {};
		Player.Game.LARP ??= {};
		Player.Game.LARP.Status = NewStatus;
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	}

}

/**
 * Checks if the character is an admin or the LARP admin while the game is going.
 * @param {OnlineCharacter} C - Character to check for
 * @returns {boolean} -  Returns TRUE if that character is an admin/the game administrator
 */
function GameLARPIsAdmin(C) {
	if (GameLARPGetStatus() == "")
		return ChatRoomCharacterIsAdmin(C);
	else
		return (GameLARPTurnAdmin == C.MemberNumber);
}

/**
 * Draws the LARP class/team icon of a character
 * @param {Character} C - Character for which to draw the icons
 * @param {number} X - Position on the X axis of the canvas
 * @param {number} Y - Position on the Y axis of the canvas
 * @param {number} Zoom - Zoom factor of the character
 * @returns {void} - Nothing
 */
function GameLARPDrawIcon(C, X, Y, Zoom) {
	if (C.Game?.LARP?.Class && C.Game?.LARP?.Team !== "None")
		DrawImageZoomCanvas("Icons/LARP/" + C.Game.LARP.Class + C.Game.LARP.Team + ".png", MainCanvas, 0, 0, 100, 100, X, Y, 100 * Zoom, 100 * Zoom);
}

/**
 *
 * @param {Character} char
 * @returns {Required<GameLARPParameters>}
 */
function GameLARPGetData(char) {
	let larpData = char?.Game?.LARP;
	larpData ??= {};
	larpData.Status ??= "";
	larpData.Class ??= GameLARPClass[0].Name;
	larpData.Team ??= GameLARPTeamList[0];
	larpData.TimerDelay ??= GameLARPTimerDelay[0];
	larpData.Level ??= [];
	return /** @type {Required<GameLARPParameters>} */ (larpData);
}

/**
 * Loads the LARP game.
 * @type {ScreenLoadHandler}
 */
async function GameLARPLoad() {
	GameLARPInitialize();
}

function GameLARPInitialize() {
	const { Class, Team } = GameLARPGetData(Player);

	GameLARPEntryClass = Class;
	GameLARPEntryTeam = Team;
	if (GameLARPGetStatus() == "") GameLARPProgress = [];
}

/**
 * Runs and draws the LARP game.
 * @returns {void} - Nothing
 */
function GameLARPRun() {

	const larpData = GameLARPGetData(Player);
	// Draw the character, text and buttons
	DrawCharacter(Player, 50, 50, 0.9);
	MainCanvas.textAlign = "left";
	DrawText(TextGet("Title"), 550, 125, "Black", "Gray");
	DrawText(TextGet("SelectClass"), 550, 225, "Black", "Gray");
	DrawText(TextGet("SelectTeam"), 550, 425, "Black", "Gray");
	if (GameLARPGetStatus() != "") DrawText(TextGet("Class" + larpData.Class), 900, 225, "Black", "Gray");
	DrawText(TextGet("LevelProgress"), 550, 325, "Black", "Gray");
	DrawText(GameLARPGetClassLevel(larpData) + " (" + Math.floor(GameLARPGetClassProgress(larpData) / 10).toString() + "%)", 900, 325, "Black", "Gray");
	if (GameLARPGetStatus() != "") DrawText(TextGet("Color" + larpData.Team), 900, 425, "Black", "Gray");
	DrawText(TextGet((GameLARPGetStatus() == "") ? "StartCondition" : "RunningGame"), 550, 525, "Black", "Gray");
	MainCanvas.textAlign = "center";
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if (GameLARPGetStatus() == "") DrawBackNextButton(900, 193, 400, 64, TextGet("Class" + larpData.Class), "White", "", () => "", () => "");
	if (GameLARPGetStatus() == "") DrawBackNextButton(900, 393, 400, 64, TextGet("Color" + larpData.Team), "White", "", () => "", () => "");
	GameLARPDrawIcon(Player, 1400, 225, 2);
	if (GameLARPCanLaunchGame()) DrawBackNextButton(550, 600, 400, 65, TextGet("TimerDelay" + larpData.TimerDelay), "White", "", () => "", () => "");
	if (GameLARPCanLaunchGame()) DrawButton(1050, 600, 400, 65, TextGet("StartGame"), "White");

}

/**
 * Runs the game from the chat room
 * @returns {void} - Nothing
 */
function GameLARPRunProcess() {

	// If the player is an admin, she can make player skip their turns
	if ((GameLARPGetStatus() == "Running") && (TimerGetTime() > GameLARPTurnTimer) && GameLARPIsAdmin(Player)) {
		GameLARPTurnTimer = TimerGetTime() + (GameLARPTurnTimerDelay * 1000);
		ServerSend("ChatRoomGame", { GameProgress: "Skip" });
	}

	// Clears the focused character if it's not the player turn
	if ((GameLARPTurnFocusCharacter != null) && ((GameLARPGetStatus() != "Running") || !GameLARPPlayer[GameLARPTurnPosition].IsPlayer())) GameLARPTurnFocusCharacter = null;

	// If we must show the focused character and available abilities
	if (GameLARPTurnFocusCharacter != null) {

		// Darken the room if we have a selection
		DrawRect(0, 0, 1000, 1000, "rgba(0,0,0," + 0.5 + ")");

		// In inventory selection mode
		if (GameLARPTurnFocusGroup != null) {

			// Draw the label and buttons
			DrawText(OnlineGameDictionaryText("ItemSelect"), 263, 50, "White", "Gray");
			if (GameLARPInventory.length > 12) DrawButton(525, 20, 200, 60, OnlineGameDictionaryText("ItemNext"), "White");
			DrawButton(775, 20, 200, 60, OnlineGameDictionaryText("ItemCancel"), "White");

			// Prepares a 4x3 square selection with inventory from the buffer
			var X = 15;
			var Y = 110;
			for (let A = GameLARPInventoryOffset; (A < GameLARPInventory.length) && (A < GameLARPInventoryOffset + 12); A++) {
				const asset = GameLARPInventory[A];
				DrawAssetPreview(X, Y, asset, { Hover: true });

				X = X + 250;
				if (X > 800) {
					X = 15;
					Y = Y + 300;
				}
			}

		} else {

			// Draw all the possible options
			DrawCharacter(GameLARPTurnFocusCharacter, 500, 0, 1);

			for (let O = 0; O < GameLARPOption.length; O++) {
				const option = GameLARPOption[O];

				// Prepare substitutions for this option using full pronoun substitution
				const substitutions = GameLARPBuildSubstitutions(Player, GameLARPTurnFocusCharacter, "", null, option.Odds);
				substitutions.push(["OptionOdds", Math.round(option.Odds * 100).toString()]);

				// Get the dictionary text and apply substitutions
				const buttonText = CommonStringSubstitute(OnlineGameDictionaryText("Option" + option.Name), substitutions);

				// Draw the button
				DrawButton(50, 35 + (O * 100), 400, 65, buttonText, "White");
			}

			DrawButton(50, 900, 400, 65, OnlineGameDictionaryText("BackToCharacters"), "White");

			// Draw the timer
			MainCanvas.font = CommonGetFont(108);
			var Time = Math.ceil((GameLARPTurnTimer - TimerGetTime()) / 1000);
			DrawText(((Time < 0) || (Time > GameLARPTimerDelay[GameLARPTimerDelay.length - 1])) ? OnlineGameDictionaryText("TimerNA") : Time.toString(), 250, 800, "Red", "White");
			MainCanvas.font = CommonGetFont(36);

		}

	}

	// Reset any notification that may have been raised
	if (document.hasFocus()) NotificationReset(NotificationEventType.LARP);
}

/**
 * Builds the inventory selection list for a given asset group.
 * @param {string} FocusGroup - Asset group for which to build the inventory.
 * @returns {void} - Nothing
 */
function GameLARPBuildInventory(FocusGroup) {
	GameLARPTurnFocusGroup = FocusGroup;
	GameLARPInventory = [];
	GameLARPInventoryOffset = 0;
	for (let A = 0; A < Player.Inventory.length; A++)
		if ((Player.Inventory[A].Asset != null) && (Player.Inventory[A].Asset.Group.Name == FocusGroup) && Player.Inventory[A].Asset.Enable && Player.Inventory[A].Asset.Wear && Player.Inventory[A].Asset.Random)
			GameLARPInventory.push(Player.Inventory[A].Asset);
	GameLARPInventory.sort((a,b) => (a.Description > b.Description) ? 1 : ((b.Description > a.Description) ? -1 : 0));
}

/**
 * Triggered when an option is selected for the current target character. The inventory for it is built and the action is published
 * @param {GameLARPActionName} Name - Name of the selected option
 * @returns {void} - Nothing
 */
function GameLARPClickOption(Name) {
	if (!GameLARPTurnFocusCharacter) return;
	GameLARPAction = Name;
	if ((Name == "RestrainLegs") || (Name == "Immobilize")) return GameLARPBuildInventory("ItemFeet");
	if ((Name == "RestrainMouth") || (Name == "Silence")) return GameLARPBuildInventory("ItemMouth");
	if ((Name == "RestrainArms") || (Name == "Detain")) return GameLARPBuildInventory("ItemArms");
	if ((Name == "Costume") || (Name == "Dress")) return GameLARPBuildInventory("Cloth");
	ServerSend("ChatRoomGame", { GameProgress: "Action", Action: Name, Target: GameLARPTurnFocusCharacter.MemberNumber });
}

/**
 * Handles clicks during the LARP game.
 * @returns {boolean} - Returns TRUE if the click was handled by this LARP click handler
 */
function GameLARPClickProcess() {

	// Do not handle any click if no character is selected, a target is required here
	if (GameLARPTurnFocusCharacter == null) return false;

	// In inventory selection mode
	if (GameLARPTurnFocusGroup != null) {

		// If "Next" or "Cancel" is clicked
		if ((GameLARPInventory.length > 12) && MouseIn(525, 20, 200, 60)) {
			GameLARPInventoryOffset = GameLARPInventoryOffset + 12;
			if (GameLARPInventoryOffset >= GameLARPInventory.length) GameLARPInventoryOffset = 0;
		}
		if (MouseIn(775, 20, 200, 60)) GameLARPTurnFocusGroup = null;

		// Checks if one of the 4x3 inventory square is clicked
		var X = 15;
		var Y = 110;
		for (let A = GameLARPInventoryOffset; (A < GameLARPInventory.length) && (A < GameLARPInventoryOffset + 12); A++) {
			if (MouseIn(X, Y, 225, 275))
				ServerSend("ChatRoomGame", { GameProgress: "Action", Action: GameLARPAction ?? undefined, Item: GameLARPInventory[A].Name, Target: GameLARPTurnFocusCharacter.MemberNumber });
			X = X + 250;
			if (X > 800) {
				X = 15;
				Y = Y + 300;
			}
		}

	} else {

		// If we must catch the click on one of the buttons
		for (let O = 0; O < GameLARPOption.length; O++)
			if (MouseIn(50, 35 + (O * 100), 400, 65))
				GameLARPClickOption(GameLARPOption[O].Name);

		// If we must exit from the currently focused character
		if (MouseIn(50, 900, 400, 65)) GameLARPTurnFocusCharacter = null;

	}

	// Flags the click as being handled
	return true;

}

/**
 * Starts a LARP match.
 * @returns {void} - Nothing
 */
function GameLARPStartProcess() {

	// Gives a delay in seconds, based on the player preference
	GameLARPTurnTimer = TimerGetTime() + (GameLARPTurnTimerDelay * 1000);

	// Notices everyone in the room that the game starts

	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.build();
	Dictionary.push({Tag: "SourceCharacter", Text: CharacterNickname(Player), MemberNumber: Player.MemberNumber});
	ServerSend("ChatRoomChat", { Content: "LARPGameStart", Type: "Action" , Dictionary: Dictionary});

	// Changes the game status and exits
	ServerSend("ChatRoomGame", { GameProgress: "Start" });
	GameLARPSetStatus("Running");
	ChatRoomCharacterUpdate(Player);
}

/**
 * Handles clicks in the LARP chat Admin screen
 * @returns {void} - Nothing
 */
function GameLARPClick() {

	const larp = GameLARPGetData(Player);

	// When the user exits
	if (MouseIn(1815, 75, 90, 90)) GameLARPExit();

	// When the user selects a new class
	if (MouseIn(900, 193, 400, 64) && (GameLARPGetStatus() == "")) {
		var Index = 0;
		for (let I = 0; I < GameLARPClass.length; I++)
			if (GameLARPClass[I].Name == larp.Class)
				Index = I;
		if (MouseX <= 1100) Index = (Index <= 0) ? GameLARPClass.length - 1 : Index - 1;
		else Index = (Index >= GameLARPClass.length - 1) ? 0 : Index + 1;
		larp.Class = GameLARPClass[Index].Name;
	}

	// When the user selects a new team
	if (MouseIn(900, 393, 400, 64) && (GameLARPGetStatus() == "")) {
		let currentTeamIdx = GameLARPTeamList.indexOf(larp.Team);
		if (currentTeamIdx < 0) currentTeamIdx = 0;
		larp.Team = GameLARPTeamList[CommonModulo(currentTeamIdx + (MouseX <= 1100 ? -1 : +1), GameLARPTeamList.length)];
	}

	// When the user selects a new timer delay
	if (MouseIn(550, 600, 400, 65) && GameLARPCanLaunchGame()) {
		let currentDelayIdx = GameLARPTimerDelay.indexOf(larp.TimerDelay);
		if (currentDelayIdx < 0) currentDelayIdx = 0;
		larp.TimerDelay = GameLARPTimerDelay[CommonModulo(currentDelayIdx + (MouseX <= 750 ? -1 : +1), GameLARPTimerDelay.length)];
	}

	// If the administrator wants to start the game
	if (MouseIn(1050, 600, 400, 65) && GameLARPCanLaunchGame()) {

		// Updates the player data
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		ChatRoomCharacterUpdate(Player);

		// Shuffles all players in the chat room
		for (const char of ChatRoomCharacter) {
			if (!char.IsPlayer() && typeof char.MemberNumber === "number") {
				ServerSend("ChatRoomAdmin", { MemberNumber: char.MemberNumber, Action: "Shuffle" });
				break;
			}
		}

		// Give time for the server to shuffle the room
		setTimeout(GameLARPStartProcess, 4000);
		CommonSetScreen("Online", "ChatRoom");

	}

}

/**
 * Triggered when the player exits the LARP info screen.
 * @type {ScreenExitHandler}
 */
function GameLARPExit() {

	const larp = GameLARPGetData(Player);
	// When the game isn't running, we allow to change the class or team
	if (GameLARPGetStatus() == "") {

		// Notices everyone in the room of the change, if there is any
		if (GameLARPEntryClass !== larp.Class || GameLARPEntryTeam !== larp.Team) {

			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.build();
			ServerSend("ChatRoomChat", { Content: "LARPChangeTeamClass", Type: "Action", Dictionary: Dictionary });
		}

		// Updates the player and go back to the chat room
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		ChatRoomCharacterUpdate(Player);
		CommonSetScreen("Online", "ChatRoom");

	} else {
		larp.Class = GameLARPEntryClass;
		larp.Team = GameLARPEntryTeam;
		CommonSetScreen("Online", "ChatRoom");
	}

}

/**
 * Checks if a LARP match can be launched. The player must be an admin and two different teams must be selected.
 * @returns {boolean} - Returns TRUE if the game can be launched
 */
function GameLARPCanLaunchGame() {
	if (Player.Game?.LARP?.Class == null || Player.Game.LARP.Class == "") return false;
	if (Player.Game?.LARP?.Team == null || Player.Game.LARP.Team == "None") return false;
	if (GameLARPGetStatus() != "") return false;
	if (!GameLARPIsAdmin(Player)) return false;

	// We're looking for more than one active team in the room
	let Team = "";
	for (const char of ChatRoomCharacter) {
		const charTeam = char.Game?.LARP?.Team ?? "";
		if (charTeam === "" || charTeam === "None") continue;
		// Can't launch if arms aren't free
		if (InventoryGet(char, "ItemArms")) continue;
		if (Team === "") {
			Team = charTeam;
		} else if (Team !== charTeam) {
			return true;
		}
	}
	return false;
}

/**
 * Gets a specific bonus from a given character's class.
 * @param {Character} Target - Character to check for a specific bonus value.
 * @param {number} BonusType - The bonus type to get the value of.
 * @returns {number} - Total bonuses for the given character.
 */
function GameLARPGetBonus(Target, BonusType) {

	// Gets the base class bonus
	const targetLARP = GameLARPGetData(Target);
	const ClassBonus = GameLARPClass.find(c => c.Name === targetLARP.Class)?.Bonus[BonusType] ?? 0;

	// Gets the class level bonus (0 gives no bonus, 10 gives a 50% to class bonus)
	let LevelBonus = 0;
	if (ClassBonus > 0) {
		for (const levelData of targetLARP.Level) {
			if (levelData.Name === targetLARP.Class && CommonIsFinite(levelData.Level, 0, 10)) {
				LevelBonus = Math.round((ClassBonus * 0.05 * levelData.Level) * 100) / 100;
			}
		}
	}

	// The ability bonuses only work for a full cycle (GameLARPPlayer.length * 2)
	let AbilityBonus = 0;
	for (let P = ((GameLARPProgress.length - GameLARPPlayer.length * 2 + 1 > 0) ? GameLARPProgress.length - GameLARPPlayer.length * 2 + 1 : 0); P < GameLARPProgress.length; P++) {
		const progress = GameLARPProgress[P];
		if ((progress.Success != null) && (progress.Data.GameProgress == "Action")) {
			const Source = GameLARPGetPlayer(progress.Sender);
			if (!Source) continue;
			if (Source.Game?.LARP?.Team === targetLARP.Team && progress.Data.Action == "Charge" && BonusType == 0) AbilityBonus = 0.25;
			if (Source.Game?.LARP?.Team === targetLARP.Team && progress.Data.GameProgress == "Action" && progress.Data.Action == "Support" && BonusType == 1) AbilityBonus = 0.25;
			if (progress.Data.Target === Target.MemberNumber && progress.Data.GameProgress == "Action" && progress.Data.Action == "Cheer") AbilityBonus = 0.25;
		}
	}

	// Returns both bonuses
	return ClassBonus + LevelBonus + AbilityBonus;

}

/**
 * Gets the odds of successfully doing an offensive action on a given character.
 * @param {string} Action - Action attempted.
 * @param {Character} Source - Character doing the move.
 * @param {Character} Target - Character targetted by the move.
 * @returns {number} - Odds of successfully doing an offensive action. The number has two decimals.
 */
function GameLARPGetOdds(Action, Source, Target) {

	// The basic odds are 50% + Offensive bonus of source - Defensive bonus of target
	var Odds = 0.5 + GameLARPGetBonus(Source, 0) - GameLARPGetBonus(Target, 1);

	// Struggling starts at 10% + 10% for each new unsuccessful tries, tightening the bonds will reset it to 10%
	if (Action == "Struggle") {
		Odds = 0.05;
		for (let P = 0; P < GameLARPProgress.length; P++) {
			const progress = GameLARPProgress[P];
			if ((progress.Success != null) && (progress.Data.GameProgress == "Action")) {
				if (progress.Sender == Source.MemberNumber && progress.Data.Target == Source.MemberNumber && progress.Data.Action == "Struggle" && !progress.Success) Odds = Odds + 0.05;
				if (progress.Sender == Source.MemberNumber && progress.Data.Target == Source.MemberNumber && progress.Data.Action == "Struggle" && progress.Success) Odds = 0.05;
				if (progress.Data.Target == Source.MemberNumber && progress.Data.Action == "RestrainArms" && progress.Success) Odds = 0.05;
				if (progress.Data.Target == Source.MemberNumber && progress.Data.Action == "Tighten" && progress.Success) Odds = 0.05;
			}
		}
	}

	// Many actions have fixed %
	if (["Pass", "Charge", "Control", "Hide", "Evasion", "Support", "Dress"].indexOf(Action) >= 0)
		return (Source.MemberNumber === Target.MemberNumber) ? 1 : 0;
	if (["Inspire", "Cheer", "Costume", "Rescue", "Cover", "Ungag"].indexOf(Action) >= 0)
		return ((Source.MemberNumber !== Target.MemberNumber) && (Source.Game?.LARP?.Team === Target.Game?.LARP?.Team)) ? 1 : 0;
	if (["Detain", "Expose", "Seduce", "Confuse", "Immobilize", "Silence", "Tighten"].indexOf(Action) >= 0)
		return ((Source.MemberNumber !== Target.MemberNumber) && (Source.Game?.LARP?.Team !== Target.Game?.LARP?.Team)) ? 1 : 0;

	// Returns the % between 0 and 1
	return Math.round(CommonClamp(Odds, 0, 1) * 100) / 100;

}

/**
 * In LARP, check if the given character can talk.
 * @param {Character} C - Character to check.
 * @returns {boolean} - Whether the character can talk or not
 */
function GameLARPCanTalk(C) { return (InventoryGet(C, "ItemMouth") == null); }
/**
 * In LARP, check if the given character can walk.
 * @param {Character} C - Character to check.
 * @returns {boolean} - Whether the character can walk or not
 */
function GameLARPCanWalk(C) { return (InventoryGet(C, "ItemFeet") == null); }
/**
 * In LARP, check if the given character can act.
 * @param {Character} C - Character to check.
 * @returns {boolean} - Whether the character can act or not
 */
function GameLARPCanAct(C) { return (InventoryGet(C, "ItemArms") == null); }
/**
 * In LARP, check if the given character is wearing clothes.
 * @param {Character} C - Character to check.
 * @returns {boolean} - Whether the character is wearing clothes or not
 */
function GameLARPClothed(C) { return (InventoryGet(C, "Cloth") != null); }

/**
 * Checks if an item can be removed in LARP.
 * @param {Character} C - Character to check for a lock on the given group.
 * @param {AssetGroupItemName} Zone - Group to check for a lock.
 * @returns {boolean} - Returns TRUE if we can remove an item at a specific zone (cannot remove if there's a custom lock)
 */
function GameLARPCanRemoveItem(C, Zone) {
	var Item = InventoryGet(C, Zone);
	if (Item == null) return false;
	if (InventoryGetLock(Item) != null) return false;
	return true;
}

/**
 * Adds all available class abilities to the built basic options
 * @param {Character} Source - Character about to do an action.
 * @param {Character} Target - The character on which an action is about to be done.
 * @param {Array.<{ Name: string, Odds: number}>} Option - List of the basic options the source character can perform
 * @param {string} Ability - Character's ability.
 * @returns {void} - Nothing
 */
function GameLARPBuildOptionAbility(Source, Target, Option, Ability) {

	// Only the "Evasion" special ability can be used when arms are restrained
	if ((Ability != "Evasion") && !GameLARPCanAct(Source)) return;

	// If the ability was already used in that battle, it cannot be used again, the ability "Inspire" makes it usable once again
	var AlreadyUsed = false;
	for (let P = 0; P < GameLARPProgress.length; P++) {
		const progress = GameLARPProgress[P];
		if (progress.Sender == Source.MemberNumber && progress.Data.GameProgress == "Action" && progress.Data.Action == Ability) AlreadyUsed = true;
		if (progress.Success != null && progress.Success && progress.Data.GameProgress == "Action" && progress.Data.Action == "Inspire" && progress.Data.Target == Source.MemberNumber) AlreadyUsed = false;
	}
	if (AlreadyUsed) return;

	// If "Control" or "Confuse" is in progress for this cycle, no class abilities can be used
	for (let P = ((GameLARPProgress.length - GameLARPPlayer.length * 2 + 1 > 0) ? GameLARPProgress.length - GameLARPPlayer.length * 2 + 1 : 0); P < GameLARPProgress.length; P++) {
		const progress = GameLARPProgress[P];
		if (progress.Success != null && progress.Data.GameProgress == "Action" && progress.Data.Action == "Control") return;
		if (progress.Success != null && progress.Data.GameProgress == "Action" && progress.Data.Action == "Confuse" && progress.Data.Target == Source.MemberNumber) return;
	}

	// If the player targets herself
	if (Source.MemberNumber == Target.MemberNumber) {

		// Abilities that can be used on yourself
		let Odds = GameLARPGetOdds(Ability, Source, Source);
		if ((Ability == "Charge") && GameLARPCanWalk(Source)) Option.push({ Name: Ability, Odds: Odds });
		if ((Ability == "Control") && GameLARPCanTalk(Source)) Option.push({ Name: Ability, Odds: Odds });
		if (Ability == "Hide") Option.push({ Name: Ability, Odds: Odds });
		if ((Ability == "Evasion") && (GameLARPCanRemoveItem(Source, "ItemFeet") || GameLARPCanRemoveItem(Source, "ItemArms"))) Option.push({ Name: Ability, Odds: Odds });
		if ((Ability == "Support") && GameLARPCanTalk(Source)) Option.push({ Name: Ability, Odds: Odds });
		if (Ability == "Dress") Option.push({ Name: Ability, Odds: Odds });

	} else {

		// If the player targets someone from her team
		let Odds = GameLARPGetOdds(Ability, Source, Target);
		if (Source.Game?.LARP?.Team === Target.Game?.LARP?.Team) {

			// Abilities that can be used on someone from your team
			if (Ability == "Inspire") Option.push({ Name: Ability, Odds: Odds });
			if ((Ability == "Cheer") && GameLARPCanTalk(Source)) Option.push({ Name: Ability, Odds: Odds });
			if ((Ability == "Costume") && GameLARPCanWalk(Source)) Option.push({ Name: Ability, Odds: Odds });
			if ((Ability == "Rescue") && GameLARPCanWalk(Source) && (GameLARPCanRemoveItem(Target, "ItemFeet") || GameLARPCanRemoveItem(Target, "ItemArms"))) Option.push({ Name: Ability, Odds: Odds });
			if ((Ability == "Cover") && GameLARPCanWalk(Source)) Option.push({ Name: Ability, Odds: Odds });
			if ((Ability == "Ungag") && GameLARPCanRemoveItem(Target, "ItemMouth")) Option.push({ Name: Ability, Odds: Odds });

		} else {

			// Abilities that are used on players from another team, cannot be used if target arms are restrained
			if (InventoryGet(Target, "ItemArms") != null) return;
			if ((Ability == "Detain") && !GameLARPClothed(Target) && !GameLARPCanTalk(Target) && !GameLARPCanWalk(Target)) Option.push({ Name: Ability, Odds: Odds });
			if ((Ability == "Expose") && GameLARPClothed(Target)) Option.push({ Name: Ability, Odds: Odds });
			if ((Ability == "Seduce") && GameLARPCanTalk(Source)) Option.push({ Name: Ability, Odds: Odds });
			if ((Ability == "Confuse") && GameLARPCanTalk(Source)) Option.push({ Name: Ability, Odds: Odds });
			if ((Ability == "Immobilize") && !GameLARPClothed(Target) && GameLARPCanWalk(Target)) Option.push({ Name: Ability, Odds: Odds });
			if ((Ability == "Silence") && !GameLARPClothed(Target) && GameLARPCanTalk(Target)) Option.push({ Name: Ability, Odds: Odds });

		}

	}

}

/**
 * Builds the available options a character can perform on another for the LARP menu.
 * @param {Character} Source - Character about to do an action.
 * @param {Character} Target - The character on which an action is about to be done.
 * @returns {GameLARPOption[]} - Options the character can perform
 */
function GameLARPBuildOption(Source, Target) {

	// If the source clicks on herself, she can always pass her turn and do nothing
	/** @type {GameLARPOption[]} */
	var Option = [];
	if (Source.MemberNumber == Target.MemberNumber) Option.push({ Name: "Pass", Odds: GameLARPGetOdds("Pass", Source, Source) });

	// If seduce is in progress on the source, all she can do is pass her turn
	var PassTurn = false;
	for (let P = ((GameLARPProgress.length - GameLARPPlayer.length * 2 + 1 > 0) ? GameLARPProgress.length - GameLARPPlayer.length * 2 + 1 : 0); P < GameLARPProgress.length; P++) {
		const progress = GameLARPProgress[P];
		if (progress.Success && progress.Data.GameProgress == "Action" && progress.Data.Action == "Seduce" && progress.Data.Target == Source.MemberNumber) PassTurn = true;
		if (progress.Data.GameProgress == "Action" && progress.Data.Action == "Pass" && progress.Sender == Source.MemberNumber) PassTurn = false;
	}
	if (PassTurn) return Option;

	// If the source is restrained, she only has the struggle option on herself
	if ((InventoryGet(Source, "ItemArms") != null) && (Source.MemberNumber == Target.MemberNumber))
		Option.push({ Name: "Struggle", Odds: GameLARPGetOdds("Struggle", Source, Source) });

	// If "Hide" or "Cover" are in progress, no offensive abilities can be used
	if (Source.Game?.LARP?.Team !== Target.Game?.LARP?.Team) {

		// Checks for "Hide"
		let CanTarget = true;
		for (let P = ((GameLARPProgress.length - GameLARPPlayer.length * 2 + 1 > 0) ? GameLARPProgress.length - GameLARPPlayer.length * 2 + 1 : 0); P < GameLARPProgress.length; P++) {
			const progress = GameLARPProgress[P];
			if (progress.Sender == Target.MemberNumber)
				CanTarget = !(progress.Success && progress.Data.GameProgress == "Action" && progress.Data.Action == "Hide" && progress.Sender == Target.MemberNumber);
		}
		if (!CanTarget) return Option;

		// Checks for "Cover"
		for (let P = ((GameLARPProgress.length - GameLARPPlayer.length * 2 + 1 > 0) ? GameLARPProgress.length - GameLARPPlayer.length * 2 + 1 : 0); P < GameLARPProgress.length; P++) {
			const progress = GameLARPProgress[P];
			if (progress.Success && progress.Data.GameProgress == "Action" && progress.Data.Action == "Cover" && progress.Data.Target == Target.MemberNumber)
				return Option;
		}

	}

	// Gets all abilities for the class and assigns which one can be used
	const larpClass = GameLARPClass.find(c => c.Name === Source.Game?.LARP?.Class);
	if (larpClass) {
		// Don't think this is ever supposed to happen, but…
		for (const ability of larpClass.Ability) {
			GameLARPBuildOptionAbility(Source, Target, Option, ability);
		}
	}

	// Builds the "Strip" & "Restrain" options if the target isn't in the source team
	if ((Target.Game?.LARP?.Team != Source.Game?.LARP?.Team) && (InventoryGet(Source, "ItemArms") == null)) {

		// Some actions are different based on the target current restrains
		if (GameLARPClothed(Target)) Option.push({ Name: "Strip", Odds: GameLARPGetOdds("Strip", Source, Target) });
		else if (!GameLARPCanAct(Target)) Option.push({ Name: "Tighten", Odds: GameLARPGetOdds("Tighten", Source, Target) });
		else if (!GameLARPCanWalk(Target) && !GameLARPCanTalk(Target)) Option.push({ Name: "RestrainArms", Odds: GameLARPGetOdds("RestrainArms", Source, Target) });
		else {
			if (GameLARPCanWalk(Target)) Option.push({ Name: "RestrainLegs", Odds: GameLARPGetOdds("RestrainLegs", Source, Target) });
			if (GameLARPCanTalk(Target)) Option.push({ Name: "RestrainMouth", Odds: GameLARPGetOdds("RestrainMouth", Source, Target) });
		}

	}

	// Returns all valid options
	return Option;

}

/**
 * Gets a character from the LARP game by member number
 * @param {number} MemberNumber - Member number of the character to get.
 * @returns {Character | null} - The corresponding character, if it exists.
 */
function GameLARPGetPlayer(MemberNumber) {
	for (let C = 0; C < GameLARPPlayer.length; C++)
		if (GameLARPPlayer[C].MemberNumber == MemberNumber)
			return GameLARPPlayer[C];
	return null;
}

/**
 * Processes an action for a player.
 * @param {string} Action - Action attempted.
 * @param {AssetName} ItemName - Name of the item to attempt to use.
 * @param {Character} Source - Source character of the action
 * @param {Character} Target - Character targetted by the action
 * @param {number} RNG - Random odds received for which the character's odds will be compared.
 * @returns {void} - Nothing
 */
function GameLARPProcessAction(Action, ItemName, Source, Target, RNG) {

	// Skip if the characters aren't valid
	if ((Source == null) || (Target == null)) return;

	// Gets the item description in the user language
	var ItemDesc = "N/A";
	if (ItemName != "") {
		var A;
		if ((Action == "RestrainLegs") || (Action == "Immobilize")) A = AssetGet(Target.AssetFamily, "ItemFeet", ItemName);
		if ((Action == "RestrainArms") || (Action == "Detain")) A = AssetGet(Target.AssetFamily, "ItemArms", ItemName);
		if ((Action == "RestrainMouth") || (Action == "Silence")) A = AssetGet(Target.AssetFamily, "ItemMouth", ItemName);
		if ((Action == "Dress") || (Action == "Costume")) A = AssetGet(Target.AssetFamily, "Cloth", ItemName);
		if ((A != null) && (A.Description != null)) ItemDesc = A.Description;
	}

	// If the odds are successful (0% never succeeds, 100% always succeeds)
	var Odds = GameLARPGetOdds(Action, Source, Target);
	if ((Odds >= 0.01) && ((Odds >= 1) || (Odds >= Math.round(RNG * 100) / 100))) {

		// Regular restrain actions
		ChatRoomAllowCharacterUpdate = false;
		if ((Action == "RestrainLegs") || (Action == "Immobilize")) InventoryWear(Target, ItemName, "ItemFeet", null, 6);
		if ((Action == "RestrainArms") || (Action == "Detain")) InventoryWear(Target, ItemName, "ItemArms", null, 6);
		if ((Action == "RestrainMouth") || (Action == "Silence")) InventoryWear(Target, ItemName, "ItemMouth", null, 6);
		if ((Action == "Dress") || (Action == "Costume")) InventoryWear(Target, ItemName, "Cloth");
		ChatRoomAllowCharacterUpdate = true;

		// Struggle and evasion can remove some restraints
		if (Action == "Struggle") InventoryRemove(Target, "ItemArms");
		if (Action == "Ungag") InventoryRemove(Target, "ItemMouth");
		if ((Action == "Evasion") || (Action == "Rescue")) {
			if (InventoryGet(Target, "ItemArms") != null) InventoryRemove(Target, "ItemArms");
			else InventoryRemove(Target, "ItemFeet");
		}

		// Strip / Expose removes the cloth items
		if ((Action == "Strip") || (Action == "Expose")) {
			InventoryRemove(Target, "Cloth");
			InventoryRemove(Target, "ClothLower");
			InventoryRemove(Target, "ClothAccessory");
		}

		// Publishes the success
		GameLARPAddChatLog("Option" + Action + "Success", Source, Target, ItemDesc, RNG, Odds, "#00B000");
		GameLARPProgress[GameLARPProgress.length - 1].Success = true;

	} else {

		// Publishes the failure
		GameLARPAddChatLog("Option" + Action + "Fail", Source, Target, ItemDesc, RNG, Odds, "#B00000");
		GameLARPProgress[GameLARPProgress.length - 1].Success = false;

	}

}

/**
 * Processes the LARP game clicks. This method is called from the generic OnlineGameClickCharacter function when the current game is LARP.
 * @param {Character} C - Character clicked on
 * @returns {boolean} - returns TRUE if the code handles the click
 */
function GameLARPCharacterClick(C) {

	// If it's the player turn, we allow clicking on a character to get the abilities menu
	if ((GameLARPGetStatus() == "Running") && (GameLARPPlayer[GameLARPTurnPosition].IsPlayer()) && (C.Game != null) && (C.Game.LARP != null) && (C.Game.LARP.Team != null) && (C.Game.LARP.Team != "") && (C.Game.LARP.Team != "None")) {
		GameLARPTurnFocusCharacter = C;
		GameLARPTurnFocusGroup = null;
		GameLARPOption = GameLARPBuildOption(Player, GameLARPTurnFocusCharacter);
	}

	// Flags that transaction as being handled
	return true;

}

/**
 * Builds a universal substitution array for LARP messages/options.
 * @param {Character} Source - Source character
 * @param {Character} Target - Target character
 * @param {string} [Description] - Item/team description
 * @param {number | null} [RNG] - Random number
 * @param {number | null} [Odds] - Odds number
 * @returns {CommonSubtituteSubstitution[]} - Array of placeholder substitutions
 */
function GameLARPBuildSubstitutions(Source, Target, Description, RNG, Odds) {
	/** @type {CommonSubtituteSubstitution[]} */
	const substitutions = [];

	// Source
	if (Source) {
		substitutions.push(["SourceName", Source.Name]);
		substitutions.push(["SourceNumber", `${Source.MemberNumber}`]);
		substitutions.push(...ChatRoomPronounSubstitutions(Source, "SourcePronoun", false));
	}

	// Target
	if (Target) {
		substitutions.push(["TargetName", Target.Name]);
		substitutions.push(["TargetNumber", `${Target.MemberNumber}`]);
		substitutions.push(...ChatRoomPronounSubstitutions(Target, "TargetPronoun", false));
	}

	// Other placeholders
	if (RNG != null) substitutions.push(["ActionRNG", Math.round(RNG * 100).toString()]);
	if (Odds != null) substitutions.push(["ActionOdds", Math.round(Odds * 100).toString()]);
	if (Description) {
		substitutions.push(["ItemDesc", Description]);
		substitutions.push(["TeamName", Description]);
	}

	return substitutions;
}

/**
 * Adds a LARP message to the chat log.
 * @param {string} Msg - Message tag from the dictionary
 * @param {Character} Source - Source character of the message
 * @param {Character} Target - Target character of the message
 * @param {string} Description - Item, team, or effect description
 * @param {number} RNG - The RNG roll (0–1 float)
 * @param {number} Odds - The odds required for the move to work (0–1 float)
 * @param {string} [Color] - Optional color of the message
 * @returns {void}
 */
function GameLARPAddChatLog(Msg, Source, Target, Description, RNG, Odds, Color) {

	// The first message of the game is blue
	if (GameLARPProgress.length == 0) Color = "#0000B0";

	// Get dictionary text and apply substitutions
	Msg = OnlineGameDictionaryText(Msg);
	Msg = CommonStringSubstitute(Msg, GameLARPBuildSubstitutions(Source, Target, Description, RNG, Odds));

	// Adds the message and scrolls down unless the user has scrolled up
	var div = document.createElement("div");
	div.setAttribute('class', 'ChatMessage ChatMessageServerMessage');
	div.setAttribute('data-time', ChatRoomCurrentTime());
	if ((Color != null) && (Color != "")) div.style.color = Color;
	div.textContent = Msg;
	ChatRoomAppendChat(div);
}

/**
 * Sets the new turn player and publish it in the chat room
 * @param {number} NewPlayerPosition - Position of the new player
 * @param {boolean} Ascending - Whether or not the turn is ascending
 * @param {string} Msg - Message tag to display such as TurnStart, TurnSkip and TurnNext
 * @returns {void} - Nothing
 */
function GameLARPNewTurnPublish(NewPlayerPosition, Ascending, Msg) {

	// Sets the new position and turn order, the timer is divided by 2 if the are restrained, then publish in the chat log
	GameLARPTurnPosition = NewPlayerPosition;
	GameLARPTurnAscending = Ascending;
	GameLARPTurnTimer = TimerGetTime() + (GameLARPTurnTimerDelay * (GameLARPPlayer[GameLARPTurnPosition].CanInteract() ? 1000 : 500));
	GameLARPAddChatLog(Msg, Player, GameLARPPlayer[GameLARPTurnPosition], "", 0, 0);

}

/**
 * Generates a new turn for the LARP game.
 * @param {string} Msg - Content of the turn message such as TurnNext, TurnStart or TurnSkip
 * @returns {void} - Nothing
 */
function GameLARPNewTurn(Msg) {

	// Resets the focus
	GameLARPTurnFocusCharacter = null;
	GameLARPTurnFocusGroup = null;

	// Cycles in the game player array ascending or descending and shifts the position
	if ((GameLARPTurnAscending) && (GameLARPTurnPosition < GameLARPPlayer.length - 1)) GameLARPNewTurnPublish(GameLARPTurnPosition + 1, true, Msg);
	else if ((GameLARPTurnAscending) && (GameLARPTurnPosition == GameLARPPlayer.length - 1)) GameLARPNewTurnPublish(GameLARPTurnPosition, false, Msg);
	else if ((!GameLARPTurnAscending) && (GameLARPTurnPosition > 0)) GameLARPNewTurnPublish(GameLARPTurnPosition - 1, false, Msg);
	else if ((!GameLARPTurnAscending) && (GameLARPTurnPosition == 0)) GameLARPNewTurnPublish(GameLARPTurnPosition, true, Msg);

	// Raise a notification if it's the player's turn and they're away
	if (!document.hasFocus() && GameLARPPlayer[GameLARPTurnPosition].IsPlayer()) {
		NotificationRaise(NotificationEventType.LARP);
	}
}

/**
 * Builds the full LARP player list. Someone with no team is not playing the match.
 * @returns {void} - Nothing
 */
function GameLARPBuildPlayerList() {
	GameLARPPlayer = [];
	for (const char of ChatRoomCharacter) {
		const charTeam = char.Game?.LARP?.Team ?? "";
		if (charTeam === "" || charTeam === "None") continue;
		GameLARPPlayer.push(char);
	}
}

/**
 * Each time a game is over, in victory or defeat, the player progresses toward the next class level
 * @param {number} NewProgress - The progress factor to apply
 * @returns {void} - Nothing
 */
function GameLARPLevelProgress(NewProgress) {
	if (NewProgress > 50) NewProgress = 50;

	const playerLARP = GameLARPGetData(Player);
	let levelInfo = playerLARP.Level.find(l => l.Name === playerLARP.Class);
	if (!levelInfo) {
		levelInfo = { Name: playerLARP.Class, Level: 0, Progress: 0 };
		playerLARP.Level.push(levelInfo);
	}

	if (levelInfo.Level >= 10) return;
	NewProgress = NewProgress * (12 - levelInfo.Level) * 5;
	if (levelInfo.Progress + NewProgress >= 1000) {
		levelInfo.Level++;
		levelInfo.Progress = 0;
	} else {
		levelInfo.Progress += NewProgress;
	}
}

/**
 * Returns the class level for a LARP player, based on their LARP object
 * @param {GameLARPParameters} LARP - The LARP object, coming from the Character.Game object
 * @returns {number} - The level between 0 and 10
 */
function GameLARPGetClassLevel(LARP) {
	if (LARP.Level == null) return 0;
	for (let L = 0; L < LARP.Level.length; L++)
		if ((LARP.Level[L].Name == LARP.Class) && (typeof LARP.Level[L].Level === "number"))
			if ((LARP.Level[L].Level >= 0) && (LARP.Level[L].Level <= 10))
				return LARP.Level[L].Level;
	return 0;
}

/**
 * Returns the class level progress for a LARP player, based on their LARP object
 * @param {GameLARPParameters} LARP - The LARP object, coming from the Character.Game object
 * @returns {number} - The level progress between 0 and 1000
 */
function GameLARPGetClassProgress(LARP) {
	if (LARP.Level == null) return 0;
	for (let L = 0; L < LARP.Level.length; L++)
		if ((LARP.Level[L].Name == LARP.Class) && (typeof LARP.Level[L].Progress === "number"))
			if ((LARP.Level[L].Progress >= 0) && (LARP.Level[L].Progress <= 1000))
				return LARP.Level[L].Progress;
	return 0;
}

/**
 * Moves forward in the LARP game. If there are less than 2 teams with free arms, the game is over.
 * @returns {boolean} - Returns TRUE if the game ends and runs the end scripts.
 */
function GameLARPContinue() {

	// See if there's at least 2 teams in which players have free arms, return TRUE if that's the case
	let Team = "";
	for (const char of GameLARPPlayer) {
		const larpData = GameLARPGetData(char);
		if (larpData.Team === "" || larpData.Team === "None") continue;
		if (InventoryGet(char, "ItemArms")) continue;
		if (typeof char.MemberNumber !== "number" || !OnlineGameCharacterInChatRoom(char.MemberNumber)) continue;

		if (Team == "") {
			Team = larpData.Team;
		} else if (Team !== larpData.Team) {
			return true;
		}
	}

	// If there's a winning team, we announce it and stop the game
	if (Team != "") {

		// Progresses toward the next class level
		GameLARPLevelProgress(GameLARPProgress.length);

		// Shows the winning team and updates the player status
		GameLARPAddChatLog("EndGame", Player, Player, OnlineGameDictionaryText("Team" + Team), 0, 0, "#0000B0");
		GameLARPReset();
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);

		// Calculate the reputation gained, the longer the game took, the higher it will rise the rep, times 2 if the player team won
		var RepGain = Math.round(GameLARPProgress.length / GameLARPPlayer.length * ((Player.Game?.LARP?.Team === Team) ? 0.5 : 0.25));
		if (RepGain > 10) RepGain = 10;
		if (RepGain > 0) DialogChangeReputation("LARP", RepGain);
		ChatRoomCharacterUpdate(Player);

		// If the player is one the winning team, she earns some money based on game length, split by the number of winners
		if ((Player.Game?.LARP?.Team == Team) && (GameLARPProgress.length >= 5)) {
			var PlayersInWinningTeam = 0;
			for (let C = 0; C < GameLARPPlayer.length; C++)
				if (GameLARPPlayer[C].Game?.LARP?.Team == Team)
					PlayersInWinningTeam++;
			var MoneyGain = Math.round(GameLARPPlayer.length * Math.sqrt(GameLARPProgress.length) / PlayersInWinningTeam);
			if (MoneyGain > 30) MoneyGain = 30;
			if (MoneyGain > 0) CharacterChangeMoney(Player, MoneyGain);
		}

		return false;

	} else return true;

}


/**
 * @param {unknown} data
 * @returns {data is ServerGameLARPDataStart}
 */
function GameLARPIsStartPacket(data) {
	return CommonIsObject(data)
		&& "GameProgress" in data
		&& data.GameProgress === "Start";
}

/**
 * @param {unknown} data
 * @returns {data is ServerGameLARPDataSkip}
 */
function GameLARPIsSkipPacket(data) {
	return CommonIsObject(data)
		&& "GameProgress" in data
		&& data.GameProgress === "Skip";
}

/**
 *
 * @param {unknown} data
 * @returns {data is ServerGameLARPDataAction}
 */
function GameLARPIsActionPacket(data) {
	const obj = /** @type {ServerGameLARPDataAction} */ (data);
	return CommonIsObject(obj)
		&& obj.GameProgress === "Action"
		&& typeof obj.Action === "string"
		&& CommonIsNonNegativeInteger(obj.Target)
		&& (obj.Item === undefined || typeof obj.Item === "string");
}

/**
 * Processes the LARP game messages for turns and actions.
 * @param {number} sender
 * @param {number} rng
 * @param {unknown} data - Data object containing the message data.
 * @returns {void} - Nothing
 */
function GameLARPProcess(sender, rng, data) {
	// The administrator can start the LARP game, he becomes the turn admin in the process
	if (GameLARPIsStartPacket(data)) {
		if (!ChatRoomCharacterIsAdmin(sender)) return;
		GameLARPSetStatus("Running");
		GameLARPTurnAdmin = sender;
		GameLARPTurnPosition = -1;
		GameLARPTurnAscending = true;
		GameLARPBuildPlayerList();
		GameLARPProgress = [];
		for (const char of GameLARPPlayer) {
			if (!ChatRoomCharacterIsAdmin(char)) continue;
			GameLARPTurnTimerDelay = char.Game?.LARP?.TimerDelay ?? GameLARPTimerDelay[0];
		}
		if ((typeof GameLARPTurnTimerDelay !== "number") || (GameLARPTurnTimerDelay < GameLARPTimerDelay[0]) || (GameLARPTurnTimerDelay > GameLARPTimerDelay[GameLARPTimerDelay.length - 1])) GameLARPTurnTimerDelay = GameLARPTimerDelay[0];
		GameLARPNewTurn("TurnStart");
	}

	// The turn administrator can skip turns after the delay has ran out
	if (GameLARPIsSkipPacket(data)) {
		if (GameLARPGetStatus() !== "Running" || GameLARPTurnAdmin !== sender) return;
		GameLARPProgress.push({ Sender: sender, Time: CurrentTime, RNG: rng, Data: data });
		if (GameLARPContinue()) GameLARPNewTurn("TurnSkip");
	}

	// The current turn player can trigger an action
	if (GameLARPIsActionPacket(data)) {
		if (GameLARPGetStatus() !== "Running") return;
		if (GameLARPPlayer.length === 0 || GameLARPPlayer[GameLARPTurnPosition].MemberNumber !== sender) return;
		if (typeof data.Action !== "string" || !CommonIsNonNegativeInteger(data.Target)) return;

		// Before we process it, we make sure the action is valid by checking all possible options
		const Source = GameLARPGetPlayer(sender);
		const Target = GameLARPGetPlayer(data.Target);
		if (!Source || !Target) return;

		const Options = GameLARPBuildOption(Source, Target);
		const option = Options.find(o => o.Name === data.Action);
		if (!option) return;

		GameLARPProgress.push({ Sender: sender, Time: CurrentTime, RNG: rng, Data: data });
		GameLARPProcessAction(data.Action, data.Item, Source, Target, rng);

		if (GameLARPContinue()) GameLARPNewTurn("TurnNext");
	}
}

/**
 * Resets the LARP game so a new game might be started
 * @returns {void} - Nothing
 */
function GameLARPReset() {
	GameLARPSetStatus("");
}

/**
 * Ensure all character's MagicBattle game status are the same
 */
function GameLARPLoadStatus() {
	for (const char of ChatRoomCharacter) {
		if (!ChatRoomCharacterIsAdmin(char)) continue;
		const status = (char.Game?.LARP?.Status ?? "");
		if (status === "") continue;
		GameLARPSetStatus(status);
	}
	// XXX: then we just reset it back to "" 🤯
	GameLARPReset();
}

/**
 * Draws the online game images/text needed on the characters
 * @param {Character} C - Character to draw the info for
 * @param {number} X - Position of the character the X axis
 * @param {number} Y - Position of the character the Y axis
 * @param {number} Zoom - Amount of zoom the character has (Height)
 * @returns {void} - Nothing
 */
function GameLARPDrawCharacter(C, X, Y, Zoom) {

	// LARP draws the timer if needed and the icon linked to team and class
	if (ServerPlayerIsInChatRoom()) {
		GameLARPDrawIcon(C, X + 70 * Zoom, Y + 800 * Zoom, 0.6 * Zoom);
		if ((GameLARPPlayer.length > 0) && (C.MemberNumber == GameLARPPlayer[GameLARPTurnPosition].MemberNumber) && (GameLARPGetStatus() == "Running") && (GameLARPTurnFocusCharacter == null)) {
			MainCanvas.font = CommonGetFont(72);
			var Time = Math.ceil((GameLARPTurnTimer - TimerGetTime()) / 1000);
			DrawText(((Time < 0) || (Time > GameLARPTimerDelay[GameLARPTimerDelay.length - 1])) ? OnlineGameDictionaryText("TimerNA") : Time.toString(), X + 250 * Zoom, Y + 830 * Zoom, "Red", "Black");
			MainCanvas.font = CommonGetFont(36);
		}
	}
}
