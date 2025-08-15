import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Typography,
  Stack,
  Modal,
  ModalDialog,
  ModalClose,
} from '@mui/joy';
import { useRouter } from 'next/router';
import type { Game, Team, TeamGroup } from '@/database/schema';
import { colStackStyles } from '@/utils';
import { EditTeamGroupsModal, GamesList } from '@/components';

type ErrorType = {
  [field: string]: string;
};

export default function TeamPage() {
  const router = useRouter();
  const teamId = router.query.teamId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teamGroupsModalOpen, setTeamGroupsModalOpen] = useState(false);
  const [team, setTeam] = useState({} as Team);
  const [teamGroups, setTeamGroups] = useState([] as TeamGroup[]);
  const [games, setGames] = useState([] as Game[]);
  const [formData, setFormData] = useState({ vsTeamName: '', startOnO: false, startFRatio: false, startLeft: false });
  const [errors, setErrors] = useState({ vsTeamName: '' } as ErrorType);

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/teams/${teamId}`)
      .then((res) => res.json())
      .then((data) => {
        setTeam(data.teamData as Team);
        setTeamGroups(data.teamData.teamGroups as TeamGroup[]);
        setGames(data.teamData.games as Game[]);
        setIsLoading(false);
      });
  }, [teamId, router.isReady]);

  const handleInputChange = (field: string, value: boolean | string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmitButtonClick = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    // Validate required fields
    const newErrors = {} as ErrorType;
    if (!formData.vsTeamName.trim()) {
      newErrors.vsTeamName = 'Opponent name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    const res = await fetch(`/api/teams/${teamId}/game`, { method: 'POST', body: JSON.stringify({ ...formData }) });
    const { gameId } = await res.json();
    router.push(`/games/${gameId}`);
  };

  return (
    !isLoading && (
      <Stack {...colStackStyles}>
        <Card variant="outlined" sx={{ width: '95%', m: 0.5 }}>
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              New game: {team.name}
            </Typography>
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
                <FormLabel>Gender ratio</FormLabel>
                <Switch
                  size="lg"
                  checked={!formData.startFRatio}
                  onChange={(e) => handleInputChange('startFRatio', !e.target.checked)}
                  startDecorator="F"
                  endDecorator="O"
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
              <Button size="lg" sx={{ mt: 2 }} loading={isSaving} onClick={handleSubmitButtonClick}>
                Start game
              </Button>
            </Stack>
          </CardContent>
        </Card>
        <Button variant="soft" size="lg" color="primary" onClick={() => setTeamGroupsModalOpen(true)}>
          Edit Pods
        </Button>
        <Modal open={teamGroupsModalOpen} onClose={() => setTeamGroupsModalOpen(false)}>
          <ModalDialog layout="fullscreen">
            <ModalClose /> {/* TODO: guardrail for unsaved changes */}
            <EditTeamGroupsModal {...{ teamGroups }} />
          </ModalDialog>
        </Modal>
        <GamesList {...{ games, router }} />
      </Stack>
    )
  );
}
