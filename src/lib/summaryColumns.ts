import type { Team } from '@/database/schema';
import type { PlayerStats } from '@/types';
import type { TableColumnsType } from 'antd';

export type StatSummary = PlayerStats & { playerName: string; key: string };

const baseColumns: TableColumnsType<StatSummary> = [
  { dataIndex: 'playerName', title: 'Player', fixed: 'left' },
  { dataIndex: 'pointsPlayed', title: 'PP', align: 'right', sorter: (a, b) => a.pointsPlayed - b.pointsPlayed },
  { dataIndex: 'scores', title: 'G', align: 'right', sorter: (a, b) => a.scores - b.scores },
  { dataIndex: 'assists', title: 'A', align: 'right', sorter: (a, b) => a.assists - b.assists },
  { dataIndex: 'hockeyAssists', title: '2A', align: 'right', sorter: (a, b) => a.hockeyAssists - b.hockeyAssists },
  { dataIndex: 'blocks', title: 'D', align: 'right', sorter: (a, b) => a.blocks - b.blocks },
  { dataIndex: 'throwAways', title: 'TA', align: 'right', sorter: (a, b) => a.throwAways - b.throwAways },
  { dataIndex: 'drops', title: 'Drop', align: 'right', sorter: (a, b) => a.drops - b.drops },
  { dataIndex: 'totalPasses', title: 'Pass', align: 'right', sorter: (a, b) => a.totalPasses - b.totalPasses },
];

const mixedColumns: TableColumnsType<StatSummary> = [
  { dataIndex: 'passesToF', title: 'Pass (F)', align: 'right', sorter: (a, b) => a.passesToF - b.passesToF },
  { dataIndex: 'passesToO', title: 'Pass (O)', align: 'right', sorter: (a, b) => a.passesToO - b.passesToO },
];

export function buildSummaryColumns(teamType: Team['type'] | undefined): TableColumnsType<StatSummary> {
  if (teamType === 'Mixed') {
    return [...baseColumns, ...mixedColumns];
  }
  return [...baseColumns];
}
