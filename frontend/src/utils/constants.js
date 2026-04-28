// Purpose: Provides shared utility helpers used across the backend.
// Allowed task status values
export const TASK_STATUSES = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Blocked', 'Done'];

// Allowed task priority values
export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// Allowed project status values
export const PROJECT_STATUSES = ['On Hold', 'In Progress', 'Upcoming', 'Done'];

// CSS class names for task status badges
export const STATUS_CLASS_MAP = {
  'Backlog':     'tf-status-backlog',
  'To Do':       'tf-status-todo',
  'In Progress': 'tf-status-inprogress',
  'In Review':   'tf-status-inreview',
  'Blocked':     'tf-status-blocked',
  'Done':        'tf-status-done',
  'On Hold':     'tf-status-onhold',
  'Upcoming':    'tf-status-upcoming',
};

// CSS class names for task priority badges
export const PRIORITY_CLASS_MAP = {
  'Low':      'tf-pri-low',
  'Medium':   'tf-pri-medium',
  'High':     'tf-pri-high',
  'Critical': 'tf-pri-critical',
};

// Hex colors for each task status (for charts and visual indicators)
export const COL_COLORS = {
  'Backlog':     '#8B5CF6',
  'To Do':       '#64748B',
  'In Progress': '#3B82F6',
  'In Review':   '#F59E0B',
  'Blocked':     '#EF4444',
  'Done':        '#10B981',
};

// Configuration for notification type styling
export const NOTIF_TYPE_CFG = {
  assigned: { color: '#3B82F6', bg: '#EFF6FF', icon: 'UserPlus' },
  status:   { color: '#8B5CF6', bg: '#F5F3FF', icon: 'Layout'   },
  comment:  { color: '#10B981', bg: '#ECFDF5', icon: 'MessageSquare' },
  overdue:  { color: '#EF4444', bg: '#FEF2F2', icon: 'AlertTriangle' },
  invite:   { color: '#F59E0B', bg: '#FFFBEB', icon: 'Mail'     },
  done:     { color: '#10B981', bg: '#ECFDF5', icon: 'CheckCircle2'  },
};

// Available project colors
export const PROJECT_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#14B8A6',
];

