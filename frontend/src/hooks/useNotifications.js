import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationService } from '../api/services';

export function useNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = useMemo(
    () => items.reduce((acc, n) => acc + (Number(n?.is_read) === 1 ? 0 : 1), 0),
    [items]
  );

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes] = await Promise.all([
        notificationService.getAll(),
        notificationService.unreadCount(),
      ]);
      setItems(listRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  function addNotification(notification) {
    setItems((prev) => [{ ...notification, is_read: Number(notification?.is_read) === 1 ? 1 : 0 }, ...prev]);
  }

  async function markRead(id) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    await notificationService.markRead(id);
  }

  async function markAllRead() {
    await notificationService.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
  }

  return { items, unreadCount, loading, fetchNotifications, addNotification, markRead, markAllRead };
}
