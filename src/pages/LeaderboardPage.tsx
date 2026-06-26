import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/layout/Layout';
import { Address, PriceChange, SectionHeader } from '@/components/common/UIComponents';
import { TableSkeleton } from '@/components/common/Skeletons';
import { formatNumber, formatCompact } from '@/lib/mockData';
import { useLeaderboard } from '@/lib/hooks';
import { toast } from 'sonner';
import type { SortDirection } from '@/types';

type SortKey = 'rank' | 'accountValue' | 'windowPnl' | 'pnl' | 'vlm';
type LBWindow = '1d' | '1w' | '1m' | 'allTime';

const PERIOD_MAP: Record<string, LBWindow> = { '1d': '1d', '7d': '1w', '30d': '1m', 'allTime': 'allTime' };
const PERIOD_LABELS: Record<string, string> = { '1d': '24H', '7d': '7D', '30d': '30D', 'allTime': 'All' };

function SortHeader({ label, col, sort, dir, onSort }: {
  label: string; col: SortKey; sort: SortKey; dir: SortDirection;
  onSort: (col: SortKey) => void;
}) {
  const active = sort === col;
  return (
    <th onClick={() => onSort(col)} className="text-left text-[10px] text-muted-foreground px-3 py-2 font-medium uppercase whitespace-nowrap cursor-pointer hover:text-foreground select-none">
      <span className="flex items-center gap-0.5">
        {label}
        {active ? (dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : (
          <span className="w-3 h-3 opacity-30"><ChevronDown className="w-3 h-3" /></span>
        )}
      </span>
    </th>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'trader' | 'wallet'>('trader');
  const [period, setPeriod] = useState<string>('7d');
  const [sort, setSort] = useState<SortKey>('windowPnl');
  const [dir, setDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const PER_PAGE = 20;

  const hlWindow = PERIOD_MAP[period] ?? '1w';
  const { data: lb, isLoading: loading, refetch } = useLeaderboard(hlWindow);

  const rows = useMemo(() => (lb?.leaderboardRows ?? []).map((r, i) => ({ ...r, rank: i + 1 })), [lb]);

  const handleSort = (col: SortKey) => {
    if (sort === col) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setDir('desc'); }
    setPage(1);
  };

  const filtered = rows.filter(e => !search || e.ethAddress.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    const va = parseFloat(String(a[sort] ?? 0));
    const vb = parseFloat(String(b[sort] ?? 0));
    return dir === 'asc' ? va - vb : vb - va;
  });

  const paginated = sorted.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < sorted.length;

  const handleExport = (fmt: 'csv' | 'json') => {
    const d = fmt === 'json' ? JSON.stringify(sorted, null, 2)
      : 'rank,address,accountValue,pnl,volume\n' + sorted.map(e => `${e.rank},${e.ethAddress},${e.accountValue},${e.windowPnl},${e.vlm}`).join('\n');
    const blob = new Blob([d], { type: fmt === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `leaderboard.${fmt}`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${fmt.toUpperCase()}`);
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-balance">Leaderboard</h1>
            <p className="text-xs text-muted-foreground text-pretty">Top performing traders ranked by PnL</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExport('csv')}>
              <Download className="w-3.5 h-3.5 mr-1" />CSV
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExport('json')}>
              <Download className="w-3.5 h-3.5 mr-1" />JSON
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
              <Share2 className="w-3.5 h-3.5 mr-1" />Share
            </Button>
          </div>
        </div>

        <div className="terminal-panel">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border">
            <Tabs value={tab} onValueChange={v => setTab(v as 'trader' | 'wallet')}>
              <TabsList className="h-8">
                <TabsTrigger value="trader" className="h-6 px-3 text-xs">Traders</TabsTrigger>
                <TabsTrigger value="wallet" className="h-6 px-3 text-xs">Wallets</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-1 flex-wrap">
              {(['1d', '7d', '30d', 'allTime'] as const).map(p => (
                <Button key={p} variant={period === p ? 'default' : 'ghost'} size="sm"
                  className="h-7 px-2.5 text-[11px]" onClick={() => setPeriod(p)}>
                  {PERIOD_LABELS[p]}
                </Button>
              ))}
            </div>

            <Input
              placeholder="Search address or label..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 text-xs w-full sm:w-48 font-mono"
            />
            <div className="text-[11px] text-muted-foreground shrink-0">
              {sorted.length.toLocaleString()} results
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  <SortHeader label="Rank" col="rank" sort={sort} dir={dir} onSort={handleSort} />
                  <th className="text-left text-[10px] text-muted-foreground px-3 py-2 font-medium uppercase whitespace-nowrap">Address</th>
                  <SortHeader label="PnL" col="windowPnl" sort={sort} dir={dir} onSort={handleSort} />
                  <SortHeader label="Acct Value" col="accountValue" sort={sort} dir={dir} onSort={handleSort} />
                  <SortHeader label="Volume" col="vlm" sort={sort} dir={dir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {loading ? null : paginated.map((e) => {
                  const isTop3 = e.rank <= 3;
                  const pnl = parseFloat(e.windowPnl);
                  return (
                    <tr key={e.ethAddress} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`text-xs font-bold ${isTop3 ? 'text-cyan' : 'text-muted-foreground'}`}>
                          {isTop3 ? ['🥇', '🥈', '🥉'][e.rank - 1] + ' ' : ''}{e.rank}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <Link to={`/wallet/${e.ethAddress}`} className="flex items-center gap-2 hover:underline">
                          <Address address={e.ethAddress} chars={5} />
                        </Link>
                      </td>
                      <td className={`px-3 py-2.5 text-xs font-mono font-semibold whitespace-nowrap ${pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {pnl >= 0 ? '+' : ''}{formatNumber(pnl)}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{formatNumber(parseFloat(e.accountValue))}</td>
                      <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{formatNumber(parseFloat(e.vlm))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loading && <TableSkeleton rows={10} />}
          </div>

          {/* Load More */}
          {!loading && hasMore && (
            <div className="p-4 text-center border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>
                Load More ({sorted.length - paginated.length} remaining)
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
