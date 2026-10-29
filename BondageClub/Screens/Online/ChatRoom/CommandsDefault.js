'use strict';

/**
 * @type {ICommand[]}
 */
const CommonCommands = [
	{
		Tag: 'dice',
		Action: args => {
			let DiceNumber = 0;
			let DiceSize = 0;

			// The player can roll X dice of Y faces, using XdY.  If no size is specified, a 6 sided dice is assumed
			if (/(^\d+)[dD](\d+$)/.test(args)) {
				const Roll = /(^\d+)[dD](\d+$)/.exec(args);
				DiceNumber = (!Roll) ? 1 : parseInt(Roll[1]);
				DiceSize = (!Roll) ? 6 : parseInt(Roll[2]);
				if ((DiceNumber < 1) || (DiceNumber > 100)) DiceNumber = 1;
			}
			else if (/(^\d+$)/.test(args)) {
				const Roll = /(^\d+)/.exec(args);
				DiceNumber = 1;
				DiceSize = (!Roll) ? 6 : parseInt(Roll[1]);
			}

			// If there's at least one dice to roll
			if (DiceNumber > 0) {
				if ((DiceSize < 2) || (DiceSize > 100)) DiceSize = 6;
				let CurrentRoll = 0;
				const Result = [];
				let Total = 0;
				while (CurrentRoll < DiceNumber) {
					let Roll = Math.floor(Math.random() * DiceSize) + 1;
					Result.push(Roll);
					Total += Roll;
					CurrentRoll++;
				}
				if (DiceNumber > 1) {
					Result.sort((a, b) => a - b);
				}

				const Dictionary = new DictionaryBuilder()
					.sourceCharacter(Player)
					.text("DiceType", DiceNumber.toString() + "D" + DiceSize.toString())
					.if(DiceNumber > 1)
					.text("DiceResult", Result.toString() + " = " + Total.toString())
					.endif()
					.if(DiceNumber === 1)
					.text("DiceResult", Total.toString())
					.endif()
					.build();
				ServerSend("ChatRoomChat", { Content: "ActionDice", Type: "Action", Dictionary: Dictionary });
			}
		}
	},
	{
		Tag: 'coin',
		Action: () => {
			const Heads = Math.random() >= 0.5;

			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.textLookup("CoinResult", Heads ? "Heads" : "Tails")
				.build();
			ServerSend("ChatRoomChat", { Content: "ActionCoin", Type: "Action", Dictionary: Dictionary });
		}
	},
	{
		Tag: 'safeword',
		Action: () => ChatRoomSafewordChatCommand(),
	},
	{
		Tag: 'friendlistadd',
		Action: args => {
			const number = CommonParseInt(args);
			if (number === null) return;
			ChatRoomListUpdate(Player.FriendList, true, number);
		},
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to add to friend list",
			suggestions: () => ChatRoomCharacter.filter(c => !c.IsPlayer() && !c.IsFriend()).map(c => c.MemberNumber.toString()),
		}]
	},
	{
		Tag: 'friendlistrequest',
		Action: args => {
			const number = CommonParseInt(args);
			if (number === null) return;
			ChatRoomListUpdate(Player.FriendList, true, number, "FriendRequest");
		},
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of the player to request friendship with",
			suggestions: () => ChatRoomCharacter.filter(c => !c.IsPlayer() && !c.IsFriend()).map(c => c.MemberNumber.toString()),
		}]
	},
	{
		Tag: 'friendlistremove',
		Action: args => {
			const number = CommonParseInt(args);
			if (number === null) return;
			ChatRoomListUpdate(Player.FriendList, false, number);
		},
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to remove from friend list",
			suggestions: () => Player.FriendList.map(c => c.toString()),
		}]
	},
	{
		Tag: 'ghostadd',
		Action: args => {
			const number = CommonParseInt(args);
			if (number === null) return;
			ChatRoomListUpdate(Player.GhostList, true, number);
		},
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to add to ghost list",
			suggestions: () => ChatRoomCharacter.filter(c => !c.IsPlayer() && !c.IsGhosted()).map(c => c.MemberNumber.toString()),
		}]
	},
	{
		Tag: 'ghostremove',
		Action: args => {
			const number = CommonParseInt(args);
			if (number === null) return;
			ChatRoomListUpdate(Player.GhostList, false, number);
		},
		Arguments: [{
			id: "Member number",
			name: "Member number",
			description: "Member number of player to remove from ghost list",
			suggestions: () => Player.GhostList.map(c => c.toString()),
		}]
	},
	{
		Tag: 'whitelistadd',
		Action: args => {
			const number = CommonParseInt(args);
			if (number === null) return;
			ChatRoomListUpdate(Player.WhiteList, true, number);
		},
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to add to whitelist",
			suggestions: () => ChatRoomCharacter.filter(c => !c.IsPlayer() && !c.IsWhitelisted()).map(c => c.MemberNumber.toString()),
		}]
	},
	{
		Tag: 'whitelistremove',
		Action: args => {
			const number = CommonParseInt(args);
			if (number === null) return;
			ChatRoomListUpdate(Player.WhiteList, false, number);
		},
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to remove from whitelist",
			suggestions: () => Player.WhiteList.map(c => c.toString()),
		}]
	},
	{
		Tag: 'blacklistadd',
		Action: args => {
			const number = CommonParseInt(args);
			if (number === null) return;
			ChatRoomListUpdate(Player.BlackList, true, number);
		},
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to add to blacklist",
			suggestions: () => ChatRoomCharacter.filter(c => !c.IsPlayer() && !c.IsBlacklisted()).map(c => c.MemberNumber.toString()),
		}]
	},
	{
		Tag: 'blacklistremove',
		Action: args => {
			const number = CommonParseInt(args);
			if (number === null) return;
			ChatRoomListUpdate(Player.BlackList, false, number);
		},
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to remove from blacklist",
			suggestions: () => Player.BlackList.map(c => c.toString()),
		}]
	},
	{
		Tag: 'showblacklist',
		Action: () => {
			let msg = TextGet('CommandBlacklist') + '\n';
			msg += Player.BlackList.sort((i, j) => i - j).map(num => `• ${num}`).join('\n');
			ChatRoomSendLocal(msg);
		}
	},
	{
		Tag: 'showwhitelist',
		Action: () => {
			let msg = TextGet('CommandWhitelist') + '\n';
			msg += Player.WhiteList.sort((i, j) => i - j).map(num => `• ${Player.FriendNames.get(num) ?? "?"} (${num})`).join('\n');
			ChatRoomSendLocal(msg);
		}
	},
	{
		Tag: 'showghostlist',
		Action: () => {
			let msg = TextGet('CommandGhostlist') + '\n';
			msg += Player.GhostList.sort((i, j) => i - j).map(num => `• ${num}`).join('\n');
			ChatRoomSendLocal(msg);
		}
	},
	{
		Tag: 'showfriendlist',
		Action: () => {
			let msg = TextGet('CommandFriendlist') + '\n';
			msg += Player.FriendList.sort((i, j) => i - j).map(num => `• ${Player.FriendNames.get(num) ?? "?"} (${num})`).join('\n');
			ChatRoomSendLocal(msg);
		},
	},
	{
		Tag: 'openfriendlist',
		Action: () => {
			ElementToggleGeneratedElements(CurrentScreen, false);
			FriendListReturn = { Screen: CurrentScreen, Module: CurrentModule, IsInChatRoom: true };
			CommonSetScreen("Character", "FriendList");
		},
	},
	{
		Tag: 'ban',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Ban", args),
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to ban",
			suggestions: () => ChatRoomCharacter.filter(c => !c.IsPlayer() && !!ChatRoomData && !ChatRoomData.Ban.includes(c.MemberNumber)).map(c => c.MemberNumber.toString()),
		}]
	},
	{
		Tag: 'unban',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Unban", args),
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to unban",
			suggestions: () => ChatRoomData?.Ban.map(c => c.toString()) ?? [],
		}]
	},
	{
		Tag: 'kick',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Kick", args),
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to kick",
			suggestions: () => ChatRoomCharacter.filter(c => !c.IsPlayer()).map(c => c.MemberNumber.toString()),
		}]
	},
	{
		Tag: 'promote',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Promote", args),
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to promote",
			suggestions: () => ChatRoomCharacter.filter(c => !c.IsPlayer() && !!ChatRoomData && !ChatRoomData.Admin.includes(c.MemberNumber)).map(c => c.MemberNumber.toString()),
		}]
	},
	{
		Tag: 'demote',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Demote", args),
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to demote",
			suggestions: () => ChatRoomData?.Admin.map(c => c.toString()) ?? [],
		}]
	},
	{
		Tag: 'roomwhitelist',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Whitelist", args),
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to whitelist",
			suggestions: () => ChatRoomCharacter.filter(c => !c.IsPlayer() && !!ChatRoomData && !ChatRoomData.Whitelist.includes(c.MemberNumber)).map(c => c.MemberNumber.toString()),
		}]
	},
	{
		Tag: 'roomunwhitelist',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Unwhitelist", args),
		Arguments: [{
			id: "member-number",
			name: "Member number",
			description: "Member number of player to unwhitelist",
			suggestions: () => ChatRoomData?.Whitelist.map(c => c.toString()) ?? [],
		}]
	},
	{
		Tag: 'focus',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: (args) => {
			const parts = args.split(' ');

			const subcommand = parts.length > 0 ? parts[0].toLowerCase() : 'help';
			if (/^(add|remove)$/.test(subcommand)) {
				if (parts.length === 1) {
					ChatRoomSendLocal(TextGet("CommandFocusNoTargets"), 30_000);
					return;
				}
				// TODO: use ChatRoomGetCharacter
				/** @type {Character[]} */
				const matchingCharacters = [];
				parts.slice(1).forEach(targeter => { // For each targeter the user provided
					const memberNumber = parseInt(targeter);
					const targeterSanitized = ChatRoomHTMLEntities(targeter);

					let targeterResult = ChatRoomCharacter.find(C => // Attempt to first find an exact match
						!C.IsPlayer() &&
						(
							C.MemberNumber === memberNumber ||
							C.Name.toLowerCase() === targeter.toLowerCase() ||
							C.Nickname?.toLowerCase() === targeter.toLowerCase()
						)
					);
					if (!targeterResult) { // If no exact match, attempt a partial match
						const partialMatches = ChatRoomCharacter.filter(C =>
							!C.IsPlayer() &&
							(
								C.Name.toLowerCase().includes(targeter.toLowerCase()) ||
								C.Nickname?.toLowerCase().includes(targeter.toLowerCase())
							)
						);

						if (partialMatches.length === 1) { // If only one partial match, use it
							targeterResult = partialMatches[0];
						} else if (partialMatches.length > 1) { // If multiple partial matches, inform the user
							ChatRoomSendLocal(TextGet("CommandFocusTargeterAmbiguous").replace("Targeter", targeterSanitized), 5_000);
							return;
						}
					}

					if (targeterResult) {
						if (matchingCharacters.includes(targeterResult)) { // If the targeter is already in the list, don't add it again
							ChatRoomSendLocal(TextGet("CommandFocusTargeterDuplicate").replace("Targeter", targeterSanitized), 5_000);
						} else {
							matchingCharacters.push(targeterResult);
						}
					} else {
						ChatRoomSendLocal(TextGet("CommandFocusTargeterNoMatch").replace("Targeter", targeterSanitized), 5_000);
					}
				});

				if (matchingCharacters.length === 0) {
					ChatRoomSendLocal(TextGet("CommandFocusNoTargets"), 10_000);
					return;
				}

				/** @type {Character[]} */
				let changed;
				if (subcommand === 'add') {
					changed = ChatRoomDrawFocusListAdd(matchingCharacters);
				} else if (subcommand === 'remove') {
					changed = ChatRoomDrawFocusListRemove(matchingCharacters);
				} else { // Shouldn't happen, but sanity check
					return;
				}
				ChatRoomSendLocal(
					TextGet(`CommandFocusSuccess${subcommand.charAt(0).toUpperCase()}${subcommand.slice(1)}`)
						.replace("Changed", changed.map(C => `${CharacterNickname(C)} (${C.MemberNumber})`).join(", ")),
					10_000
				);
			} else if (/^(list|clear)$/.test(subcommand) && parts.length === 1) {
				if (subcommand === 'list') {
					ChatRoomSendLocal(TextGet("CommandFocusList") + "<br>" + ChatRoomDrawFocusList.map(C => `${CharacterNickname(C)} (${C.MemberNumber})`).join("<br>"), 30_000);
				} else if (subcommand === 'clear') {
					ChatRoomDrawFocusListClear();
					ChatRoomSendLocal(TextGet("CommandFocusSuccessClear"), 10_000);
				}
			} else { // If the subcommand is not recognized (also handles the "help" subcommand implicitly)
				ChatRoomSendLocal(
					`<code>${TextGet("CommandFocusHelpSyntax")}</code>` +
					"<br><br>" +
					TextGet("CommandFocusHelpSummary").replaceAll("FocusEnabledWarningIcon", TextGet("FocusEnabledWarningIcon")) +
					"<br><br>" +
					TextGet("CommandFocusHelpNotesHeader") +
					"<br><ul>" +
					TextGet("CommandFocusHelpNotes") +
					"</ul><br>" +
					TextGet("CommandFocusHelpSubcommandsHeader") +
					"<br><ul>" +
					`<li><code>add [targeter(s)]</code>: ${TextGet("CommandFocusHelpAdd")}</li>` +
					`<li><code>remove [targeter(s)]</code>: ${TextGet("CommandFocusHelpRemove")}</li>` +
					`<li><code>list</code>: ${TextGet("CommandFocusHelpList")}</li>` +
					`<li><code>clear</code>: ${TextGet("CommandFocusHelpClear")}</li>` +
					`<li><code>help</code>: ${TextGet("CommandFocusHelpHelp")}</li>` +
					"</ul><br>" +
					TextGet("CommandFocusHelpTargeters"),
					120_000
				);
			}
		}
	},
	{
		Tag: 'focusadd',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: (args) => CommandExecute("/focus add " + args),
	},
	{
		Tag: 'focusremove',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: (args) => CommandExecute("/focus remove " + args),
	},
	{
		Tag: 'focuslist',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: () => CommandExecute("/focus list"),
	},
	{
		Tag: 'focusclear',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: () => CommandExecute("/focus clear"),
	},
	{
		Tag: 'focushelp',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: () => CommandExecute("/focus help"),
	},
	{
		Tag: 'me',
		Action: (msg) => {
			ChatRoomSendEmote(msg);
		}
	},
	{
		Tag: 'attempt',
		Action: (_, msg, parsed) => {
			if (parsed[0]?.match(/(\d{0,2}|100)%/))
				ChatRoomSendEmote(msg);
		}
	},
	{
		Tag: 'action',
		PreserveCase: true,
		Action: (msg) => ChatRoomSendEmote(`**${msg}`),
	},
	{
		Tag: 'pandora',
		Action: args => PandoraPenitentiaryDoActivity(args),
		Arguments: [{
			id: "activity",
			name: "Activity",
			description: "Activity to perform",
			suggestions: () => PandoraPenitentiaryActivityList
		}]
	},
	{
		Tag: 'help',
		Action: args => CommandsHelp.ShowForPartial(args),
		Arguments: [{
			id: "subcommand",
			name: "subcommand",
			description: "The subcommand to print help for",
			suggestions: () => GetCommands().map(c => c.Tag)
		}]
	},
	{
		Tag: 'afk',
		Action: () => {
			const expression = WardrobeGetExpression(Player).Emoticon != "Afk" ? "Afk" : null;
			CharacterSetFacialExpression(Player, "Emoticon", expression);
			Player.ActiveExpression.Emoticon = expression;
		}
	},
	{
		Tag: 'brb',
		Action: () => {
			const expression = WardrobeGetExpression(Player).Emoticon != "Brb" ? "Brb" : null;
			CharacterSetFacialExpression(Player, "Emoticon", expression);
			Player.ActiveExpression.Emoticon = expression;
		}
	},
	{
		Tag: 'sos',
		Action: () => {
			const expression = WardrobeGetExpression(Player).Emoticon != "SOS" ? "SOS" : null;
			CharacterSetFacialExpression(Player, "Emoticon", expression);
			Player.ActiveExpression.Emoticon = expression;
		}
	},
	{
		Tag: 'expr',
		Action: args => {
			if (args.trim() == "") {
				ChatRoomFocusCharacter(Player, { selfMode: "SavedExpressions" });
			} else if (/^[0-5]$/.test(args)) {
				let ExprNum = parseInt(args);
				if (ExprNum == 0) {
					CharacterResetFacialExpression(Player);
				} else {
					DialogFacialExpressionsLoad(ExprNum - 1);
				}
			}
		}
	},
	{
		Tag: 'blush',
		Action: args => {
			if (args.trim() == "") {
				ChatRoomFocusCharacter(Player, { selfMode: "Expression" });
				DialogFindFacialExpressionMenuGroup("Blush");
				return;
			}
			/** @type {(null | ExpressionNameMap["Blush"])[]} */
			let BlushLevels = [null, "Low", "Medium", "High", "VeryHigh", "Extreme"];
			/** @type {null | ExpressionNameMap["Blush"]} */
			let NewExpression = null;
			let AcceptCmd = false;
			if (/^[0-5]$/.test(args)) {
				AcceptCmd = true;
				let BlushNum = parseInt(args);
				NewExpression = BlushLevels[BlushNum];
			} else if (/^(b(?:lue)?)$/.test(args)) {
				AcceptCmd = true;
				NewExpression = "ShortBreath";
			} else if (/^(\+|-)$/.test(args)) {
				AcceptCmd = true;
				const Blush = InventoryGet(Player, "Blush");
				let CurrentBlush = null;
				if (Blush && Blush.Property && Blush.Property.Expression) {
					CurrentBlush = Blush.Property.Expression;
				}
				let Level = 0;
				for (let i = 0; i < BlushLevels.length; i++) {
					if (CurrentBlush == BlushLevels[i]) {
						Level = i;
						break;
					}
				}
				if (args == "+") {
					Level++;
				} else {
					Level--;
				}
				Level = Math.max(0, Level);
				Level = Math.min(BlushLevels.length - 1, Level);
				NewExpression = BlushLevels[Level];
			}
			if (AcceptCmd) {
				CharacterSetFacialExpression(Player, "Blush", NewExpression);
				Player.ActiveExpression.Blush = NewExpression;
			}
		}
	},
	{
		Tag: 'eyes',
		Action: args => {
			if (args.trim() == "") {
				ChatRoomFocusCharacter(Player, { selfMode: "Expression" });
				DialogFindFacialExpressionMenuGroup("Eyes");
				return;
			}
			let AcceptCmd = false;
			/** @type {ExpressionNameMap["Eyes"] | "Open"} */
			let NewExpression = "Open";
			let TargetLeft = false;
			let TargetRight = false;
			let Cmds;
			if (/^(r(?:ight)?|l(?:eft)?|b(?:oth)?)$/.test(args)) {
				AcceptCmd = true;
				if (args[0] == "r" || args[0] == "b") TargetRight = true;
				if (args[0] == "l" || args[0] == "b") TargetLeft = true;
				let LeftClosed = InventoryGet(Player, "Eyes")?.Property?.Expression == "Closed";
				let RightClosed = InventoryGet(Player, "Eyes2")?.Property?.Expression == "Closed";
				let Close = (TargetLeft && !LeftClosed);
				Close = Close || (TargetRight && !RightClosed);
				NewExpression = Close ? "Closed" : "Open";
			} else if ((Cmds = /^(c(?:lose)?|o(?:pen)?) *(r(?:ight)?|l(?:eft)?|b(?:oth)?)?$/.exec(args)) != null) {
				AcceptCmd = true;
				let ActionCmd = Cmds[1];
				let TargetCmd = Cmds[2];
				NewExpression = (ActionCmd[0] == "c") ? "Closed" : "Open";
				if (!TargetCmd || TargetCmd[0] == "r" || TargetCmd[0] == "b") {
					TargetRight = true;
				}
				if (!TargetCmd || TargetCmd[0] == "l" || TargetCmd[0] == "b") {
					TargetLeft = true;
				}
			} else if (/^(default|dazed|shy|sad|horny|lewd|verylewd|heart|<3|heartpink|lewdheart|lewdheartpink|dizzy|@@|daydream|><|shylyhappy|\^\^|angry|èé|surprised|éè|scared)$/.test(args)) {
				AcceptCmd = true;
				if (args == "default") NewExpression = null;
				else if (args == "dazed") NewExpression = "Dazed";
				else if (args == "shy") NewExpression = "Shy";
				else if (args == "sad") NewExpression = "Sad";
				else if (args == "horny") NewExpression = "Horny";
				else if (args == "lewd") NewExpression = "Lewd";
				else if (args == "verylewd") NewExpression = "VeryLewd";
				else if (args == "heart" || args == "<3") NewExpression = "Heart";
				else if (args == "heartpink") NewExpression = "HeartPink";
				else if (args == "lewdheart") NewExpression = "LewdHeart";
				else if (args == "lewdheartpink") NewExpression = "LewdHeartPink";
				else if (args == "dizzy" || args == "@@") NewExpression = "Dizzy";
				else if (args == "daydream" || args == "><") NewExpression = "Daydream";
				else if (args == "shylyhappy" || args == "^^") NewExpression = "ShylyHappy";
				else if (args == "angry" || args == "èé") NewExpression = "Angry";
				else if (args == "surprised" || args == "éè") NewExpression = "Surprised";
				else if (args == "scared") NewExpression = "Scared";
			}
			if (!AcceptCmd) {
				return;
			}
			if (NewExpression == "Open" || NewExpression == "Closed") {
				const eyeExpression = NewExpression === "Closed" ? "Closed" : Player.ActiveExpression.Eyes;
				if (TargetLeft && TargetRight) {
					CharacterSetFacialExpression(Player, "Eyes", eyeExpression);
				} else if (TargetLeft) {
					CharacterSetFacialExpression(Player, "Eyes1", eyeExpression);
				} else if (TargetRight) {
					CharacterSetFacialExpression(Player, "Eyes2", eyeExpression);
				}
			} else {
				// Apply new expression only to eyes that are opened
				let LeftClosed = InventoryGet(Player, "Eyes")?.Property?.Expression === "Closed";
				let RightClosed = InventoryGet(Player, "Eyes2")?.Property?.Expression === "Closed";
				if (!LeftClosed) {
					CharacterSetFacialExpression(Player, "Eyes1", NewExpression);
					Player.ActiveExpression.Eyes = NewExpression;
				}
				if (!RightClosed) {
					CharacterSetFacialExpression(Player, "Eyes2", NewExpression);
					Player.ActiveExpression.Eyes = NewExpression;
				}
			}
		}
	},
	{
		Tag: 'bot',
		Action: (_, msg) => {
			const matches = ChatRoomCharacter.filter(c => !c.IsPlayer() && c.MemberNumber >= 0);
			for (const match of matches) {
				ServerSend("ChatRoomChat", { Content: "ChatRoomBot " + msg.substring(4), Type: "Hidden", Target: match.MemberNumber });
			}
		}
	},
	{
		Tag: "craft",
		Action: () => {
			CraftingShowScreen(true);
		},
	},
	{
		Tag: "forbiddenwords",
		Action: () => {

			// No forbidden words if not owned
			if (CurrentScreen != "ChatRoom") return;
			if (!Player.IsOwned()) return;

			// Gets the forbidden words list from the log
			let ForbiddenList = LogGetStringArray("ForbiddenWords", "OwnerRule");
			if (!ForbiddenList || ForbiddenList.length <= 1) return;
			// Remove the punishment
			ForbiddenList.splice(0, 1);

			// Shows the list in the chat window
			ChatRoomSendLocal(ChatRoomHTMLEntities(ForbiddenList.join(", ")));

		},
	},
	{
		Tag: "wheel",
		Action: () => {
			if (!InventoryAvailable(Player, "WheelFortune", "ItemDevices")) return;
			WheelFortuneReturnScreen = CommonGetScreen();
			WheelFortuneBackground = ChatRoomData?.Background ?? "";
			WheelFortuneCharacter = Player;
			CommonSetScreen("MiniGame", "WheelFortune");
		},
	},
	{
		Tag: "release",
		Action: args => {
			let MemberNumber = parseInt(args);
			if ((typeof MemberNumber == "number") && !isNaN(MemberNumber) && (MemberNumber >= 0))
				ServerSend("AccountOwnership", { MemberNumber: MemberNumber, Action: "Release" });
		},
	},
	{
		Tag: "roomcustom",
		Action: (cmd, msg, args) => {
			ChatAdminRoomCustomizationCommand(args);
		},
		Arguments: [
			{
				id: "enable|disable",
				description: "Enable/disable the room customization",
			},
			{
				id: "image [URL|-]",
				description: "Use URL as the room background. `-` to unset",
			},
			{
				id: "filter [#hexcode|-]",
				description: "Use hexcode as the room effect. `-` to unset",
			},
			{
				id: "music [URL|-]",
				description: "Use URL as the room background music. `-` to unset",
			},
			{
				id: "sync [on|off]",
				description: "Enable/disable music syncing",
			},
		],
	},
	{
		Tag: "customimage",
		Action: args => { ChatAdminRoomCustomizationCommand(["image", args]); },
	},
	{
		Tag: "customfilter",
		Action: args => { ChatAdminRoomCustomizationCommand(["filter", args]); },
	},
	{
		Tag: "custommusic",
		Action: args => { ChatAdminRoomCustomizationCommand(["music", args]); },
	},
	{
		Tag: "appcopy",
		Action: () => { CharacterAppearanceCopyToClipboard(Player); },
	},
	{
		Tag: "apppaste",
		Action: (_, msg) => {
			let CompApp = msg.substring("/apppaste".length).trim();
			if (CompApp.length) {
				CharacterAppearancePaste(Player, CompApp, true);
				return;
			}
			CommonClipboardRead((res) => {
				if (res.value) {
					CharacterAppearancePaste(Player, res.value, true);
				} else {
					ToastManager.error(res.errorAsDOM(InterfaceTextGet("AppPasteError")));
				}
			});
		},
	},
	{
		Tag: "mapcopy",
		Action: () => { ChatRoomMapViewCopy(); },
	},
	{
		Tag: "mappaste",
		Action: (_, msg) => {
			let MapData = msg.substring("/mappaste".length).trim();
			if (MapData.length) {
				ChatRoomMapViewPaste(MapData);
				return;
			}
			CommonClipboardRead((res) => {
				if (res.value) {
					ChatRoomMapViewPaste(res.value);
				} else {
					ToastManager.error(res.errorAsDOM(TextGet("MapPasteError")));
				}
			});
		},
	},
	{
		Tag: "whisper",
		Action: (args, command) => {
			const [, ...parts] = command.split(" ");
			const target = parts?.shift();
			const message = parts?.join(" ");

			// Logic for handling empty command or missing target
			if (!target) {
				if (ChatRoomTargetMemberNumber >= 0) {
					ChatRoomSetTarget(-1);
					ChatRoomSendLocal(`${TextGet("CommandWhisperStopSuccess")}`, 30000);
				} else {
					ChatRoomSendLocal(`${TextGet("CommandNoWhisperTargetSelected")}`, 30000);
				}

				return;
			}
			// TODO: use ChatRoomGetCharacter
			// Getting all members that fit our request
			const matchingMembers = ChatRoomCharacter.filter((C) => {
				const memberNumber = parseInt(target);

				return (
					!C.IsPlayer() &&
					(
						C.MemberNumber == memberNumber ||
						C.Nickname?.toLowerCase() == target.toLowerCase() ||
						C.Name.toLowerCase() == target.toLowerCase()
					)
				);
			});

			// Handling scenarios based on the matching members
			// If there's no matches
			if (!matchingMembers.length) {
				ChatRoomSendLocal(`${TextGet("CommandNoWhisperTarget")} ${target}.`, 30_000);
				// If there's multiple matches
			} else if (matchingMembers.length > 1) {
				const mappedMembers = matchingMembers
					.map((C) => `&emsp;• <strong style="cursor: pointer;" onclick='window.CommandSet("whisper ${C.MemberNumber}")'>${CharacterNickname(C)} (${C.MemberNumber})</strong>`)
					.join("<br>") + "<br>";
				const Targets = `<br>${mappedMembers}`;

				ChatRoomSendLocal(`${TextGet("CommandMultipleWhisperTargets").replace("$Targets", Targets)}`, 30_000);
				// If we have ONE match, but no message
			} else if (matchingMembers.length == 1 && !message) {
				ChatRoomSendLocal(`${TextGet("CommandWhisperTargetSuccess")} ${CharacterNickname(matchingMembers[0])} (${matchingMembers[0].MemberNumber})`, 30_000);
				ChatRoomSetTarget(matchingMembers[0].MemberNumber);
				// If there's ONE match and there's message we want to send
			} else {
				const targetMember = matchingMembers[0];

				// Set whisper target and send message
				const status = ChatRoomSendWhisper(targetMember.MemberNumber, message);
				if (status === "target-gone") {
					ChatRoomSendLocal(`<span style="color: red">${TextGet("WhisperTargetGone")}</span>`);
					return;
				} else if (status === "target-out-of-range") {
					ChatRoomSendLocal(`<span style="color: red">${TextGet("WhisperTargetOutOfRange")}</span>`);
					return;
				}
			}
		},
	},
	{
		Tag: "shop",
		Action: () => {
			/** @type {null | ScreenSpecifier} */
			const screen = CurrentModule && CurrentScreen ? CommonGetScreen() : null;
			/** @type {null | string} */
			let background = null;
			if (ServerPlayerIsInChatRoom()) {
				background = ChatRoomData?.Background ?? null;
				ChatRoomStatusUpdate("Shop");
			}
			Shop2.Init(background, screen);
		},
	},
	{
		Tag: "clubcard",
		Action: () => {
			ChatRoomStatusUpdate("Preference");
			ClubCardBuilderShowScreen(true);
		},
	},
	{
		Tag: "changelog",
		Action: (args, msg, [start, stop]) => {
			const startArray = GameVersionFormat.exec(start?.toUpperCase());
			const stopArray = GameVersionFormat.exec(stop?.toUpperCase());
			const defaultVersion = GameVersionFormat.exec(GameVersion)?.[1];
			if (defaultVersion == null) {
				console.error(`Invalid BC GameVersion: "${GameVersion}"`);
				return;
			} else if ((!startArray && start) || (!stopArray && stop)) {
				const Content = start ? `Invalid [start] version: "${start}"` : `Invalid [stop] version: "${stop}"`;
				ChatRoomMessageDisplay({ Type: "LocalMessage", Content, Timeout: 5000 }, "", Player, {});
				return;
			}

			const startID = `r${startArray?.[1] ?? defaultVersion}`;
			let stopID = stopArray?.[1] != null ? `r${stopArray[1]}` : null;
			if (stopID === startID) {
				stopID = null;
			}

			let changelog = document.getElementById("chat-room-changelog");
			if (changelog) {
				// Move a previously opened changelog to the end of the chat again
				if (changelog.getAttribute("data-start") === startID && changelog.getAttribute("data-stop") === stopID) {
					changelog.remove();
					ChatRoomAppendChat(changelog);
					return;
				} else {
					changelog.remove();
				}
			}

			CommonFetch("./changelog.html")
				.then(async (response) => {
					if (response.status !== 200) return;
					CommandsChangelog.Publish(await response.text(), { id: "chat-room-changelog", startID, stopID });
				}).catch((e) => console.error('Failed to fetch changelog', e));
		},
	},
	{
		Tag: 'pony',
		Action: args => StableDoActivity(args),
		Arguments: [
			{
				id: "activity",
				name: "Activity",
				description: "Activity to perform",
				suggestions: () => StableActivityList
			}
		]
	},
	{
		Tag: 'beep',
		Action: (args) => {
			const parts = args.split(" ");
			const target = CommonParseInt(parts.shift() ?? "");
			const msg = parts.join(" ");

			if (!CommonIsNonNegativeInteger(target)) {
				ChatRoomSendLocal(`<span style="color: red">${TextGet("CommandBeepInvalidTarget").replace('$target', String(target))}</span>`, 5000);
				return;
			} else if (!Player.HasOnFriendlist(target)) {
				ChatRoomSendLocal(`<span style="color: red">${TextGet("CommandBeepNotFriend").replace('$target', target.toString())}</span>`, 5000);
				return;
			} else if (!msg) {
				ChatRoomSendLocal(`<span style="color: red">${TextGet("CommandBeepEmptyMessage")}</span>`, 5000);
				return;
			}

			ServerSendBeepMessage(target, msg);

			const beepId = FriendListBeepLog.length - 1;

			// "Reply to beep" arrow
			const replyLink = ElementButton.Create(
				`beep-reply-${beepId}`,
				() => {
					ElementValue("InputChat", `/beep ${target} ${ElementValue("InputChat").replace(/^\/(beep|w) \S+ ?/u, '')}`);
					document.getElementById('InputChat')?.focus();
				},
				{ noStyling: true },
				{ button: { classList: ["ReplyButton"], children: ['\u21a9\ufe0f'] } },
			);

			const link = document.createElement("a");
			link.id = `#beep-${beepId}`;
			link.onclick = (e) => {
				e.preventDefault();
				FriendListShowBeep(beepId);
			};
			const targetName = Player.FriendNames.get(target) ?? InterfaceTextGet(`ServerBeepUnknownName`).replace('$target', target.toString());
			link.textContent = CommonStringSubstitute(TextGet("CommandBeepLink"), [
				["{NAME}", targetName],
				["{NUMBER}", target.toString()],
				["{MESSAGE}", msg.length > 150 ? `${msg.substring(0, 150)}…` : msg],
			]);
			link.classList.add("beep-link");
			const div = document.createElement("div");
			div.classList.add("ChatMessage", "ChatMessageLocalMessage", "ChatMessageNonDialogue", "ChatMessageBeep");
			div.dataset.time = ChatRoomCurrentTime();
			div.dataset.sender = Player.MemberNumber.toString();
			div.dataset.target = target.toString();
			div.append(replyLink, link);

			document.querySelector(`
				#TextAreaChatLog .ChatMessageBeep[data-sender="${target}"] > .ReplyButton:not([tabindex='-1']),
				#TextAreaChatLog .ChatMessageBeep[data-target="${target}"] > .ReplyButton:not([tabindex='-1'])
			`)?.setAttribute("tabindex", "-1");

			ChatRoomAppendChat(div);
		}
	},
	{
		Tag: 'maptp',
		Action: (args) => {
			if (!ChatRoomPlayerIsAdmin()) return ChatRoomSendLocal("You don't have admin permissions to use this command.");
			if (!ChatRoomMapViewIsActive()) return ChatRoomSendLocal("Only accessible in map mode.");
			const parsed = args.split(" ");
			/** @param {string} value */
			const isCoordinateX = (value) => CommonIsInteger(CommonParseInt(value), 0, ChatRoomMapViewWidth);
			/** @param {string} value */
			const isCoordinateY = (value) => CommonIsInteger(CommonParseInt(value), 0, ChatRoomMapViewHeight);

			/** @param {string} value */
			const isIdentifier = (value) => value && !(isCoordinateX(value) || isCoordinateY(value));

			if (isCoordinateX(parsed[0]) && isCoordinateY(parsed[1])) {
				// maptp <x> <y>
				const position = { X: CommonParseInt(parsed[0]) ?? 0, Y: CommonParseInt(parsed[1]) ?? 0 };
				if (ChatRoomMapViewIsOutOfBounds(position)) return ChatRoomSendLocal(`Teleport: Cannot teleport to ${position.X}, ${position.Y} because out of bounds.`);
				ChatRoomSendLocal(`Teleporting to ${position.X}, ${position.Y}`);
				return ChatRoomMapViewTeleport(Player, position);
			}

			if (isIdentifier(parsed[0]) && isCoordinateX(parsed[1]) && isCoordinateY(parsed[2])) {
				// maptp <player> <x> <y>
				const identifier = parsed[0].replace('@', '');
				const character = ChatRoomGetCharacter(identifier);
				if (!character) return ChatRoomSendLocal(`Teleport: Cannot teleport ${identifier} to ${parsed[1]}, ${parsed[2]} because no such player.`);
				const position = { X: Number(parsed[1]), Y: Number(parsed[2]) };
				if (ChatRoomMapViewIsOutOfBounds(position)) return ChatRoomSendLocal(`Teleport: Cannot teleport ${identifier} to ${position.X}, ${position.Y} because out of bounds.`);
				ChatRoomSendLocal(`Teleporting ${character.Nickname ?? character.Name} to ${position.X}, ${position.Y}`);
				return ChatRoomMapViewTeleport(character, position);
			}

			if (isIdentifier(parsed[0]) && isIdentifier(parsed[1])) {
				// maptp <from player> <to player>
				const fromPlayer = ChatRoomGetCharacter(parsed[0].replace('@', ''));
				const toPlayer = ChatRoomGetCharacter(parsed[1].replace('@', ''));
				if (!fromPlayer) return ChatRoomSendLocal(`Teleport: Cannot teleport ${parsed[0]} to ${parsed[1]} because no such player.`);
				if (!toPlayer || !toPlayer.Position) return ChatRoomSendLocal(`Teleport: Cannot teleport ${parsed[0]} to ${parsed[1]} because no such player.`);
				ChatRoomSendLocal(`Teleporting ${fromPlayer.Nickname ?? fromPlayer.Name} to ${toPlayer.Nickname ?? toPlayer.Name}`);
				return ChatRoomMapViewTeleport(fromPlayer, toPlayer.Position);
			}

			if (isIdentifier(parsed[0])) {
				// maptp <player>
				const character = ChatRoomGetCharacter(parsed[0].replace('@', ''));
				if (!character || !character.Position) return ChatRoomSendLocal(`Teleport: Cannot teleport ${parsed[0]} because no such player.`);
				ChatRoomSendLocal(`Teleporting to ${character.Nickname ?? character.Name}`);
				return ChatRoomMapViewTeleport(Player, character.Position);
			}

			return ChatRoomSendLocal("Invalid arguments:\n- /maptp x y\n- /maptp player x y\n- /maptp from-player to-player\n- /maptp player\nNote: use @ as a prefix for MemberNumbers because of ambiguousness.");
		}
	},
	{
		Tag: 'mapcords',
		Action: (args, msg, parsed) => {
			if (!ChatRoomMapViewIsActive()) return ChatRoomSendLocal("Only accessible in map mode.");

			ChatRoomSendLocal(`Coordinates X, Y: ${Player.X}, ${Player.Y}`);
		}
	},
	{
		Tag: 'mapgivekey',
		Action: (args) => {
			if (!ChatRoomPlayerIsAdmin()) return ChatRoomSendLocal("You don't have admin permissions to use this command.");
			if (!ChatRoomMapViewIsActive()) return ChatRoomSendLocal("Only accessible in map mode.");
			const parsed = args.split(" ");

			if (parsed.length > 4) return ChatRoomSendLocal("Too many arguments. Please use '/mapgivekey [target] [bronze] [silver] [gold]', depending on which ones you want to give to the player.");
			if (parsed.length < 2) return ChatRoomSendLocal("Not enough arguments. Please use '/mapgivekey [target] [bronze] [silver] [gold]', depending on which ones you want to give to the player.");

			const target = ChatRoomGetCharacter(parsed[0]);
			if (!target) return ChatRoomSendLocal("Player not found!");
			parsed.splice(0, 1);

			/** @type {("gold" | "silver" | "bronze")[]} */
			const keys = [];
			for (const arg of parsed) {
				if (arg !== "gold" && arg !== "silver" && arg !== "bronze") {
					return ChatRoomSendLocal(arg + " is not an existing key. Possible keys are: 'bronze', 'silver' or 'gold'.");
				}
				keys.push(arg);
			}

			return ChatRoomMapViewChangeKey(target, keys, true);
		}
	},
	{
		Tag: 'maptakekey',
		Action: (args) => {
			if (!ChatRoomPlayerIsAdmin()) return ChatRoomSendLocal("You don't have admin permissions to use this command.");
			if (!ChatRoomMapViewIsActive()) return ChatRoomSendLocal("Only accessible in map mode.");
			const parsed = args.split(" ");

			if (parsed.length > 4) return ChatRoomSendLocal("Too many arguments. Please use '/maptakekey [target] [bronze] [silver] [gold]', depending on which ones you want to take from the player.");
			if (parsed.length < 2) return ChatRoomSendLocal("Not enough arguments. Please use '/maptakekey [target] [bronze] [silver] [gold]', depending on which ones you want to give take from the player.");

			const target = ChatRoomGetCharacter(parsed[0]);
			if (!target) return ChatRoomSendLocal("Player not found!");
			parsed.splice(0, 1);

			/** @type {("gold" | "silver" | "bronze")[]} */
			const keys = [];
			for (const arg of parsed) {
				if (arg !== "gold" && arg !== "silver" && arg !== "bronze") {
					return ChatRoomSendLocal(arg + " is not an existing key. Possible keys are: 'bronze', 'silver' or 'gold'.");
				}
				keys.push(arg);
			}

			return ChatRoomMapViewChangeKey(target, keys, false);
		}
	},
	{
		Tag: 'clear',
		Action: () => {
			const chatLog = document.querySelector("#TextAreaChatLog");
			const seps = chatLog?.querySelectorAll(".chat-room-sep") ?? [];

			if (seps.length > 0) {
				const lastSep = seps[seps.length - 1];

				// Remove everything before the last separator
				while (chatLog?.firstChild && chatLog.firstChild !== lastSep) {
					chatLog?.removeChild(chatLog.firstChild);
				}

				// Remove everything after the last separator
				while (lastSep.nextSibling) {
					chatLog?.removeChild(lastSep.nextSibling);
				}
			}

			ElementScrollToEnd("TextAreaChatLog");
		}
	},
	{
		Tag: 'arousal',
		Action: (args) => {
			if (!PreferenceArousalAtLeast(Player, "Manual") || PreferenceArousalAtLeast(Player, "Automatic"))
				return ChatRoomSendLocal(TextGet("ArousalNotChangeable"));

			const arousal = CommonParseInt(args);

			if (arousal === null) return ChatRoomSendLocal(TextGet("InvalidNumber"));

			const clamped = CommonClamp(arousal, 0, 100);

			ActivitySetArousal(Player, clamped);
			ActivityExpression(Player, Player.ArousalSettings.Progress);
			if (Player.ArousalSettings.Progress === 100) ActivityOrgasmPrepare(Player);
		}
	},
	{
		Tag: 'mods',
		Action: function () {
			CommandsHelp.ShowFor([this], {
				setCommand: this.Tag,
				command: this,
			});
		},
		Subcommands: [{
			Tag: 'list',
			Action: () => CommandsModsList.ShowLocal(),
		},
		{
			Tag: 'remote',
			Action: args => CommandsModsList.StartRemote(args),
			Arguments: [{
				id: "target",
				suggestions: () => ChatRoomCharacter.flatMap(c => [CharacterNickname(c), String(c.MemberNumber)]),
			}],
		}]
	}
];
