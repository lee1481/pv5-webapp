import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { allPackages, getPackageById } from './packages'

type Bindings = {
  AI?: any;
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

    // 이미지를 base64로 변환
    const arrayBuffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    // Cloudflare Workers AI를 사용한 OCR (선택사항)
    // 또는 외부 OCR API 사용 (Google Vision API, Tesseract 등)
    
    // 임시: 샘플 데이터 반환 (실제로는 OCR 결과 파싱)
    const mockData = {
      customerName: '이승민',
      phone: '010-2966-7497',
      address: '(28217) 충북4로 세종시 연동면 15호-3305',
      productName: 'PV5 기아 밀워키 워크스테이션',
      productCode: '202601300939847917',
      amount: 4850000,
      orderDate: '2025년 01월 20일'
    }
    
    return c.json({ success: true, data: mockData })
  } catch (error) {
    console.error('OCR Error:', error)
    return c.json({ error: 'OCR processing failed' }, 500)
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
                    <div class="file-upload-area rounded-lg p-12 text-center" id="dropZone">
                        <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
                        <p class="text-lg text-gray-600 mb-4">거래명세서 이미지를 드래그하거나 클릭하여 업로드</p>
                        <input type="file" id="fileInput" accept="image/*" class="hidden">
                        <button onclick="document.getElementById('fileInput').click()" 
                                class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                            <i class="fas fa-folder-open mr-2"></i>파일 선택
                        </button>
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
