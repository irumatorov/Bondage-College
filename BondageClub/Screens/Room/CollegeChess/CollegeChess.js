"use strict";
var CollegeChessBackground = "CollegeClass1";
/** @type {NPCCharacter} */
var CollegeChessOpponent = /** @type {never} */ (null);
var CollegeChessDifficulty = 0;
var CollegeChessBet = "";
/** @type {null | Item[]} */
var CollegeChessPlayerAppearance = null;
/** @type {null | Item[]} */
var CollegeChessOpponentAppearance = null;

// Quick functions for player interactions with the chess opponent
function CollegeChessCanStripPlayer() { return !CharacterIsNaked(Player); }
function CollegeChessCanStripOpponent() { return !CharacterIsNaked(CollegeChessOpponent); }
function CollegeChessCanMakeLove() { return (CharacterIsNaked(Player) && CharacterIsNaked(CollegeChessOpponent) && !Player.IsChaste()); }

/**
 * Loads the college chest screen by generating the opponent.
 * @type {ScreenLoadHandler}
 */
async function CollegeChessLoad() {
	if (CollegeChessOpponent == null) {
		CollegeChessOpponent = CharacterLoadNPC("NPC_CollegeChess_Opponent");
		CollegeChessOpponent.AllowItem = false;
		CollegeEntranceWearStudentClothes(CollegeChessOpponent);
		CollegeChessOpponentAppearance = CollegeChessOpponent.Appearance.slice(0);
	}
	if (CollegeChessPlayerAppearance == null) CollegeChessPlayerAppearance = Player.Appearance.slice(0);
}

/**
 * Runs and draws the college chess screen.  Shows the player and the opponent.
 * @returns {void} - Nothing
 */
function CollegeChessRun() {
	DrawCharacter(Player, 500, 0, 1);
	DrawCharacter(CollegeChessOpponent, 1000, 0, 1);
	DrawButton(1885, 25, 90, 90, "", Player.CanWalk() ? "White" : "Pink", "Icons/Exit.png", TextGet("Exit"));
	DrawButton(1885, 145, 90, 90, "", "White", "Icons/Character.png", TextGet("Profile"));
}

/**
 * Handles clicks in the college chess court screen
 * @returns {void} - Nothing
 */
function CollegeChessClick() {
	if (MouseIn(1000, 0, 500, 1000)) CharacterSetCurrent(CollegeChessOpponent);
	if (MouseIn(1885, 25, 90, 90) && Player.CanWalk()) CommonSetScreen("Room", "CollegeEntrance");
	if (MouseIn(1885, 145, 90, 90)) InformationSheetLoadCharacter(Player);
}

/**
 * Starts the chess mini game on the given difficulty.
 * @param {number} Difficulty - Difficulty factor of the minigame, changes the depth of the chess script
 * @param {string} Bet - The type of bet that will go on the game
 * @returns {void} - Nothing
 */
function CollegeChessGameStart(Difficulty, Bet) {
	CollegeChessDifficulty = Difficulty;
	CollegeChessBet = Bet;
	if (Bet == "Money") CharacterChangeMoney(Player, CollegeChessDifficulty * -10);
	const playerStarts = Math.random() < 0.5;
	ChessCharacterWhite = playerStarts ? Player : CollegeChessOpponent;
	ChessCharacterBlack = playerStarts ? CollegeChessOpponent : Player;
	MiniGameStart("Chess", CollegeChessDifficulty, () => { CollegeChessGameEnd(); });
	document.addEventListener("chessOnMove", CollegeChessGameProgress);
}

/**
 * In strip or bondage chess, a player can lose one piece of cloth
 * @param {Character} C
 * @returns {void} - Nothing, the returns are quick exit short cuts
 */
function CollegeChessStrip(C) {
	InventoryRemove(C, ["Shoes", "Socks", "Cloth", "ClothLower", "Bra", "Panties"]);
}

/**
 * In bondage chess, a player can get restrained progressively
 * @param {Character} C
 * @returns {void} - Nothing, the returns are quick exit short cuts
 */
function CollegeChessRestrain(C) {
	if ((InventoryGet(C, "ItemLegs") == null) && !InventoryGroupIsBlocked(C, "ItemLegs")) InventoryWearRandom(C, "ItemLegs");
	else if ((InventoryGet(C, "ItemFeet") == null) && !InventoryGroupIsBlocked(C, "ItemFeet")) InventoryWearRandom(C, "ItemFeet");
	else if ((InventoryGet(C, "ItemNeck") == null) && !InventoryGroupIsBlocked(C, "ItemNeck")) InventoryWearRandom(C, "ItemNeck");
	else if (InventoryGet(C, "Cloth") != null || InventoryGet(C, "ClothLower") != null) return;
	else if ((InventoryGet(C, "ItemTorso") == null) && !InventoryGroupIsBlocked(C, "ItemTorso")) InventoryWearRandom(C, "ItemTorso");
	else if ((InventoryGet(C, "ItemBreast") == null) && !InventoryGroupIsBlocked(C, "ItemBreast")) InventoryWearRandom(C, "ItemBreast");
	else if ((InventoryGet(C, "ItemPelvis") == null) && !InventoryGroupIsBlocked(C, "ItemPelvis")) InventoryWearRandom(C, "ItemPelvis");
}

/**
 * Called from the chess game to see if we must apply changes (strip or restrain) any opponent
 * @returns {void} - Nothing
 */
