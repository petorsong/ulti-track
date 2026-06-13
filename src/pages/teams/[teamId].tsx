import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Switch,
  Typography,
} from '@mui/joy';
import { useRouter } from 'next/router';
import type { TeamWithGroupsAndGames, TeamWithPlayers } from '@/database/schema';
import { EditTeamGroupsModal, GamesList } from '@/components';
import { useDraftGame } from '@/hooks/useDraftGame';
import {
  activeTeamGroups,
  computeActivePlayerIds,
  createDraft,
  playersForActiveGame,
} from '@/lib/draftGame';
import { fetchJson } from '@/lib/fetchJson';
import { createRosterCache, loadRosterCache, persistRosterCache } from '@/lib/rosterCache';
import { COL_STACK_STYLES } from '@/utils';

type ErrorType = {
  [field: string]: string;
};

export default function TeamPage() {
  const router = useRouter();
  const teamId = router.query.teamId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [teamGroupsModalOpen, setTeamGroupsModalOpen] = useState(false);
  const [podDisabledOpen, setPodDisabledOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [rosterReady, setRosterReady] = useState(false);
  const [teamData, setTeamData] = useState({} as TeamWithGroupsAndGames);
  const [formData, setFormData] = useState({
    vsTeamName: '',
    startOnO: false,
    startLeft: false,
    startFRatio: null as boolean | null,
    startTime: '',
  });
  const [errors, setErrors] = useState({ vsTeamName: '' } as ErrorType);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { isHydrated, draft, setDraftAndPersist, discardDraft } = useDraftGame(teamId);

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;
    setLoadError(null);
    setIsLoading(true);

    Promise.all([
      fetchJson<{ teamData: TeamWithGroupsAndGames }>(`/api/teams/${teamId}`),
      fetchJson<{ team: TeamWithPlayers }>(`/api/teams/${teamId}/players`).catch(() => null),
    ])
      .then(([teamRes, playersRes]) => {
        if (cancelled) return;
        setTeamData(teamRes.teamData);
        setFormData((prev) => ({
          ...prev,
          startFRatio: teamRes.teamData.type === 'Mixed' ? false : null,
        }));

        if (playersRes) {
          const cache = createRosterCache({
            team: playersRes.team,
            teamGroups: teamRes.teamData.teamGroups,
            players: playersRes.team.players,
          });
          const existing = loadRosterCache(teamId);
          if (existing?.pendingGroupUpdates.length) {
            cache.pendingGroupUpdates = existing.pendingGroupUpdates;
            cache.podActionLog = existing.podActionLog;
          }
          persistRosterCache(cache);
          setRosterReady(true);
        } else {
          setRosterReady(!!loadRosterCache(teamId));
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoadError(err.message);
          setRosterReady(!!loadRosterCache(teamId));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId, router.isReady]);

  const handleInputChange = (field: string, value: boolean | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleStartGame = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    const newErrors = {} as ErrorType;
    if (!formData.vsTeamName.trim()) {
      newErrors.vsTeamName = 'Opponent name is required';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const cache = loadRosterCache(teamId);
    if (!cache) {
      setLoadError('Connect once to load roster before starting a game');
      return;
    }

    let startTime: string | null = null;
    if (formData.startTime) {
      startTime = new Date(formData.startTime).toISOString();
    }

    const mergedPlayers = cache.players.map((player) => {
      const update = cache.pendingGroupUpdates.find((u) => u.playerId === player.id);
      return update ? { ...player, teamGroupId: update.teamGroupId } : player;
    });

    const activePlayerIds = computeActivePlayerIds(
      cache.players,
      cache.teamGroups,
      cache.pendingGroupUpdates
    );

    const newDraft = createDraft({
      teamId,
      setup: { ...formData, startTime },
      rosterSnapshot: {
        team: cache.team,
        teamGroups: activeTeamGroups(cache.teamGroups),
        players: playersForActiveGame(mergedPlayers, activePlayerIds),
      },
      activePlayerIds,
    });

    setDraftAndPersist(newDraft);
    router.push(`/teams/${teamId}/live`);
  };

  const handleResume = () => {
    if (!draft) return;
    if (draft.phase === 'point') {
      router.push(`/teams/${teamId}/live/point`);
    } else if (draft.phase === 'complete') {
      router.push(`/teams/${teamId}/live/complete`);
    } else {
      router.push(`/teams/${teamId}/live`);
    }
  };

  const handleEditPods = () => {
    if (draft) {
      setPodDisabledOpen(true);
      return;
    }
    setTeamGroupsModalOpen(true);
  };

  if (loadError && !teamData.name) {
    return <p>{loadError}</p>;
  }

  const showResume = isHydrated && draft;

  return (
    !isLoading && (
      <Stack {...COL_STACK_STYLES}>
        {showResume && (
          <Card variant="solid" color="primary" sx={{ width: '95%', m: 0.5 }}>
            <CardContent>
              <Typography level="title-lg">Resume game vs {draft.setup.vsTeamName}</Typography>
              <Typography level="body-md" sx={{ my: 1 }}>
                Score {draft.teamScore}–{draft.vsTeamScore}
                {draft.phase === 'point' ? ' · Point in progress' : ''}
              </Typography>
              <Typography level="body-sm" sx={{ mb: 1 }}>
                Last saved {new Date(draft.updatedAt).toLocaleString()}
              </Typography>
              <Typography level="body-xs" sx={{ mb: 1, opacity: 0.85 }}>
                Use one browser tab per game.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="lg" fullWidth onClick={handleResume}>
                  Resume
                </Button>
                <Button size="lg" variant="outlined" color="neutral" fullWidth onClick={() => setDiscardOpen(true)}>
                  Discard
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {!showResume && (
          <Card variant="outlined" sx={{ width: '95%', m: 0.5 }}>
            <CardContent>
              <Typography level="title-lg" sx={{ mb: 2 }}>
                New game: {teamData.name}
              </Typography>
              {!rosterReady && (
                <Typography level="body-sm" color="warning" sx={{ mb: 2 }}>
                  Connect once to load roster before starting offline.
                </Typography>
              )}
              <Stack spacing={2}>
                <FormControl error={!!errors.vsTeamName}>
                  <FormLabel>Opponent name:</FormLabel>
                  <Input
                    placeholder="Enter opponent team name"
                    value={formData.vsTeamName}
                    onChange={(e) => handleInputChange('vsTeamName', e.target.value)}
                  />
                  {errors.vsTeamName && (
                    <Typography level="body-sm" color="danger">
                      {errors.vsTeamName}
                    </Typography>
                  )}
                </FormControl>
                <Typography level="title-sm" sx={{ mb: 2 }}>
                  Starting:
                </Typography>
                <FormControl orientation="horizontal">
                  <FormLabel>On offence</FormLabel>
                  <Switch
                    size="lg"
                    checked={!formData.startOnO}
                    onChange={(e) => handleInputChange('startOnO', !e.target.checked)}
                    startDecorator="O"
                    endDecorator="D"
                  />
                </FormControl>
                <FormControl orientation="horizontal">
                  <FormLabel>Side</FormLabel>
                  <Switch
                    size="lg"
                    checked={!formData.startLeft}
                    onChange={(e) => handleInputChange('startLeft', !e.target.checked)}
                    startDecorator="L"
                    endDecorator="R"
                  />
                </FormControl>
                {teamData.type == 'Mixed' && (
                  <FormControl orientation="horizontal">
                    <FormLabel>Gender ratio</FormLabel>
                    <Switch
                      size="lg"
                      checked={!formData.startFRatio}
                      onChange={(e) => handleInputChange('startFRatio', !e.target.checked)}
                      startDecorator="F"
                      endDecorator="O"
                    />
                  </FormControl>
                )}
                <FormControl orientation="horizontal">
                  <FormLabel>Start time (optional):</FormLabel>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                  />
                </FormControl>
                <Button size="lg" sx={{ mt: 2 }} disabled={!rosterReady} onClick={handleStartGame}>
                  Start game
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Button variant="soft" size="lg" color="primary" onClick={handleEditPods}>
          Edit Pods
        </Button>

        <Modal open={teamGroupsModalOpen} onClose={() => setTeamGroupsModalOpen(false)}>
          <ModalDialog layout="fullscreen">
            <ModalClose />
            <EditTeamGroupsModal teamGroups={teamData.teamGroups} onDone={() => setTeamGroupsModalOpen(false)} />
          </ModalDialog>
        </Modal>

        <Modal open={podDisabledOpen} onClose={() => setPodDisabledOpen(false)}>
          <ModalDialog>
            <Typography level="title-lg">Pods locked</Typography>
            <Typography sx={{ my: 2 }}>Only editable between games.</Typography>
            <Button onClick={() => setPodDisabledOpen(false)}>OK</Button>
          </ModalDialog>
        </Modal>

        <Modal open={discardOpen} onClose={() => setDiscardOpen(false)}>
          <ModalDialog>
            <Typography level="title-lg">Discard game?</Typography>
            <Typography sx={{ my: 2 }}>
              This will delete in-progress stats for vs {draft?.setup.vsTeamName}.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                color="danger"
                onClick={() => {
                  discardDraft();
                  setDiscardOpen(false);
                }}
              >
                Discard
              </Button>
              <Button variant="outlined" onClick={() => setDiscardOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>

        <GamesList games={teamData.games} router={router} />
      </Stack>
    )
  );
}
