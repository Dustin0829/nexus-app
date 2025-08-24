import { create } from 'zustand'

interface LoadingState {
  isLoading: boolean
  loadingMessage: string
  loadingActions: Set<string>
  startLoading: (action: string, message?: string) => void
  stopLoading: (action: string) => void
  stopAllLoading: () => void
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  isLoading: false,
  loadingMessage: '',
  loadingActions: new Set(),
  
  startLoading: (action: string, message?: string) => {
    const { loadingActions } = get()
    const newActions = new Set(loadingActions)
    newActions.add(action)
    
    set({
      isLoading: true,
      loadingMessage: message || 'Loading...',
      loadingActions: newActions,
    })
  },
  
  stopLoading: (action: string) => {
    const { loadingActions } = get()
    const newActions = new Set(loadingActions)
    newActions.delete(action)
    
    set({
      isLoading: newActions.size > 0,
      loadingMessage: newActions.size > 0 ? get().loadingMessage : '',
      loadingActions: newActions,
    })
  },
  
  stopAllLoading: () => {
    set({
      isLoading: false,
      loadingMessage: '',
      loadingActions: new Set(),
    })
  },
}))
