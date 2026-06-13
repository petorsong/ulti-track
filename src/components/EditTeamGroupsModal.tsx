import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Save from '@mui/icons-material/Save';
import { fetchJson } from '@/lib/fetchJson';
import { COL_STACK_STYLES, splitPlayers } from '@/utils';
import { Box, Button, Stack, Typography } from '@mui/joy';
import Group from '@mui/icons-material/Group';
import type { Player, PlayerType, TeamGroup, TeamType, TeamWithPlayers } from '@/database/schema';
import type { PlayerGroup } from '@/types';
import PlayerButton from './PlayerButton';
import BottomDialog from './BottomDialog';
import FixedActionFooter from './FixedActionFooter';
import UndoButton from './UndoButton';
import { AddPlayerModal, EditPlayerTypeModal } from './PlayerRosterModals';
import {
  addPendingPlayer,
  applyPendingTypeUpdates,
  applyRosterMove,
  cloneRosterForEditing,
  createRosterCache,
  getMergedPlayers,
  hasRosterPendingChanges,
  loadRosterCache,
  persistRosterCache,
  rosterSyncPayload,
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [addPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
  const [editTypeModalOpen, setEditTypeModalOpen] = useState(false);
  const [rosterCache, setRosterCache] = useState<RosterCache | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState([] as string[]);
  const [groupedPlayers, setGroupedPlayers] = useState([] as PlayerGroup[]);

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;

    const cached = loadRosterCache(teamId);
    if (cached) {
      setRosterCache(cloneRosterForEditing(cached));
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
    setGroupedPlayers(splitTeamGroups(getMergedPlayers(rosterCache), rosterCache.team.type, teamGroups));
  }, [rosterCache, teamGroups]);

  const handleMovePlayers = (teamGroupId: string) => {
    if (!rosterCache) {
      return;
    }
    const updates = selectedPlayers.map((playerId) => ({ playerId, teamGroupId }));
    const next = applyRosterMove(rosterCache, updates);
    setRosterCache(next);
    setSelectedPlayers([]);
    setMoveModalOpen(false);
  };

  const handleUndoPod = () => {
    if (!rosterCache) {
      return;
    }
    const next = undoRosterMove(rosterCache);
    setRosterCache(next);
  };

  const handleAddPlayer = (data: { firstName: string; type: PlayerType; isFMP: boolean }) => {
    if (!rosterCache) {
      return;
    }
    const next = addPendingPlayer(rosterCache, data);
    setRosterCache(next);
  };

  const handleEditType = (type: PlayerType) => {
    if (!rosterCache || selectedPlayers.length === 0) {
      return;
    }
    const next = applyPendingTypeUpdates(rosterCache, selectedPlayers, type);
    setRosterCache(next);
    setSelectedPlayers([]);
    setEditTypeModalOpen(false);
  };

  const handleSave = async () => {
    if (!rosterCache) {
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      if (hasRosterPendingChanges(rosterCache)) {
        await fetchJson(`/api/teams/${teamId}/roster/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rosterSyncPayload(rosterCache)),
        });
      }
      const data = await fetchJson<{ team: TeamWithPlayers }>(`/api/teams/${teamId}/players`);
      const cache = createRosterCache({
        team: data.team,
        teamGroups,
        players: data.team.players,
      });
      persistRosterCache(cache);
      onDone();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const pendingPlayerIds = new Set(rosterCache?.pendingGroupUpdates.map((u) => u.playerId) ?? []);
  const pendingNewPlayerIds = new Set(rosterCache?.pendingNewPlayers.map((p) => p.id) ?? []);
  const pendingTypePlayerIds = new Set(rosterCache?.pendingTypeUpdates.map((u) => u.playerId) ?? []);

  const mergedPlayers = rosterCache ? getMergedPlayers(rosterCache) : [];
  const selectedMergedPlayers = mergedPlayers.filter((p) => selectedPlayers.includes(p.id));
  const editTypeSelectionLabel =
    selectedMergedPlayers.length === 1
      ? (selectedMergedPlayers[0].nickname ?? selectedMergedPlayers[0].firstName)
      : `${selectedMergedPlayers.length} players`;
  const editTypeInitialType = selectedMergedPlayers[0]?.type ?? 'Cutter';

  return (
    !isLoading &&
    rosterCache && (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Stack direction="column" spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
          <Button
            variant="soft"
            color="primary"
            startDecorator={<PersonAdd />}
            onClick={() => setAddPlayerModalOpen(true)}
            sx={{ alignSelf: 'center', width: '95%' }}
          >
            Add player
          </Button>
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
                      const isPending =
                        pendingPlayerIds.has(player.id) ||
                        pendingNewPlayerIds.has(player.id) ||
                        pendingTypePlayerIds.has(player.id);
                      return (
                        <PlayerButton
                          key={player.id}
                          variant={playerSelected ? 'solid' : isPending ? 'outlined' : 'soft'}
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
          </Stack>
        </Box>
        {saveError && (
          <Typography level="body-sm" color="danger" sx={{ px: 1, pb: 1 }}>
            {saveError}
          </Typography>
        )}
        <FixedActionFooter fixed={false}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '100%' }}>
            <Button
              variant="soft"
              color="neutral"
              fullWidth
              disabled={selectedPlayers.length === 0}
              onClick={() => setEditTypeModalOpen(true)}
            >
              Edit type
            </Button>
            <Button
              variant="soft"
              color="warning"
              fullWidth
              disabled={selectedPlayers.length === 0}
              onClick={() => setMoveModalOpen(true)}
            >
              Move
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', width: '100%' }}>
            <UndoButton
              canUndo={(rosterCache.podActionLog.length ?? 0) > 0}
              label={rosterCache.podActionLog.length > 0 ? 'Undo: Pod change' : 'Undo'}
              onUndo={handleUndoPod}
            />
            <Button
              variant="solid"
              color="primary"
              fullWidth
              endDecorator={<Save />}
              loading={isSaving}
              onClick={handleSave}
            >
              Save
            </Button>
          </Stack>
        </FixedActionFooter>
        <AddPlayerModal
          open={addPlayerModalOpen}
          onClose={() => setAddPlayerModalOpen(false)}
          teamType={rosterCache.team.type}
          onSave={handleAddPlayer}
        />
        <EditPlayerTypeModal
          open={editTypeModalOpen}
          onClose={() => setEditTypeModalOpen(false)}
          selectionLabel={editTypeSelectionLabel}
          initialType={editTypeInitialType}
          onSave={handleEditType}
        />
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
      </Box>
    )
  );
}
