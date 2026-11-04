"use strict";
var GameMagicBattleBackground = "Sheet";
var GameMagicBattleTimerDelay = 30;
/** @type {OnlineCharacter[]} */
var GameMagicBattlePlayer = [];
var GameMagicBattleAction = "";
/** @type {null | number} */
var GameMagicBattleTurnAdmin = null;
var GameMagicBattleTurnDone = false;
/** @type {number} */
var GameMagicBattleTurnTimer = 0;
/** @type {null | OnlineCharacter} */
var GameMagicBattleFocusCharacter = null;
/** @type {{ Sender: number; Data: ServerGameMagicBattleDataAction }[]} */
var GameMagicBattleLog = [];
/** @type {{ X: number, Y: number, W: number, H: number }[]} */
var GameMagicBattleButton = [];

/**
 * Get the player's current game state
 * @param {Character} C
 * @return {GameMagicBattleParameters}
 */
function GameMagicBattleGetState(C) {
	if (C.IsPlayer() && !C.Game?.MagicBattle) {
		GameMagicBattleInitialize();
	} else {
		C.Game ??= {};
		C.Game.MagicBattle = Object.assign(C.Game.MagicBattle ?? {}, /** @type {const} */ ({
			Status: "",
			House: "NotPlaying",
			TeamType: "House",
		}));
	}
	return /** @type {GameMagicBattleParameters} */ (C.Game?.MagicBattle);
}

/**
 * Gets the current state of LARP.
 * @returns {OnlineGameStatus}
 */
function GameMagicBattleGetStatus() {
	const state = GameMagicBattleGetState(Player);
	if (["", "Running"].includes(state.Status))
		return state.Status;
	return "";
}

/**
 * Set the current state of LARP.
 * @param {OnlineGameStatus} NewStatus
 * @returns {void}
 */
function GameMagicBattleSetStatus(NewStatus) {
	if (!["", "Running"].includes(NewStatus))
		return;

	let ForceUpdate = false;
	if (Player.Game == null || Player.Game.MagicBattle == null) {
		ForceUpdate = true;
		GameMagicBattleInitialize();
	}

	if (ForceUpdate || (NewStatus !== Player.Game.MagicBattle?.Status)) {
		Player.Game ??= {};
		Player.Game.MagicBattle = GameMagicBattleGetState(Player);
		Player.Game.MagicBattle.Status = NewStatus;
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	}
}

/**
 * Checks if the character is an admin while the game is going.
 * @param {OnlineCharacter} C - Character to check for
 * @returns {boolean} -  Returns TRUE if that character is an admin/the game administrator
 */
function GameMagicBattleIsAdmin(C) {
	return ChatRoomCharacterIsAdmin(C);
}

/**
 * Draws the Magic Battle house icon of a character
 * @param {Character} C - Character for which to draw the icons
 * @param {number} X - Position on the X axis of the canvas
 * @param {number} Y - Position on the Y axis of the canvas
 * @param {number} Zoom - Zoom factor of the character
 * @returns {void} - Nothing
 */
function GameMagicBattleDrawIcon(C, X, Y, Zoom) {
	const state = GameMagicBattleGetState(C);
	if (state.House === "NotPlaying") return;

	DrawImageZoomCanvas("Icons/MagicBattle/" + state.House + ".png", MainCanvas, 0, 0, 100, 100, X, Y, 100 * Zoom, 100 * Zoom);
}

/**
 * Loads the Magic Battle game.
 * @type {ScreenLoadHandler}
 */
async function GameMagicBattleLoad() {
	GameMagicBattleInitialize();
}

function GameMagicBattleInitialize() {
	if (Player.Game == null) Player.Game = {};
	let game = Player.Game.MagicBattle;
	Player.Game.MagicBattle = {
		Status: /** @type {const} */ (""),
		House: (game && typeof game.House === "string" ? game.House : "NotPlaying"),
		TeamType: (game && ["FreeForAll", "House"].includes(game.TeamType) ? game.TeamType : "House"),
	};
}

/**
 * Returns the team setup for the online magic battle.
 * @returns {string} - "FreeForAll" or "House", depending on the team setup
 */
