/**
 * Architecture Cadence - Microarchitecture & Pipeline Documentation Modal
 * Reference guide for computer systems coursework and lab inspections.
 */

import React from 'react';
import { X, BookOpen, Layers, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ArchitectureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGuideModal: React.FC<ArchitectureGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f2a4a]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border border-[#cbd5e1] max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header Bar with 1px #0F2A4A Technical Frame */}
        <div className="px-5 py-3.5 bg-[#0f2a4a] text-white flex items-center justify-between border-b border-[#0a1c32]">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-[#06b6d4]" />
            <div>
              <h2 className="text-sm font-bold tracking-tight uppercase font-heading">
                Architecture Cadence Reference Manual
              </h2>
              <p className="text-[11px] text-[#a0b5d0]">
                5-Stage Classical RISC-V Pipeline &amp; Cache Microarchitectural Theory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#a0b5d0] hover:text-white p-1 rounded hover:bg-[#1a385c] transition-colors"
            aria-label="Close Reference Manual"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#0f2a4a] leading-relaxed">
          {/* Section 1: The 5-Stage Pipeline */}
          <div>
            <div className="flex items-center space-x-2 text-[#0284c7] font-heading font-bold text-sm mb-2">
              <Layers className="w-4 h-4" />
              <h3 className="uppercase tracking-wider">1. The 5-Stage RISC-V Pipeline</h3>
            </div>
            <p className="text-[#475569] mb-3">
              The classical 5-stage pipeline divides instruction execution into five discrete hardware stages clocked synchronously:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded border border-[#e2e8f0] bg-[#f8fafc]">
                <span className="font-bold text-[#0284c7] block">IF: Fetch</span>
                <span className="text-[10px] text-[#64748b] block mt-1">Read instruction from memory at PC. Compute PC + 4.</span>
              </div>
              <div className="p-2.5 rounded border border-[#e2e8f0] bg-[#f8fafc]">
                <span className="font-bold text-[#06b6d4] block">ID: Decode</span>
                <span className="text-[10px] text-[#64748b] block mt-1">Decode opcode, read source registers rs1/rs2, sign-extend imm.</span>
              </div>
              <div className="p-2.5 rounded border border-[#e2e8f0] bg-[#f8fafc]">
                <span className="font-bold text-[#0f2a4a] block">EX: Execute</span>
                <span className="text-[10px] text-[#64748b] block mt-1">ALU computes operation, branch target &amp; condition evaluated.</span>
              </div>
              <div className="p-2.5 rounded border border-[#e2e8f0] bg-[#f8fafc]">
                <span className="font-bold text-[#006398] block">MEM: Memory</span>
                <span className="text-[10px] text-[#64748b] block mt-1">Access L1 Data Cache for load (lw) or store (sw).</span>
              </div>
              <div className="p-2.5 rounded border border-[#e2e8f0] bg-[#f8fafc]">
                <span className="font-bold text-[#059669] block">WB: Writeback</span>
                <span className="text-[10px] text-[#64748b] block mt-1">Commit result back into register file at destination rd.</span>
              </div>
            </div>
          </div>

          {/* Section 2: Data Hazards & Hardware Forwarding */}
          <div>
            <div className="flex items-center space-x-2 text-[#0891b2] font-heading font-bold text-sm mb-2">
              <Zap className="w-4 h-4" />
              <h3 className="uppercase tracking-wider">2. RAW Hazards &amp; Forwarding Equations</h3>
            </div>
            <p className="text-[#475569] mb-2">
              A Read-After-Write (RAW) data hazard happens when an instruction consumes a register that has not yet been committed to the register file by an earlier instruction. The Forwarding Unit eliminates stalls by bypassing results directly:
            </p>
            <div className="bg-[#eff4ff] border border-[#dce9ff] rounded p-3 font-mono text-[11px] space-y-2">
              <div>
                <span className="font-bold text-[#006398]">EX/MEM to EX Hazard (ForwardA = 10):</span>
                <div className="text-[10px] text-[#0f2a4a] mt-0.5">
                  <code>if (EX/MEM.RegWrite and EX/MEM.rd != 0 and EX/MEM.rd == ID/EX.rs1) ForwardA = 10;</code>
                </div>
              </div>
              <div>
                <span className="font-bold text-[#006398]">MEM/WB to EX Hazard (ForwardA = 01):</span>
                <div className="text-[10px] text-[#0f2a4a] mt-0.5">
                  <code>if (MEM/WB.RegWrite and MEM/WB.rd != 0 and MEM/WB.rd == ID/EX.rs1) ForwardA = 01;</code>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Load-Use Hazard & Stall Bubbles */}
          <div>
            <div className="flex items-center space-x-2 text-[#d97706] font-heading font-bold text-sm mb-2">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="uppercase tracking-wider">3. Load-Use Hazards &amp; 1-Cycle Stall</h3>
            </div>
            <p className="text-[#475569] mb-2">
              Even with forwarding, data from a <code className="bg-[#f1f5f9] px-1 py-0.5 rounded text-[#0f2a4a]">lw</code> instruction is not available until the end of the MEM stage. An instruction that consumes the loaded register immediately in EX must stall for 1 clock cycle:
            </p>
            <div className="bg-[#fffbeb] border border-[#fed7aa] rounded p-3 text-[11px] font-mono">
              <span className="text-[#b45309] font-bold block mb-1">Hardware Interlock Condition:</span>
              <p className="text-[#78350f]">
                <code>if (ID/EX.MemRead and (ID/EX.rd == IF/ID.rs1 or ID/EX.rd == IF/ID.rs2)) {'{'} stall(); {'}'}</code>
              </p>
              <p className="text-[10px] text-[#92400e] mt-1 font-sans">
                The hardware freezes the PC and IF/ID pipeline registers, and clears the control lines into ID/EX to inject a bubble (NOP).
              </p>
            </div>
          </div>

          {/* Section 4: Cache Mapping Formulas */}
          <div>
            <div className="flex items-center space-x-2 text-[#059669] font-heading font-bold text-sm mb-2">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="uppercase tracking-wider">4. Cache Tag / Index / Offset Geometry</h3>
            </div>
            <p className="text-[#475569] mb-2">
              For any 32-bit address, the cache decomposes the address into three non-overlapping bitfields:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#475569]">
              <li><strong className="text-[#0f2a4a]">Offset Bits</strong> = log<sub>2</sub>(Block Size in bytes). For 16 bytes = 4 bits.</li>
              <li><strong className="text-[#0f2a4a]">Index Bits</strong> = log<sub>2</sub>(Number of Sets). Selects which cache set row to inspect.</li>
              <li><strong className="text-[#0f2a4a]">Tag Bits</strong> = 32 - Index Bits - Offset Bits. Stored in cache line to verify block identity.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#f8fafc] border-t border-[#e2e8f0] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-[#0f2a4a] text-white hover:bg-[#0284c7] transition-colors"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};
