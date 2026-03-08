import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hrAdmin = await prisma.user.upsert({
    where: { email: 'hradmin@corex.local' },
    update: {},
    create: { name: 'HR Admin', email: 'hradmin@corex.local', role: 'HR_ADMIN' }
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@corex.local' },
    update: {},
    create: { name: 'Team Lead', email: 'manager@corex.local', role: 'MANAGER' }
  });

  const intern = await prisma.user.upsert({
    where: { email: 'intern@corex.local' },
    update: {},
    create: { name: 'Intern One', email: 'intern@corex.local', role: 'INTERN' }
  });

  const job = await prisma.jobPosting.create({
    data: {
      title: 'Frontend Intern',
      description: 'Build dashboard components',
      requiredSkills: 'React, CSS, APIs',
      internshipDuration: '6 months',
      location: 'Remote'
    }
  });

  const candidate = await prisma.candidate.create({
    data: {
      name: 'Alice Candidate',
      email: 'alice@example.com',
      phone: '1234567890',
      resumeUrl: 'https://example.com/resume.pdf',
      skills: 'React, JS',
      jobId: job.id
    }
  });

  const employee = await prisma.employee.create({
    data: {
      department: 'Engineering',
      designation: 'Intern',
      joiningDate: new Date(),
      internshipDuration: '6 months',
      userId: intern.id
    }
  });

  const project = await prisma.project.create({
    data: {
      name: 'ATS Dashboard',
      description: 'Implement ATS analytics',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 86400000),
      managerId: manager.id
    }
  });

  const task = await prisma.task.create({
    data: {
      name: 'Design Kanban Board',
      description: 'Create board for candidate pipeline',
      deadline: new Date(Date.now() + 7 * 86400000),
      projectId: project.id,
      assigneeId: intern.id
    }
  });

  await prisma.submission.create({
    data: {
      fileUrl: 'https://example.com/kanban.fig',
      notes: 'Initial draft uploaded',
      taskId: task.id,
      employeeId: employee.id
    }
  });

  await prisma.notification.create({
    data: {
      channel: 'SYSTEM',
      message: `Interview pending for ${candidate.name}`,
      sentTo: hrAdmin.email
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
