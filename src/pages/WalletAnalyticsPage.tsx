import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Star, StarOff, Share2, Download, TrendingUp, TrendingDown,
  BarChart2, Wallet, Copy, CheckCircle, RefreshCw, ExternalLink,
  Activity, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import Layout from '@/components/layout/Layout';
import { PriceChange, Address, StatusBadge, SectionHeader, StatCard } from '@/components/common/UIComponents';
import { CryptoIcon } from '@/components/common/CryptoIcon';
import { ChartSkeleton, TableSkeleton } from '@/components/common/Skeletons';
import { formatNumber, formatCompact, formatTime, formatPrice } from '@/lib/mockData';
import { useClearinghouseState, useUserFills, useOpenOrders, useUserFunding } from '@/lib/hooks';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import type { PortfolioAsset } from '@/types';

const PERIODS = [
  { label: '7D', value: 7 }, { label: '30D', value: 30 },
  { label: '90D', value: 90 }, { label: '1Y', value: 365 },
];

const PIE_COLORS = [
  'hsl(186,100%,50%)', 'hsl(145,70%,48%)', 'hsl(262,83%,65%)',
  'hsl(38,92%,52%)', 'hsl(348,90%,55%)', 'hsl(200,80%,55%)',
  'hsl(120,60%,45%)', 'hsl(30,80%,55%)',
];

function MiniPieChart({ data }: { data: PortfolioAsset[] }) {
  const total = data.reduce((s, d) => s + d.valueUsd, 0);
  if (total === 0) return null;
  let cumAngle = -90;
  const r = 45, cx = 60, cy = 60;
  const slices = data.map((d, i) => {
    const pct = d.valueUsd / total;
    const angle = pct * 360;
    const start = cumAngle;
    cumAngle += angle;
    const startRad = (start * Math.PI) / 180;
    const endRad = ((start + angle) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = angle > 180 ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: PIE_COLORS[i % PIE_COLORS.length] };
  });
  return (
    <svg viewBox="0 0 120 120" className="w-full max-w-[120px]">
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.85} />)}
      <circle cx={cx} cy={cy} r={28} fill="hsl(var(--card))" />
    </svg>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <AlertCircle className="w-8 h-8 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

const DEMO_ADDRESS = '0xDemoWallet000000000000000000000000000000';

