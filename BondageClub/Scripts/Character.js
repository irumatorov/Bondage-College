"use strict";
/** @type {Character[]} */
var Character = [];
var CharacterNextId = 0;

/** @type {Map<BlindEffectName, number>} */
const CharacterBlindLevels = new Map([
	/**
	 * Reserve `BlindTotal` for situations where the blindness level should never
	 * be lowered by crafted properties (e.g. while in VR)
	 */
	["BlindTotal", 99],
	["BlindHeavy", 3],
	["BlindNormal", 2],
	["BlindLight", 1],
]);

/** @type {Map<DeafEffectName, number>} */
const CharacterDeafLevels = new Map([
	["DeafTotal", 4],
	["DeafHeavy", 3],
	["DeafNormal", 2],
	["DeafLight", 1],
]);

/** @type {Map<BlurEffectName, number>} */
const CharacterBlurLevels = new Map([
	["BlurTotal", 50],
	["BlurHeavy", 20],
	["BlurNormal", 8],
	["BlurLight", 3],
]);

/** @satisfies {Record<string, DifficultyLevel>} */
const Difficulty = {
	ROLEPLAY: 0,
	REGULAR: 1,
	HARDCORE: 2,
	EXTREME: 3,
};

/** @satisfies {Record<string, AllowedInteractions>} */
const AllowedInteractions = /** @type {const} */({
	Everyone: 0,
	EveryoneExceptBlacklist: 1,
	OwnerLoversWhitelistAndDomsOnly: 2,
	OwnerLoversWhitelistOnly: 3,
	OwnerLoversOnly: 4,
	OwnerOnly: 5,
});

/**
 * An enum representing the various character archetypes
 * ONLINE: The player, or a character representing another online player
 * NPC: Any NPC
 * SIMPLE: Any simple character, generally used internally and not to represent an actual in-game character
 * @type {Record<"ONLINE"|"NPC"|"SIMPLE"|"PLAYER", CharacterType>}
 */
var CharacterType = {
	ONLINE: "online",
	NPC: "npc",
	SIMPLE: "simple",
	PLAYER: "player",
};

/**
 * A record mapping screen names to functions for returning {@link CharacterGetCurrent} characters.
 * @type {Record<string, () => null | Character>}
 */
var CharacterGetCurrentHandlers = {
	Appearance: () => CharacterAppearanceSelection,
	Crafting: () => CraftingPreview,
	Shop2: () => Shop2InitVars.Preview,
};

function CharacterCreatePlayer() {
	Player = /** @type {PlayerCharacter} */ (CharacterCreate("Female3DCG", CharacterType.PLAYER, ""));
	// We reset that here because a lot of checks depends on this being true
	// Our old 0-ID'ed character was the player dummy before login
	const oldId = Player.ID;
	Player.ID = 0;
	Player.Log = [];
	Character[0] = Player;
	Character.splice(oldId, 1);
	CharacterNextId--;
	CommonPromiseCatch(CharacterLoadCSVDialog(Player, { module: "Character", screen: "Player", name: "Player" }));
	PreferenceInitPlayer(Player, {});
}

/**
 * Loads a character into the buffer, creates it if it does not exist
 * @param {IAssetFamily} CharacterAssetFamily - Name of the asset family of the character
 * @param {CharacterType} Type - The character type
 * @param {string} CharacterID - An unique identifier for the character
 * @returns {Character} - The newly loaded character
 */
