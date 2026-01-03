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

export default function PredictionsPage() {
  const router = useRouter()

  const [todayRaces, setTodayRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTrack, setSelectedTrack] = useState<string>('')

  useEffect(() => {
    loadTodayRaces()
  }, [selectedTrack])

  const loadTodayRaces = async () => {
    try {
      setLoading(true)
      setError(null)

      const races = await racesApi.getTodayRaces()

      // Filter by track if selected
      const filteredRaces = selectedTrack
        ? races.filter(r => r.track_id === parseInt(selectedTrack))
        : races

      setTodayRaces(filteredRaces)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // TODO: Fetch predictions separately for each race
  const racesWithPredictions: any[] = []
  const racesWithoutPredictions = todayRaces

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

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">경마장 선택</label>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="1">서울</option>
            <option value="2">부산경남</option>
            <option value="3">제주</option>
          </select>
          <div className="ml-auto">
            <p className="text-sm text-gray-600">
              오늘 총 <span className="font-bold text-blue-600">{todayRaces.length}</span>개 경주
              / 예측 완료{' '}
              <span className="font-bold text-green-600">{racesWithPredictions.length}</span>개
            </p>
          </div>
        </div>
      </div>

      {todayRaces.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">오늘 예정된 경주가 없습니다</p>
        </div>
      ) : (
        <>
          {/* 예측 완료된 경주 */}
          {racesWithPredictions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-green-500 rounded"></span>
                예측 완료된 경주
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {racesWithPredictions.map((race) => (
                  <div key={race.id} className="bg-white rounded-lg shadow-md p-6">
                    {/* 경주 정보 */}
                    <div
                      className="mb-4 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                      onClick={() => router.push(`/races/${race.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold mb-2">
                            {race.track.name} {race.raceNumber}R
                          </h3>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>거리: {race.distance}m</span>
                            <span>주로: {race.surfaceType}</span>
                            <span>출전: {race.entryCount}두</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          예측 완료
                        </span>
                      </div>
                    </div>

                    {/* 예측 카드들 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(race as any).predictions?.map((prediction: any) => (
                        <PredictionCard key={prediction.id} prediction={prediction} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 예측 대기 중인 경주 */}
          {racesWithoutPredictions.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-gray-400 rounded"></span>
                예측 대기 중인 경주
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {racesWithoutPredictions.map((race) => (
                  <RaceCard
                    key={race.id}
                    race={race}
                    onClick={() => router.push(`/races/${race.id}`)}
                  />
                ))}
              </div>
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 경주 상세 페이지로 이동하여 AI 예측을 생성할 수 있습니다
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
