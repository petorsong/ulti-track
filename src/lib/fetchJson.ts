import type { ApiError } from '@/types';

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data: unknown = await res.json();
  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as ApiError).error === 'string'
        ? (data as ApiError).error
        : res.statusText;
    throw new Error(message);
  }
  return data as T;
}
