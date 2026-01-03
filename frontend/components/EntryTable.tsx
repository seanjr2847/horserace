import type { RaceEntry } from '@/types'

interface EntryTableProps {
  entries: RaceEntry[]
}

export default function EntryTable({ entries }: EntryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              게이트
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              말
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              기수
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              조교사
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              마체중
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              배당률
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              순위
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-semibold">
                  {entry.gate_number}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {entry.horse?.name_ko || '-'}
                </div>
                {entry.horse && (
                  <div className="text-xs text-gray-500">
                    {entry.horse.total_wins}승 / {entry.horse.total_races}전
                  </div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {entry.jockey?.name_ko || '-'}
                </div>
                {entry.jockey && (
                  <div className="text-xs text-gray-500">
                    승률 {(entry.jockey.win_rate * 100).toFixed(1)}%
                  </div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {entry.trainer?.name_ko || '-'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {entry.horse_weight_kg ? `${entry.horse_weight_kg}kg` : '-'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {entry.odds ? (
                  <span className="text-sm font-semibold text-primary-600">
                    {entry.odds.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {entry.finish_position ? (
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.finish_position === 1
                        ? 'bg-yellow-100 text-yellow-800'
                        : entry.finish_position <= 3
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {entry.finish_position}위
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
