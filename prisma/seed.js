const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@cic.kz';
  const password = 'Tamerlan25';
  const fullName = 'Admin';
  const role = 'ADMIN';

  console.log('Seeding database...');

  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User ${email} already exists.`);
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  // Create admin user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role,
    },
  });

  console.log(`Admin user created with ID: ${user.id}`);

  // Create default Workspace and Project
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Centras Insurance Workspace',
      slug: 'centras-insurance-' + Math.random().toString(36).substring(2, 7),
    },
  });

  const project = await prisma.project.create({
    data: {
      name: 'Centras ScramBan Project',
      description: 'Основная Kanban-доска для отслеживания задач отдела страхования.',
      workspaceId: workspace.id,
    },
  });

  // Add user as PM to the project
  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: user.id,
      role: 'PM',
    },
  });

  // Create default Chat Channels
  await prisma.chatChannel.create({
    data: {
      name: 'Общий чат команды',
      type: 'PROJECT',
      projectId: project.id,
    },
  });

  await prisma.chatChannel.create({
    data: {
      name: 'Чат Scrum/Kanban доски',
      type: 'BOARD',
      projectId: project.id,
    },
  });

  // Create a default Cycle (Sprint 1)
  await prisma.cycle.create({
    data: {
      name: 'Спринт 1: Старт проекта',
      description: 'Первый запуск ScramBan процессов',
      projectId: project.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days later
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
