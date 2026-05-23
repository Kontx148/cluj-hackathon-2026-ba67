import axios from 'axios';
import { config } from './config';

export interface BroadcastResult<T> {
  url: string;
  ok: boolean;
  data?: T;
  error?: string;
}

async function postOne<T>(url: string, path: string, body: unknown): Promise<BroadcastResult<T>> {
  try {
    const res = await axios.post(`${url}${path}`, body, { timeout: 5000 });
    return { url, ok: true, data: res.data as T };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { url, ok: false, error: `POST ${url}${path}: ${msg}` };
  }
}

async function getOne<T>(url: string, path: string): Promise<BroadcastResult<T>> {
  try {
    const res = await axios.get(`${url}${path}`, { timeout: 5000 });
    return { url, ok: true, data: res.data as T };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { url, ok: false, error: `GET ${url}${path}: ${msg}` };
  }
}

export async function broadcastPost<T>(
  path: string,
  body: unknown,
): Promise<BroadcastResult<T>[]> {
  return Promise.all(config.validatorUrls.map((u) => postOne<T>(u, path, body)));
}

export async function broadcastGet<T>(path: string): Promise<BroadcastResult<T>[]> {
  return Promise.all(config.validatorUrls.map((u) => getOne<T>(u, path)));
}