function CharacterCreate(CharacterAssetFamily, Type, CharacterID) {
	const id = CharacterNextId++;
	// Prepares the character sheet
	/** @type {Character} */
	const NewCharacter = {
		ID: id,
		CharacterID: CharacterID,
		AssetFamily: CharacterAssetFamily,
		AccountName: "",
		AllowedInteractions: 0,
		Ownership: null,
		Lovership: [],
		// @ts-expect-error Initialized later
		ArousalSettings: {},
		Crafting: [],
		Hooks: null,
		Name: "",
		Type,
		Owner: "",
		Lover: "",
		Money: 0,
		Inventory: [],
		Appearance: [],
		ExpressionQueue: [],
		_Stage: "0",
		get Stage() {
			return this._Stage;
		},
		set Stage(value) {
			if (this._Stage === value) {
				return;
			}
			this._Stage = value;
			if (DialogMenuMode === "dialog") {
				CommonPromiseCatch(DialogMenuMapping.dialog.Reload());
			}
		},
		_CurrentDialog: "",
		get CurrentDialog() {
			return this._CurrentDialog;
		},
		set CurrentDialog(value) {
			if (this._CurrentDialog === value) {
				return;
			}
			this._CurrentDialog = value;
			if (DialogMenuMode === "dialog") {
				DialogSetStatus(value);
			}
		},
		ClickedOption: null,
		Dialog: [],
		Reputation: [],
		Skill: [],
		DrawAppearance: [],
		Effect: [],
		Tints: [],
		Attribute: [],
		FocusGroup: null,
		Canvas: null,
		CanvasBlink: null,
		MustDraw: false,
		BlinkFactor: Math.round(Math.random() * 10) + 10,
		AllowItem: true,
		BlockItems: /** @type {never} */([]),
		LimitedItems: /** @type {never} */([]),
		FavoriteItems: /** @type {never} */([]),
		HiddenItems: /** @type {never} */([]),
		PermissionItems: {},
		WhiteList: [],
		BlackList: [],
		HeightModifier: 0,
		HeightRatio: 1,
		HasHiddenItems: false,
		SavedColors: GetDefaultSavedColors(),
		// @ts-ignore Strict-TS: properly initiated further down below
		ActiveExpression: null,
		DrawnAssets: new Set(),
		PoseMapping: {},
		get Pose() {
			return Object.values(this.PoseMapping);
		},
		set Pose(poses) {
			if (typeof poses === "string") {
				poses = [poses];
			}
			this.DrawPoseMapping = PoseToMapping.Scalar(poses, "Character.Pose");
		},

		ActivePoseMapping: { BodyLower: "BaseLower", BodyUpper: "BaseUpper" },
		get ActivePose() {
			return Object.values(this.ActivePoseMapping);
		},
		set ActivePose(poses) {
			if (typeof poses === "string") {
				poses = [poses];
			}
			this.ActivePoseMapping = PoseToMapping.Scalar(poses, "Character.ActivePose");
		},

		DrawPoseMapping: {},
		get DrawPose() {
			return Object.values(this.DrawPoseMapping);
		},
		set DrawPose(poses) {
			if (typeof poses === "string") {
				poses = [poses];
			}
			this.DrawPoseMapping = PoseToMapping.Scalar(poses, "Character.DrawPose");
		},

		AllowedActivePoseMapping: {},
		get AllowedActivePose() {
			/** @type {AssetPoseName[]} */
			const ret = [];
			Object.values(this.AllowedActivePoseMapping).forEach(poses => ret.push(...poses));
			return ret;
		},
		set AllowedActivePose(poses) {
			if (typeof poses === "string") {
				poses = [poses];
			}
			this.AllowedActivePoseMapping = PoseToMapping.Array(poses, "Character.AllowedActivePose");
		},

		CanTalk: function () {
			const GagEffect = SpeechTransformGagGarbleIntensity(this);
			return (GagEffect <= 0);
		},
		CanWalk: function () {
			return (
				!this.HasEffect("Freeze")
				&& !this.HasEffect("Tethered")
				&& !this.HasEffect("Mounted")
			);
		},
		CanKneel: function (minimumStatus = undefined) {
			return CharacterCanKneel(this, minimumStatus);
		},
		CanInteract: function () {
			return !this.HasEffect("Block");
		},
		CanChangeOwnClothes: function () {
			return this.CanChangeClothesOn(this);
		},
		CanChangeClothesOn: function (C) {
			if (this.IsPlayer() && C.IsPlayer()) {
				return (
					!C.IsRestrained() &&
					!ManagementIsClubSlave() &&
					OnlineGameAllowChange() &&
					AsylumGGTSAllowChange(this) &&
					!LogQuery("BlockChange", "Rule") &&
					(!LogQuery("BlockChange", "OwnerRule") || !Player.IsFullyOwned())
				);
			} else {
				return (
					this.CanInteract() &&
					C.MemberNumber != null &&
					C.AllowItem &&
					!C.IsEnclose() &&
					InventoryGet(C, "ItemNeck")?.Asset.Name !== "ClubSlaveCollar"
				);
			}
		},
		IsRestrained: function () {
			return (
				this.HasEffect("Freeze") ||
				this.HasEffect("Block") ||
				this.HasEffect("BlockWardrobe")
			);
		},
		_BlindLevel: undefined,
		/**
		 * Look for blindness effects and return the worst (limited by settings), Light: 1, Normal: 2, Heavy: 3
		 * @param {boolean} eyesOnly
		 */
		GetBlindLevel: function (eyesOnly = false) {
			let blindLevel = this._BlindLevel;
			if (!eyesOnly && blindLevel != null) {
				return blindLevel;
			} else {
				blindLevel = 0;
			}

			const eyes1 = InventoryGet(this, "Eyes");
			const eyes2 = InventoryGet(this, "Eyes2");
			if (eyes1 && eyes1.Property && eyes1.Property.Expression && eyes2 && eyes2.Property && eyes2.Property.Expression) {
				if ((eyes1.Property.Expression === "Closed") && (eyes2.Property.Expression === "Closed")) {
					blindLevel += DialogFacialExpressionsSelectedBlindnessLevel;
				}
			}
			if (!eyesOnly) {
				const effects = CharacterGetEffects(this, [], true);
				/** @type {Map<EffectName, number>} */
				const blindLevels = CharacterBlindLevels;
				blindLevel += effects.reduce((Start, EffectName) => Start + (blindLevels.get(EffectName) ?? 0), 0);
				blindLevel += InventoryCraftCount(this, "Thick", true);
				blindLevel -= InventoryCraftCount(this, "Thin", true);
			}
			// Light sensory deprivation setting limits blindness
			if (this.IsPlayer() && this.GameplaySettings && this.GameplaySettings.SensDepChatLog == "SensDepLight") {
				blindLevel = Math.max(0, Math.min(2, blindLevel));
			} else {
				blindLevel = Math.max(0, Math.min(3, blindLevel));
			}
			// Only cache complete blind values
			if (!eyesOnly) {
				this._BlindLevel = blindLevel;
			}
			return blindLevel;
		},
		GetBlurLevel: function() {
			if ((this.IsPlayer() && !this.GraphicsSettings.AllowBlur) || CommonPhotoMode) {
				return 0;
			}
			let blurLevel = 0;
			for (const item of this.Appearance) {
				for (const [effect, level] of CharacterBlurLevels.entries()) {
					if (InventoryItemHasEffect(item, effect)) {
						blurLevel += level;
						break; // Only count the highest blur level defined on the item
					}
				}
			}
			return blurLevel;
		},
		IsLocked: function () {
			return this.HasEffect("Lock");
		},
		IsBlind: function () {
			return this.GetBlindLevel() > 0;
		},
		IsEnclose: function () {
			return this.HasEffect("Enclose") || (this.HasEffect("OneWayEnclose") && this.IsPlayer());
		},
		IsMounted: function () {
			return this.HasEffect("Mounted");
		},
		IsChaste: function () {
			return this.HasEffect("Chaste") || this.HasEffect("BreastChaste");
		},
		IsVulvaChaste: function () {
			return this.HasEffect("Chaste");
		},
		IsPlugged: function () {
			return this.HasEffect("IsPlugged");
		},
		IsButtChaste: function () {
			return this.Effect.includes("ButtChaste");
		},
		IsBreastChaste: function () {
			return this.HasEffect("BreastChaste");
		},
		IsShackled: function () {
			return this.HasEffect("Shackled");
		},
		IsSlow: function () {
			return this.GetSlowLevel() > 0;
		},
		GetSlowLevel: function () {
			// Respect immunity setting for the player
			if (this.IsPlayer() && this.RestrictionSettings.SlowImmunity)
				return 0;

			let slowness = 0;
			let hasSlowEffect = false;
			if (this.HasEffect("Slow")) {
				slowness++;
				hasSlowEffect = true;
			}
			if (this.PoseMapping.BodyFull === "AllFours") slowness += 2;
			else if (this.IsKneeling()) slowness += 1;

			// Increase the slow level for each "Heavy" item and reduce it for each "Light" item
			slowness += InventoryCraftCount(this, "Heavy", true);
			slowness -= InventoryCraftCount(this, "Light", true);

			// Short-circuit to save on the following checks
			if (slowness === 0) return 0;

			const effects = CharacterGetEffects(this, undefined, true);
			// Count all slow effects applied. Minus one for the one we've seen above
			slowness += effects.reduce((s, c) => s + (c === "Slow" ? 1 : 0), 0) - (hasSlowEffect ? 1 : 0);

			return Math.max(0, slowness);
		},
		IsEgged: function () {
			return this.HasEffect("Egged");
		},
		IsMouthBlocked: function () {
			return this.HasEffect("BlockMouth");
		},
		IsMouthOpen: function () {
			return this.HasEffect("OpenMouth");
		},
		IsVulvaFull: function () {
			return this.HasEffect("FillVulva");
		},
		IsAssFull: function () {
			return this.Effect.includes("IsPlugged");
		},
		IsFixedHead: function () {
			return this.Effect.includes("FixedHead");
		},
		IsOwned: function () {
			if (this.IsNpc() && this.Owner === Player.Name) return "player";
			if (this.IsNpc() && this.Owner !== Player.Name && NPCEventGet(this, "EndDomTrial")) return "player";
			if (this.Ownership && this.Ownership.MemberNumber) return "online";
			// NPC-owner with trial completed
			if (this.Owner && this.Owner.trim().startsWith("NPC-")) return "npc";
			if (this.IsPlayer()) {
				// NPC-owner while in trial
				// Cast here because PrivateCharacter[0] is actually the player
				let trialing = /** @type {PlayerCharacter | NPCCharacter} */ (PrivateCharacter.find(c => NPCEventGet(c, "EndSubTrial") > 0));
				if (trialing && trialing !== this) return "npc";
			}
			if (AsylumGGTSGetLevel(this) >= 6) return "ggts";
			return false;
		},
		IsOwnedByCharacter: function (C) {
			switch (this.IsOwned()) {
				case "ggts":
					return false;
				case "npc": {
					if (!C.IsNpc()) return false;
					if (this.Owner.replace("NPC-", "").trim() === C.Name)
						return true;

					// Only Private NPCs have relevant events, since they're the only ones persisted.
					return NPCEventGet(C, "EndSubTrial") > 0;
				}
				case "online":
					return this.Ownership?.MemberNumber === C.MemberNumber;
				case "player":
					return true;
				default:
					return false;
			}
		},
		IsFullyOwned: function () {
			switch (this.IsOwned()) {
				case "ggts": return true;
				case "npc":
					return !!PrivateCharacter.find(c => NPCEventGet(c, "PlayerCollaring") > 0);
				case "player":
					return (NPCEventGet(/** @type {NPCCharacter} */(this), "NPCCollaring") > 0);
				case "online": return (this.Ownership?.Stage ?? 0) >= 1;
				default:
					return false;
			}
		},
		IsOwnedByPlayer: function () {
			return this.IsOwnedByCharacter(Player);
		},
		IsFullyOwnedByPlayer: function () {
			return this.IsOwnedByPlayer() && this.IsFullyOwned();
		},
		OwnerName: function () {
			switch (this.IsOwned()) {
				case "ggts": return TextGet("OwnerGGTS");
				case "npc": {
					const name = this.Owner.replace("NPC-", "");
					if (this.IsFullyOwned()) {
						return name;
					 }
					 const privateOwner = PrivateCharacter.find(c => NPCEventGet(c, "EndSubTrial") > 0);
					 return privateOwner?.Name ?? name ?? "";
				}
				case "online": return this.Ownership?.Name ?? ""; // this.IsOwned() makes it impossible
				case "player": return CharacterNickname(Player);
				default:
					return "";
			}
		},
		OwnerNumber: function () {
			if (this.IsOwned() === "online")
				return this.Ownership?.MemberNumber ?? -1; // this.IsOwned() makes it impossible
			return -1;
		},
		HasOwnerNotes: function () {
			return typeof this.Ownership?.Notes === "string" && this.Ownership.Notes.length > 0;
		},
		IsOwnedByMemberNumber: function (memberNumber) {
			return (memberNumber != -1 && this.OwnerNumber() === memberNumber);
		},
		OwnedSince: function () {
			switch (this.IsOwned()) {
				case "online":
					// this.IsOwned() makes it impossible
					return Math.floor((CurrentTime - (this.Ownership?.Start ?? 0)) / MS_PER_DAY);
				case "player": {
					let Time = NPCEventGet(/** @type {NPCCharacter} */(this), "NPCCollaring");
					if (Time > 0) return Math.floor((CurrentTime - Time) / MS_PER_DAY);
					Time = NPCEventGet(/** @type {NPCCharacter} */(this), "EndDomTrial");
					if (Time > 0) {
						if (Time > CurrentTime)
							return Math.ceil((Time - CurrentTime) / MS_PER_DAY);
						else
							return 0;
					}
					return -1;
				}
				case "npc": {
					for (const npc of PrivateCharacter) {
						let Time = NPCEventGet(npc, "PlayerCollaring");
						if (Time > 0) return Math.floor((CurrentTime - Time) / MS_PER_DAY);
						Time = NPCEventGet(npc, "EndSubTrial");
						if (Time > 0) {
							if (Time > CurrentTime)
								return Math.ceil((Time - CurrentTime) / MS_PER_DAY);
							else
								return 0;
						}
					}
					return -1;
				}
			}
			return -1;
		},
		OwnedSinceMs: function () {
			switch (this.IsOwned()) {
				case "online":
					return this.Ownership?.Start ?? 0;
				case "player": {
					let Time = NPCEventGet(this, "NPCCollaring");
					if (Time > 0) return Time;
					Time = NPCEventGet(this, "EndDomTrial");
					if (Time > 0) {
						return Time || 0;
					}
					break;
				}
				case "npc": {
					for (const npc of PrivateCharacter) {
						let Time = NPCEventGet(npc, "PlayerCollaring");
						if (Time > 0) return Time;
						Time = NPCEventGet(npc, "EndSubTrial");
						if (Time > 0) {
							return Time || 0;
						}
					}
					break;
				}
			}
			return -1;
		},
		IsOwner: function () {
			return Player.IsOwnedByCharacter(this);
		},
		IsLoverOfCharacter: function (C) {
			const loves = this.GetLovership();
			if (C.IsNpc()) {
				const Love = loves.find(l => !l.MemberNumber && l.Name === C.Name);
				if (!Love) return false;
				return (Love.Start ?? 0) > 0;
			}

			return (
				this.IsLoverOfMemberNumber(/** @type {number} */ (C.MemberNumber)) ||
				this.IsNpc() && (((this.Lover != null) && (this.Lover.trim() == C.Name)) || (NPCEventGet(this, "Girlfriend") > 0))
			);
		},
		LoverName: function () {
			// Only valid for NPCs. Online character can have many lovers
			if (this.IsNpc() && this.Lover)
				return this.Lover.replace("NPC-", "").trim();
			return "";
		},
		IsLoverOfPlayer: function () {
			return this.IsLoverOfCharacter(Player);
		},
		IsLoverOfMemberNumber: function (memberNumber) {
			return this.GetLoversNumbers().indexOf(memberNumber) >= 0;
		},
		// @ts-expect-error I know you don't like hand-made class object things
		GetLoversNumbers: function (MembersOnly) {
			return this.GetLovership(MembersOnly).map(l => l.MemberNumber ? l.MemberNumber : l.Name);
		},
		GetLovership: function (MembersOnly) {
			/** @type {Lovership[]} */
			let loves = [];
			if (!(CommonIsArray(this.Lovership) || (this.IsNpc() && this.Lover != ""))) return loves;

			if (this.IsNpc()) {
				if (!this.Lover) {
					return [];
				}
				// NPC can only love the player at the moment. Reconstruct their lovership data
				/** @type {Lovership} */
				const love = { Name: this.Lover, MemberNumber: Player.MemberNumber };

				let stages = /** @type {NPCEventType[]} */ (["Wife", "Fiancee", "Girlfriend"]);
				for (const [idx, stage] of stages.entries()) {
					love.Start = NPCEventGet(this, stage);
					if (love.Start > 0) {
						love.Stage = /** @type {0|1|2} */ (stages.length - 1 - idx);
						break;
					}
				}

				if (love.Start !== 0)
					loves.push(love);

				return loves;
			}

			for (let L of this.Lovership) {
				if (typeof L.MemberNumber === "number") {
					// Anything with a MemberNumber is a relationship with an online character, so properties should be fine
					loves.push(L);
				} else if (L.Name && (MembersOnly == null || MembersOnly == false)) {
					// Otherwise, this is an NPC, so just go fetch their reconstructed data and use that as ours
					const lover = PrivateCharacter.find(c => (c.IsPlayer() ? c.Name : `NPC-${c.Name}`) === L.Name);
					if (!lover) continue;

					const npcLove = lover.GetLovership().find(l => l.MemberNumber === Player.MemberNumber);
					if (!npcLove) continue;

					/** @type {Lovership} */
					const love = { Name: L.Name.replace("NPC-", "") };
					love.Stage = npcLove.Stage;
					love.Start = npcLove.Start;
					loves.push(love);
				}
			}
			return loves;
		},
		GetDeafLevel: function () {
			let deafLevel = 0;
			for (const item of this.Appearance) {
				if (item.Craft?.Effects.Deaf) {
					deafLevel += 1;
				} else if (item.Craft?.Effects.Audible) {
					deafLevel -= 1;
				}
				for (const [effect, level] of CharacterDeafLevels.entries()) {
					if (InventoryItemHasEffect(item, effect)) {
						deafLevel += level;
						break; // Only count the highest deafness level defined on the item
					}
				}
			}
			return CommonClamp(deafLevel, 0, Infinity);
		},
		CanPickLocks: function () {
			const CanAccessLockpicks = (this.CanInteract() || this.CanWalk()) && InventoryAvailable(this, "Lockpicks", "ItemMisc");
			return CanAccessLockpicks || DialogLentLockpicks;
		},
		IsKneeling: function () {
			return CommonIncludes(PoseAllKneeling, this.PoseMapping.BodyLower);
		},
		IsStanding: function () {
			return CommonIncludes(PoseAllStanding, this.PoseMapping.BodyLower);
		},
		IsNaked: function () {
			return CharacterIsNaked(this);
		},
		IsDeaf: function () {
			return this.GetDeafLevel() > 0;
		},
		/* Check if one or more gag effects are active (thus bypassing the crafted small/large properties) */
		IsGagged: function () {
			return this.Effect.some(effect => effect in SpeechGagLevelLookup);
		},
		HasNoItem: function () {
			return CharacterHasNoItem(this);
		},
		IsEdged: function () {
			return CharacterIsEdged(this);
		},
		/** @type {() => this is PlayerCharacter} */
		IsPlayer: function () {
			return this.Type === CharacterType.PLAYER;
		},
		get X() { return this.Position?.X ?? -1; },
		get Y() { return this.Position?.Y ?? -1; },
		set X(value) {
			this.Position = { X: value, Y: this.Y };
		},
		set Y(value) {
			this.Position = { X: this.X, Y: value };
		},
		get Position() {
			return this.MapData?.Pos ?? null;
		},
		set Position(pos) {
			if (pos === null) {
				return;
			}
			const newPos = ServerAccountDataSyncedValidate.MapData.Pos(pos, this);
			this.MapData ??= { Pos: newPos, PrivateState: {}};
			this.MapData.Pos = newPos;
			MapManager.Map.updatePlayerPerception();
			ChatRoomMapViewUpdatePlayerFlag();
		},
		HasMapState(name) {
			const mapping = {
				"BronzeKey": "HasKeyBronze",
				"SilverKey": "HasKeySilver",
				"GoldKey": "HasKeyGold",
			};
			const key = mapping[name] ?? name;
			return !!this.MapData?.PrivateState[key];
		},
		SetMapState(name, state) {
			if (!this.MapData) return;
			const mapping = {
				"BronzeKey": "HasKeyBronze",
				"SilverKey": "HasKeySilver",
				"GoldKey": "HasKeyGold",
			};
			const key = mapping[name] ?? name;
			this.MapData.PrivateState[key] = state;
		},
		IsBirthday: function () {
			if (!this.Creation) return false;
			const creation = new Date(this.Creation);
			const current = new Date(CurrentTime);

			return (creation.getUTCDate() === current.getUTCDate()) &&
				(creation.getUTCMonth() === current.getUTCMonth()) &&
				(creation.getUTCFullYear() !== current.getUTCFullYear());
		},
		IsSiblingOfCharacter: function(C) {
			return this.IsOwnedByMemberNumber(C.OwnerNumber());
		},
		IsFamilyOfPlayer: function () {
			return this.IsInFamilyOfMemberNumber(Player.MemberNumber);
		},
		IsInFamilyOfMemberNumber: function (MemberNum) {
			if (this.MemberNumber === MemberNum) return false;

			/** @type {Character | undefined} */
			let C = ChatRoomCharacter.find(c => c.MemberNumber === MemberNum);
			if (!C) C = PrivateCharacter.find(c => c.MemberNumber === MemberNum);
			if (!C) C = Character.find(c => c.MemberNumber === MemberNum);
			if (!C) return false;

			// Check that we either share owners, are owned by this character, or that this character owns us
			if (this.IsSiblingOfCharacter(C)) return true;
			if (this.IsOwnedByCharacter(C)) return true;
			if (C.IsOwnedByCharacter(this)) return true;
			return false;
		},
		/** @type {() => this is OnlineCharacter} */
		IsOnline: function () {
			return this.Type === CharacterType.ONLINE;
		},
		/** @type {() => this is NPCCharacter} */
		IsNpc: function () {
			return this.Type === CharacterType.NPC;
		},
		IsSimple: function () {
			return this.Type === CharacterType.SIMPLE;
		},
		GetDifficulty: function () {
			return (
				(this.Difficulty == null) ||
				(this.Difficulty.Level == null) ||
				(typeof this.Difficulty.Level !== "number") ||
				(this.Difficulty.Level < 0) ||
				(this.Difficulty.Level > 3)
			) ? 1 : this.Difficulty.Level;
		},
		IsSuspended: function () {
			return this.PoseMapping.BodyAddon === "Suspension" || this.Effect.includes("Suspended");
		},
		IsInverted: function () {
			return this.PoseMapping.BodyAddon === "Suspension";
		},
		CanChangeToPose: function (Pose) {
			return PoseCanChangeUnaided(this, Pose);
		},
		GetClumsiness: function () {
			return CharacterGetClumsiness(this);
		},
		HasEffect: function(Effect) {
			return this.Effect.includes(Effect);
		},
		HasTints: function() {
			if (this.IsPlayer() && this.ImmersionSettings && !this.ImmersionSettings.AllowTints) {
				return false;
			}
			return !CommonPhotoMode && this.Tints.length > 0;
		},
		GetTints: function() {
			return CharacterGetTints(this);
		},
		HasAttribute: function(attribute) {
			return this.Attribute.includes(attribute);
		},
		GetGenders: function () {
			return this.Appearance.map(asset => asset.Asset.Gender).filter(Boolean);
		},
		GetPronouns: function () {
			const pronounItem = InventoryGet(this, "Pronouns");
			const pronouns = pronounItem ? pronounItem.Asset.Name : "SheHer";
			return /** @type {CharacterPronouns} */(pronouns);
		},
		GetLockTimerLimit: function () {
			if (this.IsPlayer() || this.IsOnline()) {
				switch (this.OnlineSharedSettings.LockTimerLimit) {
					case "LockTimerLimitDay":
						return 1*24*60*60;
					case "LockTimerLimitWeek":
						return 7*24*60*60;
					case "LockTimerLimitMonth":
						return 30*24*60*60;
					case "LockTimerLimitYear":
						return 365*24*60*60;
					case "LockTimerLimitUnlimited":
						return Infinity;
				}
			}
			return null;
		},
		HasPenis: function () {
			return InventoryIsItemInList(this, "Pussy", ["Penis"]);
		},
		HasVagina: function () {
			return InventoryIsItemInList(this, "Pussy", ["Pussy1", "Pussy2", "Pussy3"]);
		},
		IsFlatChested: function () {
			return InventoryIsItemInList(this, "BodyUpper", ["FlatSmall", "FlatMedium"]);
		},
		WearingCollar: function () {
			return InventoryGet(this, "ItemNeck") !== null;
		},
		// Adds a new hook with a Name (determines when the hook will happen, an Instance ID (used to differentiate between different hooks happening at the same time), and a function that is run when the hook is called)
		RegisterHook: function (hookName, hookInstance, callback) {
			if (!this.Hooks) this.Hooks = new Map();

			let hooks = this.Hooks.get(hookName);
			if (!hooks) {
				hooks = new Map();
				this.Hooks.set(hookName, hooks);
			}

			if (!hooks.has(hookInstance)) {
				hooks.set(hookInstance, callback);
				return true;
			}
			return false;
		},
		// Removes a hook based on hookName and hookInstance
		UnregisterHook: function (hookName, hookInstance) {
			if (!this.Hooks) return false;

			const hooks = this.Hooks.get(hookName);
			if (hooks && hooks.delete(hookInstance)) {
				if (hooks.size == 0) {
					this.Hooks.delete(hookName);
				}
				return true;
			}

			return false;
		},
		RunHooks: function (hookName) {
			if (this.Hooks && typeof this.Hooks.get == "function") {
				let hooks = this.Hooks.get(hookName);
				if (hooks)
					hooks.forEach((hook) => hook()); // If there's a hook, call it
			}
		},
		HasOnGhostlist: function(target) {
			return CharacterIsOnList(this, target, "ghost");
		},
		HasOnBlacklist: function(target) {
			return CharacterIsOnList(this, target, "black");
		},
		HasOnWhitelist: function(target) {
			return CharacterIsOnList(this, target, "white");
		},
		HasOnFriendlist: function(target) {
			return CharacterIsOnList(this, target, "friend");
		},
		IsGhosted: function() {
			return Player.HasOnGhostlist(this);
		},
		IsBlacklisted: function() {
			return Player.HasOnBlacklist(this);
		},
		IsWhitelisted: function() {
			return Player.HasOnWhitelist(this);
		},
		IsFriend: function() {
			return Player.HasOnFriendlist(this);
		}
	};

	// Keep these two methods non-enumerable such that they do not interfere with the likes of `Object.keys`
	const activeExpression = Object.defineProperties(/** @type {Character["ActiveExpression"]} */({}), {
		setWithoutReload: {
			/**
			 * @param {string} key
			 * @param {any} value
			 */
			value: function (key, value) { this[key] = value; },
			enumerable: false,
		},
		deleteWithoutReload: {
			/**
			 * @param {string} key
			 */
			value: function (key) { delete this[key]; },
			enumerable: false,
		},
	});

	/** @type {Mutable<Character>} */(NewCharacter).ActiveExpression = new Proxy(
		activeExpression,
		{
			set(...args) {
				if (DialogSelfMenuSelected === "Expression" && DialogSelfMenuMapping.Expression.C?.ID === NewCharacter.ID) {
					CommonPromiseCatch(DialogSelfMenuMapping.Expression.Reload());
				}
				return Reflect.set(...args);
			},
			deleteProperty(...args) {
				if (DialogSelfMenuSelected === "Expression" && DialogSelfMenuMapping.Expression.C?.ID === NewCharacter.ID) {
					CommonPromiseCatch(DialogSelfMenuMapping.Expression.Reload());
				}
				return Reflect.deleteProperty(...args);
			},
		},
	);

	// Add the character to the cache
	Character.push(NewCharacter);

	return NewCharacter;
}

