import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Zap, TrendingUp, Globe, BarChart2, RefreshCw } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '@/components/layout/Layout';
import { StatCard, SectionHeader, Address, StatusBadge, PriceChange } from '@/components/common/UIComponents';
import { CryptoIcon } from '@/components/common/CryptoIcon';
import { StatCardSkeleton, FeedItemSkeleton } from '@/components/common/Skeletons';
import {
  generateLiquidations, generateFundingRates, formatNumber, formatTime, formatCompact
} from '@/lib/mockData';
import { realtimeEmitter } from '@/lib/websocket';
import { useMarketStats, useMetaAndAssetCtxs } from '@/lib/hooks';
import type { HLWSTrade } from '@/lib/websocket';
import type { Liquidation, FundingRate, WhaleTransaction } from '@/types';

const generateSparkline = (n = 20) =>
  Array.from({ length: n }, (_, i) => ({ i, v: 50 + Math.sin(i * 0.5) * 20 + Math.random() * 15 }));

const OI_DATA = generateSparkline();
const FUND_DATA = Array.from({ length: 20 }, (_, i) => ({ i, v: (Math.random() - 0.4) * 0.1 }));
const VOL_DATA = generateSparkline();
const TVL_DATA = generateSparkline();

const MiniChart = ({ data, dataKey, color, type = 'area' }: { data: object[]; dataKey: string; color: string; type?: 'area' | 'bar' | 'line' }) => (
  <ResponsiveContainer width="100%" height={48}>
    {type === 'bar' ? (
      <BarChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <Bar dataKey={dataKey} fill={color} opacity={0.7} />
      </BarChart>
    ) : type === 'line' ? (
      <LineChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    ) : (
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`g_${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#g_${color.replace(/[^a-z]/gi, '')})`} strokeWidth={1.5} dot={false} />
      </AreaChart>
    )}
  </ResponsiveContainer>
);

function WidgetCard({ title, value, change, chart, chartType = 'area', chartColor, icon: Icon }: {
  title: string; value: string; change?: number; chart: object[];
  chartType?: 'area' | 'bar' | 'line'; chartColor: string; icon: React.ElementType;
}) {
  return (
    <div className="terminal-panel p-4 h-full">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-base font-bold font-mono mt-0.5">{value}</p>
          {change !== undefined && <PriceChange value={change} showIcon={false} />}
        </div>
        <div className="w-7 h-7 rounded-sm bg-muted flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
      <MiniChart data={chart} dataKey="v" color={chartColor} type={chartType} />
    </div>
  );
}

function FundingRow({ fr }: { fr: FundingRate }) {
  const isPos = fr.rate > 0;
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-border/30 hover:bg-accent/30">
      <div className="w-6 h-6 rounded-full bg-cyan/10 flex items-center justify-center shrink-0">
        <CryptoIcon symbol={fr.token} size={20} />
      </div>
      <span className="text-xs font-semibold flex-1">{fr.token}</span>
      <div className="text-right">
        <span className={`text-xs font-mono font-semibold ${isPos ? 'text-positive' : 'text-negative'}`}>
          {isPos ? '+' : ''}{(fr.rate * 100).toFixed(4)}%
        </span>
        <div className="text-[10px] text-muted-foreground">{fr.annualized.toFixed(1)}% ann.</div>
      </div>
    </div>
  );
}

