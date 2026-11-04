"use strict";
var CurrentTime = 0;
var TimerRunInterval = 20;
var TimerLastTime = 0;
var TimerLastCycleCall = 0;
var TimerLastArousalProgress = 0;
var TimerLastArousalProgressCount = 0;
var TimerLastArousalDecay = 0;

/** @type {Map<string, Timer.CustomTimer>} */
var Timers = new Map();

/**
 * Returns the current time from the local computer clock
 * @returns {number} - Returns the number of milliseconds
 */
function TimerGetTime() {
	return new Date().getTime();
}

/**
 * Returns a string of the time remaining on a given timer
 * @param {number} T - Time to convert to a string in ms
 * @returns {string} - The time string in the DD:HH:MM:SS format (Days and hours not displayed if it contains none)
 */
function TimerToString(T) {
	const years = Math.floor(T / MS_PER_YEAR);
	const days = Math.floor((T % MS_PER_YEAR) / MS_PER_DAY);
	const hours = Math.floor((T % MS_PER_DAY) / MS_PER_HOUR);
	const minutes = Math.floor((T % MS_PER_HOUR) / MS_PER_MIN);
	const seconds = Math.floor((T % MS_PER_MIN) / MS_PER_SEC);

	/** @param {number} num */
	const pad = (num) => num.toString().padStart(2, "0");

	const parts = [];

	if (years > 0) parts.push(`${years}y`);
	if (years > 0 || days > 0) parts.push(`${days}d`);

	if (parts.length > 0 || hours > 0) {
		parts.push(pad(hours));
	}

	parts.push(pad(minutes));
	parts.push(pad(seconds));

	// Join time units (e.g., "1y 45d 08:05:09" or "02:15:30")
	return parts.length > 3
		? `${parts.slice(0, -3).join(" ")} ${parts.slice(-3).join(":")}`
		: parts.join(":");
}

/**
 * Returns a string of the time remaining on a given timer (Hours and minutes only)
 * @param {Date} T - Time to convert to a string in ms
 * @returns {string} - The time string in the HH:MM format
 */
function TimerHourToString(T) {
	let M = T.getMinutes().toString();
	const H = T.getHours().toString();
	if (M.length == 1) M = "0" + M;
	return H + ":" + M;
}

/**
 * Returns a literal string of the time remaining on a given timer
 * @param {number} T - Time to convert to a string in ms
 * @returns {string} - The time string in "DD days HH hours MM minutes" format
 */
function TimerToDaysHoursMinutesString(T) {
	const D = Math.floor(T / MS_PER_DAY);
	const H = Math.floor((T % MS_PER_DAY) / MS_PER_HOUR);
	const M = Math.floor((T % MS_PER_HOUR) / MS_PER_MIN);
	let R = "";
	if (D > 0) {
		R += D.toString() + " " + InterfaceTextGet(TimeUnits.DAYS.label);
	}
	if (H > 0) {
		if (R.length > 0) {
			R += " ";
		}
		R += H.toString() + " " + InterfaceTextGet(TimeUnits.HOURS.label);
	}
	if (M > 0) {
		if (R.length > 0) {
			R += " ";
		}
		R += M.toString() + " " + InterfaceTextGet(TimeUnits.MINUTES.label);
	}
	return R;
}

/**
 * Check if we must remove items from characters. (Expressions, items being removed, locks, etc.)
 * @returns {void} - Nothing
 */
