/**
 * Architecture Cadence - RISC-V Assembler & Machine Code Encoder
 * Parses assembly into typed Instruction AST with 32-bit machine code and label resolution.
 */

import { Instruction } from '../types/architecture';

export const ABI_REGISTER_MAP: Record<string, number> = {
  zero: 0,
  ra: 1,
  sp: 2,
  gp: 3,
  tp: 4,
  t0: 5,
  t1: 6,
  t2: 7,
  s0: 8,
  fp: 8,
  s1: 9,
  a0: 10,
  a1: 11,
  a2: 12,
  a3: 13,
  a4: 14,
  a5: 15,
  a6: 16,
  a7: 17,
  s2: 18,
  s3: 19,
  s4: 20,
  s5: 21,
  s6: 22,
  s7: 23,
  s8: 24,
  s9: 25,
  s10: 26,
  s11: 27,
  t3: 28,
  t4: 29,
  t5: 30,
  t6: 31,
};

export const REGISTER_DESCRIPTIONS: string[] = [
  'Hardwired zero',
  'Return address',
  'Stack pointer',
  'Global pointer',
  'Thread pointer',
  'Temporary 0',
  'Temporary 1',
  'Temporary 2',
  'Saved register 0 / Frame pointer',
  'Saved register 1',
  'Function argument 0 / Return val',
  'Function argument 1 / Return val',
  'Function argument 2',
  'Function argument 3',
  'Function argument 4',
  'Function argument 5',
  'Function argument 6',
  'Function argument 7',
  'Saved register 2',
  'Saved register 3',
  'Saved register 4',
  'Saved register 5',
  'Saved register 6',
  'Saved register 7',
  'Saved register 8',
  'Saved register 9',
  'Saved register 10',
  'Saved register 11',
  'Temporary 3',
  'Temporary 4',
  'Temporary 5',
  'Temporary 6',
];

export function parseRegister(regStr: string): number {
  const clean = regStr.trim().toLowerCase();
  if (clean.startsWith('x') || clean.startsWith('r')) {
    const num = parseInt(clean.substring(1), 10);
    if (!isNaN(num) && num >= 0 && num <= 31) {
      return num;
    }
  }
  if (clean in ABI_REGISTER_MAP) {
    return ABI_REGISTER_MAP[clean];
  }
  throw new Error(`Invalid register: "${regStr}"`);
}

export interface AssembleResult {
  instructions: Instruction[];
  errors: Array<{ line: number; message: string }>;
  labelMap: Record<string, number>;
}

export function assemble(code: string): AssembleResult {
  const lines = code.split('\n');
  const errors: Array<{ line: number; message: string }> = [];
  const labelMap: Record<string, number> = {};

  interface IntermediateLine {
    lineNum: number;
    address: number;
    rawText: string;
    label?: string;
    opcode?: string;
    args?: string[];
  }

  const intermediate: IntermediateLine[] = [];
  let currentAddress = 0x0000;

  // Pass 1: strip comments, gather labels & addresses
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    // Strip comments
    const commentIdx = line.search(/#|\/\//);
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx).trim();
    }
    if (!line) continue;

    let label: string | undefined;
    if (line.includes(':')) {
      const parts = line.split(':');
      label = parts[0].trim();
      labelMap[label] = currentAddress;
      line = parts.slice(1).join(':').trim();
    }

    if (!line) {
      if (label) {
        intermediate.push({
          lineNum: i + 1,
          address: currentAddress,
          rawText: lines[i],
          label,
        });
      }
      continue;
    }

    // Split opcode and arguments
    const spaceIdx = line.search(/\s/);
    let opcode: string;
    let argString = '';
    if (spaceIdx === -1) {
      opcode = line.toLowerCase();
    } else {
      opcode = line.substring(0, spaceIdx).trim().toLowerCase();
      argString = line.substring(spaceIdx).trim();
    }

    // Split args by comma
    const args = argString
      ? argString.split(',').map((a) => a.trim())
      : [];

    intermediate.push({
      lineNum: i + 1,
      address: currentAddress,
      rawText: line,
      label,
      opcode,
      args,
    });

    currentAddress += 4;
  }

  const instructions: Instruction[] = [];

  // Pass 2: encode instructions
  for (const item of intermediate) {
    if (!item.opcode) continue;

    try {
      const inst = encodeInstruction(item as typeof item & { opcode: string }, labelMap);
      instructions.push(inst);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ line: item.lineNum, message: msg });
    }
  }

  return { instructions, errors, labelMap };
}

