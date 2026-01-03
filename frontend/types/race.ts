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
  raceId?: number
  horseId?: number
  jockeyId?: number
  trainerId?: number
  gateNumber: number
  horseWeightKg?: number | string
  jockeyWeightKg?: number | string
  odds?: number | string
  finishPosition?: number
  finishTime?: number | string
  horse?: Horse
  jockey?: Jockey
  trainer?: Trainer
  createdAt?: string
  updatedAt?: string
}

export interface Horse {
  id: number
  registrationNumber: string
  nameKo: string
  nameEn?: string
  birthDate?: string
  gender?: 'stallion' | 'mare' | 'gelding'
  rating?: number
  totalRaces: number
  totalWins: number
  totalPlaces?: number
  totalShows?: number
  totalEarnings?: number | string
  recentRaces?: any[]
  createdAt?: string
  updatedAt?: string
}

export interface Jockey {
  id: number
  licenseNumber: string
  nameKo: string
  nameEn?: string
  debutDate?: string
  totalRaces: number
  totalWins: number
  winRate: number
  placeRate?: number
  createdAt?: string
  updatedAt?: string
}

export interface Trainer {
  id: number
  licenseNumber: string
  nameKo: string
  nameEn?: string
  stableName?: string
  totalRaces: number
  totalWins: number
  winRate: number
  createdAt?: string
  updatedAt?: string
}
