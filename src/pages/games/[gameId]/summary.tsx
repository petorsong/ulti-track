import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/joy';
import { games, players, PlayerWithLineCountType } from '@/database/schema';
import { colStackStyles, splitPlayersByGenderMatch } from '@/utils';
import PlayerButton from '@/components/PlayerButton';

// TODO LATER: this can be a static server rendered page (for COMPLETED games)
export default function GameSummaryPage() {
  const router = useRouter();
  const gameId = router.query.gameId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [scoreInfo, setScoreInfo] = useState({
    vsTeamName: '',
    teamScore: 0,
    vsTeamScore: 0,
  });
  const [playersL, setPlayersL] = useState([] as (typeof players.$inferSelect)[]);
  const [playersR, setPlayersR] = useState([] as (typeof players.$inferSelect)[]);

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/games/${gameId}`)
      .then((res) => res.json())
      .then((data) => {
        const gameData = data.gameData as typeof games.$inferSelect;
        const playersData = data.playersData as PlayerWithLineCountType[];

        const { vsTeamName, teamScore, vsTeamScore } = gameData;
        setScoreInfo({ vsTeamName, teamScore, vsTeamScore });

        const { playersL, playersR } = splitPlayersByGenderMatch(playersData);
        setPlayersL(playersL);
        setPlayersR(playersR);

        setIsLoading(false);
      });
  }, [gameId, router.isReady]);

  return (
    !isLoading && (
      <Stack direction="column" spacing={1} sx={{ ...colStackStyles, mt: 1 }}>
        <Box
          sx={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Typography level="body-sm" color="neutral">
            Final Score vs {scoreInfo.vsTeamName}
          </Typography>
          <Typography
            level="h1"
            sx={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              lineHeight: 1,
            }}
          >
            {scoreInfo.teamScore}-{scoreInfo.vsTeamScore}
          </Typography>
        </Box>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          <Stack direction="column" spacing={1} sx={colStackStyles}>
            {/* .toSorted((a, b) => b.lineCount - a.lineCount) */}
            {playersL.map((player) => (
              <PlayerButton key={player.id} variant="soft" onClick={() => {}} {...player} />
            ))}
          </Stack>
          <Stack direction="column" spacing={1} sx={colStackStyles}>
            {/* .toSorted((a, b) => b.lineCount - a.lineCount) */}
            {playersR.map((player) => (
              <PlayerButton key={player.id} variant="soft" onClick={() => {}} {...player} />
            ))}
          </Stack>
        </Stack>
      </Stack>
    )
  );
}
