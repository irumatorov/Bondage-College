"use strict";

/**
 * The duration temporary status message show up for, in ms
 * @type {number}
 */
var DialogTextDefaultDuration = 5000;
/**
 * The default color to use when applying items.
 * @type {null | HexColor}
 */
var DialogColorSelect = null;
/**
 * The list of available items for the selected group.
 * @type {DialogInventoryItem[]}
 */
var DialogInventory = [];
/**
 * The current page offset of the item list. Also used for activities.
 * @type {number}
 */
var DialogInventoryOffset = 0;

/**
 * The duration temporary status message show up for, in ms
 * @type {HTMLInputElement | null}
 */
let DialogItemSearchBar = null;
let DialogItemSearchBarAutoClose = false;

/**
 * The grid configuration for most item views (items, permissions, activities)
 * @type {CommonGenerateGridParameters}
 */
const DialogInventoryGrid = (() => {
	const gap = 20;
	const padding = 25;
	const topButtonSize = 90;
	const itemWidth = 200;
	const itemHeight = 244;
	return {
		x: 2000 - padding - (9 * topButtonSize + 8 * gap),
		y: 185,
		width: 4 * itemWidth + 3 * gap,
		height: 3 * itemHeight + 2 * gap,
		itemWidth,
		itemHeight,
	};
})();

/**
 * The item currently selected in the Dialog and showing its extended screen.
 *
 * Note that in case this is a lock, the item being locked is available in {@link DialogFocusSourceItem}.
 * @type {Item|null}
 */
var DialogFocusItem = null;
/** @type {Item|null} */
var DialogTightenLoosenItem = null;
/**
 * The actual item being locked while the lock asset has its extended screen drawn.
 * @type {Item|null}
 */
var DialogFocusSourceItem = null;
/**
 * The group + name of the selected item.
 * Only here so in case of emergency we can still unload the extended screen properly
 *
 * @type {string|null}
 */
var DialogFocusItemName = null;
/** @type {ReturnType<typeof setTimeout>} */
var DialogFocusItemColorizationRedrawTimer = /** @type {never} */ (null);
/**
 * The list of currently visible menu item buttons.
 * @type {DialogMenuButtonType[]}
 */
var DialogMenuButton = [];
/**
 * The dialog's current mode, what is currently shown.
 * @type {null | DialogMenuMode}
 */
var DialogMenuMode = null;

/**
 * The group that was selected before we entered the expression coloring screen
 * @type {{mode: DialogMenuMode, group: AssetItemGroup} | null}
 */
var DialogExpressionPreviousMode = null;

var DialogFacialExpressionsSelectedBlindnessLevel = 2;
var DialogExtendedMessage = "";
/**
 * The list of available activities for the selected group.
 * @type {ItemActivity[]}
 */
var DialogActivity = [];
/** @satisfies {Record<string, DialogSortOrder>} */
var DialogSortOrder = /** @type {const} */({
	Enabled: 1,
	Equipped: 2,
	BothFavoriteUsable: 3,
	TargetFavoriteUsable: 4,
	PlayerFavoriteUsable: 5,
	Usable: 6,
	TargetFavoriteUnusable: 7,
	PlayerFavoriteUnusable: 8,
	Unusable: 9,
	Blocked: 10
});
/**
 * The currently active self-menu.
 * @type {null | DialogSelfMenuName}
 */
var DialogSelfMenuSelected = null;
var DialogLeaveDueToItem = false; // This allows dynamic items to call DialogLeave() without crashing the game
var DialogLentLockpicks = false;
/** @type {ScreenSpecifier | null} */
var DialogGamingReturnScreen = null;
var DialogButtonDisabledTester = /Disabled(For\w+)?$/u;
/**
 * The attempted action that's leading the player to struggle.
 * @type {DialogStruggleActionType | null}
 */
let DialogStruggleAction = null;
/**
 * The item we're struggling out of, or swapping from.
 * @type {Item | null}
 */
let DialogStrugglePrevItem = null;
/**
 * The item we're swapping to.
 * @type {DialogInventoryItem | null}
 */
let DialogStruggleNextItem = null;
/** Whether we went through the struggle selection screen or went straight through. */
let DialogStruggleSelectMinigame = false;

/** @type {Map<string, string>} */
var PlayerDialog = new Map();

/** @type {FavoriteState[]} */
var DialogFavoriteStateDetails = [
	{
		TargetFavorite: true,
		PlayerFavorite: true,
		Icon: "FavoriteBoth",
		UsableOrder: DialogSortOrder.BothFavoriteUsable,
		UnusableOrder: DialogSortOrder.TargetFavoriteUnusable
	},
	{
		TargetFavorite: true,
		PlayerFavorite: false,
		Icon: "Favorite",
		UsableOrder: DialogSortOrder.TargetFavoriteUsable,
		UnusableOrder: DialogSortOrder.TargetFavoriteUnusable
	},
	{
		TargetFavorite: false,
		PlayerFavorite: true,
		Icon: "FavoritePlayer",
		UsableOrder: DialogSortOrder.PlayerFavoriteUsable,
		UnusableOrder: DialogSortOrder.PlayerFavoriteUnusable
	},
	{
		TargetFavorite: false,
		PlayerFavorite: false,
		UsableOrder: DialogSortOrder.Usable,
		UnusableOrder: DialogSortOrder.Unusable
	},
];

/**
 * The list of self-menu types available when clicking on yourself.
 *
 * The order of items in this list represents the menu iteration order as honored by the "view next page" spin button.
 * @type {readonly DialogSelfMenuName[]}
 */
var DialogSelfMenuOptions = [
	"Expression",
	"Pose",
	"SavedExpressions",
	"OwnerRules",
];

/**
 * Namespace with {@link DialogLeaveFocusItem} helpers for setting up new screens.
 * @namespace
 */
var DialogLeaveFocusItemHandlers = {
	/**
	 * Screen setup callbacks for after exiting the tighten/loosen menu; screen names are used as keys.
	 * @type {Partial<Record<ScreenName, (item: Item) => void>>}
	 */
	DialogTightenLoosenItem: {
		Crafting: (item) => {
			// Subtract deterministic modifiers so that only the difficulty factor remains
			/** @type {CraftingItemSelected} */ (CraftingSelectedItem).DifficultyFactor = (
				(item.Difficulty ?? 0)
				- SkillGetLevel(Player, "Bondage")
				- item.Asset.Difficulty
				- (item.Craft?.Effects?.Secure ?? 0) * 4
			);
			item.Difficulty = item.Asset.Difficulty;
			CraftingModeSet("Name");
		},
	},

	/**
	 * Screen setup callbacks for after exiting the extended item menu; screen names are used as keys.
	 * @type {Partial<Record<ScreenName, (item: Item) => void>>}
	 */
	DialogFocusItem: {
		Appearance: () => {
			// Manually restore the focus group (if it was set) as `DialogLeave` de-initializes it

			// TODO: Review the logic here as it seems that either the appearance menu is abusing DialogLeave,
			// or DialogLeave is too hyper focused on dialog and doing things that it really shouldn't.
			// The fact that there's a `DialogFocusItem()` > `DialogLeave()` > `DialogFocusItem()` stack trace going on here is also highly suspicious,
			// suggesting that it might be moreso the former
			const focusGroup = Player.FocusGroup;
			DialogLeave();
			Player.FocusGroup = focusGroup;
		},
		Crafting: (item) => {
			CraftingUpdateFromItem(item);
			CraftingModeSet("Name");
		},
		Shop2: () => {
			Shop2Vars.Mode = "Preview";
			CommonPromiseCatch(Shop2Load());
		},
	},
};

/**
 * Returns character based on argument
 * @param {Character | "Player" | "CurrentCharacter"} C - The character to get; can be `"Player"` to get player or empty to get current
 * @returns {Character} - The actual character
 */
function DialogGetCharacter(C) {
	switch (C) {
		case "Player":
			return Player;
		case "CurrentCharacter":
			// @ts-ignore Strict-TS: force-cast here because there's a bunch of side-effects to having this return `null`
			return CurrentCharacter;
		default:
			if (typeof C === "string") {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				throw new Error(`Unknown character type "${C}"`);
			} else {
				return C;
			}
	}
}

/**
 * Compares the player's reputation with a given value
 * @param {ReputationType} RepType - The name of the reputation to check
 * @param {number} Value - The value to compare
 * @returns {boolean} - Returns TRUE if a specific reputation type is less or equal than a given value
 */
function DialogReputationLess(RepType, Value) { return ReputationGet(RepType) <= Value; }

/**
 * Compares the player's reputation with a given value
 * @param {ReputationType} RepType - The name of the reputation to check
 * @param {number} Value - The value to compare
 * @returns {boolean} - Returns TRUE if a specific reputation type is greater or equal than a given value
 */
function DialogReputationGreater(RepType, Value) { return ReputationGet(RepType) >= Value; }

/**
 * Compares the player's money with a given amount
 * @param {number} Amount - The amount of money that must be met
 * @returns {boolean} - Returns TRUE if the player has enough money
 */
function DialogMoneyGreater(Amount) { return Player.Money >= Amount; }

/**
 * Changes a given player's account by a given amount
 * @param {number} Amount - The amount that should be charged or added to the player's account
 * @returns {void} - Nothing
 */
function DialogChangeMoney(Amount) { CharacterChangeMoney(Player, Amount); }

/**
 * Alters the current player's reputation by a given amount
 * @param {ReputationType} RepType - The name of the reputation to change
 * @param {number} Value - The value, the player's reputation should be altered by
 * @returns {void} - Nothing
 */
function DialogSetReputation(RepType, Value) { ReputationChange(RepType, ReputationGet(RepType) * -1 + Value); } // Sets a fixed number for the player specific reputation

/**
 * Change the player's reputation progressively through dialog options (a reputation is easier to break than to build)
 * @param {ReputationType} RepType - The name of the reputation to change
 * @param {number} Value - The value, the player's reputation should be altered by
 * @returns {void} - Nothing
 */
function DialogChangeReputation(RepType, Value) { ReputationProgress(RepType, Value); }

/**
 * Equips a specific item on the player from dialog
 * @param {AssetName} AssetName - The name of the asset that should be equipped
 * @param {AssetGroupName} AssetGroup - The name of the corresponding asset group
 * @returns {void} - Nothing
 */
function DialogWearItem(AssetName, AssetGroup) { InventoryWear(Player, AssetName, AssetGroup); }

/**
 * Equips a random item from a given group to the player from dialog
 * @param {AssetGroupName} AssetGroup - The name of the asset group to pick from
 * @returns {void} - Nothing
 */
function DialogWearRandomItem(AssetGroup) { InventoryWearRandom(Player, AssetGroup); }

/**
 * Removes an item of a specific item group from the player
 * @param {AssetGroupName} AssetGroup - The item to be removed belongs to this asset group
 * @returns {void} - Nothing
 */
function DialogRemoveItem(AssetGroup) { InventoryRemove(Player, AssetGroup); }

/**
 * Releases a character from restraints
 * @param {"Player" | "CurrentCharacter" | Character} C - The character to be released.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {void} - Nothing
 */
function DialogRelease(C) { CharacterRelease(DialogGetCharacter(C)); }

/**
 * Strips a character naked and removes the restraints
 * @param {"Player" | "CurrentCharacter" | Character} C - The character to be stripped and released.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {void} - Nothing
 */
function DialogNaked(C) { CharacterNaked(DialogGetCharacter(C)); }

/**
 * Fully restrain a character with random items
 * @param {"Player" | "CurrentCharacter" | Character} C - The character to be restrained.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {void} - Nothing
 */
function DialogFullRandomRestrain(C) { CharacterFullRandomRestrain(DialogGetCharacter(C)); }

/**
 * Checks, if a specific log has been registered with the player
 * @template {LogGroupType} T
 * @param {LogNameType[T]} LogType - The name of the log to search for
 * @param {T} LogGroup - The name of the log group
 * @returns {boolean} - Returns true, if a specific log is registered
 */
function DialogLogQuery(LogType, LogGroup) { return LogQuery(LogType, LogGroup); }

/**
 * Sets the AllowItem flag on the current character
 * @param {string} Allow - The flag to set. Either "TRUE" or "FALSE"
 */
function DialogSetAllowItem(Allow) { if (CurrentCharacter) CurrentCharacter.AllowItem = (Allow.toUpperCase().trim() == "TRUE"); }

/**
 * Returns the value of the AllowItem flag of a given character
 * @param {"Player" | "CurrentCharacter" | Character} C - The character whose flag should be returned.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - The value of the given character's AllowItem flag
 */
function DialogAllowsItem(C) { C = DialogGetCharacter(C ?? CharacterGetCurrent()); return C?.AllowItem ?? false; }

/**
 * Returns TRUE if no item can be used by the player on the current character because of the map distance
 * @returns {boolean} - TRUE if distance is too far (more than 1 tile)
 * @deprecated
 */
function DialogDontAllowItemDistance() {
	if ((CurrentCharacter == null) || CurrentCharacter.IsPlayer()) return false;
	if ((CurrentScreen !== "ChatRoom") || !ChatRoomMapViewIsActive()) return false;
	if (ChatRoomMapViewHasSuperPowers() || ChatRoomMapViewCharacterOnWhisperRange(CurrentCharacter)) return false;
	return true;
}

/**
 * Determines if the given character is kneeling
 * @param {"Player" | "CurrentCharacter" | Character} C - The character to check
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - Returns true, if the given character is kneeling
 */
function DialogIsKneeling(C) { return DialogGetCharacter(C).IsKneeling(); }

/**
 * Determines if the player is owned by the current character
 * @returns {boolean} - Returns true, if the player is owned by the current character, false otherwise
 */
function DialogIsOwner() { return CurrentCharacter?.IsOwner() ?? false; }

/**
 * Determines, if the current character is the player's lover
 * @returns {boolean} - Returns true, if the current character is one of the player's lovers
 */
function DialogIsLover() { return CurrentCharacter?.IsLoverOfCharacter(Player) ?? false; }

/**
 * Determines if the current character is owned by the player
 * @returns {boolean} - Returns true, if the current character is owned by the player, false otherwise
 */
function DialogIsProperty() { return CurrentCharacter?.IsOwnedByPlayer() ?? false; }

/**
 * Checks, if a given character is currently restrained
 * @param {"Player" | "CurrentCharacter" | Character} C - The character to check.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - Returns true, if the given character is wearing restraints, false otherwise
 */
function DialogIsRestrained(C) { return DialogGetCharacter(C).IsRestrained(); }

/**
 * Checks, if a given character is currently blinded
 * @param {"Player" | "CurrentCharacter" | Character} C - The character to check.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - Returns true, if the given character is blinded, false otherwise
 */
function DialogIsBlind(C) { return DialogGetCharacter(C).IsBlind(); }

/**
 * Checks, if a given character is currently wearing a vibrating item
 * @param {"Player" | "CurrentCharacter" | Character} C - The character to check.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - Returns true, if the given character is wearing a vibrating item, false otherwise
 */
function DialogIsEgged(C) { return DialogGetCharacter(C).IsEgged(); }

/**
 * Checks, if a given character is able to change her clothes
 * @param {"Player" | "CurrentCharacter" | Character} C - The character to check.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @returns {boolean} - Returns true, if the given character is able to change clothes, false otherwise
 */
function DialogCanInteract(C) { return DialogGetCharacter(C).CanInteract(); }

/**
 * Sets a new pose for the given character
 * @param {"Player" | "CurrentCharacter"} C - The character whose pose should be altered.
 * Either the player (value: Player) or the current character (value: CurrentCharacter)
 * @param {null | AssetPoseName} [NewPose] - The new pose, the character should take.
 * Can be omitted to bring the character back to the standing position.
 * @returns {void} - Nothing
 */
function DialogSetPose(C, NewPose=null) { PoseSetActive(DialogGetCharacter(C), NewPose || null, true); }

/**
 * Checks, whether a given skill of the player is greater or equal a given value
 * @param {SkillType} SkillType - Name of the skill to check
 * @param {number} Value - The value, the given skill must be compared to
 * @returns {boolean} - Returns true if a specific skill is greater or equal than a given value
 */
function DialogSkillGreater(SkillType, Value) { return SkillGetLevel(Player, SkillType) >= Value; }

/**
 * Checks, if a given item is available in the player's inventory
 * @param {AssetName} InventoryName
 * @param {AssetGroupName} InventoryGroup
 * @returns {boolean} - Returns true, if the item is available, false otherwise
 */
function DialogInventoryAvailable(InventoryName, InventoryGroup) { return InventoryAvailable(Player, InventoryName, InventoryGroup); }

/**
 * Checks, if the player is the administrator of the current chat room
 * @returns {boolean} - Returns true, if the player belongs to the group of administrators for the current char room false otherwise
 */
function DialogChatRoomPlayerIsAdmin() { return (ChatRoomPlayerIsAdmin() && ServerPlayerIsInChatRoom()); }

/**
 * Checks, if a safe word can be used.
 * @returns {boolean} - Returns true, if the player is currently within a chat room
 */
function DialogChatRoomCanSafeword() { return ServerPlayerIsInChatRoom() && !AsylumGGTSIsEnabled() && Player.GameplaySettings.EnableSafeword; }

/**
 * Checks if the player is currently owned.
 * @returns {boolean} - Returns true, if the player is currently owned by an online player (not in trial)
 */
function DialogCanViewRules() { return Player.IsFullyOwned(); }

/**
 * Checks if the has enough GGTS minutes to spend on different activities, for GGTS level 6 and up
 * @param {number} Minute - The number of minutes to compare
 * @returns {boolean} - TRUE if the player has enough minutes
 */
function DialogGGTSMinuteGreater(Minute) { return AsylumGGTSHasMinutes(Minute); }

/**
 * Checks if the player can spend GGTS minutes on herself, for GGTS level 6 and up
 * @returns {boolean} - TRUE if the player has enough minutes
 */
function DialogGGTSCanSpendMinutes() { return (AsylumGGTSIsEnabled() && (AsylumGGTSGetLevel(Player) >= 6)); }

/**
 * The player can ask GGTS for specific actions at level 6, requiring minutes as currency
 * @param {GGTSTask | "MoneyForMinutes" | "GetHelmet"} Action - The action to trigger
 * @param {string} Minute - The number of minutes to spend
 * @returns {void}
 */
function DialogGGTSAction(Action, Minute) {
	AsylumGGTSDialogAction(Action, CommonParseInt(Minute, 10) ?? 0);
}

/**
 * Checks if the player can beg GGTS to unlock the room
 * @returns {boolean} - TRUE if GGTS can unlock
 */
function DialogGGTSCanUnlock() {
	return (ChatRoomPlayerIsAdmin() && ServerPlayerIsInChatRoom() && AsylumGGTSHasMinutes(30) && ChatRoomIsLocked());
}

/**
 * Checks if the player can get the GGTS helmet, only available from GGTS
 * @returns {boolean} - TRUE if GGTS can unlock
 */
function DialogGGTSCanGetHelmet() {
	return (AsylumGGTSHasMinutes(200) && (!InventoryAvailable(Player, "FuturisticHelmet", "ItemHood") || !InventoryAvailable(Player, "GGTSHelmet", "ItemHood")));
}

/**
 * Nurses can do special GGTS interactions with other players
 * @returns {boolean} - TRUE if the player is a nurse in a GGTS room
 */
function DialogCanStartGGTSInteractions() {
	return (AsylumGGTSIsEnabled() && (CurrentCharacter != null) && (AsylumGGTSGetLevel(CurrentCharacter) >= 1) && !DialogCanWatchKinkyDungeon() && (ReputationGet("Asylum") > 0));
}

function DialogIsMaid() {
	return LogQuery("JoinedSorority", "Maid");
}

function DialogIsHeadMaid() {
	return LogQuery("LeadSorority", "Maid");
}

/**
 * Nurses can ask GGTS for specific interactions with other players
 * @param {string} Interaction - The interaction to trigger
 * @returns {void}
 * @deprecated
 */
function DialogGGTSInteraction(Interaction) {
}

/**
 * Checks the prerequisite for a given dialog
 * @param {DialogLine} dialog - The dialog to check
 * @returns {boolean} - Returns true, if the prerequisite is met, false otherwise
 */
function DialogPrerequisite(dialog) {
	const prereq = dialog.Prerequisite?.trim();
	if (!prereq) return true;

	const match = prereq.match(/^(!?)(Player|CurrentCharacter)\.(\w+)\(\)$/);
	if (match) {
		const [, neg, target, method] = match;
		const obj = target === "Player" ? Player : CurrentCharacter;
		// eslint-disable-next-line jsdoc/valid-types
		const scalarMethod = /** @type {keyof { [k in keyof Character as Character[k] extends () => ScalarType ? k : never]: Character[k] }} */(method);
		const fn = obj?.[scalarMethod];

		if (typeof fn !== "function") {
			console.error(
				`DialogPrerequisite: Method '${method}' not found on ${target}`,
				{ prereq, dialog }
			);
			return false;
		}

		// @ts-expect-error We do want to pass the proper target so `this` doesn't vanish into `undefined`
		const result = fn.apply(obj);
		return neg ? !result : !!result;
	}

	if (prereq.indexOf("(") > 0) {
		try {
			return !!CommonDynamicFunctionParams(prereq);
		} catch (err) {
			console.error(
				`DialogPrerequisite: Failed dynamic expression`,
				{ prereq, dialog, err }
			);
			return false;
		}
	}

	const negated = prereq.startsWith("!");
	const key = (negated ? prereq.slice(1) : prereq).trim();
	const globalKey = CurrentScreen + key;

	const namespace = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (window));
	if (globalKey in namespace) {
		const value = !!namespace[globalKey];
		return negated ? !value : !!value;
	}

	console.error(
		`DialogPrerequisite: Unrecognized prerequisite format`,
		{
			prereq,
			dialog,
		}
	);

	return false;
}


/**
 * Checks if the player can play VR games
 * @returns {boolean} - Whether or not the player is wearing a VR headset with Gaming type
 */
function DialogHasGamingHeadset() {
	return (!KinkyDungeonReady && Player.Effect.includes("KinkyDungeonParty"));
}

/**
 * Checks if the player can play VR games
 * @returns {boolean} - Whether or not the player is wearing a VR headset with Gaming type
 */
function DialogHasGamingHeadsetReady() {
	return (KinkyDungeonReady && Player.Effect.includes("KinkyDungeonParty"));
}

/**
 * Checks if the player can watch VR games
 * @returns {boolean} - Whether or not the player is wearing a VR headset with Gaming type
 */
function DialogCanWatchKinkyDungeon() {
	if (CurrentCharacter) {
		if (!CurrentCharacter.Effect.includes("KinkyDungeonParty")) return false;

		if (Player.Effect.includes("VR")) return true;
	}
	return false;
}


/**
 * Starts the kinky dungeon game
 * @returns {void}
 */
function DialogStartKinkyDungeon() {
	if (ArcadeKinkyDungeonLoad()) {
		if (CurrentCharacter) {
			if (KinkyDungeonPlayerCharacter != CurrentCharacter) {
				KinkyDungeonGameRunning = false; // Reset the game to prevent carrying over spectator data
			}
			KinkyDungeonPlayerCharacter = CurrentCharacter;
			if (KinkyDungeonPlayerCharacter != Player && CurrentCharacter.MemberNumber) {
				KinkyDungeonGameData = null;
			}
		}
		DialogGamingReturnScreen = CommonGetScreen();
		MiniGameStart("KinkyDungeon", 0, () => { DialogEndKinkyDungeon(); });
	}
}

/**
 * Return to previous room
 * @returns {SafePromise<void>}
 */
async function DialogEndKinkyDungeon() {
	if (DialogGamingReturnScreen) {
		await CommonSetScreen(...DialogGamingReturnScreen);
	}
}

/**
 * Checks whether the player has a key for the item
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item that should be unlocked
 * @returns {boolean} - Returns true, if the player can unlock the given item with a key, false otherwise
 */
function DialogHasKey(C, item) {
	if (InventoryGetItemProperty(item, "SelfUnlock") == false && (!Player.CanInteract() || C.IsPlayer())) return false;
	if (C.IsOwnedByPlayer() && InventoryAvailable(Player, "OwnerPadlockKey", "ItemMisc") && item.Asset.Enable) return true;
	const lock = InventoryGetLock(item);
	if (lock && lock.Asset.FamilyOnly && item.Asset.Enable && LogQuery("BlockFamilyKey", "OwnerRule") && Player.IsFullyOwned()) return false;
	if (C.IsLoverOfPlayer() && InventoryAvailable(Player, "LoversPadlockKey", "ItemMisc") && item.Asset.Enable && !item.Property.LockedBy?.startsWith("Owner")) return true;
	if (lock && lock.Asset.ExclusiveUnlock) {
		// Locks with exclusive access (intricate, high-sec)
		const allowedMembers = CommonConvertStringToArray(item.Property?.MemberNumberListKeys ?? "");
		// High-sec, check if we're in the keyholder list
		if (item.Property?.MemberNumberListKeys != null) return allowedMembers.includes(Player.MemberNumber);
		// Intricate, check that we added that lock
		if (item.Property?.LockMemberNumber == Player.MemberNumber) return true;
	}
	let UnlockName = /** @type {EffectName} */("Unlock" + item.Asset.Name);
	if ((item.Property != null) && (item.Property.LockedBy != null))
		UnlockName = /** @type {EffectName} */("Unlock" + item.Property.LockedBy);

	const key = Asset.find(a => InventoryItemHasEffect(AppearanceItem.fromAsset(a), UnlockName));
	if (key && InventoryAvailable(Player, key.Name, key.Group.Name)) {
		if (lock != null) {
			if (lock.Asset.LoverOnly && !C.IsLoverOfPlayer()) return false;
			if (lock.Asset.OwnerOnly && !C.IsOwnedByPlayer()) return false;
			if (lock.Asset.FamilyOnly && !C.IsFamilyOfPlayer()) return false;
			return true;
		} else {
			return true;
		}
	}
	return false;
}

/**
 * Checks whether the player is able to unlock the provided item on the provided character
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} item - The item that should be unlocked
 * @returns {boolean} - Returns true, if the player can unlock the given item, false otherwise
 */
function DialogCanUnlock(C, item) {
	if ((!C.IsPlayer()) && !Player.CanInteract()) return false;
	if (!item) return true;
	if (item.Property.LockedBy === "ExclusivePadlock") return !C.IsPlayer();
	if (LogQuery("KeyDeposit", "Cell")) return false;
	if (item.Asset.OwnerOnly) return item.Asset.Enable && C.IsOwnedByPlayer();
	if (item.Asset.LoverOnly) return item.Asset.Enable && C.IsLoverOfPlayer();
	if (item.Asset.FamilyOnly) return item.Asset.Enable && C.IsFamilyOfPlayer();
	return DialogHasKey(C, item);
}

/**
 * Checks whether we can lockpick a lock.
 * @param {Character} C
 * @param {Item} Item
 * @returns {boolean}
 */
function DialogCanPickLock(C, Item) {
	return DialogGetPickLockDialog(C, Item) === "PickLock";
}

/**
 * Checks whether we can lockpick a lock and return an appropriate dialog key.
 * `"PickLock"` will be returned if the lock can be picked.
 * @param {Character} C
 * @param {Item} Item
 * @returns {`PickLock${PickLockAvailability}`}
 */
function DialogGetPickLockDialog(C, Item) {
	if (!C || !Item) return "PickLockDisabled";

	// Check that the character allows lockpicking
	if (!C.IsPlayer() && C.OnlineSharedSettings && C.OnlineSharedSettings.DisablePickingLocksOnSelf)
		return "PickLockPermissionsDisabled";

	// Check that the lock is accessible, and that we're free to do so
	const groupIsBlocked = Item.Asset.Group.IsItem() && InventoryGroupIsBlocked(C, Item.Asset.Group.Name);
	const playerHandsAreBlocked = InventoryGroupIsBlocked(Player, "ItemHands");
	if (!InventoryAllow(C, Item.Asset) || groupIsBlocked || playerHandsAreBlocked || !InventoryItemIsPickable(Item))
		return "PickLockInaccessibleDisabled";

	// Check that he player can access their tools.
	// Maybe in the future you will be able to hide a lockpick in your panties :>
	if (!Player.CanPickLocks())
		return "PickLockNoPicksDisabled";

	return "PickLock";
}

/**
 * Checks whether we can access a lock.
 *
 * This function is used to enable the locked submenu
 *
 * @param {Character} C - The character wearing the lock
 * @param {Item} Item - The locked item to inspect
 * @returns {boolean}
 */
