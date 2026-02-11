// 전역 상태 관리
let currentStep = 1;
let ocrData = null;
let selectedPackages = []; // 단일 선택에서 다중 선택으로 변경
let allPackages = [];
let packagePositions = {}; // 패키지별 좌/우 선택 상태 저장
let uploadedImageFile = null; // 업로드된 거래명세서 이미지 파일
let currentReportId = null; // 현재 편집 중인 리포트 ID
let allReports = []; // 저장된 모든 리포트 목록

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  await loadPackages();
  setupFileUpload();
  setupStepNavigation();
  updateStepIndicator();
  
  // 페이지 로드 시 밀워키 패키지 미리 준비 (Step 2 진입 시 즉시 표시)
  setTimeout(() => {
    if (allPackages.length > 0) {
      console.log('Preloading milwaukee packages for faster display');
    }
  }, 1000);
});

// 단계 네비게이션 설정 (상단 메뉴 클릭)
function setupStepNavigation() {
  for (let i = 1; i <= 5; i++) {
    const stepElement = document.getElementById(`step${i}`);
    if (stepElement) {
      stepElement.style.cursor = 'pointer';
      stepElement.addEventListener('click', () => goToStep(i));
    }
  }
}

// 특정 단계로 이동 (클릭 시)
function goToStep(step) {
  // 이전 단계로만 이동 가능 (완료된 단계)
  if (step < currentStep) {
    currentStep = step;
    updateStepIndicator();
    showCurrentSection();
    
    // 섹션별 초기화
    if (step === 2) {
      setTimeout(() => {
        if (allPackages.length === 0) {
          console.error('No packages loaded, retrying...');
          loadPackages().then(() => {
            showBrand('milwaukee');
          });
        } else {
          showBrand('milwaukee');
        }
      }, 200);
    }
    return;
  }
  
  // 현재 단계는 그냥 머물기
  if (step === currentStep) {
    return;
  }
  
  // 다음 단계로 이동 시도
  if (step === 2) {
    if (!ocrData) {
      alert('먼저 거래명세서를 업로드하거나 수동으로 입력해주세요.');
      return;
    }
    currentStep = 2;
    updateStepIndicator();
    showCurrentSection();
    setTimeout(() => {
      if (allPackages.length === 0) {
        console.error('No packages loaded, retrying...');
        loadPackages().then(() => {
          showBrand('milwaukee');
        });
      } else {
        showBrand('milwaukee');
      }
    }, 200);
  } else if (step === 3) {
    if (!ocrData) {
      alert('먼저 거래명세서를 업로드하거나 수동으로 입력해주세요.');
      return;
    }
    if (selectedPackages.length === 0) {
      alert('제품을 선택해주세요.');
      return;
    }
    currentStep = 3;
    updateStepIndicator();
    showCurrentSection();
    // OCR 데이터로 주소 자동 입력
    if (ocrData && ocrData.address) {
      document.getElementById('installAddress').value = ocrData.address;
    }
  } else if (step === 4) {
    if (!ocrData) {
      alert('먼저 거래명세서를 업로드하거나 수동으로 입력해주세요.');
      return;
    }
    if (selectedPackages.length === 0) {
      alert('제품을 선택해주세요.');
      return;
    }
    const installDate = document.getElementById('installDate')?.value;
    if (!installDate) {
      alert('설치 날짜를 입력해주세요.');
      return;
    }
    currentStep = 4;
    updateStepIndicator();
    showCurrentSection();
    displayFinalPreview();
  } else if (step === 5) {
    // Step 5는 언제든지 접근 가능
    currentStep = 5;
    updateStepIndicator();
    showCurrentSection();
  } else if (step === 6) {
    // Step 6 매출 관리는 언제든지 접근 가능
    currentStep = 6;
    updateStepIndicator();
    showCurrentSection();
  }
}

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


