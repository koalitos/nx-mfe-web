import { env } from '../../config/env';
import { authStorage } from './authStorage';

export class HttpError<T = unknown> extends Error {
  constructor(
    public status: number,
    public payload?: T
  ) {
    super(
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: string }).message)
        : `Request failed with status ${status}`
    );
    this.name = 'HttpError';
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  signal?: AbortSignal;
};

const createHttpClient = (baseUrl: string, authenticateByDefault: boolean) => {
  const request = async <TResponse>(
    path: string,
    options: RequestOptions = {}
  ): Promise<TResponse> => {
    const { method = 'GET', body, headers = {}, signal, auth } = options;

    const shouldAuthorize = auth ?? authenticateByDefault;
    const finalHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers,
    };

    if (body !== undefined && !finalHeaders['Content-Type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    if (shouldAuthorize) {
      const { token } = authStorage.load();
      if (token) {
        finalHeaders.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: finalHeaders,
      signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? (JSON.parse(text) as TResponse) : (null as TResponse);

    if (!response.ok) {
      throw new HttpError(response.status, data);
    }

    return data;
  };

  return {
    request,
    get<TResponse>(path: string, options?: Omit<RequestOptions, 'method'>) {
      return request<TResponse>(path, { ...options, method: 'GET' });
    },
    post<TRequest, TResponse>(
      path: string,
      body: TRequest,
      options?: Omit<RequestOptions, 'method' | 'body'>
    ) {
      return request<TResponse>(path, { ...options, method: 'POST', body });
    },
  };
};

export const apiClient = createHttpClient(env.apiBaseUrl, true);
export const authClient = createHttpClient(env.authBaseUrl, false);
