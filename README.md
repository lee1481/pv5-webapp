# PV5 시공(예약) 확인서 시스템

## 프로젝트 개요
- **이름**: PV5 시공(예약) 확인서 시스템
- **목표**: 거래명세서 OCR 자동 인식을 통한 시공 확인서 자동 생성, 저장 및 관리
- **주요 기능**:
  - 거래명세서 이미지 업로드 및 OCR 자동 인식 (Google Vision API)
  - 밀워키/기아 PV5 제품 패키지 선택
  - 설치 일정 및 장소 정보 입력
  - 자재 점검표 자동 생성
  - 시공 확인서 저장 및 관리 (Cloudflare D1 + R2 + KV)
  - **다중 지사 & 본사 관리 시스템** (멀티테넌트)
  - **배정 관리 및 상태 자동 동기화** (assignments ↔ reports)
  - **시공 완료 처리 및 매출 관리**
  - **솔라피 SMS 자동 알림** (접수 등록 시 담당자 전원 발송)
  - PDF 다운로드 (인쇄 기능)
  - 이메일 발송 (거래명세서 이미지 첨부)
  - Excel 데이터 내보내기/가져오기

## URLs
- **Production**: https://pv5-webapp.pages.dev
- **Dev/Multi-tenant**: https://dev-multi-tenant.pv5-webapp.pages.dev
- **GitHub**: https://github.com/lee1481/pv5-webapp (브랜치: dev-multi-tenant)

## 버전 정보
- **현재 버전**: v4.6
- **마지막 업데이트**: 2026-03-24
- **활성 브랜치**: `dev-multi-tenant`

---

## 최근 업데이트 내역 (최신순)

### 2026-03-24 (v4.6) - 최신 🚀
- ✅ **D1 Time Travel로 원본 데이터 완전 복구**
  - 새 앱 개발 과정에서 꼬인 DB를 3월 13일 시점으로 롤백
  - reports 17건 (2월~3월 실제 시공 데이터) 완전 복구
  - assignments 19건 완전 복구
- ✅ **reports.branch_id 누락 버그 수정**
  - 본사 계정으로 접수 시 branch_id가 null로 저장되던 버그 수정
  - assignments.branch_id를 자동 상속하여 저장
  - 기존 null 데이터 7건 일괄 복구
- ✅ **branches 테이블 컬럼 복구**
  - Time Travel 복구 후 누락된 phone, username, password 컬럼 재추가
  - branch_contacts 테이블 재생성
- ✅ **GitHub 저장소 완전 분리**
  - 케이밴 시공예약: `lee1481/pv5-webapp` (dev-multi-tenant 브랜치)
  - 케이밴 악세서리: `lee1481/kia-accessories` (별도 저장소 분리 완료)
- ✅ **로컬 폴더 분리**
  - 케이밴 시공예약: `/home/user/kvan-pv5`
  - 케이밴 악세서리: `/home/user/webapp`

### 2026-03-14 (v4.5)
- ✅ **솔라피 SMS 다건 발송 정상 작동 확인**
  - 엔드포인트: `/messages/v4/send` + `message` 단수 루프 방식 확정
  - 각 발송마다 독립적인 HMAC-SHA256 서명 생성 (중복 서명 차단 대응)
  - 접수 등록 1건 → 등록된 모든 담당자에게 동시 SMS 발송 ✅
- ✅ **SMS 수신 다중 담당자 관리 UI 개선**
  - 담당자 추가 버튼 작동 불가 버그 수정
  - 모달 레이아웃 비율 깨짐 수정 (`max-w-xl`, `space-y-2` 세로 배치)
- ✅ **프로덕션 D1에 `branch_contacts` 테이블 생성 완료**
  - 기존 로컬에만 존재하던 테이블을 원격 D1에도 적용
- ✅ **지사 삭제 시 소속 users 계정 CASCADE 삭제**
  - 지사 삭제 → 연결된 users 레코드 자동 삭제 → 오류 없이 정상 삭제

### 2026-03-14 (v4.4)
- ✅ **솔라피 SMS 자동 발송 기능 구현**
  - 접수 등록 시 해당 지사 담당자에게 자동 SMS 발송
  - 발신번호: 010-2009-1481 (솔라피 등록 완료)
  - SOLAPI_API_KEY, SOLAPI_API_SECRET Cloudflare Secret 등록
- ✅ **SMS 수신 다중 담당자 관리 (`branch_contacts`)**
  - `branch_contacts` 테이블 추가 (branch_id, name, phone, memo)
  - 지사 수정 모달에 SMS 수신 담당자 섹션 추가
  - 담당자 추가/삭제 API 3개 구현 (`GET/POST/DELETE /api/branches/:id/contacts`)
  - 접수 등록 시 `branches.phone` + `branch_contacts` 전원에게 발송 (중복 제거)
- ✅ **지사 관리 (`/static/branches`) 개선**
  - 지사 추가/수정 시 담당자 연락처(`phone`) 입력란 추가
  - 수정 버튼 클릭 시 `openEditModal` 정상 호출 수정
  - `submitPasswordChange` 구문 오류 수정 (지사 목록 표시 복구)

