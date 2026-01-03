import type { Prediction, WinPrediction } from '@/types'

interface PredictionCardProps {
  prediction: Prediction
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const getPredictionTypeText = (type: string) => {
    const typeMap = {
      win: '단승',
      place: '연승',
      quinella: '복승',
      exacta: '복연승',
      trifecta: '삼복승',
    }
    return typeMap[type as keyof typeof typeMap] || type
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const renderWinPredictions = () => {
    const winPredictions = prediction.prediction_data.win || []
    return (
      <div className="space-y-2">
        {winPredictions.slice(0, 5).map((pred, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-semibold text-sm">
                {idx + 1}
              </span>
              <div>
                <div className="font-medium text-gray-900">{pred.horse_name}</div>
                <div className="text-xs text-gray-500">{pred.reasoning}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-primary-600">
                {(pred.probability * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderQuinellaPredictions = () => {
    const quinellaPredictions = prediction.prediction_data.quinella || []
    return (
      <div className="space-y-2">
        {quinellaPredictions.slice(0, 5).map((pred, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-semibold text-sm">
                {idx + 1}
              </span>
              <div>
                <div className="font-medium text-gray-900">
                  {pred.horse_names.join(' - ')}
                </div>
                <div className="text-xs text-gray-500">{pred.reasoning}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-primary-600">
                {(pred.probability * 100).toFixed(1)}%
              </div>
              {pred.expected_return && (
                <div className="text-xs text-gray-500">
                  기댓값: {pred.expected_return.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {getPredictionTypeText(prediction.prediction_type)} 예측
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            모델: {prediction.llm_model_version}
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(
            prediction.confidence_score
          )}`}
        >
          신뢰도: {(prediction.confidence_score * 100).toFixed(0)}%
        </div>
      </div>

      {prediction.prediction_type === 'win' && renderWinPredictions()}
      {(prediction.prediction_type === 'quinella' ||
        prediction.prediction_type === 'exacta' ||
        prediction.prediction_type === 'trifecta') &&
        renderQuinellaPredictions()}

      {prediction.llm_reasoning && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">AI 분석 근거</h4>
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {prediction.llm_reasoning}
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        생성 시각: {new Date(prediction.created_at).toLocaleString('ko-KR')}
      </div>
    </div>
  )
}
