"use strict";
var PandoraBackground = "Pandora/Ground/Entrance";
/** @type {PandoraBaseRoom} */
var PandoraCurrentRoom = /** @type {never} */ (null);
/** @type {PandoraBaseRoom | null} */
var PandoraPreviousRoom = null;
/** @type {PandoraBaseRoom[]} */
var PandoraRoom = [];
/** @type {PandoraFloorDirection[]} */
var PandoraDirectionList = ["South", "North", "East", "West"];
/** @type {PandoraFloorDirection[]} */
var PandoraDirectionListFrom = ["North", "South", "West", "East"];
/** @type {""|"Search"|"Rest"|"Paint"} */
var PandoraMode = "";
var PandoraModeTimer = 0;
/** @type {Item[] | null} */
var PandoraModeAppearance = null;
/** @type {{ Text: string, Timer: number } | null} */
var PandoraMessage = null;
/** @type {NPCCharacter[]} */
var PandoraParty = [];
/** @type {null | NPCCharacter} */
var PandoraFightCharacter = null;
var PandoraRandomNPCList = ["MemberNew", "MemberOld", "Cosplay", "Mistress", "Slave", "Maid", "Guard"];
var PandoraMoveDirectionTimer = { Direction: "", Timer: 0 };
/** @type {PandoraBaseRoom} */
var PandoraTargetRoom = /** @type {never} */ (null);
var PandoraClothes = "Random";
var PandoraWillpower = 20;
var PandoraMaxWillpower = 20;
var PandoraMoney = 0;
var PandoraTimer = 0;
var PandoraChestCount = 0;
var PandoraPaint = false;
var PandoraReverseMaidDone = 0;
var PandoraReverseMaidTotal = 0;
var PandoraPenitentiaryCreateTimer = 0;
var PandoraPenitentiaryActivityList = ["Bondage", "Cage", "Chastity", "Detain", "Gag", "Hogtie", "Hose", "Lock", "Naked", "Spank", "Ungag", "Release", "Shibari", "Uncage", "Unchaste", "Unlock"];
var PandoraPenitentiaryActivityTimer = 0;
/** @type {string[]} */
var PandoraPenitentiarySafewordRooms = [];
/** @type {AssetName[]} */
var PandoraPenitentiaryCageList = ["WoodenBox", "SmallWoodenBox", "Cage", "LowCage", "PersonalCage", "TheDisplayFrame", "TheHangingFrame", "WoodenBoxOpenHead", "SmallWoodenBoxOpenHead", "Kennel", "TransportWoodenBox"];
var PandoraPenitentiaryStartNewRoom = false;

/**
 * NPC Dialog functions
 * @returns {boolean} - TRUE if the dialog option will be available to the player
 */
function PandoraCanStartRecruit() { return !!CurrentCharacter && (((CurrentCharacter.Recruit == null) || (CurrentCharacter.Recruit == 0)) && (!CurrentCharacter.IsNaked() || CurrentCharacter.Archetype == "Slave")); }
function PandoraCanRecruit() { return !!CurrentCharacter && ((CurrentCharacter.Recruit ?? 0) + (InfiltrationPerksActive("Recruiter") ? 0.25 : 0) + ((CurrentCharacter.Archetype === "Slave" && PandoraClothes == "Mistress") ? 0.25 : 0) >= (CurrentCharacter.RecruitOdds ?? 0)); }
function PandoraCharacterCanJoin() { return ((PandoraParty.length == 0) || (PandoraParty[0].Name !== CurrentCharacter?.Name)); }
function PandoraCharacterCanLeave() { return ((PandoraParty.length == 1) && (PandoraParty[0].Name === CurrentCharacter?.Name) && ((PandoraCurrentRoom.Character == null) || (PandoraCurrentRoom.Character.length <= 1))); }
function PandoraOdds75() { return !!CurrentCharacter && ((CurrentCharacter.RandomOdds == null) || (CurrentCharacter.RandomOdds > 0.25)); }
function PandoraOdds50() { return !!CurrentCharacter && ((CurrentCharacter.RandomOdds == null) || (CurrentCharacter.RandomOdds > 0.50)); }
function PandoraOdds25() { return !!CurrentCharacter && ((CurrentCharacter.RandomOdds == null) || (CurrentCharacter.RandomOdds > 0.75)); }
/** @param {string} Costume */
function PandoraCostumeIs(Costume) { return (PandoraClothes == Costume); }
/** @param {number} Number */
function PandoraQuizIs(Number) { return !!CurrentCharacter && ((CurrentCharacter.QuizLog != null) && (CurrentCharacter.QuizLog[CurrentCharacter.QuizLog.length - 1].toString() == Number.toString())); }
function PandoraCanAskForPaint() { return (!PandoraPaint && (PandoraClothes == "Maid") && (InfiltrationMissionState?.Mission == "ReverseMaid")); }

/**
 * Loads the Pandora's Box screen
 * @type {ScreenLoadHandler}
 */
async function PandoraLoad() {
}

/**
 * Returns the color of the direction buttons, it can change if the direction was recently navigated to
 * The Cartographer perk can show the returning path in yellow
 * @param {"North" | "South" | "East" | "West"} Direction - The cardinal direction
 * @returns {string} - The color to use
 */
function PandoraDirectionButtonColor(Direction) {
	if ((PandoraMoveDirectionTimer.Timer >= CommonTime()) && (PandoraMoveDirectionTimer.Direction === Direction))
		return PandoraDirectionAvailable(Direction) ? (((Direction == PandoraCurrentRoom.DirectionMap[0]) && InfiltrationPerksActive("Cartographer") && (PandoraCurrentRoom.Background != "Entrance")) ? "#BFFF40" : "#80FF80") : "#408040";
	else
		return PandoraDirectionAvailable(Direction) ? (((Direction == PandoraCurrentRoom.DirectionMap[0]) && InfiltrationPerksActive("Cartographer") && (PandoraCurrentRoom.Background != "Entrance")) ? "#FFFF00" : "White") : "#BF8080";
}

/**
 * Returns whether the player can move in the specified direction
 * @param {"North" | "South" | "East" | "West"} Direction - The cardinal direction to check
 * @returns {boolean} - Whether the direction can be accessed
 */
function PandoraDirectionAvailable(Direction) {
	return (PandoraCurrentRoom.DirectionMap.indexOf(Direction) >= 0);
}

/**
 * Draws the Pandora text data
 * @param {number} Y - The Y position
 * @returns {void}
 */
function PandoraDrawData(Y) {
	if (!InfiltrationMissionState) return;
	if (InfiltrationMissionState.Mission == "CatBurglar") {
		DrawText("$" + PandoraMoney.toString() + (InfiltrationPerksActive("Detector") ? " (" + PandoraChestCount.toString() + ")" : ""), 1887, Y, "White", "Black");
		DrawText(TimerToString(PandoraTimer - CommonTime()), 1887, Y + 55, "White", "Black");
		return;
	}
	if (InfiltrationMissionState.Mission == "ReverseMaid") {
		DrawText("$" + PandoraMoney.toString() + (InfiltrationPerksActive("Detector") ? " (" + PandoraChestCount.toString() + ")" : ""), 1887, Y, "White", "Black");
		DrawText(TextGet("ReverseMaidProgress") + " " + Math.round(PandoraReverseMaidDone / PandoraReverseMaidTotal * 100).toString() + "%", 1887, Y + 55, "White", "Black");
		return;
	}
	DrawText("$" + PandoraMoney.toString() + (InfiltrationPerksActive("Detector") ? " (" + PandoraChestCount.toString() + ")" : ""), 1887, Y + 55, "White", "Black");
}

/**
 * Runs and draws all Pandora's Box screens
 * @returns {void} - Nothing
 */
function PandoraRun() {
	if (!InfiltrationMissionState) return;
	// If time is up for catburglar mission
	if ((PandoraTimer < CommonTime()) && (InfiltrationMissionState.Mission == "CatBurglar"))
		return PandoraPunishmentIntro(false, TextGet("CatBurglarPunishment"));

	// Gets the current room & background
	if ((PandoraRoom.length == 0) || (PandoraCurrentRoom == null)) return;
	PandoraBackground = "Pandora/" + PandoraCurrentRoom.Floor + "/" + PandoraCurrentRoom.Background;
	if (PandoraCurrentRoom.Graffiti != null) DrawImage("Screens/Room/Pandora/Graffiti" + PandoraCurrentRoom.Graffiti.toString() + ".png", 0, 0);
	if (InfiltrationMissionState.Mission == "CatBurglar") DrawRect(0, 0, 2000, 1000, "#00000080");

	// The search square are drawn even out of search mode
	if (PandoraCurrentRoom.SearchSquare != null)
		for (let S = 0; S < PandoraCurrentRoom.SearchSquare.length; S++)
			DrawRect(PandoraCurrentRoom.SearchSquare[S].X, PandoraCurrentRoom.SearchSquare[S].Y, PandoraCurrentRoom.SearchSquare[S].W, PandoraCurrentRoom.SearchSquare[S].H, "#00FFFF7F");

	// In search mode, we draw all previous searches done in that area
	if (PandoraMode == "Search") {
		DrawButton(1885, 885, 90, 90, "", "White", "Icons/Search.png", TextGet("SearchStop"));
		return;
	}

	// In paint mode, we offer many graffities for the player to pick
	if (PandoraMode == "Paint") {
		if (PandoraCurrentRoom.Graffiti == null) {
			for (let G = 0; G <= 7; G++)
				DrawButton(1885, 25 + (G * 115), 90, 90, "", "White", "Icons/Paint.png", TextGet("Graffiti" + G.toString()));
		} else DrawButton(1885, 25, 90, 90, "", "White", "Icons/Paint.png", TextGet("AlreadyPainted"));
		return;
	}

	// In rest mode, the timer will tick slowly and heal the player for 1 willpower
	if (PandoraMode == "Rest") {
		DrawButton(1885, 25, 90, 90, "", "White", "Icons/Rest.png", TextGet("RestStop"));
		DrawProgressBar(1785, 954, 205, 36, Math.round(PandoraWillpower / PandoraMaxWillpower * 100));
		DrawText(PandoraWillpower.toString(), 1888, 973, "black", "white");
		DrawCharacter(Player, 750, 0, 1);
		if (PandoraModeTimer < CommonTime()) {
			PandoraWillpower = PandoraWillpower + 1;
			if (PandoraWillpower > PandoraMaxWillpower) PandoraWillpower = PandoraMaxWillpower;
			PandoraModeTimer = CommonTime() + ((InfiltrationPerksActive("Recovery")) ? 10000 : 12000);
		}
		return;
	}

	// Draws up to 4 characters in the room, including the player
	let Pos = 690 - (PandoraCurrentRoom.Character.length + PandoraParty.length) * 230;
	DrawCharacter(Player, Pos, 0, 1);
	let AllowMove = true;
	for (let C = 0; C < PandoraParty.length; C++)
		DrawCharacter(PandoraParty[C], Pos + ((C + 1) * 460), 0, 1);
	for (let C = 0; C < PandoraCurrentRoom.Character.length; C++) {
		DrawCharacter(PandoraCurrentRoom.Character[C], Pos + ((C + 1 + PandoraParty.length) * 460), 0, 1);
		if ((PandoraCurrentRoom.Character[C].AllowMove != null) && (PandoraCurrentRoom.Character[C].AllowMove == false)) AllowMove = false;
	}

	// If we allow moving, we draw the paths
	PandoraDrawData(AllowMove ? 525 : 860);
	if (AllowMove) {
		for (let P = 0; P < PandoraCurrentRoom.Path.length; P++)
			DrawButton(1885, 25 + P * 115, 90, 90, "", "White", "Icons/" + PandoraCurrentRoom.Direction[P] + ".png", TextGet("Path" + PandoraCurrentRoom.Direction[P]));
		DrawButton(1842, 620, 90, 90, "", PandoraDirectionButtonColor("North"), "Icons/North.png", TextGet("DirectionNorth"), !PandoraDirectionAvailable("North"));
		DrawButton(1785, 735, 90, 90, "", PandoraDirectionButtonColor("West"), "Icons/West.png", TextGet("DirectionWest"), !PandoraDirectionAvailable("West"));
		DrawButton(1842, 850, 90, 90, "", PandoraDirectionButtonColor("South"), "Icons/South.png", TextGet("DirectionSouth"), !PandoraDirectionAvailable("South"));
		DrawButton(1900, 735, 90, 90, "", PandoraDirectionButtonColor("East"), "Icons/East.png", TextGet("DirectionEast"), !PandoraDirectionAvailable("East"));
	}

	// If we must draw a message in the middle of the screen
	if ((PandoraMessage != null) && (PandoraMessage.Timer != null) && (PandoraMessage.Text != null) && (PandoraMessage.Timer >= CommonTime())) {
		DrawRect(450, 465, 1100, 70, "black");
		DrawRect(452, 467, 1096, 66, "white");
		DrawTextWrap(PandoraMessage.Text, 450, 465, 1100, 70, "black");
	}

	// Draw the willpower / max
	DrawProgressBar(1785, 954, 205, 36, Math.round(PandoraWillpower / PandoraMaxWillpower * 100));
	DrawText(PandoraWillpower.toString(), 1888, 973, "black", "white");

}

