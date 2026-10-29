/**
 * Architecture Cadence - Data Memory & Bus Inspector
 * High-density planar memory table with word and byte address alignments.
 */

import React, { useState } from 'react';
import { HardDrive, Search } from 'lucide-react';

interface MemoryInspectorProps {
  memory: Map<number, number>;
  onWriteMemory: (address: number, value: number) => void;
  lastAccessedAddress?: number;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({
  memory,
  onWriteMemory,
  lastAccessedAddress,
}) => {
  const [searchAddrStr, setSearchAddrStr] = useState<string>('0x0000');
  const [filterMode, setFilterMode] = useState<'standard' | 'populated'>('standard');

  // Generate memory addresses to view (standard slice: 0x0000 to 0x0060, plus populated addresses)
  const memoryRows = React.useMemo(() => {
    const addresses = new Set<number>();

    // Standard addresses
    for (let addr = 0x0000; addr <= 0x0040; addr += 4) {
      addresses.add(addr);
    }
    // Also include common data addresses like 0x1000 - 0x1020
    for (let addr = 0x1000; addr <= 0x1020; addr += 4) {
      addresses.add(addr);
    }
    // And all currently stored addresses
    for (const addr of memory.keys()) {
      addresses.add(addr & ~3); // word align
    }

    const sorted = Array.from(addresses).sort((a, b) => a - b);
    if (filterMode === 'populated') {
      return sorted.filter((addr) => (memory.get(addr) ?? 0) !== 0);
    }
    return sorted;
  }, [memory, filterMode]);

  const handleEditCell = (addr: number) => {
    const current = memory.get(addr) ?? 0;
    const input = prompt(
      `Enter new 32-bit integer or hex value for memory address 0x${addr
        .toString(16)
        .toUpperCase()}:`,
      current.toString()
    );
    if (input !== null) {
      let val = 0;
      if (input.startsWith('0x') || input.startsWith('0X')) {
        val = parseInt(input, 16);
      } else {
        val = parseInt(input, 10);
      }
      if (!isNaN(val)) {
        onWriteMemory(addr, val | 0);
      }
    }
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-[#0284c7]" />
          <h2 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
            Data Segment Memory Map (RAM / 32-bit Word Aligned)
          </h2>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1 bg-white border border-[#cbd5e1] rounded px-2 py-1">
            <Search className="w-3 h-3 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search Addr (e.g. 0x1000)"
              value={searchAddrStr}
              onChange={(e) => setSearchAddrStr(e.target.value)}
              className="w-28 text-xs font-mono outline-none text-[#0f2a4a]"
            />
          </div>

          <div className="flex rounded border border-[#cbd5e1] overflow-hidden">
            <button
              onClick={() => setFilterMode('standard')}
              className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
                filterMode === 'standard'
                  ? 'bg-[#0f2a4a] text-white'
                  : 'bg-white text-[#475569] hover:bg-[#f1f5f9]'
              }`}
            >
              All Grid
            </button>
            <button
              onClick={() => setFilterMode('populated')}
              className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
                filterMode === 'populated'
                  ? 'bg-[#0f2a4a] text-white'
                  : 'bg-white text-[#475569] hover:bg-[#f1f5f9]'
              }`}
            >
              Non-Zero Only
            </button>
          </div>
        </div>
      </div>

      {/* Memory Table */}
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-[#eff4ff] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#0f2a4a] z-10">
            <tr>
              <th className="py-1.5 px-3 w-28 font-mono">Word Address</th>
              <th className="py-1.5 px-3 border-l border-[#e2e8f0] w-32 font-mono">Hex (32-bit)</th>
              <th className="py-1.5 px-3 border-l border-[#e2e8f0] w-28 font-mono">Signed Dec</th>
              <th className="py-1.5 px-3 border-l border-[#e2e8f0] font-mono">Bytes [B0, B1, B2, B3]</th>
              <th className="py-1.5 px-3 border-l border-[#e2e8f0] w-24 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9] font-mono text-[11px]">
            {memoryRows.map((addr) => {
              const val = memory.get(addr) ?? 0;
              const isRecent = lastAccessedAddress === addr;

              // Break 32-bit word into 4 bytes (little endian)
              const b0 = val & 0xff;
              const b1 = (val >> 8) & 0xff;
              const b2 = (val >> 16) & 0xff;
              const b3 = (val >> 24) & 0xff;

              return (
                <tr
                  key={addr}
                  className={`hover:bg-[#f8fafc] transition-colors ${
                    isRecent ? 'bg-[#ecfeff]' : ''
                  }`}
                >
                  <td className="py-1.5 px-3 font-bold text-[#0f2a4a]">
                    0x{(addr >>> 0).toString(16).padStart(8, '0').toUpperCase()}
                  </td>
                  <td className="py-1.5 px-3 border-l border-[#f1f5f9] text-[#0284c7] font-bold">
                    0x{(val >>> 0).toString(16).padStart(8, '0').toUpperCase()}
                  </td>
                  <td className="py-1.5 px-3 border-l border-[#f1f5f9] text-[#475569]">
                    {val}
                  </td>
                  <td className="py-1.5 px-3 border-l border-[#f1f5f9] text-[#64748b]">
                    [{b0.toString(16).padStart(2, '0')}, {b1.toString(16).padStart(2, '0')},{' '}
                    {b2.toString(16).padStart(2, '0')}, {b3.toString(16).padStart(2, '0')}]
                  </td>
                  <td className="py-1.5 px-3 border-l border-[#f1f5f9] text-right">
                    <button
                      onClick={() => handleEditCell(addr)}
                      className="px-2 py-0.5 text-[10px] text-[#0284c7] hover:text-white hover:bg-[#0284c7] border border-[#cbd5e1] rounded transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
