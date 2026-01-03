"""
KRA (한국마사회) API 동기화 서비스
Korea Racing Authority API sync service for fetching race data from data.go.kr
"""
import httpx
import logging
from typing import Optional, Dict, List, Any
from datetime import date, datetime
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.config import settings

logger = logging.getLogger(__name__)


class KRAAPIClient:
    """한국마사회 공공데이터 API 클라이언트"""

    def __init__(self):
        self.base_url = settings.KRA_API_BASE_URL
        self.api_key = settings.KRA_API_KEY
        self.timeout = settings.KRA_API_TIMEOUT

    @retry(
        stop=stop_after_attempt(settings.KRA_API_MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def _make_request(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make HTTP request to KRA API with retry logic.

        Args:
            endpoint: API endpoint path
            params: Query parameters

        Returns:
            API response as dictionary
        """
        url = f"{self.base_url}/{endpoint}"

        # Add API key to params
        if params is None:
            params = {}
        params["serviceKey"] = self.api_key
        params["_type"] = "json"  # Request JSON response

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                logger.info(f"KRA API request successful: {endpoint}")
                return data

            except httpx.HTTPStatusError as e:
                logger.error(f"KRA API HTTP error: {e.response.status_code} - {e.response.text}")
                raise
            except httpx.RequestError as e:
                logger.error(f"KRA API request error: {str(e)}")
                raise
            except Exception as e:
                logger.error(f"KRA API unexpected error: {str(e)}")
                raise

    async def get_race_schedule(
        self,
        race_date: date,
        track_code: int = 1,  # 1=서울, 2=제주, 3=부산경남
        page_no: int = 1,
        num_of_rows: int = 10
    ) -> Dict[str, Any]:
        """
        Get race schedule for a specific date.
        특정 날짜의 경주 일정 조회

        Args:
            race_date: Race date
            track_code: Track code (1=서울, 2=제주, 3=부산경남)
            page_no: Page number
            num_of_rows: Number of rows per page

        Returns:
            Race schedule data
        """
        endpoint = "API187/raceSchedule"  # Example endpoint - verify actual endpoint
        params = {
            "rccrs_cd": track_code,
            "race_dt": race_date.strftime("%Y%m%d"),
            "pageNo": page_no,
            "numOfRows": num_of_rows
        }

        return await self._make_request(endpoint, params)

    async def get_race_results(
        self,
        race_date: date,
        track_code: int = 1,
        race_number: Optional[int] = None,
        page_no: int = 1,
        num_of_rows: int = 10
    ) -> Dict[str, Any]:
        """
        Get race results for a specific date.
        특정 날짜의 경주 결과 조회

        Args:
            race_date: Race date
            track_code: Track code
            race_number: Specific race number (optional)
            page_no: Page number
            num_of_rows: Number of rows per page

        Returns:
            Race results data
        """
        endpoint = "API156/raceRsutDtl"  # Race result detail endpoint
        params = {
            "rccrs_cd": track_code,
            "race_dt": race_date.strftime("%Y%m%d"),
            "pageNo": page_no,
            "numOfRows": num_of_rows
        }

        if race_number is not None:
            params["race_no"] = race_number

        return await self._make_request(endpoint, params)

    async def get_horse_info(
        self,
        horse_registration_number: str
    ) -> Dict[str, Any]:
        """
        Get detailed information about a specific horse.
        특정 말의 상세 정보 조회

        Args:
            horse_registration_number: Horse registration number

        Returns:
            Horse information
        """
        # TODO: Verify correct endpoint for horse info
        endpoint = "API/horseInfo"
        params = {
            "hrNo": horse_registration_number
        }

        return await self._make_request(endpoint, params)

    async def get_race_entries(
        self,
        race_date: date,
        track_code: int,
        race_number: int
    ) -> Dict[str, Any]:
        """
        Get race entry information (horses, jockeys, weights, odds).
        출전 정보 조회 (말, 기수, 중량, 배당률)

        Args:
            race_date: Race date
            track_code: Track code
            race_number: Race number

        Returns:
            Race entry data
        """
        # TODO: Verify correct endpoint for race entries
        endpoint = "API/raceEntries"
        params = {
            "rccrs_cd": track_code,
            "race_dt": race_date.strftime("%Y%m%d"),
            "race_no": race_number
        }

        return await self._make_request(endpoint, params)


class KRASyncService:
    """KRA 데이터 동기화 서비스"""

    def __init__(self):
        self.client = KRAAPIClient()

    async def sync_race_schedule(self, race_date: date) -> List[Dict[str, Any]]:
        """
        Sync race schedule for a specific date.
        특정 날짜의 경주 일정 동기화

        Args:
            race_date: Date to sync

        Returns:
            List of synchronized races
        """
        logger.info(f"Syncing race schedule for {race_date}")

        # TODO: Implement actual sync logic
        # 1. Fetch data from KRA API
        # 2. Parse and validate data
        # 3. Save to database
        # 4. Return synced races

        try:
            data = await self.client.get_race_schedule(race_date)
            # Process and save data
            logger.info(f"Successfully synced {len(data)} races")
            return data
        except Exception as e:
            logger.error(f"Failed to sync race schedule: {str(e)}")
            raise

    async def sync_race_results(self, race_date: date) -> List[Dict[str, Any]]:
        """
        Sync race results for a specific date.
        특정 날짜의 경주 결과 동기화

        Args:
            race_date: Date to sync

        Returns:
            List of synchronized results
        """
        logger.info(f"Syncing race results for {race_date}")

        try:
            data = await self.client.get_race_results(race_date)
            # Process and save data
            logger.info(f"Successfully synced race results")
            return data
        except Exception as e:
            logger.error(f"Failed to sync race results: {str(e)}")
            raise


# Singleton instance
kra_sync_service = KRASyncService()
