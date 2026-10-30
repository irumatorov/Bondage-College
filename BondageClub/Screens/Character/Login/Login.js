"use strict";
var LoginBackground = "Dressing";
/**
 * Contents of the GameCredits.csv file
 * Initialized once on screen load
 * @type {string[][]}
 */
var LoginCredits;
var LoginCreditsPosition = 0;
var LoginThankYou = "";
/* eslint-disable */
var LoginThankYouList = [
"_20_05",
"AlexG",
"Alpha",
"Amazing",
"asd1520456080",
"Asriel",
"Aybes",
"Brad",
"bryce",
"Canti",
"Cerberus",
"Christian",
"Cm382714",
"Cool",
"Desch",
"Dragokahn",
"dynilath",
"Exe",
"Exusiai",
"fumoffu",
"George",
"Greendragon",
"holonoringo",
"I.F.S.",
"ItsTheHutch",
"jamal",
"jazzybanana",
"Jerry",
"John",
"Jonas",
"Kim",
"koka",
"land",
"Laurie",
"Megumin",
"Michel",
"micr0",
"Mindtie",
"Misa",
"MrUniver",
"NeReFox",
"NEWTYPUFF",
"SaiZaro",
"Salix",
"Schrödingers",
"Signal_Flare",
"Soulcollar",
"Sticks",
"Tam",
"Taraly",
"Tarram1010",
"Teli",
"Thkdt",
"Toddles",
"Troubadix",
"UltimateDespair",
"Verena",
"walnus",
"WhiteSniper",
"XDWolfie",
"Xepherio",
];

/* eslint-enable */
var LoginThankYouNext = 0;
var LoginSubmitted = false;
var LoginQueuePosition = -1;
/** The server login status */
var LoginErrorMessage = "";
/**
 * The dummy on the login screen.
 *
 * Lifetime bound to the screen.
  @type {NPCCharacter | null} */
var LoginCharacter;

/* DEBUG: To measure FPS - uncomment this and change the + 4000 to + 40
var LoginLastCT = 0;
var LoginFrameCount = 0;
var LoginFrameTotalTime = 0;*/

const LoginIDs = Object.freeze({
	name: "InputName",
	password: "InputPassword",
	language: "LanguageDropdown",
	nameLabel: "login-name-label",
	passwordLabel: "login-password-label",
	newCharacter: "login-new-character-label",
	register: "login-register-button",
	login: "login-login-button",
	welcome: "login-welcome-message",
	status: "login-status",
	passwordReset: "login-password-reset-button",
	forgotPassword: "login-password-reset-hint",
	cheats: "login-cheats-button",
	footer: "login-footer"
});

/**
 * Loads the next thank you bubble
 * @returns {void} Nothing
 */
function LoginDoNextThankYou() {
	LoginThankYou = CommonRandomItemFromList(LoginThankYou, LoginThankYouList);
	const char = /** @type {NPCCharacter} */ (LoginCharacter);
	CharacterRelease(char, false);
	CharacterAppearanceFullRandom(char, undefined, false);
	if (InventoryGet(char, "ItemNeck") != null) InventoryRemove(char, "ItemNeck", false);
	CharacterFullRandomRestrain(char, undefined, false);
	CharacterRefresh(char, false);
	LoginThankYouNext = CommonTime() + 4000;
}

/**
 * Draw the credits
 * @returns {void} Nothing
 */
function LoginDrawCredits() {

	/* DEBUG: To measure FPS - uncomment this and change the + 4000 to + 40
	var CT = CommonTime();
	if (CT - LoginLastCT < 10000) {
		LoginFrameCount++;
		if (LoginFrameCount > 1000)
			LoginFrameTotalTime = LoginFrameTotalTime + CT - LoginLastCT;
	}
	LoginLastCT = CT;
	if (LoginFrameCount > 1000) DrawText("Average FPS: " + (1000 / (LoginFrameTotalTime / (LoginFrameCount - 1000))).toFixed(2).toString(), 1000, 975, "white");
	else DrawText("Calculating Average FPS...", 1000, 975, "white");*/

	// For each credits in the list
	LoginCreditsPosition += (TimerRunInterval * 60) / 1000;
	if (LoginCreditsPosition > LoginCredits.length * 25 || LoginCreditsPosition < 0) LoginCreditsPosition = 0;
	MainCanvas.font = "30px Arial";
	for (let C = 0; C < LoginCredits.length; C++) {

		// Sets the Y position (it scrolls from bottom to top)
		var Y = 800 - Math.floor(LoginCreditsPosition * 2) + (C * 50);

		// Draw the text if it's in drawing range
		if ((Y > 0) && (Y <= 999)) {

			// The "CreditTypeRepeat" starts scrolling again, other credit types are translated
			var Cred = LoginCredits[C][0].trim();
			if (Cred == "CreditTypeRepeat") {
				LoginCreditsPosition = 0;
				return;
			} else {
				if (Cred.startsWith("CreditType")) DrawText(TextGet(Cred), 320, Y, "white");
				else {
					if (Cred.indexOf("|") == -1) DrawText(Cred, 320, Y, "white");
					else {
						DrawText(Cred.substring(0, Cred.indexOf("|")), 180, Y, "white");
						DrawText(Cred.substring(Cred.indexOf("|") + 1, 1000), 460, Y, "white");
					}
				}
			}

		}

	}

	// Restore the canvas font
	MainCanvas.font = CommonGetFont(36);

}

var LoginEventListeners = {
	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: KeyboardEvent) => void}
	 */
	_KeyDownInputName: function _KeyDownInputName(ev) {
		if (CommonKey.IsPressed(ev, "Enter")) {
			document.getElementById(LoginIDs.password)?.focus();
			ev.stopPropagation();
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: KeyboardEvent) => void}
	 */
	_KeyDownInputPassword: function _KeyDownInputPassword(ev) {
		if (CommonKey.IsPressed(ev, "Enter")) {
			const Name = ElementValue(LoginIDs.name);
			const Password = ElementValue(LoginIDs.password);
			LoginDoLogin(Name, Password);
			ev.stopPropagation();
		}
	},
};

/**
 * Loads the character login screen
 * @type {ScreenLoadHandler}
 */
