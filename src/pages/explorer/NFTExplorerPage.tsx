import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ExplorerLayout } from '@/components/common/ExplorerLayout';
import { Address, StatusBadge } from '@/components/common/UIComponents';
import { generateNFTCollections, formatNumber, formatPrice, formatCompact } from '@/lib/mockData';
import type { NFTCollection } from '@/types';

export default function NFTExplorerPage() {
  const [data, setData] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setTimeout(() => { setData(generateNFTCollections(30)); setLoading(false); }, 300);
  };
  useEffect(() => { load(); }, []);

  const filtered = search
    ? data.filter(n => n.name.toLowerCase().includes(search.toLowerCase()) || n.symbol.toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <ExplorerLayout
      title="NFT Explorer"
      subtitle="NFT collections and marketplace data"
      data={filtered}
      loading={loading}
      onRefresh={load}
      rowKey={r => r.address}
      getRowLink={r => `/explorer/nfts/${r.address}`}
      searchPlaceholder="Search collection..."
      onSearch={setSearch}
      searchValue={search}
      columns={[
        {
          key: 'name', label: 'Collection', render: r => (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-gradient-to-br from-cyan/20 to-purple-500/20 flex items-center justify-center shrink-0 text-[9px] font-bold text-cyan">
                {r.symbol.slice(0, 3)}
              </div>
              <div>
                <div className="text-xs font-semibold">{r.name}</div>
                <div className="text-[10px] text-muted-foreground">{r.symbol}</div>
              </div>
            </div>
          )
        },
        { key: 'floorPrice', label: 'Floor', render: r => <span className="text-xs font-mono">{formatPrice(r.floorPrice)}</span> },
        { key: 'volume24h', label: 'Volume 24h', render: r => <span className="text-xs font-mono">{formatNumber(r.volume24h)}</span> },
        { key: 'holders', label: 'Holders', render: r => <span className="text-xs font-mono">{r.holders.toLocaleString()}</span> },
        { key: 'items', label: 'Items', render: r => <span className="text-xs font-mono">{r.items.toLocaleString()}</span> },
        { key: 'totalSupply', label: 'Supply', render: r => <span className="text-xs font-mono">{r.totalSupply.toLocaleString()}</span> },
        { key: 'address', label: 'Contract', render: r => <Address address={r.address} chars={5} /> },
      ]}
    />
  );
}
