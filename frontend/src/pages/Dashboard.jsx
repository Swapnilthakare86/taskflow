import { useMemo } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import Avatar from '../components/common/Avatar';
import StatusBadge from '../components/common/StatusBadge';
import StatusPieChart from '../components/charts/StatusPieChart';
import { COL_COLORS } from '../utils/constants';

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function daysUntil(value) {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / 86400000);
}

function ProgressBar({ value, color = '#10b981' }) {
  return (
    <div className="tf-dash-progress">
      <span style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: color }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = 'blue', hint }) {
  return (
    <div className={`tf-dash-stat tf-dash-stat--${tone}`}>
      <div className="tf-dash-stat__icon"><Icon size={18} /></div>
      <div>
        <div className="tf-dash-stat__value">{value}</div>
        <div className="tf-dash-stat__label">{label}</div>
        {hint && <div className="tf-dash-stat__hint">{hint}</div>}
      </div>
    </div>
  );
}

function TaskRow({ task, compact = false }) {
  return (
    <div className="tf-dash-task-row">
      <div className="tf-dash-task-row__main">
        <strong>{task.title}</strong>
        <span>{task.assignee_name || 'Unassigned'} · Due {formatDate(task.due_date)}</span>
      </div>
      {!compact && <StatusBadge status={task.status} />}
    </div>
  );
}

