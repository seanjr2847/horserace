const axios = require('axios')

const KRA_API_KEY = 'r2xS80z3sxCVdMfOPLSDlzw2CvwSTacQDa1ZFLcnLoqN/wNCOsKz9V3oxZY4QIxaHNEbNtNy3dyitv1NggoRVg=='

async function check() {
  const res = await axios.get('https://apis.data.go.kr/B551015/API186_1/SeoulRace_1', {
    params: {
      ServiceKey: KRA_API_KEY,
      pageNo: 1,
      numOfRows: 5,
      _type: 'json',
      rc_date_fr: '20260104',
      rc_date_to: '20260104',
      meet: '1'
    }
  })

  const items = res.data?.response?.body?.items?.item || []
  const first = Array.isArray(items) ? items[0] : items

  console.log('API 응답 첫 번째 항목:')
  console.log('  rcDate:', first.rcDate)
  console.log('  rcNo:', first.rcNo)
  console.log('  hrName:', first.hrName)

  // 시스템 날짜 vs API 날짜
  console.log('\n시스템 new Date():', new Date().toISOString())
  console.log('formatDate 결과:', formatDate(new Date()))
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

check().catch(console.error)
