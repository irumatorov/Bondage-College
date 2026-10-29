
"use strict";

/**
 * Generate and return a unique {@link HTMLElement.id}.
 *
 * IDs consist of base36-encoded integers whose value is incremented each time this function is called.
 */
var ElementGenerateID = (() => {
	// Prefix the ID with a letter, as number-prefixes are invalid within css selectors unless escaped via the likes of `CSS.escape()`
	let id = 0;
	return function() { return "a" + (id++).toString(36); };
})();

/**
 * Handles the value of a HTML element. It sets the value of the element when the Value parameter is provided or it returns the value when the parameter is omitted
 * @param {ElementHelp.ElementOrId} elementOrId - The id of the element for which we want to get/set the value.
 * @param {string} [Value] - The value to give to the element (if applicable)
 * @returns {string} - The value of the element (When no value parameter was passed to the function)
 */
function ElementValue(elementOrId, Value) {
	const e = /** @type {HTMLInputElement | HTMLSelectElement} */(ElementWrap(elementOrId));
	const id = typeof elementOrId === "string" ? elementOrId : elementOrId.id;
	if (!e) {
		console.error("ElementValue called on a missing element: " + id.toString());
		return "";
	}

	if (Value == null)
		return e.value.trim();

	if (e instanceof HTMLSelectElement) {
		const opts = Array.from(e.options).find(o => o.value === Value);
		if (opts) {
			e.value = opts.value;
			e.dispatchEvent(new Event("change"));
			return "";
		}
	}

	e.value = Value;
	e.dispatchEvent(new InputEvent("input"));
	return "";
}

/**
 * Handles the content of a HTML element. It sets the content of the element when the Content parameter is provided or it returns the value when the parameter is omitted
 * @param {ElementHelp.ElementOrId} elementOrId - The id of the element for which we want to get/set the value.
 * @param {string} [Content] - The content/inner HTML to give to the element (if applicable)
 * @returns {string} - The content of the element (When no Content parameter was passed to the function)
 * @deprecated Use {@link ElementClearContents} or {@link ElementCreate} instead.
 */
function ElementContent(elementOrId, Content) {
	const e = ElementWrap(elementOrId);
	const id = typeof elementOrId === "string" ? elementOrId : elementOrId.id;
	if (!e) {
		console.error("ElementContent called on a missing element: " + id.toString());
		return "";
	}

	if (Content == null)
		return e.innerHTML;

	// eslint-disable-next-line nounsanitized/property
	e.innerHTML = Content;
	return "";
}

/**
 * Clears the contents of an HTML element
 * @param {ElementHelp.ElementOrId} elementOrId - The id of the element for which we want to clear the contents.
 */
function ElementClearContents(elementOrId) {
	const e = ElementWrap(elementOrId);
	const id = typeof elementOrId === "string" ? elementOrId : elementOrId.id;
	if (!e) {
		console.error("ElementClearContents called on a missing element: " + id.toString());
		return;
	}
	if (!e) return;
	e.replaceChildren();
}

/** @satisfies {ElementNoParent} */
const ElementNoParent = 0;

/**
 * @template {keyof HTMLElementScalarTagNameMap} T
 * @overload
 * @param {HTMLOptions<T>} options
 * @returns {HTMLElementTagNameMap[T]}
 */
/**
 * @overload
 * @param {HTMLOptionsUnion} options
 * @returns {HTMLElement}
 */
/**
 * @template {keyof HTMLElementScalarTagNameMap} T
 * @param {HTMLOptions<T>} options - Options for customizing the element
 * @returns {HTMLElementTagNameMap[T]} - The created element
 */
function ElementCreate(options) {
	const elem = document.createElement(options.tag);

	for (const [k, v] of Object.entries(options.attributes ?? {})) {
		if (v == null || v === false) {
			continue;
		} else if (v === true) {
			elem.toggleAttribute(k, true);
		} else {
			elem.setAttribute(k, v);
		}
	}
	for (const [eventName, listener] of Object.entries(options.eventListeners ?? {})) {
		if (listener != null) {
			elem.addEventListener(eventName, /** @type {EventListener} */(listener));
		}
	}
	for (const [k, v] of Object.entries(options.style ?? {})) {
		if (v != null) {
			elem.style.setProperty(k, /** @type {any} */(v));
		}
	}
	for (const [k, v] of Object.entries(options.dataAttributes ?? {})) {
		if (v == null || v === false) {
			continue;
		} else if (v === true) {
			elem.dataset[k] = "";
		} else {
			elem.dataset[k] = v.toString();
		}
	}
	for (const cls of options.classList ?? []) {
		if (cls != null) {
			elem.classList.add(cls);
		}
	}

	// eslint-disable-next-line nounsanitized/property
	if (options.innerHTML) { elem.innerHTML = options.innerHTML; }

	elem.append(...ElementParseChildren(options.children ?? []));
	if (options.parent) { options.parent.appendChild(elem); }
	return elem;
}


/**
 * Convert the list of passed HTML option children into a list of nodes and/or string
 * @param {HTMLOptions<any>["children"]} children
 * @returns {(string | Node)[]}
 */
function ElementParseChildren(children) {
	/** @type {(string | Node)[]} */
	const ret = [];
	/** @type {(i: unknown) => i is Node | string} */
	const isNode = (i) => typeof i === "string" || (CommonIsObject(i) && "nodeValue" in i);
	for (const childElem of children ?? []) {
		if (childElem != null) {
			if (isNode(childElem)) {
				ret.push(childElem);
			} else {
				ret.push(ElementCreate({ ...childElem }));
			}
		}
	}
	return ret;
}

/**
 * Create a reusable animated loader element.
 * @param {"dots" | "circle"} [variant] - Visual style of loader
 * @param {Omit<HTMLOptions<"span">, "tag">} [options] - Additional element options
 * @returns {HTMLSpanElement}
 */
function ElementCreateLoader(variant = "dots", options = {}) {
	/** @type {readonly (HTMLOptionsUnion)[]} */
	const loaderChildren = variant === "dots"
		? [{ tag: "span" }, { tag: "span" }, { tag: "span" }]
		: [];
	return ElementCreate({
		...options,
		tag: "span",
		attributes: {
			"aria-hidden": "true",
			...(options.attributes ?? {}),
		},
		classList: ["element-loader", `element-loader-${variant}`, ...(options.classList ?? [])],
		children: [...loaderChildren, ...(options.children ?? [])],
	});
}

/**
 * Creates a new from element in the main document.
 *
 * @param {string | null} ID - The id of the form to create
 * @returns {HTMLFormElement}
 */
function ElementCreateForm(ID) {
	ID ??= ElementGenerateID();
	return /** @type {HTMLFormElement} */ (document.getElementById(ID)) ?? ElementCreate({
		tag: "form",
		attributes: {
			id: ID,
			name: ID,
			method: "dialog",
			["screen-generated"]: CurrentScreen,
		},
		parent: document.body,
	});
}

/**
 * Creates a new text area element in the main document. Does not create a new element if there is already an existing one with the same ID
 * @param {string | null} ID - The id of the text area to create.
 * @param {HTMLElement} [form] - The form the element belongs to
 * @returns {HTMLTextAreaElement}
 */
function ElementCreateTextArea(ID, form) {
	ID ??= ElementGenerateID();
	return /** @type {HTMLTextAreaElement} */ (document.getElementById(ID)) ?? ElementCreate({
		tag: "textarea",
		attributes: {
			id: ID,
			name: ID,
			["screen-generated"]: CurrentScreen,
		},
		parent: form ?? document.body,
		classList: ["HideOnPopup"],
	});
}

/**
 * Blur event listener for `number`-based `<input>` elements that automatically sanitizes the input value the moment the element is deselected.
 * @type {(this: HTMLInputElement, event: FocusEvent) => void}
 */
function ElementNumberInputBlur(event) {
	let value = "";
	if (Number.isNaN(this.valueAsNumber)) {
		value = this.defaultValue;
	} else {
		const min = this.min ? Number(this.min) : -Infinity;
		const max = this.max ? Number(this.max) : Infinity;
		const requiresInt = this.inputMode === "numeric";
		value = CommonClamp(
			requiresInt ? Math.round(this.valueAsNumber) : this.valueAsNumber,
			Number.isNaN(min) ? -Infinity : min,
			Number.isNaN(max) ? Infinity : max,
		).toString();
	}

	if (value !== this.value) {
		this.value = value;
		this.dispatchEvent(new Event("input"));
		this.dispatchEvent(new Event("change"));
	}
}

/**
 * Wheel event listener for `number`-based `<input>` elements. Allows one to increment/decrement the value
 * @type {(this: HTMLInputElement, event: WheelEvent) => void}
 */
function ElementNumberInputWheel(event) {
	if (this.disabled || this.readOnly) {
		event.stopImmediatePropagation();
		return;
	}

	let min = this.min ? Number(this.min) : -Infinity;
	let max = this.max ? Number(this.max) : Infinity;
	let step = this.step ? Number(this.step) : 1;
	if (Number.isNaN(min)) { min = -Infinity; }
	if (Number.isNaN(max)) { max = Infinity; }
	if (Number.isNaN(step)) { step = 1; }

	let value = this.valueAsNumber;
	if (event.deltaY < 0) {
		value = CommonClamp(value + step, min, max);
	} else if (event.deltaY > 0) {
		value = CommonClamp(value - step, min, max);
	}

	if (value !== this.valueAsNumber) {
		this.valueAsNumber = value;
		this.dispatchEvent(new Event("input"));
		const root = ElementGetRoot(this);
		if (root.activeElement !== this) {
			this.dispatchEvent(new Event("change"));
		}
	}

	event.preventDefault();
	event.stopPropagation();
}

/**
 * Creates a new text input element in the main document.Does not create a new element if there is already an existing one with the same ID
 * @param {string | null} ID - The id of the input tag to create.
 * @param {string} Type - Type of the input tag to create.
 * @param {null | string} [Value] - Value of the input tag to create.
 * @param {null | number | string} [MaxLength] - Maximum input tag of the input to create.
 * @param {null | Node} [form] - The form the element belongs to
 * @returns {HTMLInputElement} - The created HTML input element
 */
function ElementCreateInput(ID, Type, Value = "", MaxLength = undefined, form = undefined) {
	ID ??= ElementGenerateID();
	let e = /** @type {HTMLInputElement} */ (document.getElementById(ID));
	if (e) {
		return e;
	}
	if (typeof MaxLength === "string") {
		MaxLength = CommonParseInt(MaxLength, 10) ?? undefined;
	}
	const maxLength = CommonIsInteger(MaxLength, 0) ? MaxLength : undefined;
	e = ElementCreate({
		tag: "input",
		attributes: {
			id: ID,
			name: ID,
			type: Type,
			value: Value,
			maxLength,
			["screen-generated"]: CurrentScreen,
		},
		parent: form ?? document.body,
		classList: ["HideOnPopup"],
		eventListeners: {
			focus() { this.removeAttribute("readonly"); },
		},
	});

	switch (Type) {
		case "number":
			e.inputMode = "numeric";
			e.addEventListener("blur", ElementNumberInputBlur);
			e.addEventListener("wheel", ElementNumberInputWheel);
			break;
	}

	return e;
}

/**
 * Creates a new range input element in the main document. Does not create a new element if there is already an
 * existing one with the same id
 * @param {string | null} id - The id of the input tag to create
 * @param {number} value - The initial value of the input
 * @param {number} min - The minimum value of the input
 * @param {number} max - The maximum value of the input
 * @param {number} step - The increment size of the input
 * @param {ThumbIcon} [thumbIcon] - The icon to use for the range input's "thumb" (handle). If not set, the slider will
 * have a default appearance with no custom thumb.
 * @param {boolean} [vertical] - Whether this range input is a vertical slider (defaults to false)
 * @returns {HTMLInputElement} - The created HTML input element
 */
function ElementCreateRangeInput(id, value, min, max, step, thumbIcon, vertical) {
	id ??= ElementGenerateID();
	return /** @type {HTMLInputElement} */ (document.getElementById(id)) ?? ElementCreate({
		tag: "input",
		attributes: {
			id,
			name: id,
			type: "range",
			min: min.toString(),
			max: max.toString(),
			step: step.toString(),
			value: value.toString(),
			["screen-generated"]: CurrentScreen,
		},
		dataAttributes: thumbIcon ? { thumb: thumbIcon.toLowerCase() } : {},
		parent: document.body,
		classList: [
			"HideOnPopup",
			"range-input",
			vertical ? "Vertical" : null,
		],
		eventListeners: {
			focus() { this.removeAttribute("readonly"); },
		},
	});
}

/**
 * Construct a `<select>`-based dropdown menu.
 * @deprecated - Use {@link ElementDropdown.Create} instead
 * @param {string | null} id - The name of the select item.
 * @param {readonly (string | Omit<HTMLOptions<"option">, "tag"> | HTMLOptions<"hr">)[]} optionsList - The list of options for the current select statement. Can be supplied as a simple string or a more extensive `<option>` config.
 * @param {(this: HTMLSelectElement, event: Event) => any} onChange - An event listener to be called, when the value of the drop down box changes
 * @param {null | { required?: boolean, multiple?: boolean, disabled?: boolean, size?: number, name?: string }} [options] - Additional `<select>`-specific properties
 * @param {null | Partial<Record<"select", Omit<HTMLOptions<"select">, "tag">>>} htmlOptions - Additional {@link ElementCreate} options to-be applied to the respective (child) element
 * @returns {HTMLSelectElement} - The created element
 */
function ElementCreateDropdown(id, optionsList, onChange, options=null, htmlOptions=null) {
	return ElementDropdown.Create(id, optionsList, onChange, options, htmlOptions);
}

/**
 * Namespace for creating `<select>`-based dropdown menus.
 * @namespace
 */
var ElementDropdown = {
	/**
	 * Construct a `<select>`-based dropdown menu.
	 * @param {string | null} id - The name of the select item.
	 * @param {readonly (string | Omit<HTMLOptions<"option">, "tag"> | HTMLOptions<"hr">)[]} optionsList - The list of options for the current select statement. Can be supplied as a simple string or a more extensive `<option>` config.
	 * @param {(this: HTMLSelectElement, event: Event) => any} onChange - An event listener to be called, when the value of the drop down box changes
	 * @param {null | { required?: boolean, multiple?: boolean, disabled?: boolean, size?: number, name?: string }} [options] - Additional `<select>`-specific properties
	 * @param {null | Partial<Record<"select", Omit<HTMLOptions<"select">, "tag">>>} htmlOptions - Additional {@link ElementCreate} options to-be applied to the respective (child) element
	 * @returns {HTMLSelectElement} - The created element
	 */
	Create(id, optionsList, onChange, options=null, htmlOptions=null) {
		id ??= ElementGenerateID();
		let select = /** @type {null | HTMLSelectElement} */(document.getElementById(id));
		if (select != null) {
			console.error(`Element "${id}" already exists`);
			return select;
		}

		options ??= {};
		const booleanAttributes = Object.fromEntries(/** @type {const} */([
			["required", options.required],
			["multiple", options.multiple],
			["disabled", options.disabled],
			["size", options.size],
			["name", options.name],
		]).filter(i => i[1] != null));

		const selectOptions = htmlOptions?.select ?? {};
		select = ElementCreate({
			...htmlOptions,
			tag: "select",
			classList: [
				...(selectOptions.classList ?? []),
				"HideOnPopup",
				"custom-select",
			],
			attributes: {
				...(selectOptions.attributes ?? {}),
				id,
				["screen-generated"]: CurrentScreen,
				...booleanAttributes,
			},
			parent: selectOptions.parent ?? document.body,
			eventListeners: {
				...(selectOptions.eventListeners ?? {}),
				change(ev) {
					if (!this.matches(":focus-visible")) {
						this.blur();
					}
					if (!this.validity.valid) {
						ev.stopImmediatePropagation();
						return;
					}
				},
			},
			children: [
				...(selectOptions.children ?? []),
				...optionsList.map(content => {
					if (typeof content === "string") {
						return { tag: /** @type {const} */("option"), children: [content] };
					} else if ("tag" in content && content.tag === "hr") {
						return /** @type {HTMLOptions<"hr">} */(content);
					} else {
						return { tag: /** @type {const} */("option"), ...content };
					}
				}),
			],
		});
		select.addEventListener("change", onChange);
		return select;
	},

	/**
	 * Construct a `<select>`-based dropdown menu.
	 * @param {string | null} id - The name of the select item.
	 * @param {readonly (string | Omit<HTMLOptions<"option">, "tag"> | HTMLOptions<"hr">)[]} optionsList - The list of options for the current select statement. Can be supplied as a simple string or a more extensive `<option>` config.
	 * @param {string} label - The label of the dropdown menu.
	 * @param {(this: HTMLSelectElement, event: Event) => any} onChange - An event listener to be called, when the value of the drop down box changes
	 * @param {null | { required?: boolean, multiple?: boolean, disabled?: boolean, size?: number, name?: string }} [options] - Additional `<select>`-specific properties
	 * @param {null | Partial<Record<"select" | "label" | "container", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional {@link ElementCreate} options to-be applied to the respective (child) element
	 * @returns {HTMLLabelElement} - The created element
	 */
	CreateLabelled(id, optionsList, label, onChange, options=null, htmlOptions=null) {
		id ??= ElementGenerateID();
		const checkbox = document.getElementById(id);
		if (checkbox) {
			console.error(`Element "${id}" already exists`);
			return /** @type {HTMLLabelElement} */(checkbox);
		}

		options ??= {};
		const labelOptions = htmlOptions?.label ?? {};
		const containerOptions = htmlOptions?.container ?? {};

		return ElementCreate({
			...containerOptions,
			tag: "label",
			classList: ["dropdown-pair", ...(containerOptions.classList ?? [])],
			attributes: { id: `dropdown-pair-${id}`, for: id, ...(containerOptions.attributes ?? {}) },
			children: [
				{
					...labelOptions,
					tag: "span",
					attributes: {
						id: `${id}-label`,
						...labelOptions.attributes
					},
					classList: ["dropdown-label", ...(labelOptions.classList ?? [])],
					children: [label, ...(labelOptions.children ?? [])],
				},
				this.Create(id, optionsList, onChange, options, htmlOptions),
				...(containerOptions.children ?? []),
			],
		});
	},
};