async function LoginLoad() {

	// Resets the player and other characters
	LoginCharacter = CharacterLoadNPC("NPC_Login");
	LoginDoNextThankYou();
	LoginStatusReset();
	if (LoginCredits == null) {
		LoginCredits = await CommonReadCSV(ScreenFileGetPath("GameCredits.csv"));
	}
	ActivityDictionaryLoad();
	OnlneGameDictionaryLoad();
	const form = ElementCreateForm("Login");

	ElementCreate({
		tag: "span",
		classList: ["login-text", "NoSelect"],
		attributes: {
			id: LoginIDs.welcome
		},
		children: [
			TextGet("Welcome"),
		],
		parent: form
	});

	ElementCreate({
		tag: "span",
		classList: ["login-text", "NoSelect"],
		attributes: {
			id: LoginIDs.status
		},
		children: [
			LoginGetStatus() ?? TextGet("EnterNamePassword"),
		],
		parent: form
	});

	const username = ElementCreateInput(LoginIDs.name, "text", "", "20");
	username.setAttribute("autocomplete", "username");
	username.setAttribute("enterkeyhint", "next");
	username.addEventListener("keydown", LoginEventListeners._KeyDownInputName);

	const pass = ElementCreateInput(LoginIDs.password, "password", "", "20");
	pass.setAttribute("autocomplete", "current-password");
	pass.setAttribute("enterkeyhint", "go");
	pass.addEventListener("keydown", LoginEventListeners._KeyDownInputPassword);

	ElementCreate({
		tag: "label",
		classList: ["vertical"],
		children: [
			{
				tag: "span",
				classList: ["login-text", "NoSelect"],
				attributes: {
					id: LoginIDs.nameLabel
				},
				children: [
					TextGet("AccountName"),
				],
			},
			username
		],
		parent: form
	});

	ElementCreate({
		tag: "label",
		classList: ["vertical"],
		children: [
			{
				tag: "span",
				classList: ["login-text", "NoSelect"],
				attributes: {
					id: LoginIDs.passwordLabel
				},
				children: [
					TextGet("Password"),
				],
			},
			pass
		],
		parent: form
	});

	const loginButton = ElementButton.Create(LoginIDs.login, () => {
		const Name = ElementValue(LoginIDs.name);
		const Password = ElementValue(LoginIDs.password);
		LoginDoLogin(Name, Password);
	},
	{
		label: TextGet("Login"),
	});
	document.body.appendChild(loginButton);

	const newCharacter = ElementCreate({
		tag: "span",
		classList: ["login-text", "NoSelect"],
		attributes: {
			id: LoginIDs.newCharacter
		},
		children: [
			TextGet("CreateNewCharacter"),
		],
		parent: document.body
	});

	const register = ElementButton.Create(LoginIDs.register, () => {
		DisclaimerOpen((isAccepted) => {
			if (isAccepted) {
				CharacterCreatePlayer();
				InventoryRemove(Player, "ItemFeet");
				InventoryRemove(Player, "ItemLegs");
				InventoryRemove(Player, "ItemArms");
				CharacterAppearanceSetDefault(Player);

				// Redirect the player to the login screen after they have their character created
				CharacterAppearanceLoadCharacter(Player, (result) => {
					if (result)
						CommonSetScreen("Character", "Creation");
					else
						CommonSetScreen("Character", "Login");
				});
			} else {
				window.location.reload();
			}
		});
	},
	{
		label: TextGet("NewCharacter"),
		name: "register",
	});

	const resetPassword = ElementButton.Create(LoginIDs.passwordReset, () => {
		CommonSetScreen("Character", "PasswordReset");
	},
	{
		label: TextGet("PasswordReset"),
	});

	const cheats = ElementButton.Create(LoginIDs.cheats, () => {
		CommonSetScreen("Character", "Cheat");
	},
	{
		label: TextGet("Cheats"),
	});

	const languages = TranslationDictionary.map(l => {
		return {
			children: [l.Icon, " ", l.LanguageName],
			attributes: {
				selected: l.LanguageCode === TranslationLanguage,
				lang: l.LanguageCode,
				value: l.LanguageCode,
			},
		};
	});
	const languageDropdown = ElementDropdown.Create(LoginIDs.language, languages, function(event) {
		TranslationSwitchLanguage(/** @type {"" | "TW" | ServerChatRoomLanguage} */(this.value) || "EN");
		TextLoad();
		ActivityDictionaryLoad();
		CommonPromiseCatch(
			AssetLoadDescription("Female3DCG")
				.then(() => TextScreenCache?.loadedPromise)
				.then(() => {
					LoginReloadLanguageText();
				})
		);
	});

	ElementCreate({
		tag: "div",
		attributes: {
			id: LoginIDs.footer
		},
		children: [
			newCharacter,
			register,
			resetPassword,
			cheats,
			languageDropdown,
		],
		parent: document.body
	});

	TextPrefetchFile(BackgroundsStringsPath);
	TextPrefetchFile(AssetStringsPath);
	TextPrefetch("Room", "MainHall");
	DrawGetImage("Backgrounds/MainHall.jpg");

	username.focus();
}

/**
 * Runs the character login screen
 * @returns {void} Nothing
 */
function LoginRun() {

	// Draw the credits
	if (LoginCredits) LoginDrawCredits();

	const CanLogin = ServerIsConnected && !LoginSubmitted;

	// Draw the login controls
	const status = ElementWrap(LoginIDs.status);
	const statusNewText = LoginGetStatus() ?? TextGet("EnterNamePassword");
	if (status && status.textContent !== statusNewText) {
		status.textContent = statusNewText;
	}
	ElementWrap(LoginIDs.login)?.toggleAttribute("disabled", !CanLogin);
	ElementWrap(LoginIDs.register)?.toggleAttribute("disabled", !CanLogin);
	ElementWrap(LoginIDs.passwordReset)?.toggleAttribute("disabled", !CanLogin);
	const cheatElem = ElementWrap(LoginIDs.cheats);
	if (cheatElem) cheatElem.style.display = CheatAllow ? "" : "none";

	// Draw the character and thank you bubble
	DrawCharacter(/** @type {NPCCharacter} */ (LoginCharacter), 1400, 100, 0.9);
	if (LoginThankYouNext < CommonTime()) LoginDoNextThankYou();
	DrawImage("Screens/" + CurrentModule + "/" + CurrentScreen + "/Bubble.png", 1400, 16);
	DrawText(TextGet("ThankYou") + " " + LoginThankYou, 1625, 53, "Black", "Gray");

}

/**
 * Handles player click events on the character login screen
 * @returns {void} Nothing
 */
function LoginClick() {
}

/**
 * Handles player keyboard events on the character login screen, "enter" will login
 * @type {KeyboardEventListener}
 */
function LoginKeyDown(ev) {
	if (CommonKey.IsPressed(ev, "Enter")) {
		const Name = ElementValue(LoginIDs.name);
		const Password = ElementValue(LoginIDs.password);
		LoginDoLogin(Name, Password);
		return true;
	}
	return false;
}

/**
 * Unload function - called when the login page unloads
 */
function LoginUnload() {
	ElementRemove(LoginIDs.welcome);
	ElementRemove(LoginIDs.status);

	ElementRemove(LoginIDs.nameLabel);
	ElementRemove(LoginIDs.name);
	ElementRemove(LoginIDs.passwordLabel);
	ElementRemove(LoginIDs.password);

	ElementRemove(LoginIDs.login);

	ElementRemove(LoginIDs.footer);
	ElementRemove(LoginIDs.newCharacter);
	ElementRemove(LoginIDs.register);
	ElementRemove(LoginIDs.passwordReset);
	ElementRemove(LoginIDs.cheats);
	ElementRemove(LoginIDs.language);

	CharacterDelete(/** @type {NPCCharacter} */ (LoginCharacter));
	LoginCharacter = null;
}