function CollegeChessGameProgress() {
	if ((CollegeChessBet != "Strip") && (CollegeChessBet != "Bondage")) return;
	if (!MiniGameChessGame || MiniGameChessGame.board() == null) return;
	if (MiniGameChessGame.in_checkmate() && (MiniGameChessGame.turn() == "b") && (CollegeChessBet == "Strip")) return CharacterNaked(ChessCharacterBlack);
	if (MiniGameChessGame.in_checkmate() && (MiniGameChessGame.turn() == "w") && (CollegeChessBet == "Strip")) return CharacterNaked(ChessCharacterWhite);
	if (MiniGameChessGame.in_checkmate() && (MiniGameChessGame.turn() == "b") && (CollegeChessBet == "Bondage")) {
		InventoryWearRandom(ChessCharacterBlack, "ItemArms", 5);
		return;
	}
	if (MiniGameChessGame.in_checkmate() && (MiniGameChessGame.turn() == "w") && (CollegeChessBet == "Bondage")) {
		InventoryWearRandom(ChessCharacterWhite, "ItemArms", 5);
		return;
	}
	let MinorWhite = 0;
	let MajorWhite = 0;
	let MinorBlack = 0;
	let MajorBlack = 0;
	let Board = MiniGameChessGame.board();
	for (let X = 0; X < Board.length; X++)
		for (let Y = 0; Y < Board[X].length; Y++)
			if (Board[X][Y] != null) {
				if ((Board[X][Y].color == "b") && (Board[X][Y].type == "p")) MinorWhite++;
				if ((Board[X][Y].color == "b") && (Board[X][Y].type != "p")) MajorWhite++;
				if ((Board[X][Y].color == "w") && (Board[X][Y].type == "p")) MinorBlack++;
				if ((Board[X][Y].color == "w") && (Board[X][Y].type != "p")) MajorBlack++;
			}
	if ((ChessMinorPieceWhite > MinorWhite) && (CollegeChessBet == "Bondage")) CollegeChessStrip(ChessCharacterBlack);
	if ((ChessMinorPieceBlack > MinorBlack) && (CollegeChessBet == "Bondage")) CollegeChessStrip(ChessCharacterWhite);
	if ((ChessMajorPieceWhite > MajorWhite) && (CollegeChessBet == "Strip")) CollegeChessStrip(ChessCharacterBlack);
	if ((ChessMajorPieceBlack > MajorBlack) && (CollegeChessBet == "Strip")) CollegeChessStrip(ChessCharacterWhite);
	if ((ChessMajorPieceWhite > MajorWhite) && (CollegeChessBet == "Bondage")) CollegeChessRestrain(ChessCharacterBlack);
	if ((ChessMajorPieceBlack > MajorBlack) && (CollegeChessBet == "Bondage")) CollegeChessRestrain(ChessCharacterWhite);
	ChessMinorPieceWhite = MinorWhite;
	ChessMajorPieceWhite = MajorWhite;
	ChessMinorPieceBlack = MinorBlack;
	ChessMajorPieceBlack = MajorBlack;
}

/**
 * Called from the chess game when the player concedes, the AI never concedes
 * @returns {void} - Nothing
 */
function CollegeChessGameConcede() {
	if (CollegeChessBet == "Strip") CharacterNaked(Player);
	if (CollegeChessBet == "Bondage") InventoryWearRandom(Player, "ItemArms", 5);
}

/**
 * Triggered when the chess game ends.
 * @returns {SafePromise<void>}
 */
async function CollegeChessGameEnd() {
	await CommonSetScreen("Room", "CollegeChess");
	if ((CollegeChessBet == "Money") && (ChessEndStatus == "Draw")) CharacterChangeMoney(Player, CollegeChessDifficulty * 10);
	if ((CollegeChessBet == "Money") && (ChessEndStatus == "Victory")) CharacterChangeMoney(Player, CollegeChessDifficulty * 20);
	if (((CollegeChessBet == "Bondage") || (CollegeChessBet == "Strip")) && (ChessEndStatus == "Draw")) CollegeChessRestoreAppearance();
	CollegeChessOpponent.Stage = "Result" + ChessEndStatus + CollegeChessBet;
	CollegeChessOpponent.CurrentDialog = DialogFind(CollegeChessOpponent, "Intro" + ChessEndStatus + CollegeChessBet);
	CharacterSetCurrent(CollegeChessOpponent);
	document.removeEventListener("chessOnMove", CollegeChessGameProgress);
}

/**
 * When both the player and the opponent should dress back up, we restore the backup appearance
 * @returns {void} - Nothing
 */
function CollegeChessRestoreAppearance() {
	CollegeChessOpponent.Appearance = CollegeChessOpponentAppearance?.slice(0) ?? [];
	CharacterRefresh(CollegeChessOpponent);
	Player.Appearance = CollegeChessPlayerAppearance?.slice(0) ?? [];
	CharacterRefresh(Player, true);
	CollegeChessOpponent.AllowItem = false;
}

/**
 * A few activities can trigger a medium blush for the opponent
 * @returns {void} - Nothing
 */
function CollegeChessOpponentBlush() {
	CharacterSetFacialExpression(CollegeChessOpponent, "Blush", "Medium", 10);
}

/**
 * The player can be restrained by the opponent after losing a bondage chess game
 * @returns {void} - Nothing
 */
function CollegeChessPlayerFullBondage() {
	CharacterRelease(CollegeChessOpponent);
	CharacterRelease(Player);
	CharacterNaked(Player);
	CharacterFullRandomRestrain(Player, "ALL");
	InventoryWearRandom(Player, "ItemTorso");
	InventoryRemove(Player, "ItemHead");
	InventoryWearRandom(Player, "ItemMouth");
}
