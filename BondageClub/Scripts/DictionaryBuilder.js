"use strict";

/**
 * Build class for chat message dictionaries
 */
class DictionaryBuilder {
	/**
	 * Constructs a new DictionaryBuilder instance
	 */
	constructor() {
		/** @type {ChatMessageDictionaryEntry[]} */
		this._entries = [];
		/** @type {DictionaryBuilder[]} */
		this._children = [];
		this._targetIndex = 0;
		/** @type {boolean} */
		this._condition = true;
	}

	/**
	 * Creates and enters a child {@link ConditionalDictionaryBuilder}, whose entries are only added if the provided
	 * condition is truthy.
	 * @param {boolean} condition - The condition to check
	 * @returns {ConditionalDictionaryBuilder} - The child {@link ConditionalDictionaryBuilder} instance
	 */
	if(condition) {
		const child = new ConditionalDictionaryBuilder(this, condition);
		this._children.push(child);
		return child;
	}

	/**
	 * Constructs a dictionary array from the data passed to this instance.
	 * @returns {ChatMessageDictionaryEntry[]} - The constructed dictionary
	 */
	build() {
		let entries = this._entries.slice();
		for (const child of this._children) {
			entries.push(...child.build());
		}
		return entries;
	}

	/**
	 * Adds a SourceCharacter dictionary entry
	 * @param {Character} character - The character which should be referenced by the SourceCharacter entry
	 * @returns {this}
	 */
	sourceCharacter(character) {
		if (!this._condition || !(character.IsOnline() || character.IsPlayer())) return this;
		/** @type {SourceCharacterDictionaryEntry} */
		const entry = { SourceCharacter: character.MemberNumber };
		if (character.IsPlayer() && ChatRoomMapViewHasSuperPowers() && ChatRoomMapViewIsActive()) {
			entry.HasSuperPowers = true;
		}
		this._addEntry(entry);
		return this;
	}

	/**
	 * Adds a DestinationCharacter dictionary entry
	 * @param {Character} character - The character which should be referenced by the DestinationCharacter entry
	 * @returns {this}
	 */
	destinationCharacter(character) {
		return this._addCharacterReference("DestinationCharacter", character);
	}

	/**
	 * Adds a DestinationCharacterName dictionary entry
	 * @param {Character} character - The character which should be referenced by the DestinationCharacterName entry
	 * @returns {this}
	 */
	destinationCharacterName(character) {
		return this._addCharacterReference("DestinationCharacterName", character);
	}

	/**
	 * Adds a TargetCharacter dictionary entry
	 * @param {Character} character - The character which should be referenced by the TargetCharacter entry
	 * @param {number} [index] - The target character index if there is more than one target character
	 * @returns {this}
	 */
	targetCharacter(character, index) {
		if (!this._condition || !(character.IsOnline() || character.IsPlayer())) return this;

		/** @type {TargetCharacterDictionaryEntry} */
		const entry = {TargetCharacter: character.MemberNumber};
		if (this._targetIndex) {
			entry.Index = this._targetIndex;
		}
		if (this._addEntry(entry)) {
			this._targetIndex++;
		}
		return this;
	}

	/**
	 * Adds a TargetCharacterName dictionary entry
	 * @param {Character} character - The character which should be referenced by the TargetCharacterName entry
	 * @returns {this}
	 */
	targetCharacterName(character) {
		return this._addCharacterReference("TargetCharacterName", character);
	}

	/**
	 * Adds a dictionary entry which identifies a given group.
	 * @param {string} tag - The tag to use as the substitution
	 * @param {AssetGroupName} groupName - The name of the group
	 * @returns {this}
	 */
	group(tag, groupName) {
		if (this._condition && groupName) {
			this._addEntry({Tag: tag, GroupName: groupName});
		}
		return this;
	}

	/**
	 * Adds a dictionary entry which identifies the focused group - the group that was acted upon to generate the message, if applicable.
	 * @param {AssetGroupName} groupName - The name of the focus group
	 * @returns {this}
	 */
	focusGroup(groupName) {
		if (this._condition && groupName) {
			this._addEntry({Tag: "FocusAssetGroup", FocusGroupName: groupName});
		}
		return this;
	}

