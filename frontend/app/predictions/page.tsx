/**
 * 예측 대시보드 페이지
 * /predictions
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { racesApi } from '@/lib/api/races'
import PredictionCard from '@/components/PredictionCard'
import RaceCard from '@/components/RaceCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'
import type { Race } from '@/types/race'

// 경주장 정보
const TRACKS = [
  { id: 1, name: '서울', color: 'blue' },
  { id: 2, name: '부산경남', color: 'green' },
  { id: 3, name: '제주', color: 'orange' },
]

export default function PredictionsPage() {
  const router = useRouter()

  const [todayRaces, setTodayRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<number | null>(null) // null = 전체

  useEffect(() => {
    loadTodayRaces()
  }, [])

  const loadTodayRaces = async () => {
    try {
      setLoading(true)
      setError(null)

      const races = await racesApi.getTodayRaces()
      setTodayRaces(races)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 경주장별로 그룹화
  const racesByTrack = TRACKS.map((track) => ({
    ...track,
    races: todayRaces.filter((r) => r.trackId === track.id),
  }))

  // 현재 탭에 따른 경주 필터링
  const displayedTracks = activeTab
    ? racesByTrack.filter((t) => t.id === activeTab)
    : racesByTrack

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner text="오늘의 경주를 불러오는 중..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorAlert message={error} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 예측 대시보드</h1>
        <p className="text-gray-600">
          Gemini AI가 분석한 오늘의 경주 예측을 확인하세요
        </p>
      </div>

      {/* 경주장 탭 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체 ({todayRaces.length})
          </button>
          {racesByTrack.map((track) => (
            <button
              key={track.id}
              onClick={() => setActiveTab(track.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === track.id
                  ? track.color === 'blue'
                    ? 'bg-blue-600 text-white'
                    : track.color === 'green'
                    ? 'bg-green-600 text-white'
                    : 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {track.name} ({track.races.length})
            </button>
          ))}
        </div>
      </div>

      {todayRaces.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">오늘 예정된 경주가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-8">
          {displayedTracks.map((track) => {
            if (track.races.length === 0) return null

            const colorClass =
              track.color === 'blue'
                ? 'bg-blue-500'
                : track.color === 'green'
                ? 'bg-green-500'
                : 'bg-orange-500'

            const borderColorClass =
              track.color === 'blue'
                ? 'border-blue-200'
                : track.color === 'green'
                ? 'border-green-200'
                : 'border-orange-200'

            const bgColorClass =
              track.color === 'blue'
                ? 'bg-blue-50'
                : track.color === 'green'
                ? 'bg-green-50'
                : 'bg-orange-50'

            return (
              <div key={track.id}>
                {/* 경주장 헤더 */}
                <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${bgColorClass} border ${borderColorClass}`}>
                  <span className={`w-2 h-8 rounded ${colorClass}`}></span>
                  <h2 className="text-xl font-bold text-gray-900">
                    {track.name}
                  </h2>
                  <span className="text-gray-600">
                    {track.races.length}개 경주
                  </span>
                </div>

                {/* 경주 카드 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {track.races
                    .sort((a, b) => a.raceNumber - b.raceNumber)
                    .map((race) => (
                      <div
                        key={race.id}
                        onClick={() => router.push(`/races/${race.id}`)}
                        className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border-l-4"
                        style={{
                          borderLeftColor:
                            track.color === 'blue'
                              ? '#3b82f6'
                              : track.color === 'green'
                              ? '#22c55e'
                              : '#f97316',
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold">
                            {race.raceNumber}R
                          </h3>
                          {race.hasPredictions ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              예측완료
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                              대기중
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>거리</span>
                            <span className="font-medium">{race.distance}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span>출전</span>
                            <span className="font-medium">{race.entryCount}두</span>
                          </div>
                          <div className="flex justify-between">
                            <span>주로</span>
                            <span className="font-medium">{race.surfaceType || '모래'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 안내 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 경주 카드를 클릭하면 상세 정보와 AI 예측을 확인할 수 있습니다
        </p>
      </div>
    </div>
  )
}
