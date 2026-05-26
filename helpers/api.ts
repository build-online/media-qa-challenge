import dotenv from 'dotenv';

dotenv.config();

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

export async function makeApiRequest<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  token: string,
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const baseURL = process.env.BASE_URL || 'https://media.tithelyqa.com';

  const response = await fetch(baseURL + endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json() as T;
  return { data, status: response.status, ok: response.ok };
}