/**
 * Enters a new mode for the Pandora screen, such as rest or search mode
 * @param {PandoraMode} NewMode
 * @returns {void} - Nothing
 */
function PandoraSetMode(NewMode) {

	// Exit from a previous mode if needed
	if (PandoraMode == "Rest" && NewMode == "" && PandoraModeAppearance !== null) {
		Player.Appearance = PandoraModeAppearance.slice(0);
		PandoraModeAppearance = null;
		CharacterRefresh(Player, true);
	}

	// Enters the need mode
	PandoraMode = NewMode;

	// In rest, the player switch to a towel and heals overtime
	if (NewMode == "Rest") {
		PandoraModeAppearance = Player.Appearance.slice(0);
		CharacterNaked(Player);
		InventoryWear(Player, "BodyTowel1", "Cloth");
		InventoryWear(Player, "HeadTowel1", "Hat");
		PandoraModeTimer = CommonTime() + ((InfiltrationPerksActive("Recovery")) ? 10000 : 12000);
	}

	// Cannot enter search mode if the item is already found
	if (NewMode == "Search" && InfiltrationMissionState?.Mission === "Retrieve" && InfiltrationMissionState?.Found === true) {
		PandoraMsgBox(TextGet("AlreadyFound").replace("TargetName", InfiltrationMissionState?.Name));
		PandoraMode = "";
	}

	// Cannot enter paint mode without paint
	if ((NewMode == "Paint") && !PandoraPaint) {
		PandoraMsgBox(TextGet("NoPaint"));
		PandoraMode = "";
	}

	// Cannot enter paint mode if the room isn't empty
	if ((NewMode == "Paint") && (PandoraCurrentRoom.Character.length >= 1)) {
		PandoraMsgBox(TextGet("RoomEmptyToPaint"));
		PandoraMode = "";
	}

}

/**
 * Handles clicks in all Pandora's screen
 * @returns {void} - Nothing
 */
function PandoraClick() {

	// Checks if we clicked on the player
	if (PandoraRoom.length == 0) return;

	// If there's a message running, we do not allow any clicks
	if ((PandoraMessage != null) && (PandoraMessage.Timer != null) && (PandoraMessage.Text != null) && (PandoraMessage.Timer >= CommonTime()))
		return;

	// In search mode, we can click anywhere on the screen
	if (PandoraMode == "Search" && InfiltrationMissionState?.Mission === "Retrieve") {
		if (MouseIn(0, 0, 1850, 1000)) {
			if (PandoraCurrentRoom.SearchSquare == null) PandoraCurrentRoom.SearchSquare = [];
			let Radius = InfiltrationPerksActive("Investigation") ? 250 : 175;
			PandoraCurrentRoom.SearchSquare.push({ X: MouseX - Radius, Y: MouseY - Radius, W: Radius * 2, H: Radius * 2 });
			if (PandoraCurrentRoom.ItemX !== undefined && PandoraCurrentRoom.ItemY !== undefined && MouseIn(PandoraCurrentRoom.ItemX - Radius, PandoraCurrentRoom.ItemY - Radius, Radius * 2, Radius * 2)) {
				InfiltrationMissionState.Found = true;
				PandoraSetMode("");
				PandoraMsgBox(TextGet("FoundItem").replace("TargetName", InfiltrationMissionState.Name));
			}
		}
		if (MouseIn(1885, 885, 90, 90)) PandoraSetMode("");
		return;
	}

	// In rest mode, the player can exit it and stop healing
	if (PandoraMode == "Rest") {
		if (MouseIn(1885, 25, 90, 90)) PandoraSetMode("");
		return;
	}

	// In paint mode, the player puts a graffiti on the background
	if (PandoraMode == "Paint") {
		if (PandoraCurrentRoom.Graffiti == null) {
			for (let G = 0; G <= 7; G++)
				if (MouseIn(1885, 25 + (G * 115), 90, 90)) {
					PandoraReverseMaidDone++;
					PandoraCurrentRoom.Graffiti = G;
					break;
				}
		} else if (MouseIn(1885, 25, 90, 90)) PandoraSetMode("");
		return;
	}

	// Checks if we clicked on a character
	let Pos = 690 - (PandoraCurrentRoom.Character.length + PandoraParty.length) * 230;
	if (MouseIn(Pos, 0, 500, 1000)) return CharacterSetCurrent(Player);
	let AllowMove = true;
	for (let C = 0; C < PandoraCurrentRoom.Character.length; C++) {
		if (MouseIn(Pos + ((C + 1 + PandoraParty.length) * 460), 0, 500, 1000)) return CharacterSetCurrent(PandoraCurrentRoom.Character[C]);
		if ((PandoraCurrentRoom.Character[C].AllowMove != null) && (PandoraCurrentRoom.Character[C].AllowMove == false)) AllowMove = false;
	}

	// If we allow moving, we can switch room, rooms that start with "Rest" or "Search" have special modes
	if (AllowMove) {
		for (let C = 0; C < PandoraParty.length; C++)
			if (MouseIn(Pos + ((C + 1) * 460), 0, 500, 1000))
				return CharacterSetCurrent(PandoraParty[C]);
		for (let P = 0; P < PandoraCurrentRoom.Path.length; P++)
			if (MouseIn(1900, 25 + P * 115, 90, 90)) {
				const Floor = PandoraCurrentRoom.Path[P].Floor;
				if (Floor == "Exit") {
					CommonSetScreen("Room", "Infiltration");
					return;
				}
				if ((Floor == "Search") || (Floor == "Paint") || (Floor == "Rest"))
					return PandoraSetMode(Floor);
				return PandoraEnterRoom(/** @type {PandoraBaseRoom} */(PandoraCurrentRoom.Path[P]));
			}
		if (MouseIn(1842, 620, 90, 90) && (PandoraDirectionAvailable("North"))) return PandoraEnterRoom(PandoraCurrentRoom.PathMap[PandoraCurrentRoom.DirectionMap.indexOf("North")], "North");
		if (MouseIn(1785, 735, 90, 90) && (PandoraDirectionAvailable("West"))) return PandoraEnterRoom(PandoraCurrentRoom.PathMap[PandoraCurrentRoom.DirectionMap.indexOf("West")], "West");
		if (MouseIn(1842, 850, 90, 90) && (PandoraDirectionAvailable("South"))) return PandoraEnterRoom(PandoraCurrentRoom.PathMap[PandoraCurrentRoom.DirectionMap.indexOf("South")], "South");
		if (MouseIn(1900, 735, 90, 90) && (PandoraDirectionAvailable("East"))) return PandoraEnterRoom(PandoraCurrentRoom.PathMap[PandoraCurrentRoom.DirectionMap.indexOf("East")], "East");
	}

}

/**
 * Handles the key pressed in Pandora's Box, allow WASD to move around
 * @param {KeyboardEvent} event - Key event
 * @returns {boolean} - Whether the supplied event was understood/used.
 */
function PandoraKeyDown(event) {
	/** @type {"North" | "South" | "East" | "West" | undefined} */
	let dir;
	const movingAllowed = PandoraCurrentRoom?.Character.every(i => i.AllowMove == null || i.AllowMove);
	if (movingAllowed && PandoraMode == "" && !CommonKey.GetModifiers(event)) {
		dir = CommonKeyMove(event, true);

		if (dir !== undefined && PandoraDirectionAvailable(dir)) {
			PandoraEnterRoom(PandoraCurrentRoom.PathMap[PandoraCurrentRoom.DirectionMap.indexOf(dir)], dir);
		}
	}
	return dir !== undefined;
}

/**
 * Prepares a text popup for Pandora's Box
 * @param {string} Text
 * @returns {void} - Nothing
 */
function PandoraMsgBox(Text) {
	PandoraMessage = { Timer: CommonTime() + 3000, Text: Text };
}

/**
 * Generates a random NPC for Pandora's Box missions, clear the cache if it was generated before
 * @param {string} Group - The main group for that NPC (Random, Entrance, Underground)
 * @param {NPCArchetype} Archetype - The NPC function within Pandora's (Guard, Mistress, Slave, Maid, etc.)
 * @param {string} Name - The name to give to that NPC, can be RANDOM for a fully random name
 * @param {boolean} AllowItem - TRUE if we allow using items on her by default
 * @returns {NPCCharacter} - The NPC character to return
 */
function PandoraGenerateNPC(Group, Archetype, Name, AllowItem) {
	const oldNPC = Character.find(c => c.CharacterID === "NPC_Pandora_" + Group + Archetype);
	if (oldNPC) {
		CharacterDelete(oldNPC);
	}

	let NPC = CharacterLoadNPC("NPC_Pandora_" + Group + Archetype);
	if (Name == "RANDOM")
		NPC.Name = CharacterGenerateRandomName();
	else
		NPC.Name = Name;
	CharacterRelease(NPC);
	NPC.Archetype = Archetype;
	NPC.Stage = "0";
	NPC.AllowItem = AllowItem;
	NPC.AllowMove = false;
	NPC.Recruit = 0;
	NPC.RecruitOdds = (Archetype === "Slave") ? 1 : 0.75;
	PandoraDress(NPC, NPC.Archetype);
	return NPC;
}

