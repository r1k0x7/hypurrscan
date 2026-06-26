import React from 'react';
import { Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import DashboardPage from '@/pages/DashboardPage';
import WalletAnalyticsPage from '@/pages/WalletAnalyticsPage';
import TokenAnalyticsPage from '@/pages/TokenAnalyticsPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import WhaleTrackerPage from '@/pages/WhaleTrackerPage';
import WatchlistPage from '@/pages/WatchlistPage';
import ComparePage from '@/pages/ComparePage';
import AlertsPage from '@/pages/AlertsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SearchPage from '@/pages/SearchPage';
import WalletExplorerPage from '@/pages/explorer/WalletExplorerPage';
import TokenExplorerPage from '@/pages/explorer/TokenExplorerPage';
import BlockExplorerPage from '@/pages/explorer/BlockExplorerPage';
import TransactionExplorerPage from '@/pages/explorer/TransactionExplorerPage';
import HyperEVMExplorerPage from '@/pages/explorer/HyperEVMExplorerPage';
import ContractExplorerPage from '@/pages/explorer/ContractExplorerPage';
import NFTExplorerPage from '@/pages/explorer/NFTExplorerPage';
import ValidatorExplorerPage from '@/pages/explorer/ValidatorExplorerPage';
import VaultExplorerPage from '@/pages/explorer/VaultExplorerPage';
import LendingExplorerPage from '@/pages/explorer/LendingExplorerPage';

export interface RouteConfig {
  path: string;
  element: React.ReactElement;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  { path: '/', element: <HomePage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/search', element: <SearchPage /> },
  // Wallet / token detail pages
  { path: '/wallet/:address', element: <WalletAnalyticsPage /> },
  { path: '/token/:symbol', element: <TokenAnalyticsPage /> },
  // Leaderboard & analytics
  { path: '/leaderboard', element: <LeaderboardPage /> },
  { path: '/whales', element: <WhaleTrackerPage /> },
  { path: '/watchlist', element: <WatchlistPage /> },
  { path: '/compare', element: <ComparePage /> },
  { path: '/alerts', element: <AlertsPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  // Explorer pages
  { path: '/explorer/wallets', element: <WalletExplorerPage /> },
  { path: '/explorer/tokens', element: <TokenExplorerPage /> },
  { path: '/explorer/blocks', element: <BlockExplorerPage /> },
  { path: '/explorer/blocks/:id', element: <BlockExplorerPage /> },
  { path: '/explorer/transactions', element: <TransactionExplorerPage /> },
  { path: '/explorer/transactions/:hash', element: <TransactionExplorerPage /> },
  { path: '/explorer/hyperevm', element: <HyperEVMExplorerPage /> },
  { path: '/explorer/contracts', element: <ContractExplorerPage /> },
  { path: '/explorer/contracts/:address', element: <ContractExplorerPage /> },
  { path: '/explorer/nfts', element: <NFTExplorerPage /> },
  { path: '/explorer/nfts/:address', element: <NFTExplorerPage /> },
  { path: '/explorer/validators', element: <ValidatorExplorerPage /> },
  { path: '/explorer/vaults', element: <VaultExplorerPage /> },
  { path: '/explorer/vaults/:address', element: <VaultExplorerPage /> },
  { path: '/explorer/lending', element: <LendingExplorerPage /> },
  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
];
