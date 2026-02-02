# PV5 시공(예약) 확인서 시스템

## 프로젝트 개요
- **이름**: PV5 시공(예약) 확인서 시스템
- **목표**: 거래명세서 OCR 자동 인식을 통한 시공 확인서 자동 생성, 저장 및 관리
- **주요 기능**:
  - 거래명세서 이미지 업로드 및 OCR 자동 인식 (Google Vision API)
  - 밀워키/기아 PV5 제품 패키지 선택
  - 설치 일정 및 장소 정보 입력
  - 자재 점검표 자동 생성
  - 시공 확인서 저장 및 관리 (Cloudflare KV)
  - PDF 다운로드 (인쇄 기능)
  - 이메일 발송 (거래명세서 이미지 첨부)

## URLs
- **Production**: https://c8742ea6.webapp-6m6.pages.dev
- **직접 접속**: https://c8742ea6.webapp-6m6.pages.dev
- **GitHub**: (설정 후 업데이트 예정)

## 버전 정보
- **현재 버전**: v1.1
- **마지막 업데이트**: 2026-02-02
- **주요 변경사항**:
  - ✅ Google Vision API OCR 통합 완료
  - ✅ 출력일자 및 상품번호 OCR 인식 개선 (3단계 패턴 매칭)
  - ✅ Step 5 저장 문서 관리 기능 추가
  - ✅ Cloudflare KV 클라우드 백업 활성화
  - ✅ 이메일 발송 및 거래명세서 첨부 기능 완료
  - ✅ 실시간 검색 필터링 (고객명, 날짜)
  - ✅ Step 자동 이동 제거 (사용자 확인 후 수동 이동)
  - ✅ 접수/작성자 필드 단일화
  - ✅ 저장 후 자동 초기화 및 신규 접수 시작
  - ✅ Step 5 상세보기 모달 추가 (상세보기/인쇄/수정 버튼)
  - ✅ 인쇄 시 모달 배경 제거 (확인서 내용만 인쇄)
  - ✅ 고객 정보 및 설치 정보 강조 디자인 (색상 배경, 큰 폰트)

## 현재 완료된 기능

### ✅ 1단계: 거래명세서 업로드 및 OCR 인식
- 드래그 앤 드롭 파일 업로드
- 이미지 파일 선택 (JPG, PNG, GIF)
- **Google Vision API 통합** (고정밀 OCR)
- OCR 자동 인식 및 텍스트 파싱
- 고객 정보 자동 추출:
  - ✅ **출력일자** (3가지 패턴: 라벨+콜론, 라벨+날짜, 날짜만)
  - ✅ 배송번호
  - ✅ 수령자명
  - ✅ 주문자명
  - ✅ 수령자 주소
  - ✅ 수령자 연락처
  - ✅ 배송메모
  - ✅ 주문번호
  - ✅ **상품번호** (3단계 폴백: 1/1 패턴, 라벨 패턴, 단독 9자리)
  - ✅ 상품명
- **OCR 실패 시 수동 입력 폼 제공**
- 인식된 정보 수정 기능
- **OCR 완료 후 Step 1에 머물면서 결과 확인** (자동 이동 제거)

### ✅ 2단계: 제품 선택
- 브랜드별 탭 (밀워키/기아)
- 제품 패키지 카드 UI
- 실시간 제품 선택 및 표시
- 다중 제품 선택 지원
- 좌우 설치 위치 옵션 (해당 제품)

**밀워키 에디션:**
1. PV5 밀워키 워크스테이션 (₩4,850,000)
2. PV5 밀워키 스마트 에디션 (₩5,200,000)
3. PV5 밀워키 3단 부품선반 (₩1,800,000)
4. PV5 밀워키 3단 선반 (₩1,900,000)

**기아 순정형:**
1. 기아 PV5 워크스테이션 (₩4,200,000)
2. 기아 PV5 스마트 패키지 (₩4,500,000)
3. 기아 PV5 3단 부품선반 (₩1,600,000)
4. 기아 PV5 3단 선반 (₩1,700,000)

### ✅ 3단계: 설치 정보 입력
- 설치 날짜 선택
- 설치 시간 입력
- 설치 주소 입력 (OCR 데이터 자동 입력)
- 특이사항/비고 입력