/**
 * Dress a character in the Rival Club fashion
 * @param {Character} C
 * @param {string} Type
 * @returns {void} - Nothing
 */
function PandoraDress(C, Type) {

	// The maids have a red outfit
	if (Type == "Maid") {
		InventoryRemove(C, "Gloves");
		InventoryRemove(C, "ClothAccessory");
		InventoryWear(C, "MaidOutfit2", "Cloth", "#804040");
		InventoryWear(C, "MaidHairband1", "Hat", "#804040");
		const socks = InventoryGet(C, "Socks") ?? InventoryWear(C, "Socks3", "Socks");
		socks?.Color.fill("#804040");
		const bra = InventoryGet(C, "Bra") ?? InventoryWear(C, "Bra1", "Bra");
		bra?.Color.fill("#222222");
		const panties = InventoryGet(C, "Panties") ?? InventoryWear(C, "Panties1", "Panties");
		panties?.Color.fill("#222222");
		const shoes = InventoryGet(C, "Shoes") ?? InventoryWear(C, "Shoes1", "Shoes");
		shoes?.Color.fill("#222222");
		if (!C.IsPlayer()) InventoryWear(C, "MaidCollar", "ItemNeck", "#804040");
		CharacterRefresh(C, false);
		return;
	}

	// The guards are wearing a police hat and latex
	if (Type == "Guard") {
		InventoryRemove(C, "Gloves");
		InventoryRemove(C, "ClothAccessory");
		InventoryWear(C, "PoliceWomanHat", "Hat", "Default");
		InventoryWear(C, "CorsetShirt", "Cloth", "Default");
		InventoryWear(C, "LatexPants1", "ClothLower", "Default");
		InventoryWear(C, "DeluxeBoots", "Shoes", "#222222");
		InventoryWear(C, "LatexSocks1", "Shoes", "#222222");
		CharacterRefresh(C, false);
		return;
	}

	// The guards are wearing a police hat and latex
	if (Type == "Slave") {
		CharacterNaked(C);
		InventoryWear(C, "StrictPostureCollar", "ItemNeck", "#FFD700");
		InventoryLock(C, "ItemNeck", "PandoraPadlock", "Property of the Pandora Club");
		InventoryWear(C, "MetalChastityBelt", "ItemPelvis", "#FFD700");
		InventoryLock(C, "ItemPelvis", "PandoraPadlock", "Property of the Pandora Club");
		CharacterRefresh(C, false);
		return;
	}

	// The Mistress wear gold uniforms
	if (Type == "Mistress") {
		InventoryRemove(C, "ClothAccessory");
		InventoryWear(C, "MistressGloves", "Gloves", "#FFD700");
		InventoryWear(C, "MistressBoots", "Shoes", "#FFD700");
		InventoryWear(C, "MistressTop", "Cloth", "#FFD700");
		InventoryWear(C, "MistressBottom", "ClothLower", "#FFD700");
		CharacterRefresh(C, false);
		return;
	}

	// Cosplay wear random costumes
	if (Type == "Cosplay") {
		CharacterNaked(C);
		InventoryWearRandom(C, "Bra");
		InventoryWearRandom(C, "Panties");
		if (Math.random() > 0.33) InventoryWearRandom(C, "Wings");
		if (Math.random() > 0.33) InventoryWearRandom(C, "HairAccessory1");
		if (Math.random() > 0.33) InventoryWearRandom(C, "TailStraps");
		if (Math.random() > 0.5) InventoryWearRandom(C, "HairAccessory2");
		if (Math.random() > 0.5) InventoryWearRandom(C, "Corset");
		if (Math.random() > 0.5) InventoryWearRandom(C, "Mask");
		if (Math.random() > 0.666) InventoryWearRandom(C, "Garters");
		if (Math.random() > 0.666) InventoryWearRandom(C, "Socks");
		if (Math.random() > 0.666) InventoryWearRandom(C, "Gloves");
		if (Math.random() > 0.666) InventoryWearRandom(C, "Bracelet");
		return;
	}

	// Since no defined type is found, we fully randomize the clothes and appearance
	CharacterAppearanceFullRandom(C);
	CharacterRefresh(C, false);

}

/**
 * When the players enters a new room, we keep the previous room
 * @param {PandoraBaseRoom} Room - The room to step into
 * @param {PandoraDirection | ""} [Direction] - The direction the player comes from
 * @returns {void} - Nothing
 */
function PandoraEnterRoom(Room, Direction) {
	if (!InfiltrationMissionState) return;
	// Removes 15 seconds from the clock
	PandoraTimer = PandoraTimer - 15000;

	// Shoes the incoming direction for a little while
	if ((Direction != null) && (Direction != "")) PandoraMoveDirectionTimer = { Direction: Direction, Timer: CommonTime() + 1500 };

	// Sets the new room and keep the previous
	PandoraPreviousRoom = PandoraCurrentRoom;
	PandoraCurrentRoom = Room;

	// 33% odds of removing a previous random NPC if she can walk
	if (PandoraCurrentRoom.Character.length >= 1) {
		let Char = PandoraCurrentRoom.Character[0];
		if ((Char.AccountName.indexOf("NPC_Pandora_Random") == 0) && (Math.random() > 0.667) && Char.CanWalk()) {
			PandoraCurrentRoom.Character = [];
			CharacterDelete(Char);
			return;
		}
	}

	// 4% odds of spawning a new random NPC in the room
	if ((PandoraCurrentRoom.Background.indexOf("Entrance") < 0) && (PandoraCurrentRoom.Character.length == 0) && (Math.random() > 0.96) && (InfiltrationMissionState?.Mission != "CatBurglar")) {
		let Type = /** @type {NPCArchetype} */ (CommonRandomItemFromList("", PandoraRandomNPCList));
		let Char = PandoraGenerateNPC("Random", Type, "RANDOM", (Type === "Slave"));
		Room.Character.push(Char);
	}

	// 1% odds of spawning a night guard NPC in the room
	if ((PandoraCurrentRoom.Background.indexOf("Entrance") < 0) && (PandoraCurrentRoom.Character.length == 0) && (Math.random() > 0.99) && (InfiltrationMissionState?.Mission == "CatBurglar")) {
		let Char = PandoraGenerateNPC("Night", "Guard", "RANDOM", false);
		Room.Character.push(Char);
	}

	// If we enter a room with a maid that's not bound, she can intercept the player if the mission is almost completed
	if ((PandoraCurrentRoom.Character.length == 1) && (PandoraCurrentRoom.Character[0].AccountName.indexOf("Maid") >= 0) && PandoraCurrentRoom.Character[0].CanInteract()) {
		let StartDialog = "";
		if ((InfiltrationMissionState.Mission == "Retrieve") && (InfiltrationMissionState.Found)) StartDialog = InfiltrationMissionState.Mission + ((PandoraClothes == "Maid") ? "Maid" : "Random") + "0";
		if ((InfiltrationMissionState.Mission == "Rescue") && (PandoraParty.length == 1) && (PandoraParty[0].Name == InfiltrationMissionState.Name)) StartDialog = InfiltrationMissionState.Mission + ((PandoraClothes == "Guard") ? "Guard" : "Random") + "0";
		if ((InfiltrationMissionState.Mission == "Kidnap") && (PandoraParty.length == 1) && (PandoraParty[0].Name == InfiltrationMissionState.Name) && PandoraParty[0].CanTalk()) StartDialog = InfiltrationMissionState.Mission + "Random" + "0";
		if ((PandoraCurrentRoom.Character[0].AccountName.indexOf("EntranceMaid") >= 0) && (PandoraParty.length == 1) && (PandoraParty[0].AccountName.indexOf("RandomMistress") >= 0) && (InventoryGet(PandoraParty[0], "ItemHood") == null)) StartDialog = "MistressArrest0";
		if (StartDialog != "") {
			CharacterRelease(PandoraCurrentRoom.Character[0]);
			PandoraCurrentRoom.Character[0].RandomOdds = Math.random() + 0.2 - (InfiltrationMissionState.Difficulty * 0.1);
			PandoraCurrentRoom.Character[0].AllowMove = false;
			PandoraCurrentRoom.Character[0].Stage = StartDialog;
		}
	}

	// If we enter a room with a guard that's not bound, she can intercept the player
	if ((PandoraCurrentRoom.Character.length == 1) && (PandoraCurrentRoom.Character[0].AccountName.indexOf("RandomGuard") >= 0) && PandoraCurrentRoom.Character[0].CanInteract()) {
		let ArrestDialog = "";
		if (!PandoraCurrentRoom.Character[0].AllowMove && (SkillGetLevel(Player, "Infiltration") >= Math.floor(Math.random() * 10))) ArrestDialog = "InfiltrationArrest";
		if ((InfiltrationMissionState.Mission == "Kidnap") && (PandoraParty.length == 1) && (PandoraParty[0].Name == InfiltrationMissionState.Name) && PandoraParty[0].CanTalk()) ArrestDialog = "KidnapArrest";
		if ((PandoraParty.length == 1) && (PandoraParty[0].AccountName.indexOf("RandomGuard") >= 0)) ArrestDialog = "GuardArrest";
		if ((PandoraParty.length == 1) && (PandoraParty[0].AccountName.indexOf("RandomMistress") >= 0) && PandoraParty[0].CanTalk()) ArrestDialog = "MistressArrest";
		if (ArrestDialog != "") {
			CharacterRelease(PandoraCurrentRoom.Character[0]);
			PandoraCurrentRoom.Character[0].AllowMove = false;
			PandoraCurrentRoom.Character[0].Stage = ArrestDialog;
		}
	}

	// If we enter a room with a Dominatrix that's not bound, she can intercept and challenge the player
	if ((PandoraCurrentRoom.Character.length == 1) && (PandoraCurrentRoom.Character[0].AccountName.indexOf("RandomMistress") >= 0) && PandoraCurrentRoom.Character[0].CanInteract()) {
		let MistressDialog = "";
		if (!PandoraCurrentRoom.Character[0].AllowMove && (SkillGetLevel(Player, "Infiltration") >= Math.floor(Math.random() * 10))) MistressDialog = "50";
		if (PandoraClothes == "Mistress") MistressDialog = "60";
		if ((PandoraParty.length == 1) && (PandoraParty[0].AccountName.indexOf("RandomMistress") >= 0)) MistressDialog = "70";
		if (MistressDialog != "") {
			CharacterRelease(PandoraCurrentRoom.Character[0]);
			PandoraCurrentRoom.Character[0].RandomOdds = Math.random() - (SkillGetLevel(Player, "Infiltration") / 10);
			PandoraCurrentRoom.Character[0].AllowMove = false;
			PandoraCurrentRoom.Character[0].Stage = MistressDialog;
		}
	}

}