function GameMagicBattleGetTeamType() {

	// If the game is running, we return the setup from the game admin
	if ((GameMagicBattleGetStatus() == "Running") && (GameMagicBattleTurnAdmin != null)) {
		const admin = GameMagicBattlePlayer.find(p => p.MemberNumber === GameMagicBattleTurnAdmin);
		if (admin && admin.Game.MagicBattle?.TeamType) return admin.Game.MagicBattle.TeamType;
	}

	// When the game isn't running, the player team type is returned if admin
	if ((GameMagicBattleGetStatus() == "") && GameMagicBattleIsAdmin(Player))
		if ((Player.Game != null) && (Player.Game.MagicBattle != null) && (Player.Game.MagicBattle.TeamType != null))
			return Player.Game.MagicBattle.TeamType;

	// When the game isn't running, the first admin team type is returned
	if ((GameMagicBattleGetStatus() == "") && !GameMagicBattleIsAdmin(Player)) {
		const first = ChatRoomCharacter.find(c => GameMagicBattleIsAdmin(c) && c.Game.MagicBattle?.TeamType);
		if (first && first.Game.MagicBattle?.TeamType) return first.Game.MagicBattle?.TeamType;
	}

	// With no setup, we return "House"
	return "House";

}

/**
 * Runs and draws the Magic Battle game.
 * @returns {void} - Nothing
 */
function GameMagicBattleRun() {

	// Draw the character, text and buttons to configure the game, admins can start the game from here
	const TeamType = GameMagicBattleGetTeamType();
	const state = GameMagicBattleGetState(Player);
	DrawCharacter(Player, 50, 50, 0.9);
	DrawText(TextGet("Title"), 1200, 125, "Black", "Gray");
	if (GameMagicBattleGetStatus() == "") DrawBackNextButton(900, 218, 600, 64, TextGet("PlayType" + state.House), "White", "", () => "", () => "");
	else DrawText(TextGet("PlayType" + state.House), 1200, 250, "Black", "Gray");
	if ((GameMagicBattleGetStatus() == "") && GameMagicBattleIsAdmin(Player)) DrawBackNextButton(900, 343, 600, 64, TextGet("TeamType") + " " + TextGet(TeamType), "White", "", () => "", () => "");
	else DrawText(TextGet("TeamType") + " " + TextGet(TeamType), 1200, 375, "Black", "Gray");
	if (GameMagicBattleGetStatus() == "") DrawText(TextGet("StartCondition" + TeamType), 1200, 500, "Black", "Gray");
	else DrawText(TextGet("RunningGame"), 1200, 500, "Black", "Gray");
	if (GameMagicBattleCanLaunchGame()) DrawButton(1000, 600, 400, 65, TextGet("StartGame"), "White");
	if (GameMagicBattleIsAdmin(Player) && (GameMagicBattleGetStatus() != "")) DrawButton(1000, 600, 400, 65, TextGet("StopGame"), "White");
	GameMagicBattleDrawIcon(Player, 600, 210, 2);

	// Draw the right side buttons
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");
	if ((GameMagicBattleGetStatus() == "") && (state.House.indexOf("House") == 0) && Player.CanChangeOwnClothes()) DrawButton(1815, 190, 90, 90, "", "White", "Icons/Wardrobe.png");

}

/**
 * Runs the game from the chat room
 * @returns {void} - Nothing
 */
function GameMagicBattleRunProcess() {

	// If the player is the game admin, she sends the 30 seconds timer tick to everyone
	if ((GameMagicBattleGetStatus() == "Running") && (TimerGetTime() > GameMagicBattleTurnTimer) && (Player.MemberNumber === GameMagicBattleTurnAdmin)) {
		GameMagicBattleTurnTimer = TimerGetTime() + (GameMagicBattleTimerDelay * 1000);
		ServerSend("ChatRoomGame", { GameProgress: "Next" });
	}

}

/**
 * Handles clicks during the online game.
 * @returns {boolean} - Returns TRUE if the click was handled by this online click handler
 */
