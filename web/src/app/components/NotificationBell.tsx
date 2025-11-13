import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useNotifications,
  AppNotification,
} from '../notifications/NotificationProvider';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAllAsRead, markNotificationAsRead } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!prev && unreadCount > 0) {
        markAllAsRead();
      }
      return next;
    });
  };

  const latestNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (notification: AppNotification) => {
    markNotificationAsRead(notification.id);
    setIsOpen(false);
    if (notification.data?.roomId) {
      navigate(`/chat?room=${notification.data.roomId}`);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#4b1d7a] bg-[#1d0b33] text-white transition hover:border-[#a855f7] hover:text-[#d8b4fe]"
        aria-label="Abrir notificacoes do chat"
        aria-expanded={isOpen}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[1.4rem] min-w-[1.4rem] items-center justify-center rounded-full bg-[#a855f7] px-1 text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-3 w-72 rounded-2xl border border-[#4b1d7a]/50 bg-[#120021]/95 p-4 text-sm text-white shadow-[0_15px_60px_-25px_rgba(122,35,220,0.9)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-[#d3a6ff]">
              Alertas recentes
            </p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#c5b5e9] transition hover:text-white"
            >
              Fechar
            </button>
          </div>
          {latestNotifications.length === 0 ? (
            <p className="text-xs text-[#bda6e3]">
              Nenhuma mensagem recente.
            </p>
          ) : (
            <ul className="space-y-3">
              {latestNotifications.map((notification) => (
                <li
                  key={notification.id}
                  className="rounded-xl border border-[#2a0a49]/60 bg-[#1c032f]/70 p-3"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-[#9b84c6]">
                    {notification.category
                      ? notification.category.toUpperCase()
                      : 'ALERTA'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="mt-1 text-left text-sm text-[#f5e9ff] transition hover:text-white"
                  >
                    <span className="font-semibold">{notification.title}</span>
                    <span className="ml-1 text-[#d4c5f1]">
                      {notification.description}
                    </span>
                  </button>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[#bda6e3]">
                    {new Date(notification.createdAt).toLocaleTimeString(
                      'pt-BR',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
