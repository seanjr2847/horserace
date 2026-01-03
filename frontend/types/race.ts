export interface RaceTrack {
  id: number
  name: string
  code: number
  location?: string
  createdAt?: string
  updatedAt?: string
}

export interface Race {
  id: number
  raceDate: string
  raceNumber: number
  trackId?: number
  track?: RaceTrack
  distance: number
  surfaceType: string
  weather?: string
  trackCondition?: string
  raceClass?: string
  prizeMoney?: number | string
  raceStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  entries?: RaceEntry[]
  entryCount?: number
  hasPredictions?: boolean
  predictionTypes?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface RaceEntry {
  id: number
  race_id: number
  horse_id: number
  jockey_id: number
  trainer_id: number
  gate_number: number
  horse_weight_kg?: number
  jockey_weight_kg?: number
  odds?: number
  finish_position?: number
  finish_time?: number
  horse?: Horse
  jockey?: Jockey
  trainer?: Trainer
  created_at: string
  updated_at: string
}

export interface Horse {
  id: number
  registration_number: string
  name_ko: string
  name_en?: string
  birth_date: string
  gender: 'stallion' | 'mare' | 'gelding'
  rating?: number
  total_races: number
  total_wins: number
  total_places: number
  total_shows: number
  total_earnings: number
  created_at: string
  updated_at: string
}

export interface Jockey {
  id: number
  license_number: string
  name_ko: string
  name_en?: string
  debut_date?: string
  total_races: number
  total_wins: number
  win_rate: number
  place_rate: number
  created_at: string
  updated_at: string
}

export interface Trainer {
  id: number
  license_number: string
  name_ko: string
  name_en?: string
  stable_name?: string
  total_races: number
  total_wins: number
  win_rate: number
  created_at: string
  updated_at: string
}
