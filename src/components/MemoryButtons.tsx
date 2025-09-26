'use client';

import CalculatorButton from './CalculatorButton';

interface MemoryButton {
  label: string;
  ariaLabel: string;
  onClick: () => void;
}

interface MemoryButtonsProps {
  onMemoryClear: () => void;
  onMemoryRecall: () => void;
  onMemoryAdd: () => void;
  onMemorySubtract: () => void;
  onMemoryStore: () => void;
}

export default function MemoryButtons({
  onMemoryClear,
  onMemoryRecall,
  onMemoryAdd,
  onMemorySubtract,
  onMemoryStore
}: MemoryButtonsProps) {
  const memoryButtons: MemoryButton[] = [
    { label: 'MC', ariaLabel: 'Memory Clear', onClick: onMemoryClear },
    { label: 'MR', ariaLabel: 'Memory Recall', onClick: onMemoryRecall },
    { label: 'M+', ariaLabel: 'Memory Add', onClick: onMemoryAdd },
    { label: 'M-', ariaLabel: 'Memory Subtract', onClick: onMemorySubtract },
    { label: 'MS', ariaLabel: 'Memory Store', onClick: onMemoryStore },
  ];

  return (
    <div className="memory-buttons grid grid-cols-5 gap-2 mb-3">
      {memoryButtons.map((button) => (
        <CalculatorButton
          key={button.label}
          onClick={button.onClick}
          className="bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm py-2"
          ariaLabel={button.ariaLabel}
        >
          {button.label}
        </CalculatorButton>
      ))}
    </div>
  );
} 