### ✅ 4단계: 최종 확인 및 발송
- 고객 정보 요약 (출력일자, 상품번호 포함)
- 선택 제품 상세 정보
- 설치 정보 확인
- 자재 점검표 (체크박스)
- **접수/작성자 단일 입력 필드** (두꺼운 글씨체)
- **저장하기** 버튼 (로컬스토리지 + Cloudflare KV)
  - 저장 후 자동 초기화
  - 신규 접수 즉시 시작 가능
- PDF 다운로드 (브라우저 인쇄 기능)
- 이메일 발송 (거래명세서 이미지 첨부)

### ✅ 5단계: 저장 문서 관리
- 저장된 시공 확인서 목록 조회
- **실시간 검색 필터링**:
  - 고객명 검색 (oninput 실시간)
  - 날짜 범위 검색 (onchange 실시간)
  - 검색 초기화
- 카드형 목록 UI:
  - 수령자 이름
  - 설치 날짜
  - 저장 시간
  - 문서 ID
- 문서 관리 버튼:
  - **상세보기**: 모달로 확인서 미리보기 (고객용)
  - **수정하기**: 데이터 복원 및 Step 1로 이동
  - **삭제**: 로컬 + 클라우드에서 삭제
- **상세보기 모달**:
  - 고객 정보 강조 (파란색 배경, 큰 폰트)
  - 설치 정보 강조 (초록색 배경, 큰 폰트)
  - 제품 정보 표시
  - 자재 점검표 제외 (고객 보기용)
  - 인쇄 버튼 (모달 배경 제외, 확인서만 인쇄)
- **Cloudflare KV 클라우드 백업** (다중 기기 동기화)

## 기능 URI 요약

### API 엔드포인트
| 경로 | 메소드 | 설명 | 파라미터 |
|------|--------|------|----------|
| `/` | GET | 메인 페이지 | - |
| `/api/packages` | GET | 전체 제품 패키지 리스트 | - |
| `/api/packages/:id` | GET | 특정 제품 패키지 조회 | `id`: 패키지 ID |
| `/api/ocr` | POST | 거래명세서 OCR 분석 (Google Vision API) | `file`: 이미지 파일 |
| `/api/send-email` | POST | 이메일 발송 (Resend API) | JSON: recipientEmail, customerInfo, packages, installInfo, attachmentImage |
| `/api/reports/save` | POST | 시공 확인서 저장 (Cloudflare KV) | JSON: reportData |
| `/api/reports/list` | GET | 저장된 문서 목록 조회 | - |
| `/api/reports/:id` | GET | 특정 문서 조회 | `id`: 문서 ID |
| `/api/reports/:id` | DELETE | 특정 문서 삭제 | `id`: 문서 ID |

### 정적 리소스
| 경로 | 설명 |
|------|------|
| `/static/app.js` | 프론트엔드 JavaScript |
| `/static/styles.css` | 커스텀 스타일 |
| `/static/kvan-logo.png` | K-VAN 로고 |

## 데이터 구조

### OCR 추출 데이터
```typescript
{
  outputDate: string;           // 출력일자 (예: "2026년 01월 30일")
  deliveryNumber: string;       // 배송번호 (예: "83100276")
  receiverName: string;         // 수령자명
  ordererName: string;          // 주문자명
  receiverAddress: string;      // 수령자 주소
  receiverPhone: string;        // 수령자 연락처
  deliveryMemo: string;         // 배송메모
  orderNumber: string;          // 주문번호
  productCode: string;          // 상품번호 (예: "131432322")
  productName: string;          // 상품명
  recognitionSuccess: boolean;  // 인식 성공 여부
  ocrRawText: string;          // 원본 OCR 텍스트
}
```

### 제품 패키지 (ProductPackage)
```typescript
{
  id: string;                    // 패키지 ID
  brand: 'milwaukee' | 'kia';    // 브랜드
  name: string;                  // 제품명
  fullName: string;              // 전체 제품명
  description: string;           // 설명
  price: number;                 // 가격
  image: string;                 // 이미지 URL
  hasPositionOption: boolean;    // 좌우 위치 선택 옵션
  sections: [                    // 자재 섹션
    {
      title: string;             // 섹션명
      items: [                   // 자재 항목
        {
          name: string;          // 자재명
          quantity: number | string; // 수량
        }
      ]
    }
  ]
}
```

