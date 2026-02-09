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
  - **시공 완료 처리 및 매출 관리** (NEW v2.1)
  - PDF 다운로드 (인쇄 기능)
  - 이메일 발송 (거래명세서 이미지 첨부)
  - Excel 데이터 내보내기/가져오기
  - JPG 이미지 저장

## URLs
- **Production**: https://pv5-webapp.pages.dev
- **GitHub**: (설정 후 업데이트 예정)

## 버전 정보
- **현재 버전**: v2.2
- **마지막 업데이트**: 2026-02-09
- **주요 변경사항**:
  - ✅ **D1 마이그레이션 자동 실행 기능** (NEW)
    - Step 6에서 "자동 마이그레이션 실행" 버튼 클릭으로 즉시 마이그레이션
    - 수동 Cloudflare Dashboard 접속 불필요
    - 마이그레이션 완료 후 자동으로 alert 숨김
  - ✅ **Step 6: 매출 관리 기능 완성**
    - 시공 완료 처리 버튼 오류 수정
    - 매출 통계 대시보드 (총 매출, 건수, 평균 매출)
    - 기간별 검색 (주간/월간/분기/사용자 지정)
    - 제품별 매출 자동 계산 (소비자 가격 × 마진율)
    - Excel 다운로드
  - ✅ **Cloudflare D1 Database 통합** (SQLite 기반 관계형 데이터베이스)
  - ✅ **Cloudflare R2 Storage 통합** (이미지 파일 저장)
  - ✅ **서버 우선 저장 로직** (D1 + R2 → localStorage 캐시)
  - ✅ **데이터 저장 오류 해결** (SQL 인젝션 방지 + 특수문자 처리)
  - ✅ **무제한 용량** (클라우드 저장소 활용)
  - ✅ **다중 사용자 지원** (중앙 데이터베이스)
  - ✅ Excel 내보내기/가져오기 기능
  - ✅ JPG 이미지 저장 기능
  - ✅ 3단 선반 설치 위치 표시 기능

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
- **3단 선반 설치 위치 옵션** (좌측/우측/양측)

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
- 설치 시간 입력 (오전/오후 + 시간/분 선택)
- 직접 입력 기능 (커스텀 시간)
- 설치 주소 입력 (OCR 데이터 자동 입력)
- 고객 주소 복사 기능
- 특이사항/비고 입력

### ✅ 4단계: 최종 확인 및 발송
- 고객 정보 요약 (출력일자, 상품번호 포함)
- 선택 제품 상세 정보
- **3단 선반 설치 위치 배지 표시** (좌측/우측/양측)
- 설치 정보 확인
- 자재 점검표 (체크박스)
- **시공자 이름 입력** (단일 입력 필드)
- **저장하기** 버튼:
  - ✅ **Cloudflare D1 Database 저장** (관계형 데이터베이스)
  - ✅ **Cloudflare R2 Storage 저장** (이미지 파일)
  - ✅ localStorage 캐시 (오프라인 지원)
  - ✅ 저장 후 자동 초기화
  - ✅ 신규 접수 즉시 시작 가능
- PDF 다운로드 (브라우저 인쇄 기능)
- 이메일 발송 (거래명세서 이미지 첨부)

### ✅ 5단계: 저장 문서 관리
- **Cloudflare D1 Database 조회** (중앙 데이터베이스)
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
  - **3단 선반 설치 위치 배지** (목록 카드)
- 문서 관리 버튼:
  - **상세보기**: 모달로 확인서 미리보기 (고객용)
    - **3단 선반 설치 위치 표시** (미리보기 모달)
  - **JPG 저장**: 확인서를 JPG 이미지로 다운로드
  - **수정하기**: 데이터 복원 및 Step 1로 이동
  - **시공 완료** (NEW): 시공 완료로 표시 → Step 6 매출 관리로 이동
  - **삭제**: D1 + localStorage에서 삭제
- **Excel 내보내기**: 
  - 전체 데이터를 Excel 파일로 내보내기
  - 고객 정보, 제품 정보, 설치 정보 포함
  - 날짜별 정렬
- **Excel 가져오기**:
  - Excel 파일에서 데이터 일괄 가져오기
  - 자동 데이터 변환 및 저장