function GameMagicBattleClickProcess() {
	if (!ChatRoomData || !GameMagicBattleFocusCharacter) return false;
	let Time = (GameMagicBattleTurnTimer - TimerGetTime()) / 1000;
	if (Time >= 6)
		for (let B = 0; B < GameMagicBattleButton.length; B++)
			if (MouseIn(GameMagicBattleButton[B].X, GameMagicBattleButton[B].Y, GameMagicBattleButton[B].W, GameMagicBattleButton[B].H)) {
				MagicPuzzleSpell = MagicBattleAvailSpell[B];
				MagicPuzzleAutoExit = true;
				MagicPuzzleBackground = ChatRoomData.Background;
				MiniGameStart("MagicPuzzle", Time - 5, () => { GameMagicBattlePuzzleEnd(); });
				return true;
			}
	return false;
}

/**
 * When the magic puzzle ends, we go back to the chat room
 * @returns {SafePromise<void>}
 */
async function GameMagicBattlePuzzleEnd() {
	if (!GameMagicBattleFocusCharacter) return;
	ServerSend("ChatRoomGame", { GameProgress: "Action", Action: (MiniGameVictory ? "SpellSuccess" : "SpellFail"), Spell: MagicPuzzleSpell, Time: MagicPuzzleFinish - MagicPuzzleStart, Target: GameMagicBattleFocusCharacter.MemberNumber });
	GameMagicBattleFocusCharacter = null;
	GameMagicBattleTurnDone = true;
	await CommonSetScreen("Online", "ChatRoom");
}

/**
 * Starts a Magic Battle match.
 * @returns {void} - Nothing
 */
function GameMagicBattleStartProcess() {

	// Gives a delay in seconds, based on the player preference
	GameMagicBattleTurnTimer = TimerGetTime() + (GameMagicBattleTimerDelay * 1000);

	// Notices everyone in the room that the game starts

	const Dictionary = new DictionaryBuilder()
		.sourceCharacter(Player)
		.build();
	ServerSend("ChatRoomChat", { Content: "MagicBattleGameStart", Type: "Action" , Dictionary: Dictionary});

	// Changes the game status and exits
	ServerSend("ChatRoomGame", { GameProgress: "Start" });
	GameMagicBattleSetStatus("Running");
}

/**
 * Handles clicks in the Magic Battle chat Admin screen
 * @returns {void} - Nothing
 */
function GameMagicBattleClick() {

	const state = GameMagicBattleGetState(Player);
	// When the user exits or wants to change clothes
	if (MouseIn(1815, 75, 90, 90)) {
		GameMagicBattleExit();
		return;
	}
	if (MouseIn(1815, 190, 90, 90) && (GameMagicBattleGetStatus() == "") && (state.House.indexOf("House") == 0) && Player.CanChangeOwnClothes()) {
		MagicSchoolLaboratoryPrepareNPC(Player, /** @type {MagicSchoolHouse} */(state.House.replace("House", "")));
		ChatRoomCharacterUpdate(Player);
		return;
	}

	// When the user changes house/role
	if (MouseIn(900, 218, 600, 64) && (GameMagicBattleGetStatus() == "")) {

		// Back button
		if (MouseX < 1200) {
			if (state.House == "NotPlaying") {
				if (ReputationGet("HouseMaiestas") > 0) state.House = "HouseMaiestas";
				else if (ReputationGet("HouseVincula") > 0) state.House = "HouseVincula";
				else if (ReputationGet("HouseAmplector") > 0) state.House = "HouseAmplector";
				else if (ReputationGet("HouseCorporis") > 0) state.House = "HouseCorporis";
				else state.House = "Independent";
			} else state.House = (state.House == "Independent") ? "NotPlaying" : "Independent";
		}

		// Next button
		if (MouseX >= 1200) {
			if (state.House == "Independent") {
				if (ReputationGet("HouseMaiestas") > 0) state.House = "HouseMaiestas";
				else if (ReputationGet("HouseVincula") > 0) state.House = "HouseVincula";
				else if (ReputationGet("HouseAmplector") > 0) state.House = "HouseAmplector";
				else if (ReputationGet("HouseCorporis") > 0) state.House = "HouseCorporis";
				else state.House = "NotPlaying";
			} else state.House = (state.House == "NotPlaying") ? "Independent" : "NotPlaying";
		}
		return;
	}

	// When the user selects a new team configuration, we update that player for everyone
	if (MouseIn(900, 343, 600, 64) && (GameMagicBattleGetStatus() == "") && GameMagicBattleIsAdmin(Player)) {
		state.TeamType = (state.TeamType == "House") ? "FreeForAll" : "House";
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		return;
	}

	// If the administrator wants to start the game or end the game
	if (MouseIn(1000, 600, 400, 65) && GameMagicBattleCanLaunchGame()) {
		CommonSetScreen("Online", "ChatRoom");
		GameMagicBattleStartProcess();
		return;
	}
	if (MouseIn(1000, 600, 400, 65) && GameMagicBattleIsAdmin(Player) && (GameMagicBattleGetStatus() != "")) {
		CommonSetScreen("Online", "ChatRoom");
		ServerSend("ChatRoomGame", { GameProgress: "Stop" });
		return;
	}

}

