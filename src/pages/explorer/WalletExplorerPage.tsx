import React, { useState } from 'react';
import { ExplorerLayout } from '@/components/common/ExplorerLayout';
import { Address } from '@/components/common/UIComponents';
import { formatNumber } from '@/lib/mockData';
import { useLeaderboard } from '@/lib/hooks';

export default function WalletExplorerPage() {
  const { data: lb, isLoading, refetch } = useLeaderboard('allTime');
  const [search, setSearch] = useState('');

  const rows = (lb?.leaderboardRows ?? []).map((r, i) => ({ ...r, rank: i + 1 }));
  const filtered = search
    ? rows.filter(w => w.ethAddress.toLowerCase().includes(search.toLowerCase()))
    : rows;

  return (
    <ExplorerLayout
      title="Wallet Explorer"
      subtitle="Top wallets on the Hyperliquid network"
      data={filtered}
      loading={isLoading}
      onRefresh={refetch}
      rowKey={r => r.ethAddress}
      getRowLink={r => `/wallet/${r.ethAddress}`}
      searchPlaceholder="Search wallet address..."
      onSearch={setSearch}
      searchValue={search}
      columns={[
        { key: 'rank', label: '#', render: r => <span className="text-xs font-mono text-muted-foreground">{r.rank}</span> },
        { key: 'ethAddress', label: 'Address', render: r => <Address address={r.ethAddress} chars={6} /> },
        { key: 'accountValue', label: 'Account Value', render: r => <span className="text-xs font-mono">{formatNumber(parseFloat(r.accountValue))}</span> },
        { key: 'windowPnl', label: 'PnL', render: r => {
          const pnl = parseFloat(r.windowPnl);
          return <span className={`text-xs font-mono font-semibold ${pnl >= 0 ? 'text-positive' : 'text-negative'}`}>{pnl >= 0 ? '+' : ''}{formatNumber(pnl)}</span>;
        }},
        { key: 'vlm', label: 'Volume', render: r => <span className="text-xs font-mono">{formatNumber(parseFloat(r.vlm))}</span> },
      ]}
    />
  );
}