// 브랜드별 제품 표시
function showBrand(brand) {
  console.log('showBrand called with:', brand);
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

// 고객 주소 복사 // UPDATED
function copyCustomerAddress() { // UPDATED
  if (!ocrData || !ocrData.receiverAddress) { // UPDATED
    alert('⚠️ 고객 주소 정보가 없습니다. 먼저 거래명세서를 업로드해주세요.'); // UPDATED
    return; // UPDATED
  } // UPDATED
  // UPDATED
  const installAddressInput = document.getElementById('installAddress'); // UPDATED
  if (installAddressInput) { // UPDATED
    installAddressInput.value = ocrData.receiverAddress; // UPDATED
    alert('✅ 고객 주소가 복사되었습니다!'); // UPDATED
  } // UPDATED
} // UPDATED

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
  if (step === 2 && !ocrData) {
    alert('먼저 거래명세서를 업로드해주세요.');
    return;
  }
  
  if (step === 3 && selectedPackages.length === 0) {
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
    console.log('Moving to step 2, showing milwaukee packages');
    // 밀워키를 기본으로 표시
    setTimeout(() => {
      if (allPackages.length === 0) {
        console.error('No packages loaded, retrying...');
        loadPackages().then(() => {
          showBrand('milwaukee');
        });
      } else {
        showBrand('milwaukee');
      }
    }, 200);
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
          <div><strong>출력일자:</strong> ${ocrData?.outputDate || '-'}</div>
          <div><strong>상품번호:</strong> ${ocrData?.productCode || '-'}</div>
          <div><strong>고객명:</strong> ${ocrData?.receiverName || '-'}</div>
          <div><strong>연락처:</strong> ${ocrData?.receiverPhone || '-'}</div>
          <div class="sm:col-span-2"><strong>주소:</strong> ${ocrData?.receiverAddress || '-'}</div>
          <div><strong>주문번호:</strong> ${ocrData?.orderNumber || '-'}</div>
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
      customerInfo: ocrData,
      packages: selectedPackages,
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

// 시공 확인서 저장
async function saveReport() {
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
      customerInfo: ocrData,
      packages: selectedPackages,
      packagePositions, // UPDATED - 3단 선반 설치 위치 데이터 추가
      installDate,
      installTime,
      installAddress,
      notes,
      installerName,
      attachmentImage: imageBase64,
      attachmentFileName: imageFileName,
      createdAt: new Date().toISOString() // 생성 시간 추가
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
        
        currentReportId = reportData.reportId; // UPDATED
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
  }
}

// 저장된 문서 목록 불러오기
async function loadReportsList() {
  try {
    // 🔄 서버에서 먼저 불러오기 (Primary) // UPDATED
    try { // UPDATED
      const response = await axios.get('/api/reports/list', { timeout: 10000 }); // UPDATED
      if (response.data.success && response.data.reports.length > 0) { // UPDATED
        console.log('✅ Loaded from server (D1):', response.data.reports.length, 'reports'); // UPDATED
        allReports = response.data.reports; // UPDATED
        
        // 서버 데이터를 localStorage에 캐싱 // UPDATED
        try { // UPDATED
          localStorage.setItem('pv5_reports', JSON.stringify(allReports)); // UPDATED
          console.log('✅ Cached to localStorage'); // UPDATED
        } catch (cacheError) { // UPDATED
          console.warn('⚠️ localStorage cache failed:', cacheError); // UPDATED
        } // UPDATED
        
        displayReportsList(allReports); // UPDATED
        return; // UPDATED
      } // UPDATED
    } catch (serverError) { // UPDATED
      console.warn('⚠️ Server load failed, fallback to localStorage:', serverError); // UPDATED
    } // UPDATED
    
    // 서버 실패 시 localStorage에서 불러오기 (Fallback) // UPDATED
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
  
  listContainer.innerHTML = reports.map((report, index) => {
    const customerName = report.customerInfo?.receiverName || report.customerName || '-';
    const installDate = report.installDate || '-';
    const installTime = report.installTime || '-';
    const installAddress = report.installAddress || '-';
    const reportId = report.reportId || report.id || `REPORT-${index}`;
    
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
            ${report.status === 'draft' || !report.status ? 
              '<span class="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold"><i class="fas fa-clipboard-list mr-1"></i>예약 접수 중</span>' :
              report.status === 'confirmed' ?
              '<span class="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold"><i class="fas fa-check-circle mr-1"></i>예약 확정</span>' :
              '<span class="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold"><i class="fas fa-check-double mr-1"></i>시공 완료</span>'
            }
          </div>
          <div class="text-sm text-gray-600 space-y-1">
            <div><i class="fas fa-calendar mr-2"></i>설치 날짜: ${installDate}</div>
            <div><i class="fas fa-clock mr-2"></i>설치 시간: ${installTime}</div>
            <div><i class="fas fa-map-marker-alt mr-2"></i>설치 주소: ${installAddress}</div>
          </div>
        </div>
        
        <!-- 버튼 영역: 데스크톱 (가로 배치), 모바일 (2×3 그리드) -->
        <div class="hidden md:flex md:space-x-2">
          <button onclick="showReportPreview('${reportId}')" 
                  class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            <i class="fas fa-eye mr-1"></i>상세보기
          </button>
          <button onclick="loadReport('${reportId}')" 
                  class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <i class="fas fa-edit mr-1"></i>수정하기
          </button>
          ${report.status === 'completed' ? `
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
        </div>
        
        <!-- 모바일 버튼 (2×3 그리드) -->
        <div class="md:hidden grid grid-cols-2 gap-2">
          <button onclick="showReportPreview('${reportId}')" 
                  class="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 text-sm font-semibold">
            <i class="fas fa-eye mr-1"></i>상세보기
          </button>
          <button onclick="loadReport('${reportId}')" 
                  class="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 text-sm font-semibold">
            <i class="fas fa-edit mr-1"></i>수정하기
          </button>
          ${report.status === 'completed' ? `
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
        </div>
      </div>
    `;
  }).join('');
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
    
    // 입력 필드 복원
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
    
    alert(`✅ 문서를 불러왔습니다!\n\n고객명: ${ocrData.receiverName || '-'}\n\n1단계부터 다시 확인하고 수정할 수 있습니다.`);
    
    // 1단계로 이동
    currentStep = 1;
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
    // 로컬스토리지에서 삭제
    const localReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
    const filteredReports = localReports.filter(r => r.reportId !== reportId && r.id !== reportId);
    localStorage.setItem('pv5_reports', JSON.stringify(filteredReports));
    
    // 서버에서도 삭제 시도
    try {
      await axios.delete(`/api/reports/${reportId}`, { timeout: 10000 });
    } catch (error) {
      console.warn('Server delete failed, local storage updated:', error);
    }
    
    alert('✅ 문서가 삭제되었습니다.');
    
    // 목록 새로고침
    loadReportsList();
    
  } catch (error) {
    console.error('Delete report error:', error);
    alert('❌ 문서 삭제 중 오류가 발생했습니다.');
  }
}

// 문서 검색
function searchReports() {
  const startDate = document.getElementById('searchStartDate').value;
  const endDate = document.getElementById('searchEndDate').value;
  const customerName = document.getElementById('searchCustomerName').value.toLowerCase();
  
  let filtered = [...allReports];
  
  // 날짜 필터
  if (startDate) {
    filtered = filtered.filter(r => {
      const installDate = r.installDate || '';
      return installDate >= startDate;
    });
  }
  
  if (endDate) {
    filtered = filtered.filter(r => {
      const installDate = r.installDate || '';
      return installDate <= endDate;
    });
  }
  
  // 고객명 필터
  if (customerName) {
    filtered = filtered.filter(r => {
      const name = (r.customerInfo?.receiverName || r.customerName || '').toLowerCase();
      return name.includes(customerName);
    });
  }
  
  displayReportsList(filtered);
}

// 검색 초기화
function resetSearch() {
  document.getElementById('searchStartDate').value = '';
  document.getElementById('searchEndDate').value = '';
  document.getElementById('searchCustomerName').value = '';
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
                  <div class="bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">출력일자:</strong> <span class="text-gray-900 font-semibold">${customerInfo.outputDate || '-'}</span></div>
                  <div class="bg-white p-3 rounded shadow-sm"><strong class="text-gray-700">상품번호:</strong> <span class="text-gray-900 font-semibold">${customerInfo.productCode || '-'}</span></div>
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
  ocrData = null;
  selectedPackages = [];
  uploadedImageFile = null;
  currentReportId = null;
  packagePositions = {};
  
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
  
  // 4. OCR 결과 숨기기
  const uploadResult = document.getElementById('uploadResult');
  if (uploadResult) {
    uploadResult.classList.add('hidden');
    uploadResult.style.display = 'none';
  }
  
  // 5. 업로드 영역 초기화
  const dropZone = document.getElementById('dropZone');
  if (dropZone) {
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
    
    // 파일 입력 이벤트 재설정
    setupFileUpload();
  }
  
  // 6. 수동 입력 폼 제거 (있다면)
  const manualInputForm = document.getElementById('manualInputForm');
  if (manualInputForm) {
    manualInputForm.remove();
  }
  
  // 7. Step 1로 이동
  currentStep = 1;
  updateStepIndicator();
  showCurrentSection();
  
  console.log('Reset complete. Ready for new report.');
}

// Excel 내보내기
function exportToExcel() {
  try {
    const allReports = JSON.parse(localStorage.getItem('pv5_reports') || '[]');
    
    if (allReports.length === 0) {
      alert('⚠️ 내보낼 데이터가 없습니다.');
      return;
    }
    
    // Excel 데이터 준비
    const excelData = allReports.map(report => {
      const customerInfo = report.customerInfo || {};
      const packages = report.packages || [];
      const productNames = packages.map(pkg => pkg.fullName || pkg.name).filter(name => name && name !== '-').join(', ');
      
      return {
        '문서ID': report.reportId || report.id || '-',
        '고객명': customerInfo.receiverName || report.customerName || '-',
        '연락처': customerInfo.phone || '-',
        '주소': customerInfo.address || '-',
        '설치날짜': report.installDate || '-',
        '설치시간': report.installTime || '-',
        '설치주소': report.installAddress || '-',
        '제품명': productNames || '-',
        '특이사항': report.notes || '-',
        '작성자': report.installerName || '-',
        '저장시간': report.createdAt || '-'
      };
    });
    
    // Excel 워크북 생성
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '시공확인서');
    
    // 컬럼 너비 자동 조정
    const colWidths = [
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
    ws['!cols'] = colWidths;
    
    // 파일 다운로드
    const fileName = `PV5_시공확인서_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    alert(`✅ Excel 파일을 내보냈습니다!\n\n문서 개수: ${allReports.length}개\n파일명: ${fileName}`);
    
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

// 예약 확정 처리
async function confirmReport(reportId) {
  if (!confirm('이 예약을 확정하시겠습니까?\n\n예약 확정 후 시공 완료 처리가 가능합니다.')) {
    return;
  }
  
  try {
    const response = await axios.patch(`/api/reports/${reportId}/confirm`);
    
    if (response.data.success) {
      alert('✅ 예약이 확정되었습니다!');
      
      // 목록 새로고침
      loadReportsList();
    } else {
      alert('❌ 예약 확정 실패: ' + (response.data.message || '알 수 없는 오류'));
    }
  } catch (error) {
    console.error('Confirm report error:', error);
    alert('❌ 예약 확정 중 오류가 발생했습니다.');
  }
}

// 시공 완료 처리
async function completeReport(reportId) {
  if (!confirm('이 문서를 시공 완료로 표시하시겠습니까?\n\n시공 완료된 문서는 "매출 관리" 탭에서 확인할 수 있습니다.')) {
    return;
  }
  
  try {
    const response = await axios.patch(`/api/reports/${reportId}/complete`);
    
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
  }
}

// 매출 관리 목록 로드
async function loadRevenueList(filterType = 'all', startDate = null, endDate = null) {
  try {
    const response = await axios.get('/api/reports/completed/list');
    
    if (response.data.success) {
      const reports = response.data.reports;
      
      // ✅ 성공적으로 데이터를 불러왔다면 마이그레이션이 완료된 것이므로 경고 박스 숨김
      const migrationAlert = document.getElementById('migrationAlert');
      if (migrationAlert) {
        migrationAlert.style.display = 'none';
      }
      
      // 날짜 필터링
      let filteredReports = reports;
      
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
          
          <!-- 마진율 & 시공자 -->
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

// 매출 데이터 Excel 다운로드
function downloadRevenueExcel() {
  // 현재 표시된 데이터 기반으로 다운로드
  const revenueList = document.getElementById('revenueList');
  const table = revenueList.querySelector('table');
  
  if (!table) {
    alert('⚠️ 다운로드할 데이터가 없습니다.');
    return;
  }
  
  // SheetJS를 이용한 Excel 생성
  const wb = XLSX.utils.table_to_book(table, { sheet: "매출관리" });
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `PV5_매출관리_${today}.xlsx`);
  
  alert('✅ Excel 파일이 다운로드되었습니다!');
}

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

// 검색 필터 적용
function applyRevenueFilter() {
  const filterType = document.getElementById('revenueFilterType')?.value || 'all';
  const startDate = document.getElementById('revenueStartDate')?.value;
  const endDate = document.getElementById('revenueEndDate')?.value;
  
  if (filterType === 'custom') {
    if (!startDate || !endDate) {
      alert('시작 날짜와 종료 날짜를 모두 선택해주세요.');
      return;
    }
  }
  
  loadRevenueList(filterType, startDate, endDate);
}

// ========================================
// Step 5: 달력 뷰 관련 함수
// ========================================

// 현재 달력에 표시 중인 연도/월
let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth(); // 0-11

// 목록/달력 뷰 전환
function switchManageView(view) {
  const listView = document.getElementById('listView');
  const calendarView = document.getElementById('calendarView');
  const listTab = document.getElementById('listViewTab');
  const calendarTab = document.getElementById('calendarViewTab');
  
  if (view === 'list') {
    // 목록 뷰 활성화
    listView.classList.remove('hidden');
    calendarView.classList.add('hidden');
    
    // 탭 스타일 업데이트
    listTab.classList.remove('text-gray-500');
    listTab.classList.add('text-purple-600', 'border-b-2', 'border-purple-600');
    calendarTab.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
    calendarTab.classList.add('text-gray-500');
    
    // 목록 새로고침
    loadAllReports();
  } else if (view === 'calendar') {
    // 달력 뷰 활성화
    listView.classList.add('hidden');
    calendarView.classList.remove('hidden');
    
    // 탭 스타일 업데이트
    calendarTab.classList.remove('text-gray-500');
    calendarTab.classList.add('text-purple-600', 'border-b-2', 'border-purple-600');
    listTab.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
    listTab.classList.add('text-gray-500');
    
    // 달력 렌더링
    renderCalendar(currentCalendarYear, currentCalendarMonth);
  }
}

// 달력 월 변경
function changeCalendarMonth(delta) {
  currentCalendarMonth += delta;
  
  if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  } else if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  }
  
  renderCalendar(currentCalendarYear, currentCalendarMonth);
}

// 달력 렌더링
async function renderCalendar(year, month) {
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const monthYearTitle = document.getElementById('calendarMonthYear');
  monthYearTitle.textContent = `${year}년 ${monthNames[month]}`;
  
  // 모든 리포트 가져오기
  const allReports = await getAllReportsForCalendar();
  
  // 날짜별 예약 건수 집계
  const dateMap = {};
  allReports.forEach(report => {
    if (report.install_date) {
      const dateKey = report.install_date; // YYYY-MM-DD 형식
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(report);
    }
  });
  
  // 달력 테이블 생성
  const firstDay = new Date(year, month, 1).getDay(); // 0 (일요일) ~ 6 (토요일)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const calendarBody = document.getElementById('calendarBody');
  calendarBody.innerHTML = '';
  
  let dayCounter = 1;
  let rows = Math.ceil((firstDay + daysInMonth) / 7);
  
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement('tr');
    
    for (let j = 0; j < 7; j++) {
      const td = document.createElement('td');
      td.className = 'border border-gray-300 p-1 sm:p-2 h-16 sm:h-24 align-top relative cursor-pointer hover:bg-purple-50 transition';
      
      if ((i === 0 && j < firstDay) || dayCounter > daysInMonth) {
        // 빈 셀
        td.className = 'border border-gray-200 bg-gray-50';
        tr.appendChild(td);
        continue;
      }
      
      const day = dayCounter;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const reportsOnDate = dateMap[dateStr] || [];
      const hasReports = reportsOnDate.length > 0;
      
      // 날짜 숫자
      const dayDiv = document.createElement('div');
      dayDiv.className = 'text-xs sm:text-sm font-bold mb-1';
      
      // 일요일은 빨간색, 토요일은 파란색
      if (j === 0) {
        dayDiv.className += ' text-red-600';
      } else if (j === 6) {
        dayDiv.className += ' text-blue-600';
      } else {
        dayDiv.className += ' text-gray-700';
      }
      
      // 오늘 날짜 표시
      if (dateStr === todayStr) {
        dayDiv.className += ' bg-blue-100 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center';
      }
      
      dayDiv.textContent = day;
      td.appendChild(dayDiv);
      
      // 예약이 있으면 배지 표시
      if (hasReports) {
        const badge = document.createElement('div');
        badge.className = 'absolute top-1 right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold';
        badge.textContent = reportsOnDate.length;
        td.appendChild(badge);
        
        // 고객명 미리보기 (데스크톱만)
        const preview = document.createElement('div');
        preview.className = 'hidden sm:block text-xs text-gray-600 mt-1 truncate';
        const firstCustomer = reportsOnDate[0].customer_info?.receiverName || reportsOnDate[0].customer_name || '고객';
        preview.textContent = firstCustomer + (reportsOnDate.length > 1 ? ` 외 ${reportsOnDate.length - 1}건` : '');
        td.appendChild(preview);
      }
      
      // 클릭 이벤트
      td.onclick = () => showDateDetails(dateStr, reportsOnDate);
      
      tr.appendChild(td);
      dayCounter++;
    }
    
    calendarBody.appendChild(tr);
  }
}

// 특정 날짜의 예약 상세 표시
function showDateDetails(dateStr, reports) {
  const selectedDateReports = document.getElementById('selectedDateReports');
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  const selectedDateReportsList = document.getElementById('selectedDateReportsList');
  
  if (reports.length === 0) {
    selectedDateReports.classList.add('hidden');
    return;
  }
  
  // 날짜 포맷팅
  const [year, month, day] = dateStr.split('-');
  selectedDateTitle.textContent = `${year}년 ${parseInt(month)}월 ${parseInt(day)}일 예약 (${reports.length}건)`;
  
  // 예약 목록 렌더링
  selectedDateReportsList.innerHTML = reports.map(report => {
    const customerName = report.customer_info?.receiverName || report.customer_name || '고객명 없음';
    const productNames = report.packages?.map(pkg => pkg.fullName || pkg.name).join(', ') || '제품 정보 없음';
    const installTime = report.install_time || '시간 미정';
    const installerName = report.installer_name || '담당자 미정';
    const reportId = report.id;
    const status = report.status || 'draft';
    
    // 3단 선반 위치 배지
    let positionBadges = '';
    if (report.package_positions) {
      const positions = JSON.parse(report.package_positions);
      Object.entries(positions).forEach(([pkgId, pos]) => {
        if (pos === 'left') {
          positionBadges += '<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1">3단 선반 설치 좌측</span>';
        } else if (pos === 'right') {
          positionBadges += '<span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-1">3단 선반 설치 우측</span>';
        }
      });
    }
    
    const isCompleted = status === 'completed';
    const completeButtonClass = isCompleted
      ? 'bg-gray-400 text-white cursor-not-allowed'
      : 'bg-orange-500 text-white hover:bg-orange-600';
    
    return `
      <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
          <div>
            <h5 class="font-bold text-gray-800 text-base sm:text-lg">${customerName}</h5>
            <p class="text-sm text-gray-600"><i class="fas fa-clock mr-1"></i>${installTime}</p>
            <p class="text-sm text-gray-600"><i class="fas fa-user mr-1"></i>${installerName}</p>
          </div>
        </div>
        <div class="mb-3">
          <p class="text-sm font-semibold text-gray-700 mb-1"><i class="fas fa-box mr-1"></i>제품:</p>
          <p class="text-sm text-gray-600">${productNames}</p>
          ${positionBadges ? `<div class="mt-2">${positionBadges}</div>` : ''}
        </div>
        <div class="flex flex-wrap gap-2">
          <button onclick="loadReport('${reportId}')" 
                  class="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-semibold">
            <i class="fas fa-eye mr-1"></i>상세보기
          </button>
          <button onclick="saveReportAsJPG('${reportId}')" 
                  class="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm font-semibold">
            <i class="fas fa-image mr-1"></i>JPG 저장
          </button>
          <button onclick="loadReport('${reportId}')" 
                  class="bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700 text-sm font-semibold">
            <i class="fas fa-edit mr-1"></i>수정하기
          </button>
          <button onclick="markAsCompleted('${reportId}')" 
                  class="${completeButtonClass} px-3 py-1.5 rounded-lg text-sm font-semibold"
                  ${isCompleted ? 'disabled' : ''}>
            <i class="fas fa-check-circle mr-1"></i>${isCompleted ? '완료됨' : '시공 완료'}
          </button>
          <button onclick="deleteReport('${reportId}')" 
                  class="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 text-sm font-semibold">
            <i class="fas fa-trash mr-1"></i>삭제
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  selectedDateReports.classList.remove('hidden');
}

// 모든 리포트 가져오기 (달력용)
async function getAllReportsForCalendar() {
  try {
    // 🔄 서버에서 먼저 불러오기 (Primary)
    const response = await axios.get('/api/reports/list', { timeout: 10000 });
    if (response.data.success && response.data.reports && response.data.reports.length > 0) {
      console.log('✅ Calendar: Loaded from server (D1):', response.data.reports.length, 'reports');
      return response.data.reports;
    }
  } catch (error) {
    console.warn('⚠️ Calendar: Server load failed, fallback to localStorage:', error);
  }
  
  // 서버 실패 시 localStorage에서 가져오기 (Fallback)
  const localData = localStorage.getItem('pv5_reports');
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      console.log('✅ Calendar: Loaded from localStorage (cache):', parsed.length, 'reports');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('❌ Calendar: Failed to parse localStorage reports:', e);
    }
  }
  
  console.warn('⚠️ Calendar: No reports found');
  return [];
}

