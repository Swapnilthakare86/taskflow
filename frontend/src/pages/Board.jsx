// Purpose: Renders a route-level screen and page-specific behavior.
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Clock3, MessageSquare, Paperclip, Pencil, Plus, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useTasks } from '../hooks/useTasks';
import { taskService } from '../api/services';
import ProjectHeader from '../components/cards/ProjectHeader';
import TaskCard from '../components/cards/TaskCard';
import Avatar from '../components/common/Avatar';
import ModalOverlay from '../components/common/ModalOverlay';
import PriBadge from '../components/common/PriBadge';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';
import { TASK_STATUSES, TASK_PRIORITIES, COL_COLORS } from '../utils/constants';
import './Board.css';

// Format date for display in task details
function formatDate(dateStr) {
  if (!dateStr) return 'Not set';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Board() {
  const { user, canManage, canReadAll, isClient } = useAuth();
  const { activeProject } = useProject();
  const { tasks, loading, updateTaskStatus, setTasks } = useTasks(activeProject?.id);
  const { showToast, openInvite, refreshNotifications } = useOutletContext();

  // Drag and drop state for kanban board
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  
  // Task selection and editing state
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskCreating, setTaskCreating] = useState(false);
  
  // Task form data
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '',
    tags: '',
  });

  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '',
    tags: '',
  });
  const [taskErrors, setTaskErrors] = useState({});
  const [taskFormError, setTaskFormError] = useState('');
  const [newTaskErrors, setNewTaskErrors] = useState({});
  const [newTaskFormError, setNewTaskFormError] = useState('');
  
  // Import visible user can see full board, others see only their tasks
  const canViewTeamBoard = canReadAll || user?.role === 'employee' || isClient;
  const roleScopedTasks = canViewTeamBoard ? tasks : tasks.filter((t) => t.assignee_id === user?.id);
  
  // Filter by selected team member if any
  const visibleTasks = selectedMemberId
    ? roleScopedTasks.filter((t) => Number(t.assignee_id) === Number(selectedMemberId))
    : roleScopedTasks;

  useEffect(() => {
    if (!selectedTaskId) return;
    if (!visibleTasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(null);
      setIsEditingTask(false);
    }
  }, [visibleTasks, selectedTaskId]);

  const selectedTask = visibleTasks.find((t) => t.id === selectedTaskId) || null;
  const projectMembers = activeProject?.members || [];
  const assignableMembers = projectMembers.filter((m) => {
    const role = String(m.role || '').toLowerCase();
    return role === 'employee' || role === 'manager' || role === 'admin';
  });
  const assigneeOptions = assignableMembers.length ? assignableMembers : projectMembers;
  const selectedMember = selectedMemberId
    ? projectMembers.find((m) => Number(m.id) === Number(selectedMemberId))
    : null;

  function handleMemberFilter(member) {
    setSelectedMemberId((prev) => (Number(prev) === Number(member.id) ? null : member.id));
  }

  function clearMemberFilter() {
    setSelectedMemberId(null);
  }

  function updateTaskField(field, value) {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
    setTaskErrors((prev) => ({ ...prev, [field]: '' }));
    setTaskFormError('');
  }

  function updateNewTaskField(field, value) {
    setNewTaskForm((prev) => ({ ...prev, [field]: value }));
    setNewTaskErrors((prev) => ({ ...prev, [field]: '' }));
    setNewTaskFormError('');
  }

  function validateTaskFields(values) {
    const errors = {};
    if (!values.title?.trim()) errors.title = 'Task title is required.';
    if (!values.assigneeId) errors.assigneeId = 'Assignee is required.';
    return errors;
  }

  function mapTaskApiErrorToField(message) {
    const msg = String(message || '').toLowerCase();
    if (msg.includes('title')) return { title: message };
    if (msg.includes('assignee')) return { assigneeId: message };
    if (msg.includes('due') || msg.includes('date')) return { dueDate: message };
    if (msg.includes('status')) return { status: message };
    if (msg.includes('priority')) return { priority: message };
    if (msg.includes('tag')) return { tags: message };
    if (msg.includes('description')) return { description: message };
    return null;
  }

  function canDragTask(task) {
    if (!task) return false;
    if (user?.role === 'employee') return Number(task.assignee_id) === Number(user?.id);
    return true;
  }

  useEffect(() => {
    setSelectedMemberId(null);
  }, [activeProject?.id]);

  useEffect(() => {
    if (!selectedTask) return;
    setTaskForm({
      title: selectedTask.title || '',
      description: selectedTask.description || '',
      assigneeId: selectedTask.assignee_id ? String(selectedTask.assignee_id) : '',
      status: selectedTask.status || 'To Do',
      priority: selectedTask.priority || 'Medium',
      dueDate: selectedTask.due_date ? String(selectedTask.due_date).slice(0, 10) : '',
      tags: (selectedTask.tags || []).join(', '),
    });
    setTaskErrors({});
    setTaskFormError('');
  }, [selectedTask]);

  async function handleDrop(col) {
    if (!dragId) return;
    if (isClient && col !== 'Blocked') {
      showToast?.('Client can move tasks only to Blocked.', 'error');
      setDragId(null);
      setOverCol(null);
      return;
    }
    const task = visibleTasks.find((t) => t.id === dragId);
    if (!canDragTask(task)) {
      showToast?.('You can move only tasks assigned to you.', 'error');
      setDragId(null);
      setOverCol(null);
      return;
    }
    if (task && task.status !== col) {
      try {
        await taskService.updateStatus(task.id, col);
        updateTaskStatus(task.id, col);
        await refreshNotifications?.();
        showToast?.(`Task no ${task.id} -> ${col}`);
      } catch {
        showToast?.('Failed to update status', 'error');
      }
    }
    setDragId(null);
    setOverCol(null);
  }

  function startEditTask() {
    if (!selectedTask) return;
    setTaskForm({
      title: selectedTask.title || '',
      description: selectedTask.description || '',
      assigneeId: selectedTask.assignee_id ? String(selectedTask.assignee_id) : '',
      status: selectedTask.status || 'To Do',
      priority: selectedTask.priority || 'Medium',
      dueDate: selectedTask.due_date ? String(selectedTask.due_date).slice(0, 10) : '',
      tags: (selectedTask.tags || []).join(', '),
    });
    setTaskErrors({});
    setTaskFormError('');
    setIsEditingTask(true);
  }

  async function saveTaskChanges() {
    if (!selectedTask) return;
    const nextErrors = validateTaskFields(taskForm);
    if (Object.keys(nextErrors).length) {
      setTaskErrors(nextErrors);
      return;
    }

    setTaskSaving(true);
    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || '',
        assigneeId: Number(taskForm.assigneeId),
        status: taskForm.status,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || undefined,
        tags: taskForm.tags
          ? taskForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };
      const { data: res } = await taskService.update(selectedTask.id, payload);
      const updated = res?.data || {};
      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, ...updated } : t)));
      setIsEditingTask(false);
      setTaskErrors({});
      setTaskFormError('');
      showToast?.('Task updated successfully');
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'Failed to update task';
      const fieldErr = mapTaskApiErrorToField(apiMessage);
      if (fieldErr) {
        setTaskErrors((prev) => ({ ...prev, ...fieldErr }));
      } else {
        setTaskFormError(apiMessage);
      }
    } finally {
      setTaskSaving(false);
    }
  }

  function closeTaskModal() {
    setSelectedTaskId(null);
    setIsEditingTask(false);
    setTaskErrors({});
    setTaskFormError('');
  }

  function openCreateTask(defaultStatus = 'To Do') {
    setNewTaskForm({
      title: '',
      description: '',
      assigneeId: '',
      status: defaultStatus,
      priority: 'Medium',
      dueDate: '',
      tags: '',
    });
    setNewTaskErrors({});
    setNewTaskFormError('');
    setIsCreateTaskOpen(true);
  }

  function closeCreateTaskModal() {
    setIsCreateTaskOpen(false);
    setNewTaskErrors({});
    setNewTaskFormError('');
  }

  async function createTask() {
    const nextErrors = validateTaskFields(newTaskForm);
    if (Object.keys(nextErrors).length) {
      setNewTaskErrors(nextErrors);
      return;
    }
    setTaskCreating(true);
    try {
      const payload = {
        title: newTaskForm.title.trim(),
        description: newTaskForm.description.trim() || '',
        assigneeId: Number(newTaskForm.assigneeId),
        status: newTaskForm.status,
        priority: newTaskForm.priority,
        dueDate: newTaskForm.dueDate || undefined,
        tags: newTaskForm.tags
          ? newTaskForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };
      const { data: res } = await taskService.create(activeProject.id, payload);
      const createdTask = res?.data;
      if (createdTask) setTasks((prev) => [createdTask, ...prev]);
      setIsCreateTaskOpen(false);
      setNewTaskErrors({});
      setNewTaskFormError('');
      showToast?.('Task created successfully');
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'Failed to create task';
      const fieldErr = mapTaskApiErrorToField(apiMessage);
      if (fieldErr) {
        setNewTaskErrors((prev) => ({ ...prev, ...fieldErr }));
      } else {
        setNewTaskFormError(apiMessage);
      }
    } finally {
      setTaskCreating(false);
    }
  }

  if (!activeProject) return <div className="tf-subtext py-5 text-center">No project selected.</div>;
  if (loading) return <Spinner />;

  return (
    <div className="tf-fade-up">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="tf-heading-xl">{canViewTeamBoard ? 'Team Board' : 'Board'}</h1>
          <p className="tf-subtext mt-1">{visibleTasks.length} tasks - {activeProject.name} - drag cards to update status</p>
        </div>
        {canManage && (
          <button className="tf-btn tf-btn-primary" onClick={() => openCreateTask('To Do')}>
            <Plus size={14} /> New Task
          </button>
        )}
      </div>

      <ProjectHeader
        project={activeProject}
        user={user}
        onInvite={openInvite}
        onMemberSelect={canViewTeamBoard ? handleMemberFilter : undefined}
        selectedMemberId={selectedMemberId}
      />

      {selectedMember && (
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="tf-subtext" style={{ color: 'var(--tf-gray-600)' }}>
            Showing tasks for <strong>{selectedMember.name}</strong>
          </span>
          <button className="tf-btn tf-btn-ghost tf-btn-xs tf-clear-filter-btn" onClick={clearMemberFilter}>
            Clear
          </button>
        </div>
      )}

      <div className="tf-board-scroll">
        {TASK_STATUSES.map((col) => {
          const colTasks = visibleTasks.filter((t) => t.status === col);
          const colColor = COL_COLORS[col] || '#64748B';
          const isOver = overCol === col;

          return (
            <div
              key={col}
              className="tf-board-col"
              onDragOver={(e) => {
                if (isClient && col !== 'Blocked') return;
                e.preventDefault();
                setOverCol(col);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null);
              }}
              onDrop={() => handleDrop(col)}
            >
              <div className="tf-board-col__header">
                <div className="d-flex align-items-center gap-2">
                  <span className="tf-board-col__dot" style={{ background: colColor }} />
                  <span className="tf-board-col__name">{col.toUpperCase()}</span>
                  <span className="tf-board-col__count" style={{ background: `${colColor}18`, color: colColor }}>
                    {colTasks.length}
                  </span>
                </div>
                {canManage && (
                  <button
                    type="button"
                    className="tf-board-action-btn"
                    style={{ width: 24, height: 24, borderRadius: 8 }}
                    onClick={() => openCreateTask(col)}
                    title={`Add task to ${col}`}
                    aria-label={`Add task to ${col}`}
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              <div
                className={`tf-board-col__zone${isOver ? ' tf-board-col__zone--over' : ''}`}
                style={isOver ? { borderColor: colColor, background: `${colColor}06` } : {}}
              >
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    colStatus={col}
                    currentUserId={user?.id}
                    draggable={canDragTask(task)}
                    isDragging={dragId === task.id}
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setIsEditingTask(false);
                    }}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="tf-board-col__empty" style={isOver ? { color: colColor, borderColor: colColor } : {}}>
                    {isOver ? 'Drop here' : 'No tasks'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isCreateTaskOpen && (
        <>
          <ModalOverlay onClose={closeCreateTaskModal} />
          <div className="tf-modal tf-modal-w-md">
            <div className="tf-modal__header">
              <h3 className="tf-modal__title">Create New Task</h3>
              <button className="tf-board-action-btn tf-board-action-btn--close" onClick={closeCreateTaskModal}>
                <X size={14} />
              </button>
            </div>
            <div className="tf-modal__body">
              <div>
                <label className="tf-label mb-1">TASK TITLE *</label>
                <input
                  className={`tf-input${newTaskErrors.title ? ' tf-input--error' : ''}`}
                  value={newTaskForm.title}
                  onChange={(e) => updateNewTaskField('title', e.target.value)}
                />
                {newTaskErrors.title && <div className="tf-field-error">{newTaskErrors.title}</div>}
              </div>
              <div>
                <label className="tf-label mb-1">DESCRIPTION</label>
                <textarea
                  className={`tf-input${newTaskErrors.description ? ' tf-input--error' : ''}`}
                  rows={3}
                  style={{ resize: 'none' }}
                  value={newTaskForm.description}
                  onChange={(e) => updateNewTaskField('description', e.target.value)}
                />
                {newTaskErrors.description && <div className="tf-field-error">{newTaskErrors.description}</div>}
              </div>
              <div className="tf-board-form-grid">
                <div>
                  <label className="tf-label mb-1">ASSIGNEE *</label>
                  <select
                    className={`tf-input${newTaskErrors.assigneeId ? ' tf-input--error' : ''}`}
                    value={newTaskForm.assigneeId}
                    onChange={(e) => updateNewTaskField('assigneeId', e.target.value)}
                  >
                    <option value="">Select member...</option>
                    {assigneeOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {newTaskErrors.assigneeId && <div className="tf-field-error">{newTaskErrors.assigneeId}</div>}
                </div>
                <div>
                  <label className="tf-label mb-1">DUE DATE</label>
                  <input
                    type="date"
                    className={`tf-input${newTaskErrors.dueDate ? ' tf-input--error' : ''}`}
                    value={newTaskForm.dueDate}
                    onChange={(e) => updateNewTaskField('dueDate', e.target.value)}
                  />
                  {newTaskErrors.dueDate && <div className="tf-field-error">{newTaskErrors.dueDate}</div>}
                </div>
              </div>
              <div className="tf-board-form-grid">
                <div>
                  <label className="tf-label mb-1">STATUS</label>
                  <select
                    className={`tf-input${newTaskErrors.status ? ' tf-input--error' : ''}`}
                    value={newTaskForm.status}
                    onChange={(e) => updateNewTaskField('status', e.target.value)}
                  >
                    {TASK_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                  {newTaskErrors.status && <div className="tf-field-error">{newTaskErrors.status}</div>}
                </div>
                <div>
                  <label className="tf-label mb-1">PRIORITY</label>
                  <select
                    className={`tf-input${newTaskErrors.priority ? ' tf-input--error' : ''}`}
                    value={newTaskForm.priority}
                    onChange={(e) => updateNewTaskField('priority', e.target.value)}
                  >
                    {TASK_PRIORITIES.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                  {newTaskErrors.priority && <div className="tf-field-error">{newTaskErrors.priority}</div>}
                </div>
              </div>
              <div>
                <label className="tf-label mb-1">TAGS (comma separated)</label>
                <input
                  className={`tf-input${newTaskErrors.tags ? ' tf-input--error' : ''}`}
                  value={newTaskForm.tags}
                  onChange={(e) => updateNewTaskField('tags', e.target.value)}
                />
                {newTaskErrors.tags && <div className="tf-field-error">{newTaskErrors.tags}</div>}
              </div>
            </div>
            <div className="tf-modal__footer">
              {newTaskFormError && <div className="tf-field-error me-auto">{newTaskFormError}</div>}
              <button className="tf-btn tf-btn-ghost" onClick={closeCreateTaskModal} disabled={taskCreating}>Cancel</button>
              <button className="tf-btn tf-btn-primary" onClick={createTask} disabled={taskCreating}>{taskCreating ? 'Creating...' : 'Create Task'}</button>
            </div>
          </div>
        </>
      )}

      {selectedTask && (
        <>
          <ModalOverlay onClose={closeTaskModal} />
          <div className="tf-modal tf-modal-w-md tf-board-task-modal">
            <div className="tf-board-detail">
              <div className="tf-board-toolbar">
                <div className="tf-label">TASK #{selectedTask.id}</div>
                <div className="d-flex align-items-center gap-2">
                  {canManage && !isEditingTask && (
                    <button
                      className="tf-board-action-btn"
                      title="Edit task"
                      aria-label="Edit task"
                      onClick={startEditTask}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    className="tf-board-action-btn tf-board-action-btn--close"
                    title="Close"
                    aria-label="Close"
                    onClick={closeTaskModal}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {(isEditingTask || !canManage) ? (
                <div className="tf-board-edit-form">
                  <div>
                    <label className="tf-field-label">TASK TITLE *</label>
                    <input
                      className={`tf-input${taskErrors.title ? ' tf-input--error' : ''}`}
                      value={taskForm.title}
                      onChange={(e) => updateTaskField('title', e.target.value)}
                      disabled={!canManage}
                    />
                    {taskErrors.title && <div className="tf-field-error">{taskErrors.title}</div>}
                  </div>
                  <div>
                    <label className="tf-field-label">DESCRIPTION</label>
                    <textarea
                      className={`tf-input${taskErrors.description ? ' tf-input--error' : ''}`}
                      rows={3}
                      value={taskForm.description}
                      onChange={(e) => updateTaskField('description', e.target.value)}
                      style={{ resize: 'none' }}
                      disabled={!canManage}
                    />
                    {taskErrors.description && <div className="tf-field-error">{taskErrors.description}</div>}
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="tf-field-label">ASSIGNEE *</label>
                      <select
                        className={`tf-input${taskErrors.assigneeId ? ' tf-input--error' : ''}`}
                        value={taskForm.assigneeId}
                        onChange={(e) => updateTaskField('assigneeId', e.target.value)}
                        disabled={!canManage}
                      >
                        <option value="">Select member...</option>
                        {assigneeOptions.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      {taskErrors.assigneeId && <div className="tf-field-error">{taskErrors.assigneeId}</div>}
                    </div>
                    <div className="col-6">
                      <label className="tf-field-label">DUE DATE</label>
                      <input
                        type="date"
                        className={`tf-input${taskErrors.dueDate ? ' tf-input--error' : ''}`}
                        value={taskForm.dueDate}
                        onChange={(e) => updateTaskField('dueDate', e.target.value)}
                        disabled={!canManage}
                      />
                      {taskErrors.dueDate && <div className="tf-field-error">{taskErrors.dueDate}</div>}
                    </div>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="tf-field-label">STATUS</label>
                      <select
                        className={`tf-input${taskErrors.status ? ' tf-input--error' : ''}`}
                        value={taskForm.status}
                        onChange={(e) => updateTaskField('status', e.target.value)}
                        disabled={!canManage}
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {taskErrors.status && <div className="tf-field-error">{taskErrors.status}</div>}
                    </div>
                    <div className="col-6">
                      <label className="tf-field-label">PRIORITY</label>
                      <select
                        className={`tf-input${taskErrors.priority ? ' tf-input--error' : ''}`}
                        value={taskForm.priority}
                        onChange={(e) => updateTaskField('priority', e.target.value)}
                        disabled={!canManage}
                      >
                        {TASK_PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      {taskErrors.priority && <div className="tf-field-error">{taskErrors.priority}</div>}
                    </div>
                  </div>
                  <div>
                    <label className="tf-field-label">TAGS (comma separated)</label>
                    <input
                      className={`tf-input${taskErrors.tags ? ' tf-input--error' : ''}`}
                      value={taskForm.tags}
                      onChange={(e) => updateTaskField('tags', e.target.value)}
                      disabled={!canManage}
                    />
                    {taskErrors.tags && <div className="tf-field-error">{taskErrors.tags}</div>}
                  </div>

                  {canManage && (
                    <div className="d-flex justify-content-end gap-2">
                      {taskFormError && <div className="tf-field-error me-auto">{taskFormError}</div>}
                      <button
                        className="tf-btn tf-btn-ghost tf-btn-xs"
                        onClick={() => setIsEditingTask(false)}
                        disabled={taskSaving}
                      >
                        Cancel
                      </button>
                      <button
                        className="tf-btn tf-btn-primary tf-btn-xs"
                        onClick={saveTaskChanges}
                        disabled={taskSaving}
                      >
                        {taskSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="tf-board-detail__head">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <h3 className="tf-heading-lg mb-1">{selectedTask.title}</h3>
                      </div>
                      <StatusBadge status={selectedTask.status} />
                    </div>
                    <p className="tf-subtext mb-0">{selectedTask.description || 'No description provided.'}</p>
                  </div>

                  <div className="tf-board-detail__chips">
                    <PriBadge priority={selectedTask.priority} />
                    {selectedTask.due_date && (
                      <span className="tf-badge tf-status-todo">
                        <Calendar size={12} />
                        {formatDate(selectedTask.due_date)}
                      </span>
                    )}
                  </div>

                  <div className="tf-label tf-board-detail__section-label">Task Details</div>
                  <div className="tf-board-detail__grid">
                    <div className="tf-board-detail__row">
                      <span className="tf-board-detail__k"><Calendar size={13} /> Due Date</span>
                      <span className="tf-board-detail__v">{formatDate(selectedTask.due_date)}</span>
                    </div>

                    <div className="tf-board-detail__row">
                      <span className="tf-board-detail__k"><UserRound size={13} /> Assignee</span>
                      <div className="d-flex align-items-center gap-2 tf-board-detail__v">
                        <Avatar
                          user={{
                            id: selectedTask.assignee_id,
                            name: selectedTask.assignee_name,
                            initials: selectedTask.assignee_initials,
                            avatar_color: selectedTask.assignee_color,
                          }}
                          size={22}
                        />
                        <span className="tf-board-detail__name">{selectedTask.assignee_name || 'Unassigned'}</span>
                      </div>
                    </div>

                    <div className="tf-board-detail__row">
                      <span className="tf-board-detail__k"><UserRound size={13} /> Reporter</span>
                      <span className="tf-board-detail__v">{selectedTask.reporter_name || 'Unknown'}</span>
                    </div>

                    <div className="tf-board-detail__row">
                      <span className="tf-board-detail__k"><MessageSquare size={13} /> Comments</span>
                      <span className="tf-board-detail__v">{selectedTask.comment_count || 0}</span>
                    </div>

                    <div className="tf-board-detail__row">
                      <span className="tf-board-detail__k"><Paperclip size={13} /> Attachments</span>
                      <span className="tf-board-detail__v">{selectedTask.attachment_count || 0}</span>
                    </div>

                    <div className="tf-board-detail__row">
                      <span className="tf-board-detail__k"><Clock3 size={13} /> Created</span>
                      <span className="tf-board-detail__v">{formatDate(selectedTask.created_at)}</span>
                    </div>

                    <div className="tf-board-detail__row">
                      <span className="tf-board-detail__k"><Clock3 size={13} /> Updated</span>
                      <span className="tf-board-detail__v">{formatDate(selectedTask.updated_at)}</span>
                    </div>
                  </div>

                  {(selectedTask.tags || []).length > 0 && (
                    <>
                      <div className="tf-label tf-board-detail__section-label">Tags</div>
                      <div className="d-flex gap-1 flex-wrap mt-2">
                        {selectedTask.tags.map((tg) => (
                          <span key={tg} className="tf-tag" style={{ background: 'var(--tf-gray-100)', color: 'var(--tf-gray-600)' }}>
                            {tg}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


