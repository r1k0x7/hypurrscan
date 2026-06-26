import React, { useState } from 'react';
import { ExplorerLayout } from '@/components/common/ExplorerLayout';
import { PriceChange } from '@/components/common/UIComponents';
import { CryptoIconWithSymbol } from '@/components/common/CryptoIcon';
import { formatNumber, formatPrice } from '@/lib/mockData';
import { useTokenList } from '@/lib/hooks';

export default function TokenExplorerPage() {
  const { data: allTokens, isLoading, refetch } = useTokenList();
  const [search, setSearch] = useState('');

  const filtered = search
    ? allTokens.filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()))
    : allTokens;

  return (
    <ExplorerLayout
      title="Token Explorer"
      subtitle="All tokens on Hyperliquid"
      data={filtered}
      loading={isLoading}
      onRefresh={refetch}
      rowKey={r => r.symbol}
      getRowLink={r => `/token/${r.symbol}`}
      searchPlaceholder="Search token..."
      onSearch={setSearch}
      searchValue={search}
      columns={[
        {
          key: 'symbol', label: 'Token', render: r => (
            <CryptoIconWithSymbol symbol={r.symbol} name={r.name} size={22} />
          )
        },
        { key: 'price', label: 'Price', render: r => <span className="text-xs font-mono">{formatPrice(r.price)}</span> },
        { key: 'priceChange24h', label: '24h %', render: r => <PriceChange value={r.priceChange24h} showIcon={false} /> },
        { key: 'volume24h', label: 'Volume 24h', render: r => <span className="text-xs font-mono">{formatNumber(r.volume24h)}</span> },
        { key: 'openInterest', label: 'Open Interest', render: r => <span className="text-xs font-mono">{formatNumber(r.openInterest)}</span> },
        { key: 'fundingRate', label: 'Funding', render: r => <span className={`text-xs font-mono ${r.fundingRate >= 0 ? 'text-positive' : 'text-negative'}`}>{(r.fundingRate * 100).toFixed(4)}%</span> },
        { key: 'maxLeverage', label: 'Max Lev.', render: r => <span className="text-xs font-mono">{r.maxLeverage}x</span> },
      ]}
    />
  );
}
