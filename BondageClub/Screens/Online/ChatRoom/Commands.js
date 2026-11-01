"use strict";

/** @type {ICommand[]} */
var Commands = [];
/** @readonly */
let CommandsKey = "/";
/** @type {TextCache} */
let CommandText = /** @type {never} */ (null);

// #region Commands Main Functions
/**
 * Loads the commands for the Player
 * @returns {void} - Nothing
 */
function CommandsLoad() {
	CommandCombine(CommonCommands);
	CommandsTranslate();
}

/**
 * Translates the help for commands
 * @returns {void} - Nothing
 */
function CommandsTranslate() {
	if (!CommandText) {
		CommandText = new TextCache("Screens/Online/ChatRoom/Text_Commands.csv");
	} else {
		CommonPromiseCatch(CommandText.buildCache());
	}
}

/**
 * Gets all available commands
 * @returns {ICommand[]}
 */
function GetCommands() {
	return Commands;
}

/**
 * Fill the user input with the command
 * @param {string} command
 * @returns {void} - Nothing
 */
function CommandSet(command) {
	ElementValue("InputChat", CommandsKey + command + " ");
	ElementFocus("InputChat");
}

/**
 * Add a list of commands
 * @param {ICommand | ICommand[]} add - Commands to add
 * @returns {void} - Nothing
 */
function CommandCombine(add) {
	if (!add) return;
	const arr = Array.isArray(add) ? add : [add];
	Commands = Commands.filter(C => !arr.some(A => A.Tag == C.Tag)).concat(arr);
	Commands.sort((A, B) => A.Tag.localeCompare(B.Tag));
}

/**
 * Parse the input chat message
 * @param {string} msg - Input string, cannot be empty
 * @returns {string | boolean} a (de-escaped) string if msg looks like an normal message,
 * true if a command successfully executed, false otherwise.
 */
function CommandParse(msg) {

	// We want to escape message with "\", so we need to escape it first.
	if (msg.startsWith("\\")) {
		return msg.replaceAt(0, "\u200b");
	} else if (msg.startsWith(CommandsKey + CommandsKey)) {
		// Escaped command, strip first char and return that
		return msg.substring(1);
	} else if (!msg.startsWith(CommandsKey)) {
		// Not a command. Skip.
		return msg;
	}

	return CommandExecute(msg);
}

/**
 * Prints out the help for commands with tags that include `low`
 * @deprecated
 * @param {string} low - lower case search keyword for tags
 * @param {number} [timeout] - total time to display the help message in ms
 * @returns {void} - Nothing
 */
function CommandHelp(low, timeout) {
	CommandsHelp.ShowForPartial(low);
}

/**
 * Prints out the help for commands
 * @deprecated
 * @param {Optional<ICommand, 'Action'>[]} commands - list of commands
 * @param {number} [timeout] - total time to display the help message in ms
 * @param {boolean} [doShowEscapeHint] - if message about message escaping should be shown
 */
function CommandPrintHelpFor(commands, timeout, doShowEscapeHint) {
	CommandsHelp.ShowFor(commands, { doShowEscapeHint, publish: true });
}

/**
 * Prints out the help for commands
 * @deprecated
 * @param {ICommand} cmd
 * @param {Pick<CommandHelpOptions, "remaining" | "subcommand">} [options]
 * @param {number} [timeout] - total time to display the help message in ms
 */
function CommandPrintHelpForSubcommandsArguments(cmd, options = {}, timeout) {
	CommandsHelp.ShowFor([cmd], { remaining: options.remaining ?? [], command: cmd, subcommand: options.subcommand });
}

/**
 * Finds command and executes it from the message
 * @param {string} msg - User input
 * @returns {boolean} - true if a command was executed, false otherwise
 */
function CommandExecute(msg) {
	const tokens = CommonTokenize(msg, { delimiters: [['"', '"']], includeDelimiters: true });
	let [key, ...parsed] = tokens;

	let commandDepth = 0;
	const commandMessage = `${key} ${parsed.slice(0, commandDepth).join(' ')}`;

	// Find initial command candidate
	const matchedCommand = GetCommands().find(cmd =>
		key.toLowerCase() === `${CommandsKey}${cmd.Tag}`.toLowerCase()
	);
	if (!matchedCommand) {
		ChatRoomSendLocal(`${commandMessage} ${TextGet("CommandNoSuchCommand")}`, 10_000);
		return false;
	}

	let command = resolveCommandChain(matchedCommand, parsed);
	if (command.length === 0) {
		ChatRoomSendLocal(`${commandMessage} ${TextGet("CommandNoSuchCommand")}`, 10_000);
		return false;
	}

	if (command.some(c => {
		const prerequisite = CommandResolveProperty(c, "Prerequisite");
		return prerequisite && !prerequisite.call(c);
	})) {
		ChatRoomSendLocal(`${commandMessage} ${TextGet("CommandPrerequisiteFailed")}`, 10_000);
		return false;
	}

	if (command.every(c => !CommandResolveProperty(c, "PreserveCase"))) {
		parsed = parsed.map(arg => arg.toLowerCase());
	}

	const currentCommandParsed = parsed.slice(commandDepth);
	const args = currentCommandParsed.join(' ');

	const action = CommandResolveProperty(command[commandDepth], "Action");
	action?.call(command[commandDepth], args, msg, currentCommandParsed);

	if (CommandResolveProperty(command[commandDepth], "Clear") !== false) CommandChangeChatInputContent('');
	return true;

	/**
	 * @param {ICommand} candidate
	 * @param {string[]} parsedArgs
	 * @returns {ICommand[]}
	 */
	function resolveCommandChain(candidate, parsedArgs) {
		if (!candidate) return [];

		let depth = 0;
		let current = candidate;

		const commandChain = [candidate];

		while (current) {
			if (depth >= parsedArgs.length) break;
			const nextCmd = CommonUnwrapThunk(CommandResolveProperty(current, "Subcommands"))?.find(c => c.Tag === parsedArgs[depth]);
			if (!nextCmd) break;

			current = nextCmd;
			commandChain.push(current);
			depth++;
		}

		commandDepth = depth;
		return commandChain;
	}
}

/**
 * Tries to complete the message to a command or print help about it
 * @param {string} msg - InputChat content
 * @returns {boolean} - If the message was a command
 */
function CommandAutoComplete(msg) {
	if (!msg.startsWith(CommandsKey)) return false;

	const caretPosition = CommandGetChatRoomCaretPosition();

	// If there's a selection, don't do anything
	if (caretPosition === -1) return true;

	msg = msg.substring(0, caretPosition);

	CommandChangeChatInputContent(msg);

	const low = msg.toLowerCase();

	const parts = CommonTokenize(low, { delimiters: [['"', '"'], ['\'', '\'']] }).filter(Boolean); // Remove empty strings
	const [key, ...forward] = parts;

	// Find base command candidates
	const candidates = GetCommands().filter(cmd =>
		(CommandsKey + cmd.Tag).startsWith(key)
	);

	if (candidates.length > 1 && forward.length === 0 && caretPosition <= key.length) {
		CommandHandleMultipleCandidates(candidates, key);
	} else if (candidates.length === 1 || caretPosition > key.length) {
		CommandHandleSingleCandidate(candidates[0], forward, parts, low, msg);
	}

	return true;
}
// #endregion Commands Main Functions