function TimerInventoryRemove() {

	let updatedNPCs = false;

	// Cycles through all items items for all offline characters (player + NPC)
	for (const C of Character) {
		let update = false;
		if (!C.IsPlayer() && !C.IsNpc())
			continue;

		// Process first in queue to active timer
		if (C.OnlineSharedSettings && C.OnlineSharedSettings.ItemsAffectExpressions && C.ExpressionQueue) {
			C.ExpressionQueue.sort((a, b) => a.Time - b.Time);
			while (C.ExpressionQueue.length > 0 && C.ExpressionQueue[0].Time <= CurrentTime) {
				CharacterSetFacialExpression(C, C.ExpressionQueue[0].Group, C.ExpressionQueue[0].Expression, undefined, undefined, true);
				C.ExpressionQueue.splice(0, 1); // Remove first from queue after processing.
			}
		}

		const removedLocks = [];
		const timedItems = /** @type {(Item & { Property: { RemoveTimer: number } })[]} */(
			C.Appearance.filter(item => item.Property && typeof item.Property.RemoveTimer === "number" && item.Property.RemoveTimer <= CurrentTime)
		);
		for (let item of timedItems) {
			const lock = InventoryGetLock(item);
			const ShouldRemoveItem = item.Property.RemoveItem;

			// Keep track of the locks we've removed to send a message afterward
			if (lock)
				removedLocks.push([item, lock]);

			// Remove any lock or timer
			ValidationDeleteLock(item.Property, false);

			// If we must remove the linked item from the character or the facial expression
			const group = item.Asset.Group;
			if (ShouldRemoveItem) {
				InventoryRemove(C, group.Name);
			}

			update = true;
		}

		if (ServerPlayerIsInChatRoom()) {
			// We're in a chat room, send a message about the locks that expired
			if (removedLocks.length === 1) {
				const [item, lock] = removedLocks[0];
				const Dictionary = new DictionaryBuilder()
					.destinationCharacterName(C)
					.focusGroup(item.Asset.Group.Name)
					.asset(lock.Asset, "LockName")
					.build();
				ServerSend("ChatRoomChat", {Content: "TimerRelease", Type: "Action", Dictionary});
			} else if (removedLocks.length > 1) {
				const builder = new DictionaryBuilder()
					.destinationCharacterName(C)
					.text("LockCount", removedLocks.length.toString());
				for (const [item, _lock] of removedLocks) {
					builder.group("UnlockedGroup", item.Asset.Group.Name);
				}
				ServerSend("ChatRoomChat", {Content: "TimerReleaseMany", Type: "Action", Dictionary: builder.build()});
			}
		}

		if (update) {
			CharacterRefresh(C);
			if (C.IsPlayer())
				ChatRoomCharacterUpdate(C);
			else
				updatedNPCs = updatedNPCs || true;
		}
	}

	if (updatedNPCs) {
		ServerPrivateCharacterSync();
	}
}

/**
 * Sets a remove timer in seconds for a specific item part / body part
 * @param {Character} C - Character for which we are removing an item
 * @param {AssetGroupName} AssetGroup - Group targeted by the removal
 * @param {number} Timer - Seconds it takes to remove the item
 * @returns {void} - Nothing
 */
function TimerInventoryRemoveSet(C, AssetGroup, Timer) {
	const item = InventoryGet(C, AssetGroup);
	if (!item) return;

	if (item.Property == null) item.Property = {};
	item.Property.RemoveTimer = Math.round(CurrentTime + Timer * 1000);
}

/**
 * Sets a remove timer in seconds for expressions, adds to Expression Queue.
 * @param {Character} C - Character for which we are changing expression.
 * @param {ExpressionGroupName} ExpressionGroup - Group targeted by the removal.
 * @param {number} Timer - Seconds it takes to change the expression.
 * @param {ExpressionName} Expression - Expression to queue. Defaults to null if not specified.
 * @returns {void} - Nothing
 */
function TimerExpressionQueuePush(C, ExpressionGroup, Timer, Expression = null) {
	const QueueItem = {
		Time: Math.round(CurrentTime + Timer * 1000),
		Group: ExpressionGroup,
		Expression: Expression
	};
	C.ExpressionQueue.push(QueueItem);
}

/**
 * Random trigger for the NPC owner in a private room. If possible, when triggered it will beep the player anywhere in the club, the player has 2 minutes to get back to her
 * @returns {void} - Nothing
 */
function TimerPrivateOwnerBeep() {
	if (Player.IsOwned() === "npc" && (CurrentScreen != "Private") && (CurrentScreen != "PrivateBed") && (CurrentScreen != "ChatRoom") && (CurrentScreen != "InformationSheet") && (CurrentScreen != "FriendList") && (CurrentScreen != "Cell") && PrivateOwnerInRoom())
		if ((Math.floor(Math.random() * 500) == 1) && !LogQuery("OwnerBeepActive", "PrivateRoom") && !LogQuery("OwnerBeepTimer", "PrivateRoom") && !LogQuery("LockOutOfPrivateRoom", "Rule") && !LogQuery("Committed", "Asylum")) {
			ServerShowBeep(InterfaceTextGet("BeepFromOwner"), 15000);
			LogAdd("OwnerBeepActive", "PrivateRoom");
			LogAdd("OwnerBeepTimer", "PrivateRoom", CurrentTime + 120000);
			FriendListBeepLog.push({ MemberName: Player.OwnerName(), ChatRoomName: InterfaceTextGet("YourRoom"), Sent: false, Read: false, Time: new Date(), Private: false });
		}
}


/**
 * Main timer process
 * @returns {void} - Nothing
 */
