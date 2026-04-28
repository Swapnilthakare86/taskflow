// Purpose: Implements reusable card-style UI blocks for project/task/team data.
import { Folder, Mail, Pencil } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import ProgBar     from '../common/ProgBar';
import Avatar      from '../common/Avatar';
import './cards.css';

export default function ProjectCard({ project, isActive, onClick, onInvite, onEdit, isManager, user }) {
  // Get task statistics - use backend aggregates if available
  const done   = project.tasks_done    || 0; // Completed tasks
  const active = project.tasks_active  ?? Math.max((project.tasks_total || 0) - done, 0); // Remaining tasks
  const total  = project.tasks_total   || 0; // Total tasks

  return (
    <div
      className="tf-card tf-proj-card"
      style={{
        // Highlight active project with color
        borderColor: isActive ? project.color : 'var(--tf-border)',
        boxShadow:   isActive ? `0 0 0 4px ${project.color}1a` : undefined,
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className="tf-proj-card__icon" style={{ background: `${project.color}14` }}>
          <Folder size={20} color={project.color} />
        </div>
        <div className="d-flex gap-2 align-items-start">
          <StatusBadge status={project.status} />
          {isActive && (
            <span
              className="tf-proj-card__active-badge"
              style={{ background: `${project.color}15`, color: project.color }}
            >Active</span>
          )}
        </div>
      </div>

      <div className="tf-proj-card__name mb-1">{project.name}</div>
      <div className="tf-proj-card__code">{project.code}</div>
      <div className="tf-proj-card__desc">{project.description}</div>

      {/* Progress */}
      <div className="mb-3">
        <div className="d-flex justify-content-between mb-2">
          <span className="tf-label">PROGRESS</span>
          <span className="fw-bold" style={{ fontSize: 14, color: project.color }}>{project.progress}%</span>
        </div>
        <ProgBar val={project.progress} color={project.color} height={8} />
      </div>

      {/* Stats */}
      <div className="d-flex gap-2 mb-3">
        {[
          { l:'Tasks',  v: total,  c:'var(--tf-gray-900)', bg:'var(--tf-gray-50)' },
          { l:'Active', v: active, c:'var(--tf-blue-600)', bg:'var(--tf-blue-50)' },
          { l:'Done',   v: done,   c:'var(--tf-green-600)',bg:'var(--tf-green-50)'},
        ].map(s => (
          <div key={s.l} className="tf-proj-card__stat" style={{ background: s.bg }}>
            <div className="tf-proj-card__stat-val" style={{ color: s.c }}>{s.v}</div>
            <div className="tf-proj-card__stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="tf-proj-card__members">
          {(project.members || []).slice(0, 4).map((m, i) => (
            <div key={m.id} className="tf-proj-card__member" style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }} title={m.name}>
              <Avatar user={m} size={26} />
            </div>
          ))}
          {(project.members || []).length > 4 && (
            <span className="tf-proj-card__member-more" style={{ marginLeft: -8 }}>
              +{(project.members || []).length - 4}
            </span>
          )}
        </div>
        {isManager && (
          <div className="tf-proj-card__actions">
            <button
              className="tf-proj-card__icon-btn"
              title="Edit project"
              aria-label="Edit project"
              // Prevent bubbling so edit action does not also trigger card navigation.
              onClick={e => { e.stopPropagation(); onEdit?.(project); }}
            >
              <Pencil size={12} />
            </button>
            <button
              className="tf-btn tf-btn-xs"
              style={{ background:'var(--tf-blue-50)', color:'var(--tf-blue-600)' }}
              // Prevent bubbling so invite action does not also trigger card navigation.
              onClick={e => { e.stopPropagation(); onInvite?.(project); }}
            >
              <Mail size={11} /> Invite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
