"use strict";
var KidnapVictory = false;
var KidnapSurrendered = false;
var KidnapDifficulty = 0;
var KidnapBackground = "KidnapLeague";
/** @type {null | ((victory: boolean, surrender: boolean) => void)} */
var KidnapReturnCallback = null;
/** @type {null | Character} */
var KidnapOpponent = null;
/** @type {null | Item} */
var KidnapPlayerCloth = null;
/** @type {null | Item} */
var KidnapPlayerClothAccessory = null;
/** @type {null | Item} */
var KidnapPlayerClothLower = null;
/** @type {null | Item} */
var KidnapOpponentCloth = null;
/** @type {null | Item} */
var KidnapOpponentClothAccessory = null;
/** @type {null | Item} */
var KidnapOpponentClothLower = null;
var KidnapTimer = 0;
/** @type {KidnapModeType | null} */
var KidnapMode = null;
var KidnapDialog = "";
var KidnapPlayerMove = 0;
var KidnapOpponentMove = 0;
var KidnapPlayerDamage = 0;
var KidnapOpponentDamage = 0;
var KidnapResultPlayer = "test";
var KidnapResultOpponent = "test";
var KidnapResultUpperHand = "";
/** @type {null | Character} */
var KidnapUpperHandVictim = null;
var KidnapUpperHandSelection = 0;
var KidnapMoveType = ["BruteForce", "Domination", "Sneakiness", "Meditation"];
var KidnapUpperHandMoveType = /** @type {const} */ (["Cloth", "ItemMouth", "ItemFeet", "UndoCloth", "UndoItemMouth", "UndoItemFeet", "Mercy"]);
/** @type { [number, number, number, number][] } */
var KidnapMoveMap = [
	[1, 2, 0, 2], // BruteForce
	[0, 1, 2, 2], // Domination
	[2, 0, 1, 2], // Sneakiness
	[0, 0, 0, 0] // Meditation
];
var KidnapRPS = ["Rock", "Scissors", "Paper"];

/**
 * Generates the kidnap stats for the given character, factoring in any bonus it might have.
 * @param {Character} C - The character for which to generate the stats for.
 * @param {number} Bonus - The possible stat bonus a character has
 * @returns {void} - Nothing
 */
function KidnapLoadStats(C, Bonus) {
	let Pandora = C.CharacterID.includes("Pandora");
	if (C.IsPlayer())
		C.KidnapStat = [
			6 + CharacterGetBonus(C, "Kidnap" + KidnapMoveType[0]) + ((Pandora && InfiltrationPerksActive("Strength")) ? 2 : 0),
			6 + CharacterGetBonus(C, "Kidnap" + KidnapMoveType[1]) + ((Pandora && InfiltrationPerksActive("Charisma")) ? 2 : 0),
			6 + CharacterGetBonus(C, "Kidnap" + KidnapMoveType[2]) + ((Pandora && InfiltrationPerksActive("Agility")) ? 2 : 0),
			-1];
	else
		C.KidnapStat = [6 + Bonus, 6 + Bonus, 6 + Bonus, -1];
}

/**
 * Builds a deck of kidnap cards for the character, the deck contains 7 random cards and must contain at least 1 card of each type
 * @param {Character} C - The character for which to generate the cards
 * @returns {void} - Nothing
 */
function KidnapBuildCards(C) {
	let MoveTypeCount = [0, 0, 0];
	while ((MoveTypeCount[0] == 0) || (MoveTypeCount[1] == 0) || (MoveTypeCount[2] == 0)) {
		C.KidnapCard = [];
		MoveTypeCount = [0, 0, 0];
		while (C.KidnapCard.length < 7) {
			let MoveType = Math.floor(Math.random() * 3);
			MoveTypeCount[MoveType]++;
			C.KidnapCard.push({
				Move: MoveType,
				Value: Math.floor(Math.random() * (C.KidnapStat?.[MoveType] ?? 0)) + 2,
			});
		}
	}
	C.KidnapCard?.sort((a, b) => (a.Value ?? 0 > b.Value) ? 1 : -1);
	C.KidnapCard?.sort((a, b) => (a.Move > b.Move) ? 1 : -1);
	C.KidnapCard?.push({ Move: 3, Value: 0 });
}

