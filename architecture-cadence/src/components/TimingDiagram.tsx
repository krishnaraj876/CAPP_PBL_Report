/**
 * Architecture Cadence - Space-Time Pipeline Execution Diagram
 * Cycle-by-cycle multi-tiered microarchitectural trace matrix.
 */

import React from 'react';
import { SpaceTimeEntry } from '../types/architecture';
import { Clock } from 'lucide-react';

interface TimingDiagramProps {
  entries: SpaceTimeEntry[];
  currentCycle: number;
}

export const TimingDiagram: React.FC<TimingDiagramProps> = ({ entries, currentCycle }) => {
  if (entries.length === 0) {
    return (
      <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 text-center text-xs text-[#64748b]">
        No clock cycles executed yet. Click &quot;Step Clock Pulse&quot; or &quot;Run Continuous&quot; to begin pipeline trace.
      </div>
    );
  }

  // Display recent 12 cycles
  const recentEntries = entries.slice(-12);

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm overflow-hidden">
      {/* Header Bar with Integrated Bottom Border and Cycle Counter */}
      <div className="px-4 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#0284c7]" />
          <h2 className="text-xs font-bold text-[#0f2a4a] uppercase tracking-wider font-heading">
            Pipeline Space-Time Progression Trace
          </h2>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7]" />
            <span className="text-[10px] text-[#475569]">IF</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#06b6d4]" />
            <span className="text-[10px] text-[#475569]">ID</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#0f2a4a]" />
            <span className="text-[10px] text-[#475569]">EX</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#006398]" />
            <span className="text-[10px] text-[#475569]">MEM</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#059669]" />
            <span className="text-[10px] text-[#475569]">WB</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#d97706] border border-[#b45309]" />
            <span className="text-[10px] text-[#475569]">Bubble</span>
          </div>
        </div>
      </div>

      {/* Trace Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#eff4ff] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#0f2a4a]">
              <th className="py-2 px-3 w-16 text-center font-mono">Cycle</th>
              <th className="py-2 px-3 border-l border-[#e2e8f0]">IF (Fetch)</th>
              <th className="py-2 px-3 border-l border-[#e2e8f0]">ID (Decode)</th>
              <th className="py-2 px-3 border-l border-[#e2e8f0]">EX (Execute)</th>
              <th className="py-2 px-3 border-l border-[#e2e8f0]">MEM (Memory)</th>
              <th className="py-2 px-3 border-l border-[#e2e8f0]">WB (Writeback)</th>
              <th className="py-2 px-3 border-l border-[#e2e8f0]">Hazard Resolution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9] font-mono text-[11px]">
            {recentEntries.map((entry) => {
              const isCurrent = entry.cycle === currentCycle;

              return (
                <tr
                  key={entry.cycle}
                  className={`hover:bg-[#f8fafc] transition-colors ${
                    isCurrent ? 'bg-[#ecfeff]/50 font-medium' : ''
                  }`}
                >
                  <td className="py-2 px-3 text-center text-[#0f2a4a] font-bold">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-[#06b6d4] text-[#00152f]'
                          : 'bg-[#f1f5f9] text-[#475569]'
                      }`}
                    >
                      C{entry.cycle}
                    </span>
                  </td>

                  {/* IF Column */}
                  <td className="py-2 px-3 border-l border-[#f1f5f9]">
                    {entry.if ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">
                        {entry.if}
                      </span>
                    ) : (
                      <span className="text-[#cbd5e1]">-</span>
                    )}
                  </td>

                  {/* ID Column */}
                  <td className="py-2 px-3 border-l border-[#f1f5f9]">
                    {entry.id ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#cffafe] text-[#0891b2] border border-[#a5f3fc]">
                        {entry.id}
                      </span>
                    ) : (
                      <span className="text-[#cbd5e1]">-</span>
                    )}
                  </td>

                  {/* EX Column */}
                  <td className="py-2 px-3 border-l border-[#f1f5f9]">
                    {entry.ex ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]">
                        {entry.ex}
                      </span>
                    ) : (
                      <span className="text-[#cbd5e1]">-</span>
                    )}
                  </td>

                  {/* MEM Column */}
                  <td className="py-2 px-3 border-l border-[#f1f5f9]">
                    {entry.mem ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#e0e7ff] text-[#3730a3] border border-[#c7d2fe]">
                        {entry.mem}
                      </span>
                    ) : (
                      <span className="text-[#cbd5e1]">-</span>
                    )}
                  </td>

                  {/* WB Column */}
                  <td className="py-2 px-3 border-l border-[#f1f5f9]">
                    {entry.wb ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                        {entry.wb}
                      </span>
                    ) : (
                      <span className="text-[#cbd5e1]">-</span>
                    )}
                  </td>

                  {/* Hazard Column */}
                  <td className="py-2 px-3 border-l border-[#f1f5f9] font-sans">
                    {entry.hazardNote ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#fffbeb] text-[#b45309] border border-[#fed7aa]">
                        {entry.hazardNote}
                      </span>
                    ) : (
                      <span className="text-[#94a3b8] text-[10px]">Normal Flow</span>
                    )}
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
