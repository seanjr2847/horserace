import apiClient from './client'

export interface HorseStats {
  horse_id: number
  horse_name: string
  total_races: number
  total_wins: number
  win_rate: number
  avg_finish_position: number
  recent_form: number[]
}

export interface JockeyStats {
  jockey_id: number
  jockey_name: string
  total_races: number
  total_wins: number
  win_rate: number
  place_rate: number
  recent_form: number[]
}

export interface TrainerStats {
  trainer_id: number
  trainer_name: string
  stable_name: string
  total_races: number
  total_wins: number
  win_rate: number
}

export const analyticsApi = {
  getHorseStats: async (horseId: number): Promise<HorseStats> => {
    const response = await apiClient.get<HorseStats>(
      `/v1/analytics/horse/${horseId}/stats`
    )
    return response.data
  },

  getJockeyStats: async (jockeyId: number): Promise<JockeyStats> => {
    const response = await apiClient.get<JockeyStats>(
      `/v1/analytics/jockey/${jockeyId}/stats`
    )
    return response.data
  },

  getTrainerStats: async (trainerId: number): Promise<TrainerStats> => {
    const response = await apiClient.get<TrainerStats>(
      `/v1/analytics/trainer/${trainerId}/stats`
    )
    return response.data
  },
}
