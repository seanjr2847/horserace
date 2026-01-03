"""
Google Gemini API client for horse race predictions.
Gemini API를 사용한 경마 예측 클라이언트
"""
import google.generativeai as genai
import logging
import json
from typing import Dict, Any, List, Optional
from tenacity import retry, stop_after_attempt, wait_exponential
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class GeminiClient:
    """Google Gemini API 클라이언트"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gemini-2.0-flash-exp"
    ):
        """
        Initialize Gemini client.

        Args:
            api_key: Gemini API key (from env if not provided)
            model_name: Model to use (gemini-2.0-flash-exp, gemini-1.5-pro, etc.)
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY must be set in environment or provided")

        genai.configure(api_key=self.api_key)
        self.model_name = model_name
        self.model = genai.GenerativeModel(model_name)

        logger.info(f"Gemini client initialized with model: {model_name}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def generate_prediction(
        self,
        race_context: Dict[str, Any],
        prediction_type: str,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate prediction using Gemini.

        Args:
            race_context: Race data context (JSON format)
            prediction_type: Type of prediction (win, place, quinella, etc.)
            system_prompt: Optional custom system prompt

        Returns:
            Prediction result as dictionary
        """
        try:
            # Build prompt
            prompt = self._build_prompt(race_context, prediction_type, system_prompt)

            # Generate response
            logger.info(f"Generating {prediction_type} prediction with Gemini")
            response = await self.model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,  # Lower temperature for more deterministic predictions
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=2048,
                )
            )

            # Parse response
            prediction = self._parse_response(response.text)

            logger.info(f"Successfully generated {prediction_type} prediction")
            return prediction

        except Exception as e:
            logger.error(f"Failed to generate prediction: {str(e)}")
            raise

    def _build_prompt(
        self,
        race_context: Dict[str, Any],
        prediction_type: str,
        custom_system_prompt: Optional[str] = None
    ) -> str:
        """Build prompt for Gemini."""

        # Default system prompt
        system_prompt = custom_system_prompt or """
당신은 30년 경력의 경마 분석 전문가입니다.
경주 데이터를 분석하여 승률, 순위, 조합을 예측합니다.

분석 기준:
- 말의 최근 폼과 과거 성적
- 기수와 조교사의 실력과 조합
- 거리, 마장 상태, 날씨 적합성
- 게이트 위치와 경쟁 강도
- 배당률 흐름과 인기도

반드시 JSON 형식으로 출력하세요.
"""

        # Add race context
        context_str = json.dumps(race_context, ensure_ascii=False, indent=2)

        # Build full prompt based on prediction type
        if prediction_type == "win":
            task_prompt = f"""
다음 경주에서 각 말의 1위 확률을 분석하세요.

경주 데이터:
{context_str}

출력 형식:
{{
  "predictions": [
    {{"horse_id": 1, "win_probability": 0.35, "reasoning": "분석 근거"}},
    {{"horse_id": 2, "win_probability": 0.28, "reasoning": "분석 근거"}}
  ],
  "confidence": 0.75,
  "overall_analysis": "종합 분석"
}}
"""
        elif prediction_type == "place":
            task_prompt = f"""
다음 경주에서 각 말의 3위 이내 입상 확률을 분석하세요.

경주 데이터:
{context_str}

출력 형식:
{{
  "predictions": [
    {{"horse_id": 1, "place_probability": 0.65, "reasoning": "분석 근거"}}
  ],
  "confidence": 0.75,
  "overall_analysis": "종합 분석"
}}
"""
        elif prediction_type in ["quinella", "exacta", "trifecta"]:
            task_prompt = f"""
다음 경주에서 가능성 높은 조합 Top 5를 추천하세요.

경주 데이터:
{context_str}

예측 타입: {prediction_type}
출력 형식:
{{
  "combinations": [
    {{
      "horses": [1, 3],
      "probability": 0.28,
      "expected_return": 8.5,
      "reasoning": "분석 근거"
    }}
  ],
  "confidence": 0.70,
  "overall_analysis": "종합 분석"
}}
"""
        else:
            task_prompt = f"경주 데이터를 분석하세요:\n{context_str}"

        full_prompt = f"{system_prompt}\n\n{task_prompt}"
        return full_prompt

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse Gemini response to structured JSON.

        Args:
            response_text: Raw response from Gemini

        Returns:
            Parsed prediction dictionary
        """
        try:
            # Try to extract JSON from response
            # Sometimes LLM includes markdown code blocks
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
            else:
                json_str = response_text.strip()

            # Parse JSON
            prediction = json.loads(json_str)
            return prediction

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from response: {e}")
            logger.error(f"Response text: {response_text}")

            # Return fallback structure
            return {
                "error": "Failed to parse prediction",
                "raw_response": response_text,
                "confidence": 0.0
            }


# Singleton instance
gemini_client = GeminiClient()
