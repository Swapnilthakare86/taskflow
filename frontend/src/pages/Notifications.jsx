import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Mail, CheckCircle2, UserPlus, Layout } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const FILTER_UNREAD = 'unread';
const FILTER_READ = 'read';

function parseCreatedAt(value) {
  if (!value) return 0;
  const raw = String(value).trim();
  const normalized =
    /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(raw)
      ? `${raw.replace(' ', 'T')}Z`
      : raw;
  const ts = new Date(normalized).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function timeAgo(dateStr) {
  if (!dateStr) return '-';

  const then = parseCreatedAt(dateStr);
  if (!then) return '-';

  const diff = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diff < 60) return 'Just now';

  const d = new Date(then);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const iconMap = {
  invite: Mail,
  done: CheckCircle2,
  assigned: UserPlus,
  status: Layout,
};

function isReadNotification(n) {
  return Number(n?.is_read) === 1;
}

export default function Notifications() {
  const outlet = useOutletContext() || {};
  const local = useNotifications();
  const [filter, setFilter] = useState(FILTER_UNREAD);

  const items = outlet.notifications ?? local.items;
  const unreadCount = outlet.unreadCount ?? local.unreadCount;
  const markRead = outlet.markRead ?? local.markRead;
  const markAllRead = outlet.markAllRead ?? local.markAllRead;

  const sorted = useMemo(
    () => items.slice().sort((a, b) => parseCreatedAt(b.created_at) - parseCreatedAt(a.created_at)),
    [items]
  );

  const readCount = useMemo(() => sorted.filter((n) => isReadNotification(n)).length, [sorted]);

  const visible = useMemo(() => {
    if (filter === FILTER_UNREAD) return sorted.filter((n) => !isReadNotification(n));
    if (filter === FILTER_READ) return sorted.filter((n) => isReadNotification(n));
    return sorted.filter((n) => !isReadNotification(n));
  }, [filter, sorted]);

  return (
    <div className="tf-fade-up">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="tf-heading-xl">Notifications</h1>
      </div>

      <div className="tf-notif-filters mb-3">
        <button
          className={`tf-notif-filter-btn${filter === FILTER_READ ? ' tf-notif-filter-btn--active' : ''}`}
          onClick={() => setFilter(FILTER_READ)}
        >
          Read {readCount}
        </button>
        <button
          className={`tf-notif-filter-btn${filter === FILTER_UNREAD ? ' tf-notif-filter-btn--active' : ''}`}
          onClick={() => setFilter(FILTER_UNREAD)}
        >
          Unread {unreadCount}
        </button>
        <button className="tf-notif-filter-btn" onClick={markAllRead}>Mark all read</button>
      </div>

      <div className="d-grid gap-2">
        {visible.map((n) => {
          const Icon = iconMap[n.type] || Mail;
          const isRead = isReadNotification(n);
          return (
            <button
              key={n.id}
              className={`tf-card text-start tf-notif-card${isRead ? ' tf-notif-card--read' : ' tf-notif-card--unread'}`}
              onClick={() => {
                if (!isRead) markRead(n.id);
              }}
            >
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div className="d-flex gap-2">
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', display: 'grid', placeItems: 'center' }}><Icon size={16} color="#3b82f6" /></div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{n.title}</div>
                    <div className="tf-subtext">{n.description}</div>
                  </div>
                </div>
                <div className="tf-subtext">{timeAgo(n.created_at)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
