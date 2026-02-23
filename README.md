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
  - PDF 다운로드 (인쇄 기능)
  - 이메일 발송 (거래명세서 이미지 첨부)
  - Excel 데이터 내보내기/가져오기
  - JPG 이미지 저장

## URLs
- **Production**: https://pv5-webapp.pages.dev
- **Dev/Multi-tenant**: https://dev-multi-tenant.pv5-webapp.pages.dev
- **GitHub**: https://github.com/lee1481/pv5-webapp (브랜치: dev-multi-tenant)

## 버전 정보
- **현재 버전**: v3.2
- **마지막 업데이트**: 2026-02-23
- **활성 브랜치**: `dev-multi-tenant`

---

## 최근 업데이트 내역 (최신순)

### 2026-02-23 (v3.2) - 최신 🚀
- ✅ **5단계 Excel 내보내기 연락처·주소 누락 근본 수정**
  - 전역 `allReports` 변수를 우선 사용 (지역변수 충돌 해결)
  - `customerInfo` 이중 직렬화(JSON 문자열 → 객체) 파싱 보완
  - 다중 필드명 fallback: `receiverPhone` / `phone`, `receiverAddress` / `address`
- ✅ **6단계 검색 기능 근본 수정**
  - `searchRevenue()`, `resetRevenueSearch()`, `updateRevenueFilters()` 함수 신규 추가
  - 고객명 필터 로직 `loadRevenueList()`에 완전 연동
- ✅ **6단계 Excel 다운로드 근본 수정**
  - 함수명 불일치 해결: HTML `onclick="exportRevenueToExcel()"` ↔ `downloadRevenueExcel()` → 양방향 alias 추가
  - 엘리먼트 ID 불일치 해결: `revenueList` → `revenueTableBody`로 수정
  - 에러 핸들링 강화 (try-catch + 사용자 알림)

### 2026-02-22 (v3.1)
- ✅ **6단계 Excel 다운로드 서버 D1 데이터 조회로 수정**
  - 기존 localStorage만 조회 → `/api/reports/list` 서버 API 우선 조회로 변경
  - 필드명 오류 수정: `phone`/`address` → `receiverPhone`/`receiverAddress`
- ✅ **본사 테이블 UI 개선**
  - 상태 컬럼을 주문자명 앞으로 이동 (접수일자 → 상태 → 주문자명 순)
  - 주문자명·상태 배지·제품명 `whitespace-nowrap` 적용 (두 줄 깨짐 해결)

### 2026-02-21 (v3.0) - 멀티테넌트 런칭
- ✅ **1단계→5단계 저장 후 1단계 미사라짐 근본 수정**
  - `loadReport()` 시 `selectedAssignment` 복원 로직 추가
  - `ocrData.assignmentId` fallback 추가 (단계별 2곳)
  - 로컬 상태를 서버 규칙과 동기화 (`in_progress` 정렬 기준)
- ✅ **배정 상태 자동 동기화 (assignments ↔ reports)**
  - `draft + 날짜 없음` → `adjusting`
  - `draft + 날짜 있음` → `in_progress`
  - `confirmed` → `in_progress`
  - `inst_confirmed` → `inst_confirmed`
  - `completed` → `completed`
- ✅ **DB 즉시 수정**: ASG-1771819413043 (윤진) in_progress 정상 적용

### 2026-02-20 (v2.9)
- ✅ **모바일 배정목록 헤더 텍스트 줄바꿈 깨짐 수정**
- ✅ **모바일 UI 개선**: step 3 grid, 세로형 통계 카드, 반응형 헤더
- ✅ **저장 문서 카드 상태별 정렬** (진행중 위, 시공완료 아래)
- ✅ **본사 헤더에 홈 버튼 추가** (head role 전용)
- ✅ **수정저장 시 assignment_id 보존 로직 추가**
- ✅ **상태 동기화 근본 수정** (DB CHECK 확장, 프론트 PATCH 제거)

### 2026-02-11 (v2.6)
- ✅ **3단계 상태 관리 시스템 완성**
  - 예약 접수 중 (draft) → 예약 확정 (confirmed) → 시공 완료 (completed)
  - Step 5 상태별 배지 표시 (파란/초록/회색)
  - 예약 확정 버튼 추가 (`PATCH /api/reports/:id/confirm`)
  - Step 6 자동 마이그레이션 버튼 (0003) 추가
