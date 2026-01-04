const { PrismaClient } = require('@prisma/client')
const axios = require('axios')

const prisma = new PrismaClient()

const KRA_API_KEY = process.env.KRA_API_KEY || 'r2xS80z3sxCVdMfOPLSDlzw2CvwSTacQDa1ZFLcnLoqN/wNCOsKz9V3oxZY4QIxaHNEbNtNy3dyitv1NggoRVg=='
const BASE_URL = 'https://apis.data.go.kr/B551015'

// 날짜 포맷
function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 경주장 초기화
async function syncTracks() {
  const tracks = [
    { code: 1, name: '서울', location: '서울특별시' },
    { code: 2, name: '부산경남', location: '부산광역시' },
    { code: 3, name: '제주', location: '제주특별자치도' },
  ]

  for (const track of tracks) {
    await prisma.raceTrack.upsert({
      where: { code: track.code },
      update: {},
      create: track,
    })
  }
  console.log('✅ 경주장 정보 동기화 완료')
}

// 오늘 경주 동기화
async function syncToday() {
  const today = new Date()
  const dateStr = formatDate(today)
  console.log(`📅 ${dateStr} 경주 데이터 동기화 시작...`)

  const meetCodes = ['1', '2', '3']
  const TRACK_MAP = { '1': 1, '2': 2, '3': 3 }
  let totalRaces = 0
  let totalEntries = 0

  for (const meet of meetCodes) {
    const trackName = meet === '1' ? '서울' : meet === '2' ? '부산경남' : '제주'

    try {
      // 경주+출전마 조회 (하나의 API에서 둘 다 제공)
      const res = await axios.get(`${BASE_URL}/API186_1/SeoulRace_1`, {
        params: {
          ServiceKey: KRA_API_KEY,
          pageNo: 1,
          numOfRows: 500,
          _type: 'json',
          rc_date_fr: dateStr,
          rc_date_to: dateStr,
          meet: meet
        }
      })

      const items = res.data?.response?.body?.items?.item || []
      const entryList = Array.isArray(items) ? items : [items]

      if (entryList.length === 0 || !entryList[0]?.rcNo) {
        console.log(`   ${trackName}: 경주 없음`)
        continue
      }

      // 경주별로 출전마 그룹화
      const entriesByRace = {}
      for (const entry of entryList) {
        const rcNo = entry.rcNo
        if (!entriesByRace[rcNo]) entriesByRace[rcNo] = []
        entriesByRace[rcNo].push(entry)
      }

      const raceCount = Object.keys(entriesByRace).length
      console.log(`   ${trackName}: ${raceCount}개 경주, ${entryList.length}마`)

      // 경주별 처리
      for (const [rcNoStr, entries] of Object.entries(entriesByRace)) {
        const rcNo = parseInt(rcNoStr)
        const firstEntry = entries[0]

        // UTC로 날짜 생성 (시간대 문제 방지)
        const raceDate = new Date(Date.UTC(
          parseInt(String(firstEntry.rcDate).substring(0, 4)),
          parseInt(String(firstEntry.rcDate).substring(4, 6)) - 1,
          parseInt(String(firstEntry.rcDate).substring(6, 8)),
          0, 0, 0, 0
        ))

        // 경주 저장
        const race = await prisma.race.upsert({
          where: {
            raceDate_raceNumber_trackId: {
              raceDate,
              raceNumber: rcNo,
              trackId: TRACK_MAP[meet],
            },
          },
          update: {
            distance: firstEntry.rcDist || 1200,
            surfaceType: '모래',
            weather: firstEntry.weath !== '-' ? firstEntry.weath : null,
            raceStatus: 'scheduled',
          },
          create: {
            raceDate,
            raceNumber: rcNo,
            trackId: TRACK_MAP[meet],
            distance: firstEntry.rcDist || 1200,
            surfaceType: '모래',
            weather: firstEntry.weath !== '-' ? firstEntry.weath : null,
            raceStatus: 'scheduled',
          },
        })
        totalRaces++

        // 출전마 저장
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i]

          // 말 저장
          const horse = await prisma.horse.upsert({
            where: { registrationNumber: String(entry.hrno || `${meet}_${rcNo}_${i}`) },
            update: { nameKo: entry.hrName },
            create: {
              registrationNumber: String(entry.hrno || `${meet}_${rcNo}_${i}`),
              nameKo: entry.hrName || `말${i+1}`,
              gender: 'stallion',
              birthDate: new Date(new Date().getFullYear() - 4, 0, 1),
              totalRaces: 0,
              totalWins: 0,
              totalPlaces: 0,
              totalShows: 0,
              totalEarnings: '0',
            },
          })

          // 기수 저장
          const jockey = await prisma.jockey.upsert({
            where: { licenseNumber: entry.jkNo || `jk_${meet}_${rcNo}_${i}` },
            update: { nameKo: entry.jkName },
            create: {
              licenseNumber: entry.jkNo || `jk_${meet}_${rcNo}_${i}`,
              nameKo: entry.jkName || `기수${i+1}`,
              totalRaces: 0,
              totalWins: 0,
              winRate: '0',
              placeRate: '0',
            },
          })

          // 조교사 저장
          const trainer = await prisma.trainer.upsert({
            where: { licenseNumber: entry.prtr || `tr_${meet}_${rcNo}_${i}` },
            update: { nameKo: entry.prtrName },
            create: {
              licenseNumber: entry.prtr || `tr_${meet}_${rcNo}_${i}`,
              nameKo: entry.prtrName || `조교사${i+1}`,
              totalRaces: 0,
              totalWins: 0,
              winRate: '0',
            },
          })

          // 게이트 번호: rcChul (출전 순번) 사용
          const gateNumber = entry.rcChul || (i + 1)

          // 출전 정보 저장
          await prisma.raceEntry.upsert({
            where: {
              raceId_horseId: {
                raceId: race.id,
                horseId: horse.id,
              },
            },
            update: {
              jockeyId: jockey.id,
              trainerId: trainer.id,
              gateNumber,
              horseWeightKg: entry.wgHr ? String(entry.wgHr) : null,
            },
            create: {
              raceId: race.id,
              horseId: horse.id,
              jockeyId: jockey.id,
              trainerId: trainer.id,
              gateNumber,
              horseWeightKg: entry.wgHr ? String(entry.wgHr) : null,
            },
          })
          totalEntries++
        }
      }
    } catch (err) {
      console.error(`   ${trackName} 동기화 실패:`, err.message)
    }
  }

  console.log(`\n✅ 동기화 완료: 경주 ${totalRaces}개, 출전마 ${totalEntries}마`)
}

async function main() {
  await syncTracks()
  await syncToday()
  await prisma.$disconnect()
}

main().catch(console.error)
