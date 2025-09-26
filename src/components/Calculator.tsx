'use client';

import { useState, useEffect, useCallback } from 'react';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState<number>(0);

  // Calculate the result
  const calculate = useCallback((firstValue: string, secondValue: string, operation: string): string => {
    const first = parseFloat(firstValue);
    const second = parseFloat(secondValue);

    switch (operation) {
      case '+':
        return (first + second).toString();
      case '-':
        return (first - second).toString();
      case '×':
        return (first * second).toString();
      case '÷':
        return second !== 0 ? (first / second).toString() : 'Error';
      default:
        return secondValue;
    }
  }, []);

  // Handle number input
  const inputNumber = useCallback((num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, waitingForOperand]);

  // Handle decimal point
  const inputDecimal = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  // Handle operation
  const performOperation = useCallback((nextOperation: string) => {
    const inputValue = display;

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation && !waitingForOperand) {
      // Only perform calculation if we're not waiting for an operand
      // (i.e., the user has entered a number after the last operator)
      const currentValue = previousValue || '0';
      const newValue = calculate(currentValue, inputValue, operation);
      setDisplay(newValue);
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  }, [display, previousValue, operation, calculate, waitingForOperand]);

  // Handle equals
  const performEquals = useCallback(() => {
    const inputValue = display;

    if (previousValue !== null && operation !== null) {
      const currentValue = previousValue;
      const newValue = calculate(currentValue, inputValue, operation);
      setDisplay(newValue);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  }, [display, previousValue, operation, calculate]);

  // Clear functions
  const clear = useCallback(() => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, []);

  // Percentage function
  const percentage = useCallback(() => {
    const value = parseFloat(display);
    setDisplay((value / 100).toString());
  }, [display]);

  // Toggle sign
  const toggleSign = useCallback(() => {
    const value = parseFloat(display);
    setDisplay((value * -1).toString());
  }, [display]);

  // Backspace
  const backspace = useCallback(() => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  }, [display]);

  // Memory functions
  const memoryStore = useCallback(() => {
    setMemory(parseFloat(display));
  }, [display]);

  const memoryRecall = useCallback(() => {
    setDisplay(memory.toString());
    setWaitingForOperand(true);
  }, [memory]);

  const memoryClear = useCallback(() => {
    setMemory(0);
  }, []);

  const memoryAdd = useCallback(() => {
    setMemory(memory + parseFloat(display));
  }, [memory, display]);

  const memorySubtract = useCallback(() => {
    setMemory(memory - parseFloat(display));
  }, [memory, display]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      
      if (event.key >= '0' && event.key <= '9') {
        inputNumber(event.key);
      } else if (event.key === '.') {
        inputDecimal();
      } else if (event.key === '+') {
        performOperation('+');
      } else if (event.key === '-') {
        performOperation('-');
      } else if (event.key === '*') {
        performOperation('×');
      } else if (event.key === '/') {
        performOperation('÷');
      } else if (event.key === 'Enter' || event.key === '=') {
        performEquals();
      } else if (event.key === 'Escape') {
        clear();
      } else if (event.key === 'Backspace') {
        backspace();
      } else if (event.key === '%') {
        percentage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputNumber, inputDecimal, performOperation, performEquals, clear, backspace, percentage]);

  // Format display for better readability
  const formatDisplay = (value: string) => {
    if (value === 'Error') return value;
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // Limit to 12 characters
    if (value.length > 12) {
      return num.toExponential(6);
    }
    return value;
  };

  const Button = ({ 
    onClick, 
    className = '', 
    children, 
    ariaLabel 
  }: { 
    onClick: () => void; 
    className?: string; 
    children: React.ReactNode;
    ariaLabel?: string;
  }) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        relative overflow-hidden rounded-xl font-semibold text-lg
        transition-all duration-200 transform active:scale-95
        hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400
        ${className}
      `}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 w-full max-w-md">
        {/* Display */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-4">
          <div className="text-gray-400 text-sm h-6 text-right mb-2">
            {memory !== 0 && (
              <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md text-xs mr-2">
                M: {memory}
              </span>
            )}
            {operation && previousValue && (
              <span>{previousValue} {operation}</span>
            )}
          </div>
          <div className="text-white text-4xl font-bold text-right break-all">
            {formatDisplay(display)}
          </div>
        </div>

        {/* Memory Buttons */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          <Button
            onClick={memoryClear}
            className="bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm py-2"
            ariaLabel="Memory Clear"
          >
            MC
          </Button>
          <Button
            onClick={memoryRecall}
            className="bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm py-2"
            ariaLabel="Memory Recall"
          >
            MR
          </Button>
          <Button
            onClick={memoryAdd}
            className="bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm py-2"
            ariaLabel="Memory Add"
          >
            M+
          </Button>
          <Button
            onClick={memorySubtract}
            className="bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm py-2"
            ariaLabel="Memory Subtract"
          >
            M-
          </Button>
          <Button
            onClick={memoryStore}
            className="bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm py-2"
            ariaLabel="Memory Store"
          >
            MS
          </Button>
        </div>

        {/* Main Buttons */}
        <div className="grid grid-cols-4 gap-3">
          {/* First Row */}
          <Button
            onClick={clear}
            className="bg-red-600 text-white hover:bg-red-500 col-span-2 py-4"
            ariaLabel="Clear"
          >
            AC
          </Button>
          <Button
            onClick={backspace}
            className="bg-orange-600 text-white hover:bg-orange-500 py-4"
            ariaLabel="Backspace"
          >
            ⌫
          </Button>
          <Button
            onClick={() => performOperation('÷')}
            className="bg-blue-600 text-white hover:bg-blue-500 py-4"
            ariaLabel="Divide"
          >
            ÷
          </Button>

          {/* Second Row */}
          <Button
            onClick={() => inputNumber('7')}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="7"
          >
            7
          </Button>
          <Button
            onClick={() => inputNumber('8')}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="8"
          >
            8
          </Button>
          <Button
            onClick={() => inputNumber('9')}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="9"
          >
            9
          </Button>
          <Button
            onClick={() => performOperation('×')}
            className="bg-blue-600 text-white hover:bg-blue-500 py-4"
            ariaLabel="Multiply"
          >
            ×
          </Button>

          {/* Third Row */}
          <Button
            onClick={() => inputNumber('4')}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="4"
          >
            4
          </Button>
          <Button
            onClick={() => inputNumber('5')}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="5"
          >
            5
          </Button>
          <Button
            onClick={() => inputNumber('6')}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="6"
          >
            6
          </Button>
          <Button
            onClick={() => performOperation('-')}
            className="bg-blue-600 text-white hover:bg-blue-500 py-4"
            ariaLabel="Subtract"
          >
            −
          </Button>

          {/* Fourth Row */}
          <Button
            onClick={() => inputNumber('1')}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="1"
          >
            1
          </Button>
          <Button
            onClick={() => inputNumber('2')}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="2"
          >
            2
          </Button>
          <Button
            onClick={() => inputNumber('3')}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="3"
          >
            3
          </Button>
          <Button
            onClick={() => performOperation('+')}
            className="bg-blue-600 text-white hover:bg-blue-500 py-4"
            ariaLabel="Add"
          >
            +
          </Button>

          {/* Fifth Row */}
          <Button
            onClick={toggleSign}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="Toggle Sign"
          >
            ±
          </Button>
          <Button
            onClick={() => inputNumber('0')}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="0"
          >
            0
          </Button>
          <Button
            onClick={inputDecimal}
            className="bg-gray-700 text-white hover:bg-gray-600 py-4"
            ariaLabel="Decimal"
          >
            .
          </Button>
          <Button
            onClick={performEquals}
            className="bg-green-600 text-white hover:bg-green-500 py-4"
            ariaLabel="Equals"
          >
            =
          </Button>
        </div>

        {/* Keyboard Hint */}
        <div className="mt-4 text-center text-gray-400 text-xs">
          💡 Tip: Use your keyboard for faster calculations
        </div>
      </div>
    </div>
  );
} 