/**
 * Triggered when the player exits the Magic Battle info screen.
 * @type {ScreenExitHandler}
 */
function GameMagicBattleExit() {

	// When the game isn't running, we allow to change the class or team
	if (GameMagicBattleGetStatus() == "") {
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		ChatRoomCharacterUpdate(Player);
	}
	CommonSetScreen("Online", "ChatRoom");

}

/**
 * Checks if a Magic Battle match can be launched. The player must be an admin and two different houses must be selected.
 * @returns {boolean} - Returns TRUE if the game can be launched
 */
function GameMagicBattleCanLaunchGame() {
	if (GameMagicBattleGetStatus() != "") return false;
	if (!GameMagicBattleIsAdmin(Player)) return false;
	const playerState = GameMagicBattleGetState(Player);
	if (playerState.TeamType != "House" && playerState.TeamType != "FreeForAll") return false;
	let House = "";
	for (const char of ChatRoomCharacter) {
		if (!char.CanTalk()) continue;
		const charState = GameMagicBattleGetState(char);
		if (charState.House === "NotPlaying") continue;
		if (House === "") {
			House = charState.House;
		} else if (House !== charState.House || charState.House === "Independent" || playerState.TeamType === "FreeForAll") {
			return true;
		}
	}
	return false;
}

/**
 * Generates a new turn for the battle.
 * @param {string} Msg - Content of the turn message such as TurnNext or TurnStart
 * @returns {void} - Nothing
 */
function GameMagicBattleNewTurn(Msg) {
	GameMagicBattleLog = [];
	GameMagicBattleTurnDone = false;
	// New turn while the minigame is still running, don't unfocus the opponent
	// as the the minigame callback needs that.
	if (MiniGameEnded) {
		GameMagicBattleFocusCharacter = null;
	}
	GameMagicBattleTurnTimer = TimerGetTime() + (GameMagicBattleTimerDelay * 1000);
	GameMagicBattleAddChatLog(Msg, Player, Player, undefined, (Msg == "TurnNext") ? "#000000" : "#0000A0");
}

/**
 * Gets a character from the Magic Battle game by member number
 * @param {number} MemberNumber - Member number of the character to get.
 * @returns {OnlineCharacter | null} - The corresponding character, if it exists.
 */
function GameMagicBattleGetPlayer(MemberNumber) {
	return GameMagicBattlePlayer.find(c => c.MemberNumber === MemberNumber) ?? null;
}

/**
 * Processes the Magic Battle game clicks. This method is called from the generic OnlineGameClickCharacter function when the current game is Magic Battle.
 * @param {OnlineCharacter} C - Character clicked on
 * @returns {boolean} - returns TRUE if the code handles the click
 */
