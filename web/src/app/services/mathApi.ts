import { apiClient } from './httpClient';

export interface MathPayload {
  a: number;
  b: number;
}

export interface MathResponse {
  result: number;
  logId: string;
  supabaseUserId: string;
  recordedAt: string;
}

export const mathApi = {
  add(payload: MathPayload) {
    return apiClient.post<MathPayload, MathResponse>('/api/math/add', payload);
  },
};
