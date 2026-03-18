import { create } from 'zustand'

const MAX_SUCCESS_COUNT = 5

export const useSuccessStore = create((set) => ({
  successes: [],
  
  addSuccess: (success) => {
    const id = Date.now() + Math.random()
    const successItem = typeof success === 'string' 
      ? { id, message: success }
      : { id, ...success }
    
    console.log('[Success]', successItem.message)
    
    set((state) => {
      const newSuccesses = [...state.successes, successItem]
      if (newSuccesses.length > MAX_SUCCESS_COUNT) {
        newSuccesses.shift()
      }
      return { successes: newSuccesses }
    })
    
    setTimeout(() => {
      set((state) => ({
        successes: state.successes.filter((s) => s.id !== id)
      }))
    }, 3000)
  },
  
  removeSuccess: (id) => {
    set((state) => ({
      successes: state.successes.filter((s) => s.id !== id)
    }))
  }
}))
