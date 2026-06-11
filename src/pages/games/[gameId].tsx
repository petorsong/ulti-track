import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Stack, Typography } from '@mui/joy';
import { fetchJson } from '@/lib/fetchJson';
import { COL_STACK_STYLES } from '@/utils';

export default function LegacyGamePage() {
  const router = useRouter();
  const gameId = router.query.gameId as string;
  const [message, setMessage] = useState('Loading…');
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    fetchJson<{ game: { teamId: string; isComplete: boolean }; lastPoint?: { isActive: boolean } }>(
      `/api/games/${gameId}`
    )
      .then((data) => {
        setTeamId(data.game.teamId);
        if (data.game.isComplete) {
          router.replace(`/games/${gameId}/summary`);
          return;
        }
        if (data.lastPoint?.isActive) {
          setMessage(
            'This game has an active point from the previous online tracker. Finish or clear it in the database, or use the team page for offline tracking.'
          );
        } else {
          router.replace(`/teams/${data.game.teamId}`);
        }
      })
      .catch(() => {
        setMessage('Game not found. Start a new game from your team page.');
      });
  }, [gameId, router]);

  return (
    <Stack {...COL_STACK_STYLES} spacing={2} sx={{ p: 2 }}>
      <Typography>{message}</Typography>
      {teamId && (
        <Button onClick={() => router.push(`/teams/${teamId}`)}>Go to team page</Button>
      )}
    </Stack>
  );
}
