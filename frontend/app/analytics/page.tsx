/**
 * 통계 페이지
 * /analytics
 */

'use client'

import { useState } from 'react'
import { analyticsApi } from '@/lib/api/analytics'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'

type AnalyticsType = 'horse' | 'jockey' | 'trainer'

interface HorseAnalytics {
  horse: any
  statistics: any
  recentForm: any[]
  bestJockeyCombination: any
  totalRaceHistory: number
}

interface JockeyAnalytics {
  jockey: any
  statistics: any
  recentForm: any[]
  bestHorseCombination: any
  totalRaceHistory: number
}

interface TrainerAnalytics {
  trainer: any
  statistics: any
  recentForm: any[]
  bestHorseCombination: any
  bestJockeyCombination: any
  totalRaceHistory: number
}

export default function AnalyticsPage() {
  const [type, setType] = useState<AnalyticsType>('horse')
  const [searchId, setSearchId] = useState('')
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchId) {
      alert('ID를 입력해주세요')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setAnalytics(null)

      const id = parseInt(searchId)
      let response: any

      switch (type) {
        case 'horse':
          response = await analyticsApi.getHorseStats(id)
          break
        case 'jockey':
          response = await analyticsApi.getJockeyStats(id)
          break
        case 'trainer':
          response = await analyticsApi.getTrainerStats(id)
          break
      }

      if (response.success) {
        setAnalytics(response)
      } else {
        setError(response.message || '데이터를 불러올 수 없습니다')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const renderOverallStats = (stats: any) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">총 경주</p>
        <p className="text-2xl font-bold">{stats.totalRaces}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">승수</p>
        <p className="text-2xl font-bold text-green-600">{stats.totalWins}</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">승률</p>
        <p className="text-2xl font-bold text-blue-600">
          {(stats.winRate * 100).toFixed(1)}%
        </p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">연대율</p>
        <p className="text-2xl font-bold text-purple-600">
          {(stats.placeRate * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  )

  const renderDistanceStats = (stats: any[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              거리
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              경주수
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              승수
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              승률
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              평균착순
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stats.map((stat) => (
            <tr key={stat.distance}>
              <td className="px-6 py-4 whitespace-nowrap">{stat.distance}m</td>
              <td className="px-6 py-4 whitespace-nowrap">{stat.races}</td>
              <td className="px-6 py-4 whitespace-nowrap text-green-600">{stat.wins}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {(stat.winRate * 100).toFixed(1)}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {stat.avgPosition.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderRecentForm = (form: any[]) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              날짜
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              경마장
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              레이스
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              거리
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              착순
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              기록
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {form.map((race, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(race.date).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{race.track}</td>
              <td className="px-6 py-4 whitespace-nowrap">{race.raceNumber}R</td>
              <td className="px-6 py-4 whitespace-nowrap">{race.distance}m</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 rounded-full text-sm font-medium ${
                    race.finishPosition === 1
                      ? 'bg-yellow-100 text-yellow-800'
                      : race.finishPosition <= 3
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {race.finishPosition || '-'}위
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{race.finishTime || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">통계 분석</h1>
        <p className="text-gray-600">말, 기수, 조교사의 상세 통계를 확인하세요</p>
      </div>

      {/* 검색 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">검색</h2>
        <div className="flex gap-4">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as AnalyticsType)
              setAnalytics(null)
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="horse">말</option>
            <option value="jockey">기수</option>
            <option value="trainer">조교사</option>
          </select>

          <input
            type="number"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="ID 입력"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner message="통계를 불러오는 중..." />
        </div>
      )}

      {/* 에러 */}
      {error && <ErrorAlert message={error} onRetry={handleSearch} />}

      {/* 결과 */}
      {analytics && !loading && (
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">
              {type === 'horse'
                ? analytics.horse.nameKo
                : type === 'jockey'
                ? analytics.jockey.nameKo
                : analytics.trainer.nameKo}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {type === 'horse' && (
                <>
                  <div>
                    <p className="text-gray-600">등록번호</p>
                    <p className="font-medium">{analytics.horse.registrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">성별</p>
                    <p className="font-medium">{analytics.horse.gender}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">레이팅</p>
                    <p className="font-medium">{analytics.horse.rating}</p>
                  </div>
                </>
              )}
              {type === 'jockey' && (
                <>
                  <div>
                    <p className="text-gray-600">면허번호</p>
                    <p className="font-medium">{analytics.jockey.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">영문명</p>
                    <p className="font-medium">{analytics.jockey.nameEn}</p>
                  </div>
                </>
              )}
              {type === 'trainer' && (
                <>
                  <div>
                    <p className="text-gray-600">면허번호</p>
                    <p className="font-medium">{analytics.trainer.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">마방</p>
                    <p className="font-medium">{analytics.trainer.stableName}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 전체 통계 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">전체 통계</h3>
            {renderOverallStats(analytics.statistics.overall)}
          </div>

          {/* 거리별 통계 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">거리별 통계</h3>
            {renderDistanceStats(analytics.statistics.byDistance)}
          </div>

          {/* 최근 폼 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">최근 경주 기록</h3>
            {renderRecentForm(analytics.recentForm)}
          </div>

          {/* 최고 조합 */}
          {analytics.bestJockeyCombination && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">최고 기수 조합</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-lg font-semibold">
                  {analytics.bestJockeyCombination.name}
                </p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span>경주: {analytics.bestJockeyCombination.races}회</span>
                  <span>승수: {analytics.bestJockeyCombination.wins}승</span>
                  <span className="text-green-600 font-semibold">
                    승률: {(analytics.bestJockeyCombination.winRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {analytics.bestHorseCombination && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4">최고 말 조합</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-lg font-semibold">
                  {analytics.bestHorseCombination.name}
                </p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span>경주: {analytics.bestHorseCombination.races}회</span>
                  <span>승수: {analytics.bestHorseCombination.wins}승</span>
                  <span className="text-green-600 font-semibold">
                    승률: {(analytics.bestHorseCombination.winRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