// #region Command Helpers
/**
 *
 * @param {ICommand[]} candidates
 * @param {string} key
 */
function CommandHandleMultipleCandidates(candidates, key) {
	const commonPrefix = CommonGetCommonPrefix(candidates.map(c => CommandsKey + c.Tag));
	if (key.length < commonPrefix.length) {
		CommandChangeChatInputContent(commonPrefix);
		const newCandidates = candidates.filter(c => `${CommandsKey}${c.Tag}`.length > key.length);
		if (newCandidates.length > 0) {
			CommandsHelp.ShowFor(newCandidates);
		}
	} else {
		CommandsHelp.ShowFor(candidates);
	}
}

/**
 *
 * @param {ICommand} initialCmd
 * @param {string[]} forward
 * @param {string[]} parts
 * @param {string} low
 * @param {string} msg
 * @returns {void}
 */
function CommandHandleSingleCandidate(initialCmd, forward, parts, low, msg) {
	if (!initialCmd) return;

	const depth = 0;
	let complete = false;

	if (parts[0] !== (CommandsKey + initialCmd.Tag).toLowerCase()) {
		CommandChangeChatInputContent(CommandsKey + initialCmd.Tag + ' ');
		return;
	}

	const sub = CommonUnwrapThunk(CommandResolveProperty(initialCmd, "Subcommands"))?.find(s => s.Tag === forward[depth]);
	const current = sub ?? initialCmd;

	const setCommand = sub ? `${initialCmd.Tag} ${sub.Tag}` : initialCmd.Tag;
	const remaining = CommandGetRemainingArguments(msg, setCommand);

	const helpOptions = { remaining, setCommand, command: initialCmd, subcommand: sub };

	const subcommands = CommonUnwrapThunk(CommandResolveProperty(current, "Subcommands"));
	const args = CommandResolveProperty(current, "Arguments");

	if (subcommands && args && remaining.length === 0) {
		CommandsHelp.ShowFor([current], helpOptions);
		return;
	}

	if (subcommands && remaining.length <= 1) {
		if (CommandHandleSubcommandCompletion(current, remaining, parts, helpOptions)) return;
	}
	if (args) {
		const state = CommandHandleArgumentCompletion(current, remaining, parts, helpOptions);
		if (state === true) return;
		if (state === 'complete') {
			complete = true;
		}
	}

	if (!subcommands && !args && remaining.length === 0) {
		complete = true;
	}

	const autoComplete = CommandResolveProperty(current, "AutoComplete");
	if (autoComplete) {
		autoComplete.call(current, remaining, low, msg);
		complete = true;
	}

	if (complete) {
		CommandsHelp.Complete();
		return;
	}

	CommandsHelp.ShowFor([initialCmd], helpOptions);
	return;
}

/**
 * Returns the first defined value for a command property, following Reference aliases
 * @template {CommandResolvableKey} K
 * @param {CommandLike} cmd
 * @param {K} property
 * @returns {CommandResolvedValue<K> | undefined}
 */
function CommandResolveProperty(cmd, property) {
	let /** @type {ICommand | undefined} */ current = cmd;
	while (current) {
		if (current[property] !== undefined) return current[property];
		if (!current.Reference) break;
		current = GetCommands().find(c => c.Tag === current?.Reference);
	}
	return undefined;
}

/**
 * Returns the final command definition after following Reference aliases
 * @param {CommandLike} cmd
 * @returns {CommandLike}
 */
function CommandResolveReference(cmd) {
	while (cmd.Reference) {
		const ref = GetCommands().find(c => c.Tag === cmd.Reference);
		if (!ref) break;
		cmd = ref;
	}
	return cmd;
}

/**
 *
 * @param {ICommand} cmd
 * @param {string[]} remaining
 * @param {string[]} parts
 * @param {{setCommand?: string} & Pick<CommandHelpOptions, "command" | "subcommand" | "remaining">} [options]
 * @returns {boolean} if completion was handled
 */
function CommandHandleSubcommandCompletion(cmd, remaining, parts, options = {}) {
	const candidates = CommonUnwrapThunk(CommandResolveProperty(cmd, "Subcommands"))?.filter(s => {
		const prerequisite = CommandResolveProperty(s, "Prerequisite");
		return (!prerequisite || prerequisite.call(s)) &&
		(!remaining[0] || s.Tag.startsWith(remaining[0]));
	}) ?? [];

	if (candidates.length === 0) return false;

	if (candidates.length === 1 && options.setCommand) {
		CommandCompleteCommand(options.setCommand, remaining, 0, candidates[0].Tag);
	} else if (candidates.length > 0 && options.setCommand) {
		const prefix = CommonGetCommonPrefix(candidates.map(c => c.Tag));
		if (prefix.length > (remaining[0]?.trim().length || 0)) {
			CommandCompleteCommand(options.setCommand, remaining, 0, prefix, false);
		}
	}

	CommandsHelp.ShowFor([options.command ?? cmd], {
		setCommand: options.setCommand,
		remaining: options.remaining ?? remaining,
		command: options.command ?? cmd,
		subcommand: options.subcommand,
	});

	return true;
}

/**
 *
 * @param {ICommand | Subcommand} cmd
 * @param {string[]} remaining
 * @param {string[]} parts
 * @param {{setCommand?: string} & Pick<CommandHelpOptions, "command" | "subcommand">} [options]
 * @returns {boolean | 'complete'} if completion was handled
 */
function CommandHandleArgumentCompletion(cmd, remaining, parts, options) {
	const argumentsDef = CommandResolveProperty(cmd, "Arguments");
	if (!argumentsDef || !Array.isArray(argumentsDef)) return false;

	// Updated inside the loop
	let currentArgIndex = 0;
	/** @type {string[]} */
	let matches = [];
	/** @type {string} */
	let currentInput = "";

	while (remaining[currentArgIndex] !== undefined || remaining.length === 0 || currentArgIndex < argumentsDef.length) {
		currentInput = remaining[currentArgIndex] || '';
		const currentArgDef = argumentsDef[currentArgIndex];
		const hints = CommonUnwrapThunk(currentArgDef.suggestions, CommandBuildSuggestionsContext({
			command: options?.command ?? cmd,
			subcommand: options?.subcommand,
			active: cmd,
			remaining,
			argIndex: currentArgIndex,
		}));
		if (!Array.isArray(hints)) {
			currentArgIndex++;
			continue;
		}

		const matchingArgs = hints.filter(a => a.toLowerCase().startsWith(currentInput.toLowerCase()));

		const isShorter = matchingArgs.some(m => m.length > currentInput.length);

		matches = matchingArgs;

		if (isShorter) break;

		currentArgIndex++;
	}

	// If the current argument index is out of bounds, return false
	if (currentArgIndex >= argumentsDef.length) return false;

	// If no matches, return false
	if (currentInput.length > 0 && matches.length === 0) return false;

	if (matches.length === 1 && options?.setCommand) {
		const completedArg = matches[0];
		// Check if there are more expected arguments to add a space
		const addSpace = currentArgIndex < argumentsDef.length - 1;
		CommandCompleteCommand(options.setCommand, [...remaining], currentArgIndex, completedArg, addSpace);
	} else if (matches.length > 1 && options?.setCommand) {
		const prefix = CommonGetCommonPrefix(matches); // Find the common prefix
		if (prefix.length > currentInput.length) {
			remaining[currentArgIndex] = prefix; // Update the current argument with the common prefix
			CommandCompleteCommand(options.setCommand, [...remaining], currentArgIndex, prefix, false);
		}
	}

	// Display help for the matching arguments
	CommandsHelp.ShowFor([options?.command ?? cmd], {
		setCommand: options?.setCommand,
		publish: true,
		remaining,
		command: options?.command,
		subcommand: options?.subcommand,
	});

	return true;
}

