"use strict";
var PrivateBackground = "Private";
/** @type {NPCCharacter} */
var PrivateVendor = /** @type {never} */ (null);
/** @type {NPCCharacter[]} */
var PrivateCharacter = [];
var PrivateCharacterOffset = 0;
var PrivateCharacterShouldSync = false;
var PrivateCharacterMax = 4;
var PrivateReleaseTimer = 0;
var PrivateActivity = "";
var PrivateActivityCount = 0;
var PrivateActivityAffectLove = true;
var PrivateActivityList = ["Gag", "Ungag", "Restrain", "RestrainOther", "FullRestrain", "FullRestrainOther", "Release", "Unchaste", "Tickle", "Spank", "Pet", "Slap", "Kiss", "Fondle", "Naked", "Underwear", "RandomClothes", "CollegeClothes", "Shibari", "Gift", "PetGirl", "Locks", "Bed", "Aftercare", "CollarType"];
/** @type {null | NPCCharacter} */
var PrivateActivityTarget = null;
/** @type {PrivatePunishmentType | null} */
var PrivatePunishment = null;
/** @type {PrivatePunishmentType[]} */
var PrivatePunishmentList = ["Cage", "Bound", "BoundPet", "ChastityBelt", "ChastityBra", "ForceNaked", "ConfiscateKey", "ConfiscateCrop", "ConfiscateWhip", "SleepCage", "LockOut", "Cell", "OwnerLocks", "Asylum"];
/** @type {NPCTraitType | null} */
var PrivateSlaveImproveType = null;
var PrivateNextLoveYou = 0;
/** @type {PrivateActivityType | null} */
var PrivateLoverActivity = null;
/** @type {PrivateActivityType[]} */
var PrivateLoverActivityList = ["Skip1", "Skip2", "Kiss", "FrenchKiss", "Caress", "Rub", "MasturbateHand", "MasturbateTongue", "MasturbatePlayer", "MasturbateSelf", "Underwear", "Naked", "EggInsert", "LockBelt", "UnlockBelt", "EggSpeedUp", "EggSpeedDown", "Bed", "LoverLock", "LoverUnlock"];
/** @type {AssetName[]} */
var PrivateBeltList = ["LeatherChastityBelt", "SleekLeatherChastityBelt", "StuddedChastityBelt", "MetalChastityBelt", "PolishedChastityBelt", "OrnateChastityBelt", "SteelChastityPanties"];
var PrivateEntryEvent = true;
var PrivateClubCardVictoryMode = false;
var PrivateClubCardDefeatConsequence = ["Cage", "Bound", "BoundPet", "Chastity", "ForceNaked", "Spank", "Tickle", "Orgasm", "Shibari"];
/** @type {Asset | null} */
var PrivateGiftRegular = null;
/** @type {Asset | null} */
var PrivateGiftRestraint = null;
var PrivateBaseDecay = 7200000; // Base NPC love decay is -1 love per 2 hours
const PrivateCollegeNPCNames = /** @type {const} */ (["Amanda", "Sarah", "Jennifer", "Sidney"]);

/**
 * Checks if the player is caged.
 * @returns {boolean} - TRUE if the player is in the cage.
 */
function PrivateIsCaged() { return CurrentCharacter?.Cage ?? false; }
/**
 * Checks if the player can get the second private room expansion.
 * @returns {boolean} - TRUE if the player has the first private room expansion, but not the second.
 */
function PrivateCanGetSecondExtension() { return (LogQuery("Expansion", "PrivateRoom") && !LogQuery("SecondExpansion", "PrivateRoom")); }
/**
 * Checks if the player can play with the private room vendor.
 * @returns {boolean} - TRUE if the player has every upgrade and both characters can interact.
 */
function PrivateVendorCanPlay() { return (LogQuery("RentRoom", "PrivateRoom") && LogQuery("Wardrobe", "PrivateRoom") && LogQuery("Cage", "PrivateRoom") && LogQuery("Expansion", "PrivateRoom") && Player.CanInteract() && PrivateVendor.CanInteract()); }
/**
 * Checks if the player can change her clothes.
 * @returns {boolean} - TRUE if the player is not restrained and is more dominant than the current character.
 */
function PrivateAllowChange() { return !!CurrentCharacter && (!CurrentCharacter.IsRestrained() && (ReputationGet("Dominant") + 25 >= NPCTraitGet(CurrentCharacter, "Dominant"))); }
/**
 * Checks if the player is not able to change.
 * @returns {boolean} - TRUE if the player is not restrained, but is not enough dominant to change.
 */
function PrivateWontChange() { return !!CurrentCharacter && (!CurrentCharacter.IsRestrained() && (ReputationGet("Dominant") + 25 < NPCTraitGet(CurrentCharacter, "Dominant"))); }
/**
 * Checks if the current character is restrained.
 * @returns {boolean} - TRUE if the character is restrained.
 */
function PrivateIsRestrained() { return CurrentCharacter?.IsRestrained() ?? false; }
/**
 * Checks if the current character can be restrained.
 * @returns {boolean} - TRUE if the character can be restrained.
 */
function PrivateAllowRestain() { return !!CurrentCharacter && CurrentCharacter.AllowItem; }
/**
 * Checks if both characters in the current dialog can talk.
 * @returns {boolean} - TRUE if both characters are not under a gagging effect.
 */
function PrivateNobodyGagged() { return Player.CanTalk() && (CurrentCharacter?.CanTalk() ?? false); }
/**
 * Checks if the player can masturbate the current character.
 * @returns {boolean} - TRUE if the player is not restrained, the character is not vulva chaste and the character is naked.
 */
function PrivateCanMasturbate() { return !!CurrentCharacter && CharacterIsNaked(CurrentCharacter) && !CurrentCharacter.IsVulvaChaste() && !Player.IsRestrained(); }
/**
 * Checks if the player can fondle the current character's breasts.
 * @returns {boolean} - TRUE if the player is not restrained and the character is not breast chaste.
 */
function PrivateCanFondle() { return !!CurrentCharacter && !CurrentCharacter.IsBreastChaste() && !Player.IsRestrained(); }
/**
 * Checks if the player can be restrained by the current character.
 * @returns {boolean} - TRUE if both characters are not restrained and the player is less dominant than the NPC.
 */
function PrivateAllowRestrainPlayer() {
	return !!CurrentCharacter
		&& !Player.IsRestrained()
		&& !CurrentCharacter.IsRestrained()
		&& ReputationGet("Dominant") - 25 <= NPCTraitGet(CurrentCharacter, "Dominant");
}

/**
 * Checks if the player cannot be restrained by the current character.
 * @returns {boolean} - TRUE if both characters are not restrained, but the player is too dominant to be tied by the NPC.
 */
function PrivateWontRestrainPlayer() {
	return !Player.IsRestrained()
		&& !!CurrentCharacter
		&& !CurrentCharacter.IsRestrained()
		&& (ReputationGet("Dominant") - 25 > NPCTraitGet(CurrentCharacter, "Dominant"));
}
/**
 * Checks if the player can be released by the current character.
 * @returns {boolean} - TRUE if the player is not wearing owner restraints, the player is restrained, the release timer is up or the character is owned by the player, the current character is free and the player's owner is not around.
 */
function PrivateAllowReleasePlayer() {
	return Player.IsRestrained()
		&& !InventoryCharacterHasOwnerOnlyRestraint(Player)
		&& !!CurrentCharacter
		&& CurrentCharacter.CanTalk()
		&& CurrentCharacter.CanInteract()
		&& ((CommonTime() > PrivateReleaseTimer) || CurrentCharacter.IsOwnedByPlayer())
		&& !PrivateOwnerInRoom();
}
/**
 * Checks if the player cannot be released by the current character due to time/character restrictions.
 * @returns {boolean} - TRUE if the player is restrained, but cannot be released due to the character not being owned by the player or the release timer not being expired yet.
 */
function PrivateWontReleasePlayer() {
	return Player.IsRestrained()
		&& !InventoryCharacterHasOwnerOnlyRestraint(Player)
		&& !!CurrentCharacter
		&& CurrentCharacter.CanTalk()
		&& CurrentCharacter.CanInteract()
		&& !((CommonTime() > PrivateReleaseTimer) || CurrentCharacter.IsOwnedByPlayer())
		&& !PrivateOwnerInRoom();
}
/**
 * Checks if the player cannot be released by the current character due to her owner being around.
 * @returns {boolean} - TRUE if the player is restrained, but cannot be released due to her owner being in the room.
 */
function PrivateWontReleasePlayerOwner() {
	return Player.IsRestrained()
		&& !InventoryCharacterHasOwnerOnlyRestraint(Player)
		&& !!CurrentCharacter
		&& CurrentCharacter.CanTalk()
		&& CurrentCharacter.CanInteract()
		&& PrivateOwnerInRoom();
}
/**
 * Checks if the player cannot be released by the current character due to worn owner only restraint(s).
 * @returns {boolean} - TRUE if the player is restrained, but is wearing owner-only restraints.
 */
function PrivateWontReleasePlayerOwnerOnly() {
	return Player.IsRestrained()
		&& InventoryCharacterHasOwnerOnlyRestraint(Player)
		&& !!CurrentCharacter
		&& CurrentCharacter.CanTalk()
		&& CurrentCharacter.CanInteract();
}
/**
 * Checks if the NPC will kneel willingly while not gagged.
 * @returns {boolean} - TRUE if the player is more dominant than the NPC or if the player owns the NPC.
 */
function PrivateWillKneel() {
	return !!CurrentCharacter
		&& CurrentCharacter.CanKneel()
		&& CurrentCharacter.CanTalk()
		&& !CurrentCharacter.IsKneeling()
		&& ((ReputationGet("Dominant") > NPCTraitGet(CurrentCharacter, "Dominant")) || CurrentCharacter.IsOwnedByPlayer());
}
/**
 * Checks if the NPC will kneel willingly while gagged.
 * @returns {boolean} - TRUE if the player is more dominant than the NPC or if the player owns the NPC.
 */
function PrivateWillKneelGagged() {
	return !!CurrentCharacter
		&& CurrentCharacter.CanKneel()
		&& !CurrentCharacter.CanTalk()
		&& !CurrentCharacter.IsKneeling()
		&& ((ReputationGet("Dominant") > NPCTraitGet(CurrentCharacter, "Dominant")) || CurrentCharacter.IsOwnedByPlayer());
}
/**
 * Checks if the NPC will not kneel willingly.
 * @returns {boolean} - TRUE if the player is less dominant than the NPC and if the player does owns the NPC.
 */
function PrivateWontKneel() {
	return !!CurrentCharacter
		&& CurrentCharacter.CanKneel()
		&& !CurrentCharacter.IsKneeling()
		&& (ReputationGet("Dominant") <= NPCTraitGet(CurrentCharacter, "Dominant")) && !CurrentCharacter.IsOwnedByPlayer();
}
/**
 * Checks if the NPC cannot kneel.
 * @returns {boolean} - TRUE if the NPC cannot kneel.
 */
function PrivateCannotKneel() {
	return !!CurrentCharacter && !CurrentCharacter.CanKneel() && !CurrentCharacter.IsKneeling();
}
/**
 * Checks if the NPC can stand.
 * @returns {boolean} - TRUE if the NPC can stand.
 */
function PrivateCanStandUp() { return !!CurrentCharacter && CurrentCharacter.CanKneel() && CurrentCharacter.CanTalk() && CurrentCharacter.IsKneeling(); }
/**
 * Checks if the NPC can stand while gagged.
 * @returns {boolean} - TRUE if the NPC can stand.
 */
function PrivateCanStandUpGagged() { return !!CurrentCharacter && CurrentCharacter.CanKneel() && !CurrentCharacter.CanTalk() && CurrentCharacter.IsKneeling(); }
/**
 * Checks if the NPC cannot stand up.
 * @returns {boolean} - TRUE if the NPC is not able to stand.
 */
function PrivateCannotStandUp() { return !!CurrentCharacter && !CurrentCharacter.CanKneel() && CurrentCharacter.IsKneeling(); }
/**
 * Checks if the character would take the player as a sub.
 * @returns {boolean} - TRUE if the character is willing to own the player.
 */
function PrivateWouldTakePlayerAsSub() {
	return !Player.IsOwned()
		&& !PrivateIsCaged()
		&& !!CurrentCharacter
		&& !CurrentCharacter.IsKneeling()
		&& !CurrentCharacter.IsRestrained()
		&& NPCTraitGet(CurrentCharacter, "Dominant") >= -50
		&& (CurrentCharacter.Love ?? 0) >= 50
		&& ReputationGet("Dominant") + 50 <= NPCTraitGet(CurrentCharacter, "Dominant")
		&& CurrentTime >= CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "PrivateRoomEntry") + NPCLongEventDelay(CurrentCharacter);
}
/**
 * Checks if the character will not take the player as a sub.
 * @returns {boolean} - TRUE if the character is not willing to own the player.
 */
function PrivateWontTakePlayerAsSub() {
	return !Player.IsOwned()
		&& !PrivateIsCaged()
		&& !!CurrentCharacter
		&& !CurrentCharacter.IsKneeling()
		&& !CurrentCharacter.IsRestrained()
		&& NPCTraitGet(CurrentCharacter, "Dominant") >= -50
		&& (ReputationGet("Dominant") + 50 > NPCTraitGet(CurrentCharacter, "Dominant") || (CurrentCharacter.Love ?? 0) < 50);
}
/**
 * Checks if the character would take the player has a sub, but the wait time is not over.
 * @returns {boolean} - TRUE if some time is still needed before the NPC can own the player.
 */
function PrivateNeedTimeToTakePlayerAsSub() {
	return !Player.IsOwned()
		&& !PrivateIsCaged()
		&& !!CurrentCharacter
		&& !CurrentCharacter.IsKneeling()
		&& !CurrentCharacter.IsRestrained()
		&& NPCTraitGet(CurrentCharacter, "Dominant") >= -50
		&& (CurrentCharacter.Love ?? 0) >= 50
		&& ReputationGet("Dominant") + 50 <= NPCTraitGet(CurrentCharacter, "Dominant")
		&& CurrentTime < CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "PrivateRoomEntry") + NPCLongEventDelay(CurrentCharacter);
}
/**
 * Checks if the character would never own the player.
 * @returns {boolean} - TRUE if the character is too submissive to own the player.
 */
function PrivateNeverTakePlayerAsSub() { return !!CurrentCharacter && (NPCTraitGet(CurrentCharacter, "Dominant") < -50); }
/**
 * Checks if the character is currently on a trial.
 * @returns {boolean} - TRUE if the trial is in progress.
 */
function PrivateTrialInProgress() {
	return Player.IsOwned() === "npc"
		&& !Player.IsFullyOwned()
		&& !!CurrentCharacter
		&& CurrentTime < CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "EndSubTrial")
		&& NPCEventGet(CurrentCharacter, "EndSubTrial") > 0;
}
/**
 * Checks if the trial period is over and the character likes the player enough.
 * @returns {boolean} - TRUE if the trial period is over and the character loves the player enough.
 */
function PrivateTrialDoneEnoughLove() {
	return Player.IsOwned() === "npc"
		&& !Player.IsFullyOwned()
		&& !!CurrentCharacter
		&& CurrentTime >= CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "EndSubTrial")
		&& NPCEventGet(CurrentCharacter, "EndSubTrial") > 0
		&& (CurrentCharacter.Love ?? 0) >= 90;
}
/**
 * Checks if the trial period is over, but the character does not like the player enough.
 * @returns {boolean} - TRUE if the trial period is over, but the character does not like the player enough.
 */
function PrivateTrialDoneNotEnoughLove() {
	return Player.IsOwned() === "npc"
		&& !Player.IsFullyOwned()
		&& !!CurrentCharacter
		&& CurrentTime >= CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "EndSubTrial")
		&& NPCEventGet(CurrentCharacter, "EndSubTrial") > 0
		&& (CurrentCharacter.Love ?? 0) < 90;
}
/**
 * Checks if the player can cancel an active trial with the current NPC.
 * @returns {boolean} - TRUE if the player can cancel the trial.
 */
function PrivateTrialCanCancel() { return Player.IsOwned() === "npc" && !Player.IsFullyOwned() && !!CurrentCharacter && NPCEventGet(CurrentCharacter, "EndSubTrial") > 0; }
/**
 * Checks if the current NPC will forgive the player for refusing to play.
 * @returns {boolean} - TRUE if the NPC forgives the player.
 */
function PrivateWillForgive() { return !!CurrentCharacter && NPCEventGet(CurrentCharacter, "RefusedActivity") < CurrentTime - MS_PER_MIN; }
/**
 * Checks if the player can ask to be uncollared.
 * @returns {boolean} - TRUE if the NPC will allow the player to be uncollared.
 */
function PrivateCanAskUncollar() {
	return (DialogIsOwner()
		&& !!CurrentCharacter
		&& NPCEventGet(CurrentCharacter, "PlayerCollaring") > 0
		&& CurrentTime >= CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "PlayerCollaring") + NPCLongEventDelay(CurrentCharacter));
}
/**
 * Checks if the player cannot ask to be uncollared.
 * @returns {boolean} - TRUE if the player cannot ask to be uncollared.
 */
function PrivateCannotAskUncollar() {
	return DialogIsOwner()
		&& !!CurrentCharacter
		&& NPCEventGet(CurrentCharacter, "PlayerCollaring") > 0
		&& CurrentTime < CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "PlayerCollaring") + NPCLongEventDelay(CurrentCharacter);
}
/**
 * Checks if the current character is a mistress.
 * @returns {boolean} - TRUE if the NPC is a club mistress.
 */
function PrivateIsMistress() { return CurrentCharacter?.Title === "Mistress"; }
/**
 * Checks if the NPC is willing to take the player as her owner.
 * @returns {boolean} - TRUE if the player can own the NPC
 */
function PrivateWouldTakePlayerAsDom() {
	return !Player.IsKneeling()
		&& !Player.IsRestrained()
		&& !!CurrentCharacter
		&& !CurrentCharacter.IsRestrained()
		&& !CurrentCharacter.IsOwned()
		&& NPCTraitGet(CurrentCharacter, "Dominant") <= 50
		&& (CurrentCharacter.Love ?? 0) >= 50
		&& ReputationGet("Dominant") - 50 >= NPCTraitGet(CurrentCharacter, "Dominant")
		&& CurrentTime >= CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "PrivateRoomEntry") + NPCLongEventDelay(CurrentCharacter);
}
/**
 * Checks if the NPC is not willing to take the player as her owner
 * @returns {boolean} - TRUE if the player cannot own the NPC
 */
