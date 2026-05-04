import { useState, useEffect } from 'react';
import { Bell, Check, X, BellOff, Loader2 } from 'lucide-react';
import { api, type Notification } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      const list = Array.isArray(data) ? data : (data as any)?.notifications ?? [];
      setNotifications(list);
      setUnreadCount(list.filter((n: Notification) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const removeNotification = (id: string) => {
    const wasUnread = notifications.find(n => n._id === id && !n.read);
    setNotifications(prev => prev.filter(n => n._id !== id));
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <Popover.Root open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) fetchNotifications();
    }}>
      <Popover.Trigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2.5 rounded-full bg-white border border-sp-border shadow-sm text-sp-muted hover:text-sp-purple hover:bg-sp-purple-pale transition-colors outline-none focus:ring-2 focus:ring-sp-purple/20"
        >
          <motion.div
            animate={unreadCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
          >
            <Bell size={20} />
          </motion.div>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sp-purple opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-sp-purple text-[8px] font-black text-white items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </motion.button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-[999] w-96 bg-white rounded-3xl shadow-2xl border border-sp-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-sp-border">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-sp-text uppercase tracking-widest">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-sp-purple text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              className="text-[10px] font-black text-sp-purple uppercase tracking-widest hover:underline"
            >
              Mark all read
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-5 h-5 text-sp-purple animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-center p-8">
                <div className="w-16 h-16 bg-sp-bg rounded-full flex items-center justify-center mb-4">
                  <BellOff className="text-sp-border" size={24} />
                </div>
                <p className="text-sm font-black text-sp-text">No notifications</p>
                <p className="text-xs text-sp-muted font-bold uppercase tracking-widest mt-1">
                  We'll alert you of new activity
                </p>
              </div>
            ) : (
              <div className="divide-y divide-sp-bg">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-5 flex gap-4 transition-colors ${notif.read ? 'opacity-60' : 'bg-sp-purple-pale/20'}`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-sp-text leading-tight">{notif.title}</p>
                        {!notif.read && <div className="w-2 h-2 bg-sp-purple rounded-full shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-sp-muted font-medium leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] font-bold text-sp-muted/50 uppercase tracking-widest pt-1">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Recently'} at{' '}
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!notif.read && (
                        <motion.button
                          whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                          onClick={() => markRead(notif._id)}
                          className="p-1.5 hover:bg-sp-mint rounded-lg text-sp-muted hover:text-sp-success transition-all"
                        >
                          <Check size={14} />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => removeNotification(notif._id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-sp-muted hover:text-red-500 transition-all"
                      >
                        <X size={14} />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 bg-sp-bg/50 border-t border-sp-border text-center">
              <button className="w-full text-[10px] font-black uppercase tracking-widest text-sp-muted hover:text-sp-purple transition-colors py-2">
                View All Activity
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