/**
 * Generates a chest randomly in the room cell (35% odds in cat burglar missions, 5% in other missions)
 * @param {PandoraBaseRoom} Room - The room in which the chest could be placed
 * @returns {void} - Nothing
 */
function PandoraCreateChest(Room) {
	if (!InfiltrationMissionState) return;
	if (Room.Background.indexOf("Cell") != 0) return;
	if ((PandoraChestCount == 0) && (Math.random() > ((InfiltrationMissionState.Mission == "CatBurglar") ? 0.50 : 0.1))) return;
	if ((PandoraChestCount >= 1) && (PandoraChestCount <= 3) && (Math.random() > ((InfiltrationMissionState.Mission == "CatBurglar") ? 0.33 : 0.05))) return;
	if ((PandoraChestCount >= 4) && (PandoraChestCount <= 6) && (Math.random() > ((InfiltrationMissionState.Mission == "CatBurglar") ? 0.20 : 0.03))) return;
	if ((PandoraChestCount >= 7) && (PandoraChestCount <= 10) && (Math.random() > ((InfiltrationMissionState.Mission == "CatBurglar") ? 0.13 : 0.02))) return;
	if ((PandoraChestCount >= 11) && (Math.random() > ((InfiltrationMissionState.Mission == "CatBurglar") ? 0.05 : 0.01))) return;
	PandoraChestCount++;
	let Char = PandoraGenerateNPC("Treasure", "Chest", TextGet("Chest"), false);
	Char.FixedImage = "Screens/Room/Pandora/Chest" + Math.floor(Math.random() * 3).toString() + ".png";
	Char.AllowMove = true;
	Room.Character.push(Char);
}

/**
 * Generates random rooms linked on the entry room
 * @param {PandoraBaseRoom} EntryRoom - The room object that's leading to that floor
 * @param {PandoraFloorDirection} DirectionFrom - The entry direction
 * @param {number} RoomLevel - The room level, the higher it goes, the higher the chances it will be a dead-end
 * @param {number} MaxRoom - The max number of rooms to generate.
 * @returns {void} - Nothing
 */
function PandoraGenerateRoom(EntryRoom, DirectionFrom, RoomLevel, MaxRoom) {
	if (!InfiltrationMissionState) return;

	// Over the max number of rooms, the dungeon layout is always invalid
	if (PandoraRoom.length >= MaxRoom) return;

	// The higher the room level, the less paths there will be
	let PathCount = 0;
	if (EntryRoom.Background.indexOf("Entrance") == 0) PathCount = 2 + Math.floor(Math.random() * 3);
	if (EntryRoom.Background.indexOf("Tunnel") == 0) PathCount = 1;
	if (EntryRoom.Background.indexOf("Fork") == 0) PathCount = 1 + Math.floor(Math.random() * 3);

	// Generates all paths
	let Path = [];
	for (let P = 0; P < PathCount; P++) {

		// Generates a valid path that's not already used
		let Continue = false;
		/** @type {number} */
		let PathNum;
		while (!Continue) {
			if (EntryRoom.Background.includes("Tunnel")) {
				PathNum = PandoraDirectionListFrom.indexOf(DirectionFrom);
				Continue = true;
			} else {
				PathNum = Math.floor(Math.random() * 4);
				Continue = (PandoraDirectionList.indexOf(DirectionFrom) !== PathNum && Path.indexOf(PathNum) < 0);
			}
		}
		PathNum ??= 0; // Shuts up TS about the delayed initialization
		Path.push(PathNum);

		// Generates a background for the room, tries not to repeat it and do not allow the same background as the previous room
		let RoomBack;
		Continue = false;
		while (!Continue) {
			RoomBack = "Cell";
			let DeadEndOdds = (RoomLevel - InfiltrationMissionState.Difficulty) * 0.25;
			if (RoomLevel <= 2) DeadEndOdds = 0;
			let TunnelOdds = 0.25 + (RoomLevel * 0.1);
			if (TunnelOdds > 0.75) TunnelOdds = 0.75;
			if (Math.random() >= DeadEndOdds) RoomBack = (Math.random() >= TunnelOdds) ? "Fork" : "Tunnel";
			if ((RoomBack == "Cell") && (Math.random() >= 0.9)) RoomBack = "Rest0";
			else RoomBack = RoomBack + Math.floor(Math.random() * 7);
			Continue = (RoomBack !== EntryRoom.Background);
			for (let R = 0; Continue && (R < PandoraRoom.length); R++)
				if ((PandoraRoom[R].Background == RoomBack) && (Math.random() >= 0.25))
					Continue = false;
		}
		RoomBack ??= ""; // Shuts up TS about the delayed initialization

		// Creates the room
		/** @type {PandoraBaseRoom} */
		let Room = {};
		Room.Character = [];
		Room.Floor = EntryRoom.Floor;
		Room.Background = RoomBack;
		PandoraCreateChest(Room);
		Room.Path = [];
		Room.PathMap = [];
		Room.PathMap.push(EntryRoom);
		Room.Direction = [];
		Room.DirectionMap = [];
		Room.DirectionMap.push(PandoraDirectionList[PathNum]);
		PandoraRoom.push(Room);
		EntryRoom.PathMap.push(Room);
		EntryRoom.DirectionMap.push(PandoraDirectionListFrom[PathNum]);

		// Creates sub-rooms if it's not a dead end room, generate the search and rest icon if needed
		if (RoomBack.indexOf("Cell") == 0) {
			if ((InfiltrationMissionState.Mission == "Retrieve") || (InfiltrationMissionState.Mission == "Steal")) {
				/** @type {PandoraSpecialRoom} */
				let SearchRoom = { Floor: "Search" };
				Room.Path.push(SearchRoom);
				Room.Direction.push("Search");
			}
			if (InfiltrationMissionState.Mission == "ReverseMaid") {
				/** @type {PandoraSpecialRoom} */
				let PaintRoom = { Floor: "Paint" };
				Room.Path.push(PaintRoom);
				Room.Direction.push("Paint");
			}
		} else if (RoomBack.indexOf("Rest") == 0) {
			/** @type {PandoraSpecialRoom} */
			let RestRoom = { Floor: "Rest" };
			Room.Path.push(RestRoom);
			Room.Direction.push("Rest");
		} else PandoraGenerateRoom(Room, PandoraDirectionListFrom[PathNum], RoomLevel + 1, MaxRoom);

	}

}

/**
 * Loads the Pandora's Box screen
 * @param {PandoraFloors} FloorName - The name of the floor in which we must generate rooms
 * @param {PandoraBaseRoom} EntryRoom - The room object that's leading to that floor
 * @param {PandoraFloorDirection} DirectionFrom - The entry direction
 * @param {PandoraFloorDirection} DirectionTo - The opposite direction
 * @param {number} MaxRoom - The maximum limit of rooms to generate.
 * @returns {void} - Nothing
 */
function PandoraGenerateFloor(FloorName, EntryRoom, DirectionFrom, DirectionTo, MaxRoom) {

	// Always create the same entrance room
	/** @type {PandoraBaseRoom} */
	let Room = {};
	Room.Character = [];
	Room.Floor = FloorName;
	Room.Background = "Entrance";
	Room.Path = [];
	Room.Path.push(EntryRoom);
	Room.PathMap = [];
	Room.Direction = [];
	Room.Direction.push(DirectionFrom);
	Room.DirectionMap = [];
	PandoraRoom.push(Room);
	EntryRoom.Path.push(Room);
	EntryRoom.Direction.push(DirectionTo);

	// Starts the room generation
	PandoraGenerateRoom(Room, DirectionFrom, 1, MaxRoom);

}

/**
 * Clears all the rooms and generates the main hall with an introduction maid
 * @returns {void} - Nothing
 */
function PandoraBuildMainHall() {
	if (!InfiltrationMissionState) return;
	// Creates the ground entrance room with a maid
	PandoraParty = [];
	/** @type {PandoraBaseRoom} */
	let Room = {};
	Room.Character = [];
	if (InfiltrationMissionState.Mission != "CatBurglar") {
		let Char = PandoraGenerateNPC("Entrance", "Maid", "RANDOM", false);
		if (InfiltrationMissionState.Mission == "ReverseMaid") Char.Stage = "40";
		else if (SkillGetLevel(Player, "Infiltration") >= 9) Char.Stage = "30";
		else if (SkillGetLevel(Player, "Infiltration") >= 6) Char.Stage = "20";
		else if (SkillGetLevel(Player, "Infiltration") >= 3) Char.Stage = "10";
		Room.Character.push(Char);
	}
	Room.Floor = "Ground";
	Room.Background = "Entrance";
	Room.PathMap = [];
	/** @type {PandoraSpecialRoom} */
	let ExitRoom = { Floor: "Exit" };
	Room.DirectionMap = [];

	// Generates the floors and sets the starting room, there's a min-max number of rooms based on difficulty
	let MinRoom = 25;
	let MaxRoom = 39;
	let MinChest = 0;
	if (InfiltrationMissionState.Mission == "CatBurglar") MinChest = InfiltrationMissionState.Difficulty + 2;
	if (InfiltrationMissionState.Difficulty == 1) { MinRoom = 35; MaxRoom = 59; }
	if (InfiltrationMissionState.Difficulty == 2) { MinRoom = 50; MaxRoom = 79; }
	if (InfiltrationMissionState.Difficulty == 3) { MinRoom = 70; MaxRoom = 109; }
	if (InfiltrationMissionState.Difficulty == 4) { MinRoom = 100; MaxRoom = 149; }
	PandoraRoom = [];
	while ((PandoraRoom.length < MinRoom) || (PandoraRoom.length > MaxRoom) || (PandoraChestCount < MinChest)) {
		PandoraChestCount = 0;
		PandoraRoom = [];
		Room.Path = [];
		Room.Path.push(ExitRoom);
		Room.Direction = [];
		Room.Direction.push("Exit");
		PandoraRoom.push(Room);
		PandoraGenerateFloor("Second", Room, "StairsDown", "StairsUp", MaxRoom);
		PandoraGenerateFloor("Underground", Room, "StairsUp", "StairsDown", MaxRoom);
	}
	PandoraCurrentRoom = Room;
	PandoraPreviousRoom = null;
	PandoraTargetRoom = /** @type {never} */ (null);

	// In reverse maid mission, we count the number of dead-end cell rooms that can be broken
	if (InfiltrationMissionState.Mission == "ReverseMaid") {
		PandoraReverseMaidDone = 0;
		PandoraReverseMaidTotal = 0;
		for (let R = 0; R < PandoraRoom.length; R++)
			if (PandoraRoom[R].Background.indexOf("Cell") == 0)
				PandoraReverseMaidTotal++;
	}

	// Pick a random cell room for the final target, generates special NPCs if needed
	while (PandoraTargetRoom == null) {
		Room = PandoraRoom[Math.floor(Math.random() * PandoraRoom.length)];
		if (Room.Background.indexOf("Cell") == 0) {
			if ((InfiltrationMissionState.Mission == "Retrieve") || (InfiltrationMissionState.Mission == "Steal")) {
				Room.ItemX = 50 + Math.floor(Math.random() * 1700);
				Room.ItemY = 50 + Math.floor(Math.random() * 900);
			}
			if (InfiltrationMissionState.Mission == "Rescue") {
				let Victim = PandoraGenerateNPC("Rescue", "Victim", InfiltrationMissionState.Name, true);
				if (InfiltrationMissionState.PrivateRoom && PrivateRansomCharacter) {
					Victim.Appearance = PrivateRansomCharacter.Appearance.slice(0);
					CharacterRefresh(Victim);
				} else {
					if (Math.random() >= 0.333) CharacterRandomUnderwear(Victim);
					else if (Math.random() >= 0.5) CharacterNaked(Victim);
					CharacterFullRandomRestrain(Victim, "LOT", true);
				}
				Room.Character.push(Victim);
				let Guard = PandoraGenerateNPC("Rescue", "Guard", "RANDOM", false);
				Room.PathMap[0].Character.push(Guard);
			}
			if (InfiltrationMissionState.Mission == "Kidnap") {
				let Target = PandoraGenerateNPC("Kidnap", "Target", InfiltrationMissionState.Name, true);
				Room.Character.push(Target);
			}
			PandoraTargetRoom = Room;
		}
	}

}

