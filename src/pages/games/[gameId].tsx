import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { games, players, PlayerWithLineCountType } from '@/database/schema'
import { Button, Stack, Typography } from '@mui/joy';
import PlayerButton from '@/components/PlayerButton';
import PointCard from '@/components/PointCard';
import { calculatePointInfo, colStackStyles, splitPlayersByGenderMatch } from '@/utils';

export default function GamePage() {
  const router = useRouter();
  const { gameId } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [pointInfo, setPointInfo] = useState({
    vsTeamName: '',
    teamScore: 0,
    vsTeamScore: 0,
    oOrD: '',
    genderRatio: '',
    fieldSide: '',
  });
  const [playersL, setPlayersL] = useState([] as typeof players.$inferSelect[]);
  const [playersR, setPlayersR] = useState([] as typeof players.$inferSelect[]);
  const [playerLimitL, setPlayerLimitL] = useState(0);
  const [playerLimitR, setPlayerLimitR] = useState(0);
  const [selectedPlayersL, setSelectedPlayersL] = useState([] as string[]);
  const [selectedPlayersR, setSelectedPlayersR] = useState([] as string[]);

  useEffect(() => {
    fetch(`/api/games/${gameId}`)
      .then(res => res.json())
      .then((data) => {
        const gameData = data.gameData as typeof games.$inferSelect;
        const playersData = data.playersData as PlayerWithLineCountType[];

        const { vsTeamName, teamScore, vsTeamScore } = gameData;
        const {
          genderRatio,
          playerLimitL,
          playerLimitR,
          oOrD,
          fieldSide,
        } = calculatePointInfo(gameData);
        setPointInfo({ vsTeamName: vsTeamName!, teamScore: teamScore!, vsTeamScore: vsTeamScore!, genderRatio, oOrD, fieldSide });
        setPlayerLimitL(playerLimitL);
        setPlayerLimitR(playerLimitR);

         // TODO later: lineCount is being passed silently, match types perhaps
        const { playersL, playersR } = splitPlayersByGenderMatch(playersData);
        setPlayersL(playersL);
        setPlayersR(playersR);
        setIsLoading(false);
      });
  }, [gameId]);

  const handleClearButtonClick = () => {
    setSelectedPlayersL([]);
    setSelectedPlayersR([]);
  }

  const handleSubmitButtonClick = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    const res = await fetch(`/api/games/${gameId}/point`, {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerIds: selectedPlayersL.concat(selectedPlayersR),
      }),
    });
    const { pointId } = await res.json();
    router.push(`/points/${pointId}`);
  }

  return !isLoading && (
    <Stack
      direction="column"
      spacing={1}
      sx={{ ...colStackStyles, mt: 1 }}
    >
      <PointCard {...pointInfo} />
      <Typography level="title-sm" sx={{ mb: 2 }}>
        Select players for this line:
      </Typography>
      <Stack
        direction="row"
        sx={{
          justifyContent: "flex-start",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <Stack
          direction="column"
          spacing={1}
          sx={colStackStyles}
        >
          {playersL.map(player => {
            const playerSelected = selectedPlayersL.includes(player.id);
            return (
              <PlayerButton
                key={player.id}
                variant={playerSelected ? 'solid' : 'soft'}
                disabled={selectedPlayersL.length >= playerLimitL && !playerSelected}
                onClick={() => {
                  setSelectedPlayersL(playerSelected
                    ? selectedPlayersL.filter((p) => p != player.id)
                    : selectedPlayersL.concat(player.id));
                }}
                {...player}
              />
            );
          })}
        </Stack>
        <Stack
          direction="column"
          spacing={1}
          sx={colStackStyles}
        >
          {playersR.map(player => {
            const playerSelected = selectedPlayersR.includes(player.id);
            return (
              <PlayerButton
                key={player.id}
                variant={playerSelected ? 'solid' : 'soft'}
                disabled={selectedPlayersR.length >= playerLimitR && !playerSelected}
                onClick={() => {
                  setSelectedPlayersR(playerSelected
                    ? selectedPlayersR.filter((p) => p != player.id)
                    : selectedPlayersR.concat(player.id));
                }}
                {...player}
              />
            );
          })}
        </Stack>
      </Stack>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          width: "95%",
        }}
      >
        <Button disabled>Halftime</Button>
        <Stack
          direction="row"
          spacing={1}
        >
          <Button
            variant="outlined"
            onClick={handleClearButtonClick}
          >
            Clear Line
          </Button>
          <Button
            disabled={selectedPlayersL.length + selectedPlayersR.length < 7}
            onClick={handleSubmitButtonClick}
          >
            Start Point
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
