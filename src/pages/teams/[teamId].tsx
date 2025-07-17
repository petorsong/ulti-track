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
  Stack
} from '@mui/joy';
import { useRouter } from 'next/router';

type ErrorType = {
  [field: string]: string
};

export default function NewGameForm() {
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

  const handleSubmit = async (e: any) => {
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

    const { teamId } = router.query

    const res = await fetch(`http://localhost:3000/api/teams/${teamId}/game`, {
      method: 'POST',
      body: JSON.stringify({
        ...formData, teamId,
      }),
    });

    const { gameId } = await res.json();

    router.push(`/games/${gameId}`);
  }

  // TODO: add dropdown for ACTIVE PLAYERS, hardcode ppl going to nobo for now

  return (
    <Box sx={{ mx: 'auto', mt: 4 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography level="title-lg" sx={{ mb: 3 }}>
            Devs: New Game
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
                <FormControl orientation="horizontal" /*sx={{ justifyContent: 'space-between' }}*/>
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

            <Button onClick={handleSubmit} size="lg" sx={{ mt: 2 }}>
              Start Game
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}