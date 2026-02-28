// ── axios 전역 인증 헤더 자동 설정 (DOMContentLoaded에서 처리) ──────────────

// 전역 상태 관리
let currentStep = 1;
let selectedPackages = [];
let allPackages = [];
let packagePositions = {};
let currentReportId = null;
let allReports = [];
let uploadedImageFile = null;

let currentAssignments = [];
let selectedAssignment = null; // 현재 선택된 접수 건

// ── 악세사리 전역 상태 ──────────────────────────────────────────────────────
let selectedAccessories = {}; // { 'rubber-strap': 2, 'hook-s': 1, 'hook-l': 3 }

// 악세사리 마스터 데이터
const ACCESSORIES = [
  {
    id: 'rubber-strap',
    name: '고무스트랩',
    unit: '1m',
    unitLabel: 'm',
    consumerPrice: 20000,   // 소비자가 1m당 2만원
    costPrice: 8000,        // 원가 (10m=80,000 → 1m=8,000)
    minQty: 1,
    maxQty: 50,
    description: '1m 단위 판매 · 소비자가 ₩20,000/m'
  },
  {
    id: 'hook-s',
    name: '후크걸이(소)',
    unit: '1세트(5EA)',
    unitLabel: '세트',
    consumerPrice: 20000,   // 소비자가 1세트(5개) = 2만원
    costPrice: 10000,       // 원가 1세트 = 10,000
    minQty: 1,
    maxQty: 20,
    description: '1세트 = 5EA · 소비자가 ₩20,000/세트'
  },
  {
    id: 'hook-l',
    name: '후크걸이(대)',
    unit: '1세트(5EA)',
    unitLabel: '세트',
    consumerPrice: 25000,   // 소비자가 1세트(5개) = 2만 5천원
    costPrice: 10000,       // 원가 1세트 = 10,000
    minQty: 1,
    maxQty: 20,
    description: '1세트 = 5EA · 소비자가 ₩25,000/세트'
  }
];


// 본사가 특정 지사를 대리 접속할 때 URL에서 branchId 읽기
// 예: /ocr?viewBranchId=3  → 서울/경북지사 데이터만 표시
const _urlParams = new URLSearchParams(window.location.search);
const viewBranchId = _urlParams.get('viewBranchId'); // null 이면 대리 접속 아님

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  // 로그인 토큰 없으면 로그인 페이지로
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/static/login';
    return;
  }
  // axios 헤더 재설정 (토큰 보장)
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // 헤더 유저 정보 + 로그아웃 버튼 렌더링
  try {
    const userStr = localStorage.getItem('user');
    const userObj = userStr ? JSON.parse(userStr) : {};
    const displayName = (userObj.branchName || '') + (userObj.username ? ' - ' + userObj.username : '');
    const headerArea = document.getElementById('headerUserArea');
    if (headerArea) {
      const isHQ = (userObj.role === 'head');
      const isMobile = window.innerWidth < 768;
      headerArea.innerHTML = `
        <div style="display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:16px;background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.15);">
          <i class="fas fa-user-circle" style="color:#6366f1;font-size:0.9rem;"></i>
          <span style="color:#4f46e5;font-size:${isMobile?'0.7rem':'0.8rem'};font-weight:600;max-width:${isMobile?'70px':'none'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayName}</span>
        </div>
        ${isHQ ? `
        <button id="headerHomeBtn"
          onclick="window.location.href='/static/launcher'"
          style="display:flex;align-items:center;gap:4px;padding:5px ${isMobile?'10px':'14px'};border-radius:16px;font-size:${isMobile?'0.72rem':'0.8rem'};font-weight:600;color:#6366f1;background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.2);cursor:pointer;transition:all 0.2s;"
          onmouseover="this.style.background='rgba(99,102,241,0.16)';this.style.borderColor='rgba(99,102,241,0.4)'"
          onmouseout="this.style.background='rgba(99,102,241,0.07)';this.style.borderColor='rgba(99,102,241,0.2)'">
          <i class="fas fa-home"></i>${isMobile?'':' 홈'}
        </button>` : ''}
        <button id="headerLogoutBtn"
          style="display:flex;align-items:center;gap:4px;padding:5px ${isMobile?'10px':'14px'};border-radius:16px;font-size:${isMobile?'0.72rem':'0.8rem'};font-weight:600;color:#ef4444;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.2);cursor:pointer;transition:all 0.2s;"
          onmouseover="this.style.background='rgba(239,68,68,0.14)';this.style.borderColor='rgba(239,68,68,0.4)'"
          onmouseout="this.style.background='rgba(239,68,68,0.07)';this.style.borderColor='rgba(239,68,68,0.2)'">
          <i class="fas fa-sign-out-alt"></i>${isMobile?'':' 로그아웃'}
        </button>`;
      document.getElementById('headerLogoutBtn').addEventListener('click', async () => {
        try { await axios.post('/api/auth/logout'); } catch(e) {}
        localStorage.removeItem('pv5_reports');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/static/login';
      });
    }
  } catch(e) { console.warn('Header user render error:', e); }

  await loadPackages();
  setupStepNavigation();
  updateStepIndicator();

  // 지사 계정이면 데이터 가져오기 + 데이터 초기화 버튼 숨김
  try {
    const _userObj = JSON.parse(localStorage.getItem('user') || '{}');
    if (_userObj.role === 'branch') {
      const _btnImport = document.getElementById('btnImportData');
      const _btnReset = document.getElementById('btnResetData');
      if (_btnImport) _btnImport.style.display = 'none';
      if (_btnReset) _btnReset.style.display = 'none';
    }
  } catch(e) {}

  // 1단계: 토큰 기반으로 해당 지사 배정 목록만 렌더링
  await renderStep1AssignmentList();
});

// ═══════════════════════════════════════════════════════════════
// STEP 1 — 배정 목록 렌더링
// ★ localStorage의 user를 믿지 않고, 서버 verify로 role을 직접 확인
// ═══════════════════════════════════════════════════════════════
async function renderStep1AssignmentList() {
  const container = document.getElementById('upload-section');
  if (!container) return;

  // 토큰 확인
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/static/login';
    return;
  }
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // 로딩 표시
  container.innerHTML = `
    <div class="text-center py-12 text-gray-400">
      <i class="fas fa-spinner fa-spin text-4xl mb-3 block"></i>
      <p>배정 목록을 불러오는 중...</p>
    </div>`;

  try {
    // ★ 핵심: 서버에서 토큰을 직접 검증하여 실제 role/branchId 확인
    //   localStorage.user는 이전 세션 데이터일 수 있으므로 절대 신뢰하지 않음
    const verifyRes = await axios.get('/api/auth/verify');
    if (!verifyRes.data.success) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/static/login';
      return;
    }

    // 서버에서 확인된 실제 사용자 정보로 localStorage 갱신
    const serverUser = verifyRes.data.user;
    localStorage.setItem('user', JSON.stringify(serverUser));
    console.log('[접수목록] 서버 검증 role:', serverUser.role, '| branchId:', serverUser.branchId);

    // 서버 검증된 role 기준으로 판단
    // 본사가 특정 지사를 대리 접속(viewBranchId 있음): 해당 지사 배정 목록 표시
    // 본사가 직접 접속(viewBranchId 없음): 본사 안내 메시지
    if (serverUser.role === 'head' && !viewBranchId) {
      container.innerHTML = `
        <div class="text-center py-16 text-gray-400">
          <i class="fas fa-building text-6xl mb-4 block text-blue-300"></i>
          <p class="text-lg font-semibold text-gray-700">본사 관리자 계정입니다</p>
          <p class="text-sm mt-2">본사 접수 관리는 <a href="/static/hq" class="text-blue-600 underline font-semibold">본사 관리 시스템</a>을 이용해주세요.</p>
        </div>`;
      return;
    }

    // 지사 계정 또는 본사 대리 접속: 해당 지사 배정 목록 조회
    // 본사 대리 접속 시 branchId 파라미터 전달
    const assignmentsUrl = (serverUser.role === 'head' && viewBranchId)
      ? `/api/assignments?branchId=${viewBranchId}`
      : '/api/assignments/my';
    const res = await axios.get(assignmentsUrl);
    console.log('[접수목록] API 응답:', res.data.assignments?.length, '건');
    if (!res.data.success) throw new Error(res.data.error || 'API 실패');

    currentAssignments = res.data.assignments || [];
    renderAssignmentCards(container, currentAssignments);

  } catch(e) {
    console.error('renderStep1 error:', e);
    if (e.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/static/login';
      return;
    }
    container.innerHTML = `
      <div class="text-center py-12 text-red-400">
        <i class="fas fa-exclamation-circle text-4xl mb-3 block"></i>
        <p>배정 목록을 불러오지 못했습니다.</p>
        <p class="text-sm mt-1 text-gray-400">${e.message || ''}</p>
        <button onclick="renderStep1AssignmentList()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">다시 시도</button>
      </div>`;
  }
}

function renderAssignmentCards(container, list) {
  const statusLabel = { assigned:'접수됨', in_progress:'진행 중', completed:'완료' };
  const statusStyle = {
    assigned:    'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed:   'bg-green-100 text-green-700'
  };

  // 헤더
  const token = localStorage.getItem('token');
  let branchName = '';
  try { branchName = JSON.parse(localStorage.getItem('user') || '{}').branchName || ''; } catch(e) {}

  // ★ pending: 아직 report 작업 미시작인 건만 (assigned만)
  //   in_progress/adjusting/confirmed/inst_confirmed → 5단계에 저장됨 → 1단계 대기에서 숨김
  // ★ completed: 시공 완료 건만 하단에 표시
  const pending   = list.filter(a => a.status === 'assigned');
  const inProgress = list.filter(a => ['adjusting','in_progress','confirmed','inst_confirmed'].includes(a.status));
  const completed = list.filter(a => a.status === 'completed');

  if (pending.length === 0 && inProgress.length === 0 && completed.length === 0) {
    container.innerHTML = `
      <div class="text-center py-16 text-gray-400">
        <i class="fas fa-inbox text-6xl mb-4 block"></i>
        <p class="text-lg font-semibold">배정된 접수 건이 없습니다</p>
        <p class="text-sm mt-1">본사에서 접수를 등록하면 여기에 표시됩니다.</p>
      </div>`;
    return;
  }

  const makeCard = (a) => {
    const isDone = a.status === 'completed';
    const btnHtml = isDone
      ? `<span class="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-semibold"><i class="fas fa-check mr-1"></i>완료됨</span>`
      : `<button onclick="startAssignment('${a.assignment_id}')" 
               class="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm">
           <i class="fas fa-play mr-1.5"></i>${a.status === 'in_progress' ? '이어하기' : '시작하기'}
         </button>`;

    return `
      <div class="border ${isDone ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-blue-200 bg-white hover:shadow-md'} rounded-xl p-5 transition">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span class="font-bold text-gray-800 text-lg">${a.customer_name}</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyle[a.status] || 'bg-gray-100 text-gray-600'}">
                ${statusLabel[a.status] || a.status}
              </span>
            </div>
            <div class="space-y-1 text-sm text-gray-600">
              <div><i class="fas fa-phone w-4 mr-1.5 text-gray-400"></i>${a.customer_phone || '-'}</div>
              <div><i class="fas fa-map-marker-alt w-4 mr-1.5 text-gray-400"></i>${a.customer_address || '-'}</div>
              ${a.product_name ? `<div><i class="fas fa-box w-4 mr-1.5 text-gray-400"></i>${a.product_name}</div>` : ''}
              ${a.notes ? `<div><i class="fas fa-sticky-note w-4 mr-1.5 text-gray-400"></i>${a.notes}</div>` : ''}
            </div>
          </div>
          <div class="flex flex-col items-end gap-2 shrink-0">
            <span class="text-xs text-gray-400">${a.order_date || (a.assigned_at||'').split('T')[0] || ''}</span>
            ${btnHtml}
          </div>
        </div>
      </div>`;
  };

  container.innerHTML = `
    <div class="mb-4 flex items-center justify-between gap-2 flex-wrap">
      <div class="flex items-center gap-2 flex-wrap">
        <i class="fas fa-clipboard-list text-blue-500" style="font-size:1.1rem;"></i>
        <span class="font-bold text-gray-700" style="font-size:1rem;white-space:nowrap;">배정된 접수 목록</span>
        <span class="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-semibold" style="white-space:nowrap;">${pending.length}건 대기</span>
      </div>
      <button onclick="renderStep1AssignmentList()" class="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-blue-300 transition" style="white-space:nowrap;">
        <i class="fas fa-sync-alt"></i> 새로고침
      </button>
    </div>
    <div class="space-y-3">
      ${pending.length === 0 ? '<p class="text-sm text-gray-400 py-2"><i class="fas fa-check-circle mr-1 text-green-400"></i>대기 중인 접수가 없습니다.</p>' : pending.map(makeCard).join('')}
      ${inProgress.length > 0 ? `
        <details class="mt-4" open>
          <summary class="cursor-pointer text-sm text-indigo-500 font-semibold hover:text-indigo-700 select-none py-1">
            <i class="fas fa-spinner mr-1"></i>진행 중인 건 ${inProgress.length}건 (이어하기로 계속 진행)
          </summary>
          <div class="space-y-3 mt-3">${inProgress.map(makeCard).join('')}</div>
        </details>` : ''}
      ${completed.length > 0 ? `
        <details class="mt-4">
          <summary class="cursor-pointer text-sm text-gray-400 hover:text-gray-600 select-none py-1">
            <i class="fas fa-chevron-right mr-1"></i>완료된 건 ${completed.length}건 보기
          </summary>
          <div class="space-y-3 mt-3">${completed.map(makeCard).join('')}</div>
        </details>` : ''}
    </div>`;
}

// 시작하기 버튼 → 2단계로 이동 + 고객 정보 자동 채우기
async function startAssignment(assignmentId) {
  const a = currentAssignments.find(x => x.assignment_id === assignmentId);
  if (!a) return;

  selectedAssignment = a;

  // 접수 카드 클릭 시 상태는 변경하지 않음
  // (상태 변경은 지사 저장/확정/완료 액션에서만 서버가 자동 처리)
  console.log('[startAssignment] assignment selected:', assignmentId, 'current status:', a.status);

  // 3단계 고객정보 자동 채우기
  setTimeout(() => {
    const nameEl    = document.getElementById('customerName');
    const phoneEl   = document.getElementById('customerPhone');
    const addressEl = document.getElementById('installAddress');
    if (nameEl)    nameEl.value    = a.customer_name    || '';
    if (phoneEl)   phoneEl.value   = a.customer_phone   || '';
    if (addressEl) addressEl.value = a.customer_address || '';
  }, 300);

  // 2단계로 이동
  currentStep = 2;
  updateStepIndicator();
  showCurrentSection();
  setTimeout(() => {
    if (allPackages.length === 0) loadPackages().then(() => showBrand('milwaukee'));
    else showBrand('milwaukee');
  }, 200);
}

// 단계 네비게이션 설정
function setupStepNavigation() {
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`step${i}`);
    if (el) { el.style.cursor = 'pointer'; el.addEventListener('click', () => goToStep(i)); }
  }
}

// 특정 단계로 이동
function goToStep(step) {
  if (step < currentStep) {
    // 1단계로 돌아갈 때 목록 새로고침
    if (step === 1) renderStep1AssignmentList();
    currentStep = step;
    updateStepIndicator();
    showCurrentSection();
    if (step === 2) setTimeout(() => showBrand('milwaukee'), 200);
    return;
  }
  if (step === currentStep) return;

  if (step === 2) {
    if (!selectedAssignment && !currentReportId) { alert('접수 목록에서 항목을 선택해주세요.'); return; }
    currentStep = 2; updateStepIndicator(); showCurrentSection();
    setTimeout(() => {
      if (allPackages.length === 0) loadPackages().then(() => showBrand('milwaukee'));
      else showBrand('milwaukee');
    }, 200);
  } else if (step === 3) {
    if (!selectedAssignment && !currentReportId) { alert('접수 목록에서 항목을 선택해주세요.'); return; }
    if (selectedPackages.length === 0) { alert('제품을 선택해주세요.'); return; }
    currentStep = 3; updateStepIndicator(); showCurrentSection();
    // 주소 자동 채우기
    if (selectedAssignment?.customer_address) {
      const el = document.getElementById('installAddress');
      if (el && !el.value) el.value = selectedAssignment.customer_address;
    }
  } else if (step === 4) {
    if (selectedPackages.length === 0) { alert('제품을 선택해주세요.'); return; }
    const installDate = document.getElementById('installDate')?.value;
    if (!installDate) { alert('설치 날짜를 입력해주세요.'); return; }
    currentStep = 4; updateStepIndicator(); showCurrentSection();
    displayFinalPreview();
  } else if (step === 5 || step === 6) {
    currentStep = step; updateStepIndicator(); showCurrentSection();
  }
}

