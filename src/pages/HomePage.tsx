import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Activity, TrendingUp, TrendingDown, Zap, BarChart2,
  ArrowRight, ExternalLink, RefreshCw, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import Layout from '@/components/layout/Layout';
import { StatCard, PriceChange, Address, SectionHeader, StatusBadge } from '@/components/common/UIComponents';
import { CryptoIcon } from '@/components/common/CryptoIcon';
import { StatCardSkeleton, FeedItemSkeleton } from '@/components/common/Skeletons';
import {
  generateTransactions, generateLiquidations,
  formatNumber, formatCompact, formatTime, formatPrice
} from '@/lib/mockData';
import { realtimeEmitter } from '@/lib/websocket';
import { useMarketStats, useTokenList, useLeaderboardRows } from '@/lib/hooks';
import type { HLWSTrade } from '@/lib/websocket';
import type { Transaction, Liquidation } from '@/types';

// Local token shape used by TokenRow (derived from useTokenList)
interface TokenRowData {
  symbol: string; name: string; price: number;
  priceChange24h: number; volume24h: number; marketCap: number;
}

const VOLUME_HISTORY = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  volume: 150 + Math.random() * 250,
  oi: 120 + Math.random() * 180,
}));

const MARKET_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 8000 + Math.sin(i * 0.3) * 1500 + Math.random() * 500,
}));

function TradeItem({ trade, flash }: { trade: HLWSTrade; flash?: boolean }) {
  const isBuy = trade.side === 'B';
  const value = parseFloat(trade.px) * parseFloat(trade.sz);
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border-b border-border/30 hover:bg-accent/30 transition-colors ${flash ? (isBuy ? 'flash-positive' : 'flash-negative') : ''}`}>
      <div className={`w-1.5 h-8 rounded-full shrink-0 ${isBuy ? 'bg-positive' : 'bg-negative'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold">{trade.coin}</span>
          <StatusBadge status={isBuy ? 'buy' : 'sell'} />
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{trade.hash.slice(0, 10)}…</span>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-mono font-semibold">{formatNumber(value)}</div>
        <div className="text-[10px] text-muted-foreground">{formatTime(trade.time / 1000)}</div>
      </div>
    </div>
  );
}

function TxItem({ tx }: { tx: Transaction }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 hover:bg-accent/30 transition-colors">
      <div className="w-7 h-7 rounded-sm bg-muted flex items-center justify-center shrink-0">
        <Activity className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Address address={tx.hash} chars={4} className="text-[10px]" linkTo={`/explorer/transactions/${tx.hash}`} />
          <StatusBadge status={tx.status} />
        </div>
        <div className="text-[10px] text-muted-foreground capitalize">{tx.type}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-mono">{formatNumber(tx.valueUsd)}</div>
        <div className="text-[10px] text-muted-foreground">{formatTime(tx.timestamp)}</div>
      </div>
    </div>
  );
}

function LiqItem({ liq }: { liq: Liquidation }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 hover:bg-accent/30 transition-colors">
      <div className="w-7 h-7 rounded-sm bg-negative/10 flex items-center justify-center shrink-0">
        <Zap className="w-3.5 h-3.5 text-negative" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold">{liq.token}</span>
          <span className="text-[10px] text-muted-foreground">{liq.size.toFixed(3)}</span>
        </div>
        <Address address={liq.wallet} chars={4} className="text-[10px]" />
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-mono text-negative">{formatNumber(liq.value)}</div>
        <div className="text-[10px] text-muted-foreground">{formatTime(liq.timestamp)}</div>
      </div>
    </div>
  );
}

function TokenRow({ token, rank }: { token: TokenRowData; rank: number }) {
  return (
    <Link to={`/token/${token.symbol}`} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/30 transition-colors border-b border-border/20">
      <span className="text-[10px] text-muted-foreground w-5 shrink-0 text-right">{rank}</span>
      <CryptoIcon symbol={token.symbol} size={22} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold">{token.symbol}</div>
        <div className="text-[10px] text-muted-foreground">{formatNumber(token.volume24h)} vol</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-mono">{formatPrice(token.price)}</div>
        <PriceChange value={token.priceChange24h} showIcon={false} />
      </div>
    </Link>
  );
}

function LeaderRow({ entry }: { entry: { rank: number; ethAddress: string; windowPnl: string; vlm: string } }) {
  const isTop3 = entry.rank <= 3;
  const pnl = parseFloat(entry.windowPnl);
  return (
    <Link to={`/wallet/${entry.ethAddress}`} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/30 transition-colors border-b border-border/20">
      <span className={`text-xs font-bold w-5 shrink-0 text-right ${isTop3 ? 'text-cyan' : 'text-muted-foreground'}`}>
        {entry.rank}
      </span>
      <Address address={entry.ethAddress} chars={4} className="flex-1 min-w-0" />
      <div className="text-right shrink-0">
        <div className={`text-xs font-mono font-semibold ${pnl >= 0 ? 'text-positive' : 'text-negative'}`}>
          {pnl >= 0 ? '+' : ''}{formatCompact(pnl)}
        </div>
        <div className="text-[10px] text-muted-foreground">{formatCompact(parseFloat(entry.vlm))} vol</div>
      </div>
    </Link>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-sm px-2 py-1.5 text-[10px]">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-foreground font-mono">{p.name}: {formatCompact(p.value)}B</div>
      ))}
    </div>
  );
};

