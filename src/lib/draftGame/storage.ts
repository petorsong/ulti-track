import type { DraftGame } from './types';
import { DRAFT_SCHEMA_VERSION } from './types';
import type { PersistResult } from './types';

export function draftStorageKey(teamId: string): string {
  return `ulti-track:team:${teamId}:draft`;
}

export function rosterStorageKey(teamId: string): string {
  return `ulti-track:team:${teamId}:roster`;
}

export type LoadDraftResult =
  | { status: 'ok'; draft: DraftGame }
  | { status: 'missing' }
  | { status: 'incompatible'; schemaVersion: number }
  | { status: 'invalid' };

export function loadDraftFromStorage(teamId: string): LoadDraftResult {
  if (typeof window === 'undefined') {
    return { status: 'missing' };
  }
  const raw = localStorage.getItem(draftStorageKey(teamId));
  if (!raw) {
    return { status: 'missing' };
  }
  try {
    const parsed = JSON.parse(raw) as DraftGame;
    if (parsed.schemaVersion !== DRAFT_SCHEMA_VERSION) {
      return { status: 'incompatible', schemaVersion: parsed.schemaVersion ?? 0 };
    }
    if (parsed.teamId !== teamId) {
      return { status: 'invalid' };
    }
    return { status: 'ok', draft: parsed };
  } catch {
    return { status: 'invalid' };
  }
}

export function persistDraftToStorage(draft: DraftGame): PersistResult {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'unknown', message: 'Storage unavailable' };
  }
  const payload = { ...draft, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(draftStorageKey(draft.teamId), JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { ok: false, error: 'quota', message: 'Storage full — submit or discard game' };
    }
    return { ok: false, error: 'unknown', message: 'Failed to save game' };
  }
}

export function clearDraftFromStorage(teamId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(draftStorageKey(teamId));
}