function DialogCanCheckLock(C, Item) {
	if (!Item) return false;

	// Check that this is a locked item
	const lockedBy = InventoryGetItemProperty(Item, "LockedBy");
	if (!InventoryItemHasEffect(Item, "Lock", true) || !lockedBy)
		return false;

	if (!DialogCanInspectLock(Item) && !DialogCanPickLock(C, Item) && !DialogCanUnlock(C, Item))
		return false;

	return true;
}

/**
 * Some specific screens like the movie studio cannot allow the player to use items on herself, return FALSE if it's the case
 * @returns {boolean} - Returns TRUE if we allow using items
 */
function DialogAllowItemScreenException() {
	if ((CurrentScreen == "MovieStudio") && (MovieStudioCurrentMovie != "")) return false;
	return true;
}

/**
 * Returns the character's dialog intro
 * @param {Character} C - The target character in question
 * @returns {string} - The name of the current dialog, if such a dialog exists, any empty string otherwise
 */
function DialogIntro(C) {
	const dialog = C?.Dialog.find(d => d.Stage == C.Stage && d.Option === null && d.Result !== null && DialogPrerequisite(d));
	return dialog?.Result ?? "";
}

/**
 * Generic dialog function to leave conversation. De-initializes global variables and reverts the
 * FocusGroup of the player and the current character to null
 * @param {null | DialogLeave.Options} options - Further customization options
 * @returns {void} - Nothing
 */
function DialogLeave(options=null) {
	options ??= {};

	DialogLeaveFocusItem(false);

	// Reset the character's height
	if (CurrentCharacter && CharacterAppearanceForceUpCharacter == CurrentCharacter.MemberNumber) {
		CharacterAppearanceForceUpCharacter = -1;
		CharacterRefresh(CurrentCharacter, false, false);
	}

	// Reset the mode, selected group & character, exiting the dialog
	DialogMenuMode = null;
	Object.values(DialogMenuMapping).forEach(obj => obj.Exit());

	// Clear dialog struggle data
	DialogStruggleAction = null;
	DialogStrugglePrevItem = null;
	DialogStruggleNextItem = null;
	DialogStruggleSelectMinigame = false;

	// Stop sounds & expressions from struggling/swapping items
	AudioDialogStop();

	// Stop any struggling minigame
	if (StruggleMinigameIsRunning()) {
		StruggleMinigameStop();
	}

	// If we're in the two-character dialog, clear their focused group
	Player.FocusGroup = null;
	if (CurrentCharacter) {
		CurrentCharacter.FocusGroup = null;
		CurrentCharacter.ClickedOption = null;
		CurrentCharacter = null;
	}

	// Reset the state of the self menu
	DialogSelfMenuSelected = null;
	Object.values(DialogSelfMenuMapping).forEach(obj => obj.Exit());

	// Destroy the remaining color pickers
	ColorPickerExit(true);

	// Go controller, go!
	ControllerClearAreas();

	// Refresh the to-be loaded super screen
	// FIXME: Can't safely call `Load()` here again as many screens are ill equipped for reloads;
	// limit it the `ChatRoom` screen for now unless _explicitly_ requested otherwise
	if (options.reload === true) {
		CommonPromiseCatch(
			CurrentScreenFunctions.Load()
				.then(() => CurrentScreenFunctions.Resize(true))
		);
	} else if (options.reload == null) {
		switch (CurrentScreen) {
			case "ChatRoom":
				CommonPromiseCatch(
					CurrentScreenFunctions.Load()
						.then(() => CurrentScreenFunctions.Resize(true))
				);
				break;
		}
	}
}

/**
 * Generic dialog function to remove a piece of the conversation that's already done
 * @returns {void} - Nothing
 */
function DialogRemove() {
	const C = CurrentCharacter;
	if (!C) return;
	const dialogIndex = C.Dialog.findIndex(dialog => dialog.Stage === C.Stage && dialog.Option === C.ClickedOption && dialog.Option !== null && DialogPrerequisite(dialog));
	if (dialogIndex !== -1) {
		C.Dialog.splice(dialogIndex, 1);
		document.querySelector(`.dialog-dialog-button[data-index="${dialogIndex}"]`)?.remove();
		document.querySelectorAll(".dialog-dialog-button").forEach((e, i) => e.setAttribute("data-index", i.toString()));
	}
}

/**
 * Generic dialog function to remove any dialog from a specific group
 * @param {string} GroupName - All dialog options are removed from this group
 * @returns {void} - Nothing
 */
function DialogRemoveGroup(GroupName) {
	if (!CurrentCharacter) return;
	const GroupNameUpper = GroupName.trim().toUpperCase();
	document.querySelectorAll(`.dialog-dialog-button[data-group="${GroupNameUpper}" i]`).forEach(e => e.remove());
	document.querySelectorAll(".dialog-dialog-button").forEach((e, i) => e.setAttribute("data-index", i.toString()));
	for (let D = CurrentCharacter.Dialog.length - 1; D >= 0; D--)
		if (CurrentCharacter.Dialog[D].Group?.trim().toUpperCase() === GroupNameUpper) {
			CurrentCharacter.Dialog.splice(D, 1);
		}
}

/**
 * Performs a "Back" action through the menu "stack".
 */
function DialogMenuBack() {
	switch (DialogMenuMode) {
		case "activities":
		case "crafted":
		case "locked":
		case "locking":
			DialogChangeMode("items");
			break;

		case "layering":
			Layering.Exit();
			break;

		case "colorItem":
			ItemColorCancelAndExit();
			DialogChangeMode("items");
			break;

		case "colorDefault":
			DialogColorSelect = null;
			DialogChangeMode("items");
			break;

		case "colorExpression": {
			if (!DialogExpressionPreviousMode) return;
			const { mode, group } = DialogExpressionPreviousMode;
			DialogChangeMode(mode ?? "dialog");
			DialogChangeFocusToGroup(Player, group);
			DialogExpressionPreviousMode = null;
		}
			break;

		case "dialog":
			DialogLeave();
			break;

		case "extended":
		case "tighten":
			DialogLeaveFocusItem();
			break;

		case "items":
			DialogLeaveItemMenu();
			break;

		case "permissions":
			DialogChangeMode("items");
			break;

		case "struggle":
			if (StruggleMinigameIsRunning()) {
				StruggleMinigameStop();
				// Move back to the item list only if we automatically started to struggle
				if (!DialogStruggleSelectMinigame) {
					DialogStruggleSelectMinigame = false;
					DialogChangeMode("items");
				}
			} else {
				DialogChangeMode("items");
			}
			break;

		default:
			console.trace(`Unknown menu mode "${DialogMenuMode}, resetting`);
			DialogLeave();
			break;
	}
}

/**
 * Returns whether the current mode shows items.
 * @deprecated
 */
function DialogModeShowsInventory() {
	return DialogMenuMode && ["items", "activities", "locking", "permissions"].includes(DialogMenuMode);
}

/**
 * Helper used to check whether the player is in the Appearance screen
 */
function DialogIsInWardrobe() {
	return CurrentScreen === "Appearance";
}

/**
 * Leaves the item menu for both characters.
 *
 * This exits the item-selecting UI and switches back to the current character's dialog options.
 *
 * @returns {void} - Nothing
 */
function DialogLeaveItemMenu() {
	const C = CharacterGetCurrent();
	if (!C) return;
	DialogChangeFocusToGroup(C, null);
}

/**
 * Leaves the item menu of the focused item (be it the extended item- or tighten/loosen menu) and
 * perform any screen-specific setup for {@link CurrentScreen}.
 * @see {@link DialogLeaveFocusItemHandlers} Namespace with helper functions for setting up new screens
 * @param {boolean} allowModeChange - Whether to allow automatic changes to the `items` dialog mode.
 * Should be set to `false` if any immediate subsequent mode changes or full exits are planned
 */
function DialogLeaveFocusItem(allowModeChange=true) {
	if (DialogTightenLoosenItem != null) {
		const item = DialogTightenLoosenItem;
		TightenLoosenItemExit();

		// If we still have a focused item, then we entered tightening through its extended screen
		const screenCallback = DialogLeaveFocusItemHandlers.DialogTightenLoosenItem[CurrentScreen];
		if (DialogFocusItem) {
			DialogChangeMode("extended");
		} else if (screenCallback) {
			screenCallback(item);
		} else if (allowModeChange) {
			DialogChangeMode("items");
		}
		return;
	}
	if (DialogFocusItem || DialogFocusItemName) {
		const item = DialogFocusItem;
		ExtendedItemExit();
		if (DialogFocusItem) {
			// We're only exiting an extended subscreen
			return;
		}

		const screenCallback = DialogLeaveFocusItemHandlers.DialogFocusItem[CurrentScreen];
		if (screenCallback && item) {
			screenCallback(item);
		} else if (allowModeChange) {
			DialogChangeMode("items");
		}
	}
}

/**
 * Adds the item in the dialog list
 * @param {Character} C - The character the inventory is being built for
 * @param {Item} item - The item to be added to the inventory
 * @param {boolean} isWorn - Should be true, if the item is currently being worn, false otherwise
 * @param {DialogSortOrder} [sortOrder] - Defines where in the inventory list the item is sorted
 * @param {CraftingItem} [craft]
 * @returns {void} - Nothing
 */
function DialogInventoryAdd(C, item, isWorn, sortOrder, craft) {
	const inventoryItem = DialogInventoryCreateItem(C, item, isWorn, sortOrder, craft);
	if (DialogMenuMode !== "permissions") {
		const asset = inventoryItem.Asset;
		if (!isWorn && !asset.Enable)
			return;

		// Make sure we do not add owner/lover/family only items for invalid characters, owner/lover locks can be applied on the player by the player for self-bondage
		if (asset.OwnerOnly && !isWorn && !C.IsOwnedByPlayer())
			if (!C.IsPlayer() || !C.IsOwned() || !asset.IsLock || (C.IsPlayer() && LogQuery("BlockOwnerLockSelf", "OwnerRule")))
				return;
		if (asset.LoverOnly && !isWorn && !C.IsLoverOfPlayer()) {
			if (!asset.IsLock || C.GetLoversNumbers(true).length == 0) return;
			if (C.IsPlayer()) {
				if (LogQuery("BlockLoverLockSelf", "LoverRule")) return;
			}
			else if (!C.IsOwnedByPlayer() || LogQueryRemote(C, "BlockLoverLockOwner", "LoverRule")) return;
		}
		if (asset.FamilyOnly && asset.IsLock && !isWorn && (C.IsPlayer()) && LogQuery("BlockOwnerLockSelf", "OwnerRule")) return;
		if (asset.FamilyOnly && (!C.IsPlayer()) && !C.IsFamilyOfPlayer()) return;
		if (asset.FamilyOnly && asset.IsLock && !C.IsPlayer() && C.IsOwner()) return;
		if (asset.FamilyOnly && asset.IsLock && C.IsPlayer() && (C.IsOwned() === false)) return;

		// Do not show keys if they are in the deposit
		if (LogQuery("KeyDeposit", "Cell") && InventoryIsKey(inventoryItem)) return;

		// Don't allow gendered assets in the opposite-gender-only space
		if (!CharacterAppearanceGenderAllowed(asset)) return;

		// Make sure we do not duplicate the item in the list
		for (const invItem of DialogInventory) {
			if (!DialogAllowItemClick(invItem, inventoryItem)) {
				return;
			}
		}
	}

	// Adds the item to the selection list
	if (inventoryItem.Craft != null) {
		if (inventoryItem.SortOrder.charAt(0) == DialogSortOrder.Usable.toString()) {
			inventoryItem.SortOrder = `${DialogSortOrder.PlayerFavoriteUsable}${inventoryItem.Asset.Description}${inventoryItem.Craft.Name ?? ""}`;
		};
		if (inventoryItem.SortOrder.charAt(0) == DialogSortOrder.Unusable.toString()) {
			inventoryItem.SortOrder = `${DialogSortOrder.PlayerFavoriteUnusable}${inventoryItem.Asset.Description}${inventoryItem.Craft.Name ?? ""}`;
		};
	}
	DialogInventory.push(inventoryItem);
}

/**
 * Creates an individual item for the dialog inventory list
 * @param {Character} C - The character the inventory is being built for
 * @param {Item} item - The item to be added to the inventory
 * @param {boolean} isWorn - Should be true if the item is currently being worn, false otherwise
 * @param {DialogSortOrder} [sortOrder] - Defines where in the inventory list the item is sorted
 * @param {CraftingItem} [craft]
 * @returns {DialogInventoryItem} - The inventory item
 */
function DialogInventoryCreateItem(C, item, isWorn, sortOrder, craft) {
	const asset = item.Asset;
	const favoriteStateDetails = DialogGetFavoriteStateDetails(C, asset);

	// Determine the sorting order for the item
	if (DialogMenuMode !== "permissions") {
		if (InventoryBlockedOrLimited(C, item)) {
			sortOrder = DialogSortOrder.Blocked;
		}
		else if (sortOrder == null) {
			if (asset.DialogSortOverride != null) {
				sortOrder = asset.DialogSortOverride;
			} else {
				if (InventoryAllow(C, asset, undefined, false) && InventoryChatRoomAllow(asset.Category)) {
					sortOrder = favoriteStateDetails.UsableOrder;
				} else {
					sortOrder = favoriteStateDetails.UnusableOrder;
				}
			}
		}
	} else if (sortOrder == null) {
		sortOrder = DialogSortOrder.Enabled;
	}

	/** @type {DialogInventoryItem} */
	const dialogItem = {
		...item,
		Craft: craft,
		Worn: isWorn,
		Icons: [],
		SortOrder: `${sortOrder}${asset.Description}${craft?.Name ?? ""}`,
		Vibrating: isWorn && InventoryItemHasEffect(item, "Vibrating", true),
	};

	// Determine the icons to display in the preview image
	dialogItem.Icons = [
		favoriteStateDetails.Icon ? favoriteStateDetails.Icon : null,
		...DialogGetLockIcon(dialogItem, isWorn),
		InventoryIsAllowedLimited(C, dialogItem) ? /** @type {const} */("AllowedLimited") : null,
		...DialogGetAssetIcons(asset),
		...DialogEffectIcons.GetIcons(dialogItem),
	].filter(i => i != null);
	return dialogItem;
}

/**
 * Returns settings for an item based on whether the player and target have favorited it, if any
 * @param {Character} C - The targeted character
 * @param {Asset} asset - The asset to check favorite settings for
 * @param {string | null} [type] - The type of the asset to check favorite settings for
 * @returns {FavoriteState} - The details to use for the asset
 */
function DialogGetFavoriteStateDetails(C, asset, type = null) {
	const isTargetFavorite = InventoryIsFavorite(C, asset.Name, asset.Group.Name, type);
	const isPlayerFavorite = !C.IsPlayer() && InventoryIsFavorite(Player, asset.Name, asset.Group.Name, type);
	return /** @type {FavoriteState} */ (DialogFavoriteStateDetails.find(F => F.TargetFavorite == isTargetFavorite && F.PlayerFavorite == isPlayerFavorite));
}

/**
 * Return icons representing the asset's current lock state
 * @param {Item} item
 * @param {boolean} isWorn
 */
function DialogGetLockIcon(item, isWorn) {
	/** @type {InventoryIcon[]} */
	const icons = [];
	if (InventoryItemHasEffect(item, "Lock")) {
		if (item.Property && item.Property.LockedBy)
			icons.push(item.Property.LockedBy);
		else
			// One of the default-locked items
			icons.push(isWorn ? "Locked" : "Unlocked");
	} else if (item.Craft?.Partial === false && "Lock" in item.Craft && item.Craft.Lock) {
		const lock = /** @type {Exclude<CraftingItem["Lock"], "">} >*/(item.Craft.Lock);
		if (!isWorn || InventoryItemHasEffect(item, "Lock"))
			icons.push(lock);
	}
	return icons;
}

/**
 * Returns a list of icons associated with the asset
 * @param {Asset} asset - The asset to get icons for
 * @returns {InventoryIcon[]} - A list of icon names
 */
function DialogGetAssetIcons(asset) {
	/** @type {InventoryIcon[]} */
	let icons = [];
	icons = icons.concat(asset.PreviewIcons);
	if (asset.OwnerOnly) icons.push("OwnerOnly");
	if (asset.LoverOnly) icons.push("LoverOnly");
	if (asset.FamilyOnly) icons.push("FamilyOnly");
	if (Array.isArray(asset.Attribute) && asset.Attribute.includes("HandheldItem")) icons.push("Handheld");
	return icons;
}

/**
 * Namespace with functions for getting inventory icons (see {@link DialogEffectIcons.GetIcons})
 * @namespace
 */
const DialogEffectIcons = /** @type {const} */({
	/**
	 * Return icons for each "interesting" effect on the item.
	 * @param {Item} item
	 * @returns {InventoryIcon[]} - A list of icon names.
	 */
	GetIcons: function(item) {
		const effects = new Set([...item.Asset.Effect, ...(item.Property?.Effect ?? [])]);
		const craftingProperty = item.Craft?.Effects;
		return DialogEffectIcons.GetEffectIcons(effects, craftingProperty);
	},
	/** @type {(effects: Iterable<EffectName>, craftEffect?: Partial<Record<CraftingPropertyType, number>>) => InventoryIcon[]} */
	GetEffectIcons: function (effects, craftEffect) {
		/** @type {InventoryIcon[]} */
		const icons = [];
		for (const effect of effects) {
			switch (effect) {
				case "Block":
				case "Freeze":
					icons.push(effect);
					continue;
			}

			const icon = (
				DialogEffectIcons._GetGagIcon(effect, craftEffect)
				|| DialogEffectIcons._GetBlindIcon(effect, craftEffect)
				|| DialogEffectIcons._GetDeafIcon(effect, craftEffect)
			);
			if (icon) {
				icons.push(icon);
			}
		}
		return icons;
	},
	// this fucking variable name really kills me
	/** @type {(effect: EffectName, craftEffect?: Partial<Record<CraftingPropertyType, number>>) => null | InventoryIcon} */
	_GetGagIcon(effect, craftEffect) {
		let level = SpeechGagLevelLookup[/** @type {GagEffectName} */(effect)];
		if (level === undefined) return null;
		if (craftEffect === undefined) return DialogEffectIcons._GagLevelToIcon(level);

		level -= 2 * (craftEffect?.Small ?? 0);
		level += 2 * (craftEffect?.Large ?? 0);
		return DialogEffectIcons._GagLevelToIcon(level);
	},
	/** @type {(effect: EffectName, craftEffect?: Partial<Record<CraftingPropertyType, number>>) => null | InventoryIcon} */
	_GetBlindIcon(effect, craftEffect) {
		let level = CharacterBlindLevels.get(/** @type {BlindEffectName} */(effect));
		if (level === undefined) return null;
		if (craftEffect === undefined) return DialogEffectIcons._BlindLevelToIcon(level);

		level -= (craftEffect?.Thin ?? 0);
		level += (craftEffect?.Thick ?? 0);
		return DialogEffectIcons._BlindLevelToIcon(level);
	},
	/** @type {(effect: EffectName, craftEffect?: Partial<Record<CraftingPropertyType, number>>) => null | InventoryIcon} */
	_GetDeafIcon(effect, craftEffect) {
		let level = CharacterDeafLevels.get(/** @type {DeafEffectName} */(effect));
		if (level === undefined) return null;
		if (craftEffect === undefined) return DialogEffectIcons._DeafLevelToIcon(level);

		level -= (craftEffect?.Audible ?? 0);
		level += (craftEffect?.Deaf ?? 0);
		return DialogEffectIcons._DeafLevelToIcon(level);
	},
	/** @type {(level: number) => null | InventoryIcon} */
	_DeafLevelToIcon(level) {
		if (level < (CharacterDeafLevels.get("DeafLight") ?? 0)) {
			return null;
		} else if (level < (CharacterDeafLevels.get("DeafNormal") ?? 0)) {
			return "DeafLight";
		} else if (level < (CharacterDeafLevels.get("DeafTotal") ?? 0)) {
			return "DeafNormal"; // NOTE: DeafNormal and -Heavy share the `DeafNormal.png` icon
		} else {
			return "DeafHeavy";
		}
	},
	/** @type {(level?: number) => null | InventoryIcon} */
	_GagLevelToIcon: function (level) {
		if (!level || level < SpeechGagLevelLookup.GagVeryLight) {
			return null;
		} else if (level <= SpeechGagLevelLookup.GagEasy) {
			return "GagLight";
		} else if (level <= SpeechGagLevelLookup.GagMedium) {
			return "GagNormal";
		} else if (level <= SpeechGagLevelLookup.GagVeryHeavy) {
			return "GagHeavy";
		} else {
			return "GagTotal";
		}
	},
	/** @type {(level?: number) => null | InventoryIcon} */
	_BlindLevelToIcon: function (level) {
		if (!level || level < (CharacterBlindLevels.get("BlindLight") ?? 0)) {
			return null;
		} else if (level <= (CharacterBlindLevels.get("BlindLight") ?? 0)) {
			return "BlindLight";
		} else if (level <= (CharacterBlindLevels.get("BlindHeavy") ?? 0)) {
			return "BlindNormal";
		} else {
			return "BlindHeavy";
		}
	},
});

/**
 * Some special screens can always allow you to put on new restraints. This function determines, if this is possible
 * @returns {boolean} - Returns trues, if it is possible to put on new restraints.
 */
function DialogAlwaysAllowRestraint() {
	return (CurrentScreen == "Photographic" || CurrentScreen == "Crafting");
}

/**
 * Checks whether the player can use a remote on the given character and item
 * @param {Character} C - the character that the item is equipped on
 * @param {Item} Item - the item to check for remote usage against
 * @returns {VibratorRemoteAvailability} - Returns the status of remote availability: Available, NoRemote, NoLoversRemote, RemotesBlocked, CannotInteract, NoAccess, InvalidItem
 */
function DialogCanUseRemoteState(C, Item) {
	// Can't use remotes if there is no item, or if the item doesn't have the needed effects.
	if (!Item || !InventoryItemHasEffect(Item, "UseRemote")) return "InvalidItem";
	// Can't use remotes if the player cannot interact with their hands
	if (!Player.CanInteract()) return "CannotInteract";
	// Can't use remotes on self if the player is owned and their remotes have been blocked by an owner rule
	if (C.IsPlayer() && Player.IsFullyOwned() && LogQuery("BlockRemoteSelf", "OwnerRule")) return "RemotesBlocked";
	if (Item.Asset.LoverOnly) {
		if (!C.IsLoverOfPlayer()) {
			return "NoAccess";
		} else if (!InventoryAvailable(Player, "LoversVibratorRemote", "ItemVulva")) {
			return "NoLoversRemote";
		} else {
			return "Available";
		}
	} else {

		// Otherwise, the player must have a vibrator remote and some items can block remotes
		if (C.Effect.indexOf("BlockRemotes") >= 0) {
			return "RemotesBlocked";
		}
		if (!InventoryAvailable(Player, "VibratorRemote", "ItemVulva")) {
			return "NoRemote";
		}
		if (LogQuery("BlockRemote", "OwnerRule")) {
			return "NoRemoteOwnerRuleActive";
		}
		return "Available";
	}
}

/**
 * Checks whether the player can color the given item on the given character
 * @param {Character} C - The character on whom the item is equipped
 * @param {Item} Item - The item to check the player's ability to color against
 * @returns {boolean} - TRUE if the player is able to color the item, FALSE otherwise
 */
function DialogCanColor(C, Item) {
	if (!Item || Item.Asset.ColorableLayerCount === 0) {
		return false;
	}
	const canColor = InventoryItemHasEffect(Item, "Lock", true) ? DialogCanUnlock(C, Item) : Player.CanInteract();
	return canColor || DialogAlwaysAllowRestraint();
}

/**
 * Checks whether a lock can be inspected while blind.
 * @param {Item} Item - The locked item
 * @returns {boolean}
 */
function DialogCanInspectLock(Item) {
	if (!Item) return false;

	const lockedBy = InventoryGetItemProperty(Item, "LockedBy");
	return !Player.IsBlind() || !!lockedBy && ["SafewordPadlock", "CombinationPadlock"].includes(lockedBy);
}

/**
 * Builds the possible dialog activity options based on the character settings
 * @param {Character} C - The character for which to build the activity dialog options
 * @param {boolean} reload - Perform a {@link DialogMenu.Reload} hard reset of the active `activities` mode
 * @returns {void} - Nothing
 */
function DialogBuildActivities(C, reload=true) {
	if (C.FocusGroup == null) {
		DialogActivity = [];
	} else {
		DialogActivity = ActivityAllowedForGroup(C, C.FocusGroup.Name);
	}

	if (reload) {
		switch (DialogMenuMode) {
			case "activities":
				CommonPromiseCatch(DialogMenuMapping.activities.Reload(null, { reset: true, resetDialogItems: false }));
				break;
		}
	}
}

/**
 * Build the buttons in the top menu
 * @param {Character} C - The character for whom the dialog is prepared
 * @returns {void} - Nothing
 */
function DialogMenuButtonBuild(C) {

	DialogMenuButton = [];

	if (!DialogAllowSearchMode()) {
		DialogExitSearchMode(C);
	} else if (DialogItemSearchBar) {
		DialogMenuButton = ["Exit", "FilterItemsExit"];
		return;
	}

	// Hide "Exit" button for the screens where
	if (DialogMenuMode && !["colorExpression", "colorItem"].includes(DialogMenuMode))
		DialogMenuButton = ["Exit"];

	// There's no group focused, hence no menu to draw
	if (C.FocusGroup == null) return;

	/** The item in the current slot */
	const Item = /** @type {Item} */ (InventoryGet(C, C.FocusGroup.Name));
	const ItemBlockedOrLimited = !!Item && InventoryBlockedOrLimited(C, Item);
	const IsItemLocked = InventoryItemHasEffect(Item, "Lock", true);
	const IsGroupBlocked = InventoryGroupIsBlocked(C, C.FocusGroup.Name);

	if (DialogMenuMode === "locked") {
		// If the item isn't locked, there are no more buttons to add
		const Lock = InventoryGetLock(Item);
		if (!IsItemLocked || !Lock) return;

		const LockBlockedOrLimited = InventoryBlockedOrLimited(C, Lock) || ItemBlockedOrLimited;

		if (
			!IsGroupBlocked
			&& DialogCanUnlock(C, Item)
		) {
			DialogMenuButton.push("Unlock");
		}
		if (InventoryItemIsPickable(Item)) {
			DialogMenuButton.push(DialogGetPickLockDialog(C, Item));
		}
		if (DialogCanInspectLock(Item)) {
			DialogMenuButton.push(LockBlockedOrLimited ? "InspectLockDisabled" : "InspectLock");
		}

	}

	else if (
		DialogMenuMode === "crafted"
		|| DialogMenuMode === "layering"
		|| DialogMenuMode === "activities"
		|| DialogMenuMode === "locking"
		|| DialogMenuMode === "colorDefault"
		|| DialogMenuMode === "colorExpression"
		|| DialogMenuMode === "colorItem"
	) {
		// No buttons there
	}

	// Pushes all valid main buttons, based on if the player is restrained, has a blocked group, has the key, etc.
	else {
		if (DialogMenuMode === "permissions") {
			DialogMenuButton = ["NormalMode", "FilterItems"];
			return;
		}

		if (IsItemLocked && DialogCanUnlock(C, Item) && !IsGroupBlocked && (!C.IsPlayer() || Player.CanInteract()))
			DialogMenuButton.push("Remove");

		if (
			!IsGroupBlocked
			&& Item?.Asset.AllowTighten
			&& (Player.CanInteract() && (!IsItemLocked || DialogCanUnlock(C, Item)))
		) {
			DialogMenuButton.push("TightenLoosen");
		}

		if (DialogCanCheckLock(C, Item))
			DialogMenuButton.push("LockMenu");

		if ((Item != null) && C.IsPlayer() && (!Player.CanInteract() || (IsItemLocked && !DialogCanUnlock(C, Item))) && (DialogMenuButton.indexOf("Unlock") < 0) && !IsGroupBlocked)
			DialogMenuButton.push("Struggle");

		if ((Item != null) && (Item.Craft != null))
			DialogMenuButton.push("Crafting");

		// If the Asylum GGTS controls the item, we show a disabled button and hide the other buttons
		if (AsylumGGTSControlItem(C, Item)) {
			DialogMenuButton.push("GGTSControl");
		} else if (Item != null) {
			// There's an item in the slot

			if (!IsItemLocked && Player.CanInteract() && !IsGroupBlocked) {
				if (InventoryDoesItemAllowLock(Item)) {
					DialogMenuButton.push(ItemBlockedOrLimited ? "LockDisabled" : "Lock");
				}

				if (InventoryItemHasEffect(Item, "Mounted", true))
					DialogMenuButton.push("Dismount");
				else if (InventoryItemHasEffect(Item, "Enclose", true))
					DialogMenuButton.push("Escape");
				else
					DialogMenuButton.push("Remove");
			}

			const canUseRemoteState = DialogCanUseRemoteState(C, Item);
			if (
				Item.Asset.Extended &&
				(Player.CanInteract() || DialogAlwaysAllowRestraint() || Item.Asset.AlwaysInteract) &&
				(!IsGroupBlocked || Item.Asset.AlwaysExtend) &&
				(!Item.Asset.OwnerOnly || (C.IsOwnedByPlayer())) &&
				(!Item.Asset.LoverOnly || (C.IsLoverOfPlayer())) &&
				(!Item.Asset.FamilyOnly || (C.IsFamilyOfPlayer())) &&
				canUseRemoteState === "InvalidItem"
			) {
				DialogMenuButton.push(ItemBlockedOrLimited ? "UseDisabled" : "Use");
			}

			if (!DialogMenuButton.includes("Use") && canUseRemoteState !== "InvalidItem") {
				/** @type {DialogMenuButtonType | null} */
				let button = null;
				switch (canUseRemoteState) {
					case "Available":
						button = ItemBlockedOrLimited ? "RemoteDisabled" : "Remote";
						break;
					default:
						button = `RemoteDisabledFor${canUseRemoteState}`;
						break;
				}
				DialogMenuButton.push(button);
			}
		}

		// Color selection
		if (DialogCanColor(C, Item)) {
			DialogMenuButton.push(ItemBlockedOrLimited ? "ColorPickDisabled" : "ColorChange");
		} else {
			DialogMenuButton.push("ColorDefault");
		}

		if (DialogActivity.length > 0) DialogMenuButton.push("Activity");
		if (Player.CanInteract()) DialogMenuButton.push("FilterItems");

		// Item permission enter/exit
		if (C.IsPlayer()) {
			DialogMenuButton.push("PermissionMode");
		}

		if (Item != null && !C.IsNpc()) {
			DialogMenuButton.push("Layering");
		}
	}
}