function PrivateWontTakePlayerAsDom() {
	return !Player.IsKneeling()
		&& !Player.IsRestrained()
		&& !!CurrentCharacter
		&& !CurrentCharacter.IsRestrained()
		&& !CurrentCharacter.IsOwned()
		&& NPCTraitGet(CurrentCharacter, "Dominant") <= 50
		&& ((CurrentCharacter.Love ?? 0) < 50
			|| ReputationGet("Dominant") - 50 < NPCTraitGet(CurrentCharacter, "Dominant"));
}
/**
 * Checks if the NPC is willing to be own, but the waiting period is not over.
 * @returns {boolean} - TRUE if the NPC can be own, but more time is needed.
 */
function PrivateNeedTimeToTakePlayerAsDom() {
	return !Player.IsKneeling()
		&& !Player.IsRestrained()
		&& !!CurrentCharacter
		&& !CurrentCharacter.IsRestrained()
		&& !CurrentCharacter.IsOwned()
		&& NPCTraitGet(CurrentCharacter, "Dominant") <= 50
		&& (CurrentCharacter.Love ?? 0) >= 50
		&& ReputationGet("Dominant") - 50 >= NPCTraitGet(CurrentCharacter, "Dominant")
		&& CurrentTime < CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "PrivateRoomEntry") + NPCLongEventDelay(CurrentCharacter);
}
/**
 * Checks if the NPC would never take the player as an owner
 * @returns {boolean} - TRUE if the character has a dominant reputation above 50
 */
function PrivateNeverTakePlayerAsDom() { return !!CurrentCharacter && !CurrentCharacter.IsRestrained() && NPCTraitGet(CurrentCharacter, "Dominant") > 50; }
/**
 * Checks if the NPC is happy.
 * @returns {boolean} - TRUE if the love value is above 30.
 */
function PrivateIsHappy() { return !!CurrentCharacter && (CurrentCharacter.Love ?? 0) > 30; }
/**
 * Checks if the NPC is unhappy
 * @returns {boolean} - TRUE if the love value is below -30.
 */
function PrivateIsUnhappy() { return !!CurrentCharacter && (CurrentCharacter.Love ?? 0) < -30; }
/**
 * Checks if the NPC is in a neutral mood.
 * @returns {boolean} - TRUE if the love value is between -30 and 30
 */
function PrivateIsNeutral() { return !!CurrentCharacter && (CurrentCharacter.Love ?? 0) >= -30 && (CurrentCharacter.Love ?? 0) <= 30; }
/**
 * Checks if the lover NPC is happy.
 * @returns {boolean} - TRUE if the NPC is a lover and the love value is above 30
 */
function PrivateIsLoverHappy() { return !!CurrentCharacter && (CurrentCharacter.Love ?? 0) > 30 && CurrentCharacter.IsLoverOfPlayer(); }
/**
 * Checks if the lover NPC is unhappy.
 * @returns {boolean} - TRUE if the NPC is a lover and the love value is below -30
 */
function PrivateIsLoverUnhappy() { return !!CurrentCharacter && (CurrentCharacter.Love ?? 0) < -30 && CurrentCharacter.IsLoverOfPlayer(); }
/**
 * Checks if the lover NPC is in a neutral mood.
 * @returns {boolean} - TRUE if the NPC is a lover and the love value is between -30 and 30
 */
function PrivateIsLoverNeutral() {
	return !!CurrentCharacter
		&& (CurrentCharacter.Love ?? 0) >= -30
		&& (CurrentCharacter.Love ?? 0) <= 30
		&& CurrentCharacter.IsLoverOfPlayer();
}
/**
 * Checks if the sub trial for the NPC is over.
 * @returns {boolean} - TRUE if the trial period is over.
 */
function PrivateSubTrialInProgress() {
	return !!CurrentCharacter
		&& NPCEventGet(CurrentCharacter, "EndDomTrial") > 0
		&& (CurrentTime < CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "EndDomTrial"));
}
/**
 * Checks if the NPC is willing to be fully collared after the trial.
 * @returns {boolean} - TRUE if the NPC is willing to be fully collared after the trial.
 */
function PrivateSubTrialOverWilling() {
	return !!CurrentCharacter
		&& NPCEventGet(CurrentCharacter, "EndDomTrial") > 0
		&& CurrentTime >= CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "EndDomTrial")
		&& (CurrentCharacter.Love ?? 0) >= 90;
}
/**
 * Checks if the NPC is not willing to be fully collared after the trial.
 * @returns {boolean} - TRUE if the NPC is not willing to be fully collared after the trial.
 */
function PrivateSubTrialOverUnwilling() {
	return !!CurrentCharacter
		&& NPCEventGet(CurrentCharacter, "EndDomTrial") > 0
		&& CurrentTime >= CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "EndDomTrial")
		&& (CurrentCharacter.Love ?? 0) < 90;
}
/**
 * Checks if the player can be pet by a NPC.
 * @returns {boolean} - TRUE if the player is restrained by a petsuit and the NPC is free.
 */
function PrivateCanPet() {
	return !!CurrentCharacter
		&& (CurrentCharacter.Love ?? 0) >= 0
		&& !CurrentCharacter.IsRestrained()
		&& CharacterHasItemWithAttribute(Player, "PetSuit");
}
/**
 * Checks if the player can sell her slave.
 * @returns {boolean} - TRUE if the player is free and the slave is not a bondage college NPC.
 */
function PrivateCanSellSlave() {
	return !Player.IsRestrained()
		&& !!CurrentCharacter
		&& (CurrentCharacter.Love ?? 0) >= 0
		&& !PrivateCollegeNPCNames.includes(CurrentCharacter.Name)
		&& CurrentCharacter.Name !== "Sophie"
		&& NPCEventGet(CurrentCharacter, "NPCCollaring") > 0;
}
/**
 * Checks if the player cannot sell her slave.
 * @returns {boolean} - TRUE if the player is free and the slave is not a bondage college NPC, but the current love value is negative.
 */
function PrivateCannotSellSlave() {
	return !Player.IsRestrained()
		&& !!CurrentCharacter
		&& (CurrentCharacter.Love ?? 0) < 0
		&& !PrivateCollegeNPCNames.includes(CurrentCharacter.Name)
		&& CurrentCharacter.Name !== "Sophie"
		&& (NPCEventGet(CurrentCharacter, "NPCCollaring") > 0);
}
/**
 * Checks if the player can get the college outfit.
 * @returns {boolean} - TRUE if the player does not have the college outfit and the current NPC is a bondage college NPC.
 */
function PrivateCanGetCollegeClothes() {
	return !!CurrentCharacter
		&& !(InventoryAvailable(Player, "CollegeOutfit1", "Cloth") && InventoryAvailable(Player, "CollegeSkirt", "ClothLower"))
		&& PrivateCollegeNPCNames.includes(CurrentCharacter.Name);
}
/**
 * Checks if the current NPC is a lover of the player.
 * @returns {boolean} - TRUE if the NPC is a lover of the player.
 */
function PrivateIsLover() { return !!CurrentCharacter && CurrentCharacter.IsLoverOfPlayer(); }
/**
 * Checks if the current NPC is a lover of the player and currently on the Fiancée stage.
 * @returns {boolean} - TRUE if the NPC is a fiancee for the player.
 */
function PrivateIsFiancee() {
	return !!CurrentCharacter
		&& CurrentCharacter.IsLoverOfPlayer()
		&& NPCEventGet(CurrentCharacter, "Fiancee") > 0
		&& NPCEventGet(CurrentCharacter, "Wife") <= 0;
}
/**
 * Checks if the current NPC is a lover of the player and currently on the Wife stage.
 * @returns {boolean} - TRUE if the NPC is a wife for the player.
 */
function PrivateIsWife() { return !!CurrentCharacter && CurrentCharacter.IsLoverOfPlayer() && NPCEventGet(CurrentCharacter, "Wife") > 0; }
/**
 * Checks if the NPC will take the player as a lover.
 * @returns {boolean} - TRUE if the player can have one more lover, the NPC loves the player enough and the event delay has expired.
 */
function PrivateWillTakePlayerAsLover() {
	return !!CurrentCharacter
		&& (CurrentCharacter.Lover == null || CurrentCharacter.Lover == "")
		&& Player.Lovership.length < 5
		&& (CurrentCharacter.Love ?? 0) >= 50
		&& CurrentTime >= CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "PrivateRoomEntry") + NPCLongLoverEventDelay(CurrentCharacter);
}
/**
 * Checks if the NPC will not take the player as a lover.
 * @returns {boolean} - TRUE if the player cannot have one more lover, the NPC does not love the player enough, or the event delay has not expired yet.
 */
function PrivateWontTakePlayerAsLover() {
	return !!CurrentCharacter
		&& (CurrentCharacter.Lover == null || CurrentCharacter.Lover == "")
		&& Player.Lovership.length < 5
		&& ((CurrentCharacter.Love ?? 0) < 50
			|| (CurrentTime < CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "PrivateRoomEntry") + NPCLongLoverEventDelay(CurrentCharacter)));
}
/**
 * Checks if the NPC will not take the player as a lover because she is already dating someone.
 * @returns {boolean} - TRUE if the NPC is already dating something.
 */
function PrivateWontTakePlayerAsLoverAlreadyDating() {
	return !!CurrentCharacter
		&& CurrentCharacter.Lover != null
		&& CurrentCharacter.Lover != ""
		&& CurrentCharacter.Lover != Player.Name
		&& Player.Lovership.length < 5;
}
/**
 * Checks if the NPC will not take the player as a lover because the player reached the lover limit.
 * @returns {boolean} - TRUE if the NPC is free, but the player has 5 lovers.
 */
function PrivateWontTakePlayerAsLoverPlayerDating() {
	return !!CurrentCharacter
		&& (CurrentCharacter.Lover == null || CurrentCharacter.Lover == "")
		&& (Player.Lovership.length >= 5);
}
/**
 * Checks if the NPC will upgrade her lovership from girlfriend to fiancée
 * @returns {boolean} - TRUE if the NPC is already a girlfriend, her love is at least 70 and enough time has gone by
 */
function PrivateWillTakePlayerAsFiancee() {
	return !!CurrentCharacter
		&& CurrentCharacter.IsLoverOfPlayer()
		&& NPCEventGet(CurrentCharacter, "Girlfriend") > 0
		&& NPCEventGet(CurrentCharacter, "Fiancee") <= 0
		&& (CurrentCharacter.Love ?? 0) >= 70
		&& CurrentTime >= CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "Girlfriend") + NPCLongLoverEventDelay(CurrentCharacter);
}
/**
 * Checks if the NPC will not upgrade her lovership from girlfriend to fiancée
 * @returns {boolean} - TRUE if the NPC is already a girlfriend, her love is below 70 or not enough time has gone by
 */
function PrivateWontTakePlayerAsFiancee() {
	return !!CurrentCharacter
		&& CurrentCharacter.IsLoverOfPlayer()
			&& NPCEventGet(CurrentCharacter, "Girlfriend") > 0
			&& NPCEventGet(CurrentCharacter, "Fiancee") <= 0
			&& ((CurrentCharacter.Love ?? 0) < 70
				|| CurrentTime < CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "Girlfriend") + NPCLongLoverEventDelay(CurrentCharacter));
}
/**
 * Checks if the NPC will upgrade her lovership from fiancée to wife
 * @returns {boolean} - TRUE if the NPC is already a fiancée, her love is at least 90 and enough time has gone by
 */
function PrivateWillTakePlayerAsWife() {
	return !!CurrentCharacter
		&& CurrentCharacter.IsLoverOfPlayer()
		&& NPCEventGet(CurrentCharacter, "Fiancee") > 0
		&& NPCEventGet(CurrentCharacter, "Wife") <= 0
		&& (CurrentCharacter.Love ?? 0) >= 90
		&& CurrentTime >= CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "Fiancee") + NPCLongLoverEventDelay(CurrentCharacter);
}
/**
 * Checks if the NPC will not upgrade her lovership from fiancée to wife
 * @returns {boolean} - TRUE if the NPC is already a fiancée, her love is below 90 or not enough time has gone by
 */
function PrivateWontTakePlayerAsWife() {
	return !!CurrentCharacter
		&& CurrentCharacter.IsLoverOfPlayer()
		&& NPCEventGet(CurrentCharacter, "Fiancee") > 0
		&& NPCEventGet(CurrentCharacter, "Wife") <= 0
		&& ((CurrentCharacter.Love ?? 0) < 90
			|| CurrentTime < CheatFactor("SkipTrialPeriod", 0) * NPCEventGet(CurrentCharacter, "Fiancee") + NPCLongLoverEventDelay(CurrentCharacter));
}
/**
 * Checks if it's possible for the player to turn the tables against her NPC owner
 * @returns {boolean} - TRUE if turning the tables is possible
 */
function PrivatePlayerCanTurnTables() {
	return !Player.IsRestrained()
		&& !!CurrentCharacter
		&& ReputationGet("Dominant") - 50 >= NPCTraitGet(CurrentCharacter, "Dominant")
		&& NPCEventGet(CurrentCharacter, "PlayerCollaring") > 0;
}
/**
 * Checks if it's possible for the submissive to turn the tables against her player owner
 * @returns {boolean} - TRUE if turning the tables is possible
 */
function PrivateSubCanTurnTables() {
	return !Player.IsRestrained()
		&& !!CurrentCharacter
		&& !CurrentCharacter.IsRestrained()
		&& !Player.IsOwned()
		&& !PrivateOwnerInRoom()
		&& ReputationGet("Dominant") + 50 <= NPCTraitGet(CurrentCharacter, "Dominant")
		&& NPCEventGet(CurrentCharacter, "NPCCollaring") > 0;
}
/**
 * Checks if it's possible to use cheats on an NPC
 * @returns {boolean} - TRUE if we allow NPC cheats
 */
function PrivateNPCAllowCheat() { return CheatFactor("ChangeNPCTrait", 0) == 0; }
/**
 * Checks if the character comes from Pandora's Box and she has a negative opinion of the player
 * @returns {boolean} - TRUE if the character is from Pandora's Box and has a negative opinion
 */
function PrivateIsFromPandoraNegative() {
	return !!CurrentCharacter
		&& !!CurrentCharacter.FromPandora
		&& (CurrentCharacter.Love ?? 0) <= -40
		&& !CurrentCharacter.IsLoverOfPlayer();
}
/**
 * Checks if the character comes from Pandora's Box and she has a neutral opinion of the player
 * @returns {boolean} - TRUE if the character is from Pandora's Box and has a neutral opinion
 */
function PrivateIsFromPandoraNeutral() {
	return !!CurrentCharacter
		&& !!CurrentCharacter.FromPandora
		&& (CurrentCharacter.Love ?? 0) > -40
		&& (CurrentCharacter.Love ?? 0) < 40
		&& !CurrentCharacter.IsLoverOfPlayer();
}
/**
 * Checks if the character comes from Pandora's Box and she has a positive opinion of the player
 * @returns {boolean} - TRUE if the character is from Pandora's Box and has a positive opinion
 */
function PrivateIsFromPandoraPositive() {
	return !!CurrentCharacter
		&& !!CurrentCharacter.FromPandora
		&& (CurrentCharacter.Love ?? 0) >= 40
		&& !CurrentCharacter.IsLoverOfPlayer();
}
/**
 * Checks if the private character has a specific title
 * @param {string} Title
 * @returns {boolean} - TRUE if the character has the title in the parameter
 */
function PrivateTitleIs(Title) { return !!CurrentCharacter && CurrentCharacter.Title === Title; }
/**
 * Returns TRUE if it's the player birthday of at least 1 year (based on same month and day, different year)
 * @returns {boolean} - TRUE if it's the birthday
 */
function PrivateIsPlayerBirthday() {
	return Player.IsBirthday();
}
/**
 * Returns TRUE if the private room friend will join the player in bed, love must be positive and higher than frigid trait
 * @returns {boolean} - TRUE if she will join
 */
function PrivateWillJoinBed() {
	return PrivateBedActive()
		&& PrivateBedCount() <= 3
		&& !!CurrentCharacter
		&& !Player.IsGagged()
		&& !CurrentCharacter.IsGagged()
		&& !CurrentCharacter.PrivateBed
		&& NPCTraitGet(CurrentCharacter, "Frigid") <= (CurrentCharacter.Love ?? 0)
		&& (NPCEventGet(CurrentCharacter, "NextBed") < CurrentTime);
}
/**
 * Returns TRUE if the private room friend will not join the player in bed, love must be positive and higher than frigid trait
 * @returns {boolean} - TRUE if she will not join
 */
function PrivateWillNotJoinBed() {
	return PrivateBedActive()
		&& PrivateBedCount() <= 3
		&& !!CurrentCharacter
		&& !Player.IsGagged()
		&& !CurrentCharacter.IsGagged()
		&& !CurrentCharacter.PrivateBed
		&& (
			NPCTraitGet(CurrentCharacter, "Frigid") > (CurrentCharacter.Love ?? 0)
			|| NPCEventGet(CurrentCharacter, "NextBed") >= CurrentTime
		);
}
/**
 * Returns TRUE if the private room friend will join the player in bed, love must be positive and higher than frigid trait (gagged version)
 * @returns {boolean} - TRUE if she will join
 */
function PrivateWillJoinBedGag() {
	return PrivateBedActive()
		&& PrivateBedCount() <= 3
		&& !!CurrentCharacter
		&& (Player.IsGagged() || CurrentCharacter.IsGagged())
		&& !CurrentCharacter.PrivateBed
		&& NPCTraitGet(CurrentCharacter, "Frigid") <= (CurrentCharacter.Love ?? 0)
		&& NPCEventGet(CurrentCharacter, "NextBed") < CurrentTime;
}
/**
 * Returns TRUE if the private room friend will not join the player in bed, love must be positive and higher than frigid trait (gagged version)
 * @returns {boolean} - TRUE if she will not join
 */
function PrivateWillNotJoinBedGag() {
	return PrivateBedActive()
		&& PrivateBedCount() <= 3
		&& !!CurrentCharacter
		&& (Player.IsGagged() || CurrentCharacter.IsGagged())
		&& !CurrentCharacter.PrivateBed
		&& (
			NPCTraitGet(CurrentCharacter, "Frigid") > (CurrentCharacter.Love ?? 0)
			|| NPCEventGet(CurrentCharacter, "NextBed") >= CurrentTime
		);
}
/**
 * Returns TRUE if the both players can play club cards (no restraints or gag)
 * @returns {boolean} - TRUE if both parties can play
 */
function PrivateCanPlayClubCard() {
	return !!CurrentCharacter
		&& Player.CanTalk()
		&& CurrentCharacter.CanTalk()
		&& Player.CanInteract()
		&& CurrentCharacter.CanInteract()
		&& !Player.Cage
		&& !CurrentCharacter.Cage;
}
/**
 * Returns TRUE if the club card victory mode is active
 * @returns {boolean} - TRUE if active
 */
