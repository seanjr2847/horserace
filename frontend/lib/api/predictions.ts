import apiClient from './client'
import type {
  Prediction,
  PredictionRequest,
  PredictionResponse,
  PredictionType,
} from '@/types'

export const predictionsApi = {
  generatePrediction: async (
    raceId: number,
    predictionTypes: PredictionType[]
  ): Promise<PredictionResponse> => {
    const response = await apiClient.post<PredictionResponse>(
      '/v1/predictions/generate',
      {
        race_id: raceId,
        prediction_types: predictionTypes,
      }
    )
    return response.data
  },

  getPrediction: async (raceId: number): Promise<Prediction[]> => {
    const response = await apiClient.get<{ predictions: Prediction[] }>(
      `/v1/predictions/${raceId}`
    )
    return response.data.predictions
  },

  getPredictionById: async (predictionId: number): Promise<Prediction> => {
    const response = await apiClient.get<Prediction>(
      `/v1/predictions/detail/${predictionId}`
    )
    return response.data
  },
}
