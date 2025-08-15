import type { NextRouter } from 'next/router';
import type { Dispatch, SetStateAction } from 'react';
import type { Game, Player, PlayerWithLineCount } from './database/schema';

export function splitPlayersByGenderMatch<PT extends Player | PlayerWithLineCount>(
  playersData: PT[]
): { playersL: PT[]; playersR: PT[] } {
  return playersData
    .sort((a, b) => (a.isPR === b.isPR ? 0 : b.isPR ? -1 : 1))
    .sort((a, b) => (a.isHandler === b.isHandler ? 0 : b.isHandler ? 1 : -1))
    .reduce(
      (result, player) => {
        (player.isFMP ? result.playersL : result.playersR).push(player);
        return result;
      },
      { playersL: [] as PT[], playersR: [] as PT[] }
    );
}

export function calculatePointInfo({
  teamScore,
  vsTeamScore,
  startFRatio,
  startLeft,
  halftimeAt,
  wasLastScoreUs,
  startOnO,
}: Game) {
  const totalPoints = teamScore + vsTeamScore;
  const isFirstHalf = halftimeAt == null;

  // deal with ABBA for gender ratios
  const shouldBeFemale = totalPoints === 0 ? startFRatio : (totalPoints + 1) % 4 < 2 === startFRatio;
  const genderRatio = `${shouldBeFemale ? 'Female' : 'Open'} ${totalPoints % 2 === 0 ? '2' : '1'}`;
  const [playerLimitL, playerLimitR] = shouldBeFemale ? [4, 3] : [3, 4];

  // flip oOrD for halftime, otherwise just flip last score
  const isOnO = halftimeAt === totalPoints ? !startOnO : !wasLastScoreUs;
  const oOrD = isOnO ? 'Offence' : 'Defence';

  // flip side at half, otherwise switch sides every time
  const isOddPoint = (totalPoints - (halftimeAt ?? 0)) % 2 === 1;
  const isLeft = (startLeft !== !!halftimeAt) !== isOddPoint;
  const fieldSide = isLeft ? 'Left' : 'Right';

  return {
    genderRatio,
    oOrD,
    fieldSide,
    isFirstHalf,
    playerLimitL,
    playerLimitR,
  };
}

export function handleEndHalfButtonClick(
  e: React.MouseEvent<HTMLElement>,
  gameId: string,
  router: NextRouter,
  setPointInfo: Dispatch<
    SetStateAction<{
      vsTeamName: string;
      teamScore: number;
      vsTeamScore: number;
      oOrD: string;
      genderRatio: string;
      fieldSide: string;
      isFirstHalf: boolean;
    }>
  >
) {
  e.preventDefault();

  fetch(`/api/games/${gameId}/end-half`, { method: 'POST' })
    .then((res) => res.json())
    .then((data) => {
      const gameData = data.gameData as Game;
      if (gameData.isComplete) {
        router.push(`/games/${gameId}/summary`);
      } else {
        setPointInfo({ ...gameData, ...calculatePointInfo(gameData) });
        router.reload();
      }
    });
}

export const colStackStyles = { justifyContent: 'center', alignItems: 'center', width: '100%' };