/**
 * Builds the inventory items that are available when kidnapping
 * @returns {void} - Nothing
 */
function KidnapInventoryBuild() {

	// Loop in the player inventory for that group for items that can be worn, is enable and is allowed for random events
	DialogInventory = [];
	if (KidnapOpponent?.FocusGroup != null) {
		for (const item of Player.Inventory) {
			if (item.Asset.Group.Name !== KidnapOpponent.FocusGroup.Name) continue;
			if (!item.Asset.Enable || !item.Asset.Wear || !item.Asset.Random) continue;
			DialogInventoryAdd(KidnapOpponent, item, false);
		}
	}
	DialogInventorySort();

}

/**
 * Sets the current battle status and its related timer
 * @param {KidnapModeType} NewMode - New mode for the battle
 * @returns {void} - Nothing
 */
function KidnapSetMode(NewMode) {
	if (!KidnapOpponent) return;
	// Removes the focus group if not selecting an item
	if (NewMode != "SelectItem") KidnapOpponent.FocusGroup = null;

	// If we must enter in Upper Hand mode
	if (KidnapMode == "UpperHand") KidnapUpperHandVictim = null;
	if ((NewMode == "SelectMove") && (KidnapUpperHandVictim != null)) NewMode = "UpperHand";
	if (NewMode == "UpperHand" && KidnapUpperHandVictim?.IsPlayer()) KidnapAIMoveUpperHand();

	// If we must enter the sudden death mode
	if (NewMode == "SelectMove" && (Player.KidnapWillpower ?? 0) <= 0 && (KidnapOpponent.KidnapWillpower ?? 0) <= 0) {
		Player.KidnapWillpower = 1;
		KidnapOpponent.KidnapWillpower = 1;
		NewMode = "SuddenDeath";
	}

	// If we must end the mini game in defeat
	if (NewMode == "SelectMove" && (Player.KidnapWillpower ?? 0) <= 0) {
		InventoryWearRandom(Player, "ItemArms", KidnapDifficulty);
		NewMode = "End";
	}

	// If we must end the mini game in victory, one last item can be equipped
	if (NewMode == "SelectMove" && (KidnapOpponent.KidnapWillpower ?? 0) <= 0) {
		if (!KidnapVictory) {
			KidnapOpponent.FocusGroup = AssetGroupGet("Female3DCG", "ItemArms");
			KidnapInventoryBuild();
			NewMode = (KidnapOpponent.FocusGroup != null) ? "SelectItem" : "End";
			// Dress player and remove restraints
			if (!InventoryGet(Player, "Cloth") && KidnapPlayerCloth)
				InventoryWear(Player, KidnapPlayerCloth.Asset.Name, "Cloth", KidnapPlayerCloth.Color);
			if (!InventoryGet(Player, "ClothAccessory") && KidnapPlayerClothAccessory)
				InventoryWear(Player, KidnapPlayerClothAccessory.Asset.Name, "ClothAccessory", KidnapPlayerClothAccessory.Color);
			if (!InventoryGet(Player, "ClothLower") && KidnapPlayerClothLower)
				InventoryWear(Player, KidnapPlayerClothLower.Asset.Name, "ClothLower", KidnapPlayerClothLower.Color);
			const feet = InventoryGet(Player, 'ItemFeet');
			if (feet && !InventoryItemHasEffect(feet, "Lock", true))
				InventoryRemove(Player, 'ItemFeet');
			const mouth = InventoryGet(Player, 'ItemMouth');
			if (mouth && !InventoryItemHasEffect(mouth, "Lock", true))
				InventoryRemove(Player, 'ItemMouth');
			KidnapVictory = true;
		} else NewMode = "End";
	}

	// Sets the mode and timer
	KidnapMode = NewMode;
	KidnapTimer = CommonTime() + (NewMode == "Intro" || NewMode == "SuddenDeath" || NewMode == "End" ? 5000 : 15000);

}

/**
 * Generates a move value for the NPC based on the best possible options
 * @returns {number} - Returns the move type
 */
