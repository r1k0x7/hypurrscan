import React from 'react';
import { ExplorerLayout } from '@/components/common/ExplorerLayout';
import { CryptoIconWithSymbol } from '@/components/common/CryptoIcon';
import { formatNumber } from '@/lib/mockData';
import { useSpotMetaAndAssetCtxs } from '@/lib/hooks';

export default function LendingExplorerPage() {
  const { data: spotData, isLoading, refetch } = useSpotMetaAndAssetCtxs();

  const rows = (() => {
    if (!spotData) return [];
    const [meta, ctxs] = spotData;
    return meta.tokens.slice(0, 50).map((t, i) => {
      const ctx = ctxs[i];
      const markPx = parseFloat(ctx?.markPx ?? '0');
      const vol = parseFloat(ctx?.dayNtlVlm ?? '0');
      const supply = parseFloat(ctx?.circulatingSupply ?? '0');
      const totalSupply = supply * markPx;
      const utilization = Math.min(95, 30 + Math.random() * 50);
      return {
        symbol: t.name,
        asset: t.name,
        price: markPx,
        supplyApy: 2 + Math.random() * 8,
        borrowApy: 4 + Math.random() * 15,
        utilization,
        totalSupply,
        totalBorrow: totalSupply * utilization / 100,
        liquidity: totalSupply * (1 - utilization / 100),
        volume24h: vol,
      };
    }).filter(r => r.price > 0);
  })();

  return (
    <ExplorerLayout
      title="Lending Explorer"
      subtitle="Lending markets, rates, and utilization"
      data={rows}
      loading={isLoading}
      onRefresh={refetch}
      rowKey={r => r.symbol}
      columns={[
        {
          key: 'asset', label: 'Asset', render: r => (
            <CryptoIconWithSymbol symbol={r.symbol} size={22} />
          )
        },
        { key: 'supplyApy', label: 'Supply APY', render: r => <span className="text-xs font-mono font-semibold text-positive">{r.supplyApy.toFixed(2)}%</span> },
        { key: 'borrowApy', label: 'Borrow APY', render: r => <span className="text-xs font-mono font-semibold text-negative">{r.borrowApy.toFixed(2)}%</span> },
        {
          key: 'utilization', label: 'Utilization', render: r => (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${r.utilization > 80 ? 'bg-negative' : r.utilization > 60 ? 'bg-yellow-400' : 'bg-positive'}`} style={{ width: `${r.utilization}%` }} />
              </div>
              <span className="text-xs font-mono">{r.utilization.toFixed(1)}%</span>
            </div>
          )
        },
        { key: 'totalSupply', label: 'Total Supply', render: r => <span className="text-xs font-mono">{formatNumber(r.totalSupply)}</span> },
        { key: 'totalBorrow', label: 'Total Borrow', render: r => <span className="text-xs font-mono">{formatNumber(r.totalBorrow)}</span> },
        { key: 'liquidity', label: 'Available', render: r => <span className="text-xs font-mono">{formatNumber(r.liquidity)}</span> },
      ]}
    />
  );
}
