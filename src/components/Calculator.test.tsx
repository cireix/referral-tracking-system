import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calculator from './Calculator';

// Mock Stack auth
jest.mock('@stackframe/stack', () => ({
  useUser: () => ({
    id: 'test-user',
    primaryEmail: 'test@example.com',
    displayName: 'Test User',
  }),
}));

// Mock Mixpanel provider
jest.mock('@/components/providers/MixpanelProvider', () => ({
  useMixpanel: () => ({
    track: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
  }),
}));

// Mock onboarding hook
jest.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    showOnboarding: false,
    startOnboarding: jest.fn(),
    completeOnboarding: jest.fn(),
  }),
}));

describe('Calculator Component', () => {
  describe('Initial Rendering', () => {
    it('should render calculator with initial display of 0', () => {
      render(<Calculator />);
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('0');
    });

    it('should render all number buttons', () => {
      render(<Calculator />);
      for (let i = 0; i <= 9; i++) {
        const button = screen.getByRole('button', { name: i.toString() });
        expect(button).toBeInTheDocument();
      }
    });

    it('should render all operation buttons', () => {
      render(<Calculator />);
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Subtract' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Multiply' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Divide' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Equals' })).toBeInTheDocument();
    });

    it('should render memory buttons', () => {
      render(<Calculator />);
      expect(screen.getByRole('button', { name: 'Memory Clear' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Memory Recall' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Memory Add' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Memory Subtract' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Memory Store' })).toBeInTheDocument();
    });

    it('should render special function buttons', () => {
      render(<Calculator />);
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Backspace' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Toggle Sign' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Decimal' })).toBeInTheDocument();
    });

    it('should display keyboard hint', () => {
      render(<Calculator />);
      expect(screen.getByText(/Tip: Use your keyboard/i)).toBeInTheDocument();
    });
  });

  describe('Number Input', () => {
    it('should display single digit when clicked', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '7' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('7');
    });

    it('should concatenate multiple digits', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('123');
    });

    it('should handle decimal point correctly', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '4' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('3.14');
    });

    it('should not allow multiple decimal points', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '4' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('3.14');
    });

    it('should replace 0 with new number', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('5');
    });

    it('should start with 0. when decimal is first input', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('0.5');
    });

    it('should handle leading zeros correctly', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: '7' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('7');
    });
  });

  describe('Basic Arithmetic Operations', () => {
    it('should perform addition correctly', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('8');
    });

    it('should perform subtraction correctly', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '9' }));
      fireEvent.click(screen.getByRole('button', { name: 'Subtract' }));
      fireEvent.click(screen.getByRole('button', { name: '4' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('5');
    });

    it('should perform multiplication correctly', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '6' }));
      fireEvent.click(screen.getByRole('button', { name: 'Multiply' }));
      fireEvent.click(screen.getByRole('button', { name: '7' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('42');
    });

    it('should perform division correctly', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '8' }));
      fireEvent.click(screen.getByRole('button', { name: 'Divide' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('4');
    });

    it('should handle division by zero', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Divide' }));
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('Error');
    });

    it('should chain operations correctly', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Multiply' }));
      fireEvent.click(screen.getByRole('button', { name: '4' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('20');
    });

    it('should handle decimal arithmetic correctly', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      const value = parseFloat(display?.textContent || '0');
      expect(value).toBeCloseTo(0.3, 5);
    });

    it('should handle negative number operations', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sign' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('-2');
    });
  });

  describe('Operator Replacement', () => {
    it('should replace operator when consecutive operators are pressed', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: 'Subtract' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('2');
    });

    it('should replace multiple consecutive operators', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: 'Subtract' }));
      fireEvent.click(screen.getByRole('button', { name: 'Multiply' }));
      fireEvent.click(screen.getByRole('button', { name: 'Divide' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('5');
    });

    it('should show operator in display when replaced', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '8' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(screen.getByText('8 +')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Multiply' }));
      expect(screen.getByText('8 ×')).toBeInTheDocument();
    });
  });

  describe('Clear Functions', () => {
    it('should clear all with AC button', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('0');
    });

    it('should clear operation history with AC', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(screen.getByText('5 +')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      expect(screen.queryByText('5 +')).not.toBeInTheDocument();
    });

    it('should handle backspace correctly', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Backspace' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('12');
    });

    it('should display 0 when last digit is deleted', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Backspace' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('0');
    });

    it('should handle backspace with decimal numbers', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '4' }));
      fireEvent.click(screen.getByRole('button', { name: 'Backspace' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('3.1');
    });
  });

  describe('Toggle Sign Function', () => {
    it('should toggle positive to negative', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sign' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('-5');
    });

    it('should toggle negative to positive', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sign' }));
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sign' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('5');
    });

    it('should toggle sign of decimal numbers', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sign' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('-3.5');
    });

    it('should handle toggle sign on zero', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sign' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('0');
    });
  });

  describe('Memory Functions', () => {
    it('should store and recall value from memory', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '4' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Store' }));
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Recall' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('42');
    });

    it('should add to memory', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Store' }));
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Add' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Recall' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('15');
    });

    it('should subtract from memory', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Store' }));
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Subtract' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Recall' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('15');
    });

    it('should clear memory', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '7' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Store' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Clear' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Recall' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('0');
    });

    it('should show memory indicator when memory is not zero', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Store' }));
      expect(screen.getByText(/M: 5/)).toBeInTheDocument();
    });

    it('should not show memory indicator when memory is zero', () => {
      render(<Calculator />);
      expect(screen.queryByText(/M:/)).not.toBeInTheDocument();
    });

    it('should handle memory operations with decimals', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Store' }));
      expect(screen.getByText(/M: 3.5/)).toBeInTheDocument();
    });

    it('should handle memory operations with negative numbers', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '8' }));
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Sign' }));
      fireEvent.click(screen.getByRole('button', { name: 'Memory Store' }));
      expect(screen.getByText(/M: -8/)).toBeInTheDocument();
    });
  });

  describe('Keyboard Support', () => {
    it('should handle number keys', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('5');
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('5');
    });

    it('should handle multiple number keys', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('123');
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('123');
    });

    it('should handle addition with keyboard', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('9+3=');
      await waitFor(() => {
        const display = document.querySelector('.text-4xl');
        expect(display?.textContent).toBe('12');
      });
    });

    it('should handle subtraction with keyboard', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('8-3=');
      await waitFor(() => {
        const display = document.querySelector('.text-4xl');
        expect(display?.textContent).toBe('5');
      });
    });

    it('should handle multiplication with * key', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('6*7=');
      await waitFor(() => {
        const display = document.querySelector('.text-4xl');
        expect(display?.textContent).toBe('42');
      });
    });

    it('should handle division with / key', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('8/2=');
      await waitFor(() => {
        const display = document.querySelector('.text-4xl');
        expect(display?.textContent).toBe('4');
      });
    });

    it('should handle Enter key as equals', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('5+3{Enter}');
      await waitFor(() => {
        const display = document.querySelector('.text-4xl');
        expect(display?.textContent).toBe('8');
      });
    });

    it('should handle Escape key for clear', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('42');
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('42');
      await user.keyboard('{Escape}');
      const displayAfterEscape = document.querySelector('.text-4xl');
      expect(displayAfterEscape?.textContent).toBe('0');
    });

    it('should handle Backspace key', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('123{Backspace}');
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('12');
    });

    it('should handle decimal point key', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('3.14');
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('3.14');
    });

    it('should handle percentage key', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('50%');
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('0.5');
    });

    it('should handle complex keyboard calculations', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      await user.keyboard('12+8*2-4/2=');
      await waitFor(() => {
        const display = document.querySelector('.text-4xl');
        expect(display?.textContent).toBe('18');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large numbers with exponential notation', () => {
      render(<Calculator />);
      for (let i = 0; i < 13; i++) {
        fireEvent.click(screen.getByRole('button', { name: '9' }));
      }
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toMatch(/[0-9]+\.?[0-9]*e\+[0-9]+/i);
    });

    it('should handle very small numbers', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Divide' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByRole('button', { name: '0' }));
      }
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toMatch(/[0-9]+\.?[0-9]*e-[0-9]+/i);
    });

    it('should handle equals without operation', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('5');
    });

    it('should handle multiple equals presses', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('5');
    });

    it('should continue calculation after equals', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('10');
    });

    it('should handle floating point precision issues', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: 'Decimal' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      const value = parseFloat(display?.textContent || '0');
      expect(value).toBeCloseTo(0.3, 5);
    });

    it('should recover from Error state', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Divide' }));
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      let display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('Error');
      
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('5');
    });

    it('should handle zero divided by number', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '0' }));
      fireEvent.click(screen.getByRole('button', { name: 'Divide' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toBe('0');
    });
  });

  describe('Display Formatting', () => {
    it('should show operation history', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(screen.getByText('5 +')).toBeInTheDocument();
    });

    it('should update operation history when chaining', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Multiply' }));
      expect(screen.getByText('8 ×')).toBeInTheDocument();
    });

    it('should clear operation history after equals', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(screen.getByText('5 +')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      expect(screen.queryByText('5 +')).not.toBeInTheDocument();
    });

    it('should format very long results in exponential notation', () => {
      render(<Calculator />);
      fireEvent.click(screen.getByRole('button', { name: '9' }));
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByRole('button', { name: '9' }));
      }
      fireEvent.click(screen.getByRole('button', { name: 'Multiply' }));
      fireEvent.click(screen.getByRole('button', { name: '9' }));
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByRole('button', { name: '9' }));
      }
      fireEvent.click(screen.getByRole('button', { name: 'Equals' }));
      const display = document.querySelector('.text-4xl');
      expect(display?.textContent).toMatch(/[0-9]+\.?[0-9]*e\+[0-9]+/i);
    });
  });
}); 