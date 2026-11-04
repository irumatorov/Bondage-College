"use strict";
/** @type {Platform.Dialog | null} */
var PlatformDialog = null;
/** @type {undefined | string} */
var PlatformDialogBackground = undefined;
/** @type {string | null} */
var PlatformDialogText = null;
/** @type {Platform.DialogLine['Answer'] | null} */
var PlatformDialogAnswer = null;
var PlatformDialogAnswerPosition = 0;
var PlatformDialogAnswerLength = 0;
/** @type {string | null} */
var PlatformDialogReply = null;
/** @type {string | null} */
var PlatformDialogGoto = null;
/** @type {Platform.DialogLineCharacter[]} */
var PlatformDialogCharacterDisplay = [];
var PlatformDialogPosition = 0;
/** @type {Platform.DialogCharacter[] | null} */
var PlatformDialogCharacter = null;
/** @type {HTMLAudioElement | null} */
var PlatformDialogAudio = null;
var PlatformDialogAudioStyle = ["", "angry", "calm", "chat", "cheerful", "friendly", "sad", "serious", "shouting", "terrified", "unfriendly", "whispering"];
/** @type {Platform.DialogCharacter[]} */
var PlatformDialogCharacterTemplate = [
	{
		Name: "Melody",
		Color: "#fe92cf",
		Love: 0,
		Domination: 0,
	},
	{
		Name: "Olivia",
		Color: "#ffffff",
		IdlePose: ["Oracle"],
		Love: 10,
		Domination: 0
	},
	{
		Name: "Isabella",
		Color: "#ffD700",
		Love: 5,
		Domination: -10
	},
	{
		Name: "Camille",
		Color: "#C0C0C0",
		Love: -5,
		Domination: -5
	},
	{
		Name: "Edlaran",
		Color: "#add9a0",
		IdlePose: ["Archer"],
		Love: 0,
		Domination: 0
	},
	{
		Name: "Yuna",
		NickName: "Senior Maid",
		Color: "#efb5ff",
		Love: 0,
		Domination: 0,
	},
	{
		Name: "Hazel",
		NickName: "Junior Maid",
		Color: "#e1dd57",
		Love: 0,
		Domination: 0,
	},
	{
		Name: "Lucy",
		NickName: "Guard",
		Color: "#6fd9d3",
		Love: 0,
		Domination: 0,
	},
	{
		Name: "Vera",
		NickName: "Forest Bandit",
		Color: "#e38d00",
		Love: 0,
		Domination: 0,
	},
	{
		Name: "Lyn",
		Color: "#c85c5c",
		Love: -5,
		Domination: -5
	},
];

