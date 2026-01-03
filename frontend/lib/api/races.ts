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
    const response = await apiClient.get<RaceListResponse>('/races/today')
    return response.data.races
  },

  getRacesByDate: async (date: string): Promise<Race[]> => {
    const response = await apiClient.get<RaceListResponse>(`/races`, {
      params: { race_date: date },
    })
    return response.data.races
  },

  getRaces: async (params: {
    page?: number
    limit?: number
    date?: string
    trackId?: number
    status?: string
  }): Promise<RaceListResponse> => {
    const response = await apiClient.get<RaceListResponse>('/races', { params })
    return response.data
  },

  getRaceDetail: async (raceId: number): Promise<RaceDetailResponse> => {
    const response = await apiClient.get<RaceDetailResponse>(`/races/${raceId}`)
    return response.data
  },

  getRaceEntries: async (raceId: number): Promise<RaceEntry[]> => {
    const response = await apiClient.get<{ entries: RaceEntry[] }>(
      `/races/${raceId}/entries`
    )
    return response.data.entries
  },
}