/**
 * Attributes a random name for the character, does not select a name in use
 * @returns {string} - Nothing
 */
function CharacterGenerateRandomName() {

	// Get the list of all currently known names
	/** @type {string[]} */
	const CurrentNames = [];
	CurrentNames.push(...Character.map(c => c.Name));
	CurrentNames.push(...PrivateCharacter.map(c => c.Name));

	// Filter those names out of our name bank
	const PossibleNames = [...CharacterName].filter(n => !CurrentNames.includes(n));

	// Pick one of the remaining names
	return CommonRandomItemFromList("", PossibleNames);
}

/**
 * An expression representing `{foo=bar}`-type and `{foo}`-type of patterns.
 *
 * See {@link CharacterDialogPatternSubstitutor} for key-specific substitution logic.
 */
const CharacterDialogSubstitutionPattern = /\{(\s+)?(?<key>[a-zA-Z0-9_]+)(\s+)?(=(\s+)?(?<value>.+)(\s+)?)?\}/ig;

/**
 * Substitute name and pronoun fields in dialog.
 * @param {Character} C - Character for which to build the dialog
 * @returns {void} - Nothing
 */
function CharacterDialogSubstitution(C){
	/** @type {CommonSubtituteSubstitution[]} */
	let subst = [
		["DialogCharacterName", CharacterNickname(C)],
		["DialogPlayerName", CharacterNickname(Player)],
		[CharacterDialogSubstitutionPattern, "", CharacterDialogPatternSubstitutor] // expression for `"{foo=bar}"` patterns in the text
	];
	subst = subst.concat(ChatRoomPronounSubstitutions(C, "DialogCharacter", false));
	subst = subst.concat(ChatRoomPronounSubstitutions(Player, "DialogPlayer", false));

	C.Dialog.forEach(_=>{
		if(_.Option) _.Option = CommonStringSubstitute(_.Option, subst);
		if(_.Result) _.Result = CommonStringSubstitute(_.Result, subst);
	});
}

/**
 * Builds the dialog objects from the character CSV file
 * @param {Character} C - Character for which to build the dialog
 * @param {readonly string[][]} CSV - Content of the CSV file
 * @param {string} functionPrefix - A prefix that will be added to functions that aren't part of the Dialog or ChatRoom "namespace"
 * @param {boolean} reload - Perform a {@link DialogMenu.Reload} hard reset of the active `dialog` mode
 * @returns {void} - Nothing
 */
function CharacterBuildDialog(C, CSV, functionPrefix, reload=true) {

	C.Dialog = [];

	/**
	 * @param {string} fieldContents
	 * @returns {string | null}
	 */
	function parseField(fieldContents) {
		if (typeof fieldContents !== "string") return null;
		const str = fieldContents;
		if (str === "") return null;
		return str;
	}

	// For each lines in the file
	for (const L of CSV) {
		if (typeof L[0] !== "string" || L[0] === "") continue;

		// Creates a dialog object
		/** @type {DialogLine} */
		const D = {
			Stage: parseField(L[0]) ?? "",
			NextStage: parseField(L[1]),
			Option: parseField(L[2]),
			Result: parseField(L[3]),
			Function: parseField(L[4]),
			Prerequisite: parseField(L[5]),
			Group: parseField(L[6]),
			Trait: parseField(L[7]),
		};

		// Prefix with the current screen unless this is a Dialog function or an online character
		if (D.Function) {
			D.Function = (D.Function.startsWith("Dialog") ? "" : (C.IsOnline() || C.IsPlayer()) ? "ChatRoom" : functionPrefix) + D.Function;
		}

		C.Dialog.push(D);
	}

	if (reload && DialogMenuMode === "dialog") {
		CommonPromiseCatch(DialogMenuMapping.dialog.Reload(null, { reset: true }));
	}
}

/**
 * Loads the content of a CSV file to build the character dialog. Can override the current screen.
 * @param {Character} C - Character for which to build the dialog objects
 * @param {DialogInfo<any>} [info]
 * @returns {Promise<void>} - Nothing
 */
async function CharacterLoadCSVDialog(C, info) {

	/** @type {DialogInfo<any>} */
	let dialog;
	if (!info && !C.DialogInfo) {
		console.error(`cannot refresh dialog for character ${C.ID}`);
		return;
	} else if (info) {
		dialog = C.DialogInfo = info;
	} else {
		// Just refresh the info we have
		dialog = /** @type {DialogInfo<any>} */ (C.DialogInfo);
	}

	const FullPath = ScreenFileGetDialog(dialog.name, dialog.module, dialog.screen);

	function buildDialog() {
		CharacterBuildDialog(C, CommonCSVCache[FullPath], dialog.screen);

		// Translate the dialog if needed and perform substitutions
		TranslationLoadDialog(C, () => {
			TranslationTranslateDialog(C);
			CharacterDialogSubstitution(C);

			if (C.IsPlayer()) {
				for (const D of C.Dialog) {
					if (typeof D.Result === "string")
						PlayerDialog.set(D.Stage, D.Result);
				}
			}
		});
	}

	// Finds the full path of the CSV file to use cache
	if (CommonCSVCache[FullPath]) {
		buildDialog();
		return;
	}

	// Opens the file, parse it and returns the result it to build the dialog
	return CommonFetch(FullPath)
		.then(async (response) => {
			if (response.status !== 200) return;
			const text = await response.text();
			CommonCSVCache[FullPath] = CommonParseCSV(text);
			buildDialog();
		});
}

/**
 * Sets the clothes based on a character archetype
 * @param {Character} C - Character to set the clothes for
 * @param {"Maid" | "Mistress" | "Employee" | "AnimeGirl" | "Bunny" | "Succubus"} Archetype - Archetype to determine the clothes to put on
 * @param {BCColor} [ForceColor] - Color to use for the added clothes
 * @returns {void} - Nothing
 */
function CharacterArchetypeClothes(C, Archetype, ForceColor) {

	/**
	 * @param {Character} char
	 * @param {AssetName} asset
	 * @param {AssetGroupName} group
	 * @param {ItemColor} [color]
	 */
	const quickWear = (char, asset, group, color) => {
		InventoryWear(char, asset, group, color, undefined, undefined, undefined, false);
	};

	let addedItems = false;

	// Maid archetype
	if (Archetype == "Maid") {
		InventoryAdd(C, "MaidOutfit1", "Cloth", false);
		InventoryAdd(C, "MaidOutfit2", "Cloth", false);
		InventoryAdd(C, "MaidDress3", "Cloth", false);
		InventoryAdd(C, "MaidDress4", "Cloth", false);
		InventoryAdd(C, "MaidHairband1", "Hat", false);
		InventoryAdd(C, "MaidLatex", "Cloth", false);
		InventoryAdd(C, "MaidLatexHairband", "Hat", false);
		addedItems = true;
		const Outfit = Math.floor(Math.random() * 7); // Bigger odds of having the base maid outfit
		if (Outfit == 0) {
			quickWear(C, "MaidOutfit2", "Cloth");
			quickWear(C, "MaidHairband1", "Hat");
		} else if (Math.random() > 0.75) {
			quickWear(C, "MaidLatex", "Cloth", ['#202020', '#B0B0B0', 'Default']);
			quickWear(C, "MaidLatexHairband", "Hat");
		} else if (Outfit == 2) {
			quickWear(C, "MaidDress3", "Cloth");
			quickWear(C, "MaidHairband1", "Hat");
		} else if (Outfit == 3) {
			quickWear(C, "MaidDress4", "Cloth");
			quickWear(C, "MaidHairband1", "Hat");
		} else {
			quickWear(C, "MaidOutfit1", "Cloth");
			quickWear(C, "MaidHairband1", "Hat");
		}
		if (InventoryGet(C, "Socks") == null) quickWear(C, "Socks4", "Socks", "#AAAAAA");
		if (InventoryGet(C, "Shoes") == null) quickWear(C, "Shoes2", "Shoes", "#222222");
		if ((InventoryGet(C, "Gloves") == null) && (Math.random() > 0.5)) quickWear(C, "Gloves1", "Gloves", "#AAAAAA");
		InventoryRemove(C, "ClothAccessory", false);
		InventoryRemove(C, "HairAccessory1", false);
		InventoryRemove(C, "HairAccessory2", false);
		InventoryRemove(C, "HairAccessory3", false);
		InventoryRemove(C, "ClothLower", false);
		C.AllowItem = (LogQuery("LeadSorority", "Maid"));
	}

	// Mistress archetype
	if (Archetype == "Mistress") {
		/** @type {HexColor[]} */
		let ColorList = ["#333333", "#AA4444", "#AAAAAA"];
		let Color = (ForceColor == null) ? CommonGetRandomItemFromList(ColorList) : ForceColor;
		InventoryAdd(C, "MistressGloves", "Gloves", false);
		InventoryAdd(C, "MistressBoots", "Shoes", false);
		InventoryAdd(C, "MistressTop", "Cloth", false);
		InventoryAdd(C, "MistressBottom", "ClothLower", false);
		InventoryAdd(C, "MistressPadlock", "ItemMisc", false);
		InventoryAdd(C, "MistressTimerPadlock", "ItemMisc", false);
		InventoryAdd(C, "MistressPadlockKey", "ItemMisc", false);
		InventoryAdd(C, "DeluxeBoots", "Shoes", false);
		addedItems = true;
		quickWear(C, "MistressGloves", "Gloves", Color);
		quickWear(C, "MistressBoots", "Shoes", Color);
		quickWear(C, "MistressTop", "Cloth", Color);
		quickWear(C, "MistressBottom", "ClothLower", Color);
		InventoryRemove(C, "Hat", false);
		InventoryRemove(C, "ClothAccessory", false);
		InventoryRemove(C, "HairAccessory1", false);
		InventoryRemove(C, "HairAccessory2", false);
		InventoryRemove(C, "HairAccessory3", false);
		InventoryRemove(C, "Socks", false);
	}

	// Employee archetype
	if (Archetype == "Employee") {
		InventoryAdd(C, "VirginKiller1", "Cloth", false);
		InventoryAdd(C, "Jeans1", "ClothLower", false);
		InventoryAdd(C, "SunGlasses1", "Glasses", false);
		addedItems = true;
		quickWear(C, "VirginKiller1", "Cloth", "Default");
		quickWear(C, "Jeans1", "ClothLower", "Default");
		quickWear(C, "SunGlasses1", "Glasses", "Default");
	}

	// Anime girl archetype
	if (Archetype == "AnimeGirl") {
		CharacterNaked(C, false);
		InventoryAdd(C, "AnimeGirl", "Cloth", false);
		InventoryAdd(C, "AnimeGirlNecklace", "Necklace", false);
		InventoryAdd(C, "AnimeGirlBoots", "Shoes", false);
		InventoryAdd(C, "AnimeGirlTiara", "Hat", false);
		InventoryAdd(C, "AnimeGirlGloves", "Gloves", false);
		InventoryAdd(C, "AnimeGirlWand", "ItemHandheld", false);
		addedItems = true;
		quickWear(C, "Panties1", "Panties", "#CCCCCC");
		quickWear(C, "Bra1", "Bra", "#CCCCCC");
		quickWear(C, "AnimeGirl", "Cloth");
		quickWear(C, "AnimeGirlNecklace", "Necklace");
		quickWear(C, "AnimeGirlBoots", "Shoes");
		quickWear(C, "AnimeGirlTiara", "Hat");
		quickWear(C, "AnimeGirlGloves", "Gloves");
		if (C.CanInteract()) {
			if (Math.random() >= 0.5) {
				quickWear(C, "AnimeGirlWand", "ItemHandheld");
			} else {
				InventoryRemove(C, "ItemHandheld", false);
			}
		}
	}

	// Rope bunny archetype
	if (Archetype == "Bunny") {
		CharacterNaked(C, false);
		quickWear(C, CommonGetRandomItemFromList(["BunnySuit", "LatexBunnySuit"]), "Bra", CommonGetRandomItemFromList(["Default", "#BBBBBB", "#222222", "#882222", "#BB8888", "#BB00BB"]));
		quickWear(C, "BunnyCollarCuffs", "ClothAccessory");
		quickWear(C, CommonGetRandomItemFromList(["BunnyEars1", "BunnyEars2"]), "HairAccessory1");
		quickWear(C, "BunnyTailStrap", "TailStraps");
		if (Math.random() > 0.5) quickWear(C, "Pantyhose1", "Socks");
		quickWear(C, CommonGetRandomItemFromList(["AnkleStrapShoes", "StilettoHeels", "Shoes5"]), "Shoes");
	}

	// Succubus archetype
	if (Archetype == "Succubus") {
		CharacterNaked(C, false);
		let Color = CommonGetRandomItemFromList(/** @type {const} */(["Default", "#222222", "#BBBBBB", "#882222"]));
		quickWear(C, CommonGetRandomItemFromList(["BondageDress1", "BondageDress2", "CorsetDress", "EveningGown", "Dress3"]), "Cloth", Color);
		quickWear(C, CommonGetRandomItemFromList(["CatEye", "CatEye2", "LargeSolid", "SuperstarBlurred", "UndershadowedSolid"]), "EyeShadow", Color);
		if (Math.random() > 0.5) {
			quickWear(C, CommonGetRandomItemFromList(["GradientPantyhose", "Socks5", "Stockings1", "Stockings2"]), "Socks", Color);
			quickWear(C, "SuccubusHorns", "HairAccessory1", Color);
		}
		quickWear(C, CommonGetRandomItemFromList(["SuccubusTailStrap", "SuccubusHeartTailStrap"]), "TailStraps", Color);
		quickWear(C, CommonGetRandomItemFromList(["BatWings", "DevilWings", "SuccubusWings"]), "Wings", Color);
		quickWear(C, CommonGetRandomItemFromList(["AnkleStrapShoes", "StilettoHeels", "Shoes5", "CustomHeels", "ThighBoots"]), "Shoes", Color);
	}

	CharacterRefresh(C);
	if (C.IsPlayer() && addedItems) {
		ServerPlayerInventorySync();
	}
}

