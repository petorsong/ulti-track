import { describe, expect, it } from 'vitest';
import type { Player, Team, TeamGroup } from '@/database/schema';
import { createDraft } from '@/lib/draftGame/createDraft';
import { draftPlayerColumns, draftTeamWithGroups } from '@/lib/liveGameData';

const team: Team = { id: 'team-1', name: 'Test', type: 'Open' };
const activeGroup: TeamGroup = {
  id: 'group-a',
  name: 'Pod 1',
  isActive: true,
  isDefault: false,
  teamId: team.id,
  createdAt: '2025-01-01',
};
const inactiveGroup: TeamGroup = {
  id: 'group-b',
  name: 'None',
  isActive: false,
  isDefault: true,
  teamId: team.id,
  createdAt: '2025-01-01',
};

function mkPlayer(id: string, teamGroupId: string): Player {
  return {
    id,
    firstName: id,
    lastName: null,
    isFMP: false,
    isPR: false,
    type: 'Cutter',
    nickname: null,
    order: null,
    teamId: team.id,
    teamGroupId,
  };
}

const activePlayers = Array.from({ length: 7 }, (_, i) => mkPlayer(`p${i}`, activeGroup.id));
const benchPlayer = mkPlayer('bench', inactiveGroup.id);

describe('liveGameData', () => {
  it('omits inactive pods and bench players from lineup UI data', () => {
    const draft = createDraft({
      teamId: team.id,
      setup: {
        vsTeamName: 'Opp',
        startOnO: false,
        startLeft: false,
        startFRatio: null,
        startTime: null,
      },
      rosterSnapshot: {
        team,
        teamGroups: [activeGroup, inactiveGroup],
        players: [...activePlayers, benchPlayer],
      },
      activePlayerIds: activePlayers.map((p) => p.id),
    });

    expect(draftTeamWithGroups(draft).teamGroups).toEqual([activeGroup]);

    const { playersL, playersR } = draftPlayerColumns(draft);
    const ids = playersL.concat(playersR).map((p) => p.id);
    expect(ids).toHaveLength(7);
    expect(ids).not.toContain('bench');
  });
});
