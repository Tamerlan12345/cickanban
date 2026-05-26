import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Название задачи обязательно для оценки' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    try {
      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Missing or placeholder Gemini API key');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Вы — опытный Agile Scrum-мастер и технический архитектор. Оцените сложность задачи в контексте разработки ПО.
Название задачи: "${title}"
Описание задачи: "${description || 'Описание отсутствует'}"

Верните ответ строго в формате JSON со следующими полями:
1. "points" - число из последовательности Фибоначчи для Story Points (1, 2, 3, 5, 8, 13, 21).
2. "timeHours" - примерная оценка времени в часах (целое число).
3. "justification" - краткое техническое обоснование оценки (2-3 предложения на русском языке).

Не пишите никакого другого текста, кроме чистого JSON. Не используйте markdown разметку \`\`\`json.
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      
      const cleanJsonString = responseText
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/, '')
        .trim();

      const data = JSON.parse(cleanJsonString);
      return NextResponse.json(data);
    } catch (error: any) {
      console.warn('Gemini Estimate failed, using fallback:', error);
      
      // Calculate story points based on length of title and description as a simple mock algorithm
      const length = title.length + (description || '').length;
      let points = 3;
      let hours = 8;
      
      if (length > 150) {
        points = 8;
        hours = 24;
      } else if (length > 80) {
        points = 5;
        hours = 16;
      } else if (length < 25) {
        points = 1;
        hours = 2;
      }

      return NextResponse.json({
        points,
        timeHours: hours,
        justification: `Сложность задачи составляет примерно ${points} Story Points (${hours} часов) на основе анализа объема работ. Рекомендуется обсудить детали реализации на планировании.`,
        isMock: true
      });
    }
  } catch (error: any) {
    console.error('AI Estimate API root error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
