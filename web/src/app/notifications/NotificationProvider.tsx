import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatApi, ChatMessage, ChatRoomSummary } from '../services/chatApi';
import { supabaseClient } from '../services/supabaseClient';

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  category?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
};

export type AppNotificationInput = {
  id?: string;
  title: string;
  description: string;
  category?: string;
  data?: Record<string, unknown>;
  createdAt?: string;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  toast: AppNotification | null;
  dismissToast(): void;
  markAllAsRead(): void;
  notify(input: AppNotificationInput): void;
  subscribeRoom(room: ChatRoomSummary): void;
  markNotificationAsRead(id: string): void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

let audioContext: AudioContext | null = null;

const playNotificationTone = async () => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    audioContext = audioContext ?? new AudioContext();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const duration = 0.35;
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1046, audioContext.currentTime); // C6

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.2,
      audioContext.currentTime + 0.05
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gainNode).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.warn('Nao foi possivel reproduzir o alerta sonoro', error);
  }
};

export const NotificationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { isAuthenticated, user } = useAuth();
  const allowed = isAuthenticated;
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toast, setToast] = useState<AppNotification | null>(null);

  const channelsRef = useRef<Record<string, RealtimeChannel>>({});
  const subscribedRooms = useRef<Set<string>>(new Set());
  const roomCache = useRef<Record<string, ChatRoomSummary>>({});

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const unlockAudio = () => {
      try {
        audioContext = audioContext ?? new AudioContext();
        if (audioContext.state === 'suspended') {
          void audioContext.resume();
        }
      } catch (error) {
        console.warn('Nao foi possivel preparar o contexto de audio', error);
      } finally {
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      }
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const cleanupChannels = useCallback(() => {
    Object.values(channelsRef.current).forEach((channel) => {
      supabaseClient.removeChannel(channel);
    });
    channelsRef.current = {};
    subscribedRooms.current.clear();
    roomCache.current = {};
  }, []);

  const buildRoomLabel = useCallback((room: ChatRoomSummary) => {
    if (room.type === 'DIRECT' && room.participants.length > 0) {
      const other =
        room.participants.find(
          (participant) => participant.supabaseUserId !== user?.id
        ) ?? room.participants[0];
      if (other?.displayName) {
        return other.displayName;
      }
      if (other?.handle) {
        return `@${other.handle}`;
      }
      return 'Conversa direta';
    }
    return room.name || 'Sala de chat';
  }, [user?.id]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  }, []);

  const pushNotification = useCallback(
    (notification: AppNotification) => {
      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) {
          return current;
        }
        return [notification, ...current].slice(0, 25);
      });
      setToast(notification);
      playNotificationTone();
    },
    []
  );

  const notify = useCallback(
    (input: AppNotificationInput) => {
      const safeId =
        input.id ??
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      const payload: AppNotification = {
        id: safeId,
        title: input.title,
        description: input.description,
        createdAt: input.createdAt ?? new Date().toISOString(),
        category: input.category,
        data: input.data,
        isRead: false,
      };
      pushNotification(payload);
    },
    [pushNotification]
  );

  const registerChatNotification = useCallback(
    (message: ChatMessage) => {
      const room = roomCache.current[message.roomId];
      if (!room) {
        return;
      }
      if (message.senderUserId === user?.id) {
        return;
      }

      pushNotification({
        id: message.id,
        title: buildRoomLabel(room),
        description: message.content,
        createdAt: message.createdAt,
        category: 'chat',
        data: {
          roomId: message.roomId,
          
          message: message,
        },
        isRead: false,
      });
    },
    [buildRoomLabel, pushNotification, user?.id]
  );

  const subscribeToRoom = useCallback(
    (room: ChatRoomSummary) => {
      if (subscribedRooms.current.has(room.id)) {
        roomCache.current[room.id] = room;
        return;
      }
      roomCache.current[room.id] = room;
      const channel = supabaseClient
        .channel(`chat.room.${room.id}`)
        .on('broadcast', { event: 'chat.message' }, ({ payload }) => {
          registerChatNotification(payload as ChatMessage);
        })
        .subscribe();

      channelsRef.current[room.id] = channel;
      subscribedRooms.current.add(room.id);
    },
    [registerChatNotification]
  );

  useEffect(() => {
    let isMounted = true;
    if (!allowed) {
      cleanupChannels();
      setNotifications([]);
      setToast(null);
      return () => {
        isMounted = false;
      };
    }

    const bootstrap = async () => {
      try {
        const rooms = await chatApi.listRooms();
        if (!isMounted) {
          return;
        }
        rooms.forEach(subscribeToRoom);
      } catch (error) {
        console.error('Nao foi possivel sincronizar notificacoes do chat', error);
      }
    };

    bootstrap();
    const refreshInterval = setInterval(() => {
      if (!isMounted) {
        return;
      }
      bootstrap();
    }, 60_000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
      cleanupChannels();
    };
  }, [allowed, cleanupChannels, subscribeToRoom]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true }))
    );
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const manualSubscribe = useCallback(
    (room: ChatRoomSummary) => {
      if (!allowed) {
        return;
      }
      subscribeToRoom(room);
    },
    [allowed, subscribeToRoom]
  );

  const handleNotificationNavigate = useCallback(
    (notification: AppNotification) => {
      markNotificationAsRead(notification.id);
      setToast(null);
      if (notification.data?.roomId) {
        navigate(`/chat?room=${notification.data.roomId}`);
      }
    },
    [markNotificationAsRead, navigate]
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter(({ isRead }) => !isRead).length,
      toast,
      dismissToast,
      markAllAsRead,
      notify,
      subscribeRoom: manualSubscribe,
      markNotificationAsRead,
    }),
    [
      notifications,
      toast,
      dismissToast,
      markAllAsRead,
      notify,
      manualSubscribe,
      markNotificationAsRead,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast
        notification={toast}
        onDismiss={dismissToast}
        onNavigate={handleNotificationNavigate}
      />
    </NotificationContext.Provider>
  );
};

const NotificationToast = ({
  notification,
  onDismiss,
  onNavigate,
}: {
  notification: AppNotification | null;
  onDismiss: () => void;
  onNavigate?: (notification: AppNotification) => void;
}) => {
  if (!notification) {
    return null;
  }
  const canNavigate = Boolean(notification.data?.roomId && onNavigate);
  const handleNavigate = () => {
    if (canNavigate) {
      onNavigate?.(notification);
    }
  };
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm animate-toast-slide-in rounded-2xl border border-[#4b1d7a]/50 bg-[#140021]/90 p-4 text-white shadow-[0_15px_60px_-20px_rgba(122,35,220,0.7)] backdrop-blur ${
        canNavigate ? 'cursor-pointer hover:border-[#a855f7]/60' : ''
      }`}
      role={canNavigate ? 'button' : undefined}
      tabIndex={canNavigate ? 0 : -1}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (canNavigate && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          handleNavigate();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#d3a6ff]">
            {notification.category
              ? notification.category.toUpperCase()
              : 'Alerta'}
          </p>
          <p className="text-sm font-semibold text-white">
            {notification.title}
          </p>
          <p className="mt-1 text-sm text-[#dcd0ff] line-clamp-2">
            {notification.description}
          </p>
          {canNavigate && (
            <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#c4b1ff]">
              Ver conversa
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          aria-label="Fechar notificação"
          className="rounded-full p-1 text-[#c5b5e9] transition hover:text-white"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      'useNotifications precisa ser utilizado dentro de NotificationProvider'
    );
  }
  return ctx;
};


