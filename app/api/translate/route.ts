export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // 🧠 解析从前端传过来的最新上下文（contextText）
    const { text, contextText } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    const customApiKey = authHeader ? authHeader.replace('Bearer ', '').trim() : null;
    const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY; 

    if (!apiKey) {
      console.error("🚨 致命错误: 既没有检测到用户填写的 Key，也没有找到服务器默认的 DEEPSEEK_API_KEY！");
      return new Response(JSON.stringify({ error: 'Missing API Key.' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 🧠 核心升级：带有前文语境参考的智能 Prompt
    const systemPrompt = `你是一名计算机科学专业的顶级同声传译。
输入通常是极短的语音片段（可能是不完整的半句话）。
请直接翻译收到的英文内容，保留 CS 专业术语英文原词。
切勿解释，切勿自行脑补或补全未说完的话。严格遵循“收到什么，就直接翻什么”。

【前文语境参考】（仅用于辅助理解上下文和代词，绝不要重复翻译这部分内容）：
${contextText ? contextText : "（这是第一句话，暂无前文）"}`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        stream: true, 
        temperature: 0.1,
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
