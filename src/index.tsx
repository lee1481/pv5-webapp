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

    // 이미지를 배열로 변환
    const arrayBuffer = await file.arrayBuffer()
    const imageArray = Array.from(new Uint8Array(arrayBuffer))
    
    // Cloudflare Workers AI를 사용한 OCR
    let ocrText = '';
    let aiSuccess = false;
    
    try {
      // AI 바인딩 확인
      if (c.env && c.env.AI) {
        // @cf/llava-hf/llava-1.5-7b-hf 모델 사용 (이미지 분석)
        const aiResponse = await c.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
          image: imageArray,
          prompt: "이 이미지는 한국어 거래명세서/택배 송장입니다. 다음 정보를 정확히 추출해주세요:\n\n1. 수령자 이름 (받는사람, 수령인)\n2. 전화번호 (연락처, 핸드폰번호)\n3. 배송 주소 (주소)\n4. 상품명 (제품명, 품명)\n5. 주문번호 (오더번호)\n6. 상품번호 (품번, 제품번호)\n\n각 항목을 다음 형식으로 답변해주세요:\n수령자: [이름]\n전화번호: [번호]\n주소: [주소]\n상품명: [제품명]\n주문번호: [번호]\n상품번호: [번호]",
          max_tokens: 512
        })
        
        ocrText = aiResponse.description || '';
        aiSuccess = true;
        console.log('AI OCR Success:', ocrText);
      } else {
        console.warn('AI binding not available in development mode');
      }
    } catch (aiError) {
      console.error('AI OCR Error:', aiError);
      aiSuccess = false;
    }
    
    // OCR 결과 파싱 (개선된 파싱 로직)
    const parseOCRResult = (text: string) => {
      const data: any = {
        customerName: '',
        phone: '',
        address: '',
        productName: '',
        productCode: '',
        orderNumber: '',
        orderDate: ''
      };
      
      if (!text || text.length < 10) {
        return data;
      }
      
      // JSON 응답 시도
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.customerName || parsed['수령자'] || parsed['고객명']) {
            data.customerName = parsed.customerName || parsed['수령자'] || parsed['고객명'] || parsed['받는사람'] || '';
            data.phone = parsed.phone || parsed['전화번호'] || parsed['연락처'] || '';
            data.address = parsed.address || parsed['주소'] || parsed['배송지'] || '';
            data.productName = parsed.productName || parsed['상품명'] || parsed['제품명'] || '';
            data.productCode = parsed.productCode || parsed['상품번호'] || parsed['품번'] || '';
            data.orderNumber = parsed.orderNumber || parsed['주문번호'] || parsed['오더번호'] || '';
            return data;
          }
        }
      } catch (e) {
        console.log('JSON parsing failed, using text extraction');
      }
      
      // 텍스트에서 패턴 추출 (개선된 정규식)
      // 1. 수령자 이름
      const nameMatch = text.match(/(?:수령자|수령인|받는사람|받는분|고객명|이름|성명)[\s:：\-]*([가-힣]{2,10})/i);
      if (nameMatch) data.customerName = nameMatch[1].trim();
      
      // 2. 전화번호 (다양한 형식 지원)
      const phoneMatch = text.match(/(?:전화번호|연락처|전화|휴대폰|핸드폰|TEL|PHONE)[\s:：\-]*(0[\d]{1,2}[-\s]?\d{3,4}[-\s]?\d{4})/i);
      if (phoneMatch) data.phone = phoneMatch[1].replace(/\s/g, '');
      
      // 전화번호가 없으면 숫자 패턴으로 재시도
      if (!data.phone) {
        const phonePattern = text.match(/(0[\d]{1,2}[-\s]?\d{3,4}[-\s]?\d{4})/);
        if (phonePattern) data.phone = phonePattern[1].replace(/\s/g, '');
      }
      
      // 3. 주소 (긴 텍스트)
      const addressMatch = text.match(/(?:주소|배송지|배송주소|수령주소)[\s:：\-]*([^\n]{10,150})/i);
      if (addressMatch) data.address = addressMatch[1].trim();
      
      // 주소가 없으면 '시', '구', '동' 패턴으로 재시도
      if (!data.address) {
        const addressPattern = text.match(/([가-힣]+시\s+[가-힣]+구\s+[^\n]{5,100})/);
        if (addressPattern) data.address = addressPattern[1].trim();
      }
      
      // 4. 상품명
      const productMatch = text.match(/(?:상품명|제품명|품명|상품|제품|PRODUCT)[\s:：\-]*([^\n]{3,80})/i);
      if (productMatch) data.productName = productMatch[1].trim();
      
      // 5. 주문번호
      const orderMatch = text.match(/(?:주문번호|주문코드|오더번호|ORDER[\s]?NO|주문NO)[\s:：\-]*([\dA-Z-]+)/i);
      if (orderMatch) data.orderNumber = orderMatch[1].trim();
      
      // 6. 상품번호
      const productCodeMatch = text.match(/(?:상품번호|품번|제품번호|품목번호|ITEM[\s]?NO|상품코드)[\s:：\-]*([\dA-Z-]+)/i);
      if (productCodeMatch) data.productCode = productCodeMatch[1].trim();
      
      // 상품번호가 없으면 주문번호를 사용
      if (!data.productCode && data.orderNumber) {
        data.productCode = data.orderNumber;
      }
      
      return data;
    };
    
    const extractedData = ocrText ? parseOCRResult(ocrText) : {};
    
    // 인식 성공 여부 판단 (수령자 이름이 있으면 성공으로 판단)
    const hasValidData = extractedData.customerName && 
                         extractedData.customerName !== '' && 
                         extractedData.customerName.length > 1;
    
    // 결과 데이터
    const resultData = {
      customerName: extractedData.customerName || '',
      phone: extractedData.phone || '',
      address: extractedData.address || '',
      productName: extractedData.productName || '',
      productCode: extractedData.productCode || extractedData.orderNumber || '',
      orderNumber: extractedData.orderNumber || '',
      orderDate: extractedData.orderDate || new Date().toLocaleDateString('ko-KR'),
      ocrRawText: ocrText, // 디버깅용
      aiSuccess: aiSuccess,
      recognitionSuccess: hasValidData
    };
    
    // 인식 실패 시 명시적으로 실패 응답
    if (!hasValidData && aiSuccess) {
      return c.json({ 
        success: false, 
        data: resultData,
        message: 'OCR 인식에 실패했습니다. 수동으로 입력해주세요.'
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