/**
 * Removes the current character from the room and deletes that NPC from the array
 * @returns {void} - Nothing
 */
function PandoraRemoveCurrentCharacter() {
	if (!CurrentCharacter) return;
	for (let C = 0; C < PandoraCurrentRoom.Character.length; C++)
		if (PandoraCurrentRoom.Character[C].ID === CurrentCharacter.ID) {
			PandoraCurrentRoom.Character.splice(C, 1);
			break;
		}
	CharacterDelete(CurrentCharacter);
	DialogLeave();
}

/**
 * Flags the current character to allow moves and exits any dialog with her
 * @returns {void} - Nothing
 */
function PandoraCharacterAllowMove() {
	if (!CurrentCharacter) return;
	CurrentCharacter.AllowMove = true;
	DialogLeave();
}

/**
 * When the current character joins the player's party
 * @returns {void} - Nothing
 */
function PandoraCharacterJoin() {
	if (!CurrentCharacter) return;
	CurrentCharacter.AllowMove = true;
	if (PandoraParty.length == 1)
		PandoraCurrentRoom.Character.push(PandoraParty[0]);
	PandoraParty = [];
	PandoraParty.push(/** @type {NPCCharacter} */ (CurrentCharacter));
	for (let C = 0; C < PandoraCurrentRoom.Character.length; C++)
		if (PandoraCurrentRoom.Character[C].ID == CurrentCharacter.ID) {
			PandoraCurrentRoom.Character.splice(C, 1);
			break;
		}
}

/**
 * When the current character leaves the player's party
 * @returns {void} - Nothing
 */
function PandoraCharacterLeave() {
	PandoraCurrentRoom.Character.push(/** @type {NPCCharacter} */ (CurrentCharacter));
	PandoraParty = [];
}

/**
 * When the current character starts to fight against the player
 * @returns {void} - Nothing
 */
function PandoraCharacterFight() {
	if (!InfiltrationMissionState || !CurrentCharacter) return;
	PandoraFightCharacter = /** @type {NPCCharacter} */ (CurrentCharacter);
	let Difficulty = (InfiltrationMissionState.Difficulty * 2) + Math.floor(Math.random() * 3);
	if (CurrentCharacter.AccountName.indexOf("RandomMistress") >= 0) Difficulty = InfiltrationMissionState.Difficulty + 6;
	KidnapStart(CurrentCharacter, PandoraBackground, Difficulty, (victory) => CommonPromiseCatch(PandoraCharacterFightEnd(victory)));
}

/**
 * Resolves the fight between the player and the current character
 * @param {boolean} victory - Wether the player won or not
 * @returns {SafePromise<void>} - Nothing
 */
async function PandoraCharacterFightEnd(victory) {
	if (!PandoraFightCharacter) return;
	CharacterSetCurrent(PandoraFightCharacter);
	if (!CurrentCharacter) return;
	SkillProgress(Player, "Willpower", KidnapSuccessWillpowerProgress(CurrentCharacter));
	PandoraWillpower = Player.KidnapWillpower ?? 0;
	if (InfiltrationPerksActive("Recovery")) {
		PandoraWillpower = PandoraWillpower + Math.round(PandoraMaxWillpower / 10);
		if (PandoraWillpower > PandoraMaxWillpower) PandoraWillpower = PandoraMaxWillpower;
	}
	CurrentCharacter.Stage = (KidnapVictory) ? "100" : "200";
	CharacterRelease(victory ? Player : CurrentCharacter);
	CurrentCharacter.AllowItem = victory;
	if (victory) CurrentCharacter.AllowMove = true;
	if (victory && (PandoraClothes != "Random") && (PandoraClothes != "CatBurglar") && (PandoraClothes != "Cosplay")) PandoraDress(Player, PandoraClothes);
	await CommonSetScreen("Room", "Pandora");
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, victory ? "FightVictory" : "FightDefeat");
}

/**
 * When the mission fails, we go back to the infiltration room
 * @returns {void} - Nothing
 */
function PandoraMissionFail() {
	if (!InfiltrationMissionState) return;
	InfiltrationMissionState.Fail = true;
	InfiltrationMissionState.Found = false;
	CharacterRelease(Player);
	CommonSetScreen("Room", "Infiltration");
	DialogLeave();
}

/**
 * When the player must walk back to the previous room he entered from
 * @returns {void} - Nothing
 */
function PandoraWalkBack() {
	if (PandoraPreviousRoom == null) return;
	PandoraCurrentRoom = PandoraPreviousRoom;
	PandoraPreviousRoom = null;
	DialogLeave();
}

/**
 * When the player must strips the current character
 * @returns {void} - Nothing
 */
function PandoraCharacterNaked() {
	if (!CurrentCharacter) return;
	CharacterNaked(CurrentCharacter);
}

/**
 * When the player changes in the clothes of someone else (type)
 * @param {string} Type - The type of character to dress as (ex: Guard)
 * @returns {void} - Nothing
 */
function PandoraPlayerClothes(Type) {
	CharacterAppearanceStripLayer(Player);
	PandoraDress(Player, Type);
	PandoraClothes = Type;
}

/**
 * The player can only try once to recruit a random NPC, the odds are set when conversation starts
 * @returns {void} - Nothing
 */
function PandoraStartRecruit() {
	if (!CurrentCharacter) return;
	CurrentCharacter.Recruit = Math.random();
}

/**
 * Increases the infiltration skill on some events
 * @param {number} Progress - The progression factor
 * @returns {void} - Nothing
 */
function PandoraInfiltrationChange(Progress) {
	if (!InfiltrationMissionState) return;
	if (InfiltrationMissionState.Difficulty == 1) Progress = Math.round(Progress * 1.5);
	if (InfiltrationMissionState.Difficulty == 2) Progress = Math.round(Progress * 2.25);
	if (InfiltrationMissionState.Difficulty == 3) Progress = Math.round(Progress * 3);
	if (InfiltrationMissionState.Difficulty == 4) Progress = Math.round(Progress * 4);
	SkillProgress(Player, "Infiltration", Progress);
}

/**
 * Checks if the player can bring the NPC to her private room
 * @returns {boolean} - Returns true if the player can
 */
function PandoraCanJoinPrivateRoom() { return PrivateHasEmptySlot(); }

/**
 * When a random NPC joins the player private room, we add that character and exits the dialog
 * @returns {void} - Nothing
 */
function PandoraCharacterJoinPrivateRoom() {
	if (!CurrentCharacter || !CurrentCharacter.IsNpc()) return;
	const C = PrivateAddCharacter(CurrentCharacter, (CurrentCharacter.Archetype === "Slave") ? "Submissive" : null);
	C.FromPandora = true;
	PandoraRemoveCurrentCharacter();
}

/**
 * Checks if the mission is the one provided in the parameter
 * @param {InfiltrationMissionType} Type - The mission type
 * @returns {boolean} - Returns TRUE if it's the current mission
 */
function PandoraMissionIs(Type) { return (InfiltrationMissionState?.Mission === Type); }

/**
 * Checks if the perk specified is currently selected
 * @param {InfiltrationPerks} Type - The perk type
 * @returns {boolean} - Returns TRUE if it's selected
 */
function PandoraHasPerk(Type) { return InfiltrationPerksActive(Type); }

/**
 * Prepares an information text based on the bribe amount provided
 * @param {number} Amount - The bribe amount
 * @param {"Little" | "Full"} Type - The perk type
 * @returns {void} - Nothing
 */
function PandoraBribeInfo(Amount, Type) {
	if (!CurrentCharacter || !InfiltrationMissionState) return;
	CharacterChangeMoney(Player, Amount * -1);
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "BribeInfo" + InfiltrationMissionState.Mission + Type);
	CurrentCharacter.CurrentDialog = CurrentCharacter.CurrentDialog.replace("LevelName", TextGet("LevelName" + PandoraTargetRoom.Floor));
	let Room = PandoraTargetRoom;
	while (Room.PathMap[0].Background.indexOf("Entrance") != 0)
		Room = Room.PathMap[0];
	let Dir = Room.DirectionMap[0];
	Dir = PandoraDirectionListFrom[PandoraDirectionList.indexOf(Dir)];
	CurrentCharacter.CurrentDialog = CurrentCharacter.CurrentDialog.replace("FirstDirection", TextGet("FirstDirection" + Dir));
}

/**
 * Some dialog activities can boost the recruitment odds
 * @returns {void} - Nothing
 */
function PandoraRecruitBoost() {
	if (!CurrentCharacter) return;
	if ((CurrentCharacter.RecruitOdds ?? 0) >= 0.75)
		CurrentCharacter.RecruitOdds = (CurrentCharacter.RecruitOdds ?? 0) - 0.05;
}

/**
 * Starts the player punishment process and jumps to the punishment Dominatrix
 * @param {boolean} [FromKidnapper]
 * @param {string} [FixIntro]
 * @returns {void} - Nothing
 */
function PandoraPunishmentIntro(FromKidnapper, FixIntro) {
	if (!CurrentCharacter) return;
	let IntroText = FixIntro ?? "";
	if (FixIntro == null) {
		if (SkillGetLevel(Player, "Infiltration") >= 8) IntroText = DialogFind(CurrentCharacter, "Punishment8");
		else if (SkillGetLevel(Player, "Infiltration") >= 5) IntroText = DialogFind(CurrentCharacter, "Punishment5");
		else if (SkillGetLevel(Player, "Infiltration") >= 2) IntroText = DialogFind(CurrentCharacter, "Punishment2");
		else IntroText = DialogFind(CurrentCharacter, "Punishment0");
	}
	PandoraBackground = "Pandora/Underground/Cell" + Math.floor(Math.random() * 7).toString();
	let Dominatrix = PandoraGenerateNPC("Punishment", "Mistress", "RANDOM", false);
	if (SkillGetLevel(Player, "Infiltration") >= 2) Dominatrix.Stage = "20";
	if (SkillGetLevel(Player, "Infiltration") >= 5) Dominatrix.Stage = "50";
	if (SkillGetLevel(Player, "Infiltration") >= 8) Dominatrix.Stage = "80";
	if ((FromKidnapper != null) && FromKidnapper) Dominatrix.Stage = "200";
	CharacterSetCurrent(Dominatrix);
	CurrentCharacter.CurrentDialog = IntroText;
	if (InfiltrationMissionState) {
		InfiltrationMissionState.Fail = true;
		InfiltrationMissionState.Found = false;
	}
}