function KidnapAIMove() {
	if (!KidnapOpponent) return 0;
	// Builds a value for each moves and puts that value in an array
	const cards = KidnapOpponent.KidnapCard ?? [];
	const playerCards = Player.KidnapCard ?? [];
	let MoveOdds = [];
	for (let M = 0; M < cards.length; M++) {
		let Value = 10;
		if (cards[M].Move != 3)
			for (let P = 0; P < playerCards.length; P++) {
				let PlaEff = Math.round(playerCards[P].Value / (KidnapMoveEffective(Player, playerCards[P].Move) ? 1 : 2));
				let OppEff = Math.round(cards[M].Value / (KidnapMoveEffective(KidnapOpponent, cards[M].Move) ? 1 : 2));
				if (KidnapMoveMap[cards[M].Move][playerCards[P].Move] == 0) Value = Value - PlaEff;
				if (KidnapMoveMap[cards[M].Move][playerCards[P].Move] == 1) Value = Value + OppEff - PlaEff;
				if (KidnapMoveMap[cards[M].Move][playerCards[P].Move] == 2) Value = Value + OppEff;
			}
		else
			Value = (6 - cards.length) * (playerCards.length + 2);
		if (Value < 0) Value = 0;
		MoveOdds.push(Value);
	}

	// Builds the total, if it's zero, we return a random move
	let Total = 0;
	for (let M = 0; M < MoveOdds.length; M++)
		Total = Total + MoveOdds[M];
	if (Total <= 0) return Math.floor(Math.random() * cards.length);

	// Picks a random position in the best values, the higher the value, the higher the chance it will get picked
	let Pos = Math.floor(Math.random() * Total);
	let RunningTotal = 0;
	for (let M = 0; M < MoveOdds.length; M++) {
		if ((Pos >= RunningTotal) && (Pos <= RunningTotal + MoveOdds[M]))
			return M;
		RunningTotal = RunningTotal + MoveOdds[M];
	}

	// No move found, we go full random
	return Math.floor(Math.random() * cards.length);

}

/**
 * Validates or checks if a given upper hand move type is available.
 * @param {number} MoveType - The type of move to check for or perform
 * @param {boolean} DoMove - Whether or not the move is being performed
 * @returns {boolean} - Returns TRUE if the upper hand move type is available
 */
function KidnapUpperHandMoveAvailable(MoveType, DoMove) {

	// Mercy is always available
	let MoveName = KidnapUpperHandMoveType[MoveType];
	if (MoveName == "Mercy") return true;

	// If we need to check to strip the opponent
	if (MoveName == "Cloth" && KidnapUpperHandVictim && InventoryGet(KidnapUpperHandVictim, "Cloth")) {
		if (DoMove) {
			InventoryRemove(KidnapUpperHandVictim, "Cloth");
			InventoryRemove(KidnapUpperHandVictim, "ClothLower");
			InventoryRemove(KidnapUpperHandVictim, "ClothAccessory");
		}
		return true;
	}

	// If we need to check to apply a restrain
	if ((MoveName === "ItemFeet" || MoveName == "ItemMouth") && KidnapUpperHandVictim && !InventoryGet(KidnapUpperHandVictim, MoveName)) {
		if (DoMove) InventoryWearRandom(KidnapUpperHandVictim, MoveName, (KidnapUpperHandVictim.IsPlayer()) ? KidnapDifficulty : 0);
		return true;
	}

	// If we need to check to dress back
	let C = (KidnapUpperHandVictim?.IsPlayer()) ? KidnapOpponent : Player;
	let Cloth = (KidnapUpperHandVictim?.IsPlayer()) ? KidnapOpponentCloth : KidnapPlayerCloth;
	let ClothAccessory = (KidnapUpperHandVictim?.IsPlayer()) ? KidnapOpponentClothAccessory : KidnapPlayerClothAccessory;
	let ClothLower = (KidnapUpperHandVictim?.IsPlayer()) ? KidnapOpponentClothLower : KidnapPlayerClothLower;
	if (MoveName === "UndoCloth" && C && !InventoryGet(C, "Cloth") && Cloth) {
		if (DoMove) InventoryWear(C, Cloth.Asset.Name, "Cloth", Cloth.Color);
		if (DoMove && (ClothAccessory != null)) InventoryWear(C, ClothAccessory.Asset.Name, "ClothAccessory", ClothAccessory.Color);
		if (DoMove && (ClothLower != null)) InventoryWear(C, ClothLower.Asset.Name, "ClothLower", ClothLower.Color);
		return true;
	}

	// If we need to check to remove the restrain
	if ((MoveName === "UndoItemFeet" || MoveName === "UndoItemMouth") && C) {
		const groupName = /** @type {AssetGroupName} */(MoveName.replace("Undo", ""));
		let I = InventoryGet(C, groupName);
		if (I && (!C.IsPlayer() || !InventoryItemHasEffect(I, "Lock", true))) {
			if (DoMove) InventoryRemove(C, groupName);
			return true;
		}
	}

	// Invalid move
	return false;

}

