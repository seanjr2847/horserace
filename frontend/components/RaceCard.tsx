import type { Race } from '@/types'

interface RaceCardProps {
  race: Race
  onClick?: () => void
}

export default function RaceCard({ race, onClick }: RaceCardProps) {
  const getStatusBadge = (status: string) => {
    const statusStyles = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }

    const statusText = {
      scheduled: '예정',
      in_progress: '진행중',
      completed: '완료',
      cancelled: '취소',
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusStyles[status as keyof typeof statusStyles] || statusStyles.scheduled
        }`}
      >
        {statusText[status as keyof typeof statusText] || status}
      </span>
    )
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {race.race_number}R
          </h3>
          <p className="text-sm text-gray-500">
            {new Date(race.race_date).toLocaleDateString('ko-KR')}
          </p>
        </div>
        {getStatusBadge(race.race_status)}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">거리</span>
          <span className="font-medium">{race.distance}m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">마장</span>
          <span className="font-medium">{race.surface_type}</span>
        </div>
        {race.weather && (
          <div className="flex justify-between">
            <span className="text-gray-600">날씨</span>
            <span className="font-medium">{race.weather}</span>
          </div>
        )}
        {race.track_condition && (
          <div className="flex justify-between">
            <span className="text-gray-600">마장 상태</span>
            <span className="font-medium">{race.track_condition}</span>
          </div>
        )}
        {race.prize_money && (
          <div className="flex justify-between">
            <span className="text-gray-600">상금</span>
            <span className="font-medium text-primary-600">
              {race.prize_money.toLocaleString()}원
            </span>
          </div>
        )}
      </div>

      {race.entries && race.entries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            출전마: {race.entries.length}두
          </p>
        </div>
      )}
    </div>
  )
}
