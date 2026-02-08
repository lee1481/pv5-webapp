// Cloudflare Pages Function - 시공 확인서 저장
export async function onRequestPost(context: any) {
  try {
    const { env, request } = context;
    
    // 바인딩 확인
    if (!env.DB) {
      return new Response(JSON.stringify({
        success: false,
        message: 'D1 바인딩이 설정되지 않았습니다.',
        env_keys: Object.keys(env)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 요청 데이터 파싱
    const body = await request.json();
    const {
      reportId,
      customerInfo,
      packages,
      packagePositions,
      installDate,
      installTime,
      installAddress,
      notes,
      installerName,
      attachmentImage,
      attachmentFileName
    } = body;
    
    // 이미지가 있으면 R2에 저장
    let imageKey = null;
    if (attachmentImage && env.R2) {
      imageKey = `images/${Date.now()}-${reportId || 'report'}-${attachmentFileName || 'attachment.jpg'}`;
      
      // Base64를 Buffer로 변환
      const base64Data = attachmentImage.replace(/^data:image\/\w+;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      await env.R2.put(imageKey, bytes);
    }
    
    const finalReportId = reportId || `REPORT-${Date.now()}`;
    
    // D1에 저장
    await env.DB.prepare(`
      INSERT OR REPLACE INTO reports (
        report_id, customer_info, packages, package_positions,
        install_date, install_time, install_address, notes,
        installer_name, image_key, image_filename,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
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
    ).run();
    
    console.log('Report saved to D1:', finalReportId);
    
    return new Response(JSON.stringify({
      success: true,
      message: '시공 확인서가 저장되었습니다!',
      reportId: finalReportId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Report save error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '저장 중 오류가 발생했습니다.',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
