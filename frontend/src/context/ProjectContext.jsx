// Purpose: Provides shared React context state across the app.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectService } from '../api/services';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);
const ACTIVE_PROJECT_KEY = 'tf_active_project_id';

function activeProjectKey(userId) {
  return userId ? `${ACTIVE_PROJECT_KEY}_${userId}` : ACTIVE_PROJECT_KEY;
}

function getStoredActiveId(userId) {
  const raw = localStorage.getItem(activeProjectKey(userId));
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function ProjectProvider({ children }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // Fetch all projects when user changes
  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await projectService.getAll();
      const list = res.data || [];
      setProjects(list);
      // Keep selected project across refresh; otherwise pick first visible project.
      setActiveId(prev => {
        const storedId = getStoredActiveId(user?.id);
        const preferredId = prev || storedId;
        const stillThere = list.find(p => Number(p.id) === Number(preferredId));
        const nextId = stillThere ? Number(stillThere.id) : (list[0]?.id || null);
        if (nextId) localStorage.setItem(activeProjectKey(user?.id), String(nextId));
        return nextId;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Get currently selected project
  const activeProject = projects.find(p => p.id === activeId) || null;

  const selectProject = useCallback((projectId) => {
    const nextId = projectId ? Number(projectId) : null;
    setActiveId(nextId);
    if (nextId) {
      localStorage.setItem(activeProjectKey(user?.id), String(nextId));
    } else {
      localStorage.removeItem(activeProjectKey(user?.id));
    }
  }, [user?.id]);

  // Add newly created project to list
  const addProject = useCallback((proj) => {
    setProjects(prev => [proj, ...prev]);
    selectProject(proj.id);
  }, [selectProject]);

  // Update project details in list
  const updateProject = useCallback((projectId, changes) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, ...changes } : p)));
  }, []);

  return (
    <ProjectContext.Provider value={{
      projects, activeProject, activeId, setActiveId: selectProject,
      loading, error, fetchProjects, addProject, updateProject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider');
  return ctx;
};

