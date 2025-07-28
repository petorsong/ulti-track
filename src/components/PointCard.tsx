import React from 'react';
import { Card, CardContent, Typography, Chip, Stack } from '@mui/joy';

export default function PointCard({
  vsTeamName,
  teamScore,
  vsTeamScore,
  oOrD,
  genderRatio,
  fieldSide,
  isFirstHalf,
}: {
  vsTeamName: string;
  teamScore: number;
  vsTeamScore: number;
  oOrD: string;
  genderRatio: string;
  fieldSide: string;
  isFirstHalf: boolean;
}) {
  return (
    <Card size="sm" sx={{ height: 125, width: '65%' }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography level="body-sm" color="neutral" textAlign="center">
            vs {vsTeamName}
          </Typography>

          <Stack direction="row">
            <Stack spacing={0.5} alignItems="center" flex="3">
              <Typography level="h1" lineHeight="1">
                {teamScore}-{vsTeamScore}
              </Typography>
              <Chip size="sm" variant="outlined" color={isFirstHalf ? 'neutral' : 'warning'}>
                {isFirstHalf ? '1st half' : '2nd half'}
              </Chip>
            </Stack>

            <Stack spacing={0.5} justifyContent="center" flex="2">
              <Chip size="sm" color={oOrD == 'Offence' ? 'success' : 'danger'}>
                {oOrD}
              </Chip>
              <Chip size="sm" color={genderRatio[0] == 'F' ? 'primary' : 'warning'}>
                {genderRatio}
              </Chip>
              <Chip size="sm" variant="outlined" color={fieldSide == 'L' ? 'neutral' : 'warning'}>
                {fieldSide}
              </Chip>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
