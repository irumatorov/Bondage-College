"use strict";
/** @deprecated */
var AudioDialog = new Audio();

/** @type {HTMLAudioElement & { _playState?: { location?: number } }} */
var AudioBackgroundMusic = new Audio();

const AudioSupportedMusicFormats = [".mp3", ".mp4"];

/** @type {AudioYouTubeTrack} Plays the background music when it's a YouTube link */
var AudioBackgroundMusicYouTube = AudioYouTubeCreateTrack();

/** @type {null | Promise<NonNullable<Window["YT"]>>} The YouTube IFrame player API, once loaded */
var AudioYouTubeAPI = null;

/** The YouTube player states that are acted on */
const AudioYouTubeState = { Ended: 0, Playing: 1 };

/** @type {AudioEffect[]} */
var AudioList = [
	{ Name: "AirDoorClosing", File: "AirDoorClosing" },
	{ Name: "AirDoorOpening", File: "AirDoorOpening" },
	{ Name: "Bag", File: "Bag" },
	{ Name: "BalloonRubbing", File: "BalloonRubbing" },
	{ Name: "BalloonStretch", File: "BalloonStretch" },
	{ Name: "Beep", File: "BeepAlarm" },
	{ Name: "BellMedium", File: "BellMedium" },
	{ Name: "BellSmall", File: "BellSmall" },
	{ Name: "Belt", File: [ "Belt1", "Belt2", "Belt3", "Belt4"] },
	{ Name: "BrushHair", File: [ "BrushHair1", "BrushHair2", "BrushHair3", "BrushHair4"] },
	{ Name: "BrushSpank", File: [ "BrushSpank1", "BrushSpank2", "BrushSpank3", "BrushSpank4"] },
	{ Name: "Buckle", File: "Buckle" },
	{ Name: "CageClose", File: "CageClose" },
	{ Name: "CageEquip", File: "CageEquip" },
	{ Name: "CageOpen", File: "CageOpen" },
	{ Name: "CageStruggle", File: "CageStruggle" },
	{ Name: "ChainLong", File: "ChainLong" },
	{ Name: "ClothKnot", File: "ClothKnot" },
	{ Name: "ClothSlip", File: "ClothSlip" },
	{ Name: "SciFiEffect", File: "SciFiEffect" },
	{ Name: "SciFiPump", File: "SciFiPump" },
	{ Name: "SciFiConfigure", File: "SciFiConfigure" },
	{ Name: "SciFiBeeps", File: ["SciFiBeeps1", "SciFiBeeps2", "SciFiBeeps3"] },
	{ Name: "ChainShort", File: "ChainShort" },
	{ Name: "CuffsMetal", File: "CuffsMetal" },
	{ Name: "EMLevitate", File: "EMLevitate" },
	{ Name: "EMDisable", File: "EMDisable" },
	{ Name: "FanOpen", File: "Fan1" },
	{ Name: "Hallo", File: "Hallo" },
	{ Name: "FuturisticApply", File: "FuturisticApply" },
	{ Name: "HoodedCloak", File: "HoodedCloak" },
	{ Name: "HydraulicLock", File: "HydraulicLock" },
	{ Name: "HydraulicUnlock", File: "HydraulicUnlock" },
	{ Name: "Deflation", File: "Deflation" },
	{ Name: "DuctTape", File: "DuctTape18" },
	{ Name: "DuctTapeRoll", File: "DuctTapeRoll" },
	{ Name: "DuctTapeRollShort", File: "DuctTapeRollShort" },
	{ Name: "Inflation", File: "Inflation" },
	{ Name: "MetalClose", File: "Metal1" },
	{ Name: "MetalCuffs", File: "MetalCuffs" },
	{ Name: "LeatherStretching1", File: "LeatherStretching1" },
	{ Name: "LockLarge", File: "LockLarge" },
	{ Name: "LockSmall", File: "LockSmall" },
	{ Name: "RopeLong", File: ["RopeLong1", "RopeLong2", "RopeLong3"] },
	{ Name: "RopeShort", File: ["RopeShort1", "RopeShort2", "RopeShort3", "RopeShort4", "RopeShort5"] },
	{ Name: "Shocks", File: "Shocks" },
	{ Name: "SmackCrop", File: ["SmackCrop1", "SmackCrop2", "SmackCrop3"] },
	{ Name: "Squeak", File: "SqueakToy" },
	{ Name: "SqueakyToy", File: "SqueakyToy" },
	{ Name: "Whip1", File: "SmackWhip1" },
	{ Name: "Whip2", File: "SmackWhip2" },
	{ Name: "Sybian", File: "Sybian" },
	{ Name: "Unlock", File: "UnlockSmall" },
	{ Name: "VibrationLong1", File: "VibrationTone4Long3" },
	{ Name: "VibrationLong2", File: "VibrationTone4Long6" },
	{ Name: "VibrationShort", File: "VibrationTone4ShortLoop" },
	{ Name: "VibrationEdgeLow", File: "Vibrator_Advanced_LowEdge" },
	{ Name: "VibrationEdgeMedium", File: "Vibrator_Advanced_MediumEdge" },
	{ Name: "VibrationEdgeHigh", File: "Vibrator_Advanced_HighEdge" },
	{ Name: "VibrationTeaseLow", File: "Vibrator_Advanced_LowTease" },
	{ Name: "VibrationTeaseMedium", File: "Vibrator_Advanced_MediumTease" },
	{ Name: "VibrationMaximum", File: "Vibrator_Advanced_Strong" },
	{ Name: "VibrationCooldown", File: "Vibrator_Advanced_End" },
	{ Name: "Vibrator", File: "VibratorShort" },
	{ Name: "Wand", File: "Wand" },
	{ Name: "WandBig", File: "WandBig" },
	{ Name: "WoodenCuffs", File: "WoodenCuffs" },
	{ Name: "ZipTie", File: "ZipTie" },
	{ Name: "SpankSkin", File: ["SpankSkin1", "SpankSkin2", "SpankSkin3"] },
	{ Name: "WhipCrack", File: ["WhipCrack"] },
	{ Name: "LeverShort", File: "Lever1" },
	{ Name: "Zipper1", File: "Zipper1" },
	{ Name: "HighChair", File: "HighChair" },
	{ Name: "AdultBabyHarness", File: "AdultBabyHarness" },
	{ Name: "BondageBouquet", File: "BondageBouquet" },
	{ Name: "Cigarette", File: "Cigarette" },
	{ Name: "Flogger", File: ["Flogger1", "Flogger2", "Flogger3", "Flogger4", "Flogger5"] },
	{ Name: "LeatherCreak", File: "LeatherCreak" },
	{ Name: "LeatherCreakWithMetal", File: "LeatherCreakWithMetal" },
	{ Name: "LeatherStretchingShort", File: "LeatherStretchingShort" },
	{ Name: "LeatherStretchingWithMetal", File: ["LeatherStretchingWithMetal1", "LeatherStretchingWithMetal2", "TightLeatherStretchWithMetal"] },
	{ Name: "PolyesterWoosh1", File: "PolyesterWoosh1" },
	{ Name: "PolyesterWoosh2", File: "PolyesterWoosh2" },
	{ Name: "PolyesterWooshWithMetal1", File: "PolyesterWooshWithMetal1" },
	{ Name: "PolyesterWooshWithMetal2", File: "PolyesterWooshWithMetal2" },
	{ Name: "PolyesterWooshWithMetal3", File: "PolyesterWooshWithMetal3" },
	{ Name: "Slime", File: "Slime" },
	{ Name: "SofterCageClose", File: "SofterCageClose" },
	{ Name: "LockerClose", File: "LockerClose" },
	{ Name: "SoftCloth1", File: "SoftCloth1" },
	{ Name: "SoftCloth2", File: "SoftCloth2" },
	{ Name: "SoftClothWithMetal1", File: "SoftClothWithMetal1" },
	{ Name: "SoftClothWithMetal2", File: "SoftClothWithMetal2" },
	{ Name: "TightLeatherStretchWithMetalLong", File: "TightLeatherStretchWithMetalLong" },
	{ Name: "TightLeatherStretch", File: "TightLeatherStretch" },
	{ Name: "PlasticRustle", File: "PlasticRustle" },
	{ Name: "PlaceBowl", File: "PlaceBowl" },
	{ Name: "MetalStraps", File: "MetalStraps" },
	{ Name: "MetalShut", File: "MetalShut" },
	{ Name: "MetalClip", File: "MetalClip" },
	{ Name: "SoftFurniture", File: "SoftFurniture" },
	{ Name: "WoodFurniture", File: "WoodFurniture" },
	{ Name: "PutDownPlastic", File: "PutDownPlastic" },
	{ Name: "EnemaFixture", File: "EnemaFixture" },
];


