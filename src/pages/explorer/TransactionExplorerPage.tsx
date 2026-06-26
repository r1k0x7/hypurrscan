import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExplorerLayout } from '@/components/common/ExplorerLayout';
import { Address, StatusBadge } from '@/components/common/UIComponents';
import { generateTransactions, formatNumber, formatTime } from '@/lib/mockData';
import type { Transaction } from '@/types';

export default function TransactionExplorerPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () => {
    setLoading(true);
    setTimeout(() => { setData(generateTransactions(200)); setLoading(false); }, 400);
  };
  useEffect(() => { load(); }, []);

  const filtered = data.filter(t => {
    if (search && !t.hash.includes(search) && !t.from.includes(search) && !t.to.includes(search)) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <ExplorerLayout
      title="Transaction Explorer"
      subtitle="All transactions on the Hyperliquid network"
      data={filtered}
      loading={loading}
      onRefresh={load}
      rowKey={r => r.hash}
      getRowLink={r => `/explorer/transactions/${r.hash}`}
      searchPlaceholder="Hash or address..."
      onSearch={setSearch}
      searchValue={search}
      extraFilters={
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {['transfer', 'swap', 'deposit', 'withdraw', 'liquidation', 'contract'].map(t => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      columns={[
        { key: 'hash', label: 'Hash', render: r => <Address address={r.hash} chars={6} /> },
        { key: 'blockNumber', label: 'Block', render: r => <span className="text-xs font-mono text-cyan">{r.blockNumber.toLocaleString()}</span> },
        { key: 'type', label: 'Type', render: r => <span className="text-xs capitalize">{r.type}</span> },
        { key: 'from', label: 'From', render: r => <Address address={r.from} chars={5} /> },
        { key: 'to', label: 'To', render: r => <Address address={r.to} chars={5} /> },
        { key: 'valueUsd', label: 'Value', render: r => <span className="text-xs font-mono">{formatNumber(r.valueUsd)}</span> },
        { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
        { key: 'timestamp', label: 'Time', render: r => <span className="text-[10px] text-muted-foreground">{formatTime(r.timestamp)}</span> },
      ]}
    />
  );
}