function GameMagicBattleCharacterClick(C) {

	// If the turn is already done or the player is gagged, we skip any click
	const playerState = GameMagicBattleGetState(Player);
	if (playerState.House === "NotPlaying") return true;
	if (GameMagicBattleTurnDone || !Player.CanTalk()) return true;

	// We allow clicking on a participating room member that's not gagged
	const charState = GameMagicBattleGetState(C);
	if ((GameMagicBattleGetStatus() == "Running") && charState.House != "NotPlaying" && C.CanTalk())
		GameMagicBattleFocusCharacter = (C.MemberNumber == Player.MemberNumber) ? null : C;

	// Cannot target a player from it's own house if playing in teams by houses
	const currentState = GameMagicBattleFocusCharacter ? GameMagicBattleGetState(GameMagicBattleFocusCharacter) : null;
	if (currentState && (GameMagicBattleGetTeamType() == "House") && currentState.House !== "Independent" && currentState.House === playerState.House)
		GameMagicBattleFocusCharacter = null;

	// Gets the spells that are available on that target
	MagicBattleAvailSpell = MagicBattleGetAvailSpells(GameMagicBattleFocusCharacter);

	// Flags that transaction as being handled
	return true;

}

/**
 * Adds a game message to the chat log.
 * @param {string} Msg - Message tag
 * @param {OnlineCharacter} Source - Source character of the message
 * @param {OnlineCharacter} Target - Character targetted by the message
 * @param {ServerGameMagicBattleDataAction | null} [Data] - The data linked to the packet
 * @param {string} [Color] - Color of the message to add.
 * @returns {void} - Nothing
 */
function GameMagicBattleAddChatLog(Msg, Source, Target, Data, Color) {

	// Gets the message from the dictionary
	Msg = OnlineGameDictionaryText(Msg);
	Msg = Msg.replace("SourceName", Source.Name);
	Msg = Msg.replace("SourceNumber", Source.MemberNumber.toString());
	Msg = Msg.replace("TargetName", Target.Name);
	Msg = Msg.replace("TargetNumber", Target.MemberNumber.toString());
	if ((Data != null) && (Data.Spell != null)) Msg = Msg.replace("SpellDesc", OnlineGameDictionaryText("Spell" + Data.Spell.toString() + "Name"));
	if ((Data != null) && (Data.Time != null)) Msg = Msg.replace("SpellTime", (Data.Time / 1000).toString());

	// Adds the message and scrolls down unless the user has scrolled up
	const div = document.createElement("div");
	div.setAttribute('class', 'ChatMessage ChatMessageServerMessage');
	div.setAttribute('data-time', ChatRoomCurrentTime());
	if ((Color != null) && (Color != "")) div.style.color = Color;
	div.innerText = Msg;
	ChatRoomAppendChat(div);
}

/**
 * Builds the game player list.
 * @returns {void} - Nothing
 */
function GameMagicBattleBuildPlayerList() {
	GameMagicBattlePlayer = ChatRoomCharacter.filter(c => GameMagicBattleGetState(c).House !== "NotPlaying");
}

/**
 * Calculates the turn winner and applies the consequences.
 * @returns {OnlineGameStatus}
 */