export default function HomePage() {
  const { data: stats, isLoading: statsLoading } = useMarketStats();
  const { data: tokens, isLoading: tokensLoading } = useTokenList();
  const { data: leaderboard, isLoading: lbLoading } = useLeaderboardRows('1w');
  const [txns] = useState<Transaction[]>(() => generateTransactions(20));
  const [liqs, setLiqs] = useState<Liquidation[]>(() => generateLiquidations(20));
  const [liveWSTrades, setLiveWSTrades] = useState<HLWSTrade[]>([]);
  const [newTradeId, setNewTradeId] = useState<string | null>(null);
  const loading = statsLoading || tokensLoading;
  const [activeTab, setActiveTab] = useState<'tokens' | 'wallets'>('tokens');

  useEffect(() => {
    const unsubTrade = realtimeEmitter.subscribe('trades', (data) => {
      const t = data as HLWSTrade;
      const tid = String(t.tid);
      setLiveWSTrades(prev => [t, ...prev].slice(0, 20));
      setNewTradeId(tid);
      setTimeout(() => setNewTradeId(null), 400);
    });
    const unsubLiq = realtimeEmitter.subscribe('liquidations', (data) => {
      const liq = data as Liquidation;
      setLiqs(prev => [liq, ...prev].slice(0, 20));
    });
    return () => { unsubTrade(); unsubLiq(); };
  }, []);

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center py-4 md:py-6"
        >
          <h1 className="text-xl md:text-3xl font-bold gradient-text mb-2 text-balance">
            Hyperliquid Analytics Platform
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground text-pretty max-w-xl mx-auto px-2">
            Real-time blockchain explorer, wallet analytics, dan market intelligence untuk jaringan Hyperliquid.
          </p>
        </motion.div>

        {/* Market Stats */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : stats ? (
              <>
                <StatCard
                  label="24h Volume"
                  value={formatNumber(stats.totalVolume24h)}
                  change={stats.volumeChange}
                  icon={<BarChart2 className="w-4 h-4" />}
                />
                <StatCard
                  label="Open Interest"
                  value={formatNumber(stats.openInterest)}
                  change={stats.oiChange}
                  icon={<Activity className="w-4 h-4" />}
                />
                <StatCard
                  label="TVL"
                  value={formatNumber(stats.tvl)}
                  change={stats.tvlChange}
                  icon={<Globe className="w-4 h-4" />}
                />
                <StatCard
                  label="Market Cap"
                  value={formatNumber(stats.marketCap)}
                  change={stats.mcapChange}
                  icon={<TrendingUp className="w-4 h-4" />}
                />
              </>
            ) : null}
          </div>
        </section>

        {/* Secondary Stats */}
        {!loading && stats && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <StatCard label="Active Trades" value={stats.activeTrades.toLocaleString()} icon={<Zap className="w-4 h-4" />} />
            <StatCard label="Active Wallets" value={stats.activeWallets.toLocaleString()} icon={<TrendingUp className="w-4 h-4" />} />
            <StatCard label="24h Liquidations" value={stats.totalLiquidations24h.toLocaleString()} icon={<TrendingDown className="w-4 h-4" />} />
            <StatCard label="Liq. Volume" value={formatNumber(stats.liquidationsValue24h)} icon={<Zap className="w-4 h-4" />} />
          </section>
        )}

        {/* Charts Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="terminal-panel p-3 md:p-4">
            <SectionHeader title="Volume 24h" subtitle="Hourly trading volume" />
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={VOLUME_HISTORY} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={5} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="volume" fill="hsl(186,100%,50%)" opacity={0.7} radius={[1, 1, 0, 0]} name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="terminal-panel p-3 md:p-4">
            <SectionHeader title="TVL Trend" subtitle="30-day total value locked" />
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={MARKET_HISTORY} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145,70%,48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(145,70%,48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={9} />
                <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}B`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="hsl(145,70%,48%)" fill="url(#tvlGrad)" strokeWidth={1.5} name="TVL" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Trending + Leaderboard Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Trending */}
          <div className="terminal-panel h-full flex flex-col">
            <div className="p-3 md:p-4 pb-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-balance">Trending</h2>
                <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'tokens' | 'wallets')}>
                  <TabsList className="h-6 text-[10px]">
                    <TabsTrigger value="tokens" className="h-5 px-2 text-[10px]">Tokens</TabsTrigger>
                    <TabsTrigger value="wallets" className="h-5 px-2 text-[10px]">Wallets</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <FeedItemSkeleton key={i} />)
              ) : activeTab === 'tokens' ? (
                tokens.slice(0, 8).map((t, i) => <TokenRow key={t.symbol} token={t} rank={i + 1} />)
              ) : (
                leaderboard.slice(0, 8).map((entry, i) => (
                  <Link key={entry.rank} to={`/wallet/${entry.ethAddress}`} className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] hover:bg-accent/30 transition-colors border-b border-border/20">
                    <span className="text-[10px] text-muted-foreground w-5 shrink-0 text-right">{i + 1}</span>
                    <Address address={entry.ethAddress} chars={4} className="flex-1 min-w-0" />
                    <div className="text-right shrink-0">
                      <div className={`text-xs font-mono ${parseFloat(entry.windowPnl) >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {parseFloat(entry.windowPnl) >= 0 ? '+' : ''}{formatCompact(parseFloat(entry.windowPnl))}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{formatCompact(parseFloat(entry.vlm))} vol</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <div className="p-3 border-t border-border">
              <Link to={activeTab === 'tokens' ? '/explorer/tokens' : '/explorer/wallets'}>
                <Button variant="ghost" size="sm" className="w-full h-8 text-[11px] text-muted-foreground hover:text-foreground">
                  Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div className="terminal-panel h-full flex flex-col">
            <div className="p-3 md:p-4 pb-0">
              <SectionHeader
                title="Leaderboard"
                subtitle="Top trader 7d PnL"
                action={
                  <Link to="/leaderboard">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                      Full <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  </Link>
                }
              />
            </div>
            <div className="flex-1 overflow-hidden">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <FeedItemSkeleton key={i} />)
              ) : (
                leaderboard.slice(0, 8).map(entry => <LeaderRow key={entry.rank} entry={entry} />)
              )}
            </div>
          </div>

          {/* Analytics */}
          <div className="terminal-panel p-3 md:p-4 h-full flex flex-col gap-3">
            <SectionHeader title="Market Analytics" subtitle="Perubahan harga 24h" />
            <div className="space-y-2.5 flex-1">
              {tokens.slice(0, 6).map(t => (
                <div key={t.symbol} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono w-12 shrink-0 text-muted-foreground">{t.symbol}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${t.priceChange24h >= 0 ? 'bg-positive' : 'bg-negative'}`}
                      style={{ width: `${Math.min(100, Math.abs(t.priceChange24h) * 5)}%` }}
                    />
                  </div>
                  <PriceChange value={t.priceChange24h} showIcon={false} className="w-14 text-right" />
                </div>
              ))}
            </div>
            <div className="mt-auto">
              <ResponsiveContainer width="100%" height={70}>
                <LineChart data={MARKET_HISTORY.slice(-14)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Line type="monotone" dataKey="value" stroke="hsl(186,100%,50%)" strokeWidth={1.5} dot={false} />
                  <Tooltip content={<CustomTooltip />} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Live Feeds */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* Latest Trades */}
          <div className="terminal-panel flex flex-col max-h-[360px] md:max-h-[400px]">
            <div className="p-3 md:p-4 pb-2 shrink-0">
              <SectionHeader title="Latest Trades" live action={
                <Link to="/dashboard"><Button variant="ghost" size="sm" className="h-6 text-[10px]">More <ArrowRight className="w-3 h-3 ml-0.5" /></Button></Link>
              } />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? Array.from({ length: 6 }).map((_, i) => <FeedItemSkeleton key={i} />) :
                liveWSTrades.map(t => <TradeItem key={t.tid} trade={t} flash={String(t.tid) === newTradeId} />)
              }
            </div>
          </div>

          {/* Latest Transactions */}
          <div className="terminal-panel flex flex-col max-h-[360px] md:max-h-[400px]">
            <div className="p-3 md:p-4 pb-2 shrink-0">
              <SectionHeader title="Latest Transactions" live action={
                <Link to="/explorer/transactions"><Button variant="ghost" size="sm" className="h-6 text-[10px]">More <ArrowRight className="w-3 h-3 ml-0.5" /></Button></Link>
              } />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? Array.from({ length: 6 }).map((_, i) => <FeedItemSkeleton key={i} />) :
                txns.map(t => <TxItem key={t.hash} tx={t} />)
              }
            </div>
          </div>

          {/* Latest Liquidations */}
          <div className="terminal-panel flex flex-col max-h-[360px] md:max-h-[400px]">
            <div className="p-3 md:p-4 pb-2 shrink-0">
              <SectionHeader title="Latest Liquidations" live action={
                <Link to="/whales"><Button variant="ghost" size="sm" className="h-6 text-[10px]">More <ArrowRight className="w-3 h-3 ml-0.5" /></Button></Link>
              } />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? Array.from({ length: 6 }).map((_, i) => <FeedItemSkeleton key={i} />) :
                liqs.map(l => <LiqItem key={l.id} liq={l} />)
              }
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