/**
 * Loads an NPC into the character array. The appearance is randomized, and a type can be provided to dress them in a given style.
 * @template {ModuleType} T
 * @param {string} CharacterID - The unique identifier for the NPC
 * @param {null | string} [NPCType] - The dialog used by the NPC.  Defaults to CharacterID if not specified.
 * @param {null | T} module
 * @param {null | ModuleScreens[T]} screen
 * @returns {NPCCharacter} - The randomly generated NPC
 */
function CharacterLoadNPC(CharacterID, NPCType=null, module=null, screen=null) {
	NPCType ??= CharacterID;

	// Checks if the NPC already exists and returns it if it's the case
	const duplicate = Character.find(c => c.CharacterID === CharacterID);
	if (duplicate) return /** @type {NPCCharacter} */ (duplicate);

	// Randomize the new character
	const C = /** @type {NPCCharacter} */ (CharacterCreate("Female3DCG", CharacterType.NPC, CharacterID));
	C.AccountName = NPCType;
	// XXX: should be awaited here
	CommonPromiseCatch(CharacterLoadCSVDialog(C, { module: module ?? CurrentModule, screen: screen ?? CurrentScreen, name: NPCType }));
	C.Name = CharacterGenerateRandomName();
	CharacterAppearanceFullRandom(C);
	C.Love = 0;
	C.Trait = [];

	// Sets archetype clothes
	if (NPCType.indexOf("Maid") >= 0) CharacterArchetypeClothes(C, "Maid");
	if (NPCType.indexOf("Employee") >= 0) CharacterArchetypeClothes(C, "Employee");
	if (NPCType.indexOf("Mistress") >= 0) CharacterArchetypeClothes(C, "Mistress");

	// Returns the new character
	return C;

}

/**
 * Create a minimal character object
 * @param {string} CharacterID - The account name to give to the character
 * @returns {Character} - The created character
 */
function CharacterLoadSimple(CharacterID) {
	// Checks if the character already exists and returns it if it's the case
	const duplicate = Character.find(c => c.CharacterID === CharacterID);
	if (duplicate) return duplicate;

	// Create the new character
	const C = CharacterCreate("Female3DCG", CharacterType.SIMPLE, CharacterID);

	// Returns the new character
	return C;
}

/**
 * Sets up an online character
 * @param {OnlineCharacter} Char - Online character to set up
 * @param {ServerAccountDataSynced} data - Character data received
 * @param {number} SourceMemberNumber - Source number of the refresh
 */
function CharacterOnlineRefresh(Char, data, SourceMemberNumber) {
	if (!Char.IsPlayer() && Char.MemberNumber == SourceMemberNumber) {
		Char.Title = ServerAccountDataSyncedValidate.Title(data.Title, Char);
		Char.Nickname = ServerAccountDataSyncedValidate.Nickname(data.Nickname, Char);
		Char.AllowedInteractions = ServerAccountDataSyncedValidate.AllowedInteractions(data.AllowedInteractions ?? data.ItemPermission, Char);
		Char.ArousalSettings = ServerAccountDataSyncedValidate.ArousalSettings(data.ArousalSettings, Char);
		Char.OnlineSharedSettings = ServerAccountDataSyncedValidate.OnlineSharedSettings(data.OnlineSharedSettings, Char);
		Char.Game = ServerAccountDataSyncedValidate.Game(data.Game, Char);
		Char.MapData = ServerAccountDataSyncedValidate.MapData(data.MapData, Char);
		Char.Crafting = ServerAccountDataSyncedValidate.Crafting(data.Crafting, Char);
	}

	// Fully validated in the `ActivePose` setter
	Char.ActivePose = /** @type {readonly AssetPoseName[]} */(data.ActivePose ?? []);

	Char.LabelColor = ServerAccountDataSyncedValidate.LabelColor(data.LabelColor, Char);
	Char.Creation = ServerAccountDataSyncedValidate.Creation(data.Creation, Char);
	Char.Description = ServerAccountDataSyncedValidate.Description(data.Description, Char);
	Char.Ownership = ServerAccountDataSyncedValidate.Ownership(data.Ownership, Char);
	Char.Lovership = ServerAccountDataSyncedValidate.Lovership(data.Lovership, Char);
	Char.Reputation = ServerAccountDataSyncedValidate.Reputation(data.Reputation, Char);
	if (!Char.IsPlayer()) {
		Char.PermissionItems = ServerUnPackItemPermissions(data, Char.GetDifficulty() >= 3).permissions;
		Char.WhiteList = ServerAccountDataSyncedValidate.WhiteList(data.WhiteList, Char);
		Char.BlackList = ServerAccountDataSyncedValidate.BlackList(data.BlackList, Char);
	}

	const oldPronouns = Char.GetPronouns();
	const currentAppearance = Char.Appearance;
	LoginPerformAppearanceFixups(data.Appearance ?? []);
	ServerAppearanceLoadFromBundle(Char, "Female3DCG", data.Appearance ?? [], SourceMemberNumber);
	CharacterAppearanceResolveSync(Char, currentAppearance);

	if (Char.IsPlayer()) LoginValidCollar();
	//if ((!Char.IsPlayer()) && ((Char.MemberNumber == SourceMemberNumber) || (Char.Inventory == null) || (Char.Inventory.length == 0))) InventoryLoad(Char, data.Inventory);
	if ((!Char.IsPlayer()) && (Char.MemberNumber == SourceMemberNumber) && (data.InventoryData != null) && (data.InventoryData != "") && (data.InventoryData != Char.InventoryData)) {
		Char.InventoryData = data.InventoryData;
		const items = InventoryLoadCompressedData(data.InventoryData);
		InventoryAddMany(Char, items, false);
	}

	const newPronouns = Char.GetPronouns();
	if (oldPronouns !== undefined && oldPronouns !== newPronouns) {
		// Reload the dialog so the new gender takes effect
		// Don't reload in initialization (when oldPronouns is undefined), which breaks translation
		CommonPromiseCatch(CharacterLoadCSVDialog(Char, { module: "Online", screen: "ChatRoom", name: "Online" }));
	}
	CharacterLoadEffect(Char);
	CharacterRefresh(Char);
}

/**
 * Loads an online character and flags it for a refresh if any data was changed
 * @param {ServerAccountDataSynced} data - Character data received
 * @param {number} SourceMemberNumber - Source number of the load trigger
 * @returns {OnlineCharacter} - The reloaded character
 */
function CharacterLoadOnline(data, SourceMemberNumber) {

	// Check if the character already exists to reuse it
	/** @type {OnlineCharacter | undefined} */
	let Char = data.ID.toString() == Player.CharacterID ? Player : /** @type {OnlineCharacter | undefined} */ (Character.find(c => c.CharacterID === data.ID));

	// We have to do that validation here because Description is one of the keys we check to decide
	// whether to refresh or not; our currently in-memory character has it decoded, so we have to decode
	// this as well.
	data.Description = ServerAccountDataSyncedValidate.Description(data.Description, Player);

	if (Array.isArray(data.WhiteList)) {
		data.WhiteList.sort((a, b) => a - b);
	}
	if (Array.isArray(data.BlackList)) {
		data.BlackList.sort((a, b) => a - b);
	}

	// If the character isn't found
	if (!Char) {
		// We delete the duplicate character if the person relogged.
		const duplicate = Character.find(c => c.MemberNumber === data.MemberNumber);
		if (duplicate) {
			CharacterDelete(duplicate);
		}

		// Creates the new character from the online template
		Char = /** @type {OnlineCharacter} */ (CharacterCreate("Female3DCG", CharacterType.ONLINE, data.ID));
		Char.Name = data.Name;
		Char.Lover = ServerAccountDataSyncedValidate.Lover(data.Lover, Char);
		Char.Owner = ServerAccountDataSyncedValidate.Owner(data.Owner, Char);
		Char.Title = ServerAccountDataSyncedValidate.Title(data.Title, Char);
		Char.Nickname = ServerAccountDataSyncedValidate.Nickname(data.Nickname, Char);
		Char.AccountName = "Online-" + data.ID.toString();
		Char.MemberNumber = data.MemberNumber;
		Char.Difficulty = ServerAccountDataSyncedValidate.Difficulty(data.Difficulty, Char);
		Char.AllowItem = false;
		CommonPromiseCatch(CharacterLoadCSVDialog(Char, { module: "Online", screen: "ChatRoom", name: "Online" }));
		CharacterOnlineRefresh(Char, data, SourceMemberNumber);
	} else {

		// If we must add a character, we refresh it
		let Refresh = !ChatRoomData?.Character.some(c => c.ID.toString() === data.ID.toString());

		// Flags "refresh" if we need to redraw the character
		if (!Refresh)
			if ((Char.Description != data.Description) || (Char.Title != data.Title) || (Char.Nickname != data.Nickname) || (Char.LabelColor != data.LabelColor) || (ChatRoomData?.Character == null))
				Refresh = true;
			else
				for (let C = 0; C < ChatRoomData.Character.length; C++)
					if (ChatRoomData.Character[C].ID == data.ID)
						if (ChatRoomData?.Character[C]?.Appearance?.length != data.Appearance?.length)
							Refresh = true;
						else
							for (let A = 0; A < (data.Appearance?.length ?? 0) && !Refresh; A++) {
								const Old = ChatRoomData?.Character[C]?.Appearance?.[A];
								const New = data.Appearance?.[A];
								if ((New?.Name !== Old?.Name) || (New?.Group !== Old?.Group) || JSON.stringify(New?.Color) !== JSON.stringify(Old?.Color)) Refresh = true;
								else if ((New?.Property != null) && (Old?.Property != null) && (JSON.stringify(New?.Property) !== JSON.stringify(Old.Property))) Refresh = true;
								else if (((New?.Property != null) && (Old?.Property == null)) || ((New?.Property == null) && (Old?.Property != null))) Refresh = true;
							}

		// Flags "refresh" if the ownership or lovership or inventory or blockitems or limiteditems has changed
		if (!Refresh && (JSON.stringify(Char.ActivePose) !== JSON.stringify(data.ActivePose))) Refresh = true;
		if (!Refresh && (JSON.stringify(Char.Ownership) !== JSON.stringify(data.Ownership))) Refresh = true;
		if (!Refresh && (JSON.stringify(Char.Lovership) !== JSON.stringify(data.Lovership))) Refresh = true;
		if (!Refresh && (JSON.stringify(Char.ArousalSettings) !== JSON.stringify(data.ArousalSettings))) Refresh = true;
		if (!Refresh && (JSON.stringify(Char.OnlineSharedSettings) !== JSON.stringify(data.OnlineSharedSettings))) Refresh = true;
		if (!Refresh && (JSON.stringify(Char.Game) !== JSON.stringify(data.Game))) Refresh = true;
		if (!Refresh && (JSON.stringify(Char.MapData) !== JSON.stringify(data.MapData))) Refresh = true;
		if (!Refresh && (JSON.stringify(Char.Crafting) !== JSON.stringify(data.Crafting))) Refresh = true;
		if (!Refresh && Array.isArray(data.WhiteList) && (JSON.stringify(Char.WhiteList) !== JSON.stringify(data.WhiteList))) Refresh = true;
		if (!Refresh && Array.isArray(data.BlackList) && (JSON.stringify(Char.BlackList) !== JSON.stringify(data.BlackList))) Refresh = true;
		if (!Refresh && (data.BlockItems != null)) Refresh = true;
		if (!Refresh && (data.LimitedItems != null)) Refresh = true;
		if (!Refresh && (data.FavoriteItems != null)) Refresh = true;

		// If we must refresh
		if (Refresh) CharacterOnlineRefresh(Char, data, SourceMemberNumber);

	}

	// Returns the character
	return Char;

}