	/**
	 * Adds a dictionary entry which identifies an asset - usually the asset being changed, but the tag can be customized.
	 * @param {Asset} asset - The asset in question
	 * @param {string} [tag] - The tag to replace
	 * @param {string} [craftName] - The name of the crafted item if applicable
	 * @returns {this}
	 */
	asset(asset, tag="AssetName", craftName="") {
		if (this._condition && asset) {
			/** @type {AssetReferenceDictionaryEntry} */
			const entry = {
				Tag: tag,
				AssetName: asset.Name,
				GroupName: asset.Group.Name,
			};
			if (craftName) {
				entry.CraftName = craftName;
			}
			this._addEntry(entry);
		}
		return this;
	}

	/**
	 * Adds a text dictionary entry. This is a straightforward dictionary entry where the provided tag will be directly
	 * replaced by the given text.
	 * @param {string} tag - The tag to replace
	 * @param {string} text - The text to replace the tag with
	 * @returns {this}
	 */
	text(tag, text) {
		if (this._condition && tag && text) {
			this._addEntry({Tag: tag, Text: text});
		}
		return this;
	}

	/**
	 * Adds a text lookup dictionary entry. A text lookup will be performed on the provided lookup text, and the
	 * resulting value will be used to replace the associated tag.
	 * @param {string} tag - The tag to replace
	 * @param {string} lookupText - The text to look up and replace the tag with
	 * @returns {this}
	 */
	textLookup(tag, lookupText) {
		if (this._condition && tag && lookupText) {
			this._addEntry({Tag: tag, TextToLookUp: lookupText});
		}
		return this;
	}

	/**
	 * Add a suction intensity entry
	 * @param {number} intensity - The intensity of the suction applied
	 * @returns {this}
	 */
	suctionLevel(intensity) {
		if (this._condition && typeof intensity === "number" && !isNaN(intensity) && intensity > 0) {
			this._addEntry({ SuctionLevel: intensity });
		}
		return this;
	}

	/**
	 * Adds a shock intensity entry.
	 * @param {number} intensity - The intensity of the shock applied
	 * @returns {this}
	 */
	shockIntensity(intensity) {
		if (this._condition && typeof intensity === "number" && !isNaN(intensity) && intensity > 0) {
			this._addEntry({ ShockIntensity: intensity });
		}
		return this;
	}

	/**
	 * Marks the message as being automatically generated. Usually used by automated vibe changes.
	 * Those will get filtered out depending on the reciever's chat settings.
	 * @returns {this}
	 */
	markAutomatic() {
		this._addEntry({ Automatic: true });
		return this;
	}

	/**
	 * Adds an activity entry to the dictionary.
	 * @param {ActivityName} name - The activity performed
	 * @param {AssetGroup} group - The group the activity is being performed on
	 * @param {Item} [item] - The item used to perform the activity
	 * @param {number} [count] - The number of times the activity is done
	 * @returns {this}
	 */
	performActivity(name, group, item, count = 1) {
		this._addEntry({ ActivityName: name });
		this.focusGroup(group.Name);
		if (item) {
			this.asset(item.Asset, "UsedAsset", item.Craft?.Name);
		}
		if (count > 1)
			this._addEntry({ ActivityCounter: count });
		return this;
	}

	/**
	 * Adds a teleport dictionary entry
	 * @param {ChatRoomMapPos} position - The position to teleport to
	 * @returns {this}
	 */
	mapViewTeleport(position) {
		this._addEntry({ Tag: "MapViewTeleport", Position: position });
		return this;
	}

	/**
	 * Adds a tether dictionary entry
	 * @param {ChatRoomMapTether | null} tether - The tether, or `null` when the leash is untied
	 * @returns {this}
	 */
	mapViewTether(tether) {
		this._addEntry({ Tag: "MapViewTether", Tether: tether });
		return this;
	}

	/**
	 * Adds a changeKey dictionary entry
	 * @param {("gold" | "silver" | "bronze")[]} keys
	 * @param {boolean} giveKey
	 * @returns {this}
	 */
	mapViewChangeKey(keys, giveKey) {
		for (const key of keys) {
			this._addEntry({ Tag: "MapViewChangeKey", Key: key, Bool: giveKey });
		}
		return this;
	}

	/**
	 * Adds a changeKey dictionary entry
	 * @param {GGTSDictionaryEntry["Action"]} action
	 * @returns {this}
	 */
	addGGTSData(action) {
		this._addEntry({ Tag: "GGTSData", Action: action });
		return this;
	}

