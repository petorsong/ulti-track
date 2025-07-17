import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Box
} from '@mui/joy';

export default function PointCard({
  teamScore, vsTeamScore, oOrD, genderRatio, fieldSide
}: {
  teamScore: number;
  vsTeamScore: number;
  oOrD: string;
  genderRatio: string;
  fieldSide: string;
}
) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: 100,
        display: 'flex',
        flexDirection: 'row'
      }}
    >
      <CardContent sx={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        p: 2
      }}>
        <Box sx={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <Typography
            level="body-sm"
            color="neutral"
            sx={{ mb: 1 }}
          >
            Score
          </Typography>
          <Typography
            level="h1"
            sx={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              lineHeight: 1
            }}
          >
            {teamScore}-{vsTeamScore}
          </Typography>
        </Box>
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Stack spacing={1} sx={{ width: '100%' }}>
            <Chip
              variant="soft"
              color={oOrD == 'Offence' ? 'success' : 'danger'}
              size="sm"
              sx={{ justifyContent: 'center' }}
            >
              {oOrD}
            </Chip>
            <Chip
              variant="soft"
              color={genderRatio[0] == 'F' ? 'primary' : 'warning'}
              size="sm"
              sx={{ justifyContent: 'center' }}
            >
              {genderRatio}
            </Chip>
            <Chip
              variant="soft"
              size="sm"
              sx={{ justifyContent: 'center' }}
            >
              {fieldSide}
            </Chip>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