function GameMagicBattleCalculateTurnWinner() {

	// Fetches the best time and the round winner
	let WinTime = 999999;
	/** @type {number | null} */
	let WinNum = null;
	let TieRound = false;
	for (let L = 0; L < GameMagicBattleLog.length; L++)
		if ((GameMagicBattleLog[L] != null) && (GameMagicBattleLog[L].Data != null) && (GameMagicBattleLog[L].Data.Action == "SpellSuccess"))
			if ((GameMagicBattleLog[L].Data.Spell != null) && (GameMagicBattleLog[L].Data.Time != null) && (GameMagicBattleLog[L].Data.Time <= WinTime)) {
				if (WinTime == GameMagicBattleLog[L].Data.Time) TieRound = true;
				WinTime = GameMagicBattleLog[L].Data.Time;
				WinNum = L;
			}

	// If there's no winner, we show a chat log, if there's one, we apply the effects on the loser
	if (WinNum == null) {
		GameMagicBattleAddChatLog("NoWinner", Player, Player, null, "#000000");
	} else if (TieRound) {
		GameMagicBattleAddChatLog("TieRound", Player, Player, null, "#000000");
	} else {
		let Source = GameMagicBattleGetPlayer(GameMagicBattleLog[WinNum].Sender);
		let Target = GameMagicBattleGetPlayer(GameMagicBattleLog[WinNum].Data.Target);
		if ((Source != null) && (Target != null)) {
			GameMagicBattleAddChatLog("RoundWinner", Source, Target, GameMagicBattleLog[WinNum].Data, "#000000");
			MagicSpellEffect(Target, GameMagicBattleLog[WinNum].Data.Spell);
			if (Target.MemberNumber == Player.MemberNumber) ChatRoomCharacterUpdate(Player);
		}
	}

	// Checks if there is a winning team/player, based on the team type setup
	let TeamType = GameMagicBattleGetTeamType();
	let House = "";
	let HouseCount = 0;
	for (const char of GameMagicBattlePlayer) {
		if (!char.CanTalk()) continue;
		const charState = GameMagicBattleGetState(char);
		if (House == "") {
			House = charState.House;
			HouseCount++;
		} else if (charState.House !== House || charState.House == "Independent" || TeamType == "FreeForAll") {
			HouseCount++;
		}
	}

	// If there's a winner, we announce it, if the player was representing a house, she can rain reputation
	if (HouseCount <= 1) {
		GameMagicBattleAddChatLog("GameOver", Player, Player, null, "#0000A0");
		GameMagicBattleSetStatus("");
		if (Player.CanTalk() && (Player.Game != null) && (Player.Game.MagicBattle != null) && (Player.Game.MagicBattle.House != null) && (Player.Game.MagicBattle.House.indexOf("House") == 0))
			DialogChangeReputation(/** @type {ReputationType} */(Player.Game.MagicBattle.House), 3);
	}

	// Returns the game status for the next round
	return GameMagicBattleGetStatus();
}

/**
 *
 * @param {unknown} data
 * @returns {data is ServerGameMagicBattleDataStart}
 */
function GameMagicBattleIsStartPacket(data) {
	const obj = /** @type {ServerGameMagicBattleDataStart} */ (data);
	return CommonIsObject(obj)
		&& obj.GameProgress === "Start";
}

/**
 *
 * @param {unknown} data
 * @returns {data is ServerGameMagicBattleDataStop}
 */
function GameMagicBattleIsStopPacket(data) {
	const obj = /** @type {ServerGameMagicBattleDataStop} */ (data);
	return CommonIsObject(obj)
		&& obj.GameProgress === "Stop";
}

/**
 *
 * @param {unknown} data
 * @returns {data is ServerGameMagicBattleDataNext}
 */
function GameMagicBattleIsNextPacket(data) {
	const obj = /** @type {ServerGameMagicBattleDataNext} */ (data);
	return CommonIsObject(obj)
		&& obj.GameProgress === "Next";
}

/**
 *
 * @param {unknown} data
 * @returns {data is ServerGameMagicBattleDataAction}
 */
function GameMagicBattleIsActionPacket(data) {
	const obj = /** @type {ServerGameMagicBattleDataAction} */ (data);
	return CommonIsObject(obj)
		&& obj.GameProgress === "Action"
		&& typeof obj.Action === "string"
		&& CommonIsNonNegativeInteger(obj.Target)
		&& CommonIsNonNegativeInteger(obj.Spell)
		&& CommonIsNonNegativeInteger(obj.Time);
}

/**
 * Processes the Magic Battle game messages for turns and actions.
 * @param {number} sender
 * @param {unknown} data - Data object containing the message data.
 * @returns {void} - Nothing
 */
