import { create } from 'zustand'
import type { Prediction, PredictionType, PredictionResponse } from '@/types'
import { predictionsApi } from '@/lib/api'

interface PredictionState {
  predictions: Prediction[]
  currentPrediction: PredictionResponse | null
  loading: boolean
  error: string | null
  generating: boolean

  generatePrediction: (
    raceId: number,
    predictionTypes: PredictionType[]
  ) => Promise<void>
  fetchPrediction: (raceId: number) => Promise<void>
  clearPredictions: () => void
  clearError: () => void
}

export const usePredictionStore = create<PredictionState>((set) => ({
  predictions: [],
  currentPrediction: null,
  loading: false,
  error: null,
  generating: false,

  generatePrediction: async (
    raceId: number,
    predictionTypes: PredictionType[]
  ) => {
    set({ generating: true, error: null })
    try {
      const response = await predictionsApi.generatePrediction(raceId, predictionTypes)
      set({
        currentPrediction: response,
        predictions: response.predictions,
        generating: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '예측 생성에 실패했습니다',
        generating: false,
      })
    }
  },

  fetchPrediction: async (raceId: number) => {
    set({ loading: true, error: null })
    try {
      const predictions = await predictionsApi.getPrediction(raceId)
      set({ predictions, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '예측 데이터를 불러올 수 없습니다',
        loading: false,
      })
    }
  },

  clearPredictions: () => {
    set({ predictions: [], currentPrediction: null })
  },

  clearError: () => {
    set({ error: null })
  },
}))