/** @type {Platform.Dialog[]} */
var PlatformDialogData = [
	{
		Name: "IntroMelody",
		Music: "MelodyRoom",
		Dialog: [
			{
				Text: "(Click or hit the spacebar to continue.)",
				Background: "MaidBed",
				Character: [
					{
						Name: "Melody",
						Status: "Underwear",
						Pose: "Sleep",
						X: 0,
						Y: 200
					}
				]
			},
			{ Text: "Zzzzzzzzzzz...", },
			{ Text: "Zzzzzzz...", },
			{ Text: "Zzz..." },
			{
				Character: [
					{
						Name: "Melody",
						Status: "Underwear",
						Pose: "Lay",
						X: 0,
						Y: -150
					}
				]
			},
			{ Text: "Is it morning already?", Audio: "10" },
			{ Text: "It's a big day today, there's so much to do.  Let's review...", Audio: "20" },
			{
				Background: "Black",
				Text: "First thing first, I need to retrieve Lady Olivia collar's key and bathe her.",
				Audio: "30",
				Character: [{ Name: "Olivia", Status: "Kimono", Pose: "Idle" }]
			},
			{
				Text: "Secondly, I have to clean the dungeon restraints for Countess Isabella.",
				Audio: "40",
				Character: [{ Name: "Isabella", Status: "Winter", Pose: "Idle" }]
			},
			{
				Text: "And finally, I need to serve dinner for Marchioness Camille visit.",
				Audio: "50",
				Character: [{ Name: "Camille", Status: "Armor", Pose: "Idle" }]
			},
			{
				Text: "Time to get dressed!",
				Audio: "60",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "Idle" }]
			},
			{
				Text: "Lady Olivia needs me first.  Let's go find her.",
				Audio: "70",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Olivia", Status: "Kimono", Pose: "Idle" }
				]
			},
		]
	},

	{
		Name: "JealousMaid",
		Music: "CastleHall",
		Exit : function () { PlatformEventSet("JealousMaid"); },
		Dialog: [
			{
				Background: "CastleHall",
				Character: [{ Name: "Hazel", Status: "Maid", Pose: "Angry" }]
			},
			{ Text: "(As you enter the hallway, you get intercepted by another maid.)" },
			{
				Character: [
					{ Name: "Hazel", Status: "Maid", Pose: "Angry" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
				Text: "Well, well, well.  Here comes little Melody the perfect servant.", Audio: "10",
				Answer: [
					{ Text: "What do you want?", Reply: "You're not very bright, aren't you?", Audio: "11" },
					{ Text: "And here comes the laziest maid of the year.", Reply: "Shut up Melody, you're not funny.", Audio: "12" },
					{ Text: "It's great to see you sister.", Reply: "(She shakes her head no.)  Don't call me sister today.", Audio: "13" },
					{ Text: "(Ignore her and move forward.)", Reply: "You think you can snob me?  (She raises her fists.)", Audio: "14", Goto: "End" }
				]
			},
			{ Text: "The maid staff has been talking about you.", Audio: "20" },
			{ Text: "We think you're getting too friendly with Lady Olivia.", Audio: "30" },
			{ Text: "There's no reason why Countess Isabella gave you that chore.", Audio: "40" },
			{ Text: "Today, I will unlock and bathe her, you can go back to bed.", Audio: "50" },
			{
				Text: "Stay in your room or you will get hurt.", Audio: "60",
				Answer: [
					{ Text: "Sorry, I have work to do.", Reply: "Fine, I'll make sure you cannot work then.  (She raises her fists.)", Audio: "61" },
					{ Text: "Please, can we negotiate a deal?", Reply: "There won't be any deal, only bruises.  (She raises her fists.)", Audio: "62" },
					{ Text: "Over my dead body.", Reply: "I won't kill you, but you'll be in pain.  (She raises her fists.)", Audio: "63" },
					{ Text: "(Try to run past her.)", Reply: "You're not going anywhere!  (She raises her fists.)", Audio: "64" }
				]
			},
			{ ID: "End", Text: "(She rushes toward you.  You'll need to fight or dodge her.)" }
		]
	},

	{
		Name: "IntroIsabellaBeforeCollarKey",
		Music: "IsabellaRoom",
		Exit : function () { PlatformEventSet("OliviaCollarKey"); PlatformChar[1].Dialog = "IntroIsabellaAfterCollarKey"; },
		Dialog: [
			{
				Background: "Balcony",
				Character: [{ Name: "Isabella", Status: "Winter", Animation: "Idle" }]
			},
			{ Text: "You finally made it Melody.", Audio: "10" },
			{
				Text: "Maids must be clean.  Why are you sweaty?",
				Audio: "20",
				Answer: [
					{ Text: "I had a scuffle with other maids.", Reply: "I understand.  They envy your position.", Audio: "21" },
					{ Text: "I crushed some jealous maids.", Reply: "Very good, you have a sacred duty to do.", Audio: "22", Domination: 2 },
					{ Text: "Other maids were mean with me Countess.", Reply: "Get stronger, don't let your sisters step on your toes.", Audio: "23", Domination: -2 }
				]
			},
			{
				Text: "Do you know why I gave you the unlocking chore?",
				Audio: "30",
				Answer: [
					{ Text: "I don't know.  Please explain.", Reply: "Because you're strong, you're a protector for Olivia.", Audio: "31" },
					{ Text: "Because I have a pretty butt.", Reply: "Don't try to be funny, you're better than that.", Audio: "32", Love: -2 },
					{ Text: "Because Lady Olivia means the world to me.", Reply: "Absolutely.  You're her knight, her protector.", Audio: "33", Love: 2 }
				]
			},
			{ Text: "Since we lost the war and so many of our men died, we need tough women like you.", Audio: "40" },
			{ Text: "There is strength in you Melody.  I've known this since I found you as a baby in that orphanage.", Audio: "50" },
			{
				Text: "Do you feel worthy of that collar key?",
				Audio: "60",
				Answer: [
					{ Text: "It's an honor to carry that key.", Reply: "(She nods slowly.)  Don't let anyone steal that honor.", Audio: "61", Love: 1, Domination: 1 },
					{ Text: "I don't know.  Maybe not.", Reply: "(She shakes her head from left to right.)  You talk better with your actions than your words.", Audio: "62", Love: -1, Domination: -1 },
					{ Text: "You should not lock your daughter.", Reply: "Someday you will understand and accept my rules.", Audio: "63", Love: -1, Domination: 1 },
					{ Text: "It's a heavy burden to carry.", Reply: "That's true.  Have more faith in yourself girl.", Audio: "64", Love: 1, Domination: -1 }
				]
			},
			{ Text: "Enough chit-chat.  Olivia is waiting for you.", Audio: "70" },
			{ Text: "Go unlock my daughter.  (She gives you the collar key and points toward the hallway.)", Audio: "80" },
		]
	},

	{
		Name: "IntroIsabellaAfterCollarKey",
		Music: "IsabellaRoom",
		Dialog: [
			{
				Background: "Balcony",
				Character: [{ Name: "Isabella", Status: "Winter", Animation: "Idle" }]
			},
			{ Text: "Why are you still here?  Go unlock my daughter.  (She points toward the hallway.)", Audio: "10" },
		]
	},

	{
		Name: "IntroOliviaBeforeCollarKey",
		Music: "OliviaRoom",
		Dialog: [
			{
				Background: "BedroomOlivia",
				Character: [{ Name: "Olivia", Status: "Chained", Animation: "Idle" }]
			},
			{ Text: "I'm happy to see you, Melody.", Audio: "10" },
			{
				Text: "Do you have the key for my collar?",
				Audio: "20",
				Answer: [
					{ Text: "Where is that key?", Reply: "(She giggles.)  You know that Mother sleeps with it.", Audio: "21" },
					{ Text: "No, I'll go get it.", Reply: "(She nods.)  Thanks!  Send my good words to Mother when you see her.", Audio: "22" },
					{ Text: "Why are you chained?", Reply: "(She sighs.)  I know that Mother's rules aren't easy to understand.  She keeps me chained to the bed so I don't run away or get kidnapped.", Audio: "23" },
				]
			},
			{ Text: "Countess Isabella is usually on the balcony around that time.", Audio: "30" },
			{ Text: "Go upstairs and head east to find the balcony.", Audio: "40" },
			{ Text: "Please get the key, so we can start the day.", Audio: "50" }
		]
	},

	{
		Name: "IntroOliviaAfterCollarKey",
		Music: "OliviaRoom",
		Exit : function () { PlatformEventSet("OliviaUnchain"); PlatformLoadRoom(); },
		Dialog: [
			{
				Background: "BedroomOlivia",
				Character: [{ Name: "Olivia", Status: "Chained", Animation: "Idle" }]
			},
			{ Text: "Melody!  Do you have the key?", Audio: "10" },
			{
				Text: "Yes, your Mother sends her salutations.", Audio: "20",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "Idle" }]
			},
			{
				Text: "Great, we have a big day ahead.", Audio: "30",
				Character: [{ Name: "Olivia", Status: "Chained", Animation: "Idle" }]
			},
			{
				Text: "(She tugs on her neck chain.)",
				Answer: [
					{ Text: "Why are you chained?", Reply: "(She sighs.)  Mother's rules aren't easy to understand.  She keeps me chained so I don't run away or get kidnapped.", Audio: "41" },
					{ Text: "I like to see you in chains.", Reply: "(She bows her head.)  Mother's rules are very strict, but they are for my own good.  I'm glad you like them.", Audio: "42", Domination: 2 },
					{ Text: "An important Lady like you should not be chained.", Reply: "(She nods.)  You're sweet.  Mother's rules are strict but logical.  She's very protective.", Audio: "43", Domination: -2 }
				]
			},
			{
				Text: "Can you unlock me?", Audio: "50",
				Answer: [
					{ Text: "Yes.  I will unlock you now.", Reply: "(You unlock her collar, and she smiles.)  Thank you very much.  I appreciate.", Audio: "51" },
					{ Text: "A hug before I unlock you?", Reply: "(You exchange a warm hug before you unlock her.)  You're the best maid around Melody.", Audio: "52", Love: 2 },
					{ Text: "You're spoiled.  (Unlock her.)", Reply: "(You unlock her collar, and she pouts.)  I know we come from two different realities.", Audio: "53", Love: -2 }
				]
			},
			{
				Audio: "60",
				Character: [
					{ Name: "Olivia", Status: "Babydoll", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "Thank you very much.", Audio: "70" },
			{
				Text: "I hope it's not painful or boring to come unlock me every morning.", Audio: "80",
				Answer: [
					{ Text: "Seeing you is the best part of my day.", Reply: "(She smiles at you.)  You're so sweet.", Audio: "81", Love: 1 },
					{ Text: "It's my duty and honor.", Reply: "(She nods slowly.)  I feel safe knowing you carry that duty.", Audio: "82", Domination: 1 },
					{ Text: "I hope I'll get a vacation someday.", Reply: "(She giggles.)  You can ask Mother, but I doubt it will work.", Audio: "83", Domination: -1 },
					{ Text: "This is kind of pointless.", Reply: "(She sighs.)  I'm sorry you feel that way.", Audio: "84", Love: -1 }
				]
			},
			{ Text: "It's time for my morning soap, please join me in the bathroom.", Audio: "90" },
			{
				Text: "(She leaves for her bathroom.)",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "Idle" }]
			}
		]
	},

	{
		Name: "OliviaBath",
		Music: "OliviaRoom",
		Exit : function () { PlatformEventSet("OliviaBath"); PlatformLoadRoom(); },
		Dialog: [
			{
				Background: "BathroomOlivia",
				Character: [{ Name: "Olivia", Status: "Chastity", Animation: "Idle" }]
			},
			{ Text: "A warm bath is the best way to start the day.", Audio: "10", },
			{
				Text: "Please help me to get inside.", Audio: "20",
				Answer: [
					{ Text: "It's my pleasure Lady Olivia.", Reply: "(You help her as she sinks in the bath with a huge smile.)  Such a good maid.", Audio: "21", Domination: -1, Love: 1 },
					{ Text: "You're not a child, get in by yourself.", Reply: "You're in a grumpy mood today.  (She goes in the bath.)", Audio: "22", Domination: 1, Love: -1 },
					{ Text: "(Help her to get in the bath.)", Reply: "(You help her as she sinks in the bath slowly.)" }
				]
			},
			{
				Background: "Black",
				Character: [{ Name: "Olivia", Status: "Chastity", Pose: "Bathing", X: 0 }]
			},
			{ Text: "(She slides down as her chastity belt makes a loud metallic sound from scraping the bath.)", Audio: "CommonChain" },
			{
				Text: "Sorry for that noise.  The belt scraped the bath.", Audio: "40",
				Answer: [
					{ Text: "That belt is cruel but necessary.", Reply: "Yes, cruel and necessary indeed.", Audio: "41", Domination: 1 },
					{ Text: "When will you get out?", Reply: "Not until I get married next year.", Audio: "42" },
					{ Text: "Aren't you afraid it will get rusted?", Reply: "Don't worry, that belt is indestructible.", Audio: "43", Domination: -1 }
				]
			},
			{
				Text: "Would you like to hear why I must wear it?  If you already know that story, we can talk about something else.", Audio: "50",
				Answer: [
					{ Text: "Tell me about it.", Reply: "Very well, I'll try not to get lost in the details.", Audio: "51" },
					{ Text: "I already know.", Reply: "Yes, we already spoke about that belt a few times before.", Audio: "52", Goto: "SkipBelt" }
				]
			},
			{ Text: "All women in my family must wear a chastity belt, from puberty until marriage.  My mother Isabella, my sister Camille, my aunts, my grandmother, everyone.", Audio: "B10" },
			{ Text: "It's part of an ancient tradition in House Alberus.  It's almost religious.  The belts cannot be destroyed and never rust.", Audio: "B20" },
			{ Text: "Rumors says we have special powers, and this is a tool to protect us.  They say we are Oracles.", Audio: "B30" },
			{ Text: "I'm not sure if it's true.  Mother seems to believe it, but I've never seen her do any magic trick.", Audio: "B40" },
			{ Text: "She told me that she will explain everything on my wedding day.  I wish she wasn't so mysterious.", Audio: "B50" },
			{ Text: "There's only one key for that belt.  It belongs to Duke Sunesk of Slandia, my future husband.", Audio: "B60" },
			{ Text: "When we lost the war against Slandia, the key was one of the tributes we had to offer.", Audio: "B70" },
			{ Text: "I'm getting married next year.  I hope the Duke will be a good spouse.  I'm nervous since I've never met him before.", Audio: "B80" },
			{ Text: "Enough rambling.  I don't have the right to be sad or sour.  I have a privileged life.", Audio: "B90" },

			{
				ID: "SkipBelt",
				Text: "Please start scrubbing Melody.", Audio: "60",
				Answer: [
					{ Text: "(Wash her delicately.)", Reply: "(You wash her delicately as she relaxes.)  Put a little more effort my friend.", Audio: "61", Domination: -1 },
					{ Text: "(Wash her normally.)", Reply: "(You wash her as she smiles.)  I would be miserable without my bath.", Audio: "62" },
					{ Text: "(Wash her slowly and passionately.)", Reply: "(She moans as you wash her lovingly.)  Oooooh, Melody.", Audio: "63", Love: 2 },
					{ Text: "(Wash her vigorously.)", Reply: "(She gets rigid as you wash her with strength.)  Wow!  I know I'll be clean.", Audio: "64", Domination: 1 }
				]
			},

			{ Text: "I've heard you will serve dinner tonight when my sister visits.", Audio: "70" },
			{
				Text: "I haven't seen Camille for two years.  Since her wedding with Marquess Alister.", Audio: "80",
				Answer: [
					{ Text: "I've always been scared of her.", Reply: "Don't worry, she yells a lot, but she won't hurt you.", Audio: "81", Domination: -1 },
					{ Text: "Do you miss your sister?", Reply: "I do, even if I don't know her that much.  We've never been close.", Audio: "82" },
					{ Text: "Camille is a bitch.", Reply: "Please don't say that.  She's my only sister.", Audio: "83", Love: -1, Domination: 1 },
					{ Text: "Let me know if she bullies you.", Reply: "Thanks, I will.  But she probably matured now, it should be fine.", Audio: "84", Love: 1, Domination: 1 }
				]
			},
			{ Text: "We are very different, but we both did not choose our husband.  Her wedding was arranged at her birth.", Audio: "90" },
			{
				Text: "I have a weird feeling.  I hope that tonight's dinner will be pleasant.", Audio: "100",
				Answer: [
					{ Text: "It will be a great feast.", Reply: "(She nods slowly.)  Yes, I should focus on the meal.", Audio: "101" },
					{ Text: "What weird feeling?", Reply: "Thanks for asking Melody.  I'm scared, but I don't know why.  There's no reason.", Audio: "102", Love: 1 },
					{ Text: "Don't be so chicken.", Reply: "(She sighs.)  I guess I'm going crazy.", Audio: "103", Love: -1, Domination: 1 },
				]
			},
			{ Text: "Sorry if I sound ridiculous.", Audio: "110" },
			{
				Text: "I have these strange emotions lately and I cannot control them.", Audio: "120",
				Answer: [
					{ Text: "You need better self-control.", Reply: "(She nods slowly.)  I know, Mother also told me that.", Audio: "121", Domination: 1 },
					{ Text: "This is really scary.", Reply: "Don't be scared Melody.  Everything will be fine.", Audio: "122", Domination: -1 },
					{ Text: "Maybe it's the Oracle in you.", Reply: "(She shrugs.)  I don't know, maybe you're right.", Audio: "123" },
				]
			},
			{
				Entry: function() {
					if (PlatformDialogGetCharacter("Olivia").Love < 14) PlatformDialogGoto = "Towel";
					PlatformDialogProcess();
				}
			},
			{ ID: "Orgasm", Text: "(She takes a long breath.)  Melody, you're such a dear friend.", Audio: "O10" },
			{ Text: "(She blushes.)  I have a very personal question for you.", Audio: "O20" },
			{
				Text: "How does it feel to have an orgasm?", Audio: "O30",
				Answer: [
					{ Text: "It's overrated.", Reply: "Please be honest.  You're not my mother.", Audio: "O31", Love: -1 },
					{ Text: "Why do you ask?", Reply: "(She blushes some more and ponders.)" },
					{ Text: "It's heaven.  I wish I could give you one.", Reply: "(She nods.)  That would be wonderful.", Audio: "O33", Love: 1 },
					{ Text: "I don't know.  I'm not married.", Reply: "Please be honest.  I know you've had some adventures.", Audio: "O34", Love: -1 },
				]
			},
			{ Text: "This belt protects me, but also shields me from life's pleasures.", Audio: "O40" },
			{
				Text: "Should I have an orgasm?", Audio: "O50",
				Answer: [
					{ Text: "Yes, but you might need patience.", Reply: "Yes, lots of patience.  I'm too curious.", Audio: "O51" },
					{ Text: "Yes Lady Olivia.  If only I could help you.", Reply: "You're a wonderful maid.  I'm too curious.", Audio: "O52", Domination: -1 },
					{ Text: "The Duke of Slandia will take care of that.", Reply: "I know, but I wish I could experiment first.  I'm too curious.", Audio: "O53", Domination: 1 },
				]
			},
			{ Text: "I bet it feels so nice and relaxing, like spring flowers.", Audio: "O60" },
			{
				Text: "Melody, could you show me an orgasm?", Audio: "O70",
				Answer: [
					{ Text: "(Nod politely and get naked.)", Reply: "(She smirks as you strip down.)", Domination: -1 },
					{ Text: "My pleasure.  (Get naked.)", Reply: "(She smiles as you strip down.)" },
					{ Text: "Olivia, this is not appropriate.", Reply: "(She bows her head.)  Of course, sorry about that.", Audio: "O73", Goto: "Towel", Domination: 1 },
					{ Text: "(Blush.)  Sorry, not now.", Reply: "I understand, sorry about that.", Audio: "O74", Goto: "Towel" },
				]
			},
			{
				Text: "(You slowly get naked and expose your body.)",
				Character: [{ Name: "Melody", Status: "Naked", Pose: "CoverBreast" }]
			},
			{ Text: "It's been a long while since we got naked together.", Audio: "O80" },
			{ Text: "Since we were little girls, way before we became adults.", Audio: "O90" },
			{ Text: "Let me show you an orgasm.  (You wink at her.)", Audio: "O100" },
			{
				Text: "(You slowly start to masturbate your breast and pussy lips.)",
				Character: [{ Name: "Melody", Status: "Naked", Pose: "Masturbate" }]
			},
			{ Text: "You first need to learn your body and how it reacts.", Audio: "O120" },
			{ Text: "Some prefer the clitoris, others the vagina, and others the butt, breast and more.", Audio: "O130" },
			{ Text: "Discovering your body is both important and fun.", Audio: "O140" },
			{ Text: "(You start to masturbate lovingly and moan lightly.)" },
			{ Text: "Aaaaaaafter some stimulation, the pleasure starts to build.", Audio: "O160" },
			{ Text: "It will grow stronger and stronger, getting you on the edge.", Audio: "O170" },
			{ Text: "Oooooooooonce on the edge, you can go slowly to keep that feeling.", Audio: "O180" },
			{ Text: "Or gain momentum to reach the orgasm.", Audio: "O190" },
			{ Text: "(You masturbate faster and moan loudly.)" },
			{ Text: "Iiiiiiiii'm very cl cl close now.", Audio: "O200" },
			{ Text: "It it it becomes haaaaaaard to stay in control.", Audio: "O210" },
			{
				TextScript:  function () { return (PlatformDialogGetCharacter("Olivia").Domination < 0) ? "Can I have my orgasm Lady Olivia?" : "It's time for the climax."; },
				AudioScript:  function () { return (PlatformDialogGetCharacter("Olivia").Domination < 0) ? "O221" : "O222"; }
			},
			{
				TextScript:  function () { return (PlatformDialogGetCharacter("Olivia").Domination < 0) ? "Yes, you can have your orgasm my maid." : "(She smiles and watches you carefully.)"; },
				AudioScript:  function () { return (PlatformDialogGetCharacter("Olivia").Domination < 0) ? "O231" : undefined; },
				Character: [{ Name: "Olivia", Status: "Chastity", Pose: "Bathing", X: 0 }]
			},
			{
				Entry: function() { PlatformEventSet("OliviaBathOrgasm"); PlatformAddExperience(PlatformPlayer, 10); },
				Text: "Yes!  Yeah!  Eeeeeeeeeeeeaaaaaaaaahhh!", Audio: "O240",
				Character: [{ Name: "Melody", Status: "Naked", Pose: "MasturbateOrgasm" }]
			},
			{ Text: "(You get a wonderful orgasm right in front of her.)" },
			{ Text: "Aaaaaaahhh, and the moment after the orgasm is also great.", Audio: "O260" },
			{ Text: "I hope you enjoyed the orgasm class.", Audio: "O270" },
			{
				Text: "(You dress back up as she relaxes in the bath with a huge smile.)",
				Character: [{ Name: "Olivia", Status: "Chastity", Pose: "Bathing", X: 0 }]
			},
			{ Text: "Thank you so much Melody, I've learned a lot.", Audio: "O290" },
			{ ID: "Towel", Text: "Can you give me a towel?  I'd like to get out.", Audio: "130" },
			{ Text: "(You help her out as she dresses up.)" },
			{
				Background: "BathroomOlivia",
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "Idle" }]
			},
			{ Text: "Thanks Melody, what is your next duty today?", Audio: "140" },
			{
				Text: "I need to go to the dungeon and clean the restraints.", Audio: "150",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "Idle" }]
			},
			{
				Text: "Very well, I'll ask the staff to open the gate.", Audio: "160",
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "Idle" }]
			},
			{ Text: "The dungeon is scary, good luck down there.", Audio: "170" },
			{ Text: "(She heads back to her bedroom.)" }
		]
	},

	{
		Name: "OliviaAfterBath",
		Music: "OliviaRoom",
		Dialog: [
			{
				Background: "BedroomOlivia",
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "Idle" }]
			},
			{ Text: "The gate leading downstairs should be open.", Audio: "10" },
			{ Text: "The dungeon is scary, good luck down there.", Audio: "20" }
		]
	},

	{
		Name: "IntroGuardBeforeCurse",
		Music: "CastleDungeon",
		Exit : function () { PlatformEventSet("IntroGuard"); },
		Dialog: [
			{
				Background: "CastleHall",
				Character: [{ Name: "Lucy", Status: "Armor", Pose: "Idle" }]
			},
			{ Text: "(As you enter the first floor, a guard greets you.)" },
			{ Text: "Sorry little maid, you cannot clean here.  We are expecting a prestige guest very soon.", Audio: "20" },
			{
				Character: [
					{ Name: "Lucy", Status: "Armor", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
				Text: "All maids must work upstairs.", Audio: "30",
				Answer: [
					{ Text: "What prestige guest?", Reply: "Marchioness Camille of House Alister will be arriving shortly.", Audio: "31" },
					{ Text: "I will not bother Marchioness Camille.", Reply: "Good, she doesn't want to be questioned or bothered.", Audio: "32" },
					{ Text: "Camille isn't prestigious.", Reply: "Do not be impolite!  Especially when she arrives.", Audio: "33" },
					{ Text: "I need to clean the dungeon restraints.", Reply: "You're Melody, aren't you?  We've been warned by Countess Isabella.", Audio: "34", Goto: "End" }
				]
			},
			{
				Character: [{ Name: "Lucy", Status: "Armor", Pose: "Idle" }],
				Text: "Marchioness Camille wants to do a full review of the guards when she arrives.", Audio: "40"
			},
			{ Text: "It's quite unusual since she doesn't live here anymore.", Audio: "50" },
			{ Text: "She's a fierce swordswoman as you might know, with a boiling demeanor.", Audio: "60" },
			{ Text: "You don't want to be there when she comes for the review.", Audio: "70" },
			{
				Character: [
					{ Name: "Lucy", Status: "Armor", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
				Text: "Why did you come downstairs?", Audio: "80",
				Answer: [
					{ Text: "I must clean the restraints.", Reply: "You're Melody, aren't you?  We've been warned by Countess Isabella.", Audio: "81" },
					{ Text: "I'm going to the dungeon.", Reply: "To clean the restraints?  We've been warned by Countess Isabella.", Audio: "82" },
					{ Text: "Countess Isabella gave me a secret mission.", Reply: "(She laughs.)  It's not a secret.  You're here to clean restraints.  We've been warned by Countess Isabella.", Audio: "83" }
				]
			},
			{
				ID: "End",
				Character: [{ Name: "Lucy", Status: "Armor", Pose: "Idle" }],
				Text: "You may proceed.  Walk the hall to reach the dungeon.", Audio: "90"
			},
			{ Text: "(She starts to patrol the hallway.)" }
		]
	},

	{
		Name: "IntroGuardAfterCurse",
		Music: "CastleDungeon",
		Exit : function () { PlatformEventSet("IntroGuardCurse"); },
		Dialog: [
			{
				Background: "CastleHall",
				Character: [{ Name: "Lucy", Status: "Armor", Pose: "Zombie" }]
			},
			{ Text: "(As you enter the hall, a guard stares at you with blank eyes.)" },
			{ Text: "Uuuuueeeeggghh!" },
			{
				Text: "(The guard advances toward you.)",
				Character: [
					{ Name: "Lucy", Status: "Armor", Pose: "Zombie" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
				Answer: [
					{ Text: "Wait!", Reply: "(She doesn't listen and charges at you.)" },
					{ Text: "What's going on?", Reply: "(She doesn't listen and charges at you.)" },
					{ Text: "Are you alright?", Reply: "(She doesn't listen and charges at you.)" }
				]
			}
		]
	},

	{
		Name: "CursedMaid",
		Music: "CastleHall",
		Exit : function () { PlatformEventSet("CursedMaid"); },
		Dialog: [
			{
				Background: "CastleHall",
				Character: [{ Name: "Yuna", Status: "Maid", Pose: "Zombie" }]
			},
			{ Text: "(A drooling maid comes to you, her eyes are the same as the guards.)" },
			{ Text: "Aaaaaannngg! Naaaaannnmm!" },
			{
				Text: "(She moves toward you.)",
				Character: [
					{ Name: "Yuna", Status: "Maid", Pose: "Zombie" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
				Answer: [
					{ Text: "Wake up sister!", Reply: "(She doesn't seem to understand and charges at you.)" },
					{ Text: "Go away or I'll kick your butt.", Reply: "(She doesn't seem to understand and charges at you.)" },
					{ Text: "You seem brighter than usual.", Reply: "(She charges at you brainlessly.)" },
					{ Text: "(Fight her.)", Reply: "(She charges at you brainlessly.)" }
				]
			}
		]
	},

	{
		Name: "IntroEdlaranBeforeCurseStart",
		Music: "CastleDungeon",
		Exit : function () { PlatformEventSet("EdlaranIntro"); PlatformLoadRoom(); },
		Dialog: [
			{
				Background: "DungeonCell",
				Character: [{ Name: "Edlaran", Status: "Chained", Pose: "Idle" }]
			},
			{ Text: "Hey!  Hey maid!  Can you help me?", Audio: "10" },
			{
				Text: "Can you unlock me?", Audio: "20", AudioStyle: "cheerful",
				Answer: [
					{ Text: "Why are you chained?", Reply: "For no reason.  I swear it's true!", Audio: "21" },
					{ Text: "You know you're a cute prisoner?", Reply: "(She blushes.)  Well thanks, I guess.", Audio: "22", AudioStyle: "cheerful", Domination: 1, Love: 1 },
					{ Text: "There are too many rats in that dungeon.", Reply: "(She grumbles.)  That's not very kind!", AudioStyle: "angry", Audio: "23", Love: -2 },
					{ Text: "This is cruel and inhumane.", Reply: "(She nods.)  That's very true girl.", Audio: "24", Domination: -1, Love: 1 }
				]
			},
			{ Text: "The manor guards jumped on me without any reason or warning.", Audio: "30" },
			{ Text: "They chained me up and locked me in that cell.", Audio: "40" },
			{
				Text: "Release me before they come back.", Audio: "50",
				Answer: [
					{ Text: "You must be lying.", Reply: "Fine!  I admit I was inside the manor without permission.", Audio: "51", Love: -1 },
					{ Text: "It's hard to believe.", Reply: "Alright, I was inside the manor without permission.", Audio: "52" },
					{ Text: "The guards can be too strict.", Reply: "Yeah, simply because I was inside the manor without permission.", Audio: "53", Love: 1 }
				]
			},
			{ Text: "Is it a crime to enter a building without being invited?  Don't answer.", Audio: "60" },
			{ Text: "These silly guards think I'm a thief, it's so unfair.", Audio: "70" },
			{
				Text: "They must be racist.", Audio: "80",
				Answer: [
					{ Text: "Racist?  Why?", Reply: "(She wiggles her ears.)  Isn't it obvious?  I'm an elf.", Audio: "81", Domination: -1 },
					{ Text: "Do elves have a bad reputation?", Reply: "I don't know, it's the first time I come here.", Audio: "82" },
					{ Text: "It's not racism.  They enforce the law.", Reply: "(Sighs.)  Well, the law is unfair then.", Audio: "83", Domination: 1 },
				]
			},
			{ Text: "I'm Edlaran by the way, a wood elf archer.", Audio: "90" },
			{ Text: "I protect travelers, but we were attacked by zombies.", Audio: "100" },
			{ Text: "I came here for help, but they wanted to take my bow, so I aimed for a guard.", Audio: "110" },
			{ Text: "Is it a crime to threaten a guard?  Don't answer.", Audio: "120" },
			{ Text: "So, after an unsuccessful negotiation, they threw me in jail.", Audio: "130" },
			{
				Text: "Enough about me.  Who are you?", Audio: "140",
				Answer: [
					{ Text: "I'm Melody, it's a pleasure to meet you.", Reply: "(She nods happily.)  Same here.", Audio: "141", AudioStyle: "cheerful", Love: 1 },
					{ Text: "I'm Melody the manor maid.  (Do a curtsy.)", Reply: "You're a good maid.", Audio: "142", Domination: -1 },
					{ Text: "I'm Melody.", Reply: "Very good Melody.", Audio: "143" },
					{ Text: "I'm Melody, remember that name little elf.", Reply: "(She gulps and nods.)  Yes Miss.", Audio: "144", Domination: 1 },
				]
			},
			{ Text: "Now that we know each other, can you help?", Audio: "150" },
			{
				Text: "Will you unlock me?", Audio: "160",
				Answer: [
					{ Text: "It's not my job.", Reply: "(She grumbles.)  Fine, go clean some furniture.", AudioStyle: "angry", Audio: "161" },
					{ Text: "I don't want trouble with the guards.", Reply: "(She sighs.)  I'll show you real trouble someday.", Audio: "162", AudioStyle: "sad", Domination: -1 },
					{ Text: "I don't have the key.", Reply: "(She pouts.)  Thanks anyway.", Audio: "163", Love: 1 },
					{ Text: "Thieves must be punished.", Reply: "(She gets angry.)  I'm not a thief!", Audio: "164", AudioStyle: "angry", Domination: 1, Love: -1 }
				]
			},
			{ Text: "(She gets grumpy and stops talking.)" },
		]
	},

	{
		Name: "IntroEdlaranBeforeCurseEnd",
		Music: "CastleDungeon",
		Dialog: [
			{
				Background: "DungeonCell",
				Character: [{ Name: "Edlaran", Status: "Chained", Pose: "Idle" }]
			},
			{ Text: "Have you changed your mind?", Audio: "10" },
			{
				Text: "Will you unlock me?", Audio: "20", AudioStyle: "cheerful",
				Answer: [
					{ Text: "It's not my job.", Reply: "(She grumbles.)  Fine, go clean some furniture.", AudioStyle: "angry", Audio: "21" },
					{ Text: "I don't want trouble with the guards.", Reply: "(She sighs.)  I'll show you real trouble someday.", AudioStyle: "sad", Audio: "22" },
					{ Text: "I don't have the key.", Reply: "(She pouts.)  Thanks anyway.", Audio: "23" },
					{ Text: "Thieves must be punished.", Reply: "(She gets angry.)  I'm not a thief!", AudioStyle: "angry", Audio: "24" }
				]
			},
			{ Text: "(She gets grumpy and stops talking.)" },
		]
	},

	{
		Name: "IntroEdlaranAfterCurseStart",
		Music: "CastleDungeon",
		Exit : function () { PlatformEventSet("EdlaranCurseIntro"); PlatformLoadRoom(); },
		Dialog: [
			{
				Background: "DungeonCell",
				Character: [{ Name: "Edlaran", Status: "Chained", Pose: "Idle" }]
			},
			{
				TextScript: function () { return (PlatformEventDone("EdlaranIntro")) ? "Is it you Melody?  Are you a zombie?" : "Hey!  I'm Edlaran, a wood elf, are you a zombie?"; },
				AudioScript: function () { return (PlatformEventDone("EdlaranIntro")) ? "11" : "12"; }
			},
			{
				Text: "(She looks scared.)  Talk to me maid.", Audio: "20", AudioStyle: "terrified",
				Answer: [
					{ Text: "Don't be scared.  I'm not a zombie.", Reply: "Thanks a lot.  Something is very wrong.", Audio: "21", Domination: 1 },
					{ Text: "I'm fine, but the guards are going nuts.", Reply: "Yes, something is very wrong.", Audio: "22" },
					{ Text: "UeeeehhgggAHAHAHA!  Just kidding.", Reply: "That's not funny!  Something is very wrong.", Audio: "23", Love: -1 },
				]
			},
			{ Text: "The guards have a dead look in their eyes, they only mumble.", Audio: "30" },
			{ Text: "I've tried offering them some gold or a favor, but they were not interested.", Audio: "40" },
			{ Text: "Is it a crime to bribe a guard?  Don't answer.", Audio: "50" },
			{
				Text: "What is going on with them?", Audio: "60",
				Answer: [
					{ Text: "They have fallen for your pretty face.", Reply: "(She blushes.)  You sure pick your time to flirt.", Audio: "61", AudioStyle: "cheerful", Love: 1 },
					{ Text: "Some magic is going on.", Reply: "You're probably right, but I don't know magic.", Audio: "62" },
					{ Text: "I don't know, but I'm scared.", Reply: "I understand, this is scary indeed.", Audio: "63", AudioStyle: "terrified", Domination: -1 },
					{ Text: "Maybe they are undead.", Reply: "Yes, some kind of zombies, this is scary.", Audio: "64" },
				]
			},
			{ Text: "At first, there was a loud woman scream.", Audio: "70" },
			{ Text: "Then it went pitch black for a minute in here.", Audio: "80" },
			{
				Text: "What was that darkness?", Audio: "90",
				Answer: [
					{ Text: "Whatever it was, it's a bad omen.", Reply: "Yes, something evil is brewing.", Audio: "91", AudioStyle: "terrified", Domination: -1 },
					{ Text: "It could be a solar eclipse.", Reply: "(She nods.)  Yes, it makes a lot of sense.", Audio: "92", Love: 1 },
					{ Text: "I will investigate it later.", Reply: "That's great to hear.", Audio: "93", Domination: 1 },
					{ Text: "I don't know what you're talking about.", Reply: "Don't pretend you did not see it.", Audio: "94", Love: -1 },
				]
			},
			{ Text: "It's dangerous to keep me here in chains.  I could be killed.", Audio: "100", AudioStyle: "terrified" },
			{ Text: "If you find the key for my shackles, can you release me?", Audio: "110" },
			{ Text: "One of the guards must have it.  I don't know which one.", Audio: "120" },
			{ Text: "Please find the key and come back to rescue me.  I'll repay you.", Audio: "130" }
		]
	},

	{
		Name: "IntroEdlaranAfterCurseEnd",
		Music: "CastleDungeon",
		Dialog: [
			{
				Background: "DungeonCell",
				Character: [{ Name: "Edlaran", Status: "Chained", Pose: "Idle" }]
			},
			{ Text: "It's dangerous to keep me here in chains.  I could be killed.", Audio: "100", AudioStyle: "terrified" },
			{ Text: "If you find the key for my shackles, can you release me?", Audio: "110" },
			{ Text: "One of the guards must have it.  I don't know which one.", Audio: "120" },
			{ Text: "Please find the key and come back to rescue me.  I'll repay you.", Audio: "130" }
		]
	},

	{
		Name: "EdlaranUnlock",
		Music: "CastleDungeon",
		Exit : function () { PlatformEventSet("EdlaranUnlock"); PlatformLoadRoom(); },
		Dialog: [
			{
				Background: "DungeonCell",
				Character: [{ Name: "Edlaran", Status: "Chained", Pose: "Idle" }]
			},
			{ Text: "Melody!  Have you found the key?", Audio: "10" },
			{
				Text: "Will you unlock me?", Audio: "20", AudioStyle: "cheerful",
				Answer: [
					{ Text: "Sure, it's too dangerous right now.", Reply: "(She nods happily.)  Absolutely.", Audio: "21" },
					{ Text: "Yes, but you will owe me a favor.", Reply: "(She gulps.)  Very good, I swear I'll repay you somehow someday.", Audio: "22", AudioStyle: "calm", Domination: 1 },
					{ Text: "Of course, elves are too important to be chained.", Reply: "(She nods slowly.)  Well said little maid.", Audio: "23", AudioStyle: "serious", Domination: -1 },
					{ Text: "Not right now.  (Leave her.)", Script: function() { PlatformDialogLeave(); } },
				]
			},
			{
				Text: "(You unlock her shackles as she gathers her equipment.)", Audio: "CommonChain",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "Thanks a lot Melody.  (She stretches happily.)", Audio: "40", AudioStyle: "cheerful" },
			{
				Text: "How about a hug?", Audio: "50", AudioStyle: "cheerful",
				Answer: [
					{ Text: "Alright, let's do a quick hug.", Reply: "(You exchange a friendly hug.)", Love: 1 },
					{ Text: "It's not the best time.", Reply: "(She pouts.)  I guess you're right.", Audio: "52", AudioStyle: "sad", Love: -1 },
					{ Text: "(Give her a long loving hug.)", Reply: "(You exchange a long and warm hug.)", Love: 2 },
					{ Text: "Don't touch me.", Reply: "Oh!  Alright then.", Audio: "54",  AudioStyle: "sad", Love: -2 },
				]
			},
			{ Text: "I'll try to escape while I can.", Audio: "60" },
			{
				Text: "What will you do?", Audio: "70",
				Answer: [
					{ Text: "My duty is to protect Lady Olivia.", Reply: "You're her maid in shiny armor.  (She giggles.)", Audio: "71", AudioStyle: "cheerful", Domination: 1 },
					{ Text: "I'll check for Countess Isabella.", Reply: "Good luck with that, whoever that is.", Audio: "72" },
					{ Text: "I'll find a place to hide.", Reply: "Find a broom closet.  (She laughs.)", Audio: "73", AudioStyle: "cheerful", Domination: -1 },
				]
			},
			{ Text: "See you later Melody.  I'll repay you someday.", Audio: "80" },
			{ Text: "(She leaves the room.)" },
		]
	},

	{
		Name: "EdlaranBedroomIsabella",
		Music: "IsabellaRoom",
		Exit : function () { PlatformEventSet("EdlaranBedroomIsabella"); PlatformLoadRoom(); },
		Dialog: [
			{
				Background: "BedroomIsabella",
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "Idle" }]
			},
			{ Text: "(Edlaran is searching in Countess Isabella armoire.)" },
			{ Text: "Oh!  Hello Melody.  (She looks surprised.)", Audio: "10", AudioStyle: "terrified" },
			{
				Text: "What's going on?", Audio: "20",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
				Answer: [
					{ Text: "I'm patrolling for thieves.", Reply: "(She looks around.)  Thieves?  I hope you're not talking about me.", Audio: "21", AudioStyle: "terrified", Love: -1, Domination: 1 },
					{ Text: "Why are you in the Countess bedroom?", Reply: "I...  I was...  I got lost!  This place is confusing.", Audio: "22", AudioStyle: "terrified" },
					{ Text: "Did you find any good loot?", Reply: "(She shakes her head no.)  Not yet, but we could share if I do.", Audio: "23", Love: 1 },
					{ Text: "Stealing is wrong you know.", Reply: "You sound like my mother.  I'm not stealing.", Audio: "24", AudioStyle: "angry", Love: -1, Domination: -1 },
				]
			},
			{ Text: "I was trying to leave the manor, but the guards chased me down.", Audio: "30" },
			{ Text: "I ran upstairs, but the maids are also nuts.", Audio: "40" },
			{ Text: "I found this comfy room to catch my breath, and checked this armoire while I was there.", Audio: "50" },
			{ Text: "Is it a crime to search in a random armoire?  Don't answer.", Audio: "60" },
			{ Text: "Look!  There are lots of kinky toys in here.", Audio: "70" },
			{ Text: "(She shows you a pile of gags and restraints that belongs to Countess Isabella.)" },
			{
				Text: "What is that for?", Audio: "80",
				Answer: [
					{ Text: "The Countess secret garden should stay secret.", Reply: "You're so boring, aren't you a little curious?", Audio: "81", Love: -1 },
					{ Text: "It's used to lock up cute elves.", Reply: "(She blushes.)  You're very direct for a maid.", Audio: "82", Love: 1, Domination: 1 },
					{ Text: "These are tools to punish servants like me.", Reply: "(She laughs.)  You must get punished all the time.", Audio: "83", AudioStyle: "cheerful", Domination: -1 },
				]
			},
			{ Text: "I bet she uses these naughty toys when lovers come by.", Audio: "90" },
			{ Text: "She might be the Dominant, the submissive or switch roles.", Audio: "100" },
			{ Text: "She's probably very naughty.  (She giggles.)", Audio: "110", AudioStyle: "cheerful" },
			{
				Entry: function() {
					if (PlatformDialogGetCharacter("Edlaran").Domination >= 4) PlatformDialogGoto = "Dominant";
					else if (PlatformDialogGetCharacter("Edlaran").Domination <= -4) PlatformDialogGoto = "Submissive";
					else PlatformDialogGoto = "End";
					PlatformDialogProcess();
				}
			},

			{
				ID: "Dominant",
				Text: "(You grab a few cuffs and look at her.)", Audio: "CommonChain",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "CleanRestraints" }
				]
			},
			{
				Text: "What are you doing with these restraints?", Audio: "130", AudioStyle: "terrified",
				Answer: [
					{ Text: "Turn around and give me your hands.", Reply: "(She turns slowly as you lock and chain her.)", Audio: "CommonChain" },
					{ Text: "(Snap them on her forcefully).", Reply: "(She grumbles as you lock and chain her.)", Audio: "CommonChain", Love: -1, Domination: 1 },
					{ Text: "You need to put them back.", Reply: "(She nods.)  Yeah, yeah, I know.", Audio: "133", AudioStyle: "sad", Goto: "End" },
				]
			},
			{
				Character: [
					{ Name: "Edlaran", Status: "Chained", Pose: "Kneel" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "This is really tight Miss Melody.", Audio: "140", AudioStyle: "terrified" },
			{
				Text: "Why did you lock me up?", Audio: "150", AudioStyle: "terrified",
				Answer: [
					{ Text: "So you can please me sweetie.", Reply: "(She nods and crawls under your skirt.)", Love: 1 },
					{ Text: "(Pull her head under your skirt).", Reply: "(You pull her head under your skirt.)", Domination: 1 },
					{ Text: "To see you struggle.", Reply: "(She struggles for your pleasure before you release her.)", Goto: "End" },
				]
			},
			{ Character: [{ Name: "Edlaran", Status: "Chained", Pose: "KneelUnderMaidMelodySkirt" }] },
			{ Text: "(She clumsily pulls down your panties with her teeth.)" },
			{ Text: "(You hear her lick her lips before approaching your clitoris.)" },
			{ Text: "(She licks you slowly and lovingly, making you moan silently.)" },
			{ Text: "(You push her deeper inside as she starts working on your pussy lips.)" },
			{ Text: "(She explores your pussy with her tongue as you moan of pleasure.)" },
			{
				Text: "(You're about to climax.)",
				Answer: [
					{ Text: "Please help me cum.", Reply: "(She goes faster to help you reach a tremendous orgasm.)", Love: 1, Domination: -1 },
					{ Text: "EDLARAAAAAAAN! YES!", Reply: "(You scream and reach a tremendous orgasm.)", Love: 1 },
					{ Text: "That's enough.  (Push her back.)", Reply: "(She pouts as you push her back and release her.)  You were so close.", Audio: "203", AudioStyle: "sad", Love: -2, Goto: "End" },
				]
			},
			{ Character: [{ Name: "Edlaran", Status: "Chained", Pose: "KneelUnderMaidMelodySkirtOrgasm" }] },
			{ Text: "(You slowly catch your breath after a long and powerful orgasm.)" },
			{ Text: "(You pet her head gently to reward her, while recovering from the pleasure wave.)" },
			{ Text: "I hope you enjoyed it Miss Melody.  (You push her back and unlock her.)", Audio: "230" },
			{ Entry: function() { PlatformEventSet("EdlaranCountessBedroomOrgasmDom"); PlatformAddExperience(PlatformPlayer, 10); PlatformDialogGoto = "End"; PlatformDialogProcess(); } },

			{ ID: "Submissive", Text: "(She grabs a few cuffs and looks at you.)" },
			{
				Text: "I have a wild idea.", Audio: "300", AudioStyle: "serious",
				Answer: [
					{ Text: "I don't like the look on your face.", Reply: "Turn around and you won't see it.  (She turns you around and chains you.)", Audio: "301", AudioStyle: "serious", Love: -1 },
					{ Text: "What's on your mind?", Reply: "It's a surprise!  (She turns you around and chains you.)", Audio: "302", AudioStyle: "cheerful" },
					{ Text: "(Turn around and present your hands.)", Reply: "Such a good maid.  (She cuffs and chains you.)", Audio: "303", AudioStyle: "serious", Domination: -1 },
					{ Text: "Don't you dare!", Reply: "Fine!  You're no fun.", Audio: "304", AudioStyle: "sad", Love: -1, Domination: 1, Goto: "End" },
				]
			},
			{
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "ChainedKneel" }
				]
			},
			{ Text: "(You tug on the cuffs and chains to test them.)", Audio: "CommonChain" },
			{
				Text: "You know what's coming next?", Audio: "310", AudioStyle: "serious",
				Answer: [
					{ Text: "I know who's coming.  (Wink at her.)", Reply: "(She laughs and removes her pants and undies.)", Love: 1 },
					{ Text: "(Stay silent and nod slowly.)", Reply: "(She smirks and removes her pants and undies.)", Domination: -1 },
					{ Text: "Next time you'll do it for me.", Reply: "(She shakes her head no and removes her pants and undies.)", Domination: 1 },
				]
			},
			{
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "NoPants" },
					{ Name: "Melody", Status: "Maid", Pose: "ChainedKneel" }
				]
			},
			{ Text: "Come here little maid, don't be shy.", Audio: "320", AudioStyle: "serious" },
			{ Text: "(She snaps her fingers as you slowly crawl next to her.)" },
			{ Character: [{ Name: "Edlaran", Status: "Archer", Pose: "LickedByMaidMelody" }] },
			{ Text: "(You lick her slowly and skillfully, making her shiver from pleasure.)" },
			{ Text: "(She pulls you deeper inside as you start working on her pussy lips.)" },
			{ Text: "(You explore her pussy with your tongue as she moans of pleasure.)" },
			{
				Text: "(She's about to climax.)",
				Answer: [
					{ Text: "(Tease her some more.)", Reply: "(She moans loudly for a long time and finally reaches a great orgasm.)", Love: 1 },
					{ Text: "(Try to give her the best orgasm of her life.)", Reply: "(She screams from the pleasure and reaches a tremendous orgasm.)", Love: 2 },
					{ Text: "(Pull back suddenly.)", Reply: "(She grumbles as you pull back before her orgasm.)  That was cruel!  (She releases you and dresses back.)", Audio: "353", AudioStyle: "sad", Domination: 1, Love: -2, Goto: "End" },
				]
			},
			{ Character: [{ Name: "Edlaran", Status: "Archer", Pose: "LickedByMaidMelodyOrgasm" }] },
			{ Text: "Wow!  Simply wow!  (She tries to recover from her powerful orgasm.)", Audio: "360", AudioStyle: "cheerful" },
			{ Text: "That was amazing Melody, you're the best maid ever.", Audio: "370", AudioStyle: "cheerful" },
			{ Text: "(She slowly pushes you back and releases you.)", Audio: "CommonChain" },
			{ Entry: function() { PlatformEventSet("EdlaranCountessBedroomOrgasmSub"); PlatformAddExperience(PlatformPlayer, 10); PlatformDialogGoto = "End"; PlatformDialogProcess(); } },
			{
				ID: "End",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
				Text: "(She puts the kinky items back in the armoire.)"
			},
			{ Text: "Time flies too quickly, I need to go.", Audio: "380" },
			{ Text: "Melody, I haven't forgot my promise.  I'll repay you someday.", Audio: "390" },
			{ Text: "(She leaves the room.)" },
		]
	},

	{
		Name: "EdlaranWineCellar",
		Music: "CastleHall",
		Exit : function () { PlatformEventSet("EdlaranWineCellar"); PlatformLoadRoom(); },
		Dialog: [
			{
				Background: "WineCellar",
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "Flirt" }]
			},
			{ Text: "(Edlaran is tasting some wine.  She opened a few bottles from the Countess cellar.)" },
			{ Text: "(She hiccups and turns to you.)  Meldy!  (She looks a little tipsy.)", Audio: "10", AudioStyle: "cheerful" },
			{ Text: "Ish it a crime to open wine battles?  Don't ansher.", Audio: "15", AudioStyle: "cheerful" },
			{
				Text: "Are you thristy?", Audio: "20", AudioStyle: "cheerful",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Flirt" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
				Answer: [
					{ Text: "Party time!  (Drink with her.)", Reply: "(You open another bottle and share a good time.)", Love: 1 },
					{ Text: "Sure, one glass.  (Have a glass.)", Reply: "(You try a glass of wine from the Countess cellar.)" },
					{ Text: "No, drinking is bad for your health.", Reply: "You no fun!  (She hiccups.)  Shcared of wine.", Audio: "23", AudioStyle: "sad", Domination: -1, Love: -1 },
					{ Text: "No, this is stolen wine.", Reply: "(She pouts.)  Why are you sho sherious?", Audio: "24", AudioStyle: "sad", Domination: 1, Love: -1 },
				]
			},
			{
				Entry: function() {
					if (PlatformDialogGetCharacter("Edlaran").Love < 4) PlatformDialogGoto = "End";
					PlatformDialogProcess();
				}
			},
			{ Text: "Meldy, you're shuch a good friend.  (She gives you a hug.)", Audio: "30", AudioStyle: "cheerful" },
			{ Text: "You're a shuper... friend.  (She hugs you some more.)", Audio: "40", AudioStyle: "cheerful" },
			{ Text: "How about I (She hiccups.) repay you now?  I'll help you in bottles.", Audio: "50", AudioStyle: "cheerful" },
			{ Text: "Gimme a minute to shober up and I'll fight for you.", Audio: "60", AudioStyle: "cheerful" },
			{ Text: "(Edlaran joined your party.  You can switch your active character at any save point.)" },
			{ Entry: function() { PlatformEventSet("EdlaranJoin"); PlatformPartyBuild(); PlatformLoadRoom(); PlatformDialogLeave(); } },
			{ ID: "End", Text: "Drinking ish fun, but we have important shtuff to... do.", Audio: "70", AudioStyle: "cheerful" },
			{ Text: "Shee you later Meldy.  I'll repay you shoon(She hiccups.).", Audio: "80", AudioStyle: "cheerful" },
			{ Text: "(She leaves the room.)" },

		]
	},

	{
		Name: "EdlaranLynWineCellar",
		Music: "CastleHall",
		Dialog: [
			{
				Background: "WineCellar",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleCheer" },
					{ Name: "Lyn", Status: "Thief", Pose: "IdleCheer" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
				]
			},
			{ Text: "(Edlaran and Lyn are drinking and talking loudly in the Countess wine cellar.  They turn to you.)" },
			{ Text: "Meldy!  Iz great to see you!  (She waves at you tipsily.)", Audio: "10", AudioStyle: "cheerful" },
			{ Text: "Me an Lyn are havin a gud time!", Audio: "20", AudioStyle: "cheerful" },
			{
				Text: "Try the wine!", Audio: "30", AudioStyle: "cheerful",
				Answer: [
					{ Text: "Enough drinking my friends.", Reply: "U no fun!  (They both leave the room.)", Audio: "31", AudioStyle: "cheerful", Goto: "End" },
					{ Text: "Are you two drunk?", Reply: "Not dunk!  Drunking!  (They both laugh.)", Audio: "32", AudioStyle: "cheerful" },
					{ Text: "This wine doesn't belong to you.", Reply: "Wez can go then!  (They both leave the room.)", Audio: "33", AudioStyle: "cheerful", Goto: "End" },
				]
			},
			{ Text: "Lyn iz zo much fun!  An she cute!  (She smiles at Lyn.)", Audio: "40", AudioStyle: "cheerful" },
			{
				Text: "No Edlaran, you the cutest!  Super adoreable acher!  (She smiles at Edlaran.)", Audio: "50", AudioStyle: "cheerful",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleCheer", X: 750 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleCheer", X: 250 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
				]
			},
			{ Text: "An you have smexy curvs lttle elf.", Audio: "60", AudioStyle: "cheerful" },
			{
				Text: "(They both start to flirt.)",
				Answer: [
					{ Text: "(Stop them.)", Reply: "Maid!  U so borin!  (They both leave the room.)", Audio: "61", AudioStyle: "cheerful", Goto: "End" },
					{ Text: "(Offer them a bottle.)", Reply: "(They pop the bottle and enjoy it together.)" },
				]
			},
			{ Text: "You the best Edleran, you wanna date me?", Audio: "70", AudioStyle: "cheerful" },
			{
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleCheer" },
					{ Name: "Lyn", Status: "Thief", Pose: "IdleCheer" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
				],
				Text: "Oh yeah!  That wud be great Lyn.  I lov u!", Audio: "80", AudioStyle: "cheerful"
			},
			{ Text: "(They clumsily hug each other and exchange a long drunken kiss.)" },
			{
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "FrenchKissEdlaranArcher", X: 500 }]
			},
			{ Text: "(They kiss and moan for a while, enjoying their new love.)" },
			{
				Entry: function() {
					PlatformDialogGetCharacter("Lyn").LoverName = "Edlaran";
					PlatformDialogGetCharacter("Edlaran").LoverName = "Lyn";
					PlatformDialogGetCharacter("Lyn").LoverLevel = 1;
					PlatformDialogGetCharacter("Edlaran").LoverLevel = 1;
					PlatformDialogRelationshipChange();
				},
				Text: "(Edlaran and Lyn are now girlfriends, the first lover stage.)" },
			{ Text: "(As Edlaran's lover, Lyn gets +10% walking & running speed.)" },
			{ Text: "(As Lyn's lover, Edlaran does +1 damage when attacking from the back.)" },
			{ Text: "(They wave at you and run tipsily to find a private room.)" },
			{
				Entry: function() { PlatformChar.splice(1, 100); PlatformTempEvent.push("EdlaranLynWineCellar"); },
				ID: "End", Text: "(You're now alone in the wine cellar.)",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "Idle" }]
			}
		]
	},

	{
		Name: "EdlaranLynWineCellarBreakUp",
		Music: "CastleHall",
		Dialog: [
			{
				Background: "WineCellar",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleAngry" },
					{ Name: "Lyn", Status: "Thief", Pose: "IdleAngry" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
				]
			},
			{ Text: "(Edlaran and Lyn are drinking again, but they are not drunk yet.  They seem to be arguing.)" },
			{ Text: "My love!  I don't have your money!  I don't care about it!", Audio: "10", AudioStyle: "angry" },
			{ Text: "Is that all that matters to you?  Do you love your money more than me?", Audio: "20", AudioStyle: "angry" },
			{
				Text: "Tell her Melody!", Audio: "30", AudioStyle: "angry",
				Answer: [
					{ Text: "All you need is love.", Reply: "Well said Melody.  We should make a song about it my love.  (She opens her arms for Lyn.)", Audio: "31", Goto: "StayTogether" },
					{ Text: "Money is important.", Reply: "Melody!  Not you also!  (She gets mad.)", Audio: "32", AudioStyle: "angry" },
					{ Text: "You need to repay your debt.", Reply: "What?  Love is more important than a debt!  (She gets mad.)", Audio: "33", AudioStyle: "angry" },
					{ Text: "Lyn loves you more than money.", Reply: "You're right Melody.  Let's not argue my love.  (She opens her arms for Lyn.)", Audio: "34", Goto: "StayTogether" },
				]
			},
			{
				Text: "Edlaran, I love you, but I cannot erase your debt.  A debt is a debt.", Audio: "40", AudioStyle: "angry",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleAngry", X: 750 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleAngry", X: 250 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
				]
			},
			{ Text: "I'm not your sugar mommy.  I don't have to pay for your parties.", Audio: "50", AudioStyle: "angry" },
			{ Text: "Honey, we are too different, maybe it's time to break up.", Audio: "60", AudioStyle: "serious" },
			{
				Text: "Melody, what do you think?", Audio: "70", AudioStyle: "serious",
				Answer: [
					{ Text: "Sadly, maybe you two should break up.", Reply: "(She sighs.)  Yeah, our couple isn't working well.", Audio: "71", AudioStyle: "serious" },
					{ Text: "I'm sure you can fix that money problem.", Reply: "(She nods slowly.)  Maybe you're right Melody, we can find a solution.  (She opens her arms for Edlaran.)", Audio: "72", Goto: "StayTogether" }
				]
			},
			{ Text: "It's over Edlaran, we need to break up.", Audio: "80", AudioStyle: "serious" },
			{
				Text: "(Edlaran and Lyn are no longer lovers.)",
				Entry: function() {
					delete PlatformDialogGetCharacter("Lyn").LoverName;
					delete PlatformDialogGetCharacter("Edlaran").LoverName;
					delete PlatformDialogGetCharacter("Lyn").LoverLevel;
					delete PlatformDialogGetCharacter("Edlaran").LoverLevel;
					PlatformDialogRelationshipChange();
				}
			},
			{ Text: "(Lyn loses her walking & running bonus.  Edlaran loses her back attack bonus.)" },
			{
				ID: "End", Text: "(They both leave with an angry face, leaving you alone in the wine cellar.)",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "Idle" }]
			},
			{ Entry: function() { PlatformChar.splice(1, 100); PlatformTempEvent.push("EdlaranLynWineCellar"); PlatformDialogLeave(); } },
			{
				ID: "StayTogether",
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "FrenchKissEdlaranArcher", X: 500 }]
			},
			{ Text: "(They hug each other and exchange a long and loving kiss.)" },
			{ Text: "I love you Edlaran.  You give me wild ideas.", Audio: "100", AudioStyle: "cheerful" },
			{ Text: "Let's go find a room that's more private.  (They giggle.)", Audio: "110", AudioStyle: "cheerful" },
			{
				Entry: function() { PlatformChar.splice(1, 100); PlatformTempEvent.push("EdlaranLynWineCellar"); },
				ID: "End", Text: "(They both run away, leaving you alone in the wine cellar.)",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "Idle" }]
			}
		]
	},

	{
		Name: "ChestRestraintsBeforeCurse",
		Music: "CastleDungeon",
		Exit : function () { PlatformEventSet("Curse"); PlatformLoadRoom(); },
		Dialog: [
			{
				Text: "(There's a huge metal chest.)",
				Background: "DungeonStorage",
				Character: [{ Name: "Chest", Status: "Metal", Pose: "Idle", X: 500 }],
			},
			{
				Text: "(It contains the dungeon restraints.)",
				Answer: [
					{ Text: "(Clean the restraints.)", Reply: "(You open the chest.)" },
					{ Text: "(Go do something else.)", Script: function() { PlatformDialogLeave(); } },
				]
			},
			{
				Text: "(There are many cuffs, shackles, chains, and collars.)",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "CleanRestraints" }]
			},
			{ Text: "(You start cleaning restraints one by one.)", Audio: "CommonChain" },
			{ Text: "(It's a lot of work, it will take you many hours.)" },
			{ Text: "(You clean, scrub, oil and repair the restraints.)" },
			{
				Background: "DungeonStorageDark",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "CurseStart" }],
				Text: "(As you finish your work, everything goes dark.)"
			},
			{ Text: "(You hear a loud woman scream coming from upstairs.)", Audio: "OliviaScream" },
			{ Text: "(The scream fades and everything becomes very silent.)" },
			{ Text: "(The world around you is dark, silent, and oppressing.)" },
			{
				Background: "DungeonStorage",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "CleanRestraints" }],
				Text: "(After a minute, the sun starts to shine again.)"
			},
			{ Text: "(You finish cleaning in a hurry and leave the chest.)" },
		]
	},

	{
		Name: "ChestRestraintsAfterCurse",
		Music: "CastleDungeon",
		Dialog: [
			{
				Text: "(The dungeon restraints are clean.)",
				Background: "DungeonStorage",
				Character: [{ Name: "Chest", Status: "Metal", Pose: "Idle", X: 500 }]
			}
		]
	},

	{
		Name: "OliviaCurseIntro",
		Music: "OliviaRoom",
		Exit : function () { PlatformEventSet("OliviaCurseIntro"); PlatformLoadRoom(); },
		Dialog: [
			{
				Text: "Melody!  (She tugs on the cuffs in vain.)", Audio: "10", AudioStyle: "terrified",
				Background: "BedroomOliviaFloor",
				Character: [{ Name: "Olivia", Status: "Oracle", Animation: "Bound", Y: -400 }]
			},
			{
				Text: "I'm relieved to see you.", Audio: "20",
				Answer: [
					{ Text: "Who dared to touch you?", Reply: "(She bows her head slowly.)", Domination: 1 },
					{ Text: "Poor Lady Olivia.", Reply: "I know this is scary Melody.", Audio: "22", AudioStyle: "terrified", Domination: -1 },
					{ Text: "What happened?", Reply: "(She takes a long deep breath.)" },
					{ Text: "(Spank her butt.)  You're cute in chains.", Reply: "(She whimpers and blushes.)  Thanks, but it's not the best time to be flirty.", Audio: "24", AudioStyle: "calm", Domination: 2, Love: 1, Perk: true }
				]
			},
			{ Text: "My sister Camille came from far away to visit the family.", Audio: "30" },
			{ Text: "She had a stern look on her face and a weird voice.", Audio: "40" },
			{ Text: "She talked privately with Mother for a long while, I think they had an argument.", Audio: "50" },
			{ Text: "I was hiding from the dispute in my room when darkness fell suddenly.", Audio: "60" },
			{
				Text: "Everything was black.", Audio: "70",
				Answer: [
					{ Text: "Did you hear that horrible scream?", Reply: "(She blushes.)  Sorry about that.  I did that scream.", Audio: "71", AudioStyle: "whispering", Love: -1 },
					{ Text: "I heard a woman scream.", Reply: "(She sighs.)  I did that scream.", Audio: "72", AudioStyle: "whispering" },
					{ Text: "I heard your voice in the dark.", Reply: "Wow, you recognized my scream from the dungeon?", Audio: "73", Love: 1 },
					{ Text: "I was terrified from a loud scream Miss.", Reply: "(She nods.)  Don't be scared Melody, I did that scream.", Audio: "74", Domination: -2, Perk: true }
				]
			},
			{ Text: "When darkness came, the maids came in my room with strange eyes.", Audio: "80" },
			{ Text: "They started to grab me, so I screamed.  Louder than I ever did.", Audio: "90" },
			{ Text: "I don't know what happened, but glass shattered everywhere and the maids fell unconscious.", Audio: "100" },
			{ Text: "I was scared and trembling, then Camille entered my room as light came back.", Audio: "110" },
			{ Text: "She slapped me and locked me up in these chains.  She said it was to protect me.", Audio: "120" },
			{ Text: "Camille took the key for these shackles and left me hogtied on the floor.", Audio: "130" },
			{
				Text: "I've been stuck since then.", Audio: "140",
				Answer: [
					{ Text: "I'll go kick her butt.", Reply: "Do you really think violence is the answer?  Be careful.", Audio: "141", Domination: 1, Love: -1 },
					{ Text: "Maybe I can beg her for the key.", Reply: "Negotiation might be possible but be careful.", Audio: "142", Domination: -1, Love: 1 },
					{ Text: "I'll see what I can do.", Reply: "(She nods.)  Be careful Melody.", Audio: "143" },
					{ Text: "There will be blood!", Reply: "(She struggles.)  Please don't kill her Melody.  She is my sister.", Audio: "144", Domination: 2, Love: -2, Perk: true }
				]
			},
			{ Text: "Camille is very dangerous.  She might kill you.", Audio: "150" },
			{ Text: "I think she went upstairs, maybe she's still there.", Audio: "160" },
			{ Text: "Best of luck if you go there.", Audio: "170" }
		]
	},

	{
		Name: "OliviaCurse",
		Music: "OliviaRoom",
		Dialog: [
			{
				Text: "Please be careful Melody.", Audio: "10", AudioStyle: "terrified",
				Background: "BedroomOliviaFloor",
				Character: [{ Name: "Olivia", Status: "Oracle", Animation: "Bound", Y: -400 }]
			},
			{ Text: "Camille is very dangerous.  She might kill you.", Audio: "20" },
			{ Text: "I think she went upstairs, maybe she's still there.", Audio: "30" },
			{ Text: "Best of luck if you go there.", Audio: "40" }
		]
	},

	{
		Name: "OliviaCurseRelease",
		Music: "OliviaRoom",
		Exit : function () { PlatformEventSet("OliviaCurseRelease"); PlatformPartyBuild(); PlatformLoadRoom(); },
		Dialog: [
			{
				Text: "Melody!  Are you alright?", Audio: "10", AudioStyle: "terrified",
				Background: "BedroomOliviaFloor",
				Character: [{ Name: "Olivia", Status: "Oracle", Animation: "Bound", Y: -400 }]
			},
			{
				Text: "Yes, I found your sister Camille in the Countess Hall.", Audio: "20",
				Background: "BedroomOlivia",
				Character: [{ Name: "Melody", Status: "Maid", Pose: "Idle" }]
			},
			{ Text: "She's behind that strange curse that's affecting everyone but us.", Audio: "30" },
			{ Text: "She was looking for Countess Isabella.", Audio: "40" },
			{ Text: "We talked a little, but she got mad and attacked me.", Audio: "50" },
			{ Text: "I was able to knock her down and restrain her.", Audio: "60" },
			{ Text: "She gave me this key to rescue you.", Audio: "70" },
			{ Text: "(You unlock Olivia.)", Audio: "CommonChain" },
			{
				Text: "(She stretches happily.)  Thank you so much Melody.", Audio: "80", AudioStyle: "cheerful",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{
				Text: "You're the best.", Audio: "90", AudioStyle: "cheerful",
				Answer: [
					{ Text: "It's my pleasure and duty.", Reply: "You're a wonderful protector.", Audio: "91", AudioStyle: "calm", Love: 1, Domination: 1 },
					{ Text: "I would do anything for you.", Reply: "You're the best friend ever.", Audio: "92", AudioStyle: "cheerful", Love: 2, Perk: true },
					{ Text: "Don't mention it.", Reply: "You're such a good friend.", Audio: "93", AudioStyle: "cheerful", Love: 1, Perk: false },
					{ Text: "(Do a maid curtsy.)", Reply: "You're a wonderful maid.", Audio: "94", AudioStyle: "calm", Domination: -1, Love: 1 },
				]
			},
			{ Text: "(Everything goes dark suddenly.)", Background: "BedroomOliviaDark" },
			{
				Text: "What's going on?", Audio: "100", AudioStyle: "terrified",
				Answer: [
					{ Text: "I don't know.  This is scary.", Reply: "(She nods.)  Maybe it's another curse from Camille.", Audio: "101", AudioStyle: "terrified", Domination: -1 },
					{ Text: "Another curse?", Reply: "Yes, it could be another curse.", Audio: "102", AudioStyle: "terrified" },
					{ Text: "Don't be afraid.  I'm here.", Reply: "(She gets closer to you.)  Maybe it's another curse from Camille.", Audio: "103", AudioStyle: "terrified", Domination: 1 },
					{ Text: "(Hold her in your arms.)", Reply: "(You hold each other close for a little while.)", Love: 1, Perk: true },
				]
			},
			{ Text: "Could she have more magic tricks?", Audio: "110", AudioStyle: "terrified" },
			{ Text: "She's restrained, she could be in danger.", Audio: "120", AudioStyle: "terrified" },
			{ Text: "(Darkness fades after a few seconds.)", Background: "BedroomOlivia" },
			{ Text: "It was faster than the previous time.  Is that a good sign?", Audio: "130" },
			{ Text: "Let's go check for Camille.  I'm worried for her.", Audio: "140" },
			{ Text: "(Olivia joined your party.  You can switch your active character at any save point.)" },
		]
	},

	{
		Name: "OliviaLearnMagic",
		Music: "OliviaRoom",
		Dialog: [
			{
				Background: "Black",
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "Flustered" }]
			},
			{ Text: "(Olivia seems to be sweating and breathing heavily.)" },
			{
				Text: "Mel... Mel, Mel... Melody!", Audio: "10", AudioStyle: "terrified",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Flustered" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
				Answer: [
					{ Text: "That's my name.", Reply: "It's...  It's no time for jokes...  It's...  It's the belt...", Audio: "11", AudioStyle: "terrified", Love: -1 },
					{ Text: "Are you in distress Miss Olivia?", Reply: "(She nods quickly.)  It's...  It's the belt...", Audio: "12", AudioStyle: "terrified", Domination: -1 },
					{ Text: "Who dared to touch you?", Reply: "No...  No one...  It's...  It's the belt...", Audio: "13", AudioStyle: "terrified", Domination: 1 },
					{ Text: "Was your belt activated?", Reply: "Yes!  (She nods quickly.)  Y, y, yes...  The belt...", Audio: "14", AudioStyle: "terrified", Love: 1, Perk: true }
				]
			},
			{ Text: "It's moving!  (She shivers without much control.)", Audio: "20", AudioStyle: "shouting" },
			{
				Text: "What...  What is going on?", Audio: "30", AudioStyle: "terrified",
				Answer: [
					{ Text: "I don't know.", Reply: "Why...  Why is it moving like that?", Audio: "31", AudioStyle: "terrified" },
					{ Text: "Everything will be fine sweetie.", Reply: "You...  You think?  Why is it moving like that?", Audio: "32", AudioStyle: "terrified", Love: 1 },
					{ Text: "That belt is cursed.", Reply: "It's...  It's a family tradition.  Why is it moving like that?", Audio: "33", AudioStyle: "terrified", Love: -1 },
					{ Text: "I'm scared Lady Olivia.", Reply: "Don't worry...  Ever...  Everything will be ah....", Audio: "34", AudioStyle: "terrified", Domination: -1, Perk: true }
				]
			},
			{ Text: "AaaaaaaAAAAHHH!" },
			{ Text: "(She starts to breath faster and faster.)" },
			{ Text: "MELODY!  Why...  Why am I sweating?", Audio: "50", AudioStyle: "shouting" },
			{
				Text: "Why am I so wet?", Audio: "60", AudioStyle: "terrified",
				Answer: [
					{ Text: "The chastity belt is training you.", Reply: "Train... Train...  Training me?  What...", Audio: "61", AudioStyle: "terrified", Domination: 1 },
					{ Text: "I'm sorry, I cannot help you.", Reply: "Don....  Don't worry...  You're a good...", Audio: "62", AudioStyle: "terrified", Domination: -1 },
					{ Text: "Relax and enjoy.  (Caress her hair.)", Reply: "(She looks confused.)  Relax, relax?   Enjoy, enjoy?", Audio: "63", AudioStyle: "calm", Love: 1 },
					{ Text: "Wake your naughty side.", Reply: "W... What?  No, no, no.  I cannot...", Audio: "64", AudioStyle: "terrified", Love: -1 }
				]
			},
			{ Text: "(She falls on her knees.)", Character: [{ Name: "Olivia", Status: "Oracle", Pose: "KneelOrgasm", Y: -400 }] },
			{ Text: "Aaaaahhh!  AAAAAAaaahhhh!" },
			{ Text: "EEEEEEEEEEEEEAAAAAAAAAAAAAAAAAHHHHHH!!!" },
			{ Text: "(She gets a shattering orgasm right in front of you.)" },
			{ Text: "(Everything goes dark for a second and becomes bright again.)" },
			{ Text: "(Her powerful scream rings in your ears, giving you a headache.)" },
			{ Text: "Oh...", Audio: "100", AudioStyle: "calm" },
			{ Text: "Melody...", Audio: "110", AudioStyle: "calm" },
			{
				Text: "(She stands up.)",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Flustered" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
			},
			{ Text: "It stopped moving.", Audio: "120", AudioStyle: "calm" },
			{
				Text: "I'm sorry.", Audio: "130", AudioStyle: "calm",
				Answer: [
					{ Text: "It's fine.  Are you alright?", Reply: "I don't know.", Audio: "131", AudioStyle: "calm" },
					{ Text: "Welcome to heaven.", Reply: "That was so...  so wonderful.", Audio: "132", AudioStyle: "calm", Love: 1 },
					{ Text: "That scream was horrible.", Reply: "I know, I could not control it.", Audio: "133", AudioStyle: "calm", Love: -1 },
					{ Text: "You're a woman now, an Oracle.", Reply: "(She nods.)  You might be right.", Audio: "134", AudioStyle: "calm", Domination: 1, Perk: true }
				]
			},
			{ Text: "I feel weird.  I feel different.", Audio: "140", AudioStyle: "calm" },
			{ Text: "It's like I've been sleeping and now I'm awake.", Audio: "150", AudioStyle: "calm" },
			{ Text: "Why did it become dark?  It's probably the same power that Camille is using.", Audio: "160" },
			{ Text: "Let's head out, there's something I'd like to try.", Audio: "170" },
			{ Text: "(Olivia can now use magic.  Her magic points will be shown in the upper corner.)", Audio: "180" },
			{ Text: "(Use the K key to scream and harm all enemies in the current area.)" }
		]
	},

	{
		Name: "CamilleIntro",
		Music: "CamilleCastleBattle",
		Dialog: [
			{
				Background: "CountessHall",
				Character: [{ Name: "Camille", Status: "Armor", Pose: "Angry" }]
			},
			{ Text: "(As you enter the countess hall, you can see Camille next to a closed iron gate.)" },
			{ Text: "(She yells at the gate furiously and doesn't seem to notice you.)" },
			{ Text: "Mother!  I swear on my blade and Father's grave that I will kill you if you don't open the gate.", Audio: "10" },
			{ Text: "OPEN NOW!  (She kicks the iron gate, but nothing happens.)", Audio: "20" },
			{ Text: "(She turns around and sees you.)" },
			{
				Text: "Melody.  It's been a while.", Audio: "30",
				Character: [
					{ Name: "Camille", Status: "Armor", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
				]
			},
			{
				Text: "The curse isn't working on you?", Audio: "40",
				Answer: [
					{ Text: "What curse?", Reply: "You've always been clueless little maid.", Audio: "41", Domination: -1 },
					{ Text: "So, you're the source of the zombies.", Reply: "They are not zombies.", Audio: "42", Love: -1 },
					{ Text: "Your tricks cannot affect me.", Reply: "You've gained some confidence since we last met.", Audio: "43", Domination: 1 },
					{ Text: "You're way too weak for me.", Reply: "You're not afraid of anything aren't you?", Audio: "44", Domination: 2, Perk: true }
				]
			},
			{ Text: "I don't know why you're not affected.  You've always been weird.", Audio: "50" },
			{ Text: "Mother might have selected you for that reason.  That old bitch!", Audio: "60" },
			{ Text: "Whatever it is, you're not welcome here.", Audio: "70" },
			{
				Text: "Get out!", Audio: "80",
				Answer: [
					{ Text: "Stop the curse and I'll go.", Reply: "You think I will obey you?", Audio: "81", Domination: 1 },
					{ Text: "I'm not going anywhere bitch.", Reply: "Now you're in trouble.", Audio: "82", Love: -2 },
					{ Text: "Please Lady Camille, you must stop that curse.", Reply: "Forget it Melody.", Audio: "83", Domination: -1, Love: 1 },
					{ Text: "(Get on your knees.) I beg you, Lady Camille.", Reply: "You're not worthy of my time.", Audio: "84", Domination: -2, Perk: true }
				]
			},
			{
				Text: "(She raises her arm, mumbles some words and an iron gate closes behind you.)",
				Character: [{ Name: "Camille", Status: "Armor", Pose: "Angry" }]
			},
			{ Text: "You're going down little maid.", Audio: "90" },
			{ Text: "(She draws her sword and advances toward you.)" },
		]
	},

	{
		Name: "CamilleDefeat",
		Music: "CamilleCastleBattle",
		Dialog: [
			{
				Text: "Mel...  Melody...  How could you...", Audio: "10",
				Background: "CountessHallFloor",
				Character: [{ Name: "Camille", Status: "Armor", Animation: "Bound", Y: -400 }]
			},
			{
				Text: "How could you defeat me?", Audio: "20",
				Answer: [
					{ Text: "Face it, you're not that strong.", Reply: "I underestimated you maid.", Audio: "21", Domination: 2 },
					{ Text: "I protect the manor.", Reply: "You've always been a loyal maid.", Audio: "22", Domination: 1, Love: 1 },
					{ Text: "It doesn't matter.", Reply: "You're very direct.", Audio: "23", Domination: 1, Love: -1 },
					{ Text: "The good Camille within you allowed me to win.", Reply: "The good Camille?  Don't...  Don't be ridiculous.", Audio: "24", Love: 2, Perk: true }
				]
			},
			{ Text: "(She struggles and sighs.)" },
			{ Text: "You know, I've always envied the relationship between you and Olivia.", Audio: "30" },
			{ Text: "You two were so close, like sisters.  I barely know my little sister.", Audio: "40" },
			{
				Text: "Do you think she will forgive me?", Audio: "50",
				Answer: [
					{ Text: "I don't know.", Reply: "Only time will tell.", Audio: "51" },
					{ Text: "She will hate you forever.", Reply: "Fine, I don't care.", Audio: "52", Love: -1, Domination: 1 },
					{ Text: "She will forgive you someday.", Reply: "You have a kind heart.", Audio: "53", Love: 1, Domination: -1 },
					{ Text: "I will convince her to forgive you.", Reply: "Thanks.  I don't think I deserve such good treatment from you.", Audio: "54", Love: 1, Domination: 1, Perk: true }
				]
			},
			{ Text: "Take these keys for her shackles and go rescue her.", Audio: "60" },
			{ Text: "(She gives you the key for Olivia's restraints.)", Audio: "70" },
			{
				Text: "Go help Olivia.", Audio: "80",
				Answer: [
					{ Text: "Stop the curse first.", Reply: "I'll need Mother for that.  Now go.", Audio: "81", Domination: 1 },
					{ Text: "Enjoy your struggles.", Reply: "(She tries to spit on you.)  Get lost.", Audio: "82", Love: -1 },
					{ Text: "I'll be back to help you.", Reply: "Very well, be quick.", Audio: "83", Love: 1 },
					{ Text: "(Nod slowly.)", Reply: "Run little maid.", Audio: "84", Love: 1, Domination: -1 },
				]
			},
			{ Text: "(She stares at the floor and stops talking.)" },
		]
	},

	{
		Name: "CamilleDefeatEnd",
		Music: "CamilleCastleBattle",
		Dialog: [
			{
				Text: "Go help Olivia.", Audio: "10",
				Background: "CountessHallFloor",
				Character: [{ Name: "Camille", Status: "Armor", Animation: "Bound", Y: -400 }]
			},
			{ Text: "(She stares at the floor and stays silent.)" },
		]
	},

	{
		Name: "CamilleEscape",
		Music: "CamilleCastleBattle",
		Dialog: [
			{
				Background: "CountessHall",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "(As you enter the countess hall, you see the open iron gates and that Camille is missing.)" },
			{ Text: "This is where you two had your battle?", Audio: "10" },
			{
				Text: "Where is she?", Audio: "20",
				Answer: [
					{ Text: "This is dangerous!  She escaped.", Reply: "Don't worry Melody.  I'm sure she learned her lesson.", Audio: "21", AudioStyle: "serious", Domination: -1, Perk: false },
					{ Text: "(Hide behind Lady Olivia.)", Reply: "(She moves to protect you.)  Don't worry little Melody.  I'm sure she learned her lesson.", Audio: "22", AudioStyle: "serious", Domination: -2, Perk: true },
					{ Text: "Damn bitch!  I'll track her down.", Reply: "(She gulps.)  Is violence always the answer?", Audio: "23", AudioStyle: "terrified", Domination: 1, Love: -1 },
					{ Text: "Let's investigate.", Reply: "Yes, she cannot be too far away.", Audio: "24" },
					{ Text: "Stay behind me, it could be a trap.", Reply: "(She nods and hides behind you.)", Domination: 1 },
				]
			},
			{ Text: "The terrace gate is open, let's see if she's there.", Audio: "30" },
			{ Text: "(She invites you to walk the countess hall.)" }
		]
	},

	{
		Name: "OliviaTerrace",
		Music: "MelodyRoom",
		Exit : function () { PlatformEventSet("OliviaTerrace"); PlatformLoadRoom(); },
		Dialog: [
			{
				Background: "Terrace",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "Where could they be?  (She starts to look around.)", Audio: "10" },
			{ Text: "Look!  There's a rope!  (She points to a tied rope, going down the manor wall.)", Audio: "20", AudioStyle: "shouting" },
			{ Text: "(She checks the rope carefully.)  This knot was made by Mother.", Audio: "30" },
			{ Text: "Trust me, I know her knots.  (She blushes.)", Audio: "40", AudioStyle: "calm" },
			{ Text: "Mother must have fled, and Camille chased her down.", Audio: "50" },
			{
				Text: "What should we do?", Audio: "60",
				Answer: [
					{ Text: "We could track them.", Reply: "It won't be easy, but if anyone can do it, it's you.", Audio: "61", Domination: 1 },
					{ Text: "Let's find a cure for that curse.", Reply: "(She smiles.)  Yes, we need to help our friends.", Audio: "62", AudioStyle: "cheerful", Love: 1 },
					{ Text: "It's safer to stay here.", Reply: "(She nods.)  I'm sure Mother will manage on her own.", Audio: "63", Domination: -1 },
					{ Text: "I don't know.", Reply: "(She sighs.)  I'm sure we'll figure a way to help.", Audio: "64", AudioStyle: "sad", Love: -1, Perk: false },
					{ Text: "We will find her and cure everyone.", Reply: "(She nods happily.)  I know we can do it.", Audio: "65", AudioStyle: "cheerful", Love: 2, Perk: true }
				]
			},
			{ Text: "Whatever you do Melody.  I will be there with you.", Audio: "70", AudioStyle: "cheerful" },
			{
				TextScript: function () {
					let Love = PlatformDialogGetCharacter("Olivia").Love - 10;
					let Dom = PlatformDialogGetCharacter("Olivia").Domination;
					if ((Love >= 5) && (Love >= Math.abs(Dom))) return "My dear Olivia, together we are unstoppable.";
					if ((Love >= 0) && (Love >= Math.abs(Dom))) return "Olivia, I'm glad we are in this mess together.";
					if (Dom >= 5) return "Little lady, I'll be there to lock you up every night.";
					if (Dom >= 0) return "Olivia, I'll be there to protect you.";
					if (Dom <= -5) return "Lady Olivia, your maid will be there to serve and obey you.  (You do a maid curtsy.)";
					return "Lady Olivia, I'll be there to help you.";
				},
				AudioScript: function () {
					let Love = PlatformDialogGetCharacter("Olivia").Love - 10;
					let Dom = PlatformDialogGetCharacter("Olivia").Domination;
					if ((Love >= 5) && (Love >= Math.abs(Dom))) return "81";
					if ((Love >= 0) && (Love >= Math.abs(Dom))) return "82";
					if (Dom >= 5) return "83";
					if (Dom >= 0) return "84";
					if (Dom <= -5) return "85";
					return "86";
				},
				Character: [{ Name: "Melody", Status: "Maid", Pose: "Idle" }]
			},
			{
				Entry: function() {
					if (PlatformDialogGetCharacter("Olivia").Love < 17) PlatformDialogGoto = "End";
					PlatformDialogProcess();
				},
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "(She blushes.)  There's something I'd like to ask you.", Audio: "100", AudioStyle: "whispering" },
			{
				Text: "Can...  Can I kiss you?", Audio: "110", AudioStyle: "whispering",
				Answer: [
					{ Text: "Of course, my love.  (Kiss her.)", Reply: "(You both get closer and prepare for a long kiss.)", Love: 1 },
					{ Text: "(Grab her and kiss her.)", Reply: "(You grab her waist and bring her closer for a long kiss.)", Domination: 1 },
					{ Text: "(Blush and giggle.)", Reply: "(She grabs your waist and brings you closer for a long kiss.)", Domination: -1 },
					{ Text: "Sorry, it wouldn't be appropriate.", Reply: "(She sighs.)  I guess you're right.  Let's head for our next mission.", Audio: "114", AudioStyle: "sad", Love: -2, Goto: "End" },
				]
			},
			{
				Entry: function() {
					PlatformEventSet("OliviaTerraceKiss");
					PlatformAddExperience(PlatformPlayer, 10);
					if (PlatformDialogGetCharacter("Olivia").Domination < 0) PlatformDialogCharacterDisplay[0].Pose = "KissMaidMelodySub";
				},
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "KissMaidMelody" }]
			},
			{ Text: "(You exchange a long and passionate kiss.)" },
			{ Text: "(Time seems to stop as you feel her sweet lips on yours.)" },
			{ Text: "(You both moan slowly as you taste each other mouth for the first time.)" },
			{
				Text: "(You separate after a little while and smile at each other.)",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ ID: "End", Text: "Should we go down that rope?", Audio: "150" },
			{ Text: "(She points to the rope that runs down the castle wall.)" }
		]
	},

	{
		Name: "EdlaranTerrace",
		Music: "MelodyRoom",
		Dialog: [
			{
				Background: "Terrace",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "Where are they?", Audio: "10" },
			{ Text: "(She looks at Olivia.)" },
		]
	},

	{
		Name: "OliviaCabin",
		Music: "MelodyRoom",
		Exit : function () { PlatformEventSet("OliviaCabin"); },
		Dialog: [
			{
				Background: "ForestCabinInterior",
				Entry: function() {
					if (PlatformEventDone("OliviaCabin")) PlatformDialogGoto = "End";
					PlatformDialogProcess();
				}
			},
			{
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "Way before the war, when I was a child, Father used to bring us to this hunting cabin.", Audio: "10" },
			{ Text: "Mother and sister kept complaining about mosquitos, but I loved the fresh air.", Audio: "20" },
			{ Text: "Father said that me and Camille needed to learn on how to survive in the forest.  That real life is harsher than a comfy manor.", Audio: "30" },
			{
				Text: "I guess he was right.  (She sighs.)", Audio: "40", AudioStyle: "sad",
				Answer: [
					{ Text: "The forest is a scary place.", Reply: "Don't worry Melody, we will be fine.", Audio: "41", AudioStyle: "serious", Domination: -1 },
					{ Text: "(Nod in agreement.)", Reply: "(She nods and puts another log in the fireplace.)" },
					{ Text: "The Count educated you well.", Reply: "(She bows her head slowly.)  He did.", Audio: "43", AudioStyle: "calm", Domination: 1 },
					{ Text: "(Put a log in the fireplace.)", Reply: "Thanks Melody, I was getting cold.", Audio: "44", AudioStyle: "cheerful", Love: 1, Perk: true },
				]
			},
			{ Text: "Father is dead, Mother is gone, and sister went insane.", Audio: "50", AudioStyle: "sad" },
			{
				Text: "I'm all alone now.", Audio: "60", AudioStyle: "sad",
				Answer: [
					{ Text: "Learn to accept it.", Reply: "(She sighs and nods.)  Complaining will not solve anything.", Audio: "61", AudioStyle: "sad", Love: -1 },
					{ Text: "I know how you feel.", Reply: "As an orphan, you must certainly understand.", Audio: "62", AudioStyle: "sad" },
					{ Text: "You're not alone, you have me.", Reply: "(She smiles at you.)  I do, thanks my friend.", Audio: "63", Love: 1 },
				]
			},
			{
				ID: "End",
				Prerequisite: function() { return !PlatformDialogIsLover("Olivia") && !PlatformDialogIsSlave("Olivia") && !PlatformDialogIsOwner("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "Back" }],
				Text: "(She warms herself by the fireplace and gets lost in her thoughts.)"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia") && !PlatformDialogIsSlave("Olivia") && !PlatformDialogIsOwner("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "FrenchKissMaidMelody", X: 500 }],
				Text: "I love you sweetie.  (You exchange a lovely kiss.)", Audio: "210", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Olivia") && PlatformDialogIsSlave("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "KneelMaidMelody", X: 500 }],
				Text: "(She kneels close to you.)  I will not go in the woods alone Miss.", Audio: "220", AudioStyle: "calm"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia") && PlatformDialogIsSlave("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "KneelLoverMaidMelody", X: 500 }],
				Text: "(She kneels and hugs your legs lovingly.)  I will not go in the woods without you Miss.", Audio: "230", AudioStyle: "calm"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Olivia") && PlatformDialogIsOwner("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "StrictMaidMelodyKissFeet", X: 500 }],
				Text: "(She points to her feet as you bend to kiss her boots.)  That's a good pet.", Audio: "240", AudioStyle: "serious"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia") && PlatformDialogIsOwner("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "MaidMelodyKissFeet", X: 500 }],
				Text: "(She points to her feet as you bend to kiss her boots.)  I love you my pet.", Audio: "250", AudioStyle: "serious"
			}

		]
	},

	{
		Name: "EdlaranCabin",
		Music: "MelodyRoom",
		Exit : function () { PlatformEventSet("EdlaranCabin"); },
		Dialog: [
			{
				Background: "ForestCabinInterior",
				Entry: function() {
					if (PlatformEventDone("EdlaranCabin")) PlatformDialogGoto = "End";
					PlatformDialogProcess();
				}
			},
			{
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" }
				]
			},
			{ Text: "I love this cabin, it's a good place to hide and get a free lunch.", Audio: "10" },
			{ Text: "I mean... it would be a good place to hide and eat, since it's my first time here.", Audio: "20" },
			{
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" }
				],
				Text: "Edlaran, this hunting cabin used to belong to my late father.", Audio: "30", AudioStyle: "angry",
			},
			{ Text: "You should not break in to sleep or get a free meal.  This is not appropriate.", Audio: "40", AudioStyle: "angry" },
			{
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				],
				Text: "Is it a crime to sleep in an unoccupied cabin?  Don't answer.", Audio: "50"
			},
			{ Text: "It's easy to judge others when you're rich and never knew cold or hunger.", Audio: "60" },
			{
				Text: "Tell her Melody.", Audio: "70",
				Answer: [
					{ Text: "I don't want to get involved.", Reply: "Yeah, she would not understand anyway.", Audio: "71" },
					{ Text: "Breaking in the cabin is wrong.", Reply: "(She looks disappointed.)  Don't side with her rich family.", Audio: "72", AudioStyle: "sad", Love: -2, Script: function() { PlatformDialogAlterProperty("Olivia", "Love", 2); } },
					{ Text: "House Alberus can share its cabin.", Reply: "Thanks Melody!  (She pulls her tongue at Olivia.)", Audio: "73", AudioStyle: "cheerful", Love: 2, Script: function() { PlatformDialogAlterProperty("Olivia", "Love", -2); } },
					{ Text: "No jury would convict you Edlaran.", Reply: "(She nods.)  There's nothing wrong with finding some shelter.", Audio: "74", Love: 1, Perk: true },
				]
			},
			{ Text: "(She looks around.)  This cabin can be our new castle.", Audio: "80" },
			{
				Text: "I'll use the big chair as my throne.", Audio: "90", AudioStyle: "cheerful",
				Answer: [
					{ Text: "Girl, the throne is mine.", Reply: "(She gulps.)  You can have the comfy chair.", Audio: "91", AudioStyle: "terrified", Domination: 2 },
					{ Text: "You'll make a good cabin queen.", Reply: "(She smirks.)  Cabin queen?  I like it.", Audio: "92", AudioStyle: "cheerful", Domination: -2 },
					{ Text: "This is not a throne.", Reply: "(She laughs.)  You need to use your imagination.", Audio: "93", AudioStyle: "cheerful" },
					{ Text: "Lady Olivia should have the throne.", Reply: "(She sighs.)  You're no fun.", Audio: "94", AudioStyle: "sad", Love: -1 },
				]
			},
			{
				ID: "End",
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran") && !PlatformDialogIsSlave("Edlaran") && !PlatformDialogIsOwner("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "Idle" }],
				Text: "Let's rest while we can, we have a long journey ahead.", Audio: "100"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran") && !PlatformDialogIsSlave("Edlaran") && !PlatformDialogIsOwner("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "FrenchKissMaidMelody" }],
				Text: "A quick kiss before we travel again.  (You share a loving kiss.)", Audio: "110", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran") && PlatformDialogIsSlave("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "SpankedMaidMelody", X: 500 }],
				Text: "(You give your girl a playful spank on the butt before resuming your adventure.)"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran") && PlatformDialogIsSlave("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "GropedMaidMelody", X: 500 }],
				Text: "(You grab your lover with strength and grope her breast as she moans.)"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran") && PlatformDialogIsOwner("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "MasturbateMaidMelodyUnderDress" }],
				Text: "Don't forget who you belong to.  (She slides her hand under your dress and pinches your pussy lips.)", Audio: "120", AudioStyle: "angry"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran") && PlatformDialogIsOwner("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "MasturbateMaidMelodyUnderDress" }],
				Text: "(She slides her hand under your dress and touches your pussy playfully.)  Tonight, you're mine my love.", Audio: "130", AudioStyle: "cheerful"
			}

		]
	},

	{
		Name: "LynCabin",
		Music: "MelodyRoom",
		Exit : function () { PlatformEventSet("LynCabin"); },
		Dialog: [
			{
				Background: "ForestCabinInterior",
				Entry: function() {
					if (PlatformEventDone("LynCabin")) PlatformDialogGoto = "End";
					PlatformDialogProcess();
				}
			},
			{
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleHappy" },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "(Lyn and Edlaran are talking loudly and laughing.)" },
			{ Text: "Hey Melody!  We're talking about our old businesses.", AudioStyle: "cheerful", Audio: "10" },
			{
				Text: "I hope you don't mind if we joke about crimes.", AudioStyle: "cheerful", Audio: "20",
				Answer: [
					{ Text: "I don't care.", Reply: "(She nods.)  These are old stories anyway.", Audio: "21" },
					{ Text: "You're free women.", Reply: "(She smirks.)  Damn right!  These are old stories anyway.", Audio: "22", Love: 1, Domination: -1 },
					{ Text: "You should not be proud of that.", Reply: "(She gulps and nods.)  I understand, these are old stories anyway.", Audio: "23", Love: -1, Domination: 1 },
				]
			},
			{ Text: "The past is the past.  You cannot change it.", Audio: "30" },
			{ Text: "Back then, Edlaran was my minion, my partner in crime.", Audio: "40" },
			{ Text: "She borrowed lots of money for parties.  You better not forget your debt Edlaran.  A debt is a debt.", Audio: "50" },
			{ Text: "(Edlaran looks down and nods slowly.)" },
			{
				Text: "Maybe I should boss that girl again.", AudioStyle: "serious", Audio: "60",
				Answer: [
					{ Text: "She needs some strict discipline.", Reply: "(She smirks and nods.)  Damn right girl!", Audio: "61", Domination: -2, Script: function() { PlatformDialogAlterProperty("Edlaran", "Domination", 2); } },
					{ Text: "She's doing fine on her own.", Reply: "(She bows her head.)  Maybe you're right.", Audio: "62", Domination: 2, Script: function() { PlatformDialogAlterProperty("Edlaran", "Domination", -2); } },
					{ Text: "Let's all be equals.", Reply: "(She shrugs.)  If you think so.", Audio: "63" },
					{ Text: "I should boss you both.", Reply: "(She bows her head.)  That could also work.", Audio: "64", Domination: 2, Script: function() { PlatformDialogAlterProperty("Edlaran", "Domination", 2); } },
				]
			},
			{ Text: "Anyway!  Let's rest while we can, we can also talk about shady plans.", Audio: "70" },
			{
				ID: "End",
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn") && !PlatformDialogIsSlave("Lyn") && !PlatformDialogIsOwner("Lyn"); },
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "Curious" }],
				Text: "(She ponders out loud.)  Maybe we could use this cabin to hide a ransomed girl.", Audio: "80"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn") && !PlatformDialogIsSlave("Lyn") && !PlatformDialogIsOwner("Lyn"); },
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "FrenchKissMaidMelody", X: 500 }],
				Text: "Honey, this cabin is kind of romantic.  (She gets closer for a loving kiss.)", Audio: "90", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn") && PlatformDialogIsSlave("Lyn"); },
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "KneelLeft", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "StareDownRight", X: 500 },
				],
				Text: "Please enjoy the cabin Boss.  (She gets comfy on her knees and smiles at you.)", Audio: "100", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn") && PlatformDialogIsSlave("Lyn"); },
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "FrenchKissMaidMelody", X: 500 }],
				Text: "(You grab her by surprise and kiss her forcefully.  She seems to enjoy it and moans slowly.)", Audio: "110", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn") && PlatformDialogIsOwner("Lyn"); },
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "Tickle" }],
				Text: "Be a good minion Melody.  (She tickles you playfully before letting you go.)", Audio: "120", AudioStyle: "angry"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn") && PlatformDialogIsOwner("Lyn"); },
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "Tickle" }],
				Text: "You're such a cute minion honey.  (She tickles you playfully before letting you go.)", Audio: "130", AudioStyle: "cheerful"
			}

		]
	},

	{
		Name: "IntroForestBanditEdlaran",
		Music: "ForestTheme",
		Exit : function () { PlatformEventSet("IntroForestBandit"); },
		Dialog: [
			{
				Background: "ForestBirchLight",
				Character: [{ Name: "Vera", Status: "Leather", Pose: "Grumpy" }]
			},
			{ Text: "(As you venture deeper in the woods, a shady lady jumps in front in you.)" },
			{ Text: "You're finally back Edlaran.  I don't know why you're accompanied.", Audio: "10" },
			{ Text: "How was the manor raid?  Any good loot to repay your debt to Boss Lyn?", Audio: "20" },
			{
				Text: "What?  A manor raid?  Loot?  Debt to Boss Lyn?  Do I know you?", Audio: "30",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Vera", Status: "Leather", Pose: "Grumpy" }
				]
			},
			{
				Text: "I don't know what she's talking about.", Audio: "40",
				Answer: [
					{ Text: "She's mistaken you for someone else.", Reply: "Exactly!  That peasant girl is confused.", Audio: "41", AudioStyle: "cheerful", Domination: -1, Love: 1 },
					{ Text: "I think you know what's going on.", Reply: "(She shakes her head.)  That girl is delirious.", Audio: "42" },
					{ Text: "You will be punished later Edlaran.", Reply: "(She bows her head and ponders for a few seconds.)", Domination: 2, Love: -1 },
				]
			},
			{ Text: "We are on an official mission with her Highness Lady Olivia of House Alber...  Albersomething.", Audio: "50", AudioStyle: "serious" },
			{ Text: "Move out of the way or you'll get hurt.", Audio: "60", AudioStyle: "serious" },
			{
				Text: "(She stares at your group.)",
				Character: [{ Name: "Vera", Status: "Leather", Pose: "Angry" }]
			},
			{ Text: "Lady Olivia, you say?  Thanks for the tip, she would fetch a good ransom.", Audio: "90" },
			{
				Text: "What?  That wasn't a tip.", Audio: "100",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive" },
					{ Name: "Vera", Status: "Leather", Pose: "Angry" }
				],
				Answer: [
					{ Text: "She knows too much now.", Reply: "That's very true, we'll need to get rid of the bandits.", Audio: "101", AudioStyle: "cheerful", Love: 1 },
					{ Text: "Edlaran, you're an idiot.", Reply: "That's not fair!  Damn it, let's get rid of the bandits.", Audio: "102", AudioStyle: "calm", Domination: 1, Love: -2 },
					{ Text: "Oh my!  What do we do?", Reply: "Don't stand there like a tree, we must get rid of the bandits.", Audio: "103", AudioStyle: "serious", Domination: -2 },
					{ Text: "(Wink at Edlaran and flank the bandit.)", Reply: "(She winks back as you both flank her.)", Love: 2, Perk: true },
				]
			},
			{ Text: "Attack!", Audio: "110", AudioStyle: "shouting" },
		]
	},

	{
		Name: "IntroForestBanditOlivia",
		Music: "ForestTheme",
		Exit : function () { PlatformEventSet("IntroForestBandit"); },
		Dialog: [
			{
				Background: "ForestBirchLight",
				Character: [{ Name: "Vera", Status: "Leather", Pose: "Grumpy" }]
			},
			{ Text: "(As you venture deeper in the woods, a shady lady jumps in front in you.)" },
			{ Text: "Well, well, well, who dares to enter our forest?", Audio: "10" },
			{ Text: "(She looks at Olivia carefully.)" },
			{ Text: "Wait... aren't you some kind of royalty?", Audio: "20" },
			{
				Text: "You're the Countess daughter!", Audio: "30",
				Character: [
					{ Name: "Vera", Status: "Leather", Pose: "Angry" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive" }
				],
				Answer: [
					{ Text: "You're mistaken.", Reply: "I'm not mistaken at all.", Audio: "31" },
					{ Text: "Get lost or you'll get hurt.", Reply: "You think a maid can scare me?", Audio: "32" },
					{ Text: "Please don't give us trouble.", Reply: "You've set yourself in trouble.", Audio: "33" },
				]
			},
			{ Text: "She will fetch a great ransom.  Boss Lyn will be happy.", Audio: "40" },
			{ Text: "Get her!  (The bandits attack you.)", Audio: "50" },
		]
	},

	{
		Name: "IntroForestBanditKidnapEdlaran",
		Music: "ForestTheme",
		Exit : function () { PlatformEventSet("EdlaranForestIntro"); },
		Dialog: [
			{
				Background: "OakHeavy",
				Character: [
					{ Name: "Vera", Status: "Leather", X: 600, Pose: "StareDownRight" },
					{ Name: "Edlaran", Status: "Archer", X: 700, Animation: "Bound" }
				]
			},
			{ Text: "(Next to a giant oak, you find a forest bandit tormenting a bound elf.)" },
			{ Text: "This is your last warning!  Pay your debt to Boss Lyn or I cut your pretty ears Edlaran.", Audio: "10" },
			{ Text: "(She pulls out a knife, and the elf notices you.)" },
			{
				Text: "Help!  Please!", Audio: "20", AudioStyle: "shouting",
				Character: [
					{ Name: "Edlaran", Status: "Archer", X: 1100, Animation: "Bound" },
					{ Name: "Vera", Status: "Leather", X: 1000, Pose: "StareDownRight" },
					{ Name: "Melody", Status: "Maid", X: 400, Pose: "Idle" },
					{ Name: "Olivia", Status: "Oracle", X: 0, Pose: "IdleAngry" }
				],
				Answer: [
					{ Text: "Let her go.  Now!", Reply: "(The bandit grumbles and turns to you.)", Domination: 2 },
					{ Text: "Can we please pay her debt?", Reply: "(The bandit smirks and turns to you.)", Domination: -2 },
					{ Text: "This is none of my business.", Reply: "(The bandit turns to you.)" },
				]
			},
			{
				Text: "It seems I have more urgent matters to settle first.  Don't try anything Edlaran.", Audio: "30",
				Character: [{ Name: "Vera", Status: "Leather", Pose: "Grumpy" }]
			},
			{ Text: "(She charges toward you.)" }
		]
	},

	{
		Name: "EdlaranForestBeg",
		Music: "ForestTheme",
		Dialog: [
			{
				Background: "OakHeavy",
				Character: [{ Name: "Edlaran", Status: "Archer", Animation: "Bound" }]
			},
			{ Text: "Help!  One of these bandits must have the keys to these chains.", Audio: "10" },
			{ Text: "(She struggles in vain and whimpers.)" },
			{ Entry: function() { if (!PlatformEventDone("EdlaranForestKey")) PlatformDialogLeave(); else PlatformDialogProcess(); } },
			{
				Text: "Do you have the key?", Audio: "20",
				Answer: [
					{ Text: "I don't.  (Leave her.)", Reply: "(She sighs and nods.)", Script: function() { PlatformDialogLeave(); } },
					{ Text: "It's the least I can do.  (Unlock her.)", Reply: "(She nods slowly as you unlock her.)", Domination: -2, Love: 1 },
					{ Text: "You owe me a big favor.  (Unlock her.)", Reply: "(The gulps as you unlock her.)", Domination: 2, Love: 1 },
					{ Text: "Get up sexy elf.  (Unlock her.)", Reply: "(She smiles as you unlock her.)", Love: 2 },
				]
			},
			{
				Text: "Thanks!  You're the best.", Audio: "30", AudioStyle: "cheerful",
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy" }]
			},
			{
				Text: "I owe you one.  I could help you against these bandits or in your adventures.", Audio: "40", AudioStyle: "cheerful",
				Entry: function() { PlatformEventSet("EdlaranJoin"); PlatformPartyBuild(); PlatformLoadRoom(); }
			},
			{
				Text: "I'm Edlaran.  I know how to fight, shoot and plunder.  I also know these woods.", Audio: "50",
				Answer: [
					{ Text: "Deal!  You can join our quest.", Reply: "(She gives you a thumbs up.)", Love: 1 },
					{ Text: "Fine, but don't steal from us.", Reply: "Of course.  (She rolls her eyes up.)", Audio: "52", AudioStyle: "serious", Domination: 1 },
					{ Text: "Fine, it will share the burden.", Reply: "I can share anything.  (She giggles.)", Audio: "53", AudioStyle: "cheerful", Domination: -1 },
					{ Text: "Ok, but don't touch Lady Olivia.", Reply: "Very well, I won't.", Audio: "54", AudioStyle: "calm" },
				]
			},
			{ Text: "Just let me know what's going on and I'll be your best shooter.", Audio: "60" },
			{ Text: "(You take some time to tell her about the castle, the curse and the quest.)" },
			{ Text: "Thanks!  Let's go!", Audio: "70", AudioStyle: "cheerful" },
			{ Text: "(Edlaran joined your party.  You can switch your active character at any save point.)" },
		]
	},

	{
		Name: "ForestLost",
		Music: "ForestTheme",
		Dialog: [
			{
				Background: "ForestMaze",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "Wait... didn't we walk on that path a few minutes ago?", Audio: "10" },
			{ Text: "Yes!  It's the exact same tree!  And the same rock!", Audio: "20" },
			{ Text: "How is that possible?  We followed the path.  Did we?", Audio: "30" },
			{
				Text: "Where should we go?", Audio: "40",
				Answer: [
					{ Text: "Let's go straight on the path.", Reply: "(She nods as you walk together.)", Script: function() { PlatformLoadRoom("ForestBirchEast"); } },
					{ Text: "Let's turn left here.", Reply: "(She nods as you walk together.)", Script: function() { PlatformLoadRoom("ForestBirchMaze"); }  },
					{ Text: "We should go right.", Reply: "(She nods as you walk together.)", Script: function() { PlatformLoadRoom("ForestOakHeavy"); }  },
					{ Text: "We should go back.", Reply: "(She nods as you walk together.)", Script: function() { PlatformLoadRoom("ForestBirchCenter"); }  },
				]
			},
		]
	},

	{
		Name: "ForestPath",
		Music: "ForestTheme",
		Dialog: [
			{
				Background: "ForestMaze",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" }
				]
			},
			{ Text: "Wait... didn't we walk on that path a few minutes ago?", Audio: "10" },
			{ Text: "Yes!  It's the exact same tree!  And the same rock!", Audio: "20" },
			{ Text: "How is that possible?  We followed the path.  Did we?", Audio: "30" },
			{
				Text: "(Edlaran steps forward.)  Move over princess.", Audio: "40",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy" },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleAngry" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "You could not find your way out of your own golden bathroom.", Audio: "50" },
			{ Text: "(She inspects the forest for a while.)" },
			{ Text: "I see what's going on, this place is a clever maze.", Audio: "70" },
			{
				Text: "Let me guide the group.  I'll show you the way.", Audio: "80",
				Answer: [
					{ Text: "Guide us Edlaran.", Script: function() { PlatformDialogStart("ForestTrap"); } },
					{ Text: "I fully trust you Edlaran.", Domination: -1, Love: 1, Script: function() { PlatformDialogStart("ForestTrap"); } },
					{ Text: "Fine.  Don't get us lost.", Domination: 1, Love: -1, Script: function() { PlatformDialogStart("ForestTrap"); } },
					{ Text: "No!  We're going this way.", Reply: "(She sighs as everyone follows you.)", Script: function() { PlatformLoadRoom("ForestBirchMaze"); }  },
				]
			},
		]
	},

	{
		Name: "ForestTrap",
		Music: "ForestTheme",
		Exit : function () { PlatformEventSet("ForestCapture"); PlatformPartyActivate("Olivia"); },
		Dialog: [
			{
				Text: "(Edlaran finds many hidden paths and guides you in the forest.)",
				Background: "ForestMaze",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{ Text: "(She tracks the steps on the ground and helps you to avoid bandits.)" },
			{ Text: "This forest is full of thieves, we'll try to avoid them.", Audio: "1" },
			{ Text: "If you see a bandit boss with red hair, be extra careful.  Her name is Lyn, she's their leader.", Audio: "2" },
			{ Text: "Oh!  And if Lyn tells you about some debt, she's lying.  (She winks and follows the path.)", Audio: "3" },
			{ Text: "(As you walk in the woods, Olivia steps on a rope.)" },
			{
				Text: "(A huge cloud of smoke springs for the ground.)",
				Background: "Gas",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive" },
					{ Name: "Melody", Status: "Maid", Pose: "Alert" }
				]
			},
			{ Text: "That smoke!  (She coughs.)  It is coming from the soil.", Audio: "10", AudioStyle: "terrified" },
			{ Text: "(She coughs.)  Where is Edlaran?", Audio: "20", AudioStyle: "angry" },
			{
				Text: "I feel sick. (She coughs deeper, getting dizzy.)", Audio: "30", AudioStyle: "terrified",
				Answer: [
					{ Text: "Everyone is afraid!", Reply: "(She whimpers and starts to get dizzy.)", Love: -1, Domination: -1 },
					{ Text: "That cloud is toxic.", Reply: "(She nods and starts to get dizzy.)", },
					{ Text: "I will protect you.", Reply: "(She smiles and starts to get dizzy.)", Love: 1, Domination: 1 },
					{ Text: "Edlaran!", Reply: "(You scream as she starts to get dizzy.)", },
				]
			},
			{
				Text: "Melody!  Mel...  (Her eyes roll up and her knees get weak.)", Audio: "40", AudioStyle: "terrified",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive" },
					{ Name: "Melody", Status: "Maid", Pose: "Alert" }
				]
			},
			{
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "CarrySleepingOlivia", X: 500 },
				]
			},
			{ Text: "(She passes out in your arms as you start coughing.)" },
			{ Text: "(You carry her through the smoke, getting dizzy.)" },
			{ Text: "(You run in the thick cloud, hurting yourself on trees.)" },
			{ Text: "(You feel sick, sleepy and disoriented.)" },
			{
				Background: "Black",
				Text: "(Everything turns dark...)",
				Character: []
			},
			{ Text: "(...)" },
			{
				Background: "BarnInterior",
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "Curious" }]
			},
			{ Text: "You're waking up?  Good.", Audio: "100" },
			{ Text: "We have a long trip ahead your highness.", Audio: "110" },
			{ Text: "You must be wondering why you're restrained.", Audio: "120" },
			{ Text: "That gag isn't pleasant, but it's necessary.", Audio: "130" },
			{
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Curious" },
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGagged" },
				]
			},
			{ Text: "We don't want a screamer while we travel.", Audio: "140" },
			{
				Text: "Mmmgnh!  Uuungmm mn!",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGagged", X: 1000 },
					{ Name: "Lyn", Status: "Thief", Pose: "Curious", X: 500 }
				]
			},
			{
				Text: "Don't be afraid, we are bringing you back to your husband, the Duke.", Audio: "160",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Curious" },
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGagged" },
				]
			},
			{ Text: "He will surely pay a huge amount to see you safe.", Audio: "170" },
			{ Text: "Business is business, and your little ass will be good business.", Audio: "175" },
			{
				Text: "Aaamh mmhmm Mmmnndy!  Mh maaym!",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGagged", X: 1000 },
					{ Name: "Lyn", Status: "Thief", Pose: "Pretty", X: 500 }
				]
			},
			{
				Text: "We cannot bring your maid.  She will be sold in a nearby town.", Audio: "190",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Pretty" },
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGagged" },
				]
			},
			{ Text: "It's better than to be left for the crows.", Audio: "200" },
			{ Text: "Exercise your legs, we will leave soon.", Audio: "210" },

		]
	},

	{
		Name: "BarnThief",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "BarnInterior",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Curious" },
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGagged" },
				]
			},
			{ Text: "I'm not letting you out of the barn.", Audio: "10" },
			{ Text: "Your husband will pay a royal ransom for you.", Audio: "20" },
			{ Text: "Exercise your legs, we will leave soon.", Audio: "30" },
		],
	},

	{
		Name: "ForestBanditCrate",
		Music: "ForestTheme",
		Exit : function () { PlatformEventSet("ForestBanditCrate"); },
		Dialog: [
			{
				Background: "SecludedClearing",
				Character: [
					{ Name: "Vera", Status: "Leather", Pose: "Angry" },
					{ Name: "Crate", Status: "Wood", Pose: "Idle" },
					{ Name: "Lucy", Status: "Armor", Pose: "Idle" },
				]
			},
			{ Text: "(Two thieves are watching a crate and talking.)" },
			{ Text: "This is boring.  When is that slave trader coming?", Audio: "10" },
			{ Text: "Did you bring some cards or some...", Audio: "20" },
			{ Text: "(She turns to Edlaran.)" },
			{ Text: "It seems we have a rat.  Get her!", Audio: "30" },
		],
	},

	{
		Name: "MelodyCrate",
		Music: "ForestTheme",
		Dialog: [
			{
				Background: "SecludedClearing",
				Character: [
					{ Name: "Crate", Status: "Wood", Pose: "Idle" },
				],
				Entry: function() {
					if ((PlatformChar[2].Bound == true) && (PlatformChar[3].Bound == true) && !PlatformEventDone("ForestCaptureRescueMelody")) PlatformDialogStart("MelodyCrateOpen");
				}
			},
			{ TextScript: function () { return (PlatformEventDone("ForestCaptureRescueMelody")) ? "(The crate is open and empty.)" : "(It's too dangerous to inspect the crate while it's guarded.)"; }  }
		],
	},

	{
		Name: "MelodyCrateOpen",
		Music: "ForestTheme",
		Dialog: [
			{
				Background: "SecludedClearing",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Crate", Status: "Wood", Pose: "Idle" },
				],
				Text: "(There's a huge wooden crate in the middle of the woods.)"
			},
			{ Text: "(You can hear that someone is alive inside.)" },
			{
				Text: "(What will you do?)",
				Answer: [
					{ Text: "(Open the crate.)", Reply: "(You work hard to open the crate.)", Script: function() { PlatformEventSet("ForestCaptureRescueMelody"); } },
					{ Text: "(Leave it.)", Script: function() { PlatformDialogLeave(); } },
				]
			},
			{
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Animation: "Bound" },
				],
			},
			{ Text: "(Melody slowly crawls out of the box in tight bondage.)" },
			{ Text: "I'm glad to see you again.", Audio: "10", AudioStyle: "cheerful" },
			{
				Text: "Why did you stay in the smoke trap?", Audio: "20",
				Answer: [
					{ Text: "Why did you abandon us?", Reply: "(She frowns.)  When there's a trap, you run, it's common knowledge.", Audio: "21", Love: -1 },
					{ Text: "I was trying to save Lady Olivia.", Reply: "That princess needs to watch where she steps.", Audio: "22", AudioStyle: "serious" },
					{ Text: "Never mind.  Thanks for the rescue.", Reply: "(She smiles.)  My pleasure Melody.", Audio: "23", AudioStyle: "cheerful", Love: 1 },
				]
			},
			{
				Entry: function() {
					if (PlatformDialogGetCharacter("Edlaran").Domination <= -5) PlatformDialogGoto = "PayForRelease";
					PlatformDialogProcess();
				}
			},
			{ Text: "They got you in tight ropes.", Audio: "30" },
			{
				Text: "Can you struggle out?", Audio: "40",
				Answer: [
					{ Text: "I don't think so.", Reply: "(She nods and unties you.)  There you go.", Audio: "41" },
					{ Text: "Can you please help?", Reply: "(She smirks and unites you.)  There you go girl.", Audio: "42", AudioStyle: "serious", Domination: -1 },
					{ Text: "Stop being silly and untie me.", Reply: "(She unties you quickly.)  You should be good now.", Audio: "43", AudioStyle: "calm", Domination: 1 },
					{ Text: "Help me and I'll pay you.", Reply: "Deal!  (She releases you happily.)  There you go Melody.", Audio: "44", AudioStyle: "cheerful", Love: 1, Perk: true },
				]
			},
			{
				ID: "EndLick",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
				],
			},
			{ Text: "They wanted to sell you to a slaver.", Audio: "50" },
			{
				Text: "Did they sell Olivia?", Audio: "60",
				Answer: [
					{ Text: "We must save our friend.", Reply: "(She nods.)  That's the spirit!", Audio: "61", AudioStyle: "cheerful", Love: 1 },
					{ Text: "Let's move, we must find her.", Reply: "(She grabs her bow.)  Well said!", Audio: "62", AudioStyle: "serious", Domination: 1 },
					{ Text: "Never say that!", Reply: "(She frowns.)  No need to yell.", Audio: "63", AudioStyle: "sad", Love: -1 },
					{ Text: "I'm so scared for her.", Reply: "(She shakes her head.)  Everything will be alright.", Audio: "64", AudioStyle: "calm", Domination: -1 },
				]
			},
			{ Text: "Let's go find her.", Audio: "70" },
			{ Text: "(Meanwhile...  In Olivia's barn.)" },
			{ Entry: function() { PlatformPartyActivate("Olivia"); PlatformDialogLeave(); } },
			{
				ID: "PayForRelease",
				Text: "I could release you...", Audio: "80", AudioStyle: "serious"
			},
			{
				Text: "But there's a price.", Audio: "90", AudioStyle: "serious",
				Answer: [
					{ Text: "What price?", Reply: "(She removes her bottom and smirks.)  Can you guess?", Audio: "91", AudioStyle: "serious" },
					{ Text: "I will pay your price.", Reply: "(She removes her bottom and smirks.)  Good girl.", Audio: "92", AudioStyle: "serious", Domination: -1 },
					{ Text: "I'm not giving you any money.", Reply: "(She removes her bottom and smirks.)  I don't want money from you.", Audio: "93", AudioStyle: "serious", Domination: 1 },
				]
			},
			{
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "NoPants" },
					{ Name: "Melody", Status: "Maid", Animation: "Bound" },
				]
			},
			{ Text: "You will need to work for your freedom.", Audio: "100", AudioStyle: "serious" },
			{ Text: "(She gets on her knees and closer to your mouth.)" },
			{
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "KneelingLickedByMaidMelody", X: 500 },
				]
			},
			{
				Text: "Get to work!", Audio: "110", AudioStyle: "shouting",
				Answer: [
					{ Text: "(Lick her slowly, without much passion.)", Reply: "(You slowly lick as she masturbates to get an orgasm.)", Love: 1 },
					{ Text: "(Lick her lovingly and skillfully,)", Reply: "(You lick her with skill as she gets a wonderful orgasm.)", Love: 2, Domination: -1 },
					{ Text: "(Do nothing.)", Reply: "(She grumbles, dresses back and releases you.)  Fine!  I'll release you for free.  You ungrateful bitch.", Audio: "113", AudioStyle: "serious", Love: -2, Domination: 1, Goto: "EndLick" },
				]
			},
			{
				Entry: function() { PlatformAddExperience(PlatformPlayer, 10); },
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "KneelingLickedByMaidMelodyOrgasm", X: 500 },
				]
			},
			{ Text: "OoooOOOooooh! Oooohhh yeah!  YEAAAAAAAAAAAAHHHH!!!" },
			{ Text: "(She gets a shattering orgasm in front of the bound bandits.)" },
			{ Text: "Yes!  That feels so good.  I needed that.", Audio: "120", AudioStyle: "calm" },
			{ Text: "But we're wasting time with your naughty ideas, we need to rush.", Audio: "130", AudioStyle: "calm" },
			{ Text: "(She releases you and dresses back.)" },
			{ Entry: function() { PlatformDialogGoto = "EndLick"; PlatformDialogProcess(); } },

		],
	},

	{
		Name: "BarnThiefRescueMelody",
		Music: "ThiefBoss",
		Exit : function () { PlatformEventSet("BarnThiefRescueMelody"); PlatformLoadRoom(); PlatformPlayer.X = 200; },
		Dialog: [
			{
				Background: "BarnInterior",
				Character: [
					{ Name: "Hazel", Status: "Maid", Pose: "Angry" },
					{ Name: "Lyn", Status: "Thief", Pose: "Curious" },
				]
			},
			{ Text: "(A servant enters the barn to speak with the thief boss.)" },
			{ Text: "Boss, we have a problem.", Audio: "10" },
			{ Text: "The slave trading outpost has been attacked.", Audio: "20" },
			{ Text: "The maid we were expecting to sell has run away.", Audio: "30" },
			{
				Text: "(The boss gets angry.)",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleAngry" },
					{ Name: "Hazel", Status: "Maid", Pose: "Angry" },
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGagged" },
				]
			},
			{ Text: "Worthless servant!  Do I need to do everything myself?", Audio: "40", AudioStyle: "serious" },
			{ Text: "I'll get the whip cracking.  You stay here and guard the prisoner.", Audio: "50", AudioStyle: "serious" },
			{ Text: "Do not ungag her, do not unlock her and do not let her out.", Audio: "60", AudioStyle: "serious" },
			{ Text: "Money is money, and she's worth more than your life.", Audio: "65", AudioStyle: "serious" },
			{ Text: "(She gets even more angry.)" },
			{ Text: "You know what?  Torture the bitch!  It will teach her not to try to escape.", Audio: "70", AudioStyle: "angry" },
			{ Text: "(She runs away and slams the barn door, which makes a loud creaking sound.)" },
			{
				Text: "I can torture you?  Sweet!", Audio: "80",
				Character: [
					{ Name: "Hazel", Status: "Maid", Pose: "Angry" },
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGagged" },
				]
			},
			{ Text: "(She charges toward you.  The barn door seems to be weak.)" },

		],
	},

	{
		Name: "ForestCaptureEnd",
		Music: "ForestPlainTheme",
		Exit : function () { PlatformEventSet("ForestCaptureEnd"); PlatformLoadRoom(); PlatformPlayer.HalfBound = false; PlatformAddExperience(PlatformPlayer, 20); },
		Dialog: [
			{
				Background: "LakeRaft",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGagged" },
				]
			},
			{ Text: "(Olivia jumps on the wooden raft which starts to drift on the lake.)" },
			{ Text: "(Her pursuers jump in the water but quickly turn back, failing to swim.)" },
			{ Text: "(The raft slowly gets further toward the middle of the lake.)" },
			{
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGaggedKneeling", X: 500, Y: 300 },
				]
			},
			{ Text: "(After a while, the wooden ship stops completely.)" },
			{ Text: "(Olivia is left bound, gagged and stranded on the huge lake.)" },
			{ Text: "(A few hours later...)" },
			{
				Background: "CampGround",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
				],
			},
			{ Text: "(Edlaran stares at the lake.)" },
			{
				Text: "The sea is a harsh Mistress.", Audio: "10",
				Answer: [
					{ Text: "What's going on?", Reply: "I'm philosophizing by the lake.", Audio: "11" },
					{ Text: "I should be your Mistress.", Reply: "(She blushes and looks down.)  That's not what I meant.", Audio: "12", AudioStyle: "calm", Domination: 2 },
					{ Text: "Why are you saying that?", Reply: "It's an old sailor proverb.", Audio: "13" },
					{ Text: "I would love to have a Mistress.", Reply: "(She grins.)  Be careful on what you wish for.", Audio: "14", AudioStyle: "serious", Domination: -2 },
				]
			},
			{ Text: "(She points to the middle of the lake.)" },
			{ Text: "Do you see that little raft?  Look carefully.", Audio: "20" },
			{ Text: "You don't have my perfect elven vision.  (She winks at you.)", Audio: "30" },
			{ Text: "(You finally see the raft.)  Check the girl in white, isn't it Olivia?", Audio: "40" },
			{ Text: "Oh my!  I think she's bound.  Is she stranded on the lake?", Audio: "50" },
			{
				Text: "What should we do?", Audio: "60", AudioStyle: "terrified",
				Answer: [
					{ Text: "Move!  I'll go get her.", Reply: "No need to yell.  (She steps away from the lake.)", Audio: "61", AudioStyle: "terrified", Love: -1 },
					{ Text: "Save her!  Like the friends we are.", Reply: "(She nods in agreement.)  What will you do?", Audio: "62", Love: 1 },
					{ Text: "I think I can swim it.", Reply: "Are you sure?  (She looks at the middle of the lake.)", Audio: "63" },
					{ Text: "Heroes must get wet.", Reply: "You will try to swim?  (She seems impressed.)", Audio: "64", Perk: true, Domination: 1 },
				]
			},
			{
				Character: [
					{ Name: "Melody", Status: "Underwear", Pose: "Cocky" },
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
				],
			},
			{ Text: "(You quickly remove your clothes.)" },
			{ Text: "If I drown, you'll need to find another way to save her.", Audio: "70", AudioStyle: "serious" },
			{ Text: "(You dive in the water.)" },
			{
				Background: "Water",
				Character: [
					{ Name: "Melody", Status: "Underwear", Pose: "Swimming", X: 0 },
				],
			},
			{ Text: "(You swim like you never did before.)" },
			{ Text: "(Catching your breath when you need.)" },
			{ Text: "(Focusing on the raft, focusing on Olivia.)" },
			{ Text: "(You swim for hours, feeling your soar muscle.)" },
			{ Text: "(You cannot give up, too much is at stake.)" },
			{ Text: "(You finally reach Olivia's raft.)" },
			{
				Background: "LakeRaft",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "BoundGaggedKneeling", X: 250, Y: 300 },
					{ Name: "Melody", Status: "Underwear", Pose: "ExhaustedRight" },
				]
			},
			{ Text: "(You climb on the raft as she cheers in her gag.)" },
			{
				Text: "Mmnhdy!",
				Answer: [
					{ Text: "I almost drown for you.", Reply: "(She grumbles in her gag.)", Love: -1 },
					{ Text: "I will always be there to protect you.", Reply: "(She bows her head.)", Domination: 1 },
					{ Text: "I'm so happy to see you.", Reply: "(She nods happily.)", Love: 1 },
					{ Text: "I was so scared for you.", Reply: "(She shakes her head from left to right.)", Domination: -1 },
				]
			},
			{ Text: "(You release her from her bondage.)" },
			{
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Underwear", Pose: "Cocky" },
				]
			},
			{ Text: "Ah!  Thank you so much.", Audio: "100", AudioStyle: "cheerful" },
			{
				Text: "I owe you one.", Audio: "110", AudioStyle: "cheerful",
				Answer: [
					{ Text: "Kiss me girl.", Reply: "(You grab her for a long kiss.)", Love: 1, Domination: 1 },
					{ Text: "Don't mention it.", Reply: "You're way too humble.", Audio: "112" },
					{ Text: "No Miss.  I'm doing my servant work.", Reply: "(She gives you a curious look.)  I'll have to raise your salary my maid.", Audio: "113", AudioStyle: "serious", Love: -1, Domination: -1 },
					{ Text: "I would die to save your life Miss.", Reply: "(She gives you a hug.)  Please don't die my maid.", Audio: "114", AudioStyle: "serious", Perk: true, Love: 1, Domination: -1 },
				]
			},
			{
				Entry: function() {
					if (PlatformDialogGetCharacter("Olivia").Domination < 5) PlatformDialogGoto = "End";
					PlatformDialogProcess();
				}
			},
			{
				Text: "It was very reckless to go on the lake alone, bound and gagged.", Audio: "120", AudioStyle: "serious",
				Character: [
					{ Name: "Melody", Status: "Underwear", Pose: "Cocky", X: 1000 },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 500 },
				]
			},
			{ Text: "Young lady, you could have been killed.", Audio: "130", AudioStyle: "serious" },
			{
				Text: "I'm sorry Melody.  (She bows her head.)", Audio: "140", AudioStyle: "calm",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive" },
					{ Name: "Melody", Status: "Underwear", Pose: "Cocky" },
				],
				Answer: [
					{ Text: "Promise me not to do it again.", Reply: "I promise!  (She smiles at you.)  Let's go back.", Audio: "141", Domination: -1, Love: 1, Goto: "End" },
					{ Text: "I forgive you.", Reply: "Very good.  (She nods.)  Let's go back.", Audio: "142", Goto: "End" },
					{ Text: "You must be punished.  (Spank her.)", Reply: "Punished?  What?  How?  Melody!  You cannot do that!", Audio: "143", AudioStyle: "terrified", Love: -2, Domination: 2 },
					{ Text: "What would your mother do?  (Spank her.)", Reply: "She... she would spank me, Melody.", Audio: "144", AudioStyle: "terrified", Perk: true, Domination: 2 },
				]
			},
			{
				Text: "Bend down young lady.  You will be spanked.", Audio: "150", AudioStyle: "serious",
				Character: [
					{ Name: "Melody", Status: "Underwear", Pose: "Cocky", X: 1000 },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{ Text: "(She blushes, bends down, and presents her butt.)" },
			{
				Entry: function() { PlatformAddExperience(PlatformPlayer, 10); },
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "SpankedByMelodyUnderwear", X: 500 },
				]
			},
			{ Text: "(You spank her many times, making sure she remembers that lesson.)" },
			{ Text: "Ow!  Melody!  Please don't hit me so hard.", Audio: "160", AudioStyle: "terrified" },
			{ Text: "(She's cries from the physical pain and from the humiliation.)" },
			{ Text: "(You spank her a few times again, hitting the same spots.)" },
			{ Text: "I promise I will be a good girl.  I won't do it again.", Audio: "170", AudioStyle: "terrified" },
			{ Text: "I've learned my lesson.  Can we go back to firm land?", Audio: "180" },
			{
				Text: "(You nod and stop spanking her.)",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive" },
					{ Name: "Melody", Status: "Underwear", Pose: "Cocky" },
				]
			},
			{ Text: "(She bows her head and changes subject.)" },
			{ ID: "End", Text: "It will take us hours to reach the shore.", Audio: "190" },
			{ Text: "More time to know each other.  (She smiles.)", Audio: "200" },
			{ Text: "(You work together to bring the raft back.)" },
		],
	},

	{
		Name: "ThiefBossFlee",
		Music: "ThiefBoss",
		Exit : function () { PlatformLoadRoom("ForestPlainToSavannah"); PlatformPlayer.X = 100; PlatformPlayer.FaceLeft = false; },
		Dialog: [
			{
				Background: "Savannah",
				Character: [
					{ Name: "Vera", Status: "Leather", Pose: "Grumpy" },
					{ Name: "Lyn", Status: "Thief", Pose: "Curious" },
					{ Name: "Vera", Status: "Leather", Pose: "Angry" }
				]
			},
			{ Text: "(The bandit boss and her minions are having a loud argument.)" },
			{ Text: "(It's way too dangerous to go that way.)" },
			{ Text: "(Olivia retreats silently.)" },
		],

	},

	{
		Name: "ThiefBossIntro",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "Savannah",
				Character: [
					{ Name: "Vera", Status: "Leather", Pose: "Grumpy" },
					{ Name: "Lyn", Status: "Thief", Pose: "Curious" },
					{ Name: "Vera", Status: "Leather", Pose: "Angry" }
				]
			},
			{ Text: "(The bandit boss and her minions are having a loud argument.)" },
			{
				Text: "(What will you do?)",
				Answer: [
					{ Text: "(Turn back silently.)", Script: function() { PlatformDialogLeave(); PlatformLoadRoom("ForestPlainToSavannah"); PlatformPlayer.X = 100; PlatformPlayer.FaceLeft = false; } },
					{ Text: "(Walk around and try to avoid them.)", Reply: "(One of the bandits spots you.)" },
					{ Text: "(Provoke them.)", Reply: "(All bandits turn toward you.)" },
				]
			},
			{ Text: "Boss!  We have a rat in the camp.", Audio: "10" },
			{
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleAngry" },
					{ Name: "Vera", Status: "Leather", Pose: "Grumpy" },
					{ Name: "Vera", Status: "Leather", Pose: "Angry" }
				]
			},
			{ Text: "So, the slaves came back.  Get them girls!", Audio: "20" },
			{
				Entry: function() { PlatformEventSet("ThiefBossIntro"); },
				Text: "(Three bandits spring on you while the boss watches from her camp.)"
			}
		],

	},

	{
		Name: "ThiefBossRetreat",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "BanditCampGateGround",
				Character: [
					{ Name: "Vera", Status: "Leather", Animation: "Bound", X: -100, Y: -400 },
					{ Name: "Vera", Status: "Leather", Animation: "Bound", X: 1100, Y: -400 },
					{ Name: "Vera", Status: "Leather", Animation: "Bound", X: 500, Y: -400 },
				]
			},
			{ Text: "(The bandit minions struggle in their bondage.)" },
			{ Text: "Boss!  We might need your help here!", Audio: "10" },
			{ Background: "BanditCampGateOpen", Character: [] },
			{
				Background: "BanditCampGateGround",
				Text: "Boss?  It's now or never!", Audio: "20",
				Character: [
					{ Name: "Vera", Status: "Leather", Animation: "Bound", X: -100, Y: -400 },
					{ Name: "Vera", Status: "Leather", Animation: "Bound", X: 1100, Y: -400 },
					{ Name: "Vera", Status: "Leather", Animation: "Bound", X: 500, Y: -400 },
				]
			},
			{ Text: "BOSS?  HELP?", Audio: "30" },
			{ Background: "BanditCampGateOpen", Character: [] },
			{
				Background: "BanditCampGateGround",
				Text: "Errr...  Well...", Audio: "40",
				Character: [
					{ Name: "Vera", Status: "Leather", Animation: "Bound", X: -100, Y: -400 },
					{ Name: "Vera", Status: "Leather", Animation: "Bound", X: 1100, Y: -400 },
					{ Name: "Vera", Status: "Leather", Animation: "Bound", X: 500, Y: -400 },
				]
			},
			{ Text: "Isn't the weather nice today?", Audio: "50" },
			{ Background: "BanditCampGateOpen", Character: [] },
			{ Text: "(Their leader disappeared.  The bandit camp gate lays wide open.)" },
		],
	},

	{
		Name: "ThiefBossBattle",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "BanditCamp",
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "Curious" }]
			},
			{ Text: "(As you enter the bandit camp, the boss comes to greet you with a smirk on her face.)" },
			{ Text: "Welcome!  Welcome to your new life.  Your new slave life!", Audio: "10", AudioStyle: "angry" },
			{ Text: "You troublemakers have been bugging me for a while now.  You're a torn in my honest business.", Audio: "20", AudioStyle: "angry" },
			{
				Text: "Honest business?  You're kidnapping women and selling them for ransom!", Audio: "30", AudioStyle: "angry",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 500 },
					{ Name: "Lyn", Status: "Thief", Pose: "Curious", X: 0 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 1000 },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 1500 },
				]
			},
			{
				Text: "If I remember correctly, you were happy to share the loot with us Edlaran.", Audio: "40",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Curious", X: 0 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 500 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 1000 },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 1500 },
				]
			},
			{
				Text: "Is it a crime to join a kidnapper gang?  Don't answer.", Audio: "50",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 500 },
					{ Name: "Lyn", Status: "Thief", Pose: "Curious", X: 0 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 1000 },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleDominant", X: 1500 },
				]
			},
			{
				Text: "Why are you staring at me you two?", Audio: "60",
				Answer: [
					{ Text: "You're a horrible liar.", Reply: "(She grumbles and kicks a rock.)", Love: -1 },
					{ Text: "I will punish you later little elf.", Reply: "(She gulps and nods slowly.)", Domination: 2 },
					{ Text: "(Roll your eyes up and giggle.)", Reply: "(She giggles back and winks at you.)", Love: 1 },
					{ Text: "I'm sure you did it for a noble cause.", Reply: "(She does a cocky pose and smirks.)", Domination: -2 },
				]
			},
			{
				Text: "Enough!  Since you betrayed me, I will keep you as my personal slave Edlaran.", Audio: "70",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleAngry", X: 0 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 500 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 1000 },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleDominant", X: 1500 },
				]
			},
			{ Text: "A debt is a debt, and you will repay me with years of obedient service.", Audio: "80" },
			{ Text: "Since my minions cannot capture you, I will do it myself.", Audio: "90" },
			{ Text: "(Her minions close the gate behind you.)" },
			{ Text: "(She picks up her knives and charges at you.)" },
		],
	},

	{
		Name: "ThiefBossDefeat",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "BanditCampGround",
				Character: [{ Name: "Lyn", Status: "Thief", Animation: "Bound", Y: -400 }]
			},
			{ Text: "(She struggles in vain and slowly accepts her fate.)" },
			{ Text: "How?  How could you?", Audio: "10" },
			{ Text: "You betrayed me Edlaran!  You want to be the boss now?", Audio: "20" },
			{
				Text: "Me?  The gang boss?", Audio: "30", AudioStyle: "cheerful",
				Background: "BanditCamp",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 250 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 750 },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 1250 },
				]
			},
			{
				Text: "That's an interesting idea.", Audio: "40", AudioStyle: "cheerful",
				Answer: [
					{ Text: "Don't even think about it.", Reply: "It's my mistake, let's forget this.", Audio: "41", AudioStyle: "calm", Domination: 1 },
					{ Text: "You're way better than that my friend.", Reply: "Thanks Melody, you're very kind.", Audio: "42", AudioStyle: "cheerful", Love: 2 },
					{ Text: "You would be the worst boss ever.", Reply: "That's not very kind you know!", Audio: "43", AudioStyle: "angry", Love: -2 },
					{ Text: "You could rule them better than her.", Reply: "Yep!  I would get tons of loot.", Audio: "44", Domination: -1 },
				]
			},
			{ Text: "But I've made a deal with you two.  We need to complete our mission before I start any business.", Audio: "50" },
			{
				Background: "BanditCampGround",
				Character: [{ Name: "Lyn", Status: "Thief", Animation: "Bound", Y: -400 }]
			},
			{ Text: "(She tugs on her bonds and moans from the pain.)" },
			{
				Text: "What will you do with me?", Audio: "60", AudioStyle: "calm",
				Answer: [
					{ Text: "We'll take some loot and leave you.", Reply: "(She struggles.)  Take it!  I would have done the same.", Audio: "61", AudioStyle: "calm", Domination: 1, Love: 1 },
					{ Text: "We will be back later to sell you.", Reply: "What?  That will never work.", Audio: "62", Domination: 2 },
					{ Text: "We won't waste any time with you.", Reply: "Get out then!", Audio: "63", AudioStyle: "angry", Domination: 1 },
					{ Text: "We don't have time to jail your cute butt.", Reply: "(She struggles in vain and blushes.)", Domination: 1, Love: 2, Perk: true },
				]
			},
			{ Text: "My minions will get me out of that bondage as soon as you're gone.", Audio: "70", AudioStyle: "calm" },
			{ Text: "But if you don't come back, I promise I won't go out again to hunt you.", Audio: "80", AudioStyle: "calm" },
			{
				Text: "Do we have a deal?", Audio: "90",
				Answer: [
					{ Text: "It's a deal!", Reply: "A deal is a deal!  You can go now.", Audio: "91", Love: 1, AudioStyle: "cheerful" },
					{ Text: "Fine, we'll see if you can keep a promise.", Reply: "Fine.  You can go now.", Audio: "92", Domination: 1 },
					{ Text: "(Shrug and turn away.)", Reply: "Get out!", Audio: "93", AudioStyle: "angry" },
				]
			},
			{ Text: "(You leave her to struggle.)" }
		]
	},

	{
		Name: "ThiefBossDefeatRepeat",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "BanditCampGround",
				Character: [{ Name: "Lyn", Status: "Thief", Animation: "Bound", Y: -400 }]
			},
			{ Text: "(She struggles a little and sighs.)" },
			{ Text: "A deal is a deal.  The deal is simple.", Audio: "10" },
			{ Text: "Don't come back, and I promise I won't hunt you again.", Audio: "20" },
			{ Text: "(You leave her to struggle.)" }
		],
	},

	{
		Name: "ThiefBossSecondBattle",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "BanditCamp",
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "IdleAngry" }]
			},
			{ Text: "(Lyn the bandit boss gets furious as you enter her camp again.)" },
			{ Text: "What?  You came back?  You broke the deal!", Audio: "10", AudioStyle: "serious" },
			{
				Text: "Last time you got me bound on the ground in front of my own minions.", Audio: "20", AudioStyle: "serious",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Curious", X: 0 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 1000 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 1500 },
				]
			},
			{ Text: "Do you know how humiliating it was?  They don't respect me anymore.", Audio: "30", AudioStyle: "serious" },
			{
				Text: "I will win their loyalty back.  I will defeat you!", Audio: "40", AudioStyle: "serious",
				Answer: [
					{ Text: "We will crush you like an ant.", Reply: "No!  Not this time.", Audio: "41", Domination: 2, Love: -1, AudioStyle: "angry" },
					{ Text: "Girl, do you want another defeat?", Reply: "I will win this fight!", Audio: "42", Domination: 1, AudioStyle: "angry" },
					{ Text: "Please, we don't want to fight.", Reply: "It's not like you have a choice.", Audio: "43", Domination: -1, AudioStyle: "serious" },
					{ Text: "Your cute butt will end up in bondage again.", Reply: "(She blushes.)  How...  How dare you?", Audio: "44", Domination: 2, Love: 1, Perk: true },
				]
			},
			{
				Text: "Girls!  Obey me now!  Close the gate!", Audio: "50", AudioStyle: "serious",
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "IdleAngry" }]
			},
			{ Text: "(Her minions laugh a little and reluctantly close the gate behind you.)" },
			{ Text: "(She picks up her knives and charges toward you with even more strength.)" },
		],
	},

	{
		Name: "ThiefBossSecondDefeat",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "BanditCampGround",
				Character: [{ Name: "Lyn", Status: "Thief", Animation: "Bound", Y: -400 }]
			},
			{ Text: "(She tugs on the restraints one last time and gives up)" },
			{ Text: "Twice is twice.  Twice defeated!  How is that possible?", Audio: "10", AudioStyle: "calm" },
			{
				Text: "Where did you learn to fight?", Audio: "20", AudioStyle: "calm",
				Answer: [
					{ Text: "We won because our cause is noble.", Reply: "My cause is noble!  It's money!", Audio: "21", Love: -1 },
					{ Text: "We were lucky to win.", Reply: "You're kind, but you won a fair battle.", Audio: "22", Love: 1, Domination: -1 },
					{ Text: "I trained for years.", Reply: "It shows, I cannot defeat you.", Audio: "23", Love: 1, Domination: 1 },
					{ Text: "I could teach you some tricks.", Reply: "(She smiles.)  Maybe I need a trainer.", Audio: "24", Love: 2, Domination: 1, Perk: true },
				]
			},
			{ Text: "This is so humiliating.", Audio: "30", AudioStyle: "calm" },
			{
				Text: "My minions will never respect me again.", Audio: "40", AudioStyle: "calm",
				Answer: [
					{ Text: "They would if you don't call them minions.", Reply: "I'll call them however I want!", Audio: "41", AudioStyle: "angry", Domination: 1, Love: -1 },
					{ Text: "You're a strong leader, they will follow.", Reply: "Damn right!", Audio: "42", AudioStyle: "angry", Domination: -1, Love: 1 },
					{ Text: "Respect is harder to earn than to lose.", Reply: "Yeah, that's true.", Audio: "43", AudioStyle: "angry", Love: 1 },
				]
			},
			{ Text: "Minions!  Come here right now and release me!", Audio: "50", AudioStyle: "angry" },
			{ Text: "Minions!  Right now!", Audio: "60", AudioStyle: "angry" },
			{ Text: "Minions?", Audio: "70" },
			{ Text: "Girls?", Audio: "80" },
			{ Text: "Associates?", Audio: "90", AudioStyle: "calm" },
			{ Text: "My friends?", Audio: "100", AudioStyle: "calm" },
			{ Text: "(Nobody comes to release her, it's getting awkward.)" },
			{ Text: "(You leave her to struggle.)" }
		]
	},

	{
		Name: "ThiefBossSecondDefeatRepeat",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "BanditCampGround",
				Character: [{ Name: "Lyn", Status: "Thief", Animation: "Bound", Y: -400 }]
			},
			{ Text: "(She struggles a little and sighs.)" },
			{ Text: "My good friends, my sisters, you cannot leave me bound on the ground.", Audio: "10", AudioStyle: "calm" },
			{ Text: "(Nobody comes to release her.  The situation is awkward.)" },
			{ Text: "(You leave her to struggle.)" }
		],
	},

	{
		Name: "ThiefBossRescueInBattle",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "BanditCampGround",
				Character: [{ Name: "Lyn", Status: "WoodCrate", Pose: "Idle" }]
			},
			{ Text: "(You can hear Lyn the bandit boss struggling in the crate.)" },
			{ Text: "Minions!  Listen to me!  Release me right now!", Audio: "10", AudioStyle: "serious" },
			{ Text: "(The other bandits prevent you from doing anything.)" },
		],
	},

	{
		Name: "ThiefBossRescueAfterBattle",
		Music: "ThiefBoss",
		Dialog: [
			{
				Background: "BanditCampGround",
				Character: [{ Name: "Lyn", Status: "WoodCrate", Pose: "Idle" }]
			},
			{ Text: "(You can hear Lyn the bandit boss struggling in the crate.)" },
			{ Text: "Minions!  Listen to me!  Release me right now!", Audio: "10", AudioStyle: "serious" },
			{
				Text: "Minions?  A deal is a deal, we can negotiate something.", Audio: "20",
				Answer: [
					{ Text: "(Open the crate.)", Reply: "(You open the crate and find her in bondage.)", Love: 2 },
					{ Text: "(Leave it there.)", Script: function() { PlatformDialogLeave(); } },
				]
			},
			{ Character: [{ Name: "Lyn", Status: "Thief", Animation: "Bound", Y: -400 }] },
			{ Text: "It's you!  Well... thanks... I guess.", Audio: "30", AudioStyle: "serious" },
			{
				Text: "My stupid minions prepared a mutiny.  Can you believe it?", Audio: "40", AudioStyle: "serious",
				Answer: [
					{ Text: "They should be more loyal.", Reply: "Damn right they should.", Audio: "41", Domination: -1, Love: 1 },
					{ Text: "They would have sold you.", Reply: "You think they would dare?", Audio: "42", Domination: 1, Love: 1 },
					{ Text: "You deserve it.", Reply: "(She shakes her head no.)  I'm only a businesswoman.", Audio: "43", Domination: 1, Love: -1 },
					{ Text: "You deserve more respect.", Reply: "(She grins.)  Yeah!  That's for sure.", Audio: "44", Domination: -2, Love: 2, Perk: true },
				]
			},
			{ Text: "This life of crime is getting dangerous.  I understand why you left the trade Edlaran.", Audio: "50" },
			{ Text: "Girls, can we make a deal?  A good deal.", Audio: "60" },
			{ Text: "Since travelling is getting more and more risky, we could join forces.", Audio: "70" },
			{ Text: "You protect me from my stupid minions, and I'll make the best bargains for you, I'll fight for you.", Audio: "80" },
			{
				Text: "What do you think?  Do we have a deal?", Audio: "90",
				Answer: [
					{ Text: "That sounds good, we have a deal.", Reply: "A deal is a deal!", Audio: "91", Domination: 1, Love: 1 },
					{ Text: "What do you think Olivia?", Reply: "(Olivia thinks for a while and nods.)", Domination: -1 },
					{ Text: "What do you think Edlaran?", Reply: "(Edlaran quickly makes a thumbs up.)", Domination: -1 },
					{ Text: "A great businesswoman like you is welcome.", Reply: "(She grins.)  You girls do need me.", Audio: "94", Domination: -2, Love: 1, Perk: true },
				]
			},
			{
				Background: "BanditCamp",
				Text: "(You release her and help her to get up.  She shakes everyone hand.)",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Curious", X: 0 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 1000 },
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle", X: 1500 },
				]
			},
			{ Text: "If you ever need a good bargain, just ask me.", Audio: "100" },
			{ Text: "Edlaran, don't forget your debt, you still have to repay me.  A debt is a debt.", Audio: "110" },
			{ Text: "Let's go before my idiot ex-minions get free.", Audio: "120" },
			{ Text: "(Lyn joined your party.  You can switch your active character at any save point.)" },
			{ Entry: function() {
				PlatformEventSet("LynJoin");
				PlatformPartyBuild();
				PlatformChar.splice(3, 100);
				PlatformDialogLeave();
			} },

		],
	},

	{
		Name: "OliviaTent",
		Music: "MelodyRoom",
		Exit : function () { PlatformEventSet("OliviaTent"); },
		Dialog: [
			{
				Background: "SavannahTentInterior",
				Entry: function() {
					if (PlatformEventDone("OliviaTent")) PlatformDialogGoto = "End";
					PlatformDialogProcess();
				}
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Olivia"); },
				Text: "This tent is a nice protection, my skin is burning.", Audio: "10",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" }
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia"); },
				Text: "Sweetie, please come with me under the tent, my skin is burning.", Audio: "20",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleHappy" },
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy" },
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" }
				]
			},
			{
				Text: "I rarely get so much sun.", Audio: "30",
				Answer: [
					{ Text: "The weather is certainly hot.", Reply: "I've read it can even get worse.", Audio: "31" },
					{ Text: "You have very delicate skin.", Reply: "That's true.  I need to protect it better.", Audio: "32", AudioStyle: "calm", Domination: 1 },
					{ Text: "I have horrible sunburns also.", Reply: "Poor Melody, I wish I could help you.", Audio: "33", AudioStyle: "serious", Domination: -1 },
					{ Text: "I will train you to endure it.", Reply: "Train me Melody?  Very well.", Audio: "34", AudioStyle: "terrified", Perk: true, Domination: 2 },
				]
			},
			{ Text: "We are getting closer to the desert, and the kingdom of Slandia.", Audio: "40" },
			{ Text: "The Duke, my future husband, lives there.  We could ask him for help.", Audio: "50" },
			{ Text: "Maybe he knows about the curse that's plaguing our home.", Audio: "60" },
			{ Text: "Or maybe he knows where Mother is, they know each other.", Audio: "70" },
			{
				Text: "I miss her very much.", Audio: "80", AudioStyle: "sad",
				Answer: [
					{ Text: "She's a wonderful woman.", Reply: "She is.  Strict and caring at the same time.", Audio: "81", AudioStyle: "cheerful", Love: 1 },
					{ Text: "She ran like a coward.", Reply: "Don't say that.  I'm sure she had her reasons.", Audio: "82", AudioStyle: "sad", Love: -1 },
					{ Text: "She could be in Slandia.", Reply: "Yes, it's a possibility.", Audio: "83" },
					{ Text: "I'm sure she would be proud of you.", Reply: "Thank you so much Melody.  I needed to hear this.", Audio: "84", AudioStyle: "cheerful", Perk: true, Love: 2 },
				]
			},
			{ Text: "I'm very nervous to see Duke Sunesk of Slandia, but it's out best hope for now.", Audio: "90" },
			{ Text: "Let's rest a little before we go out on the road.", Audio: "100" },
			{
				ID: "End",
				Prerequisite: function() { return !PlatformDialogIsLover("Olivia") && !PlatformDialogIsSlave("Olivia") && !PlatformDialogIsOwner("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "Idle" }],
				Text: "(She inspects the tent.)  I will consult Mother to purchase a tent like this for our garden.", Audio: "200"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia") && !PlatformDialogIsSlave("Olivia") && !PlatformDialogIsOwner("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "FrenchKissMaidMelody", X: 500 }],
				Text: "Be careful in the sun my love.  (You exchange a lovely kiss.)", Audio: "210", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Olivia") && PlatformDialogIsSlave("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "KneelMaidMelody", X: 500 }],
				Text: "(She kneels close to you.)  I promise to be careful and not to get sunburn Miss.", Audio: "220", AudioStyle: "calm"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia") && PlatformDialogIsSlave("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "KneelLoverMaidMelody", X: 500 }],
				Text: "(She kneels and hugs your legs lovingly.)  I promise to be careful and not to get sunburn Miss.", Audio: "230", AudioStyle: "calm"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Olivia") && PlatformDialogIsOwner("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "StrictMaidMelodyKissFeet", X: 500 }],
				Text: "(She points to her feet as you bend to kiss her boots.)  That's a good pet.", Audio: "240", AudioStyle: "serious"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia") && PlatformDialogIsOwner("Olivia"); },
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "MaidMelodyKissFeet", X: 500 }],
				Text: "(She points to her feet as you bend to kiss her boots.)  I love you my pet.", Audio: "250", AudioStyle: "serious"
			}

		]
	},

	{
		Name: "EdlaranTent",
		Music: "MelodyRoom",
		Exit : function () { PlatformEventSet("EdlaranTent"); },
		Dialog: [
			{
				Background: "SavannahTentInterior",
				Entry: function() {
					if (PlatformEventDone("EdlaranTent")) PlatformDialogGoto = "End";
					PlatformDialogProcess();
				}
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran"); },
				Text: "I've slept many nights in a tent like that, with my old bandit sisters.", Audio: "10",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" }
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "My love, I must confess that I've slept many nights in a tent like that, with my old bandit sisters.", Audio: "20", AudioStyle: "cheerful",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy" },
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy" },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" }
				]
			},
			{ Text: "Some nights were very quiet, and others were totally wild.", Audio: "30" },
			{ Text: "The best evenings happened when we had cute slaves to tease.", Audio: "40" },
			{ Text: "Is it a crime to tease slaves?  Don't answer.", Audio: "50" },
			{
				Text: "These are good memories.", Audio: "60", AudioStyle: "cheerful",
				Answer: [
					{ Text: "It's also fun to tease you.", Reply: "(She blushes.)  It can be fun also.", Audio: "61", AudioStyle: "calm", Domination: 1 },
					{ Text: "I'm sure you had a good time.", Reply: "Oh yes, lots of kinky moments.", Audio: "62", AudioStyle: "cheerful" },
					{ Text: "You treated them well?", Reply: "I've never hurt a slave... too badly.", Audio: "63", Domination: -1 },
					{ Text: "I envy these slaves.", Reply: "(She smirks.)  One day you could try it.", Audio: "64", AudioStyle: "serious", Perk: true, Domination: -2 },
				]
			},
			{ Text: "But this is the past, I won't do it again... probably.", Audio: "70" },
			{
				Text: "I'm an honest archer now.", Audio: "80",
				Answer: [
					{ Text: "We'll see about that.", Reply: "Only time will tell.  (She laughs.)", Audio: "81", AudioStyle: "cheerful" },
					{ Text: "Don't make me laugh.", Reply: "(She pouts.)  I'll show you!", Audio: "82", AudioStyle: "angry", Love: -1 },
					{ Text: "I believe you Edlaran.", Reply: "Thanks.  I appreciate.", Audio: "83", Love: 1 },
					{ Text: "You're the cutest archer now.", Reply: "(She smiles.)  You're way too kind.", Audio: "84", AudioStyle: "cheerful", Perk: true, Love: 2 },
				]
			},
			{ Text: "Enough talking about me.  We have a long road ahead until we reach Slandia.", Audio: "90" },
			{
				ID: "End",
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran") && !PlatformDialogIsSlave("Edlaran") && !PlatformDialogIsOwner("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "Idle" }],
				Text: "This tent will shelter us from the heat.  We could also travel by night, but it's more dangerous.", Audio: "100"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran") && !PlatformDialogIsSlave("Edlaran") && !PlatformDialogIsOwner("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "FrenchKissMaidMelody" }],
				Text: "I love you so much Melody.  (You share kiss before resuming your journey.)", Audio: "110", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran") && PlatformDialogIsSlave("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "SpankedMaidMelody", X: 500 }],
				Text: "(You give your girl a playful spank on the butt before resuming your adventure.)"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran") && PlatformDialogIsSlave("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "GropedMaidMelody", X: 500 }],
				Text: "(You grab your submissive lover with strength and grope her breast as she moans.)"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran") && PlatformDialogIsOwner("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "MasturbateMaidMelodyUnderDress" }],
				Text: "Don't forget who you belong to.  (She slides her hand under your dress and pinches your pussy lips.)", Audio: "120", AudioStyle: "angry"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran") && PlatformDialogIsOwner("Edlaran"); },
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "MasturbateMaidMelodyUnderDress" }],
				Text: "(She slides her hand under your dress and touches your pussy playfully.)  Tonight, you're mine my love.", Audio: "130", AudioStyle: "cheerful"
			}

		]
	},

	{
		Name: "LynTent",
		Music: "MelodyRoom",
		Exit : function () { PlatformEventSet("LynTent"); },
		Dialog: [
			{
				Background: "SavannahTentInterior",
				Entry: function() {
					if (PlatformEventDone("LynTent")) PlatformDialogGoto = "End";
					PlatformDialogProcess();
				}
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn"); },
				Text: "The desert is freaking hot.", Audio: "10",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn"); },
				Text: "The desert is freaking hot, but not as hot as you honey.", Audio: "20",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" }
				]
			},
			{
				Text: "Do you know how to survive from here?", Audio: "30",
				Answer: [
					{ Text: "Lyn, can you help us?", Reply: "Yeah, I'll give you a quick guide.", Audio: "31", Domination: -1 },
					{ Text: "We should be fine.", Reply: "Maybe, but I'll give you a quick guide.", Audio: "32" },
					{ Text: "We can survive anywhere.", Reply: "You're confident, but I'll give you a quick guide.", Audio: "33", Domination: 1 },
					{ Text: "With you around, we'll be alright.", Reply: "You're sweet, I'll give you a quick guide.", Audio: "34", Domination: 1, Love: 1, Perk: true },
				]
			},
			{ Text: "Water is life, life is water.  Bring tons of it.", Audio: "40" },
			{ Text: "I used to sell water and slaves to Slandia soldiers when the war was raging.", Audio: "50" },
			{ Text: "These were good days, business was booming.", Audio: "60" },
			{
				Text: "(Olivia steps in front of you and makes an angry face.)",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleAngry", X: 750 },
					{ Name: "Lyn", Status: "Thief", Pose: "Curious", X: 250 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 1250 }
				]
			},
			{ Text: "Excuse me?  War was not a good time!", Audio: "70", AudioStyle: "angry" },
			{ Text: "Thousands of men died, my father died!  How dare you?", Audio: "80", AudioStyle: "angry" },
			{ Text: "I'm forced to marry a man I barely know because of your war!", Audio: "90", AudioStyle: "angry" },
			{
				Text: "(Lyn gulps and nods slowly.)",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Idle", X: 250 },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleDominant", X: 750 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 1250 }
				]
			},
			{ Text: "Calm down, I did not start the war.", Audio: "100", AudioStyle: "calm" },
			{ Text: "I had to do deals to survive.  A deal is a deal.", Audio: "110", AudioStyle: "calm" },
			{
				Text: "Give me a break.", Audio: "120",
				Answer: [
					{ Text: "Don't interrupt Olivia.", Reply: "Damn right!  Thanks Melody!", Audio: "121", Domination: 1, Love: 2, Script: function() { PlatformDialogAlterProperty("Olivia", "Love", -2); } },
					{ Text: "She's right you know.", Reply: "Of course you're going to side with her.", Audio: "122", Domination: -1, Love: -2, Script: function() { PlatformDialogAlterProperty("Olivia", "Love", 2); } },
					{ Text: "Let's not fight.", Reply: "Yeah, this is not the time or place.", Audio: "123", Domination: 1 },
					{ Text: "I'm not getting involved.", Reply: "(She nods and smirks.)", Domination: -1 },
				]
			},
			{ Text: "Anyway!  What was I saying?  Oh yeah, surviving in the desert.", Audio: "130" },
			{ Text: "One last tip then, don't stay too exposed to the sun, a shelter like this is perfect.", Audio: "140" },
			{
				ID: "End",
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn") && !PlatformDialogIsSlave("Lyn") && !PlatformDialogIsOwner("Lyn"); },
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "Idle" }],
				Text: "(She checks her purse.)  We should rent this tent to travelers.  We would make good profit.", Audio: "200"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn") && !PlatformDialogIsSlave("Lyn") && !PlatformDialogIsOwner("Lyn"); },
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "FrenchKissMaidMelody", X: 500 }],
				Text: "You're starting to get a sexy tan honey.  (She gets closer for a loving kiss.)", Audio: "210", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn") && PlatformDialogIsSlave("Lyn"); },
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "KneelLeft", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "StareDownRight", X: 500 },
				],
				Text: "Boss, I hope you will enjoy the sun.  (She gets comfy on her knees and smiles at you.)", Audio: "220", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn") && PlatformDialogIsSlave("Lyn"); },
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "FrenchKissMaidMelody", X: 500 }],
				Text: "(You grab her by surprise and kiss her forcefully.  She seems to enjoy it and moans slowly.)", Audio: "230", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn") && PlatformDialogIsOwner("Lyn"); },
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "Tickle" }],
				Text: "Be a good minion Melody.  (She tickles you playfully before letting you go.)", Audio: "240", AudioStyle: "angry"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn") && PlatformDialogIsOwner("Lyn"); },
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "Tickle" }],
				Text: "You're such a cute minion honey.  (She tickles you playfully before letting you go.)", Audio: "250", AudioStyle: "cheerful"
			}

		]
	},

	{
		Name: "DesertEntrance",
		Music: "Desert",
		Exit : function () { PlatformEventSet("DesertEntrance"); },
		Dialog: [
			{
				Background: "DesertEntrance",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
				]
			},
			{ Text: "(You all stare at the huge desert that lies in front.)" },
			{ Text: "You both better be careful, it's easy to burn or get lost in the desert.", Audio: "10" },
			{ Text: "Use the sun to guide you, but don't stare at it.  (She winks.)", Audio: "20" },
			{
				Text: "Do you know about the desert creatures?", Audio: "30",
				Answer: [
					{ Text: "Please educate us Edlaran.", Reply: "Listen carefully then.", Audio: "31", Domination: -2 },
					{ Text: "I don't fear any monster.", Reply: "(She nods slowly.)  We are safe with you around.", Audio: "32", AudioStyle: "calm", Domination: 2 },
					{ Text: "(Shrug and watch the dunes.)", Reply: "I will explain.", Audio: "33" }
				]
			},
			{ Text: "The desert is hostile, you will find slavers if you're not lucky.  You can beat them up like thieves.", Audio: "40" },
			{ Text: "The worst enemies might be the creatures like vultures and scorpions.", Audio: "50" },
			{
				Text: "They can petrify you.", Audio: "60",
				Answer: [
					{ Text: "What does it mean?", Reply: "It's a weird desert curse.", Audio: "61" },
					{ Text: "Petrify?  You're lying again.", Reply: "(She grumbles.)  Hey!  That's not very kind.", Audio: "62", AudioStyle: "angry", Love: -2 },
					{ Text: "You're too cute to be stoned.", Reply: "(She smiles.)  Thanks Melody!", Audio: "63", AudioStyle: "cheerful", Love: 2 }
				]
			},
			{ Text: "If they get you, you might not be killed or eaten.  They will turn you to stone.", Audio: "70" },
			{ Text: "And I don't know if it's possible to come back once you're petrified.", Audio: "80" },
			{ Text: "You better learn to run if you're in trouble.  Especially you, little princess.", Audio: "90" },
			{ Text: "(Olivia frowns and the group continues onward.)" },
		],
	},

	{
		Name: "DesertEntranceLyn",
		Music: "Desert",
		Exit : function () { PlatformEventSet("DesertEntrance"); },
		Dialog: [
			{
				Background: "DesertEntrance",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Idle" },
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
				]
			},
			{ Text: "(You all stare at the huge desert that lies in front.)" },
			{ Text: "Sand is sand, we will all end up as sand.", Audio: "10" },
			{
				Text: "Did you know that you can literally turn to sand here?", Audio: "20",
				Answer: [
					{ Text: "You have such silly stories.", Reply: "(She gets angry.)  It's not a silly story.", Audio: "21", AudioStyle: "angry", Love: -2 },
					{ Text: "(Give her a curious look.)", Reply: "Let me explain.", Audio: "22" },
					{ Text: "Are you talking about the desert creatures?", Reply: "(She smiles and nods.)  You're very wise.", Audio: "23", Love: 2 }
				]
			},
			{ Text: "The vultures and scorpions of this desert are cursed in a strange and dangerous way.", Audio: "30" },
			{ Text: "If they get you down, pray that they will eat you and not turn you to stone.", Audio: "40" },
			{ Text: "If they petrify you, you'll become a statue of yourself.", Audio: "50" },
			{
				Text: "An eternity of stone.", Audio: "60",
				Answer: [
					{ Text: "Let's avoid these creatures.", Reply: "Running to avoid them won't always work.", Audio: "61", Domination: -1 },
					{ Text: "I'm stronger than any monster.", Reply: "I'm sure you will kick their butts.", Audio: "62", Domination: 2 },
					{ Text: "This is really scary.", Reply: "Girl, get stronger!  Being scared won't help you cross the desert.", Audio: "63", Domination: -2 },
					{ Text: "We will be fine.", Reply: "That's the spirit!", Audio: "64", Domination: 1 }
				]
			},
			{ Text: "Oh!  And if we meet some slavers, don't listen to them.  They will probably lie about me.", Audio: "70" },
			{ Text: "They make the worst deals anyway.  A deal is a deal.", Audio: "80" },
			{ Text: "(She winks at you as the group continues onward.)" },
		],
	},

	{
		Name: "ZaraPetrified",
		Music: "Desert",
		Exit: function() { PlatformTempEvent.push("ZaraPetrified"); },
		Dialog: [
			{
				Background: "BarrenRocks",
				Character: [
					{ Name: "Zara", Status: "Slave", Pose: "Petrified" },
				]
			},
			{
				Prerequisite: function() { return PlatformTempEvent.includes("ZaraPetrified"); },
				Text: "(Nobody has a solution to help the slave trapped in stone.  You leave the statue alone.)",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Zara", Status: "Slave", Pose: "Petrified" },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
				]
			},
			{
				Prerequisite: function() { return PlatformTempEvent.includes("ZaraPetrified"); },
				Entry: function() { PlatformDialogLeave(); }
			},
			{
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
					{ Name: "Zara", Status: "Slave", Pose: "Petrified" },
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
				]
			},
			{ Text: "(Olivia inspects the girl statue.)" },
			{ Text: "This is not an ordinary statue.  There is a living woman under the stone.", Audio: "10" },
			{
				Text: "She is wearing slave's clothes and a collar.", Audio: "20",
				Answer: [
					{ Text: "We should help her.", Reply: "I agree Melody.", Audio: "21" },
					{ Text: "I guess nobody cares about a stone slave.", Reply: "That is quite sad indeed.", Audio: "22" },
					{ Text: "Can we reverse the petrification?", Reply: "That is a good question.", Audio: "23" },
					{ Text: "That's a cruel fate.", Reply: "Indeed.  This poor slave ran out of fortune.", Audio: "24" }
				]
			},
			{ Text: "Maybe there is a cure for that awful petrification.", Audio: "30" },
			{ Text: "We are not that far from the kingdom of Slandia.  We could ask for help there.", Audio: "40" },
			{ Text: "(Without any solution, you leave the girl statue alone.)" },
		],
	},

	{
		Name: "DesertEnd",
		Music: "Desert",
		Exit : function () { PlatformLoadRoom("DesertDunesBrown"); PlatformPlayer.X = 4400; PlatformPlayer.FaceLeft = true; },
		Dialog: [
			{
				Background: "DunesHeat",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "Idle" },
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle" },
				]
			},
			{ Text: "(*** You've reached the end of Bondage Brawl.  More content will be added in the future. ***)" },
			{ Text: "(*** If you liked it, have suggestions, or bug reports.  Please contact Ben987. ***)" },
		],
	},

	{
		Name: "OliviaLover1Start",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Olivia").Domination > 5); },
				Text: "(You get closer to Olivia with a grin on your face.)",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Olivia").Domination >= -5) && (PlatformDialogGetCharacter("Olivia").Domination <= 5)); },
				Text: "(You come closer to Olivia and look at each other in the eyes.)",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleHappy", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy", X: 500 },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Olivia").Domination < -5); },
				Text: "(You timidly come closer to Olivia and blush.)",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Olivia").Domination > 5); },
				Text: "(She gets flustered and looks down at the ground.)",
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Olivia").Domination >= -5) && (PlatformDialogGetCharacter("Olivia").Domination <= 5)); },
				Text: "(She seems a little nervous but makes a huge smile.)",
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Olivia").Domination < -5); },
				Text: "(She looks at you carefully and smirks.)",
			},
			{
				Text: "What is on your mind Melody?", Audio: "10",
				Answer: [
					{ Text: "(Propose to become girlfriends.)", Reply: "(You look at each other and smiles.)" },
					{ Text: "(Talk about the weather.)", Reply: "(She sighs and turns away.)", Love: -1, Goto: "Skip" },
					{ Text: "(Compliment her.)", Reply: "(She smiles but quickly turns away.)", Perk: true, Goto: "Skip" }
				]
			},
			{
				Text: "Olivia, we've been best friends for most of our lives.", Audio: "20",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy" },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleHappy" }
				]
			},
			{ Text: "Whenever you're around, the sun is brighter.", Audio: "30" },
			{ Text: "Whenever you're around, the flowers smell better.", Audio: "40" },
			{ Text: "Whenever you're around, I smile a little wider.", Audio: "50" },
			{ Text: "I know this is foolish, we are both women.", Audio: "60" },
			{ Text: "I know this is foolish, we come from different casts of society.", Audio: "70" },
			{ Text: "I know this is foolish, you will marry some Duke someday.", Audio: "80" },
			{ Text: "But for this brief moment in our lives, in our adventures.", Audio: "90" },
			{ Text: "Would you be my girlfriend?", Audio: "100", AudioStyle: "serious" },

			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Olivia").Domination > 5); },
				Text: "I would be honored to be your girlfriend.  (She blushes as you jump on her for a passionate kiss.)", Audio: "110", AudioStyle: "cheerful",
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "FrenchKissMaidMelody", X: 500 }]
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Olivia").Domination >= -5) && (PlatformDialogGetCharacter("Olivia").Domination <= 5)); },
				Text: "Yes Melody!  Yes, yes, yes!  (You both get closer and exchange a passionate kiss.)", Audio: "120", AudioStyle: "cheerful",
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "FrenchKissMaidMelody", X: 500 }]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Olivia").Domination < -5); },
				Text: "No!  YOU will be my girlfriend.  (She laughs and jumps on you for a passionate kiss.)", Audio: "130", AudioStyle: "cheerful",
				Character: [{ Name: "Olivia", Status: "Oracle", Pose: "FrenchKissMaidMelody", X: 500 }]
			},
			{
				Entry: function() {
					PlatformDialogGetCharacter("Olivia").Love = PlatformDialogGetCharacter("Olivia").Love + 3;
					PlatformDialogGetCharacter("Olivia").LoverName = "Melody";
					PlatformDialogGetCharacter("Melody").LoverName = "Olivia";
					PlatformDialogGetCharacter("Olivia").LoverLevel = 1;
					PlatformDialogGetCharacter("Melody").LoverLevel = 1;
					PlatformDialogRelationshipChange();
				}
			},

			{ Text: "(You kiss and kiss again for a long time, exchanging heat and saliva.)" },
			{ Text: "(You look at each other in the eyes and run to find a comfy and private place.)" },
			{
				Text: "(You both strip down in haste and exchange giggles.)",
				Background: "Black",
				Character: [
					{ Name: "Olivia", Status: "Chastity", Pose: "LookLeft", X: 1000 },
					{ Name: "Melody", Status: "Naked", Pose: "LookRight", X: 500 }
				]
			},
			{},
			{ Text: "(She looks down at her chastity belt and sighs loudly.)" },
			{
				Text: "This belt will be a problem sweetheart.", Audio: "150", AudioStyle: "sad",
				Answer: [
					{ Text: "I know!  We are so helpless my love.", Reply: "(She caresses your head slowly.)  We will find a solution someday my love.", Audio: "151", AudioStyle: "sad", Domination: -2 },
					{ Text: "I promise to unlock you someday.", Reply: "(She smiles at you.)  I know you will Melody.", Audio: "152", AudioStyle: "sad", Domination: 2 },
					{ Text: "Let's forget about it for a moment.", Reply: "(She nods in agreement.)  That is a good idea my love.", Audio: "153", AudioStyle: "sad" },
				]
			},
			{ Text: "(You both lie down, exchanging kisses and caresses all night.)" },
			{ Character: [{ Name: "Olivia", Status: "Chastity", Pose: "LayingOnNakedMelody", X: 0 }] },
			{ Text: "(Even without an orgasm, you learn to discover each other intimately.)" },
			{ Text: "(You spend your first night together as lovers, almost naked.)" },
			{ Text: "(You wake up in each other arms, smiling and talking about what lies ahead.)" },
			{ Text: "(You and Olivia are now girlfriends, the first lover stage.)" },
			{ Text: "(As Melody's lover, Olivia gets +10% health points.)" },
			{ Text: "(As Olivia's lover, Melody gets +10% experience points.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "OliviaLover1End",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{ Text: "(You exchange a cold stare.)" },
			{ Text: "I do not like that look on your face.", Audio: "10", AudioStyle: "sad" },
			{
				Text: "What is on your mind Melody?", Audio: "20", AudioStyle: "sad",
				Answer: [
					{
						Text: "(Break up with her.)",
						Reply: "Then it's over.  You do not want me as your lover.", Audio: "30", AudioStyle: "sad",
						Script: function() {
							PlatformDialogGetCharacter("Olivia").Love = PlatformDialogGetCharacter("Olivia").Love - 6;
							if (PlatformDialogGetCharacter("Olivia").Love >= 19) PlatformDialogGetCharacter("Olivia").Love = 18;
							delete PlatformDialogGetCharacter("Olivia").LoverName;
							delete PlatformDialogGetCharacter("Melody").LoverName;
							delete PlatformDialogGetCharacter("Olivia").LoverLevel;
							delete PlatformDialogGetCharacter("Melody").LoverLevel;
							PlatformDialogRelationshipChange();
						}
					},
					{ Text: "(Kiss her.)", Reply: "(You share a quick kiss before the adventure continues.)", Goto: "Skip" },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Olivia").Domination > 5); },
				Text: "Life is so unfair!  (She starts to cry.)", Audio: "40", AudioStyle: "sad",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Olivia").Domination >= -5) && (PlatformDialogGetCharacter("Olivia").Domination <= 5)); },
				Text: "I am sad to hear that.  (She sighs loudly.)", Audio: "50", AudioStyle: "sad",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSad", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Olivia").Domination < -5); },
				Text: "It is fine for me.  You're only a maid, I can do much better.", Audio: "60", AudioStyle: "serious",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{ Text: "Our love was doomed from the beginning.", Audio: "70", AudioStyle: "sad" },
			{ Text: "I will marry Duke Sunesk of Slandia next year.", Audio: "80", AudioStyle: "sad" },
			{ Text: "Let's pretend that we never dated and continue our quest.", Audio: "90" },
			{ Text: "There is more at stake than a silly impossible romance.", Audio: "100" },
			{ Text: "(You and Olivia are no longer lovers.)" },
			{ Text: "(Melody loses her experience bonus and Olivia loses her health bonus.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "OliviaDomination1Start",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia"); },
				Text: "(You grab Olivia's butt as she smiles at you.)  Hello my love.", Audio: "11", AudioStyle: "serious",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleHappy", X: 1000 },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Olivia"); },
				Text: "(You get closer to Olivia with a grin on your face.)  Hello girl.", Audio: "12", AudioStyle: "serious",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive", X: 1000 },
				]
			},
			{
				Text: "(She gets flustered and looks down at the ground.)",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{ Text: "Hello Melody, why are you looking at me like that?  (She trembles a little.)", Audio: "14", AudioStyle: "terrified" },
			{
				Text: "How can I help you?", Audio: "20", AudioStyle: "terrified",
				Answer: [
					{ Text: "(Propose to become her Protector.)", Reply: "(You stare at her in the eyes as she bows her head.)" },
					{ Text: "(Talk about the weather.)", Reply: "(She sighs and turns away.)", Domination: -1, Goto: "Skip" },
					{ Text: "(Pet her head.)", Reply: "(She giggles but quickly turns away.)", Perk: true, Goto: "Skip" }
				]
			},
			{
				Text: "Olivia, I've been there for you since you were a child.", Audio: "30", AudioStyle: "serious",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive", X: 1000 },
				]
			},
			{ Text: "I was there to protect you when the other kids were mean with you.", Audio: "40", AudioStyle: "serious" },
			{ Text: "I was there to catch you when you fell down the stairs.", Audio: "50", AudioStyle: "serious" },
			{ Text: "I was there to lock and unlock you every day.", Audio: "60", AudioStyle: "serious" },
			{ Text: "I was there to pull you out when the kitchen caught on fire.", Audio: "70", AudioStyle: "serious" },
			{ Text: "I was there to rescue you when Camille locked you up.", Audio: "80", AudioStyle: "serious" },
			{ Text: "Wherever you go, whatever you do, I will be there for you.", Audio: "90", AudioStyle: "serious" },
			{ Text: "Your health isn't great, you're not very strong and you have many fears.", Audio: "100", AudioStyle: "serious" },
			{ Text: "I'm in great shape, I'm stronger than a bull and nothing scares me.", Audio: "110", AudioStyle: "serious" },
			{ Text: "You need someone like me, you need a guide, a Protector.", Audio: "120", AudioStyle: "serious" },
			{ Text: "Will you be my protégée?", Audio: "130", AudioStyle: "serious" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia"); },
				Text: "Yes sweetie.  I would be thrilled to be both your lover and protégée.", Audio: "140", AudioStyle: "cheerful",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleHappy", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Olivia"); },
				Text: "Yes Melody.  I would be honored to be your protégée.", Audio: "150", AudioStyle: "calm",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Entry: function() {
					PlatformDialogGetCharacter("Olivia").Domination = PlatformDialogGetCharacter("Olivia").Domination + 3;
					PlatformDialogGetCharacter("Olivia").OwnerName = "Melody";
					PlatformDialogGetCharacter("Olivia").OwnerLevel = 1;
					PlatformDialogRelationshipChange();
				},
				Text: "Please explain to me what it means exactly.", Audio: "160", AudioStyle: "calm"
			},
			{
				Text: "Does it change our relationship?", Audio: "170",
				Answer: [
					{ Text: "It won't change much.", Reply: "I am confused Melody.  Please explain.", Audio: "171", Domination: -2 },
					{ Text: "It means I will control you.", Reply: "(She nods slowly.)  Control me how?", Audio: "172", Domination: 2 },
					{ Text: "Let me explain.", Reply: "(She nods and listens to you.)" },
				]
			},
			{
				Text: "Come closer girl.  Get on your knees next to me.", Audio: "180", AudioStyle: "serious",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive", X: 1000 },
				]
			},
			{
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Olivia", Status: "Oracle", Pose: "Kneel", X: 1000 },
				]
			},
			{ Text: "(She nods and slowly gets on her knees.  She trembles and breathes quickly.)" },
			{ Text: "As your Protector, I will always be there to protect you.", Audio: "200", AudioStyle: "serious" },
			{ Text: "As my protégée, you will follow my rules and commands.", Audio: "210", AudioStyle: "serious" },
			{ Text: "As your Protector, I will make sure you stay healthy and give you physical training.", Audio: "220", AudioStyle: "serious" },
			{ Text: "As my protégée, you will kneel, dance, run and sing for me.", Audio: "230", AudioStyle: "serious" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia"); },
				Text: "As my protégée and lover, you will be restrained to pleasure me from time to time.", Audio: "240", AudioStyle: "serious"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "As my protégée, you need to accept that I'm dating Edlaran.  Do not fight with her.", Audio: "250", AudioStyle: "serious"
			},
			{ Text: "As your Protector, I will lock your every night and unlock you every morning.", Audio: "260", AudioStyle: "serious" },
			{ Text: "As my protégée, you will respect me and call me 'Miss'.", Audio: "270", AudioStyle: "serious" },
			{ Text: "Do you understand my girl?", Audio: "280", AudioStyle: "serious" },
			{
				Text: "(She gets closer to you as you pet her head.)  Yes Mel...  Yes Miss.", Audio: "290", AudioStyle: "calm",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "KneelMaidMelody", X: 500 },
				]
			},
			{ Text: "I will aim to be the best protégée ever, Miss Melody.", Audio: "300", AudioStyle: "calm" },
			{ Text: "Under your wing, nothing will scare me anymore.", Audio: "310", AudioStyle: "calm" },
			{ Text: "(You're now Olivia's Protector, the first owner stage.)" },
			{ Text: "(As Melody's submissive, Olivia gets +10% health points.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "OliviaDomination1End",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{ Text: "(She seems nervous and doesn't dare to look at you.)" },
			{ Text: "I'm scared Miss.  I am not sure what is going on.", Audio: "10", AudioStyle: "terrified" },
			{
				Text: "What is on your mind?", Audio: "20", AudioStyle: "terrified",
				Answer: [
					{
						Text: "(Release her from your ownership.)",
						Reply: "Miss?  Are you releasing me?", Audio: "30", AudioStyle: "terrified",
						Script: function() {
							PlatformDialogGetCharacter("Olivia").Domination = PlatformDialogGetCharacter("Olivia").Domination - 6;
							if (PlatformDialogGetCharacter("Olivia").Domination >= 19) PlatformDialogGetCharacter("Olivia").Domination = 18;
							delete PlatformDialogGetCharacter("Olivia").OwnerName;
							delete PlatformDialogGetCharacter("Olivia").OwnerLevel;
							PlatformDialogRelationshipChange();
						}
					},
					{ Text: "(Pet her head.)", Reply: "(You pet her head before the adventure continues.)", Goto: "Skip" },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia"); },
				Text: "It will be hard for me sweetie.  But at least I will still have your loving kisses.", Audio: "40", AudioStyle: "terrified",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSad", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Olivia"); },
				Text: "My life without a Protector will be hard.  But I will be strong, I will get over it.", Audio: "50", AudioStyle: "terrified",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleSad", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{ Text: "Maybe it never made any sense from the start.", Audio: "60", AudioStyle: "terrified" },
			{ Text: "You're a maid and I'm of noble blood.", Audio: "70" },
			{ Text: "Let's forget this story, we have a long quest ahead.", Audio: "80" },
			{ Text: "(You're no longer Olivia's Dominant.  She loses her health bonus.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "OliviaSubmission1Start",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Text: "(You nervously get closer to Olivia, not daring to say a word.)",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{ Text: "(She looks at you and smiles warmly.)" },
			{
				Text: "What is on your mind my maid?", Audio: "10", AudioStyle: "serious",
				Answer: [
					{ Text: "(Propose to become her submissive.)", Reply: "(As you start to speak, she puts a finger on your mouth.)" },
					{ Text: "(Talk about a dream you had.)", Reply: "(She sighs and turns away.)", Domination: 1, Goto: "Skip" },
					{ Text: "(Compliment her.)", Reply: "(She smiles but quickly turns away.)", Perk: true, Goto: "Skip" }
				]
			},
			{ Text: "Do not talk little Melody.  I know you better than yourself.", Audio: "20", AudioStyle: "serious" },
			{ Text: "We have known each other for such a long time.  I will talk for both of us.", Audio: "30", AudioStyle: "serious" },
			{ Text: "(You nod slowly and listen to Lady Olivia.)" },
			{ Text: "You have been a servant for our family for your whole life.", Audio: "40", AudioStyle: "serious" },
			{ Text: "Since we started adventuring, you lost something that was important to you.", Audio: "50", AudioStyle: "serious" },
			{ Text: "You lost the submission and dedication that you were giving to Mother.  You lost the control she had over you.", Audio: "60", AudioStyle: "serious" },
			{ Text: "You are a submissive, you need to be controlled, you need a Protector.", Audio: "70", AudioStyle: "serious" },
			{ Text: "I am not as strong as Mother, but I could be that Protector.", Audio: "80", AudioStyle: "serious" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia"); },
				Text: "(She kisses you.)  I love you so much sweetie, I care for you.", Audio: "90", AudioStyle: "serious"
			},
			{
				Text: "Will you be my protégée?", Audio: "100", AudioStyle: "serious",
				Answer: [
					{ Text: "Yes!", Reply: "(She nods.)  I knew you would.", Audio: "101", AudioStyle: "serious" },
					{ Text: "That would be an honor, Lady Olivia.", Reply: "(She smiles and caresses your hair slowly.)", Domination: -2 },
					{ Text: "I guess so.", Reply: "(She giggles.)  I expected a more convincing answer.", Audio: "103", AudioStyle: "serious", Domination: 2 },
				]
			},
			{
				Entry: function() {
					PlatformDialogGetCharacter("Olivia").Domination = PlatformDialogGetCharacter("Olivia").Domination - 3;
					PlatformDialogGetCharacter("Melody").OwnerName = "Olivia";
					PlatformDialogGetCharacter("Melody").OwnerLevel = 1;
					PlatformDialogRelationshipChange();
				},
				Text: "(She looks at you and inspects your maid costume.)"
			},
			{ Text: "From now on, you will be both my maid and my pet.", Audio: "110", AudioStyle: "serious" },
			{ Text: "I will take care of you.  You will learn literature, science and etiquette.", Audio: "120", AudioStyle: "serious" },
			{ Text: "In exchange, you will worship the ground that I walk on.  Just like you did for Mother.", Audio: "130", AudioStyle: "serious" },
			{ Text: "When this adventure is over, the roles will be reversed.  You will be chained up at night in my room.", Audio: "140", AudioStyle: "serious" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia"); },
				Text: "(She smiles.)  Sweetheart, I will restrain you tight in my bed, to hug you all night when we sleep.", Audio: "150", AudioStyle: "serious"
			},
			{ Text: "I will ensure that you take clever choices in life.  You will become the best maid in the land.", Audio: "160", AudioStyle: "serious" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "We will review the romantic affair you are having with the elf thief another day.", Audio: "170", AudioStyle: "serious"
			},
			{ Text: "You will cook, clean, iron, brush my hair, massage and even take hits for me.", Audio: "180", AudioStyle: "serious" },
			{ Text: "You will kiss my feet if I ask you.  I want total control.", Audio: "190", AudioStyle: "serious" },
			{ Text: "In fact, get on your knees right now, and put your arms behind your back.", Audio: "200", AudioStyle: "serious" },
			{
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleAngry", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "KneelRight", X: 500 },
				]
			},
			{ Text: "(You slowly obey and get on your knees.)" },
			{ Text: "You will get on your knees whenever I ask you.", Audio: "210", AudioStyle: "serious" },
			{ Text: "Now bend down to my feet while keeping your arms behind your back.", Audio: "220", AudioStyle: "serious" },
			{
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "StrictMaidMelodyKissFeet", X: 500 },
				]
			},
			{ Text: "(You awkwardly comply and reach her heel with your face.)" },
			{ Text: "This is how you will greet me my pet.  Kiss my feet.", Audio: "230", AudioStyle: "serious" },
			{ Text: "(You carefully kiss her feet many times as she smirks.)" },
			{ Text: "It will be wonderful to have you as my maid and pet.  I will take good care of you.", Audio: "240", AudioStyle: "serious" },
			{ Text: "(Olivia is now your Protector, the first owner stage.)" },
			{ Text: "(As Olivia's submissive, Melody gets +10% experience points.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "OliviaSubmission1End",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{ Text: "(You get close to Olivia and stare at her in the eyes.)" },
			{ Text: "I can see that something is troubling you.", Audio: "10", AudioStyle: "serious" },
			{
				Text: "What is on your mind my pet?", Audio: "20", AudioStyle: "serious",
				Answer: [
					{
						Text: "(Get released from her ownership.)",
						Reply: "I am not happy to hear this.", Audio: "30", AudioStyle: "sad",
						Script: function() {
							PlatformDialogGetCharacter("Olivia").Domination = PlatformDialogGetCharacter("Olivia").Domination + 6;
							if (PlatformDialogGetCharacter("Olivia").Domination <= -19) PlatformDialogGetCharacter("Olivia").Domination = -18;
							delete PlatformDialogGetCharacter("Melody").OwnerName;
							delete PlatformDialogGetCharacter("Melody").OwnerLevel;
							PlatformDialogRelationshipChange();
						}
					},
					{ Text: "(Do a maid curtsy.)", Reply: "(You do a maid curtsy, and the adventure continues.)", Goto: "Skip" },
				]
			},
			{
				Text: "(She sighs.)  I will miss having you as my pet, but you will always be my maid.", Audio: "40", AudioStyle: "sad",
				Character: [
					{ Name: "Olivia", Status: "Oracle", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Melody"); },
				Text: "Our love is stronger than any Protector and protégée status anyway.", Audio: "50", AudioStyle: "sad",
			},
			{ Text: "I hope you learned a few things as my girl, and you could grow from it.", Audio: "60" },
			{ Text: "Enjoy your freedom Melody, remember that there is a home for you if you want to be my pet again.", Audio: "70" },
			{ Text: "(You're no longer Olivia's submissive.  You lose the experience bonuses.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "EdlaranLover1Start",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},

			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Edlaran").Domination > 5); },
				Text: "(You lick your lips and get closer to Edlaran.)",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Edlaran").Domination >= -5) && (PlatformDialogGetCharacter("Edlaran").Domination <= 5)); },
				Text: "(You come closer to Edlaran and look at each other in the eyes.)",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy", X: 500 },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Edlaran").Domination < -5); },
				Text: "(You slowly come closer to Edlaran and look down.)",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},

			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Edlaran").Domination > 5); },
				Text: "(She giggles shyly, not daring to look at you.)",
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Edlaran").Domination >= -5) && (PlatformDialogGetCharacter("Edlaran").Domination <= 5)); },
				Text: "(She trembles a little, looking at your eyes while smiling.)",
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Edlaran").Domination < -5); },
				Text: "(She makes a smug smile and address you confidently.)",
			},

			{
				Text: "Melody, what's going on?", Audio: "10",
				Answer: [
					{ Text: "(Propose to become girlfriends.)", Reply: "(You take a long stare at each other and smile.)" },
					{ Text: "(Talk about an insect you saw.)", Reply: "(She rolls her eyes up and turns away.)", Love: -1, Goto: "Skip" },
					{ Text: "(Compliment her.)", Reply: "(She smiles but quickly turns away.)", Perk: true, Goto: "Skip" }
				]
			},
			{
				Text: "Edlaran, we've only known each other for a little while.", Audio: "20",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy" },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy" }
				]
			},
			{ Text: "But I feel there is something strong between us.", Audio: "30" },
			{ Text: "Your eyes, your smile, your laughter.  I love everything about you.", Audio: "40" },
			{ Text: "This might sound weird or ridiculous, please hear me.", Audio: "50" },
			{ Text: "You're an elf and I'm human, we are both women, and we have such different backgrounds.", Audio: "60" },
			{ Text: "Whenever you smile, I smile.  Whenever you laugh, I laugh.", Audio: "70" },
			{ Text: "I don't know where life will lead us, but I'm so happy it brought me to you.", Audio: "80" },
			{ Text: "Would you be my girlfriend?", Audio: "90" },

			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Edlaran").Domination > 5); },
				Text: "Absolutely!  I would love to be your girlfriend.  (She blushes as you grab her for a loving kiss.)", Audio: "100", AudioStyle: "cheerful",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy", X: 500 },
				]
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Edlaran").Domination >= -5) && (PlatformDialogGetCharacter("Edlaran").Domination <= 5)); },
				Text: "Oh yeah!  Yes Melody!  (You get closer and exchange a loving kiss.)", Audio: "110", AudioStyle: "cheerful",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy", X: 500 },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Edlaran").Domination < -5); },
				Text: "Melody, you sexy little maid.  Yes!  (She grins and grabs you for a loving kiss.)", Audio: "120", AudioStyle: "cheerful",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy", X: 500 },
				]
			},
			{
				Entry: function() {
					PlatformDialogGetCharacter("Edlaran").Love = PlatformDialogGetCharacter("Edlaran").Love + 3;
					PlatformDialogGetCharacter("Edlaran").LoverName = "Melody";
					PlatformDialogGetCharacter("Melody").LoverName = "Edlaran";
					PlatformDialogGetCharacter("Edlaran").LoverLevel = 1;
					PlatformDialogGetCharacter("Melody").LoverLevel = 1;
					PlatformDialogRelationshipChange();
				},
				Character: [{ Name: "Edlaran", Status: "Archer", Pose: "FrenchKissMaidMelody" }]
			},
			{ Text: "(You kiss each other on the mouth, cheeks and neck.  Moaning a little with each kiss.)" },
			{ Text: "I love you Melody.  I hope we stay together for a long time.", Audio: "130", AudioStyle: "cheerful" },
			{
				Text: "We will have so much fun!", Audio: "140", AudioStyle: "cheerful",
				Answer: [
					{ Text: "Let's have even more fun.", Reply: "(She giggles and nods.)  I agree.", Audio: "141", AudioStyle: "cheerful", Domination: 1, Love: 1 },
					{ Text: "(Blush.)  Should we have more fun?", Reply: "(She smirks.)  Absolutely.", Audio: "142", AudioStyle: "cheerful", Domination: -1, Love: 1 },
					{ Text: "We will have fun when our quest is done.", Reply: "(She nods.)  Yes my love, I agree.  We need to focus on the mission.", Audio: "143", Domination: 1, Goto: "NoSex" },
					{ Text: "Is it wise to think about fun?", Reply: "(She checks her quiver.)  That's correct, sweetie.  We need to focus on the mission.", Audio: "144", Domination: -1, Goto: "NoSex" }
				]
			},
			{ Text: "(You hastily run away to find a private place.)" },
			{
				Text: "(You both strip down and smile at each other warmly.)",
				Background: "Black",
				Character: [
					{ Name: "Edlaran", Status: "Naked", Pose: "LookLeft", X: 1000 },
					{ Name: "Melody", Status: "Naked", Pose: "LookRight", X: 500 }
				]
			},
			{},
			{ Text: "You're so beautiful naked my love.", Audio: "150", AudioStyle: "cheerful" },
			{ Text: "I want to feel you.  I want to taste you.", Audio: "160", AudioStyle: "cheerful" },
			{
				Text: "(You both lie down, pussy against pussy.)",
				Character: [{ Name: "Edlaran", Status: "Naked", Pose: "ScissorNakedMelody", X: 0 }]
			},
			{},
			{ Text: "This is such a magical moment!", Audio: "170", AudioStyle: "cheerful" },
			{ Text: "(You rub each other pussy slowly and lovingly.)" },
			{ Text: "Oh yeah!  I love you Melody!", Audio: "180", AudioStyle: "cheerful" },
			{ Text: "(You both rub faster and faster, scissoring each other with passion.)" },
			{ Text: "Yyyyyyeeeeeeeeaaaaaahhhh!" },
			{ Text: "(You get shattering orgasms, sharing your newfound love.)" },
			{ ID: "NoSex", Text: "(You and Edlaran are now girlfriends, the first lover stage.)" },
			{ Text: "(As Melody's lover, Edlaran gets +10% health points.)" },
			{ Text: "(As Edlaran's lover, Melody gets +10% walking & running speed.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },

		],
	},

	{
		Name: "EdlaranLover1End",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{ Text: "(You give a weird look to each other.)" },
			{
				Text: "Melody, what's going on?", Audio: "10",
				Answer: [
					{
						Text: "(Break up with her.)",
						Reply: "That's it?  You had your fun and now it's over?", Audio: "20", AudioStyle: "sad",
						Script: function() {
							PlatformDialogGetCharacter("Edlaran").Love = PlatformDialogGetCharacter("Edlaran").Love - 6;
							if (PlatformDialogGetCharacter("Edlaran").Love >= 19) PlatformDialogGetCharacter("Edlaran").Love = 18;
							delete PlatformDialogGetCharacter("Edlaran").LoverName;
							delete PlatformDialogGetCharacter("Melody").LoverName;
							delete PlatformDialogGetCharacter("Edlaran").LoverLevel;
							delete PlatformDialogGetCharacter("Melody").LoverLevel;
							PlatformDialogRelationshipChange();
						}
					},
					{ Text: "(Kiss her.)", Reply: "(You enjoy a short kiss before the journey goes on.)", Goto: "Skip" },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Edlaran").Domination > 5); },
				Text: "Why?  Why now?  What did I do?  (She starts to cry.)", Audio: "30", AudioStyle: "sad",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Edlaran").Domination >= -5) && (PlatformDialogGetCharacter("Edlaran").Domination <= 5)); },
				Text: "This is really disappointing.  (She pouts and lowers and shoulders.)", Audio: "40", AudioStyle: "sad",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleSad", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Edlaran").Domination < -5); },
				Text: "It's not that bad.  I've had humans before you and I'll get more after you're dead.", Audio: "50", AudioStyle: "angry",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{ Text: "Just like seasons, our love was never meant to last.", Audio: "60", AudioStyle: "sad" },
			{ Text: "Let's forget this silly affair and resume our journey.", Audio: "70" },
			{ Text: "Our quest is way more important than some romance.", Audio: "80" },
			{ Text: "(You and Edlaran are no longer lovers.)" },
			{ Text: "(Melody loses her speed bonus and Edlaran loses her health bonus.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "EdlaranDomination1Start",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "(You get closer to Edlaran and grope her breast.)  I love you little elf.", Audio: "10", AudioStyle: "cheerful",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy", X: 1000 },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran"); },
				Text: "(You get closer to Edlaran and cross your arms.)  Hi little elf.", Audio: "20",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleSubmissive", X: 1000 },
				]
			},
			{
				Text: "(She gets nervous and takes a few breaths before answering.)",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{ Text: "Hi Melody.  Sorry, I should not be nervous.  There's something strange in the air.", Audio: "30", AudioStyle: "terrified" },
			{
				Text: "What's going on?", Audio: "40", AudioStyle: "terrified",
				Answer: [
					{ Text: "(Propose to become her Protector.)", Reply: "(You get even closer as she takes deep breaths.)" },
					{ Text: "(Talk about a cloud you saw.)", Reply: "(She rolls her eyes up and turns away.)", Domination: -1, Goto: "Skip" },
					{ Text: "(Compliment her.)", Reply: "(She smiles but quickly turns away.)", Perk: true, Goto: "Skip" }
				]
			},
			{
				Text: "Face me little elf, we need to talk.", Audio: "50",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleSubmissive", X: 1000 },
				]
			},
			{ Text: "You have no structure.  You don't know where you sleep from night to night.", Audio: "60" },
			{ Text: "You have no plans in life, you simply get drunk and steal your meals.", Audio: "70" },
			{ Text: "You live a life of petty crimes, getting jailed or banned wherever you go.", Audio: "80" },
			{ Text: "You need a coach, a mentor, someone to put you in the right track.", Audio: "90" },
			{ Text: "You need a Protector, someone to control you and your bad habits.", Audio: "100" },
			{ Text: "I could be your Protector and guide you through life.", Audio: "110" },
			{ Text: "Would you be my protégée?", Audio: "120" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "(She gulps and nods.)  Yes, my love, it sounds like a good idea.", Audio: "130", AudioStyle: "calm",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleHappy", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran"); },
				Text: "(She gulps and nods.)  Yes Melody, it sounds like a good idea.", Audio: "140", AudioStyle: "calm",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Entry: function() {
					PlatformDialogGetCharacter("Edlaran").Domination = PlatformDialogGetCharacter("Edlaran").Domination + 3;
					PlatformDialogGetCharacter("Edlaran").OwnerName = "Melody";
					PlatformDialogGetCharacter("Edlaran").OwnerLevel = 1;
					PlatformDialogRelationshipChange();
				},
				Text: "But it won't be easy to undo my bad habits.", Audio: "150"
			},
			{
				Text: "You want to change my life?", Audio: "160", AudioStyle: "calm",
				Answer: [
					{ Text: "We'll review your habits later.", Reply: "(She nods.)  Yes, let's not rush anything.", Audio: "161", AudioStyle: "calm" },
					{ Text: "You will keep some freedom.", Reply: "That should be fine then!", Audio: "162", Domination: -2 },
					{ Text: "I will supervise what you do.", Reply: "(She bows her head.)  Yes Melody.", Audio: "163", AudioStyle: "calm", Domination: 2 },
				]
			},
			{ Text: "What will change between us?  Will there be rules?", Audio: "170", AudioStyle: "calm" },
			{
				Text: "Yes, rules will be introduced with time.", Audio: "180",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleSubmissive", X: 1000 },
				]
			},
			{ Text: "Get on your knees my girl.", Audio: "190" },
			{
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "StareDownRight", X: 500 },
					{ Name: "Edlaran", Status: "Archer", Pose: "KneelLeft", X: 1000 },
				]
			},
			{ Text: "As your Protector, you will kneel for me.", Audio: "200" },
			{ Text: "As my protégée, you will do physical training every day.", Audio: "210" },
			{ Text: "As your Protector, I will make sure you live an honest life.", Audio: "220" },
			{ Text: "As my protégée, you will be punished or restrained if you fail to obey my commands.", Audio: "230" },
			{ Text: "As your Protector, I will ensure that you stay healthy and ready for battle.", Audio: "240" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "As my protégée and lover, you will be put in bondage when we have sex.", Audio: "250", AudioStyle: "cheerful"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia"); },
				Text: "As my protégée, you need to accept that I'm dating Olivia.  Do not fight with her.", Audio: "260", AudioStyle: "angry"
			},
			{ Text: "As my protégée, you will call me 'Miss' or 'Miss Melody'.", Audio: "270" },
			{ Text: "As your Protector, I will spank you from time to time for my amusement.", Audio: "280" },
			{ Text: "Present your butt my girl.", Audio: "290" },
			{
				Text: "Oh!  Yes Miss Melody.  (She presents her butt for her first spanking.)", Audio: "300", AudioStyle: "calm",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "SpankedMaidMelody", X: 500 },
				]
			},
			{ Text: "I will try to follow your orders and live a better life.", Audio: "310", AudioStyle: "calm" },
			{ Text: "(She presents her butt again for another playful spank.)" },
			{ Text: "(You're now Edlaran's Protector, the first owner stage.)" },
			{ Text: "(As Melody's submissive, Edlaran gets +10% health points.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "EdlaranDomination1End",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{ Text: "(You get closer to Edlaran with a stern look on your face.)" },
			{ Text: "Hi Miss Melody.  I hope you're having a good day.", Audio: "10", AudioStyle: "calm" },
			{
				Text: "Would you like to talk about something?", Audio: "20", AudioStyle: "calm",
				Answer: [
					{
						Text: "(Release her from your ownership.)",
						Reply: "Oh!  You don't want me anymore.", Audio: "30", AudioStyle: "sad",
						Script: function() {
							PlatformDialogGetCharacter("Edlaran").Domination = PlatformDialogGetCharacter("Edlaran").Domination - 6;
							if (PlatformDialogGetCharacter("Edlaran").Domination >= 19) PlatformDialogGetCharacter("Edlaran").Domination = 18;
							delete PlatformDialogGetCharacter("Edlaran").OwnerName;
							delete PlatformDialogGetCharacter("Edlaran").OwnerLevel;
							PlatformDialogRelationshipChange();
						}
					},
					{ Text: "(Pinch her cheek.)", Reply: "(You pinch her playfully and the adventure continues.)", Goto: "Skip" },
				]
			},
			{
				Text: "That sucks, I thought you enjoyed having me under your wing.", Audio: "40", AudioStyle: "sad",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleSad", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "At least we'll still have each other in bed my love.", Audio: "50", AudioStyle: "sad",
			},
			{ Text: "Maybe I'll find another owner someday.  I don't know.", Audio: "60", AudioStyle: "sad" },
			{ Text: "I'm a free elf after all.  I should not be controlled by a human.", Audio: "70" },
			{ Text: "Without chains, I'll be able to do more shady businesses.", Audio: "80" },
			{ Text: "Is it a crime to do shady businesses?  Don't answer.", Audio: "90" },
			{ Text: "(You're no longer Edlaran's Dominant.  She loses the health bonus.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "EdlaranSubmission1Start",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "(You get closer to Edlaran as she pinches your cheek.)  I love you Miss Edlaran.", Audio: "10", AudioStyle: "cheerful",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy", X: 500 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleCheer", X: 1000 },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran"); },
				Text: "(You get closer to Edlaran and address her timidly.)  Hello Miss Edlaran.", Audio: "20", AudioStyle: "whisper",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 1000 },
				]
			},
			{
				Text: "(She smirks and looks at you slowly from head to feet.)",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{ Text: "Miss Edlaran?  That sounds good.", Audio: "30" },
			{
				Text: "What's going on little maid?", Audio: "40", AudioStyle: "cheerful",
				Answer: [
					{ Text: "(Propose to become her submissive.)", Reply: "(You bow your head and take a deep breath.)" },
					{ Text: "(Talk about an animal you saw.)", Reply: "(She rolls her eyes up and turns away.)", Domination: 1, Goto: "Skip" },
					{ Text: "(Compliment her.)", Reply: "(She smiles but quickly turns away.)", Perk: true, Goto: "Skip" }
				]
			},
			{
				Text: "Miss Edlaran, please listen to me.", Audio: "50",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 1000 },
				]
			},
			{ Text: "I'm not sure why, but I see something in you.  I see strength.", Audio: "60" },
			{ Text: "You're free, you're careless, you're quick and you're resourceful.", Audio: "70" },
			{ Text: "I would love to learn from you.  I would love to follow you.", Audio: "80" },
			{ Text: "Would you like to be my mentor and Protector?  I could be your protégée.", Audio: "90" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "Your Protector my love?  That's very interesting.  (She thinks for one second.)", Audio: "100",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy", X: 500 },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Edlaran"); },
				Text: "Your Protector Melody?  That's interesting. (She thinks for a few seconds.)", Audio: "110",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{
				Entry: function() {
					PlatformDialogGetCharacter("Edlaran").Domination = PlatformDialogGetCharacter("Edlaran").Domination - 3;
					PlatformDialogGetCharacter("Melody").OwnerName = "Edlaran";
					PlatformDialogGetCharacter("Melody").OwnerLevel = 1;
					PlatformDialogRelationshipChange();
				},
				Text: "Fine!  I'll do it!  I'll take control of you.", Audio: "120"
			},
			{ Text: "I'll teach you my tricks.  You'll run faster than the wind.", Audio: "130" },
			{ Text: "I'll show you how to dash out of taverns and get free coins.", Audio: "140" },
			{ Text: "But don't think it will be easy.  There will be constraints.", Audio: "150" },
			{ Text: "You'll need to be polite with me.  You'll call me 'Miss' or 'Madam' or something similar.", Audio: "160" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Olivia"); },
				Text: "You can continue to date your little princess, but I will be your top priority.", Audio: "170", AudioStyle: "angry"
			},
			{ Text: "You'll have to please me from time to time, as a good slave maid should.", Audio: "180" },
			{ Text: "Since you'll be under my control, I will punish and restrain you when I want.", Audio: "190" },
			{
				Text: "Is that understood my protégée?", Audio: "200",
				Answer: [
					{ Text: "Yes Miss Edlaran.", Reply: "(She smiles and pinches your cheek.)  Good girl.", Audio: "201", AudioStyle: "cheerful", Domination: -2 },
					{ Text: "I understand.", Reply: "(She nods.)  Of course.", Audio: "202" },
					{ Text: "Maybe that wasn't a good idea.", Reply: "(She grumbles.)  Nonsense!  It will be easy.", Audio: "203", AudioStyle: "angry", Domination: 2 },
				]
			},
			{ Text: "Your first task will be to give me some pleasure.", Audio: "210" },
			{ Text: "Get on your knees, little maid.  (She pulls out a few chains.)", Audio: "220" },
			{
				Text: "(As you kneel, she quickly chains your arms and legs.)", Audio: "CommonChain",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 500 },
					{ Name: "Melody", Status: "Maid", Pose: "ChainedKneel", X: 1000 },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "(She smirks.)  This will spice up our sex life my love.  You'll get bound when we fuck.", Audio: "230", AudioStyle: "cheerful"
			},
			{ Text: "You won't be allowed to use anything but your tongue.", Audio: "240", AudioStyle: "cheerful" },
			{
				Text: "(She removes her bottom and starts to touch herself.)",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "NoPants", X: 500 },
					{ Name: "Melody", Status: "Maid", Pose: "ChainedKneel", X: 1000 },
				]
			},
			{ Text: "You're not getting out until I cum.", Audio: "250", AudioStyle: "cheerful" },
			{
				Text: "Get to work my girl!  (She pulls your head between her legs.)", Audio: "260", AudioStyle: "cheerful",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "LickedByMaidMelody" },
				]
			},
			{ Text: "(You start by playing with her clitoris with your tongue.)" },
			{ Text: "Oh!  Yeah!  Keep it up!", Audio: "270", AudioStyle: "cheerful" },
			{ Text: "(You lower your head a little and start to lick her pussy lips.)" },
			{ Text: "(In combo, you nuzzle her clitoris and lick her pussy up and down.)" },
			{ Text: "If you stop now, you will be punished for months.", Audio: "280", AudioStyle: "cheerful" },
			{ Text: "(You dig in with your tongue at start to explore inside.)" },
			{ Text: "(While trusting in and out, you masturbate her clitoris with your nose.)" },
			{
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "LickedByMaidMelodyOrgasm" },
				]
			},
			{ Text: "Yeeeeeeeeeeeeaaaaaaaaaaaahhhhh!!!" },
			{ Text: "(She gets a long and wonderful orgasm, squirting on your face.)" },
			{ Text: "Having you as my protégée is the best idea of the year.", Audio: "290", AudioStyle: "cheerful" },
			{
				Text: "(She dresses back up and releases you.)",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{ Text: "I will protect and control you my little maid.  It will be fun.", Audio: "300", AudioStyle: "cheerful" },
			{ Text: "(Edlaran is now your Protector, the first owner stage.)" },
			{ Text: "(As Edlaran's submissive, Melody gets +10% walking & running speed.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "EdlaranSubmission1End",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{ Text: "(You confidently get closer to Edlaran and shake your head from left to right.)" },
			{
				Text: "What's going on my girl?", Audio: "10",
				Answer: [
					{
						Text: "(Get released from her ownership.)",
						Reply: "It seems the bird is flying away from her nest.", Audio: "11", AudioStyle: "sad",
						Script: function() {
							PlatformDialogGetCharacter("Edlaran").Domination = PlatformDialogGetCharacter("Edlaran").Domination + 6;
							if (PlatformDialogGetCharacter("Edlaran").Domination <= -19) PlatformDialogGetCharacter("Edlaran").Domination = -18;
							delete PlatformDialogGetCharacter("Melody").OwnerName;
							delete PlatformDialogGetCharacter("Melody").OwnerLevel;
							PlatformDialogRelationshipChange();
						}
					},
					{ Text: "(Do a maid curtsy.)", Reply: "(You do a maid curtsy, and the adventure continues.)", Goto: "Skip" },
				]
			},
			{
				Text: "(She crosses her arms.)  I will miss being able to control you, but I understand.", Audio: "20", AudioStyle: "sad",
				Character: [
					{ Name: "Edlaran", Status: "Archer", Pose: "IdleAngry", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Edlaran"); },
				Text: "I hope it won't impact our sex life my love.", Audio: "30", AudioStyle: "friendly",
			},
			{ Text: "Melody, go roam and explore the world.  Have fun in your newfound freedom.", Audio: "40" },
			{ Text: "Liberty is important, I'm proud that you can go on without an owner.", Audio: "50" },
			{ Text: "(You're no longer Edlaran's submissive.  You lose the walking and running bonuses.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "LynLover1Start",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},

			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Lyn").Domination > 5); },
				Text: "(You move closer to Lyn and wink at her.)",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Lyn").Domination >= -5) && (PlatformDialogGetCharacter("Lyn").Domination <= 5)); },
				Text: "(You and Lyn suddenly get close and smile at each other.)",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleHappy", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy", X: 500 },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Lyn").Domination < -5); },
				Text: "(Lyn waves her index to invite you to come closer.)",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},

			{
				Text: "What deal are you planning Melody?", Audio: "10",
				Answer: [
					{ Text: "(Propose to become girlfriends.)", Reply: "(You both start to giggle at the same time.)" },
					{ Text: "(Talk about a rock in your shoe.)", Reply: "(She shakes her head no and turns away.)", Love: -1, Goto: "Skip" },
					{ Text: "(Talk about a business plan.)", Reply: "(You briefly talk about a business scenario before she turns away.)", Perk: true, Goto: "Skip" }
				]
			},
			{
				Text: "Lyn, we've only known each other for a little while.", Audio: "20",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy" },
					{ Name: "Lyn", Status: "Thief", Pose: "IdleHappy" }
				]
			},
			{ Text: "From the first time I saw you in your bandit camp, I knew there was something in you.", Audio: "30" },
			{ Text: "You're sexy, you're fierce, you're beautiful, you're perfect.", Audio: "40" },
			{ Text: "Since that very first battle, I got a crush on you.", Audio: "50" },
			{ Text: "It might be crazy to ask you this question Lyn, but we live in crazy times.", Audio: "60" },
			{ Text: "Would you be my girlfriend?", Audio: "100", AudioStyle: "serious" },

			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Lyn").Domination > 5); },
				Text: "I thought you would never ask!  Best deal ever!  (She blushes as you pull her close for a passionate kiss.)", Audio: "110", AudioStyle: "cheerful",
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "FrenchKissMaidMelody", X: 500 }]
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Lyn").Domination >= -5) && (PlatformDialogGetCharacter("Lyn").Domination <= 5)); },
				Text: "Yes Melody!  Best deal ever!  (You pull each other closer for a passionate kiss.)", Audio: "120", AudioStyle: "cheerful",
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "FrenchKissMaidMelody", X: 500 }]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Lyn").Domination < -5); },
				Text: "Hell yeah!  Best deal ever!  (She smirks and pulls you close for a passionate kiss.)", Audio: "130", AudioStyle: "cheerful",
				Character: [{ Name: "Lyn", Status: "Thief", Pose: "FrenchKissMaidMelody", X: 500 }]
			},
			{
				Entry: function() {
					PlatformDialogGetCharacter("Lyn").Love = PlatformDialogGetCharacter("Lyn").Love + 3;
					PlatformDialogGetCharacter("Lyn").LoverName = "Melody";
					PlatformDialogGetCharacter("Melody").LoverName = "Lyn";
					PlatformDialogGetCharacter("Lyn").LoverLevel = 1;
					PlatformDialogGetCharacter("Melody").LoverLevel = 1;
					PlatformDialogRelationshipChange();
				}
			},

			{ Text: "(You kiss each other on the hand, the cheek, the neck and the lips.)" },
			{
				Background: "Black",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleCheer", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleHappy", X: 500 }
				],
				Text: "(After lots of foreplay, you dash out to find a private place.)" },
			{ Text: "(You strip each other slowly, removing each piece of clothes with a huge smile.)" },
			{
				Character: [
					{ Name: "Lyn", Status: "Naked", Pose: "LookLeft", X: 1000 },
					{ Name: "Melody", Status: "Naked", Pose: "LookRight", X: 500 }
				]
			},
			{ Text: "Do you think my boots are sexy?  I'll keep them.", Audio: "145", AudioStyle: "cheerful" },
			{ Text: "(She looks at your body and giggles.)" },
			{
				Text: "Are you ticklish honey?", Audio: "150", AudioStyle: "cheerful",
				Answer: [
					{ Text: "No, I'm not.", Reply: "(She sighs.)  Are you sure?  Maybe we could try.", Audio: "151", AudioStyle: "cheerful", Love: -1 },
					{ Text: "(Giggle.)  Maybe a little.", Reply: "(She starts to tickle you playfully.)  You better get used to it.", Audio: "152", AudioStyle: "cheerful", Domination: -2 },
					{ Text: "No, but I'm sure you are!  (Tickle her.)", Reply: "(She laughs loudly as you tickle her.)  Melody!", Audio: "153", AudioStyle: "cheerful", Domination: 2 },
				]
			},
			{ Text: "(You tickle each other playfully and slowly slide your hands down.)" },
			{ Character: [{ Name: "Lyn", Status: "Naked", Pose: "MasturbateNakedMelody", X: 500 }] },
			{ Text: "(You rub your fingers over her clitoris as she does the same with yours.)" },
			{ Text: "Oh!  Honey!  Melody!", Audio: "160", AudioStyle: "cheerful" },
			{ Text: "(You slide a finger in each other pussies, trusting in and out.)" },
			{ Text: "(She quickly orgasms, and you follow her soon after.)" },
			{ Text: "(You both shiver for a while from that wonderful moment.)" },
			{ Text: "Honey, I love you.", Audio: "170", AudioStyle: "cheerful" },
			{ Text: "(Your first romantic night as lovers is memorable.)" },
			{ Text: "(You and Lyn are now girlfriends, the first lover stage.)" },
			{ Text: "(As Melody's lover, Lyn gets +10% health points.)" },
			{ Text: "(As Lyn's lover, Melody does +1 damage when attacking from the back.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "LynLover1End",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{ Text: "(You both look at each other, there is some tension in the air.)" },
			{ Text: "Why are you looking at me like that?", Audio: "10", AudioStyle: "sad" },
			{
				Text: "Is there something wrong honey?", Audio: "20", AudioStyle: "sad",
				Answer: [
					{
						Text: "(Break up with her.)",
						Reply: "The love deal is over then.", Audio: "30", AudioStyle: "sad",
						Script: function() {
							PlatformDialogGetCharacter("Lyn").Love = PlatformDialogGetCharacter("Lyn").Love - 6;
							if (PlatformDialogGetCharacter("Lyn").Love >= 19) PlatformDialogGetCharacter("Lyn").Love = 18;
							delete PlatformDialogGetCharacter("Lyn").LoverName;
							delete PlatformDialogGetCharacter("Melody").LoverName;
							delete PlatformDialogGetCharacter("Lyn").LoverLevel;
							delete PlatformDialogGetCharacter("Melody").LoverLevel;
							PlatformDialogRelationshipChange();
						}
					},
					{ Text: "(Kiss her.)", Reply: "(You share a loving kiss before the adventure continues.)", Goto: "Skip" },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Lyn").Domination > 5); },
				Text: "Fuck!  (She sobs and cries a few tears.)", Audio: "40", AudioStyle: "sad",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Prerequisite: function() { return ((PlatformDialogGetCharacter("Lyn").Domination >= -5) && (PlatformDialogGetCharacter("Lyn").Domination <= 5)); },
				Text: "That's sad Melody.  (She sighs loudly.)", Audio: "50", AudioStyle: "sad",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleSad", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{
				Prerequisite: function() { return (PlatformDialogGetCharacter("Lyn").Domination < -5); },
				Text: "It's fine.  I'll find someone better.", Audio: "60", AudioStyle: "serious",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{ Text: "Love would only slow down my business anyway.", Audio: "70", AudioStyle: "sad" },
			{ Text: "Let's pretend none of this happened.", Audio: "90" },
			{ Text: "(You and Lyn are no longer lovers.)" },
			{ Text: "(Melody loses her back attack bonus and Lyn loses her health bonus.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "LynDomination1Start",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn"); },
				Text: "(You spank Lyn's butt as she jumps and smiles.)  Let's talk my love.", Audio: "11", AudioStyle: "serious",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Lyn", Status: "Thief", Pose: "IdleHappy", X: 1000 },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn"); },
				Text: "(You grab Lyn and bring her closer.)  Girl, let's talk.", Audio: "12", AudioStyle: "serious",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Lyn", Status: "Thief", Pose: "IdleSubmissive", X: 1000 },
				]
			},
			{
				Text: "(She gulps and nods slowly.)",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Text: "What would you like to talk about?", Audio: "20", AudioStyle: "calm",
				Answer: [
					{ Text: "(Propose to become her Protector.)", Reply: "(She takes deep breaths as you take a serious pose.)" },
					{ Text: "(Talk about a plant you saw.)", Reply: "(She sighs and turns away.)", Domination: -1, Goto: "Skip" },
					{ Text: "(Tickle her.)", Reply: "(You tickle her playfully before the adventure continues.)", Perk: true, Goto: "Skip" },
				]
			},
			{
				Text: "Lyn, you need someone to keep you in check and watch over you.", Audio: "30", AudioStyle: "serious",
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
					{ Name: "Lyn", Status: "Thief", Pose: "IdleSubmissive", X: 1000 },
				]
			},
			{ Text: "A life of petty crimes will get you in jail or killed.", Audio: "40", AudioStyle: "serious" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn"); },
				Text: "I love you so much.  I don't want you to get hurt.", Audio: "50", AudioStyle: "serious"
			},
			{ Text: "You need to straight up, get back in line before it's too late.", Audio: "60", AudioStyle: "serious" },
			{ Text: "I can put you on the right track.  Your skills can be used to help others.", Audio: "70", AudioStyle: "serious" },
			{ Text: "I can teach you to be honest and work hard.", Audio: "80", AudioStyle: "serious" },
			{ Text: "I can also train you to get stronger, more resilient.", Audio: "90", AudioStyle: "serious" },
			{ Text: "What do you think Lyn?  Will you be my protégée?", Audio: "130", AudioStyle: "serious" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn"); },
				Text: "Yes honey.  I accept to be both your lover and minion.", Audio: "140", AudioStyle: "cheerful",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleHappy", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn"); },
				Text: "Yes Melody.  I accept to be your minion.", Audio: "150", AudioStyle: "calm",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{
				Entry: function() {
					PlatformDialogGetCharacter("Lyn").Domination = PlatformDialogGetCharacter("Lyn").Domination + 3;
					PlatformDialogGetCharacter("Lyn").OwnerName = "Melody";
					PlatformDialogGetCharacter("Lyn").OwnerLevel = 1;
					PlatformDialogRelationshipChange();
				},
				Text: "You will be a great boss.", Audio: "160", AudioStyle: "calm"
			},
			{ Text: "I hope you share the loot with your minions. (She giggles.)", Audio: "170", AudioStyle: "cheerful" },
			{
				Text: "Do you expect me to kneel for you?", Audio: "180", AudioStyle: "serious",
				Answer: [
					{ Text: "If you feel like it.", Reply: "(She shrugs.)  Alright, I'll do it.", Audio: "181", Domination: -2 },
					{ Text: "From time to time.", Reply: "I'll do it now.", Audio: "182", AudioStyle: "serious" },
					{ Text: "Always.", Reply: "(She nods slowly and complies.)", Domination: 2 },
				]
			},
			{
				Character: [
					{ Name: "Melody", Status: "Maid", Pose: "StareDownRight", X: 500 },
					{ Name: "Lyn", Status: "Thief", Pose: "KneelLeft", X: 1000 },
				]
			},
			{ Text: "From now, you will be respectful.  You can call me Miss or Boss if you prefer.", Audio: "190", AudioStyle: "serious" },
			{ Text: "When I call you, you must stop anything you're doing and come quikly.", Audio: "200", AudioStyle: "serious" },
			{ Text: "As your protector, I will punish you if you fail to obey my rules.", Audio: "201", AudioStyle: "serious" },
			{ Text: "If I want to get you bound and gagged for any reason, you will not resist.", Audio: "202", AudioStyle: "serious" },
			{ Text: "You will do exercises each day and eat better meals to stay healthy.", Audio: "210", AudioStyle: "serious" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn"); },
				Text: "Since you're also my love, you will not refuse sex without a good reason.", Audio: "220", AudioStyle: "serious"
			},
			{ Text: "You will ask me for permission before getting drunk or doing anything dangerous.", Audio: "230", AudioStyle: "serious" },
			{ Text: "Do you have any question my protégée?", Audio: "240" },
			{
				Text: "Yes Boss.  Can I still do businesses that could be viewed as illegal?", Audio: "250",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "KneelLeft", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "StareDownRight", X: 500 },
				],
				Answer: [
					{ Text: "Sure, that should be fine.", Reply: "(She smiles.)  Thanks Boss!  This is great.", Audio: "251", AudioStyle: "cheerful", Love: 2, Domination: -1 },
					{ Text: "No, these businesses are over.", Reply: "(She sighs.)  Very well Boss.", Audio: "252", AudioStyle: "sad", Love: -2, Domination: 1 },
					{ Text: "Ask me first.", Reply: "(She nods slowly.)  Yes Boss.", Audio: "253", AudioStyle: "serious" },
				]
			},
			{ Text: "You'll have the best minion in town.  I'll be a good girl.", Audio: "260" },
			{ Text: "I'll help you to make great deals.  A deal is a deal.", Audio: "270" },
			{ Text: "(You're now Lyn's Protector, the first owner stage.)" },
			{ Text: "(As Melody's submissive, Lyn gets +10% health points.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "LynDomination1End",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleSubmissive", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{ Text: "(She gulps and stares at the floor.)" },
			{ Text: "What's going on Boss?  Nothing bad, I hope.", Audio: "10", AudioStyle: "terrified" },
			{
				Text: "Am I in trouble?", Audio: "20", AudioStyle: "terrified",
				Answer: [
					{
						Text: "(Release her from your ownership.)",
						Reply: "Boss?  You're firing me?", Audio: "30", AudioStyle: "terrified",
						Script: function() {
							PlatformDialogGetCharacter("Lyn").Domination = PlatformDialogGetCharacter("Lyn").Domination - 6;
							if (PlatformDialogGetCharacter("Lyn").Domination >= 19) PlatformDialogGetCharacter("Lyn").Domination = 18;
							delete PlatformDialogGetCharacter("Lyn").OwnerName;
							delete PlatformDialogGetCharacter("Lyn").OwnerLevel;
							PlatformDialogRelationshipChange();
						}
					},
					{ Text: "(Tickle her.)", Reply: "(You tickle her playfully before the adventure continues.)", Goto: "Skip" },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn"); },
				Text: "You know what it means honey?  Less chores and more sex.  (She laughs.)", Audio: "40", AudioStyle: "calm",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleSad", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn"); },
				Text: "You know what it means Melody?  That it's time for me to hire new minions.", Audio: "50", AudioStyle: "calm",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleSad", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{ Text: "I can't be bossed by a maid anyway.", Audio: "60" },
			{ Text: "I kidnap and sell maids!  (She laughs out loud.)", Audio: "70" },
			{ Text: "Don't tell anyone I was your minion.  I have a reputation to build back.", Audio: "80" },
			{ Text: "(You're no longer Lyn's Dominant.  She loses her health bonus.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "LynSubmission1Start",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Text: "(You gulp and slowly get closer to Lyn.)",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleSubmissive", X: 500 },
				]
			},
			{ Text: "(She snaps her fingers and stares at you.)" },
			{
				Text: "Don't be so quiet girl.", Audio: "10", AudioStyle: "serious",
				Answer: [
					{ Text: "(Propose to become her submissive.)", Reply: "(She listens for a little while but quickly cuts you off.)" },
					{ Text: "(Talk about a stain on the floor.)", Reply: "(She sighs and turns away.)", Domination: 1, Goto: "Skip" },
					{ Text: "(Compliment her.)", Reply: "(She smirks but quickly turns away.)", Perk: true, Goto: "Skip" }
				]
			},
			{ Text: "Maid, there's no need to babble.", Audio: "20", AudioStyle: "serious" },
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn"); },
				Text: "Honey, you're so cute when you get flustered.", Audio: "30", AudioStyle: "serious"
			},
			{ Text: "I'll tell you what's going on.  It's easy.", Audio: "40", AudioStyle: "serious" },
			{ Text: "You're scared of what's going on and what's to come.", Audio: "50", AudioStyle: "serious" },
			{ Text: "You're a maid without a job, you're lost.", Audio: "60", AudioStyle: "serious" },
			{ Text: "You need structure in your life.  You need a Boss.  You need someone like me.", Audio: "70", AudioStyle: "serious" },
			{ Text: "I could hire you, show you the business and how to fight.", Audio: "80", AudioStyle: "serious" },
			{
				Text: "You want to be my minion?", Audio: "100", AudioStyle: "serious",
				Answer: [
					{ Text: "Boss Lyn, I will be your best minion.", Reply: "(She smirks and snaps her fingers again.)", Domination: -2 },
					{ Text: "Yes Boss!", Reply: "(She nods slowly and snaps her fingers again.)" },
					{ Text: "It looks like it.", Reply: "(She laughs and snaps her fingers again.) ", Domination: 2 },
				]
			},
			{
				Entry: function() {
					PlatformDialogGetCharacter("Lyn").Domination = PlatformDialogGetCharacter("Lyn").Domination - 3;
					PlatformDialogGetCharacter("Melody").OwnerName = "Lyn";
					PlatformDialogGetCharacter("Melody").OwnerLevel = 1;
					PlatformDialogRelationshipChange();
				},
				Text: "A minion maid will be quite useful to my purse.  I mean to my cause.", Audio: "110", AudioStyle: "serious"
			},
			{ Text: "Under my wing, you'll learn the fight dirty.  There's nothing wrong with aiming for the back.", Audio: "120" },
			{ Text: "You can call me Boss or Miss or Madam or Queen or whatever's respectful to you.", Audio: "130" },
			{ Text: "If I want you to kneel, you will kneel.  If I want you to cover for me, you will do it.", Audio: "140" },
			{ Text: "Actually, I want you on your knees right now.  Get on the ground girl.", Audio: "150", AudioStyle: "serious" },
			{
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "StareDownLeft", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "KneelRight", X: 500 },
				]
			},
			{ Text: "(She smirks as you get on your knees.)  It should not be too hard to train you.", Audio: "160", AudioStyle: "serious" },
			{ Text: "If you disobey, you will be punished, bound or tickled.  Or all of these at the same time.", Audio: "170" },
			{
				Text: "How do you feel about serving me sexually?", Audio: "180",
				Answer: [
					{ Text: "You're so cute.  I would love it.", Reply: "(She smiles.)  You're an adorable maid.", Audio: "181", AudioStyle: "cheerful", Love: 2 },
					{ Text: "You're not my type.", Reply: "(She grumbles.)  Fine!  We'll work on that later.", Audio: "182", AudioStyle: "angry", Love: -2 },
					{ Text: "We can talk about it.", Reply: "Yeah, we have lots to talk about.", Audio: "183", AudioStyle: "serious" },
					{ Text: "It would be a pleasure Boss.", Reply: "(She smirks.)  You're adorable my minion.", Audio: "184", AudioStyle: "cheerful", Love: 2, Domination: -2, Perk: true },
				]
			},
			{
				Prerequisite: function() { return !PlatformDialogIsLover("Lyn"); },
				Text: "I also love to tickle my minions, don't be surprised if it happens.", Audio: "190"
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Lyn"); },
				Text: "Honey, since I love you so much, you'll be my top minion.  Get ready to be tickled even more.", Audio: "200", AudioStyle: "cheerful"
			},
			{ Text: "I'll train and protect you well my maid.  (She pinches your cheek.)", Audio: "210" },
			{ Text: "(Lyn is now your Protector, the first owner stage.)" },
			{ Text: "(As Lyn's submissive, Melody does +1 damage when attacking from the back.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

	{
		Name: "LynSubmission1End",
		Music: "MelodyRoom",
		Dialog: [
			{
				Entry: function() { PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformRoom.Background.replace("/", ""); },
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "IdleDominant", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "IdleDominant", X: 500 },
				]
			},
			{ Text: "(You stare at each other in the eyes.)" },
			{ Text: "Minion!  Don't look at me like that!", Audio: "10", AudioStyle: "serious" },
			{
				Text: "You're defying me?", Audio: "20", AudioStyle: "serious",
				Answer: [
					{
						Text: "(Get released from her ownership.)",
						Reply: "Another mutiny?  I'm not surprised.", Audio: "30", AudioStyle: "sad",
						Script: function() {
							PlatformDialogGetCharacter("Lyn").Domination = PlatformDialogGetCharacter("Lyn").Domination + 6;
							if (PlatformDialogGetCharacter("Lyn").Domination <= -19) PlatformDialogGetCharacter("Lyn").Domination = -18;
							delete PlatformDialogGetCharacter("Melody").OwnerName;
							delete PlatformDialogGetCharacter("Melody").OwnerLevel;
							PlatformDialogRelationshipChange();
						}
					},
					{ Text: "(Do a maid curtsy.)", Reply: "(You do a maid curtsy, and the adventure continues.)", Goto: "Skip" },
				]
			},
			{
				Text: "(She sighs.)  Even maids are rebellious now, I need to crack the whip better.", Audio: "40", AudioStyle: "sad",
				Character: [
					{ Name: "Lyn", Status: "Thief", Pose: "Idle", X: 1000 },
					{ Name: "Melody", Status: "Maid", Pose: "Idle", X: 500 },
				]
			},
			{
				Prerequisite: function() { return PlatformDialogIsLover("Melody"); },
				Text: "Honey, we can still be lovers.", Audio: "50", AudioStyle: "sad",
			},
			{ Text: "You know you won't get any share of the loot now.", Audio: "60" },
			{ Text: "A deal is a deal, and the deal is broken.  You're free Melody.", Audio: "70" },
			{ Text: "(You're no longer Lyn's submissive.  You lose the back attack bonus.)" },
			{ Text: "(The adventure continues...)" },
			{ ID: "Skip", Entry: function() { PlatformDialogLeave(); } },
		],
	},

];

