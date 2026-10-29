/**
 * Architecture Cadence - 5-Stage Pipelined CPU Simulation Engine
 * Stages: IF (Fetch) -> ID (Decode) -> EX (Execute) -> MEM (Memory) -> WB (Writeback)
 * Implements Hazard Detection, Forwarding Unit, Branch Resolution, and Cache coupling.
 */

import {
  CPUState,
  Instruction,
  ControlSignals,
  PipelineState,
  EXStage,
  ForwardingPath,
  HazardEvent,
  SpaceTimeEntry,
} from '../types/architecture';
import { accessCache, createDefaultCacheConfig, initCache } from './cache';

export function createInitialControlSignals(): ControlSignals {
  return {
    regWrite: false,
    aluSrc: false,
    memRead: false,
    memWrite: false,
    branch: false,
    memToReg: false,
    aluOp: 'NOP',
  };
}

export function createInitialCPUState(): CPUState {
  const regs = new Array(32).fill(0);
  regs[2] = 0x7ffffff0; // Initial stack pointer (sp)

  const emptyControls = createInitialControlSignals();

  const pipeline: PipelineState = {
    if: { status: 'empty', pc: 0 },
    id: { status: 'empty', rs1Val: 0, rs2Val: 0, imm: 0, controls: emptyControls },
    ex: {
      status: 'empty',
      aluResult: 0,
      zeroFlag: false,
      opA: 0,
      opB: 0,
      forwardA: 'NONE',
      forwardB: 'NONE',
      controls: emptyControls,
    },
    mem: { status: 'empty', aluResult: 0, writeData: 0, readData: 0, controls: emptyControls },
    wb: { status: 'empty', writeData: 0, regWrite: false },
  };

  const memory = new Map<number, number>();
  // Pre-seed some sample data in data segment (0x1000 - 0x1020)
  memory.set(0x1000, 42);
  memory.set(0x1004, 100);
  memory.set(0x1008, 255);
  memory.set(0x100c, 1024);

  return {
    pc: 0,
    nextPc: 4,
    cycle: 0,
    instructionCount: 0,
    stalls: 0,
    flushes: 0,
    forwardingEvents: 0,
    registers: regs,
    memory,
    pipeline,
    forwardingPaths: [],
    recentHazards: [],
    spaceTimeDiagram: [],
    isHalted: false,
    config: {
      forwardingEnabled: true,
      branchDelaySlot: false,
      hazardDetectionEnabled: true,
    },
    cache: initCache(createDefaultCacheConfig()),
  };
}

function getControlSignals(inst?: Instruction): ControlSignals {
  if (!inst) return createInitialControlSignals();
  const op = inst.opcode;

  switch (op) {
    case 'add':
      return { regWrite: true, aluSrc: false, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'ADD' };
    case 'sub':
      return { regWrite: true, aluSrc: false, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'SUB' };
    case 'and':
      return { regWrite: true, aluSrc: false, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'AND' };
    case 'or':
      return { regWrite: true, aluSrc: false, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'OR' };
    case 'xor':
      return { regWrite: true, aluSrc: false, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'XOR' };
    case 'sll':
      return { regWrite: true, aluSrc: false, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'SLL' };
    case 'srl':
      return { regWrite: true, aluSrc: false, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'SRL' };
    case 'slt':
      return { regWrite: true, aluSrc: false, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'SLT' };

    case 'addi':
      return { regWrite: true, aluSrc: true, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'ADD' };
    case 'andi':
      return { regWrite: true, aluSrc: true, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'AND' };
    case 'ori':
      return { regWrite: true, aluSrc: true, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'OR' };
    case 'xori':
      return { regWrite: true, aluSrc: true, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'XOR' };
    case 'slli':
      return { regWrite: true, aluSrc: true, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'SLL' };
    case 'srli':
      return { regWrite: true, aluSrc: true, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'SRL' };
    case 'slti':
      return { regWrite: true, aluSrc: true, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'SLT' };

    case 'lw':
      return { regWrite: true, aluSrc: true, memRead: true, memWrite: false, branch: false, memToReg: true, aluOp: 'ADD' };
    case 'sw':
      return { regWrite: false, aluSrc: true, memRead: false, memWrite: true, branch: false, memToReg: false, aluOp: 'ADD' };

    case 'beq':
    case 'bne':
    case 'blt':
    case 'bge':
      return { regWrite: false, aluSrc: false, memRead: false, memWrite: false, branch: true, memToReg: false, aluOp: 'SUB' };

    case 'j':
    case 'jal':
      return { regWrite: (inst.rd ?? 0) !== 0, aluSrc: false, memRead: false, memWrite: false, branch: false, memToReg: false, aluOp: 'ADD' };

    case 'nop':
    case 'halt':
    default:
      return createInitialControlSignals();
  }
}

