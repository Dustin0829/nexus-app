import { create } from 'zustand'

interface LoadingState {
  loadings: Record<string, string | boolean>
  startLoading: (action: string, message?: string | boolean) => void
  stopLoading: (action: string) => void
  stopAllLoading: () => void
}

export const useLoadingStore = create<LoadingState>((set) => ({
  loadings: {},

  startLoading: (action: string, message: string | boolean = true) => {
    set((state) => ({
      loadings: {
        ...state.loadings,
        [action]: message,
      },
    }))
  },

  stopLoading: (action: string) => {
    set((state) => {
      const newLoadings = { ...state.loadings }
      delete newLoadings[action]
      return { loadings: newLoadings }
    })
  },

  stopAllLoading: () => {
    set({ loadings: {} })
  },
}))