/**
 * Players the audio track for the dialog
 * @param {string | null} Source - The source file to use
 * @returns {void} - Nothing
 */
function PlatformDialogVoice(Source) {
	if (!PlatformAllowAudio || !PlatformDialog) return;
	if ((Source == null) || (Source == "")) {
		if (PlatformDialogAudio != null) PlatformDialogAudio.pause();
		return;
	}
	const vol = ((Player.AudioSettings == null) || (Player.AudioSettings.Volume == null)) ? 100 : Player.AudioSettings.Volume;
	if (vol > 0) {
		if (PlatformDialogAudio == null) PlatformDialogAudio = new Audio();
		if (Source.substring(0, 6) == "Common")
			PlatformDialogAudio.src = "Screens/Room/Platform/Audio/Dialog/Common/" + Source.substring(6, 1000) + ".mp3";
		else
			PlatformDialogAudio.src = "Screens/Room/Platform/Audio/Dialog/" + PlatformDialog.Name + "/" + Source + ".mp3";
		PlatformDialogAudio.currentTime = 0;
		PlatformDialogAudio.volume = Math.min(vol, 1);
		CommonPromiseCatch(PlatformDialogAudio.play());
	}
}

/**
 * Loads the dialog at a specific position
 * @param {number} Position - The position # to load
 * @returns {void} - Nothing
 */