/**
 * A list of chat message audio effect "detectors".
 *
 * They get checked in the order they're defined, so be careful where you insert new entries.
 *
 * @type {AudioChatAction[]}
 */
var AudioActions = [
	{
		IsAction: (data) => data.Content === "ActionAddLock",
		GetSoundEffect: () => "LockSmall"
	},
	{
		IsAction: (data) => data.Content.startsWith("TimerRelease"),
		GetSoundEffect: () => "Unlock"
	},
	{
		IsAction: (data) => data.Content === "ActionUnlock",
		GetSoundEffect: () => "Unlock"
	},
	{
		IsAction: (data) => data.Content === "ActionPick",
		GetSoundEffect: () => "Unlock"
	},
	{
		IsAction: (data) => data.Content === "ActionUnlockAndRemove",
		GetSoundEffect: () => "Unlock"
	},
	{
		IsAction: (data) => ["FuturisticCollarTriggerLockdown", "PortalLinkFunctionLock"].some(A => data.Content === A),
		GetSoundEffect: () => "HydraulicLock"
	},
	{
		IsAction: (data) => ["FuturisticCollarTriggerUnlock", "PortalLinkFunctionUnlock"].some(A => data.Content === A),
		GetSoundEffect: () => "HydraulicUnlock"
	},
	{
		IsAction: (data) => data.Content === "ActionLock",
		GetSoundEffect: AudioGetSoundFromChatMessage
	},
	{
		IsAction: (data) => ["ActionUse", "ActionSwap"].includes(data.Content) && data.Sender !== Player.MemberNumber,
		GetSoundEffect: AudioGetSoundFromChatMessage,
	},
	{
		IsAction: (data) => ["ItemDevicesKennelSetd1"].some(A => data.Content === A),
		GetSoundEffect: () => "CageClose"
	},
	{
		IsAction: (data) => ["ItemDevicesKennelSetd0"].some(A => data.Content === A),
		GetSoundEffect: () => "CageOpen"
	},
	{
		IsAction: (data) => [
			"pumps",
			"Suctightens",
			"InflatableBodyBagSet",
			"ItemButtInflVibeButtPlugIncreaseTof",
			"InflatableVibratingPantiesIncreaseTof"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "Inflation"
	},
	{
		IsAction: (data) => [
			"deflates",
			"Sucloosens",
			"ItemButtInflVibeButtPlugDecreaseTof",
			"InflatableVibratingPantiesDecreaseTof"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "Deflation"
	},
	{
		IsAction: (data) => [
			"ItemMouthFuturisticPanelGagSetPumpInflateg",
			"ItemMouthFuturisticHarnessGagSetPumpInflateg",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "Inflation"
	},
	{
		IsAction: (data) => [
			"ItemMouthFuturisticPanelGagSetPumpDeflateg",
			"ItemMouthFuturisticHarnessGagSetPumpDeflateg",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "Deflation"
	},
	{
		IsAction: (data) => [
			"ItemMouthFuturisticPanelGagSetg",
			"ItemMouthFuturisticHarnessBallGagSetg",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "SciFiPump"
	},
	{
		IsAction: (data) => [
			"FuturisticTrainingBeltSetStateNoneOff"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "FuturisticApply"
	},
	{
		IsAction: (data) => [
			"FuturisticTrainingBeltSetStateLowPriorityEdgeLow",
			"FuturisticTrainingBeltSetStateLowPriorityEdgeLowSelf",
			"FuturisticTrainingBeltSetStateHighPriorityEdgeLow",
			"FuturisticTrainingBeltSetStateHighPriorityEdgeLowSelf"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "VibrationEdgeLow"
	},
	{
		IsAction: (data) => [
			"FuturisticTrainingBeltSetStateLowPriorityTeaseLow",
			"FuturisticTrainingBeltSetStateLowPriorityLowLow"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "VibrationTeaseLow"
	},
	{
		IsAction: (data) => [
			"FuturisticTrainingBeltSetStateCooldownOff"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "VibrationCooldown"
	},
	{
		IsAction: (data) => [
			"FuturisticTrainingBeltSetStateLowPriorityEdgeMedium",
			"FuturisticTrainingBeltSetStateLowPriorityEdgeMediumSelf",
			"FuturisticTrainingBeltSetStateHighPriorityEdgeMedium",
			"FuturisticTrainingBeltSetStateHighPriorityEdgeMediumSelf"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "VibrationEdgeMedium"
	},
	{
		IsAction: (data) => [
			"FuturisticTrainingBeltSetStateLowPriorityTeaseMedium",
			"FuturisticTrainingBeltSetStateLowPriorityMedium"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "VibrationTeaseMedium"
	},
	{
		IsAction: (data) => [
			"FuturisticTrainingBeltSetStateLowPriorityEdgeHigh",
			"FuturisticTrainingBeltSetStateLowPriorityEdgeHighSelf",
			"FuturisticTrainingBeltSetStateHighPriorityEdgeHigh",
			"FuturisticTrainingBeltSetStateHighPriorityEdgeHighSelf"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "VibrationEdgeHigh"
	},
	{
		IsAction: (data) => [
			"FuturisticTrainingBeltSetStateLowPriorityEdgeMaximum",
			"FuturisticTrainingBeltSetStateLowPriorityEdgeMaximumSelf",
			"FuturisticTrainingBeltSetStateLowPriorityTeaseMaximum",
			"FuturisticTrainingBeltSetStateLowPriorityTeaseHigh",
			"FuturisticTrainingBeltSetStateHighPriorityMax",
			"FuturisticTrainingBeltSetStateLowPriorityMax",
			"FuturisticTrainingBeltSetStateHighPriorityEdgeMaximum",
			"FuturisticTrainingBeltSetStateHighPriorityEdgeMaximumSelf"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "VibrationMaximum"
	},
	{
		IsAction: (data) => [
			"InteractiveVisorSet"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "SciFiEffect"
	},
	{
		IsAction: (data) => [
			"ChainSet",
			"CeilingShacklesSet"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "ChainLong"
	},
	{
		IsAction: (data) => [
			"RopeSet"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "RopeShort"
	},
	{
		IsAction: (data) => [
			"ShacklesRestrain",
			"Ornate",
			"HighStyleSteel"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "CuffsMetal"
	},
	{
		IsAction: (data) => [
			"FuturisticChastityBeltShock",
			"ObedienceBeltShock"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "Shocks"
	},
	{
		IsAction: (data) => [
			"FuturisticChastityBeltSetClosed",
			"FuturisticChastityBeltSetOpen",
			"ItemBreastFuturisticBraSet",
			"FuturisticHeelsSet",
			"FuturisticArmbinderSet",
			"FuturisticCuffsRestrain",
			"FuturisticLegCuffsRestrain",
			"FuturisticAnkleCuffsRestrain",
			"ItemPelvisSciFiPleasurePantiesSetc",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "SciFiConfigure"
	},
	{
		IsAction: (data) => [
			"FuturisticTrainingBeltSetGeneric",
			"ItemMouthFuturisticPanelGagSetp",
			"ItemMouthFuturisticPanelGagSett",
			"ItemPelvisSciFiPleasurePantiesSeto",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "SciFiBeeps"
	},
	{
		IsAction: (data) => [
			"FuturisticCrateSet"
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "SciFiConfigure"
	},
	{
		IsAction: (data) => [
			"TriggerShock",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: (data) => AudioShockSounds(data)
	},
	{
		IsAction: (data) => [
			"Decrease",
			"Increase"
		].some(A => data.Content.includes(A)) && !data.Content.endsWith("-1"),
		GetSoundEffect: AudioVibratorSounds
	},
	{
		IsAction: (data) => data.Content.startsWith("ItemPelvisModularChastityBeltSeti") && !data.Content.endsWith("0"),
		GetSoundEffect: AudioVibratorSounds
	},
	{
		IsAction: (data) =>
			data.Type == "Activity" && (data.Content.endsWith('-Slap') || data.Content.endsWith('-Spank')),
		GetSoundEffect: () => "SpankSkin"
	},
	{
		IsAction: (data) =>
			data.Type === "Action" && data.Content === "ItemVulvaPiercingsRoundClitPiercingSetBell",
		GetSoundEffect: () => "BellSmall",
	},
	{
		IsAction: (data) => data.Type === "Activity",
		GetSoundEffect: AudioGetSoundFromChatMessage
	},
	{
		IsAction: (data) => [
			"PersonalCageHeightSet",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "LeverShort"
	},
	{
		IsAction: (data) => [
			"ItemHoodBalloonSetTight",
			"ItemHoodBalloonSetExtreme",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "BalloonRubbing"
	},
	{
		IsAction: (data) => [
			"ItemHoodBalloonSetLoose",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "Inflation"
	},
	{
		IsAction: (data) => [
			"ItemDevicesExclusiveWaitressSetc0",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "AirDoorOpening"
	},
	{
		IsAction: (data) => [
			"ItemDevicesExclusiveWaitressSetc1",
			"ItemDevicesExclusiveWaitressSetc2",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "AirDoorClosing"
	},
	{
		IsAction: (data) => [
			"ItemDevicesExclusiveWaitressSetf0",
			"ItemDevicesExclusiveWaitressSetf1",
			"ItemDevicesExclusiveWaitressSetf3",
			"ItemDevicesExclusiveWaitressSetf4",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "EMLevitate"
	},
	{
		IsAction: (data) => [
			"ItemDevicesExclusiveWaitressSetf2",
			"ItemDevicesExclusiveWaitressSetf5",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "EMDisable"
	},
	{
		IsAction: (data) => [
			"ItemDevicesLeatherCageSets0",
			"ItemDevicesLeatherCageSets1",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "LeverShort"
	},
	{
		IsAction: (data) => [
			"ItemDevicesLeatherCageSetf0",
			"ItemDevicesLeatherCageSetf1",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "Buckle"
	},
	{
		IsAction: (data) => [
			"ItemDevicesLeatherCageSetc0",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "CuffsMetal"
	},
	{
		IsAction: (data) => [
			"ItemDevicesLeatherCageSetc1",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "MetalCuffs"
	},
	{
		IsAction: (data) => [
			"ItemTorsoSteelBeltSeth1",
			"ItemTorsoSteelBeltSeth2",
			"ItemTorsoSteelBeltSeth3",
			"ItemTorso2SteelBeltSeth1",
			"ItemTorso2SteelBeltSeth2",
			"ItemTorso2SteelBeltSeth3",
			"ItemArmsSteelBeltSeth1",
			"ItemArmsSteelBeltSeth2",
			"ItemArmsSteelBeltSeth3",
			"ItemNeckRestraintsMCuffCollarSeth1",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "MetalCuffs"
	},
	{
		IsAction: (data) => [
			"ItemTorsoSteelBeltSeth0",
			"ItemTorso2SteelBeltSeth0",
			"ItemArmsSteelBeltSeth0",
			"ItemNeckRestraintsMCuffCollarSeth0",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "CuffsMetal"
	},
	{
		IsAction: (data) => [
			"ItemHoodHalloIIISeth2",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "Hallo"
	},
	{
		IsAction: (data) => [
			"ItemTorsoBarrelCorsetSetw0",
			"ItemTorsoBarrelCorsetSetw1",
			"ItemTorsoBarrelCorsetSetx0",
			"ItemTorsoBarrelCorsetSetx1",
			"ItemTorsoBarrelCorsetSety0",
			"ItemTorsoBarrelCorsetSety1",
			"ItemTorso2BarrelCorsetSetw0",
			"ItemTorso2BarrelCorsetSetw1",
			"ItemTorso2BarrelCorsetSetx0",
			"ItemTorso2BarrelCorsetSetx1",
			"ItemTorso2BarrelCorsetSety0",
			"ItemTorso2BarrelCorsetSety1",
			"ItemLegsBarrelCorsetSetw0",
			"ItemLegsBarrelCorsetSetw1",
			"ItemLegsBarrelCorsetSetx0",
			"ItemLegsBarrelCorsetSetx1",
			"ItemLegsBarrelCorsetSety0",
			"ItemLegsBarrelCorsetSety1",
			"ItemTorsoBarrelCorsetSets0",
			"ItemTorso2BarrelCorsetSets0",
			"ItemLegsBarrelCorsetSets0",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "Buckle"
	},
	{
		IsAction: (data) => [
			"ItemTorsoBarrelCorsetSets1",
			"ItemTorso2BarrelCorsetSets1",
			"ItemLegsBarrelCorsetSets1",
		].some(A => data.Content.includes(A)),
		GetSoundEffect: () => "LeatherStretching1"
	},
];

/**
 * Plays a sound at a given volume
 * @param {string} src - Source of the audio file to play
 * @param {number} [volume] - Volume of the audio in percentage (ranges from 0 to 1)
 * @returns {void} - Nothing
 */
function AudioPlayInstantSound(src, volume) {
	const vol = volume != null ? volume : Player.AudioSettings.Volume;
	if (vol > 0) {
		var audio = new Audio();
		audio.src = src;
		audio.volume = Math.min(vol, 1);
		CommonPromiseCatch(audio.play());
	}
}

/**
 * Begins to play a sound when applying/removing an item
 * @param {string} SourceFile - Source of the audio file to play
 * @deprecated
 * @returns {void} - Nothing
 */
function AudioDialogStart(SourceFile) {
	if (AudioShouldSilenceSound()) return;
	AudioDialog.pause();
	AudioDialog.currentTime = 0;
	AudioDialog.src = SourceFile;
	AudioDialog.volume = Player.AudioSettings.Volume;
	CommonPromiseCatch(AudioDialog.play());
}

/**
 * Stops playing the sound when done applying/removing an item
 * @deprecated
 * @returns {void} - Nothing
 */
function AudioDialogStop() {
	AudioDialog.pause();
	AudioDialog.currentTime = 0;
}

/** The "normal" volume for a game sound, a.k.a a sound with modifier 0 */
let AudioVolumeNormalLevel = 0.5;
/** Number of available modifier steps */
let AudioVolumeModifierSteps = 4;

/**
 * Returns the actual volume given a volume modifier.
 *
 * @param {number} modifier - The volume modifier to use, from -4 to 4
 * @returns {number} The volume level, from 0.0 to 1.0
 */
function AudioVolumeFromModifier(modifier) {
	modifier = Math.max(-AudioVolumeModifierSteps, Math.min(AudioVolumeModifierSteps, modifier));
	let volumeMod = (2 * (1 - AudioVolumeNormalLevel) * modifier / (2 * AudioVolumeModifierSteps));
	return Player.AudioSettings.Volume * AudioVolumeNormalLevel + (isNaN(volumeMod) ? 0 : volumeMod);
}

/**
 * Is sound allowed to play.
 *
 * @param {boolean} IsPlayerInvolved - Whether the player was involved in what caused the sound to play.
 * @returns {boolean} True if the player has item sound enabled, and a non-muted volume, false otherwise.
 */
function AudioShouldSilenceSound(IsPlayerInvolved = false) {
	if (!Player.AudioSettings || !Player.AudioSettings.Volume || (Player.AudioSettings.Volume == 0))
		return true;

	if (!Player.AudioSettings.PlayItem && ServerPlayerIsInChatRoom())
		return true;

	if (Player.AudioSettings.PlayItemPlayerOnly && !IsPlayerInvolved)
		return true;

	return false;
}

/**
 * Takes the received data dictionary content and identifies the audio to be played
 * @param {ServerChatRoomMessage} data - Data received
 * @param {Character} sender
 * @param {string} msg
 * @param {any} metadata
 * @returns {boolean}
 */
function AudioPlaySoundForChatMessage(data, sender, msg, metadata) {
	if (!data || !sender || !metadata || !["Activity", "Action", "ServerMessage"].includes(data.Type))
		return false;

	if (AudioShouldSilenceSound(ChatRoomMessageInvolvesPlayer(data))) return false;

	// Instant actions can trigger a sound depending on the action.
	let Action = AudioActions.find(CA => CA.IsAction && CA.IsAction(data));
	/** @type {AudioSoundEffect | null} */
	let soundEffect = null;
	if (Action) {
		let snd = Action.GetSoundEffect(data, metadata);
		if (typeof snd === "string")
			soundEffect = [snd, 0];
		else
			soundEffect = snd;
	}

	const Target = metadata.TargetCharacter;
	if (!soundEffect || !Target) return false;

	// Update noise level depending on who the interaction took place between.  Sensory isolation increases volume for self, decreases for others.
	if (Target.MemberNumber == Player.MemberNumber) soundEffect[1] += 3;
	else if (data.Sender != Player.MemberNumber) soundEffect[1] -= 3;

	AudioPlaySoundEffect(soundEffect);

	return false;
}

/**
 * Low-level function to play a sound effect.
 * @param {AudioSoundEffect|string|null} soundEffect
 * @param {number} [volumeModifier]
 * @returns {boolean} if a sound was played or not.
 */
function AudioPlaySoundEffect(soundEffect, volumeModifier) {
	if (!soundEffect) return false;
	if (!volumeModifier) volumeModifier = 0;

	let soundEffectName = null;
	if (Array.isArray(soundEffect)) {
		soundEffectName = soundEffect[0];
		volumeModifier += soundEffect[1];
	} else if (typeof soundEffect === "string") {
		soundEffectName = soundEffect;
	} else {
		console.error('Invalid sound effect');
		return false;
	}
	let fileName = AudioGetFileName(soundEffectName);
	if (!fileName) return false;

	const blindLevel = Player.GetBlindLevel();
	if (blindLevel >= 3) volumeModifier += 4;
	else if (blindLevel == 2) volumeModifier += 2;
	else if (blindLevel == 1) volumeModifier += 1;

	volumeModifier -= Player.GetDeafLevel();


	// Sends the audio file to be played
	AudioPlayInstantSound("Audio/" + fileName + ".mp3", AudioVolumeFromModifier(volumeModifier));
	return true;
}

/**
 * Plays a given asset sound effect.
 * @param {Character} character
 * @param {Asset} asset
 * @returns {boolean} Whether a sound was played.
 */
function AudioPlaySoundForAsset(character, asset) {
	if (AudioShouldSilenceSound()) return false;

	let sound = AudioGetSoundFromAsset(character, asset.Group.Name, asset.Name);
	return AudioPlaySoundEffect(sound, 0);
}

/**
 * Get the sound effect for a given asset.
 *
 * @param {Character} character
 * @param {AssetGroupName} groupName
 * @param {string} assetName
 * @returns {AudioSoundEffect | null}
 */
function AudioGetSoundFromAsset(character, groupName, assetName) {
	let asset = AssetGet(character.AssetFamily, groupName, assetName);
	if (!asset) return null;

	let sound = asset.Audio;
	if (asset.DynamicAudio) {
		sound = asset.DynamicAudio(character);
	}

	return sound ? [sound, 0] : null;
}

/**
 * Get a file name for a given sound effect.
 * @param {string} sound - The sound effect to load a file from.
 * @returns {string?}
 */
function AudioGetFileName(sound) {
	let audioEffect = AudioList.find(A => A.Name == sound);
	if (!audioEffect) {
		console.error(`Unknown sound effect: ${sound}`);
		return null;
	}
	if (Array.isArray(audioEffect.File)) {
		return CommonGetRandomItemFromList(audioEffect.File);
	} else {
		return audioEffect.File;
	}
}

/**
 * Processes which sound should be played for items
 * @param {ServerChatRoomMessage} data - Data content triggering the potential sound
 * @param {IChatRoomMessageMetadata} metadata - The chat message metadata
 * @returns {AudioSoundEffect | null} - The name of the sound to play, followed by the noise modifier
 */
function AudioGetSoundFromChatMessage(data, metadata) {
	const sender = metadata.SourceCharacter;
	if (!data || !sender) return null;

	if (data.Type === "Activity" && metadata.ActivityAsset) {
		let item = InventoryGet(sender, metadata.ActivityAsset.Group.Name);
		if (!item || item.Asset.Name !== metadata.ActivityAsset.Name) return null;

		// Workaround for the shock remote; select the item on the target instead
		if (item.Asset.Name === "ShockRemote" && metadata.FocusGroup && metadata.TargetCharacter) {
			item = InventoryGet(metadata.TargetCharacter, metadata.FocusGroup.Name);
		}

		if (!item || !item.Asset.ActivityAudio) return null;

		const idx = item.Asset.AllowActivity?.findIndex(a => a === metadata.ActivityName) ?? -1;
		const soundEffect = item.Asset.ActivityAudio[idx];

		if (!soundEffect) return null;

		return [soundEffect, 0];
	} else if (data.Type === "Action") {
		const NextAsset = metadata.Assets && metadata.Assets.NextAsset;
		if (!NextAsset) return null;

		return AudioGetSoundFromAsset(sender, NextAsset.Group.Name, NextAsset.Name);
	}
	return null;
}

/**
 * Processes the sound for vibrators
 * @param {ServerChatRoomMessage} data - Represents the chat message received
 * @param {IChatRoomMessageMetadata} metadata - The metadata from the recieved message
 * @returns {AudioSoundEffect | null} - The name of the sound to play, followed by the noise modifier
 */
function AudioVibratorSounds(data, metadata) {
	/** @type {AudioEffectName | undefined} */
	let Sound;

	var Level = parseInt(data.Content.substring(data.Content.length - 1));
	if (isNaN(Level)) Level = 0;

	// FIXME: what is going on in here? Assets not an array, and AssetName being an Asset and not a string?
	if (!metadata || !metadata.Assets || !metadata.Assets.AssetName)
		return null;

	const AssetName = metadata.Assets.AssetName.Name;
	// FIXME: that should be moved into a vibrating-item-specific extended property instead of an hardcoded list
	switch (AssetName) {
		/* Silent */
		case 'FuckMachine':
			break;

		default:
			Sound = "VibrationShort";
			break;

		case "WandBelt":
		case "LoveChastityBelt":
		case "SciFiPleasurePanties":
		case "VibratingLatexPanties":
		case "InflVibeButtPlug":
			Sound = "VibrationLong1";
			break;

		/*
		 * FIXME: commented out 'cause it's supposed to apply this sound to the plug part,
		 * but there's no way to detect that
		 */
		// case "InflVibeButtPlug":
		case 'BunnyTailVibePlug':
		case 'EggVibePlugXXL':
		case 'HempRopeBelt':
		case 'SpreaderVibratingDildoBar':
		case 'VibratingButtplug':
			Sound = "VibrationLong2";
			break;

		case "Sybian":
			Sound = "Sybian";
			break;
	}

	return Sound ? [Sound, Level] : null;
}

/**
 * Processes the sound for shocks
 * @param {ServerChatRoomMessage} data - Represents the chat message received
 * @returns {AudioSoundEffect} - The name of the sound to play, followed by the noise modifier
 */
function AudioShockSounds(data) {
	let Modifier = parseInt(data.Content.slice(-1));
	if (isNaN(Modifier)) Modifier = 0;
	return ["Shocks", Modifier];
}

/**
 * Sets the volume of the background music
 * @param {number} volume
 */
function AudioBackgroundMusicSetVolume(volume) {
	AudioBackgroundMusic.volume = CommonClamp(volume, 0, 1);

	if (volume === 0) {
		AudioBackgroundMusicStop();
		return;
	}
	const track = AudioBackgroundMusicYouTube;
	if (track.videoId) CommonPromiseCatch(AudioYouTubePlay(track, track.videoId, track.start, volume));
	else CommonPromiseCatch(AudioBackgroundMusic.play());
}

/**
 * Stops the background music
 */
function AudioBackgroundMusicStop() {
	AudioBackgroundMusic.pause();
	AudioYouTubePause(AudioBackgroundMusicYouTube);
}

/**
 * Plays the background music
 * @param {string} Music - The URL of the music to play
 * @param {number | undefined} Location - Where to start playing from in the file
 * @returns {void} - Nothing
 */
function AudioBackgroundMusicPlay(Music, Location = undefined) {
	Music = Music.trim();

	// If no music should play
	if (Music === "") {
		AudioBackgroundMusicStop();
		return;
	}

	// A YouTube link plays the video's sound instead of the file
	const videoId = AudioYouTubeVideoId(Music);
	if (videoId) {
		if (AudioBackgroundMusic.src) {
			AudioBackgroundMusic.pause();
			AudioBackgroundMusic.removeAttribute("src");
			AudioBackgroundMusic.load();
		}
		const start = Location === undefined ? undefined : CommonTime() - Location * 1000;
		CommonPromiseCatch(AudioYouTubePlay(AudioBackgroundMusicYouTube, videoId, start, Player.AudioSettings.MusicVolume));
		return;
	}
	AudioYouTubeStop(AudioBackgroundMusicYouTube);

	// Only allows .mp3 and .mp4 files for now
	if (!CommonURLHasExtension(Music, AudioSupportedMusicFormats)) {
		AudioBackgroundMusicStop();
		return;
	}

	// We're already playing that; the browser keeps the link encoded (a space becomes %20), so it's compared that way
	const isNew = AudioBackgroundMusic.src !== new URL(Music, document.baseURI).href;
	if (!isNew && !AudioBackgroundMusic.paused) return;

	if (isNew) {
		AudioBackgroundMusic.src = Music;
		AudioBackgroundMusic.loop = true;
		AudioBackgroundMusic.load();
	}

	if (!AudioBackgroundMusic._playState) {
		AudioBackgroundMusic._playState = {};

		/** @param {typeof AudioBackgroundMusic} audio  */
		function syncPlayback(audio) {
			if (audio._playState?.location !== undefined && isNaN(audio.duration)) {
				console.error(`audio source ${audio.src} has no duration; cannot sync playback`);
				return false;
			}

			const time = audio._playState?.location !== undefined ? audio._playState.location % audio.duration : audio.currentTime ?? 0;
			audio.currentTime = time;
			return true;
		}

		AudioBackgroundMusic.addEventListener('play', function () {
			const self = /** @type {typeof AudioBackgroundMusic} */ (this);

			if (!syncPlayback(self)) {
				// We started playing without having the metadata, try syncing again when we have it
				self.addEventListener('loadedmetadata', () => syncPlayback(self), { once: true });
			}
		});
	}

	AudioBackgroundMusic._playState.location = Location;

	AudioBackgroundMusic.volume = CommonClamp(Player.AudioSettings.MusicVolume, 0, 1);
	if (AudioBackgroundMusic.volume > 0) {
		CommonPromiseCatch(AudioBackgroundMusic.play());
	} else {
		AudioBackgroundMusic.pause();
	}
}

/**
 * Gets the ID of the YouTube video a link points to
 * @param {string} url - A youtube.com/watch, youtu.be, shorts, live or embed link
 * @returns {null | string} - The video ID, or `null` if it's not a YouTube video link
 */
function AudioYouTubeVideoId(url) {
	let parsed;
	try {
		parsed = new URL(url.trim());
	} catch (_err) {
		return null;
	}
	if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
	const host = parsed.hostname.replace(/^(www|m|music)\./, "");
	let videoId = null;
	if (host === "youtu.be") {
		videoId = parsed.pathname.slice(1);
	} else if (host === "youtube.com" || host === "youtube-nocookie.com") {
		if (parsed.pathname === "/watch") videoId = parsed.searchParams.get("v");
		else videoId = /^\/(?:shorts|live|embed)\/([^/]+)/.exec(parsed.pathname)?.[1] ?? null;
	}
	return videoId && /^[\w-]{11}$/.test(videoId) ? videoId : null;
}

/**
 * Creates a YouTube track; its player is only made the first time it plays
 * @returns {AudioYouTubeTrack}
 */
function AudioYouTubeCreateTrack() {
	return { player: null, videoId: null, loaded: false, start: undefined, playing: false, synced: false };
}

/**
 * Loads the YouTube IFrame player API, once
 * @returns {Promise<NonNullable<Window["YT"]>>}
 */
function AudioYouTubeLoadAPI() {
	if (!AudioYouTubeAPI) {
		AudioYouTubeAPI = new Promise((resolve, reject) => {
			window.onYouTubeIframeAPIReady = () => {
				if (window.YT) resolve(window.YT);
				else reject(new Error("The YouTube player failed to load"));
			};
			const script = document.createElement("script");
			script.src = "https://www.youtube.com/iframe_api";
			script.addEventListener("error", () => {
				AudioYouTubeAPI = null;
				reject(new Error("The YouTube player failed to load"));
			});
			document.head.append(script);
		});
	}
	return AudioYouTubeAPI;
}

/**
 * Gets the player of a YouTube track, making it if needed. The player is hidden: only the sound is used.
 * @param {AudioYouTubeTrack} track
 * @returns {Promise<AudioYouTubePlayer>}
 */
function AudioYouTubeGetPlayer(track) {
	if (!track.player) {
		track.player = AudioYouTubeLoadAPI().then((YT) => new Promise((resolve) => {
			const element = ElementCreate({ tag: "div" });
			ElementCreate({
				tag: "div",
				attributes: { "aria-hidden": "true" },
				style: { position: "fixed", left: "0", top: "0", width: "1px", height: "1px", overflow: "hidden", opacity: "0", "pointer-events": "none" },
				children: [element],
				parent: document.body,
			});
			new YT.Player(element, {
				width: 1,
				height: 1,
				playerVars: { controls: 0, disablekb: 1, playsinline: 1 },
				events: {
					onReady: (event) => resolve(event.target),
					onStateChange: (event) => AudioYouTubeStateChange(track, event.target, event.data),
					onError: (event) => console.warn(`YouTube music ${track.videoId} can't be played, error ${event.data}`),
				},
			});
		}));
		track.player.catch(() => track.player = null);
	}
	return track.player;
}

/**
 * Keeps a YouTube track in sync with the room when it starts playing, and loops it when it ends
 * @param {AudioYouTubeTrack} track
 * @param {AudioYouTubePlayer} player
 * @param {number} state
 * @returns {void}
 */
function AudioYouTubeStateChange(track, player, state) {
	if (state === AudioYouTubeState.Ended) {
		player.seekTo(0, true);
		player.playVideo();
		return;
	}
	if (state !== AudioYouTubeState.Playing) return;
	if (!track.playing) {
		player.pauseVideo();
		return;
	}
	if (track.synced) return;
	track.synced = true;
	const duration = player.getDuration();
	if (track.start !== undefined && duration > 0) player.seekTo(((CommonTime() - track.start) / 1000) % duration, true);
}

/**
 * Plays a YouTube video's sound on a track, looping like the background music does
 * @param {AudioYouTubeTrack} track
 * @param {string} videoId
 * @param {number | undefined} start - When the music started for the room ({@link CommonTime}), or `undefined` to play on from where it is
 * @param {number} volume - From 0 to 1
 * @returns {Promise<void>}
 */
async function AudioYouTubePlay(track, videoId, start, volume) {
	if (track.videoId !== videoId) {
		track.videoId = videoId;
		track.loaded = false;
	}
	track.start = start;
	track.playing = volume > 0;
	const player = await AudioYouTubeGetPlayer(track);
	if (track.videoId !== videoId) return;

	player.setVolume(Math.round(CommonClamp(volume, 0, 1) * 100));
	if (!track.playing) {
		player.pauseVideo();
		return;
	}
	if (!track.loaded) {
		track.loaded = true;
		track.synced = false;
		player.loadVideoById(videoId);
	} else if (player.getPlayerState() !== AudioYouTubeState.Playing) {
		track.synced = false;
		player.playVideo();
	}
}

/**
 * Pauses a YouTube track
 * @param {AudioYouTubeTrack} track
 * @returns {void}
 */
function AudioYouTubePause(track) {
	track.playing = false;
	track.player?.then((player) => player.pauseVideo(), () => {});
}

/**
 * Stops a YouTube track and forgets its video
 * @param {AudioYouTubeTrack} track
 * @returns {void}
 */
function AudioYouTubeStop(track) {
	AudioYouTubePause(track);
	track.videoId = null;
	track.loaded = false;
}