function GameMagicBattleProcess(sender, data) {

	// An administrator can start the Magic Battle game, he becomes the turn admin in the process
	if (GameMagicBattleIsStartPacket(data)) {
		if (!ChatRoomCharacterIsAdmin(sender)) return;
		GameMagicBattleSetStatus("Running");
		GameMagicBattleTurnAdmin = sender;
		GameMagicBattleBuildPlayerList();
		GameMagicBattleNewTurn("GameStart" + GameMagicBattleGetTeamType());
	}

	// An administrator can stop the game
	if (GameMagicBattleIsStopPacket(data)) {
		if (!ChatRoomCharacterIsAdmin(sender)) return;
		let Source = GameMagicBattleGetPlayer(sender);
		if (Source != null) {
			GameMagicBattleAddChatLog("GameStop", Source, Source, null, "#0000A0");
			GameMagicBattleSetStatus("");
		}
	}

	// When the turn administrator sends the message to end the turn, we calculate the outcome
	if (GameMagicBattleIsNextPacket(data)) {
		if (GameMagicBattleGetStatus() !== "Running" || GameMagicBattleTurnAdmin !== sender) return;
		if (GameMagicBattleCalculateTurnWinner() == "Running")
			GameMagicBattleNewTurn("TurnNext");
	}

	// The current turn player can trigger an action, a spell cast by a user
	if (GameMagicBattleIsActionPacket(data)) {
		if (GameMagicBattleGetStatus() !== "Running") return;

		// Keep the data in the game log for that turn
		GameMagicBattleLog.push({ Sender: sender, Data: data });

		// Before we process it, we make sure the action is valid by checking all possible options
		let Source = GameMagicBattleGetPlayer(sender);
		let Target = GameMagicBattleGetPlayer(data.Target);
		if (!Source || !Target) return;
		GameMagicBattleAddChatLog(data.Action, Source, Target, data, (data.Action == "SpellFail" ? "#A00000" : "#00A000"));
	}
}

/**
 * Resets the Magic Battle game so a new game might be started
 * @returns {void} - Nothing
 */
function GameMagicBattleReset() {
	GameMagicBattleSetStatus("");
}

/**
 * Ensure all character's MagicBattle game status are the same
 */
function GameMagicBattleLoadStatus() {
	for (const char of ChatRoomCharacter) {
		if (!GameMagicBattleIsAdmin(char)) continue;
		const charState = GameMagicBattleGetState(char);
		if (charState.Status == "") continue;
		GameMagicBattleSetStatus(charState.Status);
		return;
	}
	GameMagicBattleReset();
}

/**
 * Draws the online game images/text needed on the characters
 * @param {Character} C - Character to draw the info for
 * @param {number} X - Position of the character the X axis
 * @param {number} Y - Position of the character the Y axis
 * @param {number} Zoom - Amount of zoom the character has (Height)
 * @returns {void} - Nothing
 */
function GameMagicBattleDrawCharacter(C, X, Y, Zoom) {
	// Magic battle draws the timer and the spell buttons
	if (ServerPlayerIsInChatRoom()) {
		GameMagicBattleDrawIcon(C, X + 70 * Zoom, Y + 800 * Zoom, 0.6 * Zoom);
		if (Player.CanTalk() && (GameMagicBattleGetStatus() == "Running")) {
			if (C.MemberNumber == Player.MemberNumber) {
				MainCanvas.font = CommonGetFont(72);
				const Time = Math.ceil((GameMagicBattleTurnTimer - TimerGetTime()) / 1000);
				let Color = "#00FF00";
				if (Time <= 15) Color = "#FFFF00";
				if (Time <= 6) Color = "#FF0000";
				DrawText(((Time < 0) || (Time > GameMagicBattleTimerDelay)) ? OnlineGameDictionaryText("TimerNA") : Time.toString(), X + 250 * Zoom, Y + 830 * Zoom, Color, "Black");
				MainCanvas.font = CommonGetFont(36);
			}
			if ((GameMagicBattleFocusCharacter != null) && (C.MemberNumber == GameMagicBattleFocusCharacter.MemberNumber) && (GameMagicBattleGetStatus() == "Running")) {
				GameMagicBattleButton = [];
				for (let S = 0; S < MagicBattleAvailSpell.length; S++) {
					let B = { X: X + 50 * Zoom, Y: Y + (400 + (S * 100)) * Zoom, W: 400 * Zoom, H: 60 * Zoom };
					GameMagicBattleButton.push(B);
					DrawButton(B.X, B.Y, B.W, B.H, OnlineGameDictionaryText("Spell" + MagicBattleAvailSpell[S].toString() + "Name"), "White");
				}
			}
		}
	}
}