function PlatformDialogLoadPosition(Position) {
	if (!PlatformDialog) return;
	PlatformDialogPosition = Position;
	if (Position >= PlatformDialog.Dialog.length) {
		if (PlatformDialog.Exit != null) PlatformDialog.Exit();
		PlatformDialogLeave();
		return;
	}
	if ((PlatformDialog.Dialog[Position].Prerequisite != null) && !PlatformDialog.Dialog[Position].Prerequisite()) return PlatformDialogLoadPosition(PlatformDialogPosition + 1);
	PlatformDialogText = PlatformDialog.Dialog[Position].Text ?? "";
	if (PlatformDialog.Dialog[Position].TextScript != null) PlatformDialogText = PlatformDialog.Dialog[Position].TextScript();
	PlatformDialogAnswer = PlatformDialog.Dialog[Position].Answer;
	PlatformDialogAnswerPosition = 0;
	PlatformDialogAnswerLength = (PlatformDialogAnswer == null) ? 0 : PlatformDialogAnswer.length;
	if (PlatformDialogAnswerLength > 0)
		for (let Answer of PlatformDialogAnswer ?? [])
			if ((Answer.Perk === true) && !PlatformDialogLeaderHasPerk("Manipulation"))
				PlatformDialogAnswerLength--;
	PlatformDialogReply = null;
	PlatformDialogGoto = null;
	if ((Position == 0) || (PlatformDialog.Dialog[Position].Background != null)) PlatformDialogBackground = "../Screens/Room/PlatformDialog/Background/" + PlatformDialog.Dialog[Position].Background;
	if ((Position == 0) || (PlatformDialog.Dialog[Position].Character != null)) {
		PlatformDialogCharacterDisplay = (PlatformDialog.Dialog[Position].Character == null) ? [] : CommonCloneDeep(PlatformDialog.Dialog[Position].Character);
	}
	let Audio = PlatformDialog.Dialog[Position].Audio;
	if (PlatformDialog.Dialog[Position].AudioScript != null) Audio = PlatformDialog.Dialog[Position].AudioScript();
	if (Audio) {
		PlatformDialogVoice(Audio);
	}
	if (PlatformDialog.Dialog[Position].Entry != null) PlatformDialog.Dialog[Position].Entry();
}

