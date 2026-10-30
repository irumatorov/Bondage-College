"use strict";

var ChatRoomMapViewWidth = 40;
var ChatRoomMapViewHeight = 40;
var ChatRoomMapMaxLength = ChatRoomMapViewWidth * ChatRoomMapViewHeight;
var ChatRoomMapViewObjectStartID = 100;
var ChatRoomMapViewEffectStartID = 10;
var ChatRoomMapViewObjectEntryID = 110;

/** @type {Map<number, ChatRoomMapTile>} */
const MapDataTiles = new Map();
/** @type {Map<number, ChatRoomMapObject>} */
const MapDataObjects = new Map();
/** @type {Map<number, ChatRoomMapEffect>} */
const MapDataEffects = new Map();

const MapDataTileTypes = new Set();
const MapDataObjectTypes = new Set();
const MapDataEffectTypes = new Set();

/**
 * @namespace
 * @description
 * # Binary-encoded map data
 * This module implements the new way of encoding the map data.
 *
 * At its core lies the concept of a BitString: a stream of tightly-packed
 * numbers with arbitrary bit width. This allows us to store data way more efficiently
 * than using plain JSONs, even if they are packed with LZString.
 *
 * # Compatibility
 * Binary encoding, while efficient, requires a very careful architectural approach to ensure
 * maximum compatibility. Notable, we must ensure that:
 *
 * - Exported map strings from any older game version *always* remain compatible
 *   with the newer game versions. Players losing their old saved maps is an unacceptable
 *   outcome; we must ensure that we recover as much data as possible from those old saves.
 * - Map data synced between the players in a map-enabled room must be readable
 *   by the clients one version older than the current one. This is to ensure
 *   that during the beta period the main branch players could join and play
 *   the rooms created by beta players. This is not as strict of a requirement
 *   as the previous point, but is still important.
 * - Exported map strings from the newer version must be usable by the players
 *   using a game one version older. This ensures that the beta players can share
 *   map strings with non-beta ones, and is the least concern among others, since
 *   beta periods are quite short and *sharing* the map string doesn't happen too often.
 *   Still, it is good to at least make some effort to allow it.
 *
 * Binary encoding makes achieving those requirements non-trivial, because
 * to decode a given BitString the game must know exactly what were the bit widths
 * of the integers encoded into it, and also their meaning. If we just change
 * the code that encodes the map data, then we would no longer able to decode the old data.
 *
 * To solve this issue, we introduce the concept of codec versions. A version
 * is a number that we write into the bit stream before the actual data, which
 * would allow the game to understand which codec was used to encode the data,
 * and call it to decode the data.
 *
 * Whenever we need to sufficiently change the encoding scheme, we copy
 * the latest codec, increase its version and make the required changes.
 * Copying and pasting the code, while usually not advised, would be a better approach
 * in this specific case. This way, we ensure that the old codecs remain "frozen"
 * in time, so no matter how old the map data is, we always have an appropriate codec
 * for it.
 *
 * One issue which may arise in the future is the change in the schemas
 * of the objects we encode. In this case, we would need an additional "migrations" layer
 * which would take the old decoded data and convert it to the one we currently require.
 *
 * Solving the issue of letting the old clients to use the data from beta versions
 * is not that straightforward, and on the most occasions we would require ad-hoc solutions.
 * For example, during the beta period we may use two fields, `Data` and `DataOld`,
 * with the former containing the data encoded with the most recent codec,
 * and the latter having the data encoded with the previous codec.
 * Of course, depending on the nature of the required changes, it may be possible
 * to make a more space-efficient solution.
 *
 * # Future work
 * Currently, we only binary-encode the map effects, to remain in the scope of the original MR.
 * We do this by storing the encoded map effects in the {@link ChatRoomData.MapData.Effects}
 * global value, while {@link ChatRoomData.MapData.Tiles} and {@link ChatRoomData.MapData.Objects}
 * remain unchanged. Thus, we don't need to change much of the existing code, which
 * continues to use those latter fields.
 *
 * In future MRs we hope to unify the encoding of tiles, objects and effects, writing them all
 * into a single BitString. This would allow us to have much greater compression and save
 * a lot of traffic.
 *
 * Later, all map data would be stored in {@link MapManager.Map} global value
 * instead of {@link ChatRoomData.MapData}. This is because we're no longer storing
 * the map data as simple strings which we can trivially serialize and send to the server.
 * Ideally, the outside code would use {@link MapManager} methods to obtain
 * the encoded map data when needed (e.g. sending it to the server, or saving the map data
 * for room recreation, or exporting the room via a room code). Failing that,
 * we can continue the approach used in the initial version of this system: having the decoded
 * map data in {@link MapManager.Map} and maintain the encoded representation
 * of this map in {@link ChatRoomData.MapData}.
 *
 * After that we would have an avenue for encoding additional arbitrary data within each tile
 * while retaining the compact encoding. This, then, would allow us to have any sorts of "tile settings",
 * which would be a great addition to the map rooms in the Club.
 *
 * # Mod compatibility
 * This module is a work in progress and would change significantly in the future.
 * As such, only the minimum amount of public APIs is exposed as of now. Mod authors
 * are advised to not rely on its current behavior if at all possible.
 * We expect to expose more public APIs in the future as the module matures.
 *
 * # General design choices
 * While being public, {@link MapManager.Map} preferably should be only
 * accessed inside this file as it is an implementation detail of this module.
 * If the outside code requires to access something in this module, it's best
 * to provide a separate function in the {@link MapManager} namespace,
 * or a global one.
 *
 * # Codecs general overview
 * ## Version 0
 * The initial codecs version. Only encoding map effects. Only allows for a single
 * map effect per tile (the groundwork for having multiple effects per tile is laid,
 * but the rest of the code is not ready for it).
 *
 * Effects are encoded by their IDs, similar to the original Tiles and Objects encoding.
 * A simple RLE compression is applied to the "flat" effects array, with a small twist:
 * we use larger bit width for storing run-lengths of the blank effect sequences.
 * This allows us to more efficiently encode the typical maps where the most of
 * the tiles would have blank effects.
 *
 * Additionally, we modify the effect IDs in the following way:
 * 1. First, we subtract the lowest used effect ID
 *    ({@link ChatRoomMapViewEffectStartID} in the most cases) from them, getting
 *    what we call "shifted" IDs which begin from zero.
 * 2. Next, we create the list of all used "shifted" IDs and write them in the stream.
 *    The usage of "shifted" IDs ensures this array is very compact no matter what
 *    our {@link ChatRoomMapViewEffectStartID} is.
 * 3. Finally, when writing the effect IDs, we instead use the indexes in the list
 *    from the previous step, and call them the "remapped" IDs.
 *
 * This allows us to write the least possible amount of data per effect ID: for example,
 * if only one effect - besides the blank - is used in a map, then each mention of that ID
 * would only require a single bit of data, no matter what the actual value of this effect is.
 *
 * This scheme results in a sufficiently efficient compression rate in practice.
 * - For maps without effects we will be sending 24 additional bytes (after base64 encoding).
 * - Maps with a few patches of effects require around 0.5-1 bits per tile (after base64 encoding).
 * - Moderately sophisticated maps with a lot of different effects require somewhere around 1.5-3 bits per tile.
 * - In the worst case scenario (a map fully filled with all possible effects without repetitions),
 *   we would require slightly above 5.3 bits per tile after base64 encoding.
 */
