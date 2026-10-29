/**
 * Architecture Cadence - Microarchitectural Hazard Detection Matrix
 * Evaluates RAW Data Hazards, Load-Use Stalls, Branch Flushes, and Forwarding Bypasses.
 */

import React from 'react';
import { CPUState } from '../types/architecture';
import { ShieldAlert, Zap, AlertTriangle, GitFork, CheckCircle } from 'lucide-react';

interface HazardMatrixProps {
  cpuState: CPUState;
  onToggleForwarding: () => void;
}

export const HazardMatrix: React.FC<HazardMatrixProps> = ({
  cpuState,
  onToggleForwarding,
}) => {
  const { pipeline, recentHazards, forwardingPaths, config } = cpuState;

  // Determine current active hazards in pipeline
  const currentStall = pipeline.id.status === 'stalled' || pipeline.ex.status === 'bubble';
  const currentFlush = pipeline.if.status === 'flushed' || pipeline.id.status === 'flushed';

  return (
    <div className="space-y-4">
      {/* Top Diagnostics HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Forwarding Unit Tile */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-[#06b6d4]" />
              <h3 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
                Hardware Forwarding Unit
              </h3>
            </div>
            <button
              onClick={onToggleForwarding}
              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors ${
                config.forwardingEnabled
                  ? 'bg-[#ecfeff] text-[#0891b2] border border-[#06b6d4]'
                  : 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
              }`}
            >
              {config.forwardingEnabled ? 'ACTIVE (EX/MEM Bypasses)' : 'DISABLED (Stalling)'}
            </button>
          </div>

          <div className="mt-2.5 text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[#64748b]">ForwardA Mux (ALU OpA):</span>
              <span
                className={`font-bold ${
                  pipeline.ex.forwardA !== 'NONE'
                    ? 'text-[#06b6d4] bg-[#cffafe] px-1.5 rounded'
                    : 'text-[#475569]'
                }`}
              >
                {pipeline.ex.forwardA === 'EX_EX'
                  ? '10 (EX/MEM Forward)'
                  : pipeline.ex.forwardA === 'MEM_EX'
                  ? '01 (MEM/WB Forward)'
                  : '00 (RegFile Original)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#64748b]">ForwardB Mux (ALU OpB):</span>
              <span
                className={`font-bold ${
                  pipeline.ex.forwardB !== 'NONE'
                    ? 'text-[#06b6d4] bg-[#cffafe] px-1.5 rounded'
                    : 'text-[#475569]'
                }`}
              >
                {pipeline.ex.forwardB === 'EX_EX'
                  ? '10 (EX/MEM Forward)'
                  : pipeline.ex.forwardB === 'MEM_EX'
                  ? '01 (MEM/WB Forward)'
                  : '00 (RegFile Original)'}
              </span>
            </div>
          </div>
        </div>

        {/* Load-Use Hazard Unit */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
            <div className="flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-[#d97706]" />
              <h3 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
                Load-Use Interlock Logic
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#eff4ff] text-[#0284c7]">
              Hardware Interlock
            </span>
          </div>

          <div className="mt-2.5 text-xs text-[#475569] space-y-1">
            <p className="text-[11px] leading-relaxed">
              Condition: <code className="bg-[#f1f5f9] px-1 py-0.5 rounded font-mono text-[10px] text-[#0f2a4a]">ID/EX.MemRead &amp;&amp; (ID/EX.rd == IF/ID.rs1 || rs2)</code>
            </p>
            <div className="pt-1 flex items-center justify-between font-mono text-xs">
              <span className="text-[#64748b]">Interlock Triggered:</span>
              <span
                className={`font-bold ${
                  currentStall
                    ? 'text-[#d97706] bg-[#fffbeb] px-1.5 rounded'
                    : 'text-[#059669]'
                }`}
              >
                {currentStall ? 'YES (1-Cycle Stall Bubble)' : 'NO (Clear)'}
              </span>
            </div>
          </div>
        </div>

        {/* Branch Hazard Unit */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
            <div className="flex items-center space-x-1.5">
              <GitFork className="w-4 h-4 text-[#006398]" />
              <h3 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
                Branch &amp; Jump Hazard Logic
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#eff4ff] text-[#0284c7]">
              2-Cycle Flush
            </span>
          </div>

          <div className="mt-2.5 text-xs text-[#475569] space-y-1">
            <p className="text-[11px] leading-relaxed">
              Resolved in EX Stage: When conditional branch evaluates taken, speculatively fetched instructions in IF and ID are cleared.
            </p>
            <div className="pt-1 flex items-center justify-between font-mono text-xs">
              <span className="text-[#64748b]">Pipeline Flush Active:</span>
              <span
                className={`font-bold ${
                  currentFlush
                    ? 'text-[#dc2626] bg-[#fef2f2] px-1.5 rounded'
                    : 'text-[#059669]'
                }`}
              >
                {currentFlush ? 'YES (Flushed IF/ID)' : 'NO (Predict Accurate)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hazard Condition Rules Matrix */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-[#0284c7]" />
            <h3 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
              Microarchitectural Hazard Resolution Matrix
            </h3>
          </div>
          <span className="text-[11px] text-[#64748b]">Textbook RV32I Reference</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#eff4ff] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#0f2a4a]">
                <th className="py-2 px-3">Hazard Category</th>
                <th className="py-2 px-3 border-l border-[#e2e8f0]">Hardware Condition</th>
                <th className="py-2 px-3 border-l border-[#e2e8f0]">Penalty with Forwarding</th>
                <th className="py-2 px-3 border-l border-[#e2e8f0]">Penalty without Forwarding</th>
                <th className="py-2 px-3 border-l border-[#e2e8f0]">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9] text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0f2a4a]">
                  EX/MEM RAW Data Hazard
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] font-mono text-[10px] text-[#475569]">
                  EX/MEM.RegWrite &amp;&amp; (EX/MEM.rd != 0) &amp;&amp; (EX/MEM.rd == ID/EX.rs1)
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] text-[#059669] font-semibold">
                  0 Cycles (Forwarded via ALU Mux)
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] text-[#d97706] font-semibold">
                  2 Stall Cycles
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9]">
                  {forwardingPaths.some((p) => p.fromStage === 'EX') ? (
                    <span className="px-2 py-0.5 rounded bg-[#cffafe] text-[#0891b2] font-bold text-[10px]">
                      FORWARDING
                    </span>
                  ) : (
                    <span className="text-[#94a3b8] text-[10px]">INACTIVE</span>
                  )}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0f2a4a]">
                  MEM/WB RAW Data Hazard
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] font-mono text-[10px] text-[#475569]">
                  MEM/WB.RegWrite &amp;&amp; (MEM/WB.rd != 0) &amp;&amp; (MEM/WB.rd == ID/EX.rs1)
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] text-[#059669] font-semibold">
                  0 Cycles (Forwarded via WB Mux)
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] text-[#d97706] font-semibold">
                  1 Stall Cycle
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9]">
                  {forwardingPaths.some((p) => p.fromStage === 'MEM') ? (
                    <span className="px-2 py-0.5 rounded bg-[#cffafe] text-[#0891b2] font-bold text-[10px]">
                      FORWARDING
                    </span>
                  ) : (
                    <span className="text-[#94a3b8] text-[10px]">INACTIVE</span>
                  )}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0f2a4a]">
                  Load-Use Data Hazard
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] font-mono text-[10px] text-[#475569]">
                  ID/EX.MemRead &amp;&amp; (ID/EX.rd == IF/ID.rs1 || IF/ID.rs2)
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] text-[#d97706] font-semibold">
                  1 Stall Cycle (Bubble inserted)
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] text-[#dc2626] font-semibold">
                  2 Stall Cycles
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9]">
                  {currentStall ? (
                    <span className="px-2 py-0.5 rounded bg-[#fffbeb] text-[#d97706] font-bold text-[10px]">
                      STALL ACTIVE
                    </span>
                  ) : (
                    <span className="text-[#94a3b8] text-[10px]">CLEAR</span>
                  )}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0f2a4a]">
                  Branch Control Hazard
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] font-mono text-[10px] text-[#475569]">
                  Branch Evaluated Taken in EX (PC changed to target)
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] text-[#dc2626] font-semibold">
                  2 Flush Cycles (IF + ID cleared)
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9] text-[#dc2626] font-semibold">
                  2 Flush Cycles (IF + ID cleared)
                </td>
                <td className="py-2.5 px-3 border-l border-[#f1f5f9]">
                  {currentFlush ? (
                    <span className="px-2 py-0.5 rounded bg-[#fef2f2] text-[#dc2626] font-bold text-[10px]">
                      FLUSH ACTIVE
                    </span>
                  ) : (
                    <span className="text-[#94a3b8] text-[10px]">PREDICT OK</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Hazard Event Log */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
            Live Hardware Hazard &amp; Stall Event History
          </h3>
          <span className="text-[11px] text-[#64748b]">Chronological log</span>
        </div>

        <div className="p-3">
          {recentHazards.length === 0 ? (
            <div className="flex items-center space-x-2 text-xs text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] rounded p-3">
              <CheckCircle className="w-4 h-4" />
              <span>No hazards or stalls detected. Pipeline flows smoothly at maximum throughput.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {recentHazards.map((h) => (
                <div
                  key={h.id}
                  className="flex items-start justify-between p-2.5 rounded border border-[#e2e8f0] bg-[#f8fafc] text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.2 rounded bg-[#0f2a4a] text-white font-bold text-[10px]">
                        Cycle {h.cycle}
                      </span>
                      <span className="px-1.5 py-0.2 rounded font-bold uppercase text-[10px] bg-[#fffbeb] text-[#b45309] border border-[#fed7aa]">
                        {h.type}
                      </span>
                      <span className="font-semibold text-[#0f2a4a] font-sans">
                        Stage {h.stage}: &quot;{h.instructionText}&quot;
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] font-sans">{h.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase bg-[#eff4ff] text-[#0284c7] whitespace-nowrap">
                    {h.resolution}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
