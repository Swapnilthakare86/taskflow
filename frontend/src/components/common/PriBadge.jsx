import { PRIORITY_CLASS_MAP } from '../../utils/constants';

export default function PriBadge({ priority = 'Medium' }) {
  return <span className={PRIORITY_CLASS_MAP[priority] || 'tf-pri-medium'}>{priority}</span>;
}