export default function WalletAnalyticsPage() {
  const { address = DEMO_ADDRESS } = useParams<{ address: string }>();
  const [period, setPeriod] = useState(30);
  const [copied, setCopied] = useState(false);
  const { isWatchlisted, addToWatchlist, removeFromWatchlist, watchlist } = useAppStore();
  const watchlisted = isWatchlisted(address);

  const isValidAddress = address.startsWith('0x') && address.length === 42;

  // ── Real API hooks ────────────────────────────────────────────────────────
  const { data: clearinghouse, isLoading: chLoading, refetch: refetchCH } = useClearinghouseState(address);
  const { data: fills, isLoading: fillsLoading, refetch: refetchFills } = useUserFills(address);
  const { data: openOrders, isLoading: ordersLoading, refetch: refetchOrders } = useOpenOrders(address);
  const { data: fundingHistory, isLoading: fundingLoading, refetch: refetchFunding } = useUserFunding(address);

  const loading = chLoading || fillsLoading;
  const isDemo = !isValidAddress;

  const handleRefresh = () => {
    refetchCH(); refetchFills(); refetchOrders(); refetchFunding();
    toast.success('Data refreshed');
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const accountValue = parseFloat(clearinghouse?.marginSummary?.accountValue ?? '0');
  const totalMarginUsed = parseFloat(clearinghouse?.marginSummary?.totalMarginUsed ?? '0');
  const totalNtlPos = parseFloat(clearinghouse?.marginSummary?.totalNtlPos ?? '0');
  const withdrawable = parseFloat(clearinghouse?.withdrawable ?? '0');

  // Positions
  const positions = clearinghouse?.assetPositions?.map(ap => ({
    token: ap.position.coin,
    side: parseFloat(ap.position.szi) >= 0 ? 'long' as const : 'short' as const,
    size: Math.abs(parseFloat(ap.position.szi)),
    entryPrice: parseFloat(ap.position.entryPx ?? '0'),
    markPrice: parseFloat(ap.position.entryPx ?? '0'),
    positionValue: parseFloat(ap.position.positionValue ?? '0'),
    pnl: parseFloat(ap.position.unrealizedPnl),
    roi: parseFloat(ap.position.returnOnEquity) * 100,
    leverage: ap.position.leverage?.value ?? 1,
    margin: parseFloat(ap.position.marginUsed),
    liquidationPrice: parseFloat(ap.position.liquidationPx ?? '0'),
    maxLong: parseFloat(ap.position.maxTradeSzs?.[0] ?? '0'),
    maxShort: parseFloat(ap.position.maxTradeSzs?.[1] ?? '0'),
  })) ?? [];

  // Portfolio from positions
  const portfolio: PortfolioAsset[] = positions.slice(0, 8).map(p => ({
    token: p.token,
    symbol: p.token,
    balance: p.size,
    valueUsd: p.positionValue || p.size * p.markPrice,
    price: p.markPrice,
    pnl24h: p.pnl,
    pnlPercent: p.roi,
    allocation: accountValue > 0 ? ((p.positionValue || p.size * p.markPrice) / accountValue) * 100 : 0,
  }));

  // Open orders
  const orders = openOrders ?? [];

  // Fills-based stats
  const totalPnl = fills?.reduce((s, f) => s + parseFloat(f.closedPnl), 0) ?? 0;
  const wins = fills?.filter(f => parseFloat(f.closedPnl) > 0).length ?? 0;
  const losses = fills?.filter(f => parseFloat(f.closedPnl) < 0).length ?? 0;
  const totalTrades = fills?.length ?? 0;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const unrealizedPnl = positions.reduce((s, p) => s + p.pnl, 0);
  const avgTradeSize = totalTrades > 0
    ? (fills?.reduce((s, f) => s + parseFloat(f.sz) * parseFloat(f.px), 0) ?? 0) / totalTrades
    : 0;
  const largestWin = fills?.length ? Math.max(0, ...fills.map(f => parseFloat(f.closedPnl))) : 0;
  const largestLoss = fills?.length ? Math.min(0, ...fills.map(f => parseFloat(f.closedPnl))) : 0;
  const totalFees = fills?.reduce((s, f) => s + parseFloat(f.fee), 0) ?? 0;

  // Build equity chart from fills (cumulative PnL over time)
  const equityData = (() => {
    if (!fills?.length) return Array.from({ length: 30 }, (_, i) => ({ day: i, value: 0 }));
    const sorted = [...fills].sort((a, b) => a.time - b.time);
    // Filter to selected period
    const cutoff = Date.now() - period * 86400_000;
    const periodFills = sorted.filter(f => f.time > cutoff);
    let cum = 0;
    return periodFills.slice(-100).map((f, i) => {
      cum += parseFloat(f.closedPnl);
      return { day: i, value: cum, time: formatTime(f.time / 1000) };
    });
  })();

  // PnL by coin bar chart
  const pnlByCoin = (() => {
    if (!fills?.length) return [];
    const map: Record<string, number> = {};
    for (const f of fills) {
      map[f.coin] = (map[f.coin] ?? 0) + parseFloat(f.closedPnl);
    }
    return Object.entries(map)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 10)
      .map(([coin, pnl]) => ({ coin, pnl }));
  })();

  // Funding from API
  const fundingRows = fundingHistory?.map(fh => ({
    token: fh.delta.coin,
    payment: parseFloat(fh.delta.usdc),
    rate: parseFloat(fh.delta.fundingRate),
    size: parseFloat(fh.delta.szi),
    hash: fh.hash,
    timestamp: fh.time / 1000,
  })) ?? [];
  const totalFundingPaid = fundingRows.reduce((s, f) => s + f.payment, 0);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address disalin!');
  };

  const handleWatchlist = () => {
    if (watchlisted) {
      const item = watchlist.find(w => w.address === address);
      if (item) removeFromWatchlist(item.id);
      toast.info('Dihapus dari watchlist');
    } else {
      addToWatchlist({ type: 'wallet', address });
      toast.success('Ditambahkan ke watchlist');
    }
  };

  const handleExport = (fmt: 'csv' | 'json') => {
    const d = fmt === 'json'
      ? JSON.stringify({ address, accountValue, totalPnl, positions, orders, fills: fills?.slice(0, 50) }, null, 2)
      : `address,totalPnl,winRate,totalTrades,accountValue\n${address},${totalPnl},${winRate},${totalTrades},${accountValue}`;
    const blob = new Blob([d], { type: fmt === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `wallet_${address.slice(2, 8)}.${fmt}`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported sebagai ${fmt.toUpperCase()}`);
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-5">

        {/* Demo notice */}
        {isDemo && (
          <div className="terminal-panel p-3 flex items-center gap-2 border-yellow-500/30 bg-yellow-500/5">
            <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
            <p className="text-xs text-yellow-400">
              Mode demo — masukkan alamat wallet Hyperliquid yang valid (0x…) di URL untuk melihat data nyata.
              Contoh: <code className="font-mono">/wallet/0xYourAddress</code>
            </p>
          </div>
        )}

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-sm bg-cyan/10 border border-cyan/20 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-cyan" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold">{address.slice(0, 12)}…{address.slice(-6)}</span>
                <Badge variant="outline" className="text-[10px] text-cyan border-cyan/30 bg-cyan/5">
                  Wallet
                </Badge>
                {!loading && clearinghouse && (
                  <Badge variant="outline" className="text-[10px] text-positive border-positive/30 bg-positive/5">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">Hyperliquid Trader</span>
                {!loading && accountValue > 0 && (
                  <span className="text-xs font-mono font-semibold text-positive">{formatNumber(accountValue)} AV</span>
                )}
              </div>
            </div>
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground shrink-0 ml-1">
              {copied ? <CheckCircle className="w-4 h-4 text-positive" /> : <Copy className="w-4 h-4" />}
            </button>
            <a href={`https://app.hyperliquid.xyz/explorer/address/${address}`} target="_blank" rel="noreferrer"
              className="text-muted-foreground hover:text-cyan transition-colors shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleRefresh}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleWatchlist}>
              {watchlisted ? <StarOff className="w-3.5 h-3.5 mr-1" /> : <Star className="w-3.5 h-3.5 mr-1" />}
              {watchlisted ? 'Unwatch' : 'Watch'}
            </Button>
            <Link to={`/compare?a=${address}`}>
              <Button variant="outline" size="sm" className="h-8 text-xs">Compare</Button>
            </Link>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link disalin!'); }}>
              <Share2 className="w-3.5 h-3.5 mr-1" /><span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleExport('csv')}>
              <Download className="w-3.5 h-3.5 mr-1" />CSV
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleExport('json')}>
              <Download className="w-3.5 h-3.5 mr-1" />JSON
            </Button>
          </div>
        </motion.div>

        {/* ── Stats Grid ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="terminal-panel p-3 md:p-4 space-y-2 animate-pulse">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-6 w-28 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <StatCard label="Account Value" value={formatNumber(accountValue)} icon={<Wallet className="w-4 h-4" />} />
            <StatCard
              label="Total PnL"
              value={`${totalPnl >= 0 ? '+' : ''}${formatNumber(totalPnl)}`}
              valueClassName={totalPnl >= 0 ? 'text-positive' : 'text-negative'}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <StatCard label="Win Rate" value={totalTrades > 0 ? `${winRate.toFixed(1)}%` : '—'} icon={<CheckCircle className="w-4 h-4" />} />
            <StatCard label="Total Trades" value={totalTrades.toLocaleString()} icon={<Activity className="w-4 h-4" />} />
            <StatCard label="Unrealized PnL" value={`${unrealizedPnl >= 0 ? '+' : ''}${formatNumber(unrealizedPnl)}`}
              valueClassName={unrealizedPnl >= 0 ? 'text-positive' : 'text-negative'} />
            <StatCard label="Margin Used" value={formatNumber(totalMarginUsed)} />
            <StatCard label="Open Positions" value={positions.length.toString()} />
            <StatCard label="Withdrawable" value={formatNumber(withdrawable)} />
          </div>
        )}

        {/* ── Equity Curve + Portfolio ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Equity curve from real fills */}
          <div className="terminal-panel p-3 md:p-4 md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader title="Kurva Ekuitas" subtitle={`PnL kumulatif dari ${totalTrades} trade`} />
              <div className="flex gap-1">
                {PERIODS.map(p => (
                  <Button key={p.value} variant={period === p.value ? 'default' : 'ghost'} size="sm"
                    className="h-6 px-2 text-[10px]" onClick={() => setPeriod(p.value)}>
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
            {loading ? <ChartSkeleton height={180} /> : equityData.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={equityData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(186,100%,50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(186,100%,50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.floor(equityData.length / 6)} />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${formatCompact(v)}`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '2px', fontSize: 11 }}
                    formatter={(v: number) => [`$${formatNumber(v)}`, 'PnL Kumulatif']}
                    labelFormatter={(l) => (equityData[l as number] as { day: number; value: number; time?: string })?.time ?? `Trade ${l}`}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(186,100%,50%)" fill="url(#eqGrad)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState label="Tidak ada data trade untuk periode ini" />
            )}
          </div>

          {/* Portfolio allocation */}
          <div className="terminal-panel p-4">
            <SectionHeader title="Portofolio" subtitle="Alokasi posisi aktif" />
            {loading ? <div className="h-40 bg-muted animate-pulse rounded" /> : portfolio.length > 0 ? (
              <div className="flex gap-4 items-start mt-2">
                <MiniPieChart data={portfolio} />
                <div className="flex-1 space-y-1.5 min-w-0">
                  {portfolio.map((a, i) => (
                    <div key={a.token} className="flex items-center gap-1.5">
                      <CryptoIcon symbol={a.token} size={14} />
                      <span className="text-[10px] font-semibold w-10 shrink-0 truncate">{a.token}</span>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, a.allocation)}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{a.allocation.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState label="Tidak ada posisi aktif" />
            )}
          </div>
        </div>

        {/* ── PnL by Coin chart ──────────────────────────────────────────── */}
        {pnlByCoin.length > 0 && (
          <div className="terminal-panel p-4">
            <SectionHeader title="PnL per Koin" subtitle="Realized PnL dari semua trade" />
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={pnlByCoin} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="coin" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${formatCompact(v)}`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '2px', fontSize: 11 }}
                  formatter={(v: number) => [`$${formatNumber(v)}`, 'PnL']}
                />
                <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                  {pnlByCoin.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? 'hsl(145,70%,48%)' : 'hsl(348,90%,55%)'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="terminal-panel">
          <Tabs defaultValue="positions">
            <div className="px-3 md:px-4 pt-3 border-b border-border overflow-x-auto">
              <TabsList className="h-8 gap-0.5 flex-nowrap min-w-max">
                <TabsTrigger value="positions" className="h-7 px-2.5 text-xs whitespace-nowrap">
                  Posisi {positions.length > 0 && <Badge className="ml-1 h-4 px-1 text-[9px]">{positions.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="orders" className="h-7 px-2.5 text-xs whitespace-nowrap">
                  Orders {orders.length > 0 && <Badge className="ml-1 h-4 px-1 text-[9px]">{orders.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="fills" className="h-7 px-2.5 text-xs whitespace-nowrap">
                  Fills {fills && fills.length > 0 && <Badge className="ml-1 h-4 px-1 text-[9px]">{fills.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="funding" className="h-7 px-2.5 text-xs whitespace-nowrap">
                  Funding {fundingRows.length > 0 && <Badge className="ml-1 h-4 px-1 text-[9px]">{fundingRows.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="stats" className="h-7 px-2.5 text-xs whitespace-nowrap">Stats</TabsTrigger>
              </TabsList>
            </div>

            {/* ── Positions tab ─────────────────────────────────────────── */}
            <TabsContent value="positions" className="m-0">
              {loading ? <TableSkeleton rows={5} /> : positions.length === 0 ? (
                <EmptyState label="Tidak ada posisi terbuka" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        {['Token', 'Sisi', 'Ukuran', 'Entry', 'Mark', 'Nilai', 'Leverage', 'PnL', 'ROI', 'Margin', 'Liq. Price'].map(h => (
                          <th key={h} className="text-left text-[10px] text-muted-foreground px-3 py-2.5 font-medium uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((p, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <CryptoIcon symbol={p.token} size={18} />
                              <Link to={`/token/${p.token}`} className="text-xs font-semibold hover:text-cyan transition-colors">{p.token}</Link>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap"><StatusBadge status={p.side} /></td>
                          <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{p.size.toFixed(4)}</td>
                          <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{formatPrice(p.entryPrice)}</td>
                          <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{formatPrice(p.markPrice)}</td>
                          <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{formatNumber(p.positionValue)}</td>
                          <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{p.leverage}x</td>
                          <td className={`px-3 py-2.5 text-xs font-mono font-semibold whitespace-nowrap ${p.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {p.pnl >= 0 ? '+' : ''}{formatNumber(p.pnl)}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <PriceChange value={p.roi} showIcon={false} suffix="%" />
                          </td>
                          <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{formatNumber(p.margin)}</td>
                          <td className="px-3 py-2.5 text-xs font-mono text-negative whitespace-nowrap">
                            {p.liquidationPrice > 0 ? formatPrice(p.liquidationPrice) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── Orders tab ────────────────────────────────────────────── */}
            <TabsContent value="orders" className="m-0">
              {ordersLoading ? <TableSkeleton rows={5} /> : orders.length === 0 ? (
                <EmptyState label="Tidak ada order terbuka" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        {['Token', 'Sisi', 'Tipe', 'Harga', 'Ukuran', 'Sisa', 'Terisi %', 'Nilai', 'Status', 'Waktu'].map(h => (
                          <th key={h} className="text-left text-[10px] text-muted-foreground px-3 py-2.5 font-medium uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => {
                        const filled = ((parseFloat(o.origSz) - parseFloat(o.sz)) / parseFloat(o.origSz)) * 100;
                        return (
                          <tr key={o.oid} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <CryptoIcon symbol={o.coin} size={16} />
                                <span className="text-xs font-semibold">{o.coin}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap"><StatusBadge status={o.side === 'B' ? 'buy' : 'sell'} /></td>
                            <td className="px-3 py-2.5 text-xs capitalize whitespace-nowrap">{o.orderType}</td>
                            <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{formatPrice(parseFloat(o.limitPx))}</td>
                            <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{parseFloat(o.origSz).toFixed(4)}</td>
                            <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">{parseFloat(o.sz).toFixed(4)}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan rounded-full" style={{ width: `${filled}%` }} />
                                </div>
                                <span className="text-[10px] font-mono">{filled.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs font-mono whitespace-nowrap">
                              {formatNumber(parseFloat(o.limitPx) * parseFloat(o.origSz))}
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap"><StatusBadge status="open" /></td>
                            <td className="px-3 py-2.5 text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(o.timestamp / 1000)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── Fills / Trade History tab ─────────────────────────────── */}
            <TabsContent value="fills" className="m-0">
              {fillsLoading ? <TableSkeleton rows={8} /> : !fills?.length ? (
                <EmptyState label="Tidak ada riwayat trade" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        {['Token', 'Sisi', 'Harga', 'Ukuran', 'Nilai', 'PnL', 'Fee', 'Dir', 'Waktu'].map(h => (
                          <th key={h} className="text-left text-[10px] text-muted-foreground px-3 py-2.5 font-medium uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fills.slice(0, 100).map(f => {
                        const pnl = parseFloat(f.closedPnl);
                        return (
                          <tr key={f.tid} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <CryptoIcon symbol={f.coin} size={16} />
                                <Link to={`/token/${f.coin}`} className="text-xs font-semibold hover:text-cyan">{f.coin}</Link>
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap"><StatusBadge status={f.side === 'B' ? 'buy' : 'sell'} /></td>
                            <td className="px-3 py-2 text-xs font-mono whitespace-nowrap">{formatPrice(parseFloat(f.px))}</td>
                            <td className="px-3 py-2 text-xs font-mono whitespace-nowrap">{parseFloat(f.sz).toFixed(4)}</td>
                            <td className="px-3 py-2 text-xs font-mono whitespace-nowrap">{formatNumber(parseFloat(f.px) * parseFloat(f.sz))}</td>
                            <td className={`px-3 py-2 text-xs font-mono font-semibold whitespace-nowrap ${pnl > 0 ? 'text-positive' : pnl < 0 ? 'text-negative' : 'text-muted-foreground'}`}>
                              {pnl !== 0 ? `${pnl > 0 ? '+' : ''}${formatNumber(pnl)}` : '—'}
                            </td>
                            <td className="px-3 py-2 text-xs font-mono text-muted-foreground whitespace-nowrap">{formatNumber(Math.abs(parseFloat(f.fee)))}</td>
                            <td className="px-3 py-2 text-[10px] capitalize text-muted-foreground whitespace-nowrap">{f.dir}</td>
                            <td className="px-3 py-2 text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(f.time / 1000)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── Funding tab ───────────────────────────────────────────── */}
            <TabsContent value="funding" className="m-0">
              {fundingLoading ? <TableSkeleton rows={5} /> : fundingRows.length === 0 ? (
                <EmptyState label="Tidak ada riwayat funding" />
              ) : (
                <>
                  <div className="p-3 border-b border-border flex items-center gap-6 text-xs">
                    <span className="text-muted-foreground">Total Funding:</span>
                    <span className={`font-mono font-semibold ${totalFundingPaid >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {totalFundingPaid >= 0 ? '+' : ''}{formatNumber(totalFundingPaid)}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          {['Token', 'Pembayaran', 'Rate', 'Posisi', 'Tipe', 'Hash', 'Waktu'].map(h => (
                            <th key={h} className="text-left text-[10px] text-muted-foreground px-3 py-2.5 font-medium uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fundingRows.slice(0, 100).map((f, i) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <CryptoIcon symbol={f.token} size={16} />
                                <span className="text-xs font-semibold">{f.token}</span>
                              </div>
                            </td>
                            <td className={`px-3 py-2 text-xs font-mono font-semibold whitespace-nowrap ${f.payment >= 0 ? 'text-positive' : 'text-negative'}`}>
                              {f.payment >= 0 ? '+' : ''}{formatNumber(f.payment)}
                            </td>
                            <td className="px-3 py-2 text-xs font-mono whitespace-nowrap">{(f.rate * 100).toFixed(4)}%</td>
                            <td className="px-3 py-2 text-xs font-mono whitespace-nowrap">{f.size.toFixed(4)}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${f.payment >= 0 ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
                                {f.payment >= 0 ? 'Diterima' : 'Dibayar'}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <Address address={f.hash} chars={4} className="text-[10px]" />
                            </td>
                            <td className="px-3 py-2 text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(f.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </TabsContent>

            {/* ── Stats tab ─────────────────────────────────────────────── */}
            <TabsContent value="stats" className="m-0 p-3 md:p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <StatCard label="Trade Menang" value={wins.toLocaleString()} valueClassName="text-positive" />
                <StatCard label="Trade Kalah" value={losses.toLocaleString()} valueClassName="text-negative" />
                <StatCard label="Rata-rata Ukuran" value={formatNumber(avgTradeSize)} />
                <StatCard label="Rata-rata PnL/Trade" value={totalTrades > 0 ? formatNumber(totalPnl / totalTrades) : '—'} />
                <StatCard label="Kemenangan Terbesar" value={formatNumber(largestWin)} valueClassName="text-positive" />
                <StatCard label="Kerugian Terbesar" value={formatNumber(Math.abs(largestLoss))} valueClassName="text-negative" />
                <StatCard label="Total Fee" value={formatNumber(totalFees)} icon={<TrendingDown className="w-4 h-4" />} />
                <StatCard label="Total Funding" value={`${totalFundingPaid >= 0 ? '+' : ''}${formatNumber(totalFundingPaid)}`}
                  valueClassName={totalFundingPaid >= 0 ? 'text-positive' : 'text-negative'}
                  icon={<BarChart2 className="w-4 h-4" />} />
                <StatCard label="Total Notional" value={formatNumber(totalNtlPos)} />
                <StatCard label="Posisi Terbuka" value={positions.length.toString()} />
                <StatCard label="Koin Diperdagangkan" value={new Set(fills?.map(f => f.coin) ?? []).size.toString()} />
                <StatCard label="Koin Terbaik" value={pnlByCoin[0]?.coin ?? '—'} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </Layout>
  );
}