/**
 * Sort the inventory list by the global variable SortOrder (a fixed number & current language description)
 * @returns {void} - Nothing
 */
function DialogInventorySort() {
	DialogInventory.sort((a, b) => a.SortOrder.localeCompare(b.SortOrder, undefined, { numeric: true, sensitivity: 'base' }));
}

/**
 * Returns TRUE if the crafted item can be used on a character, validates for owners and lovers
 * @param {Character} C - The character whose inventory must be built
 * @param {CraftingItem} Craft - The crafting properties of the item
 * @param {Asset} A - The items asset
 * @returns {boolean} - TRUE if we can use it
 */
function DialogCanUseCraftedItem(C, Craft, A) {
	// Validates the craft asset
	if (!C || !Craft || !A) return false;

	if (A.OwnerOnly && !C.IsOwnedByPlayer()) return false;
	if (A.LoverOnly && !(C.IsLoverOfPlayer() || C.IsOwnedByPlayer())) return false;
	if (A.FamilyOnly && !(C.IsFamilyOfPlayer() || C.IsLoverOfPlayer() || C.IsOwnedByPlayer())) return false;

	/** @type {undefined | Asset} */
	const lock = AssetLocks[/** @type {AssetLockType} */(Craft.Lock)];
	if (lock != null) {
		if (lock.OwnerOnly && !DialogCanUseOwnerLockOn(C)) return false;
		if (lock.LoverOnly && !DialogCanUseLoverLockOn(C)) return false;
		if (lock.FamilyOnly && !DialogCanUseFamilyLockOn(C)) return false;
	}
	return true;
}

/**
 * Returns TRUE if the player can use owner locks on the target character
 * @param {Character} target - The target to (potentially) lock
 * @returns {boolean} - TRUE if the player can use owner locks on the target, FALSE otherwise
 */
function DialogCanUseOwnerLockOn(target) {
	return target.IsPlayer()
		? (target.IsOwned() && !LogQuery("BlockOwnerLockSelf", "OwnerRule"))
		: target.IsOwnedByPlayer();
}

/**
 * Returns TRUE if the player can use lover locks on the target character
 * @param {Character} target - The target to (potentially) lock
 * @returns {boolean} - TRUE if the player can use lover locks on the target, FALSE otherwise
 */
function DialogCanUseLoverLockOn(target) {
	return target.IsPlayer()
		? (target.GetLoversNumbers(true).length > 0 && !LogQuery("BlockLoverLockSelf", "LoverRule"))
		: target.IsOwnedByPlayer()
			? !LogQueryRemote(target, "BlockLoverLockOwner", "LoverRule")
			: target.IsLoverOfPlayer();
}

/**
 * Returns TRUE if the player can use family locks on the target character
 * @param {Character} target - The target to (potentially) lock
 * @returns {boolean} - TRUE if the player can use family locks on the target, FALSE otherwise
 */
function DialogCanUseFamilyLockOn(target) {
	return target.IsPlayer()
		? (target.IsOwned() && !LogQuery("BlockOwnerLockSelf", "OwnerRule"))
		: target.IsOwner() // Owner is in family, but you can't use family locks on them
			? false
			: target.IsFamilyOfPlayer();
}

/**
 * Build the inventory listing for the dialog which is what's equipped,
 * the player's inventory and the character's inventory for that group
 * @param {Character} C - The character whose inventory must be built
 * @param {AssetGroup} focusGroup - The group whose inventory to build
 * @param {boolean} [resetOffset] - The offset to be at, if specified.
 * @param {boolean} [locks] - If TRUE we build a list of locks instead.
 * @param {boolean} reload - Perform a {@link DialogMenu.Reload} hard reset of the active `items`, `locking` or `permissions` mode
 * @returns {void} - Nothing
 */
function DialogInventoryBuild(C, focusGroup, resetOffset=false, locks=false, reload=true) {

	if (resetOffset)
		DialogInventoryOffset = 0;

	DialogInventory = [];

	// Make sure there's a focused group
	if (focusGroup == null) return;

	if (locks) {
		Asset.filter(a => a.IsLock && InventoryAvailable(Player, a.Name, a.Group.Name)).forEach(a => DialogInventoryAdd(C, AppearanceItem.fromAsset(a), false));
		DialogInventoryOffset = Math.max(0, Math.min(DialogInventory.length, DialogInventoryOffset));
		DialogInventorySort();
		return;
	}

	const CurItem = C.Appearance.find(A => A.Asset.Group.Name === focusGroup.Name && A.Asset.DynamicAllowInventoryAdd(C));

	// In item permission mode we add all the enable items except the ones already on, unless on Extreme difficulty
	if (DialogMenuMode === "permissions") {
		for (const A of focusGroup.Asset) {
			if (!A.Enable)
				continue;

			if (A.Wear) {
				const isWorn = CurItem?.Asset.Name === A.Name && CurItem?.Asset.Group.Name === A.Group.Name;
				DialogInventoryAdd(Player, AppearanceItem.fromAsset(A), isWorn, DialogSortOrder.Enabled);
			} else if (A.IsLock) {
				const LockIsWorn = InventoryCharacterIsWearingLock(C, /** @type {AssetLockType} */ (A.Name));
				DialogInventoryAdd(Player, AppearanceItem.fromAsset(A), LockIsWorn, DialogSortOrder.Enabled);
			}
		}
	} else {
		// First, we add anything that's currently equipped
		if (CurItem) {
			const properties = CommonCloneDeep(CurItem.Property);
			/** @type {undefined | CraftingItem} */
			const craft = !CurItem.Craft ? undefined : {
				...CurItem.Craft,
				Partial: false,
				Color: CurItem.Color.join(","),
				Lock: CurItem.Property.LockedBy ?? "",
				Item: CurItem.Asset.CraftGroup || CurItem.Asset.Name,
				ItemProperty: properties,
				TypeRecord: properties.TypeRecord ?? null,
			};
			DialogInventoryAdd(C, CurItem, true, DialogSortOrder.Enabled, craft);
		}

		// Second, we add everything from the victim inventory
		for (const I of C.Inventory)
			if (I.Asset.Group.Name === focusGroup.Name && I.Asset.DynamicAllowInventoryAdd(C))
				DialogInventoryAdd(C, I, false);

		// Third, we add everything from the player inventory if the player isn't the victim
		if (!C.IsPlayer())
			for (const I of Player.Inventory)
				if (I.Asset.Group.Name === focusGroup.Name && I.Asset.DynamicAllowInventoryAdd(C))
					DialogInventoryAdd(C, I, false);

		// Fourth, we add all free items (especially useful for clothes), or location-specific always available items
		for (const A of Asset)
			if (A.Group.Name === focusGroup.Name && A.DynamicAllowInventoryAdd(C))
				if (InventoryAvailable(C, A.Name, A.Group.Name))
					DialogInventoryAdd(C, AppearanceItem.fromAsset(A), false);

		// Fifth, we add all crafted items for the player that matches that slot
		for (const Craft of (Player.Crafting ?? [])) {
			if (Craft == null || Craft.Disabled) {
				continue;
			}

			for (const Asset of (CraftingAssets[Craft.Item] ?? [])) {
				if (Asset.Group.Name === focusGroup.Name && DialogCanUseCraftedItem(C, Craft, Asset)) {
					DialogInventoryAdd(C, AppearanceItem.fromAsset(Asset), false, undefined, Craft);
				}
			}
		}

		// Sixth. we add all crafted items from the character that matches that slot
		if (C.IsOnline()) {
			for (const Craft of C.Crafting) {
				if (Craft == null || Craft.Private) {
					continue;
				}

				Craft.MemberName = CharacterNickname(C);
				Craft.MemberNumber = C.MemberNumber;
				for (const Asset of (CraftingAssets[Craft.Item] ?? [])) {
					if (Asset.Group.Name === focusGroup.Name && DialogCanUseCraftedItem(C, Craft, Asset)) {
						DialogInventoryAdd(C, AppearanceItem.fromAsset(Asset), false, undefined, Craft);
					}
				}
			}
		}

		// Seventh, if the player is using the online map room and is located on an object tile, she can use that object
		if (ServerPlayerIsInChatRoom() && ChatRoomMapViewIsActive() && Player.MapData) {
			let Obj = MapManager.Map.getObject(Player.MapData.Pos.X, Player.MapData.Pos.Y);
			if ((Obj != null) && (Obj.AssetName != null) && (Obj.AssetGroup != null))
				for (const A of Asset)
					if ((A.Name === Obj.AssetName) && (A.Group.Name === Obj.AssetGroup) && (A.Group.Name === focusGroup.Name))
						DialogInventoryAdd(C, AppearanceItem.fromAsset(A), false);
		}

	}

	DialogInventoryOffset = Math.max(0, Math.min(DialogInventory.length, DialogInventoryOffset));
	DialogInventorySort();

	if (reload) {
		switch (DialogMenuMode) {
			case "items":
			case "locking":
			case "permissions":
				CommonPromiseCatch(DialogMenuMapping[DialogMenuMode]?.Reload(null, { reset: true, resetDialogItems: false }));
				break;
		}
	}
}

/**
 * Create a stringified list of the group and the assets currently in the dialog inventory
 * @param {Character} C - The character the dialog inventory has been built for
 * @returns {string} - The list of assets as a string
 * @deprecated
 */
function DialogInventoryStringified(C) {
	return (C.FocusGroup ? C.FocusGroup.Name : "") + (DialogInventory ? JSON.stringify(DialogInventory.map(I => I.Asset.Name).sort()) : "");
}

/**
 * Loads expressions from a slot
 * @param {number} Slot - Index of saved expression (0 to 4)
 */
function DialogFacialExpressionsLoad(Slot) {
	const expressions = Player.SavedExpressions[Slot];
	if (!expressions) return;
	expressions.forEach(e => {
		CharacterSetFacialExpression(Player, e.Group, e.CurrentExpression ?? null);
		Player.ActiveExpression.setWithoutReload(e.Group, e.CurrentExpression ?? null);
	});
	if (DialogSelfMenuSelected === "Expression" && DialogSelfMenuMapping.Expression.C?.IsPlayer()) {
		CommonPromiseCatch(DialogSelfMenuMapping.Expression.Reload());
	}
}

/**
 * Builds the savedexpressions menu previews.
 * @returns {(null | Character)[]} - the created preview characters
 */
function DialogBuildSavedExpressionsMenu() {
	const ExcludedGroups = ["Mask"];
	const AppearanceItems = Player.Appearance.filter(A => A.Asset.Group.Category === "Appearance" && !ExcludedGroups.includes(A.Asset.Group.Name));
	const BaseAppearance = AppearanceItems.filter(A => !A.Asset.Group.AllowExpression);
	const ExpressionGroups = AppearanceItems.filter(A => A.Asset.Group.AllowExpression);
	return Player.SavedExpressions.map((expression, i) => {
		if (expression) {
			const PreviewCharacter = CharacterLoadSimple("SavedExpressionPreview-" + i);
			PreviewCharacter.Appearance = [
				...BaseAppearance,
				...ExpressionGroups.map(item => {
					return { Asset: item.Asset, ...CommonCloneDeep(CommonOmit(item, ["Asset"])) };
				}),
			];

			for (let x = 0; x < expression.length; x++) {
				CharacterSetFacialExpression(PreviewCharacter, expression[x].Group, expression[x].CurrentExpression ?? null);
			}
			CharacterRefresh(PreviewCharacter, false, false);

			return PreviewCharacter;
		} else {
			return null;
		}
	});
}

/**
 * Whether we can enter search mode
 * @returns {boolean}
 */
function DialogAllowSearchMode() {
	return CurrentCharacter != null &&
		(
			Player.FocusGroup != null ||
			(
				CurrentCharacter != null &&
				CurrentCharacter.FocusGroup != null &&
				CurrentCharacter.AllowItem
			)
		) &&
		DialogIntro(CurrentCharacter) !== "" &&
		(DialogMenuMode === "items" || DialogMenuMode === "permissions");
}

/**
 * Exit from the search mode
 * @param {Character} C - Character
 */
function DialogExitSearchMode(C) {
	if (DialogItemSearchBar) {
		DialogItemSearchBar.remove();
		DialogItemSearchBar = null;
		DialogItemSearchBarAutoClose = false;
		DialogMenuButtonBuild(C);

		/**
		 * The duration temporary status message show up for, in ms
		 * @type {undefined | string}
		 */
		const gridID = DialogGetMenu(DialogMenuMode)?.ids.grid;
		if (gridID) {
			document.querySelectorAll(`#${gridID} > .dialog-grid-button`).forEach(button => button.toggleAttribute("hidden", false));
		}

	}
}

/**
 * Enter search mode
 * @param {Character} C - The character we're searching items on
 * @param {string | undefined} input - The search string we're looking for
 */
function DialogEnterItemsSearchMode(C, input = undefined) {
	DialogItemSearchBar = ElementCreateInput("DialogItemSearch", "text", "", "40");
	DialogItemSearchBar.oninput = () => {
		if (DialogItemSearchBar) {
			if (DialogItemSearchBarAutoClose && !DialogItemSearchBar.value) {
				DialogExitSearchMode(C);
				MainCanvas.canvas.focus();
				return;
			}

			/**
			 * The duration temporary status message show up for, in ms
			 * @type {undefined | string}
			 */
			const gridID = DialogGetMenu(DialogMenuMode)?.ids.grid;
			if (gridID) {
				const query = DialogItemSearchBar.value.toLocaleLowerCase().split(" ").map(i => i.trim());
				document.querySelectorAll(`#${gridID} > .dialog-grid-button`).forEach(button => {
					const name = button.getAttribute("name")?.toLocaleLowerCase() ?? "";
					const description = button.querySelector(".button-label")?.textContent?.toLocaleLowerCase() ?? "";
					const queryMatch = query.some(i => name.includes(i) || description.includes(i));
					button.toggleAttribute("hidden", !queryMatch);
				});
			}
		}
	};
	DialogItemSearchBar.focus();
	DialogItemSearchBar.setAttribute("value", input ?? "");
	const insPoint = input?.length ?? 0;
	DialogItemSearchBar.setSelectionRange(insPoint, insPoint);
	ElementPositionFix("DialogItemSearch", 40, 1005, 25, 625, 60);
	DialogMenuButtonBuild(C);
}

/**
 * Handles the Click events in the Dialog Screen
 * @returns {boolean} - Whether a button was clicked
 */
function DialogMenuButtonClick() {

	// Hack because those panes handle their menu icons themselves
	if (DialogMenuMode && ["colorExpression", "colorItem", "extended", "layering", "tighten"].includes(DialogMenuMode)) return false;

	// Gets the current character and item
	/** The focused character */
	const C = /** @type {Character} */ (CharacterGetCurrent());
	/** The focused item */
	const Item = C.FocusGroup ? InventoryGet(C, C.FocusGroup.Name) : null;

	// Finds the current icon
	for (let I = 0; I < DialogMenuButton.length; I++) {
		if (MouseIn(1885 - I * 110, 15, 90, 90)) {

			const button = DialogMenuButton[I];
			// Exit Icon - Go back one level in the menu
			if (button === "Exit") {
				DialogMenuBack();
				return true;
			}

			// Search Icon - Pops the searchbar for the focused group of items
			if (button === "FilterItems") {
				DialogEnterItemsSearchMode(C);
				return true;
			}

			// Exit Icon - hides the searchbar for the focused group of items
			if (button === "FilterItemsExit") {
				DialogExitSearchMode(C);
				return true;
			}

			// Use Icon - Pops the item extension for the focused item
			else if (button === "Use" && Item) {
				DialogExtendItem(Item);
				return true;
			}

			// Remote Icon - Pops the item extension
			else if (button === "Remote") {
				if (Item && DialogCanUseRemoteState(C, Item) === "Available") {
					DialogExtendItem(Item);
					return true;
				}
			}

			// Lock Icon - Rebuilds the inventory list with locking items
			else if (button === "Lock") {
				if (Item && InventoryDoesItemAllowLock(Item)) {
					DialogChangeMode("locking");
				}
				return true;
			}

			// Unlock Icon - If the item is padlocked, we immediately unlock.  If not, we start the struggle progress.
			else if (button === "Unlock" && Item) {
				// Check that this is not one of the sticky-locked items
				const isNotStickyLock = InventoryItemHasEffect(Item, "Lock", true) && !InventoryItemHasEffect(Item, "Lock", false);
				if (C.FocusGroup?.IsItem() && isNotStickyLock && (!C.IsPlayer() || C.CanInteract())) {
					InventoryUnlock(C, C.FocusGroup.Name, false);
					if (ChatRoomPublishAction(C, "ActionUnlock", Item, null)) {
						DialogLeave();
					} else {
						DialogChangeMode("items");
					}
				} else
					DialogStruggleStart(C, "ActionUnlock", Item, null);
				return true;
			}

			// Tighten/Loosen Icon - Opens the sub menu
			else if (button === "TightenLoosen" && Item) {
				DialogSetTightenLoosenItem(Item);
				return true;
			}

			// Remove/Struggle Icon - Starts the struggling mini-game (can be impossible to complete)
			else if (
				(button === "Remove" || button === "Struggle" || button === "Dismount" || button === "Escape")
				&& Item) {
				/** @type {DialogStruggleActionType} */
				let action = "ActionRemove";
				if (InventoryItemHasEffect(Item, "Lock")) {
					action = "ActionUnlockAndRemove";
				} else if (C.IsPlayer()) {
					action = `Action${button}`;
				}
				DialogStruggleStart(C, action, Item, null);
				return true;
			}

			// PickLock Icon - Starts the lockpicking mini-game
			else if (button === "PickLock" && Item) {
				StruggleMinigameStart(C, "LockPick", Item, null, DialogStruggleStop);
				DialogChangeMode("struggle");
				DialogMenuButtonBuild(C);
				return true;
			}

			// When the player inspects a lock
			else if (button === "InspectLock" && Item) {
				const Lock = InventoryGetLock(Item);
				if (Lock != null) DialogExtendItem(Lock, Item);
				return true;
			}

			// Color picker Icon - Select a default color to batch-apply on items
			else if (button === "ColorDefault") {
				DialogChangeMode("colorDefault");
				return true;
			}

			// Starts picking colors for the item, keeps the original color and shows it at the bottom
			else if (button === "ColorChange" && Item != null) {
				ItemColorLoad(C, Item, 1090, 15, 885, 970).then(() => {
					DialogChangeMode("colorItem");
					ItemColorOnExit(({ colors, initialColors, opacity, initialOpacity }, save) => {
						DialogChangeMode("items");
						if (save && (!CommonArraysEqual(colors, initialColors) || !CommonArraysEqual(opacity, initialOpacity))) {
							if (C.IsPlayer()) ServerPlayerAppearanceSync();
							ChatRoomPublishAction(C, "ActionChangeColor", { ...Item, Color: colors }, Item);
						}
					});
				}).catch(err => {
					console.error(`Failed to load "${CurrentModule}/${CurrentScreen}" item color subscreen:\n`, err);
					ToastManager.error(`Failed to load "${CurrentModule}/${CurrentScreen}" item color subscreen`);
				});
				return true;
			}

			// When the user selects the lock menu, we enter
			else if (Item && button === "LockMenu") {
				DialogChangeMode("locked");
				return true;
			}

			// When the user selects the lock menu, we enter
			else if (Item && button === "Crafting") {
				DialogChangeMode("crafted");
				return true;
			}

			// When the user wants to select a sexual activity to perform
			else if (button === "Activity") {
				DialogChangeMode("activities");
				return true;
			}

			// When we enter item permission mode, we rebuild the inventory to set permissions
			else if (button === "PermissionMode") {
				DialogChangeMode("permissions");
				return true;
			}

			// When we leave item permission mode, we upload the changes for everyone in the room
			else if (button === "NormalMode") {
				DialogChangeMode("items");
				return true;
			}

			else if (Item && button === "Layering") {
				DialogChangeMode("layering");
				return true;
			}
		}
	}

	return false;
}

/**
 * Publishes the item action to the local chat room or the dialog screen
 * @param {Character} C - The character who is the actor in this action
 * @param {string} Action - The action performed
 * @param {Item} ClickItem - The item that is used
 * @returns {void} - Nothing
 */
function DialogPublishAction(C, Action, ClickItem) {
	// Publishes the item result
	if (ServerPlayerIsInChatRoom() && !InventoryItemHasEffect(ClickItem)) {
		if (ChatRoomPublishAction(C, Action, null, ClickItem))
			DialogLeave();
	}
	else if (C.IsNpc()) {
		let Line = ClickItem.Asset.Group.Name + ClickItem.Asset.DynamicName(Player);
		let D = DialogFind(C, Line, null, false);
		if (D != "") {
			C.CurrentDialog = D;
			DialogLeaveItemMenu();
		}
	}

}

/**
 * Returns TRUE if the clicked item can be processed, make sure it's not the same item as the one already used
 * @param {Item} CurrentItem - The item currently equipped
 * @param {Item} ClickItem - The clicked item
 * @returns {boolean} - TRUE when we can process
 */
function DialogAllowItemClick(CurrentItem, ClickItem) {
	if (CurrentItem == null) return true;
	if (CurrentItem.Asset.Name != ClickItem.Asset.Name) return true;
	if ((CurrentItem.Craft == null) && (ClickItem.Craft != null)) return true;
	if ((CurrentItem.Craft != null) && (ClickItem.Craft == null)) return true;
	if ((CurrentItem.Craft != null) && (ClickItem.Craft != null) && (CurrentItem.Craft.Name != ClickItem.Craft.Name)) return true;
	return false;
}

/**
 * Handles `permissions`-mode clicks on an item
 * @param {DialogInventoryItem} ClickItem - The item that is clicked
 * @param {null | Item} CurrentItem
 * @returns {ItemPermissionMode} - Nothing
 */
function DialogPermissionsClick(ClickItem, CurrentItem=null) {
	const worn = ClickItem.Worn || !!CurrentItem && CurrentItem.Asset.Name == ClickItem.Asset.Name;
	return DialogInventoryTogglePermission(ClickItem, worn);
}

/**
 * Handles `locking`-mode clicks on an item
 * @param {DialogInventoryItem} ClickedLock - The item that is clicked
 * @param {Character} C
 * @param {null | Item} CurrentItem
 */
function DialogLockingClick(ClickedLock, C, CurrentItem=null) {
	InventoryLock(C, CurrentItem, ClickedLock, Player);
	IntroductionJobProgress("DomLock", ClickedLock.Asset.Name, true);
	if (ChatRoomPublishAction(C, "ActionAddLock", CurrentItem, ClickedLock)) {
		DialogLeave();
	} else {
		DialogChangeMode("items");
	}
}

/**
 * Handles `items`-mode clicks on an item
 * @param {DialogInventoryItem} ClickItem - The item that is clicked
 * @param {Character} C - The target character
 * @param {null | Item} CurrentItem - The equipped item (if any)
 */
function DialogItemClick(ClickItem, C, CurrentItem=null) {
	// exit search mode when clicked on other item
	DialogExitSearchMode(C);

	// We're dealing with a previously equipped extended item; open the extended item menu
	if (CurrentItem?.Asset.Extended && !DialogAllowItemClick(CurrentItem, ClickItem)) {
		DialogExtendItem(CurrentItem);
		return;
	}

	// Special-casing for items that cannot actually be worn
	if (!ClickItem.Asset.Wear) {
		if (InventoryItemHasEffect(ClickItem, /** @type {EffectName} */(`Unlock${CurrentItem?.Asset.Name}`))) {
			// Unlock an item if one clicks the key
			DialogStruggleStart(C, "ActionUnlock", CurrentItem, null);
		} else if (ClickItem.Asset.Name === "VibratorRemote" || ClickItem.Asset.Name === "LoversVibratorRemote") {
			// The vibrating egg remote can open the vibrating egg's extended dialog
			if (CurrentItem && DialogCanUseRemoteState(C, CurrentItem) === "Available") { DialogExtendItem(CurrentItem); }
		} else {
			// Runs the activity arousal process if activated, & publishes the item action text to the chatroom
			DialogPublishAction(C, "ActionUse", ClickItem);
			ActivityArousalItem(Player, C, ClickItem.Asset);
		}
		return;
	}

	/** @type {DialogStruggleActionType} */
	let action;
	if (CurrentItem && ClickItem) {
		action = "ActionSwap";
	} else if (ClickItem) {
		action = "ActionUse";
	} else {
		action = "ActionRemove";
	}
	DialogStruggleStart(C, action, CurrentItem, ClickItem);
}

/**
 *
 * @param {Character} C
 * @param {ItemActivity} clickedActivity
 * @param {null | Item} equippedItem
 */
function DialogActivityClick(C, clickedActivity, equippedItem) {
	if (!C.FocusGroup) return;
	if (C.IsNpc() && clickedActivity.Item) {
		let Line = C.FocusGroup.Name + clickedActivity.Item.Asset.DynamicName(Player);
		let D = DialogFind(C, Line, null, false);
		if (D != "") {
			C.CurrentDialog = D;
		}
	}
	IntroductionJobProgress("SubActivity", clickedActivity.Activity.MaxProgress.toString(), true);
	if (clickedActivity.Item?.Asset.Name === "ShockRemote") {
		if (typeof equippedItem?.Property?.TriggerCount === "number") {
			equippedItem.Property.TriggerCount++;
			ChatRoomCharacterItemUpdate(C, C.FocusGroup.Name);
		}
	}
	ActivityRun(Player, C, C.FocusGroup, clickedActivity);
	// Leave the dialog so we see the character's reaction
	if (CurrentScreen === "ChatRoom")
		DialogLeave();
}

/**
 * Toggle permission of an item in the dialog inventory list
 * @param {DialogInventoryItem} item
 * @param {boolean} worn - True if the player is changing permissions for an item they're wearing
 * @returns {ItemPermissionMode} The new item permission
 */
function DialogInventoryTogglePermission(item, worn) {
	const permission = InventoryTogglePermission(item, null, worn);

	// Refresh the inventory item
	const itemIndex = DialogInventory.findIndex(i => i.Asset.Name == item.Asset.Name && i.Asset.Group.Name == item.Asset.Group.Name);
	const sortOrder = /** @type {DialogSortOrder} */ (parseInt(item.SortOrder.replace(/[^0-9].+/gm, '') || DialogSortOrder.Usable)); // only keep the number at the start
	DialogInventory[itemIndex] = DialogInventoryCreateItem(Player, item, item.Worn, sortOrder, item.Craft);
	return permission;
}

/**
 * Changes the dialog mode and perform the initial setup.
 *
 * @param {DialogMenuMode} mode The new mode for the dialog.
 * @param {boolean} reset Whether to reset the mode back to its defaults
 */
