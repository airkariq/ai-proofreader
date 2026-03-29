const GEMINI_URL =
   'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';


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

    // 입력 검증
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return Response.json(
        { error: '교정할 텍스트가 없습니다.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const levelInstruction = LEVEL_PROMPT[level] || LEVEL_PROMPT.normal;

    const prompt = `${SYSTEM_PROMPT}

교정 강도: ${levelInstruction}

교정할 텍스트:
${text}`;

    // Gemini API 호출
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,   // 낮을수록 일관된 교정
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API 오류:', errText);
      return Response.json(
        { error: 'Gemini API 호출 실패', detail: errText },
        { status: geminiRes.status }
      );
    }

    const geminiData = await geminiRes.json();

    // 응답 텍스트 추출
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return Response.json(
        { error: 'Gemini 응답이 비어있습니다.' },
        { status: 500 }
      );
    }

    // JSON 전처리: 마크다운 코드블록 제거
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // JSON 파싱
    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON 파싱 실패:', cleaned);
      return Response.json(
        { error: 'JSON 파싱 실패', raw: cleaned },
        { status: 500 }
      );
    }

    // 필수 필드 보정
    return Response.json({
      corrected: result.corrected ?? '',
      changes: Array.isArray(result.changes) ? result.changes : [],
      summary: result.summary ?? '',
    });

  } catch (err) {
    console.error('서버 오류:', err);
    return Response.json(
      { error: '서버 오류가 발생했습니다.', detail: err.message },
      { status: 500 }
    );
  }
}
