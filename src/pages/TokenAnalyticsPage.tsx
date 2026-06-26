import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Star, StarOff, Share2, Download, TrendingUp, TrendingDown, Users, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import Layout from '@/components/layout/Layout';
import { PriceChange, Address, StatCard, SectionHeader, StatusBadge } from '@/components/common/UIComponents';
import { CryptoIcon } from '@/components/common/CryptoIcon';
import { ChartSkeleton, TableSkeleton } from '@/components/common/Skeletons';
import {
  generateCandleData, generatePriceHistory,
  formatNumber, formatCompact, formatTime, formatPrice
} from '@/lib/mockData';
import { useLivePrices, useTokenList, useRecentTrades, useL2Book } from '@/lib/hooks';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import type { CandleData, ChartDataPoint } from '@/types';

const PERIODS = ['1H', '4H', '1D', '1W', '1M'];

function CandleStick({ data }: { data: CandleData[] }) {
  const VISIBLE = 60;
  const sliced = data.slice(-VISIBLE);
  const minP = Math.min(...sliced.map(d => d.low));
  const maxP = Math.max(...sliced.map(d => d.high));
  const range = maxP - minP;
  const W = 100 / VISIBLE;
  return (
    <svg viewBox={`0 0 100 80`} className="w-full" preserveAspectRatio="none" style={{ height: 180 }}>
      {sliced.map((c, i) => {
        const x = i * W + W * 0.5;
        const isUp = c.close >= c.open;
        const color = isUp ? 'hsl(145,70%,48%)' : 'hsl(348,90%,55%)';
        const bodyTop = ((maxP - Math.max(c.open, c.close)) / range) * 80;
        const bodyH = Math.max(0.5, ((Math.abs(c.close - c.open)) / range) * 80);
        const wickTop = ((maxP - c.high) / range) * 80;
        const wickBot = ((maxP - c.low) / range) * 80;
        return (
          <g key={i}>
            <line x1={x} y1={wickTop} x2={x} y2={wickBot} stroke={color} strokeWidth={0.15} />
            <rect x={i * W + W * 0.1} y={bodyTop} width={W * 0.8} height={bodyH} fill={color} opacity={0.85} />
          </g>
        );
      })}
    </svg>
  );
}

function HolderBar({ address, balance, pct, rank }: { address: string; balance: number; pct: number; rank: number }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-border/20 hover:bg-accent/30">
      <span className="text-[10px] text-muted-foreground w-5 text-right shrink-0">{rank}</span>
      <Address address={address} chars={5} className="flex-1 min-w-0" />
      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
        <div className="h-full bg-cyan rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-10 text-right shrink-0">{pct.toFixed(1)}%</span>
      <span className="text-xs font-mono w-20 text-right shrink-0">{formatCompact(balance)}</span>
    </div>
  );
}

function WhaleDistChart({ data }: { data: Array<{ label: string; pct: number }> }) {
  const COLORS = ['hsl(186,100%,50%)', 'hsl(145,70%,48%)', 'hsl(262,83%,65%)', 'hsl(38,92%,52%)', 'hsl(348,90%,55%)'];
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
          <span className="text-[11px] text-muted-foreground w-28 shrink-0">{d.label}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: COLORS[i % COLORS.length] }} />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground w-10 text-right shrink-0">{d.pct.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

