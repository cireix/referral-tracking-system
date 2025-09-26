import { useEffect } from 'react';

interface KeyboardHandlers {
  onNumberInput: (num: string) => void;
  onDecimal: () => void;
  onOperation: (op: string) => void;
  onEquals: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onPercentage: () => void;
}

// Mapping of keyboard keys to calculator operations
const OPERATOR_KEY_MAP: Record<string, string> = {
  '+': '+',
  '-': '-',
  '*': '×',
  '/': '÷'
};

export function useCalculatorKeyboard({
  onNumberInput,
  onDecimal,
  onOperation,
  onEquals,
  onClear,
  onBackspace,
  onPercentage
}: KeyboardHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      
      const key = event.key;
      
      // Number keys
      if (key >= '0' && key <= '9') {
        onNumberInput(key);
        return;
      }
      
      // Operator keys
      if (key in OPERATOR_KEY_MAP) {
        onOperation(OPERATOR_KEY_MAP[key]);
        return;
      }
      
      // Special keys mapping
      const keyActions: Record<string, () => void> = {
        '.': onDecimal,
        'Enter': onEquals,
        '=': onEquals,
        'Escape': onClear,
        'Backspace': onBackspace,
        '%': onPercentage
      };
      
      if (key in keyActions) {
        keyActions[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNumberInput, onDecimal, onOperation, onEquals, onClear, onBackspace, onPercentage]);
} 