/**
 * Puts the player in lots of random restraints
 * @returns {void} - Nothing
 */
function PandoraRestrainPlayer() {
	CharacterFullRandomRestrain(Player, "LOT", true);
}

/**
 * When the player purchases a drink from the maid, she can heal by the money value
 * @param {number} Money
 * @returns {void} - Nothing
 */
function PandoraBuyMaidDrink(Money) {
	if (!CurrentCharacter) return;
	CharacterChangeMoney(Player, Money * -1);
	if (CurrentCharacter.DrinkValue == null) CurrentCharacter.DrinkValue = 0;
	if (Money > CurrentCharacter.DrinkValue) {
		PandoraWillpower = PandoraWillpower + Money - CurrentCharacter.DrinkValue;
		if (PandoraWillpower > PandoraMaxWillpower) PandoraWillpower = PandoraMaxWillpower;
		CurrentCharacter.DrinkValue = Money;
	}
}

/**
 * Generates new random odds for a character, based on Pandora's difficulty
 * @returns {void} - Nothing
 */
function PandoraCharacterGenerateRandomOdds() {
	if (!CurrentCharacter || !InfiltrationMissionState) return;
	CurrentCharacter.RandomOdds = Math.random() + 0.2 - (InfiltrationMissionState.Difficulty * 0.1);
}

/**
 * Starts the guard quiz, the player needs 5 good answers to be let go
 * @returns {void} - Nothing
 */
function PandoraQuizStart() {
	if (!CurrentCharacter) return;
	CurrentCharacter.QuizLog = [];
	CurrentCharacter.QuizFail = 0;
	PandoraQuizNext();
}

/**
 * Generates questions that guards will challenge the player with
 * @returns {void} - Nothing
 */
function PandoraQuizNext() {
	if (!CurrentCharacter) return;
	let Question = Math.floor(Math.random() * 11);
	CurrentCharacter.QuizLog ??= [];
	while (CurrentCharacter.QuizLog.indexOf(Question) >= 0)
		Question = Math.floor(Math.random() * 11);
	CurrentCharacter.QuizLog.push(Question);
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "QuizQuestion" + Question.toString());
	CharacterRefreshDialog(CurrentCharacter);
}

/**
 * When the player gives an answer to the guard quiz, the guard will give a visual hint if the answer is incorrect
 * @param {number} Answer
 * @returns {void} - Nothing
 */
function PandoraQuizAnswer(Answer) {
	if (!CurrentCharacter) return;
	CurrentCharacter.QuizFail ??= 1;
	CurrentCharacter.QuizLog ??= [];
	if (Answer != 1) {
		CurrentCharacter.QuizFail++;
		CharacterSetFacialExpression(CurrentCharacter, "Blush", "Low", 3);
		CharacterSetFacialExpression(CurrentCharacter, "Eyes", "Angry", 3);
		CharacterSetFacialExpression(CurrentCharacter, "Eyes2", "Angry", 3);
	}
	if (CurrentCharacter.QuizLog.length >= 5) {
		CurrentCharacter.Stage = (CurrentCharacter.QuizFail >= 2) ? "Arrest" : "30";
		CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, (CurrentCharacter.QuizFail >= 2) ? "QuizFail" : "QuizSuccess");
	} else PandoraQuizNext();
}

/**
 * When the player gets ungagged by an NPC, we remove everything on the head
 * @returns {void} - Nothing
 */
function PandoraPlayerUngag() {
	InventoryRemove(Player, "ItemHead");
	InventoryRemove(Player, "ItemHood");
	InventoryRemove(Player, "ItemNose");
	InventoryRemove(Player, "ItemMouth");
	InventoryRemove(Player, "ItemMouth2");
	InventoryRemove(Player, "ItemMouth3");
}

/**
 * Sets the punishment sentence in minutes
 * @param {string|number} Minutes
 * @returns {void} - Nothing
 */
function PandoraPunishmentSentence(Minutes) {
	const minutes = typeof Minutes === "string" ? CommonParseInt(Minutes) : CommonIsNonNegativeInteger(Minutes) ? Minutes : null;
	if (minutes === null) return;
	Player.Infiltration.Punishment = {
		Minutes: minutes,
		Background: PandoraBackground,
		// Because this might be a punishment from being brought to Pandora by losing a kidnap game
		Difficulty: InfiltrationMissionState?.Difficulty ?? 0,
	};
}

/**
 * Starts the single-player punishment
 * @returns {SafePromise<void>} - Nothing
 */
async function PandoraPunishmentStart() {
	if (!Player.Infiltration.Punishment) return;
	PandoraWillpower = 0;
	Player.Infiltration.Punishment.Timer = CurrentTime + (Player.Infiltration.Punishment.Minutes * MS_PER_MIN);
	ServerSend("AccountUpdate", { Infiltration: Player.Infiltration });
	DialogLeave();
	await CommonSetScreen("Room", "PandoraPrison");
}

/**
 * Prepares the multi-player punishment
 * @returns {void} - Nothing
 */
function PandoraPenitentiaryPrepare() {
	if (!Player.Infiltration.Punishment) return;
	PandoraPenitentiaryStart(Player.Infiltration.Punishment.Minutes, "I");
}

/**
 * Starts the multi-player punishment
 * @param {number} Minutes - The number of minutes for the sentence
 * @param {string} Role - The role to take (I for Inmate, G for guard)
 * @returns {void} - Nothing
 */
function PandoraPenitentiaryStart(Minutes, Role) {
	if (!PandoraPenitentiaryIsGuard(Player) && !PandoraPenitentiaryIsInmate(Player)) {
		if (Player.Game.Prison == null) Player.Game.Prison = {};
		Player.Game.Prison.Timer = Math.round(CurrentTime + (Minutes * 60 * 1000));
		Player.Game.Prison.Role = Role;
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	}
	DialogLeave();
	CommonSetScreen("Room", "MainHall");
}

/**
 * Checks if the current character is currently a Pandora Penitentiary inmate (I)
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if sentence is active and role is inmate
 */
function PandoraPenitentiaryIsInmate(C) {
	return (C.Game?.Prison?.Timer ?? 0) > CurrentTime && C.Game?.Prison?.Role === "I";
}

/**
 * Checks if the current character is currently a Pandora Penitentiary guard (G)
 * @param {Character} C - The character to evaluate
 * @returns {boolean} - TRUE if shift is active and role is guard
 */
function PandoraPenitentiaryIsGuard(C) {
	return (C.Game?.Prison?.Timer ?? 0) > CurrentTime && C.Game?.Prison?.Role === "G";
}

/**
 * Called from MainHall and ChatSearch - Checks if we must create the Pandora prison and creates it
 * @returns {SafePromise<void>}
 */
async function PandoraPenitentiaryCreate() {

	// Exits right away if the prison should not be loaded, there's a 10 seconds delay between each retry
	if (PandoraPenitentiaryCreateTimer > CommonTime() || CurrentCharacter != null || ServerPlayerIsInChatRoom()) return;

	// The guard can be assigned to create a new prison cell
	if (PandoraPenitentiaryIsGuard(Player)) {
		if (PandoraPenitentiaryStartNewRoom) {
			PandoraPenitentiaryResult([]);
			PandoraPenitentiaryStartNewRoom = false;
		}
	} else if (PandoraPenitentiaryIsInmate(Player)) {
		PandoraPenitentiaryCreateTimer = CommonTime() + 10000;
		PandoraPenitentiaryActivityTimer = CommonTime() + MS_PER_MIN + Math.random() * 240000;

		// The inmate first search for a prison that already exists
		await ChatSearchStart(ChatRoomSpaceType.MIXED, ["Room", "Infiltration"], {
			BackgroundTagList: [BackgroundsTagPandora],
			Game: "Prison",
		});
		ChatSearchQuery("");
	}
}

/**
 * Intercept chat results and auto-join Pandora room if currently in the Penitentiary
 * This function expects to only be called with the ChatSearch screen running
 * @param {ServerChatRoomSearchResultResponse} Result - The result of the search
 * @returns {void} - Nothing
 */
function PandoraPenitentiaryResult(Result) {

	// Exits right away if already in a chat room
	if (ServerPlayerIsInChatRoom()) return;

	// Neither a guard nor an inmate, ignore
	if (!PandoraPenitentiaryIsInmate(Player) && !PandoraPenitentiaryIsGuard(Player)) return;

	// Prepares a list of all available prisons, do not return in a room where we used a safeword
	let List = Result.filter(
		room => room.Name.startsWith("Pandora")
		&& room.Game === "Prison"
		&& room.MemberCount < room.MemberLimit
		&& !PandoraPenitentiarySafewordRooms.includes(room.Name)
	);

	// There are some matches, join a random one
	if (List.length > 0) {
		ServerSend("ChatRoomJoin", { Name: CommonGetRandomItemFromList(List).Name });
		return;
	}

	// Since we did not found any prison, we Setup the parameters for a new one
	PandoraPenitentiaryCreateTimer = CommonTime() + 10000;

	// Creates the prison chat room
	/** @type {ChatRoomSettings} */
	const NewRoom = {
		Name: "Pandora " + Math.round(Math.random() * 1000000000).toString(),
		Description: "Pandora Penitentiary Cell",
		Background: CommonGetRandomItemFromList(["PrisonHall", "PandoraCell0", "PandoraCell1", "PandoraCell2", "PandoraCell3", "PandoraCell4", "PandoraCell5", "PandoraCell6"]),
		Visibility: ChatRoomVisibilityMode.PUBLIC,
		Access: ChatRoomAccessMode.PUBLIC,
		Limit: 10,
		Space: ChatRoomSpaceType.MIXED,
		Game: "Prison",
		Admin: [],
		Whitelist: [],
		Ban: [],
		BlockCategory: ["Leashing"],
		Language: ChatAdminDefaultLanguage,
	};
	ServerSend("ChatRoomCreate", NewRoom);
}

/**
 * Returns TRUE if the group is available for an Onlin Pandora Prison activity
 * @param {Character} C - The character to evaluate
 * @param {AssetGroupItemName} Group - The item group name
 * @param {boolean} SkipBlock - If we should skip the GroupIsBlocked validation
 * @returns {boolean} - TRUE if the group is available
 */