function parseMemOperand(op: string): { offset: number; rs1: number } {
  // Format: offset(rs1) e.g. "4(x2)" or "0(sp)"
  const match = op.match(/^(-?\d+)\s*\(([^)]+)\)$/);
  if (match) {
    const offset = parseInt(match[1], 10);
    const rs1 = parseRegister(match[2]);
    return { offset, rs1 };
  }
  // Alternate: "(rs1)" with 0 offset
  const matchNoOffset = op.match(/^\(([^)]+)\)$/);
  if (matchNoOffset) {
    const rs1 = parseRegister(matchNoOffset[1]);
    return { offset: 0, rs1 };
  }
  throw new Error(`Invalid memory operand format: "${op}". Expected "offset(reg)"`);
}

function encodeInstruction(
  item: { lineNum: number; address: number; rawText: string; label?: string; opcode: string; args?: string[] },
  labelMap: Record<string, number>
): Instruction {
  const op = item.opcode;
  const args = item.args || [];
  let rd = 0;
  let rs1 = 0;
  let rs2 = 0;
  let imm = 0;
  let targetLabel: string | undefined;

  // Handle pseudo instructions
  if (op === 'nop') {
    return {
      id: `inst-${item.address}`,
      address: item.address,
      text: 'nop',
      opcode: 'nop',
      rd: 0,
      rs1: 0,
      rs2: 0,
      imm: 0,
      rawMachineCode: 0x00000013, // addi x0, x0, 0
      hexCode: '0x00000013',
      label: item.label,
      lineNum: item.lineNum,
    };
  }

  if (op === 'halt') {
    return {
      id: `inst-${item.address}`,
      address: item.address,
      text: 'halt',
      opcode: 'halt',
      rawMachineCode: 0x0000006f, // jal x0, 0 (infinite loop / halt)
      hexCode: '0x0000006F',
      label: item.label,
      lineNum: item.lineNum,
    };
  }

  if (op === 'li') {
    // li rd, imm -> addi rd, x0, imm
    if (args.length < 2) throw new Error('li requires rd, immediate');
    rd = parseRegister(args[0]);
    imm = parseInt(args[1], 10);
    rs1 = 0;
    const machine = encodeIType(0x13, rd, 0x0, 0, imm);
    return {
      id: `inst-${item.address}`,
      address: item.address,
      text: `li ${args[0]}, ${imm}`,
      opcode: 'addi',
      rd,
      rs1: 0,
      imm,
      rawMachineCode: machine,
      hexCode: '0x' + (machine >>> 0).toString(16).padStart(8, '0').toUpperCase(),
      label: item.label,
      lineNum: item.lineNum,
    };
  }

  if (op === 'mv') {
    // mv rd, rs -> addi rd, rs, 0
    if (args.length < 2) throw new Error('mv requires rd, rs');
    rd = parseRegister(args[0]);
    rs1 = parseRegister(args[1]);
    const machine = encodeIType(0x13, rd, 0x0, rs1, 0);
    return {
      id: `inst-${item.address}`,
      address: item.address,
      text: `mv ${args[0]}, ${args[1]}`,
      opcode: 'addi',
      rd,
      rs1,
      imm: 0,
      rawMachineCode: machine,
      hexCode: '0x' + (machine >>> 0).toString(16).padStart(8, '0').toUpperCase(),
      label: item.label,
      lineNum: item.lineNum,
    };
  }

  // R-Type Instructions: add, sub, and, or, xor, sll, srl, slt
  if (['add', 'sub', 'and', 'or', 'xor', 'sll', 'srl', 'slt'].includes(op)) {
    if (args.length < 3) throw new Error(`${op} requires rd, rs1, rs2`);
    rd = parseRegister(args[0]);
    rs1 = parseRegister(args[1]);
    rs2 = parseRegister(args[2]);

    let funct3 = 0;
    let funct7 = 0;
    if (op === 'add') { funct3 = 0x0; funct7 = 0x00; }
    else if (op === 'sub') { funct3 = 0x0; funct7 = 0x20; }
    else if (op === 'sll') { funct3 = 0x1; funct7 = 0x00; }
    else if (op === 'slt') { funct3 = 0x2; funct7 = 0x00; }
    else if (op === 'xor') { funct3 = 0x4; funct7 = 0x00; }
    else if (op === 'srl') { funct3 = 0x5; funct7 = 0x00; }
    else if (op === 'or')  { funct3 = 0x6; funct7 = 0x00; }
    else if (op === 'and') { funct3 = 0x7; funct7 = 0x00; }

    const machine = encodeRType(0x33, rd, funct3, rs1, rs2, funct7);
    return {
      id: `inst-${item.address}`,
      address: item.address,
      text: `${op} ${args[0]}, ${args[1]}, ${args[2]}`,
      opcode: op,
      rd,
      rs1,
      rs2,
      rawMachineCode: machine,
      hexCode: '0x' + (machine >>> 0).toString(16).padStart(8, '0').toUpperCase(),
      label: item.label,
      lineNum: item.lineNum,
    };
  }

  // I-Type Arithmetic: addi, andi, ori, xori, slli, srli, slti
  if (['addi', 'andi', 'ori', 'xori', 'slli', 'srli', 'slti'].includes(op)) {
    if (args.length < 3) throw new Error(`${op} requires rd, rs1, imm`);
    rd = parseRegister(args[0]);
    rs1 = parseRegister(args[1]);
    imm = parseInt(args[2], 10);
    if (isNaN(imm)) throw new Error(`Invalid immediate value "${args[2]}" for ${op}`);

    let funct3 = 0;
    if (op === 'addi') funct3 = 0x0;
    else if (op === 'slli') funct3 = 0x1;
    else if (op === 'slti') funct3 = 0x2;
    else if (op === 'xori') funct3 = 0x4;
    else if (op === 'srli') funct3 = 0x5;
    else if (op === 'ori')  funct3 = 0x6;
    else if (op === 'andi') funct3 = 0x7;

    const machine = encodeIType(0x13, rd, funct3, rs1, imm);
    return {
      id: `inst-${item.address}`,
      address: item.address,
      text: `${op} ${args[0]}, ${args[1]}, ${imm}`,
      opcode: op,
      rd,
      rs1,
      imm,
      rawMachineCode: machine,
      hexCode: '0x' + (machine >>> 0).toString(16).padStart(8, '0').toUpperCase(),
      label: item.label,
      lineNum: item.lineNum,
    };
  }

  // Load Word: lw rd, offset(rs1)
  if (op === 'lw') {
    if (args.length < 2) throw new Error('lw requires rd, offset(rs1)');
    rd = parseRegister(args[0]);
    const mem = parseMemOperand(args[1]);
    rs1 = mem.rs1;
    imm = mem.offset;

    const machine = encodeIType(0x03, rd, 0x2, rs1, imm);
    return {
      id: `inst-${item.address}`,
      address: item.address,
      text: `lw ${args[0]}, ${args[1]}`,
      opcode: 'lw',
      rd,
      rs1,
      imm,
      rawMachineCode: machine,
      hexCode: '0x' + (machine >>> 0).toString(16).padStart(8, '0').toUpperCase(),
      label: item.label,
      lineNum: item.lineNum,
    };
  }

  // Store Word: sw rs2, offset(rs1)
  if (op === 'sw') {
    if (args.length < 2) throw new Error('sw requires rs2, offset(rs1)');
    rs2 = parseRegister(args[0]);
    const mem = parseMemOperand(args[1]);
    rs1 = mem.rs1;
    imm = mem.offset;

    const machine = encodeSType(0x23, 0x2, rs1, rs2, imm);
    return {
      id: `inst-${item.address}`,
      address: item.address,
      text: `sw ${args[0]}, ${args[1]}`,
      opcode: 'sw',
      rs1,
      rs2,
      imm,
      rawMachineCode: machine,
      hexCode: '0x' + (machine >>> 0).toString(16).padStart(8, '0').toUpperCase(),
      label: item.label,
      lineNum: item.lineNum,
    };
  }

  // Branch instructions: beq, bne, blt, bge
  if (['beq', 'bne', 'blt', 'bge'].includes(op)) {
    if (args.length < 3) throw new Error(`${op} requires rs1, rs2, label/offset`);
    rs1 = parseRegister(args[0]);
    rs2 = parseRegister(args[1]);
    const target = args[2];
    targetLabel = target;

    if (target in labelMap) {
      imm = labelMap[target] - item.address;
    } else {
      imm = parseInt(target, 10);
      if (isNaN(imm)) throw new Error(`Unknown branch target label "${target}"`);
    }

    let funct3 = 0;
    if (op === 'beq') funct3 = 0x0;
    else if (op === 'bne') funct3 = 0x1;
    else if (op === 'blt') funct3 = 0x4;
    else if (op === 'bge') funct3 = 0x5;

    const machine = encodeBType(0x63, funct3, rs1, rs2, imm);
    return {
      id: `inst-${item.address}`,
      address: item.address,
      text: `${op} ${args[0]}, ${args[1]}, ${target}`,
      opcode: op,
      rs1,
      rs2,
      imm,
      targetLabel,
      rawMachineCode: machine,
      hexCode: '0x' + (machine >>> 0).toString(16).padStart(8, '0').toUpperCase(),
      label: item.label,
      lineNum: item.lineNum,
    };
  }

  // Jumps: j, jal
  if (op === 'j' || op === 'jal') {
    let target = '';
    if (op === 'j') {
      if (args.length < 1) throw new Error('j requires label/offset');
      target = args[0];
      rd = 0;
    } else {
      if (args.length === 1) {
        rd = 1; // default jal link register is ra (x1)
        target = args[0];
      } else {
        rd = parseRegister(args[0]);
        target = args[1];
      }
    }
    targetLabel = target;

    if (target in labelMap) {
      imm = labelMap[target] - item.address;
    } else {
      imm = parseInt(target, 10);
      if (isNaN(imm)) throw new Error(`Unknown jump target label "${target}"`);
    }

    const machine = encodeJType(0x6f, rd, imm);
    return {
      id: `inst-${item.address}`,
      address: item.address,
      text: `${op} ${args.join(', ')}`,
      opcode: op,
      rd,
      imm,
      targetLabel,
      rawMachineCode: machine,
      hexCode: '0x' + (machine >>> 0).toString(16).padStart(8, '0').toUpperCase(),
      label: item.label,
      lineNum: item.lineNum,
    };
  }

  throw new Error(`Unsupported instruction: "${op}"`);
}

