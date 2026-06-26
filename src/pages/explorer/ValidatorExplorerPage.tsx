import React, { useState, useEffect } from 'react';
import { ExplorerLayout } from '@/components/common/ExplorerLayout';
import { Address, StatusBadge } from '@/components/common/UIComponents';
import { generateValidators, formatNumber, formatTime } from '@/lib/mockData';
import type { Validator } from '@/types';

export default function ValidatorExplorerPage() {
  const [data, setData] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setTimeout(() => { setData(generateValidators(50)); setLoading(false); }, 300);
  };
  useEffect(() => { load(); }, []);

  const filtered = search
    ? data.filter(v => v.address.toLowerCase().includes(search.toLowerCase()) || v.name.toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <ExplorerLayout
      title="Validator Explorer"
      subtitle="Network validators and their performance"
      data={filtered}
      loading={loading}
      onRefresh={load}
      rowKey={r => r.address}
      searchPlaceholder="Search validator..."
      onSearch={setSearch}
      searchValue={search}
      columns={[
        {
          key: 'name', label: 'Validator', render: r => (
            <div>
              <div className="text-xs font-semibold">{r.name}</div>
              <Address address={r.address} chars={5} className="text-[10px]" />
            </div>
          )
        },
        { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
        { key: 'stake', label: 'Stake', render: r => <span className="text-xs font-mono">{formatNumber(r.stake)}</span> },
        { key: 'commission', label: 'Commission', render: r => <span className="text-xs font-mono">{r.commission.toFixed(1)}%</span> },
        { key: 'uptime', label: 'Uptime', render: r => (
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-positive rounded-full" style={{ width: `${r.uptime}%` }} />
            </div>
            <span className="text-xs font-mono">{r.uptime.toFixed(1)}%</span>
          </div>
        )},
        { key: 'blocksValidated', label: 'Blocks', render: r => <span className="text-xs font-mono">{r.blocksValidated.toLocaleString()}</span> },
        { key: 'delegators', label: 'Delegators', render: r => <span className="text-xs font-mono">{r.delegators.toLocaleString()}</span> },
      ]}
    />
  );
}
