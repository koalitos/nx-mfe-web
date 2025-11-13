import { env } from '../../config/env';
import { apiClient } from './httpClient';

export interface ChatParticipant {
  id: string;
  supabaseUserId: string;
  handle?: string | null;
  displayName?: string | null;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderUserId: string;
  content: string;
  createdAt: string;
}

export interface ChatRoomSummary {
  id: string;
  name: string;
  type?: 'GROUP' | 'DIRECT';
  directKey?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  lastMessage: ChatMessage | null;
}

export interface CreateRoomPayload {
  name: string;
  participantIds: string[];
}

export interface SendMessagePayload {
  content: string;
}

export interface ListMessagesParams {
  limit?: number;
  cursor?: string;
}

const adminHeaders = {
  'x-admin-key': env.adminApiKey,
};

const buildQuery = (params: ListMessagesParams = {}) => {
  const query = new URLSearchParams();
  if (params.limit) {
    query.set('limit', String(params.limit));
  }
  if (params.cursor) {
    query.set('cursor', params.cursor);
  }
  const search = query.toString();
  return search ? `?${search}` : '';
};

const normalizeHandle = (handle: string) =>
  handle.trim().replace(/^@/, '').toLowerCase();

export const chatApi = {
  listRooms() {
    return apiClient.get<ChatRoomSummary[]>('/api/chat/rooms', {
      headers: adminHeaders,
    });
  },
  createRoom(payload: CreateRoomPayload) {
    return apiClient.post<CreateRoomPayload, ChatRoomSummary>(
      '/api/chat/rooms',
      payload,
      {
        headers: adminHeaders,
      }
    );
  },
  getMessages(roomId: string, params: ListMessagesParams = {}) {
    const search = buildQuery(params);
    return apiClient.get<ChatMessage[]>(
      `/api/chat/rooms/${roomId}/messages${search}`,
      {
        headers: adminHeaders,
      }
    );
  },
  sendMessage(roomId: string, payload: SendMessagePayload) {
    return apiClient.post<SendMessagePayload, ChatMessage>(
      `/api/chat/rooms/${roomId}/messages`,
      payload,
      {
        headers: adminHeaders,
      }
    );
  },
  startDirectChat(handle: string) {
    const normalized = encodeURIComponent(normalizeHandle(handle));
    return apiClient.post<Record<string, never>, ChatRoomSummary>(
      `/api/chat/direct/${normalized}`,
      {} as Record<string, never>,
      {
        headers: adminHeaders,
      }
    );
  },
  getDirectMessages(handle: string, params: ListMessagesParams = {}) {
    const normalized = encodeURIComponent(normalizeHandle(handle));
    const search = buildQuery(params);
    return apiClient.get<ChatMessage[]>(
      `/api/chat/direct/${normalized}/messages${search}`,
      {
        headers: adminHeaders,
      }
    );
  },
  sendDirectMessage(handle: string, payload: SendMessagePayload) {
    const normalized = encodeURIComponent(normalizeHandle(handle));
    return apiClient.post<SendMessagePayload, ChatMessage>(
      `/api/chat/direct/${normalized}/messages`,
      payload,
      {
        headers: adminHeaders,
      }
    );
  },
};