/**
 * Construct a custom searchable dropdown menu or, on mobile, a conventional `<select>` element.
 *
 * The element comprises a button trigger displaying the current selection,
 * and a popup containing a search input and a scrollable list of options.
 * Options can optionally be grouped via the `group` field, which inserts a
 * interactive header before each group of options sharing the same value.
 *
 * @example
 * <div id="..." class="searchable-dropdown">
 *     <button class="searchable-dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
 *         <span class="searchable-dropdown-trigger-label">Selected label</span>
 *         <span class="searchable-dropdown-trigger-arrow">▾</span>
 *     </button>
 *     <div class="searchable-dropdown-popup" hidden>
 *         <input type="search" class="searchable-dropdown-search">
 *         <ul role="listbox" class="searchable-dropdown-list">
 *             <li role="option" data-value="..." aria-selected="true">label</li>
 *             ...
 *         </ul>
 *     </div>
 * </div>
 *
 * @param {string | null} id - The id of the root container; sub-element ids are derived from it.
 * @param {readonly ElementSearchableDropdown.OptionItem[]} optionsList - The available options.
 * @param {(value: string) => void} onChange - Called when the selection changes.
 * @param {ElementSearchableDropdown.CreateOptions | null} [options]
 * @returns {ElementSearchableDropdown.SearchableDropdownElement | HTMLSelectElement}
 */
function ElementCreateSearchableDropdown(id, optionsList, onChange, options) {
	id ??= ElementGenerateID();
	const existing = /** @type {ElementSearchableDropdown.SearchableDropdownElement | HTMLSelectElement | null} */ (ElementWrap(id));
	if (existing) {
		console.error(`Element "${id}" already exists`);
		return existing;
	}
	options = options ?? {};

	// Use a conventional `<select>` dropdown on mobile in order to benefit from their (generally) very mobile-specific layout
	if (CommonIsMobile) {
		/** @type {Record<string, HTMLOptionElement[]>} */
		const selectGroups = {};
		/** @type {HTMLOptionElement[]} */
		const selectOptions = [];
		for (const opt of optionsList) {
			const option = ElementCreate({
				tag: "option",
				attributes: { value: opt.value, disabled: opt.disabled, selected: options.value === opt.value },
				children: [opt.label],
			});
			if (opt.group != null) {
				(selectGroups[opt.group] ??= []).push(option);
			} else {
				selectOptions.push(option);
			}
		}
		return ElementDropdown.Create(
			id,
			[],
			function (ev) { onChange(this.value); },
			{ disabled: options.disabled },
			{
				select: {
					parent: options.parent,
					children: [
						...Object.entries(selectGroups).map(([ label, children ]) => {
							return ElementCreate({ tag: "optgroup", attributes: { label }, children });
						}),
						...selectOptions,
					],
				},
			},
		);
	}

	const triggerId = `${id}-trigger`;
	const labelId = `${id}-label`;
	const popupId = `${id}-popup`;
	const searchId = `${id}-search`;
	const listId = `${id}-list`;

	/** @type {readonly ElementSearchableDropdown.OptionItem[]} */
	let _options = [...optionsList];
	/** @type {string | null} */
	let _value = options.value ?? null;
	/** @type {HTMLLIElement[]} */
	let _renderedItems = [];
	let _highlightIndex = -1;

	const placeholder = options.placeholder ?? "";
	const searchPlaceholder = options.searchPlaceholder ?? "";
	const emptyText = options.emptyText ?? "";

	const trigger = ElementButton.Create(
		triggerId,
		function searchableDropdownTriggerClick(ev) {
			ev.preventDefault();
			_toggle();
		},
		{
			disabled: options.disabled,
		},
		{
			button: {
				classList: ["searchable-dropdown-trigger"],
				attributes: {
					"aria-haspopup": "listbox",
					"aria-expanded": "false",
					"aria-controls": popupId,
				},
				children: [
					{
						tag: "span",
						attributes: { id: labelId },
						classList: ["searchable-dropdown-trigger-label"],
						children: [placeholder],
					},
					{
						tag: "span",
						attributes: { "aria-hidden": "true" },
						classList: ["searchable-dropdown-trigger-arrow"],
						children: ["\u25BE"],
					},
				],
			},
		},
	);

	const search = ElementCreate({
		tag: "input",
		classList: ["searchable-dropdown-search"],
		attributes: {
			id: searchId,
			type: "search",
			placeholder: searchPlaceholder,
			spellcheck: "false",
			autocomplete: "off",
		},
		eventListeners: {
			input: () => _renderList(),
			keydown: (ev) => {
				switch (ev.key) {
					case "ArrowDown":
						ev.preventDefault();
						if (_renderedItems.length === 0) return;
						_setHighlight((_highlightIndex + 1) % _renderedItems.length);
						break;
					case "ArrowUp":
						ev.preventDefault();
						if (_renderedItems.length === 0) return;
						_setHighlight((_highlightIndex - 1 + _renderedItems.length) % _renderedItems.length);
						break;
					case "Enter":
						ev.preventDefault();
						if (_highlightIndex >= 0 && _renderedItems[_highlightIndex]) {
							_renderedItems[_highlightIndex].click();
						}
						break;
					case "Escape":
						ev.preventDefault();
						_close();
						trigger.focus();
						break;
				}
			}
		}
	});

	const list = ElementCreate({
		tag: "ul",
		attributes: { id: listId, role: "listbox", tabindex: "-1" },
		classList: ["searchable-dropdown-list", "scroll-box"],
	});

	const popup = ElementCreate({
		tag: "div",
		attributes: { id: popupId, hidden: true, role: "dialog" },
		classList: ["searchable-dropdown-popup"],
		children: [search, list],
	});

	const root = ElementCreate({
		tag: "div",
		attributes: { id, "screen-generated": CurrentScreen },
		classList: ["searchable-dropdown", "HideOnPopup"],
		parent: options.parent ?? document.body,
		children: [trigger, popup],
	});

	/** @type {HTMLSpanElement | null} */
	const labelSpan =  trigger.querySelector(`#${CSS.escape(labelId)}`);

	const _refreshLabel = () => {
		const current = _options.find(o => o.value === _value);
		if (!labelSpan) return;
		labelSpan.textContent = current ? current.label : placeholder;
		labelSpan.classList.toggle("searchable-dropdown-trigger-placeholder", !current);
	};

	/**
	 * @param {number} idx - The index of the item to highlight.
	 */
	const _setHighlight = (idx) => {
		if (_highlightIndex >= 0 && _renderedItems[_highlightIndex]) {
			_renderedItems[_highlightIndex].classList.remove("searchable-dropdown-item-active");
		}
		_highlightIndex = idx;
		if (idx >= 0 && _renderedItems[idx]) {
			_renderedItems[idx].classList.add("searchable-dropdown-item-active");
			_renderedItems[idx].scrollIntoView({ block: "end" });
		}
	};

	const _renderList = () => {
		const query = search.value.trim().toLowerCase();
		list.replaceChildren();
		_renderedItems = [];

		/** @type {string | undefined} */
		let lastGroup;
		for (const opt of _options) {
			const labelLower = opt.label.toLowerCase();
			const groupLower = (opt.group ?? "").toLowerCase();
			if (query && !labelLower.includes(query) && !groupLower.includes(query)) continue;

			const li = ElementCreate({
				tag: "li",
				attributes: {
					role: "option",
					"aria-selected": opt.value === _value ? "true" : "false",
					"aria-disabled": opt.disabled ? "true" : null,
					"data-value": opt.value,
				},
				classList: [
					"searchable-dropdown-item",
					opt.value === _value ? "searchable-dropdown-item-selected" : null,
					opt.disabled ? "searchable-dropdown-item-disabled" : null,
				],
				children: [opt.label],
				eventListeners: {
					mousedown: (ev) => ev.preventDefault(),
					click: () => {
						if (opt.disabled) return;
						if (_value !== opt.value) {
							_value = opt.value;
							_refreshLabel();
							onChange?.(opt.value);
						}
						_close();
					},
				},
			});

			if (opt.group && opt.group !== lastGroup) {
				list.appendChild(ElementCreate({
					tag: "li",
					attributes: { role: "presentation" },
					classList: ["searchable-dropdown-group-header"],
					children: [opt.group],
					eventListeners: {
						click: function() {
							const listRect = list.getBoundingClientRect();
							const rowRect = li.getBoundingClientRect();
							const delta = rowRect.top - listRect.top - rowRect.height;
							const scrollTop = Math.max(0, Math.min(list.scrollHeight - list.clientHeight, list.scrollTop + delta));
							list.scrollTo({ top: scrollTop, behavior: "smooth" });
						}
					}
				}));
				lastGroup = opt.group;
			}

			list.appendChild(li);
			_renderedItems.push(li);
		}

		if (_renderedItems.length === 0) {
			list.appendChild(ElementCreate({
				tag: "li",
				attributes: { role: "presentation" },
				classList: ["searchable-dropdown-empty"],
				children: [emptyText],
			}));
		}

		_highlightIndex = -1;
		if (_renderedItems.length > 0) {
			const sel = _renderedItems.findIndex(li => li.classList.contains("searchable-dropdown-item-selected"));
			_setHighlight(sel >= 0 ? sel : 0);
		}
	};

	/**
	 * @param {MouseEvent} ev
	 */
	const _onDocumentMouseDown = (ev) => {
		if (!root.contains(/** @type {Node} */ (ev.target))) {
			_close();
		}
	};

	const _open = () => {
		if (trigger.disabled) return;
		if (!popup.hasAttribute("hidden")) return;
		popup.toggleAttribute("hidden", false);
		trigger.setAttribute("aria-expanded", "true");
		search.value = "";
		_renderList();
		setTimeout(() => search.focus(), 0);
		document.addEventListener("mousedown", _onDocumentMouseDown, true);
	};

	const _close = () => {
		if (popup.hasAttribute("hidden")) return;
		popup.toggleAttribute("hidden", true);
		trigger.setAttribute("aria-expanded", "false");
		document.removeEventListener("mousedown", _onDocumentMouseDown, true);
	};

	const _toggle = () => {
		if (popup.hasAttribute("hidden")) _open();
		else _close();
	};

	if (_value == null && _options.length > 0) _value = _options[0].value;
	_refreshLabel();

	const api = /** @type {ElementSearchableDropdown.SearchableDropdownElement} */ (root);
	/** @type {ElementSearchableDropdown.SearchableDropdownInstance["bcSetOptions"]} */
	api.bcSetOptions = (newOptions, newValue) => {
		_options = [...newOptions];
		if (newValue !== undefined) _value = newValue;
		if (!_options.find(o => o.value === _value)) _value = _options[0]?.value ?? null;
		_refreshLabel();
		if (!popup.hasAttribute("hidden")) _renderList();
	};
	/** @type {ElementSearchableDropdown.SearchableDropdownInstance["bcSetNewValue"]} */
	api.bcSetNewValue = (newValue) => {
		_value = newValue;
		_refreshLabel();
		if (!popup.hasAttribute("hidden")) _renderList();
	};
	/** @type {ElementSearchableDropdown.SearchableDropdownInstance["bcSetDisabled"]} */
	api.bcSetDisabled = (disabled) => { trigger.disabled = !!disabled; };

	return api;
}

/**
 * Creates a new div element in the main document. Does not create a new element if there is already an existing one with the same ID
 * @param {string | null} ID - The id of the div tag to create.
 * @returns {HTMLDivElement} - The created (or pre-existing) div element
 */
function ElementCreateDiv(ID) {
	ID ??= ElementGenerateID();
	return /** @type {HTMLDivElement} */(document.getElementById(ID)) ?? ElementCreate({
		tag: "div",
		attributes: {
			id: ID,
			["screen-generated"]: CurrentScreen,
		},
		parent: document.body,
		classList: ["HideOnPopup"],
	});
}

/**
 * Removes an element from the main document
 * @param {ElementHelp.ElementOrId | null} elementOrId - The id of the tag to remove from the document.
 * @returns {void} - Nothing
 */
function ElementRemove(elementOrId) {
	ElementWrap(elementOrId)?.remove();
}

/**
 * Draws an existing HTML element at a specific position within the document. The element is "centered" on the given coordinates by dividing its height and width by two.
 * @param {ElementHelp.ElementOrId} ElementOrID - The id of the input tag to (re-)position.
 * @param {number} X - Center point of the element on the X axis.
 * @param {number} Y - Center point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} [H] - Height of the element.
 * @returns {void} - Nothing
 */
function ElementPosition(ElementOrID, X, Y, W, H) {
	const E = ElementWrap(ElementOrID);

	if (!E) {
		console.error("A call to ElementPosition was made on non-existent element with ID", ElementOrID);
		return;
	}

	// For a vertical slider, swap the width and the height (the transformation is handled by CSS)
	if (E.tagName.toLowerCase() === "input" && E.getAttribute("type") === "range" && E.classList.contains("Vertical")) {
		if (!H) {
			console.error("ElementPosition: missing H parameter for a vertical slider");
			return;
		}
		[W, H] = [H, W];
	}

	// compute font size and apply
	ElementSetFontSize(E);
	const font = parseFloat(E.style.fontSize);

	// compute dimensions
	const height = H != null ? ElementCanvasScaledHeight(H) : 4 + font * 1.15;
	const width = ElementCanvasScaledWidth(W);

	// compute top/left to center
	const posX = ElementCanvasScaledY(Y, 'top') - height / 2;
	const posY = ElementCanvasScaledX(X - W / 2, 'left');

	CommonAssign(E.style, {
		position: 'fixed',
		top: posX + 'px',
		left: posY + 'px',
		width: width + 'px',
		height: height + 'px'
	});
}

/**
 * Draws an existing HTML element at a specific position within the document. The element will not be centered on its given coordinates unlike the ElementPosition function.
 * Not same as ElementPositionFix. Calculates Font size itself.
 * @param {ElementHelp.ElementOrId | null} ElementOrID - The id of the input tag to (re-)position or the element itself.
 * @param {number} X - Starting point of the element on the X axis.
 * @param {number} Y - Starting point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} [H] - Height of the element.
 * @param {ElementHelp.AnchorXY} [anchorPosition]
 * @returns {void} - Nothing
 */
function ElementPositionFixed(ElementOrID, X, Y, W, H, anchorPosition = 'top-left') {
	const E = ElementWrap(ElementOrID);

	// Verify the element exists
	if (!E) {
		const id = typeof ElementOrID === "string" ? ElementOrID : ElementOrID?.id;
		console.error(`A call to ElementPositionFix was made on non-existent element with ID "${id}"`);
		return;
	}

	ElementSetFontSize(E);
	ElementSetPosition(E, X, Y, anchorPosition);
	ElementSetSize(E, W, H ?? null);
}

/**
 * Draws an existing HTML element at a specific position within the document. The element will not be centered on its given coordinates unlike the ElementPosition function.
 * @param {ElementHelp.ElementOrId} ElementOrID - The id of the input tag to (re-)position.
 * @param {number} Font - The size of the font to use.
 * @param {number} X - Starting point of the element on the X axis.
 * @param {number} Y - Starting point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} H - Height of the element.
 * @param {ElementHelp.AnchorXY} [anchorPosition]
 * @returns {void} - Nothing
 */
function ElementPositionFix(ElementOrID, Font, X, Y, W, H, anchorPosition = 'top-left') {
	const E = ElementWrap(ElementOrID);
	// Verify the element exists
	if (!E) {
		console.error("A call to ElementPositionFix was made on non-existent element with ID", ElementOrID);
		return;
	}

	ElementSetFontSize(E, Font);
	ElementSetPosition(E, X, Y, anchorPosition);
	ElementSetSize(E, W, H);
}

/**
 * Sets a custom data-attribute to a specified value on a specified element
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to create/set the data attribute of.
 * @param {string} Name - Name of the data attribute. ("data-" will be automatically appended to it.)
 * @param {string} Value - Value to give to the attribute.
 * @returns {void} - Nothing
 */
function ElementSetDataAttribute(ElementOrId, Name, Value) {
	const element = ElementWrap(ElementOrId);
	if (element != null) {
		element.setAttribute(("data-" + Name).toLowerCase(), Value.toString().toLowerCase());
	}
}

/**
 * Sets an attribute to a specified value on a specified element
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to create/set the data attribute of.
 * @param {string} Name - Name of the attribute.
 * @param {string} Value - Value to give to the attribute.
 * @returns {void} - Nothing
 */
function ElementSetAttribute(ElementOrId, Name, Value) {
	const element = ElementWrap(ElementOrId);
	if (element != null) {
		element.setAttribute(Name, Value);
	}
}

