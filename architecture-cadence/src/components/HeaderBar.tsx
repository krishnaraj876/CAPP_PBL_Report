/**
 * Architecture Cadence - Header & Hardware Execution Control Bar
 * Deep Institutional Navy foundation (#0F2A4A) with Signal Blue and Technical Cyan telemetry.
 */

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Cpu,
  BookOpen,
  Zap,
  Activity,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { CPUState } from '../types/architecture';

interface HeaderBarProps {
  cpuState: CPUState;
  isRunning: boolean;
  clockHz: number;
  onStep: () => void;
  onToggleRun: () => void;
  onReset: () => void;
  onClockHzChange: (hz: number) => void;
  onToggleForwarding: () => void;
  onOpenGuide: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  cpuState,
  isRunning,
  clockHz,
  onStep,
  onToggleRun,
  onReset,
  onClockHzChange,
  onToggleForwarding,
  onOpenGuide,
}) => {
  const cpi = cpuState.instructionCount > 0 ? (cpuState.cycle / cpuState.instructionCount).toFixed(2) : '1.00';
  const ipc = cpuState.cycle > 0 ? (cpuState.instructionCount / cpuState.cycle).toFixed(2) : '1.00';

  return (
    <header className="bg-[#0f2a4a] text-white border-b border-[#091a30] shadow-sm select-none">
      {/* Top Banner: Branding & High-Level Telemetry */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-[#0284c7] flex items-center justify-center text-white shadow-inner font-bold tracking-wider">
            <Cpu className="w-5 h-5 text-[#cce5ff]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-heading">
                ARCHITECTURE CADENCE
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#00181e] text-[#06b6d4] border border-[#06b6d4]/40">
                RV32I 5-STAGE
              </span>
            </div>
            <p className="text-xs text-[#a0b5d0]">
              Microarchitecture Simulation & Hardware Verification Workbench
            </p>
          </div>
        </div>

        {/* Real-Time Microarchitectural Telemetry HUD */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-[#081b31] border border-[#1b3d66] rounded px-3 py-1.5 text-xs">
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span className="text-[#88a3c7] uppercase text-[10px] font-semibold tracking-wider">
              Clock Cycle:
            </span>
            <span className="font-mono font-bold text-white text-sm tabular-nums">
              {cpuState.cycle}
            </span>
          </div>

          <div className="h-4 w-px bg-[#1e426d] hidden sm:block" />

          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-[#5bb8fe]" />
            <span className="text-[#88a3c7] uppercase text-[10px] font-semibold tracking-wider">
              Retired Inst:
            </span>
            <span className="font-mono font-semibold text-[#eff4ff] tabular-nums">
              {cpuState.instructionCount}
            </span>
          </div>

          <div className="h-4 w-px bg-[#1e426d] hidden sm:block" />

          <div className="flex items-center space-x-1.5">
            <span className="text-[#88a3c7] uppercase text-[10px] font-semibold tracking-wider">
              CPI:
            </span>
            <span className="font-mono font-semibold text-[#06b6d4] tabular-nums">
              {cpi}
            </span>
            <span className="text-[#64748b] text-[10px]">({ipc} IPC)</span>
          </div>

          <div className="h-4 w-px bg-[#1e426d] hidden sm:block" />

          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#d97706]" />
            <span className="text-[#88a3c7] uppercase text-[10px] font-semibold tracking-wider">
              Stalls:
            </span>
            <span className="font-mono font-semibold text-[#fed7aa] tabular-nums">
              {cpuState.stalls}
            </span>
          </div>

          <div className="h-4 w-px bg-[#1e426d] hidden sm:block" />

          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span className="text-[#88a3c7] uppercase text-[10px] font-semibold tracking-wider">
              Bypass:
            </span>
            <span className="font-mono font-semibold text-[#06b6d4] tabular-nums">
              {cpuState.forwardingEvents}
            </span>
          </div>
        </div>

        {/* Quick Guide Button */}
        <button
          onClick={onOpenGuide}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-[#cce5ff] hover:text-white bg-[#14355a] hover:bg-[#1a4372] border border-[#2b5282] rounded transition-colors"
          title="Open Microarchitecture Theory Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#5bb8fe]" />
          <span>Spec & Guide</span>
        </button>
      </div>

      {/* Execution Control Ribbon */}
      <div className="bg-[#0b213b] border-t border-[#133054] px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
          {/* Main Execution Controls */}
          <div className="flex items-center space-x-2">
            {/* Step Clock Button */}
            <button
              onClick={onStep}
              disabled={isRunning || cpuState.isHalted}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-semibold text-xs tracking-wide transition-all border ${
                isRunning || cpuState.isHalted
                  ? 'bg-transparent border-[#244265] text-[#556b85] cursor-not-allowed'
                  : 'bg-transparent border-[#93ccff] text-white hover:bg-[#153a63] active:bg-[#0284c7] active:border-[#0284c7] focus:outline-none focus:ring-2 focus:ring-[#06b6d4]'
              }`}
              title="Step Single Clock Cycle (Rising Edge)"
            >
              <StepForward className="w-3.5 h-3.5 text-[#5bb8fe]" />
              <span>Step Clock Pulse</span>
            </button>

            {/* Run / Pause Toggle */}
            <button
              onClick={onToggleRun}
              disabled={cpuState.isHalted}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded font-semibold text-xs tracking-wide transition-all ${
                cpuState.isHalted
                  ? 'bg-[#1e3450] text-[#7187a3] cursor-not-allowed'
                  : isRunning
                  ? 'bg-[#d97706] hover:bg-[#b45309] text-white'
                  : 'bg-[#0284c7] hover:bg-[#0369a1] text-white focus:ring-2 focus:ring-[#06b6d4]'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Clock</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Continuous</span>
                </>
              )}
            </button>

            {/* Reset CPU Button */}
            <button
              onClick={onReset}
              className="flex items-center space-x-1 px-3 py-1.5 rounded font-semibold text-xs tracking-wide bg-transparent border border-[#3b597d] text-[#b0c8f0] hover:bg-[#1a385c] hover:text-white transition-colors"
              title="Reset PC, Pipeline Registers, and Clear Stalls"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>

            {cpuState.isHalted && (
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] border border-[#ffdad6]/20">
                EXECUTION HALTED
              </span>
            )}
          </div>

          {/* Secondary Controls: Clock Speed & Forwarding Hardware Switch */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Clock Frequency Slider */}
            <div className="flex items-center space-x-2 bg-[#081a2f] border border-[#1b3d66] px-2.5 py-1 rounded">
              <span className="text-[#8da7c7] font-medium text-[11px]">Clock Frequency:</span>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={clockHz}
                onChange={(e) => onClockHzChange(parseFloat(e.target.value))}
                className="w-20 accent-[#06b6d4] cursor-pointer"
                aria-label="Clock frequency in Hertz"
              />
              <span className="font-mono text-[#06b6d4] font-semibold tabular-nums w-12 text-right">
                {clockHz} Hz
              </span>
            </div>

            {/* Hardware Data Forwarding Toggle */}
            <div className="flex items-center space-x-2 bg-[#081a2f] border border-[#1b3d66] px-2.5 py-1 rounded">
              <span className="text-[#8da7c7] font-medium text-[11px]">Forwarding Unit:</span>
              <button
                onClick={onToggleForwarding}
                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors ${
                  cpuState.config.forwardingEnabled
                    ? 'bg-[#06b6d4] text-[#00152f]'
                    : 'bg-[#475569] text-white hover:bg-[#64748b]'
                }`}
                title="Toggle EX/MEM and MEM/WB hardware forwarding paths"
              >
                {cpuState.config.forwardingEnabled ? 'ENABLED (NO STALL)' : 'DISABLED (STALL)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