export default function Dashboard() {
  const { user, canReadAll } = useAuth();
  const { projects, activeProject } = useProject();
  const { tasks } = useTasks(activeProject?.id);

  const members = activeProject?.members || [];
  const employees = members.filter((m) => String(m.role || '').toLowerCase() === 'employee');
  const isEmployeeScoped = user?.role === 'employee' && !canReadAll;
  const visibleTasks = useMemo(() => {
    if (!isEmployeeScoped) return tasks;
    return tasks.filter((t) => Number(t.assignee_id) === Number(user?.id));
  }, [isEmployeeScoped, tasks, user?.id]);
  const visibleEmployees = isEmployeeScoped
    ? employees.filter((m) => Number(m.id) === Number(user?.id))
    : employees;

  const stats = useMemo(() => {
    const total = visibleTasks.length;
    const inProgress = visibleTasks.filter((t) => t.status === 'In Progress').length;
    const review = visibleTasks.filter((t) => t.status === 'In Review').length;
    const done = visibleTasks.filter((t) => t.status === 'Done').length;
    const blocked = visibleTasks.filter((t) => t.status === 'Blocked').length;
    const active = visibleTasks.filter((t) => !['Done', 'Blocked'].includes(t.status)).length;
    return { total, inProgress, review, done, blocked, active };
  }, [visibleTasks]);

  const risk = useMemo(() => {
    const openTasks = visibleTasks.filter((t) => t.status !== 'Done');
    const blocked = openTasks.filter((t) => t.status === 'Blocked');
    const overdue = openTasks.filter((t) => {
      const days = daysUntil(t.due_date);
      return days !== null && days < 0;
    });
    const dueSoon = openTasks
      .filter((t) => {
        const days = daysUntil(t.due_date);
        return days !== null && days >= 0 && days <= 3;
      })
      .sort((a, b) => (daysUntil(a.due_date) ?? 99) - (daysUntil(b.due_date) ?? 99));
    return { blocked, overdue, dueSoon };
  }, [visibleTasks]);

  const dist = useMemo(() => [
    { name: 'Done', value: visibleTasks.filter((t) => t.status === 'Done').length, color: COL_COLORS.Done },
    { name: 'To Do', value: visibleTasks.filter((t) => t.status === 'To Do').length, color: COL_COLORS['To Do'] },
    { name: 'In Progress', value: visibleTasks.filter((t) => t.status === 'In Progress').length, color: COL_COLORS['In Progress'] },
    { name: 'In Review', value: visibleTasks.filter((t) => t.status === 'In Review').length, color: COL_COLORS['In Review'] },
    { name: 'Blocked', value: visibleTasks.filter((t) => t.status === 'Blocked').length, color: COL_COLORS.Blocked },
  ], [visibleTasks]);

  const workload = useMemo(() => {
    return visibleEmployees.map((member) => {
      const assigned = visibleTasks.filter((t) => Number(t.assignee_id) === Number(member.id));
      const active = assigned.filter((t) => !['Done', 'Blocked'].includes(t.status)).length;
      const done = assigned.filter((t) => t.status === 'Done').length;
      const blocked = assigned.filter((t) => t.status === 'Blocked').length;
      const pct = visibleTasks.length ? Math.round((assigned.length / visibleTasks.length) * 100) : 0;
      return { member, assigned, active, done, blocked, pct };
    }).sort((a, b) => b.assigned.length - a.assigned.length);
  }, [visibleEmployees, visibleTasks]);

  const latestTasks = useMemo(() => {
    return visibleTasks
      .slice()
      .sort((a, b) => (parseDate(b.updated_at || b.created_at)?.getTime() || 0) - (parseDate(a.updated_at || a.created_at)?.getTime() || 0))
      .slice(0, 6);
  }, [visibleTasks]);

  const progress = activeProject?.progress || 0;

  if (!activeProject) {
    return <div className="tf-subtext py-5 text-center">No project selected.</div>;
  }

  return (
    <div className="tf-fade-up tf-dashboard">
      <div className="tf-dashboard__hero">
        <div>
          <h1 className="tf-heading-xl">{isEmployeeScoped ? 'My Dashboard' : 'Dashboard'}</h1>
          <p className="tf-subtext mt-1">
            {isEmployeeScoped ? `${activeProject.name} - assigned work overview` : `${activeProject.name} control overview`}
          </p>
        </div>
        <div className="tf-dashboard__hero-meta">
          <span>Project Deadline - {formatDate(activeProject.deadline)}</span>
        </div>
      </div>

      <div className="tf-dashboard__stats">
        <StatCard icon={ListChecks} label={isEmployeeScoped ? 'My Tasks' : 'Total Tasks'} value={stats.total} tone="blue" />
        <StatCard icon={TrendingUp} label="Active" value={stats.active} tone="indigo" hint={`${stats.inProgress} in progress`} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.done} tone="green" />
        <StatCard icon={AlertTriangle} label="Blocked" value={stats.blocked} tone="red" />
        <StatCard icon={Users} label="Employees" value={employees.length} tone="amber" />
      </div>

      <div className="tf-dashboard__grid">
        <section className="tf-card tf-dashboard__panel tf-dashboard__panel--wide">
          <div className="tf-dashboard__project-health">
            <div className="tf-dashboard__project-icon"><FolderKanban size={22} /></div>
            <div className="tf-dashboard__project-copy">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h2>{activeProject.name}</h2>
                <span className="tf-dashboard__project-code">{activeProject.code}</span>
                <StatusBadge status={activeProject.status || 'In Progress'} />
              </div>
              <p>{activeProject.description || 'No description added.'}</p>
            </div>
            <div className="tf-dashboard__project-progress">
              <span>{progress}%</span>
              <ProgressBar value={progress} color={activeProject.color || '#10b981'} />
            </div>
          </div>
        </section>

        <section className="tf-card tf-dashboard__panel">
          <div className="tf-dashboard__panel-head">
            <div>
              <h3>Status Distribution</h3>
              <p>Tasks by current status</p>
            </div>
          </div>
          <StatusPieChart data={dist} />
        </section>

        <section className="tf-card tf-dashboard__panel">
          <div className="tf-dashboard__panel-head">
            <div>
              <h3>{isEmployeeScoped ? 'My Deadline Risk' : 'Deadline Risk'}</h3>
              <p>{isEmployeeScoped ? 'Your blocked and near-deadline work' : 'Blocked and near-deadline work'}</p>
            </div>
            <CalendarClock size={18} />
          </div>
          <div className="tf-dashboard__risk">
            <div><strong>{risk.overdue.length}</strong><span>Overdue</span></div>
            <div><strong>{risk.dueSoon.length}</strong><span>Due Soon</span></div>
            <div><strong>{risk.blocked.length}</strong><span>Blocked</span></div>
          </div>
          <div className="tf-dashboard__list mt-3">
            {[...risk.blocked, ...risk.dueSoon].slice(0, 4).map((task) => <TaskRow key={`${task.id}-${task.status}`} task={task} />)}
            {![...risk.blocked, ...risk.dueSoon].length && <div className="tf-dashboard__empty">No immediate risks.</div>}
          </div>
        </section>

        <section className="tf-card tf-dashboard__panel tf-dashboard__panel--wide">
          <div className="tf-dashboard__panel-head">
            <div>
              <h3>{isEmployeeScoped ? 'My Workload' : 'Team Workload'}</h3>
              <p>{isEmployeeScoped ? 'Your assigned work in this project' : 'Assigned work by project employee'}</p>
            </div>
            <Users size={18} />
          </div>
          <div className="tf-dashboard__workload">
            {!workload.length && <div className="tf-dashboard__empty">{isEmployeeScoped ? 'No tasks assigned to you in this project.' : 'No employees assigned to this project.'}</div>}
            {workload.map(({ member, assigned, active, done, blocked, pct }) => (
              <div className="tf-dashboard__workload-row" key={member.id}>
                <Avatar user={member} size={34} />
                <div className="tf-dashboard__workload-main">
                  <div className="tf-dashboard__workload-title">
                    <strong>{member.name}</strong>
                    <span>{assigned.length} assigned · {active} active · {done} done · {blocked} blocked</span>
                  </div>
                  <ProgressBar value={pct} color={member.avatar_color || '#3b82f6'} />
                </div>
                <strong className="tf-dashboard__workload-pct">{pct}%</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="tf-card tf-dashboard__panel">
          <div className="tf-dashboard__panel-head">
            <div>
              <h3>{isEmployeeScoped ? 'My Blocked Tasks' : 'Blocked Tasks'}</h3>
              <p>{isEmployeeScoped ? 'Your tasks currently blocked' : 'Items that need manager attention'}</p>
            </div>
            <AlertTriangle size={18} />
          </div>
          <div className="tf-dashboard__list">
            {risk.blocked.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} compact />)}
            {!risk.blocked.length && <div className="tf-dashboard__empty">No blocked tasks.</div>}
          </div>
        </section>

        <section className="tf-card tf-dashboard__panel">
          <div className="tf-dashboard__panel-head">
            <div>
              <h3>{isEmployeeScoped ? 'My Latest Activity' : 'Latest Activity'}</h3>
              <p>{isEmployeeScoped ? 'Recently changed assigned tasks' : 'Recently changed tasks'}</p>
            </div>
            <Timer size={18} />
          </div>
          <div className="tf-dashboard__list">
            {latestTasks.map((task) => <TaskRow key={task.id} task={task} />)}
            {!latestTasks.length && <div className="tf-dashboard__empty">No task activity yet.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