- **데이터 초기화**: 
  - 모든 저장된 문서 삭제
  - D1 + localStorage 완전 초기화

### ✅ 6단계: 매출 관리 (NEW v2.1)
- **시공 완료된 문서만 조회**
- **매출 통계 대시보드**:
  - 총 매출액 (지사 마진 합계)
  - 총 소비자 가격
  - 시공 건수
- **기간별 검색 필터**:
  - 이번 주 (월~일)
  - 이번 달
  - 이번 분기 (Q1, Q2, Q3, Q4)
  - 사용자 지정 (시작일~종료일)
  - 고객명 검색
- **매출 목록 테이블**:
  - 시공 날짜
  - 고객명
  - 제품명 (전체 제품 목록)
  - 소비자 가격 (합계)
  - 매출 (지사 마진 합계)
  - 마진율 (%)
  - 시공자명
- **제품별 매출 자동 계산**:
  - 밀워키 격벽타공판: ₩968,000 → 매출 ₩213,620 (22.1%)
  - 밀워키 격벽 2단선반: ₩1,210,000 → 매출 ₩251,900 (20.8%)
  - 밀워키 3단 선반: ₩1,830,000 → 매출 ₩422,700 (23.1%)
  - 밀워키 워크스페이스: ₩2,230,000 → 매출 ₩483,500 (21.7%)
  - 밀워키 3단 부품선반: ₩968,000 → 매출 ₩106,920 (11.0%)
  - KIA 격벽타공판: ₩880,000 → 매출 ₩171,200 (19.5%)
  - KIA 격벽 2단 선반: ₩1,210,000 → 매출 ₩210,100 (17.4%)
  - KIA 3단 선반: ₩1,210,000 → 매출 ₩218,900 (18.1%)
  - KIA 워크스페이스: ₩1,760,000 → 매출 ₩412,500 (23.4%)
  - 차바닥 (적재함): ₩990,000 → 매출 ₩265,100 (26.8%)
  - **세트 - PV5 밀워키 워크스테이션**: ₩4,850,000 → 매출 ₩1,214,120 (25.0%)
  - **세트 - PV5 밀워키 스마트 에디션**: ₩4,490,000 → 매출 ₩1,153,320 (25.7%)
  - **세트 - 기아 PV5 워크스테이션**: ₩3,390,000 → 매출 ₩908,200 (26.8%)
  - **세트 - 기아 PV5 스마트 패키지**: ₩3,600,000 → 매출 ₩865,300 (24.0%)
- **Excel 다운로드**: `PV5_매출관리_YYYY-MM-DD.xlsx`

## 기능 URI 요약