function PandoraGroupAvailable(C, Group, SkipBlock = false) {
	let Item = InventoryGet(C, Group);
	if (Item == null) return true;
	if (!SkipBlock && InventoryGroupIsBlocked(C, Group)) return false;
	return !InventoryOwnerOnlyItem(Item) && !InventoryLoverOnlyItem(Item) && !InventoryFamilyOnlyItem(Item);
}

/**
 * Sets a proper minimal difficulty for the new item set in Online Pandora Prison
 * @param {Character} C - The character to evaluate
 * @param {AssetGroupItemName} Group - The item group name
 * @param {number} Level - The infiltration level, the higher it gets the harder the difficulty will be
 * @returns {void} - Nothing
 */
function PandoraPenitentiaryItemDifficulty(C, Group, Level) {
	let Item = InventoryGet(C, Group);
	if (Item == null) return;
	Level = Level + (((Group == "ItemArms") || (Group == "ItemDevices")) ? 6 : 3);
	let Difficulty = Math.floor(Level + Math.random() * Level * 0.5);
	if ((Item.Difficulty == null) || (Item.Difficulty < Difficulty)) Item.Difficulty = Difficulty;
}

/**
 * Builds a list of all valid Pandora activities for the player
 * @param {Character} C - The character to build a list for
 * @returns {readonly string[]} - An array of all valid activities for the player
 */
function PandoraPenitentiaryBuildActivityList(C) {

	// Picks a random activity to do on the player
	let Level = SkillGetLevel(Player, "Infiltration");
	let ActivityList = ["Bondage", "Spank", "Hose"];
	let Device = InventoryGet(C, "ItemDevices");
	let InPandoraCase = ((Device != null) && (Device.Asset != null) && (Device.Asset.Name != null) && (PandoraPenitentiaryCageList.includes(Device.Asset.Name)));

	// Adds more possible activities to the random pool
	if (!C.IsGagged()) ActivityList.push("Gag");
	if (C.IsGagged() && PandoraGroupAvailable(C, "ItemMouth", true) && PandoraGroupAvailable(C, "ItemMouth2", true) && PandoraGroupAvailable(C, "ItemMouth3", true) && PandoraGroupAvailable(C, "ItemHead", true) && PandoraGroupAvailable(C, "ItemHood", true)) ActivityList.push("Ungag");
	if (!C.IsEnclose() && !InPandoraCase && (C.PoseMapping.BodyFull !== "Hogtied") && (Level >= 3) && PandoraGroupAvailable(C, "ItemArms")) ActivityList.push("Hogtie");
	if (!C.IsEnclose() && !InPandoraCase && !InventoryIsWorn(C, "ItemArms", "HempRope") && PandoraGroupAvailable(C, "ItemArms")) ActivityList.push("Shibari");
	if (!InventoryIsWorn(C, "ItemArms", ["PrisonLockdownSuit", "TransportJacket", "FullLatexSuit", "PrisonSJ"]) && !C.HasPenis() && PandoraGroupAvailable(C, "ItemArms")) ActivityList.push("Detain");
	if (!C.IsNaked()) ActivityList.push("Naked");
	if (!C.IsVulvaChaste() && !C.HasPenis() && (InventoryGet(C, "ItemPelvis") == null) && !InventoryGroupIsBlocked(C, "ItemPelvis")) ActivityList.push("Chastity");
	if (C.IsVulvaChaste() && !C.HasPenis() && PandoraGroupAvailable(C, "ItemPelvis")) ActivityList.push("Unchaste");
	if (InventoryHasLockableItems(C)) ActivityList.push("Lock");
	if (InventoryCharacterIsWearingLock(C, "MetalPadlock") || InventoryCharacterIsWearingLock(C, "IntricatePadlock") || InventoryCharacterIsWearingLock(C, "ExclusivePadlock") || InventoryCharacterIsWearingLock(C, "HighSecurityPadlock") || InventoryCharacterIsWearingLock(C, "PandoraPadlock")) ActivityList.push("Unlock");
	if (C.IsRestrained()) ActivityList.push("Release");
	if (Device == null) ActivityList.push("Cage");
	if (InPandoraCase && PandoraGroupAvailable(C, "ItemDevices")) ActivityList.push("Uncage");

	// Returns the full list of all valid activities
	return ActivityList;

}

/**
 * Runs the selected activity inmate activity for the player
 * @param {string} Activity - The activity to run
 * @returns {void} - Nothing
 */
function PandoraPenitentiaryActivityRun(Activity) {

	// Sets the next random guard activity time
	PandoraPenitentiaryActivityTimer = CommonTime() + MS_PER_MIN + Math.random() * 240000;

	// The higher the level, the stronger the lock type to use
	let Level = SkillGetLevel(Player, "Infiltration");
	/** @type {AssetLockType} */
	let LockType = "MetalPadlock";
	if (Level >= 8) LockType = "PandoraPadlock";
	else if (Level >= 6) LockType = "HighSecurityPadlock";
	else if (Level >= 4) LockType = "ExclusivePadlock";
	else if (Level >= 2) LockType = "IntricatePadlock";

	// A few activities releases some locks first
	if ((Activity == "Unlock") || (Activity == "Release") || (Activity == "Bondage") || (Activity == "Shibari") || (Activity == "Detain") || (Activity == "Hogtie") || (Activity == "Naked")) {
		CharacterReleaseFromLock(Player, "MetalPadlock");
		CharacterReleaseFromLock(Player, "IntricatePadlock");
		CharacterReleaseFromLock(Player, "ExclusivePadlock");
		CharacterReleaseFromLock(Player, "HighSecurityPadlock");
		CharacterReleaseFromLock(Player, "PandoraPadlock");
	}

	// Bondage - Puts the player in restraints, heavier restraints based on inflitration level
	if (Activity == "Bondage") {
		CharacterReleaseNoLock(Player);
		if (Level <= 1) CharacterFullRandomRestrain(Player, "FEW");
		else if (Level <= 4) CharacterFullRandomRestrain(Player);
		else if (Level <= 7) CharacterFullRandomRestrain(Player, "LOT");
		else CharacterFullRandomRestrain(Player, "ALL");
		PandoraPenitentiaryItemDifficulty(Player, "ItemArms", Level);
		PandoraPenitentiaryItemDifficulty(Player, "ItemHead", Level);
		PandoraPenitentiaryItemDifficulty(Player, "ItemMouth", Level);
		PandoraPenitentiaryItemDifficulty(Player, "ItemNeck", Level);
		PandoraPenitentiaryItemDifficulty(Player, "ItemLegs", Level);
		PandoraPenitentiaryItemDifficulty(Player, "ItemFeet", Level);
	}

	// Spank - Spanks the player - Only changes the facial expression
	if (Activity == "Spank") {
		CharacterSetFacialExpression(Player, "Blush", "High", 15);
		CharacterSetFacialExpression(Player, "Eyes", "Surprised", 15);
	}

	// Hose - Hoses the player with cold water - Only changes the facial expression
	if (Activity == "Hose") {
		CharacterSetFacialExpression(Player, "Blush", "ShortBreath", 15);
		CharacterSetFacialExpression(Player, "Eyes", "Angry", 15);
	}

	// Shibari - Strips the player and rope her up
	if (Activity == "Shibari") {
		CharacterReleaseNoLock(Player);
		CharacterNaked(Player);
		ShibariRandomBondage(Player, Math.floor((Level / 3) + 1));
		PandoraPenitentiaryItemDifficulty(Player, "ItemArms", Level);
	}

	// Detain - Dress the player in prison clothes / restraints
	if (Activity == "Detain") {
		CharacterReleaseNoLock(Player);
		CharacterNaked(Player);
		InventoryWear(Player, CommonGetRandomItemFromList(["PrisonLockdownSuit", "TransportJacket", "FullLatexSuit", "PrisonSJ"]), "ItemArms");
		InventoryLock(Player, "ItemArms", LockType);
		PandoraPenitentiaryItemDifficulty(Player, "ItemArms", Level);
		if ((Level >= 2) && (InventoryGet(Player, "ItemFeet") == null) && !InventoryGroupIsBlocked(Player, "ItemFeet")) {
			InventoryWear(Player, CommonGetRandomItemFromList(["BallChain", "AnkleShackles"]), "ItemFeet");
			InventoryLock(Player, "ItemFeet", LockType);
			PandoraPenitentiaryItemDifficulty(Player, "ItemFeet", Level);
		}
		if ((Level >= 5) && (InventoryGet(Player, "ItemMouth") == null) && !InventoryGroupIsBlocked(Player, "ItemMouth")) {
			InventoryWear(Player, "PrisonLockdownGag", "ItemMouth");
			InventoryLock(Player, "ItemMouth", LockType);
			PandoraPenitentiaryItemDifficulty(Player, "ItemMouth", Level);
		}
		if ((Level >= 8) && (InventoryGet(Player, "ItemHead") == null) && !InventoryGroupIsBlocked(Player, "ItemHead")) {
			InventoryWear(Player, "PrisonLockdownBlindfold", "ItemHead");
			InventoryLock(Player, "ItemHead", LockType);
			PandoraPenitentiaryItemDifficulty(Player, "ItemHead", Level);
		}
	}

	// Gag - Gags the player with a random mouth item
	if (Activity == "Gag") {
		InventoryWearRandom(Player, "ItemMouth");
		InventoryLock(Player, "ItemMouth", LockType);
		PandoraPenitentiaryItemDifficulty(Player, "ItemMouth", Level);
	}

	// Ungag - Remove hoods and mouth items from the player
	if (Activity == "Ungag") {
		InventoryRemove(Player, "ItemMouth");
		InventoryRemove(Player, "ItemMouth2");
		InventoryRemove(Player, "ItemMouth3");
		InventoryRemove(Player, "ItemHead");
		InventoryRemove(Player, "ItemHood");
	}

	// Hogtie - Puts the player in chains and hogtie her, at higher levels she gets suspended
	if (Activity == "Hogtie") {

		// Adds chains to the player and locks them
		CharacterReleaseNoLock(Player);
		if (InventoryGet(Player, "ItemArms") == null) {
			InventoryWear(Player, "Chains", "ItemArms");
			InventoryLock(Player, "ItemArms", LockType);
			PandoraPenitentiaryItemDifficulty(Player, "ItemArms", Level);
		}
		if (InventoryGet(Player, "ItemLegs") == null) {
			InventoryWear(Player, "Chains", "ItemLegs");
			InventoryLock(Player, "ItemLegs", LockType);
			PandoraPenitentiaryItemDifficulty(Player, "ItemLegs", Level);
		}
		if (InventoryGet(Player, "ItemFeet") == null) {
			InventoryWear(Player, "Chains", "ItemFeet");
			InventoryLock(Player, "ItemFeet", LockType);
			PandoraPenitentiaryItemDifficulty(Player, "ItemFeet", Level);
		}

		// At level 7 or more the player gets suspended
		if (Level < 7) {
			TypedItemSetOptionByName(Player, "ItemArms", "Hogtied");
		} else {
			const item = InventoryGet(Player, "ItemArms");
			if (item) {
				TypedItemSetOptionByName(Player, item, "SuspensionHogtied");
				const Height = 0.67 * Math.random();
				item.Property.OverrideHeight = {
					Height: Height * (Pose.find(p => p.Name == "Hogtied")?.OverrideHeight?.Height ?? 1),
					HeightRatioProportion: Height,
					Priority: 0,
				};
			}
		}

	}

	// Naked - Strips the player and prevents changing for (Level + 2) minutes
	if (Activity == "Naked") {
		CharacterReleaseNoLock(Player);
		CharacterNaked(Player);
		const currentTimer = Player.Game.Prison?.Timer ?? 0;
		let Time = CurrentTime + MS_PER_MIN * (Level + 2);
		if (Time > currentTimer) Time = currentTimer;
		LogAdd("BlockChange", "Rule", Time);
	}

	// Lock - Locks all lockable items of the player in a specific lock
	if (Activity == "Lock") {
		InventoryFullLock(Player, LockType);
	}

	// Chastity - Puts the player in a chastity belt and locks it
	if (Activity == "Chastity") {
		InventoryWearRandom(Player, "ItemPelvis", undefined, null, false, true, PrivateBeltList, true);
		InventoryLock(Player, "ItemPelvis", LockType, null);
		PandoraPenitentiaryItemDifficulty(Player, "ItemPelvis", Level);
	}

	// Unchaste - Removes the chastity belt from the player
	if (Activity == "Unchaste") {
		InventoryRemove(Player, "ItemPelvis");
	}

	// Release - Releases the player from all non-locked restraints
	if (Activity == "Release") {
		CharacterReleaseNoLock(Player);
	}

	// Cage - Puts the player in a random cage from ItemDevices group
	if (Activity == "Cage") {
		InventoryWear(Player, CommonGetRandomItemFromList(PandoraPenitentiaryCageList), "ItemDevices");
		PandoraPenitentiaryItemDifficulty(Player, "ItemDevices", Level);
	}

	// Uncage - Releases the player from the ItemDevices group
	if (Activity == "Uncage") {
		InventoryRemove(Player, "ItemDevices");
	}

	// Publishes the activity to everyone in chat
	ChatRoomCharacterUpdate(Player);

}

