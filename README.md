# Corex Portal (ATS + HRMS + Intern Project Management)

Full-stack implementation of the SRS:
- **Backend**: Express + Prisma + SQLite
- **Frontend**: React + Vite
- **Theme**: Black UI with Orange/Green/Cyan/Yellow/Red accents

## Repository Structure

- `backend/` API server, Prisma schema, and seed data
- `frontend/` React dashboard UI

## Setup

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Backend URL: `http://localhost:4000`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

Set custom API URL in frontend using `.env`:

```bash
VITE_API_URL=http://localhost:4000/api
```

## Included Modules

### ATS
- Job posting
- Candidate applications
- Hiring pipeline stage updates
- Interview scheduling
- Offer letter generation + profile handoff to HRMS

### HRMS
- Employee/intern profiles
- Document upload metadata storage
- Attendance tracking
- Leave requests + approvals

### Intern Project Management
- Project creation
- Task assignment
- Task status and review status updates
- Submission uploads metadata
- Manager and intern dashboards

### Reports & Notifications
- Hiring, attendance, task completion summary report endpoint
- System/email notification records

### Enterprise Funnel Intelligence
- Stage-wise candidate funnel analytics with conversion and drop-off KPIs
- Kanban-ready candidate endpoint with live search filters for faster recruiter throughput

### UI/UX Enhancements
- Glassmorphism-based enterprise dashboard shell (sidebar + command center top bar)
- Gradient accent system across KPI cards, alerts, and pipeline views
- Multi-view navigation for Executive Overview, Hiring Funnel, Intern Projects, and Compliance

## API Base

All endpoints are under: `/api`

Examples:
- `GET /api/jobs`
- `POST /api/candidates`
- `PATCH /api/candidates/:id/stage`
- `POST /api/projects`
- `PATCH /api/tasks/:id/status`
- `GET /api/reports/summary`
- `GET /api/analytics/funnel`
- `GET /api/candidates/kanban?search=`