function PrivateClubCardVictoryModeActive() {
	return PrivateClubCardVictoryMode;
}
/**
 * Returns true if the Player can talk and the friend can interact
 * @returns {boolean} - True if Player can ask and the friend can interact
 */
function PrivateCanAskforAction() {
	return !!CurrentCharacter && Player.CanTalk() && CurrentCharacter.CanInteract();
}
/**
 * Returns true if the Player can talk but the friend can not interact
 * @returns {boolean} - True if Player can ask and the friend can not interact
 */
function PrivateCannotAskforAction() {
	return !!CurrentCharacter && Player.CanTalk() && !CurrentCharacter.CanInteract();
}
/**
 * Returns true if the Player can not talk and the friend can interact
 * @returns {boolean} - True if Player can not ask and the friend can interact
 */
function PrivateCanTryforAction() {
	return !!CurrentCharacter && !Player.CanTalk() && CurrentCharacter.CanInteract();
}
/**
 * Returns true if the Player can not talk and the friend can not interact
 * @returns {boolean} - True if Player can not ask and the friend can not interact
 */
function PrivateCannotTryforAction() {
	return !!CurrentCharacter && !Player.CanTalk() && !CurrentCharacter.CanInteract();
}
/**
 * Returns TRUE if the current character is an anime girl / superheroine
 * @returns {boolean} - TRUE if archetype is AnimeGirl
 */
function PrivateIsAnimeGirl() {
	return !!CurrentCharacter && CurrentCharacter.Title === "AnimeGirl";
}
/**
 * Returns TRUE if the current character is a rope bunny
 * @returns {boolean} - TRUE if archetype is Bunny
 */
function PrivateIsBunny() {
	return !!CurrentCharacter && CurrentCharacter.Title === "Bunny";
}
/**
 * Returns TRUE if the current character is a succubus
 * @returns {boolean} - TRUE if archetype is succubus
 */
function PrivateIsSuccubus() {
	return !!CurrentCharacter && CurrentCharacter.Title === "Succubus";
}

/**
 * Returns a random item that could be bought from the store as a gift that the player could receive by a NPC
 * @param {boolean} Restraint - TRUE if we must return an item that's a restraint
 * @returns {Asset|null} - The item asset that can be given
 */
function PrivateGetPossibleGift(Restraint) {

	// Builds the item list
	let InvList = [];
	for (let A of Asset) {
		if ((A.Value > 0) && A.Random && ((A.Gender == null) || (A.Gender == "F")) && !InventoryAvailable(Player, A.Name, A.Group.Name) && !InventoryIsPermissionBlocked(Player, A.Name, A.Group.Name) && !InventoryIsPermissionLimited(Player, A.Name, A.Group.Name))
			if ((Restraint && A.Group.Name.startsWith("Item")) || (!Restraint && !A.Group.Name.startsWith("Item")))
				InvList.push({...A});
	}

	// Returns an item at random or NULL if nothing is possible
	if (InvList.length <= 0)
		return null;
	else
		return CommonRandomItemFromList(null, InvList);

}

/**
 * Loads the private room screen and the vendor NPC.
 * @type {ScreenLoadHandler}
 */
async function PrivateLoad() {
	PrivateBackground = Player.VisualSettings.PrivateRoomBackground ?? "Private";

	// Loads the vendor and NPCs, also check for relationship decay
	if (!PrivateVendor) {
		PrivateVendor = CharacterLoadNPC("NPC_Private_Vendor");
		PrivateVendor.AllowItem = false;
		NPCTraitDialog(PrivateVendor);
	}

	Player.ArousalSettings.OrgasmCount = 0;

	let MustSync = false;
	MustSync = PrivateRelationDecay();
	if (PrivateEntryEvent) MustSync = (MustSync || PrivateRansomStart());
	if (MustSync) ServerPrivateCharacterSync();

	// There's a 20% odds that the owner will interecpt the player as soon as she enters the room
	if ((Math.random() < 0.2) && PrivateEntryEvent && Player.IsOwned() && !LogQuery("OwnerBeepActive", "PrivateRoom")) {
		const npcOwner = PrivateCharacter.find(c => c.IsOwner());
		if (npcOwner) {
			PoseSetActive(Player, "Kneel", true);
			NPCTraitDialog(npcOwner);
			npcOwner.CurrentDialog = DialogFind(npcOwner, "1060");
			npcOwner.Stage = "1061";
			CharacterSetCurrent(npcOwner);
		}
	}

	// NPCs can change clothes everyday
	for (let C = 1; C < PrivateCharacter.length; C++)
		PrivateNewCloth(PrivateCharacter[C]);

	// Horny NPCs will randomly be in the character bed when the player enters
	PrivateRandomBed();
	PrivateEntryEvent = false;

	// Prepares the possible NPC gifts
	PrivateGiftReset();

}

/**
 * NPCs can change clothes randomly everyday
 * @param {Character} C - The NPC to change
 * @returns {void} - Nothing.
 */
function PrivateNewCloth(C) {

	// Validates and exits if needed
	if (!C.CanInteract()) return; // No changing if bound
	if (C.Cage) return; // No changing if caged
	if (NPCEventGet(C, "PrivateRoomEntry") + MS_PER_DAY > CurrentTime) return; // No changing on first day
	if (NPCEventGet(C, "NewCloth") + MS_PER_DAY > CurrentTime) return; // No chaning if changed in last 24 hours
	if (C.IsOwnedByPlayer()) return; // No changing if owned

	// Strips the character
	CharacterNaked(C);

	// Some quest characters have presets clothes, if not, it's full random
	if (C.Name == "Sarah") {
		InventoryWear(C, "CollegeOutfit1", "Cloth");
		InventoryWear(C, "CollegeSkirt", "ClothLower");
		InventoryWear(C, "Socks4", "Socks", "#AAAAAA");
		InventoryWear(C, "Shoes2", "Shoes", "#222222");
		InventoryWear(C, "Bra2", "Bra", "#a02424");
		InventoryWear(C, "Panties7", "Panties", "#a02424");
	} else if (C.Name == "Amanda") {
		InventoryWear(C, "CollegeOutfit1", "Cloth");
		InventoryWear(C, "CollegeSkirt", "ClothLower");
		InventoryWear(C, "Socks4", "Socks", "#AAAAAA");
		InventoryWear(C, "Shoes1", "Shoes", "#222222");
		InventoryWear(C, "Bra1", "Bra", "#bbbbbb");
		InventoryWear(C, "Panties1", "Panties", "#bbbbbb");
	} else if (C.Name == "Sidney") {
		InventoryWear(C, "CollegeOutfit1", "Cloth");
		InventoryWear(C, "CollegeSkirt", "ClothLower");
		InventoryWear(C, "Socks4", "Socks", "#AAAAAA");
		InventoryWear(C, "Bandeau1", "Bra", "#222222");
		InventoryWear(C, "StringPanties1", "Panties", "#222222");
		InventoryWear(C, "Boots1", "Shoes", "#222222");
	} else if (C.Name == "Jennifer") {
		if (Math.random() > 0.5) {
			InventoryWear(C, "CollegeOutfit1", "Cloth");
			InventoryWear(C, "CollegeSkirt", "ClothLower");
		} else {
			InventoryWear(C, "TennisShirt1", "Cloth", "Default");
			InventoryWear(C, "TennisSkirt1", "ClothLower", "Default");
		}
		InventoryWear(C, "Socks1", "Socks", "#CCCCCC");
		InventoryWear(C, "Sneakers1", "Shoes", "Default");
		InventoryWear(C, "Bra1", "Bra", "#CCCCCC");
		InventoryWear(C, "Panties1", "Panties", "#CCCCCC");
		InventoryWear(C, "Glasses1", "Glasses", "Default");
	} else if (C.Name == "Sophie") {
		InventoryWear(C, "Stockings4", "Socks", "#222222");
		InventoryWear(C, "Corset3", "Bra", "#222222");
		InventoryWear(C, "Panties13", "Panties", "#222222");
		InventoryWear(C, "Glasses5", "Glasses", "#222222");
		CharacterArchetypeClothes(C, "Mistress", "#222222");
	} else if (C.Name == "Mildred") {
		CollegeTeacherMildredClothes(C);
	} else if (C.Name == "Yuki") {
		CollegeDetentionYukiClothes(C);
	} else if (C.Name == "Julia") {
		CollegeTheaterJuliaClothes(C);
	} else if (C.Title === "Mistress") {
		CharacterRandomUnderwear(C);
		CharacterArchetypeClothes(C, "Mistress");
	} else if (C.Title === "Maid") {
		CharacterRandomUnderwear(C);
		CharacterArchetypeClothes(C, "Maid");
	} else if (C.Title === "AnimeGirl") {
		CharacterArchetypeClothes(C, "AnimeGirl");
	} else if (C.Title === "Bunny") {
		CharacterArchetypeClothes(C, "Bunny");
		if (C.CanWalk() && C.CanTalk() && C.CanInteract() && !C.Cage) ShibariRandomBondage(C, Math.floor((Math.random() * 4) + 1));
	} else if (C.Title === "Succubus") {
		CharacterArchetypeClothes(C, "Succubus");
	} else if (C.Title === "Dominatrix") {
		PandoraDress(C, "Mistress");
	} else CharacterAppearanceFullRandom(C, true);

	// Birthday Hat
	if (PrivateIsPlayerBirthday() && (InventoryGet(C, "Hat") == null))
		InventoryWear(C, "CollegeDunce", "Hat", CommonRandomItemFromList(null, ["#FF0000", "#FFFF00", "#FF00FF", "#00FF00", "#00FFFF", "#0000FF"]));

	// Random December hats (25% odds)
	if ((new Date().getMonth() == 11) && (Math.random() < 0.25) && (InventoryGet(C, "Hat") == null))
		InventoryWear(C, CommonRandomItemFromList("", ["Santa1", "ReindeerBand"]), "Hat");

	// Wedding / engagement rings
	if (NPCEventGet(C, "Wife") > 0) PrivateWearRing(C, "#B0B0B0");
	else if (NPCEventGet(C, "Fiancee") > 0) PrivateWearRing(C, "#D0D000");

	// Add the new cloth event and syncs
	NPCEventAdd(C, "NewCloth", CurrentTime);
	ServerPrivateCharacterSync();

}

/**
 * Draws all the characters in the private room.
 * @returns {void} - Nothing.
 */
function PrivateDrawCharacter() {

	// Defines the character position in the private screen
	var X = 1000 - ((PrivateCharacter.length - PrivateCharacterOffset) * 250);
	if (X < 0) X = 0;

	// For each character to draw (maximum 4 at a time)
	for (let C = PrivateCharacterOffset; (C < PrivateCharacter.length && C < PrivateCharacterOffset + 4); C++) {

		// Make sure the NPC is not already in bed
		if (!PrivateCharacter[C].PrivateBed) {

			// If the character is rent, she won't show in the room but her slot is still taken
			if (NPCEventGet(PrivateCharacter[C], "SlaveMarketRent") <= CurrentTime) {

				// If the character is sent to the asylum, she won't show in the room but her slot is still taken
				if (NPCEventGet(PrivateCharacter[C], "AsylumSent") <= CurrentTime) {

					// If the character is being brainwashed by the Infiltration team, she wont' show in the room but her slot is still taken
					if (NPCEventGet(PrivateCharacter[C], "NPCBrainwashing") <= CurrentTime) {
						// If the character is kidnapped by Pandora's Box, a ransom note will be shown
						if (NPCEventGet(PrivateCharacter[C], "Kidnap") <= CurrentTime) {

							// Draw the NPC and the cage if needed
							if (PrivateCharacter[C].Cage) DrawImage("Screens/Room/Private/CageBack.png", X + (C - PrivateCharacterOffset) * 470, 0);
							DrawCharacter(PrivateCharacter[C], X + (C - PrivateCharacterOffset) * 470, 0, 1);
							if (PrivateCharacter[C].Cage) DrawImage("Screens/Room/Private/CageFront.png", X + (C - PrivateCharacterOffset) * 470, 0);
							if (LogQuery("Cage", "PrivateRoom") && !LogQuery("BlockCage", "Rule"))
								if ((!Player.Cage) || (C == 0))
									if (!PrivateCharacter[C].IsOwner())
										DrawButton(X + 205 + (C - PrivateCharacterOffset) * 470, 900, 90, 90, "", "White", "Icons/Cage.png");

						} else DrawImage("Screens/Room/PrivateRansom/RansomNote.png", X + 160 + (C - PrivateCharacterOffset) * 470, 375);
					} else {

						// Draw the "X being interrogated" text
						DrawText(PrivateCharacter[C].Name, X + 235 + (C - PrivateCharacterOffset) * 470, 420, "White", "Black");
						DrawText(TextGet("Brainwash3Day"), X + 235 + (C - PrivateCharacterOffset) * 470, 500, "White", "Black");

					}
				} else {

					// Draw the "X in the asylum for a day" text
					DrawText(PrivateCharacter[C].Name, X + 235 + (C - PrivateCharacterOffset) * 470, 420, "White", "Black");
					DrawText(TextGet("AsylumDay"), X + 235 + (C - PrivateCharacterOffset) * 470, 500, "White", "Black");

				}

			} else {

				// Draw the "X on rental for a day" text
				DrawText(PrivateCharacter[C].Name, X + 235 + (C - PrivateCharacterOffset) * 470, 420, "White", "Black");
				DrawText(TextGet("RentalDay"), X + 235 + (C - PrivateCharacterOffset) * 470, 500, "White", "Black");

			}

		} else {

			// Draw the "X on rental for a day" text
			DrawText(PrivateCharacter[C].Name, X + 235 + (C - PrivateCharacterOffset) * 470, 420, "White", "Black");
			DrawText(TextGet("InBed"), X + 235 + (C - PrivateCharacterOffset) * 470, 500, "White", "Black");
			DrawButton(X + 205 + (C - PrivateCharacterOffset) * 470, 900, 90, 90, "", "White", "Icons/Bed.png");

		}

		// Draw the profile and switch position buttons
		DrawButton(X + 85 + (C - PrivateCharacterOffset) * 470, 900, 90, 90, "", "White", "Icons/Character.png");
		if ((C > 0) && (C < PrivateCharacter.length - 1)) DrawButton(X + 325 + (C - PrivateCharacterOffset) * 470, 900, 90, 90, "", "White", "Icons/Next.png");

	}

}

/**
 * Runs the top Y position for a button
 * @param {number} Position - The button position from 0 to 8
 * @returns {number} - The Y position
 */
function PrivateButtonTop(Position) {
	return 20 + (Position * 110);
}

/**
 * Runs the private room screen.
 * @returns {void} - Nothing.
 */
function PrivateRun() {

	// The vendor is only shown if the room isn't rent
	if (LogQuery("RentRoom", "PrivateRoom")) {
		PrivateDrawCharacter();
		if ((!Player.Cage) && Player.CanWalk()) DrawButton(1885, PrivateButtonTop(2), 90, 90, "", "White", "Icons/Shop.png", TextGet("Shop"));
		if (Player.CanChangeOwnClothes()) DrawButton(1885, PrivateButtonTop(3), 90, 90, "", "White", "Icons/Dress.png", TextGet("Dress"));
		if (LogQuery("Wardrobe", "PrivateRoom") && Player.CanChangeOwnClothes()) DrawButton(1885, PrivateButtonTop(4), 90, 90, "", "White", "Icons/Wardrobe.png", TextGet("Wardrobe"));
		if (PrivateBedActive() && (!Player.Cage)) DrawButton(1885, PrivateButtonTop(5), 90, 90, "", "White", "Icons/Bed.png", TextGet("Bed"));
		if (LogQuery("Expansion", "PrivateRoom")) DrawButton(1885, PrivateButtonTop(6), 90, 90, "", "White", "Icons/Next.png", TextGet("Next"));
	} else {
		DrawCharacter(Player, 500, 0, 1);
		DrawCharacter(PrivateVendor, 1000, 0, 1);
	}

	// Standard buttons
	if (Player.CanWalk() && (!Player.Cage)) DrawButton(1885, PrivateButtonTop(0), 90, 90, "", "White", "Icons/Exit.png", TextGet("Exit"));
	if (LogQuery("RentRoom", "PrivateRoom")) {
		if (Player.CanKneel()) DrawButton(1885, PrivateButtonTop(1), 90, 90, "", "White", "Icons/Kneel.png", TextGet("Kneel"));
		DrawButton(1885, PrivateButtonTop(7), 90, 90, "", "White", "Icons/CollegeBackground.png", TextGet("MainHallBackground"));
		DrawButton(1885, PrivateButtonTop(8), 90, 90, "", "White", "Icons/BedroomBackground.png", TextGet("PrivateRoomBackground"));
	}

	// In orgasm mode, we add a pink filter and different controls depending on the stage
	if ((Player.ArousalSettings != null) && (Player.ArousalSettings.Active != null) && (Player.ArousalSettings.Active != "Inactive") && (Player.ArousalSettings.Active != "NoMeter")) {
		if ((Player.ArousalSettings.OrgasmTimer != null) && (typeof Player.ArousalSettings.OrgasmTimer === "number") && !isNaN(Player.ArousalSettings.OrgasmTimer) && (Player.ArousalSettings.OrgasmTimer > 0)) {
			DrawRect(0, 0, 2000, 1000, "#FFB0B0B0");
			if (Player.ArousalSettings.OrgasmStage == null) Player.ArousalSettings.OrgasmStage = 0;
			if (Player.ArousalSettings.OrgasmStage == 0) {
				DrawText(TextGet("OrgasmComing"), 1000, 410, "White", "Black");
				DrawButton(700, 532, 250, 64, TextGet("OrgasmTryResist"), "White");
				DrawButton(1050, 532, 250, 64, TextGet("OrgasmSurrender"), "White");
			}
			if (Player.ArousalSettings.OrgasmStage == 1) DrawButton(ActivityOrgasmGameButtonX + 500, ActivityOrgasmGameButtonY, 250, 64, ActivityOrgasmResistLabel, "White");
			if (ActivityOrgasmRuined) ActivityOrgasmControl();
			if (Player.ArousalSettings.OrgasmStage == 2) DrawText(TextGet("OrgasmRecovering"), 1000, 500, "White", "Black");
			ActivityOrgasmProgressBar(550, 970);
		} else if ((Player.ArousalSettings.Progress != null) && (Player.ArousalSettings.Progress >= 1) && (Player.ArousalSettings.Progress <= 99)) ChatRoomDrawArousalScreenFilter(0, 1000, 2000, Player.ArousalSettings.Progress);
	}

	// Adds an arousal filter if needed
	if ((Player.ArousalSettings.VFXVibrator == "VFXVibratorSolid") || (Player.ArousalSettings.VFXVibrator == "VFXVibratorAnimated"))
		ChatRoomVibrationScreenFilter(0, 1000, 2000, Player);

	// If we must save a character status after a dialog
	if (PrivateCharacterShouldSync) {
		ServerPrivateCharacterSync();
		PrivateCharacterShouldSync = false;
	}

}

