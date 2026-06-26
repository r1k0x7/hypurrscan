import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// Maps Hyperliquid symbol → CoinGecko coin id for icon lookup
// CDN: https://assets.coingecko.com/coins/images/{id}/small/{img}
// We use jsdelivr cryptocurrency-icons as primary (200+ coins, fast CDN)
// Fallback: letter avatar

const SYMBOL_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF', BNB: '#F3BA2F',
  AVAX: '#E84142', MATIC: '#8247E5', LINK: '#2A5ADA', DOT: '#E6007A',
  ADA: '#0033AD', DOGE: '#C2A633', SHIB: '#FFA409', LTC: '#BFBBBB',
  UNI: '#FF007A', ATOM: '#2E3148', NEAR: '#00C08B', APT: '#00B9D1',
  ARB: '#28A0F0', OP: '#FF0420', INJ: '#00B2FF', SUI: '#6FBCF0',
  SEI: '#9B0000', TIA: '#7C3AED', PYTH: '#6B21A8', JUP: '#17A34A',
  WIF: '#9B4D96', PEPE: '#009A1A', FLOKI: '#CF8B00', BONK: '#FF6B35',
  WLD: '#000000', BLUR: '#FF6B00', GMX: '#6375F0', PENDLE: '#1E3A5F',
  STX: '#5546FF', HBAR: '#00C7B1', ALGO: '#000000', VET: '#15BDFF',
  FTM: '#1969FF', CRV: '#D9531E', AAVE: '#B6509E', MKR: '#1AAB9B',
  COMP: '#00D395', SNX: '#00D1FF', YFI: '#006AE3', SUSHI: '#FA52A0',
  '1INCH': '#94A6C3', ZRX: '#302C2C', BAL: '#1E1E1E',
  RUNE: '#33FF99', KAVA: '#FF433E', CELO: '#35D07F',
  MANA: '#FF2D55', SAND: '#04ADEF', AXS: '#0055D5', GALA: '#000000',
  ENJ: '#624DBF', GODS: '#1B1B2F', IMX: '#17B5CB',
  LDO: '#F08A1A', RPL: '#FF6600', FXS: '#000000',
  LUNA: '#FFD83D', UST: '#5493F7',
  DYDX: '#6966FF', PERP: '#00CF9D', GNS: '#C7B900',
  RDNT: '#6C52D9', VELO: '#FF0066', AERO: '#0052FF',
};

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  AVAX: 'avalanche-2', MATIC: 'matic-network', LINK: 'chainlink',
  DOT: 'polkadot', ADA: 'cardano', DOGE: 'dogecoin', SHIB: 'shiba-inu',
  LTC: 'litecoin', UNI: 'uniswap', ATOM: 'cosmos', NEAR: 'near',
  APT: 'aptos', ARB: 'arbitrum', OP: 'optimism', INJ: 'injective-protocol',
  SUI: 'sui', SEI: 'sei-network', TIA: 'celestia', PYTH: 'pyth-network',
  JUP: 'jupiter-exchange-solana', WIF: 'dogwifcoin', PEPE: 'pepe',
  FLOKI: 'floki', BONK: 'bonk', WLD: 'worldcoin-wld', GMX: 'gmx',
  PENDLE: 'pendle', STX: 'blockstack', HBAR: 'hedera-hashgraph',
  FTM: 'fantom', CRV: 'curve-dao-token', AAVE: 'aave', MKR: 'maker',
  COMP: 'compound-governance-token', SNX: 'havven', LDO: 'lido-dao',
  RUNE: 'thorchain', KAVA: 'kava', DYDX: 'dydx', ENJ: 'enjincoin',
  IMX: 'immutable-x', AXS: 'axie-infinity', MANA: 'decentraland',
  SAND: 'the-sandbox', GALA: 'gala', RPL: 'rocket-pool', YFI: 'yearn-finance',
};

function getIconUrl(symbol: string): string {
  // Primary: jsdelivr cryptocurrency-icons (most common coins)
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${symbol.toLowerCase()}.png`;
}

function getCoinGeckoUrl(symbol: string): string | null {
  const id = COINGECKO_IDS[symbol.toUpperCase()];
  if (!id) return null;
  // CoinGecko doesn't allow hotlinking small images without API key reliably,
  // so we use their public thumb endpoint
  return `https://assets.coingecko.com/coins/images/1/small/bitcoin.png`; // placeholder pattern
}

function getColor(symbol: string): string {
  return SYMBOL_COLORS[symbol.toUpperCase()] ?? '#00E5FF';
}

function getInitials(symbol: string): string {
  return symbol.slice(0, symbol.length > 3 ? 3 : symbol.length).toUpperCase();
}

interface CryptoIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function CryptoIcon({ symbol, size = 24, className }: CryptoIconProps) {
  const [failed, setFailed] = useState(false);
  const color = getColor(symbol);
  const initials = getInitials(symbol);

  if (failed) {
    // Fallback: colored letter avatar
    return (
      <div
        className={cn('rounded-full flex items-center justify-center shrink-0 font-bold', className)}
        style={{
          width: size,
          height: size,
          backgroundColor: color + '22',
          border: `1.5px solid ${color}44`,
          fontSize: size * 0.32,
          color,
        }}
      >
        {initials.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={getIconUrl(symbol)}
      alt={symbol}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn('rounded-full shrink-0', className)}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

// Compact inline usage for tables
export function CryptoIconWithSymbol({
  symbol,
  name,
  size = 24,
  className,
}: {
  symbol: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <CryptoIcon symbol={symbol} size={size} />
      <div className="min-w-0">
        <div className="text-xs font-semibold leading-tight">{symbol}</div>
        {name && name !== symbol && (
          <div className="text-[10px] text-muted-foreground truncate leading-tight">{name}</div>
        )}
      </div>
    </div>
  );
  }
  
