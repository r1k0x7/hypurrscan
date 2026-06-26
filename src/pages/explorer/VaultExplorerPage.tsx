import React, { useState } from 'react';
import { ExplorerLayout } from '@/components/common/ExplorerLayout';
import { Address } from '@/components/common/UIComponents';
import { formatNumber } from '@/lib/mockData';
import { useVaultSummaries } from '@/lib/hooks';

export default function VaultExplorerPage() {
  const { data: vaults = [], isLoading, refetch } = useVaultSummaries();
  const [search, setSearch] = useState('');

  const filtered = search
    ? vaults.filter(v => v.vaultAddress.toLowerCase().includes(search.toLowerCase()) || v.name.toLowerCase().includes(search.toLowerCase()))
    : vaults;

  return (
    <ExplorerLayout
      title="Vault Explorer"
      subtitle="DeFi vaults and yield strategies"
      data={filtered}
      loading={isLoading}
      onRefresh={refetch}
      rowKey={r => r.vaultAddress}
      getRowLink={r => `/explorer/vaults/${r.vaultAddress}`}
      searchPlaceholder="Search vault..."
      onSearch={setSearch}
      searchValue={search}
      columns={[
        {
          key: 'name', label: 'Vault', render: r => (
            <div>
              <div className="text-xs font-semibold">{r.name}</div>
              <Address address={r.vaultAddress} chars={5} className="text-[10px]" />
            </div>
          )
        },
        { key: 'tvl', label: 'TVL', render: r => <span className="text-xs font-mono">{formatNumber(parseFloat(r.tvl))}</span> },
        { key: 'pnl', label: 'PnL', render: r => {
          const pnl = parseFloat(r.pnl);
          return <span className={`text-xs font-mono ${pnl >= 0 ? 'text-positive' : 'text-negative'}`}>{pnl >= 0 ? '+' : ''}{formatNumber(pnl)}</span>;
        }},
        { key: 'apr', label: 'APR', render: r => <span className="text-xs font-mono text-positive">{(parseFloat(r.apr) * 100).toFixed(2)}%</span> },
        { key: 'leader', label: 'Leader', render: r => <Address address={r.leader} chars={5} /> },
        { key: 'isClosed', label: 'Status', render: r => (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${r.isClosed ? 'bg-muted text-muted-foreground' : 'bg-positive/10 text-positive'}`}>
            {r.isClosed ? 'Closed' : 'Active'}
          </span>
        )},
      ]}
    />
  );
}
