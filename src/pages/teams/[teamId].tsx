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
import type { TeamWithGroupsAndGames } from '@/database/schema';
import { COL_STACK_STYLES } from '@/utils';
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
  const [teamData, setTeamData] = useState({} as TeamWithGroupsAndGames);
  const [formData, setFormData] = useState({
    vsTeamName: '',
    startOnO: false,
    startLeft: false,
    startFRatio: null as boolean | null,
    startTime: '',
  });
  const [errors, setErrors] = useState({ vsTeamName: '' } as ErrorType);

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/teams/${teamId}`)
      .then((res) => res.json())
      .then((data) => {
        setTeamData(data.teamData as TeamWithGroupsAndGames);
        setFormData((formData) => ({ ...formData, startFRatio: data.teamData.type == 'Mixed' ? false : null }));
        setIsLoading(false);
      });
  }, [teamId, router.isReady]);

  const handleInputChange = (field: string, value: boolean | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

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
      <Stack {...COL_STACK_STYLES}>
        <Card variant="outlined" sx={{ width: '95%', m: 0.5 }}>
          <CardContent>
            <Typography level="title-lg" sx={{ mb: 2 }}>
              New game: {teamData.name}
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
            <EditTeamGroupsModal {...{ teamGroups: teamData.teamGroups }} />
          </ModalDialog>
        </Modal>
        <GamesList {...{ games: teamData.games, router }} />
      </Stack>
    )
  );
}
