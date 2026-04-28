import { STATUS_CLASS_MAP } from '../../utils/constants';

export default function StatusBadge({ status = 'To Do' }) {
  return <span className={STATUS_CLASS_MAP[status] || 'tf-status-todo'}>{status}</span>;
}
