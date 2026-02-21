-- 초기 사용자 데이터 (비밀번호 해시)
-- 기존 테스트 사용자 삭제 후 재생성

DELETE FROM users WHERE id IN (1, 2, 3, 4);

-- 본사 관리자 및 지사 계정 생성 (bcrypt 해시)
INSERT INTO users (id, username, password, role, branch_id) VALUES (1, 'admin', '$2b$10$NiSPqjEzNDruyHdsGw5MGup3.VaRgTV5a0ukvRo45fTBpK0T5DrpG', 'head', NULL);
INSERT INTO users (username, password, role, branch_id) VALUES ('seoul', '$2b$10$JjHLu3nRF.fzFKctoSAs/ueGNJYTE8/pVIUzlRTLr/fV88tBwDuvO', 'branch', 1);
INSERT INTO users (username, password, role, branch_id) VALUES ('gyeongbuk', '$2b$10$1ae7frpaucH63C/mL1wfpuuklwfz4uYlbE0HNuKuViphbwjD0dHLe', 'branch', 2);
INSERT INTO users (username, password, role, branch_id) VALUES ('honam', '$2b$10$NIVx6VMy9ZpXNOHK265z.Og9dc8PFu4FzXyS1v7AU3yHZTaky8Rsi', 'branch', 3);
INSERT INTO users (username, password, role, branch_id) VALUES ('gyeongnam', '$2b$10$O4VoNbBS0qltuSeIe2Jw.e2jwT3EQQjpeedZK5ZGVe/QHb/aDu5Y6', 'branch', 4);
INSERT INTO users (username, password, role, branch_id) VALUES ('jeju', '$2b$10$7bA8Niw1/wd1hapE0AEPbORCWTf3vSzvvzjbteOaQcfsYoRWOAscq', 'branch', 5);
INSERT INTO users (username, password, role, branch_id) VALUES ('daejeon', '$2b$10$k7OtFbCWv76Mlz.LZwkM5u/1v942VI6AmcA90Pu3XLEDxbv8aB4KC', 'branch', 6);

-- 테스트 계정 정보:
-- admin / admin2026! (본사)
-- seoul / seoul2026! (서울지사)
-- gyeongbuk / gyeongbuk2026! (경북지사)
-- honam / honam2026! (호남지사)
-- gyeongnam / gyeongnam2026! (경남지사)
-- jeju / jeju2026! (제주지사)
-- daejeon / daejeon2026! (대전지사)
