def record_address(base_address, record_index, record_size):
    return base_address + record_index * record_size

def simple_hash(key, table_size):
    value = 0
    for ch in key:
        value = (value * 31 + ord(ch)) % table_size
    return value

if __name__ == '__main__':
    print('Digital Library Processing Framework Demo')
    print('Record address:', record_address(1000, 4, 32))
    print('Hash position:', simple_hash('BOOK-101', 100))
    print('Example multiplication:', 5 * 3)