/**
 * Sets a random upper hand move for the NPC to use
 * @returns {void} - Nothing
 */
function KidnapAIMoveUpperHand() {
	var Try = 0;
	var MoveDone = false;
	while ((Try < 100) && (MoveDone == false)) {
		KidnapUpperHandSelection = Math.floor(Math.random() * (KidnapUpperHandMoveType.length - 1));
		MoveDone = KidnapUpperHandMoveAvailable(KidnapUpperHandSelection, true);
		Try++;
	}
	if (MoveDone == false) KidnapUpperHandSelection = KidnapUpperHandMoveType.indexOf("Mercy");
}

/**
 * Draws the move text (left side) and the effect (right side)
 * @returns {void} - Nothing
 */
function KidnapShowMove() {
	if (!KidnapOpponent) return;
	DrawTextWrap(TextGet(KidnapDialog + "Action"), 10, 150, 580, 200, "white");
	DrawTextWrap(Player.Name + ": " + SpeechTransformDialog(Player, TextGet(KidnapDialog + "Player")), 10, 350, 580, 200, "white");
	DrawTextWrap(KidnapOpponent.Name + ": " + SpeechTransformDialog(KidnapOpponent, TextGet(KidnapDialog + "Opponent")), 10, 550, 580, 200, "white");
	DrawTextWrap(KidnapResultPlayer, 1410, 150, 580, 200, "white");
	DrawTextWrap(KidnapResultOpponent, 1410, 350, 580, 200, "white");
	DrawTextWrap(KidnapResultUpperHand, 1410, 550, 580, 200, "white");
	DrawText(TextGet(KidnapMoveType[KidnapPlayerMove]) + ((KidnapPlayerDamage != null) ? " - " + KidnapPlayerDamage.toString() : ""), 750, 25, "white", "gray");
	DrawText(TextGet(KidnapMoveType[KidnapOpponentMove]) + ((KidnapOpponentDamage != null) ? " - " + KidnapOpponentDamage.toString() : ""), 1250, 25, "white", "gray");
}

/**
 * Checks if a given move is effective against a given character
 * @param {Character} C - Character for which to check if the move is
 * @param {number} MoveType - Type of move to check for
 * @returns {boolean} - Returns TRUE if the move for that person is effective
 */
function KidnapMoveEffective(C, MoveType) {
	const groupName = KidnapUpperHandMoveType[MoveType];
	if ((groupName == "Cloth") && (InventoryGet(C, groupName) != null)) return true;
	// Not completely true, but unknown groups will just return null anyway
	if ((groupName != "Cloth") && (InventoryGet(C, /** @type {AssetGroupName} */(groupName)) == null)) return true;
	return false;
}

/**
 * Processes a selected move. Triggered when the player selects their move.
 * @param {number} CardIndex - Type of the player move (Represented by the index of the character move array)
 * @returns {void} - Nothing
 */
