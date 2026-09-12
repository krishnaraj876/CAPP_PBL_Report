# Digital Library Processing Framework
## Improving Memory Access and Data Transfer

Academic CAPP project connecting digital-library indexing, hashing, address calculation, ALU operations, Booth's Algorithm, registers, buses, and memory transfers.

## Objectives
- Study processor organization and memory-transfer efficiency.
- Apply ALU concepts to indexing, hashing, checksums, and address calculation.
- Model Booth's Algorithm and Array Multiplier concepts.
- Reduce unnecessary memory read/write operations through register-based transfers.
- Compare arithmetic and transfer methods using measurable operation and cycle counts.

## Conceptual Flow
Digital Library Search -> Index/Hash Unit -> Address Calculation -> Registers/Buses -> ALU -> Memory Retrieval -> Record Verification

## Record Address Formula
`Address = Base Address + (Record Index × Record Size)`

## Repository
- `docs/detailed_report.md` — expanded project report
- `docs/algorithms.md` — algorithms and pseudocode
- `docs/testing_plan.md` — test cases and performance metrics
- `src/library_processing_demo.py` — educational Python demonstration
- `diagrams/architecture.txt` — conceptual architecture

## Run
```bash
python src/library_processing_demo.py
```

## Team
- Adityaraj Singh — Project Lead and Framework Design
- Afjal Ansari — Booth's Algorithm and ALU
- Akarsh Singh — Array Multiplier
- Aditya Singh — Memory, Registers and Bus Transfer
- Abhishek Pratap Singh — Hashing, Testing and Documentation

Course: Computer Architecture and Parallel Processing (CCSE0304)  
Group: 1  
Initial progress: 30%
