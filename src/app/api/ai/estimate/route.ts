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
    
    // Check if Gemini API key is missing or is placeholder
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      // Return a beautiful mock response with instruction
      return NextResponse.json({
        points: 5,
        timeHours: 16,
        justification: "⚠️ [РЕЖИМ ЗАГЛУШКИ: GEMINI_API_KEY не задан в .env] На основе названия задачи '" + title + "', оценка сложности составляет примерно 5 Story Points (~16 часов). Для работы реального ИИ, укажите рабочий ключ Google Gemini API.",
        isMock: true
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash as the standard fast model
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
    
    // Clean up potential markdown formatting in case Gemini ignored the prompt rule
    const cleanJsonString = responseText
      .replace(/^```json/i, '')
      .replace(/^```/i, '')
      .replace(/```$/, '')
      .trim();

    try {
      const data = JSON.parse(cleanJsonString);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      // Fallback if AI output is not valid JSON
      return NextResponse.json({
        points: 3,
        timeHours: 8,
        justification: "ИИ оценил задачу, но произошла ошибка парсинга ответа: " + responseText
      });
    }
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Ошибка взаимодействия с ИИ Gemini: ' + error.message },
      { status: 500 }
    );
  }
}
