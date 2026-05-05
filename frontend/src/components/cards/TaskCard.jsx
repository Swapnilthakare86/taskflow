// Purpose: Implements reusable card-style UI blocks for project/task/team data.
import { Calendar, Clock3 } from 'lucide-react';
import PriBadge from '../common/PriBadge';
import Avatar   from '../common/Avatar';
import { COL_COLORS } from '../../utils/constants';
import './cards.css';

export default function TaskCard({
  task,
  colStatus,
  currentUserId,
  draggable = true,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onClick,
}) {
  // Get column color for tag styling
  const colColor  = COL_COLORS[colStatus] || '#64748B';
  
  // Color map for priority levels
  const priColors = { Low:'#94A3B8', Medium:'#F59E0B', High:'#F97316', Critical:'#EF4444' };
  const borderColor = priColors[task.priority] || '#94A3B8';
  
  // Check if task is assigned to current user
  const isMyTask  = task.assignee_id === currentUserId;
  
  // Build assignee object from task data
  const assignee  = task.assignee_id
    ? { id: task.assignee_id, name: task.assignee_name, initials: task.assignee_initials, avatar_color: task.assignee_color }
    : null;
  
  function formatDateShort(value) {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toISOString().slice(0, 10);
  }

  return (
    <div
      className={`tf-task-card${isDragging ? ' tf-task-card--dragging' : ''}`}
      style={{
        borderLeftColor: borderColor,
        boxShadow: isMyTask ? `0 0 0 2px ${assignee?.avatar_color || '#3B82F6'}30` : undefined,
        cursor: draggable ? 'grab' : 'default',
      }}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
    >
      {/* Tags + You badge */}
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div className="d-flex gap-1 flex-wrap">
          {(task.tags || []).slice(0, 2).map(tg => (
            <span
              key={tg}
              className="tf-tag"
              style={{ background: `${colColor}12`, color: colColor }}
            >{tg}</span>
          ))}
        </div>
        {isMyTask && (
          <span
            className="tf-task-card__you-badge"
            style={{ background: `${assignee?.avatar_color}15`, color: assignee?.avatar_color }}
          >You</span>
        )}
      </div>

      {/* ID */}
      <div className="tf-task-card__id">{task.id}</div>

      {/* Title */}
      <div className="tf-task-card__title">{task.title}</div>

      {/* Priority */}
      <PriBadge priority={task.priority} />

      {/* Footer */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <Avatar user={assignee} size={24} />
        <div className="d-flex flex-column align-items-end tf-task-card__dates">
          <span className="d-flex align-items-center gap-1 tf-task-card__date-row">
            <Clock3 size={10} />
            Assigned: {formatDateShort(task.created_at)}
          </span>
          <span className="d-flex align-items-center gap-1 tf-task-card__date-row">
            <Calendar size={10} />
            Due: {formatDateShort(task.due_date) || 'Not set'}
          </span>
        </div>
      </div>
    </div>
  );
}