/**
 *
 * @param {string} setCommand
 * @param {string[]} remaining
 * @param {number} argumentDepth
 * @param {string} completion
 * @param {boolean} completed
 */
function CommandCompleteCommand(setCommand, remaining, argumentDepth, completion, completed = false) {
	const newParts = remaining.slice(0, argumentDepth).concat(completion);
	const end = completed ? ' ' : '';
	const newCommand = `${CommandsKey}${setCommand} ${newParts.join(' ')}${end}`;
	CommandChangeChatInputContent(newCommand);
}

/**
 *
 * @param {string} msg
 */
function CommandChangeChatInputContent(msg) {
	ElementValue("InputChat", msg);
	ElementFocus("InputChat");
}

/**
 * Returns the caret position of the chat input or -1 if user selected text or if there is no input
 * @returns {number}
 */
function CommandGetChatRoomCaretPosition() {
	const inputChat = /** @type {null | HTMLTextAreaElement} */ (document.getElementById("InputChat"));
	if (!inputChat) return -1;

	return inputChat.selectionStart === inputChat.selectionEnd ? inputChat.selectionStart : -1;
}

/**
 * @param {ArgumentDef} arg
 * @returns {string}
 */
function CommandGetArgumentKey(arg) {
	if (!arg.name && !arg.id) return "";
	if (arg.id) return arg.id;
	if (arg.name) {
		if (typeof arg.name === "string") return arg.name;
		return arg.name[TranslationLanguage] ?? Object.values(arg.name).find(v => typeof v === "string") ?? "";
	}

	return "";
}

/**
 * @param {string} msg
 * @param {string} setCommand
 * @returns {string[]}
 */
function CommandGetRemainingArguments(msg, setCommand) {
	const commandPrefix = `${CommandsKey}${setCommand}`;
	if (!msg.toLowerCase().startsWith(commandPrefix.toLowerCase())) return [];

	const argumentString = msg.slice(commandPrefix.length).trimStart();
	if (!argumentString) return [];

	return CommonTokenize(argumentString, { delimiters: [['"', '"'], ['\'', '\'']] }).filter(Boolean);
}

/**
 * @param {{
 *   command: ICommand,
 *   subcommand?: Subcommand,
 *   active: ICommand | Subcommand,
 *   remaining: string[],
 *   argIndex: number,
 * }} options
 * @returns {CommandSuggestionsContext}
 */
function CommandBuildSuggestionsContext(options) {
	const { command, subcommand, active, remaining, argIndex } = options;
	/** @type {Record<string, string | undefined>} */
	const args = {};

	const activeArguments = CommandResolveProperty(active, "Arguments");
	if (activeArguments) {
		for (const [i, arg] of activeArguments.entries()) {
			const argKey = CommandGetArgumentKey(arg);
			if (argKey) args[argKey] = remaining[i];
		}
	}

	return { command, subcommand, active, args, argIndex, remaining };
}

