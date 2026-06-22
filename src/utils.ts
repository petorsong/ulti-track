import type { NextRouter } from 'next/router';
import type { Dispatch, SetStateAction } from 'react';
import type { Game, Player, PlayerType, PlayerWithCounts, TeamType } from './database/schema';

const playerTypeSortMap = new Map<PlayerType, number>([
  ['Handler', 0],
  ['Hybrid', 1],
  ['Cutter', 2],
]);

export function splitPlayers<PT extends Player | PlayerWithCounts>(
  playersData: PT[],
  type: TeamType
): { playersL: PT[]; playersR: PT[] } {
  const sortedPlayers = [...playersData]
    .sort((a, b) => Number(b.isPR) - Number(a.isPR))
    .sort((a, b) => (type === 'Women' ? 0 : playerTypeSortMap.get(a.type)! - playerTypeSortMap.get(b.type)!));

  const playersL: PT[] = [];
  const playersR: PT[] = [];
  sortedPlayers.forEach((player, i) => {
    const goesToLeft =
      (type === 'Mixed' && player.isFMP) ||
      (type === 'Open' && player.type !== 'Cutter') ||
      (type === 'Women' && i % 2 === 0);
    (goesToLeft ? playersL : playersR).push(player);
  });

  return { playersL, playersR };
}

export function calculatePointInfo({
  teamScore,
  vsTeamScore,
  startFRatio,
  enforceAbba,
  startLeft,
  halftimeAt,
  wasLastScoreUs,
  startOnO,
}: Game) {
  const totalPoints = teamScore + vsTeamScore;
  const isFirstHalf = halftimeAt == null;

  // deal with ABBA for gender ratios
  let genderRatio = null,
    playerLimitL = null,
    playerLimitR = null;
  if (startFRatio !== null && enforceAbba !== false) {
    const shouldBeFemale = totalPoints === 0 ? startFRatio : (totalPoints + 1) % 4 < 2 === startFRatio;
    genderRatio = `${shouldBeFemale ? 'Female' : 'Open'} ${totalPoints % 2 === 0 ? '2' : '1'}`;
    [playerLimitL, playerLimitR] = shouldBeFemale ? [4, 3] : [3, 4];
  }

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

export function isMixedLinePlayerDisabled(
  isFMP: boolean,
  selectedLeft: string[],
  selectedRight: string[],
  enforceAbba: boolean,
  abbaColumnLimit: number | null,
  playerSelected: boolean
): boolean {
  if (playerSelected) return false;

  if (enforceAbba) {
    const selectedInColumn = isFMP ? selectedLeft : selectedRight;
    return abbaColumnLimit !== null && selectedInColumn.length >= abbaColumnLimit;
  }

  const fmpCount = selectedLeft.length;
  const openCount = selectedRight.length;

  if (isFMP) {
    if (fmpCount >= 4) return true;
    if (openCount >= 4 && fmpCount >= 3) return true;
    return false;
  }

  if (openCount >= 4) return true;
  if (fmpCount >= 4 && openCount >= 3) return true;
  return false;
}

export function handleEndHalfButtonClick(
  e: React.MouseEvent<HTMLElement>,
  gameId: string,
  router: NextRouter,
  setPointInfo: Dispatch<SetStateAction<typeof POINT_INFO_DEFAULT>>
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

export const COL_STACK_STYLES = { justifyContent: 'center', alignItems: 'center', width: '100%' };

export const POINT_INFO_DEFAULT = {
  vsTeamName: '',
  teamScore: 0,
  vsTeamScore: 0,
  oOrD: '',
  fieldSide: '',
  genderRatio: null as string | null,
  isFirstHalf: true,
  playerLimitL: 0 as number | null,
  playerLimitR: 0 as number | null,
};