/**
 * Handles clicks on the buttons below NPCs.
 * @returns {void} - Nothing.
 */
function PrivateClickCharacterButton() {

	// Defines the character position in the private screen
	var X = 1000 - ((PrivateCharacter.length - PrivateCharacterOffset) * 250);
	if (X < 0) X = 0;

	// For each character, we check if the player clicked on the cage or information button
	for (let C = PrivateCharacterOffset; (C < PrivateCharacter.length && C < PrivateCharacterOffset + 4); C++) {

		// The information sheet button is always available
		if ((MouseX >= X + 85 + (C - PrivateCharacterOffset) * 470) && (MouseX <= X + 175 + (C - PrivateCharacterOffset) * 470))
			InformationSheetLoadCharacter(PrivateCharacter[C]);

		// The cage is only available on certain conditions
		if ((MouseX >= X + 205 + (C - PrivateCharacterOffset) * 470) && (MouseX <= X + 295 + (C - PrivateCharacterOffset) * 470) && !PrivateCharacter[C].PrivateBed)
			if ((NPCEventGet(PrivateCharacter[C], "SlaveMarketRent") <= CurrentTime) && (NPCEventGet(PrivateCharacter[C], "AsylumSent") <= CurrentTime) && (NPCEventGet(PrivateCharacter[C], "NPCBrainwashing") <= CurrentTime) && (NPCEventGet(PrivateCharacter[C], "Kidnap") <= CurrentTime))
				if (LogQuery("Cage", "PrivateRoom") && !LogQuery("BlockCage", "Rule"))
					if ((!Player.Cage) || (C == 0))
						if (!PrivateCharacter[C].IsOwner()) {
							PrivateCharacter[C].Cage = (!PrivateCharacter[C].Cage ? true : undefined);
							if (C > 0) ServerPrivateCharacterSync();
						}

		// The cage is only available on certain conditions
		if ((MouseX >= X + 205 + (C - PrivateCharacterOffset) * 470) && (MouseX <= X + 295 + (C - PrivateCharacterOffset) * 470) && PrivateCharacter[C].PrivateBed)
			delete PrivateCharacter[C].PrivateBed;

		// Can switch girls position in the private room if there's more than one friend
		if ((C > 0) && (C < PrivateCharacter.length - 1))
			if ((MouseX >= X + 325 + (C - PrivateCharacterOffset) * 470) && (MouseX <= X + 415 + (C - PrivateCharacterOffset) * 470)) {
				var P = PrivateCharacter[C];
				PrivateCharacter[C] = PrivateCharacter[C + 1];
				PrivateCharacter[C + 1] = P;
				ServerPrivateCharacterSync();
				break;
			}

	}

}

/**
 * Handles clicks on the NPCs.
 * @returns {void} - Nothing.
 */
function PrivateClickCharacter() {

	// Defines the character position in the private screen
	var X = 1000 - ((PrivateCharacter.length - PrivateCharacterOffset) * 250);
	if (X < 0) X = 0;

	// For each character, we find the one that was clicked and open it's dialog
	for (let C = PrivateCharacterOffset; (C < PrivateCharacter.length && C < PrivateCharacterOffset + 4); C++)
		if ((MouseX >= X + (C - PrivateCharacterOffset) * 470) && (MouseX <= X + 470 + (C - PrivateCharacterOffset) * 470))
			if ((NPCEventGet(PrivateCharacter[C], "SlaveMarketRent") <= CurrentTime) && (NPCEventGet(PrivateCharacter[C], "AsylumSent") <= CurrentTime) && (NPCEventGet(PrivateCharacter[C], "NPCBrainwashing") <= CurrentTime) && !PrivateCharacter[C].PrivateBed) {

				// If a kidnapping is in progress, we show the ransom note
				if (NPCEventGet(PrivateCharacter[C], "Kidnap") >= CurrentTime) {
					PrivateRansomCharacter = PrivateCharacter[C];
					CommonSetScreen("Room", "PrivateRansom");
					return;
				}

				// If the arousal meter is shown for that character, we can interact with it
				if ((PrivateCharacter[C].IsPlayer()) || (Player.ArousalSettings.ShowOtherMeter == null) || Player.ArousalSettings.ShowOtherMeter)
					if ((PrivateCharacter[C].IsPlayer()) || ((PrivateCharacter[C].ArousalSettings != null) && (PrivateCharacter[C].ArousalSettings.Visible != null) && (PrivateCharacter[C].ArousalSettings.Visible == "Access") && PrivateCharacter[C].AllowItem) || ((PrivateCharacter[C].ArousalSettings != null) && (PrivateCharacter[C].ArousalSettings.Visible != null) && (PrivateCharacter[C].ArousalSettings.Visible == "All")))
						if ((PrivateCharacter[C].ArousalSettings != null) && (PrivateCharacter[C].ArousalSettings.Active != null) && ((PrivateCharacter[C].ArousalSettings.Active == "Manual") || (PrivateCharacter[C].ArousalSettings.Active == "Hybrid") || (PrivateCharacter[C].ArousalSettings.Active == "Automatic"))) {

							// The arousal meter can be maximized or minimized by clicking on it
							if ((MouseX >= X + (C - PrivateCharacterOffset) * 470 + 60) && (MouseX <= X + (C - PrivateCharacterOffset) * 470 + 140) && (MouseY >= 400) && (MouseY <= 500) && !PrivateCharacter[C].ArousalZoom) { PrivateCharacter[C].ArousalZoom = true; return; }
							if ((MouseX >= X + (C - PrivateCharacterOffset) * 470 + 50) && (MouseX <= X + (C - PrivateCharacterOffset) * 470 + 150) && (MouseY >= 615) && (MouseY <= 715) && PrivateCharacter[C].ArousalZoom) { PrivateCharacter[C].ArousalZoom = false; return; }

							// If the player can manually control her arousal or wants to fight her desire
							if ((PrivateCharacter[C].IsPlayer()) && (MouseX >= X + (C - PrivateCharacterOffset) * 470 + 50) && (MouseX <= X + (C - PrivateCharacterOffset) * 470 + 150) && (MouseY >= 200) && (MouseY <= 615) && PrivateCharacter[C].ArousalZoom)
								if ((Player.ArousalSettings != null) && (Player.ArousalSettings.Active != null) && (Player.ArousalSettings.Progress != null)) {
									if ((Player.ArousalSettings.Active == "Manual") || (Player.ArousalSettings.Active == "Hybrid")) {
										var Arousal = Math.round((625 - MouseY) / 4);
										ActivitySetArousal(Player, Arousal);
										ActivityExpression(Player, Player.ArousalSettings.Progress);
										if (Player.ArousalSettings.Progress == 100) ActivityOrgasmPrepare(Player);
									}
									return;
								}

							// Don't do anything if the thermometer is clicked without access to it
							if ((MouseX >= X + (C - PrivateCharacterOffset) * 470 + 50) && (MouseX <= X + (C - PrivateCharacterOffset) * 470 + 150) && (MouseY >= 200) && (MouseY <= 615) && PrivateCharacter[C].ArousalZoom) return;

						}

				// Cannot click on a character that's having an orgasm
				if (!PrivateCharacter[C].IsPlayer() && (PrivateCharacter[C].ArousalSettings != null) && (PrivateCharacter[C].ArousalSettings.OrgasmTimer != null) && (PrivateCharacter[C].ArousalSettings.OrgasmTimer > 0))
					return;

				// Make Sure the NPC owner has the "PlayerCollaring" event set
				if ((Player.Owner != null) && (Player.Owner.replace("NPC-", "").trim() === PrivateCharacter[C].Name) && (NPCEventGet(PrivateCharacter[C], "PlayerCollaring") <= 0)) {
					NPCEventAdd(PrivateCharacter[C], "PlayerCollaring", CurrentTime);
					ServerPrivateCharacterSync();
				}

				// Sets the new character (1000 if she's owner, 2000 if she's owned)
				if (!PrivateCharacter[C].IsPlayer()) {
					PrivateCharacterShouldSync = true;
					if ((PrivateCharacter[C].Stage == "0") && PrivateCharacter[C].IsOwner()) PrivateCharacter[C].Stage = "1000";
					if ((PrivateCharacter[C].Stage == "0") && PrivateCharacter[C].IsOwnedByPlayer()) PrivateCharacter[C].Stage = "2000";
					NPCTraitDialog(PrivateCharacter[C]);
				}
				CharacterSetCurrent(PrivateCharacter[C]);
				if (!CurrentCharacter) return;

				// If the owner has beeped the player
				if ((CurrentCharacter.Stage == "1000") && Player.IsOwnedByCharacter(CurrentCharacter) && LogQuery("OwnerBeepActive", "PrivateRoom")) {
					if (LogQuery("OwnerBeepTimer", "PrivateRoom")) {
						CurrentCharacter.Stage = "1020";
						CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "OwnerBeepSuccess");
						NPCLoveChange(CurrentCharacter, 8);
					} else {
						CurrentCharacter.Stage = "1030";
						CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "OwnerBeepFail");
						NPCLoveChange(CurrentCharacter, -10);
					}
					LogDelete("OwnerBeepActive", "PrivateRoom");
					LogAdd("OwnerBeepTimer", "PrivateRoom", CurrentTime + 1800000);
				}

				// If the owner is serious, she might force the player to kneel
				if ((CurrentCharacter.Stage == "1000") && Player.IsOwnedByCharacter(CurrentCharacter) && !Player.IsKneeling() && Player.CanKneel() && (NPCTraitGet(CurrentCharacter, "Serious") >= Math.random() * 100 - 25)) {
					CurrentCharacter.Stage = "1005";
					NPCLoveChange(CurrentCharacter, -3);
					CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "PlayerMustKneel");
				}

				// Prerequisite conditions for NPC giving gifts to player
				if (Player.CanTalk() && CurrentCharacter.CanTalk() && Player.CanInteract() && CurrentCharacter.CanInteract() && !Player.Cage && !CurrentCharacter.Cage && ((CurrentCharacter.Love ?? 0) >= 80) && (Math.random() >= 0.85) && (NPCEventGet(CurrentCharacter, "NextGift") <= CurrentTime)) {

					// Lovers can offer non-restraint gifts to dominant players
					if ((CurrentCharacter.Stage == "0") && (PrivateGiftRegular != null) && (ReputationGet("Dominant") >= NPCTraitGet(CurrentCharacter, "Dominant"))) {
						CurrentCharacter.Stage = "RegularGift0";
						CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "RegularGiftIntro");
					}

					// Lovers can offer restraint gifts to submissive players
					if ((CurrentCharacter.Stage == "0") && (PrivateGiftRestraint != null) && (ReputationGet("Dominant") < NPCTraitGet(CurrentCharacter, "Dominant"))) {
						CurrentCharacter.Stage = "RestraintGift0";
						CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "RestraintGiftIntro");
					}

					// Domme NPC can offer restraint gifts to submissive players
					if ((CurrentCharacter.Stage == "1000") && (PrivateGiftRestraint != null)) {
						CurrentCharacter.Stage = "DomGift0";
						CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "DomGiftIntro");
					}

					// Domme can offer non-restraint gifts to dominant players
					if ((CurrentCharacter.Stage == "2000") && (PrivateGiftRegular != null)) {
						CurrentCharacter.Stage = "SubGift0";
						CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "SubGiftIntro");
					}

				}

			}

}

/**
 * Handles clicks in the private room.
 * @returns {void} - Nothing.
 */
function PrivateClick() {

	// If the player is having an orgasm, only the orgasm controls are available
	if ((Player.ArousalSettings != null) && (Player.ArousalSettings.OrgasmTimer != null) && (typeof Player.ArousalSettings.OrgasmTimer === "number") && !isNaN(Player.ArousalSettings.OrgasmTimer) && (Player.ArousalSettings.OrgasmTimer > 0)) {

		// On stage 0, the player can choose to resist the orgasm or not.  At 1, the player plays a mini-game to fight her orgasm
		if (Player.ArousalSettings.OrgasmStage == 0 && MouseIn(700, 532, 250, 64)) ActivityOrgasmGameGenerate(0);
		if (Player.ArousalSettings.OrgasmStage == 0 && MouseIn(1050, 532, 250, 64)) ActivityOrgasmStart(Player);
		if (Player.ArousalSettings.OrgasmStage == 1 && MouseIn(ActivityOrgasmGameButtonX + 500, ActivityOrgasmGameButtonY, 250, 64)) ActivityOrgasmGameGenerate(ActivityOrgasmGameProgress + 1);
		return;

	}

	// Main screens buttons
	if (MouseIn(500, 0, 500, 1000) && !LogQuery("RentRoom", "PrivateRoom")) CharacterSetCurrent(Player);
	if (MouseIn(1000, 0, 500, 1000) && !LogQuery("RentRoom", "PrivateRoom")) { NPCTraitDialog(PrivateVendor); CharacterSetCurrent(PrivateVendor); }
	if (MouseIn(1885, PrivateButtonTop(0), 90, 90) && Player.CanWalk() && !Player.Cage) PrivateExit();
	if (MouseIn(1885, PrivateButtonTop(1), 90, 90) && LogQuery("RentRoom", "PrivateRoom") && Player.CanKneel()) PoseSetActive(Player, Player.ActivePoseMapping.BodyLower !== "Kneel" ? "Kneel" : "BaseLower", true);
	if (MouseIn(1885, PrivateButtonTop(2), 90, 90) && LogQuery("RentRoom", "PrivateRoom") && Player.CanWalk() && (!Player.Cage)) CharacterSetCurrent(PrivateVendor);
	if (MouseIn(1885, PrivateButtonTop(3), 90, 90) && LogQuery("RentRoom", "PrivateRoom") && Player.CanChangeOwnClothes()) CharacterAppearanceLoadCharacter(Player);
	if (MouseIn(1885, PrivateButtonTop(4), 90, 90) && LogQuery("RentRoom", "PrivateRoom") && Player.CanChangeOwnClothes() && LogQuery("Wardrobe", "PrivateRoom")) CommonPromiseCatch(WardrobeOpenCharacter(Player));
	if (MouseIn(1885, PrivateButtonTop(5), 90, 90) && LogQuery("RentRoom", "PrivateRoom") && (!Player.Cage) && PrivateBedActive()) CommonSetScreen("Room", "PrivateBed");
	if (MouseIn(1885, PrivateButtonTop(6), 90, 90) && LogQuery("RentRoom", "PrivateRoom") && LogQuery("Expansion", "PrivateRoom")) PrivateCharacterOffset = (PrivateCharacterOffset + 4 == PrivateCharacterMax) ? 0 : PrivateCharacterOffset + 4;
	if (MouseIn(1885, PrivateButtonTop(7), 90, 90) && LogQuery("RentRoom", "PrivateRoom")) {
		BackgroundSelectionMake(BackgroundsPrivateRoomTagList, MainHallBackground, (Name, setBackground) => {
			if (setBackground) {
				if (Name !== "MainHall") {
					Player.VisualSettings.MainHallBackground = Name;
				} else {
					delete Player.VisualSettings.MainHallBackground;
				}
				ServerAccountUpdate.QueueData({ VisualSettings: Player.VisualSettings });
			}
			CommonSetScreen("Room", "Private");
		});
	}
	if (MouseIn(1885, PrivateButtonTop(8), 90, 90) && LogQuery("RentRoom", "PrivateRoom")) {
		BackgroundSelectionMake(BackgroundsPrivateRoomTagList, PrivateBackground, (Name, setBackground) => {
			if (setBackground) {
				PrivateBackground = Name;
				if (Name !== "Private") {
					Player.VisualSettings.PrivateRoomBackground = Name;
				} else {
					delete Player.VisualSettings.PrivateRoomBackground;
				}
				ServerAccountUpdate.QueueData({ VisualSettings: Player.VisualSettings });
			}
			CommonSetScreen("Room", "Private");
		});

	}

	if ((MouseX <= 1885) && (MouseY < 900) && LogQuery("RentRoom", "PrivateRoom") && (!Player.Cage)) PrivateClickCharacter();
	if ((MouseX <= 1885) && (MouseY >= 900) && LogQuery("RentRoom", "PrivateRoom")) PrivateClickCharacterButton();

}

/**
 * Triggered when the player rents the room.
 * @returns {void} - Nothing.
 */
function PrivateRentRoom() {
	CharacterChangeMoney(Player, -250);
	LogAdd("RentRoom", "PrivateRoom");
}

/**
 * Triggered when the player gets the wardrobe.
 * @returns {void} - Nothing.
 */
function PrivateGetWardrobe() {
	CharacterChangeMoney(Player, -100);
	LogAdd("Wardrobe", "PrivateRoom");
}

/**
 * Triggered when the player gets the cage.
 * @returns {void} - Nothing.
 */
function PrivateGetCage() {
	CharacterChangeMoney(Player, -150);
	LogAdd("Cage", "PrivateRoom");
}

/**
 * Triggered when the player gets the room expansion.
 * @returns {void} - Nothing.
 */
function PrivateGetExpansion() {
	CharacterChangeMoney(Player, -200);
	LogAdd("Expansion", "PrivateRoom");
	PrivateCharacterMax = 8;
}

/**
 * Triggered when the player gets the second room expansion.
 * @returns {void} - Nothing.
 */
function PrivateGetSecondExpansion() {
	CharacterChangeMoney(Player, -400);
	LogAdd("SecondExpansion", "PrivateRoom");
	PrivateCharacterMax = 12;
}

/**
 * Triggered when the player gets the security service against Pandora's kidnappings.
 * @returns {void} - Nothing.
 */
function PrivateGetSecurity() {
	CharacterChangeMoney(Player, -200);
	LogAdd("Security", "PrivateRoom");
}

/**
 * Triggered when the player cancels the security service against Pandora's kidnappings.
 * @returns {void} - Nothing.
 */
function PrivateCancelSecurity() {
	LogDelete("Security", "PrivateRoom");
}

/**
 * Loads a given private room character.
 * @param {ServerPrivateCharacterData} data - The packed character data recieved from the server
 * @returns {boolean} - Update required.
 */
