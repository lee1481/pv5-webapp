// Cloudflare Pages Function
export async function onRequestPost(context: any) {
  try {
    const { env, request } = context;
    
    // 바인딩 확인
    if (!env.DB) {
      return new Response(JSON.stringify({
        success: false,
        message: 'D1 바인딩 없음',
        env_keys: Object.keys(env)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { reportId } = body;
    
    // 간단한 테스트
    await env.DB.prepare('SELECT 1').run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'D1 연결 성공!',
      reportId
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
