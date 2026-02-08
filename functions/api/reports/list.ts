// Cloudflare Pages Function - 시공 확인서 목록 조회
export async function onRequestGet(context: any) {
  try {
    const { env } = context;
    
    // 바인딩 확인
    if (!env.DB) {
      return new Response(JSON.stringify({
        success: false,
        message: 'D1 바인딩이 설정되지 않았습니다.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // D1에서 목록 조회
    const { results } = await env.DB.prepare(`
      SELECT 
        id, report_id, customer_info, packages, package_positions,
        install_date, install_time, install_address, notes,
        installer_name, image_key, image_filename,
        created_at, updated_at
      FROM reports
      ORDER BY created_at DESC
      LIMIT 100
    `).all();
    
    console.log('Loaded from D1:', results.length, 'reports');
    
    return new Response(JSON.stringify({
      success: true,
      reports: results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Report list error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '목록 조회 중 오류가 발생했습니다.',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