function executeALU(op: ControlSignals['aluOp'], a: number, b: number): { result: number; zero: boolean } {
  let res = 0;
  switch (op) {
    case 'ADD':
      res = (a + b) | 0;
      break;
    case 'SUB':
      res = (a - b) | 0;
      break;
    case 'AND':
      res = a & b;
      break;
    case 'OR':
      res = a | b;
      break;
    case 'XOR':
      res = a ^ b;
      break;
    case 'SLL':
      res = a << (b & 0x1f);
      break;
    case 'SRL':
      res = a >>> (b & 0x1f);
      break;
    case 'SLT':
      res = a < b ? 1 : 0;
      break;
    case 'NOP':
    default:
      res = 0;
      break;
  }
  return { result: res, zero: res === 0 };
}

export function stepCPU(state: CPUState, instructionList: Instruction[]): CPUState {
  if (state.isHalted) {
    return state;
  }

  const nextCycle = state.cycle + 1;
  const newRegisters = [...state.registers];
  const newMemory = new Map(state.memory);
  let newCache = state.cache;

  const currentIf = state.pipeline.if;
  const currentId = state.pipeline.id;
  const currentEx = state.pipeline.ex;
  const currentMem = state.pipeline.mem;
  const currentWb = state.pipeline.wb;

  const hazards: HazardEvent[] = [];
  const forwardingPaths: ForwardingPath[] = [];
  let stallCycle = false;
  let flushPipeline = false;
  let branchTargetAddress: number | null = null;
  let completedInstruction = false;

  // 1. WB Stage (Writeback to register file)
  if (currentWb.status === 'active' && currentWb.instruction) {
    const rd = currentWb.rd;
    if (currentWb.regWrite && rd !== undefined && rd > 0) {
      newRegisters[rd] = currentWb.writeData;
    }
    completedInstruction = true;
  }

  // 2. MEM Stage (Data memory read/write)
  let nextWbData = currentMem.aluResult;
  let readMemVal = 0;

  if (currentMem.status === 'active' && currentMem.instruction) {
    const addr = currentMem.aluResult;

    if (currentMem.controls.memWrite) {
      // Store Word
      newMemory.set(addr, currentMem.writeData);
      const cacheRes = accessCache(newCache, addr, true, nextCycle);
      newCache = cacheRes.cache;
    } else if (currentMem.controls.memRead) {
      // Load Word
      readMemVal = newMemory.get(addr) ?? 0;
      nextWbData = readMemVal;
      const cacheRes = accessCache(newCache, addr, false, nextCycle);
      newCache = cacheRes.cache;
    }
  }

  // 3. EX Stage Execution & Branch Evaluation
  let exAluResult = 0;
  let exZeroFlag = false;
  let exOpA = currentEx.opA;
  let exOpB = currentEx.opB;
  let forwardA: EXStage['forwardA'] = 'NONE';
  let forwardB: EXStage['forwardB'] = 'NONE';

  if (currentEx.status === 'active' && currentEx.instruction) {
    const exInst = currentEx.instruction;
    const rs1 = exInst.rs1;
    const rs2 = exInst.rs2;

    // Forwarding Unit
    if (state.config.forwardingEnabled) {
      // Forward to Operand A: check MEM stage (EX/MEM hazard)
      if (
        currentMem.controls.regWrite &&
        currentMem.rd !== undefined &&
        currentMem.rd !== 0 &&
        rs1 !== undefined &&
        currentMem.rd === rs1
      ) {
        forwardA = 'EX_EX';
        exOpA = currentMem.aluResult;
        forwardingPaths.push({
          active: true,
          fromStage: 'EX',
          toStage: 'EX',
          sourceReg: rs1,
          targetOperand: 'A',
          value: exOpA,
        });
      }
      // MEM/WB hazard
      else if (
        currentWb.regWrite &&
        currentWb.rd !== undefined &&
        currentWb.rd !== 0 &&
        rs1 !== undefined &&
        currentWb.rd === rs1
      ) {
        forwardA = 'MEM_EX';
        exOpA = currentWb.writeData;
        forwardingPaths.push({
          active: true,
          fromStage: 'MEM',
          toStage: 'EX',
          sourceReg: rs1,
          targetOperand: 'A',
          value: exOpA,
        });
      }

      // Forward to Operand B: check MEM stage (EX/MEM hazard)
      if (
        !currentEx.controls.aluSrc &&
        currentMem.controls.regWrite &&
        currentMem.rd !== undefined &&
        currentMem.rd !== 0 &&
        rs2 !== undefined &&
        currentMem.rd === rs2
      ) {
        forwardB = 'EX_EX';
        exOpB = currentMem.aluResult;
        forwardingPaths.push({
          active: true,
          fromStage: 'EX',
          toStage: 'EX',
          sourceReg: rs2,
          targetOperand: 'B',
          value: exOpB,
        });
      }
      // MEM/WB hazard
      else if (
        !currentEx.controls.aluSrc &&
        currentWb.regWrite &&
        currentWb.rd !== undefined &&
        currentWb.rd !== 0 &&
        rs2 !== undefined &&
        currentWb.rd === rs2
      ) {
        forwardB = 'MEM_EX';
        exOpB = currentWb.writeData;
        forwardingPaths.push({
          active: true,
          fromStage: 'MEM',
          toStage: 'EX',
          sourceReg: rs2,
          targetOperand: 'B',
          value: exOpB,
        });
      }
    }

    // ALU Calculation
    const aluRes = executeALU(currentEx.controls.aluOp, exOpA, exOpB);
    exAluResult = aluRes.result;
    exZeroFlag = aluRes.zero;

    // Branch Resolution
    if (currentEx.controls.branch) {
      let branchTaken = false;
      if (exInst.opcode === 'beq') branchTaken = exOpA === exOpB;
      else if (exInst.opcode === 'bne') branchTaken = exOpA !== exOpB;
      else if (exInst.opcode === 'blt') branchTaken = exOpA < exOpB;
      else if (exInst.opcode === 'bge') branchTaken = exOpA >= exOpB;

      if (branchTaken) {
        branchTargetAddress = exInst.address + (exInst.imm ?? 0);
        flushPipeline = true;
        hazards.push({
          id: `h-branch-${nextCycle}`,
          cycle: nextCycle,
          type: 'BRANCH_FLUSH',
          stage: 'EX',
          instructionText: exInst.text,
          description: `Branch taken to 0x${branchTargetAddress.toString(16).toUpperCase()} - 2 cycles flushed (IF/ID)`,
          resolution: 'Pipeline Flushed',
          stalledStages: ['IF', 'ID'],
        });
      }
    } else if (exInst.opcode === 'j' || exInst.opcode === 'jal') {
      branchTargetAddress = exInst.address + (exInst.imm ?? 0);
      flushPipeline = true;
      if (exInst.opcode === 'jal') {
        exAluResult = exInst.address + 4; // return address
      }
    }
  }

  // 4. Hazard Detection Unit (Load-Use Hazard & RAW No-Forwarding Stalls)
  if (state.config.hazardDetectionEnabled && currentId.status === 'active' && currentId.instruction) {
    const idInst = currentId.instruction;
    const idRs1 = idInst.rs1;
    const idRs2 = idInst.rs2;

    // Check Load-Use Hazard: EX stage is a load and destination matches ID operands
    if (
      currentEx.status === 'active' &&
      currentEx.controls.memRead &&
      currentEx.rd !== undefined &&
      currentEx.rd !== 0
    ) {
      const loadDest = currentEx.rd;
      const needsRs1 = idRs1 !== undefined && idRs1 === loadDest;
      const needsRs2 =
        idRs2 !== undefined &&
        idRs2 === loadDest &&
        ['add', 'sub', 'and', 'or', 'xor', 'sll', 'srl', 'slt', 'sw', 'beq', 'bne', 'blt', 'bge'].includes(
          idInst.opcode
        );

      if (needsRs1 || needsRs2) {
        stallCycle = true;
        hazards.push({
          id: `h-loaduse-${nextCycle}`,
          cycle: nextCycle,
          type: 'LOAD_USE',
          stage: 'ID',
          instructionText: idInst.text,
          description: `Load-Use hazard on register x${loadDest} from "${currentEx.instruction?.text}"`,
          resolution: '1-Cycle Bubble Inserted into EX; IF/ID frozen',
          stalledStages: ['IF', 'ID'],
        });
      }
    }

    // Check RAW Hazard when Forwarding is DISABLED
    if (!state.config.forwardingEnabled && !stallCycle) {
      const checkRawWithStage = (stageRd: number | undefined, stageRegWrite: boolean, stageName: string) => {
        if (!stageRegWrite || !stageRd || stageRd === 0) return false;
        const conflictsWithRs1 = idRs1 !== undefined && idRs1 === stageRd;
        const conflictsWithRs2 = idRs2 !== undefined && idRs2 === stageRd;
        return conflictsWithRs1 || conflictsWithRs2;
      };

      if (
        currentEx.status === 'active' &&
        checkRawWithStage(currentEx.rd, currentEx.controls.regWrite, 'EX')
      ) {
        stallCycle = true;
        hazards.push({
          id: `h-raw-${nextCycle}`,
          cycle: nextCycle,
          type: 'RAW_DATA',
          stage: 'ID',
          instructionText: idInst.text,
          description: `RAW hazard on register without forwarding (Producer in EX: "${currentEx.instruction?.text}")`,
          resolution: 'Stall until writeback completes',
          stalledStages: ['IF', 'ID'],
        });
      } else if (
        currentMem.status === 'active' &&
        checkRawWithStage(currentMem.rd, currentMem.controls.regWrite, 'MEM')
      ) {
        stallCycle = true;
        hazards.push({
          id: `h-raw-mem-${nextCycle}`,
          cycle: nextCycle,
          type: 'RAW_DATA',
          stage: 'ID',
          instructionText: idInst.text,
          description: `RAW hazard on register without forwarding (Producer in MEM: "${currentMem.instruction?.text}")`,
          resolution: 'Stall until writeback completes',
          stalledStages: ['IF', 'ID'],
        });
      }
    }
  }

  // 5. Advance Stages & Prepare Next Pipeline State
  const nextPipeline: PipelineState = {
    if: { status: 'empty', pc: state.pc },
    id: { status: 'empty', rs1Val: 0, rs2Val: 0, imm: 0, controls: createInitialControlSignals() },
    ex: {
      status: 'empty',
      aluResult: 0,
      zeroFlag: false,
      opA: 0,
      opB: 0,
      forwardA: 'NONE',
      forwardB: 'NONE',
      controls: createInitialControlSignals(),
    },
    mem: { status: 'empty', aluResult: 0, writeData: 0, readData: 0, controls: createInitialControlSignals() },
    wb: { status: 'empty', writeData: 0, regWrite: false },
  };

  // Move MEM -> WB
  if (currentMem.status === 'active') {
    nextPipeline.wb = {
      status: 'active',
      instruction: currentMem.instruction,
      writeData: currentMem.controls.memToReg ? readMemVal : currentMem.aluResult,
      rd: currentMem.rd,
      regWrite: currentMem.controls.regWrite,
    };
  } else {
    nextPipeline.wb = { status: 'empty', writeData: 0, regWrite: false };
  }

  // Move EX -> MEM
  if (currentEx.status === 'active') {
    nextPipeline.mem = {
      status: 'active',
      instruction: currentEx.instruction,
      aluResult: exAluResult,
      writeData: exOpB,
      readData: 0,
      rd: currentEx.rd,
      controls: currentEx.controls,
    };
  } else {
    nextPipeline.mem = {
      status: 'empty',
      aluResult: 0,
      writeData: 0,
      readData: 0,
      controls: createInitialControlSignals(),
    };
  }

  // Handle Flush / Stall logic for ID -> EX and IF -> ID
  let nextPc = state.pc;

  if (flushPipeline && branchTargetAddress !== null) {
    // Flush both IF and ID stages
    nextPipeline.ex = {
      status: 'bubble',
      aluResult: 0,
      zeroFlag: false,
      opA: 0,
      opB: 0,
      forwardA: 'NONE',
      forwardB: 'NONE',
      controls: createInitialControlSignals(),
    };
    nextPipeline.id = {
      status: 'flushed',
      rs1Val: 0,
      rs2Val: 0,
      imm: 0,
      controls: createInitialControlSignals(),
    };
    nextPipeline.if = {
      status: 'flushed',
      pc: branchTargetAddress,
    };
    nextPc = branchTargetAddress;
  } else if (stallCycle) {
    // Insert Bubble into EX
    nextPipeline.ex = {
      status: 'bubble',
      aluResult: 0,
      zeroFlag: false,
      opA: 0,
      opB: 0,
      forwardA: 'NONE',
      forwardB: 'NONE',
      controls: createInitialControlSignals(),
    };
    // Keep ID frozen
    nextPipeline.id = { ...currentId, status: 'stalled' };
    // Keep IF frozen
    nextPipeline.if = { ...currentIf, status: 'stalled' };
    // Do not advance PC
    nextPc = state.pc;
  } else {
    // Move ID -> EX
    if (currentId.status === 'active' && currentId.instruction) {
      const idInst = currentId.instruction;
      const rs1 = idInst.rs1 ?? 0;
      const rs2 = idInst.rs2 ?? 0;

      // Handle register read with internal forwarding if WB is writing this cycle
      let opA = newRegisters[rs1] ?? 0;
      let opB = idInst.imm !== undefined && currentId.controls.aluSrc ? idInst.imm : (newRegisters[rs2] ?? 0);

      // If WB is writing this cycle to rs1/rs2 and rd != 0, capture updated value directly
      if (currentWb.status === 'active' && currentWb.regWrite && currentWb.rd) {
        if (rs1 === currentWb.rd) opA = currentWb.writeData;
        if (!currentId.controls.aluSrc && rs2 === currentWb.rd) opB = currentWb.writeData;
      }

      nextPipeline.ex = {
        status: 'active',
        instruction: idInst,
        aluResult: 0,
        zeroFlag: false,
        opA,
        opB,
        forwardA,
        forwardB,
        rd: idInst.rd,
        controls: currentId.controls,
      };
    } else {
      nextPipeline.ex = {
        status: 'empty',
        aluResult: 0,
        zeroFlag: false,
        opA: 0,
        opB: 0,
        forwardA: 'NONE',
        forwardB: 'NONE',
        controls: createInitialControlSignals(),
      };
    }

    // Move IF -> ID
    if (currentIf.status === 'active' && currentIf.instruction) {
      const fetchedInst = currentIf.instruction;
      const controls = getControlSignals(fetchedInst);
      const rs1Val = newRegisters[fetchedInst.rs1 ?? 0] ?? 0;
      const rs2Val = newRegisters[fetchedInst.rs2 ?? 0] ?? 0;

      nextPipeline.id = {
        status: 'active',
        instruction: fetchedInst,
        rs1Val,
        rs2Val,
        imm: fetchedInst.imm ?? 0,
        controls,
      };
    } else {
      nextPipeline.id = {
        status: 'empty',
        rs1Val: 0,
        rs2Val: 0,
        imm: 0,
        controls: createInitialControlSignals(),
      };
    }

    // Fetch New Instruction into IF
    const fetchedInst = instructionList.find((i) => i.address === nextPc);
    if (fetchedInst) {
      nextPipeline.if = {
        status: 'active',
        pc: nextPc,
        instruction: fetchedInst,
      };
      nextPc += 4;
    } else {
      nextPipeline.if = {
        status: 'empty',
        pc: nextPc,
      };
    }
  }

  // Check Halt condition: pipeline is completely empty and PC exceeded program
  const maxAddress = instructionList.length > 0 ? Math.max(...instructionList.map((i) => i.address)) + 4 : 0;
  const isPipelineEmpty =
    nextPipeline.if.status === 'empty' &&
    nextPipeline.id.status === 'empty' &&
    nextPipeline.ex.status === 'empty' &&
    nextPipeline.mem.status === 'empty' &&
    nextPipeline.wb.status === 'empty';

  const isHalted = nextPc >= maxAddress && isPipelineEmpty && instructionList.length > 0;

  // Build space-time entry for timing diagram
  const spaceTimeItem: SpaceTimeEntry = {
    cycle: nextCycle,
    if: nextPipeline.if.instruction?.text,
    id: nextPipeline.id.instruction?.text,
    ex: nextPipeline.ex.instruction?.text,
    mem: nextPipeline.mem.instruction?.text,
    wb: nextPipeline.wb.instruction?.text,
    hazardNote: hazards.length > 0 ? hazards.map((h) => h.type).join(', ') : undefined,
  };

  const updatedDiagram = [...state.spaceTimeDiagram, spaceTimeItem].slice(-40);

  return {
    ...state,
    pc: nextPc,
    nextPc: nextPc + 4,
    cycle: nextCycle,
    instructionCount: state.instructionCount + (completedInstruction ? 1 : 0),
    stalls: state.stalls + (stallCycle ? 1 : 0),
    flushes: state.flushes + (flushPipeline ? 1 : 0),
    forwardingEvents: state.forwardingEvents + forwardingPaths.length,
    registers: newRegisters,
    memory: newMemory,
    pipeline: nextPipeline,
    forwardingPaths,
    recentHazards: hazards.length > 0 ? [...hazards, ...state.recentHazards].slice(0, 10) : state.recentHazards,
    spaceTimeDiagram: updatedDiagram,
    isHalted,
    cache: newCache,
  };
}
