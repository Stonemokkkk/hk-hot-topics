// app/api/generate/route.ts

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { setTool } from '@/lib/kv';
import type { GenerateRequest, GeneratedTool, Topic } from '@/lib/types';

const PROMPT_TEMPLATE = `你係一個香港創意網頁開發者。你要根據今日香港熱門話題，生成一個互動小工具。

今日香港熱話：
{trends_list}

請揀 1 個最有「互動小工具潛力」嘅話題，然後生成一個完整嘅 HTML/JS 小工具。

要求：
1. Single file HTML（所有 CSS/JS 都內聯）
2. 有粵語元素（粵語文字/口語/香港文化）
3. 有趣、有共鳴、令人想Share
4. Mobile friendly（responsive design）
5. 視覺吸引（用 CSS animation、漸變色等）
6. 有互動性（用戶可以 click、input、玩）

工具類型可以係：
- 互動小測驗 (quiz) - 關於熱話嘅問題
- Meme 生成器 - 用戶可以自訂 meme
- 小遊戲 (clicker/puzzle) - 同熱話相關嘅小遊戲
- 情緒測試 - 測試用戶對熱話嘅反應
- 統計圖表 - 有趣嘅數據視覺化
- 計算器 - 同熱話相關嘅計算工具

請直接 output 完整嘅 HTML code，唔好解釋，唔好加 markdown code block。
HTML 開頭用 <!DOCTYPE html>`;

function formatTopicsList(topics: Topic[]): string {
  return topics
    .slice(0, 10)
    .map((t, i) => `${i + 1}. ${t.keyword} (來源: ${t.source})`)
    .join('\n');
}

export async function POST(request: Request) {
  const { apiKey, model, topics } = await request.json() as GenerateRequest;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'API key required' },
      { status: 400 }
    );
  }

  if (!topics || !Array.isArray(topics) || topics.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Topics array required' },
      { status: 400 }
    );
  }

  const prompt = PROMPT_TEMPLATE.replace('{trends_list}', formatTopicsList(topics));

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'xiaomi/mimo-v2.5',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = response.status === 401
        ? 'Invalid API key'
        : response.status === 429
          ? 'API quota exceeded'
          : `API error: ${response.status}`;
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const data = await response.json();
    let html = data.choices[0].message.content;

    // Clean up HTML if wrapped in markdown code block
    html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '');

    const toolId = randomUUID();
    const tool: GeneratedTool = {
      toolId,
      date: new Date().toISOString().split('T')[0],
      model: model || 'xiaomi/mimo-v2.5',
      html,
      createdAt: new Date().toISOString(),
    };

    await setTool(tool);

    return NextResponse.json({ success: true, data: { toolId, html } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate tool' },
      { status: 500 }
    );
  }
}
