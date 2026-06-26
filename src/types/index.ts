// Core blockchain types for HypurrScan clone

export interface Token {
  symbol: string;
  name: string;
  address: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  holders: number;
  decimals: number;
  logoUrl?: string;
}

export interface WalletSummary {
  address: string;
  balance: number;
  balanceUsd: number;
  txCount: number;
  lastActivity: number;
  pnl24h: number;
  roi: number;
  winRate: number;
  rank?: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  wallet: string;
  token: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  value: number;
  txHash: string;
}

export interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: number;
  valueUsd: number;
  type: 'transfer' | 'swap' | 'deposit' | 'withdraw' | 'liquidation' | 'contract';
  status: 'success' | 'failed' | 'pending';
  gasUsed: number;
  gasPrice: number;
}

export interface Liquidation {
  id: string;
  timestamp: number;
  wallet: string;
  token: string;
  size: number;
  liquidationPrice: number;
  value: number;
  txHash: string;
}

export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  txCount: number;
  validator: string;
  gasUsed: number;
  gasLimit: number;
  size: number;
}

export interface MarketStats {
  totalVolume24h: number;
  openInterest: number;
  tvl: number;
  marketCap: number;
  volumeChange: number;
  oiChange: number;
  tvlChange: number;
  mcapChange: number;
  activeTrades: number;
  activeWallets: number;
  totalLiquidations24h: number;
  liquidationsValue24h: number;
}

export interface FundingRate {
  token: string;
  rate: number;
  nextFunding: number;
  annualized: number;
}

export interface Position {
  id: string;
  token: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  liquidationPrice: number;
  margin: number;
  timestamp: number;
}

export interface Order {
  id: string;
  timestamp: number;
  token: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  price: number;
  size: number;
  filled: number;
  status: 'filled' | 'cancelled' | 'open' | 'partially_filled';
  value: number;
}

export interface FundingPayment {
  id: string;
  timestamp: number;
  token: string;
  amount: number;
  rate: number;
  side: 'received' | 'paid';
}

export interface Transfer {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  token: string;
  amount: number;
  valueUsd: number;
  txHash: string;
  type: 'in' | 'out';
}

export interface PortfolioAsset {
  token: string;
  symbol: string;
  balance: number;
  price: number;
  valueUsd: number;
  pnl24h: number;
  pnlPercent: number;
  allocation: number;
}

export interface WalletStats {
  address: string;
  totalValue: number;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  roi: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgTradeSize: number;
  largestWin: number;
  largestLoss: number;
  tradingDays: number;
  avgDailyPnl: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export interface ChartDataPoint {
  time: number;
  value: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Validator {
  address: string;
  name: string;
  stake: number;
  commission: number;
  uptime: number;
  blocksValidated: number;
  delegators: number;
  status: 'active' | 'jailed' | 'inactive';
}

export interface Vault {
  address: string;
  name: string;
  tvl: number;
  apy: number;
  strategy: string;
  depositors: number;
  totalDeposits: number;
  performance30d: number;
}

export interface LendingPool {
  asset: string;
  symbol: string;
  supplyApy: number;
  borrowApy: number;
  utilization: number;
  totalSupply: number;
  totalBorrow: number;
  liquidity: number;
}

export interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  floorPrice: number;
  volume24h: number;
  holders: number;
  totalSupply: number;
  items: number;
}

export interface Contract {
  address: string;
  name?: string;
  creator: string;
  createdAt: number;
  txCount: number;
  balance: number;
  type: 'erc20' | 'erc721' | 'defi' | 'other';
  verified: boolean;
}

export interface SearchResult {
  type: 'wallet' | 'token' | 'transaction' | 'block' | 'contract' | 'validator' | 'vault' | 'nft' | 'hyperevm';
  id: string;
  title: string;
  subtitle?: string;
  value?: string | number;
}

export interface Alert {
  id: string;
  type: 'price' | 'wallet' | 'liquidation' | 'whale';
  target: string;
  condition: 'above' | 'below' | 'change';
  threshold: number;
  enabled: boolean;
  triggered: boolean;
  createdAt: number;
  lastTriggered?: number;
  label: string;
}

export interface Notification {
  id: string;
  type: 'alert' | 'system' | 'whale' | 'liquidation';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

export interface WatchlistItem {
  id: string;
  type: 'wallet' | 'token' | 'trader';
  address: string;
  label?: string;
  addedAt: number;
  metrics?: Record<string, number>;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  label?: string;
  pnl: number;
  roi: number;
  winRate: number;
  totalTrades: number;
  volume: number;
  period: '24h' | '7d' | '30d' | 'all';
}

export interface WhaleTransaction {
  id: string;
  timestamp: number;
  wallet: string;
  token: string;
  type: 'buy' | 'sell' | 'transfer' | 'liquidation';
  amount: number;
  valueUsd: number;
  txHash: string;
  walletRank?: number;
}

export type TimeRange = '1h' | '4h' | '1d' | '7d' | '30d' | '90d' | '1y' | 'all';
export type SortDirection = 'asc' | 'desc';
  
