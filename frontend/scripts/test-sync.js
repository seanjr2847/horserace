const axios = require('axios');

const KRA_API_KEY = process.env.KRA_API_KEY;
const BASE_URL = 'https://apis.data.go.kr/B551015';

async function testBusan() {
  const now = new Date();
  const koreaOffset = 9 * 60 * 60 * 1000;
  const koreaTime = new Date(now.getTime() + koreaOffset);
  const year = koreaTime.getUTCFullYear();
  const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreaTime.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  console.log('오늘 날짜:', dateStr);
  console.log('');

  // 부산경남 테스트 (meet=2)
  console.log('=== 부산경남 (meet=2) API 테스트 ===');
  try {
    const response = await axios.get(`${BASE_URL}/API186_1/SeoulRace_1`, {
      params: {
        ServiceKey: KRA_API_KEY,
        pageNo: 1,
        numOfRows: 10,
        _type: 'json',
        rc_date_fr: dateStr,
        rc_date_to: dateStr,
        meet: '2'  // 부산경남
      }
    });

    const items = response.data?.response?.body?.items?.item || [];
    console.log('응답 개수:', items.length);

    if (items.length > 0) {
      // 첫 3개 항목의 meet 값 확인
      console.log('첫 3개 항목:');
      for (let i = 0; i < Math.min(3, items.length); i++) {
        console.log(`  ${i+1}. meet="${items[i].meet}", rcNo=${items[i].rcNo}`);
      }

      // meet 값 통계
      const meetValues = {};
      items.forEach(item => {
        const m = item.meet || 'undefined';
        meetValues[m] = (meetValues[m] || 0) + 1;
      });
      console.log('meet 값 분포:', meetValues);
    }
  } catch (err) {
    console.log('에러:', err.message);
  }

  // 다른 API 엔드포인트 테스트 (출전표)
  console.log('');
  console.log('=== 출전표 API (부산) 테스트 ===');
  try {
    const response = await axios.get(`${BASE_URL}/API26_2/entrySheet_2`, {
      params: {
        ServiceKey: KRA_API_KEY,
        pageNo: 1,
        numOfRows: 20,
        _type: 'json',
        rc_date: dateStr,
        meet: '2'  // 부산경남
      }
    });

    const items = response.data?.response?.body?.items?.item || [];
    console.log('출전표 응답 개수:', items.length);

    if (items.length > 0) {
      const meetValues = {};
      items.forEach(item => {
        const m = item.meet || 'undefined';
        meetValues[m] = (meetValues[m] || 0) + 1;
      });
      console.log('meet 값 분포:', meetValues);
      console.log('첫 항목:', JSON.stringify(items[0], null, 2).slice(0, 500));
    }
  } catch (err) {
    console.log('에러:', err.message);
  }
}

testBusan().catch(console.error);
