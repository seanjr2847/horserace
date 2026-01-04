const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const races = await prisma.race.findMany({
    select: { id: true, raceDate: true, raceNumber: true, trackId: true },
    orderBy: { id: 'desc' },
    take: 5
  })

  console.log('최근 5개 경주의 raceDate:')
  races.forEach(r => {
    console.log(`  ID ${r.id}: track=${r.trackId} race=${r.raceNumber}R → ${r.raceDate.toISOString()}`)
  })

  // 전체 날짜별 카운트
  const allDates = await prisma.$queryRaw`SELECT DATE(race_date) as d, COUNT(*) as c FROM races GROUP BY DATE(race_date) ORDER BY d DESC`
  console.log('\nDB 날짜별 (raw):')
  allDates.forEach(d => console.log(`  ${d.d}: ${d.c}개`))

  await prisma.$disconnect()
}

check().catch(console.error)