- ✅ **Step 5 UI 개선**
  - 목록 카드에서 JPG 저장 버튼 제거 (상세보기 모달에서만 제공)
  - 문서 ID 제거 → 설치 주소/시간 표시로 변경

---

## 현재 완료된 기능

### ✅ 1단계: 거래명세서 업로드 및 OCR 인식
- 드래그 앤 드롭 파일 업로드
- 이미지 파일 선택 (JPG, PNG, GIF)
- **Google Vision API 통합** (고정밀 OCR)
- 고객 정보 자동 추출 (출력일자, 수령자명, 주소, 연락처 등)
- **배정 목록 표시**: 본사에서 배정한 고객 목록 확인
  - 대기 중(assigned): 미접수 건
  - 진행 중(adjusting/in_progress/confirmed/inst_confirmed): 진행 건
  - 완료(completed): 완료 건
- OCR 실패 시 수동 입력 폼 제공

### ✅ 2단계: 제품 선택
- 브랜드별 탭 (밀워키/기아)
- 제품 패키지 카드 UI, 다중 선택 지원
- **3단 선반 설치 위치 옵션** (좌측/우측/양측)

### ✅ 3단계: 설치 정보 입력
- 설치 날짜 선택 / 설치 시간 (오전·오후 + 시/분 버튼 + 직접입력)
- 설치 주소 (OCR 자동 입력 + 고객 주소 복사 버튼)
- 특이사항/비고 입력
- **임시저장**: 날짜 없으면 `adjusting`, 날짜 있으면 `in_progress` 자동 동기화

### ✅ 4단계: 최종 확인 및 발송
- 고객 정보 요약 (출력일자, 상품번호 포함)
- 자재 점검표 (체크박스) + 시공자 이름 입력
- **저장하기**: D1 Database + R2 Storage + localStorage 캐시
- **PDF 다운로드** (브라우저 인쇄)
- **이메일 발송** (Resend API, 거래명세서 이미지 첨부)
- 저장 후 자동 초기화 → 신규 접수 즉시 시작

### ✅ 5단계: 저장 문서 관리
- **Cloudflare D1 Database 조회** (중앙 데이터베이스)
- **실시간 검색 필터링**: 고객명 / 날짜 범위 / 초기화
- **3단계 상태 시스템**:
  - 📘 예약 접수 중 (draft) → [예약 확정] 버튼
  - 🟢 예약 확정 (confirmed) → [시공 완료] 버튼
  - ⚪ 시공 완료 (completed) → [시공 완료됨] 비활성화
- 카드형 목록 UI (수령자 이름, 상태 배지, 설치 날짜·시간·주소)
- 문서 관리: 상세보기 / 수정하기 / 예약 확정 / 시공 완료 / 삭제
- **Excel 내보내기** (`PV5_시공확인서_YYYY-MM-DD.xlsx`)
  - 서버 D1 우선 조회, localStorage fallback
  - 연락처(`receiverPhone`)·주소(`receiverAddress`) 정확 매핑 ✅ (v3.2 수정)
- **Excel 가져오기** (일괄 데이터 가져오기)
- **데이터 초기화** (D1 + localStorage 완전 삭제)

### ✅ 6단계: 매출 관리
- **시공 완료된 문서만 조회** (`/api/reports/completed/list`)
- **매출 통계 대시보드**: 총 매출액, 총 소비자 가격, 시공 건수
- **기간별 검색 필터**: 이번 주 / 이번 달 / 이번 분기 / 사용자 지정 + 고객명 검색
  - `searchRevenue()` / `resetRevenueSearch()` / `updateRevenueFilters()` ✅ (v3.2 수정)
- **Excel 다운로드** (`PV5_매출관리_YYYY-MM-DD.xlsx`) ✅ (v3.2 수정)
- 제품별 마진 자동 계산 (밀워키·기아 전 제품)

### ✅ 본사(HQ) 관리 페이지 (`/static/hq`)
- 전체 지사 접수 현황 테이블 (접수일자 → **상태** → 주문자명 → 연락처 → …)
- 배정 관리: 지사 배정 / 상태 변경
- 통계 대시보드 (전체/진행중/완료 건수)
- 홈 버튼 (본사 전용)