function PrivateLoadCharacter(data) {
	let updateRequired = false;

	if (!data.Name) return updateRequired;

	const charID = "NPC_Private_Custom_" + PrivateCharacter.length;

	const C = CharacterLoadNPC(charID, "NPC_Private_Custom", "Room", "Private");

	C.Name = data.Name;
	if (data.Title != null) C.Title = data.Title;
	if (data.AssetFamily != null) C.AssetFamily = data.AssetFamily;
	if (data.Appearance != null) {
		const updateValid = ServerAppearanceLoadFromBundle(C, data.AssetFamily, data.Appearance);
		updateRequired = updateRequired || !updateValid;
	}
	if (data.AppearanceFull != null) {
		const updateValid = ServerAppearanceLoadFromBundle(C, data.AssetFamily, data.AppearanceFull, undefined, true);
		updateRequired = updateRequired || !updateValid;
	}
	C.Trait = Array.isArray(data.Trait) ? data.Trait.slice() : [];
	C.Cage = data.Cage ? true : undefined;
	C.Event = Array.isArray(data.Event) ? data.Event : [];
	C.Lover = typeof data.Lover === "string" ? data.Lover : undefined;
	C.Owner = typeof data.Owner === "string" ? data.Owner : "";
	if (data.ArousalSettings != null) C.ArousalSettings = data.ArousalSettings;
	if (data.FromPandora != null) C.FromPandora = data.FromPandora;
	C.Love = (data.Love == null) ? 0 : parseInt(data.Love);

	NPCTraitDialog(C);
	PreferenceInit(C);
	ActivityTimerProgress(C, 0);
	CharacterRefresh(C);

	if (NPCEventGet(C, "PrivateRoomEntry") == 0) NPCEventAdd(C, "PrivateRoomEntry", CurrentTime);
	if (C.CanKneel() && C.IsOwnedByPlayer()) PoseSetActive(C, "Kneel", true);

	// We allow items on NPC if 25+ dominant reputation, not owner or restrained
	C.ArousalSettings.Active = "Automatic";
	C.ArousalSettings.Visible = "All";
	C.ArousalSettings.Progress = 0;
	C.ArousalSettings.ProgressTimer = 0;
	C.AllowItem = (((ReputationGet("Dominant") + 25 >= NPCTraitGet(C, "Dominant")) && !C.IsOwner()) || C.IsOwnedByPlayer() || C.IsRestrained() || !C.CanTalk());

	PrivateCharacter.push(C);

	return updateRequired;
}

/**
 * Triggered when a new character is added to the player's private room.
 * @param {NPCCharacter} Template - The base of the character, includes the name and appearance.
 * @param {"" | NPCArchetype | null} [Archetype] - The type of character such as maid or mistress.
 * @param {boolean} [incomplete] - Whether the caller plans to customize the NPC more. Skips generating random traits and calling {@link ServerPrivateCharacterSync()}.
 * @returns {NPCCharacter} - The new private room character.
 */
function PrivateAddCharacter(Template, Archetype, incomplete=false) {
	const C = CharacterLoadNPC("NPC_Private_Custom_" + PrivateCharacter.length.toString(), "NPC_Private_Custom", "Room", "Private");
	C.Name = Template.Name;
	C.Appearance = Template.Appearance.slice();
	C.AppearanceFull = Template.Appearance.slice();
	if (Archetype && Archetype != "Submissive") C.Title = Archetype;
	NPCTraitGenerate(C);
	if (Archetype === "Mistress") NPCTraitSet(C, "Dominant", 60 + Math.floor(Math.random() * 41));
	if ((Archetype === "Submissive") || (Archetype === "Bunny")) NPCTraitSet(C, "Dominant", -50 - Math.floor(Math.random() * 51));
	if (!incomplete) NPCTraitDialog(C);
	NPCSetupArousal(C);
	NPCEventAdd(C, "PrivateRoomEntry", CurrentTime);
	NPCEventAdd(C, "NextKidnap", CurrentTime + MS_PER_DAY);
	C.AllowItem = (((ReputationGet("Dominant") + 25 >= NPCTraitGet(C, "Dominant")) && !C.IsOwner()) || C.IsRestrained() || !C.CanTalk());
	if ((InventoryGet(C, "ItemNeck") != null) && (InventoryGet(C, "ItemNeck")?.Asset.Name == "ClubSlaveCollar")) InventoryRemove(C, "ItemNeck");
	if (!incomplete) ServerPrivateCharacterSync();
	CharacterRefresh(C);
	PrivateCharacter.push(C);
	return C;
}

/**
 * Gets the index of a given private room character.
 * @returns {number} - Index of the NPC inside the private characters array.
 * @deprecated
 */
function PrivateGetCurrentID() {
	for (let P = 1; P < PrivateCharacter.length; P++)
		if (CurrentCharacter?.Name == PrivateCharacter[P].Name)
			return P;
	return -1;
}

/**
 * Triggered when the player kicks out a character from the dialog
 * @returns {void} - Nothing.
 */
function PrivateKickOut() {
	if (!CurrentCharacter) return;
	PrivateKickCharacterOut(CurrentCharacter);
	DialogLeave();
}

/**
 * Triggered when the player kicks out her owner, breaking the ownership
 * @returns {void} - Nothing.
 */
function PrivateKickOutOwner() {
	if (!CurrentCharacter) return;
	Player.Owner = "";
	ServerPlayerSync();
	InventoryRemove(Player, "ItemNeck");
	PrivateKickCharacterOut(CurrentCharacter);
	DialogLeave();
}

/**
 * Triggered when the player kicks out a character.
 * @param {Character} C
 * @returns {void} - Nothing.
 */
function PrivateKickCharacterOut(C) {
	let DeleteCharIndex = PrivateCharacter.findIndex(c => c.CharacterID === C.CharacterID);
	if (DeleteCharIndex < 0) return;
	PrivateCharacter.splice(DeleteCharIndex, 1);
	CharacterDelete(C);
	let OtherCharIndex = 0;
	for (let Char of PrivateCharacter) {
		if (OtherCharIndex >= DeleteCharIndex) Char.CharacterID = "NPC_Private_Custom_" + OtherCharIndex.toString();
		OtherCharIndex++;
	}
	ServerPrivateCharacterSync();
	DialogLeave();
}

/**
 * Triggered when the player tells a NPC to change.
 * @param {string} NewCloth - The new appearance to dress the NPC with
 * @returns {void} - Nothing.
 */
function PrivateChange(NewCloth) {
	if (!CurrentCharacter) return;
	switch (NewCloth){
		case "Cloth": CharacterDress(CurrentCharacter, CurrentCharacter.AppearanceFull ?? []); break;
		case "Underwear": CharacterUnderwear(CurrentCharacter, CurrentCharacter.AppearanceFull ?? []); break;
		case "Naked": CharacterNaked(CurrentCharacter); break;
		case "Maiestas":
		case "Vincula":
		case "Amplector":
		case "Corporis":
			MagicSchoolLaboratoryPrepareNPC(CurrentCharacter, NewCloth); break;
		case "Bunny":
		case "Succubus":
		case "AnimeGirl":
			CharacterArchetypeClothes(CurrentCharacter, NewCloth); break;
		case "Custom": {
			PrivateNPCInteraction(10);
			if (CheatFactor("FreeNPCDress", 0) != 0) CharacterChangeMoney(Player, -50);
			const NPC = /** @type {NPCCharacter} */ (CurrentCharacter);
			DialogLeave();
			CharacterAppearanceLoadCharacter(NPC, (result) => {
				CommonSetScreen("Room", "Private");
				if (result) {
					NPC.AppearanceFull = NPC.Appearance;
					ServerPrivateCharacterSync();
				}
			});
		}
	}
}

/**
 * Checks if the player's owner is inside her private room.
 * @returns {boolean} - Returns TRUE if the player's owner is inside her private room.
 */
function PrivateOwnerInRoom() {
	for (const character of PrivateCharacter) {
		if (character.IsPlayer()) continue;
		if (character.IsOwner()) return true;
	}
	return false;
}

/**
 * Checks if the player's lover is inside her private room.
 * @param {number} L - Index of the lover to check for.
 * @returns {boolean} - Returns TRUE if the player's lover is inside her private room.
 */
function PrivateLoverInRoom(L) {
	const loverInfo = Player.GetLoversNumbers()[L];
	for (const character of PrivateCharacter) {
		if (character.IsPlayer()) continue;
		if ("NPC-" + character.Name === loverInfo) return true;
	}
	return false;
}

/**
 * Triggered when a NPC restrains the player, there's a 1-2 minute timer before the player can be released.
 * @returns {void} - Nothing.
 */
function PrivateRestrainPlayer() {
	CharacterFullRandomRestrain(Player);
	PrivateNPCInteraction(5);
	PrivateReleaseTimer = CommonTime() + (Math.random() * MS_PER_MIN) + MS_PER_MIN;
}

/**
 * Alters relationships to make them decay after some time. Below -100, the NPC leaves if she's not caged.
 * @returns {boolean} - Whether or not any private characters require updating.
 */
function PrivateRelationDecay() {

	// We skip if there's only the player in the room
	if (PrivateCharacter.length <= 1) return false;

	// For each NPCs in the room
	let MustSave = false;
	for (let Index = 1; Index < PrivateCharacter.length; Index++) {

		// The player is excluded
		let C = PrivateCharacter[Index];
		if (C.IsPlayer()) continue;

		// Sets the first decay if needed
		const LastDecay = NPCEventGet(C, "LastDecay");
		if (LastDecay * CheatFactor("NoLoveDecay", 0) <= 0) {

			// Sets the next decay time
			NPCEventAdd(C, "LastDecay", CurrentTime);
			MustSave = true;

		} else if (LastDecay <= CurrentTime - PrivateBaseDecay) {

			// Sets the next decay time
			NPCEventAdd(C, "LastDecay", CurrentTime);
			MustSave = true;

			// To calculate the decay, we go up to 400 from room entry
			let EntryDays = Math.floor((CurrentTime - NPCEventGet(C, "PrivateRoomEntry")) / MS_PER_DAY);
			if (EntryDays < 0) EntryDays = 0;
			if (EntryDays > 400) EntryDays = 400;

			// The decay gets slower and slower, up to 6 times slower at 400 days and more
			const LoveDecay = Math.floor((CurrentTime - LastDecay) / PrivateBaseDecay * ((480 - EntryDays) / 480));
			if (LoveDecay > 0) NPCLoveChange(C, LoveDecay * -1);

			/** @type {Set<EffectName>} */
			const stuckingEffects = new Set([E.Freeze, E.Tethered, E.Mounted, E.IsChained, E.Shackled, E.Suspended]);
			const isStuck = C.Cage || C.Effect.some(e => stuckingEffects.has(e));
			if ((C.Love ?? 0) <= -100 && !isStuck) {
				PrivateKickCharacterOut(C);
			}

		}
	}

	return MustSave;

}

/**
 * Triggered when the player starts a submissive trial with an NPC
 * @param {number} ChangeRep - Amount of dominant reputation to lose.
 * @returns {void} - Nothing.
 */
function PrivateStartTrial(ChangeRep) {
	if (!CurrentCharacter) return;
	DialogChangeReputation("Dominant", ChangeRep);
	CharacterDress(CurrentCharacter, CurrentCharacter.AppearanceFull ?? []);
	NPCEventAdd(CurrentCharacter, "EndSubTrial", CurrentTime + NPCLongEventDelay(CurrentCharacter));
	NPCLoveChange(CurrentCharacter, 30);
	ServerPrivateCharacterSync();
}

/**
 * Triggered when the player stops a submissive trial with an NPC
 * @param {number} ChangeRep - Amount of dominant reputation to gain/lose.
 * @returns {void} - Nothing.
 */
function PrivateStopTrial(ChangeRep) {
	if (!CurrentCharacter) return;
	DialogChangeReputation("Dominant", ChangeRep);
	NPCEventDelete(CurrentCharacter, "EndSubTrial");
	NPCLoveChange(CurrentCharacter, -60);
	ServerPrivateCharacterSync();
}

/**
 * Shows the number or hours remaining for the trial in the dialog phrase.
 * @returns {void} - Nothing.
 */
function PrivateShowTrialHours() {
	if (!CurrentCharacter) return;
	CurrentCharacter.CurrentDialog = CurrentCharacter.CurrentDialog.replace("DialogHours", Math.ceil((NPCEventGet(CurrentCharacter, "EndSubTrial") - CurrentTime) / MS_PER_HOUR).toString());
}

/**
 * Runs the currently selected activity
 * @param {number} LoveFactor - Amount of love to be added or removed from the NPC.
 * @returns {void} - Nothing.
 */
function PrivateActivityRun(LoveFactor) {
	if (!CurrentCharacter) return;
	// Changes the love factor only once per activity (except if negative)
	PrivateActivityCount++;
	LoveFactor = parseInt(LoveFactor);
	if ((LoveFactor < 0) || PrivateActivityAffectLove) NPCLoveChange(CurrentCharacter, LoveFactor);
	if ((LoveFactor > 0) && PrivateActivityAffectLove) PrivateActivityAffectLove = false;

	// If the player refused to do the activity, she will be either forced, punished or the Domme will stop it
	if (LoveFactor <= -3) {

		// Each factor is randomized and added to a stat, punishment is increased if the another activity was refused in the last 5 minutes
		var Force = Math.random() * 150 + NPCTraitGet(CurrentCharacter, "Violent");
		var Punish = Math.random() * 150 + NPCTraitGet(CurrentCharacter, "Serious");
		var Stop = Math.random() * 150 + NPCTraitGet(CurrentCharacter, "Wise");
		if (NPCEventGet(CurrentCharacter, "RefusedActivity") >= CurrentTime - 300000) Punish = Punish + 50;
		if (!Player.IsOwned()) Stop = Stop + 50;
		NPCEventAdd(CurrentCharacter, "RefusedActivity", CurrentTime);

		// If we must punish
		if ((Punish > Force) && (Punish > Stop)) {
			CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "PunishIntro");
			CurrentCharacter.Stage = "Punish";
			return;
		}

		// If we must stop the activity
		if ((Stop > Force) && (Stop > Punish)) {
			CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "ActivityStop");
			CurrentCharacter.Stage = "1001";
			return;
		}

	}

	let Item;

	switch (PrivateActivity){
		case "Gag": InventoryWearRandom(Player, "ItemMouth"); break;
		case "Restrain": InventoryWearRandom(Player, "ItemArms"); break;
		case "RestrainOther": if (PrivateActivityTarget) InventoryWearRandom(PrivateActivityTarget, "ItemArms"); break;
		case "FullRestrain": // The restraining activities are harsher for serious NPCs
			if (NPCTraitGet(CurrentCharacter, "Playful") > 0) CharacterFullRandomRestrain(Player, "FEW");
			else if (NPCTraitGet(CurrentCharacter, "Playful") === 0) CharacterFullRandomRestrain(Player);
			else if (NPCTraitGet(CurrentCharacter, "Serious") > 0) CharacterFullRandomRestrain(Player, "LOT");
			break;
		case "FullRestrainOther": if (PrivateActivityTarget) CharacterFullRandomRestrain(PrivateActivityTarget); break;
		case "Release": CharacterRelease(Player); break;
		case "Ungag":
			InventoryRemove(Player, "ItemMouth");
			InventoryRemove(Player, "ItemMouth2");
			InventoryRemove(Player, "ItemMouth3");
			InventoryRemove(Player, "ItemHead");
			InventoryRemove(Player, "ItemHood");
			break;
		case "Naked": CharacterNaked(Player); break;
		case "Underwear": CharacterRandomUnderwear(Player); break;
		case "RandomClothes": CharacterAppearanceFullRandom(Player, true); break;
		case "CollegeClothes":
			CollegeEntranceWearStudentClothes(Player);
			InventoryAdd(Player, "CollegeOutfit1", "Cloth");
			InventoryAdd(Player, "CollegeSkirt", "ClothLower");
			break;
		case "Locks": InventoryFullLockRandom(Player, CurrentCharacter); break;
		case "Unchaste": // The unchaste activity removes all pelvis, breast, vulva and butt items
			InventoryRemove(Player, "ItemPelvis");
			InventoryRemove(Player, "ItemBreast");
			InventoryRemove(Player, "ItemNipples");
			InventoryRemove(Player, "ItemNipplesPiercings");
			InventoryRemove(Player, "ItemVulva");
			InventoryRemove(Player, "ItemVulvaPiercings");
			InventoryRemove(Player, "ItemButt");
			break;
		case "Gift": // The gift can only happen once a day if the player is fully collared
			CharacterChangeMoney(Player, 50);
			NPCEventAdd(CurrentCharacter, "LastGift", CurrentTime);
			break;
		case "CollarType": // In CollarType, the owner will change the slave collar design for the player
			Item = InventoryGet(Player, "ItemNeck");
			if (Item !== null) {
				let NewProperty = Item.Property;
				while (NewProperty == Item.Property)
					Item.Property = CommonCloneDeep(CommonGetRandomItemFromList(InventoryItemNeckSlaveCollarTypes).Property);
				CharacterRefresh(Player, true);
			}
			break;
		case "Shibari": // In Shibari, the player gets naked and fully roped in hemp
			CharacterNaked(Player);
			PoseSetActive(Player, null);
			InventoryRemove(Player, "ItemHood");
			InventoryRemove(Player, "ItemHead");
			ShibariRandomBondage(Player, 3);
			InventoryWearRandom(Player, "ItemMouth");
			PrivateReleaseTimer = CommonTime() + (Math.random() * MS_PER_MIN) + MS_PER_MIN;
			break;
		case "PetGirl": // In PetGirl, the player gets gagged, bound & dressed as a puppy
			InventoryRemove(Player, "ItemLegs");
			InventoryRemove(Player, "ItemFeet");
			InventoryRemove(Player, "Hat");
			InventoryRemove(Player, "HairAccessory2");
			InventoryRemove(Player, "HairAccessory3");
			InventoryWearRandom(Player, "ItemMouth");
			InventoryWear(Player, "BitchSuit", "ItemArms", "Default", Math.floor(Math.random() * 10) + 1);
			InventoryWear(Player, "PuppyEars1", "HairAccessory1");
			InventoryWear(Player, "PuppyTailPlug", "ItemButt");
			PrivateReleaseTimer = CommonTime() + (Math.random() * 120000) + 120000;
			break;
		case "Bed": // The player can get to her private bed with her owner, and cannot leave for 2 minutes
			CurrentCharacter.PrivateBed = true;
			PrivateBedLeaveTime = CommonTime() + 120000;
			DialogLeave();
			CommonSetScreen("Room", "PrivateBed");
			break;
	}

	// Some activities creates a release timer
	if ((PrivateActivity == "Gag") || (PrivateActivity == "Restrain") || (PrivateActivity == "FullRestrain") || (PrivateActivity == "Locks")) PrivateReleaseTimer = CommonTime() + (Math.random() * MS_PER_MIN) + MS_PER_MIN;

	// After running the activity a few times, we stop
	if (PrivateActivityCount >= Math.floor(Math.random() * 4) + 2) {
		CurrentCharacter.Stage = "1000";
		CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "Activity" + PrivateActivity + "Outro");
	}

}

