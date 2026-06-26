import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Wallet, TrendingUp, Hash, Layers, Code, Shield, Vault, Image, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Layout from '@/components/layout/Layout';
import { Address, EmptyState } from '@/components/common/UIComponents';
import {
  generateWallets, generateTokens, generateTransactions,
  generateBlocks, generateContracts, generateValidators,
  formatNumber, formatTime, formatPrice
} from '@/lib/mockData';
import type { SearchResult } from '@/types';

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; path: (id: string) => string }> = {
  wallet:      { label: 'Wallet',      icon: Wallet,    color: 'bg-cyan/10 text-cyan border-cyan/20',           path: id => `/wallet/${id}` },
  token:       { label: 'Token',       icon: TrendingUp, color: 'bg-positive/10 text-positive border-positive/20', path: id => `/token/${id}` },
  transaction: { label: 'Transaction', icon: Hash,      color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', path: id => `/explorer/transactions/${id}` },
  block:       { label: 'Block',       icon: Layers,    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', path: id => `/explorer/blocks/${id}` },
  contract:    { label: 'Contract',    icon: Code,      color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', path: id => `/explorer/contracts/${id}` },
  validator:   { label: 'Validator',   icon: Shield,    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   path: id => `/explorer/validators/${id}` },
  nft:         { label: 'NFT',         icon: Image,     color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',   path: id => `/explorer/nfts/${id}` },
  hyperevm:    { label: 'HyperEVM',    icon: Globe,     color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',   path: id => `/explorer/hyperevm/${id}` },
};

interface GroupedResults {
  type: string;
  results: SearchResult[];
}

function runSearch(query: string): GroupedResults[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const groups: GroupedResults[] = [];

  if (q.startsWith('0x')) {
    const wallets = generateWallets(5).map(w => ({
      type: 'wallet' as const,
      id: w.address,
      title: w.address,
      subtitle: `Balance: ${formatNumber(w.balanceUsd)}`,
      value: w.balanceUsd,
    }));
    if (wallets.length) groups.push({ type: 'wallet', results: wallets });

    const contracts = generateContracts(3).map(c => ({
      type: 'contract' as const,
      id: c.address,
      title: c.name || c.address,
      subtitle: `${c.type.toUpperCase()} · ${c.verified ? 'Verified' : 'Unverified'}`,
    }));
    if (contracts.length) groups.push({ type: 'contract', results: contracts });

    if (q.length === 66) {
      const txns = generateTransactions(2).map(t => ({
        type: 'transaction' as const,
        id: t.hash,
        title: t.hash,
        subtitle: `${t.type} · ${formatNumber(t.valueUsd)}`,
      }));
      groups.push({ type: 'transaction', results: txns });
    }
  } else if (/^\d+$/.test(q)) {
    const blocks = generateBlocks(3).map(b => ({
      type: 'block' as const,
      id: String(b.number),
      title: `Block #${b.number.toLocaleString()}`,
      subtitle: `${b.txCount} transactions · ${formatTime(b.timestamp)}`,
    }));
    groups.push({ type: 'block', results: blocks });
  } else {
    const tokens = generateTokens(15)
      .filter(t => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => ({
        type: 'token' as const,
        id: t.symbol,
        title: t.symbol,
        subtitle: `${t.name} · ${formatPrice(t.price)}`,
        value: t.price,
      }));
    if (tokens.length) groups.push({ type: 'token', results: tokens });

    const validators = generateValidators(10)
      .filter(v => v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q))
      .slice(0, 3)
      .map(v => ({
        type: 'validator' as const,
        id: v.address,
        title: v.name,
        subtitle: `Stake: ${formatNumber(v.stake)} · ${v.status}`,
      }));
    if (validators.length) groups.push({ type: 'validator', results: validators });

    if (groups.every(g => g.type !== 'wallet')) {
      const wallets = generateWallets(3).map(w => ({
        type: 'wallet' as const,
        id: w.address,
        title: w.address,
        subtitle: `Balance: ${formatNumber(w.balanceUsd)}`,
      }));
      groups.push({ type: 'wallet', results: wallets });
    }
  }

  return groups;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [input, setInput] = useState(queryParam);
  const [results, setResults] = useState<GroupedResults[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!queryParam) return;
    setInput(queryParam);
    setLoading(true);
    setSearched(false);
    const timer = setTimeout(() => {
      setResults(runSearch(queryParam));
      setLoading(false);
      setSearched(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [queryParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  const totalCount = results.reduce((s, g) => s + g.results.length, 0);

  return (
    <Layout>
      <div className="max-w-[900px] mx-auto px-4 py-8 space-y-6">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search wallet, token, tx hash, block number, contract, validator..."
            className="h-11 pl-10 text-sm font-mono bg-muted/50 border-border/50 focus:border-cyan"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 bg-muted rounded">
            Enter
          </button>
        </form>

        {/* Status */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="terminal-panel p-4 space-y-3">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                {[1, 2, 3].map(j => (
                  <div key={j} className="flex gap-3">
                    <div className="w-7 h-7 bg-muted animate-pulse rounded" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                      <div className="h-2.5 w-32 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {searched && !loading && totalCount === 0 && (
          <div className="terminal-panel p-12 text-center">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold mb-1">No results found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto text-pretty">
              Try a wallet address (0x...), token symbol, transaction hash, or block number.
            </p>
          </div>
        )}

        {/* Results grouped by type */}
        {!loading && results.map(group => {
          const meta = TYPE_META[group.type] || TYPE_META.wallet;
          const Icon = meta.icon;
          return (
            <div key={group.type} className="terminal-panel overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
                <div className={`w-6 h-6 rounded-sm flex items-center justify-center border ${meta.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider">{meta.label}s</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">{group.results.length}</Badge>
              </div>
              <div className="divide-y divide-border/30">
                {group.results.map((r, i) => (
                  <Link
                    key={i}
                    to={meta.path(r.id)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-sm flex items-center justify-center border shrink-0 ${meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono font-semibold truncate">{r.title}</div>
                      {r.subtitle && <div className="text-[10px] text-muted-foreground truncate mt-0.5">{r.subtitle}</div>}
                    </div>
                    {r.value !== undefined && (
                      <div className="text-xs font-mono text-muted-foreground shrink-0">
                        {typeof r.value === 'number' ? formatNumber(r.value as number) : r.value}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {!loading && searched && totalCount > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {totalCount} results for "{queryParam}"
          </p>
        )}

        {/* Empty initial state */}
        {!queryParam && !loading && (
          <div className="terminal-panel p-12 text-center space-y-3">
            <Search className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-balance">Universal Search</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto text-pretty">
              Search across all Hyperliquid data: wallets, tokens, transactions, blocks, contracts, validators, vaults, NFTs, and HyperEVM addresses.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['0x wallet address', 'BTC', '0x tx hash', '1234567 block', 'ETH'].map(hint => (
                <button
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="text-[10px] px-2 py-1 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-cyan/40 transition-colors font-mono"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
