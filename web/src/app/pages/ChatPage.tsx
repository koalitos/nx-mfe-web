
  useEffect(() => {
    if (!selectedRoomIdentifier || notifications.length === 0) {
      return;
    }
    const latest = notifications[0];
    const data = (latest.data ?? {}) as any;
    if (latest.category === 'chat' && data.roomId === selectedRoomIdentifier && data.message) {
      appendMessage(data.message as ChatMessage);
    }
  }, [notifications, selectedRoomIdentifier, appendMessage]);
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  chatApi,
  ChatMessage,
  ChatParticipant,
  ChatRoomSummary,
} from '../services/chatApi';
import { HttpError } from '../services/httpClient';
import { supabaseClient } from '../services/supabaseClient';
import { useNotifications } from '../notifications/NotificationProvider';

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('pt-BR', { hour12: false });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('pt-BR', { hour12: false });

const getRoomTimestamp = (room: ChatRoomSummary) => {
  const updated = new Date(room.updatedAt ?? room.createdAt).getTime();
  const lastMessageTime = room.lastMessage
    ? new Date(room.lastMessage.createdAt).getTime()
    : 0;
  return Math.max(updated, lastMessageTime);
};

const MESSAGE_PAGE_SIZE = 100;
const MAX_MESSAGE_LENGTH = 600;

const sortRooms = (entries: ChatRoomSummary[]) =>
  [...entries].sort((a, b) => getRoomTimestamp(b) - getRoomTimestamp(a));

