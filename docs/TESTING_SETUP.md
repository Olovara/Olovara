# Jest Testing Setup for OLOVARA Marketplace

## 🎯 Overview
I've set up a comprehensive testing framework for your OLOVARA marketplace using Jest, React Testing Library, and TypeScript. This will help you catch bugs early and ensure your code works as expected before deployment.

## 📦 Installation

### Step 1: Install Dependencies
Run one of these commands in your project root:

```bash
# Using yarn (recommended)
yarn add -D jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Or using npm
npm install --save-dev jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Step 2: Verify Configuration Files
The following files have been created:
- `jest.config.js` - Jest configuration optimized for Next.js
- `jest.setup.js` - Global test setup and mocks
- `__tests__/utils/test-utils.tsx` - Custom test utilities and providers
- `__tests__/README.md` - Detailed testing documentation

## 🚀 Running Tests

Once dependencies are installed, you can run:

```bash
# Run all tests
yarn test

# Run tests in watch mode (recommended during development)
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

## 📁 Test Structure

```
__tests__/
├── components/          # Component tests
│   ├── ui/             # UI component tests
│   │   └── button.test.tsx
│   └── forms/          # Form component tests
│       └── ContactUsForm.test.tsx
├── hooks/              # Custom hook tests
│   └── use-debounce.test.ts
├── lib/                # Utility function tests
│   └── utils.test.ts
├── examples/           # Example tests
│   └── simple-function.test.ts
└── utils/              # Test utilities
    └── test-utils.tsx
```

## 🧪 Example Tests Created

### 1. Utility Functions (`__tests__/lib/utils.test.ts`)
Tests for your core utility functions:
- `cn()` - className merging utility
- `shopNameSlugify()` - shop name slugification
- `formatPrice()` - price formatting with different currencies

### 2. Button Component (`__tests__/components/ui/button.test.tsx`)
Comprehensive tests for your Button component:
- All variants (default, destructive, outline, etc.)
- All sizes (sm, default, lg, icon)
- Click events and disabled states
- Ref forwarding and asChild prop

### 3. ContactUsForm (`__tests__/components/forms/ContactUsForm.test.tsx`)
Complex form testing example:
- Form rendering and field validation
- User interactions and form submission
- Error handling and success states
- Honeypot spam protection
- Form reset after submission

### 4. useDebounce Hook (`__tests__/hooks/use-debounce.test.ts`)
Custom hook testing:
- Debouncing functionality
- Timer cleanup
- Different data types (strings, numbers, objects, arrays)
- Rapid value changes

## 🎯 Testing Best Practices

### 1. Test Behavior, Not Implementation
```tsx
// ✅ Good - Test what the user sees
expect(screen.getByText('Submit')).toBeInTheDocument()

// ❌ Bad - Test implementation details
expect(component.state.isLoading).toBe(true)
```

### 2. Use Semantic Queries
```tsx
// ✅ Good - Use accessible queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)

// ❌ Bad - Use test IDs when possible
screen.getByTestId('submit-button')
```

### 3. Test User Interactions
```tsx
// ✅ Good - Test how users interact
fireEvent.change(screen.getByLabelText(/email/i), {
  target: { value: 'test@example.com' }
})
fireEvent.click(screen.getByRole('button', { name: /submit/i }))
```

### 4. Keep Tests Simple
```tsx
// ✅ Good - One assertion per test
it('should display error message', () => {
  render(<Form />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('Required field')).toBeInTheDocument()
})

// ❌ Bad - Multiple unrelated assertions
it('should handle form submission', () => {
  // Too many things being tested
})
```

## 🔧 Common Testing Patterns

### Testing Forms
```tsx
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
it('fetches and displays data', async () => {
  render(<DataComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Product Name')).toBeInTheDocument()
  })
})
```

### Testing Custom Hooks
```tsx
it('should debounce value changes', () => {
  const { result, rerender } = renderHook(
    ({ value, delay }) => useDebounce(value, delay),
    { initialProps: { value: 'initial', delay: 500 } }
  )
  
  rerender({ value: 'changed', delay: 500 })
  expect(result.current).toBe('initial')
  
  act(() => {
    jest.advanceTimersByTime(500)
  })
  expect(result.current).toBe('changed')
})
```

## 📊 Coverage Goals

- **Components**: 80%+ coverage
- **Hooks**: 90%+ coverage  
- **Utilities**: 95%+ coverage
- **Actions**: 70%+ coverage

## 🚨 Important Notes

### 1. Mocking External Dependencies
The setup includes mocks for:
- Next.js router and Image component
- Socket.io client
- Stripe
- reCAPTCHA
- Environment variables

### 2. Test Data Factories
Use the provided test data factories for consistent test data:
```tsx
import { createMockProduct, createMockUser } from '../utils/test-utils'

const mockProduct = createMockProduct({ name: 'Custom Product' })
const mockUser = createMockUser({ role: 'seller' })
```

### 3. Custom Render Function
The test utilities include a custom render function that provides:
- Session provider for authentication
- Consistent test environment
- Re-exported testing library functions

## 🎯 Next Steps

1. **Install the dependencies** (see Installation section above)
2. **Run the example tests** to verify everything works
3. **Start with simple component tests** for your UI components
4. **Add form tests** for your complex forms
5. **Test your custom hooks** and utility functions
6. **Add integration tests** for critical user flows
7. **Set up CI/CD** to run tests automatically

## 🐛 Troubleshooting

### Common Issues:

1. **"Cannot find module '@testing-library/react'"**
   - Make sure you've installed the dependencies
   - Check that the package.json includes the dev dependencies

2. **"Jest is not defined"**
   - Ensure @types/jest is installed
   - Check that jest.config.js is in the root directory

3. **"Cannot find module '@/components/...'"**
   - Verify your tsconfig.json paths are correct
   - Check that the jest.config.js moduleNameMapping is set up

4. **Tests failing due to missing mocks**
   - Add appropriate mocks in jest.setup.js
   - Mock external dependencies in individual test files

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)

---

**Remember**: Start small and build up your test coverage gradually. Focus on testing the most critical user flows first, then expand to cover more edge cases and utility functions. 