### API 엔드포인트
| 경로 | 메소드 | 설명 | 파라미터 |
|------|--------|------|----------|
| `/` | GET | 메인 페이지 | - |
| `/api/packages` | GET | 전체 제품 패키지 리스트 | - |
| `/api/packages/:id` | GET | 특정 제품 패키지 조회 | `id`: 패키지 ID |
| `/api/ocr` | POST | 거래명세서 OCR 분석 (Google Vision API) | `file`: 이미지 파일 |
| `/api/send-email` | POST | 이메일 발송 (Resend API) | JSON: recipientEmail, customerInfo, packages, installInfo, attachmentImage |
| `/api/reports/save` | POST | 시공 확인서 저장 (D1 + R2 + localStorage) | JSON: reportData (이미지 자동 R2 저장) |
| `/api/reports/list` | GET | 저장된 문서 목록 조회 (D1) | - |
| `/api/reports/:id` | GET | 특정 문서 조회 (D1) | `id`: 문서 ID |
| `/api/reports/:id` | DELETE | 특정 문서 삭제 (D1) | `id`: 문서 ID |
| `/api/reports/:id/complete` | PATCH | 시공 완료 처리 (NEW) | `id`: 문서 ID |
| `/api/reports/completed/list` | GET | 시공 완료 문서 조회 (매출 관리용, NEW) | - |
| `/api/reports/stats` | GET | 매출 통계 조회 (NEW) | Query: startDate, endDate |

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
  hasPositionOption: boolean;    // 3단 선반 위치 선택 옵션
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
  packagePositions: {            // 3단 선반 설치 위치
    [packageId: string]: 'left' | 'right' | 'both';
  };
  installDate: string;           // 설치 날짜
  installTime: string;           // 설치 시간
  installAddress: string;        // 설치 주소
  notes: string;                 // 특이사항
  installerName: string;         // 시공자 이름
  imageKey: string;              // R2 이미지 키
  imageFilename: string;         // 이미지 파일명
}
```

## 사용자 가이드

### 1. 거래명세서 업로드
1. 메인 페이지 접속: https://pv5-webapp.pages.dev
2. 거래명세서 이미지를 드래그하거나 "파일 선택" 클릭
3. OCR 자동 인식 완료 대기 (Google Vision API)
4. **인식된 고객 정보 확인** (Step 1에 머물면서 확인)
5. 필요시 "정보 수정하기" 클릭하여 수동 입력
6. 확인 후 상단 "2. 제품 선택" 클릭하여 이동

### 2. 제품 선택
1. 브랜드 탭 선택 (밀워키/기아)
2. 원하는 제품 패키지 카드 클릭
3. 다중 선택 가능 (여러 제품 선택 시 각각 표시)
4. **3단 선반 위치 선택** (좌측/우측/양측)
5. "다음" 클릭

### 3. 설치 정보 입력
1. 설치 날짜 선택
2. 설치 시간 선택 (오전/오후 + 시/분 버튼 선택)
3. 또는 "직접 입력" 버튼으로 커스텀 시간 입력
4. 설치 주소 확인/수정 (OCR 데이터 자동 입력)
5. "고객 주소 복사" 버튼으로 빠른 입력
6. 특이사항 입력 (선택)
7. "다음" 클릭

### 4. 최종 확인 및 발송
1. 모든 정보 최종 확인:
   - 고객 정보 (출력일자, 상품번호 포함)
   - 선택 제품 (3단 선반 위치 배지 표시)
   - 설치 정보
   - 자재 점검표
2. 시공자 이름 입력
3. **저장하기**: 
   - D1 Database + R2 Storage + localStorage 저장
   - 저장 후 자동 초기화
   - 신규 접수 즉시 시작
4. **PDF 다운로드**: 브라우저 인쇄 창에서 PDF 저장
5. **이메일 발송**: 
   - 수신자 이메일 입력
   - 거래명세서 이미지 자동 첨부
   - 고객 정보 및 설치 정보 포함
6. "저장 문서 관리" 클릭하여 Step 5로 이동

### 5. 저장 문서 관리
1. 저장된 문서 목록 확인 (D1 Database 조회)
2. **실시간 검색**:
   - 고객명 입력 시 즉시 필터링
   - 날짜 범위 선택 시 즉시 필터링
   - 검색 초기화 버튼
3. **상세보기**:
   - 카드에서 "상세보기" 클릭
   - 모달로 확인서 미리보기 (고객용)
   - 고객 정보 강조 (파란색 배경)
   - 설치 정보 강조 (초록색 배경)
   - **3단 선반 설치 위치 배지** (색상 구분)
   - 인쇄 버튼으로 PDF 저장
4. **JPG 저장**:
   - "JPG 저장" 클릭
   - 확인서를 JPG 이미지로 다운로드
   - 파일명: `PV5_시공확인서_{고객명}_{날짜}.jpg`
5. **Excel 내보내기**:
   - "Excel 내보내기" 클릭
   - 전체 데이터를 Excel 파일로 다운로드
   - 파일명: `PV5_시공확인서_목록_{날짜}.xlsx`
6. **Excel 가져오기**:
   - "데이터 가져오기" 클릭
   - Excel 파일 선택
   - 자동 데이터 변환 및 저장
7. **수정하기**:
   - "수정하기" 클릭
   - 데이터 자동 복원
   - Step 1로 이동하여 수정 가능
8. **문서 삭제**:
   - "삭제" 클릭
   - D1 + localStorage에서 삭제
9. **데이터 초기화**:
   - "데이터 초기화" 클릭
   - 확인 후 전체 데이터 삭제

## 저장소 아키텍처

### 1. Cloudflare D1 Database (Primary)
- **타입**: SQLite 기반 관계형 데이터베이스
- **바인딩**: `DB`
- **Database**: `pv5-reports-db`
- **특징**:
  - ✅ 관계형 데이터 구조
  - ✅ SQL 쿼리 지원
  - ✅ 트랜잭션 지원
  - ✅ 무제한 용량
  - ✅ 다중 사용자 지원
  - ✅ 글로벌 분산
- **테이블 구조**:
  ```sql
  CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT UNIQUE NOT NULL,
    customer_info TEXT,              -- JSON
    packages TEXT,                   -- JSON
    package_positions TEXT,          -- JSON (3단 선반 위치)
    install_date TEXT,
    install_time TEXT,
    install_address TEXT,
    notes TEXT,
    installer_name TEXT,
    image_key TEXT,                  -- R2 이미지 키
    image_filename TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  ```

### 2. Cloudflare R2 Storage (Images)
- **타입**: S3 호환 객체 스토리지
- **바인딩**: `R2`
- **Bucket**: `pv5-images`
- **특징**:
  - ✅ 무제한 용량
  - ✅ 이미지 파일 저장
  - ✅ 빠른 접근 속도
  - ✅ 글로벌 CDN
- **저장 경로**: `images/{timestamp}-{reportId}-{filename}`

### 3. localStorage (Cache)
- **위치**: 브라우저 → 개발자 도구 → Application → Local Storage
- **키**: `pv5_reports`
- **특징**: 
  - ✅ 즉시 저장
  - ✅ 오프라인 지원
  - ✅ 빠른 응답
  - ⚠️ 캐시 용도로만 사용 (Primary는 D1)

### 4. Cloudflare KV (Legacy - 참고용)
- **바인딩**: `REPORTS_KV`
- **상태**: ⚠️ 비활성 (D1으로 마이그레이션 완료)
- **참고**: 이전 버전 호환성 유지

## 저장 로직

### 서버 우선 저장 (D1 + R2 → localStorage)
```
1. 사용자가 "저장하기" 클릭
2. 첨부 이미지가 있으면 R2 Storage에 저장
3. D1 Database에 문서 정보 저장 (이미지 키 포함)
4. localStorage에 캐시 (빠른 로컬 접근용)
5. 성공 메시지 표시
6. 자동 초기화
```

### SQL 안전성 보장
- ✅ **특수문자 제거**: reportId에서 `/`, `\`, `?` 등 제거
- ✅ **파라미터 바인딩**: SQL 인젝션 방지
- ✅ **Prepared Statement**: D1 prepare() 사용
- ✅ **에러 핸들링**: 상세 로깅 및 폴백

## 현재 활성화된 외부 API

### 1. Google Vision API
- **용도**: OCR (거래명세서 텍스트 추출)
- **환경 변수**: `GOOGLE_VISION_API_KEY`
- **상태**: ✅ 활성화
- **API 키**: AIzaSyBHiHgtP9f0gjWJOe97ezxd6N5Qc4OgNgk
- **특징**: 고정밀 한국어 OCR

### 2. Resend API
- **용도**: 이메일 발송 (시공 확인서 + 거래명세서 첨부)
- **환경 변수**: `RESEND_API_KEY`
- **상태**: ✅ 활성화
- **특징**: 
  - HTML 이메일 본문
  - 이미지 첨부 (Base64)
  - 안정적인 발송

### 3. Cloudflare Services
- **D1 Database**: ✅ 활성화 (pv5-reports-db)
- **R2 Storage**: ✅ 활성화 (pv5-images)
- **KV Namespace**: ⚠️ 비활성 (레거시 참고용)
- **Workers AI**: ✅ 바인딩 설정됨

## 아직 구현되지 않은 기능

### 🚧 추가 개발 필요

1. **제품 이미지 업로드**
   - 현재: placeholder 이미지
   - 필요: 실제 제품 사진 업로드 및 관리
   - 저장소: Cloudflare R2 스토리지 (이미 설정됨)

2. **사용자 인증**
   - 담당자별 접근 권한 관리
   - 시공 이력 관리
   - 로그인/로그아웃

3. **대시보드**
   - 시공 현황 통계
   - 월별 실적 차트
   - 자재 사용량 분석

4. **알림 시스템**
   - 설치 일정 리마인더
   - 자재 부족 알림
   - 이메일/SMS 알림

## 다음 개발 단계 (권장)

### Phase 1: 핵심 기능 강화 (완료)
1. ✅ **OCR 정확도 개선** - 완료
2. ✅ **데이터 영속성** - 완료 (D1 + R2 + localStorage)
3. ✅ **이메일 발송** - 완료
4. ✅ **무제한 저장 용량** - 완료 (D1 + R2)
5. ✅ **다중 사용자 지원** - 완료 (중앙 데이터베이스)
6. ✅ **Excel 내보내기/가져오기** - 완료
7. ✅ **JPG 저장** - 완료
8. ✅ **3단 선반 위치 표시** - 완료

### Phase 2: 사용성 개선 (대기)
1. **제품 이미지 관리** - 대기
   - R2 스토리지 활용 (이미 설정됨)
   - 실제 제품 사진 업로드 및 표시

2. **모바일 최적화** - 대기
   - 반응형 디자인 개선
   - 터치 인터페이스 최적화

### Phase 3: 고급 기능 (대기)
3. **대시보드 추가** - 대기
   - 시공 현황 통계
   - 월별 실적 차트

4. **알림 시스템** - 대기
   - 설치 일정 리마인더
   - 자재 부족 알림

5. **사용자 인증** - 대기
   - 담당자별 접근 권한
   - 시공 이력 관리

## 기술 스택
- **프론트엔드**: HTML, TailwindCSS (CDN), JavaScript
- **백엔드**: Hono Framework (TypeScript)
- **런타임**: Cloudflare Workers/Pages
- **데이터베이스**: Cloudflare D1 (SQLite)
- **파일 저장소**: Cloudflare R2 (S3 호환)
- **OCR**: Google Vision API
- **이메일**: Resend API
- **라이브러리**:
  - Axios (HTTP 클라이언트)
  - Font Awesome (아이콘)
  - Tailwind CSS (스타일링)
  - SheetJS (Excel 처리)
  - html2canvas (JPG 저장)

## 배포 상태
- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 프로덕션 배포 완료
- **최신 URL**: https://pv5-webapp.pages.dev
- **프로젝트명**: `pv5-webapp`
- **마지막 배포**: 2026-02-09

## 개발 환경 설정

### 필수 환경 변수
```bash
# .dev.vars 파일 (로컬 개발용)
GOOGLE_VISION_API_KEY=AIzaSyBHiHgtP9f0gjWJOe97ezxd6N5Qc4OgNgk
RESEND_API_KEY=your_resend_api_key
```

### 로컬 개발
```bash
# 의존성 설치
cd /home/user/webapp && npm install