const sortMessages = (entries: ChatMessage[]) =>
  [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

const NoPermission = () => (
  <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
    Voce precisa da role <strong>dashboard.chat</strong> para acessar o modulo
    colaborativo.
  </p>
);

const getPeerParticipant = (
  room: ChatRoomSummary,
  mySupabaseId: string | null
): ChatParticipant | null => {
  if (room.participants.length === 0) {
    return null;
  }
  if (!mySupabaseId) {
    return room.participants[0];
  }
  return (
    room.participants.find(
      (participant) => participant.supabaseUserId !== mySupabaseId
    ) ?? room.participants[0]
  );
};

export const ChatPage = () => {
  const { canAccessPage, profile, user } = useAuth();
  const allowed = canAccessPage('dashboard.chat');
  const { subscribeRoom } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const roomQuery = searchParams.get('room');

  const clearRoomQuery = useCallback(() => {
    if (!roomQuery) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete('room');
    setSearchParams(next, { replace: true });
  }, [roomQuery, searchParams, setSearchParams]);

  const mySupabaseId = profile?.supabaseUserId ?? user?.id ?? null;
  const myHandle = profile?.handle ? `@${profile.handle}` : 'sem handle';

  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStartingDirect, setIsStartingDirect] = useState(false);
  const [composer, setComposer] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messageListRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  const directPeer = useMemo(() => {
    if (!selectedRoom || selectedRoom.type !== 'DIRECT') {
      return null;
    }
    return getPeerParticipant(selectedRoom, mySupabaseId);
  }, [selectedRoom, mySupabaseId]);

  const directRooms = rooms.filter((room) => room.type === 'DIRECT');

  const selectedRoomIdentifier = selectedRoom?.id ?? selectedRoomId;
  const selectedRoomType = selectedRoom?.type ?? null;
  
  // Listen to global notifications for realtime updates
  const { notifications } = useNotifications();

  const getRoomDisplayName = useCallback(
    (room: ChatRoomSummary) => {
      if (room.type === 'DIRECT') {
        const peer = getPeerParticipant(room, mySupabaseId);
        if (peer?.displayName) {
          return peer.displayName;
        }
        if (peer?.handle) {
          return `@${peer.handle}`;
        }
        return 'Conversa direta';
      }
      return room.name || 'Sala sem nome';
    },
    [mySupabaseId]
  );

  const getRoomSubtitle = useCallback(
    (room: ChatRoomSummary) => {
      if (room.type === 'DIRECT') {
        const peer = getPeerParticipant(room, mySupabaseId);
        if (peer?.handle) {
          return `@${peer.handle}`;
        }
        return 'Handle pendente';
      }
      return `${room.participants.length} participantes`;
    },
    [mySupabaseId]
  );

  const upsertRoom = useCallback(
    (roomSummary: ChatRoomSummary) => {
      setRooms((current) => {
        const exists = current.some((room) => room.id === roomSummary.id);
        if (!exists) {
          subscribeRoom(roomSummary);
        }
        const merged = exists
          ? current.map((room) =>
              room.id === roomSummary.id ? { ...room, ...roomSummary } : room
            )
          : [...current, roomSummary];
        return sortRooms(merged);
      });
    },
    [subscribeRoom]
  );

  const appendMessage = useCallback((incoming: ChatMessage) => {
    setMessages((current) => {
      if (current.some((message) => message.id === incoming.id)) {
        return current;
      }
      return sortMessages([...current, incoming]);
    });
    setRooms((current) =>
      sortRooms(
        current.map((room) =>
          room.id === incoming.roomId
            ? {
                ...room,
                lastMessage: incoming,
                updatedAt: incoming.createdAt,
              }
            : room
        )
      )
    );
  }, []);

  useEffect(() => {
    if (!allowed) {
      setIsLoadingRooms(false);
      return;
    }

    let isMounted = true;
    setIsLoadingRooms(true);

    chatApi
      .listRooms()
      .then((response) => {
        if (!isMounted) {
          return;
        }
        const ordered = sortRooms(response);
        setRooms(ordered);
        setSelectedRoomId((current) => {
          const hasCurrent =
            current && ordered.some((room) => room.id === current);
          const queryMatch =
            roomQuery &&
            ordered.find((room) => room.id === roomQuery)?.id;
          if (queryMatch) {
            return queryMatch;
          }
          if (hasCurrent) {
            return current;
          }
          return ordered[0]?.id ?? null;
        });
        if (roomQuery && ordered.some((room) => room.id === roomQuery)) {
          clearRoomQuery();
        }
        ordered.forEach(subscribeRoom);
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        console.error(err);
        setError('Nao foi possivel carregar as salas.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRooms(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [allowed, roomQuery, subscribeRoom, clearRoomQuery]);

  useEffect(() => {
    if (!selectedRoomIdentifier) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);

    const load = async () => {
      try {
        let response: ChatMessage[];
        if (selectedRoomType === 'DIRECT' && selectedDirectHandle) {
          response = await chatApi.getDirectMessages(selectedDirectHandle, {
            limit: MESSAGE_PAGE_SIZE,
          });
        } else {
          response = await chatApi.getMessages(selectedRoomIdentifier, {
            limit: MESSAGE_PAGE_SIZE,
          });
        }
        if (!isMounted) {
          return;
        }
        setMessages(sortMessages(response));
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error(err);
        setError('Nao foi possivel carregar as mensagens.');
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [selectedRoomIdentifier, selectedRoomType, selectedDirectHandle]);

  useEffect(() => {
    if (!selectedRoomIdentifier) {
      if (channelRef.current) {
        void channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      return;
    }

    const channel = supabaseClient
      .channel(`chat.room.${selectedRoomIdentifier}`)
      .on('broadcast', { event: 'chat.message' }, ({ payload }) => {
        appendMessage(payload as ChatMessage);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [selectedRoomIdentifier, appendMessage]);

  useEffect(() => {
    if (!messageListRef.current) {
      return;
    }
    messageListRef.current.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, selectedRoomId]);

  const handleStartDirectChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const targetHandle = handleInput.trim();
    if (!targetHandle) {
      setError('Informe um handle destino.');
      return;
    }

    setError(null);
    setIsStartingDirect(true);
    try {
      const room = await chatApi.startDirectChat(targetHandle);
      upsertRoom(room);
      subscribeRoom(room);
      setSelectedRoomId(room.id);
      setHandleInput('');
      setFeedback(
        `Conversa direta pronta com ${getRoomDisplayName(room)}.`
      );
    } catch (err) {
      console.error(err);
      if (err instanceof HttpError) {
        setError(
          (err.payload as { message?: string })?.message ??
            'Nao foi possivel iniciar a conversa direta.'
        );
      } else {
        setError('Nao foi possivel iniciar a conversa direta.');
      }
    } finally {
      setIsStartingDirect(false);
    }
  };

  const sendMessage = useCallback(async () => {
    if (!selectedRoom || isSending) {
      return;
    }

    const content = composer.trim();
    if (!content) {
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      let sent: ChatMessage;
      if (selectedRoom.type === 'DIRECT' && directPeer?.handle) {
        sent = await chatApi.sendDirectMessage(directPeer.handle, { content });
      } else {
        sent = await chatApi.sendMessage(selectedRoom.id, { content });
      }
      appendMessage(sent);
      setComposer('');
    } catch (err) {
      console.error(err);
      if (err instanceof HttpError) {
        setError(
          (err.payload as { message?: string })?.message ??
            'Nao foi possivel enviar a mensagem.'
        );
      } else {
        setError('Nao foi possivel enviar a mensagem.');
      }
    } finally {
      setIsSending(false);
    }
  }, [appendMessage, composer, directPeer, isSending, selectedRoom]);

  const handleSendMessage = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await sendMessage();
    },
    [sendMessage]
  );

  if (!allowed) {
    return (
      <div className="space-y-4">
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-[#d3a6ff]">
            Chat seguro
          </p>
          <h1 className="text-3xl font-semibold text-white">
            Conversas e squads
          </h1>
          <p className="mt-2 text-sm text-[#c5b5e9]">
            Apenas perfis com a role dashboard.chat conseguem acessar esta
            experiencia.
          </p>
        </header>
        <NoPermission />
      </div>
    );
  }

  return (
    <div className="flex h-[720px] rounded-3xl border border-[#4b1d7a]/60 bg-gradient-to-br from-[#120024] via-[#1a0037] to-[#080014] text-[#f3eaff] shadow-[0_40px_150px_-60px_rgba(122,35,220,0.8)]">
      <aside className="flex w-80 flex-col border-r border-[#2a0a49]/70 bg-[#160026]/80">
        <div className="flex items-center gap-3 border-b border-[#2a0a49]/70 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#a855f7] to-[#7c3aed] text-lg font-semibold text-white">
            {(profile?.displayName ?? user?.email ?? 'U')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {profile?.displayName ?? user?.email ?? 'Usuario autenticado'}
            </p>
            <p className="text-xs text-[#d7c7ff]">{myHandle}</p>
          </div>
        </div>

        <form
          className="space-y-3 border-b border-[#2a0a49]/70 px-5 py-4"
          onSubmit={handleStartDirectChat}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-[#b696ff]">
            Mensagem direta
          </p>
          <div className="space-y-2">
            <label className="text-xs text-[#d7c7ff]">Handle destino</label>
            <input
              type="text"
              value={handleInput}
              onChange={(event) => setHandleInput(event.target.value)}
              placeholder="@squad.lead"
              className="w-full rounded-lg border border-transparent bg-[#1e0532]/70 px-3 py-2 text-sm text-white outline-none transition focus:border-[#a855f7] focus:bg-[#22063a]"
            />
          </div>
          <button
            type="submit"
            disabled={isStartingDirect}
            className="w-full rounded-lg bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a855f7] py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStartingDirect ? 'Conectando...' : 'Iniciar conversa'}
          </button>
          {feedback && (
            <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
              {feedback}
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          )}
        </form>

        <div className="scroll-purple flex-1 overflow-y-auto px-4 py-4">
          <SectionChannels
            title="Diretas"
            emptyLabel="Nenhuma conversa iniciada."
            isLoading={isLoadingRooms}
            rooms={directRooms}
            selectedRoomId={selectedRoomId}
            onSelect={setSelectedRoomId}
            renderName={getRoomDisplayName}
            renderSubtitle={getRoomSubtitle}
          />
        </div>
      </aside>

      <section className="flex flex-1 flex-col bg-[#0d0118]/80">
        {selectedRoom ? (
          <>
            <header className="flex items-center justify-between border-b border-[#2a0a49]/70 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#b696ff]">
                  {selectedRoom.type === 'DIRECT' ? 'Mensagem direta' : 'Grupo'}
                </p>
                <div className="mt-1 flex items-center gap-3 text-white">
                  <h2 className="text-2xl font-semibold">
                    {getRoomDisplayName(selectedRoom)}
                  </h2>
                  {selectedRoom.type !== 'DIRECT' && (
                    <span className="rounded-full border border-[#3a0b59]/60 px-3 py-0.5 text-xs text-[#d7c7ff]">
                      {selectedRoom.participants.length} membros
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#ad9fe0]">
                  Ultima atividade:{' '}
                  {formatDateTime(
                    selectedRoom.lastMessage?.createdAt ??
                      selectedRoom.updatedAt ??
                      selectedRoom.createdAt
                  )}
                </p>
              </div>
            </header>

            <div
              ref={messageListRef}
              className="scroll-purple flex-1 overflow-y-auto bg-gradient-to-b from-[#120024] via-[#10001e] to-[#07000f] px-8 py-6"
            >
              {isLoadingMessages ? (
                <p className="text-sm text-[#d7c7ff]">Carregando historico...</p>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-sm text-[#d7c7ff]">
                  <p>Nenhuma mensagem por aqui.</p>
                  <p>Envie algo utilizando o campo abaixo.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isSelf =
                      message.senderUserId === (mySupabaseId ?? user?.id ?? '');
                    const displayName = isSelf
                      ? profile?.displayName ?? user?.email ?? 'Voce'
                      : getRoomDisplayName(selectedRoom);
                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-3 text-sm text-[#f5ebff] ${
                          isSelf ? 'flex-row-reverse text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs uppercase text-white ${
                            isSelf
                              ? 'bg-gradient-to-br from-[#a855f7] to-[#7c3aed]'
                              : 'bg-[#2a0a49]/80'
                          }`}
                        >
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div
                          className={`flex max-w-3xl flex-col rounded-2xl px-4 py-2 shadow-lg ${
                            isSelf
                              ? 'bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white'
                              : index % 2 === 0
                                ? 'bg-[#1b062e]/80 text-[#f3eaff]'
                                : 'bg-[#220538]/80 text-[#f3eaff]'
                          }`}
                        >
                          <p className="text-xs font-semibold text-[#e4d4ff]">
                            {displayName}
                          </p>
                          <p className="whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#d4c6ff]">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form
              className="border-t border-[#2a0a49]/70 bg-[#0f021a] px-6 py-4"
              onSubmit={handleSendMessage}
            >
              <div className="rounded-2xl border border-[#3a0b59]/60 bg-[#150225]/80">
                <textarea
                  value={composer}
                  onChange={(event) =>
                    setComposer(event.target.value.slice(0, MAX_MESSAGE_LENGTH))
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      event.shiftKey &&
                      !event.isComposing
                    ) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  maxLength={MAX_MESSAGE_LENGTH}
                  placeholder="Escreva sua mensagem..."
                  className="min-h-[90px] w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-sm text-white outline-none"
                />
                <div className="flex items-center justify-between border-t border-[#2a0a49]/70 px-4 py-2 text-xs text-[#cdb7ff]">
                  <span>Shift + Enter também envia</span>
                  <span>
                    {composer.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <div className="flex items-center justify-end border-t border-[#2a0a49]/70 px-4 py-3">
                  <button
                    type="submit"
                    disabled={!composer.trim() || isSending}
                    className="rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#a855f7] px-6 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#110022] text-center text-[#d7c7ff]">
            <p className="text-lg font-semibold text-white">
              Nenhuma conversa selecionada
            </p>
            <p className="text-sm">
              Escolha um chat na barra lateral ou inicie uma conversa direta
              usando o handle da pessoa.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

const SectionChannels = ({
  title,
  emptyLabel,
  isLoading,
  rooms,
  selectedRoomId,
  onSelect,
  renderName,
  renderSubtitle,
}: {
  title: string;
  emptyLabel: string;
  isLoading: boolean;
  rooms: ChatRoomSummary[];
  selectedRoomId: string | null;
  onSelect(roomId: string): void;
  renderName(room: ChatRoomSummary): string;
  renderSubtitle(room: ChatRoomSummary): string;
}) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <p className="text-xs uppercase tracking-[0.4em] text-[#b696ff]">
        {title}
      </p>
      <span className="text-xs text-[#9275d8]">{rooms.length}</span>
    </div>
    {isLoading ? (
      <p className="text-xs text-[#d7c7ff]">Carregando...</p>
    ) : rooms.length === 0 ? (
      <p className="text-xs text-[#9275d8]">{emptyLabel}</p>
    ) : (
      <ul className="space-y-1">
        {rooms.map((room) => {
          const isActive = room.id === selectedRoomId;
          return (
            <li key={room.id}>
              <button
                type="button"
                onClick={() => onSelect(room.id)}
                className={`flex w-full flex-col rounded-xl px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? 'bg-[#2b0a43]/80 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    : 'text-[#e3d6ff] hover:bg-[#1d0530]'
                }`}
              >
                <span className="font-semibold">{renderName(room)}</span>
                <span className="text-xs text-[#cdb7ff]">
                  {renderSubtitle(room)}
                </span>
                {room.lastMessage && (
                  <span className="mt-1 line-clamp-1 text-[11px] text-[#9a80d8]">
                    {room.lastMessage.content}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);




