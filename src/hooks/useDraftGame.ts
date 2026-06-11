import { useCallback, useEffect, useState } from 'react';
import {
  applyDispatch,
  clearDraftFromStorage,
  lastUndoableAction,
  loadDraftFromStorage,
  persistDraftToStorage,
  undoAction,
  type DraftDispatchAction,
  type DraftGame,
  type PersistResult,
} from '@/lib/draftGame';

export function useDraftGame(teamId: string | undefined) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [draft, setDraft] = useState<DraftGame | null>(null);
  const [loadStatus, setLoadStatus] = useState<'ok' | 'missing' | 'incompatible' | 'invalid'>('missing');
  const [persistError, setPersistError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      return;
    }
    const result = loadDraftFromStorage(teamId);
    if (result.status === 'ok') {
      setDraft(result.draft);
      setLoadStatus('ok');
    } else {
      setLoadStatus(result.status === 'incompatible' ? 'incompatible' : result.status);
    }
    setIsHydrated(true);
  }, [teamId]);

  const persist = useCallback((next: DraftGame): PersistResult => {
    const result = persistDraftToStorage(next);
    if (!result.ok) {
      setPersistError(result.message);
    } else {
      setPersistError(null);
      setDraft(next);
    }
    return result;
  }, []);

  const dispatch = useCallback(
    (action: DraftDispatchAction): DraftGame | null => {
      if (!draft) {
        return null;
      }
      const next = applyDispatch(draft, action);
      persist(next);
      return next;
    },
    [draft, persist]
  );

  const undo = useCallback(() => {
    if (!draft) {
      return null;
    }
    const undone = lastUndoableAction(draft);
    if (!undone) {
      return null;
    }
    const next = undoAction(draft);
    persist(next);
    return undone;
  }, [draft, persist]);

  const setDraftAndPersist = useCallback(
    (next: DraftGame) => {
      persist(next);
      setLoadStatus('ok');
    },
    [persist]
  );

  const discardDraft = useCallback(() => {
    if (!teamId) {
      return;
    }
    clearDraftFromStorage(teamId);
    setDraft(null);
    setLoadStatus('missing');
  }, [teamId]);

  const lastAction = draft ? lastUndoableAction(draft) : null;

  return {
    isHydrated,
    draft,
    loadStatus,
    persistError,
    dispatch,
    undo,
    setDraftAndPersist,
    discardDraft,
    lastAction,
    canUndo: !!lastAction,
  };
}
