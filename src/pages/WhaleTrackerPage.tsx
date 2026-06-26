import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/layout/Layout';
import { Address, SectionHeader } from '@/components/common/UIComponents';
import { CryptoIcon } from '@/components/common/CryptoIcon';
import { TableSkeleton } from '@/components/common/Skeletons';
import { formatNumber, formatTime } from '@/lib/mockData';
import { realtimeEmitter } from '@/lib/websocket';
import { useRecentTrades } from '@/lib/hooks';
import { toast } from 'sonner';
import type { WhaleTransaction } from '@/types';
import type { HLWSTrade } from '@/lib/websocket';

const WHALE_THRESHOLD = 500_000;

function hlTradeToWhale(t: HLWSTrade): WhaleTransaction {
  return {
    id: String(t.tid),
    timestamp: t.time / 1000,
    wallet: t.hash.slice(0, 42),
    token: t.coin,
    type: t.side === 'B' ? 'buy' : 'sell',
    amount: parseFloat(t.sz),
    valueUsd: parseFloat(t.px) * parseFloat(t.sz),
    txHash: t.hash,
  };
}

export default function WhaleTrackerPage() {
  const [txns, setTxns] = useState<WhaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [minValue, setMinValue] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const { data: recentBtc } = useRecentTrades('BTC');
  useEffect(() => {
    if (recentBtc) {
      const whales = recentBtc
        .filter(t => parseFloat(t.px) * parseFloat(t.sz) >= WHALE_THRESHOLD)
        .map(hlTradeToWhale);
      setTxns(whales);
      setLoading(false);
    }
  }, [recentBtc]);

  useEffect(() => {
    const unsub = realtimeEmitter.subscribe('trades', (d: unknown) => {
      const t = d as HLWSTrade;
      const value = parseFloat(t.px) * parseFloat(t.sz);
      if (value >= WHALE_THRESHOLD) {
        setTxns(prev => [hlTradeToWhale(t), ...prev].slice(0, 200));
      }
    });
    return unsub;
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 300);
  };

  const filtered = txns.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (minValue && t.valueUsd < parseFloat(minValue) * 1000) return false;
    return true;
  });
  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < filtered.length;

  const handleExport = () => {
    const csv = 'timestamp,wallet,token,type,value\n' + filtered.map(t =>
      `${t.timestamp},${t.wallet},${t.token},${t.type},${t.valueUsd}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'whale_transactions.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported!');
  };

  const TYPE_COLOR: Record<string, string> = {
    buy: 'text-positive', sell: 'text-negative', transfer: 'text-cyan', liquidation: 'text-yellow-400'
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-balance">Whale Tracker</h1>
            <p className="text-xs text-muted-foreground text-pretty">Large transactions ≥$500K</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleExport}>
              <Download className="w-3.5 h-3.5 mr-1" />Export
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRefresh}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
            </Button>
          </div>
        </div>

        <div className="terminal-panel">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border flex-wrap">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="liquidation">Liquidation</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Min $</span>
              <Input placeholder="Min value (K)" value={minValue} onChange={e => setMinValue(e.target.value)} className="h-7 w-28 text-xs" />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-positive/10 border border-positive/20">
              <div className="w-1.5 h-1.5 rounded-full bg-positive live-dot" />
              <span className="text-[10px] text-positive font-medium">LIVE</span>
            </div>
            <span className="text-[11px] text-muted-foreground">{filtered.length} transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  {['Time', 'Wallet', 'Token', 'Type', 'Amount', 'USD Value', 'Hash'].map(h => (
                    <th key={h} className="text-left text-[10px] text-muted-foreground px-3 py-2 font-medium uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? null : paginated.map(t => (
                  <tr key={t.id} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                    <td className="px-3 py-2.5 text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(t.timestamp)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Link to={`/wallet/${t.wallet}`}><Address address={t.wallet} chars={5} /></Link>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CryptoIcon symbol={t.token} size={18} />
                        <span className="text-xs font-semibold">{t.token}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`text-xs font-medium capitalize ${TYPE_COLOR[t.type] || ''}`}>{t.type}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{t.amount.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono font-semibold whitespace-nowrap">{formatNumber(t.valueUsd)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Address address={t.txHash} chars={4} className="text-[10px]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <TableSkeleton rows={10} />}
          </div>

          {!loading && hasMore && (
            <div className="p-4 border-t border-border text-center">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>
                Load More ({filtered.length - paginated.length} remaining)
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
