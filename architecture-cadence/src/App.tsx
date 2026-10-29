/**
 * Architecture Cadence - Computer Systems & CPU Pipeline Workbench
 * Main Application Component uniting 5-Stage Datapath, Register File,
 * Cache Visualizer, Hazard Matrix, and Assembly Program Lab.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { HeaderBar } from './components/HeaderBar';
import { NavigationTabs, TabId } from './components/NavigationTabs';
import { PipelineCanvas } from './components/PipelineCanvas';
import { TimingDiagram } from './components/TimingDiagram';
import { RegisterMatrix } from './components/RegisterMatrix';
import { MemoryInspector } from './components/MemoryInspector';
import { CacheVisualizer } from './components/CacheVisualizer';
import { HazardMatrix } from './components/HazardMatrix';
import { ProgramEditor } from './components/ProgramEditor';
import { ArchitectureGuideModal } from './components/ArchitectureGuideModal';

import { createInitialCPUState, stepCPU } from './simulator/cpu';
import { assemble } from './simulator/assembler';
import { PRESET_PROGRAMS } from './simulator/programs';
import { CPUState, CacheState } from './types/architecture';

export default function App() {
  // Initialize with the RAW Hazard & Forwarding preset program
  const defaultProgram = PRESET_PROGRAMS[0].code;
  const initialAssemble = assemble(defaultProgram);

  const [code, setCode] = useState<string>(defaultProgram);
  const [instructions, setInstructions] = useState(initialAssemble.instructions);
  const [errors, setErrors] = useState(initialAssemble.errors);

  const [cpuState, setCpuState] = useState<CPUState>(createInitialCPUState);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [clockHz, setClockHz] = useState<number>(1.5);
  const [activeTab, setActiveTab] = useState<TabId>('pipeline');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // References for interval loop
  const cpuStateRef = useRef<CPUState>(cpuState);
  cpuStateRef.current = cpuState;

  const instructionsRef = useRef(instructions);
  instructionsRef.current = instructions;

  // Single step clock pulse execution
  const handleStepCycle = useCallback(() => {
    setCpuState((prev) => {
      const next = stepCPU(prev, instructionsRef.current);
      if (next.isHalted) {
        setIsRunning(false);
      }
      return next;
    });
  }, []);

  // Clock runner timer
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = Math.max(80, Math.round(1000 / clockHz));
    const timer = setInterval(() => {
      if (cpuStateRef.current.isHalted) {
        setIsRunning(false);
        return;
      }
      handleStepCycle();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, clockHz, handleStepCycle]);

  // Handle program assemble and reload
  const handleAssembleAndLoad = useCallback((newCode: string) => {
    const res = assemble(newCode);
    setCode(newCode);
    setInstructions(res.instructions);
    setErrors(res.errors);
    setIsRunning(false);

    // Reset CPU with the new instructions
    setCpuState(createInitialCPUState());
  }, []);

  // Reset CPU state while keeping instructions
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setCpuState(createInitialCPUState());
  }, []);

  // Toggle run state
  const handleToggleRun = useCallback(() => {
    if (cpuState.isHalted) return;
    setIsRunning((prev) => !prev);
  }, [cpuState.isHalted]);

  // Update register
  const handleUpdateRegister = useCallback((index: number, value: number) => {
    if (index === 0) return;
    setCpuState((prev) => {
      const newRegs = [...prev.registers];
      newRegs[index] = value;
      return { ...prev, registers: newRegs };
    });
  }, []);

  // Write memory word
  const handleWriteMemory = useCallback((address: number, value: number) => {
    setCpuState((prev) => {
      const newMem = new Map(prev.memory);
      newMem.set(address, value);
      return { ...prev, memory: newMem };
    });
  }, []);

  // Update Cache state
  const handleUpdateCache = useCallback((newCache: CacheState) => {
    setCpuState((prev) => ({
      ...prev,
      cache: newCache,
    }));
  }, []);

  // Toggle hardware forwarding
  const handleToggleForwarding = useCallback(() => {
    setCpuState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        forwardingEnabled: !prev.config.forwardingEnabled,
      },
    }));
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0d1c2e] flex flex-col font-body selection:bg-[#cce5ff] selection:text-[#001d31]">
      {/* Top Header Bar & Control Ribbon */}
      <HeaderBar
        cpuState={cpuState}
        isRunning={isRunning}
        clockHz={clockHz}
        onStep={handleStepCycle}
        onToggleRun={handleToggleRun}
        onReset={handleReset}
        onClockHzChange={setClockHz}
        onToggleForwarding={handleToggleForwarding}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Primary Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hazardCount={cpuState.recentHazards.length}
      />

      {/* Main Content Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'pipeline' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 5-Stage Datapath Connected Canvas */}
            <PipelineCanvas cpuState={cpuState} />

            {/* Timing Space-Time Matrix */}
            <TimingDiagram
              entries={cpuState.spaceTimeDiagram}
              currentCycle={cpuState.cycle}
            />

            {/* Quick Register View Below Pipeline */}
            <RegisterMatrix
              registers={cpuState.registers}
              onUpdateRegister={handleUpdateRegister}
            />
          </div>
        )}

        {activeTab === 'registers' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 32 Architectural Registers */}
            <RegisterMatrix
              registers={cpuState.registers}
              onUpdateRegister={handleUpdateRegister}
            />

            {/* RAM Data Segment Inspector */}
            <MemoryInspector
              memory={cpuState.memory}
              onWriteMemory={handleWriteMemory}
              lastAccessedAddress={cpuState.pipeline.mem.aluResult}
            />
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="animate-in fade-in duration-150">
            <CacheVisualizer
              cache={cpuState.cache}
              onUpdateCache={handleUpdateCache}
              currentCycle={cpuState.cycle}
            />
          </div>
        )}

        {activeTab === 'hazards' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <HazardMatrix
              cpuState={cpuState}
              onToggleForwarding={handleToggleForwarding}
            />

            <TimingDiagram
              entries={cpuState.spaceTimeDiagram}
              currentCycle={cpuState.cycle}
            />
          </div>
        )}

        {activeTab === 'assembler' && (
          <div className="animate-in fade-in duration-150">
            <ProgramEditor
              currentCode={code}
              instructions={instructions}
              currentPc={cpuState.pc}
              onAssembleAndLoad={handleAssembleAndLoad}
              errors={errors}
            />
          </div>
        )}
      </main>

      {/* Microarchitecture Reference Manual Modal */}
      <ArchitectureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Institutional Engineering Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-3 px-4 text-xs text-[#64748b] select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-heading font-bold text-[#0f2a4a]">
              ARCHITECTURE CADENCE
            </span>
            <span>&bull;</span>
            <span>5-Stage Pipelined RV32I Processor Simulator &amp; Cache Analyzer</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span>Synchronous Rising-Edge Clock</span>
            <span>&bull;</span>
            <span className="text-[#0284c7]">L1 Data Cache Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