/**
 * Starts a specific dialog
 * @param {string} DialogName - The name of the dialog to start
 * @returns {void} - Nothing
 */
function PlatformDialogStart(DialogName) {
	PlatformDialog = null;
	for (let Dialog of PlatformDialogData)
		if (Dialog.Name == DialogName)
			PlatformDialog = Dialog;
	if (PlatformDialog == null) return;
	PlatformDialogLoadPosition(0);
	CommonSetScreen("Room", "PlatformDialog");
}

/**
 * Loads the screen
 * @type {ScreenLoadHandler}
 */
async function PlatformDialogLoad() {
}

/**
 * Draws the dialog character, text & answers
 * @returns {void} - Nothing
 */
function PlatformDialogDrawDialog() {
	if (PlatformDialogCharacterDisplay != null) {
		let X = 1000 - (PlatformDialogCharacterDisplay.length * 250);
		let Y = 0;
		for (let Character of PlatformDialogCharacterDisplay) {
			if (Character.Pose != null) {
				DrawImage("Screens/Room/PlatformDialog/Character/" + Character.Name + "/" + Character.Status + "/" + Character.Pose + ".png", (Character.X == null) ? X : Character.X, (Character.Y == null) ? Y : Character.Y);
			} else if (Character.Animation != null) {
				for (let Char of PlatformTemplate)
					if ((Char.Name == Character.Name) && (Char.Status == Character.Status))
						for (let Anim of Char.Animation)
							if (Anim.Name == Character.Animation) {
								let AnimPos = Math.floor(CommonTime() / (Anim.Speed ?? 0)) % (Anim.Cycle?.length ?? 0);
								DrawImage("Screens/Room/Platform/Character/" + Character.Name + "/" + Character.Status + "/" + Character.Animation + "/" + Anim.Cycle?.[AnimPos].toString() + ".png", (Character.X == null) ? X - 250 : Character.X, (Character.Y == null) ? Y : Character.Y);
							}
			}
			X = X + 500;
		}
	}
	if (PlatformDialogText != null) {
		let Color;
		/** @type {Platform.CharacterName} */
		let Name = /** @type {never} */ ("");
		let Love;
		let Domination;
		/** @type {number} */
		let LoverLevel = 0;
		/** @type {number} */
		let OwnerLevel = 0;
		if ((PlatformDialogCharacterDisplay != null) && (PlatformDialogCharacterDisplay.length > 0))
			for (let Character of PlatformDialogCharacter ?? [])
				if (Character.Name == PlatformDialogCharacterDisplay[0].Name) {
					// XXX: this feels wrong, since we're gonna use PlatformDialogIsOwner/Lover down below
					Name = (Character.NickName == null) ? Character.Name : /** @type {Platform.CharacterName} */ (Character.NickName);
					Color = Character.Color;
					Love = Character.Love;
					Domination = Character.Domination;
					LoverLevel = (Character.LoverLevel == null) ? 0 : Character.LoverLevel;
					OwnerLevel = (Character.OwnerLevel == null) ? 0 : Character.OwnerLevel;
				}
		if (Color == null) Color = "#ffffff";
		if ((PlatformDialogCharacterDisplay != null) && (PlatformDialogCharacterDisplay.length > 0)) {
			if (Name == null) Name = PlatformDialogCharacterDisplay[0].Name;
			DrawEmptyRect(17, 610, 366, 66, Color, 6);
			DrawRect(20, 613, 360, 60, "#000000D0");
			DrawText(Name, 200, 645, Color, "Black");
		}
		DrawEmptyRect(17, 677, 1966, 306, Color, 6);
		DrawRect(20, 680, 1960, 300, "#000000D0");
		if ((PlatformDialogAnswer == null) || (PlatformDialogReply != null)) {
			DrawTextWrap((PlatformDialogReply != null) ? PlatformDialogReply : PlatformDialogText, 75, 700, 1850, 260, Color, undefined, 6);
		} else {
			DrawTextWrap(PlatformDialogText, 75, 700, 850, 260, Color, undefined, 6);
			DrawEmptyRect(997, 677, 0, 306, Color, 6);
			let Pos = 0;
			for (let Answer of PlatformDialogAnswer)
				if ((Answer.Perk == null) || ((Answer.Perk == true) && PlatformDialogLeaderHasPerk("Manipulation")) || ((Answer.Perk == false) && !PlatformDialogLeaderHasPerk("Manipulation"))) {
					DrawText(Answer.Text, 1500, 725 + (Pos * 70), "#fe92cf", "Black");
					if (CommonIsMobile || (Pos == PlatformDialogAnswerPosition)) DrawEmptyRect(1050, 693 + (Pos * 70), 900, 63, "#fe92cf", 4);
					Pos++;
				}
		}
		if ((Love != null) && (Domination != null)) {
			DrawEmptyRect(1617, 610, 366, 66, Color, 6);
			DrawRect(1620, 613, 360, 60, "#000000D0");
			if (PlatformDialogIsOwner(Name)) OwnerLevel = (PlatformDialogGetCharacter("Melody").OwnerLevel ?? 0) * -1;
			if (!PlatformDialogIsLover(Name)) LoverLevel = 0;
			DrawImage("Screens/Room/PlatformDialog/Icon/Love" + LoverLevel.toString() + ".png", 1640, 613);
			DrawImage("Screens/Room/PlatformDialog/Icon/Domination" + OwnerLevel.toString() + ".png", 1805, 613);
			DrawText(((Love > 0) ? "+" : "") + Love.toString(), 1755, 645, Color, "Black");
			if (PlatformDialogIsOwner(Name))
				DrawText(((Domination * -1 > 0) ? "+" : "") + (Domination * -1).toString(), 1915, 645, Color, "Black");
			else
				DrawText(((Domination > 0) ? "+" : "") + Domination.toString(), 1915, 645, Color, "Black");
		}
	}
}

