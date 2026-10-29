/**
 * Architecture Cadence - Standard Computer Architecture Programs
 * Designed for lab coursework: RAW hazards, Load-Use stalls, branches, and cache traversal.
 */

export interface ProgramPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  code: string;
}

export const PRESET_PROGRAMS: ProgramPreset[] = [
  {
    id: 'raw-forwarding',
    name: 'RAW Hazard & Forwarding Paths',
    badge: 'Data Hazards',
    description: 'Demonstrates Read-After-Write (RAW) data hazards where consecutive instructions depend on results still in the pipeline. With forwarding enabled, hardware bypasses values directly from EX and MEM stages into EX operands without inserting stall bubbles.',
    code: `# RAW Data Hazard & Forwarding Demonstration
# Notice how x1 and x2 are forwarded directly from EX and MEM stages.
addi x1, x0, 10      # x1 = 10 (enters EX, MEM, WB)
addi x2, x1, 5       # x2 = x1 + 5 = 15 (needs x1 from EX stage -> EX forwarding)
add  x3, x1, x2      # x3 = x1 + x2 = 25 (needs x1 from MEM, x2 from EX)
sub  x4, x3, x1      # x4 = 25 - 10 = 15
and  x5, x3, x4      # x5 = 25 & 15
halt`,
  },
  {
    id: 'load-use-stall',
    name: 'Load-Use Hazard & 1-Cycle Bubble',
    badge: 'Hardware Stall',
    description: 'Demonstrates a classic Load-Use hazard. Because loaded data is not available until the end of the MEM stage, an instruction that immediately consumes the loaded register must be stalled for 1 clock cycle by inserting a bubble into EX.',
    code: `# Load-Use Data Hazard & Hardware Stall
# Storing 42 into memory, then loading and immediately computing.
addi x4, x0, 42
sw   x4, 0(x0)       # Store 42 at address 0x0
lw   x1, 0(x0)       # Load into x1 (MemRead is true in EX/MEM)
addi x2, x1, 10      # Load-Use! x2 depends immediately on x1 -> 1-cycle stall bubble inserted!
add  x3, x2, x1      # x3 = 52 + 42 = 94 (forwarded without additional stall)
halt`,
  },
  {
    id: 'branch-flush',
    name: 'Branch Hazard & Pipeline Flush',
    badge: 'Control Hazard',
    description: 'Demonstrates control hazards when a branch decision is taken. The 5-stage CPU fetches sequential instructions speculatively. When the branch evaluates taken in EX, the wrong-path instructions in IF and ID are flushed.',
    code: `# Branch Hazard Demonstration
addi x1, x0, 5
addi x2, x0, 5
beq  x1, x2, match   # Branch evaluates taken in EX stage
addi x3, x0, 999     # Speculatively fetched (will be flushed!)
addi x4, x0, 888     # Speculatively fetched (will be flushed!)
match:
addi x5, x0, 777     # Target destination reached
halt`,
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci Sequence Generator',
    badge: 'Algorithm & Loop',
    description: 'Calculates the first 8 numbers of the Fibonacci sequence using a loop with counter and branch condition.',
    code: `# Fibonacci Sequence in Registers
# x1: current (F_n-1), x2: next (F_n), x3: loop counter
addi x1, x0, 0       # F0 = 0
addi x2, x0, 1       # F1 = 1
addi x3, x0, 6       # Compute 6 iterations
loop:
beq  x3, x0, done    # Exit loop when counter reaches 0
add  x4, x1, x2      # temp = x1 + x2
mv   x1, x2          # x1 = x2
mv   x2, x4          # x2 = temp
addi x3, x3, -1      # counter--
j    loop
done:
halt`,
  },
  {
    id: 'cache-locality',
    name: 'Memory Traversal & Cache Telemetry',
    badge: 'Cache Hierarchy',
    description: 'Performs memory stores and loads to demonstrate spatial locality hits and compulsory cold misses in the L1 Set-Associative cache.',
    code: `# Cache Locality & Telemetry Lab
# Writing and reading words to contiguous and strided addresses.
addi x1, x0, 100
addi x2, x0, 200
addi x3, x0, 300
sw   x1, 0(x0)       # Cold miss in Cache Set 0, fills 16-byte block
sw   x2, 4(x0)       # Spatial Locality Hit in same cache block!
sw   x3, 8(x0)       # Spatial Locality Hit!
lw   x5, 0(x0)       # Cache Hit!
sw   x1, 64(x0)      # Access to another set -> Cold Miss
lw   x6, 64(x0)      # Cache Hit!
halt`,
  },
];
