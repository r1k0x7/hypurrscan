// Mock data generators for realistic blockchain analytics demo

import type {
  Token, WalletSummary, Trade, Transaction, Liquidation, Block,
  MarketStats, Position, Order, FundingPayment, Transfer,
  PortfolioAsset, WalletStats, CandleData, ChartDataPoint,
  Validator, Vault, LendingPool, NFTCollection, Contract,
  LeaderboardEntry, WhaleTransaction, FundingRate
} from '@/types';

const TOKENS = ['BTC', 'ETH', 'SOL', 'AVAX', 'ARB', 'OP', 'MATIC', 'LINK', 'UNI', 'AAVE', 'CRV', 'GMX', 'DOGE', 'PEPE', 'WIF'];
const TOKEN_PRICES: Record<string, number> = {
  BTC: 67420, ETH: 3541, SOL: 185, AVAX: 42, ARB: 1.12, OP: 2.85,
  MATIC: 0.92, LINK: 18.4, UNI: 12.3, AAVE: 210, CRV: 0.85,
  GMX: 52, DOGE: 0.18, PEPE: 0.000012, WIF: 2.4
};

const rng = (min: number, max: number) => Math.random() * (max - min) + min;
const rngInt = (min: number, max: number) => Math.floor(rng(min, max));
const randAddr = () => '0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[rngInt(0, 16)]).join('');
const randHash = () => '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[rngInt(0, 16)]).join('');
const randToken = () => TOKENS[rngInt(0, TOKENS.length)];
const timeAgo = (seconds: number) => Date.now() / 1000 - seconds;

export function generateMarketStats(): MarketStats {
  return {
    totalVolume24h: 4_820_000_000 + rng(-500e6, 500e6),
    openInterest: 12_400_000_000 + rng(-1e9, 1e9),
    tvl: 8_200_000_000 + rng(-800e6, 800e6),
    marketCap: 2_850_000_000_000 + rng(-100e9, 100e9),
    volumeChange: rng(-15, 25),
    oiChange: rng(-8, 12),
    tvlChange: rng(-5, 10),
    mcapChange: rng(-3, 8),
    activeTrades: rngInt(1200, 3500),
    activeWallets: rngInt(8000, 25000),
    totalLiquidations24h: rngInt(120, 450),
    liquidationsValue24h: rng(15e6, 85e6),
  };
}

export function generateTokens(count = 20): Token[] {
  return TOKENS.slice(0, Math.min(count, TOKENS.length)).map((sym, i) => {
    const price = TOKEN_PRICES[sym] || rng(0.001, 100);
    return {
      symbol: sym,
      name: sym === 'BTC' ? 'Bitcoin' : sym === 'ETH' ? 'Ethereum' : sym === 'SOL' ? 'Solana' : sym,
      address: randAddr(),
      price,
      priceChange24h: rng(-12, 18),
      volume24h: rng(50e6, 2e9),
      marketCap: price * rng(1e7, 1e9),
      totalSupply: rng(1e8, 1e12),
      circulatingSupply: rng(5e7, 8e11),
      holders: rngInt(1000, 500000),
      decimals: 18,
      logoUrl: undefined,
    };
  });
}

export function generateWallets(count = 50): WalletSummary[] {
  return Array.from({ length: count }, (_, i) => ({
    address: randAddr(),
    balance: rng(0.1, 500),
    balanceUsd: rng(100, 5_000_000),
    txCount: rngInt(10, 10000),
    lastActivity: timeAgo(rng(0, 86400 * 30)),
    pnl24h: rng(-50000, 150000),
    roi: rng(-50, 500),
    winRate: rng(30, 85),
    rank: i + 1,
  }));
}

