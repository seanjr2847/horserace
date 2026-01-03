export type PredictionType = 'win' | 'place' | 'quinella' | 'exacta' | 'trifecta'

export interface WinPrediction {
  horse_id: number
  horse_name: string
  probability: number
  reasoning: string
}

export interface PlacePrediction {
  horse_id: number
  horse_name: string
  probability: number
  reasoning: string
}

export interface QuinellaPrediction {
  combination: number[]
  horse_names: string[]
  probability: number
  expected_return?: number
  reasoning: string
}

export interface ExactaPrediction {
  combination: number[]
  horse_names: string[]
  probability: number
  expected_return?: number
  reasoning: string
}

export interface TrifectaPrediction {
  combination: number[]
  horse_names: string[]
  probability: number
  expected_return?: number
  reasoning: string
}

export interface PredictionData {
  win?: WinPrediction[]
  place?: PlacePrediction[]
  quinella?: QuinellaPrediction[]
  exacta?: ExactaPrediction[]
  trifecta?: TrifectaPrediction[]
}

export interface Prediction {
  id: number
  race_id: number
  prediction_type: PredictionType
  prediction_data: PredictionData
  confidence_score: number
  llm_model_version: string
  llm_reasoning?: string
  created_at: string
  updated_at: string
}

export interface PredictionRequest {
  race_id: number
  prediction_types: PredictionType[]
}

export interface PredictionResponse {
  predictions: Prediction[]
  race_info: {
    race_date: string
    race_number: number
    track_name: string
  }
}
