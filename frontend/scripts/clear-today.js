const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function clearToday() {
  // 2026-01-03과 2026-01-04 둘 다 삭제 (시간대 문제로 인해)
  const dates = [
    new Date(Date.UTC(2026, 0, 3)),
    new Date(Date.UTC(2026, 0, 4))
  ]
  console.log('🗑️ 2026-01-03, 2026-01-04 데이터 삭제 시작...')

  // 경주 ID 조회
  const races = await prisma.race.findMany({
    where: { raceDate: { in: dates } },
    select: { id: true }
  })
  const raceIds = races.map(r => r.id)
  console.log('   삭제할 경주:', raceIds.length, '개')

  // 예측 삭제
  const predictions = await prisma.prediction.deleteMany({
    where: { raceId: { in: raceIds } }
  })
  console.log('   예측 삭제:', predictions.count, '개')

  // 출전 정보 삭제
  const entries = await prisma.raceEntry.deleteMany({
    where: { raceId: { in: raceIds } }
  })
  console.log('   출전 정보 삭제:', entries.count, '개')

  // 경주 삭제
  const deleted = await prisma.race.deleteMany({
    where: { raceDate: { in: dates } }
  })
  console.log('   경주 삭제:', deleted.count, '개')

  console.log('✅ 데이터 삭제 완료!')
  await prisma.$disconnect()
}

clearToday().catch(console.error)
