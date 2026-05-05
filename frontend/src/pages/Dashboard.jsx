import { useMemo } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  Flag,
  ListChecks,
  Target,
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
import { COL_COLORS, TASK_STATUSES } from '../utils/constants';

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

function formatShortDate(value) {
  const date = parseDate(value);
  if (!date) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysUntil(value) {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / 86400000);
}

function BurndownChart({ data, totalTasks = 0 }) {
  const latest = data[data.length - 1] || { estimated: 0, actual: 0 };
  const delta = latest.actual - latest.estimated;
  const status = delta <= 0 ? 'On Track' : 'Behind Schedule';
  const statusTone = delta <= 0 ? 'good' : 'risk';
  const completed = Math.max(totalTasks - latest.actual, 0);
  const insight = delta <= 0
    ? `You are ${Math.abs(delta)} task${Math.abs(delta) === 1 ? '' : 's'} ahead of or matching the planned progress.`
    : `You are ${delta} task${delta === 1 ? '' : 's'} behind the planned progress. Consider reallocating resources or adjusting scope.`;

  const metricCards = [
    { icon: ListChecks, label: 'Tasks Remaining', value: latest.actual, tone: 'purple' },
    { icon: Flag, label: 'Total Planned', value: totalTasks, tone: 'amber' },
    { icon: Target, label: 'Completed', value: completed, tone: 'blue' },
  ];

  return (
    <section className="tf-card tf-dashboard__panel tf-dashboard__burndown-card">
      <div className="tf-burndown-modern">
        <div className="tf-burndown-modern__topbar">
          <div>
            <h3>Burndown Chart</h3>
            <p>Track remaining tasks over time</p>
          </div>
        </div>

        <div className="tf-burndown-modern__summary">
          <div>
            <span className="tf-burndown-modern__eyebrow">Sprint Health <Activity size={13} /></span>
            <strong>{status}</strong>
            <small>{Math.abs(delta)} task{Math.abs(delta) === 1 ? '' : 's'} {delta <= 0 ? 'ahead or on plan' : 'above plan'}</small>
          </div>
          <span className={`tf-burndown-modern__pill tf-burndown-modern__pill--${statusTone}`}>
            <AlertTriangle size={15} /> {latest.actual} remaining
          </span>

          <div className="tf-burndown-modern__metrics">
            {metricCards.map(({ icon: Icon, label, value, tone }) => (
              <div className={`tf-burndown-modern__metric tf-burndown-modern__metric--${tone}`} key={label}>
                <span><Icon size={20} /></span>
                <div>
                  <strong>{value}</strong>
                  <small>{label}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tf-burndown-modern__legend">
          <span><i className="tf-burndown-modern__dot tf-burndown-modern__dot--planned" /> Planned</span>
          <span><i className="tf-burndown-modern__dot tf-burndown-modern__dot--actual" /> Actual Remaining</span>
        </div>

      <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={data} margin={{ top: 14, right: 12, left: -12, bottom: 14 }}>
            <defs>
              <linearGradient id="actualBurndownFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
              </linearGradient>
            </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            label={{ value: 'Project Timeline', position: 'insideBottom', offset: -9, fill: '#64748b', fontSize: 12, fontWeight: 900 }}
          />
            <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Tasks', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12, fontWeight: 900 }}
          />
          <Tooltip
            contentStyle={{ border: '1px solid #dbe3ef', borderRadius: 14, boxShadow: '0 18px 40px rgba(15,23,42,.14)' }}
            formatter={(value, name, item) => {
              const label = item?.dataKey === 'estimated' ? 'Planned' : 'Actual Remaining';
              return [`${value} task${Number(value) === 1 ? '' : 's'}`, label];
            }}
            labelFormatter={(_, items) => {
              const payload = items?.[0]?.payload;
              return payload?.date ? `${payload.label} (Day ${payload.day})` : 'Project timeline';
            }}
          />
            <Line type="monotone" dataKey="estimated" stroke="#f97316" strokeWidth={3} dot={false} name="Planned" strokeDasharray="7 7" />
            <Area type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={4} fill="url(#actualBurndownFill)" dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} name="Actual Remaining" />
          </ComposedChart>
        </ResponsiveContainer>

        <div className={`tf-burndown-modern__insight tf-burndown-modern__insight--${statusTone}`}>
          <span><Activity size={16} /></span>
          <strong>{status.toLowerCase()}</strong>
          <p>{insight}</p>
        </div>
      </div>
    </section>
  );
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
        <span>{task.assignee_name || 'Unassigned'} - Due {formatDate(task.due_date)}</span>
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

  const dist = useMemo(() => {
    const preferredOrder = ['Done', 'To Do', 'In Progress', 'In Review', 'Blocked', 'Backlog'];
    const statuses = preferredOrder.filter((status) => TASK_STATUSES.includes(status));
    return statuses.map((status) => ({
      name: status,
      value: visibleTasks.filter((t) => t.status === status).length,
      color: COL_COLORS[status],
    }));
  }, [visibleTasks]);

  const workload = useMemo(() => {
    const totalProjectTasks = tasks.length;
    return visibleEmployees.map((member) => {
      const assigned = tasks.filter((t) => Number(t.assignee_id) === Number(member.id));
      const active = assigned.filter((t) => !['Done', 'Blocked'].includes(t.status)).length;
      const done = assigned.filter((t) => t.status === 'Done').length;
      const blocked = assigned.filter((t) => t.status === 'Blocked').length;
      const pct = totalProjectTasks ? Math.round((assigned.length / totalProjectTasks) * 100) : 0;
      return { member, assigned, active, done, blocked, pct };
    }).sort((a, b) => b.assigned.length - a.assigned.length);
  }, [tasks, visibleEmployees]);

  const latestTasks = useMemo(() => {
    return visibleTasks
      .slice()
      .sort((a, b) => (parseDate(b.updated_at || b.created_at)?.getTime() || 0) - (parseDate(a.updated_at || a.created_at)?.getTime() || 0))
      .slice(0, 6);
  }, [visibleTasks]);

  const burndownData = useMemo(() => {
    if (!visibleTasks.length) return [];

    const createdDates = visibleTasks
      .map((task) => parseDate(task.created_at || task.updated_at))
      .filter(Boolean);
    const dueDates = visibleTasks
      .map((task) => parseDate(task.due_date))
      .filter(Boolean);
    const projectStart = parseDate(activeProject?.created_at);
    const projectDeadline = parseDate(activeProject?.deadline);
    const startCandidates = [...createdDates, projectStart].filter(Boolean);
    const endCandidates = [...dueDates, projectDeadline, new Date()].filter(Boolean);
    const start = startCandidates.length
      ? new Date(Math.min(...startCandidates.map((date) => date.getTime())))
      : (projectStart || new Date());
    const finalDate = endCandidates.length
      ? new Date(Math.max(...endCandidates.map((date) => date.getTime()), start.getTime()))
      : new Date(start);

    start.setHours(0, 0, 0, 0);
    finalDate.setHours(0, 0, 0, 0);

    const totalDays = Math.max(1, Math.round((finalDate - start) / 86400000) + 1);
    const totalTasks = visibleTasks.length;
    const createdByDate = new Map();
    const dueByDate = new Map();
    const completedByDate = new Map();

    visibleTasks.forEach((task) => {
      const createdDate = parseDate(task.created_at || task.updated_at) || start;
      createdDate.setHours(0, 0, 0, 0);
      const createdDay = Math.min(Math.max(1, Math.round((createdDate - start) / 86400000) + 1), totalDays);
      createdByDate.set(createdDay, (createdByDate.get(createdDay) || 0) + 1);

      const dueDate = parseDate(task.due_date) || projectDeadline || finalDate;
      dueDate.setHours(0, 0, 0, 0);
      const dueDay = Math.min(Math.max(1, Math.round((dueDate - start) / 86400000) + 1), totalDays);
      dueByDate.set(dueDay, (dueByDate.get(dueDay) || 0) + 1);

      if (task.status === 'Done') {
        const doneDate = parseDate(task.updated_at || task.created_at) || dueDate;
        doneDate.setHours(0, 0, 0, 0);
        const doneDay = Math.min(Math.max(1, Math.round((doneDate - start) / 86400000) + 1), totalDays);
        completedByDate.set(doneDay, (completedByDate.get(doneDay) || 0) + 1);
      }
    });

    const step = totalDays > 12 ? Math.ceil(totalDays / 10) : 1;
    const rows = [];
    let created = 0;
    let plannedCompleted = 0;
    let completed = 0;

    for (let day = 1; day <= totalDays; day++) {
      created += createdByDate.get(day) || 0;
      plannedCompleted += dueByDate.get(day) || 0;
      completed += completedByDate.get(day) || 0;

      const shouldAddPoint = day === 1 || day === totalDays || ((day - 1) % step === 0);
      if (!shouldAddPoint) continue;

      const estimated = Math.max(Math.round(totalTasks - ((day - 1) * totalTasks) / Math.max(totalDays - 1, 1)), 0);
      const pointDate = new Date(start);
      pointDate.setDate(start.getDate() + day - 1);
      rows.push({
        day,
        date: pointDate.toISOString(),
        label: formatShortDate(pointDate),
        estimated: dueDates.length ? Math.max(totalTasks - plannedCompleted, 0) : estimated,
        actual: Math.max(created - completed, 0),
      });
    }

    return rows;
  }, [activeProject?.created_at, activeProject?.deadline, visibleTasks]);
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
        <div className="tf-dashboard__column">
          <section className="tf-card tf-dashboard__panel">
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

          {burndownData.length ? (
            <BurndownChart data={burndownData} totalTasks={visibleTasks.length} />
          ) : (
            <section className="tf-card tf-dashboard__panel">
              <div className="tf-dashboard__empty">No task data yet.</div>
            </section>
          )}
        </div>

        <div className="tf-dashboard__column">
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

    </div>
  );
}