/**
 * Removes an attribute from a specified element.
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element from which to remove the attribute.
 * @param {string} Name - Name of the attribute to remove.
 * @returns {void} - Nothing
 */
function ElementRemoveAttribute(ElementOrId, Name) {
	const element = ElementWrap(ElementOrId);
	if (element != null) {
		element.removeAttribute(Name);
	}
}

/**
 * Scrolls to the end of a specified element
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to scroll down to the bottom of.
 * @param {ScrollOptions} [options] - The behavior of the scroll. Defaults to 'instant'.
 * @returns {void} - Nothing
 */
function ElementScrollToEnd(ElementOrId, options) {
	const element = ElementWrap(ElementOrId);
	if (element != null) {
		element.scrollTo({
			top: element.scrollHeight,
			behavior: options?.behavior ?? 'instant',
		});
	}
}

/**
 * Returns the given element's scroll position as a percentage, with the top of the element being close to 0 depending on scroll bar size, and the bottom being around 1.
 * To clarify, this is the position of the bottom edge of the scroll bar.
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to find the scroll percentage of.
 * @returns {(number|null)} - A float representing the scroll percentage.
 */
function ElementGetScrollPercentage(ElementOrId) {
	const element = ElementWrap(ElementOrId);
	if (element != null) {
		if (element.scrollTop === 0) return 0;
		return (element.scrollTop + element.clientHeight) / element.scrollHeight;
	}

	return null;
}

/**
 * Checks if a given HTML element is scrolled to the very bottom.
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to check for scroll height.
 * @returns {boolean} - Returns TRUE if the specified element is scrolled to the very bottom
 */
function ElementIsScrolledToEnd(ElementOrId) {
	const element = ElementWrap(ElementOrId);
	return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
}

/**
 * Sets the scroll position of an element to a specified percentage of its scrollable content.
 * Ideally scroll percentage should be gotten with {@link ElementGetScrollPercentage}
 *
 * @param {ElementHelp.ElementOrId} ElementOrId
 * @param {number} scrollPercentage
 * @param {ScrollBehavior} scrollBehavior
 * @returns {void}
 */
function ElementSetScrollPercentage(ElementOrId, scrollPercentage, scrollBehavior = 'auto') {
	const element = ElementWrap(ElementOrId);
	if (!element) {
		console.error("A call to ElementSetScrollPercentage was made on non-existent element with ID", ElementOrId);
		return;
	}

	if (scrollPercentage < 0 || scrollPercentage > 1) {
		console.error("scrollPercentage must be between 0 and 1 (inclusive).");
		return;
	}

	const scrollHeight = element.scrollHeight;
	const clientHeight = element.clientHeight;
	const newScrollTop = Math.max(0, (scrollPercentage * scrollHeight - clientHeight)); // Clamp to 0 for valid range

	element.scrollTo({
		top: newScrollTop,
		behavior: scrollBehavior
	});
}

/**
 * Gives focus to a specified existing element for non-mobile users.
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to give focus to.
 * @returns {void} - Nothing
 */
function ElementFocus(ElementOrId) {
	// Got to be more careful with mobile here, as focusing interactive elements tends to pop up the virtual keyboard;
	// an action that's significantly more disruptive than a simple focus outline
	if (!CommonIsMobile) {
		ElementWrap(ElementOrId)?.focus();
	}
}

/**
 * Toggles (non-nested) HTML elements that were created by a given screen. When toggled off, they are hidden (not removed)
 * @param {string} Screen - Screen for which to hide the elements generated
 * @param {boolean} ShouldDisplay - TRUE if we are toggling on the elements, FALSE if we are hiding them.
 */
function ElementToggleGeneratedElements(Screen, ShouldDisplay) {
	const elements = /** @type {HTMLElement[]} */(Array.from(document.querySelectorAll(`[screen-generated="${Screen}"]`)));
	for (const e of elements) {
		if (e.parentElement === null || e.parentElement === document.body) {
			e.toggleAttribute("hidden", !ShouldDisplay);
		}
	}
}

/**
 * Create a label for a given element
 * @param {string} label
 * @param {HTMLElement | string} forId
 * @param {object} [options]
 * @param {'left' | 'top'} [options.position]
 */
function ElementCreateSettingsLabel(label, forId, options) {
	return ElementCreate({
		tag: "label",
		attributes: { for: typeof forId === "string" ? forId : (forId.id ||= ElementGenerateID()) },
		classList:  ['element-settings-label', `element-settings-label-position-${options?.position ?? "top"}`],
		children: [
			label,
		],
	});
}

/**
 * Create a group of radio buttons
 * @param {string} id
 * @param {(this: HTMLButtonElement, ev: PointerEvent) => void} onclick
 * @param {string} defaultValue
 * @param {{
 * htmlOptions?: Partial<Record<"button" | "tooltip" | "img" | "label", Omit<HTMLOptions<any>, "tag">>>,
 * options?: ElementButton.Options,
 * }[]} options
 */
function ElementCreateRadioButtonGroup(id, onclick, defaultValue, options) {
	return ElementCreate({
		tag: "fieldset",
		classList: ["element-button-group"],
		attributes: {
			"aria-required": "true",
			role: "radiogroup",
			id: id
		},
		children: options.map((entry) => ElementButton.Create(null, onclick, {
			noStyling: true,
			tooltipPosition: "bottom",
			...entry?.options,
		}, {
			...entry?.htmlOptions,
			button: {
				...entry?.htmlOptions?.button,
				classList: ["element-button-group-button", ...entry?.htmlOptions?.button?.classList ? entry.htmlOptions.button.classList : []],
				attributes: {
					role: "radio",
					value: entry?.htmlOptions?.button?.attributes?.value,
					tabindex: entry?.htmlOptions?.button?.attributes?.value === defaultValue ? "0" : "-1",
					"aria-checked": entry?.htmlOptions?.button?.attributes?.value === defaultValue ? "true" : "false",
					...entry?.htmlOptions?.button?.attributes,
				},
			},
		})),
	});
}

/**
 * Namespace for creating (DOM-based) dropdown menus filled with checkboxes
 * @namespace
 */
var ElementCheckboxDropdown = {
	/**
	 * @param {string} idPrefix
	 * @param {string} idSuffix
	 * @param {string} spanText
	 * @param {(this: HTMLInputElement, event: Event) => void} listener
	 * @param {boolean} checked
	 * @returns {HTMLOptions<"label">}
	 */
	_CreateCheckboxPair(idPrefix, idSuffix, spanText, listener, checked=false) {
		return {
			tag: "label",
			classList: ["dropdown-checkbox-grid"],
			attributes: { id: `${idPrefix}-pair-${idSuffix}` },
			children: [
				ElementCheckbox.Create(`${idPrefix}-checkbox-${idSuffix}`, listener, { checked }),
				{
					tag: "span",
					classList: ["dropdown-checkbox-label"],
					attributes: { id: `${idPrefix}-label-${idSuffix}` },
					children: [spanText],
				},
			],
		};
	},

	/**
	 * Construct a dropdown menu with labeled checkboxes
	 * @param {string | null} id - The ID of the element
	 * @param {readonly string[]} checkboxList - The checkbox labels
	 * @param {(this: HTMLInputElement, event: Event) => void} eventListener - The event listener to-be attached to all checkboxes
	 * @param {object} [options]
	 * @param {HTMLElement} [options.parent] - The parent element of the dropdown menu; defaults to {@link document.body}
	 * @param {boolean} [options.checked] - Whether all checkboxes should be initially checked
	 * @returns {HTMLDivElement} - The created dropdown menu
	 */
	FromList(id, checkboxList, eventListener, options=undefined) {
		id ??= ElementGenerateID();
		return /** @type {null | HTMLDivElement} */(document.getElementById(id)) ?? ElementCreate({
			tag: "div",
			attributes: { id, ["screen-generated"]: CurrentScreen, hidden: true },
			parent: options?.parent ?? document.body,
			classList: ["HideOnPopup", "dropdown", "scroll-box"],
			children: checkboxList.map((o) => this._CreateCheckboxPair(id, o, o, eventListener, options?.checked)),
		});
	},

	/**
	 * Construct a dropdown menu with labeled checkboxes, each group of checkboxes having a header associated with them
	 * @param {string | null} id - The ID of the element
	 * @param {Record<string, readonly string[]>} checkboxRecord - The checkbox labels
	 * @param {(this: HTMLInputElement, event: Event) => void} eventListener - The event listener to-be attached to all checkboxes
	 * @param {object} [options]
	 * @param {HTMLElement} [options.parent] - The parent element of the dropdown menu; defaults to {@link document.body}
	 * @param {boolean} [options.checked] - Whether all checkboxes should be initially checked
	 * @returns {HTMLDivElement} - The created dropdown menu
	 */
	FromRecord(id, checkboxRecord, eventListener, options=undefined) {
		id ??= ElementGenerateID();
		return /** @type {null | HTMLDivElement} */(document.getElementById(id)) ?? ElementCreate({
			tag: "div",
			attributes: { id, ["screen-generated"]: CurrentScreen, hidden: true },
			parent: options?.parent ?? document.body,
			classList: ["HideOnPopup", "dropdown", "scroll-box"],
			children: Object.entries(checkboxRecord).flatMap(([header, checkboxList]) => {
				return [
					{
						tag: "span",
						classList: ["dropdown-header"],
						attributes: { id: `${id}-header-${header}` },
						children: [header],
					},
					{
						tag: "div",
						classList: ["dropdown-grid"],
						attributes: { id: `${id}-grid-${header}` },
						children: checkboxList.map((o) => this._CreateCheckboxPair(id, `${header}-${o}`, o, eventListener, options?.checked)),
					},
				];
			}),
		});
	},
};

/**
 * Construct a search-based `<input>` element that offers suggestions based on the passed callbacks output.
 *
 * The search suggestions are constructed lazily once the search input is focused.
 * @example
 * <input type="search" id={id} list={`${id}-datalist`}>
 *     <datalist id={`${id}-datalist`}>
 *         <option value="..." />
 *         ...
 *     </datalist>
 * </input>
 * @param {string | null} id - The ID of the to-be created search input; `${id}-datalist` will be assigned the search input's datalist
 * @param {(searchInput: HTMLInputElement) => Iterable<string>} dataCallback - A callback returning all values that will be converted into a datalist `<option>`
 * @param {object} [options]
 * @param {string} [options.value] - Value of the search input
 * @param {Node} [options.parent] - The parent element of the search input; defaults to {@link document.body}
 * @param {number} [options.maxLength] - Maximum input length of the search input
 * @param {number} [options.minLength] - Minimum input length of the search input
 * @param {number} [options.size]
 * @param {string} [options.placeholder]
 * @param {string} [options.name]
 * @param {boolean} [options.disabled]
 * @param {boolean} [options.spellcheck]
 * @param {string | RegExp} [options.pattern]
 * @param {(this: HTMLInputElement, ev: Event) => void} [options.onInput]
 * @param {(this: HTMLInputElement, ev: KeyboardEvent) => void} [options.onKeydown]
 * @param {null | Partial<Record<"search", Omit<HTMLOptions<"input">, "tag">>>} htmlOptions
 * @returns {HTMLInputElement} - The newly created search input
 */
function ElementCreateSearchInput(id, dataCallback, options=undefined, htmlOptions=null) {
	id ??= ElementGenerateID();
	let elem = /** @type {HTMLInputElement | null} */(document.getElementById(id));
	if (elem) {
		console.error(`Element "${id}" already exists`);
		return elem;
	}

	options ??= {};
	htmlOptions ??= {};
	htmlOptions.search ??= {};
	return ElementCreate({
		...htmlOptions.search,
		tag: "input",
		parent: options.parent ?? document.body,
		attributes: {
			id,
			type: "search",
			size: options.size ?? 0,
			list: `${id}-datalist`,
			name: options.name,
			value: options.value,
			disabled: options.disabled,
			minlength: options.minLength,
			maxlength: options.maxLength,
			placeholder: options.placeholder,
			spellcheck: typeof options.spellcheck === "boolean" ? options.spellcheck.toString() : undefined,
			pattern: options.pattern instanceof RegExp ? options.pattern.source : options.pattern,
			...(htmlOptions.search.attributes ?? {}),
		},
		children: [
			ElementCreate({ tag: "datalist", attributes: { id: `${id}-datalist` } }),
			...(htmlOptions.search.children ?? []),
		],
		eventListeners: {
			async focus() {
				if (this.list?.children.length !== 0) {
					return;
				}

				for (const value of dataCallback(this)) {
					this.list.appendChild(ElementCreate({ tag: "option", attributes: { value } }));
				}
			},
			input: options.onInput,
			keydown: options.onKeydown,
			...(htmlOptions.search.eventListeners ?? {}),
		},
	});
}

/**
 * Namespace for creating HTML buttons
 * @namespace
 */
