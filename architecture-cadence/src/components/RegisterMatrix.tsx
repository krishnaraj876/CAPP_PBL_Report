/**
 * Architecture Cadence - Hardware Register Bank (R0 - R31)
 * 8x4 matrix with IBM Plex Sans labels, 32-bit hex values, and 300ms cyan flash on update.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ABI_REGISTER_MAP, REGISTER_DESCRIPTIONS } from '../simulator/assembler';
import { Database, Edit3, Check, X } from 'lucide-react';

interface RegisterMatrixProps {
  registers: number[];
  onUpdateRegister: (index: number, value: number) => void;
}

export const RegisterMatrix: React.FC<RegisterMatrixProps> = ({
  registers,
  onUpdateRegister,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValueStr, setEditValueStr] = useState<string>('');
  const [flashingIndices, setFlashingIndices] = useState<Set<number>>(new Set());
  const prevRegistersRef = useRef<number[]>(registers);

  // Invert ABI map to get friendly name for each register index
  const indexToAbi = React.useMemo(() => {
    const map: Record<number, string> = {};
    for (const [abi, idx] of Object.entries(ABI_REGISTER_MAP)) {
      if (!map[idx]) {
        map[idx] = abi;
      }
    }
    return map;
  }, []);

  // Detect which registers updated to trigger 300ms cyan flash
  useEffect(() => {
    const changed = new Set<number>();
    const prev = prevRegistersRef.current;
    for (let i = 0; i < 32; i++) {
      if (prev[i] !== registers[i] && i !== 0) {
        changed.add(i);
      }
    }
    prevRegistersRef.current = registers;

    if (changed.size > 0) {
      setFlashingIndices(changed);
      const timer = setTimeout(() => {
        setFlashingIndices(new Set());
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [registers]);

  const handleStartEdit = (idx: number) => {
    if (idx === 0) return; // x0 is hardwired to 0
    setEditingIndex(idx);
    setEditValueStr(registers[idx].toString());
  };

  const handleSaveEdit = (idx: number) => {
    let val = 0;
    if (editValueStr.startsWith('0x') || editValueStr.startsWith('0X')) {
      val = parseInt(editValueStr, 16);
    } else {
      val = parseInt(editValueStr, 10);
    }
    if (!isNaN(val)) {
      onUpdateRegister(idx, val | 0);
    }
    setEditingIndex(null);
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
      {/* Header bar with integrated bottom border */}
      <div className="px-4 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-[#0284c7]" />
          <h2 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
            Architectural Register File (32 x 32-bit Integer Registers)
          </h2>
        </div>
        <div className="text-[11px] text-[#64748b]">
          x0 hardwired 0x0 | Click register to edit value
        </div>
      </div>

      {/* 8x4 Hardware Matrix */}
      <div className="p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {registers.map((val, idx) => {
            const abi = indexToAbi[idx] || `x${idx}`;
            const isFlashing = flashingIndices.has(idx);
            const isEditing = editingIndex === idx;
            const desc = REGISTER_DESCRIPTIONS[idx] || '';

            return (
              <div
                key={idx}
                onClick={() => !isEditing && handleStartEdit(idx)}
                className={`relative rounded border p-2 text-left transition-all group ${
                  idx === 0
                    ? 'bg-[#f8fafc] border-[#e2e8f0] opacity-80 cursor-default'
                    : 'cursor-pointer hover:border-[#0284c7] hover:shadow-xs'
                } ${
                  isFlashing
                    ? 'flash-updated'
                    : isEditing
                    ? 'border-[#0284c7] ring-1 ring-[#0284c7] bg-white'
                    : 'border-[#e2e8f0] bg-white'
                }`}
                title={`Register x${idx} (${abi}): ${desc}`}
              >
                {/* Register Label: label-sm uppercase (#64748B) */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline space-x-1">
                    <span className="font-heading font-bold text-xs text-[#0f2a4a]">
                      x{idx}
                    </span>
                    <span className="font-mono text-[10px] text-[#64748b]">
                      ({abi})
                    </span>
                  </div>
                  {idx !== 0 && !isEditing && (
                    <Edit3 className="w-2.5 h-2.5 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

                {/* Register Hex & Decimal Value */}
                {isEditing ? (
                  <div className="flex items-center space-x-1 mt-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editValueStr}
                      onChange={(e) => setEditValueStr(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(idx);
                        if (e.key === 'Escape') setEditingIndex(null);
                      }}
                      autoFocus
                      className="w-full text-xs font-mono border border-[#0284c7] rounded px-1 py-0.5 outline-none"
                    />
                    <button
                      onClick={() => handleSaveEdit(idx)}
                      className="text-[#059669] hover:bg-[#ecfdf5] p-0.5 rounded"
                      aria-label="Save register value"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="text-[#dc2626] hover:bg-[#fef2f2] p-0.5 rounded"
                      aria-label="Cancel editing"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* 32-bit Hex: code-data (#0F2A4A) */}
                    <div className="font-mono text-[11px] font-bold text-[#0f2a4a] tabular-nums tracking-tight">
                      0x{(val >>> 0).toString(16).padStart(8, '0').toUpperCase()}
                    </div>
                    {/* Decimal signed representation */}
                    <div className="font-mono text-[10px] text-[#64748b] tabular-nums mt-0.5">
                      dec: {val}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
