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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/joy';
import { useRouter } from 'next/router';
import type { GameType, PlayerType, TeamType } from '@/database/schema';
import { colStackStyles, splitPlayersByGenderMatch } from '@/utils';
import { PlayerButton, GamesList } from '@/components';

type ErrorType = {
  [field: string]: string;
};

export default function TeamPage() {
  const router = useRouter();
  const teamId = router.query.teamId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teamData, setTeamData] = useState({} as TeamType);
  const [formData, setFormData] = useState({
    vsTeamName: '',
    startOnO: false,
    startFRatio: false,
    startLeft: false,
  });
  const [errors, setErrors] = useState({
    vsTeamName: '',
  } as ErrorType);
  const [playersL, setPlayersL] = useState([] as PlayerType[]);
  const [playersR, setPlayersR] = useState([] as PlayerType[]);
  const [activePlayerIds, setActivePlayerIds] = useState([] as string[]);
  const [games, setGames] = useState([] as GameType[]);

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/teams/${teamId}`)
      .then((res) => res.json())
      .then((data) => {
        const teamData = data.teamData as TeamType;
        const playersData = data.teamData.players as PlayerType[];
        const gamesData = data.teamData.games as GameType[];

        setTeamData(teamData);
        const { playersL, playersR } = splitPlayersByGenderMatch(playersData);
        setPlayersL(playersL);
        setPlayersR(playersR);
        setActivePlayerIds(playersData.filter((p) => !p.isPR).map((p) => p.id));
        setGames(gamesData);
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
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
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
    const teamId = teamData.id;
    const res = await fetch(`/api/teams/${teamId}/game`, {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        activePlayerIds,
        teamId,
      }),
    });
    const { gameId } = await res.json();
    router.push(`/games/${gameId}`);
  };

  return (
    !isLoading && (
      <Stack {...colStackStyles}>
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
                  checked={!formData.startOnO}
                  onChange={(e) => handleInputChange('startOnO', !e.target.checked)}
                  startDecorator="O"
                  endDecorator="D"
                />
              </FormControl>
              <FormControl orientation="horizontal">
                <FormLabel>Gender ratio</FormLabel>
                <Switch
                  checked={!formData.startFRatio}
                  onChange={(e) => handleInputChange('startFRatio', !e.target.checked)}
                  startDecorator="F"
                  endDecorator="O"
                />
              </FormControl>
              <FormControl orientation="horizontal">
                <FormLabel>Side</FormLabel>
                <Switch
                  checked={!formData.startLeft}
                  onChange={(e) => handleInputChange('startLeft', !e.target.checked)}
                  startDecorator="L"
                  endDecorator="R"
                />
              </FormControl>
              <Accordion>
                <AccordionSummary>Active players</AccordionSummary>
                <AccordionDetails>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: 'flex-start',
                      alignItems: 'flex-start',
                      width: '100%',
                      mt: 1,
                    }}
                  >
                    <Stack direction="column" spacing={1} sx={colStackStyles}>
                      {playersL.map((player) => {
                        const playerSelected = activePlayerIds.includes(player.id);
                        return (
                          <PlayerButton
                            key={player.id}
                            variant={playerSelected ? 'solid' : 'outlined'}
                            onClick={() => {
                              setActivePlayerIds(
                                playerSelected
                                  ? activePlayerIds.filter((p) => p != player.id)
                                  : activePlayerIds.concat(player.id)
                              );
                            }}
                            {...player}
                          />
                        );
                      })}
                    </Stack>
                    <Stack direction="column" spacing={1} sx={colStackStyles}>
                      {playersR.map((player) => {
                        const playerSelected = activePlayerIds.includes(player.id);
                        return (
                          <PlayerButton
                            key={player.id}
                            variant={playerSelected ? 'solid' : 'outlined'}
                            onClick={() => {
                              setActivePlayerIds(
                                playerSelected
                                  ? activePlayerIds.filter((p) => p != player.id)
                                  : activePlayerIds.concat(player.id)
                              );
                            }}
                            {...player}
                          />
                        );
                      })}
                    </Stack>
                  </Stack>
                </AccordionDetails>
              </Accordion>
              <Button size="lg" sx={{ mt: 2 }} loading={isSaving} onClick={handleSubmitButtonClick}>
                Start game
              </Button>
            </Stack>
          </CardContent>
        </Card>
        <GamesList {...{ games, router }} />
      </Stack>
    )
  );
}