function KidnapSelectMove(CardIndex) {
	if (!KidnapOpponent) return;
	// Gets both moves effectiveness
	const OpponentCardIndex = KidnapAIMove();
	const playerCards = Player.KidnapCard ?? [];
	const kidnapCards = KidnapOpponent.KidnapCard ?? [];
	const PlayerMove = playerCards[CardIndex].Move;
	const OpponentMove = kidnapCards[OpponentCardIndex].Move;
	var PM = KidnapMoveMap[PlayerMove][OpponentMove];
	var OM = KidnapMoveMap[OpponentMove][PlayerMove];
	KidnapDialog = "Player" + KidnapMoveType[PlayerMove] + "Opponent" + KidnapMoveType[OpponentMove];

	// Keep the move to show it later
	KidnapPlayerMove = PlayerMove;
	KidnapOpponentMove = OpponentMove;

	// Gets the damage done by both sides
	KidnapPlayerDamage = playerCards[CardIndex].Value;
	if (!KidnapMoveEffective(Player, PlayerMove)) KidnapPlayerDamage = Math.round(KidnapPlayerDamage / 2);
	KidnapOpponentDamage = kidnapCards[OpponentCardIndex].Value;
	if (!KidnapMoveEffective(KidnapOpponent, OpponentMove)) KidnapOpponentDamage = Math.round(KidnapOpponentDamage / 2);

	// If the move is effective, we lower the willpower and show it as text
	if (PM >= 1) {
		let Damage = KidnapPlayerDamage;
		if (PlayerMove == OpponentMove) Damage = Damage - KidnapOpponentDamage;
		if (Damage < 0) Damage = 0;
		KidnapOpponent.KidnapWillpower = CommonClamp((KidnapOpponent.KidnapWillpower ?? 0) - Damage, 0, Infinity);
		KidnapResultOpponent = KidnapOpponent.Name + " " + TextGet("Lost") + " " + Damage.toString() + " " + TextGet("Willpower");
	} else KidnapResultOpponent = KidnapOpponent.Name + " " + TextGet("NoLost");
	if (OM >= 1) {
		let Damage = KidnapOpponentDamage;
		if (PlayerMove == OpponentMove) Damage = Damage - KidnapPlayerDamage;
		if (Damage < 0) Damage = 0;
		Player.KidnapWillpower = CommonClamp((Player.KidnapWillpower ?? 0) - Damage, 0, Infinity);
		KidnapResultPlayer = Player.Name + " " + TextGet("Lost") + " " + Damage.toString() + " " + TextGet("Willpower");
	} else KidnapResultPlayer = Player.Name + " " + TextGet("NoLost");

	// Builds the "Upperhand" text
	KidnapResultUpperHand = "";
	KidnapUpperHandVictim = null;
	if ((PM >= 2) && (PlayerMove != 3) && (OpponentMove != 3)) { KidnapUpperHandVictim = KidnapOpponent; KidnapResultUpperHand = Player.Name + " " + TextGet("UpperHand"); }
	if ((OM >= 2) && (PlayerMove != 3) && (OpponentMove != 3)) { KidnapUpperHandVictim = Player; KidnapResultUpperHand = KidnapOpponent.Name + " " + TextGet("UpperHand"); }

	// Removes the card from the deck
	playerCards.splice(CardIndex, 1);
	kidnapCards.splice(OpponentCardIndex, 1);

	// When someone meditates, it resets her stats to max
	if (PlayerMove == 3) KidnapBuildCards(Player);
	if (OpponentMove == 3) KidnapBuildCards(KidnapOpponent);

	// Shows the move dialog
	KidnapSetMode("ShowMove");

}

/**
 * Processes a selected upper handmove. Triggered when the player selects their upper hand move.
 * @param {number} PlayerMove - Type of the player upper hand move (Represented by the index of the character move array)
 * @returns {void} - Nothing
 */
function KidnapSelectMoveUpperHand(PlayerMove) {
	const MoveName = KidnapUpperHandMoveType[PlayerMove];

	// Stripping or undoing something is automatic
	if ((MoveName === "Cloth") || (MoveName === "UndoCloth") || (MoveName === "UndoItemFeet") || (MoveName === "UndoItemMouth"))
		if (KidnapUpperHandMoveAvailable(PlayerMove, true))
			KidnapSetMode("SelectMove");

	// Apply an item enters another mode with a focused group
	if ((MoveName === "ItemFeet") || (MoveName === "ItemMouth"))
		if (KidnapOpponent && KidnapUpperHandMoveAvailable(PlayerMove, false)) {
			KidnapOpponent.FocusGroup = AssetGroupGet("Female3DCG", MoveName);
			KidnapInventoryBuild();
			KidnapSetMode("SelectItem");
		}

	// Mercy is always available
	if (MoveName === "Mercy") KidnapSetMode("SelectMove");
}

