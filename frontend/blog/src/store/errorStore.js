import { create } from 'zustand'

let errorIdCounter = 0

export const useErrorStore = create((set) => ({
  errors: [],
  
  addError: (error) => {
    const newError = {
      id: ++errorIdCounter,
      title: error.title || '错误',
      message: error.message || '发生了未知错误',
      details: error.details || null,
      timestamp: Date.now(),
    }
    
    set((state) => ({
      errors: [...state.errors, newError],
    }))

    console.error('[Error Toast]', newError)
  },
  
  removeError: (id) => {
    set((state) => ({
      errors: state.errors.filter((error) => error.id !== id),
    }))
  },
  
  clearErrors: () => {
    set({ errors: [] })
  },
}))
