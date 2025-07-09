import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveValue(value: string | number | string[]): R
      toBeDisabled(): R
      toBeEnabled(): R
      toBeVisible(): R
      toBeEmpty(): R
      toHaveTextContent(text: string | RegExp): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toBeChecked(): R
      toBePartiallyChecked(): R
      toHaveDescription(text: string | RegExp): R
    }
    
    interface Mock<T = any, Y extends any[] = any> {
      (...args: Y): T
      mock: {
        calls: Y[]
        instances: T[]
        contexts: any[]
        results: Array<{ type: 'return' | 'throw'; value: any }>
        lastCall: Y | undefined
      }
      mockClear(): Mock<T, Y>
      mockReset(): Mock<T, Y>
      mockRestore(): Mock<T, Y>
      mockImplementation(fn: (...args: Y) => T): Mock<T, Y>
      mockImplementationOnce(fn: (...args: Y) => T): Mock<T, Y>
      mockReturnThis(): Mock<T, Y>
      mockReturnValue(value: T): Mock<T, Y>
      mockReturnValueOnce(value: T): Mock<T, Y>
      mockResolvedValue(value: T extends Promise<any> ? T : Promise<T>): Mock<T, Y>
      mockResolvedValueOnce(value: T extends Promise<any> ? T : Promise<T>): Mock<T, Y>
      mockRejectedValue(value: any): Mock<T, Y>
      mockRejectedValueOnce(value: any): Mock<T, Y>
    }
    
    // For Zustand stores and other non-function mocks
    interface MockedStore<T> {
      mockReturnValue: (value: T) => MockedStore<T>
      mockReturnValueOnce: (value: T) => MockedStore<T>
      mockImplementation: (fn: () => T) => MockedStore<T>
      mockImplementationOnce: (fn: () => T) => MockedStore<T>
      mockClear: () => void
      mockReset: () => void
      mockRestore: () => void
    }
    
    type MockedFunction<T extends (...args: any[]) => any> = Mock<ReturnType<T>, Parameters<T>>
    type MockedStore<T> = MockedStore<T>
  }
  
  // Jest globals
  const describe: {
    (name: string, fn: () => void): void
    skip: (name: string, fn: () => void) => void
    only: (name: string, fn: () => void) => void
  }
  const it: {
    (name: string, fn: () => void | Promise<void>): void
    skip: (name: string, fn: () => void | Promise<void>) => void
    only: (name: string, fn: () => void | Promise<void>) => void
  }
  const test: {
    (name: string, fn: () => void | Promise<void>): void
    skip: (name: string, fn: () => void | Promise<void>) => void
    only: (name: string, fn: () => void | Promise<void>) => void
  }
  const expect: any
  const beforeEach: (fn: () => void | Promise<void>) => void
  const afterEach: (fn: () => void | Promise<void>) => void
  const beforeAll: (fn: () => void | Promise<void>) => void
  const afterAll: (fn: () => void | Promise<void>) => void
  const jest: {
    fn: <T = any, Y extends any[] = any>() => jest.Mock<T, Y>
    mock: (moduleName: string, factory?: () => any) => void
    clearAllMocks: () => void
  }
}

export {} 