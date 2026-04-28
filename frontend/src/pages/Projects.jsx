import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { projectService, userService } from '../api/services';
import ProjectCard from '../components/cards/ProjectCard';
import ModalOverlay from '../components/common/ModalOverlay';
import Avatar from '../components/common/Avatar';
import { PROJECT_STATUSES } from '../utils/constants';

function defaultForm() {
  return {
    name: '',
    code: '',
    description: '',
    status: 'In Progress',
    deadline: '',
    teamMemberIds: [],
  };
}

export default function Projects() {
  const navigate = useNavigate();
  const { user, canManage } = useAuth();
  const { projects, activeId, setActiveId, fetchProjects } = useProject();
  const { showToast, openInvite } = useOutletContext();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [form, setForm] = useState(defaultForm());
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const projectStatusOptions = useMemo(() => {
    if (PROJECT_STATUSES.includes(form.status)) return PROJECT_STATUSES;
    return [...PROJECT_STATUSES, form.status].filter(Boolean);
  }, [form.status]);

  const visible = useMemo(() => {
    if (user?.role !== 'client') return projects;
    return projects.filter((p) => (p.members || []).some((m) => Number(m.id) === Number(user?.id)));
  }, [projects, user]);

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    (async () => {
      setLoadingEmployees(true);
      try {
        const { data } = await userService.employees();
        if (!active) return;
        setEmployees(data?.data || []);
      } catch {
        if (!active) return;
        setEmployees([]);
      } finally {
        if (active) setLoadingEmployees(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [canManage]);

  function openCreate() {
    setForm(defaultForm());
    setErrors({});
    setFormError('');
    setShowCreateModal(true);
  }

  function openEdit(project) {
    setEditingProjectId(project.id);
    const employeeIds = (project.members || [])
      .filter((m) => String(m.role || '').toLowerCase() === 'employee')
      .map((m) => Number(m.id));
    setForm({
      name: project.name || '',
      code: project.code || '',
      description: project.description || '',
      status: project.status || 'In Progress',
      deadline: project.deadline ? String(project.deadline).slice(0, 10) : '',
      teamMemberIds: employeeIds,
    });
    setErrors({});
    setFormError('');
    setShowEditModal(true);
  }

  function closeCreate() {
    setShowCreateModal(false);
    setErrors({});
    setFormError('');
  }

  function closeEdit() {
    setShowEditModal(false);
    setEditingProjectId(null);
    setErrors({});
    setFormError('');
  }

  function generateCode(name) {
    const prefix = String(name || '').trim().slice(0, 3).toUpperCase() || 'PRJ';
    return `${prefix}-01`;
  }

  function toggleEmployee(userId) {
    setForm((prev) => {
      const idNum = Number(userId);
      const exists = prev.teamMemberIds.some((id) => Number(id) === idNum);
      return {
        ...prev,
        teamMemberIds: exists
          ? prev.teamMemberIds.filter((id) => Number(id) !== idNum)
          : [...prev.teamMemberIds, idNum],
      };
    });
  }

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setFormError('');
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Project name is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function mapApiErrorToField(message) {
    const msg = String(message || '').toLowerCase();
    if (msg.includes('name')) return { name: message };
    if (msg.includes('code')) return { code: message };
    if (msg.includes('deadline') || msg.includes('date')) return { deadline: message };
    if (msg.includes('status')) return { status: message };
    if (msg.includes('description')) return { description: message };
    return null;
  }

  async function createProject() {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || generateCode(form.name),
        description: form.description.trim(),
        status: form.status,
        deadline: form.deadline || null,
        teamMemberIds: form.teamMemberIds,
      };
      await projectService.create(payload);
      await fetchProjects();
      closeCreate();
      showToast?.('Project created successfully');
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'Failed to create project';
      const fieldErr = mapApiErrorToField(apiMessage);
      if (fieldErr) {
        setErrors((prev) => ({ ...prev, ...fieldErr }));
      } else {
        setFormError(apiMessage);
      }
    } finally {
      setSaving(false);
    }
  }

  async function updateProject() {
    if (!editingProjectId) return;
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || generateCode(form.name),
        description: form.description.trim(),
        status: form.status,
        deadline: form.deadline || null,
        teamMemberIds: form.teamMemberIds,
      };
      await projectService.update(editingProjectId, payload);
      await fetchProjects();
      closeEdit();
      showToast?.('Project updated successfully');
    } catch (err) {
      const apiMessage = err.response?.data?.message || 'Failed to update project';
      const fieldErr = mapApiErrorToField(apiMessage);
      if (fieldErr) {
        setErrors((prev) => ({ ...prev, ...fieldErr }));
      } else {
        setFormError(apiMessage);
      }
    } finally {
      setSaving(false);
    }
  }

  function renderProjectForm({ submitLabel, onSubmit, onCancel, showEmployeeSection }) {
    return (
      <>
      <div className="tf-modal__header">
        <h3 className="tf-modal__title">{submitLabel === 'Create Project' ? 'Add New Project' : 'Edit Project'}</h3>
        <button className="tf-topbar__icon-btn" onClick={onCancel} aria-label="Close">
          <X size={14} />
        </button>
      </div>

      <div className="tf-modal__body">
        <div className="tf-board-form-grid">
          <div>
            <label className="tf-label mb-1">PROJECT NAME *</label>
            <input
              className={`tf-input${errors.name ? ' tf-input--error' : ''}`}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
            {errors.name && <div className="tf-field-error">{errors.name}</div>}
          </div>
          <div>
            <label className="tf-label mb-1">PROJECT CODE *</label>
            <input
              className={`tf-input${errors.code ? ' tf-input--error' : ''}`}
              value={form.code}
              onChange={(e) => setField('code', e.target.value)}
              placeholder="e.g. CRV-01"
            />
            {errors.code && <div className="tf-field-error">{errors.code}</div>}
          </div>
        </div>

        <div>
          <label className="tf-label mb-1">DESCRIPTION</label>
          <textarea
            className={`tf-input${errors.description ? ' tf-input--error' : ''}`}
            rows={3}
            style={{ resize: 'none' }}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
          {errors.description && <div className="tf-field-error">{errors.description}</div>}
        </div>

        <div className="tf-board-form-grid">
          <div>
            <label className="tf-label mb-1">STATUS</label>
            <select
              className={`tf-input${errors.status ? ' tf-input--error' : ''}`}
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              {projectStatusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.status && <div className="tf-field-error">{errors.status}</div>}
          </div>
          <div>
            <label className="tf-label mb-1">DEADLINE</label>
            <input
              type="date"
              className={`tf-input${errors.deadline ? ' tf-input--error' : ''}`}
              value={form.deadline}
              onChange={(e) => setField('deadline', e.target.value)}
            />
            {errors.deadline && <div className="tf-field-error">{errors.deadline}</div>}
          </div>
        </div>

        {showEmployeeSection && (
          <div>
            <label className="tf-label mb-2">ADD EMPLOYEES TO PROJECT</label>
            {loadingEmployees ? (
              <div className="tf-subtext">Loading employees...</div>
            ) : !employees.length ? (
              <div className="tf-subtext">No registered employees found.</div>
            ) : (
              <div className="tf-employee-picker">
                {employees.map((emp) => {
                  const checked = form.teamMemberIds.some((id) => Number(id) === Number(emp.id));
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      className={`tf-employee-pill${checked ? ' tf-employee-pill--active' : ''}`}
                      onClick={() => toggleEmployee(emp.id)}
                    >
                      <Avatar user={emp} size={24} />
                      <span>{emp.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="tf-modal__footer">
        {formError && <div className="tf-field-error me-auto">{formError}</div>}
        <button className="tf-btn tf-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="tf-btn tf-btn-primary" onClick={onSubmit} disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
      </div>
    </>
    );
  }

  return (
    <div className="tf-fade-up">
      <div className="tf-projects-page-head">
        <div>
          <h1 className="tf-heading-xl">All Projects</h1>
          <p className="tf-subtext mt-1">{visible.length} project you manage</p>
        </div>
        {canManage && (
          <button className="tf-btn tf-btn-primary" onClick={openCreate}>
            <Plus size={14} /> New Project
          </button>
        )}
      </div>

      <div className={`tf-projects-grid${visible.length === 1 ? ' tf-projects-grid--single' : ''}`}>
        {visible.map((p) => (
          <div key={p.id}>
            <ProjectCard
              project={p}
              user={user}
              isManager={canManage}
              isActive={p.id === activeId}
              onClick={() => { setActiveId(p.id); navigate('/board'); }}
              onInvite={() => openInvite?.(p)}
              onEdit={() => openEdit(p)}
            />
          </div>
        ))}
      </div>

      {showCreateModal && (
        <>
          <ModalOverlay onClose={closeCreate} />
          <div className="tf-modal tf-modal-w-lg">
            {renderProjectForm({
              submitLabel: 'Create Project',
              onSubmit: createProject,
              onCancel: closeCreate,
              showEmployeeSection: true,
            })}
          </div>
        </>
      )}

      {showEditModal && (
        <>
          <ModalOverlay onClose={closeEdit} />
          <div className="tf-modal tf-modal-w-lg">
            {renderProjectForm({
              submitLabel: 'Save Changes',
              onSubmit: updateProject,
              onCancel: closeEdit,
              showEmployeeSection: true,
            })}
          </div>
        </>
      )}
    </div>
  );
}
