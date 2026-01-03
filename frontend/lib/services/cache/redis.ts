/**
 * Redis 캐싱 서비스
 * 예측 결과 및 경주 데이터 캐싱
 */

import { createClient, RedisClientType } from 'redis'

// ============================================
// Redis 설정
// ============================================

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const DEFAULT_TTL = 3600 // 1시간 (초)
const PREDICTION_TTL = 7200 // 2시간
const RACE_DATA_TTL = 600 // 10분

// ============================================
// Redis 클라이언트 클래스
// ============================================

export class RedisCache {
  private client: RedisClientType | null = null
  private isConnected: boolean = false
  private isConnecting: boolean = false

  constructor() {
    // 싱글톤이므로 생성자에서는 연결하지 않음
  }

  // ============================================
  // 연결 관리
  // ============================================

  async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    if (this.isConnecting) {
      // 이미 연결 중이면 대기
      await new Promise((resolve) => setTimeout(resolve, 100))
      return this.connect()
    }

    try {
      this.isConnecting = true

      this.client = createClient({
        url: REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis 재연결 시도 한도 초과')
              return new Error('Redis 연결 실패')
            }
            return retries * 100 // Exponential backoff
          },
        },
      })

      this.client.on('error', (error) => {
        console.error('Redis 클라이언트 에러:', error)
        this.isConnected = false
      })

      this.client.on('ready', () => {
        console.log('✅ Redis 연결 성공')
        this.isConnected = true
      })

      this.client.on('end', () => {
        console.warn('⚠️ Redis 연결 종료')
        this.isConnected = false
      })

      await this.client.connect()
      this.isConnected = true
    } catch (error) {
      console.error('Redis 연결 실패:', error)
      this.isConnected = false
      this.client = null
    } finally {
      this.isConnecting = false
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit()
      this.isConnected = false
      this.client = null
    }
  }

  // ============================================
  // 기본 캐시 operations
  // ============================================

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      await this.connect()
    }

    if (!this.client) {
      console.warn('Redis 사용 불가, 캐시 미스')
      return null
    }

    try {
      const value = await this.client.get(key)
      if (!value) return null

      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Redis GET 에러 (${key}):`, error)
      return null
    }
  }

  async set<T = any>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<boolean> {
    if (!this.isConnected) {
      await this.connect()
    }

    if (!this.client) {
      console.warn('Redis 사용 불가, 캐싱 스킵')
      return false
    }

    try {
      const serialized = JSON.stringify(value)
      await this.client.setEx(key, ttl, serialized)
      return true
    } catch (error) {
      console.error(`Redis SET 에러 (${key}):`, error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      await this.client.del(key)
      return true
    } catch (error) {
      console.error(`Redis DEL 에러 (${key}):`, error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false
    }

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Redis EXISTS 에러 (${key}):`, error)
      return false
    }
  }

  // ============================================
  // 예측 캐싱
  // ============================================

  async getPrediction(raceId: number, type: string): Promise<any | null> {
    const key = `prediction:${raceId}:${type}`
    return this.get(key)
  }

  async setPrediction(raceId: number, type: string, data: any): Promise<boolean> {
    const key = `prediction:${raceId}:${type}`
    return this.set(key, data, PREDICTION_TTL)
  }

  async invalidatePrediction(raceId: number, type?: string): Promise<void> {
    if (type) {
      const key = `prediction:${raceId}:${type}`
      await this.del(key)
    } else {
      // 해당 경주의 모든 예측 무효화
      const pattern = `prediction:${raceId}:*`
      await this.deletePattern(pattern)
    }
  }

  // ============================================
  // 경주 데이터 캐싱
  // ============================================

  async getRaceData(raceId: number): Promise<any | null> {
    const key = `race:${raceId}`
    return this.get(key)
  }

  async setRaceData(raceId: number, data: any): Promise<boolean> {
    const key = `race:${raceId}`
    return this.set(key, data, RACE_DATA_TTL)
  }

  async invalidateRaceData(raceId: number): Promise<void> {
    const key = `race:${raceId}`
    await this.del(key)
    // 관련 예측도 무효화
    await this.invalidatePrediction(raceId)
  }

  // ============================================
  // 컨텍스트 캐싱
  // ============================================

  async getRaceContext(raceId: number): Promise<string | null> {
    const key = `context:${raceId}`
    return this.get<string>(key)
  }

  async setRaceContext(raceId: number, context: string): Promise<boolean> {
    const key = `context:${raceId}`
    return this.set(key, context, RACE_DATA_TTL)
  }

  // ============================================
  // 배치 operations
  // ============================================

  async mGet<T = any>(keys: string[]): Promise<Array<T | null>> {
    if (!this.isConnected || !this.client || keys.length === 0) {
      return keys.map(() => null)
    }

    try {
      const values = await this.client.mGet(keys)
      return values.map((v) => (v ? JSON.parse(v) : null))
    } catch (error) {
      console.error('Redis MGET 에러:', error)
      return keys.map(() => null)
    }
  }

  async mSet(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    if (!this.isConnected || !this.client || entries.length === 0) {
      return false
    }

    try {
      // TTL이 다를 수 있으므로 개별 SET
      await Promise.all(
        entries.map((entry) =>
          this.set(entry.key, entry.value, entry.ttl || DEFAULT_TTL)
        )
      )
      return true
    } catch (error) {
      console.error('Redis MSET 에러:', error)
      return false
    }
  }

  // ============================================
  // 패턴 매칭
  // ============================================

  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0
    }

    try {
      let cursor = 0
      let deletedCount = 0

      do {
        const result = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        })

        cursor = result.cursor

        if (result.keys.length > 0) {
          await this.client.del(result.keys)
          deletedCount += result.keys.length
        }
      } while (cursor !== 0)

      return deletedCount
    } catch (error) {
      console.error(`Redis DELETE PATTERN 에러 (${pattern}):`, error)
      return 0
    }
  }

  // ============================================
  // 통계 및 모니터링
  // ============================================

  async getInfo(): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      return null
    }

    try {
      return await this.client.info()
    } catch (error) {
      console.error('Redis INFO 에러:', error)
      return null
    }
  }

  async getStats(): Promise<{
    connected: boolean
    keyCount: number
    memoryUsed?: string
  }> {
    const stats = {
      connected: this.isConnected,
      keyCount: 0,
      memoryUsed: undefined as string | undefined,
    }

    if (!this.isConnected || !this.client) {
      return stats
    }

    try {
      stats.keyCount = await this.client.dbSize()
      const info = await this.getInfo()

      if (info) {
        const memMatch = info.match(/used_memory_human:(.+)/)
        if (memMatch) {
          stats.memoryUsed = memMatch[1].trim()
        }
      }
    } catch (error) {
      console.error('Redis STATS 에러:', error)
    }

    return stats
  }

  // ============================================
  // 헬스 체크
  // ============================================

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect()
      }

      if (!this.client) {
        return false
      }

      await this.client.ping()
      return true
    } catch (error) {
      console.error('Redis 헬스 체크 실패:', error)
      return false
    }
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

let redisCacheInstance: RedisCache | null = null

export function getRedisCache(): RedisCache {
  if (!redisCacheInstance) {
    redisCacheInstance = new RedisCache()
  }
  return redisCacheInstance
}

export default getRedisCache

// ============================================
// 캐시 헬퍼 함수
// ============================================

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cache = getRedisCache()

  // 캐시 확인
  const cached = await cache.get<T>(key)
  if (cached !== null) {
    console.log(`✅ 캐시 히트: ${key}`)
    return cached
  }

  // 캐시 미스 - fetcher 실행
  console.log(`❌ 캐시 미스: ${key}`)
  const data = await fetcher()

  // 캐시 저장
  await cache.set(key, data, ttl)

  return data
}
