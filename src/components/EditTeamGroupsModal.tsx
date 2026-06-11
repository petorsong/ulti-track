import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchJson } from '@/lib/fetchJson';
import { COL_STACK_STYLES, splitPlayers } from '@/utils';
import { Box, Button, Stack, Typography } from '@mui/joy';
import Group from '@mui/icons-material/Group';
import type { Player, TeamGroup, TeamType, TeamWithPlayers } from '@/database/schema';
import type { PlayerGroup } from '@/types';
import PlayerButton from './PlayerButton';
import BottomDialog from './BottomDialog';
import UndoButton from './UndoButton';
import {
  applyRosterMove,
  createRosterCache,
  loadRosterCache,
  persistRosterCache,
  undoRosterMove,
  type RosterCache,
} from '@/lib/rosterCache';

function splitTeamGroups(players: Player[], type: TeamType, teamGroups: TeamGroup[]): PlayerGroup[] {
  return teamGroups.map((teamGroup) => {
    const groupPlayers = players.filter(({ teamGroupId }) => teamGroupId == teamGroup.id);
    const { playersL, playersR } = splitPlayers(groupPlayers, type);
    return { teamGroup, playersL, playersR };
  });
}

export default function EditTeamGroupsModal({
  teamGroups,
  onDone,
}: {
  teamGroups: TeamGroup[];
  onDone: () => void;
}) {
  const router = useRouter();
  const teamId = router.query.teamId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [rosterCache, setRosterCache] = useState<RosterCache | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState([] as string[]);
  const [groupedPlayers, setGroupedPlayers] = useState([] as PlayerGroup[]);

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;

    const cached = loadRosterCache(teamId);
    if (cached) {
      setRosterCache(cached);
      setGroupedPlayers(splitTeamGroups(cached.players, cached.team.type, teamGroups));
      setIsLoading(false);
      return;
    }

    fetchJson<{ team: TeamWithPlayers }>(`/api/teams/${teamId}/players`)
      .then((data) => {
        if (cancelled) return;
        const cache = createRosterCache({
          team: data.team,
          teamGroups,
          players: data.team.players,
        });
        persistRosterCache(cache);
        setRosterCache(cache);
        setGroupedPlayers(splitTeamGroups(cache.players, data.team.type, teamGroups));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId, teamGroups, router.isReady]);

  useEffect(() => {
    if (!rosterCache) {
      return;
    }
    const merged = rosterCache.players.map((player) => {
      const update = rosterCache.pendingGroupUpdates.find((u) => u.playerId === player.id);
      return update ? { ...player, teamGroupId: update.teamGroupId } : player;
    });
    setGroupedPlayers(splitTeamGroups(merged, rosterCache.team.type, teamGroups));
  }, [rosterCache, teamGroups]);

  const handleMovePlayers = (teamGroupId: string) => {
    if (!rosterCache) {
      return;
    }
    const updates = selectedPlayers.map((playerId) => ({ playerId, teamGroupId }));
    const next = applyRosterMove(rosterCache, updates);
    persistRosterCache(next);
    setRosterCache(next);
    setSelectedPlayers([]);
    setMoveModalOpen(false);
  };

  const handleUndoPod = () => {
    if (!rosterCache) {
      return;
    }
    const next = undoRosterMove(rosterCache);
    persistRosterCache(next);
    setRosterCache(next);
  };

  const pendingPlayerIds = new Set(rosterCache?.pendingGroupUpdates.map((u) => u.playerId) ?? []);

  return (
    !isLoading &&
    rosterCache && (
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
                            playerSelected ? 'solid' : pendingPlayerIds.has(player.id) ? 'outlined' : 'soft'
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
              zIndex: 1200,
              bgcolor: 'background.surface',
              pb: 'env(safe-area-inset-bottom)',
            }}
          >
            <UndoButton
              canUndo={(rosterCache.podActionLog.length ?? 0) > 0}
              label={
                rosterCache.podActionLog.length > 0 ? 'Undo: Pod change' : 'Undo'
              }
              onUndo={handleUndoPod}
              fullWidth={false}
            />
            <Button
              variant="soft"
              color="warning"
              sx={{ flex: 1 }}
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
            <Button variant="solid" color="primary" sx={{ flex: 1 }} onClick={onDone}>
              Done
            </Button>
          </Stack>
        </Stack>
      </Box>
    )
  );
}