// 제품 패키지 로드
async function loadPackages() {
  try {
    // 1. 패키지 기본 정보 로드
    const response = await axios.get('/api/packages');
    allPackages = response.data.packages;
    console.log('Loaded packages:', allPackages.length);

    // 2. DB 가격 조회 후 병합 (본사 설정 가격 우선 적용)
    try {
      const priceRes = await axios.get('/api/packages/prices');
      if (priceRes.data.success && priceRes.data.prices && priceRes.data.prices.length > 0) {
        const priceMap = {};
        priceRes.data.prices.forEach(p => { priceMap[p.package_id] = p.price; });
        allPackages = allPackages.map(pkg => {
          if (priceMap[pkg.id] !== undefined) {
            return { ...pkg, price: priceMap[pkg.id] };
          }
          return pkg;
        });
        console.log('DB 가격 적용 완료');
      }
    } catch (priceErr) {
      console.warn('DB 가격 조회 실패, 기본 가격 사용:', priceErr.message);
    }
  } catch (error) {
    console.error('Failed to load packages:', error);
    alert('제품 정보를 불러오는데 실패했습니다.');
  }
}

// ── OCR 관련 함수 제거됨 (본사 → 지사 직접 배정 방식으로 변경) ──────────────

// 파일 업로드 설정 (미사용 - 하위 호환 유지용 stub)
function setupFileUpload() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  if (!fileInput || !dropZone) {
    console.error('File input or drop zone not found');
    return;
  }

  // 기존 이벤트 리스너 제거 (중복 방지)
  const newFileInput = fileInput.cloneNode(true);
  fileInput.parentNode.replaceChild(newFileInput, fileInput);

  // 파일 선택 이벤트
  newFileInput.addEventListener('change', function(e) {
    console.log('File input changed', e.target.files);
    handleFileSelect(e);
  });

  // 드래그 앤 드롭 이벤트
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('bg-blue-50');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('bg-blue-50');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('bg-blue-50');
    
    const files = e.dataTransfer.files;
    console.log('Files dropped:', files.length);
    if (files.length > 0) {
      const fileInputElement = document.getElementById('fileInput');
      // Create a new FileList-like object
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      fileInputElement.files = dt.files;
      handleFileSelect({ target: fileInputElement });
    }
  });
  
  // 드롭존 클릭 시 파일 선택 대화상자 열기
  dropZone.addEventListener('click', (e) => {
    // 버튼 클릭은 제외
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I') {
      document.getElementById('fileInput').click();
    }
  });
}

// 파일 선택 처리
async function handleFileSelect(event) {
  const file = event.target.files[0];
  console.log('handleFileSelect called, file:', file);
  
  if (!file) {
    console.log('No file selected');
    return;
  }
  
  // 업로드된 파일을 전역 변수에 저장 (이메일 첨부용)
  uploadedImageFile = file;
  console.log('Image file saved for email attachment:', file.name);

  // 파일 타입 확인
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드 가능합니다.');
    return;
  }

  console.log('Processing file:', file.name, file.type, file.size);

  // 로딩 표시
  const dropZone = document.getElementById('dropZone');
  dropZone.innerHTML = `
    <div class="text-center">
      <i class="fas fa-spinner fa-spin text-6xl text-blue-600 mb-4"></i>
      <p class="text-lg text-gray-600">거래명세서 분석 중...</p>
      <p class="text-sm text-gray-500 mt-2">${file.name}</p>
    </div>
  `;

  try {
    // OCR 처리
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Sending OCR request to /api/ocr...');
    console.log('File details:', { name: file.name, type: file.type, size: file.size });

    const response = await axios.post('/api/ocr', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000, // 60초 타임아웃 (OCR 처리 시간 고려)
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log('Upload progress:', percentCompleted + '%');
      }
    });

    console.log('OCR response received:', response.data);
    console.log('Response status:', response.status);
    console.log('Success flag:', response.data.success);
    console.log('Recognition success:', response.data.data?.recognitionSuccess);

    // 응답이 없거나 형식이 잘못된 경우
    if (!response.data || !response.data.data) {
      console.error('Invalid response format:', response.data);
      throw new Error('OCR 서버 응답 형식이 올바르지 않습니다.');
    }

    // OCR 인식 성공 여부 확인
    if (response.data.success === false || !response.data.data.recognitionSuccess) {
      console.warn('OCR recognition failed:', response.data.message || 'No message');
      console.warn('Raw OCR text:', response.data.data.ocrRawText);
      
      // 인식 실패 시 수동 입력 유도
      dropZone.innerHTML = `
        <div class="text-center">
          <i class="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
          <p class="text-lg text-gray-800 mb-2 font-bold">자동 인식 실패</p>
          <p class="text-sm text-gray-600 mb-4">${response.data.message || '이미지에서 정보를 추출할 수 없습니다.'}<br>수동으로 입력해주세요.</p>
          <button onclick="showManualInputForm()" 
                  class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-keyboard mr-2"></i>수동 입력하기
          </button>
          <button onclick="resetUpload()" 
                  class="ml-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
            <i class="fas fa-redo mr-2"></i>다시 업로드
          </button>
        </div>
      `;
      return;
    }

    console.log('OCR success! Extracted data:', response.data.data);
    ocrData = response.data.data;
    
    // 로딩 화면 제거 및 원래 업로드 영역 복원
    dropZone.innerHTML = `
      <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
      <p class="text-lg text-gray-600 mb-4">거래명세서 이미지를 드래그하거나 클릭하여 업로드</p>
      <input type="file" id="fileInput" accept="image/*" class="hidden">
      <div class="flex justify-center space-x-3">
        <button onclick="document.getElementById('fileInput').click(); event.stopPropagation();" 
                class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-folder-open mr-2"></i>파일 선택
        </button>
        <button onclick="showManualInputForm(); event.stopPropagation();" 
                class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
          <i class="fas fa-keyboard mr-2"></i>수동 입력
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-4">지원 형식: JPG, PNG, GIF (최대 10MB)</p>
    `;
    
    // OCR 결과 표시
    displayOCRResult(ocrData);
    
    console.log('OCR results displayed. User can manually proceed to step 2.');
    // 사용자가 직접 Step 2를 클릭하여 이동하도록 자동 이동 제거
    
  } catch (error) {
    console.error('OCR Error occurred:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      // 서버가 응답했지만 오류 상태 코드
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // 요청이 전송되었지만 응답을 받지 못함
      console.error('No response received. Request:', error.request);
      console.error('This might be a network or CORS issue');
    } else {
      // 요청 설정 중 오류 발생
      console.error('Error setting up request:', error.message);
    }
    
    let errorMessage = '거래명세서 자동 인식에 실패했습니다.';
    let errorDetail = '수동으로 입력해주세요.';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = '요청 시간이 초과되었습니다.';
      errorDetail = '이미지 크기가 너무 크거나 네트워크가 느립니다. 다시 시도하거나 수동으로 입력해주세요.';
    } else if (error.response?.status === 500) {
      errorMessage = '서버 오류가 발생했습니다.';
      errorDetail = 'OCR 처리 중 문제가 발생했습니다. 잠시 후 다시 시도하거나 수동으로 입력해주세요.';
    } else if (error.response?.status === 400) {
      errorMessage = '잘못된 요청입니다.';
      errorDetail = '올바른 이미지 파일을 선택해주세요.';
    } else if (!error.response && error.request) {
      errorMessage = '서버에 연결할 수 없습니다.';
      errorDetail = '네트워크 연결을 확인하거나 수동으로 입력해주세요.';
    }
    
    // OCR 실패 시 수동 입력 폼 표시
    dropZone.innerHTML = `
      <div class="text-center">
        <i class="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
        <p class="text-lg text-gray-800 mb-2 font-bold">${errorMessage}</p>
        <p class="text-sm text-gray-600 mb-4">${errorDetail}</p>
        <button onclick="showManualInputForm()" 
                class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition mr-2">
            <i class="fas fa-keyboard mr-2"></i>수동 입력
        </button>
        <button onclick="resetUpload()" 
                class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
            <i class="fas fa-redo mr-2"></i>다시 시도
        </button>
      </div>
    `;
  }
}

// 업로드 초기화
function resetUpload() {
  location.reload();
}

// OCR 결과 표시
function displayOCRResult(data) {
  const uploadResult = document.getElementById('uploadResult');
  const ocrDataDiv = document.getElementById('ocrData');
  
  if (!uploadResult || !ocrDataDiv) {
    console.error('uploadResult or ocrData element not found');
    return;
  }
  
  // 전역 ocrData 업데이트 - 수동 입력 폼에서 사용
  ocrData = data;
  console.log('Global ocrData updated:', ocrData);
  
  // OCR 실패 체크
  const hasFailure = !data.receiverName || !data.receiverPhone || !data.receiverAddress;
  
  ocrDataDiv.innerHTML = `
    <div class="grid grid-cols-2 gap-2 text-sm">
      <div><strong>출력일자:</strong> ${data.outputDate || '-'}</div>
      <div><strong>배송번호:</strong> ${data.deliveryNumber || '-'}</div>
      <div><strong>수령자명:</strong> ${data.receiverName || '-'}</div>
      <div><strong>주문자명:</strong> ${data.ordererName || '-'}</div>
      <div class="col-span-2"><strong>수령자 주소:</strong> ${data.receiverAddress || '-'}</div>
      <div><strong>수령자 연락처:</strong> ${data.receiverPhone || '-'}</div>
      <div><strong>배송메모:</strong> ${data.deliveryMemo || '-'}</div>
      <div class="col-span-2 border-t pt-2 mt-2">
        <div><strong>주문번호:</strong> ${data.orderNumber || '-'}</div>
        <div><strong>상품번호:</strong> ${data.productCode || '-'}</div>
        <div><strong>상품명:</strong> ${data.productName || '-'}</div>
      </div>
    </div>
    ${hasFailure ? `
      <div class="mt-4">
        <button onclick="showManualInputForm()" 
                class="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition">
          <i class="fas fa-edit mr-2"></i>정보 수정하기
        </button>
      </div>
    ` : ''}
  `;
  
  uploadResult.classList.remove('hidden');
  uploadResult.style.display = 'block';
  
  console.log('OCR result displayed:', data);
  
  // 제품명 기반 자동 선택을 위한 매칭
  if (data.productName && data.productName !== '(인식 실패)') {
    const matchedPackage = allPackages.find(pkg => 
      data.productName.includes(pkg.name) || 
      data.productName.includes(pkg.fullName)
    );
    
    if (matchedPackage) {
      selectedPackage = matchedPackage;
      console.log('Auto-matched package:', matchedPackage.name);
    }
  }
}

// 수동 입력 폼 표시
function showManualInputForm() {
  const uploadSection = document.getElementById('upload-section');
  const existingForm = document.getElementById('manualInputForm');
  
  // 기존 폼이 있으면 제거
  if (existingForm) {
    existingForm.remove();
  }
  
  // 수동 입력 폼 생성
  const formHTML = `
    <div id="manualInputForm" class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6">
      <h3 class="text-xl font-bold mb-4 text-gray-800">
        <i class="fas fa-keyboard text-blue-600 mr-2"></i>
        거래명세서 정보 수동 입력
      </h3>
      
      <!-- 수령자 정보 섹션 -->
      <div class="mb-6">
        <h4 class="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">수령자 정보</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">출력일자</label>
            <input type="text" id="manual_outputDate" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="2026년 01월 30일">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">배송번호</label>
            <input type="text" id="manual_deliveryNumber" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="83100276">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">수령자명 *</label>
            <input type="text" id="manual_receiverName" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="이승현">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">주문자명</label>
            <input type="text" id="manual_ordererName" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="이승현">
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-gray-700 mb-2">수령자 주소 *</label>
            <input type="text" id="manual_receiverAddress" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="(18021) 경기도 평택시 고덕면 도시지원1길 52...">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">수령자 연락처 *</label>
            <input type="tel" id="manual_receiverPhone" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="010-2966-7497">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">배송메모</label>
            <input type="text" id="manual_deliveryMemo" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="부재 시 문앞">
          </div>
        </div>
      </div>
      
      <!-- 상품 정보 섹션 -->
      <div class="mb-6">
        <h4 class="text-lg font-semibold mb-3 text-gray-700 border-b pb-2">상품 정보</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">주문번호</label>
            <input type="text" id="manual_orderNumber" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="202601300939047917">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">상품번호</label>
            <input type="text" id="manual_productCode" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="131432322">
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-gray-700 mb-2">상품명</label>
            <input type="text" id="manual_productName" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="PV5 카고 밀워키 워크스테이션">
          </div>
        </div>
      </div>
      
      <div class="mt-6 flex justify-end space-x-3">
        <button onclick="cancelManualInput()" 
                class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <i class="fas fa-times mr-2"></i>취소
        </button>
        <button onclick="submitManualInput()" 
                class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          <i class="fas fa-check mr-2"></i>확인
        </button>
      </div>
    </div>
  `;
  
  uploadSection.insertAdjacentHTML('beforeend', formHTML);
  
  // OCR 데이터가 있으면 폼 필드에 자동으로 채우기
  if (ocrData) {
    console.log('Filling form with OCR data:', ocrData);
    console.log('outputDate:', ocrData.outputDate);
    console.log('productCode:', ocrData.productCode);
    
    // DOM이 완전히 렌더링된 후 값을 채우기 위해 setTimeout 사용
    setTimeout(() => {
      // 각 필드에 값 설정
      const fields = {
        'manual_outputDate': ocrData.outputDate,
        'manual_deliveryNumber': ocrData.deliveryNumber,
        'manual_receiverName': ocrData.receiverName,
        'manual_ordererName': ocrData.ordererName,
        'manual_receiverAddress': ocrData.receiverAddress,
        'manual_receiverPhone': ocrData.receiverPhone,
        'manual_deliveryMemo': ocrData.deliveryMemo,
        'manual_orderNumber': ocrData.orderNumber,
        'manual_productCode': ocrData.productCode,
        'manual_productName': ocrData.productName
      };
      
      // 각 필드에 값 채우기
      for (const [fieldId, value] of Object.entries(fields)) {
        const element = document.getElementById(fieldId);
        if (element) {
          // 값이 있으면 설정, 없으면 빈 문자열로 설정 (placeholder 제거)
          element.value = value || '';
          if (value) {
            console.log(`✅ Filled ${fieldId} with:`, value);
          } else {
            console.warn(`⚠️ No value for ${fieldId}, setting empty string`);
          }
        } else {
          console.error(`❌ Element not found: ${fieldId}`);
        }
      }
    }, 100); // 100ms 후 실행
  }
}

// 수동 입력 취소
function cancelManualInput() {
  const form = document.getElementById('manualInputForm');
  if (form) form.remove();
}

// 수동 입력 제출
function submitManualInput() {
  const outputDate = document.getElementById('manual_outputDate').value.trim();
  const deliveryNumber = document.getElementById('manual_deliveryNumber').value.trim();
  const receiverName = document.getElementById('manual_receiverName').value.trim();
  const ordererName = document.getElementById('manual_ordererName').value.trim();
  const receiverAddress = document.getElementById('manual_receiverAddress').value.trim();
  const receiverPhone = document.getElementById('manual_receiverPhone').value.trim();
  const deliveryMemo = document.getElementById('manual_deliveryMemo').value.trim();
  const orderNumber = document.getElementById('manual_orderNumber').value.trim();
  const productCode = document.getElementById('manual_productCode').value.trim();
  const productName = document.getElementById('manual_productName').value.trim();
  
  // 필수 입력 검증
  if (!receiverName || !receiverPhone || !receiverAddress) {
    alert('수령자명, 수령자 연락처, 수령자 주소는 필수 입력 항목입니다.');
    return;
  }
  
  // ocrData 업데이트
  ocrData = {
    outputDate,
    deliveryNumber,
    receiverName,
    ordererName,
    receiverAddress,
    receiverPhone,
    deliveryMemo,
    orderNumber,
    productCode,
    productName
  };
  
  // OCR 결과 표시 업데이트
  displayOCRResult(ocrData);
  
  // 수동 입력 폼 제거
  cancelManualInput();
  
  // 성공 메시지
  const uploadResult = document.getElementById('uploadResult');
  uploadResult.classList.remove('bg-green-50', 'border-green-200');
  uploadResult.classList.add('bg-blue-50', 'border-blue-200');
  
  setTimeout(() => {
    uploadResult.classList.remove('bg-blue-50', 'border-blue-200');
    uploadResult.classList.add('bg-green-50', 'border-green-200');
  }, 500);
  
  // 다음 단계로 이동
  setTimeout(() => {
    nextStep(2);
  }, 1000);
}


// ── 악세사리 관련 함수 ──────────────────────────────────────────────────────