var ElementButton = {
	/**
	 * @private
	 * @readonly
	 */
	_TooltipPositions: Object.freeze({
		left: "button-tooltip-left",
		right: "button-tooltip-right",
		top: "button-tooltip-top",
		bottom: "button-tooltip-bottom",
	}),

	/**
	 * @private
	 * @readonly
	 */
	_LabelPositions: Object.freeze({
		top: "button-label-top",
		center: "button-label-center",
		bottom: "button-label-bottom",
		left: "button-label-left",
		right: "button-label-right",
	}),

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: KeyboardEvent) => void}
	 */
	_KeyDown: function _KeyDown(ev) {
		if (CommonKey.GetModifiers(ev)) {
			return;
		}
		switch (ev.key) {
			case "Enter":
			case " ":
				ev.preventDefault();

				if (this.disabled || this.getAttribute("aria-disabled") === "true") {
					ev.stopImmediatePropagation();
					return;
				} else if (!ev.repeat) {
					this.click();
					this.setAttribute("data-active", true);
				}
				ev.stopPropagation();
				break;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: KeyboardEvent) => void}
	 */
	_KeyUp: function _KeyUp(ev) {
		if (ev.shiftKey || ev.ctrlKey || ev.metaKey || ev.altKey) {
			return;
		}
		switch (ev.key) {
			case "Enter":
			case " ":
				if (this.disabled || this.getAttribute("aria-disabled") === "true") {
					ev.stopImmediatePropagation();
					return;
				}
				this.removeAttribute("data-active");
				break;
		}
	},

	_GetClickTouchListeners: function _GetClickTouchListeners() {
		/** @type {null | number} */
		let holdAndClickTimeoutID = null;
		/** Whether a touch-based hold-and-click action was detected */
		let holdAndClick = false;

		/**
		 * @satisfies {TimerHandler}
		 * @type {(elem: HTMLButtonElement, ev: TouchEvent) => void}
		 */
		function touchstartTimeout(elem, ev) {
			holdAndClickTimeoutID = null;
			holdAndClick = true;
			elem.dispatchEvent(new PointerEvent("bcTouchHold", ev));
		}

		/** @type {(this: HTMLButtonElement, ev: TouchEvent) => void} */
		function touchstart(ev) {
			holdAndClick = false;
			if (!this.disabled) {
				holdAndClickTimeoutID ??= setTimeout(touchstartTimeout, 300, this, ev);
			}
		}

		/** @type {(this: HTMLButtonElement, ev: TouchEvent) => void} */
		function touchmove(ev) {
			if (holdAndClickTimeoutID != null) {
				clearTimeout(holdAndClickTimeoutID);
				holdAndClickTimeoutID = null;
			}
		}

		/** @type {(this: HTMLButtonElement, ev: TouchEvent) => void} */
		function touchend(ev) {
			if (holdAndClick) {
				ev.preventDefault();
			}
		}

		/** @type {(this: HTMLButtonElement, ev: PointerEvent) => void} */
		function click(ev) {
			if (holdAndClick) {
				ev.stopImmediatePropagation();
				holdAndClick = false;
				return;
			}
			if (!this.matches(":focus-visible")) {
				this.blur();
			}
			if (this.getAttribute("aria-disabled") === "true") {
				this.dispatchEvent(new PointerEvent("bcClickDisabled", ev));
				ev.stopImmediatePropagation();
			}
		}

		/** @type {(this: HTMLButtonElement, ev: FocusEvent) => void} */
		function blur(ev) {
			this.removeAttribute("data-show-tooltip");
			if (holdAndClickTimeoutID != null) {
				clearTimeout(holdAndClickTimeoutID);
				holdAndClickTimeoutID = null;
			}
			holdAndClick = false;
		}

		/** @type {(this: HTMLButtonElement, ev: PointerEvent) => void} */
		function bcTouchHold(ev) {
			this.focus({ preventScroll: true });
			this.toggleAttribute("data-show-tooltip", true);
		}

		return { click, touchend, touchmove, touchstart, blur, bcTouchHold, touchcancel: touchend };
	},

	/**
	 * Navigate the passed elements children in a depth-first search manner,
	 * yielding all elements matching the `query` selector and whose parent does _not_ satisify the passed `filter`
	 * @param {Element} root
	 * @param {string} query
	 * @param {(el: Element) => boolean} filter
	 * @returns {Generator<Element, void>}
	 */
	_QueryDFS: function *_QueryDFS(root, query, filter) {
		for (const elem of root.children) {
			if (elem.matches(query)) {
				yield elem;
			}

			if (filter(elem)) {
				continue;
			} else {
				yield *ElementButton._QueryDFS(elem, query, filter);
			}
		}
	},

	/**
	 * Click event listener for radio buttons.
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/radio_role
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menuitemradio_role
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickRadio: function _ClickRadio(ev) {
		// Take precaution against nested radio groups/menus, as one might accidentally query a sibbling that belongs to a different group
		// Particularly important for menus embedded in other menus or menubars
		const role = this.getAttribute("role");
		const isRadio = role === "radio";
		const parent = this.parentElement?.closest(isRadio ? "[role='radiogroup']" : "[role='menu'], [role='menubar']");
		if (!parent) {
			return;
		}

		// Ensure that `radio` buttons to switch the tabindex of the active radio to 0, while `menuitemradio` buttons do not
		if (this.getAttribute("aria-checked") === "true") {
			if (parent.getAttribute("aria-required") === "true") {
				if (!this.hasAttribute("data-allow-required-clicks")) {
					ev.stopImmediatePropagation();
				}
			} else {
				this.setAttribute("aria-checked", "false");
				if (isRadio) {
					/** @type {(e: Element) => boolean} */
					const filter = (e) => e.getAttribute("role") === "radiogroup" || !ElementCheckVisibility(e);
					const first = ElementButton._QueryDFS(parent, `[role='${role}']`, filter).next();
					if (first.value) {
						this.tabIndex = -1;
						first.value.setAttribute("tabindex", "0");
					}
				}
				if (this.getAttribute("aria-expanded") === "true") {
					this.setAttribute("aria-expanded", "false");
				}
			}
		} else {
			/** @type {(e: Element) => boolean} */
			const filter = isRadio
				? (e) => e.getAttribute("role") === "radiogroup"
				: (e) => e.getAttribute("role") === "menu" || e.getAttribute("role") === "menuitem";
			let prev = ElementButton._QueryDFS(parent, `[role='${role}'][aria-checked='true']`, filter).next();
			if (!prev.value && isRadio) {
				prev = ElementButton._QueryDFS(parent, `[role='${role}'][tabindex='0']`, filter).next();
			}

			if (prev.value) {
				prev.value.setAttribute("aria-checked", "false");
				if (prev.value.getAttribute("aria-expanded") === "true") {
					prev.value.setAttribute("aria-expanded", "false");
				}
				if (isRadio) {
					prev.value.setAttribute("tabindex", "-1");
				}
			}

			if (this.getAttribute("aria-expanded") === "false") {
				this.setAttribute("aria-expanded", "true");
			}
			if (isRadio) {
				this.tabIndex = 0;
			}
			this.setAttribute("aria-checked", "true");
		}
	},

	/**
	 * Click event listener for spin buttons.
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/spinbutton_role
	 * @private
	 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
	 */
	_ClickSpin: function _ClickSpin(ev) {
		const min = Number.parseInt(this.getAttribute("aria-valuemin") ?? "", 10);
		const max = Number.parseInt(this.getAttribute("aria-valuemax") ?? "", 10);
		const now = Number.parseInt(this.getAttribute("aria-valuenow") ?? "", 10);
		if (Number.isNaN(min) || Number.isNaN(max)) {
			ev.stopImmediatePropagation();
			return;
		}

		if (Number.isNaN(now) || now < min || now === max) {
			this.setAttribute("aria-valuenow", min);
		} else if (now > max) {
			this.setAttribute("aria-valuenow", max);
		} else {
			this.setAttribute("aria-valuenow", now + 1);
		}
	},

	/**
	 * Keydown event listener for spin buttons.
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/spinbutton_role
	 * @private
	 * @type {(this: HTMLButtonElement, ev: KeyboardEvent) => void}
	 */
	_KeyDownSpin: function _KeyDownSpin(ev) {
		if (CommonKey.GetModifiers(ev)) {
			return;
		}

		// Decrement the current value such that the next click action will bring it to the correct, expected value
		let valuenow = null;
		switch (ev.key) {
			case "ArrowRight":
			case "ArrowUp":
				valuenow = this.getAttribute("aria-valuenow");
				break;
			case "ArrowLeft":
			case "ArrowDown":
				valuenow = Number.parseInt(this.getAttribute("aria-valuenow") ?? "", 10) - 2;
				break;
			case "Home":
				valuenow = Number.parseInt(this.getAttribute("aria-valuemax") ?? "", 10) - 1;
				break;
			case "End":
				valuenow = this.getAttribute("aria-valuemax");
				break;
		}

		if (valuenow != null) {
			this.setAttribute("aria-valuenow", valuenow);
			this.click();
			ev.stopPropagation();
			ev.preventDefault();
		}
	},

	/**
	 * @this {HTMLElement}
	 * @param {KeyboardEvent} ev
	 */
	_KeyDownRadio: function _KeyDownRadio(ev) {
		if (CommonKey.GetModifiers(ev)) {
			return;
		}

		switch (ev.key) {
			case "ArrowRight":
			case "ArrowDown":
			case "ArrowLeft":
			case "ArrowUp": {
				const sibblings = Array.from(this.closest("[role='radiogroup']")?.querySelectorAll("button[role='radio']") ?? []).filter(e => ElementCheckVisibility(e));
				const thisIdx = sibblings.indexOf(this);
				if (thisIdx === -1) {
					return;
				}

				/** @type {Element} */
				let next = this;
				const nSibblings = sibblings.length;
				if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
					next = sibblings[(thisIdx + 1) % nSibblings];
				} else {
					next = thisIdx === 0 ? sibblings[nSibblings - 1] : sibblings[(thisIdx - 1) % nSibblings];
				}

				if (next !== this) {
					/** @type {HTMLButtonElement} */(next).click();
					/** @type {HTMLButtonElement} */(next).focus();
					ev.stopPropagation();
					ev.preventDefault();
				}
				break;
			}
		}
	},

	/**
	 * Click event listener for checkbox buttons.
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickCheckbox: function _ClickCheckbox(ev) {
		if (this.getAttribute("aria-checked") === "true") {
			if (this.getAttribute("aria-expanded") === "true") {
				this.setAttribute("aria-expanded", "false");
			}
			this.setAttribute("aria-checked", "false");
		} else {
			if (this.getAttribute("aria-expanded") === "false") {
				this.setAttribute("aria-expanded", "true");
			}
			this.setAttribute("aria-checked", "true");
		}
	},

	/**
	 * @private
	 * @param {string} id
	 * @param {string} [img]
	 * @param {null | string} [imgColor]
	 * @param {Omit<HTMLOptions<"img" | "div">, "tag">} [options]
	 * @returns {HTMLImageElement | HTMLDivElement | null}
	 */
	_ParseImage: function _ParseImage(id, img, imgColor=undefined, options=undefined) {
		if (img == null) {
			return null;
		}
		options ??= {};
		if (imgColor == null) {
			return ElementCreate({
				...options,
				tag: "img",
				classList: ["button-image", ...(options.classList ?? [])],
				attributes: { id: `${id}-image`, decoding: "async", loading: "lazy", "aria-hidden": "true", src: img, ...(options.attributes ?? {}) },
			});
		} else {
			const imgURL = (img.startsWith("data:image") || img.startsWith("http")) ? `url("${img}")` : `url("./${img}")`;
			return ElementCreate({
				...options,
				tag: "div",
				classList: ["button-image", ...(options.classList ?? [])],
				attributes: { id: `${id}-image`, "aria-hidden": "true", src: img, role: "img", ...(options.attributes ?? {}) },
				style: { "background-image": imgURL, "mask-image": imgURL, "background-color": imgColor, ...(options.style ?? {}) },
			});
		}
	},

	/**
	 * @private
	 * @param {string} id
	 * @param {ElementButton.StaticNode} [label]
	 * @param {"top" | "center" | "bottom" | "left" | "right"} [position]
	 * @param {Omit<HTMLOptions<"span">, "tag">} [options]
	 * @returns {null | HTMLSpanElement}
	 */
	_ParseLabel: function _ParseLabel(id, label, position="bottom", options) {
		label = (CommonIsArray(label) ? label : [label]).filter(i => i != null);
		if (label.length === 0) {
			return null;
		}

		options ??= {};
		const labelPosition = this._LabelPositions[position] ?? this._LabelPositions.bottom;
		return ElementCreate({
			...options,
			tag: "span",
			attributes: { id: `${id}-label`, for: id, ...(options.attributes ?? {}) },
			classList: ["button-label", labelPosition, ...(options.classList ?? [])],
			children: [...label, ...(options.children ?? [])],
		});
	},

	/**
	 * Parse the passed icon list, returning its corresponding `<img>` grid and tooltip if non-empty
	 * @param {string} id - The ID of the parent element
	 * @param {readonly (InventoryIcon | ElementButton.CustomIcon | null | undefined)[]} [icons] - The (optional) list of icons
	 * @returns {null | { iconGrid: HTMLDivElement, tooltip: [HTMLSpanElement, HTMLElement] }} - `null` if the provided icon list is empty and otherwise an object containing the icon grid and a icon-specific tooltip
	 */
	_ParseIcons: function _ParseIcons(id, icons) {
		icons = icons?.filter(i => i != null);
		if (!icons || icons.length === 0) {
			return null;
		}

		const tooltip = document.getElementById(`${id}-icon-ul`) ?? ElementCreate({
			tag: "ul",
			attributes: { id: `${id}-icon-ul` },
			classList: ["button-icon-tooltip-ul"],
			children: [],
		});

		const iconGrid = /** @type {HTMLDivElement} */(document.getElementById(`${id}-icon-grid`)) ?? ElementCreate({
			tag: "div",
			classList: ["button-icon-grid"],
			attributes: { id: `${id}-icon-grid`, "aria-hidden": "true" },
		});
		const iconNames = Array.from(iconGrid.querySelectorAll(".button-icon")).map(el => el.getAttribute("data-name"));

		icons.forEach((icon) => {
			let custom = false;
			/** @type {string} */
			let name;
			/** @type {string} */
			let src;
			/** @type {(string | Node | HTMLOptions<any>)[]} */
			let tooltipChildren;
			if (typeof icon === "string" && InventoryIconIsPadlock(icon)) {
				name = icon;
				src = `./Assets/Female3DCG/ItemMisc/Preview/${icon}.png`;
				tooltipChildren = [InterfaceTextGet("PreviewIconPadlock").replace(
					"AssetName",
					(AssetGet("Female3DCG", "ItemMisc", icon)?.Description ?? ""),
				)];
			} else if (typeof icon === "string") {
				name = icon;
				src = `./Icons/Previews/${icon}.png`;
				tooltipChildren = [InterfaceTextGet(`PreviewIcon${icon}`)];
			} else if (CommonIsObject(icon)) {
				custom = true;
				name = icon.name;
				src = icon.iconSrc;
				tooltipChildren = (CommonIsArray(icon.tooltipText) ? icon.tooltipText : [icon.tooltipText]).filter(i => i != null);
			} else {
				return;
			}
			if (iconNames.includes(name)) {
				return;
			}

			ElementCreate({
				tag: "li",
				attributes: { id: `${id}-icon-li-${name}` },
				classList: ["button-icon-tooltip-li"],
				children: tooltipChildren,
				parent: tooltip,
				style: { "background-image": (src.startsWith("data:image") || src.startsWith("http")) ? `url("${src}")` : `url("./${src}")` },
			});

			ElementCreate({
				tag: "img",
				classList: ["button-icon"],
				attributes: { decoding: "async", loading: "lazy", src, "aria-owns": `${id}-icon-li-${name}` },
				dataAttributes: { name, custom: custom ? "" : undefined },
				parent: iconGrid,
			});
		});
		return { iconGrid, tooltip: [ElementCreate({ tag: "span", children: [InterfaceTextGet("StatusAndEffects")] }), tooltip] };
	},

	/**
	 * @private
	 * @param {string} id
	 * @param {"left" | "right" | "top" | "bottom"} [position]
	 * @param {readonly (null | undefined | string | Node | HTMLOptions<any>)[]} [children]
	 * @param {Omit<HTMLOptions<"div">, "tag">} [options]
	 * @returns {null | HTMLDivElement}
	 */
	_ParseTooltip: function _ParseTooltip(id, position = "left", children, options) {
		if (!children || children.every(i => i == null)) {
			return null;
		}

		options ??= {};
		const tooltipPosition = this._TooltipPositions[position] ?? this._TooltipPositions.left;
		return ElementCreate({
			...options,
			tag: "div",
			classList: ["button-tooltip", tooltipPosition, ...(options.classList ?? [])],
			attributes: {
				id: `${id}-tooltip`,
				role: "tooltip",
				...(options.attributes ?? {}),
			},
			children,
		});
	},

	/**
	 * Set the `[role]` attribute of the passed button
	 * @param {HTMLButtonElement} button
	 * @param {null | ElementButton.Options["role"]} role
	 * @param {null | { force?: boolean }} options
	 */
	SetRole: function SetRole(button, role, options=null) {
		const oldRole = button.getAttribute("role");
		if (oldRole === role && !options?.force) {
			return;
		}

		switch (oldRole) {
			case "radio":
				button.removeEventListener("click", ElementButton._ClickRadio);
				button.removeEventListener("keydown", ElementButton._KeyDownRadio);
				break;
			case "menuitemradio":
				button.removeEventListener("click", ElementButton._ClickRadio);
				break;
			case "combobox":
			case "switch":
			case "checkbox":
			case "menuitemcheckbox":
				button.removeEventListener("click", ElementButton._ClickCheckbox);
				break;
			case "spinbutton": {
				button.removeEventListener("click", ElementButton._ClickSpin);
				button.removeEventListener("keydown", ElementButton._KeyDownSpin);
				break;
			}
		}

		if (role == null) {
			button.removeAttribute("role");
			return;
		} else {
			button.setAttribute("role", role);
		}
		switch (role) {
			case "radio":
			case "menuitemradio":
				button.addEventListener("click", ElementButton._ClickRadio);
				if (!button.getAttribute("aria-checked")) {
					button.setAttribute("aria-checked", "false");
				}

				if (role === "radio") {
					button.addEventListener("keydown", ElementButton._KeyDownRadio);
					if (button.getAttribute("tabindex") == null) {
						button.tabIndex = button.getAttribute("aria-checked") === "true" ? 0 : -1;
					}
				}
				break;
			case "combobox":
			case "switch":
			case "checkbox":
			case "menuitemcheckbox":
				button.addEventListener("click", ElementButton._ClickCheckbox);
				if (!button.getAttribute("aria-checked")) {
					button.setAttribute("aria-checked", "false");
				}
				if (role === "combobox" && !button.hasAttribute("aria-expanded")) {
					button.setAttribute("aria-expanded", "false");
				}
				break;
			case "spinbutton": {
				if (!button.hasAttribute("aria-valuemin")) {
					button.setAttribute("aria-valuemin", "0");
				}
				if (!button.hasAttribute("aria-valuemax")) {
					button.setAttribute("aria-valuemax", "100");
				}
				if (!button.hasAttribute("aria-valuenow")) {
					button.setAttribute("aria-valuenow", button.getAttribute("aria-valuemin"));
				}
				button.addEventListener("click", ElementButton._ClickSpin);
				button.addEventListener("keydown", ElementButton._KeyDownSpin);
			}
		}
	},

	/**
	 * Create a generic button.
	 * @param {null | string} id - The ID of the to-be created search button
	 * @param {null | ((this: HTMLButtonElement, ev: PointerEvent) => any)} onClick - The click event listener to-be attached to the tooltip
	 * @param {null | ElementButton.Options} [options] - High level options for the to-be created button
	 * @param {Partial<Record<"button" | "tooltip" | "img" | "label", Omit<HTMLOptions<any>, "tag">>>} [htmlOptions] - Additional low-level {@link ElementCreate} options to-be applied to the either the button or tooltip
	 * @returns {HTMLButtonElement} - The created button
	 */
	Create: function Create(id, onClick, options, htmlOptions) {
		id ??= ElementGenerateID();
		let elem = /** @type {HTMLButtonElement | null} */(document.getElementById(id));
		if (elem) {
			console.error(`Element "${id}" already exists`);
			return elem;
		}

		htmlOptions ??= {};
		const buttonOptions = htmlOptions.button ?? {};
		const tooltipOptions = htmlOptions.tooltip ?? {};

		options ??= {};
		const labelPosition = options.labelPosition ?? (options.image == null ? "center" : "bottom");
		const image = this._ParseImage(id, options.image, options.imageColor, htmlOptions.img);
		const label = this._ParseLabel(id, options.label, labelPosition, htmlOptions.label);
		const icons = this._ParseIcons(id, options.icons);

		// Only add the icon-based component of the tooltip if there is an actual tooltip
		/** @type {(null | undefined | string | Node | HTMLOptions<any>)[]} */
		const protoTooltip = [...(CommonIsArray(options.tooltip) ? options.tooltip : [options.tooltip])];
		if (!protoTooltip.every(i => i == null)) {
			protoTooltip.push(...(icons?.tooltip ?? []));
		}
		protoTooltip.push(...(tooltipOptions.children ?? []));
		const tooltip = this._ParseTooltip(id, options.tooltipPosition, protoTooltip, tooltipOptions);

		const classList = [
			"blank-button",
			"button",
			options.noStyling ? null : "button-styling",
			(label?.classList.contains(ElementButton._LabelPositions.left) || label?.classList.contains(ElementButton._LabelPositions.right)) ? "button-horizontal" : null,
			"HideOnPopup",
			...(buttonOptions.classList ?? []),
		];

		/** @type {"aria-labelledby" | "aria-describedby"} */
		let tooltipRoleAttribute;
		switch (options.tooltipRole) {
			case "label":
				tooltipRoleAttribute = "aria-labelledby";
				break;
			case "description":
				tooltipRoleAttribute = "aria-describedby";
				break;
			default:
				tooltipRoleAttribute = (label ? "aria-describedby" : "aria-labelledby");
				break;
		}

		/** @type {null | string} */
		let ariaControls = null;
		if (options.ariaControls) {
			/** @type {readonly (string | Element)[]} */
			const ariaControlsCandidate = CommonIsArray(options.ariaControls) ? options.ariaControls : [options.ariaControls];
			ariaControls = ariaControlsCandidate.map(idOrElem => {
				return (typeof idOrElem === "string") ? idOrElem : idOrElem.id ||= ElementGenerateID();
			}).join(" ");
		}

		elem = ElementCreate({
			...buttonOptions,
			tag: "button",
			attributes: {
				id,
				name: options.name,
				[tooltipRoleAttribute]: tooltip ? `${id}-tooltip` : undefined,
				"screen-generated": CurrentScreen,
				// role: options.role, // Assigned further down below via `ElementButton.SetRole`
				type: "button",
				tabindex: options.tabindex,
				"aria-controls": ariaControls,
				"aria-checked": options.ariaChecked == null ? null : options.ariaChecked.toString(),
				"aria-expanded": options.ariaExpanded == null ? null : options.ariaExpanded.toString(),
				"aria-haspopup": options.ariaHasPopup == null ? null : options.ariaHasPopup.toString(),
				...(buttonOptions.attributes ?? {}),
			},
			classList,
			eventListeners: {
				keydown: this._KeyDown,
				keyup: this._KeyUp,
				bcClickDisabled: options.clickDisabled,
				...this._GetClickTouchListeners(),
			},
			children: [
				tooltip,
				image,
				icons?.iconGrid,
				label,
				...(buttonOptions.children ?? []),
			],
			dataAttributes: {
				"allowRequiredClicks": options.allowRequiredClick,
				...(buttonOptions.dataAttributes ?? {}),
			},
		});

		const role = /** @type {ElementButton.Options["role"]} */(buttonOptions.attributes?.role ?? options.role);
		if (role) {
			ElementButton.SetRole(elem, role, { force: true });
		}

		for (const [name, listener] of Object.entries(buttonOptions.eventListeners ?? {})) {
			if (listener) {
				elem.addEventListener(name, /** @type {EventListener} */(listener));
			}
		}
		if (onClick) {
			elem.addEventListener("click", onClick);
		}

		if (options.disabled) {
			const menuItemRoles = ["menuitem", "menuitemradio", "menuitemcheckbox"];
			if (menuItemRoles.some(i => elem.getAttribute("role") === i)) {
				elem.setAttribute("aria-disabled", true);
			} else {
				elem.disabled = true;
			}
		}
		return elem;
	},

	/**
	 * Create a button for an asset or item, including image, label and icons.
	 * @param {string | null} idPrefix - The ID of the to-be created search button
	 * @param {Asset | Item} asset - The asset (or item) for which to create a button
	 * @param {null | Character} C - The character wearing the asset/item (if any)
	 * @param {null | ((this: HTMLButtonElement, ev: PointerEvent) => any)} onClick - The click event listener to-be attached to the tooltip
	 * @param {null | ElementButton.Options} [options] - High level options for the to-be created button
	 * @param {null | Partial<Record<"button" | "tooltip" | "img" | "label", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional low-level {@link ElementCreate} options to-be applied to the either the button or tooltip
	 * @returns {HTMLButtonElement} - The created button
	 */
	CreateForAsset: function CreateForAsset(idPrefix, asset, C, onClick, options=null, htmlOptions=null) {
		const item = "Asset" in asset ? asset : AppearanceItem.fromAsset(asset);
		asset = item.Asset;

		const id = idPrefix == null ? ElementGenerateID() : `${idPrefix}-${asset.Group.Name}-${asset.Name}`;
		const elem = /** @type {HTMLButtonElement | null} */(document.getElementById(id));
		if (elem) {
			console.error(`Element "${id}" already exists`);
			return elem;
		}

		htmlOptions ??= {};
		htmlOptions.button ??= {};
		htmlOptions.button.attributes ??= {};
		htmlOptions.button.attributes.name ??= asset.Name;
		htmlOptions.button.dataAttributes ??= {};
		htmlOptions.button.dataAttributes.group ??= asset.Group.Name;
		htmlOptions.button.dataAttributes.craft ??= item.Craft ? "" : undefined;
		htmlOptions.button.dataAttributes.hidden ??= CharacterAppearanceItemIsHidden(asset.Name, asset.Group.Name) ? "" : undefined;
		htmlOptions.button.dataAttributes.vibrating ??= item.Property?.Effect?.includes("Vibrating") ? "" : undefined;
		htmlOptions.button.children = [
			...(htmlOptions.button.children ?? []),
			ElementButton._ParseImage(`${idPrefix}-hidden`, "./Icons/HiddenItem.png", null, { dataAttributes: { hidden: "" } }),
		];
		htmlOptions.tooltip ??= {};
		htmlOptions.tooltip.classList ??= [];
		htmlOptions.tooltip.classList = [
			...htmlOptions.tooltip.classList,
			"button-tooltip-justify",
		];

		options ??= {};
		options.label ??= item.Craft?.Name || asset.Description;
		options.image ??= `./Assets/Female3DCG/${asset.DynamicGroupName}/Preview/${asset.Name}.png`;
		options.icons = [
			...(options.icons ?? []),
			DialogGetFavoriteStateDetails(C ?? Player, asset)?.Icon,
			InventoryBlockedOrLimited(C ?? Player, item) ? "Blocked" : null,
			InventoryIsAllowedLimited(C ?? Player, item) ? "AllowedLimited" : null,
			...DialogGetLockIcon(item, item.Craft?.Partial ?? true),
			...DialogGetAssetIcons(asset),
			...DialogEffectIcons.GetIcons(item),
		];
		options.tooltipPosition ??= "bottom";
		options.tooltip ??= !item.Craft ? "" : /** @type {(HTMLOptions<any> | HTMLElement)[]} */([
			...(CommonIsArray(options.tooltip) ? options.tooltip : [options.tooltip]),
			...ElementButton.CreateCraftTooltipContent(item.Craft),
		]);
		return ElementButton.Create(id, onClick, options, htmlOptions);
	},

	/**
	 * @param {CraftingPartialItem} craft
	 * @returns {HTMLElement[]}
	 */
	CreateCraftTooltipContent: function CreateCraftTooltipContent(craft) {
		// FIXME: For reasons unknown the `Effects` can, under unclear circumstances, occasionally disappear during the `DialogInventory` construction
		// As a workaround, treat the value as potentially nulllish
		// xref https://discord.com/channels/554377975714414605/1475900330205122583
		const nEffects = Object.values(craft.Effects ?? {}).reduce((sum, effectValue) => effectValue ? sum + 1 : sum, 0);
		const label = ElementCreate({
			tag: "span",
			children: [InterfaceTextGet("DialogMenuCrafting") + ":"],
		});
		const list = ElementCreate({
			tag: "ul",
			classList: ["button-tooltip-craft"],
			children: [
				nEffects > 0 ? {
					tag: "li",
					children: [
						InterfaceTextGet("CraftingProperty").replace("CraftProperty", ""),
						{
							tag: "ul",
							children: Object.entries(craft.Effects).map(([propertyKey, propertyValue]) => {
								return {
									tag: "li",
									children: [
										{
											tag: "dfn",
											children: [propertyKey],
										},
										propertyValue > 1 ? ` ×${propertyValue} - ` : " - ",
									],
								};
							}),
						},
					],
				} : undefined,
				(craft.MemberName && craft.MemberNumber) ? {
					tag: "li",
					children: [
						InterfaceTextGet("CraftingMember").replace("MemberName (MemberNumber)", ""),
						{ tag: "q", children: [`${craft.MemberName} (${craft.MemberNumber})`] },
					],
				} : undefined,
				{
					tag: "li",
					children: [
						InterfaceTextGet("CraftingPrivate").replace("CraftPrivate", ""),
						{ tag: "q", children: [CommonCapitalize(craft.Private.toString())] },
					],
				},
				craft.Description ? {
					tag: "li",
					children: [
						InterfaceTextGet("CraftingDescription").replace("CraftDescription", ""),
						{ tag: "q", children: CraftingDescription.DecodeToHTML(craft.Description) },
					],
				} : undefined,
			],
		});

		CommonPromiseCatch(
			TextPrefetchFile("Screens/Room/Crafting/Text_Crafting.csv").loadedPromise.then((textCache) => {
				const dfn = list.querySelectorAll("dfn");
				for (const d of dfn) {
					d.parentElement?.append(textCache.get(`Description${d.textContent}`));
				}
			})
		);
		return [label, list];
	},

	/**
	 * Create a button for an activity, including image, label and icons.
	 * @param {string | null} idPrefix - The ID of the to-be created search button
	 * @param {ItemActivity} activity - The activity for which to create a button
	 * @param {Character} C - The target character of the activity
	 * @param {(this: HTMLButtonElement, ev: PointerEvent) => any} onClick - The click event listener to-be attached to the tooltip
	 * @param {null | ElementButton.Options} [options] - High level options for the to-be created button
	 * @param {null | Partial<Record<"button" | "tooltip" | "img" | "label", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional low-level {@link ElementCreate} options to-be applied to the either the button or tooltip
	 * @returns {HTMLButtonElement} - The created button
	 */
	CreateForActivity: function CreateForActivity(idPrefix, activity, C, onClick, options=null, htmlOptions=null) {
		const id = idPrefix == null ? ElementGenerateID() : `${idPrefix}-${activity.Activity.Name}`;
		const elem = /** @type {HTMLButtonElement | null} */(document.getElementById(id));
		if (elem) {
			console.error(`Element "${id}" already exists`);
			return elem;
		}
		const group = AssetGroupGet(C.AssetFamily, activity.Group);
		if (!group) {
			throw new Error(`ElementButton.CreateForActivity: Unknown group ${activity.Group}`);
		}

		htmlOptions ??= {};
		htmlOptions.button ??= {};
		htmlOptions.button.attributes ??= {};
		htmlOptions.button.attributes.name ??= activity.Activity.Name;
		htmlOptions.button.dataAttributes ??= {};
		htmlOptions.button.dataAttributes.group ??= activity.Group;
		htmlOptions.tooltip ??= {};
		htmlOptions.tooltip.classList ??= [];
		htmlOptions.tooltip.classList = [
			...htmlOptions.tooltip.classList,
			"button-tooltip-justify",
		];

		options ??= {};
		options.label ??= ActivityDictionaryText(ActivityBuildChatTag(C, group, activity.Activity, true));
		options.image ??= (activity.Item ? `./${AssetGetPreviewPath(activity.Item.Asset)}/${activity.Item.Asset.Name}.png` : `./Icons/Activity/${activity.Activity.Name}.png`);
		options.icons = [
			...(options.icons ?? []),
			activity.Blocked === "blocked" ? "Blocked" : undefined,
			activity.Blocked === "limited" ? "AllowedLimited" : undefined,
			activity.Item ? "Handheld" : undefined,
		];
		options.tooltipPosition ??= "bottom";
		options.tooltip ??= options.icons.length ? [""] : undefined;
		return ElementButton.Create(id, onClick, options, htmlOptions);
	},

	/**
	 * Reload the icons of the passed {@link ElementButton.CreateForAsset} button based on the items & characters current state.
	 * @param {HTMLButtonElement} button - The button in question
	 * @param {Asset | Item} asset - The asset (or item) for linked to the button
	 * @param {null | Character} C - The character wearing the asset/item (if any)
	 * @returns {boolean} - Whether the icons were updated or not
	 */
	ReloadAssetIcons: function ReloadAssetIcons(button, asset, C) {
		const item = "Asset" in asset ? asset : AppearanceItem.fromAsset(asset);
		asset = item.Asset;

		const icons = Array.from(button.querySelectorAll(".button-icon"));
		const iconNamesOld = icons.map(el => el.getAttribute("data-name"));
		/** @type {(InventoryIcon | null | undefined)[]} */
		const iconNamesNew = [
			DialogGetFavoriteStateDetails(C ?? Player, asset)?.Icon,
			InventoryBlockedOrLimited(C ?? Player, item) ? "Blocked" : null,
			InventoryIsAllowedLimited(C ?? Player, item) ? "AllowedLimited" : null,
			...DialogGetLockIcon(item, "Property" in item),
			...DialogGetAssetIcons(asset),
			...DialogEffectIcons.GetIcons(item),
		];

		const iconNamesAdded = iconNamesNew.filter(i => i != null && !iconNamesOld.includes(i));
		const iconNamesRemoved = iconNamesOld.filter(i => !/** @type {string[]} */(iconNamesNew).includes(i ?? ""));
		if (iconNamesAdded.length === 0 && iconNamesRemoved.length === 0) {
			return false;
		}

		for (const icon of icons) {
			if (!icon.hasAttribute("data-custom")) {
				ElementUnpackIDs.fromAttribute(icon, "aria-owns").forEach(el => el.remove());
				icon.remove();
			}
		}

		const { iconGrid, tooltip } = ElementButton._ParseIcons(button.id, iconNamesAdded) ?? { tooltip: [] };
		if (iconGrid && !button.contains(iconGrid)) {
			button.append(iconGrid);
		}
		if (tooltip[1] && !button.contains(tooltip[1])) {
			button.querySelector(".button-tooltip")?.append(...tooltip);
		}
		return true;
	},

	/**
	 * Set the src of the button's image (`.button-image`).
	 *
	 * Supports both `<img>`- and `<div role="img">`-style button images.
	 * @param {ElementHelp.ElementOrId} button The button in question  (`.button`) or its image  (`.button-image`). May be specified either as an element or its ID.
	 * @param {string} src The new image source
	 * @returns {null | HTMLElement} The updated `.button-image` element or null if it cannot be found
	 */
	SetImage: function SetImage(button, src) {
		const element = ElementWrap(button);
		const img = element?.matches(".button-image") ? element : element?.querySelector(".button-image");
		if (img instanceof HTMLImageElement) {
			img.src = src;
			return img;
		} else if (img instanceof HTMLElement) {
			const imgURL = (src.startsWith("data:image") || src.startsWith("http")) ? `url("${src}")` : `url("./${src}")`;
			img.style.setProperty("background-image", imgURL);
			img.style.setProperty("mask-image", imgURL);
			return img;
		} else {
			return null;
		}
	},

	/**
	 * Get the src of the button's image (`.button-image`).
	 *
	 * Supports both `<img>`- and `<div role="img">`-style button images.
	 * @param {ElementHelp.ElementOrId} button The button in question  (`.button`) or its image  (`.button-image`). May be specified either as an element or its ID.
	 * @returns {null | string} The src of the `.button-image` represented in a {@link HTMLImageElement.src}-compatible format or null if it cannot be found/is empty.
	 */
	GetImage: function GetImage(button) {
		const element = ElementWrap(button);
		const img = element?.matches(".button-image") ? element : element?.querySelector(".button-image");
		if (img instanceof HTMLImageElement) {
			return img.src || null;
		} else if (img instanceof HTMLElement) {
			const imgURL = img.style.getPropertyValue("background-image");
			const srcMatch = imgURL.match(/url\((\.\/)?(['"]+)?(\S+)(['"]+)?\)/);
			return srcMatch?.[3] ?? null;
		} else {
			return null;
		}
	},
};

/**
 * Namespace for constructing menu bars
 * @namespace
 */
var ElementMenu = {
	/**
	 * @private
	 * @type {WeakMap<Element, MutationObserver>}
	 */
	_observers: new WeakMap,

	/**
	 * @private
	 * @satisfies {MutationCallback}
	 * @param {readonly { addedNodes: (readonly Node[]) | NodeList, target: Node }[]} mutationList
	 */
	_osbserverCallback: function _osbserverCallback(mutationList) {
		const roles = [
			"menuitem",
			"menuitemradio",
			"menuitemcheckbox",
		];
		const roleSelector = roles.map(i => `[role='${i}']:not([hidden])`).join(",");

		/** @type {(el: Node) => el is HTMLElement} */
		const nodeFilter = (el) => el instanceof HTMLButtonElement || (el instanceof HTMLElement && roles.includes(el.getAttribute("role") ?? ""));

		for (const mutation of mutationList) {
			const nodes = Array.from(mutation.addedNodes).filter(nodeFilter);
			if (!nodes.length) {
				continue;
			}

			for (const menuitem of nodes) {
				let role = menuitem.getAttribute("role") ?? "";
				if (menuitem instanceof HTMLButtonElement) {
					if (menuitem.disabled) {
						menuitem.disabled = false;
						menuitem.setAttribute("aria-disabled", "true");
					}
					if (!role) {
						role = "menuitem";
						menuitem.setAttribute("role", role);
					}
				}
				if (roles.includes(role)) {
					menuitem.addEventListener("keydown", ElementMenu._KeyDown);
					menuitem.setAttribute("tabindex", "-1");
				}
			}

			// Check whether only the first element still has a tabindex of 0
			if (mutation.target instanceof Element) {
				const menuitems = Array.from(mutation.target.querySelectorAll(roleSelector));
				if (!menuitems.length) {
					continue;
				} else if (menuitems[0].getAttribute("tabindex") !== "0") {
					menuitems.find(el => el.getAttribute("tabindex") === "0")?.setAttribute("tabindex", "-1");
					menuitems[0]?.setAttribute("tabindex", "0");
				}
			}
		}
	},

	/**
	 * KeyDown event listener that implements menubar-style keyboard navigation
	 * @this {HTMLElement}
	 * @param {KeyboardEvent} ev
	 */
	_KeyDown: function _KeyDown(ev) {
		if (ev.altKey || ev.metaKey || ev.ctrlKey) {
			return;
		}

		const parent = this.closest("[role='menu'], [role='menubar']");
		if (!parent) {
			return;
		}

		// Find the outer-most menu in case we're dealing with nested menus
		let grandParent = parent;
		/** @type {null | Element} */
		let grandParentCandidate = grandParent.closest("[role='menubar'], [role='menu']");
		while (grandParentCandidate && grandParentCandidate !== grandParent) {
			grandParent = grandParentCandidate;
			grandParentCandidate = grandParent.closest("[role='menubar'], [role='menu']");
		}

		let key = ev.key;
		if (parent.getAttribute("data-direction") === "rtl") {
			// Flip all the keys of the direction of the menu grid is right-to-left
			switch (key) {
				case "ArrowRight":
					key = "ArrowLeft";
					break;
				case "ArrowLeft":
					key = "ArrowRight";
					break;
				case "Home":
					key = "End";
					break;
				case "End":
					key = "Home";
					break;
			}
		}

		if (parent.getAttribute("aria-orientation") === "vertical") {
			switch (key) {
				case "ArrowRight":
					key = "ArrowDown";
					break;
				case "ArrowLeft":
					key = "ArrowUp";
					break;
				case "ArrowDown":
					key = "ArrowRight";
					break;
				case "ArrowUp":
					key = "ArrowLeft";
					break;
			}
		}

		let isTab = false;
		if (key === "Tab") {
			key = ev.shiftKey ? "ArrowLeft" : "ArrowRight";
			isTab = true;
		} else if (ev.shiftKey) {
			return;
		}

		// Selector for all non-hidden menu items
		const selector = "[role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox']";
		switch (key) {
			case "ArrowRight":
			case "ArrowLeft": {
				const elements = /** @type {HTMLElement[]} */(Array.from(grandParent.querySelectorAll(selector)).filter(e => ElementCheckVisibility(e)));
				const idx = elements.indexOf(this);
				if (idx === -1) {
					return;
				}

				const increment = key === "ArrowRight" ? 1 : -1;
				const elem = elements[idx + increment];
				if (!elem && isTab) {
					// We've reached the end/start of the menu:
					// abort and let the tab-based keydown event propogate towards whatever next focusable element lays outside of the grid
					return;
				}
				elem?.focus();
				ev.preventDefault();
				ev.stopPropagation();
				break;
			}
			case "Home":
			case "End": {
				const elements = /** @type {HTMLElement[]} */(Array.from(grandParent.querySelectorAll(selector)).filter(e => ElementCheckVisibility(e)));
				const idx = key === "Home" ? 0 : elements.length - 1;
				elements[idx]?.focus();
				ev.stopPropagation();
				break;
			}
			case "ArrowUp":
			case "ArrowDown": {
				if (this.getAttribute("aria-haspopup") !== "true" && this.getAttribute("aria-haspopup") !== "menu") {
					return;
				}

				// We're assuming (well, mandating really...) that click actions a sub menu
				this.click();
				const elements = /** @type {HTMLElement[]} */(Array.from(this.querySelectorAll(selector)).filter(e => ElementCheckVisibility(e)));
				const idx = key === "ArrowUp" ? elements.length - 1 : 0;
				elements[idx]?.focus();
				ev.stopPropagation();
				break;
			}
		}
	},

	/**
	 * Construct a menubar of button elements
	 * @example
	 * <div id={id} role="menubar">
	 *     <button role="menuitem" />
	 *     <input role="menuitem" type="text" />
	 *     <button role="menuitem" aria-haspopup="menu">
	 *         <div style={ display: "none" }>
	 *             <button role="menuitem" />
	 *             <button role="menuitem" />
	 *             ...
	 *         </div>
	 *     </button>
	 *     ...
	 * </div>
	 * @param {string | null} id - The menu's ID
	 * @param {readonly (string | Node | HTMLOptionsUnion)[]} menuItems - The menu's content.
	 * Any `<button>` element without a role (regardless of nesting) will be assigned the `menuitem` role and thus be elligble for menu-style navigation.
	 * Buttons that open a sub-menu _must_ have the `aria-haspopup: "menu"` attribute set and must be able to do so via a click action.
	 * @param {object} [options]
	 * @param {"ltr" | "rtl"} [options.direction] - The direction of the menu. Should match the value of the CSS `direction` property if provided
	 * @param {"menubar" | "menu"} [options.role] - The role of the menu/menubar
	 * @param {null | Partial<Record<"menu", Omit<HTMLOptions<any>, "tag">>>} [htmlOptions] - Additional {@link ElementCreate} options to-be applied to the respective (child) element
	 * @returns {HTMLDivElement} - The menu
	 */
	Create: function Create(id, menuItems, options=undefined, htmlOptions=undefined) {
		id ??= ElementGenerateID();
		let elem = /** @type {HTMLDivElement | null} */(document.getElementById(id));
		if (elem) {
			console.error(`Element "${id}" already exists`);
			return elem;
		}

		options ??= {};
		const direction = options.direction ?? "ltr";

		htmlOptions ??= {};
		const menuOptions = htmlOptions.menu ?? {};
		const children = ElementParseChildren([
			...menuItems,
			...(menuOptions.children ?? [])
		]).map(el => typeof el === "string" ? document.createTextNode(el) : el);
		elem = ElementCreate({
			...menuOptions,
			tag: "div",
			attributes: {
				id,
				role: options.role ?? "menubar",
				"screen-generated": CurrentScreen,
				...(menuOptions.attributes ?? {}),
			},
			parent: menuOptions.parent ?? document.body,
			dataAttributes: { direction, ...(menuOptions.dataAttributes ?? {}) },
			classList: ["menubar", "HideOnPopup", ...(menuOptions.classList ?? [])],
			children,
		});

		// Manually run the observer callback so that the menubar-specific attributes are set in a synchronous manner
		ElementMenu._osbserverCallback([{ addedNodes: children, target: elem }]);

		// Attach an observer in order to handle all the menubar-specific attribute juggling
		const observer = new MutationObserver(ElementMenu._osbserverCallback);
		ElementMenu._observers.set(elem, observer);
		observer.observe(elem, { childList: true, subtree: true });
		return elem;
	},

	/**
	 * Append a menuitem to the passed menubar
	 * @param {HTMLElement} menu - The menubar
	 * @param {readonly HTMLElement[]} menuitems - The to-be prepended menuitem
	 * @deprecated - Fully equivalent to {@link HTMLElement.append}
	 */
	AppendButton: function AppendButton(menu, ...menuitems) {
		if (!menu || !menuitems) {
			return;
		}
		menu.append(...menuitems);
	},

	/**
	 * Prepend a menuitem to the passed menubar
	 * @param {HTMLElement} menu - The menubar
	 * @param {readonly HTMLElement[]} menuitems - The to-be prepended menuitem
	 * @deprecated - Fully equivalent to {@link HTMLElement.prepend}
	 */
	PrependItem: function PrependButton(menu, ...menuitems) {
		if (!menu || !menuitems) {
			return;
		}
		menu.prepend(...menuitems);
	},
};

/**
 * Namespace for creating DOM checkboxes.
 */
var ElementCheckbox = {
	/**
	 * @private
	 * @type {(this: HTMLInputElement, ev: Event) => void}
	 */
	_change: function(ev) {
		if (!this.matches(":focus-visible")) {
			this.blur();
		}
		if (!this.validity.valid) {
			ev.stopImmediatePropagation();
		}
	},

	/**
	 * Construct and return a DOM checkbox element (`<input type="checkbox">`)
	 * @param {null | string} [id] - The ID of the element, or `null` if one must be assigned automatically
	 * @param {null | ((this: HTMLInputElement, ev: Event) => any)} [onChange] - The change event listener to-be fired upon checkbox clicks
	 * @param {null | ElementCheckbox.Options} [options] - High level options for the to-be created checkbox
	 * @param {null | Partial<Record<"checkbox", Omit<HTMLOptions<any>, "tag">>>} [htmlOptions] - Additional {@link ElementCreate} options to-be applied to the respective (child) element
	 * @returns {HTMLInputElement}
	 */
	Create: function Create(id=undefined, onChange=undefined, options=undefined, htmlOptions=undefined) {
		id ??= ElementGenerateID();
		const checkbox = document.getElementById(id);
		if (checkbox) {
			console.error(`Element "${id}" already exists`);
			return /** @type {HTMLInputElement} */(checkbox);
		}

		options ??= {};
		const checkboxOptions = htmlOptions?.checkbox ?? {};
		switch (checkboxOptions.attributes?.type ?? options.type ?? "checkbox") {
			case "radio":
				options.required ??= true;
				break;
		}

		const ret = ElementCreate({
			...checkboxOptions,
			tag: "input",
			attributes: {
				id,
				type: options.type ?? "checkbox",
				disabled: options.disabled,
				checked: options.checked,
				value: options.value,
				name: options.name,
				required: options.required,
				...(checkboxOptions.attributes ?? {}),
			},
			classList: ["checkbox", ...(checkboxOptions.classList ?? [])],
			eventListeners: {
				change: ElementCheckbox._change,
				...(checkboxOptions.eventListeners ?? {}),
			},
		});
		if (onChange) {
			ret.addEventListener("change", onChange);
		}
		return ret;
	},

	/**
	 * Construct and return a DOM pair of checkbox and label elements
	 * @example
	 * <label class="checkbox-pair">
	 *   <input type="checkbox" id="checkbox" class="checkbox">
	 *   <span id="checkbox-label" for="checkbox">Label</label>
	 * </div>
	 * @param {null | string} id - The ID of the element, or `null` if one must be assigned automatically
	 * @param {string | Node | HTMLOptionsUnion} label - The label of the checkbox
	 * @param {null | ((this: HTMLInputElement, ev: Event) => any)} onChange - The change event listener to-be fired upon checkbox clicks
	 * @param {null | ElementCheckbox.LabelOptions} options - High level options for the to-be created checkbox
	 * @param {null | Partial<Record<"checkbox" | "label" | "container", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional {@link ElementCreate} options to-be applied to the respective (child) element
	 * @returns {HTMLLabelElement}
	 */
	CreateLabelled: function CreateLabelled(id=null, label, onChange=null, options=null, htmlOptions=null) {
		id ??= ElementGenerateID();
		const checkbox = document.getElementById(id);
		if (checkbox) {
			console.error(`Element "${id}" already exists`);
			return /** @type {HTMLLabelElement} */(checkbox);
		}

		options ??= {};
		const labelOptions = htmlOptions?.label ?? {};
		const containerOptions = htmlOptions?.container ?? {};
		const orientation = options.orientation ?? "horizontal";

		return ElementCreate({
			...containerOptions,
			tag: "label",
			classList: ["checkbox-pair", `checkbox-pair-${orientation}`, ...(containerOptions.classList ?? [])],
			attributes: { id: `checkbox-pair-${id}`, ...(containerOptions.attributes ?? {}) },
			children: [
				this.Create(id, onChange, options, htmlOptions),
				{
					...labelOptions,
					tag: "span",
					attributes: {
						id: `${id}-label`,
						...labelOptions.attributes
					},
					classList: ["checkbox-label", ...(labelOptions.classList ?? [])],
					children: [label, ...(labelOptions.children ?? [])],
				},
				...(containerOptions.children ?? []),
			],
		});
	}
};

/**
 * Namespace for creating text-based elements
 */
var ElementText = {
	/**
	 * Creates a paragraph node, optionally describing another element
	 * @param {string} contents
	 * @param {{ describes?: string | HTMLElement } | undefined} opts
	 * @returns {HTMLParagraphElement}
	 */
	CreateNote: function CreateNote(contents, opts = undefined) {
		let id;
		if (opts?.describes) {
			const target = ElementWrap(opts.describes);
			if (!target) {
				console.error("Unable to locate element", opts.describes);
			} else {
				id = ElementGenerateID();
				const attrVals = (target.getAttribute("aria-describedby") ?? "").split(" ");
				attrVals.push(id);
				target.setAttribute("aria-describedby", attrVals.join(" "));
			}
		}
		const element = ElementCreate({
			tag: "p",
			classList: ["element-note"],
			attributes: { id },
			children: [
				contents,
			],
		});
		return element;
	},

	/**
	 * Creates a hint button with a tooltip
	 * @param {string | null} id
	 * @param {string} tooltip
	 * @param {"left" | "right" | "top" | "bottom"} [tooltipPosition]
	 * @returns {HTMLButtonElement}
	 */
	CreateHint: function CreateHint(id, tooltip, tooltipPosition) {
		return ElementButton.Create(id, null, {
			image: "Icons/Question.png",
			noStyling: true,
			tooltipPosition,
			tooltip,
			tooltipRole: "description",
		}, {
			button: { classList: ["hint-button"] },
		});
	},
};

/**
 * Returns the element's document- or shadow-root.
 *
 * If an element is not part of the DOM tree, thus lacking a document- or shadow-root, then {@link document} is returned.
 * @param {Node} elem
 * @returns {Document | ShadowRoot}
 */
function ElementGetRoot(elem) {
	const root = elem.getRootNode();
	return (root instanceof Document || root instanceof ShadowRoot) ? root : document;
}

/**
 * Return whether an element is visible or not.
 *
 * Approximate polyfill of [`Element.checkVisibility()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility),
 * as its browser support is still somewhat limited (~88% at the time of writing).
 * @param {Element} el - The element in question
 * @param {CheckVisibilityOptions} [options] - Additional options to-be passed to `Element.checkVisibility()`
 * @returns {boolean} - Whether the passed element is visible or not
 */
function ElementCheckVisibility(el, options) {
	if (!el) {
		return false;
	}

	if (typeof el.checkVisibility === "function") {
		options ??= {};
		return el.checkVisibility({ ...options, checkVisibilityCSS: options.checkVisibilityCSS ?? true });
	} else {
		return (el instanceof HTMLElement && el.style.display !== "none") && getComputedStyle(el).display !== "none";
	}
}

/**
 * Get an element by its ID or DOM element reference, returning null if it does not exist.
 * @param {ElementHelp.ElementOrId | null} elementOrId
 * @returns {HTMLElement | null}
 */
function ElementWrap(elementOrId) {
	if (elementOrId instanceof HTMLElement) return elementOrId;
	if (typeof elementOrId === 'string') return document.getElementById(elementOrId);
	return null;
}

/**
 * Scales a given height value relative to the current canvas height.
 * @param {number} height
 * @returns {number}
 */
function ElementCanvasScaledHeight(height) {
	return height * (MainCanvas.canvas.clientHeight / MainCanvasHeight);
}

/**
 * Scales a given width value relative to the current canvas width.
 * @param {number} width
 * @returns {number}
 */
function ElementCanvasScaledWidth(width) {
	return width * (MainCanvas.canvas.clientWidth / MainCanvasWidth);
}

/**
 * Calculates the Y position on the canvas in pixels, accounting for anchor alignment.
 * @param {number} yPos
 * @param {ElementHelp.AnchorY} anchorPosition
 * @returns {number}
 */
function ElementCanvasScaledY(yPos, anchorPosition = 'top') {
	const scaleY = MainCanvas.canvas.clientHeight / MainCanvasHeight;
	return anchorPosition === 'top'
		? MainCanvas.canvas.offsetTop + yPos * scaleY
		: MainCanvas.canvas.offsetTop + MainCanvas.canvas.clientHeight - yPos * scaleY;
}

/**
 * Calculates the X position on the canvas in pixels, accounting for anchor alignment.
 * @param {number} xPos
 * @param {ElementHelp.AnchorX} anchorPosition
 * @returns {number}
 */
function ElementCanvasScaledX(xPos, anchorPosition = 'left') {
	const scaleX = MainCanvas.canvas.clientWidth / MainCanvasWidth;
	return anchorPosition === 'left'
		? MainCanvas.canvas.offsetLeft + xPos * scaleX
		: MainCanvas.canvas.offsetLeft + MainCanvas.canvas.clientWidth - xPos * scaleX;
}

/**
 * Positions an HTML element on the canvas relative to a specified anchor.
 * @param {ElementHelp.ElementOrId} elementOrId
 * @param {number} xPos
 * @param {number} yPos
 * @param {ElementHelp.AnchorXY} [anchorPosition]
 */
function ElementSetPosition(elementOrId, xPos = 0, yPos = 0, anchorPosition = 'top-left') {
	const element = ElementWrap(elementOrId);

	if (!element) {
		console.error("A call to ElementSetPosition was made on non-existent element with ID", elementOrId);
		return;
	}

	const yAnchor = anchorPosition === 'top-left' || anchorPosition === 'top-right' ? 'top' : 'bottom';
	const xAnchor = anchorPosition === 'top-left' || anchorPosition === 'bottom-left' ? 'left' : 'right';

	const y = ElementCanvasScaledY(yPos, yAnchor);
	const x = ElementCanvasScaledX(xPos, xAnchor);

	CommonAssign(element.style, {
		position: 'fixed',
		[xAnchor]: x + 'px',
		[yAnchor]: y + 'px',
	});
}

/**
 * Sets the width and/or height of an element relative to the canvas scale.
 * @param {ElementHelp.ElementOrId} elementOrId
 * @param {number | null} width
 * @param {number | null} height
 */
function ElementSetSize(elementOrId, width = null, height = null) {
	const element = ElementWrap(elementOrId);

	if (!element) {
		console.error("A call to ElementSetSize was made on non-existent element with ID", elementOrId);
		return;
	}

	if (width !== null) {
		element.style.width = `${ElementCanvasScaledWidth(width)}px`;
	} else {
		element.style.removeProperty("width");
	}

	if (height !== null) {
		element.style.height = `${ElementCanvasScaledHeight(height)}px`;
	} else {
		element.style.removeProperty("height");
	}
}

/**
 * Sets the font size of an element scaled relative to the smaller canvas dimension.
 * @param {ElementHelp.ElementOrId} elementOrId
 * @param {number | 'auto'} targetFontSize
 */
function ElementSetFontSize(elementOrId, targetFontSize = 'auto') {
	const element = ElementWrap(elementOrId);

	if (!element) {
		console.error("A call to ElementSetFontSize was made on non-existent element with ID", elementOrId);
		return;
	}

	const canvasWidth = MainCanvas.canvas.clientWidth;
	const canvasHeight = MainCanvas.canvas.clientHeight;

	const scaleFactor = Math.min(canvasWidth, canvasHeight) / 1000;

	const autoFontSize = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;

	const fontSize = targetFontSize === 'auto' ? autoFontSize : targetFontSize * scaleFactor;

	CommonAssign(element.style, {
		fontSize: fontSize + 'px',
		fontFamily: CommonGetFontName()
	});
}

/** A namespace for adding touch-based swiping behavior to elements */
var ElementSwipe = {
	/**
	 * @param {HTMLElement} elem
	 * @param {null | ElementSwipe.Options} options
	 */
	setListeners(elem, options=null) {
		options ??= {};

		/**
		 * Coordinates of the initial touch event
		 * @type {null | { oldX: number, oldY: number }}
		 */
		let coords = null;
		/** @type {null | number} */
		let minDistance = null;

		/** @type {(this: HTMLElement, ev: TouchEvent) => void} */
		function touchstart(ev) {
			if (this.hasAttribute("disabled") || this.getAttribute("aria-disabled") === "true" || ev.touches.length !== 1) {
				return;
			}
			const touch = ev.touches[0];
			coords = { oldX: touch.screenX, oldY: touch.screenY };
			minDistance = options?.minSwipeDistance ?? globalThis.innerWidth / 40;

			document.addEventListener("touchend", touchend);
			document.addEventListener("touchcancel", touchend);
			document.addEventListener("touchmove", touchmove);
		}

		/** @type {(this: Document, ev: TouchEvent) => void} */
		function touchend() {
			coords = null;
			minDistance = null;
		}

		/** @type {(this: Document, ev: TouchEvent) => void} */
		function touchmove(ev) {
			const touch = ev.touches[0];
			if (!touch || !coords || minDistance == null) {
				return;
			}

			const { oldX, oldY } = coords;
			const { newX, newY } = { newX: touch.screenX, newY: touch.screenY };
			const distance = Math.hypot(newY - oldY, newX - oldX);

			const translationStages = [0, 20, 40, 60, 80, 100];
			let directionOk = false;
			/** @type {string[]} */
			let transform;
			switch (options?.direction) {
				case "up":
					directionOk = newY < oldY;
					transform = translationStages.map(i => `translate(0, ${-i}%)`);
					break;
				case "down":
					directionOk = newY > oldY;
					transform = translationStages.map(i => `translate(0, ${i}%)`);
					break;
				case "left":
					directionOk = newX < oldX;
					transform = translationStages.map(i => `translate(${-i}%, 0)`);
					break;
				case "right":
				default:
					directionOk = newX > oldX;
					transform = translationStages.map(i => `translate(${i}%, 0)`);
					break;
			}

			if (distance >= minDistance && directionOk) {
				const onFinish = () => {
					if (options?.onClose) {
						options.onClose(elem, ev);
					} else {
						elem.dispatchEvent(new PointerEvent("click", ev));
					}
				};

				this.dispatchEvent(new TouchEvent("touchcancel"));
				if (options?.animation) {
					options.animation.addEventListener("finish", onFinish);
					options.animation.play();
				} else {
					elem.animate(
						{ transform, opacity: [1, 1, 1, 1, 1, 0] },
						{ duration: 250 },
					).addEventListener("finish", onFinish);
				}
			}
		}

		elem.addEventListener("touchstart", touchstart);
	},
};

/**
 * Namespace with helper functions for creating DOM-based screens
 * @namespace
 */
var ElementDOMScreen = {
	/**
	 * Construct and return a template for a basic DOM screen.
	 *
	 * Important points:
	 * - Screen dimensions of `[x, 0, y, 1000]` are generally recommended
	 * - The standard child elements of the to-be returned screen _may_ freely be moved around in the DOM tree as one sees fit
	 * - The standard child elements of the to-be returned screen _should_ not be removed; do so at your own risk. They _may_ remain unused however.
	 * @example
	 * <div id="my-fancy-id" class="screen">
	 *     <!--
	 *         The first row: a banner containing a menubar,
	 *         the latter of which _should_ contain an exit button as its first entry
	 *     -->
	 *     <header class="screen-header">
	 *         <div role="menubar" />
	 *     </header>
	 *
	 *     <!--
	 *         The second row: the screen's main heading/label/description
	 *         and a dedicated field for anyand all temporary status messages (see `ElementDOMScreen.SetStatus()`)
	 *     -->
	 *     <hgroup class="screen-hgroup">
	 *         <h1 />
	 *         <p role="status" />
	 *     </hgroup>
	 *
	 *     <div class="screen-main-container">
	 *         <aside class="screen-aside-l" />
	 *         <!--
	 *             The third and final row: a scrollable section with the main content of the screen.
	 *             As a rule of thumb, it is recommended to embed the immediate child elements into some sort of
	 *             grouping element like `<fieldset>`, `<section>` and/or `<article>`.
	 *         -->
	 *         <main class="screen-main" />
	 *         <aside class="screen-aside-r" />
	 *     </div>
	 * </div>
	 * @param {string} id - The ID of the screen
	 * @param {null | ElementDOMScreen.TemplateOptions} options - Further customization options
	 * @returns {HTMLDivElement} - The newly created DOM screen
	 */
	getTemplate(id, options=null) {
		options ??= {};
		const header = CommonIsArray(options.header) ? options.header : [options.header];
		const hgroup = ElementCreate({
			tag: "hgroup",
			classList: ["scroll-box", "screen-hgroup"],
			attributes: { id: `${id}-hgroup` },
			children: [
				{ tag: "h1", attributes: { id: `${id}-h1` }, children: header },
				{ tag: "p", attributes: { id: `${id}-status`, role: "status" } },
			],
		});
		const mainSection = options.mainSection ?? "center";

		const children = [
			ElementCreate({
				tag: "header",
				classList: ["screen-header"],
				attributes: { "aria-owns": options.hgroupInHeader ? undefined : `${id}-hgroup`, id: `${id}-header` },
				children: [
					ElementMenu.Create(`${id}-menu`, options.menubarButtons ?? [], { direction: "rtl" }),
					options.hgroupInHeader ? hgroup : null,
				],
			}),
			options.hgroupInHeader ? null : hgroup,
			ElementCreate({
				tag: "div",
				classList: ["screen-main-container"],
				children: [
					ElementCreate({
						tag: mainSection === "left" ? "main" : "aside",
						classList: ["screen-aside-l", mainSection === "left" ? "scroll-box" : null],
						attributes: { id: `${id}-aside-l` },
						children: options.leftContent,
					}),
					ElementCreate({
						tag: mainSection === "center" ? "main" : "aside",
						classList: ["screen-main", mainSection === "center" ? "scroll-box" : null],
						attributes: { id: `${id}-main` },
						children: options.mainContent,
					}),
					ElementCreate({
						tag: mainSection === "right" ? "main" : "aside",
						classList: ["screen-aside-r", mainSection === "right" ? "scroll-box" : null],
						attributes: { id: `${id}-aside-r` },
						children: options.rightContent,
					}),
				],
			}),
		];

		if (options.asShadow) {
			const cssFiles = new Set([
				"CSS/normalize.css",
				"CSS/Styles.css",
				"CSS/screen.css",
				"CSS/button.css",
				"CSS/fonts.css",
				...(options.cssFiles ?? []),
			]);
			const root = ElementCreate({
				tag: "div",
				attributes: { id, "screen-generated": CurrentScreen },
				parent: options.parent,
				classList: ["HideOnPopup"],
			});
			const shadowRoot = root.attachShadow({ mode: "open", delegatesFocus: true });
			shadowRoot.append(
				ElementCreate({
					tag: "div",
					classList: ["screen"],
					children: [
						...Array.from(cssFiles).map(href => ElementCreate({ tag: "link", attributes: { href, rel: "stylesheet" } })),
						...children,
					],
				}),
			);
			return root;
		} else {
			return ElementCreate({
				tag: "div",
				attributes: { id, "screen-generated": CurrentScreen },
				parent: options.parent,
				classList: ["HideOnPopup", "screen", options.hgroupInHeader ? "screen-hgroup-in-header" : null],
				children,
			});
		}
	},

	/**
	 * A weakmap mapping `[role='status']` elements to their respective {@link setTimeout} IDs.
	 * See {@link ElementDOMScreen.SetStatus}
	 * @private
	 * @type {WeakMap<Element, number>}
	 */
	_statusIDMap: new WeakMap,

	/**
	 * Timer handler for {@link ElementDOMScreen.SetStatus}
	 * @private
	 * @satisfies {TimerHandler}
	 * @param {Element} headingElem The screen's `h1` element
	 * @param {Element} statusElem The screen's `[role='status']` element
	 */
	_setStatusTimerHandler(headingElem, statusElem) {
		headingElem.toggleAttribute("hidden", false);
		statusElem.replaceChildren();
		ElementDOMScreen._statusIDMap.delete(statusElem);
	},

	/**
	 * Set a temporary status message for the screen.
	 * @param {ElementHelp.ElementOrId} root The screen on which the status is the be set; it _must_ contain a single `h1` and `[role='status']` element
	 * @param {string | Element | readonly (string | Element)[]} status The to-be displayed status message
	 * @param {number} timeout How long the status message should be shown in ms; defaults to 5000 ms
	 */
	setStatus(root, status, timeout=5000) {
		const elem = ElementWrap(root)?.closest(".screen");
		if (!elem || !Number.isFinite(timeout)) {
			return;
		}

		const statusElem = elem.querySelector(`[role='status']`);
		const headingElem = elem.querySelector(`h1`);
		if (!statusElem || !headingElem) {
			return;
		}

		let timeoutID = ElementDOMScreen._statusIDMap.get(statusElem);
		if (timeoutID != null) {
			clearTimeout(timeoutID);
		}

		const statusArray = CommonIsArray(status) ? status : [status];
		headingElem.toggleAttribute("hidden", true);
		statusElem.replaceChildren(...statusArray);
		timeoutID = setTimeout(ElementDOMScreen._setStatusTimerHandler, timeout, headingElem, statusElem);
		ElementDOMScreen._statusIDMap.set(statusElem, timeoutID);
	},

	/**
	 * Clear the temporary status message of the passed screen.
	 * @param {ElementHelp.ElementOrId} root The screen on which the status is the be removed; it _must_ contain a single `h1` and `[role='status']` element
	 */
	clearStatus(root) {
		const elem = ElementWrap(root)?.closest(".screen");
		if (!elem) {
			return;
		}

		const statusElem = elem.querySelector(`[role='status']`);
		const headingElem = elem.querySelector(`h1`);
		if (!statusElem || !headingElem) {
			return;
		}

		const timeoutID = ElementDOMScreen._statusIDMap.get(statusElem);
		if (timeoutID != null) {
			clearTimeout(timeoutID);
			ElementDOMScreen._setStatusTimerHandler(headingElem, statusElem);
		}
	},

	/**
	 * Set the persistent heading of a screen.
	 * @param {ElementHelp.ElementOrId} root The screen on which the heading is the be set
	 * @param {string | Element | readonly (string | Element)[]} heading The to-be displayed heading content. Note that headings may only ever contain [flow content](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Content_categories#flow_content)
	 */
	setHeading(root, heading) {
		const elem = ElementWrap(root)?.closest(".screen");
		if (!elem) {
			return;
		}

		const headingArray = CommonIsArray(heading) ? heading : [heading];
		elem.querySelector(`h1`)?.replaceChildren(...headingArray);
	}
};

/**
 * Namespace for `<input type="text">`, `<input type="number">`, `<input type="password">`, and `<textarea>`.
 * @namespace
 */
var ElementInput = {
	/**
	 * DOM tag for each supported control.
	 * Textarea is the only non-input; extend {@link ElementInput.TagFor} when that changes.
	 * @private
	 * @type {Readonly<{ [T in ElementInput.KnownType]: ElementInput.TagFor<T> }>}
	 */
	_tags: Object.freeze({
		text: "input",
		number: "input",
		password: "input",
		textarea: "textarea",
	}),

	/**
	 * @overload
	 * @param {string | null} [id]
	 * @param {null | ElementInput.TextOptions | ElementInput.NumberOptions} [options]
	 * @param {null | Partial<Omit<HTMLOptions<"input">, "tag">>} [htmlOptions]
	 * @returns {HTMLInputElement}
	 */
	/**
	 * @overload
	 * @param {string | null} [id]
	 * @param {ElementInput.TextAreaOptions} options
	 * @param {null | Partial<Omit<HTMLOptions<"textarea">, "tag">>} [htmlOptions]
	 * @returns {HTMLTextAreaElement}
	 */
	/**
	 * @overload
	 * @param {string | null} [id]
	 * @param {ElementInput.SharedOptions} options
	 * @param {null | Partial<Omit<HTMLOptions<any>, "tag">>} [htmlOptions]
	 * @returns {HTMLInputElement | HTMLTextAreaElement}
	 */
	/**
	 * Create a text, number, password, or textarea control.
	 *
	 * The control is left detached unless a parent is passed. `htmlOptions.input` is applied on top of `options`:
	 * its attributes and event listeners replace the matching high-level values, including the number blur/wheel listeners.
	 * Password controls default `spellcheck` to `"false"`.
	 * @param {string | null} [id] - The control's id. Generated when nullish.
	 * @param {null | ElementInput.Options} [options] - High-level options for the to-be created control..
	 * @param {null | Partial<Omit<HTMLOptions<"input" | "textarea">, "tag">>} [htmlOptions] - Additional low-level {@link ElementCreate} options to-be applied to the control..
	 * @returns {HTMLInputElement | HTMLTextAreaElement}
	 */
	Create(id, options, htmlOptions) {
		id ??= ElementGenerateID();
		const existing = ElementWrap(id);
		if (existing) {
			console.error(`Element "${id}" already exists`);
			return /** @type {HTMLInputElement | HTMLTextAreaElement} */ (existing);
		}

		options ??= {};
		htmlOptions ??= {};
		const type = options.type ?? "text";
		/** @type {NonNullable<HTMLOptions<"input">["attributes"]>} */
		const attributes = {
			id,
			type,
			["screen-generated"]: CurrentScreen,
			...(htmlOptions.attributes ?? {}),
		};
		const classList = ["element-input", `element-input-${type}`, "HideOnPopup", ...(htmlOptions.classList ?? [])];

		if (type === "textarea") {
			return ElementCreate({
				...htmlOptions,
				tag: ElementInput._tags[type],
				attributes,
				classList,
				eventListeners: htmlOptions.eventListeners,
				children: [
					htmlOptions.attributes?.value == null ? null : String(htmlOptions.attributes?.value),
					...(htmlOptions.children ?? []),
				],
			});
		}

		/** @type {NonNullable<HTMLOptions<"input">["eventListeners"]>} */
		const eventListeners = { ...(htmlOptions.eventListeners ?? {}) };
		if (type === "number") {
			eventListeners.blur ??= ElementNumberInputBlur;
			eventListeners.wheel ??= ElementNumberInputWheel;
			attributes.inputMode ??= "numeric";
		}

		return ElementCreate({
			...htmlOptions,
			tag: ElementInput._tags[type],
			attributes,
			classList,
			eventListeners,
		});
	},
};

/**
 * Given an HTML element, reduce its font size until it fully fits into its visual width
 * @param {HTMLElement | Element} el
 */
function ElementFitText(el) {
	if (!(el instanceof HTMLElement)) return;

	const style = window.getComputedStyle(el);
	const baseSize = parseFloat(style.fontSize); // in px, even if CSS said "em"
	let size = baseSize;

	// shrink until it fits or we hit a floor
	while (el.scrollWidth > el.clientWidth) {
		size -= 1;
		el.style.fontSize = (size / baseSize) + 'em';
		if (size < 8) break;
	}
}

/**
 * Namespace for unpacking ID lists into their corresponding elements.
 *
 * Used retrieving elements referenced in attributes such as `aria-controls` and `aria-owns`, which consist of space-separated element IDs.
 */
var ElementUnpackIDs = {
	/**
	 * Convert a list of IDs into their corresponding elements.
	 * @template {HTMLElement} [T=HTMLElement]
	 * @param {readonly string[]} list The list of element IDs
	 * @param {null | ElementUnpackIDs.Options<T>} [options] Further options
	 * @returns {T[]} The list of elements (may or may not be shorter than the ID list)
	 */
	fromList: function fromList(list, options=null) {
		options ??= {};
		const root = ElementGetRoot(options.root ?? document);
		const filter = options.filter ?? /** @type {(i: null | HTMLElement) => i is T} */((i) => i != null);
		return list.map(id => root.getElementById(id)).filter(filter);
	},

	/**
	 * Convert a space-separated stringified ID list into their corresponding elements.
	 * @template {HTMLElement} [T=HTMLElement]
	 * @param {string} string The stringified list of comma-separated element IDs
	 * @param {null | ElementUnpackIDs.Options<T>} [options] Further options
	 * @returns {T[]} The list of elements (may or may not be shorter than the ID list)
	 */
	fromString: function fromString(string, options=null) {
		return ElementUnpackIDs.fromList(string.split(" "), options);
	},

	/**
	 * Grab an attribute containing a space-separated stringified ID list and convert them into their corresponding elements.
	 * @template {HTMLElement} [T=HTMLElement]
	 * @param {Element} element The element
	 * @param {string} attrName The name of the attribute with the element IDs
	 * @param {null | Exclude<ElementUnpackIDs.Options<T>, "root">} [options] Further options
	 * @returns {T[]} The list of elements (may or may not be shorter than the ID list)
	 */
	fromAttribute: function fromAttribute(element, attrName, options=null) {
		options ??= {};
		return ElementUnpackIDs.fromString(element.getAttribute(attrName) ?? "", { ...options, root: element });
	},
};

/** Namespace with helpers for highlighting elements based on search queries */
var ElementSearchQuery = {
	/**
	 * Highlight search query matches within the passed elements using `<em class="highlight">`, returning a list of all highlighted elements
	 * @template {Element} T
	 * @param {(readonly T[]) | NodeListOf<T>} elements The list of to-be elements whose textContent is to be matched
	 * @param {string} query The search query
	 * @param {null | ElementSearchQuery.Options} [options] Further options
	 * @returns {T[]} The matched elements
	 */
	highlight: function highlight(elements, query, options) {
		options ??= {};
		const queries = query.split(" ").map(i => i.trim()).filter(Boolean).map(i => CommonRegEscape(i));
		if (queries.length > 0) {
			const regex = new RegExp(queries.join("|"), 'gi');
			return Array.from(elements).filter(el => {
				const { match, innerHTML } = ElementSearchQuery._getInnerHTML(el.textContent, regex, options);
				// eslint-disable-next-line nounsanitized/property
				el.innerHTML = innerHTML;
				return match;
			});
		} else {
			return ElementSearchQuery.clear(elements);
		}
	},

	/**
	 * Clear all query matches from the passed elements. Equivalent to passing an empty string query to {@link highlight}.
	 * @template {Element} T The list of to-be elements whose textContent is to be matched
	 * @param {(readonly T[]) | NodeListOf<T>} elements
	 * @returns {T[]} The matched elements
	 */
	clear: function clear(elements) {
		// eslint-disable-next-line no-self-assign
		elements.forEach(el => el.textContent = el.textContent);
		return [...elements];
	},

	/**
	 * @private
	 * @param {string} textContent
	 * @param {RegExp} pattern
	 * @param {ElementSearchQuery.Options} options
	 * @returns {{ match: boolean, innerHTML: string }}
	 */
	_getInnerHTML: function _getInnerHTML(textContent, pattern, options) {
		if (pattern.test(textContent)) {
			const className = options.classList?.join(" ") ?? "highlight";
			const tag = options.tag ?? "em";
			return { match: true, innerHTML: `${textContent.replace(pattern, match => `<${tag} class="${className}">${ChatRoomHTMLEntities(match)}</${tag}>`)}` };
		} else {
			return { match: false, innerHTML: ChatRoomHTMLEntities(textContent) };
		}
	},
};

/**
 * HTML element for color tint pickers, functioning as some kind of 2D `<input type='range'>` input for selecting the color's saturation and brightness.
 */
class HTMLColorTintElement extends HTMLElement {
	static observedAttributes = ["value", "disabled"];
	static formAssociated = true;

	/** @type {null | ElementInternals} */
	internals_ = null;

	/**
	 * @private
	 * @type {null | string}
	 */
	_pressedOldValue = null;

	constructor() {
		super();
		if ("attachInternals" in this && typeof this.attachInternals === "function") {
			this.internals_ = this.attachInternals();
		}
	}

	connectedCallback() {
		if (this.shadowRoot) {
			return;
		}
		const shadow = this.attachShadow({ mode: "open" });

		shadow.append(
			ElementCreate({
				tag: "div",
				classList: ["knob"],
				attributes: { "aria-hidden": "true" },
				children: [{ tag: "div", classList: ["knob-circle"] }],
			}),
			ElementCreate({
				tag: "link",
				attributes: { rel: "stylesheet", href: "CSS/tint-input.css" },
			}),
		);

		this.tabIndex = this.disabled ? -1 : 0;
		// incoming strings will be sanitized by the `value` setter
		this.value = /** @type {HexColor} */(this.getAttribute("value")) ?? "#FFFFFF";
		this.defaultValue = this.value;

		const tintPicker = this;

		/** @type {(this: HTMLColorTintElement, ev: PointerEvent) => void} */
		function pointermove(ev) {
			if (tintPicker._pressedOldValue == null) {
				return;
			}

			/** @type {null | HTMLElement} */
			const knob = tintPicker.shadowRoot?.querySelector(".knob") ?? null;
			if (!tintPicker || !knob) {
				ev.stopImmediatePropagation();
				return;
			}

			const { top, left, width, height } = tintPicker.getBoundingClientRect();
			const saturation = CommonClamp((ev.pageX - left) / width, 0, 1);
			const brightness = CommonClamp((ev.pageY - top) / height, 0, 1);
			tintPicker._setKnobPosition(100 * saturation, 100 * brightness);
			tintPicker.brightness = (1 - brightness) * 255;
			tintPicker.saturation = saturation * 255;
			tintPicker.dispatchEvent(new InputEvent("input"));
		}

		/** @type {(this: HTMLColorTintElement, ev: PointerEvent) => void} */
		function pointerup(ev) {
			if (tintPicker._pressedOldValue == null) {
				return;
			}

			if (ev.type !== "pointercancel" && tintPicker._pressedOldValue !== tintPicker.value) {
				// Round the knob position such to the nearest 1/255 x- & y-coordinate
				const top = (255 - tintPicker.brightness) / (255 / 100);
				const left = tintPicker.saturation / (255 / 100);
				tintPicker._setKnobPosition(left, top);
				tintPicker.dispatchEvent(new Event("change"));
			}
			tintPicker._pressedOldValue = null;
			this.releasePointerCapture(ev.pointerId);
		}

		/** @type {(this: HTMLColorTintElement, ev: PointerEvent) => void} */
		function pointerdown(ev) {
			if (this.disabled || ev.button !== 0) {
				return;
			}

			tintPicker._pressedOldValue = this.value;
			this.setPointerCapture(ev.pointerId);
			tintPicker.dispatchEvent(new PointerEvent("pointermove", ev));
		}

		/** @type {(this: HTMLColorTintElement, ev: KeyboardEvent) => void} */
		function keydown(ev) {
			let keyModified = ev.key;
			const modifiers = CommonKey.GetModifiers(ev);
			if (modifiers === CommonKey.SHIFT) {
				switch (keyModified) {
					case "PageUp":
					case "PageDown":
					case "Home":
					case "End":
						keyModified += "Shift";
						break;
					default:
						return;
				}
			} else if (modifiers) {
				return;
			}

			let increment = 1 / (255 / 100);
			switch (ev.key) {
				case "PageUp":
				case "PageDown":
					increment *= 8;
					break;
				case "Home":
				case "End":
					increment = 100;
					break;
			}

			const { top, left } = tintPicker._getKnobPosition();
			let [topNew, leftNew] = [top, left];
			switch (keyModified) {
				case "EndShift":
				case "PageDownShift":
				case "ArrowLeft":
					leftNew = CommonClamp(left - increment, 0, 100);
					break;
				case "HomeShift":
				case "PageUpShift":
				case "ArrowRight":
					leftNew = CommonClamp(left + increment, 0, 100);
					break;
				case "Home":
				case "PageUp":
				case "ArrowUp":
					topNew = CommonClamp(top - increment, 0, 100);
					break;
				case "End":
				case "PageDown":
				case "ArrowDown":
					topNew = CommonClamp(top + increment, 0, 100);
					break;
				default:
					return;
			}

			ev.stopPropagation();
			ev.preventDefault();
			if (leftNew === left && topNew === top) {
				return;
			}
			if (!ev.repeat) {
				tintPicker._pressedOldValue = this.value;
			}

			tintPicker._setKnobPosition(leftNew, topNew);
			tintPicker.brightness = (100 - topNew) * (255 / 100);
			tintPicker.saturation = leftNew * (255 / 100);
			tintPicker.dispatchEvent(new InputEvent("input"));
		}

		/** @type {(this: HTMLColorTintElement, ev: FocusEvent | KeyboardEvent) => void} */
		function keyup(ev) {
			tintPicker._pressedOldValue = null;
		}

		/** @type {(this: HTMLColorTintElement, ev: TouchEvent) => void} */
		function touchstart(ev) {
			// Prevent the `touchstart` event from interfering with `pointer{x}` events on Chromium via triggering `pointercancel`
			ev.preventDefault();
		}

		this.addEventListener("pointerdown", pointerdown);
		this.addEventListener("pointercancel", pointerup);
		this.addEventListener("pointerup", pointerup);
		this.addEventListener("pointermove", pointermove);
		this.addEventListener("touchstart", touchstart);
		this.addEventListener("keydown", keydown);
		this.addEventListener("keyup", keyup);
		this.addEventListener("blur", keyup);
	}

	/**
	 * @param {string} name
	 * @param {null | string} oldValue
	 * @param {null | string} newValue
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			case "value": {
				if (newValue !== oldValue) {
					// incoming strings will be sanitized by the `value` setter
					this.value = /** @type {HexColor} */(newValue) ?? "#FFFFFF";
					this.defaultValue = this.value;
				}
				break;
			}
			case "disabled": {
				this.tabIndex = newValue == null ? 0 : -1;
				break;
			}
		}
	}

	/**
	 * See {@link HTMLInputElement.disabled}
	 * @type {boolean}
	 */
	get disabled() {
		return (
			this.hasAttribute("disabled")
			|| !!this.closest("fieldset:disabled, form:disabled")
		);
	}
	set disabled(value) {
		this.toggleAttribute("disabled", value);
	}

	/**
	 * Get or set the color hue on a scale of 0 to 360.
	 * @type {number}
	 */
	get hue() {
		return Math.round(this._value.H * 360);
	}
	set hue(value) {
		const hsv = this.valueAsHSV;
		hsv.H = CommonClamp(value / 360, 0, 1);
		this.valueAsHSV = hsv;
	}

	/**
	 * Get or set the color saturation on a scale of 0 to 255.
	 * @type {number}
	 */
	get saturation() {
		return Math.round(this._value.S * 255);
	}
	set saturation(value) {
		const hsv = this.valueAsHSV;
		hsv.S = CommonClamp(value / 255, 0, 1);
		this.valueAsHSV = hsv;
	}

	/**
	 * Get or set the color brightness on a scale of 0 to 255.
	 * @type {number}
	 */
	get brightness() {
		return Math.round(this._value.V * 255);
	}
	set brightness(value) {
		const hsv = this.valueAsHSV;
		hsv.V = CommonClamp(value / 255, 0, 1);
		this.valueAsHSV = hsv;
	}

	/**
	 * Returns the error message that would be displayed if the user submits the form, or an empty string if no error message.
	 * It also triggers the standard error message, such as "this is a required field".
	 * The result is that the user sees validation messages without actually submitting.
	 *
	 * See {@link HTMLInputElement.validationMessage}
	 * @type {string}
	 */
	get validationMessage() {
		return this.internals_?.validationMessage ?? "";
	}

	/**
	 * Returns a ValidityState object that represents the validity states of an element.
	 *
	 * See {@link HTMLInputElement.validity}
	 * @returns {ValidityState}
	 */
	get validity() {
		return this.internals_?.validity ?? Object.freeze({
			badInput: false,
			customError: false,
			patternMismatch: false,
			rangeOverflow: false,
			rangeUnderflow: false,
			stepMismatch: false,
			tooLong: false,
			tooShort: false,
			typeMismatch: false,
			valid: true,
			valueMissing: false,
		});
	}

	/**
	 * See {@link HTMLInputElement.reportValidity}
	 * @returns {boolean}
	 */
	reportValidity() {
		return this.internals_?.reportValidity() ?? true;
	}

	/**
	 * Sets or retrieves the initial contents of the object.
	 *
	 * See {@link HTMLInputElement.defaultValue}
	 * @type {string}
	 */
	defaultValue = "#FFFFFF";

	/**
	 * @private
	 * @type {Readonly<HSVColor>}
	 */
	_value = { H: 0, S: 0, V: 1 };

	/**
	 * Get or set the color {@link value} via an object with [HSV](https://en.wikipedia.org/wiki/HSL_and_HSV) color values.
	 * All HSV values are expected to be normalized to the `[0, 1]` range.
	 * @type {HSVColor}
	 */
	get valueAsHSV() {
		return { ...this._value };
	}
	set valueAsHSV(value) {
		if (
			CommonIsObject(value)
			&& CommonIsFinite(value.H, 0, 1)
			&& CommonIsFinite(value.S, 0, 1)
			&& CommonIsFinite(value.V, 0, 1)
		) {
			value = CommonPick(value, ["H", "S", "V"]);
		} else {
			value = { H: 0, S: 0, V: 1 };
		}

		this._value = value;
		const rgb = ColorPickerHSVToCSS(value);
		/** @type {null | HTMLElement} */
		const knob = this.shadowRoot?.querySelector(".knob-circle") ?? null;
		knob?.style.setProperty("background-color", rgb);
		this.style.setProperty("--hue", (value.H * 360).toString());
		if (this._pressedOldValue == null) {
			this._setKnobPosition(100 * value.S, 100 * (1 - value.V));
		}
	}

	/**
	 * Sets or retrieves the initial contents of the object.
	 *
	 * See {@link HTMLInputElement.value}
	 * @type {HexColor}
	 */
	get value() {
		return ColorPickerHSVToCSS(this._value);
	}
	set value(value) {
		this.valueAsHSV = ColorPickerCSSToHSV(value);
	}

	/**
	 * Sets or retrieves the name of the object.
	 *
	 * See {@link HTMLInputElement.name}
	 * @type {string}
	 */
	get name() {
		return this.getAttribute("name") ?? "";
	}
	set name(value) {
		this.setAttribute("name", value);
	}

	/**
	 * Set the position the knob
	 * @private
	 * @param {number} left - The relative left position on a scale of 0-100
	 * @param {number} top - The relative top position on a scale of 0-100
	 */
	_setKnobPosition(left, top) {
		/** @type {null | HTMLElement} */
		const knob = this.shadowRoot?.querySelector(".knob") ?? null;
		if (!knob) {
			return;
		}
		knob.style.left = `${left}%`;
		knob.style.top = `${top}%`;
	}

	/**
	 * Get the position the knob
	 * @private
	 * @returns {{ left: number, top: number }} - The position of the knob on a scale of 0-100
	 */
	_getKnobPosition() {
		/** @type {null | HTMLElement} */
		const knob = this.shadowRoot?.querySelector(".knob") ?? null;
		const left = Number.parseFloat(knob ? (knob.style.left || getComputedStyle(knob).left) : "0%");
		const top = Number.parseFloat(knob ? (knob.style.top || getComputedStyle(knob).top) : "0%");
		return { left, top };
	}
}