/** @type {ScreenResizeHandler} */
function LoginResize(load) {
	ElementPositionFixed(LoginIDs.welcome, 500, 50, 1000);
	ElementPositionFixed(LoginIDs.status, 500, 100, 1000);

	ElementPositionFixed(LoginIDs.nameLabel, 500, 200, 1000);
	ElementPositionFixed(LoginIDs.name, 750, 260, 500);
	ElementPositionFixed(LoginIDs.passwordLabel, 500, 330, 1000);
	ElementPositionFixed(LoginIDs.password, 750, 390, 500);

	ElementSetPosition(LoginIDs.login, 1000, 490);
	ElementSetFontSize(LoginIDs.login, "auto");

	ElementPositionFixed(LoginIDs.footer, 500, 670, 1000, 320);
	ElementSetSize(LoginIDs.register, 400);
	ElementSetSize(LoginIDs.passwordReset, 400);
	ElementSetSize(LoginIDs.cheats, 400);
	ElementSetSize(LoginIDs.language, 400);
}

function LoginReloadLanguageText() {
	const welcome = ElementWrap(LoginIDs.welcome);
	if (welcome) {
		welcome.textContent = TextGet("Welcome");
	}
	const status = ElementWrap(LoginIDs.status);
	if (status) {
		status.textContent = LoginGetStatus() ?? TextGet("EnterNamePassword");
	}
	const nameLabel = ElementWrap(LoginIDs.nameLabel);
	if (nameLabel) {
		nameLabel.textContent = TextGet("AccountName");
	}
	const passwordLabel = ElementWrap(LoginIDs.passwordLabel);
	if (passwordLabel) {
		passwordLabel.textContent = TextGet("Password");
	}
	const newCharacter = ElementWrap(LoginIDs.newCharacter);
	if (newCharacter) {
		newCharacter.textContent = TextGet("CreateNewCharacter");
	}
	const login = ElementWrap(LoginIDs.login)?.querySelector("span");
	if (login) {
		login.textContent = TextGet("Login");
	}
	const register = ElementWrap(LoginIDs.register)?.querySelector("span");
	if (register) {
		register.textContent = TextGet("NewCharacter");
	}
	const passwordReset = ElementWrap(LoginIDs.passwordReset)?.querySelector("span");
	if (passwordReset) {
		passwordReset.textContent = TextGet("PasswordReset");
	}
	const cheats = ElementWrap(LoginIDs.cheats)?.querySelector("span");
	if (cheats) {
		cheats.textContent = TextGet("Cheats");
	}
}

/**
 * The list of item fixups to apply on login.
 *
 * Those are applied by the login code, after the player's item lists are set up
 * but before the inventory and appearance are loaded from the server's data,
 * and applies the specified asset fixups by swapping Old with New in the list
 * of owned items, in the various player item lists, and in the appearance.
 *
 * If you're only moving items around, it should work just fine as long as
 * the `Old` and `New` asset definitions are compatible.
 * If it's an asset merge (say 3 into one typed asset), it will either set
 * the fixed up item to the specified `Option` or the first one if unspecified.
 *
 * @type {{ Old: { Group: string, Name: string | '*' }, New: { Group: AssetGroupName, Name?: AssetName, Option?: string } }[]}
 */
