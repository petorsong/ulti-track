import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchJson } from '@/lib/fetchJson';
import { COL_STACK_STYLES, splitPlayers } from '@/utils';
import { Box, Button, Divider, Stack, Typography } from '@mui/joy';
import Save from '@mui/icons-material/Save';
import Group from '@mui/icons-material/Group';
import type { Player, TeamGroup, TeamType, TeamWithPlayers } from '@/database/schema';
import type { PlayerGroup, PlayerIdToTeamGroupId } from '@/types';
import PlayerButton from './PlayerButton';
import BottomDialog from './BottomDialog';

function splitTeamGroups(players: Player[], type: TeamType, teamGroups: TeamGroup[]): PlayerGroup[] {
  return teamGroups.map((teamGroup) => {
    const groupPlayers = players.filter(({ teamGroupId }) => teamGroupId == teamGroup.id);
    const { playersL, playersR } = splitPlayers(groupPlayers, type);
    return { teamGroup, playersL, playersR };
  });
}

export default function EditTeamGroupsModal({ teamGroups }: { teamGroups: TeamGroup[] }) {
  const router = useRouter();
  const teamId = router.query.teamId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const [teamData, setTeamData] = useState({} as TeamWithPlayers);
  const [currentPlayers, setCurrentPlayers] = useState([] as Player[]);
  const [groupedPlayers, setGroupedPlayers] = useState([] as PlayerGroup[]);
  const [selectedPlayers, setSelectedPlayers] = useState([] as string[]);
  const [updatedPlayers, setUpdatedPlayers] = useState([] as PlayerIdToTeamGroupId[]);

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;

    fetchJson<{ team: TeamWithPlayers }>(`/api/teams/${teamId}/players`)
      .then((data) => {
        if (cancelled) return;
        setTeamData(data.team);
        setCurrentPlayers(data.team.players);
        setGroupedPlayers(splitTeamGroups(data.team.players, data.team.type, teamGroups));
      })
      .catch(() => {
        /* keep loading state cleared in finally */
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId, teamGroups, router.isReady]);

  const handleMovePlayers = (teamGroupId: string) => {
    const newUpdatedPlayers = [] as PlayerIdToTeamGroupId[];
    const newCurrentPlayers = currentPlayers.map((player) => {
      const originalPlayer = teamData.players.find((p) => p.id == player.id)!;
      const isSelected = selectedPlayers.includes(player.id);
      const finalTeamGroupId = isSelected ? teamGroupId : player.teamGroupId;

      if (finalTeamGroupId != originalPlayer.teamGroupId) {
        newUpdatedPlayers.push({ playerId: player.id, teamGroupId: finalTeamGroupId });
      }
      return isSelected ? { ...player, teamGroupId: finalTeamGroupId } : player;
    });
    setCurrentPlayers(newCurrentPlayers);
    setUpdatedPlayers(newUpdatedPlayers);
    setGroupedPlayers(splitTeamGroups(newCurrentPlayers, teamData.type, teamGroups));

    setSelectedPlayers([]);
    setMoveModalOpen(false);
  };

  const handleSavePods = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    setIsSaving(true);
    fetch(`/api/teams/${teamId}/groups`, { method: 'POST', body: JSON.stringify(updatedPlayers) }).then(() =>
      router.reload()
    );
  };

  return (
    !isLoading && (
      <Box sx={{ overflow: 'scroll', width: '100%' }}>
        <Stack direction="column" spacing={1} sx={{ ...COL_STACK_STYLES, marginBottom: '36px' }}>
          {groupedPlayers.map((playerGroup) => (
            <Box key={playerGroup.teamGroup.id} sx={{ width: '100%' }}>
              <Typography level="title-sm" justifySelf="center" startDecorator={<Group />} sx={{ mb: 1 }}>
                {playerGroup.teamGroup.name}
              </Typography>
              <Stack direction="row" sx={{ justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%' }}>
                {[playerGroup.playersL, playerGroup.playersR].map((playerList, i) => (
                  <Stack key={`playerList${i}`} direction="column" spacing={1} sx={COL_STACK_STYLES}>
                    {playerList.map((player) => {
                      const playerSelected = selectedPlayers.includes(player.id);
                      return (
                        <PlayerButton
                          key={player.id}
                          variant={
                            playerSelected
                              ? 'solid'
                              : updatedPlayers.find(({ playerId }) => playerId == player.id)
                                ? 'outlined'
                                : 'soft'
                          }
                          colour={i == 0 ? 'primary' : 'success'}
                          onClick={() =>
                            setSelectedPlayers(
                              playerSelected
                                ? selectedPlayers.filter((p) => p != player.id)
                                : selectedPlayers.concat(player.id)
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
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              justifyContent: 'space-between',
              width: '95%',
              height: '36px',
            }}
          >
            <Divider />
            <Button
              variant="soft"
              color="warning"
              sx={{ width: '47.5%' }}
              disabled={selectedPlayers.length == 0}
              onClick={() => setMoveModalOpen(true)}
            >
              Move players
            </Button>
            <BottomDialog
              open={moveModalOpen}
              onClose={() => setMoveModalOpen(false)}
              content={
                <>
                  <Typography id="nested-modal-title" level="h2">
                    Move players to pod:
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row-reverse' } }}>
                    {teamGroups.map((teamGroup) => (
                      <Button
                        key={teamGroup.id}
                        color="primary"
                        variant={teamGroup.name == 'None' ? 'outlined' : 'solid'}
                        onClick={() => handleMovePlayers(teamGroup.id)}
                      >
                        {teamGroup.name}
                      </Button>
                    ))}
                    <Button variant="outlined" color="neutral" onClick={() => setMoveModalOpen(false)}>
                      Cancel
                    </Button>
                  </Box>
                </>
              }
            />
            <Button
              variant="solid"
              color="primary"
              sx={{ width: '47.5%' }}
              startDecorator={<Save />}
              disabled={updatedPlayers.length == 0}
              loading={isSaving}
              onClick={handleSavePods}
            >
              Save pods
            </Button>
          </Stack>
        </Stack>
      </Box>
    )
  );
}
