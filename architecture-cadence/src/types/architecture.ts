/**
 * Architecture Cadence - Type Definitions
 * Microarchitecture, CPU Pipeline, Register File, Cache & Hazards
 */

export type StageName = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB';

export type StageStatus = 'empty' | 'active' | 'stalled' | 'bubble' | 'flushed';

export interface Instruction {
  id: string;
  address: number;
  text: string;
  opcode: string;
  rd?: number;
  rs1?: number;
  rs2?: number;
  imm?: number;
  rawMachineCode: number; // 32-bit binary representation
  hexCode: string;
  label?: string;
  targetLabel?: string;
  lineNum: number;
}

export interface ControlSignals {
  regWrite: boolean;
  aluSrc: boolean; // false = reg, true = imm
  memRead: boolean;
  memWrite: boolean;
  branch: boolean;
  memToReg: boolean; // false = aluResult, true = memData
  aluOp: 'ADD' | 'SUB' | 'AND' | 'OR' | 'XOR' | 'SLL' | 'SRL' | 'SLT' | 'NOP';
}

export interface IFStage {
  status: StageStatus;
  pc: number;
  instruction?: Instruction;
}

export interface IDStage {
  status: StageStatus;
  instruction?: Instruction;
  rs1Val: number;
  rs2Val: number;
  imm: number;
  controls: ControlSignals;
  stallReason?: string;
}

export interface EXStage {
  status: StageStatus;
  instruction?: Instruction;
  aluResult: number;
  zeroFlag: boolean;
  opA: number;
  opB: number;
  forwardA: 'NONE' | 'EX_EX' | 'MEM_EX';
  forwardB: 'NONE' | 'EX_EX' | 'MEM_EX';
  rd?: number;
  controls: ControlSignals;
}

export interface MEMStage {
  status: StageStatus;
  instruction?: Instruction;
  aluResult: number;
  writeData: number;
  readData: number;
  rd?: number;
  controls: ControlSignals;
}

export interface WBStage {
  status: StageStatus;
  instruction?: Instruction;
  writeData: number;
  rd?: number;
  regWrite: boolean;
}

export interface HazardEvent {
  id: string;
  cycle: number;
  type: 'RAW_DATA' | 'LOAD_USE' | 'BRANCH_FLUSH' | 'STRUCTURAL';
  stage: StageName;
  instructionText: string;
  description: string;
  resolution: string;
  stalledStages: StageName[];
}

export interface ForwardingPath {
  active: boolean;
  fromStage: 'EX' | 'MEM';
  toStage: 'EX';
  sourceReg: number;
  targetOperand: 'A' | 'B';
  value: number;
}

export interface PipelineState {
  if: IFStage;
  id: IDStage;
  ex: EXStage;
  mem: MEMStage;
  wb: WBStage;
}

export interface SpaceTimeEntry {
  cycle: number;
  if?: string;
  id?: string;
  ex?: string;
  mem?: string;
  wb?: string;
  hazardNote?: string;
}

export interface RegisterInfo {
  index: number;
  name: string;
  abi: string;
  value: number;
  updatedThisCycle: boolean;
  description: string;
}

export interface CacheLine {
  valid: boolean;
  dirty: boolean;
  tag: number;
  data: number[]; // Block of 4 words (16 bytes)
  lastUsedCycle: number;
}

export interface CacheSet {
  index: number;
  lines: CacheLine[];
}

export type CacheAssociativity = 1 | 2 | 4; // 1 = Direct mapped, 2 = 2-way, 4 = 4-way

export interface CacheConfig {
  totalBytes: number; // e.g., 256 or 512
  blockSizeBytes: number; // e.g., 16 (4 words)
  associativity: CacheAssociativity;
}

export interface CacheAccessEvent {
  cycle: number;
  address: number;
  tag: number;
  setIndex: number;
  offset: number;
  isHit: boolean;
  isWrite: boolean;
  evictedTag?: number;
  wayIndex: number;
}

export interface CacheState {
  config: CacheConfig;
  sets: CacheSet[];
  numSets: number;
  tagBits: number;
  indexBits: number;
  offsetBits: number;
  hits: number;
  misses: number;
  evictions: number;
  totalAccesses: number;
  recentAccess?: CacheAccessEvent;
}

export interface CPUState {
  pc: number;
  nextPc: number;
  cycle: number;
  instructionCount: number;
  stalls: number;
  flushes: number;
  forwardingEvents: number;
  registers: number[]; // 32 registers
  memory: Map<number, number>; // address -> 32-bit word
  pipeline: PipelineState;
  forwardingPaths: ForwardingPath[];
  recentHazards: HazardEvent[];
  spaceTimeDiagram: SpaceTimeEntry[];
  isHalted: boolean;
  config: {
    forwardingEnabled: boolean;
    branchDelaySlot: boolean;
    hazardDetectionEnabled: boolean;
  };
  cache: CacheState;
}