/**
 * Runs and draws the screen.
 * @returns {void} - Nothing
 */
function PlatformDialogRun() {
	if (!PlatformDialog) return;
	if ((PlatformDialogAnswer != null) && MouseIn(1050, 695, 900, 60 + (PlatformDialogAnswer.length - 1) * 70))
		PlatformDialogAnswerPosition = Math.floor((MouseY - 695) / 70);
	PlatformDialogDrawDialog();
	PlatformBackgroundMusic(PlatformDialog.Music);
}

/**
 * Change the love/domination value based on the option picked, influenced also by perks
 * @param {number} CurrentValue - The current value
 * @param {number} Change - The modifier to apply
 * @param {boolean} Bonus - If there's a bonus to apply or not
 * @param {number} Level
 * @returns {number} - The new stat after changes
 */
function PlatformDialogChangeValue(CurrentValue, Change, Bonus, Level) {
	if ((CurrentValue == null) || (Change == null)) return CurrentValue;
	if (Level == null) Level = 0;
	if (Bonus == null) Bonus = false;
	if (!Bonus && (CurrentValue >= 10) && (Change > 0)) Change = 1;
	if (!Bonus && (CurrentValue <= -10) && (Change < 0)) Change = -1;
	if (Bonus && (CurrentValue < 10) && (Change > 0)) Change++;
	if (Bonus && (CurrentValue > -10) && (Change < 0)) Change--;
	let Value = CurrentValue + Change;
	if (Value > 20 + Level * 20) Value = 20 + Level * 20;
	if (Value < -20 + Level * 20) Value = -20 + Level * 20;
	return Value;
}

