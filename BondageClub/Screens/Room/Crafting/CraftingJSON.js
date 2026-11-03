"use strict";

/**
 * Namespace for encoding & decoding crafting inventories to and from JSON
 */
var CraftingJSON = {
	/**
	 * A cache of imported crafting items
	 * @private
	 * @type {null | { name: string, status: CraftingStatusType, craft: null | CraftingItem }[]}
	 */
	_craftListCache: null,

	/** Get the event listeners for drag and dropping */
	getDragListeners: function getDragListeners() {
		// Need to do some manual book keeping here, as the `dragenter` + `dragleave` duo also fires when dragging between child elements
		/** @type {null | HTMLElement} */
		let draggedItem = null;
		/** @type {null | HTMLElement} */
		let parent = null;

		/** @type {(this: HTMLElement, ev: DragEvent) => void} */
		function dragstart(ev) {
			draggedItem = this.closest("fieldset");
			parent = null;
			if (ev.dataTransfer) {
				ev.dataTransfer.setData("application/my-app", this.id);
				ev.dataTransfer.effectAllowed = "move";
			}
		}

		/** @type {(this: HTMLElement, ev: DragEvent) => void} */
		function dragenter(ev) {
			if (this === parent || !draggedItem) {
				return;
			}
			parent = this;

			/** @type {Element[]} */
			const fieldsets = Array.from(this.parentElement?.children ?? []);
			const indexTarget = fieldsets.indexOf(this);
			if (indexTarget === -1) {
				return;
			}

			// Can't use `getData` here as chrome does not allow its usage outside of drop
			// Fuck standards! Who needs any of those, right?
			const indexSource = fieldsets.indexOf(draggedItem);
			if (indexSource === -1) {
				return;
			}

			if (indexSource > indexTarget) {
				this.classList.toggle("border-top", true);
				this.classList.toggle("border-bottom", false);
			} else if (indexSource < indexTarget) {
				this.classList.toggle("border-top", false);
				this.classList.toggle("border-bottom", true);
			} else {
				this.classList.toggle("border-top", true);
				this.classList.toggle("border-bottom", true);
			}
		}

		/** @type {(this: HTMLElement, ev: DragEvent) => void} */
		function dragleave(ev) {
			if (this !== parent) {
				this.classList.toggle("border-top", false);
				this.classList.toggle("border-bottom", false);
			}
		}

		return { dragenter, dragleave, dragstart };
	},

	/**
	 * @private
	 * @param {Element} fieldset
	 * @param {null | Element} radioContainer
	 * @param {Map<{ inputNew: HTMLInputElement, inputOld: HTMLInputElement }, boolean>} checkLog
	 */
	_queueAdvance: function _queueAdvance(fieldset, radioContainer, checkLog) {
		if (!radioContainer) {
			return;
		}
		fieldset.prepend(radioContainer);

		/** @type {null | HTMLInputElement} */
		const inputNew = radioContainer.querySelector("input[type='radio'][value='new']");
		/** @type {null | HTMLInputElement} */
		const inputOld = fieldset.querySelector("input[type='radio'][value='old']");
		if (!inputOld || !inputNew) {
			return;
		}
		checkLog.set({ inputNew, inputOld }, inputNew.checked);
		inputNew.name = inputOld.name;
	},

	/**
	 * @private
	 * @param {null | HTMLElement} el
	 * @returns {el is HTMLElement}
	 */
	_isTooltip: function _isTooltip(el) {
		return el?.getAttribute("role") === "tooltip";
	},

	/** @satisfies {Record<string, (this: HTMLElement, ev: Event) => any>} */
	eventListeners: {
		focusTooltip: function() {
			const tooltips = ElementUnpackIDs.fromAttribute(this, "aria-owns", { filter: CraftingJSON._isTooltip });
			tooltips.forEach(e => e.toggleAttribute("data-focus", true));
		},

		blurTooltip: function() {
			const tooltips = ElementUnpackIDs.fromAttribute(this, "aria-owns", { filter: CraftingJSON._isTooltip });
			tooltips.forEach(e => e.toggleAttribute("data-focus", false));
		},

		hoverinTooltip: function() {
			const tooltips = ElementUnpackIDs.fromAttribute(this, "aria-owns", { filter: CraftingJSON._isTooltip });
			tooltips.forEach(e => e.toggleAttribute("data-hover", true));
		},

		hoveroutTooltip: function() {
			const tooltips = ElementUnpackIDs.fromAttribute(this, "aria-owns", { filter: CraftingJSON._isTooltip });
			tooltips.forEach(e => e.toggleAttribute("data-hover", false));
		},

		/** @type {(this: HTMLElement, ev: DragEvent) => void} */
		dragover: function(ev) {
			if (ev.dataTransfer) {
				ev.preventDefault();
				ev.dataTransfer.dropEffect = "move";
			}
		},

		/** @type {(this: HTMLElement, ev: DragEvent) => void} */
		drop: function(ev) {
			ev.preventDefault();
			const fieldsets = Array.from(this.children);

			// Identify the target and source elements
			const elemTarget = ev.target instanceof Element ? ev.target.closest("[draggable='true']") : null;
			const fieldsetTarget = elemTarget?.closest("fieldset");
			const indexTarget = fieldsetTarget ? fieldsets.indexOf(fieldsetTarget) : -1;
			if (!elemTarget || indexTarget === -1 || !CraftingJSON._craftListCache || !ev.dataTransfer) {
				return;
			}

			const data = ev.dataTransfer.getData("application/my-app");
			const root = /** @type {ShadowRoot} */(this.getRootNode());
			const elemSource = root.getElementById(data);
			const fieldsetSource = elemSource?.closest("fieldset");
			const indexSource = fieldsetSource ? fieldsets.indexOf(fieldsetSource) : -1;
			if (!elemSource || indexSource === -1 || indexSource === indexTarget) {
				return;
			}

			this.setAttribute("aria-busy", "true");

			// Reorder the draggable
			/** @type {Map<{ inputNew: HTMLInputElement, inputOld: HTMLInputElement }, boolean>} */
			const checkedStates = new Map();
			elemSource.remove();
			let index = indexSource;
			if (indexSource < indexTarget) {
				while (index < indexTarget) {
					CraftingJSON._queueAdvance(fieldsets[index], this.children[++index].querySelector("[draggable='true']"), checkedStates);
				}
			} else {
				while (index > indexTarget) {
					CraftingJSON._queueAdvance(fieldsets[index], this.children[--index].querySelector("[draggable='true']"), checkedStates);
				}
			}
			CraftingJSON._queueAdvance(fieldsets[index], elemSource, checkedStates);

			// Restore the previous checked states
			for (const [{ inputNew, inputOld }, checked] of checkedStates.entries()) {
				inputNew.checked = checked;
				inputOld.checked = !checked;
			}

			// Also re-sort the crafting item array
			const craft = CraftingJSON._craftListCache[indexSource];
			CraftingJSON._craftListCache.splice(indexSource, 1);
			CraftingJSON._craftListCache.splice(indexTarget, 0, craft);

			// Re-enumerate the legend labels
			for (const [i, el] of this.querySelectorAll(".radiogroup-label").entries()) {
				el.textContent = (i + 1).toString();
			}
			this.removeAttribute("aria-busy");
		},

		/** @type {(this: HTMLElement, ev: DragEvent) => void} */
		dragend: function(ev) {
			this.querySelectorAll(".border-top, .border-bottom").forEach(e => {
				e.classList.toggle("border-top", false);
				e.classList.toggle("border-bottom", false);
			});
		},

		clickCancel: function() {
			CraftingUnload();
			CraftingModeSet("Slot");
		},

		clickAccept: function(ev) {
			const craftList = CraftingJSON._craftListCache;
			if (craftList == null) {
				ev.stopImmediatePropagation();
				return;
			}

			/** @type {undefined | NodeListOf<HTMLInputElement>} */
			const inputs = this.closest("dialog")?.querySelectorAll("input[type='radio']:checked");
			inputs?.forEach(el => {
				const index = Number.parseInt(el.name, 10);
				if (!Number.isNaN(index) && el.value === "new" && el.validity.valid) {
					Player.Crafting[index] = craftList[index].craft;
				}
			});
			CraftingSaveServer();
			CraftingUnload();
			CraftingModeSet("Slot");
		},

		/** @type {(this: HTMLInputElement) => Promise<void>} */
		changeFile: async function() {
			const dialog = this.closest("dialog");
			const fieldset = this.closest("fieldset");
			const tooltipContainer = dialog?.querySelector(".tooltip-container");
			const file = this.files?.[0];

			// Put an arbitrary cap of 1 GiB on the file size as a safeguard against opening (potentially malicious) files that are waaaay too large
			if (!tooltipContainer || !fieldset || !dialog || !file || file.size >= (1024**3)) {
				this.blur();
				return;
			}

			dialog.setAttribute("aria-busy", "true");

			/** @type {null | HTMLInputElement} */
			const searchInput = fieldset.querySelector("input[type='search']");
			if (searchInput) {
				searchInput.value = searchInput.defaultValue;
				searchInput.list?.replaceChildren();
			}

			const crafts = CraftingJSON.decode(await file.text());
			if (crafts.status === CraftingStatusType.CRITICAL_ERROR) {
				const errMsg = "failed to parse file";
				this.setCustomValidity(errMsg);
				dialog.querySelector("[role='menuitem'][name='accept']")?.setAttribute("aria-disabled", "true");
				fieldset.querySelector("legend [role='status']")?.replaceChildren(`(${errMsg})`);
				fieldset.querySelectorAll("button, input[type='search']").forEach(e => e.toggleAttribute("disabled", true));
				fieldset.querySelector(".radio-supergroup")?.replaceChildren();
				tooltipContainer.replaceChildren();
				CraftingJSON._craftListCache = null;
				dialog.removeAttribute("aria-busy");
				this.blur();
				return;
			}

			const craftList = crafts.data.crafts.map((craft, i) => {
				const status = crafts.errors.has(i) ? CraftingStatusType.CRITICAL_ERROR : CraftingStatusType.OK;
				return {
					name: craft?.Name ?? "Empty",
					status,
					craft: status === CraftingStatusType.CRITICAL_ERROR ? null : craft,
				};
			}).slice(0, 200);

			const statusMsg = crafts.status === CraftingStatusType.ERROR ? `(failed to parse ${crafts.errors.size.toString().padStart(2, " ")} craft(s))` : "";
			dialog.querySelector("[role='menuitem'][name='accept']")?.setAttribute("aria-disabled", "false");
			fieldset.querySelector("legend [role='status']")?.replaceChildren(statusMsg);
			fieldset.querySelectorAll("button, input[type='search']").forEach(e => e.toggleAttribute("disabled", false));
			fieldset.querySelector(".radio-supergroup")?.replaceChildren(...CraftingJSON.createRadioGroups(craftList, tooltipContainer));
			fieldset.querySelector(".radio-supergroup")?.scrollTo({ top: 0, behavior: "instant" });
			CraftingJSON._craftListCache = craftList;
			dialog.removeAttribute("aria-busy");
			this.blur();
		},

		/** @type {(this: HTMLInputElement) => void} */
		inputFile: function() {
			this.setCustomValidity("");
		},

		clickSelectNew: function() {
			/** @type {undefined | NodeListOf<HTMLInputElement>} */
			const inputs = this.closest("fieldset")?.querySelectorAll("input[type='radio'][value='new']:enabled");
			inputs?.forEach(el => el.checked = true);
		},

		clickSelectOld: function() {
			/** @type {undefined | NodeListOf<HTMLInputElement>} */
			const inputs = this.closest("fieldset")?.querySelectorAll("input[type='radio'][value='old']:enabled");
			inputs?.forEach(el => el.checked = true);
		},

		clickError: function() {
			this.focus();
		},

		/** @type {(this: HTMLInputElement) => void} */
		inputSearch: function() {
			const superGroup = this.closest("fieldset")?.querySelector(".radio-supergroup");
			if (!superGroup?.children.length) {
				return;
			}

			const matches = ElementSearchQuery.highlight(superGroup.querySelectorAll(".craft-label"), this.value, { classList: ["label-highlight"] });
			matches[0]?.closest("[role='radiogroup']")?.scrollIntoView({ behavior: "instant" });
		},

		/** @type {(this: HTMLInputElement) => void} */
		focusSearch: function() {
			const superGroup = this.closest("fieldset")?.querySelector(".radio-supergroup");
			if (!superGroup?.children.length || !this.list || this.list.children.length !== 0) {
				return;
			}

			const names = new Set(Array.from(superGroup.querySelectorAll(".craft-label")).map(el => el.textContent.trim()));
			this.list.append(...Array.from(names).sort().map(value => ElementCreate({ tag: "option", attributes: { value } })));
		},
	},

	/**
	 * Encode the passed list of crafting items into a JSON-valid object
	 * @param {readonly (null | CraftingItem)[]} crafts - The list of crafting items
	 * @returns {CraftingJSON.DataEncoded} The encoded object of JSON-valid crafts
	 */
	encode: function encode(crafts) {
		/** @type {(null | string)[]} */
		const data = [];

		let i = 0;
		const max = Math.max(200, crafts.length);
		while (i < max) {
			const craft = crafts[i++] ?? null;
			data.push(craft == null ? null : LZString.compressToBase64(JSON.stringify(craft)));
		}
		return {
			version: 1,
			date: new Date().toLocaleString(),
			crafts: data,
		};
	},

	/**
	 * Decode the passed stringified object of crafting JSON data
	 * @param {string} craftsJSON - The stringified and to-be decoded crafted JSON data
	 * @returns {CraftingJSON.ParsingOutput} - The decoded crafted JSON data
	 */
	decode: function decode(craftsJSON) {
		let obj;
		try {
			obj = /** @type {CraftingJSON.DataEncoded} */ (JSON.parse(craftsJSON));
		} catch (err) {
			console.error(err);
			return { status: CraftingStatusType.CRITICAL_ERROR };
		}
		if (!CommonIsObject(obj)) {
			return { status: CraftingStatusType.CRITICAL_ERROR };
		}
		/** @type {{ [k in keyof CraftingJSON.DataEncoded]?: unknown }} */
		const obj2 = obj;

		switch (obj2.version) {
			case 1: {
				if (!Array.isArray(obj2.crafts)) {
					return { status: CraftingStatusType.CRITICAL_ERROR };
				}

				/** @type {Set<number>} */
				const errors = new Set;
				/** @type {(null | CraftingItem)[]} */
				const crafts = [];
				for (const [i, craftString] of obj2.crafts.entries()) {
					let craft = null;
					if (typeof craftString === "string") {
						try {
							craft = /** @type {null | CraftingItem} */ (JSON.parse(LZString.decompressFromBase64(craftString) || "null"));
						} catch {
							errors.add(i);
						}
					}
					if (craft != null && CraftingValidate(craft) === CraftingStatusType.CRITICAL_ERROR) {
						errors.add(i);
						crafts.push(null);
					} else {
						crafts.push(craft);
					}
				}
				return {
					errors,
					status: errors.size === 0 ? CraftingStatusType.OK : CraftingStatusType.ERROR,
					data: { version: obj2.version, crafts },
				};
			}
			default:
				return { status: CraftingStatusType.CRITICAL_ERROR };
		}
	},

	/**
	 * Return a single `<label>`-embedded `<input type="radio">` element
	 * @param {null | CraftingItem} craft
	 * @param {string} tooltipID
	 * @param {{ name: string, checked: boolean, disabled: boolean, value: string }} options
	 * @returns {HTMLElement}
	 */
	createRadio: function createRadio(craft, tooltipID, options) {
		const asset = craft?.Item ? CraftingAssets[craft.Item]?.[0] : null;
		return ElementCreate({
			tag: "label",
			attributes: {
				"aria-owns": asset != null ? tooltipID : null,
			},
			children: [
				ElementCheckbox.Create(
					null, null, { type: "radio", ...options },
					{ checkbox: { attributes: { "aria-describedby": asset != null ? tooltipID : null } } },
				),
				{
					tag: "img",
					attributes: {
						alt: asset?.Description,
						decoding: "async",
						loading: "lazy",
						src: asset == null || CharacterAppearanceItemIsHidden(asset.Name, asset.DynamicGroupName) ? "./Icons/HiddenItem.png" : `./${AssetGetPreviewPath(asset)}/${asset.Name}.png`,
						"aria-hidden": asset == null ? "true" : undefined,
					},
				},
				craft?.Name ? { tag: "span", classList: ["craft-label"], children: [craft.Name] } : { tag: "i", children: ["Empty"] },
			],
			eventListeners: {
				focusin: CraftingJSON.eventListeners.focusTooltip,
				focusout: CraftingJSON.eventListeners.blurTooltip,
				mouseenter: CraftingJSON.eventListeners.hoverinTooltip,
				mouseleave: CraftingJSON.eventListeners.hoveroutTooltip,
			},
		});
	},

	/**
	 * Return a list of `<input type="radio">`-containing `<fieldset>` elements
	 * @param {readonly { name: string, status: CraftingStatusType, craft: null | CraftingItem }[]} items
	 * @param {Node} tooltipContainer
	 */
	createRadioGroups: function createRadioGroups(items, tooltipContainer) {
		const dragListeners = CraftingJSON.getDragListeners();
		const crafts = Player.Crafting.length < 200 ? Array(200).fill(null).map((_, i) => Player.Crafting[i] ?? null) : Player.Crafting;
		return crafts.map((oldCraft, i) => {
			const newCraft = items[i] ?? { name: "<empty>", craft: null, status: CraftingStatusType.OK };
			const newChecked = newCraft.craft != null && newCraft.status !== CraftingStatusType.CRITICAL_ERROR;

			/** @type {null | HTMLElement} */
			let statusElement = null;
			if (newCraft.status === CraftingStatusType.CRITICAL_ERROR) {
				statusElement = ElementButton.Create(
					null,
					CraftingJSON.eventListeners.clickError,
					{ label: "❗", tooltipRole: "none", tooltip: TextGet("JSONError"), noStyling: true },
					{
						label: { attributes: { "aria-hidden": "true" } },
						button: { attributes: { "aria-label": TextGet("JSONToggle") } },
					},
				);
			} else {
				statusElement = ElementCreate({ tag: "div", attributes: { "aria-hidden": "true" } });
			}

			const oldTooltipID = ElementGenerateID();
			const newTooltipID = ElementGenerateID();
			const labelID = ElementGenerateID();

			/** @type {HTMLOptions<"fieldset">} */
			const ret = {
				tag: "fieldset",
				attributes: { role: "radiogroup", "aria-labelledby": labelID },
				eventListeners: CommonPick(dragListeners, ["dragleave", "dragenter"]),
				children: [
					{
						tag: "div",
						attributes: {
							id: ElementGenerateID(),
							draggable: "true",
						},
						eventListeners: {
							dragstart: dragListeners.dragstart,
						},
						children: [
							{ tag: "span", children: [(i + 1).toString()], attributes: { id: labelID }, classList: ["radiogroup-label"] },
							CraftingJSON.createRadio(newCraft.craft, newTooltipID, { checked: newChecked, disabled: !newChecked, name: i.toString(), value: "new" }),
							statusElement,
						],
					},
					CraftingJSON.createRadio(oldCraft, oldTooltipID, { checked: !newChecked, disabled: false, name: i.toString(), value: "old" }),
				],
			};

			for (const [id, craft] of Object.entries({ [oldTooltipID]: oldCraft, [newTooltipID]: newCraft.craft })) {
				if (craft != null) {
					tooltipContainer.appendChild(ElementCreate({
						tag: "div",
						attributes: { id, role: "tooltip" },
						classList: ["button-tooltip", "button-tooltip-justify"],
						children: [ElementButton.CreateCraftTooltipContent(craft)[1]],
					}));
				}
			}
			return ElementCreate(ret);
		});
	},

	/**
	 * Create and return the `<dialog>` and its shadowroot-containing `<div>` parent
	 * @param {null | Node} parent The parent node, if any
	 */
	createDialog: function createDialog(parent=null) {
		const textInputID = ElementGenerateID();
		const searchDatalistID = ElementGenerateID();
		const supergroupID = ElementGenerateID();
		const descriptionID = ElementGenerateID();
		const dialog = ElementCreate({
			tag: "dialog",
			attributes: { closedby: "none" },
			children: [
				{
					tag: "aside",
					classList: ["aside"],
					children: [
						ElementMenu.Create(
							null,
							[
								ElementButton.Create(
									null,
									CraftingJSON.eventListeners.clickCancel,
									{ image: "./Icons/Cancel.png", tooltip: TextGet("JSONCancel"), tooltipPosition: "left", name: "cancel" },
								),
								ElementButton.Create(
									null,
									CraftingJSON.eventListeners.clickAccept,
									{ image: "./Icons/Accept.png", disabled: true, tooltip: TextGet("JSONUpload"), tooltipPosition: "left", name: "accept" },
								),
							],
							{ direction: "rtl" },
						),
						{
							tag: "section",
							attributes: { id: descriptionID },
							classList: ["description"],
							children: [
								{
									tag: "p",
									children: TextSubstitute(
										"JSONDescription0",
										{ "{all}": ElementCreate({ tag: "em", children: [TextGet("JSONDescriptionAll")] }) }
									),
								},
								{
									tag: "ol",
									children: [
										{
											tag: "li",
											children: TextSubstitute("JSONDescription1", {
												"{json}": ElementCreate({ tag: "code", children: [".json"] }),
												"{download-tooltip}": ElementCreate({ tag: "q", children: [TextGet("JSONDownload")] }),
											}),
										},
										{ tag: "li", children: [TextGet("JSONDescription2")] },
										{ tag: "li", children: [TextGet("JSONDescription3")] },
									],
								},
							],
						},
					],
				},
				{
					tag: "fieldset",
					attributes: { name: "import" },
					children: [
						{
							tag: "legend",
							children: [{
								tag: "label",
								children: [
									"Import crafts",
									" ",
									{ tag: "span", attributes: { role: "status" } },
								],
								attributes: { for: textInputID },
							}],
						},
						{
							tag: "input",
							attributes: { type: "file", accept: "application/json", id: textInputID, autofocus: true, "aria-describedby": descriptionID },
							classList: ["button-styling", "button", "blank-button"],
							eventListeners: {
								input: CraftingJSON.eventListeners.inputFile,
								change: CraftingJSON.eventListeners.changeFile,
							},
						},
						{
							tag: "input",
							attributes: {
								type: "search",
								placeholder: "Filter crafts",
								size: 0,
								maxlength: 30,
								spellcheck: "false",
								list: searchDatalistID,
								disabled: true,
								"aria-controls": supergroupID,
							},
							eventListeners: {
								focus: CraftingJSON.eventListeners.focusSearch,
								input: CraftingJSON.eventListeners.inputSearch,
							},
						},
						{
							tag: "datalist",
							attributes: { id: searchDatalistID },
						},
						{
							tag: "output",
							attributes: { for: textInputID },
							children: [
								ElementButton.Create(
									null,
									CraftingJSON.eventListeners.clickSelectNew,
									{ label: TextGet("JSONSelectNew"), name: "select-new", disabled: true },
								),
								ElementButton.Create(
									null,
									CraftingJSON.eventListeners.clickSelectOld,
									{ label: TextGet("JSONSelectOld"), name: "select-old", disabled: true },
								),
								{
									tag: "div",
									classList: ["radio-supergroup", "scroll-box"],
									attributes: { id: supergroupID },
									eventListeners: {
										dragover: CraftingJSON.eventListeners.dragover,
										dragend: CraftingJSON.eventListeners.dragend,
										drop: CraftingJSON.eventListeners.drop,
									},
								},
								{
									tag: "div",
									classList: ["tooltip-container"],
								},
							],
						},
					],
				},
			],
		});

		const root = ElementCreate({
			tag: "div",
			attributes: { id: "crafting-import-dialog" },
			parent,
		});

		const shadow = root.attachShadow({ mode: "open", delegatesFocus: true });
		shadow.append(
			ElementCreate({ tag: "link", attributes: { href: "CSS/normalize.css", rel: "stylesheet" } }),
			ElementCreate({ tag: "link", attributes: { href: "CSS/button.css", rel: "stylesheet" } }),
			ElementCreate({ tag: "link", attributes: { href: "CSS/Styles.css", rel: "stylesheet" } }),
			ElementCreate({ tag: "link", attributes: { href: "CSS/crafting-json.css", rel: "stylesheet" } }),
			dialog,
		);
		return { root, dialog };
	}
};