/**
 * Deletes a character from the cached list of characters
 * @param {Character} C - The character to remove from the character cache
 * @param {boolean} ClearCache - If we must clear the CSV cache or not (default to true)
 * @returns {void} - Nothing
 */
function CharacterDelete(C, ClearCache=true) {

	// Make sure the data is valid to delete
	if (!C) return;
	const idx = Character.findIndex(c => c.ID === C.ID);
	if (idx < 0) return;

	// Delete the cached dialog for that NPC.
	// Note that this requires `CharacterDelete` to be called with the screen that created the NPC up.
	// It's also debatable whether this does anything but always busting the cache, which is supposedly
	// static and customized by `CharacterLoadCSVDialog`.
	if (ClearCache) {
		const FullPath = "Screens/" + CurrentModule + "/" + CurrentScreen + "/Dialog_" + C.AccountName + ".csv";
		delete CommonCSVCache[FullPath];
	}

	// Removes the animation and character from the array
	AnimationPurge(Character[idx], true);
	Character.splice(idx, 1);

}

/**
 * Deletes all online characters from the character array
 * @returns {void} - Nothing
 */
function CharacterDeleteAllOnline() {
	const onlines = Character.filter(c => c.AccountName.startsWith("Online-"));
	for (const online of onlines) {
		CharacterDelete(online);
	}
}

/**
 * Refreshes the list of effects for a character. Each effect can only be found once in the effect array
 * @param {Character} C - Character for which to refresh the effect list
 * @returns {void} - Nothing
 */
function CharacterLoadEffect(C) {
	// Grab any old cached values if available
	// Do not call `GetBlindLevel()`, as that could potentially try to compute the _old_ blind level using an unrelated _new_ appearance
	const oldblindlevel = C._BlindLevel ??= 0;
	if (C.IsPlayer() && BlindFlashQueue) {
		// Compute the dark factor, which will internally use the _old_ blind level as (potentially) assigned above
		DrawLastDarkFactor = CharacterGetDarkFactor(C);
	}
	C._BlindLevel = undefined;
	C.Effect = CharacterGetEffects(C);
	if (C.IsPlayer() && BlindFlashQueue) {
		// Optional on `C.GraphicsSettings` because this can be called before login when showing the player avatar when creating a new account
		if (C.GraphicsSettings?.DoBlindFlash && oldblindlevel > 0 && C.GetBlindLevel() === 0) {
			DrawBlindFlash(oldblindlevel);
		}
		BlindFlashQueue = false;
	}

	CharacterLoadTints(C);
	CharacterLoadAttributes(C);
}

/**
 * Refreshes the character's attribute list
 * @param {Character} C
 * @returns {void} - Nothing
 */
function CharacterLoadAttributes(C) {
	/** @type {Set<AssetAttribute>} */
	const attributes = new Set();
	C.Attribute = [];
	for (const item of C.Appearance) {
		const itemAttrs = InventoryGetItemProperty(item, "Attribute") ?? [];
		for (const attribute of itemAttrs) {
			attributes.add(attribute);
		}
	}
	C.Attribute = Array.from(attributes);
}

/**
 * Returns a list of effects for a character from some or all groups
 * @param {Character} C - The character to check
 * @param {readonly AssetGroupName[]} [Groups] - Optional: The list of groups to consider. If none defined, check all groups
 * @param {boolean} [AllowDuplicates] - Optional: If true, keep duplicates of the same effect provided they're taken from different groups
 * @returns {EffectName[]} - A list of effects
 */
function CharacterGetEffects(C, Groups = undefined, AllowDuplicates = false) {
	/** @type {EffectName[]} */
	let totalEffects = [];
	C.Appearance
		.filter(A => !Array.isArray(Groups) || Groups.length == 0 || Groups.includes(A.Asset.Group.Name))
		.forEach(item => {
			/** @type {EffectName[]} */
			let itemEffects = [];
			if (item.Property && Array.isArray(item.Property.Effect)) {
				CommonArrayConcatDedupe(itemEffects, item.Property.Effect);
			}
			CommonArrayConcatDedupe(itemEffects, item.Asset.Effect);

			if (AllowDuplicates) {
				totalEffects = totalEffects.concat(itemEffects);
			} else {
				CommonArrayConcatDedupe(totalEffects, itemEffects);
			}
		});
	return totalEffects;
}

/**
 * Loads a character's tints, resolving tint definitions against items from the character's appearance
 * @param {Character} C - Character whose tints should be loaded
 * @returns {void} - Nothing
 */
function CharacterLoadTints(C) {
	// Tints on non-player characters don't have any effect right now, so don't bother loading them
	if (!C.IsPlayer()) {
		return;
	}

	/** @type {ResolvedTintDefinition[]} */
	const tints = [];
	for (const item of C.Appearance) {
		tints.push(...(InventoryGetItemProperty(item, "Tint") ?? []).map(({Color, Strength, DefaultColor}) => ({Color, Strength, DefaultColor, Item: item})));
	}
	C.Tints = tints;
}

/**
 * Loads a character's canvas by sorting its appearance and drawing it.
 * @param {Character} C - Character to load the canvas for
 * @returns {void} - Nothing
 */
function CharacterLoadCanvas(C) {
	// Reset the property that tracks if wearing a hidden item
	C.HasHiddenItems = false;

	// We add a temporary appearance and pose here so that it can be modified by hooks.  We copy the arrays so no hooks can alter the reference accidentally
	C.DrawAppearance = AppearanceItemParse(CharacterAppearanceStringify(C));
	C.DrawPoseMapping = { ...C.PoseMapping }; // Deep copy of pose record

	// Run BeforeSortLayers hook
	C.RunHooks("BeforeSortLayers");

	// Generates a layer array from the character's appearance array, sorted by drawing order
	C.AppearanceLayers = CharacterAppearanceSortLayers(C);

	// Build the masks for the character
	C.AppearanceMasks = CharacterAppearanceBuildMasks(C);

	// Run AfterLoadCanvas hooks
	C.RunHooks("AfterLoadCanvas");

	// Sets the total height modifier for that character
	CharacterAppearanceSetHeightModifiers(C);

	// Reload the canvas
	CharacterAppearanceBuildCanvas(C);
	C.MustDraw = false;
}

/**
 * Reloads all character canvases in need of being redrawn.
 * @returns {void} - Nothing
 */
function CharacterLoadCanvasAll() {
	for (let C = 0; C < Character.length; C++)
		if (Character[C].MustDraw) {
			CharacterLoadCanvas(Character[C]);
		}
}

/**
 * Sets the current character to have a dialog with.
 *
 * @param {Character} C - Character to have a conversation with
 * @param {null | { mode?: DialogMenuMode, selfMode?: DialogSelfMenuName }} options - The type of dialog- and dialog-self subscreen te open
 * @returns {void} - Nothing
 */
function CharacterSetCurrent(C, options=null) {
	options ??= {};
	CurrentCharacter = C;
	if (options.mode) {
		DialogMenuMode = options.mode;
	}
	if (options.selfMode) {
		DialogSelfMenuSelected = options.selfMode;
	}
	DialogLoad();
}

/**
 * A scaling factor for all money gains, effectively introducing wage inflation as more and more items are added to the shop.
 *
 * Proportional to the sum of all asset values divided by `50_000`.
 * @type {number}
 */
var CharacterMoneyFactor = 1.0;

/**
 * String subsitution helper for money changes referenced in character dialog
 * @type {CommonSubstituteReplacer}
 */
function CharacterDialogPatternSubstitutor(match, offset, replacement, string, _groups) {
	const { key: keyUnparsed, value: valueUnparsed } = /** @type {{ key?: string, value?: string }} */(_groups ?? {});

	if (!keyUnparsed) {
		return "";
	}
	const key = keyUnparsed.toLowerCase();

	// `{foo}`-type patterns
	switch (key) {
		case "owner": {
			const name = Player.OwnerName();
			switch (Player.IsOwned()) {
				case "ggts":
					return `${name} (GGTS)`;
				case "npc":
					return `${name} (NPC)`;
				case "online":
					return `${name} (${Player.OwnerNumber()})`;
				default:
					return "";
			}
		}
	}

	// Remove surrounding quotation marks
	if (!valueUnparsed) {
		return "";
	}
	const value = (
		(valueUnparsed.startsWith("'") && valueUnparsed.endsWith("'"))
		|| (valueUnparsed.startsWith('"') && valueUnparsed.endsWith('"'))
	) ? valueUnparsed.slice(1, valueUnparsed.length - 1) : valueUnparsed;

	// `{foo=bar}`-type patterns
	switch (key) {
		case "money":
			// Need some explicit underscore special casing in order to support it as numeric superator here
			return CharacterMoneyFormat(Number(value.replaceAll("_", "")));
		case "lover": {
			const index = Number.parseInt(value, 10);
			const lover = Player.Lovership[index];
			return lover ? `${lover.Name} (${lover.MemberNumber ?? "NPC"})` : "";
		}
		default:
			return "";
	}
}

/**
 * Apply scaling factors to a change in money and format into a string, returning the absolute value
 * @param {number} value The money value
 * @returns {string}
 */
function CharacterMoneyFormat(value) {
	const money = CharacterMoneyApplyFactor(value);
	return Math.abs(money).toLocaleString(TranslationLanguage);
}

/**
 * Apply scaling factors to a change in money
 * @param {number} value The money value
 * @returns {number}
 */
function CharacterMoneyApplyFactor(value) {
	if (!CommonIsFinite(value)) { return 0; }
	const moneyFactor = value > 0 ? CharacterMoneyFactor * CheatFactor("DoubleMoney", 2) : 1;
	return Math.ceil(moneyFactor * value);
}

/**
 * Changes the character money and sync with the account server, factors in the cheaters version.
 * @param {Character} C - Character for which we are altering the money amount
 * @param {number} Value - Money to subtract/add
 * @returns {void} - Nothing
 */
function CharacterChangeMoney(C, Value) {
	C.Money += CharacterMoneyApplyFactor(Value);
	ServerPlayerSync();
}

/**
 * Refreshes the character parameters (Effects, poses, canvas, settings, etc.)
 * @param {Character} C - Character to refresh
 * @param {boolean} [Push] - Pushes the data to the server database if true or null.
 * Note that this will *not* push appearance changes to the rest of the chatroom,
 * which requires either {@link ChatRoomCharacterItemUpdate} or {@link ChatRoomCharacterUpdate}.
 * @param {boolean} [RefreshDialog] - Refreshes the character dialog
 * @returns {void} - Nothing
 */
function CharacterRefresh(C, Push = true, RefreshDialog = true) {
	AnimationPurge(C, false);
	CharacterLoadEffect(C);
	PoseRefresh(C);
	CharacterLoadCanvas(C);
	// Label often looped through checks:
	C.RunScripts = (
		!C.IsOnline()
		|| C.IsPlayer()
		|| !Player.OnlineSettings.DisableAnimations
	) && (
		!C.IsGhosted()
	);
	C.HasScriptedAssets = !!C.Appearance.find(CA => CA.Asset.DynamicScriptDraw);

	if (C.IsPlayer()) {
		// Grab the first custom background that we can find
		const customBGItem = C.Appearance.find(item => typeof item.Property?.CustomBlindBackground === "string");
		if (customBGItem?.Property?.CustomBlindBackground !== null) {
			C.CustomBackground = customBGItem ? customBGItem.Property?.CustomBlindBackground : undefined;
		}
	}

	if (C.IsPlayer() && Push) {
		ChatRoomRefreshChatSettings();
		ServerPlayerAppearanceSync();
	}
	// Also refresh the current dialog menu if the refreshed character is the current character.
	// An exception is made for the `dialog` menu mode, as the relevant dialog is _always_ stored on the dialog partner (which may or may not be `C`)
	const Current = CharacterGetCurrent();
	if (
		RefreshDialog
		&& Current
		&& (C.ID === Current.ID || DialogMenuMode === "dialog")
	) {
		CharacterRefreshDialog(C);
	}

	// Ensure that any color and/or opacity changes that occur while one is wearing `ItemColorItem`
	// are sanitized, ensuring that aforementioned properties are represented via their array-based variant
	if (ItemColorItem && C.Appearance.includes(ItemColorItem)) {
		ItemColorItem = CommonAssign(
			ItemColorItem,
			{ Color: ItemColorSanitizeColor(ItemColorItem), Property: ItemColorSanitizeProperty(ItemColorItem) },
		);
	}
}

/**
 * Refresh the character's dialog state.
 *
 * This function restore consistency between its state variables and the new character appearance,
 * like making sure the focused items are still present and deselecting them otherwise.
 *
 * @param {Character} C - Character to refresh
 * @returns {void} - Nothing
 */
