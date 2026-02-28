-- 본사 전용 커스텀 제품 관리 테이블
CREATE TABLE IF NOT EXISTS custom_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id TEXT UNIQUE NOT NULL,       -- 고유 ID (예: kia-workspace)
  brand TEXT NOT NULL,                   -- 'milwaukee' or 'kia'
  name TEXT NOT NULL,                    -- 짧은 이름 (예: PV5 기아 워크스페이스)
  full_name TEXT NOT NULL,               -- 전체 이름
  description TEXT DEFAULT '',           -- 구성 설명
  price INTEGER NOT NULL DEFAULT 0,      -- 소비자가
  image_url TEXT DEFAULT '',             -- 제품 이미지 URL
  is_active INTEGER DEFAULT 1,           -- 1: 활성(지사에 표시), 0: 비활성(숨김)
  created_by TEXT DEFAULT 'system',
  updated_by TEXT DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 워크스페이스 2개 초기 데이터
INSERT OR IGNORE INTO custom_packages
  (package_id, brand, name, full_name, description, price, image_url)
VALUES
  ('kia-workspace', 'kia',
   'PV5 기아 워크스페이스',
   'PV5 기아 순정형 워크스페이스',
   '격벽타공판 + 워크스페이스 (기아 순정형)',
   1760000,
   '/static/images/kia-workspace.jpg'),
  ('milwaukee-workspace', 'milwaukee',
   'PV5 밀워키 워크스페이스',
   'PV5 기아 밀워키 워크스페이스',
   '격벽타공판 + 워크스페이스 (밀워키 에디션)',
   2230000,
   '/static/images/milwaukee-workspace.jpg');
