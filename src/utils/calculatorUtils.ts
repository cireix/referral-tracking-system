export const OPERATIONS = {
  ADD: '+',
  SUBTRACT: '-',
  MULTIPLY: '×',
  DIVIDE: '÷'
} as const;

export type Operation = typeof OPERATIONS[keyof typeof OPERATIONS];

/**
 * Performs a calculation based on the operation
 */
export function calculate(firstValue: string, secondValue: string, operation: string): string {
  const first = parseFloat(firstValue);
  const second = parseFloat(secondValue);

  switch (operation) {
    case OPERATIONS.ADD:
      return (first + second).toString();
    case OPERATIONS.SUBTRACT:
      return (first - second).toString();
    case OPERATIONS.MULTIPLY:
      return (first * second).toString();
    case OPERATIONS.DIVIDE:
      return second !== 0 ? (first / second).toString() : 'Error';
    default:
      return secondValue;
  }
}

/**
 * Formats the display value for better readability
 */
export function formatDisplay(value: string): string {
  if (value === 'Error') return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  // Limit to 12 characters
  if (value.length > 12) {
    return num.toExponential(6);
  }
  return value;
}

/**
 * Converts a number to percentage (divides by 100)
 */
export function toPercentage(value: string): string {
  const num = parseFloat(value);
  return (num / 100).toString();
}

/**
 * Toggles the sign of a number
 */
export function toggleSign(value: string): string {
  const num = parseFloat(value);
  return (num * -1).toString();
}

/**
 * Handles backspace operation on display
 */
export function handleBackspace(display: string): string {
  if (display.length > 1) {
    return display.slice(0, -1);
  }
  return '0';
}

/**
 * Handles decimal input
 */
export function handleDecimalInput(display: string, waitingForOperand: boolean): string {
  if (waitingForOperand) {
    return '0.';
  }
  if (display.indexOf('.') === -1) {
    return display + '.';
  }
  return display;
}

/**
 * Handles number input
 */
export function handleNumberInput(display: string, num: string, waitingForOperand: boolean): string {
  if (waitingForOperand) {
    return num;
  }
  return display === '0' ? num : display + num;
} 