import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Chip, Stack } from '@mui/joy';

// source: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// https://stackoverflow.com/a/2998874/1673761
function twoDigits(num: number) {
  return String(num).padStart(2, '0');
}

function Countdown({ secondsLeft }: { secondsLeft: number }) {
  const [secondsRemaining, setSecondsRemaining] = useState(secondsLeft);

  const secondsToDisplay = secondsRemaining % 60;
  const minutesRemaining = (secondsRemaining - secondsToDisplay) / 60;
  const minutesToDisplay = minutesRemaining % 60;
  const hoursToDisplay = (minutesRemaining - minutesToDisplay) / 60;

  useInterval(
    () => {
      if (secondsRemaining > 0) setSecondsRemaining(secondsRemaining - 1);
    },
    secondsRemaining > 0 ? 1000 : null // passing null stops the interval
  );
  return (
    <Typography>
      {twoDigits(hoursToDisplay)}:{twoDigits(minutesToDisplay)}:{twoDigits(secondsToDisplay)}
    </Typography>
  );
}

export default function PointCard({
  vsTeamName,
  teamScore,
  vsTeamScore,
  oOrD,
  genderRatio,
  fieldSide,
  isFirstHalf,
  startTime,
}: {
  vsTeamName: string;
  teamScore: number;
  vsTeamScore: number;
  oOrD: string;
  fieldSide: string;
  genderRatio: string | null;
  isFirstHalf: boolean;
  startTime?: Date;
}) {
  let secondsUntilGameEnd = null;
  if (startTime) {
    const gmtDate = new Date(startTime);
    const localStartTime = gmtDate.getTime() - gmtDate.getTimezoneOffset() * 60000;
    const localEndTime = localStartTime + 80 * 60 * 1000; // TODO: hardcoded 80 min game
    const localNow = Date.now();
    if (localNow > localStartTime && localNow < localEndTime) {
      secondsUntilGameEnd = Math.trunc((localEndTime - localNow) / 1000);
    }
    console.log(`startTime: ${new Date(startTime)} (${startTime})`);
    console.log(`localStartTime: ${new Date(localStartTime)} (${localStartTime})`);
    console.log(`localEndTime: ${new Date(localEndTime)} (${localEndTime})`);
    console.log(`localNow: ${new Date(localNow)} (${localNow})`);
  }
  return (
    <Card size="sm" sx={{ height: 125, width: '65%' }}>
      <CardContent>
        <Stack direction="row">
          <Stack spacing={0.5} alignItems="center" flex="5">
            <Typography level="body-sm" color="neutral" textAlign="center">
              vs {vsTeamName}
            </Typography>
            <Typography level="h1" lineHeight="1">
              {teamScore}-{vsTeamScore}
            </Typography>
            {secondsUntilGameEnd && <Countdown secondsLeft={secondsUntilGameEnd} />}
          </Stack>
          <Stack spacing={0.5} justifyContent="center" flex="2">
            <Chip size="sm" variant="outlined" color={isFirstHalf ? 'neutral' : 'warning'}>
              {isFirstHalf ? '1st half' : '2nd half'}
            </Chip>
            <Chip size="sm" color={oOrD == 'Offence' ? 'success' : 'danger'}>
              {oOrD}
            </Chip>
            {genderRatio && (
              <Chip size="sm" color={genderRatio[0] == 'F' ? 'primary' : 'warning'}>
                {genderRatio}
              </Chip>
            )}
            <Chip size="sm" variant="outlined" color={fieldSide == 'L' ? 'neutral' : 'warning'}>
              {fieldSide}
            </Chip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
