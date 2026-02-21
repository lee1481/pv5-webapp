// 비밀번호 해시 생성 스크립트
const bcrypt = require('bcryptjs');

const users = [
  { username: 'admin', password: 'admin2026!', role: 'admin', branch_id: null, branch_name: '본사' },
  { username: 'seoul', password: 'seoul2026!', role: 'branch', branch_id: 1, branch_name: '서울지사' },
  { username: 'gyeongbuk', password: 'gyeongbuk2026!', role: 'branch', branch_id: 2, branch_name: '경북지사' },
  { username: 'honam', password: 'honam2026!', role: 'branch', branch_id: 3, branch_name: '호남지사' },
  { username: 'gyeongnam', password: 'gyeongnam2026!', role: 'branch', branch_id: 4, branch_name: '경남지사' },
  { username: 'jeju', password: 'jeju2026!', role: 'branch', branch_id: 5, branch_name: '제주지사' },
  { username: 'daejeon', password: 'daejeon2026!', role: 'branch', branch_id: 6, branch_name: '대전지사' }
];

async function generateHashes() {
  console.log('-- 초기 사용자 데이터 (비밀번호 해시)');
  console.log('-- 마이그레이션 파일에 추가하세요\n');
  
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    const branchIdValue = user.branch_id === null ? 'NULL' : user.branch_id;
    console.log(`INSERT INTO users (username, password, role, branch_id, branch_name) VALUES ('${user.username}', '${hash}', '${user.role}', ${branchIdValue}, '${user.branch_name}');`);
  }
  
  console.log('\n-- 테스트 계정 정보:');
  users.forEach(u => {
    console.log(`-- ${u.username} / ${u.password} (${u.branch_name})`);
  });
}

generateHashes();
