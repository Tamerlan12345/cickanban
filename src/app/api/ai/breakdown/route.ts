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
      return NextResponse.json({ error: 'Название задачи обязательно для декомпозиции' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Check if Gemini API key is missing or is placeholder
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json({
        subtasks: [
          "Изучить требования к задаче",
          "Разработать техническое решение",
          "Реализовать базовый функционал",
          "Протестировать граничные случаи",
          "Провести ревью и слияние изменений"
        ],
        isMock: true
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Вы — опытный технический лид. Разбейте (декомпозируйте) указанную задачу на список конкретных подзадач (чек-лист).
Название задачи: "${title}"
Описание задачи: "${description || 'Описание отсутствует'}"

Верните ответ строго в формате JSON со следующим полем:
- "subtasks" - массив строк (до 5-8 пунктов подзадач на русском языке, формулируйте лаконично и конкретно).

Не пишите никакого другого текста, кроме чистого JSON. Не используйте markdown разметку \`\`\`json.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    const cleanJsonString = responseText
      .replace(/^```json/i, '')
      .replace(/^```/i, '')
      .replace(/```$/, '')
      .trim();

    try {
      const data = JSON.parse(cleanJsonString);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('Failed to parse Gemini breakdown response:', responseText);
      return NextResponse.json({
        subtasks: [
          "Проанализировать задачу: " + title,
          "Реализовать требования согласно описанию",
          "Выполнить тестирование функционала"
        ]
      });
    }
  } catch (error: any) {
    console.error('Gemini breakdown error:', error);
    return NextResponse.json(
      { error: 'Ошибка взаимодействия с ИИ Gemini: ' + error.message },
      { status: 500 }
    );
  }
}