// 악세사리 카드 렌더링 (2단계 packageGrid 아래)
function renderAccessories() {
  const grid = document.getElementById('accessoryGrid');
  if (!grid) return;

  grid.innerHTML = ACCESSORIES.map(acc => {
    const qty = selectedAccessories[acc.id] || 0;
    const isSelected = qty > 0;
    return `
      <div style="border: 2px solid ${isSelected ? '#f97316' : '#e2e8f0'}; border-radius: 0.75rem; padding: 1.25rem; background: ${isSelected ? '#fff7ed' : 'white'}; transition: all 0.2s;" id="acc-card-${acc.id}">
        <div style="margin-bottom: 0.75rem;">
          <p style="font-weight: 700; font-size: 1rem; color: #1a202c; margin-bottom: 0.25rem;">${acc.name}</p>
          <p style="font-size: 0.75rem; color: #f97316; font-weight: 600;">₩${acc.consumerPrice.toLocaleString('ko-KR')} / ${acc.unitLabel}</p>
          <p style="font-size: 0.7rem; color: #9ca3af; margin-top: 0.2rem;">${acc.description}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <button onclick="changeAccessoryQty('${acc.id}', -1)"
                  style="width: 2rem; height: 2rem; border-radius: 50%; border: 2px solid #e2e8f0; background: white; font-size: 1.1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151;"
                  onmouseover="this.style.borderColor='#f97316';this.style.color='#f97316'"
                  onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#374151'">−</button>
          <input type="number" id="acc-qty-${acc.id}" value="${qty}" min="0" max="${acc.maxQty}"
                 onchange="setAccessoryQty('${acc.id}', parseInt(this.value)||0)"
                 style="width: 3.5rem; text-align: center; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.25rem; font-size: 0.9rem; font-weight: 700; color: #1a202c;">
          <button onclick="changeAccessoryQty('${acc.id}', +1)"
                  style="width: 2rem; height: 2rem; border-radius: 50%; border: 2px solid #e2e8f0; background: white; font-size: 1.1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151;"
                  onmouseover="this.style.borderColor='#f97316';this.style.color='#f97316'"
                  onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#374151'">＋</button>
          <span style="font-size: 0.8rem; color: #6b7280;">${acc.unitLabel}</span>
          ${isSelected ? `<span style="font-size: 0.75rem; color: #f97316; font-weight: 600; margin-left: auto;">합계 ₩${(qty * acc.consumerPrice).toLocaleString('ko-KR')}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// 악세사리 수량 ±1 버튼
function changeAccessoryQty(accId, delta) {
  const acc = ACCESSORIES.find(a => a.id === accId);
  if (!acc) return;
  const current = selectedAccessories[accId] || 0;
  const newQty = Math.max(0, Math.min(acc.maxQty, current + delta));
  setAccessoryQty(accId, newQty);
}

// 악세사리 수량 직접 설정
function setAccessoryQty(accId, qty) {
  qty = Math.max(0, qty);
  if (qty === 0) {
    delete selectedAccessories[accId];
  } else {
    selectedAccessories[accId] = qty;
  }
  renderAccessories();
}

// 악세사리 초기화 (새 문서 시작 시)
function resetAccessories() {
  selectedAccessories = {};
  renderAccessories();
}

// 선택된 악세사리 목록 텍스트 (4단계 확인서용)
function getAccessorySummary() {
  const items = Object.entries(selectedAccessories)
    .map(([id, qty]) => {
      const acc = ACCESSORIES.find(a => a.id === id);
      if (!acc) return null;
      return `${acc.name} × ${qty}${acc.unitLabel} (₩${(qty * acc.consumerPrice).toLocaleString('ko-KR')})`;
    })
    .filter(Boolean);
  return items.length > 0 ? items.join(', ') : '없음';
}

// 악세사리 총 소비자가 합계
function getAccessoryTotalPrice() {
  return Object.entries(selectedAccessories).reduce((sum, [id, qty]) => {
    const acc = ACCESSORIES.find(a => a.id === id);
    return sum + (acc ? acc.consumerPrice * qty : 0);
  }, 0);
}

// ── 브랜드별 제품 표시
function showBrand(brand) {  console.log('showBrand called with:', brand);
  console.log('allPackages:', allPackages.length);
  
  const tabs = document.querySelectorAll('.brand-tab');
  tabs.forEach(tab => {
    if (tab.dataset.brand === brand) {
      tab.classList.add('bg-blue-600', 'text-white');
      tab.classList.remove('bg-gray-200', 'text-gray-700');
    } else {
      tab.classList.remove('bg-blue-600', 'text-white');
      tab.classList.add('bg-gray-200', 'text-gray-700');
    }
  });

  const packages = allPackages.filter(pkg => pkg.brand === brand);
  console.log('Filtered packages for', brand, ':', packages.length);
  displayPackages(packages);
}

// 제품 패키지 카드 표시
function displayPackages(packages) {
  console.log('displayPackages called with', packages?.length, 'packages');
  const grid = document.getElementById('packageGrid');
  
  if (!grid) {
    console.error('packageGrid element not found');
    return;
  }
  
  if (!packages || packages.length === 0) {
    console.warn('No packages to display');
    grid.innerHTML = '<div class="col-span-full text-center text-gray-500">제품이 없습니다.</div>';
    return;
  }
  
  grid.innerHTML = packages.map(pkg => {
    const isSelected = selectedPackages.some(p => p.id === pkg.id);
    return `
    <div style="border: 2px solid #e2e8f0; border-radius: 0.5rem; padding: 1.5rem; background-color: white; cursor: pointer; transition: all 0.3s; ${isSelected ? 'border-color: #4299e1; background-color: #ebf8ff;' : ''}" 
         onclick="selectPackage('${pkg.id}')">
      <div style="margin-bottom: 1rem;">
        <img src="${pkg.image}" 
             alt="${pkg.name}" 
             style="width: 100%; height: 20rem; object-fit: contain; border-radius: 0.5rem; background-color: #f7fafc;"
             onerror="this.src='https://via.placeholder.com/400x400?text=${encodeURIComponent(pkg.name)}'">
      </div>
      <h3 style="color: #1a202c !important; font-size: 1.125rem !important; font-weight: 700 !important; margin-bottom: 0.5rem !important; display: block !important;">${pkg.name}</h3>
      <p style="color: #2563eb !important; font-size: 1.25rem !important; font-weight: 700 !important; margin-bottom: 0.5rem !important; display: block !important;">₩${pkg.price.toLocaleString('ko-KR')}</p>
      <p style="color: #718096 !important; font-size: 0.875rem !important; margin-bottom: 1rem !important; display: block !important;">${pkg.description}</p>
      ${pkg.hasPositionOption ? `
        <div style="margin-bottom: 1rem; padding: 0.75rem; background-color: #f9fafb; border-radius: 0.5rem;" onclick="event.stopPropagation();">
          <p style="color: #374151 !important; font-size: 0.875rem !important; font-weight: 600 !important; margin-bottom: 0.5rem !important; display: block !important;">3단 선반 설치 위치:</p>
          <div style="display: flex; gap: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" id="position-left-${pkg.id}" value="left" 
                     style="width: 1rem; height: 1rem; cursor: pointer;"
                     onchange="updatePackagePosition('${pkg.id}', 'left', this.checked)">
              <span style="color: #374151 !important; font-size: 0.875rem !important;">좌측</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" id="position-right-${pkg.id}" value="right" 
                     style="width: 1rem; height: 1rem; cursor: pointer;"
                     onchange="updatePackagePosition('${pkg.id}', 'right', this.checked)">
              <span style="color: #374151 !important; font-size: 0.875rem !important;">우측</span>
            </label>
          </div>
        </div>
      ` : ''}
      <button onclick="event.stopPropagation(); selectPackage('${pkg.id}')" 
              style="width: 100%; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; transition: all 0.3s; ${
        isSelected 
          ? 'background-color: #2563eb; color: white;' 
          : 'background-color: #f3f4f6; color: #374151;'
      }">
        <i class="fas ${isSelected ? 'fa-check-circle' : 'fa-circle'}"></i>
        ${isSelected ? ' 선택됨' : ' 선택하기'}
      </button>
    </div>
  `;
  }).join('');
  
  console.log('Displayed', packages.length, 'packages');
}

// 패키지 위치 선택 업데이트
function updatePackagePosition(packageId, position, isChecked) {
  if (!packagePositions[packageId]) {
    packagePositions[packageId] = { left: false, right: false };
  }
  
  packagePositions[packageId][position] = isChecked;
  console.log('Package positions updated:', packagePositions);
}

// 제품 선택 (토글 방식 - 다중 선택)
function selectPackage(packageId) {
  const pkg = allPackages.find(p => p.id === packageId);
  const index = selectedPackages.findIndex(p => p.id === packageId);
  
  if (index > -1) {
    // 이미 선택된 경우 -> 선택 해제
    selectedPackages.splice(index, 1);
    console.log('Package deselected:', packageId);
  } else {
    // 선택되지 않은 경우 -> 선택 추가
    selectedPackages.push(pkg);
    console.log('Package selected:', packageId);
  }
  
  console.log('Currently selected packages:', selectedPackages);
  
  // 현재 브랜드의 제품들만 다시 렌더링
  const brand = pkg.brand;
  const packages = allPackages.filter(p => p.brand === brand);
  displayPackages(packages);
}

// 고객 주소 복사 (접수 정보에서 가져오기)
function copyCustomerAddress() {
  const addr = selectedAssignment?.customer_address;
  if (!addr) {
    alert('⚠️ 고객 주소 정보가 없습니다.');
    return;
  }
  const el = document.getElementById('installAddress');
  if (el) {
    el.value = addr;
    alert('✅ 고객 주소가 복사되었습니다!');
  }
}

// 설치 시간 선택 - 오전/오후 // UPDATED
let selectedTimePeriod = ''; // UPDATED
let selectedTimeHour = ''; // UPDATED
let selectedTimeMinute = '00'; // UPDATED
// UPDATED
function selectTimePeriod(period) { // UPDATED
  selectedTimePeriod = period; // UPDATED
  // UPDATED
  // 버튼 스타일 업데이트 // UPDATED
  const amBtn = document.getElementById('timePeriodAM'); // UPDATED
  const pmBtn = document.getElementById('timePeriodPM'); // UPDATED
  // UPDATED
  if (period === 'AM') { // UPDATED
    amBtn.classList.add('bg-blue-600', 'text-white', 'border-blue-600'); // UPDATED
    amBtn.classList.remove('border-gray-300'); // UPDATED
    pmBtn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600'); // UPDATED
    pmBtn.classList.add('border-gray-300'); // UPDATED
  } else { // UPDATED
    pmBtn.classList.add('bg-blue-600', 'text-white', 'border-blue-600'); // UPDATED
    pmBtn.classList.remove('border-gray-300'); // UPDATED
    amBtn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600'); // UPDATED
    amBtn.classList.add('border-gray-300'); // UPDATED
  } // UPDATED
  // UPDATED
  updateInstallTime(); // UPDATED
} // UPDATED
// UPDATED
function selectTimeHour(hour) { // UPDATED
  selectedTimeHour = hour; // UPDATED
  // UPDATED
  // 모든 시간 버튼 스타일 초기화 // UPDATED
  document.querySelectorAll('.time-hour-btn').forEach(btn => { // UPDATED
    btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600'); // UPDATED
    btn.classList.add('border-gray-300'); // UPDATED
  }); // UPDATED
  // UPDATED
  // 선택된 버튼 스타일 업데이트 // UPDATED
  event.target.classList.add('bg-blue-600', 'text-white', 'border-blue-600'); // UPDATED
  event.target.classList.remove('border-gray-300'); // UPDATED
  // UPDATED
  updateInstallTime(); // UPDATED
} // UPDATED
// UPDATED
function selectTimeMinute(minute) { // UPDATED
  selectedTimeMinute = minute; // UPDATED
  // UPDATED
  // 모든 분 버튼 스타일 초기화 // UPDATED
  document.querySelectorAll('.time-minute-btn').forEach(btn => { // UPDATED
    btn.classList.remove('bg-green-600', 'text-white', 'border-green-600'); // UPDATED
    btn.classList.add('border-gray-300'); // UPDATED
  }); // UPDATED
  // UPDATED
  // 선택된 버튼 스타일 업데이트 // UPDATED
  event.target.classList.add('bg-green-600', 'text-white', 'border-green-600'); // UPDATED
  event.target.classList.remove('border-gray-300'); // UPDATED
  // UPDATED
  updateInstallTime(); // UPDATED
} // UPDATED
// UPDATED
function updateInstallTime() { // UPDATED
  if (selectedTimePeriod && selectedTimeHour) { // UPDATED
    const periodText = selectedTimePeriod === 'AM' ? '오전' : '오후'; // UPDATED
    const timeText = `${periodText} ${selectedTimeHour}시 ${selectedTimeMinute}분`; // UPDATED
    document.getElementById('installTime').value = timeText; // UPDATED
  } // UPDATED
} // UPDATED

// 커스텀 시간 입력 토글 // UPDATED
function toggleCustomTimeInput() { // UPDATED
  const customInput = document.getElementById('customTimeInput'); // UPDATED
  customInput.classList.toggle('hidden'); // UPDATED
} // UPDATED
// UPDATED
// 커스텀 시간 적용 // UPDATED
function applyCustomTime() { // UPDATED
  if (!selectedTimePeriod) { // UPDATED
    alert('⚠️ 먼저 오전/오후를 선택해주세요!'); // UPDATED
    return; // UPDATED
  } // UPDATED
  // UPDATED
  const customHour = document.getElementById('customHour').value; // UPDATED
  const customMinute = document.getElementById('customMinute').value; // UPDATED
  // UPDATED
  if (!customHour || !customMinute) { // UPDATED
    alert('⚠️ 시와 분을 모두 입력해주세요!'); // UPDATED
    return; // UPDATED
  } // UPDATED
  // UPDATED
  const hour = parseInt(customHour); // UPDATED
  const minute = parseInt(customMinute); // UPDATED
  // UPDATED
  if (hour < 1 || hour > 12) { // UPDATED
    alert('⚠️ 시는 1~12 사이의 숫자를 입력해주세요!'); // UPDATED
    return; // UPDATED
  } // UPDATED
  // UPDATED
  if (minute < 0 || minute > 59) { // UPDATED
    alert('⚠️ 분은 0~59 사이의 숫자를 입력해주세요!'); // UPDATED
    return; // UPDATED
  } // UPDATED
  // UPDATED
  selectedTimeHour = customHour; // UPDATED
  selectedTimeMinute = customMinute.padStart(2, '0'); // UPDATED
  // UPDATED
  // 모든 버튼 스타일 초기화 // UPDATED
  document.querySelectorAll('.time-hour-btn').forEach(btn => { // UPDATED
    btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600'); // UPDATED
    btn.classList.add('border-gray-300'); // UPDATED
  }); // UPDATED
  document.querySelectorAll('.time-minute-btn').forEach(btn => { // UPDATED
    btn.classList.remove('bg-green-600', 'text-white', 'border-green-600'); // UPDATED
    btn.classList.add('border-gray-300'); // UPDATED
  }); // UPDATED
  // UPDATED
  updateInstallTime(); // UPDATED
  // UPDATED
  // 입력 필드 초기화 및 숨기기 // UPDATED
  document.getElementById('customHour').value = ''; // UPDATED
  document.getElementById('customMinute').value = ''; // UPDATED
  document.getElementById('customTimeInput').classList.add('hidden'); // UPDATED
  // UPDATED
  alert('✅ 시간이 설정되었습니다!'); // UPDATED
} // UPDATED

// 단계 이동
function nextStep(step) {
  // 유효성 검사
  if (step === 2 && !selectedAssignment && !currentReportId) {
    alert('접수 목록에서 항목을 선택해주세요.');
    return;
  }

  if (step === 3 && selectedPackages.length === 0) {
    alert('제품을 선택해주세요.');
    return;
  }

  // step 4: 날짜 없어도 4단계(최종 확인)로 진입 가능 (임시 저장 후 날짜 조율)

  currentStep = step;
  updateStepIndicator();
  showCurrentSection();

  // 섹션별 초기화
  if (step === 2) {
    setTimeout(() => {
      if (allPackages.length === 0) {
        loadPackages().then(() => {
          showBrand('milwaukee');
          renderAccessories();
        });
      } else {
        showBrand('milwaukee');
        renderAccessories();
      }
    }, 200);
  }

  if (step === 3) {
    // 접수 정보로 주소 자동 채우기
    if (selectedAssignment?.customer_address) {
      const el = document.getElementById('installAddress');
      if (el && !el.value) el.value = selectedAssignment.customer_address;
    }
  }

  if (step === 4) {
    displayFinalPreview();
  }
}

function prevStep(step) {
  currentStep = step;
  updateStepIndicator();
  showCurrentSection();
}

// 단계 표시기 업데이트
function updateStepIndicator() {
  for (let i = 1; i <= 6; i++) {
    const step = document.getElementById(`step${i}`);
    if (step) {
      step.classList.remove('active', 'completed');
      
      if (i === currentStep) {
        step.classList.add('active');
      } else if (i < currentStep) {
        step.classList.add('completed');
      }
    }
  }
}

// 현재 섹션 표시
function showCurrentSection() {
  document.getElementById('upload-section').classList.toggle('hidden', currentStep !== 1);
  document.getElementById('package-section').classList.toggle('hidden', currentStep !== 2);
  document.getElementById('install-section').classList.toggle('hidden', currentStep !== 3);
  document.getElementById('confirm-section').classList.toggle('hidden', currentStep !== 4);
  document.getElementById('manage-section').classList.toggle('hidden', currentStep !== 5);
  document.getElementById('revenue-section')?.classList.toggle('hidden', currentStep !== 6);

  // Step 2 진입 시 악세사리 항상 렌더링
  if (currentStep === 2) {
    setTimeout(() => renderAccessories(), 300);
  }

  // Step 1 진입 시 서버에서 최신 목록 새로고침 (상태 변경 반영)
  if (currentStep === 1) {
    renderStep1AssignmentList();
  }

  // Step 5 진입 시 목록 로드
  if (currentStep === 5) {
    enterStep5();
  }
  
  // Step 6 진입 시 매출 목록 로드
  if (currentStep === 6) {
    loadRevenueList();
  }
}

// 최종 미리보기 표시
function displayFinalPreview() {
  const preview = document.getElementById('finalPreview');
  
  const installDate = document.getElementById('installDate').value;
  const installTime = document.getElementById('installTime').value;
  const installAddress = document.getElementById('installAddress').value;
  const notes = document.getElementById('notes').value;
  
  let materialsHTML = '';
  if (selectedPackages.length > 0) {
    // 모든 선택된 패키지의 자재 합치기
    selectedPackages.forEach(pkg => {
      if (pkg.sections) {
        materialsHTML += pkg.sections.map(section => `
          <div class="mb-4">
            <h4 class="font-bold text-gray-800 mb-2 bg-gray-100 px-3 py-2 rounded">${pkg.name} - ${section.title}</h4>
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-left">자재명</th>
                  <th class="px-3 py-2 text-center">수량</th>
                  <th class="px-3 py-2 text-center">확인</th>
                </tr>
              </thead>
              <tbody>
                ${section.items.map(item => `
                  <tr class="border-b">
                    <td class="px-3 py-2">${item.name}</td>
                    <td class="px-3 py-2 text-center">${item.quantity}</td>
                    <td class="px-3 py-2 text-center">
                      <input type="checkbox" class="w-4 h-4">
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('');
      }
    });
  }
  
  preview.innerHTML = `
    <div class="border-2 border-gray-300 rounded-lg p-4 sm:p-6">
      <h3 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-blue-600">
        PV5 시공(예약) 확인서
      </h3>
      
      <!-- 고객 정보 -->
      <div class="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2">
        <h4 class="font-bold text-base sm:text-lg mb-3 text-gray-800">
          <i class="fas fa-user mr-2 text-blue-600"></i>고객 정보
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><strong>접수일자:</strong> ${selectedAssignment?.order_date || ocrData?.orderDate || '-'}</div>
          <div><strong>상품명:</strong> ${selectedAssignment?.product_name || ocrData?.productName || selectedPackages.map(p => p.name || p.fullName).filter(Boolean).join(', ') || '-'}</div>
          <div><strong>고객명:</strong> ${selectedAssignment?.customer_name || document.getElementById('customerName')?.value || '-'}</div>
          <div><strong>연락처:</strong> ${selectedAssignment?.customer_phone || document.getElementById('customerPhone')?.value || '-'}</div>
          <div class="sm:col-span-2"><strong>주소:</strong> ${selectedAssignment?.customer_address || document.getElementById('installAddress')?.value || '-'}</div>
          <div><strong>접수번호:</strong> ${selectedAssignment?.assignment_id || '-'}</div>
        </div>
      </div>
      
      <!-- 제품 정보 -->
      <div class="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2">
        <h4 class="font-bold text-base sm:text-lg mb-3 text-gray-800">
          <i class="fas fa-box mr-2 text-blue-600"></i>선택 제품 (${selectedPackages.length}개)
        </h4>
        ${selectedPackages.map(pkg => `
          <div class="mb-4 pb-4 ${selectedPackages.length > 1 ? 'border-b border-gray-200' : ''}">
            <div class="flex flex-col sm:flex-row sm:items-start sm:space-x-4">
              <img src="${pkg.image || ''}" 
                   alt="${pkg.name || ''}" 
                   class="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-lg mb-3 sm:mb-0"
                   onerror="this.style.display='none'">
              <div class="flex-1">
                <div class="font-bold text-base sm:text-lg mb-1">${pkg.fullName || '-'}</div>
                <div class="text-sm text-gray-600 mb-2">${pkg.description || '-'}</div>
                ${pkg.hasPositionOption && packagePositions[pkg.id] ? `
                  <div class="mt-2 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <strong class="text-gray-800 text-sm sm:text-base">3단 선반 설치:</strong>
                    ${packagePositions[pkg.id].left ? '<span class="inline-block px-3 py-1.5 bg-blue-500 text-white rounded-lg font-bold text-sm mr-2 mt-1">좌측</span>' : ''}
                    ${packagePositions[pkg.id].right ? '<span class="inline-block px-3 py-1.5 bg-green-500 text-white rounded-lg font-bold text-sm mt-1">우측</span>' : ''}
                    ${!packagePositions[pkg.id].left && !packagePositions[pkg.id].right ? '<span class="text-red-600 font-bold text-sm">미선택</span>' : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- 설치 정보 -->
      <div class="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2">
        <h4 class="font-bold text-base sm:text-lg mb-3 text-gray-800">
          <i class="fas fa-calendar-check mr-2 text-blue-600"></i>설치 정보
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><strong>설치 날짜:</strong> ${installDate || '-'}</div>
          <div><strong>설치 시간:</strong> ${installTime || '-'}</div>
          <div class="sm:col-span-2"><strong>설치 주소:</strong> ${installAddress || '-'}</div>
          ${notes ? `<div class="sm:col-span-2"><strong>특이사항:</strong> ${notes}</div>` : ''}
        </div>
      </div>
      
      <!-- 악세사리 정보 -->
      ${Object.keys(selectedAccessories).length > 0 ? `
      <div class="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2">
        <h4 class="font-bold text-base sm:text-lg mb-3 text-gray-800">
          <i class="fas fa-puzzle-piece mr-2 text-orange-500"></i>악세사리 추가 선택
        </h4>
        <table class="w-full text-sm">
          <thead class="bg-orange-50">
            <tr>
              <th class="px-3 py-2 text-left">품목</th>
              <th class="px-3 py-2 text-center">수량</th>
              <th class="px-3 py-2 text-right">단가</th>
              <th class="px-3 py-2 text-right">소계</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(selectedAccessories).map(([id, qty]) => {
              const acc = ACCESSORIES.find(a => a.id === id);
              if (!acc) return '';
              return `<tr class="border-b">
                <td class="px-3 py-2">${acc.name}</td>
                <td class="px-3 py-2 text-center">${qty}${acc.unitLabel}</td>
                <td class="px-3 py-2 text-right">₩${acc.consumerPrice.toLocaleString('ko-KR')}</td>
                <td class="px-3 py-2 text-right font-semibold text-orange-600">₩${(acc.consumerPrice * qty).toLocaleString('ko-KR')}</td>
              </tr>`;
            }).join('')}
            <tr class="bg-orange-50 font-bold">
              <td colspan="3" class="px-3 py-2 text-right">악세사리 합계</td>
              <td class="px-3 py-2 text-right text-orange-600">₩${getAccessoryTotalPrice().toLocaleString('ko-KR')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- 자재 리스트 -->
      <div class="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2">
        <h4 class="font-bold text-base sm:text-lg mb-3 text-gray-800">
          <i class="fas fa-clipboard-list mr-2 text-blue-600"></i>시공 자재 점검표
        </h4>
        ${materialsHTML}
      </div>
      
      <!-- 접수/작성자 정보 -->
      <div class="mb-4">
        <div class="border-2 border-gray-300 rounded-lg p-3 sm:p-4">
          <label for="installerName" class="block font-bold text-base sm:text-lg mb-2 text-gray-800">
            <i class="fas fa-user-edit mr-2 text-blue-600"></i>접수 / 작성자
          </label>
          <input type="text" 
                 id="installerName" 
                 placeholder="홍길동"
                 class="w-full px-4 py-2.5 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>
      </div>
      
      <!-- 이메일 발송 정보 -->
      <div class="p-3 sm:p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
        <h4 class="font-bold text-base sm:text-lg mb-3 text-gray-800">
          <i class="fas fa-envelope mr-2 text-green-600"></i>이메일 발송
        </h4>
        <label for="recipientEmail" class="block text-sm font-medium text-gray-700 mb-2">
          받는 사람
        </label>
        <input type="email" 
               id="recipientEmail" 
               placeholder="example@email.com"
               class="w-full px-4 py-2.5 sm:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-2"
               required />
        <p class="text-xs text-gray-500">
          <i class="fas fa-info-circle mr-1"></i>
          시공 확인서가 입력하신 이메일 주소로 발송됩니다.
        </p>
      </div>
    </div>
  `;
}

// PDF 다운로드
async function downloadPDF() {
  alert('PDF 다운로드 기능은 개발 중입니다.\n\n브라우저의 인쇄 기능(Ctrl+P)을 사용하여 PDF로 저장하실 수 있습니다.');
  window.print();
}


// 이메일 발송
async function sendEmail() {
  // 이메일 버튼 찾기
  const emailButton = document.querySelector('button[onclick="sendEmail()"]');
  
  try {
    // 이메일 주소 가져오기
    const recipientEmail = document.getElementById('recipientEmail').value;
    
    // 이메일 주소 유효성 검사
    if (!recipientEmail) {
      alert('이메일 주소를 입력해주세요.');
      document.getElementById('recipientEmail').focus();
      return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      alert('올바른 이메일 주소 형식을 입력해주세요.');
      document.getElementById('recipientEmail').focus();
      return;
    }
    
    const installDate = document.getElementById('installDate').value;
    const installTime = document.getElementById('installTime').value;
    const installAddress = document.getElementById('installAddress').value;
    const notes = document.getElementById('notes').value;
    
    // 로딩 표시
    if (emailButton) {
      emailButton.disabled = true;
      emailButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>발송 중...';
    }
    
    // 업로드된 이미지를 Base64로 변환
    let imageBase64 = null;
    let imageFileName = null;
    let imageContentType = null;
    
    if (uploadedImageFile) {
      console.log('Converting uploaded image to base64 for attachment');
      const reader = new FileReader();
      
      imageBase64 = await new Promise((resolve, reject) => {
        reader.onload = () => {
          // Data URL에서 base64 부분만 추출 (data:image/png;base64, 제거)
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(uploadedImageFile);
      });
      
      imageFileName = uploadedImageFile.name;
      imageContentType = uploadedImageFile.type;
      console.log('Image converted to base64, filename:', imageFileName);
    }
    
    const emailData = {
      recipientEmail,
      customerInfo: selectedAssignment ? {
        receiverName:    selectedAssignment.customer_name,
        receiverPhone:   selectedAssignment.customer_phone,
        receiverAddress: selectedAssignment.customer_address,
        productName:     selectedAssignment.product_name,
        assignmentId:    selectedAssignment.assignment_id,
        orderDate:       selectedAssignment.order_date
      } : {},
      packages: selectedPackages,
      accessories: Object.entries(selectedAccessories).map(([id, qty]) => {
        const acc = ACCESSORIES.find(a => a.id === id);
        return acc ? { name: acc.name, qty, unitLabel: acc.unitLabel, consumerPrice: acc.consumerPrice, subtotal: acc.consumerPrice * qty } : null;
      }).filter(Boolean),
      accessoryTotal: getAccessoryTotalPrice(),
      installDate,
      installTime,
      installAddress,
      notes,
      // 첨부 이미지 데이터
      attachmentImage: imageBase64,
      attachmentFileName: imageFileName,
      attachmentContentType: imageContentType
    };
    
    const response = await axios.post('/api/send-email', emailData, {
      timeout: 30000 // 30초 타임아웃
    });
    
    // 버튼 복원
    if (emailButton) {
      emailButton.disabled = false;
      emailButton.innerHTML = '<i class="fas fa-envelope mr-2"></i>이메일 발송';
    }
    
    if (response.data.success) {
      alert(`✅ 이메일이 성공적으로 발송되었습니다!\n\n받는 사람: ${recipientEmail}\n\n확인해주세요.`);
      console.log('Email sent successfully:', response.data);
    } else {
      alert(`❌ ${response.data.message || '이메일 발송에 실패했습니다.'}\n\n다시 시도해주세요.`);
      console.error('Email sending failed:', response.data);
    }
  } catch (error) {
    // 버튼 복원
    if (emailButton) {
      emailButton.disabled = false;
      emailButton.innerHTML = '<i class="fas fa-envelope mr-2"></i>이메일 발송';
    }
    
    console.error('Email sending error:', error);
    
    let errorMessage = '이메일 발송에 실패했습니다.';
    if (error.code === 'ECONNABORTED') {
      errorMessage = '요청 시간이 초과되었습니다. 네트워크를 확인하고 다시 시도해주세요.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    alert(`❌ ${errorMessage}`);
  }
}

// 인쇄 스타일 최적화
window.addEventListener('beforeprint', () => {
  document.querySelector('header').style.display = 'none';
  document.querySelector('footer').style.display = 'none';
  document.querySelector('.step-indicator').style.display = 'none';
  document.querySelectorAll('button').forEach(btn => btn.style.display = 'none');
});

window.addEventListener('afterprint', () => {
  document.querySelector('header').style.display = 'block';
  document.querySelector('footer').style.display = 'block';
  document.querySelector('.step-indicator').style.display = 'flex';
  document.querySelectorAll('button').forEach(btn => btn.style.display = 'inline-block');
});

// ==================== Step 5: 저장 문서 관리 ====================

// 임시 저장 (Step 3에서 날짜 없이 저장)
let isSavingDraft = false;

async function saveDraftReport() {
  if (isSavingDraft) return;
  isSavingDraft = true;
  setBtnLoading('saveDraftBtn', true);
  try {
    const installerName = document.getElementById('installerName')?.value || '';
    const installDate = document.getElementById('installDate')?.value || ''; // 빈 값 허용
    const installTime = document.getElementById('installTime')?.value || ''; // 빈 값 허용
    const installAddress = document.getElementById('installAddress')?.value || '';
    const notes = document.getElementById('notes')?.value || '';
    
    // 제품이 선택되지 않았으면 경고
    if (!selectedPackages || selectedPackages.length === 0) {
      alert('⚠️ 제품을 먼저 선택해주세요.');
      return;
    }
    
    // 이미지를 Base64로 변환
    let imageBase64 = null;
    let imageFileName = null;
    
    if (uploadedImageFile) {
      const reader = new FileReader();
      imageBase64 = await new Promise((resolve) => {
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(uploadedImageFile);
      });
      imageFileName = uploadedImageFile.name;
    }
    
    const reportData = {
      reportId: currentReportId || `REPORT-${Date.now()}`,
      customerInfo: {
        receiverName:    selectedAssignment?.customer_name    || document.getElementById('customerName')?.value || '',
        receiverPhone:   selectedAssignment?.customer_phone   || document.getElementById('customerPhone')?.value || '',
        receiverAddress: selectedAssignment?.customer_address || installAddress,
        productName:     selectedAssignment?.product_name     || '',
        assignmentId:    selectedAssignment?.assignment_id    || ocrData?.assignmentId || ''
      },
      packages: selectedPackages,
      packagePositions,
      installDate,
      installTime,
      installAddress,
      notes,
      installerName,
      attachmentImage: imageBase64,
      attachmentFileName: imageFileName,
      status: 'draft',
      assignmentId: selectedAssignment?.assignment_id || ocrData?.assignmentId || null,
      createdAt: new Date().toISOString()
    };
    
    // 서버에 저장
    try {
      const response = await axios.post('/api/reports/save', reportData, {
        timeout: 30000
      });
      
      if (response.data.success) {
        console.log('✅ Draft saved to server');
        
        // localStorage 캐시 업데이트
        try {
          let savedReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
          const existingIndex = savedReports.findIndex(r => r.reportId === reportData.reportId);
          
          if (existingIndex >= 0) {
            savedReports[existingIndex] = reportData;
          } else {
            savedReports.unshift(reportData);
          }
          
          localStorage.setItem('pv5_reports', JSON.stringify(savedReports));
        } catch (cacheError) {
          console.warn('⚠️ localStorage cache failed:', cacheError);
        }
        
        currentReportId = reportData.reportId;

        // ★ assignment 로컬 상태를 서버 동기화 규칙과 동일하게 업데이트
        // 서버: draft+날짜없음 → adjusting, draft+날짜있음 → in_progress
        if (selectedAssignment?.assignment_id) {
          const syncedStatus = (!installDate || installDate === '') ? 'adjusting' : 'in_progress';
          selectedAssignment.status = syncedStatus;
          const idx = currentAssignments.findIndex(x => x.assignment_id === selectedAssignment.assignment_id);
          if (idx >= 0) currentAssignments[idx].status = syncedStatus;
        }
        
        // 날짜 미정 여부에 따라 다른 메시지
        if (!installDate || installDate === '') {
          alert(`✅ 임시 저장되었습니다!\n\n문서 ID: ${reportData.reportId}\n상태: 조율 중 (설치 날짜 미정)\n\nStep 5에서 날짜를 입력할 수 있습니다.`);
        } else {
          alert(`✅ 저장되었습니다!\n\n문서 ID: ${reportData.reportId}`);
        }
        
        // Step 5로 이동
        currentStep = 5;
        updateStepIndicator();
        showCurrentSection();
      } else {
        throw new Error(response.data.message || 'Server save failed');
      }
    } catch (serverError) {
      console.warn('⚠️ Server save failed, fallback to localStorage:', serverError);
      
      // localStorage 폴백
      const reportDataForLocal = {
        ...reportData,
        attachmentImage: null,
        attachmentFileName: reportData.attachmentFileName
      };
      
      let savedReports = [];
      try {
        savedReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
      } catch (e) {
        savedReports = [];
      }
      
      const existingIndex = savedReports.findIndex(r => r.reportId === reportDataForLocal.reportId);
      
      if (existingIndex >= 0) {
        savedReports[existingIndex] = reportDataForLocal;
      } else {
        savedReports.unshift(reportDataForLocal);
      }
      
      localStorage.setItem('pv5_reports', JSON.stringify(savedReports));
      
      currentReportId = reportDataForLocal.reportId;
      alert(`✅ 임시 저장되었습니다! (오프라인)\n\n문서 ID: ${reportDataForLocal.reportId}\n\n인터넷 연결 후 다시 저장해주세요.`);
      
      // Step 5로 이동
      currentStep = 5;
      updateStepIndicator();
      showCurrentSection();
    }
  } catch (error) {
    console.error('Draft save error:', error);
    alert('❌ 저장 중 오류가 발생했습니다.\n\n' + error.message);
  } finally {
    isSavingDraft = false;
    setBtnLoading('saveDraftBtn', false);
  }
}

// 시공 확인서 저장
// ── 버튼 로딩 헬퍼 (이중클릭 방지 공통) ─────────────────────────
function setBtnLoading(btnId, on, defaultHtml) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = on;
  if (on) {
    btn.dataset.origHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>처리 중...';
  } else {
    btn.innerHTML = defaultHtml || btn.dataset.origHtml || btn.innerHTML;
  }
}

let isSavingReport = false;

async function saveReport() {
  if (isSavingReport) return;
  isSavingReport = true;
  setBtnLoading('saveReportBtn', true);
  try {
    const installerName = document.getElementById('installerName')?.value || '';
    const installDate = document.getElementById('installDate')?.value || '';
    const installTime = document.getElementById('installTime')?.value || '';
    const installAddress = document.getElementById('installAddress')?.value || '';
    const notes = document.getElementById('notes')?.value || '';
    
    // 이미지를 Base64로 변환
    let imageBase64 = null;
    let imageFileName = null;
    
    if (uploadedImageFile) {
      const reader = new FileReader();
      imageBase64 = await new Promise((resolve) => {
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(uploadedImageFile);
      });
      imageFileName = uploadedImageFile.name;
    }
    
    // 🔍 디버깅: 저장 전 selectedPackages 확인
    console.log('🔍 DEBUG: selectedPackages 내용:', selectedPackages);
    console.log('🔍 DEBUG: selectedPackages 길이:', selectedPackages.length);
    if (selectedPackages.length > 0) {
      console.log('🔍 DEBUG: 첫 번째 제품:', {
        id: selectedPackages[0].id,
        name: selectedPackages[0].name,
        fullName: selectedPackages[0].fullName
      });
    }
    
    const reportData = {
      reportId: currentReportId || `REPORT-${Date.now()}`,
      customerInfo: {
        receiverName:    selectedAssignment?.customer_name    || document.getElementById('customerName')?.value || '',
        receiverPhone:   selectedAssignment?.customer_phone   || document.getElementById('customerPhone')?.value || '',
        receiverAddress: selectedAssignment?.customer_address || installAddress,
        productName:     selectedAssignment?.product_name     || '',
        assignmentId:    selectedAssignment?.assignment_id    || ocrData?.assignmentId || ''
      },
      packages: selectedPackages,
      packagePositions,
      installDate,
      installTime,
      installAddress,
      notes,
      installerName,
      attachmentImage: imageBase64,
      attachmentFileName: imageFileName,
      assignmentId: selectedAssignment?.assignment_id || ocrData?.assignmentId || null,
      createdAt: new Date().toISOString()
    };
    
    // 🔍 디버깅: reportData.packages 확인
    console.log('🔍 DEBUG: reportData.packages 내용:', reportData.packages);
    console.log('🔍 DEBUG: reportData.packages 길이:', reportData.packages.length);
    
    // 🔄 서버에 먼저 저장 (Primary) // UPDATED
    try { // UPDATED
      const response = await axios.post('/api/reports/save', reportData, {
        timeout: 30000
      });
      
      if (response.data.success) {
        console.log('✅ Saved to server (D1 + R2)'); // UPDATED
        
        // 서버 저장 성공 시 localStorage 캐시 업데이트 (용량 초과 시 무시) // UPDATED
        try { // UPDATED
          let savedReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]'); // UPDATED
          const existingIndex = savedReports.findIndex(r => r.reportId === reportData.reportId); // UPDATED
          
          if (existingIndex >= 0) { // UPDATED
            savedReports[existingIndex] = reportData; // UPDATED
          } else { // UPDATED
            savedReports.unshift(reportData); // UPDATED
          } // UPDATED
          
          localStorage.setItem('pv5_reports', JSON.stringify(savedReports)); // UPDATED
          console.log('✅ Cached to localStorage'); // UPDATED
        } catch (cacheError) { // UPDATED
          console.warn('⚠️ localStorage cache failed (ignored):', cacheError); // UPDATED
        } // UPDATED
        
        currentReportId = reportData.reportId;

        // ★ assignment 상태는 서버(/api/reports/save)에서 자동 동기화 처리
        // 최종 저장(step4) 시 서버에서 confirmed(예약 확정) 로 자동 설정
        if (selectedAssignment?.assignment_id) {
          selectedAssignment.status = 'confirmed';
          const idx = currentAssignments.findIndex(x => x.assignment_id === selectedAssignment.assignment_id);
          if (idx >= 0) currentAssignments[idx].status = 'confirmed';
        }

        alert(`✅ 시공 확인서가 저장되었습니다!\n\n문서 ID: ${reportData.reportId}\n\n신규 접수를 시작합니다.`);
        resetForNewReport();
      } else { // UPDATED
        throw new Error(response.data.message || 'Server save failed'); // UPDATED
      } // UPDATED
    } catch (serverError) { // UPDATED
      // 서버 저장 실패 시 localStorage에만 저장 (Fallback) // UPDATED
      console.warn('⚠️ Server save failed, fallback to localStorage:', serverError); // UPDATED
      
      // localStorage 저장용 데이터 (이미지 제거하여 용량 절약) // UPDATED - FIX
      const reportDataForLocal = {
        ...reportData,
        attachmentImage: null, // 이미지 제거 // UPDATED - FIX
        attachmentFileName: reportData.attachmentFileName // 파일명은 유지 // UPDATED - FIX
      }; // UPDATED - FIX
      
      let savedReports = []; // UPDATED
      try { // UPDATED
        savedReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]'); // UPDATED
      } catch (parseError) { // UPDATED
        console.error('⚠️ localStorage 데이터 손상:', parseError); // UPDATED
        throw new Error('저장된 데이터가 손상되었습니다. Step 5에서 "데이터 내보내기"로 백업 후 초기화해주세요.'); // UPDATED
      } // UPDATED
      
      const existingIndex = savedReports.findIndex(r => r.reportId === reportDataForLocal.reportId); // UPDATED - FIX
      
      if (existingIndex >= 0) { // UPDATED
        savedReports[existingIndex] = reportDataForLocal; // UPDATED - FIX
      } else { // UPDATED
        savedReports.unshift(reportDataForLocal); // UPDATED - FIX
      } // UPDATED
      
      try { // UPDATED
        localStorage.setItem('pv5_reports', JSON.stringify(savedReports)); // UPDATED
        currentReportId = reportDataForLocal.reportId; // UPDATED - FIX
        alert(`⚠️ 서버 연결 실패로 로컬에만 저장되었습니다.\n\n문서 ID: ${reportDataForLocal.reportId}\n\n참고: 첨부 이미지는 로컬 저장에서 제외되었습니다.\n서버가 복구되면 다시 시도해주세요.\n\n신규 접수를 시작합니다.`); // UPDATED - FIX
        resetForNewReport(); // UPDATED
      } catch (storageError) { // UPDATED
        console.error('⚠️ localStorage 저장 실패:', storageError); // UPDATED
        
        // 용량 초과 확인 // UPDATED
        if (storageError.name === 'QuotaExceededError') { // UPDATED
          // 이미지를 제거했는데도 용량 초과 - 기존 데이터가 너무 많음 // UPDATED - FIX
          alert(`⚠️ 알림\n\n서버 연결이 실패했고, 로컬 저장 공간도 부족합니다.\n\n해결 방법:\n1. Step 5에서 "Excel 내보내기"로 기존 데이터 백업\n2. 브라우저 콘솔에서 다음 명령 실행:\n   localStorage.clear()\n3. 페이지 새로고침 후 다시 저장\n\n참고: 서버가 복구되면 자동으로 서버에 저장됩니다.`); // UPDATED - FIX
          return; // 오류를 throw하지 않고 종료 // UPDATED
        } else { // UPDATED
          alert(`⚠️ 저장 실패\n\n${storageError.message}\n\n브라우저를 새로고침하고 다시 시도해주세요.`); // UPDATED
          return; // UPDATED
        } // UPDATED
      } // UPDATED
    } // UPDATED
    
  } catch (error) {
    console.error('Save error:', error);
    alert(error.message || '❌ 저장 중 오류가 발생했습니다.');
  } finally {
    isSavingReport = false;
    setBtnLoading('saveReportBtn', false);
  }
}

// 저장된 문서 목록 불러오기
async function loadReportsList() {
  try {
    // 🔄 서버에서 먼저 불러오기 (Primary) // UPDATED
    try { // UPDATED
      // 본사 대리 접속 시 viewBranchId 파라미터 전달
    const listUrl = viewBranchId
      ? `/api/reports/list?viewBranchId=${viewBranchId}`
      : '/api/reports/list';
    const response = await axios.get(listUrl, { timeout: 10000 }); // UPDATED
      if (response.data.success) { // ★ length > 0 제거: 서버 성공이면 0건도 그대로 표시
        console.log('✅ Loaded from server (D1):', response.data.reports.length, 'reports'); // UPDATED
        allReports = response.data.reports; // UPDATED
        
        // 서버 데이터를 localStorage에 캐싱 (0건이면 캐시도 비움) // UPDATED
        try { // UPDATED
          localStorage.setItem('pv5_reports', JSON.stringify(allReports)); // UPDATED
          console.log('✅ Cached to localStorage'); // UPDATED
        } catch (cacheError) { // UPDATED
          console.warn('⚠️ localStorage cache failed:', cacheError); // UPDATED
        } // UPDATED
        
        displayReportsList(allReports); // UPDATED
        const countEl = document.getElementById('searchResultCount');
        if (countEl) countEl.textContent = `전체 ${allReports.length}건`;
        return; // UPDATED
      } // UPDATED
    } catch (serverError) { // UPDATED
      console.warn('⚠️ Server load failed, fallback to localStorage:', serverError); // UPDATED
    } // UPDATED
    
    // 서버 연결 실패 시에만 localStorage에서 불러오기 (Fallback) // UPDATED
    let localReports = [];
    try {
      localReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
      console.log('✅ Loaded from localStorage (cache):', localReports.length, 'reports'); // UPDATED
    } catch (parseError) {
      console.error('⚠️ localStorage 데이터 손상:', parseError);
      alert('❌ 저장된 데이터가 손상되었습니다.\n\n"데이터 내보내기"로 백업을 시도하거나, 데이터 초기화가 필요합니다.');
      localReports = [];
    }
    
    // 🔧 데이터 마이그레이션: packages 필드가 없으면 빈 배열 추가
    let migrated = false;
    localReports.forEach(report => {
      if (!report.packages) {
        report.packages = [];
        migrated = true;
        console.log(`✅ Migrated report ${report.reportId}: added empty packages array`);
      }
    });
    
    // 마이그레이션 후 다시 저장
    if (migrated) {
      try {
        localStorage.setItem('pv5_reports', JSON.stringify(localReports));
        console.log('✅ Migration saved to localStorage');
      } catch (e) {
        console.warn('⚠️ Failed to save migration:', e);
      }
    }
    
    allReports = localReports;
    displayReportsList(allReports);
    
  } catch (error) {
    console.error('Load reports error:', error);
    alert('❌ 문서 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// 문서 목록 표시
function displayReportsList(reports) {
  const listContainer = document.getElementById('reportsList');
  
  if (!reports || reports.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-folder-open text-6xl mb-4"></i>
        <p>저장된 문서가 없습니다.</p>
      </div>
    `;
    return;
  }
  
  // 정렬: 1)상태 우선순위(진행중 위, 완료 아래) 2)설치 날짜 오름차순
  const statusOrder = { 'pending_report': 0, 'adjusting': 1, 'draft': 2, 'confirmed': 3, 'inst_confirmed': 4, 'completed': 5 };
  const sortedReports = [...reports].sort((a, b) => {
    const sA = statusOrder[a.status] ?? 2;
    const sB = statusOrder[b.status] ?? 2;
    if (sA !== sB) return sA - sB;
    const dateA = a.install_date || a.installDate || '9999-12-31';
    const dateB = b.install_date || b.installDate || '9999-12-31';
    return dateA.localeCompare(dateB);
  });
  
  listContainer.innerHTML = sortedReports.map((report, index) => {
    const customerName = report.customerInfo?.receiverName || report.customerName || '-';
    const installDate = report.installDate || report.install_date || '';
    const installTime = report.installTime || report.install_time || '';
    const installAddress = report.installAddress || report.install_address || '-';
    const reportId = report.reportId || report.id || `REPORT-${index}`;
    
    // 날짜 미정 여부 확인
    const isDatePending = !installDate || installDate === '-' || installDate === '';
    const displayDate = isDatePending ? '미정 (조율 중)' : installDate;
    const displayTime = !installTime || installTime === '-' ? '-' : installTime;
    
    // 제품명 목록 생성
    const packages = report.packages || [];
    const productNamesList = packages
      .map(pkg => pkg.fullName || pkg.name)
      .filter(name => name && name !== '-'); // 빈 값 제거
    const displayName = productNamesList.length > 0 
      ? `${customerName} | ${productNamesList.join(', ')}` 
      : customerName;
    
    // 3단 선반 설치 위치 정보 생성 // UPDATED
    const packagePositions = report.packagePositions || {}; // UPDATED
    const positionBadges = packages // UPDATED
      .filter(pkg => pkg.hasPositionOption && packagePositions[pkg.id]) // UPDATED
      .map(pkg => { // UPDATED
        const pos = packagePositions[pkg.id]; // UPDATED
        let badges = []; // UPDATED
        if (pos.left) badges.push('<span class="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs mr-1 no-print-hide">3단 선반 설치 좌측</span>'); // UPDATED
        if (pos.right) badges.push('<span class="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs no-print-hide">3단 선반 설치 우측</span>'); // UPDATED
        return badges.join(''); // UPDATED
      }) // UPDATED
      .join(''); // UPDATED
    
    return `
      <div class="border border-gray-300 rounded-lg p-4 hover:shadow-lg transition">
        <div class="mb-4">
          <h3 class="text-lg font-bold text-gray-800 mb-2">
            <i class="fas fa-file-alt text-blue-600 mr-2"></i>
            ${displayName}
          </h3>
          ${positionBadges ? `<div class="mb-2">${positionBadges}</div>` : ''} <!-- UPDATED -->
          <!-- 상태 배지 -->
          <div class="mb-2">
            ${report.status === 'pending_report' ?
              '<span class="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold"><i class="fas fa-exclamation-circle mr-1"></i>작성 필요</span>' :
              isDatePending ? 
              '<span class="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold"><i class="fas fa-hourglass-half mr-1"></i>조율 중</span>' :
              report.status === 'draft' || !report.status ? 
              '<span class="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold"><i class="fas fa-clipboard-list mr-1"></i>예약 접수 중</span>' :
              report.status === 'confirmed' ?
              '<span class="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold"><i class="fas fa-check-circle mr-1"></i>예약 확정</span>' :
              '<span class="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold"><i class="fas fa-check-double mr-1"></i>시공 완료</span>'
            }
          </div>
          <div class="text-sm text-gray-600 space-y-1">
            <div><i class="fas fa-calendar mr-2"></i>설치 날짜: ${displayDate}</div>
            <div><i class="fas fa-clock mr-2"></i>설치 시간: ${displayTime}</div>
            <div><i class="fas fa-map-marker-alt mr-2"></i>설치 주소: ${installAddress}</div>
          </div>
        </div>
        
        <!-- 버튼 영역: 데스크톱 (가로 배치), 모바일 (2×3 그리드) -->
        <div class="hidden md:flex md:space-x-2">
          ${report.status === 'pending_report' ? `
            <button onclick="resumeFromAssignment('${report.customerInfo?.assignmentId || ''}')"
                    class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm">
              <i class="fas fa-play mr-1"></i>이어서 작성
            </button>
          ` : `
          <button onclick="showReportPreview('${reportId}')" 
                  class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            <i class="fas fa-eye mr-1"></i>상세보기
          </button>
          <button onclick="loadReport('${reportId}')" 
                  class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <i class="fas fa-edit mr-1"></i>수정하기
          </button>
          ${isDatePending ? `
            <button onclick="loadReport('${reportId}')" 
                    class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
              <i class="fas fa-calendar-plus mr-1"></i>날짜 입력
            </button>
          ` : report.status === 'completed' ? `
            <button disabled 
                    class="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm cursor-not-allowed">
              <i class="fas fa-check-double mr-1"></i>완료됨
            </button>
          ` : report.status === 'confirmed' ? `
            <button onclick="completeReport('${reportId}')" 
                    class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
              <i class="fas fa-check-circle mr-1"></i>시공 완료
            </button>
          ` : `
            <button onclick="confirmReport('${reportId}')" 
                    class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm">
              <i class="fas fa-calendar-check mr-1"></i>예약 확정
            </button>
          `}
          <button onclick="deleteReport('${reportId}')" 
                  class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
            <i class="fas fa-trash mr-1"></i>삭제
          </button>
          `}
        </div>
        
        <!-- 모바일 버튼 (2×3 그리드) -->
        <div class="md:hidden grid grid-cols-2 gap-2">
          ${report.status === 'pending_report' ? `
            <button onclick="resumeFromAssignment('${report.customerInfo?.assignmentId || ''}')"
                    class="col-span-2 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 text-sm font-semibold">
              <i class="fas fa-play mr-1"></i>이어서 작성
            </button>
          ` : `
          <button onclick="showReportPreview('${reportId}')" 
                  class="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 text-sm font-semibold">
            <i class="fas fa-eye mr-1"></i>상세보기
          </button>
          <button onclick="loadReport('${reportId}')" 
                  class="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 text-sm font-semibold">
            <i class="fas fa-edit mr-1"></i>수정하기
          </button>
          ${isDatePending ? `
            <button onclick="loadReport('${reportId}')" 
                    class="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 text-sm font-semibold">
              <i class="fas fa-calendar-plus mr-1"></i>날짜 입력
            </button>
          ` : report.status === 'completed' ? `
            <button disabled 
                    class="bg-gray-400 text-white px-4 py-3 rounded-lg text-sm font-semibold cursor-not-allowed">
              <i class="fas fa-check-double mr-1"></i>완료됨
            </button>
          ` : report.status === 'confirmed' ? `
            <button onclick="completeReport('${reportId}')" 
                    class="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 text-sm font-semibold">
              <i class="fas fa-check-circle mr-1"></i>시공 완료
            </button>
          ` : `
            <button onclick="confirmReport('${reportId}')" 
                    class="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 text-sm font-semibold">
              <i class="fas fa-calendar-check mr-1"></i>예약 확정
            </button>
          `}
          <button onclick="deleteReport('${reportId}')" 
                  class="col-span-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 text-sm font-semibold">
            <i class="fas fa-trash mr-1"></i>삭제
          </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

// 5단계에서 "이어서 작성" 클릭 → 해당 assignment 선택 후 2단계로 이동
function resumeFromAssignment(assignmentId) {
  if (!assignmentId) { alert('접수 정보를 찾을 수 없습니다.'); return; }
  const a = currentAssignments.find(x => x.assignment_id === assignmentId);
  if (!a) {
    // currentAssignments에 없으면 1단계로 이동 후 선택 유도
    alert('1단계로 이동합니다. "이어하기" 버튼을 눌러주세요.');
    currentStep = 1; updateStepIndicator(); showCurrentSection();
    return;
  }
  startAssignment(assignmentId);
}

// 문서 불러오기
async function loadReport(reportId) {
  try {
    // 로컬스토리지에서 먼저 찾기
    const localReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
    let report = localReports.find(r => r.reportId === reportId || r.id === reportId);
    
    // 서버에서도 시도
    if (!report) {
      try {
        const response = await axios.get(`/api/reports/${reportId}`, { timeout: 10000 });
        if (response.data.success) {
          report = response.data.report;
        }
      } catch (error) {
        console.warn('Server load failed, using local storage:', error);
      }
    }
    
    if (!report) {
      alert('❌ 문서를 찾을 수 없습니다.');
      return;
    }
    
    // 데이터 복원
    currentReportId = reportId;
    ocrData = report.customerInfo || {};
    selectedPackages = report.packages || [];
    // 접수일자·상품명을 ocrData에 보완 (수정하기 모드에서 4단계 표시용)
    if (!ocrData.orderDate && report.orderDate) ocrData.orderDate = report.orderDate;
    if (!ocrData.productName && report.customerInfo?.productName) ocrData.productName = report.customerInfo.productName;
    
    // 입력 필드 복원
    if (report.customerInfo?.receiverName) {
      const el = document.getElementById('customerName');
      if (el) el.value = report.customerInfo.receiverName;
    }
    if (report.customerInfo?.receiverPhone) {
      const el = document.getElementById('customerPhone');
      if (el) el.value = report.customerInfo.receiverPhone;
    }
    if (report.installDate) document.getElementById('installDate').value = report.installDate;
    if (report.installTime) document.getElementById('installTime').value = report.installTime;
    if (report.installAddress) document.getElementById('installAddress').value = report.installAddress;
    if (report.notes) document.getElementById('notes').value = report.notes;
    if (report.installerName) {
      const installerInput = document.getElementById('installerName');
      if (installerInput) installerInput.value = report.installerName;
    }
    
    // 이미지 파일 복원 (Base64 -> File)
    if (report.attachmentImage && report.attachmentFileName) {
      try {
        const base64 = report.attachmentImage;
        const contentType = report.attachmentContentType || 'image/png';
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        uploadedImageFile = new File([blob], report.attachmentFileName, { type: contentType });
      } catch (error) {
        console.warn('Failed to restore image file:', error);
      }
    }
    
    // ★ 핵심: report에 연결된 assignment 복원 (selectedAssignment 복원)
    // loadReport 후 저장 시 assignmentId가 null이 되는 버그 방지
    const reportAssignmentId = report.assignmentId || report.assignment_id || report.customerInfo?.assignmentId;
    if (reportAssignmentId && currentAssignments && currentAssignments.length > 0) {
      const linkedAssignment = currentAssignments.find(a => a.assignment_id === reportAssignmentId);
      if (linkedAssignment) {
        selectedAssignment = linkedAssignment;
        console.log('[loadReport] selectedAssignment restored:', reportAssignmentId);
      }
    }
    // currentAssignments가 비어있을 때는 assignment_id만 ocrData에 보존
    if (reportAssignmentId && !selectedAssignment) {
      if (!ocrData) ocrData = {};
      ocrData.assignmentId = reportAssignmentId;
      console.log('[loadReport] assignmentId preserved in ocrData:', reportAssignmentId);
    }

    alert(`✅ 문서를 불러왔습니다!\n\n고객명: ${ocrData.receiverName || '-'}\n\n3단계에서 확인하고 수정할 수 있습니다.`);
    
    // 3단계로 바로 이동 (제품이 없으면 2단계로)
    currentStep = (selectedPackages && selectedPackages.length > 0) ? 3 : 2;
    updateStepIndicator();
    showCurrentSection();
    
  } catch (error) {
    console.error('Load report error:', error);
    alert('❌ 문서를 불러오는 중 오류가 발생했습니다.');
  }
}

// 문서 삭제
async function deleteReport(reportId) {
  if (!confirm('정말 이 문서를 삭제하시겠습니까?')) {
    return;
  }
  
  try {
    // 서버에서 먼저 삭제 (실패 시 중단)
    const response = await axios.delete(`/api/reports/${reportId}`, { timeout: 10000 });
    if (!response.data.success) {
      alert('❌ 문서 삭제 실패: ' + (response.data.message || '오류가 발생했습니다.'));
      return;
    }

    // 서버 삭제 성공 후 로컬스토리지에서도 삭제
    const localReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
    const filteredReports = localReports.filter(r => r.reportId !== reportId && r.id !== reportId);
    localStorage.setItem('pv5_reports', JSON.stringify(filteredReports));
    
    alert('✅ 문서가 삭제되었습니다.');
    
    // 목록 새로고침
    loadReportsList();
    
  } catch (error) {
    console.error('Delete report error:', error);
    alert('❌ 문서 삭제 중 오류가 발생했습니다.\n' + (error.response?.data?.message || error.message || ''));
  }
}

// ── 문서 검색 (상태 필터 추가 + 실시간 검색 결과 카운트) ──────────
function searchReports() {
  const startDate    = document.getElementById('searchStartDate')?.value || '';
  const endDate      = document.getElementById('searchEndDate')?.value || '';
  const customerName = (document.getElementById('searchCustomerName')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('searchStatus')?.value || '';

  let filtered = [...allReports];

  // 날짜 필터
  if (startDate) {
    filtered = filtered.filter(r => (r.installDate || '') >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(r => (r.installDate || '') <= endDate);
  }

  // 고객명/주소/시공자 통합 키워드 검색
  if (customerName) {
    filtered = filtered.filter(r => {
      const name    = (r.customerInfo?.receiverName || r.customerName || '').toLowerCase();
      const address = (r.installAddress || '').toLowerCase();
      const worker  = (r.installerName || '').toLowerCase();
      return name.includes(customerName) || address.includes(customerName) || worker.includes(customerName);
    });
  }

  // 상태 필터
  if (statusFilter) {
    filtered = filtered.filter(r => (r.status || 'draft') === statusFilter);
  }

  // 결과 건수 표시
  const countEl = document.getElementById('searchResultCount');
  if (countEl) {
    const total = allReports.length;
    countEl.textContent = customerName || startDate || endDate || statusFilter
      ? `${filtered.length} / ${total}건`
      : `전체 ${total}건`;
  }

  displayReportsList(filtered);
}

// 검색 초기화
function resetSearch() {
  const ids = ['searchStartDate','searchEndDate','searchCustomerName','searchStatus'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const countEl = document.getElementById('searchResultCount');
  if (countEl) countEl.textContent = `전체 ${allReports.length}건`;
  displayReportsList(allReports);
}

// Step 5 진입 시 목록 로드
function enterStep5() {
  loadReportsList();
}

// 문서 상세보기 (미리보기 모달)
async function showReportPreview(reportId) {
  try {
    // 로컬스토리지에서 먼저 찾기
    const localReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
    let report = localReports.find(r => r.reportId === reportId || r.id === reportId);
    
    // 서버에서도 시도
    if (!report) {
      try {
        const response = await axios.get(`/api/reports/${reportId}`, { timeout: 10000 });
        if (response.data.success) {
          report = response.data.report;
        }
      } catch (error) {
        console.warn('Server load failed, using local storage:', error);
      }
    }
    
    if (!report) {
      alert('❌ 문서를 찾을 수 없습니다.');
      return;
    }
    
    // 미리보기 HTML 생성 (Step 4와 동일한 구조)
    const customerInfo = report.customerInfo || {};
    const packages = report.packages || [];
    const packagePositions = report.packagePositions || {}; // UPDATED
    const installDate = report.installDate || '-';
    const installTime = report.installTime || '-';
    const installAddress = report.installAddress || '-';
    const notes = report.notes || '';
    const installerName = report.installerName || '-';
    
    // 모달 HTML
    const modalHTML = `
      <div id="previewModal" class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closePreviewModal(event)">
        <div class="modal-content bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
          <!-- 모달 헤더 -->
          <div class="modal-header sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg flex justify-between items-center">
            <h2 class="text-2xl font-bold">
              <i class="fas fa-file-alt mr-2"></i>
              시공 확인서 상세보기
            </h2>
            <button onclick="closePreviewModal()" class="text-white hover:text-gray-200 text-3xl leading-none">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <!-- 모달 내용 -->
          <div class="p-6">
            <div class="border-2 border-gray-300 rounded-lg p-6">
              <h3 class="text-2xl font-bold mb-6 text-center text-blue-600">
                PV5 시공(예약) 확인서
              </h3>
              
              <!-- 고객 정보 -->
              <div class="mb-6 pb-6 border-b-2 border-blue-200 bg-blue-50 p-5 rounded-lg">
                <h4 class="font-black text-xl mb-4 text-blue-800 border-b-2 border-blue-300 pb-2">
                  <i class="fas fa-user-circle mr-2 text-blue-600"></i>👤 고객 정보
                </h4>
                <div class="grid grid-cols-2 gap-4 text-base">
                  <div class="bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">접수일자:</strong> <span class="text-gray-900 font-semibold">${report.createdAt ? new Date(report.createdAt).toLocaleDateString('ko-KR', {year:'numeric',month:'2-digit',day:'2-digit'}) : '-'}</span></div>
                  <div class="bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">상품명:</strong> <span class="text-gray-900 font-semibold">${packages.length > 0 ? packages.map(p => p.fullName || p.name || '').filter(Boolean).join(', ') : (customerInfo.productCode || '-')}</span></div>
                  <div class="bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">고객명:</strong> <span class="text-blue-700 font-bold text-lg">${customerInfo.receiverName || '-'}</span></div>
                  <div class="bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">연락처:</strong> <span class="text-blue-700 font-bold text-lg">${customerInfo.receiverPhone || '-'}</span></div>
                  <div class="col-span-2 bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">주소:</strong> <span class="text-gray-900 font-semibold">${customerInfo.receiverAddress || '-'}</span></div>
                  <div class="col-span-2 bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">주문번호:</strong> <span class="text-gray-900 font-semibold">${customerInfo.orderNumber || '-'}</span></div>
                </div>
              </div>
              
              <!-- 제품 정보 -->
              <div class="mb-6 pb-6 border-b">
                <h4 class="font-bold text-lg mb-3 text-gray-800">
                  <i class="fas fa-box mr-2 text-blue-600"></i>선택 제품 (${packages.length}개)
                </h4>
                ${packages.map(pkg => `
                  <div class="flex items-start space-x-4 mb-4 pb-4 ${packages.length > 1 ? 'border-b border-gray-200' : ''}">
                    <img src="${pkg.image || ''}" 
                         alt="${pkg.name || ''}" 
                         class="w-32 h-24 object-cover rounded-lg"
                         onerror="this.style.display='none'">
                    <div class="flex-1">
                      <div class="font-bold text-lg">${pkg.fullName || '-'}</div>
                      <div class="text-sm text-gray-600 mt-1">${pkg.description || '-'}</div>
                      ${pkg.hasPositionOption && packagePositions[pkg.id] ? ` <!-- UPDATED -->
                        <div class="mt-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-200"> <!-- UPDATED -->
                          <strong class="text-gray-800 text-base">3단 선반 설치:</strong> <!-- UPDATED -->
                          ${packagePositions[pkg.id].left ? '<span class="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-base mr-2">좌측</span>' : ''} <!-- UPDATED -->
                          ${packagePositions[pkg.id].right ? '<span class="inline-block px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-base">우측</span>' : ''} <!-- UPDATED -->
                          ${!packagePositions[pkg.id].left && !packagePositions[pkg.id].right ? '<span class="text-red-600 font-bold text-base">미선택</span>' : ''} <!-- UPDATED -->
                        </div> <!-- UPDATED -->
                      ` : ''} <!-- UPDATED -->
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <!-- 설치 정보 -->
              <div class="mb-6 pb-6 border-b-2 border-green-200 bg-green-50 p-5 rounded-lg">
                <h4 class="font-black text-xl mb-4 text-green-800 border-b-2 border-green-300 pb-2">
                  <i class="fas fa-calendar-check mr-2 text-green-600"></i>📅 설치 정보
                </h4>
                <div class="grid grid-cols-2 gap-4 text-base">
                  <div class="bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">설치 날짜:</strong> <span class="text-green-700 font-bold text-lg">${installDate}</span></div>
                  <div class="bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">설치 시간:</strong> <span class="text-green-700 font-bold text-lg">${installTime}</span></div>
                  <div class="col-span-2 bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">설치 주소:</strong> <span class="text-gray-900 font-semibold">${installAddress}</span></div>
                  ${notes ? `<div class="col-span-2 bg-yellow-50 p-3 rounded shadow-sm border-l-4 border-yellow-400"><strong class="text-gray-700">특이사항:</strong> <span class="text-gray-900 font-semibold">${notes}</span></div>` : ''}
                </div>
              </div>
              
              <!-- 접수/작성자 -->
              <div class="mt-6">
                <div class="border-2 border-gray-300 rounded-lg p-4 max-w-md">
                  <label class="font-black text-xl mb-3 block">접수 / 작성자:</label>
                  <div class="text-lg font-bold">${installerName}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 모달 푸터 -->
          <div class="modal-footer sticky bottom-0 bg-gray-50 p-6 rounded-b-lg flex justify-end space-x-4">
            <button onclick="closePreviewModal()" 
                    class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100">
              <i class="fas fa-times mr-2"></i>닫기
            </button>
            <button onclick="saveAsJPG()" 
                    class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
              <i class="fas fa-image mr-2"></i>JPG로 저장하기
            </button>
            <button onclick="window.print()" 
                    class="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
              <i class="fas fa-print mr-2"></i>인쇄
            </button>
            <button onclick="closePreviewModal(); loadReport('${reportId}')" 
                    class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              <i class="fas fa-edit mr-2"></i>수정하기
            </button>
          </div>
        </div>
      </div>
    `;
    
    // 모달을 body에 추가
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 스크롤 방지
    document.body.style.overflow = 'hidden';
    
  } catch (error) {
    console.error('Preview error:', error);
    alert('❌ 미리보기를 불러오는데 실패했습니다.');
  }
}

// 미리보기 모달 닫기
function closePreviewModal(event) {
  // 배경 클릭 또는 닫기 버튼 클릭 시
  if (!event || event.target.id === 'previewModal' || event.currentTarget === event.target) {
    const modal = document.getElementById('previewModal');
    if (modal) {
      modal.remove();
      document.body.style.overflow = 'auto';
    }
  }
}

// JPG로 저장하기 // UPDATED
async function saveAsJPG() { // UPDATED
  try { // UPDATED
    // html2canvas 라이브러리가 로드되어 있는지 확인 // UPDATED
    if (typeof html2canvas === 'undefined') { // UPDATED
      // html2canvas 동적 로드 // UPDATED
      const script = document.createElement('script'); // UPDATED
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'; // UPDATED
      script.onload = () => saveAsJPG(); // 로드 완료 후 재실행 // UPDATED
      document.head.appendChild(script); // UPDATED
      return; // UPDATED
    } // UPDATED
    // UPDATED
    // 모달 내용 캡처 // UPDATED
    const modalContent = document.querySelector('#previewModal .modal-content'); // UPDATED
    if (!modalContent) { // UPDATED
      alert('❌ 저장할 내용을 찾을 수 없습니다.'); // UPDATED
      return; // UPDATED
    } // UPDATED
    // UPDATED
    // 스크롤 위치 저장 및 맨 위로 이동 // UPDATED
    const originalScrollTop = modalContent.scrollTop; // UPDATED
    modalContent.scrollTop = 0; // UPDATED
    // UPDATED
    // 높이 제한 임시 해제 // UPDATED
    const originalMaxHeight = modalContent.style.maxHeight; // UPDATED
    const originalOverflow = modalContent.style.overflow; // UPDATED
    modalContent.style.maxHeight = 'none'; // UPDATED
    modalContent.style.overflow = 'visible'; // UPDATED
    // UPDATED
    // 버튼 영역 임시 숨김 // UPDATED
    const footer = modalContent.querySelector('.modal-footer'); // UPDATED
    if (footer) footer.style.display = 'none'; // UPDATED
    // UPDATED
    // Canvas로 변환 // UPDATED
    const canvas = await html2canvas(modalContent, { // UPDATED
      backgroundColor: '#ffffff', // UPDATED
      scale: 2, // 고해상도 // UPDATED
      logging: false, // UPDATED
      useCORS: true, // UPDATED
      windowWidth: modalContent.scrollWidth, // UPDATED
      windowHeight: modalContent.scrollHeight // UPDATED
    }); // UPDATED
    // UPDATED
    // 원래 스타일 복원 // UPDATED
    modalContent.style.maxHeight = originalMaxHeight; // UPDATED
    modalContent.style.overflow = originalOverflow; // UPDATED
    modalContent.scrollTop = originalScrollTop; // UPDATED
    if (footer) footer.style.display = 'flex'; // UPDATED
    // UPDATED
    // Canvas를 JPG로 변환 및 다운로드 // UPDATED
    canvas.toBlob((blob) => { // UPDATED
      const url = URL.createObjectURL(blob); // UPDATED
      const link = document.createElement('a'); // UPDATED
      link.href = url; // UPDATED
      link.download = `PV5_시공확인서_${new Date().toISOString().slice(0, 10)}.jpg`; // UPDATED
      document.body.appendChild(link); // UPDATED
      link.click(); // UPDATED
      document.body.removeChild(link); // UPDATED
      URL.revokeObjectURL(url); // UPDATED
      // UPDATED
      alert('✅ JPG 파일로 저장되었습니다!'); // UPDATED
    }, 'image/jpeg', 0.95); // JPG 품질 95% // UPDATED
    // UPDATED
  } catch (error) { // UPDATED
    console.error('JPG save error:', error); // UPDATED
    alert('❌ JPG 저장 실패: ' + error.message); // UPDATED
  } // UPDATED
} // UPDATED

// 리포트를 JPG로 저장 (Step 5 달력/목록에서 호출)
async function saveReportAsJPG(reportId) {
  try {
    // 리포트 데이터 가져오기
    const report = await loadReportData(reportId);
    if (!report) {
      alert('❌ 리포트를 찾을 수 없습니다.');
      return;
    }
    
    // html2canvas 라이브러리 확인 및 로드
    if (typeof html2canvas === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = () => saveReportAsJPG(reportId);
      document.head.appendChild(script);
      return;
    }
    
    // 임시 컨테이너 생성
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.padding = '20px';
    document.body.appendChild(tempContainer);
    
    // 리포트 HTML 생성
    const customerName = report.customer_info?.receiverName || report.customer_name || '고객명 없음';
    const installDate = report.install_date || '미정';
    const installTime = report.install_time || '미정';
    const installAddress = report.install_address || '미정';
    const notes = report.notes || '없음';
    const installerName = report.installer_name || '미정';
    
    let productsHTML = '';
    if (report.packages && report.packages.length > 0) {
      productsHTML = report.packages.map(pkg => `
        <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h4 style="font-weight: bold; margin-bottom: 5px;">${pkg.fullName || pkg.name}</h4>
          <p style="font-size: 14px; color: #666;">${pkg.description || ''}</p>
        </div>
      `).join('');
    }
    
    tempContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 800px;">
        <h1 style="text-align: center; color: #7c3aed; margin-bottom: 20px;">PV5 시공(예약) 확인서</h1>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 10px;">고객 정보</h3>
          <p><strong>고객명:</strong> ${customerName}</p>
          <p><strong>연락처:</strong> ${report.customer_info?.receiverPhone || '미정'}</p>
          <p><strong>주소:</strong> ${report.customer_info?.receiverAddress || '미정'}</p>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 10px;">선택 제품</h3>
          ${productsHTML || '<p>제품 정보 없음</p>'}
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 10px;">설치 정보</h3>
          <p><strong>설치 날짜:</strong> ${installDate}</p>
          <p><strong>설치 시간:</strong> ${installTime}</p>
          <p><strong>설치 주소:</strong> ${installAddress}</p>
          <p><strong>특이사항:</strong> ${notes}</p>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 10px;">담당자</h3>
          <p><strong>시공 담당자:</strong> ${installerName}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <p style="font-size: 12px; color: #666;">설치 주소: ${installAddress}</p>
          <p style="font-size: 12px; color: #666;">설치 시간: ${installTime}</p>
        </div>
      </div>
    `;
    
    // Canvas로 변환
    const canvas = await html2canvas(tempContainer, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    // 임시 컨테이너 제거
    document.body.removeChild(tempContainer);
    
    // Canvas를 JPG로 변환 및 다운로드
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PV5_${customerName}_${installDate}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('✅ JPG 파일로 저장되었습니다!');
    }, 'image/jpeg', 0.95);
    
  } catch (error) {
    console.error('❌ JPG 저장 오류:', error);
    alert('❌ JPG 저장 실패: ' + error.message);
  }
}

// 리포트 데이터 가져오기 (서버 우선, localStorage 폴백)
async function loadReportData(reportId) {
  try {
    // 서버에서 가져오기
    const response = await axios.get(`/api/reports/${reportId}`, { timeout: 10000 });
    if (response.data && response.data.id) {
      return response.data;
    }
  } catch (error) {
    console.warn('⚠️ 서버에서 리포트 로드 실패, localStorage 확인:', error);
  }
  
  // localStorage에서 찾기
  const localData = localStorage.getItem('pv5_reports');
  if (localData) {
    try {
      const reports = JSON.parse(localData);
      const report = reports.find(r => r.id === reportId || r.reportId === reportId);
      if (report) {
        return report;
      }
    } catch (e) {
      console.error('❌ localStorage 파싱 오류:', e);
    }
  }
  
  return null;
}

// 신규 접수를 위한 초기화
function resetForNewReport() {
  console.log('Resetting for new report...');

  // 1. 전역 변수 초기화
  selectedAssignment = null;
  selectedPackages = [];
  currentReportId = null;
  packagePositions = {};
  resetAccessories(); // 악세사리 선택 초기화
  
  // 2. Step 3 입력 필드 초기화
  const installDate = document.getElementById('installDate');
  const installTime = document.getElementById('installTime');
  const installAddress = document.getElementById('installAddress');
  const notes = document.getElementById('notes');
  
  if (installDate) installDate.value = '';
  if (installTime) installTime.value = '';
  if (installAddress) installAddress.value = '';
  if (notes) notes.value = '';
  
  // 3. Step 4 입력 필드 초기화
  const installerName = document.getElementById('installerName');
  const recipientEmail = document.getElementById('recipientEmail');
  
  if (installerName) installerName.value = '';
  if (recipientEmail) recipientEmail.value = '';
  
  // 4. Step 1로 이동 + 접수 목록 새로고침
  currentStep = 1;
  updateStepIndicator();
  showCurrentSection();
  renderStep1AssignmentList();

  console.log('Reset complete. Ready for new assignment.');
}

// Excel 내보내기
async function exportToExcel() {
  try {
    // ★ 전역 allReports(5단계에서 이미 로드된 최신 서버 데이터) 우선 사용
    // 없으면 서버 API 재호출 → 그래도 없으면 localStorage fallback
    let excelReports = (allReports && allReports.length > 0) ? allReports : [];

    if (excelReports.length === 0) {
      try {
        const listUrl = viewBranchId
          ? `/api/reports/list?viewBranchId=${viewBranchId}`
          : '/api/reports/list';
        const res = await axios.get(listUrl, { timeout: 15000 });
        if (res.data.success && res.data.reports.length > 0) {
          excelReports = res.data.reports;
        }
      } catch (serverErr) {
        console.warn('[Excel] 서버 조회 실패, localStorage fallback:', serverErr);
      }
    }

    // 그래도 없으면 localStorage fallback
    if (excelReports.length === 0) {
      excelReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
    }

    if (excelReports.length === 0) {
      alert('⚠️ 내보낼 데이터가 없습니다.\n5단계에서 문서 목록을 먼저 불러와 주세요.');
      return;
    }

    // 이하에서 excelReports 사용
    const allReportsForExcel = excelReports;

    // Excel 데이터 준비
    const excelData = allReportsForExcel.map(report => {
      // ★ customerInfo가 문자열로 온 경우(이중직렬화) 파싱 처리
      let customerInfo = report.customerInfo || {};
      if (typeof customerInfo === 'string') {
        try { customerInfo = JSON.parse(customerInfo); } catch(e) { customerInfo = {}; }
      }

      const packages = report.packages || [];
      const productNames = packages.map(pkg => pkg.fullName || pkg.name).filter(name => name && name !== '-').join(', ');

      // ★ 모든 가능한 필드명 커버 (구버전/신버전 데이터 혼재 대비)
      const phone = customerInfo.receiverPhone
                 || customerInfo.phone
                 || customerInfo.customerPhone
                 || report.customerPhone
                 || '-';
      const address = customerInfo.receiverAddress
                   || customerInfo.address
                   || customerInfo.customerAddress
                   || report.installAddress
                   || '-';

      return {
        '문서ID':   report.reportId || report.id || '-',
        '고객명':   customerInfo.receiverName || customerInfo.name || report.customerName || '-',
        '연락처':   phone,
        '주소':     address,
        '설치날짜': report.installDate || '-',
        '설치시간': report.installTime || '-',
        '설치주소': report.installAddress || '-',
        '제품명':   productNames || customerInfo.productName || '-',
        '특이사항': report.notes || '-',
        '작성자':   report.installerName || '-',
        '저장시간': report.createdAt || '-'
      };
    });

    // Excel 워크북 생성
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '시공확인서');

    // 컬럼 너비 자동 조정
    ws['!cols'] = [
      { wch: 20 }, // 문서ID
      { wch: 12 }, // 고객명
      { wch: 15 }, // 연락처
      { wch: 30 }, // 주소
      { wch: 12 }, // 설치날짜
      { wch: 10 }, // 설치시간
      { wch: 30 }, // 설치주소
      { wch: 35 }, // 제품명
      { wch: 25 }, // 특이사항
      { wch: 12 }, // 작성자
      { wch: 20 }  // 저장시간
    ];

    // 파일 다운로드
    const fileName = `PV5_시공확인서_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);

    alert(`✅ Excel 파일을 내보냈습니다!\n\n문서 개수: ${allReportsForExcel.length}개\n파일명: ${fileName}`);

  } catch (error) {
    console.error('Excel export error:', error);
    alert('❌ Excel 내보내기 실패: ' + error.message);
  }
}

// Excel 가져오기
function importFromExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      // Excel 파일 읽기
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // 첫 번째 시트 읽기
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet);
      
      if (rows.length === 0) {
        alert('⚠️ Excel 파일에 데이터가 없습니다.');
        event.target.value = '';
        return;
      }
      
      // 기존 데이터 확인
      const existingReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
      const confirmMsg = existingReports.length > 0
        ? `⚠️ 기존 데이터 ${existingReports.length}개가 모두 삭제됩니다!\n\nExcel 파일의 ${rows.length}개 문서로 덮어쓰시겠습니까?`
        : `Excel 파일에서 ${rows.length}개 문서를 가져오시겠습니까?`;
      
      if (!confirm(confirmMsg)) {
        event.target.value = '';
        return;
      }
      
      // Excel 데이터를 앱 형식으로 변환
      const importedReports = rows.map(row => {
        // 제품명 파싱 (쉼표로 구분)
        const productNamesStr = row['제품명'] || '';
        const productNames = productNamesStr.split(',').map(name => name.trim()).filter(name => name && name !== '-');
        const packages = productNames.map(name => ({
          name: name,
          fullName: name,
          id: '',
          brand: '',
          price: 0
        }));
        
        return {
          reportId: row['문서ID'] || `REPORT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          customerInfo: {
            receiverName: row['고객명'] || '',
            phone: row['연락처'] || '',
            address: row['주소'] || ''
          },
          packages: packages,
          installDate: row['설치날짜'] || '',
          installTime: row['설치시간'] || '',
          installAddress: row['설치주소'] || '',
          notes: row['특이사항'] || '',
          installerName: row['작성자'] || '',
          createdAt: row['저장시간'] || new Date().toISOString()
        };
      });
      
      // 로컬스토리지에 저장 (덮어쓰기)
      localStorage.setItem('pv5_reports', JSON.stringify(importedReports));
      
      alert(`✅ Excel 데이터를 가져왔습니다!\n\n가져온 문서: ${importedReports.length}개`);
      
      // 목록 새로고침
      loadReportsList();
      
      // 파일 입력 초기화
      event.target.value = '';
      
    } catch (error) {
      console.error('Excel import error:', error);
      alert('❌ Excel 파일 읽기 실패: ' + error.message);
      event.target.value = '';
    }
  };
  
  reader.readAsArrayBuffer(file);
}

// 데이터 초기화 확인
function confirmDataReset() {
  const allReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
  
  if (allReports.length === 0) {
    alert('⚠️ 초기화할 데이터가 없습니다.');
    return;
  }
  
  const confirmed = confirm(
    `⚠️ 데이터 초기화 경고!\n\n` +
    `현재 저장된 문서 ${allReports.length}개가 모두 삭제됩니다.\n\n` +
    `진행하기 전에 "전체 데이터 내보내기"로 백업을 권장합니다.\n\n` +
    `정말로 초기화하시겠습니까?`
  );
  
  if (confirmed) {
    const doubleConfirm = confirm(
      `⚠️ 최종 확인!\n\n` +
      `${allReports.length}개의 문서가 영구 삭제됩니다.\n` +
      `이 작업은 되돌릴 수 없습니다.\n\n` +
      `백업하셨습니까? 계속하시겠습니까?`
    );
    
    if (doubleConfirm) {
      localStorage.removeItem('pv5_reports');
      alert('✅ 데이터가 초기화되었습니다.');
      loadReportsList();
    }
  }
}

// ========== Step 6: 매출 관리 기능 ==========

// 예약 확정 처리 (이중클릭 방지)
const confirmingSet = new Set();
async function confirmReport(reportId) {
  if (confirmingSet.has(reportId)) return;
  if (!confirm('이 예약을 확정하시겠습니까?\n\n예약 확정 후 시공 완료 처리가 가능합니다.')) return;

  confirmingSet.add(reportId);
  try {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`/api/reports/${reportId}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      alert('✅ 예약이 확정되었습니다!');
      loadReportsList();
    } else {
      alert('❌ 예약 확정 실패: ' + (response.data.message || '알 수 없는 오류'));
    }
  } catch (error) {
    console.error('Confirm report error:', error);
    alert('❌ 예약 확정 중 오류가 발생했습니다.');
  } finally {
    confirmingSet.delete(reportId);
  }
}

// 시공 완료 처리 (이중클릭 방지)
const completingSet = new Set();
async function completeReport(reportId) {
  if (completingSet.has(reportId)) return;
  if (!confirm('이 문서를 시공 완료로 표시하시겠습니까?\n\n시공 완료된 문서는 "매출 관리" 탭에서 확인할 수 있습니다.')) return;

  completingSet.add(reportId);
  try {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`/api/reports/${reportId}/complete`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      alert('✅ 시공이 완료되었습니다!');
      loadReportsList(); // 목록 새로고침
      
      // Step 6 (매출 관리)로 자동 이동
      goToStep(6);
    } else {
      // 마이그레이션 필요 오류
      if (response.data.needsMigration) {
        const goToStep6 = confirm(
          '⚠️ D1 마이그레이션이 필요합니다.\n\n' +
          '매출 관리 기능을 사용하려면 Cloudflare Dashboard에서\n' +
          'D1 데이터베이스에 status 컬럼을 추가해야 합니다.\n\n' +
          '자세한 방법은 README.md를 참고하세요.\n\n' +
          'Step 6 (매출 관리) 페이지로 이동하시겠습니까?\n' +
          '(마이그레이션 안내를 확인할 수 있습니다)'
        );
        
        if (goToStep6) {
          goToStep(6);
        }
      } else {
        alert('❌ ' + (response.data.message || '시공 완료 처리 실패'));
      }
    }
  } catch (error) {
    console.error('Complete report error:', error);
    
    // 네트워크 오류 또는 서버 오류
    const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
    const needsMigration = error.response?.data?.needsMigration;
    
    if (needsMigration) {
      const goToStep6 = confirm(
        '⚠️ D1 마이그레이션이 필요합니다.\n\n' +
        errorMsg + '\n\n' +
        'Step 6 (매출 관리) 페이지로 이동하시겠습니까?\n' +
        '(마이그레이션 안내를 확인할 수 있습니다)'
      );
      
      if (goToStep6) {
        goToStep(6);
      }
    } else {
      alert('❌ 시공 완료 처리 중 오류가 발생했습니다.\n\n' + errorMsg);
    }
  } finally {
    completingSet.delete(reportId);
  }
}

// 매출 관리 목록 로드
async function loadRevenueList(filterType = 'all', startDate = null, endDate = null, customerName = '') {
  try {
    // 본사 대리 접속 시 viewBranchId 파라미터 전달
    const completedUrl = viewBranchId
      ? `/api/reports/completed/list?viewBranchId=${viewBranchId}`
      : '/api/reports/completed/list';
    const response = await axios.get(completedUrl);
    
    if (response.data.success) {
      const reports = response.data.reports;
      
      // ⚠️ 마이그레이션 알림은 수동으로만 숨김 (자동 숨김 비활성화)
      // 이유: 0002 마이그레이션만 완료되어도 API가 성공하지만,
      //       0003 마이그레이션(confirmed 상태)는 별도로 필요
      // const migrationAlert = document.getElementById('migrationAlert');
      // if (migrationAlert) {
      //   migrationAlert.style.display = 'none';
      // }
      
      // 날짜 필터링
      let filteredReports = reports;

      // 고객명 필터
      if (customerName && customerName.trim() !== '') {
        const keyword = customerName.trim().toLowerCase();
        filteredReports = filteredReports.filter(r => {
          const name = (r.customerInfo?.receiverName || r.customerName || '').toLowerCase();
          return name.includes(keyword);
        });
      }
      
      if (filterType === 'week') {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        filteredReports = reports.filter(r => {
          const installDate = new Date(r.installDate);
          return installDate >= monday && installDate <= sunday;
        });
      } else if (filterType === 'month') {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        
        filteredReports = reports.filter(r => {
          const installDate = new Date(r.installDate);
          return installDate >= firstDay && installDate <= lastDay;
        });
      } else if (filterType === 'quarter') {
        const today = new Date();
        const quarter = Math.floor(today.getMonth() / 3);
        const firstDay = new Date(today.getFullYear(), quarter * 3, 1);
        const lastDay = new Date(today.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
        
        filteredReports = reports.filter(r => {
          const installDate = new Date(r.installDate);
          return installDate >= firstDay && installDate <= lastDay;
        });
      } else if (filterType === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        filteredReports = reports.filter(r => {
          const installDate = new Date(r.installDate);
          return installDate >= start && installDate <= end;
        });
      }
      
      displayRevenueList(filteredReports);
    } else {
      // 마이그레이션 메시지가 있으면 로그만 출력 (UI에 이미 표시됨)
      if (response.data.message) {
        console.log('Revenue list info:', response.data.message);
      }
      // 빈 목록 표시 (오류 alert 제거)
      displayRevenueList([]);
    }
  } catch (error) {
    console.error('Load revenue list error:', error);
    // 오류 발생 시에도 빈 목록 표시 (alert 제거)
    // Step 6 UI에 이미 마이그레이션 안내가 표시되어 있음
    displayRevenueList([]);
  }
}

// 매출 목록 표시
function displayRevenueList(reports) {
  // 실제 HTML 구조에 맞게 수정
  const tableBody = document.getElementById('revenueTableBody');
  const cardList = document.getElementById('revenueCardList');
  const totalRevenueEl = document.getElementById('totalRevenue');
  const totalCountEl = document.getElementById('totalCount');
  const averageRevenueEl = document.getElementById('averageRevenue');
  
  if (!tableBody) {
    console.error('revenueTableBody not found');
    return;
  }
  
  if (!reports || reports.length === 0) {
    // 데스크톱 테이블
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="border border-gray-300 px-4 py-12 text-center text-gray-500">
          <i class="fas fa-chart-line text-6xl mb-4 block"></i>
          <p>시공 완료된 문서가 없습니다.</p>
          <p class="text-sm mt-2">Step 5에서 "시공 완료" 버튼을 클릭하세요.</p>
        </td>
      </tr>
    `;
    // 모바일 카드
    if (cardList) {
      cardList.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-chart-line text-6xl mb-4 block"></i>
          <p>시공 완료된 문서가 없습니다.</p>
          <p class="text-sm mt-2">Step 5에서 "시공 완료" 버튼을 클릭하세요.</p>
        </div>
      `;
    }
    if (totalRevenueEl) totalRevenueEl.textContent = '₩0';
    if (totalCountEl) totalCountEl.textContent = '0건';
    if (averageRevenueEl) averageRevenueEl.textContent = '₩0';
    return;
  }
  
  // 매출 통계 계산
  let totalRevenue = 0;
  let totalConsumerPrice = 0;
  const revenueDetails = [];
  
  reports.forEach(report => {
    const packages = report.packages || [];
    let reportRevenue = 0;
    let reportConsumerPrice = 0;
    
    packages.forEach(pkg => {
      const margin = getMarginByPackageId(pkg.id);
      if (margin) {
        reportRevenue += margin.revenue;
        reportConsumerPrice += margin.consumerPrice;
      }
    });
    
    totalRevenue += reportRevenue;
    totalConsumerPrice += reportConsumerPrice;
    
    revenueDetails.push({
      ...report,
      revenue: reportRevenue,
      consumerPrice: reportConsumerPrice
    });
  });
  
  // 통계 업데이트
  const averageRevenue = reports.length > 0 ? Math.round(totalRevenue / reports.length) : 0;
  if (totalRevenueEl) totalRevenueEl.textContent = '₩' + totalRevenue.toLocaleString();
  if (totalCountEl) totalCountEl.textContent = reports.length + '건';
  if (averageRevenueEl) averageRevenueEl.textContent = '₩' + averageRevenue.toLocaleString();
  
  // 데스크톱 테이블 목록 업데이트
  tableBody.innerHTML = revenueDetails.map(report => {
    const customerName = report.customerInfo?.receiverName || '-';
    const installDate = report.installDate || '-';
    const installerName = report.installerName || '-';
    const packages = report.packages || [];
    const productNames = packages.map(p => p.fullName || p.name).join(', ');
    const marginRate = report.consumerPrice > 0 
      ? ((report.revenue / report.consumerPrice) * 100).toFixed(1) 
      : 0;
    
    return `
      <tr class="hover:bg-gray-50">
        <td class="border border-gray-300 px-4 py-3">${installDate}</td>
        <td class="border border-gray-300 px-4 py-3 font-semibold">${customerName}</td>
        <td class="border border-gray-300 px-4 py-3 text-sm">${productNames || '-'}</td>
        <td class="border border-gray-300 px-4 py-3 text-right">₩${report.consumerPrice.toLocaleString()}</td>
        <td class="border border-gray-300 px-4 py-3 text-right font-bold text-blue-600">₩${report.revenue.toLocaleString()}</td>
        <td class="border border-gray-300 px-4 py-3 text-center">
          <span class="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            ${marginRate}%
          </span>
        </td>
        <td class="border border-gray-300 px-4 py-3">${installerName}</td>
      </tr>
    `;
  }).join('');
  
  // 모바일 카드 목록 업데이트
  if (cardList) {
    cardList.innerHTML = revenueDetails.map(report => {
      const customerName = report.customerInfo?.receiverName || '-';
      const installDate = report.installDate || '-';
      const installerName = report.installerName || '-';
      const packages = report.packages || [];
      const productNames = packages.map(p => p.fullName || p.name).join(', ');
      const marginRate = report.consumerPrice > 0 
        ? ((report.revenue / report.consumerPrice) * 100).toFixed(1) 
        : 0;
      
      return `
        <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <!-- 고객명 & 날짜 -->
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-bold text-gray-800">${customerName}</h3>
            <span class="text-sm text-gray-500">${installDate}</span>
          </div>
          
          <!-- 제품 정보 -->
          <div class="mb-3 pb-3 border-b border-gray-200">
            <p class="text-sm text-gray-600 mb-1">
              <i class="fas fa-box text-purple-600 mr-1"></i>
              <span class="font-semibold">제품:</span>
            </p>
            <p class="text-sm text-gray-800 pl-5">${productNames || '-'}</p>
          </div>
          
          <!-- 매출 정보 -->
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="bg-gray-50 p-3 rounded-lg">
              <p class="text-xs text-gray-600 mb-1">소비자 가격</p>
              <p class="text-base font-semibold text-gray-800">₩${report.consumerPrice.toLocaleString()}</p>
            </div>
            <div class="bg-blue-50 p-3 rounded-lg">
              <p class="text-xs text-blue-600 mb-1">매출</p>
              <p class="text-base font-bold text-blue-600">₩${report.revenue.toLocaleString()}</p>
            </div>
          </div>
          
          <!-- 마진율 & 접수/작성자 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-600">마진율:</span>
              <span class="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                ${marginRate}%
              </span>
            </div>
            <div class="flex items-center gap-1 text-sm text-gray-600">
              <i class="fas fa-user text-gray-400"></i>
              <span>${installerName}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// 제품 ID로 매출 데이터 가져오기 (margins.ts 매핑)
function getMarginByPackageId(packageId) {
  const marginData = {
    'milwaukee-partition-panel': { consumerPrice: 968000, revenue: 213620, marginRate: 22.1 },
    'milwaukee-2shelf-partition': { consumerPrice: 1210000, revenue: 251900, marginRate: 20.8 },
    'milwaukee-3shelf-standard': { consumerPrice: 1830000, revenue: 422700, marginRate: 23.1 },
    'milwaukee-workspace': { consumerPrice: 2230000, revenue: 483500, marginRate: 21.7 },
    'milwaukee-3shelf-parts': { consumerPrice: 968000, revenue: 106920, marginRate: 11.0 },
    'kia-partition-panel': { consumerPrice: 880000, revenue: 171200, marginRate: 19.5 },
    'kia-2shelf-partition': { consumerPrice: 1210000, revenue: 210100, marginRate: 17.4 },
    'kia-3shelf-standard': { consumerPrice: 1210000, revenue: 218900, marginRate: 18.1 },
    'kia-workspace': { consumerPrice: 1760000, revenue: 412500, marginRate: 23.4 },
    'milwaukee-floor-board': { consumerPrice: 990000, revenue: 265100, marginRate: 26.8 },
    'kia-floor-board': { consumerPrice: 990000, revenue: 265100, marginRate: 26.8 },
    'milwaukee-workstation': { consumerPrice: 4850000, revenue: 1214120, marginRate: 25.0 },
    'milwaukee-smart': { consumerPrice: 4490000, revenue: 1153320, marginRate: 25.7 },
    'kia-workstation': { consumerPrice: 3390000, revenue: 908200, marginRate: 26.8 },
    'kia-smart': { consumerPrice: 3600000, revenue: 865300, marginRate: 24.0 }
  };
  
  return marginData[packageId] || null;
}

// 매출 데이터 Excel 다운로드 (6단계 버튼: exportRevenueToExcel 로 호출됨)
function exportRevenueToExcel() {
  try {
    // tbody에서 데이터 행 추출
    const tbody = document.getElementById('revenueTableBody');
    if (!tbody || tbody.querySelectorAll('tr').length === 0) {
      alert('⚠️ 다운로드할 매출 데이터가 없습니다.\n먼저 매출 현황을 조회해주세요.');
      return;
    }

    // 테이블 전체를 찾아서 SheetJS로 변환
    const table = tbody.closest('table');
    if (!table) {
      alert('⚠️ 테이블을 찾을 수 없습니다.');
      return;
    }

    const wb = XLSX.utils.table_to_book(table, { sheet: '매출관리' });
    const today = new Date().toISOString().split('T')[0];
    const fileName = `PV5_매출관리_${today}.xlsx`;
    XLSX.writeFile(wb, fileName);
    alert(`✅ Excel 파일이 다운로드되었습니다!\n\n파일명: ${fileName}`);
  } catch (err) {
    console.error('exportRevenueToExcel error:', err);
    alert('❌ Excel 다운로드 실패: ' + err.message);
  }
}

// 하위 호환 alias
function downloadRevenueExcel() { exportRevenueToExcel(); }

// D1 마이그레이션 자동 실행
async function runMigration() {
  if (!confirm('⚠️ D1 데이터베이스 마이그레이션을 실행하시겠습니까?\n\nreports 테이블에 status 컬럼이 추가됩니다.\n\n진행하시겠습니까?')) {
    return;
  }
  
  try {
    const response = await axios.post('/api/migrate-status-column');
    
    if (response.data.success) {
      // 마이그레이션 성공
      const message = response.data.alreadyExists 
        ? '✅ status 컬럼이 이미 존재합니다.\n마이그레이션이 필요하지 않습니다.'
        : '✅ 마이그레이션이 완료되었습니다!\n\nstatus 컬럼이 추가되었습니다.\n이제 "시공 완료" 기능을 사용할 수 있습니다.';
      
      alert(message);
      
      // 마이그레이션 알림 숨기기
      const migrationAlert = document.getElementById('migrationAlert');
      if (migrationAlert) {
        migrationAlert.style.display = 'none';
      }
      
      // 매출 목록 새로고침
      loadRevenueList();
    } else {
      // 마이그레이션 실패
      alert('❌ 마이그레이션 실패\n\n' + (response.data.message || '알 수 없는 오류가 발생했습니다.'));
    }
  } catch (error) {
    console.error('Migration error:', error);
    const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
    alert('❌ 마이그레이션 실행 중 오류가 발생했습니다.\n\n' + errorMsg);
  }
}

// 3단계 상태 마이그레이션 (0003_add_confirmed_status.sql)
async function runConfirmedStatusMigration() {
  if (!confirm('🔄 3단계 상태 시스템 마이그레이션을 실행하시겠습니까?\n\n예약 접수 중 (draft) → 예약 확정 (confirmed) → 시공 완료 (completed)\n\n진행하시겠습니까?')) {
    return;
  }
  
  try {
    const response = await axios.post('/api/migrate-confirmed-status');
    
    if (response.data.success) {
      // 마이그레이션 성공
      const message = response.data.alreadyCompleted 
        ? '✅ 마이그레이션이 이미 완료되었습니다.\n\n3단계 상태 시스템을 사용할 수 있습니다.'
        : '✅ 마이그레이션 완료!\n\n' + response.data.message;
      
      alert(message);
      
      // 마이그레이션 알림 숨기기
      const migrationAlert = document.getElementById('migrationAlert');
      if (migrationAlert) {
        migrationAlert.style.display = 'none';
      }
      
      // 목록 새로고침
      loadRevenueList();
      loadReportsList();
    } else {
      // 마이그레이션 실패
      alert('❌ 마이그레이션 실패\n\n' + (response.data.message || '알 수 없는 오류가 발생했습니다.'));
    }
  } catch (error) {
    console.error('Confirmed status migration error:', error);
    const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
    alert('❌ 마이그레이션 실행 중 오류가 발생했습니다.\n\n' + errorMsg);
  }
}

// ★ 검색 버튼 onclick="searchRevenue()" → 날짜 + 고객명 통합 검색
function searchRevenue() {
  const filterType = document.getElementById('revenuePeriodType')?.value || 'custom';
  const startDate  = document.getElementById('revenueStartDate')?.value  || null;
  const endDate    = document.getElementById('revenueEndDate')?.value    || null;
  const customerName = document.getElementById('revenueSearchCustomer')?.value?.trim() || '';

  // custom 선택 시 날짜 없으면 전체로 처리 (고객명만 있어도 검색 가능)
  const effectiveFilter = (filterType === 'custom' && !startDate && !endDate) ? 'all' : filterType;

  loadRevenueList(effectiveFilter, startDate, endDate, customerName);
}

// ★ 초기화 버튼 onclick="resetRevenueSearch()"
function resetRevenueSearch() {
  const periodEl   = document.getElementById('revenuePeriodType');
  const startEl    = document.getElementById('revenueStartDate');
  const endEl      = document.getElementById('revenueEndDate');
  const customerEl = document.getElementById('revenueSearchCustomer');
  if (periodEl)   periodEl.value   = 'custom';
  if (startEl)    startEl.value    = '';
  if (endEl)      endEl.value      = '';
  if (customerEl) customerEl.value = '';
  loadRevenueList('all', null, null, '');
}

// ★ 기간 선택 select onchange="updateRevenueFilters()"
function updateRevenueFilters() {
  const filterType = document.getElementById('revenuePeriodType')?.value || 'custom';
  const startContainer = document.getElementById('revenueStartDate')?.closest('.grid');
  // 직접 선택이 아닌 경우 날짜 필드 초기화
  if (filterType !== 'custom') {
    const startEl = document.getElementById('revenueStartDate');
    const endEl   = document.getElementById('revenueEndDate');
    if (startEl) startEl.value = '';
    if (endEl)   endEl.value   = '';
  }
  // 선택 즉시 필터 적용
  const customerName = document.getElementById('revenueSearchCustomer')?.value?.trim() || '';
  const startDate = document.getElementById('revenueStartDate')?.value || null;
  const endDate   = document.getElementById('revenueEndDate')?.value   || null;
  const effective = (filterType === 'custom' && !startDate && !endDate) ? 'all' : filterType;
  loadRevenueList(effective, startDate, endDate, customerName);
}

// 하위 호환 alias
function applyRevenueFilter() { searchRevenue(); }

// ========================================
// ========================================
// Step 6: 매출 관리
// ========================================

