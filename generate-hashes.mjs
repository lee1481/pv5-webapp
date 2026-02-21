/**
 * PBKDF2 해시 생성 스크립트 (Node.js 18+ Web Crypto API 사용)
 * 기존 평문 비밀번호를 해시로 변환하여 DB 마이그레이션 SQL 생성
 */

const accounts = [
  { username: 'admin',      password: 'admin2026!' },
  { username: 'seoul',      password: 'seoul2026!' },
  { username: 'gyeongbuk',  password: 'gyeongbuk2026!' },
  { username: 'honam',      password: 'honam2026!' },
  { username: 'gyeongnam',  password: 'gyeongnam2026!' },
  { username: 'jeju',       password: 'jeju2026!' },
  { username: 'daejeon',    password: 'daejeon2026!' },
]

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('')

  return `pbkdf2$${saltHex}$${hashHex}`
}

async function main() {
  console.log('-- PBKDF2 비밀번호 마이그레이션 SQL')
  console.log('-- 생성일:', new Date().toISOString())
  console.log('')

  const sqlLines = []
  for (const { username, password } of accounts) {
    const hash = await hashPassword(password)
    sqlLines.push(`UPDATE users SET password = '${hash}' WHERE username = '${username}';`)
  }

  sqlLines.forEach(line => console.log(line))
  console.log('')
  console.log('-- 마이그레이션 완료')
}

main().catch(console.error)