function DialogChangeMode(mode, reset=false) {
	const C = CharacterGetCurrent();
	if (!C) return;

	// Handle changing to the expression color picker having to restore the selected mode & group
	// NOTE: compare against the *current* DialogMenuMode, not the previously stored one - otherwise
	// clicking the color button again while already in "colorExpression" overwrites
	// DialogExpressionPreviousMode.mode with "colorExpression" itself, which later causes
	// DialogMenuBack()/DialogChangeFocusToGroup() to re-enter "colorExpression" and call
	// ItemColorCancelAndExit() recursively (stack overflow on exit).
	if (mode === "colorExpression" && DialogMenuMode && DialogMenuMode !== "colorExpression" && C.FocusGroup) {
		DialogExpressionPreviousMode = { mode: DialogMenuMode, group: C.FocusGroup };
	}

	if (DialogMenuMode !== mode) {
		switch (DialogMenuMode) {
			case "colorDefault":
			case "colorExpression":
			case "colorItem":
				ColorPickerUnload();
				break;
			default:
				DialogGetMenu(DialogMenuMode)?.Unload();
				break;
		}
		DialogMenuMode = mode;
	}

	switch (DialogMenuMode) {
		case "activities":
		case "crafted":
		case "items":
		case "locked":
		case "locking":
		case "permissions": {
			if (DialogMenuMode !== "locking") {
				// FIXME: Ensure we don't leave that set, that's only for "locking" mode
				DialogFocusSourceItem = null;
			}

			if (C && C.FocusGroup) {
				DialogMenuMapping[DialogMenuMode].Init({ C, focusGroup: C.FocusGroup });
			}
			break;
		}

		case "dialog":
			if (C) {
				DialogMenuMapping[DialogMenuMode].Init({ C }, null);
			}
			break;

		case "colorDefault":
			CommonPromiseCatch(
				ColorPickerInit({
					onInput: () => null,
					onExit: ({ colors, initialColors }, save) => {
						if (save && !CommonArraysEqual(colors, initialColors)) {
							const color = colors[0];
							DialogColorSelect = CommonIsColor(color) ? color : null;
						}
						DialogChangeMode("items");
					},
					colorState: {
						opacity: [1],
						colors: [DialogColorSelect ?? "Default"],
						defaultColors: ["Default"],
						editOpacity: false,
					},
					shape: [1090, 15, 910, 970],
					heading: InterfaceTextGet("DialogMenuColorDefault"),
				})
			);
			break;
		case "colorItem":
		case "colorExpression":
			break;

		case "extended":
		case "tighten":
		case "struggle":
			DialogMenuButtonBuild(C);
			break;

		case "layering": {
			const item = InventoryGet(C, C?.FocusGroup?.Name);
			if (item) {
				const mutable = Player.CanInteract() && (!InventoryItemHasEffect(item, "Lock") || DialogCanUnlock(C, item));
				CommonPromiseCatch(
					Layering.Init(item, C, {
						x: DialogInventoryGrid.x,
						y: Layering.DisplayDefault.y - 10,
						w: (Layering.DisplayDefault.x + Layering.DisplayDefault.w) - DialogInventoryGrid.x,
						h: Layering.DisplayDefault.h + 10,
					}, reset, !mutable)
				);
			}
			break;
		}

		default:
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			console.error(`Asked to change to mode ${DialogMenuMode}, but setup missing`);
			break;
	}

	// `DialogChangeMode()` acts as the de facto `Load()` function for dialog subscreens, hence passing along `load: true`
	DialogResize(true);
}

/**
 * Change the given character's focused group.
 * @param {Character} C - The character to change the focus of.
 * @param {AssetItemGroup|string|null} Group - The group that should gain focus. `null` deselects the current group
 */
function DialogChangeFocusToGroup(C, Group) {
	/** @type {null | AssetGroup} */
	let G = null;
	if (typeof Group === "string") {
		G = AssetGroupGet(C.AssetFamily, /** @type {AssetGroupName} */ (Group));
		if (!Group) return;
	} else {
		G = Group;
	}

	// Deselect any extended screen and color picking in progress
	// It's done without calling DialogLeaveFocusItem() so it
	// acts as cancelling out of a in-progress edit.
	DialogLeaveFocusItem(false);
	DialogExitSearchMode(C);
	if (DialogMenuMode === "colorExpression" || DialogMenuMode === "colorItem")
		ItemColorCancelAndExit();
	else if (DialogMenuMode === "colorDefault") {
		ColorPickerHide();
	} else if (DialogMenuMode === "layering" && !InventoryGet(C, G?.Name)) {
		DialogMenuBack();
	}

	// Stop sounds & expressions from struggling/swapping items
	AudioDialogStop();

	// Stop any struggling minigame
	if (StruggleMinigameIsRunning()) {
		StruggleMinigameStop();
	}

	// If we're in the two-character dialog, clear their focused group
	if (CurrentCharacter && !CurrentCharacter?.IsPlayer()) {
		Player.FocusGroup = null;
		CurrentCharacter.FocusGroup = null;
	}

	// Now set the selected group and refresh
	const previousGroup = C.FocusGroup;
	C.FocusGroup = /** @type {AssetItemGroup} */ (G);
	if (C.FocusGroup) {
		// If we're changing permissions on ourself, don't change to the item list
		// Same for activities/layering, keep us in that mode if the focus moves around
		if ((DialogMenuMode === "permissions" && C.IsPlayer()) || DialogMenuMode === "activities" || DialogMenuMode === "layering") {
			// Set the mode back to itself to trigger a refresh of the state variables.
			DialogChangeMode(DialogMenuMode, !previousGroup || C.FocusGroup.Name !== previousGroup.Name);
		} else {
			DialogChangeMode("items", true);
		}
	} else {
		// We don't have a focused group anymore. Switch to dialog mode.
		DialogChangeMode("dialog");
	}
}

/**
 * Handles the click in the dialog screen
 * @type {MouseEventListener}
 */
