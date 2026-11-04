"use strict";
var PlatformRunStandaloneMode = false;
/** @type {Platform.Character[]} */
var PlatformChar = [];
/** @type {Platform.DialogCharacter | null} */
var PlatformFocusCharacter = null;
/** @type {Platform.Character} */
var PlatformPlayer = /** @type {never} */ (null);
/** @type {number | null} */
var PlatformLastTime = null;
/** @type {Platform.KeyCode[]} */
var PlatformKeys = [];
var PlatformFloor = 1180;
var PlatformViewX = 0;
var PlatformViewY = 200;
/** @type {Platform.Room} */
var PlatformRoom = /** @type {never} */ (null);
/** @type {HTMLAudioElement | null} */
var PlatformMusic = null;
var PlatformAllowAudio = true;
var PlatformGravitySpeed = 6;
var PlatformLastKeyCode = "";
var PlatformLastKeyTime = 0;
var PlatformExperienceForLevel = [0, 10, 15, 25, 40, 60, 90, 135, 200, 300];
var PlatformShowHitBox = false;
/** @type {{ Text: string, Timer: number } | null} */
var PlatformMessage = null;
/** @type {number | null} */
var PlatformHeal = null;
/** @type {Platform.Event[]} */
var PlatformEvent = [];
/** @type {Platform.Event[]} */
var PlatformTempEvent = [];
/** @type {number | null} */
var PlatformPlayerIdleTimer = null;
var PlatformPlayerIdleLast = "";
/** @type {[number, number] | null} */
var PlatformDrawUpArrow = null;
/** @type {null | TouchList} */
var PlatformLastTouch = null;
var PlatformImmunityTime = 500;
var PlatformSaveMode = false;
var PlatformGiftMode = false;
var PlatformJumpPhase = "";
/** @type {Platform.PartyMember[]} */
var PlatformParty = [];
var PlatformRegen = 0;
/** @type {Platform.Cooldown[]} */
var PlatformCooldown = [];
var PlatformHeartEffect = false;
var PlatformTimedScreenFilter = { End: 0, Filter: "" };
/** @type {string[]} */
var PlatformRightButtons = [];
/** @type {{ Name: Platform.ItemName, Quantity: number }[]} */
var PlatformInventory = [];
/** @type {Platform.Item[]} */
var PlatformInventoryList = [
	{
		Name: "RedRose",
		DisplayName: "Red Rose",
		Description: "Increase her love",
		OnGive: function(Char) {
			PlatformDialogAlterProperty(Char.Name, "Love", 1);
			PlatformMessageSet("She loves your gift.");
		}
	},
	{
		Name: "PoisonApple",
		DisplayName: "Poison Apple",
		Description: "Decrease her love",
		OnGive: function(Char) {
			PlatformDialogAlterProperty(Char.Name, "Love", -1);
			PlatformMessageSet("She hates your gift.");
		}
	},
	{
		Name: "LeatherWhip",
		DisplayName: "Leather Whip",
		Description: "Become dominant",
		OnGive: function(Char) {
			PlatformDialogAlterProperty(Char.Name, "Domination", -1);
			PlatformMessageSet("She's getting more dominant.");
		}
	},
	{
		Name: "AnimalCollar",
		DisplayName: "Animal Collar",
		Description: "Become submissive",
		OnGive: function(Char) {
			PlatformDialogAlterProperty(Char.Name, "Domination", 1);
			PlatformMessageSet("She's getting more submissive.");
		}
	}
];

// Template for characters with their animations
/** @type {(Platform.CharacterTemplate | Platform.DummyTemplate)[]} */
var PlatformTemplate = [
	{
		Name: "Melody", // MMD Z: 41.50
		Status: "Maid",
		Perk: "0000000000",
		PerkName: ["Healthy", "Robust", "Vigorous", "Spring", "Impact", "Block", "Deflect", "Seduction", "Persuasion", "Manipulation"],
		Health: 12,
		HealthPerLevel: 4,
		Width: 400,
		Height: 400,
		HitBox: [0.42, 0.03, 0.58, 1],
		JumpHitBox: [0.42, 0.03, 0.58, 0.65],
		RunSpeed: 18,
		WalkSpeed: 12,
		CrawlSpeed: 6,
		JumpForce: 43,
		CollisionDamage: 0,
		ExperienceValue: 0,
		DamageBackOdds: 0,
		DamageKnockForce: 30,
		DamageAudio: ["Melody0", "Melody1", "Melody2", "Melody3", "Melody4", "Generic0", "Generic1"],
		DownAudio: ["Melody0"],
		BindAudio: ["Rope0", "Rope1", "Rope2", "Rope3"],
		IdleAudio: ["Melody0", "Melody1", "Melody2", "Melody3", "Melody4"],
		Animation: [
			{ Name: "Idle", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 100 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1], Speed: 150 },
			{ Name: "Bound", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 120 },
			{ Name: "Petrified", Cycle: [0], Speed: 1000 },
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 30 },
			{ Name: "Run", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], Speed: 30 },
			{ Name: "Jump", Cycle: [0, 1, 2, 3, 4, 3, 2, 1], Speed: 150 },
			{ Name: "Crouch", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 90 },
			{ Name: "Bind", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 100 },
			{ Name: "Crawl", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39], Speed: 20 },
			{ Name: "Stun", Cycle: [0], Speed: 1000 },
			{ Name: "Block", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 100 },
			{ Name: "Uppercut", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], Speed: 15 },
			{ Name: "StandAttackFast", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], Speed: 28 },
			{ Name: "StandAttackSlow", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], Speed: 30 },
			{ Name: "CrouchAttackFast", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], Speed: 18 },
			{ Name: "CrouchAttackSlow", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], Speed: 43 },
		],
		Attack: [
			{ Name: "Uppercut", HitBox: [0.55, -0.1, 0.75, 0.1], HitAnimation: [9, 10, 11, 12, 13, 14], StartAudio: ["MelodyPunch0"], HitAudio: ["MelodyPunch0", "MelodyPunch1", "MelodyPunch2"], Damage: [1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8], Speed: 300 },
			{ Name: "StandAttackFast", HitBox: [0.7, 0.15, 0.9, 0.25], HitAnimation: [3, 4, 5, 6], StartAudio: ["MelodyPunch0"], HitAudio: ["MelodyPunch0", "MelodyPunch1", "MelodyPunch2"], Damage: [1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8], Speed: 300 },
			{ Name: "StandAttackSlow", HitBox: [0.8, 0.4, 1, 0.5], HitAnimation: [9, 10, 11, 12, 13], StartAudio: ["MelodyKick0"], HitAudio: ["MelodyKick0", "MelodyKick1"], Damage: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], Speed: 600 },
			{ Name: "CrouchAttackFast", HitBox: [0.725, 0.65, 0.925, 0.75], HitAnimation: [5, 6, 7, 8, 9], StartAudio: ["MelodyPunch0"], HitAudio: ["MelodyPunch0", "MelodyPunch1", "MelodyPunch2"], Damage: [1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8], Speed: 300 },
			{ Name: "CrouchAttackSlow", HitBox: [0.8, 0.7, 1, 0.8], HitAnimation: [5, 6, 7, 8, 9], StartAudio: ["MelodyKick0"], HitAudio: ["MelodyKick0", "MelodyKick1"], Damage: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], Speed: 600 }
		]
	},
	{
		Name: "Olivia", // MMD Z: 39
		Status: "Oracle",
		Perk: "0000000000",
		PerkName: ["Apprentice", "Witch", "Meditation", "Scholar", "Heal", "Cure", "Howl", "Roar", "Teleport", "Freedom"],
		Width: 400,
		Height: 400,
		Health: 10,
		HealthPerLevel: 3,
		Magic: 6,
		MagicPerLevel: 1,
		HitBox: [0.42, 0.03, 0.58, 1],
		JumpHitBox: [0.42, 0.03, 0.58, 0.65],
		RunSpeed: 17,
		WalkSpeed: 11,
		CrawlSpeed: 6,
		JumpForce: 43,
		CollisionDamage: 0,
		ExperienceValue: 0,
		DamageBackOdds: 0,
		DamageKnockForce: 25,
		DamageAudio: ["Olivia0", "Olivia1", "Olivia2", "Olivia3", "Olivia4", "Generic0", "Generic1"],
		DownAudio: ["Olivia0"],
		BindAudio: ["Rope0", "Rope1", "Rope2", "Rope3"],
		IdleAudio: ["Olivia0", "Olivia1", "Olivia2", "Olivia3"],
		Animation: [
			{ Name: "Idle", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61], Speed: 90 },
			{ Name: "HalfBoundIdle", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 90 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 150 },
			{ Name: "HalfBoundWounded", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 110 },
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 30 },
			{ Name: "HalfBoundWalk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 25 },
			{ Name: "Run", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], Speed: 40 },
			{ Name: "HalfBoundRun", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 18 },
			{ Name: "Jump", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 30 },
			{ Name: "HalfBoundJump", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 30 },
			{ Name: "Crouch", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 110 },
			{ Name: "Crawl", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], Speed: 30 },
			{ Name: "Bound", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 110 },
			{ Name: "Petrified", Cycle: [0], Speed: 1000 },
			{ Name: "Bind", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 90 },
			{ Name: "Stun", Cycle: [0], Speed: 1000 },
			{ Name: "HalfBoundStun", Cycle: [0], Speed: 1000 },
			{ Name: "StandAttackFast", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], Speed: 17 },
			{ Name: "CrouchAttackFast", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], Speed: 19 },
			{ Name: "Scream", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 10, Audio: ["OliviaScream0"] }
		],
		Attack: [
			{ Name: "StandAttackFast", HitBox: [0.7, 0.15, 0.9, 0.3], HitAnimation: [6, 7, 8, 9, 10], StartAudio: ["OliviaSlap0"], HitAudio: ["OliviaSlap0", "OliviaSlap1", "OliviaSlap2", "OliviaSlap3"], Damage: [1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8], Speed: 300 },
			{ Name: "CrouchAttackFast", HitBox: [0.725, 0.65, 0.925, 0.75], HitAnimation: [6, 7, 8, 9], HitAudio: ["OliviaSlap0", "OliviaSlap1", "OliviaSlap2", "OliviaSlap3"], Damage: [1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8], Speed: 300 },
			{ Name: "Scream", Magic: 2, Cooldown: 3000, HitBox: [-100, -100, 100, 100], HitAnimation: [8, 9, 10], Damage: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4], Speed: 200 }
		]
	},
	{
		Name: "Edlaran", // MMD Z: 35.30
		Status: "Archer",
		Perk: "0000000000",
		PerkName: ["Fletcher", "Burglar", "Spring", "Athletic", "Sprint", "Backflip", "Acrobat", "Archery", "Celerity", "Capacity"],
		Width: 400,
		Height: 400,
		Health: 14,
		HealthPerLevel: 3,
		Projectile: 15,
		ProjectileName: "Arrow",
		ProjectileType: "Wood",
		ProjectileDamage: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		ProjectileTime: 1000,
		ProjectileHitAudio: ["EdlaranBow0"],
		HitBox: [0.43, 0.07, 0.57, 1],
		JumpHitBox: [0.43, 0.07, 0.57, 0.7],
		RunSpeed: 18,
		WalkSpeed: 12,
		CrawlSpeed: 6,
		JumpForce: 43,
		CollisionDamage: 0,
		ExperienceValue: 0,
		DamageBackOdds: 0,
		DamageKnockForce: 25,
		DamageAudio: ["Edlaran0", "Edlaran1", "Edlaran2", "Edlaran3", "Edlaran4", "Generic0", "Generic1"],
		DownAudio: ["Edlaran0"],
		BindAudio: ["Rope0", "Rope1", "Rope2", "Rope3"],
		IdleAudio: ["Edlaran0", "Edlaran1", "Edlaran2", "Edlaran3"],
		Animation: [
			{ Name: "Idle", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 90 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 130 },
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 25 },
			{ Name: "Run", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], Speed: 36 },
			{ Name: "Jump", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 32 },
			{ Name: "Crawl", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], Speed: 30 },
			{ Name: "Crouch", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 120 },
			{ Name: "Bind", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 60 },
			{ Name: "Bound", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 100 },
			{ Name: "Petrified", Cycle: [0], Speed: 1000 },
			{ Name: "Stun", Cycle: [0], Speed: 1000 },
			{ Name: "Aim", Cycle: [0], Speed: 1000, Audio: ["EdlaranBowCharge0"] },
			{ Name: "AimReady", Cycle: [0], Speed: 1000, Audio: ["EdlaranBowCharge0"] },
			{ Name: "AimFull", Cycle: [0], Speed: 1000, Audio: ["EdlaranBowCharge0"] },
			{ Name: "StandAttackFast", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], Speed: 15 },
			{ Name: "CrouchAttackFast", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], Speed: 20 },
			{ Name: "Backflip", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], Speed: 16 },
		],
		Attack: [
			{ Name: "StandAttackFast", HitBox: [0.8, 0.1, 1, 0.3], HitAnimation: [7, 8, 9, 10, 11, 12], StartAudio: ["EdlaranKick0"], HitAudio: ["EdlaranKick0", "EdlaranKick1"], Damage: [1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8], Speed: 300 },
			{ Name: "CrouchAttackFast", HitBox: [0.8, 0.58, 1, 0.78], HitAnimation: [4, 5, 6, 7], StartAudio: ["EdlaranKick0"], HitAudio: ["EdlaranKick0", "EdlaranKick1"], Damage: [1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8], Speed: 300 },
			{ Name: "Backflip", Speed: 336 },
		]

	},
	{
		Name: "Lyn", // MMD Z: 41.00
		Status: "Thief",
		Perk: "0000000000",
		PerkName: ["Sneak", "Backstab", "Kidnapper", "Rigger", "Burglar", "Thief", "Spring", "Bounce", "Inventory", "Duplicate"],
		Health: 12,
		HealthPerLevel: 3,
		Width: 400,
		Height: 400,
		HitBox: [0.4, 0.05, 0.6, 1],
		JumpHitBox: [0.4, 0.05, 0.6, 0.7],
		JumpForce: 43,
		RunSpeed: 19,
		WalkSpeed: 13,
		CrawlSpeed: 7,
		Projectile: 2,
		ProjectileName: "Dagger",
		ProjectileType: "Iron",
		ProjectileDamage: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
		JumpOdds: 0.0004,
		RunOdds: 1,
		ProjectileOdds: 0.0003,
		ProjectileTime: 675,
		CollisionDamage: 6,
		ExperienceValue: 15,
		DamageBackOdds: 1,
		DamageKnockForce: 50,
		LootOdds: 0,
		DamageAudio: ["Lyn0", "Lyn1", "Lyn2", "Lyn3", "Lyn4", "Lyn5", "Lyn6", "Generic0", "Generic1"],
		DownAudio: ["Lyn0"],
		BindAudio: ["Rope0", "Rope1", "Rope2", "Rope3"],
		IdleAudio: ["Lyn0", "Lyn1", "Lyn2", "Lyn3"],
		Animation: [
			{ Name: "Idle", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47], Speed: 95 },
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], Speed: 60 },
			{ Name: "Run", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], Speed: 40 },
			{ Name: "Crawl", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], Speed: 100 },
			{ Name: "Crouch", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 120 },
			{ Name: "Jump", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 60 },
			{ Name: "Bind", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 100 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 110 },
			{ Name: "Bound", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 120 },
			{ Name: "Petrified", Cycle: [0], Speed: 1000 },
			{ Name: "Stun", Cycle: [0], Speed: 1000 },
			{ Name: "StandAttackFast", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], Speed: 19 },
			{ Name: "CrouchAttackFast", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 19 },
			{ Name: "StandAttackSlow", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], Speed: 30 },
			{ Name: "FireProjectile", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], Speed: 36 }
		],
		Attack: [
			{ Name: "StandAttackFast", HitBox: [0.8, 0.25, 1, 0.4], HitAnimation: [5, 6, 7, 8, 9], StartAudio: ["EdlaranKick0"], HitAudio: ["EdlaranKick0", "EdlaranKick1"], Damage: [1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8], Speed: 300 },
			{ Name: "CrouchAttackFast", HitBox: [0.65, 0.45, 0.85, 0.65], HitAnimation: [6, 7, 8], HitAudio: ["OliviaSlap0", "OliviaSlap1", "OliviaSlap2", "OliviaSlap3"], Damage: [1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8], Speed: 300 },
			{ Name: "StandAttackSlow", HitBox: [0, 0.4, 1, 0.8], HitAnimation: [7, 8, 9], StartAudio: ["MelodyKick0"], HitAudio: ["MelodyKick0", "MelodyKick1"], Damage: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], Speed: 600, JumpForce: 60 },
			{ Name: "FireProjectile", Speed: 750 }
		],
		OnBind: function() {
			if (PlatformEventDone("LynJoin")) return;
			if (!PlatformEventDone("ThiefBossDefeat")) {
				PlatformEventSet("ThiefBossDefeat");
				PlatformDialogStart("ThiefBossDefeat");
				PlatformCreateTreasure();
			} else {
				if (!PlatformEventDone("ThiefBossSecondDefeat")) {
					PlatformEventSet("ThiefBossSecondDefeat");
					PlatformDialogStart("ThiefBossSecondDefeat");
					PlatformCreateTreasure();
				}
			}
			PlatformRoom.Background = "Savannah/BanditCampOpen";
			PlatformRoom.LimitRight = null;
			PlatformChar[1].Combat = false;
			PlatformChar[1].Dialog = !PlatformEventDone("ThiefBossSecondDefeat") ? "ThiefBossDefeatRepeat" : "ThiefBossSecondDefeatRepeat";
		}
	},
	{
		Name: "Zara", // MMD Z: 39.00, Y: 10.50
		Status: "Slave",
		Perk: "0000000000",
		PerkName: ["Sneak", "Backstab", "Kidnapper", "Rigger", "Burglar", "Thief", "Spring", "Bounce", "Inventory", "Duplicate"],
		Health: 12,
		HealthPerLevel: 3,
		Width: 400,
		Height: 400,
		HitBox: [0.4, 0.05, 0.6, 1],
		JumpHitBox: [0.4, 0.05, 0.6, 0.7],
		JumpForce: 43,
		RunSpeed: 19,
		WalkSpeed: 13,
		CrawlSpeed: 7,
		DamageAudio: ["Zara0", "Zara1", "Zara2", "Zara3", "Zara4", "Zara5", "Zara6", "Generic0", "Generic1"],
		DownAudio: ["Zara0"],
		BindAudio: ["Rope0", "Rope1", "Rope2", "Rope3"],
		IdleAudio: ["Zara0", "Zara1", "Zara2", "Zara3"],
		Animation: [
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], Speed: 60 },
			{ Name: "Petrified", Cycle: [0], Speed: 1000 },
		],
	},
	{
		Name: "Olivia",
		Status: "Chained",
		Width: 400,
		Height: 400,
		Animation: [
			{ Name: "Idle", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 130 }
		]
	},
	{
		Name: "Olivia",
		Status: "Chastity",
		Width: 400,
		Height: 400,
		Animation: [
			{ Name: "Idle", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 130 }
		]
	},
	{
		Name: "Isabella",
		Status: "Winter",
		Width: 400,
		Height: 400,
		Animation: [
			{ Name: "Idle", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 150 }
		]
	},
	{
		Name: "Edlaran",
		Status: "Chained",
		Width: 400,
		Height: 400,
		Animation: [
			{ Name: "Idle", Cycle: [0], Speed: 1000 }
		]
	},
	{
		Name: "Arrow",
		Status: "Wood",
		Width: 400,
		Height: 400,
		HitBox: [0.3, 0.95, 0.7, 1],
		Animation: [
			{ Name: "Jump", Cycle: [0], Speed: 1000 }
		]
	},
	{
		Name: "Dagger",
		Status: "Iron",
		Width: 400,
		Height: 400,
		HitBox: [0.35, 0.65, 0.65, 1],
		Animation: [
			{ Name: "Jump", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], Speed: 25 }
		]
	},
	{
		Name: "Barrel",
		Status: "Wood",
		Width: 200,
		Height: 200,
		HitBox: [0, 0, 1, 1],
		Animation: [
			{ Name: "Jump", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], Speed: 25 }
		]
	},
	{
		Name: "Chest",
		Status: "Metal",
		Width: 400,
		Height: 400,
		Animation: [
			{ Name: "Idle", Cycle: [0], Speed: 1000 }
		]
	},
	{
		Name: "Crate",
		Status: "Wood",
		Width: 400,
		Height: 400,
		Animation: [
			{ Name: "Idle", Cycle: [0], Speed: 1000 }
		]
	},
	{
		Name: "Treasure",
		Status: "Metal",
		Health: 0,
		Width: 400,
		Height: 400,
		Animation: [
			{ Name: "Idle", Cycle: [0], Speed: 1000 },
			{ Name: "Wounded", Cycle: [0], Speed: 1000 },
			{ Name: "Bound", Cycle: [0], Speed: 1000 }
		],
		OnBind: function() {
			let Treasure = this;
			PlatformAddRandomInventory(Treasure);
			setTimeout(function() { PlatformAddRandomInventory(Treasure); }, 800);
			setTimeout(function() { PlatformAddRandomInventory(Treasure); }, 1600);
			setTimeout(function() { PlatformAddRandomInventory(Treasure); }, 2400);
		}
	},
	/*{
		Name: "Kara",
		Status: "Nude",
		Health: 10,
		Width: 400,
		Height: 400,
		HitBox: [0.4, 0.05, 0.6, 1],
		RunSpeed: 12,
		WalkSpeed: 8,
		CrawlSpeed: 4,
		JumpForce: 50,
		CollisionDamage: 1,
		ExperienceValue: 1,
		JumpOdds: 0.0002,
		DamageBackOdds: 1,
		DamageKnockForce: 50,
		Animation: [
			{ Name: "Idle", Width: 200, Cycle: [0], Speed: 150 },
			{ Name: "Wounded", Cycle: [0], Speed: 1000 },
			{ Name: "Bound", Cycle: [0], Speed: 1000 },
			{ Name: "Walk", Width: 200, Cycle: [0, 1, 2, 3, 2, 1], Speed: 150 },
			{ Name: "Jump", Width: 200, Cycle: [0, 1, 2, 3, 2, 1], Speed: 250 },
			//{ Name: "Crouch", Width: 200, Cycle: [0, 1, 2, 3, 2, 1], Speed: 400 },
			//{ Name: "Crawl", Cycle: [0, 1, 2, 3, 2, 1], Speed: 300 },
			{ Name: "Bind", Width: 200, Cycle: [0, 1, 2, 3, 2, 1], Speed: 400 },
			//{ Name: "StandAttackFast", Cycle: [0, 1, 2, 3, 3, 3, 3, 2, 1, 0], Speed: 40 },
			//{ Name: "StandAttackSlow", Cycle: [0, 1, 2, 3, 3, 3, 3, 2, 1, 0], Speed: 60 },
			//{ Name: "CrouchAttackFast", Cycle: [0, 1, 2, 3, 3, 3, 3, 2, 1, 0], Speed: 40 },
			//{ Name: "CrouchAttackSlow", Cycle: [0, 1, 2, 3, 3, 3, 3, 2, 1, 0], Speed: 60 },
		],
		Attack: [
			//{ Name: "StandAttackFast", HitBox: [135, -365, 30, 30], Animation: [3], Damage: 2, Speed: 400 },
			//{ Name: "StandAttackSlow", HitBox: [135, -365, 30, 30], Animation: [3], Damage: 3, Speed: 600 },
			//{ Name: "CrouchAttackFast", HitBox: [190, -150, 55, 30], Animation: [3], Damage: 2, Speed: 400 },
			//{ Name: "CrouchAttackSlow", HitBox: [190, -150, 55, 30], Animation: [3], Damage: 3, Speed: 600 }
		]
	},
	{
		Name: "Liane",
		Status: "School",
		Health: 15,
		Width: 400,
		Height: 400,
		HitBox: [0.4, 0.05, 0.6, 1],
		RunSpeed: 15,
		WalkSpeed: 10,
		CrawlSpeed: 5,
		CollisionDamage: 2,
		ExperienceValue: 2,
		RunOdds: 0.0004,
		DamageBackOdds: 1,
		DamageKnockForce: 40,
		Animation: [
			{ Name: "Idle", Width: 200, Cycle: [0], Speed: 150 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 1], Speed: 1000 },
			{ Name: "Bound", Cycle: [0], Speed: 10000 },
			{ Name: "Walk", Width: 200, Cycle: [0, 1, 2, 3, 2, 1], Speed: 150 },
			{ Name: "Run", Width: 200, Cycle: [0, 1, 2, 3, 2, 1], Speed: 100 },
			{ Name: "Bind", Width: 200, Cycle: [0], Speed: 10000 }
		],
		Attack: []

	},*/
	{
		Name: "Hazel",
		Status: "Maid",
		Health: 11,
		Width: 400,
		Height: 400,
		HitBox: [0.4, 0.05, 0.6, 1],
		JumpHitBox: [0.4, 0.05, 0.6, 0.7],
		RunSpeed: 11,
		WalkSpeed: 7,
		CrawlSpeed: 4,
		JumpForce: 50,
		CollisionDamage: 1,
		ExperienceValue: 1,
		JumpOdds: 0.0003,
		DamageBackOdds: 1,
		DamageKnockForce: 50,
		LootOdds: 0.06,
		Animation: [
			{ Name: "Idle", Cycle: [0], Speed: 150 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 110 },
			{ Name: "Bound", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 100 },
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 40 },
			{ Name: "WalkHit", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], Speed: 30 },
			{ Name: "Jump", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 35 },
			{ Name: "Bind", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1], Speed: 130 },
			{ Name: "Stun", Cycle: [0], Speed: 1000 }
		],
		OnBind: function() {
			// 10% odds of getting the "Wannabe Princess" Club Card when restraining a maid
			if ((Math.random() > 0.9) && (Player.Game != null) && (Player.Game.ClubCard != null) && (Player.Game.ClubCard.Reward != null)) {
				let Char = String.fromCharCode(1017);
				if (Player.Game.ClubCard.Reward.indexOf(Char) < 0) {
					Player.Game.ClubCard.Reward = Player.Game.ClubCard.Reward + Char;
					ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
					PlatformMessageSet("You found this Club Card: Wannabe Princess");
				}
			}
		}
	},
	{
		Name: "Yuna",
		Status: "Maid",
		Health: 17,
		Width: 400,
		Height: 400,
		HitBox: [0.4, 0.05, 0.6, 1],
		JumpHitBox: [0.4, 0.05, 0.6, 0.7],
		RunSpeed: 11,
		WalkSpeed: 7,
		CrawlSpeed: 4,
		JumpForce: 70,
		CollisionDamage: 2,
		ExperienceValue: 2,
		JumpOdds: 0.0006,
		RunOdds: 0.0003,
		DamageKnockForce: 40,
		LootOdds: 0.08,
		Animation: [
			{ Name: "Idle", Cycle: [0], Speed: 100 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 100 },
			{ Name: "Bound", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 120 },
			{ Name: "Jump", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 60 },
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 40 },
			{ Name: "WalkHit", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], Speed: 60 },
			{ Name: "Run", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 30 },
			{ Name: "Bind", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 90 },
			{ Name: "Stun", Cycle: [0], Speed: 1000 }
		],
		OnBind: function() {
			// 10% odds of getting the "Wannabe Princess" Club Card when restraining a maid
			if ((Math.random() > 0.9) && (Player.Game != null) && (Player.Game.ClubCard != null) && (Player.Game.ClubCard.Reward != null)) {
				let Char = String.fromCharCode(1017);
				if (Player.Game.ClubCard.Reward.indexOf(Char) < 0) {
					Player.Game.ClubCard.Reward = Player.Game.ClubCard.Reward + Char;
					ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
					PlatformMessageSet("You found this Club Card: Wannabe Princess");
				}
			}
		}
	},
	{
		Name: "Lucy",
		Status: "Armor",
		Health: 26,
		Width: 400,
		Height: 400,
		HitBox: [0.4, 0.05, 0.6, 1],
		RunSpeed: 13,
		WalkSpeed: 9,
		CrawlSpeed: 5,
		CollisionDamage: 3,
		ExperienceValue: 4,
		RunOdds: 0.0005,
		DamageBackOdds: 0,
		DamageFaceOdds: 0.5,
		DamageKnockForce: 30,
		LootOdds: 0.1,
		Animation: [
			{ Name: "Idle", Cycle: [0], Speed: 150 },
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 40 },
			{ Name: "Run", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 30 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 130 },
			{ Name: "Bound", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 120 },
			{ Name: "Bind", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 110 },
			{ Name: "Stun", Cycle: [0], Speed: 1000 }
		],
		OnBind: function() {
			if (PlatformEventDone("EdlaranCurseIntro") && !PlatformEventDone("EdlaranKey")) {
				if (Math.random() >= 0.8) {
					PlatformMessageSet("You found keys for shackles on the guard.");
					PlatformEventSet("EdlaranKey");
				} else PlatformMessageSet("The keys are not on this guard.");
			}
		}
	},
	{
		Name: "Camille",
		Status: "Armor",
		Health: 53,
		Width: 400,
		Height: 400,
		HitBox: [0.4, 0.05, 0.6, 1],
		JumpHitBox: [0.4, 0.05, 0.6, 0.7],
		RunSpeed: 9,
		WalkSpeed: 6,
		CrawlSpeed: 3,
		JumpForce: 60,
		CollisionDamage: 6,
		ExperienceValue: 15,
		JumpOdds: 0.0002,
		RunOdds: 0.0004,
		StandAttackSlowOdds: 0.0003,
		DamageBackOdds: 0,
		DamageFaceOdds: 0.5,
		DamageKnockForce: 20,
		LootOdds: 0,
		Animation: [
			{ Name: "Idle", Cycle: [0], Speed: 100 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1], Speed: 100 },
			{ Name: "Bound", Cycle: [0, 1, 2, 3, 4, 3, 2, 1], Speed: 250 },
			{ Name: "Jump", Cycle: [0, 1, 2, 3, 4, 3, 2, 1], Speed: 150 },
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], CycleLeft: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], Speed: 100 },
			{ Name: "Run", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], CycleLeft: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], Speed: 66 },
			{ Name: "Bind", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 90 },
			{ Name: "StandAttackSlow", OffsetY: 50, Width: 500, Height: 500, Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39], Speed: 25 },
			{ Name: "Stun", Cycle: [0], Speed: 1000 }
		],
		Attack: [
			{ Name: "StandAttackSlow", HitBox: [0.6, 0.3, 1.3, 0.65], HitAnimation: [30, 31, 32, 33, 34, 35, 36], Damage: [12, 12], Speed: 1000 }
		],
		OnBind: function() {
			PlatformEventSet("CamilleDefeat");
			PlatformDialogStart("CamilleDefeat");
			PlatformLoadRoom();
			PlatformCreateTreasure();
		}
	},
	{
		Name: "Vera", // MMD Z: 41.00
		Status: "Leather",
		Health: 29,
		Width: 400,
		Height: 400,
		HitBox: [0.4, 0.05, 0.6, 1],
		RunSpeed: 16,
		WalkSpeed: 11,
		CrawlSpeed: 7,
		Projectile: 10,
		ProjectileName: "Dagger",
		ProjectileType: "Iron",
		ProjectileDamage: [6, 6],
		ProjectileOdds: 0.0002,
		ProjectileTime: 900,
		CollisionDamage: 3,
		ExperienceValue: 6,
		RunOdds: 0.0004,
		DamageBackOdds: 1,
		DamageKnockForce: 50,
		LootOdds: 0.15,
		Animation: [
			{ Name: "Idle", Cycle: [0], Speed: 150 },
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], Speed: 30 },
			{ Name: "Run", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], Speed: 30 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 120 },
			{ Name: "Bound", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 120 },
			{ Name: "Bind", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 110 },
			{ Name: "Stun", Cycle: [0], Speed: 1000 },
			{ Name: "FireProjectile", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], Speed: 48 }
		],
		Attack: [
			{ Name: "FireProjectile", Speed: 1000 }
		],
		OnBind: function() {
			if (!PlatformEventDone("EdlaranJoin") && !PlatformEventDone("EdlaranForestKey") && PlatformEventDone("EdlaranForestIntro")) {
				if (Math.random() >= 0.8) {
					PlatformMessageSet("You found keys for chains on the bandit.");
					PlatformEventSet("EdlaranForestKey");
				} else PlatformMessageSet("The keys are not on this bandit.");
			} else if (!PlatformEventDone("ThiefBossRetreat") && (PlatformRoom.Name == "SavannahBanditCampGate") && PlatformChar[1].Bound && PlatformChar[2].Bound && PlatformChar[3].Bound) {
				PlatformEventSet("ThiefBossRetreat");
				PlatformDialogStart("ThiefBossRetreat");
				PlatformRoom.Background = "Savannah/BanditCampGateOpen";
				PlatformRoom.LimitLeft = null;
				PlatformChar.splice(4, 100);
			} else if ((PlatformRoom.Name == "SavannahBanditCamp") && (PlatformChar[1].Bound == true) && (PlatformChar[2].Bound == true)) {
				PlatformRoom.Background = 'Savannah/BanditCampOpen';
				PlatformRoom.LimitRight = null;
				if (PlatformChar.length >= 4) PlatformChar[3].Dialog = "ThiefBossRescueAfterBattle";
			}
		}
	},
	{
		Name: "Vulture",
		Status: "Brown",
		Health: 13,
		Width: 400,
		Height: 400,
		HitBox: [0.2, 0.3, 0.8, 0.7],
		FlyingHeight: 550,
		RunHeight: 50,
		WalkSpeed: 0,
		RunSpeed: 21,
		CollisionDamage: 2,
		ExperienceValue: 3,
		DamageBackOdds: 1,
		DamageKnockForce: 60,
		IdleTurnToFace: true,
		PetrifyOnWound: true,
		RunOdds: 0.0005,
		LootOdds: 0.07,
		Animation: [
			{ Name: "Idle", Cycle: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], Speed: 70 },
			{ Name: "Walk", Cycle: [0], Speed: 70 },
			{ Name: "Run", Cycle: [0, 1, 2, 3, 4, 3, 2, 1], Speed: 300 },
			{ Name: "Wounded", Cycle: [0], Speed: 1000 },
			{ Name: "Bound", Cycle: [0], Speed: 1000 },
		],
	},
	{
		Name: "Scorpion",
		Status: "Gold",
		Health: 11,
		Width: 300,
		Height: 300,
		HitBox: [0.1, 0.5, 0.9, 1],
		WalkSpeed: 13,
		RunSpeed: 20,
		CollisionDamage: 2,
		ExperienceValue: 2,
		DamageBackOdds: 1,
		DamageKnockForce: 50,
		PetrifyOnWound: true,
		RunOdds: 0.0005,
		LootOdds: 0.07,
		Animation: [
			{ Name: "Idle", Cycle: [0], Speed: 70 },
			{ Name: "Walk", Cycle: [0, 1, 2, 3, 4, 5, 6, 7], Speed: 50 },
			{ Name: "Run", Cycle: [0, 1, 2, 3, 4, 5, 6, 7], Speed: 30 },
			{ Name: "Wounded", Cycle: [0, 1, 2, 3, 4], Speed: 90 },
			{ Name: "Bound", Cycle: [0], Speed: 1000 },
		],
	},

];