function encodeRType(opcode: number, rd: number, funct3: number, rs1: number, rs2: number, funct7: number): number {
  return (
    ((funct7 & 0x7f) << 25) |
    ((rs2 & 0x1f) << 20) |
    ((rs1 & 0x1f) << 15) |
    ((funct3 & 0x07) << 12) |
    ((rd & 0x1f) << 7) |
    (opcode & 0x7f)
  );
}

function encodeIType(opcode: number, rd: number, funct3: number, rs1: number, imm: number): number {
  const imm12 = imm & 0xfff;
  return (
    (imm12 << 20) |
    ((rs1 & 0x1f) << 15) |
    ((funct3 & 0x07) << 12) |
    ((rd & 0x1f) << 7) |
    (opcode & 0x7f)
  );
}

function encodeSType(opcode: number, funct3: number, rs1: number, rs2: number, imm: number): number {
  const imm12 = imm & 0xfff;
  const imm11_5 = (imm12 >> 5) & 0x7f;
  const imm4_0 = imm12 & 0x1f;
  return (
    (imm11_5 << 25) |
    ((rs2 & 0x1f) << 20) |
    ((rs1 & 0x1f) << 15) |
    ((funct3 & 0x07) << 12) |
    (imm4_0 << 7) |
    (opcode & 0x7f)
  );
}