var CommandsHelp = {
	/**
	 * @private
	 * @param {HTMLElement} help
	 */
	_Publish: function _Publish(help) {
		help.setAttribute("data-sender", Player.MemberNumber);
		help.setAttribute("data-time", ChatRoomCurrentTime());
		help.classList.add("ChatMessage");

		help.prepend(CommandsHelp._BuildDelete("help"));

		ChatRoomAppendChat(help);
	},

	/**
	 * @param {string} id
	 */
	_BuildDelete: function _BuildDelete(id) {
		return ElementButton.Create(
			`commands-delete-${id}`,
			function () { this.closest(".commands-help")?.remove(); },
			{
				tooltip: "Delete",
				tooltipPosition: "left",
				tooltipRole: "label",
				noStyling: true,
				label: "🗑",
				labelPosition: "center",
			},
			{
				button: {
					classList: ["commands-button", "commands-button-delete"],
					attributes: { "aria-label": `Clear help` },
				}
			},
		);
	},

	/**
	 *
	 * @param {string} id
	 * @param {boolean} expanded
	 * @returns {HTMLButtonElement}
	 */
	_BuildToggle: function _BuildToggle(id, expanded) {
		return ElementButton.Create(
			`commands-collapse-${id}`,
			function (event) {
				if (event.shiftKey) {
					const isExpanded = this.getAttribute("aria-expanded") === "true";
					const parent = this.closest(".commands-command-section");
					const children = parent?.querySelectorAll(`.commands-button-collapse[aria-expanded="${!isExpanded}"`);
					children?.forEach(e => e.dispatchEvent(new Event("click")));
					if (children?.length && !isExpanded) {
						// Revert the collapsed state of the `h{n}` if not all `h{<n}` blocks are collapsed
						this.dispatchEvent(new Event("click"));
						return;
					}
				}

				const label = this.querySelector(".button-label");
				if (label) {
					label.textContent = this.getAttribute("aria-expanded") === "true" ? "▼ " : "▶ ";
				}
			},
			{
				tooltip: "",
				tooltipPosition: "right",
				tooltipRole: "label",
				noStyling: true,
				role: "checkbox",
				label: expanded ? "▼ " : "▶ ",
				labelPosition: "center",
			},
			{
				button: {
					classList: ["commands-button", "commands-button-collapse"],
					attributes: { "aria-label": `Collapse command ${id}`, "aria-checked": expanded.toString(), "aria-expanded": expanded.toString() },
				},
			},
		);
	},

	/**
	 *
	 * @param {ICommand} command
	 * @param {string} [translationTag]
	 * @returns {string}
	 */
	_GetDescription(command, translationTag = command.Tag) {
		// Externally-added command, check for unlocalized or localized description
		if (command.Description) {
			if (typeof command.Description === "string")
				return command.Description;
			const loc = command.Description[TranslationLanguage];
			if (loc) {
				return loc;
			}
		}

		// Game-provided command, get description from cache
		const desc = CommandText.cache[translationTag];
		if (desc)
			return desc;

		if (command.Reference) {
			const ref = CommandResolveReference(command);
			return this._GetDescription(ref, ref.Tag.replace(/ /g, "-"));
		}

		return TextGet("CommandHelpMissing");
	},

	/**
	 * @param {ArgumentDef} arg
	 * @param {string | undefined} translationTag
	 * @param {"name" | "desc"} type
	 * @returns {string}
	 */
	_GetArgumentTranslated(arg, translationTag = arg.id, type = "name") {
		if (!arg) return TextGet("CommandHelpMissing");
		// FIXME: Remove this after some time
		if (!arg.id) arg.id = typeof arg.name === "string" ? arg.name : arg.name?.[TranslationLanguage] ?? arg.name?.EN ?? "";

		const key = type === "name" ? `${translationTag}-${arg.id}` : `${translationTag}-${arg.id}-desc`;
		const def = type === "name" ? arg.name : arg.description;

		const desc = CommandText.cache[key];

		if (desc) return desc;

		if (def) {
			if (typeof def === "string") {
				return def;
			}
			const loc = def[TranslationLanguage];
			if (loc) {
				return loc;
			}
		}

		return type === "name" ? arg.id : `${arg.id}-desc`;
	},

	/**
	 * @param {ICommand} command
	 * @param {string} setCommand
	 * @param {boolean} singleCommand
	 * @param {Pick<CommandHelpOptions, "remaining" | "command" | "subcommand">} [options]
	 * @returns {HTMLOptionsUnion}
	 */
	_BuildCommand(command, setCommand, singleCommand, options = {}) {
		const translationTag = setCommand.replace(/ /g, "-");
		const description = this._GetDescription(command, translationTag);
		const subcommands = CommonUnwrapThunk(CommandResolveProperty(command, "Subcommands")) ?? [];
		const commandArguments = CommandResolveProperty(command, "Arguments") ?? [];
		const hasSubcommands = Array.isArray(subcommands) && subcommands.length > 0;
		const hasArguments = Array.isArray(commandArguments) && commandArguments.length > 0;
		const expandDisabled = !hasSubcommands && !hasArguments;

		/**
		 * @param {ArgumentDef} argDef
		 * @param {number} argIndex
		 */
		const args = (argDef, argIndex) => {
			if (!hasArguments || !argDef.suggestions) return [];

			return CommonUnwrapThunk(argDef.suggestions, CommandBuildSuggestionsContext({
				command: options.command ?? command,
				subcommand: options.subcommand,
				active: command,
				remaining: options.remaining ?? [],
				argIndex,
			}));
		};

		/**
		 * @param {string} title
		 * @param {boolean} addToggle
		 * @returns {HTMLOptionsUnion}
		 */
		const buildSectionHeader = (title, addToggle) => ({
			tag: "header",
			classList: ["commands-command-header"],
			children: [
				addToggle ? this._BuildToggle(setCommand, singleCommand) : null,
				{
					tag: "span",
					classList: ["commands-command-description"],
					children: [title],
				},
			],
		});

		/** @returns {HTMLOptionsUnion} */
		const buildSubcommandsSection = () => ({
			tag: "section",
			classList: ["commands-command-section"],
			children: [
				buildSectionHeader("Subcommands:", subcommands.length > 0),
				{
					tag: "article",
					classList: ["commands-command-subcommands"],
					children: [
						...subcommands.map(s => this._BuildCommand(s, `${setCommand} ${s.Tag}`, false, {
							remaining: options.remaining,
							command: options.command ?? command,
							subcommand: s,
						})),],
				},
			],
		});

		/** @returns {HTMLOptionsUnion} */
		const buildArgumentsSection = () => ({
			tag: "section",
			classList: ["commands-command-section"],
			children: [
				buildSectionHeader("Arguments:", commandArguments.length > 0),
				...commandArguments.flatMap((arg, argIndex) =>
					/** @type {HTMLOptionsUnion} */
					({
						tag: "section",
						classList: ["commands-command-arguments"],
						children: [
							buildSectionHeader(`${this._GetArgumentTranslated(arg, translationTag, "name")} — ${this._GetArgumentTranslated(arg, translationTag, "desc")}`, args(arg, argIndex).length > 0),
							{
								tag: "article",
								classList: ["commands-command-arguments-list"],
								children: [
									...args(arg, argIndex).flatMap((hint, i, hints) => {
										const btn = ElementButton.Create(
											`commands-command-argument-hint-${setCommand}-${hint}`,
											() => CommandSet([setCommand, ...(options.remaining ?? []).slice(0, argIndex), hint].filter(Boolean).join(' ')),
											{
												label: hint,
												labelPosition: "center",
												noStyling: true,
											},
											{
												button: {
													classList: ["commands-button", "commands-command-argument"],
													attributes: { "aria-label": `Run ${setCommand} ${hint} command` },
												}
											}
										);

										// Add a comma after every button except the last
										return i < hints.length - 1 ? [btn, ", "] : [btn];
									})
								],
							}
						]
					})),
			],
		});

		/** @returns {HTMLOptionsUnion} */
		const buildCommandHeader = () => ({
			tag: "header",
			classList: ["commands-command-header"],
			children: [
				!expandDisabled ? this._BuildToggle(setCommand, singleCommand) : null,
				ElementButton.Create(
					`commands-command-tag-${setCommand}`,
					() => CommandSet(setCommand),
					{
						label: `${CommandsKey}${setCommand} `,
						labelPosition: "center",
						noStyling: true,
					},
					{
						button: {
							classList: ["commands-button", "commands-command-tag"],
							attributes: { "aria-label": `Run ${setCommand} command` },
						}
					}
				),
				{
					tag: "span",
					classList: ["commands-command-description"],
					innerHTML: description,
				},
			],
		});

		return {
			tag: "section",
			classList: ["commands-command-section"],
			children: [
				buildCommandHeader(),
				{
					tag: "article",
					classList: ["commands-command-details"],
					children: [
						hasSubcommands && buildSubcommandsSection(),
						hasArguments && buildArgumentsSection(),
					].filter(Boolean),
				},
			],
		};
	},

	/**
	 * @param {ICommand[]} commands
	 * @param {CommandHelpOptions} [options]
	 * @returns {HTMLDivElement}
	 */
	_BuildHelp(commands, { setCommand, remaining, command, subcommand } = {}) {
		const existingHelp = ElementWrap("commands-help");
		if (existingHelp) {
			existingHelp.remove();
		}

		return ElementCreate({
			tag: "div",
			classList: ["commands-help"],
			attributes: { id: "commands-help" },
			children: [
				...commands.map((c, _, array) => {
					return this._BuildCommand(c, setCommand || c.Tag, array.length === 1, { remaining, command, subcommand });
				})],
		});
	},

	/**
	 * Prints out the help for commands
	 * @param {Optional<ICommand, 'Action'>[]} commands - list of commands
	 * @param {CommandHelpOptions} [options] - if message about message escaping should be shown
	 */
	ShowFor: function ShowFor(commands, options = {}) {
		/** @type {HTMLDivElement | undefined} */
		let escapeHint = undefined;
		if (options.doShowEscapeHint) {
			escapeHint = ElementCreate({
				tag: "div",
				children: [
					{
						tag: "span",
						classList: ["commands-escape-hint"],
						children: [
							{
								tag: "strong",
								children: [TextGet("CommandHelpEscape")]
							}
						]
					},
					{
						tag: "br"
					}
				]
			});
		}

		const help = this._BuildHelp(commands, options);
		if (escapeHint) {
			help.prepend(escapeHint);
		}

		if (options.publish !== false) {
			CommandsHelp._Publish(help);
		}

		return help;
	},

	/**
	 * Prints out the help for commands with tags that include `low`
	 * @param {string} low - lower case search keyword for tags
	 * @returns {void} - Nothing
	 */
	ShowForPartial: function ShowForPartial(low) {
		const text = TextGet("CommandHelp").replace('KeyWord', low);
		const helpTextElement = ElementCreate({
			tag: "div",
			children: [
				{
					tag: "span",
					classList: ["commands-help-text"],
					innerHTML: text
				},
				{
					tag: "br"
				}
			]
		});
		const commands = GetCommands().filter(C => !low || C.Tag.includes(low));
		const help = this.ShowFor(commands, { doShowEscapeHint: !low, publish: false });

		help.prepend(...helpTextElement.children);

		CommandsHelp._Publish(help);
	},

	Complete: function Complete() {
		ElementWrap("commands-help")?.remove();
	}
};
// #endregion Command Helpers