### 저장된 문서 (Report)
```typescript
{
  reportId: string;              // 문서 ID (REPORT-타임스탬프)
  createdAt: string;             // 생성 시간
  updatedAt: string;             // 수정 시간
  customerInfo: OCRData;         // 고객 정보
  packages: ProductPackage[];    // 선택된 제품
  installDate: string;           // 설치 날짜
  installTime: string;           // 설치 시간
  installAddress: string;        // 설치 주소
  notes: string;                 // 특이사항
  installerName: string;         // 접수/작성자
  attachmentImage: string;       // 첨부 이미지 (Base64)
  attachmentFileName: string;    // 첨부 파일명
  attachmentContentType: string; // 첨부 파일 타입
}
```

## 사용자 가이드

### 1. 거래명세서 업로드
1. 메인 페이지 접속: https://c8742ea6.webapp-6m6.pages.dev
2. 거래명세서 이미지를 드래그하거나 "파일 선택" 클릭
3. OCR 자동 인식 완료 대기 (Google Vision API)
4. **인식된 고객 정보 확인** (Step 1에 머물면서 확인)
5. 필요시 "정보 수정하기" 클릭하여 수동 입력
6. 확인 후 상단 "2. 제품 선택" 클릭하여 이동

### 2. 제품 선택
1. 브랜드 탭 선택 (밀워키/기아)
2. 원하는 제품 패키지 카드 클릭
3. 다중 선택 가능 (여러 제품 선택 시 각각 표시)
4. 좌우 위치 선택 (해당 제품의 경우)
5. "다음" 클릭

### 3. 설치 정보 입력
1. 설치 날짜 선택
2. 설치 시간 입력
3. 설치 주소 확인/수정 (OCR 데이터 자동 입력)
4. 특이사항 입력 (선택)
5. "다음" 클릭

### 4. 최종 확인 및 발송
1. 모든 정보 최종 확인:
   - 고객 정보 (출력일자, 상품번호 포함)
   - 선택 제품
   - 설치 정보
   - 자재 점검표
2. 접수/작성자 이름 입력
3. **저장하기**: 
   - 로컬 + 클라우드 저장
   - 저장 후 자동 초기화
   - 신규 접수 즉시 시작
4. **PDF 다운로드**: 브라우저 인쇄 창에서 PDF 저장
5. **이메일 발송**: 
   - 수신자 이메일 입력
   - 거래명세서 이미지 자동 첨부
   - 고객 정보 및 설치 정보 포함
6. "저장 문서 관리" 클릭하여 Step 5로 이동

### 5. 저장 문서 관리
1. 저장된 문서 목록 확인
2. **실시간 검색**:
   - 고객명 입력 시 즉시 필터링
   - 날짜 범위 선택 시 즉시 필터링
   - 검색 초기화 버튼
3. **상세보기**:
   - 카드에서 "상세보기" 클릭
   - 모달로 확인서 미리보기 (고객용)
   - 고객 정보 강조 (파란색 배경)
   - 설치 정보 강조 (초록색 배경)
   - 자재 점검표 제외
   - 인쇄 버튼으로 PDF 저장
4. **수정하기**:
   - "수정하기" 클릭
   - 데이터 자동 복원
   - Step 1로 이동하여 수정 가능
5. **문서 삭제**:
   - "삭제" 클릭
   - 로컬 + 클라우드에서 삭제

## OCR 인식 개선 사항

### 출력일자 패턴 (3가지)
1. **라벨 + 콜론**: `출력일자: 2026년 01월 30일`
2. **라벨 + 날짜**: `출력일자 2026년 01월 30일`
3. **날짜만**: `2026년 01월 30일` (라벨 없이)

### 상품번호 패턴 (3단계 폴백)
1. **패턴 1**: `1/1` 다음의 9자리 숫자
2. **패턴 2**: `상품번호:` 라벨 뒤의 8-10자리 숫자
3. **패턴 3**: 단독 9자리 숫자 (사업자번호, 배송번호 제외)

### 인식 실패 시 대응
- 자동으로 수동 입력 폼 표시
- 인식된 정보 수정 가능
- 필수 필드: 수령자명, 주소, 연락처

## 저장소 구조

### 로컬스토리지 (브라우저)
- **위치**: 브라우저 → 개발자 도구 → Application → Local Storage
- **키**: `pv5_reports`
- **특징**: 
  - 즉시 저장
  - 오프라인 지원
  - 빠른 응답
- **한계**: 
  - 같은 브라우저에서만 접근
  - 캐시 삭제 시 손실 가능

### Cloudflare KV (클라우드)
- **바인딩**: `REPORTS_KV`
- **Production ID**: `11915b46155a411aadeda7ef9c613882`
- **Preview ID**: `6501349fce6f4b3abf9e31bac903a0d8`
- **특징**:
  - 클라우드 백업
  - 다중 기기 동기화
  - 데이터 보존
  - 글로벌 분산
