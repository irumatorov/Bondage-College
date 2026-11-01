"use strict";
var ClubCardBackground = "ClubCardPlayBoard1";
var ClubCardColor = ["#808080", "#FFFFFF", "#C6C6C6", "#D0FFD0", "#D0D0FF", "#FFD0D0", "#FFE080"];
var ClubCardFameTextColor = "#5A73FF";
var ClubCardMoneyTextColor = "#228B22";
/** @type {Character} */
var ClubCardOpponent = /** @type {never} */ (null);
/** @type {number[]} */
var ClubCardOpponentDeck = [];
/** @type {null | ClubCard} */
var ClubCardReward = null;
/** @type {boolean} */
var ClubCardInspection = false;
/** @type {boolean} */
var ClubCardOptionSelection = false;
/** @type {boolean} */
var ClubCardGameEnded = false;
/**
 *  The variable allows to capture the mouse hovering over the card from the handler inside the ClubCardRenderCard function.
 * @type {null | ClubCard}
 */
var ClubCardHover = null;
/**
 * Variable through which the current card selected by the player is rendered as a large card.
 * @type {null | ClubCard}
 */
var ClubCardFocus = null;

/** @type {null | ClubCard} */
var ClubCardFocusAI = null;
var ClubCardTurnIndex = 0;
var ClubCardTurnCardPlayed = 0;
var ClubCardTurnEndDraw = false;
var ClubCardFameGoal = 100;
/** @type {ClubCardPopupType | null} */
var ClubCardPopup = null;
/** @type {null | ClubCard} */
var ClubCardSelection = null;
/** @type {null | ClubCard} */
var ClubCardPending = null;
/** @type {null | number} */
var ClubCardTierSelection = null;
var ClubCardLevelLimit = [0, 5, 7, 13, 20, 40];
var ClubCardLevelCost = [0, 0, 10, 20, 30, 40];
var ClubCardLiabilityLimit = [0, 1, 2, 3, 5, 8];
/** @type {ClubCardPlayer[]} */
var ClubCardPlayer = [];
var ClubCardOnlinePlayerMemberNumber1 = -1;
var ClubCardOnlinePlayerMemberNumber2 = -1;
/** @type {ClubCardDefaultDecks} */
var ClubCardDefaultSelection = "Default";
var ClubCardUsePrecon = false;
/**
 * Counter to ensure unique ID incrementation.
 * It is used globally to prevent ID duplication.
 */
let ClubCardUniqueIDCounter = 0;
/**
 * String for a random tier 1 card name. Tier 1 cards have no RequiredLevel or RequiredLevel <= 1
 * @type {string}
 */
let ClubCardRandomCardName = "";

// #region Card Animations
/**
 * Variable to check if the code associated with animations will work or if it will be disabled.
 * @type {boolean}
 */
let ClubCardIsAnimationOn = true;

/**
 * Stores active card animations, updated each frame in ClubCardUpdateCardAnimations().
 * @type {ClubCardActiveAnimation[]}
 */
let ClubCardActiveAnimations = [];

const ClubCardFocusPosition = { x: 725, y: 250, w: 250 };
const ClubCardPendingPosition = { x: 995, y: 400, w: 100 };
const ClubCardDiscardPosition = { x: 0, y: 500, w: 0 };

// #endregion

//#region Chat Log variable

var ClubCardLogScroll = false;
/**
 * Storage for all processed and displayed log messages
 * @type {ClubCardMessage[]}
 */
let ClubCardLog = [];
/**
 * Temporary buffer used for rendering messages before final log update
 * @type {ClubCardMessage[]}
 */
let ClubCardRenderLog = [];
/**
 * Message storage to accumulate messages before processing and sending
 * @type {ClubCardMessage[]}
 */
let ClubCardMessageStorage = [];

const ClubCardMessageType = Object.freeze({
	//Packet Messages Type
	STARTTURNINFO: "StartTurnInfo",  // Turn Idex + Player
	STARTTURNEVENT: "StartTurnEvent", // Quack Doctor, Master Class
	CARDEFFECT: "CardsEffect", // ( Alvin , Nanny , Fussy Baby, Contract Caretaker , etc)
	KNOTEVENT: "KnotEvent",
	TURNENDEFFECT: "TurnEndEffect",
	FAMEMONEYINFO: "FameMoneyInfo", //end turn income and general increase  money and fame.
	VICTORYINFO: "VictoryInfo",

	//Solo Messages Type
	ACTIONSEPARATOR: "ActionSeparator", //for key messages separating one player's turn into parts.
	PREREQUISTITE : "Prerequisite",
	ACTION: "Actions", // Play Card, Draw Card, Level up Club, Bankrupt, give up and leave the game
	SYSTEM: "SystemMessage", // Spectator join or leave , Select Deck
	PLAYERSMESSAGE: "PlayersMessage",
	PLAYERSDISCONNECTED: "PlayersDisconnected",
});

// List of message types that should be sent immediately
const ClubCardImmediateMessageTypes = [
	ClubCardMessageType.ACTIONSEPARATOR,
	ClubCardMessageType.ACTION,
	ClubCardMessageType.PLAYERSMESSAGE,
	ClubCardMessageType.PLAYERSDISCONNECTED,
	ClubCardMessageType.PREREQUISTITE,
	ClubCardMessageType.SYSTEM
];

const ClubCardStartTurnType = Object.freeze({
	PLAYCARD: "PlayCard",
	DRAWENDTURN: "DrawAndEndTurn",
	BANKRUPT: "Bankrupt",
	UPGRADELEVEL: "UpgradeLevel",
	ENDTURN: "EndTurn" // Technical is the start of a new turn.
});

/**
 * Keys for filling in the function parameters ClubCardMessageAdd
 * @satisfies {Record<ClubCardPlaceholderKeysType, ClubCardPlaceholderKeysType>}
 */
const ClubCardPlaceholderKeys = Object.freeze({
	// Auto-generated if FAMEAMOUNT is sent
	MONEYLABEL: "MONEYLABEL",
	// Auto-generated if FAMEAMOUNT is sent
	FAMELABEL: "FAMELABEL",
	AMOUNT: "AMOUNT",
	CARDNAME: "CARDNAME",
	MONEYAMOUNT: "MONEYAMOUNT",
	FAMEAMOUNT: "FAMEAMOUNT",
	TURNNUMBER: "TURNNUMBER",
	PLAYERNAME: "PLAYERNAME",
});

/** @type {boolean} Variable to check if the start function of the turn has already been called or not. */
let ClubCardIsStartTurn = false;

//#endregion Chat Log

/**
 * The card definitions
 *
 * The BeforeTurnEnd hooks are run before regular fame and money are calculated and
 * are a good place to remove cards so they don't add fame/money that turn. Most
 * cards should prefer this hook instead of AfterTurnEnd (including ones that just
 * add extra money / fame).
 *
 * The AfterTurnEnd hooks run after this, and can be used to adjust the total amount
 * of money / fame gained that turn.
 *
 * @type {ClubCard[]}
 */
var ClubCardList = [

	// 1000 - Regular Members (No specific rules)
	{
		ID: 1000,
		Name: "Kinky Neighbor",
		Type: "Member",
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Cute Girl Next Door")) ClubCardPlayerAddMoney(CCPlayer, 2);
		}
	},
	{
		ID: 1001,
		Name: "Cute Girl Next Door",
		FamePerTurn: 1,
	},
	{
		ID: 1002,
		Name: "Voyeur",
		Group: ["Fetishist"],
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			const exhibCount = ClubCardGroupOnBoardCount(CCPlayer, "Exhibitionist") + ClubCardGroupOnBoardCount(opponent, "Exhibitionist") + ClubCardGroupInHandCount(CCPlayer, "Exhibitionist") + ClubCardGroupInHandCount(opponent, "Exhibitionist");
			ClubCardPlayerAddMoney(CCPlayer, Math.min(3, Math.floor(exhibCount / 2)));
			if (exhibCount > 9) ClubCardPlayerAddFame(CCPlayer, 2);
		}
	},
	{
		ID: 1003,
		Name: "Nudist",
		Group: ["Exhibitionist"],
		FamePerTurn: -1,
		MoneyPerTurn: 2,
		Revealed: true
	},
	{
		ID: 1004,
		Name: "Party Animal",
		MoneyPerTurn: 2,
		FamePerTurn: -1
	},
	{
		ID: 1005,
		Name: "Auctioneer",
		MoneyPerTurn: 1
	},
	{
		ID: 1006,
		Name: "Uptown Girl",
		MoneyPerTurn: 2,
		RequiredLevel: 2
	},
	{
		ID: 1007,
		Name: "Tourist",
		MoneyPerTurn: 4,
		FamePerTurn: 2,
		RequiredLevel: 4
	},
	{
		ID: 1008,
		Name: "Diplomat",
		MoneyPerTurn: 6,
		FamePerTurn: 3,
		RequiredLevel: 5
	},
	{
		ID: 1009,
		Name: "Gambler",
		FamePerTurn: -2,
		MoneyPerTurn: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (Math.floor(Math.random() * 2) == 1) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 1010,
		Name: "Red Twin",
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		RequiredLevel: 2
	},
	{
		ID: 1011,
		Name: "Blue Twin",
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Red Twin")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 1012,
		Name: "Rope Bunny",
		MoneyPerTurn: 1,
		RequiredLevel: 2,
		Group: ["Shibari"],
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Dominant")) ClubCardPlayerAddMoney(CCPlayer, 2);
		}
	},
	{
		ID: 1013,
		Name: "Shy Submissive",
		Group: ["Submissive"],
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		turnStart: function(CCPlayer) {
			if ((CCPlayer.Board != null) && (CCPlayer.Board.length >= 6)) ClubCardRemoveFromBoard(CCPlayer, this);
		}
	},
	{
		ID: 1014,
		Name: "Rope Sensei",
		RequiredLevel: 2,
		FamePerTurn: 1,
		MoneyPerTurn: 1,
		Group: ["Shibari", "Sensei"]
	},
	{
		ID: 1015,
		Name: "LARP Queen",
		Reward: "NPC_LARP_Organiser",
		RequiredLevel: 4,
		FamePerTurn: 3,
		MoneyPerTurn: 1
	},
	{
		ID: 1016,
		Name: "Local Influencer",
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -4);
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},
	{
		ID: 1017,
		Name: "Wannabe Princess",
		MoneyPerTurn: 1,
		Reward: "Bondage-Brawl-Maid",
		BeforeTurnEnd: function(CCPlayer) {
			if ((CCPlayer.Level != null) && (CCPlayer.Level >= 5)) ClubCardPlayerAddFame(CCPlayer, 2);
		}
	},
	{
		ID: 1018,
		Name: "Contract Caretaker",
		FamePerTurn: -1,
		MoneyPerTurn: 1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type != "Event" && ClubCardCardHasGroup(cardPlayed,"ABDLBaby") && !ClubCardIsLiability(cardPlayed)) ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -4, this.Name);
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed){
			if (cardPlayed.Type != "Event" && ClubCardCardHasGroup(cardPlayed,"ABDLBaby") && ClubCardIsLiability(cardPlayed)) ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -4, this.Name);
		}
	},
	{
		ID: 1019,
		Name: "Attention Whore",
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		Prerequisite: "SelectAnyEvent",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;

			const target = (ClubCardSelection.Location === "PlayerBoard") ? CCPlayer : ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveFromEvent(target, ClubCardSelection);
		},
	},
	{
		ID: 1020,
		Name: "Tour Guide",
		RequiredLevel: 3,
		FamePerTurn: 1,
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 1);
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Tourist")) ClubCardPlayerAddMoney(CCPlayer, 3);
			if (ClubCardNameIsOnBoard(CCPlayer, "Diplomat")) ClubCardPlayerAddFame(CCPlayer, 3);
		}
	},
	{
		ID: 1021,
		Name: "Troublemaker",
		MoneyPerTurn: 1,
		onOpponentLevelUp: function(CCPlayer) {
			if (!ClubCardNameIsOnBoard(CCPlayer, "Bouncer")) ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -3, this.Name);
		}
	},
	{
		ID: 1022,
		Name: "Insurance Agent",
		turnStart: function(CCPlayer) {
			if (CCPlayer.Hand.length < 1) {
				ClubCardRemoveFromBoard(CCPlayer, this);
				ClubCardPlayerDrawCard(CCPlayer, 3);
			}
		},
		onDrawCard: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 1023,
		Name: "Country Gal",
		RequiredLevel: 2,
		MoneyPerTurn: 3,
		FamePerTurn: -1
	},
	{
		ID: 1024,
		Name: "Ganguro Girl",
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			if ((CCPlayer.Board.length - ClubCardGroupOnBoardCount(CCPlayer, "Liability")) > (opponent.Board.length - ClubCardGroupOnBoardCount(opponent, "Liability"))) ClubCardPlayerAddFame(CCPlayer, -1);
			else if ((CCPlayer.Board.length - ClubCardGroupOnBoardCount(CCPlayer, "Liability")) < (opponent.Board.length - ClubCardGroupOnBoardCount(opponent, "Liability"))) ClubCardPlayerAddFame(opponent, -1);
		}
	},
	{
		ID: 1025,
		Name: "Collector",
		RequiredLevel: 3,
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Slave")) ClubCardPlayerAddFame(CCPlayer, 1);
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "Kemonomimi");
			ClubCardPlayerAddMoney(CCPlayer, Math.min(effectFame, 2));
		}
	},
	{
		ID: 1026,
		Name: "Stalker",
		MoneyPerTurn: 1,
		FamePerTurn: -1
	},
	{
		ID: 1027,
		Name: "Reverse Prayer",
		Group: ["Shibari"],
		Prerequisite: "SelectATier",
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Fame < 41) ClubCardPlayerAddMoney(CCPlayer, 1);
		},
		OnPlay: function () {
			if (ClubCardTierSelection === null) return;
			this.EffectKey = ClubCardTierSelection;
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Reverse Prayer", {[ClubCardPlaceholderKeys.AMOUNT]: ClubCardTierSelection });
		}
	},
	{
		ID: 1028,
		Name: "Plushie",
		OnPlay: function(CCPlayer) {
			this.MoneyPerTurn = Math.min(ClubCardNameCountOnBoard(CCPlayer, "Plushie"), CCPlayer.Level);
			ClubCardPlayerAddFame(CCPlayer, 2);
		}
	},

	// 2000 - Staff Members (Club employees that can be targeted by events)
	{
		ID: 2000,
		Name: "Waitress",
		Group: ["Staff"],
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Party Animal")) ClubCardPlayerAddMoney(CCPlayer, 1);
			if (ClubCardNameIsOnBoard(CCPlayer, "Tourist")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 2001,
		Name: "Bouncer",
		Group: ["Staff"],
		MoneyPerTurn: -1,
		FamePerTurn: 2
	},
	{
		ID: 2002,
		Name: "Accountant",
		Group: ["Staff"],
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Level >= 3) ClubCardPlayerAddMoney(CCPlayer, 1);
			if (CCPlayer.Level >= 5) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 2003,
		Name: "Secretary",
		Group: ["Staff"],
		ExtraTime: 1,
		OnPlay: function(CCPlayer) {
			for (const card of CCPlayer.Event) {
				if (typeof card.Time === "number")
					card.Time++;
			}
		},
		onLeaveClub: function(CCPlayer) {
			for (const card of CCPlayer.Event) {
				if (typeof card.Time === "number")
					card.Time--;
			}
		}
	},
	{
		ID: 2004,
		Name: "Associate",
		Group: ["Staff"],
		MoneyPerTurn: -2,
		ExtraPlay: 1,
		RequiredLevel: 3
	},
	{
		ID: 2005,
		Name: "Human Resource",
		Group: ["Staff"],
		MoneyPerTurn: -1,
		FamePerTurn: 1,
		RequiredLevel: 3,
		onDrawAction: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},

	// 3000 - Police / Criminal Members (Cancel each others and offer protections against events)
	{
		ID: 3000,
		Name: "Policewoman",
		Group: ["Police"],
		MoneyPerTurn: 1,
		FamePerTurn: 2,
		RequiredLevel: 3
	},
	{
		ID: 3001,
		Name: "Pusher",
		Group: ["Criminal"],
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
			else {
				if (ClubCardNameIsOnBoard(CCPlayer, "Sidney")) ClubCardPlayerAddMoney(CCPlayer, 1);
			}
		}
	},
	{
		ID: 3002,
		Name: "Junkie",
		Group: ["Criminal"],
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
			else {
				if (ClubCardNameIsOnBoard(CCPlayer, "Pusher")) ClubCardPlayerAddMoney(CCPlayer, 2);
			}
		}
	},
	{
		ID: 3003,
		Name: "Zealous Cop",
		Group: ["Liability", "Police"],
		RequiredLevel: 2,
		MoneyPerTurn: -1,
		FamePerTurn: -1
	},
	{
		ID: 3004,
		Name: "Gangster",
		Group: ["Criminal"],
		MoneyPerTurn: 4,
		FamePerTurn: -2,
		RequiredLevel: 3,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardRemoveFromBoard(CCPlayer, this);
			else {
				const effectMoney = Math.min((ClubCardGroupOnBoardCount(CCPlayer, "Criminal")) - 1, 5);
				ClubCardPlayerAddMoney(CCPlayer, effectMoney);
			}
		}
	},
	{
		ID: 3005,
		Name: "Paroled Thief",
		Group: ["Liability", "Criminal"],
		RequiredLevel: 3,
		MoneyPerTurn: -2,
		BeforeTurnEnd: function(CCPlayer) {
			if (!ClubCardGroupIsOnBoard(CCPlayer, "Police") || ClubCardNameIsOnBoard(CCPlayer, "The Butler", true)) ClubCardPlayerSteal(ClubCardGetOpponent(CCPlayer), 1, 0);
		}
	},
	{
		ID: 3006,
		Name: "Police Cadet",
		Group: ["Police"],
		FamePerTurn: 1
	},
	{
		ID: 3007,
		Name: "Stepmother",
		Group: ["Criminal"],
		MoneyPerTurn: 8,
		FamePerTurn: -2,
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			let Fame = 0;
			for (const card of CCPlayer.Board) {
				if (card.FamePerTurn && card.FamePerTurn < 0)
					Fame = Fame + 1;
			}
			ClubCardPlayerAddFame(CCPlayer, Fame, this.Name);
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.FamePerTurn && cardPlayed.FamePerTurn < 0 && !ClubCardIsLiability(cardPlayed)) {
				if (cardPlayed.MoneyPerTurn != null) ClubCardPlayerSteal(CCPlayer, 0, cardPlayed.MoneyPerTurn);
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.FamePerTurn && cardPlayed.FamePerTurn < 0 && ClubCardIsLiability(cardPlayed)) {
				if (cardPlayed.MoneyPerTurn != null) ClubCardPlayerSteal(CCPlayer, 0, cardPlayed.MoneyPerTurn);
			}
		}
	},
	{
		ID: 3008,
		Name: "Sheriff",
		Group: ["Police"],
		Reward: "NPC_Pandora_RandomGuard",
		FamePerTurn: 1,
		MoneyPerTurn: 1,
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 2);
		}
	},
	{
		ID: 3009,
		Name: "Detective",
		Group: ["Police"],
		MoneyPerTurn: 1,
		RequiredLevel: 2,
		onOpponentDrawAction: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 2, this.Name);
			if (!ClubCardGroupIsOnBoard(CCPlayer, "Liability")) ClubCardPlayerAddFame(CCPlayer, 1, this.Name);
		}
	},
	{
		ID: 3010,
		Name: "Earner",
		Group: ["Criminal"],
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			const membersInStreets = CCPlayer.DiscardPile.filter(card => card.Type != "Event");
			const effectMoney = Math.min(membersInStreets.length, 5);
			ClubCardPlayerAddMoney(CCPlayer, effectMoney);
		},
		OnPlay: function(CCPlayer) {
			const membersInDeck =  CCPlayer.Deck.filter(card => card.Type != "Event");
			if (membersInDeck.length > 0) {
				const card = membersInDeck[Math.floor(Math.random() * membersInDeck.length)];
				ClubCardPlayerAddMoney(CCPlayer, (card.RequiredLevel ?? 1));
				ClubCardDiscardCard(CCPlayer, CCPlayer.Deck.findIndex(c => c.ID === card.ID), "Deck");
			}
		}
	},
	{
		ID: 3011,
		Name: "Consigliere",
		Group: ["Criminal"],
		MoneyPerTurn: 3,
		FamePerTurn: -1,
		RequiredLevel: 4,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Money > 7) {
				ClubCardPlayerAddMoney(CCPlayer, -8);
				ClubCardPlayerAddFame(CCPlayer, 3);
				ClubCardPlayerDrawCard(CCPlayer, 1);
			}
		}
	},
	{
		ID: 3012,
		Name: "Naughty Baby",
		Group: ["Criminal", "ABDLBaby"],
		MoneyPerTurn: 3,
		FamePerTurn: -1,
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			if (!ClubCardGroupIsOnBoard(CCPlayer, "Police")) ClubCardPlayerSteal(CCPlayer, 4, 0);
			if (!ClubCardGroupIsOnBoard(opponent, "Police") || ClubCardNameIsOnBoard(opponent, "The Butler", true)) ClubCardPlayerSteal(CCPlayer, 0, 4);
		}
	},
	{
		ID: 3013,
		Name: "Sticky Fingers",
		Group: ["Criminal"],
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerSteal(CCPlayer, 0, 2, true);
		},
		onSteal: function(CCPlayer) {
			const _opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardPlayerSteal(CCPlayer, 1, 1, true);
		}
	},
	{
		ID: 3014,
		Name: "Con Artist",
		Group: ["Criminal"],
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		RequiredLevel: 2,
		onDrawAction: function(CCPlayer) {
			if (!ClubCardGroupIsOnBoard(ClubCardGetOpponent(CCPlayer), "Police") || ClubCardNameIsOnBoard(ClubCardGetOpponent(CCPlayer), "The Butler", true)) ClubCardPlayerSteal(CCPlayer, 0, 1);
		}
	},
	{
		ID: 3015,
		Name: "Inspector",
		Group: ["Police"],
		MoneyPerTurn: 1,
		RequiredLevel: 2,
	},
	{
		ID: 3016,
		Name: "Tax Auditor",
		Group: ["Police"],
		MoneyPerTurn: 1,
		Prerequisite: "SelectOpponentMember",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null || typeof ClubCardSelection.ArrayIndex !== "number") return;
			ClubCardGetOpponent(CCPlayer).Board[ClubCardSelection.ArrayIndex].MoneyPerTurn = 1;
		}
	},
	{
		ID: 3017,
		Name: "Beat Cop",
		Group: ["Police"],
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			let cardsToReturn = 3;
			while (cardsToReturn > 0) {
				if (CCPlayer.DiscardPile.length > 0) {
					const randomCard = Math.floor(Math.random() * CCPlayer.DiscardPile.length);
					CCPlayer.Deck.push(CCPlayer.DiscardPile[randomCard]);
					CCPlayer.DiscardPile.splice(randomCard, 1);
				}
				if (opponent.DiscardPile.length > 0) {
					const randomCard = Math.floor(Math.random() * opponent.DiscardPile.length);
					opponent.Deck.push(opponent.DiscardPile[randomCard]);
					opponent.DiscardPile.splice(randomCard, 1);
				}
				cardsToReturn--;
			}
			CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
			opponent.Deck = ClubCardShuffle(opponent.Deck);
		}
	},
	{
		ID: 3018,
		Name: "Enforcer",
		Group: ["Criminal"],
		MoneyPerTurn: -1,
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			let cardsToDiscard = 3;
			let moneyGain = 0;
			while (cardsToDiscard > 0) {
				const membersInDeck =  CCPlayer.Deck.filter(card => card.Type != "Event");
				if (membersInDeck.length > 0) {
					const card = membersInDeck[Math.floor(Math.random() * membersInDeck.length)];
					moneyGain = moneyGain + (card.RequiredLevel ?? 1);
					ClubCardDiscardCard(CCPlayer, CCPlayer.Deck.findIndex(c => c.ID === card.ID), "Deck");
				}
				cardsToDiscard--;
			}
			ClubCardPlayerAddMoney(CCPlayer, moneyGain, this.Name);
		},
		BeforeTurnEnd: function(CCPlayer) {
			const membersInStreets = CCPlayer.DiscardPile.filter(card => card.Type != "Event");
			const effectFame = Math.min(membersInStreets.length, 7);
			ClubCardPlayerAddFame(CCPlayer, effectFame);
		}
	},
	{
		ID: 3019,
		Name: "Hustler",
		Group: ["Criminal"],
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		RequiredLevel: 2,
		onSteal: function(CCPlayer) {
			let statsToGain = Math.min(ClubCardGroupInDiscardPileCount(CCPlayer, "Criminal"), 4);
			let fameGained = 0;
			let moneyGained = 0;
			while (statsToGain > 0) {
				if ((Math.floor(Math.random() * 2) == 1 && fameGained < 2) || moneyGained == 2) {
					ClubCardPlayerAddFame(CCPlayer, 1);
					fameGained++;
				} else {
					ClubCardPlayerAddMoney(CCPlayer, 1);
					moneyGained++;
				}
				statsToGain--;
			}
		}
	},
	{
		ID: 3020,
		Name: "Jailbird",
		Group: ["Criminal"],
		MoneyPerTurn: 4,
		FamePerTurn: -1,
		RequiredLevel: 3
	},
	{
		ID: 3021,
		Name: "The Butler",
		Group: ["Criminal", "Maid", "Liability"],
		MoneyPerTurn: -1,
		FamePerTurn: 1,
		RequiredLevel: 2,
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Criminal")) ClubCardPlayerSteal(ClubCardGetOpponent(CCPlayer), 1, 0);
		}
	},

	// 4000 - Fetishists (Synergies with other groups)
	{
		ID: 4000,
		Name: "Maid Lover",
		Group: ["Fetishist"],
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, Math.min(3, ClubCardGroupOnBoardCount(CCPlayer, "Maid")));
			let maidsOnBoard = CCPlayer.Board.filter(card => ClubCardCardHasGroup(card, "Maid"));
			let highestMaid = maidsOnBoard.reduce((max, card) => Math.max(max, card.RequiredLevel ?? 1), 0);
			if (highestMaid > 3) {
				ClubCardPlayerAddFame(CCPlayer, 2);
				ClubCardPlayerAddMoney(CCPlayer, -2);
			}
		}
	},
	{
		ID: 4001,
		Name: "Diaper Lover",
		Group: ["Fetishist"],
		MoneyPerTurn: -1,
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, Math.min(ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby"), 3));
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type != "Event" && ClubCardCardHasGroup(cardPlayed, "ABDLBaby") && !ClubCardIsLiability(cardPlayed) && ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby") > 3) ClubCardPlayerDrawCard(CCPlayer, 1);
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type != "Event" && ClubCardCardHasGroup(cardPlayed, "ABDLBaby") && ClubCardIsLiability(cardPlayed) && ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby") > 3) ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},
	{
		ID: 4002,
		Name: "Masochist",
		Group: ["Fetishist", "Slave"],
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Dominant")) {
				ClubCardPlayerAddMoney(CCPlayer, 1);
				ClubCardPlayerAddFame(CCPlayer, 1);
			}
		},
		onDiscardCard: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 4003,
		Name: "Feet Worshiper",
		Group: ["Fetishist"],
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "PornActress") || ClubCardGroupIsOnBoard(CCPlayer, "ABDLMommy"))
				ClubCardPlayerAddMoney(CCPlayer, 2);
		}
	},
	{
		ID: 4004,
		Name: "Fin-Dom Simp",
		Group: ["Fetishist", "Submissive"],
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 3, this.Name);
		},
		BeforeTurnEnd: function(CCPlayer) {
			let domsOnBoard = CCPlayer.Board.filter(card => ClubCardCardHasGroup(card, "Dominant"));
			let moneyGain = domsOnBoard.reduce((max, card) => Math.max(max, card.RequiredLevel ?? 1), 0);
			ClubCardPlayerAddMoney(CCPlayer, moneyGain);

		}
	},
	{
		ID: 4005,
		Name: "Fin-Dom Whale",
		Group: ["Fetishist", "Submissive"],
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 1);
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Mistress") * 2);
		}
	},
	{
		ID: 4006,
		Name: "Porn Addict",
		Group: ["Fetishist"],
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, Math.min(2, ClubCardGroupOnBoardCount(CCPlayer, "PornActress") + ClubCardGroupOnBoardCount(CCPlayer, "Porn")));
		}
	},
	{
		ID: 4007,
		Name: "Rope Slave",
		Group: ["Slave", "Shibari"],
		FamePerTurn: 1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if ((cardPlayed.Type == "Event" && ClubCardCardHasGroup(cardPlayed, "Shibari")) || ClubCardCardHasGroup(cardPlayed, "Knot")) {
				ClubCardPlayerAddMoney(CCPlayer, 1);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Rope Slave", { [ClubCardPlaceholderKeys.MONEYAMOUNT]: 1 }, CCPlayer);
			}
		}
	},
	{
		ID: 4008,
		Name: "Daycare Enthusiast",
		Group: ["Fetishist"],
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "ABDLMommy")) {
				let membersToPlay = CCPlayer.Hand.filter(value => (ClubCardCanSummonCard(CCPlayer, value) && ClubCardCardHasGroup(value, "ABDLBaby")));
				if (membersToPlay.length > 0) {
					const randomMember = membersToPlay[Math.floor(Math.random() * membersToPlay.length)];
					const cardIndexInHand = CCPlayer.Hand.findIndex(value => value.ID === randomMember.ID);
					CCPlayer.Hand.splice(cardIndexInHand, 1);
					ClubCardSummonCard(CCPlayer, randomMember);
				}
			}
		}
	},
	{
		ID: 4009,
		Name: "Shibari Lover",
		Group: ["Fetishist"],
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined);
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Shibari") && cardPlayed.Type != "Event" &&  !ClubCardIsLiability(cardPlayed)) {
				ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined);
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Shibari") && cardPlayed.Type != "Event" &&  ClubCardIsLiability(cardPlayed)) {
				ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined);
			}
		}
	},
	{
		ID: 4010,
		Name: "Pet Sitter",
		Group: ["Fetishist"],
		BeforeTurnEnd: function(CCPlayer) {
			const MaxMoney = 5;
			let Money = Math.min((ClubCardGroupOnBoardCount(CCPlayer, "Pet") + ClubCardGroupOnBoardCount(ClubCardGetOpponent(CCPlayer), "Pet")), MaxMoney);
			ClubCardPlayerAddMoney(CCPlayer, Money);
		},
		BeforeOpponentTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Pet")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 4011,
		Name: "Pet Trainer",
		Group: ["Fetishist"],
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Show Dog")) ClubCardPlayerAddFame(CCPlayer, 3);
		},
		onPlayedCard: function (CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet") && !ClubCardIsLiability(cardPlayed)) ClubCardPlayerAddFame(CCPlayer, 2, this.Name);
		},
		onOpponentPlayedCard: function (CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet") && ClubCardIsLiability(cardPlayed)) ClubCardPlayerAddFame(CCPlayer, 2, this.Name);
		}
	},

	// 5000 - Porn Members (Raise both Fame and Money)
	{
		ID: 5000,
		Name: "Porn Amateur",
		Group: ["PornActress"],
		MoneyPerTurn: 1
	},
	{
		ID: 5001,
		Name: "Porn Movie Director",
		Group: ["Porn"],
		RequiredLevel: 2,
		MoneyPerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer,  Math.min(4, ClubCardGroupOnBoardCount(CCPlayer, "PornActress")));
			ClubCardPlayerAddMoney(CCPlayer, Math.min(4, ClubCardGroupOnBoardCount(CCPlayer, "PornActress")));
		}
	},
	{
		ID: 5002,
		Name: "Porn Lesbian",
		Group: ["PornActress"],
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		RequiredLevel: 3,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupOnBoardCount(CCPlayer, "PornActress") >= 2) ClubCardPlayerAddMoney(CCPlayer, 2);
			if (ClubCardGroupIsOnBoard(CCPlayer, "Fetishist")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 5003,
		Name: "Porn Veteran",
		Group: ["PornActress"],
		MoneyPerTurn: 1,
		FamePerTurn: 2,
		RequiredLevel: 4,
		OnPlay: function (CCPlayer) {
			const amount = 3;
			ClubCardPlayerAddFame(CCPlayer, amount);
			ClubCardPlayerAddMoney(CCPlayer, amount);
			const placeHolder = { [ClubCardPlaceholderKeys.MONEYAMOUNT]: amount, [ClubCardPlaceholderKeys.FAMEAMOUNT]: amount, [ClubCardPlaceholderKeys.CARDNAME]: "Porn Veteran"};
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFameMoney", placeHolder, CCPlayer);
		}
	},
	{
		ID: 5004,
		Name: "Porn Star",
		Group: ["PornActress"],
		MoneyPerTurn: 1,
		FamePerTurn: 4,
		RequiredLevel: 5,
		OnPlay: function (CCPlayer) {
			const amount = 5;
			ClubCardPlayerAddFame(CCPlayer, amount);
			ClubCardPlayerAddMoney(CCPlayer, amount);
			const placeHolder = { [ClubCardPlaceholderKeys.MONEYAMOUNT]: amount, [ClubCardPlaceholderKeys.FAMEAMOUNT]: amount, [ClubCardPlaceholderKeys.CARDNAME]: "Porn Star"};
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFameMoney", placeHolder, CCPlayer);
		}
	},
	{
		ID: 5005,
		Name: "Cam Girl",
		Group: ["PornActress"],
		Reward: "NPC_MovieStudio_Director",
		MoneyPerTurn: 1,
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},
	{
		ID: 5006,
		Name: "Talent Agent",
		Group: ["Porn"],
		OnPlay: function(CCPlayer) {
			CCPlayer.Hand.push(ClubCardGetCopyCardByName("Porn Amateur"));
			CCPlayer.Hand.push(ClubCardGetCopyCardByName("Porn Amateur"));
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupInDiscardPileCount(CCPlayer, "Video") > 2) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 5007,
		Name: "Guest Star",
		Group: ["Porn"],
		RequiredLevel: 3,
		FamePerTurn: 1,
		MoneyPerTurn: 1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Video")) {
				const statGain = Math.min((ClubCardGroupOnBoardCount(CCPlayer, "PornActress") + (cardPlayed.RequiredLevel ?? 1)), 6);
				ClubCardPlayerAddMoney(CCPlayer, statGain);
				ClubCardPlayerAddFame(CCPlayer, statGain);
				const placeHolder = { [ClubCardPlaceholderKeys.MONEYAMOUNT]: statGain, [ClubCardPlaceholderKeys.FAMEAMOUNT]: statGain, [ClubCardPlaceholderKeys.CARDNAME]: "Guest Star"};
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFameMoney", placeHolder, CCPlayer);
			}
		}
	},
	{
		ID: 5008,
		Name: "Debuter",
		Group: ["PornActress"],
		RequiredLevel: 2,
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			const drawn = ClubCardPlayerDrawTypeCard(CCPlayer, ["Event"], undefined);
			const textGetKey = drawn
				? "Effect Debuter Draw"
				: "Effect Debuter No Draw";
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, textGetKey, {}, CCPlayer);
		},
	},

	// 6000 - Maid Members (Raise Fame, cost Money)
	{
		ID: 6000,
		Name: "Rookie Maid",
		Group: ["Maid"],
		FamePerTurn: 1
	},
	{
		ID: 6001,
		Name: "Coat Check Maid",
		Group: ["Maid"],
		MoneyPerTurn: 1
	},
	{
		ID: 6002,
		Name: "Regular Maid",
		Group: ["Maid"],
		MoneyPerTurn: -1,
		FamePerTurn: 2
	},
	{
		ID: 6003,
		Name: "French Maid",
		Group: ["Maid"],
		MoneyPerTurn: -1,
		FamePerTurn: 3,
		RequiredLevel: 3
	},
	{
		ID: 6004,
		Name: "Head Maid",
		Group: ["Maid"],
		MoneyPerTurn: -2,
		FamePerTurn: 3,
		RequiredLevel: 4,
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, Math.min(6, (ClubCardGroupOnBoardCount(CCPlayer, "Maid") - 1)));
		}
	},
	{
		ID: 6005,
		Name: "Confused Maid",
		Group: ["Liability", "Maid"],
		Reward: "NPC_Introduction_Maid",
		FamePerTurn: -2,
		RequiredLevel: 2
	},
	{
		ID: 6006,
		Name: "Quality Maid",
		Group: ["Maid"],
		RequiredLevel: 3,
		MoneyPerTurn: 1,
		FamePerTurn: 1
	},
	{
		ID: 6007,
		Name: "Housekeeper",
		Group: ["Maid"],
		RequiredLevel: 2,
		FamePerTurn: 1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (!ClubCardCardHasGroup(cardPlayed, "Maid") && cardPlayed.Type != "Event" && cardPlayed.Group != null && !ClubCardIsLiability(cardPlayed)) {
				let sharedGroupCards = CCPlayer.Board.filter(value => cardPlayed.Group?.some(group => ClubCardCardHasGroup(value, group)));
				const Fame = Math.min(3, sharedGroupCards.length - 1);
				if (Fame > 0) {
					ClubCardPlayerAddFame(CCPlayer, Fame);
					const placeHolder ={
						[ClubCardPlaceholderKeys.FAMEAMOUNT]: Fame,
						[ClubCardPlaceholderKeys.CARDNAME]: "Housekeeper"
					};
					ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Housekeeper", placeHolder, CCPlayer);
				}
			}
		},
		onOpponentPlayedCard: function (CCPlayer, cardPlayed) {
			if (!ClubCardCardHasGroup(cardPlayed, "Maid") && cardPlayed.Type != "Event" && cardPlayed.Group != null && ClubCardIsLiability(cardPlayed)) {
				let sharedGroupCards = CCPlayer.Board.filter(value => cardPlayed.Group?.some(group => ClubCardCardHasGroup(value, group)));
				const Fame = Math.min(3, sharedGroupCards.length - 1);
				if (Fame > 0) {
					ClubCardPlayerAddFame(CCPlayer, Fame);
					const placeHolder ={
						[ClubCardPlaceholderKeys.FAMEAMOUNT]: Fame,
						[ClubCardPlaceholderKeys.CARDNAME]: "Housekeeper"
					};
					ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Housekeeper", placeHolder, CCPlayer);
				}
			}
		}
	},
	{
		ID: 6008,
		Name: "Maid Manager",
		Group: ["Maid"],
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			let effectAmount = Math.min(4, Math.floor(ClubCardGroupOnBoardCount(CCPlayer, "Maid") / 2));
			if (CCPlayer.Level < 4) ClubCardPlayerAddMoney(CCPlayer, effectAmount);
			else ClubCardPlayerAddFame(CCPlayer, effectAmount);
		}
	},
	{
		ID: 6009,
		Name: "Throne Room Servant",
		Group: ["Maid"],
		RequiredLevel: 4,
		MoneyPerTurn: 2,
		BeforeTurnEnd: function(CCPlayer) {
			let t5cards = CCPlayer.Board.filter(card => card.RequiredLevel == 5);
			let effectFame = Math.min(7, 2 * t5cards.length);
			ClubCardPlayerAddFame(CCPlayer, effectFame);
		}
	},
	{
		ID: 6010,
		Name: "Night Maid",
		Group: ["Maid"],
		RequiredLevel: 5,
		MoneyPerTurn: 2,
		FamePerTurn: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Event.length > 0) {
				ClubCardPlayerAddFame(CCPlayer, 4);
				ClubCardPlayerAddMoney(CCPlayer, 2);
			}
		}
	},
	{
		ID: 6011,
		Name: "Vintage Maid",
		Group: ["Maid"],
		RequiredLevel: 3,
		FamePerTurn: 2,
		Prerequisite: "SearchACard",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null && CCPlayer.DiscardPile.filter(card => card.Type !== "Event").length > 0) {
				ClubCardCreatePopup("SEARCH", { CardsPool:  CCPlayer.DiscardPile.filter(card => card.Type !== "Event") });
				return;
			}
			if (ClubCardSelection) {
				const sel = ClubCardSelection;
				CCPlayer.DiscardPile.splice(CCPlayer.DiscardPile.findIndex(value => value.ID === sel.ID), 1);
				CCPlayer.Hand.push(ClubCardGetCopyCardByName(ClubCardSelection.Name));
			} else {
				ClubCardPlayCard(CCPlayer, this, false);
			}
		}
	},
	{
		ID: 6012,
		Name: "Cafe Maid",
		Group: ["Maid", "Kemonomimi"],
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		onDrawCard: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 1);
			if (CCPlayer.Level > 3) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},

	// 7000 - Asylum Patient and Nurse Members (Synergies between each other)
	{
		ID: 7000,
		Name: "Curious Patient",
		Group: ["AsylumPatient"],
		MoneyPerTurn: 1
	},
	{
		ID: 7001,
		Name: "Part-Time Patient",
		Group: ["AsylumPatient"],
		MoneyPerTurn: 1,
		onDrawAction: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 1);
			ClubCardPlayerAddFame(CCPlayer, -1);
		}
	},
	{
		ID: 7002,
		Name: "Novice Nurse",
		Group: ["AsylumNurse"],
		BeforeTurnEnd: function(CCPlayer) {
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient");
			ClubCardPlayerAddFame(CCPlayer, ClubCardGetMaxEffectFromCard(this, effectFame));
		}
	},
	{
		ID: 7003,
		Name: "Commited Patient",
		Group: ["AsylumPatient"],
		MoneyPerTurn: 2,
		RequiredLevel: 2
	},
	{
		ID: 7004,
		Name: "Veteran Nurse",
		Group: ["AsylumNurse"],
		RequiredLevel: 3,
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, Math.min(ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") * 2, CCPlayer.Level + 3));
			ClubCardPlayerAddMoney(CCPlayer, Math.max(ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") * -1, (CCPlayer.Level * -1) - 3));
		}
	},
	{
		ID: 7005,
		Name: "Permanent Patient",
		Group: ["AsylumPatient", "Slave"],
		MoneyPerTurn: 4,
		RequiredLevel: 3
	},
	{
		ID: 7006,
		Name: "Doctor",
		Group: ["AsylumNurse"],
		RequiredLevel: 5,
		BeforeTurnEnd: function(CCPlayer) {
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") * 3;
			ClubCardPlayerAddFame(CCPlayer, ClubCardGetMaxEffectFromCard(this, effectFame));
		}
	},
	{
		ID: 7007,
		Name: "Picky Nurse",
		Group: ["AsylumNurse"],
		Reward: "NPC_AsylumMeeting_PatientRight",
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			let fame = 0;
			for (const card of CCPlayer.Board) if (ClubCardCardHasGroup(card, "AsylumPatient")) fame = Math.max(fame, card.RequiredLevel ?? 1);
			ClubCardPlayerAddFame(CCPlayer, fame);
		}
	},
	{
		ID: 7008,
		Name: "Quack Doctor",
		MoneyPerTurn: 1,
		Group: ["AsylumNurse"],
		turnStart: function(CCPlayer) {
			const MAX_FAME_REDUCTION = 4;
			let fameReduction = Math.min(ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient"), MAX_FAME_REDUCTION);

			if (fameReduction != 0) {
				const opponent = ClubCardGetOpponent(CCPlayer);
				ClubCardPlayerAddFame(CCPlayer, fameReduction * -1);
				ClubCardPlayerAddFame(opponent, fameReduction * -1);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Quack Doctor", { [ClubCardPlaceholderKeys.FAMEAMOUNT]: fameReduction }, CCPlayer);
			}
		}
	},
	{
		ID: 7009,
		Name: "Theatre Nurse",
		Group: ["AsylumNurse"],
		FamePerTurn: 1,
		RequiredLevel: 3,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "AsylumPatient") && !ClubCardIsLiability(cardPlayed)) {
				ClubCardPlayerDrawCard(CCPlayer, 1);
				ClubCardPlayerAddMoney(CCPlayer, 3);
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "AsylumPatient") && ClubCardIsLiability(cardPlayed)) {
				ClubCardPlayerDrawCard(CCPlayer, 1);
				ClubCardPlayerAddMoney(CCPlayer, 3);
			}
		}
	},
	{
		ID: 7010,
		Name: "Hypnotherapist",
		Group: ["AsylumNurse"],
		FamePerTurn: 1,
		MoneyPerTurn: 2,
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			let cardsToReturn = CCPlayer.Board.filter(card => (card.RequiredLevel == 1 || card.RequiredLevel == null) && card.Name != "Kira");
			let opponentCardsToReturn = opponent.Board.filter(card => (card.RequiredLevel == 1 || card.RequiredLevel == null) && card.Name != "Kira");

			for (const C of cardsToReturn) {
				const cardToAdd = ClubCardGetCopyCardByName(C.Name);
				if (ClubCardIsLiability(C)) {
					opponent.Hand.push(cardToAdd);
				} else {
					CCPlayer.Hand.push(cardToAdd);
				}
				ClubCardRemoveFromBoard(CCPlayer, C, true);
			}

			for (const C of opponentCardsToReturn) {
				const cardToAdd = ClubCardGetCopyCardByName(C.Name);
				if (ClubCardIsLiability(C)) {
					CCPlayer.Hand.push(cardToAdd);
				} else {
					opponent.Hand.push(cardToAdd);
				}
				ClubCardRemoveFromBoard(opponent, C, true);
			}

			this.ExtraPlay = 1;

			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Hypnotherapist");
		},
		BeforeOpponentTurnEnd: function() {
			this.ExtraPlay = 0;
		}
	},
	{
		ID: 7011,
		Name: "Prodigious Patient",
		Group: ["AsylumPatient"],
		FamePerTurn: 2,
		MoneyPerTurn: 2,
		RequiredLevel: 4,
		Time: 6,
		onLeaveClub: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardPlayerAddFame(opponent, -15, this.Name);
			ClubCardPlayerDiscardCard(opponent, 1);
		}
	},

	// 8000 - Dominant Members (Raise lots of Fame, cost Money)
	{
		ID: 8000,
		Name: "Amateur Rigger",
		Group: ["Dominant"],
		FamePerTurn: 1
	},
	{
		ID: 8001,
		Name: "Domme",
		Group: ["Dominant"],
		MoneyPerTurn: -1,
		FamePerTurn: 2
	},
	{
		ID: 8002,
		Name: "Madam",
		Group: ["Dominant"],
		RequiredLevel: 2,
		MoneyPerTurn: -2,
		FamePerTurn: 3
	},
	{
		ID: 8003,
		Name: "Mistress",
		Group: ["Dominant", "Mistress"],
		RequiredLevel: 3,
		MoneyPerTurn: -3,
		FamePerTurn: 4
	},
	{
		ID: 8004,
		Name: "Dominatrix",
		Group: ["Dominant", "Mistress"],
		RequiredLevel: 4,
		MoneyPerTurn: -4,
		FamePerTurn: 6
	},
	{
		ID: 8005,
		Name: "Mistress Sophie",
		Group: ["Dominant", "Mistress"],
		Reward: "NPC-Sophie",
		RequiredLevel: 5,
		MoneyPerTurn: -5,
		FamePerTurn: 8
	},

	// 9000 - Liability Members (Used on other board to handicap)
	{
		ID: 9000,
		Name: "Scammer",
		Group: ["Liability"],
		RequiredLevel: 3,
		FamePerTurn: -1,
		MoneyPerTurn: -1,
		ExtraTime: -1,
		OnPlay: function(CCPlayer) {
			for (const card of ClubCardGetOpponent(CCPlayer).Event) {
				if (typeof card.Time === "number") card.Time--;
			}
		},
		onLeaveClub: function(CCPlayer) {
			for (const card of CCPlayer.Event) {
				if (typeof card.Time === "number") card.Time++;
			}
		}
	},
	{
		ID: 9001,
		Name: "Pyramid Schemer",
		Group: ["Liability"],
		RequiredLevel: 2,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type != "Event" && !ClubCardIsLiability(cardPlayed) && cardPlayed.RequiredLevel) {
				const lvl = cardPlayed.RequiredLevel;
				let lowerLevelMembers = CCPlayer.Board.filter(card => card.RequiredLevel === undefined || card.RequiredLevel < lvl);
				let moneyLoss = Math.floor(lowerLevelMembers.length / 2) * -1;
				ClubCardPlayerAddMoney(CCPlayer, moneyLoss, this.Name);
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type != "Event" && ClubCardIsLiability(cardPlayed) && cardPlayed.RequiredLevel) {
				const lvl = cardPlayed.RequiredLevel;
				let lowerLevelMembers = CCPlayer.Board.filter(card => card.RequiredLevel === undefined || card.RequiredLevel < lvl);
				let moneyLoss = Math.floor(lowerLevelMembers.length / 2) * -1;
				ClubCardPlayerAddMoney(CCPlayer, moneyLoss, this.Name);
			}

		}
	},
	{
		ID: 9002,
		Name: "Ponzi Schemer",
		Group: ["Liability"],
		RequiredLevel: 4,
		MoneyPerTurn: -4
	},
	{
		ID: 9003,
		Name: "Party Pooper",
		Group: ["Liability"],
		FamePerTurn: -2,
		MoneyPerTurn: 1
	},
	{
		ID: 9004,
		Name: "College Dropout",
		Group: ["Liability", "CollegeStudent"],
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Fame > ClubCardGetOpponent(CCPlayer).Fame) ClubCardPlayerAddFame(CCPlayer, -2);
			if (CCPlayer.Level >= 4) ClubCardPlayerAddFame(CCPlayer, -1);
		}
	},
	{
		ID: 9005,
		Name: "Union Leader",
		Group: ["Liability"],
		RequiredLevel: 3,
		BeforeTurnEnd: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			let fameGain = CCPlayer.Board.length - opponent.Board.length;
			if (fameGain > 5) fameGain = 5;
			else if (fameGain < -5) fameGain = -5;
			ClubCardPlayerAddFame(CCPlayer, fameGain);
		}
	},
	{
		ID: 9006,
		Name: "No-Fap Advocate",
		Group: ["Liability"],
		RequiredLevel: 2,
		FamePerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardTurnCardPlayed > 0) ClubCardPlayerAddFame(CCPlayer, -ClubCardTurnCardPlayed);
		},
	},
	{
		ID: 9007,
		Name: "Pandora Infiltrator",
		Group: ["Liability"],
		RequiredLevel: 3,
		Prerequisite: "SelectAnyMember",
		OnPlay: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			if (ClubCardSelection && ClubCardIsLiability(ClubCardSelection)) {
				opponent.Board[opponent.Board.length -1].Group = ClubCardSelection.Group;
			} else if (ClubCardSelection?.Group) {
				opponent.Board[opponent.Board.length -1].Group = this.Group?.concat(ClubCardSelection.Group);
			}
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type != "Event" && !ClubCardIsLiability(cardPlayed) && cardPlayed.Group) {
				for (const group of this.Group ?? []) {
					if (ClubCardCardHasGroup(cardPlayed, group)) {
						if ((this.FamePerTurn ?? 0) > -3 && (this.MoneyPerTurn ?? 0) > -2) {
							let randomStat = Math.floor(Math.random() * 2);
							if (randomStat == 1) this.FamePerTurn = (this.FamePerTurn ?? 0) - 1;
							else this.MoneyPerTurn = (this.MoneyPerTurn ?? 0) - 1;
							return;
						} else if ((this.FamePerTurn ?? 0) > -3) {
							this.FamePerTurn = (this.FamePerTurn ?? 0) - 1;
							return;
						} else  if ((this.MoneyPerTurn ?? 0) > -2) {
							this.MoneyPerTurn = (this.MoneyPerTurn ?? 0) - 1;
							return;
						}
					}
				}
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type != "Event" && ClubCardIsLiability(cardPlayed)) {
				if ((this.FamePerTurn ?? 0) > -3 && (this.MoneyPerTurn ?? 0) > -2) {
					let randomStat = Math.floor(Math.random() * 2);
					if (randomStat == 1) this.FamePerTurn = (this.FamePerTurn ?? 0) - 1;
					else this.MoneyPerTurn = (this.MoneyPerTurn ?? 0) - 1;
				} else if ((this.FamePerTurn ?? 0) > -3) {
					this.FamePerTurn = (this.FamePerTurn ?? 0) - 1;
				} else if ((this.MoneyPerTurn ?? 0) > -2) {
					this.MoneyPerTurn = (this.MoneyPerTurn ?? 0) - 1;
				}
			}
		}
	},
	{
		ID: 9008,
		Name: "Uncontrollable Sub",
		Group: ["Liability", "Submissive"],
		Time: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -8);
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (!ClubCardIsLiability(cardPlayed) && cardPlayed.Type != "Event") cardPlayed.FamePerTurn = (cardPlayed.FamePerTurn ?? 0) - 1;
		}
	},
	{
		ID: 9009,
		Name: "Drunkard",
		Revealed: true,
		Group: ["Liability", "Exhibitionist"],
		RequiredLevel: 2,
		onDrawCard: function(CCPlayer) {
			if (!ClubCardNameIsOnBoard(CCPlayer, "Bouncer")) ClubCardPlayerAddFame(CCPlayer, -1);
			if (!ClubCardNameIsOnBoard(CCPlayer, "Waitress")) ClubCardPlayerAddFame(CCPlayer, -1);
		}
	},
	{
		ID: 9010,
		Name: "Public Advertisement",
		Group: ["Liability"],
		RequiredLevel: 2,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type != "Event" && !ClubCardIsLiability(cardPlayed)) {
				ClubCardPlayerAddMoney(CCPlayer, 1);
				ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), 2);
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type != "Event" && ClubCardIsLiability(cardPlayed)) {
				ClubCardPlayerAddMoney(CCPlayer, 1);
				ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), 2);
			}
		}
	},

	// 10000 - ABDL Members (Mostly gives Money)
	{
		ID: 10000,
		Name: "Baby Girl",
		Group: ["ABDLBaby"],
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "ABDLMommy")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 10001,
		Name: "Caring Mother",
		Group: ["ABDLMommy"],
		MoneyPerTurn: 1
	},
	{
		ID: 10002,
		Name: "Diaper Baby",
		Group: ["ABDLBaby"],
		RequiredLevel: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Maid")) ClubCardPlayerAddMoney(CCPlayer, 3);
		}
	},
	{
		ID: 10003,
		Name: "Sugar Baby",
		Group: ["ABDLBaby"],
		RequiredLevel: 3,
		MoneyPerTurn: 5,
		FamePerTurn: -1
	},
	{
		ID: 10004,
		Name: "Babysitter",
		Group: ["ABDLMommy", "Staff"],
		RequiredLevel: 2,
		MoneyPerTurn: -2,
		BeforeTurnEnd: function(CCPlayer) {
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby") * 2;
			ClubCardPlayerAddFame(CCPlayer, ClubCardGetMaxEffectFromCard(this, effectFame));
		}
	},
	{
		ID: 10005,
		Name: "Soap Opera Mother",
		Group: ["ABDLMommy"],
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "ABDLBaby")) {
				const fame = 25;
				ClubCardPlayerAddFame(CCPlayer, fame, this.Name);
			}
		}
	},
	{
		ID: 10006,
		Name: "Big Baby",
		Group: ["ABDLBaby", "Submissive"],
		RequiredLevel: 2,
		MoneyPerTurn: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(ClubCardGetOpponent(CCPlayer), 1);
		}
	},
	{
		ID: 10007,
		Name: "Fussy Baby",
		Group: ["ABDLBaby"],
		MoneyPerTurn: 1,
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type === "Event") {
				ClubCardRemoveFromBoard(CCPlayer, this, true);
				ClubCardAddToHand(CCPlayer, this);
				ClubCardPlayerAddFame(CCPlayer, 4);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Fussy Baby", {[ClubCardPlaceholderKeys.FAMEAMOUNT]: 4}, CCPlayer);
			}
		}
	},
	{
		ID: 10008,
		Name: "Nanny",
		FamePerTurn: 2,
		RequiredLevel: 3,
		Group: ["ABDLMommy"],
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "ABDLBaby") && !ClubCardIsLiability(cardPlayed)) ClubCardPlayerAddFame(CCPlayer, CCPlayer.Level, this.Name);
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "ABDLBaby") && ClubCardIsLiability(cardPlayed)) ClubCardPlayerAddFame(CCPlayer, CCPlayer.Level, this.Name);
		}
	},
	{
		ID: 10009,
		Name: "Dommy Mommy",
		FamePerTurn: 1,
		MoneyPerTurn: -5,
		RequiredLevel: 5,
		Group: ["ABDLMommy", "Dominant"],
		OnPlay: function(CCPlayer) {
			// get all members, exclude events from board count
			const fame = CCPlayer.Board.filter(card => card.Type !== "Event").length;
			ClubCardPlayerAddFame(CCPlayer, fame, this.Name);
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby"));
		}
	},


	// 11000 - College Members (Mostly gives Fame, give bonuses/maluses between each other)
	{
		ID: 11000,
		Name: "Amanda",
		Group: ["CollegeStudent"],
		Reward: "NPC-Amanda",
		FamePerTurn: 1
	},
	{
		ID: 11001,
		Name: "Sarah",
		Group: ["CollegeStudent", "Submissive"],
		Reward: "NPC-Sarah",
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Amanda")) ClubCardPlayerAddFame(CCPlayer, 1);
			if (ClubCardNameIsOnBoard(CCPlayer, "Mistress Sophie")) ClubCardPlayerAddFame(CCPlayer, 2);
			if (ClubCardNameIsOnBoard(CCPlayer, "Sidney")) ClubCardPlayerAddFame(CCPlayer, -1);
		}
	},
	{
		ID: 11002,
		Name: "Sidney",
		Group: ["CollegeStudent"],
		Reward: "NPC-Sidney",
		FamePerTurn: 1
	},
	{
		ID: 11003,
		Name: "Jennifer",
		Group: ["CollegeStudent"],
		Reward: "NPC-Jennifer",
		FamePerTurn: 1,
		Prerequisite: "SelectOwnMember",
		EffectType: "Removal",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
		}
	},
	{
		ID: 11004,
		Name: "College Freshwoman",
		Group: ["CollegeStudent"],
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Yuki") || ClubCardNameIsOnBoard(CCPlayer, "Julia")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 11005,
		Name: "College Nerd",
		Group: ["CollegeStudent"],
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Yuki") || ClubCardNameIsOnBoard(CCPlayer, "Julia")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 11006,
		Name: "College Hidden Genius",
		Group: ["CollegeStudent"],
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Mildred")) ClubCardPlayerAddFame(CCPlayer, 4);
		}
	},
	{
		ID: 11007,
		Name: "Substitute Teacher",
		Group: ["CollegeTeacher"],
		MoneyPerTurn: -2,
		BeforeTurnEnd: function(CCPlayer) {
			const effectFame = ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent");
			ClubCardPlayerAddFame(CCPlayer, Math.min(effectFame, 4));
		}
	},
	{
		ID: 11008,
		Name: "Julia",
		Group: ["CollegeTeacher"],
		Reward: "NPC-Julia",
		RequiredLevel: 2,
		FamePerTurn: 2,
		MoneyPerTurn: -1
	},
	{
		ID: 11009,
		Name: "Yuki",
		Group: ["CollegeTeacher"],
		Reward: "NPC-Yuki",
		RequiredLevel: 3,
		FamePerTurn: 2,
		MoneyPerTurn: 1,
	},
	{
		ID: 11010,
		Name: "Mildred",
		Group: ["CollegeTeacher"],
		Reward: "NPC-Mildred",
		RequiredLevel: 4,
		FamePerTurn: 3,
	},
	{
		ID: 11011,
		Name: "Teacher's Aide",
		Group: ["CollegeTeacher", "CollegeStudent"],
		RequiredLevel: 2,
		FamePerTurn: 1,
		MoneyPerTurn: 1
	},
	{
		ID: 11012,
		Name: "Student Custodian",
		Group: ["CollegeStudent", "Staff"],
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			let effectAmount = Math.min(ClubCardGroupOnBoardCount(CCPlayer, "Staff") + ClubCardGroupOnBoardCount(CCPlayer, "CollegeTeacher"), Math.floor(ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent") / 2));
			if (CCPlayer.Level < 4) ClubCardPlayerAddMoney(CCPlayer, effectAmount);
			else ClubCardPlayerAddFame(CCPlayer, effectAmount);
		}
	},
	{
		ID: 11013,
		Name: "Med Student",
		Group: ["CollegeStudent", "AsylumNurse"],
		RequiredLevel: 3,
		FamePerTurn: 1,
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			const asylumPatientPresent = ClubCardGroupIsOnBoard(CCPlayer, "AsylumPatient");
			if (asylumPatientPresent) {
				ClubCardPlayerAddMoney(CCPlayer, 1);
			}

			const collegeTeacherPresent = ClubCardGroupIsOnBoard(CCPlayer, "CollegeTeacher");
			if (collegeTeacherPresent) {
				ClubCardPlayerAddFame(CCPlayer, 1);
			}
		}
	},

	// 12000 - Cards based on online players
	{   // Patreon 2023/09 Contest Winner
		ID: 12000,
		Name: "Sam the Busty Cow",
		Group: ["Player"],
		Reward: "NPC_Stable_Trainer",
		RewardMemberNumber: 98677,
		MoneyPerTurn: 2,
		RequiredLevel: 2
	},
	{   // Discord 2023/09 Contest Winner
		ID: 12001,
		Name: "Suki",
		Group: ["Player", "Kemonomimi"],
		Reward: "NPC_AsylumEntrance_Nurse",
		RewardMemberNumber: 649,
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupOnBoardCount(CCPlayer, "Kemonomimi") > 1) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{   // Deviant Art 2023/09 Contest Winner
		ID: 12002,
		Name: "Angela",
		Group: ["Player"],
		Reward: "NPC_Cafe_Maid",
		RewardMemberNumber: 20950,
		FamePerTurn: 1,
		MoneyPerTurn: 3,
		RequiredLevel: 3
	},
	{
		ID: 12003,
		Name: "Alvin",
		Group: ["Dominant", "Mistress", "Sensei", "Player"],
		RewardMemberNumber: 41997,
		RequiredLevel: 3,
		FamePerTurn: 3,
		MoneyPerTurn: -2,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if ((cardPlayed.Type == "Event" && ClubCardCardHasGroup(cardPlayed, "Shibari")) || cardPlayed.Name === "Restrain") {
				ClubCardAlvinCondition(CCPlayer);
			}
		}
	},
	{
		ID: 12004,
		Name: "Sophie",
		Group: ["Player","Kemonomimi"],
		RewardMemberNumber: 1236,
		Reward: "NPC_ClubCardLounge_Tutor",
		RequiredLevel: 3,
		Prerequisite: "SelectAnyMember",
		FamePerTurn: 1,
		MoneyPerTurn: -2,
		OnPlay: function(CCPlayer) {
			if (!ClubCardSelection || !CommonIsNumeric(ClubCardSelection.ArrayIndex)) {
				return;
			}

			const modifier = 2;
			const indexToBuff = ClubCardSelection.ArrayIndex;
			let BuffedCard;
			if (ClubCardSelection.Location == "OpponentBoard")
				BuffedCard = ClubCardGetOpponent(CCPlayer).Board[indexToBuff];
			else
				BuffedCard = CCPlayer.Board[indexToBuff];

			if (BuffedCard.FamePerTurn)
				BuffedCard.FamePerTurn = BuffedCard.FamePerTurn * modifier;
			if (BuffedCard.MoneyPerTurn)
				BuffedCard.MoneyPerTurn = BuffedCard.MoneyPerTurn * modifier;

			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Sophie", {[ClubCardPlaceholderKeys.CARDNAME]: ClubCardSelection.Name});
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "LARP Queen")) ClubCardPlayerAddFame(CCPlayer, 2);
			if (ClubCardGroupOnBoardCount(CCPlayer, "Kemonomimi") > 2) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 12005,
		Name: "Moon",
		Group: ["Player","Pet","Kemonomimi"],
		RewardMemberNumber: 162726,
		Prerequisite: "SelectAnyMember",
		RequiredLevel: 4,
		FamePerTurn: 2,
		MoneyPerTurn: -1,
		OnPlay: function (CCPlayer) {
			if (!ClubCardSelection) return;
			ClubCardPlayerAddMoney(CCPlayer, -16);
			const cardToAdd =  ClubCardGetCopyCardByName(ClubCardSelection.Name);
			CCPlayer.Hand.push(cardToAdd);
		}
	},
	{
		ID: 12006,
		Name: "Eden",
		Group: ["Player"],
		RewardMemberNumber: 177508,
		Prerequisite: "SelectATier",
		EffectType: "ToHand",
		Time: 3,
		OnPlay: function () {
			if (!ClubCardTierSelection) return;
			this.EffectKey = ClubCardTierSelection;
			this.ExtraPlay = 1;
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Eden", {[ClubCardPlaceholderKeys.AMOUNT]: ClubCardTierSelection });
		},
		turnStart: function (CCPlayer) {
			this.EffectKey = undefined;
			this.ExtraPlay = 0;
			if (CommonIsNumeric(this.Time) && this.Time < 1) {
				CCPlayer.Hand.push(ClubCardGetCopyCardByName(this.Name));
			}
		}
	},
	{
		ID: 12007,
		Name: "Skye",
		Group: ["Player"],
		RewardMemberNumber: 133105,
		RequiredLevel: 3,
		FamePerTurn: 1,
		EffectKey: 0,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (this.EffectKey == 0 && !ClubCardIsLiability(cardPlayed) && cardPlayed.Name != "Skye" && cardPlayed.Type != "Event" && cardPlayed.Group != null) {
				for (const group of cardPlayed.Group) {
					if (ClubCardGroupOnBoardCount(CCPlayer, group) < 2) {
						ClubCardPlayerDrawCard(CCPlayer, 1);
						ClubCardPlayerAddMoney(CCPlayer, -2);
						this.EffectKey++;
						return;
					}
				}
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardIsLiability(cardPlayed) && cardPlayed.Type != "Event" && cardPlayed.Group != null) {
				for (const group of cardPlayed.Group) {
					if (ClubCardGroupOnBoardCount(CCPlayer, group) < 2) {
						ClubCardPlayerDrawCard(CCPlayer, 1);
						ClubCardPlayerAddMoney(CCPlayer, -2);
						ClubCardPlayerAddFame(CCPlayer, -2);
						return;
					}
				}
			}
		},
		AfterTurnEnd: function() {
			this.EffectKey = 0;
		},
		AfterOpponentTurnEnd: function() {
			this.EffectKey = 0;
		}
	},
	{
		ID: 12008,
		Name: "Kira",
		Group: ["Player", "Criminal"],
		RewardMemberNumber: 16887,
		Prerequisite: "SelectOwnMember",
		OnPlay: function(CCPlayer) {
			if (!ClubCardSelection || !CommonIsNumeric(ClubCardSelection.ArrayIndex)) return;
			const indexToChange = ClubCardSelection.ArrayIndex;
			CCPlayer.Board[indexToChange].FamePerTurn = 0;
			CCPlayer.Board[indexToChange].MoneyPerTurn = -2;
			if (indexToChange == 0) {
				CCPlayer.Board[CCPlayer.Board.length - 2].FamePerTurn = 0;
				CCPlayer.Board[CCPlayer.Board.length - 2].MoneyPerTurn = -2;
			} else {
				CCPlayer.Board[indexToChange - 1].FamePerTurn = 0;
				CCPlayer.Board[indexToChange - 1].MoneyPerTurn = -2;
			}
			if (indexToChange == CCPlayer.Board.length -2) {
				CCPlayer.Board[0].FamePerTurn = 0;
				CCPlayer.Board[0].MoneyPerTurn = -2;
			} else {
				CCPlayer.Board[indexToChange + 1].FamePerTurn = 0;
				CCPlayer.Board[indexToChange + 1].MoneyPerTurn = -2;
			}
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, Math.min(Math.floor(CCPlayer.Board.length / 2), 8));
		},
		CanPlay: function(CCPlayer) {
			if (CCPlayer.Board.length > 2) return true;
			else return false;
		}
	},
	{
		ID: 12009,
		Name: "Carol",
		Group: ["Player", "AsylumNurse"],
		RewardMemberNumber: 7113,
		FamePerTurn: 2,
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			if (ClubCardGroupOnBoardCount(CCPlayer, "AsylumNurse") > 1) {
				const patientSummoned = ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["AsylumPatient"], 1, -1, undefined, "Streets");
				if (!patientSummoned) ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["AsylumPatient"], 1, -1);
			}
		}
	},
	{
		ID: 12010,
		Name: "Rizom",
		Group: ["Player", "Maid", "Kemonomimi"],
		RewardMemberNumber: 177177,
		Prerequisite: "SelectOwnMember",
		FamePerTurn: 2,
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			if (!ClubCardSelection || !CommonIsNumeric(ClubCardSelection.ArrayIndex)) return;
			const fameBonus = 1 + (ClubCardGroupIsOnBoard(CCPlayer, "ABDLMommy") ? 1 : 0);
			const moneyBonus = 1 + (ClubCardGroupIsOnBoard(CCPlayer, "Owner") ? 1 : 0);
			const indexToChange = ClubCardSelection.ArrayIndex;
			CCPlayer.Board[indexToChange].FamePerTurn = (CCPlayer.Board[indexToChange].FamePerTurn ?? 0) + fameBonus;
			CCPlayer.Board[indexToChange].MoneyPerTurn = (CCPlayer.Board[indexToChange].MoneyPerTurn ?? 0) + moneyBonus;
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Rizom", {[ClubCardPlaceholderKeys.CARDNAME]: ClubCardSelection.Name});
		}
	},
	{
		ID: 12011,
		Name: "Artie",
		Group: ["Player", "Pet"],
		RewardMemberNumber: 200424,
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawGroupCard(CCPlayer, ["Owner"], undefined);
			ClubCardPlayerAddMoney(CCPlayer, -6);
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, Math.floor(ClubCardCalculateLevelForPets(CCPlayer) / 2));
		}
	},
	{
		ID: 12012,
		Name: "Akira",
		Group: ["Player", "Mistress", "Submissive"],
		RewardMemberNumber: 155726,
		Prerequisite: "SelectAnyMember",
		MoneyPerTurn: 2,
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			if (ClubCardCanSummonCard(CCPlayer, ClubCardGetCopyCardByName("Ball Gag"))) ClubCardSummonCard(CCPlayer, ClubCardGetCopyCardByName("Ball Gag"));
		}
	},
	{
		ID: 12013,
		Name: "Mei",
		Group: ["Player", "CollegeStudent", "Dominant"],
		RewardMemberNumber: 105930,
		Prerequisite: "SearchACard",
		RequiredLevel: 4,
		FamePerTurn: 1,
		MoneyPerTurn: -1,
		OnPlay: function (CCPlayer) {
			if (ClubCardSelection == null && CCPlayer.Deck.length > 0) {
				ClubCardCreatePopup("SEARCH", { CardsPool: ClubCardShuffle(CCPlayer.Deck.slice()) });
				return;
			}
			if (ClubCardSelection) {
				const sel = ClubCardSelection;
				CCPlayer.Deck.splice(CCPlayer.Deck.findIndex(value => value.ID === sel.ID), 1);
				CCPlayer.Hand.push(ClubCardSelection);
				CCPlayer.Hand[CCPlayer.Hand.length - 1].Revealed = true;
				if ((sel.RequiredLevel ?? 0) > 4) {
					ClubCardPlayerAddMoney(CCPlayer, 3);
				} else {
					CCPlayer.Board[CCPlayer.Board.length - 1].Group = this.Group?.concat("Submissive");
				}
			} else {
				ClubCardPlayCard(CCPlayer, this, false);
			}
		}
	},
	{
		ID: 12014,
		Name: "Ari",
		Group: ["Player", "CollegeStudent"],
		RewardMemberNumber: 137539,
		RequiredLevel: 3,
		MoneyPerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, Math.min(CCPlayer.Level, Math.floor(ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent") / 2)));
		}
	},
	{
		ID: 12015,
		Name: "Lumi",
		Group: ["Player"],
		RewardMemberNumber: 214503,
		MoneyPerTurn: 1,
		CanActive: true,
		OnActive: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			let tiersSum = 0;
			let opponentTiersSum = 0;
			for (const card of CCPlayer.Hand) {
				card.Revealed = true;
				tiersSum += card.RequiredLevel ?? 1;
			}
			for (const card of opponent.Hand) {
				card.Revealed = true;
				opponentTiersSum += card.RequiredLevel ?? 1;
			}
			if (tiersSum > opponentTiersSum) ClubCardPlayerAddFame(CCPlayer, CCPlayer.Level, this.Name);
			else if (tiersSum < opponentTiersSum) ClubCardPlayerAddFame(opponent, opponent.Level, this.Name);

			const index = this.ArrayIndex;
			if (!CommonIsNumeric(index)) return;
			CCPlayer.Board[index].ExtraPlay = (CCPlayer.Board[index].ExtraPlay ?? 0) + 1;
			CCPlayer.Board[index].CanActive = false;
		},
		BeforeTurnEnd: function(CCPlayer) {
			const index = this.ArrayIndex;
			if (!CommonIsNumeric(index)) return;
			CCPlayer.Board[index].ExtraPlay = 0;
		},
		onLevelUp: function() {
			this.CanActive = true;
		}
	},
	{
		ID: 12016,
		Name: "Tifa",
		Reward: "NPC_MagicSchoolFindsAround_Kitsune",
		Group: ["Player"],
		RewardMemberNumber: 168857,
		RequiredLevel: 3,
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		CanActive: true,
		OnActive: function(CCPlayer) {
			if (!ClubCardFocus) return;
			ClubCardPlayerAddMoney(CCPlayer, -3);
			ClubCardPending = ClubCardFocus;
			ClubCardFocus = CCPlayer.Deck[0];
			if (ClubCardIsAnimationOn) {
				ClubCardPending.IsVisible = false;
				ClubCardMoveCardToPending(ClubCardPending);
			}
			const index = this.ArrayIndex;
			if (!CommonIsNumeric(index)) return;
			CCPlayer.Board[index].CanActive = false;
			ClubCardCreatePopup("TifaActive");
		},
		turnStart: function() {
			this.CanActive = true;
		}
	},
	{
		ID: 12017,
		Name: "Jae",
		Group: ["Player", "Pet", "Kemonomimi", "Submissive"],
		RewardMemberNumber: 189317,
		RequiredLevel: 4,
		MoneyPerTurn: 2,
		FamePerTurn: 2,
		EffectKey: 0,
		onMemberLeaveClub: function(CCPlayer) {
			if (this.EffectKey == 0) {
				ClubCardPlayerAddFame(CCPlayer, this.FamePerTurn ?? 0, this.Name);
				ClubCardPlayerAddMoney(CCPlayer, this.MoneyPerTurn ?? 0, this.Name);
				this.EffectKey++;
			}
		},
		AfterTurnEnd: function() {
			this.EffectKey = 0;
		},
		AfterOpponentTurnEnd: function() {
			this.EffectKey = 0;
		}
	},
	{
		ID: 12018,
		Name: "Delta",
		Group: ["Player", "Kemonomimi", "Criminal"],
		RewardMemberNumber: 187489,
		RequiredLevel: 5,
		MoneyPerTurn: 9,
		OnPlay: function(CCPlayer) {
			if (ClubCardNameCountOnBoard(CCPlayer, "Plushie") > 8) CCPlayer.Fame = 100;
		},
		onPlayedCard: function(CCPlayer) {
			if (ClubCardNameCountOnBoard(CCPlayer, "Plushie") > 8) CCPlayer.Fame = 100;
		},
		OnGameStart: function(CCPlayer) {
			if (CCPlayer.FullDeck.length == 40) {
				let plushiesToAdd = 9;
				while (plushiesToAdd > 0) {
					CCPlayer.Deck.push(ClubCardGetCopyCardByName("Plushie"));
					plushiesToAdd--;
				}
				CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
			}
		}
	},
	{
		ID: 12019,
		Name: "Felix",
		Group: ["Player", "Kemonomimi"],
		RewardMemberNumber: 139503,
		RequiredLevel: 3,
		MoneyPerTurn: -6,
		FamePerTurn: 6,
		OnPlay: function(CCPlayer) {
			const playerCards =  ClubCardList.filter(C => ClubCardCardHasGroup(C, "Player"));
			const cardToAdd = playerCards[Math.floor(Math.random() * playerCards.length)];
			const position = Math.floor(Math.random() * Math.min(6, CCPlayer.Deck.length)) - 1;
			CCPlayer.Deck.splice(position, 0, ClubCardGetCopyCardByName(cardToAdd.Name));
		}
	},
	{
		ID: 12020,
		Name: "anna",
		Group: ["Player", "Kemonomimi", "Exhibitionist"],
		Revealed: true,
		RewardMemberNumber: 153856,
		MoneyPerTurn: 1,
		onRender: function(CCPlayer, X, Y, W) {
			DrawImageResize("Screens/MiniGame/ClubCard/" + (CCPlayer.Deck[0]?.Type ?? "Member") + "/" + CCPlayer.Deck[0]?.Name + ".png", X + W * 0.1, Y + W * 0.40, W * 0.3, W * 0.6);
		}
	},
	{
		ID: 12021,
		Name: "Clare",
		Group: ["Player", "Kemonomimi", "Criminal"],
		RewardMemberNumber: 107953,
		RequiredLevel: 3,
		MoneyPerTurn: 2,
		ExtraPlay: 0,
		CanActive: true,
		OnActive: function(CCPlayer) {
			if (!ClubCardFocus) return;
			ClubCardPending = ClubCardFocus;
			if (ClubCardIsAnimationOn) {
				ClubCardPending.IsVisible = false;
				ClubCardMoveCardToPending(ClubCardPending, null);
			}
			ClubCardFocus = null;
			ClubCardCreatePopup("SEARCH", { CardsPool: ClubCardShuffle(CCPlayer.Deck.filter(card => card.Type !== "Event")), });
		},
		onLevelUp: function() {
			this.CanActive = true;
		},
		BeforeTurnEnd: function(CCPlayer) {
			const index = this.ArrayIndex ?? 0;
			CCPlayer.Board[index].ExtraPlay = 0;
		}

	},
	{
		ID: 12022,
		Name: "arella",
		Group: ["Player", "Mistress", "CollegeTeacher"],
		RewardMemberNumber: 66729,
		RequiredLevel: 3,
		FamePerTurn: 1,
		CanActive: true,
		OnPlay: function(CCPlayer) {
			for (const card of CCPlayer.Board) {
				if (ClubCardCardHasGroup(card, "Slave") || ClubCardCardHasGroup(card, "Submissive") || ClubCardCardHasGroup(card, "CollegeStudent")) {
					card.MoneyPerTurn = (card.MoneyPerTurn ?? 0) + 1;
				}
			}
		}
	},
	{
		ID: 12023,
		Name: "Ramona",
		Group: ["Player", "Submissive"],
		RewardMemberNumber: 164817,
		RequiredLevel: 2,
		MoneyPerTurn: 2
	},

	// 13000 - Shibari Members
	{
		ID: 13000,
		Name: "Knot Nut",
		Group: ["Knot"],
		MoneyPerTurn: 1
	},
	{
		ID: 13001,
		Name: "Nawashi",
		Group: ["Shibari"],
		RequiredLevel: 4,
		FamePerTurn: 4,
		MoneyPerTurn: -4,
		AfterOpponentTurnEnd: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);

			const nawashiPlayed = ClubCardGetCardsPlayedOnTurn(opponent, opponent.ClubCardTurnCounter - 1).some(card => {
				return card.Name === "Nawashi";
			});

			if (nawashiPlayed && (CCPlayer.LastFamePerTurn ?? 0) > 0) {
				ClubCardPlayerAddFame(CCPlayer, (CCPlayer.LastFamePerTurn ?? 0) * -1);
				CCPlayer.LastFamePerTurn = 0;
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Nawashi", {}, CCPlayer);
			}
			this.Negated = true;
			this.Negating = this.UniqueID;
		}
	},
	{
		ID: 13002,
		Name: "Living Art",
		Group: ["Shibari"],
		MoneyPerTurn: 1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if ((cardPlayed.Type == "Event" && ClubCardCardHasGroup(cardPlayed, "Shibari")) || ClubCardCardHasGroup(cardPlayed, "Knot")) {
				ClubCardPlayerAddFame(CCPlayer, 1);
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Living Art", {[ClubCardPlaceholderKeys.FAMEAMOUNT]: 1}, CCPlayer);
			}
		}
	},
	{
		ID: 13003,
		Name: "Rope Slinger",
		Group: ["Shibari"],
		RequiredLevel: 3,
		FamePerTurn: 2,
		CanActive: true,
		OnActive: function(CCPlayer) {
			for (const card of CCPlayer.Hand.slice()) {
				if (ClubCardCardHasGroup(card, "Knot") && ClubCardCanSummonCard(CCPlayer, card)) {
					ClubCardSummonCard(CCPlayer, card);
					const cardIndexInHand = CCPlayer.Hand.findIndex(value => value.ID === card.ID);
					CCPlayer.Hand.splice(cardIndexInHand, 1);
				}
			}
			CCPlayer.Board[this.ArrayIndex ?? 0].CanActive = false;
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Rope Slinger", undefined, CCPlayer);
		},
		turnStart: function() {
			this.CanActive = true;
		}
	},
	{
		ID: 13004,
		Name: "Goddess of Ropes",
		Group: ["Shibari", "Sensei"],
		RequiredLevel: 4,
		FamePerTurn: 4,
		MoneyPerTurn: -5,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Shibari") && !ClubCardIsLiability(cardPlayed)) ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined);
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Shibari") && cardPlayed.Type != "Event" && ClubCardIsLiability(cardPlayed)) ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined);
		}
	},
	{
		ID: 13005,
		Name: "Knot Tester",
		Group: ["Shibari"],
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined, "Event");
		}
	},
	{
		ID: 13006,
		Name: "Naughty Knotter",
		Group: ["Shibari"],
		FamePerTurn: 4,
		MoneyPerTurn: -3,
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 2, undefined, undefined, "Streets");
		}
	},

	// 14000 - Pets and Owners
	{
		ID: 14000,
		Name: "Bun Bun",
		Group: ["Pet"],
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -1);
			ClubCardPlayerAddFame(CCPlayer, 1);
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardCalculateLevelForPets(CCPlayer) >= 5) ClubCardPlayerAddFame(CCPlayer, 1);
			if (ClubCardGroupIsOnBoard(CCPlayer, "Owner")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 14001,
		Name: "Naughty Kitty",
		Group: ["Pet","Kemonomimi"],
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -3);
			ClubCardPlayerDiscardCard(CCPlayer, 100);
		},
		onDrawCard: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardCalculateLevelForPets(CCPlayer));
		}
	},
	{
		ID: 14002,
		Name: "Jessica",
		Group: ["Owner", "Mistress"],
		RequiredLevel: 5,
		MoneyPerTurn: 6,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet") && !ClubCardIsLiability(cardPlayed)) {
				ClubCardPlayerAddFame(CCPlayer, 1, this.Name);
				ClubCardPlayerDrawCard(CCPlayer, 1);
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet") && ClubCardIsLiability(cardPlayed)) {
				ClubCardPlayerAddFame(CCPlayer, 1, this.Name);
				ClubCardPlayerDrawCard(CCPlayer, 1);
			}
		}
	},
	{
		ID: 14003,
		Name: "MerMaid",
		Group: ["Pet", "Maid"],
		RequiredLevel: 4,
		FamePerTurn: 6,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -25);
			ClubCardPlayerDrawCard(CCPlayer, 1);
			if (ClubCardGroupIsOnBoard(CCPlayer, "Owner")) this.ExtraPlay = 1;
		},
		BeforeOpponentTurnEnd: function(CCPlayer) {
			this.ExtraPlay = 0;
		}
	},
	{
		ID: 14004,
		Name: "Puppy",
		Group: ["Pet"],
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -5);
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, Math.floor(ClubCardCalculateLevelForPets(CCPlayer) / 2));
			if (ClubCardGroupIsOnBoard(CCPlayer, "Owner")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 14005,
		Name: "Protective Owner",
		Group: ["Owner"],
		MoneyPerTurn: 1,
		FamePerTurn: -1
	},
	{
		ID: 14006,
		Name: "Feline Fatale",
		Group: ["Pet"],
		Prerequisite: "SelectOpponentMember",
		EffectType: "Removal",
		RequiredLevel: 3,
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			if (!ClubCardSelection) return;
			ClubCardPlayerAddMoney(CCPlayer, -13);
			const opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveFromBoard(opponent, ClubCardSelection);
		}
	},
	{
		ID: 14007,
		Name: "Wolf Girl",
		Group: ["Pet"],
		RequiredLevel: 2,
		MoneyPerTurn: -1,
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -7);
			ClubCardPlayerDiscardCard(ClubCardGetOpponent(CCPlayer), 1);
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, Math.floor(ClubCardCalculateLevelForPets(CCPlayer) / 2));
			if (ClubCardGroupIsOnBoard(CCPlayer, "Owner")) ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 14008,
		Name: "Pet Rock",
		Group: ["Pet"]
	},
	{
		ID: 14009,
		Name: "Show Dog",
		Group: ["Pet", "Submissive"],
		RequiredLevel: 4,
		MoneyPerTurn: 2,
		FamePerTurn: 5,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -15);
			for (const card of CCPlayer.Hand) {
				card.Revealed = true;
			}
		}
	},
	{
		ID: 14010,
		Name: "Miss Mouse",
		Group: ["Pet"],
		MoneyPerTurn: 1,
		FamePerTurn: -1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -1);
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet") && !ClubCardIsLiability(cardPlayed)) {
				const famePerPet = Math.floor(ClubCardCalculateLevelForPets(CCPlayer) / 2);
				ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -1 * famePerPet, this.Name);
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet") && ClubCardIsLiability(cardPlayed)) {
				const famePerPet = Math.floor(ClubCardCalculateLevelForPets(CCPlayer) / 2);
				ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -1 * famePerPet, this.Name);
			}
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Owner")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 14011,
		Name: "Rich Owner",
		Group: ["Owner"],
		RequiredLevel: 3,
		MoneyPerTurn: 3,
		FamePerTurn: -1,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet") && !ClubCardIsLiability(cardPlayed)) {
				const Money = Math.min(ClubCardGroupOnBoardCount(CCPlayer, "Pet"), 5);
				ClubCardPlayerAddMoney(CCPlayer, Money, this.Name);
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardCardHasGroup(cardPlayed, "Pet") && ClubCardIsLiability(cardPlayed)) {
				const Money = Math.min(ClubCardGroupOnBoardCount(CCPlayer, "Pet"), 5);
				ClubCardPlayerAddMoney(CCPlayer, Money, this.Name);
			}
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Maid")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 14012,
		Name: "Loving Owner",
		Group: ["Owner"],
		RequiredLevel: 4,
		MoneyPerTurn: 1,
		FamePerTurn: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Maid")) ClubCardPlayerAddMoney(CCPlayer, 1);
			if (ClubCardGroupOnBoardCount(CCPlayer, "Pet") > 5) ClubCardPlayerAddFame(CCPlayer, 2);
		}
	},
	{
		ID: 14013,
		Name: "Cheeky Hamster",
		Group: ["Pet"],
		RequiredLevel: 3,
		MoneyPerTurn: -1,
		FamePerTurn: -1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -10);
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, ClubCardCalculateLevelForPets(CCPlayer));
		}
	},

	// 15000 Subs and Slaves
	{
		ID: 15000,
		Name: "Kneeling Sub",
		Group: ["Submissive"],
		MoneyPerTurn: 1
	},
	{
		ID: 15001,
		Name: "Humbled Harper",
		Revealed: true,
		Group: ["Slave", "Exhibitionist"],
		onOpponentDrawCard: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 1);
			if (CCPlayer.Board.length > 5) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 15002,
		Name: "Miss N Spection",
		Group: ["Slave"],
		Prerequisite: "SelectCardInHand",
		RequiredLevel: 2,
		FamePerTurn: 1,
		MoneyPerTurn: -1,
		OnPlay: function(CCPlayer) {
			const index = CCPlayer.Hand.findIndex(c => c.UniqueID === ClubCardSelection?.UniqueID);
			ClubCardDiscardCard(CCPlayer, index);
			ClubCardPlayerDrawCard(CCPlayer, 1);
		},
		onDrawAction: function(CCPlayer) {
			if (CCPlayer.Hand.length < 1) ClubCardPlayerDrawCard(CCPlayer, 2);
		}
	},
	{
		ID: 15003,
		Name: "Nadu Nyla",
		Group: ["Slave"],
		RequiredLevel: 3,
		FamePerTurn: 2,
		MoneyPerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Event.length > 0) {
				ClubCardPlayerAddFame(CCPlayer, 2);
				ClubCardPlayerAddMoney(CCPlayer, 1);
			}
		}
	},
	{
		ID: 15004,
		Name: "Bottom Bitch",
		Group: ["Slave", "Submissive"],
		RequiredLevel: 4,
		FamePerTurn: -1,
		MoneyPerTurn: 2,
		BeforeTurnEnd: function(CCPlayer) {
			if (!ClubCardGroupIsOnBoard(CCPlayer, "Mistress")) ClubCardRemoveFromBoard(CCPlayer, this);
			else {
				const effectFame = (ClubCardGroupOnBoardCount(CCPlayer, "Submissive") - 1) * 2;
				ClubCardPlayerAddFame(CCPlayer, Math.min(effectFame, 10));
			}
		}
	},
	{
		ID: 15005,
		Name: "Tabled Tessa",
		Group: ["Submissive"],
		RequiredLevel: 3,
		MoneyPerTurn: 2,
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Level < ClubCardGetOpponent(CCPlayer).Level) {
				ClubCardPlayerAddMoney(CCPlayer, 1);
				ClubCardPlayerAddFame(CCPlayer, 1);
			}
		}
	},
	{
		ID: 15006,
		Name: "Debt Slave",
		Group: ["Slave"],
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.Level > 2) ClubCardPlayerAddMoney(CCPlayer, -1);
		},
		onMemberLeaveClub: function(CCPlayer, MemberLeft, DidntDiscard) {
			if (!DidntDiscard && !ClubCardIsLiability(MemberLeft)) {
				CCPlayer.DiscardPile.splice(CCPlayer.DiscardPile.findIndex(value => value.ID === MemberLeft.ID), 1);
				CCPlayer.Deck.push(ClubCardGetCopyCardByName(MemberLeft.Name));
				CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
				ClubCardRemoveFromBoard(CCPlayer, this);
			}
		}
	},

	// 16000 Kemonomimi
	{
		ID: 16000,
		Name: "Chirumi",
		Group: ["Kemonomimi"],
		MoneyPerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.DiscardPile.length > 2) ClubCardRemoveFromBoard(CCPlayer, this);
			else ClubCardPlayerAddFame(CCPlayer, CCPlayer.Level);
		}
	},
	{
		ID: 16001,
		Name: "Pack Member",
		Group: ["Kemonomimi"],
		RequiredLevel: 2,
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			if (CCPlayer.Board.length < ClubCardGetOpponent(CCPlayer).Board.length) CCPlayer.Hand.push(ClubCardGetCopyCardByName("Pack Member"));
		}
	},
	{
		ID: 16002,
		Name: "Brutus",
		Group: ["Kemonomimi", "Police"],
		RequiredLevel: 3,
		MoneyPerTurn: 4
	},
	{
		ID: 16003,
		Name: "Yunari",
		Group: ["Kemonomimi"],
		RequiredLevel: 4,
		FamePerTurn: 5,
		MoneyPerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.DiscardPile.length < 4) ClubCardRemoveFromBoard(CCPlayer, this);
		}
	},
	{
		ID: 16004,
		Name: "Pack Leader",
		Group: ["Kemonomimi", "Dominant"],
		RequiredLevel: 4,
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			const memberInStreets = CCPlayer.DiscardPile.filter(card => card.Name === "Pack Member");
			let fameBonus = Math.min(ClubCardNameCountOnBoard(CCPlayer, "Pack Member"), 5) + ((memberInStreets.length > 0) ? 2 : 0);
			ClubCardPlayerAddFame(CCPlayer, fameBonus);
		}
	},
	{
		ID: 16005,
		Name: "Mama Bear",
		Group: ["Kemonomimi", "ABDLMommy"],
		RequiredLevel: 4,
		MoneyPerTurn: 1,
		FamePerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby"), this.Name);
			/** @type {string[]} */
			let groupsOnBoard = [];
			for (const card of CCPlayer.Board) {
				if (card.Group) {
					for (const group of card.Group) {
						if (!groupsOnBoard.includes(group)) groupsOnBoard.push(group);
					}
				}
			}
			ClubCardPlayerAddFame(CCPlayer, groupsOnBoard.length, this.Name);
		}
	},
	{
		ID: 16006,
		Name: "Cute Bunny",
		Group: ["Kemonomimi", "ABDLBaby"],
		RequiredLevel: 4,
		MoneyPerTurn: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), 2, this.Name);
			CCPlayer.Hand.push(ClubCardGetCopyCardByName("Cute Bunny"));
		},
		onPlayedCard: function(CCPlayer) {
			if (ClubCardNameCountOnBoard(CCPlayer, "Cute Bunny") > CCPlayer.Level) ClubCardRemoveFromBoard(CCPlayer, this);
		}
	},
	{
		ID: 16007,
		Name: "Sewer Rat",
		Group: ["Kemonomimi", "Criminal"],
		RequiredLevel: 2,
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		BeforeTurnEnd: function(CCPlayer) {
			if (CCPlayer.DiscardPile.filter(card => card.Type !== "Event").length > 6) {
				ClubCardRemoveFromBoard(CCPlayer, this);
				ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -25, this.Name);
			}
		}
	},

	// 17000 Exhibitionists
	{
		ID: 17000,
		Name: "Sexhibitionist",
		Group: ["Exhibitionist"],
		Revealed: true,
		RequiredLevel: 5,
		FamePerTurn: 3,
		OnPlay: function(CCPlayer) {
			ClubCardAddCardsToDeck(ClubCardGetOpponent(CCPlayer), "Nude Photos", 3);
			ClubCardPlayerDrawCard(CCPlayer, 3);
			ClubCardPlayerDrawCard(ClubCardGetOpponent(CCPlayer), 3);
		}
	},
	{
		ID: 17001,
		Name: "Temptress",
		Group: ["Exhibitionist"],
		Revealed: true,
		RequiredLevel: 5,
		MoneyPerTurn: -4,
		FamePerTurn: 3,
		BeforeOpponentTurnEnd: function(CCPlayer) {
			if (CCPlayer.Deck.length < 1) ClubCardPlayerAddFame(CCPlayer, -7);
		},
		onOpponentDrawCard: function(CCPlayer) {
			ClubCardPlayerSteal(CCPlayer, 0, 1);
		}
	},
	{
		ID: 17002,
		Name: "Covert Canvas",
		Group: ["Exhibitionist"],
		Revealed: true,
		RequiredLevel: 4,
		FamePerTurn: 2,
		MoneyPerTurn: -2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 3);
			ClubCardPlayerDrawCard(ClubCardGetOpponent(CCPlayer), 3);
		},
		onOpponentDrawCard: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, 1);
		},
		onDrawCard: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 17003,
		Name: "Procuress",
		Group: ["Exhibitionist", "Staff"],
		Revealed: true,
		RequiredLevel: 4,
		MoneyPerTurn: -1,
		FamePerTurn: 2,
		EffectKey: 0,
		OnPlay: function(CCPlayer) {
			this.EffectKey ??= 0;
			for (let i = CCPlayer.Board.length; i > 5; i -= 6) {
				CCPlayer.Hand.push(ClubCardGetCopyCardByName("Exotic Dancer"));
				ClubCardPlayerAddMoney(CCPlayer, -2);
				this.EffectKey += 6;
			}
		},
		onPlayedCard: function(CCPlayer) {
			this.EffectKey ??= 0;
			if (CCPlayer.Board.length == this.EffectKey + 6) {
				CCPlayer.Hand.push(ClubCardGetCopyCardByName("Exotic Dancer"));
				ClubCardPlayerAddMoney(CCPlayer, -2);
				this.EffectKey += 6;
			}
		},
		onOpponentPlayedCard: function(CCPlayer) {
			this.EffectKey ??= 0;
			if (CCPlayer.Board.length == this.EffectKey + 6) {
				CCPlayer.Hand.push(ClubCardGetCopyCardByName("Exotic Dancer"));
				ClubCardPlayerAddMoney(CCPlayer, -2);
				this.EffectKey += 6;
			}
		}
	},
	{
		ID: 17004,
		Name: "Lingerie Model",
		Group: ["Exhibitionist"],
		Revealed: true,
		RequiredLevel: 3,
		MoneyPerTurn: 2,
		OnPlay: function(CCPlayer) {
			ClubCardAddCardsToDeck(ClubCardGetOpponent(CCPlayer), "New Clothes", 3);
		}
	},
	{
		ID: 17005,
		Name: "Window Shopper",
		RequiredLevel: 3,
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		ExtraPlay: 0,
		EffectKey: 0,
		BeforeTurnEnd: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			const exhibCount = ClubCardGroupOnBoardCount(CCPlayer, "Exhibitionist") + ClubCardGroupOnBoardCount(opponent, "Exhibitionist") + ClubCardGroupInHandCount(CCPlayer, "Exhibitionist") + ClubCardGroupInHandCount(opponent, "Exhibitionist");
			if (exhibCount > 11) ClubCardPlayerAddFame(CCPlayer, 4);
			this.ExtraPlay = 0;
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			this.ExtraPlay ??= 0;
			if (this.EffectKey == 0 && (cardPlayed.Name == "Streaker" || cardPlayed.Name == "Exotic Dancer" || cardPlayed.Name == "Nudist")) {
				this.ExtraPlay++;
				this.EffectKey++;
			}
		},
		AfterTurnEnd: function() {
			this.EffectKey = 0;
		},
	},
	{
		ID: 17006,
		Name: "Flasher",
		Group: ["Exhibitionist"],
		Revealed: true,
		RequiredLevel: 2,
		MoneyPerTurn: 2,
		FamePerTurn: -1,
		OnPlay: function(CCPlayer) {
			ClubCardAddCardsToDeck(ClubCardGetOpponent(CCPlayer), "Nude Photos", 2);
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (cardPlayed.Type != "Event" && !ClubCardIsLiability(cardPlayed)) ClubCardPlayerAddFame(CCPlayer, 1);
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardIsLiability(cardPlayed)) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 17007,
		Name: "Exotic Dancer",
		Group: ["Exhibitionist"],
		Revealed: true,
		FamePerTurn: 1,
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Procuress")) ClubCardPlayerAddMoney(CCPlayer,1);
			if (CCPlayer.Board.length > 15) ClubCardPlayerAddFame(CCPlayer,  1);
		}
	},
	{
		ID: 17008,
		Name: "Streaker",
		Group: ["Exhibitionist"],
		Revealed: true,
		FamePerTurn: 1,
		EffectType: "ToHand",
		Time: 4,
		OnPlay: function(CCPlayer) {
			ClubCardAddCardsToDeck(ClubCardGetOpponent(CCPlayer), "New Clothes");
		},
		turnStart: function (CCPlayer) {
			this.Time ??= 0;
			if (this.Time < 1) {
				CCPlayer.Hand.push(ClubCardGetCopyCardByName(this.Name));
				ClubCardPlayerDrawCard(CCPlayer, 1);
				ClubCardPlayerDrawCard(ClubCardGetOpponent(CCPlayer), 1);
			}
		}
	},
	{
		ID: 17009,
		Name: "Lewd Photographer",
		Group: ["Fetishist"],
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (!ClubCardIsLiability(cardPlayed) && ClubCardCardHasGroup(cardPlayed, "Exhibitionist")) {
				ClubCardPlayerAddMoney(CCPlayer, -1);
				ClubCardAddCardsToDeck(ClubCardGetOpponent(CCPlayer), "Nude Photos");
			}
		},
		onOpponentPlayedCard: function(CCPlayer, cardPlayed) {
			if (ClubCardIsLiability(cardPlayed) && ClubCardCardHasGroup(cardPlayed, "Exhibitionist")) {
				ClubCardPlayerAddMoney(CCPlayer, -1);
				ClubCardAddCardsToDeck(ClubCardGetOpponent(CCPlayer), "Nude Photos");
			}
		}
	},
	{
		ID: 17010,
		Name: "Unlucky Undresser",
		Group: ["Exhibitionist"],
		Revealed: true,
		FamePerTurn: -1,
		MoneyPerTurn: 1,
		OnPlay: function(CCPlayer) {
			ClubCardAddCardsToDeck(ClubCardGetOpponent(CCPlayer), "New Clothes");
			ClubCardAddCardsToDeck(ClubCardGetOpponent(CCPlayer), "Nude Photos", 2);
		}
	},

	// 18000 Latex
	{
		ID: 18000,
		Name: "Latex Amateur",
		Group: ["Latex"],
		onDrawAction: function() {
			if ((this.FamePerTurn ?? 0) < 3) this.FamePerTurn = (this.FamePerTurn ?? 0) + 1;
		},
		onPlayedCard: function() {
			if ((this.FamePerTurn ?? 0) > 0) this.FamePerTurn = 0;
		}
	},
	{
		ID: 18001,
		Name: "Suit Polisher",
		Group: ["Latex"],
		onDrawAction: function() {
			if ((this.MoneyPerTurn ?? 0) < 3) this.MoneyPerTurn = (this.MoneyPerTurn ?? 0) + 1;
		},
		onPlayedCard: function() {
			if ((this.MoneyPerTurn ?? 0) > 0) this.MoneyPerTurn = 0;
		},
		BeforeTurnEnd: function(CCPlayer) {
			if (ClubCardNameIsOnBoard(CCPlayer, "Exquisite Suit")) ClubCardPlayerAddFame(CCPlayer, 1);
		}
	},
	{
		ID: 18002,
		Name: "Latex Lover",
		Group: ["Fetishist"],
		FamePerTurn: 1,
		onDrawAction: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, Math.min(ClubCardGroupOnBoardCount(CCPlayer, "Latex"), CCPlayer.Level));
		}
	},
	{
		ID: 18003,
		Name: "Color Mixer",
		Group: ["Latex"],
		FamePerTurn: 1,
		Prerequisite: "SelectOwnMember",
		OnPlay: function(CCPlayer) {
			if (!ClubCardSelection) return;
			if (ClubCardCardHasGroup(ClubCardSelection, "Latex")) {
				CCPlayer.Board[CCPlayer.Board.length -1].Group = ClubCardSelection.Group;
			} else if (ClubCardSelection.Group) {
				CCPlayer.Board[CCPlayer.Board.length -1].Group = this.Group?.concat(ClubCardSelection.Group);
			}
		}
	},
	{
		ID: 18004,
		Name: "Vac-bed Patient",
		Group: ["Latex", "AsylumPatient"],
		onDrawAction: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, 1);
			ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 18005,
		Name: "Shine Simp",
		Group: ["Latex", "Exhibitionist"],
		RequiredLevel: 2,
		MoneyPerTurn: 2,
		Revealed: true,
		onDrawAction: function(CCPlayer) {
			const latexCount = Math.min(ClubCardGroupOnBoardCount(CCPlayer, "Latex"), 4);
			ClubCardPlayerAddFame(CCPlayer, latexCount * -1);
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), latexCount * -1);
		}
	},
	{
		ID: 18006,
		Name: "Latex Drone",
		Group: ["Latex"],
		RequiredLevel: 3,
		FamePerTurn: 2,
		MoneyPerTurn: 1,
	},
	{
		ID: 18007,
		Name: "Encased",
		Group: ["Latex", "Slave"],
		RequiredLevel: 3,
		FamePerTurn: 2,
		MoneyPerTurn: 6,
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (!ClubCardCardHasGroup(cardPlayed, "Latex") && !ClubCardCardHasGroup(cardPlayed, "Dominant") && cardPlayed.Type !== "Event") ClubCardRemoveFromBoard(CCPlayer, this);
		}
	},
	{
		ID: 18008,
		Name: "Exquisite Suit",
		Group: ["Latex"],
		RequiredLevel: 3,
		FamePerTurn: 2,
		MoneyPerTurn: -1,
		onDrawAction: function() {
			if ((this.FamePerTurn ?? 0) < 6) this.FamePerTurn = (this.FamePerTurn ?? 0) + 1;
			if ((this.MoneyPerTurn ?? 0) > -4) this.MoneyPerTurn = (this.MoneyPerTurn ?? 0) - 1;
		},
		onPlayedCard: function(CCPlayer, cardPlayed) {
			if (!ClubCardCardHasGroup(cardPlayed, "Latex") && cardPlayed.Type !== "Event") {
				this.Negated = true;
				this.Negating = this.UniqueID;
			}
		}
	},
	{
		ID: 18009,
		Name: "Latex Nurse",
		Group: ["Latex", "AsylumNurse"],
		RequiredLevel: 3,
		FamePerTurn: 1,
		MoneyPerTurn: 2,
		Prerequisite: "SelectCardInHand",
		OnPlay: function (CCPlayer) {
			if (!ClubCardSelection) return;
			const selection = ClubCardSelection;
			const index = CCPlayer.Hand.findIndex(c => c.UniqueID === selection.UniqueID);
			ClubCardDiscardCard(CCPlayer, index);
			const copy = ClubCardGetCopyCardByName("Vac-bed Patient");
			if (ClubCardCanSummonCard(CCPlayer, copy)) {
				ClubCardSummonCard(CCPlayer, copy);
			}
		}
	},
	{
		ID: 18010,
		Name: "Condom Suit",
		Group: ["Latex"],
		RequiredLevel: 4,
		FamePerTurn: 3,
		MoneyPerTurn: 1
	},
	{
		ID: 18011,
		Name: "Full Catsuit",
		Group: ["Latex"],
		RequiredLevel: 5,
		FamePerTurn: 3,
		MoneyPerTurn: 3,
		onDrawAction: function(CCPlayer) {
			if((this.FamePerTurn ?? 0) < 13) this.FamePerTurn = Math.min((this.FamePerTurn ?? 0) + 2, 13);
			if((this.MoneyPerTurn ?? 0) < 13) this.MoneyPerTurn = Math.min((this.MoneyPerTurn ?? 0) + 2, 13);
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -1);
			ClubCardPlayerAddMoney(ClubCardGetOpponent(CCPlayer), -1);
		}
	},
	{
		ID: 18012,
		Name: "Goddess Gleam",
		Group: ["Latex"],
		RequiredLevel: 5,
		FamePerTurn: 4,
		MoneyPerTurn: -2,
		onDrawAction: function(CCPlayer) {
			if((this.FamePerTurn ?? 0) < 18) this.FamePerTurn = Math.min((this.FamePerTurn ?? 0) + 3, 18);
			if((this.MoneyPerTurn ?? 0) > -10) this.MoneyPerTurn = Math.max((this.MoneyPerTurn ?? 0) - 2, -10);
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -2);
		}
	},

	// Event cards
	{
		ID: 30000,
		Name: "Scratch and Win",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 7 + Math.floor(Math.random() * 3), this.Name);
		}
	},
	{
		ID: 30001,
		Name: "Kinky Garage Sale",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 15, this.Name);
		}
	},
	{
		ID: 30002,
		Name: "Second Mortgage",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 20, this.Name);
		}
	},
	{
		ID: 30003,
		Name: "Foreign Investment",
		Type: "Event",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 30, this.Name);
		}
	},
	{
		ID: 30004,
		Name: "Cat Burglar",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			const StealAmount = ClubCardGetOpponent(CCPlayer).Level;
			ClubCardPlayerSteal(CCPlayer, StealAmount, StealAmount);
			if (!ClubCardGroupIsOnBoard(ClubCardGetOpponent(CCPlayer), "Police") || ClubCardNameIsOnBoard(ClubCardGetOpponent(CCPlayer), "The Butler", true)) ClubCardPlayerSteal(CCPlayer, StealAmount, StealAmount);
		}
	},
	{
		ID: 30005,
		Name: "Money Heist",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerSteal(CCPlayer, 6, 0);
			if (ClubCardGroupIsOnBoard(CCPlayer, "Criminal")) ClubCardPlayerSteal(CCPlayer, 2, 0);
			if (!ClubCardGroupIsOnBoard(ClubCardGetOpponent(CCPlayer), "Police") || ClubCardNameIsOnBoard(ClubCardGetOpponent(CCPlayer), "The Butler", true))  ClubCardPlayerSteal(CCPlayer, 4, 0);
		}
	},
	{
		ID: 30006,
		Name: "BDSM Ball",
		Type: "Event",
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			for (const card of CCPlayer.Board) {
				if (ClubCardCardHasGroup(card, "Submissive") || ClubCardCardHasGroup(card, "Dominant")) card.FamePerTurn = (card.FamePerTurn ?? 0) + 1;
			}
		}
	},
	{
		ID: 30007,
		Name: "Vampire Ball",
		Type: "Event",
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			let Fame = 0;
			for (let Card of CCPlayer.Board)
				if ((Card.Group == null) || (!Card.Group.includes("Staff") && !Card.Group.includes("Maid") && !Card.Group.includes("Dominant") && !Card.Group.includes("Liability") && !Card.Group.includes("Kemonomimi") && !Card.Group.includes("Player")))
					Fame = Fame + 2;
			ClubCardPlayerAddFame(CCPlayer, Fame, this.Name);
		}
	},
	{
		ID: 30008,
		Name: "Straitjacket Saturday",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			let Money = ClubCardGroupOnBoardCount(CCPlayer, "AsylumPatient") * 4;
			ClubCardPlayerAddMoney(CCPlayer, Money, this.Name);
			ClubCardPlayerDrawGroupCard(CCPlayer, ["AsylumNurse"], undefined);
		}
	},
	{
		ID: 30009,
		Name: "Charity Auction",
		Type: "Event",
		Group: ["Auction"],
		Prerequisite: "SelectOwnMember",
		EffectType: "Removal",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
			let Fame = CCPlayer.Level;
			let auctioneersPresent = ClubCardNameCountOnBoard(CCPlayer, "Auctioneer", true);
			while (auctioneersPresent > 0) {
				Fame = Fame * 2;
				auctioneersPresent--;
			}
			ClubCardPlayerAddFame(CCPlayer, Fame, this.Name);
		}
	},
	{
		ID: 30010,
		Name: "Slave Auction",
		Type: "Event",
		Group: ["Auction"],
		Prerequisite: "SelectOwnMember",
		EffectType: "Removal",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
			let Money = CCPlayer.Level;
			let auctioneersPresent = ClubCardNameCountOnBoard(CCPlayer, "Auctioneer", true);
			while (auctioneersPresent > 0) {
				Money = Money * 2;
				auctioneersPresent--;
			}
			ClubCardPlayerAddMoney(CCPlayer, Money, this.Name);
		}
	},
	{
		ID: 30011,
		Name: "College Bash",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			let Fame = ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent") * (ClubCardNameIsOnBoard(CCPlayer, "Sidney") ? 3 : 2);
			ClubCardPlayerAddFame(CCPlayer, Fame, this.Name);
			ClubCardPlayerAddMoney(CCPlayer, -1 * ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent"), this.Name);
		}
	},
	{
		ID: 30012,
		Name: "Ransomware",
		Type: "Event",
		RequiredLevel: 2,
		Reward: "NPC_Infiltration_Supervisor",
		OnPlay: function(CCPlayer) {
			let Opponent = ClubCardGetOpponent(CCPlayer);
			let amount = Opponent.Level * -2;
			if (!ClubCardNameIsOnBoard(Opponent, "Amanda") && !ClubCardNameIsOnBoard(Opponent, "Jennifer")) amount = Opponent.Level * -4;
			ClubCardPlayerAddMoney(Opponent, amount, this.Name);
		}
	},
	{
		ID: 30013,
		Name: "Shibari Evening",
		Type: "Event",
		Group: ["Shibari"],
		Reward: "NPC_Shibari_Student",
		OnPlay: function(CCPlayer) {
			if ((CCPlayer.Board == null) || (CCPlayer.Board.length <= 0)) return;
			let Fame = CCPlayer.Board.length - ClubCardGroupOnBoardCount(CCPlayer, "Dominant");

			const shibariCardsOnBoard = ClubCardGroupOnBoardCount(CCPlayer, "Shibari");
			Fame = Fame + shibariCardsOnBoard;
			ClubCardPlayerAddFame(CCPlayer, Fame, this.Name);
		}
	},
	{
		ID: 30014,
		Name: "Moving Out of Town",
		Type: "Event",
		Prerequisite: "SelectOpponentMember",
		EffectType: "Removal",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			if (!ClubCardSelection) return;
			ClubCardRemoveFromBoard(ClubCardGetOpponent(CCPlayer), ClubCardSelection);
		}
	},
	{
		ID: 30015,
		Name: "Virtual Meeting",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 2);
		}
	},
	{
		ID: 30016,
		Name: "Weekend Meeting",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 3);
		}
	},
	{
		ID: 30017,
		Name: "Fancy Meeting",
		Type: "Event",
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 4);
		}
	},
	{
		ID: 30018,
		Name: "Prank",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDiscardCard(ClubCardGetOpponent(CCPlayer), 2);
		}
	},
	{
		ID: 30019,
		Name: "Sabotage",
		Type: "Event",
		Group: ["TimedEvent"],
		RequiredLevel: 4,
		Time: 3,
		BeforeOpponentTurnEnd: function(CCPlayer) {
			if (ClubCardTurnCardPlayed > 0) ClubCardPlayerDiscardCard(CCPlayer, 1);
		},
		onOpponentDrawAction: function(CCPlayer) {
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -10, "Sabotage");
		}
	},
	{
		ID: 30020,
		Name: "Nursery Night",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			let fame = Math.min(ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby"), ClubCardGroupOnBoardCount(CCPlayer, "ABDLMommy")) * 6;
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -fame, this.Name);
			if (ClubCardGroupIsOnBoard(CCPlayer, "Maid")) ClubCardPlayerAddFame(CCPlayer, fame / 2, this.Name);
		}
	},
	{
		ID: 30021,
		Name: "Kidnapping",
		Type: "Event",
		Reward: "NPC_KidnapLeague_RandomKidnapper",
		Prerequisite: "SelectOpponentMember",
		EffectType: "Removal",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;

			const targetIsDominantOrMistress = ClubCardCardHasGroup(ClubCardSelection, "Dominant") || ClubCardCardHasGroup(ClubCardSelection, "Mistress");
			if (targetIsDominantOrMistress) {
				let slavesToSummon = ClubCardNameCountOnBoard(CCPlayer, "Alvin", true);
				while (slavesToSummon > 0) {
					ClubCardAlvinCondition(CCPlayer);
					slavesToSummon--;
				}
			}

			let Opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveFromBoard(Opponent, ClubCardSelection);
			let Money = Math.pow(Opponent.Level, 2);
			ClubCardPlayerAddMoney(CCPlayer, Money * -1, this.Name);
		}
	},
	{
		ID: 30022,
		Name: "Pandora Box",
		Type: "Event",
		Reward: "Pandora-Loot-Box",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			for (let i = CCPlayer.Hand.length - 1; i >= 0; i--) ClubCardDiscardCard(CCPlayer, i);
			while (CCPlayer.Hand.length < 4) {
				if (CCPlayer.Deck.length < 1) break;
				ClubCardPlayerDrawCard(CCPlayer, 1);
			}
			ClubCardPlayerDrawCard(CCPlayer, 1);
			const opponent = ClubCardGetOpponent(CCPlayer);
			while (opponent.Hand.length < 4) {
				if (opponent.Deck.length < 1) break;
				ClubCardPlayerDrawCard(opponent, 1);
			}
			ClubCardPlayerDrawCard(opponent, 1);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Pandora Box", {}, CCPlayer);
		}
	},
	{
		ID: 30023,
		Name: "Toy Box",
		Type: "Event",
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 3, this.Name);
			ClubCardPlayerAddFame(CCPlayer, 3, this.Name);
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},
	{
		ID: 30024,
		Name: "Restrain",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 2,
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			const Opponent = ClubCardGetOpponent(CCPlayer);
			for (const card of CCPlayer.Event) {
				if (card.Name != "Restrain") card.Negated = true;
				if (card.Name == "Ball Gag") card.onLeaveClub?.(CCPlayer);
			}
			for (const card of Opponent.Event) {
				card.Negated = true;
				if (card.Name == "Ball Gag") card.onLeaveClub?.(Opponent);
			}
			if ((CCPlayer.Level + 1) < Opponent.Level) {
				this.Time ??= 0;
				this.Time--;
			}
		},
		onLeaveClub: function(CCPlayer) {
			const Opponent = ClubCardGetOpponent(CCPlayer);
			for (const card of CCPlayer.Event) {
				ClubCardCancelNegation(CCPlayer, card);
			}
			for (const card of Opponent.Event) {
				ClubCardCancelNegation(Opponent, card);
			}
		}
	},
	{
		ID: 30025,
		Name: "Launder",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			let Money = CCPlayer.Money;
			ClubCardPlayerAddMoney(CCPlayer, Money * -1);
			let Fame = Math.floor(Money / 3);
			ClubCardPlayerAddFame(CCPlayer, Fame, this.Name);
		},
		StreetsTurnEnd: function(CCPlayer) {
			CCPlayer.Deck.push(this);
			CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
			CCPlayer.DiscardPile.splice(CCPlayer.DiscardPile.findIndex(value => value.ID === this.ID), 1);
		},
		CanPlay: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Criminal") && CCPlayer.Money >= 3) return true;
			return false;
		}
	},
	{
		ID: 31000,
		Name: "Bad Press",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 3,
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromEventByName(ClubCardGetOpponent(CCPlayer), "Clever Marketing");
		},
		AfterOpponentTurnEnd: function(CCPlayer) {
			let Fame = CCPlayer.LastFamePerTurn ?? 0;
			if (Fame > 0) {
				ClubCardPlayerAddFame(CCPlayer, Fame * -1);
				CCPlayer.LastFamePerTurn = 0;
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Bad Press", {}, CCPlayer);
			}
		}
	},
	{
		ID: 31001,
		Name: "Clever Marketing",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 3,
		EffectKey: 1,
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromEventByName(ClubCardGetOpponent(CCPlayer), "Bad Press");
		},
		AfterTurnEnd: function (CCPlayer) {
			let Fame = CCPlayer.LastFamePerTurn ?? 0;
			const selfCard = CCPlayer.Event.find(c => c.Name === this.Name);
			if (Fame > 0) {
				const fameMultiplier = selfCard ? (selfCard.EffectKey ?? 1) * 0.5 : 0.5;
				ClubCardPlayerAddFame(CCPlayer, Math.floor(Fame * fameMultiplier));
				CCPlayer.LastFamePerTurn = Fame + (Math.floor(Fame * fameMultiplier));
				ClubCardMessageAdd(ClubCardMessageType.TURNENDEFFECT, "Effect Clever Marketing", {}, CCPlayer);
			}
			if (selfCard) {
				selfCard.EffectKey ??= 1;
				selfCard.EffectKey++;
			}
		}
	},
	{
		ID: 31002,
		Name: "Repay Loan",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 3,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromEventByName(ClubCardGetOpponent(CCPlayer), "Bank Loan");
		},
		AfterOpponentTurnEnd: function(CCPlayer) {
			let Money = CCPlayer.LastMoneyPerTurn ?? 0;
			if (Money > 0) {
				ClubCardPlayerAddMoney(CCPlayer, Money * -1);
				CCPlayer.LastMoneyPerTurn = 0;
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Repay Loan", {}, CCPlayer);
			}
		}
	},
	{
		ID: 31003,
		Name: "Bank Loan",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 3,
		OnPlay: function(CCPlayer) {
			ClubCardRemoveFromEventByName(ClubCardGetOpponent(CCPlayer), "Repay Loan");
		},
		AfterTurnEnd: function (CCPlayer) {
			let Money = CCPlayer.LastMoneyPerTurn ?? 0;
			if (Money > 0) {
				ClubCardPlayerAddMoney(CCPlayer, Money);
				CCPlayer.LastMoneyPerTurn = Money * 2;
				ClubCardMessageAdd(ClubCardMessageType.TURNENDEFFECT, "Effect Bank Loan", {}, CCPlayer);
			}
		}
	},
	{
		ID: 31004,
		Name: "Teamwork",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 4,
		onDrawAction: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},
	{
		ID: 31005,
		Name: "Overtime",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 3,
		ExtraPlay: 1
	},
	{
		ID: 31006,
		Name: "Porn Convention",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 3,
		RequiredLevel: 4,
		BeforeTurnEnd: function(CCPlayer) {
			let Fame =  Math.min(4, ClubCardGroupOnBoardCount(CCPlayer, "PornActress")) * 3;
			if (Fame > 0) {
				ClubCardPlayerAddFame(CCPlayer, Fame, this.Name);
			}
		},
		BeforeOpponentTurnEnd: function(CCPlayer) {
			let Fame = Math.min(4, ClubCardGroupOnBoardCount(CCPlayer, "PornActress")) * 3;
			if (Fame > 0) {
				ClubCardPlayerAddFame(CCPlayer, Fame, this.Name);
			}
		}
	},
	{
		ID: 31007,
		Name: "Daycare Party",
		Type: "Event",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			const mommyCount = ClubCardGroupOnBoardCount(CCPlayer, "ABDLMommy");
			const fame = mommyCount * 4;
			ClubCardPlayerAddFame(CCPlayer, fame, this.Name);
			ClubCardPlayerDrawCard(CCPlayer, mommyCount);
		}
	},
	{
		ID: 31008,
		Name: "Homeroom",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 4,
		CanPlay: function(CCPlayer) {
			const collegeCards = CCPlayer.Board.filter(
				card => ClubCardCardHasGroup(card, "CollegeStudent") || ClubCardCardHasGroup(card, "CollegeTeacher")
			);

			return collegeCards.length >= 3;
		}
	},
	{
		ID: 31009,
		Name: "Recess",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			const abdlBabies = ClubCardGroupOnBoardCount(CCPlayer, "ABDLBaby");
			const collegeStudents = ClubCardGroupOnBoardCount(CCPlayer, "CollegeStudent");
			const abdlAndCollegeBonus = (abdlBabies + collegeStudents) * 2;

			ClubCardPlayerDrawCard(CCPlayer, 2);
			ClubCardPlayerAddMoney(CCPlayer, abdlAndCollegeBonus, this.Name);
		}
	},
	{
		ID: 31010,
		Name: "First Bell",
		Type: "Event",
		Time: 0,
		OnPlay: function(CCPlayer) {
			const hasTeacher = ClubCardGroupIsOnBoard(CCPlayer, "CollegeTeacher");
			if (CCPlayer.ClubCardTurnCounter === 1 || hasTeacher) {
				this.ExtraPlay = 1;
			}

			const drawn = ClubCardPlayerDrawGroupCard(CCPlayer, ["CollegeStudent"], undefined);
			const textGetKey = drawn
				? "Effect First Bell Draw"
				: "Effect First Bell No Draw";
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, textGetKey, {}, CCPlayer);

		}
	},
	{
		ID: 31011,
		Name: "Help Button",
		Type: "Event",
		RequiredLevel: 2,
		Prerequisite: "SelectOwnMember",
		EffectType: "Removal",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection, true);

			// Return the card to its owner's deck
			if (ClubCardIsLiability(ClubCardSelection)) {
				let Opponent = ClubCardGetOpponent(CCPlayer);
				Opponent.Deck.push(ClubCardGetCopyCardByName(ClubCardSelection.Name));
				Opponent.Deck = ClubCardShuffle(Opponent.Deck);
			} else {
				CCPlayer.Deck.push(ClubCardGetCopyCardByName(ClubCardSelection.Name));
				CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
			}

			// Summon a maid or nurse if possible
			const summoned = ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Maid", "AsylumNurse"], 1, ClubCardSelection.RequiredLevel);
			if (!summoned)
				ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Help Button No Draw", {}, CCPlayer);
		}
	},
	{
		ID: 31012,
		Name: "Public Spanking",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 3,
		RequiredLevel: 2,
		BeforeTurnEnd: function (CCPlayer) {
			let domsOnBoard = CCPlayer.Board.filter(card => ClubCardCardHasGroup(card, "Dominant"));
			//Maximum Dominant RequiredLevel on the board or 0 if there are none.
			let fameReduction = domsOnBoard.reduce((max, card) => Math.max(max, card.RequiredLevel ?? 1), 0);
			let penalty = 4 + fameReduction;

			const opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardPlayerAddFame(opponent, -penalty);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Public Spanking", {[ClubCardPlaceholderKeys.FAMEAMOUNT]: penalty }, opponent);
		}
	},
	{
		ID: 31013,
		Name: "Burlington Bowtie",
		Type: "Event",
		Group: ["Knot"],
		OnPlay: function(CCPlayer) {
			const senseiInClub = CCPlayer.Board.filter(card => ClubCardCardHasGroup(card, "Sensei"));
			const amount = 4 + (senseiInClub.length * 2);
			ClubCardPlayerAddFame(CCPlayer, amount);
			ClubCardMessageAdd(ClubCardMessageType.KNOTEVENT, "Effect Burlington Bowtie", {[ClubCardPlaceholderKeys.FAMEAMOUNT]: amount},CCPlayer);
		}
	},
	{
		ID: 31014,
		Name: "Square Knot",
		Type: "Event",
		Group: ["Knot"],
		OnPlay: function (CCPlayer) {
			const fame = 4;
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), -fame);
			ClubCardMessageAdd(ClubCardMessageType.KNOTEVENT, "Effect Square Knot", {[ClubCardPlaceholderKeys.FAMEAMOUNT]: fame}, CCPlayer);
			if (ClubCardGroupIsOnBoard(CCPlayer, "Sensei")) {
				ClubCardPlayerAddFame(CCPlayer, fame);
				ClubCardMessageAdd(ClubCardMessageType.KNOTEVENT, "Effect Square Knot Sensei", {[ClubCardPlaceholderKeys.FAMEAMOUNT]: fame}, CCPlayer);
			}
		}
	},
	{
		ID: 31015,
		Name: "Closed Hitch",
		Type: "Event",
		Group: ["Knot"],
		OnPlay: function(CCPlayer) {
			ClubCardPlayerDrawCard(CCPlayer, 1);
			ClubCardMessageAdd(ClubCardMessageType.KNOTEVENT, "Effect Closed Hitch", {}, CCPlayer);
		}
	},
	{
		ID: 31016,
		Name: "Struggler's Knot",
		Type: "Event",
		Group: ["Knot"],
		ExtraPlay: 1,
		Time: 0
	},
	{
		ID: 31017,
		Name: "Quick Release Knot",
		Type: "Event",
		Group: ["Knot"],
		OnPlay: function(CCPlayer) {
			const knotsInDiscardPile = CCPlayer.DiscardPile.filter(card => ClubCardCardHasGroup(card, "Knot"));
			const amount = 3 + knotsInDiscardPile.length;
			ClubCardPlayerAddMoney(CCPlayer, amount);
			for (const card of knotsInDiscardPile) {
				CCPlayer.Deck.push(card);
				const indexToRemove = CCPlayer.DiscardPile.findIndex(c => c.ID === card.ID);
				CCPlayer.DiscardPile.splice(indexToRemove, 1);
			}
			CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
			ClubCardMessageAdd(ClubCardMessageType.KNOTEVENT, "Effect Quick Release Knot", {[ClubCardPlaceholderKeys.MONEYAMOUNT]: amount}, CCPlayer);
		}
	},
	{
		ID: 31018,
		Name: "Rope Auction",
		Type: "Event",
		Group: ["Shibari", "Auction"],
		RequiredLevel: 2,
		Prerequisite: "SelectOwnMember",
		EffectType: "Removal",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection);
			let knotsToPlay = 1;
			let auctioneersPresent = ClubCardNameCountOnBoard(CCPlayer, "Auctioneer", true);
			while (auctioneersPresent > 0) {
				knotsToPlay = knotsToPlay * 2;
				auctioneersPresent--;
			}
			ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], knotsToPlay, undefined);
		}
	},
	{
		ID: 31019,
		Name: "Tie Tight",
		Type: "Event",
		Group: ["Shibari"],
		RequiredLevel: 3,
		Prerequisite: "SelectOpponentMember",
		EffectType: "Removal",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;

			const opponent = ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveFromBoard(opponent, ClubCardSelection, true);
			opponent.Deck.push(ClubCardGetCopyCardByName(ClubCardSelection.Name));
			opponent.Deck = ClubCardShuffle(opponent.Deck);

			if (!ClubCardGroupIsOnBoard(CCPlayer, "Sensei")) ClubCardPlayerDrawCard(opponent, 1);
		}
	},
	{
		ID: 31020,
		Name: "Master Class",
		Type: "Event",
		Group: ["Shibari", "TimedEvent"],
		RequiredLevel: 3,
		Time: 4,
		turnStart: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Sensei")) {
				ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, ["Knot"], 1, undefined);
			}
		}
	},
	{
		ID: 31021,
		Name: "Fit To Be Tied",
		Type: "Event",
		Group: ["Shibari"],
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			let knotsInHand = CCPlayer.Hand.filter(card => ClubCardCardHasGroup(card, "Knot") && ClubCardCanSummonCard(CCPlayer, card));
			let knotsInDeck = CCPlayer.Deck.filter(card => ClubCardCardHasGroup(card, "Knot") && ClubCardCanSummonCard(CCPlayer, card));
			let knotsInDiscard = CCPlayer.DiscardPile.filter(card => ClubCardCardHasGroup(card, "Knot") && ClubCardCanSummonCard(CCPlayer, card));

			CCPlayer.Hand = CCPlayer.Hand.filter(card => !(ClubCardCardHasGroup(card, "Knot") && ClubCardCanSummonCard(CCPlayer, card)));
			CCPlayer.Deck = CCPlayer.Deck.filter(card => !(ClubCardCardHasGroup(card, "Knot") && ClubCardCanSummonCard(CCPlayer, card)));
			CCPlayer.DiscardPile = CCPlayer.DiscardPile.filter(card => !(ClubCardCardHasGroup(card, "Knot") && ClubCardCanSummonCard(CCPlayer, card)));

			for (const card of knotsInHand) {
				ClubCardSummonCard(CCPlayer, card);
			}
			for (const card of knotsInDeck) {
				ClubCardSummonCard(CCPlayer, card);
			}
			for (const card of knotsInDiscard) {
				ClubCardSummonCard(CCPlayer, card);
			}
			const knotsToReturn = CCPlayer.DiscardPile.filter(card => ClubCardCardHasGroup(card, "Knot"));
			for (const card of knotsToReturn) {
				CCPlayer.Deck.push(card);
				const indexToRemove = CCPlayer.DiscardPile.findIndex(c => c.ID === card.ID);
				CCPlayer.DiscardPile.splice(indexToRemove, 1);
			}
			CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
		}
	},
	{
		ID: 31022,
		Name: "Pet toys",
		Type: "Event",
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			const PetsCount = ClubCardGroupOnBoardCount(CCPlayer, "Pet");
			ClubCardPlayerAddMoney(CCPlayer, -PetsCount, this.Name);
			ClubCardPlayerAddFame(CCPlayer, PetsCount * (ClubCardGroupIsOnBoard(CCPlayer, "Owner") ? 3 : 2), this.Name);
		}
	},
	{
		ID: 31023,
		Name: "Tips",
		Type: "Event",
		Group: ["TimedEvent"],
		Time: 5,
		turnStart: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, 1);
		}
	},
	{
		ID: 31024,
		Name: "Feather Duster",
		Type: "Event",
		Prerequisite: "SelectAnyEvent",
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;

			const isPlayerBoard = ClubCardSelection.Location === "PlayerBoard";
			const targetPlayer = isPlayerBoard ? CCPlayer : ClubCardGetOpponent(CCPlayer);
			ClubCardRemoveFromEvent(targetPlayer, ClubCardSelection);

			if (ClubCardGroupIsOnBoard(CCPlayer, "Maid")) {
				ClubCardPlayerAddMoney(CCPlayer, ClubCardSelection.RequiredLevel ? ClubCardSelection.RequiredLevel : 1);
				ClubCardPlayerDrawCard(CCPlayer, 1);
			}
		}
	},
	{
		ID: 31025,
		Name: "Afterhours Service",
		Type: "Event",
		RequiredLevel: 5,
		Group: ["TimedEvent"],
		Time: 3,
		BeforeTurnEnd: function(CCPlayer) {
			let groupsCardsOnBoard = CCPlayer.Board.filter(value => /** @type {const} */ (["Maid", "Staff"]).some(group => ClubCardCardHasGroup(value, group)));
			const statToAdd = Math.min(groupsCardsOnBoard.length * 2, 18);
			ClubCardPlayerAddFame(CCPlayer, statToAdd);
			ClubCardPlayerAddMoney(CCPlayer, statToAdd * -1);
		}
	},
	{
		ID: 31026,
		Name: "Adoption",
		Type: "Event",
		Time : 0,
		OnPlay: function(CCPlayer) {
			let availablePets =  CCPlayer.DiscardPile.filter(value => ClubCardCardHasGroup(value, "Pet"));
			for (const card of availablePets) card.Location = "PlayerDiscardPile";
			availablePets = availablePets.concat(CCPlayer.Deck.filter(value => ClubCardCardHasGroup(value, "Pet")));
			const petToAdd = availablePets[Math.floor(Math.random() * availablePets.length)];
			if (petToAdd.Location == "PlayerDiscardPile") {
				CCPlayer.DiscardPile.splice(CCPlayer.DiscardPile.findIndex(value => value.ID === petToAdd.ID), 1);
			} else {
				CCPlayer.Deck.splice(CCPlayer.Deck.findIndex(value => value.ID === petToAdd.ID), 1);
			}
			CCPlayer.Hand.push(ClubCardGetCopyCardByName(petToAdd.Name));
			if ((petToAdd.RequiredLevel ? petToAdd.RequiredLevel : 0) <= CCPlayer.Level) this.ExtraPlay = 1;
		}
	},
	{
		ID: 31027,
		Name: "Vanilla Classic",
		Type: "Event",
		Group: ["Video"],
		Prerequisite: "SelectOwnMember",
		Time: 0,
		OnPlay: function(CCPlayer) {
			if (ClubCardSelection == null) return;
			ClubCardRemoveFromBoard(CCPlayer, ClubCardSelection, true);
			CCPlayer.Hand.push(ClubCardGetCopyCardByName(ClubCardSelection.Name));
			ClubCardPlayerDrawCard(CCPlayer, 1);
			this.ExtraPlay = 1;
		},
		CanPlay: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "PornActress")) return true;
			else return false;
		}
	},
	{
		ID: 31028,
		Name: "Ball Buster",
		Type: "Event",
		Group: ["Video", "TimedEvent"],
		Time: 2,
		RequiredLevel: 2,
		OnPlay: function(CCPlayer) {
			for (let i = 2; i > 0; i--) {
				let pornOnBoard = CCPlayer.Board.filter(card => ClubCardCardHasGroup(card, "PornActress"));
				let cardToReturn = pornOnBoard[Math.floor(Math.random() * pornOnBoard.length)];
				pornOnBoard.splice(pornOnBoard.findIndex(value => value.ID === cardToReturn.ID), 1);
				ClubCardRemoveFromBoard(CCPlayer, cardToReturn, true);
				CCPlayer.Hand.push(ClubCardGetCopyCardByName(cardToReturn.Name));
			}
		},
		CanPlay: function(CCPlayer) {
			if (ClubCardGroupOnBoardCount(CCPlayer, "PornActress") >= 2) return true;
			else return false;
		}
	},
	{
		ID: 31029,
		Name: "Fetish Flick",
		Type: "Event",
		Group: ["Video"],
		Time: 0,
		RequiredLevel: 3,
		ExtraPlay: 3,
		OnPlay: function(CCPlayer) {
			for (let i = 2; i > 0; i--) {
				let pornOnBoard = CCPlayer.Board.filter(card => ClubCardCardHasGroup(card, "PornActress"));
				let cardToReturn = pornOnBoard[Math.floor(Math.random() * pornOnBoard.length)];
				pornOnBoard.splice(pornOnBoard.findIndex(value => value.ID === cardToReturn.ID), 1);
				ClubCardRemoveFromBoard(CCPlayer, cardToReturn, true);
				CCPlayer.Hand.push(ClubCardGetCopyCardByName(cardToReturn.Name));
			}
		},
		CanPlay: function(CCPlayer) {
			if (ClubCardGroupOnBoardCount(CCPlayer, "PornActress") >= 2) return true;
			else return false;
		}
	},
	{
		ID: 31030,
		Name: "Re-Run",
		Type: "Event",
		Time: 0,
		OnPlay: function(CCPlayer) {
			const VideosFromStreets = CCPlayer.DiscardPile.filter(value => ClubCardCardHasGroup(value, "Video"));
			const randomVideo = VideosFromStreets[Math.floor(Math.random() * VideosFromStreets.length)];
			ClubCardPlayerAddFame(CCPlayer, randomVideo.RequiredLevel ? randomVideo.RequiredLevel : 1);
			CCPlayer.Hand.push(ClubCardGetCopyCardByName(randomVideo.Name));
			const indexToRemove = CCPlayer.DiscardPile.findIndex(c => c.ID === randomVideo.ID);
			CCPlayer.DiscardPile.splice(indexToRemove, 1);
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Re-Run", {[ClubCardPlaceholderKeys.CARDNAME]: randomVideo.Name, [ClubCardPlaceholderKeys.AMOUNT]: randomVideo.RequiredLevel ? randomVideo.RequiredLevel : 1}, CCPlayer);
			this.ExtraPlay = 1;
		},
		CanPlay: function(CCPlayer) {
			return CCPlayer.DiscardPile.filter(value => ClubCardCardHasGroup(value, "Video")).length > 0;
		}
	},
	{
		ID: 31031,
		Name: "Gangbang Banger",
		Type: "Event",
		Group: ["Video"],
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			const removedActresses = CCPlayer.Board.filter(card => card.Group?.includes("PornActress"));
			removedActresses.forEach(card => ClubCardRemoveFromBoard(CCPlayer, card, true));
			const copiedActresses = removedActresses.map(card => ClubCardGetCopyCardByID(card.ID));
			CCPlayer.Hand.push(...copiedActresses);

			const pornRelatedCount = CCPlayer.Hand.filter(card=> (card.Group?.includes("PornActress") || card.Group?.includes("Porn")) && card.Type !== "Event");
			pornRelatedCount.forEach(card => {
				const index = CCPlayer.Hand.findIndex(c => c.UniqueID === card.UniqueID);
				const pornCard = CCPlayer.Hand[index];
				if (ClubCardCanSummonCard(CCPlayer, pornCard))
					ClubCardSummonCard(CCPlayer, CCPlayer.Hand.splice(index, 1)[0]);
			});

			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Gangbang Banger", {}, CCPlayer);
		},
		CanPlay: function(CCPlayer) {
			return CCPlayer.Board.filter(card => card.Group?.includes("PornActress")).length != 0 || CCPlayer.Hand.filter(card=> (card.Group?.includes("PornActress") || card.Group?.includes("Porn")) && (card.Type === "Member" || card.Type == undefined)).length != 0;
		}
	},
	{
		ID: 31032,
		Name: "Surrender",
		Type: "Event",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			for (const card of CCPlayer.Board) {
				if (ClubCardCardHasGroup(card, "Slave")) card.FamePerTurn = (card.FamePerTurn ?? 0) + 1;
			}
		}
	},
	{
		ID: 31033,
		Name: "Hands Out",
		Type: "Event",
		Prerequisite: "SelectCardInHand",
		OnPlay: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Slave")) {
				for (let i = CCPlayer.Hand.length - 1; i >= 0; i--) {
					if (CCPlayer.Hand[i].UniqueID !== ClubCardSelection?.UniqueID) {
						if (ClubCardDiscardCard(CCPlayer, i)) ClubCardPlayerDrawCard(CCPlayer, 1);
					}
				}
			} else {
				for (let i = CCPlayer.Hand.length - 1; i >= 0; i--) {
					if (ClubCardDiscardCard(CCPlayer, i)) ClubCardPlayerDrawCard(CCPlayer, 1);
				}
			}
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},
	{
		ID: 31034,
		Name: "Instincts",
		Type: "Event",
		Group: ["ContinuousEvent"],
		Time: 99,
		OnPlay: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, -12);
			ClubCardPlayerDrawCard(CCPlayer, 3);
		},
		AfterTurnEnd: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Kemonomimi")) ClubCardRemoveFromEventByName(CCPlayer, this.Name);
			else {
				let Fame = CCPlayer.LastFamePerTurn ?? 0;
				if (Fame >0) {
					ClubCardPlayerAddFame(CCPlayer, Fame * -1);
					CCPlayer.LastFamePerTurn = 0;
				}
			}
		},
		turnStart: function() {
			this.Time = 99;
		}
	},
	{
		ID: 31035,
		Name: "Pack Tactics",
		Type: "Event",
		Group: ["TimedEvent"],
		RequiredLevel: 3,
		Time: 2,
		OnPlay: function(CCPlayer) {
			ClubCardSummonCard(CCPlayer, ClubCardGetCopyCardByName("Pack Member"));
		},
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), ClubCardNameCountOnBoard(CCPlayer, "Pack Member") * -1, this.Name);
		}
	},
	{
		ID: 31036,
		Name: "Conservation Efforts",
		Type: "Event",
		Group: ["TimedEvent"],
		RequiredLevel: 4,
		Time: 4,
		onDrawCard: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Kemonomimi")) {
				ClubCardPlayerAddMoney(CCPlayer, 2);
				ClubCardPlayerAddFame(CCPlayer, 2);
			}
		}
	},
	{
		ID: 31037,
		Name: "Ball Gag",
		Type: "Event",
		Group: ["ContinuousEvent"],
		Prerequisite: "SelectAnyMember",
		RequiredLevel: 2,
		Time: 99,
		OnPlay: function(CCPlayer) {
			if (!ClubCardSelection || !CommonIsNumeric(ClubCardSelection.ArrayIndex)) return;
			const indexToNegate = ClubCardSelection.ArrayIndex;
			let targetBoard = CCPlayer;
			if (ClubCardSelection.Location == "OpponentBoard") targetBoard = ClubCardGetOpponent(CCPlayer);
			targetBoard.Board[indexToNegate].Negated = true;
			this.Negating = ClubCardSelection.UniqueID;
			ClubCardPlayerAddMoney(CCPlayer, (Math.pow((ClubCardSelection.RequiredLevel ?? 1), 2) * -1));
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Ball Gag", {[ClubCardPlaceholderKeys.CARDNAME]: ClubCardSelection.Name});
		},
		onLeaveClub: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			for (const Card of CCPlayer.Board) {
				if (Card.UniqueID === this.Negating) ClubCardCancelNegation(CCPlayer, Card);
			}
			for (const Card of opponent.Board) {
				if (Card.UniqueID === this.Negating) ClubCardCancelNegation(opponent, Card);
			}
		},
		turnStart: function() {
			this.Time = 99;
		},
		onCancelNegation: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			for (const Card of CCPlayer.Board) {
				if (Card.UniqueID === this.Negating) Card.Negated = true;
			}
			for (const Card of opponent.Board) {
				if (Card.UniqueID === this.Negating) Card.Negated = true;
			}
		},
		CanPlay: function(CCPlayer) {
			if (ClubCardGroupIsOnBoard(CCPlayer, "Mistress")) return true;
			return false;
		}
	},
	{
		ID: 31038,
		Name: "Riot",
		Type: "Event",
		Group: ["TimedEvent"],
		RequiredLevel: 4,
		Time: 3,
		BeforeTurnEnd: function(CCPlayer) {
			ClubCardPlayerSteal(CCPlayer, 0, ClubCardGroupInDiscardPileCount(CCPlayer, "Criminal") * 2);
			ClubCardPlayerAddMoney(CCPlayer, ClubCardGroupOnBoardCount(CCPlayer, "Criminal") * 3, this.Name);
		}
	},
	{
		ID: 31039,
		Name: "New Clothes",
		Type: "Event",
		WhenDrawn: function(CCPlayer) {
			ClubCardPlayerAddMoney(CCPlayer, -3, this.Name);
			ClubCardPlayerAddFame(ClubCardGetOpponent(CCPlayer), 3, this.Name);
			CCPlayer.Hand.splice(CCPlayer.Hand.length - 1, 1);
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},
	{
		ID: 31040,
		Name: "Nude Photos",
		Type: "Event",
		WhenDrawn: function(CCPlayer) {
			ClubCardPlayerAddFame(CCPlayer, -4, this.Name);
			ClubCardPlayerAddMoney(ClubCardGetOpponent(CCPlayer), 2, this.Name);
			CCPlayer.Hand.splice(CCPlayer.Hand.length - 1, 1);
			ClubCardPlayerDrawCard(CCPlayer, 1);
		}
	},
	{
		ID: 31041,
		Name: "Walkies",
		RequiredLevel: 4,
		Prerequisite: "SelectCardInHand",
		Time: 0,
		ExtraPlay: 4,
		Type: "Event",
		OnPlay: function(CCPlayer) {
			for (let i = CCPlayer.Hand.length - 1; i >= 0; i--) {
				if (CCPlayer.Hand[i].UniqueID === ClubCardSelection?.UniqueID) {
					ClubCardDiscardCard(CCPlayer, i);
					break;
				}
			}
		},
		CanPlay: function(CCPlayer) {
			const petsExhibCount = ClubCardGroupInHandCount(CCPlayer, "Exhibitionist") + ClubCardGroupInHandCount(CCPlayer, "Pet");
			if (petsExhibCount > 0) return true;
			return false;
		}
	},
	{
		ID: 31042,
		Name: "Peek Performance",
		Type: "Event",
		RequiredLevel: 5,
		OnPlay: function(CCPlayer) {
			const opponent = ClubCardGetOpponent(CCPlayer);
			const exhibCount = Math.floor((ClubCardGroupOnBoardCount(CCPlayer, "Exhibitionist") + ClubCardGroupOnBoardCount(opponent, "Exhibitionist") + ClubCardGroupInHandCount(CCPlayer, "Exhibitionist") + ClubCardGroupInHandCount(opponent, "Exhibitionist")) / 3);
			ClubCardPlayerDrawCard(CCPlayer, 1 + exhibCount);
			ClubCardPlayerDrawCard(opponent, 1 + exhibCount);
		}
	},
	{
		ID: 31043,
		Name: "Shiny Parade",
		Type: "Event",
		RequiredLevel: 4,
		OnPlay: function(CCPlayer) {
			const draw = Math.min(Math.floor(ClubCardGroupOnBoardCount(CCPlayer, "Latex") / 2), 2);
			ClubCardPlayerDrawCard(CCPlayer, 1 + draw);
			ClubCardOnDrawAction(CCPlayer);
			ClubCardTurnCardPlayed = ClubCardTurnPlayableCardCount(CCPlayer);
		}
	},
	{
		ID: 31044,
		Name: "Polish and Shine",
		Type: "Event",
		RequiredLevel: 3,
		OnPlay: function(CCPlayer) {
			let summonNumber = 1;
			for (let i = 2; i > 0; i--) {
				let membersToPlay = CCPlayer.Hand.filter(value => ((value.RequiredLevel ?? 1) < 4) && ClubCardCanSummonCard(CCPlayer, value) && value.Type !== "Event");
				if (membersToPlay.length > 0) {
					if (summonNumber > 1) CCPlayer.Board[CCPlayer.Board.length - 1].Negated = true;
					const randomMember = membersToPlay[Math.floor(Math.random() * membersToPlay.length)];
					ClubCardSummonCard(CCPlayer, randomMember);
					const cardIndexInHand = CCPlayer.Hand.findIndex(value => value.ID === randomMember.ID);
					CCPlayer.Hand.splice(cardIndexInHand, 1);
					CCPlayer.Board[CCPlayer.Board.length - 2].Negated = undefined;
					if ((ClubCardCardHasGroup(randomMember, "Latex") || ClubCardCardHasGroup(randomMember, "Fetishist"))) {
						ClubCardPlayerAddMoney(CCPlayer, 3);
						ClubCardPlayerAddFame(CCPlayer, 3);
					}
				}
				summonNumber++;
			}
		}
	},
	{
		ID: 31045,
		Name: "Intense Training",
		Type: "Event",
		Group: ["Shibari"],
		Prerequisite: "SearchACard",
		RequiredLevel: 4,
		ExtraPlay: 1,
		Time: 0,
		OnPlay: function(CCPlayer) {
			if (!ClubCardSelection) {
				ClubCardCreatePopup("SEARCH", { CardsPool: CCPlayer.DiscardPile.filter(value => (ClubCardCardHasGroup(value, "Shibari") && ClubCardCanSummonCard(CCPlayer, value))) });
				return;
			} else {
				const selection = ClubCardSelection;
				CCPlayer.DiscardPile.splice(CCPlayer.DiscardPile.findIndex(value => value.ID === selection.ID), 1);
				CCPlayer.Hand.push(ClubCardGetCopyCardByName(ClubCardSelection.Name));
			}
		},
		CanPlay: function(CCPlayer) {
			if (CCPlayer.DiscardPile.filter(value => (ClubCardCardHasGroup(value, "Shibari") && ClubCardCanSummonCard(CCPlayer, value))).length < 1) return false;
			return true;
		}
	},
	{
		ID: 31046,
		Name: "Creaking",
		Type: "Event",
		Group: ["TimedEvent"],
		Prerequisite: "SelectOwnMember",
		Time: 6,
		OnPlay: function(CCPlayer) {
			if (!ClubCardSelection) return;
			CCPlayer.Board[ClubCardSelection?.ArrayIndex ?? 0].Negated = true;
			this.Negating = ClubCardSelection.UniqueID;
		},
		onLeaveClub: function(CCPlayer) {
			for (const card of CCPlayer.Board) if (card.UniqueID === this.Negating) ClubCardCancelNegation(CCPlayer, card);
		},
		onDrawAction: function(CCPlayer) {
			let fameGain = Math.min(ClubCardGroupOnBoardCount(CCPlayer, "Latex") * 2, CCPlayer.Level * 3);
			ClubCardPlayerAddFame(CCPlayer, fameGain, this.Name);
		}
	}
];

/**
 * Returns TRUE if the current game is online
 * @returns {boolean} - Nothing
 */
function ClubCardIsOnline() {
	return ((ClubCardOnlinePlayerMemberNumber1 != null) && (ClubCardOnlinePlayerMemberNumber1 >= 0));
}

/**
 * Returns TRUE if the BC Player is a player in the current Club Card game
 * @returns {boolean} - Nothing
 */
function ClubCardIsPlaying() {
	return ((ClubCardOnlinePlayerMemberNumber1 == null) || (ClubCardOnlinePlayerMemberNumber1 === -1) || (ClubCardOnlinePlayerMemberNumber1 == Player.MemberNumber) || (ClubCardOnlinePlayerMemberNumber2 == Player.MemberNumber));
}

/**
 * Start a ClubCard game against this opponent
 * @param {Character} opponent
 * @param {number[]} deck
 * @param {() => void} completion
 * @returns {SafePromise<void>}
 */
async function ClubCardStart(opponent, deck, completion) {
	ClubCardOpponent = opponent;
	ClubCardOpponentDeck = deck;
	await MiniGameStart("ClubCard", 0, completion);
}

/**
 * In case one of the players disconnects from the server, the other player sends a message about it to the game chat.
 * @param {number} disconnectedMemberNumber
 */
function ClubCardCheckDisconnected(disconnectedMemberNumber) {
	const isPlayer1 = Player.MemberNumber == ClubCardPlayer[0].Character.MemberNumber;
	const isPlayer2 = disconnectedMemberNumber == ClubCardPlayer[1].Character.MemberNumber;

	if (isPlayer1 && isPlayer2) {
		const CCPlayer = ClubCardPlayer[1];
		ClubCardMessageAdd(ClubCardMessageType.PLAYERSDISCONNECTED, "OnlinePlayerDisconnected", {}, CCPlayer);
	}
}

// #region Reset ClubCard Game Status

/**
 * Resets club card game status and synchronizes
 */
function ClubCardResetGameStatus() {
	const clubCard = Player.Game.ClubCard;
	if (clubCard) {
		clubCard.PlayerSlot = 0;
		clubCard.Status = "";
	}
	ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
	ChatRoomCharacterUpdate(Player);
}

/**
 * A hidden message to trigger all room members and a normal notification message to the chat room.
 */
function ClubCardSendRequestResetGame() {
	ServerSend("ChatRoomChat", { Content: "ClubCardAdminResetGameHidden", Type: "Hidden" });

	const Dictionary = new DictionaryBuilder().sourceCharacter(Player).build();
	ServerSend("ChatRoomChat", { Content: "ClubCardAdminResetGame", Type: "Action" , Dictionary: Dictionary});
}

// #endregion Reset Game Status

// #region Chat Log Stuff

/**
 * Adds a message to the storage for processing later.
 * Sends messages immediately if their type matches the ClubCardImmediateMessageTypes array.
 *
 * @param {ClubCardMessageType} MessageType - Message type (constant)
 * @param {string} TextGetKey - Localization key
 * @param {Record<string, any>} placeholders - Dynamic data for text replacement
 * @param {ClubCardPlayer|null} TargetPlayer - The source player
 */
function ClubCardMessageAdd(MessageType, TextGetKey, placeholders = {}, TargetPlayer = null) {
	const CCPlayer = ClubCardPlayer[ClubCardTurnIndex];
	let playerId = (CCPlayer.Control === "AI")
		? "ControlAI"
		: `${CCPlayer.Character.MemberNumber}`;

	if (TargetPlayer) {
		placeholders.SOURCEPLAYER = CharacterNickname(TargetPlayer.Character);
		placeholders.OPPONENTPLAYER = CharacterNickname(ClubCardGetOpponent(TargetPlayer).Character);
	}

	/** @type {ClubCardMessage} */
	const messageEntry = {
		TextGetKey: TextGetKey,
		MessageType: MessageType,
		PlayerId: playerId,
		TurnCounter: CCPlayer.ClubCardTurnCounter,
		Placeholders: placeholders,
	};

	// If the message type is immediate, send it directly and don't store it
	if (ClubCardImmediateMessageTypes.some(type => type === MessageType))
		ClubCardMessageSend(messageEntry);
	else
		ClubCardMessageStorage.push(messageEntry);
}

/**
 * Sends a message to the render log and synchronizes it with other players.
 * This method is used for immediate messages and for sending processed messages from storage.
 *
 * @param {ClubCardMessage} message - The message object to be sent
 * @param {boolean} Push - Whether to send the message to other players
 */
function ClubCardMessageSend(message, Push = true) {
	if (message) {
		// Add message to render log for display in the UI
		ClubCardRenderLog.push(message);
		// Enable auto-scrolling for the chat log
		ClubCardLogScroll = true;

		// Synchronize message with other players if online
		if (Push && ClubCardIsOnline() && message.MessageType != ClubCardMessageType.PREREQUISTITE)
			ServerSend("ChatRoomGame", { GameProgress: "Action", CCLog: message });
	}
}

/**
 * Processes stored messages, merges similar ones, clears the storage,
 * and sends all messages using the ClubCardSendMessage function.
 */
function ClubCardMessageSendAll() {
	if (ClubCardMessageStorage.length === 0) return;

	//TODO Process stored messages to merge similar ones
	ClubCardMessagePacketProcessing();

	// Send each processed message using the send function
	for (const message of ClubCardMessageStorage)
		ClubCardMessageSend(message);

	// Clear storage
	ClubCardMessageStorage = [];
}


// #### Text processing ####

/**
 * Processes and merges specific messages from the storage.
 */
function ClubCardMessagePacketProcessing() {
	const specialCases = ["Effect Hypnotherapist", "StealMoney", "StealFame", "Effect Gangbang Banger","Effect Housekeeper"];
	const mergeableKeys = ["Effect Rope Slave", "Effect Living Art"];

	const hasRelevantMessages = ClubCardMessageStorage.some(msg =>
		[...specialCases, ...mergeableKeys].includes(msg.TextGetKey)
	);
	if (!hasRelevantMessages) return;

	let ropeSlaveMessages = [];
	let livingArtMessages = [];
	let stealMoneyMessages = [];
	let stealFameMessages = [];
	let burlingtonBowtieMeesages = [];
	let squareKnotMeesages = [];
	let squareKnotSenseiMeesages = [];
	let closedHitchMeesages = [];
	let quickReleaseKnotMeesages = [];
	let housekeeper = [];

	let isHypnotherapist = false;
	let isGangbangBanger = false;

	for (const [i, message] of ClubCardMessageStorage.entries()) {
		if (message.TextGetKey === "Effect Rope Slave") ropeSlaveMessages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Living Art") livingArtMessages.push({ message, index: i });
		else if (message.TextGetKey === "StealMoney") stealMoneyMessages.push({ message, index: i });
		else if (message.TextGetKey === "StealFame") stealFameMessages.push({ message, index: i });

		else if (message.TextGetKey === "Effect Hypnotherapist") isHypnotherapist = true;
		else if (message.TextGetKey === "Effect Gangbang Banger") isGangbangBanger = true;

		else if (message.TextGetKey === "Effect Burlington Bowtie") burlingtonBowtieMeesages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Square Knot") squareKnotMeesages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Square Knot Sensei") squareKnotSenseiMeesages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Closed Hitch") closedHitchMeesages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Quick Release Knot") quickReleaseKnotMeesages.push({ message, index: i });
		else if (message.TextGetKey === "Effect Housekeeper") housekeeper.push({ message, index: i });
	}

	// ### Normal merging of messages into one
	if (ropeSlaveMessages.length > 1) ClubCardMessagesMergeByKeys(ropeSlaveMessages, [ClubCardPlaceholderKeys.MONEYAMOUNT]);
	if (livingArtMessages.length > 1) ClubCardMessagesMergeByKeys(livingArtMessages, [ClubCardPlaceholderKeys.FAMEAMOUNT]);
	if (burlingtonBowtieMeesages.length > 1) ClubCardMessagesMergeByKeys(burlingtonBowtieMeesages, [ClubCardPlaceholderKeys.FAMEAMOUNT]);
	if (squareKnotMeesages.length > 1) ClubCardMessagesMergeByKeys(squareKnotMeesages, [ClubCardPlaceholderKeys.FAMEAMOUNT]);
	if (squareKnotSenseiMeesages.length > 1) ClubCardMessagesMergeByKeys(squareKnotSenseiMeesages, [ClubCardPlaceholderKeys.FAMEAMOUNT]);
	if (closedHitchMeesages.length > 1) ClubCardMessagesMergeByKeys(closedHitchMeesages, [ClubCardPlaceholderKeys.AMOUNT]);
	if (quickReleaseKnotMeesages.length > 1) ClubCardMessagesMergeByKeys(quickReleaseKnotMeesages, [ClubCardPlaceholderKeys.MONEYAMOUNT]);
	if (housekeeper.length > 1) ClubCardMessagesMergeByKeys(housekeeper, [ClubCardPlaceholderKeys.FAMEAMOUNT]);

	// ###

	// ### Unique processing
	//Effect Hypnotherapist
	if (isHypnotherapist)
		ClubCardMessageStorage = ClubCardMessageStorage.filter(msg => msg.TextGetKey !== "MemberLeaveClub");
	//Effect Gangbang Banger
	if (isGangbangBanger)
		ClubCardMessageStorage = ClubCardMessageStorage.filter(msg => msg.TextGetKey !== "MemberSummoned" && msg.TextGetKey !== "MemberLeaveClub");
	//StealMoney & StealFame
	if (stealMoneyMessages.length > 0 && stealFameMessages.length > 0) {
		ClubCardMessagesMergeSteal(stealMoneyMessages, stealFameMessages);
	} else {
		if (stealMoneyMessages.length > 1) ClubCardMessagesMergeByKeys(stealMoneyMessages, [ClubCardPlaceholderKeys.MONEYAMOUNT]);
		if (stealFameMessages.length > 1) ClubCardMessagesMergeByKeys(stealFameMessages, [ClubCardPlaceholderKeys.FAMEAMOUNT]);
	}
	// ###
}

/**
 * Merges multiple messages by summing selected placeholders and keeping the last message.
 *
 * @param {{ message: ClubCardMessage, index: number }[]} messageArray
 * @param {ClubCardPlaceholderKeysType[]} keysToSum - Placeholder keys to sum (e.g. ["AMOUNT"], ["MONEYAMOUNT", "FAMEAMOUNT"])
 */
function ClubCardMessagesMergeByKeys(messageArray, keysToSum) {
	if (messageArray.length <= 1) return;

	/**
	 * @type {Record<string, number>}
	 */
	const totals = {};
	for (const key of keysToSum) {
		totals[key] = messageArray.reduce((sum, item) =>
			sum + Number(item.message.Placeholders[key] || 0), 0);
	}

	const lastMessage = { ...messageArray[messageArray.length - 1].message };

	for (const key of keysToSum)
		lastMessage.Placeholders[key] = `${totals[key]}`;

	ClubCardMessageStorage = ClubCardMessageStorage.filter(msg => msg.TextGetKey !== lastMessage.TextGetKey);
	ClubCardMessageStorage.splice(messageArray[messageArray.length - 1].index, 0, lastMessage);
}

/**
 * Merges "StealMoney" and "StealFame" messages into one.
 *
 * @param {Array<{ message: ClubCardMessage, index: number }>} stealMoneyMessages - Messages related to stealing money.
 * @param {Array<{ message: ClubCardMessage, index: number }>} stealFameMessages - Messages related to stealing fame.
 */
function ClubCardMessagesMergeSteal(stealMoneyMessages, stealFameMessages) {
	const minIndex = Math.min(stealMoneyMessages[0].index, stealFameMessages[0].index);

	const newMessage = stealMoneyMessages[0].index === minIndex
        ? stealMoneyMessages[0].message
		: stealFameMessages[0].message;

	const mergedMessage = { ...newMessage };

	const totalMoney = stealMoneyMessages.reduce((sum, item) =>
		sum + Number(item.message.Placeholders[ClubCardPlaceholderKeys.MONEYAMOUNT] || 0), 0
	);
	const totalFame = stealFameMessages.reduce((sum, item) =>
		sum + Number(item.message.Placeholders[ClubCardPlaceholderKeys.FAMEAMOUNT] || 0), 0
	);

	mergedMessage.TextGetKey = "StealFameMoney";
	mergedMessage.Placeholders = {
		...newMessage.Placeholders,
		[ClubCardPlaceholderKeys.MONEYAMOUNT]: totalMoney.toString(),
		[ClubCardPlaceholderKeys.FAMEAMOUNT]: totalFame.toString(),
	};

	//Clear ClubCardMessageStorage from StealMoney and StealFame
	ClubCardMessageStorage = ClubCardMessageStorage.filter(msg =>
		msg.TextGetKey !== "StealMoney" && msg.TextGetKey !== "StealFame"
	);

	ClubCardMessageStorage.splice(minIndex, 0, mergedMessage);
}

/**
 * Generates a formatted message text by replacing placeholders with actual values.
 * @param {ClubCardMessage} message - Message Item
 * @returns {(string | HTMLElement)[]} MessageText
 */
function ClubCardMessageGetHTML(message) {
	let messageText = TextGet(message.TextGetKey);
	if (messageText.startsWith(TEXT_NOT_FOUND_PREFIX)) return [];

	const playerNumber = CommonParseInt(message.PlayerId);
	const player = ClubCardPlayer.find(p => playerNumber !== null ? p.Character.MemberNumber === playerNumber : p.Control === "AI")?.Character;
	if (!player) return [];

	/** @type {Record<string, string | HTMLElement>} */
	const placeholders = { ...message.Placeholders };
	placeholders.TURNNUMBER ??= `${message.TurnCounter}`;
	placeholders.PLAYERNAME ??= CharacterNickname(player);
	if (placeholders.CARDNAME) {
		const name = message.Placeholders.CARDNAME;
		const card = ClubCardList.find(c => c.Name === name);
		if (!card) {
			delete placeholders.CARDNAME;
		} else {
			placeholders.CARDNAME = `"${card.Title ? card.Title : card.Name}"`;
		}
	}
	if (placeholders.FAMEAMOUNT) {
		const amount = CommonIsNumeric(placeholders.FAMEAMOUNT) ?
			placeholders.FAMEAMOUNT
			: typeof placeholders.FAMEAMOUNT === "string" ? CommonParseInt(placeholders.FAMEAMOUNT) ?? 0 : 0;
		const amountStr = `${amount > 0 ? "+" : ""}${amount}`;
		placeholders.FAMELABEL = ElementCreate({
			tag: "span",
			style: {
				color: ClubCardFameTextColor,
			},
			children: [`${amountStr} ${TextGet("Fame")}`],
		});
	}
	if (placeholders.MONEYAMOUNT !== undefined) {
		const amount = CommonIsNumeric(placeholders.MONEYAMOUNT) ?
			placeholders.MONEYAMOUNT
			: typeof placeholders.MONEYAMOUNT === "string" ? CommonParseInt(placeholders.MONEYAMOUNT) ?? 0 : 0;
		const amountStr = `${amount > 0 ? "+" : ""}${amount}`;
		placeholders.MONEYLABEL = ElementCreate({
			tag: "span",
			style: {
				color: ClubCardMoneyTextColor,
			},
			children: [`${amountStr} ${TextGet("Money")}`],
		});
	}

	return CommonStringPartitionReplace(messageText, {
		...placeholders,
	});

}

/**
 * Updated the text by mask, for InnerHTML
 * The function finds the necessary words from the arrays and adds color labels to them.
 * @param {string} text -Normal Card Text
 * @returns {string} -  Updated for InnerHTML Card Text
 */
function ClubCardGetFormatTextForInnerHTML(text) {
	const ClubcardLanguageFame = ["fame","Славы","声望"];
	const ClubcardLanguageMoney = ["money", "Денег", "金钱"];
	const fameRegex = new RegExp(`[+-]?\\d*\\s*(${ClubcardLanguageFame.join("|")})`, "gi");
	const moneyRegex = new RegExp(`[+-]?\\d*\\s*(${ClubcardLanguageMoney.join("|")})`, "gi");

	const formattedText = text
		.replace(fameRegex, (match) => `<span style='color: ${ClubCardFameTextColor};'>${match}</span>`)
		.replace(moneyRegex, (match) => `<span style='color: ${ClubCardMoneyTextColor};'>${match}</span>`);

	return formattedText;
}

// #endregion ClubCard New Chat Stuff

/**
 * Creates a copy of a card from the ClubCardList based on its name.
 * Assigns a new UniqueID and makes the card visible.
 * @param {string} cardName - The name of the card to copy.
 * @returns {ClubCard} - A new card object if found, otherwise null.
 */
function ClubCardGetCopyCardByName(cardName) {
	const originalCard = ClubCardList.find(card => card.Name === cardName);
	if (!originalCard) throw new Error(`Unable to copy card named ${cardName}`);

	return {
		...originalCard, // Copy all properties of the original card
		UniqueID: ClubCardGenerateUniqueID(originalCard.ID), // Generate a new unique identifier
		IsVisible: true, // Ensure the copied card is visible
		AnimationState: "idle"
	};
}

/**
 * Creates a copy of a card from the ClubCardList based on its id.
 * Assigns a new UniqueID and makes the card visible.
 * @param {number} cardId - The id of the card to copy.
 * @returns {ClubCard} - A new card object if found, otherwise null.
 */
function ClubCardGetCopyCardByID(cardId) {
	const originalCard = ClubCardList.find(card => card.ID === cardId);
	if (!originalCard) throw new Error(`Unable to copy card ID ${cardId}`);

	return {
		...originalCard, // Copy all properties of the original card
		UniqueID: ClubCardGenerateUniqueID(originalCard.ID), // Generate a new unique identifier
		IsVisible: true, // Ensure the copied card is visible
		AnimationState: "idle"
	};
}

/**
 * Generates a globally unique identifier (UniqueID) for a card.
 * The UniqueID is composed of the card's base ID, a high-precision timestamp,
 * and an incrementing counter to ensure uniqueness.
 * @param {number} cardID - The base ID of the card.
 * @returns {string} - A unique string identifier for the card.
 */
function ClubCardGenerateUniqueID(cardID) {
	return `${cardID}${Math.floor(performance.now() * 1e6)}${ClubCardUniqueIDCounter++}`;
}

/**
 * Creates a popup in the middle of the board that pauses the game
 * @param {ClubCardPopupType["Mode"]} Mode - The popup mode
 * @param {object} [options]
 * @param {string|undefined} [options.Text] - The text to display
 * @param {string|undefined} [options.Button1] - The label of the first button
 * @param {string|undefined} [options.Button2] - The label of the second button
 * @param {string|undefined} [options.Function1] - The function of the first button
 * @param {string|undefined} [options.Function2] - The function of the second button
 * @param {ClubCard[] | undefined} [options.CardsPool]
 * @returns {void} - Nothing
 */
function ClubCardCreatePopup(Mode, options) {
	if (Mode == "DISCARDPILE") { ClubCardInspection = true; }
	if (Mode == "YESNO") { ClubCardOptionSelection = true; }
	ClubCardPopup = {
		Mode: Mode,
		Text: options?.Text,
		Button1: options?.Button1,
		Button2: options?.Button2,
		Function1: options?.Function1,
		Function2: options?.Function2,
		CardsPool: options?.CardsPool,
	};
}

/**
 * Destroys the current popup
 * @returns {void} - Nothing
 */
function ClubCardDestroyPopup() {
	ClubCardPopup = null;
	ClubCardOptionSelection = false;
	ClubCardInspection = false;
	ClubCardGameEnded = false;
}

/**
 * Returns TRUE if the card is a liability (should be played on the opponent side)
 * @param {ClubCard} Card - The card to evaluate
 * @returns {boolean} - TRUE if the card is a liability
 */
function ClubCardIsLiability(Card) {
	return ClubCardCardHasGroup(Card, "Liability");
}

/**
 * Gets the opponent of the parameter player or the player that's not on it's turn if null
 * @param {ClubCardPlayer|null} CCPlayer - The club card player or null
 * @returns {ClubCardPlayer} - The opponent
 */
function ClubCardGetOpponent(CCPlayer = null) {
	if (CCPlayer == null) return (ClubCardTurnIndex == 0) ? ClubCardPlayer[1] : ClubCardPlayer[0];
	return (CCPlayer.Index == 0) ? ClubCardPlayer[1] : ClubCardPlayer[0];
}

/**
 * Gets the opponent of the parameter player or the player that's not on it's turn if null
 * @param {ClubCardPlayer} CCPlayer - The club card player or null
 * @param {number} turnCounter
 * @returns {ClubCard[]} - The opponent
 */
function ClubCardGetCardsPlayedOnTurn(CCPlayer, turnCounter) {
	return CCPlayer.CardsPlayedThisTurn[turnCounter] ?? [];
}

// #region Changing data

/**
 * Adds money to the club card player stats
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {number} Amount - The amount to add
 * @param {null | string} CardName - The card name used for the chat message if needed
 * @returns {void} - Nothing
 */
function ClubCardPlayerAddMoney(CCPlayer, Amount, CardName = null) {
	if (CCPlayer.Money == null) CCPlayer.Money = 0;
	CCPlayer.Money = CCPlayer.Money + Amount;
	if (CardName && Amount > 0) ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainMoney", {[ClubCardPlaceholderKeys.MONEYAMOUNT]: Amount, [ClubCardPlaceholderKeys.CARDNAME]: CardName}, CCPlayer);
	else if (CardName && Amount < 0) ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "LoseMoney", {[ClubCardPlaceholderKeys.MONEYAMOUNT]: Amount, [ClubCardPlaceholderKeys.CARDNAME]: CardName}, CCPlayer);
}

/**
 * Adds fame to the club card player stats, can trigger a victory
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {number} Amount - The amount to add
 * @param {null | string} CardName - The card name used for the chat message if needed
 * @returns {void} - Nothing
 */
function ClubCardPlayerAddFame(CCPlayer, Amount, CardName = null) {
	if (CCPlayer.Fame == null) CCPlayer.Fame = 0;
	CCPlayer.Fame = CCPlayer.Fame + Amount;
	if (CardName && Amount > 0) ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "GainFame", {[ClubCardPlaceholderKeys.FAMEAMOUNT]: Amount, [ClubCardPlaceholderKeys.CARDNAME]: CardName}, CCPlayer);
	else if (CardName && Amount < 0) ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "LoseFame", {[ClubCardPlaceholderKeys.FAMEAMOUNT]: Amount, [ClubCardPlaceholderKeys.CARDNAME]: CardName}, CCPlayer);
}

/**
 * Add fame from a player and remove from the other player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {number} moneyAmount - The money amount to steal
 * @param {number} fameAmount - The fame amount to steal
 * @param {boolean} isStickyFingers - Whether Sticky Fingers effect should be ignored.
 * @returns {{ stolenMoney: number, stolenFame: number }} - The amounts of money and fame stolen.
 */
function ClubCardPlayerSteal(CCPlayer, moneyAmount, fameAmount, isStickyFingers = false) {
	const opponent = ClubCardGetOpponent(CCPlayer);
	let moneyToSteal = 0;
	let fameToSteal = 0;

	if (fameAmount > 0 && (opponent.Fame > 0 || ClubCardNameIsOnBoard(CCPlayer, "Jailbird", true))) {
		fameToSteal = ClubCardNameIsOnBoard(CCPlayer, "Jailbird", true) ? fameAmount : Math.min(fameAmount, opponent.Fame);
		ClubCardPlayerAddFame(CCPlayer, fameToSteal);
		ClubCardPlayerAddFame(opponent, -fameToSteal);
		ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "StealFame", {[ClubCardPlaceholderKeys.FAMEAMOUNT]: fameToSteal}, CCPlayer);
	}

	if (moneyAmount > 0 && opponent.Money > 0) {
		moneyToSteal = Math.min(moneyAmount, opponent.Money);
		ClubCardPlayerAddMoney(CCPlayer, moneyToSteal);
		ClubCardPlayerAddMoney(opponent, -moneyToSteal);
		ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "StealMoney", {[ClubCardPlaceholderKeys.MONEYAMOUNT]: moneyToSteal}, CCPlayer);
	}

	if (moneyToSteal > 0 || fameToSteal > 0) {
		for (const C of CCPlayer.Board.slice()) {
			if (C.Name == "Sticky Fingers") {
				if (!isStickyFingers && !C.Negated) C.onSteal?.(CCPlayer);
			} else if (!C.Negated) C.onSteal?.(CCPlayer);
		}
	}

	return { stolenMoney: moneyToSteal, stolenFame: fameToSteal };
}

/**
 * Raises the level of player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {void} - Nothing
 */
function ClubCardUpgradeLevel(CCPlayer) {
	// Homeroom blocks both players from upgrading while it is on the board
	const opponent = ClubCardGetOpponent(CCPlayer);
	const updatedCost = ClubCardCalculateLevelCost(CCPlayer);
	const blockedByEvent = ClubCardEventNameIsInEvents(CCPlayer, "Homeroom") || ClubCardEventNameIsInEvents(opponent, "Homeroom");
	const affordLevelUp = CCPlayer.Money < updatedCost;
	const isMaxlevel = CCPlayer.Level >= ClubCardLevelCost.length - 1;

	if (isMaxlevel || affordLevelUp || blockedByEvent)
		return;

	ClubCardPlayerAddMoney(CCPlayer, updatedCost * -1);
	CCPlayer.Level++;
	// On level up effects
	for (const card of CCPlayer.Board.slice()) {
		if (card.onLevelUp && !card.Negated) card.onLevelUp(CCPlayer);
	}
	for (const card of opponent.Board.slice()) {
		if (card.onOpponentLevelUp && !card.Negated) card.onOpponentLevelUp(opponent);
	}

	const textGetKey = "UpgradedToLevel" + CCPlayer.Level.toString();
	ClubCardMessageAdd(ClubCardMessageType.ACTION, textGetKey, {[ClubCardPlaceholderKeys.MONEYAMOUNT]: updatedCost.toString()});
	GameClubCardSyncOnlineData();
}

// #endregion Changing data

/**
 * Returns TRUE if a card (by name) is currently present on a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} CardName - The name of the card
 * @returns {boolean} - TRUE if at least one card with that name is present
 */
function ClubCardEventNameIsInEvents(CCPlayer, CardName) {
	if ((CCPlayer == null) || (CCPlayer.Event == null) || (CardName == null)) return false;
	for (let Card of CCPlayer.Event)
		if (Card.Name === CardName)
			return true;
	return false;
}

/**
 * Returns TRUE if a card (by name) is currently present on a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} CardName - The name of the card
 * @param {boolean} NegateCheck - If we need to check if the card is negated
 * @returns {boolean} - TRUE if at least one card with that name is present
 */
function ClubCardNameIsOnBoard(CCPlayer, CardName, NegateCheck = false) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (CardName == null)) return false;
	if (NegateCheck) {
		for (let Card of CCPlayer.Board) {
			if (Card.Name === CardName && !Card.Negated) return true;
		}
		return false;
	} else {
		for (let Card of CCPlayer.Board) {
			if (Card.Name === CardName) return true;
		}
		return false;
	}
}

/**
 * Add cards to player's deck
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} CardName - The name of the card to add
 * @param {number} Amount - the number of copies to add (1 by default)
 * @returns {void} - Nothing
 */
function ClubCardAddCardsToDeck(CCPlayer, CardName, Amount = 1) {
	while (Amount > 0) {
		CCPlayer.Deck.push(ClubCardGetCopyCardByName(CardName));
		Amount--;
	}
	CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
}

/**
 * Returns TRUE if can activate the effect of a card
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card
 * @returns {boolean} - TRUE if can active the effect
 */
function ClubCardCanActiveEffect(CCPlayer, Card) {
	if ((CCPlayer == null) || (Card == null) || (Card.Location == null)) return false;
	if (Card.Location != "PlayerBoard") return false;
	if (!Card.CanActive) return false;
	if (Card.Negated) return false;
	if (Card.Name == "Tifa" && CCPlayer.Deck.length < 1) return false;
	return true;
}

/**
 * Activate an effect of card on board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard | null} Card - The card
 * @param {boolean} SkipActivation - True if need to skip the activation of the card
 * @returns {void} - Nothing
 */
function ClubCardActiveEffect(CCPlayer, Card, SkipActivation = false) {
	const opponent = ClubCardGetOpponent(CCPlayer);
	if (!SkipActivation) Card?.OnActive?.(CCPlayer);
	if (ClubCardPending?.Name === "Tifa" || ClubCardPending?.Name === "Clare") return;
	ClubCardTurnCardPlayed++;
	ClubCardSelection = null;
	if (!MiniGameEnded) if (ClubCardCheckVictory(CCPlayer)) { ClubCardEndGameSyncAndMessage(CCPlayer); return; }
	if (!MiniGameEnded) if (ClubCardCheckVictory(opponent)) { ClubCardEndGameSyncAndMessage(opponent); return; }
	if (MiniGameEnded) return;
	if (!SkipActivation && (ClubCardIsAnimationOn === false || ClubCardFocus?.AnimationState != "moving")) ClubCardClickResetFocusCard();
	ClubCardPending = null;
	ClubCardMessageSendAll();
	if (ClubCardTurnCardPlayed >= ClubCardTurnPlayableCardCount(CCPlayer)) return ClubCardEndTurn();
	ClubCardMessageAdd(ClubCardMessageType.ACTIONSEPARATOR, "PlayAnotherCard");

	ClubCardAIStart();
}

/**
 * Returns the amount of a card (by name) that are currently present on a board
 * @param {ClubCardPlayer} CCPlayer - The club card pla
 * @param {string} CardName - The name of the carder
 * @param {boolean} NegateCheck - If we need to check if the card is negated
 * @returns {number} - the amount of members with that name on board
 */
function ClubCardNameCountOnBoard(CCPlayer, CardName, NegateCheck = false) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (CardName == null)) return 0;
	let amount = 0;
	if (NegateCheck) {
		for (const Card of CCPlayer.Board) {
			if (Card.Name === CardName && !Card.Negated) amount++;
		}
	} else {
		for (const Card of CCPlayer.Board) {
			if (Card.Name === CardName) amount++;
		}
	}
	return amount;
}

/**
 * Returns TRUE if a card (by group) is currently present on a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCardGroup} GroupName - The name of the card group
 * @returns {boolean} - TRUE if at least one card from that group is present
 */
function ClubCardGroupIsOnBoard(CCPlayer, GroupName) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (GroupName == null)) return false;
	return CCPlayer.Board.some(card => ClubCardCardHasGroup(card, GroupName));
}

/**
 * @param {ClubCard} card to evaluate group
 * @param {ClubCardGroup} GroupName group name to find
 * @returns {boolean} - True if the card has the group
 */
function ClubCardCardHasGroup(card, GroupName) {
	return !!card.Group && card.Group.includes(GroupName);
}

/**
 * @param {ClubCard} card to evaluate type
 * @param {ClubCardType} TypeName type name to find
 * @returns {boolean} - True if the card has the type
 */
function ClubCardCardHasType(card, TypeName) {
	return !!card.Type && card.Type.includes(TypeName);
}

/**
 * Returns the number of cards of a specific group found on a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCardGroup} GroupName - The name of the card group
 * @returns {number} - The number of cards from that group on the board
 */
function ClubCardGroupOnBoardCount(CCPlayer, GroupName) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (GroupName == null)) return 0;
	return CCPlayer.Board?.reduce((acc, card) => ClubCardCardHasGroup(card, GroupName) ? acc + 1 : acc, 0);
}

/**
 * Returns the number of cards of a specific group found in player's hand
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCardGroup} GroupName - The name of the card group
 * @returns {number} - The number of cards from that group in hand
 */
function ClubCardGroupInHandCount(CCPlayer, GroupName) {
	if ((CCPlayer == null) || (CCPlayer.Hand == null) || (GroupName == null)) return 0;
	return CCPlayer.Hand?.reduce((acc, card) => ClubCardCardHasGroup(card, GroupName) ? acc + 1 : acc, 0);
}

/**
 * Returns the number of cards of a specific group found in the discard pile
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCardGroup} GroupName - The name of the card group
 * @returns {number} - The number of cards from that group in the discard pile
 */
function ClubCardGroupInDiscardPileCount(CCPlayer, GroupName) {
	if ((CCPlayer == null) || (CCPlayer.DiscardPile == null) || (GroupName == null)) return 0;
	return CCPlayer.DiscardPile?.reduce((acc, card) => ClubCardCardHasGroup(card, GroupName) ? acc + 1 : acc, 0);
}

/**
 * Removes a card from a player board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card object to remove
 * @param {boolean} [DontDiscard] - If the card dont need to go to the discard pile
 * @param {ClubCardMessageType} [MessageType]
 * @returns {void} - Nothing
 */
function ClubCardRemoveFromBoard(CCPlayer, Card, DontDiscard = false, MessageType = ClubCardMessageType.CARDEFFECT) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (Card == null)) {
		return;
	}

	const indexToRemove = Card.ArrayIndex;
	if (!CommonIsNumeric(indexToRemove)) return;
	if (indexToRemove !== -1) {
		const opponent = ClubCardGetOpponent(CCPlayer);
		if (Card.onLeaveClub != null && !Card.Negated) {
			Card.onLeaveClub(CCPlayer);
		}
		CCPlayer.Board.splice(indexToRemove, 1);
		if (!DontDiscard) {
			if (ClubCardIsLiability(Card)) {
				opponent.DiscardPile.push(ClubCardGetCopyCardByName(Card.Name));
			} else {
				CCPlayer.DiscardPile.push(ClubCardGetCopyCardByName(Card.Name));
			}
		}
		for (let Pos = 0; Pos < CCPlayer.Event.length; Pos++) {
			if (CCPlayer.Event[Pos].Negating == Card.UniqueID) {
				CCPlayer.DiscardPile.push(ClubCardGetCopyCardByName(CCPlayer.Event[Pos].Name));
				CCPlayer.Event.splice(Pos, 1);
				Pos--;
			}
		}
		for (let Pos = 0; Pos < opponent.Event.length; Pos++) {
			if (opponent.Event[Pos].Negating == Card.UniqueID) {
				opponent.DiscardPile.push(ClubCardGetCopyCardByName(opponent.Event[Pos].Name));
				opponent.Event.splice(Pos, 1);
				Pos--;
			}
		}
		ClubCardMessageAdd(MessageType, "MemberLeaveClub", {[ClubCardPlaceholderKeys.CARDNAME]: Card.Name}, CCPlayer);
		ClubCardUpdateBoardCardsIndex(CCPlayer);
		for (const card of CCPlayer.Board) {
			if (card.onMemberLeaveClub && !card.Negated) {
				card.onMemberLeaveClub(CCPlayer, Card, DontDiscard);
			}
		}
	}
}

/**
 * Gets the updated cost for a player to level up
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {number} The cost to level up
 */
function ClubCardCalculateLevelCost(CCPlayer) {
	const opponent = ClubCardGetOpponent(CCPlayer);
	let cost = ClubCardLevelCost[CCPlayer.Level + 1] - (ClubCardNameCountOnBoard(CCPlayer, "Quality Maid", true) * 10);
	if (CCPlayer.Level <= opponent.Level) {
		cost = cost + (ClubCardNameCountOnBoard(CCPlayer, "Inspector", true) * 10);
	}
	if (opponent.Level <= CCPlayer.Level) {
		cost = cost + (ClubCardNameCountOnBoard(opponent, "Inspector", true) * 10);
	}
	return cost;
}

/**
 * Gets the club level for pets effects
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {number} club level for pets effects
 */
function ClubCardCalculateLevelForPets(CCPlayer) {
	let level = CCPlayer.Level
		+ ClubCardNameCountOnBoard(CCPlayer, "Protective Owner", true)
		+ ClubCardNameCountOnBoard(CCPlayer, "Rich Owner", true)
		+ ClubCardNameCountOnBoard(CCPlayer, "Loving Owner", true)
		+ (ClubCardNameCountOnBoard(CCPlayer, "Jessica", true) * 2);
	return level;
}

/**
 * Gets the max effect a card should have depending on its "tier"/required level to play
 * @param {ClubCard} Card
 * @param {number} fame
 * @returns {number} max effect card should have
 */
function ClubCardGetMaxEffectFromCard(Card, fame) {
	const ClubCardMaxFamePerTier = {
		1: 3,
		2: 4,
		3: 6,
		4: 7,
		5: 12,
	};

	return Math.min(fame, ClubCardMaxFamePerTier[Card.RequiredLevel ?? 1]);
}

/**
 * Adds a card to a players hand
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card object to add
 * @returns {void} - Nothing
 */
function ClubCardAddToHand(CCPlayer, Card) {
	if (CCPlayer === null || CCPlayer.Hand === null || Card === null) {
		return;
	}

	CCPlayer.Hand.push(Card);
}

/**
 * Removes several cards from player time events
 * @deprecated
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {readonly string[]} ListOfCardNames - The names of the cards to remove
 */
function ClubCardRemoveCardsFromEventByName(CCPlayer, ListOfCardNames) {
	ListOfCardNames.forEach(cardName => ClubCardRemoveFromEventByName(CCPlayer, cardName));
}

/**
 * Removes a card from a player time events
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {string} CardName - The card object to remove
 * @returns {void} - Nothing
 */
function ClubCardRemoveFromEventByName(CCPlayer, CardName) {
	if ((CCPlayer == null) || (CCPlayer.Event == null) || (CardName == null)) return;
	let Pos = 0;
	for (let C of CCPlayer.Event) {
		if (C.Name === CardName) {
			CCPlayer.Event.splice(Pos, 1);
			CCPlayer.DiscardPile.push(ClubCardGetCopyCardByName(C.Name));
			ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "EventRemoved", {[ClubCardPlaceholderKeys.CARDNAME]: C.Name}, CCPlayer);
		}
		Pos++;
	}
}

/**
 * Removes a card from a player time events
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card object to remove
 * @returns {void} - Nothing
 */
function ClubCardRemoveFromEvent(CCPlayer, Card) {
	if ((CCPlayer == null) || (CCPlayer.Event == null) || (Card == null)) return;

	const indexToRemove = CCPlayer.Event.findIndex(c => c.ID === Card.ID);
	if (indexToRemove !== -1) {
		if (Card.onLeaveClub != null && !Card.Negated) {
			Card.onLeaveClub(CCPlayer);
		}
		CCPlayer.DiscardPile.push(ClubCardGetCopyCardByName(Card.Name));
		CCPlayer.Event.splice(indexToRemove, 1);
		ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "EventRemoved", {[ClubCardPlaceholderKeys.CARDNAME]: Card.Name}, CCPlayer);
	}
}

/**
 * Removes all cards that belong to a group (ex: Liability) from a board
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCardGroup} GroupName - The group name to remove
 * @returns {void} - Nothing
 */
function ClubCardRemoveGroupFromBoard(CCPlayer, GroupName) {
	if ((CCPlayer == null) || (CCPlayer.Board == null) || (GroupName == null)) return;
	for (let Pos = 0; Pos < CCPlayer.Board.length; Pos++) {
		let Card = CCPlayer.Board[Pos];
		if (Card.Group != null)
			for (let G of Card.Group)
				if (G == GroupName) {
					if (Card.onLeaveClub != null && !Card.Negated) {
						Card.onLeaveClub(CCPlayer);
					}
					CCPlayer.Board.splice(Pos, 1);
					if (ClubCardIsLiability(Card)) {
						ClubCardGetOpponent(CCPlayer).DiscardPile.push(ClubCardGetCopyCardByName(Card.Name));
					} else {
						CCPlayer.DiscardPile.push(ClubCardGetCopyCardByName(Card.Name));
					}
					Pos--;
					break;
				}
	}
	ClubCardUpdateBoardCardsIndex(CCPlayer);
}

/**
 * Shuffles an array of cards
 * @param {ClubCard[]} array - The array of cards to shuffle
 * @returns {ClubCard[]} - The shuffled cards
 */
function ClubCardShuffle(array) {
	let currentIndex = array.length, randomIndex;
	while (currentIndex != 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}
	return array;
}

/**
 * Sets the glowing border for a card
 * @param {ClubCard} Card - The card that must glow
 * @param {string} Color - The color of the glow
 * @returns {void} - Nothing
 */
function ClubCardSetGlow(Card, Color) {
	Card.GlowTimer = CommonTime() + 10000;
	Card.GlowColor = Color;
}

/**
 * Draw cards from the player deck into it's hand
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @param {number} [Amount] - The amount of cards to draw, 1 if null
 * @returns {void} - Nothing
 */
function ClubCardPlayerDrawCard(CCPlayer, Amount = 1) {
	if ((CCPlayer === null) || (CCPlayer.Deck === null) || (CCPlayer.Hand === null)) {
		return;
	}

	let FocusCard = ((CCPlayer.Index == 0) && (Amount == 1));
	while (Amount > 0) {
		if (CCPlayer.Deck.length > 0) {
			if (FocusCard) ClubCardSetGlow(CCPlayer.Deck[0], "#00FFFF");
			CCPlayer.Hand.push(CCPlayer.Deck[0]);
			CCPlayer.Deck.splice(0, 1);
			if (CCPlayer.Hand[CCPlayer.Hand.length - 1].WhenDrawn) CCPlayer.Hand[CCPlayer.Hand.length - 1].WhenDrawn?.(CCPlayer);
			ClubCardCheckDraw(CCPlayer);
		}
		Amount--;
	}

}

/**
 * Draw cards from the player deck into it's hand
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @param {readonly ClubCardGroup[]} groups - The group to draw from
 * @param {number | undefined} level - The level
 * @returns {boolean} - if cards were drawn or not
 */
function ClubCardPlayerDrawGroupCard(CCPlayer, groups, level) {
	if ((CCPlayer === null) || (CCPlayer.Deck === null) || (CCPlayer.Hand === null)) {
		return false;
	}

	const groupCardsInDeck = CCPlayer.Deck.filter(value => groups.some(group => ClubCardCardHasGroup(value, group) && (!level || value.RequiredLevel === level)));
	if (groupCardsInDeck.length === 0) {
		return false;
	}

	const card = groupCardsInDeck[Math.floor(Math.random() * groupCardsInDeck.length)];
	ClubCardSetGlow(card, "#00FFFF");

	CCPlayer.Hand.push(card);
	const cardIndex = CCPlayer.Deck.findIndex(value => value.ID === card.ID);
	CCPlayer.Deck.splice(cardIndex, 1);

	if (CCPlayer.Hand[CCPlayer.Hand.length - 1].WhenDrawn) CCPlayer.Hand[CCPlayer.Hand.length - 1].WhenDrawn?.(CCPlayer);
	ClubCardCheckDraw(CCPlayer);
	return true;
}

/**
 * Draw cards from the player deck into it's hand
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @param {readonly ClubCardType[]} types - The type to draw from
 * @param {number | undefined} level - The level
 * @returns {boolean} - if cards were drawn or not
 */
function ClubCardPlayerDrawTypeCard(CCPlayer, types, level) {
	if ((CCPlayer === null) || (CCPlayer.Deck === null) || (CCPlayer.Hand === null)) {
		return false;
	}

	const typeCardsInDeck = CCPlayer.Deck.filter(value => types.some(type => ClubCardCardHasType(value, type) && (!level || value.RequiredLevel === level)));
	if (typeCardsInDeck.length === 0) {
		return false;
	}

	const card = typeCardsInDeck[Math.floor(Math.random() * typeCardsInDeck.length)];
	ClubCardSetGlow(card, "#00FFFF");

	CCPlayer.Hand.push(card);
	const cardIndex = CCPlayer.Deck.findIndex(value => value.ID === card.ID);
	CCPlayer.Deck.splice(cardIndex, 1);

	if (CCPlayer.Hand[CCPlayer.Hand.length - 1].WhenDrawn) CCPlayer.Hand[CCPlayer.Hand.length - 1].WhenDrawn?.(CCPlayer);
	ClubCardCheckDraw(CCPlayer);
	return true;
}

/**
 * Summon cards from the player deck into it's board
 * @param {ClubCardPlayer} CCPlayer - The club card player that summons the cards
 * @param {readonly ClubCardGroup[]} groups - The group to summon from
 * @param {number} amount - The amount of cards to summon
 * @param {number} [level] - The level of the cards if needed
 * @param {string} [type] - Event or Member if needed to specify
 * @param {string} [source] - null for deck, 'Streets' for streets
 * @returns {boolean} - if cards were summoned or not
 */
function ClubCardPlayerSummonGroupCardFromDeck(CCPlayer, groups, amount, level, type, source) {
	if ((CCPlayer === null) || (CCPlayer.Deck === null) || (CCPlayer.Board === null)) {
		return false;
	}

	let groupCardsInDeck;
	if (source == "Streets") groupCardsInDeck = CCPlayer.DiscardPile.filter(value => groups.some(group => ClubCardCardHasGroup(value, group) && ClubCardCanSummonCard(CCPlayer, value)));
	else groupCardsInDeck = CCPlayer.Deck.filter(value => groups.some(group => ClubCardCardHasGroup(value, group) && ClubCardCanSummonCard(CCPlayer, value)));
	if (level != -1) groupCardsInDeck = groupCardsInDeck.filter(value => value.RequiredLevel == level);
	if (groupCardsInDeck.length === 0) {
		return false;
	}

	if (type === "Event") {
		groupCardsInDeck = groupCardsInDeck.filter(value => value.Type === "Event");
	} else if (type === "Member") {
		groupCardsInDeck = groupCardsInDeck.filter(value => value.Type === "Member");
	}

	while (amount > 0) {
		if (groupCardsInDeck.length > 0) {
			const card = groupCardsInDeck[Math.floor(Math.random() * groupCardsInDeck.length)];
			const cardIndex = groupCardsInDeck.findIndex(value => value.ID === card.ID);
			groupCardsInDeck.splice(cardIndex, 1);

			if (source == "Streets") {
				const cardIndexInDeck = CCPlayer.DiscardPile.findIndex(value => value.ID === card.ID);
				CCPlayer.DiscardPile.splice(cardIndexInDeck, 1);

			} else {
				const cardIndexInDeck = CCPlayer.Deck.findIndex(value => value.ID === card.ID);
				CCPlayer.Deck.splice(cardIndexInDeck, 1);
			}

			ClubCardSummonCard(CCPlayer, card);
			groupCardsInDeck = groupCardsInDeck.filter(value => ClubCardCanSummonCard(CCPlayer, value));
		}
		amount--;
	}

	return true;
}

/**
 * Play a card from an effect
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} card - The card to play
 * @returns {void} - Nothing
 */
function ClubCardSummonCard(CCPlayer, card) {
	let opponent = ClubCardGetOpponent(CCPlayer);
	let Target = ClubCardFindTarget(card);
	if (card.Type === "Member" || card.Type == null) {
		card.Type = "Member";
		Target.Board.push(card);
		ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "MemberSummoned", {[ClubCardPlaceholderKeys.CARDNAME]: card.Name}, Target);
	}
	if (card.Type === "Event") {
		if ((card.Time != null) && (card.Time >= 0)) {
			Target.Event.push(card);
			card.Time = card.Time + ClubCardExtraTime(Target);
		} else {
			CCPlayer.DiscardPile.push(card);
		}
	}

	if (card.OnPlay != null) {
		card.OnPlay(CCPlayer);
	}
	if (!MiniGameEnded) if (ClubCardCheckVictory(CCPlayer)) { ClubCardEndGameSyncAndMessage(CCPlayer); return; }
	if (!MiniGameEnded) if (ClubCardCheckVictory(opponent)) { ClubCardEndGameSyncAndMessage(opponent); return; }
	ClubCardOnCardPlayedHandler(CCPlayer, card);
	if (!MiniGameEnded) if (ClubCardCheckVictory(CCPlayer)) { ClubCardEndGameSyncAndMessage(CCPlayer); return; }
	if (!MiniGameEnded) if (ClubCardCheckVictory(opponent)) { ClubCardEndGameSyncAndMessage(opponent); return; }
	ClubCardUpdateBoardCardsIndex(Target);
}

/**
 * Returns TRUE if a specific card can be summoned by the player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card to play
 * @returns {boolean} - TRUE if the card can be summoned
 */
function ClubCardCanSummonCard(CCPlayer, Card) {
	if ((Card.CanPlay != null) && !Card.CanPlay(CCPlayer)) return false;
	const opponent = ClubCardGetOpponent(CCPlayer);
	let Target = ClubCardFindTarget(Card);
	if ((Target.Board != null) && ((Card.Type == "Member") || (Card.Type == null)) && (Target.Level != null) && Target.Board.length >= ClubCardLevelLimit[Target.Level]) return false;
	if (Card.Prerequisite != null && Card.Name !== "Ball Gag") return false;
	if ((Card.Type == "Event") && (ClubCardEventNameIsInEvents(opponent, "Restrain") || ClubCardEventNameIsInEvents(opponent, "Ball Buster"))) return false;
	if (ClubCardIsLiability(Card) && ClubCardEventNameIsInEvents(opponent, "Ball Buster")) return false;
	if ((Card.Type == "Event") && (ClubCardEventNameIsInEvents(CCPlayer, "Restrain"))) return false;
	if ((Card.RequiredLevel ?? 0) > Target.Level) return false;
	const edens = opponent.Board.filter(card => card.Name === "Eden" && !card.Negated);
	for (const eden of edens) {
		if ((Card.RequiredLevel ?? 1) == eden.EffectKey) return false;
	}
	return true;
}

/**
 * When drawing card, checks for various conditions and triggers.
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @returns {void} - Nothing
 *
 */
function ClubCardCheckDraw(CCPlayer) {
	for (const card of CCPlayer.Board.slice()) {
		if (card.onDrawCard && !card.Negated) card.onDrawCard(CCPlayer);
	}
	for (const card of CCPlayer.Event.slice()) {
		if (card.onDrawCard && !card.Negated) card.onDrawCard(CCPlayer);
	}
	for (const card of ClubCardGetOpponent(CCPlayer).Board.slice()) {
		if (card.onOpponentDrawCard && !card.Negated) card.onOpponentDrawCard(ClubCardGetOpponent(CCPlayer));
	}
	for (const card of ClubCardGetOpponent(CCPlayer).Event.slice()) {
		if (card.onOpponentDrawCard && !card.Negated) card.onOpponentDrawCard(ClubCardGetOpponent(CCPlayer));
	}
}

/**
 * trigger effects when the player is taking the draw action
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @returns {void} - Nothing
 */
function ClubCardOnDrawAction(CCPlayer) {
	for (const card of CCPlayer.Board.slice()) {
		if (card.onDrawAction && !card.Negated) card.onDrawAction(CCPlayer);
	}
	for (const card of CCPlayer.Event.slice()) {
		if (card.onDrawAction && !card.Negated) card.onDrawAction(CCPlayer);
	}
	for (const card of ClubCardGetOpponent(CCPlayer).Board.slice()) {
		if (card.onOpponentDrawAction && !card.Negated) card.onOpponentDrawAction(ClubCardGetOpponent(CCPlayer));
	}
	for (const card of ClubCardGetOpponent(CCPlayer).Event.slice()) {
		if (card.onOpponentDrawAction && !card.Negated) card.onOpponentDrawAction(ClubCardGetOpponent(CCPlayer));
	}
}

/**
 * Handles the remove of negate effect
 * @param {ClubCardPlayer} CCPlayer
 * @param {ClubCard} CardToCancel - the card to cancel its negation
 * @returns {void} - Nothing
 *
 */
function ClubCardCancelNegation(CCPlayer, CardToCancel) {
	const opponent = ClubCardGetOpponent(CCPlayer);
	let cardsNegating = CCPlayer.Board.filter(card => card.Negating == CardToCancel.UniqueID);
	cardsNegating.concat(CCPlayer.Event.filter(card => card.Negating == CardToCancel.UniqueID));
	cardsNegating.concat(opponent.Board.filter(card => card.Negating == CardToCancel.UniqueID));
	cardsNegating.concat(opponent.Event.filter(card => card.Negating == CardToCancel.UniqueID));
	if (cardsNegating.length < 2) {
		CardToCancel.Negated = undefined;
		if (CardToCancel.onCancelNegation) CardToCancel.onCancelNegation(CCPlayer);
	}
}

/**
 * Common place to handle Alvins effect on kidnapping and Restrain
 * @param {ClubCardPlayer} CCPlayer
 * @returns {void} - Nothing
 *
 */
function ClubCardAlvinCondition(CCPlayer) {
	const hasAlvin = ClubCardNameIsOnBoard(CCPlayer, "Alvin", true);
	let count = 0;
	for (let card of CCPlayer.Board) {
		if (card.Name == "Rope Slave") {
			count++;
		}
	}
	const hasBoardRoom = CCPlayer.Board.length < ClubCardLevelLimit[CCPlayer.Level];
	if (hasAlvin && hasBoardRoom && count < 3) {
		const ropeSlave = ClubCardGetCopyCardByName("Rope Slave");//ClubCardList.find(card => card.Name === "Rope Slave");
		ClubCardSummonCard(CCPlayer, ropeSlave);
	}
}

/**
 * Handles Tifas effect selection
 * @param {ClubCardPlayer} CCPlayer
 * @param {string} Selection
 * @returns {void} - Nothing
 */
function ClubCardTifaSelection(CCPlayer, Selection) {
	if (Selection == "Streets") {
		CCPlayer.DiscardPile.push(CCPlayer.Deck[0]);
		CCPlayer.Deck.splice(0, 1);
		ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Tifa Discard", {}, CCPlayer);
	} else ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "Effect Tifa Draw", {}, CCPlayer);
	ClubCardPlayerDrawCard(CCPlayer, 1);
	ClubCardFocus = null;
	ClubCardClickResetPendingCard();
	ClubCardDestroyPopup();
	ClubCardActiveEffect(CCPlayer, null, true);
}

/**
 * Handles Clares active effect
 * @param {ClubCardPlayer} CCPlayer
 * @param {ClubCard} Card
 * @returns {void} - Nothing
 */
function ClubCardClareSelection(CCPlayer, Card) {
	if (ClubCardIsAnimationOn === false || ClubCardFocus?.AnimationState != "moving") ClubCardClickResetFocusCard();
	ClubCardFocus = null;
	const index = ClubCardPending?.ArrayIndex ?? 0;
	CCPlayer.Board[index].CanActive = false;
	CCPlayer.Board[index].ExtraPlay ??= 0;
	CCPlayer.Board[index].ExtraPlay++;
	ClubCardPlayerSteal(CCPlayer, Card.RequiredLevel ?? 1, 0);
	ClubCardDiscardCard(CCPlayer, CCPlayer.Deck.findIndex(c => c.ID === Card.ID), "Deck");
	ClubCardClickResetPendingCard();
	ClubCardDestroyPopup();
	ClubCardActiveEffect(CCPlayer, ClubCardGetCopyCardByName("Clare"), true);
}

/**
 * Removes cards from a player hand
 * @param {ClubCardPlayer} CCPlayer - The club card player that discards
 * @param {number} Amount - The amount of cards to discard
 * @returns {void} - Nothing
 */
function ClubCardPlayerDiscardCard(CCPlayer, Amount) {
	if ((CCPlayer == null) || (CCPlayer.Hand == null) || (Amount == null)) return;
	while ((Amount > 0) && (CCPlayer.Hand.length > 0)) {
		let Pos = Math.floor(Math.random() * CCPlayer.Hand.length);
		ClubCardDiscardCard(CCPlayer, Pos);
		Amount--;
	}

	if (CCPlayer.Control === 'Player') ClubCardDefocusCardIfDiscarded();
}

/**
 * Removes a card from a player hand
 * @param {ClubCardPlayer} CCPlayer - The club card player that discards
 * @param {number} Pos - The location of the card to discard
 * @param {string} DiscardFrom - The pile to discard from
 * @returns {boolean} - TRUE if the card was discarded
 */
function ClubCardDiscardCard(CCPlayer, Pos, DiscardFrom = "Hand") {
	let DiscardedCard;
	let DontDiscard = [];
	let CardDiscarded = false;
	for (const card of CCPlayer.Board) if (card.Name == "Reverse Prayer" && !card.Negated) DontDiscard.push(card.EffectKey);
	if (DiscardFrom == "Hand") {
		DiscardedCard = CCPlayer.Hand[Pos];
		if (ClubCardCardHasGroup(DiscardedCard, "Pet") && ClubCardNameIsOnBoard(CCPlayer, "Protective Owner", true)) {
			CCPlayer.Deck.push(DiscardedCard);
			CCPlayer.Deck = ClubCardShuffle(CCPlayer.Deck);
			CCPlayer.Hand.splice(Pos, 1);
		} else if (!DontDiscard.includes(DiscardedCard.RequiredLevel ?? 1)) {
			CCPlayer.DiscardPile.push(DiscardedCard);
			CardDiscarded = true;
			CCPlayer.Hand.splice(Pos, 1);
		}
	} else if (DiscardFrom == "Deck") {
		DiscardedCard = CCPlayer.Deck[Pos];
		if (!DontDiscard.includes(DiscardedCard.RequiredLevel ?? 1)) {
			CCPlayer.DiscardPile.push(DiscardedCard);
			CCPlayer.Deck.splice(Pos, 1);
			CardDiscarded = true;
		}
	}
	if (CardDiscarded) {
		for (const Card of CCPlayer.Board.slice()) {
			if (DiscardedCard && !Card.Negated && Card.onDiscardCard)
				Card.onDiscardCard(CCPlayer, DiscardedCard);
		}
	}
	return CardDiscarded;
}

/**
 * Builds a deck array of object from a deck array of numbers
 * @param {readonly number[]} InDeck - The array of number deck
 * @returns {ClubCard[]} - The resulting deck
 */
function ClubCardLoadDeck(InDeck) {
	let OutDeck = [];

	for (let D of InDeck){
		const card = ClubCardGetCopyCardByID(D);
		if (card && card != null) {
			if (card.Type == null) card.Type = "Member";
			OutDeck.push(card);
		}
	}
	return OutDeck;
}

/**
 * Returns the index of the player in the ClubCardPlayer array
 * @returns {number} - The array index position
 */
function ClubCardGetPlayerIndex() {
	if (ClubCardPlayer[0].Control == "Player") return 0;
	if (ClubCardPlayer[1].Control == "Player") return 1;
	return -1;
}

/**
 * Builds a deck array of object from a deck array of numbers
 * @param {number} DeckNum - The array of number deck
 * @returns {void} - The resulting deck
 */
function ClubCardLoadDeckNumber(DeckNum) {
	ElementRemove("DefaultDecksDropdown");
	// Invalid decks cannot be loaded, we get the default one if that's the case
	/** @type {number[]} */
	let Deck = [];
	if (ClubCardUsePrecon) {
		Deck = ClubCardBuilderDefaultDecksList[ClubCardDefaultSelection].slice();
		ClubCardUsePrecon = false;
	} else {
		const deckSources = Player?.Game?.ClubCard?.Deck ?? [];
		const isValid = deckSources.length > DeckNum && deckSources[DeckNum]?.length >= ClubCardBuilderMinDeckSize && deckSources[DeckNum]?.length <= ClubCardBuilderMaxDeckSize;
		if (isValid) {
			ClubCardMessageAdd(ClubCardMessageType.SYSTEM, "UsingDeck");
			for (let i = 0; i < (Player.Game.ClubCard?.Deck[DeckNum]?.length ?? 0); i++) {
				const card = Player.Game.ClubCard?.Deck[DeckNum].charCodeAt(i);
				if (card) {
					Deck.push(card);
				}
			}
		} else {
			ClubCardMessageAdd(ClubCardMessageType.SYSTEM, "NoValidDeckFound");
			Deck = ClubCardBuilderDefaultDeck.slice();
		}
	}
	ClubCardDefaultSelection = "Default";

	// Loads the deck and shuffles it
	let Index = ClubCardGetPlayerIndex();
	if (Index >= 0) {
		ClubCardPlayer[Index].Deck = ClubCardShuffle(ClubCardLoadDeck(Deck));
		ClubCardPlayer[Index].FullDeck = ClubCardLoadDeck(Deck);
		for (const Card of ClubCardPlayer[Index].FullDeck) if (Card.OnGameStart) Card.OnGameStart(ClubCardPlayer[Index]);
	}

	// Starts the game with the loaded deck
	if (!ClubCardIsOnline()) {
		const textGetKey = "Start" + ((ClubCardTurnIndex == 0) ? "Player" : "Opponent");
		ClubCardMessageAdd(ClubCardMessageType.SYSTEM, textGetKey);
		ClubCardPlayer[0].Hand.push(ClubCardGetCopyCardByName("Tips"));
		ClubCardPlayer[1].Hand.push(ClubCardGetCopyCardByName("Tips"));
		ClubCardPlayerDrawCard(ClubCardPlayer[0], (ClubCardTurnIndex == 0) ? 5 : 6);
		ClubCardPlayerDrawCard(ClubCardPlayer[1], (ClubCardTurnIndex == 1) ? 5 : 6);
	} else {
		ClubCardPlayer[Index].Hand.push(ClubCardGetCopyCardByName("Tips"));
		ClubCardPlayerDrawCard(ClubCardPlayer[Index], (ClubCardTurnIndex == Index) ? 5 : 6);
	}
	// Syncs online data
	// Only send our own data when we select a deck, otherwise we could overwrite the other
	// player's deck selection if they both select at the same time.
	GameClubCardSyncOnlineData("Action", true);

	// If a card can be won against the NPC
	ClubCardReward = null;
	if (!ClubCardIsOnline() && (ClubCardPlayer[1].Character.IsNpc()))
		for (let Card of ClubCardList)
			if ((Card.Reward === "NPC-" + ClubCardPlayer[1].Character.Name) || (Card.Reward === ClubCardPlayer[1].Character.AccountName)) {
				let Char = String.fromCharCode(Card.ID);
				if ((Player.Game == null) || (Player.Game.ClubCard == null) || (Player.Game.ClubCard.Reward == null) || (Player.Game.ClubCard.Reward.indexOf(Char) < 0)) {
					ClubCardReward = Card;
					break;
				}
			}

	// If a card can be won against the online player
	if (ClubCardIsOnline() && ClubCardIsPlaying())
		for (let Card of ClubCardList)
			if (Card.Reward && ((Card.RewardMemberNumber === ClubCardOnlinePlayerMemberNumber1) || (Card.RewardMemberNumber === ClubCardOnlinePlayerMemberNumber2))) {
				let Char = String.fromCharCode(Card.ID);
				if ((Player.Game == null) || (Player.Game.ClubCard == null) || (Player.Game.ClubCard.Reward == null) || (Player.Game.ClubCard.Reward.indexOf(Char) < 0)) {
					ClubCardReward = Card;
					break;
				}
			}

	// Show the winnable card or start the game right away
	if (ClubCardReward != null) {
		if (ClubCardReward.Type == null) ClubCardReward.Type = "Member";
		ClubCardFocus = { ...ClubCardReward, Location: 'Reward' , AnimationState: 'idle'};
		if (ClubCardPlayer[1].Control === "AI") ClubCardPlayer[1].Hand.push({ ...ClubCardReward });
		ClubCardCreatePopup("TEXT", { Text: TextGet("CanWinNewCard") + " " + ClubCardReward.Title, Button1: TextGet("Play"), Function1: "ClubCardAIStart()" });
		ClubCardOptionSelection = true;
	} else ClubCardAIStart();

}

/**
 * Draw the club card player hand on screen, show only sleeves if not controlled by player
 * @param {Character} Char - The character to link to that club card player
 * @param {"Player" | "AI" | "Online"} Cont - The control linked to that player
 * @param {readonly number[]} Cards - The cards to build the deck with
 * @returns {void} - Nothing
 */
function ClubCardAddPlayer(Char, Cont, Cards) {
	let P = {
		Character: { ...Char },
		Control: Cont,
		Deck: ClubCardShuffle(ClubCardLoadDeck(Cards)),
		FullDeck: ClubCardLoadDeck(Cards),
		Index: ClubCardPlayer.length,
		Sleeve: CommonClamp(Player.Game.ClubCard?.CardBack ?? 0, 0, ClubCardBuilderCardBackCount),
		Hand: [],
		Board: [],
		Event: [],
		RenderFullBoard: [],
		DiscardPile: [],
		Level: 1,
		Money: 5,
		Fame: 0,
		CardsPlayedThisTurn: {},
		ClubCardTurnCounter: 1,
	};
	ClubCardPlayer.push(P);
}

/**
 * The player can get rewarded with a new card if she wins VS a specific opponent
 * @returns {void} - Nothing
 */
function ClubCardGetReward() {
	if (!ClubCardReward) return;
	let Char = String.fromCharCode(ClubCardReward.ID);
	if (!Player.Game.ClubCard?.Reward?.includes(Char)) {
		ClubCardFocus = ClubCardReward;
		Object.assign(Player.Game.ClubCard ?? {}, { Reward: (Player.Game.ClubCard?.Reward ?? "") + Char });
		ServerAccountUpdate.QueueData({ Game: Player.Game }, true);
		ClubCardCreatePopup("TEXT", { Text: TextGet("WonNewCard") + " " + ClubCardReward.Title, Button1: TextGet("Return"), Function1: "ClubCardEndGame()" });
	}
}

/**
 * Runs the before/after turn end handlers
 * @param {ClubCardPlayer} CCPlayer - The player whose turn is ending
 * @param {ClubCardPlayer} Opponent - The other player
 * @param {boolean} Before - true to run BeforeTurnEnd handlers, false to run AfterEndTurn handlers
 * @returns {void}
 */
function ClubCardRunTurnEndHandlers(CCPlayer, Opponent, Before) {
	// Runs handlers on player's board
	if (CCPlayer.Board != null) {
		// Iterate over a copy of the board so the BeforeTurnEnd handlers can remove cards from the
		// board and the behaviour is always well-defined.
		for (const Card of CCPlayer.Board.slice()) {
			if (!Card.Negated) {
				if (Before) {
					if (Card.BeforeTurnEnd != null) Card.BeforeTurnEnd(CCPlayer);
				} else {
					if (Card.AfterTurnEnd != null) Card.AfterTurnEnd(CCPlayer);
				}
			}
		}
	}

	// Runs handlers on opponent board
	if (Opponent.Board != null) {
		// Iterate over a copy of the opponents board so the onOpponentTurnEnd handlers copy
		// so the handlers can remove cards from the board and the behaviour is always well-defined.
		for (const Card of Opponent.Board.slice()) {
			// CCPlayer here is the "opponent" of the card
			if (!Card.Negated) {
				if (Before) {
					if (Card.BeforeOpponentTurnEnd != null) Card.BeforeOpponentTurnEnd(CCPlayer);
				} else {
					if (Card.AfterOpponentTurnEnd != null) Card.AfterOpponentTurnEnd(CCPlayer);
				}
			}
		}
	}

	// Runs the event of time cards on the player board and opponent board
	if (CCPlayer.Event != null) {
		for (const Card of CCPlayer.Event.slice()) {
			if (!Card.Negated) {
				if (Before) {
					if (Card.BeforeTurnEnd != null) Card.BeforeTurnEnd(CCPlayer);
				} else {
					if (Card.AfterTurnEnd != null) Card.AfterTurnEnd(CCPlayer);
				}
			}
		}
	}

	if (Opponent.Event != null) {
		for (const Card of Opponent.Event.slice()) {
			if (!Card.Negated) {
				if (Before) {
					if (Card.BeforeOpponentTurnEnd != null) Card.BeforeOpponentTurnEnd(CCPlayer);
				} else {
					if (Card.AfterOpponentTurnEnd != null) Card.AfterOpponentTurnEnd(CCPlayer);
				}
			}
		}
	}

	// streets effect
	if (CCPlayer.DiscardPile != null) {
		for (const Card of CCPlayer.DiscardPile.slice()) {
			if (Card.StreetsTurnEnd) Card.StreetsTurnEnd(CCPlayer);
		}
	}
}

/**
 * @param {string} StartType
 * StartType = ClubCardStartTurnType.BANKRUPT because otherwise the bankruptcy function won't work.
 */
function ClubCardStartTurn(StartType = ClubCardStartTurnType.BANKRUPT) {
	if (ClubCardIsStartTurn == false) {
		ClubCardMessageAdd(ClubCardMessageType.STARTTURNINFO, "StartTurnLogChat");
		ClubCardCheckEventAndCardExpired();
		ClubCardIsStartTurn = true;
	}

	ClubCardMessageSendAll();
	const CCPlayer = ClubCardPlayer[ClubCardTurnIndex];

	switch (StartType) {
		case ClubCardStartTurnType.PLAYCARD:
			ClubCardPlayCard(CCPlayer, /** @type {ClubCard} */ (CCPlayer.Control === "Player" ? ClubCardFocus : ClubCardFocusAI));
			break;
		case ClubCardStartTurnType.DRAWENDTURN:
			ClubCardEndTurn((ClubCardTurnCardPlayed == 0));
			break;
		case ClubCardStartTurnType.BANKRUPT:
			ClubCardBankrupt();
			break;
		case ClubCardStartTurnType.UPGRADELEVEL:
			ClubCardUpgradeLevel(ClubCardPlayer[ClubCardTurnIndex]);
			break;
		case ClubCardStartTurnType.ENDTURN:
			break;
		default:
			//If it error
			break;
	}

}

/**
 * When a turn ends, we move to the next player
 * @param {boolean} Draw - If the end of turn was triggered by a draw
 * @returns {void} - Nothing
 */
function ClubCardEndTurn(Draw = false) {

	// Adds fame, money and run custom card scripts from the player board
	let CCPlayer = ClubCardPlayer[ClubCardTurnIndex];
	let Opponent = ClubCardGetOpponent(CCPlayer);
	let StartingFame = CCPlayer.Fame;
	let StartingMoney = CCPlayer.Money;

	if (Draw) ClubCardOnDrawAction(CCPlayer);
	ClubCardRunTurnEndHandlers(CCPlayer, Opponent, true);

	// Now add the Fame & Money, so they use the state of the board
	// after any changes made by the BeforeTurnEnd handlers
	if (CCPlayer.Board != null) {
		for (const Card of CCPlayer.Board) {
			if (Card.FamePerTurn != null) ClubCardPlayerAddFame(CCPlayer, Card.FamePerTurn);
			if (Card.MoneyPerTurn != null) ClubCardPlayerAddMoney(CCPlayer, Card.MoneyPerTurn);
		}
	}

	CCPlayer.LastFamePerTurn = CCPlayer.Fame - StartingFame;
	CCPlayer.LastMoneyPerTurn = CCPlayer.Money - StartingMoney;

	ClubCardRunTurnEndHandlers(CCPlayer, Opponent, false);
	if (CCPlayer.Event != null) {
		for (let Pos = 0; Pos < CCPlayer.Event.length; Pos++) {
			let Card = CCPlayer.Event[Pos];
			if (!ClubCardCardHasGroup(Card, "TimedEvent") && !ClubCardCardHasGroup(Card, "ContinuousEvent")) {
				CCPlayer.Event.splice(Pos, 1);
				CCPlayer.DiscardPile.push(ClubCardGetCopyCardByName(Card.Name));
				Pos--;
			}
		}
	}

	if ((CCPlayer.Money < 0) && (CCPlayer.Fame > StartingFame)) {
		CCPlayer.Fame = StartingFame;
		CCPlayer.LastFamePerTurn = 0;
	}

	// Display the gained money and fame
	// const FameMoneyText = ((CCPlayer.LastFamePerTurn >= 0) ? "+" : "") + CCPlayer.LastFamePerTurn.toString() + " Fame, " + ((CCPlayer.LastMoneyPerTurn >= 0) ? "+" : "") + CCPlayer.LastMoneyPerTurn.toString() + " Money";

	const subst =  {
		[ClubCardPlaceholderKeys.FAMEAMOUNT]: CCPlayer.LastFamePerTurn.toString(),
		[ClubCardPlaceholderKeys.MONEYAMOUNT]: CCPlayer.LastMoneyPerTurn.toString(),
	};
	// Adds an entry to the log
	ClubCardTurnEndDraw = Draw;
	if (Draw) {
		//TODO EndDrawPlayer look not good without wrapping to a new line
		ClubCardMessageAdd(ClubCardMessageType.FAMEMONEYINFO, "EndDrawPlayer", subst, CCPlayer);
		ClubCardPlayerDrawCard(CCPlayer, 1);
	} else {
		ClubCardMessageAdd(ClubCardMessageType.FAMEMONEYINFO, "EndTurnPlayer", subst, CCPlayer);
	}
	ClubCardMessageSendAll();

	// If that player wins the game from Fame gain
	if (!MiniGameEnded) if (ClubCardCheckVictory(CCPlayer)) { ClubCardEndGameSyncAndMessage(CCPlayer); return; }
	if (!MiniGameEnded) if (ClubCardCheckVictory(Opponent)) { ClubCardEndGameSyncAndMessage(Opponent); return; }

	// Move to the next player
	ClubCardTurnIndex++;
	CCPlayer.ClubCardTurnCounter++;
	if (ClubCardTurnIndex >= ClubCardPlayer.length) ClubCardTurnIndex = 0;
	ClubCardTurnCardPlayed = 0;
	ClubCardAIStart();

	ClubCardIsStartTurn = false;
	ClubCardStartTurn(ClubCardStartTurnType.ENDTURN);
	if (!MiniGameEnded) if (ClubCardCheckVictory(CCPlayer)) { ClubCardEndGameSyncAndMessage(CCPlayer); return; }
	if (!MiniGameEnded) if (ClubCardCheckVictory(Opponent)) { ClubCardEndGameSyncAndMessage(Opponent); return; }

	// Syncs online data
	GameClubCardSyncOnlineData();

}

function ClubCardCheckEventAndCardExpired() {
	const CCPlayer = ClubCardPlayer[ClubCardTurnIndex];
	// When a turn starts, the event and members time goes down and might expire, then trigger turn start effects of cards on board
	let turnStartCards = [];
	if (CCPlayer.Board != null) {
		for (let Pos = 0; Pos < CCPlayer.Board.length; Pos++) {
			let Card = CCPlayer.Board[Pos];
			if (CommonIsNumeric(Card.Time) && Card.Time > 0) Card.Time--;
			if (CommonIsNumeric(Card.Time) && Card.Time <= 0 && !Card.Negated) {
				if (Card.EffectType != "ToHand") ClubCardRemoveFromBoard(CCPlayer, Card, false, ClubCardMessageType.STARTTURNEVENT);
				else ClubCardRemoveFromBoard(CCPlayer, Card, true, ClubCardMessageType.STARTTURNEVENT);
				Pos--;
			}
			if (Card.turnStart != null && !Card.Negated) {
				turnStartCards.push(Card);
			}
		}
	}

	if (CCPlayer.Event != null) {
		for (let Pos = 0; Pos < CCPlayer.Event.length; Pos++) {
			let Card = CCPlayer.Event[Pos];
			if ((Card.Time != null) && (Card.Time > 0)) Card.Time--;
			if ((Card.Time == null) || (Card.Time <= 0)) {
				ClubCardMessageAdd(ClubCardMessageType.STARTTURNEVENT, "EventExpired", {[ClubCardPlaceholderKeys.CARDNAME]: Card.Name},CCPlayer);
				CCPlayer.Event.splice(Pos, 1);
				CCPlayer.DiscardPile.push(ClubCardGetCopyCardByName(Card.Name));
				if (Card.onLeaveClub) Card.onLeaveClub(CCPlayer);
				Pos--;
			}
			if (Card.turnStart != null && !Card.Negated) {
				turnStartCards.push(Card);
			}
		}
	}

	for (const Card of turnStartCards) {
		Card.turnStart?.(CCPlayer);
	}
}

/**
 * Checks that the focused card is still in the Player's hand
 * and defocuses it if not.
 */
function ClubCardDefocusCardIfDiscarded() {
	const focus = ClubCardFocus;
	if (!focus) return;
	const playerIndex = ClubCardGetPlayerIndex();
	if (playerIndex === -1) return;
	if (!focus.Location || focus.Location !== "PlayerHand") return;
	if (!ClubCardPlayer[playerIndex].Hand.find(c => c.UniqueID === focus.UniqueID)) ClubCardFocus = null;
}

/**
 * Checks if need to defocus a card after a member leaves the club
 */
function ClubCardDefocusCardIfRemoved() {
	const focus = ClubCardFocus;
	if (!focus) return;
	const playerIndex = ClubCardGetPlayerIndex();
	if (playerIndex === -1) return;
	if (!focus.Location || focus.Location !== "PlayerBoard") return;
	if (!ClubCardPlayer[playerIndex].Board.find(c => c.UniqueID === focus.UniqueID)) {
		ClubCardFocus = null;
		return;
	}
	if (focus.CanActive) {
		ClubCardReturnCardFromPreview({ ...focus });
		ClubCardFocus = null;
	}
}

/**
 * @param {ClubCardPlayer} CCPlayer
 * @returns {boolean}
 */
function ClubCardCheckVictory(CCPlayer) {
	if (CCPlayer.Fame >= ClubCardFameGoal) {
		ClubCardFocus = null;
		ClubCardPending = null;
		MiniGameVictory = (CCPlayer.Control == "Player");
		MiniGameEnded = true;
		let Msg = TextGet("VictoryFor" + CCPlayer.Control);
		if (ClubCardIsOnline()) Msg = TextGet("VictoryOnline").replace("PLAYERNAME", CharacterNickname(CCPlayer.Character));
		ClubCardCreatePopup("TEXT", { Text: Msg, Button1: TextGet("Return"), Function1: "ClubCardEndGame()" });
		ClubCardGameEnded = true;
		if (MiniGameVictory && (ClubCardReward != null)) ClubCardGetReward();
		GameClubCardReset();
		return true;
	} else if (MiniGameEnded) {
		return true;
	}

	return false;
}

/**
 * @param {ClubCardPlayer} CCPlayer
 */
function ClubCardEndGameSyncAndMessage(CCPlayer) {
	const textGetKey = ClubCardIsOnline()
		? "VictoryFor" + CCPlayer.Control
		: "VictoryOnline";
	if (textGetKey == "VictoryForOnline") {
		ClubCardMessageAdd(ClubCardMessageType.VICTORYINFO, "VictoryOnline");
	} else {
		// XXX: this is always VictoryOnline
		ClubCardMessageAdd(ClubCardMessageType.VICTORYINFO, textGetKey);
	}
	ClubCardMessageSendAll();
	GameClubCardSyncOnlineData();
	// Notices everyone in the room that the game end
	if (ClubCardIsOnline()) {
		const Dictionary = new DictionaryBuilder().sourceCharacter(CCPlayer.Character).build();
		ServerSend("ChatRoomChat", { Content: "ClubCardGameEnd", Type: "Action" , Dictionary: Dictionary});
	}
}

/**
 * Returns the number of cards that can be played in one turn by a player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {number} - The number of cards
 */
function ClubCardTurnPlayableCardCount(CCPlayer) {
	if ((CCPlayer == null) || (CCPlayer.Board == null)) return 1;
	let Count = 1;
	for (let Card of CCPlayer.Board) {
		if (Card.ExtraPlay != null && !Card.Negated) {
			Count = Count + Card.ExtraPlay;
		}
	}
	if (CCPlayer.Event != null)
		for (let Card of CCPlayer.Event)
			if (Card.ExtraPlay != null && !Card.Negated)
				Count = Count + Card.ExtraPlay;
	if (Count < 1) Count = 1;
	return Count;
}

/**
 * Returns the extra time in turns for event over time
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @returns {number} - The extra time
 */
function ClubCardExtraTime(CCPlayer) {
	if ((CCPlayer == null) || (CCPlayer.Board == null)) return 0;
	let Count = 0;
	for (let Card of CCPlayer.Board)
		if (Card.ExtraTime != null && !Card.Negated)
			Count = Count + Card.ExtraTime;
	return Count;
}

/**
 * Returns the player that will be the target of a card.  Liability cards are played on the other side.
 * @param {ClubCard} Card - The card to play
 * @returns {ClubCardPlayer} - The target player
 */
function ClubCardFindTarget(Card) {
	if (ClubCardIsLiability(Card))
		return (ClubCardTurnIndex == 0) ? ClubCardPlayer[1] : ClubCardPlayer[0];
	else
		return ClubCardPlayer[ClubCardTurnIndex];
}

/**
 * Returns TRUE if a specific card can be played by the player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card to play
 * @returns {boolean} - TRUE if the card can be played
 */
function ClubCardCanPlayCard(CCPlayer, Card) {
	if ((CCPlayer == null) || (Card == null) || (Card.Location == null)) return false;
	if ((CCPlayer.Index == 0) && (Card.Location != "PlayerHand")) return false;
	if ((CCPlayer.Index != 0) && (Card.Location != "OpponentHand")) return false;
	if ((Card.CanPlay != null) && !Card.CanPlay(CCPlayer)) return false;
	let Target = ClubCardFindTarget(Card);
	let targetLevel = Target.Level;

	if (!ClubCardCanPlayEffectsLimitation(CCPlayer, Card)) return false;
	// Jennifer removes a card on her board before entering so should therefor be playable on a full board.
	const boardFull = Target.Board.length >= ClubCardLevelLimit[Target.Level] && Card.Name !== "Jennifer";
	if ((Target.Board != null) && (Card.Type == "Member") && (Target.Level != null) && boardFull) return false;
	if (ClubCardIsLiability(Card) && ClubCardGroupOnBoardCount(Target, "Liability") >= ClubCardLiabilityLimit[Target.Level]) return false;
	if ((Card.RequiredLevel != null) && (Target.Level != null) && (Card.RequiredLevel > targetLevel)) return false;
	if ((Card.Prerequisite === "SelectOwnMember") && (CCPlayer.Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectOwnMember") && (CCPlayer.Control == "AI") && !ClubCardGroupIsOnBoard(CCPlayer, "Liability")) return false;
	if ((Card.Prerequisite === "SelectOpponentMember") && (ClubCardGetOpponent(CCPlayer).Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectOpponentMember") && (CCPlayer.Control == "AI") && (ClubCardGroupOnBoardCount(ClubCardGetOpponent(CCPlayer), "Liability") == ClubCardGetOpponent(CCPlayer).Board.length)) return false;
	if ((Card.Prerequisite === "SelectAnyMember") && (CCPlayer.Board.length + ClubCardGetOpponent(CCPlayer).Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectAnyMember") && (CCPlayer.Control == "AI") && (CCPlayer.Board.length + ClubCardGetOpponent(CCPlayer).Board.length <= 0)) return false;
	if ((Card.Prerequisite === "SelectAnyEvent") && (CCPlayer.Event.length + ClubCardGetOpponent(CCPlayer).Event.length <= 0)) return false;
	if (Card.Prerequisite === "SelectCardInHand" && CCPlayer.Hand.length < 2) return false;
	if ((Card.Type == "Event") && (ClubCardEventNameIsInEvents(ClubCardGetOpponent(CCPlayer), "Restrain"))) return false;
	if ((Card.Type == "Event") && (ClubCardEventNameIsInEvents(CCPlayer, "Restrain"))) return false;

	return true;
}

/**
 * Returns TRUE if a specific card can be played by the player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card to play
 */
function ClubCardCanPlayEffectsLimitation(CCPlayer, Card) {
	const opponent = ClubCardGetOpponent(CCPlayer);
	const edens = opponent.Board.filter(card => card.Name === "Eden" && !card.Negated);
	for (const eden of edens) {
		if ((Card.RequiredLevel ?? 1) == eden.EffectKey) return false;
	}
	if (Card.Name === "Feline Fatale") {
		const ownersPresent = CCPlayer.Board.filter(value => ClubCardCardHasGroup(value, "Owner"));
		const highestTierOwner = ownersPresent.reduce((max, card) => Math.max(max, card.RequiredLevel ?? 1), 0);
		const lowestTierMember = opponent.Board.reduce((min, card) => Math.min(min, card.RequiredLevel ?? 1), 5);
		if (highestTierOwner < lowestTierMember) return false;
	}
	if (ClubCardEventNameIsInEvents(opponent, "Ball Buster") && (Card.Type === "Event" || ClubCardIsLiability(Card))) return false;
	if (ClubCardEventNameIsInEvents(CCPlayer, "Walkies") && (!ClubCardCardHasGroup(Card, "Pet") && !ClubCardCardHasGroup(Card, "Exhibitionist"))) return false;
	return true;
}

/**
 * Returns TRUE if a specific card can be selected as a prerequisite for another card by the player
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard | null} Card - The card to select
 * @returns {boolean} - TRUE if the card can be selected
 */
function ClubCardCanSelectCard(CCPlayer, Card) {
	if ((CCPlayer == null) || (Card == null) || (ClubCardPending == null)) return false;
	if ((ClubCardPending.Prerequisite === "SelectOwnMember") && ClubCardCardsSelectConditions(Card, CCPlayer) && (CCPlayer.Index == 0) && (Card.Location == "PlayerBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectOwnMember") && ClubCardCardsSelectConditions(Card, CCPlayer) && (CCPlayer.Index == 1) && (Card.Location == "OpponentBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectOpponentMember") && ClubCardCardsSelectConditions(Card, CCPlayer) && (CCPlayer.Index == 0) && (Card.Location == "OpponentBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectOpponentMember") && ClubCardCardsSelectConditions(Card, CCPlayer) && (CCPlayer.Index == 1) && (Card.Location == "PlayerBoard") && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectAnyMember") && ClubCardCardsSelectConditions(Card, CCPlayer) && ((Card.Location == "PlayerBoard") || (Card.Location == "OpponentBoard")) && (Card.Type === "Member")) return true;
	if ((ClubCardPending.Prerequisite === "SelectAnyEvent") && ClubCardCardsSelectConditions(Card, CCPlayer) && ((Card.Location == "PlayerBoard") || (Card.Location == "OpponentBoard")) && (Card.Type === "Event")) return true;
	if ((ClubCardPending.Prerequisite === "SearchACard") && ClubCardCardsSelectConditions(Card, CCPlayer) && (Card.Location == "Popup")) return true;
	if (ClubCardPending.Prerequisite === "SelectCardInHand" && ClubCardCardsSelectConditions(Card, CCPlayer) && Card.Location == "PlayerHand") return true;
	if (ClubCardPending.Name === "Clare" && (Card.Location == "Popup")) return true;
	return false;
}

/**
 * Returns TRUE if a specific card can be selected as a prerequisite for another card by the player
 * @param {ClubCard} Card - The card to select
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {null | ClubCard} AICard - if the function is called by AI playing a card
 * @returns {boolean} - TRUE if the card can be selected
 */
function ClubCardCardsSelectConditions(Card, CCPlayer, AICard = null) {
	if ((Card.Location === "PlayerBoard" || Card.Location === "OpponentBoard") && (Card.Name === "Moon" || Card.Name === "Beat Cop" || Card.Name === "Vintage Maid")) return false;
	if ((AICard ?? ClubCardPending)?.Name === "Tax Auditor" && CommonIsNumeric(Card.RequiredLevel) && Card.RequiredLevel > 3) return false;
	if ((AICard ?? ClubCardPending)?.Name === "Feline Fatale") {
		const ownersPresent = CCPlayer.Board.filter(value => ClubCardCardHasGroup(value, "Owner"));
		const highestTierOwner = ownersPresent.reduce((max, card) => Math.max(max, card.RequiredLevel ?? 1), 0);
		if ((Card.RequiredLevel ?? 1) > highestTierOwner) return false;
	}
	if ((AICard ?? ClubCardPending)?.Name === "Vanilla Classic" && !ClubCardCardHasGroup(Card, "PornActress")) return false;
	if ((AICard ?? ClubCardPending)?.Name === "Sophie" && ClubCardIsLiability(Card)) return false;
	if ((AICard ?? ClubCardPending)?.EffectType === "Removal" && (Card.Name === "Kira" && !Card.Negated)) return false;
	if ((AICard ?? ClubCardPending)?.EffectType === "Removal" && ClubCardCardHasGroup(Card, "Latex") && Card.Name != "Condom Suit" && (ClubCardNameIsOnBoard(CCPlayer, "Condom Suit", true) || ClubCardNameIsOnBoard(ClubCardGetOpponent(CCPlayer), "Condom Suit", true))) return false;
	if ((AICard ?? ClubCardPending)?.Name === "Walkies" && !(ClubCardCardHasGroup(Card, "Exhibitionist") || ClubCardCardHasGroup(Card, "Pet"))) return false;
	if ((AICard ?? ClubCardPending)?.Name === "Latex Nurse" && Card.Type === "Event") return false;
	if ((AICard ?? ClubCardPending)?.Name === "Color Mixer" && ClubCardIsLiability(Card)) return false;
	if ((AICard ?? ClubCardPending)?.Name === "Creaking" && !ClubCardCardHasGroup(Card, "Latex")) return false;
	return true;
}

/**
 * When a player plays a card
 * @param {ClubCardPlayer} CCPlayer - The club card player
 * @param {ClubCard} Card - The card to play
 * @param {boolean} triggerOnPlay - false for search cards
 * @returns {void} - Nothing
 */
function ClubCardPlayCard(CCPlayer, Card, triggerOnPlay = true) {
	let opponent = ClubCardGetOpponent(CCPlayer);

	if (Card.Prerequisite === "SelectATier" && ClubCardTierSelection == null && (CCPlayer.Control == "Player")) { ClubCardCreatePopup("TIERSELECTION"); return; }

	if (Card.Prerequisite === "SearchACard" && ClubCardSelection == null && (CCPlayer.Control == "Player") && ClubCardPending == null) {
		ClubCardFocus = null;
		ClubCardPending = Card;
		if (ClubCardIsAnimationOn) {
			Card.IsVisible = false;
			ClubCardMoveCardToPending(Card);
		}
		Card.OnPlay?.(CCPlayer);
		return;
	}

	// If the player must select a card before playing the current card
	if ((Card.Prerequisite != null) && Card.Prerequisite != "SelectATier" && Card.Prerequisite != "SearchACard" && (ClubCardSelection == null) && (CCPlayer.Control == "Player")) {
		ClubCardFocus = null;
		ClubCardPending = Card;
		if (ClubCardIsAnimationOn) {
			Card.IsVisible = false;
			ClubCardMoveCardToPending(Card);
		}

		const textGetKeyPrereq = "Prerequisite " + Card.Name;
		ClubCardMessageAdd(ClubCardMessageType.PREREQUISTITE, textGetKeyPrereq);
		return;
	}

	//#region CCPlayer.Control == "AI"

	// If the AI must select one of her own liability card to remove before playing the current card
	if ((Card.Prerequisite === "SelectOwnMember") && (ClubCardSelection == null) && (CCPlayer.Control == "AI")) {
		let Cards = [];
		for (let C of CCPlayer.Board)
			if (C.Group != null)
				for (let Group of C.Group)
					if (Group === "Liability")
						Cards.push(C);
		ClubCardSelection = CommonRandomItemFromList(null, Cards);
	}

	// If the AI must select one of her opponent card to remove before playing the current card
	if ((Card.Prerequisite === "SelectOpponentMember") && (ClubCardSelection == null) && (CCPlayer.Control == "AI")) {
		let Cards = [];
		for (let C of ClubCardGetOpponent(CCPlayer).Board)
			if (((C.Group == null) || (C.Group.indexOf("Liability") < 0)) && ClubCardCardsSelectConditions(C, CCPlayer, Card))
				Cards.push(C);
		ClubCardSelection = CommonRandomItemFromList(null, Cards);
	}

	// If the AI must select any card to affect before playing the current card
	if ((Card.Prerequisite === "SelectAnyMember") && (ClubCardSelection == null) && (CCPlayer.Control == "AI")) {
		let cards = [];
		for (const card of CCPlayer.Board) {
			if (ClubCardCardsSelectConditions(card, CCPlayer, Card)) {
				cards.push(card);
				cards[cards.length - 1].Location = "PlayerBoard";
			}
		}
		for (const card of ClubCardGetOpponent(CCPlayer).Board) {
			if (ClubCardCardsSelectConditions(card, CCPlayer, Card)) {
				cards.push(card);
				cards[cards.length - 1].Location = "OpponentBoard";
			}
		}
		const selectedCardNumber = Math.floor(Math.random() * cards.length);
		ClubCardSelection = cards[selectedCardNumber];
		ClubCardSelection.Location = cards[selectedCardNumber].Location;
	}

	//#endregion

	// Sets the log text, different for a liability card
	let Target = ClubCardFindTarget(Card);
	const textGetKey = ClubCardIsLiability(Card) ? "PlayACardOpponentBoard" : "PlayACard";
	ClubCardMessageAdd(ClubCardMessageType.ACTION, textGetKey , {[ClubCardPlaceholderKeys.CARDNAME]: Card.Name});
	ClubCardTurnCardPlayed++;

	// Plays the card
	if (CCPlayer.Hand != null) {
		const index = CCPlayer.Hand.findIndex(c => c.UniqueID === Card.UniqueID);
		if (index === -1) throw new Error(`ClubCardPlayCard(): Card with UID ${Card.UniqueID} not found`);
		CCPlayer.Hand.splice(index, 1);

		if (Card.Type === "Member" || Card.Type == null) {
			Card.Type = "Member";
			Target.Board.push(Card);
		}

		if (Card.Type === "Event") {
			if (((Card.Time != null)) && (Card.Time >= 0)) {
				Target.Event.push(Card);
				Card.Time = Card.Time + ClubCardExtraTime(CCPlayer);
			} else
				Target.DiscardPile.push(Card);
		}

		Card.Location = (CCPlayer.Index == 0) ? "PlayerBoard" : "OpponentBoard";
		ClubCardSetGlow(Card, (ClubCardTurnIndex == 0) ? "#FFFF00" : "#FF0000");

		ClubCardUpdateBoardCardsIndex(Target);
	}

	// Focuses on the card, runs it's scripts
	if(CCPlayer.Control == "Player") ClubCardFocus = Card;
	else ClubCardFocusAI = Card;

	if (CCPlayer.CardsPlayedThisTurn[CCPlayer.ClubCardTurnCounter]) {
		CCPlayer.CardsPlayedThisTurn[CCPlayer.ClubCardTurnCounter] = [...CCPlayer.CardsPlayedThisTurn[CCPlayer.ClubCardTurnCounter], Card];
	} else {
		CCPlayer.CardsPlayedThisTurn[CCPlayer.ClubCardTurnCounter] = [Card];
	}

	if (Card.OnPlay != null && triggerOnPlay) Card.OnPlay(CCPlayer);
	ClubCardSelection = null;
	ClubCardTierSelection = null;
	if (!MiniGameEnded) if (ClubCardCheckVictory(CCPlayer)) { ClubCardEndGameSyncAndMessage(CCPlayer); return; }
	if (!MiniGameEnded) if (ClubCardCheckVictory(opponent)) { ClubCardEndGameSyncAndMessage(opponent); return; }
	if (MiniGameEnded) return;

	if (CCPlayer.Control == "Player") {
		ClubCardFocus = null;
		ClubCardPending = null;
	} else ClubCardFocusAI = null;

	// Run on cards played handlers
	ClubCardOnCardPlayedHandler(CCPlayer, Card);
	if (!MiniGameEnded) if (ClubCardCheckVictory(CCPlayer)) { ClubCardEndGameSyncAndMessage(CCPlayer); return; }
	if (!MiniGameEnded) if (ClubCardCheckVictory(opponent)) { ClubCardEndGameSyncAndMessage(opponent); return; }
	if (MiniGameEnded) return;

	// End the turn if needed
	ClubCardMessageSendAll();
	if (ClubCardTurnCardPlayed >= ClubCardTurnPlayableCardCount(CCPlayer))
		return ClubCardEndTurn();

	// If that player can play more than one card per turn, we announce it
	ClubCardMessageAdd(ClubCardMessageType.ACTIONSEPARATOR, "PlayAnotherCard");

	ClubCardAIStart();
}

/**
 * When it adds a card to a player's board, check if there is an effect on board that needs to be triggered.
 * @param {ClubCardPlayer} CCPlayer - The target player
 * @param {ClubCard} Card - The card that was played
 * @returns {void} - Nothing
 */
function ClubCardOnCardPlayedHandler(CCPlayer, Card) {
	for (const C of CCPlayer.Board.slice()) {
		if (C.onPlayedCard != null && !C.Negated) {
			C.onPlayedCard(CCPlayer, Card);
		}
	}

	const opponent = ClubCardGetOpponent(CCPlayer);
	for (const C of opponent.Board.slice()) {
		if (C.onOpponentPlayedCard != null && !C.Negated) {
			C.onOpponentPlayedCard(opponent, Card);
		}
	}

	if (Card.Revealed && Card.Type != "Event") {
		for (let i = CCPlayer.Hand.length - 1; i >= 0; i--) {
			if (CCPlayer.Hand[i].Name === "Stalker") {
				if (ClubCardCanSummonCard(CCPlayer, CCPlayer.Hand[i])) ClubCardSummonCard(CCPlayer, CCPlayer.Hand.splice(i, 1)[0]);
			}
		}
	}
}

/**
 * When it adds a card to a player's board, it updates for all index cards.
 * @param {ClubCardPlayer} Target - The target player
 * @returns {void} - Nothing
 */
function ClubCardUpdateBoardCardsIndex(Target) {
	for (let i = 0; i < Target.Board.length; i += 1) {
		Target.Board[i].ArrayIndex = i;
	}
}

/**
 * When a player selects a card that's a prerequisite for another card
 * @param {ClubCard} Card - The card to play
 * @returns {void} - Nothing
 */
function ClubCardSelectCard(Card) {
	if (!ClubCardPending) return;
	ClubCardSelection = Card;
	ClubCardPlayCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardPending);
}

/**
 * When the AI plays it's move
 * @returns {void} - Nothing
 */
function ClubCardAIPlay() {

	// Make sure the current player is an AI
	let CCPlayer = ClubCardPlayer[ClubCardTurnIndex];
	if (CCPlayer.Control != "AI") return;

	// If the AI can upgrade, there's a 50/50 odds he does it
	if ((Math.random() >= 0.5) && (CCPlayer.Level < ClubCardLevelCost.length - 1) && (CCPlayer.Money >= ClubCardCalculateLevelCost(CCPlayer))) {
		ClubCardStartTurn(ClubCardStartTurnType.UPGRADELEVEL);
		ClubCardAIStart();
		return;
	}

	// Builds an array of all valid cards
	let ValidCards = [];
	if (CCPlayer.Hand != null)
		for (let Card of CCPlayer.Hand) {
			Card.Location = "OpponentHand";
			if (ClubCardCanPlayCard(CCPlayer, Card))
				ValidCards.push(Card);
		}

	// If we have valid cards, we play one at random
	if (ValidCards.length > 0) {
		ClubCardFocusAI = CommonRandomItemFromList(null, ValidCards);
		return ClubCardStartTurn(ClubCardStartTurnType.PLAYCARD);
	}

	// If nothing can be played and money or fame is going negative, the computer can go bankrupt
	if ((CCPlayer.LastMoneyPerTurn != null) && (CCPlayer.LastFamePerTurn != null) && (CCPlayer.LastMoneyPerTurn + CCPlayer.LastFamePerTurn <= 0) && (100 - CCPlayer.Money - CCPlayer.Fame > Math.random() * 100))
		return ClubCardStartTurn();

	// Since nothing could be done, we end the turn by skipping
	ClubCardStartTurn(ClubCardStartTurnType.DRAWENDTURN);

}

/**
 * When the opponent (AI) starts it's turn, gives 3 seconds before it's move
 * @returns {void} - Nothing
 */
function ClubCardAIStart() {
	ClubCardDestroyPopup();
	if (!MiniGameEnded && ClubCardPlayer[ClubCardTurnIndex].Control == "AI") setTimeout(ClubCardAIPlay, 1000);
}

/**
 * When a player concedes the game
 * @returns {void} - Nothing
 */
function ClubCardConcede() {
	if (ClubCardIsOnline()) {
		ClubCardMessageAdd(ClubCardMessageType.SYSTEM, ClubCardIsPlaying() ? "OnlineConcede" : "OnlineStopWatch", {PLAYERNAME: CharacterNickname(Player)});
		if (ClubCardIsPlaying() && MiniGameEnded === false) {
			MiniGameEnded = true;
			if (ClubCardIsOnline()) {
				ServerSend("ChatRoomChat", { Content: "ClubCardGameConceded", Type: "Hidden" });
			}
		}
	}
	ClubCardDestroyPopup();
	ClubCardEndGame(false);
}
/**
 * When the opponent concedes the game and sends us a hidden message about it
 * @param {MemberNumber} ID - The player who conceded
 * @returns {void} - Nothing
 */
function ClubCardPlayerConceded(ID) {
	if (ID == Player.MemberNumber) return;
	const CCP = ClubCardPlayer.find(C => C.Character.MemberNumber == ID);
	if (!CCP || !CCP.Character) return; // Prevent error if player not found
	const CCO = ClubCardGetOpponent(CCP);
	ClubCardFocus = null;
	MiniGameVictory = ID != CCO.Character.MemberNumber;
	MiniGameEnded = true;
	let Msg = TextGet("VictoryForConcede").replace("OPPONENTPLAYER", CharacterNickname(CCP.Character)).replace("PLAYERNAME", CharacterNickname(CCO.Character));
	if (ClubCardIsPlaying()) {
		Msg = TextGet("VictoryForConcedePlayer").replace("OPPONENTPLAYER", CharacterNickname(CCP.Character));
		const Dictionary = new DictionaryBuilder().sourceCharacter(Player).targetCharacter(CCP.Character).build();
		ServerSend("ChatRoomChat", { Content: "ClubCardGameConcede", Type: "Action" , Dictionary: Dictionary});
	}
	ClubCardCreatePopup("TEXT", { Text: Msg, Button1: TextGet("Return"), Function1: "ClubCardEndGame()" });
	ClubCardGameEnded = true;
	if (MiniGameVictory && (ClubCardReward != null)) ClubCardGetReward();
	GameClubCardReset();
}

/**
 * When a player goes bankrupt, she restarts her club from scratch, draws 5 new cards and ends her turn
 * @returns {void} - Nothing
 */
function ClubCardBankrupt() {

	// Resets that player game & board
	let CCPlayer = ClubCardPlayer[ClubCardTurnIndex];

	ClubCardRemoveGroupFromBoard(CCPlayer, "Liability");
	CCPlayer.Level = 1;
	CCPlayer.Money = 5;
	CCPlayer.Fame = 0;
	CCPlayer.Board = [];
	CCPlayer.Event = [];
	CCPlayer.Hand = [];
	CCPlayer.Deck = ClubCardShuffle(CCPlayer.FullDeck.map(card => ({ ...card})));
	CCPlayer.Hand.push(ClubCardGetCopyCardByName("Tips"));
	ClubCardTurnCardPlayed = 0;
	ClubCardPlayerDrawCard(CCPlayer, 5);

	// The opponent loses all liability cards on her board
	let Opponent = ClubCardGetOpponent(CCPlayer);
	ClubCardRemoveGroupFromBoard(Opponent, "Liability");
	// Clear the discard pile after the removing liability cards
	CCPlayer.DiscardPile = [];

	ClubCardMessageAdd(ClubCardMessageType.CARDEFFECT, "WentBankrupt", {}, CCPlayer);
	///
	ClubCardDestroyPopup();
	if (CCPlayer.Control == "Player") ClubCardFocus = null;
	else ClubCardFocusAI = null;
	ClubCardEndTurn(false);
}

/**
 * When the game ends
 * @param {boolean} Victory - TRUE if the player is victorious
 * @returns {void} - Nothing
 */
function ClubCardEndGame(Victory) {
	ElementRemove("CCLog");
	ElementRemove("CCChat");
	ElementRemove("DefaultDecksDropdown");
	MiniGameEnded = true;
	if (Victory != null) MiniGameVictory = Victory;
	ClubCardOpponentDeck = [];
	// We must reset the status of our game first. When we end the minigame, it will
	// send a status update to the room, so we want this to reflect that we're no longer
	// running the game.
	GameClubCardReset();
	MiniGameEnd();
}

/**
 * @param {string} Text
 * @returns {string}
 */
function ClubCardTextGet(Text) {
	const str = TextGetInScope(ScreenFileGetTranslation("MiniGame", "ClubCard", "ClubCard"), Text);
	return !str.startsWith(TEXT_NOT_FOUND_PREFIX) ? str : "";
}

/**
 * Prepares the card titles, texts and initialize the log if needed
 * @returns {void} - Nothing
 */
function ClubCardLoadCaption() {
	if ((ClubCardList[0].Title == null) && (ClubCardTextGet("Title Kinky Neighbor") != "")) {
		for (let Card of ClubCardBuilderList) {
			Card.Title = ClubCardTextGet("Title " + Card.Name);
			Card.Text = ClubCardTextGet("Text " + Card.Name);
		}
		for (let Card of ClubCardList) {
			Card.Title = ClubCardTextGet("Title " + Card.Name);
			Card.Text = ClubCardTextGet("Text " + Card.Name);
		}
		for (let P of ClubCardPlayer) {
			for (let Card of P.Hand) {
				Card.Title = ClubCardTextGet("Title " + Card.Name);
				Card.Text = ClubCardTextGet("Text " + Card.Name);
			}
			for (let Card of P.Board) {
				Card.Title = ClubCardTextGet("Title " + Card.Name);
				Card.Text = ClubCardTextGet("Text " + Card.Name);
			}
			for (let Card of P.Deck) {
				Card.Title = ClubCardTextGet("Title " + Card.Name);
				Card.Text = ClubCardTextGet("Text " + Card.Name);
			}
			for (let Card of P.FullDeck) {
				Card.Title = ClubCardTextGet("Title " + Card.Name);
				Card.Text = ClubCardTextGet("Text " + Card.Name);
			}
		}
	}
}

/**
 * Assigns the club card object if needed and loads the CSV file
 * @returns {void} - Nothing
 */
function ClubCardCommonLoad() {
	if (Player.Game == null) Player.Game = {};
	if (Player.Game.ClubCard == null) Player.Game.ClubCard = { Deck: [] };
	if (Player.Game.ClubCard.Reward == null) Player.Game.ClubCard.Reward = "";
	ClubCardList[0].Title = undefined;
	TextPrefetchFile(ScreenFileGetTranslation("MiniGame", "ClubCard", "ClubCard"));
}

/**
 * Loads the club card mini-game: Assigns the opponents and draws the cards
 * @type {ScreenLoadHandler}
 */
async function ClubCardLoad() {
	ClubCardCommonLoad();
	ClubCardOnlinePlayerMemberNumber1 = -1;
	ClubCardOnlinePlayerMemberNumber2 = -1;
	ClubCardTurnCardPlayed = 0;
	ClubCardIsStartTurn = false;
	ClubCardMessageStorage = [];
	ClubCardFocus = null;
	ClubCardLogScroll = false;
	ClubCardLog = [];
	ClubCardRenderLog = [];
	ClubCardTurnIndex = Math.floor(Math.random() * 2);
	ClubCardPlayer = [];
	ClubCardUniqueIDCounter = 0;
	ClubCardAddPlayer(Player, "Player", []);
	ClubCardAddPlayer(ClubCardOpponent, "AI", ClubCardOpponentDeck);

	// Ensure Settings object exists
	if (Player.Game.ClubCard) {
		Player.Game.ClubCard.Settings ??= {};
		Player.Game.ClubCard.Settings.IsAnimation ??= true;
		ClubCardIsAnimationOn = Player.Game.ClubCard.Settings.IsAnimation;
	}

	ClubCardCreatePopup("DECK");
	if (ClubCardPopup?.Mode == "DECK") {
		ElementDropdown.Create("DefaultDecksDropdown", Object.keys(ClubCardBuilderDefaultDecksList), function () {
			ClubCardDefaultSelection = /** @type {ClubCardDefaultDecks} */ (this.value);
		});
	}
}

/**
 * Draw the club card player hand on screen, show only sleeves if not controlled by player
 * @param {number|null} Value - The card to draw
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the card
 * @param {string} Image - The buble
 * @returns {number} - The next bubble Y position
 */
function ClubCardRenderBubble(Value, X, Y, W, Image) {
	DrawImageResize("Screens/MiniGame/ClubCard/Bubble/" + Image + ".png", X, Y - W / 20, W, W);
	if (Value != null) DrawTextWrap(Value.toString(), X, Y, W, W, "Black");
	return Y + W * 1.5;
}

/**
 * Returns the text description of all groups, separated by commas
 * @param {readonly ClubCardGroup[]} Group - The card to draw
 * @returns {string} - The
 */
function ClubCardGetGroupText(Group) {
	if ((Group == null) || (Group.length == 0)) return "";
	let Text = "";
	for (let G of Group)
		Text = Text + ((Text == "") ? "" : ", ") + ClubCardTextGet("Group" + G);
	return Text;
}


// #region Animation Card ### ### ### ###

/**
 * Returns a reference to the original card based on its UniqueID.
 * @param {string} uniqueID - A copy of the card for which the original needs to be found.
 * @param {Map<string, ClubCard> | null} [allMap] - an attempt to reduce the waste of resources on calculations
 * @returns {ClubCard|null} - The original card or null if not found.
 */
function ClubCardGetOriginalCardByUniqueID(uniqueID, allMap = null) {
	return (allMap ?? ClubCardCreateMapCurrentGameState()).get(uniqueID) ?? null;
}

/**
 * Creates a map of all cards in the current game by their UniqueID.
 * Useful for quick lookup by ID.
 * @returns {Map<string, ClubCard>} Map of UniqueID to card
 */
function ClubCardCreateMapCurrentGameState() {
	const all = [];

	for (const player of ClubCardPlayer) {
		all.push(...player.Hand);
		all.push(...player.Board);
		all.push(...player.Event);
		all.push(...player.DiscardPile);
		all.push(...player.Deck);
	}

	/** @type {Map<string, ClubCard>} */
	const map = new Map();
	for (const card of all)
		if (card.UniqueID)
			map.set(card.UniqueID, card);
	return map;
}


/**
 * Updates the positions of all active card animations.
 *
 * This function is called every frame within `ClubCardRun()` to animate cards smoothly.
 * It updates the position of each animated card based on the elapsed time and removes
 * completed animations from the `activeAnimations` array.
 *
 * @param {number} Timestamp - The current timestamp provided by `GameRun()`, ensuring synchronization with the game loop.
 *
 * **How it works:**
 * 1. Loops through all active animations in `activeAnimations`.
 * 2. Calculates the progress (0 to 1) of the animation based on elapsed time.
 * 3. Applies an ease-in-out effect for smoother movement.
 * 4️. Updates the card's position (`CurrentX`, `CurrentY`, `CurrentW`).
 * 5️. Once the animation is complete:
 *     - Restores the card’s visibility and state.
 *     - Restores the original card’s visibility if needed.
 *     - Calls `onComplete()` if provided.
 *     - Removes the animation from `activeAnimations`.
 */
function ClubCardUpdateCardAnimations(Timestamp) {
	ClubCardActiveAnimations = ClubCardActiveAnimations.filter(animation => {
		let elapsed = Timestamp - animation.StartTime;
		let progress = Math.min(elapsed / animation.Duration, 1);

		let easedProgress = progress < 0.5
			? 2 * progress * progress
			: 1 - Math.pow(-2 * progress + 2, 2) / 2;

		let currentX = animation.StartPosition.x + (animation.EndPosition.x - animation.StartPosition.x) * easedProgress;
		let currentY = animation.StartPosition.y + (animation.EndPosition.y - animation.StartPosition.y) * easedProgress;
		let currentW = animation.StartPosition.w + (animation.EndPosition.w - animation.StartPosition.w) * easedProgress;

		ClubCardRenderCard(animation.Card, currentX, currentY, currentW, null, null, true);

		if (progress >= 1) {
			clearTimeout(animation.SafetyTimeout);

			animation.Card.IsVisible = true;
			animation.Card.AnimationState = "idle";

			if (animation.OriginalCard && !animation.KeepOriginalHidden) {
				animation.OriginalCard.IsVisible = true;
				animation.OriginalCard.AnimationState = "idle";
			}

			if (typeof animation.OnComplete === "function") animation.OnComplete(animation.Card);
			return false;
		}

		return true;
	});
}


/**
 * Moves a card between predefined positions (Preview, Hand, Pending).
 * Handles both animation of a copy and visibility of the original card.
 * @param {ClubCard} card - The card being moved.
 * @param {number} priority - Animation rendering level priority
 * @param {ClubCardPosition} startPosition - The starting position {x, y, w}.
 * @param {ClubCardPosition} endPosition - The target position {x, y, w}.
 * @param {boolean} hideOriginal - Whether to hide the original card during animation.
 * @param {boolean} keepOriginalHidden - If true, the original card stays hidden after animation.
 * @param {(() => void) | null} [onStart] - Function called before the animation starts.
 * @param {((card: ClubCard) => void)|null} [onComplete] - Function called after the animation completes.
 * @param {number} [duration] - Animation duration in milliseconds.
 */
function ClubCardMoveCard(card, priority, startPosition, endPosition, hideOriginal = false, keepOriginalHidden = false, onStart = null, onComplete = null, duration = 150) {
	if (ClubCardIsAnimationOn == false) return;
	if (!card || (card.AnimationState && card.AnimationState == "moving")) return;
	card.AnimationState = "moving";
	card.IsVisible = false;

	const originalCard = ClubCardGetOriginalCardByUniqueID(card.UniqueID ?? "");

	if (hideOriginal && originalCard) {
		originalCard.IsVisible = false;
		originalCard.AnimationState = "moving";
	}

	if (typeof onStart === "function") onStart();

	const safetyTimeout = setTimeout(() => {
		console.error(`⚠️ Fallback: Restore ${card.Name} state manually!`);
		if (originalCard && !keepOriginalHidden) {
			originalCard.IsVisible = true;
			originalCard.AnimationState = "idle";
		}
		card.AnimationState = "idle";
	}, duration + 100);

	ClubCardActiveAnimations.push({
		Card: card,
		Priority: priority,
		OriginalCard: originalCard,
		StartTime: performance.now(),
		Duration: duration,
		StartPosition: startPosition,
		EndPosition: endPosition,
		HideOriginal: hideOriginal,
		KeepOriginalHidden: keepOriginalHidden,
		SafetyTimeout: safetyTimeout,
		OnComplete: onComplete ?? undefined
	});
}

/**
 * Moves a card to the preview position (original card stays hidden after).
 * @param {ClubCard} card
 * @param {(() => void) | null} [onStart]
 * @param {((card: ClubCard) => void) | null} [onComplete]
 * @param {number} [duration]
 */
function ClubCardMoveCardToPreview(card, onStart = null, onComplete = null, duration = 150) {
	if (card.CurrentX === undefined || card.CurrentY === undefined || card.CurrentW === undefined) return;
	ClubCardMoveCard(card,
		1,
		{ x: card.CurrentX, y: card.CurrentY, w: card.CurrentW },
		ClubCardFocusPosition,
		true,
		true,
		onStart,
		onComplete,
		duration);
}

/**
 * Returns a card from preview back to its original position.
 * @param {ClubCard} card
 * @param {(() => void) | null} [onStart]
 * @param {((card: ClubCard) => void) | null} [onComplete]
 * @param {number} [duration]
 */
function ClubCardReturnCardFromPreview(card, onStart = null, onComplete = null, duration = 150) {
	const originalCard = ClubCardGetOriginalCardByUniqueID(card.UniqueID ?? "");

	if (!originalCard) {
		ClubCardFocus = null;
		return;
	}
	if (originalCard.CurrentX === undefined || originalCard.CurrentY === undefined || originalCard.CurrentW === undefined) return;
	let endPosition = { x: originalCard.CurrentX, y: originalCard.CurrentY, w: originalCard.CurrentW };

	ClubCardMoveCard(card,
		1,
		ClubCardFocusPosition,
		endPosition,
		false,
		false,
		onStart,
		onComplete,
		duration);
}

/**
 * Returns a card from pending state back to its original position.
 * @param {ClubCard} card
 * @param {(() => void) | null} [onStart]
 * @param {((card: ClubCard) => void) | null} [onComplete]
 * @param {number} [duration]
 */
function ClubCardReturnCardFromPending(card, onStart = null, onComplete = null, duration = 150) {
	const originalCard = ClubCardGetOriginalCardByUniqueID(card.UniqueID ?? "");
	if (originalCard?.CurrentX === undefined || originalCard.CurrentY === undefined || originalCard.CurrentW === undefined) return;

	ClubCardMoveCard(card,
		1,
		ClubCardPendingPosition,
		{ x: originalCard.CurrentX, y: originalCard.CurrentY, w: originalCard.CurrentW },
		false,
		false,
		onStart,
		onComplete,
		duration);
}

/**
 * Moves a card from preview to pending state.
 * @param {ClubCard} card - The card to be moved.
 * @param {(() => void)|null} [onStart] - A function called before the animation starts.
 * @param {((card: ClubCard) => void)|null} [onComplete] - A function called after the animation completes.
 * @param {number} [duration] - The animation duration in milliseconds.
 */
function ClubCardMoveCardToPending(card, onStart = null, onComplete = null, duration = 150) {
	ClubCardMoveCard(card,
		1,
		ClubCardFocusPosition,
		ClubCardPendingPosition,
		false,
		true,
		onStart,
		onComplete,
		duration);
}

// #endregion ### ### ### ### ### ### ###

/**
 * Draw the club card player hand on screen, show only sleeves if not controlled by player
 * @param {ClubCard} Card - The card to draw
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the card
 * @param {number|null} Sleeve - The sleeve image to draw instead of the card
 * @param {string|null} Source - The source from where it's called
 * @param {boolean} [isIgnoreIsVisibility]
 * @returns {void} - Nothing
 */
function ClubCardRenderCard(Card, X, Y, W, Sleeve = null, Source = null, isIgnoreIsVisibility = false) {
	if (!Card) return;

	//Save Current Card coordinates
	if (Card.CurrentX !== X || Card.CurrentY !== Y || Card.CurrentW !== W) {
		Card.CurrentX = X;
		Card.CurrentY = Y;
		Card.CurrentW = W;
	}

	if (Source && Card.Location !== Source) {
		Card.Location = Source;
	}

	//Check isVisibility
	if (isIgnoreIsVisibility == false)
		if (Card.IsVisible == false)
			return;
	// Draw the sleeved version if required
	if (Sleeve != null) {
		DrawImageResize("Screens/MiniGame/ClubCard/Sleeve/" + Sleeve + ".png", X+2, Y+2, W-4, W * 2 -4);
		DrawImageResize("Screens/MiniGame/ClubCard/Frame/SleeveBorder.png", X, Y, W, W * 2);
		return;
	}

	// Keeps the hover card
	if (Card.AnimationState != "moving" && Source) {
		if (MouseIn(X, Y, W, W * 2)) {
			ClubCardHover = { ...Card };
			ClubCardHover.Location = Source;
		}
	}

	// Gets the text and frame color
	let Level = ((Card.RequiredLevel == null) || (Card.RequiredLevel <= 1)) ? 1 : Card.RequiredLevel;
	let Color = ClubCardColor[Level];
	if (Card.Type == null) Card.Type = "Member";

	// Draw the images and texts on the screen
	DrawImageResize("Screens/MiniGame/ClubCard/Frame/" + Card.Type + ((Card.Reward != null) ? "Reward" : "") + Level.toString() + ".png", X, Y, W, W * 2);
	if (Card.Location === "PlayerBoard" && Card.onRender && !Card.Negated) Card.onRender(ClubCardPlayer[0], X, Y, W);
	DrawImageResize("Screens/MiniGame/ClubCard/" + Card.Type + "/" + Card.Name + ".png", X + W * 0.05, Y + W * 0.16, W * 0.9, W * 1.8);
	if ((Card.Time != null) && ((Card.Location === "PlayerBoard") || (Card.Location === "OpponentBoard"))) {
		MainCanvas.font = "bold " + Math.round(W / 1.5) + "px arial";
		DrawText(Card.Time.toString(), X + W * 0.5, Y + W * 0.9, "Black", "Silver");
	}
	MainCanvas.font = "bold " + Math.round(W / 12) + "px arial";
	if (Card.Title) {
		DrawTextWrap(Card.Title, X + W * 0.05, Y + W * 0.05, W * 0.9, W * 0.1, "Black", undefined, undefined, Math.round(W / 22));
	}
	let BubblePos = Y + W * 0.2;
	let WModifier = 0.125; // Modifier for adjusting fame, money, level, liability icons
	if (Level >= 1) BubblePos = ClubCardRenderBubble(Level, X + W * 0.05, BubblePos, W * WModifier, "Level");
	if (Card.FamePerTurn != null) BubblePos = ClubCardRenderBubble(Card.FamePerTurn, X + W * 0.05, BubblePos, W * WModifier, "Fame");
	if (Card.MoneyPerTurn != null) BubblePos = ClubCardRenderBubble(Card.MoneyPerTurn, X + W * 0.05, BubblePos, W * WModifier, "Money");
	if (ClubCardIsLiability(Card)) BubblePos = ClubCardRenderBubble(null, X + W * 0.05, BubblePos, W * WModifier, "Liability");
	if (Card.Revealed) BubblePos = ClubCardRenderBubble(null, X + W * 0.05, BubblePos, W * WModifier, "Revealed");
	if (Card.Negated) ClubCardRenderBubble(null, X + W * 0.05, BubblePos, W * WModifier, "Negated");
	if (Card.Text != null) {
		DrawRect(X + W * 0.05, Y + W * 1.41, W * 0.9, W * 0.58, Color + "A0");
		let GroupText = ClubCardGetGroupText(Card.Group ?? []);
		if (GroupText != "") {
			if (Card.RewardMemberNumber && GroupText.includes(ClubCardTextGet("GroupPlayer"))) {
				var playerText = ClubCardTextGet("GroupPlayer");
				GroupText = GroupText.replace(playerText, `${playerText} #${Card.RewardMemberNumber}`);
			}
			MainCanvas.font = "bold " + Math.round(W / 16) + "px arial";
			DrawTextWrap(GroupText, X + W * 0.05, Y + W * 1.44, W * 0.925, W * 0.1, "Black", undefined, undefined, Math.round(W / 22));
			MainCanvas.font = ((Card.Text.startsWith("<F>")) ? "italic " : "bold ") + Math.round(W / 16) + "px arial";
			if (Card.Negated && !Card.Text.startsWith("<F>")) DrawTextWrap(Card.Text.replace("<F>", ""), X + W * 0.05, Y + W * 1.585, W * 0.925, W * 0.38, "Grey", undefined, undefined, Math.round(W / 22));
			else DrawTextWrap(Card.Text.replace("<F>", ""), X + W * 0.05, Y + W * 1.585, W * 0.925, W * 0.38, "Black", undefined, undefined, Math.round(W / 22));
		} else {
			MainCanvas.font = ((Card.Text.startsWith("<F>")) ? "italic " : "bold ") + Math.round(W / 16) + "px arial";
			if (Card.Negated && !Card.Text.startsWith("<F>")) DrawTextWrap(Card.Text.replace("<F>", ""), X + W * 0.05, Y + W * 1.5, W * 0.925, W * 0.48, "Grey", undefined, undefined, Math.round(W / 22));
			else DrawTextWrap(Card.Text.replace("<F>", ""), X + W * 0.05, Y + W * 1.5, W * 0.925, W * 0.48, "Black", undefined, undefined, Math.round(W / 22));
		}
	}
	MainCanvas.font = CommonGetFont(36);

	// If the card has a glowing border, we draw it
	let Time = CommonTime();
	if ((Card.GlowTimer != null) && (Card.GlowTimer > Time))
		DrawEmptyRect(X + (W * 0.005), Y + (W * 0.01), W - (W * 0.01), W * 2 - (W * 0.02), Card.GlowColor + Math.round((Card.GlowTimer - Time) / 40).toString(16), Math.round(W / 50));

}

/**
 * Draw the club card player board on screen
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws the cards
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the game board
 * @param {number} H - The height of the game board
 * @param {boolean} Mirror - If the board should be rendered bottom to top
 * @returns {void} - Nothing
 */
function ClubCardRenderBoard(CCPlayer, X, Y, W, H, Mirror) {

	// Draws the money, fame and level
	MainCanvas.font = CommonGetFont(Math.round(H / 20));
	let TextY = Mirror ? Y + H * 0.895 : Y + H * 0.01;
	if (CCPlayer.Character != null) DrawTextWrap(CharacterNickname(CCPlayer.Character), X + W * 0.016, TextY, W * 0.19, H * 0.1, "White");
	if (CCPlayer.Fame != null) DrawTextWrap(TextGet("Fame") + ": " + CCPlayer.Fame + (((CCPlayer.LastFamePerTurn != null) && (CCPlayer.LastFamePerTurn != 0)) ? " (" + ((CCPlayer.LastFamePerTurn > 0) ? "+" : "") + CCPlayer.LastFamePerTurn.toString() + ")" : ""), X + W * 0.21, TextY, W * 0.19, H * 0.1, (CCPlayer.Fame >= 0) ? "White" : "Pink");
	if (CCPlayer.Money != null) DrawTextWrap(TextGet("Money") + ": " + CCPlayer.Money + (((CCPlayer.LastMoneyPerTurn != null) && (CCPlayer.LastMoneyPerTurn != 0)) ? " (" + ((CCPlayer.LastMoneyPerTurn > 0) ? "+" : "") + CCPlayer.LastMoneyPerTurn.toString() + ")" : ""), X + W * 0.61, TextY, W * 0.19, H * 0.1, (CCPlayer.Money >= 0) ? "White" : "Pink");
	if (CCPlayer.Level != null) {
		if (ClubCardGroupIsOnBoard(CCPlayer, "Liability")) {
			DrawTextWrap(TextGet("Level" + CCPlayer.Level) + " (" + CCPlayer.Board.length + " / " + ClubCardLevelLimit[CCPlayer.Level] + ")", X + W * 0.765, TextY, W * 0.19, H * 0.1, ClubCardColor[CCPlayer.Level]);
			DrawImageResize("Screens/MiniGame/ClubCard/Bubble/Liability" + CCPlayer.Level + ".png", X + W * 0.935, TextY * 1.015, W * 0.02, H * 0.058);
			DrawTextWrap(" (" + ClubCardGroupOnBoardCount(CCPlayer, "Liability") + " / " + ClubCardLiabilityLimit[CCPlayer.Level] + ")", X + W * 0.88, TextY, W * 0.19, H * 0.1, ClubCardColor[CCPlayer.Level]);
		} else {
			DrawTextWrap(TextGet("Level" + CCPlayer.Level) + " (" + CCPlayer.Board.length + " / " + ClubCardLevelLimit[CCPlayer.Level] + ")", X + W * 0.80, TextY, W * 0.19, H * 0.1, ClubCardColor[CCPlayer.Level]);
		}
	}
	if (CCPlayer.CardsPlayedThisTurn != null && !Mirror) DrawTextWrap("Play: " + ClubCardTurnCardPlayed + " / " + ClubCardTurnPlayableCardCount(CCPlayer), X + W * 0.398, TextY, W * 0.19, H * 0.1, "White");

	// Draws the played cards
	if (!CCPlayer || !CCPlayer.Board) return;

	let FullBoard = [...CCPlayer.Board, ...(CCPlayer.Event || [])];
	const isEqualBoard = CCPlayer.RenderFullBoard.length === FullBoard.length
		&& CCPlayer.RenderFullBoard.every((card, index) => card.UniqueID === FullBoard[index].UniqueID);

	/** @type {ClubCard[]} */
	let remainingCards = [];
	if (!isEqualBoard) {
		remainingCards = CCPlayer.RenderFullBoard
			.filter(oldCard => FullBoard.some(newCard => newCard.UniqueID === oldCard.UniqueID))
			.map(oldCard => ({ ...oldCard }));
	}

	let PosX = Math.round(X + (W / 2) - (FullBoard.length * W / 20));
	let IncX = Math.round(W / 10);
	if (PosX < X) {
		PosX = X;
		IncX = Math.round(W / FullBoard.length);
	}

	for (let C of FullBoard) {
		let PosY = Mirror ? Y + H - (H * 0.65) : Y + (H * 0.1);
		C.CurrentX = PosX + 5;
		C.CurrentY = PosY;
		C.CurrentW = (W / 12) - 5;
		PosX += IncX;
	}

	if (!isEqualBoard && ClubCardIsAnimationOn) {
		//########### Record animations for the new card positions
		remainingCards.forEach(copyCard => {
			const originalCard = ClubCardGetOriginalCardByUniqueID(copyCard.UniqueID ?? "");
			if (!originalCard) return;

			const startPosition = { x: copyCard.CurrentX ?? 0, y: copyCard.CurrentY ?? 0, w: copyCard.CurrentW ?? 0 };
			const endPosition = { x: originalCard.CurrentX ?? 0, y: originalCard.CurrentY ?? 0, w: originalCard.CurrentW ?? 0 };

			ClubCardMoveCard(copyCard, 0, startPosition, endPosition, true, false, null, null, 100);
		});
	}

	CCPlayer.RenderFullBoard = [...FullBoard];

	for (let C of CCPlayer.RenderFullBoard) {
		if (C.CurrentX === undefined || C.CurrentY === undefined || C.CurrentW === undefined) return;
		ClubCardRenderCard(C, C.CurrentX, C.CurrentY, C.CurrentW, null, (CCPlayer.Control === "Player") ? "PlayerBoard" : "OpponentBoard");
	}

	// Puts a shadow over the board if not playing
	MainCanvas.font = CommonGetFont(36);
	if (CCPlayer.Index != ClubCardTurnIndex) DrawRect(X, Y, W, H, "#0000007F");
}

/**
 * Draw the club card player hand on screen, show only sleeves if not controlled by player
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws it's hand
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the game board
 * @param {number} H - The height of the game board
 * @returns {void} - Nothing
 */
function ClubCardRenderHand(CCPlayer, X, Y, W, H) {
	if ((CCPlayer == null) || (CCPlayer.Hand == null)) return;
	const deckSelected = ClubCardGetOpponent(CCPlayer).FullDeck?.length > 1;
	let PosX = Math.round(X + (W / 2) - (CCPlayer.Hand.length * W / 16));
	let IncX = Math.round(W / 8);
	if (PosX < X) {
		PosX = X;
		IncX = Math.round(W / CCPlayer.Hand.length);
	}
	for (let C of CCPlayer.Hand) {
		const isSleeve = (CCPlayer.Control == "Player") ? null : (C.Revealed && deckSelected) ? null : ((CCPlayer.Control == "AI") ? 0 : CCPlayer.Sleeve);
		const source = (CCPlayer.Control == "Player") ? "PlayerHand" : "OpponentHand";
		ClubCardRenderCard(C, PosX + 5, Y + 5 + (H * 0.1), (W / 10) - 5, isSleeve, source);
		PosX = PosX + IncX;
	}
}

/**
 * Draw the discard pile on screen
 * @param {ClubCardPlayer} CCPlayer - The club card player that draws it's discard pile
 * @param {number} X - The X on screen position
 * @param {number} Y - The Y on screen position
 * @param {number} W - The width of the discard pile window
 * @param {number} H - The height of the discard pile window
 * @returns {void} - Nothing
 */
function ClubCardRenderDiscardPile(CCPlayer, X, Y, W, H) {
	if ((CCPlayer == null) || (CCPlayer.DiscardPile == null)) return;
	let PosX = Math.round(X + (W / 2) - (CCPlayer.DiscardPile.length * W / 16));
	let IncX = Math.round(W / 8);
	if (PosX < X) {
		PosX = X;
		IncX = Math.round(W / CCPlayer.DiscardPile.length);
	}
	for (let C of CCPlayer.DiscardPile) {
		ClubCardRenderCard(C, PosX + 5, Y + 5 + (H * 0.1), (W / 10) - 5, null, (CCPlayer.Control == "Player") ? "PlayerDiscardPile" : "OpponentDiscardPile");
		PosX = PosX + IncX;
	}
}

/**
 * Shows the status text on the bottom right
 * @param {string} Text - The status text to show
 * @returns {void} - Nothing
 */
function ClubCardStatusText(Text) {
	MainCanvas.font = CommonGetFont((ClubCardPopup == null) ? 26 : 32);
	if (ClubCardPopup?.Mode == "DISCARDPILE" || ClubCardPending != null || ClubCardPopup?.Mode == "TIERSELECTION") {
		DrawTextWrap(TextGet(Text), 1715, 900, 280, 100, "White");
	} else if (Text == "OpponentPlaying" || Text == "WatchingGame") {
		DrawTextWrap(TextGet(Text), 1715, 900, (ClubCardPopup == null) ? 190 : 280, 100, "White");
	} else {
		DrawTextWrap(TextGet(Text), 1715, 850, (ClubCardPopup == null) ? 190 : 280, 100, "White");
	}
	MainCanvas.font = CommonGetFont(36);
}

/**
 * Renders the right side panel
 * @returns {void} - Nothing
 */
function ClubCardRenderPanel() {

	// Draws the focused card, panel and log
	DrawRect(1702, 0, 298, 1000, "#404040");
	DrawRect(1700, 0, 2, 1000, "White");
	if (ClubCardFocus != null) ClubCardRenderCard(ClubCardFocus, ClubCardFocusPosition.x, ClubCardFocusPosition.y, ClubCardFocusPosition.w);
	if (document.getElementById("CCLog") == null) {
		ElementCreateDiv("CCLog");
		let Elem = document.getElementById("CCLog");
		if (Elem) {
			Elem.style.backgroundColor = "#000000";
			Elem.style.overflowY = "auto";
			Elem.style.whiteSpace = "pre-wrap";
		}
	} else {
		if (ClubCardLog.length == 0) {
			const Elem = document.getElementById("CCLog");
			if (Elem) {
				Elem.innerHTML = "";
			}
		}
	}
	if (document.getElementById("CCChat") == null) {
		ElementCreateInput("CCChat", "text", "", "100");
		let Elem = document.getElementById("CCChat");
		if (Elem) {

			Elem.style.backgroundColor = "#FFFFFF";
			Elem.style.color = "#000000";
			Elem.setAttribute("placeholder", TextGet("ChatHere"));
		}
	}

	ElementPositionFix("CCLog", 20, 1705, 5, 285, 725);
	//old
	//ElementPositionFix("CCLog", 20, 1705, (ClubCardFocus == null) ? 5 : 590, 285, (ClubCardFocus == null) ? 825 : 240);
	ElementPosition("CCChat", 1849, 765, 286);

	if (ClubCardRenderLog.length > 0) {
		for (let messageLogItem of ClubCardRenderLog) {
			// one style for all these types message
			const isOneDivContainer = messageLogItem.MessageType == ClubCardMessageType.SYSTEM
				|| messageLogItem.MessageType == ClubCardMessageType.PLAYERSMESSAGE
				|| messageLogItem.MessageType == ClubCardMessageType.PREREQUISTITE
				|| messageLogItem.MessageType == ClubCardMessageType.PLAYERSDISCONNECTED;
			if (isOneDivContainer) {
				ClubCardCreateOneDivContainer(messageLogItem);
			}  else {
				ClubCardCreateTurnDivContainer(messageLogItem);
			}
		}

		ClubCardLog.push(...ClubCardRenderLog);
		//Clear ClubCardRenderLog
		ClubCardRenderLog = [];
	}



	if (ClubCardLogScroll) {
		ElementScrollToEnd("CCLog");
		ClubCardLogScroll = false;
	}

	// In deck popup mode
	if ((ClubCardPopup != null) && (ClubCardPopup.Mode == "DECK")) {
		ClubCardStatusText("SelectDeck");
		return;
	}

	// If there's a pending card with a prerequisite
	if (ClubCardPending != null) {
		ClubCardRenderCard(ClubCardPending, 995, 400, 100);
		if (ClubCardPopup?.Mode == "TifaActive") {
			DrawButton(745, 475, 215, 50, TextGet("DrawThisCard"), "White");
			DrawButton(745, 535, 215, 50, TextGet("SendToStreets"), "White");
			ClubCardStatusText("SelectOption");
			return;
		}
		ClubCardStatusText("SelectPrerequisite");
		DrawButton(1805, 805, 90, 90, "", "White", "Screens/MiniGame/ClubCard/Button/CancelPending.png", TextGet("CancelPending"));

		if (ClubCardCanSelectCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus))
			if(!ClubCardIsAnimationOn || ClubCardFocus?.IsVisible) DrawButton(745, 505, 215, 50, TextGet("SelectCard"), "White");
		return;
	}

	// Can concede/exit out of popup mode
	if (ClubCardPopup == null && ClubCardPending == null) DrawButton(1905, 905, 90, 90, "", "White", "Screens/MiniGame/ClubCard/Button/Concede.png", TextGet(ClubCardIsPlaying() ? "Concede" : "StopWatch"));
	if (ClubCardPopup == null && ClubCardPending == null) DrawButton(1905, 805, 90, 90, "", "White", "Icons/Introduction.png", TextGet("Info"));


	// If we are waiting for deck selection
	if(ClubCardGameEnded) {
		ClubCardStatusText("GameEnded");
	} else if ((ClubCardPlayer[0].FullDeck == null) || (ClubCardPlayer[0].FullDeck.length == 0) || (ClubCardPlayer[1].FullDeck == null) || (ClubCardPlayer[1].FullDeck.length == 0)) {
		ClubCardStatusText("WaitingSelectDeck");
		return;
	}

	// Draw the discard and bottom buttons and texts
	if  (!ClubCardPopup) DrawButton(1805, 805, 90, 90, "", "White", "Screens/MiniGame/ClubCard/Button/DiscardPile.png", TextGet("DiscardPile"));
	if ((ClubCardPopup == null) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player")) {
		DrawButton(1805, 905, 90, 90, "", "White", "Screens/MiniGame/ClubCard/Button/Bankrupt.png", TextGet("Bankrupt"));
		ClubCardDrawButton();
		if (ClubCardFocus && ClubCardCanPlayCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus))
			if(ClubCardFocus.IsVisible != false) DrawButton(745, 505, 215, 50, TextGet("PlayCard"), "White");
		if (ClubCardFocus && ClubCardCanActiveEffect(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus))
			if(ClubCardFocus.IsVisible != false) DrawButton(745, 505, 215, 50, TextGet("ActiveEffect"), "White");
	} else if(ClubCardOptionSelection) {
		ClubCardStatusText("SelectOption");
	} else if(ClubCardInspection) {
		ClubCardStatusText("InspectPile");
		DrawButton(1805, 805, 90, 90, "", "White", "Screens/MiniGame/ClubCard/Button/CancelPending.png", TextGet("Close"));
	} else if(ClubCardGameEnded) {
		ClubCardStatusText("GameEnded");
	} else if(ClubCardPopup?.Mode == "INFO") {
		DrawButton(1705, 805, 90, 90, "", ClubCardColor[1], "", "Random Appartment Card");
		DrawTextFit("t1", 1750, 850, 90, "Black", "Black");
		DrawButton(1805, 805, 90, 90, "", ClubCardColor[2], "", "Random Cottage Card");
		DrawTextFit("t2", 1850, 850, 90, "Black", "Black");

		DrawButton(1905, 805, 90, 90, "", "White", "Screens/MiniGame/ClubCard/Button/CancelPending.png", TextGet("Close"));

		DrawButton(1705, 905, 90, 90, "", ClubCardColor[3], "", "Random House Card");
		DrawTextFit("t3", 1750, 950, 90, "Black", "Black");
		DrawButton(1805, 905, 90, 90, "", ClubCardColor[4], "", "Random Mansion Card");
		DrawTextFit("t4", 1850, 950, 90, "Black", "Black");

		DrawButton(1905, 905, 90, 90, "", ClubCardColor[5], "", "Random Manor Card");
		DrawTextFit("t5", 1950, 950, 90, "Black", "Black");


	} else if (ClubCardPopup?.Mode == "TIERSELECTION") {
		ClubCardStatusText("SelectOption");
		DrawButton(1805, 805, 90, 90, "", "White", "Screens/MiniGame/ClubCard/Button/CancelPending.png", TextGet("CancelPending"));
	} else if (!MiniGameEnded) {
		ClubCardStatusText(ClubCardIsPlaying() ? "OpponentPlaying" : "WatchingGame");
	}
}

/**
 * Function to display the Card Draw button
 * @returns {void} - Nothing
 */
function ClubCardDrawButton() {
	if (ClubCardTurnCardPlayed == 0 && ClubCardPlayer[0].Deck.length > 0) {
		DrawButton(1705, 805, 90, 190, "", "White", "", TextGet("Draw"));
		DrawImageResize("Screens/MiniGame/ClubCard/Sleeve/" + ClubCardPlayer[0].Sleeve + ".png", 1708, 808, 84, 184);
		DrawImageResize("Screens/MiniGame/ClubCard/Frame/SleeveBorder.png", 1707, 807, 86, 186);
		DrawImageResize("Screens/MiniGame/ClubCard/Frame/CountDisplay.png", 1706, 806, 88, 188);
		if (ClubCardPlayer[0].Deck.length < 10) {
			DrawTextFit("0"+ClubCardPlayer[0].Deck.length.toString(), 1750, 850, 25, "#c3facf");
		} else {
			DrawTextFit(ClubCardPlayer[0].Deck.length.toString(), 1750, 850, 25, "#c3facf");
		}
	} else {
		DrawButton(1705, 805, 90, 190, "", "White", "", TextGet("CannotDraw"));
		if (ClubCardPlayer[0].Deck.length > 0) {
			DrawImageResize("Screens/MiniGame/ClubCard/Button/CancelPending.png", 1690, 836, 120, 136);
		} else {
			DrawImageResize("Icons/ClubCard/PlayerSlot0.png", 1675, 808, 148, 185);
		}
	}
}

/**
 * Function to create and add system or player messages to document.getElementById(“CCLog”).
 * @param {ClubCardMessage} MessageItem - Message
 */
function ClubCardCreateOneDivContainer(MessageItem) {
	const systemMessageBackground = "#04122a";
	const playerMessageBackground = "#15171A";
	const playersDisconnectedBackground = "#8B0000";
	let divName = null;
	let counter = 1;

	if (MessageItem.MessageType == ClubCardMessageType.PREREQUISTITE) {
		divName = "OneMessagePrerequisite";
		const existingElement = document.getElementById(divName);
		if (existingElement) existingElement.remove();
	} else {
		while (true) {
			divName = `OneMessageDiv_Turn${MessageItem.TurnCounter}_${counter}`;
			if (document.getElementById(divName) == null) break;
			counter++;
		}
	}

	/** @type {Partial<Record<ClubCardMessageType, string>>} */
	const backgroundColors = {
		[ClubCardMessageType.SYSTEM]: systemMessageBackground,
		[ClubCardMessageType.PLAYERSDISCONNECTED]: playersDisconnectedBackground,
	};

	ElementCreate({
		tag: "div",
		style: {
			"color": "white",
			"background-color": backgroundColors[MessageItem.MessageType] ?? playerMessageBackground,
			"margin-top": "2px",
			"margin-bottom": "2px",
			"border-top": "1px solid white",
			"border-bottom": "1px solid white",
			"border-radius": "5px",
			"line-height": "1.4",
			"overflow-wrap": "break-word",
		},
		attributes: {
			id: divName,
		},
		children: ClubCardMessageGetHTML(MessageItem),
		parent: ElementWrap("CCLog"),
	});
}

/**
 * Function for creating and filling a container with all objects for a stroke by index.
 * @param {ClubCardMessage} MessageItem - Message
 */
function ClubCardCreateTurnDivContainer(MessageItem) {
	//const MainTurnContainerBackgound = "#15171A";
	const ActionSeparatorBackgound = "#2E2E2E";
	const StartTurnTextColor = "#FF9999";

	const turnDivName = `TurnDiv_Turn${MessageItem.TurnCounter}_${MessageItem.PlayerId}`;
	if (document.getElementById(turnDivName) == null) {
		ElementCreate({
			tag: "div",
			style: {
				"margin-top": "10px",
				"margin-bottom": "10px",
				"border-top": "1px solid white",
				"border-bottom": "1px solid white",
				"border-radius": "10px",
			},
			attributes: {
				id: turnDivName,
			},
			parent: ElementWrap("CCLog"),
		});
	}

	const commonStyles = {
		"color": "white",
		"margin-top": "2px",
		"margin-bottom": "2px",
		"line-height": "1.4",
		"overflow-wrap": "break-word",
	};

	if (MessageItem.MessageType == ClubCardMessageType.STARTTURNINFO) {
		ElementCreate({
			"tag": "div",
			style: {
				...commonStyles,
				"font-weight": "bold",
				"color": StartTurnTextColor,
				"text-align": "center"
			},
			children: ClubCardMessageGetHTML(MessageItem),
			parent: ElementWrap(turnDivName),
		});
	} else if (MessageItem.MessageType == ClubCardMessageType.ACTIONSEPARATOR) {
		ElementCreate({
			"tag": "div",
			style: {
				...commonStyles,
				"background-color": ActionSeparatorBackgound,
				"border-top": "1px solid white",
				"border-bottom": "1px solid white",
			},
			children: ClubCardMessageGetHTML(MessageItem),
			parent: ElementWrap(turnDivName),
		});
	} else if (MessageItem.MessageType === ClubCardMessageType.PLAYERSMESSAGE) {
		ElementCreate({
			"tag": "div",
			style: {
				...commonStyles,
				"background-color": ActionSeparatorBackgound,
				"border-top": "1px solid white",
				"border-bottom": "1px solid white",
			},
			children: ClubCardMessageGetHTML(MessageItem),
			parent: ElementWrap(turnDivName),
		});
	} else {
		ElementCreate({
			"tag": "div",
			style: {
				...commonStyles,
			},
			children: ClubCardMessageGetHTML(MessageItem),
			parent: ElementWrap(turnDivName),
		});
	}
}

/**
 * Renders the popup on the top of the game board
 * @param {number} Timestamp - The current timestamp from GameRun(), used for animation timing.
 * @returns {void} - Nothing
 */
function ClubCardRenderPopup(Timestamp) {

	// Exit on no popup
	if (ClubCardPopup == null) return;

	// In deck mode, we draw 10 deck buttons
	if (ClubCardPopup.Mode == "DECK") {
		DrawRect(548, 228, 604, 474, "White");
		DrawRect(550, 230, 600, 470, "Black");
		DrawTextWrap(TextGet("Your Decks"), 550, 235, 600, 61, "White");
		DrawRect(218, 228, 320, 234, "White");
		DrawRect(220, 230, 316, 230, "Black");
		DrawTextWrap(TextGet("Default Decks"), 230, 235, 292, 61, "White");
		DrawButton(230, 390, 296, 60, TextGet("Play Precon"), "White");
		ElementPositionFix("DefaultDecksDropdown", 36, 230, 310, 296, 60);
		for (let Deck = 0; Deck < 10; Deck++)
			DrawButton(560 + Math.floor(Deck / 5) * 300, 310 + (Deck % 5) * 80, 280, 60, ClubCardBuilderGetDeckName(Deck), "White");
		return;
	}

	// Draw the discard pile popup
	if (ClubCardPopup.Mode == "DISCARDPILE") {
		DrawRect(48, 18, 1604, 404, "White");
		DrawRect(50, 20, 1600, 400, "Black");
		DrawTextWrap("Opponent's Streets", 670, 40, 370, 26, "White");
		ClubCardRenderDiscardPile(ClubCardPlayer[1], 52, 52, 1516, 428);

		DrawRect(48, 578, 1604, 404, "White");
		DrawRect(50, 580, 1600, 400, "Black");
		DrawTextWrap("Your Streets", 670, 600, 370, 26, "White");
		ClubCardRenderDiscardPile(ClubCardPlayer[0], 52, 612, 1516, 428);
		if (ClubCardFocus != null) ClubCardRenderCard(ClubCardFocus, ClubCardFocusPosition.x, ClubCardFocusPosition.y, ClubCardFocusPosition.w);
		ClubCardUpdateCardAnimations(Timestamp);
		return;
	}

	// Draw the search popup
	if (ClubCardPopup.Mode == "SEARCH") {
		const pool = ClubCardPopup.CardsPool ?? [];
		DrawRect(18, 648, 1664, 334, "White");
		DrawRect(20, 650, 1660, 330, "Black");
		let PosX = Math.round(52 + (1516 / 2) - (pool.length * 1516 / 16));
		let IncX = Math.round(1516 / 8);
		if (PosX < 52) {
			PosX = 52;
			IncX = Math.round(1516 / pool.length);
		}
		for (let C of pool) {
			ClubCardRenderCard(C, PosX + 5, 620 + 5 + (428 * 0.1), (1516 / 10) - 5, null, "Popup");
			PosX = PosX + IncX;
		}
		if (ClubCardFocus) {
			ClubCardRenderCard(ClubCardFocus, ClubCardFocusPosition.x, ClubCardFocusPosition.y, ClubCardFocusPosition.w);
			if (ClubCardCanSelectCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus))
				if (!ClubCardIsAnimationOn || ClubCardFocus.IsVisible)
					DrawButton(745, 505, 215, 50, TextGet("SelectCard"), "White");
		}
		ClubCardUpdateCardAnimations(Timestamp);
		return;
	}

	// Draw the tier selection popup
	if (ClubCardPopup.Mode == "TIERSELECTION"){
		DrawRect(213, 248, 1274, 504, "White");
		DrawRect(215, 250, 1270, 500, "Black");
		for (let i = 1; i <= 5; i++) {
			DrawImageResize("Screens/MiniGame/ClubCard/Frame/Member" + i + ".png", 235 + (i * 250) - 250, 270, 230, 460);
			DrawButton(255 + (i * 250) - 250, 475, 190, 50, TextGet("SelectTier").replace("NUMBER", i.toString()), "White");
		}
		return;
	}

	if (ClubCardPopup.Mode == "TifaActive") return;

	// Draw the info popup
	if (ClubCardPopup.Mode == "INFO") {
		// Pick a random low-tier card
		if (ClubCardRandomCardName == null || ClubCardRandomCardName == "") {
			ClubCardRandomCardName = (() => {
				let tier1 = ClubCardList.filter(card => card.RequiredLevel === undefined || card.RequiredLevel <= 1);
				return tier1[~~(Math.random() * tier1.length)].Name;
			})();
		}
		let DrawnRandomCard = ClubCardGetCopyCardByName(ClubCardRandomCardName);

		// Get the demo card object using its name
		let demoCard = ClubCardGetCopyCardByName(ClubCardRandomCardName);

		// Determine the color based on the tier of the demo card
		let demoCardTier = demoCard.RequiredLevel ?? 1;
		let buttonColor = ClubCardColor[demoCardTier];

		DrawRect(213, 248, 1274, 504, buttonColor);
		DrawRect(215, 250, 1270, 500, "Black");

		// Render the card at the right side
		ClubCardRenderCard(DrawnRandomCard, 1235, 250, 250, null, "Popup");

		// Draw in the buttons on the left side
		// - Fame Icon
		DrawButton(225, 346, 44, 44, "", buttonColor, "Screens/MiniGame/ClubCard/Info/Fame.png", "");
		if (DrawnRandomCard.FamePerTurn && DrawnRandomCard.FamePerTurn !== 0) {
			DrawTextFit(DrawnRandomCard.FamePerTurn.toString(), 247, 370, 22, "Black", "Black");
		}
		// - Money Icon
		DrawButton(225, 432, 44, 44, "", buttonColor, "Screens/MiniGame/ClubCard/Info/Money.png", "");
		if (DrawnRandomCard.MoneyPerTurn && DrawnRandomCard.MoneyPerTurn !== 0) {
			DrawTextFit(DrawnRandomCard.MoneyPerTurn.toString(), 247, 456, 22, "Black", "Black");
		}
		// - House/Tier Icon
		DrawButton(225, 520, 44, 44, "", buttonColor, "Screens/MiniGame/ClubCard/Info/Level.png", "");
		if (CommonIsNumeric(DrawnRandomCard.RequiredLevel)) {
			DrawTextFit(`${DrawnRandomCard.RequiredLevel}`, 247, 544, 22, "Black", "Black");
		}
		// - Liab Icon
		DrawButton(225, 608, 44, 44, "", buttonColor, "Screens/MiniGame/ClubCard/Info/Liability.png", "");
		// - Discard Icon
		DrawButton(225, 696, 44, 44, "", buttonColor, "Screens/MiniGame/ClubCard/Info/DiscardPile.png", "");

		// Tutorial text
		const leftMargin = 280; // Keep text moved to the right
		let startY = 300;

		// Create columns for more compact layout
		const col1X = leftMargin;        // Title column X position
		const col2X = leftMargin + 180;  // Description column X position
		const col3X = 750;               // Main title X position

		// Base Y positions
		const baseY = 346;  // Base Y aligned with first icon

		// Y positioning for each row - align with the button icons
		const rowY = [
			baseY + 25,         // Fame row
			baseY + 110,    // Money row
			baseY + 199,   // Building tiers row
			baseY + 287,   // Liabilities row
			baseY + 375    // Streets row
		];

		// Column widths
		const col1Width = 300;
		const col2Width = 800;
		const col3Width = 200;

		// Main title - Column 3
		ClubCardInfoDrawText(TextGet("InfoPopupTitle"), col3X, startY - 10, 32, buttonColor, "Black", col3Width);

		// Row 1: Fame
		ClubCardInfoDrawText(TextGet("InfoFameTitle")+":", col1X, rowY[0], 32, buttonColor, "Black", col1Width);
		let textY = rowY[0] - 25; // Adjust to vertically center with icon/title
		textY = ClubCardInfoDrawText(TextGet("InfoFameDescription1"), col2X, textY, 22, buttonColor, null, col2Width);
		textY = ClubCardInfoDrawText(TextGet("InfoFameDescription2"), col2X, textY, 22, buttonColor, null, col2Width);
		ClubCardInfoDrawText(TextGet("InfoFameDescription3"), col2X, textY, 22, buttonColor, null, col2Width);

		// Row 2: Money
		ClubCardInfoDrawText(TextGet("InfoMoneyTitle")+":", col1X, rowY[1], 32, buttonColor, "Black", col1Width);
		textY = rowY[1] - 10; // Adjust for vertical centering
		textY = ClubCardInfoDrawText(TextGet("InfoMoneyDescription1"), col2X, textY, 22, buttonColor, null, col2Width);
		ClubCardInfoDrawText(TextGet("InfoMoneyDescription2"), col2X, textY, 22, buttonColor, null, col2Width);

		// Row 3: Building tiers
		ClubCardInfoDrawText(TextGet("InfoBuildingTiersTitle")+":", col1X, rowY[2], 32, buttonColor, "Black", col1Width);
		textY = rowY[2] - 25; // Adjust for vertical centering
		textY = ClubCardInfoDrawText(TextGet("InfoBuildingTiersDescription1"), col2X, textY, 22, buttonColor, null, col2Width);
		textY =ClubCardInfoDrawText(TextGet("InfoBuildingTiersDescription2"), col2X, textY, 22, buttonColor, null, col2Width);
		ClubCardInfoDrawText(TextGet("InfoBuildingTiersDescription3"), col2X, textY, 22, buttonColor, null, col2Width);

		// Row 4: Liabilities
		ClubCardInfoDrawText(TextGet("InfoLiabilitiesTitle")+":", col1X, rowY[3], 32, buttonColor, "Black", col1Width);
		textY = rowY[3]; // Adjust for vertical centering
		ClubCardInfoDrawText(TextGet("InfoLiabilitiesDescription1"), col2X, textY, 22, buttonColor, null, col2Width);

		// Row 5: Streets
		ClubCardInfoDrawText(TextGet("InfoStreetsTitle")+":", col1X, rowY[4], 32, buttonColor, "Black", col1Width);
		textY = rowY[4]; // Adjust for vertical centering
		ClubCardInfoDrawText(TextGet("InfoStreetsDescription1"), col2X, textY, 22, buttonColor, null, col2Width);

		return;
	}


	// Draw the yes/no/text popups
	DrawRect(648, 348, 404, 304, "White");
	DrawRect(650, 350, 400, 300, "Black");
	DrawTextWrap(ClubCardPopup.Text ?? "", 670, 360, 370, 210, "White");
	if (ClubCardPopup.Mode == "TEXT") DrawButton(700, 570, 300, 60, ClubCardPopup.Button1 ?? "", "White");
	if (ClubCardPopup.Mode == "YESNO") {
		DrawButton(660, 570, 180, 60, ClubCardPopup.Button1 ?? "", "White");
		DrawButton(860, 570, 180, 60, ClubCardPopup.Button2 ?? "", "White");
	}

}

/**
 * Draws a text element with a specified font size on the canvas, wrapping within a max width
 * Always aligns text to the left starting from the X coordinate
 * @param {string} Text - Text to draw
 * @param {number} X - X position (left edge of text)
 * @param {number} Y - Y position
 * @param {number} Size - Font size (e.g., 24 for normal, 36 for titles)
 * @param {string} Color - Text color
 * @param {string|null} [BackColor] - Optional background color for shadow effect
 * @param {number} [MaxWidth] - Optional maximum width before wrapping
 * @returns {number} - Returns new Y position after drawing
 */
function ClubCardInfoDrawText(Text, X, Y, Size, Color, BackColor, MaxWidth = 1200) {
	if (!Text) return Y;
	const oldFont = MainCanvas.font;

	// Check if this is a heading (typically larger font size)
	const isHeading = Size >= 26;

	// Set canvas text alignment to left (this ensures text always starts at X position)
	const oldAlign = MainCanvas.textAlign;
	MainCanvas.textAlign = "left";

	// Apply font styling
	if (isHeading) {
		MainCanvas.font = "bold " + Size + "px Arial";
	} else {
		MainCanvas.font = Size + "px Arial";
	}

	// For very short text, no need for word wrapping
	if (MainCanvas.measureText(Text).width <= MaxWidth) {
		// Add a subtle shadow effect for headings
		if (isHeading && BackColor) {
			MainCanvas.fillStyle = BackColor;
			MainCanvas.fillText(Text, X + 2, Y + 2);
		} else if (BackColor != null && BackColor !== "") {
			MainCanvas.fillStyle = BackColor;
			MainCanvas.fillText(Text, X + 1, Y + 1);
		}

		MainCanvas.fillStyle = Color;
		MainCanvas.fillText(Text, X, Y);
		MainCanvas.font = oldFont;
		MainCanvas.textAlign = oldAlign;
		return Y + Size * 1.2;
	}

	// Standard word wrapping for longer text
	const words = Text.split(' ');
	let line = "";
	let lineHeight = Size * 1.2;

	for (let n = 0; n < words.length; n++) {
		let testLine = line + words[n] + " ";
		let metrics = MainCanvas.measureText(testLine);
		let testWidth = metrics.width;
		if (testWidth > MaxWidth && n > 0) {
			// Draw current line
			if (BackColor != null && BackColor !== "") {
				MainCanvas.fillStyle = BackColor;
				MainCanvas.fillText(line, X + 1, Y + 1);
			}
			MainCanvas.fillStyle = Color;
			MainCanvas.fillText(line, X, Y);
			line = words[n] + " ";
			Y += lineHeight;
		} else {
			line = testLine;
		}
	}

	// Draw last line
	if (line !== "") {
		if (BackColor != null && BackColor !== "") {
			MainCanvas.fillStyle = BackColor;
			MainCanvas.fillText(line, X + 1, Y + 1);
		}
		MainCanvas.fillStyle = Color;
		MainCanvas.fillText(line, X, Y);
		Y += lineHeight;
	}

	// Restore original settings
	MainCanvas.font = oldFont;
	MainCanvas.textAlign = oldAlign;
	return Y;
}

/**
 * Runs the club card game, draws all the controls
 * @param {number} Timestamp - The current timestamp from GameRun(), used for animation timing.
 * @returns {void} - Nothing
 */
function ClubCardRun(Timestamp) {
	ClubCardHover = null;
	ClubCardLoadCaption();
	ClubCardRenderBoard(ClubCardPlayer[0], 0, 500, 1700, 500, false);
	ClubCardRenderBoard(ClubCardPlayer[1], 0, 0, 1700, 500, true);
	DrawRect(0, 499, 1700, 2, "White");
	ClubCardRenderHand(ClubCardPlayer[0], 0, 800, 1700, 300);
	ClubCardRenderHand(ClubCardPlayer[1], 0, -200, 1700, 300);
	ClubCardUpdateCardAnimations(Timestamp);
	ClubCardRenderPanel();

	ClubCardBackground = Player.Game.ClubCard?.Background ? Player.Game.ClubCard.Background : "ClubCardPlayBoard1";
	const isLvlUpButtonRender = ClubCardPopup == null &&
		(ClubCardPlayer[ClubCardTurnIndex].Control == "Player") &&
		(ClubCardPlayer[ClubCardTurnIndex].Level < ClubCardLevelCost.length - 1) &&
		(ClubCardPlayer[ClubCardTurnIndex].Money >= ClubCardCalculateLevelCost(ClubCardPlayer[ClubCardTurnIndex])) &&
		// Homeroom stops players leveling up
		!(ClubCardEventNameIsInEvents(ClubCardPlayer[0], "Homeroom") || ClubCardEventNameIsInEvents(ClubCardPlayer[1], "Homeroom"));

	if (isLvlUpButtonRender) {
		const buttonText = TextGet("UpgradeToLevel" + (ClubCardPlayer[ClubCardTurnIndex].Level + 1).toString());
		DrawButton(
			1356,
			388,
			340,
			60,
			buttonText.replace("MONEYAMOUNT", ClubCardCalculateLevelCost(ClubCardPlayer[ClubCardTurnIndex]).toString()),
			"White"
		);
	}

	ClubCardRenderPopup(Timestamp);
}

//#############################################
//#region Click Handlers
/**
 * Handles clicks during the club card game
 * @returns {void} - Nothing
 */
function ClubCardClick() {
	// In popup mode, no other clicks can be done but the popup buttons
	if (ClubCardPopup != null) {
		if ((ClubCardPopup.Mode == "TEXT") && MouseIn(700, 570, 300, 60) && ClubCardPopup.Function1) {
			CommonDynamicFunction(ClubCardPopup.Function1);
			return;
		}
		if ((ClubCardPopup.Mode == "YESNO") && MouseIn(660, 570, 180, 60) && ClubCardPopup.Function1) {
			CommonDynamicFunction(ClubCardPopup.Function1);
			return;
		}
		if ((ClubCardPopup.Mode == "YESNO") && MouseIn(860, 570, 180, 60) && ClubCardPopup.Function2) {
			CommonDynamicFunction(ClubCardPopup.Function2);
			return;
		}
		if (ClubCardPopup.Mode == "DISCARDPILE" && ClubCardPending == null) {
			//Focus Card reset handler in ClubCardPopup.Mode == “DISCARDPILE”
			if (MouseIn(720, 245, 260, 510) && ClubCardFocus != null) return ClubCardClickResetFocusCard();
			//Close “DISCARDPILE” popup - here
			if (MouseIn(1805, 805, 90, 90)) {
				return ClubCardFocus != null
					? ClubCardClickResetFocusCard(ClubCardDestroyPopup)
					: ClubCardDestroyPopup();
			}
			//Set Focus card in ClubCardPopup.Mode == “DISCARDPILE”
			if(ClubCardHover && (ClubCardHover.Location == "OpponentDiscardPile" || ClubCardHover.Location == "PlayerDiscardPile"))
				return ClubCardClickSetFocusCard();
		}
		if (ClubCardPopup.Mode == "SEARCH") {
			if (MouseIn(1805, 805, 90, 90)) {
				if(ClubCardFocus != null) ClubCardClickResetFocusCard(ClubCardDestroyPopup);
				else ClubCardDestroyPopup();
				ClubCardClickResetPendingCard();
				return;
			}
			if (ClubCardHover && ClubCardHover.Location == "Popup") {
				ClubCardClickSetFocusCard();
				return;
			}
			if (ClubCardPending && MouseIn(745, 505, 215, 50) && ClubCardFocus && ClubCardCanSelectCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus)) {
				if (ClubCardPending.Name == "Clare") {
					return (ClubCardClareSelection(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus), ClubCardDestroyPopup());
				} else {
					return (ClubCardDestroyPopup(), ClubCardClickPlayCard(true));
				}
			}
			if (MouseIn(720, 245, 260, 510) && ClubCardFocus) {
				ClubCardClickResetFocusCard();
				return;
			}
		}
		if (ClubCardPopup.Mode == "TIERSELECTION") {
			if (MouseIn(1805, 805, 90, 90)) {
				ClubCardClickResetFocusCard();
				ClubCardDestroyPopup();
				return;
			}
			for (let i = 1; i <= 5; i++) {
				if (MouseIn(255 + (i * 250) - 250, 475, 190, 50)) {
					ClubCardTierSelection = i;
					ClubCardDestroyPopup();
					ClubCardClickPlayCard(false);
					return;
				}
			}
		}
		if (ClubCardPopup.Mode == "INFO") {
			if (MouseIn(1705, 805, 90, 90)) {
				ClubCardRandomCardName = (() => {
					let tier1 = ClubCardList.filter(card => card.RequiredLevel === undefined || card.RequiredLevel <= 1);
					return tier1[~~(Math.random() * tier1.length)].Name;
				})();
				return;
			}
			if (MouseIn(1805, 805, 90, 90)) {
				ClubCardRandomCardName = (() => {
					let tier1 = ClubCardList.filter(card => card.RequiredLevel == 2);
					return tier1[~~(Math.random() * tier1.length)].Name;
				})();
				return;
			}
			if (MouseIn(1905, 805, 90, 90)) {
				ClubCardDestroyPopup();
				return;
			}
			if (MouseIn(1705, 905, 90, 90)) {
				ClubCardRandomCardName = (() => {
					let tier1 = ClubCardList.filter(card => card.RequiredLevel == 3);
					return tier1[~~(Math.random() * tier1.length)].Name;
				})();
				return;
			}
			if (MouseIn(1805, 905, 90, 90)) {
				ClubCardRandomCardName = (() => {
					let tier1 = ClubCardList.filter(card => card.RequiredLevel == 4);
					return tier1[~~(Math.random() * tier1.length)].Name;
				})();
				return;
			}
			if (MouseIn(1905, 905, 90, 90)) {
				ClubCardRandomCardName = (() => {
					let tier1 = ClubCardList.filter(card => card.RequiredLevel == 5);
					return tier1[~~(Math.random() * tier1.length)].Name;
				})();
				return;
			}
		}
		if (ClubCardPopup?.Mode == "TifaActive") {
			if (MouseIn(745, 475, 215, 50)) {
				ClubCardTifaSelection(ClubCardPlayer[ClubCardTurnIndex], "Draw");
				return;
			}
			if (MouseIn(745, 535, 215, 50)) {
				ClubCardTifaSelection(ClubCardPlayer[ClubCardTurnIndex], "Streets");
				return;
			}
			return;
		}
		if (ClubCardPopup.Mode == "DECK") {
			if (MouseIn(242, 390, 296, 60)) {
				ClubCardUsePrecon = true;
				ClubCardLoadDeckNumber(-1);
			}
			for (let Deck = 0; Deck < 10; Deck++) {
				if (MouseIn(560 + Math.floor(Deck / 5) * 300, 310 + (Deck % 5) * 80, 280, 60))
					ClubCardLoadDeckNumber(Deck);
			}
		}
		return;
	}

	// If there's a pending card with a prerequisite, there are extra buttons
	if (ClubCardPending && ClubCardFocus && MouseIn(745, 505, 215, 50) && ClubCardCanSelectCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus))
		return ClubCardClickPlayCard(true);
	if ((ClubCardPending != null) && MouseIn(1805, 805, 90, 90))
		return ClubCardClickResetPendingCard();

	// Can always concede/exit
	if (MouseIn(1905, 905, 90, 90) && !ClubCardPending)
		return ClubCardCreatePopup("YESNO", { Text: TextGet(ClubCardIsPlaying() ? "ConfirmConcede" : "ConfirmExit"), Button1: TextGet("Yes"), Button2: TextGet("No"), Function1: "ClubCardConcede()", Function2: "ClubCardDestroyPopup()" });

	// If we are waiting for deck selection
	if ((ClubCardPlayer[0].FullDeck == null) || (ClubCardPlayer[0].FullDeck.length == 0) || (ClubCardPlayer[1].FullDeck == null) || (ClubCardPlayer[1].FullDeck.length == 0)) return;

	// ==============================
	//  Runs the basic game buttons
	// ==============================
	//Play Card
	if (MouseIn(745, 505, 215, 50) && !ClubCardPending && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player") && ClubCardFocus && ClubCardCanPlayCard(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus))
		return ClubCardClickPlayCard(false);
	// Active card effect
	if (MouseIn(745, 505, 215, 50) && !ClubCardPending && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player") && ClubCardFocus && ClubCardCanActiveEffect(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus))
		return ClubCardActiveEffect(ClubCardPlayer[ClubCardTurnIndex], ClubCardFocus);
	// Click on an empty space to reset the focus of the selected Card.
	if (MouseIn(720, 245, 260, 510) && ClubCardFocus != null)
		if (ClubCardIsAnimationOn === false || ClubCardFocus.AnimationState != "moving")
			return ClubCardClickResetFocusCard();
	// Draw card and end turn
	if (MouseIn(1705, 805, 90, 190) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player") && !ClubCardPending)
		return ClubCardStartTurn(ClubCardStartTurnType.DRAWENDTURN);
	// Open Bankrupt window and bind function close and bankrupt in yes and no
	if (MouseIn(1805, 905, 90, 90) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player") && !ClubCardPending)
		return ClubCardCreatePopup("YESNO", { Text: TextGet("ConfirmBankrupt"), Button1: TextGet("Yes"), Button2: TextGet("No"), Function1: "ClubCardStartTurn()", Function2: "ClubCardDestroyPopup()" });
	// Upgrade lvl Club
	if (MouseIn(1356, 388, 340, 60) && (ClubCardPlayer[ClubCardTurnIndex].Control == "Player")
		&& (ClubCardPlayer[ClubCardTurnIndex].Level < ClubCardLevelCost.length - 1)
		&& (ClubCardPlayer[ClubCardTurnIndex].Money >= ClubCardCalculateLevelCost(ClubCardPlayer[ClubCardTurnIndex])))
		return ClubCardStartTurn(ClubCardStartTurnType.UPGRADELEVEL);

	//Open DISCARDPILE Popup
	if (MouseIn(1805, 805, 90, 90)) {
		const openDiscardPilePopup = () => ClubCardCreatePopup("DISCARDPILE", { Button1: TextGet("Close"), Function1: "ClubCardDestroyPopup()" });
		if (ClubCardIsAnimationOn && ClubCardFocus && ClubCardFocus.AnimationState !== "moving")
			return ClubCardClickResetFocusCard(openDiscardPilePopup);
		else
			return (ClubCardFocus = null, openDiscardPilePopup());
	}

	if (MouseIn(1905, 805, 90, 90)) return ClubCardCreatePopup("INFO");

	// Sets the focus card if nothing else was clicked
	ClubCardClickSetFocusCard();
}
/**
 * Plays the selected card
 * @param {boolean} isPending - Whether a card requiring a target has already been selected and a second card is being selected.
 */
function ClubCardClickPlayCard(isPending) {
	if (isPending) {
		//PlayCard with Pending Card
		if (ClubCardIsAnimationOn) {
			//### Play Select card when Pending Card is Active
			const originalCard = ClubCardGetOriginalCardByUniqueID(ClubCardFocus?.UniqueID ?? "");
			if (originalCard) {
				originalCard.IsVisible = true;
				originalCard.AnimationState = "idle";
			}
			//###
		}
		if (ClubCardFocus)
			ClubCardSelectCard(ClubCardFocus);
	} else {
		//Just PlayCard
		ClubCardStartTurn(ClubCardStartTurnType.PLAYCARD);
	}
}
/**
 * Sets the focus card if nothing else was clicked
 * @returns {void}
 */
function ClubCardClickSetFocusCard() {
	if (!ClubCardHover) return;

	if (ClubCardPending?.UniqueID === ClubCardHover.UniqueID ||
		ClubCardFocus?.UniqueID === ClubCardHover.UniqueID) return;


	if (ClubCardIsAnimationOn) {
		const oldFocusCard = ClubCardFocus ? { ...ClubCardFocus } : null;
		const newFocusCard = { ...ClubCardHover };
		if (ClubCardHover.AnimationState === "moving") return;
		if (oldFocusCard && oldFocusCard.AnimationState !== "idle") return;

		if (oldFocusCard)
			ClubCardReturnCardFromPreview(oldFocusCard);

		ClubCardMoveCardToPreview(newFocusCard);
		ClubCardFocus = newFocusCard;
	} else ClubCardFocus = { ...ClubCardHover };
}
/**
 * Click on an empty space to reset the focus of the selected Card.
 * @param {((card: ClubCard) => void)|null} [onComplete] - Function called after the animation completes.
 */
function ClubCardClickResetFocusCard(onComplete = null) {
	if (ClubCardFocus) {
		if (ClubCardIsAnimationOn && ClubCardFocus.AnimationState !== "moving") {
			ClubCardReturnCardFromPreview({ ...ClubCardFocus }, null, onComplete);
		} else {
			onComplete?.(ClubCardFocus);
		}
	}

	ClubCardFocus = null;
}
/**
 * Cancels the current Pending and Focus cards.
 */
function ClubCardClickResetPendingCard() {
	if (ClubCardIsAnimationOn) {
		if (ClubCardFocus) {
			if (ClubCardFocus.AnimationState != "idle") return;
			const focusCard = { ...ClubCardFocus };
			ClubCardReturnCardFromPreview(focusCard);
		}

		if (ClubCardPending) {
			const pendingCard = { ...ClubCardPending };
			ClubCardReturnCardFromPending(pendingCard);
		}
	}
	ClubCardFocus = null;
	ClubCardPending = null;
	// If there is a card currently in focus, return it to the hand
}
//#endregion
//#############################################

/**
 * Keyboard event handler for the Club Card game chat
 * @type {KeyboardEventListener}
 */
function ClubCardKeyDown(event) {
	if (document.activeElement?.id !== "CCChat") return false;

	if (CommonKey.IsPressed(event, "Enter")) {
		let Value = ElementValue("CCChat").trim();
		if (Value != "") {
			ClubCardMessageAdd(ClubCardMessageType.PLAYERSMESSAGE, "PlayerMessage", { "PLAYERNAME": CharacterNickname(Player), "MSG": Value });
			ElementValue("CCChat", "");
			return true;
		}
	}
	return false;
}