// #region Changelog
var CommandsChangelog = {
	/**
	 * Iterate through the passed changelog element and remove all (redundant) elements outside the `[startID, stopID)` interval.
	 * @param {Element} root - The changelog-containing element
	 * @param {string} startID - The ID of the element representing the interval's start
	 * @param {string | null} stopID - The ID of the element representing the interval's end.
	 * If not provided, use the first element matching the tag name of the `startID` element instead.
	 */
	_FilterContent: function _FilterContent(root, startID, stopID = null) {
		let segmentState = /** @type {"start" | "mid" | "end"} */("start");
		/** @type {string | null} */
		let startTagName = null;

		/**
		 * Function for handling iteration before the `[startID, stopID)` interval.
		 *
		 * The desired interval can be specified as `[startID, stopID)` or `[stopID, startID)`.
		 * @type {(e: Element) => null | Element}
		 */
		const handleStartState = (e) => {
			const next = e.nextElementSibling;
			if (e.id === startID) {
				startTagName = e.tagName;
				segmentState = "mid";
			} else if (stopID && e.id === stopID) {
				startTagName = e.tagName;
				segmentState = "mid";
				stopID = startID;
			} else {
				e.remove();
			}
			return next;
		};

		/**
		 * Function for handling iteration within the `[startID, stopID]` interval.
		 *
		 * If no `stopID` is present use the tag name of the `startID` element instead for identifying the end of the interval.
		 * @type {(e: Element) => null | Element}
		 */
		const handleMidState = (e) => {
			let next = e.nextElementSibling;
			if (stopID) {
				if (stopID === e.id) {
					segmentState = "end";
					e.remove();
				}
			} else if (e.tagName === startTagName) {
				segmentState = "end";
				e.remove();
			}
			return next;
		};

		/** @type {Element | null} */
		let elem = root.children[0];
		while (elem) {
			switch (segmentState) {
				case "start":
					// Find the start of the version interval
					elem = handleStartState(elem);
					break;
				case "mid":
					// Find the end of the version interval
					elem = handleMidState(elem);
					break;
				case "end": {
					// We're past the version interval at this point; remove all remaining elements
					/** @type {Element | null} */
					const next = elem.nextElementSibling;
					elem.remove();
					elem = next;
					break;
				}
			}
		}
	},

	/**
	 * Construct a button for all `h1` buttons for deleting the changelog in question.
	 * @param {string} id
	 * @param {HTMLHeadingElement} header
	 * @param {number} level
	 * @returns {HTMLButtonElement}
	 */
	_GetH1Button: function _GetH1Button(id, header, level) {
		return ElementButton.Create(
			`${id}-delete-${header.id}`,
			function () { this.closest(".chat-room-changelog")?.remove(); },
			{
				tooltip: "", // See _SetTranslationText()
				tooltipPosition: "bottom",
				tooltipRole: "label",
				noStyling: true,
				label: "🗑",
				labelPosition: "center",
			},
			{
				button: {
					classList: ["chat-room-changelog-button", "chat-room-changelog-button-delete"],
					attributes: { "aria-label": `Clear ${header.textContent} changelog` },
					dataAttributes: { level },
				}
			},
		);
	},

	/**
	 * Construct a button for all `hn` buttons (with `n > 1`) for collapsing their respective section sibblings.
	 * @param {string} id
	 * @param {HTMLHeadingElement} header
	 * @param {number} level
	 * @returns {HTMLButtonElement}
	 */
	_GetHNButton: function _GetHNButton(id, header, level) {
		return ElementButton.Create(
			`${id}-collapse-${header.id}`,
			function (event) {
				if (event.shiftKey) {
					const isExpanded = this.getAttribute("aria-expanded") === "true";
					const parent = this.closest(".chat-room-changelog-section");
					const children = parent?.querySelectorAll(`.chat-room-changelog-button-collapse[aria-expanded="${!isExpanded}"`);
					children?.forEach(e => e.dispatchEvent(new Event("click")));
					if (children?.length && !isExpanded) {
						// Revert the collapsed state of the `h{n}` if not all `h{<n}` blocks are collapsed
						this.dispatchEvent(new Event("click"));
						return;
					}
				}

				const label = this.querySelector(".button-label");
				if (label) {
					label.textContent = this.getAttribute("aria-expanded") === "true" ? "▼" : "▶";
				}
			},
			{
				tooltip: "", // See _SetTranslationText()
				tooltipPosition: "bottom",
				tooltipRole: "label",
				noStyling: true,
				role: "checkbox",
				label: "▼",
				labelPosition: "center",
			},
			{
				button: {
					classList: ["chat-room-changelog-button", "chat-room-changelog-button-collapse"],
					attributes: { "aria-label": `Collapse ${header.textContent} section`, "aria-checked": "true", "aria-expanded": "true" },
					dataAttributes: { level },
				}
			},
		);
	},

	/**
	 * Ensure that all elements at the passed header level get a companion button, and ensure they and their respective contents are nested together in a `<section>`.
	 * @param {Element} root
	 * @param {string} id
	 * @param {string} href
	 * @param {number} headerLevel
	 * @param {null | string} headerPrefix
	 */
	_ParseHeader: function _ParseHeader(root, id, href, headerLevel, headerPrefix = null) {
		const headerTag = /** @type {"h1" | "h2" | "h3" | "h4" | "h5"} */(`h${headerLevel - 1}`);
		const selector = /** @type {"h2" | "h3" | "h4" | "h5" | "h6"} */(`h${headerLevel}`);
		root.querySelectorAll(selector).forEach(header => {
			// Collect all sibblings
			const sibblings = [];
			let sibbling = header.nextElementSibling;
			while (sibbling && sibbling.tagName !== `H${headerLevel}`) {
				sibblings.push(sibbling);
				sibbling = sibbling.nextElementSibling;
			}

			/** @type {(string | Node | HTMLOptionsUnion)[]} */
			const extraChildren = [];
			if (headerTag === "h1") {
				extraChildren.push(
					{ tag: "span", children: ["•"], attributes: { "aria-hidden": "true" } },
					CommandsChangelog._GetH1Button(id, header, headerLevel - 1),
				);
			}

			const headerID = `${id}-h${headerLevel - 1}-${header.id}`;
			header.parentElement?.replaceChild(
				ElementCreate({
					tag: "section",
					classList: ["chat-room-changelog-section"],
					attributes: { "aria-labelledby": headerID },
					children: [
						{
							tag: "div",
							classList: ["chat-room-changelog-header-div"],
							children: [
								CommandsChangelog._GetHNButton(id, header, headerLevel - 1),
								{ tag: "span", children: ["•"], attributes: { "aria-hidden": "true" } },
								{
									tag: headerTag,
									attributes: { id: headerID },
									children: [{
										tag: "a",
										attributes: { target: "_blank", href: `${href}#${header.id}` },
										children: [[headerPrefix, header.textContent].filter(Boolean).join(" ")],
									}],
								},
								...extraChildren,
							],
						},
						...sibblings,
					],
				}),
				header,
			);
		});
	},

	/**
	 * Ensure that all `<img>` elements can be clicked, opening their image in a new tab.
	 * @param {Element} root
	 */
	_ParseImg: function _ParseImg(root) {
		root.querySelectorAll("img").forEach(img => {
			const a = ElementCreate({
				tag: "a",
				attributes: { href: img.src, target: "_blank", class: "chat-room-changelog-image" },
			});
			img.parentElement?.replaceChild(a, img);
			a.append(img);
		});
	},

	/**
	 * Ensure that all `<a>` elements open their links in a new tab.
	 * @param {Element} root
	 */
	_ParseA: function _ParseA(root) {
		root.querySelectorAll("a").forEach(a => a.target = "_blank");
	},

	/**
	 * Set all translation-sensitive text in the changelog.
	 * @param {Element} changelog
	 */
	_SetTranslationText: function _SetTranslationText(changelog) {
		CommonPromiseCatch(
			TextCache.buildAsync("Screens/Online/ChatRoom/Text_ChatRoom.csv").then(cache => {
				const clear = cache.get("CommandChangeLogClear");
				changelog.querySelectorAll(".chat-room-changelog-button-delete > .button-tooltip")?.forEach(e => e.textContent = clear);

				const collapse = cache.get("CommandChangeLogCollapse");
				const collapseShift = cache.get("CommandChangeLogCollapseShift").split("{shift}")[1] ?? "";
				changelog.querySelectorAll(".chat-room-changelog-button-collapse > .button-tooltip")?.forEach(e => {
					e.append(
						collapse,
						ElementCreate({ tag: "br" }),
						ElementCreate({ tag: "kbd", children: ["shift"] }),
						collapseShift,
					);
				});

				changelog.removeAttribute("aria-busy");
			})
		);
	},

	/**
	 * Construct a changelog from the passed stringified HTML (constructed via _e.g._ the [marked](https://www.npmjs.com/package/marked) package).
	 *
	 * The stringified HTML is expected to have the following structure:
	 * - A single `<h1>` element _may_ be present in order to represent a general changelog title
	 * - Version-specific sections of the changelog _must_ be represented by `<h2>` elements and _may_ contain an arbitrary number of sub-headers
	 * - Headers and their sections _must not_ be grouped together inside an element; an overal flat structure is expected
	 * @param {string} innerHTML - The inner html representing containing a superset of the changelog's final content
	 * @param {object} [options]
	 * @param {null | string} [options.id] - The (root) ID of the to-be created changelog; defaults to `chat-room-changelog`
	 * @param {null | string} [options.href] - The URL leading to the (external) changelog; defaults to `./changelog.html`
	 * @param {null | string} [options.startID] - The header ID of the first to-be included segment within the changelog; defaults to the latest BC version (`r[0-9]{3}`)
	 * @param {null | string} [options.stopID] - The header ID of the final to-be included segment within the changelog; defaults to `options.startID` if unspecified
	 * @returns {HTMLDivElement} - The newly created changelog
	 */
	Parse: function Parse(innerHTML, options = undefined) {
		options ??= {};
		const id = options.id ?? "chat-room-changelog";
		const href = options.href ?? "./changelog.html";
		const startID = options.startID ?? `r${GameVersionFormat.exec(GameVersion)?.[1]}`;
		const stopID = options.stopID;

		let changelog = /** @type {null | HTMLDivElement} */(document.getElementById(id));
		if (changelog) {
			console.error(`Element "${id}" already exists`);
			return changelog;
		}

		// Ensure that any and all images are loaded lazily _before_ setting the innerHTML, lest they are all loaded right away
		changelog = ElementCreate({
			tag: "div",
			classList: ["chat-room-changelog"],
			attributes: { id, "aria-busy": "true" },
			dataAttributes: { start: startID, stop: stopID ?? undefined },
			innerHTML: innerHTML.replace("<img", "<img loading='lazy'"),
		});

		// The original <h1> will eventually be removed, but keep hold of its text content for later
		const h1Content = changelog.querySelector("h1")?.textContent;
		if (h1Content) {
			changelog.setAttribute("aria-label", h1Content);
		}

		// Perform any filtering and clean up of the changelog's elements
		CommandsChangelog._FilterContent(changelog, startID, stopID);
		CommandsChangelog._ParseA(changelog);
		CommandsChangelog._ParseImg(changelog);
		[2, 3, 4, 5, 6].forEach(n => CommandsChangelog._ParseHeader(changelog, id, href, n, n === 2 ? h1Content : null));
		CommandsChangelog._SetTranslationText(changelog);
		return changelog;
	},

	/**
	 * Construct a changelog from the passed stringified HTML and publish it to the chat room chatlog.
	 *
	 * @param {string} innerHTML - The inner html representing containing a superset of the changelog's final content
	 * @param {object} [options]
	 * @param {null | string} [options.id] - The (root) ID of the to-be created changelog; defaults to `chat-room-changelog`
	 * @param {null | string} [options.href] - The URL leading to the (external) changelog; defaults to `./changelog.html`
	 * @param {null | string} [options.startID] - The header ID of the first to-be included segment within the changelog; defaults to the latest BC version (`r[0-9]{3}`)
	 * @param {null | string} [options.stopID] - The header ID of the final to-be included segment within the changelog; defaults to `options.startID` if unspecified
	 * @returns {HTMLDivElement} - The newly created changelog
	 */
	Publish(innerHTML, options = undefined) {
		const changelog = CommandsChangelog.Parse(innerHTML, options);
		changelog.setAttribute("data-sender", Player.MemberNumber);
		changelog.setAttribute("data-time", ChatRoomCurrentTime());
		changelog.classList.add("ChatMessage");

		// Ensure that all requested changelogs except the most recent one are collapsed
		const buttons = changelog.querySelectorAll(".chat-room-changelog-button-collapse[data-level='1']");
		buttons.forEach((button, i) => {
			if (i !== 0) {
				button.dispatchEvent(new Event("click"));
			}
		});
		ChatRoomAppendChat(changelog);
		return changelog;
	},
};
// #endregion Changelog

