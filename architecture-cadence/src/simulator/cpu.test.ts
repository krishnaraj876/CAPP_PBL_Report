import test from 'node:test';
import assert from 'node:assert/strict';
import { assemble } from './assembler';
import { createInitialCPUState, stepCPU } from './cpu';

test('CPU advances instructions through 5 pipeline stages and writes back', () => {
  const code = `
    addi x1, x0, 42
  `;
  const { instructions } = assemble(code);
  let state = createInitialCPUState();

  // Cycle 1: Fetch into IF
  state = stepCPU(state, instructions);
  assert.equal(state.cycle, 1);
  assert.equal(state.pipeline.if.status, 'active');
  assert.equal(state.pipeline.if.instruction?.opcode, 'addi');

  // Cycle 2: Move to ID
  state = stepCPU(state, instructions);
  assert.equal(state.cycle, 2);
  assert.equal(state.pipeline.id.status, 'active');

  // Cycle 3: Move to EX
  state = stepCPU(state, instructions);
  assert.equal(state.cycle, 3);
  assert.equal(state.pipeline.ex.status, 'active');

  // Cycle 4: Move to MEM
  state = stepCPU(state, instructions);
  assert.equal(state.cycle, 4);
  assert.equal(state.pipeline.mem.status, 'active');

  // Cycle 5: Move to WB
  state = stepCPU(state, instructions);
  assert.equal(state.cycle, 5);
  assert.equal(state.pipeline.wb.status, 'active');

  // Cycle 6: Register file updated
  state = stepCPU(state, instructions);
  assert.equal(state.registers[1], 42, 'Register x1 holds 42 after writeback');
});

test('CPU detects RAW data dependency and forwards value with forwarding enabled', () => {
  const code = `
    addi x1, x0, 10
    addi x2, x1, 5
  `;
  const { instructions } = assemble(code);
  let state = createInitialCPUState();
  state.config.forwardingEnabled = true;

  // Run several cycles
  for (let c = 0; c < 6; c++) {
    state = stepCPU(state, instructions);
  }

  // When second instruction executes in EX, it should forward x1 = 10 and compute x2 = 15
  for (let c = 0; c < 4; c++) {
    state = stepCPU(state, instructions);
  }

  assert.equal(state.registers[1], 10);
  assert.equal(state.registers[2], 15);
  assert.ok(state.forwardingEvents > 0, 'Forwarding event occurred');
});