# 빌드
cd /home/user/webapp && npm run build

# 로컬 D1 마이그레이션 적용
cd /home/user/webapp && npm run db:migrate:local

# 로컬 개발 서버 시작 (D1 --local 모드)
cd /home/user/webapp && npm run dev:d1

# 또는 PM2로 시작
cd /home/user/webapp && pm2 start ecosystem.config.cjs

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

# 3. Production D1 마이그레이션 적용 (최초 1회 또는 스키마 변경 시)
cd /home/user/webapp && npm run db:migrate:prod

# 4. Cloudflare Pages 배포
cd /home/user/webapp && npm run deploy:prod

# 5. 환경 변수 설정 (최초 1회)
# Cloudflare Dashboard → pv5-webapp → Settings → Environment variables
# GOOGLE_VISION_API_KEY: AIzaSyBHiHgtP9f0gjWJOe97ezxd6N5Qc4OgNgk

# 6. 바인딩 확인
# Cloudflare Dashboard → pv5-webapp → Settings → Bindings
# - D1 database: DB → pv5-reports-db
# - R2 bucket: R2 → pv5-images
# - KV namespace: REPORTS_KV (레거시)

# 7. 배포 확인
curl https://pv5-webapp.pages.dev
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

### 2026-02-09 (v2.0) - 최신 🚀
- ✅ **Cloudflare D1 Database 통합** (SQLite 기반 관계형 데이터베이스)
- ✅ **Cloudflare R2 Storage 통합** (이미지 파일 저장)
- ✅ **서버 우선 저장 로직** (D1 + R2 → localStorage 캐시)
- ✅ **데이터 저장 오류 해결**:
  - SQL 인젝션 방지
  - reportId 특수문자 제거 (`/`, `\`, `?` 등)
  - Prepared Statement 사용
  - 상세 에러 로깅
- ✅ **무제한 용량** (클라우드 저장소 활용)
- ✅ **다중 사용자 지원** (중앙 데이터베이스)
- ✅ **Production 환경 바인딩 설정 완료**:
  - D1 database: `DB` → `pv5-reports-db`
  - R2 bucket: `R2` → `pv5-images`
  - KV namespace: `REPORTS_KV` (레거시)
- ✅ **Google Vision API 재활성화**
  - API 키: AIzaSyBHiHgtP9f0gjWJOe97ezxd6N5Qc4OgNgk
  - 환경 변수 설정 완료
- ✅ **저장 기능 정상 작동 확인**

### 2026-02-07 (v1.2)
- ✅ Excel 내보내기/가져오기 기능
- ✅ JPG 이미지 저장 기능
- ✅ 3단 선반 설치 위치 표시 (좌측/우측/양측)
- ✅ localStorage 용량 초과 처리 개선
- ✅ 시간 선택 UI 개선 (오전/오후 + 시/분 버튼)
- ✅ 직접 입력 기능 추가

### 2026-02-02 (v1.1)
- ✅ 저장 후 자동 초기화 및 신규 접수 시작 기능 추가
- ✅ Step 5 상세보기 모달 추가
- ✅ 인쇄 시 모달 배경 완전히 제거
- ✅ 고객 정보 및 설치 정보 강조 디자인

### 2026-02-02 (v1.0)
- ✅ 출력일자 및 상품번호 OCR 인식 개선 (3단계 패턴 매칭)
- ✅ Step 자동 이동 제거 (사용자가 OCR 결과 확인 후 수동 이동)
- ✅ 실시간 검색 필터링 (고객명, 날짜)
- ✅ Cloudflare KV 클라우드 백업 활성화

## 매출 관리 기능 활성화 방법 (v2.2+)

**✅ 간편 방법**: Step 6 매출 관리 기능을 사용하려면 **앱 내에서 자동 마이그레이션 실행**을 권장합니다!

### 방법 1: 자동 마이그레이션 실행 (가장 간편! 권장)
1. https://pv5-webapp.pages.dev 접속
2. **Step 6 (매출 관리)** 탭 클릭
3. 노란색 경고 박스에서 **"자동 마이그레이션 실행"** 버튼 클릭
4. 확인 대화상자에서 **"확인"** 클릭
5. ✅ 완료! 마이그레이션 경고 자동 숨김

**장점**: 
- ✅ Cloudflare Dashboard 접속 불필요
- ✅ SQL 명령 입력 불필요
- ✅ 클릭 한 번으로 즉시 완료
- ✅ 마이그레이션 완료 후 자동으로 alert 숨김

### 방법 2: Cloudflare Dashboard (수동)
1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. **Workers & Pages** → **D1 databases** → **pv5-reports-db** 선택
3. **Console** 탭 클릭
4. 다음 SQL 명령 실행:
   ```sql
   ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed'));
   ```
5. **Execute** 버튼 클릭

### 방법 3: Wrangler CLI (개발자용)
```bash
# Production 데이터베이스에 적용
npx wrangler d1 migrations apply pv5-reports-db --remote

# 또는 직접 SQL 실행
npx wrangler d1 execute pv5-reports-db --command="ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed'));" --remote
```

### 마이그레이션 확인
- ✅ **앱에서 확인**: Step 6 (매출 관리) 탭 클릭 시 노란색 경고 박스가 표시되지 않으면 성공
- ✅ **CLI 확인**: 
  ```bash
  # 테이블 구조 확인
  npx wrangler d1 execute pv5-reports-db --command="PRAGMA table_info(reports);" --remote
  ```

## 문의 및 지원
- **개발자**: 사인마스터 AI 팀
- **용도**: PV5 간판/시공 관리 시스템
- **프로덕션 URL**: https://pv5-webapp.pages.dev

---

**Note**: 이 시스템은 v2.0 버전으로, Cloudflare D1 Database와 R2 Storage를 활용한 무제한 용량 지원 및 다중 사용자 환경을 제공합니다. 핵심 기능이 완료되었으며 지속적인 개선이 예정되어 있습니다.