// #region Mods List
/**
 * Namespace for local and remote ModSDK listing commands.
 * @namespace
 */
var CommandsModsList = {

	/**
	 * @readonly
	 * @private
	 */
	_RemoteTimeoutMs: 5000,

	/**
	 * @type {null | CommandsModListRequest}
	 * @private
	 */
	_ActiveRemoteRequest: null,

	ShowLocal() {
		const mods = this._GetLocalSorted();
		const existing = document.getElementById("chat-room-mods-list");
		if (existing) existing.remove();

		const summaryText = mods.length === 1
			? TextSubstitute("CommandModsListSummaryOne", { $count: mods.length.toString() }).join("")
			: TextSubstitute("CommandModsListSummaryMany", { $count: mods.length.toString() }).join("");

		const list = ElementCreate({
			tag: "div",
			classList: ["chat-room-mods-list", "ChatMessage"],
			attributes: { id: "chat-room-mods-list", "aria-label": "Loaded Mod SDK mods" },
			children: [
				{
					tag: "details",
					classList: ["chat-room-mods-panel"],
					attributes: { open: true },
					children: [
						{
							tag: "summary",
							classList: ["chat-room-mods-panel-summary", "no-select"],
							children: [
								{ tag: "h2", children: [TextGet("CommandModsListTitle")] },
								{ tag: "span", classList: ["chat-room-mods-panel-summary-text"], children: [summaryText] },
								{
									tag: "div",
									classList: ["chat-room-mods-panel-actions"],
									children: [
										this._BuildCopyButton("list", mods, Player),
										this._BuildDeleteButton("list"),
									],
								},
							],
						},
						{
							tag: "div",
							classList: ["chat-room-mods-panel-body"],
							children: [this._BuildList(mods)],
						},
					],
				},
			],
		});
		list.setAttribute("data-sender", Player.MemberNumber.toString());
		list.setAttribute("data-time", ChatRoomCurrentTime());
		ChatRoomAppendChat(list);
	},

	/**
	 * @param {ServerChatRoomMessage} data
	 * @param {OnlineCharacter} senderCharacter
	 */
	ProcessHiddenRemote(data, senderCharacter) {
		if (data.Content === "ModSdkModsQuery") {
			this._HandleRemoteQuery(data);
		} else if (data.Content === "ModSdkModsReply") {
			this._HandleRemoteReply(data, senderCharacter);
		}
	},

	/** @param {string} argsTrimmed */
	StartRemote(argsTrimmed) {
		if (!ServerPlayerIsInChatRoom()) return ToastManager.warning(TextGet("CommandModsRemoteNotInRoom"));

		this._CancelActiveRemote();

		const spec = argsTrimmed.trim();
		const target = spec ? ChatRoomGetCharacter(spec.replace(/^@/, "")) : null;
		if (spec && !target) return ChatRoomSendLocal(TextGet("CommandModsRemoteInvalidTarget"));

		const requestId = CommonGenerateUniqueID();
		const targets = target ? [target] : ChatRoomCharacter;
		/** @type {Set<number>} */
		const pending = new Set(targets.filter(c => c.MemberNumber !== Player.MemberNumber).map(c => c.MemberNumber));
		/** @type {Map<number, CommandsModListResult>} */
		const results = new Map();

		if (targets.some(c => c.MemberNumber === Player.MemberNumber)) {
			results.set(Player.MemberNumber, { status: "ok", mods: this._GetLocalSorted() });
		}

		const rootEl = ElementCreate({
			tag: "div",
			classList: ["chat-room-mods-remote", "chat-room-mods-list", "ChatMessage"],
			attributes: {
				id: `chat-room-mods-remote-${requestId}`,
				"aria-busy": "true",
				"aria-label": TextGet("CommandModsRemoteAriaLabel"),
			},
			children: [
				{
					tag: "details",
					classList: ["chat-room-mods-panel"],
					attributes: { open: true },
					children: [
						{
							tag: "summary",
							classList: ["chat-room-mods-panel-summary", "no-select"],
							children: [
								{ tag: "h2", children: [TextGet("CommandModsRemoteTitle")] },
								this._BuildDeleteButton(requestId),
							],
						},
						{
							tag: "div",
							classList: ["chat-room-mods-panel-body"],
							children: [{
								tag: "div",
								classList: ["chat-room-mods-remote-progress", "no-select"],
								children: [
									ElementCreateLoader("dots"),
									{ tag: "span", classList: ["chat-room-mods-remote-progress-count"], children: ["0/0"] },
								],
							}],
						},
					],
				},
			],
		});
		rootEl.setAttribute("data-sender", Player.MemberNumber.toString());
		rootEl.setAttribute("data-time", ChatRoomCurrentTime());
		ChatRoomAppendChat(rootEl);

		this._ActiveRemoteRequest = {
			requestId,
			pending,
			timeoutId: setTimeout(() => this._OnRemoteTimeout(), this._RemoteTimeoutMs),
			rootEl,
			results,
			total: pending.size,
			finalized: false,
		};

		this._UpdateRemoteProgress();
		if (pending.size === 0) {
			this._FinalizeRemote();
		} else {
			ServerSend("ChatRoomChat", {
				Content: "ModSdkModsQuery",
				Type: "Hidden",
				Dictionary: [{ Tag: "ModSdkModsQueryPayload", RequestId: requestId }],
				Target: target?.MemberNumber,
			});
		}
		ElementScrollToEnd("TextAreaChatLog");
	},

	_CancelActiveRemote() {
		const active = this._ActiveRemoteRequest;
		if (!active) return;
		clearTimeout(active.timeoutId);
		active.rootEl.remove();
		this._ActiveRemoteRequest = null;
	},

	_GetLocalSorted() {
		return bcModSdk.getModsInfo().slice().sort((a, b) => a.name.localeCompare(b.name));
	},

	/**
	 * @param {ModSDKModInfo[]} mods
	 * @param {Character} char
	 */
	_FormatModListForCopy(mods, char) {
		const lines = [
			`${TextGet("CommandModsListTitle")} — ${CharacterNickname(char)} (${char.MemberNumber})`,
			mods.length === 1
				? TextSubstitute("CommandModsListSummaryOne", { $count: mods.length.toString() }).join("")
				: TextSubstitute("CommandModsListSummaryMany", { $count: mods.length.toString() }).join(""),
			"",
		];
		if (mods.length === 0) {
			lines.push(TextGet("CommandModsRemoteNoMods"));
		} else {
			for (const mod of mods) {
				const version = TextSubstitute("CommandModsVersionFormat", { $version: mod.version }).join("");
				lines.push(`${mod.name} ${version}`);
				if (mod.repository) lines.push(`  ${mod.repository}`);
				lines.push("");
			}
			if (lines[lines.length - 1] === "") lines.pop();
		}
		return lines.join("\n");
	},

	/**
	 * @param {string} id
	 * @param {ModSDKModInfo[]} mods
	 * @param {OnlineCharacter} char
	 */
	_BuildCopyButton(id, mods, char) {
		return ElementButton.Create(
			`chat-room-mods-copy-${id}`,
			function () {
				CommonClipboardWrite(CommandsModsList._FormatModListForCopy(mods, char), (res) => {
					if (res.err) {
						ToastManager.error(res.errorAsDOM(TextGet("CommandModsListCopyError")));
					} else {
						ToastManager.success(TextGet("CommandModsListCopyDone"));
					}
				});
			},
			{
				tooltip: TextGet("CommandModsListCopyTooltip"),
				tooltipPosition: "left",
				tooltipRole: "label",
				noStyling: true,
				image: "./Icons/Copy.svg"
			},
			{
				button: {
					classList: ["chat-room-mods-button", "chat-room-mods-button-copy"],
					attributes: { "aria-label": "Copy mod list" },
				}
			},
		);
	},

	/** @param {string} id */
	_BuildDeleteButton(id) {
		return ElementButton.Create(
			`chat-room-mods-delete-${id}`,
			function () {
				this.closest(".chat-room-mods-list")?.remove();
			},
			{
				tooltip: "Delete",
				tooltipPosition: "left",
				tooltipRole: "label",
				noStyling: true,
				label: "🗑",
				labelPosition: "center",
			},
			{
				button: {
					classList: ["chat-room-mods-button", "chat-room-mods-button-delete"],
					attributes: { "aria-label": "Clear mods list" },
				}
			},
		);
	},

	/** @param {ModSDKModInfo[]} mods */
	_BuildList(mods) {
		return ElementCreate({
			tag: "ul",
			children: mods.length === 0
				? [{ tag: "li", classList: ["chat-room-mods-list-no-mods", "no-select"], children: [TextGet("CommandModsRemoteNoMods")] }]
				: mods.map(mod => ({
					tag: "li",
					attributes: { title: mod.fullName },
					children: [
						{ tag: "strong", classList: ["chat-room-mods-list-name"], children: [mod.name] },
						{ tag: "span", classList: ["chat-room-mods-list-version"], children: [TextSubstitute("CommandModsVersionFormat", { $version: mod.version }).join("")] },
						mod.repository ? { tag: "a", classList: ["chat-room-mods-list-repository", "no-select"], attributes: { href: mod.repository, target: "_blank" }, children: [TextGet("CommandModsRepositoryLink")] } : null,
					],
				})),
		});
	},

	_UpdateRemoteProgress() {
		const active = this._ActiveRemoteRequest;
		if (!active || active.finalized) return;
		const progressElement = active.rootEl.querySelector(".chat-room-mods-remote-progress");
		if (progressElement) {
			const done = active.total - active.pending.size;
			const statusText = TextSubstitute("CommandModsRemoteProgress", {
				$done: String(active.total - active.pending.size),
				$total: String(active.total),
			}).join("");
			const countElement = progressElement.querySelector(".chat-room-mods-remote-progress-count");
			if (countElement) countElement.textContent = `${done}/${active.total}`;
			progressElement.setAttribute("title", statusText);
			progressElement.setAttribute("aria-label", statusText);
		}
	},

	/** @param {Map<number, CommandsModListResult>} results */
	_BuildDetailsBody(results) {
		const roomOrder = new Map(ChatRoomCharacter.map((character, index) => [character.MemberNumber, index]));
		return ElementCreate({
			tag: "div",
			children: [...results.entries()]
				.map(([memberNumber, result]) => {
					const character = ChatRoomCharacter.find(ch => ch.MemberNumber === memberNumber);
					const label = character
						? `${CharacterNickname(character)} (${memberNumber})`
						: TextSubstitute("CommandModsRemoteUnknownMember", { $member: memberNumber.toString() }).join("");
					return { memberNumber, label, result, character };
				})
				.sort((a, b) => {
					const orderA = roomOrder.get(a.memberNumber);
					const orderB = roomOrder.get(b.memberNumber);
					if (orderA != null && orderB != null) return orderA - orderB;
					if (orderA != null) return -1;
					if (orderB != null) return 1;
					return a.memberNumber - b.memberNumber;
				})
				.map(({ label, result, memberNumber, character }, index, array) => {
					if (!character) return;
					const statusLabel = (() => {
						if (memberNumber === Player.MemberNumber)
							return TextGet("CommandModsRemoteStatusYou");
						switch (result.status) {
							case "ok":
								return TextGet("CommandModsRemoteStatusOk");
							case "declined":
								return TextGet("CommandModsRemoteStatusDeclined");
							case "error":
								return TextGet("CommandModsRemoteStatusError");
							case "timeout":
								return TextGet("CommandModsRemoteStatusTimeout");
						}
					})();
					const versionLabel = character?.OnlineSharedSettings?.GameVersion ?? "R?";
					const isOne = array.length === 1;

					return {
						tag: "details",
						attributes: { open: isOne ? true : undefined },
						classList: ["chat-room-mods-remote-player"],
						children: [
							{
								tag: "summary",
								classList: ["chat-room-mods-remote-player-summary"],
								children: [
									label,
									" ",
									{ tag: "span", classList: ["chat-room-mods-remote-version-badge"], children: [versionLabel] },
									" ",
									{ tag: "span", classList: ["chat-room-mods-remote-status-badge", "no-select"], children: [statusLabel] },
									result.status === "ok" ? {
										tag: "div",
										classList: ["chat-room-mods-panel-actions"],
										children: [
											this._BuildCopyButton(memberNumber.toString(), result.mods ?? [], character),
										],
									} : undefined,
								],
							},
							result.status === "ok"
								? this._BuildList(result.mods ?? [])
								: {
									tag: "p",
									classList: ["chat-room-mods-remote-status-msg", "no-select"],
									children: [
										result.status === "declined"
											? TextGet("CommandModsRemoteDeclinedBody")
											: result.status === "error"
												? TextGet("CommandModsRemoteErrorBody")
												: TextGet("CommandModsRemoteTimeoutBody"),
									],
								},
						],
					};
				}),
		});
	},

	_FinalizeRemote() {
		const active = this._ActiveRemoteRequest;
		if (!active || active.finalized) return;
		active.finalized = true;
		clearTimeout(active.timeoutId);
		const loading = active.rootEl.querySelector(".chat-room-mods-remote-progress");
		if (loading) loading.replaceWith(this._BuildDetailsBody(active.results));
		active.rootEl.setAttribute("aria-busy", "false");
		this._ActiveRemoteRequest = null;
		ElementScrollToEnd("TextAreaChatLog");
	},

	_OnRemoteTimeout() {
		const active = this._ActiveRemoteRequest;
		if (!active || active.finalized) return;
		for (const memberNumber of active.pending) {
			active.results.set(memberNumber, { status: "timeout" });
		}
		active.pending.clear();
		this._FinalizeRemote();
	},

	/** @param {ServerChatRoomMessage} data */
	_HandleRemoteQuery(data) {
		const payload = data.Dictionary?.find(IsModSdkModsQueryPayload);
		if (!payload?.RequestId || data.Sender === Player.MemberNumber) return;
		const isDeclined = Player.OnlineSettings.RespondRemoteModListQueries === false;
		ServerSend("ChatRoomChat", {
			Content: "ModSdkModsReply",
			Type: "Hidden",
			Target: data.Sender,
			Dictionary: [{
				Tag: "ModSdkModsReplyPayload",
				RequestId: payload.RequestId,
				Status: isDeclined ? "declined" : "ok",
				ModsJson: isDeclined ? undefined : JSON.stringify(this._GetLocalSorted()),
			}],
		});
	},

	/**
	 * @param {ServerChatRoomMessage} data
	 * @param {OnlineCharacter} senderCharacter
	 */
	_HandleRemoteReply(data, senderCharacter) {
		const payload = data.Dictionary?.find(IsModSdkModsReplyPayload);
		const active = this._ActiveRemoteRequest;
		if (!payload?.RequestId || !active || active.finalized || payload.RequestId !== active.requestId || !active.pending.has(senderCharacter.MemberNumber)) return;
		active.pending.delete(senderCharacter.MemberNumber);

		if (payload.Status === "declined" || payload.Status === "error") {
			active.results.set(senderCharacter.MemberNumber, { status: payload.Status });
		} else {
			try {
				const mods = payload.ModsJson ? JSON.parse(payload.ModsJson) : [];
				active.results.set(
					senderCharacter.MemberNumber,
					Array.isArray(mods) ? { status: "ok", mods: /** @type {ModSDKModInfo[]} */(mods) } : { status: "error" },
				);
			} catch {
				active.results.set(senderCharacter.MemberNumber, { status: "error" });
			}
		}

		this._UpdateRemoteProgress();
		if (active.pending.size === 0) {
			this._FinalizeRemote();
		}
	},
};
// #endregion Mods List
