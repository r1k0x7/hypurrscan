import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, StarOff, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import { Address, EmptyState, SectionHeader } from '@/components/common/UIComponents';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import type { WatchlistItem } from '@/types';

function WatchCard({ item, onRemove }: { item: WatchlistItem; onRemove: () => void }) {
  const path = item.type === 'wallet' || item.type === 'trader'
    ? `/wallet/${item.address}`
    : `/token/${item.address}`;
  return (
    <div className="terminal-panel p-3 flex items-center gap-3 hover:bg-accent/10 transition-colors">
      <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${item.type === 'token' ? 'bg-cyan/10' : 'bg-positive/10'}`}>
        <span className="text-[10px] font-bold text-cyan">{item.type === 'token' ? item.address.slice(0, 3).toUpperCase() : 'W'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <Address address={item.address} chars={6} className="text-xs" />
        <div className="text-[10px] text-muted-foreground capitalize">{item.type}</div>
      </div>
      <Link to={path}>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </Link>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-negative hover:text-negative" onClick={onRemove}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

export default function WatchlistPage() {
  const [tab, setTab] = useState<'wallet' | 'token' | 'trader'>('wallet');
  const { watchlist, removeFromWatchlist, addToWatchlist } = useAppStore();

  const filtered = watchlist.filter(w => w.type === tab);

  const handleRemove = (id: string) => {
    removeFromWatchlist(id);
    toast.info('Removed from watchlist');
  };

  const handleAddDemo = () => {
    const addr = '0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    addToWatchlist({ type: tab, address: addr });
    toast.success('Added demo item');
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-balance">Watchlist</h1>
            <p className="text-xs text-muted-foreground text-pretty">
              {watchlist.length}/100 items saved
            </p>
          </div>
          <Button size="sm" className="h-7 text-xs" onClick={handleAddDemo}>
            + Add Demo
          </Button>
        </div>

        <div className="terminal-panel">
          <div className="p-4 border-b border-border">
            <Tabs value={tab} onValueChange={v => setTab(v as 'wallet' | 'token' | 'trader')}>
              <TabsList>
                <TabsTrigger value="wallet" className="text-xs">
                  Wallets ({watchlist.filter(w => w.type === 'wallet').length})
                </TabsTrigger>
                <TabsTrigger value="token" className="text-xs">
                  Tokens ({watchlist.filter(w => w.type === 'token').length})
                </TabsTrigger>
                <TabsTrigger value="trader" className="text-xs">
                  Traders ({watchlist.filter(w => w.type === 'trader').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="p-4">
            {filtered.length === 0 ? (
              <EmptyState message={`No ${tab}s in watchlist. Browse the explorer and click Watch on items.`} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(item => (
                  <WatchCard key={item.id} item={item} onRemove={() => handleRemove(item.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