/**
 * All available rooms
 * @type {Platform.Room[]}
 */
var PlatformRoomList = [
	/*{
		Name: "CollegeClass1",
		Background: "CollegeClass1",
		Width: 4000,
		Height: 1200,
		Door: [
			{ Name: "CollegeHall1", FromX: 3800, FromY: 500, FromW: 200, FromH: 700, FromType: "Up", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Kara", X: 1700 }
		]
	},
	{
		Name: "CollegeHall1",
		Background: "CollegeHall1",
		Width: 3500,
		Height: 1200,
		Door: [
			{ Name: "CollegeClass1", FromX: 0, FromY: 500, FromW: 300, FromH: 700, FromType: "Up", ToX: 3900, ToFaceLeft: true },
			{ Name: "CollegeArt1", FromX: 3200, FromY: 500, FromW: 300, FromH: 700, FromType: "Up", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Liane", X: 3000 }
		]
	},
	{
		Name: "CollegeArt1",
		Background: "CollegeArt1",
		Width: 3800,
		Height: 1200,
		Door: [
			{ Name: "CollegeHall1", FromX: 0, FromY: 500, FromW: 200, FromH: 700, FromType: "Up", ToX: 3900, ToFaceLeft: true },
			{ Name: "CastleHall1A", FromX: 3700, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 200, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Liane", X: 1400 },
			{ Name: "Kara", X: 2500 }
		]
	},*/
	{
		Name: "BedroomMelody",
		Text: "Melody's Bedroom (heal and save)",
		Background: "Castle/BedroomMelody",
		Music: "MelodyRoom",
		Width: 2000,
		Height: 1200,
		LimitLeft: 200,
		LimitRight: 1750,
		Heal: 250,
		Door: [
			{ Name: "CastleHall3W", FromX: 200, FromY: 0, FromW: 150, FromH: 1200, FromType: "Up", ToX: 500, ToFaceLeft: false },
		]
	},
	{
		Name: "CastleHall3W",
		Entry: function() { if (!PlatformEventDone("JealousMaid")) PlatformDialogStart("JealousMaid"); },
		Text: "3F - Bedroom Hallway - West",
		Background: "Castle/Hall3W",
		Music: "CastleHall",
		Width: 3200,
		Height: 1200,
		LimitLeft: 250,
		Door: [
			{ Name: "BedroomMelody", FromX: 350, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 275, ToFaceLeft: false },
			{ Name: "CastleHall3C", FromX: 3100, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Hazel", Status: "Maid", X: 2000 }
		]
	},
	{
		Name: "CastleHall3C",
		Entry: function() {
			if (PlatformEventDone("OliviaBath") && PlatformRoom.Door) {
				PlatformRoom.Door.push({ Name: "CastleHall2C", FromX: 1950, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 1100, ToFaceLeft: false });
				PlatformRoom.Background = "Castle/Hall3Cv2";
			}
		},
		Text: "3F - Bedroom Hallway - Center",
		Background: "Castle/Hall3C",
		AlternateBackground: "Castle/Hall3Cv2",
		Music: "CastleHall",
		Width: 4800,
		Height: 1200,
		Door: [
			{ Name: "CastleHall3W", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3100, ToFaceLeft: true },
			{ Name: "CastleHall4C", FromX: 2550, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 2700, ToFaceLeft: false },
			{ Name: "CastleHall3E", FromX: 4700, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
			{ Name: "CastleHall2E", FromX: -1000, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false } // Used for faster loading
		],
		Character: [
			{ Name: "Hazel", Status: "Maid", X: 1300 },
			{ Name: "Hazel", Status: "Maid", X: 3500 }
		]
	},
	{
		Name: "CastleHall3E",
		Text: "3F - Bedroom Hallway - East",
		Background: "Castle/Hall3E",
		Music: "CastleHall",
		Width: 3800,
		Height: 1200,
		LimitRight: 3550,
		Door: [
			{ Name: "CastleHall3C", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 4700, ToFaceLeft: true },
			{ Name: "BedroomOlivia", FromX: 750, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 100, ToFaceLeft: false },
			{ Name: "BedroomIsabella", FromX: 3150, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Yuna", Status: "Maid", X: 2100 }
		]
	},
	{
		Name: "BedroomOlivia",
		Entry: function() {
			PlatformChar.splice(1, 100);
			if (!PlatformEventDone("OliviaUnchain") && !PlatformEventDone("OliviaCollarKey")) PlatformCreateCharacter("Olivia", "Chained", 2200, true, false, "IntroOliviaBeforeCollarKey");
			if (!PlatformEventDone("OliviaUnchain") && PlatformEventDone("OliviaCollarKey")) PlatformCreateCharacter("Olivia", "Chained", 2200, true, false, "IntroOliviaAfterCollarKey");
			if (PlatformEventDone("OliviaBath") && !PlatformEventDone("Curse")) { PlatformCreateCharacter("Olivia", "Oracle", 2200, true, false, "OliviaAfterBath"); PlatformChar[1].FaceLeft = true; }
			if (PlatformEventDone("OliviaBath") && PlatformEventDone("Curse") && !PlatformEventDone("OliviaCurseIntro") && !PlatformEventDone("CamilleDefeat")) { PlatformCreateCharacter("Olivia", "Oracle", 2200, true, false, "OliviaCurseIntro"); PlatformChar[1].Health = 0; PlatformChar[1].Bound = true; }
			if (PlatformEventDone("OliviaBath") && PlatformEventDone("Curse") && PlatformEventDone("OliviaCurseIntro") && !PlatformEventDone("CamilleDefeat")) { PlatformCreateCharacter("Olivia", "Oracle", 2200, true, false, "OliviaCurse"); PlatformChar[1].Health = 0; PlatformChar[1].Bound = true; }
			if (PlatformEventDone("OliviaBath") && PlatformEventDone("Curse") && PlatformEventDone("CamilleDefeat") && !PlatformEventDone("OliviaCurseRelease")) { PlatformCreateCharacter("Olivia", "Oracle", 2200, true, false, "OliviaCurseRelease"); PlatformChar[1].Health = 0; PlatformChar[1].Bound = true; }
		},
		Text: "Olivia's Bedroom (heal and save)",
		Background: "Castle/BedroomOlivia",
		Music: "OliviaRoom",
		Width: 3000,
		Height: 1200,
		Heal: 250,
		Door: [
			{ Name: "CastleHall3E", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 900, ToFaceLeft: false },
			{ Name: "BathroomOlivia", FromX: 2900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		]
	},
	{
		Name: "BathroomOlivia",
		Entry: function() {
			if (PlatformEventDone("OliviaUnchain") && !PlatformEventDone("OliviaBath")) PlatformCreateCharacter("Olivia", "Chastity", 1050, true, false, "OliviaBath");
		},
		Text: "Olivia's Bathroom",
		Background: "Castle/BathroomOlivia",
		Music: "OliviaRoom",
		Width: 2000,
		Height: 1200,
		Door: [
			{ Name: "BedroomOlivia", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2900, ToFaceLeft: false }
		]
	},
	{
		Name: "BedroomIsabella",
		Entry: function() {
			if (!PlatformEventDone("EdlaranUnlock")) PlatformCreateCharacter("Hazel", "Maid", 2200);
			if (PlatformEventDone("EdlaranUnlock") && !PlatformEventDone("EdlaranBedroomIsabella") && !PlatformEventDone("CamilleDefeat")) PlatformCreateCharacter("Edlaran", "Archer", 2200, true, false, "EdlaranBedroomIsabella");
		},
		Text: "Isabella's Bedroom",
		Background: "Castle/BedroomIsabella",
		Music: "IsabellaRoom",
		Width: 2400,
		Height: 1200,
		Door: [
			{ Name: "CastleHall3E", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3300, ToFaceLeft: true }
		]
	},
	{
		Name: "CastleHall4C",
		Text: "4F - Roof Hallway - Center",
		Background: "Castle/Hall4C",
		Music: "CastleHall",
		Width: 4800,
		Height: 1200,
		Door: [
			{ Name: "CastleHall4W1", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2300, ToFaceLeft: true },
			{ Name: "CastleHall4E", FromX: 4700, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
			{ Name: "CastleHall3C", FromX: 2550, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 2700, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Hazel", Status: "Maid", X: 1300 },
			{ Name: "Hazel", Status: "Maid", X: 3500 }
		]
	},
	{
		Name: "CastleHall4E",
		Text: "4F - Roof Hallway - East",
		Background: "Castle/Hall4E",
		Music: "CastleHall",
		Width: 3800,
		Height: 1200,
		LimitRight: 3550,
		Door: [
			{ Name: "CastleHall4C", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 4700, ToFaceLeft: true },
			{ Name: "CastleBalcony", FromX: 3150, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Yuna", Status: "Maid", X: 1400 },
			{ Name: "Hazel", Status: "Maid", X: 2100 }
		]
	},
	{
		Name: "CastleBalcony",
		Entry: function() {
			if (!PlatformEventDone("OliviaUnchain") && !PlatformEventDone("OliviaCollarKey")) PlatformCreateCharacter("Isabella", "Winter", 1175, true, false, "IntroIsabellaBeforeCollarKey");
			else if (!PlatformEventDone("OliviaUnchain") && PlatformEventDone("OliviaCollarKey")) PlatformCreateCharacter("Isabella", "Winter", 1175, true, false, "IntroIsabellaAfterCollarKey");
			else PlatformCreateCharacter("Yuna", "Maid", 1500);
		},
		Text: "Roof Balcony",
		Background: "Castle/Balcony",
		Music: "IsabellaRoom",
		Width: 2000,
		Height: 1200,
		LimitRight: 1700,
		Door: [
			{ Name: "CastleHall4E", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3300, ToFaceLeft: true }
		]
	},
	{
		Name: "CastleHall4W1",
		Text: "4F - Roof Hallway - West 1",
		Background: "Castle/Hall4W1",
		Music: "CastleHall",
		Width: 2400,
		Height: 1200,
		Door: [
			{ Name: "CastleHall4W2", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2300, ToFaceLeft: true },
			{ Name: "CastleHall4C", FromX: 2300, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Hazel", Status: "Maid", X: 1000 },
			{ Name: "Hazel", Status: "Maid", X: 1400 }
		]
	},
	{
		Name: "CastleHall4W2",
		Text: "4F - Roof Hallway - West 2",
		Background: "Castle/Hall4W2",
		Music: "CastleHall",
		Width: 2400,
		Height: 1200,
		Door: [
			{ Name: "CastleHall4W3", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2300, ToFaceLeft: true },
			{ Name: "CastleHall4W1", FromX: 2300, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Yuna", Status: "Maid", X: 1000 },
			{ Name: "Yuna", Status: "Maid", X: 1400 }
		]
	},
	{
		Name: "CastleHall4W3",
		Entry: function() {
			if (PlatformEventDone("Curse")) {
				PlatformCreateCharacter("Lucy", "Armor", 1000);
				PlatformCreateCharacter("Lucy", "Armor", 1400);
			}
		},
		Text: "4F - Roof Hallway - West 3",
		Background: "Castle/Hall4W1",
		Music: "CastleHall",
		Width: 2400,
		Height: 1200,
		Door: [
			{ Name: "CastleCountessHall", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2100, ToFaceLeft: true },
			{ Name: "CastleHall4W2", FromX: 2300, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		]
	},
	{
		Name: "CastleCountessHall",
		Entry: function() {
			if (PlatformEventDone("Curse") && !PlatformEventDone("CamilleDefeat")) {
				PlatformCreateCharacter("Camille", "Armor", 300);
				PlatformRoom.LimitRight = 2200;
				PlatformRoom.Background = "Castle/CountessHallClosed";
				PlatformDialogStart("CamilleIntro");
			}
			if (PlatformEventDone("Curse") && PlatformEventDone("CamilleDefeat") && !PlatformEventDone("OliviaCurseRelease")) {
				PlatformCreateCharacter("Camille", "Armor", 1100);
				PlatformChar[1].Health = 0;
				PlatformChar[1].Bound = true;
				PlatformChar[1].Dialog = "CamilleDefeatEnd";
			}
			if (PlatformEventDone("Curse") && PlatformEventDone("CamilleDefeat") && PlatformEventDone("OliviaCurseRelease")) {
				PlatformRoom.Background = "Castle/CountessHall";
				PlatformRoom.LimitLeft = 0;
				if (!PlatformEventDone("CamilleEscape")) {
					PlatformEventSet("CamilleEscape");
					PlatformDialogStart("CamilleEscape");
				}
			}
		},
		Text: "Countess Hall",
		Background: "Castle/CountessHallDeadEnd",
		AlternateBackground: "Castle/CountessHallClosed",
		Music: "CamilleCastleBattle",
		Width: 2400,
		Height: 1200,
		LimitLeft: 200,
		Door: [
			{ Name: "CastleHall4W3", FromX: 2300, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
			{ Name: "CastleTerrace", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 1900, ToFaceLeft: true }
		]
	},
	{
		Name: "CastleTerrace",
		Entry: function() {
			if (PlatformEventDone("Curse") && PlatformEventDone("CamilleDefeat") && PlatformEventDone("OliviaCurseRelease") && !PlatformEventDone("OliviaTerrace") && (PlatformPlayer?.Name != "Olivia")) PlatformCreateCharacter("Olivia", "Oracle", 400, true, false, "OliviaTerrace");
			if (PlatformEventDone("Curse") && PlatformEventDone("CamilleDefeat") && PlatformEventDone("OliviaCurseRelease") && !PlatformEventDone("OliviaTerrace") && (PlatformPlayer?.Name != "Melody")) PlatformCreateCharacter("Melody", "Maid", 600, true, false, "OliviaTerrace", true);
			if (PlatformEventDone("EdlaranJoin") && !PlatformEventDone("OliviaTerrace") && (PlatformPlayer?.Name != "Edlaran")) PlatformCreateCharacter("Edlaran", "Archer", 800, true, false, "EdlaranTerrace", true);
			if (PlatformEventDone("OliviaTerrace")) PlatformRoom.Door?.push({ Name: "ForestCastleWall", FromX: 400, FromY: 0, FromW: 550, FromH: 1200, FromType: "Up", ToX: 500, ToFaceLeft: false });
		},
		Text: "Countess Terrace",
		Background: "Castle/Terrace",
		Music: "MelodyRoom",
		Width: 2000,
		Height: 1200,
		LimitLeft: 200,
		Door: [
			{ Name: "CastleCountessHall", FromX: 1900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
			{ Name: "ForestCastleWall", FromX: -1000, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false } // Used for faster loading
		]
	},
	{
		Name: "CastleHall2C",
		Entry: function() { if (!PlatformEventDone("CursedMaid") && PlatformEventDone("Curse")) PlatformDialogStart("CursedMaid"); },
		Text: "2F - Storehouse Hallway - Center",
		Background: "Castle/Hall2C",
		Music: "CastleHall",
		Width: 8200,
		Height: 1200,
		LimitLeft: 200,
		LimitRight: 8000,
		Door: [
			{ Name: "CastleHall3C", FromX: 950, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 2100, ToFaceLeft: false },
			{ Name: "WineCellar", FromX: 3950, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 1050, ToFaceLeft: false },
			{ Name: "CastleHall1C", FromX: 6950, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 2700, ToFaceLeft: true }
		],
		Character: [
			{ Name: "Hazel", Status: "Maid", X: 2000 },
			{ Name: "Yuna", Status: "Maid", X: 3200 },
			{ Name: "Yuna", Status: "Maid", X: 5000 },
			{ Name: "Hazel", Status: "Maid", X: 6200 }
		]
	},
	{
		Name: "WineCellar",
		Entry: function() {

			if (PlatformEventDone("EdlaranBedroomIsabella") && !PlatformEventDone("EdlaranWineCellar") && !PlatformEventDone("EdlaranJoin") && !PlatformEventDone("CamilleDefeat")) {
				PlatformCreateCharacter("Edlaran", "Archer", 2500, true, false, "EdlaranWineCellar");
				return;
			}

			if (PlatformEventDone("LynJoin") && PlatformEventDone("EdlaranJoin") && (PlatformPlayer?.Name != "Lyn") && (PlatformPlayer?.Name != "Edlaran") && PlatformDialogCharacterIsSingle("Lyn") && PlatformDialogCharacterIsSingle("Edlaran") && !PlatformTempEvent.includes("EdlaranLynWineCellar")) {
				PlatformCreateCharacter("Edlaran", "Archer", 2500, true, false, "EdlaranLynWineCellar", true);
				PlatformCreateCharacter("Lyn", "Thief", 2200, true, false, "EdlaranLynWineCellar", false);
				return;
			}

			if (PlatformEventDone("LynJoin") && PlatformEventDone("EdlaranJoin") && (PlatformPlayer?.Name != "Lyn") && (PlatformPlayer?.Name != "Edlaran") && PlatformDialogCharactersAreLovers("Lyn", "Edlaran") && !PlatformTempEvent.includes("EdlaranLynWineCellar")) {
				PlatformCreateCharacter("Edlaran", "Archer", 2500, true, false, "EdlaranLynWineCellarBreakUp", true);
				PlatformCreateCharacter("Lyn", "Thief", 2200, true, false, "EdlaranLynWineCellarBreakUp", false);
				return;
			}

			PlatformCreateCharacter("Yuna", "Maid", 2500);

		},
		Text: "Wine Cellar",
		Background: "Castle/WineCellar",
		Music: "CastleHall",
		Width: 3000,
		Height: 1200,
		Door: [
			{ Name: "CastleHall2C", FromX: 900, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 4100, ToFaceLeft: false }
		]
	},
	{
		Name: "CastleHall1C",
		Entry: function() {
			if (!PlatformEventDone("IntroGuard") && !PlatformEventDone("Curse")) PlatformDialogStart("IntroGuardBeforeCurse");
			if (!PlatformEventDone("Curse")) PlatformChar[1].Combat = false;
		},
		Text: "1F - Guard Hallway - Center",
		Background: "Castle/Hall1C",
		Music: "CastleDungeon",
		Width: 4000,
		Height: 1200,
		LimitRight: 3800,
		Door: [
			{ Name: "CastleHall1W", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 6300, ToFaceLeft: true },
			{ Name: "CastleHall2C", FromX: 2550, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 7100, ToFaceLeft: true }
		],
		Character: [
			{ Name: "Lucy", Status: "Armor", X: 2100 }
		]
	},
	{
		Name: "CastleHall1W",
		Entry: function() {
			if (!PlatformEventDone("Curse")) { PlatformChar[1].Combat = false; PlatformChar[2].Combat = false; }
		},
		Text: "1F - Guard Hallway - West",
		Background: "Castle/Hall1W",
		Music: "CastleDungeon",
		Width: 6400,
		Height: 1200,
		LimitLeft: 200,
		Door: [
			{ Name: "CastleHall1C", FromX: 6300, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
			{ Name: "CastleDungeon1W", FromX: 1150, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 1100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Lucy", Status: "Armor", X: 2800 },
			{ Name: "Lucy", Status: "Armor", X: 3600 }
		]
	},
	{
		Name: "CastleDungeon1W",
		Entry: function() {
			if (!PlatformEventDone("Curse")) { PlatformChar[1].Combat = false; PlatformChar[2].Combat = false; }
		},
		Text: "Dungeon Hallway - West",
		Background: "Castle/Dungeon1W",
		BackgroundFilter: "#00000040",
		Music: "CastleDungeon",
		Width: 6200,
		Height: 1200,
		LimitLeft: 200,
		Door: [
			{ Name: "CastleDungeon1C", FromX: 6100, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
			{ Name: "CastleHall1W", FromX: 950, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 1300, ToFaceLeft: false },
			{ Name: "DungeonCell", FromX: 5150, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Lucy", Status: "Armor", X: 2800 },
			{ Name: "Lucy", Status: "Armor", X: 3600 }
		]
	},
	{
		Name: "CastleDungeon1C",
		Entry: function() {
			if (!PlatformEventDone("IntroGuardCurse") && PlatformEventDone("Curse")) PlatformDialogStart("IntroGuardAfterCurse");
			if (!PlatformEventDone("Curse")) PlatformChar[1].Combat = false;
		},
		Text: "Dungeon Hallway - East",
		Background: "Castle/Dungeon1C",
		BackgroundFilter: "#00000040",
		Music: "CastleDungeon",
		Width: 4400,
		Height: 1200,
		LimitRight: 4200,
		Door: [
			{ Name: "CastleDungeon1W", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 6300, ToFaceLeft: true },
			{ Name: "BedroomDungeon", FromX: 750, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 350, ToFaceLeft: false },
			{ Name: "DungeonStorage", FromX: 3150, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 350, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Lucy", Status: "Armor", X: 2100 }
		]
	},
	{
		Name: "BedroomDungeon",
		Text: "Dungeon Bedroom (heal and save)",
		Background: "Castle/BedroomDungeon",
		BackgroundFilter: "#00000080",
		Music: "MelodyRoom",
		Width: 2200,
		Height: 1200,
		Heal: 250,
		Door: [
			{ Name: "CastleDungeon1C", FromX: 200, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 900, ToFaceLeft: false },
		]
	},
	{
		Name: "DungeonCell",
		Entry: function() {
			if (!PlatformEventDone("EdlaranFree") && !PlatformEventDone("Curse") && !PlatformEventDone("EdlaranIntro") && !PlatformEventDone("CamilleDefeat")) PlatformCreateCharacter("Edlaran", "Chained", 1800, true, false, "IntroEdlaranBeforeCurseStart");
			if (!PlatformEventDone("EdlaranFree") && !PlatformEventDone("Curse") && PlatformEventDone("EdlaranIntro") && !PlatformEventDone("CamilleDefeat")) PlatformCreateCharacter("Edlaran", "Chained", 1800, true, false, "IntroEdlaranBeforeCurseEnd");
			if (!PlatformEventDone("EdlaranFree") && PlatformEventDone("Curse") && !PlatformEventDone("EdlaranCurseIntro") && !PlatformEventDone("CamilleDefeat")) PlatformCreateCharacter("Edlaran", "Chained", 1800, true, false, "IntroEdlaranAfterCurseStart");
			if (!PlatformEventDone("EdlaranFree") && PlatformEventDone("EdlaranCurseIntro") && !PlatformEventDone("EdlaranKey") && !PlatformEventDone("CamilleDefeat")) PlatformCreateCharacter("Edlaran", "Chained", 1800, true, false, "IntroEdlaranAfterCurseEnd");
			if (!PlatformEventDone("EdlaranFree") && PlatformEventDone("EdlaranKey") && !PlatformEventDone("EdlaranUnlock") && !PlatformEventDone("CamilleDefeat")) PlatformCreateCharacter("Edlaran", "Chained", 1800, true, false, "EdlaranUnlock");
		},
		Text: "Dungeon Cell",
		Background: "Castle/DungeonCell",
		BackgroundFilter: "#00000080",
		Music: "CastleDungeon",
		Width: 2000,
		Height: 1200,
		Door: [
			{ Name: "CastleDungeon1W", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 5300, ToFaceLeft: true }
		]
	},
	{
		Name: "DungeonStorage",
		Entry: function() {
			if (PlatformEventDone("Curse")) PlatformChar[1].Dialog = "ChestRestraintsAfterCurse";
		},
		Text: "Dungeon Restraints Storage",
		Background: "Castle/DungeonStorage",
		BackgroundFilter: "#00000060",
		Music: "CastleDungeon",
		Width: 2000,
		Height: 1200,
		Door: [
			{ Name: "CastleDungeon1C", FromX: 250, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 3300, ToFaceLeft: true }
		],
		Character: [
			{ Name: "Chest", Status: "Metal", X: 1700, Combat: false, Fix: true, Dialog: "ChestRestraintsBeforeCurse" }
		]
	},
	{
		Name: "ForestCastleWall",
		Text: "Wall Exterior",
		Background: "Forest/CastleWall",
		Music: "ForestTheme",
		Width: 3800,
		Height: 1200,
		LimitLeft: 300,
		Door: [
			{ Name: "CastleTerrace", FromX: 350, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 625, ToFaceLeft: false },
			{ Name: "ForestVulture", FromX: 3700, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Lucy", Status: "Armor", X: 1300 },
			{ Name: "Lucy", Status: "Armor", X: 2500 }
		]
	},
	{
		Name: "ForestVulture",
		Text: "Forest Entrance",
		Background: "Forest/VulturePlain",
		Music: "ForestTheme",
		Width: 2200,
		Height: 1200,
		Door: [
			{ Name: "ForestCastleWall", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3700, ToFaceLeft: false },
			{ Name: "ForestCabinPath", FromX: 2100, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Yuna", Status: "Maid", X: 1400 }
		]
	},
	{
		Name: "ForestCabinPath",
		Text: "Cabin Path",
		Background: "Forest/CabinPath",
		Music: "ForestTheme",
		Width: 3800,
		Height: 1200,
		Door: [
			{ Name: "ForestVulture", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2100, ToFaceLeft: true },
			{ Name: "ForestCabin", FromX: 2200, FromY: 0, FromW: 350, FromH: 1200, FromType: "Up", ToX: 250, ToFaceLeft: false },
			{ Name: "ForestBirchWest", FromX: 3700, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		]
	},
	{
		Name: "ForestCabin",
		Entry: function() {
			PlatformChar.splice(1, 100);
			if (!PlatformEventDone("ForestCapture") || PlatformEventDone("ForestCaptureEnd")) {
				if (PlatformPlayer?.Name != "Olivia") PlatformCreateCharacter("Olivia", "Oracle", 1300, true, false, "OliviaCabin");
				if (PlatformPlayer?.Name != "Melody") PlatformCreateCharacter("Melody", "Maid", 1600, true, false, PlatformPlayer?.Name + "Cabin", true);
				if (PlatformEventDone("EdlaranJoin") && (PlatformPlayer?.Name != "Edlaran")) PlatformCreateCharacter("Edlaran", "Archer", 1900, true, false, "EdlaranCabin", true);
				if (PlatformEventDone("LynJoin") && (PlatformPlayer?.Name != "Lyn")) PlatformCreateCharacter("Lyn", "Thief", 2200, true, false, "LynCabin", true);
			}
		},
		Text: "Wooden Cabin (heal and save)",
		Background: "Forest/CabinInterior",
		Music: "MelodyRoom",
		Width: 3300,
		Height: 1000,
		Heal: 250,
		Door: [
			{ Name: "ForestCabinPath", FromX: 0, FromY: 0, FromW: 500, FromH: 1200, FromType: "Up", ToX: 2375, ToFaceLeft: false }
		]
	},
	{
		Name: "ForestBirchWest",
		Entry: function() {
			if (!PlatformEventDone("IntroForestBandit") && PlatformEventDone("EdlaranJoin")) PlatformDialogStart("IntroForestBanditEdlaran");
			if (!PlatformEventDone("IntroForestBandit") && !PlatformEventDone("EdlaranJoin")) PlatformDialogStart("IntroForestBanditOlivia");
		},
		Text: "Birch Path West",
		Background: "Forest/BirchLight",
		Music: "ForestTheme",
		Width: 3500,
		Height: 1400,
		Door: [
			{ Name: "ForestCabinPath", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3700, ToFaceLeft: true },
			{ Name: "ForestBirchCenter", FromX: 3400, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Vera", Status: "Leather", X: 2100 }
		]
	},
	{
		Name: "ForestBirchCenter",
		Text: "Birch Path Center",
		Background: "Forest/BirchHeavy",
		Music: "ForestTheme",
		Width: 3200,
		Height: 1400,
		Door: [
			{ Name: "ForestBirchWest", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3400, ToFaceLeft: true },
			{ Name: "ForestBirchEast", FromX: 3100, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Entry: function() {
			if ((PlatformPlayer?.X ?? 0) <= 1000) {
				PlatformCreateProjectile("Barrel", "Wood", false, 500, 1, 24, 0, 6);
			} else {
				PlatformCreateProjectile("Barrel", "Wood", true, 2700, 1, 24, 0, 6);
			}
		}
	},
	{
		Name: "ForestBirchEast",
		Text: "Birch Path East",
		Background: "Forest/BirchClear",
		Music: "ForestTheme",
		Width: 4300,
		Height: 1400,
		Door: [
			{ Name: "ForestBirchCenter", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3100, ToFaceLeft: true },
			{ Name: "ForestOakHeavy", FromX: 1650, FromY: 0, FromW: 800, FromH: 1200, FromType: "Up", ToX: 100, ToFaceLeft: false },
			{ Name: "ForestBirchMaze", FromX: 4200, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: true }
		],
		Character: [
			{ Name: "Vera", Status: "Leather", X: 1200 },
			{ Name: "Vera", Status: "Leather", X: 3100 }
		]
	},
	{
		Name: "ForestOakHeavy",
		Entry: function() {
			if (!PlatformEventDone("EdlaranForestIntro") && !PlatformEventDone("EdlaranJoin")) PlatformDialogStart("IntroForestBanditKidnapEdlaran");
			if (!PlatformEventDone("EdlaranJoin")) {
				const Char = PlatformCreateCharacter("Edlaran", "Archer", 2200, true, false, "EdlaranForestBeg");
				if (Char) {
					Char.Health = 0;
					Char.Bound = true;
				}
			}
		},
		Text: "Giant Oak",
		Background: "Forest/OakHeavy",
		Music: "ForestTheme",
		Width: 2700,
		Height: 1400,
		LimitRight: 2500,
		Door: [
			{ Name: "ForestBirchEast", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2050, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Vera", Status: "Leather", X: 1900 }
		]
	},
	{
		Name: "ForestBirchMaze",
		Text: "Lost Birch Path",
		Background: "Forest/BirchMaze",
		BackgroundFilter: "#00000040",
		Music: "ForestTheme",
		Width: 3200,
		Height: 1400,
		Door: [
			{ Name: "ForestBirchEast", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 4200, ToFaceLeft: true },
			{ Name: "ForestBirchMazePath", FromX: 3100, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 1500, ToFaceLeft: true }
		],
		Character: [
			{ Name: "Vera", Status: "Leather", X: 1800 }
		]
	},
	{
		Name: "ForestBirchMazePath",
		Background: "Forest/BirchMaze",
		Music: "ForestTheme",
		Entry: function() {
			if (PlatformEventDone("ForestCapture") || PlatformEventDone("ForestCaptureEnd")) PlatformLoadRoom("ForestFirPath");
			else PlatformDialogStart(PlatformEventDone("EdlaranJoin") ? "ForestPath" : "ForestLost");
		},
	},
	{
		Name: "ForestBarnInterior",
		Entry: function() {
			if (PlatformEventDone("ForestCaptureRescueMelody") && !PlatformEventDone("BarnThiefRescueMelody")) PlatformCreateCharacter("Hazel", "Maid", 1650, true, false, "BarnThiefRescueMelody", false);
			if (!PlatformEventDone("BarnThiefRescueMelody")) PlatformCreateCharacter("Lyn", "Thief", 1800, true, false, PlatformEventDone("ForestCaptureRescueMelody") ? "BarnThiefRescueMelody" : "BarnThief", true);
			if (PlatformEventDone("BarnThiefRescueMelody")) {
				PlatformCreateCharacter("Hazel", "Maid", 1800, false, true, null, true);
				PlatformRoom.Heal = undefined;
				PlatformRoom.Door?.push({ Name: "ForestBarnExterior", FromX: 900, FromY: 0, FromW: 250, FromH: 1200, FromType: "Up", ToX: 1050, ToFaceLeft: false });
				PlatformMessageSet("Wooden Barn");
				PlatformHeal = null;
			}
		},
		Text: "Wooden Barn (heal and save)",
		Background: "Forest/BarnInterior",
		Music: "ForestPlainTheme",
		Width: 2000,
		Height: 1333,
		Heal: 250,
		Door: []
	},
	{
		Name: "ForestCrateInterior",
		Text: "Wooden Crate (heal and save)",
		Background: "Forest/CrateInterior",
		Music: "MelodyRoom",
		Width: 2000,
		Height: 1000,
		Heal: 250,
		Door: []
	},
	{
		Name: "ForestCampGround",
		Text: "Camp Site (heal and save)",
		Background: "Forest/CampGround",
		AlternateBackground: "Forest/CampGroundRaft",
		Music: "ForestTheme",
		Entry: function() {
			if (PlatformEventDone("ForestCaptureEnd")) {
				PlatformRoom.Door?.push({ Name: "ForestLakeShore", FromX: 200, FromY: 0, FromW: 400, FromH: 1200, FromType: "Up", ToX: 3100, ToFaceLeft: true });
				PlatformRoom.LimitLeft = 200;
				PlatformRoom.Background = "Forest/CampGroundRaft";
			}
		},
		Width: 2000,
		Height: 1400,
		LimitLeft: 600,
		Heal: 250,
		Door: [
			{ Name: "ForestLakePath", FromX: 1900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
	},
	{
		Name: "ForestLakePath",
		Text: "Lake Path",
		Background: "Forest/LakeBetweenRocks",
		Music: "ForestTheme",
		Width: 2800,
		Height: 1400,
		Door: [
			{ Name: "ForestCampGround", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 1900, ToFaceLeft: true },
			{ Name: "ForestFirPath", FromX: 2700, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Yuna", Status: "Maid", X: 600 },
			{ Name: "Hazel", Status: "Maid", X: 2200 }
		]
	},
	{
		Name: "ForestFirPath",
		Text: "Fir Path",
		Background: "Forest/FirLight",
		Music: "ForestTheme",
		Width: 3000,
		Height: 1400,
		Door: [
			{ Name: "ForestLakePath", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2700, ToFaceLeft: true },
			{ Name: "ForestBirchMaze", FromX: 1200, FromY: 0, FromW: 600, FromH: 1200, FromType: "Up", ToX: 3100, ToFaceLeft: true },
			{ Name: "ForestGreenWoods", FromX: 2900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Lucy", Status: "Armor", X: 600 },
			{ Name: "Yuna", Status: "Maid", X: 2400 }
		]
	},
	{
		Name: "ForestGreenWoods",
		Text: "Green Woods",
		Background: "Forest/GreenWoods",
		Music: "ForestTheme",
		Width: 2000,
		Height: 1300,
		Door: [
			{ Name: "ForestFirPath", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2700, ToFaceLeft: true },
			{ Name: "ForestPond", FromX: 1900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Entry: function() {
			if ((PlatformPlayer?.X ?? 0) <= 1000) {
				PlatformCreateProjectile("Barrel", "Wood", false, 100, 1, 24, 0, 6);
			} else {
				PlatformCreateProjectile("Barrel", "Wood", true, 1900, 1, 24, 0, 6);
			}
		}
	},
	{
		Name: "ForestPond",
		Text: "Frog Pond",
		Background: "Forest/LostPond",
		Music: "ForestTheme",
		Width: 4200,
		Height: 1400,
		Door: [
			{ Name: "ForestGreenWoods", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2900, ToFaceLeft: true },
			{ Name: "ForestSecluded", FromX: 4100, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false }
		],
		Character: [
			{ Name: "Hazel", Status: "Maid", X: 800 },
			{ Name: "Vera", Status: "Leather", X: 3300 },
			{ Name: "Yuna", Status: "Maid", X: 2050 }
		]
	},
	{
		Name: "ForestSecluded",
		Entry: function() {
			if (!PlatformEventDone("ForestBanditCrate")) PlatformDialogStart("ForestBanditCrate");
		},
		Text: "Secluded Clearing",
		Background: "Forest/SecludedClearing",
		Music: "ForestTheme",
		Width: 2500,
		Height: 1400,
		LimitRight: 2350,
		Door: [
			{ Name: "ForestPond", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 4100, ToFaceLeft: true },
		],
		Character: [
			{ Name: "Crate", Status: "Wood", X: 1800, Combat: false, Fix: true, Dialog: "MelodyCrate" },
			{ Name: "Vera", Status: "Leather", X: 600 },
			{ Name: "Lucy", Status: "Armor", X: 1800 }
		]
	},
	{
		Name: "ForestBarnExterior",
		Text: "Barn Exterior",
		Background: "Forest/BarnExterior",
		Music: "ForestPlainTheme",
		Width: 3000,
		Height: 1400,
		Door: [
			{ Name: "ForestPlainToSavannah", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3500, ToFaceLeft: true },
			{ Name: "ForestBarnInterior", FromX: 900, FromY: 0, FromW: 300, FromH: 1200, FromType: "Up", ToX: 1050, ToFaceLeft: false },
			{ Name: "ForestPlainSparseRocks", FromX: 2900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
		],
		Character: [
			{ Name: "Yuna", Status: "Maid", X: 2100 }
		]
	},
	{
		Name: "ForestPlainSparseRocks",
		Text: "Sparse Plain",
		Background: "Forest/PlainSparseRocks",
		Music: "ForestPlainTheme",
		Width: 5000,
		Height: 1400,
		Door: [
			{ Name: "ForestBarnExterior", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2900, ToFaceLeft: true },
			{ Name: "ForestMountainLake", FromX: 4900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
		],
		Character: [
			{ Name: "Yuna", Status: "Maid", X: 2100 },
			{ Name: "Lucy", Status: "Armor", X: 2900 },
		]
	},
	{
		Name: "ForestMountainLake",
		Text: "Lake Path",
		Background: "Forest/MountainLake",
		Music: "ForestPlainTheme",
		Width: 4400,
		Height: 1400,
		Door: [
			{ Name: "ForestPlainSparseRocks", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 4900, ToFaceLeft: true },
			{ Name: "ForestLakeShore", FromX: 4300, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
		],
		Character: [
			{ Name: "Vera", Status: "Leather", X: 1500 },
			{ Name: "Hazel", Status: "Maid", X: 2900 },
		]
	},
	{
		Name: "ForestLakeShore",
		Text: "Lake Shore",
		Background: "Forest/LakeShoreRaft",
		Music: "ForestPlainTheme",
		Width: 4000,
		Height: 1400,
		LimitRight: 3300,
		Door: [
			{ Name: "ForestMountainLake", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 4300, ToFaceLeft: true },
			{ Name: "ForestLake", FromX: 2900, FromY: 0, FromW: 400, FromH: 1200, FromType: "Up", ToX: 400, ToFaceLeft: false },
		],
		Character: [
			{ Name: "Vera", Status: "Leather", X: 1500 },
			{ Name: "Lucy", Status: "Armor", X: 2500 },
		]
	},
	{
		Name: "ForestLake",
		Background: "Forest/LakeShore",
		Music: "ForestPlainTheme",
		Entry: function() {
			PlatformLoadRoom("ForestCampGround");
			if (!PlatformEventDone("ForestCaptureEnd")) PlatformDialogStart("ForestCaptureEnd");
		},
	},
	{
		Name: "ForestPlainToSavannah",
		Text: "Savannah Plain",
		Background: "Forest/PlainToSavannah",
		Music: "ForestPlainTheme",
		Width: 3600,
		Height: 1400,
		Door: [
			{ Name: "SavannahBanditCampGate", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 5400, ToFaceLeft: true },
			{ Name: "ForestBarnExterior", FromX: 3500, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
		],
		Character: [
			{ Name: "Vera", Status: "Leather", X: 1300 },
			{ Name: "Vera", Status: "Leather", X: 2300 },
		]
	},
	{
		Name: "SavannahBanditCampGate",
		Text: "Bandit Camp Gate",
		Background: "Savannah/BanditCampGateClosed",
		AlternateBackground: "Savannah/BanditCampGateOpen",
		Music: "ThiefBoss",
		Entry: function() {
			if (!PlatformEventDone("ForestCaptureEnd")) PlatformDialogStart("ThiefBossFlee");
			else if (!PlatformEventDone("ThiefBossIntro")) PlatformDialogStart("ThiefBossIntro");
			if (!PlatformEventDone("ThiefBossRetreat")) PlatformCreateCharacter("Lyn", "Thief", 500, true, false);
			else {
				PlatformRoom.Background = "Savannah/BanditCampGateOpen";
				PlatformRoom.LimitLeft = null;
			}
		},
		Width: 5500,
		Height: 1400,
		LimitLeft: 1025,
		Door: [
			{ Name: "SavannahBanditCamp", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 1600, ToFaceLeft: true },
			{ Name: "ForestPlainToSavannah", FromX: 5400, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
			{ Name: "SavannahBanditPath", FromX: 2600, FromY: 0, FromW: 1000, FromH: 1200, FromType: "Up", ToX: 400, ToFaceLeft: false },
		],
		Character: [
			{ Name: "Vera", Status: "Leather", X: 1100 },
			{ Name: "Vera", Status: "Leather", X: 1900 },
			{ Name: "Vera", Status: "Leather", X: 4400 },
		]
	},
	{
		Name: "SavannahBanditCamp",
		Text: "Bandit Camp",
		Background: "Savannah/BanditCampClosed",
		AlternateBackground: "Savannah/BanditCampOpen",
		Music: "ThiefBoss",
		Entry: function() {
			if (!PlatformEventDone("ThiefBossDefeat") || !PlatformEventDone("ThiefBossSecondDefeat")) {
				PlatformDialogStart(!PlatformEventDone("ThiefBossDefeat") ? "ThiefBossBattle" : "ThiefBossSecondBattle");
				const Lyn = PlatformCreateCharacter("Lyn", "Thief", 400);
				if (Lyn) {
					Lyn.MaxHealth = PlatformEventDone("ThiefBossDefeat") ? 73 : 57;
					Lyn.Health = Lyn.MaxHealth;
					Lyn.Projectile = PlatformEventDone("ThiefBossDefeat") ? 30 : 15;
					Lyn.RunSpeed = PlatformEventDone("ThiefBossDefeat") ? 18 : 15;
					Lyn.JumpForce = PlatformEventDone("ThiefBossDefeat") ? 60 : 50;
					Lyn.ProjectileDamage = [11, 11];
					Lyn.ProjectileBothSides = true;
				}
			} else {
				PlatformCreateCharacter("Vera", "Leather", 800);
				PlatformCreateCharacter("Vera", "Leather", 1200);
				if (!PlatformEventDone("LynJoin")) PlatformCreateCharacter("Crate", "Wood", 1000, true, false, "ThiefBossRescueInBattle");
			}
		},
		Width: 2000,
		Height: 1400,
		LimitLeft: 200,
		LimitRight: 1800,
		Door: [
			{ Name: "SavannahBanditCampGate", FromX: 1900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
		]
	},
	{
		Name: "SavannahBanditPath",
		Text: "Bandit Path",
		Background: "Savannah/BanditPath",
		Music: "Savannah",
		Width: 2800,
		Height: 1400,
		Door: [
			{ Name: "SavannahBanditCampGate", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3100, ToFaceLeft: true },
			{ Name: "SavannahEdge", FromX: 2700, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
		],
		Entry: function() {
			if ((PlatformPlayer?.X ?? 0) <= 1000) {
				PlatformCreateProjectile("Barrel", "Wood", false, 100, 1, 24, 0, 6);
				PlatformCreateProjectile("Barrel", "Wood", false, 1000, 1, 24, 0, 6);
			} else {
				PlatformCreateProjectile("Barrel", "Wood", true, 2700, 1, 24, 0, 6);
				PlatformCreateProjectile("Barrel", "Wood", true, 1800, 1, 24, 0, 6);
			}
		},
	},
	{
		Name: "SavannahEdge",
		Text: "Savannah's Edge",
		Background: "Savannah/Edge",
		Music: "Savannah",
		Width: 2500,
		Height: 1400,
		Door: [
			{ Name: "SavannahBanditPath", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3100, ToFaceLeft: true },
			{ Name: "SavannahTentExterior", FromX: 2400, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
		],
		Character: [
			{ Name: "Lucy", Status: "Armor", X: 1800 },
		]
	},
	{
		Name: "SavannahTentExterior",
		Text: "Savannah Tent Exterior",
		Background: "Savannah/TentExterior",
		Music: "Savannah",
		Width: 2000,
		Height: 1000,
		Door: [
			{ Name: "SavannahEdge", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2700, ToFaceLeft: true },
			{ Name: "SavannahTentInterior", FromX: 800, FromY: 0, FromW: 400, FromH: 1200, FromType: "Up", ToX: 100, ToFaceLeft: false },
			{ Name: "DesertEntrance", FromX: 1900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100, ToFaceLeft: false },
		]
	},
	{
		Name: "SavannahTentInterior",
		Text: "Savannah Tent Interior (heal and save)",
		Background: "Savannah/TentInterior",
		Music: "MelodyRoom",
		Width: 2000,
		Height: 1400,
		LimitRight: 1800,
		Heal: 250,
		Entry: function() {
			PlatformChar.splice(1, 100);
			if (PlatformPlayer?.Name != "Olivia") PlatformCreateCharacter("Olivia", "Oracle", 1700, true, false, "OliviaTent", true);
			if (PlatformPlayer?.Name != "Melody") PlatformCreateCharacter("Melody", "Maid", 1400, true, false, PlatformPlayer?.Name + "Tent", (PlatformPlayer?.Name == "Olivia"));
			if (PlatformPlayer?.Name != "Edlaran") PlatformCreateCharacter("Edlaran", "Archer", 1100, true, false, "EdlaranTent");
			if ((PlatformPlayer?.Name != "Lyn") && PlatformEventDone("LynJoin")) PlatformCreateCharacter("Lyn", "Thief", 800, true, false, "LynTent");
		},
		Door: [
			{ Name: "SavannahTentExterior", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 1000, ToFaceLeft: false },
		]
	},
	{
		Name: "DesertEntrance",
		Text: "Desert Entrance",
		Background: "Desert/CactusPath",
		Music: "Desert",
		Width: 2600,
		Height: 1400,
		Door: [
			{ Name: "SavannahTentExterior", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 1900, ToFaceLeft: true },
			{ Name: "DesertCactusField", FromX: 2500, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100 },
		],
		Entry: function() {
			if (!PlatformEventDone("DesertEntrance") && PlatformEventDone("LynJoin")) PlatformDialogStart("DesertEntranceLyn");
			if (!PlatformEventDone("DesertEntrance") && !PlatformEventDone("LynJoin")) PlatformDialogStart("DesertEntrance");
		},
		Character: [
			{ Name: "Scorpion", Status: "Gold", X: 1400 },
		]
	},
	{
		Name: "DesertCactusField",
		Text: "Desert Cactus Field",
		Background: "Desert/CactusField",
		Music: "Desert",
		Width: 3500,
		Height: 1400,
		Door: [
			{ Name: "DesertEntrance", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2500, ToFaceLeft: true },
			{ Name: "DesertCactusSun", FromX: 3400, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100 },
		],
		Character: [
			{ Name: "Scorpion", Status: "Gold", X: 1500 },
			{ Name: "Scorpion", Status: "Gold", X: 2000 },
		]
	},
	{
		Name: "DesertCactusSun",
		Text: "Desert Fork",
		Background: "Desert/CactusSun",
		Music: "Desert",
		Width: 2100,
		Height: 1400,
		Door: [
			{ Name: "DesertCactusField", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3400, ToFaceLeft: true },
			{ Name: "ZaraPath1", FromX: 750, FromY: 0, FromW: 600, FromH: 1200, FromType: "Up", ToX: 100 },
			{ Name: "DesertDunesCactus", FromX: 2000, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100 },
		],
		Character: [
			{ Name: "Vulture", Status: "Brown", X: 1100 },
		]
	},
	{
		Name: "ZaraPath1",
		Text: "Desert Rock Path",
		Background: "Desert/DunesRocks",
		Music: "Desert",
		Width: 4000,
		Height: 1200,
		Door: [
			{ Name: "DesertCactusSun", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 600 },
			{ Name: "ZaraPath2", FromX: 3900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100 },
		],
		Character: [
			{ Name: "Vulture", Status: "Brown", X: 1300 },
			{ Name: "Vulture", Status: "Brown", X: 2700 },
		]
	},
	{
		Name: "ZaraPath2",
		Text: "Desert Rock Chain",
		Background: "Desert/MountainsChain",
		Music: "Desert",
		Width: 3000,
		Height: 1400,
		Door: [
			{ Name: "ZaraPath1", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3900, ToFaceLeft: true },
			{ Name: "ZaraPath3", FromX: 2900, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100 },
		],
		Character: [
			{ Name: "Vulture", Status: "Brown", X: 1000 },
			{ Name: "Scorpion", Status: "Gold", X: 2000 },
		]
	},
	{
		Name: "ZaraPath3",
		Text: "Desert Rock",
		Background: "Desert/BarrenRocks",
		Music: "Desert",
		Width: 2000,
		Height: 1400,
		Door: [
			{ Name: "ZaraPath2", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2900, ToFaceLeft: true },
		],
		Entry: function() {
			if ((PlatformPlayer.Name != "Zara") && !PlatformEventDone("ZaraJoin")) {
				const Zara = PlatformCreateCharacter("Zara", "Slave", 1000, true, false, "ZaraPetrified");
				if (Zara) {
					Zara.Health = 0;
					Zara.Bound = true;
					Zara.Petrified = true;
				}
			}
		},
	},
	{
		Name: "DesertDunesCactus",
		Text: "Desert Cactus Dunes",
		Background: "Desert/DunesCactus",
		Music: "Desert",
		Width: 3500,
		Height: 1400,
		Door: [
			{ Name: "DesertCactusSun", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 2500, ToFaceLeft: true },
			{ Name: "DesertDunesBrown", FromX: 3400, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100 },
		],
		Character: [
			{ Name: "Vulture", Status: "Brown", X: 1200 },
			{ Name: "Vulture", Status: "Brown", X: 2300 },
		]
	},
	{
		Name: "DesertDunesBrown",
		Text: "Desert Dunes",
		Background: "Desert/DunesBrown",
		Music: "Desert",
		Width: 4500,
		Height: 1200,
		Door: [
			{ Name: "DesertDunesCactus", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 3400, ToFaceLeft: true },
			{ Name: "DesertDunesHeat", FromX: 4400, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100 },
		],
		Character: [
			{ Name: "Scorpion", Status: "Gold", X: 1300 },
			{ Name: "Vulture", Status: "Brown", X: 2250 },
			{ Name: "Scorpion", Status: "Gold", X: 3200 },
		]
	},
	{
		Name: "DesertDunesHeat",
		Text: "Desert Dunes",
		Background: "Desert/DunesBrown",
		Music: "Desert",
		Width: 4500,
		Height: 1200,
		Door: [
			{ Name: "DesertDunesCactus", FromX: 0, FromY: 0, FromW: 100, FromH: 1200, FromType: "Left", ToX: 4400, ToFaceLeft: true },
			{ Name: "DesertDunesBrown", FromX: 3400, FromY: 0, FromW: 100, FromH: 1200, FromType: "Right", ToX: 100 },
		],
		Entry: function() {
			PlatformDialogStart("DesertEnd");
		}
	},

];

/**
 * Loads a room and it's parameters
 * @param {string} CharacterName - The character name to load
 * @param {string} StatusName - The status of that character
 * @param {number} X - The X position of the character
 * @param {boolean | null} [Fix] - TRUE if the character won't move
 * @param {boolean | null} [Combat] - TRUE if the character will deal and receive combat damage
 * @param {string | null} [Dialog] - The dialog name to open when talking to that character
 * @param {boolean | null} [FaceLeft]  - TRUE if the character should be facing left
 * @param {number | null} [ReplaceAtPos]  - The position in the index to replace the char, if NULL we add it
 * @returns {Platform.Character | null} - Returns the platform character
 */
function PlatformCreateCharacter(CharacterName, StatusName, X, Fix = undefined, Combat = undefined, Dialog = undefined, FaceLeft = undefined, ReplaceAtPos = undefined) {
	const template = PlatformTemplate.find(t => t.Name === CharacterName && t.Status === StatusName);
	if (!template) return null;

	const NewChar = /** @type {Platform.Character} */({ ...template });

	if (template.OnBind != null) NewChar.OnBind = template.OnBind;

	NewChar.Camera = (PlatformChar.length == 0);
	NewChar.ID = (ReplaceAtPos == null) ? PlatformChar.length : ReplaceAtPos;
	NewChar.X = X;
	if (NewChar.FlyingHeight == null) NewChar.Y = PlatformFloor;
	else NewChar.Y = PlatformFloor - NewChar.FlyingHeight;
	NewChar.ForceX = 0;
	NewChar.ForceY = 0;
	NewChar.Experience = 0;
	NewChar.Level = 1;
	NewChar.HalfBound = false;
	NewChar.BaseHealth = NewChar.Health;
	NewChar.BaseMagic = NewChar.Magic;
	NewChar.BaseProjectile = NewChar.Projectile;
	NewChar.BaseProjectileTime = NewChar.ProjectileTime;
	NewChar.BaseWalkSpeed = NewChar.WalkSpeed;
	NewChar.BaseRunSpeed = NewChar.RunSpeed ?? NewChar.WalkSpeed;
	NewChar.WalkSpeed = Math.round(NewChar.BaseWalkSpeed * (1 + (PlatformDialogLoverAndSlaveFactor(NewChar.Name, "Edlaran") * 0.1)));
	NewChar.RunSpeed = Math.round(NewChar.BaseRunSpeed * (1 + (PlatformDialogLoverAndSlaveFactor(NewChar.Name, "Edlaran") * 0.1)));
	PlatformSetHealth(NewChar);
	if (Fix != null) NewChar.Fix = Fix;
	if (Combat != null) NewChar.Combat = Combat;
	if (Dialog != null) NewChar.Dialog = Dialog;
	if (NewChar.Fix == null) NewChar.Fix = false;
	if (NewChar.Combat == null) NewChar.Combat = true;
	NewChar.Run = false;
	NewChar.NextJump = 0;
	if ((NewChar.DamageBackOdds == null) || (NewChar.DamageBackOdds < 0) || (NewChar.DamageBackOdds > 1)) NewChar.DamageBackOdds = 1;
	if ((NewChar.DamageFaceOdds == null) || (NewChar.DamageFaceOdds < 0) || (NewChar.DamageFaceOdds > 1)) NewChar.DamageFaceOdds = 1;
	NewChar.FaceLeft = ((NewChar.Dialog == null) && (PlatformRoom != null) && (PlatformRoom.Width != null) && (X > PlatformRoom.Width / 2));
	if (FaceLeft != null) NewChar.FaceLeft = FaceLeft;
	if (NewChar.Perk == null) NewChar.Perk = "";
	if (NewChar.PerkName == null) NewChar.PerkName = [];
	if (ReplaceAtPos == null) PlatformChar.push(NewChar);
	else PlatformChar[ReplaceAtPos] = NewChar;
	if (NewChar.Camera) {
		PlatformPlayer = NewChar;
		PlatformPlayer.DamageBackOdds = 0;
		PlatformPlayer.DamageFaceOdds = 0;
	}
	return NewChar;
}

/**
 * Returns TRUE if a specific event is already done
 * @param {string} Event - The name of the event
 * @returns {boolean} - TRUE if done
 */
function PlatformEventDone(Event) {
	return (PlatformEvent.indexOf(Event) >= 0);
}

/**
 * Adds an event to the list of events done
 * @param {Platform.EventType} Event - The name of the event
 * @returns {void} - Nothing
 */
function PlatformEventSet(Event) {
	if (!PlatformEventDone(Event)) PlatformEvent.push(Event);
}

/**
 * Sets the on screen message for 4 seconds
 * @param {string} Text - The text to show
 * @returns {void} - Nothing
 */
function PlatformMessageSet(Text) {
	if (CurrentScreen == "Platform")
		PlatformMessage = { Text: Text, Timer: CommonTime() + 4000 };
}

/**
 * Loads a room and it's parameters
 * @param {string} [RoomName] - The name of the room to load, can be null to reload the current room
 * @returns {void} - Nothing
 */
function PlatformLoadRoom(RoomName) {
	if (RoomName == null) RoomName = PlatformRoom.Name;
	PlatformRoom = /** @type {never} */ (null);
	PlatformSaveMode = false;
	PlatformGiftMode = false;
	for (let Room of PlatformRoomList)
		if (Room.Name == RoomName)
			PlatformRoom = CommonCloneDeep(Room);
	if (PlatformRoom == null) return;
	if (PlatformRoom.Text != null) PlatformMessageSet(PlatformRoom.Text);
	PlatformHeal = (PlatformRoom.Heal == null) ? null : CommonTime() + PlatformRoom.Heal;
	if (PlatformHeal) PlatformTempEvent = [];
	if (PlatformPlayer?.Name == "Lyn") PlatformPlayer.Projectile = PlatformPlayer.MaxProjectile;
	PlatformChar.splice(1, 100);
	if (PlatformRoom.Character != null)
		for (let Char of PlatformRoom.Character)
			PlatformCreateCharacter(Char.Name, Char.Status, Char.X, Char.Fix, Char.Battle, Char.Dialog);
	for (let Room of PlatformRoomList)
		if ((Room.Name == RoomName) && (Room.Entry != null))
			Room.Entry();
}

/**
 * Adds a character to the party
 * @param {Platform.PartyMember} C - The character to add to the roster
 * @returns {void} - Nothing
 */
function PlatformPartyAdd(C) {
	let P = {
		Character: C.Character,
		Status: C.Status,
		Level: C.Level,
		Experience: C.Experience,
		Perk: C.Perk
	};
	if ((P.Character == null) || (P.Status == null)) return;
	if ((P.Level == null) || (P.Level <= 0) || (P.Level > 10)) P.Level = 1;
	if ((P.Experience == null) || (P.Experience < 0)) P.Experience = 0;
	if ((P.Perk == null) || (P.Perk.length != 10)) P.Perk = "0000000000";
	PlatformParty.push(P);
}

/**
 * Saves the current character stats in the party object
 * @returns {void} - Nothing
 */
function PlatformPartySave() {
	for (let P of PlatformParty)
		if (P.Character == PlatformPlayer?.Name) {
			P.Experience = PlatformPlayer.Experience;
			P.Level = PlatformPlayer.Level;
			P.Perk = PlatformPlayer.Perk ?? "";
			return;
		}
}

/**
 * Loads the current character stats from the party object
 * @returns {void} - Nothing
 */
function PlatformPartyLoad() {
	for (let P of PlatformParty)
		if (P.Character == PlatformPlayer?.Name) {
			PlatformPlayer.Experience = P.Experience;
			PlatformPlayer.Level = P.Level;
			PlatformPlayer.Perk = P.Perk;
			PlatformSetHealth(PlatformPlayer);
			return;
		}
}

/**
 * Activates the next party character
 * @returns {void} - Nothing
 */
function PlatformPartyNext() {
	if (PlatformParty.length <= 1) return;
	PlatformPartySave();
	PlatformKeys = [];
	let Pos = 0;
	for (let P = 0; P < PlatformParty.length - 1; P++)
		if (PlatformParty[P].Character == PlatformPlayer?.Name)
			Pos = P + 1;
	PlatformPlayer = /** @type {Platform.Character} */ (PlatformCreateCharacter(PlatformParty[Pos].Character, PlatformParty[Pos].Status, PlatformPlayer?.X ?? 0, null, null, null, PlatformPlayer?.FaceLeft, 0));
	if (PlatformPlayer) {
		PlatformPlayer.Camera = true;
		PlatformPlayer.Level = PlatformParty[Pos].Level;
		PlatformPlayer.Experience = PlatformParty[Pos].Experience;
		PlatformPlayer.Perk = PlatformParty[Pos].Perk;
		PlatformSetHealth(PlatformPlayer);
	}
	PlatformDialogEvent();
	for (let Room of PlatformRoomList)
		if ((Room.Name == PlatformRoom.Name) && (Room.Entry != null))
			Room.Entry();
}

/**
 * Activates a specific character by name
 * @param {Platform.CharacterName} CharacterName - The character name to activate
 * @returns {void} - Nothing
 */
function PlatformPartyActivate(CharacterName) {
	PlatformPlayer.Name = /** @type {never} */ ("");
	while (PlatformPlayer.Name != CharacterName)
		PlatformPartyNext();
}

/**
 * Builds the party to switch active characters
 * @returns {void} - Nothing
 */
function PlatformPartyBuild() {
	if (PlatformParty.length == 0)
		PlatformPartyAdd({ Character: "Melody", Status: "Maid", Level: 1, Experience: 0, Perk: "0000000000" });
	if (PlatformEventDone("OliviaCurseRelease")) {
		let CreateOlivia = true;
		for (let P of PlatformParty)
			if (P.Character == "Olivia")
				CreateOlivia = false;
		if (CreateOlivia)
			PlatformPartyAdd({ Character: "Olivia", Status: "Oracle", Level: 1, Experience: 0, Perk: "0000000000" });
	}
	if (PlatformEventDone("EdlaranJoin")) {
		let CreateEdlaran = true;
		for (let P of PlatformParty)
			if (P.Character == "Edlaran")
				CreateEdlaran = false;
		if (CreateEdlaran)
			PlatformPartyAdd({ Character: "Edlaran", Status: "Archer", Level: 1, Experience: 0, Perk: "0000000000" });
	}
	if (PlatformEventDone("LynJoin")) {
		let CreateLyn = true;
		for (let P of PlatformParty)
			if (P.Character == "Lyn")
				CreateLyn = false;
		if (CreateLyn)
			PlatformPartyAdd({ Character: "Lyn", Status: "Thief", Level: 1, Experience: 0, Perk: "0000000000" });
	}
	PlatformDialogEvent();
}

/**
 * When the platform screen is loaded
 * @type {ScreenLoadHandler}
 */
async function PlatformLoad() {

	// Clears the active keys
	PlatformKeys = [];
	PlatformLastTime = CommonTime();

	// In mobile mode, we try to remove all events that could alter the experience
	if (CommonIsMobile) {
		const CV = document.getElementById("MainCanvas");
		if (!CV) return;
		CV.onselectstart = function (e) { e.preventDefault(); return false; };
		CV.oncontextmenu = function(e) { e.preventDefault(); return false; };
		CV.ondragstart  = function(e) { e.preventDefault(); return false; };
		CV.ondrop  = function(e) { e.preventDefault(); return false; };
		CV.ondblclick = function(e) { e.preventDefault(); return false; };
		CV.classList.add("NoSelect");
		document.body.onselectstart = function (e) { e.preventDefault(); return false; };
		document.body.oncontextmenu = function(e) { e.preventDefault(); return false; };
		document.body.ondragstart  = function(e) { e.preventDefault(); return false; };
		document.body.ondrop  = function(e) { e.preventDefault(); return false; };
		document.body.ondblclick = function(e) { e.preventDefault(); return false; };
		document.body.classList.add("NoSelect");
	}

}

/**
 * Get the proper animation from the cycle to draw
 * @param {Platform.Character} C - The character to evaluate
 * @param {Platform.AnimationName} Pose - The pose we want
 * @param {boolean | null} [Cycle] - TRUE if we must use the animation cycle
 * @returns {Platform.AnimationSpec} - An object with the image, width & height to draw
 */
function PlatformGetAnim(C, Pose, Cycle = null) {
	for (let A = 0; A < C.Animation.length; A++)
		if (C.Animation[A].Name == Pose) {
			let CycleList = (((C.FaceLeft === true) && (C.Animation[A].CycleLeft != null)) ? C.Animation[A].CycleLeft : C.Animation[A].Cycle) ?? [];
			let AnimPos;
			if ((Cycle == null) || Cycle) AnimPos = Math.floor(CommonTime() / (C.Animation[A].Speed ?? 0) + C.ID) % CycleList.length;
			else AnimPos = Math.floor((CommonTime() - (C.Action?.Start ?? 0)) / (C.Animation[A].Speed ?? 0));
			if (AnimPos < 0) AnimPos = 0;
			if (AnimPos >= CycleList.length) AnimPos = CycleList.length - 1;
			if ((C.FaceLeft === true) && (C.Animation[A].CycleLeft != null)) Pose = Pose + "Left";
			if ((C.Anim == null) || (C.Anim.Name == null) || (C.Anim.Name != C.Animation[A].Name)) PlatformSoundEffect("Animation", C.Animation[A].Audio ?? []);
			return {
				Name: Pose,
				Image: CycleList[AnimPos],
				OffsetX: (C.Animation[A].OffsetX || 0),
				OffsetY: (C.Animation[A].OffsetY || 0),
				Width: (C.Animation[A].Width || C.Width),
				Height: (C.Animation[A].Height || C.Height),
				Mirror: ((C.FaceLeft === true) && (C.Animation[A].CycleLeft == null))
			};
		}
	throw new Error("Anim: " + Pose + " not found for character: " + C.Name);
}

/**
 * Returns TRUE if the current action for a character is ActionName
 * @param {Platform.Character} C - The character to validate
 * @param {Platform.AnimationName | "Any"} ActionName - The action to validate (all actions are valid if "Any"
 * @returns {boolean} - TRUE if the character action is that string
 */
function PlatformActionIs(C, ActionName) {
	if ((C.Action != null) && (ActionName == "Any") && (C.Action.Expire != null) && (C.Action.Expire > CommonTime())) return true;
	if ((C.Action != null) && (C.Action.Name == ActionName) && (C.Action.Expire != null) && (C.Action.Expire > CommonTime())) return true;
	return false;
}

/**
 * Focuses the background camera and draws it
 * @returns {void} - Nothing
 */
function PlatformDrawBackground() {
	if (!PlatformRoom || !PlatformPlayer) return;

	// Draws the background within the borders
	PlatformViewX = (PlatformPlayer?.X ?? 0) - 1000;
	if (PlatformViewX < 0) PlatformViewX = 0;
	if (PlatformViewX > (PlatformRoom.Width ?? 0) - 2000) PlatformViewX = (PlatformRoom.Width ?? 0) - 2000;
	PlatformViewY = (PlatformPlayer?.Y ?? 0) - 400;
	if (PlatformViewY < 0) PlatformViewY = 0;
	if (PlatformViewY > (PlatformRoom.Height ?? 0) - 1000) PlatformViewY = (PlatformRoom.Height ?? 0) - 1000;
	DrawImageZoomCanvas("Screens/Room/Platform/Background/" + PlatformRoom.Background + ".jpg", MainCanvas, PlatformViewX, PlatformViewY, 2000, 1000, 0, 0, 2000, 1000);
	if (PlatformRoom.BackgroundFilter != null) DrawRect(0, 0, 2000, 1000, PlatformRoom.BackgroundFilter);
	if (PlatformTimedScreenFilter.End >= CommonTime()) DrawRect(0, 0, 2000, 1000, PlatformTimedScreenFilter.Filter);
	DrawImageZoomCanvas("Screens/Room/Platform/Character/Face/" + PlatformPlayer.Name + PlatformPlayer.Status + ".png", MainCanvas, 0, 0, 150, 190, 3, 8, 112, 142);
	DrawProgressBar(120, 10, 180, 40, PlatformPlayer.Health / PlatformPlayer.MaxHealth * 100, "#00B000", "#B00000");
	DrawText(PlatformPlayer.Health.toString(), 210, 32, "White", "Black");
	DrawProgressBar(120, 60, 180, 40, PlatformPlayer.Experience / PlatformExperienceForLevel[PlatformPlayer.Level] * 100, "#600060", "Black");
	DrawText(PlatformPlayer.Level.toString(), 210, 82, "White", "Black");
	if (PlatformActionIs(PlatformPlayer, "Bind") && PlatformPlayer.Action)
		DrawProgressBar(120, 110, 180, 40, (CommonTime() - PlatformPlayer.Action.Start) / (PlatformPlayer.Action.Expire - PlatformPlayer.Action.Start) * 100, "White", "Black");
	else if ((PlatformPlayer.Health <= 0) && !PlatformPlayer.Bound && (PlatformPlayer.RiseTime != null) && (PlatformPlayer.RiseTime >= CommonTime()))
		DrawProgressBar(120, 110, 180, 40, 100 - ((PlatformPlayer.RiseTime - CommonTime()) / 100), "White", "Black");

	// Draws the magic or projectile reserve
	if ((PlatformPlayer.MaxMagic != null) && (PlatformPlayer.MaxMagic > 0) && PlatformHasPerk(PlatformPlayer, "Apprentice")) {
		DrawProgressBar(310, 10, 180, 40, (PlatformPlayer.Magic ?? 0) / PlatformPlayer.MaxMagic * 100, "#0000B0", "#000000");
		DrawText(`${PlatformPlayer.Magic}`, 400, 32, "White", "Black");
	}
	if ((PlatformPlayer.MaxProjectile != null) && (PlatformPlayer.MaxProjectile > 0)) {
		DrawProgressBar(310, 10, 180, 40, (PlatformPlayer.Projectile ?? 0) / PlatformPlayer.MaxProjectile * 100, "#808000", "#000000");
		DrawText(`${PlatformPlayer.Projectile}`, 400, 32, "White", "Black");
	}
	if ((PlatformPlayer.ProjectileAim == null) && PlatformMoveActive("Aim")) PlatformPlayer.ProjectileAim = CommonTime();
	if (PlatformPlayer.ProjectileAim != null) {
		let Progress = (CommonTime() - PlatformPlayer.ProjectileAim) / ((PlatformPlayer.ProjectileTime ?? 1) / 50);
		if (Progress > 100) Progress = 100;
		DrawProgressBar(310, 60, 180, 40, Progress, (Progress >= 100) ? "#00FF00" : (Progress >= 50) ? "#FFFF00" : "#FF0000", "#000000");
	}

	// Clears the past cooldowns
	for (let C = 0; C < PlatformCooldown.length; C++)
		if (PlatformCooldown[C].Time < CommonTime()) {
			PlatformCooldown.splice(C, 1);
			C--;
		}

	// Draws the cooldowns
	let Y = 50;
	for (let C of PlatformCooldown) {
		DrawProgressBar(310, Y + 10, 180, 40, 100 - ((C.Time - CommonTime()) / C.Delay * 100), "White", "Black");
		DrawImage("Screens/Room/Platform/Icon/" + C.Type + ".png", 313, Y + 13);
		Y = Y + 50;
	}

	// Preloads the next rooms
	if (PlatformRoom.Door != null)
		for (let Door of PlatformRoom.Door)
			for (let Room of PlatformRoomList)
				if ((Room.Name == Door.Name) && (Room.Background != null)) {
					let FileName = "Screens/Room/Platform/Background/" + Room.Background + ".jpg";
					let Obj = DrawImageCache.get(FileName);
					if ((Obj == null) || (Obj.width == null) || (Obj.width <= 0))
						DrawImage(FileName, 2000, 1000);
					if (Room.AlternateBackground != null) {
						FileName = "Screens/Room/Platform/Background/" + Room.AlternateBackground + ".jpg";
						Obj = DrawImageCache.get(FileName);
						if ((Obj == null) || (Obj.width == null) || (Obj.width <= 0))
							DrawImage(FileName, 2000, 1000);
					}
				}

}

/**
 * Draw a specific character on the screen if needed
 * @param {Platform.Character} C - The character to draw
 * @param {number} Time - The current time when the action is done
 * @returns {void} - Nothing
 */
function PlatformDrawCharacter(C, Time) {
	if (!C.Anim) return;
	let X = C.X - (C.Anim.Width ?? 0) / 2 - PlatformViewX;
	let Y = C.Y - (C.Anim.Height ?? 0) - PlatformViewY - 1200 + (PlatformRoom.Height ?? 0);
	if ((X >= 2000) || (Y >= 1000)) return;
	if ((X + (C.Anim.Width ?? 0) <= 0) || (Y + (C.Anim.Height ?? 0) <= 0)) return;
	DrawImageEx("Screens/Room/Platform/Character/" + C.Name + "/" + C.Status + "/" + C.Anim.Name + "/" + C.Anim.Image?.toString() + ".png", MainCanvas, X + (C.Anim.OffsetX ?? 0), Y + (C.Anim.OffsetY ?? 0), { Mirror: C.Anim.Mirror, Width: C.Anim.Width, Height: C.Anim.Height } );
	if (PlatformPlayer && PlatformHeartEffect && (PlatformDialogCharactersAreLovers(C.Name, PlatformPlayer.Name) || C.Camera))
		DrawImageZoomCanvas("Screens/Room/Platform/Effect/Love.png", MainCanvas, 0, 0, 1000, 1000, X, Y + (((C.Anim.Name === "Crouch") || (C.Anim.Name === "Crawl")) ? C.Height / 3 : 0), C.Width, C.Height);
	if ((C.Effect != null) && (C.Effect.Name != null) && (C.Effect.End != null) && (C.Effect.End >= Time))
		DrawImageEx("Screens/Room/Platform/Effect/" + C.Effect.Name + ".png", MainCanvas, X + (C.Anim.OffsetX ?? 0), Y + (C.Anim.OffsetY ?? 0), { Mirror: C.Anim.Mirror, Width: C.Anim.Width, Height: C.Anim.Height } );
	if (C.Damage != null)
		for (let Damage of C.Damage)
			if (Damage.Expire >= Time) {
				DrawImageZoomCanvas("Screens/Room/Platform/" + (Damage.Value < 0 ? "Green" : (C.Camera ? "Enemy" : "Player")) + "Hit.png", MainCanvas, 0, 0, 512, 512, X + (C.Anim.Width ?? 0) / 2 - 50, Y - 250 + Math.floor((Damage.Expire - Time) / 10), 100, 100);
				DrawText(Math.abs(Damage.Value).toString(), X + (C.Anim.Width ?? 0) / 2, Y - 200 + Math.floor((Damage.Expire - Time) / 10), (C.Camera && Damage.Value >= 0 ? "White" : "Black"), (C.Camera && Damage.Value >= 0 ? "Black" : "White"));
			}
	if (C.Loot != null)
		for (let L of C.Loot)
			if (L.Expire >= Time)
				DrawImageZoomCanvas("Screens/Room/Platform/Inventory/" + L.Name + ".png", MainCanvas, 0, 0, 120, 120, X + (C.Anim.Width ?? 0) / 2 - 45, Y - 250 + Math.floor((L.Expire - Time) / 10), 90, 90);
}

/**
 * Sets the max health and current health for the character based on the level and skill
 * @param {Platform.Character} C - The character to evaluate
 * @returns {void} - Nothing
 */
function PlatformSetHealth(C) {
	C.MaxHealth = C.BaseHealth;
	C.MaxMagic = C.BaseMagic;
	C.MaxProjectile = C.BaseProjectile;
	if (C.HealthPerLevel != null) C.MaxHealth = C.MaxHealth + C.HealthPerLevel * C.Level;
	if (C.MagicPerLevel != null) C.MaxMagic = (C.MaxMagic ?? 0) + C.MagicPerLevel * C.Level;
	C.MaxHealth = Math.round(C.MaxHealth * (1 + ((PlatformHasPerk(C, "Healthy") ? 0.1 : 0) + (PlatformHasPerk(C, "Robust") ? 0.15 : 0) + (PlatformDialogLoverAndSlaveFactor(C.Name, "Melody") * 0.1))));
	if (C.MaxMagic != null) C.MaxMagic = Math.round(C.MaxMagic * (1 + (PlatformHasPerk(C, "Witch") ? 0.2 : 0)));
	if ((C.MaxProjectile != null) && PlatformHasPerk(C, "Capacity")) C.MaxProjectile = C.MaxProjectile + 5;
	if ((C.MaxProjectile != null) && PlatformHasPerk(C, "Inventory")) C.MaxProjectile = C.MaxProjectile + 1;
	C.Health = C.MaxHealth;
	C.Magic = C.MaxMagic;
	C.Projectile = C.MaxProjectile;
	if (C.BaseProjectileTime != null) C.ProjectileTime = C.BaseProjectileTime * (PlatformHasPerk(C, "Celerity") ? 0.8 : 1);
	if (PlatformHasPerk(C, "Sprint")) {
		C.WalkSpeed = Math.round(C.BaseWalkSpeed * 1.25);
		C.RunSpeed = Math.round(C.BaseRunSpeed * 1.25);
	}
	else if (PlatformHasPerk(C, "Athletic")) {
		C.WalkSpeed = Math.round(C.BaseWalkSpeed * 1.1);
		C.RunSpeed = Math.round(C.BaseRunSpeed * 1.1);
	}
}

/**
 * Adds experience points to the player, can also gain a level which heals fully
 * @param {Platform.Character} C - The character that will gain experience
 * @param {number} Value - The exp value to add
 * @returns {void} - Nothing
 */
function PlatformAddExperience(C, Value) {
	if ((Value == null) || (Value <= 0)) return;
	if (C.Camera) Value = Value * CheatFactor("DoubleBrawlExperience", 2);
	if (PlatformHasPerk(C, "Scholar")) Value = Value * 1.2;
	Value = Value * (1 + (PlatformDialogLoverAndSlaveFactor(C.Name, "Olivia") * 0.1));
	C.Experience = C.Experience + Value;
	C.Experience = Math.round(C.Experience * 10) / 10;
	if (C.Experience >= PlatformExperienceForLevel[C.Level]) {
		if (C.Camera) PlatformMessageSet(TextGet("LevelUp").replace("CharacterName", C.Name));
		C.Experience = 0;
		C.Level++;
		PlatformSetHealth(C);
	}
}

/**
 * Some perks allow the player to steal items from bound enemies
 * @param {Platform.Character} C - The character that will gain experience
 * @param {number} Value - The experience value to factor the quantity
 * @returns {void} - Nothing
 */
function PlatformSteal(C, Value) {
	if ((C == null) || (Value == null) || (Value <= 0)) return;
	if (PlatformHasPerk(C, "Fletcher") && (C.Projectile != null) && (C.MaxProjectile != null)) {
		let Qty = Math.floor(Math.random() * (Value + 1));
		C.Projectile = C.Projectile + Qty;
		if (C.Projectile > C.MaxProjectile) C.Projectile = C.MaxProjectile;
	}
	if (PlatformHasPerk(C, "Burglar")) {
		let Money = Math.floor(Math.random() * (Value + 1));
		if (Money > 0) CharacterChangeMoney(Player, Money);
	}
}

/**
 * Gives a random inventory to the player
 * @param {Platform.Character | Platform.DummyTemplate} Target - The target that gives the inventory
 * @returns {void} - Nothing
 */
function PlatformAddRandomInventory(Target) {
	let Item = CommonGetRandomItemFromList(PlatformInventoryList);
	PlatformInventoryAdd(Item.Name);
	if (Target.Loot == null) Target.Loot = [];
	Target.Loot.push({ Name: Item.Name, Expire: CommonTime() + 2000});
}

/**
 * Random odds of finding inventory on a defeated enemy
 * @param {Platform.Character} Source - The victorious character
 * @param {Platform.Character} Target - The defeated character
 * @returns {void} - Nothing
 */
function PlatformFindInventory(Source, Target) {
	if ((Source == null) || (Target == null) || (Target.ExperienceValue == null) || (Target.ExperienceValue <= 0)) return;
	let Odds = (Target.LootOdds == null) ? 0.1 : Target.LootOdds;
	if (PlatformHasPerk(Source, "Burglar")) Odds = Odds * 1.75;
	if (Math.random() < Odds) PlatformAddRandomInventory(Target);
}

/**
 * Creates a treasure chest in the current room, tries not to put the chest over the enemy
 * @returns {void} - TRUE if active
 */
function PlatformCreateTreasure() {
	let X = Math.round((PlatformRoom.Width ?? 0) / 2);
	if ((PlatformChar.length >= 2) && (PlatformChar[1].X >= X)) X = X - 500;
	else if ((PlatformChar.length >= 2) && (PlatformChar[1].X <= X)) X = X + 500;
	PlatformCreateCharacter("Treasure", "Metal", X, true, true);
}

/**
 * Applies damage on a target, can become wounded at 0 health
 * @param {Platform.Character} Source - The character doing the damage
 * @param {Platform.Character} Target - The character getting the damage
 * @param {number} Damage - The number of damage to apply
 * @param {number} Time - The current time when the action is done
 * @param {string} Type - The damage type (Collsion or Action)
 * @param {string} AttackName - The name of the attack that was done
 * @returns {void} - Nothing
 */
function PlatformDamage(Source, Target, Damage, Time, Type, AttackName = "") {
	if (Target.Combat === false) return;
	let AutoRestrain = false;
	if (Source.Camera && !Target.Camera && (Target.FaceLeft == Source.FaceLeft) && !PlatformActionIs(Target, "Any")) {
		if (PlatformHasPerk(Source, "Thief")) CharacterChangeMoney(Player, 1);
		if (PlatformHasPerk(Source, "Sneak")) Damage++;
		if (PlatformHasPerk(Source, "Backstab")) Damage++;
		Damage = Damage + PlatformDialogLoverAndSlaveFactor(Source.Name, "Lyn");
		if (PlatformHasPerk(Source, "Kidnapper")) AutoRestrain = true;
	}
	if (!PlatformActionIs(Target, "Any") && (!PlatformActionIs(Source, "Scream") || PlatformHasPerk(Source, "Roar"))) {
		if (Math.random() < Target.DamageBackOdds) Target.FaceLeft = (Source.X - Target.X > 0);
		else if (Math.random() < Target.DamageFaceOdds) Target.FaceLeft = (Source.X - Target.X <= 0);
	}
	if (Target.Camera && PlatformMoveActive("Block") && (Target.FaceLeft != Source.FaceLeft)) {
		Target.ForceX = 0;
		Damage = Math.ceil(Damage / 2);
		if (PlatformPlayer && PlatformHasPerk(PlatformPlayer, "Deflect") && (Type == "Collision")) {
			Source.FaceLeft = !Source.FaceLeft;
			Source.ForceX = (30 + Math.random() * 30) * (Source.FaceLeft ? -1 : 1);
		}
	} else {
		Target.ForceX = ((Target.DamageKnockForce ?? 0) + Math.random() * (Target.DamageKnockForce ?? 0)) * ((Source.X - Target.X < 0) ? 1 : -1);
		if ((Target.Y < PlatformFloor) && (Type == "Action")) {
			Target.ForceY = (AttackName === "Uppercut") ? -35 : -25;
			if ((AttackName === "Uppercut") && PlatformPlayer && PlatformHasPerk(PlatformPlayer, "Impact")) {
				Target.ForceY = -45;
				Damage = Math.ceil(Damage * 1.5);
			}
		}
	}
	Target.Health = Target.Health - Damage;
	Target.Immunity = Time + PlatformImmunityTime;
	if (Target.Damage == null) Target.Damage = [];
	Target.Damage.push({ Value: Damage, Expire: Time + 2000});
	if (Target.Health <= 0) {
		if (Source.PetrifyOnWound) Target.Petrified = true;
		Target.Health = 0;
		Target.RiseTime = Time + (PlatformHasPerk(Target, "Vigorous") ? 7000 : 10000);
		Target.Immunity = Time + 2000;
		if (!Target.Petrified && Target.DownAudio) PlatformSoundEffect("Down", Target.DownAudio);
		if (AutoRestrain || Target.Petrified) PlatformBindTarget(Source, Target);
	} else if (Target.DamageAudio) {
		PlatformSoundEffect("Damage", Target.DamageAudio);
	}
}

/**
 * Checks if the hitbox of an attack clashes with a hitbox of the target
 * @param {Platform.Character} Source - The character doing the damage
 * @param {Platform.Character} Target - The character getting the damage
 * @param {RectTuple} HitBox - The hitbox of the attack
 * @returns {boolean} - TRUE if there's a clash
 */
function PlatformHitBoxClash(Source, Target, HitBox) {

	// Exits right away if data is invalid
	if ((Source == null) || (Target == null) || (HitBox == null)) return false;

	// Finds the X and Y of the source hitbox
	let SX1 = Source.X - (Source.Width / 2) + (HitBox[0] * Source.Width);
	if (Source.FaceLeft) SX1 = Source.X + (Source.Width / 2) - (HitBox[2] * Source.Width);
	let SX2 = Source.X - (Source.Width / 2) + (HitBox[2] * Source.Width);
	if (Source.FaceLeft) SX2 = Source.X + (Source.Width / 2) - (HitBox[0] * Source.Width);
	let SY1 = Source.Y - Source.Height + (HitBox[1] * Source.Height);
	let SY2 = Source.Y - Source.Height + (HitBox[3] * Source.Height);

	// When jumping, the hitbox can change
	let TBox = Target.HitBox;
	if ((Target.JumpHitBox != null) && (Target.Y != PlatformFloor) && !PlatformActionIs(Target, "Any")) TBox = Target.JumpHitBox;

	// Finds the X and Y of the target hitbox
	let TX1 = Target.X - (Target.Width / 2) + (TBox[0] * Target.Width);
	if (Target.FaceLeft) TX1 = Target.X + (Target.Width / 2) - (TBox[2] * Target.Width);
	let TX2 = Target.X - (Target.Width / 2) + (TBox[2] * Target.Width);
	if (Target.FaceLeft) TX2 = Target.X + (Target.Width / 2) - (TBox[0] * Target.Width);
	let TY1 = Target.Y - Target.Height + (TBox[1] * Target.Height);
	let TY2 = Target.Y - Target.Height + (TBox[3] * Target.Height);

	// Shows the hitboxes if we debug
	if (PlatformShowHitBox) {
		DrawRect(SX1 - PlatformViewX, SY1 - PlatformViewY, SX2 - SX1, SY2 - SY1, "red");
		DrawRect(TX1 - PlatformViewX, TY1 - PlatformViewY, TX2 - TX1, TY2 - TY1, "green");
		console.log(SX1 + " " + SX2 + " " + SY1 + " " + SY2);
		console.log(TX1 + " " + TX2 + " " + TY1 + " " + TY2);
	}

	// A full screen hitbox always works
	if ((SX1 < 0) && (SX2 > 2000) && (SY1 < 0) && (SY2 > 1000)) return true;

	// If both hitboxes clashes, we return TRUE
	if ((SX1 >= TX1) && (SY1 >= TY1) && (SX1 <= TX2) && (SY1 <= TY2)) return true;
	if ((SX2 >= TX1) && (SY1 >= TY1) && (SX2 <= TX2) && (SY1 <= TY2)) return true;
	if ((SX1 >= TX1) && (SY2 >= TY1) && (SX1 <= TX2) && (SY2 <= TY2)) return true;
	if ((SX2 >= TX1) && (SY2 >= TY1) && (SX2 <= TX2) && (SY2 <= TY2)) return true;
	return false;

}

/**
 * Plays a sound effect if needed
 * @param {Platform.SoundCategory} Category - The sound effect category
 * @param {Platform.SoundEffect | Platform.SoundEffect[]} Sound - The sound or array of sound to play
 * @param {number} Factor - The volume factor to apply
 * @returns {void} - Nothing
 */
function PlatformSoundEffect(Category, Sound, Factor = 0.3333) {

	// Selects a sound effect from the list
	if (!PlatformAllowAudio) return;
	if ((Category == null) || (Sound == null)) return;
	let Select = "";
	if (typeof Sound === "string") Select = Sound;
	else if (CommonIsArray(Sound)) Select = CommonRandomItemFromList("", Sound).toString();

	// If volume is more than zero, we start the sound effect
	const vol = ((Player.AudioSettings == null) || (Player.AudioSettings.Volume == null)) ? 100 : Player.AudioSettings.Volume;
	if (vol > 0) {
		let SoundEffect = new Audio();
		SoundEffect.currentTime = 0;
		SoundEffect.src = "Screens/Room/Platform/Audio/" + Category + "/" + Select + ".mp3";
		SoundEffect.volume = Math.min(vol, 1) * Factor;
		CommonPromiseCatch(SoundEffect.play());
	}

}

/**
 * Checks if the character action can attack someone else
 * @param {Platform.Character} Source - The character doing the action
 * @param {number} Time - The current time when the action is done
 * @returns {void} - Nothing
 */
function PlatformProcessAction(Source, Time) {
	if ((Source == null) || (Source.Anim == null) || (Source.Anim.Name == null) || (Source.Anim.Image == null) || (Source.Health <= 0)) return;
	for (let Target of PlatformChar)
		if ((Target.ID != Source.ID) && (Target.Health > 0) && Target.Combat && ((Target.Immunity == null) || (Target.Immunity < Time))) {
			let HitBox = null;
			let Damage = 0;
			let Audio = null;
			let AttackName = "";
			if (Source.Attack != null)
				for (let Attack of Source.Attack)
					if ((Attack.Name == Source.Anim.Name) && (Attack.HitAnimation != null) && (Attack.HitAnimation.indexOf(Source.Anim.Image) >= 0)) {
						Damage = Attack.Damage?.[Source.Level] ?? 0;
						AttackName = Attack.Name;
						HitBox = Attack.HitBox;
						Audio = Attack.HitAudio;
						break;
					}
			if (HitBox && PlatformHitBoxClash(Source, Target, HitBox)) {
				if (Audio) PlatformSoundEffect("Hit", Audio);
				PlatformDamage(Source, Target, Damage, Time, "Action", AttackName);
				return;
			}
		}
}

/**
 * Calculates the X force to apply based on the time it took until the last frame and the speed of the object
 * @param {number} Speed - The speed of the object
 * @param {number} Frame - The number of milliseconds since the last frame
 * @returns {number} - The force to apply
 */
function PlatformWalkFrame(Speed, Frame) {
	return Frame * Speed / 50;
}

/**
 * Does collision damage for a character
 * @param {Platform.Character} Target - The character that will be damaged
 * @param {number} Time - The current time when the action is done
 * @returns {void} - Nothing
 */
function PlatformCollisionDamage(Target, Time) {
	if ((Target == null) || (PlatformChar == null) || (Target.Health <= 0)) return;
	for (let Source of PlatformChar)
		if ((Source.ID != Target.ID) && (Source.Health > 0) && Source.Combat && ((Source.CollisionDamage ?? 0) > 0) && ((Target.Immunity == null) || (Target.Immunity < Time)))
			if (PlatformHitBoxClash(Source, Target, Source.HitBox))
				return PlatformDamage(Source, Target, Source.CollisionDamage ?? 0, Time, "Collision");
}

/**
 * Checks if an opponent can bind the player
 * @param {Platform.Character} Source - The opponent that can bind
 * @param {number} Time - The current time when the action is done
 * @returns {void} - Nothing
 */
function PlatformBindPlayer(Source, Time) {
	if (!PlatformPlayer) return;
	if ((PlatformPlayer.Health > 0) || (Source.Health <= 0)) return;
	if (PlatformPlayer.Bound || Source.Bound) return;
	if ((PlatformPlayer.Immunity != null) && (PlatformPlayer.Immunity > Time)) return;
	if ((Source.Action != null) && (Source.Action.Name == "Bind")) return;
	if ((PlatformPlayer.Y != PlatformFloor) || (Source.Y != PlatformFloor) || (Math.abs(PlatformPlayer.X - Source.X) > 50)) return;
	PlatformPlayer.RiseTime = Time + (PlatformHasPerk(PlatformPlayer, "Vigorous") ? 7000 : 10000);
	Source.ForceX = 0;
	Source.Action = { Name: "Bind", Target: PlatformPlayer.ID, Start: Time, Expire: Time + 2000 };
}

/**
 * Returns TRUE if the player input is valid for a move
 * @param {Platform.AnimationName} Move - The movement type (Crouch, jump, left, right, etc.)
 * @returns {boolean}
 */
function PlatformMoveActive(Move) {

	// Crouching can be done with S on the keyboard
	if ((Move == "Crouch") && (PlatformKeys.indexOf("KeyS") >= 0)) return true;
	if ((Move == "Crouch") && CommonTouchActive(75, 875, 200, 100)) return true;

	// Moving left can be done with A on the keyboard
	if ((Move == "Left") && (PlatformKeys.indexOf("KeyA") >= 0)) return true;
	if ((Move == "Left") && CommonTouchActive(25, 725, 150, 150)) return true;

	// Moving right can be done with D on the keyboard
	if ((Move == "Right") && (PlatformKeys.indexOf("KeyD") >= 0)) return true;
	if ((Move == "Right") && CommonTouchActive(175, 725, 150, 150)) return true;

	// Jumping can be done with the spacebar
	if ((Move == "Jump") && (PlatformKeys.indexOf("Space") >= 0)) return true;
	if ((Move == "Jump") && CommonTouchActive(1800, 850, 125, 125)) return true;

	// Aiming requires holding the K key for a set time, only for Edlaran if she has arrows left
	if ((Move == "Aim") && (PlatformPlayer?.ForceX == 0) && (PlatformPlayer.ForceY == 0) && (PlatformPlayer.Name == "Edlaran") && (PlatformPlayer.Projectile != null) && (PlatformPlayer.Projectile > 0)) {
		if (!CommonIsMobile && PlatformKeys.indexOf("KeyK") >= 0) return true;
		if (CommonTouchActive(1675, 700, 125, 125)) return true;
	}

	// Blocking can be done using P, but you need to get the perk first
	if ((Move == "Block") && (PlatformPlayer?.ForceX == 0) && PlatformHasPerk(PlatformPlayer, "Block")) {
		if (!CommonIsMobile && (PlatformKeys.indexOf("KeyP") >= 0)) return true;
		if (CommonTouchActive(1825, 700, 125, 125)) return true;
	}

	// If all else fails, the move is not active
	return false;

}

/**
 * Returns TRUE if an animation is available for the character
 * @param {Platform.Character} C - The character to evaluate
 * @param {Platform.AnimationName} AnimationName - The animation name to search
 * @returns {boolean} - TRUE if it's available
 */
function PlatformAnimAvailable(C, AnimationName) {
	for (let Anim of C.Animation)
		if (Anim.Name == AnimationName)
			return true;
	return false;
}

/**
 * Creates a projectile that will disappear when it hits the floor or a wall
 * @param {Platform.ProjectileName} Name - The name of the projectile (Arrow, Bullet, etc.)
 * @param {Platform.ProjectileType} Type - The type of the projectile (Wood, Iron, etc.)
 * @param {boolean} FaceLeft - IF the projectile is facing the left direction
 * @param {number} X - The X position
 * @param {number} Y - The Y position
 * @param {number} Force - The speed of the projectile
 * @param {number} Gravity - The Y axis gravity pulling that projectile down (default to 0.25)
 * @param {number} Damage - The damage done by the projectile
 * @param {Platform.SoundEffect[]} [HitAudio] - The damage done by the projectile
 * @returns {void} - Nothing
 */
function PlatformCreateProjectile(Name, Type, FaceLeft, X, Y, Force, Gravity = 0.25, Damage, HitAudio) {
	const Proj = PlatformCreateCharacter(Name, Type, X, false, true, null, FaceLeft, null);
	if (!Proj) return;
	Proj.Y = PlatformFloor - Y;
	Proj.IsProjectile = true;
	Proj.Gravity = Gravity;
	Proj.CollisionDamage = Damage;
	Proj.ProjectileForce = Force * (FaceLeft ? -1 : 1);
	Proj.HitAudio = HitAudio ?? [];
}

/**
 * Calculates the projectiles
 * @param {number} Time - The current time stamp of the frame
 * @returns {void} - Nothing
 */
function PlatformProcessProjectile(Time) {

	// First, we remove projectiles that hit a wall or the floor
	for (let C = 0; C < PlatformChar.length; C++)
		if ((PlatformChar[C].IsProjectile != null) && (PlatformChar[C].IsProjectile == true)) {
			let Remove = false;
			if (PlatformChar[C].Y == PlatformFloor) Remove = true;
			else if (PlatformChar[C].X <= 100) Remove = true;
			else if (PlatformChar[C].X >= (PlatformRoom.Width ?? 0) - 100) Remove = true;
			else if ((PlatformRoom.LimitLeft != null) && (PlatformChar[C].X <= PlatformRoom.LimitLeft)) Remove = true;
			else if ((PlatformRoom.LimitRight != null) && (PlatformChar[C].X >= PlatformRoom.LimitRight)) Remove = true;
			if (Remove) {
				PlatformChar.splice(C, 1);
				C--;
			}
		}

	// Second, we remove projectiles that hit a target, applying damage
	for (let C = 0; C < PlatformChar.length; C++)
		if ((PlatformChar[C].IsProjectile != null) && (PlatformChar[C].IsProjectile == true) && (PlatformChar[C].CollisionDamage != null) && ((PlatformChar[C].CollisionDamage ?? 0) > 0)) {
			let Remove = false;
			let Source = PlatformChar[C];
			for (let Target of PlatformChar)
				if ((Source.ID != Target.ID) && (Target.Health > 0) && !Remove && Target.Combat && ((Target.Immunity == null) || (Target.Immunity < Time)))
					if (PlatformHitBoxClash(Source, Target, Source.HitBox)) {
						PlatformDamage(Source, Target, Source.CollisionDamage ?? 0, Time, "Collision");
						PlatformSoundEffect("Hit", Source.HitAudio);
						Remove = true;
					}
			if (Remove) {
				PlatformChar.splice(C, 1);
				C--;
			}
		}

}

/**
 * Consume a projectile from the character and creates it on screen
 * @param {Platform.Character} C - The character that generates the projectile
 * @param {boolean} LongShot - TRUE if it's a long shot
 * @returns {void} - Nothing
 */
function PlatformProjectile(C, LongShot) {
	C.Projectile ??= 0;
	C.Projectile--;
	let Damage = C.ProjectileDamage?.[C.Level];
	if ((Damage == null) || (Damage < 1)) Damage = 1;
	if (PlatformHasPerk(C, "Archery")) Damage++;
	let Y = (C.Height * 0.8) - C.Y + PlatformFloor;
	PlatformCreateProjectile(C.ProjectileName ?? "Arrow", C.ProjectileType ?? "Wood", C.FaceLeft, C.X + ((C.FaceLeft) ? -100 : 100), Y, LongShot ? 60 : 36, 0.25, Damage, C.ProjectileHitAudio);
	if (C.ProjectileBothSides || PlatformHasPerk(C, "Duplicate")) PlatformCreateProjectile(C.ProjectileName ?? "Arrow", C.ProjectileType ?? "Wood", !C.FaceLeft, C.X + ((!C.FaceLeft) ? -100 : 100), Y, LongShot ? 60 : 36, 0.25, Damage, C.ProjectileHitAudio);
}

/**
 * Binds a target character by the source character
 * @param {Platform.Character} Source - The source character that's doing the bondage
 * @param {Platform.Character} Target - The target character that's getting bound
 * @returns {void} - Nothing
 */
function PlatformBindTarget(Source, Target) {
	PlatformAddExperience(Source, Target.ExperienceValue ?? 0);
	PlatformFindInventory(Source, Target);
	PlatformSteal(Source, Target.ExperienceValue ?? 0);
	Target.Bound = true;
	if (Target.OnBind != null) Target.OnBind();
}

/**
 * Draw scenery + all characters, apply X and Y forces
 * @returns {void} - Nothing
 */
function PlatformDrawGame() {
	if (!PlatformPlayer) return;

	// Check if we must enter a new room
	PlatformEnterRoom(PlatformPlayer.FaceLeft ? "Left" : "Right");
	if (PlatformPlayer.Bound && (PlatformRoom.Heal == null)) PlatformMessageSet(TextGet("GameOver"));

	// Keep the last time
	let PlatformTime = CommonTime();
	if (PlatformLastTime == null) PlatformLastTime = PlatformTime;
	let Frame = PlatformTime - PlatformLastTime;

	// Only catches actions if health is greater than zero
	if (PlatformPlayer.Health > 0) {

		// Walk/Crawl left (A or Q for QWERTY and AZERTY)
		if (PlatformMoveActive("Left")) {
			PlatformPlayer.FaceLeft = true;
			if (!PlatformMoveActive("Aim")) {
				if (PlatformPlayer.ForceX > 0) PlatformPlayer.ForceX = 0;
				else PlatformPlayer.ForceX = PlatformPlayer.ForceX - PlatformWalkFrame(((PlatformPlayer.Y == PlatformFloor) && PlatformMoveActive("Crouch")) ? PlatformPlayer.CrawlSpeed : (PlatformPlayer.Run ? PlatformPlayer.RunSpeed : PlatformPlayer.WalkSpeed) ?? 0, Frame);
			}
		}

		// Walk/Crawl right
		if (PlatformMoveActive("Right")) {
			PlatformPlayer.FaceLeft = false;
			if (!PlatformMoveActive("Aim")) {
				if (PlatformPlayer.ForceX < 0) PlatformPlayer.ForceX = 0;
				else PlatformPlayer.ForceX = PlatformPlayer.ForceX + PlatformWalkFrame(((PlatformPlayer.Y == PlatformFloor) && PlatformMoveActive("Crouch")) ? PlatformPlayer.CrawlSpeed : (PlatformPlayer.Run ? PlatformPlayer.RunSpeed : PlatformPlayer.WalkSpeed) ?? 0, Frame);
			}
		}

		// Jump forces the player up on the Y axis
		if (PlatformMoveActive("Jump") && (PlatformPlayer.Y == PlatformFloor)) {
			PlatformPlayer.ForceY = (PlatformPlayer.JumpForce ?? 0) * ((PlatformHasPerk(PlatformPlayer, "Spring") && !PlatformHasPerk(PlatformPlayer, "Bounce")) ? 1.1667 : 1) * -1;
			PlatformJumpPhase = "Jump1";
		}

		// Double jump allows for a second spring
		if (PlatformMoveActive("Jump") && (PlatformPlayer.Y != PlatformFloor) && PlatformHasPerk(PlatformPlayer, "Bounce") && (PlatformJumpPhase == "Release1")) {
			PlatformPlayer.ForceY = (PlatformPlayer.JumpForce ?? 0) * -1;
			PlatformJumpPhase = "Jump2";
		}

		// Release jump for double jumps
		if (!PlatformMoveActive("Jump") && (PlatformPlayer.Y != PlatformFloor) && (PlatformJumpPhase == "Jump1")) PlatformJumpPhase = "Release1";
		if (!PlatformMoveActive("Jump") && (PlatformPlayer.Y != PlatformFloor) && (PlatformJumpPhase == "Jump2")) PlatformJumpPhase = "Release2";

	}

	// Slows down the jump force when jump isn't holded
	if (!PlatformMoveActive("Jump") && (PlatformPlayer.ForceY < 0))
		PlatformPlayer.ForceY = PlatformPlayer.ForceY + PlatformWalkFrame(PlatformGravitySpeed * 2, Frame);

	// If we must heal 1 HP to all characters in the room
	let MustHeal = ((PlatformHeal != null) && (PlatformHeal < PlatformTime));
	if (MustHeal) PlatformHeal = (PlatformRoom.Heal == null) ? null : CommonTime() + PlatformRoom.Heal;

	// If we must regenarate magic for the player
	if (!MustHeal && (PlatformPlayer.MaxMagic != null) && (PlatformPlayer.Magic != null) && (PlatformRegen < PlatformTime)) {
		if (PlatformPlayer.Magic < PlatformPlayer.MaxMagic) PlatformPlayer.Magic++;
		PlatformRegen = PlatformTime + (PlatformHasPerk(PlatformPlayer, "Meditation") ? 6000 : 8000);
	}

	// Draw each characters
	PlatformHeartEffect = false;
	for (let C of PlatformChar) {

		// Fires a projectile if the aim was on
		if ((C.ProjectileAim != null) && !PlatformMoveActive("Aim")) {
			if (PlatformTime - C.ProjectileAim >= (C.ProjectileTime ?? 0)) PlatformProjectile(C, (PlatformTime - C.ProjectileAim >= (C.ProjectileTime ?? 0) * 2));
			C.ProjectileAim = undefined;
		}

		// Enemies will stand up at half health if they were not restrained
		if ((C.Health == 0) && (C.RiseTime != null) && (C.RiseTime < PlatformTime) && !C.Bound)
			C.Health = Math.round(C.MaxHealth / 4);

		// Heal the character
		if (MustHeal && (C.Health > 0) && (C.Health < C.MaxHealth)) C.Health++;
		if (MustHeal && (C.Magic != null) && (C.MaxMagic != null) && (C.MaxMagic > 0) && (C.Magic < C.MaxMagic)) C.Magic++;
		if (MustHeal && (C.Projectile != null) && (C.MaxProjectile != null) && (C.MaxProjectile > 0) && (C.Projectile < C.MaxProjectile)) C.Projectile++;

		// If the player character is using a projectile
		if (C.Camera && (C.Health > 0) && !C.HalfBound && PlatformActionIs(C, "FireProjectile") && C.Action)
			if ((PlatformTime >= C.Action.Start + (C.ProjectileTime ?? 0)) && (C.Action.Done == null)) {
				PlatformProjectile(C, false);
				C.Action.Done = true;
			}

		// AI walks from left to right, some can throw projectiles
		if (!C.Camera && (C.Health > 0) && !C.Fix) {
			if (PlatformActionIs(C, "FireProjectile") && C.Action) {
				if ((PlatformTime >= C.Action.Start + (C.ProjectileTime ?? 0)) && (C.Action.Done == null)) {
					PlatformProjectile(C, false);
					C.Action.Done = true;
				}
			} else {
				if (C.FaceLeft) {
					if (C.X <= ((PlatformRoom.LimitLeft != null) ? PlatformRoom.LimitLeft + 50 : 100)) {
						C.FaceLeft = false;
						C.ForceX = 0;
					} else C.ForceX = C.ForceX - PlatformWalkFrame((C.Run ? C.RunSpeed : C.WalkSpeed) ?? 0, Frame);
				} else {
					if (C.X >= ((PlatformRoom.LimitRight != null) ? PlatformRoom.LimitRight - 50 : (PlatformRoom.Width ?? 0) - 100)) {
						C.FaceLeft = true;
						C.ForceX = 0;
					} else C.ForceX = C.ForceX + PlatformWalkFrame((C.Run ? C.RunSpeed : C.WalkSpeed) ?? 0, Frame);
				}
				if ((C.JumpOdds != null) && (C.JumpOdds > 0) && (Math.random() < C.JumpOdds * Frame) && (C.Y == PlatformFloor) && (C.NextJump <= PlatformTime) && !PlatformActionIs(C, "Any"))
					C.ForceY = ((C.JumpForce ?? 0) + Math.random() * (C.JumpForce ?? 0)) * -0.5;
				if ((C.RunOdds != null) && (C.RunOdds > 0) && (Math.random() < C.RunOdds * Frame) && ((C.Y == PlatformFloor) || (C.FlyingHeight != null)))
					C.Run = !C.Run;
				if ((C.RunOdds ?? 0) >= 1)
					C.Run = true;
				if ((C.StandAttackSlowOdds != null) && (C.StandAttackSlowOdds > 0) && (Math.random() < C.StandAttackSlowOdds * Frame))
					PlatformAttack(C, "StandAttackSlow");
				if ((C.ProjectileOdds != null) && (C.Projectile != null) && (C.Projectile > 0) && (C.ProjectileOdds > 0) && (Math.random() < C.ProjectileOdds * Frame) && (C.Y == PlatformFloor))
					PlatformAttack(C, "FireProjectile");
				PlatformBindPlayer(C, PlatformTime);
			}
		}

		// If the bind action has expired, we bind or release the target
		if ((C.Action != null) && (C.Action.Name === "Bind") && (C.Action.Expire != null) && (C.Action.Target != null)) {
			C.ForceX = 0;
			if (C.Action.Expire < CommonTime()) {
				for (let Target of PlatformChar)
					if (Target.ID == C.Action.Target)
						PlatformBindTarget(C, Target);
				C.Action = undefined;
			}
		}

		// Applies the forces and turns the face
		C.X = C.X + ((C.ProjectileForce != null) ? C.ProjectileForce : C.ForceX) * Frame / 16.6667;
		if (C.X < 100) C.X = 100;
		if ((PlatformRoom.LimitLeft != null) && (C.X < PlatformRoom.LimitLeft) && !C.Fix) C.X = PlatformRoom.LimitLeft;
		if (C.X > (PlatformRoom.Width ?? 0) - 100) C.X = (PlatformRoom.Width ?? 0) - 100;
		if ((PlatformRoom.LimitRight != null) && (C.X > PlatformRoom.LimitRight) && !C.Fix) C.X = PlatformRoom.LimitRight;
		if (C.FlyingHeight == null) C.Y = C.Y + C.ForceY * ((C.Gravity != null) ? C.Gravity : 1) * Frame / 16.6667;
		else {
			let TargetHeight = PlatformFloor - (((C.Run) && (C.RunHeight != null)) ? C.RunHeight : C.FlyingHeight);
			if (C.Health <= 0) TargetHeight = PlatformFloor;
			if (C.Y < TargetHeight) {
				C.Y = C.Y + Frame;
				if (C.Y > TargetHeight) C.Y = TargetHeight;
			} else if (C.Y > TargetHeight) {
				C.Y = C.Y - Frame;
				if (C.Y < TargetHeight) C.Y = TargetHeight;
			}
		}

		// Make sure we cannot go through the floor
		if (C.Y > PlatformFloor) {
			C.Y = PlatformFloor;
			C.NextJump = PlatformTime + 500;
		}

		// Finds the animation based on what the character is doing
		let Crouch = (C.Camera && PlatformMoveActive("Crouch"));
		if ((C.Name != PlatformPlayer.Name) && (PlatformRoom.Heal != null) && PlatformDialogIsSlaveOfCharacter(C.Name, PlatformPlayer.Name) && (Math.abs(C.X - PlatformPlayer.X) < 500)) Crouch = true;
		if ((C.Health <= 0) && C.Petrified) C.Anim = PlatformGetAnim(C, "Petrified");
		else if ((C.Health <= 0) && C.Bound) C.Anim = PlatformGetAnim(C, "Bound");
		else if (C.Health <= 0 && C.HalfBound) C.Anim = PlatformGetAnim(C, "HalfBoundWounded");
		else if (C.Health <= 0) C.Anim = PlatformGetAnim(C, "Wounded");
		else if ((C.ProjectileAim != null) && (PlatformTime - C.ProjectileAim < (C.ProjectileTime ?? 0))) C.Anim = PlatformGetAnim(C, "Aim");
		else if ((C.ProjectileAim != null) && (PlatformTime - C.ProjectileAim < (C.ProjectileTime ?? 0) * 2)) C.Anim = PlatformGetAnim(C, "AimReady");
		else if (C.ProjectileAim != null) C.Anim = PlatformGetAnim(C, "AimFull");
		else if (PlatformActionIs(C, "Any") && C.Action) C.Anim = PlatformGetAnim(C, C.Action.Name, false);
		else if ((C.Y != PlatformFloor) && (C.FlyingHeight == null) && C.HalfBound) C.Anim = PlatformGetAnim(C, "HalfBoundJump");
		else if ((C.Y != PlatformFloor) && (C.FlyingHeight == null)) C.Anim = PlatformGetAnim(C, "Jump");
		else if ((C.ForceX != 0) && Crouch) C.Anim = PlatformGetAnim(C, "Crawl");
		else if ((C.ForceX != 0) && (C.Immunity >= PlatformTime + PlatformImmunityTime * 0.6) && C.HalfBound && PlatformAnimAvailable(C, "HalfBoundStun")) C.Anim = PlatformGetAnim(C, "HalfBoundStun");
		else if ((C.ForceX != 0) && (C.Immunity >= PlatformTime + PlatformImmunityTime * 0.6) && PlatformAnimAvailable(C, "Stun")) C.Anim = PlatformGetAnim(C, "Stun");
		else if ((C.ForceX != 0) && (C.Immunity >= PlatformTime - PlatformImmunityTime) && PlatformAnimAvailable(C, "WalkHit")) C.Anim = PlatformGetAnim(C, "WalkHit");
		else if ((C.ForceX != 0) && C.Run && PlatformAnimAvailable(C, "HalfBoundRun") && C.HalfBound) C.Anim = PlatformGetAnim(C, "HalfBoundRun");
		else if ((C.ForceX != 0) && C.Run && PlatformAnimAvailable(C, "Run")) C.Anim = PlatformGetAnim(C, "Run");
		else if ((C.ForceX != 0) && C.HalfBound) C.Anim = PlatformGetAnim(C, "HalfBoundWalk");
		else if (C.ForceX != 0) C.Anim = PlatformGetAnim(C, "Walk");
		else if (Crouch) C.Anim = PlatformGetAnim(C, "Crouch");
		else if (PlatformMoveActive("Block") && PlatformAnimAvailable(C, "Block")) C.Anim = PlatformGetAnim(C, "Block");
		else if (C.HalfBound) C.Anim = PlatformGetAnim(C, "HalfBoundIdle");
		else C.Anim = PlatformGetAnim(C, "Idle");

		// Some characters will turn to face the player when they are idle
		if ((C.Anim != null) && (C.Anim.Name === "Idle") && C.IdleTurnToFace && !C.Camera && C.FaceLeft && (C.X < PlatformPlayer.X)) C.FaceLeft = false;
		if ((C.Anim != null) && (C.Anim.Name === "Idle") && C.IdleTurnToFace && !C.Camera && !C.FaceLeft && (C.X > PlatformPlayer.X)) C.FaceLeft = true;

		// Draws the background if we are focusing on that character
		if (C.Camera) {
			PlatformDrawBackground();
			if ((PlatformMessage != null) && (PlatformMessage.Text != null) && (PlatformMessage.Timer != null) && (PlatformMessage.Timer > CommonTime()))
				DrawText(PlatformMessage.Text, 1000, 50, "White", "Black");
		}

		// Draws the character and reduces the force for the next run
		if ((C.Name != PlatformPlayer.Name) && (PlatformRoom.Heal != null) && PlatformDialogCharactersAreLovers(C.Name, PlatformPlayer.Name) && (Math.abs(C.X - PlatformPlayer.X) < 500)) PlatformHeartEffect = true;
		if (!C.Camera && C.Anim != null) PlatformDrawCharacter(C, PlatformTime);
		C.ForceX = C.ForceX * (1 - 0.25 * (Frame / 16.6667));
		if (C.Y == PlatformFloor) C.ForceY = 0;
		else C.ForceY = C.ForceY + (PlatformGravitySpeed * Frame / 50);
		if ((C.ForceX > -0.5) && (C.ForceX < 0.5)) C.ForceX = 0;

	}

	// Processes the action done by the characters
	for (let C of PlatformChar)
		if (PlatformActionIs(C, "Any"))
			PlatformProcessAction(C, PlatformTime);

	// Does collision damage for the player
	PlatformCollisionDamage(PlatformPlayer, PlatformTime);

	// Process the projectiles damage & life spawn
	PlatformProcessProjectile(PlatformTime);

	// Draws the up arrow
	if (PlatformDrawUpArrow !== null)
		DrawImage("Screens/Room/Platform/Icon/UpArrow.png", PlatformDrawUpArrow[0] - PlatformViewX - 43, 177);

	// Draws the left arrow
	if ((PlatformRoom.LimitLeft == null) && (PlatformViewX == 0))
		for (let Door of PlatformRoom.Door ?? [])
			if (Door.FromType == "Left")
				DrawImage("Screens/Room/Platform/Icon/LeftArrow.png", 14, 177);

	// Draws the right arrow
	if ((PlatformRoom.LimitRight == null) && (PlatformViewX == (PlatformRoom.Width ?? 0) - 2000))
		for (let Door of PlatformRoom.Door ?? [])
			if (Door.FromType == "Right")
				DrawImage("Screens/Room/Platform/Icon/RightArrow.png", 1900, 177);

	// Draws the player last to put her in front
	PlatformDrawCharacter(PlatformPlayer, PlatformTime);

	// Draws the mobile buttons
	if (CommonIsMobile) {

		// Left side movement buttons
		DrawEmptyRect(25, 725, 150, 150, CommonTouchActive(25, 725, 150, 150) ? "cyan" : "#FFFFFF80", 4);
		DrawEmptyRect(175, 725, 150, 150, CommonTouchActive(175, 725, 150, 150) ? "cyan" : "#FFFFFF80", 4);
		DrawEmptyRect(75, 625, 200, 100, CommonTouchActive(75, 625, 200, 100) ? "cyan" : "#FFFFFF80", 4);
		DrawEmptyRect(75, 875, 200, 100, CommonTouchActive(75, 875, 200, 100) ? "cyan" : "#FFFFFF80", 4);

		// Right side action buttons
		DrawEmptyRect(1700, 550, 125, 125, CommonTouchActive(1700, 550, 125, 125) ? "cyan" : "#FFFFFF80", 4);
		DrawEmptyRect(1675, 700, 125, 125, CommonTouchActive(1675, 700, 125, 125) ? "cyan" : "#FFFFFF80", 4);
		DrawEmptyRect(1650, 850, 125, 125, CommonTouchActive(1650, 850, 125, 125) ? "cyan" : "#FFFFFF80", 4);
		DrawEmptyRect(1850, 550, 125, 125, CommonTouchActive(1850, 550, 125, 125) ? "cyan" : "#FFFFFF80", 4);
		DrawEmptyRect(1825, 700, 125, 125, CommonTouchActive(1825, 700, 125, 125) ? "cyan" : "#FFFFFF80", 4);
		DrawEmptyRect(1800, 850, 125, 125, CommonTouchActive(1800, 850, 125, 125) ? "cyan" : "#FFFFFF80", 4);

	}

	// In idle position, there's a timer between 15 and 45 seconds for random idle audio
	if ((PlatformPlayer.Anim != null) && (PlatformPlayer.Anim.Name === "Idle") && (PlatformPlayer.ForceX === 0) && (PlatformPlayer.ForceY === 0)) {

		// Sets the idle timer if needed
		if (PlatformPlayerIdleTimer == null) PlatformPlayerIdleTimer = PlatformTime + Math.random() * 30000 + 15000;

		// Plays the idle speech if the timer is out
		if (PlatformTime > PlatformPlayerIdleTimer) {
			PlatformPlayerIdleTimer = null;
			PlatformPlayerIdleLast = CommonRandomItemFromList(PlatformPlayerIdleLast, PlatformPlayer.IdleAudio ?? []);
			PlatformSoundEffect("Idle", PlatformPlayerIdleLast, 1);
		}

	} else PlatformPlayerIdleTimer = null;

	// Keeps the time of the frame for the next run
	PlatformLastTime = PlatformTime;

}

/**
 * Draws all the buttons on the right side of the screen for extra lovers/Ds interactions
 * @returns {void} - Nothing
 */
function PlatformDrawRightButtons() {

	// Gets the two characters that must interact, Melody is always C1 for now
	PlatformRightButtons = [];
	let C1 = null;
	let C2 = null;
	if (PlatformPlayer?.Name == "Melody") {
		C1 = PlatformDialogGetCharacter(PlatformPlayer.Name);
		for (let Char of PlatformChar)
			if ((Char.Dialog != null) && (Math.abs(PlatformPlayer.X - Char.X) <= 150) && (Math.abs(PlatformPlayer.Y - Char.Y) <= 450))
				C2 = PlatformDialogGetCharacter(Char.Name);
	} else {
		C2 = PlatformDialogGetCharacter(PlatformPlayer.Name);
		for (let Char of PlatformChar)
			if ((Char.Dialog != null) && (Math.abs((PlatformPlayer?.X ?? 0) - Char.X) <= 150) && (Math.abs((PlatformPlayer?.Y ?? 0) - Char.Y) <= 450))
				C1 = PlatformDialogGetCharacter(Char.Name);
	}

	// Adds the possible buttons, only available if Melody is C1
	if ((C1 == null) || (C2 == null)) return;
	if (C1.Name != "Melody") return;
	if ((PlatformInventory != null) && (PlatformInventory.length > 0)) PlatformRightButtons.push("Gift");
	if (((C2.Love ?? 0) >= 20) && ((C1.LoverName == null) || (C1.LoverName == ""))&& ((C2.LoverName == null) || (C2.LoverName == ""))) PlatformRightButtons.push(C2.Name + "Lover1Start");
	if ((C2.LoverName != null) && (C2.LoverName == C1.Name)) PlatformRightButtons.push(C2.Name + "Lover1End");
	if (((C2.Domination ?? 0) >= 20) && ((C2.OwnerName == null) || (C2.OwnerName == ""))) PlatformRightButtons.push(C2.Name + "Domination1Start");
	if ((C2.OwnerName != null) && (C2.OwnerName == C1.Name)) PlatformRightButtons.push(C2.Name + "Domination1End");
	if (((C2.Domination ?? 0) <= -20) && ((C1.OwnerName == null) || (C1.OwnerName == ""))) PlatformRightButtons.push(C2.Name + "Submission1Start");
	if ((C1.OwnerName != null) && (C1.OwnerName == C2.Name)) PlatformRightButtons.push(C2.Name + "Submission1End");
	PlatformFocusCharacter = C2;

	// Draw the buttons on the right side
	for (let B = 0; B < PlatformRightButtons.length; B++) {
		let ButtonName = "Screens/Room/Platform/Button/" + PlatformRightButtons[B] + ".png";
		if (PlatformFocusCharacter != null) ButtonName = ButtonName.replace(PlatformFocusCharacter.Name, "");
		DrawButton(1900, 10 + (B + 1) * 100, 90, 90, "", "White", ButtonName, TextGet("Button" + PlatformRightButtons[B]));
	}

}

/**
 * Plays the dialog ambient music
 * @param {string | null} Music - The URL of the music to play
 * @returns {void} - Nothing
 */
function PlatformBackgroundMusic(Music) {

	// If no music should play
	if (!PlatformAllowAudio) return;
	if ((Music == null) || (Music == "")) {
		if ((PlatformMusic != null) && !PlatformMusic.paused) PlatformMusic.pause();
		return;
	}

	// If volume is more than zero, we start the background music at lower volume
	const vol = ((Player.AudioSettings == null) || (Player.AudioSettings.MusicVolume == null)) ? 100 : Player.AudioSettings.MusicVolume;
	if (vol > 0) {
		const music = (PlatformMusic ??= new Audio());
		let FileName = "Screens/Room/Platform/Audio/Background/" + Music + ".mp3";
		if ((music.src == null) || (music.src.indexOf(FileName) < 0)) {
			music.currentTime = 0;
			music.src = FileName;
			music.volume = Math.min(vol, 1) * 0.125;
			CommonPromiseCatch(music.play());
			music.addEventListener('ended', function() {
				music.currentTime = 0;
				CommonPromiseCatch(music.play());
			}, false);
		}
		if (music.paused) CommonPromiseCatch(music.play());
	}

}

/**
 * Draws the possible gifts on the top of the screen, exit gift mode if too far from target
 * @returns {void} - Nothing
 */
function PlatformDrawGiftButtons() {
	if (PlatformRightButtons.length == 0) {
		PlatformGiftMode = false;
		return;
	}
	for (let I = 0; I < PlatformInventory.length; I++) {
		let Item = null;
		for (let Inv of PlatformInventoryList)
			if (Inv.Name == PlatformInventory[I].Name)
				Item = Inv;
		if (Item != null) {
			DrawButton(100 + (I * 450), 200, 400, 100, "", "White");
			DrawImageZoomCanvas("Screens/Room/Platform/Inventory/" + Item.Name + ".png", MainCanvas, 0, 0, 120, 120, 110 + (I * 450), 205, 90, 90);
			MainCanvas.font = CommonGetFont(24);
			DrawText(Item.DisplayName + " (x" + PlatformInventory[I].Quantity.toString() + ")", 350 + (I * 450), 230, "Black", "Silver");
			DrawText(Item.Description, 350 + (I * 450), 270, "Black", "Silver");
			MainCanvas.font = CommonGetFont(36);
		}
	}
}

/**
 * Runs and draws the screen
 * @returns {void} - Nothing
 */
function PlatformRun() {
	if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
		document.activeElement.blur();
		PlatformKeys = [];
	}
	PlatformDrawGame();
	DrawButton(1900, 10, 90, 90, "", "White", "Icons/Exit.png", TextGet("Exit"));
	if (PlatformHeal != null) DrawButton(1800, 10, 90, 90, "", "White", "Icons/Save.png", TextGet("Save"));
	if (PlatformHeal != null) DrawButton(1700, 10, 90, 90, "", "White", "Icons/Audio" + (PlatformAllowAudio ? "On" : "Off") + ".png", TextGet("AudioToggle"));
	if (PlatformHeal != null) DrawButton(1600, 10, 90, 90, "", "White", "Icons/Character.png", TextGet("Character"));
	if ((PlatformHeal != null) && (PlatformParty.length >= 2)) DrawButton(1500, 10, 90, 90, "", "White", "Icons/Next.png", TextGet("ChangeCharacter"));
	if ((PlatformHeal != null) && PlatformSaveMode)
		for (let S = 0; S < 10; S++)
			DrawButton(250 + (S * 157), 200, 90, 90, S.toString(), "White", "", TextGet("SaveOn") + S.toString());
	if ((PlatformHeal != null) && PlatformGiftMode) PlatformDrawGiftButtons();
	if (PlatformHeal != null) PlatformDrawRightButtons();
	if (CommonIsMobile) PlatformTouch();
	PlatformBackgroundMusic(PlatformRoom.Music);
}

/**
 * Starts an attack by the source
 * @param {Platform.Character} Source - The character doing the action
 * @param {Platform.AnimationName} Type - The action type (Punch, Kick, Sweep, etc.)
 * @returns {void} - Nothing
 */
function PlatformAttack(Source, Type) {
	if (PlatformActionIs(Source, "Any")) return;
	if (Source.Health <= 0) return;
	Source.Run = false;
	if (Source.Attack != null)
		for (let Attack of Source.Attack)
			if (Attack.Name == Type) {
				if ((Attack.JumpForce != null) && (Source.ForceY == 0)) Source.ForceY = Attack.JumpForce * -1;
				if ((Attack.Cooldown != null) && (Attack.Cooldown > 0) && PlatformCooldownActive(Type)) return;
				if ((Attack.Magic != null) && (Attack.Magic > 0)) {
					if ((PlatformPlayer?.Magic == null) || (PlatformPlayer.Magic < Attack.Magic)) return;
					PlatformPlayer.Magic = PlatformPlayer.Magic - Attack.Magic;
				}
				if ((Attack.Cooldown != null) && (Attack.Cooldown > 0)) {
					let Time = Attack.Cooldown;
					if ((Type == "Scream") && PlatformPlayer && (PlatformHasPerk(PlatformPlayer, "Howl"))) Time = Time - 1000;
					if (Type == "Scream") PlatformTimedScreenFilter = { End: CommonTime() + 1000, Filter: "#00000060" };
					PlatformCooldown.push({Type: Attack.Name, Time: CommonTime() + Time, Delay: Time});
				}
				if (Type == "Backflip") Source.ForceX = (Source.FaceLeft ? 1 : -1) * (PlatformHasPerk(Source, "Acrobat") ? 180 : 120);
				Source.Action = { Name: Type, Start: CommonTime(), Expire: CommonTime() + Attack.Speed };
				PlatformSoundEffect("Attack", Attack.StartAudio ?? []);
			}
}

/**
 * Toggles the audio on or off
 * @returns {void} - Nothing
 */
function PlatformAudioToggle() {
	if (PlatformAllowAudio) PlatformBackgroundMusic(null);
	PlatformAllowAudio = !PlatformAllowAudio;
}

/**
 * Gives an item to the currrent NPC
 * @param {Platform.ItemName} ItemName -
 * @returns {void} - Nothing
 */
function PlatformGiveItem(ItemName) {

	// If the character and item is valid, we continue
	if (PlatformFocusCharacter == null) return;
	let Item = null;
	for (let Inv of PlatformInventoryList)
		if (Inv.Name == ItemName)
			Item = Inv;
	if (Item == null) return;

	// Runs the script and removes the item
	if (Item.OnGive != null) Item.OnGive(PlatformFocusCharacter);
	PlatformInventoryRemove(ItemName);

	// Shows the item over the character
	for (let C of PlatformChar)
		if (C.Name == PlatformFocusCharacter.Name)
			C.Loot = [{ Name: Item.Name, Expire: CommonTime() + 2000}];

}

/**
 * Handles clicks in the screen
 * @returns {void} - Nothing
 */
function PlatformClick() {
	if (MouseIn(1900, 10, 90, 90)) return PlatformLeave();
	if ((PlatformHeal != null) && PlatformSaveMode)
		for (let S = 0; S < 10; S++)
			if (MouseIn(250 + (S * 157), 200, 90, 90))
				return PlatformSaveGame(S);
	if (MouseIn(1800, 10, 90, 90) && (PlatformHeal != null)) {
		PlatformSaveMode = !PlatformSaveMode;
		PlatformGiftMode = false;
		if (PlatformSaveMode) PlatformMessageSet(TextGet("SelectSave"));
		return;
	}
	if (MouseIn(1700, 10, 90, 90) && (PlatformHeal != null)) return PlatformAudioToggle();
	if (MouseIn(1600, 10, 90, 90) && (PlatformHeal != null)) {
		CommonSetScreen("Room", "PlatformProfile");
		return;
	}
	if (MouseIn(1500, 10, 90, 90) && (PlatformHeal != null)) return PlatformPartyNext();
	for (let B = 0; B < PlatformRightButtons.length; B++)
		if (MouseIn(1900, 10 + (B + 1) * 100, 90, 90)) {
			if (PlatformRightButtons[B] == "Gift") PlatformGiftMode = !PlatformGiftMode;
			else PlatformDialogStart(PlatformRightButtons[B]);
			PlatformSaveMode = false;
			return;
		}
	if (PlatformGiftMode)
		for (let I = 0; I < PlatformInventory.length; I++)
			if (MouseIn(100 + (I * 450), 200, 400, 100)) {
				PlatformGiveItem(PlatformInventory[I].Name);
				PlatformGiftMode = false;
				return;
			}
	if (!CommonIsMobile && PlatformPlayer && !PlatformPlayer?.HalfBound) PlatformAttack(PlatformPlayer, PlatformMoveActive("Crouch") ? "CrouchAttackFast" : "StandAttackFast");
}

/**
 * When the screens exits, we unload the listeners
 * @returns {void} - Nothing
 */
function PlatformLeave() {
	PlatformBackgroundMusic(null);
	CommonSetScreen("Room", "PlatformIntro");
}

/**
 * Enters a new room if the entry conditions are met
 * @param {Platform.RoomType} FromType - The type of room enter (Up, Left, Right)
 * @returns {void} - Nothing
 */
function PlatformEnterRoom(FromType) {
	if (!PlatformPlayer) return;
	PlatformDrawUpArrow = null;
	if ((PlatformRoom == null) || (PlatformRoom.Door == null)) return;
	for (let Door of PlatformRoom.Door)
		if ((PlatformPlayer.X >= Door.FromX) && (PlatformPlayer.X <= Door.FromX + Door.FromW) && (PlatformPlayer.Y >= Door.FromY) && (PlatformPlayer.Y <= Door.FromY + Door.FromH) && ("Up" === Door.FromType)) {
			PlatformDrawUpArrow = [Door.FromX + Door.FromW / 2, Door.FromY + Door.FromH / 2];
		}
	for (let Door of PlatformRoom.Door)
		if ((PlatformPlayer.X >= Door.FromX) && (PlatformPlayer.X <= Door.FromX + Door.FromW) && (PlatformPlayer.Y >= Door.FromY) && (PlatformPlayer.Y <= Door.FromY + Door.FromH) && (FromType === Door.FromType)) {
			PlatformLoadRoom(Door.Name);
			PlatformPlayer.Run = false;
			PlatformPlayer.X = Door.ToX;
			PlatformPlayer.FaceLeft = Door.ToFaceLeft ?? false;
			return;
		}
	if (FromType == "Up") {
		PlatformKeys = [];
		for (let Char of PlatformChar)
			if ((Char.Dialog != null) && (Math.abs(PlatformPlayer.X - Char.X) <= 150) && (Math.abs(PlatformPlayer.Y - Char.Y) <= 450))
				return PlatformDialogStart(Char.Dialog);
	}
}

/**
 * Checks if there's a target character to bind and starts the binding process
 * @param {Platform.Character} Source - The source character that does the binding
 * @returns {void} - Nothing
 */
function PlatformBindStart(Source) {
	if (PlatformActionIs(Source, "Any")) return;
	if (!CommonIsMobile && (PlatformKeys.length > 0)) return;
	for (let C of PlatformChar)
		if ((Source.ID != C.ID) && (C.Bound == null) && (C.Status != "Bound") && (C.Health == 0) && (Math.abs(Source.X - C.X + (Source.FaceLeft ? -75 : 75)) < 150) && (Math.abs(Source.Y - C.Y) < 150) && (Source.Y == PlatformFloor)) {
			C.RiseTime = CommonTime() + 10000;
			Source.ForceX = 0;
			Source.Action = { Name: "Bind", Target: C.ID, Start: CommonTime(), Expire: CommonTime() + (!!PlatformPlayer && (PlatformHasPerk(PlatformPlayer, "Rigger")) ? 1200 : 2400)};
			PlatformSoundEffect("Bind", Source.BindAudio ?? [], 1);
			return;
		}
}

/**
 * Saves the game on a specific slot
 * @param {number} Slot - The slot to use (from 0 to 9)
 * @returns {void} - Nothing
 */
function PlatformSaveGame(Slot) {
	PlatformPartySave();
	PlatformSaveMode = false;
	let SaveDialog = [];
	for (let Char of PlatformDialogCharacter ?? [])
		if ((Char.Love != null) || (Char.Domination != null) || (Char.LoverName != null) || (Char.LoverLevel != null) || (Char.OwnerName != null) || (Char.OwnerLevel != null))
			SaveDialog.push({ Name: Char.Name, Love: Char.Love, Domination: Char.Domination, LoverName: Char.LoverName, LoverLevel: Char.LoverLevel, OwnerName: Char.OwnerName, OwnerLevel: Char.OwnerLevel });
	let SaveObj = {
		Character: PlatformPlayer?.Name,
		Status: PlatformPlayer?.Status,
		Party: PlatformParty,
		Room: PlatformRoom.Name,
		Event: PlatformEvent,
		Dialog: SaveDialog,
		Inventory: PlatformInventory,
		Audio: PlatformAllowAudio
	};
	localStorage.setItem("BondageBrawlSave" + Slot.toString(), JSON.stringify(SaveObj));
	PlatformMessageSet("Game saved on slot " + Slot.toString());
}

/**
 * Adds an item to the player inventory
 * @param {Platform.ItemName} InventoryName - The item name to add
 * @param {number} QuantityToAdd - The quantity to add (1 if null)
 * @returns {void} - Nothing
 */
function PlatformInventoryAdd(InventoryName, QuantityToAdd = 1) {
	if (QuantityToAdd == null) QuantityToAdd = 1;
	for (let I of PlatformInventory)
		if (I.Name == InventoryName) {
			I.Quantity = I.Quantity + QuantityToAdd;
			return;
		}
	PlatformInventory.push({ Name: InventoryName, Quantity: QuantityToAdd });
}

/**
 * Removes an item from the player inventory
 * @param {Platform.ItemName} InventoryName - The item name to add
 * @param {number} QuantityToRemove - The quantity to add (1 if null)
 * @returns {void} - Nothing
 */
function PlatformInventoryRemove(InventoryName, QuantityToRemove = 1) {
	if (QuantityToRemove == null) QuantityToRemove = 1;
	for (let I = 0; I < PlatformInventory.length; I++)
		if (PlatformInventory[I].Name == InventoryName) {
			PlatformInventory[I].Quantity = PlatformInventory[I].Quantity - QuantityToRemove;
			if (PlatformInventory[I].Quantity <= 0) PlatformInventory.splice(I, 1);
			return;
		}
}

/**
 * Loads the game on a specific slot
 * @param {number} Slot - The slot to use (from 0 to 9)
 * @returns {void} - Nothing
 */
function PlatformLoadGame(Slot) {

	// Gets the saved JSON object and make sure it's valid
	let LoadStr = localStorage.getItem("BondageBrawlSave" + Slot.toString());
	if (LoadStr == null) return;
	let LoadObj = /** @type {Platform.SaveData} */ (JSON.parse(LoadStr));
	if (
		!CommonIsObject(LoadObj)
		|| LoadObj.Character == null
		|| LoadObj.Status == null
		|| LoadObj.Room == null
	) {
		return;
	}

	// Load the game parameters and inventory
	PlatformChar = [];
	if (Array.isArray(LoadObj.Party)) {
		PlatformParty = LoadObj.Party;
	} else {
		PlatformParty = [];
		PlatformPartyAdd(/** @type {Platform.PartyMember} */ (/** @type {unknown} */ (LoadObj)));
	}
	PlatformInventory = LoadObj.Inventory;
	if (PlatformInventory == null) PlatformInventory = [];
	PlatformAllowAudio = LoadObj.Audio;
	if (PlatformAllowAudio == null) PlatformAllowAudio = true;

	// Loads the game events and party
	PlatformEvent = LoadObj.Event;
	if (PlatformEvent == null) PlatformEvent = [];
	PlatformPartyBuild();

	// Loads the character relationships
	PlatformDialogCharacter = CommonCloneDeep(PlatformDialogCharacterTemplate);
	if (LoadObj.Dialog != null)
		for (let DialogChar of LoadObj.Dialog)
			for (let Char of PlatformDialogCharacter)
				if (DialogChar.Name == Char.Name) {
					if (DialogChar.Love != null) Char.Love = DialogChar.Love;
					if (DialogChar.Domination != null) Char.Domination = DialogChar.Domination;
					if (DialogChar.LoverName != null) Char.LoverName = DialogChar.LoverName;
					if (DialogChar.LoverLevel != null) Char.LoverLevel = DialogChar.LoverLevel;
					if (DialogChar.OwnerName != null) Char.OwnerName = DialogChar.OwnerName;
					if (DialogChar.OwnerLevel != null) Char.OwnerLevel = DialogChar.OwnerLevel;
				}

	// Loads the current character
	PlatformCreateCharacter(LoadObj.Character, LoadObj.Status, 1000);
	PlatformPartyLoad();
	PlatformDialogEvent();

	// Loads the current room and launches it
	PlatformLoadRoom(LoadObj.Room);
	if (PlatformPlayer) PlatformPlayer.X = Math.round((PlatformRoom.Width ?? 0) / 2);
	CommonSetScreen("Room", "Platform");

}

/**
 * Teleports a character forward
 * @param {Platform.Character} C - The character to teleport
 * @returns {void} - Nothing
 */
function PlatformCastTeleport(C) {
	if (PlatformCooldownActive("Teleport")) return;
	if ((C.Magic == null) || (C.Magic == 0)) return;
	C.Magic--;
	let Time = 3000;
	if (PlatformHasPerk(C, "Freedom")) Time = 2000;
	if (C.Camera) PlatformCooldown.push({Type: "Teleport", Time: CommonTime() + Time, Delay: Time});
	C.ForceX = C.ForceX + (C.FaceLeft ? -250 : 250);
	C.Immunity = CommonTime() + 500;
	C.Effect = { Name: "Teleport", End: C.Immunity };
}

/**
 * Heals the character for 20% of it's max HP
 * @param {Platform.Character} C - The character to teleport
 * @returns {void} - Nothing
 */
function PlatformCastHeal(C) {
	if (PlatformCooldownActive("Heal")) return;
	if ((C.Magic == null) || (C.Magic <= 2)) return;
	if (C.Health >= C.MaxHealth) return;
	let Heal = Math.round(C.MaxHealth * 0.2);
	if (Heal > C.MaxHealth - C.Health) Heal = C.MaxHealth - C.Health;
	C.Health = C.Health + Heal;
	C.Magic = C.Magic - 3;
	C.Damage.push({ Value: Heal * -1, Expire: CommonTime() + 2000});
	C.Effect = { Name: "Heal", End: CommonTime() + 1000 };
	let Time = 30000;
	if (PlatformHasPerk(C, "Cure")) Time = 20000;
	if (C.Camera) PlatformCooldown.push({Type: "Heal", Time: CommonTime() + Time, Delay: Time});
}

/**
 * Handles the keys pressed to move, attack or jump
 * @param {Platform.KeyCode} Code - The key code pressed
 * @returns {void} - Nothing
 */
function PlatformEventKeyDown(Code) {
	if (!PlatformPlayer) return;
	PlatformPlayer.Run = ((Code == PlatformLastKeyCode) && (CommonTime() <= PlatformLastKeyTime + 333) && (["KeyA", "KeyD"].indexOf(Code) >= 0) && (PlatformKeys.indexOf(Code) < 0)) || ((Code == PlatformLastKeyCode) && PlatformPlayer.Run && (PlatformKeys.indexOf(Code) >= 0));
	if (PlatformPlayer.Health <= 0) return;
	if (PlatformActionIs(PlatformPlayer, "Bind")) PlatformPlayer.Action = undefined;
	if (Code == "Space") PlatformPlayer.Action = undefined;
	if (Code == "KeyW") return PlatformEnterRoom("Up");
	if ((Code == "KeyS") && PlatformPlayer.HalfBound) return;
	if ((Code == "KeyI") && !PlatformPlayer.HalfBound && PlatformHasPerk(PlatformPlayer, "Teleport")) return PlatformCastTeleport(PlatformPlayer);
	if ((Code == "KeyI") && !PlatformPlayer.HalfBound && PlatformHasPerk(PlatformPlayer, "Backflip")) return PlatformAttack(PlatformPlayer, "Backflip");
	if ((Code == "KeyP") && !PlatformPlayer.HalfBound && PlatformHasPerk(PlatformPlayer, "Heal")) return PlatformCastHeal(PlatformPlayer);
	if (Code == "KeyP") return;
	if ((Code == "KeyL") && !PlatformPlayer.HalfBound && PlatformAnimAvailable(PlatformPlayer, "StandAttackFast")) return PlatformAttack(PlatformPlayer, PlatformMoveActive("Crouch") ? "CrouchAttackFast" : "StandAttackFast");
	if ((Code == "KeyK") && !PlatformPlayer.HalfBound && !PlatformMoveActive("Crouch") && PlatformHasPerk(PlatformPlayer, "Apprentice")) return PlatformAttack(PlatformPlayer, "Scream");
	if ((Code == "KeyK") && !PlatformPlayer.HalfBound && PlatformAnimAvailable(PlatformPlayer, "StandAttackSlow")) return PlatformAttack(PlatformPlayer, PlatformMoveActive("Crouch") ? "CrouchAttackSlow" : "StandAttackSlow");
	if ((Code == "KeyI") && !PlatformPlayer.HalfBound && PlatformAnimAvailable(PlatformPlayer, "Uppercut")) return PlatformAttack(PlatformPlayer, "Uppercut");
	if ((Code == "KeyI") && !PlatformPlayer.HalfBound && (PlatformPlayer.Name == "Lyn") && ((PlatformPlayer.Projectile ?? 0) > 0)) return PlatformAttack(PlatformPlayer, "FireProjectile");
	if ((Code == "KeyO") && (PlatformHeal != null)) return PlatformPartyNext();
	if ((Code == "KeyO") && (PlatformHeal == null)) return PlatformBindStart(PlatformPlayer);
	if ((PlatformRoom.Heal != null) && (Code >= "Digit0") && (Code <= "Digit9")) return PlatformSaveGame(parseInt(Code.substring(5)));
	if (Code == "KeyI") return;
	if (PlatformKeys.indexOf(Code) < 0) PlatformKeys.push(Code);
	PlatformLastKeyCode = Code;
	PlatformLastKeyTime = CommonTime();
}

/**
 * Handles keys pressed
 * @type {KeyboardEventListener}
 */
function PlatformKeyDown(e) {
	if (CommonKey.GetModifiers(e)) {
		return false;
	}
	PlatformEventKeyDown(e.code);
	return ((e != null) && (e.code != null) && ((e.code.substring(0, 3) == "Key") || (e.code.substring(0, 5) == "Arrow") || (e.code.substring(0, 5) == "Digit") || (e.code == "Space")));
}

/**
 * Handles keys released
 * @type {KeyboardEventListener}
 */
function PlatformKeyUp(e) {
	if (PlatformKeys.indexOf(e.code) >= 0) {
		PlatformKeys.splice(PlatformKeys.indexOf(e.code), 1);
		return true;
	} else {
		return false;
	}
}

/**
 * Handles the touched regions for mobile play
 * @returns {void}
 */
function PlatformTouch() {
	if (CommonTouchActive(75, 625, 200, 100) && !CommonTouchActive(75, 625, 200, 100, PlatformLastTouch)) PlatformEventKeyDown("KeyW");
	if (CommonTouchActive(1700, 550, 125, 125) && !CommonTouchActive(1700, 550, 125, 125, PlatformLastTouch)) PlatformEventKeyDown("KeyI");
	if (CommonTouchActive(1675, 700, 125, 125) && !CommonTouchActive(1675, 700, 125, 125, PlatformLastTouch)) PlatformEventKeyDown("KeyK");
	if (CommonTouchActive(1650, 850, 125, 125) && !CommonTouchActive(1650, 850, 125, 125, PlatformLastTouch)) PlatformEventKeyDown("KeyL");
	if (CommonTouchActive(1850, 550, 125, 125) && !CommonTouchActive(1850, 550, 125, 125, PlatformLastTouch)) PlatformEventKeyDown("KeyO");
	if (CommonTouchActive(1825, 700, 125, 125) && !CommonTouchActive(1825, 700, 125, 125, PlatformLastTouch)) PlatformEventKeyDown("KeyP");
	PlatformLastTouch = CommonTouchList;
}

/**
 * Returns TRUE if a specific perk is allocated for that character
 * @param {Platform.Character} C - The platform character to evaluate
 * @param {Platform.PerkName} Perk - The perk name to validate
 * @returns {boolean} - TRUE if the perk is paid
 */
function PlatformHasPerk(C, Perk) {
	if ((C.Perk == null) || (C.PerkName == null)) return false;
	const perkIndex = C.PerkName.indexOf(Perk);
	if (perkIndex < 0) return false;
	return (C.Perk.substring(perkIndex, perkIndex + 1) == "1");
}

/**
 * Returns TRUE if a specific cooldown is currently active
 * @param {Platform.EffectType | Platform.AnimationName} Name - The name of the cooldown to validate
 * @returns {boolean} - TRUE if active
 */
function PlatformCooldownActive(Name) {
	for (let C of PlatformCooldown)
		if (C.Type == Name)
			return true;
	return false;
}

/**
 * Sets Bondage Brawl in standalone mode, not requiring any login from BC
 * @returns {void} - Nothing
 */
function PlatformRunStandalone() {
	if (Player == null) {
		setTimeout(PlatformRunStandalone, 100);
		return;
	}
	PlatformRunStandaloneMode = true;
	ElementRemove("InputName");
	ElementRemove("InputPassword");
	ElementRemove("LanguageDropdown");
	CommonSetScreen("Room", "PlatformIntro");
}
