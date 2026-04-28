import api from './axios';

export const authService = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

export const projectService = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (payload) => api.post('/projects', payload),
  update: (id, payload) => api.put(`/projects/${id}`, payload),
  members: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, payload) => api.post(`/projects/${id}/members`, payload),
  invite: (id, payload) => api.post(`/projects/${id}/invite`, payload),
  acceptInvite: (payload) => api.post('/projects/invite/accept', payload),
};

export const taskService = {
  listByProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
  create: (projectId, payload) => api.post(`/projects/${projectId}/tasks`, payload),
  update: (id, payload) => api.put(`/tasks/${id}`, payload),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => api.delete(`/tasks/${id}`),
  getById: (id) => api.get(`/tasks/${id}`),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
};

export const reportService = {
  summary: (projectId) => api.get(`/reports/${projectId}/summary`),
  statusDist: (projectId) => api.get(`/reports/${projectId}/status-distribution`),
  trend: (projectId) => api.get(`/reports/${projectId}/trend`),
  workload: (projectId) => api.get(`/reports/${projectId}/workload`),
};

export const userService = {
  list: () => api.get('/users'),
  employees: () => api.get('/users/employees'),
  updateMe: (payload) => api.patch('/users/me', payload),
  updatePassword: (payload) => api.patch('/users/me/password', payload),
};
