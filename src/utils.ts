import { games, PlayerType } from './database/schema';

export function splitPlayersByGenderMatch(playersData: PlayerType[]): {
  playersL: PlayerType[];
  playersR: PlayerType[];
} {
  return playersData
    .sort((a, b) => (a.isPR === b.isPR ? 0 : b.isPR ? -1 : 1))
    .sort((a, b) => (a.isHandler === b.isHandler ? 0 : b.isHandler ? 1 : -1))
    .reduce(
      (result, player) => {
        if (player.isFMP) {
          result.playersL.push(player);
        } else {
          result.playersR.push(player);
        }
        return result;
      },
      { playersL: [] as PlayerType[], playersR: [] as PlayerType[] }
    );
}

export function calculatePointInfo({
  teamScore,
  vsTeamScore,
  startFRatio,
  startLeft,
  halftimeAt,
  wasLastScoreUs,
}: typeof games.$inferSelect) {
  const totalPoints = teamScore + vsTeamScore;
  const ratioStrs = startFRatio ? ['Female', 'Open'] : ['Open', 'Female'];
  const ratio = totalPoints == 0 ? (startFRatio ? 'Female' : 'Open') : ratioStrs[(totalPoints + 1) % 4 < 2 ? 0 : 1];
  const genderRatio = `${ratio} ${totalPoints % 2 === 0 ? '2' : '1'}`;
  const [playerLimitL, playerLimitR] = ratio[0] === 'F' ? [4, 3] : [3, 4];

  const oOrD = wasLastScoreUs ? 'Defence' : 'Offence';
  const sideStr = startLeft
    ? !halftimeAt
      ? ['Left', 'Right']
      : ['Right', 'Left']
    : !halftimeAt
      ? ['Right', 'Left']
      : ['Left', 'Right'];
  const fieldSide = sideStr[(totalPoints - (halftimeAt ?? 0)) % 2];

  return {
    genderRatio,
    playerLimitL,
    playerLimitR,
    oOrD,
    fieldSide,
  };
}

export const colStackStyles = {
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
};
