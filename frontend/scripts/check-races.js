const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  // 오늘 날짜 경주
  const today = new Date('2026-01-04')
  const races = await prisma.race.findMany({
    where: { raceDate: today },
    include: { track: true, _count: { select: { entries: true } } },
    orderBy: [{ trackId: 'asc' }, { raceNumber: 'asc' }]
  })

  console.log('오늘(2026-01-04) 경주:', races.length, '개')
  races.forEach(r => console.log('  ' + r.track.name + ' ' + r.raceNumber + 'R - ' + r._count.entries + '두'))

  const allDates = await prisma.race.groupBy({ by: ['raceDate'], _count: true })
  console.log('\n날짜별:')
  allDates.forEach(d => console.log('  ' + d.raceDate.toISOString().split('T')[0] + ': ' + d._count + '개'))

  await prisma.$disconnect()
}
check().catch(console.error)