/**
 * Triggered when the player surrenders to her opponent
 * @returns {void} - Nothing
 */
function KidnapSurrender() {
	Player.KidnapWillpower = 0;
	KidnapSurrendered = true;
	KidnapSetMode("SelectMove");
}

/**
 * Starts a kidnap match
 * @param {Character} Opponent - The NPC that will be the opponent for the fight
 * @param {string} Background - The background for the fight, changes depending on which room the battle is happening
 * @param {number} Difficulty - Difficulty modifier for the fight, higher is harder
 * @param {(victory: boolean, surrender: boolean) => void} callback - The callback to execute when the minigame completes
 * @returns {void} - Nothing
 */
function KidnapStart(Opponent, Background, Difficulty, callback) {
	KidnapDifficulty = (Difficulty == null) ? 0 : Difficulty;
	KidnapVictory = false;
	KidnapSurrendered = false;
	KidnapReturnCallback = callback;
	KidnapPlayerCloth = InventoryGet(Player, "Cloth");
	KidnapPlayerClothAccessory = InventoryGet(Player, "ClothAccessory");
	KidnapPlayerClothLower = InventoryGet(Player, "ClothLower");
	KidnapOpponentCloth = InventoryGet(Opponent, "Cloth");
	KidnapOpponentClothAccessory = InventoryGet(Opponent, "ClothAccessory");
	KidnapOpponentClothLower = InventoryGet(Opponent, "ClothLower");
	KidnapOpponent = Opponent;
	KidnapBackground = Background;
	MiniGameCheatAvailable = (CheatFactor("MiniGameBonus", 0) == 0);
	DialogLeave();
	if (Opponent.CharacterID.includes("Pandora")) {
		Player.KidnapMaxWillpower = PandoraMaxWillpower;
		Player.KidnapWillpower = PandoraWillpower;
	} else {
		Player.KidnapMaxWillpower = 20 + (SkillGetLevel(Player, "Willpower") * 2);
		Player.KidnapWillpower = Player.KidnapMaxWillpower;
	}
	KidnapOpponent.KidnapMaxWillpower = 20 + (KidnapDifficulty * 2);
	KidnapOpponent.KidnapWillpower = KidnapOpponent.KidnapMaxWillpower;
	KidnapLoadStats(Player, 0);
	KidnapLoadStats(KidnapOpponent, Math.round(KidnapDifficulty / 2.5));
	KidnapBuildCards(Player);
	KidnapBuildCards(KidnapOpponent);
	KidnapSetMode("Intro");
	CommonSetScreen("MiniGame", "Kidnap");
}

/**
 * Draws the given character move.
 * @param {Character} C - Character to draw the move for
 * @param {string} Header - Text to display
 * @param {number} X - Position of the text to draw on the X axis, normally the position of the character
 * @param {"Left" | "Right"} Side
 * @returns {void} - Nothing
 */
function KidnapDrawMove(C, Header, X, Side) {
	DrawText(TextGet(Header), X, 50, "White", "Gray");
	const kidnapCards = C.KidnapCard ?? [];
	for (const [index, card] of kidnapCards.entries()) {
		let Color = KidnapMoveEffective(C, card.Move) ? "White" : "Silver";
		let Value = KidnapMoveEffective(C, card.Move) ? card.Value : Math.round(card.Value / 2);
		let Text = TextGet(KidnapMoveType[card.Move]);
		if (Value !== 0) Text = Text + " - " + Value.toString();
		DrawButton(X - 240, (index * 100) + 100, 480, 80, "", Color);
		DrawText(Text, X + ((Value != null) ? ((Side == "Left") ? -60 : 60) : 0), (index * 100) + 140, "Black", "Silver");
		if (Value !== 0) DrawImage("Screens/MiniGame/Kidnap/" + Side + KidnapRPS[card.Move] + ".png", X + ((Side == "Left") ? 115 : -220), (index * 100) + 100);
	}
}

/**
 * Draws the upper hand moves
 * @returns {void} - Nothing
 */
