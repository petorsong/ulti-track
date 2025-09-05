import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { Game, PlayerWithLineCount, Point, TeamGroup } from '@/database/schema';
import { Box, Button, Stack, Typography } from '@mui/joy';
import { PlayerButton, PointCard } from '@/components';
import {
  calculatePointInfo,
  COL_STACK_STYLES,
  handleEndHalfButtonClick,
  POINT_INFO_DEFAULT,
  splitPlayersByGenderMatch,
} from '@/utils';
import GroupRemove from '@mui/icons-material/GroupRemove';
import Group from '@mui/icons-material/Group';
import PlayCircleFilledOutlined from '@mui/icons-material/PlayCircleFilledOutlined';

export default function GamePage() {
  const router = useRouter();
  const gameId = router.query.gameId as string;

  // component mutated state
  const [isLoading, setIsLoading] = useState(true);
  const [saveFrom, setSaveFrom] = useState('');

  const [selectedPlayersL, setSelectedPlayersL] = useState([] as string[]);
  const [selectedPlayersR, setSelectedPlayersR] = useState([] as string[]);

  // read-only data
  const [pointInfo, setPointInfo] = useState(POINT_INFO_DEFAULT);
  const [gameTeamData, setGameTeamData] = useState({
    game: {} as Game,
    teamGroups: [] as TeamGroup[],
    players: { left: [] as PlayerWithLineCount[], right: [] as PlayerWithLineCount[] },
    lastLinePlayerIds: [] as string[],
  });

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/games/${gameId}`)
      .then((res) => res.json())
      .then((data) => {
        const gameData = data.game as Game;
        const lastPointData = data.lastPoint as Point | undefined;
        const teamGroupsData = data.teamGroups as TeamGroup[];
        const playersData = data.players as PlayerWithLineCount[];

        if (lastPointData && lastPointData.isActive) {
          router.push(`/points/${lastPointData.id}`);
        } else {
          const pointInfo = calculatePointInfo(gameData);
          setPointInfo({ ...gameData, ...pointInfo });

          const { playersL, playersR } = splitPlayersByGenderMatch(playersData);
          setGameTeamData({
            game: gameData,
            teamGroups: teamGroupsData,
            players: { left: playersL, right: playersR },
            lastLinePlayerIds: lastPointData ? lastPointData.playerIds : [],
          });

          setIsLoading(false);
        }
      });
  }, [gameId, router]);

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
      <Stack direction="column" spacing={1} sx={{ ...COL_STACK_STYLES, mt: 1 }}>
        <PointCard {...pointInfo} />
        <Typography level="title-sm" sx={{ mb: 2 }}>
          Select players for the CURRENT line:
        </Typography>
        {gameTeamData.teamGroups.map((teamGroup) => (
          <Box key={teamGroup.id} sx={{ width: '100%' }}>
            <Typography level="title-sm" justifySelf="center" startDecorator={<Group />} sx={{ mb: 1 }}>
              {teamGroup.name}
            </Typography>
            <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
              {Object.values(gameTeamData.players).map((playerList, i) => (
                <Stack key={`playerList${i}`} direction="column" spacing={1} sx={COL_STACK_STYLES}>
                  {playerList
                    .filter((player) => player.teamGroupId == teamGroup.id)
                    .map((player) => {
                      const selectedList = i == 0 ? selectedPlayersL : selectedPlayersR;
                      const playerLimit = i == 0 ? pointInfo.playerLimitL : pointInfo.playerLimitR;
                      const selectFunc = i == 0 ? setSelectedPlayersL : setSelectedPlayersR;
                      const playerSelected = selectedList.includes(player.id);
                      const lineCount = playerSelected ? player.lineCount + 1 : player.lineCount;
                      const badgeColour = playerSelected ? (player.isFMP ? 'primary' : 'success') : 'neutral';
                      const badgeVariant = gameTeamData.lastLinePlayerIds.includes(player.id) ? 'solid' : 'outlined';
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
                          badgeColour={badgeColour}
                          badgeVariant={badgeVariant}
                          {...player}
                          lineCount={lineCount}
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
            {gameTeamData.game.halftimeAt ? 'End Game' : 'Halftime'}
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
