/**
 * Architecture Cadence - 5-Stage Connected Structural Pipeline Canvas
 * IF (Fetch) -> ID (Decode) -> EX (Execute) -> MEM (Memory) -> WB (Writeback)
 * With dynamic hardware forwarding path indicators, control signals, and stall bubble states.
 */

import React from 'react';
import { CPUState, StageStatus } from '../types/architecture';
import { ArrowRight, Zap, AlertTriangle, Disc, RefreshCw } from 'lucide-react';

interface PipelineCanvasProps {
  cpuState: CPUState;
}

export const PipelineCanvas: React.FC<PipelineCanvasProps> = ({ cpuState }) => {
  const { pipeline, forwardingPaths, pc } = cpuState;

  const getStageBadge = (status: StageStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">
            ACTIVE CLOCK
          </span>
        );
      case 'stalled':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#fef3c7] text-[#b45309] border border-[#fde68a] flex items-center space-x-1">
            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
            STALLED
          </span>
        );
      case 'bubble':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#fffbeb] text-[#d97706] border border-[#fed7aa] border-dashed">
            BUBBLE (NOP)
          </span>
        );
      case 'flushed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]">
            FLUSHED
          </span>
        );
      case 'empty':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
            IDLE / NOP
          </span>
        );
    }
  };

  const getCardBorder = (status: StageStatus) => {
    if (status === 'active') {
      return 'border-[#06b6d4] bg-[#f8fafc] shadow-[0_2px_8px_rgba(6,182,212,0.12)] border-t-[3px] border-t-[#06b6d4]';
    }
    if (status === 'bubble' || status === 'stalled') {
      return 'border-[#d97706] border-dashed bg-[#fffbeb] shadow-sm';
    }
    if (status === 'flushed') {
      return 'border-[#dc2626] border-dashed bg-[#fef2f2] shadow-sm';
    }
    return 'border-[#e2e8f0] bg-white';
  };

  const hasForwarding = forwardingPaths.length > 0;

  return (
    <div className="space-y-4">
      {/* Forwarding Bus Status Banner (if active) */}
      {hasForwarding && (
        <div className="bg-[#ecfeff] border border-[#06b6d4] rounded p-2.5 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center space-x-2 text-[#006398] font-semibold">
            <Zap className="w-4 h-4 text-[#06b6d4]" />
            <span className="font-heading uppercase tracking-wider text-[11px]">
              Hardware Forwarding Unit Active:
            </span>
            <div className="flex flex-wrap gap-2">
              {forwardingPaths.map((fp, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-[#cffafe] text-[#0891b2] border border-[#06b6d4]/40 font-mono text-[11px]"
                >
                  {fp.fromStage} &rarr; EX (Operand {fp.targetOperand}, Reg x{fp.sourceReg} = {fp.value})
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#0891b2] bg-white px-2 py-0.5 rounded border border-[#06b6d4]/30">
            0-CYCLE PENALTY
          </span>
        </div>
      )}

      {/* 5-Stage Classical RISC Connected Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* ===================== STAGE 1: IF (Fetch) ===================== */}
        <div
          className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${getCardBorder(
            pipeline.if.status
          )}`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e2e8f0]">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-[#0f2a4a] font-heading">
                  STAGE 1: IF
                </span>
                <span className="text-[10px] text-[#64748b]">Instruction Fetch</span>
              </div>
              {getStageBadge(pipeline.if.status)}
            </div>

            {/* Stage Body */}
            <div className="space-y-2.5 text-xs">
              <div className="bg-[#eff4ff] border border-[#dce9ff] rounded p-2">
                <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider">
                  Program Counter (PC)
                </div>
                <div className="font-mono text-sm font-bold text-[#0f2a4a] tabular-nums mt-0.5">
                  0x{(pipeline.if.pc >>> 0).toString(16).padStart(8, '0').toUpperCase()}
                </div>
                <div className="text-[10px] text-[#475569] mt-0.5">
                  Next PC: 0x{(pc >>> 0).toString(16).padStart(8, '0').toUpperCase()}
                </div>
              </div>

              <div className="border border-[#e2e8f0] rounded p-2 bg-white">
                <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-1">
                  Fetched Instruction
                </div>
                {pipeline.if.instruction ? (
                  <div>
                    <div className="font-mono font-bold text-[#0284c7] text-xs">
                      {pipeline.if.instruction.text}
                    </div>
                    <div className="font-mono text-[10px] text-[#64748b] mt-0.5">
                      Hex: {pipeline.if.instruction.hexCode}
                    </div>
                  </div>
                ) : (
                  <div className="text-[#94a3b8] italic text-xs">No instruction fetched</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[10px] text-[#64748b]">
            <span>PC Mux: {pipeline.if.status === 'flushed' ? 'Branch Target' : 'PC + 4'}</span>
            <ArrowRight className="w-3 h-3 text-[#0284c7]" />
          </div>
        </div>

        {/* ===================== STAGE 2: ID (Decode) ===================== */}
        <div
          className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${getCardBorder(
            pipeline.id.status
          )}`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e2e8f0]">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-[#0f2a4a] font-heading">
                  STAGE 2: ID
                </span>
                <span className="text-[10px] text-[#64748b]">Decode / Registers</span>
              </div>
              {getStageBadge(pipeline.id.status)}
            </div>

            {/* Stage Body */}
            <div className="space-y-2 text-xs">
              <div className="border border-[#e2e8f0] rounded p-2 bg-white">
                <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-1">
                  Decoded Opcode
                </div>
                {pipeline.id.instruction ? (
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-[#eff4ff] text-[#006398] border border-[#cce5ff]">
                        {pipeline.id.instruction.opcode}
                      </span>
                      <span className="font-mono text-xs text-[#0f2a4a]">
                        {pipeline.id.instruction.text}
                      </span>
                    </div>

                    {/* Operands */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-[#f1f5f9] text-[11px] font-mono">
                      <div>
                        <span className="text-[#64748b] text-[10px] block">rs1 (read):</span>
                        <span className="font-semibold text-[#0f2a4a]">
                          {pipeline.id.instruction.rs1 !== undefined ? `x${pipeline.id.instruction.rs1} = ${pipeline.id.rs1Val}` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748b] text-[10px] block">rs2 / imm:</span>
                        <span className="font-semibold text-[#0f2a4a]">
                          {pipeline.id.instruction.rs2 !== undefined
                            ? `x${pipeline.id.instruction.rs2} = ${pipeline.id.rs2Val}`
                            : `imm = ${pipeline.id.imm}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#94a3b8] italic text-xs">Stage idle</div>
                )}
              </div>

              {/* Control Signals */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-2">
                <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-1">
                  Control Unit Signals
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                  <div className={`px-1 py-0.5 rounded text-center ${pipeline.id.controls.regWrite ? 'bg-[#ecfdf5] text-[#059669] font-bold' : 'text-[#94a3b8]'}`}>
                    RegW: {pipeline.id.controls.regWrite ? '1' : '0'}
                  </div>
                  <div className={`px-1 py-0.5 rounded text-center ${pipeline.id.controls.aluSrc ? 'bg-[#eff4ff] text-[#0284c7] font-bold' : 'text-[#94a3b8]'}`}>
                    ALUSrc: {pipeline.id.controls.aluSrc ? '1' : '0'}
                  </div>
                  <div className={`px-1 py-0.5 rounded text-center ${pipeline.id.controls.memRead ? 'bg-[#eff4ff] text-[#0284c7] font-bold' : 'text-[#94a3b8]'}`}>
                    MemR: {pipeline.id.controls.memRead ? '1' : '0'}
                  </div>
                  <div className={`px-1 py-0.5 rounded text-center ${pipeline.id.controls.memWrite ? 'bg-[#fef3c7] text-[#b45309] font-bold' : 'text-[#94a3b8]'}`}>
                    MemW: {pipeline.id.controls.memWrite ? '1' : '0'}
                  </div>
                  <div className={`px-1 py-0.5 rounded text-center ${pipeline.id.controls.branch ? 'bg-[#fef2f2] text-[#dc2626] font-bold' : 'text-[#94a3b8]'}`}>
                    Branch: {pipeline.id.controls.branch ? '1' : '0'}
                  </div>
                  <div className="px-1 py-0.5 rounded text-center text-[#475569]">
                    ALU: {pipeline.id.controls.aluOp}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[10px] text-[#64748b]">
            <span>Sign Extend: 32-bit</span>
            <ArrowRight className="w-3 h-3 text-[#0284c7]" />
          </div>
        </div>

        {/* ===================== STAGE 3: EX (Execute) ===================== */}
        <div
          className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${getCardBorder(
            pipeline.ex.status
          )}`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e2e8f0]">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-[#0f2a4a] font-heading">
                  STAGE 3: EX
                </span>
                <span className="text-[10px] text-[#64748b]">ALU / Branch</span>
              </div>
              {getStageBadge(pipeline.ex.status)}
            </div>

            {/* Stage Body */}
            <div className="space-y-2 text-xs">
              <div className="border border-[#e2e8f0] rounded p-2 bg-white">
                <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-1">
                  Active Instruction
                </div>
                {pipeline.ex.instruction ? (
                  <div>
                    <div className="font-mono font-bold text-xs text-[#0f2a4a]">
                      {pipeline.ex.instruction.text}
                    </div>

                    {/* ALU Inputs */}
                    <div className="mt-2 space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748b]">Operand A:</span>
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-[#0f2a4a]">{pipeline.ex.opA}</span>
                          {pipeline.ex.forwardA !== 'NONE' && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#cffafe] text-[#0891b2] font-sans font-semibold">
                              BYPASS
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#64748b]">Operand B:</span>
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-[#0f2a4a]">{pipeline.ex.opB}</span>
                          {pipeline.ex.forwardB !== 'NONE' && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#cffafe] text-[#0891b2] font-sans font-semibold">
                              BYPASS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#94a3b8] italic text-xs">Stage idle / Bubble</div>
                )}
              </div>

              {/* ALU Output Result */}
              <div className="bg-[#eff4ff] border border-[#dce9ff] rounded p-2">
                <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider">
                  ALU Computation Result
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-sm font-bold text-[#0284c7] tabular-nums">
                    {pipeline.ex.aluResult}
                  </span>
                  <span className="font-mono text-[10px] text-[#475569]">
                    0x{(pipeline.ex.aluResult >>> 0).toString(16).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-[#64748b] mt-1 pt-1 border-t border-[#dce9ff]">
                  <span>Zero: {pipeline.ex.zeroFlag ? '1 (TRUE)' : '0 (FALSE)'}</span>
                  {pipeline.ex.rd !== undefined && <span>rd: x{pipeline.ex.rd}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[10px] text-[#64748b]">
            <span>Mux Select: {pipeline.ex.controls.aluOp}</span>
            <ArrowRight className="w-3 h-3 text-[#0284c7]" />
          </div>
        </div>

        {/* ===================== STAGE 4: MEM (Memory) ===================== */}
        <div
          className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${getCardBorder(
            pipeline.mem.status
          )}`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e2e8f0]">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-[#0f2a4a] font-heading">
                  STAGE 4: MEM
                </span>
                <span className="text-[10px] text-[#64748b]">Data Cache Access</span>
              </div>
              {getStageBadge(pipeline.mem.status)}
            </div>

            {/* Stage Body */}
            <div className="space-y-2 text-xs">
              <div className="border border-[#e2e8f0] rounded p-2 bg-white">
                <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-1">
                  Active Instruction
                </div>
                {pipeline.mem.instruction ? (
                  <div>
                    <div className="font-mono font-bold text-xs text-[#0f2a4a]">
                      {pipeline.mem.instruction.text}
                    </div>

                    <div className="mt-2 space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748b]">Mem Address:</span>
                        <span className="font-bold text-[#0f2a4a]">
                          0x{(pipeline.mem.aluResult >>> 0).toString(16).toUpperCase()}
                        </span>
                      </div>
                      {pipeline.mem.controls.memWrite && (
                        <div className="flex items-center justify-between text-[#b45309]">
                          <span>Store Data:</span>
                          <span className="font-bold">{pipeline.mem.writeData}</span>
                        </div>
                      )}
                      {pipeline.mem.controls.memRead && (
                        <div className="flex items-center justify-between text-[#0284c7]">
                          <span>Loaded Data:</span>
                          <span className="font-bold">{pipeline.mem.readData}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[#94a3b8] italic text-xs">Stage idle</div>
                )}
              </div>

              {/* Memory Strobe Status */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-2 text-xs">
                <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-1">
                  Memory Bus Status
                </div>
                {pipeline.mem.controls.memRead ? (
                  <div className="flex items-center space-x-1 text-[#0284c7] font-semibold text-[11px]">
                    <Disc className="w-3 h-3 animate-spin text-[#06b6d4]" />
                    <span>L1 Cache Read Active</span>
                  </div>
                ) : pipeline.mem.controls.memWrite ? (
                  <div className="flex items-center space-x-1 text-[#b45309] font-semibold text-[11px]">
                    <RefreshCw className="w-3 h-3 text-[#d97706]" />
                    <span>L1 Cache Write-Through Active</span>
                  </div>
                ) : (
                  <div className="text-[#94a3b8] text-[11px]">Bus inactive (Bypass to WB)</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[10px] text-[#64748b]">
            <span>MemToReg: {pipeline.mem.controls.memToReg ? 'ReadData' : 'ALUResult'}</span>
            <ArrowRight className="w-3 h-3 text-[#0284c7]" />
          </div>
        </div>

        {/* ===================== STAGE 5: WB (Writeback) ===================== */}
        <div
          className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${getCardBorder(
            pipeline.wb.status
          )}`}
        >
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e2e8f0]">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-[#0f2a4a] font-heading">
                  STAGE 5: WB
                </span>
                <span className="text-[10px] text-[#64748b]">Writeback / Retire</span>
              </div>
              {getStageBadge(pipeline.wb.status)}
            </div>

            {/* Stage Body */}
            <div className="space-y-2 text-xs">
              <div className="border border-[#e2e8f0] rounded p-2 bg-white">
                <div className="text-[10px] uppercase font-semibold text-[#64748b] tracking-wider mb-1">
                  Retiring Instruction
                </div>
                {pipeline.wb.instruction ? (
                  <div>
                    <div className="font-mono font-bold text-xs text-[#0f2a4a]">
                      {pipeline.wb.instruction.text}
                    </div>

                    <div className="mt-2 space-y-1 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748b]">Dest Reg (rd):</span>
                        <span className="font-bold text-[#0f2a4a]">
                          {pipeline.wb.rd !== undefined ? `x${pipeline.wb.rd}` : 'None'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748b]">Writeback Val:</span>
                        <span className="font-bold text-[#059669]">
                          {pipeline.wb.writeData}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#94a3b8] italic text-xs">Stage idle</div>
                )}
              </div>

              {/* Commit Strobe */}
              <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded p-2">
                <div className="text-[10px] uppercase font-semibold text-[#047857] tracking-wider">
                  Architectural Commit
                </div>
                <div className="text-[11px] font-mono font-semibold text-[#065f46] mt-0.5">
                  {pipeline.wb.regWrite && pipeline.wb.rd && pipeline.wb.rd > 0
                    ? `Commit: R[x${pipeline.wb.rd}] <= ${pipeline.wb.writeData}`
                    : 'No Register Write'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[10px] text-[#64748b]">
            <span>RegFile Port: Write 32-bit</span>
            <span className="font-mono text-[#059669] font-bold">RETIRED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
