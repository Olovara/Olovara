import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/use-debounce'

// Mock setTimeout and clearTimeout
jest.useFakeTimers()

describe('useDebounce', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // Change the value
    rerender({ value: 'changed', delay: 500 })
    
    // Value should still be the old one immediately
    expect(result.current).toBe('initial')
    
    // Fast forward time by less than the delay
    act(() => {
      jest.advanceTimersByTime(400)
    })
    
    // Value should still be the old one
    expect(result.current).toBe('initial')
    
    // Fast forward to complete the delay
    act(() => {
      jest.advanceTimersByTime(100)
    })
    
    // Now the value should be updated
    expect(result.current).toBe('changed')
  })

  it('should cancel previous timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // Change value multiple times rapidly
    rerender({ value: 'first', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    rerender({ value: 'second', delay: 500 })
    
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    rerender({ value: 'final', delay: 500 })
    
    // Value should still be initial
    expect(result.current).toBe('initial')
    
    // Fast forward to complete the delay from the last change
    act(() => {
      jest.advanceTimersByTime(300)
    })
    
    // Should show the final value, not intermediate ones
    expect(result.current).toBe('final')
  })

  it('should work with different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    )

    rerender({ value: 'changed', delay: 1000 })
    
    // After 500ms, should still be initial
    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe('initial')
    
    // After 1000ms, should be changed
    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe('changed')
  })

  it('should work with zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    )

    rerender({ value: 'changed', delay: 0 })
    
    // With zero delay, should update immediately
    expect(result.current).toBe('changed')
  })

  it('should work with numbers', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    )

    rerender({ value: 42, delay: 300 })
    
    expect(result.current).toBe(0)
    
    act(() => {
      jest.advanceTimersByTime(300)
    })
    
    expect(result.current).toBe(42)
  })

  it('should work with objects', () => {
    const initialObj = { name: 'John', age: 30 }
    const changedObj = { name: 'Jane', age: 25 }
    
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialObj, delay: 200 } }
    )

    rerender({ value: changedObj, delay: 200 })
    
    expect(result.current).toBe(initialObj)
    
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    expect(result.current).toBe(changedObj)
  })

  it('should work with arrays', () => {
    const initialArray = [1, 2, 3]
    const changedArray = [4, 5, 6]
    
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialArray, delay: 150 } }
    )

    rerender({ value: changedArray, delay: 150 })
    
    expect(result.current).toBe(initialArray)
    
    act(() => {
      jest.advanceTimersByTime(150)
    })
    
    expect(result.current).toBe(changedArray)
  })

  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    rerender({ value: 'changed', delay: 200 })
    
    // Should use the new delay (200ms)
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    expect(result.current).toBe('changed')
  })

  it('should clean up timers on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    
    const { unmount } = renderHook(() => useDebounce('test', 1000))
    
    unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
    
    clearTimeoutSpy.mockRestore()
  })
}) 