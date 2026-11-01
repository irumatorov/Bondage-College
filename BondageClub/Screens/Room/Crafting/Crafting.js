"use strict";

// NOTE: Keep as `var` to enable `window`-based lookup
/** The background of the crafting screen. */
var CraftingBackground = "CraftingWorkshop";

/**
 * The active subscreen within the crafting screen:
 * - `"Slot"`: The main crafting screens wherein the {@link CraftingItem} is selected, created or destroyed.
 * - `"Name"`: The main menu wherein the crafted item is customized, allowing for the specification of names, descriptions, colors, extended item types, _etc._
 * - `"Color"`: A dedicated coloring screen for the crafted item.
 * - `"Extended"`: The extended item menu.
 * @type {CraftingMode}
 */
let CraftingMode = "Slot";

/** The index of the selected crafted item within the crafting screen. */
let CraftingSlot = 0;

/**
 * The currently selected crafted item in the crafting screen.
 * @type {CraftingItemSelected | null}
 */
let CraftingSelectedItem = null;

/**
 * The character used for the crafting preview.
 * @type {Character | null}
 */
let CraftingPreview = null;

/** Whether the crafting character preview should be naked or not. */
let CraftingNakedPreview = false;

/** Whether exiting the crafting menu should return you to the chatroom or, otherwise, the main hall. */
let CraftingReturnToChatroom = false;

/**
 * A record mapping all crafting-valid asset names to a list of matching eligible assets.
 *
 * Eligible assets are defined as crafting-valid assets with either a matching {@link Asset.Name} or {@link Asset.CraftGroup}.
 *
 * The first asset in each list is guaranteed to satisfy `Asset.Group.Name === Asset.DynamicGroupName` _if_ any of the list members satisfy this condition.
 * @type {Partial<Record<AssetName, Asset[]>>}
 */
let CraftingAssets = {};

/** The separator used between different crafted items when serializing them. */
const CraftingSerializeItemSep = "§";

/** The separator used between fields within a single crafted item when serializing them. */
const CraftingSerializeFieldSep = "¶";

/**
 * Regexp pattern for sanitizing to-be serialized crafted item string data by finding all
 * special separator characters (see {@link CraftingSerializeItemSep} and {@link CraftingSerializeFieldSep}).
 */
const CraftingSerializeSanitize = new RegExp(`${CraftingSerializeItemSep}|${CraftingSerializeFieldSep}`);

/**
 * Map crafting properties to their respective validation function.
 * @type {Map<CraftingPropertyType, (asset: Asset) => boolean>}
 */
const CraftingPropertyMap = new Map([
	["Normal", function(Item) { return true; }],
	["Large", function(Item) { return CraftingItemHasEffect(Item, CommonKeys(SpeechGagLevelLookup)); }],
	["Small", function(Item) { return CraftingItemHasEffect(Item, CommonKeys(SpeechGagLevelLookup)); }],
	["Thick", function(Item) { return CraftingItemHasEffect(Item, [...CharacterBlindLevels.keys()]); }],
	["Thin", function(Item) { return CraftingItemHasEffect(Item, [...CharacterBlindLevels.keys()]); }],
	["Secure", function(Item) { return true; }],
	["Loose", function(Item) { return true; }],
	["Decoy", function(Item) { return true; }],
	["Malleable", function(Item) { return true; }],
	["Rigid", function(Item) { return true; }],
	["Simple", function(Item) { return Item.AllowLock; }],
	["Puzzling", function(Item) { return Item.AllowLock; }],
	["Painful", function(Item) { return true; }],
	["Comfy", function(Item) { return true; }],
	["Strong", function(Item) { return Item.IsRestraint || (Item.Difficulty > 0); }],
	["Flexible", function(Item) { return Item.IsRestraint || (Item.Difficulty > 0); }],
	["Nimble", function(Item) { return Item.IsRestraint || (Item.Difficulty > 0); }],
	["Arousing", function(Item) { return CraftingItemHasEffect(Item, ["Egged", "Vibrating"]); }],
	["Dull", function(Item) { return CraftingItemHasEffect(Item, ["Egged", "Vibrating"]); } ],
	["Edging", function(Item) { return CraftingItemHasEffect(Item, ["Egged", "Vibrating", "Chaste", "CanEdge", "BreastChaste"]); }],
	["Heavy", function(Item) { return CraftingItemHasEffect(Item, ["Slow"]); }],
	["Light", function(Item) { return CraftingItemHasEffect(Item, ["Slow"]); }],
	["Deaf", function(Item) { return CraftingItemHasEffect(Item, [...CharacterDeafLevels.keys()]); }],
	["Audible", function(Item) { return CraftingItemHasEffect(Item, [...CharacterDeafLevels.keys()]); }],
]);
const CraftingEffectsDefaultMaximumStack = 2;
const CraftingEffectsDefaultMaximumEffects = 2;
/**
 * A record mapping crafting property names to functions that return a boolean indicating whether the property can increase
 * @type {Record<CraftingPropertyType, {max?: number, isDisabled?: (craft: CraftingItem | CraftingItemSelected) => boolean}>}
 */
const CraftingEffectsPrerequisite = {
	Painful: {
		max: 1,
		isDisabled(craft) {
			return !!craft.Effects.Comfy;
		}
	},
	Comfy: {
		max: 1,
		isDisabled(craft) {
			return !!craft.Effects.Painful;
		},
	},
	Decoy: {
		max: 1,
	},
	Secure: {
		max: 2,
		isDisabled(craft) {
			return !!craft.Effects.Loose;
		},
	},
	Loose: {
		isDisabled(craft) {
			return !!craft.Effects.Secure;
		},
	},
	Arousing: {
		isDisabled(craft) {
			return !!craft.Effects.Dull;
		},
	},
	Dull: {
		isDisabled(craft) {
			return !!craft.Effects.Arousing;
		},
	},
	Heavy: {
		isDisabled(craft) {
			return !!craft.Effects.Light;
		},
	},
	Light: {
		isDisabled(craft) {
			return !!craft.Effects.Heavy;
		},
	},
	Large: {
		isDisabled(craft) {
			return !!craft.Effects.Small;
		},
	},
	Small: {
		isDisabled(craft) {
			return !!craft.Effects.Large;
		},
	},
	Thick: {
		isDisabled(craft) {
			return !!craft.Effects.Thin;
		},
	},
	Thin: {
		isDisabled(craft) {
			return !!craft.Effects.Thick;
		},
	},
	Malleable: {
		isDisabled(craft) {
			return !!craft.Effects.Rigid;
		},
	},
	Rigid: {
		isDisabled(craft) {
			return !!craft.Effects.Malleable;
		},
	},
	Simple: {
		isDisabled(craft) {
			return !!craft.Effects.Puzzling;
		},
	},
	Puzzling: {
		isDisabled(craft) {
			return !!craft.Effects.Simple;
		},
	},
	Edging: {
		max: 1
	},
	Normal: {
		max: 1
	},
	Strong: {
		max: 1,
		isDisabled(craft) {
			return !!craft.Effects.Nimble || !!craft.Effects.Flexible;
		},
	},
	Flexible: {
		max: 1,
		isDisabled(craft) {
			return !!craft.Effects.Nimble || !!craft.Effects.Strong;
		},
	},
	Nimble: {
		max: 1,
		isDisabled(craft) {
			return !!craft.Effects.Flexible || !!craft.Effects.Strong;
		},
	},
	Deaf: {
		max: 1,
		isDisabled(craft) {
			return !!craft.Effects.Audible;
		},
	},
	Audible: {
		max: 1,
		isDisabled(craft) {
			return !!craft.Effects.Deaf;
		},
	}
};

/**
 * Checks if a {@link CraftingItem["Effects"]} prerequisite is met
 * @param {CraftingItemSelected | CraftingItem} craft
 * @param {CraftingPropertyType} effect
 */
function CraftingCheckEffectsPrerequisite(craft, effect) {
	// Count all effects with a positive value (nullish/absent and 0 values are equivalent in this context)
	const nEffects = Object.values(craft.Effects).reduce((sum, effectValue) => effectValue ? sum + 1 : sum, 0);
	if (nEffects > CraftingEffectsDefaultMaximumEffects) return false;

	const prerequisite = CraftingEffectsPrerequisite[effect];
	if (!CommonIsInteger((craft.Effects[effect] ?? 0), 1, (prerequisite?.max ?? CraftingEffectsDefaultMaximumStack))) return false;

	if (!prerequisite.isDisabled) return true;
	return !prerequisite.isDisabled(craft);
}

/**
 * Updates the buttons for crafting properties
 * @param {CraftingItemSelected} craft
 */
function CraftingPropertyUpdateButtons(craft) {
	for (const [name, validate] of CraftingPropertyMap.entries()) {
		const disabled = !CraftingCheckEffectsPrerequisite({...craft, Effects: {...craft.Effects, [name]: (craft.Effects[name] ?? 0) + 1}}, name) || craft.Asset && !validate(craft.Asset);
		document.getElementById(`crafting-property-button-${name}-add`)?.toggleAttribute("disabled", disabled);
	}
	document.getElementById("crafting-property-button")?.toggleAttribute("disabled", craft.Asset == null);
}
/**
 * An enum with status codes for crafting validation.
 * @property {2} OK - The validation proceeded without errors
 * @property {1} ERROR - The validation produced one or more errors that were successfully resolved
 * @property {0} CRITICAL_ERROR - The validation produced an unrecoverable error
 * @type {{ OK: 2, ERROR: 1, CRITICAL_ERROR: 0 }}
 * @satisfies {Record<string, CraftingStatusType>}
 */
const CraftingStatusType = {
	OK: 2,
	ERROR: 1,
	CRITICAL_ERROR: 0,
};

/**
 * The Names of all locks that can be automatically applied to crafted items.
 * An empty string implies the absence of a lock.
 * @type {readonly (AssetLockType | "")[]}
 */
const CraftingLockList = ["", "MetalPadlock", "IntricatePadlock", "HighSecurityPadlock", "OwnerPadlock", "LoversPadlock", "FamilyPadlock", "MistressPadlock", "PandoraPadlock", "ExclusivePadlock"];

/**
 * A set of item property names that should never be stored in {@link CraftingItem.ItemProperty}.
 * @type {Set<keyof ItemProperties>}
 */
const CraftingPropertyExclude = new Set([
	"AutoPunishUndoTime",
	"BlinkState",
	"Expression",
	"HeartRate",
	"NextShockTime",
	"OrgasmCount",
	"RuinedOrgasmCount",
	"State",
	"TimeSinceLastOrgasm",
	"TimeWorn",
	"TriggerCount",
]);

const CraftingID = /** @type {const} */({
	root: "crafting-screen",

	downloadButton: "crafting-download-button",
	uploadButton: "crafting-upload-button",
	acceptButton: "crafting-accept-button",
	cancelButton: "crafting-cancel-button",
	exitButton: "crafting-exit-button",

	leftPanel: "crafting-left-panel",
	assetButton: "crafting-asset-button",
	assetPanel: "crafting-asset-panel",
	assetGrid: "crafting-asset-grid",
	assetSearch: "crafting-asset-search",
	assetHeader: "crafting-asset-header",
	padlockButton: "crafting-padlock-button",
	padlockPanel: "crafting-padlock-panel",
	padlockGrid: "crafting-padlock-grid",
	padlockSearch: "crafting-padlock-search",
	padlockHeader: "crafting-padlock-header",
	propertyButton: "crafting-property-button",
	propertyPanel: "crafting-property-panel",
	propertyGrid: "crafting-property-grid",
	propertySearch: "crafting-property-search",
	propertyHeader: "crafting-property-header",

	centerPanel: "crafting-center-panel",
	undressButton: "crafting-undress-button",

	rightPanel: "crafting-right-panel",
	nameInput: "crafting-name-input",
	nameLabel: "crafting-name-label",
	descriptionInput: "crafting-description-input",
	descriptionLabel: "crafting-description-label",
	colorsButton: "crafting-colors-button",
	colorsInput: "crafting-colors-input",
	colorsLabel: "crafting-colors-label",
	layeringInput: "crafting-layering-input",
	layeringButton: "crafting-layering-button",
	layeringLabel: "crafting-layering-label",
	privateCheckbox: "crafting-private-checkbox",
	privateLabel: "crafting-private-label",
	extendedButton: "crafting-extended-button",
	extendedLabel: "crafting-extended-label",
	tightenButton: "crafting-tighten-button",
	tightenLabel: "crafting-tighten-label",
	asciiDescriptionCheckbox: "crafting-ascii-description-checkbox",
	asciidescriptionLabel: "crafting-ascii-description-label",
});

