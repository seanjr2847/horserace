import { syncRacesByDate, syncRaceTracks } from '../lib/services/kra/sync'

async function syncToday() {
  console.log('🏇 오늘 경주 데이터 동기화 시작...')

  // 1. 경주장 정보 확인
  await syncRaceTracks()

  // 2. 오늘 경주 동기화
  const result = await syncRacesByDate(new Date())

  console.log('\n📊 동기화 결과:')
  console.log(`   경주: ${result.stats.racesCreated}개`)
  console.log(`   출전마: ${result.stats.entriesCreated}개`)
  console.log(`   에러: ${result.stats.errors}개`)
  console.log(`\n${result.success ? '✅' : '❌'} ${result.message}`)

  process.exit(0)
}

syncToday().catch((err) => {
  console.error('❌ 동기화 실패:', err)
  process.exit(1)
})
