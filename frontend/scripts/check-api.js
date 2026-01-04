const axios = require('axios')

const KRA_API_KEY = 'r2xS80z3sxCVdMfOPLSDlzw2CvwSTacQDa1ZFLcnLoqN/wNCOsKz9V3oxZY4QIxaHNEbNtNy3dyitv1NggoRVg=='

async function checkAPI() {
  const dateStr = '20260104'
  const meets = [
    { code: '1', name: '서울' },
    { code: '2', name: '부산경남' },
    { code: '3', name: '제주' }
  ]

  let totalRaces = 0
  let totalEntries = 0

  for (const meet of meets) {
    try {
      const res = await axios.get('https://apis.data.go.kr/B551015/API186_1/SeoulRace_1', {
        params: {
          ServiceKey: KRA_API_KEY,
          pageNo: 1,
          numOfRows: 500,
          _type: 'json',
          rc_date_fr: dateStr,
          rc_date_to: dateStr,
          meet: meet.code
        }
      })

      const items = res.data?.response?.body?.items?.item || []
      const entryList = Array.isArray(items) ? items : [items]

      if (entryList.length === 0 || !entryList[0]?.rcNo) {
        console.log(meet.name + ': 경주 없음')
        continue
      }

      // 경주별로 그룹화
      const races = {}
      entryList.forEach(e => {
        if (!races[e.rcNo]) races[e.rcNo] = []
        races[e.rcNo].push(e)
      })

      const raceCount = Object.keys(races).length
      console.log(meet.name + ': ' + raceCount + '개 경주, ' + entryList.length + '마')
      totalRaces += raceCount
      totalEntries += entryList.length
    } catch (err) {
      console.log(meet.name + ' 에러:', err.message)
    }
  }

  console.log('\n총합: ' + totalRaces + '개 경주, ' + totalEntries + '마')
}

checkAPI().catch(console.error)