	/**
	 * Add a tagged string list entry
	 * @param {`ForbiddenWords` | `BlockScreen` | `BlockAppearance` | `BlockItemGroup`} tag
	 * @param {string[]} words
	 */
	stringList(tag, words) {
		// Not sure why a cast is needed there, but… that should work
		this._addEntry(/** @type {StringListDictionaryEntry<"ForbiddenWords">} */ ({ Tag: tag, Strings: words }));
		return this;
	}

	/**
	 * Adds a dictionary entry to the builder
	 * @param {ChatMessageDictionaryEntry} entry - The dictionary entry to add
	 * @returns {boolean} - True if the entry was successfully added, false otherwise
	 * @protected
	 */
	_addEntry(entry) {
		if (!this._condition) return false;

		this._entries.push(entry);
		return true;
	}

	/**
	 * Adds a character reference dictionary entry for the given character reference tag and character.
	 * @param {CharacterReferenceTag} tag - The character reference tag that should be added
	 * @param {Character} character - The character that should be referenced
	 * @returns {this}
	 * @private
	 */
	_addCharacterReference(tag, character) {
		if (this._condition && character) {
			this._addEntry({
				Tag: tag,
				MemberNumber: character.MemberNumber,
				Text: CharacterNickname(character),
			});
		}
		return this;
	}
}

/**
 * A {@link DictionaryBuilder} class which adds its dictionary entries based on a boolean condition. If the condition
 * evaluates to truthy, then it will behave exactly like a {@link DictionaryBuilder}. However, if the condition
 * evaluates to falsy, then it will always build an empty array.
 */
class ConditionalDictionaryBuilder extends DictionaryBuilder {
	/**
	 * Constructs a new ConditionalDictionaryBuilder instance with the given parent and condition.
	 * @param {DictionaryBuilder} parent - The parent {@link DictionaryBuilder} instance
	 * @param {boolean} condition - The condition that should determine whether or not this builder adds entries.
	 */
	constructor(parent, condition) {
		super();
		/** @type {DictionaryBuilder} */
		this._parent = parent;
		/** @type {boolean} */
		this._condition = condition;
	}

	/**
	 * Returns the parent {@link DictionaryBuilder instance}. Used to effectively end input to this builder.
	 * @returns {DictionaryBuilder} - The parent builder
	 */
	endif() {
		return this._parent;
	}
}

/**
 * @param {ChatMessageDictionaryEntry | TaggedDictionaryEntry} entry
 * @returns {entry is TaggedDictionaryEntry}
 */
function IsTaggedDictionaryEntry(entry) {
	return CommonIsObject(entry) && "Tag" in entry && typeof entry.Tag === "string";
}

/**
 * @template {string} T
 * @param {T} tag
 * @param {ChatMessageDictionaryEntry | TaggedDictionaryEntry} entry
 * @returns {entry is StringListDictionaryEntry<T>}
 */
function IsStringListDictionaryEntry(tag, entry) {
	return IsTaggedDictionaryEntry(entry) && entry.Tag === tag && "Strings" in entry && Array.isArray(entry.Strings) && entry.Strings.every(s => typeof s === "string");
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is CharacterReferenceDictionaryEntry}
 */
function IsCharacterReferenceDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& "Tag" in entry
		&& (entry.Tag === "SourceCharacter"
			|| entry.Tag === "TargetCharacter"
			|| entry.Tag === "TargetCharacterName"
			|| entry.Tag === "DestinationCharacter"
			|| entry.Tag === "DestinationCharacterName")
		&& "MemberNumber" in entry
		&& CommonIsNonNegativeInteger(entry.MemberNumber);
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is SourceCharacterDictionaryEntry}
 */
function IsSourceCharacterDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& "SourceCharacter" in entry
		&& CommonIsNonNegativeInteger(entry.SourceCharacter);
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is TargetCharacterDictionaryEntry}
 */
function IsTargetCharacterDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& "TargetCharacter" in entry
		&& CommonIsNonNegativeInteger(entry.TargetCharacter)
		&& (entry.Index == null || CommonIsNonNegativeInteger(entry.Index));
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is FocusGroupDictionaryEntry}
 */
function IsFocusGroupDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& (!("Tag" in entry) || entry.Tag === "FocusAssetGroup")
		&& "FocusGroupName" in entry && typeof entry.FocusGroupName === "string";
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is TextDictionaryEntry}
 */
function IsTextDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& "Tag" in entry && typeof entry.Tag === "string"
		&& "Text" in entry && (typeof entry.Text === "string" || typeof entry.Text === "number");
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is GGTSDictionaryEntry}
 */