---

## 기능 URI 요약

### API 엔드포인트
| 경로 | 메소드 | 설명 |
|------|--------|------|
| `/` | GET | 메인 페이지 (런처로 리다이렉트) |
| `/ocr` | GET | 지사 앱 메인 (OCR + 시공확인서) |
| `/static/hq` | GET | 본사 관리 페이지 |
| `/static/login` | GET | 로그인 페이지 |
| `/api/packages` | GET | 전체 제품 패키지 리스트 |
| `/api/packages/:id` | GET | 특정 제품 패키지 조회 |
| `/api/ocr` | POST | 거래명세서 OCR 분석 (Google Vision API) |
| `/api/send-email` | POST | 이메일 발송 (Resend API) |
| `/api/reports/save` | POST | 시공 확인서 저장 (D1 + R2) |
| `/api/reports/list` | GET | 저장된 문서 목록 조회 (D1) |
| `/api/reports/:id` | GET | 특정 문서 조회 |
| `/api/reports/:id` | DELETE | 특정 문서 삭제 |
| `/api/reports/:id/confirm` | PATCH | 예약 확정 처리 |
| `/api/reports/:id/complete` | PATCH | 시공 완료 처리 |
| `/api/reports/completed/list` | GET | 시공 완료 문서 조회 (매출 관리용) |
| `/api/reports/stats` | GET | 매출 통계 조회 |
| `/api/assignments` | GET/POST | 배정 목록 조회/추가 |
| `/api/assignments/:id` | PATCH | 배정 상태 변경 |
| `/api/auth/login` | POST | 로그인 (JWT 발급) |
| `/api/migrate-confirmed-status` | POST | 3단계 상태 마이그레이션 |

### 정적 리소스
| 경로 | 설명 |
|------|------|
| `/static/app.js` | 지사 앱 프론트엔드 JavaScript |
| `/static/hq.html` | 본사 관리 페이지 HTML |
| `/static/login.html` | 로그인 페이지 HTML |
| `/static/launcher.html` | 런처 페이지 HTML |
| `/static/kvan-logo.png` | K-VAN 로고 |

---

## 데이터 구조

### 배정 (Assignment)
```typescript
{
  assignment_id: string;    // ASG-타임스탬프
  branch_id: number;        // 지사 ID
  customer_info: JSON;      // { receiverName, receiverPhone, receiverAddress, productName }
  status: string;           // assigned | adjusting | in_progress | confirmed | inst_confirmed | completed
  created_at: string;
  updated_at: string;
}
```

### 저장된 문서 (Report)
```typescript
{
  reportId: string;              // REPORT-타임스탬프
  customerInfo: {
    receiverName: string;
    receiverPhone: string;        // 연락처
    receiverAddress: string;      // 주소
    productName: string;
    assignmentId: string;
  };
  packages: ProductPackage[];
  packagePositions: { [id: string]: 'left' | 'right' | 'both' };
  installDate: string;
  installTime: string;
  installAddress: string;
  notes: string;
  installerName: string;
  imageKey: string;              // R2 이미지 키
  status: string;                // draft | confirmed | completed
  branch_id: number;
  assignment_id: string;
  createdAt: string;
  updatedAt: string;
}
```

### 배정-보고서 상태 동기화 규칙
| report status | 날짜 유무 | assignment status |
|---|---|---|
| draft | 없음 | adjusting (조율 중) |
| draft | 있음 | in_progress (예약 접수 중) |
| confirmed | - | in_progress (예약 확정) |
| inst_confirmed | - | inst_confirmed (시공 확정) |
| completed | - | completed (시공 완료) |

---

## 저장소 아키텍처

### 1. Cloudflare D1 Database (Primary)
- **바인딩**: `DB`
- **Database**: `webapp-production`
- **주요 테이블**: `reports`, `assignments`, `users`

