# Testing Plan

| Test | Input | Expected |
|---|---|---|
| Positive multiplication | 5 × 3 | 15 |
| Signed multiplication | -5 × 3 | -15 |
| Two negatives | -5 × -3 | 15 |
| Zero multiplication | 0 × 25 | 0 |
| Address calculation | B=1000, i=4, S=32 | 1128 |
| Hashing | BOOK-101, table 100 | 0–99 |
| Invalid index | Negative/out-of-range | Reject or report error |

## Metrics
- Memory reads and writes
- Bus transfers
- ALU operations
- Register transfers
- Shift count
- Estimated cycles
- Estimated latency

Actual performance values should be added only after simulation.
