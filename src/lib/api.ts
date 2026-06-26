// Hyperliquid REST API client
// Base: https://api.hyperliquid.xyz/info (POST, application/json)

const HL_API = 'https://api.hyperliquid.xyz/info';

async function hlPost<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(HL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Hyperliquid API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ── Types returned from HL API ──────────────────────────────────────────────

export interface HLMeta {
  universe: Array<{ name: string; szDecimals: number; maxLeverage: number; onlyIsolated?: boolean }>;
}

export interface HLAssetCtx {
  dayNtlVlm: string;       // 24h notional volume
  funding: string;         // hourly funding rate
  impactPxs: [string, string] | null;
  markPx: string;
  midPx: string | null;
  openInterest: string;
  oraclePx: string;
  premium: string | null;
  prevDayPx: string;
}

export interface HLSpotMeta {
  universe: Array<{ name: string; index: number; isCanonical?: boolean; tokens: number[] }>;
  tokens: Array<{ name: string; szDecimals: number; weiDecimals: number; index: number; tokenId: string; isCanonical?: boolean }>;
}

export interface HLSpotAssetCtx {
  dayNtlVlm: string;
  markPx: string;
  midPx: string | null;
  prevDayPx: string;
  circulatingSupply: string;
}

export interface HLTrade {
  coin: string;
  side: 'B' | 'A';      // B = buy/bid, A = sell/ask
  px: string;
  sz: string;
  time: number;          // ms
  hash: string;
  tid: number;
}

export interface HLUserFill {
  coin: string;
  px: string;
  sz: string;
  side: 'B' | 'A';
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken: string;
}

export interface HLPosition {
  coin: string;
  entryPx: string | null;
  leverage: { type: string; value: number };
  liquidationPx: string | null;
  marginUsed: string;
  maxTradeSzs: [string, string];
  positionValue: string;
  returnOnEquity: string;
  szi: string;   // positive = long, negative = short
  unrealizedPnl: string;
}

export interface HLClearinghouseState {
  assetPositions: Array<{ position: HLPosition; type: 'oneWay' }>;
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  time: number;
  withdrawable: string;
}

export interface HLUserFunding {
  delta: {
    type: 'funding';
    coin: string;
    fundingRate: string;
    szi: string;
    usdc: string;
  };
  hash: string;
  time: number;
}

export interface HLOpenOrder {
  coin: string;
  isPositionTpsl: boolean;
  isTrigger: boolean;
  limitPx: string;
  oid: number;
  orderType: string;
  origSz: string;
  reduceOnly: boolean;
  side: 'B' | 'A';
  sz: string;
  timestamp: number;
  triggerCondition: string;
  triggerPx: string;
}

export interface HLLeaderboardEntry {
  ethAddress: string;
  accountValue: string;
  windowPnl: string;
  pnl: string;
  vlm: string;
  prize: number;
}

export interface HLLeaderboardResponse {
  leaderboardRows: HLLeaderboardEntry[];
  goldMedal: HLLeaderboardEntry | null;
  silverMedal: HLLeaderboardEntry | null;
  bronzeMedal: HLLeaderboardEntry | null;
}

export interface HLVaultSummary {
  vaultAddress: string;
  name: string;
  tvl: string;
  pnl: string;
  leader: string;
  apr: string;
  isClosed: boolean;
}

// ── API Functions ────────────────────────────────────────────────────────────

/** All mid prices: { BTC: "67420.5", ETH: "3541.2", ... } */
export async function fetchAllMids(): Promise<Record<string, string>> {
  return hlPost({ type: 'allMids' });
}

/** Perp meta + asset contexts */
export async function fetchMetaAndAssetCtxs(): Promise<[HLMeta, HLAssetCtx[]]> {
  return hlPost({ type: 'metaAndAssetCtxs' });
}

/** Spot meta + asset contexts */
export async function fetchSpotMetaAndAssetCtxs(): Promise<[HLSpotMeta, HLSpotAssetCtx[]]> {
  return hlPost({ type: 'spotMetaAndAssetCtxs' });
}

/** Recent trades for a given coin */
export async function fetchRecentTrades(coin: string): Promise<HLTrade[]> {
  return hlPost({ type: 'recentTrades', req: { coin } });
}

/** Clearinghouse (portfolio) state for a wallet */
export async function fetchClearinghouseState(user: string): Promise<HLClearinghouseState> {
  return hlPost({ type: 'clearinghouseState', user });
}

/** User trade fills */
export async function fetchUserFills(user: string): Promise<HLUserFill[]> {
  return hlPost({ type: 'userFills', user });
}

/** User funding history */
export async function fetchUserFunding(user: string, startTime: number, endTime?: number): Promise<HLUserFunding[]> {
  return hlPost({ type: 'userFunding', user, startTime, endTime });
}

/** Open orders for a user */
export async function fetchOpenOrders(user: string): Promise<HLOpenOrder[]> {
  return hlPost({ type: 'openOrders', user });
}

/** Leaderboard (window = "1d" | "1w" | "1m" | "allTime") */
export async function fetchLeaderboard(window: '1d' | '1w' | '1m' | 'allTime'): Promise<HLLeaderboardResponse> {
  return hlPost({ type: 'leaderboard', req: { window } });
}

/** Vault summaries */
export async function fetchVaultSummaries(): Promise<HLVaultSummary[]> {
  const res = await hlPost<{ vaultSummaries: HLVaultSummary[] }>({ type: 'vaultSummaries' });
  return res.vaultSummaries ?? [];
}

/** L2 order book for a coin */
export async function fetchL2Book(coin: string, nSigFigs?: number): Promise<{ coin: string; levels: [[string, string][], [string, string][]]; time: number }> {
  return hlPost({ type: 'l2Book', req: { coin, nSigFigs } });
}
