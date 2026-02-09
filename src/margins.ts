// 제품별 매출 (지사 마진) 매핑 데이터
export const productMargins: { [key: string]: number } = {
  // 밀워키 에디션
  'milwaukee-workstation': 1214120,      // PV5 밀워키 워크스테이션
  'milwaukee-smart': 1153320,            // PV5 밀워키 스마트 에디션
  'milwaukee-3shelf-parts': 106920,      // 밀워키 3단 부품선반
  'milwaukee-3shelf-standard': 422700,   // 밀워키 3단 선반
  'milwaukee-2shelf-partition': 251900,  // 밀워키 격벽 2단선반
  'milwaukee-partition-panel': 213620,   // 밀워키 격벽타공판
  'milwaukee-floor-board': 265100,       // 차바닥 (적재함)
  
  // 기아 순정형
  'kia-workstation': 908200,             // 기아 PV5 워크스테이션
  'kia-smart': 865300,                   // 기아 PV5 스마트 패키지
  'kia-3shelf-parts': 218900,            // KIA 3단 선반 (부품선반)
  'kia-3shelf-standard': 218900,         // KIA 3단 선반
  'kia-2shelf-partition': 210100,        // KIA 격벽 2단선반
  'kia-partition-panel': 171200,         // KIA 격벽타공판
  'kia-floor-board': 265100,             // 차바닥 (적재함)
};

// 제품별 마진율
export const productMarginRates: { [key: string]: number } = {
  'milwaukee-workstation': 25.0,
  'milwaukee-smart': 25.7,
  'milwaukee-3shelf-parts': 11.0,
  'milwaukee-3shelf-standard': 23.1,
  'milwaukee-2shelf-partition': 20.8,
  'milwaukee-partition-panel': 22.1,
  'milwaukee-floor-board': 26.8,
  'kia-workstation': 26.8,
  'kia-smart': 24.0,
  'kia-3shelf-parts': 18.1,
  'kia-3shelf-standard': 18.1,
  'kia-2shelf-partition': 17.4,
  'kia-partition-panel': 19.5,
  'kia-floor-board': 26.8,
};

// 제품 ID로 매출 조회
export function getProductMargin(productId: string): number {
  return productMargins[productId] || 0;
}

// 제품 ID로 마진율 조회
export function getProductMarginRate(productId: string): number {
  return productMarginRates[productId] || 0;
}

// 여러 제품의 총 매출 계산
export function calculateTotalMargin(productIds: string[]): number {
  return productIds.reduce((total, id) => total + getProductMargin(id), 0);
}
