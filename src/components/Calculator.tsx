'use client';

import { useState, useCallback } from 'react';
import CalculatorDisplay from './CalculatorDisplay';
import MemoryButtons from './MemoryButtons';
import ButtonPad from './ButtonPad';
import CalculatorOnboarding from './CalculatorOnboarding';
import { useCalculatorKeyboard } from '@/hooks/useCalculatorKeyboard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useUser } from '@stackframe/stack';
import {
  calculate,
  formatDisplay,
  toPercentage,
  toggleSign as toggleSignUtil,
  handleBackspace,
  handleDecimalInput,
  handleNumberInput
} from '@/utils/calculatorUtils';

export default function Calculator() {
  // Get current user for onboarding tracking
  const user = useUser();
  
  // State management
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState<number>(0);
  
  // Use the onboarding hook with user ID
  const { showOnboarding, startOnboarding, completeOnboarding } = useOnboarding(user?.id);

  // Number input handler
  const inputNumber = useCallback((num: string) => {
    setDisplay(current => handleNumberInput(current, num, waitingForOperand));
    if (waitingForOperand) {
      setWaitingForOperand(false);
    }
  }, [waitingForOperand]);

  // Decimal input handler
  const inputDecimal = useCallback(() => {
    setDisplay(current => handleDecimalInput(current, waitingForOperand));
    if (waitingForOperand) {
      setWaitingForOperand(false);
    }
  }, [waitingForOperand]);

  // Operation handler
  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = display;

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation && !waitingForOperand) {
      // Only perform calculation if we're not waiting for an operand
      const currentValue = previousValue || '0';
      const newValue = calculate(currentValue, inputValue, operation);
      setDisplay(newValue);
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation, waitingForOperand]);

  // Equals handler
  const performEquals = useCallback(() => {
    if (previousValue !== null && operation !== null) {
      const newValue = calculate(previousValue, display, operation);
      setDisplay(newValue);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  }, [display, previousValue, operation]);

  // Clear handler
  const clear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);

  // Percentage handler
  const percentage = useCallback(() => {
    setDisplay(current => toPercentage(current));
  }, []);

  // Toggle sign handler
  const toggleSign = useCallback(() => {
    setDisplay(current => toggleSignUtil(current));
  }, []);

  // Backspace handler
  const backspace = useCallback(() => {
    setDisplay(current => handleBackspace(current));
  }, []);

  // Memory operations
  const memoryOperations = {
    store: useCallback(() => setMemory(parseFloat(display)), [display]),
    recall: useCallback(() => {
      setDisplay(memory.toString());
      setWaitingForOperand(true);
    }, [memory]),
    clear: useCallback(() => setMemory(0), []),
    add: useCallback(() => setMemory(current => current + parseFloat(display)), [display]),
    subtract: useCallback(() => setMemory(current => current - parseFloat(display)), [display])
  };

  // Setup keyboard support
  useCalculatorKeyboard({
    onNumberInput: inputNumber,
    onDecimal: inputDecimal,
    onOperation: performOperation,
    onEquals: performEquals,
    onClear: clear,
    onBackspace: backspace,
    onPercentage: percentage
  });

  return (
    <div className="min-h-screen bg-black-800 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 w-full max-w-md relative">
        {/* Help Button */}
        <button
          onClick={startOnboarding}
          className="absolute top-4 right-4 z-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          title="Start Tour"
        >
          ?
        </button>

        <CalculatorDisplay
          display={display}
          memory={memory}
          operation={operation}
          previousValue={previousValue}
          formatDisplay={formatDisplay}
        />

        <MemoryButtons
          onMemoryClear={memoryOperations.clear}
          onMemoryRecall={memoryOperations.recall}
          onMemoryAdd={memoryOperations.add}
          onMemorySubtract={memoryOperations.subtract}
          onMemoryStore={memoryOperations.store}
        />

        <ButtonPad
          onNumberInput={inputNumber}
          onOperation={performOperation}
          onClear={clear}
          onBackspace={backspace}
          onEquals={performEquals}
          onToggleSign={toggleSign}
          onDecimal={inputDecimal}
        />

        <div className="mt-4 text-center text-gray-400 text-xs keyboard-tip">
          💡 Tip: Use your keyboard for faster calculations
        </div>
      </div>

      {/* Onboarding Tour */}
      <CalculatorOnboarding
        run={showOnboarding}
        onComplete={completeOnboarding}
      />
    </div>
  );
} 