- **데이터 구조**:
  - Key: `REPORT-{timestamp}`
  - Value: Report JSON
  - Index: `report-index` (문서 ID 배열)

## 현재 활성화된 외부 API

### 1. Google Vision API
- **용도**: OCR (거래명세서 텍스트 추출)
- **환경 변수**: `GOOGLE_VISION_API_KEY`
- **상태**: ✅ 활성화
- **특징**: 고정밀 한국어 OCR

### 2. Resend API
- **용도**: 이메일 발송 (시공 확인서 + 거래명세서 첨부)
- **환경 변수**: `RESEND_API_KEY`
- **상태**: ✅ 활성화
- **특징**: 
  - HTML 이메일 본문
  - 이미지 첨부 (Base64)
  - 안정적인 발송

### 3. Cloudflare KV
- **용도**: 클라우드 백업 (시공 확인서 저장)
- **바인딩**: `REPORTS_KV`
- **상태**: ✅ 활성화
- **특징**: 
  - 글로벌 분산 스토리지
  - 다중 기기 동기화

## 아직 구현되지 않은 기능

### 🚧 추가 개발 필요

1. **PDF 생성 라이브러리**
   - 현재: 브라우저 인쇄 기능 사용
   - 필요: 서버 사이드 PDF 생성 (jsPDF, PDFKit 등)
   - 목적: 더 전문적인 레이아웃 및 디자인

2. **제품 이미지 업로드**
   - 현재: placeholder 이미지
   - 필요: 실제 제품 사진 업로드 및 관리
   - 저장소: Cloudflare R2 스토리지

3. **사용자 인증**
   - 담당자별 접근 권한 관리
   - 시공 이력 관리
   - 로그인/로그아웃

4. **대시보드**
   - 시공 현황 통계
   - 월별 실적 차트
   - 자재 사용량 분석

5. **알림 시스템**
   - 설치 일정 리마인더
   - 자재 부족 알림
   - 이메일/SMS 알림

## 다음 개발 단계 (권장)

### Phase 1: 핵심 기능 강화 (우선순위 높음)
1. ✅ **OCR 정확도 개선** - 완료
   - Google Vision API 통합 완료
   - 출력일자 및 상품번호 패턴 개선 완료
   - 3단계 폴백 로직 완료

2. ✅ **데이터 영속성** - 완료
   - Cloudflare KV 클라우드 백업 완료
   - 로컬스토리지 하이브리드 저장 완료
   - 문서 저장/불러오기/삭제 완료

3. ✅ **이메일 발송** - 완료
   - Resend API 통합 완료
   - 거래명세서 이미지 첨부 완료
   - HTML 이메일 템플릿 완료

4. **제품 이미지 관리** - 대기
   - Cloudflare R2 스토리지 활용
   - 실제 제품 사진 업로드 및 표시

### Phase 2: 사용성 개선 (우선순위 중간)
5. **PDF 생성 개선** - 대기
   - 서버 사이드 PDF 생성
   - 전문적인 레이아웃 및 디자인

6. **모바일 최적화** - 대기
   - 반응형 디자인 개선
   - 터치 인터페이스 최적화

### Phase 3: 고급 기능 (우선순위 낮음)
7. **대시보드 추가** - 대기
   - 시공 현황 통계
   - 월별 실적 차트

8. **알림 시스템** - 대기
   - 설치 일정 리마인더
   - 자재 부족 알림

9. **사용자 인증** - 대기
   - 담당자별 접근 권한
   - 시공 이력 관리

## 기술 스택
- **프론트엔드**: HTML, TailwindCSS (CDN), JavaScript
- **백엔드**: Hono Framework (TypeScript)
- **런타임**: Cloudflare Workers/Pages
- **OCR**: Google Vision API
- **이메일**: Resend API
- **저장소**: Cloudflare KV
- **라이브러리**:
  - Axios (HTTP 클라이언트)
  - Font Awesome (아이콘)
  - Tailwind CSS (스타일링)

## 배포 상태
- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 프로덕션 배포 완료
- **최신 URL**: https://c8742ea6.webapp-6m6.pages.dev
- **프로젝트명**: `webapp`
- **마지막 배포**: 2026-02-02

## 개발 환경 설정

