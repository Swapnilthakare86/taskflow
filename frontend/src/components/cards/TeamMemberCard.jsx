import Avatar from '../common/Avatar';
import StatusBadge from '../common/StatusBadge';
import ProgBar from '../common/ProgBar';
import './cards.css';

export default function TeamMemberCard({ member, tasks, totalTasks, currentUserId }) {
  const own = (tasks || []).filter((t) => Number(t.assignee_id) === Number(member.id));
  const assigned = own.length;
  const active = own.filter((t) => t.status === 'In Progress').length;
  const done = own.filter((t) => t.status === 'Done').length;
  const workload = totalTasks ? Math.round((assigned / totalTasks) * 100) : 0;

  return (
    <div className="tf-card tf-member-card" style={{ borderColor: Number(member.id) === Number(currentUserId) ? '#ec4899' : 'var(--tf-border)' }}>
      <div className="d-flex align-items-center gap-3 mb-3">
        <Avatar user={member} size={48} />
        <div>
          <div className="tf-member-card__name">{member.name}</div>
          <div className="tf-member-card__dept">{member.department || 'General'}</div>
          <div className="d-flex align-items-center gap-2">
            <span className="tf-member-card__active">● Active</span>
            {Number(member.id) === Number(currentUserId) && <span className="tf-member-card__you">You</span>}
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 mb-3">
        <div className="tf-member-card__mini-stat"><div className="tf-member-card__mini-val" style={{ color: '#3b82f6' }}>{assigned}</div><div className="tf-member-card__mini-lbl">Assigned</div></div>
        <div className="tf-member-card__mini-stat"><div className="tf-member-card__mini-val" style={{ color: '#f59e0b' }}>{active}</div><div className="tf-member-card__mini-lbl">Active</div></div>
        <div className="tf-member-card__mini-stat"><div className="tf-member-card__mini-val" style={{ color: '#10b981' }}>{done}</div><div className="tf-member-card__mini-lbl">Done</div></div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="tf-label">WORKLOAD</span>
        <span className="tf-member-card__wl-pct" style={{ color: '#10b981' }}>{workload}%</span>
      </div>
      <ProgBar val={workload} color="#10b981" />
    </div>
  );
}
