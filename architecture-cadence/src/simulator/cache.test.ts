import test from 'node:test';
import assert from 'node:assert/strict';
import { initCache, accessCache, decodeAddress } from './cache';

test('cache initializes with correct tag, index, and offset bit partition', () => {
  // 256 bytes total, 16 bytes per block = 16 blocks.
  // Associativity = 2 => 8 sets.
  // Offset bits = log2(16) = 4 bits
  // Index bits = log2(8) = 3 bits
  // Tag bits = 32 - 3 - 4 = 25 bits
  const cache = initCache({
    totalBytes: 256,
    blockSizeBytes: 16,
    associativity: 2,
  });

  assert.equal(cache.numSets, 8);
  assert.equal(cache.offsetBits, 4);
  assert.equal(cache.indexBits, 3);
  assert.equal(cache.tagBits, 25);
  assert.equal(cache.sets.length, 8);
  assert.equal(cache.sets[0].lines.length, 2);
});

test('decodeAddress parses address into correct fields', () => {
  const cache = initCache({
    totalBytes: 256,
    blockSizeBytes: 16,
    associativity: 2,
  });

  // Address 0x1024 -> binary: 0001 0000 0010 0100
  // Offset (lowest 4 bits): 0100 = 4
  // Index (next 3 bits): bits 4,5,6 -> 0x1024 >> 4 = 0x102 = 0b100000010 & 0b111 = 2
  const decomp = decodeAddress(0x1024, cache);
  assert.equal(decomp.offset, 4);
  assert.equal(decomp.setIndex, 2);
});

test('cache access records cold miss then hit on spatial locality', () => {
  const cache = initCache({
    totalBytes: 256,
    blockSizeBytes: 16,
    associativity: 2,
  });

  // Access 1: address 0x1000 (cold miss)
  const step1 = accessCache(cache, 0x1000, false, 1);
  assert.equal(step1.event.isHit, false);
  assert.equal(step1.cache.misses, 1);
  assert.equal(step1.cache.hits, 0);

  // Access 2: address 0x1004 (same 16-byte block -> hit!)
  const step2 = accessCache(step1.cache, 0x1004, false, 2);
  assert.equal(step2.event.isHit, true);
  assert.equal(step2.cache.hits, 1);
  assert.equal(step2.cache.misses, 1);
});