### 필수 환경 변수
```bash
# .dev.vars 파일 (로컬 개발용)
GOOGLE_VISION_API_KEY=your_google_vision_api_key
RESEND_API_KEY=your_resend_api_key
```

### 로컬 개발
```bash
# 의존성 설치
cd /home/user/webapp && npm install

# 빌드
cd /home/user/webapp && npm run build

# 샌드박스에서 개발 서버 시작 (PM2)
cd /home/user/webapp && pm2 start ecosystem.config.cjs

# 로컬 머신에서 개발 서버 시작 (Vite)
cd /home/user/webapp && npm run dev

# 서비스 테스트
curl http://localhost:3000

# 로그 확인
pm2 logs --nostream
```

### 배포
```bash
# 1. Cloudflare API 키 설정 (최초 1회)
# setup_cloudflare_api_key 도구 호출

# 2. 빌드
cd /home/user/webapp && npm run build

# 3. Cloudflare Pages 배포
cd /home/user/webapp && npx wrangler pages deploy dist --project-name=webapp

# 4. 환경 변수 설정 (프로덕션)
npx wrangler pages secret put GOOGLE_VISION_API_KEY --project-name=webapp
npx wrangler pages secret put RESEND_API_KEY --project-name=webapp

# 5. 배포 확인
curl https://c8742ea6.webapp-6m6.pages.dev
```

### Git 관리
```bash
# 초기화
cd /home/user/webapp && git init
cd /home/user/webapp && git add .
cd /home/user/webapp && git commit -m "Initial commit"

# 변경사항 커밋
cd /home/user/webapp && git add .
cd /home/user/webapp && git commit -m "커밋 메시지"

# GitHub 푸시 (setup_github_environment 이후)
cd /home/user/webapp && git remote add origin https://github.com/username/repo.git
cd /home/user/webapp && git push -f origin main
```

## 최근 업데이트 내역

### 2026-02-02 (v1.1) - 최신
- ✅ 저장 후 자동 초기화 및 신규 접수 시작 기능 추가
- ✅ Step 5 "불러오기" → "수정하기" 텍스트 변경
- ✅ Step 5 상세보기 모달 추가
  - 고객 정보 및 설치 정보 강조 (색상 배경, 큰 폰트)
  - 자재 점검표 제외 (고객 보기용)
  - 인쇄 버튼 추가
- ✅ 인쇄 시 모달 배경 완전히 제거
  - HTML 인라인 스타일에 print CSS 추가
  - `body > *:not(#previewModal)` 규칙으로 배경 숨김
  - 확인서 내용만 깔끔하게 인쇄
- ✅ 고객 정보 및 설치 정보 강조 디자인
  - 고객 정보: 파란색 배경 (`bg-blue-50`)
  - 설치 정보: 초록색 배경 (`bg-green-50`)
  - 중요 정보 큰 폰트 (`text-lg font-bold`)
  - 흰색 카드 형태로 필드 구분
  - 제목 이모지 추가 (👤 📅)

### 2026-02-02 (v1.0)
- ✅ 출력일자 및 상품번호 OCR 인식 개선 (3단계 패턴 매칭)
- ✅ Step 4 미리보기에 출력일자 및 상품번호 표시
- ✅ Step 자동 이동 제거 (사용자가 OCR 결과 확인 후 수동 이동)
- ✅ Step 5 클릭 활성화 (저장 문서 관리 직접 접근)
- ✅ Step 5 색상 표시 수정 (활성화 시 파란색, 완료 시 초록색)
- ✅ 접수/작성자 필드 단일화 (두꺼운 글씨체)
- ✅ 실시간 검색 필터링 (고객명 oninput, 날짜 onchange)
- ✅ Cloudflare KV 클라우드 백업 활성화
- ✅ 이메일 발송 시 거래명세서 이미지 첨부
- ✅ 디버깅 로그 개선 (출력일자/상품번호 추적)

### 2025-01-31 (v0.2)
- ✅ Cloudflare Workers AI 통합
- ✅ 파일 업로드 기능 개선
- ✅ 수동 입력 옵션 추가
- ✅ OCR 실패 시 자동 폴백

## 문의 및 지원
- **개발자**: 사인마스터 AI 팀
- **용도**: PV5 간판/시공 관리 시스템
- **이메일**: (추가 예정)
- **프로덕션 URL**: https://c8742ea6.webapp-6m6.pages.dev

---

**Note**: 이 시스템은 v1.1 버전으로, 핵심 기능이 완료되었으며 지속적인 개선이 예정되어 있습니다.
