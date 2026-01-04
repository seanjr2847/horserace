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
  const [entries, setEntries] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
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
      setEntries(response.entries || [])
      setPredictions(response.predictions || [])
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
    } catch (err: any) {
      // API 에러 상세 표시
      const errorMsg = err?.response?.data?.message || err?.message || '예측 생성 중 오류가 발생했습니다'
      const errorDetails = err?.response?.data?.errors?.join('\n') || ''
      alert(`${errorMsg}${errorDetails ? '\n\n상세: ' + errorDetails : ''}`)
      console.error('Prediction Error:', err?.response?.data || err)
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
          <p className="text-sm text-gray-600 mb-4">
            Gemini AI가 배당률과 기댓값을 분석하여 예측합니다
          </p>

          {/* 기본 베팅 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">기본 베팅</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleGeneratePrediction(['win'])}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🥇 단승 (1위)
              </button>
              <button
                onClick={() => handleGeneratePrediction(['place'])}
                disabled={generating}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎯 연승 (1~2위)
              </button>
            </div>
          </div>

          {/* 2마리 조합 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">2마리 조합</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleGeneratePrediction(['quinella'])}
                disabled={generating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔀 복승 (1~2위, 순서무관)
              </button>
              <button
                onClick={() => handleGeneratePrediction(['exacta'])}
                disabled={generating}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📊 쌍승 (1~2위, 순서)
              </button>
              <button
                onClick={() => handleGeneratePrediction(['quinella_place'])}
                disabled={generating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎲 복연승 (1~3위 중 2마리)
              </button>
            </div>
          </div>

          {/* 3마리 조합 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">3마리 조합</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleGeneratePrediction(['trio'])}
                disabled={generating}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 삼복승 (1~3위, 순서무관)
              </button>
              <button
                onClick={() => handleGeneratePrediction(['trifecta'])}
                disabled={generating}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🏆 삼쌍승 (1~3위, 순서)
              </button>
            </div>
          </div>

          {/* 전체 예측 */}
          <div className="pt-4 border-t">
            <button
              onClick={() =>
                handleGeneratePrediction(['win', 'place', 'quinella', 'exacta', 'quinella_place', 'trio', 'trifecta'])
              }
              disabled={generating}
              className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-md hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              🎰 전체 예측 (7종류 모두)
            </button>
          </div>

          {generating && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                AI가 예측을 생성하는 중입니다... (타입당 30초~1분 소요)
              </p>
            </div>
          )}
        </div>
      )}

      {/* 예측 결과 */}
      {predictions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">AI 예측 결과</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((prediction: any) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        </div>
      )}

      {/* 출전 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">출전 정보 ({entries.length}두)</h2>
        <EntryTable entries={entries} />
      </div>
    </div>
  )
}
