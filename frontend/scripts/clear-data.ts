import { prisma } from '../lib/prisma'

async function clearData() {
  console.log('🗑️ 데이터 삭제 시작...')

  // 1. 예측 삭제
  const predictions = await prisma.prediction.deleteMany({})
  console.log(`   예측 삭제: ${predictions.count}개`)

  // 2. 출전 정보 삭제
  const entries = await prisma.raceEntry.deleteMany({})
  console.log(`   출전 정보 삭제: ${entries.count}개`)

  // 3. 경주 삭제
  const races = await prisma.race.deleteMany({})
  console.log(`   경주 삭제: ${races.count}개`)

  console.log('✅ 데이터 삭제 완료!')
  await prisma.$disconnect()
}

clearData().catch(console.error)
