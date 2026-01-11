/**
 * 🔄 Modbus Data Transformer
 *
 * Handles transformation of raw modbus register data:
 * 1. Parse register arrays based on bitsToRead (8, 16, 32, 64-bit values)
 * 2. Convert register values from hex to decimal
 * 3. Apply endianness conversion (byte ordering)
 * 4. Apply scaling and offset calibration
 *
 * Modbus Background:
 * - Each register is 16 bits
 * - bitsToRead determines how many registers form one value
 * - Endianness defines byte ordering within multi-register values
 */

type Endianness = 'ABCD' | 'CDAB' | 'BADC' | 'DCBA' | 'NONE';

interface ModbusReadConfig {
  readId: string;
  slaveId: string;
  startAddress: number;
  bitsToRead: number; // 8, 16, 32, 64
  scaling: number;
  offset: number;
  endianness: Endianness;
  name: string;
  tag: string;
  unit?: string;
}

interface TransformedModbusValue {
  rawValues: number[]; // Original register values (decimal)
  rawRegisters: string[]; // Register values as hex strings (for audit trail)
  parsedValue: number; // The actual value after parsing registers
  calibratedValue: number; // After scaling and offset
  unit?: string;
  metadata: {
    bitsToRead: number;
    endianness: Endianness;
    scaling: number;
    offset: number;
  };
}

/**
 * Convert hex string or number to decimal
 */
function hexToDecimal(value: string | number): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Try to parse as hex if it starts with 0x, otherwise as decimal
    if (value.toLowerCase().startsWith('0x')) {
      return parseInt(value, 16);
    }
    return parseInt(value, 10);
  }
  return 0;
}

/**
 * Convert number to hex string with padding
 */
function decimalToHex(value: number): string {
  return '0x' + value.toString(16).padStart(4, '0').toUpperCase();
}

/**
 * Apply endianness conversion to register bytes
 *
 * Endianness types:
 * - ABCD: No conversion (Big Endian, default)
 * - CDAB: Swap middle bytes (common in Modbus)
 * - BADC: Swap all bytes (Little Endian pairs)
 * - DCBA: Full reversal (Little Endian)
 * - NONE: No conversion
 */
function applyEndianness(registers: number[], endianness: Endianness): Buffer {
  // Convert each register to a 16-bit buffer
  const buffers = registers.map((reg) => {
    const buf = Buffer.alloc(2);
    buf.writeUInt16BE(reg, 0);
    return buf;
  });

  // Combine all buffers
  const combined = Buffer.concat(buffers);

  if (endianness === 'NONE' || endianness === 'ABCD') {
    // No conversion needed
    return combined;
  }

  if (endianness === 'CDAB') {
    // Swap 16-bit words: (A,B,C,D) -> (C,D,A,B)
    const result = Buffer.alloc(combined.length);
    for (let i = 0; i < combined.length; i += 4) {
      if (i + 3 < combined.length) {
        result[i] = combined[i + 2];
        result[i + 1] = combined[i + 3];
        result[i + 2] = combined[i];
        result[i + 3] = combined[i + 1];
      }
    }
    return result;
  }

  if (endianness === 'BADC') {
    // Swap bytes within each 16-bit word: (A,B,C,D) -> (B,A,D,C)
    const result = Buffer.alloc(combined.length);
    for (let i = 0; i < combined.length; i += 2) {
      if (i + 1 < combined.length) {
        result[i] = combined[i + 1];
        result[i + 1] = combined[i];
      }
    }
    return result;
  }

  if (endianness === 'DCBA') {
    // Full reversal: (A,B,C,D) -> (D,C,B,A)
    const result = Buffer.alloc(combined.length);
    for (let i = 0; i < combined.length; i++) {
      result[i] = combined[combined.length - 1 - i];
    }
    return result;
  }

  return combined;
}

/**
 * Parse binary buffer as unsigned integer (32-bit or 64-bit depending on length)
 */
function bufferToUnsignedInt(buffer: Buffer): number {
  if (buffer.length === 2) {
    return buffer.readUInt16BE(0);
  } else if (buffer.length === 4) {
    return buffer.readUInt32BE(0);
  } else if (buffer.length === 8) {
    // JavaScript can't accurately handle 64-bit integers, use BigInt
    return Number(buffer.readBigUInt64BE(0));
  }
  return 0;
}

/**
 * Parse binary buffer as signed integer
 */
function bufferToSignedInt(buffer: Buffer): number {
  if (buffer.length === 2) {
    return buffer.readInt16BE(0);
  } else if (buffer.length === 4) {
    return buffer.readInt32BE(0);
  } else if (buffer.length === 8) {
    return Number(buffer.readBigInt64BE(0));
  }
  return 0;
}

