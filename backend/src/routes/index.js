import { Router } from 'express';
import { prisma } from '../utils/prisma.js';

const router = Router();

router.get('/health', (_, res) => res.json({ status: 'ok' }));

router.post('/auth/login', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ token: `mock-token-${user.id}`, user });
  } catch (error) {
    next(error);
  }
});

router.get('/jobs', async (_, res, next) => {
  try {
    const jobs = await prisma.jobPosting.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

router.post('/jobs', async (req, res, next) => {
  try {
    const job = await prisma.jobPosting.create({ data: req.body });
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
});

router.get('/candidates', async (_, res, next) => {
  try {
    const candidates = await prisma.candidate.findMany({ include: { job: true } });
    res.json(candidates);
  } catch (error) {
    next(error);
  }
});

router.get('/candidates/kanban', async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const candidates = await prisma.candidate.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { skills: { contains: search } }
            ]
          }
        : undefined,
      orderBy: { createdAt: 'desc' }
    });

    const board = {
      APPLIED: [],
      SCREENING: [],
      INTERVIEW: [],
      SELECTED: [],
      REJECTED: []
    };

    candidates.forEach((candidate) => {
      board[candidate.stage].push(candidate);
    });

    res.json(board);
  } catch (error) {
    next(error);
  }
});

router.post('/candidates', async (req, res, next) => {
  try {
    const candidate = await prisma.candidate.create({ data: req.body });
    res.status(201).json(candidate);
  } catch (error) {
    next(error);
  }
});

router.patch('/candidates/:id/stage', async (req, res, next) => {
  try {
    const candidate = await prisma.candidate.update({
      where: { id: Number(req.params.id) },
      data: { stage: req.body.stage }
    });
    res.json(candidate);
  } catch (error) {
    next(error);
  }
});

router.post('/interviews/:candidateId', async (req, res, next) => {
  try {
    const updated = await prisma.candidate.update({
      where: { id: Number(req.params.candidateId) },
      data: {
        interviewDate: new Date(req.body.interviewDate),
        interviewLink: req.body.interviewLink,
        feedback: req.body.feedback,
        stage: 'INTERVIEW'
      }
    });
    await prisma.notification.create({
      data: {
        channel: 'EMAIL',
        message: `Interview scheduled for ${updated.name}`,
        sentTo: updated.email
      }
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.post('/offers/:candidateId', async (req, res, next) => {
  try {
    const candidateId = Number(req.params.candidateId);
    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        offerLetterUrl: req.body.offerLetterUrl,
        stage: 'SELECTED'
      }
    });

    const user = await prisma.user.create({
      data: {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        role: req.body.role || 'INTERN',
        candidate: { connect: { id: candidate.id } }
      }
    });

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        department: req.body.department || 'Engineering',
        designation: req.body.designation || 'Intern',
        joiningDate: new Date(),
        internshipDuration: req.body.internshipDuration || '6 months'
      }
    });

    res.json({ candidate, user, employee });
  } catch (error) {
    next(error);
  }
});

router.get('/employees', async (_, res, next) => {
  try {
    const employees = await prisma.employee.findMany({ include: { user: true, documents: true } });
    res.json(employees);
  } catch (error) {
    next(error);
  }
});

