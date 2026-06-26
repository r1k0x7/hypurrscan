import React, { useState, useEffect } from 'react';
import { ExplorerLayout } from '@/components/common/ExplorerLayout';
import { Address, StatusBadge } from '@/components/common/UIComponents';
import { generateTransactions, generateContracts, formatNumber, formatTime } from '@/lib/mockData';
import type { Transaction } from '@/types';

// HyperEVM is the EVM-compatible layer of Hyperliquid
export default function HyperEVMExplorerPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setTimeout(() => {
      // HyperEVM uses contract-type txns as its primary data
      const txns = generateTransactions(150).map(t => ({
        ...t,
        type: ['contract', 'swap', 'contract', 'deposit', 'contract'][Math.floor(Math.random() * 5)] as Transaction['type'],
      }));
      setData(txns);
      setLoading(false);
    }, 300);
  };
  useEffect(() => { load(); }, []);

  const filtered = search
    ? data.filter(t => t.hash.includes(search) || t.from.includes(search) || t.to.includes(search))
    : data;

  return (
    <ExplorerLayout
      title="HyperEVM Explorer"
      subtitle="EVM-compatible execution layer transactions and contracts"
      data={filtered}
      loading={loading}
      onRefresh={load}
      rowKey={r => r.hash}
      searchPlaceholder="Hash, address..."
      onSearch={setSearch}
      searchValue={search}
      columns={[
        { key: 'hash', label: 'Tx Hash', render: r => <Address address={r.hash} chars={6} /> },
        { key: 'blockNumber', label: 'Block', render: r => <span className="text-xs font-mono text-cyan">{r.blockNumber.toLocaleString()}</span> },
        { key: 'type', label: 'Method', render: r => <span className="text-xs capitalize font-mono bg-muted/50 px-1 py-0.5 rounded">{r.type}</span> },
        { key: 'from', label: 'From', render: r => <Address address={r.from} chars={5} /> },
        { key: 'to', label: 'To (Contract)', render: r => <Address address={r.to} chars={5} /> },
        { key: 'valueUsd', label: 'Value', render: r => <span className="text-xs font-mono">{formatNumber(r.valueUsd)}</span> },
        { key: 'gasUsed', label: 'Gas Used', render: r => <span className="text-xs font-mono">{r.gasUsed.toLocaleString()}</span> },
        { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
        { key: 'timestamp', label: 'Age', render: r => <span className="text-[10px] text-muted-foreground">{formatTime(r.timestamp)}</span> },
      ]}
    />
  );
}
