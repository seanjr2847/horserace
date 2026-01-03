import apiClient from './client'
import type {
  Race,
  RaceEntry,
  RaceListResponse,
  RaceDetailResponse,
  ApiResponse,
} from '@/types'

export const racesApi = {
  getTodayRaces: async (): Promise<Race[]> => {
    const response = await apiClient.get<RaceListResponse>('/v1/races/today')
    return response.data.races
  },

  getRacesByDate: async (date: string): Promise<Race[]> => {
    const response = await apiClient.get<RaceListResponse>(`/v1/races`, {
      params: { race_date: date },
    })
    return response.data.races
  },

  getRaceDetail: async (raceId: number): Promise<RaceDetailResponse> => {
    const response = await apiClient.get<RaceDetailResponse>(`/v1/races/${raceId}`)
    return response.data
  },

  getRaceEntries: async (raceId: number): Promise<RaceEntry[]> => {
    const response = await apiClient.get<{ entries: RaceEntry[] }>(
      `/v1/races/${raceId}/entries`
    )
    return response.data.entries
  },
}
