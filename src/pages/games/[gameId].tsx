import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { Game, PlayerWithCounts, Point, TeamWithTeamGroups } from '@/database/schema';
import { Box, Button, Stack, Typography } from '@mui/joy';
import { PlayerButton, PointCard } from '@/components';
import { fetchJson } from '@/lib/fetchJson';
import {
  calculatePointInfo,
  COL_STACK_STYLES,
  handleEndHalfButtonClick,
  POINT_INFO_DEFAULT,
  splitPlayers,
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
    teamWithGroups: {} as TeamWithTeamGroups,
    players: { left: [] as PlayerWithCounts[], right: [] as PlayerWithCounts[] },
  });

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;

    fetchJson<{
      game: Game;
      team: TeamWithTeamGroups;
      lastPoint?: Point;
      players: PlayerWithCounts[];
    }>(`/api/games/${gameId}`)
      .then((data) => {
        if (cancelled) return;

        if (data.lastPoint?.isActive) {
          router.push(`/points/${data.lastPoint.id}`);
          return;
        }

        const pointInfo = calculatePointInfo(data.game);
        setPointInfo({ ...data.game, ...pointInfo });

        const { playersL, playersR } = splitPlayers(data.players, data.team.type);
        setGameTeamData({
          game: data.game,
          teamWithGroups: data.team,
          players: { left: playersL, right: playersR },
        });
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gameId, router.isReady, router]);

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
        {gameTeamData.teamWithGroups.teamGroups.map((teamGroup) => (
          <Box key={teamGroup.id} sx={{ width: '100%' }}>
            <Typography level="title-sm" justifySelf="center" startDecorator={<Group />} sx={{ mb: 1 }}>
              {teamGroup.name}
            </Typography>
            <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
              {Object.values(gameTeamData.players).map((playerList, i) => {
                const isLeftSide = i === 0;
                const selectedList = isLeftSide ? selectedPlayersL : selectedPlayersR;
                const selectFunc = isLeftSide ? setSelectedPlayersL : setSelectedPlayersR;
                const playerLimit =
                  gameTeamData.teamWithGroups.type === 'Mixed'
                    ? (isLeftSide ? pointInfo.playerLimitL! : pointInfo.playerLimitR!) <= selectedList.length
                    : selectedPlayersL.length + selectedPlayersR.length >= 7;
                const colour = isLeftSide ? 'primary' : 'success';
                return (
                  <Stack key={`playerList${i}`} direction="column" spacing={1} sx={COL_STACK_STYLES}>
                    {playerList
                      .filter((player) => player.teamGroupId == teamGroup.id)
                      .map((player) => {
                        const playerSelected = selectedList.includes(player.id);
                        const lineCount = playerSelected ? player.lineCount + 1 : player.lineCount;
                        return (
                          <PlayerButton
                            key={player.id}
                            variant={playerSelected ? 'solid' : 'soft'}
                            disabled={playerLimit && !playerSelected}
                            onClick={() =>
                              selectFunc(
                                playerSelected
                                  ? selectedList.filter((p) => p != player.id)
                                  : selectedList.concat(player.id)
                              )
                            }
                            {...{ ...player, colour, lineCount }}
                          />
                        );
                      })}
                  </Stack>
                );
              })}
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