function DialogClick(event) {
	// Check that there's actually a character selected
	if (!CurrentCharacter) return;

	// Gets the current character
	let C = CharacterGetCurrent();
	if (!C) return;

	// Check if the user clicked on one of the top menu icons
	if (DialogMenuButtonClick()) return;

	// User clicked on the interacted character or herself, check if we need to update the menu
	if (MouseIn(0, 0, 1000, 1000) && (CurrentCharacter.AllowItem || (MouseX < 500)) && (!CurrentCharacter.IsPlayer() || (MouseX > 500)) && DialogIntro(Player) && DialogAllowItemScreenException()) {
		const clickedChar = (MouseX < 500) ? Player : CurrentCharacter;
		let X = MouseX < 500 ? 0 : 500;
		for (const Group of AssetGroup) {
			if (!Group.IsItem()) continue;
			const Zone = Group.Zone.find(Z => DialogClickedInZone(clickedChar, Z, 1, X, 0, clickedChar.HeightRatio));
			if (Zone) {
				DialogChangeFocusToGroup(clickedChar, Group);
				C = clickedChar;
				break;
			}
		}
	}

	// Block out clicking on anything else if we're not supposed to interact with the selected character
	if (C.FocusGroup === null || !C.AllowItem) return;

	/** The item currently sitting in the focused group */
	const FocusItem = InventoryGet(C, C.FocusGroup.Name);

	// If the user clicked the Up button, move the character up to the top of the screen
	if ((CurrentCharacter.HeightModifier < -90 || CurrentCharacter.HeightModifier > 30) && (CurrentCharacter.FocusGroup != null) && MouseIn(510, 50, 90, 90)) {
		const memberNumber = CurrentCharacter.MemberNumber;
		if (memberNumber != null) {
			CharacterAppearanceForceUpCharacter = CharacterAppearanceForceUpCharacter == memberNumber ? -1 : memberNumber;
		}
		return;
	}

	// If the user clicked anywhere outside the current character item zones, ensure the position is corrected
	if (CharacterAppearanceForceUpCharacter == CurrentCharacter.MemberNumber && ((MouseX < 500) || (MouseX > 1000) || (CurrentCharacter.FocusGroup == null))) {
		CharacterAppearanceForceUpCharacter = -1;
		CharacterRefresh(CurrentCharacter, false, false);
	}

	// If the user wants to speed up the add / swap / remove progress
	if (MouseIn(1000, 200, 1000, 800) && DialogMenuMode === "struggle") {
		if (StruggleMinigameIsRunning()) {
			StruggleMinigameClick();
		} else {
			for (const [idx, [game, data]] of StruggleGetMinigames().entries()) {
				if (MouseIn(1387 + 300 * (idx - 1), 550, 225, 275) && data.DisablingCraftedProperty && !((DialogStrugglePrevItem?.Craft?.Effects[data.DisablingCraftedProperty] ?? 0) > 0)) {
					StruggleMinigameStart(Player, game, DialogStrugglePrevItem, DialogStruggleNextItem, DialogStruggleStop);
					DialogMenuButtonBuild(C);
				}
			}
			if ((CurrentScreen === "ChatRoom") && DialogStrugglePrevItem && MouseIn(1300, 880, 400, 65)) StruggleChatRoomStart(DialogStrugglePrevItem);
		}
		return;
	}

	if (DialogMenuMode === "extended") {
		if (DialogFocusItem != null)
			CommonDynamicFunction("Inventory" + DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Click()");
		return;
	} else if (DialogMenuMode === "tighten") {
		if (DialogTightenLoosenItem != null)
			TightenLoosenItemClick(CurrentCharacter, DialogTightenLoosenItem);
		return;
	} else if (DialogMenuMode === "colorItem" || DialogMenuMode === "colorExpression") {
		if (MouseIn(1090, 15, 885, 970) && FocusItem) {
			ItemColorClick(C, C.FocusGroup.Name, 1090, 15, 885, 970);
			return;
		}
	}

	DialogGetMenu(DialogMenuMode)?.Click(event);
}

/** @type {ScreenResizeHandler} */
function DialogResize(load) {
	switch (DialogMenuMode) {
		case "layering":
			Layering.Resize(load);
			break;
		case "colorDefault":
			ColorPickerResize(load);
			break;
		default:
			DialogGetMenu(DialogMenuMode)?.Resize(load);
			break;
	}

	DialogGetSelfMenu(DialogSelfMenuSelected)?.Resize(load);
}

/**
 * Returns whether the clicked co-ordinates are inside the asset zone
 * @param {Character} C - The character the click is on
 * @param {RectTuple} Zone - The 4 part array of the rectangular asset zone on the character's body: [X, Y, Width, Height]
 * @param {number} Zoom - The amount the character has been zoomed
 * @param {number} X - The X co-ordinate of the click
 * @param {number} Y - The Y co-ordinate of the click
 * @param {number} HeightRatio - The displayed height ratio of the character
 * @returns {boolean} - If TRUE the click is inside the zone
 */
function DialogClickedInZone(C, Zone, Zoom, X, Y, HeightRatio) {
	let CZ = DialogGetCharacterZone(C, Zone, X, Y, Zoom, HeightRatio);
	return MouseIn(CZ[0], CZ[1], CZ[2], CZ[3]);
}

/**
 * Return the co-ordinates and dimensions of the asset group zone as it appears on screen
 * @param {Character} C - The character the zone is calculated for
 * @param {readonly [number, number, number, number]} Zone - The 4 part array of the rectangular asset zone: [X, Y, Width, Height]
 * @param {number} X - The starting X co-ordinate of the character's position
 * @param {number} Y - The starting Y co-ordinate of the character's position
 * @param {number} Zoom - The amount the character has been zoomed
 * @param {number} HeightRatio - The displayed height ratio of the character
 * @returns {[number, number, number, number]} - The 4 part array of the displayed rectangular asset zone: [X, Y, Width, Height]
 */
function DialogGetCharacterZone(C, Zone, X, Y, Zoom, HeightRatio) {
	X += CharacterAppearanceXOffset(C, HeightRatio) * Zoom;
	Y += CharacterAppearanceYOffset(C, HeightRatio) * Zoom;
	Zoom *= HeightRatio;

	let Left = X + Zone[0] * Zoom;
	let Top = CharacterAppearsInverted(C) ? 1000 - (Y + (Zone[1] + Zone[3]) * Zoom) : Y + Zone[1] * Zoom;
	let Width = Zone[2] * Zoom;
	let Height = Zone[3] * Zoom;
	return [Left, Top, Width, Height];
}

/**
 * Finds and sets the next available character sub menu.
 * @returns {void} - Nothing
 */
function DialogFindNextSubMenu() {
	const options = DialogSelfMenuOptions.filter(i => DialogSelfMenuMapping[i]?.IsAvailable(Player));
	const currentIndex = DialogSelfMenuSelected ? options.indexOf(DialogSelfMenuSelected) : -1;
	const newMenuName = currentIndex === -1 ? options[0] : options[(1 + currentIndex) % options.length];
	DialogSelfMenuMapping[newMenuName]?.Init({ C: Player });
}

/**
 * Finds and set an available character sub menu.
 * @param {DialogSelfMenuName} MenuName - The name of the sub menu, see DialogSelfMenuOptions.
 * @param {boolean} force - Whether to check availability of the menu first.
 * @returns {boolean} - True, when the sub menu is found and available and was switched to. False otherwise and nothing happened.
 */
function DialogFindSubMenu(MenuName, force=false) {
	/** @type {undefined | _DialogSelfMenu} */
	const dialogMenu = DialogSelfMenuMapping[MenuName];
	if (!dialogMenu) {
		return false;
	}

	if (force || dialogMenu.IsAvailable(Player)) {
		dialogMenu.Init({ C: Player });
		return true;
	} else {
		return false;
	}
}

/**
 * Finds and sets a facial expression group. The expression sub menu has to be already opened.
 * @param {ExpressionGroupName} ExpressionGroup - The name of the expression group, see XXX.
 * @returns {boolean} True, when the expression group was found and opened. False otherwise and nothing happens.
 */
function DialogFindFacialExpressionMenuGroup(ExpressionGroup) {
	if (DialogSelfMenuSelected !== "Expression") {
		return false;
	}

	const ids = DialogSelfMenuMapping.Expression.ids;
	const button = /** @type {null | HTMLButtonElement} */(document.querySelector(`#${ids.menuLeft} > [name="${ExpressionGroup}"]`));
	if (!button) {
		return false;
	} else if (button.getAttribute("aria-checked") === "false") {
		button.click();
	}
	return true;
}

/**
 * Displays the given text for 5 seconds
 * @param {string} status - The text to be displayed
 * @param {number} [timer] - the number of milliseconds to display the message for
 * @param {null | { asset?: Asset | null, group?: AssetGroup | null, C?: Character | null }} [replace] - Attempt to perform replacements within the `status` text
 * @param {string | null} [id]
 * @returns {void} - Nothing
 */
function DialogSetStatus(status, timer=0, replace, id) {
	id ??= DialogGetMenu(DialogMenuMode)?.ids.status;
	const elem = id ? document.getElementById(id) : null;
	if (!elem) {
		return;
	}

	replace ??= {};
	if (replace.group || replace.asset) {
		const groupName = replace.group ?? /** @type {Asset} */ (replace.asset).Group;
		status = status.replaceAll("GroupName", DialogActualNameForGroup(replace.C ?? Player, groupName).toLowerCase());
	}
	if (replace.asset) {
		status = status.replaceAll("AssetName", replace.asset.Description);
	}
	if (replace.C) {
		status = status.replaceAll("DialogCharacterObject", CharacterNickname(replace.C));
	}

	const timeoutID = elem.getAttribute("data-timeout-id");
	if (timer > 0) {
		if (timeoutID) {
			clearTimeout(Number.parseInt(timeoutID, 10));
		} else {
			elem.setAttribute("data-default", elem.textContent);
		}

		elem.textContent = status;
		elem.setAttribute("data-timeout-id", setTimeout(DialogStatusTimerHandler, timer, elem).toString());
	} else {
		// We let the timer for the non-default message expire normally
		if (timeoutID) {
			elem.setAttribute("data-default", status);
		} else {
			elem.textContent = status;
		}
	}
}

/**
 * Timer handler for managing timed dialog statuses.
 * @param {Element} elem - The relevant `span.dialog-status` element
 * @satisfies {TimerHandler}
 */
function DialogStatusTimerHandler(elem) {
	elem.textContent = elem.getAttribute("data-default") ?? "";
	elem.removeAttribute("data-default");
	elem.removeAttribute("data-timeout-id");
}

/** Clears the current status message. */
function DialogStatusClear() {
	const id = DialogGetMenu(DialogMenuMode)?.ids.status;
	if (!id) {
		return;
	}

	const elem = document.getElementById(id);
	const timeoutID = elem?.getAttribute("data-timeout-id");
	if (timeoutID) {
		clearTimeout(Number.parseInt(timeoutID, 10));
		if (elem) DialogStatusTimerHandler(elem);
	}
}

/**
 * Shows the extended item menu for a given item, if possible.
 * Therefore a dynamic function name is created and then called.
 * @param {Item} Item - The item the extended menu should be shown for
 * @param {Item} [SourceItem] - The source of the extended menu
 * @returns {void} - Nothing
 */
function DialogExtendItem(Item, SourceItem) {
	const C = CharacterGetCurrent();
	if (!C) return;
	if (AsylumGGTSControlItem(C, Item)) return;
	if (InventoryBlockedOrLimited(C, Item)) return;
	DialogChangeMode("extended");
	DialogFocusItem = Item;
	DialogFocusSourceItem = SourceItem ?? null;
	DialogFocusItemName = Item.Asset.Group.Name + Item.Asset.Name;
	const extendedItem = Item.Asset.IsLock ? SourceItem : Item;
	if (extendedItem) {
		ExtendedItemInit(C, extendedItem, false, true);
	}
	CommonDynamicFunction("Inventory" + Item.Asset.Group.Name + Item.Asset.Name + "Load()");
}

/**
 * Shows the tighten/loosen item menu for a given item, if possible.
 * @param {Item} Item - The item to open the menu for
 * @returns {void} - Nothing
 */
function DialogSetTightenLoosenItem(Item) {
	const C = CharacterGetCurrent();
	if (!C) return;
	if (AsylumGGTSControlItem(C, Item)) return;
	if (InventoryBlockedOrLimited(C, Item)) return;
	DialogChangeMode("tighten");
	DialogTightenLoosenItem = Item;
	TightenLoosenItemLoad(Item);
}

/**
 * Validates that the player is allowed to change the item color and swaps it on the fly
 * @param {Character} C - The player who wants to change the color
 * @param {BCColor} Color - The new color in the format "#rrggbb"
 * @returns {void} - Nothing
 */
function DialogChangeItemColor(C, Color) {

	// Validates that the player isn't blind and can interact with the item
	if (!Player.CanInteract() || Player.IsBlind() || !C.FocusGroup) return;

	// If the item is locked, make sure the player could unlock it before swapping colors
	var Item = InventoryGet(C, C.FocusGroup.Name);
	if (Item == null) return;
	if (InventoryItemHasEffect(Item, "Lock", true) && !DialogCanUnlock(C, Item)) return;

	// Make sure the item is allowed, the group isn't blocked and it's not an enclosing item
	if (!InventoryAllow(C, Item.Asset) || InventoryGroupIsBlocked(C, C.FocusGroup.Name)) return;
	if (InventoryItemHasEffect(Item, "Enclose", true) && (C.IsPlayer())) return;

	// Apply the color & redraw the character after 100ms.  Prevent unnecessary redraws to reduce performance impact
	Item.Color = Array(Item.Asset.ColorableLayerCount).fill(Color);
	clearTimeout(DialogFocusItemColorizationRedrawTimer);
	DialogFocusItemColorizationRedrawTimer = setTimeout(function () { CharacterAppearanceBuildCanvas(C); }, 100);

}

/**
 * Returns the button image name for a dialog menu button based on the button name.
 * @param {DialogMenuButtonType} ButtonName - The menu button name
 * @param {Item | null} FocusItem - The focused item
 * @returns {string} - The button image name
 */
function DialogGetMenuButtonImage(ButtonName, FocusItem) {
	if (ButtonName === "ColorDefault" || ButtonName === "ColorChange" || ButtonName === "ColorPickDisabled") {
		if (!FocusItem) return "ColorChange";
		return ItemColorIsSimple(FocusItem) ? "ColorChange" : "ColorChangeMulti";
	} else if (ButtonName.includes("PickLock")) {
		return "PickLock";
	} else if (DialogIsMenuButtonDisabled(ButtonName)) {
		return ButtonName.replace(DialogButtonDisabledTester, "");
	} else if (ButtonName === "FilterItems") {
		return "Search";
	} else if (ButtonName === "FilterItemsExit") {
		return "Remove";
	} else {
		return ButtonName;
	}
}

/**
 * Returns the background color of a dialog menu button based on the button name.
 * @param {DialogMenuButtonType | AppearanceMenuButtonType} ButtonName - The menu button name
 * @returns {string} - The background color that the menu button should use
 */
function DialogGetMenuButtonColor(ButtonName) {
	if (DialogIsMenuButtonDisabled(ButtonName)) {
		return "#808080";
	} else if (ButtonName === "ColorDefault") {
		return DialogColorSelect || "#fff";
	} else {
		return "#fff";
	}
}

/**
 * Determines whether or not a given dialog menu button should be disabled based on the button name.
 * @param {DialogMenuButtonType | AppearanceMenuButtonType} ButtonName - The menu button name
 * @returns {boolean} - TRUE if the menu button should be disabled, FALSE otherwise
 */
function DialogIsMenuButtonDisabled(ButtonName) {
	return DialogButtonDisabledTester.test(ButtonName);
}

/**
 * Abstract base class for a simplistic DOM subscreen with three-ish components:
 * - A menubar with a set of buttons which are generally heterogeneous in function (_e.g._ perform arbitrary, unrelated task #1, #2 or #3)
 * - A status message of some sort
 * - A grid with some type of misc element, generally a set of buttons homogeneous in function (e.g. equip item #1, #2 or #3). See below for more details.
 *
 * Grid button clicks
 * ------------------
 * Grid button clicks in the {@link ids|ids.grid}-referenced element generally involve the following four steps:
 * 1) The click listener (see {@link eventListeners|eventListeners._ClickButton}) performs some basic generic validation, like checking whether the character has been initialized.
 *    A validation failure is considered an internal error, and will lead to a premature termination of the click event.
 * 2) The click listener retrieves some type of underlying object associated with the grid button, like an item or activity (see {@link _GetClickedObject}).
 * 3) The click listener performs more extensive, subscreen-/class-specific validation (see {@link GetClickStatus}), like checking whether an item has not been blacklisted.
 *    A validation failure here will trigger a soft reload, updating the status message and re-evaluating the enabled/disabled state of _all_ pre-existing grid buttons.
 * 4) The click listener finally performs a subscreen-/class-specific action based on the grid button click, like equipping an item (see {@link _ClickButton}).
 *
 * Parameters
 * ----------
 * @abstract
 * @template {string} [ModeType=string] - The name of the mode associated with this instance (_e.g._ {@link DialogMenuMode})
 * @template [ClickedObj=any] - The underlying item or activity object of the clicked grid buttons (if applicable)
 * @template {DialogMenu.InitProperties} [PropType=DialogMenu.InitProperties] - Properties as initialized by {@link Init}
 * @extends {ScreenFunctions}
 */
class DialogMenu {
	/**
	 * An object containing all DOM element IDs referenced in the {@link DialogMenu} subclass.
	 * @abstract
	 * @readonly
	 * @type {Readonly<Record<string, string> & { root: string, status?: string, grid?: string, paginate?: string, icon?: string, menubar?: string }>}
	 */
	ids = /** @type {never} */ (undefined);

	/**
	 * A list of all init property names as supported by this class.
	 * Represents the set of keys that will be stored in {@link _initProperties}
	 * @readonly
	 * @abstract
	 * @type {readonly (keyof PropType)[]}
	 */
	_initPropertyNames = /** @type {never} */ (undefined);

	/**
	 * An object for storing all of this classes init properties.
	 *
	 * Subclasses _should_ generally implement a public getter/setter interface for safely manipulating each property stored herein.
	 * @type {null | PropType}
	 */
	_initProperties = null;

	/**
	 * An object containing all event listeners referenced in the {@link DialogMenu} subclass.
	 * @readonly
	 * @satisfies {Record<string, (this: HTMLElement, ev: Event) => any>}
	 */
	eventListeners;

	/**
	 * The name of the mode associated with this instance (see {@link DialogMenuMode}).
	 * @readonly
	 * @type {ModeType}
	 */
	mode;

	/**
	 * An object mapping IDs to {@link DialogMenu.GetClickStatus} helper functions.
	 * Used for evaluating the error statuses of item clicks.
	 *
	 * Additional checks can be freely added here.
	 * @abstract
	 * @readonly
	 * @type {Record<string, DialogMenu<string, ClickedObj>["GetClickStatus"]>}
	 */
	clickStatusCallbacks = /** @type {never} */ (undefined);

	/**
	 * See {@link DialogMenu.shape}
	 * @private
	 * @type {null | RectTuple}
	 */
	_shape = null;

	/**
	 * Get or set the position & shape of the current subscreen as defined by the root element.
	 *
	 * Performs a {@link DialogMenu.Resize} if a new shape is assigned.
	 */
	get shape() {
		return this._shape;
	}
	set shape(value) {
		if (value == null) {
			this._shape = null;
		} else if (!this._shape || !CommonArraysEqual(this._shape, value)) {
			this._shape = value;
			this.Resize(false);
		}
	}

	/**
	 * The default position & shape of the current subscreen as defined by the root element.
	 *
	 * See {@link DialogMenu.shape}.
	 * @readonly
	 * @type {Readonly<RectTuple>}
	 */
	defaultShape = Object.freeze([1005, 107, 995, 857]);

	/**
	 * Get or set the currently selected character.
	 *
	 * Performs a hard {@link DialogMenu.Reload} if a new character is assigned.
	 * @type {null | PropType["C"]}
	 */
	get C() {
		return this._initProperties?.C ?? null;
	}
	set C(value) {
		if (this._initProperties == null) {
			return;
		}

		const elem = document.getElementById(this.ids.root);
		if (value == null) {
			this._initProperties.C = /** @type {never} */ (null);
			elem?.removeAttribute("data-character-id");
		} else if (this.C?.ID !== value.ID) {
			this._initProperties.C = value;
			elem?.setAttribute("data-character-id", value.ID);
			CommonPromiseCatch(this.Reload(null, { reset: true }));
		}
	}

	/**
	 * Get or set the currently selected group.
	 *
	 * Performs a hard {@link DialogMenu.Reload} if a new focus group is assigned.
	 * @type {null | AssetGroup}
	 */
	get focusGroup() { return null; }

	/**
	 * A set with the numeric IDs of to-be run reloads.
	 * See {@link DialogMenu.Reload}
	 * @private
	 * @readonly
	 * @type {Set<number>}
	 */
	_reloadQueue;

	/**
	 * The highest reload ID currently in use.
	 * See {@link DialogMenu.Reload}
	 * @private
	 * @type {number}
	 */
	_reloadHighestID = -1;

	/**
	 * Promise object for queuing reloads, ensuring that they are run consecutively rather than concurrently if multiple calls are invoked (near) simultaneously.
	 * See {@link DialogMenu.Reload}
	 * @private
	 * @type {Promise<boolean>}
	 */
	_reloadPromise;

	/**
	 * @param {ModeType} mode The name of the mode associated with this instance
	 */
	constructor(mode) {
		this.mode = mode;
		this._reloadQueue = new Set;
		this._reloadPromise = Promise.resolve(true);

		const dialogMenu = this;
		this.eventListeners = {
			/**
			 * @type {(this: HTMLButtonElement, ev: PointerEvent) => null | string}
			 * @returns {string | null} A status message if an _unexpected_ error is encountered and null otherwise
			 */
			_ClickButton: function(event) {
				const clickedObj = dialogMenu._GetClickedObject(this);
				if (clickedObj === null || !dialogMenu.C) {
					event.stopImmediatePropagation();
					return "Internal error";
				}

				const equippedItem = dialogMenu.focusGroup ? InventoryGet(dialogMenu.C, dialogMenu.focusGroup.Name) : null;
				const status = dialogMenu.GetClickStatus(dialogMenu.C, clickedObj, equippedItem);
				if (status) {
					event.stopImmediatePropagation();
					CommonPromiseCatch(dialogMenu.Reload(null, { status, statusTimer: DialogTextDefaultDuration }));
					return status;
				} else {
					dialogMenu._ClickButton(this, dialogMenu.C, clickedObj, equippedItem);
					return null;
				}
			},

			/**
			 * @type {(this: HTMLButtonElement, ev: PointerEvent) => null | string}
			 * @returns {string | null} A status message if an _expected_ error is encountered and null otherwise
			 */
			_ClickDisabledButton: function(event) {
				const clickedObj = dialogMenu._GetClickedObject(this);
				if (!clickedObj || !dialogMenu.C) {
					event.stopImmediatePropagation();
					return null;
				}

				const equippedItem = dialogMenu.focusGroup ? InventoryGet(dialogMenu.C, dialogMenu.focusGroup.Name) : null;
				const status = dialogMenu.GetClickStatus(dialogMenu.C, clickedObj, equippedItem);
				if (status) {
					DialogSetStatus(status, DialogTextDefaultDuration, { C: dialogMenu.C }, dialogMenu.ids.status);
					return status;
				} else {
					// Force a reload (and a new click event) if the click somehow _did not_ fail
					CommonPromiseCatch(
						dialogMenu.Reload()
							.then((reloadStatus) => {
								if (reloadStatus && this.getAttribute("aria-disabled") !== "true") {
									this.dispatchEvent(new PointerEvent("click", event));
								}
							})
					);
					event.stopImmediatePropagation();
					return null;
				}
			},

			/**
			 * See {@link DialogMenu.KeyDown}
			 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
			 */
			_ClickPaginatePrev: function(event) {
				document.dispatchEvent(new KeyboardEvent("keydown", { key: "PageUp" }));
			},

			/**
			 * See {@link DialogMenu.KeyDown}
			 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
			 */
			_ClickPaginateNext: function(event) {
				document.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown" }));
			},

			/**
			 * Provide more consistent mouse wheel scroll behavior by using browser-independent increments.
			 * @type {(this: HTMLDivElement, event: WheelEvent) => void}
			 */
			_WheelGrid: function(event) {
				event.preventDefault();
				if (event.deltaY === 0) {
					event.stopImmediatePropagation();
					return;
				}

				const increment = this.querySelector(".dialog-button")?.clientHeight ?? this.clientHeight / 3;
				this.scrollBy({
					top: Math.sign(event.deltaY) * increment,
					behavior: "instant",
				});
			},
		};
	}

	/**
	 * Initialize the {@link DialogMenu} subscreen.
	 *
	 * Serves as a {@link ScreenLoadHandler} wrapper with added parameters.
	 * @param {PropType} properties The to be initialized character and any other properties
	 * @param {null | { shape?: RectTuple }} style Misc styling for the subscreen
	 * @returns {null | HTMLDivElement} The div containing the dialog subscreen root element or `null` if the screen failed to initialize
	 */
	Init(properties, style=null) {
		style ??= {};
		this._initProperties = CommonPick(properties, this._initPropertyNames);
		this._shape = style.shape ?? [...this.defaultShape];
		CommonPromiseCatch(this.Load());
		return /** @type {null | HTMLDivElement} */(document.getElementById(this.ids.root));
	}

	/** @type {ScreenLoadHandler} */
	async Load() {
		if (this._initPropertyNames.some(p => this._initProperties?.[p] == null)) {
			console.error(
				`Aborting, one or more uninitialized properties in ${this.mode} subscreen`,
				CommonPick(/** @type {Partial<PropType>} */(this._initProperties ?? {}), this._initPropertyNames),
			);
			this.Exit();
			return;
		}

		const character = this.C;
		if (!character) {
			this.Exit();
			return;
		}

		const root = this._Load();
		root.setAttribute("id", this.ids.root);
		root.setAttribute("screen-generated", CurrentScreen);
		root.setAttribute("data-character-id", character.ID);
		root.setAttribute("data-mode", this.mode);
		root.classList.add("HideOnPopup", "dialog-root");
		if (!root.parentElement) { document.body.append(root); }
		root.toggleAttribute("hidden", false);
		DialogMenuButtonBuild(character);

		// Perform the element resizing here asynchronically in order to circumvent a race condition with the scroll bar realignment
		const shape = this.shape;
		const buttonGrid = this.ids.grid ? document.getElementById(this.ids.grid) : null;
		CommonPromiseCatch(
			this.Reload(null, { reset: true, resetScrollbar: false })
				.then((status) => {
					if (status && shape) {
						ElementPositionFixed(root, ...shape);
						const checkedButton = buttonGrid?.querySelector(`[aria-checked='true']`);
						if (checkedButton) {
							checkedButton.scrollIntoView({ behavior: "instant" });
						} else {
							buttonGrid?.scrollTo({ top: 0, behavior: "instant" });
						}
					} else {
						this.Exit();
					}
				})
		);
	}

	/**
	 * Construct and return the (unpopulated) {@link DialogMenu.ids.root} element.
	 * @abstract
	 * @returns {HTMLElement}
	 */
	_Load() {
		throw new Error("Trying to call an abstract method");
	}

	/** @type {ScreenUnloadHandler} */
	Unload() {
		DialogStatusClear();
		document.getElementById(this.ids.root)?.toggleAttribute("hidden", true);
		this._reloadQueue.clear();
	}

	/** @type {MouseEventListener} */
	Click(event) {}

	/** @type {ScreenDrawHandler} */
	Draw() {}

	/** @type {ScreenRunHandler} */
	Run(time) {}

	/** @type {ScreenResizeHandler} */
	Resize(load) {
		const shape = this.shape;
		if (!shape) {
			return;
		}

		if (!load) {
			// Tasks already handled asynchronically by `Load`
			ElementPositionFixed(this.ids.root, ...shape);
		}
	}

	/** @type {ScreenExitHandler} */
	Exit() {
		ElementRemove(this.ids.root);
		this._initProperties = null;
		this._shape = null;
		this._reloadQueue.clear();
	}

	/** @type {KeyboardEventListener} */
	KeyDown(event) {
		const grid = this.ids.grid ? document.getElementById(this.ids.grid) : null;
		if (grid) {
			return CommonKey.NavigationKeyDown(
				grid, event,
				(el) => el.querySelector(".dialog-button")?.clientHeight ?? el.clientHeight / 3,
			);
		} else {
			return false;
		}
	}

	/**
	 * Reload the subscreen, updating the DOM elements and, if required, re-assigning the character and focus group.
	 * @param {null | Partial<PropType>} properties
	 * @param {null | DialogMenu.ReloadOptions} [options] - Further customization options
	 * @returns {Promise<boolean>} - Whether an update was triggered or aborted
	 */
	Reload(properties=null, options=null) {
		const id = this._reloadHighestID++;
		this._reloadQueue.add(id);
		this._reloadPromise = this._reloadPromise.then(async () => {
			if (!this._reloadQueue.has(id)) {
				return false;
			} else {
				this._reloadQueue.delete(id);
			}

			const { status, param } = this._ReloadValidate(properties ?? {});
			if (status) {
				param.root.setAttribute("aria-busy", "true");
				await param.textCache.loadedPromise;
				const finalStatus = this._Reload(param, options ?? {});
				param.root.removeAttribute("aria-busy");
				return finalStatus;
			} else {
				return false;
			}
		});
		return this._reloadPromise;
	}

	/**
	 * See {@link DialogMenu.Reload}
	 * @param {Partial<PropType>} properties
	 * @returns {{ status: false, param?: never } | { status: true, param: DialogMenu.ReloadParam<PropType> }}
	 */
	_ReloadValidate(properties) {
		const currentProp = CommonPick(/** @type {Partial<PropType>} */(this._initProperties ?? {}), this._initPropertyNames);
		const newProp = CommonPick(properties, this._initPropertyNames);
		for (const k of CommonKeys(newProp)) {
			newProp[k] ??= currentProp[k];
		}

		const root = document.getElementById(this.ids.root);
		const textCache = TextAllScreenCache.get(InterfaceStringsPath);
		if (!root || Object.values(newProp).some(i => i == null) || !textCache) {
			const err = Object.fromEntries(Object.entries(newProp).filter(([_, i]) => i == null));
			console.error(
				`Failed to reload ${this.mode} subscreen; one or more missing objects`,
				{ root: !!root, ...err, textCache: !!textCache },
			);
			return { status: false };
		} else {
			const newProperties = /** @type {PropType} */ (/** @type {unknown} */ (newProp));
			const oldProperties = /** @type {PropType} */ (/** @type {unknown} */ (currentProp));
			return { status: true, param: { root, textCache, newProperties, oldProperties } };
		}
	}

	/**
	 * See {@link DialogMenu.Reload}
	 * @param {DialogMenu.ReloadParam<PropType>} param
	 * @param {DialogMenu.ReloadOptions} options
	 * @returns {boolean}
	 */
	_Reload(param, options) {
		const { root, newProperties, oldProperties } = param;
		const initProperties = this._initProperties;
		if (!initProperties) {
			return false;
		}

		// Check if any class-level properties have to be updated
		for (const key of this._initPropertyNames) {
			if (newProperties[key] !== oldProperties[key]) {
				options.reset ??= true;
				initProperties[key] = newProperties[key];
			}
		}
		options.resetScrollbar ??= options.reset;
		options.resetDialogItems ??= options.reset;

		// Update the label, icon and grid (if applicable)
		const statusSpan = this.ids.status ? document.getElementById(this.ids.status) : null;
		if (statusSpan) {
			this._ReloadStatus(root, statusSpan, newProperties, options);
		}

		const buttonGrid = this.ids.grid ? document.getElementById(this.ids.grid) : null;
		if (buttonGrid) {
			this._ReloadButtonGrid(root, buttonGrid, newProperties, options);
		}

		const icon = this.ids.icon ? document.getElementById(this.ids.icon) : null;
		if (icon) {
			this._ReloadIcon(root, icon, newProperties, options);
		}

		const menubar = this.ids.menubar ? document.getElementById(this.ids.menubar) : null;
		if (menubar) {
			this._ReloadMenubar(root, menubar, newProperties, options);
		}
		return true;
	}

	/**
	 * A {@link DialogMenu.Reload} helper function for reloading {@link DialogMenu.ids.status} elements.
	 * @abstract
	 * @param {HTMLElement} root
	 * @param {HTMLElement} status
	 * @param {PropType} properties
	 * @param {Pick<DialogMenu.ReloadOptions, "status" | "statusTimer">} options
	 */
	_ReloadStatus(root, status, properties, options) {
		throw new Error("Trying to call an abstract method");
	}

	/**
	 * A {@link DialogMenu.Reload} helper function for reloading {@link DialogMenu.ids.grid} elements.
	 * @abstract
	 * @param {HTMLElement} root
	 * @param {HTMLElement} buttonGrid
	 * @param {PropType} properties
	 * @param {Pick<DialogMenu.ReloadOptions, "reset" | "resetScrollbar" | "resetDialogItems">} options
	 */
	_ReloadButtonGrid(root, buttonGrid, properties, options) {
		throw new Error("Trying to call an abstract method");
	}

	/**
	 * A {@link DialogMenu.Reload} helper function for reloading {@link DialogMenu.ids.icon} elements.
	 * @abstract
	 * @param {HTMLElement} root
	 * @param {HTMLElement} icon
	 * @param {PropType} properties
	 * @param {Pick<DialogMenu.ReloadOptions, never>} options
	 */
	_ReloadIcon(root, icon, properties, options) {
		throw new Error("Trying to call an abstract method");
	}

	/**
	 * A {@link DialogMenu.Reload} helper function for reloading {@link DialogMenu.ids.menubar} elements.
	 * @abstract
	 * @param {HTMLElement} root
	 * @param {HTMLElement} menubar
	 * @param {PropType} properties
	 * @param {Pick<DialogMenu.ReloadOptions, "reset">} options
	 */
	_ReloadMenubar(root, menubar, properties, options) {
		throw new Error("Trying to call an abstract method");
	}

	/**
	 * Return an error status (if any) for when an item or activity is clicked.
	 *
	 * Error statuses are used for evaluating whether the relevant grid buttons must be disabled or not.
	 * @param {Character} C - The target character
	 * @param {ClickedObj} clickedObj - The item that is clicked
	 * @param {null | Item} equippedItem - The item that is equipped (if any)
	 * @returns {null | string} - The error status or `null` if everything is ok
	 */
	GetClickStatus(C, clickedObj, equippedItem=null) {
		for (const statusCallback of Object.values(this.clickStatusCallbacks)) {
			const status = statusCallback(C, clickedObj, equippedItem);
			if (status != null) {
				return status;
			}
		}
		return null;
	}

	/**
	 * Return the underlying item or activity object of the passed grid button.
	 * @abstract
	 * @param {HTMLButtonElement} button - The clicked button
	 * @returns {ClickedObj | null} - The button's underlying item or activity object
	 */
	_GetClickedObject(button) {
		throw new Error("Trying to all an abstract method");
	}

	/**
	 * Helper function for handling the clicks of successfully validated grid button clicks.
	 * @abstract
	 * @param {HTMLButtonElement} button - The clicked button
	 * @param {Character} C - The target character
	 * @param {ClickedObj} clickedObj - The buttons underlying object (item or activity)
	 * @param {null | Item} equippedItem - The currently equipped item
	 * @returns {void}
	 */
	_ClickButton(button, C, clickedObj, equippedItem) {
		throw new Error("Trying to all an abstract method");
	}

	/**
	 * @param {string} id
	 * @returns {HTMLDivElement}
	 */
	_ConstructPaginateButtons(id) {
		return ElementMenu.Create(
			id,
			[
				ElementButton.Create(
					`${id}-prev`,
					this.eventListeners._ClickPaginatePrev,
					{ image: "./Icons/Up.png", tooltip: InterfaceTextGet("PrevPage"), tooltipPosition: "left" },
					{ button: {
						classList: ["dialog-paginate-button"],
						attributes: {
							"aria-keyshortcuts": "PageUp",
							"aria-controls": this.ids.grid,
						},
					}},
				),
				ElementButton.Create(
					`${id}-next`,
					this.eventListeners._ClickPaginateNext,
					{ image: "./Icons/Down.png", tooltip: InterfaceTextGet("NextPage"), tooltipPosition: "left" },
					{ button: {
						classList: ["dialog-paginate-button"],
						attributes: {
							"aria-keyshortcuts": "PageDown",
							"aria-controls": this.ids.grid,
						},
					}},
				),
			],
			{},
			{ "menu": {
				classList: ["dialog-paginate"],
				attributes: { "aria-orientation": "vertical" },
				parent: ElementNoParent,
			}},
		);
	}
}

/**
 * {@link DialogMenu} abstract subclass for dialog menus with a focus group.
 * @abstract
 * @template {string} [ModeType=string] - The name of the mode associated with this instance (_e.g._ {@link DialogMenuMode})
 * @template [ClickedObj=any] - The underlying item or activity object of the clicked grid buttons (if applicable)
 * @template {{ C: Character, focusGroup: AssetItemGroup }} [PropType={ C: Character, focusGroup: AssetItemGroup }]
 * @extends {DialogMenu<ModeType, ClickedObj, PropType>}
 */
class _DialogFocusMenu extends DialogMenu {
	/**
	 * Get or set the currently selected group.
	 *
	 * Performs a hard {@link DialogMenu.Reload} if a new focus group is assigned.
	 */
	get focusGroup() {
		return this._initProperties?.focusGroup ?? null;
	}
	set focusGroup(value) {
		if (this._initProperties == null) {
			return;
		}

		const elem = document.getElementById(this.ids.root);
		if (value == null) {
			this._initProperties.focusGroup = /** @type {never} */ (null);
			elem?.removeAttribute("data-group");
		} else if (this.focusGroup?.Name !== value.Name) {
			this._initProperties.focusGroup = value;
			elem?.setAttribute("data-group", value.Name);
			CommonPromiseCatch(this.Reload(null, { reset: true }));
		}
	}

	/**
	 * @param {ModeType} mode The name of the mode associated with this instance
	 */
	constructor(mode) {
		super(mode);
		const dialogMenu = this;
		this.eventListeners = {
			...this.eventListeners,

			/**
			 * @type {(this: HTMLButtonElement, ev: PointerEvent) => null | string}
			 * @returns {string | null} A status message if an _unexpected_ error is encountered and null otherwise
			 */
			_ClickButton: function(event) {
				const clickedObj = dialogMenu._GetClickedObject(this);
				if (!clickedObj || !dialogMenu.C || !dialogMenu.focusGroup) {
					event.stopImmediatePropagation();
					return "Internal error";
				}

				const equippedItem = InventoryGet(dialogMenu.C, dialogMenu.focusGroup.Name);
				const status = dialogMenu.GetClickStatus(dialogMenu.C, clickedObj, equippedItem);
				if (status) {
					event.stopImmediatePropagation();
					CommonPromiseCatch(dialogMenu.Reload(null, { status, statusTimer: DialogTextDefaultDuration }));
					return status;
				} else {
					dialogMenu._ClickButton(this, dialogMenu.C, clickedObj, equippedItem);
					return null;
				}
			},

			/**
			 * @type {(this: HTMLButtonElement, ev: PointerEvent) => null | string}
			 * @returns {string | null} A status message if an _expected_ error is encountered and null otherwise
			 */
			_ClickDisabledButton: function(event) {
				const clickedObj = dialogMenu._GetClickedObject(this);
				if (!clickedObj || !dialogMenu.C || !dialogMenu.focusGroup) {
					event.stopImmediatePropagation();
					return null;
				}

				const equippedItem = InventoryGet(dialogMenu.C, dialogMenu.focusGroup.Name);
				const status = dialogMenu.GetClickStatus(dialogMenu.C, clickedObj, equippedItem);
				if (status) {
					DialogSetStatus(status, DialogTextDefaultDuration, { asset: equippedItem?.Asset, C: dialogMenu.C, group: dialogMenu.focusGroup }, dialogMenu.ids.status);
					return status;
				} else {
					// Force a reload (and a new click event) if the click somehow _did not_ fail
					CommonPromiseCatch(
						dialogMenu.Reload()
							.then((reloadStatus) => {
								if (reloadStatus && this.getAttribute("aria-disabled") !== "true") {
									this.dispatchEvent(new PointerEvent("click", event));
								}
							})
					);
					event.stopImmediatePropagation();
					return null;
				}
			},
		};
	}

	/** @type {DialogMenu["Load"]} */
	async Load() {
		await super.Load();
		const focusGroup = this.focusGroup;
		if (focusGroup) {
			document.getElementById(this.ids.root)?.setAttribute("data-group", focusGroup.Name);
		}
		return;
	}
}

/**
 * @template {string} T
 * @extends {_DialogFocusMenu<T, DialogInventoryItem>}
 */
class _DialogItemMenu extends _DialogFocusMenu {
	ids = Object.freeze({
		root: "dialog-inventory",
		status: "dialog-inventory-status",
		grid: "dialog-inventory-grid",
		icon: "dialog-inventory-icon",
		paginate: "dialog-inventory-paginate",
	});

	_initPropertyNames = /** @type {const} */(["C", "focusGroup"]);

	/** @satisfies {DialogMenu<T, DialogInventoryItem>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {
		InventoryBlockedOrLimited: (C, clickedItem, equippedItem) => {
			return InventoryBlockedOrLimited(C, clickedItem) ? InterfaceTextGet("ExtendedItemNoItemPermission") : null;
		},
		InventoryDisallow: (C, clickedItem, equippedItem) => {
			return InventoryDisallow(C, clickedItem.Asset);
		},
		CanInteract: (C, clickedItem, equippedItem) => {
			return Player.CanInteract() ? null : InterfaceTextGet("AccessBlocked");
		},
		InventoryGroupIsAvailable: (C, clickedItem, equippedItem) => {
			return equippedItem ? InventoryGroupIsAvailable(C, /** @type {AssetGroupItemName} */(clickedItem.Asset.Group.Name), false) : null;
		},
		AsylumGGTSControlItem: (C, clickedItem, equippedItem) => {
			return equippedItem && AsylumGGTSControlItem(C, equippedItem) ? InterfaceTextGet("BlockedByGGTS") : null;
		},
		DialogAllowItemClick: (C, clickedItem, equippedItem) => {
			// Allow extended items to pass through; clicking them opens their extended item menu
			return (
				equippedItem
				&& !DialogAllowItemClick(equippedItem, clickedItem)
				&& !equippedItem.Asset.Extended
			) ? InterfaceTextGet("BlockedByEquipped") : null;
		},
		DialogCanUnlock: (C, clickedItem, equippedItem) => {
			if (!equippedItem) {
				return null;
			} else if (!DialogAllowItemClick(equippedItem, clickedItem) && equippedItem.Asset.Extended) {
				// Always allow access for equipped extended items; the extended item menu is responsible for enabling/disabling its own buttons
				return null;
			} else if (InventoryItemHasEffect(equippedItem, "Lock", true) && !DialogCanUnlock(C, equippedItem)) {
				return InterfaceTextGet("BlockedByLock");
			} else {
				return null;
			}
		},
		InventoryChatRoomAllow: (C, clickedItem, equippedItem) => {
			return InventoryChatRoomAllow(clickedItem.Asset.Category) ? null : InterfaceTextGet("BlockedByRoom");
		},
		SelfBondage: (C, clickedItem, equippedItem) => {
			if (
				clickedItem.Asset.SelfBondage <= 0
				|| SkillGetLevel(Player, "SelfBondage") >= clickedItem.Asset.SelfBondage
				|| !C.IsPlayer()
				|| DialogAlwaysAllowRestraint()
			) {
				return null;
			} else if (clickedItem.Asset.SelfBondage <= 10) {
				return InterfaceTextGet("RequireSelfBondage").replace("ReqLevel", clickedItem.Asset.SelfBondage.toString());
			} else {
				return InterfaceTextGet("CannotUseOnSelf");
			}
		},
	};

	_Load() {
		const C = this.C;
		if (C) {
			DialogBuildActivities(C, false);
		}

		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			children: [
				{
					tag: "span",
					attributes: { id: ids.status, "aria-hidden": "true" },
					classList: ["dialog-status", "scroll-box"],
				},
				this._ConstructPaginateButtons(this.ids.paginate),
				{
					tag: "div",
					attributes: { id: ids.grid, "aria-labelledby": ids.status },
					classList: ["dialog-grid", "scroll-box"],
					// FIXME: Figure out how the let the listeners distinguish between mouse wheels and touch pads,
					// as the latter really needs smooth scrolling behavior while the former needs instant
					//
					// eventListeners: { wheel: this.eventListeners._WheelGrid },
				},
				{
					tag: "div",
					classList: ["button", "blank-button", "button-styling", "dialog-grid-button", "dialog-icon"],
					attributes: { id: ids.icon, "aria-labelledby": ids.status },
				},
			],
		});
	}

	/** @type {_DialogFocusMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, properties, options) {
		const { C, focusGroup } = properties;
		/** @type {null | Asset} */
		let asset = null;
		let showIcon = false;
		let textContent = options.status;
		if (textContent == null) {
			switch (this.mode) {
				case "locked": {
					const item = InventoryGet(C, focusGroup.Name);
					const lock = item && InventoryGetLock(item);
					if (!item || !lock || !DialogCanInspectLock(item)){
						textContent = InterfaceTextGet("SelectLockedUnknown");
					} else {
						asset = lock.Asset;
						textContent = InterfaceTextGet("SelectLocked").replace("AssetName", lock.Asset.DynamicDescription(C).toLowerCase());
					}
					showIcon = true;
					break;
				}
				case "items":
					if (InventoryGroupIsBlockedByOwnerRule(C, focusGroup.Name)) {
						textContent = InterfaceTextGet("ZoneBlockedOwner");
						showIcon = true;
					} else if (InventoryIsBlockedByDistance(C)) {
						textContent = InterfaceTextGet("ZoneBlockedRange");
						showIcon = true;
					} else if (focusGroup.IsItem() && InventoryGroupIsBlocked(C, focusGroup.Name)) {
						textContent = InterfaceTextGet("ZoneBlocked");
						showIcon = true;
					} else if (!Player.CanInteract() || (!C.IsPlayer() && Player.IsEnclose())) {
						textContent = InterfaceTextGet("AccessBlocked");
						showIcon = true;
					} else {
						textContent = InterfaceTextGet("SelectItemGroup");
					}
					break;
			}
		}

		root.toggleAttribute("data-show-icon", showIcon);
		DialogSetStatus(textContent ?? "", options.statusTimer ?? 0, { asset, group: focusGroup, C }, this.ids.status);
	}

	/** @type {_DialogFocusMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, properties, options) {
		const { C, focusGroup } = properties;
		if (options.resetDialogItems) {
			DialogInventoryBuild(C, focusGroup, false, false, false);
		}

		if (options.reset) {
			buttonGrid.innerHTML = "";
			DialogInventory.forEach((clickedItem, i) => ElementButton.CreateForAsset(
				`dialog-inventory-${i}`,
				clickedItem,
				C,
				this.eventListeners._ClickButton,
				{ clickDisabled: this.eventListeners._ClickDisabledButton },
				{ button: {
					parent: buttonGrid,
					classList: ["dialog-grid-button"],
					attributes: { "aria-checked": clickedItem.Worn.toString(), "screen-generated": undefined },
					dataAttributes: { index: i },
				}},
			));
		}

		const equippedItem = InventoryGet(C, focusGroup.Name);
		for (const [i, button] of Array.from(buttonGrid.children).entries()) {
			let clickedItem = DialogInventory[i];

			// Tasks already performed during a full `options.resetDialogItems` operation
			if (!options.resetDialogItems) {
				const wasWorn = clickedItem.Worn;
				const isWorn = !!(equippedItem && !DialogAllowItemClick(equippedItem, clickedItem));
				if (isWorn) {
					/** @type {undefined | CraftingItem} */
					const craft = !equippedItem.Craft ? undefined : {
						...equippedItem.Craft,
						Partial: false,
						Color: equippedItem.Color.join(","),
						Lock: equippedItem.Property?.LockedBy ?? "",
						Item: equippedItem.Asset.Name,
						ItemProperty: equippedItem.Property,
					};
					clickedItem = DialogInventory[i] = DialogInventoryCreateItem(C, equippedItem, true, undefined, craft);
					button.toggleAttribute("hidden", false);
				}
				if (isWorn !== wasWorn) {
					clickedItem.Worn = isWorn;
					button.setAttribute("aria-checked", isWorn.toString());
				}
			}

			const status = this.GetClickStatus(C, clickedItem, equippedItem);
			if (status) {
				button.setAttribute("aria-disabled", "true");
			} else {
				button.removeAttribute("aria-disabled");
			}

			if (options.reset) {
				continue;
			}

			// Tasks already performed during a full `options.reset` operation
			button.toggleAttribute("data-hidden", CharacterAppearanceItemIsHidden(clickedItem.Asset.Name, clickedItem.Asset.Group.Name));
			button.toggleAttribute("data-vibrating", clickedItem.Property?.Effect?.includes("Vibrating") ?? false);
			ElementButton.ReloadAssetIcons(/** @type {HTMLButtonElement} */(button), clickedItem, C);
		}

		if (options.resetScrollbar) {
			const checkedButton = buttonGrid.querySelector(`.dialog-grid-button[aria-checked='true']`);
			if (checkedButton) {
				checkedButton.scrollIntoView({ behavior: "instant" });
			} else {
				buttonGrid.scrollTo({ top: 0, behavior: "instant" });
			}
		}
	}

	/** @type {_DialogFocusMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, properties, options) {
		const grid = document.getElementById(this.ids.grid);
		if (!grid) return;
		const dataAttr = ["data-craft", "data-hidden", "data-vibrating"];
		const checkedButton = grid.querySelector(".dialog-grid-button[aria-checked='true']");
		if (checkedButton) {
			icon.replaceChildren(...checkedButton.cloneNode(true).children);
			dataAttr.forEach(attr => icon.toggleAttribute(attr, checkedButton.hasAttribute(attr)));
		} else {
			icon.innerHTML = "";
			dataAttr.forEach(attr => icon.toggleAttribute(attr, false));
		}
	}

	/** @type {_DialogFocusMenu["_ReloadMenubar"]} */
	_ReloadMenubar(root, menubar, properties, options) { /** noop */ }

	/**
	 * For a given grid button return the underlying item or activity.
	 * @type {DialogMenu<string, DialogInventoryItem>["_GetClickedObject"]}
	 */
	_GetClickedObject(button) {
		return DialogInventory[Number.parseInt(button.getAttribute("data-index") ?? "-1", 10)];
	}

	/**
	 * @type {DialogMenu<string, DialogInventoryItem>["_ClickButton"]}
	 */
	_ClickButton(button, C, clickedObj, equippedItem) {
		DialogItemClick(clickedObj, C, equippedItem);
		if (clickedObj.Asset.Wear && button.getAttribute("aria-checked") !== "true") {
			button.closest(".dialog-grid")?.querySelector("[aria-checked='true']")?.setAttribute("aria-checked", "false");
			button.setAttribute("aria-checked", "true");
		}
	}
}

/**
 * @template {string} T
 * @extends {_DialogFocusMenu<T, DialogInventoryItem>}
 */
