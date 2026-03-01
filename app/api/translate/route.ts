// 文件路径：app/api/translate/route.ts
// 🚨 注意：这里不要加 runtime = 'edge'，避免 Next.js 本地开发环境死锁

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    // 🚀 核心改造：尝试从前端请求头里提取同学在面板填写的 BYOK (自带秘钥)
    const authHeader = req.headers.get('Authorization');
    const customApiKey = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

    // 🔑 智能降级逻辑：如果同学填了秘钥就用同学的，没填就用你自己 .env 里的兜底秘钥
    const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY; 

    if (!apiKey) {
      console.error("🚨 致命错误: 既没有检测到用户填写的 Key，也没有找到服务器默认的 DEEPSEEK_API_KEY！");
      return NextResponse.json({ error: 'Missing API Key. 请在设置面板填入您的 DeepSeek API Key。' }, { status: 401 });
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
            // 依然保留为你定制的 CS 专业翻译指令
            content: "你是一个计算机科学专业的学术同声传译员。请将输入的英文演讲内容直接翻译成流畅的中文，保留专业术语的英文原词。不要加任何解释或废话，只输出中文译文。"
          },
          { role: "user", content: text }
        ],
        stream: true // 🚀 保持流式输出开启！
      }),
    });

    // 🚨 保留报错探测器，以防万一
    if (!response.ok) {
      const errorText = await response.text();
      console.error("🚨 DeepSeek API 报错:", errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
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
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}