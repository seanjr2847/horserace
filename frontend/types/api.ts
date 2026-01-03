import { Race, RaceEntry } from './race'
import { Prediction, PredictionResponse } from './prediction'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface RaceListResponse {
  success: boolean
  races: Race[]
  message?: string
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface RaceDetailResponse {
  success?: boolean
  race: Race
  entries: RaceEntry[]
  predictions: any[]
}

export interface HealthCheckResponse {
  status: string
  database: string
  redis?: string
  timestamp: string
}

export interface ErrorResponse {
  detail: string
  error_code?: string
}