var CraftingDescription = {
	/**
	 * Leading character for marking encoded extended crafted item descriptions.
	 * @readonly
	 */
	ExtendedDescriptionMarker: /** @type {const} */("\x00"),

	/**
	 * Regex for representing legal UTF16 characters.
	 * Note the exclusion of control characters (except Newline aka `\n`), `§` (`\xA7`) and `¶` (`\xB6`).
	 * @readonly
	 */
	Pattern: /^([\n\x20-\xA6\xA8-\xB5\xB7-\uFFFF]+)?$/,

	/**
	 * Regex for representing legal extended ASCII characters.
	 * Note the exclusion of control characters (except Newline aka `\n`), `§` (`\xA7`) and `¶` (`\xB6`).
	 * @readonly
	 */
	PatternASCII: /^([\n\x20-\xA6\xA8-\xB5\xB7-\xFF]+)?$/,

	/**
	 * Decode and return the passed string if it consists of UTF16-encoded UTF8 characters.
	 *
	 * Encoded strings must be marked with a leading {@link CraftingDescription.ExtendedDescriptionMarker}; unencoded strings are returned unmodified.
	 * @param {string} description - The to-be decoded string
	 * @returns {string} - The decoded string
	 */
	Decode: function Decode(description) {
		if (!description || typeof description !== "string") {
			return "";
		}

		if (description.startsWith(CraftingDescription.ExtendedDescriptionMarker)) {
			return Array.from(description.slice(1, 200)).flatMap(char => {
				const id = char.charCodeAt(0);
				const bit1 = Math.floor(id / 256);
				const bit2 = id - bit1 * 256;
				return [bit1, bit2].filter(Boolean).map(i => String.fromCharCode(i));
			}).join("");
		} else {
			return description.slice(0, 200);
		}
	},

	/**
	 * Decode the passed string and return it as a list of valid {@link Element.append} nodes, converting `\n` characters into `<br>` elements.
	 * @param {string} description - The to-be decoded string
	 * @returns {(string | HTMLElement)[]} - The decoded string as a list of nodes
	 */
	DecodeToHTML: function DecodeToHTML(description) {
		const descriptionParsed = CraftingDescription.Decode(description);
		return descriptionParsed.split("\n").flatMap(_line => {
			const line = _line.trim();
			return line ? [line, document.createElement("br")] : [];
		}).slice(0, -1);
	},

	/**
	 * Encode the passed crafted item description, extracting all UTF8 characters and encoding up to two of them into a single UTF16 character.
	 *
	 * The first character is marked with {@link CraftingDescription.ExtendedDescriptionMarker}
	 * @param {string} description - The initial length <=398 string of UTF8 characters
	 * @returns {string} - The length <=200 string of UTF16-encoded UTF8 characters
	 */
	Encode: function Encode(description) {
		if (
			!description
			|| typeof description !== "string"
			|| !description.match(CraftingDescription.PatternASCII)
		) {
			return "";
		}

		let ret = CraftingDescription.ExtendedDescriptionMarker;
		let i = 0;
		const iMax = Math.min(199, Math.ceil(description.length / 2));
		while (i < iMax) {
			const charCodeA = description.charCodeAt(i * 2);
			const charCodeB = description.charCodeAt(1 + i * 2);
			if (Number.isNaN(charCodeB)) {
				ret += String.fromCharCode(charCodeA * 256);
			} else {
				ret += String.fromCharCode(charCodeA * 256 + charCodeB);
			}
			i++;
		}
		return ret;
	},
};

/**
 * Construct a record mapping all crafting-valid asset names to a list of matching eligible assets.
 * Eligible assets are defined as crafting-valid assets with either a matching {@link Asset.Name} or {@link Asset.CraftGroup}.
 * @see {@link CraftingAssets}
 * @returns {Record<string, Asset[]>}
 */
function CraftingAssetsPopulate() {
	/** @type {Record<string, Asset[]>} */
	const ret = {};
	/** @type {Record<string, Asset[]>} */
	const craftGroups = {};
	for (const a of Asset) {
		if (!a.Group.IsItem() || a.IsLock || !a.Wear || !a.Enable) {
			continue;
		} else if (a.CraftGroup) {
			craftGroups[a.CraftGroup] ??= [];
			craftGroups[a.CraftGroup].push(a);
		} else {
			ret[a.Name] ??= [];
			ret[a.Name].push(a);
		}
	}

	for (const assetList of Object.values(craftGroups)) {
		const names = new Set(assetList.map(a => a.Name));
		for (const name of names) {
			ret[name] ??= [];
			ret[name].push(...assetList);
		}
	}

	// Ensure that the first member satisfies `Asset.Group.Name === Asset.DynamicGroupName` if possible at all
	for (const assetList of Object.values(ret)) {
		assetList.sort((a1, a2) => {
			if (a1.CraftGroup === a1.Name && a2.CraftGroup !== a2.Name) {
				return -1;
			} else if (a1.CraftGroup !== a1.Name && a2.CraftGroup === a2.Name) {
				return 1;
			} else if (a1.Group.Name === a1.DynamicGroupName && a2.Group.Name !== a2.DynamicGroupName) {
				return -1;
			} else if (a1.Group.Name !== a1.DynamicGroupName && a2.Group.Name === a2.DynamicGroupName) {
				return 1;
			} else {
				return (
					a1.Group.Category.localeCompare(a2.Group.Category)
					|| a1.Group.Name.localeCompare(a2.Group.Name)
					|| a1.Name.localeCompare(a2.Name)
				);
			}
		});
	}
	return ret;
}

/**
 * Returns TRUE if a crafting item has an effect from a list or allows that effect
 * @param {Asset} Item - The item asset to validate
 * @param {EffectName[]} Effect - The list of effects to validate
 * @returns {boolean} - TRUE if the item has that effect
 */
function CraftingItemHasEffect(Item, Effect) {
	if (Item?.Effect != null)
		for (const E of Effect)
			if (Item.Effect.includes(E))
				return true;
	if (Item?.AllowEffect != null)
		for (const E of Effect)
			if (Item.AllowEffect.includes(E))
				return true;
	return false;
}

function CraftingUpdatePropertyButton() {
	const entries = (CraftingSelectedItem?.Effects ? Object.entries(CraftingSelectedItem.Effects) : []).filter(([key, value]) => !!value);
	const button = document.getElementById(CraftingID.propertyButton);
	if (!button) {
		return;
	}

	if (entries.length === 0) {
		button.innerText = TextGet(`PropertyNormal`) + ": " + TextGet(`DescriptionNormal`);
	} else if (entries.length === 1) {
		const [name, value] = entries[0];
		button.innerText = TextGet(`Property${name}`) + " ×" + value + ": " + TextGet(`Description${name}`);
	} else if (entries.length <= 5) {
		button.innerText = entries.map(([name, value]) => TextGet(`Property${name}`) + " ×" + value).join(" & ");
	} else {
		button.innerText = TextGet(`MultipleProperties`) + ` (${entries.length})`;
	}

}
/**
 * Shows the crating screen and remember if the entry came from an online chat room
 * @param {boolean} FromChatRoom - TRUE if we come from an online chat room
 * @returns {void} - Nothing
 */
function CraftingShowScreen(FromChatRoom) {
	CraftingReturnToChatroom = FromChatRoom;
	CommonSetScreen("Room", "Crafting");
}

