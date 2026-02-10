import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { allPackages, getPackageById } from './packages'

type Bindings = {
  AI: any;
  RESEND_API_KEY?: string;
  REPORTS_KV?: KVNamespace;
  DB: D1Database; // UPDATED - D1 Database
  R2: R2Bucket; // UPDATED - R2 Storage
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
        /출력일자[\s\n:：]*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/i,
        /출력일[\s\n:：]*(\d{4})[.-](\d{1,2})[.-](\d{1,2})/i,
        /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/i  // 라벨 없이 날짜만
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
      
      // 5. 수령자 주소 추출 (개선된 패턴 - 더 유연하게)
      const receiverAddressPatterns = [
        // 패턴 1: 우편번호 포함 (괄호 있음) - 2줄
        /수령자\s*주소[\s\n]+(\(\d{5}\)\s*[^\n]+)[\s\n]+([^\n]+?)(?=\n0|\n수령자|$)/i,
        // 패턴 2: 우편번호 포함 (괄호 있음) - 1줄
        /수령자\s*주소[\s\n]+(\(\d{5}\)\s*[^\n]+)/i,
        // 패턴 3: 우편번호 없음 - 2줄
        /수령자\s*주소[\s\n]+([^\n]+)[\s\n]+([^\n]+?)(?=\n0|\n수령자|$)/i,
        // 패턴 4: 우편번호 없음 - 1줄
        /수령자\s*주소[\s\n]+([^\n]+?)(?=\n0|\n수령자|$)/i,
        // 패턴 5: 주소 라벨 다음 모든 내용 (최대 2줄)
        /주소[\s\n]+([^\n]+(?:\n[^\n]+)?)/i
      ];
      for (const pattern of receiverAddressPatterns) {
        const match = text.match(pattern);
        if (match) {
          if (match[2]) {
            // 2줄인 경우
            const line1 = match[1].trim();
            const line2 = match[2].trim();
            data.receiverAddress = `${line1} ${line2}`;
          } else if (match[1]) {
            // 1줄인 경우
            data.receiverAddress = match[1].trim();
          }
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
      
      // 9. 상품번호 추출 (개선된 패턴)
      // 먼저 사업자등록번호 찾기 (10자리)
      const businessNumberMatch = text.match(/사업자등록번호[\s\n:：]+(\d{10})/i);
      const businessNumber = businessNumberMatch ? businessNumberMatch[1] : null;
      
      // 패턴 1: 1/1 다음의 9자리 숫자
      const productCodePattern1 = /1\/1[\s\n]+(\d{9})(?!\d)/i;
      // 패턴 2: 상품번호 라벨 뒤의 숫자
      const productCodePattern2 = /상품번호[\s\n:：]+(\d{8,10})/i;
      // 패턴 3: 단독 9자리 숫자 찾기
      const productCodePattern3 = /(?:^|\n)(\d{9})(?!\d)/gm;
      
      const productMatch1 = text.match(productCodePattern1);
      const productMatch2 = text.match(productCodePattern2);
      
      if (productMatch1 && productMatch1[1] && productMatch1[1] !== businessNumber) {
        data.productCode = productMatch1[1];
        console.log('Product code found (pattern 1):', data.productCode);
      } else if (productMatch2 && productMatch2[1] && productMatch2[1] !== businessNumber) {
        data.productCode = productMatch2[1];
        console.log('Product code found (pattern 2):', data.productCode);
      } else {
        // 패턴 3: 모든 9자리 숫자 찾기
        let match;
        while ((match = productCodePattern3.exec(text)) !== null) {
          if (match[1] !== businessNumber && !data.deliveryNumber?.includes(match[1])) {
            data.productCode = match[1];
            console.log('Product code found (pattern 3):', data.productCode);
            break;
          }
        }
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

// API: 이메일 발송
app.post('/api/send-email', async (c) => {
  try {
    const { env } = c
    const body = await c.req.json()
    
    const {
      recipientEmail,
      customerInfo,
      packages,
      installDate,
      installTime,
      installAddress,
      notes,
      attachmentImage,
      attachmentFileName,
      attachmentContentType
    } = body
    
    // Resend API 키 확인
    if (!env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured - Email service disabled')
      
      // 임시 해결책: 이메일 없이 성공 응답 (개발 환경용)
      console.log('Email would be sent to:', recipientEmail)
      console.log('Customer:', customerInfo?.receiverName)
      console.log('Install Date:', installDate)
      
      return c.json({ 
        success: true, 
        message: '✅ 시공 확인서가 저장되었습니다!\n\n⚠️ 참고: 이메일 발송 기능은 현재 비활성화되어 있습니다.\nResend API 키를 설정하면 자동으로 이메일이 발송됩니다.\n\n설정 방법:\n1. https://resend.com 에서 무료 계정 생성\n2. API 키 발급\n3. Cloudflare Dashboard → Workers & Pages → pv5-webapp → Settings → Variables → RESEND_API_KEY 추가',
        emailDisabled: true
      }, 200)
    }
    
    // 이메일 내용 생성
    const packageList = packages.map((pkg: any) => `
      <li><strong>${pkg.fullName || pkg.name}</strong></li>
    `).join('')
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { margin-bottom: 25px; background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
          .section-title { font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
          .info-row { margin: 8px 0; }
          .label { font-weight: bold; color: #4b5563; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          ul { list-style-type: none; padding-left: 0; }
          li { padding: 5px 0; }
        </style>
        <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 PV5 시공(예약) 확인서</h1>
          </div>
          <div class="content">
            <div class="section">
              <div class="section-title">👤 고객 정보</div>
              <div class="info-row"><span class="label">고객명:</span> ${customerInfo?.receiverName || '-'}</div>
              <div class="info-row"><span class="label">연락처:</span> ${customerInfo?.receiverPhone || '-'}</div>
              <div class="info-row"><span class="label">주소:</span> ${customerInfo?.receiverAddress || '-'}</div>
              <div class="info-row"><span class="label">주문번호:</span> ${customerInfo?.orderNumber || '-'}</div>
            </div>
            
            <div class="section">
              <div class="section-title">📦 선택 제품</div>
              <ul>${packageList}</ul>
            </div>
            
            <div class="section">
              <div class="section-title">📅 설치 정보</div>
              <div class="info-row"><span class="label">설치 날짜:</span> ${installDate || '-'}</div>
              <div class="info-row"><span class="label">설치 시간:</span> ${installTime || '-'}</div>
              <div class="info-row"><span class="label">설치 주소:</span> ${installAddress || '-'}</div>
              ${notes ? `<div class="info-row"><span class="label">특이사항:</span> ${notes}</div>` : ''}
            </div>
          </div>
          <div class="footer">
            <p>© 2026 사인마스터 PV5 시공관리 시스템</p>
            <p>이 메일은 PV5 시공 확인 점검표 시스템에서 자동으로 발송되었습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    // Resend API 호출 - 첨부파일 포함
    const emailPayload: any = {
      from: 'PV5 시공관리 <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `[PV5 시공(예약) 확인서] ${customerInfo?.receiverName || '고객'}님 시공(예약) 확인서`,
      html: htmlContent
    };
    
    // 첨부파일이 있으면 추가
    if (attachmentImage && attachmentFileName) {
      console.log('Adding attachment to email:', attachmentFileName);
      emailPayload.attachments = [{
        filename: attachmentFileName,
        content: attachmentImage, // base64 문자열
        content_type: attachmentContentType || 'image/png'
      }];
    }
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })
    
    const resendData = await resendResponse.json()
    
    if (!resendResponse.ok) {
      console.error('Resend API Error:', resendData)
      return c.json({ 
        success: false, 
        message: '이메일 발송에 실패했습니다. 다시 시도해주세요.',
        error: resendData
      }, 200)
    }
    
    console.log('Email sent successfully:', resendData)
    return c.json({ 
      success: true, 
      message: '이메일이 성공적으로 발송되었습니다!',
      emailId: resendData.id 
    })
    
  } catch (error) {
    console.error('Email sending error:', error)
    return c.json({ 
      success: false, 
      message: '이메일 발송 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: 시공 확인서 저장
// API: 이미지 업로드 (R2) // UPDATED
app.post('/api/upload-image', async (c) => { // UPDATED
  try { // UPDATED
    const { env } = c // UPDATED
    const formData = await c.req.formData() // UPDATED
    const file = formData.get('image') as File // UPDATED
    
    if (!file) { // UPDATED
      return c.json({ success: false, message: '이미지 파일이 없습니다.' }, 400) // UPDATED
    } // UPDATED
    
    // R2에 저장 // UPDATED
    const imageKey = `images/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}` // UPDATED
    await env.R2.put(imageKey, file.stream()) // UPDATED
    
    return c.json({ // UPDATED
      success: true, // UPDATED
      imageKey, // UPDATED
      filename: file.name // UPDATED
    }) // UPDATED
  } catch (error) { // UPDATED
    console.error('Image upload error:', error) // UPDATED
    return c.json({ // UPDATED
      success: false, // UPDATED
      message: '이미지 업로드 실패', // UPDATED
      error: error instanceof Error ? error.message : 'Unknown error' // UPDATED
    }, 500) // UPDATED
  } // UPDATED
}) // UPDATED

// API: 시공 확인서 저장 (D1 + R2) // UPDATED
app.post('/api/reports/save', async (c) => {
  try {
    const { env } = c
    
    // 바인딩 확인 // UPDATED
    if (!env.DB) { // UPDATED
      console.error('❌ D1 binding not found!', Object.keys(env)) // UPDATED
      return c.json({ // UPDATED
        success: false, // UPDATED
        message: 'D1 데이터베이스가 연결되지 않았습니다.', // UPDATED
        error: 'D1 binding missing' // UPDATED
      }, 500) // UPDATED
    } // UPDATED
    
    const body = await c.req.json()
    
    const {
      reportId,
      customerInfo,
      packages,
      packagePositions, // UPDATED - 3단 선반 위치
      installDate,
      installTime,
      installAddress,
      notes,
      installerName,
      attachmentImage,
      attachmentFileName
    } = body
    
    // finalReportId 생성 및 특수문자 제거 (SQL 안전성 보장)
    const rawReportId = reportId || `REPORT-${Date.now()}`
    const finalReportId = rawReportId.replace(/[^a-zA-Z0-9-_]/g, '_') // 특수문자를 '_'로 치환
    
    console.log('Original reportId:', rawReportId)
    console.log('Sanitized finalReportId:', finalReportId)
    
    // 이미지가 있으면 R2에 저장 // UPDATED
    let imageKey = null // UPDATED
    if (attachmentImage && env.R2) { // UPDATED - FIX: R2 바인딩 확인
      try { // UPDATED - FIX
        imageKey = `images/${Date.now()}-${finalReportId.replace(/[^a-zA-Z0-9-]/g, '_')}-${(attachmentFileName || 'attachment.jpg').replace(/[^a-zA-Z0-9.-]/g, '_')}` // UPDATED - FIX: 특수문자 제거
        console.log('Saving image to R2:', imageKey) // UPDATED - FIX
        // Cloudflare Workers에서 Base64를 Uint8Array로 변환 // UPDATED - FIX
        const binaryString = atob(attachmentImage) // UPDATED - FIX
        const bytes = new Uint8Array(binaryString.length) // UPDATED - FIX
        for (let i = 0; i < binaryString.length; i++) { // UPDATED - FIX
          bytes[i] = binaryString.charCodeAt(i) // UPDATED - FIX
        } // UPDATED - FIX
        await env.R2.put(imageKey, bytes) // UPDATED - FIX
        console.log('Image saved to R2 successfully') // UPDATED - FIX
      } catch (r2Error) { // UPDATED - FIX
        console.error('R2 save error (continuing without image):', r2Error) // UPDATED - FIX
        imageKey = null // UPDATED - FIX: R2 실패 시에도 계속 진행
      } // UPDATED - FIX
    } // UPDATED
    
    // D1에 저장 (undefined 값 처리)
    console.log('Preparing to save to D1...')
    console.log('env.DB type:', typeof env.DB)
    console.log('env.DB:', env.DB)
    console.log('finalReportId:', finalReportId)
    
    // SQL 쿼리를 상수로 분리
    const insertSQL = `INSERT OR REPLACE INTO reports (
      report_id, customer_info, packages, package_positions,
      install_date, install_time, install_address, notes,
      installer_name, image_key, image_filename,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    
    console.log('SQL Query:', insertSQL)
    console.log('Calling env.DB.prepare()...')
    
    const stmt = env.DB.prepare(insertSQL)
    
    console.log('Statement prepared successfully')
    console.log('Binding values...')
    
    // 바인딩할 값들 준비
    const bindValues = [
      finalReportId,
      JSON.stringify(customerInfo || {}),
      JSON.stringify(packages || []),
      JSON.stringify(packagePositions || {}),
      installDate || null,
      installTime || null,
      installAddress || null,
      notes || null,
      installerName || null,
      imageKey || null,
      attachmentFileName || null
    ]
    
    console.log('Bind values count:', bindValues.length)
    console.log('Bind values:', JSON.stringify(bindValues, null, 2))
    
    await stmt.bind(...bindValues).run()
    
    console.log('Report saved to D1:', finalReportId) // UPDATED
    return c.json({ 
      success: true, 
      message: '시공 확인서가 저장되었습니다!',
      reportId: finalReportId
    })
    
  } catch (error) {
    console.error('Report save error:', error) // UPDATED - FIX
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack') // UPDATED - FIX
    console.error('Error details:', JSON.stringify(error, null, 2)) // UPDATED - FIX
    return c.json({ 
      success: false, 
      message: '저장 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined // UPDATED - FIX
    }, 500)
  }
})

// API: 시공 확인서 목록 조회 (D1) // UPDATED
app.get('/api/reports/list', async (c) => {
  try {
    const { env } = c
    
    // D1에서 조회 // UPDATED
    const stmt = env.DB.prepare(`
      SELECT 
        id, report_id, customer_info, packages, package_positions,
        install_date, install_time, install_address, notes,
        installer_name, image_key, image_filename,
        created_at, updated_at, status
      FROM reports
      ORDER BY created_at DESC
      LIMIT 100
    `);
    
    const { results } = await stmt.all(); // UPDATED
    
    // JSON 파싱 // UPDATED
    const reports = results.map((row: any) => ({ // UPDATED
      reportId: row.report_id, // UPDATED
      id: row.report_id, // UPDATED
      customerInfo: row.customer_info ? JSON.parse(row.customer_info) : null, // UPDATED
      packages: row.packages ? JSON.parse(row.packages) : [], // UPDATED
      packagePositions: row.package_positions ? JSON.parse(row.package_positions) : {}, // UPDATED
      installDate: row.install_date, // UPDATED
      installTime: row.install_time, // UPDATED
      installAddress: row.install_address, // UPDATED
      notes: row.notes, // UPDATED
      installerName: row.installer_name, // UPDATED
      imageKey: row.image_key, // UPDATED
      imageFilename: row.image_filename, // UPDATED
      createdAt: row.created_at, // UPDATED
      updatedAt: row.updated_at, // UPDATED
      status: row.status || 'draft' // UPDATED - status 필드 추가
    })) // UPDATED
    
    return c.json({ 
      success: true, 
      reports 
    })
    
  } catch (error) {
    console.error('Report list error:', error)
    return c.json({ 
      success: false, 
      reports: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: 시공 확인서 불러오기 (D1) // UPDATED
app.get('/api/reports/:id', async (c) => {
  try {
    const { env } = c
    const reportId = c.req.param('id')
    
    // D1에서 조회 // UPDATED
    const { results } = await env.DB.prepare(` // UPDATED
      SELECT  // UPDATED
        id, report_id, customer_info, packages, package_positions, // UPDATED
        install_date, install_time, install_address, notes, // UPDATED
        installer_name, image_key, image_filename, // UPDATED
        created_at, updated_at, status // UPDATED
      FROM reports // UPDATED
      WHERE report_id = ? // UPDATED
    `).bind(reportId).all() // UPDATED
    
    if (results.length === 0) { // UPDATED
      return c.json({  // UPDATED
        success: false,  // UPDATED
        message: '시공 확인서를 찾을 수 없습니다.'  // UPDATED
      }, 404) // UPDATED
    } // UPDATED
    
    const row = results[0] as any // UPDATED
    const report = { // UPDATED
      reportId: row.report_id, // UPDATED
      id: row.report_id, // UPDATED
      customerInfo: row.customer_info ? JSON.parse(row.customer_info) : null, // UPDATED
      packages: row.packages ? JSON.parse(row.packages) : [], // UPDATED
      packagePositions: row.package_positions ? JSON.parse(row.package_positions) : {}, // UPDATED
      installDate: row.install_date, // UPDATED
      installTime: row.install_time, // UPDATED
      installAddress: row.install_address, // UPDATED
      notes: row.notes, // UPDATED
      installerName: row.installer_name, // UPDATED
      imageKey: row.image_key, // UPDATED
      imageFilename: row.image_filename, // UPDATED
      createdAt: row.created_at, // UPDATED
      updatedAt: row.updated_at, // UPDATED
      status: row.status || 'draft' // UPDATED - status 필드 추가
    } // UPDATED
    
    return c.json({ 
      success: true, 
      report 
    })
    
  } catch (error) {
    console.error('Report load error:', error)
    return c.json({ 
      success: false, 
      message: '불러오기 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: 시공 완료 상태 변경
app.patch('/api/reports/:id/complete', async (c) => {
  try {
    const { env } = c
    const reportId = c.req.param('id')
    
    if (!env.DB) {
      return c.json({
        success: false,
        message: 'D1 데이터베이스가 연결되지 않았습니다.',
        needsMigration: false
      }, 500)
    }
    
    // D1에서 상태 업데이트 (status 컬럼 없을 경우 대비)
    try {
      await env.DB.prepare(`
        UPDATE reports 
        SET status = 'completed', updated_at = datetime('now')
        WHERE report_id = ?
      `).bind(reportId).run()
      
      console.log('Report marked as completed:', reportId)
      
      return c.json({
        success: true,
        message: '시공이 완료되었습니다!'
      })
    } catch (dbError) {
      // status 컬럼이 없는 경우
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
      if (errorMessage.includes('no such column: status') || errorMessage.includes('status')) {
        console.warn('status column not found, migration needed')
        return c.json({
          success: false,
          message: 'D1 마이그레이션이 필요합니다.',
          needsMigration: true,
          migrationGuide: 'Cloudflare Dashboard → D1 databases → pv5-reports-db → Console 탭에서 다음 SQL을 실행하세요: ALTER TABLE reports ADD COLUMN status TEXT DEFAULT \'draft\' CHECK(status IN (\'draft\', \'completed\'));'
        }, 400)
      }
      throw dbError // 다른 오류는 외부 catch로
    }
    
  } catch (error) {
    console.error('Complete report error:', error)
    return c.json({
      success: false,
      message: '시공 완료 처리 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error',
      needsMigration: false
    }, 500)
  }
})

// API: D1 마이그레이션 실행 (status 컬럼 추가)
app.post('/api/migrate-status-column', async (c) => {
  try {
    const { env } = c
    
    if (!env.DB) {
      return c.json({
        success: false,
        message: 'D1 데이터베이스가 연결되지 않았습니다.'
      }, 500)
    }
    
    try {
      // status 컬럼 추가 시도
      await env.DB.prepare(`
        ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed'))
      `).run()
      
      console.log('✅ D1 Migration completed: status column added')
      
      return c.json({
        success: true,
        message: '✅ 마이그레이션이 완료되었습니다! status 컬럼이 추가되었습니다.'
      })
    } catch (migrationError) {
      const errorMessage = migrationError instanceof Error ? migrationError.message : String(migrationError)
      
      // 이미 컬럼이 존재하는 경우
      if (errorMessage.includes('duplicate column name') || errorMessage.includes('already exists')) {
        return c.json({
          success: true,
          message: '✅ status 컬럼이 이미 존재합니다. 마이그레이션이 필요하지 않습니다.',
          alreadyExists: true
        })
      }
      
      // 다른 오류
      console.error('Migration error:', errorMessage)
      return c.json({
        success: false,
        message: '❌ 마이그레이션 실패: ' + errorMessage,
        error: errorMessage
      }, 500)
    }
    
  } catch (error) {
    console.error('Migration endpoint error:', error)
    return c.json({
      success: false,
      message: '마이그레이션 처리 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: 시공 완료 목록 조회 (매출 관리용)
app.get('/api/reports/completed/list', async (c) => {
  try {
    const { env } = c
    
    if (!env.DB) {
      return c.json({
        success: false,
        message: 'D1 데이터베이스가 연결되지 않았습니다.'
      }, 500)
    }
    
    // D1에서 시공 완료된 문서만 조회
    // status 컬럼이 없을 경우를 대비한 쿼리
    let results: any[]
    try {
      const stmt = env.DB.prepare(`
        SELECT 
          id, report_id, customer_info, packages, package_positions,
          install_date, install_time, install_address, notes,
          installer_name, image_key, image_filename,
          created_at, updated_at, status
        FROM reports
        WHERE status = 'completed'
        ORDER BY install_date DESC, created_at DESC
        LIMIT 1000
      `)
      
      const queryResult = await stmt.all()
      results = queryResult.results
    } catch (columnError) {
      // status 컬럼이 없는 경우 빈 배열 반환
      console.warn('status column not found, returning empty array:', columnError)
      return c.json({
        success: true,
        reports: [],
        message: 'D1 마이그레이션이 필요합니다. Cloudflare Dashboard에서 D1 database를 선택하고, Console 탭에서 다음 SQL을 실행하세요: ALTER TABLE reports ADD COLUMN status TEXT DEFAULT \'draft\' CHECK(status IN (\'draft\', \'completed\'));'
      })
    }
    
    // JSON 파싱
    const reports = results.map((row: any) => ({
      reportId: row.report_id,
      id: row.report_id,
      customerInfo: row.customer_info ? JSON.parse(row.customer_info) : null,
      packages: row.packages ? JSON.parse(row.packages) : [],
      packagePositions: row.package_positions ? JSON.parse(row.package_positions) : {},
      installDate: row.install_date,
      installTime: row.install_time,
      installAddress: row.install_address,
      notes: row.notes,
      installerName: row.installer_name,
      imageKey: row.image_key,
      imageFilename: row.image_filename,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status
    }))
    
    return c.json({
      success: true,
      reports
    })
    
  } catch (error) {
    console.error('Completed reports list error:', error)
    return c.json({
      success: false,
      reports: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: 시공 확인서 삭제 (D1) // UPDATED
app.delete('/api/reports/:id', async (c) => {
  try {
    const { env } = c
    const reportId = c.req.param('id')
    
    if (!env.DB) {
      return c.json({ 
        success: false, 
        message: 'D1 데이터베이스가 연결되지 않았습니다.' 
      }, 500)
    }
    
    // D1에서 삭제 // UPDATED
    await env.DB.prepare(`
      DELETE FROM reports WHERE report_id = ?
    `).bind(reportId).run()
    
    // R2에서 이미지 삭제 (있다면) // UPDATED
    if (env.R2) {
      const { results } = await env.DB.prepare(`
        SELECT image_key FROM reports WHERE report_id = ?
      `).bind(reportId).all()
      
      if (results.length > 0 && results[0].image_key) {
        try {
          await env.R2.delete(results[0].image_key)
          console.log('Image deleted from R2:', results[0].image_key)
        } catch (r2Error) {
          console.error('R2 delete error (continuing):', r2Error)
        }
      }
    }
    
    return c.json({ 
      success: true, 
      message: '시공 확인서가 삭제되었습니다.' 
    })
    
  } catch (error) {
    console.error('Report delete error:', error)
    return c.json({ 
      success: false, 
      message: '삭제 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: 매출 통계 조회 (Step 6용) // NEW
app.get('/api/reports/stats', async (c) => {
  try {
    const { env } = c
    const { startDate, endDate } = c.req.query()
    
    if (!env.DB) {
      return c.json({
        success: false,
        message: 'D1 데이터베이스가 연결되지 않았습니다.'
      }, 500)
    }
    
    // 기본 쿼리: 시공 완료된 문서만
    let query = `
      SELECT 
        COUNT(*) as totalCount,
        install_date,
        packages
      FROM reports
      WHERE status = 'completed'
    `
    
    const bindings: any[] = []
    
    // 날짜 필터링
    if (startDate && endDate) {
      query += ` AND install_date BETWEEN ? AND ?`
      bindings.push(startDate, endDate)
    } else if (startDate) {
      query += ` AND install_date >= ?`
      bindings.push(startDate)
    } else if (endDate) {
      query += ` AND install_date <= ?`
      bindings.push(endDate)
    }
    
    query += ` ORDER BY install_date DESC`
    
    const stmt = env.DB.prepare(query)
    const { results } = bindings.length > 0 
      ? await stmt.bind(...bindings).all()
      : await stmt.all()
    
    return c.json({
      success: true,
      stats: {
        totalCount: results.length,
        reports: results
      }
    })
    
  } catch (error) {
    console.error('Stats error:', error)
    return c.json({
      success: false,
      message: '통계 조회 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
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
        <title>PV5 시공(예약) 확인서 시스템</title>
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
          
          /* 인쇄 전용 스타일 */
          @media print {
            /* body의 모든 자식 요소 중 모달 제외하고 숨김 */
            body > *:not(#previewModal) {
              display: none !important;
            }
            
            body {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            
            /* 모달 배경 투명 */
            .modal-overlay {
              background: white !important;
              position: static !important;
              padding: 0 !important;
              display: block !important;
            }
            
            /* 모달 내용 전체 화면 */
            .modal-content {
              max-width: 100% !important;
              max-height: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* 헤더와 푸터 숨김 */
            .modal-header,
            .modal-footer {
              display: none !important;
            }
            
            /* 모달만 표시 */
            #previewModal {
              display: block !important;
              position: static !important;
              background: white !important;
            }
            
            /* 테두리 제거 */
            #previewModal .border-2 {
              border: none !important;
            }
          }
        </style>
        <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 shadow-lg">
                <div class="container mx-auto px-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <img src="/static/kvan-logo.png" alt="K-VAN" class="h-12 w-auto bg-white px-3 py-1 rounded-lg">
                            <div>
                                <h1 class="text-3xl font-bold flex items-center">
                                    <i class="fas fa-clipboard-check mr-3"></i>
                                    PV5 시공(예약) 확인서 시스템
                                </h1>
                                <p class="text-blue-100 mt-2">거래명세서 자동 인식 → 제품 선택 → 설치 일정 확정 → PDF/메일 발송</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="container mx-auto px-4 py-8">
                <!-- Step Indicator -->
                <div class="step-indicator bg-white rounded-lg shadow-md mb-8">
                    <div class="step active" id="step1" onclick="goToStep(1)" style="cursor: pointer;">
                        <i class="fas fa-upload text-2xl mb-2"></i>
                        <div>1. 거래명세서 업로드</div>
                    </div>
                    <div class="step" id="step2" onclick="goToStep(2)" style="cursor: pointer;">
                        <i class="fas fa-box text-2xl mb-2"></i>
                        <div>2. 제품 선택</div>
                    </div>
                    <div class="step" id="step3" onclick="goToStep(3)" style="cursor: pointer;">
                        <i class="fas fa-calendar-alt text-2xl mb-2"></i>
                        <div>3. 설치 정보 입력</div>
                    </div>
                    <div class="step" id="step4" onclick="goToStep(4)" style="cursor: pointer;">
                        <i class="fas fa-check-circle text-2xl mb-2"></i>
                        <div>4. 확인 및 발송</div>
                    </div>
                    <div class="step" id="step5" onclick="goToStep(5)" style="cursor: pointer;">
                        <i class="fas fa-folder-open text-2xl mb-2"></i>
                        <div>5. 저장 문서 관리</div>
                    </div>
                    <div class="step" id="step6" onclick="goToStep(6)" style="cursor: pointer;">
                        <i class="fas fa-chart-line text-2xl mb-2"></i>
                        <div>6. 매출 관리</div>
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
                            <div class="space-y-2">
                                <div class="flex gap-2">
                                    <button type="button" id="timePeriodAM" onclick="selectTimePeriod('AM')"
                                            class="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                                        오전
                                    </button>
                                    <button type="button" id="timePeriodPM" onclick="selectTimePeriod('PM')"
                                            class="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                                        오후
                                    </button>
                                </div>
                                <div class="grid grid-cols-5 gap-1">
                                    <button type="button" onclick="selectTimeHour('9')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">9시</button>
                                    <button type="button" onclick="selectTimeHour('10')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">10시</button>
                                    <button type="button" onclick="selectTimeHour('11')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">11시</button>
                                    <button type="button" onclick="selectTimeHour('12')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">12시</button>
                                    <button type="button" onclick="selectTimeHour('1')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">1시</button>
                                    <button type="button" onclick="selectTimeHour('2')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">2시</button>
                                    <button type="button" onclick="selectTimeHour('3')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">3시</button>
                                    <button type="button" onclick="selectTimeHour('4')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">4시</button>
                                    <button type="button" onclick="selectTimeHour('5')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">5시</button>
                                    <button type="button" onclick="selectTimeHour('6')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">6시</button>
                                </div>
                                <div class="grid grid-cols-6 gap-1">
                                    <button type="button" onclick="selectTimeMinute('00')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">00분</button>
                                    <button type="button" onclick="selectTimeMinute('10')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">10분</button>
                                    <button type="button" onclick="selectTimeMinute('20')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">20분</button>
                                    <button type="button" onclick="selectTimeMinute('30')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">30분</button>
                                    <button type="button" onclick="selectTimeMinute('40')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">40분</button>
                                    <button type="button" onclick="selectTimeMinute('50')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">50분</button>
                                </div>
                                <button type="button" onclick="toggleCustomTimeInput()" class="w-full mt-2 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">
                                    <i class="fas fa-keyboard mr-2"></i>직접 입력
                                </button>
                                <div id="customTimeInput" class="hidden mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div class="flex items-center gap-2 mb-2">
                                        <input type="number" id="customHour" min="1" max="12" placeholder="시" class="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center">
                                        <span class="text-sm font-bold">시</span>
                                        <input type="number" id="customMinute" min="0" max="59" placeholder="분" class="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center">
                                        <span class="text-sm font-bold">분</span>
                                        <button type="button" onclick="applyCustomTime()" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                                            확인
                                        </button>
                                    </div>
                                    <p class="text-xs text-gray-600">※ 오전/오후를 먼저 선택한 후 시간을 입력하세요</p>
                                </div>
                                <input type="text" id="installTime" readonly
                                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-center font-semibold"
                                       placeholder="시간을 선택하세요">
                            </div>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-map-marker-alt mr-2"></i>설치 주소
                            </label>
                            <input type="text" id="installAddress" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                                   placeholder="설치 장소 주소를 입력하세요">
                            <button onclick="copyCustomerAddress()" type="button"
                                    class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-base">
                                <i class="fas fa-copy mr-2"></i>고객 주소 복사
                            </button>
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
                <div id="confirm-section" class="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 hidden">
                    <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
                        <i class="fas fa-check-double text-blue-600 mr-2"></i>
                        4단계: 최종 확인 및 발송
                    </h2>
                    <div id="finalPreview" class="mb-6"></div>
                    <div class="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 sm:gap-0">
                        <button onclick="prevStep(3)" 
                                class="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
                            <i class="fas fa-arrow-left mr-2"></i>이전
                        </button>
                        <button onclick="saveReport()" 
                                class="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 font-semibold">
                            <i class="fas fa-save mr-2"></i>저장하기
                        </button>
                        <button onclick="sendEmail()" 
                                class="bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-green-700 font-semibold">
                            <i class="fas fa-envelope mr-2"></i>이메일 발송
                        </button>
                        <button onclick="nextStep(5)" 
                                class="bg-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-purple-700 font-semibold">
                            저장 문서 관리 <i class="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 5: 저장 문서 관리 -->
                <div id="manage-section" class="bg-white rounded-lg shadow-lg p-8 mb-8 hidden">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-folder-open text-purple-600 mr-2"></i>
                        5단계: 저장 문서 관리
                    </h2>
                    
                    <!-- 검색 및 필터 -->
                    <div class="mb-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">
                                    <i class="fas fa-calendar mr-2"></i>시작 날짜
                                </label>
                                <input type="date" id="searchStartDate" 
                                       onchange="searchReports()"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">
                                    <i class="fas fa-calendar mr-2"></i>종료 날짜
                                </label>
                                <input type="date" id="searchEndDate" 
                                       onchange="searchReports()"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">
                                    <i class="fas fa-search mr-2"></i>고객명 검색
                                </label>
                                <input type="text" id="searchCustomerName" 
                                       placeholder="고객명 입력..."
                                       oninput="searchReports()"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                        </div>
                        <div class="mt-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button onclick="searchReports()" 
                                        class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold">
                                    <i class="fas fa-search mr-2"></i>검색
                                </button>
                                <button onclick="resetSearch()" 
                                        class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-semibold">
                                    <i class="fas fa-redo mr-2"></i>초기화
                                </button>
                            </div>
                            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button onclick="exportToExcel()" 
                                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold">
                                    <i class="fas fa-file-excel mr-2"></i>Excel 내보내기
                                </button>
                                <button onclick="document.getElementById('excelFileInput').click()" 
                                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold">
                                    <i class="fas fa-upload mr-2"></i>데이터 가져오기
                                </button>
                                <button onclick="confirmDataReset()" 
                                        class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold">
                                    <i class="fas fa-trash mr-2"></i>데이터 초기화
                                </button>
                            </div>
                        </div>
                        
                        <!-- 숨겨진 Excel 파일 입력 -->
                        <input type="file" id="excelFileInput" accept=".xlsx,.xls" style="display:none;" onchange="importFromExcel(event)" />
                    </div>
                    
                    <!-- 문서 목록 -->
                    <div id="reportsList" class="space-y-4">
                        <div class="text-center py-12 text-gray-500">
                            <i class="fas fa-folder-open text-6xl mb-4"></i>
                            <p>저장된 문서가 없습니다.</p>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-start">
                        <button onclick="prevStep(4)" 
                                class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <i class="fas fa-arrow-left mr-2"></i>이전
                        </button>
                    </div>
                </div>

                <!-- Step 6: 매출 관리 -->
                <div id="revenue-section" class="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-8 hidden">
                    <h2 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
                        <i class="fas fa-chart-line text-purple-600 mr-2"></i>
                        6단계: 매출 관리
                    </h2>
                    
                    <!-- 마이그레이션 안내 (처음 진입 시 표시) -->
                    <div id="migrationAlert" class="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 mb-4 sm:mb-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
                            </div>
                            <div class="ml-3 flex-1">
                                <h3 class="text-sm font-medium text-yellow-800">
                                    ⚠️ D1 마이그레이션이 필요할 수 있습니다
                                </h3>
                                <div class="mt-2 text-sm text-yellow-700">
                                    <p>매출 관리 기능을 처음 사용하시는 경우, D1 데이터베이스 마이그레이션이 필요합니다.</p>
                                    
                                    <!-- 자동 마이그레이션 버튼 -->
                                    <div class="mt-3">
                                        <button 
                                            onclick="runMigration()" 
                                            class="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded inline-flex items-center w-full sm:w-auto justify-center text-base"
                                        >
                                            <i class="fas fa-database mr-2"></i>
                                            자동 마이그레이션 실행
                                        </button>
                                        <p class="mt-2 text-xs">
                                            <i class="fas fa-info-circle mr-1"></i>
                                            버튼을 클릭하면 D1 데이터베이스에 status 컬럼이 자동으로 추가됩니다.
                                        </p>
                                    </div>
                                    
                                    <!-- 수동 마이그레이션 안내 (접기/펼치기) -->
                                    <details class="mt-3">
                                        <summary class="cursor-pointer font-bold hover:text-yellow-900">
                                            <i class="fas fa-chevron-right mr-1"></i>
                                            수동 마이그레이션 방법 (Cloudflare Dashboard)
                                        </summary>
                                        <div class="mt-2">
                                            <ol class="list-decimal ml-5 mt-1">
                                                <li><a href="https://dash.cloudflare.com" target="_blank" class="underline hover:text-yellow-900">Cloudflare Dashboard</a> 접속</li>
                                                <li>Workers & Pages → D1 databases → pv5-reports-db 선택</li>
                                                <li>Console 탭에서 다음 SQL 실행:
                                                    <code class="block bg-yellow-100 p-2 mt-1 rounded text-xs">
                                                        ALTER TABLE reports ADD COLUMN status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed'));
                                                    </code>
                                                </li>
                                            </ol>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 검색 및 필터 (모바일 최적화) -->
                    <div class="mb-6">
                        <div class="space-y-3 sm:space-y-4 mb-4">
                            <!-- 기간 선택 -->
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">
                                    <i class="fas fa-filter mr-2"></i>검색 기간
                                </label>
                                <select id="revenuePeriodType" onchange="updateRevenueFilters()"
                                        class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    <option value="custom">직접 선택</option>
                                    <option value="week">이번 주</option>
                                    <option value="month">이번 달</option>
                                    <option value="quarter">이번 분기</option>
                                </select>
                            </div>
                            <!-- 날짜 범위 -->
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 mb-2">
                                        <i class="fas fa-calendar mr-1"></i>시작
                                    </label>
                                    <input type="date" id="revenueStartDate"
                                           class="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 mb-2">
                                        <i class="fas fa-calendar mr-1"></i>종료
                                    </label>
                                    <input type="date" id="revenueEndDate"
                                           class="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                </div>
                            </div>
                            <!-- 고객명 검색 -->
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">
                                    <i class="fas fa-search mr-2"></i>고객명 검색
                                </label>
                                <input type="text" id="revenueSearchCustomer" placeholder="고객명 입력..."
                                       class="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                        </div>
                        <!-- 버튼 그룹 (모바일 최적화) -->
                        <div class="space-y-3">
                            <div class="grid grid-cols-2 gap-3">
                                <button onclick="searchRevenue()" 
                                        class="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 font-semibold text-base">
                                    <i class="fas fa-search mr-2"></i>검색
                                </button>
                                <button onclick="resetRevenueSearch()" 
                                        class="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 font-semibold text-base">
                                    <i class="fas fa-redo mr-2"></i>초기화
                                </button>
                            </div>
                            <button onclick="exportRevenueToExcel()" 
                                    class="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold text-base">
                                <i class="fas fa-file-excel mr-2"></i>Excel 다운로드
                            </button>
                        </div>
                    </div>
                    
                    <!-- 통계 대시보드 (모바일 최적화) -->
                    <div class="grid grid-cols-1 gap-3 sm:gap-4 mb-6">
                        <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 sm:p-6 rounded-lg shadow-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-blue-100 text-sm sm:text-base mb-1">총 매출액</p>
                                    <p class="text-2xl sm:text-3xl font-bold" id="totalRevenue">₩0</p>
                                </div>
                                <i class="fas fa-won-sign text-4xl sm:text-5xl text-blue-200 opacity-50"></i>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 sm:p-6 rounded-lg shadow-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-green-100 text-sm sm:text-base mb-1">시공 건수</p>
                                    <p class="text-2xl sm:text-3xl font-bold" id="totalCount">0건</p>
                                </div>
                                <i class="fas fa-clipboard-check text-4xl sm:text-5xl text-green-200 opacity-50"></i>
                            </div>
                        </div>
                        <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 sm:p-6 rounded-lg shadow-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-purple-100 text-sm sm:text-base mb-1">평균 매출</p>
                                    <p class="text-2xl sm:text-3xl font-bold" id="averageRevenue">₩0</p>
                                </div>
                                <i class="fas fa-chart-bar text-4xl sm:text-5xl text-purple-200 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 매출 목록 (모바일: 카드 / 데스크톱: 테이블) -->
                    <!-- 데스크톱 테이블 (768px 이상) -->
                    <div class="hidden md:block overflow-x-auto">
                        <table class="w-full border-collapse">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-700">시공 날짜</th>
                                    <th class="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-700">고객명</th>
                                    <th class="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-700">제품</th>
                                    <th class="border border-gray-300 px-4 py-3 text-right text-sm font-bold text-gray-700">소비자 가격</th>
                                    <th class="border border-gray-300 px-4 py-3 text-right text-sm font-bold text-gray-700">매출</th>
                                    <th class="border border-gray-300 px-4 py-3 text-center text-sm font-bold text-gray-700">마진율</th>
                                    <th class="border border-gray-300 px-4 py-3 text-left text-sm font-bold text-gray-700">시공자</th>
                                </tr>
                            </thead>
                            <tbody id="revenueTableBody">
                                <tr>
                                    <td colspan="7" class="border border-gray-300 px-4 py-12 text-center text-gray-500">
                                        <i class="fas fa-chart-line text-6xl mb-4"></i>
                                        <p>시공 완료된 문서가 없습니다.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- 모바일 카드 (768px 미만) -->
                    <div id="revenueCardList" class="md:hidden space-y-4">
                        <div class="text-center py-12 text-gray-500">
                            <i class="fas fa-chart-line text-6xl mb-4 block"></i>
                            <p>시공 완료된 문서가 없습니다.</p>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-start">
                        <button onclick="prevStep(5)" 
                                class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-base font-semibold">
                            <i class="fas fa-arrow-left mr-2"></i>이전
                        </button>
                    </div>
                </div>
            </main>

            <!-- Footer -->
            <footer class="bg-gray-800 text-white py-6 mt-12">
                <div class="container mx-auto px-4">
                    <div class="flex items-center justify-center gap-4">
                        <img src="/static/kvan-logo.png" alt="K-VAN" class="h-8 w-auto bg-white px-2 py-1 rounded">
                        <p>&copy; 2026 K-VAN PV5 시공관리 시스템. All rights reserved.</p>
                    </div>
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
