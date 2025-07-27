import { useState } from 'react';
import {
  Box,
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
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { db } from '@/database/drizzle';
import { PlayerType, teams } from '@/database/schema';
import { colStackStyles, splitPlayersByGenderMatch } from '@/utils';
import PlayerButton from '@/components/PlayerButton';

type ErrorType = {
  [field: string]: string;
};

export const getStaticPaths = (async () => {
  const teamsData = await db.query.teams.findMany();
  return {
    paths: teamsData.map((team) => ({ params: { teamId: team.id } })),
    fallback: 'blocking',
  };
}) satisfies GetStaticPaths;

export const getStaticProps = (async ({ params }) => {
  const teamId = params!.teamId as string;
  const teamData = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
  });
  const playersData = await db.query.players.findMany({
    where: (players, { eq }) => eq(players.teamId, teamId),
  });
  return { props: { teamData: teamData!, playersData } };
}) satisfies GetStaticProps<{
  teamData: typeof teams.$inferSelect;
  playersData: PlayerType[];
}>;

export default function NewGamePage({ teamData, playersData }: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    vsTeamName: '',
    startOnO: false,
    startFRatio: false,
    startLeft: false,
  });
  const [errors, setErrors] = useState({
    vsTeamName: '',
  } as ErrorType);

  const [activePlayerIds, setActivePlayerIds] = useState(playersData.filter((p) => !p.isPR).map((p) => p.id));
  const { playersL, playersR } = splitPlayersByGenderMatch(playersData);

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
    <Box sx={{ m: 0.5 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography level="title-lg" sx={{ mb: 3 }}>
            New game: {teamData.name}
          </Typography>
          <Stack spacing={3}>
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
            <Box>
              <Typography level="title-sm" sx={{ mb: 2 }}>
                Starting:
              </Typography>
              <Stack spacing={3}>
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
              </Stack>
            </Box>
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
            <Button onClick={handleSubmitButtonClick} size="lg" sx={{ mt: 2 }}>
              Start game
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
