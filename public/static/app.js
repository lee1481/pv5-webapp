// 전역 상태 관리
let currentStep = 1;
let ocrData = null;
let selectedPackage = null;
let allPackages = [];

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  await loadPackages();
  setupFileUpload();
  updateStepIndicator();
});

// 제품 패키지 로드
async function loadPackages() {
  try {
    const response = await axios.get('/api/packages');
    allPackages = response.data.packages;
    console.log('Loaded packages:', allPackages.length);
  } catch (error) {
    console.error('Failed to load packages:', error);
    alert('제품 정보를 불러오는데 실패했습니다.');
  }
}

// 파일 업로드 설정
function setupFileUpload() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');

  // 파일 선택 이벤트
  fileInput.addEventListener('change', handleFileSelect);

  // 드래그 앤 드롭 이벤트
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('bg-blue-50');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-blue-50');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('bg-blue-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleFileSelect({ target: fileInput });
    }
  });
}

// 파일 선택 처리
async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 로딩 표시
  const dropZone = document.getElementById('dropZone');
  dropZone.innerHTML = `
    <div class="text-center">
      <i class="fas fa-spinner fa-spin text-6xl text-blue-600 mb-4"></i>
      <p class="text-lg text-gray-600">거래명세서 분석 중...</p>
    </div>
  `;

  try {
    // OCR 처리
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    ocrData = response.data.data;
    displayOCRResult(ocrData);
    
    // 자동으로 제품 선택 섹션으로 이동
    setTimeout(() => {
      nextStep(2);
    }, 1500);
    
  } catch (error) {
    console.error('OCR Error:', error);
    
    // OCR 실패 시 수동 입력 폼 표시
    dropZone.innerHTML = `
      <div class="text-center">
        <i class="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
        <p class="text-lg text-gray-800 mb-2 font-bold">자동 인식 실패</p>
        <p class="text-sm text-gray-600 mb-4">거래명세서 정보를 수동으로 입력해주세요.</p>
        <button onclick="showManualInputForm()" 
                class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition mr-2">
            <i class="fas fa-keyboard mr-2"></i>수동 입력
        </button>
        <button onclick="location.reload()" 
                class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
            <i class="fas fa-redo mr-2"></i>다시 시도
        </button>
      </div>
    `;
  }
}

// OCR 결과 표시
function displayOCRResult(data) {
  const uploadResult = document.getElementById('uploadResult');
  const ocrDataDiv = document.getElementById('ocrData');
  
  // OCR 실패 체크
  const hasFailure = data.customerName === '(인식 실패)' || 
                     data.phone === '(인식 실패)' || 
                     data.address === '(인식 실패)';
  
  ocrDataDiv.innerHTML = `
    <div><strong>고객명:</strong> ${data.customerName || '-'}</div>
    <div><strong>연락처:</strong> ${data.phone || '-'}</div>
    <div><strong>주소:</strong> ${data.address || '-'}</div>
    <div><strong>제품명:</strong> ${data.productName || '-'}</div>
    <div><strong>주문번호:</strong> ${data.productCode || '-'}</div>
    <div><strong>금액:</strong> ${data.amount ? data.amount.toLocaleString() + '원' : '-'}</div>
    ${hasFailure ? `
      <div class="col-span-2 mt-2">
        <button onclick="showManualInputForm()" 
                class="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition">
          <i class="fas fa-edit mr-2"></i>정보 수정하기
        </button>
      </div>
    ` : ''}
  `;
  
  uploadResult.classList.remove('hidden');
  
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">고객명 *</label>
          <input type="text" id="manual_customerName" 
                 value="${ocrData?.customerName && ocrData.customerName !== '(인식 실패)' ? ocrData.customerName : ''}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="홍길동">
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">연락처 *</label>
          <input type="tel" id="manual_phone" 
                 value="${ocrData?.phone && ocrData.phone !== '(인식 실패)' ? ocrData.phone : ''}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="010-1234-5678">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-bold text-gray-700 mb-2">주소 *</label>
          <input type="text" id="manual_address" 
                 value="${ocrData?.address && ocrData.address !== '(인식 실패)' ? ocrData.address : ''}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="서울시 강남구...">
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">제품명</label>
          <input type="text" id="manual_productName" 
                 value="${ocrData?.productName && ocrData.productName !== '(인식 실패)' ? ocrData.productName : ''}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="PV5 밀워키 워크스테이션">
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">주문번호</label>
          <input type="text" id="manual_productCode" 
                 value="${ocrData?.productCode || ''}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="202601300939847917">
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">금액</label>
          <input type="number" id="manual_amount" 
                 value="${ocrData?.amount || ''}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="4850000">
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">주문일</label>
          <input type="text" id="manual_orderDate" 
                 value="${ocrData?.orderDate || new Date().toLocaleDateString('ko-KR')}"
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                 placeholder="2025년 01월 20일">
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
}