function KidnapDrawMoveUpperHand() {
	var X = (KidnapUpperHandVictim?.IsPlayer()) ? 1500 : 0;
	if (KidnapUpperHandVictim?.IsPlayer()) DrawTextWrap(TextGet("UpperHand" + KidnapUpperHandMoveType[KidnapUpperHandSelection]), 10, 300, 580, 200, "White");
	DrawText(TextGet("UpperHandMove"), X + 250, 50, "white", "gray");
	for (let M = 0; M <= KidnapUpperHandMoveType.length - 1; M++)
		DrawButton(X + 50, (M * 100) + 100, 400, 70, TextGet(KidnapUpperHandMoveType[M]), (!KidnapUpperHandVictim?.IsPlayer()) ? ((KidnapUpperHandMoveAvailable(M, false)) ? "White" : "Pink") : ((KidnapUpperHandSelection == M) ? "Aquamarine" : "Pink"));
}

/**
 * Draws a large timer in the middle of the screen based on the kidnapping timer.
 * @returns {void} - Nothing
 */
function KidnapShowTimer() {
	if ((KidnapMode == "SelectItem") || (KidnapMode == "SelectMove") || (KidnapMode == "UpperHand") || (KidnapMode == "ShowMove")) {
		var Sec = Math.floor((KidnapTimer - CommonTime() + 1000) / 1000);
		MainCanvas.font = "italic 300 " + CommonGetFont(200);
		DrawText(Sec.toString(), (KidnapMode == "SelectItem") ? 500 : 1000, 500, (Sec <= 3) ? "red" : "white", "black");
		MainCanvas.font = CommonGetFont(36);
	}
}

/**
 * Draws a large title in the center of the screen.
 * @param {string} Title - Title to display on screen
 * @returns {void} - Nothing
 */
function KidnapTitle(Title) {
	MainCanvas.font = "italic 300 " + CommonGetFont(200);
	DrawText(Title, 1003, 503, "White");
	DrawText(Title, 997, 497, "Red");
	MainCanvas.font = CommonGetFont(36);
}

/**
 * Shows the items that can be used by the player.
 * @returns {void} - Nothing
 */
function KidnapShowItem() {

	// Draw the header
	DrawText(TextGet("SelectItemToUse"), 1375, 50, "white", "black");
	DrawButton(1750, 25, 225, 65, TextGet("Cancel"), "White");

	// For each items in the player inventory
	var X = 1000;
	var Y = 125;
	for (let I = 0; I < DialogInventory.length; I++) {
		const Item = DialogInventory[I];
		DrawAssetPreview(X, Y, Item.Asset, { Hover: true });

		X = X + 250;
		if (X > 1800) {
			X = 1000;
			Y = Y + 300;
		}
	}

}

/**
 * Runs and draws the kidnapping minigame
 * @returns {void} - Nothing
 */
function KidnapRun() {

	if (!KidnapOpponent) return;

	// Draw the kidnap elements
	var X = 500;
	if (KidnapMode == "SelectItem") X = 0;
	DrawCharacter(Player, X, 0, 1);
	DrawCharacter(KidnapOpponent, X + 500, 0, 1);
	DrawProgressBar(X + 100, 960, 300, 35, Math.round((Player.KidnapWillpower ?? 0) / (Player.KidnapMaxWillpower ?? 0) * 100));
	DrawProgressBar(X + 600, 960, 300, 35, Math.round((KidnapOpponent.KidnapWillpower ?? 0) / (KidnapOpponent.KidnapMaxWillpower ?? 0) * 100));
	DrawText(`${Player.KidnapWillpower}`, X + 250, 979, "black", "white");
	DrawText(`${KidnapOpponent.KidnapWillpower}`, X + 750, 979, "black", "white");
	if (KidnapMode == "Intro") KidnapTitle(Player.Name + " vs " + KidnapOpponent.Name);
	if (KidnapMode == "SuddenDeath") KidnapTitle(TextGet("SuddenDeath"));
	if (KidnapMode == "End") KidnapTitle(((KidnapVictory) ? Player.Name : KidnapOpponent.Name) + " " + TextGet("Wins"));
	if (KidnapMode == "SelectMove") { KidnapDrawMove(Player, "SelectMove", 250, "Left"); KidnapDrawMove(KidnapOpponent, "OpponentMove", 1750, "Right"); }
	if (KidnapMode == "UpperHand") KidnapDrawMoveUpperHand();
	if (KidnapMode == "ShowMove") KidnapShowMove();
	if (KidnapMode == "SelectItem") KidnapShowItem();

	// If the time is over, we go to the next step
	if (CommonTime() >= KidnapTimer && Player.KidnapCard) {
		if (KidnapMode == "SelectMove") { KidnapSelectMove(Player.KidnapCard.length - 1); return; }
		if (KidnapMode == "End") {
			KidnapReturnCallback?.(KidnapVictory, KidnapSurrendered);
			KidnapReturnCallback = null;
			return;
		}
		if ((KidnapMode == "Intro") || (KidnapMode == "SuddenDeath") || (KidnapMode == "ShowMove") || (KidnapMode == "UpperHand") || (KidnapMode == "SelectItem")) KidnapSetMode("SelectMove");
	} else KidnapShowTimer();

}

