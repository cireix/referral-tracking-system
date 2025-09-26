'use client';

interface CalculatorDisplayProps {
  display: string;
  memory: number;
  operation: string | null;
  previousValue: string | null;
  formatDisplay: (value: string) => string;
}

export default function CalculatorDisplay({
  display,
  memory,
  operation,
  previousValue,
  formatDisplay
}: CalculatorDisplayProps) {
  return (
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
  );
} 