export function generateTrades(count = 50): Trade[] {
  return Array.from({ length: count }, () => {
    const token = randToken();
    const price = TOKEN_PRICES[token] || rng(1, 1000);
    const size = rng(0.01, 50);
    return {
      id: randHash().slice(0, 18),
      timestamp: timeAgo(rng(0, 3600)),
      wallet: randAddr(),
      token,
      side: (Math.random() > 0.5 ? 'buy' : 'sell') as 'buy' | 'sell',
      price,
      size,
      value: price * size,
      txHash: randHash(),
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
}

export function generateTransactions(count = 50): Transaction[] {
  const types: Transaction['type'][] = ['transfer', 'swap', 'deposit', 'withdraw', 'liquidation', 'contract'];
  return Array.from({ length: count }, () => ({
    hash: randHash(),
    blockNumber: rngInt(18000000, 20000000),
    timestamp: timeAgo(rng(0, 3600)),
    from: randAddr(),
    to: randAddr(),
    value: rng(0.001, 100),
    valueUsd: rng(10, 500000),
    type: types[rngInt(0, types.length)],
    status: (Math.random() > 0.05 ? 'success' : 'failed') as 'success' | 'failed' | 'pending',
    gasUsed: rngInt(21000, 500000),
    gasPrice: rng(10, 200),
  })).sort((a, b) => b.timestamp - a.timestamp);
}

export function generateLiquidations(count = 30): Liquidation[] {
  return Array.from({ length: count }, () => {
    const token = randToken();
    const price = TOKEN_PRICES[token] || rng(1, 1000);
    const size = rng(0.1, 20);
    return {
      id: randHash().slice(0, 18),
      timestamp: timeAgo(rng(0, 3600)),
      wallet: randAddr(),
      token,
      size,
      liquidationPrice: price * rng(0.85, 1.15),
      value: price * size,
      txHash: randHash(),
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
}

export function generateBlocks(count = 30): Block[] {
  const base = 20_450_000;
  return Array.from({ length: count }, (_, i) => ({
    number: base - i,
    hash: randHash(),
    parentHash: randHash(),
    timestamp: timeAgo(i * 2),
    txCount: rngInt(5, 250),
    validator: randAddr(),
    gasUsed: rngInt(1000000, 30000000),
    gasLimit: 30000000,
    size: rngInt(10000, 200000),
  }));
}

export function generateFundingRates(): FundingRate[] {
  return TOKENS.slice(0, 10).map(token => ({
    token,
    rate: rng(-0.05, 0.15),
    nextFunding: Date.now() / 1000 + rng(0, 28800),
    annualized: rng(-18, 55),
  }));
}

export function generatePositions(count = 8): Position[] {
  return Array.from({ length: count }, () => {
    const token = randToken();
    const side = Math.random() > 0.5 ? 'long' : 'short';
    const entryPrice = TOKEN_PRICES[token] || rng(1, 1000);
    const currentPrice = entryPrice * rng(0.8, 1.3);
    const size = rng(0.1, 10);
    const leverage = rngInt(1, 20);
    const pnl = side === 'long'
      ? (currentPrice - entryPrice) * size
      : (entryPrice - currentPrice) * size;
    return {
      id: randHash().slice(0, 16),
      token,
      side,
      size,
      entryPrice,
      currentPrice,
      leverage,
      pnl,
      pnlPercent: (pnl / (entryPrice * size)) * 100,
      liquidationPrice: side === 'long' ? entryPrice * 0.9 : entryPrice * 1.1,
      margin: (entryPrice * size) / leverage,
      timestamp: timeAgo(rng(3600, 86400 * 7)),
    };
  });
}

export function generateOrders(count = 20): Order[] {
  const statuses: Order['status'][] = ['filled', 'cancelled', 'open', 'partially_filled'];
  return Array.from({ length: count }, () => {
    const token = randToken();
    const price = TOKEN_PRICES[token] || rng(1, 1000);
    const size = rng(0.01, 5);
    return {
      id: randHash().slice(0, 16),
      timestamp: timeAgo(rng(0, 86400 * 30)),
      token,
      side: (Math.random() > 0.5 ? 'buy' : 'sell') as 'buy' | 'sell',
      type: (Math.random() > 0.6 ? 'limit' : 'market') as 'market' | 'limit' | 'stop',
      price,
      size,
      filled: size * rng(0, 1),
      status: statuses[rngInt(0, statuses.length)],
      value: price * size,
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
}

export function generateFundingPayments(count = 20): FundingPayment[] {
  return Array.from({ length: count }, () => ({
    id: randHash().slice(0, 16),
    timestamp: timeAgo(rng(0, 86400 * 30)),
    token: randToken(),
    amount: rng(-500, 2000),
    rate: rng(-0.05, 0.15),
    side: (Math.random() > 0.5 ? 'received' : 'paid') as 'received' | 'paid',
  })).sort((a, b) => b.timestamp - a.timestamp);
}

export function generateTransfers(count = 30, address?: string): Transfer[] {
  return Array.from({ length: count }, () => {
    const isIn = Math.random() > 0.5;
    const addr = address || randAddr();
    return {
      id: randHash().slice(0, 16),
      timestamp: timeAgo(rng(0, 86400 * 30)),
      from: isIn ? randAddr() : addr,
      to: isIn ? addr : randAddr(),
      token: randToken(),
      amount: rng(0.01, 100),
      valueUsd: rng(10, 500000),
      txHash: randHash(),
      type: (isIn ? 'in' : 'out') as 'in' | 'out',
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
}

export function generatePortfolioAssets(): PortfolioAsset[] {
  const tokens = TOKENS.slice(0, 8);
  const total = rng(100000, 5000000);
  let remaining = 100;
  return tokens.map((sym, i) => {
    const alloc = i === tokens.length - 1 ? remaining : rng(2, remaining - (tokens.length - i - 1) * 2);
    remaining -= alloc;
    const price = TOKEN_PRICES[sym] || rng(1, 1000);
    const valueUsd = (alloc / 100) * total;
    return {
      token: sym,
      symbol: sym,
      balance: valueUsd / price,
      price,
      valueUsd,
      pnl24h: rng(-5000, 15000),
      pnlPercent: rng(-8, 20),
      allocation: alloc,
    };
  });
}

export function generateWalletStats(address: string): WalletStats {
  const totalTrades = rngInt(50, 5000);
  const winRate = rng(35, 80);
  const winningTrades = Math.floor(totalTrades * winRate / 100);
  return {
    address,
    totalValue: rng(10000, 5000000),
    totalPnl: rng(-100000, 2000000),
    realizedPnl: rng(-80000, 1500000),
    unrealizedPnl: rng(-20000, 500000),
    roi: rng(-30, 500),
    winRate,
    totalTrades,
    winningTrades,
    losingTrades: totalTrades - winningTrades,
    avgTradeSize: rng(1000, 50000),
    largestWin: rng(5000, 500000),
    largestLoss: rng(1000, 100000),
    tradingDays: rngInt(30, 500),
    avgDailyPnl: rng(-500, 5000),
    sharpeRatio: rng(0.5, 4.5),
    maxDrawdown: rng(5, 60),
  };
}

export function generateEquityCurve(days = 90): ChartDataPoint[] {
  let value = rng(50000, 200000);
  const now = Date.now() / 1000;
  return Array.from({ length: days }, (_, i) => {
    value = value * (1 + rng(-0.05, 0.08));
    return { time: now - (days - i) * 86400, value: Math.max(0, value) };
  });
}

export function generateCandleData(count = 200, basePrice = 3500): CandleData[] {
  let price = basePrice;
  const now = Date.now() / 1000;
  return Array.from({ length: count }, (_, i) => {
    const open = price;
    const change = rng(-0.04, 0.05);
    const close = open * (1 + change);
    const high = Math.max(open, close) * rng(1, 1.02);
    const low = Math.min(open, close) * rng(0.98, 1);
    const volume = rng(1e6, 5e8);
    price = close;
    return { time: now - (count - i) * 3600, open, high, low, close, volume };
  });
}

export function generatePriceHistory(days = 30): ChartDataPoint[] {
  let value = rng(1000, 5000);
  const now = Date.now() / 1000;
  return Array.from({ length: days * 24 }, (_, i) => {
    value = Math.max(0.001, value * (1 + rng(-0.02, 0.025)));
    return { time: now - (days * 24 - i) * 3600, value };
  });
}

export function generateValidators(count = 20): Validator[] {
  const names = ['Alpha Node', 'Beta Validator', 'Gamma Stake', 'Delta Chain', 'Epsilon Node',
    'Zeta Validator', 'Eta Pool', 'Theta Stake', 'Iota Node', 'Kappa Chain'];
  return Array.from({ length: count }, (_, i) => ({
    address: randAddr(),
    name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''),
    stake: rng(100000, 10000000),
    commission: rng(1, 15),
    uptime: rng(95, 99.99),
    blocksValidated: rngInt(1000, 50000),
    delegators: rngInt(50, 5000),
    status: Math.random() > 0.1 ? 'active' : 'inactive',
  }));
}

export function generateVaults(count = 15): Vault[] {
  const strategies = ['Yield Farming', 'Delta Neutral', 'Long-Short', 'Arbitrage', 'Market Making'];
  return Array.from({ length: count }, (_, i) => ({
    address: randAddr(),
    name: `Vault #${i + 1} ${strategies[i % strategies.length]}`,
    tvl: rng(100000, 50000000),
    apy: rng(5, 120),
    strategy: strategies[i % strategies.length],
    depositors: rngInt(10, 5000),
    totalDeposits: rng(500000, 100000000),
    performance30d: rng(-15, 45),
  }));
}

export function generateLendingPools(): LendingPool[] {
  return TOKENS.slice(0, 8).map(sym => {
    const totalSupply = rng(1e6, 1e9);
    const utilization = rng(20, 95);
    return {
      asset: sym,
      symbol: sym,
      supplyApy: rng(1, 25),
      borrowApy: rng(3, 40),
      utilization,
      totalSupply,
      totalBorrow: totalSupply * utilization / 100,
      liquidity: totalSupply * (1 - utilization / 100),
    };
  });
}

export function generateNFTCollections(count = 15): NFTCollection[] {
  const names = ['HyperPunks', 'ChainApes', 'PixelWhales', 'CryptoNomads', 'BlockBeasts',
    'NeonGhosts', 'DigitalDreams', 'MetaVault', 'OnChainArt', 'TokenTigers'];
  return Array.from({ length: count }, (_, i) => ({
    address: randAddr(),
    name: names[i % names.length],
    symbol: names[i % names.length].slice(0, 4).toUpperCase(),
    floorPrice: rng(0.01, 50),
    volume24h: rng(10, 500000),
    holders: rngInt(100, 10000),
    totalSupply: rngInt(1000, 10000),
    items: rngInt(800, 10000),
  }));
}

export function generateContracts(count = 20): Contract[] {
  const types: Contract['type'][] = ['erc20', 'erc721', 'defi', 'other'];
  return Array.from({ length: count }, () => ({
    address: randAddr(),
    name: Math.random() > 0.4 ? 'Verified Contract' : undefined,
    creator: randAddr(),
    createdAt: timeAgo(rng(86400, 86400 * 365)),
    txCount: rngInt(100, 1000000),
    balance: rng(0, 10000),
    type: types[rngInt(0, types.length)],
    verified: Math.random() > 0.4,
  }));
}

export function generateLeaderboard(count = 100, period: LeaderboardEntry['period'] = '7d'): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    address: randAddr(),
    label: Math.random() > 0.7 ? `Trader ${i + 1}` : undefined,
    pnl: rng(i === 0 ? 500000 : 1000, 1000000) * (count - i) / count,
    roi: rng(10, 1000) * (count - i) / count,
    winRate: rng(45, 90),
    totalTrades: rngInt(50, 5000),
    volume: rng(100000, 50000000),
    period,
  }));
}

export function generateWhaleTransactions(count = 50): WhaleTransaction[] {
  const types: WhaleTransaction['type'][] = ['buy', 'sell', 'transfer', 'liquidation'];
  return Array.from({ length: count }, () => ({
    id: randHash().slice(0, 16),
    timestamp: timeAgo(rng(0, 86400)),
    wallet: randAddr(),
    token: randToken(),
    type: types[rngInt(0, types.length)],
    amount: rng(100000, 10000000),
    valueUsd: rng(500000, 50000000),
    txHash: randHash(),
    walletRank: Math.random() > 0.5 ? rngInt(1, 1000) : undefined,
  })).sort((a, b) => b.timestamp - a.timestamp);
}

export function formatAddress(addr: string, chars = 6): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}

export function formatNumber(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(decimals)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(decimals)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(decimals)}K`;
  return `$${n.toFixed(decimals)}`;
}

export function formatCompact(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(decimals)}T`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

export function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  const now = Date.now();
  const diff = (now - ts * 1000) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

export function formatDateTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

export function formatPercent(n: number, decimals = 2): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}%`;
}

export function formatPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(8)}`;
}
