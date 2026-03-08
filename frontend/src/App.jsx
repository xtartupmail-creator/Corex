import { useEffect, useMemo, useState } from 'react';
import { fetchData } from './services/api';
import MetricCard from './components/MetricCard';
import Section from './components/Section';

const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'REJECTED'];
const VIEWS = ['Executive Overview', 'Hiring Funnel', 'Intern Projects', 'Compliance'];

function compactGroup(entries = []) {
  return entries.map((entry) => ({
    key: entry.stage || entry.status || entry.reviewStatus,
    count: entry._count
  }));
}

export default function App() {
  const [activeView, setActiveView] = useState(VIEWS[0]);
  const [hrDashboard, setHrDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [funnelKpi, setFunnelKpi] = useState(null);
  const [kanban, setKanban] = useState({ APPLIED: [], SCREENING: [], INTERVIEW: [], SELECTED: [], REJECTED: [] });
  const [reports, setReports] = useState({ hiring: [], internPerformance: [], attendance: [], taskCompletion: [] });
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetchData('/dashboard/hr'),
      fetchData('/projects'),
      fetchData('/notifications'),
      fetchData('/analytics/funnel'),
      fetchData('/candidates/kanban'),
      fetchData('/reports/summary')
    ])
      .then(([hr, projectList, alerts, funnelData, board, reportData]) => {
        setHrDashboard(hr);
        setProjects(projectList);
        setNotifications(alerts);
        setFunnel(funnelData.funnel);
        setFunnelKpi(funnelData.kpis);
        setKanban(board);
        setReports(reportData);
      })
      .catch(() => {
        setHrDashboard({ totalCandidates: 0, totalEmployees: 0, totalInterns: 0, pendingInterviews: 0 });
      });
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchData(`/candidates/kanban?search=${encodeURIComponent(search)}`)
        .then((board) => setKanban(board))
        .catch(() => {});
    }, 250);

    return () => clearTimeout(debounce);
  }, [search]);

  const highlightedTaskRisk = useMemo(() => {
    const withTasks = projects.reduce((acc, project) => acc + project.tasks.length, 0);
    return withTasks > 0 ? Math.round((projects.filter((project) => project.tasks.length === 0).length / projects.length) * 100) : 0;
  }, [projects]);

  const taskSummary = useMemo(
    () => compactGroup(reports.taskCompletion),
    [reports.taskCompletion]
  );

  const attendanceSummary = useMemo(
    () => compactGroup(reports.attendance),
    [reports.attendance]
  );

  return (
    <main className="layout">
      <aside className="sidebar glass">
        <h1>COREX</h1>
        <p>Enterprise TalentOps Suite</p>
        <nav>
          {VIEWS.map((view) => (
            <button
              key={view}
              className={`nav-btn ${activeView === view ? 'active' : ''}`}
              onClick={() => setActiveView(view)}
            >
              {view}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar glass">
          <div>
            <h2>ATS + HRMS + Intern Program Command Center</h2>
            <p>Glassmorphism interface with high-throughput funnel operations and executive insights.</p>
          </div>
          <input
            type="search"
            placeholder="Search candidates by name, email, skills..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </header>

        {(activeView === 'Executive Overview' || activeView === 'Hiring Funnel') && (
          <Section title="Enterprise KPIs">
            <div className="grid-5">
              <MetricCard label="Candidates" value={hrDashboard?.totalCandidates ?? '-'} accent="orange" />
              <MetricCard label="Employees" value={hrDashboard?.totalEmployees ?? '-'} accent="green" />
              <MetricCard label="Interns" value={hrDashboard?.totalInterns ?? '-'} accent="cyan" />
              <MetricCard label="Interviews Pending" value={hrDashboard?.pendingInterviews ?? '-'} accent="yellow" />
              <MetricCard label="Selection Rate" value={`${funnelKpi?.selectionRate ?? 0}%`} accent="red" />
            </div>
          </Section>
        )}

        {(activeView === 'Executive Overview' || activeView === 'Hiring Funnel') && (
          <Section title="Hiring Funnel Efficiency">
            <div className="funnel-wrap">
              <div className="funnel-list glass-soft">
                {funnel.map((row) => (
                  <article className="funnel-row" key={row.stage}>
                    <div>
                      <strong>{row.stage}</strong>
                      <small>{row.count} candidates</small>
                    </div>
                    <div className="funnel-bar">
                      <span style={{ width: `${Math.max(row.conversionFromApplied, 6)}%` }} />
                    </div>
                    <p>{row.conversionFromApplied}%</p>
                  </article>
                ))}
              </div>
              <div className="funnel-kpi-card card accent-cyan">
                <h3>Funnel Health</h3>
                <p>Drop-off Rate: <strong>{funnelKpi?.dropOffRate ?? 0}%</strong></p>
                <p>Avg Time to Hire: <strong>{funnelKpi?.averageTimeToHireDays ?? '-'} days</strong></p>
                <p>Selection Throughput: <strong>{funnelKpi?.totalSelected ?? 0}</strong></p>
              </div>
            </div>
          </Section>
        )}

        {(activeView === 'Executive Overview' || activeView === 'Hiring Funnel') && (
          <Section title="Candidate Pipeline Board (Optimized)">
            <div className="kanban-grid">
              {STAGES.map((stage) => (
                <div key={stage} className="kanban-col glass-soft">
                  <h3>{stage}</h3>
                  <span>{kanban[stage]?.length ?? 0}</span>
                  <div className="kanban-list">
                    {(kanban[stage] || []).map((candidate) => (
                      <article key={candidate.id} className="card">
                        <strong>{candidate.name}</strong>
                        <p>{candidate.email}</p>
                        <small>{candidate.skills}</small>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {(activeView === 'Executive Overview' || activeView === 'Intern Projects') && (
          <Section title="Project Delivery & Alerts">
            <div className="split-2">
              <div className="project-list">
                {projects.map((project) => (
                  <article className="card accent-red" key={project.id}>
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                    <small>Tasks: {project.tasks.length}</small>
                  </article>
                ))}
              </div>
              <div>
                <article className="card accent-yellow risk-card">
                  <h3>Risk Index</h3>
                  <p>{highlightedTaskRisk}% projects have no tasks assigned yet.</p>
                </article>
                <ul className="notifications">
                  {notifications.map((note) => (
                    <li key={note.id}>
                      <span>{note.channel}</span>
                      <p>{note.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        )}

        {activeView === 'Compliance' && (
          <Section title="Compliance & Operational Controls">
            <div className="split-2">
              <article className="card accent-green">
                <h3>Attendance Summary</h3>
                <ul className="simple-list">
                  {attendanceSummary.map((entry) => (
                    <li key={entry.key}>
                      <span>{entry.key}</span>
                      <strong>{entry.count}</strong>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="card accent-orange">
                <h3>Task Completion Summary</h3>
                <ul className="simple-list">
                  {taskSummary.map((entry) => (
                    <li key={entry.key}>
                      <span>{entry.key}</span>
                      <strong>{entry.count}</strong>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </Section>
        )}
      </section>
    </main>
  );
}
