import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button, Stack, Typography } from '@mui/joy';
import { fetchJson } from '@/lib/fetchJson';
import { COL_STACK_STYLES } from '@/utils';

export default function LegacyPointPage() {
  const router = useRouter();
  const pointId = router.query.pointId as string;
  const [message, setMessage] = useState('Loading…');
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    fetchJson<{ game: { id: string; teamId: string } }>(`/api/points/${pointId}`)
      .then((data) => {
        setTeamId(data.game.teamId);
        setMessage(
          'Live point tracking has moved to offline draft mode. Use the team page to start or resume a game.'
        );
      })
      .catch(() => {
        setMessage('Point not found.');
      });
  }, [pointId, router]);

  return (
    <Stack {...COL_STACK_STYLES} spacing={2} sx={{ p: 2 }}>
      <Typography>{message}</Typography>
      {teamId && (
        <Button onClick={() => router.push(`/teams/${teamId}`)}>Go to team page</Button>
      )}
    </Stack>
  );
}
