# Algorithms

## Record Address
```text
offset = record_index × record_size
address = base_address + offset
return address
```

## Hash Index
```text
hash = 0
for each character c in key:
    hash = (hash × 31 + ASCII(c)) mod table_size
return hash
```

## Booth's Algorithm
```text
A = 0
Q-1 = 0
repeat for each multiplier bit:
    if (Q0, Q-1) = (0,1): A = A + M
    if (Q0, Q-1) = (1,0): A = A - M
    arithmetic-right-shift(A, Q, Q-1)
return combined(A,Q)
```