/**
 * Pick a specific idle pose if the character allows it
 * @param {Platform.DialogCharacter} Character - The character to evaluate
 * @param {number} Love - The love value that changed
 * @param {number} Domination - The domination value that changed
 * @returns {void}
 */
function PlatformDialogSetIdlePose(Character, Love, Domination) {
	if (Character == null) return;
	const C = PlatformDialogCharacterDisplay.find(char => char.Name === Character.Name);
	if (!C) return;
	if ((C.Pose == null) || (C.Pose.substr(0, 4) != "Idle")) return;
	const T = PlatformDialogCharacterTemplate.find(char => char.Name === Character.Name);
	if (!T) return;
	if ((T.IdlePose == null) || (T.IdlePose.indexOf(C.Status) < 0))
		return;

	Love ??= 0;
	Domination ??= 0;
	if (Love >= 2 && Math.abs(Love) >= Math.abs(Domination)) {
		C.Pose = "IdleCheer";
	} else if (Love == 1 && Math.abs(Love) >= Math.abs(Domination)) {
		C.Pose = "IdleHappy";
	} else if (Love == -1 && Math.abs(Love) >= Math.abs(Domination)) {
		C.Pose = "IdleSad";
	} else if (Love <= -2 && Math.abs(Love) >= Math.abs(Domination)) {
		C.Pose = "IdleAngry";
	} else if (Domination > 0) {
		C.Pose = "IdleSubmissive";
	} else if (Domination < 0) {
		C.Pose = "IdleDominant";
	} else {
		C.Pose = "Idle";
	}
}

