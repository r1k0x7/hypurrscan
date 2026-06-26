import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/layout/Layout';
import { StatCard, Address, PriceChange, SectionHeader } from '@/components/common/UIComponents';
import {
  generateWalletStats, generateTokens, formatNumber, formatPercent, formatPrice
} from '@/lib/mockData';
import type { WalletStats, Token } from '@/types';

type CompareType = 'wallet' | 'token';

interface CompareItem {
  id: string;
  data: WalletStats | Token;
}

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const initAddr = searchParams.get('a');
  const [type, setType] = useState<CompareType>('wallet');
  const [items, setItems] = useState<CompareItem[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initAddr) {
      addItem(initAddr);
    }
  }, []);

  const addItem = (id: string) => {
    if (items.length >= 4 || !id.trim()) return;
    if (items.some(i => i.id === id)) return;
    setLoading(true);
    setTimeout(() => {
      if (type === 'wallet') {
        setItems(prev => [...prev, { id, data: generateWalletStats(id) }]);
      } else {
        const tokens = generateTokens(15);
        const t = tokens.find(tk => tk.symbol.toLowerCase() === id.toLowerCase()) || tokens[0];
        setItems(prev => [...prev, { id, data: { ...t, address: id } }]);
      }
      setLoading(false);
      setInputVal('');
    }, 300);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const isWallet = (d: WalletStats | Token): d is WalletStats => 'totalValue' in d;

  const walletMetrics = [
    { key: 'totalValue', label: 'Total Value', fmt: formatNumber },
    { key: 'totalPnl', label: 'Total PnL', fmt: formatNumber },
    { key: 'roi', label: 'ROI', fmt: (v: number) => formatPercent(v) },
    { key: 'winRate', label: 'Win Rate', fmt: (v: number) => `${v.toFixed(1)}%` },
    { key: 'totalTrades', label: 'Total Trades', fmt: (v: number) => v.toLocaleString() },
    { key: 'sharpeRatio', label: 'Sharpe Ratio', fmt: (v: number) => v.toFixed(2) },
    { key: 'maxDrawdown', label: 'Max Drawdown', fmt: (v: number) => `${v.toFixed(1)}%` },
  ];

  const tokenMetrics = [
    { key: 'price', label: 'Price', fmt: formatPrice },
    { key: 'priceChange24h', label: '24h Change', fmt: (v: number) => formatPercent(v) },
    { key: 'volume24h', label: 'Volume 24h', fmt: formatNumber },
    { key: 'marketCap', label: 'Market Cap', fmt: formatNumber },
    { key: 'holders', label: 'Holders', fmt: (v: number) => v.toLocaleString() },
  ];

  const metrics = type === 'wallet' ? walletMetrics : tokenMetrics;

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-lg font-bold text-balance">Compare</h1>
          <p className="text-xs text-muted-foreground text-pretty">Side-by-side comparison of wallets, tokens, or traders</p>
        </div>

        {/* Controls */}
        <div className="terminal-panel p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select value={type} onValueChange={v => { setType(v as CompareType); setItems([]); }}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wallet">Wallet</SelectItem>
              <SelectItem value="token">Token</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 flex-1 min-w-0">
            <Input
              placeholder={type === 'wallet' ? 'Enter wallet address...' : 'Enter token symbol...'}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem(inputVal)}
              className="h-8 text-xs font-mono flex-1"
            />
            <Button size="sm" className="h-8 text-xs shrink-0" onClick={() => addItem(inputVal)} disabled={loading || items.length >= 4}>
              <Plus className="w-3.5 h-3.5 mr-1" />Add
            </Button>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">{items.length}/4</span>
        </div>

        {items.length === 0 ? (
          <div className="terminal-panel p-12 flex flex-col items-center justify-center gap-3 text-center">
            <ArrowLeftRight className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Add up to 4 {type}s to compare side-by-side</p>
          </div>
        ) : (
          <div className="terminal-panel overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] text-muted-foreground px-4 py-3 font-medium uppercase w-32">Metric</th>
                  {items.map(item => (
                    <th key={item.id} className="text-left px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          {type === 'wallet' ? (
                            <Address address={item.id} chars={5} className="text-xs" />
                          ) : (
                            <span className="text-xs font-semibold text-cyan">{item.id.toUpperCase()}</span>
                          )}
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-negative">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => {
                  const values = items.map(item => {
                    const data = item.data as unknown as Record<string, number>;
                    return data[m.key] ?? 0;
                  });
                  const max = Math.max(...values);
                  const min = Math.min(...values);
                  return (
                    <tr key={m.key} className="border-b border-border/30">
                      <td className="px-4 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap font-medium">{m.label}</td>
                      {items.map((item, i) => {
                        const val = values[i];
                        const isMax = val === max && max !== min;
                        const isMin = val === min && max !== min;
                        return (
                          <td key={item.id} className={`px-4 py-2.5 text-xs font-mono whitespace-nowrap ${isMax ? 'text-positive' : isMin ? 'text-negative' : ''}`}>
                            {m.fmt(val)}
                            {isMax && <span className="text-[9px] ml-1 text-positive">▲ BEST</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