let LoginInventoryFixups = [
	{ Old: { Group: "ItemLegs", Name: "WoodenHorse" }, New: { Group: "ItemDevices", Name: "WoodenHorse" } },
	{ Old: { Group: "ItemVulvaPiercings", Name: "WeightedClitPiercing" }, New: { Group: "ItemVulvaPiercings", Name: "RoundClitPiercing", Option: "Weight" } },
	{ Old: { Group: "ItemVulvaPiercings", Name: "BellClitPiercing" }, New: { Group: "ItemVulvaPiercings", Name: "RoundClitPiercing", Option: "Bell" } },
	{ Old: { Group: "ItemArms", Name: "BitchSuitExposed"}, New: { Group: "ItemArms", Name: "BitchSuit", Option: "Exposed" } },
	{ Old: { Group: "ItemHands", Name: "SpankingToysBaguette" }, New: { Group: "ItemHandheld", Name: "Baguette"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysBallgag" }, New: { Group: "ItemHandheld", Name: "Ballgag"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysBelt" }, New: { Group: "ItemHandheld", Name: "Belt"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysBroom" }, New: { Group: "ItemHandheld", Name: "Broom"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysCandleWax" }, New: { Group: "ItemHandheld", Name: "CandleWax"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysCane" }, New: { Group: "ItemHandheld", Name: "Cane"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysCattleProd" }, New: { Group: "ItemHandheld", Name: "CattleProd"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysCrop" }, New: { Group: "ItemHandheld", Name: "Crop"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysElectricToothbrush" }, New: { Group: "ItemHandheld", Name: "ElectricToothbrush"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysFeather" }, New: { Group: "ItemHandheld", Name: "Feather"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysFeatherDuster" }, New: { Group: "ItemHandheld", Name: "FeatherDuster"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysFlogger" }, New: { Group: "ItemHandheld", Name: "Flogger"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysGavel" }, New: { Group: "ItemHandheld", Name: "Gavel"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysGlassEmpty" }, New: { Group: "ItemHandheld", Name: "GlassEmpty"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysGlassFilled" }, New: { Group: "ItemHandheld", Name: "GlassFilled"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysHairbrush" }, New: { Group: "ItemHandheld", Name: "Hairbrush"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysHeartCrop" }, New: { Group: "ItemHandheld", Name: "HeartCrop"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysIceCube" }, New: { Group: "ItemHandheld", Name: "IceCube"} },
	{ Old: { Group: "ItemHands", Name: "KeyProp" }, New: { Group: "ItemHandheld", Name: "KeyProp"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysLargeDildo" }, New: { Group: "ItemHandheld", Name: "LargeDildo"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysLongDuster" }, New: { Group: "ItemHandheld", Name: "LongDuster"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysLongSock" }, New: { Group: "ItemHandheld", Name: "LongSock"} },
	{ Old: { Group: "ItemHands", Name: "MedicalInjector" }, New: { Group: "ItemHandheld", Name: "MedicalInjector"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysLotion" }, New: { Group: "ItemHandheld", Name: "Lotion"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysPaddle" }, New: { Group: "ItemHandheld", Name: "Paddle"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysPanties" }, New: { Group: "ItemHandheld", Name: "Panties"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysPetToy" }, New: { Group: "ItemHandheld", Name: "PetToy"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysPhone1" }, New: { Group: "ItemHandheld", Name: "Phone1"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysPhone2" }, New: { Group: "ItemHandheld", Name: "Phone2"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysPlasticWrap" }, New: { Group: "ItemHandheld", Name: "PlasticWrap"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysPotionBottle" }, New: { Group: "ItemHandheld", Name: "PotionBottle"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysRainbowWand" }, New: { Group: "ItemHandheld", Name: "RainbowWand"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysRopeCoilLong" }, New: { Group: "ItemHandheld", Name: "RopeCoilLong"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysRopeCoilShort" }, New: { Group: "ItemHandheld", Name: "RopeCoilShort"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysRuler" }, New: { Group: "ItemHandheld", Name: "Ruler"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysScissors" }, New: { Group: "ItemHandheld", Name: "Scissors"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysShockRemote" }, New: { Group: "ItemHandheld", Name: "ShockRemote"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysShockWand" }, New: { Group: "ItemHandheld", Name: "ShockWand"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysSmallDildo" }, New: { Group: "ItemHandheld", Name: "SmallDildo"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysSmallVibratingWand" }, New: { Group: "ItemHandheld", Name: "SmallVibratingWand"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysSpatula" }, New: { Group: "ItemHandheld", Name: "Spatula"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysSword" }, New: { Group: "ItemHandheld", Name: "Sword"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysTapeRoll" }, New: { Group: "ItemHandheld", Name: "TapeRoll"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysTennisRacket" }, New: { Group: "ItemHandheld", Name: "TennisRacket"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysForSaleSign" }, New: { Group: "ItemHandheld", Name: "ForSaleSign"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysToothbrush" }, New: { Group: "ItemHandheld", Name: "Toothbrush"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysTowel" }, New: { Group: "ItemHandheld", Name: "Towel"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysVibeRemote" }, New: { Group: "ItemHandheld", Name: "VibeRemote"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysVibratingWand" }, New: { Group: "ItemHandheld", Name: "VibratingWand"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysVibrator" }, New: { Group: "ItemHandheld", Name: "Vibrator"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysWartenbergWheel" }, New: { Group: "ItemHandheld", Name: "WartenbergWheel"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysWhip" }, New: { Group: "ItemHandheld", Name: "Whip"} },
	{ Old: { Group: "ItemHands", Name: "SpankingToysWhipPaddle" }, New: { Group:"ItemHandheld", Name:"WhipPaddle" } },
	{ Old: { Group: "Pussy", Name: "PussyLight1" }, New: { Group: "Pussy", Name: "Pussy1" } },
	{ Old: { Group: "Pussy", Name: "PussyLight2" }, New: { Group: "Pussy", Name: "Pussy2" } },
	{ Old: { Group: "Pussy", Name: "PussyLight3" }, New: { Group: "Pussy", Name: "Pussy3" } },
	{ Old: { Group: "Pussy", Name: "PussyDark1" }, New: { Group: "Pussy", Name: "Pussy1" } },
	{ Old: { Group: "Pussy", Name: "PussyDark2" }, New: { Group: "Pussy", Name: "Pussy2" } },
	{ Old: { Group: "Pussy", Name: "PussyDark3" }, New: { Group: "Pussy", Name: "Pussy3" } },
	{ Old: { Group: "LeftAnklet", Name: "*" }, New: { Group: "AnkletLeft" }},
	{ Old: { Group: "RightAnklet", Name: "*" }, New: { Group: "AnkletRight" }},
	{ Old: { Group: "LeftHand", Name: "*" }, New: { Group: "HandAccessoryLeft" }},
	{ Old: { Group: "RightHand", Name: "*" }, New: { Group: "HandAccessoryRight" }},
	{ Old: {Group: "ItemButt", Name: "FoxTail1"}, New: {Group: "ItemButt", Name: "FoxTail", Option: "BR"}},
	{ Old: {Group: "ItemButt", Name: "FoxTail2"}, New: {Group: "ItemButt", Name: "FoxTail"} },
	{ Old: {Group: "TailStraps", Name: "FoxTailStrap1"}, New: {Group: "TailStraps", Name: "FoxTailStrap", Option: "BR"}},
	{ Old: {Group: "TailStraps", Name: "FoxTailStrap2"}, New: {Group: "TailStraps", Name: "FoxTailStrap"}},
];

/**
 * Perform the inventory fixups needed.
 * @param {InventoryBundle[]} Inventory - The server-provided inventory object
 */
function LoginPerformInventoryFixups(Inventory) {
	// Skip fixups on new characters
	if (!Inventory) return;

	for (const fixup of LoginInventoryFixups) {
		// For every asset fixup to do, update the inventory
		const item = Inventory.find(i => i.Group === fixup.Old.Group && (i.Name === fixup.Old.Name || fixup.Old.Name === "*"));
		if (item) {
			item.Group = fixup.New.Group;
			if (fixup.New.Name) {
				item.Name = fixup.New.Name;
			}
		}
	}
}

/**
 * Perform the appearance fixups needed.
 * TODO: only typed items are supported.
 * @param {ItemBundle[]} Appearance - The server-provided appearance object
 * @returns {boolean}
 */
function LoginPerformAppearanceFixups(Appearance) {
	if (!Appearance) return true;

	let fixedUp = false;
	for (const fixup of LoginInventoryFixups) {
		const idx = Appearance.findIndex(a => a.Group === fixup.Old.Group && (a.Name === fixup.Old.Name || fixup.Old.Name === "*"));
		if (idx != -1) {
			// The item is currently worn, remove it
			let worn = Appearance[idx];
			Appearance.splice(idx, 1);

			// There're already something else in that slot, preserve it
			if (Appearance.find(a => a.Group === fixup.New.Group)) {
				continue;
			}

			// Set up the new item and its properties
			worn.Group = fixup.New.Group;
			if (fixup.New.Name) {
				worn.Name = fixup.New.Name;
			}

			const asset = AssetGet("Female3DCG", worn.Group, worn.Name);
			if (asset?.Archetype && fixup.New.Option) {
				worn.Property ??= {};
				switch (asset.Archetype) {
					case ExtendedArchetype.TYPED:
						{
							const opts = TypedItemGetOptions(worn.Group, worn.Name) ?? [];
							const optIndex = opts.findIndex(o => o.Name === fixup.New.Option);
							if (optIndex === -1) {
								console.error(`Unknown option ${fixup.New.Option}`);
								continue;
							} else {
								const data = opts[optIndex].ParentData;
								worn.Property.TypeRecord ??= {};
								worn.Property.TypeRecord[data.name] = optIndex;
							}
						}
						break;
				}
			} else if (asset?.Extended) {
				// Old-style extended item

			} else {
				delete worn.Property;
			}

			// Push back the updated data
			Appearance.push(worn);
			fixedUp = true;
		}
	}
	return fixedUp;
}

/**
 * Make sure the slave collar is equipped or unequipped based on the owner
 * @returns {void} Nothing
 */
function LoginValidCollar() {
	let item = InventoryGet(Player, "ItemNeck");
	if (!Player.IsFullyOwned() || LogQuery("ReleasedCollar", "OwnerRule")) {
		// Not owned, or currently released from the collar, make sure we don't have it equipped
		if (item && item.Asset.Name == "SlaveCollar") {
			InventoryRemove(Player, "ItemNeck");
			item = null;
			ChatRoomCharacterItemUpdate(Player, "ItemNeck");
			ChatRoomCharacterItemUpdate(Player, "ItemNeckAccessories");
			ChatRoomCharacterItemUpdate(Player, "ItemNeckRestraints");
		}
	}

	if (Player.IsFullyOwned() && !LogQuery("ReleasedCollar", "OwnerRule")) {
		// Owned, but not currently released from the collar
		if (item && !["SlaveCollar", "ClubSlaveCollar"].includes(item.Asset.Name)) {
			// We're wearing something else, yank that
			InventoryRemove(Player, "ItemNeck");
			item = null;
			ChatRoomCharacterItemUpdate(Player, "ItemNeck");
		}

		if (!item) {
			// Now make sure we're wearing the slave collar
			// …unless GGTS, because it doesn't use those, and having a forced one
			// would impact its drone mode and its collar task.
			if (Player.IsOwned() === "ggts") return;
			InventoryWear(Player, "SlaveCollar", "ItemNeck");
			ChatRoomCharacterItemUpdate(Player, "ItemNeck");
		}
	}

	// Check if we should switch to the club slave collar
	if (LogQuery("ClubSlave", "Management") && !InventoryIsWorn(Player, "ItemNeck", "ClubSlaveCollar"))
		InventoryWear(Player, "ClubSlaveCollar", "ItemNeck");
}

/**
 * Adds or confiscates Club Mistress items from the player. Only players that are club Mistresses can have the Mistress
 * Padlock & Key
 * @returns {void} Nothing
 */
function LoginMistressItems() {
	if (LogQuery("ClubMistress", "Management")) {
		InventoryAdd(Player, "MistressGloves", "Gloves", false);
		InventoryAdd(Player, "MistressBoots", "Shoes", false);
		InventoryAdd(Player, "MistressTop", "Cloth", false);
		InventoryAdd(Player, "MistressBottom", "ClothLower", false);
		InventoryAdd(Player, "MistressPadlock", "ItemMisc", false);
		InventoryAdd(Player, "MistressPadlockKey", "ItemMisc", false);
		InventoryAdd(Player, "MistressTimerPadlock", "ItemMisc", false);
		InventoryAdd(Player, "DeluxeBoots", "Shoes", false);
	} else {
		InventoryDelete(Player, "MistressPadlock", "ItemMisc", false);
		InventoryDelete(Player, "MistressPadlockKey", "ItemMisc", false);
		InventoryDelete(Player, "MistressTimerPadlock", "ItemMisc", false);
		InventoryDelete(Player, "MistressGloves", "Gloves", false);
		InventoryDelete(Player, "MistressBoots", "Shoes", false);
		InventoryDelete(Player, "MistressTop", "Cloth", false);
		InventoryDelete(Player, "MistressBottom", "ClothLower", false);
		InventoryDelete(Player, "DeluxeBoots", "Shoes", false);
	}
}

/**
 * Give the matching RewardMemberNumber Club Card to the player
 * @returns {void} Nothing
 */
function LoginClubCard() {

	// Loops in all the cards to see if there's a card that matches the player MembeNumber
	for (let Card of ClubCardList)
		if (Player.MemberNumber === Card.RewardMemberNumber) {

			// Make sure the proper objects are created
			Player.Game.ClubCard ??= { Deck: [], Reward: "" };
			if (!CommonIsArray(Player.Game.ClubCard.Deck)) Player.Game.ClubCard.Deck = [];
			if (typeof Player.Game.ClubCard.Reward !== "string") Player.Game.ClubCard.Reward = "";

			// If the player doesn't have that card, we add it
			let Char = String.fromCharCode(Card.ID);
			if (Player.Game.ClubCard.Reward.indexOf(Char) < 0) {
				Player.Game.ClubCard.Reward = Player.Game.ClubCard.Reward + Char;
				ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
			}
			return;

		}

}

/**
 * Adds or confiscates pony equipment from the player. Only players that are ponies or trainers can have the pony
 * equipment.
 * @returns {void} Nothing
 */
function LoginStableItems() {
	if (LogQuery("PonyExam", "JoinedStable") || LogQuery("TrainerExam", "JoinedStable")) {
		InventoryAdd(Player, "HarnessPonyBits", "ItemMouth", false);
		InventoryAdd(Player, "HarnessPonyBits", "ItemMouth2", false);
		InventoryAdd(Player, "HarnessPonyBits", "ItemMouth3", false);
		InventoryAdd(Player, "PonyBoots", "Shoes", false);
		InventoryAdd(Player, "PonyBoots", "ItemBoots", false);
		InventoryAdd(Player, "PonyHood", "ItemHood", false);
		InventoryAdd(Player, "HoofMittens", "ItemHands", false);
	} else {
		InventoryDelete(Player, "HarnessPonyBits", "ItemMouth", false);
		InventoryDelete(Player, "HarnessPonyBits", "ItemMouth2", false);
		InventoryDelete(Player, "HarnessPonyBits", "ItemMouth3", false);
		InventoryDelete(Player, "PonyBoots", "Shoes", false);
		InventoryDelete(Player, "PonyBoots", "ItemBoots", false);
		InventoryDelete(Player, "PonyHood", "ItemHood", false);
		InventoryDelete(Player, "HoofMittens", "ItemHands", false);
	}
}

/**
 * Adds or confiscates maid items from the player. Only players that have joined the Maid Sorority can have these items.
 * @returns {void} - Nothing
 */
function LoginMaidItems() {
	if (LogQuery("JoinedSorority", "Maid")) {
		InventoryAdd(Player, "MaidOutfit1", "Cloth", false);
		InventoryAdd(Player, "MaidOutfit2", "Cloth", false);
		InventoryAdd(Player, "MaidDress3", "Cloth", false);
		InventoryAdd(Player, "MaidDress4", "Cloth", false);
		InventoryAdd(Player, "MaidHairband1", "Cloth", false);
		InventoryAdd(Player, "MaidApron1", "Cloth", false);
		InventoryAdd(Player, "MaidApron2", "Cloth", false);
		InventoryAdd(Player, "FrillyApron", "ClothAccessory", false);
		InventoryAdd(Player, "MaidHairband1", "Hat", false);
		InventoryAdd(Player, "ServingTray", "ItemMisc", false);
		InventoryAdd(Player, "MaidBracelet", "Bracelet", false);
	} else {
		InventoryDelete(Player, "MaidOutfit1", "Cloth", false);
		InventoryDelete(Player, "MaidOutfit2", "Cloth", false);
		InventoryDelete(Player, "MaidDress3", "Cloth", false);
		InventoryDelete(Player, "MaidDress4", "Cloth", false);
		InventoryDelete(Player, "MaidHairband1", "Cloth", false);
		InventoryDelete(Player, "MaidApron1", "Cloth", false);
		InventoryDelete(Player, "MaidApron2", "Cloth", false);
		InventoryDelete(Player, "FrillyApron", "ClothAccessory", false);
		InventoryDelete(Player, "MaidHairband1", "Hat", false);
		InventoryDelete(Player, "ServingTray", "ItemMisc", false);
		InventoryDelete(Player, "MaidBracelet", "Bracelet", false);
	}
}

/**
 * Ensures lover-exclusive items are removed if the player has no lovers.
 * @returns {void} Nothing
 */
function LoginLoversItems() {
	const LoversNumbers = Player.GetLoversNumbers();

	// check to remove love leather collar slave collar if no lover
	// Note that as the Slave collar isn't yet an archetypal asset, that's why it gets skipped by validation
	if (LoversNumbers.length < 1) {
		const Collar = InventoryGet(Player,"ItemNeck");
		if (Collar && Collar.Property && (Collar.Asset.Name == "SlaveCollar") && (Collar.Property.Type == "LoveLeatherCollar")) {
			Collar.Property = CommonCloneDeep(InventoryItemNeckSlaveCollarTypes[0].Property);
			Collar.Color = [...Collar.Asset.DefaultColor];
		}
	}
}

/**
 * Adds or removes Asylum items. Only players that have previously maxed out their patient or nurse reputation are
 * eligible for their own set of Asylum restraints outside the Asylum.
 * @returns {void} - Nothing
 */
function LoginAsylumItems() {
	if (LogQuery("ReputationMaxed", "Asylum")) {
		InventoryAddMany(Player, [
			{Name: "MedicalBedRestraints", Group: "ItemArms"},
			{Name: "MedicalBedRestraints", Group: "ItemLegs"},
			{Name: "MedicalBedRestraints", Group: "ItemFeet"},
		], false);
	} else {
		InventoryDelete(Player, "MedicalBedRestraints", "ItemArms", false);
		InventoryDelete(Player, "MedicalBedRestraints", "ItemLegs", false);
		InventoryDelete(Player, "MedicalBedRestraints", "ItemFeet", false);
	}
}

/**
 * Adds items if specific cheats are enabled
 * @returns {void} - Nothing
 */
function LoginCheatItems() {
	if (CheatFactor("FreeCollegeOutfit", 0) == 0) {
		InventoryAdd(Player, "CollegeOutfit1", "Cloth");
		InventoryAdd(Player, "CollegeSkirt", "ClothLower");
	}
}

/**
 * Checks every owned item to see if its BuyGroup contains an item the player does not have. This allows the player to
 * collect any items that have been added to the game which are in a BuyGroup that they have already purchased.
 * @returns {void} Nothing
 */
function LoginValideBuyGroups() {
	for (let A = 0; A < Asset.length; A++)
		if ((Asset[A].BuyGroup != null) && InventoryAvailable(Player, Asset[A].Name, Asset[A].Group.Name))
			for (let B = 0; B < Asset.length; B++)
				if ((Asset[B] != null) && (Asset[B].BuyGroup != null) && (Asset[B].BuyGroup == Asset[A].BuyGroup) && !InventoryAvailable(Player, Asset[B].Name, Asset[B].Group.Name))
					InventoryAdd(Player, Asset[B].Name, Asset[B].Group.Name, false);
}

/**
 * Makes sure the difficulty restrictions are applied to the player
 * @param {boolean} applyDefaults - If changing to the difficulty, set this to True to set LimitedItems to the default settings
 * @returns {void} Nothing
 */
function LoginDifficulty(applyDefaults) {

	// If Extreme mode, the player cannot control her blocked items
	if (Player.GetDifficulty() >= 3) {
		LoginExtremeItemSettings(applyDefaults);
		ServerPlayerBlockItemsSync();
	}
}

/**
 * Set the item permissions for the Extreme difficulty
 * @param {boolean} applyDefaults - When initially changing to extreme/whitelist, TRUE sets strong locks to limited permissions. When enforcing
 * settings, FALSE allows them to remain as they are since the player could have changed them to fully open.
 * @returns {void} Nothing
 */
function LoginExtremeItemSettings(applyDefaults) {
	const LimitedAssets = new Set(MainHallStrongLocks.map(i => `ItemMisc/${i}`));
	for (const [name, permission] of CommonEntries(Player.PermissionItems)) {
		if (!permission) continue;
		permission.Hidden = false;
		const limitedAllowed = LimitedAssets.has(name);

		for (const [type, typePermission] of Object.entries(permission.TypePermissions)) {
			if (typePermission !== "Favorite") {
				delete permission.TypePermissions[type];
			}
		}

		switch (permission.Permission) {
			case "Block":
				permission.Permission = "Default";
				break;
			case "Limited":
				if (!limitedAllowed) {
					permission.Permission = "Default";
				}
				break;
			case "Default":
				// If the item permissions are 3 = "Owner/Lover/Whitelist" don't limit the locks, since that just blocks whitelisted players
				if (limitedAllowed && applyDefaults && Player.AllowedInteractions <= AllowedInteractions.OwnerLoversWhitelistOnly) {
					permission.Permission = "Limited";
				}
				break;
		}
	}
}

/**
 * Handles server response, when login has been queued
 * @param {number} Pos - The position in queue
 * @returns {void} Nothing
 */
function LoginQueue(Pos) {
	if (typeof Pos !== "number") return;
	LoginQueuePosition = Pos;
}

/**
 * Fixes the Owner property on the player object if it's wrongly set
 * @returns {void} Nothing
 */
function LoginFixOwner() {
	if ((Player.IsOwned() === false) && (Player.Owner !== "") && !Player.Owner.trim().startsWith("NPC-")) {
		Player.Owner = "";
		ServerAccountUpdate.QueueData({ Owner: Player.Owner });
	}
}

/**
 * Sets the player character info from the server data
 * @param {ServerAccountData} C
 */
function LoginSetupPlayer(C) {
	Player.Name = C.Name;
	Player.AccountName = C.AccountName;
	Player.AssetFamily = C.AssetFamily ?? "Female3DCG";
	Player.Title = ServerAccountDataSyncedValidate.Title(C.Title, Player);
	Player.Nickname = ServerAccountDataSyncedValidate.Nickname(C.Nickname, Player);
	Player.Money = ServerAccountDataSyncedValidate.Money(C.Money, Player);
	Player.Owner = ServerAccountDataSyncedValidate.Owner(C.Owner, Player);
	Player.Game = ServerAccountDataSyncedValidate.Game(C.Game, Player);
	Player.Description = ServerAccountDataSyncedValidate.Description(C.Description, Player);
	Player.Creation = C.Creation;
	Player.Wardrobe = C.Wardrobe ? CharacterDecompressWardrobe(C.Wardrobe) : [];
	Player.WardrobeCharacterNames = ServerAccountDataSyncedValidate.WardrobeCharacterNames(C.WardrobeCharacterNames, Player);
	WardrobeFixLength();
	Player.CharacterID = C.ID.toString();
	Player.MemberNumber = C.MemberNumber;
	Player.Difficulty = ServerAccountDataSyncedValidate.Difficulty(C.Difficulty, Player);
	const { permissions, shouldSync } = ServerUnPackItemPermissions(C, Player.Difficulty.Level >= 3);
	Player.PermissionItems = permissions;
	if (shouldSync) {
		ServerPlayerBlockItemsSync();
	}
	LogLoad(C.Log ?? []);

	// Sets the default language when creating or searching for chat rooms
	ChatAdminDefaultLanguage = C.RoomCreateLanguage ?? "EN";
	if (ChatAdminDefaultLanguage == null) ChatAdminDefaultLanguage = ServerChatRoomSupportedLanguages[0];
	if (ServerChatRoomSupportedLanguages.indexOf(ChatAdminDefaultLanguage) < 0) ChatAdminDefaultLanguage = ServerChatRoomSupportedLanguages[0];

	// Migrate SearchSettings
	let updateSearchSettings = false;
	if (!C.ChatSearchSettings) {
		C.ChatSearchSettings = {
			Language: "",
			Space: "",
			Game: "",
			FullRooms: true,
			ShowLocked: true,
			SearchDescriptions: false,
			MapTypes: "",
			RoomMinSize: 2,
			RoomMaxSize: 20,
			FilterTerms: "",
		};
		if (C.RoomSearchLanguage != null) {
			C.ChatSearchSettings.Language = C.RoomSearchLanguage;
			C.RoomSearchLanguage = undefined;
			// @ts-ignore Strict-TS: This ought to be deleted server-side
			ServerAccountUpdate.QueueData({ RoomSearchLanguage: null });
		}
		updateSearchSettings = true;
	}
	if (C.ChatSearchFilterTerms) {
		C.ChatSearchSettings.FilterTerms = C.ChatSearchFilterTerms;
		// @ts-ignore Strict-TS: This ought to be deleted server-side
		ServerAccountUpdate.QueueData({ ChatSearchFilterTerms: null });
		updateSearchSettings = true;
	}
	Player.ChatSearchSettings = ServerAccountDataSyncedValidate.ChatSearchSettings(C.ChatSearchSettings, Player);
	if (updateSearchSettings || !CommonObjectEqual(C.ChatSearchSettings, Player.ChatSearchSettings)) {
		ServerAccountUpdate.QueueData({ ChatSearchSettings: C.ChatSearchSettings });
	}

	if (C.LastChatRoom != null && typeof C.LastChatRoom !== "string") {
		// Backward compatability: Convert old-style "Private" to "Visibility" and "Locked" to "Access"
		const data = /** @type {{Private?: boolean; Locked?: boolean }} */ (C.LastChatRoom);
		if (typeof data.Private === "boolean")
			C.LastChatRoom.Visibility = data.Private ? ChatRoomVisibilityMode.UNLISTED : ChatRoomVisibilityMode.PUBLIC;
		if (typeof data.Locked === "boolean")
			C.LastChatRoom.Access = data.Locked ? ChatRoomAccessMode.ADMIN : ChatRoomAccessMode.PUBLIC;

		if (ChatRoomValidateProperties(C.LastChatRoom))
			Player.LastChatRoom = C.LastChatRoom;
	}

	// Load the last chat room; this is validated by ChatRoomSync/Properties once we re-enter the room
	Player.LastMapData = ServerIsMapData(C.LastMapData) ? C.LastMapData : undefined;

	// Loads the ownership data
	Player.Ownership = ServerAccountDataSyncedValidate.Ownership(C.Ownership, Player);
	if (Player.Ownership != null) {
		Player.Owner = Player.IsFullyOwned() ? Player.Ownership.Name : "";
	}

	// @ts-expect-error: FIXME: Property 'Name' is optional in type 'ServerLovership' but required in type 'Lovership'
	// Ensures lovership data is compatible and converts lovers to lovership
	Player.Lovership = Array.isArray(C.Lovership) ? C.Lovership : C.Lovership != undefined ? [C.Lovership] : [];
	Player.Lover = ServerAccountDataSyncedValidate.Lover(C.Lover, Player);

	Player.RecentlyUsedMapElements = ServerAccountDataSyncedValidate.RecentlyUsedMapElements(C.RecentlyUsedMapElements ?? [], Player);
	// Pre-R134 stored doodads themselves. Write them back as doodad references.
	if (Array.isArray(C.RecentlyUsedMapElements) && typeof C.RecentlyUsedMapElements[0] !== "string") {
		ServerAccountUpdate.QueueData({
			RecentlyUsedMapElements: MapPackDoodads(Player.RecentlyUsedMapElements),
		});
	}

	// Calls the preference init to make sure the preferences are loaded correctly
	PreferenceInitPlayer(Player, C);
	Player.AllowedInteractions = C.AllowedInteractions ?? C.ItemPermission ?? AllowedInteractions.OwnerLoversWhitelistAndDomsOnly;
	Player.KinkyDungeonExploredLore = C.KinkyDungeonExploredLore;
	Player.SavedExpressions = C.SavedExpressions ?? [];
	if (!Array.isArray(Player.SavedExpressions))
		Player.SavedExpressions = [];
	if (Player.SavedExpressions.length < 5)
		for (let x = Player.SavedExpressions.length; x < 5; x++)
			Player.SavedExpressions.push(null);

	// Load Favorited Colors
	if (!CommonIsArray(C.SavedColors)) {
		Player.SavedColors = [];
		for (let i = 0; i < ColorPickerNumSaved; i++) {

			if (typeof Player.SavedColors[i] != "object" || isNaN(Player.SavedColors[i].H) || isNaN(Player.SavedColors[i].S) || isNaN(Player.SavedColors[i].V))
				Player.SavedColors[i] = GetDefaultSavedColors()[i];
		}
		Player.SavedColors.length = ColorPickerNumSaved;
	} else {
		Player.SavedColors = C.SavedColors ?? [];
	}

	// Loads the online lists
	Player.WhiteList = Array.isArray(C.WhiteList) ? C.WhiteList : [];
	Player.BlackList = Array.isArray(C.BlackList) ? C.BlackList : [];
	Player.FriendList = Array.isArray(C.FriendList) ? C.FriendList : [];
	Player.GhostList = Array.isArray(C.GhostList) ? C.GhostList : [];

	// Attempt to parse friend namespace
	let friendNames = undefined;
	if (typeof C.FriendNames === "string") {
		try {
			const data = LZString.decompressFromUTF16(C.FriendNames);
			if (data === null) throw new Error();
			const json = /** @type {[number, string][]} */(JSON.parse(data));
			friendNames = new Map(json);
		} catch (_err) {
			console.error("An error occured while parsing friendnames, entries have been reset.");
		}
	}
	Player.FriendNames = friendNames ?? new Map();

	let submissivesList = undefined;
	if (typeof C.SubmissivesList === "string") {
		try {
			const data = LZString.decompressFromUTF16(C.SubmissivesList);
			if (data === null) throw new Error();
			const json = JSON.parse(data);
			if (!CommonIsArray(json)) throw new Error();
			const numbers = /** @type {number[]} */(json.filter(Number));
			submissivesList = new Set(numbers);
		} catch (_err) {
			console.error("An error occured while parsing submissives, entries have been reset.");
		}
	}
	Player.SubmissivesList = submissivesList ?? new Set();
	Player.Infiltration = ServerAccountDataSyncedValidate.Infiltration(C.Infiltration, Player);
	LoginDifficulty(false);

	// Loads the inventory data
	if (typeof C.InventoryData === "string" && C.InventoryData !== "") {
		// We keep track of that to be able to tell if there's been changes in the inventory
		Player.InventoryData = C.InventoryData;
	}
	const loadedInventory = InventoryLoad(C.Inventory ?? "", C.InventoryData ?? "");
	LoginPerformInventoryFixups(loadedInventory);
	const fixedUp = LoginPerformAppearanceFixups(C.Appearance ?? []);
	InventoryAddMany(Player, loadedInventory, false);
	ServerPlayerInventorySync();
	const updated = ServerAppearanceLoadFromBundle(Player, C.AssetFamily, C.Appearance ?? [], C.MemberNumber);
	if (fixedUp || updated) {
		// Refresh the character server-side if we had to tweak the appearance
		ServerPlayerAppearanceSync();
	}

	ReputationLoad(C.Reputation);
	SkillLoad(C.Skill);
	Player.ConfiscatedItems = C.ConfiscatedItems ?? [];
	Player.ExtensionSettings = C.ExtensionSettings ?? {};
	Player.KeybindingSettings = C.KeybindingSettings ?? "";

	PrivateCharacterMax = 4 + (LogQuery("Expansion", "PrivateRoom") ? 4 : 0) + (LogQuery("SecondExpansion", "PrivateRoom") ? 4 : 0);
	CharacterRefresh(Player, false);
	if (ManagementIsClubSlave()) CharacterNaked(Player);

	// Starts the game in the main hall while loading characters in the private room
	PrivateCharacter = [];
	PrivateCharacter.push(Player);
	let shouldSyncPrivate = false;
	if (C.PrivateCharacter != null)
		for (let P = 0; P < C.PrivateCharacter.length; P++)
			shouldSyncPrivate = PrivateLoadCharacter(C.PrivateCharacter[P]) || shouldSyncPrivate;
	if (shouldSyncPrivate) {
		ServerPrivateCharacterSync();
	}
	SarahSetStatus();

	// Fixes a few items
	var InventoryBeforeFixes = InventoryStringify(Player);
	LoginFixOwner();
	LoginValidCollar();
	LoginMistressItems();
	LoginClubCard();
	LoginStableItems();
	LoginMaidItems();
	LoginLoversItems();
	LoginAsylumItems();
	LoginCheatItems();
	LoginValideBuyGroups();
	PrisonRestoreConfiscatedItems();
	AsylumGGTSSAddItems();
	CraftingLoadServer(C.Crafting); // Only run this _after_ `Player.Inventory` is fully ready

	if (InventoryBeforeFixes != InventoryStringify(Player)) ServerPlayerInventorySync();
	CharacterAppearanceValidate(Player);
	if (Player.Crafting.length > 200) Player.Crafting = Player.Crafting.slice(0, 200);

	// Do the version update check
	if (CommonCompareVersion(GameVersion, Player.OnlineSharedSettings.GameVersion ?? "R0") < 0) {
		CommonVersionUpdated = true;
		Player.OnlineSharedSettings.GameVersion = GameVersion;
		ServerAccountUpdate.QueueData({ OnlineSharedSettings: Player.OnlineSharedSettings });
	} else if (CommonCompareVersion(GameVersion, Player.OnlineSharedSettings.GameVersion ?? "R0") > 0) {
		Player.OnlineSharedSettings.GameVersion = GameVersion;
		ServerAccountUpdate.QueueData({ OnlineSharedSettings: Player.OnlineSharedSettings });
	}
}

/**
 * Routes the player to the correct post-login screen after the disclaimer flow completes.
 * @returns {void} Nothing
 */
function LoginDone() {
	DisclaimerOpen((isAccepted) => {
		if (!isAccepted) {
			window.location.reload();
			return;
		}

		// We're done loading, now start the player in whatever screen is appropriate
		if (LogQuery("Locked", "Cell")) {
			// The player has been locked up, they must log back in the cell
			CommonSetScreen("Room", "Cell");
		} else if (Player.Infiltration?.Punishment && (Player.Infiltration.Punishment.Timer ?? 0) > CurrentTime) {
			// The player must log back in Pandora's Box prison
			PandoraWillpower = 0;
			if (InfiltrationMissionState) {
				// XXX: so we just restore half a mission? what is going on there?
				InfiltrationMissionState.Difficulty = Player.Infiltration.Punishment.Difficulty;
			}
			CommonSetScreen("Room", "PandoraPrison");
		} else if (AsylumIsIsolated() || AsylumIsCommitted() || AsylumGGTSGetLevel(Player) >= 6) {
			// The player must log back in the asylum
			if (AsylumGGTSGetLevel(Player) <= 5) {
				AsylumEntranceWearPatientClothes(Player, true);
			} else {
				AsylumGGTSDroneDress(Player);
			}
			CommonSetScreen("Room", "AsylumBedroom");
		} else if (LogValue("ForceGGTS", "Asylum") ?? 0 > 0) {
			// The owner is forcing the player to do GGTS
			CommonSetScreen("Room", "AsylumEntrance");
		} else if (LogQuery("SleepCage", "Rule") && Player.IsOwned() === "npc" && PrivateOwnerInRoom()) {
			// The player must start in her room, in her cage
			InventoryRemove(Player, "ItemFeet");
			InventoryRemove(Player, "ItemLegs");
			Player.Cage = true;
			PoseSetActive(Player, "Kneel", true);
			CommonSetScreen("Room", "Private");
		} else {
			CommonSetScreen("Room", "MainHall");
		}

		Fullscreen.UpdateButton();
	});
}

/**
 * Handles player login response data
 * @param {ServerLoginResponse} C - The Login response data - this will either be the player's character data if the
 * login was successful, or a string error message if the login failed.
 * @returns {void} Nothing
 */
function LoginResponse(C) {
	if (typeof C === "string") {
		LoginSetStatus(C, true);
		return;
	}

	// The response must contain a name, an ID and an account name
	if (!(CommonIsObject(C)
		&& typeof C.AccountName === "string" && !!C.AccountName.length
		&& typeof C.Name === "string" && !!C.Name.length
		&& typeof C.ID === "string" && !!C.ID.length)) {
		LoginSetStatus("ErrorLoadingCharacterData", true);
		return;
	}

	if (ServerHandleRelog(C)) {
		// We're resuming after a temporary disconnect. Skip the rest of the login process
		return;
	}

	CharacterCreatePlayer();

	// In regular mode, we set the account properties for a new club session
	LoginSetupPlayer(C);

	// Enables the AFK timer for the current player only
	AfkTimerSetEnabled(Player.OnlineSettings.EnableAfkTimer);
	ActivitySetArousal(Player, 0);
	ActivityTimerProgress(Player, 0);
	NotificationLoad();
	KeyManager.deserialize();

	if (ManagementIsClubSlave()) CharacterNaked(Player);

	ServerIsLoggedIn_ = true;

	LoginDone();
}

/**
 * Attempt to log the user in based on their input username and password
 * @param {string} Name
 * @param {string} Password
 * @returns {void} Nothing
 */
function LoginDoLogin(Name, Password) {
	// Ensure the login request is not sent twice
	if (LoginSubmitted || !ServerIsConnected) return;

	if (!ServerAccountPasswordRegex.test(Name) || !ServerAccountPasswordRegex.test(Password)) {
		LoginSetStatus("InvalidNamePassword");
		return;
	}
	LoginStatusReset();
	LoginSubmitted = true;
	ServerSend("AccountLogin", { AccountName: Name, Password: Password });
}

/**
 * Resets the login submission state
 * @returns {void} Nothing
 */
function LoginStatusReset() {
	LoginSubmitted = false;
	LoginQueuePosition = -1;
	LoginErrorMessage = "";
}

/**
 *
 * @param {string} [ErrorMessage] - the login error message to set if the login is invalid - if not specified, will clear the login error message
 * @param {boolean} [reset]
 */
function LoginSetStatus(ErrorMessage = "", reset = false) {
	if (reset) {
		LoginStatusReset();
	}
	LoginErrorMessage = ErrorMessage ?? "";
}

/**
 * Retrieves the correct message key based on the current state of the login page
 * @returns {string | null} The current login status, or null if we're not currently attempting to log in
 */
function LoginGetStatus() {
	if (LoginErrorMessage) {
		return TextGet(LoginErrorMessage);
	} else if (!ServerIsConnected) {
		return TextGet("ConnectingToServer");
	} else if (LoginQueuePosition !== -1) {
		return TextGet("LoginQueueWait").replace("QUEUE_POS", `${LoginQueuePosition}`);
	} else if (LoginSubmitted) {
		return TextGet("ValidatingNamePassword");
	} else {
		return null;
	}
}
