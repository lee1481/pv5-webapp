-- PV5 시공 확인서 테이블
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT UNIQUE NOT NULL,
  
  -- 고객 정보 (JSON)
  customer_info TEXT,
  
  -- 제품 정보 (JSON array)
  packages TEXT,
  
  -- 3단 선반 설치 위치 (JSON)
  package_positions TEXT,
  
  -- 설치 정보
  install_date TEXT,
  install_time TEXT,
  install_address TEXT,
  notes TEXT,
  
  -- 작성자
  installer_name TEXT,
  
  -- 첨부 이미지 (R2 key)
  image_key TEXT,
  image_filename TEXT,
  
  -- 타임스탬프
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_report_id ON reports(report_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_installer_name ON reports(installer_name);

-- 고객명으로 검색하기 위한 가상 컬럼 (JSON 추출)
CREATE INDEX IF NOT EXISTS idx_customer_name ON reports(json_extract(customer_info, '$.receiverName'));
