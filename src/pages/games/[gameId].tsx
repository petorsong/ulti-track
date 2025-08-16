import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { Game, Player, PlayerWithLineCount, TeamGroup } from '@/database/schema';
import { Box, Button, Stack, Typography } from '@mui/joy';
import { PlayerButton, PointCard } from '@/components';
import { calculatePointInfo, colStackStyles, handleEndHalfButtonClick, splitPlayersByGenderMatch } from '@/utils';
import GroupRemove from '@mui/icons-material/GroupRemove';
import Group from '@mui/icons-material/Group';
import PlayCircleFilledOutlined from '@mui/icons-material/PlayCircleFilledOutlined';

export default function GamePage() {
  const router = useRouter();
  const gameId = router.query.gameId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [saveFrom, setSaveFrom] = useState('');

  const [pointInfo, setPointInfo] = useState({
    vsTeamName: '',
    teamScore: 0,
    vsTeamScore: 0,
    oOrD: '',
    genderRatio: '',
    fieldSide: '',
    isFirstHalf: true,
  });
  const [halftimeAt, setHalftimeAt] = useState(null as number | null);
  const [playersL, setPlayersL] = useState([] as Player[]);
  const [playersR, setPlayersR] = useState([] as Player[]);
  const [playerLimitL, setPlayerLimitL] = useState(0); // TODO: can pull from pointInfo?
  const [playerLimitR, setPlayerLimitR] = useState(0);
  const [selectedPlayersL, setSelectedPlayersL] = useState([] as string[]);
  const [selectedPlayersR, setSelectedPlayersR] = useState([] as string[]);
  const [teamGroups, setTeamGroups] = useState([] as TeamGroup[]);

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/games/${gameId}`)
      .then((res) => res.json())
      .then((data) => {
        const gameData = data.game as Game;
        const playersData = data.players as PlayerWithLineCount[];
        const teamGroupsData = data.teamGroups as TeamGroup[];

        setTeamGroups(teamGroupsData);
        setHalftimeAt(gameData.halftimeAt);

        const pointInfo = calculatePointInfo(gameData);
        setPointInfo({ ...gameData, ...pointInfo });
        setPlayerLimitL(pointInfo.playerLimitL);
        setPlayerLimitR(pointInfo.playerLimitR);

        const { playersL, playersR } = splitPlayersByGenderMatch(playersData);
        setPlayersL(playersL);
        setPlayersR(playersR);

        setIsLoading(false);
      });
  }, [gameId, router.isReady]);

  const handleClearButtonClick = () => {
    setSelectedPlayersL([]);
    setSelectedPlayersR([]);
  };

  const handleSubmitButtonClick = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    setSaveFrom('START_POINT');
    const res = await fetch(`/api/games/${gameId}/point`, {
      method: 'POST',
      body: JSON.stringify({ gameId, playerIds: selectedPlayersL.concat(selectedPlayersR) }),
    });
    const { pointId } = await res.json();
    router.push(`/points/${pointId}`);
  };

  return (
    !isLoading && (
      <Stack direction="column" spacing={1} sx={{ ...colStackStyles, mt: 1 }}>
        <PointCard {...pointInfo} />
        <Typography level="title-sm" sx={{ mb: 2 }}>
          Select players for the CURRENT line:
        </Typography>
        {teamGroups.map((teamGroup) => (
          <Box key={teamGroup.id} sx={{ width: '100%' }}>
            <Typography level="title-sm" justifySelf="center" startDecorator={<Group />} sx={{ mb: 1 }}>
              {teamGroup.name}
            </Typography>
            <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
              {[playersL, playersR].map((playerList, i) => (
                <Stack key={`playerList${i}`} direction="column" spacing={1} sx={colStackStyles}>
                  {playerList
                    .filter((player) => player.teamGroupId == teamGroup.id)
                    .map((player) => {
                      const selectedList = i == 0 ? selectedPlayersL : selectedPlayersR;
                      const playerLimit = i == 0 ? playerLimitL : playerLimitR;
                      const selectFunc = i == 0 ? setSelectedPlayersL : setSelectedPlayersR;
                      const playerSelected = selectedList.includes(player.id);
                      return (
                        <PlayerButton
                          key={player.id}
                          variant={playerSelected ? 'solid' : 'soft'}
                          disabled={selectedList.length >= playerLimit && !playerSelected}
                          onClick={() =>
                            selectFunc(
                              playerSelected
                                ? selectedList.filter((p) => p != player.id)
                                : selectedList.concat(player.id)
                            )
                          }
                          {...player}
                        />
                      );
                    })}
                </Stack>
              ))}
            </Stack>
          </Box>
        ))}
        <Stack direction="row" sx={{ justifyContent: 'space-between', width: '95%' }}>
          <Button
            variant="soft"
            color="neutral"
            loading={saveFrom == 'HALFTIME'}
            onClick={(e) => {
              setSaveFrom('HALFTIME');
              handleEndHalfButtonClick(e, gameId, router, setPointInfo);
            }}
          >
            {halftimeAt ? 'End Game' : 'Halftime'}
          </Button>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" endDecorator={<GroupRemove />} onClick={handleClearButtonClick}>
              Clear Line
            </Button>
            <Button
              endDecorator={<PlayCircleFilledOutlined />}
              loading={saveFrom == 'START_POINT'}
              disabled={selectedPlayersL.length + selectedPlayersR.length < 7}
              onClick={handleSubmitButtonClick}
            >
              Start Point
            </Button>
          </Stack>
        </Stack>
      </Stack>
    )
  );
}