customElements.define("bc-tint-input", HTMLColorTintElement);

/**
 * Sets an element's text content, skipping the write when it already matches.
 * @param {ElementHelp.ElementOrId | null} ElementOrId
 * @param {string} text
 * @returns {void} - Nothing
 */
function ElementSetText(ElementOrId, text) {
	const element = ElementWrap(ElementOrId);
	if (!element || typeof text !== "string" || element.textContent === text) return;
	element.textContent = text;
}

/**
 * Sets the value of an input, select, or textarea, skipping the write when it already matches.
 * @param {ElementHelp.ElementOrId | null} ElementOrId
 * @param {string | number} value
 * @returns {void} - Nothing
 */
function ElementSetValue(ElementOrId, value) {
	const element = /** @type {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null} */ (ElementWrap(ElementOrId));
	if (!element || !("value" in element) || value == null) return;
	const next = value.toString();
	if (element.value !== next) {
		element.value = next;
	}
}

/**
 * Sets the checked state of an input, skipping the write when it already matches.
 * @param {ElementHelp.ElementOrId | null} ElementOrId
 * @param {boolean} checked
 * @returns {void} - Nothing
 */
function ElementSetChecked(ElementOrId, checked) {
	const element = /** @type {HTMLInputElement | null} */ (ElementWrap(ElementOrId));
	if (!element || !("checked" in element) || element.checked === !!checked) return;
	element.checked = !!checked;
}
