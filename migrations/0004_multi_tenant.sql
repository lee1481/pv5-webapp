-- 지사 테이블
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('head', 'branch')),
  branch_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 본사 접수 테이블
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id TEXT UNIQUE NOT NULL,
  
  -- 고객 정보 (본사 입력)
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  
  -- 할당 정보
  branch_id INTEGER NOT NULL,
  assigned_by INTEGER,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 상태
  status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned', 'in_progress', 'completed')),
  
  -- 연결된 보고서
  report_id TEXT,
  
  -- 메모
  notes TEXT,
  
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- 기존 reports 테이블에 컬럼 추가
ALTER TABLE reports ADD COLUMN branch_id INTEGER;
ALTER TABLE reports ADD COLUMN assignment_id TEXT;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_assignments_branch ON assignments(branch_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_reports_branch ON reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_reports_assignment ON reports(assignment_id);

-- 초기 데이터 (테스트용)
INSERT OR IGNORE INTO branches (id, name, code) VALUES 
  (1, '서울지사', 'seoul'),
  (2, '경북지사', 'gyeongbuk'),
  (3, '호남지사', 'honam'),
  (4, '경남지사', 'gyeongnam'),
  (5, '충청지사', 'chungcheong'),
  (6, '강원지사', 'gangwon');

-- 초기 사용자 (테스트용)
-- 비밀번호: admin1234 (실제로는 해시 필요)
INSERT OR IGNORE INTO users (id, username, password, role, branch_id) VALUES 
  (1, 'head', 'admin1234', 'head', NULL),
  (2, 'seoul', 'seoul1234', 'branch', 1),
  (3, 'gyeongbuk', 'gyeongbuk1234', 'branch', 2),
  (4, 'honam', 'honam1234', 'branch', 3);
