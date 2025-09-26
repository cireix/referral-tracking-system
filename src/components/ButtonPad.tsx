'use client';

import CalculatorButton from './CalculatorButton';

interface ButtonConfig {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  className: string;
  colSpan?: number;
}

interface ButtonPadProps {
  onNumberInput: (num: string) => void;
  onOperation: (op: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onEquals: () => void;
  onToggleSign: () => void;
  onDecimal: () => void;
}

export default function ButtonPad({
  onNumberInput,
  onOperation,
  onClear,
  onBackspace,
  onEquals,
  onToggleSign,
  onDecimal
}: ButtonPadProps) {
  // Button styles
  const styles = {
    number: 'bg-gray-700 text-white hover:bg-gray-600 py-4',
    operator: 'bg-blue-600 text-white hover:bg-blue-500 py-4',
    clear: 'bg-red-600 text-white hover:bg-red-500 py-4',
    backspace: 'bg-orange-600 text-white hover:bg-orange-500 py-4',
    equals: 'bg-green-600 text-white hover:bg-green-500 py-4',
    special: 'bg-gray-700 text-white hover:bg-gray-600 py-4'
  };

  // Generate number buttons configuration
  const createNumberButton = (num: string): ButtonConfig => ({
    label: num,
    ariaLabel: num,
    onClick: () => onNumberInput(num),
    className: styles.number
  });

  // Button layout configuration
  const buttonRows: ButtonConfig[][] = [
    // First Row
    [
      { label: 'AC', ariaLabel: 'Clear', onClick: onClear, className: styles.clear, colSpan: 2 },
      { label: '⌫', ariaLabel: 'Backspace', onClick: onBackspace, className: styles.backspace },
      { label: '÷', ariaLabel: 'Divide', onClick: () => onOperation('÷'), className: styles.operator }
    ],
    // Second Row
    [
      createNumberButton('7'),
      createNumberButton('8'),
      createNumberButton('9'),
      { label: '×', ariaLabel: 'Multiply', onClick: () => onOperation('×'), className: styles.operator }
    ],
    // Third Row
    [
      createNumberButton('4'),
      createNumberButton('5'),
      createNumberButton('6'),
      { label: '−', ariaLabel: 'Subtract', onClick: () => onOperation('-'), className: styles.operator }
    ],
    // Fourth Row
    [
      createNumberButton('1'),
      createNumberButton('2'),
      createNumberButton('3'),
      { label: '+', ariaLabel: 'Add', onClick: () => onOperation('+'), className: styles.operator }
    ],
    // Fifth Row
    [
      { label: '±', ariaLabel: 'Toggle Sign', onClick: onToggleSign, className: styles.special },
      createNumberButton('0'),
      { label: '.', ariaLabel: 'Decimal', onClick: onDecimal, className: styles.special },
      { label: '=', ariaLabel: 'Equals', onClick: onEquals, className: styles.equals }
    ]
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {buttonRows.flat().map((button, index) => (
        <CalculatorButton
          key={`${button.label}-${index}`}
          onClick={button.onClick}
          className={button.className}
          ariaLabel={button.ariaLabel}
          colSpan={button.colSpan}
        >
          {button.label}
        </CalculatorButton>
      ))}
    </div>
  );
} 