var CraftingEventListeners = {
	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => void}
	 */
	_ClickPrivate: function _ClickPrivate() {
		if (CraftingSelectedItem) {
			CraftingSelectedItem.Private = this.checked;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => void}
	 */
	_InputLayering: function _InputLayering() {
		if (CraftingSelectedItem) {
			const value = (this.defaultValue !== this.value && !Number.isNaN(this.valueAsNumber)) ? this.valueAsNumber : undefined;
			if (value !== CraftingSelectedItem.OverridePriority) {
				CraftingSelectedItem.ItemProperty.OverridePriority = value;
				CraftingUpdatePreview();
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => void}
	 */
	_ChangeName: function _ChangeName() {
		if (CraftingSelectedItem) {
			CraftingSelectedItem.Name = this.value.trim() || this.defaultValue;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLTextAreaElement, ev: Event) => void}
	 */
	_ChangeDescription: function _ChangeDescription() {
		if (CraftingSelectedItem) {
			const asciiDescriptionCheckbox = /** @type {null | HTMLInputElement} */(document.getElementById(CraftingID.asciiDescriptionCheckbox));
			if (asciiDescriptionCheckbox?.checked) {
				CraftingSelectedItem.Description = CraftingDescription.Encode(this.value.trim());
			} else {
				CraftingSelectedItem.Description = this.value.trim();
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLTextAreaElement | HTMLInputElement, ev: Event) => void}
	 */
	_InputDescription: function _InputDescription() {
		const pattern = this.dataset.pattern;
		this.setCustomValidity(!pattern || this.value.match(pattern) ? "" : "patternMismatch");
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => void}
	 */
	_ChangeColor: function _ChangeColor() {
		if (CraftingSelectedItem) {
			const value = this.value.trim() || this.defaultValue;
			if (value !== CraftingSelectedItem.Color) {
				CraftingSelectedItem.Color = value;
				CraftingUpdatePreview();
			}
			if (!this.checkValidity()) {
				this.value = this.defaultValue;
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickExtended: function _ClickExtended() {
		if (CraftingPreview && CraftingSelectedItem?.Asset?.Extended) {
			const item = InventoryGet(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName);
			if (item) {
				DialogExtendItem(item);
				CraftingModeSet("Extended");
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickTighten: function _ClickTighten() {
		if (!CraftingPreview || !CraftingSelectedItem?.Asset?.AllowTighten) {
			return;
		}

		const item = InventoryGet(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName);
		if (item?.Craft) {
			// Make sure that all expected modifiers are present so that the difficulty factor can easily be extracted afterwards by extracting a deterministic value
			item.Craft.Effects = CraftingSelectedItem.Effects;
			item.Difficulty = (
				item.Asset.Difficulty
				+ SkillGetLevel(Player, "Bondage")
				+ (item.Craft.Effects.Secure ?? 0) * 4
				+ CraftingSelectedItem.DifficultyFactor
			);
			DialogSetTightenLoosenItem(item);
			CraftingModeSet("Tighten");
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickLayering: function _ClickLayering() {
		if (CraftingPreview && CraftingSelectedItem?.Asset) {
			const item = InventoryGet(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName);
			if (item) {
				CommonPromiseCatch(
					Layering.Init(item, CraftingPreview, {
						x: Layering.DisplayDefault.x,
						y: Layering.DisplayDefault.y - 10,
						w: Layering.DisplayDefault.w,
						h: Layering.DisplayDefault.h + 10,
						buttonGap: 15,
					})
				);
				CraftingModeSet("OverridePriority");
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickColors: function _ClickColors() {
		const selectedItem = CraftingSelectedItem;
		if (CraftingPreview && selectedItem?.Asset) {
			const item = InventoryGet(CraftingPreview, selectedItem.Asset.DynamicGroupName);
			if (item) {
				ItemColorLoad(CraftingPreview, item, 1100, 15, 875, 970, true).then(() => {
					CraftingModeSet("Color");
					ItemColorOnExit(({ colors }, save) => {
						if (save) {
							selectedItem.Color = colors.join(",") || "Default";
							ElementValue(CraftingID.colorsInput, selectedItem.Color);
						}
						CraftingModeSet("Name");
					});
				}).catch(err => {
					console.error(`Failed to load "${CurrentModule}/${CurrentScreen}" item color subscreen:\n`, err);
					ToastManager.error(`Failed to load "${CurrentModule}/${CurrentScreen}" item color subscreen`);
				});
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickUndress: function _ClickUndress() {
		CraftingNakedPreview = !CraftingNakedPreview;
		CraftingUpdatePreview();
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickAccept: function _ClickAccept() {
		// blur the active element in order to trigger any `change` event listeners
		document.activeElement?.dispatchEvent(new Event("blur"));
		if (CraftingSelectedItem) {
			Player.Crafting[CraftingSlot] = CraftingConvertSelectedToItem(CraftingSelectedItem);
		}
		CraftingSaveServer();
		CraftingExit(false);
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickExit: function _ClickExit() {
		CraftingExit(false);
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickUpload: function _ClickUpload() {
		let settingsString = prompt(TextGet("UploadPrompt"))?.trim();
		if (settingsString == null) {
			return; // The user explicitly clicked cancel; abort without further warning
		}

		// Trim " and , in order to make it easier to copy/paste CraftingJSON imports
		if (settingsString.endsWith(',')) {
			settingsString = settingsString.slice(-1);
		}
		if (settingsString.endsWith('"') && settingsString.startsWith('"')) {
			settingsString = settingsString.slice(1, -1);
		}
		if (!settingsString) {
			alert(TextGet("UploadFailure"));
			return;
		}

		const craft = /** @type {null | CraftingItem} */ (CommonJSONParse(LZString.decompressFromBase64(settingsString.trim()) || "null"));
		if (!craft) {
			alert(TextGet("UploadFailure"));
			return;
		}

		const status = CraftingValidate(craft, null, true, true);
		switch (status) {
			case CraftingStatusType.ERROR:
			case CraftingStatusType.OK: {
				CraftingExitResetElements();
				CraftingSelectedItem = CraftingConvertItemToSelected(craft);
				// The valdiation above guarantees the presence of an asset
				const asset = /** @type {Asset} */(CraftingSelectedItem.Asset);
				document.querySelector(`#${CraftingID.assetGrid} [name='${asset.Name}'][data-group='${asset.DynamicGroupName}']`)?.dispatchEvent(new Event("click"));
				alert(TextGet("UploadSuccess"));
				return;
			}
			case CraftingStatusType.CRITICAL_ERROR:
				alert(TextGet("UploadFailure"));
				return;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickDownload: function _ClickDownload() {
		if (!CraftingSelectedItem) {
			return;
		}
		const craft = CraftingConvertSelectedToItem(CraftingSelectedItem);
		CommonClipboardWrite(LZString.compressToBase64(JSON.stringify(craft)), (res) => {
			if (res.err) {
				ToastManager.error(res.errorAsDOM(TextGet("DownloadFailed")));
			} else {
				ToastManager.success(TextGet("DownloadSuccess"));
			}
		});
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickExpand: function _ClickExpand() {
		if (this.getAttribute("aria-expanded") !== "true") {
			return;
		}

		const panelRoots = ElementUnpackIDs.fromAttribute(this, "aria-controls");
		panelRoots.forEach(root => {
			const panel = root.querySelector(".crafting-grid");
			const activeRadio = panel?.querySelector(`[aria-checked='true']`);
			if (activeRadio) {
				activeRadio.scrollIntoView();
			} else {
				panel?.scrollTo({ top: 0, behavior: "instant" });
			}
		});
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickProperty: function _ClickProperty() {
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickAddProperty: function _ClickAddProperty() {
		const parent = this.parentElement;
		const name = /** @type {null | CraftingPropertyType} */(parent?.getAttribute("name"));
		if (!parent || !name || !CraftingSelectedItem) {
			return;
		}

		parent.querySelector(".crafting-property-value")?.toggleAttribute("hidden", false);
		parent.querySelector(".crafting-property-remove")?.toggleAttribute("hidden", false);
		CraftingSelectedItem.Effects[name] ??= 0;
		CraftingSelectedItem.Effects[name] += 1;

		/** @type {null | HTMLInputElement} */
		const numericInput = parent.querySelector(".crafting-property-value input");
		if (numericInput) {
			numericInput.valueAsNumber = CraftingSelectedItem.Effects[name];
		}
		CraftingUpdatePropertyButton();
		CraftingPropertyUpdateButtons(CraftingSelectedItem);
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickRemoveProperty: function _ClickRemoveProperty() {
		const parent = this.parentElement;
		const name = /** @type {null | CraftingPropertyType} */(parent?.getAttribute("name"));
		if (!CraftingSelectedItem || !parent || !name) {
			return;
		}

		if (!CraftingSelectedItem.Effects[name]) {
			delete CraftingSelectedItem.Effects[name];
		} else {
			CraftingSelectedItem.Effects[name] -= 1;
		}
		if (!CraftingSelectedItem.Effects[name]) {
			parent.querySelector(".crafting-property-value")?.toggleAttribute("hidden", true);
			this.toggleAttribute("hidden", true);
		}

		/** @type {null | HTMLInputElement} */
		const numericInput = parent.querySelector(".crafting-property-value input");
		if (numericInput) {
			numericInput.valueAsNumber = CraftingSelectedItem.Effects[name] ?? 0;
		}
		CraftingUpdatePropertyButton();
		CraftingPropertyUpdateButtons(CraftingSelectedItem);
	},
	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickPadlock: function _ClickPadlock() {
		if (!CraftingSelectedItem) {
			return;
		}
		const newLock = this.getAttribute("aria-checked") === "true" ? AssetGet("Female3DCG", "ItemMisc", this.name) : null;
		const oldLock = CraftingSelectedItem.Lock;
		const needsRefresh = (!newLock && oldLock) || (newLock && !oldLock);
		CraftingSelectedItem.Lock = newLock;
		if (needsRefresh) {
			CraftingUpdatePreview();
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickAsset: function _ClickAsset() {
		const assets = CraftingAssets[this.name];
		if (!assets || !CraftingSelectedItem) {
			return;
		}
		const asset = assets[0];

		// Only relevant when switching between two assets from within the `Name` subscreen
		const needsPropertyUpdate = !CraftingSelectedItem.Asset || CraftingSelectedItem.Asset !== asset;
		CraftingSelectedItem.Assets = assets;

		// Set the various input fields
		const [nameInput, colorsInput, descriptionInput, priorityInput, privateInput, asciiDescriptionCheckbox] = /** @type {HTMLInputElement[]} */([
			document.getElementById(CraftingID.nameInput),
			document.getElementById(CraftingID.colorsInput),
			document.getElementById(CraftingID.descriptionInput),
			document.getElementById(CraftingID.layeringInput),
			document.getElementById(CraftingID.privateCheckbox),
			document.getElementById(CraftingID.asciiDescriptionCheckbox),
		]);
		priorityInput.defaultValue = priorityInput.placeholder = asset.Group.DrawingPriority.toString();
		colorsInput.defaultValue = colorsInput.placeholder = asset.DefaultColor.join(",");
		nameInput.defaultValue = nameInput.placeholder = asset.Description;
		nameInput.value = CraftingSelectedItem.Name;
		descriptionInput.value = CraftingDescription.Decode(CraftingSelectedItem.Description);
		privateInput.checked = CraftingSelectedItem.Private;

		const hasExtendedDescription = CraftingSelectedItem.Description.startsWith(CraftingDescription.ExtendedDescriptionMarker);
		if (asciiDescriptionCheckbox.checked != hasExtendedDescription) {
			asciiDescriptionCheckbox.click();
		}

		// Either we're switching between two distinct assets (in which case color and the likes cannot safely be assumed to be compatible) or we're just initializing everything after opening the `Name` subscreen
		if (needsPropertyUpdate) {
			CraftingSelectedItem.ItemProperty = {};
			priorityInput.value = priorityInput.defaultValue;
			colorsInput.value = CraftingSelectedItem.Color = colorsInput.defaultValue;
		} else {
			priorityInput.value = typeof CraftingSelectedItem.OverridePriority === "number" ? CraftingSelectedItem.OverridePriority.toString() : priorityInput.defaultValue;
			colorsInput.value = CraftingSelectedItem.Color;
		}

		// Re-enable the accept button as we now have an asset selected
		document.getElementById(CraftingID.acceptButton)?.setAttribute("aria-disabled", "false");

		// Disable the buttons for all invalid properties
		for (const e of document.querySelectorAll(`#${CraftingID.propertyGrid} [name]`)) {
			const propertyType = /** @type {null | CraftingPropertyType} */(e.getAttribute("name"));
			if (!propertyType) {
				continue;
			}
			const callback = CraftingPropertyMap.get(propertyType);
			const hidden = (callback && !assets.some(a => callback(a)));
			const disabled = hidden || !CraftingCheckEffectsPrerequisite(CraftingSelectedItem, propertyType);
			e.toggleAttribute("hidden", hidden);
			e.setAttribute("aria-disabled", disabled ? "true" : "false");
			e.querySelector(".crafting-property-add")?.toggleAttribute("disabled", disabled);
			e.querySelector(".crafting-property-remove")?.toggleAttribute("hidden", !CraftingSelectedItem.Effects[propertyType]);
			e.querySelector(".crafting-property-value")?.toggleAttribute("hidden", !CraftingSelectedItem.Effects[propertyType]);
			/** @type {null | HTMLInputElement} */
			const numericInput = e.querySelector(".crafting-property-value input");
			if (numericInput) {
				numericInput.valueAsNumber = CraftingSelectedItem.Effects[propertyType] ?? 0;
			}
		}

		CraftingUpdatePropertyButton();
		// Disable the extended item config button for non-extended items
		const [extendedButton, colorButton, layeringButton, tightenButton] = /** @type {HTMLButtonElement[]} */([
			document.getElementById(CraftingID.extendedButton),
			document.getElementById(CraftingID.colorsButton),
			document.getElementById(CraftingID.layeringButton),
			document.getElementById(CraftingID.tightenButton),
		]);
		extendedButton.disabled = !asset.Extended;
		tightenButton.disabled = !asset.AllowTighten;
		colorButton.disabled = colorsInput.disabled = !DialogCanColor(Player, AppearanceItem.fromAsset(asset));
		layeringButton.disabled = false;
		priorityInput.disabled = false;

		// Set the lock, removing any locks it the item does not support them
		const allowLock = assets.some(a => a.AllowLock);
		if (CraftingSelectedItem.Lock && allowLock) {
			const lockButton = document.querySelector(`#${CraftingID.padlockGrid} [name='${CraftingSelectedItem.Lock.Name}'][aria-checked='false']`);
			lockButton?.setAttribute("aria-disabled", "false");
			lockButton?.dispatchEvent(new Event("click"));
		} else {
			const lockButton = document.querySelector(`#${CraftingID.padlockGrid} [name][aria-checked='true']`);
			lockButton?.setAttribute("aria-disabled", "false");
			lockButton?.dispatchEvent(new Event("click"));
		}

		// Disable the lock buttons if none of the items supports any lock
		if (allowLock) {
			document.querySelectorAll(`#${CraftingID.padlockGrid} [name]`).forEach(e => e.setAttribute("aria-disabled", "false"));
		} else {
			document.querySelectorAll(`#${CraftingID.padlockGrid} [name]`).forEach(e => e.setAttribute("aria-disabled", "true"));
		}

		CraftingUpdatePreview();
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickRadio: function _ClickRadio(ev) {
		if (!CraftingSelectedItem) {
			ev.stopImmediatePropagation();
			return;
		}

		const sidePanel = this.closest(".crafting-panel");
		const controlButton = document.querySelector(`[aria-controls='${sidePanel?.id}']`);
		if (!sidePanel || !controlButton) {
			return;
		}

		if (this.getAttribute("aria-checked") === "true") {
			controlButton.replaceChildren(...this.cloneNode(true).children);
			return;
		} else {
			controlButton.replaceChildren();
		}

		switch (controlButton.id) {
			case CraftingID.padlockButton:
				ElementButton._ParseLabel(controlButton.id, TextGet("NoLock"), "bottom", { parent: controlButton });
				ElementButton._ParseImage(controlButton.id, "./Icons/NoLock.png", null, { parent: controlButton });
				break;
			case CraftingID.propertyButton:
				ElementButton._ParseLabel(controlButton.id, TextGet(`PropertyNormal`) + ": " + TextGet(`DescriptionNormal`), undefined, { parent: controlButton });
				break;
		}
	},

	/**
	 * @private
	 * @this {HTMLInputElement}
	 */
	_InputSearch: async function _InputSearch() {
		const query = this.value.toUpperCase().trim();
		const searchResultCandidates = ElementUnpackIDs.fromAttribute(this, "aria-controls");
		searchResultCandidates.forEach(candidate => candidate.querySelectorAll("button.button").forEach(button => {
			const label = button.querySelector(".button-label");
			if (label) {
				const displayStyle = (button.getAttribute("aria-checked") === "true" || label.textContent.toUpperCase().includes(query)) ? false : true;
				button.toggleAttribute("data-hidden-asset", displayStyle);
			}
		}));
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => Promise<void>}
	 */
	_InputSearchEffect: async function _InputSearchEffect() {
		const query = this.value.toUpperCase().trim();
		const searchResultCandidates = ElementUnpackIDs.fromAttribute(this, "aria-controls");
		searchResultCandidates.forEach(candidate => candidate.querySelectorAll(".crafting-property-list-item").forEach(button => {
			const label = button.querySelector(".crafting-property-info");
			if (label) {
				const displayStyle = label.textContent.toUpperCase().includes(query) ? false : true;
				button.toggleAttribute("hidden", displayStyle);
			}
		}));
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => void}
	 */
	_ClickAsciiDescription: function _ClickAsciiDescription() {
		const descriptionInput = /** @type {null | HTMLInputElement} */(document.getElementById(CraftingID.descriptionInput));
		if (!descriptionInput) {
			return;
		}

		descriptionInput.dataset.pattern = this.checked ? CraftingDescription.PatternASCII.source : CraftingDescription.Pattern.source;
		descriptionInput.maxLength = this.checked ? 398 : 200;
		if (descriptionInput.previousSibling) {
			descriptionInput.previousSibling.textContent = TextGet(this.checked ? "EnterDescriptionLong" : "EnterDescription");
		}
		if (descriptionInput.value.length > descriptionInput.maxLength) {
			// Can't reliably update `ValidityState.tooLong` programmatically after changing the max length (even with input/change event dispatching),
			// so as a work around just do it manually via a custom error
			descriptionInput.setCustomValidity("tooLong");
		} else if (descriptionInput.value.length <= descriptionInput.maxLength && descriptionInput.validationMessage === "tooLong") {
			descriptionInput.setCustomValidity("");
		}
		descriptionInput.dispatchEvent(new InputEvent("input"));
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
	 */
	_ClickGroup: function _ClickGroup(ev) {
		const groupName = /** @type {AssetGroupItemName} */(this.name);
		const assetList = document.getElementById(CraftingID.assetGrid);
		if (!assetList) {
			ev.stopImmediatePropagation();
			return;
		}

		if (this.getAttribute("aria-checked") === "true") {
			// Apply the filtering
			for (const button of assetList.children) {
				button.toggleAttribute("data-hidden-group", button.getAttribute("data-group") !== groupName);
			}

			// Update the label of the asset panel
			document.querySelector(`#${CraftingID.assetHeader} > span`)?.replaceChildren(
				TextGet("SelectItemSuffix").replace('GroupName', this.getAttribute("aria-label")?.toLocaleLowerCase() ?? "")
			);

			// Make sure that the asset panel is open and scroll to the top
			document.querySelector(`#${CraftingID.assetButton}[aria-checked="false"]`)?.dispatchEvent(new PointerEvent("click"));
			assetList.scrollTo({ top: 0 });
		} else {
			document.querySelector(`#${CraftingID.assetHeader} > span`)?.replaceChildren(TextGet("SelectItem"));
			for (const button of assetList.children) {
				button.toggleAttribute("data-hidden-group", false);
			}

			const checked = assetList.querySelector("[aria-checked='true']");
			if (checked) {
				checked.scrollIntoView({ behavior: "instant" });
			} else {
				assetList.scrollTo({ top: 0 });
			}
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: FocusEvent) => Promise<void>}
	 */
	_FocusSearchAsset: async function _FocusSearchAsset(ev) {
		const focusGrid = document.getElementById(CraftingID.centerPanel);
		if (!focusGrid) {
			ev.stopImmediatePropagation();
			return;
		}

		const group = /** @type {"ALL" | AssetGroupItemName} */(focusGrid.querySelector("[role='radio'][aria-checked='true']")?.getAttribute("name") ?? "ALL");
		const cachedGroup = this.getAttribute("data-group");
		if (cachedGroup === group) {
			return;
		}

		let options = CraftingElements._SearchCache.get(group);
		if (!options) {
			const query = group === "ALL" ? ".button-label" : `[data-group='${group}'] .button-label`;
			const searchResults = ElementUnpackIDs.fromAttribute(this, "aria-controls");
			options = searchResults.flatMap(el => Array.from(el.querySelectorAll(query)).map(e => ElementCreate({ tag: "option", attributes: { value: e.textContent }})));
			CraftingElements._SearchCache.set(group, options);
		}
		this.list?.replaceChildren(...options);
		this.setAttribute("data-group", group);
	},

	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: FocusEvent) => Promise<void>}
	 */
	_FocusSearch: async function _FocusSearch(ev) {
		if (this.list?.options.length) {
			return;
		}

		const searchResults = ElementUnpackIDs.fromAttribute(this, "aria-controls");
		const options = searchResults.flatMap(el => Array.from(el.querySelectorAll(".button-label")).map(e => ElementCreate({ tag: "option", attributes: { value: e.textContent }})));
		this.list?.replaceChildren(...options);
	},
};

var CraftingElements = {
	/**
	 * @private
	 * @param {string} id
	 * @param {string} controls
	 * @param {string} placeholder
	 * @param {"asset" | "lock" | "effect"} type
	 * @returns {HTMLInputElement}
	 */
	_SearchInput: function _SearchInput(id, controls, placeholder, type) {
		return ElementCreate({
			tag: "input",
			attributes: {
				type: "search",
				id,
				placeholder,
				list: `${id}-datalist`,
				size: 0,
				"aria-controls": controls,
			},
			dataAttributes: {
				group: undefined, // Initialized and managed by the `focus` event listener for asset searches
			},
			eventListeners: {
				input: type === "effect" ? CraftingEventListeners._InputSearchEffect : CraftingEventListeners._InputSearch,
				focus: type === "asset" ? CraftingEventListeners._FocusSearchAsset : CraftingEventListeners._FocusSearch,
			},
			children: [
				{ tag: "datalist", attributes: { id: `${id}-datalist` } },
			],
		});
	},

	/**
	 * @type {Map<"ALL" | AssetGroupItemName, readonly HTMLOptionElement[]>}
	 */
	_SearchCache: new Map(),

	/**
	 * @private
	 * @param {string} id
	 * @param {(this: HTMLButtonElement, ev: Event) => any} onClick
	 * @param {null | Asset} asset
	 * @param {null | Partial<Record<string, string | number | boolean>>} attributes
	 * @param {null | string} label
	 * @param {null | readonly (string | Node)[]} children
	 * @param {boolean} first
	 * @returns {HTMLButtonElement}
	 */
	_RadioButton: function _RadioButton(id, onClick, asset, attributes=null, label=null, children=null, first=false) {
		/** @type {HTMLButtonElement} */
		let ret;
		if (asset) {
			ret = ElementButton.CreateForAsset(
				id, asset, null, CraftingEventListeners._ClickRadio,
				{ role: "radio", tooltip: [] },
				{ button: { attributes: { tabindex: first ? 0 : -1 }, parent: ElementNoParent }},
			);
		} else {
			ret = ElementButton.Create(
				id,
				CraftingEventListeners._ClickRadio,
				{ label, role: "radio" },
				{ button: { children: children ?? undefined, attributes: { tabindex: first ? 0 : -1, ...(attributes ?? {}) }, parent: ElementNoParent }},
			);
		}
		ret.addEventListener("click", onClick);
		return ret;
	},

	/**
	 * @param {string} id
	 * @param {CraftingPropertyType} property
	 */
	_PropertyListItem: function _PropertyListItem(id, property) {
		return ElementCreate({
			tag: "li",
			classList: ["crafting-property-list-item"],
			attributes: {
				id,
				name: property
			},
			children: [
				{
					tag: "div",
					classList: ["crafting-property-info"],
					children: [
						{
							tag: "span",
							children: [TextGet(`Property${property}`)],
							classList: ["crafting-property-name"],
						},
						{
							tag: "div",
							classList: ["crafting-property-value"],
							attributes: {
								id: `${id}-value`,
								hidden: true,
							},
							children: [
								"×", {
									tag: "input",
									attributes: {
										type: "number",
										inputmode: "numeric",
										max: CraftingEffectsPrerequisite[property]?.max ?? CraftingEffectsDefaultMaximumStack,
										required: true,
										value: 0,
										min: 0,
									},
									eventListeners: {
										/** @type {(this: HTMLInputElement, ev: Event) => void} */
										change: function(ev) {
											if (!this.validity.valid || !CraftingSelectedItem) {
												// Abort! `blur` will trigger a second `change` call after sanitizing the currently invalid value
												ev.stopImmediatePropagation();
												return;
											}
											const value = this.valueAsNumber;
											if (isNaN(value)) return;
											if (!CraftingCheckEffectsPrerequisite(CraftingSelectedItem, property)) {
												return;
											}

											if (!CraftingCheckEffectsPrerequisite(CraftingSelectedItem, property)) {
												return;
											}
											CraftingSelectedItem.Effects[property] = this.valueAsNumber || undefined;
											CraftingUpdatePropertyButton();
											CraftingPropertyUpdateButtons(CraftingSelectedItem);
										},
										/** @type {(this: HTMLInputElement, ev: Event) => void} */
										blur: function (ev) {
											if (!this.checkValidity()) {
												this.value = this.defaultValue;
												this.dispatchEvent(new Event("change"));
											}
										},
									}
								}
							],
						},
						{
							tag: "p",
							children: [
								TextGet(`Description${property}`)
							]
						}
					]
				},
				ElementButton.Create(
					`${id}-remove`,
					CraftingEventListeners._ClickRemoveProperty,
					{
						image: "./Icons/decrement.svg",
					},
					{ button: {
						attributes: {
							hidden: true,
						},
						classList: ["crafting-property-remove", "crafting-property-button"],
					}}
				),
				ElementButton.Create(
					`${id}-add`,
					CraftingEventListeners._ClickAddProperty,
					{
						image: "./Icons/increment.svg",
					},
					{ button: {
						classList: ["crafting-property-add", "crafting-property-button"],
					}}
				),
			],
		});
	},
};

/**
 * Loads the club crafting room in slot selection mode, creates a dummy character for previews
 * @type {ScreenLoadHandler}
 */
async function CraftingLoad() {
	Player.Crafting ??= [];

	// Re-enable previously disabled items if the player now owns them
	for (const item of Player.Crafting) {
		if (item == null) {
			continue;
		}

		const asset = CraftingAssets[item.Item]?.[0];
		if (item.Disabled && asset && InventoryAvailable(Player, item.Item, asset.DynamicGroupName)) {
			delete item.Disabled;
		}
	}

	// Abort if we're loading an already-loaded screen
	if (CraftingPreview) {
		return;
	}

	CraftingPreview = CharacterLoadSimple(`CraftingPreview-${Player.MemberNumber}`);
	CraftingPreview.Appearance = [...Player.Appearance];
	CraftingPreview.Crafting = CommonCloneDeep(Player.Crafting);

	// Declare the preview character as being owned/loved by the player so any owner-/lover-related validation checks pass
	CraftingPreview.Owner = Player.Name;
	CraftingPreview.Ownership = { MemberNumber: Player.MemberNumber, Name: Player.Name, Start: CommonTime(), Stage: 1 };
	CraftingPreview.Lovership = [
		{ MemberNumber: Player.MemberNumber, Name: Player.Name, Start: CommonTime(), Stage: 2 },
	];
	// @ts-expect-error: partially initialized interface
	CraftingPreview.OnlineSharedSettings = {
		ItemsAffectExpressions: false,
	};
	CharacterReleaseTotal(CraftingPreview);

	const itemScreen = ElementDOMScreen.getTemplate(CraftingID.root, {
		header: TextGet("SelectName"),
		parent: document.body,
		hgroupInHeader: true,
		mainSection: "right",
		menubarButtons: [
			ElementButton.Create(
				CraftingID.exitButton, CraftingEventListeners._ClickExit,
				{ tooltip: TextGet("Exit"), image: "./Icons/Exit.png" },
			),
			ElementButton.Create(
				CraftingID.cancelButton, CraftingEventListeners._ClickExit,
				{ tooltip: TextGet("Cancel"), image: "./Icons/Cancel.png" },
			),
			ElementButton.Create(
				CraftingID.acceptButton, CraftingEventListeners._ClickAccept,
				{
					image: "./Icons/Accept.png",
					disabled: true,
					tooltip: [
						TextGet("Accept"),
						ElementCreate({ tag: "span", children: [TextGet("AcceptInvalid")], attributes: { id: `${CraftingID.acceptButton}-tooltip-disabled` } }),
					],
				},
			),
			ElementButton.Create(
				CraftingID.uploadButton, CraftingEventListeners._ClickUpload,
				{ tooltip: TextGet("Upload"), image: "./Icons/Download.png" },
			),
			ElementButton.Create(
				CraftingID.downloadButton, CraftingEventListeners._ClickDownload,
				{ tooltip: TextGet("Download"), image: "./Icons/Upload.png" },
			),
			ElementButton.Create(
				CraftingID.undressButton, CraftingEventListeners._ClickUndress,
				{ tooltip: TextGet("Undress"), role: "menuitemcheckbox", image: "./Icons/Naked.png" },
				{ button: { attributes: { "aria-checked": CraftingNakedPreview ? "true" : "false" } } },
			),
		],
		mainContent: [
			DialogFocusGroup.Create(CraftingID.centerPanel, CraftingEventListeners._ClickGroup, { useDynamicGroupName: true })
		],
		leftContent: [
			ElementMenu.Create(
				CraftingID.leftPanel,
				[
					ElementButton.Create(
						CraftingID.propertyButton, CraftingEventListeners._ClickExpand,
						{ role: "menuitemradio" },
						{ button: {
							attributes: { "aria-expanded": "false", "aria-controls": CraftingID.propertyPanel },
							children: [TextGet(`PropertyNormal`) + ": " + TextGet(`DescriptionNormal`)],
						}},
					),
					ElementButton.Create(
						CraftingID.assetButton, CraftingEventListeners._ClickExpand,
						{ role: "menuitemradio", label: TextGet("SelectItem"), image: "./Icons/NoCraft.png" },
						{ button: { attributes: { "aria-expanded": "false", "aria-controls": CraftingID.assetPanel } } },
					),
					ElementButton.Create(
						CraftingID.padlockButton, CraftingEventListeners._ClickExpand,
						{ role: "menuitemradio", label: TextGet("NoLock"), image: "./Icons/NoLock.png" },
						{ button: { attributes: { "aria-expanded": "false", "aria-controls": CraftingID.padlockPanel } } },
					),
					{
						tag: "div",
						attributes: {
							id: CraftingID.propertyPanel,
							"aria-labelledby": CraftingID.propertyHeader,
						},
						classList: ["crafting-panel"],
						children: [
							{
								tag: "label",
								classList: ["crafting-label"],
								attributes: { id: CraftingID.propertyHeader },
								children: [
									{ tag: "span", children: [TextGet("SelectProperty")] },
									CraftingElements._SearchInput(CraftingID.propertySearch, CraftingID.propertyGrid, TextGet("FilterProperty"), "effect"),
								],
							},
							{
								tag: "ul",
								classList: ["crafting-grid", "scroll-box"],
								attributes: { id: CraftingID.propertyGrid },
								children: Array.from(CraftingPropertyMap.keys()).map((property, i) => {
									if (property === "Normal") {
										return;
									}
									return CraftingElements._PropertyListItem(
										`${CraftingID.propertyButton}-${property}`,
										property
									);
								}),
							},
						],
					},
					{
						tag: "div",
						attributes: {
							id: CraftingID.assetPanel,
							"aria-labelledby": CraftingID.assetHeader,
						},
						classList: ["crafting-panel"],
						children: [
							{
								tag: "label",
								classList: ["crafting-label"],
								attributes: { id: CraftingID.assetHeader },
								children: [
									{ tag: "span", children: [TextGet("SelectItem")] },
									CraftingElements._SearchInput(CraftingID.assetSearch, CraftingID.assetGrid, TextGet("FilterAsset"), "asset"),
								],
							},
							{
								tag: "div",
								classList: ["crafting-grid", "scroll-box"],
								attributes: { id: CraftingID.assetGrid, role: "radiogroup", "aria-required": "true" },
								children: CraftingItemListBuild().map((a, i) => {
									return CraftingElements._RadioButton(
										CraftingID.assetButton,
										CraftingEventListeners._ClickAsset,
										a,
										null,
										null,
										null,
										i === 0,
									);
								}),
							},
						],
					},
					{
						tag: "div",
						attributes: {
							id: CraftingID.padlockPanel,
							"aria-labelledby": CraftingID.padlockHeader,
							"aria-orientation": "vertical",
						},
						classList: ["crafting-panel"],
						children: [
							{
								tag: "label",
								classList: ["crafting-label"],
								attributes: { id: CraftingID.padlockHeader },
								children: [
									{ tag: "span", children: [TextGet("SelectLock")] },
									CraftingElements._SearchInput(CraftingID.padlockSearch, CraftingID.padlockGrid, TextGet("FilterLock"), "lock"),
								],
							},
							{
								tag: "div",
								classList: ["crafting-grid", "scroll-box"],
								attributes: { id: CraftingID.padlockGrid, role: "radiogroup" },
								children: CraftingLockList.filter(name => !!name && InventoryAvailable(Player, name, "ItemMisc")).map((name, i) => {
									// Guaranteed to be non-null given the `InventoryAvailable()` check above
									const a = /** @type {Asset} */(AssetGet("Female3DCG", "ItemMisc", name));
									return CraftingElements._RadioButton(
										`${CraftingID.padlockButton}-${a.Name}`, CraftingEventListeners._ClickPadlock, a, null, null, null, i === 0,
									);
								}).sort((a1, a2) => a1.name.localeCompare(a2.name)),
							},
						],
					},
				],
				undefined,
				{ menu: { attributes: { "aria-orientation": "vertical" } } },
			),
		],
		rightContent: [
			{
				tag: "div",
				attributes: { id: CraftingID.rightPanel },
				children: [
					{
						tag: "label",
						attributes: { id: CraftingID.nameLabel },
						classList: ["crafting-label"],
						children: [
							{ tag: "span", children: [TextGet("EnterName")] },
							{
								// NOTE: Perform the pattern checking via JS as there are differences in how plain JS `RegExp` and `HTMLInputElement.pattern`
								// handle their pattern matching with characters larger than /u+FFFF
								tag: "input",
								attributes: { id: CraftingID.nameInput, type: "input", maxLength: "30", size: 0 },
								dataAttributes: { pattern: CraftingDescription.Pattern.source },
								eventListeners: {
									change: CraftingEventListeners._ChangeName,
									input: CraftingEventListeners._InputDescription,
								},
							},
						],
					},
					{
						tag: "label",
						attributes: { id: CraftingID.descriptionLabel },
						classList: ["crafting-label"],
						children: [
							{ tag: "span", children: [TextGet("EnterDescription")] },
							{
								tag: "textarea",
								attributes: { id: CraftingID.descriptionInput, maxLength: "200", size: 0 },
								dataAttributes: { pattern: CraftingDescription.Pattern.source },
								eventListeners: {
									change: CraftingEventListeners._ChangeDescription,
									input: CraftingEventListeners._InputDescription,
								},
							},
						],
					},
					{
						tag: "label",
						attributes: { id: CraftingID.colorsLabel },
						classList: ["crafting-label"],
						children: [
							{ tag: "span", children: [TextGet("EnterColor")] },
							{
								tag: "input",
								attributes: { id: CraftingID.colorsInput, type: "text", size: 0, disabled: "true" },
								eventListeners: { change: CraftingEventListeners._ChangeColor },
							},
							ElementButton.Create(
								CraftingID.colorsButton, CraftingEventListeners._ClickColors,
								{ disabled: true, image: "./Icons/Color.png" },
							),
						],
					},
					{
						tag: "label",
						attributes: { id: CraftingID.layeringLabel },
						classList: ["crafting-label"],
						children: [
							{
								tag: "input",
								attributes: { id: CraftingID.layeringInput, type: "number", min: -99, max: 99, inputmode: "numeric", size: 0, disabled: "true" },
								eventListeners: { blur: ElementNumberInputBlur, wheel: ElementNumberInputWheel, input: CraftingEventListeners._InputLayering },
							},
							ElementButton.Create(
								CraftingID.layeringButton, CraftingEventListeners._ClickLayering,
								{ disabled: true, image: "./Icons/Layering.png" },
							),
							{ tag: "span", children: [TextGet("EnterPriority")] },
						],
					},
					{
						tag: "label",
						attributes: { id: CraftingID.privateLabel },
						classList: ["crafting-label"],
						children: [
							ElementCheckbox.Create(CraftingID.privateCheckbox, CraftingEventListeners._ClickPrivate),
							{ tag: "span", children: [TextGet("EnterPrivate")] },
						],
					},
					{
						tag: "label",
						attributes: { id: CraftingID.extendedLabel },
						classList: ["crafting-label"],
						children: [
							ElementButton.Create(
								CraftingID.extendedButton, CraftingEventListeners._ClickExtended,
								{ disabled: true, image: "./Icons/Use.png" },
							),
							{ tag: "span", children: [TextGet("EnterType")] },
						],
					},
					{
						tag: "label",
						attributes: { id: CraftingID.tightenLabel },
						classList: ["crafting-label"],
						children: [
							ElementButton.Create(
								CraftingID.tightenButton, CraftingEventListeners._ClickTighten,
								{ disabled: true, image: "./Icons/TightenLoosen.png" },
							),
							{ tag: "span", children: [TextGet("EnterTighten")] },
						],
					},
					{
						tag: "label",
						attributes: { id: CraftingID.asciidescriptionLabel },
						classList: ["crafting-label"],
						children: [
							ElementCheckbox.Create(CraftingID.asciiDescriptionCheckbox, CraftingEventListeners._ClickAsciiDescription),
							{ tag: "span", children: [TextGet("EnterExtendedDescription")] },
						],
					},
				],
			},
		],
	});
	itemScreen.hidden = true;

	CommonPromiseCatch(CraftingSlots.Load());
}

/**
 * Update the crafting character preview image, applies the item on all possible body parts
 */
function CraftingUpdatePreview() {
	if (!CraftingPreview) {
		return;
	}
	CraftingPreview.Appearance = Player.Appearance.slice();
	CharacterReleaseTotal(CraftingPreview, false);
	if (CraftingNakedPreview) CharacterNaked(CraftingPreview, false);
	if (!CraftingSelectedItem) return;
	CraftingPropertyUpdateButtons(CraftingSelectedItem);
	const Craft = CraftingConvertSelectedToItem(CraftingSelectedItem);
	const FoundGroups = new Set();
	const RelevantAssets = (CraftingAssets[Craft.Item] ?? []).filter(a => {
		if (FoundGroups.has(a.DynamicGroupName)) {
			return false;
		} else {
			FoundGroups.add(a.DynamicGroupName);
			return true;
		}
	});

	for (const RelevantAsset of RelevantAssets) {
		InventoryWear(CraftingPreview, RelevantAsset.Name, RelevantAsset.DynamicGroupName, null, null, Player.MemberNumber, Craft, false);
		// Hack for the stuff in ItemAddons, since there's no way to resolve their prerequisites
		if (!RelevantAsset.Prerequisite.includes("OnBed")) {
			continue;
		}
		const bedType = RelevantAsset.Name.includes("Medical") ? "MedicalBed" : "Bed";
		const bed = AssetGet(CraftingPreview.AssetFamily, "ItemDevices", bedType);
		if (bed) {
			InventoryWear(CraftingPreview, bed.Name, bed.DynamicGroupName, null, null, Player.MemberNumber, null, false);
		}
	}
	CharacterRefresh(CraftingPreview, false, false);
}

/**
 * Run the club crafting room if all possible modes
 * @returns {void} - Nothing
 */
function CraftingRun() {
	if (!CraftingPreview) {
		return;
	}

	if (CraftingMode == "Name") {
		DrawCharacter(CraftingPreview, 775, 100, 0.9, false);
	}

	// In color mode, the player can change the color of each parts of the item
	if (CraftingMode == "Color") {
		if (!CraftingSelectedItem?.Asset) {
			return;
		}
		DrawText(TextGet("SelectColor"), 600, 60, "White", "Black");
		DrawCharacter(CraftingPreview, -100, 100, 2, false);
		DrawCharacter(CraftingPreview, 700, 100, 0.9, false);
		DrawButton(880, 900, 90, 90, "", "white", `Icons/${CraftingNakedPreview ? "Dress" : "Naked"}.png`);
		ItemColorDraw(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName, 1100, 15, 875, 970);
	}

	// Need the `DialogFocusItem` check here as there's a bit of a race condition
	if (CraftingMode == "Extended" && DialogFocusItem) {
		CommonCallFunctionByNameWarn(`Inventory${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Draw`);
		DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
		DrawCharacter(CraftingPreview, 500, 100, 0.9, false);
	}

	if (CraftingMode == "Tighten" && DialogTightenLoosenItem) {
		TightenLoosenItemDraw(DialogTightenLoosenItem);
		DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
		DrawCharacter(CraftingPreview, 500, 100, 0.9, false);
	}

	if (CraftingMode == "OverridePriority") {
		DrawCharacter(CraftingPreview, 500, 100, 0.9, false);
	}
}

/** @type {ScreenResizeHandler} */
function CraftingResize(load) {
	const dialog = document.getElementById("crafting-import-dialog");
	if (dialog) {
		ElementSetFontSize(dialog);
	}

	switch (CraftingMode) {
		case "OverridePriority":
			Layering.Resize(load);
			return;
		case "Name":
			ElementPositionFixed(CraftingID.root, 0, 15, 2000, 970);
			return;
	}
	if (CommonHas(CraftingSlots.modeKeys, CraftingMode)) {
		CraftingSlots.Resize(load);
		return;
	}
}

/** @type {KeyboardEventListener} */
function CraftingKeyDown(ev) {
	const dialog = document.getElementById("crafting-import-dialog");
	dialog: if (dialog) {
		const searchInput = /** @type {null | HTMLInputElement} */(dialog.shadowRoot?.querySelector("input[type='search']"));
		const scrollBox = /** @type {null | HTMLDivElement} */(dialog.shadowRoot?.querySelector("div.scroll-box"));
		if (!searchInput || !scrollBox) {
			break dialog;
		}
		if (CommonKey.NavigationKeyDown(scrollBox, ev, (el) => el.querySelector("fieldset")?.clientHeight ?? (el.clientHeight / 10))) {
			return true;
		} else if (CommonKey.InputKeyDown(searchInput, ev)) {
			return true;
		} else {
			return false;
		}
	}

	if (CommonHas(CraftingSlots.modeKeys, CraftingMode)) {
		return CraftingSlots.KeyDown(ev);
	}
	return false;
}

/** @type {ClipboardEventListener} */
function CraftingPaste(ev) {
	const dialog = document.getElementById("crafting-import-dialog");
	dialog: if (dialog) {
		const searchInput = /** @type {null | HTMLInputElement} */(dialog.shadowRoot?.querySelector("input[type='search']"));
		if (!searchInput) {
			break dialog;
		}
		CommonKey.InputPaste(searchInput, ev);
		return;
	}

	if (CommonHas(CraftingSlots.modeKeys, CraftingMode)) {
		CraftingSlots.Paste(ev);
		return;
	}
}

/** @type {ScreenUnloadHandler} */
function CraftingUnload() {
	const dialog = document.getElementById("crafting-import-dialog");
	if (dialog) {
		dialog.remove();
		return;
	}

	switch (CraftingMode) {
		case "OverridePriority":
			Layering.Unload();
			return;
		case "Name": {
			document.getElementById(CraftingID.root)?.toggleAttribute("hidden", true);
			return;
		}
	}
	if (CommonHas(CraftingSlots.modeKeys, CraftingMode)) {
		CraftingSlots.Unload();
		return;
	}
}

/**
 * Update {@link CraftingSelectedItem.ItemProperties} with a select few properties from the passed item.
 * @param {Item} item - The item whose properties should be copied.
 * @returns {void}
 */
function CraftingUpdateFromItem(item) {
	if (!CraftingSelectedItem || !item.Property) {
		return;
	}

	/** @type {(keyof ItemProperties)[]} */
	const omit = [...CraftingPropertyExclude, "Effect"];
	omit.push(
		// @ts-expect-error
		"LayerOverrides", // LSCG as of v0.8.17
		"wceOverrideHide", // WCE as of v6.3.19
	);

	CraftingSelectedItem.ItemProperty = {};
	const propNames = ItemPropertiesGetBundleProperties(item, { omit, allowLocks: false }).properties;
	for (const name of propNames) {
		/** @type {Unknown<ItemProperties>} */(CraftingSelectedItem.ItemProperty)[name] = item.Property[name];
	}

	// Move from `ItemProperty` to `TypeRecord`
	CraftingSelectedItem.TypeRecord = CraftingSelectedItem.ItemProperty.TypeRecord ?? {};
	delete CraftingSelectedItem.ItemProperty.TypeRecord;
}

/**
 * Return a list of all searchable asset names.
 * @deprecated
 * @returns {string[]}
 */
function CraftingGetAllAssetNames() {
	/** @type {Set<string>} */
	const visited = new Set();

	return Object.values(CraftingAssets).flat().sort((asset1, asset2) => {
		return asset1 && asset2 ? asset1.Description.localeCompare(asset2.Description) : 0;
	}).filter(/** @type {(asset?: Asset) => asset is Asset} */(asset) => {
		if (!asset) {
			return false;
		}
		const status = InventoryAvailable(Player, asset.Name, asset.Group.Name) && !visited.has(asset.Description);
		if (status) {
			visited.add(asset.Description);
		}
		return status;
	}).map((asset) => asset.Description);
}

/**
 * Sets the new mode and creates or removes the inputs
 * @param {CraftingMode} NewMode - The new mode to set
 * @returns {void} - Nothing
 */
function CraftingModeSet(NewMode) {
	CraftingUnload();

	CraftingMode = NewMode;
	switch (NewMode) {
		case "Name": {
			if (!CraftingSelectedItem) {
				// Variable always assigned in `CraftingClick()` before switching mode; if not? Everything and anything is broken at this point
				throw new Error("No `CraftingSelectedItem` has been selected");
			}

			document.getElementById(CraftingID.root)?.toggleAttribute("hidden", false);
			CraftingResize(false);

			if (CraftingSelectedItem.Asset) {
				// Select the asset
				document.querySelector(`#${CraftingID.assetGrid} [name='${CraftingSelectedItem.Asset.Name}'][data-group='${CraftingSelectedItem.Asset.DynamicGroupName}']`)?.dispatchEvent(new Event("click"));
			} else {
				// Open the side pannel and manually updating the crafting preview to clear it of old items
				document.querySelector(`#${CraftingID.assetButton}[aria-checked='false']`)?.dispatchEvent(new Event("click"));
				CraftingUpdatePreview();
			}
			return;
		}
	}
	if (CommonHas(CraftingSlots.modeKeys, NewMode)) {
		CraftingSlots._changeMode(/** @type {CraftingSlotModes} */(NewMode));
		return;
	}
}

/**
 * Serialize a single crafted item into a string in order to prepare it for server saving
 * @param {CraftingItem} craft The crafted item
 * @returns {string} The serialized crafted item
 * @see {@link CraftingSaveServer}
 */
function CraftingSerialize(craft) {
	const asset = CraftingAssets[craft.Item]?.[0];
	if (!asset) {
		return "";
	}

	const item = AppearanceItem.fromAsset(asset, { property: craft.ItemProperty ?? {} });
	const property = ItemPropertiesCompress(item, { omit: ["TypeRecord"] });

	/** @type {string[]} */
	const stringData = [
		craft.Item,
		"", // Old field as used by the deprecated `Property` crafted craft property, DO NOT REMOVE!
		(craft.Lock == null) ? "" : craft.Lock,
		(craft.Name == null) ? "" : craft.Name.substring(0, 30),
		(craft.Description == null) ? "" : craft.Description.substring(0, 200),
		(craft.Color == null) ? "" : craft.Color,
		(craft.Private) ? "T" : "",
		"", // Old field as used by the deprecated `Type` crafted craft property, DO NOT REMOVE!
		"", // Old field as used by the deprecated `OverridePriority` crafted craft property, DO NOT REMOVE!
		(property == null) ? "" : JSON.stringify(property),
		(craft.TypeRecord == null) ? "" : JSON.stringify(craft.TypeRecord),
		(!craft.DifficultyFactor) ? "" : craft.DifficultyFactor.toString(),
		(craft.Effects == null) ? "" : JSON.stringify(craft.Effects),
	];
	return stringData.map(i => i.replace(CraftingSerializeSanitize, "")).join(CraftingSerializeFieldSep);
}

/**
 * Prepares a compressed packet of the crafting data and sends it to the server
 * @returns {void} - Nothing
 */
function CraftingSaveServer() {
	if (Player.Crafting == null) return;
	let P = Player.Crafting.map(C =>  (C == null) ? "" : CraftingSerialize(C)).join(CraftingSerializeItemSep);
	while ((P.length >= 1) && (P.substring(P.length - 1) == CraftingSerializeItemSep))
		P = P.substring(0, P.length - 1);
	const Obj = { Crafting: LZString.compressToUTF16(P) };
	ServerAccountUpdate.QueueData(Obj, true);
}


/**
 * Deserialize a single crafted item from a string in order to parse data received from the server.
 * @param {string} craftString The serialized crafted item
 * @returns {null | CraftingItem} The crafted item or `null` if either its {@link CraftingItem.Item} or {@link CraftingItem.Name} property is invalid
 * @see {@link CraftingDecompressServerData}
 */
function CraftingDeserialize(craftString) {
	const [
		Item,
		Property,
		Lock,
		Name,
		Description,
		Color,
		Private,
		_Type,
		OverridePriority,
		ItemProperty,
		TypeRecord,
		DifficultyFactor,
		Effects,
	] = craftString.split(CraftingSerializeFieldSep);

	const asset = CraftingAssets[Item]?.[0];
	if (!asset) {
		return null;
	}

	const property = ItemPropertiesDecompress(
		AppearanceItem.fromAsset(asset),
		/** @type {ItemPropertiesMinimized} */(CommonJSONParse(ItemProperty || "{}") ?? {}),
		{ initExtendedItem: false },
	);
	/** @type {CraftingItem & { ItemProperty: ItemProperties }} */
	const craft = {
		Item,
		Name,
		Description,
		Color,
		Property: /** @type {CraftingPropertyType} */(Property) || undefined,
		Lock: /** @type {AssetLockType} */(Lock),
		Private: Private === "T",
		ItemProperty: property,
		TypeRecord: TypeRecord ? /** @type {TypeRecord} */ (CommonJSONParse(TypeRecord)) : null,
		DifficultyFactor: DifficultyFactor ? Number.parseInt(DifficultyFactor, 10) : undefined,
		Effects: Effects ? /** @type {Partial<Record<CraftingPropertyType, number>>} */(CommonJSONParse(Effects) ?? {}) : {},
		Partial: false,
	};

	const priority = Number.parseInt(OverridePriority, 10);
	if (!Number.isNaN(priority)) {
		craft.ItemProperty.OverridePriority = priority;
	}

	return craft;
}

/**
 * Deserialize and unpack the crafting data from the server.
 * @param {string | undefined} Data The serialized crafting data or already-decompressed crafting item list
 * @returns {(null | CraftingItem)[]}
 */
function CraftingDecompressServerData(Data) {
	if (typeof Data !== "string") return [];

	// Decompress the data
	let DecompressedData = null;
	try {
		DecompressedData = LZString.decompressFromUTF16(Data);
	} catch {
		DecompressedData = null;
	}
	if (DecompressedData == null) {
		console.error("An error occurred while decompressing Crafting data, entries have been reset.");
		return [];
	}

	// Builds the craft array to assign to the player
	return DecompressedData.split(CraftingSerializeItemSep).map(CraftingDeserialize);
}

/**
 * Loads the server packet and creates the crafting array for the player
 * @param {string | undefined} Packet - The packet or already-decompressed crafting item list
 * @returns {void} - Nothing
 */
function CraftingLoadServer(Packet) {
	Player.Crafting = [];
	let Refresh = false;
	/** @type {Record<number, unknown>} */
	const CriticalErrors = {};
	const data = CraftingDecompressServerData(Packet);
	for (const [i, item] of CommonEnumerate(data)) {
		if (item == null) {
			Player.Crafting.push(null);
			continue;
		}

		// Make sure that the item is a valid craft
		switch (CraftingValidate(item, undefined, undefined, true)) {
			case CraftingStatusType.OK:
				Player.Crafting.push(item);
				break;
			case CraftingStatusType.ERROR:
				Player.Crafting.push(item);
				Refresh = true;
				break;
			case CraftingStatusType.CRITICAL_ERROR:
				Player.Crafting.push(null);
				Refresh = true;
				CriticalErrors[i] = (item);
				break;
		}

		// Too many items, skip the rest
		if (Player.Crafting.length >= 200) break;
	}

	// One or more validation errors were encountered that were successfully resolved;
	// push the fixed items back to the server
	if (Refresh) {
		const nCritical = Object.keys(CriticalErrors).length;
		if (nCritical > 0) {
			console.error(`Removing ${nCritical} corrupted crafted items`, CriticalErrors);
		}
		CraftingSaveServer();
	}
}

/**
 * Handles clicks in the crafting room.
 * @type {MouseEventListener}
 */
function CraftingClick(event) {
	if (!CraftingPreview) {
		return;
	}

	// Can always exit or cancel
	if (MouseIn(1895, 15, 90, 90) && !["Slot", "Reorder", "Delete", "Color", "Extended", "OverridePriority", "Name"].includes(CraftingMode)) CraftingExit();
	if (MouseIn(1790, 15, 90, 90) && !["Color", "Extended", "Slot", "Reorder", "Delete", "OverridePriority", "Name"].includes(CraftingMode)) return CraftingModeSet("Slot");

	// In color selection mode, we allow picking a color
	if (CraftingMode == "Color") {
		if (!CraftingSelectedItem?.Asset) {
			return;
		} else if (MouseIn(880, 900, 90, 90)) {
			CraftingNakedPreview = !CraftingNakedPreview;
			CraftingUpdatePreview();
		} else if (MouseIn(1100, 15, 875, 970)) {
			ItemColorClick(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName, 1100, 15, 875, 970);
		}
		return;
	}

	// Need the `DialogFocusItem` check here as there's a bit of a race condition
	if (CraftingMode == "Extended" && DialogFocusItem) {
		CommonCallFunctionByNameWarn(`Inventory${DialogFocusItem.Asset.Group.Name}${DialogFocusItem.Asset.Name}Click`);
	}

	if (CraftingMode == "Tighten" && DialogTightenLoosenItem) {
		TightenLoosenItemClick(CraftingPreview, DialogTightenLoosenItem);
	}
}

/**
 * Refreshes the preview model with a slight delay so the item color process is done
 * @deprecated
 * @returns {void} - Nothing
 */
function CraftingRefreshPreview() {
	if (!CraftingPreview || !CraftingSelectedItem?.Asset) {
		return;
	}
	let Item = InventoryGet(CraftingPreview, CraftingSelectedItem.Asset.DynamicGroupName);
	if ((Item != null) && (Item.Color != null)) {
		CraftingSelectedItem.Color = Array.isArray(Item.Color) ? Item.Color.join(",") : Item.Color || "";
		CraftingUpdatePreview();
	}
}

/**
 * Converts the currently selected item into a crafting item.
 * @param {CraftingItemSelected} item
 * @returns {CraftingItem}
 */
function CraftingConvertSelectedToItem(item) {
	for (const [k, v] of CommonEntries(item.Effects)) {
		if (!v) {
			delete item.Effects[k];
		}
	}

	return {
		Item: (item.Asset == null) ? "" : item.Asset.Name,
		Lock: (item.Lock == null) ? "" : /**@type {AssetLockType}*/(item.Lock.Name),
		Name: item.Name,
		Description: item.Description,
		Color: item.Color,
		Private: item.Private,
		TypeRecord: item.TypeRecord || null,
		DifficultyFactor: item.DifficultyFactor || undefined,
		ItemProperty: item.ItemProperty,
		Effects: item.Effects,
		Partial: false,
	};
}

/**
 * Convert a crafting item to its selected format.
 * @param {CraftingItem} Craft
 * @returns {CraftingItemSelected}
 */
function CraftingConvertItemToSelected(Craft) {
	return {
		Name: Craft.Name,
		Description: Craft.Description,
		DifficultyFactor: Craft.DifficultyFactor ?? 0,
		Color: Craft.Color,
		Private: Craft.Private,
		TypeRecord: Craft.TypeRecord ? { ...Craft.TypeRecord } : null,
		Assets: CraftingAssets[Craft.Item] ?? [],
		Effects: { ...Craft.Effects },
		get Asset() {
			return this.Assets[0];
		},
		Lock: Craft.Lock && InventoryAvailable(Player, Craft.Lock, "ItemMisc") ? AssetGet(Player.AssetFamily, "ItemMisc", Craft.Lock) : null,
		ItemProperty: Craft.ItemProperty ? CommonCloneDeep(Craft.ItemProperty) : {},
		get OverridePriority() {
			return this.ItemProperty.OverridePriority;
		},
		set OverridePriority(value) {
			if (value == null) {
				delete this.ItemProperty.OverridePriority;
			} else {
				this.ItemProperty.OverridePriority = value;
			}
		},
	};
}

/** Restore the DOM elements of the `Name` subscreen to their default state. */
function CraftingExitResetElements() {
	// Reset the various input fields to their default
	const [nameInput, colorsInput, descriptionInput, priorityInput, privateInput] = /** @type {HTMLInputElement[]} */([
		document.getElementById(CraftingID.nameInput),
		document.getElementById(CraftingID.colorsInput),
		document.getElementById(CraftingID.descriptionInput),
		document.getElementById(CraftingID.layeringInput),
		document.getElementById(CraftingID.privateCheckbox),
	]);
	nameInput.value = nameInput.defaultValue = nameInput.placeholder = "";
	colorsInput.value = colorsInput.defaultValue = colorsInput.placeholder = "";
	priorityInput.value = priorityInput.defaultValue = priorityInput.placeholder = "0";
	descriptionInput.value = "";
	descriptionInput.setCustomValidity("");
	privateInput.checked = false;
	document.querySelector(`#${CraftingID.asciiDescriptionCheckbox}[checked='true']`)?.dispatchEvent(new Event("click"));

	// Deselect the active lock and disable them all
	document.querySelector(`#${CraftingID.padlockGrid} [name][aria-checked='true']`)?.dispatchEvent(new Event("click"));
	document.querySelectorAll(`#${CraftingID.padlockGrid} [name]`).forEach(e => e.setAttribute("aria-disabled", "true"));

	// Deselect the asset and disable the accept button
	const assetSelected = document.querySelector(`#${CraftingID.assetGrid} [aria-checked='true']`);
	assetSelected?.setAttribute("aria-checked", "false");
	assetSelected?.setAttribute("tabindex", "-1");
	document.querySelector(`#${CraftingID.assetGrid} [name]`)?.setAttribute("tabindex", "0");
	document.getElementById(CraftingID.acceptButton)?.setAttribute("aria-disabled", "true");

	// Open the asset-based side panel and reset the styling of its control button
	const assetControlButton = /** @type {null | HTMLButtonElement} */(document.getElementById(CraftingID.assetButton));
	if (assetControlButton) {
		assetControlButton.innerHTML = "";
		// FIXME: Avoid using private API like this
		ElementButton._ParseLabel(assetControlButton.id, TextGet("SelectItem"), "bottom", { parent: assetControlButton });
		ElementButton._ParseImage(assetControlButton.id, "./Icons/NoCraft.png", null, { parent: assetControlButton });
		if (assetControlButton.getAttribute("aria-checked") === "false") {
			assetControlButton.click();
		}
	}

	// Disable all buttons that _must_ have an asset selected
	const [extendedButton, colorButton, layeringButton, tightenButton] = /** @type {(HTMLButtonElement)[]} */([
		document.getElementById(CraftingID.extendedButton),
		document.getElementById(CraftingID.colorsButton),
		document.getElementById(CraftingID.layeringButton),
		document.getElementById(CraftingID.tightenButton),
	]);
	extendedButton.disabled = true;
	tightenButton.disabled = true;
	colorButton.disabled = true;
	colorsInput.disabled = true;
	layeringButton.disabled = true;
	priorityInput.disabled = true;

	// Clear all search inputs and undo their filtering
	const searchInputs = /** @type {NodeListOf<HTMLInputElement>} */(document.querySelectorAll(`#${CraftingID.leftPanel} input[type='search']`));
	for (const searchInput of searchInputs) {
		searchInput.value = "";
		searchInput.dispatchEvent(new Event("input"));
	}

	const focusGroup = document.querySelector(`#${CraftingID.centerPanel} [role='radio'][aria-checked='true']`);
	if (focusGroup) {
		focusGroup.dispatchEvent(new PointerEvent("click"));
		document.querySelectorAll(`#${CraftingID.assetGrid} [data-hidden-group]`).forEach(e => e.toggleAttribute("data-hidden-group", false));
	}

	// Close the side panel
	document.querySelector(`#${CraftingID.leftPanel} > [aria-checked='true']`)?.dispatchEvent(new Event("click"));

	// Reset property button label
	document.getElementById(CraftingID.propertyButton)?.replaceChildren(TextGet(`PropertyNormal`) + ": " + TextGet(`DescriptionNormal`));
}

/**
 * When the player exits the crafting room
 * @satisfies {ScreenExitHandler}
 * @param {boolean} allowPanelClose - Whether an exit call in the `Name` mode is allowed to close the side panels before performing a proper exit of the subscreen
 */
function CraftingExit(allowPanelClose=true) {
	const dialog = document.getElementById("crafting-import-dialog");
	if (dialog) {
		dialog.remove();
		return;
	}

	// Return to the `Name` sub-screen, if already there move to the `Slot` sub-screen and if already there exit the crafting screen
	switch (CraftingMode) {
		case "OverridePriority":
			Layering.Exit();
			return;
		case "Color":
			ItemColorExitClick();
			return;
		case "Tighten":
		case "Extended":
			DialogLeaveFocusItem();
			return;
		case "Name": {
			const activePanel = document.querySelector(`#${CraftingID.leftPanel} > [aria-checked='true']`);
			const activeGroup = document.querySelector(`#${CraftingID.centerPanel} [aria-checked='true']`);
			if ((activePanel || activeGroup) && allowPanelClose) {
				activePanel?.dispatchEvent(new PointerEvent("click"));
				activeGroup?.dispatchEvent(new PointerEvent("click"));
			} else {
				CraftingExitResetElements();
				CraftingUnload();
				CraftingModeSet("Slot");
				CraftingSelectedItem = null;
			}
			return;
		}
	}

	if (CommonHas(CraftingSlots.modeKeys, CraftingMode)) {
		if (CraftingSlots.Exit(allowPanelClose)) {
			return;
		}

		// Clear the hash from the URL as (potentially) assigned by clicking on anchor elements
		globalThis.location.hash = "";
		CraftingMode = "Slot";
		ElementRemove(CraftingID.root);
		if (CraftingPreview) {
			CharacterDelete(CraftingPreview);
			CraftingPreview = null;
		}
		CraftingElements._SearchCache.clear();
		if (CraftingReturnToChatroom) {
			CommonSetScreen("Online", "ChatRoom");
		} else {
			CommonSetScreen("Room", "MainHall");
		}
		return;
	}
}

/**
 * Applies the craft to all matching items
 * @deprecated
 * @param {CraftingItem} Craft
 * @param {Asset} Item
 */
function CraftingAppliesToItem(Craft, Item) {
	// Validates the craft asset
	if (!Craft || !Item) return false;

	const eligibleAssets = CraftingAssets[Craft.Item] ?? [];
	return eligibleAssets.includes(Item);
}

/**
 * Builds the item list from the player inventory, filters by the search box content
 * @returns {Asset[]} - Nothing
 */
function CraftingItemListBuild() {
	const assets = new Set(Object.values(CraftingAssets).map(i => i?.[0]));
	return Array.from(assets).filter(/** @type {(a?: Asset) => a is Asset} */a => {
		return a != null && InventoryAvailable(Player, a.Name, a.DynamicGroupName);
	}).sort((a1, a2) => {
		return a1.Description.localeCompare(a2.Description);
	});
}

/**
 * @param {CraftingPartialItem} craft
 * @returns {craft is CraftingItem}
 */
function CraftingIsNonPartial(craft) {
	return craft.Partial === false;
}

/**
 * A record with tools for validating {@link CraftingItem} properties.
 * @type {Record<keyof CraftingItem, CratingValidationStruct>}
 * @see {@link CratingValidationStruct}
 * @todo Let the Validate/GetDefault functions take the respective attribute rather than the entire {@link CraftingItem}
 */
var CraftingValidationRecord = {
	Color: {
		Validate: function(craft, asset) {
			if (typeof craft.Color !== "string") {
				return false;
			} else if ((craft.Color === "") || (asset == null)) {
				return true;
			} else {
				const Colors = craft.Color.replace(" ", "").split(",");
				return Colors.every((c) => CommonIsColor(c) || (c === "Default"));
			}
		},
		GetDefault: function(craft, asset) {
			if ((typeof craft.Color !== "string") || (asset == null)) {
				return "";
			} else {
				const Colors = craft.Color.replace(" ", "").split(",");
				const ColorsNew = Colors.map((c, i) => CommonIsColor(c) ? c : asset.DefaultColor[i] || "Default");
				return ColorsNew.join(",");
			}
		},
		StatusCode: CraftingStatusType.ERROR,
	},
	Partial: {
		Validate: function (c, a, _, partial) {
			return partial ? c.Partial === undefined : c.Partial === false;
		},
		GetDefault: function (c, a, _, partial) {
			return partial ? undefined : false;
		},
		StatusCode: CraftingStatusType.ERROR,
	},
	Description: {
		Validate: (c, a) => typeof c.Description === "string",
		GetDefault: (c, a) => "",
		StatusCode: CraftingStatusType.ERROR,
		Partial: true,
	},
	DifficultyFactor: {
		Validate: function (c, a) {
			return (c.DifficultyFactor == null || CommonIsInteger(c.DifficultyFactor, -100, 4)) ? true : false;
		},
		GetDefault: function (c, a) {
			return CommonIsInteger(c.DifficultyFactor) ? CommonClamp(c.DifficultyFactor, -100, 4) : undefined;
		},
		StatusCode: CraftingStatusType.ERROR,
	},
	Disabled: {
		Validate: function (c, a) {
			return c.Disabled == null || typeof c.Disabled === "boolean";
		},
		GetDefault: function (c, a) {
			return undefined;
		},
		StatusCode: CraftingStatusType.ERROR,
	},
	Item: {
		Validate: (c, a, checkPlayerInventory=false) => {
			if (checkPlayerInventory) {
				const groupName = CraftingAssets[c.Item]?.[0]?.DynamicGroupName;
				return groupName ? InventoryAvailable(Player, c.Item, groupName) : false;
			} else {
				return Asset.some((i) => i.Name === c.Item);
			}
		},
		GetDefault: (c, a, checkPlayerInventory=false) => {
			/** @type {AssetName | undefined} */
			let ret = undefined;
			if (checkPlayerInventory) {
				ret = Asset.find((i) => i.Name === c.Item)?.Name ?? a?.Name;
			} else {
				ret = a?.Name;
			}
			ret ??= LoginInventoryFixups.find(fixup => c.Item === fixup.Old.Name)?.New.Name;
			return ret;
		},
		StatusCode: CraftingStatusType.CRITICAL_ERROR,
	},
	Lock: {
		Validate: function (c, a, checkPlayerInventory=false) {
			if ((a != null) && (!a.AllowLock)) {
				return (c.Lock === "");
			} else if (c.Lock === "") {
				return true;
			}

			const isValidLock = CraftingLockList.includes(c.Lock);
			if (checkPlayerInventory) {
				return isValidLock && InventoryAvailable(Player, c.Lock, "ItemMisc");
			} else {
				return isValidLock;
			}
		},
		GetDefault: (c, a) => "",
		StatusCode: CraftingStatusType.ERROR,
	},
	MemberName: {
		Validate: (c, a) => c.MemberName == null || typeof c.MemberName === "string",
		GetDefault: (c, a) => null,
		StatusCode: CraftingStatusType.ERROR,
		Partial: true,
	},
	MemberNumber: {
		Validate: (c, a) => c.MemberNumber == null || typeof c.MemberNumber === "number",
		GetDefault: (c, a) => null,
		StatusCode: CraftingStatusType.ERROR,
		Partial: true,
	},
	Name: {
		Validate: (c, a) => !!c.Name && typeof c.Name === "string",
		GetDefault: (c, a) => a ? a.Description : "Crafted Item",
		StatusCode: CraftingStatusType.ERROR,
		Partial: true,
	},
	OverridePriority: {
		Validate: (c, a) => (c.OverridePriority == null) || Number.isInteger(c.OverridePriority),
		GetDefault: (c, a) => null,
		StatusCode: CraftingStatusType.ERROR,
	},
	Private: {
		Validate: (c, a) => typeof c.Private === "boolean",
		GetDefault: (c, a) => false,
		StatusCode: CraftingStatusType.ERROR,
		Partial: true,
	},
	Property: {
		Validate: (c, a) => c.Property === undefined,
		GetDefault: (c, a) => undefined,
		StatusCode: CraftingStatusType.ERROR,
		Partial: true,
	},
	Effects: {
		Validate: function (c, a) {
			if (!CommonIsObject(c.Effects)) {
				return false;
			}

			let nEffects = 0;
			for (const [effect, effectValue] of CommonEntries(c.Effects)) {
				const prerequisite = CraftingEffectsPrerequisite[effect];
				const validateProp = CraftingPropertyMap.get(effect);
				if (
					!prerequisite // Invalid effect type
					|| !validateProp // Invalid effect type
					|| effect === "Normal" // `Normal` is _never_ explicit and always implicit
					|| !effectValue // Falsely value, equivalent to the value being absent
					|| !CommonIsInteger(effectValue, 1, prerequisite.max ?? CraftingEffectsDefaultMaximumStack) // Value is either not an integer or out of bounds
					|| (prerequisite.isDisabled?.(c) ?? false) // Conflict with other crafting effects
					|| (a && !validateProp(a)) // Conflict with some asset property
					|| nEffects >= CraftingEffectsDefaultMaximumEffects // Too many effects
				) {
					return false;
				}
				nEffects++;
			}
			return true;
		},
		GetDefault: (c, a) => {
			if (!CommonIsObject(c.Effects)) {
				return {};
			}

			/** @type {CraftingItem["Effects"]} */
			const ret = {};
			let nEffects = 0;
			for (const [effect, effectValue] of CommonEntries(c.Effects)) {
				const prerequisite = CraftingEffectsPrerequisite[effect];
				const validateProp = CraftingPropertyMap.get(effect);
				if (
					!prerequisite // Invalid effect type
					|| !validateProp // Invalid effect type
					|| effect === "Normal" // `Normal` is _never_ explicit and always implicit
					|| !effectValue // Falsely value, equivalent to the value being absent
					|| !CommonIsInteger(effectValue, 1) // Value is either not an integer or otherwise illegal (<0)
					|| (prerequisite.isDisabled?.({ ...c, Effects: ret }) ?? false) // Conflict with other crafting effects
					|| (a && !validateProp(a)) // Conflict with some asset property
					|| nEffects >= CraftingEffectsDefaultMaximumEffects // Too many effects
				) {
					continue;
				}
				// We can be a bit more lenient with values that are too large and just clamp them w.r.t. the max
				ret[effect] = CommonClamp(effectValue, 1, prerequisite.max ?? CraftingEffectsDefaultMaximumStack);
				nEffects++;
			}
			return ret;
		},
		StatusCode: CraftingStatusType.ERROR,
		Partial: true,
	},
	ItemProperty: {
		Validate: function (c, a) {
			const property = c.ItemProperty;
			if (property == null) {
				return true;
			} else if (!CommonIsObject(property)) {
				return false;
			} else if (!a) {
				return true;
			}

			// TODO: Add a better way of validating subscreen properties rather than just unconditionally
			// allowing `OverrideHeight`.
			/** @type {ItemProperties} */
			const baseline = {
				OverrideHeight: undefined,
			};
			if (a.Archetype) {
				const data = ExtendedItemGetData(a, a.Archetype);
				if (data && data.baselineProperty) {
					CommonAssign(baseline, data.baselineProperty);
				}
			}

			/** @satisfies {Set<keyof ItemProperties>} */
			const layeringScalar = new Set(/** @type {const} */([
				"TranslationX",
				"TranslationY",
				"ScaleX",
				"ScaleY",
				"Rotation",
			]));
			/** @satisfies {Set<keyof ItemProperties>} */
			const layeringObject = new Set(/** @type {const} */([
				"LayerTranslationX",
				"LayerTranslationY",
				"LayerScaleX",
				"LayerScaleY",
				"LayerRotation",
			]));
			// Must match Layering / Property / CommonDraw: unnamed layers key as ""
			/** @type {null | string[]} */
			let layers = null;
			for (const [key, value] of CommonEntries(property)) {
				if (value == null) {
					continue;
				} else if (CraftingPropertyExclude.has(key)) {
					return false;
				} else if (key === "OverridePriority") {
					if (Number.isInteger(value)) {
						continue;
					} else if (CommonIsObject(value)) {
						layers ??= a.Layer.map(l => l.Name ?? "");
						for (const [layerName, priority] of Object.entries(value)) {
							if (!(layers.includes(layerName) && Number.isInteger(priority))) {
								return false;
							}
						}
					} else {
						return false;
					}
				} else if (layeringScalar.has(key)) {
					if (!Number.isFinite(value)) {
						return false;
					}
				} else if (layeringObject.has(key)) {
					if (!CommonIsObject(value)) {
						return false;
					}
					layers ??= a.Layer.map(l => l.Name ?? "");
					for (const [layerName, i] of Object.entries(value)) {
						if (!layers.includes(layerName)) {
							return false;
						} else if (!(i === undefined || Number.isFinite(i))) {
							return false;
						}
					}
				} else if (typeof value !== typeof baseline[key]) {
					return false;
				}
			}
			return true;
		},
		GetDefault: function (c, a) {
			const property = c.ItemProperty;
			if (!CommonIsObject(property) || !a) {
				return {};
			}

			/** @type {ItemProperties} */
			const baseline = {
				OverrideHeight: undefined,
			};
			if (a.Archetype) {
				let data = ExtendedItemGetData(a, a.Archetype);
				if (data && data.baselineProperty) {
					CommonAssign(baseline, data.baselineProperty);
				}
			}

			/** @satisfies {Set<keyof ItemProperties>} */
			const layeringScalar = new Set(/** @type {const} */([
				"TranslationX",
				"TranslationY",
				"ScaleX",
				"ScaleY",
				"Rotation",
			]));
			/** @satisfies {Set<keyof ItemProperties>} */
			const layeringObject = new Set(/** @type {const} */([
				"LayerTranslationX",
				"LayerTranslationY",
				"LayerScaleX",
				"LayerScaleY",
				"LayerRotation",
			]));
			const layers = a.Layer.map(l => l.Name ?? "");

			/** @type {ItemProperties} */
			const ret = {};
			for (const [key, value] of CommonEntries(property)) {
				if (value == null || CraftingPropertyExclude.has(key)) {
					continue;
				} else if (key === "OverridePriority" && Number.isInteger(value)) {
					ret[key] = /** @type {any} */(value);
				} else if (key === "OverridePriority" && CommonIsObject(value)) {
					ret[key] = {};
					for (const [layerName, priority] of Object.entries(value)) {
						if (layers.includes(layerName) && Number.isInteger(priority)) {
							ret[key][layerName] = priority;
						}
					}
				} else if (layeringScalar.has(key) && Number.isFinite(value)) {
					/** @type {Unknown<ItemProperties>} */(ret)[key] = value;
				} else if (layeringObject.has(key) && CommonIsObject(value)) {
					/** @type {Record<string, number>} */
					const filtered = {};
					for (const [layerName, i] of Object.entries(value)) {
						if (layers.includes(layerName) && (i === undefined || Number.isFinite(i))) {
							filtered[layerName] = i;
						}
					}
					if (Object.keys(filtered).length > 0) {
						/** @type {Unknown<ItemProperties>} */(ret)[key] = filtered;
					}
				} else if (typeof value === typeof baseline[key]) {
					/** @type {Unknown<ItemProperties>} */(ret)[key] = value;
				}
			}
			return ret;
		},
		StatusCode: CraftingStatusType.ERROR,
	},
	// NOTE: More thorough `TypeRecord` validation is performed by the extended item `...Init` functions
	TypeRecord: {
		Validate: function (c, a) {
			const typeRecord = c.TypeRecord;
			if (typeRecord == null) {
				return true;
			} else if (!CommonIsObject(typeRecord)) {
				return false;
			} else if (a == null) {
				return true;
			} else if (!a.Archetype) {
				return typeRecord == null;
			} else {
				return true;
			}
		},
		GetDefault: function (c, a) {
			if (a == null || !a.Archetype) {
				return null;
			} else {
				return {};
			}
		},
		StatusCode: CraftingStatusType.ERROR,
	},
};

/**
 * @overload
 * @param {CraftingPartialItem} Craft
 * @param {Asset | null | undefined} asset
 * @param {boolean | undefined} Warn
 * @param {boolean | undefined} checkPlayerInventory
 * @param {true} partial
 * @returns {CraftingStatusType}
 */
/**
 * @overload
 * @param {CraftingItem} Craft
 * @param {Asset | null} [asset]
 * @param {boolean} [Warn]
 * @param {boolean} [checkPlayerInventory]
 * @param {boolean} [partial]
 * @returns {CraftingStatusType}
 */
/**
 * Validate and sanitize crafting properties of the passed item inplace.
 * @param {CraftingItem} Craft - The crafted item properties or `null`
 * @param {Asset | null} [asset] - The matching Asset. Will be extracted from the player inventory if `null`
 * @param {boolean} [Warn] - Whether a warning should logged whenever the crafting validation fails
 * @param {boolean} [checkPlayerInventory] - Whether or not the player must own the crafted item's underlying asset
 * @param {boolean} [partial] - Whether only a subset of the craft's properties, corresponding to {@link CraftingPartialItem}, should be validated
 * @returns {CraftingStatusType} - One of the {@link CraftingStatusType} status codes; 0 denoting an unrecoverable validation error
 */
function CraftingValidate(Craft, asset=null, Warn=true, checkPlayerInventory=false, partial=false) {
	if (!CommonIsObject(Craft)) {
		return CraftingStatusType.CRITICAL_ERROR;
	}
	/** @type {Map<string, CraftingStatusType>} */
	const StatusMap = new Map();
	const Name = Craft.Name;

	// Manually search for the Asset if it has not been provided
	/** @type {readonly Asset[]} */
	let assets;
	if (asset == null) {
		assets = CraftingAssets[Craft.Item] ?? [];
		if (assets.length === 0) {
			StatusMap.set("Item", CraftingStatusType.CRITICAL_ERROR);
		}
	} else {
		assets = [asset];
	}

	// Conversions of deprecated fields
	if (Craft.Property !== "Normal" && CommonHas(CraftingPropertyMap, Craft.Property) && !Craft.Effects?.[Craft.Property]) {
		Craft.Effects ??= {};
		Craft.Effects[Craft.Property] = 1;
	}

	/**
	 * Check all legal attributes.
	 * If `Asset == null` at this point then let all Asset-requiring checks pass, as we
	 * can't properly validate them. Note that this will introduce the potential for false negatives.
	 */
	for (const [AttrName, { Validate, GetDefault, StatusCode, Partial: IsPartialProperty }] of CommonEntries(CraftingValidationRecord)) {
		if (partial && !IsPartialProperty) {
			// We only want to validate `CraftingPartialItem` here, rather than the full `CraftingItem`
			continue;
		} else if (!assets.some(a => Validate(Craft, a, checkPlayerInventory, partial))) {
			const AttrValue = (typeof Craft[AttrName] === "string") ? `"${Craft[AttrName]}"` : Craft[AttrName];
			if (Warn) {
				console.error(`Invalid "Craft.${AttrName}" value for crafted item "${Name}":`, AttrValue);
			}
			/** @type {Unknown<CraftingItem>} */(Craft)[AttrName] = GetDefault(Craft, asset, checkPlayerInventory, partial);
			StatusMap.set(AttrName, StatusCode);
		} else {
			StatusMap.set(AttrName, CraftingStatusType.OK);
		}
	}

	// If the Asset has been explicitly passed then `Craft.Item` errors are fully recoverable,
	// though the player should actually own the item
	if (assets.length > 0 && StatusMap.get("Item") === CraftingStatusType.CRITICAL_ERROR) {
		StatusMap.set("Item", CraftingStatusType.ERROR);
		if (checkPlayerInventory && !InventoryAvailable(Player, assets[0].Name, assets[0].DynamicGroupName)) {
			Craft.Disabled = true;
		}
	}

	// Check for extra attributes
	const LegalProperties = CommonKeys(CraftingValidationRecord);
	// TODO: narrow the legal property set for `partial` once >= R132 is live
	// const LegalAttributes = (
	// partial
	// ? CommonFilterMap(CommonEntries(CraftingValidationRecord), ([k, v]) => v.Partial ? k : undefined)
	// : CommonKeys(CraftingValidationRecord)
	// );
	for (const AttrName of CommonKeys(Craft)) {
		if (!LegalProperties.includes(AttrName)) {
			if (Warn) {
				console.error(`Invalid extra "Craft.${AttrName}" attribute for ${partial ? "partial " : ""}crafted item "${Name}"`);
			}
			delete Craft[AttrName];
			StatusMap.set(AttrName, CraftingStatusType.ERROR);
		}
	}
	return /** @type {CraftingStatusType} */(Math.min(...StatusMap.values()));
}