/**
 * Parse modbus register array into a single value
 *
 * Logic:
 * - bitsToRead = 8  -> 1 register (16 bits, use lower 8)
 * - bitsToRead = 16 -> 1 register (16 bits, use all)
 * - bitsToRead = 32 -> 2 registers (32 bits)
 * - bitsToRead = 64 -> 4 registers (64 bits)
 */
function parseRegistersToValue(registers: number[], bitsToRead: number): number {
  // Determine expected number of registers
  const expectedRegisters = Math.ceil(bitsToRead / 16);

  if (registers.length < expectedRegisters) {
    throw new Error(
      `Expected ${expectedRegisters} register(s) for ${bitsToRead} bits, got ${registers.length}`,
    );
  }

  // Apply endianness and parse
  const buffer = Buffer.alloc(expectedRegisters * 2);

  // Write registers as big-endian 16-bit values
  for (let i = 0; i < expectedRegisters; i++) {
    buffer.writeUInt16BE(registers[i], i * 2);
  }

  // For 8-bit, extract lower byte
  if (bitsToRead === 8) {
    return buffer[1]; // Lower byte of first register
  }

  // For others, interpret as unsigned integer
  return bufferToUnsignedInt(buffer.slice(0, expectedRegisters * 2));
}

/**
 * Transform raw modbus register array using configuration
 */
export function transformModbusRead(
  registerArray: number[],
  config: ModbusReadConfig,
): TransformedModbusValue {
  // 1. Convert all registers to decimal (if they're hex strings or numbers)
  const decimalRegisters = registerArray.map((reg) => {
    if (typeof reg === 'string') {
      return hexToDecimal(reg);
    }
    return reg;
  });

  // 2. Store raw registers for audit trail
  const rawRegisters = decimalRegisters.map((r) => decimalToHex(r));

  // 3. Apply endianness and parse into single value
  // For now, we'll use a simpler approach: apply endianness then parse
  const endiannessBuffer = applyEndianness(decimalRegisters, config.endianness);
  const parsedValue = bufferToUnsignedInt(endiannessBuffer);

  // 4. Apply scaling and offset
  const calibratedValue = parsedValue * config.scaling + config.offset;

  return {
    rawValues: decimalRegisters,
    rawRegisters,
    parsedValue,
    calibratedValue,
    unit: config.unit,
    metadata: {
      bitsToRead: config.bitsToRead,
      endianness: config.endianness,
      scaling: config.scaling,
      offset: config.offset,
    },
  };
}

/**
 * Transform multiple register reads from a modbus slave
 *
 * Input format (from device):
 * [
 *   { readId: 'read-1', value: [23223] },
 *   { readId: 'read-2', value: [101, 102] },
 *   { readId: 'read-3', value: [3001, 3002, 3003, 3004] }
 * ]
 */
export function transformModbusSlaveReads(
  reads: Array<{ readId: string; value: number[] }>,
  readConfigs: Map<string, ModbusReadConfig>,
): Array<{
  readId: string;
  slaveId: string;
  transformed: TransformedModbusValue;
  config: ModbusReadConfig;
}> {
  return reads
    .map((read) => {
      const config = readConfigs.get(read.readId);
      if (!config) {
        console.warn(`No configuration found for read: ${read.readId}`);
        return null;
      }

      try {
        const transformed = transformModbusRead(read.value, config);
        return {
          readId: read.readId,
          slaveId: config.slaveId,
          transformed,
          config,
        };
      } catch (err) {
        console.error(`Error transforming read ${read.readId}:`, err);
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * Build a map of readId -> config for quick lookup during transformation
 */
export function buildReadConfigMap(device: any): Map<string, ModbusReadConfig> {
  const map = new Map<string, ModbusReadConfig>();

  // Iterate through ports that have modbus slaves
  for (const port of device.ports || []) {
    if (!port.modbusSlaves || port.modbusSlaves.length === 0) {
      continue;
    }

    for (const slave of port.modbusSlaves) {
      if (!slave.reads || slave.reads.length === 0) {
        continue;
      }

      for (const read of slave.reads) {
        map.set(read.readId, {
          readId: read.readId,
          slaveId: slave.slaveId,
          startAddress: read.startAddress,
          bitsToRead: read.bitsToRead,
          scaling: read.scaling || 1,
          offset: read.offset || 0,
          endianness: (read.endianness || 'NONE') as Endianness,
          name: read.name,
          tag: read.tag,
          unit: read.unit,
        });
      }
    }
  }

  return map;
}

export { ModbusReadConfig, TransformedModbusValue, Endianness };