/**
 * Handles clicks in the kidnap mini game
 * @returns {void} - Nothing
 */
function KidnapClick() {
	if (!KidnapOpponent) return;

	// If we must end the fight
	if (KidnapMode == "End") {
		KidnapReturnCallback?.(KidnapVictory, KidnapSurrendered);
		KidnapReturnCallback = null;
		return;
	}

	// When the user wants to skip the result or upper hand selection from the AI
	if (KidnapMode === "Intro" || KidnapMode === "SuddenDeath" || KidnapMode === "ShowMove" || (KidnapMode === "UpperHand" && KidnapUpperHandVictim?.IsPlayer())) {
		KidnapSetMode("SelectMove");
		return;
	}

	// When the user selects a regular move
	if (KidnapMode === "SelectMove") {
		for (const [M, _card] of (Player.KidnapCard ?? []).entries()) {
			if (MouseIn(10, 100 + M * 100, 480, 80)) {
				KidnapSelectMove(M);
				return;
			}
		}
	}

	// When the user selects a upper hand move
	if (KidnapMode === "UpperHand" && !KidnapUpperHandVictim?.IsPlayer()) {
		for (const [M, _move] of KidnapUpperHandMoveType.entries()) {
			if (MouseIn(50, 100 + M * 100, 400, 70)) {
				KidnapSelectMoveUpperHand(M);
				return;
			}
		}
	}

	// If we must cancel out and don't select any item
	if (MouseIn(1750, 25, 225, 65))
		KidnapSetMode("SelectMove");

	// If the user clicks on one of the items to be applied to the opponent
	if (KidnapMode === "SelectItem" && MouseIn(1000, 125, 975, 875)) {

		// For each items in the player/opponent inventory
		let X = 1000;
		let Y = 125;
		for (let I = 0; I < DialogInventory.length; I++) {

			// If the item at position is clicked, we add the item to the opponent
			if (MouseIn(X, Y, 225, 275)) {
				InventoryWear(KidnapOpponent, DialogInventory[I].Asset.Name, DialogInventory[I].Asset.Group.Name);
				KidnapSetMode("SelectMove");
				break;
			}

			// Change the X and Y position to get the next square
			X = X + 250;
			if (X > 1800) {
				X = 1000;
				Y = Y + 300;
			}

		}

	}

}

/**
 * Returns the experience gained from having successfully fought an opponent
 * @param {Character} opponent
 * @returns {number}
 */
function KidnapSuccessWillpowerProgress(opponent) {
	return ((Player.KidnapMaxWillpower ?? 0) - (Player.KidnapWillpower ?? 0) + (opponent.KidnapMaxWillpower ?? 0) - (opponent.KidnapWillpower ?? 0)) * 2;
}

/**
 * Handles the key press in the kidnap mini game, the C cheat key can help you recover some lost willpower
 * @type {KeyboardEventListener}
 */
function KidnapKeyDown(event) {
	if (MiniGameCheatKeyDown(event)) {
		Player.KidnapWillpower = Math.min((Player.KidnapWillpower ?? 0) + 6, (Player.KidnapMaxWillpower ?? 0));
		return true;
	}
	return false;
}