// 수동 입력 취소
function cancelManualInput() {
  const form = document.getElementById('manualInputForm');
  if (form) form.remove();
}

// 수동 입력 제출
function submitManualInput() {
  const customerName = document.getElementById('manual_customerName').value.trim();
  const phone = document.getElementById('manual_phone').value.trim();
  const address = document.getElementById('manual_address').value.trim();
  const productName = document.getElementById('manual_productName').value.trim();
  const productCode = document.getElementById('manual_productCode').value.trim();
  const amount = parseInt(document.getElementById('manual_amount').value) || 0;
  const orderDate = document.getElementById('manual_orderDate').value.trim();
  
  // 필수 입력 검증
  if (!customerName || !phone || !address) {
    alert('고객명, 연락처, 주소는 필수 입력 항목입니다.');
    return;
  }
  
  // ocrData 업데이트
  ocrData = {
    customerName,
    phone,
    address,
    productName,
    productCode,
    amount,
    orderDate
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


// 브랜드별 제품 표시
function showBrand(brand) {
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
  displayPackages(packages);
}

// 제품 패키지 카드 표시
function displayPackages(packages) {
  const grid = document.getElementById('packageGrid');
  
  grid.innerHTML = packages.map(pkg => `
    <div class="package-card border-2 border-gray-200 rounded-lg p-6 ${selectedPackage?.id === pkg.id ? 'selected' : ''}" 
         onclick="selectPackage('${pkg.id}')">
      <div class="mb-4">
        <img src="${pkg.image}" 
             alt="${pkg.name}" 
             class="w-full h-48 object-cover rounded-lg"
             onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(pkg.name)}'">
      </div>
      <h3 class="font-bold text-lg mb-2">${pkg.name}</h3>
      <p class="text-sm text-gray-600 mb-3">${pkg.description}</p>
      <div class="text-blue-600 font-bold text-xl mb-4">
        ${pkg.price.toLocaleString()}원
      </div>
      <button class="w-full py-2 px-4 rounded-lg transition ${
        selectedPackage?.id === pkg.id 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }">
        <i class="fas ${selectedPackage?.id === pkg.id ? 'fa-check-circle' : 'fa-circle'} mr-2"></i>
        ${selectedPackage?.id === pkg.id ? '선택됨' : '선택하기'}
      </button>
    </div>
  `).join('');
}

// 제품 선택
function selectPackage(packageId) {
  selectedPackage = allPackages.find(pkg => pkg.id === packageId);
  console.log('Selected package:', selectedPackage);
  
  // 선택된 브랜드의 제품들만 다시 렌더링
  const brand = selectedPackage.brand;
  const packages = allPackages.filter(pkg => pkg.brand === brand);
  displayPackages(packages);
}

// 단계 이동
function nextStep(step) {
  // 유효성 검사
  if (step === 2 && !ocrData) {
    alert('먼저 거래명세서를 업로드해주세요.');
    return;
  }
  
  if (step === 3 && !selectedPackage) {
    alert('제품을 선택해주세요.');
    return;
  }
  
  if (step === 4) {
    const installDate = document.getElementById('installDate').value;
    if (!installDate) {
      alert('설치 날짜를 입력해주세요.');
      return;
    }
  }
  
  currentStep = step;
  updateStepIndicator();
  showCurrentSection();
  
  // 섹션별 초기화
  if (step === 2) {
    // 밀워키를 기본으로 표시
    showBrand('milwaukee');
  }
  
  if (step === 3) {
    // OCR 데이터로 주소 자동 입력
    if (ocrData && ocrData.address) {
      document.getElementById('installAddress').value = ocrData.address;
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
  for (let i = 1; i <= 4; i++) {
    const step = document.getElementById(`step${i}`);
    step.classList.remove('active', 'completed');
    
    if (i === currentStep) {
      step.classList.add('active');
    } else if (i < currentStep) {
      step.classList.add('completed');
    }
  }
}

// 현재 섹션 표시
function showCurrentSection() {
  document.getElementById('upload-section').classList.toggle('hidden', currentStep !== 1);
  document.getElementById('package-section').classList.toggle('hidden', currentStep !== 2);
  document.getElementById('install-section').classList.toggle('hidden', currentStep !== 3);
  document.getElementById('confirm-section').classList.toggle('hidden', currentStep !== 4);
}

// 최종 미리보기 표시
function displayFinalPreview() {
  const preview = document.getElementById('finalPreview');
  
  const installDate = document.getElementById('installDate').value;
  const installTime = document.getElementById('installTime').value;
  const installAddress = document.getElementById('installAddress').value;
  const notes = document.getElementById('notes').value;
  
  let materialsHTML = '';
  if (selectedPackage && selectedPackage.sections) {
    materialsHTML = selectedPackage.sections.map(section => `
      <div class="mb-4">
        <h4 class="font-bold text-gray-800 mb-2 bg-gray-100 px-3 py-2 rounded">${section.title}</h4>
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
  
  preview.innerHTML = `
    <div class="border-2 border-gray-300 rounded-lg p-6">
      <h3 class="text-2xl font-bold mb-6 text-center text-blue-600">
        PV5 시공 확인 점검표
      </h3>
      
      <!-- 고객 정보 -->
      <div class="mb-6 pb-6 border-b">
        <h4 class="font-bold text-lg mb-3 text-gray-800">
          <i class="fas fa-user mr-2 text-blue-600"></i>고객 정보
        </h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><strong>고객명:</strong> ${ocrData?.customerName || '-'}</div>
          <div><strong>연락처:</strong> ${ocrData?.phone || '-'}</div>
          <div class="col-span-2"><strong>주소:</strong> ${ocrData?.address || '-'}</div>
          <div><strong>주문번호:</strong> ${ocrData?.productCode || '-'}</div>
          <div><strong>주문일:</strong> ${ocrData?.orderDate || '-'}</div>
        </div>
      </div>
      
      <!-- 제품 정보 -->
      <div class="mb-6 pb-6 border-b">
        <h4 class="font-bold text-lg mb-3 text-gray-800">
          <i class="fas fa-box mr-2 text-blue-600"></i>선택 제품
        </h4>
        <div class="flex items-start space-x-4">
          <img src="${selectedPackage?.image || ''}" 
               alt="${selectedPackage?.name || ''}" 
               class="w-32 h-24 object-cover rounded-lg"
               onerror="this.style.display='none'">
          <div class="flex-1">
            <div class="font-bold text-lg">${selectedPackage?.fullName || '-'}</div>
            <div class="text-sm text-gray-600 mt-1">${selectedPackage?.description || '-'}</div>
            <div class="text-blue-600 font-bold text-xl mt-2">
              ${selectedPackage?.price?.toLocaleString() || '0'}원
            </div>
          </div>
        </div>
      </div>
      
      <!-- 설치 정보 -->
      <div class="mb-6 pb-6 border-b">
        <h4 class="font-bold text-lg mb-3 text-gray-800">
          <i class="fas fa-calendar-check mr-2 text-blue-600"></i>설치 정보
        </h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><strong>설치 날짜:</strong> ${installDate || '-'}</div>
          <div><strong>설치 시간:</strong> ${installTime || '-'}</div>
          <div class="col-span-2"><strong>설치 주소:</strong> ${installAddress || '-'}</div>
          ${notes ? `<div class="col-span-2"><strong>특이사항:</strong> ${notes}</div>` : ''}
        </div>
      </div>
      
      <!-- 자재 리스트 -->
      <div class="mb-6">
        <h4 class="font-bold text-lg mb-3 text-gray-800">
          <i class="fas fa-clipboard-list mr-2 text-blue-600"></i>시공 자재 점검표
        </h4>
        ${materialsHTML}
      </div>
      
      <!-- 서명란 -->
      <div class="grid grid-cols-2 gap-6 mt-8">
        <div class="border-2 border-gray-300 rounded-lg p-4">
          <div class="font-bold mb-2">시공 담당자 확인</div>
          <div class="h-20 border-b-2 border-gray-400 mb-2"></div>
          <div class="text-sm text-gray-600">서명 / 날짜</div>
        </div>
        <div class="border-2 border-gray-300 rounded-lg p-4">
          <div class="font-bold mb-2">고객 확인</div>
          <div class="h-20 border-b-2 border-gray-400 mb-2"></div>
          <div class="text-sm text-gray-600">서명 / 날짜</div>
        </div>
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
  try {
    const installDate = document.getElementById('installDate').value;
    const installTime = document.getElementById('installTime').value;
    const installAddress = document.getElementById('installAddress').value;
    const notes = document.getElementById('notes').value;
    
    const reportData = {
      customerInfo: ocrData,
      packageId: selectedPackage.id,
      installDate,
      installTime,
      installAddress,
      notes
    };
    
    const response = await axios.post('/api/generate-report', reportData);
    
    if (response.data.success) {
      alert('시공 확인서가 성공적으로 생성되었습니다!\n\n이메일 발송 기능은 추가 개발 예정입니다.');
      console.log('Report:', response.data.report);
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    alert('이메일 발송에 실패했습니다. 다시 시도해주세요.');
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
