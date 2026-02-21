// 프로덕션 실제 계정 PBKDF2 해시 생성
import { subtle, getRandomValues } from 'node:crypto'

const users = [
  { username: '본사',        password: 'admin2026!' },
  { username: '호남지사',    password: 'test123456' },
  { username: '부산경남지사', password: 'busan2026!' },
  { username: '서울/경북지사', password: '780523' },
  { username: '경기북부강원지사', password: 'gyeonggi2026!' },
  { username: '충북대전지사', password: 'chungbuk2026!' }
]

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const salt = getRandomValues(new Uint8Array(16))
  const keyMaterial = await subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derivedBits = await subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2$${saltHex}$${hashHex}`
}

console.log('-- 프로덕션 비밀번호 PBKDF2 해시 마이그레이션')
console.log(`-- 생성 시각: ${new Date().toISOString()}`)
console.log()
for (const u of users) {
  const hash = await hashPassword(u.password)
  // username에 특수문자 있으므로 이스케이프
  const escaped = u.username.replace(/'/g, "''")
  console.log(`UPDATE users SET password = '${hash}' WHERE username = '${escaped}';`)
}