function IsGGTSDictionaryEntry(entry) {
	return CommonIsObject(entry) && "Tag" in entry && entry.Tag === "GGTSData";
}
/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is TextLookupDictionaryEntry}
 */
function IsTextLookupDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& "Tag" in entry && typeof entry.Tag === "string"
		&& "TextToLookUp" in entry && typeof entry.TextToLookUp === "string";
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is GroupReferenceDictionaryEntry}
 */
function IsGroupReferenceDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& "Tag" in entry && typeof entry.Tag === "string"
		&& "GroupName" in entry && typeof entry.GroupName === "string"
		&& !("AssetName" in entry);
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is AssetReferenceDictionaryEntry}
 */
function IsAssetReferenceDictionaryEntry(entry) {
	return (
		CommonIsObject(entry)
		&& "Tag" in entry && typeof entry.Tag === "string"
		&& "GroupName" in entry && typeof entry.GroupName === "string"
		&& "AssetName" in entry && typeof entry.AssetName === "string"
		&& (
			entry.CraftName == null
			|| (!!entry.CraftName && typeof entry.CraftName === "string")
		)
	);
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is ShockEventDictionaryEntry}
 */
function IsShockEventDictionaryEntry(entry) {
	return CommonIsObject(entry) && "ShockIntensity" in entry && typeof entry.ShockIntensity === "number";
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is AutomaticEventDictionaryEntry}
 */
function IsAutomaticEventDictionaryEntry(entry) {
	return CommonIsObject(entry) && "Automatic" in entry && entry.Automatic === true;
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is ActivityCounterDictionaryEntry}
 */
function IsActivityCounterDictionaryEntry(entry) {
	return CommonIsObject(entry) && "ActivityCounter" in entry && typeof entry.ActivityCounter === "number";
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is AssetGroupNameDictionaryEntry}
 * @deprecated
 */
function IsAssetGroupNameDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& "Tag" in entry && typeof entry.Tag === "string"
		&& "AssetGroupName" in entry && typeof entry.AssetGroupName === "string";
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is ActivityNameDictionaryEntry}
 */
function IsActivityNameDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& "ActivityName" in entry && typeof entry.ActivityName === "string";
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is MessageEffectEntry}
 */
function IsMessageEffectDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& "Effects" in entry && CommonIsArray(entry.Effects)
		&& (!entry.Original || typeof entry.Original === "string");
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is ReplyIdDictionaryEntry}
 */
function IsReplyIdDictionaryEntry(entry) {
	return CommonIsObject(entry) && "ReplyId" in entry && typeof entry.ReplyId === "string";
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is MsgIdDictionaryEntry}
 */
function IsMsgIdDictionaryEntry(entry) {
	return CommonIsObject(entry) && "MsgId" in entry && typeof entry.MsgId === "string";
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is MapViewTeleportEventDictionaryEntry}
 */
function IsMapViewTeleportEventDictionaryEntry(entry) {
	return CommonIsObject(entry) && "Tag" in entry && entry.Tag === "MapViewTeleport";
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is MapViewTetherEventDictionaryEntry}
 */
function IsMapViewTetherEventDictionaryEntry(entry) {
	return CommonIsObject(entry) && "Tag" in entry && entry.Tag === "MapViewTether" && "Tether" in entry;
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is MapViewChangeKeyEventDictionaryEntry}
 */
function IsMapViewChangeKeyEventDictionaryEntry(entry) {
	return CommonIsObject(entry)
		&& "Tag" in entry && entry.Tag === "MapViewChangeKey"
		&& "Key" in entry && (entry.Key === "bronze" || entry.Key === "silver" || entry.Key === "gold");
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is ModSdkModsReplyPayloadDictionaryEntry}
 */
function IsModSdkModsReplyPayload(entry) {
	return CommonIsObject(entry)
		&& "Tag" in entry && entry.Tag === "ModSdkModsReplyPayload"
		&& "RequestId" in entry && typeof entry.RequestId === "string"
		&& "Status" in entry && typeof entry.Status === "string"
		&& "ModsJson" in entry && typeof entry.ModsJson === "string";
}

/**
 * @param {ChatMessageDictionaryEntry} entry
 * @returns {entry is ModSdkModsQueryPayloadDictionaryEntry}
 */
function IsModSdkModsQueryPayload(entry) {
	return CommonIsObject(entry)
		&& "Tag" in entry && entry.Tag === "ModSdkModsQueryPayload"
		&& "RequestId" in entry && typeof entry.RequestId === "string";
}