function CharacterRefreshDialog(C) {
	// Get a reference to the currently focused item
	const focusItem = C && C.FocusGroup ? InventoryGet(C, C.FocusGroup.Name) : null;

	// Skip refreshing anything dialog-related when we're in the wardrobe
	if (DialogIsInWardrobe()) return;

	if (DialogMenuMode === "items" || DialogMenuMode === "activities" || DialogMenuMode === "permissions" || DialogMenuMode === "dialog") {
		// We were looking at some inventory, perform a soft reload to update the UI
		CommonPromiseCatch(DialogMenuMapping[DialogMenuMode].Reload());
	} else if (DialogMenuMode === "extended" || DialogMenuMode === "tighten") {
		if (!focusItem) {
			// Focused item was removed
			DialogLeaveFocusItem();
			return;
		}

		// We were looking at an extended screen
		const wasLock = DialogFocusItem && DialogFocusItem.Asset.IsLock;

		/** @type {Item | null} */
		let sourceItem;

		// Checks if we got on the tighten/loosen screen via the button in items screen
		if (DialogMenuMode === "tighten" && DialogTightenLoosenItem) {
			sourceItem = DialogTightenLoosenItem;
		} else {
			sourceItem = wasLock ? DialogFocusSourceItem : DialogFocusItem;
		}

		const previousItem = sourceItem ? InventoryGet(C, sourceItem.Asset.Group.Name) : null;
		if (!previousItem || previousItem.Asset.Name !== focusItem.Asset.Name) {
			// Unable to reload the source item, or it's different now
			DialogLeaveFocusItem();
			return;
		}

		const lock = InventoryGetLock(focusItem);
		if (wasLock && !lock) {
			// The lock on the focused item was removed
			DialogLeaveFocusItem();
			return;
		} else if (!(wasLock ? (lock && lock.Asset.Extended) : focusItem.Asset.Extended)) {
			// Shouldn't happen but we don't want to open an extended screen on that
			DialogChangeMode("items");
			return;
		}

		// Replace the focus items from underneath us so we get the updated data
		[DialogFocusItem, DialogFocusSourceItem] = wasLock ? [lock, focusItem] : [focusItem, null];

		// Reset the cached extended item requirement checks
		if (/** @type {Item} */ (DialogFocusItem).Asset.Extended) {
			ExtendedItemRequirementCheckMessageMemo.clearCache();
		}
	} else if (DialogMenuMode === "colorItem") {
		const itemRemovedOrDifferent = !focusItem || ItemColorItem && InventoryGetItemProperty(ItemColorItem, "Name") !== InventoryGetItemProperty(focusItem, "Name");
		if (itemRemovedOrDifferent) {
			ItemColorCancelAndExit();
			DialogChangeMode("items");
			return;
		}
	} else if (DialogMenuMode === "locking" || DialogMenuMode === "locked") {
		if (!focusItem || DialogMenuMode === "locked" && !DialogCanCheckLock(C, focusItem)) {
			// Focused item was removed, or lost its lock
			DialogChangeMode("items");
		} else {
			// Refresh by resetting the mode
			DialogChangeMode(DialogMenuMode);
		}
	} else if (DialogMenuMode === "crafted") {
		// Automatically updates in DialogDraw()
	}
}

/**
 * Checks if a character is wearing items (restraints), the slave collar is ignored.
 * @param {Character} C - Character to inspect the appearance of
 * @returns {boolean} - Returns TRUE if the given character is wearing an item
 */
function CharacterHasNoItem(C) {
	for (let A = 0; A < C.Appearance.length; A++)
		if ((C.Appearance[A].Asset != null) && (C.Appearance[A].Asset.Group.Category == "Item"))
			if (C.Appearance[A].Asset.Group.Name != "ItemNeck" || (C.Appearance[A].Asset.Group.Name == "ItemNeck" && !InventoryOwnerOnlyItem(C.Appearance[A])))
				return false;
	return true;
}

/**
 * Checks if a character is naked
 * @param {Character} C - Character to inspect the appearance of
 * @returns {boolean} - Returns TRUE if the given character is naked
 */
function CharacterIsNaked(C) {
	for (const A of C.Appearance)
		if (
			(A.Asset != null) &&
			// Ignore items
			(A.Asset.Group.Category == "Appearance") &&
			// Ignore body parts
			A.Asset.Group.AllowNone &&
			// Always ignore all cosplay items
			!A.Asset.BodyCosplay &&
			!A.Asset.Group.BodyCosplay &&
			// Ignore cosplay items if they are considered bodypart (BlockBodyCosplay)
			(
				C.IsNpc() ||
				!(
					A.Asset.Group.BodyCosplay &&
					C.OnlineSharedSettings &&
					C.OnlineSharedSettings.BlockBodyCosplay
				)
			)
		)
			return false;
	return true;
}

/**
 * Checks if a character is in underwear
 * @param {Character} C - Character to inspect the appearance of
 * @returns {boolean} - Returns TRUE if the given character is at most in underwear (can be naked)
 */
function CharacterIsInUnderwear(C) {
	for (let A = 0; A < C.Appearance.length; A++)
		if ((C.Appearance[A].Asset != null) && (C.Appearance[A].Asset.Group.Category == "Appearance") && C.Appearance[A].Asset.Group.AllowNone && !C.Appearance[A].Asset.BodyCosplay && !C.Appearance[A].Asset.Group.BodyCosplay)
			if (!C.Appearance[A].Asset.Group.Underwear)
				if (C.IsNpc() || !(C.Appearance[A].Asset.Group.BodyCosplay && C.OnlineSharedSettings && C.OnlineSharedSettings.BlockBodyCosplay))
					return false;
	return true;
}

/**
 * Removes all appearance items from the character
 * @param {Character} C - Character to undress
 * @param {boolean} refresh - Whether to refresh the character afterwards and push changes to the server database
 * @returns {void} - Nothing
 */
function CharacterNaked(C, refresh=true) {
	CharacterAppearanceNaked(C);
	if (refresh) {
		CharacterRefresh(C);
	}
}

/**
 * Dresses the given character in random underwear
 * @param {Character} C - Character to randomly dress
 * @returns {void} - Nothing
 */
function CharacterRandomUnderwear(C) {

	// Clear the current clothes
	const items = C.Appearance.filter(item => item.Asset.Group.IsAppearance() && item.Asset.Group.AllowNone);
	InventoryRemoveItems(C, items);

	// Generate random undies at a random color
	/** @type {"" | BCColor} */
	var Color = "";
	for (const G of AssetGroup)
		if ((G.Category == "Appearance") && G.Underwear && (G.IsDefault || (Math.random() < 0.2))) {
			if (Color == "") Color = CommonRandomItemFromList("Default", G.ColorSchema);
			const Group = G.Asset
				.filter(A => InventoryAvailable(C, A.Name, G.Name));
			if (Group.length > 0)
				CharacterAppearanceSetItem(C, G.Name, Group[Math.floor(Group.length * Math.random())], Color);
		}

	// Refreshes the character
	CharacterRefresh(C);

}

/**
 * Removes all appearance items from the character except underwear
 * @param {Character} C - Character to undress partially
 * @param {readonly Item[]} Appearance - Appearance array to remove clothes from
 * @returns {void} - Nothing
 */
function CharacterUnderwear(C, Appearance) {
	CharacterAppearanceNaked(C);
	for (let A = 0; A < Appearance.length; A++)
		if ((Appearance[A].Asset != null) && Appearance[A].Asset.Group.Underwear && (Appearance[A].Asset.Group.Category == "Appearance"))
			C.Appearance.push(Appearance[A]);
	CharacterRefresh(C);
}

/**
 * Redresses a character based on a given appearance array
 * @param {Character} C - Character to redress
 * @param {readonly Item[]} Appearance - Appearance array to redress the character with
 * @returns {void} - Nothing
 */
function CharacterDress(C, Appearance) {
	if ((Appearance != null) && (Appearance.length > 0)) {
		for (let A = 0; A < Appearance.length; A++)
			if ((Appearance[A].Asset != null) && (Appearance[A].Asset.Group.Category == "Appearance"))
				if (InventoryGet(C, Appearance[A].Asset.Group.Name) == null)
					C.Appearance.push(Appearance[A]);
		CharacterRefresh(C);
	}
}

/**
 * Removes all binding items from a given character
 * @param {Character} C - Character to release
 * @param {boolean} [refresh] - do not call CharacterRefresh if false
 * @returns {void} - Nothing
 */
function CharacterRelease(C, refresh=true) {
	const items = C.Appearance.filter(item => item.Asset.IsRestraint);
	InventoryRemoveItems(C, items, { refresh });
}

/**
 * Releases a character from all locks matching the given lock name
 * @param {Character} C - Character to release from the lock(s)
 * @param {AssetLockType} LockName - Name of the lock to look for
 * @returns {void} - Nothing
 */
function CharacterReleaseFromLock(C, LockName) {
	for (let A = 0; A < C.Appearance.length; A++)
		if (C.Appearance[A].Property?.LockedBy === LockName)
			InventoryUnlock(C, C.Appearance[A]);
}

/**
 * Releases a character from all restraints that are not locked
 * @param {Character} C - Character to release
 * @returns {void} - Nothing
 */
function CharacterReleaseNoLock(C) {
	const items = C.Appearance.filter(item => item.Asset.IsRestraint && !item.Property?.LockedBy);
	InventoryRemoveItems(C, items);
}

/**
 * Removes all items except for clothing and slave collars from the character
 * @param {Character} C - Character to release
 * @param {boolean} refresh - Whether to refresh the character afterwards and push changes to the server database
 * @returns {void} - Nothing
 */
function CharacterReleaseTotal(C, refresh=true) {
	const items = C.Appearance.filter(item => {
		if (item.Asset.Name === "SlaveCollar" && C.IsOwned()) {
			// Reset slave collar to the default model if it has a gameplay effect (such as gagging the player)
			if (item.Property?.Effect?.length) {
				item.Property = CommonCloneDeep(InventoryItemNeckSlaveCollarTypes[0].Property);
			}
			return false;
		} else {
			return item.Asset.Group.IsItem();
		}
	});
	InventoryRemoveItems(C, items, { refresh });
}

/**
 * Gets the bonus amount of a given type for a given character (Kidnap league)
 * @param {Character} C - Character for which we want to get the bonus amount
 * @param {string} BonusType - Type/name of the bonus to look for
 * @returns {number} - Active bonus amount for the bonus type
 */
function CharacterGetBonus(C, BonusType) {
	var Bonus = 0;
	for (let I = 0; I < C.Inventory.length; I++)
		if ((C.Inventory[I].Asset != null) && (C.Inventory[I].Asset.Bonus != null) && (C.Inventory[I].Asset.Bonus == BonusType))
			Bonus++;
	return Bonus;
}

/**
 * Restrains a character with random restraints. Some restraints are specifically disabled for randomization in their definition.
 * @param {Character} C - The target character to restrain
 * @param {"FEW"|"LOT"|"ALL"} [Ratio] - Amount of restraints to put on the character
 * @param {boolean} [Refresh] - do not call CharacterRefresh if false
 */
function CharacterFullRandomRestrain(C, Ratio, Refresh) {

	// Sets the ratio depending on the parameter
	var RatioRare = 0.75;
	var RatioNormal = 0.25;
	if (Ratio != null) {
		if (Ratio.trim().toUpperCase() == "FEW") { RatioRare = 1; RatioNormal = 0.5; }
		if (Ratio.trim().toUpperCase() == "LOT") { RatioRare = 0.5; RatioNormal = 0; }
		if (Ratio.trim().toUpperCase() == "ALL") { RatioRare = 0; RatioNormal = 0; }
	}

	// Apply each item if needed
	if (!InventoryGet(C, "ItemArms")) InventoryWearRandom(C, "ItemArms", undefined, false);
	if ((Math.random() >= RatioRare) && !InventoryGet(C, "ItemHead")) InventoryWearRandom(C, "ItemHead", undefined, false);
	if ((Math.random() >= RatioNormal) && !InventoryGet(C, "ItemMouth")) InventoryWearRandom(C, "ItemMouth", undefined, false);
	if ((Math.random() >= RatioRare) && !InventoryGet(C, "ItemNeck")) InventoryWearRandom(C, "ItemNeck", undefined, false);
	if ((Math.random() >= RatioNormal) && !InventoryGet(C, "ItemLegs")) InventoryWearRandom(C, "ItemLegs", undefined, false);
	if ((Math.random() >= RatioNormal) && !C.IsKneeling() && !InventoryGet(C, "ItemFeet")) InventoryWearRandom(C, "ItemFeet", undefined, false);

	if (Refresh || Refresh == null) CharacterRefresh(C);

}

/**
 * Sets a specific facial expression on the character's specified AssetGroup.
 *
 * If there's a timer, the expression will expire after it. Note that a timed expression cannot override another one.
 *
 * Be careful that "Eyes" for this function means both eyes. Use Eyes1/Eyes2 to target the left or right one only.
 *
 * @param {Character} C - Character for which to set the expression of
 * @param {ExpressionGroupName | "Eyes1"} AssetGroup - Asset group for the expression
 * @param {ExpressionName | undefined} Expression - Name of the expression to use
 * @param {number} [Timer] - Optional: time the expression will last, in seconds. Will send a null expression to expression queue. If expression to set is null, this is ignored.
 * @param {ItemColor} [Color] - Optional: color of the expression to set
 * @param {boolean} [fromQueue] - Internal: used to skip queuing the expression change if it comes from the queued expressions
 * @returns {void} - Nothing
 */
function CharacterSetFacialExpression(C, AssetGroup, Expression, Timer, Color, fromQueue=false) {
	// A normal eye expression is triggered for both eyes
	if (AssetGroup == "Eyes") CharacterSetFacialExpression(C, "Eyes2", Expression, Timer, Color);
	if (AssetGroup == "Eyes1") AssetGroup = "Eyes";

	const item = InventoryGet(C, AssetGroup);
	if (!item || !item.Asset.Group.AllowExpression) return;

	if (Expression != null && !item.Asset.Group.AllowExpression.includes(Expression)) return;

	if (!item.Property) item.Property = {};
	if (item.Property.Expression == Expression && (!Color || item.Color == Color)) return;

	item.Property.Expression = Expression;
	if (Color && CommonColorIsValid(Color)) item.Color = Array(item.Asset.ColorableLayerCount).fill(Color);;
	// Remove all queued expression for that group if it's not coming from the queue
	if (!fromQueue && C.ExpressionQueue) {
		C.ExpressionQueue = C.ExpressionQueue.filter(({ Group }) => Group !== AssetGroup);
	}
	// We should not have timers to null a null expression
	if (Timer != null && Expression != null) {
		TimerExpressionQueuePush(C, AssetGroup, Timer, null);
	}

	// The usual weird sync-dance: if we're in a chat room, then C isn't an NPC and we can skip doing a
	// push-refresh in favor of only a local-refresh plus an expression update if its a transient/animated change,
	// otherwise we do a whole character update to get the appearance saved.
	const inChatRoom = ServerPlayerIsInChatRoom();
	const isTransient = Timer != null || fromQueue;

	CharacterRefresh(C, !inChatRoom && !isTransient, false);
	if (inChatRoom && (C.IsOnline() || C.IsPlayer())) {
		if (isTransient || C.IsPlayer()) {
			ChatRoomCharacterExpressionUpdate(C, AssetGroup);
		} else {
			ChatRoomCharacterUpdate(C);
		}
	}
}

/**
 * Resets the character's facial expression to the default
 * @param {Character} C - Character for which to reset the expression of
 * @returns {void} - Nothing
 */
