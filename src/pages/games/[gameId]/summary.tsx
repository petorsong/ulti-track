import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { games, teams } from '@/database/schema';
import { PlayerStats, PlayerWithStats } from '@/types';
import { Table, type TableColumnsType } from 'antd';

type StatSummary = PlayerStats & { playerName: string; key: string };

// TODO LATER: consider making this a static server rendered page (for COMPLETED games)
export default function GameSummaryPage() {
  const router = useRouter();
  const gameId = router.query.gameId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [teamData, setTeamData] = useState({} as typeof teams.$inferSelect);
  const [gameData, setGameData] = useState({} as typeof games.$inferSelect);
  const [playersData, setPlayersData] = useState([] as StatSummary[]);

  const columns: TableColumnsType<StatSummary> = [
    { dataIndex: 'playerName', title: 'Player', fixed: 'left' },
    { dataIndex: 'pointsPlayed', title: 'PP', align: 'right', sorter: (a, b) => a.pointsPlayed - b.pointsPlayed },
    { dataIndex: 'scores', title: 'G', align: 'right', sorter: (a, b) => a.scores - b.scores },
    { dataIndex: 'assists', title: 'A', align: 'right', sorter: (a, b) => a.assists - b.assists },
    { dataIndex: 'hockeyAssists', title: '2A', align: 'right', sorter: (a, b) => a.hockeyAssists - b.hockeyAssists },
    { dataIndex: 'ds', title: 'D', align: 'right', sorter: (a, b) => a.ds - b.ds },
    { dataIndex: 'throwAways', title: 'TA', align: 'right', sorter: (a, b) => a.throwAways - b.throwAways },
    { dataIndex: 'drops', title: 'Drop', align: 'right', sorter: (a, b) => a.drops - b.drops },
    { dataIndex: 'totalPasses', title: 'Pass', align: 'right', sorter: (a, b) => a.totalPasses - b.totalPasses },
    {
      dataIndex: 'passesToF',
      title: 'Pass (F)',
      align: 'right',
      sorter: (a, b) => a.passesToF - b.passesToF,
      // render: (pF, pS) => (
      //   <div>{`${pF} (${((pF / (pS.totalPasses != 0 ? pS.totalPasses : 1)) * 100).toFixed(2)}%)`}</div>
      // ),
    },
    {
      dataIndex: 'passesToO',
      title: 'Pass (O)',
      align: 'right',
      sorter: (a, b) => a.passesToO - b.passesToO,
      // render: (pO, pS) => (
      //   <div>{`${pO} (${((pO / (pS.totalPasses != 0 ? pS.totalPasses : 1)) * 100).toFixed(2)}%)`}</div>
      // ),
    },
  ];

  useEffect(() => {
    if (!router.isReady) return;

    fetch(`/api/games/${gameId}/summary`)
      .then((res) => res.json())
      .then((data) => {
        const teamData = data.summaryData.team as typeof teams.$inferSelect;
        const gameData = data.summaryData.game as typeof games.$inferSelect;
        const playersData = data.summaryData.players as PlayerWithStats[];

        setTeamData(teamData);
        setGameData(gameData);
        setPlayersData(
          playersData.map((playerStats) => {
            const {
              player: { id, nickname, firstName },
              stats,
            } = playerStats;

            return {
              key: id,
              playerName: nickname ?? firstName,
              ...stats,
            };
          })
        );

        setIsLoading(false);
      });
  }, [gameId, router.isReady]);

  return (
    !isLoading && (
      <Table<StatSummary>
        title={() => `${teamData.name} vs ${gameData.vsTeamName}: ${gameData.teamScore}-${gameData.vsTeamScore}`}
        scroll={{ x: 'max-content' }}
        size="middle"
        pagination={false}
        columns={columns}
        dataSource={playersData}
        showSorterTooltip={{ target: 'sorter-icon' }}
      />
    )
  );
}
