"use strict";
var FuturisticChastityBeltShockCooldownOrgasm = 15000; // 15 sec

/** @type {AssetGroupItemName[]} */
var InventoryItemPelvisFuturisticChastityBeltTamperZones = [
	"ItemPelvis",
	"ItemButt",
	"ItemVulva",
];

/**
 * @param {Item} Item
 */
function InventoryFuturisticChastityBeltCheckPunish(Item) {
	// Punish the player if they try to mess with the groin area
	const typeRecord = (Item.Property && Item.Property.TypeRecord) || {};
	const tamperType = typeRecord.t || 0;
	const orgasmType = typeRecord.o || 0;

	Item.Property ??= {};
	if (
		(Item.Property.PunishStruggle || (tamperType === 1 || tamperType == 2))
		&& Player.FocusGroup
		&& (StruggleProgress >= 0 || StruggleLockPickProgressCurrentTries > 0)
		&& StruggleProgressPrevItem != null
		&& StruggleProgressStruggleCount > 0
	) {
		let inFocus = false;
		for (const zone of InventoryItemPelvisFuturisticChastityBeltTamperZones)
			if (Player.FocusGroup.Name == zone)
				inFocus = true;

		if (inFocus) {
			return "Struggle";
		}
	}

	// Punish the player if they struggle anywhere
	if (
		(Item.Property.PunishStruggleOther || tamperType == 2)
		&& Player.FocusGroup
		&& StruggleProgressPrevItem != null
		&& StruggleProgressStruggleCount > 0
		&& (StruggleProgress > 50 || StruggleLockPickProgressCurrentTries > 2)
	) {
		return "StruggleOther";
	}

	// Punish the player if they orgasm
	if (
		(Item.Property.NextShockTime ?? 0) - CurrentTime <= 0
		&& (Item.Property.PunishOrgasm || orgasmType === 1)
		&& Player.ArousalSettings.OrgasmStage > 1
	) {
		// Punish the player if they orgasm
		return "Orgasm";
	}
	return "";
}

/**
 * @param {DynamicScriptCallbackData<FuturisticChastityBeltPersistentData>} data
 */
function AssetsItemPelvisFuturisticChastityBeltScriptUpdatePlayer(data) {
	const Item = data.Item;
	Item.Property ??= {};

	const punishment = InventoryFuturisticChastityBeltCheckPunish(Item);
	if (punishment) {
		if (punishment == "Orgasm") {
			AssetsItemPelvisFuturisticChastityBeltScriptTrigger(Player, Item, "Orgasm");
			Item.Property.NextShockTime = CurrentTime + FuturisticChastityBeltShockCooldownOrgasm; // Difficult to have two orgasms in 10 seconds
		} else if (punishment == "StruggleOther") {
			AssetsItemPelvisFuturisticChastityBeltScriptTrigger(Player, Item, "StruggleOther");
			StruggleProgressStruggleCount = 0;
			StruggleProgress = 0;
			DialogLeaveDueToItem = true;
		} else if (punishment == "Struggle") {
			AssetsItemPelvisFuturisticChastityBeltScriptTrigger(Player, Item, "Struggle");
			StruggleProgressStruggleCount = 0;
			DialogLeaveDueToItem = true;
		}
	}
}

/**
 * Trigger a shock automatically
 * @param {Character} C
 * @param {Item} Item
 * @param {string} ShockType
 * @param {string} [ReplacementWord]
 * @param {boolean} [NoShock]
 */
function AssetsItemPelvisFuturisticChastityBeltScriptTrigger(C, Item, ShockType, ReplacementWord, NoShock) {
	if (!ServerPlayerIsInChatRoom()) {
		if (!NoShock)
			AudioPlayInstantSound("Audio/Shocks.mp3");
		InventoryShockExpression(C);
	} else {
		const Dictionary = new DictionaryBuilder()
			.asset(Item.Asset, "AssetName", Item.Craft && Item.Craft.Name)
			.destinationCharacterName(C)
			.destinationCharacter(C)
			.sourceCharacter(C)
			.focusGroup(Item.Asset.Group.Name)
			.markAutomatic()
			.if(!!ReplacementWord)
			.text("ReplacementWord", /** @type {string} */ (ReplacementWord))
			.endif()
			.if(!NoShock)
			.shockIntensity(2)
			.endif()
			.build();

		/** @type {string} */
		let ShockPhrase;
		if (NoShock) {
			ShockPhrase = "Punish";
		} else {
			ShockPhrase = "Shock";
			Dictionary.push({ ActivityName: "ShockItem" });
			InventoryShockExpression(C);
		}

		if (Item.Property && Item.Property.ShowText) {
			ServerSend("ChatRoomChat", {
				Content: `FuturisticChastityBelt${ShockPhrase}${ShockType}`,
				Type: "Action",
				Dictionary,
			});
		} else {
			ChatRoomMessage({
				Content: `FuturisticChastityBelt${ShockPhrase}${ShockType}`,
				Type: "Action",
				Sender: Player.MemberNumber,
				Dictionary,
			});
		}
	}
}

/**
 * @typedef {{ UpdateTime?: number, LastMessageLen?: number } & AnimationPersistentData} FuturisticChastityBeltPersistentData
 */

/** @type {ExtendedItemCallbacks.ScriptDraw<FuturisticChastityBeltPersistentData>} */
function AssetsItemPelvisFuturisticChastityBeltScriptDraw(data) {
	var persistentData = data.PersistentData();
	/** @type {ItemProperties} */
	var property = (data.Item.Property = data.Item.Property || {});
	if (typeof persistentData.UpdateTime !== "number") persistentData.UpdateTime = CommonTime() + 4000;
	if (typeof persistentData.LastMessageLen !== "number") persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
	if (typeof property.NextShockTime !== "number") property.NextShockTime = 0;


	if (persistentData.UpdateTime < CommonTime() && data.C == Player) {

		if (CommonTime() > property.NextShockTime) {
			AssetsItemPelvisFuturisticChastityBeltScriptUpdatePlayer(data);
			persistentData.LastMessageLen = (ChatRoomLastMessage) ? ChatRoomLastMessage.length : 0;
		}

		var timeToNextRefresh = 950;
		persistentData.UpdateTime = CommonTime() + timeToNextRefresh;
		AnimationRequestRefreshRate(data.C, 5000 - timeToNextRefresh);
		AnimationRequestDraw(data.C);
	}
}