function WhaleRow({ tx }: { tx: WhaleTransaction }) {
  const typeColors: Record<string, string> = {
    buy: 'text-positive', sell: 'text-negative', transfer: 'text-cyan', liquidation: 'text-warning'
  };
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 hover:bg-accent/30">
      <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 live-dot" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold">{tx.token}</span>
          <span className={`text-[10px] font-medium capitalize ${typeColors[tx.type] || ''}`}>{tx.type}</span>
        </div>
        <Address address={tx.wallet} chars={4} />
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-mono font-semibold">{formatNumber(tx.valueUsd)}</div>
        <div className="text-[10px] text-muted-foreground">{formatTime(tx.timestamp)}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useMarketStats();
  const { data: meta } = useMetaAndAssetCtxs();
  const [liveTrades, setLiveTrades] = useState<HLWSTrade[]>([]);
  const [liqs] = useState<Liquidation[]>(() => generateLiquidations(15));
  const [whales, setWhales] = useState<WhaleTransaction[]>([]);
  const loading = statsLoading;

  // Build funding rates from real metaAndAssetCtxs
  const funding: FundingRate[] = meta
    ? meta[0].universe.slice(0, 20).map((u, i) => ({
        token: u.name,
        rate: parseFloat(meta[1][i]?.funding ?? '0'),
        nextFunding: Date.now() + 3600_000,
        predicted: parseFloat(meta[1][i]?.funding ?? '0') * 1.05,
        annualized: parseFloat(meta[1][i]?.funding ?? '0') * 8760 * 100,
      }))
    : generateFundingRates();

  useEffect(() => {
    const u1 = realtimeEmitter.subscribe('trades', (d) => {
      const t = d as HLWSTrade;
      setLiveTrades(p => [t, ...p].slice(0, 30));
      const value = parseFloat(t.px) * parseFloat(t.sz);
      if (value >= 500_000) {
        const whale: WhaleTransaction = {
          id: String(t.tid),
          timestamp: t.time / 1000,
          wallet: t.hash.slice(0, 42),
          token: t.coin,
          type: t.side === 'B' ? 'buy' : 'sell',
          amount: parseFloat(t.sz),
          valueUsd: value,
          txHash: t.hash,
        };
        setWhales(prev => [whale, ...prev].slice(0, 15));
      }
    });
    return () => { u1(); };
  }, []);

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base md:text-lg font-bold text-balance">Realtime Dashboard</h1>
            <p className="text-xs text-muted-foreground text-pretty">Live market data via WebSocket</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-positive/10 border border-positive/20">
              <div className="w-1.5 h-1.5 rounded-full bg-positive live-dot" />
              <span className="text-[10px] text-positive font-medium">STREAMING</span>
            </div>
          </div>
        </div>

        {/* Widgets Row */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
          {loading ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />) : (
            <>
              <WidgetCard title="Open Interest" value={formatNumber(stats?.openInterest || 0)}
                change={stats?.oiChange} chart={OI_DATA} chartColor="hsl(186,100%,50%)" icon={Activity} />
              <WidgetCard title="Funding Rate" value={`${(funding[0]?.rate * 100 || 0.01).toFixed(4)}%`}
                chart={FUND_DATA} chartColor="hsl(38,92%,52%)" chartType="line" icon={Zap} />
              <WidgetCard title="24h Volume" value={formatNumber(stats?.totalVolume24h || 0)}
                change={stats?.volumeChange} chart={VOL_DATA} chartColor="hsl(145,70%,48%)" chartType="bar" icon={BarChart2} />
              <WidgetCard title="TVL" value={formatNumber(stats?.tvl || 0)}
                change={stats?.tvlChange} chart={TVL_DATA} chartColor="hsl(262,83%,65%)" icon={Globe} />
              <WidgetCard title="Market Cap" value={formatNumber(stats?.marketCap || 0)}
                change={stats?.mcapChange} chart={generateSparkline()} chartColor="hsl(348,90%,55%)" icon={TrendingUp} />
            </>
          )}
        </section>

        {/* Main feeds */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Recent Trades */}
          <div className="terminal-panel flex flex-col max-h-[380px] md:max-h-[500px]">
            <div className="p-3 md:p-4 pb-2 shrink-0">
              <SectionHeader title="Recent Trades" live />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? Array.from({ length: 8 }).map((_, i) => <FeedItemSkeleton key={i} />) :
                liveTrades.map(t => (
                  <div key={t.tid} className="flex items-center gap-2 px-3 py-2 min-h-[40px] border-b border-border/30 hover:bg-accent/30">
                    <div className={`w-1.5 h-6 rounded-full shrink-0 ${t.side === 'B' ? 'bg-positive' : 'bg-negative'}`} />
                    <span className="text-xs font-semibold w-12 shrink-0 truncate">{t.coin}</span>
                    <span className={`text-[10px] font-mono flex-1 min-w-0 truncate ${t.side === 'B' ? 'text-positive' : 'text-negative'}`}>
                      ${parseFloat(t.px).toFixed(parseFloat(t.px) > 100 ? 2 : 4)}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">{formatCompact(parseFloat(t.px) * parseFloat(t.sz))}</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Liquidations */}
          <div className="terminal-panel flex flex-col max-h-[380px] md:max-h-[500px]">
            <div className="p-3 md:p-4 pb-2 shrink-0">
              <SectionHeader title="Liquidations" live />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? Array.from({ length: 8 }).map((_, i) => <FeedItemSkeleton key={i} />) :
                liqs.map(l => (
                  <div key={l.id} className="flex items-center gap-2 px-3 py-2 min-h-[40px] border-b border-border/30 hover:bg-accent/30">
                    <div className="w-6 h-6 rounded-sm bg-negative/10 flex items-center justify-center shrink-0">
                      <Zap className="w-3 h-3 text-negative" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{l.token}</div>
                      <Address address={l.wallet} chars={4} />
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-negative">{formatNumber(l.value)}</div>
                      <div className="text-[10px] text-muted-foreground">{formatTime(l.timestamp)}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Funding Rates */}
          <div className="terminal-panel flex flex-col max-h-[380px] md:max-h-[500px]">
            <div className="p-3 md:p-4 pb-2 shrink-0">
              <SectionHeader title="Funding Rates" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? Array.from({ length: 8 }).map((_, i) => <FeedItemSkeleton key={i} />) :
                funding.map(fr => <FundingRow key={fr.token} fr={fr} />)
              }
            </div>
          </div>

          {/* Whale Activity */}
          <div className="terminal-panel flex flex-col max-h-[380px] md:max-h-[500px]">
            <div className="p-3 md:p-4 pb-2 shrink-0">
              <SectionHeader title="Whale Activity" live />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? Array.from({ length: 8 }).map((_, i) => <FeedItemSkeleton key={i} />) :
                whales.map(w => <WhaleRow key={w.id} tx={w} />)
              }
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