### 2026-03-11 (v4.0)
- ✅ **사용설명서 내장 (웹앱 내 도움말 페이지)**
  - 헤더에 📖 사용설명서 버튼 추가 (새 탭으로 열림)
  - URL: `/static/manual.html`
  - 구성: 전체 흐름 · 지사 가이드(1~7단계) · 본사 가이드 · FAQ · 문의
  - PDF 다운로드 기능 내장 (브라우저 인쇄 → PDF 저장)
  - 모바일/데스크톱 반응형 레이아웃

### 2026-03-11 (v3.9)
- ✅ **5단계 저장문서 미표시 버그 수정**
- ✅ **1단계 배정목록 중복 표시 버그 수정**
- ✅ **6단계 마이그레이션 배너 완전 삭제**
- ✅ **6단계 헤더 위 이전 버튼 삭제**

### 2026-03-10 (v3.8)
- ✅ **7단계 정산내역 월별 엑셀 다운로드**
- ✅ **밀워키 워크스테이션 확정 단가 저장** (4,264,420원, 마진율 28.7%)
- ✅ **6단계 일괄 정산완료 기능**

### 2026-03-10 (v3.7)
- ✅ **7단계 정산내역 탭 신규 추가**
- ✅ **6단계 정산완료 기능**

### 2026-03-09 (v3.6)
- ✅ **중복 접수 방지 강화**

### 2026-02-21 (v3.0) - 멀티테넌트 런칭

---

## 현재 완료된 기능

### ✅ 지사 관리 (`/static/branches`) - 본사 전용
- 지사 목록 조회 / 추가 / 수정 / 삭제
- 지사 삭제 시 소속 users 계정 자동 삭제 (CASCADE)
- 지사별 담당자 연락처(`phone`) 관리
- **SMS 수신 담당자 다중 관리** (`branch_contacts`)
  - 담당자 이름 / 전화번호 / 메모 등록
  - 무제한 추가 / 삭제 가능
  - 접수 등록 시 등록된 전원에게 SMS 자동 발송
- 지사 로그인 비밀번호 변경

### ✅ SMS 자동 알림 (솔라피)
- **트리거**: 본사에서 접수 등록 시 자동 발송
- **수신 대상**: `branches.phone` + `branch_contacts` 전체 (중복 제거)
- **발신번호**: 010-2009-1481
- **메시지 내용**: 지사명, 고객명, 연락처, 주소, 제품, 접수일, 확인 URL
- **발송 방식**: `message` 단수 루프 (각 건마다 독립 HMAC 서명)
- **API**: 솔라피 `/messages/v4/send`

### ✅ 1단계: 거래명세서 업로드 및 OCR 인식
- 드래그 앤 드롭 / 파일 선택 업로드
- Google Vision API 통합 (고정밀 OCR)
- 배정 목록 표시 (본사 배정 고객 확인)
- OCR 실패 시 수동 입력 폼 제공

### ✅ 2단계: 제품 선택
- 브랜드별 탭 (밀워키/기아), 다중 선택
- 3단 선반 설치 위치 옵션 (좌측/우측/양측)

### ✅ 3단계: 설치 정보 입력
- 설치 날짜/시간/주소 입력
- 임시저장 (날짜 유무에 따라 상태 자동 동기화)

### ✅ 4단계: 최종 확인 및 발송
- 자재 점검표 + 시공자 이름 입력
- 저장 (D1 + R2) / PDF 다운로드 / 이메일 발송

### ✅ 5단계: 저장 문서 관리
- D1 Database 조회 / 실시간 검색 필터링
- 예약 확정 / 시공 완료 상태 관리
- Excel 내보내기/가져오기

### ✅ 6단계: 매출 관리
- 시공 완료 건 조회 / 매출 통계 / Excel 다운로드
- 기간별 필터 / 정산완료 처리

### ✅ 7단계: 정산 내역
- 월별 아코디언 / Excel 다운로드
- 정산 취소 (6단계로 되돌리기)

### ✅ 본사(HQ) 관리 페이지 (`/static/hq`)
- 전체 지사 접수 현황 / 배정 관리 / 통계 대시보드

---

## 기능 URI 요약

### 주요 페이지
| 경로 | 설명 |
|------|------|
| `/static/login` | 로그인 페이지 |
| `/static/launcher` | 런처 페이지 (본사/지사 분기) |
| `/static/branches` | 지사 관리 (본사 전용) |
| `/static/hq` | 본사 접수 관리 |
| `/static/manual` | 사용설명서 |
| `/ocr` | 지사 앱 메인 (OCR + 시공확인서) |

