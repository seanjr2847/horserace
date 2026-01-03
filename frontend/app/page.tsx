import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          🐎 경마 예측 시스템
        </h1>

        <p className="text-center mb-8 text-lg">
          Gemini AI 기반 한국 경마 예측 플랫폼
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <Link
            href="/races"
            className="p-6 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            <h2 className="text-2xl font-semibold mb-2">
              경주 일정 →
            </h2>
            <p className="text-gray-600">
              오늘의 경주 일정과 출전마 정보를 확인하세요
            </p>
          </Link>

          <Link
            href="/predictions"
            className="p-6 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            <h2 className="text-2xl font-semibold mb-2">
              AI 예측 →
            </h2>
            <p className="text-gray-600">
              Gemini AI의 경주 예측과 분석을 확인하세요
            </p>
          </Link>

          <Link
            href="/analytics"
            className="p-6 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            <h2 className="text-2xl font-semibold mb-2">
              통계 분석 →
            </h2>
            <p className="text-gray-600">
              말, 기수, 조교사의 상세 통계를 확인하세요
            </p>
          </Link>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>⚠️ 본 서비스는 정보 제공 목적이며, 투자 권유가 아닙니다.</p>
          <p className="mt-2">책임있는 베팅을 권장합니다 (19세 이상)</p>
        </div>
      </div>
    </main>
  )
}
