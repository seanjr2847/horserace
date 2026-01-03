import { create } from 'zustand'
import type { Race, RaceEntry } from '@/types'
import { racesApi } from '@/lib/api'

interface RaceState {
  races: Race[]
  selectedRace: Race | null
  raceEntries: RaceEntry[]
  loading: boolean
  error: string | null

  fetchTodayRaces: () => Promise<void>
  fetchRacesByDate: (date: string) => Promise<void>
  fetchRaceDetail: (raceId: number) => Promise<void>
  fetchRaceEntries: (raceId: number) => Promise<void>
  setSelectedRace: (race: Race | null) => void
  clearError: () => void
}

export const useRaceStore = create<RaceState>((set) => ({
  races: [],
  selectedRace: null,
  raceEntries: [],
  loading: false,
  error: null,

  fetchTodayRaces: async () => {
    set({ loading: true, error: null })
    try {
      const races = await racesApi.getTodayRaces()
      set({ races, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '경주 데이터를 불러올 수 없습니다',
        loading: false,
      })
    }
  },

  fetchRacesByDate: async (date: string) => {
    set({ loading: true, error: null })
    try {
      const races = await racesApi.getRacesByDate(date)
      set({ races, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '경주 데이터를 불러올 수 없습니다',
        loading: false,
      })
    }
  },

  fetchRaceDetail: async (raceId: number) => {
    set({ loading: true, error: null })
    try {
      const { race, entries } = await racesApi.getRaceDetail(raceId)
      set({ selectedRace: race, raceEntries: entries, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '경주 상세 정보를 불러올 수 없습니다',
        loading: false,
      })
    }
  },

  fetchRaceEntries: async (raceId: number) => {
    set({ loading: true, error: null })
    try {
      const entries = await racesApi.getRaceEntries(raceId)
      set({ raceEntries: entries, loading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '출전마 정보를 불러올 수 없습니다',
        loading: false,
      })
    }
  },

  setSelectedRace: (race: Race | null) => {
    set({ selectedRace: race })
  },

  clearError: () => {
    set({ error: null })
  },
}))
