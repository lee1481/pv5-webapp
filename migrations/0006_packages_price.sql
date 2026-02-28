-- 제품 가격 관리 테이블 (본사 전용 가격 수정)
CREATE TABLE IF NOT EXISTS packages_price (
  package_id TEXT PRIMARY KEY,
  package_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  updated_by TEXT DEFAULT 'system',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 초기 가격 데이터 삽입 (packages.ts 기준값)
INSERT OR IGNORE INTO packages_price (package_id, package_name, price) VALUES
  ('milwaukee-workstation',   'PV5 밀워키 워크스테이션',    4850000),
  ('milwaukee-smart',         'PV5 밀워키 스마트 에디션',    4490000),
  ('milwaukee-3shelf-parts',  'PV5 밀워키 3단 부품선반',     968000),
  ('milwaukee-3shelf-standard','PV5 밀워키 3단 선반',        1830000),
  ('milwaukee-2shelf-partition','PV5 밀워키 격벽 2단선반',   1500000),
  ('milwaukee-partition-panel','PV5 밀워키 격벽타공판',      1200000),
  ('milwaukee-floor-board',   'PV5 밀워키 차바닥',           800000),
  ('kia-workstation',         '기아 PV5 워크스테이션',       3390000),
  ('kia-smart',               '기아 PV5 스마트 패키지',      3600000),
  ('kia-3shelf-parts',        '기아 PV5 3단 부품선반',       880000),
  ('kia-3shelf-standard',     '기아 PV5 3단 선반',           1210000),
  ('kia-2shelf-partition',    '기아 PV5 격벽 2단선반',       1400000),
  ('kia-partition-panel',     '기아 PV5 격벽타공판',         1100000),
  ('kia-floor-board',         '기아 PV5 차바닥',             800000);