#### reports 테이블
```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT UNIQUE NOT NULL,
  customer_info TEXT,         -- JSON
  packages TEXT,              -- JSON
  package_positions TEXT,     -- JSON
  install_date TEXT,
  install_time TEXT,
  install_address TEXT,
  notes TEXT,
  installer_name TEXT,
  image_key TEXT,
  image_filename TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','confirmed','completed')),
  branch_id INTEGER,
  assignment_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### assignments 테이블
```sql
CREATE TABLE assignments (
  assignment_id TEXT PRIMARY KEY,
  branch_id INTEGER,
  customer_info TEXT,         -- JSON
  status TEXT DEFAULT 'assigned',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Cloudflare R2 Storage (Images)
- **바인딩**: `R2`
- **Bucket**: `pv5-images`
- **저장 경로**: `images/{timestamp}-{reportId}-{filename}`

### 3. localStorage (Cache)
- **키**: `pv5_reports`
- **용도**: 서버 조회 실패 시 fallback, 빠른 로컬 렌더링

---

## 사용자 가이드

### 지사 사용자
1. https://dev-multi-tenant.pv5-webapp.pages.dev/static/login 접속 → 지사 계정 로그인
2. **1단계**: 배정 목록에서 고객 선택 또는 OCR 업로드
3. **2단계**: 제품 선택
4. **3단계**: 설치 날짜·시간·주소 입력 → 임시저장
5. **4단계**: 최종 확인 → 저장 / 이메일 발송 / PDF 인쇄
6. **5단계**: 저장 문서 목록 → 예약 확정 / 시공 완료 처리 / Excel 내보내기
7. **6단계**: 매출 관리 (시공 완료 건 조회 + Excel 다운로드)

### 본사 사용자
1. https://dev-multi-tenant.pv5-webapp.pages.dev/static/login 접속 → 본사 계정 로그인
2. 전체 지사 접수 현황 테이블 확인
3. 배정 추가 / 상태 관리 / 통계 대시보드 활용

---

## 기술 스택
- **프론트엔드**: HTML, TailwindCSS (CDN), JavaScript (vanilla)
- **백엔드**: Hono Framework (TypeScript)
- **런타임**: Cloudflare Workers/Pages
- **데이터베이스**: Cloudflare D1 (SQLite)
- **파일 저장소**: Cloudflare R2 (S3 호환)
- **인증**: JWT (HS256)
- **OCR**: Google Vision API
- **이메일**: Resend API
- **라이브러리**: Axios, Font Awesome, Tailwind CSS, SheetJS (xlsx), html2canvas

## 배포 상태
- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 프로덕션 배포 완료
- **프로덕션 URL**: https://pv5-webapp.pages.dev
- **Dev URL**: https://dev-multi-tenant.pv5-webapp.pages.dev
- **프로젝트명**: `pv5-webapp`
- **활성 브랜치**: `dev-multi-tenant`
- **마지막 배포**: 2026-02-23

## 아직 구현되지 않은 기능
1. **제품 이미지 업로드** (현재 placeholder)
2. **알림 시스템** (설치 일정 리마인더, SMS)
3. **월별 실적 차트 대시보드**
4. **다국어 지원**

## 다음 개발 단계 (권장)
1. **inst_confirmed 상태 UI** - 지사에서 시공 확정 버튼 노출
2. **본사 통계 고도화** - 지사별 매출 비교 차트
3. **알림 자동화** - 설치 전날 이메일/SMS 발송

---

## 환경 변수
```bash
# .dev.vars (로컬 개발용)
GOOGLE_VISION_API_KEY=AIzaSyBHiHgtP9f0gjWJOe97ezxd6N5Qc4OgNgk
RESEND_API_KEY=your_resend_api_key
JWT_SECRET=your_jwt_secret
```

## 개발 환경 명령어
```bash
# 빌드
cd /home/user/webapp && npm run build

# 로컬 D1 마이그레이션
cd /home/user/webapp && npm run db:migrate:local

# PM2로 개발 서버 시작
cd /home/user/webapp && pm2 start ecosystem.config.cjs

# 배포
cd /home/user/webapp && npm run build
npx wrangler pages deploy dist --project-name pv5-webapp
```

## 문의 및 지원
- **개발자**: 사인마스터 AI 팀
- **용도**: K-VAN PV5 시공 관리 시스템
- **프로덕션 URL**: https://pv5-webapp.pages.dev