/**
 * Checks if an NPC in the private room can be restrained by another.
 * @returns {boolean} - Returns TRUE if someone else in the room can be restrained by the player's owner, keep that target in a variable to be used later
 */
function PrivateCanRestrainOther() {
	if (!CurrentCharacter) return false;
	PrivateActivityTarget = null;
	var List = [];
	for (let C = 0; C < PrivateCharacter.length; C++)
		if (!PrivateCharacter[C].IsPlayer() && (PrivateCharacter[C].ID != CurrentCharacter.ID) && (NPCTraitGet(CurrentCharacter, "Dominant") > NPCTraitGet(PrivateCharacter[C], "Dominant")) && (InventoryGet(PrivateCharacter[C], "ItemArms") == null))
			List.push(PrivateCharacter[C]);
	if (List.length > 0)
		PrivateActivityTarget = CommonGetRandomItemFromList(List);
	return (PrivateActivityTarget != null);
}

/**
 * Starts a random activity for the player as submissive.
 * @returns {void} - Nothing.
 */
function PrivateStartActivity() {
	if (!CurrentCharacter) return;
	CurrentCharacter.Love ??= 0;
	// Remove previous activity from the list of possible Activities
	let untestedActivities = [...PrivateActivityList]; // copy of list
	let activity;
	CommonRemoveItemFromList(untestedActivities, untestedActivities.indexOf(PrivateActivity)); // remove previous activity

	// Finds a valid activity for the player
	testLoop: {
		while (untestedActivities.length > 0) {
			activity = CommonRemoveRandomItemFromList(untestedActivities); // remove tested activity

			switch (activity) {
				case "Gag": if (Player.CanTalk()) break testLoop; break;
				case "Ungag": if(!Player.CanTalk() && (CommonTime() > PrivateReleaseTimer)) break testLoop; break;
				case "Restrain": if(InventoryGet(Player, "ItemArms") === null) break testLoop; break;
				case "RestrainOther": if(PrivateCanRestrainOther()) break testLoop; break;
				case "FullRestrain": if((InventoryGet(Player, "ItemArms") === null)) break testLoop; break;
				case "FullRestrainOther": if(PrivateCanRestrainOther()) break testLoop; break;
				case "Release": if(Player.IsRestrained() && (CommonTime() > PrivateReleaseTimer)) break testLoop; break;
				case "Unchaste": if(Player.IsChaste() && (CommonTime() > PrivateReleaseTimer)) break testLoop; break;
				case "Tickle": if((NPCTraitGet(CurrentCharacter, "Playful") >= 0)) break testLoop; break;
				case "Spank": if((NPCTraitGet(CurrentCharacter, "Violent") >= 0)) break testLoop; break;
				case "Pet": if((NPCTraitGet(CurrentCharacter, "Peaceful") > 0)) break testLoop; break;
				case "Slap": if((CurrentCharacter.Love < 50) && (NPCTraitGet(CurrentCharacter, "Violent") > 0)) break testLoop; break;
				case "Kiss": if(Player.CanTalk() && (CurrentCharacter.Love >= 50) && (NPCTraitGet(CurrentCharacter, "Horny") >= 0)) break testLoop; break;
				case "Fondle": if(!Player.IsBreastChaste() && (NPCTraitGet(CurrentCharacter, "Horny") > 0)) break testLoop; break;
				case "Naked": if(!CharacterIsNaked(Player) && (NPCTraitGet(CurrentCharacter, "Horny") >= 0) && Player.CanChangeOwnClothes()) break testLoop; break;
				case "Underwear": if(!CharacterIsInUnderwear(Player) && Player.CanChangeOwnClothes()) break testLoop; break;
				case "RandomClothes": if(Player.CanChangeOwnClothes()) break testLoop; break;
				case "CollegeClothes": if(Player.CanChangeOwnClothes() && ((CurrentCharacter.Name == "Amanda") || (CurrentCharacter.Name == "Sarah") || (CurrentCharacter.Name == "Jennifer") || (CurrentCharacter.Name == "Sidney"))) break testLoop; break;
				case "Shibari": if(Player.CanChangeOwnClothes() && (NPCTraitGet(CurrentCharacter, "Wise") >= 0)) break testLoop; break;
				case "Gift": if((Player.Owner != "") && (CurrentCharacter.Love >= 90) && (CurrentTime >= NPCEventGet(CurrentCharacter, "LastGift") + MS_PER_DAY)) break testLoop; break;
				case "PetGirl": if((InventoryGet(Player, "ItemArms") === null) && (NPCTraitGet(CurrentCharacter, "Peaceful") >= 0)) break testLoop; break;
				case "Locks": if(InventoryHasLockableItems(Player)) break testLoop; break;
				case "Bed": if((PrivateBedCount() == 1) && (NPCEventGet(CurrentCharacter, "NextBed") < CurrentTime) && (NPCTraitGet(CurrentCharacter, "Horny") >= 0) && PrivateBedActive() && (!Player.Cage)) break testLoop; break;
				case "Aftercare": if((CurrentCharacter.Love >= 50) && (NPCTraitGet(CurrentCharacter, "Wise") >= 0)) break testLoop; break;
				case "CollarType": if(Player.IsOwned() && InventoryIsWorn(Player, "ItemNeck", "SlaveCollar")) break testLoop; break;
			}
		}

		// no activity is currently valid
		CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "ActivityNone");
		return;
	}

	// Starts the activity (any activity adds +2 love automatically)
	PrivateActivity = activity;
	PrivateNPCInteraction(2);
	PrivateActivityAffectLove = true;
	PrivateActivityCount = 0;
	CurrentCharacter.Stage = "Activity" + PrivateActivity;
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "Activity" + PrivateActivity + "Intro");
	if (PrivateActivityTarget !== null) CurrentCharacter.CurrentDialog = CurrentCharacter.CurrentDialog.replace(/ActivityTarget/g, PrivateActivityTarget.Name);

}

/**
 * Set the no change rule for the player.
 * @param {number} Minutes - The number of minutes to apply the rule for
 * @returns {void} - Nothing.
 */
function PrivateBlockChange(Minutes) {
	LogAdd("BlockChange", "Rule", CurrentTime + (Minutes * MS_PER_MIN));
	ServerPlayerAppearanceSync();
}

/**
 * Starts a random punishment for the player as submissive.
 * @returns {void} - Nothing.
 */
function PrivateSelectPunishment() {
	if (!CurrentCharacter) return;
	// Release the player first
	if (Player.IsRestrained() || !Player.CanTalk()) {
		CharacterRelease(Player);
		CurrentCharacter.Stage = "PunishReleaseBefore";
		CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "PunishReleaseBeforeIntro");
		return;
	}

	// Strip the player second
	if (!Player.IsNaked()) {
		CharacterNaked(Player);
		CurrentCharacter.Stage = "PunishStripBefore";
		CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "PunishStripBeforeIntro");
		return;
	}

	// Finds a valid punishment for the player
	let untestedPunishments = [...PrivatePunishmentList];
	if (PrivatePunishment) {
		CommonRemoveItemFromList(untestedPunishments, untestedPunishments.indexOf(PrivatePunishment));
	}
	testLoop: {
		while (untestedPunishments.length > 0) {
			PrivatePunishment = CommonRemoveRandomItemFromList(untestedPunishments) ?? null;
			switch (PrivatePunishment) {
				case "Bound": break testLoop;
				case "Cell": break testLoop;
				case "Cage": if (LogQuery("Cage", "PrivateRoom")) break testLoop; break;
				case "BoundPet": if (!Player.IsVulvaChaste() && (NPCTraitGet(CurrentCharacter, "Playful") >= 0)) break testLoop; break;
				case "ChastityBelt": if (!Player.IsVulvaChaste() && (NPCTraitGet(CurrentCharacter, "Frigid") >= 0)) break testLoop; break;
				case "ChastityBra": if (!Player.IsBreastChaste() && (NPCTraitGet(CurrentCharacter, "Frigid") >= 0)) break testLoop; break;
				case "ForceNaked": if (Player.CanChangeOwnClothes() && (NPCTraitGet(CurrentCharacter, "Horny") >= 0)) break testLoop; break;
				case "ConfiscateKey": if ((InventoryAvailable(Player, "MetalCuffsKey", "ItemMisc") || InventoryAvailable(Player, "MetalPadlockKey", "ItemMisc"))) break testLoop; break;
				case "ConfiscateCrop": if (InventoryAvailable(Player, "Crop", "ItemHandheld")) break testLoop; break;
				case "ConfiscateWhip": if (InventoryAvailable(Player, "Whip", "ItemHandheld")) break testLoop; break;
				case "SleepCage": if (LogQuery("Cage", "PrivateRoom") && !LogQuery("SleepCage", "Rule")) break testLoop; break;
				case "LockOut": if ((NPCTraitGet(CurrentCharacter, "Serious") >= 0)) break testLoop; break;
				case "OwnerLocks": if (Player.IsOwned() && InventoryHasLockableItems(Player)) break testLoop; break;
				case "Asylum": if ((ReputationGet("Asylum") < 0)) break testLoop; break;
			}
		}
	}

	// Starts the punishment
	CurrentCharacter.Stage = "Punish" + PrivatePunishment;
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "Punish" + PrivatePunishment + "Intro");

}

/**
 * Runs the currently selected player punishment.
 * @param {number} LoveFactor - Amount of love to be added or removed from the NPC.
 * @returns {void} - Nothing.
 */
function PrivateRunPunishment(LoveFactor) {
	if (!CurrentCharacter) return;
	NPCLoveChange(CurrentCharacter, LoveFactor);
	NPCEventAdd(CurrentCharacter, "RefusedActivity", CurrentTime);

	switch (PrivatePunishment) {
		case "Cage": Player.Cage = true; LogAdd("BlockCage", "Rule", CurrentTime + 120000); DialogLeave(); break;
		case "Bound": PrivateReleaseTimer = CommonTime() + 240000; CharacterFullRandomRestrain(Player, "ALL"); InventoryRemove(Player, "ItemArms"); InventoryWear(Player, "HempRope", "ItemArms"); InventorySetDifficulty(Player, "ItemArms", 12); break;
		case "BoundPet":{
			PrivateReleaseTimer = CommonTime() + 240000;
			PoseSetActive(Player, "Kneel", true);
			InventoryWear(Player, "LeatherBelt", "ItemLegs");
			InventoryWear(Player, "TailButtPlug", "ItemButt");
			InventoryWear(Player, CommonGetRandomItemFromList(["Ears1", "Ears2"]), "Hat");
			InventoryWear(Player, "LeatherArmbinder", "ItemArms");
			InventorySetDifficulty(Player, "ItemArms", 15);
			break;
		}
		case "ChastityBra":
			InventoryWear(Player, "MetalChastityBra", "ItemBreast");
			InventoryLock(Player, "ItemBreast", (Player.IsOwned() ? "OwnerPadlock" : "ExclusivePadlock"), CurrentCharacter);
			break;
		case "ForceNaked": LogAdd("BlockChange", "Rule", CurrentTime + 1800000); break;
		case "ConfiscateKey": InventoryConfiscateKey(); break;
		case "ConfiscateCrop": InventoryDelete(Player, "Crop", "ItemHandheld"); break;
		case "ConfiscateWhip": InventoryDelete(Player, "Whip", "ItemHandheld"); break;
		case "SleepCage": LogAdd("SleepCage", "Rule", CurrentTime + MS_PER_WEEK); break;
		case "LockOut": LogAdd("LockOutOfPrivateRoom", "Rule", CurrentTime + MS_PER_HOUR); DialogLeave(); CommonSetScreen("Room", "MainHall"); break;
		case "Cell": DialogLeave(); CharacterFullRandomRestrain(Player, "ALL"); CellLock(5); break;
		case "OwnerLocks": InventoryFullLock(Player, "OwnerPadlock"); break;
		case "Asylum": DialogLeave(); CharacterRelease(Player); AsylumEntranceWearPatientClothes(Player); AsylumEntranceCommitPatient(900000, 1); CommonSetScreen("Room", "AsylumEntrance"); break;
		case "ChastityBelt":
			if (NPCTraitGet(CurrentCharacter, "Horny") >= 0) {
				if (InventoryGet(Player, "ItemVulva") === null) InventoryWear(Player, "VibratingEgg", "ItemVulva");
				if (InventoryGet(Player, "ItemButt") === null) InventoryWear(Player, "BlackButtPlug", "ItemButt");
			}
			InventoryWearRandom(Player, "ItemPelvis", undefined, undefined, false, true, PrivateBeltList, true);
			InventoryLock(Player, "ItemPelvis", (Player.IsOwned() ? "OwnerPadlock" : "ExclusivePadlock"), CurrentCharacter);
			break;
	}
}

/**
 * Sets up the player collaring ceremony cutscene.
 * @returns {void} - Nothing.
 */
function PrivatePlayerCollaring() {
	if (!CurrentCharacter) return;
	NPCEventDelete(CurrentCharacter, "EndSubTrial");
	NPCEventAdd(CurrentCharacter, "PlayerCollaring", CurrentTime);
	InventoryRemove(Player, "ItemNeck");
	InventoryRemove(Player, "ItemNeckAccessories");
	InventoryRemove(Player, "ItemNeckRestraints");
	CharacterRelease(Player);
	PoseSetActive(Player, null);
	ReputationProgress("Dominant", -20);
	Player.Owner = "NPC-" + CurrentCharacter.Name;
	ServerPrivateCharacterSync();
	ServerPlayerSync();
	PlayerCollaringMistress = /** @type {NPCCharacter} */ (CurrentCharacter);
	CommonSetScreen("Cutscene", "PlayerCollaring");
	DialogLeave();
}

/**
 * Starts the D/s trial period with the player as the owner.
 * @param {number} TrialTime - amount of days the trial will go for.
 * @returns {void} - Nothing.
 */
function PrivateStartDomTrial(TrialTime) {
	if (!CurrentCharacter) return;
	DialogChangeReputation("Dominant", TrialTime);
	NPCEventAdd(CurrentCharacter, "EndDomTrial", CurrentTime + TrialTime * MS_PER_DAY);
	NPCLoveChange(CurrentCharacter, TrialTime * 5);
	ServerPrivateCharacterSync();
}

/**
 * Sets up the NPC collaring ceremony cutscene.
 * @returns {void} - Nothing.
 */
function PrivateNPCCollaring() {
	if (!CurrentCharacter) return;
	CharacterChangeMoney(Player, -100);
	NPCEventDelete(CurrentCharacter, "EndDomTrial");
	NPCEventAdd(CurrentCharacter, "NPCCollaring", CurrentTime);
	InventoryRemove(CurrentCharacter, "ItemNeck");
	CharacterRelease(Player);
	CharacterRelease(CurrentCharacter);
	PoseSetActive(Player, null);
	PoseSetActive(CurrentCharacter, null);
	ReputationProgress("Dominant", 10);
	CurrentCharacter.Owner = Player.Name;
	CurrentCharacter.Love = 100;
	NPCCollaringSub = /** @type {NPCCharacter} */ (CurrentCharacter);
	CommonSetScreen("Cutscene", "NPCCollaring");
	DialogLeave();
}

/**
 * Triggered when the player gets a NPC lover, it assigns the current character as one of the player's lovers.
 * @returns {void} - Nothing.
 */
function PrivateStartGirlfriend() {
	if (!CurrentCharacter) return;
	NPCEventAdd(CurrentCharacter, "Girlfriend", CurrentTime);
	CurrentCharacter.Lover = Player.Name;
	NPCLoveChange(CurrentCharacter, 20);
	Player.Lover = "NPC-" + CurrentCharacter.Name;
	ServerPlayerSync();
	ServerPrivateCharacterSync();
}

/**
 * Puts a wedding ring of a specified color on a specified character
 * @param {Character} C - The character that must wear the ring.
 * @param {BCColor} Color - The color of the ring #D0D000 is gold, #B0B0B0 is silver.
 * @returns {void} - Nothing.
 */
function PrivateWearRing(C, Color) {
	const item = InventoryWear(C, "Rings", "HandAccessoryRight", Color);
	if (item == null) return;
	ExtendedItemSetOptionByRecord(C, item, { r: 2 });
}

/**
 * Triggered when the player upgrades her NPC girlfriend to Fiancee
 * @returns {void} - Nothing.
 */
function PrivateStartFiancee() {
	if (!CurrentCharacter) return;
	NPCEventAdd(CurrentCharacter, "Fiancee", CurrentTime);
	NPCLoveChange(CurrentCharacter, 20);
	PrivateWearRing(Player, "#B0B0B0");
	PrivateWearRing(CurrentCharacter, "#B0B0B0");
	ServerPrivateCharacterSync();
}

/**
 * Triggered when the player upgrades her NPC fiancee to wife, gets two wedding items for free
 * @returns {void} - Nothing.
 */
function PrivateStartWife() {
	if (!CurrentCharacter) return;
	NPCEventAdd(CurrentCharacter, "NewCloth", CurrentTime);
	NPCEventAdd(CurrentCharacter, "Wife", CurrentTime);
	NPCLoveChange(CurrentCharacter, 20);
	InventoryAdd(Player, "WeddingDress1", "Cloth", true);
	InventoryAdd(Player, "WeddingVeil1", "HairAccessory1", true);
	NPCWeddingWife = /** @type {NPCCharacter} */ (CurrentCharacter);
	CommonSetScreen("Cutscene", "NPCWedding");
	DialogLeave();
}

/**
 * Processes a love change for a NPC.The NPC love can only reach 60 without a proper relationship, 100 if in a relationship.
 * @param {number} LoveFactor - Amount of love to gain or lose.
 * @returns {void} - Nothing.
 */
function PrivateNPCInteraction(LoveFactor) {
	if (!CurrentCharacter) return;
	CurrentCharacter.Love ??= 0;
	NPCLoveChange(CurrentCharacter, LoveFactor);
}

/**
 * Triggered when the slave market transation starts (10$ + 1$ per day for sold slave + 0% to 100% from the random auction, divide in 7 for rentals)
 * @param {"Rent" | "Sell"} AuctionType - Type of the auction to start.
 * @returns {void} - Nothing.
 */