/**
 * Runs the pandora prison events
 * @returns {void} - Nothing
 */
function PandoraPenitentiaryRun() {

	// Exits right away if Pandora Penitentiary isn't active or not ready to run
	if (!PandoraPenitentiaryIsInmate(Player) || (CurrentScreen != "ChatRoom") || (PandoraPenitentiaryActivityTimer > CommonTime())) return;

	// Finds a proper activity based on the player current predicament and infiltration level
	let ActivityList = PandoraPenitentiaryBuildActivityList(Player);
	let Activity = CommonGetRandomItemFromList(ActivityList);

	// Runs and publishes the activity to everyone in chat
	PandoraPenitentiaryActivityRun(Activity);
	const Dict = new DictionaryBuilder().targetCharacter(Player).build();
	ServerSend("ChatRoomChat", { Content: "PandoraActivity" + Activity, Type: "Action", Dictionary: Dict });

}

/**
 * Runs the pandora command from the online chat box
 * @param {string} Activity - The activity to validate
 * @returns {void} - Nothing
 */
function PandoraPenitentiaryDoActivity(Activity) {

	// Make sure the source/player is a guard first
	if (!PandoraPenitentiaryIsGuard(Player))
		return ChatRoomSendLocal(TextGet("PandoraInvalidSource"), 10_000);

	// Make sure the target is an inmate
	let Target = ChatRoomCharacter.find(c => c.MemberNumber === ChatRoomTargetMemberNumber);
	if ((Target != null) && !PandoraPenitentiaryIsInmate(Target))
		return ChatRoomSendLocal(TextGet("PandoraInvalidTarget"), 10_000);

	if (Activity.toLowerCase() === "help") {
		let helpMsg = TextGet("PandoraActivityHelp") + "\n";
		helpMsg += PandoraPenitentiaryActivityList.map(a => `- ${a.toLowerCase()}`).join("\n");
		ChatRoomSendLocal(helpMsg, 10_000);
		return;
	}

	// Make sure the activity is valid
	Activity = Activity.trim();
	Activity = Activity.charAt(0).toUpperCase() + Activity.substring(1).toLowerCase();
	if (!PandoraPenitentiaryActivityList.includes(Activity)) {
		ChatRoomSendLocal(TextGet("PandoraInvalidActivity"), 10_000);
		return;
	}

	// Make sure the activity can be run on that target
	if (Target != null) {
		let ActivityList = PandoraPenitentiaryBuildActivityList(Target);
		if (!ActivityList.includes(Activity))
			return ChatRoomSendLocal(TextGet("PandoraInvalidActivityForTarget"), 10_000);
	}

	// Tries to find a target and publishes the activity in the local chat
	if (Target == null) {
		let Dict = new DictionaryBuilder().sourceCharacter(Player).build();
		ServerSend("ChatRoomChat", { Content: "PandoraGuardActivity" + Activity + "All", Type: "Action", Dictionary: Dict });
		ServerSend("ChatRoomChat", { Content: "Pandora" + Activity + "|ALL", Type: "Hidden"});
	} else {
		let Dict = new DictionaryBuilder().sourceCharacter(Player).targetCharacter(Target).build();
		ServerSend("ChatRoomChat", { Content: "PandoraGuardActivity" + Activity, Type: "Action", Dictionary: Dict });
		ServerSend("ChatRoomChat", { Content: "Pandora" + Activity + "|" + Target.MemberNumber, Type: "Hidden", Target: Target.MemberNumber});
	}

}

/**
 * Called from chat room, processes hidden Pandora Prison messages
 * @param {Character} SenderCharacter - The character sending the message
 * @param {string} Interaction - The message sent
 * @returns {void} - Nothing to be used
 */
function PandoraPenitentiaryHiddenMessage(SenderCharacter, Interaction) {

	// Make sure we can process the Pandora packet
	if (!Interaction.startsWith("Pandora") || (Interaction.indexOf("|") <= 0) || !PandoraPenitentiaryIsInmate(Player) || !PandoraPenitentiaryIsGuard(SenderCharacter) || SenderCharacter.IsBlacklisted()) return;

	// Make sure we target the player (ALL targets everyone)
	let Target = Interaction.split("|")[1];
	if ((Target != "ALL") && (Target != Player.MemberNumber.toString())) return;

	// Validates the activity before running it
	let Activity = Interaction.split("|")[0].substring(7);
	if (!PandoraPenitentiaryActivityList.includes(Activity)) return;
	let ActivityList = PandoraPenitentiaryBuildActivityList(Player);
	if (!ActivityList.includes(Activity)) return;

	// Runs the activity on the player, without publishing it
	PandoraPenitentiaryActivityRun(Activity);

}

/**
 * When an NPC pays the player for a service
 * @param {number} Amount - The paid amount
 * @returns {void} - Nothing
 */
function PandoraPlayerPay(Amount) {
	CharacterChangeMoney(Player, Amount);
}

/**
 * When the player pays an NPC to wear her clothes
 * @returns {void} - Nothing
 */
function PandoraBuyRandomClothes() {
	if (!CurrentCharacter) return;
	CharacterChangeMoney(Player, -10);
	CharacterNaked(Player);
	CharacterTransferItem(CurrentCharacter, Player, "Cloth", false);
	CharacterTransferItem(CurrentCharacter, Player, "ClothLower", false);
	CharacterTransferItem(CurrentCharacter, Player, "Bra", false);
	CharacterTransferItem(CurrentCharacter, Player, "Panties", false);
	CharacterTransferItem(CurrentCharacter, Player, "Socks", false);
	CharacterTransferItem(CurrentCharacter, Player, "Shoes", false);
	CharacterNaked(CurrentCharacter);
	PandoraClothes = "Random";
}

/**
 * Starts the chest lockpicking mini-game
 * @returns {void} - Nothing
 */
function PandoraChestLockpickStart() {
	if (!InfiltrationMissionState) return;
	ChestLockpickChestImage = ((CurrentCharacter == null) || (CurrentCharacter.FixedImage == null)) ? "Screens/Room/Pandora/Chest" + Math.floor(Math.random() * 3).toString() + ".png" : CurrentCharacter.FixedImage;
	ChestLockpickBackground = PandoraBackground;
	DialogLeave();
	MiniGameStart("ChestLockpick", InfiltrationMissionState.Difficulty, () => { PandoraChestLockEnd(); });
}

/**
 * When the picklock mini-game ends, adds 30 seconds to the timer
 * @returns {SafePromise<void>}
 */
async function PandoraChestLockEnd() {
	PandoraTimer = PandoraTimer - 30000;
	PandoraCurrentRoom.Character[0].Stage = (MiniGameVictory) ? "100" : "0";
	CharacterSetCurrent(PandoraCurrentRoom.Character[0]);
	await CommonSetScreen("Room", "Pandora");
}

/**
 * When the player loots the chest, we add some money and the chest disappear
 * @returns {void} - Nothing
 */
function PandoraChestLoot() {
	if (!InfiltrationMissionState) return;
	// Gets the regular loot
	DialogLeave();
	PandoraMoney = PandoraMoney + Math.floor((5 + Math.random() * 5) * (InfiltrationMissionState.Difficulty + 2) * 0.5);
	PandoraChestCount--;
	PandoraCurrentRoom.Character.splice(0, 1);

	// Can also get a special card from the chest (higher odds with higher difficulty)
	if ((Math.random() < InfiltrationMissionState.Difficulty / 25) && (Player.Game != null) && (Player.Game.ClubCard != null) && (Player.Game.ClubCard.Reward != null)) {
		let Char = String.fromCharCode(30022);
		if (Player.Game.ClubCard.Reward.indexOf(Char) < 0) {
			Player.Game.ClubCard.Reward = Player.Game.ClubCard.Reward + Char;
			ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
			PandoraMsgBox(TextGet("FoundPandoraBoxClubCard"));
		}
	}

}

/**
 * When the player gets the paint cans from a cosplay girl
 * @returns {void} - Nothing
 */
function PandoraGetPaint() {
	PandoraPaint = true;
}

/**
 * When the player starts a club card game
 * @returns {void} - Nothing
 */
function PandoraClubCardStart() {
	if (!CurrentCharacter || !CurrentCharacter.IsNpc()) return;
	PandoraFightCharacter = CurrentCharacter;
	ClubCardOpponent = CurrentCharacter;
	ClubCardOpponentDeck = ClubCardBuilderDominantDeck;
	MiniGameStart("ClubCard", 0, () => { PandoraClubCardEnd(); });
}

/**
 * When the player ends a club card game
 * @returns {SafePromise<void>}
 */
async function PandoraClubCardEnd() {
	if (!PandoraFightCharacter) return;
	await CommonSetScreen("Room", "Pandora");
	CharacterSetCurrent(PandoraFightCharacter);
	PandoraFightCharacter.CurrentDialog = DialogFind(PandoraFightCharacter, MiniGameVictory ? "ClubCardVictory" : "ClubCardDefeat");
}
