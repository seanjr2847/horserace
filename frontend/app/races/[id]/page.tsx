/**
 * 경주 상세 페이지
 * /races/[id]
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { racesApi } from '@/lib/api/races'
import { predictionsApi } from '@/lib/api/predictions'
import EntryTable from '@/components/EntryTable'
import PredictionCard from '@/components/PredictionCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'
import type { Race } from '@/types/race'

export default function RaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const raceId = parseInt(params.id as string)

  const [race, setRace] = useState<Race | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadRaceDetail()
  }, [raceId])

  const loadRaceDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await racesApi.getRaceDetail(raceId)
      setRace(response.race)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePrediction = async (types: any[]) => {
    try {
      setGenerating(true)

      const response = await predictionsApi.generatePrediction(raceId, types)

      // 예측 생성 성공 - 데이터 새로고침
      await loadRaceDetail()
      alert('예측이 생성되었습니다!')
    } catch (err) {
      alert(err instanceof Error ? err.message : '예측 생성 중 오류가 발생했습니다')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner text="경주 정보를 불러오는 중..." />
      </div>
    )
  }

  if (error || !race) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorAlert message={error || '경주를 찾을 수 없습니다'} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 뒤로 가기 버튼 */}
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        ← 경주 목록으로 돌아가기
      </button>

      {/* 경주 정보 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {race.track?.name || '경마장'} {race.raceNumber}R
            </h1>
            <p className="text-gray-600">
              {new Date(race.raceDate).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                race.raceStatus === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : race.raceStatus === 'in_progress'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {race.raceStatus === 'completed'
                ? '완료'
                : race.raceStatus === 'in_progress'
                ? '진행중'
                : '예정'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">거리</p>
            <p className="text-lg font-semibold">{race.distance}m</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">주로</p>
            <p className="text-lg font-semibold">{race.surfaceType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">날씨</p>
            <p className="text-lg font-semibold">{race.weather || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">마장 상태</p>
            <p className="text-lg font-semibold">{race.trackCondition || '-'}</p>
          </div>
        </div>

        {race.prizeMoney && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">상금</p>
            <p className="text-2xl font-bold text-green-600">
              {Number(race.prizeMoney).toLocaleString()}원
            </p>
          </div>
        )}
      </div>

      {/* 예측 생성 버튼 */}
      {race.raceStatus === 'scheduled' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">AI 예측 생성</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleGeneratePrediction(['win'])}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              단승 예측
            </button>
            <button
              onClick={() => handleGeneratePrediction(['place'])}
              disabled={generating}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              복승 예측
            </button>
            <button
              onClick={() => handleGeneratePrediction(['quinella'])}
              disabled={generating}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              연승 예측
            </button>
            <button
              onClick={() => handleGeneratePrediction(['exacta'])}
              disabled={generating}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              복연승 예측
            </button>
            <button
              onClick={() => handleGeneratePrediction(['trifecta'])}
              disabled={generating}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              삼복승 예측
            </button>
            <button
              onClick={() =>
                handleGeneratePrediction(['win', 'place', 'quinella', 'exacta', 'trifecta'])
              }
              disabled={generating}
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전체 예측
            </button>
          </div>
          {generating && (
            <p className="mt-4 text-sm text-gray-600">예측을 생성하는 중입니다... (30초~1분 소요)</p>
          )}
        </div>
      )}

      {/* 예측 결과 */}
      {(race as any).predictions && (race as any).predictions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">AI 예측 결과</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(race as any).predictions.map((prediction: any) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        </div>
      )}

      {/* 출전 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">출전 정보</h2>
        <EntryTable entries={race.entries || []} />
      </div>
    </div>
  )
}
