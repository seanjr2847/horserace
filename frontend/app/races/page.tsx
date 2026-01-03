/**
 * 경주 목록 페이지
 * /races
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { racesApi } from '@/lib/api/races'
import RaceCard from '@/components/RaceCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorAlert from '@/components/ErrorAlert'
import type { Race } from '@/types/race'

function RacesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // 필터 상태
  const [filters, setFilters] = useState({
    date: searchParams.get('date') || '',
    trackId: searchParams.get('trackId') || '',
    status: searchParams.get('status') || '',
  })

  // 데이터 로드
  useEffect(() => {
    loadRaces()
  }, [searchParams])

  const loadRaces = async () => {
    try {
      setLoading(true)
      setError(null)

      const page = parseInt(searchParams.get('page') || '1')
      const params: any = { page, limit: 20 }

      if (filters.date) params.date = filters.date
      if (filters.trackId) params.trackId = parseInt(filters.trackId)
      if (filters.status) params.status = filters.status

      const response = await racesApi.getRaces(params)

      if (response.success) {
        setRaces(response.races)
        setPagination(response.pagination)
      } else {
        setError(response.message || '경주 목록을 불러올 수 없습니다')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 필터 적용
  const applyFilters = () => {
    const params = new URLSearchParams()
    if (filters.date) params.set('date', filters.date)
    if (filters.trackId) params.set('trackId', filters.trackId)
    if (filters.status) params.set('status', filters.status)
    params.set('page', '1')

    router.push(`/races?${params.toString()}`)
  }

  // 필터 초기화
  const resetFilters = () => {
    setFilters({ date: '', trackId: '', status: '' })
    router.push('/races')
  }

  // 페이지 변경
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/races?${params.toString()}`)
  }

  // 데이터 동기화 (전체)
  const handleFullSync = async () => {
    try {
      setSyncing(true)
      const res = await fetch('/api/races/today?sync=true')
      const data = await res.json()
      if (data.success) {
        alert(`동기화 완료! ${data.raceCount}개 경주 로드됨`)
        loadRaces() // 목록 새로고침
      } else {
        alert('동기화 실패: ' + (data.message || '알 수 없는 오류'))
      }
    } catch (err) {
      alert('동기화 중 오류 발생')
    } finally {
      setSyncing(false)
    }
  }

  // 배당률만 동기화
  const handleOddsSync = async () => {
    try {
      setSyncing(true)
      const res = await fetch('/api/races/today?syncOdds=true')
      const data = await res.json()
      if (data.success) {
        alert('배당률 새로고침 완료!')
        loadRaces() // 목록 새로고침
      } else {
        alert('배당률 동기화 실패: ' + (data.message || '알 수 없는 오류'))
      }
    } catch (err) {
      alert('배당률 동기화 중 오류 발생')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner text="경주 목록을 불러오는 중..." />
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
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">경주 목록</h1>
          <p className="text-gray-600">
            전체 {pagination.total.toLocaleString()}개의 경주
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOddsSync}
            disabled={syncing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {syncing ? (
              <>
                <span className="animate-spin">⏳</span>
                동기화 중...
              </>
            ) : (
              <>
                📊 배당률 새로고침
              </>
            )}
          </button>
          <button
            onClick={handleFullSync}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {syncing ? (
              <>
                <span className="animate-spin">⏳</span>
                동기화 중...
              </>
            ) : (
              <>
                🔄 전체 동기화
              </>
            )}
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">검색 필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 날짜 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              경주 날짜
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 경마장 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              경마장
            </label>
            <select
              value={filters.trackId}
              onChange={(e) => setFilters({ ...filters, trackId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="1">서울</option>
              <option value="2">부산경남</option>
              <option value="3">제주</option>
            </select>
          </div>

          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              경주 상태
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="scheduled">예정</option>
              <option value="in_progress">진행중</option>
              <option value="completed">완료</option>
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              검색
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {/* 경주 목록 */}
      {races.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {races.map((race) => (
              <RaceCard
                key={race.id}
                race={race}
                onClick={() => router.push(`/races/${race.id}`)}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => goToPage(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        pagination.page === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => goToPage(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function RacesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><LoadingSpinner text="로딩 중..." /></div>}>
      <RacesContent />
    </Suspense>
  )
}
