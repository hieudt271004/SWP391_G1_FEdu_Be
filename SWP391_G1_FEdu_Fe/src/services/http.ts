import type { AxiosResponse } from 'axios';
import { apiClient } from './api.client';
import { extractErrorMessage } from '../utils/apiError';

// BE luôn trả ResponseData: { status, message, data }
async function unwrap<T>(call: Promise<AxiosResponse>): Promise<T> {
  let body: { status?: number; message?: string; data?: T };
  try {
    body = (await call).data;
  } catch (err) {
    throw new Error(extractErrorMessage(err)); 
  }
  if (body && typeof body.status === 'number' && body.status >= 400) {
    throw new Error(body.message || 'Đã có lỗi xảy ra');
  }
  return body?.data as T;
}

export const http = {
  get: <T>(path: string) => unwrap<T>(apiClient.get(path)),
  post: <T>(path: string, body?: unknown) => unwrap<T>(apiClient.post(path, body)),
  put: <T>(path: string, body?: unknown) => unwrap<T>(apiClient.put(path, body)),
  patch: <T>(path: string, body?: unknown) => unwrap<T>(apiClient.patch(path, body)),
  delete: <T>(path: string, body?: unknown) => unwrap<T>(apiClient.delete(path, { data: body })),
};