function TimerProcess() {

	AfkTimerSetIsAfk();

	// At each 1700 ms, we check for timed events (equivalent of 100 cycles at 60FPS)
	if (TimerLastCycleCall + 1700 <= CommonTime()) {
		TimerInventoryRemove();
		TimerPrivateOwnerBeep();
		TimerLastCycleCall = CommonTime();
	}

	const now = CommonTime();
	for (const [id, timer] of Timers) {
		const focusMismatch =
		(!document.hasFocus() && timer.type === 'foreground') ||
		(document.hasFocus() && timer.type === 'background');

		if (focusMismatch) {
			// update lastTime so the timer doesn't accumulate time while inactive
			timer.lastTime = now;
			continue;
		}

		if (now - timer.lastTime >= timer.timeMs) {
			timer.callback();
			timer.lastTime = now;

			if (!timer.repeat) {
				Timers.delete(id);
			}
		}
	}

	DrawImageCache.purge();
	GLDrawImageCache?.purge();

	// Arousal/Activity events only occur in allowed rooms
	if (ActivityAllowed()) {

		// Arousal can change every second, based on ProgressTimer
		if ((TimerLastArousalProgress + 1000 < CurrentTime) || (TimerLastArousalProgress - 1000 > CurrentTime)) {
			TimerLastArousalProgress = CurrentTime;
			TimerLastArousalProgressCount++;
			for (let C = 0; C < Character.length; C++) {

				// If the character is having an orgasm and the timer ran out, we move to the next orgasm stage
				const arousalSettings = Character[C].ArousalSettings;
				if (arousalSettings?.OrgasmTimer != null && arousalSettings.OrgasmTimer > 0) {
					if (arousalSettings.OrgasmTimer < CurrentTime) {
						if ((arousalSettings.OrgasmStage == null) || (arousalSettings.OrgasmStage <= 1)) ActivityOrgasmStart(Character[C]);
						else ActivityOrgasmStop(Character[C], 20);
					}
				} else {

					// Depending on the character settings, we progress the arousal meter
					if (PreferenceArousalAtLeast(Character[C], "Hybrid")) {

						// Activity impacts the progress slowly over time, if there's an activity running, vibrations are ignored
						if ((Character[C].ArousalSettings.ProgressTimer != null) && (typeof Character[C].ArousalSettings.ProgressTimer === "number") && !isNaN(Character[C].ArousalSettings.ProgressTimer) && (Character[C].ArousalSettings.ProgressTimer != 0)) {
							if (Character[C].ArousalSettings.ProgressTimer < 0) {
								Character[C].ArousalSettings.ProgressTimer++;
								ActivityTimerProgress(Character[C], -1);
								ActivityVibratorLevel(Character[C], 0);
							}
							else {
								Character[C].ArousalSettings.ProgressTimer--;
								ActivityTimerProgress(Character[C], 1);
								ActivityVibratorLevel(Character[C], 4);
							}
						} else if (Character[C].IsEgged()) {

							// If the character is egged, we find the highest intensity factor and affect the progress, low and medium vibrations have a cap
							let Factor = -1;
							for (let A = 0; A < Character[C].Appearance.length; A++) {
								let Item = Character[C].Appearance[A];
								let ZoneFactor = PreferenceGetZoneFactor(Character[C], Item.Asset.ArousalZone) - 2;
								if (InventoryItemHasEffect(Item, "Egged", true) && (Item.Property != null) && (Item.Property.Intensity != null) && (typeof Item.Property.Intensity === "number") && !isNaN(Item.Property.Intensity) && (Item.Property.Intensity >= 0) && (ZoneFactor >= 0) && (Item.Property.Intensity + ZoneFactor > Factor)){
									if ((Character[C].ArousalSettings.Progress < 95) || PreferenceGetZoneOrgasm(Character[C], Item.Asset.ArousalZone))
										Factor = Item.Property.Intensity + ZoneFactor;
								}
							}

							// Adds the fetish value to the factor
							if (Factor >= 0) {
								const Fetish = ActivityFetishFactor(Character[C]);
								if (Fetish > 0) Factor = Factor + Math.ceil(Fetish / 3);
								if (Fetish < 0) Factor = Factor + Math.floor(Fetish / 3);
							}

							// Kicks the arousal timer faster from personal arousal
							if ((Factor >= 4)) {ActivityVibratorLevel(Character[C], 4); if (TimerLastArousalProgressCount % 2 == 0)ActivityTimerProgress(Character[C], 1);}
							if ((Factor == 3)) {ActivityVibratorLevel(Character[C], 3); if (TimerLastArousalProgressCount % 3 == 0) ActivityTimerProgress(Character[C], 1);}
							if ((Factor == 2)) {ActivityVibratorLevel(Character[C], 2); if (Character[C].ArousalSettings.Progress <= 95 && TimerLastArousalProgressCount % 4 == 0) ActivityTimerProgress(Character[C], 1);}
							if ((Factor == 1)) {ActivityVibratorLevel(Character[C], 1); if (Character[C].ArousalSettings.Progress <= 65 && TimerLastArousalProgressCount % 6 == 0) ActivityTimerProgress(Character[C], 1);}
							if ((Factor == 0)) {ActivityVibratorLevel(Character[C], 1); if (Character[C].ArousalSettings.Progress <= 35 && TimerLastArousalProgressCount % 8 == 0) ActivityTimerProgress(Character[C], 1);}
							if ((Factor == -1)) {ActivityVibratorLevel(Character[C], 0);}

						}
					} else {
						ActivityVibratorLevel(Character[C], 0);
					}
				}
			}
		}

		// Arousal decays by 1 naturally every 12 seconds, unless there's already a natural progression from an activity
		if ((TimerLastArousalDecay + 12000 < CurrentTime) || (TimerLastArousalDecay - 12000 > CurrentTime)) {
			TimerLastArousalDecay = CurrentTime;
			for (let C = 0; C < Character.length; C++)
				if (PreferenceArousalAtLeast(Character[C], "Hybrid"))
					if ((Character[C].ArousalSettings.Progress != null) && (typeof Character[C].ArousalSettings.Progress === "number") && !isNaN(Character[C].ArousalSettings.Progress) && (Character[C].ArousalSettings.Progress > 0))
						if ((Character[C].ArousalSettings.ProgressTimer == null) || (typeof Character[C].ArousalSettings.ProgressTimer !== "number") || isNaN(Character[C].ArousalSettings.ProgressTimer) || (Character[C].ArousalSettings.ProgressTimer == 0)) {

							// If the character is egged, we find the highest intensity factor
							let Factor = -1;
							for (let A = 0; A < Character[C].Appearance.length; A++) {
								let Item = Character[C].Appearance[A];
								let ZoneFactor = PreferenceGetZoneFactor(Character[C], Item.Asset.ArousalZone) - 2;
								if (InventoryItemHasEffect(Item, "Egged", true) && (Item.Property != null) && (Item.Property.Intensity != null) && (typeof Item.Property.Intensity === "number") && !isNaN(Item.Property.Intensity) && (Item.Property.Intensity >= 0) && (ZoneFactor >= 0) && (Item.Property.Intensity + ZoneFactor > Factor))
									if ((Character[C].ArousalSettings.Progress < 95) || PreferenceGetZoneOrgasm(Character[C], Item.Asset.ArousalZone))
										Factor = Item.Property.Intensity + ZoneFactor;
							}

							// No decay if there's a vibrating item running
							if (Factor < 0) ActivityTimerProgress(Character[C], -1);

						}
		}

	}
}

