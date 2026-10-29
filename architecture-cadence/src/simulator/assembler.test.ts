import test from 'node:test';
import assert from 'node:assert/strict';
import { assemble, parseRegister } from './assembler';

test('parseRegister recognizes x-names and ABI register aliases', () => {
  assert.equal(parseRegister('x0'), 0);
  assert.equal(parseRegister('x1'), 1);
  assert.equal(parseRegister('x31'), 31);
  assert.equal(parseRegister('zero'), 0);
  assert.equal(parseRegister('sp'), 2);
  assert.equal(parseRegister('t0'), 5);
  assert.equal(parseRegister('a0'), 10);
});

test('assemble correctly decodes instructions and calculates label offsets', () => {
  const code = `
    addi x1, x0, 10
    addi x2, x0, 20
    beq  x1, x2, skip
    add  x3, x1, x2
  skip:
    sub  x4, x2, x1
  `;

  const result = assemble(code);
  assert.equal(result.errors.length, 0, 'No assembly errors');
  assert.equal(result.instructions.length, 5);

  assert.equal(result.instructions[0].opcode, 'addi');
  assert.equal(result.instructions[0].rd, 1);
  assert.equal(result.instructions[0].imm, 10);

  assert.equal(result.instructions[2].opcode, 'beq');
  assert.equal(result.instructions[2].rs1, 1);
  assert.equal(result.instructions[2].rs2, 2);
  // Branch from 0x8 to skip at 0x10 -> offset is 8
  assert.equal(result.instructions[2].imm, 8);
  assert.equal(result.labelMap['skip'], 0x10);
});

test('assemble parses memory instructions correctly', () => {
  const code = `
    lw x1, 4(x2)
    sw x3, 8(sp)
  `;
  const result = assemble(code);
  assert.equal(result.errors.length, 0);
  assert.equal(result.instructions[0].opcode, 'lw');
  assert.equal(result.instructions[0].rd, 1);
  assert.equal(result.instructions[0].rs1, 2);
  assert.equal(result.instructions[0].imm, 4);

  assert.equal(result.instructions[1].opcode, 'sw');
  assert.equal(result.instructions[1].rs2, 3);
  assert.equal(result.instructions[1].rs1, 2); // sp is 2
  assert.equal(result.instructions[1].imm, 8);
});