function PrivateSlaveMarketStart(AuctionType) {
	if (!CurrentCharacter) return;
	if (AuctionType == "Rent") NPCEventAdd(CurrentCharacter, "SlaveMarketRent", CurrentTime + MS_PER_DAY);
	else InventoryRemove(CurrentCharacter, "ItemNeck");
	CharacterRelease(CurrentCharacter);
	CharacterNaked(CurrentCharacter);
	PoseSetActive(CurrentCharacter, "Kneel", true);
	NPCSlaveAuctionVendor = Player;
	NPCSlaveAuctionSlave = /** @type {NPCCharacter} */ (CurrentCharacter);
	NPCSlaveAuctionAmount = Math.floor((CurrentTime - NPCEventGet(CurrentCharacter, "NPCCollaring")) / MS_PER_DAY);
	if (NPCSlaveAuctionAmount > 90) NPCSlaveAuctionAmount = 90;
	if (NPCSlaveAuctionAmount < 0) NPCSlaveAuctionAmount = 0;
	NPCSlaveAuctionAmount = Math.round((10 + NPCSlaveAuctionAmount) * (1 + Math.random()));
	if (AuctionType == "Rent") NPCSlaveAuctionAmount = Math.round(NPCSlaveAuctionAmount / 7);
	CharacterChangeMoney(Player, NPCSlaveAuctionAmount);
	CommonSetScreen("Cutscene", "NPCSlaveAuction");
	if (AuctionType == "Sell") PrivateKickOut();
	else DialogLeave();
}

/**
 * Triggered when the player selects how to improve her slave.
 * @param {NPCTraitType} Type - Trait to improve.
 * @returns {void} - Nothing.
 */
function PrivateSlaveImproveSelect(Type) {
	PrivateSlaveImproveType = Type;
}

/**
 * Triggered when the player's slave is sent to the asylum to have a trait corrected. (The higher the value, the slower it raises)
 * @returns {void} - Nothing.
 */
function PrivateSlaveImproveSend() {
	if (!CurrentCharacter || !PrivateSlaveImproveType) return;
	CharacterChangeMoney(Player, -25);
	const T = NPCTraitGet(CurrentCharacter, PrivateSlaveImproveType);
	let N = T + 20 - Math.floor((T + 100) / 10);
	if (N < 0) {
		PrivateSlaveImproveType = NPCTraitReverse(PrivateSlaveImproveType);
		N = N * -1;
	}
	NPCTraitSet(CurrentCharacter, PrivateSlaveImproveType, N);
	NPCEventAdd(CurrentCharacter, "AsylumSent", CurrentTime + MS_PER_DAY);
	DialogLeave();
}

/**
 * Triggered when Amanda/Sarah/Sidney/Jennifer gives her college outfit to the player.
 * @returns {void} - Nothing.
 */
function PrivateGetCollegeClothes() {
	if (!CurrentCharacter) return;
	NPCLoveChange(CurrentCharacter, -10);
	InventoryAdd(Player, "CollegeOutfit1", "Cloth");
	InventoryAdd(Player, "CollegeSkirt", "ClothLower");
	const CharacterCloth = InventoryGet(CurrentCharacter, "Cloth");
	if (CharacterCloth && CharacterCloth.Asset.Name == "CollegeOutfit1") InventoryRemove(CurrentCharacter, "Cloth");
	const CharacterClothLower = InventoryGet(CurrentCharacter, "ClothLower");
	if (CharacterClothLower && CharacterClothLower.Asset.Name == "CollegeSkirt") InventoryRemove(CurrentCharacter, "ClothLower");
}

/**
 * Triggered when the player says "I love you" to her NPC girlfriend.
 * @returns {void} - Nothing.
 */
function PrivateLoveYou() {
	if (!CurrentCharacter) return;
	CurrentCharacter.Love ??= 0;
	// Once every minute, it will raise the love meter a little
	if (PrivateNextLoveYou < CurrentTime) {
		PrivateNextLoveYou = CurrentTime + MS_PER_MIN;
		NPCLoveChange(CurrentCharacter, Math.floor(Math.random() * 5) + 2);
	}

	// If the lover loves the player enough, she might start a random activity with her
	if (CurrentCharacter.Love >= Math.random() * 100) {

		// Finds a valid lover activity at random, some activities skip the loop and don't return any event
		/** @type {"" | AssetGroupItemName} */
		let Zone = "";
		/** @type {PrivateActivityType | undefined} */
		let Act;

		let untestedActivityList = [...PrivateLoverActivityList];
		if (PrivateLoverActivity) {
			CommonRemoveItemFromList(untestedActivityList, untestedActivityList.indexOf(PrivateLoverActivity));
		}

		testLoop:
		{
			while (untestedActivityList.length > 0) {
				Act = CommonRemoveRandomItemFromList(untestedActivityList);
				switch (Act) {
					case "Skip1":
					case "Skip2": return;
					case "Kiss": if (Player.CanTalk() && CurrentCharacter.CanTalk() && (!Player.Cage) && (!CurrentCharacter.Cage) && !Player.IsEnclose() && !CurrentCharacter.IsEnclose() && (NPCTraitGet(CurrentCharacter, "Horny") <= 33)) { Zone = "ItemMouth"; break testLoop; } break;
					case "FrenchKiss": if (Player.CanTalk() && CurrentCharacter.CanTalk() && (!Player.Cage) && (!CurrentCharacter.Cage) && !Player.IsEnclose() && !CurrentCharacter.IsEnclose() && (NPCTraitGet(CurrentCharacter, "Horny") >= -33)) { Zone = "ItemMouth"; break testLoop; } break;
					case "Caress": if (CharacterIsInUnderwear(Player) && CharacterIsInUnderwear(CurrentCharacter) && Player.CanInteract() && CurrentCharacter.CanInteract() && (!Player.Cage) && (!CurrentCharacter.Cage) && !Player.IsEnclose() && !CurrentCharacter.IsEnclose() && (NPCTraitGet(CurrentCharacter, "Horny") <= -33)) { Zone = "ItemTorso"; break testLoop; } break;
					case "Rub": if (CharacterIsInUnderwear(Player) && CharacterIsInUnderwear(CurrentCharacter) && Player.CanInteract() && CurrentCharacter.CanInteract() && (!Player.Cage) && (!CurrentCharacter.Cage) && !Player.IsEnclose() && !CurrentCharacter.IsEnclose() && (NPCTraitGet(CurrentCharacter, "Horny") >= -33)) { Zone = "ItemTorso"; break testLoop; } break;
					case "MasturbateHand": if (CharacterIsNaked(Player) && CharacterIsNaked(CurrentCharacter) && Player.CanInteract() && CurrentCharacter.CanInteract() && !Player.IsVulvaChaste() && !CurrentCharacter.IsVulvaChaste() && (!Player.Cage) && (!CurrentCharacter.Cage) && !Player.IsEnclose() && !CurrentCharacter.IsEnclose()) { Zone = "ItemVulva"; break testLoop; } break;
					case "MasturbateTongue": if (CharacterIsNaked(Player) && CharacterIsNaked(CurrentCharacter) && Player.CanTalk() && CurrentCharacter.CanTalk() && !Player.IsVulvaChaste() && !CurrentCharacter.IsVulvaChaste() && (!Player.Cage) && (!CurrentCharacter.Cage) && !Player.IsEnclose() && !CurrentCharacter.IsEnclose()) { Zone = "ItemVulva"; break testLoop; } break;
					case "MasturbatePlayer": if (CharacterIsNaked(Player) && CurrentCharacter.CanInteract() && !Player.IsVulvaChaste() && (!Player.Cage) && (!CurrentCharacter.Cage) && !Player.IsEnclose() && !CurrentCharacter.IsEnclose()) break testLoop; break;
					case "MasturbateSelf": if (CharacterIsNaked(CurrentCharacter) && CurrentCharacter.CanInteract() && !CurrentCharacter.IsVulvaChaste()) break testLoop; break;
					case "Underwear": if ((!CharacterIsInUnderwear(Player) || !CharacterIsInUnderwear(CurrentCharacter)) && Player.CanInteract() && CurrentCharacter.CanInteract()) break testLoop; break;
					case "Naked": if ((!CharacterIsNaked(Player) || !CharacterIsNaked(CurrentCharacter)) && Player.CanInteract() && CurrentCharacter.CanInteract()) break testLoop; break;
					case "EggInsert": if (CharacterIsNaked(Player) && CurrentCharacter.CanInteract() && !Player.IsVulvaChaste() && (!InventoryGet(Player, "ItemVulva")) && !CurrentCharacter.IsOwnedByPlayer() && (!Player.Cage) && (!CurrentCharacter.Cage) && !Player.IsEnclose() && !CurrentCharacter.IsEnclose()) break testLoop; break;
					case "LockBelt": if (CharacterIsNaked(Player) && CurrentCharacter.CanInteract() && !Player.IsVulvaChaste() && InventoryIsWorn(Player, "ItemVulva", "VibratingEgg") && !CurrentCharacter.IsOwnedByPlayer() && (NPCTraitGet(CurrentCharacter, "Dominant") >= 0) && (!Player.Cage) && (!CurrentCharacter.Cage) && !Player.IsEnclose() && !CurrentCharacter.IsEnclose()) break testLoop; break;
					case "UnlockBelt": {
						const item = InventoryGet(Player, "ItemPelvis");
						if (CharacterIsNaked(Player) && CurrentCharacter.CanInteract() && Player.IsVulvaChaste() && (InventoryGet(Player, "ItemPelvis")) && item && (InventoryGetLock(item)?.Asset.Name == "LoversPadlock") && (!Player.Cage) && (!CurrentCharacter.Cage) && !Player.IsEnclose() && !CurrentCharacter.IsEnclose())
							break testLoop;
						break;
					}
					case "EggSpeedUp": {
						const item = InventoryGet(Player, "ItemVulva");
						if (CurrentCharacter.CanInteract() && !CurrentCharacter.IsOwnedByPlayer() && InventoryIsWorn(Player, "ItemVulva", "VibratingEgg") && item && (item.Property?.Intensity ?? -1) < 3)
							break testLoop;
						break;
					}
					case "EggSpeedDown": {
						const item = InventoryGet(Player, "ItemVulva");
						if (CurrentCharacter.CanInteract() && !CurrentCharacter.IsOwnedByPlayer() && InventoryIsWorn(Player, "ItemVulva", "VibratingEgg") && item && (item.Property?.Intensity ?? -1) > -1)
							break testLoop;
						break;
					}
					case "Bed": if ((PrivateBedCount() == 1) && (NPCEventGet(CurrentCharacter, "NextBed") < CurrentTime) && PrivateBedActive() && (!Player.Cage) && (!CurrentCharacter.Cage)) break testLoop; break;
					case "LoverLock": if (CurrentCharacter.CanInteract() && !CurrentCharacter.IsOwnedByPlayer() && InventoryHasLockableItems(Player)) break testLoop; break;
					case "LoverUnlock": if (CurrentCharacter.CanInteract() && !CurrentCharacter.IsOwnedByPlayer() && InventoryCharacterHasLoverOnlyRestraint(Player)) break testLoop; break;
				}
			}
		}

		// For regular sexual activities
		PrivateLoverActivity = Act ?? null;
		if (
			Zone !== ""
			&& ((PrivateLoverActivity == "Kiss") || (PrivateLoverActivity == "FrenchKiss") || (PrivateLoverActivity == "Caress") || (PrivateLoverActivity == "Rub") || (PrivateLoverActivity == "MasturbateHand") || (PrivateLoverActivity == "MasturbateTongue"))
		) {
			ActivityEffect(CurrentCharacter, Player, PrivateLoverActivity, Zone);
			ActivityEffect(Player, CurrentCharacter, PrivateLoverActivity, Zone);
		}

		switch (PrivateLoverActivity){
			// When the NPC masturbates herself or the player
			case "MasturbatePlayer": ActivityEffect(CurrentCharacter, Player, "MasturbateHand", "ItemVulva"); break;
			case "MasturbateSelf": ActivityEffect(CurrentCharacter, CurrentCharacter, "MasturbateHand", "ItemVulva"); break;
			// When the NPC and players gets in undies or naked
			case "Underwear":  { CharacterUnderwear(Player, Player.Appearance); CharacterUnderwear(CurrentCharacter, CurrentCharacter.Appearance); } break;
			case "Naked":  { CharacterNaked(Player); CharacterNaked(CurrentCharacter); } break;
			// When the NPC equips an egg or a belt on the player
			case "EggInsert":  {
				const item = InventoryWear(Player, "VibratingEgg", "ItemVulva");
				if (item) {
					VibratorModeSetOptionByName(Player, item, VibratorMode.LOW);
				}
				break;
			}
			case "LockBelt":
				InventoryWearRandom(Player, "ItemPelvis", undefined, undefined, false, true, PrivateBeltList, true);
				InventoryLock(Player, "ItemPelvis", "LoversPadlock", CurrentCharacter);
				break;
			case "UnlockBelt":  InventoryRemove(Player, "ItemPelvis"); break;
			case "LoverLock":  InventoryFullLock(Player, "LoversPadlock"); break;
			case "LoverUnlock":  CharacterReleaseFromLock(Player, "LoversPadlock"); break;
			// When the NPC plays with the egg speed
			case "EggSpeedUp":
			case "EggSpeedDown": {
				const egg = InventoryGet(Player, "ItemVulva");
				if (egg) {
					const newMode = VibratorModeIntensityIncrement(
						(egg.Property && egg.Property.Mode) || VibratorMode.OFF,
						PrivateLoverActivity == "EggSpeedDown",
					);
					VibratorModeSetOptionByName(Player, egg, newMode);
				}
				break;
			}
			// When the NPC lover enters the bed, waiting for the player
			case "Bed":
				PrivateEnterBed();
				if (CurrentCharacter.Stage == "0") CurrentCharacter.Stage = "70";
				if (CurrentCharacter.Stage == "1000") CurrentCharacter.Stage = "1070";
				if (CurrentCharacter.Stage == "2000") CurrentCharacter.Stage = "2095";
				break;
		}

		// Shows the activity text dialog and raise the love a little
		CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "LoverActivity" + PrivateLoverActivity);
		NPCLoveChange(CurrentCharacter, Math.floor(Math.random() * 3) + 1);

	}

}

/**
 * Triggered when the player starts turning the tables on her NPC owner.  The player stands up.
 * @returns {void} - Nothing.
 */
function PrivatePlayerTurnTablesStart() {
	PoseSetActive(Player, null);
	PrivateNPCInteraction(-5);
}

/**
 * Triggered when the player turns the table with her owner but only removes her collar
 * @returns {void} - Nothing.
 */
function PrivatePlayerTurnTablesRemove() {
	if (!CurrentCharacter) return;
	PrivateNPCInteraction(-20);
	NPCEventDelete(CurrentCharacter, "EndSubTrial");
	ManagementReleaseFromOwner(8);
}

/**
 * Triggered when the player turns the table with her owner and transfer her collar
 * @returns {void} - Nothing.
 */
function PrivatePlayerTurnTablesCollar() {
	if (!CurrentCharacter) return;
	PrivateNPCInteraction(10);
	ManagementReleaseFromOwner(15);
	NPCEventDelete(CurrentCharacter, "EndSubTrial");
	NPCEventAdd(CurrentCharacter, "NPCCollaring", CurrentTime);
	CurrentCharacter.Owner = Player.Name;
	InventoryWear(CurrentCharacter, "SlaveCollar", "ItemNeck");
	ServerPrivateCharacterSync();
}

/**
 * Triggered when the sub starts to the turn the tables against the player
 * @returns {void} - Nothing.
 */
function PrivateSubTurnTablesStart() {
	if (!CurrentCharacter) return;
	PoseSetActive(CurrentCharacter, null);
	PrivateNPCInteraction(-3);
}

/**
 * Triggered when the sub turns the table on the player
 * @returns {void} - Nothing.
 */
function PrivateSubTurnTablesDone() {
	if (!CurrentCharacter) return;

	// Clears the submissive ownership
	NPCEventDelete(CurrentCharacter, "EndSubTrial");
	NPCEventDelete(CurrentCharacter, "NPCCollaring");
	CurrentCharacter.Owner = "";
	InventoryRemove(CurrentCharacter, "ItemNeck");
	InventoryRemove(CurrentCharacter, "ItemNeckAccessories");
	InventoryRemove(CurrentCharacter, "ItemNeckRestraints");
	PrivateNPCInteraction(10);
	ServerPrivateCharacterSync();

	// The submissive becomes the player owner and the player gets collared
	NPCEventAdd(CurrentCharacter, "PlayerCollaring", CurrentTime);
	ReputationProgress("Dominant", -20);
	InventoryRemove(Player, "ItemNeck");
	InventoryRemove(Player, "ItemNeckAccessories");
	InventoryRemove(Player, "ItemNeckRestraints");
	InventoryWear(Player, "SlaveCollar", "ItemNeck");
	Player.Owner = "NPC-" + CurrentCharacter.Name;
	ServerPrivateCharacterSync();
	ServerPlayerSync();

}

/**
 * When the player triggers a cheat on a NPC
 * @param {"TraitDominant" | "TraitSubmissive"} Type
 * @returns {void} - Nothing.
 */
function PrivateNPCCheat(Type) {
	if (!CurrentCharacter) return;
	if (Type == "TraitDominant") NPCTraitSet(CurrentCharacter, "Dominant", (NPCTraitGet(CurrentCharacter, "Dominant") >= 90) ? 100 : NPCTraitGet(CurrentCharacter, "Dominant") + 10);
	if (Type == "TraitSubmissive") NPCTraitSet(CurrentCharacter, "Dominant", (NPCTraitGet(CurrentCharacter, "Dominant") <= -90) ? -100 : NPCTraitGet(CurrentCharacter, "Dominant") - 10);
}

/**
 * Get a bed from the NPC vendor
 * @param {"White" | "Black" | "Pink"} Type - The bed type (White or Black for now)
 * @returns {void} - Nothing.
 */
function PrivateGetBed(Type) {
	if (Type == null) return;
	CharacterChangeMoney(Player, -150);
	LogDelete("BedWhite", "PrivateRoom");
	LogDelete("BedBlack", "PrivateRoom");
	LogDelete("BedPink", "PrivateRoom");
	LogAdd(`Bed${Type}`, "PrivateRoom");
}

/**
 * When the player exits the private room
 * @type {ScreenExitHandler}
 */
function PrivateExit() {
	if (!CurrentCharacter) {
		if (PrivateCharacter.length >= 2) ServerPrivateCharacterSync();
		PrivateEntryEvent = true;
		CommonSetScreen("Room", "MainHall");
	}
}

/**
 * When the player joins the NPC in bed
 * @returns {void} - Nothing.
 */
function PrivateJoinInBed() {
	DialogLeave();
	CommonSetScreen("Room", "PrivateBed");
}

/**
 * When the NPC enters the bed
 * @returns {void} - Nothing.
 */
function PrivateEnterBed() {
	if (!CurrentCharacter) return;
	NPCEventAdd(CurrentCharacter, "NextBed", CurrentTime + 300000 + Math.round(Math.random() * 300000) + NPCTraitGet(CurrentCharacter, "Frigid") * 3000);
	CurrentCharacter.PrivateBed = true;
}

/**
 * Horny NPCs will randomly be in the character bed when the player enters her private room (20% odds).
 * @returns {void} - Nothing.
 */