### API 엔드포인트
| 경로 | 메소드 | 설명 |
|------|--------|------|
| `/api/auth/login` | POST | 로그인 (JWT 발급) |
| `/api/auth/refresh` | POST | 토큰 자동 갱신 |
| `/api/branches/list` | GET | 지사 목록 조회 |
| `/api/branches` | POST | 지사 추가 |
| `/api/branches/:id` | PUT | 지사 수정 |
| `/api/branches/:id` | DELETE | 지사 삭제 (users CASCADE) |
| `/api/branches/:id/contacts` | GET | SMS 담당자 목록 조회 |
| `/api/branches/:id/contacts` | POST | SMS 담당자 추가 |
| `/api/branches/:id/contacts/:cid` | DELETE | SMS 담당자 삭제 |
| `/api/assignments` | GET/POST | 배정 목록 조회/추가 (SMS 자동 발송) |
| `/api/assignments/:id` | PATCH | 배정 상태 변경 |
| `/api/reports/save` | POST | 시공 확인서 저장 |
| `/api/reports/list` | GET | 저장 문서 목록 |
| `/api/reports/completed/list` | GET | 시공 완료 문서 조회 |
| `/api/reports/settled/list` | GET | 정산 내역 조회 |
| `/api/reports/:id/confirm` | PATCH | 예약 확정 |
| `/api/reports/:id/complete` | PATCH | 시공 완료 |
| `/api/reports/:id/settle` | POST | 정산 완료 |
| `/api/reports/:id/unsettle` | POST | 정산 취소 |
| `/api/users/my-password` | PUT | 본사 비밀번호 변경 |
| `/api/users/:username/password` | PUT | 지사 비밀번호 변경 |
| `/api/ocr` | POST | 거래명세서 OCR (Google Vision API) |
| `/api/send-email` | POST | 이메일 발송 (Resend API) |

---

## 데이터 구조

### branches 테이블
```sql
CREATE TABLE branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### branch_contacts 테이블 (SMS 수신 담당자)
```sql
CREATE TABLE branch_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
```

### assignments 테이블
```sql
CREATE TABLE assignments (
  assignment_id TEXT PRIMARY KEY,
  branch_id INTEGER,
  customer_name TEXT,
  phone TEXT,
  address TEXT,
  product_name TEXT,
  notes TEXT,
  order_date TEXT,
  status TEXT DEFAULT 'assigned',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 배정-보고서 상태 동기화 규칙
| report status | 날짜 유무 | assignment status |
|---|---|---|
| draft | 없음 | adjusting |
| draft | 있음 | in_progress |
| confirmed | - | in_progress |
| inst_confirmed | - | inst_confirmed |
| completed | - | completed |

---

## 저장소 아키텍처
- **Cloudflare D1** (`pv5-reports-db`): 모든 데이터 (branches, branch_contacts, assignments, reports, users 등)
- **Cloudflare R2** (`pv5-images`): 거래명세서 이미지 파일
- **Cloudflare KV** (`REPORTS_KV`): 캐시/설정값

---

## 기술 스택
- **프론트엔드**: HTML, TailwindCSS (CDN), JavaScript (vanilla)
- **백엔드**: Hono Framework (TypeScript)
- **런타임**: Cloudflare Workers/Pages
- **데이터베이스**: Cloudflare D1 (SQLite)
- **파일 저장소**: Cloudflare R2
- **인증**: JWT (HS256)
- **OCR**: Google Vision API
- **이메일**: Resend API
- **SMS**: 솔라피 (SOLAPI) `/messages/v4/send`
- **라이브러리**: Axios, Font Awesome, TailwindCSS, SheetJS (xlsx)

---

## Cloudflare Secrets (환경변수)
| 키 | 설명 |
|----|------|
| `SOLAPI_API_KEY` | 솔라피 API Key |
| `SOLAPI_API_SECRET` | 솔라피 API Secret |
| `GOOGLE_VISION_API_KEY` | Google Vision OCR API Key |
| `RESEND_API_KEY` | Resend 이메일 API Key |
| `JWT_SECRET` | JWT 서명 비밀키 |

---

## 배포 상태
- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 프로덕션 배포 완료
- **프로덕션 URL**: https://pv5-webapp.pages.dev
- **Dev URL**: https://dev-multi-tenant.pv5-webapp.pages.dev
- **프로젝트명**: `pv5-webapp`
- **활성 브랜치**: `dev-multi-tenant`
- **마지막 배포**: 2026-03-24

## 개발 환경 명령어
```bash
# 빌드
cd /home/user/kvan-pv5 && npm run build

# 로컬 D1 마이그레이션
cd /home/user/kvan-pv5 && npm run db:migrate:local

# PM2로 개발 서버 시작
cd /home/user/kvan-pv5 && pm2 start ecosystem.config.cjs

# 배포
cd /home/user/kvan-pv5 && npx wrangler pages deploy dist --project-name pv5-webapp
```

## 아직 구현되지 않은 기능
1. **제품 이미지 업로드** (현재 placeholder)
2. **월별 실적 차트 대시보드**
3. **다국어 지원**

## 다음 개발 단계 (권장)
1. **본사 통계 고도화** - 지사별 매출 비교 차트
2. **SMS 발송 이력 관리** - 발송 성공/실패 로그 DB 저장
3. **알림 자동화** - 설치 전날 이메일/SMS 발송

---

## 문의 및 지원
- **개발자**: 사인마스터 AI 팀
- **용도**: K-VAN PV5 시공 관리 시스템
- **프로덕션 URL**: https://pv5-webapp.pages.dev
