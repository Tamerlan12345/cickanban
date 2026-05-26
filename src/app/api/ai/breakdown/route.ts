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

    try {
      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Missing or placeholder Gemini API key');
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

      const data = JSON.parse(cleanJsonString);
      return NextResponse.json(data);
    } catch (error: any) {
      console.warn('Gemini Breakdown failed, using fallback:', error);
      
      // Return a smart list of subtasks based on keywords in the title
      const lowerTitle = title.toLowerCase();
      let subtasks = [
        "Изучить требования к задаче",
        "Спроектировать архитектуру и API",
        "Реализовать программный код",
        "Провести ручное и автотестирование",
        "Сдать задачу на код-ревью"
      ];

      if (lowerTitle.includes("баг") || lowerTitle.includes("ошибк") || lowerTitle.includes("исправ")) {
        subtasks = [
          "Воспроизвести ошибку и проанализировать логи",
          "Локализовать проблемный участок кода",
          "Внести исправления в код",
          "Убедиться в отсутствии регрессионных багов",
          "Проверить исправление и закрыть задачу"
        ];
      } else if (lowerTitle.includes("верстк") || lowerTitle.includes("дизайн") || lowerTitle.includes("ui") || lowerTitle.includes("ux")) {
        subtasks = [
          "Изучить макеты дизайна и требования к интерфейсу",
          "Создать HTML-структуру и стили компонентов",
          "Обеспечить адаптивность и кроссбраузерность",
          "Добавить интерактивные элементы и ховеры",
          "Проверить на соответствие pixel perfect"
        ];
      } else if (lowerTitle.includes("бд") || lowerTitle.includes("баз") || lowerTitle.includes("таблиц") || lowerTitle.includes("prisma")) {
        subtasks = [
          "Описать новую схему данных в prisma.schema",
          "Сгенерировать и применить миграцию БД",
          "Разработать API-ручки для интеграции",
          "Проверить корректность связи таблиц",
          "Инициализировать базу тестовыми данными"
        ];
      }

      return NextResponse.json({
        subtasks,
        isMock: true
      });
    }
  } catch (error: any) {
    console.error('AI Breakdown API root error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
