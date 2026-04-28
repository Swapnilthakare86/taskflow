import { Folder, Calendar } from 'lucide-react';
import Avatar from '../common/Avatar';
import StatusBadge from '../common/StatusBadge';
import ProgBar from '../common/ProgBar';
import './cards.css';

function roleOf(member) {
  return String(member?.role || '').toLowerCase();
}

function formatDateOnly(value) {
  if (!value) return 'Not set';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

export default function ProjectHeader({ project, user, onInvite, onMemberSelect, selectedMemberId }) {
  if (!project) return null;
  const members = project.members || [];
  const employees = members.filter((m) => roleOf(m) === 'employee');
  const manager = members.find((m) => roleOf(m) === 'manager') || members.find((m) => roleOf(m) === 'admin') || null;
  const client = members.find((m) => roleOf(m) === 'client') || null;

  return (
    <div className="tf-card tf-proj-header">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="tf-proj-header__folder-icon" style={{ background: `${project.color || '#3b82f6'}20` }}>
            <Folder size={20} color={project.color || '#3b82f6'} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h3 className="tf-heading-lg" style={{ fontSize: 34 }}>{project.name}</h3>
              <span className="tf-proj-header__code">{project.code}</span>
              <StatusBadge status={project.status || 'In Progress'} />
            </div>
            <div className="tf-proj-header__desc">{project.description}</div>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-4">
          <div>
            <div className="tf-proj-header__meta-label">TEAM</div>
            <div className="d-flex align-items-center">
              {employees.map((m, idx) => (
                <button
                  type="button"
                  key={m.id}
                  title={`${m.name} (${String(m.role || '').toUpperCase()})`}
                  className={`tf-proj-header__avatar-btn${Number(selectedMemberId) === Number(m.id) ? ' tf-proj-header__avatar-btn--active' : ''}`}
                  style={{ marginLeft: idx ? -8 : 0, zIndex: 20 - idx }}
                  onClick={() => onMemberSelect?.(m)}
                  disabled={!onMemberSelect}
                >
                  <Avatar user={m} size={32} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="tf-proj-header__meta-label">DEADLINE</div>
            <div className="tf-proj-header__deadline d-flex align-items-center gap-1"><Calendar size={12} /> {formatDateOnly(project.deadline)}</div>
          </div>

          <div>
            <div className="tf-proj-header__meta-label">CLIENT</div>
            <div className="d-flex align-items-center gap-2">
              {client ? (
                <>
                  <Avatar user={client} size={28} />
                  <strong>{client.name}</strong>
                </>
              ) : <span className="tf-proj-header__empty" aria-label="No client assigned" />}
            </div>
          </div>

          <div>
            <div className="tf-proj-header__meta-label">MANAGER</div>
            <div className="d-flex align-items-center gap-2">
              {manager ? (
                <>
                  <Avatar user={manager} size={28} />
                  <strong>{manager.name}</strong>
                </>
              ) : <span className="tf-proj-header__empty" aria-label="No manager assigned" />}
            </div>
          </div>

          <div style={{ minWidth: 160 }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="tf-proj-header__meta-label mb-0">PROGRESS</div>
              <div className="tf-proj-header__pct" style={{ color: project.color || '#3b82f6' }}>{project.progress || 0}%</div>
            </div>
            <ProgBar val={project.progress || 0} color={project.color || '#3b82f6'} />
          </div>
        </div>
      </div>
    </div>
  );
}
