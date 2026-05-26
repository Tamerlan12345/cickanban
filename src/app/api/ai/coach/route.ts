import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { projectId, message } = await request.json();

    if (!projectId || !message) {
      return NextResponse.json({ error: 'Проект и сообщение обязательны' }, { status: 400 });
    }

    // Fetch project tasks for context
    const tasks = await db.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const apiKey = process.env.GEMINI_API_KEY;

    try {
      if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('Missing or placeholder Gemini API key');
      }

      // Build context
      const tasksContext = tasks.map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee?.fullName || 'Не назначен',
        points: t.points,
        dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Не указан',
      }));

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Вы — опытный Scrum-коуч и AI Project Manager для команды страховой компании Centras Insurance. 
Ниже приведен список всех текущих задач проекта в формате JSON:
${JSON.stringify(tasksContext, null, 2)}

Ответьте на следующий вопрос пользователя, используя эти данные:
"${message}"

Отвечайте на русском языке. Будьте лаконичны, профессиональны и конструктивны. Дайте конкретные рекомендации по улучшению процессов, если это уместно.
`;

      const result = await model.generateContent(prompt);
      return NextResponse.json({ response: result.response.text().trim() });
    } catch (geminiError: any) {
      console.warn('Gemini Coach failed, using fallback:', geminiError);
      
      const todoCount = tasks.filter(t => t.status === 'TODO').length;
      const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
      const reviewCount = tasks.filter(t => t.status === 'REVIEW').length;
      const doneCount = tasks.filter(t => t.status === 'DONE').length;
      const backlogCount = tasks.filter(t => t.status === 'BACKLOG').length;

      return NextResponse.json({
        response: `[Аналитический отчет] Всего задач в системе: **${tasks.length}**.\n\nТекущие статусы:\n- Беклог (Backlog): ${backlogCount}\n- К выполнению (To Do): ${todoCount}\n- В работе (In Progress): ${inProgressCount}\n- На проверке (Review): ${reviewCount}\n- Выполнено (Done): ${doneCount}\n\nРекомендация: Пожалуйста, сфокусируйтесь на завершении задач в статусах 'В работе' и 'На проверке' перед взятием новых задач из Беклога.`
      });
    }
  } catch (error: any) {
    console.error('AI Coach root error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера: ' + error.message },
      { status: 500 }
    );
  }
}
