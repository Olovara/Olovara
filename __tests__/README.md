# Testing Setup for Yarnnu Marketplace

## Overview
This directory contains tests for the Yarnnu marketplace application. We're setting up Jest with React Testing Library for comprehensive component and integration testing.

## Setup Instructions

### 1. Install Dependencies
First, install the required testing dependencies:

```bash
yarn add -D jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Or if you prefer npm:
```bash
npm install --save-dev jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 2. Configuration Files
- `jest.config.js` - Jest configuration optimized for Next.js
- `jest.setup.js` - Global test setup and mocks
- `__tests__/utils/test-utils.tsx` - Custom test utilities and providers

### 3. Running Tests
Once dependencies are installed, you can run:

```bash
# Run all tests
yarn test

# Run tests in watch mode (recommended during development)
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

## Test Structure

```
__tests__/
├── components/          # Component tests
│   ├── ui/             # UI component tests
│   ├── forms/          # Form component tests
│   └── shared/         # Shared component tests
├── hooks/              # Custom hook tests
├── lib/                # Utility function tests
├── actions/            # Server action tests
└── utils/              # Test utilities
    └── test-utils.tsx  # Custom render function and test helpers
```

## Writing Tests

### Component Test Example
```tsx
import { render, screen, fireEvent } from '../utils/test-utils'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Test Data Factories
Use the provided test data factories for consistent test data:

```tsx
import { createMockProduct, createMockUser } from '../utils/test-utils'

const mockProduct = createMockProduct({ name: 'Custom Product' })
const mockUser = createMockUser({ role: 'seller' })
```

## Testing Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Test User Interactions**: Test how users actually interact with your components
4. **Keep Tests Simple**: Each test should have a single responsibility
5. **Use Descriptive Names**: Test names should clearly describe what's being tested

## Common Testing Patterns

### Testing Forms
```tsx
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'

it('submits form with correct data', async () => {
  const handleSubmit = jest.fn()
  render(<MyForm onSubmit={handleSubmit} />)
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  })
  fireEvent.click(screen.getByRole('button', { name: /submit/i }))
  
  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com'
    })
  })
})
```

### Testing API Calls
```tsx
import { render, screen, waitFor } from '../utils/test-utils'

it('fetches and displays data', async () => {
  render(<DataComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Product Name')).toBeInTheDocument()
  })
})
```

## Coverage Goals
- **Components**: 80%+ coverage
- **Hooks**: 90%+ coverage  
- **Utilities**: 95%+ coverage
- **Actions**: 70%+ coverage

## Next Steps
1. Install the testing dependencies
2. Start with simple component tests
3. Gradually add more complex integration tests
4. Set up CI/CD pipeline to run tests automatically 