/**
 * Architecture Cadence - Cache Mapping & Telemetry Visualizer
 * Tag, Index, and Offset address decomposition with Set-Associative block inspector
 * and real-time Cache Hit / Miss / Eviction telemetry.
 */

import React, { useState } from 'react';
import { CacheState, CacheConfig, CacheAssociativity } from '../types/architecture';
import { decodeAddress, accessCache, initCache } from '../simulator/cache';
import { Layers, CheckCircle2, XCircle, RefreshCw, Crosshair } from 'lucide-react';

interface CacheVisualizerProps {
  cache: CacheState;
  onUpdateCache: (newCache: CacheState) => void;
  currentCycle: number;
}

export const CacheVisualizer: React.FC<CacheVisualizerProps> = ({
  cache,
  onUpdateCache,
  currentCycle,
}) => {
  const [probeAddressStr, setProbeAddressStr] = useState<string>('0x1004');
  const [probeMode, setProbeMode] = useState<'read' | 'write'>('read');

  // Convert probe string to number
  const parsedProbeAddr = React.useMemo(() => {
    if (probeAddressStr.startsWith('0x') || probeAddressStr.startsWith('0X')) {
      return parseInt(probeAddressStr, 16) || 0;
    }
    return parseInt(probeAddressStr, 10) || 0;
  }, [probeAddressStr]);

  const probeBreakdown = decodeAddress(parsedProbeAddr, cache);

  const hitRate =
    cache.totalAccesses > 0
      ? ((cache.hits / cache.totalAccesses) * 100).toFixed(1)
      : '0.0';

  const handleConfigChange = (associativity: CacheAssociativity) => {
    const newConfig: CacheConfig = {
      ...cache.config,
      associativity,
    };
    onUpdateCache(initCache(newConfig));
  };

  const handleExecuteProbe = () => {
    const isWrite = probeMode === 'write';
    const res = accessCache(cache, parsedProbeAddr, isWrite, currentCycle || 1);
    onUpdateCache(res.cache);
  };

  const handleResetCache = () => {
    onUpdateCache(initCache(cache.config));
  };

  return (
    <div className="space-y-4">
      {/* Configuration & High-Level Telemetry Card */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#e2e8f0]">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#0284c7]" />
            <div>
              <h2 className="text-sm font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
                L1 Data Cache Hierarchy & Tag Mapping
              </h2>
              <p className="text-xs text-[#64748b]">
                {cache.config.totalBytes} Bytes Total | {cache.config.blockSizeBytes} Bytes / Block (4 Words) |{' '}
                {cache.config.associativity === 1
                  ? 'Direct Mapped (1-Way)'
                  : `${cache.config.associativity}-Way Set-Associative`}
              </p>
            </div>
          </div>

          {/* Associativity Selector */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#64748b] font-medium text-[11px]">Associativity:</span>
            <div className="flex rounded border border-[#cbd5e1] overflow-hidden">
              <button
                onClick={() => handleConfigChange(1)}
                className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  cache.config.associativity === 1
                    ? 'bg-[#0f2a4a] text-white'
                    : 'bg-white text-[#475569] hover:bg-[#f1f5f9]'
                }`}
              >
                1-Way (Direct)
              </button>
              <button
                onClick={() => handleConfigChange(2)}
                className={`px-2.5 py-1 text-[11px] font-semibold border-l border-[#cbd5e1] transition-colors ${
                  cache.config.associativity === 2
                    ? 'bg-[#0f2a4a] text-white'
                    : 'bg-white text-[#475569] hover:bg-[#f1f5f9]'
                }`}
              >
                2-Way Set
              </button>
              <button
                onClick={() => handleConfigChange(4)}
                className={`px-2.5 py-1 text-[11px] font-semibold border-l border-[#cbd5e1] transition-colors ${
                  cache.config.associativity === 4
                    ? 'bg-[#0f2a4a] text-white'
                    : 'bg-white text-[#475569] hover:bg-[#f1f5f9]'
                }`}
              >
                4-Way Set
              </button>
            </div>

            <button
              onClick={handleResetCache}
              className="flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f2a4a] border border-[#cbd5e1] transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Flush Cache</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className="bg-[#eff4ff] border border-[#dce9ff] rounded p-2.5">
            <div className="text-[10px] font-semibold uppercase text-[#64748b] tracking-wider">
              Cache Hit Rate
            </div>
            <div className="text-xl font-bold font-mono text-[#0284c7] tabular-nums mt-0.5">
              {hitRate}%
            </div>
            <div className="text-[10px] text-[#475569] mt-0.5">
              {cache.hits} Hits / {cache.totalAccesses} Total
            </div>
          </div>

          <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded p-2.5">
            <div className="text-[10px] font-semibold uppercase text-[#059669] tracking-wider flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Cache Hits</span>
            </div>
            <div className="text-xl font-bold font-mono text-[#065f46] tabular-nums mt-0.5">
              {cache.hits}
            </div>
            <div className="text-[10px] text-[#047857] mt-0.5">Fast 0-cycle RAM stall</div>
          </div>

          <div className="bg-[#fef2f2] border border-[#fecaca] rounded p-2.5">
            <div className="text-[10px] font-semibold uppercase text-[#dc2626] tracking-wider flex items-center space-x-1">
              <XCircle className="w-3 h-3" />
              <span>Cache Misses</span>
            </div>
            <div className="text-xl font-bold font-mono text-[#991b1b] tabular-nums mt-0.5">
              {cache.misses}
            </div>
            <div className="text-[10px] text-[#b91c1c] mt-0.5">Cold / Conflict penalties</div>
          </div>

          <div className="bg-[#fffbeb] border border-[#fde68a] rounded p-2.5">
            <div className="text-[10px] font-semibold uppercase text-[#d97706] tracking-wider">
              LRU Evictions
            </div>
            <div className="text-xl font-bold font-mono text-[#b45309] tabular-nums mt-0.5">
              {cache.evictions}
            </div>
            <div className="text-[10px] text-[#92400e] mt-0.5">Replaced line count</div>
          </div>
        </div>
      </div>

      {/* Address Decomposition & Probe Inspector */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <Crosshair className="w-4 h-4 text-[#06b6d4]" />
            <h3 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
              32-Bit Address Field Decomposition (Tag / Index / Offset)
            </h3>
          </div>

          {/* Interactive Manual Probe Form */}
          <div className="flex items-center space-x-2 text-xs">
            <input
              type="text"
              value={probeAddressStr}
              onChange={(e) => setProbeAddressStr(e.target.value)}
              placeholder="0x1000"
              className="w-24 text-xs font-mono border border-[#cbd5e1] rounded px-2 py-1 outline-none focus:border-[#0284c7]"
              title="Enter Hex Memory Address"
            />
            <select
              value={probeMode}
              onChange={(e) => setProbeMode(e.target.value as 'read' | 'write')}
              className="text-xs font-mono border border-[#cbd5e1] rounded px-1.5 py-1 bg-white outline-none"
            >
              <option value="read">READ (lw)</option>
              <option value="write">WRITE (sw)</option>
            </select>
            <button
              onClick={handleExecuteProbe}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-[#0f2a4a] hover:bg-[#0284c7] text-white transition-colors"
            >
              Probe Cache
            </button>
          </div>
        </div>

        {/* Visual Bit Breakdown Strip */}
        <div className="border border-[#cbd5e1] rounded p-3 bg-[#f8fafc]">
          <div className="text-xs font-mono font-bold text-[#0f2a4a] mb-2 flex items-center justify-between">
            <span>Address: {probeBreakdown.hex}</span>
            <span className="text-[10px] text-[#64748b]">Total 32 Bits</span>
          </div>

          {/* 32-bit partition blocks */}
          <div className="grid grid-cols-12 gap-1 text-center font-mono text-xs">
            {/* Tag Partition */}
            <div className="col-span-8 bg-[#cffafe] border border-[#06b6d4] text-[#0891b2] p-2 rounded">
              <div className="text-[10px] uppercase font-bold tracking-wider">
                TAG FIELD ({cache.tagBits} bits)
              </div>
              <div className="font-bold text-sm mt-0.5">{probeBreakdown.tagHex}</div>
              <div className="text-[9px] text-[#0e7490] truncate mt-0.5" title={probeBreakdown.tagBinary}>
                {probeBreakdown.tagBinary}
              </div>
            </div>

            {/* Index Partition */}
            <div className="col-span-2 bg-[#dbeafe] border border-[#0284c7] text-[#1e40af] p-2 rounded">
              <div className="text-[10px] uppercase font-bold tracking-wider">
                SET INDEX ({cache.indexBits} bits)
              </div>
              <div className="font-bold text-sm mt-0.5">{probeBreakdown.indexHex}</div>
              <div className="text-[9px] text-[#1d4ed8] mt-0.5">
                Set #{probeBreakdown.setIndex}
              </div>
            </div>

            {/* Offset Partition */}
            <div className="col-span-2 bg-[#fef3c7] border border-[#d97706] text-[#b45309] p-2 rounded">
              <div className="text-[10px] uppercase font-bold tracking-wider">
                OFFSET ({cache.offsetBits} bits)
              </div>
              <div className="font-bold text-sm mt-0.5">{probeBreakdown.offsetHex}</div>
              <div className="text-[9px] text-[#92400e] mt-0.5">
                Byte #{probeBreakdown.offset}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Set-Associative Cache Lines Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
            Cache Sets & Blocks Matrix ({cache.numSets} Sets x {cache.config.associativity} Ways)
          </h3>
          <div className="text-[11px] text-[#64748b]">
            Direct Visual Verification of Valid, Dirty, Tag & Data
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#eff4ff] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#0f2a4a]">
                <th className="py-2 px-3 w-20 font-mono text-center">Set Index</th>
                {Array.from({ length: cache.config.associativity }).map((_, wayIdx) => (
                  <th key={wayIdx} className="py-2 px-3 border-l border-[#e2e8f0] font-mono">
                    Way {wayIdx} [Valid | Dirty | Tag | Block Data]
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] font-mono text-[11px]">
              {cache.sets.map((set) => {
                const isTargetSet =
                  cache.recentAccess && cache.recentAccess.setIndex === set.index;

                return (
                  <tr
                    key={set.index}
                    className={`hover:bg-[#f8fafc] transition-colors ${
                      isTargetSet ? 'bg-[#ecfeff]/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-[#0f2a4a]">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#475569]">
                        Set {set.index}
                      </span>
                    </td>

                    {set.lines.map((line, wayIdx) => {
                      const isRecentLine =
                        isTargetSet && cache.recentAccess?.wayIndex === wayIdx;
                      const isHitLine = isRecentLine && cache.recentAccess?.isHit;
                      const isMissLine = isRecentLine && !cache.recentAccess?.isHit;

                      return (
                        <td
                          key={wayIdx}
                          className={`py-2 px-3 border-l border-[#f1f5f9] transition-all ${
                            isHitLine
                              ? 'bg-[#ecfdf5] border-l-2 border-l-[#059669]'
                              : isMissLine
                              ? 'bg-[#fef2f2] border-l-2 border-l-[#dc2626]'
                              : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {/* Valid bit */}
                            <span
                              className={`px-1 py-0.2 rounded text-[10px] font-bold ${
                                line.valid
                                  ? 'bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]'
                                  : 'bg-[#f1f5f9] text-[#94a3b8] border border-[#e2e8f0]'
                              }`}
                            >
                              V:{line.valid ? '1' : '0'}
                            </span>

                            {/* Dirty bit */}
                            <span
                              className={`px-1 py-0.2 rounded text-[10px] font-bold ${
                                line.dirty
                                  ? 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]'
                                  : 'bg-[#f1f5f9] text-[#94a3b8] border border-[#e2e8f0]'
                              }`}
                            >
                              D:{line.dirty ? '1' : '0'}
                            </span>

                            {/* Tag */}
                            <span className="font-semibold text-[#0f2a4a]">
                              Tag: {line.valid ? `0x${line.tag.toString(16).toUpperCase()}` : 'Empty'}
                            </span>

                            {isHitLine && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#059669] text-white rounded">
                                HIT
                              </span>
                            )}
                            {isMissLine && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#dc2626] text-white rounded">
                                MISS / FILL
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-[#64748b] mt-1">
                            Block [4 Words]: [{line.data.join(', ')}] | Last Cycle: {line.lastUsedCycle}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