class _DialogLockingMenu extends _DialogFocusMenu {
	ids = Object.freeze({
		root: "dialog-locking",
		status: "dialog-locking-status",
		grid: "dialog-locking-grid",
		paginate: "dialog-locking-paginate",
	});

	_initPropertyNames = /** @type {const} */(["C", "focusGroup"]);

	/** @satisfies {DialogMenu<T, DialogInventoryItem>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {
		InventoryBlockedOrLimited: (C, clickedLock, equippedItem) => {
			return InventoryBlockedOrLimited(C, clickedLock) ? InterfaceTextGet("ExtendedItemNoItemPermission") : null;
		},
		CurrentItem: (C, clickedLock, equippedItem) => {
			return equippedItem ? null : InterfaceTextGet("NoItemEquipped");
		},
		InventoryDoesItemAllowLock: (C, clickedLock, equippedItem) => {
			return equippedItem && InventoryDoesItemAllowLock(equippedItem) ? null : InterfaceTextGet("AccessBlocked");
		},
	};

	_Load() {
		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			children: [
				{
					tag: "span",
					attributes: { id: ids.status, "aria-hidden": "true" },
					classList: ["dialog-status", "scroll-box"],
				},
				this._ConstructPaginateButtons(this.ids.paginate),
				{
					tag: "div",
					attributes: { id: ids.grid, "aria-labelledby": ids.status },
					classList: ["dialog-grid", "scroll-box"],
					// FIXME: Figure out how the let the listeners distinguish between mouse wheels and touch pads,
					// as the latter really needs smooth scrolling behavior while the former needs instant
					//
					// eventListeners: { wheel: this.eventListeners._WheelGrid },
				},
			],
		});
	}

	/** @type {_DialogFocusMenu["_ReloadStatus"]} */
	_ReloadStatus(root, status, properties, options) {
		const { C, focusGroup } = properties;
		const textContent = options.status ?? InterfaceTextGet("SelectLock");
		DialogSetStatus(textContent, options.statusTimer ?? 0, { group: focusGroup, C }, this.ids.status);
	}

	/** @type {_DialogFocusMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, properties, options) {
		const { C, focusGroup } = properties;
		if (options.resetDialogItems) {
			DialogInventoryBuild(C, focusGroup, false, true, false);
		}

		if (options.reset) {
			buttonGrid.innerHTML = "";
			DialogInventory.forEach((clickedItem, i) => ElementButton.CreateForAsset(
				`dialog-locking-${i}`,
				clickedItem,
				C,
				this.eventListeners._ClickButton,
				{ clickDisabled: this.eventListeners._ClickDisabledButton },
				{ button: {
					parent: buttonGrid,
					classList: ["dialog-grid-button"],
					attributes: { "screen-generated": undefined },
					dataAttributes: { index: i },
				}},
			));
		}

		const equippedItem = InventoryGet(C, focusGroup.Name);
		for (const [i, button] of Array.from(buttonGrid.children).entries()) {
			const clickedLock = DialogInventory[i];

			if (this.GetClickStatus(C, clickedLock, equippedItem)) {
				button.setAttribute("aria-disabled", "true");
			} else {
				button.removeAttribute("aria-disabled");
			}

			if (!options.reset) {
				// Tasks already performed during a full `options.reset`
				button.toggleAttribute("data-hidden", CharacterAppearanceItemIsHidden(clickedLock.Asset.Name, clickedLock.Asset.Group.Name));
				ElementButton.ReloadAssetIcons(/** @type {HTMLButtonElement} */(button), clickedLock, C);
			}
		}

		if (options.resetScrollbar) {
			buttonGrid.scrollTo({ top: 0, behavior: "instant" });
		}
	}

	/** @type {_DialogFocusMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, properties, options) { /** noop */ }

	/** @type {_DialogFocusMenu["_ReloadMenubar"]} */
	_ReloadMenubar(root, menubar, properties, options) { /** noop */ }

	/** @type {DialogMenu<string, DialogInventoryItem>["_GetClickedObject"]} */
	_GetClickedObject(button) {
		return DialogInventory[Number.parseInt(button.getAttribute("data-index") ?? "-1", 10)];
	}

	/** @type {DialogMenu<string, DialogInventoryItem>["_ClickButton"]} */
	_ClickButton(button, C, clickedLock, equippedItem) {
		DialogLockingClick(clickedLock, C, equippedItem);
	}
}

/**
 * @template {string} T
 * @extends {_DialogFocusMenu<T, DialogInventoryItem>}
 */
class _DialogPermissionMenu extends _DialogFocusMenu {
	ids = Object.freeze({
		root: "dialog-permission",
		status: "dialog-permission-status",
		grid: "dialog-permission-grid",
		paginate: "dialog-permission-paginate",
	});

	_initPropertyNames = /** @type {const} */(["C", "focusGroup"]);

	/** @type {DialogMenu<T, DialogInventoryItem>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {
		IsPlayer: (C, clickedItem, equippedItem) => {
			return C.IsPlayer() ? null : InterfaceTextGet("RequirePlayer");
		},
	};

	_Load() {
		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			children: [
				{
					tag: "span",
					attributes: { id: ids.status, "aria-hidden": "true" },
					classList: ["dialog-status", "scroll-box"],
				},
				this._ConstructPaginateButtons(this.ids.paginate),
				{
					tag: "div",
					attributes: { id: ids.grid, "aria-labelledby": ids.status },
					classList: ["dialog-grid", "scroll-box"],
					// FIXME: Figure out how the let the listeners distinguish between mouse wheels and touch pads,
					// as the latter really needs smooth scrolling behavior while the former needs instant
					//
					// eventListeners: { wheel: this.eventListeners._WheelGrid },
				},
			],
		});
	}

	/** @type {_DialogFocusMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, properties, options) {
		const textContent = options.status ?? InterfaceTextGet("DialogMenuPermissionMode");
		DialogSetStatus(textContent, options.statusTimer ?? 0, null, this.ids.status);
	}

	/** @type {_DialogFocusMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, properties, options) {
		const { C, focusGroup } = properties;
		if (options.resetDialogItems) {
			DialogInventoryBuild(C, focusGroup, false, false, false);
		}

		if (options.reset) {
			buttonGrid.innerHTML = "";
			DialogInventory.forEach((clickedItem, i) => ElementButton.CreateForAsset(
				`dialog-permission-${i}`,
				clickedItem,
				C,
				this.eventListeners._ClickButton,
				{ clickDisabled: this.eventListeners._ClickDisabledButton },
				{ button: {
					parent: buttonGrid,
					classList: ["dialog-grid-button"],
					attributes: { "screen-generated": undefined },
					dataAttributes: { index: i },
				}},
			));
		}

		const equippedItem = InventoryGet(C, focusGroup.Name);
		for (const [i, button] of Array.from(buttonGrid.children).entries()) {
			const clickedItem = DialogInventory[i];

			const status = this.GetClickStatus(C, clickedItem, equippedItem);
			if (status) {
				button.setAttribute("aria-disabled", "true");
			} else {
				button.removeAttribute("aria-disabled");
			}

			const permissions = C.PermissionItems[`${clickedItem.Asset.Group.Name}/${clickedItem.Asset.Name}`];
			button.setAttribute("data-permission", permissions?.Permission ?? "Default");

			if (!options.reset) {
				// Tasks already performed during a full `options.reset`
				button.toggleAttribute("data-hidden", CharacterAppearanceItemIsHidden(clickedItem.Asset.Name, clickedItem.Asset.Group.Name));
				ElementButton.ReloadAssetIcons(/** @type {HTMLButtonElement} */(button), clickedItem, C);
			}
		}

		if (options.resetScrollbar) {
			buttonGrid.scrollTo({ top: 0, behavior: "instant" });
		}
	}

	/** @type {_DialogFocusMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, properties, options) { /** noop */ }

	/** @type {_DialogFocusMenu["_ReloadMenubar"]} */
	_ReloadMenubar(root, menubar, properties, options) { /** noop */ }

	/** @type {DialogMenu<string, DialogInventoryItem>["_GetClickedObject"]} */
	_GetClickedObject(button) {
		return DialogInventory[Number.parseInt(button.getAttribute("data-index") ?? "-1", 10)];
	}

	/** @type {DialogMenu<string, DialogInventoryItem>["_ClickButton"]} */
	_ClickButton(button, C, clickedObj, equippedItem) {
		const permission = DialogPermissionsClick(clickedObj, equippedItem);
		button.setAttribute("data-permission", permission);
		ElementButton.ReloadAssetIcons(button, clickedObj, C);
	}
}

/**
 * @template {string} T
 * @extends {_DialogFocusMenu<T, ItemActivity>}
 */
class _DialogActivitiesMenu extends _DialogFocusMenu {
	ids = Object.freeze({
		root: "dialog-activity",
		status: "dialog-activity-status",
		grid: "dialog-activity-grid",
		paginate: "dialog-activity-paginate",
	});

	_initPropertyNames = /** @type {const} */(["C", "focusGroup"]);

	/** @type {DialogMenu<T, ItemActivity>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {
		IsBlocked: (C, clickedActivity, equippedItem) => {
			switch (clickedActivity.Blocked) {
				case "blocked":
					return InterfaceTextGet("ExtendedItemNoItemPermission");
				default:
					return null;
			}
		},
	};

	_Load() {
		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			children: [
				{
					tag: "span",
					attributes: { id: ids.status, "aria-hidden": "true" },
					classList: ["dialog-status", "scroll-box"],
				},
				this._ConstructPaginateButtons(this.ids.paginate),
				{
					tag: "div",
					attributes: { id: ids.grid, "aria-labelledby": ids.status },
					classList: ["dialog-grid", "scroll-box"],
					// FIXME: Figure out how the let the listeners distinguish between mouse wheels and touch pads,
					// as the latter really needs smooth scrolling behavior while the former needs instant
					//
					// eventListeners: { wheel: this.eventListeners._WheelGrid },
				},
			],
		});
	}

	/** @type {_DialogFocusMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, properties, options) {
		const { C, focusGroup } = properties;
		const textContent = options.status ?? InterfaceTextGet("SelectActivityGroup");
		DialogSetStatus(textContent, options.statusTimer ?? 0, { C, group: focusGroup }, this.ids.status);
	}

	/** @type {_DialogFocusMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, properties, options) {
		const { C, focusGroup } = properties;
		if (options.resetDialogItems) {
			DialogBuildActivities(C, false);
		}

		if (options.reset) {
			buttonGrid.innerHTML = "";
			DialogActivity.forEach((clickedActivity, index) => ElementButton.CreateForActivity(
				`dialog-activities-${index}`,
				clickedActivity,
				C,
				this.eventListeners._ClickButton,
				{ clickDisabled: this.eventListeners._ClickDisabledButton },
				{ button: {
					parent: buttonGrid,
					classList: ["dialog-grid-button"],
					attributes: { "screen-generated": undefined },
					dataAttributes: { index, group: focusGroup.Name },
				}},
			));
		}

		const equippedItem = InventoryGet(C, focusGroup.Name);
		for (const [i, button] of Array.from(buttonGrid.children).entries()) {
			const clickedActivity = DialogActivity[i];

			const status = this.GetClickStatus(C, clickedActivity, equippedItem);
			if (status) {
				button.setAttribute("aria-disabled", "true");
			} else {
				button.removeAttribute("aria-disabled");
			}
		}

		if (options.resetScrollbar) {
			buttonGrid.scrollTo({ top: 0, behavior: "instant" });
		}
	}

	/** @type {_DialogFocusMenu["_ReloadIcon"]} */
	_ReloadIcon() { /** noop */ }

	/** @type {_DialogFocusMenu["_ReloadMenubar"]} */
	_ReloadMenubar(root, menubar, properties, options) { /** noop */ }

	/** @type {DialogMenu<string, ItemActivity>["_GetClickedObject"]} */
	_GetClickedObject(button) {
		return DialogActivity[Number.parseInt(button.getAttribute("data-index") ?? "-1", 10)];
	}

	/** @type {DialogMenu<string, ItemActivity>["_ClickButton"]} */
	_ClickButton(button, C, clickedObj, equippedItem) {
		DialogActivityClick(C, clickedObj, equippedItem);
	}
}

/**
 * @template {string} T
 * @extends {_DialogFocusMenu<T, null>}
 */
class _DialogCraftedMenu extends _DialogFocusMenu {
	ids = Object.freeze({
		root: "dialog-crafted",
		status: "dialog-crafted-status",
		icon: "dialog-crafted-icon",

		footer: "dialog-crafted-footer",
		info: "dialog-crafted-info",
		description: "dialog-crafted-description",
		private: "dialog-crafted-private",
		name: "dialog-crafted-name",
		property: "dialog-crafted-property",
		crafter: "dialog-crafted-crafter",
		gap: "dialog-crafted-gap",
	});

	_initPropertyNames = /** @type {const} */(["C", "focusGroup"]);

	/** @type {DialogMenu["clickStatusCallbacks"]} */
	clickStatusCallbacks = {};

	_Load() {
		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			attributes: { "aria-owns": ids.icon },
			children: [
				{
					tag: "span",
					attributes: { id: ids.status, "aria-hidden": "true" },
					classList: ["dialog-status", "scroll-box"],
				},
				{
					tag: "ul",
					attributes: { id: ids.info, "aria-labelledby": ids.status },
					children: [
						{ tag: "li", attributes: { id: ids.name }, classList: [ids.info] },
						{ tag: "li", attributes: { id: ids.crafter }, classList: [ids.info] },
						{ tag: "li", attributes: { id: ids.property }, classList: [ids.info] },
						{ tag: "li", attributes: { id: ids.private }, classList: [ids.info] },
						{ tag: "div", attributes: { id: ids.gap, "aria-hidden": "true" } },
						{
							tag: "div",
							classList: ["button", "blank-button", "button-styling", "dialog-grid-button", "dialog-icon"],
							attributes: { id: ids.icon, role: "img", "aria-labelledby": `${ids.icon}-label` },
						},
						{
							tag: "li",
							attributes: { id: ids.footer },
							classList: [ids.info, "scroll-box"],
							children: [
								{
									tag: "ul",
									children: [
										{ tag: "li", attributes: { id: ids.description } },
									],
								},
							]
						}

					],
				},
			],
		});
	}

	/** @type {_DialogFocusMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, properties, options) {
		const textContent = options.status ?? InterfaceTextGet("CraftedItemProperties");
		DialogSetStatus(textContent, options.statusTimer ?? 0, null, this.ids.status);
	}

	/** @type {_DialogFocusMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, properties, options) { /** noop */ }

	/** @type {_DialogFocusMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, properties, options) {
		const { C, focusGroup } = properties;
		const ids = this.ids;
		const item = /** @type {Item} */ (InventoryGet(C, focusGroup.Name));

		icon.innerHTML = "";
		[
			ElementButton._ParseImage(icon.id, `./Assets/Female3DCG/${item.Asset.DynamicGroupName}/Preview/${item.Asset.Name}.png`),
			ElementButton._ParseLabel(icon.id, item.Asset.Description),
			ElementButton._ParseIcons(icon.id, [
				DialogGetFavoriteStateDetails(C, item.Asset)?.Icon,
				...DialogGetLockIcon(item, true),
				...DialogGetAssetIcons(item.Asset),
				...DialogEffectIcons.GetIcons(item)
			])?.iconGrid,
		].filter(Boolean).forEach(e => icon.append(e));

		const craft = item.Craft;
		const [name, crafter, property, description, private_] = [ids.name, ids.crafter, ids.property, ids.description, ids.private].map(i => document.getElementById(i));
		if (!craft || !name || !crafter || !property || !description || !private_) {
			return;
		}
		name.textContent = InterfaceTextGet("CraftingName").replace("CraftName", craft.Name);
		crafter.textContent = InterfaceTextGet("CraftingMember").replace("MemberName", craft.MemberName ?? "").replace("MemberNumber", craft.MemberNumber?.toString() ?? "");
		private_.textContent = InterfaceTextGet("CraftingPrivate").replace("CraftPrivate", CommonCapitalize(craft.Private.toString()));
		CommonPromiseCatch(
			TextPrefetchFile("Screens/Room/Crafting/Text_Crafting.csv").loadedPromise
				.then(textCache => {
					property.replaceChildren(
						InterfaceTextGet("CraftingProperty").replace("CraftProperty", ""),
						ElementCreate({
							tag: "ul",
							children: Object.entries(craft.Effects ?? {}).map(([propertyKey, propertyValue]) => {
								if (!propertyValue) {
									return null;
								}
								return {
									tag: "li",
									children: [
										{
											tag: "dfn",
											children: [propertyKey],
										},
										propertyValue > 1 ? ` ×${propertyValue} - ` : " - ",
										textCache.get(`Description${propertyKey}`),
									],
								};
							}),
						}),
					);
				})
		);

		description.replaceChildren(
			InterfaceTextGet("CraftingDescription").replace("CraftDescription", ""),
			...CraftingDescription.DecodeToHTML(craft.Description),
		);
	}

	/** @type {_DialogFocusMenu["_ReloadMenubar"]} */
	_ReloadMenubar(root, menubar, properties, options) { /** noop */ }

	/** @type {DialogMenu<string, null>["_GetClickedObject"]} */
	_GetClickedObject(button) { return null; /** noop */ }

	/** @type {DialogMenu<string, null>["_ClickButton"]} */
	_ClickButton(button, C, clickedObj, equippedItem) { /** noop */ }
}

/**
 * @template {string} T
 * @extends {DialogMenu<T, DialogLine, { C: Character }>}
 */
class _DialogDialogMenu extends DialogMenu {
	ids = Object.freeze({
		root: "dialog-dialog",
		status: "dialog-dialog-status",
		grid: "dialog-dialog-grid",
		menubar: "dialog-dialog-menubar",
	});

	_initPropertyNames = /** @type {const} */(["C"]);

	defaultShape = Object.freeze(/** @type {const} */([1005, 15, 995, 962]));

	/** @type {DialogMenu<string, DialogLine>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {};

	/**
	 * @param {T} mode
	 */
	constructor(mode) {
		super(mode);
		const dialogMenu = this;
		this.eventListeners = {
			...this.eventListeners,

			/** @type {(this: HTMLButtonElement, ev: PointerEvent) => void} */
			_ClickMenubarExit: function(ev) {
				const C = dialogMenu.C;
				if (!C) {
					ev.stopImmediatePropagation();
					return;
				}

				switch (DialogIntro(C)) {
					case "":
					case "NOEXIT":
						this.setAttribute("aria-disabled", "true");
						this.dispatchEvent(new PointerEvent("bcClickDisabled", ev));
						ev.stopImmediatePropagation();
						break;
					default:
						DialogMenuBack();
						break;
				}
			},
		};
	}

	/** @type {DialogMenu["Draw"]} */
	Draw() {
		const C = this.C;
		if (C && C.IsNpc()) {
			NPCInteraction(C);
		}
	}

	_Load() {
		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			children: [
				ElementMenu.Create(
					ids.menubar,
					[],
					{ direction: "rtl" },
					{ menu: { classList: ["dialog-menubar"] } },
				),
				{
					tag: "span",
					attributes: { id: ids.status, "aria-hidden": "true" },
					classList: ["dialog-status", "scroll-box"],
				},
				{
					tag: "div",
					attributes: { id: ids.grid, "aria-labelledby": ids.status },
					classList: ["dialog-grid", "scroll-box"],
				},
			],
		});
	}

	/** @type {ScreenExitHandler} */
	Exit() {
		super.Exit();
	}

	/** @type {VoidHandler} */
	Unload() {
		super.Unload();
	}

	/** @type {DialogMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, properties, options) {
		const { C } = properties;
		const textContent = SpeechTransformDialog(C, options.status ?? C.CurrentDialog);
		DialogSetStatus(textContent, options.statusTimer ?? 0, null, this.ids.status);
	}

	/** @type {DialogMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, properties, options) {
		const { C } = properties;
		if (options.reset) {
			buttonGrid.replaceChildren();
			buttonGrid.append(
				...C.Dialog.map((dialog, i) => ElementButton.Create(
					`dialog-dialog-${i}`,
					this.eventListeners._ClickButton,
					{ label: " ", labelPosition: "center" },
					{ button: {
						attributes: { "screen-generated": undefined },
						dataAttributes: { index: i, group: dialog.Group ?? undefined },
						classList: ["dialog-grid-button", "dialog-dialog-button"],
					}},
				)),
			);
		}

		for (const [i, dialog] of C.Dialog.entries()) {
			const button = buttonGrid.children[i];
			if (!button) {
				continue;
			}

			const unload = !(dialog.Stage === C.Stage && dialog.Option !== null && DialogPrerequisite(dialog));
			button.toggleAttribute("hidden", unload);
			if (!unload) {
				button.querySelector(".button-label")?.replaceChildren(SpeechTransformDialog(Player, dialog.Option ?? ""));
			}
		}
	}

	/** @type {DialogMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, propertes, options) { /** noop */ }

	/** @type {DialogMenu["_ReloadMenubar"]} */
	_ReloadMenubar(root, menubar, properties, options) {
		const { C } = properties;
		if (options.reset) {
			menubar.replaceChildren();
			menubar.append(
				ElementButton.Create(
					`${this.ids.menubar}-Exit`,
					this.eventListeners._ClickMenubarExit,
					{ image: "./Icons/Exit.png", tooltip: InterfaceTextGet("DialogMenuExit"), tooltipPosition: "left", name: "Exit" },
					{ button: { classList: ["dialog-menubar-button"] }},
				),
			);
		}

		const exitButton = menubar.querySelector("[name='Exit']");
		switch (DialogIntro(C)) {
			case "":
			case "NOEXIT":
				exitButton?.setAttribute("aria-disabled", "true");
				break;
			default:
				exitButton?.setAttribute("aria-disabled", "false");
				break;
		}
	}

	/** @type {DialogMenu<string, DialogLine>["_GetClickedObject"]} */
	_GetClickedObject(button) {
		const index = Number.parseInt(button.getAttribute("data-index") ?? "-1", 10);
		return this.C?.Dialog[index] ?? null;
	}

	/** @type {DialogMenu<string, DialogLine>["_ClickButton"]} */
	_ClickButton(button, C, clickedDialog) {
		// Use the private `_CurrentDialog`/`_Reload` variables in order to circumvent the respective setters,
		// manually performing any reloads/status updates

		// If the player is gagged, the answer will always be the same
		C._CurrentDialog = Player.CanTalk() ? (clickedDialog.Result ?? "") : DialogFind(C, "PlayerGagged");
		C.ClickedOption = clickedDialog.Option;

		// A dialog option can change the conversation stage, show text or launch a custom function
		if ((Player.CanTalk() && C.CanTalk()) || (clickedDialog.Option != null && SpeechFullEmote(clickedDialog.Option))) {
			C._CurrentDialog = clickedDialog.Result ?? "";
			if (clickedDialog.NextStage !== null) {
				C._Stage = clickedDialog.NextStage;
				CommonPromiseCatch(this.Reload());
			} else {
				// manually reload the status
				DialogSetStatus(C.CurrentDialog);
			}

			if (clickedDialog.Function) {
				try {
					CommonDynamicFunctionParams(clickedDialog.Function);
				} catch (err) {
					console.error("_ClickButton: Failed dynamic expression", clickedDialog.Function, err);
				}
			}
		} else if (clickedDialog.Function?.trim() === "DialogLeave()") {
			DialogLeave();
		}
	}
}

/**
 * @template {DialogSelfMenuName} [ModeType=DialogSelfMenuName]
 * @template [T=any]
 * @extends {DialogMenu<ModeType, T, { C: PlayerCharacter }>}
 */
class _DialogSelfMenu extends DialogMenu {
	_initPropertyNames = /** @type {const} */(["C"]);

	defaultShape = Object.freeze(/** @type {const} */([15, 15, 500, 940]));

	/**
	 * An object mapping button {@link HTMLButtonElement.name}s to their respective click + validation functions
	 * @type {Record<string, DialogMenu.MenuButtonData<{ C: PlayerCharacter }>>}
	 */
	menubarEventListeners = {};

	/** @type {DialogMenu<ModeType, T, { C: PlayerCharacter }>["Init"]} */
	Init(parameters, style) {
		if (DialogSelfMenuSelected !== this.mode) {
			DialogGetSelfMenu(DialogSelfMenuSelected)?.Unload();
			DialogSelfMenuSelected = this.mode;
		}
		const ret = super.Init(parameters, style);
		this.Resize(true);
		return ret;
	}

	/**
	 * Whether this self-menu is accessible via the "view next page" button.
	 * @param {PlayerCharacter} C
	 */
	IsAvailable(C) {
		return true;
	}

	/**
	 * @param {ModeType} mode The name of the mode associated with this instance
	 */
	constructor(mode) {
		super(mode);
		const dialogMenu = this;

		this.eventListeners = {
			...this.eventListeners,

			/** @type {(this: HTMLButtonElement, ev: PointerEvent) => void} */
			_ClickMenuButton(ev) {
				const initProperties = dialogMenu._initProperties;
				if (!initProperties) {
					ev.stopImmediatePropagation();
					return;
				}
				const param = CommonPick(initProperties, dialogMenu._initPropertyNames);
				if (Object.values(param).some(i => i == null)) {
					ev.stopImmediatePropagation();
					return;
				}

				/** @type {DialogMenu.MenuButtonData<{ C: PlayerCharacter }>} */
				const listener = dialogMenu.menubarEventListeners[this.name];
				if (!listener) {
					ev.stopImmediatePropagation();
					return;
				}

				const equippedItem = dialogMenu.focusGroup ? InventoryGet(param.C, dialogMenu.focusGroup.Name) : null;
				for (const validator of Object.values(listener.validate ?? {})) {
					const status = validator(this, param, equippedItem);
					if (status?.state) {
						ev.stopImmediatePropagation();
						CommonPromiseCatch(dialogMenu.Reload(null, { status: status.status, statusTimer: DialogTextDefaultDuration }));
						return;
					}
				}

				listener.click(this, ev, param, equippedItem);
			},

			/** @type {(this: HTMLButtonElement, ev: PointerEvent) => void} */
			_ClickDisabledMenuButton(ev) {
				const initProperties = dialogMenu._initProperties;
				if (!initProperties) {
					ev.stopImmediatePropagation();
					return;
				}
				const param = CommonPick(initProperties, dialogMenu._initPropertyNames);
				if (Object.values(param).some(i => i == null)) {
					ev.stopImmediatePropagation();
					return;
				}

				/** @type {DialogMenu.MenuButtonData<{ C: PlayerCharacter }>} */
				const listener = dialogMenu.menubarEventListeners[this.name];
				if (!listener) {
					ev.stopImmediatePropagation();
					return;
				}

				const equippedItem = dialogMenu.focusGroup ? InventoryGet(param.C, dialogMenu.focusGroup.Name) : null;
				for (const validator of Object.values(listener.validate ?? {})) {
					const status = validator(this, param, equippedItem);
					if (status?.state) {
						if (status.status) {
							DialogSetStatus(status.status, DialogTextDefaultDuration, { C: param.C }, dialogMenu.ids.status);
						}
						return;
					}
				}
				CommonPromiseCatch(dialogMenu.Reload(null));
			},
		};

		/** @satisfies {Record<string, DialogMenu.MenuButtonData<{ C: PlayerCharacter }>>} */
		this.menubarEventListeners = {
			/** @type {DialogMenu.MenuButtonData<{ C: PlayerCharacter }>} */
			next: {
				click() {
					DialogFindNextSubMenu();
				},
			},
		};
	}

	/** @type {DialogMenu<ModeType, T, { C: PlayerCharacter }>["_ReloadMenubar"]} */
	_ReloadMenubar(root, menubar, properties, options) {
		/** @type {NodeListOf<HTMLButtonElement>} */
		const buttons = menubar.querySelectorAll("button.dialog-menubar-button");
		const equippedItem = this.focusGroup ? InventoryGet(properties.C, this.focusGroup.Name) : null;
		for (const button of buttons) {
			const listener = this.menubarEventListeners[button.name];
			if (!listener) {
				continue;
			}

			let validationFailure = false;
			validators: for (const validator of Object.values(listener.validate ?? {})) {
				const status = validator(button, properties, equippedItem);
				switch (status?.state) {
					case "disabled":
						validationFailure = true;
						button.setAttribute("aria-disabled", "true");
						break validators;
					case "hidden":
						validationFailure = true;
						button.toggleAttribute("hidden", true);
						break validators;
				}
			}
			if (!validationFailure) {
				button.removeAttribute("aria-disabled");
				button.toggleAttribute("hidden", false);
			}
		}
	}
}

/**
 * @template {DialogSelfMenuName} ModeType
 * @extends {_DialogSelfMenu<ModeType, ExpressionPair>}
 */
