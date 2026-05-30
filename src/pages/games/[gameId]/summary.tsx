import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import type { Game, Team } from '@/database/schema';
import { fetchJson } from '@/lib/fetchJson';
import { buildSummaryColumns, type StatSummary } from '@/lib/summaryColumns';
import type { GameSummary, PlayerWithStats } from '@/types';
import { Table } from 'antd';

// TODO LATER: consider server rendered page (for COMPLETED games - fetch /summary props); or a one time job?
export default function GameSummaryPage() {
  const router = useRouter();
  const gameId = router.query.gameId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teamData, setTeamData] = useState({} as Team);
  const [gameData, setGameData] = useState({} as Game);
  const [playersData, setPlayersData] = useState([] as StatSummary[]);

  const columns = useMemo(() => buildSummaryColumns(teamData.type), [teamData.type]);

  useEffect(() => {
    if (!router.isReady) return;

    let cancelled = false;
    setLoadError(null);
    setIsLoading(true);

    fetchJson<{ summaryData: GameSummary }>(`/api/games/${gameId}/summary`)
      .then((data) => {
        if (cancelled) return;
        const { team, game, players } = data.summaryData;
        setTeamData(team);
        setGameData(game);
        setPlayersData(
          players.map((playerStats) => {
            const {
              player: { id, nickname, firstName },
              stats,
            } = playerStats as PlayerWithStats;
            return { key: id, playerName: nickname ?? firstName, ...stats };
          })
        );
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gameId, router.isReady]);

  if (loadError) {
    return <p>{loadError}</p>;
  }

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