var MapManager = (function () {
	/**
	 * The class storing the game map data.
	 */
	class MapData {
		/** @type {ChatRoomMapTile[]} */
		tiles;
		/** @type {ChatRoomMapObject[]} */
		objects;
		/** @type {ChatRoomMapEffect[][]} */
		effects;
		/** @type {boolean} */
		fogEnabled;

		/** @type {Record<number,ChatRoomMapObjectConfig>} */
		objectConfigs;

		/**
		 * @param {number} width
		 * @param {number} height
		 * @param {ChatRoomMapTile[]} [tiles]
		 * @param {ChatRoomMapObject[]} [objects]
		 * @param {ChatRoomMapEffect[][]} [effects]
		 * @param {Record<number,ChatRoomMapObjectConfig>} [objectConfigs]
		 */
		constructor(width, height, tiles, objects, effects, objectConfigs) {
			const length = width * height;
			const tile = MapDataGetTile(ChatRoomMapViewObjectStartID);
			const object = MapDataGetObject(ChatRoomMapViewObjectStartID);
			const effect = MapDataGetEffect(ChatRoomMapViewEffectStartID);
			this.tiles = tiles ?? Array.from({ length }).fill(tile);
			this.objects = objects ?? Array.from({ length }).fill(object);
			this.effects = effects ?? Array.from({ length }, () => [effect]);
			this.objectConfigs = this.#sanitizeObjectConfigs(objectConfigs ?? {});;
			this.fogEnabled = false;
		}

		/**
		 * Sanitizes the object configs to ensure they are valid and within bounds.
		 * @param {Record<number, ChatRoomMapObjectConfig>} objectConfigs - The object configs to sanitize
		 * @returns {Record<number, ChatRoomMapObjectConfig>} - The sanitized object configs
		 */
		#sanitizeObjectConfigs(objectConfigs) {
			/** @type {Record<number, ChatRoomMapObjectConfig>} */
			const ret = {};
			if (!CommonIsObject(objectConfigs)) return ret;
			for (const [key, config] of Object.entries(objectConfigs)) {
				const index = Number.parseInt(key, 10);
				if (!Number.isInteger(index) || index < 0 || index >= ChatRoomMapMaxLength) continue;
				if (config?.Type === "Sign" && typeof config.Text === "string") {
					ret[index] = { Type: "Sign", Text: config.Text.slice(0, ChatRoomMapMaxLength) };
				} else if (config?.Type === "Teleporter") {
					/** @type {ChatRoomMapTeleporterObjectConfig} */
					const pad = { Type: "Teleporter", Shared: true };
					const destination = config.Destination;
					if (destination && Number.isInteger(destination.X) && Number.isInteger(destination.Y)
						&& destination.X >= 0 && destination.X < ChatRoomMapViewWidth && destination.Y >= 0 && destination.Y < ChatRoomMapViewHeight) {
						pad.Destination = { X: destination.X, Y: destination.Y };
					}
					if (typeof config.Color === "string" && CommonIsColor(config.Color, { allowAlpha: true })) pad.Color = config.Color;
					ret[index] = pad;
				} else if (config?.Type === "Tether") {
					ret[index] = { Type: "Tether" };
				}
			}
			return ret;
		}
		/**
		 *
		 * @param {ServerChatRoomMapData} data
		 * @returns {MapData | undefined}
		 */
		static load(data) {
			const length = ChatRoomMapViewWidth * ChatRoomMapViewHeight;
			const effect = MapDataGetEffect(ChatRoomMapViewEffectStartID);
			/** @type {ChatRoomMapEffect[][] | undefined} */
			const effects = data.Effects ? this.#_decodeEffects(data.Effects) : Array.from({ length }, () => [effect]);
			if (!effects) {
				return undefined;
			}
			let objects = [];
			let tiles = [];
			for (let index = 0; index < length; index++) {
				const tile = MapDataGetTile(data.Tiles?.charCodeAt(index) ?? ChatRoomMapViewObjectStartID);
				if (tile) tiles.push(tile);
				const object = MapDataGetObject(data.Objects?.charCodeAt(index) ?? ChatRoomMapViewObjectStartID);
				if (object) objects.push(object);
			}
			const map = new MapData(ChatRoomMapViewWidth, ChatRoomMapViewHeight, tiles, objects, effects, data.CellData);

			map.fogEnabled = data.Fog ?? false;
			return map;
		}

		/**
		 * @param {string | undefined} str
		 * @returns {ChatRoomMapEffect[][] | undefined}
		 */
		static #_decodeEffects(str) {
			if (str == null || str === "") {
				return undefined;
			}

			const reader = BitStringReader.fromBase64(str);
			if (reader === undefined) {
				console.error(
					"MapManager._decodeEffects(): failed to decode map effects: invalid encoded string",
				);
				return undefined;
			}

			try {
				const version = reader.readUnsigned(MAP_SYNC_VERSION_BIT_SIZE);
				const codec = MapEffectsCodecs[version];
				if (codec === undefined) {
					console.error(
						`MapManager._decodeEffects(): failed to decode map effects: unknown effects version ${version}`,
					);
					return undefined;
				}

				const tilesCount = ChatRoomMapMaxLength;
				const effects = codec.read(reader, tilesCount);
				if (effects === undefined) {
					console.error(
						`MapManager._decodeEffects(): failed to decode map effects (v. ${version}): failed to read effects.`,
					);
					return undefined;
				}
				return effects;
			} catch (e) {
				console.error(
					`MapManager._decodeEffects(): failed to decode map effects: decoding error`, e,
				);
				return undefined;
			}
		}

		/**
		 *
		 * @param {ServerChatRoomMapData} data
		 * @returns {boolean}
		 */
		save(data) {
			const newEffects = this.#_encodeEffects();
			if (newEffects === undefined) {
				return false;
			}
			if (newEffects !== data.Effects) {
				data.Effects = newEffects;
			}
			data.Tiles = this.tiles.map(t => t ? String.fromCharCode(t.ID) : ChatRoomMapViewObjectStartID).join("");
			data.Objects = this.objects.map(o => o ? String.fromCharCode(o.ID) : ChatRoomMapViewObjectStartID).join("");
			data.CellData = this.objectConfigs;
			if (this.fogEnabled) {
				data.Fog = true;
			} else {
				delete data.Fog;
			}
			return true;
		}

		/**
		 * @returns {string | undefined}
		 */
		#_encodeEffects() {
			const codec = MapEffectsCodecs[CURRENT_EFFECTS_CODEC_VERSION];
			const writer = new BitStringWriter();

			writer.writeUnsigned(
				CURRENT_EFFECTS_CODEC_VERSION,
				MAP_SYNC_VERSION_BIT_SIZE,
			);
			if (!codec.write(this.effects, writer)) {
				console.error(
					"MapManager._encodeEffects(): failed to encode map effects: write failed.",
				);
				return undefined;
			}

			return writer.toBase64();
		}

		/**
		 * Removes all effects from the map.
		 */
		removeAllEffects() {
			const len = this.effects.length;
			this.effects = Array.from({ length: len }, () => []);
		}
	}

	/**
	 * @type {Record<number, MapManager.EffectsCodec>}
	 */
	const MapEffectsCodecs = {
		0: (function () {
			/**
			 * @type {MapManager.MapEffectsCodecs_v0.ConstSettings}
			 */
			const constSettings = (function () {
				const rleBitsEmpty = 8; // up to 257 repetitions
				const rleMaxEmpty = BitStringHelper.maxUnsignedInBits(rleBitsEmpty) + 2;
				const rleBitsFilled = 4; // up to 18 repetitions
				const rleMaxFilled =
					BitStringHelper.maxUnsignedInBits(rleBitsFilled) + 2;
				return {
					rleBitsEmpty,
					rleMaxEmpty,
					rleBitsFilled,
					rleMaxFilled,
					bitLenBits: 6, // [0; 32] bits
					arrayLenInBytesBits: 2, // up to 4 bytes == 2^32 elements, which is a JS limit
				};
			})();

			/**
			 * @param {ChatRoomMapEffect[]} effectsFlat
			 * @returns {MapManager.MapEffectsCodecs_v0.DynamicSettings}
			 */
			function buildDynamicSettings(effectsFlat) {
				const effectIds = [...new Set(effectsFlat.map((eff) => eff.ID))].sort();
				const effectIdMin = effectIds[0] ?? 0;
				const effectIdMax = effectIds[effectIds.length - 1] ?? 0;
				const effectIdShiftedMax = effectIdMax - effectIdMin;

				/**
				 * @type {Map<number, number>}
				 */
				const effectIdShiftedToRemapId = new Map();
				/**
				 * @type {Map<number, number>}
				 */
				const remapIdToEffectIdShifted = new Map();
				for (const [remapId, effectId] of effectIds.entries()) {
					effectIdShiftedToRemapId.set(effectId - effectIdMin, remapId);
					remapIdToEffectIdShifted.set(remapId, effectId - effectIdMin);
				}
				const baseIdBits = BitStringHelper.getBitsCountForUnsigned(effectIdMin);
				const shiftedIdBits =
					BitStringHelper.getBitsCountForUnsigned(effectIdShiftedMax);
				const remappedIdBits = BitStringHelper.getBitsCountForUnsigned(
					effectIds.length - 1,
				);

				/**
				 * @type {number[]}
				 */
				const effectIdsShifted = effectIds.map(
					(effectId) => effectId - effectIdMin,
				);

				return {
					baseIdBits,
					shiftedIdBits,
					remappedIdBits,
					effectIdMin,
					effectsLength: effectsFlat.length,
					effectIdsShifted,
					effectIdShiftedToRemapId,
					remapIdToEffectIdShifted,
				};
			}

			/**
			 * Calculates the remapped effect ID from the raw, non-shifted effect ID.
			 * No error checks are done.
			 * @param {number} effectId
			 * @param {MapManager.MapEffectsCodecs_v0.DynamicSettings} settings
			 * @returns {number}
			 */
			function getRemappedId(effectId, settings) {
				return (
					settings.effectIdShiftedToRemapId.get(
						effectId - settings.effectIdMin,
					) ?? 0
				);
			}

			/**
			 * Calculates the full effect ID from the remapped ID.
			 * No error checks are done.
			 * @param {number} remappedId
			 * @param {MapManager.MapEffectsCodecs_v0.DynamicSettings} settings
			 * @returns {number}
			 */
			function getEffectId(remappedId, settings) {
				return (
					(settings.remapIdToEffectIdShifted.get(remappedId) ?? 0) +
					settings.effectIdMin
				);
			}

			/**
			 * Writes the array length {@link length}. The byte size of the length is written
			 * in the first two bits, followed by `byte size` * 8 bits of the actual length.
			 * This enables a more efficient length encoding of small arrays while preserving the ability
			 * to encode any array length JavaScript supports (up to 2^32 - 1).
			 * @param {number} length the length of an array. Must be less than 2^32.
			 * @param {BitStringWriter} writer
			 * @returns {void}
			 */
			function writeArrayLength(length, writer) {
				const lenBytes =
					Math.ceil(BitStringHelper.getBitsCountForUnsigned(length) / 8) | 0;
				const lenBits = lenBytes * 8;
				writer.writeUnsigned(lenBytes, constSettings.arrayLenInBytesBits);
				writer.writeUnsigned(length, lenBits);
			}

			/**
			 * Reads the array length written with the {@link writeArrayLength} function.
			 * @param {BitStringReader} reader
			 * @returns {number}
			 */
			function readArrayLength(reader) {
				const lenBytes = reader.readUnsigned(constSettings.arrayLenInBytesBits);
				const lenBits = lenBytes * 8;
				return reader.readUnsigned(lenBits);
			}

			/**
			 * Writes an array of unsigned integers {@link array} to the writer {@link writer}.
			 * Each element in the array *must* fit in {@link elementBits} bits.
			 * @param {number[]} array
			 * @param {number} elementBits
			 * @param {BitStringWriter} writer
			 * @returns {void}
			 */
			function writeArray(array, elementBits, writer) {
				writeArrayLength(array.length, writer);
				for (const value of array) {
					writer.writeUnsigned(value, elementBits);
				}
			}

			/**
			 * Reads an array of unsigned integers with element size {@link elementBits}
			 * from {@link reader}.
			 * @param {number} elementBits
			 * @param {BitStringReader} reader
			 * @param {number} maxLen
			 * @returns {number[]}
			 * @throws {Error} when the array is too long (> {@link maxLen}) or when
			 * there is not enough data available in {@link reader}.
			 */
			function readArray(elementBits, reader, maxLen) {
				const len = readArrayLength(reader);
				if (len > maxLen) {
					throw new Error(
						`Invalid length while decoding an array: ${len} while the maximum is ${maxLen}`,
					);
				}
				const res = [];
				for (let i = 0; i < len; i++) {
					res.push(reader.readUnsigned(elementBits));
				}
				return res;
			}

			/**
			 * @param {MapManager.MapEffectsCodecs_v0.DynamicSettings} settings
			 * @param {BitStringWriter} writer
			 * @returns {void}
			 */
			function writeDynamicSettings(settings, writer) {
				writer.writeUnsigned(settings.baseIdBits, constSettings.bitLenBits);
				writer.writeUnsigned(settings.shiftedIdBits, constSettings.bitLenBits);
				writer.writeUnsigned(settings.remappedIdBits, constSettings.bitLenBits);
				writer.writeUnsigned(settings.effectIdMin, settings.baseIdBits);
				writeArray(settings.effectIdsShifted, settings.shiftedIdBits, writer);
				writeArrayLength(settings.effectsLength, writer);
			}

			/**
			 * @param {BitStringReader} reader
			 * @returns {MapManager.MapEffectsCodecs_v0.DynamicSettings}
			 */
			function readDynamicSettings(reader) {
				const baseIdBits = reader.readUnsigned(constSettings.bitLenBits);
				const shiftedIdBits = reader.readUnsigned(constSettings.bitLenBits);
				const remappedIdBits = reader.readUnsigned(constSettings.bitLenBits);
				const effectIdMin = reader.readUnsigned(baseIdBits);
				const effectIdsShifted = readArray(shiftedIdBits, reader, MapDataEffects.size);
				const effectsLength = readArrayLength(reader);
				/**
				 * @type {Map<number, number>}
				 */
				const effectIdShiftedToRemapId = new Map();
				/**
				 * @type {Map<number, number>}
				 */
				const remapIdToEffectIdShifted = new Map();
				for (const [remapId, effectIdShifted] of effectIdsShifted.entries()) {
					effectIdShiftedToRemapId.set(effectIdShifted, remapId);
					remapIdToEffectIdShifted.set(remapId, effectIdShifted);
				}
				return {
					baseIdBits,
					shiftedIdBits,
					remappedIdBits,
					effectIdMin,
					effectsLength,
					effectIdsShifted,
					effectIdShiftedToRemapId,
					remapIdToEffectIdShifted,
				};
			}

			/**
			 * Calculates the maximum length of the same effects sequence in {@link effectsFlat},
			 * starting with index {@link i}.
			 * @param {number} i
			 * @param {ChatRoomMapEffect[]} effectsFlat
			 * @returns {number} same effect sequence len, >= 1, since effectsFlat[i] is counted too.
			 */
			function getRunLength(i, effectsFlat) {
				const origEffect = effectsFlat[i];
				let idx = i + 1;
				while (
					idx < effectsFlat.length &&
					effectsFlat[idx].ID === origEffect.ID
				) {
					idx++;
				}
				return idx - i;
			}

			/**
			 * @param {number} effectId
			 * @returns {{maxRun: number, rleCountBits: number}}
			 */
			function getRleSettings(effectId) {
				if (effectId === ChatRoomMapViewEffectStartID) {
					return {
						maxRun: constSettings.rleMaxEmpty,
						rleCountBits: BitStringHelper.getBitsCountForUnsigned(
							constSettings.rleMaxEmpty,
						),
					};
				} else {
					return {
						maxRun: constSettings.rleMaxFilled,
						rleCountBits: BitStringHelper.getBitsCountForUnsigned(
							constSettings.rleMaxFilled,
						),
					};
				}
			}

			/**
			 * Writes the encoded effects from {@link effectsFlat} into the writer.
			 * NOTE: this function can only encode single effect per tile.
			 * @param {ChatRoomMapEffect[][]} effectsFlat - a flat 2D array of effects at each tile.
			 * In this version of the codec each tile must contain either 0 or 1 effect.
			 * @param {BitStringWriter} writer
			 * @returns {boolean} `true` if the write operation was successful, `false` otherwise.
			 */
			function write(effectsFlat, writer) {
				// Default to the blank effect in case of zero-elements list
				const effectsFlatSingle = effectsFlat.map(
					(x) => x[0] ?? MapDataEffects.get(ChatRoomMapViewEffectStartID),
				);

				const settings = buildDynamicSettings(effectsFlatSingle);
				writeDynamicSettings(settings, writer);

				let i = 0;
				while (i < effectsFlatSingle.length) {
					const curEffect = effectsFlatSingle[i];

					// 1. Write the current effect ID.
					const remappedId = getRemappedId(curEffect.ID, settings);
					writer.writeUnsigned(remappedId, settings.remappedIdBits);

					// 2. Attempt to RLE-encode the current sequence of effects,
					// if it contains at least 2 items.
					const { maxRun, rleCountBits } = getRleSettings(curEffect.ID);
					let runLen = Math.min(getRunLength(i, effectsFlatSingle), maxRun);
					if (runLen >= 2) {
						writer.writeBool(true);
						// Encoded run-len is counted from 2, since it doesn't make sense to encode 0 or 1 run lengths.
						writer.writeUnsigned(runLen - 2, rleCountBits);
						i += runLen;
					} else {
						writer.writeBool(false);
						i++;
					}
				}

				return true;
			}

			/**
			 * Reads the encoded effects from {@link reader}.
			 * Does not throw.
			 * @param {BitStringReader} reader
			 * @param {number | undefined} requiredTilesCount required amount of tiles.
			 * If not `undefined`, the function returns `undefined` if the amount of tiles encoded
			 * in the reader is different from the required amount.
			 * @returns {ChatRoomMapEffect[][] | undefined}
			 * The flat list of map effects, or `undefined` if {@link reader}
			 * contains invalid data.
			 */
			function read(reader, requiredTilesCount) {
				let readLen = 0;

				/**
				 * @type {ChatRoomMapEffect[][]}
				 */
				let res = [];
				/**
				 * @type {Map<number, ChatRoomMapEffect>}
				 */
				let effectsCache = new Map();

				try {
					const settings = readDynamicSettings(reader);
					if (
						requiredTilesCount !== undefined &&
						settings.effectsLength !== requiredTilesCount
					) {
						return undefined;
					}

					while (readLen < settings.effectsLength) {
						// 1. Read the current effect ID.
						const remappedId = reader.readUnsigned(settings.remappedIdBits);
						const effectId = getEffectId(remappedId, settings);

						// rww: speeding up effects lookup via a cache until we have a more
						// efficient and generic lookup for effects/tiles/objects.
						/**
						 * @type {ChatRoomMapEffect | undefined}
						 */
						let effect;
						let cachedEffect = effectsCache.get(effectId);
						if (cachedEffect !== undefined) {
							effect = cachedEffect;
						} else {
							if (effectId === ChatRoomMapViewEffectStartID) {
								effect = undefined;
							} else {
								effect = MapDataEffects.get(effectId);
							}
							if (effect) {
								effectsCache.set(effectId, effect);
							}
						}

						// 2. Read the encoded run-len and calculate the effective on.
						// For non-RLE encoded tile, simply set it to 1.
						const isRle = reader.readBool();
						let runLen;
						if (isRle) {
							const { maxRun: _, rleCountBits } = getRleSettings(effectId);
							runLen = reader.readUnsigned(rleCountBits) + 2; // encoded run-len is counted from 2
						} else {
							runLen = 1;
						}

						// 3. Emit the required amount of tiles.
						for (let i = 0; i < runLen; i++) {
							res.push(effect === undefined ? [] : [effect]);
						}

						readLen += runLen;
					}
				} catch (e) {
					console.error("Attempt to decode invalid map data:", e);
					return undefined;
				}

				return res;
			}

			return {
				write,
				read,
			};
		})(),
	};

	/**
	 * @type {Record<number, MapManager.MapCodec<MapData>>}
	 */
	const MapDataCodecs = {
		0: (function () {
			const EFFECTS_CODEC_VERSION = 0;

			/**
			 * @param {MapData} map
			 * @param {BitStringWriter} writer
			 * @returns {boolean}
			 */
			function write(map, writer) {
				const effectsCodec = MapEffectsCodecs[EFFECTS_CODEC_VERSION];
				if (effectsCodec === undefined) {
					return false;
				}

				return effectsCodec.write(map.effects, writer);
			}

			/**
			 * @param {BitStringReader} reader
			 * @param {number | undefined} requiredTilesCount
			 * @returns {MapData | undefined}
			 */
			function read(reader, requiredTilesCount) {
				const effectsCodec = MapEffectsCodecs[EFFECTS_CODEC_VERSION];
				if (effectsCodec === undefined) {
					return undefined;
				}
				const effects = effectsCodec.read(reader, requiredTilesCount);
				const mapData = new MapData(ChatRoomMapViewWidth, ChatRoomMapViewHeight);
				mapData.effects = effects ?? [];
				return mapData;
			}

			return {
				write,
				read,
			};
		})(),
	};

	const MAP_EXPORT_VERSION_TAG = "@";
	const MAP_SYNC_VERSION_BIT_SIZE = 8;
	const MAP_SYNC_CURRENT_VERSION = 0;
	const CURRENT_EFFECTS_CODEC_VERSION = 0;

	/**
	 * Decodes the string that was generated with the `/mapcopy` command.
	 * Should support every map that was generated on any prior version.
	 * @param {string} s
	 * @returns {MapData | undefined} the decoded map data.
	 * Both `LegacyMapData` and `Map` fields being `undefined` indicates a decoding failure.
	 */
	function DecodeExportedMap(s) {
		const versionTagIdx = s.indexOf(MAP_EXPORT_VERSION_TAG);

		if (versionTagIdx < 0) {
			// Legacy exported map without effects.
			return decodeLegacyExportedMap(s);
		}

		if (versionTagIdx > 0) {
			// Combined exported map, both tiles/objects and effects in one string,
			// with the former encoded in the legacy way.
			return decodeCombinedExportedMap(s, versionTagIdx);
		}

		if (versionTagIdx === 0) {
			// Fully BitString-encoded map data. Currently not implemented.
			return decodeModernExportedMap(s);
		}

		console.error("Impossible exported map string value");
		return undefined;
	}

	/**
	 * Decodes the exported map string made by clients prior to the Effects update.
	 * @param {string} s
	 * @returns {MapData | undefined} the decoded map data.
	 */
	function decodeLegacyExportedMap(s) {
		/**
		 * @param {unknown} type
		 * @returns {type is ChatRoomMapType}
		 */
		function isMapType(type) {
			return type === "Always" || type === "Hybrid" || type === "Never";
		}

		// Try to decompress the data
		let DecompressedData = null;
		try {
			DecompressedData = LZString.decompressFromBase64(s);
		} catch {
			DecompressedData = null;
		}

		// If we failed to decompress
		if (DecompressedData === null) {
			return undefined;
		}

		// Tries to get the map data object
		/** @type {MapData | undefined} */
		let mapData;
		try {
			const data = JSON.parse(DecompressedData);
			if (
				!CommonIsObject(data) ||
				!("Tiles" in data) ||
				typeof data.Tiles !== "string" ||
				!("Type" in data) ||
				!isMapType(data.Type)
			) {
				return undefined;
			}
			mapData = MapData.load(/** @type {ServerChatRoomMapData} */ (data));
		} catch {
			return undefined;
		}

		return mapData;
	}

	/**
	 * Decodes the exported map string with both legacy and effects data.
	 * The legacy and effects parts are delimited with the version tag character (@).
	 * Due to how `LZString` library works, it doesn't read the base64-like string it
	 * consumes as the input past the end of compressed data, which means it completely
	 * ignores anything we append to the result of `LZString.compressToBase64`.
	 * Base64 alphabet doesn't contain the version tag character (@), so we won't have any
	 * 'false positives' either.
	 *
	 * This means we can just append the encoded effects and their version after the version tag,
	 * allowing the old versions to read the map data exported in new ones.
	 * @param {string} s
	 * @param {number} versionTagIdx the index of version tag character (@) in {@link s}.
	 * @returns {MapData | undefined} the decoded map data.
	 */
	function decodeCombinedExportedMap(s, versionTagIdx) {
		const legacyPart = s.slice(0, versionTagIdx);
		const effectsPart = s.slice(versionTagIdx);

		const legacyMap = decodeLegacyExportedMap(legacyPart);
		if (legacyMap === undefined) {
			// The legacy map data is invalid, so we don't need to bother decoding the
			// effects either. We won't get a proper map anyway.
			return legacyMap;
		}

		const modernMap = decodeModernExportedMap(effectsPart);
		if (modernMap) {
			legacyMap.effects = modernMap.effects;
		}
		return legacyMap;
	}

	/**
	 * Decodes the base64-encoded {@link MapData}.
	 * @param {string} s the exported map string. Must start with the version tag character (@).
	 * @returns {MapData | undefined} the decoded map data.
	 */
	function decodeModernExportedMap(s) {

		if (s[0] !== MAP_EXPORT_VERSION_TAG) {
			console.error(
				"Invalid modern exported map: missing MAP_EXPORT_VERSION_TAG in the beginning.",
			);
			return undefined;
		}

		try {
			const reader = BitStringReader.fromBase64(s.slice(1)); // skipping @
			if (reader === undefined) {
				console.error(
					"Error decoding modern exported map; invalid encoded string",
				);
				return undefined;
			}
			const version = reader.readUnsigned(MAP_SYNC_VERSION_BIT_SIZE);
			const codec = MapDataCodecs[version];
			if (codec === undefined) {
				console.error(
					"Error decoding modern exported map; unknown version",
					version,
				);
				return undefined;
			}

			const tilesCount = ChatRoomMapMaxLength;
			const map = codec.read(reader, tilesCount);
			return map;
		} catch (e) {
			console.error("Error decoding modern exported map:", e);
			return undefined;
		}
	}

	/**
	 * Exports the current map data into a string the player can save.
	 * Currently, the function requires both the legacy map data and the MapData instance
	 * holding the effects.
	 * @param {{LegacyMapData: ServerChatRoomMapData | undefined, MapData: MapData | undefined}} mapData
	 * @returns {string | undefined}
	 */
	function ExportMap(mapData) {
		const { LegacyMapData: legacyMap, MapData: map } = mapData;

		let legacyEncoded;
		if (legacyMap !== undefined) {
			// Remove the effects from the legacy map data. They would be encoded later to avoid
			// compressing/encoding them multiple times since they're already encoded in the ServerChatRoomMapData
			// object.
			const { Effects: _, ...legacyMapFiltered } = legacyMap;
			legacyEncoded = LZString.compressToBase64(
				JSON.stringify(legacyMapFiltered),
			);
		} else {
			legacyEncoded = "";
		}

		if (map !== undefined) {
			const codec = MapDataCodecs[MAP_SYNC_CURRENT_VERSION];
			const writer = new BitStringWriter();
			writer.writeUnsigned(
				MAP_SYNC_CURRENT_VERSION,
				MAP_SYNC_VERSION_BIT_SIZE,
			);
			if (!codec.write(map, writer)) {
				console.error("Failed to encode MapData into the BitString");
				return undefined;
			}

			return `${legacyEncoded}${MAP_EXPORT_VERSION_TAG}${writer.toBase64()}`;
		} else {
			// No MapData, simply return the legacy encoded string
			return legacyEncoded;
		}
	}

	/**
	 * Flags indicating which parts of the current map data are dirty and
	 * need to be synchronized with the server.
	 */
	const DirtyFlags = Object.freeze({
		EFFECTS: 1 << 1,
		TILES: 1 << 2,
		OBJECTS: 1 << 3,
		OBJECT_CONFIGS: 1 << 4,

		/**
		 * @param {number} n
		 * @param {number} flag
		 * @returns {boolean}
		 */
		hasFlag(n, flag) {
			return (n & flag) === flag;
		},

		/**
		 * @param {number} n
		 * @param {number} flag
		 * @returns {number}
		 */
		setFlag(n, flag) {
			return n | flag;
		},

		/**
		 * @param {number} n
		 * @param {number} flag
		 * @returns {number}
		 */
		clearFlag(n, flag) {
			return n & ~flag;
		},

		/**
		 * Returns a number with all valid dirty flags enabled.
		 * @returns {number}
		 */
		all() {
			return DirtyFlags.EFFECTS | DirtyFlags.OBJECTS | DirtyFlags.TILES | DirtyFlags.OBJECT_CONFIGS;
		},
	});

	/**
	 * The class holding the map data and responsible for keeping it synchronized with the outside
	 * global state, notably, ChatRoomData.MapData.
	 */
	class Manager {
		/**
		 * @type {MapData | undefined}
		 */
		#_mapData;

		/**
		 * @type {number}
		 */
		#_dirtyFlags;

		constructor() {
			this.#_dirtyFlags = 0;
		}

		/**
		 * Turns either `(index, ...args)` or `(x, y, ...args)` forms into `[index, ...args]`.
		 * The second value is Y when it is a number; otherwise the first value is already an index.
		 * @template {readonly [number, ...unknown[]]} T
		 * @param {T} args
		 * @returns {UnpackedIndex<T>}
		 */
		unpackIndex(...args) {
			if (typeof args[1] === "number") {
				const [x, y, ...rest] = args;
				return /** @type {UnpackedIndex<T>} */ (
					/** @type {unknown} */ ([MapCoordinatesToIndex(x, y), ...rest])
				);
			}
			return /** @type {UnpackedIndex<T>} */ (/** @type {unknown} */ (args));
		}

		/**
		 * Get the tile ID at the given coordinates
		 * @overload
		 * @param {number} index
		 * @returns {number | null}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @returns {number | null}
		 */
		/**
		 * @param {[x: number, y: number] | [index: number]} args
		 * @returns {number | null}
		 */
		getTileId(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			const [index] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return null;
			return this.#_mapData.tiles[index].ID;
		}

		/**
		 * Get the tile at the given coordinates
		 * @overload
		 * @param {number} index
		 * @returns {ChatRoomMapTile | null}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @returns {ChatRoomMapTile | null}
		 */
		/**
		 * @param {[x: number, y: number] | [index: number]} args
		 * @returns {ChatRoomMapTile | null}
		 */
		getTile(...args) {
			const [index] = this.unpackIndex(...args);
			const id = this.getTileId(index);
			return id !== null ? MapGetDoodad("Tile", id) : null;
		}

		/**
		 * Set the tile at the given coordinates
		 * @overload
		 * @param {number} index
		 * @param {ChatRoomMapTile | null} tile
		 * @param {number} [range=0]
		 * @returns {boolean}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @param {ChatRoomMapTile | null} tile
		 * @param {number} [range=0]
		 * @returns {boolean}
		 */
		/**
		 * @template {[index: number, tile: ChatRoomMapTile | null, range?: number] | [x: number, y: number, tile: ChatRoomMapTile | null, range?: number]} T
		 * @param {T} args
		 * @returns {boolean}
		 */
		setTile(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			let [index, tile, range = 0] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return false;

			range = CommonClamp(range, 0, Infinity);
			if (tile?.Unique) range = 0;

			const clean = this.isDirtyObjects();
			const previousTile = this.getTile(index) ?? MapDataGetTile(ChatRoomMapViewObjectStartID);
			const undoGroup = this.#registerUndo(() => {
				if (!this.#_mapData) return;
				const undoMap = this.#_mapData;
				if (clean) this.markCleanTiles();
				MapForEachIndexInRange(index, range, (curIndex) => {
					if (this.canSetTile(index, tile)) {
						undoMap.tiles[curIndex] = previousTile;
					}
				});
			});

			if (tile?.Unique) {
				this.#clearUniqueTile(tile, undoGroup);
			}
			this.#_markDirty(DirtyFlags.TILES);
			tile ??= MapDataGetTile(ChatRoomMapViewObjectStartID);

			const map = this.#_mapData;
			MapForEachIndexInRange(index, range, (curIndex) => {
				if (this.canSetTile(index, tile)) {
					map.tiles[curIndex] = tile;
				}
			});

			return true;
		}

		/**
		 * Check whether a tile can be placed at the given coordinates
		 * @overload
		 * @param {number} index
		 * @param {ChatRoomMapTile | null} tile
		 * @returns {boolean}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @param {ChatRoomMapTile | null} tile
		 * @returns {boolean}
		 */
		/**
		 * @template {[index: number, tile: ChatRoomMapTile | null, range?: number] | [x: number, y: number, tile: ChatRoomMapTile | null]} T
		 * @param {T} args
		 * @returns {boolean}
		 */
		canSetTile(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			let [index, tile] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return false;

			tile ??= MapDataGetTile(ChatRoomMapViewObjectStartID);
			if (!tile) return false;

			if (tile.Style === "Blank") return true;

			return true;
		}

		/**
		 * @param {ChatRoomMapTile} tile
		 * @param {MapManager.UndoGroup} [undo]
		 * @returns {boolean}
		 */
		#clearUniqueTile(tile, undo) {
			if (!this.#_mapData) throw Error("No map loaded");
			if (!tile?.Unique) return false;
			const tiles = this.#_mapData.tiles;
			if (tiles == null) return false;

			const tilesClean = !this.isDirtyTiles();
			let cleared = false;
			for (let index = 0; index < tiles.length; index++) {
				if (tiles[index].ID !== tile.ID) continue;

				undo?.add(() => {
					if (!this.#_mapData) return;
					this.#_mapData.tiles[index] = tile;
				});

				this.#_mapData.tiles[index] = MapDataGetTile(ChatRoomMapViewObjectStartID);
				cleared = true;
			}

			if (cleared) {
				if (tilesClean) {
					undo?.add(() => this.markCleanTiles());
				}
				this.#_markDirty(DirtyFlags.TILES);
			}

			return cleared;
		}

		/**
		 * Get the object ID at the given coordinates
		 * @overload
		 * @param {number} index
		 * @returns {number | null}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @returns {number | null}
		 */
		/**
		 * @param {[x: number, y: number] | [index: number]} args
		 * @returns {number | null}
		 */
		getObjectId(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			const [index] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return null;
			return this.#_mapData.objects[index].ID;
		}

		/**
		 * Get the object at the given coordinates
		 * @overload
		 * @param {number} index
		 * @returns {ChatRoomMapObject | null}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @returns {ChatRoomMapObject | null}
		 */
		/**
		 * @param {[x: number, y: number] | [index: number]} args
		 * @returns {ChatRoomMapObject | null}
		 */
		getObject(...args) {
			const [index] = this.unpackIndex(...args);
			const id = this.getObjectId(index);
			return id !== null ? MapGetDoodad("Object", id) : null;
		}

		/**
		 * Set the object at the given coordinates
		 * @overload
		 * @param {number} index
		 * @param {ChatRoomMapObject | null} object
		 * @param {number} [range]
		 * @returns {boolean}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @param {ChatRoomMapObject | null} object
		 * @param {number} [range]
		 * @returns {boolean}
		 */
		/**
		 * @template {[index: number, tile: ChatRoomMapObject | null, range?: number] | [x: number, y: number, tile: ChatRoomMapObject | null, range?: number]} T
		 * @param {T} args
		 * @returns {boolean}
		 */
		setObject(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			let [index, object, range = 0] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return false;

			range = CommonClamp(range, 0, Infinity);
			if (object?.Unique) range = 0;

			if (object?.DefaultObjectConfig?.Type === "Teleporter") range = 0;

			const clean = this.isDirtyObjects();
			const previousObject = this.getObject(index) ?? MapDataGetObject(ChatRoomMapViewObjectStartID);
			const undo = this.#registerUndo(() => {
				if (!this.#_mapData) return;
				if (clean) this.markCleanObjects();
				const undoMap = this.#_mapData;
				MapForEachIndexInRange(index, range, (curIndex) => {
					undoMap.objects[curIndex] = previousObject;
				});
			});

			if (object?.Unique) {
				this.#clearUniqueObject(object, undo);
			}

			this.#_markDirty(DirtyFlags.OBJECTS);
			object ??= MapDataGetObject(ChatRoomMapViewObjectStartID);

			const map = this.#_mapData;
			MapForEachIndexInRange(index, range, (curIndex) => {
				if (this.canSetObject(index, object)) {
					map.objects[curIndex] = object;
				}
			});

			// A newly placed object starts with its default config
			if (object.DefaultObjectConfig && previousObject.ID !== object.ID && this.getObjectId(index) === object.ID) {
				this.setObjectConfig(index, CommonCloneDeep(object.DefaultObjectConfig));
				if (object.DefaultObjectConfig.Type === "Teleporter") this.#pairNewTeleporter(index);
			}

			return true;
		}

		/**
		 * Points a teleport pad that was just placed and one still waiting for a pair at each other,
		 * so placing two pads in a row links them both ways. A pad waits when it doesn't send anywhere
		 * and no pad sends to it. A new pair gets a color no other pad has, when there's one left.
		 * @param {number} index - The new pad
		 */
		#pairNewTeleporter(index) {
			if (!this.#_mapData) throw Error("No map loaded");
			const pads = [];
			const targeted = new Set();
			const usedColors = new Set();
			for (const key of Object.keys(this.#_mapData.objectConfigs ?? {})) {
				const other = Number(key);
				const config = this.#teleporterConfig(other);
				if (other === index || !config) continue;
				pads.push(other);
				if (config.Destination) targeted.add(MapCoordinatesToIndex(config.Destination.X, config.Destination.Y));
				if (config.Color) usedColors.add(config.Color);
			}
			const waiting = pads.find(other => !this.getTeleporterDestination(other) && !targeted.has(other));
			if (waiting == null) {
				const colors = AssetsMapDataTeleportPadColors;
				this.setTeleporterColor(index, colors.find(color => !usedColors.has(color)) ?? colors[pads.length % colors.length]);
				return;
			}
			this.setTeleporterColor(index, this.getTeleporterColor(waiting) ?? AssetsMapDataTeleportPadColors[0]);
			this.setTeleporterDestination(index, MapIndexToCoordinates(waiting));
			this.setTeleporterDestination(waiting, MapIndexToCoordinates(index));
		}

		/**
		 * Can the given object be placed at the given coordinates
		 * @overload
		 * @param {number} index
		 * @param {ChatRoomMapObject | null} object
		 * @returns {boolean}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @param {ChatRoomMapObject | null} object
		 * @returns {boolean}
		 */
		/**
		 * @template {[index: number, tile: ChatRoomMapObject | null, range?: number] | [x: number, y: number, tile: ChatRoomMapObject | null]} T
		 * @param {T} args
		 * @returns {boolean}
		 */
		canSetObject(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			let [index, object] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return false;

			object ??= MapDataGetObject(ChatRoomMapViewObjectStartID);
			if (!object) return false;

			if (object.Style === "Blank") return true;
			const tile = this.getTile(index);
			if (tile?.Type !== "Wall" && object.CanPlaceOnFloors === false) return false;
			if (tile?.Type === "Wall" && !object.CanPlaceOnWalls) return false;

			const belowCoord = MapIndexToCoordinates(index);
			const tileBelow = this.getTile(belowCoord.X, belowCoord.Y + 1);
			if (tile?.Type === "Wall" && tileBelow?.Type === "Wall" && !object.CanPlaceInWalls) return false;

			return true;
		}


		/**
		 * Checks if the object config is valid
		 * @param {number} index - The index of the object
		 * @param {ChatRoomMapObjectConfig["Type"]} type - The type of config
		 * @returns {boolean}
		 */
		isValidObjectConfig(index, type) {
			const cell = MapManager.Map.getObject(index);
			switch (type) {
				case "Sign":
					if (cell && ["SignWood", "SignWoodWall", "SignMetal", "SignMetalWall"].includes(cell.Style)) return true;
					return false;
				case "Teleporter":
					return cell?.DefaultObjectConfig?.Type === "Teleporter";
				case "Tether":
					return !!cell?.CanBeTetherPoint;
			}
		}

		/**
		 * Gets where the teleport pad at the given coordinates sends to
		 * @param {[x: number, y: number] | [index: number]} args
		 * @return {ChatRoomMapPos | null} - null if it's not a teleport pad or it doesn't send anywhere yet
		 */
		getTeleporterDestination(...args) {
			const [index] = this.unpackIndex(...args);
			const config = this.#teleporterConfig(index);
			if (!config?.Destination) return null;
			// A copy, the player's position is changed in place when she walks
			return { X: config.Destination.X, Y: config.Destination.Y };
		}

		/**
		 * Sets where the teleport pad at the given coordinates sends to
		 * @param {[x: number, y: number, destination: ChatRoomMapPos | null] | [index: number, destination: ChatRoomMapPos | null]} args
		 * @return {boolean} - false if it's not a teleport pad, or the destination is the pad itself, a wall or outside the map
		 */
		setTeleporterDestination(...args) {
			const [index, destination] = this.unpackIndex(...args);
			const config = this.#teleporterConfig(index);
			if (!config) return false;
			if (!destination) {
				const withoutDestination = { ...config };
				delete withoutDestination.Destination;
				return this.setObjectConfig(index, withoutDestination);
			}
			const { X, Y } = destination;
			if (X < 0 || Y < 0 || X >= ChatRoomMapViewWidth || Y >= ChatRoomMapViewHeight) return false;
			if (MapCoordinatesToIndex(X, Y) === index || this.getTile(X, Y)?.Type === "Wall") return false;
			return this.setObjectConfig(index, { ...config, Destination: { X, Y } });
		}

		/**
		 * The config of the teleport pad at the given index
		 * @param {number} index
		 * @return {ChatRoomMapTeleporterObjectConfig | null} - null if there's no teleport pad there
		 */
		#teleporterConfig(index) {
			if (this.getObject(index)?.DefaultObjectConfig?.Type !== "Teleporter") return null;
			const config = this.getObjectConfig(index);
			return config?.Type === "Teleporter" ? config : null;
		}

		/**
		 * Whether a teleport pad sends to the given coordinates
		 * @param {[x: number, y: number] | [index: number]} args
		 * @return {boolean}
		 */
		isTeleporterDestination(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			const [index] = this.unpackIndex(...args);
			for (const key of Object.keys(this.#_mapData.objectConfigs ?? {})) {
				const destination = this.#teleporterConfig(Number(key))?.Destination;
				if (destination && MapCoordinatesToIndex(destination.X, destination.Y) === index) return true;
			}
			return false;
		}

		/**
		 * Gets the color of the teleport pad at the given coordinates, with its opacity when it's see-through
		 * @param {[x: number, y: number] | [index: number]} args
		 * @return {HexColor | null} - null if it's not a teleport pad or it has no color
		 */
		getTeleporterColor(...args) {
			const [index] = this.unpackIndex(...args);
			return this.#teleporterConfig(index)?.Color ?? null;
		}

		/**
		 * Sets the color of the teleport pad at the given coordinates
		 * @param {[x: number, y: number, color: HexColor] | [index: number, color: HexColor]} args - The color, opacity included (#RRGGBBAA)
		 * @return {boolean} - false if it's not a teleport pad or the color isn't a color
		 */
		setTeleporterColor(...args) {
			const [index, color] = this.unpackIndex(...args);
			const config = this.#teleporterConfig(index);
			if (!config || !CommonIsColor(color, { allowAlpha: true })) return false;
			return this.setObjectConfig(index, { ...config, Color: color });
		}

		/**
		 *
		 * @param {ChatRoomMapObject} object
		 * @param {MapManager.UndoGroup} [undo]
		 * @returns {boolean}
		 */
		#clearUniqueObject(object, undo) {
			if (!this.#_mapData) throw Error("No map loaded");
			if (!object?.Unique) return false;
			const objects = this.#_mapData.objects;

			const objectsClean = !this.isDirtyObjects();
			let cleared = false;
			for (let index = 0; index < objects.length; index++) {
				if (objects[index].ID !== object.ID) continue;

				undo?.add(() => {
					if (!this.#_mapData) return;
					this.#_mapData.objects[index] = object;
				});

				this.#_mapData.objects[index] = MapDataGetObject(ChatRoomMapViewObjectStartID);
				cleared = true;
			}
			if (cleared) {
				if (objectsClean) {
					undo?.add(() => this.markCleanObjects());
				}
				this.#_markDirty(DirtyFlags.OBJECTS);
			}
			return cleared;
		}

		/**
		 * Gets the config for an object at the given coordinates.
		 * @overload
		 * @param {number} index
		 * @returns {ChatRoomMapObjectConfig | null}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @returns {ChatRoomMapObjectConfig | null}
		 */
		/**
		 * @param {[x: number, y: number] | [index: number]} args
		 * @returns {ChatRoomMapObjectConfig | null}
		 */
		getObjectConfig(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			const [index] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return null;
			return this.#_mapData.objectConfigs?.[index];
		}

		/**
		 * Sets the config for an object at the given coordinates.
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @param {ChatRoomMapObjectConfig} [config]
		 * @returns {boolean} true if the cell config was set, false if the coordinates are out of bounds.
		 */
		/**
		 * @overload
		 * @param {number} index
		 * @param {ChatRoomMapObjectConfig} [config]
		 * @returns {boolean} true if the cell config was set, false if the coordinates are out of bounds.
		 */
		/**
		 * @param {[x: number, y: number, config?: ChatRoomMapObjectConfig] | [index: number, config?: ChatRoomMapObjectConfig]} args
		 * @returns {boolean} true if the cell config was set, false if the coordinates are out of bounds.
		 */
		setObjectConfig(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			const [index, config] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return false;

			const clean = this.isDirtyObjectConfigs();
			const previousConfig = this.getObjectConfig(index);
			this.#registerUndo(() => {
				if (!this.#_mapData) return;
				if (clean) this.markCleanObjectConfigs();
				if (previousConfig) {
					this.#_mapData.objectConfigs[index] = previousConfig;
				} else {
					delete this.#_mapData.objectConfigs[index];
				}
			});

			this.#_markDirty(DirtyFlags.OBJECT_CONFIGS);
			if (config == null) {
				delete this.#_mapData.objectConfigs[index];
			} else {
				this.#_mapData.objectConfigs[index] = config;
			}
			return true;
		}


		/**
		 * Get the current active effects array at a given coordinates.
		 * @overload
		 * @param {number} index
		 * @returns {ChatRoomMapEffect[]}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @returns {ChatRoomMapEffect[]}
		 */
		/**
		 * @param {[x: number, y: number] | [index: number]} args
		 * @returns {ChatRoomMapEffect[]}
		 */
		getEffects(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			const [index] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return [];
			return this.#_mapData.effects[index];
		}

		/**
		 * Get the current active effects array at a given coordinates.
		 * @param {number} x
		 * @param {number} y
		 * @returns {ChatRoomMapEffect[]}
		 * @deprecated Use {@link Manager.getEffects}
		 */
		getEffectsByXY(x, y) {
			return this.getEffects(x, y);
		}

		/**
		 * Get the current active effects array at a given tile index.
		 * @param {number} tileIndex the index of a map tile, as returned by MapCoordinatesToIndex.
		 * @returns {ChatRoomMapEffect[]}
		 * @deprecated Use {@link Manager.getEffects}
		 */
		getEffectsByIndex(tileIndex) {
			return this.getEffects(tileIndex);
		}

		/**
		 * Add an active effects at given coordinates.
		 * @overload
		 * @param {number} index
		 * @param {ChatRoomMapEffect} effect
		 * @param {number} [range]
		 * @returns {boolean}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @param {ChatRoomMapEffect} effect
		 * @param {number} [range]
		 * @returns {boolean}
		 */
		/**
		 * @template {[index: number, effect: ChatRoomMapEffect, range?: number] | [x: number, y: number, effect: ChatRoomMapEffect, range?: number]} T
		 * @param {T} args
		 * @returns {boolean}
		 */
		addEffect(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			let [index, effect, range = 0] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return false;

			const effects = this.getEffects(index);
			if (effects.find(e => e.ID === effect.ID)) return false;
			effects.push(effect);
			this.setEffects(index, effects, range);
			return true;
		}

		/**
		 * Sets the list of active effects at given coordinates.
		 * @overload
		 * @param {number} index
		 * @param {ChatRoomMapEffect[]} effects
		 * @param {number} [range]
		 * @returns {boolean}
		 */
		/**
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @param {ChatRoomMapEffect[]} effects
		 * @param {number} [range]
		 * @returns {boolean}
		 */
		/**
		 * @template {[index: number, effects: ChatRoomMapEffect[], range?: number] | [x: number, y: number, effects: ChatRoomMapEffect[], range?: number]} T
		 * @param {T} args
		 * @returns {boolean}
		 */
		setEffects(...args) {
			if (!this.#_mapData) throw Error("No map loaded");
			let [index, effects, range = 0] = this.unpackIndex(...args);
			if (index < 0 || index >= ChatRoomMapMaxLength) return false;

			const clean = this.isDirtyEffects();
			const previousEffects = [...this.#_mapData.effects[index]];
			this.#registerUndo(() => {
				if (!this.#_mapData) return;
				if (clean) this.markCleanEffects();
				const undoMap = this.#_mapData;
				MapForEachIndexInRange(index, range, (curIndex) => {
					undoMap.effects[curIndex] = previousEffects;
				});
			});

			this.#_markDirty(DirtyFlags.EFFECTS);

			const map = this.#_mapData;
			MapForEachIndexInRange(index, range, (curIndex) => {
				map.effects[curIndex] = [...effects];
			});

			return true;
		}

		/**
		 * Sets the list of active effects at given coordinates.
		 * @param {number} x
		 * @param {number} y
		 * @param {ChatRoomMapEffect[]} effects
		 * @returns {void}
		 * @deprecated Use {@link Manager.setEffects}
		 */
		setEffectsByXY(x, y, effects) {
			this.setEffects(x, y, effects);
		}

		/**
		 * Sets the list of active effects at a given tile index.
		 * @param {number} tileIndex
		 * @param {ChatRoomMapEffect[]} effects
		 * @returns {void}
		 * @deprecated Use {@link Manager.setEffects}
		 */
		setEffectsByIndex(tileIndex, effects) {
			this.setEffects(tileIndex, effects);
		}

		/**
		 * Clears the list of active effects at given coordinates.
		 * @param {number} x
		 * @param {number} y
		 * @returns {void}
		 * @deprecated Use {@link Manager.setEffects}
		 */
		clearEffectsByXY(x, y) {
			this.setEffects(x, y, []);
		}

		/**
		 * Clears the list of active effects at a given tile index.
		 * @param {number} tileIndex
		 * @returns {void}
		 * @deprecated Use {@link Manager.setEffects}
		 */
		clearEffectsByIndex(tileIndex) {
			this.setEffects(tileIndex, []);
		}

		/**
		 * Returns the effects list for each tile in the map, one array element per tile.
		 * Currently for efficiency does not copy the underlying array.
		 * The users must not modify the returned array directly.
		 * @returns {ChatRoomMapEffect[][]}
		 */
		getAllEffects() {
			if (!this.#_mapData) throw Error("No map loaded");
			return this.#_mapData.effects;
		}

		/**
		 * Replaces all current effects with the parsed effects array.
		 * @param {ChatRoomMapEffect[][]} effectsList
		 * @returns {void}
		 */
		replaceAllEffects(effectsList) {
			if (!this.#_mapData) throw Error("No map loaded");
			const clean = this.isDirtyEffects();
			const previousEffects = [...this.#_mapData.effects];

			this.#registerUndo(() => {
				if (!this.#_mapData) return;
				if (clean) this.markCleanEffects();
				this.#_mapData.effects = previousEffects;
			});
			this.markDirtyEffects();
			this.#_mapData.effects = structuredClone(effectsList);
		}

		/**
		 * Removes all effects from the map.
		 * @returns {void}
		 */
		removeAllEffects() {
			if (!this.#_mapData) throw Error("No map loaded");
			this.#_mapData.removeAllEffects();
		}

		get hasFogEnabled() {
			if (!this.#_mapData) throw Error("No map loaded");
			return this.#_mapData.fogEnabled;
		}

		/**
		 * @param {boolean} val
		 */
		set hasFogEnabled(val) {
			if (!this.#_mapData) throw Error("No map loaded");
			this.#_mapData.fogEnabled = val;
		}

		/**
		 * Mark a specific part of the map data as dirty, that is, changed and not yet synchronized with the server.
		 * @param {number} flag
		 */
		#_markDirty(flag) {
			this.#_dirtyFlags = DirtyFlags.setFlag(this.#_dirtyFlags, flag);
		}

		/**
		 * Marks a specific part of the map data as clean, that is, synchronized with the server.
		 * @param {number} flag
		 * @returns {void}
		 */
		#_markClean(flag) {
			this.#_dirtyFlags = DirtyFlags.clearFlag(this.#_dirtyFlags, flag);
		}

		/**
		 * Marks the current effects data as dirty, that is, changed and not yet synchronized with the server.
		 * @returns {void}
		 */
		markDirtyEffects() {
			this.#_markDirty(DirtyFlags.EFFECTS);
		}

		/**
		 * Marks the current effects data as clean, that is, synchronized with the server.
		 * @returns {void}
		 */
		markCleanEffects() {
			this.#_markClean(DirtyFlags.EFFECTS);
		}

		/**
		 * Checks whether the current effects data is dirty, that is, whether it needs
		 * to be synchronized with the server.
		 * @returns {boolean}
		 */
		isDirtyEffects() {
			return DirtyFlags.hasFlag(this.#_dirtyFlags, DirtyFlags.EFFECTS);
		}

		/**
		 * Marks the current tiles data as dirty, that is, changed and not yet synchronized with the server.
		 * @returns {void}
		 */
		markDirtyTiles() {
			this.#_markDirty(DirtyFlags.TILES);
		}

		/**
		 * Marks the current tiles data as clean, that is, synchronized with the server.
		 * @returns {void}
		 */
		markCleanTiles() {
			this.#_markClean(DirtyFlags.TILES);
		}

		/**
		 * Checks whether the current tiles data is dirty, that is, whether it needs
		 * to be synchronized with the server.
		 * @returns {boolean}
		 */
		isDirtyTiles() {
			return DirtyFlags.hasFlag(this.#_dirtyFlags, DirtyFlags.TILES);
		}

		/**
		 * Marks the current objects data as dirty, that is, changed and not yet synchronized with the server.
		 * @returns {void}
		 */
		markDirtyObjects() {
			this.#_markDirty(DirtyFlags.OBJECTS);
		}

		/**
		 * Marks the current objects data as clean, that is, synchronized with the server.
		 * @returns {void}
		 */
		markCleanObjects() {
			this.#_markClean(DirtyFlags.OBJECTS);
		}

		/**
		 * Checks whether the current objects data is dirty, that is, whether it needs
		 * to be synchronized with the server.
		 * @returns {boolean}
		 */
		isDirtyObjects() {
			return DirtyFlags.hasFlag(this.#_dirtyFlags, DirtyFlags.OBJECTS);
		}

		/**
		 * Marks the object configs as dirty, that is, changed and not yet synchronized with the server.
		 * @returns {void}
		 */
		markDirtyObjectConfigs() {
			this.#_markDirty(DirtyFlags.OBJECT_CONFIGS);
		}
		/**
		 * Marks the object configs as clean, that is, synchronized with the server.
		 * @returns {void}
		 */
		markCleanObjectConfigs() {
			this.#_markClean(DirtyFlags.OBJECT_CONFIGS);
		}

		/**
		 * Checks whether the object configs are dirty, that is, whether it needs
		 * to be synchronized with the server.
		 * @returns {boolean}
		 */
		isDirtyObjectConfigs() {
			return DirtyFlags.hasFlag(this.#_dirtyFlags, DirtyFlags.OBJECT_CONFIGS);
		}

		/**
		 * Mark all data in the current map as clean.
		 * @returns {void}
		 */
		markCleanAll() {
			this.#_dirtyFlags = 0;
		}

		/**
		 * Exports the current map data, including the tiles/objects,
		 * as a string that could be copied and stored by the players.
		 * @returns {string | undefined} the exported string, or `undefined`
		 * if there was an error while exporting the map.
		 */
		exportString() {
			return ExportMap({
				LegacyMapData: ChatRoomData?.MapData,
				MapData: this.#_mapData,
			});
		}

		/**
		 * Imports the map string that was exported earlier with {@link Manager.exportString}
		 * method.
		 *
		 * This method must be as much compatible as possible, recovering as much information
		 * as possible from the exported map strings from any previous version of the game
		 * to prevent the players losing their stored maps.
		 *
		 * This method modifies the state of the current map and returns `true` in case of a successful import.
		 * If the string is malformed and cannot be parsed, the method returns `false` and doesn't modify
		 * any state.
		 * @param {string} mapString
		 * @returns {boolean} `true` if the string was successfully parsed and the current map data is updated,
		 * `false` otherwise
		 */
		importString(mapString) {
			if (!ChatRoomData?.MapData) throw new Error("No map in current room");
			const mapData = DecodeExportedMap(mapString);
			// No data was decoded
			if (mapData === undefined) {
				return false;
			}

			this.#_mapData = mapData;
			this.markDirtyTiles();
			this.markDirtyObjects();
			this.markDirtyEffects();
			this.markDirtyObjectConfigs();

			this.updateGlobalMapData();

			return true;
		}

		/** @type {boolean[]} */
		sightMask = [];
		/** @type {boolean[]} */
		hearingMask = [];

		/**
		 * Whether the given tile is visible to the player
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @returns {boolean}
		 */
		/**
		 * @overload
		 * @param {number} index
		 * @returns {boolean}
		 */
		/**
		 * Whether the given tile is visible to the player
		 * @param {number} xOrIndex
		 * @param {number} [y]
		 * @returns {boolean}
		 */
		isTileVisible(xOrIndex, y) {
			const index = y !== undefined ? MapCoordinatesToIndex(xOrIndex, y) : xOrIndex;
			return this.sightMask[index];
		}

		/**
		 * Whether the given tile is visible to the player
		 * @overload
		 * @param {number} x
		 * @param {number} y
		 * @returns {boolean}
		 */
		/**
		 * @overload
		 * @param {number} index
		 * @returns {boolean}
		 */
		/**
		 * Whether the given tile is visible to the player
		 * @param {number} xOrIndex
		 * @param {number} [y]
		 * @returns {boolean}
		 */
		isTileHearable(xOrIndex, y) {
			const index = y !== undefined ? MapCoordinatesToIndex(xOrIndex, y) : xOrIndex;
			return this.hearingMask[index];
		}

		/**
		 * Updates the map tiles' visibility & hearability based on the player's position
		 * @returns {void}
		 */
		updatePlayerPerception() {
			// The player has never opened the map, ignore
			if (!Player.MapData) return;

			// When in edit mode or with active super powers, always show everything
			if (ChatRoomMapViewHasSuperPowers()) {
				this.sightMask.fill(true);
				this.hearingMask.fill(true);
				return;
			}

			const mapLength = ChatRoomMapViewWidth * ChatRoomMapViewHeight;
			const sightRange = ChatRoomMapViewGetSightRange();
			const hearingRange = ChatRoomMapViewGetHearingRange();
			const raycastOffset = 0.4999;

			for (let i = 0; i < mapLength; i++) {
				const {X, Y} = MapIndexToCoordinates(i);
				// Calculate the view line between player as f(x) = slopeX * x + yIntercept and f(y) = slopeY * y + xIntercept
				const dirX = Math.sign(X - Player.MapData.Pos.X);
				const dirY = Math.sign(Y - Player.MapData.Pos.Y);

				const posTileCorner = { x: X + (dirX * raycastOffset), y: Y - (dirY * raycastOffset) };
				const slopeX = (posTileCorner.y - Player.MapData.Pos.Y) / (posTileCorner.x - Player.MapData.Pos.X);
				const slopeY = (posTileCorner.x - Player.MapData.Pos.X) / (posTileCorner.y - Player.MapData.Pos.Y);
				const yIntercept = Player.MapData.Pos.Y - (slopeX * Player.MapData.Pos.X);
				const xIntercept = Player.MapData.Pos.X - (slopeY * Player.MapData.Pos.Y);

				// Initialize this entry of visibility and audibility map with sight and hearing range
				const distance = Math.max(Math.abs(Player.MapData.Pos.X - X), Math.abs(Player.MapData.Pos.Y - Y));
				this.sightMask[i] = sightRange >= distance;
				this.hearingMask[i] = hearingRange >= distance;

				// Calculate obstacles in horizontality if horizontal slope is not too steep
				if (slopeX != Infinity && dirX !== 0) {
					// Iterate over every x-position between player and target tile
					for (let x = Player.MapData.Pos.X + dirX; x != X && x != X + dirX; x += dirX) {
						// If both, visibility and audibility masks already are set to false for this tile, we don't need to continue
						if (!this.sightMask[i] && !this.hearingMask[i]) {
							break;
						}

						// Calculate the y-position with the view line formular and get the tiles and objecs on the in-between position
						const y = Math.round(slopeX * x + yIntercept);
						let tileData = MapManager.Map.getTile(x, y);
						let objectData = MapManager.Map.getObject(x, y);
						// If tile data exists, apply the blockvision and blockhearing flags to visibility and audibility map
						if (tileData) {
							this.sightMask[i] &&= tileData.BlockVision ? false : true;
							this.hearingMask[i] &&= tileData.BlockHearing ? false : true;
						}
						// If object data exists, apply the blockvision and blockhearing flags to visibility and audibility map
						if (objectData) {
							this.sightMask[i] &&= objectData.BlockVision ? false : true;
							this.hearingMask[i] &&= objectData.BlockHearing ? false : true;
						}

					}
				}
				// Calculate obstacles in verticality if vertical slope is not too steep
				if (slopeY != Infinity && dirY != 0) {
					// Iterate over every y-position between player and target tile
					for (let y = Player.MapData.Pos.Y + dirY; y != Y && y != Y + dirY; y += dirY) {
						// If both, visibility and audibility masks already are set to false for this tile, we don't need to continue
						if (!this.sightMask[i] && !this.hearingMask[i]) {
							break;
						}

						// Calculate the x-position with the view line formular and get the tiles and objecs on the in-between position
						const x = Math.round(slopeY * y + xIntercept);
						let tileData = MapManager.Map.getTile(x, y);
						let objectData = MapManager.Map.getObject(x, y);
						// If tile data exists, apply the blockvision and blockhearing flags to visibility and audibility map
						if (tileData != null) {
							this.sightMask[i] &&= tileData.BlockVision ? false : true;
							this.hearingMask[i] &&= tileData.BlockHearing ? false : true;
						}
						// If object data exists, apply the blockvision and blockhearing flags to visibility and audibility map
						if (objectData != null) {
							this.sightMask[i] &&= objectData.BlockVision ? false : true;
							this.hearingMask[i] &&= objectData.BlockHearing ? false : true;
						}

					}
				}
			}
		}

		validateMap() {
			for (let index = 0; index < ChatRoomMapViewWidth * ChatRoomMapViewHeight; index++) {
				const objectData = this.getObjectConfig(index);
				const object = this.getObject(index);
				switch (objectData?.Type) {
					case "Sign":
						if (!object || !this.isValidObjectConfig(index, "Sign")) {
							this.setObjectConfig(index, undefined);
						}
						break;
					case "Teleporter":
						if (!object || !this.isValidObjectConfig(index, "Teleporter")) {
							this.setObjectConfig(index, undefined);
						}
						break;
					case "Tether":
						if (!object || !this.isValidObjectConfig(index, "Tether")) {
							this.setObjectConfig(index, undefined);
						}
						break;
				}
				// The pad whose menu is open is gone: its menu goes too
				if (index === ChatRoomMapViewTeleportPadIndex && this.getObjectConfig(index)?.Type !== "Teleporter") ChatRoomMapViewHideDialogMenu();

				if (!object) continue;
				if (!this.canSetObject(index, object)) {
					this.setObject(index, null);
				};
			}
		}

		/**
		 * Encodes the current map data and updates the global {@link ChatRoomData.MapData} value.
		 * This function must be called after the map was changed and before it is sent to the server.
		 * Ideally we want to have a single function to build the encoded map data only
		 * when required, but it would require a significant API change of the outside code.
		 *
		 * For places where the synchronization happens, see {@link ChatRoomGetSettings} usages.
		 *
		 * This function is not supposed to fail; if it indicates an error by returning `false`,
		 * this means we have a bug in our code.
		 * @returns {boolean} `true` if we successfully encoded the map data; `false` if
		 * there was an error and the global state remains unchanged.
		 */
		updateGlobalMapData() {
			if (!this.#_mapData) throw Error("No map loaded");
			if (!ChatRoomData?.MapData) throw new Error("No map in current room");
			this.validateMap();
			const ret = this.#_mapData.save(ChatRoomData.MapData);
			this.updatePlayerPerception();
			ChatRoomMapViewScheduleMapUpdate();
			return ret;
		}

		/**
		 * Loads the data from {@link ChatRoomData.MapData} and replaces the current map data with the one
		 * stored in it.
		 * @param {ServerChatRoomMapData | undefined} data
		 * @returns {boolean} `true` if the global map data was parsed successfully.
		 * `false` if the global map data is invalid; no data is changed in this case.
		 */
		loadGlobalMapData(data) {
			if (!data) throw new Error("No map in current room");
			const map = MapData.load(data);
			if (map) {
				this.#_mapData = map;
				this.markCleanAll();
				this.updatePlayerPerception();
			}
			return !!map;
		}

		/** @type {MapManager.UndoGroup[]} */
		#undoStack = [];

		/**
		 * @param {() => void} cb
		 * @returns {MapManager.UndoGroup}
		 */
		#registerUndo(cb) {
			const group = {
				cbs: [cb],
				/**
				 * @param {() => void} icb
				 */
				add: function(icb) {
					this.cbs.push(icb);
				},
			};
			this.#undoStack.push(group);
			return group;
		}

		/**
		 * Undo the last edit done to the map
		 * @returns {boolean} Whether there was anything to undo
		 */
		undo() {
			const group = this.#undoStack.pop();
			if (!group) return false;
			for (const cb of group.cbs) {
				cb();
			}
			this.updateGlobalMapData();
			return true;
		}

		/**
		 * Clear and reset the entire map
		 */
		clear() {
			this.#_mapData = new MapData(ChatRoomMapViewWidth, ChatRoomMapViewHeight);
			this.#undoStack = [];
			this.markCleanAll();
		}
	}

	return {
		Map: new Manager(),

		/**
		 * This function should be called each time the external code updates {@link ChatRoomData.MapData}.
		 *
		 * This function decodes the updated map data and replaces
		 * the data stored in ${@link Manager.Map} with the decoded map.
		 * @returns {void}
		 */
		OnMapDataUpdated() {
			this.Map.loadGlobalMapData(ChatRoomData?.MapData);
		},

		/**
		 * Initializes the map with the current global data if needed.
		 * Must be called in {@link ChatRoomMapViewActivate}.
		 * @returns {void}
		 */
		OnViewActivate() {
			this.Map.clear();
			this.Map.loadGlobalMapData(ChatRoomData?.MapData);
		},
	};
})();

/** @deprecated Use {@link MapManager} instead */
var ChatRoomMapManager = MapManager;

/** @type {Partial<Record<ChatRoomMapObject["Type"], Partial<Omit<ChatRoomMapObject, "ID">>>>} */
const ChatRoomMapViewObjectDefaultValues = {
	"WallPath": { CanPlaceInWalls: true, CanPlaceOnWalls: true, CanPlaceOnFloors: false,
		BuildImageName: function (X, Y) {
			let name = this.Style;
			if (this.OccupiedStyle != null && Player.X == X && Player.Y == Y) name = this.OccupiedStyle ?? "Blank";
			if (MapManager.Map.getTile(X, Y+1)?.Type === "Wall") return name + "Inset";
			return name ?? "Blank";
		}
	},
	"WallDecoration": { CanPlaceOnWalls: true, CanPlaceOnFloors: false },
	"Banners": { CanPlaceOnWalls: true, CanPlaceOnFloors: false },
	"FloorObstacle": { CanBeTetherPoint: true, OnClick: (x, y) => ChatRoomMapViewOnClickTetherPoint(x, y) },
};


/** @deprecated Duplicate IDs are checked on load */
function ChatRoomMapViewCheckForDuplicateIds() {}

/**
 * Check that a doodad's {@link ChatRoomMapDoodad.DeprecatedID} chain resolves.
 * The chain may point at a doodad already stored in `registry`, or at one still waiting in `incoming`.
 * @template {ChatRoomMapDoodad} T
 * @param {T} doodad
 * @param {Map<number, T>} registry - Doodads of this kind already loaded
 * @param {readonly T[]} incoming - The list being loaded, so later entries can be referenced
 * @param {string} kind - "tile", "object" or "effect", used in error messages
 * @returns {boolean} - false when the chain cycles or points at an unknown id
 */
function MapDataCheckDeprecatedChain(doodad, registry, incoming, kind) {
	if (doodad.DeprecatedID === undefined) return true;

	const seen = new Set([doodad.ID]);
	let current = doodad;
	while (current.DeprecatedID !== undefined) {
		const deprecatedId = current.DeprecatedID;
		if (seen.has(deprecatedId)) {
			console.error("Deprecated map " + kind + " cycle at " + doodad.ID);
			return false;
		}
		seen.add(deprecatedId);
		const next = registry.get(deprecatedId) ?? incoming.find((candidate) => candidate.ID === deprecatedId);
		if (!next) {
			console.error("Unknown map " + kind + " " + deprecatedId);
			return false;
		}
		current = next;
	}
	return true;
}

/**
 * Load map tiles into the registry
 * @param {ChatRoomMapTile[]} tiles
 */
function MapDataLoadTiles(tiles) {
	for (const tile of tiles) {
		if (MapDataTiles.has(tile.ID)) {
			console.error("Duplicate map tile ID: " + tile.ID);
			continue;
		}
		if (!MapDataCheckDeprecatedChain(tile, MapDataTiles, tiles, "tile")) continue;
		MapDataTiles.set(tile.ID, { ...tile, DoodadType: "Tile", });
		MapDataTileTypes.add(tile.Type);
	}
}

/**
 * Load map objects into the registry
 * @param {ChatRoomMapObject[]} object
 */
function MapDataLoadObjects(object) {
	for (const obj of object) {
		if (MapDataObjects.has(obj.ID)) {
			console.error("Duplicate map object ID: " + obj.ID);
			continue;
		}
		if (!MapDataCheckDeprecatedChain(obj, MapDataObjects, object, "object")) continue;
		const defaults = ChatRoomMapViewObjectDefaultValues[obj.Type] ?? {};
		MapDataObjects.set(obj.ID, { ...defaults, ...obj, DoodadType: "Object", });
		MapDataObjectTypes.add(obj.Type);
	}
}

/**
 * Load map effects into the registry
 * @param {ChatRoomMapEffect[]} effects
 */
function MapDataLoadEffects(effects) {
	for (const effect of effects) {
		if (MapDataObjects.has(effect.ID)) {
			console.error("Duplicate map effect ID: " + effect.ID);
			continue;
		}
		if (!MapDataCheckDeprecatedChain(effect, MapDataEffects, effects, "effect")) continue;
		MapDataEffects.set(effect.ID, { ...effect, DoodadType: "Effect", });
		MapDataEffectTypes.add(effect.Type);
	}
}

/**
 * Load the base map data into the registry
 */
function MapDataLoad() {
	MapDataLoadTiles(AssetsMapDataTiles);
	MapDataLoadObjects(AssetsMapDataObjects);
	MapDataLoadEffects(AssetsMapDataEffects);
}

/**
 * Get the URL for a given asset.
 * @param {"Tile" | "Object"} doodadType
 * @param {string} [type]
 * @param {string} [style]
 */
function MapGetAssetUrl(doodadType, type, style) {
	/** @type {Record<Exclude<MapDataDoodadType, "Effect">, string>} */
	const mapping = {
		Tile: "Tiles",
		Object: "Objects",
	};
	const baseUrl = `Assets/Map/${mapping[doodadType]}/`;
	if (type && style) {
		return `${baseUrl}${type}/${style}.png`;
	}
	return baseUrl;
}

/**
 * Get the asset URL for a given doodad.
 * @param {ChatRoomMapDoodad} doodad
 * @returns {string | undefined}
 */
function MapGetDoodadAssetUrl(doodad) {
	/** @type {MapDataDoodadType} */
	let type;
	if (MapDoodadIsTile(doodad)) {
		type = "Tile";
	} else if (MapDoodadIsObject(doodad)) {
		type = "Object";
	} else {
		return undefined;
	}
	return type ? MapGetAssetUrl(type, doodad.Type, doodad.Style) : undefined;
}

/**
 * Typecheck for {@link ChatRoomMapEffect}
 * @param {ChatRoomMapDoodad} element - The element to check
 * @returns {element is ChatRoomMapEffect}
 */
function MapDoodadIsEffect(element) {
	return element.DoodadType === "Effect";
}

/**
 * Typecheck for {@link ChatRoomMapPhysicalElement}
 * @param {ChatRoomMapDoodad} element - The element to check
 * @returns {element is ChatRoomMapPhysicalElement}
 */
function MapDoodadIsPhysicalElement(element) {
	return "Style" in element;
}

/**
 * Typecheck for {@link ChatRoomMapObject}
 * @param {ChatRoomMapDoodad} element - The element to check
 * @returns {element is ChatRoomMapObject}
 */
function MapDoodadIsObject(element) {
	return element.DoodadType === "Object";
}

/**
 * Typecheck for {@link ChatRoomMapTile}
 * @param {ChatRoomMapDoodad} element - The element to check
 * @returns {element is ChatRoomMapTile}
 */
function MapDoodadIsTile(element) {
	return element.DoodadType === "Tile";
}

/**
 * Typecheck for deprecated doodads
 * @param {ChatRoomMapDoodad} element - The element to check
 * @returns {boolean}
 */
function MapDoodadIsDeprecated(element) {
	return element.DeprecatedID !== undefined;
}

/**
 * @param {number} tileId
 * @returns {ChatRoomMapTile}
 */
function MapDataGetTile(tileId) {
	const tile = MapDataTiles.get(tileId);
	if (!tile) throw new Error(`Unknown map tile ${tileId}`);
	return tile;
}

/**
 * Returns the object for an id.
 * @param {number} objectId
 * @returns {ChatRoomMapObject}
 */
function MapDataGetObject(objectId) {
	let object = MapDataObjects.get(objectId);
	if (!object) throw new Error(`Unknown map object ${objectId}`);
	while (object.DeprecatedID !== undefined) {
		const next = MapDataObjects.get(object.DeprecatedID);
		if (!next) throw new Error(`Unknown map object ${object.DeprecatedID}`);
		object = next;
	}
	return object;
}

/**
 * @param {number} effectId
 * @returns {ChatRoomMapEffect}
 */
function MapDataGetEffect(effectId) {
	const effect =  MapDataEffects.get(effectId);
	if (!effect) throw new Error(`Unknown map effect ${effectId}`);
	return effect;
}

/**
 * Gets coordinates in X and Y and returns the corresponding index number for the tile and object list
 * @param {number} x - X-coordinate to be translated
 * @param {number} y - Y-coordinate to be translated
 * @returns {number} - Index number for the tile and object lists
 */
function MapCoordinatesToIndex(x, y) {
	if (!CommonIsInteger(x) || !CommonIsInteger(y)) {
		throw new Error(`invalid map x,y value: ${String(x)}, ${String(y)}`);
	}
	return (y * ChatRoomMapViewWidth) + x;
}

/**
 * Gets a index number for the tile and object lists and returns the corresponding coordinates in X and Y
 * @param {number} index - Index number for the tile and object lists
 * @returns {ChatRoomMapPos} - Object containing the resulting x and y coordinates.
 */
function MapIndexToCoordinates(index) {
	if (!CommonIsInteger(index)) {
		throw new Error(`invalid map index value: ${String(index)}`);
	}
	return { X: index % ChatRoomMapViewWidth, Y: Math.floor(index / ChatRoomMapViewWidth) };
}

/**
 * Gets the distance between two map positions, in tiles; a diagonal step counts as one
 * @param {ChatRoomMapPos} pos1
 * @param {ChatRoomMapPos} pos2
 * @returns {number}
 */
function MapGetDistance(pos1, pos2) {
	return Math.max(Math.abs(pos1.X - pos2.X), Math.abs(pos1.Y - pos2.Y));
}

/**
 * Checks if a value is a position within the map
 * @param {unknown} pos
 * @returns {pos is ChatRoomMapPos}
 */
function MapIsPosition(pos) {
	return CommonIsObject(pos)
		&& "X" in pos && CommonIsInteger(pos.X, 0, ChatRoomMapViewWidth - 1)
		&& "Y" in pos && CommonIsInteger(pos.Y, 0, ChatRoomMapViewHeight - 1);
}

/**
 * Visit each tile in the square from (x, y) through (x + range, y + range), inclusive.
 * @param {number} x
 * @param {number} y
 * @param {number} range
 * @param {(x: number, y: number) => void} cb
 */
function MapForEachXYInRange(x, y, range, cb) {
	for (let radiusY = 0; radiusY <= range; radiusY++) {
		for (let radiusX = 0; radiusX <= range; radiusX++) {
			cb(x + radiusX, y + radiusY);
		}
	}
}

/**
 * Index-based form of {@link MapForEachXYInRange}.
 * @param {number} index
 * @param {number} range
 * @param {(index: number) => void} cb
 */
function MapForEachIndexInRange(index, range, cb) {
	for (let radiusY = 0; radiusY <= range; radiusY++) {
		const rowIndex = index + radiusY * ChatRoomMapViewWidth;
		for (let radiusX = 0; radiusX <= range; radiusX++) {
			cb(rowIndex + radiusX);
		}
	}
}

/**
 * @template {MapDataDoodadType} T
 * @param {T} type
 * @param {number} id
 * @returns {MapDataLookupTable[T] | null}
 */
function MapGetDoodad(type, id) {
	switch (type) {
		case "Tile": return /** @type {MapDataLookupTable[T] | null} */ (MapDataTiles.get(id) ?? null);
		case "Object": return /** @type {MapDataLookupTable[T] | null} */ (MapDataObjects.get(id) ?? null);
		case "Effect": return /** @type {MapDataLookupTable[T] | null} */ (MapDataEffects.get(id) ?? null);
	}
	return null;
}

/**
 * Pack an array of doodads into a flat array of doodad references.
 * @param {ChatRoomMapDoodad[]} doodads
 * @returns {MapDoodadRef[]}
 */
function MapPackDoodads(doodads) {
	return doodads.flatMap(doodad => {
		/** @type {MapDoodadRef | undefined} */
		const key = doodad.DoodadType ? `${doodad.DoodadType}:${doodad.ID}` : undefined;
		return key ? [key] : [];
	}).slice(0, ChatRoomMapViewEditorMaxRecentElements);
}

/**
 * Gets the effect / object / tile on the map
 * @template {MapDataDoodadType} T
 * @param {T} type - The type of the tile
 * @param {number} x - The X position of the tile
 * @param {number} y - The Y position of the tile
 * @returns {number | null}
 * @deprecated Use {@link MapManager.Map.getObjectId}/{@link MapManager.Map.getTileId}
 */
function MapGetCellId(type, x, y) {
	switch (type) {
		case "Tile": return MapManager.Map.getTileId(x, y);
		case "Object": return MapManager.Map.getObjectId(x, y);
		case "Effect": return null;
	}
}

/**
 * Gets the effect / object / tile on the map
 * @template {MapDataDoodadType} T
 * @param {T} type - The type of the tile
 * @param {number} x - The X position of the tile
 * @param {number} y - The Y position of the tile
 * @returns {MapDataLookupTable[T] | null}
 * @deprecated Use {@link MapManager.Map.getObject}/{@link MapManager.Map.getTile}
 */
function MapGetCell(type, x, y) {
	const id = MapGetCellId(type, x, y);
	if (id == null) return null;
	return MapGetDoodad(type, id);
}

/**
 * Sets the tile of the map
 * @param {number} id - The ID of the tile
 * @param {MapDataDoodadType} type - The type of the tile
 * @param {number} x - The X position of the tile
 * @param {number} y - The Y position of the tile
 * @param {boolean} refresh - Whether to refresh the map
 * @returns {boolean} - TRUE if the tile was set
 */
function MapSetCell(id, type, x, y, refresh=false) {
	if (type === "Tile") {
		return MapManager.Map.setTile(x, y, MapGetDoodad("Tile", id));
	} else if (type === "Object") {
		return MapManager.Map.setObject(x, y, MapGetDoodad("Object", id));
	} else if (type === "Effect") {
		const effect = MapGetDoodad("Effect", id);
		if (!effect) return false;
		const effects = MapManager.Map.getEffects(x, y);
		const existingEffectPos = effects.findIndex(e => e.ID === effect.ID);
		if (existingEffectPos !== -1) {
			effects.splice(existingEffectPos, 1, effect);
		} else {
			effects.push(effect);
		}
		MapManager.Map.setEffects(x, y, effects);
		return true;
	}
	return false;
}

/**
 * Clears the unique tiles
 * @param {number} id - The ID of the tile
 * @param {MapDataDoodadType} type - The type of the tile
 * @returns {boolean} - TRUE if the tile was cleared
 * @deprecated
 */
function MapClearUniqueCells(id, type) {
	return false;
}

/**
 * Checks if the cell can be set
 * @param {number} id - The ID of the doodad
 * @param {MapDataDoodadType} type - The type of the doodad
 * @param {number} x - The X position of the cell
 * @param {number} y - The Y position of the cell
 * @returns {boolean}
 * @deprecated Use {@link MapManager.Map.canSetTile}/{@link MapManager.Map.canSetObject}.
 */
function MapCanSetCell(id, type, x, y) {
	if (type === "Tile") {
		const tile = MapDataGetTile(id);
		if (!tile) return false;
		return MapManager.Map.canSetTile(x, y, tile);
	} else if (type === "Object") {
		const object = MapDataGetObject(id);
		if (!object) return false;
		return MapManager.Map.canSetObject(x, y, object);
	} else if (type === "Effect") {
		const effect = MapDataGetEffect(id);
		if (!effect) return false;
		return true;
	}
	return false;
}

/**
 * Checks if the cell is still valid
 * @param {number} id - The ID of the doodad
 * @param {MapDataDoodadType} type - The type of the doodad
 * @param {number} x - The X position of the cell
 * @param {number} y - The Y position of the cell
 * @returns {boolean}
 * @deprecated Use {@link MapManager.Map.canSetTile}/{@link MapManager.Map.canSetObject}.
 */
function MapIsCellValid(id, type, x, y) {
	if (!MapCanSetCell(id, type, x, y)) return false;
	return true;
}

/**
 * Sets the next update flag for the room if it's not already set, the delay is 5 seconds
 * @deprecated No replacement
 * @returns {void} - Nothing
 */
function MapValidateCells() {}
