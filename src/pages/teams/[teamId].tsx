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
  AccordionDetails
} from '@mui/joy';
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import { db } from '@/database/drizzle';
import { PlayerType, teams } from '@/database/schema';
import { colStackStyles, splitPlayersByGenderMatch } from '@/utils';
import PlayerButton from '@/components/PlayerButton';

type ErrorType = {
  [field: string]: string
};

const inactiveDevsForNobo = [ // TODO LATER: remove
  '9bd3c78a-e892-4da7-87a3-a2b70121c4c3', // evelyn
  '58f21f02-dc1c-4c28-9227-94b7d245fbee', // mika
  '24c2aceb-8eea-47f8-9f96-78098f593214', // qiqi
  '1c48cabc-4d49-45cb-ba66-2f3fac430911', // jorin
  '2070f5ac-fad8-4820-bb20-1d0642fb6aaa', // sophia

  '31f6f02d-a209-46b1-a233-352ca0acbdf5', // darren
  'eb775ded-a08e-4946-8d2c-f6c0f55289c9', // alec
  '0d259b14-63b8-41dc-8885-5f9f476a7fbb', // kevin
  'e340f1a3-f353-4dc2-b0a7-dc58ce40227b', // tomas
  '0156c785-1e06-40e5-b35c-72f58068362f', // nick
  '1b95da1c-e094-4a06-8a7f-993ee7f43a90', // hosie
];

export const getStaticPaths = (async () => {
  const teamsData = await db.query.teams.findMany();
  return {
    paths: teamsData.map((team) => ({ params: { teamId: team.id}})),
    fallback: true, // false or "blocking"
  }
}) satisfies GetStaticPaths;

export const getStaticProps = (async ({ params }) => {
  const teamId = params!.teamId as string;
  const teamData = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
  });
  const playersData = await db.query.players.findMany({
    where: (players, { eq }) => eq(players.teamId, teamId),
  });
  return { props: { teamData: teamData!, playersData }}
}) satisfies GetStaticProps<{
  teamData: typeof teams.$inferSelect;
  playersData: PlayerType[];
}>

export default function NewGamePage({
  teamData, playersData
}:InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    vsTeamName: '',
    startOnO: false,
    startFRatio: false,
    startLeft: false
  });
  const [errors, setErrors] = useState({
    vsTeamName: ''
  } as ErrorType);

  const [activePlayerIds, setActivePlayerIds] = useState(playersData.filter(
    (p) => !inactiveDevsForNobo.includes(p.id)
  ).map((p) => p.id));
  const { playersL, playersR } = splitPlayersByGenderMatch(playersData);

  const handleInputChange = (field: string, value: boolean|string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
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
    
    // TODO LATER: consider making this work? doesn't like something about drizzle inserts
    // const [result] = await db.insert(games).values({
    //    ...formData, activePlayerIds, teamId: teamData.id,
    // }).returning({ gameId: games.id });

    const teamId = teamData.id;
    const res = await fetch(`http://localhost:3000/api/teams/${teamId}/game`, {
      method: 'POST',
      body: JSON.stringify({
        ...formData, activePlayerIds, teamId,
      }),
    });
    const { gameId } = await res.json();
    router.push(`/games/${gameId}`);
  }

  return (
    <Box sx={{ m: 0.5 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography level="title-lg" sx={{ mb: 3 }}>
            New Game: {teamData.name}
          </Typography>
          <Stack spacing={3}>
            <FormControl error={!!errors.vsTeamName}>
              <FormLabel>Opponent Name</FormLabel>
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
              <AccordionSummary>Active Players</AccordionSummary>
              <AccordionDetails>
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    width: "100%",
                    mt: 1,
                  }}
                >
                  <Stack
                    direction="column"
                    spacing={1}
                    sx={colStackStyles}
                  >
                    {playersL.map(player => {
                      const playerSelected = activePlayerIds.includes(player.id);
                      return (
                        <PlayerButton
                          key={player.id}
                          variant={playerSelected ? 'solid' : 'outlined'}
                          onClick={() => {
                            setActivePlayerIds(playerSelected
                              ? activePlayerIds.filter((p) => p != player.id)
                              : activePlayerIds.concat(player.id));
                          }}
                          {...player}
                        />
                      );
                    })}
                  </Stack>
                  <Stack
                    direction="column"
                    spacing={1}
                    sx={colStackStyles}
                  >
                    {playersR.map(player => {
                      const playerSelected = activePlayerIds.includes(player.id);
                      return (
                        <PlayerButton
                          key={player.id}
                          variant={playerSelected ? 'solid' : 'outlined'}
                          onClick={() => {
                            setActivePlayerIds(playerSelected
                              ? activePlayerIds.filter((p) => p != player.id)
                              : activePlayerIds.concat(player.id));
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
              Start Game
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}