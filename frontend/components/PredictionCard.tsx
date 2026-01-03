/**
 * 예측 결과 카드 컴포넌트
 * 모든 7개 베팅 타입 지원 + 기댓값/베팅 추천 표시
 */

interface PredictionCardProps {
  prediction: {
    id: number
    predictionType: string
    predictionData: any
    confidenceScore: number | string
    llmModelVersion: string
    llmReasoning?: string
    createdAt: string | Date
  }
}

// 베팅 타입 한글 매핑
const PREDICTION_TYPE_INFO: Record<string, { name: string; description: string; emoji: string }> = {
  win: { name: '단승', description: '1위 예측', emoji: '🥇' },
  place: { name: '연승', description: '1~2위 중 1마리', emoji: '🎯' },
  quinella: { name: '복승', description: '1~2위 2마리 (순서무관)', emoji: '🔀' },
  exacta: { name: '쌍승', description: '1~2위 2마리 (순서)', emoji: '📊' },
  quinella_place: { name: '복연승', description: '1~3위 중 2마리', emoji: '🎲' },
  trio: { name: '삼복승', description: '1~3위 3마리 (순서무관)', emoji: '🔄' },
  trifecta: { name: '삼쌍승', description: '1~3위 3마리 (순서)', emoji: '🏆' },
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const typeInfo = PREDICTION_TYPE_INFO[prediction.predictionType] || {
    name: prediction.predictionType,
    description: '',
    emoji: '📈',
  }

  const confidenceScore =
    typeof prediction.confidenceScore === 'string'
      ? parseFloat(prediction.confidenceScore)
      : prediction.confidenceScore

  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getExpectedValueColor = (ev: number) => {
    if (ev > 0.3) return 'text-green-600 font-bold'
    if (ev > 0) return 'text-green-500'
    if (ev > -0.2) return 'text-yellow-600'
    return 'text-red-500'
  }

  // 예측 데이터 파싱
  const data = prediction.predictionData || {}
  const predictions = data.predictions || []
  const raceAnalysis = data.race_analysis || ''
  const bettingAdvice = data.betting_advice || {}
  const recommendations = data.recommendations || []

  // 순위 예측 렌더링 (단승)
  const renderRankingPredictions = () => {
    if (!predictions.length) return null

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">🏇 순위 예측</h4>
        {predictions.slice(0, 5).map((pred: any, idx: number) => {
          const probability = pred.win_probability || pred.probability || 0
          const expectedValue = pred.expected_value
          const odds = pred.odds

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    idx === 0
                      ? 'bg-yellow-400 text-yellow-900'
                      : idx === 1
                      ? 'bg-gray-300 text-gray-800'
                      : idx === 2
                      ? 'bg-orange-400 text-orange-900'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {pred.predicted_rank || idx + 1}
                </span>
                <div>
                  <div className="font-medium text-gray-900">
                    {pred.gate_number && `${pred.gate_number}번 `}
                    {pred.horse_name || `마번 ${pred.horse_number}`}
                  </div>
                  {pred.reasoning && (
                    <div className="text-xs text-gray-500 line-clamp-1">{pred.reasoning}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-blue-600">
                  {(probability * 100).toFixed(1)}%
                </div>
                {odds && (
                  <div className="text-xs text-gray-500">배당 {odds.toFixed(1)}배</div>
                )}
                {expectedValue !== undefined && (
                  <div className={`text-xs ${getExpectedValueColor(expectedValue)}`}>
                    기댓값 {expectedValue > 0 ? '+' : ''}{(expectedValue * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // 조합 예측 렌더링 (복승, 쌍승 등)
  const renderCombinationPredictions = () => {
    if (!predictions.length) return null

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">🎯 추천 조합</h4>
        {predictions.slice(0, 5).map((pred: any, idx: number) => {
          const horses = pred.horses || pred.horse_names || []
          const horseNames = Array.isArray(horses)
            ? horses.map((h: any) => (typeof h === 'string' ? h : h.name || `${h.gate}번`)).join(' → ')
            : ''
          const probability = pred.probability || 0
          const expectedValue = pred.expected_value
          const odds = pred.estimated_odds || pred.odds

          return (
            <div
              key={idx}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                    {idx + 1}
                  </span>
                  <div className="font-medium text-gray-900">{horseNames}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-600">
                    {(probability * 100).toFixed(1)}%
                  </div>
                  {odds && (
                    <div className="text-xs text-gray-500">예상배당 {odds.toFixed(1)}배</div>
                  )}
                </div>
              </div>
              {expectedValue !== undefined && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">기댓값</span>
                  <span className={`text-sm ${getExpectedValueColor(expectedValue)}`}>
                    {expectedValue > 0 ? '+' : ''}{(expectedValue * 100).toFixed(1)}%
                    {expectedValue > 0 && ' ✨'}
                  </span>
                </div>
              )}
              {pred.reasoning && (
                <p className="text-xs text-gray-500 mt-2">{pred.reasoning}</p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // 베팅 추천 렌더링
  const renderBettingRecommendations = () => {
    if (!recommendations.length && !bettingAdvice.primary_bet) return null

    return (
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-bold text-blue-800 mb-2">💰 베팅 추천</h4>

        {bettingAdvice.primary_bet && (
          <div className="mb-3">
            <div className="text-sm font-medium text-gray-800">
              메인 베팅: {bettingAdvice.primary_bet}
            </div>
            {bettingAdvice.backup_bets && bettingAdvice.backup_bets.length > 0 && (
              <div className="text-xs text-gray-600 mt-1">
                보조: {bettingAdvice.backup_bets.join(', ')}
              </div>
            )}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{rec.bet || rec.description}</span>
                {rec.expected_value !== undefined && (
                  <span className={getExpectedValueColor(rec.expected_value)}>
                    EV: {rec.expected_value > 0 ? '+' : ''}{(rec.expected_value * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {bettingAdvice.risk_level && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <span className="text-xs text-gray-600">리스크: </span>
            <span
              className={`text-xs font-medium ${
                bettingAdvice.risk_level === '낮음'
                  ? 'text-green-600'
                  : bettingAdvice.risk_level === '중간'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {bettingAdvice.risk_level}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>{typeInfo.emoji}</span>
              {typeInfo.name} 예측
            </h3>
            <p className="text-xs text-gray-500 mt-1">{typeInfo.description}</p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getConfidenceColor(
              confidenceScore
            )}`}
          >
            신뢰도 {(confidenceScore * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4">
        {/* 순위 예측 (단승, 연승) */}
        {(prediction.predictionType === 'win' || prediction.predictionType === 'place') &&
          renderRankingPredictions()}

        {/* 조합 예측 (복승, 쌍승, 복연승, 삼복승, 삼쌍승) */}
        {['quinella', 'exacta', 'quinella_place', 'trio', 'trifecta'].includes(
          prediction.predictionType
        ) && renderCombinationPredictions()}

        {/* 베팅 추천 */}
        {renderBettingRecommendations()}

        {/* AI 분석 근거 */}
        {(raceAnalysis || prediction.llmReasoning) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">🤖 AI 분석</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-4">
              {raceAnalysis || prediction.llmReasoning}
            </p>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-4 py-2 bg-gray-50 border-t flex justify-between items-center text-xs text-gray-400">
        <span>모델: {prediction.llmModelVersion}</span>
        <span>
          {new Date(prediction.createdAt).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  )
}