class _DialogExpressionMenu extends _DialogSelfMenu {
	ids = Object.freeze({
		root: "dialog-expression",
		status: "dialog-expression-status",
		menubar: "dialog-expression-menubar",
		menuLeft: "dialog-expression-menu-left",
		grid: "dialog-expression-button-grid",
	});

	/** @satisfies {DialogMenu<ModeType, ExpressionPair>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {
		CharacterIsExpressionAllowed: (C, clickedItem, equippedItem) => {
			const status = !!equippedItem && CharacterIsExpressionDisallowed(C, equippedItem, clickedItem.Expression);
			return status ? InterfaceTextGet(`Prerequisite${status}`).replace("{Expression}", clickedItem.Expression ?? "") : null;
		},
	};

	/**
	 * See {@link _DialogExpressionMenu.facialExpressions}
	 * @private
	 * @type {null | Readonly<Partial<Record<ExpressionGroupName, readonly (null | ExpressionName)[]>>>}
	 */
	_facialExpressions = null;

	/**
	 * Get an object with all UI-configurable expression group names mapped to their respective expressions.
	 * @type {Readonly<Partial<Record<ExpressionGroupName, readonly (null | ExpressionName)[]>>>}
	 */
	get facialExpressions() {
		// Go lazy loading, go!
		if (!this._facialExpressions) {
			/** @type {Partial<Record<ExpressionGroupName, readonly (null | ExpressionName)[]>>} */
			const expressions = {};
			for (const group of AssetGroup) {
				if (!group.HasExpression() || group.Name === "Eyes2") continue;
				const { Name, AllowExpression } = group;
				expressions[Name] = AllowExpression.includes(null) ? AllowExpression : [null, ...AllowExpression];
			}
			return this._facialExpressions = expressions;
		} else {
			return this._facialExpressions;
		}
	}

	get focusGroup() {
		const elem = document.querySelector(`#${this.ids.menuLeft} [role="menuitemradio"][aria-checked="true"]`);
		const groupName = /** @type {null | ExpressionGroupName} */(elem?.getAttribute("name"));
		return (groupName && this.C) ? AssetGroupGet(this.C.AssetFamily, groupName) : null;
	}

	/**
	 * @param {ModeType} mode The name of the mode associated with this instance
	 */
	constructor(mode) {
		super(mode);
		const dialogMenu = this;

		/** @satisfies {Record<string, (this: HTMLElement, ev: Event) => any>} */
		this.eventListeners = {
			...this.eventListeners,

			/** @type {(this: HTMLButtonElement, ev: PointerEvent) => void} */
			_expressionRadioGroupClick(ev) {
				const colorButton = document.getElementById(`${dialogMenu.ids.menubar}-color`);
				document.querySelector(`#${dialogMenu.ids.root} > .dialog-expression-grid:not([hidden])`)?.toggleAttribute("hidden", true);
				if (this.getAttribute("aria-checked") === "true") {
					colorButton?.setAttribute("aria-disabled", this.name !== "Eyes" ? "false" : "true");
					ElementUnpackIDs.fromAttribute(this, "aria-owns").forEach(buttonGrid => {
						buttonGrid.toggleAttribute("hidden", false);
						buttonGrid.querySelector(`[role="radio"][aria-checked='true']`)?.scrollIntoView({ behavior: "instant" });
					});
				} else {
					colorButton?.setAttribute("aria-disabled", "true");
				}
				if (colorButton?.getAttribute("aria-disabled") === "true" && ItemColorState) {
					ItemColorCancelAndExit();
				}
			},
		};

		/** @satisfies {Record<string, DialogMenu.MenuButtonData<{ C: PlayerCharacter }>>} */
		this.menubarEventListeners = {
			...this.menubarEventListeners,

			/** @type {DialogMenu.MenuButtonData<{ C: PlayerCharacter }>} */
			color: {
				click(button, ev, { C }, equippedItem) {
					if (!equippedItem) {
						ev.stopImmediatePropagation();
						return;
					}
					// Guard against double-clicks: if we're already colorizing this expression,
					// re-running this handler would re-register a second ItemColorOnExit callback
					// and corrupt DialogExpressionPreviousMode (see DialogChangeMode above).
					if (DialogMenuMode === "colorExpression" && ItemColorState) {
						ev.stopImmediatePropagation();
						return;
					}

					ItemColorLoad(Player, equippedItem, 1090, 15, 885, 970, true).then(() => {
						const groupName = equippedItem.Asset.Group.Name;
						DialogChangeMode("colorExpression");
						Player.FocusGroup = /** @type {AssetItemGroup} */ (AssetGroupGet(Player.AssetFamily, groupName));
						ItemColorOnExit(({ colors, initialColors, opacity, initialOpacity }, save) => {
							DialogMenuBack();
							if (save && (!CommonArraysEqual(colors, initialColors) || !CommonArraysEqual(opacity, initialOpacity))) {
								ServerPlayerAppearanceSync();
								ChatRoomCharacterItemUpdate(Player, groupName);
							}
						});
					}).catch(err => {
						console.error(`Failed to load "${CurrentModule}/${CurrentScreen}" item color subscreen:\n`, err);
						ToastManager.error(`Failed to load "${CurrentModule}/${CurrentScreen}" item color subscreen`);
					});
				},
			},
			/** @type {DialogMenu.MenuButtonData<{ C: PlayerCharacter }>} */
			blindness: {
				click(button) {
					const level = Number.parseInt(button.getAttribute("aria-valuenow") ?? "", 10);
					DialogFacialExpressionsSelectedBlindnessLevel = level;
					ElementButton.SetImage(button, `Icons/BlindToggle${level}.png`);
				},
			},
			/** @type {DialogMenu.MenuButtonData<{ C: PlayerCharacter }>} */
			blink: {
				click(button, ev, { C }) {
					const val = CommonParseInt(button.getAttribute("aria-valuenow") ?? "", 10) ?? 1;
					const level = /** @type {1 | 2 | 3 | 4} */ (CommonClamp(val, 1, 4));

					/** @type {string} */
					let state;
					switch (level) {
						case 1:
							state = "None";
							CharacterSetFacialExpression(C, "Eyes", C.ActiveExpression.Eyes);
							break;
						case 2:
							state = "Left";
							CharacterSetFacialExpression(C, "Eyes1", C.ActiveExpression.Eyes);
							CharacterSetFacialExpression(C, "Eyes2", "Closed");
							break;
						case 3:
							state = "Both";
							CharacterSetFacialExpression(C, "Eyes", "Closed");
							break;
						case 4:
							state = "Right";
							CharacterSetFacialExpression(C, "Eyes1", "Closed");
							CharacterSetFacialExpression(C, "Eyes2", C.ActiveExpression.Eyes);
							break;
					}
					button.setAttribute("aria-valuetext", state);
					ElementButton.SetImage(button, `Icons/Wink${state}.png`);
				},
			},
			/** @type {DialogMenu.MenuButtonData<{ C: PlayerCharacter }>} */
			clear: {
				click(button, ev, { C }) {
					CharacterResetFacialExpression(C);
					for (const expressionGroup of CommonKeys(dialogMenu.facialExpressions)) {
						delete C.ActiveExpression[expressionGroup];
					}
				},
			},
		};
	}

	_Load() {
		const ids = this.ids;
		const expressionEntries = CommonEntries(this.facialExpressions);
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			attributes: { id: ids.root, "aria-labelledby": ids.status },
			parent: document.body,
			classList: ["dialog-root", "dialog-self-menu-root"],
			children: [
				{
					tag: "span",
					attributes: { id: ids.status },
					classList: ["dialog-status", "scroll-box"],
				},
				ElementMenu.Create(
					ids.menubar,
					[
						ElementButton.Create(
							`${ids.menubar}-next`,
							this.eventListeners._ClickMenuButton,
							{ tooltip: InterfaceTextGet("NextPage"), tooltipPosition: "right", image: "Icons/Next.png", clickDisabled: this.eventListeners._ClickDisabledMenuButton },
							{ button: { attributes: { name: "next" }, classList: ["dialog-menubar-button"] } },
						),
						ElementButton.Create(
							`${ids.menubar}-color`,
							this.eventListeners._ClickMenuButton,
							{ tooltip: InterfaceTextGet("DialogMenuColorExpressionChange"), tooltipPosition: "right", image: "Icons/ColorChange.png", disabled: true, clickDisabled: this.eventListeners._ClickDisabledMenuButton },
							{ button: { attributes: { name: "color" }, classList: ["dialog-menubar-button"] } },
						),
						ElementButton.Create(
							`${ids.menubar}-blindness`,
							this.eventListeners._ClickMenuButton,
							{ tooltip: InterfaceTextGet("BlindToggleFacialExpressions"), tooltipPosition: "right", image: "Icons/BlindToggle1.png", role: "spinbutton" },
							{ button: {
								attributes: { name: "blindness", "aria-valuenow": 1, "aria-valuemin": 1, "aria-valuemax": 3 },
								classList: ["dialog-menubar-button"],
							}},
						),
						ElementButton.Create(
							`${ids.menubar}-blink`,
							this.eventListeners._ClickMenuButton,
							{ tooltip: InterfaceTextGet("WinkFacialExpressions"), tooltipPosition: "right", image: "Icons/WinkNone.png", role: "spinbutton", clickDisabled: this.eventListeners._ClickDisabledMenuButton },
							{ button: {
								attributes: { name: "blink", "aria-valuenow": 1, "aria-valuetext": "None", "aria-valuemin": 1, "aria-valuemax": 4 },
								classList: ["dialog-menubar-button"],
							}},
						),
						ElementButton.Create(
							`${ids.menubar}-clear`,
							this.eventListeners._ClickMenuButton,
							{ tooltip: InterfaceTextGet("ClearFacialExpressions"), tooltipPosition: "right", image: "Icons/Reset.png", clickDisabled: this.eventListeners._ClickDisabledMenuButton },
							{ button: { attributes: { name: "clear" }, classList: ["dialog-menubar-button"] } },
						),
					],
					{ direction: "rtl" },
					{ menu: { classList: ["dialog-self-menu-menubar"] } },
				),
				ElementMenu.Create(
					ids.menuLeft,
					CommonKeys(this.facialExpressions).sort().map(group => ElementButton.Create(
						`${ids.menuLeft}-${group}`,
						this.eventListeners._expressionRadioGroupClick,
						{ role: "menuitemradio", image: `Icons/Expressions/${group}/Default.png` },
						{ button: {
							classList: ["dialog-menubar-button"],
							attributes: {
								name: group,
								"aria-expanded": "false",
								"aria-owns": `${ids.grid}-${group}`,
								"aria-label": AssetGroupGet("Female3DCG", group)?.Description,
							},
						}},
					)),
					{ direction: "rtl" },
					{ menu: { attributes: { "aria-orientation": "vertical" } } },
				),
				...expressionEntries.sort(([group1], [group2]) => {
					return group1.localeCompare(group2);
				}).map(([group, expressions]) => {
					return {
						tag: /** @type {const} */("div"),
						classList: ["dialog-grid", "dialog-expression-grid", "scroll-box"],
						attributes: {
							hidden: true,
							id: `${ids.grid}-${group}`,
							role: "radiogroup",
							"aria-required": "true",
							"aria-label": AssetGroupGet("Female3DCG", group)?.Description,
						},
						dataAttributes: { name: group },
					};
				}),
				{ tag: "div", attributes: { id: ids.grid } },
			],
		});
	}

	/** @type {DialogMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, parameters, options) {
		const textContent = options.status ?? InterfaceTextGet("FacialExpression");
		DialogSetStatus(textContent, options.statusTimer ?? 0, null, span.id);
	}

	/** @type {DialogMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, _buttonGrid, parameters, options) {
		const { C } = parameters;
		for (const buttonGrid of root.querySelectorAll(".dialog-grid")) {
			const owningButton = root.querySelector(`[aria-owns="${buttonGrid.id}"]`);
			const group = /** @type {Exclude<ExpressionGroupName, "Eyes2">} */(buttonGrid.getAttribute("data-name"));
			const expressions = this.facialExpressions[group];
			const expressionItem = InventoryGet(C, group);
			const currentExpression = C.ActiveExpression[group] ?? null;
			if (!expressions || !owningButton || !expressionItem || !expressions.includes(currentExpression)) {
				continue;
			}

			if (options.reset) {
				buttonGrid.innerHTML = "";
				buttonGrid.replaceChildren(...expressions.map((name, i) => ElementButton.Create(
					`${this.ids.grid}-${group}-${name}`,
					this.eventListeners._ClickButton,
					{
						clickDisabled: this.eventListeners._ClickDisabledButton,
						role: "radio",
						image: `Icons/Expressions/${group}/${name || "Default"}.png`,
						allowRequiredClick: true,
					},
					{ button: {
						classList: ["dialog-menubar-button"],
						attributes: {
							name,
							tabindex: i === 0 ? 0 : -1,
							"aria-checked": i === 0,
							"aria-label": name ?? "None",
						},
						dataAttributes: { group },
					}},
				)));
			}

			const buttons = /** @type {NodeListOf<HTMLButtonElement>} */(buttonGrid.querySelectorAll("button[role='radio']"));
			for (const button of buttons) {
				/** @type {ExpressionPair} */
				const expressionObj = {
					Group: group,
					Expression: /** @type {null | ExpressionName} */(button.name || null),
				};

				const status = this.GetClickStatus(C, expressionObj, expressionItem);
				if (status) {
					button.setAttribute("aria-disabled", "true");
				} else {
					button.removeAttribute("aria-disabled");
				}

				if (expressionObj.Expression === currentExpression) {
					button.setAttribute("aria-checked", "true");
					button.setAttribute("tabindex", "0");
					const src = ElementButton.GetImage(button);
					if (src != null) {
						ElementButton.SetImage(owningButton, src);
					}
				} else {
					button.setAttribute("aria-checked", "false");
					button.setAttribute("tabindex", "-1");
				}
			}

			if (group === "Pussy") {
				owningButton.toggleAttribute("hidden", !C.HasPenis());
			}

			if (options.resetScrollbar && !buttonGrid.hasAttribute("hidden")) {
				buttonGrid.querySelector(`[role="radio"][aria-checked='true']`)?.scrollIntoView({ behavior: "instant" });
			}
		}
	}

	/** @type {_DialogSelfMenu<ModeType, ExpressionPair>["_ReloadMenubar"]} */
	_ReloadMenubar(root, menubar, { C }, options) {
		const button = /** @type {null | HTMLButtonElement} */(document.getElementById(`${this.ids.menubar}-blink`));
		const eyeLeft = InventoryGet(C, "Eyes")?.Property?.Expression;
		const eyeRight = InventoryGet(C, "Eyes2")?.Property?.Expression;
		if (!button) {
			return;
		}

		let level = 1;
		let state = "None";
		defaultState: if (eyeLeft == C.ActiveExpression.Eyes && eyeRight == C.ActiveExpression.Eyes2) {
			break defaultState;
		} else if ((eyeLeft !== "Closed" || eyeLeft == C.ActiveExpression.Eyes) && eyeRight === "Closed") {
			level = 2;
			state = "Left";
		} else if ((eyeRight !== "Closed" || eyeRight == C.ActiveExpression.Eyes2) && eyeLeft === "Closed") {
			level = 4;
			state = "Right";
		} else {
			level = 3;
			state = "Both";
		}
		button.setAttribute("aria-valuenow", level);
		button.setAttribute("aria-valuetext", state);
		ElementButton.SetImage(button, `Icons/Wink${state}.png`);
	}

	/** @type {DialogMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, parameters, options) { /** noop */ }

	/** @type {DialogMenu<string, ExpressionPair>["_GetClickedObject"]} */
	_GetClickedObject(button) {
		const group = /** @type {undefined | Exclude<ExpressionGroupName, "Eyes2">} */(button.dataset.group);
		const name = /** @type {null | ExpressionName} */(button.name || null);
		return group ? { Group: group, Expression: name } : null;
	}

	/** @type {DialogMenu<string, ExpressionPair>["_ClickButton"]} */
	_ClickButton(button, C, clickedObj, equippedItem) {
		if (equippedItem?.Property?.Expression === clickedObj.Expression) {
			return;
		}

		CharacterSetFacialExpression(C, clickedObj.Group, clickedObj.Expression);
		C.ActiveExpression.setWithoutReload(clickedObj.Group, clickedObj.Expression);

		const thisImg = ElementButton.GetImage(button);
		const controller = document.querySelector(`#${this.ids.menuLeft} [role="menuitemradio"][name="${clickedObj.Group}"]`);
		if (thisImg != null && controller) {
			ElementButton.SetImage(controller, thisImg);
		}

		// Reset the blinking button if the eyes aren't open
		const blinkButton = document.querySelector(`#${this.ids.menubar} [name="blink"]`);
		if (blinkButton && blinkButton.getAttribute("aria-valuenow") !== "1") {
			blinkButton.setAttribute("aria-valuenow", "1");
			blinkButton.setAttribute("aria-valuetext", "None");
			ElementButton.SetImage(blinkButton, "Icons/WinkNone.png");
		}
	}
}

/**
 * @template {DialogSelfMenuName} ModeType
 * @extends {_DialogSelfMenu<ModeType, Pose>}
 */
class _DialogPoseMenu extends _DialogSelfMenu {
	ids = Object.freeze({
		root: "dialog-pose",
		status: "dialog-pose-status",
		menubar: "dialog-pose-menubar",
		grid: "dialog-pose-button-grid",
	});

	/** @satisfies {DialogMenu<ModeType, Pose>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {
		PoseAvailable(C, pose) {
			const available = PoseAvailable(C, pose.Category, pose.Name);
			return available ? null : InterfaceTextGet(`PrerequisiteCannot${pose.Name}`);
		},
		ChatRoomOwnerPresenceRule(C, pose) {
			return (C.IsPlayer() && ChatRoomOwnerPresenceRule("BlockChangePose", C)) ? InterfaceTextGet("OwnerBlockChangePose") : null;
		},
	};

	/**
	 * See {@link poses}
	 * @private
	 * @type {null | Readonly<Partial<Record<AssetPoseCategory, readonly Pose[]>>>}
	 */
	_poses = null;

	/**
	 * An object mapping all (potentially) button-valid pose categories to their respective poses.
	 * @type {Readonly<Partial<Record<AssetPoseCategory, readonly Pose[]>>>}
	 */
	get poses() {
		if (this._poses == null) {
			/** @type {Partial<Record<AssetPoseCategory, Pose[]>>} */
			const poses = {};
			for (const pose of PoseFemale3DCG) {
				if (pose.AllowMenu || pose.AllowMenuTransient) {
					(poses[pose.Category] ??= []).push(pose);
				}
			}
			return this._poses = poses;
		} else {
			return this._poses;
		}
	}

	/**
	 * @param {ModeType} mode The name of the mode associated with this instance
	 */
	constructor(mode) {
		super(mode);
		this.eventListeners = {
			...this.eventListeners,

			/** @type {(this: HTMLButtonElement, ev: PointerEvent) => void} */
			_clickPoseMutuallyExclusive: function(ev) {
				const parent = this.closest(".dialog-grid");
				if (!parent) {
					ev.stopImmediatePropagation();
					return;
				}

				// Disable the `BodyFull` poses if a `BodyUpper`/`BodyLower` pose is selected and vice versa
				const category = this.getAttribute("data-group");
				if (category === "BodyFull") {
					parent.querySelectorAll(".dialog-pose-grid:not([data-name='BodyFull']) > [role='radio']").forEach((button) => {
						button.setAttribute("aria-checked", "false");
						button.setAttribute("tabindex", button.previousElementSibling ? "-1" : "0");
					});
				} else {
					parent.querySelectorAll(".dialog-pose-grid[data-name='BodyFull'] > [role='radio']").forEach((button) => {
						button.setAttribute("aria-checked", "false");
						button.setAttribute("tabindex", button.previousElementSibling ? "-1" : "0");
					});
					parent.querySelectorAll(".dialog-pose-grid:not([data-name='BodyFull'])").forEach(radiogrid => {
						if (!radiogrid.querySelector("[role='radio'][aria-checked='true']")) {
							radiogrid.querySelectorAll("[role='radio']").forEach((button, i) => {
								button.setAttribute("aria-checked", i === 0 ? "true" : "false");
								button.setAttribute("tabindex", i === 0 ? "0" : "-1");
							});
						}
					});
				}
			}
		};
	}

	_Load() {
		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			attributes: { id: ids.root, "aria-labelledby": ids.status },
			parent: document.body,
			classList: ["dialog-root", "dialog-self-menu-root"],
			children: [
				{
					tag: "span",
					attributes: { id: ids.status },
					classList: ["dialog-status", "scroll-box"],
				},
				ElementMenu.Create(
					ids.menubar,
					[
						ElementButton.Create(
							`${ids.menubar}-next`,
							this.eventListeners._ClickMenuButton,
							{ tooltip: InterfaceTextGet("NextPage"), tooltipPosition: "right", image: "Icons/Next.png", clickDisabled: this.eventListeners._ClickDisabledMenuButton },
							{ button: { attributes: { name: "next" }, classList: ["dialog-menubar-button"] } },
						),
					],
					{ direction: "rtl" },
					{ menu: { classList: ["dialog-self-menu-menubar"] } },
				),
				{
					tag: "div",
					attributes: { id: ids.grid },
					classList: ["dialog-grid", "scroll-box"],
					children: CommonKeys(this.poses).map((category) => {
						return {
							tag: /** @type {const} */("div"),
							classList: ["dialog-pose-grid"],
							attributes: {
								id: `${ids.grid}-${category}`,
								role: "radiogroup",
								"aria-required": "true",
							},
							dataAttributes: { name: category },
						};
					}),
				},
			],
		});
	}

	/** @type {DialogMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, parameters, options) {
		const textContent = options.status ?? InterfaceTextGet("PoseMenu");
		DialogSetStatus(textContent, options.statusTimer ?? 0, null, this.ids.status);
	}

	/** @type {DialogMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, parameters, options) {
		const { C } = parameters;
		for (const poseGrid of buttonGrid.querySelectorAll(".dialog-pose-grid")) {
			const poseCategory = /** @type {AssetPoseCategory} */(poseGrid.getAttribute("data-name"));
			const poses = this.poses[poseCategory];
			if (!poses) {
				continue;
			}

			if (options.reset) {
				poseGrid.innerHTML = "";
				poseGrid.replaceChildren(...poses.map((pose, i) => {
					const button = ElementButton.Create(
						`${this.ids.grid}-${pose.Category}-${pose.Name}`,
						this.eventListeners._ClickButton,
						{
							clickDisabled: this.eventListeners._ClickDisabledButton,
							role: "radio",
							image: `Icons/Poses/${pose.Name}.png`,
							allowRequiredClick: true,
						},
						{ button: {
							classList: ["dialog-menubar-button"],
							attributes: {
								name: pose.Name,
								tabindex: -1,
								"aria-checked": "false",
							},
							dataAttributes: { group: pose.Category },
						}},
					);
					button.addEventListener("click", this.eventListeners._clickPoseMutuallyExclusive);
					return button;
				}));
			}

			let activePose = C.ActivePoseMapping[poseCategory];
			if (!activePose && !C.ActivePoseMapping.BodyFull) {
				switch (poseCategory) {
					case "BodyUpper":
						activePose = "BaseUpper";
						break;
					case "BodyLower":
						activePose = "BaseLower";
						break;
				}
			}

			for (const [i, button] of poseGrid.querySelectorAll("[role='radio']").entries()) {
				const pose = poses[i];
				if (!pose) {
					break;
				}

				const status = this.GetClickStatus(C, pose, null);
				if (status) {
					button.setAttribute("aria-disabled", "true");
				} else {
					button.removeAttribute("aria-disabled");
				}

				if (!activePose) {
					button.setAttribute("tabindex", (i === 0).toString());
					button.setAttribute("aria-checked", "false");
				} else if (activePose === pose.Name) {
					button.setAttribute("tabindex", "0");
					button.setAttribute("aria-checked", "true");
				} else {
					button.setAttribute("tabindex", "-1");
					button.setAttribute("aria-checked", "false");
				}
			}
		}

		if (options.resetScrollbar) {
			buttonGrid.scrollTo({ top: 0, behavior: "instant" });
		}
	}

	/** @type {DialogMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, parameters, options) { /** noop */ }

	/** @type {DialogMenu<string, Pose>["_GetClickedObject"]} */
	_GetClickedObject(button) {
		const category = /** @type {null | AssetPoseCategory} */(button.getAttribute("data-group"));
		const name = /** @type {null | AssetPoseName} */(button.name || null);
		return Pose.find(p => p.Name === name && p.Category === category) ?? null;
	}

	/** @type {DialogMenu<string, Pose>["_ClickButton"]} */
	_ClickButton(button, C, pose) {
		if (C.PoseMapping[pose.Category] === pose.Name) {
			return;
		}

		PoseSetActive(C, pose.Name, undefined, false);
		if (CurrentScreen === "ChatRoom") {
			ServerSend("ChatRoomCharacterPoseUpdate", { Pose: C.ActivePose });
		}
	}
}

/**
 * @template {DialogSelfMenuName} ModeType
 * @extends {_DialogSelfMenu<ModeType, number>}
 */
class _DialogSavedExpressionsMenu extends _DialogSelfMenu {
	ids = Object.freeze({
		root: "dialog-expression-preset",
		status: "dialog-expression-preset-status",
		menubar: "dialog-expression-preset-menubar",
		grid: "dialog-expression-preset-button-grid",
	});

	/** @type {DialogMenu<ModeType, number>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {};

	/**
	 * See {@link expressionPreviews}
	 * @private
	 * @type {null | (null | Character)[]}
	 */
	_expressionPreviews = null;

	/**
	 * @type {readonly (null | Character)[]}
	 */
	get expressionPreviews() {
		if (this._expressionPreviews == null) {
			return this._expressionPreviews = DialogBuildSavedExpressionsMenu();
		} else {
			return this._expressionPreviews;
		}
	}

	Draw() {
		const root = document.getElementById(this.ids.root);
		if (!root || root.hasAttribute("hidden")) {
			return;
		}

		for (const [i, preview] of this.expressionPreviews.entries()) {
			const canvas = /** @type {null | HTMLCanvasElement} */(root.querySelector(`li[data-index="${i}"] > canvas`))?.getContext("2d");
			if (!canvas) {
				continue;
			}

			canvas.clearRect(0, 0, 200, 200);
			if (preview != null) {
				const canvasSegment = DrawCharacterSegment(preview, 150, 30, 200, 200);
				canvas.drawImage(canvasSegment, 0, 0, 200, 200);
			}
		}
	}

	Exit() {
		super.Exit();
		for (const C of this.expressionPreviews) {
			if (C) {
				CharacterDelete(C, false);
			}
		}
	}

	_Load() {
		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			attributes: { id: ids.root, "aria-labelledby": ids.status },
			parent: document.body,
			classList: ["dialog-root", "dialog-self-menu-root"],
			children: [
				{
					tag: "span",
					attributes: { id: ids.status },
					classList: ["dialog-status", "scroll-box"],
				},
				ElementMenu.Create(
					ids.menubar,
					[
						ElementButton.Create(
							`${ids.menubar}-next`,
							this.eventListeners._ClickMenuButton,
							{ tooltip: InterfaceTextGet("NextPage"), tooltipPosition: "right", image: "Icons/Next.png", clickDisabled: this.eventListeners._ClickDisabledMenuButton },
							{ button: { attributes: { name: "next" }, classList: ["dialog-menubar-button"] } },
						),
					],
					{ direction: "rtl" },
					{ menu: { classList: ["dialog-self-menu-menubar"] } },
				),
				{
					tag: "menu",
					attributes: { id: ids.grid },
					classList: ["dialog-grid", "scroll-box"],
					children: [0, 1, 2, 3, 4].map(i => {
						return {
							tag: "li",
							dataAttributes: { index: i },
							classList: ["dialog-expression-preset-slot"],
							children: [
								{ tag: "canvas", attributes: { width: 200, height: 200 } },
								ElementButton.Create(
									`${ids.grid}-${i}-save`,
									this.eventListeners._ClickButton,
									{ clickDisabled: this.eventListeners._ClickDisabledButton, label: "Save", labelPosition: "center" },
									{ button: {
										attributes: { name: "save" },
									}},
								),
								ElementButton.Create(
									`${ids.grid}-${i}-load`,
									this.eventListeners._ClickButton,
									{ clickDisabled: this.eventListeners._ClickDisabledButton, label: "Load", labelPosition: "center" },
									{ button: {
										attributes: { name: "load" },
									}}
								),
							],
						};
					}),
				},
			],
		});
	}

	/** @type {DialogMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, parameters, options) {
		const textContent = options.status ?? InterfaceTextGet("SavedExpressions");
		DialogSetStatus(textContent, options.statusTimer ?? 0, null, this.ids.status);
	}

	/** @type {DialogMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, parameters, options) {
		this._expressionPreviews = DialogBuildSavedExpressionsMenu();
	}

	/** @type {DialogMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, parameters, options) { /** noop */ }

	/** @type {DialogMenu<string, number>["_GetClickedObject"]} */
	_GetClickedObject(button) {
		const slot = Number.parseInt(button.closest("li")?.getAttribute("data-index") ?? "", 10);
		return Number.isNaN(slot) ? null : slot;
	}

	/** @type {DialogMenu<string, number>["_ClickButton"]} */
	_ClickButton(button, C, expressionSlot) {
		switch (button.name) {
			case "save": {
				const expressions = C.Appearance.filter(item => item.Asset.Group.AllowExpression).map(item => {
					return {
						Group: /** @type {ExpressionGroupName} */(item.Asset.Group.Name),
						CurrentExpression: item.Property?.Expression,
					};
				});
				Player.SavedExpressions[expressionSlot] = expressions.every(i => i.CurrentExpression == null) ? null : expressions;
				ServerAccountUpdate.QueueData({ SavedExpressions: Player.SavedExpressions });
				this._expressionPreviews = DialogBuildSavedExpressionsMenu();
				break;
			}
			case "load":
				DialogFacialExpressionsLoad(expressionSlot);
				break;
		}
	}
}

