export const maxDuration = 60; // 초 단위, Pro 플랜은 300까지 가능

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const LEVEL_PROMPT = {
  light: '맞춤법과 띄어쓰기만 교정하세요. 문장 구조는 절대 바꾸지 마세요.',
  normal: '맞춤법, 띄어쓰기, 어색한 표현을 교정하세요.',
  deep: '맞춤법, 띄어쓰기, 문장 가독성, 논리 흐름까지 전면 교정하세요.',
};

const SYSTEM_PROMPT = `당신은 한국어 문서 교정 전문가입니다.
아래 규칙을 반드시 따르세요.

1. 원문의 의미와 문체를 최대한 유지합니다
2. 교정한 내용만 changes 배열에 포함합니다
3. 반드시 아래 JSON 형식으로만 응답합니다 (마크다운 코드블록 금지)

{
  "corrected": "교정된 전체 텍스트",
  "changes": [
    {
      "before": "원문 표현",
      "after": "교정 표현",
      "reason": "교정 이유",
      "type": "맞춤법 | 띄어쓰기 | 문장"
    }
  ],
  "summary": "전체 교정 요약 한 줄"
}`;

export async function POST(req) {
  try {
    const { text, level = 'normal' } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return Response.json({ error: '교정할 텍스트가 없습니다.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const levelInstruction = LEVEL_PROMPT[level] || LEVEL_PROMPT.normal;

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ai-proofreader.vercel.app',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-plus:free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `교정 강도: ${levelInstruction}\n\n교정할 텍스트:\n${text}` }
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('OpenRouter 오류:', errText);
      return Response.json(
        { error: 'OpenRouter API 호출 실패', detail: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content;

    if (!rawText) {
      return Response.json({ error: '응답이 비어있습니다.' }, { status: 500 });
    }

    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch(e) {
      return Response.json({ error: 'JSON 파싱 실패', raw: cleaned }, { status: 500 });
    }

    return Response.json({
      corrected: result.corrected ?? '',
      changes: Array.isArray(result.changes) ? result.changes : [],
      summary: result.summary ?? '',
    });

  } catch(err) {
    return Response.json({ error: '서버 오류', detail: err.message }, { status: 500 });
  }
}
