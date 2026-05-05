// Purpose: Renders a route-level screen and page-specific behavior.
import { useAuth }        from '../context/AuthContext';
import { useProject }     from '../context/ProjectContext';
import { useTasks }       from '../hooks/useTasks';
import { useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import ProjectHeader      from '../components/cards/ProjectHeader';
import TeamMemberCard     from '../components/cards/TeamMemberCard';
import Spinner            from '../components/common/Spinner';
import EmptyState         from '../components/common/EmptyState';
import { Users }          from 'lucide-react';

export default function Team() {
  const { user, canReadAll }  = useAuth();
  const [searchParams]        = useSearchParams();
  const { activeProject }     = useProject();
  const { openInvite }        = useOutletContext();
  const { tasks, loading }    = useTasks(activeProject?.id);
  
  // Track selected team member for filtering
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  
  // Get project members
  const members               = activeProject?.members || [];
  
  // Check if user has assigned tasks
  const hasOwnAssignedTasks   = tasks.some((t) => Number(t.assignee_id) === Number(user?.id));
  
  // Team page shows only project employees; manager/client are already shown in the project header.
  const employeeMembers       = members.filter((m) => String(m.role || '').toLowerCase() === 'employee');

  // Hide self from team view for admins/clients/managers without assigned work.
  const hideSelfInTeam        = user?.role === 'client'
    || user?.role === 'admin'
    || (user?.role === 'manager' && !hasOwnAssignedTasks);

  const baseVisibleMembers    = hideSelfInTeam
    ? employeeMembers.filter((m) => Number(m.id) !== Number(user?.id))
    : employeeMembers;

  const searchQuery           = (searchParams.get('q') || '').trim().toLowerCase();
  const searchFilteredMembers = searchQuery
    ? baseVisibleMembers.filter((member) => [
        member.name,
        member.email,
        member.department,
        member.role,
      ].some((value) => String(value || '').toLowerCase().includes(searchQuery)))
    : baseVisibleMembers;
    
  // Apply member filter if one is selected
  const visibleMembers        = selectedMemberId
    ? searchFilteredMembers.filter((m) => Number(m.id) === Number(selectedMemberId))
    : searchFilteredMembers;
    
  // Get currently selected member object
  const selectedMember        = selectedMemberId
    ? baseVisibleMembers.find((m) => Number(m.id) === Number(selectedMemberId))
    : null;

  // Toggle member filter
  function handleMemberFilter(member) {
    setSelectedMemberId((prev) => (Number(prev) === Number(member.id) ? null : member.id));
  }

  if (!activeProject) return <div className="tf-subtext py-5 text-center">No project selected.</div>;

  return (
    <div className="tf-fade-up">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="tf-heading-xl">Team</h1>
          <p className="tf-subtext mt-1">{visibleMembers.length} members - {activeProject.name}</p>
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
            Showing team card for <strong>{selectedMember.name}</strong>
          </span>
          <button className="tf-btn tf-btn-ghost tf-btn-xs" onClick={() => setSelectedMemberId(null)}>
            Clear
          </button>
        </div>
      )}

      {loading ? <Spinner /> : !visibleMembers.length ? (
        <EmptyState icon={Users} title="No team members" subtitle="Add members via the project invite." />
      ) : (
        <div className="row g-3">
          {visibleMembers.map((m) => (
            <div key={m.id} className="col-lg-4 col-md-6">
              <TeamMemberCard
                member={m}
                tasks={tasks}
                totalTasks={tasks.length}
                currentUserId={user?.id}
                isManager={canReadAll}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
