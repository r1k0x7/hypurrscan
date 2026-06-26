import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ExplorerLayout } from '@/components/common/ExplorerLayout';
import { Address } from '@/components/common/UIComponents';
import { generateContracts, formatNumber, formatTime } from '@/lib/mockData';
import type { Contract } from '@/types';

export default function ContractExplorerPage() {
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setTimeout(() => { setData(generateContracts(60)); setLoading(false); }, 300);
  };
  useEffect(() => { load(); }, []);

  const filtered = search
    ? data.filter(c => c.address.toLowerCase().includes(search.toLowerCase()) || (c.name && c.name.toLowerCase().includes(search.toLowerCase())))
    : data;

  const TYPE_COLORS: Record<string, string> = {
    erc20: 'bg-cyan/10 text-cyan border-cyan/20',
    erc721: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    defi: 'bg-positive/10 text-positive border-positive/20',
    other: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  };

  return (
    <ExplorerLayout
      title="Contract Explorer"
      subtitle="Smart contracts deployed on Hyperliquid"
      data={filtered}
      loading={loading}
      onRefresh={load}
      rowKey={r => r.address}
      getRowLink={r => `/explorer/contracts/${r.address}`}
      searchPlaceholder="Search address or name..."
      onSearch={setSearch}
      searchValue={search}
      columns={[
        {
          key: 'address', label: 'Address', render: r => (
            <div>
              {r.name && <div className="text-xs font-semibold">{r.name}</div>}
              <Address address={r.address} chars={6} />
            </div>
          )
        },
        {
          key: 'type', label: 'Type', render: r => (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border uppercase font-medium ${TYPE_COLORS[r.type] || TYPE_COLORS.other}`}>
              {r.type}
            </span>
          )
        },
        {
          key: 'verified', label: 'Verified', render: r => (
            <span className={`text-[10px] font-medium ${r.verified ? 'text-positive' : 'text-muted-foreground'}`}>
              {r.verified ? '✓ Yes' : '✗ No'}
            </span>
          )
        },
        { key: 'creator', label: 'Creator', render: r => <Address address={r.creator} chars={5} /> },
        { key: 'txCount', label: 'Txns', render: r => <span className="text-xs font-mono">{r.txCount.toLocaleString()}</span> },
        { key: 'balance', label: 'Balance', render: r => <span className="text-xs font-mono">{formatNumber(r.balance)}</span> },
        { key: 'createdAt', label: 'Deployed', render: r => <span className="text-[10px] text-muted-foreground">{formatTime(r.createdAt)}</span> },
      ]}
    />
  );
}