/**
 * @template {DialogSelfMenuName} ModeType
 * @extends {_DialogSelfMenu<ModeType, null>}
 */
class _DialogOwnerRulesMenu extends _DialogSelfMenu {
	ids = Object.freeze({
		root: "dialog-owner-rules",
		status: "dialog-owner-rules-status",
		menubar: "dialog-owner-rules-menubar",
		grid: "dialog-owner-rules-grid",
		empty: "dialog-owner-rules-empty",
	});

	/** @type {DialogMenu<ModeType, null>["clickStatusCallbacks"]} */
	clickStatusCallbacks = {};

	/** @type {_DialogSelfMenu["IsAvailable"]} */
	IsAvailable(C) {
		return !!C.IsOwned() || C.Lovership.length !== 0;
	}

	_Load() {
		const ids = this.ids;
		return document.getElementById(ids.root) ?? ElementCreate({
			tag: "div",
			attributes: { id: ids.root, "aria-labelledby": ids.status },
			parent: document.body,
			classList: ["dialog-root", "dialog-self-menu-root"],
			children: [
				{
					tag: "span",
					attributes: { id: ids.status },
					classList: ["dialog-status", "scroll-box"],
				},
				ElementMenu.Create(
					ids.menubar,
					[
						ElementButton.Create(
							`${ids.menubar}-next`,
							this.eventListeners._ClickMenuButton,
							{ tooltip: InterfaceTextGet("NextPage"), tooltipPosition: "right", image: "Icons/Next.png", clickDisabled: this.eventListeners._ClickDisabledMenuButton },
							{ button: { attributes: { name: "next" }, classList: ["dialog-menubar-button"] } },
						),
					],
					{ direction: "rtl" },
					{ menu: { classList: ["dialog-self-menu-menubar"] } },
				),
				{
					tag: "ul",
					attributes: { id: ids.grid },
					classList: ["dialog-grid", "scroll-box"],
				},
			],
		});
	}

	/** @type {DialogMenu["_ReloadStatus"]} */
	_ReloadStatus(root, span, parameters, options) {
		const textContent = options.status ?? InterfaceTextGet("RulesMenu");
		DialogSetStatus(textContent, options.statusTimer ?? 0, null, this.ids.status);
	}

	/** @type {DialogMenu["_ReloadButtonGrid"]} */
	_ReloadButtonGrid(root, buttonGrid, parameters, options) {
		/** @satisfies {[name: LogNameType[LogGroupType], group: LogGroupType, logValue?: boolean][]} */
		const rules = /** @type {const} */([
			["BlockOwnerLockSelf", "OwnerRule"],
			["BlockChange", "OwnerRule", true],
			["BlockWhisper", "OwnerRule"],
			["BlockKey", "OwnerRule"],
			["BlockFamilyKey", "OwnerRule"],
			["BlockRemote", "OwnerRule"],
			["BlockRemoteSelf", "OwnerRule"],
			["ReleasedCollar", "OwnerRule"],
			["BlockNickname", "OwnerRule"],
			["BlockLoverLockSelf", "LoverRule"],
			["BlockLoverLockOwner", "LoverRule"],
		]);

		const children = rules.map(([name, group, logValue]) => {
			const val = LogValue(name, group);
			if (val === null || val === undefined) {
				return null;
			} else {
				return ElementCreate({
					tag: "li",
					dataAttributes: { name, group },
					children: [
						InterfaceTextGet(`RulesMenu${name}`),
						(logValue ? ` ${TimerToString(val - CurrentTime)}` : null),
					],
				});
			}
		}).filter(Boolean);
		if (!children.length) {
			children.push(ElementCreate({
				tag: "li",
				children: [InterfaceTextGet("RulesMenuEmpty")],
			}));
		}

		buttonGrid.replaceChildren(...children);
	}

	/** @type {DialogMenu["_ReloadIcon"]} */
	_ReloadIcon(root, icon, parameters, options) { /** noop */ }

	/** @type {DialogMenu<string, null>["_GetClickedObject"]} */
	_GetClickedObject(button) { return null; /** noop */ }

	/** @type {DialogMenu<string, null>["_ClickButton"]} */
	_ClickButton(button, C, expressionSlot) { /** noop */ }
}


/** @satisfies {Partial<Record<DialogMenuMode, DialogMenu<DialogMenuMode>>>} */
var DialogMenuMapping = /** @type {const} */({
	activities: new _DialogActivitiesMenu("activities"),
	crafted: new _DialogCraftedMenu("crafted"),
	dialog: new _DialogDialogMenu("dialog"),
	items: new _DialogItemMenu("items"),
	locked: new _DialogItemMenu("locked"),
	locking: new _DialogLockingMenu("locking"),
	permissions: new _DialogPermissionMenu("permissions"),
});

/** @satisfies {Record<DialogSelfMenuName, _DialogSelfMenu>} */
var DialogSelfMenuMapping = /** @type {const} */({
	Expression: new _DialogExpressionMenu("Expression"),
	Pose: new _DialogPoseMenu("Pose"),
	SavedExpressions: new _DialogSavedExpressionsMenu("SavedExpressions"),
	OwnerRules: new _DialogOwnerRulesMenu("OwnerRules"),
});

/**
 * @param {null | DialogMenuMode} mode
 * @returns {undefined | DialogMenu<DialogMenuMode>}
 */
function DialogGetMenu(mode) {
	if (!mode) {
		return;
	}
	return /** @type {Partial<Record<DialogMenuMode, DialogMenu<DialogMenuMode>>>} */ (DialogMenuMapping)[mode];
}

/**
 * @param {null | DialogSelfMenuName} mode
 * @returns {undefined | _DialogSelfMenu}
 */
function DialogGetSelfMenu(mode) {
	if (!mode) {
		return;
	}
	return DialogSelfMenuMapping[mode];
}

/**
 * Searches in the dialog for a specific stage keyword and returns that dialog option if we find it, error otherwise
 * @param {string} KeyWord - The key word to search for
 * @returns {string}
 */
function DialogFindPlayer(KeyWord) {
	const res = PlayerDialog.get(KeyWord);
	return res !== undefined ? res : `${TEXT_NOT_FOUND_PREFIX} "DialogPlayer.csv": ${KeyWord}`;
}

/**
 * Searches in the dialog for a specific stage keyword and returns that dialog option if we find it
 * @param {Character} C - The character whose dialog option*
 * @param {string} KeyWord1 - The key word to search for
 * @param {string | null} [KeyWord2] - An optionally given second key word. is only looked for, if specified and the first
 * keyword was not found.
 * @param {boolean} [ReturnPrevious] - If specified, returns the previous dialog, if neither of the the two key words were found
 ns should be searched
 * @returns {string} - The name of a dialog. That can either be the one with the keyword or the previous dialog.
 * An empty string is returned, if neither keyword was found and no previous dialog was given.
 */
function DialogFind(C, KeyWord1, KeyWord2, ReturnPrevious = true) {
	for (let D = 0; D < C.Dialog.length; D++)
		if (C.Dialog[D].Stage == KeyWord1)
			return C.Dialog[D].Result?.trim() ?? "";
	if (KeyWord2 != null)
		for (let D = 0; D < C.Dialog.length; D++)
			if (C.Dialog[D].Stage == KeyWord2)
				return C.Dialog[D].Result?.trim() ?? "";
	return ((ReturnPrevious == null) || ReturnPrevious) ? C.CurrentDialog : "";
}

/**
 * Searches in the dialog for a specific stage keyword and returns that dialog option if we find it and replace the names
 * @param {Character} C - The character whose dialog options should be searched
 * @param {string} KeyWord1 - The key word to search for
 * @param {string} [KeyWord2] - An optionally given second key word. is only looked for, if specified and the first
 * keyword was not found.
 * @param {boolean} [ReturnPrevious] - If specified, returns the previous dialog, if neither of the the two key words were found
 * @returns {string} - The name of a dialog. That can either be the one with the keyword or the previous dialog.
 * An empty string is returned, if neither keyword was found and no previous dialog was given. 'SourceCharacter'
 * is replaced with the player's name and 'DestinationCharacter' with the current character's name.
 */
function DialogFindAutoReplace(C, KeyWord1, KeyWord2, ReturnPrevious) {
	const line = DialogFind(C, KeyWord1, KeyWord2, ReturnPrevious);
	const current = CharacterGetCurrent();
	if (!current) return line;
	return line
		.replace("SourceCharacter", CharacterNickname(Player))
		.replace("DestinationCharacter", CharacterNickname(current));
}

/**
 * Draw the up/down arrow to bump a character up and down if they're hidden.
 */
function DialogDrawRepositionButton() {
	if (!CurrentCharacter || !CurrentCharacter.FocusGroup) return;

	let drawButton = "";
	if (CharacterAppearanceForceUpCharacter == CurrentCharacter.MemberNumber) {
		drawButton = "Icons/Remove.png";
	} else if (CurrentCharacter.HeightModifier < -90) {
		drawButton = CurrentCharacter.IsInverted() ? "Icons/Down.png" : "Icons/Up.png";
	} else if (CurrentCharacter.HeightModifier > 30) {
		drawButton = CurrentCharacter.IsInverted() ? "Icons/Up.png" : "Icons/Down.png";
	}
	if (drawButton)
		DrawButton(510, 50, 90, 90, "", "White", drawButton, InterfaceTextGet("ShowAllZones"));
}

/**
 * Draws the top menu buttons of the current dialog.
 *
 * @param {Character} C The character currently focused.
 */
function DialogDrawTopMenu(C) {
	if (!C.FocusGroup) return;
	const FocusItem = InventoryGet(C, C.FocusGroup.Name);

	for (let I = DialogMenuButton.length - 1; I >= 0; I--) {
		const ButtonColor = DialogGetMenuButtonColor(DialogMenuButton[I]);
		const ButtonImage = DialogGetMenuButtonImage(DialogMenuButton[I], FocusItem);
		const ButtonHoverText = InterfaceTextGet(`DialogMenu${DialogMenuButton[I]}`);
		const ButtonDisabled = DialogIsMenuButtonDisabled(DialogMenuButton[I]);
		DrawButton(1885 - I * 110, 15, 90, 90, "", ButtonColor, "Icons/" + ButtonImage + ".png", ButtonHoverText, ButtonDisabled);
	}
}

var DialogFocusGroup = {
	/**
	 *
	 * @param {string} id - The ID for the to-be created focus group grid
	 * @param {(this: HTMLButtonElement, ev: PointerEvent) => any} clickListener - The listener to-be executed upon selecting a group; the group name can be retrieved from `this.name`
	 * @param {null | { required?: boolean, useDynamicGroupName?: boolean }} options - Further options for the to-be created focus group grid
	 * @returns {HTMLElement} - The created element
	 */
	Create(id, clickListener, options=null) {
		options ??= {};
		const root = document.getElementById(id);
		if (root) {
			console.error(`Element "${id}" already exists`);
			return root;
		}

		let top = Infinity;
		let bottom = 0;
		let left = Infinity;
		let right = 0;

		/** @type {{ group: AssetGroup, index: number, zone: RectTuple }[]} */
		const grid = [];
		for (const group of AssetGroup) {
			for (const [index, zone] of (group.Zone ?? []).entries()) {
				grid.push({ group, index, zone});
				left = Math.min(left, zone[0]);
				right = Math.max(right, zone[0] + zone[2]);
				top = Math.min(top, zone[1]);
				bottom = Math.max(bottom, zone[1] + zone[3]);
			}
		}
		grid.sort((a, b) => (a.zone[1] - b.zone[1]) || (a.zone[0] - b.zone[0]));

		const width = right - left;
		const height = bottom - top;

		const children = grid.map(({ group, index, zone }, i) => ElementButton.Create(
			`${id}-${group.Name}-${index}`,
			clickListener,
			{ noStyling: true, role: "radio" },
			{ button: {
				attributes: {
					name: options.useDynamicGroupName ? group.DynamicGroupName : group.Name,
					tabindex: i === 0 ? 0 : -1,
					"aria-hidden": index !== 0 ? "true" : undefined,
					"aria-label": group.Description,
				},
				style: {
					left: `${100 * (zone[0] - left) / width}%`,
					top: `${100 * (zone[1] - top) / height}%`,
					width: `${100 * (zone[2] / width)}%`,
					height: `${100 * (zone[3] / height)}%`,
				},
			}},
		));

		return ElementCreate({
			tag: "div",
			attributes: { id },
			classList: ["dialog-focus-grid"],
			children: [{
				tag: "div",
				children,
				attributes: {
					id: `${id}-radiogroup`,
					role: "radiogroup",
					"aria-required": options.required ? "true" : "false",
					"aria-label": "Select focus group",
				},
			}],
		});
	},
};

/**
 * Load function for starting the Dialog subscreen.
 * @returns {void}
 */
function DialogLoad() {
	if (CurrentCharacter == null) {
		return;
	}
	const C = CurrentCharacter;

	const newDialog = !Player.CanTalk() ? DialogFind(C, "PlayerGagged", "") : DialogIntro(C);
	if (newDialog) {
		C._CurrentDialog = newDialog;
	}

	if (C.IsPlayer()) {
		DialogSelfMenuMapping[DialogSelfMenuSelected ?? "Expression"]?.Init({ C });
	}
	DialogChangeMode(DialogMenuMode ?? "dialog", true);
}

/**
 * Draws the initial Dialog screen.
 *
 * This is the main handler for drawing the Dialog UI, which activates
 * when the player clicks on herself or another player.
 *
 * @type {ScreenDrawHandler}
 */
function DialogDraw() {
	// Check that there's actually a character selected
	if (!CurrentCharacter) return;
	if (ControllerIsActive()) {
		ControllerClearAreas();
	}

	// Draw both the player and the interaction character
	if (!CurrentCharacter.IsPlayer())
		DrawCharacter(Player, 0, 0, 1);
	DrawCharacter(CurrentCharacter, 500, 0, 1);

	const C = CharacterGetCurrent();

	// Drawing the character causes ScriptDraw hooks to be called, some of which
	// can cause the dialog to close (like the Futuristic Training Belt)
	if (!C) return;
	CharacterCheckHooks(C, true);

	// Block out drawing anything else if we're not supposed to interact with the selected character
	if (
		(C.FocusGroup === null && DialogMenuMode !== "dialog")
		|| !C.AllowItem
	) return;

	/** The item currently sitting in the focused group */
	const FocusItem = InventoryGet(C, C.FocusGroup?.Name);

	// Draws the top menu text & icons
	if (DialogMenuMode && !["extended", "tighten", "colorDefault", "colorExpression", "colorItem", "layering", "dialog"].includes(DialogMenuMode))
		DialogDrawTopMenu(C);

	// If the player is struggling or lockpicking
	if (DialogMenuMode === "struggle") {
		if (StruggleMinigameDraw(C)) {
			// Minigame running and drawn
		} else {

			// Draw previews for the assets we're swapping/struggling
			if (DialogStrugglePrevItem && DialogStruggleNextItem) {
				DrawItemPreview(DialogStrugglePrevItem, C, 1200, 100);
				DrawItemPreview(DialogStruggleNextItem, C, 1200, 100);
			} else if (DialogStrugglePrevItem || DialogStruggleNextItem) {
				const item = /** @type {Item} */ (DialogStrugglePrevItem ?? DialogStruggleNextItem);
				DrawItemPreview(item, C, 1387, 100);
			}

			// Draw UI to select struggling minigame
			DrawText(InterfaceTextGet("ChooseStruggleMethod"), 1500, 500, "White", "Black");
			for (const [idx, [game, data]] of StruggleGetMinigames().entries()) {
				const offset = 300 * idx;
				const hover = MouseIn(1087 + offset, 550, 225, 275);
				const disabled = data.DisablingCraftedProperty ? (DialogStrugglePrevItem?.Craft?.Effects?.[data.DisablingCraftedProperty] ?? 0) > 0 : false;
				const bgColor = disabled ? "Gray" : (hover ? "aqua" : "white");
				DrawRect(1087 + offset, 550, 225, 275, bgColor);
				DrawImageResize("Icons/Struggle/" + game + ".png", 1089 + offset, 552, 221, 221);
				DrawTextFit(InterfaceTextGet(`Struggle${game}`), 1200 + offset, 800, 221, "black");
			}

			// In online chat rooms, there's a fourth "Chat Room Struggle" option
			if (CurrentScreen === "ChatRoom") {
				DrawButton(1300, 880, 400, 65, InterfaceTextGet("ChatRoomStruggleButton"), "White");
			}

		}
		return;
	}

	if (DialogMenuMode === "extended") {
		if (DialogFocusItem) {
			CommonDynamicFunction("Inventory" + DialogFocusItem.Asset.Group.Name + DialogFocusItem.Asset.Name + "Draw()");
			DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
			return;
		} else {
			DialogLeaveFocusItem(true);
		}
	} else if (DialogMenuMode === "tighten") {
		if (DialogTightenLoosenItem) {
			TightenLoosenItemDraw(DialogTightenLoosenItem);
			return;
		} else {
			DialogChangeMode("items");
		}
	} else if ((DialogMenuMode === "colorItem" || DialogMenuMode === "colorExpression") && FocusItem) {
		ItemColorDraw(C, FocusItem.Asset.Group.Name, 1090, 15, 885, 970);
		return;
	} else if (DialogMenuMode === "colorDefault") {
		return;
	}

	// Draw a repositioning button if some zones are offscreen
	DialogDrawRepositionButton();

	DialogGetMenu(DialogMenuMode)?.Draw();
	DialogGetSelfMenu(DialogSelfMenuSelected)?.Draw();
}

/**
 * Sets the current character sub menu to the owner rules
 * @returns {void} - Nothing
 */
function DialogViewOwnerRules() {
	DialogFindSubMenu("OwnerRules", true);
}

/**
 * Sets the skill ratio for the player, will be a % of effectiveness applied to the skill when using it.
 * This way a player can use only a part of her bondage or evasion skill.
 * @param {SkillType} SkillType - The name of the skill to influence
 * @param {string} NewRatio - The ratio of this skill that should be used
 * @returns {void} - Nothing
 */
function DialogSetSkillRatio(SkillType, NewRatio) {
	SkillSetRatio(Player, SkillType, parseInt(NewRatio) / 100);
}

/**
 * Leave the dialog and revert back to a safe state, when the player uses her safe word
 * @returns {void} - Nothing
 */
function DialogChatRoomSafewordRevert() {
	DialogLeave();
	ChatRoomSafewordRevert();
}

/**
 * Leave the dialog and release the player of all restraints before returning them to the Main Lobby
 * @returns {void} - Nothing
 */
function DialogChatRoomSafewordRelease() {
	DialogLeave();
	ChatRoomSafewordRelease();
}

/**
 * Close the dialog and switch to the crafting screen.
 * @returns {void} - Nothing
 */
function DialogOpenCraftingScreen() {
	const FromChatRoom = (CurrentScreen === "ChatRoom");
	DialogLeave({ reload: false });
	CraftingShowScreen(FromChatRoom);
}

/**
 * Check whether it's possible to access the crafting interface.
 * @returns {boolean}
 */
function DialogCanCraft() {
	if ((CurrentModule != "Online") || (CurrentScreen != "ChatRoom")) return false;
	return !Player.IsRestrained() || !Player.IsBlind();
}

/**
 * Provides a group's real name for male characters
 *
 * @param {Character} C
 * @param {AssetGroup} G
 */
function DialogActualNameForGroup(C, G) {
	let repl = G.Description;
	if (C && C.HasPenis() && ["ItemVulva", "ItemVulvaPiercings"].includes(G.Name)) {
		repl = G.Name === "ItemVulva" ? InterfaceTextGet("DialogGroupNameItemPenis") : InterfaceTextGet("DialogGroupNameItemGlans");
	}
	return repl;
}

/**
 * Propose one of the struggle minigames or start one automatically.
 *
 * This function checks the difficulty of the current struggle attempt and
 * either use the Strength minigame by default or setup the menu state to show
 * the selection screen.
 *
 * @param {Character} C
 * @param {DialogStruggleActionType} Action
 * @param {Item | null} PrevItem
 * @param {DialogInventoryItem | null} NextItem
 */
function DialogStruggleStart(C, Action, PrevItem, NextItem) {

	// Sets the status struggle and cancels previous struggles
	if (ChatRoomStruggleData != null) StruggleChatRoomStop();
	ChatRoomStatusUpdate("Struggle");

	// If it's not the player struggling, or we're applying a new item, or the
	// existing item is locked with a key the character has, or the player can
	// interact with it and it's not a mountable item, or the item's difficulty
	// is low enough to progress by itself, we're currently trying to swap items
	// on someone.
	const autoStruggle = (C != Player || PrevItem == null || ((PrevItem != null)
		&& (!InventoryItemHasEffect(PrevItem, "Lock", true) || DialogCanUnlock(C, PrevItem))
		&& ((Player.CanInteract() && !InventoryItemHasEffect(PrevItem, "Mounted", true))
			|| StruggleStrengthGetDifficulty(C, PrevItem, NextItem).auto >= 0)));
	if (autoStruggle) {
		DialogStruggleAction = Action;
		DialogStruggleSelectMinigame = false;
		StruggleMinigameStart(C, "Strength", PrevItem, NextItem, DialogStruggleStop);
	} else {
		DialogStruggleAction = Action;
		DialogStrugglePrevItem = PrevItem;
		DialogStruggleNextItem = NextItem;
		DialogStruggleSelectMinigame = true;
	}
	DialogChangeMode("struggle");
	// Refresh menu buttons
	DialogMenuButtonBuild(C);

}

/**
 * Handle the struggle minigame completing, either as a failure, an interruption, or a success.
 *
 * @type {StruggleCompletionCallback}
 */
function DialogStruggleStop(C, Game, { Progress, PrevItem, NextItem, Skill, Attempts, Interrupted, Auto }) {
	if (!DialogStruggleAction) return;
	const Success = Progress >= 100;
	if (Interrupted) {
		// Handle the minigame having been interrupted by showing a message in chat
		let action;
		if (PrevItem != null && NextItem != null && !NextItem.Asset.IsLock)
			action = "ActionInterruptedSwap";
		else if (StruggleProgressNextItem != null)
			action = "ActionInterruptedAdd";
		else
			action = "ActionInterruptedRemove";

		ChatRoomPublishAction(C, action, PrevItem, NextItem);

		DialogLeave();
		return;
	} else if (Game === "LockPick") {
		if (Success) {
			if (C.FocusGroup && C) {
				const item = InventoryGet(C, C.FocusGroup.Name);
				if (item) {
					InventoryUnlock(C, item);
					ChatRoomPublishAction(C, "ActionPick", item, null);
				}
			}
			SkillProgress(Player, "LockPicking", Skill);
		}

		// For an NPC we move out to their reaction, for other characters we return to the item list
		if (C.IsNpc()) {
			DialogLeaveItemMenu();
		} else {
			DialogChangeMode("items");
		}
		return;
	} else if (Game === "Dexterity" || Game === "Flexibility" || Game === "Strength") {

		if (!Success) {
			// Send a stimulation event for that
			if (Attempts >= 10 && !Auto && Progress >= 0 && Progress < 100) {
				ChatRoomStimulationMessage("StruggleFail");
			}
			return;
		}

		// Removes the item & associated items if needed, then wears the new one
		const group = NextItem?.Asset.Group ?? PrevItem?.Asset.Group;
		if (!group) {
			return;
		}
		InventoryRemove(C, group.Name, false);
		/** @type {null | Item} */
		let nextWornItem = null;
		if (NextItem != null) {
			/** @type {BCColor} */
			let Color = (DialogColorSelect == null) ? "Default" : DialogColorSelect;
			if ((NextItem.Craft != null) && CommonIsColor(NextItem.Craft.Color))
				Color = NextItem.Craft.Color;

			nextWornItem = InventoryWear(C, NextItem.Asset.Name, NextItem.Asset.Group.Name, Color, SkillGetWithRatio(Player, "Bondage"), Player.MemberNumber, NextItem.Craft, false);
		}

		CharacterRefresh(C, true, true);

		// Handle skills
		if (C.IsPlayer()) {
			if (nextWornItem === null) {
				// We successfully removed one of our items
				SkillProgress(Player, "Evasion", Skill);
			} else if (PrevItem === null) {
				// We successfully added an item
				SkillProgress(Player, "SelfBondage", Skill);
			}
		} else if (nextWornItem !== null) {
			// We successfully added an item on someone
			SkillProgress(Player, "Bondage", Skill);
		}

		// Reset the the character's position
		if (CharacterAppearanceForceUpCharacter == C.MemberNumber) {
			CharacterAppearanceForceUpCharacter = -1;
			CharacterRefresh(C, false);
		}

		// Update the dialog state
		if (C.IsNpc()) {
			// For NPCs, we need to show their reaction and never leave the dialog abruptly
			const line = nextWornItem == null ? "Remove" + (PrevItem?.Asset.Name ?? "") : nextWornItem.Asset.Name;
			const action = nextWornItem == null ? "Remove" : "";
			C.CurrentDialog = DialogFind(C, line, action + group.Name);
			DialogLeaveItemMenu();
		} else if (nextWornItem === null) {
			// Removing an item, we move back to the menu
			ChatRoomPublishAction(C, DialogStruggleAction, PrevItem, nextWornItem);
			DialogChangeMode("items");
		} else if (
			NextItem != null
			&& NextItem.Asset.Extended
			&& (
				NextItem.Craft == null
				|| NextItem.Craft.TypeRecord == null
				|| Object.values(NextItem.Craft.TypeRecord).every(i => i === 0)
			)
		) {
			// Applying an extended, non-crafted/typeless crafted item, refresh the inventory and open the extended UI
			ChatRoomPublishAction(C, DialogStruggleAction, PrevItem, nextWornItem);
			DialogExtendItem(nextWornItem);
		} else {
			// Applying a non-extended or crafted-with-preset-type item, just exit the dialog altogether
			ChatRoomPublishAction(C, DialogStruggleAction, PrevItem, nextWornItem);
			DialogLeave();
		}
	}
}

/**
 * Keyboard handler for dialogs
 *
 * @type {KeyboardEventListener}
 */
function DialogKeyDown(event) {
	if (CurrentCharacter) {
		if (StruggleKeyDown(event)) {
			return true;
		} else if (CommonKey.IsPressed(event, "Escape")) {
			DialogMenuBack();
			return true;
		} else {
			return DialogGetMenu(DialogMenuMode)?.KeyDown(event) ?? false;
		}
	}
	return false;
}

/**
 * Mouse down handler for dialogs
 *
 * @type {MouseEventListener}
 */
function DialogMouseDown(event) {
	if (CurrentCharacter) StruggleMouseDown(event);
}

/**
 * Make an NPC invisible
 * @param {NPCCharacter} npc
 * @returns {void} - Nothing
 */
function DialogHideNPC(npc) {
	npc.SavedName = npc.Name;
	npc.Name = "";
	npc.FixedImage = "Screens/Room/MovieStudio/Empty.png";
}

/**
 * Make an NPC invisible
 * @param {NPCCharacter} npc
 * @returns {void} - Nothing
 */
function DialogRevealNPC(npc) {
	npc.Name = npc.SavedName ?? "";
	delete npc.SavedName;
	delete npc.FixedImage;
}
