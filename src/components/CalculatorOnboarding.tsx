'use client';

import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface CalculatorOnboardingProps {
  run?: boolean;
  onComplete?: () => void;
}

const CalculatorOnboarding: React.FC<CalculatorOnboardingProps> = ({ 
  run = false, 
  onComplete 
}) => {
  const [runTour, setRunTour] = useState(run);

  useEffect(() => {
    setRunTour(run);
  }, [run]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">Welcome to the Calculator! 🧮</h3>
          <p>Let me show you around this powerful calculator. You can use it with your mouse or keyboard!</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.calculator-display',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">Display Screen</h3>
          <p>This is where your numbers and results appear. It shows:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Current number or result</li>
            <li>Previous operation (top left)</li>
            <li>Memory indicator (top right)</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.memory-buttons',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">Memory Functions</h3>
          <p>Save and recall numbers for complex calculations:</p>
          <ul className="list-disc list-inside mt-2">
            <li><strong>MC</strong> - Clear memory</li>
            <li><strong>MR</strong> - Recall from memory</li>
            <li><strong>M+</strong> - Add to memory</li>
            <li><strong>M-</strong> - Subtract from memory</li>
            <li><strong>MS</strong> - Store in memory</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.number-pad',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">Number Pad</h3>
          <p>Click any number to input it, or use your keyboard!</p>
          <p className="mt-2">The decimal point (.) lets you enter decimal numbers.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.operation-buttons',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">Operations</h3>
          <p>Basic math operations:</p>
          <ul className="list-disc list-inside mt-2">
            <li><strong>÷</strong> - Division (or use /)</li>
            <li><strong>×</strong> - Multiplication (or use *)</li>
            <li><strong>−</strong> - Subtraction (or use -)</li>
            <li><strong>+</strong> - Addition</li>
            <li><strong>=</strong> - Calculate result (or press Enter)</li>
          </ul>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.special-buttons',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">Special Functions</h3>
          <ul className="list-disc list-inside">
            <li><strong>AC</strong> - Clear everything (or press Escape)</li>
            <li><strong>⌫</strong> - Delete last digit (or press Backspace)</li>
            <li><strong>±</strong> - Change sign (positive/negative)</li>
            <li><strong>%</strong> - Convert to percentage</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.keyboard-tip',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">Keyboard Shortcuts 🎹</h3>
          <p>You can use your keyboard for faster calculations:</p>
          <ul className="list-disc list-inside mt-2">
            <li>Numbers: 0-9</li>
            <li>Operations: +, -, *, /</li>
            <li>Equals: Enter or =</li>
            <li>Clear: Escape</li>
            <li>Delete: Backspace</li>
            <li>Percentage: %</li>
          </ul>
        </div>
      ),
      placement: 'top',
    },
    {
      target: 'body',
      content: (
        <div className="text-left">
          <h3 className="font-bold text-lg mb-2">You're All Set! 🎉</h3>
          <p>Now you know how to use all the calculator features.</p>
          <p className="mt-2">Need this tour again? Click the help button (?) at any time!</p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous={true}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#3b82f6',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#ffffff',
          width: 380,
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          marginRight: '10px',
          color: '#6b7280',
        },
        buttonSkip: {
          color: '#6b7280',
        },
        buttonClose: {
          display: 'none',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish Tour',
        next: 'Next',
        open: 'Open the dialog',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default CalculatorOnboarding; 