/**
 * Modbus Function Code to Register Type Mapping
 *
 * Maps Modbus function codes (fc_1 to fc_4) to their corresponding register types
 * This allows the backend to derive registerType from functionCode automatically
 */

export const MODBUS_FUNCTION_CODES = {
  FC_1: 'fc_1', // Read Coils
  FC_2: 'fc_2', // Read Discrete Inputs
  FC_3: 'fc_3', // Read Holding Registers
  FC_4: 'fc_4', // Read Input Registers
} as const;

export const REGISTER_TYPES = {
  COIL: 'coil',
  DISCRETE: 'discrete',
  HOLDING: 'holding',
  INPUT: 'input',
} as const;

/**
 * Map from Function Code to Register Type
 *
 * This mapping follows Modbus specification:
 * - Coils: discrete outputs (read/write)
 * - Discrete Inputs: read-only inputs
 * - Holding Registers: read/write registers
 * - Input Registers: read-only registers
 */
export const FUNCTION_CODE_TO_REGISTER_TYPE: Record<string, string> = {
  // Read operations
  [MODBUS_FUNCTION_CODES.FC_1]: REGISTER_TYPES.COIL, // Read Coils
  [MODBUS_FUNCTION_CODES.FC_2]: REGISTER_TYPES.DISCRETE, // Read Discrete Inputs
  [MODBUS_FUNCTION_CODES.FC_3]: REGISTER_TYPES.HOLDING, // Read Holding Registers
  [MODBUS_FUNCTION_CODES.FC_4]: REGISTER_TYPES.INPUT, // Read Input Registers
};

/**
 * Get register type from function code
 *
 * @param functionCode - Modbus function code (e.g., "fc_3")
 * @returns Register type (e.g., "holding")
 */
export function getRegisterType(functionCode: string): string {
  const registerType = FUNCTION_CODE_TO_REGISTER_TYPE[functionCode];
  if (!registerType) {
    throw new Error(`Invalid function code: ${functionCode}`);
  }
  return registerType;
}

/**
 * Function Code Descriptions
 */
export const FUNCTION_CODE_DESCRIPTIONS: Record<
  string,
  { name: string; description: string; dataType: string }
> = {
  [MODBUS_FUNCTION_CODES.FC_1]: {
    name: 'Read Coils',
    description: 'Read discrete outputs (coils) - 1 bit per coil',
    dataType: 'boolean',
  },
  [MODBUS_FUNCTION_CODES.FC_2]: {
    name: 'Read Discrete Inputs',
    description: 'Read discrete inputs - 1 bit per input',
    dataType: 'boolean',
  },
  [MODBUS_FUNCTION_CODES.FC_3]: {
    name: 'Read Holding Registers',
    description: 'Read holding registers - 16 bits per register',
    dataType: 'int16 | uint16 | float32',
  },
  [MODBUS_FUNCTION_CODES.FC_4]: {
    name: 'Read Input Registers',
    description: 'Read input registers - 16 bits per register',
    dataType: 'int16 | uint16 | float32',
  },
};

export default {
  MODBUS_FUNCTION_CODES,
  REGISTER_TYPES,
  FUNCTION_CODE_TO_REGISTER_TYPE,
  getRegisterType,
  FUNCTION_CODE_DESCRIPTIONS,
};