function CharacterResetFacialExpression(C) {
	for (const item of C.Appearance) {
		const group = item.Asset.Group;
		if (group.IsAppearance() && group.AllowExpression) {
			let name = /** @type {ExpressionGroupName | "Eyes1"} */ (group.Name);
			if (name === "Eyes") {
				// Set group name for CharacterSetFacialExpression to avoid overwriting right eye colour
				name = "Eyes1";
			}
			const color = item.Color;
			CharacterSetFacialExpression(C, name, null, undefined, color);
		}
	}
}

/**
 * Checks if a given expression is disallowed on a character
 * @param {Character} C
 * @param {Item} Item
 * @param {null | ExpressionName} Expression
 * @returns {null | "InternalError" | "IllegalExpression" | ReturnType<typeof InventoryPrerequisiteMessage>}- An exit status or `null` if the expression is otherwise allowed
 */
function CharacterIsExpressionDisallowed(C, Item, Expression) {
	if (!C || !Item) return "InternalError";

	const allowedExpr = InventoryGetItemProperty(Item, "AllowExpression", true) ?? [];
	const exprPres = InventoryGetItemProperty(Item, "ExpressionPrerequisite", true) ?? [];
	const exprPre = exprPres[allowedExpr.indexOf(Expression)];
	const prereqMessage = !exprPre ? null : InventoryPrerequisiteMessage(C, exprPre, Item.Asset);

	if (Expression != null && !allowedExpr.includes(Expression)) {
		return "IllegalExpression";
	} else if (prereqMessage) {
		return prereqMessage;
	} else {
		return null;
	}
}

/**
 * Checks if a given expression is allowed on a character
 * @param {Character} C
 * @param {Item} Item
 * @param {ExpressionName} Expression
 */
function CharacterIsExpressionAllowed(C, Item, Expression) {
	return CharacterIsExpressionDisallowed(C, Item, Expression) == null;
}

/**
 * Gets the currently selected character
 * @returns {Character|null} - Currently selected character
 */
function CharacterGetCurrent() {
	const getCharacter = CharacterGetCurrentHandlers[CurrentScreen];
	if (getCharacter) {
		return getCharacter();
	} else {
		return (Player.FocusGroup != null) ? Player : CurrentCharacter;
	}
}

/**
 * Compresses a character wardrobe from an array to a LZ string to use less storage space
 * @param {readonly (ItemBundle[] | null)[]} Wardrobe - Uncompressed wardrobe
 * @returns {string} - The compressed wardrobe
 */
function CharacterCompressWardrobe(Wardrobe) {
	if (CommonIsArray(Wardrobe) && (Wardrobe.length > 0)) {
		var CompressedWardrobe = [];
		for (const outfit of Wardrobe) {
			/** @type {WardrobeItemBundle[]} */
			const Arr = [];
			for (const bundle of outfit ?? []) {
				Arr.push([bundle.Name, bundle.Group, bundle.Color, bundle.Property]);
			}
			CompressedWardrobe.push(Arr);
		}
		return LZString.compressToUTF16(JSON.stringify(CompressedWardrobe));
	} else return "";
}

/**
 * Decompresses a character wardrobe from a LZ String to an array if it was previously compressed (For backward compatibility with old
 * wardrobes)
 * @param {ItemBundle[][] | string} Wardrobe - The current wardrobe
 * @returns {ItemBundle[][]} - The array of wardrobe items decompressed
 */
function CharacterDecompressWardrobe(Wardrobe) {
	if (typeof Wardrobe !== "string") {
		return Wardrobe;
	}

	/** @type {WardrobeItemBundle[][]} */
	let compressedWardrobe;
	try {
		const data = LZString.decompressFromUTF16(Wardrobe);
		if (!data) throw new Error();
		const json = JSON.parse(data);
		if (!Array.isArray(json)) throw new Error();
		compressedWardrobe = /** @type {WardrobeItemBundle[][]} */ (json);
	} catch (error) {
		console.error("Failed to decompress the passed wardrobe", error);
		return [];
	}

	return compressedWardrobe.map(outfit => {
		return outfit.map(([ Name, Group, Color, Property ]) => {
			if (typeof Property?.Type === "string" && !CommonIsObject(Property?.TypeRecord)) {
				const asset = AssetGet("Female3DCG", Group, Name);
				if (!asset) {
					console.error(`unable to find ${Group}/${Name}, ignoring`);
				} else {
					Property.TypeRecord = ExtendedItemTypeToRecord(asset, Property.Type);
				}
			}
			return { Name, Group, Color, Property };
		}).filter(o => o);
	});
}

/**
 * Checks if the character is wearing an item that has a specific attribute
 * @param {Character} C - The character to test for
 * @param {AssetAttribute} Attribute - The name of the attribute that must be allowed
 * @returns {boolean} - TRUE if at least one item has that attribute
 */
function CharacterHasItemWithAttribute(C, Attribute) {
	return C.Appearance.some(item => {
		return InventoryGetItemProperty(item, "Attribute")?.includes(Attribute);
	});
}

/**
 * Checks if the character is wearing an item that allows for a specific activity
 * @param {Character} C - The character to test for
 * @param {ActivityName} Activity - The name of the activity that must be allowed
 * @returns {Item[]} - A list of items allowing that activity
 */
function CharacterItemsForActivity(C, Activity) {
	return C.Appearance.filter(item => {
		return Activity === "GagItem" && item.Asset.Group.Name.startsWith("ItemMouth")
			|| InventoryGetItemProperty(item, "AllowActivity")?.includes(Activity);
	});
}

/**
 * Checks if the character is wearing an item that allows for a specific activity
 * @param {Character} C - The character to test for
 * @param {ActivityName} Activity - The name of the activity that must be allowed
 * @returns {boolean} - TRUE if at least one item allows that activity
 */
function CharacterHasItemForActivity(C, Activity) {
	return CharacterItemsForActivity(C, Activity).length > 0;
}

/**
 * Checks if the character is edged or not. The character is edged if every equipped vibrating item on an orgasm zone has the "Edged" effect
 * @param {Character} C - The character to check
 * @returns {boolean} - TRUE if the character is edged, FALSE otherwise
 */
function CharacterIsEdged(C) {

	// Always returns false for others
	if (!C.IsPlayer() || !C.Effect.includes("Edged")) return false;

	// Get all zones that allow an orgasm
	/** @type {AssetGroupItemName[]} */
	let OrgasmZones = [];
	for (let Group of AssetGroup) {
		if (!Group.IsItem()) continue;
		if (Group.ArousalZoneID != null) {
			let Zone = PreferenceGetArousalZone(C, Group.Name);
			if (Zone && Zone.Orgasm && (Zone.Factor > 0))
				OrgasmZones.push(Zone.Name);
		}
	}

	// Get every vibrating item acting on an orgasm zone
	const VibratingItems = C.Appearance
		.filter(A => OrgasmZones.indexOf(A.Asset.ArousalZone) >= 0)
		.filter(Item => Item
			&& Item.Property
			&& Array.isArray(Item.Property.Effect)
			&& Item.Property.Effect.includes("Vibrating")
			&& typeof Item.Property.Intensity === "number"
			&& Item.Property.Intensity >= 0
		);

	// Return true if every vibrating item on an orgasm zone has the "Edged" effect
	return !!VibratingItems.length && VibratingItems.every(Item => Item.Property?.Effect?.includes("Edged"));

}

/**
 * Checks if the character is wearing an item flagged as a category in a blocked list
 * @param {Character} C - The character to validate
 * @param {readonly ServerChatRoomBlockCategory[]} BlockList - An array of strings to validate
 * @returns {boolean} - TRUE if the character is wearing a blocked item, FALSE otherwise
 */
function CharacterHasBlockedItem(C, BlockList) {
	if ((BlockList == null) || !CommonIsArray(BlockList) || (BlockList.length == 0)) return false;
	return BlockList.some(category => C.Appearance.some(item => item.Asset.Category?.some(itemCategory => category === itemCategory)));
}

/**
 * Retrieves the member numbers of the given character
 * @param {Character} C - The character to retrieve the lovers numbers from
 * @param {boolean} [MembersOnly] - Whether to omit NPC lovers - defaults to false (NPCs will be included by default)
 * @returns {(string | number)[]} - A list of member numbers or NPC account names representing the lovers of the
 * given character
 */
function CharacterGetLoversNumbers(C, MembersOnly) {
	return C.GetLoversNumbers(MembersOnly);
}

/**
 * Returns whether the character appears upside-down on the screen which may depend on the player's own inverted status
 * @param {Character} C - The character to check
 * @returns {boolean} - If TRUE, the character appears upside-down
 */
function CharacterAppearsInverted(C) {
	return Player.GraphicsSettings && Player.GraphicsSettings.InvertRoom ? Player.IsInverted() != C.IsInverted() : C.IsInverted();
}

/**
 * Checks whether the given character can kneel. {@link minimumStatus} determines to what extent the character must be able to kneel for this to pass.
 * @param {Character} C - The character to check
 * @param {PoseChangeStatus} [minimumStatus] - The threshold pose change status required for this check to succeed.
 * By default, the player must be able to kneel unaided, but this can be set lower (to allow struggling to kneel, aid, etc.).
 * @returns {boolean} - Returns true if the character's ability to kneel meets the specified threshold, false otherwise
 */
function CharacterCanKneel(C, minimumStatus = PoseChangeStatus.ALWAYS) {
	return PoseCanChangeUnaidedStatus(C, "Kneel") >= minimumStatus;
}

/**
 * Determines how much the character's view should be darkened based on their blind level. 1 is fully visible, 0 is pitch black.
 * @param {Character} C - The character to check
 * @param {boolean} [eyesOnly] - If TRUE only check whether the character has eyes closed, and ignore item effects
 * @returns {number} - The number between 0 (dark) and 1 (bright) that determines screen darkness
 */
function CharacterGetDarkFactor(C, eyesOnly = false) {
	let DarkFactor = 1.0;
	const blindLevel = C.GetBlindLevel(eyesOnly);
	if (blindLevel >= 3 && !C.Effect.includes('VRAvatars')) DarkFactor = 0.0;
	else if (CommonPhotoMode) DarkFactor = 1.0;
	else if (blindLevel === 2) DarkFactor = 0.15;
	else if (blindLevel === 1) DarkFactor = 0.3;
	return DarkFactor;
}

/**
 * Gets the array of color tints that should be applied for a character in RGBA format.
 * @param {Character} C - The character
 * @returns {RGBAColor[]} - A list of RGBA tints that are currently affecting the character
 */
function CharacterGetTints(C) {
	if (!C.HasTints()) {
		return [];
	}
	/** @type {RGBAColor[]} */
	const tints = C.Tints.map(({ Color, Strength, DefaultColor, Item }) => {
		/** @type {BCColor} */
		let colorCandidate;
		if (typeof Color === "string") {
			colorCandidate = Color;
		} else {
			const colorIndex = Color;

			// Plan A: grab the item's color at the specified index
			colorCandidate = Item.Color[colorIndex] ?? "Default";

			// Plan B: Plan A did not yield a hex color; grab the asset's default color instead
			if (!colorCandidate.startsWith("#")) {
				colorCandidate = Item.Asset.DefaultColor[colorIndex] ?? "Default";
			}

			// Plan C: Still no hex color; use the final fallback values
			if (!colorCandidate.startsWith("#")) {
				colorCandidate = DefaultColor ?? Item.Asset.DefaultTint ?? "Default";
			}
		}

		// Plan D: abort if there's yet still no hex color
		if (CommonIsColor(colorCandidate)) {
			return { ...DrawHexToRGB(colorCandidate), a: CommonClamp(Strength, 0, 1) };
		} else {
			return undefined;
		}
	}).filter(i => i !== undefined);
	return tints.filter(({a}) => a > 0);
}

/**
 * Gets the clumsiness level of a character. This represents dexterity when interacting with locks etc. and can have a
 * maximum value of 5.
 * @param {Character} C - The character to check
 * @returns {number} - The clumsiness rating of the player, a number between 0 and 5 inclusive.
 */
function CharacterGetClumsiness(C) {
	let clumsiness = 0;
	if (!C.CanInteract()) clumsiness += 1;
	const armItem = InventoryGet(C, "ItemArms");
	if (armItem && armItem.Asset.IsRestraint && InventoryItemHasEffect(armItem, "Block")) clumsiness += 2;
	const handItem = InventoryGet(C, "ItemHands");
	if (handItem && handItem.Asset.IsRestraint && InventoryItemHasEffect(handItem, "Block")) clumsiness += 3;
	return Math.min(clumsiness, 5);
}

/**
 * Applies hooks to a character based on conditions
 * Future hooks go here
 * @param {Character} C - The character to check
 * @param {boolean} IgnoreHooks - Whether to remove some hooks from the player (such as during character dialog).
 * @returns {boolean} - If a hook was applied or removed
 */
