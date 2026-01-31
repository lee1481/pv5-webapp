import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { allPackages, getPackageById } from './packages'

type Bindings = {
  AI: any;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// API: 모든 제품 패키지 리스트
app.get('/api/packages', (c) => {
  return c.json({ packages: allPackages })
})

// API: 특정 제품 패키지 조회
app.get('/api/packages/:id', (c) => {
  const id = c.req.param('id')
  const pkg = getPackageById(id)
  
  if (!pkg) {
    return c.json({ error: 'Package not found' }, 404)
  }
  
  return c.json({ package: pkg })
})

// API: 거래명세서 OCR 분석
app.post('/api/ocr', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file'] as File
    
    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400)
    }

    console.log('OCR request received:', file.name, file.type, file.size);

    // 이미지를 Base64로 변환
    const arrayBuffer = await file.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    
    // Google Cloud Vision API 키 확인
    const GOOGLE_VISION_API_KEY = c.env?.GOOGLE_VISION_API_KEY;
    
    if (!GOOGLE_VISION_API_KEY) {
      console.error('GOOGLE_VISION_API_KEY not found in environment');
      return c.json({ 
        success: false, 
        data: {
          customerName: '',
          phone: '',
          address: '',
          productName: '',
          productCode: '',
          orderNumber: '',
          orderDate: new Date().toLocaleDateString('ko-KR'),
          ocrRawText: '',
          aiSuccess: false,
          recognitionSuccess: false
        },
        message: 'OCR 서비스 설정이 필요합니다. 관리자에게 문의하세요.'
      }, 200)
    }
    
    console.log('Calling Google Cloud Vision API...');
    
    // Google Cloud Vision API 호출
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image
            },
            features: [{
              type: 'DOCUMENT_TEXT_DETECTION', // 문서 OCR에 최적화
              maxResults: 1
            }]
          }]
        })
      }
    );
    
    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Google Vision API error:', visionResponse.status, errorText);
      throw new Error(`Google Vision API error: ${visionResponse.status}`);
    }
    
    const visionData = await visionResponse.json();
    console.log('Google Vision API response received');
    
    // OCR 텍스트 추출
    const fullTextAnnotation = visionData.responses?.[0]?.fullTextAnnotation;
    const ocrText = fullTextAnnotation?.text || '';
    const aiSuccess = !!ocrText; // Vision API 성공 여부
    
    console.log('Extracted OCR text length:', ocrText.length);
    console.log('OCR text preview:', ocrText.substring(0, 200));
    
    if (!ocrText || ocrText.length < 10) {
      console.warn('No text detected in image');
      return c.json({
        success: false,
        data: {
          customerName: '',
          phone: '',
          address: '',
          productName: '',
          productCode: '',
          orderNumber: '',
          orderDate: new Date().toLocaleDateString('ko-KR'),
          ocrRawText: ocrText,
          aiSuccess: true,
          recognitionSuccess: false
        },
        message: '이미지에서 텍스트를 인식할 수 없습니다. 이미지 품질을 확인해주세요.'
      }, 200);
    }
    
    // OCR 결과 파싱 (우측 수령자 정보만 추출)
    const parseOCRResult = (text: string) => {
      const data: any = {
        outputDate: '',        // 출력일자
        deliveryNumber: '',    // 배송번호
        receiverName: '',      // 수령자명
        ordererName: '',       // 주문자명
        receiverAddress: '',   // 수령자 주소
        receiverPhone: '',     // 수령자 연락처
        deliveryMemo: '',      // 배송메모
        orderNumber: '',       // 주문번호
        productCode: '',       // 상품번호
        productName: ''        // 상품명
      };
      
      if (!text || text.length < 5) {
        return data;
      }
      
      console.log('Parsing OCR text (우측 수령자 정보만):', text);
      
      // 우측 수령자 영역만 추출 (수령자, 주문자, 수령자 주소 이후 텍스트)
      const receiverSection = text.match(/(?:수령자|받는사람|수령인)([\s\S]*?)(?:공급자|SEQ\.|이하여백|$)/i);
      const targetText = receiverSection ? receiverSection[1] : text;
      
      console.log('Target text (수령자 영역):', targetText);
      
      // 1. 출력일자 추출
      const outputDatePatterns = [
        /출력일자[\s\n]+(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/i,
        /출력일[\s\n]+(\d{4})[.-](\d{1,2})[.-](\d{1,2})/i
      ];
      for (const pattern of outputDatePatterns) {
        const match = text.match(pattern);
        if (match) {
          data.outputDate = `${match[1]}년 ${match[2].padStart(2, '0')}월 ${match[3].padStart(2, '0')}일`;
          console.log('Output date found:', data.outputDate);
          break;
        }
      }
      
      // 2. 배송번호 추출
      const deliveryNumberPatterns = [
        /배송번호[\s\n]+(\d{8})/i
      ];
      for (const pattern of deliveryNumberPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          data.deliveryNumber = match[1].trim();
          console.log('Delivery number found:', data.deliveryNumber);
          break;
        }
      }
      
      // 3. 수령자명 추출 (라벨 바로 다음 줄)
      const receiverNamePatterns = [
        /수령자명[\s\n]+([가-힣]{2,10})(?:\s|\n|$)/i
      ];
      for (const pattern of receiverNamePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          data.receiverName = match[1].trim();
          console.log('Receiver name found:', data.receiverName);
          break;
        }
      }
      
      // 4. 주문자명 추출 (수령자명과 동일하게 처리)
      const ordererNamePatterns = [
        /주문자명[\s\n]+([가-힣]{2,10})(?:\s|\n|\(|수|$)/i
      ];
      for (const pattern of ordererNamePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          data.ordererName = match[1].trim();
          console.log('Orderer name found:', data.ordererName);
          break;
        }
      }
      
      // 주문자명이 비어있으면 수령자명과 같다고 가정
      if (!data.ordererName && data.receiverName) {
        data.ordererName = data.receiverName;
      }
      
      // 5. 수령자 주소 추출 (2줄 결합, 괄호 포함)
      const receiverAddressPatterns = [
        /수령자\s*주소[\s\n]+(\(\d{5}\)\s*[^\n]+)[\s\n]+([^\n]+?)(?=\n0|\n수령자|$)/i
      ];
      for (const pattern of receiverAddressPatterns) {
        const match = text.match(pattern);
        if (match) {
          const line1 = match[1].trim();
          const line2 = match[2].trim();
          data.receiverAddress = `${line1} ${line2}`;
          console.log('Receiver address found:', data.receiverAddress);
          break;
        }
      }
      
      // 6. 수령자 연락처 추출 (분리된 번호 결합)
      const receiverPhonePatterns = [
        /(010)[-\s]*(\d{4})[-\s]*\n수령자\s*연락처1[\s\n]+수령자\s*연락처2[\s\n]+(\d{4})/i,
        /수령자\s*연락처1[\s\n]+(010[-\s]?\d{3,4}[-\s]?\d{4})/i
      ];
      for (const pattern of receiverPhonePatterns) {
        const match = text.match(pattern);
        if (match) {
          if (match[3]) {
            // 분리된 경우: 010-2966- + 7497
            data.receiverPhone = `${match[1]}-${match[2]}-${match[3]}`;
          } else if (match[1]) {
            data.receiverPhone = match[1].replace(/\s/g, '');
          }
          console.log('Receiver phone found:', data.receiverPhone);
          break;
        }
      }
      
      // 7. 배송메모 추출 (라벨만 있고 내용 없으면 비워두기)
      const deliveryMemoPatterns = [
        /배송메모[\s\n]+([가-힣\w\s]{3,50})(?=\n상품명|\n주문번호|$)/i
      ];
      for (const pattern of deliveryMemoPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && !match[1].includes('상품명') && !match[1].includes('주문')) {
          data.deliveryMemo = match[1].trim();
          console.log('Delivery memo found:', data.deliveryMemo);
          break;
        }
      }
      
      // 8. 주문번호 추출 (18-20자리)
      const orderNumberPatterns = [
        /주문번호[\s\n]+(\d{18,20})/i,
        /(\d{18,20})/
      ];
      for (const pattern of orderNumberPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          data.orderNumber = match[1].trim();
          console.log('Order number found:', data.orderNumber);
          break;
        }
      }
      
      // 9. 상품번호 추출 (정확히 9자리)
      // 먼저 사업자등록번호 찾기 (10자리)
      const businessNumberMatch = text.match(/사업자등록번호[\s\n]+(\d{10})/i);
      const businessNumber = businessNumberMatch ? businessNumberMatch[1] : null;
      
      // 1/1 다음의 9자리 숫자를 찾기
      const productCodePattern = /1\/1[\s\n]+(\d{9})(?!\d)/i;
      const productMatch = text.match(productCodePattern);
      
      if (productMatch && productMatch[1] && productMatch[1] !== businessNumber) {
        data.productCode = productMatch[1];
        console.log('Product code found:', data.productCode);
      }
      
      // 10. 상품명 추출
      const productNamePatterns = [
        /(?:상품명|제품명|품명)[\s:：]*([^\n]{5,100})/i,
        /PV5[\s가-힣\w]+(?:워크스테이션|스마트|선반|격벽|밀워키|카고)/i
      ];
      for (const pattern of productNamePatterns) {
        const match = text.match(pattern);
        if (match) {
          data.productName = (match[1] || match[0]).trim();
          console.log('Product name found:', data.productName);
          break;
        }
      }
      
      console.log('Final parsed data:', data);
      return data;
    };
    
    const extractedData = ocrText ? parseOCRResult(ocrText) : {};
    
    // 인식 성공 여부 판단
    const hasValidData = (
      (extractedData.receiverName && extractedData.receiverName.length >= 2) ||
      (extractedData.receiverPhone && extractedData.receiverPhone.length >= 10) ||
      (extractedData.receiverAddress && extractedData.receiverAddress.length >= 10) ||
      (extractedData.orderNumber && extractedData.orderNumber.length >= 8)
    );
    
    console.log('Validation result:', {
      hasValidData,
      receiverName: extractedData.receiverName,
      receiverPhone: extractedData.receiverPhone,
      receiverAddress: extractedData.receiverAddress,
      orderNumber: extractedData.orderNumber
    });
    
    // 결과 데이터
    const resultData = {
      outputDate: extractedData.outputDate || '',
      deliveryNumber: extractedData.deliveryNumber || '',
      receiverName: extractedData.receiverName || '',
      ordererName: extractedData.ordererName || '',
      receiverAddress: extractedData.receiverAddress || '',
      receiverPhone: extractedData.receiverPhone || '',
      deliveryMemo: extractedData.deliveryMemo || '',
      orderNumber: extractedData.orderNumber || '',
      productCode: extractedData.productCode || '',
      productName: extractedData.productName || '',
      ocrRawText: ocrText, // 디버깅용
      aiSuccess: aiSuccess,
      recognitionSuccess: hasValidData
    };
    
    console.log('Final OCR result:', resultData);
    
    // 인식 실패 시 명시적으로 실패 응답
    if (!hasValidData && aiSuccess) {
      console.warn('OCR recognition failed - no valid data extracted');
      return c.json({ 
        success: false, 
        data: resultData,
        message: 'OCR 인식에 실패했습니다. 이미지 품질을 확인하거나 수동으로 입력해주세요.'
      }, 200)
    }
    
    if (!aiSuccess) {
      console.warn('AI binding not available or failed');
      return c.json({
        success: false,
        data: resultData,
        message: 'OCR 서비스를 사용할 수 없습니다. Cloudflare Pages에 배포 후 사용 가능합니다.'
      }, 200)
    }
    
    return c.json({ success: true, data: resultData })
  } catch (error) {
    console.error('OCR Error:', error)
    return c.json({ 
      error: 'OCR processing failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      suggestion: '수동으로 입력해주세요.'
    }, 500)
  }
})

