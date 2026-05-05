// Purpose: Renders a route-level screen and page-specific behavior.
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Search, X } from 'lucide-react';
import { useAuth }    from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useTasks }   from '../hooks/useTasks';
import ProjectHeader  from '../components/cards/ProjectHeader';
import StatusBadge    from '../components/common/StatusBadge';
import PriBadge       from '../components/common/PriBadge';
import Avatar         from '../components/common/Avatar';
import Spinner        from '../components/common/Spinner';

export default function TaskList() {
  const { user, canReadAll }    = useAuth();
  const { activeProject }       = useProject();
  const { openInvite }          = useOutletContext();
  const { tasks, loading }      = useTasks(activeProject?.id);
  
  // Filtering state
  const [filter, setFilter]     = useState('All');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Available status tabs
  const tabs = ['All','To Do','In Progress','In Review','Blocked','Done'];
  
  // Filter tasks by status
  const statusFiltered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);
  
  // Filter by team member if selected
  const memberFiltered = selectedMemberId
    ? statusFiltered.filter((t) => Number(t.assignee_id) === Number(selectedMemberId))
    : statusFiltered;
  
  // Filter by search query - search in title and description
  const searchLower = searchQuery.toLowerCase().trim();
  const filtered = searchQuery
    ? memberFiltered.filter((t) =>
        String(t.title).toLowerCase().includes(searchLower) ||
        String(t.description || '').toLowerCase().includes(searchLower)
      )
    : memberFiltered;
    
  // Get full member object for selected member
  const selectedMember = selectedMemberId
    ? (activeProject?.members || []).find((m) => Number(m.id) === Number(selectedMemberId))
    : null;

  // Toggle member filter on/off
  function handleMemberFilter(member) {
    setSelectedMemberId((prev) => (Number(prev) === Number(member.id) ? null : member.id));
  }

  if (!activeProject) return <div className="tf-subtext py-5 text-center">No project selected.</div>;

  return (
    <div className="tf-fade-up">
      <div className="tf-task-list-head d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="tf-heading-xl">{canReadAll ? 'Task List' : 'Team Tasks'}</h1>
          <p className="tf-subtext tf-task-list-count mt-1">{filtered.length} tasks · {activeProject.name}</p>
        </div>
        <div className="tf-task-list-tabs d-flex gap-1 p-1 rounded" style={{ background:'var(--tf-gray-100)' }}>
          {tabs.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`tf-btn tf-btn-xs${filter===s ? '' : ''}`}
              style={{ background:filter===s?'white':'transparent', color:filter===s?'var(--tf-gray-900)':'var(--tf-gray-500)', fontWeight:filter===s?700:400, boxShadow:filter===s?'0 1px 4px rgba(0,0,0,.08)':'none' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <ProjectHeader
        project={activeProject}
        user={user}
        onInvite={openInvite}
        onMemberSelect={handleMemberFilter}
        selectedMemberId={selectedMemberId}
      />

      {selectedMember && (
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="tf-subtext" style={{ color: 'var(--tf-gray-600)' }}>
            Showing tasks for <strong>{selectedMember.name}</strong>
          </span>
          <button className="tf-btn tf-btn-ghost tf-btn-xs" onClick={() => setSelectedMemberId(null)}>
            Clear
          </button>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="tf-card tf-task-list-card overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize:13 }}>
              <thead style={{ background:'var(--tf-gray-50)' }}>
                <tr>
                  {[
                    ['ID', 'tf-task-col-id'],
                    ['Title', 'tf-task-col-title'],
                    ['Assignee', 'tf-task-col-assignee'],
                    ['Status', 'tf-task-col-status'],
                    ['Priority', 'tf-task-col-priority'],
                    ['Due', 'tf-task-col-due'],
                  ].map(([h, className])=>(
                    <th key={className} className={className} style={{ padding:'11px 14px', fontSize:10, color:'var(--tf-gray-400)', fontWeight:700, letterSpacing:.8, border:0, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!filtered.length && (
                  <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--tf-gray-400)', padding:32 }}>No tasks found.</td></tr>
                )}
                {filtered.map(t => {
                  const aUser = { id:t.assignee_id, name:t.assignee_name, initials:t.assignee_initials, avatar_color:t.assignee_color };
                  return (
                    <tr key={t.id} style={{ cursor:'pointer' }}>
                      <td className="tf-task-col-id" style={{ padding:'13px 14px', fontFamily:'var(--tf-font-mono)', fontSize:10, color:'var(--tf-gray-400)', border:0 }}>{t.id}</td>
                      <td className="tf-task-col-title" style={{ padding:'13px 14px', border:0 }}>
                        <div style={{ fontWeight:600, color:'var(--tf-gray-900)', marginBottom:4 }}>{t.title}</div>
                        <div className="d-flex gap-1">{(t.tags||[]).slice(0,2).map(tg=><span key={tg} style={{fontSize:9,padding:'1px 6px',borderRadius:4,background:'var(--tf-gray-100)',color:'var(--tf-gray-500)',fontWeight:600}}>{tg}</span>)}</div>
                      </td>
                      <td className="tf-task-col-assignee" style={{ padding:'13px 14px', border:0 }}>
                        <div className="d-flex align-items-center gap-2"><Avatar user={aUser} size={24} /><span style={{ color:'var(--tf-gray-600)' }}>{aUser.name?.split(' ')[0]}</span></div>
                      </td>
                      <td className="tf-task-col-status" style={{ padding:'13px 14px', border:0 }}><StatusBadge status={t.status} /></td>
                      <td className="tf-task-col-priority" style={{ padding:'13px 14px', border:0 }}><PriBadge priority={t.priority} /></td>
                      <td className="tf-task-col-due" style={{ padding:'13px 14px', color:'var(--tf-gray-500)', border:0 }}>
                        <div className="d-flex align-items-center gap-1"><Calendar size={11} />{t.due_date}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}