function PrivateRandomBed() {
	if (!PrivateEntryEvent) return; // Only when the player enters from the main hall
	if (!PrivateBedActive()) return; // Only if the bed is purchased
	for (let C of PrivateCharacter)
		if ((NPCEventGet(C, "SlaveMarketRent") <= CurrentTime) && (NPCEventGet(C, "AsylumSent") <= CurrentTime) && (NPCEventGet(C, "NPCBrainwashing") <= CurrentTime) && (NPCEventGet(C, "Kidnap") <= CurrentTime)) { // Only if not already occupied
			if (C.IsNpc() && (!C.Cage) && (Math.random() < 0.2) && (PrivateBedCount() <= 3) && (NPCTraitGet(C, "Horny") > 0) && (NPCEventGet(C, "NextBed") < CurrentTime)) {
				CurrentCharacter = C;
				PrivateEnterBed();
				DialogLeave();
			}
		}
}

/**
 * Returns the Club Card Deck that will be used by the NPC
 * @param {Character} C
 * @returns {number[]} - The Deck to useRule
 */
function PrivateGetClubCardDeck(C) {

	// Special characters and special titles will return fixed decks
	if (["Amanda", "Sarah", "Sidney", "Sarah", "Jennifer", "Julia", "Yuki", "Mildred"].includes(C.Name) ) return ClubCardBuilderCollegeDeck;
	if ((C.Title === "Mistress") || (C.Title == "Dominatrix")) return ClubCardBuilderDominantDeck;
	if (C.Title === "Maid") return ClubCardBuilderMaidDeck;

	// The deck will be chosen based on NPC traits
	let Horny = NPCTraitGet(C, "Horny");
	let Dominant = NPCTraitGet(C, "Dominant");
	let Playful = NPCTraitGet(C, "Playful");
	let Violent = NPCTraitGet(C, "Violent");
	let Wise = NPCTraitGet(C, "Wise");
	if ((Horny > 0) && (Horny >= Dominant) && (Horny >= Playful) && (Horny >= Violent) && (Horny >= Wise)) return ClubCardBuilderPornDeck;
	if ((Dominant > 0) && (Dominant >= Horny) && (Dominant >= Playful) && (Dominant >= Violent) && (Dominant >= Wise)) return ClubCardBuilderDominantDeck;
	if ((Playful > 0) && (Playful >= Horny) && (Playful >= Dominant) && (Playful >= Violent) && (Playful >= Wise)) return ClubCardBuilderABDLDeck;
	if ((Violent > 0) && (Violent >= Horny) && (Violent >= Dominant) && (Violent >= Playful) && (Violent >= Wise)) return ClubCardBuilderLiabilityDeck;
	if ((Wise > 0) && (Wise >= Horny) && (Wise >= Dominant) && (Wise >= Playful) && (Wise >= Violent)) return ClubCardBuilderAsylumDeck;

	// If no deck could be found, we return the default one
	return ClubCardBuilderDefaultDeck;

}

/**
 * When the club card game against a friend NPC starts
 * @returns {void} - Nothing
 */
function PrivateClubCardVsCharacterStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, PrivateGetClubCardDeck(CurrentCharacter), () => { PrivateClubCardVsCharacterEnd(); });
}

/**
 * When the club card game against a friend NPC ends
 * @returns {SafePromise<void>}
 */
async function PrivateClubCardVsCharacterEnd() {
	if (!ClubCardOpponent) return;
	await CommonSetScreen("Room", "Private");
	CharacterSetCurrent(ClubCardOpponent);
	if (!CurrentCharacter) return;
	if (CurrentCharacter.IsOwner()) {
		CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, MiniGameVictory ? "ClubCardVsOwnerVictory" : "ClubCardVsOwnerDefeat");
		CurrentCharacter.Stage = MiniGameVictory ? "1110" : "1120";
	} else if (CurrentCharacter.IsOwnedByPlayer()) {
		CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, MiniGameVictory ? "ClubCardVsSubVictory" : "ClubCardVsSubDefeat");
		CurrentCharacter.Stage = MiniGameVictory ? "2110" : "2120";
	} else {
		CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, MiniGameVictory ? "ClubCardVsFriendVictory" : "ClubCardVsFriendDefeat");
		CurrentCharacter.Stage = MiniGameVictory ? "110" : "120";
	}
	if (MiniGameVictory) {
		CurrentCharacter.AllowItem = true;
		PrivateClubCardVictoryMode = true;
	}
	PrivateNPCInteraction(5);
}

/**
 * When the club card game against an owner NPC starts
 * @deprecated
 * @returns {void} - Nothing
 */
function PrivateClubCardVsOwnerStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, PrivateGetClubCardDeck(CurrentCharacter), () => { PrivateClubCardVsCharacterEnd(); });
}

/**
 * When the club card game against an owner NPC ends
 * @deprecated
 * @returns {void} - Nothing
 */
function PrivateClubCardVsOwnerEnd() {
	PrivateClubCardVsCharacterEnd();
}

/**
 * When the club card game against a submissive NPC starts
 * @deprecated
 * @returns {void} - Nothing
 */
function PrivateClubCardVsSubStart() {
	if (!CurrentCharacter) return;
	ClubCardStart(CurrentCharacter, PrivateGetClubCardDeck(CurrentCharacter), () => { PrivateClubCardVsCharacterEnd(); });
}

/**
 * When the club card game against a submissive NPC ends
 * @deprecated
 * @returns {void} - Nothing
 */
function PrivateClubCardVsSubEnd() {
	PrivateClubCardVsCharacterEnd();
}

/**
 * When the club card game victory mode ends
 * @returns {void} - Nothing
 */
function PrivateEndClubCardVictoryMode() {
	PrivateClubCardVictoryMode = false;
}

/**
 * When the NPC does an activity on the player after winning at club card
 * @returns {void} - Nothing
 */
function PrivateClubCardDefeatActivity() {
	if (!CurrentCharacter) return;

	// First, we find a valid activity / consequence to do (Bound will always work)
	let Act = "";
	while (Act == "") {
		Act = CommonRandomItemFromList("", PrivateClubCardDefeatConsequence);
		switch (Act) {
			case "Cage": if (!LogQuery("Cage", "PrivateRoom") || (NPCTraitGet(CurrentCharacter, "Dominant") < 0)) Act = ""; break;
			case "BoundPet": if (NPCTraitGet(CurrentCharacter, "Playful") < 0) Act = ""; break;
			case "Shibari": if (NPCTraitGet(CurrentCharacter, "Wise") < 0) Act = ""; break;
			case "ForceNaked": if (!Player.CanChangeOwnClothes() || (NPCTraitGet(CurrentCharacter, "Horny") < 0)) Act = ""; break;
			case "Chastity": if (Player.IsChaste() || (NPCTraitGet(CurrentCharacter, "Frigid") < 0)) Act = ""; break;
			case "Orgasm": if (Player.IsChaste() || (NPCTraitGet(CurrentCharacter, "Horny") < 0)) Act = ""; break;
			case "Spank": if (NPCTraitGet(CurrentCharacter, "Violent") < 0) Act = ""; break;
			case "Tickle": if (NPCTraitGet(CurrentCharacter, "Playful") < 0) Act = ""; break;
		}
	}

	// Starts the activity
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "ClubCardConsequence" + Act + "Intro");
	CurrentCharacter.Stage = "ClubCardConsequence" + Act + "0";

}

/**
 * The consequence activity to do
 * @param {"Cage" | "Bound" | "BoundPet" | "Shibari" | "ForceNaked" | "Chastity" | "Orgasm" | "Tickle" | "Spank"} Act - The activity to do
 * @param {number} [LoveFactor] - The love to change
 * @returns {void} - Nothing.
 */
function PrivateClubCardDoConsequence(Act, LoveFactor) {
	if (!CurrentCharacter) return;

	// Do the activity
	switch (Act) {
		case "Cage": {
			Player.Cage = true;
			LogAdd("BlockCage", "Rule", CurrentTime + 150000);
			break;
		}
		case "Bound": {
			PrivateReleaseTimer = CommonTime() + 300000;
			if (NPCTraitGet(CurrentCharacter, "Playful") > 0) CharacterFullRandomRestrain(Player, "FEW");
			else if (NPCTraitGet(CurrentCharacter, "Playful") === 0) CharacterFullRandomRestrain(Player);
			else if (NPCTraitGet(CurrentCharacter, "Serious") > 0) CharacterFullRandomRestrain(Player, "LOT");
			InventorySetDifficulty(Player, "ItemArms", 12);
			break;
		}
		case "BoundPet": {
			PrivateReleaseTimer = CommonTime() + 300000;
			InventoryRemove(Player, "ItemLegs");
			InventoryRemove(Player, "ItemFeet");
			InventoryRemove(Player, "Hat");
			InventoryRemove(Player, "HairAccessory2");
			InventoryRemove(Player, "HairAccessory3");
			InventoryWearRandom(Player, "ItemMouth");
			InventoryWear(Player, CommonRandomItemFromList("", ["BitchSuit", "ShinyPetSuit"]), "ItemArms");
			InventoryWear(Player, "PuppyEars1", "HairAccessory1");
			InventoryWear(Player, "PuppyTailPlug", "ItemButt");
			InventorySetDifficulty(Player, "ItemArms", 12);
			break;
		}
		case "Shibari": {
			PrivateReleaseTimer = CommonTime() + 300000;
			CharacterNaked(Player);
			PoseSetActive(Player, null);
			InventoryRemove(Player, "ItemHood");
			InventoryRemove(Player, "ItemHead");
			ShibariRandomBondage(Player, 3);
			InventoryWearRandom(Player, "ItemMouth");
			InventorySetDifficulty(Player, "ItemArms", 12);
			break;
		}
		case "ForceNaked": {
			LogAdd("BlockChange", "Rule", CurrentTime + 1800000);
			CharacterNaked(Player);
			break;
		}
		case "Chastity": {
			CharacterNaked(Player);
			InventoryWear(Player, "MetalChastityBra", "ItemBreast");
			InventoryLock(Player, "ItemBreast", "ExclusivePadlock", CurrentCharacter);
			InventoryWearRandom(Player, "ItemPelvis", undefined, undefined, false, true, PrivateBeltList, true);
			InventoryLock(Player, "ItemPelvis", "ExclusivePadlock", CurrentCharacter);
			break;
		}
	}

	// Applies a change to the NPC love if needed
	if (LoveFactor != null) {
		PrivateNPCInteraction(LoveFactor);
	}

	// Returns to the base stage for the NPC and exits dialog for most consequences
	CurrentCharacter.Stage = CurrentCharacter.IsOwnedByPlayer() ? "2000" : (CurrentCharacter.IsOwner() ? "1000" : "0");
	DialogLeave();

}

/**
 * Do the spanking club card consequence on the player
 * @param {ExpressionName} Eyes - The eye experssion to apply
 * @param {"Underwear" | "Naked"} [Strip] - Underwear, Naked or NULL to strip the player or not
 * @returns {void} - Nothing.
 */
function PrivateClubCardKinkyConsequence(Eyes, Strip) {
	if (Strip === "Underwear") CharacterUnderwear(Player, Player.Appearance);
	if (Strip === "Naked") CharacterNaked(Player);
	CharacterSetFacialExpression(Player, "Blush", "Medium", 5);
	CharacterSetFacialExpression(Player, "Eyes", Eyes, 5);
	CharacterSetFacialExpression(Player, "Eyes2", Eyes, 5);
}

/**
 * Checks if the player owns a private room, there's a spot left and they're not locked out of it.
 */
function PrivateHasEmptySlot() {
	return LogQuery("RentRoom", "PrivateRoom") && (PrivateCharacter.length < PrivateCharacterMax) && !LogQuery("LockOutOfPrivateRoom", "Rule");
}

/**
 * Resets the possible gifts given by NPCs
 */
function PrivateGiftReset() {
	PrivateGiftRegular = PrivateGetPossibleGift(false);
	PrivateGiftRestraint = PrivateGetPossibleGift(true);
}

/**
 * Gives the NPC gift to the player, a new gift will come between 1 and 6 days
 * @param {string} GiftType - Regular or Restraint
 * @returns {void} - Nothing.
 */
function PrivateGiftGet(GiftType) {
	if (!CurrentCharacter) return;
	let Gift = (GiftType == "Regular") ? PrivateGiftRegular : PrivateGiftRestraint;
	if (!Gift) return;
	if (Gift.BuyGroup) {
		for (let A of Asset)
			if (A.BuyGroup === Gift.BuyGroup)
				InventoryAdd(Player, A.Name, A.Group.Name, false);
	} else {
		InventoryAdd(Player, Gift.Name, Gift.Group.Name, false);
	}
	ServerPlayerInventorySync();
	CurrentCharacter.CurrentDialog = CurrentCharacter.CurrentDialog.replace("GIFTNAME", Gift.Description);
	NPCEventAdd(CurrentCharacter, "NextGift", Math.floor(CurrentTime + MS_PER_DAY + Math.random() * 432000000));
}

/**
 * Uses the NPC gift on the player
 * @param {string} GiftType - Regular or Restraint
 * @returns {void} - Nothing.
 */
function PrivateGiftUse(GiftType) {
	let Gift = (GiftType == "Regular") ? PrivateGiftRegular : PrivateGiftRestraint;
	if ((Gift != null) && (Gift.BuyGroup == null)) InventoryWear(Player, Gift.Name, Gift.Group.Name);
	if ((Gift != null) && (Gift.BuyGroup != null))
		for (let A of Asset)
			if (A.BuyGroup === Gift.BuyGroup)
				InventoryWear(Player, A.Name, A.Group.Name);
	PrivateGiftReset();
}

/**
 * When the player meets her owner randomly in the main hall
 * @returns {void} - Nothing.
 */
function PrivateOwnerInMainHall() {

	// Finds the player owner
	let Owner = null;
	for (let C of PrivateCharacter)
		if (!C.IsPlayer() && C.IsOwner())
			Owner = C;
	if (Owner == null) return;
	if (!Owner.CanInteract()) return;

	// Loads the owner NPC random meeting dialog
	CommonSetScreen("Room", "Private");
	PrivateBackground = "MainHall";
	NPCTraitDialog(Owner);
	CharacterRelease(Owner);
	PrivateNewCloth(Owner);
	CharacterSetCurrent(Owner);
	Owner.Stage = "MeetOwnerInMainHall0";
	Owner.CurrentDialog = DialogFind(Owner, "MeetOwnerInMainHallIntro");

}

/**
 * The owner can ungag the player and it can affect the love factor
 * @param {number} LoveFactor - Amount of love to gain or lose.
 * @returns {void} - Nothing.
 */
function PrivatePlayerUngag(LoveFactor) {
	PrivateNPCInteraction(LoveFactor);
	InventoryRemove(Player, "ItemMouth");
	InventoryRemove(Player, "ItemMouth2");
	InventoryRemove(Player, "ItemMouth3");
	InventoryRemove(Player, "ItemHead");
	InventoryRemove(Player, "ItemHood");
}

/**
 * The owner can do some activities with the player from the main hall
 * @returns {void} - Nothing.
 */
function PrivateStartOwnerHallActivity() {
	if (!CurrentCharacter) return;
	let Activity = CommonGetRandomItemFromList(["BringToPrivate", "NudeParade", "Bondage"]);
	CurrentCharacter.Stage = `MeetOwnerInMainHall${Activity}0`;
	CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "MeetOwnerInMainHall" + Activity + "Intro");
}

/**
 * Owner in Main Hall - When the player returns to her private room with her owner
 * @returns {void} - Nothing.
 */
function PrivateOwnerHallReturnToPrivate() {
	PrivateBackground = Player.VisualSettings.PrivateRoomBackground ?? "Private";
}

/**
 * Owner in Main Hall - Restrains the player with a factor
 * @param {"FEW"|"LOT"|"ALL"} [BondageType] - The type of bondage to apply
 * @returns {void} - Nothing.
 */
function PrivateOwnerHallBondage(BondageType) {
	CharacterFullRandomRestrain(Player, BondageType);
	CommonSetScreen("Room", "MainHall");
	PrivateBackground = "Private";
}

/**
 * Owner in Main Hall - Strips the player
 * @returns {void} - Nothing.
 */
function PrivateOwnerHallNaked() {
	CharacterRelease(Player);
	CharacterNaked(Player);
	CharacterSetFacialExpression(Player, "Blush", "Medium", 10);
}

/**
 * Owner in Main Hall - Change collar and leash the player
 * @returns {void} - Nothing.
 */
function PrivateOwnerHallLeash() {
	let Item = InventoryGet(Player, "ItemNeck");
	if (Item !== null) {
		let NewProperty = Item.Property;
		while (NewProperty == Item.Property)
			Item.Property = CommonCloneDeep(CommonGetRandomItemFromList(InventoryItemNeckSlaveCollarTypes).Property);
		CharacterRefresh(Player, true);
	}
	CharacterSetFacialExpression(Player, "Eyes", "Sad", 10);
	CharacterSetFacialExpression(Player, "Eyes2", "Sad", 10);
	InventoryWear(Player, "ChainLeash", "ItemNeckRestraints");
}

/**
 * Owner in Main Hall - Changes the background and can bind/gag the player
 * @param {string} Background - The new background to setup
 * @param {string} Action - The action to perform
 * @returns {void} - Nothing.
 */
function PrivateOwnerHallBackground(Background, Action) {
	if (Background == "") Background = "MainHall";
	PrivateBackground = Background;
	if (Action === "Bind") {
		PrivateNPCInteraction(-3);
		InventoryWearRandom(Player, "ItemMouth");
		InventoryWearRandom(Player, "ItemArms");
		CharacterSetFacialExpression(Player, "Blush", "Medium", 10);
		CharacterSetFacialExpression(Player, "Eyes", "Angry", 10);
		CharacterSetFacialExpression(Player, "Eyes2", "Angry", 10);
	}
}

/**
 * Owner in Main Hall - Ends the parade and can do an extra action
 * @param {string} Action - The action to perform
 * @returns {void} - Nothing.
 */
function PrivateOwnerHallParadeEnd(Action) {
	CommonSetScreen("Room", "MainHall");
	PrivateBackground = "Private";
	InventoryRemove(Player, "ItemNeckRestraints");
	if (Action === "Release") {
		PrivateNPCInteraction(3);
		InventoryRemove(Player, "ItemMouth");
		InventoryRemove(Player, "ItemArms");
	}
	if (Action === "Lock") {
		PrivateNPCInteraction(-3);
		PrivateBlockChange(15);
	}
}

/**
 * Check whether the Private room has an NPC with that name in it
 * @param {string} name
 */
function PrivateCharacterIsInRoom(name) {
	return PrivateCharacter.some(c => c.IsNpc() && c.Name === name);
}