// API: 시공 확인서 생성 (PDF용 데이터)
app.post('/api/generate-report', async (c) => {
  try {
    const body = await c.req.json()
    
    const {
      customerInfo,
      packageId,
      installDate,
      installAddress,
      installTime,
      notes
    } = body
    
    const pkg = getPackageById(packageId)
    
    if (!pkg) {
      return c.json({ error: 'Invalid package ID' }, 400)
    }
    
    const report = {
      id: `INSTALL-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customerInfo,
      package: pkg,
      installDate,
      installAddress,
      installTime,
      notes,
      status: 'pending'
    }
    
    return c.json({ success: true, report })
  } catch (error) {
    console.error('Report Generation Error:', error)
    return c.json({ error: 'Failed to generate report' }, 500)
  }
})

// 메인 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PV5 시공 확인 점검표 시스템</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .file-upload-area {
            border: 2px dashed #cbd5e0;
            transition: all 0.3s;
          }
          .file-upload-area:hover {
            border-color: #4299e1;
            background-color: #ebf8ff;
          }
          .package-card {
            transition: all 0.3s;
            cursor: pointer;
          }
          .package-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
          .package-card.selected {
            border: 3px solid #4299e1;
            background-color: #ebf8ff;
          }
          .step-indicator {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2rem;
          }
          .step {
            flex: 1;
            text-align: center;
            padding: 1rem;
            border-bottom: 3px solid #e2e8f0;
            color: #a0aec0;
          }
          .step.active {
            border-bottom-color: #4299e1;
            color: #4299e1;
            font-weight: bold;
          }
          .step.completed {
            border-bottom-color: #48bb78;
            color: #48bb78;
          }
        </style>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 shadow-lg">
                <div class="container mx-auto px-4">
                    <h1 class="text-3xl font-bold flex items-center">
                        <i class="fas fa-clipboard-check mr-3"></i>
                        PV5 시공 확인 점검표 시스템
                    </h1>
                    <p class="text-blue-100 mt-2">거래명세서 자동 인식 → 제품 선택 → 설치 일정 확정 → PDF/메일 발송</p>
                </div>
            </header>

            <!-- Main Content -->
            <main class="container mx-auto px-4 py-8">
                <!-- Step Indicator -->
                <div class="step-indicator bg-white rounded-lg shadow-md mb-8">
                    <div class="step active" id="step1">
                        <i class="fas fa-upload text-2xl mb-2"></i>
                        <div>1. 거래명세서 업로드</div>
                    </div>
                    <div class="step" id="step2">
                        <i class="fas fa-box text-2xl mb-2"></i>
                        <div>2. 제품 선택</div>
                    </div>
                    <div class="step" id="step3">
                        <i class="fas fa-calendar-alt text-2xl mb-2"></i>
                        <div>3. 설치 정보 입력</div>
                    </div>
                    <div class="step" id="step4">
                        <i class="fas fa-check-circle text-2xl mb-2"></i>
                        <div>4. 확인 및 발송</div>
                    </div>
                </div>

                <!-- Step 1: 파일 업로드 -->
                <div id="upload-section" class="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-file-upload text-blue-600 mr-2"></i>
                        1단계: 거래명세서 업로드
                    </h2>
                    <div class="file-upload-area rounded-lg p-12 text-center cursor-pointer" id="dropZone">
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
                    </div>
                    <div id="uploadResult" class="mt-6 hidden">
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 class="font-bold text-green-800 mb-2">
                                <i class="fas fa-check-circle mr-2"></i>자동 인식 완료
                            </h3>
                            <div id="ocrData" class="grid grid-cols-2 gap-4 text-sm"></div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: 제품 선택 -->
                <div id="package-section" class="bg-white rounded-lg shadow-lg p-8 mb-8 hidden">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-box-open text-blue-600 mr-2"></i>
                        2단계: 시공 제품 선택
                    </h2>
                    
                    <!-- 브랜드 선택 탭 -->
                    <div class="flex space-x-4 mb-6">
                        <button onclick="showBrand('milwaukee')" 
                                class="brand-tab flex-1 py-3 px-6 rounded-lg font-bold transition"
                                data-brand="milwaukee">
                            <i class="fas fa-tools mr-2"></i>밀워키 에디션
                        </button>
                        <button onclick="showBrand('kia')" 
                                class="brand-tab flex-1 py-3 px-6 rounded-lg font-bold transition"
                                data-brand="kia">
                            <i class="fas fa-car mr-2"></i>기아 순정형
                        </button>
                    </div>
                    
                    <!-- 제품 패키지 카드 -->
                    <div id="packageGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
                </div>

                <!-- Step 3: 설치 정보 입력 -->
                <div id="install-section" class="bg-white rounded-lg shadow-lg p-8 mb-8 hidden">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-calendar-check text-blue-600 mr-2"></i>
                        3단계: 설치 일정 및 장소 확정
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-calendar mr-2"></i>설치 날짜
                            </label>
                            <input type="date" id="installDate" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-clock mr-2"></i>설치 시간
                            </label>
                            <input type="time" id="installTime" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-map-marker-alt mr-2"></i>설치 주소
                            </label>
                            <input type="text" id="installAddress" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="설치 장소 주소를 입력하세요">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-comment mr-2"></i>특이사항 / 비고
                            </label>
                            <textarea id="notes" rows="4"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      placeholder="설치 시 주의사항이나 특이사항을 입력하세요"></textarea>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end space-x-4">
                        <button onclick="prevStep(2)" 
                                class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <i class="fas fa-arrow-left mr-2"></i>이전
                        </button>
                        <button onclick="nextStep(4)" 
                                class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                            다음 <i class="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 4: 최종 확인 및 발송 -->
                <div id="confirm-section" class="bg-white rounded-lg shadow-lg p-8 mb-8 hidden">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-check-double text-blue-600 mr-2"></i>
                        4단계: 최종 확인 및 발송
                    </h2>
                    <div id="finalPreview" class="mb-6"></div>
                    <div class="flex justify-end space-x-4">
                        <button onclick="prevStep(3)" 
                                class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <i class="fas fa-arrow-left mr-2"></i>이전
                        </button>
                        <button onclick="downloadPDF()" 
                                class="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700">
                            <i class="fas fa-file-pdf mr-2"></i>PDF 다운로드
                        </button>
                        <button onclick="sendEmail()" 
                                class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
                            <i class="fas fa-envelope mr-2"></i>이메일 발송
                        </button>
                    </div>
                </div>
            </main>

            <!-- Footer -->
            <footer class="bg-gray-800 text-white py-6 mt-12">
                <div class="container mx-auto px-4 text-center">
                    <p>&copy; 2025 사인마스터 PV5 시공관리 시스템. All rights reserved.</p>
                </div>
            </footer>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
