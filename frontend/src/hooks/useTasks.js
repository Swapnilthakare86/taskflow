import { useCallback, useEffect, useState } from 'react';
import { taskService } from '../api/services';

export function useTasks(projectId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!projectId) {
      setTasks([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await taskService.listByProject(projectId);
      setTasks(data.data || []);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  function updateTaskStatus(taskId, status) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
  }

  return { tasks, setTasks, loading, fetchTasks, updateTaskStatus };
}
