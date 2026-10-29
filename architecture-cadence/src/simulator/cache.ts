/**
 * Architecture Cadence - Cache Hierarchy Simulator
 * Implements Direct-Mapped, 2-Way, and 4-Way Set-Associative L1 Data Cache
 * with Tag/Index/Offset decomposition and LRU eviction tracking.
 */

import { CacheConfig, CacheSet, CacheState, CacheAccessEvent } from '../types/architecture';

export function createDefaultCacheConfig(): CacheConfig {
  return {
    totalBytes: 256, // 256 bytes total
    blockSizeBytes: 16, // 16 bytes per line (4 x 32-bit words)
    associativity: 2, // 2-way set associative
  };
}

export function initCache(config: CacheConfig): CacheState {
  const blockSize = config.blockSizeBytes;
  const numLines = Math.floor(config.totalBytes / blockSize);
  const numSets = Math.max(1, Math.floor(numLines / config.associativity));

  const offsetBits = Math.round(Math.log2(blockSize));
  const indexBits = numSets > 1 ? Math.round(Math.log2(numSets)) : 0;
  const tagBits = 32 - indexBits - offsetBits;

  const sets: CacheSet[] = [];
  for (let i = 0; i < numSets; i++) {
    const lines = [];
    for (let w = 0; w < config.associativity; w++) {
      lines.push({
        valid: false,
        dirty: false,
        tag: 0,
        data: [0, 0, 0, 0],
        lastUsedCycle: 0,
      });
    }
    sets.push({ index: i, lines });
  }

  return {
    config,
    sets,
    numSets,
    tagBits,
    indexBits,
    offsetBits,
    hits: 0,
    misses: 0,
    evictions: 0,
    totalAccesses: 0,
  };
}

export interface AddressBreakdown {
  address: number;
  hex: string;
  binary: string;
  tag: number;
  tagHex: string;
  tagBinary: string;
  setIndex: number;
  indexHex: string;
  indexBinary: string;
  offset: number;
  offsetHex: string;
  offsetBinary: string;
}

export function decodeAddress(address: number, cache: CacheState): AddressBreakdown {
  const offsetMask = (1 << cache.offsetBits) - 1;
  const offset = address & offsetMask;

  const indexMask = (1 << cache.indexBits) - 1;
  const setIndex = cache.indexBits > 0 ? (address >>> cache.offsetBits) & indexMask : 0;

  const tagShift = cache.offsetBits + cache.indexBits;
  const tag = address >>> tagShift;

  const addrBin = (address >>> 0).toString(2).padStart(32, '0');
  const tagBin = (tag >>> 0).toString(2).padStart(cache.tagBits, '0');
  const indexBin = cache.indexBits > 0 ? (setIndex >>> 0).toString(2).padStart(cache.indexBits, '0') : '';
  const offsetBin = (offset >>> 0).toString(2).padStart(cache.offsetBits, '0');

  return {
    address,
    hex: '0x' + (address >>> 0).toString(16).padStart(8, '0').toUpperCase(),
    binary: addrBin,
    tag,
    tagHex: '0x' + (tag >>> 0).toString(16).toUpperCase(),
    tagBinary: tagBin,
    setIndex,
    indexHex: '0x' + (setIndex >>> 0).toString(16).toUpperCase(),
    indexBinary: indexBin,
    offset,
    offsetHex: '0x' + (offset >>> 0).toString(16).toUpperCase(),
    offsetBinary: offsetBin,
  };
}

export function accessCache(
  cache: CacheState,
  address: number,
  isWrite: boolean,
  cycle: number
): { cache: CacheState; event: CacheAccessEvent } {
  const decomp = decodeAddress(address, cache);
  const { tag, setIndex, offset } = decomp;

  const newSets = cache.sets.map((set) => ({
    ...set,
    lines: set.lines.map((l) => ({ ...l, data: [...l.data] })),
  }));

  const targetSet = newSets[setIndex] || newSets[0];
  let hit = false;
  let wayIndex = -1;
  let evictedTag: number | undefined;

  // Check for hit
  for (let w = 0; w < targetSet.lines.length; w++) {
    const line = targetSet.lines[w];
    if (line.valid && line.tag === tag) {
      hit = true;
      wayIndex = w;
      line.lastUsedCycle = cycle;
      if (isWrite) {
        line.dirty = true;
      }
      break;
    }
  }

  let newHits = cache.hits;
  let newMisses = cache.misses;
  let newEvictions = cache.evictions;

  if (hit) {
    newHits++;
  } else {
    newMisses++;
    // Find invalid line or LRU replacement line
    let emptyWay = -1;
    let lruWay = 0;
    let oldestCycle = Infinity;

    for (let w = 0; w < targetSet.lines.length; w++) {
      const line = targetSet.lines[w];
      if (!line.valid) {
        emptyWay = w;
        break;
      }
      if (line.lastUsedCycle < oldestCycle) {
        oldestCycle = line.lastUsedCycle;
        lruWay = w;
      }
    }

    if (emptyWay !== -1) {
      wayIndex = emptyWay;
      targetSet.lines[wayIndex] = {
        valid: true,
        dirty: isWrite,
        tag,
        data: [0, 0, 0, 0],
        lastUsedCycle: cycle,
      };
    } else {
      // LRU Eviction
      wayIndex = lruWay;
      evictedTag = targetSet.lines[wayIndex].tag;
      newEvictions++;
      targetSet.lines[wayIndex] = {
        valid: true,
        dirty: isWrite,
        tag,
        data: [0, 0, 0, 0],
        lastUsedCycle: cycle,
      };
    }
  }

  const event: CacheAccessEvent = {
    cycle,
    address,
    tag,
    setIndex,
    offset,
    isHit: hit,
    isWrite,
    evictedTag,
    wayIndex,
  };

  const updatedCache: CacheState = {
    ...cache,
    sets: newSets,
    hits: newHits,
    misses: newMisses,
    evictions: newEvictions,
    totalAccesses: cache.totalAccesses + 1,
    recentAccess: event,
  };

  return { cache: updatedCache, event };
}

export function resetCache(cache: CacheState): CacheState {
  return initCache(cache.config);
}