/**
 * Returns a string of the time remaining on a given timer (Hours, minutes, seconds)
 * @param {number} s - Time to convert to a string in ms
 * @returns {string} -  The time string in the HH:MM:SS format
 */
function TimermsToTime(s) {

	// Pad to 2 or 3 digits, default is 2
	/** @type {(n: number, z?: number) => string} */
	function pad(n, z) {
		z = z || 2;
		return ('00' + n).slice(-z);
	}

	// Returns the formatted value
	const ms = s % 1000;
	s = (s - ms) / 1000;
	const secs = s % 60;
	s = (s - secs) / 60;
	const mins = s % 60;
	const hrs = (s - mins) / 60;
	return pad(hrs) + ':' + pad(mins) + ':' + pad(secs);

}

/**
 * Creates a timer. Returns a function to remove the timer.
 * @param {() => void} callback - A function called when the timer expires
 * @param {number} timeMs - Time in ms before the timer expires
 * @param {boolean} [repeat] - Whether the timer should repeat. Default is false
 * @param {'background' | 'foreground' | 'universal'} [type] - The type of timer. Default is universal
 * @returns {() => void} - A function to remove the timer.
 */
function TimerCreate(callback, timeMs, repeat = false, type = 'universal') {
	const id = CommonGenerateUniqueID();
	Timers.set(id, { callback: callback, timeMs: timeMs, repeat: repeat, type: type, lastTime: CommonTime() });

	return () => {
		Timers.delete(id);
	};
}