export default function TokenAnalyticsPage() {
  const { symbol = 'ETH' } = useParams<{ symbol: string }>();
  const [chartPeriod, setChartPeriod] = useState('1D');
  const [chartType, setChartType] = useState<'candle' | 'line' | 'area'>('candle');
  const { isWatchlisted, addToWatchlist, removeFromWatchlist, watchlist } = useAppStore();
  const watchlisted = isWatchlisted(symbol);

  // Real API hooks — useLivePrices gives WS-updated prices merged with REST
  const livePrices = useLivePrices();
  const { data: tokenList, isLoading: tokenListLoading } = useTokenList();
  const { data: recentTrades } = useRecentTrades(symbol);
  const { data: l2Book } = useL2Book(symbol);

  const loading = tokenListLoading;

  // Find token info from tokenList
  const token = tokenList?.find(t => t.symbol === symbol) ?? tokenList?.[0] ?? null;
  const midPrice = livePrices[symbol] ?? token?.price ?? 0;

  // Generate candles seeded from real mid price
  const candles: CandleData[] = generateCandleData(200, midPrice || 1000);
  const history: ChartDataPoint[] = generatePriceHistory(30);

  // Recent trades for order flow table
  const transfers = recentTrades?.slice(0, 20).map((t, i) => ({
    id: String(i),
    side: t.side === 'B' ? 'buy' : 'sell',
    price: parseFloat(t.px),
    size: parseFloat(t.sz),
    value: parseFloat(t.px) * parseFloat(t.sz),
    timestamp: t.time / 1000,
  })) ?? [];

  // holders: derive from l2Book bids/asks as proxy for active participants
  const holders = l2Book
    ? [...l2Book.levels[0].slice(0, 8), ...l2Book.levels[1].slice(0, 7)].map((lvl, i) => ({
        address: `0x${i.toString(16).padStart(40, '0')}`,
        balance: parseFloat(lvl[1]),
        valueUsd: parseFloat(lvl[0]) * parseFloat(lvl[1]),
        pct: 0,
        rank: i + 1,
      }))
    : [];

  const whaleDistData = [
    { label: 'Top 11–50', pct: 22.7 },
    { label: 'Top 51–200', pct: 18.4 },
    { label: 'Mid-size', pct: 14.1 },
    { label: 'Retail (<100)', pct: 6.6 },
  ];

  const handleWatchlist = () => {
    if (watchlisted) {
      const item = watchlist.find(w => w.address === symbol);
      if (item) removeFromWatchlist(item.id);
      toast.info('Removed from watchlist');
    } else {
      addToWatchlist({ type: 'token', address: symbol });
      toast.success('Added to watchlist');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  const handleExport = (fmt: 'csv' | 'json') => {
    if (!token) return;
    const data = fmt === 'json'
      ? JSON.stringify({ token, transfers }, null, 2)
      : `symbol,price,change24h,volume,marketCap\n${token.symbol},${token.price},${token.priceChange24h},${token.volume24h},${token.marketCap}`;
    const blob = new Blob([data], { type: fmt === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${symbol}_analytics.${fmt}`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${fmt.toUpperCase()}`);
  };

  const lineData = history.map((p, i) => ({ i, v: p.value }));

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden">
              <CryptoIcon symbol={symbol} size={40} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{symbol}</h1>
                {token && <span className="text-sm text-muted-foreground">{token.name}</span>}
                <Badge variant="outline" className="text-[10px] text-cyan border-cyan/30">Token</Badge>
              </div>
              {token && (
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xl font-bold font-mono">{formatPrice(token.price)}</span>
                  <PriceChange value={token.priceChange24h} />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleWatchlist}>
              {watchlisted ? <StarOff className="w-3.5 h-3.5 mr-1" /> : <Star className="w-3.5 h-3.5 mr-1" />}
              {watchlisted ? 'Unwatch' : 'Watch'}
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleShare}>
              <Share2 className="w-3.5 h-3.5 mr-1" />Share
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExport('csv')}>
              <Download className="w-3.5 h-3.5 mr-1" />CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        {!loading && token ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="24h Volume" value={formatNumber(token.volume24h)} icon={<Activity className="w-4 h-4" />} />
            <StatCard label="Market Cap" value={formatNumber(token.marketCap)} icon={<TrendingUp className="w-4 h-4" />} />
            <StatCard label="Holders" value={(token.holders ?? 0).toLocaleString()} icon={<Users className="w-4 h-4" />} />
            <StatCard label="Total Supply" value={formatCompact(token.totalSupply ?? 0)} icon={<TrendingDown className="w-4 h-4" />} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="terminal-panel p-4 h-20 animate-pulse bg-muted/30" />
            ))}
          </div>
        )}

        {/* Price Chart */}
        <div className="terminal-panel p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <SectionHeader title="Price Chart" />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1">
                {(['candle', 'line', 'area'] as const).map(t => (
                  <Button key={t} variant={chartType === t ? 'default' : 'ghost'} size="sm"
                    className="h-6 px-2 text-[10px] capitalize" onClick={() => setChartType(t)}>{t}</Button>
                ))}
              </div>
              <div className="flex gap-1">
                {PERIODS.map(p => (
                  <Button key={p} variant={chartPeriod === p ? 'default' : 'ghost'} size="sm"
                    className="h-6 px-2 text-[10px]" onClick={() => setChartPeriod(p)}>{p}</Button>
                ))}
              </div>
            </div>
          </div>
          {loading ? <ChartSkeleton height={220} /> : (
            chartType === 'candle' ? (
              <div className="w-full overflow-hidden"><CandleStick data={candles} /></div>
            ) : chartType === 'line' ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis dataKey="i" hide />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${formatCompact(v)}`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '2px', fontSize: 11 }} formatter={(v: number) => [formatPrice(v), 'Price']} />
                  <Line type="monotone" dataKey="v" stroke="hsl(186,100%,50%)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={lineData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(186,100%,50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(186,100%,50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis dataKey="i" hide />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${formatCompact(v)}`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '2px', fontSize: 11 }} formatter={(v: number) => [formatPrice(v), 'Price']} />
                  <Area type="monotone" dataKey="v" stroke="hsl(186,100%,50%)" fill="url(#priceGrad)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )
          )}
        </div>

        {/* Holders + Whale Dist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="terminal-panel">
            <div className="p-4 pb-2">
              <SectionHeader title="Top Holders" subtitle={token ? `${(token.holders ?? 0).toLocaleString()} total holders` : ''} />
            </div>
            {loading ? <TableSkeleton rows={10} /> :
              holders.slice(0, 15).map((w, i) => (
                <HolderBar key={w.address} address={w.address} balance={w.balance} pct={Math.max(0.1, 40 / (w.rank))} rank={w.rank} />
              ))
            }
          </div>
          <div className="terminal-panel p-4">
            <SectionHeader title="Whale Distribution" subtitle="Token balance distribution by holder size" />
            {loading ? <div className="h-40 bg-muted animate-pulse rounded" /> : (
              <div className="space-y-6">
                <WhaleDistChart data={whaleDistData} />
                <div className="border-t border-border pt-4">
                  <SectionHeader title="Supply Info" />
                  {token && (
                    <div className="space-y-2">
                      {[
                        { label: 'Total Supply', value: formatCompact(token.totalSupply ?? 0) },
                        { label: 'Circulating', value: formatCompact(token.circulatingSupply ?? 0) },
                        { label: 'Non-Circulating', value: formatCompact((token.totalSupply ?? 0) - (token.circulatingSupply ?? 0)) },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center py-1 border-b border-border/30">
                          <span className="text-xs text-muted-foreground">{r.label}</span>
                          <span className="text-xs font-mono font-semibold">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transfer History */}
        <div className="terminal-panel">
          <div className="p-4 pb-2">
            <SectionHeader title="Transfer History" action={
              <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => handleExport('csv')}>
                <Download className="w-3 h-3 mr-1" />Export
              </Button>
            } />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  {['Side', 'Price', 'Size', 'Value', 'Time'].map(h => (
                    <th key={h} className="text-left text-[10px] text-muted-foreground px-3 py-2 font-medium uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? null : transfers.map(t => (
                  <tr key={t.id} className="border-b border-border/30 hover:bg-accent/20">
                    <td className="px-3 py-2 whitespace-nowrap"><span className={`text-xs font-semibold ${t.side === 'buy' ? 'text-positive' : 'text-negative'}`}>{t.side.toUpperCase()}</span></td>
                    <td className="px-3 py-2 text-xs font-mono whitespace-nowrap">{formatPrice(t.price)}</td>
                    <td className="px-3 py-2 text-xs font-mono whitespace-nowrap">{t.size.toFixed(4)}</td>
                    <td className="px-3 py-2 text-xs font-mono whitespace-nowrap">{formatNumber(t.value)}</td>
                    <td className="px-3 py-2 text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(t.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <TableSkeleton rows={6} />}
          </div>
        </div>

      </div>
    </Layout>
  );
}