function encodeBType(opcode: number, funct3: number, rs1: number, rs2: number, imm: number): number {
  const imm13 = imm & 0x1fff;
  const bit12 = (imm13 >> 12) & 0x1;
  const bit10_5 = (imm13 >> 5) & 0x3f;
  const bit4_1 = (imm13 >> 1) & 0x0f;
  const bit11 = (imm13 >> 11) & 0x1;
  return (
    (bit12 << 31) |
    (bit10_5 << 25) |
    ((rs2 & 0x1f) << 20) |
    ((rs1 & 0x1f) << 15) |
    ((funct3 & 0x07) << 12) |
    (bit4_1 << 8) |
    (bit11 << 7) |
    (opcode & 0x7f)
  );
}

function encodeJType(opcode: number, rd: number, imm: number): number {
  const imm21 = imm & 0x1fffff;
  const bit20 = (imm21 >> 20) & 0x1;
  const bit10_1 = (imm21 >> 1) & 0x3ff;
  const bit11 = (imm21 >> 11) & 0x1;
  const bit19_12 = (imm21 >> 12) & 0xff;
  return (
    (bit20 << 31) |
    (bit19_12 << 12) |
    (bit11 << 20) |
    (bit10_1 << 21) |
    ((rd & 0x1f) << 7) |
    (opcode & 0x7f)
  );
}