router.post('/employees/:employeeId/documents', async (req, res, next) => {
  try {
    const document = await prisma.document.create({
      data: {
        employeeId: Number(req.params.employeeId),
        type: req.body.type,
        fileUrl: req.body.fileUrl
      }
    });
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

router.post('/attendance', async (req, res, next) => {
  try {
    const attendance = await prisma.attendance.create({
      data: {
        userId: req.body.userId,
        date: new Date(req.body.date),
        checkIn: new Date(req.body.checkIn),
        checkOut: req.body.checkOut ? new Date(req.body.checkOut) : null,
        status: req.body.status
      }
    });
    res.status(201).json(attendance);
  } catch (error) {
    next(error);
  }
});

router.post('/leave-requests', async (req, res, next) => {
  try {
    const leave = await prisma.leaveRequest.create({
      data: {
        userId: req.body.userId,
        reason: req.body.reason,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      }
    });
    res.status(201).json(leave);
  } catch (error) {
    next(error);
  }
});

router.patch('/leave-requests/:id', async (req, res, next) => {
  try {
    const leave = await prisma.leaveRequest.update({
      where: { id: Number(req.params.id) },
      data: { status: req.body.status }
    });
    res.json(leave);
  } catch (error) {
    next(error);
  }
});

router.get('/projects', async (_, res, next) => {
  try {
    const projects = await prisma.project.findMany({ include: { manager: true, tasks: true } });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.post('/projects', async (req, res, next) => {
  try {
    const project = await prisma.project.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        managerId: req.body.managerId
      }
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.post('/tasks', async (req, res, next) => {
  try {
    const task = await prisma.task.create({
      data: {
        projectId: req.body.projectId,
        assigneeId: req.body.assigneeId,
        name: req.body.name,
        description: req.body.description,
        deadline: new Date(req.body.deadline)
      }
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.patch('/tasks/:id/status', async (req, res, next) => {
  try {
    const task = await prisma.task.update({
      where: { id: Number(req.params.id) },
      data: {
        status: req.body.status,
        reviewStatus: req.body.reviewStatus || undefined
      }
    });
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.post('/tasks/:id/submissions', async (req, res, next) => {
  try {
    const submission = await prisma.submission.create({
      data: {
        taskId: Number(req.params.id),
        employeeId: req.body.employeeId,
        fileUrl: req.body.fileUrl,
        notes: req.body.notes
      }
    });
    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/hr', async (_, res, next) => {
  try {
    const [totalCandidates, totalEmployees, totalInterns, pendingInterviews] = await Promise.all([
      prisma.candidate.count(),
      prisma.employee.count({ where: { user: { role: 'EMPLOYEE' } } }),
      prisma.employee.count({ where: { user: { role: 'INTERN' } } }),
      prisma.candidate.count({ where: { stage: 'INTERVIEW' } })
    ]);
    res.json({ totalCandidates, totalEmployees, totalInterns, pendingInterviews });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/manager/:managerId', async (req, res, next) => {
  try {
    const managerId = Number(req.params.managerId);
    const [activeProjects, pendingTasks, completedTasks] = await Promise.all([
      prisma.project.count({ where: { managerId } }),
      prisma.task.count({ where: { project: { managerId }, status: { not: 'COMPLETED' } } }),
      prisma.task.count({ where: { project: { managerId }, status: 'COMPLETED' } })
    ]);
    res.json({ activeProjects, pendingTasks, completedTasks });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/intern/:userId', async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const tasks = await prisma.task.findMany({ where: { assigneeId: userId }, include: { project: true } });
    res.json({ assignedTasks: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
});

router.get('/reports/summary', async (_, res, next) => {
  try {
    const [hiring, internPerformance, attendance, taskCompletion] = await Promise.all([
      prisma.candidate.groupBy({ by: ['stage'], _count: true }),
      prisma.task.groupBy({ by: ['reviewStatus'], _count: true }),
      prisma.attendance.groupBy({ by: ['status'], _count: true }),
      prisma.task.groupBy({ by: ['status'], _count: true })
    ]);

    res.json({ hiring, internPerformance, attendance, taskCompletion });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics/funnel', async (_, res, next) => {
  try {
    const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED'];
    const stageCounts = await prisma.candidate.groupBy({ by: ['stage'], _count: true });
    const stageMap = stages.reduce((acc, stage) => ({ ...acc, [stage]: 0 }), {});

    stageCounts.forEach((entry) => {
      stageMap[entry.stage] = entry._count;
    });

    const appliedBase = stageMap.APPLIED || 1;
    const funnel = stages.map((stage) => ({
      stage,
      count: stageMap[stage],
      conversionFromApplied: Number(((stageMap[stage] / appliedBase) * 100).toFixed(1))
    }));

    const timeToHireDays = 14;
    const dropOffRate = Number((((stageMap.REJECTED + stageMap.APPLIED - stageMap.SELECTED) / appliedBase) * 100).toFixed(1));

    res.json({
      funnel,
      kpis: {
        totalApplied: stageMap.APPLIED,
        totalSelected: stageMap.SELECTED,
        selectionRate: Number(((stageMap.SELECTED / appliedBase) * 100).toFixed(1)),
        dropOffRate,
        averageTimeToHireDays: timeToHireDays
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/notifications', async (_, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

export default router;
