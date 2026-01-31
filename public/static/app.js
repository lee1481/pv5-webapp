// 전역 상태 관리
let currentStep = 1;
let ocrData = null;
let selectedPackages = []; // 단일 선택에서 다중 선택으로 변경
let allPackages = [];
let packagePositions = {}; // 패키지별 좌/우 선택 상태 저장

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
  for (let i = 1; i <= 4; i++) {
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
    
    console.log('Displaying results and moving to step 2...');
    // 자동으로 제품 선택 섹션으로 이동
    setTimeout(() => {
      nextStep(2);
    }, 1500);
    
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
        if (element && value) {
          element.value = value;
          console.log(`Filled ${fieldId} with:`, value);
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
      <p style="color: #718096 !important; font-size: 0.875rem !important; margin-bottom: 1rem !important; display: block !important;">${pkg.description}</p>
      ${pkg.hasPositionOption ? `
        <div style="margin-bottom: 1rem; padding: 0.75rem; background-color: #f9fafb; border-radius: 0.5rem;" onclick="event.stopPropagation();">
          <p style="color: #374151 !important; font-size: 0.875rem !important; font-weight: 600 !important; margin-bottom: 0.5rem !important; display: block !important;">설치 위치 선택:</p>
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
          <i class="fas fa-box mr-2 text-blue-600"></i>선택 제품 (${selectedPackages.length}개)
        </h4>
        ${selectedPackages.map(pkg => `
          <div class="flex items-start space-x-4 mb-4 pb-4 ${selectedPackages.length > 1 ? 'border-b border-gray-200' : ''}">
            <img src="${pkg.image || ''}" 
                 alt="${pkg.name || ''}" 
                 class="w-32 h-24 object-cover rounded-lg"
                 onerror="this.style.display='none'">
            <div class="flex-1">
              <div class="font-bold text-lg">${pkg.fullName || '-'}</div>
              <div class="text-sm text-gray-600 mt-1">${pkg.description || '-'}</div>
              ${pkg.hasPositionOption && packagePositions[pkg.id] ? `
                <div class="mt-2 text-sm">
                  <strong>설치 위치:</strong> 
                  ${packagePositions[pkg.id].left ? '<span class="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded mr-2">좌측</span>' : ''}
                  ${packagePositions[pkg.id].right ? '<span class="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded">우측</span>' : ''}
                  ${!packagePositions[pkg.id].left && !packagePositions[pkg.id].right ? '<span class="text-red-600">미선택</span>' : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
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
          <canvas id="installerSignature" 
                  width="400" 
                  height="80" 
                  style="border-bottom: 2px solid #9ca3af; cursor: crosshair; width: 100%; height: 80px; display: block;"
                  class="mb-2"></canvas>
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-600">서명 / 날짜</div>
            <button onclick="clearSignature('installerSignature')" 
                    class="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded">
              지우기
            </button>
          </div>
        </div>
        <div class="border-2 border-gray-300 rounded-lg p-4">
          <div class="font-bold mb-2">고객 확인</div>
          <canvas id="customerSignature" 
                  width="400" 
                  height="80" 
                  style="border-bottom: 2px solid #9ca3af; cursor: crosshair; width: 100%; height: 80px; display: block;"
                  class="mb-2"></canvas>
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-600">서명 / 날짜</div>
            <button onclick="clearSignature('customerSignature')" 
                    class="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded">
              지우기
            </button>
          </div>
        </div>
      </div>
      
      <!-- 이메일 발송 정보 -->
      <div class="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 class="font-bold text-lg mb-3 text-gray-800">
          <i class="fas fa-envelope mr-2 text-green-600"></i>이메일 발송
        </h4>
        <div class="flex items-center gap-4">
          <label for="recipientEmail" class="text-sm font-medium text-gray-700 whitespace-nowrap">
            받는 사람:
          </label>
          <input type="email" 
                 id="recipientEmail" 
                 placeholder="example@email.com"
                 class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                 required />
        </div>
        <p class="text-xs text-gray-500 mt-2">
          <i class="fas fa-info-circle mr-1"></i>
          시공 확인서가 입력하신 이메일 주소로 발송됩니다.
        </p>
      </div>
    </div>
  `;
  
  // 서명 캔버스 초기화
  setTimeout(() => {
    initSignatureCanvas('installerSignature');
    initSignatureCanvas('customerSignature');
  }, 100);
}

// PDF 다운로드
async function downloadPDF() {
  alert('PDF 다운로드 기능은 개발 중입니다.\n\n브라우저의 인쇄 기능(Ctrl+P)을 사용하여 PDF로 저장하실 수 있습니다.');
  window.print();
}

// 서명 캔버스 초기화
function initSignatureCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  
  // 캔버스 배경을 흰색으로 설정
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 펜 스타일 설정
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // 마우스 이벤트
  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = (e.clientX - rect.left) * (canvas.width / rect.width);
    lastY = (e.clientY - rect.top) * (canvas.height / rect.height);
  });
  
  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const currentY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    
    lastX = currentX;
    lastY = currentY;
  });
  
  canvas.addEventListener('mouseup', () => {
    isDrawing = false;
  });
  
  canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
  });
  
  // 터치 이벤트 (모바일 지원)
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    lastX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    lastY = (touch.clientY - rect.top) * (canvas.height / rect.height);
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const currentX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const currentY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    
    lastX = currentX;
    lastY = currentY;
  });
  
  canvas.addEventListener('touchend', () => {
    isDrawing = false;
  });
}

// 서명 지우기
function clearSignature(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 이메일 발송
async function sendEmail() {
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
    
    const reportData = {
      customerInfo: ocrData,
      packageId: selectedPackages.map(pkg => pkg.id),
      packages: selectedPackages,
      recipientEmail,
      installDate,
      installTime,
      installAddress,
      notes
    };
    
    const response = await axios.post('/api/generate-report', reportData);
    
    if (response.data.success) {
      alert(`시공 확인서가 성공적으로 생성되었습니다!\n\n이메일 발송 주소: ${recipientEmail}\n\n이메일 발송 기능은 추가 개발 예정입니다.`);
      console.log('Report:', response.data.report);
      console.log('Email:', recipientEmail);
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
