import { describe, expect, it } from 'vitest';
import type { Player, Team, TeamGroup } from '@/database/schema';
import { applyDispatch } from '@/lib/draftGame/reducer';
import { createDraft } from '@/lib/draftGame/createDraft';
import {
  activeLinePlayers,
  benchPlayersForSubstitution,
  draftPlayerColumns,
  draftTeamWithGroups,
} from '@/lib/liveGameData';

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
        enforceAbba: null,
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

  it('updates live badges during a point with substitutions', () => {
    const roster = [...activePlayers, benchPlayer];
    const playerIds = activePlayers.map((p) => p.id);
    let draft = createDraft({
      teamId: team.id,
      setup: {
        vsTeamName: 'Opp',
        startOnO: false,
        startLeft: false,
        startFRatio: null,
        enforceAbba: null,
        startTime: null,
      },
      rosterSnapshot: {
        team,
        teamGroups: [activeGroup, inactiveGroup],
        players: roster,
      },
      activePlayerIds: activePlayers.map((p) => p.id),
    });
    draft = applyDispatch(draft, { type: 'START_POINT', playerIds });
    draft = applyDispatch(draft, { type: 'SUBSTITUTE', playerOffId: 'p0', playerOnId: 'bench' });

    const onField = activeLinePlayers(draft);
    const onFieldIds = onField.left.concat(onField.right).map((p) => p.id);
    expect(onFieldIds).toContain('bench');
    expect(onFieldIds).not.toContain('p0');

    const bench = benchPlayersForSubstitution(draft);
    const subbedOff = bench.left.concat(bench.right).find((p) => p.id === 'p0');
    const onFieldBench = onField.left.concat(onField.right).find((p) => p.id === 'bench');

    expect(onFieldBench?.lineCount).toBe(1);
    expect(onFieldBench?.sitCount).toBe(0);
    expect(subbedOff?.lineCount).toBe(1);
    expect(subbedOff?.sitCount).toBe(0);

    let preSubDraft = createDraft({
      teamId: team.id,
      setup: {
        vsTeamName: 'Opp',
        startOnO: false,
        startLeft: false,
        startFRatio: null,
        enforceAbba: null,
        startTime: null,
      },
      rosterSnapshot: {
        team,
        teamGroups: [activeGroup, inactiveGroup],
        players: roster,
      },
      activePlayerIds: activePlayers.map((p) => p.id),
    });
    preSubDraft = applyDispatch(preSubDraft, { type: 'START_POINT', playerIds });
    const preSubBench = benchPlayersForSubstitution(preSubDraft);
    const waiting = preSubBench.left.concat(preSubBench.right).find((p) => p.id === 'bench');
    expect(waiting?.lineCount).toBe(0);
    expect(waiting?.sitCount).toBe(1);
  });
});