/**
 * Pick an answer in a specific dialog
 * @param {number} Position - The position of the answer picked
 * @returns {void} - Nothing
 */
function PlatformDialogPickAnswer(Position) {
	let P = 0;
	for (let Answer of PlatformDialogAnswer ?? [])
		if ((Answer.Perk == null) || ((Answer.Perk == true) && PlatformDialogLeaderHasPerk("Manipulation")) || ((Answer.Perk == false) && !PlatformDialogLeaderHasPerk("Manipulation"))) {
			if (Position == P) {
				PlatformDialogReply = Answer.Reply ?? null;
				PlatformDialogGoto = Answer.Goto ?? null;
				if ((PlatformDialogCharacterDisplay != null) && (PlatformDialogCharacterDisplay.length > 0))
					for (let Character of PlatformDialogCharacter ?? [])
						if (Character.Name == PlatformDialogCharacterDisplay[0].Name) {
							PlatformDialogSetIdlePose(Character, Answer.Love ?? 0, Answer.Domination ?? 0);
							let OwnerLevel = PlatformDialogIsSlave(Character.Name) ? Character.OwnerLevel : 0;
							if (PlatformDialogIsOwner(Character.Name)) OwnerLevel = (PlatformDialogGetCharacter("Melody").OwnerLevel ?? 0) * -1;
							Character.Love = PlatformDialogChangeValue(Character.Love, Answer.Love ?? 0, PlatformDialogLeaderHasPerk("Seduction"), Character.LoverLevel ?? 0);
							Character.Domination = PlatformDialogChangeValue(Character.Domination, Answer.Domination ?? 0, PlatformDialogLeaderHasPerk("Persuasion"), OwnerLevel ?? 0);
						}
				PlatformDialogVoice(Answer.Audio ?? null);
				if (Answer.Script != null) Answer.Script();
			}
			P++;
		}
}

/**
 * Alters a property (love or domination) for a specific character
 * @param {string} CharacterName - The name of the character to alter
 * @param {"Love" | "Domination"} Property - The name of the property to alter
 * @param {number} Value - The value to change
 * @returns {void} - Nothing
 */
function PlatformDialogAlterProperty(CharacterName, Property, Value) {
	if ((Character == null) || (Property == null) || (Value == null) || (Value == 0)) return;
	for (let Character of PlatformDialogCharacter ?? [])
		if (Character.Name == CharacterName) {
			let OwnerLevel = PlatformDialogIsSlave(Character.Name) ? Character.OwnerLevel : 0;
			if (PlatformDialogIsOwner(Character.Name)) OwnerLevel = (PlatformDialogGetCharacter("Melody").OwnerLevel ?? 0) * -1;
			if (Property == "Love") Character.Love = PlatformDialogChangeValue(Character.Love, Value, PlatformDialogLeaderHasPerk("Seduction"), Character.LoverLevel ?? 0);
			if (Property == "Domination") Character.Domination = PlatformDialogChangeValue(Character.Domination, Value, PlatformDialogLeaderHasPerk("Persuasion"), OwnerLevel ?? 0);
		}
}

/**
 * Processes the current dialog, can answer or skip to the next phase
 * @returns {void} - Nothing
 */
function PlatformDialogProcess() {
	if ((PlatformDialogAnswer != null) && (PlatformDialogReply == null)) return PlatformDialogPickAnswer(PlatformDialogAnswerPosition);
	if (PlatformDialogGoto != null) {
		let Pos = 0;
		for (let Dialog of PlatformDialog?.Dialog ?? []) {
			if (Dialog.ID == PlatformDialogGoto)
				return PlatformDialogLoadPosition(Pos);
			Pos++;
		}
	}
	PlatformDialogLoadPosition(PlatformDialogPosition + 1);
}

/**
 * When the user presses keys in the dialog screen
 * @type {KeyboardEventListener}
 */
function PlatformDialogKeyDown(event) {
	if (CommonKey.GetModifiers(event)) {
		return false;
	} else if (event.code === "Space" || event.code === "Enter" || event.code === "KeyJ" || event.code === "KeyK" || event.code === "KeyL") {
		PlatformDialogProcess();
		return true;
	} else if (CommonKeyMove(event) === "North") {
		PlatformDialogAnswerPosition--;
		if (PlatformDialogAnswerPosition < 0) PlatformDialogAnswerPosition = (PlatformDialogAnswer != null) ? PlatformDialogAnswer.length - 1 : 0;
		return true;
	} else if (CommonKeyMove(event) === "South") {
		PlatformDialogAnswerPosition++;
		if ((PlatformDialogAnswer != null) && (PlatformDialogAnswerPosition >= PlatformDialogAnswer.length)) PlatformDialogAnswerPosition = 0;
		return true;
	}
	return false;
}

/**
 * Exits the dialog and returns to the game
 * @returns {void} - Nothing
 */
function PlatformDialogLeave() {
	PlatformDialogVoice(null);
	CommonSetScreen("Room", "Platform");
}

/**
 * Handles clicks in the screen
 * @returns {void} - Nothing
 */
function PlatformDialogClick() {
	if ((PlatformDialogAnswer == null) || (PlatformDialogReply != null) || MouseIn(1050, 695, 900, 60 + (PlatformDialogAnswer.length - 1) * 70)) {
		if (CommonIsMobile) PlatformDialogAnswerPosition = Math.floor((MouseY - 695) / 70);
		PlatformDialogProcess();
	}
}

/**
 * Returns a dialog character
 * @param {Platform.CharacterName} Name - The name of a character
 * @returns {Platform.DialogCharacter} - The character object
 */
function PlatformDialogGetCharacter(Name) {
	if (PlatformDialogCharacter != null)
		for (let Character of PlatformDialogCharacter)
			if (Character.Name == Name)
				return Character;
	throw new Error("not supposed to happen");
}

/**
 * Returns TRUE if the party leader (Melody) has a specific social perk
 * @param {Platform.PerkName} PerkName - The name of the perk
 * @returns {boolean} - TRUE if the perk is active
 */
function PlatformDialogLeaderHasPerk(PerkName) {
	if ((PlatformParty == null) || (PlatformParty.length <= 0)) return false;
	if ((PlatformParty[0].Perk == null) || (PlatformParty[0].Perk.length < 10)) return false;
	if ((PerkName == "Seduction") && (PlatformParty[0].Perk.substring(7, 8) == "1")) return true;
	if ((PerkName == "Persuasion") && (PlatformParty[0].Perk.substring(8, 9) == "1")) return true;
	if ((PerkName == "Manipulation") && (PlatformParty[0].Perk.substring(9, 10) == "1")) return true;
	return false;
}

/**
 * Sets up some special event parameters based on the game progress
 * @returns {void}
 */
function PlatformDialogEvent() {

	// Skip events if no player is loaded
	if (PlatformPlayer == null) return;

	// In the forest capture mode, Olivia is stuck half bound in a barn
	if (PlatformEventDone("ForestCapture") && !PlatformEventDone("ForestCaptureEnd") && (PlatformPlayer.Name == "Olivia")) {
		PlatformPlayer.HalfBound = true;
		PlatformPlayer.X = 1000;
		PlatformLoadRoom("ForestBarnInterior");
	}

	// In the forest capture mode, Melody is bound, stuck in a crate
	if (PlatformEventDone("ForestCapture") && !PlatformEventDone("ForestCaptureEnd") && !PlatformEventDone("ForestCaptureRescueMelody") && (PlatformPlayer.Name == "Melody")) {
		PlatformPlayer.Health = 0;
		PlatformPlayer.Bound = true;
		PlatformPlayer.X = 1000;
		PlatformLoadRoom("ForestCrateInterior");
	}

	// In the forest capture mode, Melody can be rescued
	if (PlatformEventDone("ForestCapture") && !PlatformEventDone("ForestCaptureEnd") && PlatformEventDone("ForestCaptureRescueMelody") && (PlatformPlayer.Name == "Melody")) {
		PlatformPlayer.X = 1000;
		PlatformLoadRoom("ForestCampGround");
	}

	// In the forest capture mode, Edlaran starts at a campfire
	if (PlatformEventDone("ForestCapture") && !PlatformEventDone("ForestCaptureEnd") && (PlatformPlayer.Name == "Edlaran")) {
		PlatformPlayer.X = 1000;
		PlatformLoadRoom("ForestCampGround");
	}

}

/**
 * Returns TRUE if the character is Melody's lover, make sure that character or Melody is currently active
 * @param {Platform.CharacterName} Name - The name of a character
 * @returns {boolean} - TRUE if lover
 */
function PlatformDialogIsLover(Name) {
	if (PlatformDialogGetCharacter(Name) == null) return false;
	return ((PlatformDialogGetCharacter(Name).LoverName === "Melody") && ((PlatformPlayer.Name === "Melody") || (PlatformPlayer.Name === Name)));
}

/**
 * Returns TRUE if two characters are lovers
 * @param {Platform.CharacterName} Char1 - The name of the first character
 * @param {Platform.CharacterName} Char2 - The name of the second character
 * @returns {boolean} - TRUE if lover
 */
function PlatformDialogCharactersAreLovers(Char1, Char2) {
	let C1 = PlatformDialogGetCharacter(Char1);
	let C2 = PlatformDialogGetCharacter(Char2);
	if ((C1 == null) || (C2 == null)) return false;
	return ((C1.LoverName === C2.Name) && (C2.LoverName === C1.Name));
}

/**
 * Returns TRUE if the character is Melody's slave, make sure that character or Melody is currently active
 * @param {Platform.CharacterName} Name - The name of a character
 * @returns {boolean} - TRUE if lover
 */
function PlatformDialogIsSlave(Name) {
	if (PlatformDialogGetCharacter(Name) == null) return false;
	return ((PlatformDialogGetCharacter(Name).OwnerName === "Melody") && ((PlatformPlayer.Name === "Melody") || (PlatformPlayer.Name === Name)));
}

/**
 * Returns TRUE if the first character is the slave of the second character
 * @param {Platform.CharacterName} Char1 - The name of the first character
 * @param {Platform.CharacterName} Char2 - The name of the second character
 * @returns {boolean} - TRUE if slave
 */
function PlatformDialogIsSlaveOfCharacter(Char1, Char2) {
	let C1 = PlatformDialogGetCharacter(Char1);
	let C2 = PlatformDialogGetCharacter(Char2);
	if ((C1 == null) || (C2 == null)) return false;
	return (C1.OwnerName === C2.Name);
}

/**
 * Returns TRUE if the character is Melody's owner, make sure that character or Melody is currently active
 * @param {Platform.CharacterName} Name - The name of a character
 * @returns {boolean} - TRUE if lover
 */
function PlatformDialogIsOwner(Name) {
	if (PlatformDialogGetCharacter(Name) == null) return false;
	return ((PlatformDialogGetCharacter("Melody").OwnerName === Name) && ((PlatformPlayer.Name === "Melody") || (PlatformPlayer.Name === Name)));
}

/**
 * Returns TRUE if the character doesn't have any lover
 * @param {Platform.CharacterName} Name - The name of a character
 * @returns {boolean} - TRUE if no lover
 */
function PlatformDialogCharacterIsSingle(Name) {
	let C = PlatformDialogGetCharacter(Name);
	if (C == null) return false;
	return ((C.LoverName == null) || (C.LoverName == ""));
}

/**
 * Returns 0 if the source character and target character are not in a relationship, 1 if lover or slave, 2 if lover and slave
 * @param {Platform.CharacterName} SourceName - The source character name to evaluate
 * @param {Platform.CharacterName} TargetName - The target character name to evaluate
 * @returns {number} - TRUE if lover
 */
function PlatformDialogLoverAndSlaveFactor(SourceName, TargetName) {
	if ((SourceName == null) || (TargetName == null) || (SourceName === TargetName)) return 0;
	let Factor = 0;
	if (PlatformDialogCharactersAreLovers(SourceName, TargetName)) Factor++;
	if (PlatformDialogIsSlaveOfCharacter(SourceName, TargetName)) Factor++;
	return Factor;
}

/**
 * Called each time a relationship changes through dialog
 * @returns {void} - Nothing
 */
function PlatformDialogRelationshipChange() {
	if (!PlatformPlayer) return;
	PlatformSetHealth(PlatformPlayer);
	if (PlatformPlayer.Name == "Melody") {
		PlatformPlayer.WalkSpeed = Math.round(PlatformPlayer.BaseWalkSpeed * (1 + (PlatformDialogLoverAndSlaveFactor(PlatformPlayer.Name, "Edlaran") * 0.1)));
		PlatformPlayer.RunSpeed = Math.round(PlatformPlayer.BaseRunSpeed * (1 + (PlatformDialogLoverAndSlaveFactor(PlatformPlayer.Name, "Edlaran") * 0.1)));
	}
}

/**
 * Called manually to output the full dialog text to the console for text proofing
 * @public
 * @returns {void} - Nothing
 */
function PlatformDialogOutputAll() {
	let S = "";
	for (let Dialog of PlatformDialogData) {
		S = S + Dialog.Name + "\r\n";
		for (let Data of Dialog.Dialog) {
			if (Data.Text != null) S = S + Data.Text + "\r\n";
			if (Data.Answer != null)
				for (let Answer of Data.Answer) {
					if (Answer.Text != null) S = S + Answer.Text + "\r\n";
					if (Answer.Reply != null) S = S + Answer.Reply + "\r\n";
				}
		}
	}
	console.log(S);
}
