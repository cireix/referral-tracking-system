import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import Home from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Stack Auth
jest.mock('@stackframe/stack', () => ({
  useUser: jest.fn(),
  UserButton: () => <div data-testid="user-button">User Button</div>,
  SignIn: ({ fullPage, automaticRedirect }: any) => (
    <div data-testid="sign-in-form">
      <input type="email" placeholder="Email" data-testid="email-input" />
      <input type="password" placeholder="Password" data-testid="password-input" />
      <button data-testid="sign-in-button">Sign In</button>
    </div>
  ),
  SignUp: ({ fullPage, automaticRedirect }: any) => (
    <div data-testid="sign-up-form">
      <input type="email" placeholder="Email" data-testid="signup-email-input" />
      <input type="password" placeholder="Password" data-testid="signup-password-input" />
      <button data-testid="sign-up-button">Sign Up</button>
    </div>
  ),
}));

// Mock Mixpanel
jest.mock('@/components/providers/MixpanelProvider', () => ({
  useMixpanel: () => ({
    track: jest.fn(),
    trackSignup: jest.fn(),
    trackReferralEvent: jest.fn(),
  }),
}));

// Mock MixpanelUserTracker
jest.mock('@/components/providers/MixpanelUserTracker', () => ({
  MixpanelUserTracker: () => null,
}));

// Mock hooks
jest.mock('@/hooks/useReferral', () => ({
  useReferral: jest.fn(() => ({
    trackReferral: jest.fn(() => Promise.resolve(true)),
    stats: null,
    loading: false,
    error: null,
  })),
}));

// Mock Calculator component
jest.mock('@/components/Calculator', () => {
  return function Calculator() {
    return <div data-testid="calculator">Calculator Component</div>;
  };
});

describe('Authentication Flow', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      pathname: '/',
    });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      (useUser as jest.Mock).mockReturnValue(null);
    });

    test('should display sign in form by default for unauthenticated users', () => {
      render(<Home />);
      
      expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-up-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('calculator')).not.toBeInTheDocument();
    });

    test('should switch between sign in and sign up forms', async () => {
      render(<Home />);
      
      // Initially shows sign in
      expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
      
      // Click to switch to sign up
      const createAccountButton = screen.getByText('Create one');
      await userEvent.click(createAccountButton);
      
      // Should now show sign up form
      expect(screen.queryByTestId('sign-in-form')).not.toBeInTheDocument();
      expect(screen.getByTestId('sign-up-form')).toBeInTheDocument();
      
      // Click to switch back to sign in
      const signInButton = screen.getByText('Sign in');
      await userEvent.click(signInButton);
      
      // Should show sign in form again
      expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-up-form')).not.toBeInTheDocument();
    });

    test('should not show user header when not authenticated', () => {
      render(<Home />);
      
      expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    const mockUser = {
      id: 'user-123',
      primaryEmail: 'test@example.com',
      displayName: 'Test User',
    };

    beforeEach(() => {
      (useUser as jest.Mock).mockReturnValue(mockUser);
    });

    test('should display calculator when user is authenticated', () => {
      render(<Home />);
      
      expect(screen.getByTestId('calculator')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-in-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sign-up-form')).not.toBeInTheDocument();
    });

    test('should display user header with welcome message', () => {
      render(<Home />);
      
      expect(screen.getByText(/Welcome, Test User!/)).toBeInTheDocument();
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    test('should display email if display name is not available', () => {
      (useUser as jest.Mock).mockReturnValue({
        ...mockUser,
        displayName: null,
      });
      
      render(<Home />);
      
      expect(screen.getByText(/Welcome, test@example.com!/)).toBeInTheDocument();
    });

    test('should have working dashboard link', () => {
      render(<Home />);
      
      const dashboardLink = screen.getByText('Dashboard');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Sign Up Flow', () => {
    beforeEach(() => {
      (useUser as jest.Mock).mockReturnValue(null);
    });

    test('should handle new user signup', async () => {
      const { rerender } = render(<Home />);
      
      // Switch to sign up form
      const createAccountButton = screen.getByText('Create one');
      await userEvent.click(createAccountButton);
      
      expect(screen.getByTestId('sign-up-form')).toBeInTheDocument();
      
      // Simulate successful signup
      localStorage.setItem('isNewUser', 'true');
      
      // Mock user becoming authenticated
      (useUser as jest.Mock).mockReturnValue({
        id: 'new-user-123',
        primaryEmail: 'newuser@example.com',
        displayName: 'New User',
      });
      
      rerender(<Home />);
      
      // Should now show calculator
      expect(screen.getByTestId('calculator')).toBeInTheDocument();
    });

    test('should track new user signup in localStorage', async () => {
      render(<Home />);
      
      // Set new user flag
      localStorage.setItem('isNewUser', 'true');
      
      // Mock user becoming authenticated
      (useUser as jest.Mock).mockReturnValue({
        id: 'new-user-456',
        primaryEmail: 'another@example.com',
        displayName: null,
      });
      
      const { rerender } = render(<Home />);
      
      await waitFor(() => {
        // New user flag should be cleared after tracking
        expect(localStorage.getItem('isNewUser')).toBeNull();
      });
    });
  });

  describe('Authentication State Transitions', () => {
    test('should handle user logging out', () => {
      // Start authenticated
      (useUser as jest.Mock).mockReturnValue({
        id: 'user-123',
        primaryEmail: 'test@example.com',
        displayName: 'Test User',
      });
      
      const { rerender } = render(<Home />);
      expect(screen.getByTestId('calculator')).toBeInTheDocument();
      
      // User logs out
      (useUser as jest.Mock).mockReturnValue(null);
      rerender(<Home />);
      
      // Should show sign in form
      expect(screen.queryByTestId('calculator')).not.toBeInTheDocument();
      expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
    });

    test('should handle user logging in', () => {
      // Start unauthenticated
      (useUser as jest.Mock).mockReturnValue(null);
      
      const { rerender } = render(<Home />);
      expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
      
      // User logs in
      (useUser as jest.Mock).mockReturnValue({
        id: 'user-789',
        primaryEmail: 'login@example.com',
        displayName: 'Login User',
      });
      rerender(<Home />);
      
      // Should show calculator
      expect(screen.getByTestId('calculator')).toBeInTheDocument();
      expect(screen.queryByTestId('sign-in-form')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('should render within Suspense boundary', () => {
      (useUser as jest.Mock).mockReturnValue(null);
      
      const { container } = render(<Home />);
      
      // The component should render without errors
      expect(container).toBeInTheDocument();
    });
  });
}); 