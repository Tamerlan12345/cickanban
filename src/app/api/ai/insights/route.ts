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

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'ID проекта обязателен' }, { status: 400 });
    }

    // Fetch tasks
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

    const totalTasks = tasks.length;
    const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;
    const doneTasks = tasks.filter((t) => t.status === 'DONE').length;
    const backlogTasks = tasks.filter((t) => t.status === 'BACKLOG').length;

    const apiKey = process.env.GEMINI_API_KEY;

    // Check if Gemini API key is missing or is placeholder
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      // Return beautiful mock insights based on database tasks
      const unassignedTasksCount = tasks.filter((t) => !t.assigneeId).length;
      const criticalTasksCount = tasks.filter((t) => t.priority === 'URGENT').length;

      return NextResponse.json({
        healthSummary: `Всего задач в системе: ${totalTasks}. На этапе выполнения находится ${inProgressTasks + reviewTasks} задач. Завершенность проекта составляет ${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%. Рекомендуется ускорить разбор задач из бэклога.`,
        bottlenecks: [
          `У вас ${unassignedTasksCount} задач без исполнителя — распределите их, чтобы избежать простоя.`,
          criticalTasksCount > 0 ? `Обнаружено критических задач: ${criticalTasksCount}. Они требуют немедленного внимания.` : "Критических задач с высоким риском простоя не обнаружено.",
          backlogTasks > 3 ? "Размер бэклога превышает 3 задачи — проведите сессию бэклог-груминга." : "Размер бэклога в пределах нормы."
        ],
        recommendations: [
          "Назначьте исполнителей на зависшие задачи в статусе 'К выполнению'.",
          "Проведите ИИ-оценку сложности (Story Points) для более точного планирования спринтов.",
          "Используйте внутренний командный чат для обсуждения статусов по задачам на проверке."
        ],
        isMock: true
      });
    }

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
Вы — опытный Agile Scrum-коуч и AI Project Manager. Проанализируйте список всех текущих задач проекта в страховой компании:
${JSON.stringify(tasksContext, null, 2)}

Верните ответ строго в формате JSON со следующими полями:
1. "healthSummary" - текст (2-3 предложения) с анализом здоровья проекта, динамикой выполнения и текущими темпами.
2. "bottlenecks" - массив строк (3 пункта), перечисляющий конкретные проблемы или риски (например, перегруженные участники, задачи без исполнителей, просроченные сроки).
3. "recommendations" - массив строк (3 пункта) с конкретными действиями для Project Manager по оптимизации спринта.

Не пишите никакого другого текста, кроме чистого JSON. Не используйте markdown разметку \`\`\`json. Отвечайте строго на русском языке.
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
      console.error('Failed to parse Gemini insights:', responseText);
      return NextResponse.json({
        healthSummary: "Проект находится в активной фазе разработки.",
        bottlenecks: ["Не удалось провести автоматический анализ из-за ошибки формата."],
        recommendations: ["Обновите страницу для повторного анализа."]
      });
    }
  } catch (error: any) {
    console.error('AI Insights API error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения инсайтов от ИИ Gemini: ' + error.message },
      { status: 500 }
    );
  }
}
