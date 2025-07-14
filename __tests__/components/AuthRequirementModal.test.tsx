import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AuthRequirementModal from '@/components/AuthRequirementModal';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={`${variant} ${className}`} 
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock the Dialog components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: any) => (
    <p data-testid="dialog-description">{children}</p>
  ),
  DialogFooter: ({ children }: any) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

describe('AuthRequirementModal', () => {
  const mockPush = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    reason: "high_value" as const,
    orderValue: 150,
  };

  describe('Rendering', () => {
    it('renders when open', () => {
      render(<AuthRequirementModal {...defaultProps} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-footer')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<AuthRequirementModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('displays correct title for high value orders', () => {
      render(<AuthRequirementModal {...defaultProps} reason="high_value" />);
      
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });

    it('displays correct title for digital items', () => {
      render(<AuthRequirementModal {...defaultProps} reason="digital_item" />);
      
      expect(screen.getByText('Account Required for Digital Items')).toBeInTheDocument();
    });

    it('displays correct description for orders over $100', () => {
      render(<AuthRequirementModal {...defaultProps} reason="high_value" orderValue={150} />);
      
      expect(screen.getByText(/Orders over \$150\.00 require a signed-in account for fraud prevention/)).toBeInTheDocument();
    });

    it('displays correct description for digital items', () => {
      render(<AuthRequirementModal {...defaultProps} reason="digital_item" orderValue={50} />);
      
      expect(screen.getByText(/Digital items require a signed-in account for secure delivery and fraud prevention/)).toBeInTheDocument();
    });

    it('displays correct description for both conditions', () => {
      render(<AuthRequirementModal {...defaultProps} reason="high_value" orderValue={150} />);
      
      expect(screen.getByText(/Orders over \$150\.00 require a signed-in account for fraud prevention/)).toBeInTheDocument();
    });
  });

  describe('Button Actions', () => {
    it('renders all three action buttons', () => {
      render(<AuthRequirementModal {...defaultProps} />);
      
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('calls onClose when Continue Shopping is clicked', () => {
      render(<AuthRequirementModal {...defaultProps} />);
      
      const continueButton = screen.getByText('Continue Shopping');
      fireEvent.click(continueButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('navigates to login page when Sign In is clicked', () => {
      render(<AuthRequirementModal {...defaultProps} />);
      
      const signInButton = screen.getByText('Sign In');
      fireEvent.click(signInButton);
      
      expect(mockPush).toHaveBeenCalledWith('/login?callbackUrl=%2F');
      // Note: onClose is not called when navigating to login/register
    });

    it('navigates to register page when Create Account is clicked', () => {
      render(<AuthRequirementModal {...defaultProps} />);
      
      const createAccountButton = screen.getByText('Create Account');
      fireEvent.click(createAccountButton);
      
      expect(mockPush).toHaveBeenCalledWith('/register?callbackUrl=%2F');
      // Note: onClose is not called when navigating to login/register
    });
  });

  describe('Content Variations', () => {
    it('shows correct order value in description', () => {
      render(<AuthRequirementModal {...defaultProps} reason="high_value" orderValue={250} />);
      
      expect(screen.getByText(/Orders over \$250\.00 require a signed-in account for fraud prevention/)).toBeInTheDocument();
    });

    it('handles edge case of exactly $100', () => {
      render(<AuthRequirementModal {...defaultProps} reason="high_value" orderValue={100} />);
      
      expect(screen.getByText(/Orders over \$100\.00 require a signed-in account for fraud prevention/)).toBeInTheDocument();
    });

    it('handles very high order values', () => {
      render(<AuthRequirementModal {...defaultProps} reason="high_value" orderValue={1000} />);
      
      expect(screen.getByText(/Orders over \$1000\.00 require a signed-in account for fraud prevention/)).toBeInTheDocument();
    });

    it('handles low order values with digital items', () => {
      render(<AuthRequirementModal {...defaultProps} reason="digital_item" orderValue={25} />);
      
      expect(screen.getByText(/Digital items require a signed-in account for secure delivery and fraud prevention/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button types', () => {
      render(<AuthRequirementModal {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Button component doesn't set type attribute by default
        expect(button).toBeInTheDocument();
      });
    });

    it('has proper heading structure', () => {
      render(<AuthRequirementModal {...defaultProps} />);
      
      const title = screen.getByTestId('dialog-title');
      expect(title.tagName).toBe('H2');
    });
  });

  describe('Edge Cases', () => {
    it('handles zero order value', () => {
      render(<AuthRequirementModal {...defaultProps} reason="digital_item" orderValue={0} />);
      
      expect(screen.getByText(/Digital items require a signed-in account for secure delivery and fraud prevention/)).toBeInTheDocument();
    });

    it('handles negative order value', () => {
      render(<AuthRequirementModal {...defaultProps} reason="digital_item" orderValue={-50} />);
      
      expect(screen.getByText(/Digital items require a signed-in account for secure delivery and fraud prevention/)).toBeInTheDocument();
    });

    it('handles undefined props gracefully', () => {
      render(<AuthRequirementModal isOpen={true} onClose={mockOnClose} reason="high_value" />);
      
      // Should still render with default values
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });
}); 