function CharacterCheckHooks(C, IgnoreHooks) {
	var refresh = false;
	if (C && C.DrawAppearance) {
		if (!IgnoreHooks && Player.Effect.includes("VRAvatars") && C.Effect.includes("HideRestraints")) {
			// Then when that character enters the virtual world, register a hook to strip out restraint layers (if needed):
			const hideRestraintsHook = () => {
				C.DrawAppearance = C.DrawAppearance.filter((Layer) => !(Layer.Asset && Layer.Asset.IsRestraint));
				delete C.DrawPoseMapping.BodyHands;
			};

			if (C.RegisterHook("BeforeSortLayers", "HideRestraints", hideRestraintsHook))
				refresh = true;

		} else if (C.UnregisterHook("BeforeSortLayers", "HideRestraints"))
			refresh = true;


		// We use Appearance there so that the hook's registration is stable.
		// Otherwise it would get unregistered on a second draw pass as the asset has been correctly removed.
		if (C.Appearance.some(a => a.Asset && a.Asset.NotVisibleOnScreen && a.Asset.NotVisibleOnScreen.includes(CurrentScreen))) {
			const notVisibleOnScreenHook = () => {
				C.DrawAppearance = C.DrawAppearance.filter(item => !item.Asset.NotVisibleOnScreen || !item.Asset.NotVisibleOnScreen.includes(CurrentScreen));
			};
			if (C.RegisterHook("BeforeSortLayers", "NotVisibleOnScreen", notVisibleOnScreenHook))
				refresh = true;
		} else {
			if (C.UnregisterHook("BeforeSortLayers", "NotVisibleOnScreen"))
				refresh = true;
		}

		// Hook for layer visibility
		// Visibility is a string individual layers have. If an item has any layers with visibility, it should have the LayerVisibility: true property
		// We basically check the player's items and see if any are visible that have the LayerVisibility property.
		let LayerVisibility = C.DrawAppearance.some(a => a.Asset && a.Asset.LayerVisibility);

		if (LayerVisibility) {
			// Fancy logic is to use a different hook for when the character is focused
			const layerVisibilityHook = () => {
				const inDialog = (CurrentCharacter != null);
				C.AppearanceLayers = C.AppearanceLayers?.filter((Layer) => (
					!Layer.Visibility ||
					(Layer.Visibility == "Player" && C.IsPlayer()) ||
					(Layer.Visibility == "AllExceptPlayerDialog" && !(inDialog && C.IsPlayer())) ||
					(Layer.Visibility == "Others" && !C.IsPlayer()) ||
					(Layer.Visibility == "OthersExceptDialog" && !(inDialog && !C.IsPlayer())) ||
					(Layer.Visibility == "Owner" && C.IsOwnedByPlayer()) ||
					(Layer.Visibility == "Lovers" && C.IsLoverOfPlayer()) ||
					(Layer.Visibility == "Mistresses" && LogQuery("ClubMistress", "Management"))
				));
			};

			if (C.RegisterHook("AfterLoadCanvas", "LayerVisibilityDialog", layerVisibilityHook)) {
				refresh = true;
			}
		} else if (C.UnregisterHook("AfterLoadCanvas", "LayerVisibility")) {
			refresh = true;
		}
	}

	if (refresh)
		CharacterLoadCanvas(C);

	return refresh;
}

/**
 * Transfers an item from one character to another
 * @param {Character} FromC - The character from which to pick the item
 * @param {Character} ToC - The character on which we must put the item
 * @param {AssetGroupName} Group - The item group to transfer (Cloth, Hat, etc.)
 * @param {boolean} [Refresh] - Perform a character refresh
 * @returns {void} - Nothing
 */
function CharacterTransferItem(FromC, ToC, Group, Refresh=true) {
	let Item = InventoryGet(FromC, Group);
	if (Item == null) return;
	InventoryWear(ToC, Item.Asset.Name, Group, Item.Color, Item.Difficulty, undefined, undefined, false);
	if (Refresh) CharacterRefresh(ToC);
}

/**
 * Check if the given character can be aroused at all.
 * @param {Character} C - The character to test
 * @returns {boolean} That character can be aroused
 */
function CharacterHasArousalEnabled(C) {
	return (C.ArousalSettings != null)
		&& (C.ArousalSettings.Zone != null)
		&& (C.ArousalSettings.Active != null)
		&& (C.ArousalSettings.Active != "Inactive");
}

/**
 * Clears a character's ownership.
 *
 * If the character is the player, this will also cleanup rules,
 * owner-locked items, and trigger a server ownership break-up.
 *
 * @param {Character} C - The character breaking from their owner
 * @param {boolean} push - Whether to push the data to the server
 * @returns {void} - Nothing.
 */
function CharacterClearOwnership(C, push=true) {

	if (C.IsPlayer()) {
		const ownerType = C.IsOwned();
		switch (ownerType) {
			case "online": {
				const number = C.Ownership?.MemberNumber ?? -1; // Can't happen; protected by `C.IsOwned()`
				ServerSend("AccountOwnership", { MemberNumber: number, Action: "Break" });
				C.Owner = "";
				C.Ownership = null;
				break;
			}

			case "npc":
				C.Owner = "";
				C.Ownership = null;
				ServerPlayerSync();
				break;
		}

		LoginValidCollar();
		LogDelete(null, "OwnerRule");
	}

	C.Appearance = C.Appearance.filter(item => !item.Asset.OwnerOnly);
	C.Appearance.forEach(item => ValidationSanitizeProperties(C, item));
	CharacterRefresh(C);
}

/**
 * Returns the nickname of a character, or the name if the nickname isn't valid
 * Also validates if the character is a GGTS drone to alter her name
 * @param {Character} C - The character breaking from their owner
 * @returns {string} - The nickname to return
 */
function CharacterNickname(C) {
	if (AsylumGGTSIsEnabled()) {
		return AsylumGGTSCharacterName(C);
	}
	return C.Nickname ?? C.Name;
}

/**
 * Returns dialog text for a character based on their chosen pronouns. Default to She/Her entries
 * @param {Character} C - The character to fetch dialog for
 * @param {CharacterPronounType} DialogKey - The type of dialog entry to look for
 * @param {boolean} HideIdentity - Whether to use generic they/them pronouns
 * @returns {string} - The text to use
 */
function CharacterPronoun(C, DialogKey, HideIdentity) {
	/** @type {CharacterPronouns} */
	let pronounName;
	if (HideIdentity && ChatSearchGetSpace() == ChatRoomSpaceType.MIXED || C == null) {
		pronounName = "TheyThem";
	} else {
		pronounName = C.GetPronouns();
	}
	return InterfaceTextGet(`Pronoun${DialogKey}${pronounName}`);
}

/**
 * Returns the description text for the character's chosen pronouns. Default to She/Her
 * @param {Character} C - The character to fetch text for
 * @returns {string} - The text to use
 */
function CharacterPronounDescription(C) {
	const pronounAsset = AssetGet(C.AssetFamily, "Pronouns", C.GetPronouns());
	// Pronouns is part of the default appearance
	return /** @type {string} */ (pronounAsset?.Description);
}

/**
 * Whether the character's nickname can be changed
 *
 * @param {Character} C
 */
function CharacterCanChangeNickname(C) {
	if (!C.IsPlayer()) return false;

	return !Player.IsFullyOwned() || !(LogQuery("BlockNickname", "OwnerRule") && Player.OnlineSharedSettings.AllowRename);
}

/**
 * Update the given character's nickname.
 *
 * Note that changing any nickname but yours (ie. Player) is not supported.
 *
 * @param {Character} C - The character to change the nickname of.
 * @param {null | string} Nick - The name to use as the new nickname. An empty string uses the character's real name.
 * @param {boolean} [fromOwner] - Whether the nickname change comes from the owner rule.
 * @returns {null | NicknameStatus} null if the nickname was valid, or an explanation for why the nickname was rejected.
 */
function CharacterSetNickname(C, Nick, fromOwner = false) {
	if (!C.IsPlayer()) return null;

	Nick = (Nick ?? "").trim();
	// Same nickname, or setting an empty nickname with no nickname already
	if (C.Nickname === Nick || Nick.length === 0 && !C.Nickname) return null;

	const oldNick = C.Nickname ?? C.Name;

	if (Nick.length === 0) {
		// We're clearing nicknames
		delete C.Nickname;
		Nick = null;
	} else {
		const status = CharacterValidateNickname(C, Nick, fromOwner);
		if (status) {
			return status;
		}
		C.Nickname = Nick;
	}
	// @ts-ignore Strict-TS: Types only say 'undefined', but we need `null`
	// to survive JSON serialization to the server
	ServerAccountUpdate.QueueData({ Nickname: Nick });

	if (ServerPlayerIsInChatRoom()) {
		// When in a chatroom, send a notification that the player updated their nick
		const Dictionary = new DictionaryBuilder()
			.sourceCharacter(C)
			.destinationCharacter(C)
			.text("OldNick", oldNick)
			.text("NewNick", CharacterNickname(C))
			.build();

		ServerSend("ChatRoomChat", { Content: "CharacterNicknameUpdated", Type: "Action", Dictionary: Dictionary });
	}

	return null;
}

/**
 * Validate the given character's nickname
 *
 * @param {Character} C - The character to change the nickname of.
 * @param {string} Nick - The name to use as the new nickname.
 * @param {boolean} [fromOwner] - Whether the nickname change comes from the owner
 * @returns {null | NicknameStatus} null if the nickname was valid, or an explanation for why the nickname was rejected.
 */
function CharacterValidateNickname(C, Nick, fromOwner = false) {
	if (!(CharacterCanChangeNickname(C) && !fromOwner)) {
		return "NicknameLocked";
	}

	if (Nick.length > 20) return "NicknameTooLong";
	if (Nick.length === 0) return "NicknameTooShort";
	if (!ServerCharacterNicknameRegex.test(Nick)) return "NicknameInvalidChars";

	return null;
}

/**
 * Update the owners note on the specified character.  The Player must be the owner of this character.
 * Notes will be truncated to max 4000 chars.
 *
 * @param {Character} C - The character to receive the updated notes.
 * @param {string} [notes] - String containing the notes.  If undefined, existing notes will be erased.
 */
function CharacterSetOwnersNotes(C, notes = undefined) {
	if (C.IsOnline() && CommonIsObject(C.Ownership) && C.Ownership.Notes !== notes && C.IsFullyOwnedByPlayer()) {
		let Notes = undefined;
		if (typeof notes === "string" && notes.length > 0) {
			C.Ownership.Notes = notes.slice(0, OnlineProfileTextOwnersNotesMaxLen);
			Notes = LZString.compressToUTF16(C.Ownership.Notes);
		} else {
			C.Ownership.Notes = undefined;
		}

		ServerSend("AccountOwnership", { MemberNumber: C.MemberNumber, Action: "UpdateNotes", Notes });
	}
}

/**
 * Updates the leash state on a character
 *
 * @param {Character} C
 */
function CharacterRefreshLeash(C) {
	if (!C.IsPlayer()) return;

	const leashes = Player.Appearance.filter(i => InventoryItemHasEffect(i, "Leash", true));

	// We aren't wearing a leash anymore, break the link
	// This can happen if someone removed the leash while in the process of being leashed away
	if (leashes.length === 0) {
		if (ChatRoomLeashPlayer !== null) {
			ChatRoomLeashPlayer = null;
		}
		if (Player.MapData?.Tether) ChatRoomMapViewSetTether(null);
		return;
	}

	// Make sure our current leasher can still leash us, since binding us to the room, or
	// marking it as leash-blocking should break the leash.
	if (ChatRoomLeashPlayer !== null && !ChatRoomCanBeLeashedBy(ChatRoomLeashPlayer, Player)) {
		ChatRoomLeashPlayer = null;
	}
	if (Player.MapData?.Tether && !ChatRoomCanBeLeashedBy(Player.MapData.Tether.MemberNumber, Player)) {
		ChatRoomMapViewSetTether(null);
		return;
	}

	// Check for a dynamic leash and update its state
	const dynamicLeash = leashes.find(i => i.Asset.AllowEffect && i.Asset.AllowEffect.includes("IsLeashed"));
	if (dynamicLeash) {
		if (!dynamicLeash.Property) dynamicLeash.Property = {};
		if (!Array.isArray(dynamicLeash.Property.Effect)) dynamicLeash.Property.Effect = [];

		if (ChatRoomLeashPlayer !== null || Player.MapData?.Tether) {
			dynamicLeash.Property.Effect.push("IsLeashed");
		} else if (ChatRoomLeashPlayer === null) {
			dynamicLeash.Property.Effect = dynamicLeash.Property.Effect.filter(e => e !== "IsLeashed");
		}

		ChatRoomCharacterUpdate(Player);
	}
}

/**
 * Create and return a character's script item, if appropriate
 * @public
 * @param {Character} C
 * @returns {Item}
 */
function CharacterScriptGet(C) {
	let script = InventoryGet(C, "ItemScript") ?? /** @type {Item} */ (InventoryWear(C, "Script", "ItemScript"));
	script.Property = script.Property || {};
	// Propagate change and try to reload the item. If the script permissions
	// on the target were wrong, then it'll be null
	CharacterScriptRefresh(C);

	script = /** @type {Item} */ (InventoryGet(C, "ItemScript"));
	return script;
}

/**
 * Refresh the character's script
 * @public
 * @param {Character} C
 */
function CharacterScriptRefresh(C) {
	ChatRoomCharacterUpdate(C);
}

/**
 * Remove a character's script item
 * @public
 * @param {Character} C
 */
function CharacterScriptRemove(C) {
	InventoryRemove(C, "ItemScript", true);
}

// Don't remove, these function are used too much downstream

/**
 * Sets a new pose for the character
 * @param {Character} C - Character for which to set the pose
 * @param {null | AssetPoseName} poseName - Name of the pose to set as active or `null` to return to the default pose
 * @param {boolean} [forceChange] - TRUE if the set pose(s) should overwrite current active pose(s)
 * @returns {void} - Nothing
 * @deprecated - Deprecated alias for {@link PoseSetActive}
 */
function CharacterSetActivePose(C, poseName, forceChange=false) {
	return PoseSetActive(C, poseName, forceChange);
}

/**
 * Checks whether the given character can change to the named pose (without aid by default).
 * @param {Character} C - The character to check
 * @param {AssetPoseName} poseName - The name of the pose to check for
 * @returns {boolean} - Returns true if the character has no conflicting items and is not prevented from changing to
 * the provided pose
 * @deprecated Superseded by {@link PoseCanChangeUnaided}
 */
function CharacterCanChangeToPose(C, poseName) {
	return PoseCanChangeUnaided(C, poseName);
}

/**
 * Check a character against another one's access lists
 * @param {Character} listOwner - The character to check against
 * @param {Character | number} listTarget - The character or member number to check for
 * @param {"black" | "white" | "ghost" | "friend"} list
 */
function CharacterIsOnList(listOwner, listTarget, list) {
	const num = typeof listTarget === "number" ? listTarget : listTarget.MemberNumber;
	// Characterts that don't have member numbers (eg. NPCs, Player before registering)
	// cannot be on lists.
	if (num === undefined) return false;
	switch (list) {
		case "black":
			return listOwner.BlackList.includes(num);
		case "white":
			return listOwner.WhiteList.includes(num);
		case "ghost":
			return listOwner.IsPlayer() && !!listOwner.GhostList?.includes(num);
		case "friend":
			return listOwner.IsPlayer() && !!listOwner.FriendList?.includes(num);
	}
}

/**
 * Get the character's height
 * @param {Character} C
 */
function CharacterGetHeight(C) {
	const height = C ? InventoryGet(C, "Height") : null;
	return CommonClamp(height?.Asset.ZoomModifier ?? 1, 0, 1);
}
