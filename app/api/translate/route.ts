// 文件路径：app/api/translate/route.ts

// 🚀 核心提速 1：启用边缘计算模式 (Edge Runtime)，极其显著地降低 Vercel 上的 API 响应延迟！
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    // 提取同学在面板填写的 BYOK (自带秘钥)
    const authHeader = req.headers.get('Authorization');
    const customApiKey = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

    // 智能降级逻辑：有自定义则用自定义，没有则用服务器环境变量兜底
    const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY; 

    if (!apiKey) {
      console.error("🚨 致命错误: 既没有检测到用户填写的 Key，也没有找到服务器默认的 DEEPSEEK_API_KEY！");
      // 在 Edge runtime 中使用原生 Response 更高效
      return new Response(JSON.stringify({ error: 'Missing API Key.' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            // 🚀 核心提速 2：专为 700ms 高频切分定制的 Prompt。明确要求大模型不准“脑补”。
            content: "你是一名大学本科教育中的顶级同声传译，可能包括大学的各个学科，以及专业术语。输入通常是极短片段（可能是不完整的半句话）。请直接翻译收到的英文内容，保留大学主流专业专业术语英文原词。切勿解释，切勿自行脑补或补全未说完的话，严格遵循“收到什么，就直接翻什么”。"
          },
          { role: "user", content: text }
        ],
        stream: true, 
        // 🚀 核心提速 3：将温度降到极低，消除模型的“创造性思考”时间，专注最快速度的直接翻译
        temperature: 0.1,
        // 🚀 核心提速 4：严格限制输出 token 数量，因为输入只是 700ms 的短句，不需要长篇大论
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🚨 DeepSeek API 报错:", errorText);
      return new Response(JSON.stringify({ error: errorText }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 极其稳定的流式返回格式
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("🚨 服务器内部报错:", error);
    return new Response(JSON.stringify({ error: 'Translation failed' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
