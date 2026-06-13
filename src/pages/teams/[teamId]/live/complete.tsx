import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Card, CardContent, Stack, Typography } from '@mui/joy';
import { UndoButton } from '@/components';
import { useDraftGame } from '@/hooks/useDraftGame';
import { buildCompleteGamePayload, getUndoLabel } from '@/lib/draftGame';
import { COL_STACK_STYLES } from '@/utils';

export default function LiveCompletePage() {
  const router = useRouter();
  const teamId = router.query.teamId as string;
  const { isHydrated, draft, undo, lastAction, canUndo, discardDraft } = useDraftGame(teamId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !isHydrated) {
      return;
    }
    if (!draft) {
      router.replace(`/teams/${teamId}`);
      return;
    }
    if (draft.phase !== 'complete') {
      router.replace(draft.phase === 'point' ? `/teams/${teamId}/live/point` : `/teams/${teamId}/live`);
    }
  }, [router, teamId, isHydrated, draft]);

  if (!isHydrated || !draft) {
    return null;
  }

  const undoLabel = lastAction
    ? getUndoLabel(lastAction, draft.rosterSnapshot.players, { variant: 'button' })
    : 'Undo';

  const handleUndo = () => {
    const undone = undo();
    if (!undone) {
      return;
    }
    if (undone.type === 'END_GAME' || undone.type === 'END_POINT') {
      router.push(undone.type === 'END_POINT' ? `/teams/${teamId}/live/point` : `/teams/${teamId}/live`);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    const payload = buildCompleteGamePayload(draft);
    try {
      const res = await fetch(`/api/teams/${teamId}/game/complete`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.missingPlayerIds?.length) {
          setSubmitError(`Unknown players: ${data.missingPlayerIds.join(', ')}`);
        } else {
          setSubmitError(data.error ?? 'Submit failed');
        }
        return;
      }
      discardDraft();
      router.push(`/games/${data.gameId}/summary`);
    } catch {
      setSubmitError('Network error — try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack {...COL_STACK_STYLES} spacing={2} sx={{ mt: 2, px: 1 }}>
      <Card variant="outlined" sx={{ width: '95%' }}>
        <CardContent>
          <Typography level="title-lg">Game complete</Typography>
          <Typography level="h2" sx={{ my: 2 }}>
            {draft.teamScore} – {draft.vsTeamScore} vs {draft.setup.vsTeamName}
          </Typography>
          <Typography level="body-md" sx={{ mb: 2 }}>
            Submit to save stats to the server.
          </Typography>
          {submitError && (
            <Typography level="body-sm" color="danger" sx={{ mb: 2 }}>
              {submitError}
            </Typography>
          )}
          <Stack direction="row" spacing={1}>
            <UndoButton canUndo={canUndo} label={undoLabel} onUndo={handleUndo} />
            <Button size="lg" fullWidth loading={isSubmitting} onClick={handleSubmit}>
              Submit
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
