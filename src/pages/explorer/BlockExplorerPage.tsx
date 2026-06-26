import React, { useState, useEffect } from 'react';
import { ExplorerLayout } from '@/components/common/ExplorerLayout';
import { Address } from '@/components/common/UIComponents';
import { generateBlocks, formatTime } from '@/lib/mockData';
import type { Block } from '@/types';

export default function BlockExplorerPage() {
  const [data, setData] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setTimeout(() => { setData(generateBlocks(100)); setLoading(false); }, 300);
  };
  useEffect(() => { load(); }, []);

  const filtered = search
    ? data.filter(b => String(b.number).includes(search) || b.hash.includes(search))
    : data;

  return (
    <ExplorerLayout
      title="Block Explorer"
      subtitle="Latest blocks on Hyperliquid"
      data={filtered}
      loading={loading}
      onRefresh={load}
      rowKey={r => String(r.number)}
      getRowLink={r => `/explorer/blocks/${r.number}`}
      searchPlaceholder="Block number or hash..."
      onSearch={setSearch}
      searchValue={search}
      columns={[
        { key: 'number', label: 'Block', render: r => <span className="text-xs font-mono font-semibold text-cyan">{r.number.toLocaleString()}</span> },
        { key: 'hash', label: 'Hash', render: r => <Address address={r.hash} chars={6} /> },
        { key: 'txCount', label: 'Txns', render: r => <span className="text-xs font-mono">{r.txCount}</span> },
        { key: 'validator', label: 'Validator', render: r => <Address address={r.validator} chars={5} /> },
        { key: 'gasUsed', label: 'Gas Used', render: r => <span className="text-xs font-mono">{((r.gasUsed / r.gasLimit) * 100).toFixed(1)}%</span> },
        { key: 'size', label: 'Size', render: r => <span className="text-xs font-mono">{(r.size / 1000).toFixed(1)} KB</span> },
        { key: 'timestamp', label: 'Time', render: r => <span className="text-[10px] text-muted-foreground">{formatTime(r.timestamp)}</span> },
      ]}
    />
  );
}
