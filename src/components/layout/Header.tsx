import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, Moon, Sun, Menu, X, ChevronDown,
  Activity, TrendingUp, Wallet, Layers, BarChart2, Zap,
  Star, AlertTriangle, ArrowUpDown, Users, Database, Code,
  Image, Shield, Vault, Banknote, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/stores/appStore';
import { formatAddress } from '@/lib/mockData';
import type { SearchResult } from '@/types';
import { motion, AnimatePresence } from 'motion/react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: Activity },
  {
    label: 'Explorer', icon: Layers,
    children: [
      { label: 'Wallets', path: '/explorer/wallets', icon: Wallet },
      { label: 'Tokens', path: '/explorer/tokens', icon: TrendingUp },
      { label: 'Blocks', path: '/explorer/blocks', icon: Database },
      { label: 'Transactions', path: '/explorer/transactions', icon: ArrowUpDown },
      { label: 'HyperEVM', path: '/explorer/hyperevm', icon: Globe },
      { label: 'Contracts', path: '/explorer/contracts', icon: Code },
      { label: 'NFTs', path: '/explorer/nfts', icon: Image },
      { label: 'Validators', path: '/explorer/validators', icon: Shield },
      { label: 'Vaults', path: '/explorer/vaults', icon: Vault },
      { label: 'Lending', path: '/explorer/lending', icon: Banknote },
    ]
  },
  { label: 'Leaderboard', path: '/leaderboard', icon: BarChart2 },
  { label: 'Whales', path: '/whales', icon: Zap },
  { label: 'Watchlist', path: '/watchlist', icon: Star },
  { label: 'Compare', path: '/compare', icon: Users },
  { label: 'Alerts', path: '/alerts', icon: AlertTriangle },
];

function mockSearch(q: string): SearchResult[] {
  if (!q.trim()) return [];
  const results: SearchResult[] = [];
  if (q.startsWith('0x') && q.length > 10) {
    if (q.length >= 40) {
      results.push({ type: 'wallet', id: q, title: formatAddress(q), subtitle: 'Wallet Address' });
      results.push({ type: 'contract', id: q, title: formatAddress(q), subtitle: 'Contract' });
    }
    if (q.length === 66) {
      results.push({ type: 'transaction', id: q, title: formatAddress(q, 8), subtitle: 'Transaction Hash' });
    }
  } else if (/^\d+$/.test(q)) {
    results.push({ type: 'block', id: q, title: `Block #${q}`, subtitle: 'Block Number' });
  } else {
    const tokens = ['BTC', 'ETH', 'SOL', 'AVAX', 'ARB', 'OP', 'MATIC', 'LINK', 'UNI', 'AAVE'];
    tokens.filter(t => t.toLowerCase().includes(q.toLowerCase())).slice(0, 3).forEach(t => {
      results.push({ type: 'token', id: t, title: t, subtitle: 'Token' });
    });
    if (results.length === 0) {
      results.push({ type: 'wallet', id: q, title: `Search: ${q}`, subtitle: 'Wallet' });
    }
  }
  return results.slice(0, 6);
}

const TYPE_COLORS: Record<string, string> = {
  wallet: 'bg-cyan/10 text-cyan border-cyan/20',
  token: 'bg-positive/10 text-positive border-positive/20',
  transaction: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  block: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  contract: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  nft: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  validator: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  vault: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  hyperevm: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

function getResultPath(r: SearchResult): string {
  switch (r.type) {
    case 'wallet': return `/wallet/${r.id}`;
    case 'token': return `/token/${r.id}`;
    case 'transaction': return `/explorer/transactions/${r.id}`;
    case 'block': return `/explorer/blocks/${r.id}`;
    case 'contract': return `/explorer/contracts/${r.id}`;
    default: return `/search?q=${encodeURIComponent(r.id)}`;
  }
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, addSearchHistory, searchHistory, clearSearchHistory } = useAppStore();
  const unreadCount = useAppStore(s => s.notifications.filter(n => !n.read).length);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (q.length >= 2) {
      setSearchResults(mockSearch(q));
    } else {
      setSearchResults([]);
    }
  }, []);

  const handleSelectResult = (r: SearchResult) => {
    addSearchHistory(searchQuery);
    setSearchOpen(false);
    setSearchQuery('');
    navigate(getResultPath(r));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addSearchHistory(searchQuery);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center px-3 gap-2">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0 mr-1">
          <div className="w-7 h-7 rounded-sm bg-cyan flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-cyan-foreground" />
          </div>
          <span className="font-bold text-sm hidden sm:block gradient-text">HypurrScan</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <AnimatePresence>
                  {activeDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 pt-1 z-50"
                    >
                      <div className="bg-popover border border-border rounded-sm shadow-lg py-1 min-w-[180px]">
                        {item.children.map(child => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          >
                            <child.icon className="w-3.5 h-3.5" />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link key={item.path} to={item.path!}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 gap-1 text-xs ${location.pathname === item.path ? 'text-cyan' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Button>
              </Link>
            )
          )}
        </nav>

        {/* Search */}
        <div ref={searchRef} className="flex-1 min-w-0 max-w-md relative mx-1 md:mx-2">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Cari wallet, token, tx..."
                className="h-8 pl-8 pr-3 text-xs bg-muted/50 border-border/50 focus:border-cyan focus:ring-0 font-mono w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </form>
          <AnimatePresence>
            {searchOpen && (searchResults.length > 0 || searchHistory.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-sm shadow-lg z-50 overflow-hidden"
              >
                {searchResults.length > 0 ? (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider border-b border-border">
                      Results
                    </div>
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectResult(r)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
                      >
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 shrink-0 ${TYPE_COLORS[r.type] || ''}`}>
                          {r.type}
                        </Badge>
                        <span className="text-xs font-mono truncate">{r.title}</span>
                        {r.subtitle && <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{r.subtitle}</span>}
                      </button>
                    ))}
                  </div>
                ) : searchHistory.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Recent</span>
                      <button onClick={clearSearchHistory} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>
                    </div>
                    {searchHistory.map((h, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(h)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
                      >
                        <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs font-mono truncate">{h}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-sm bg-positive/10 border border-positive/20">
            <div className="w-1.5 h-1.5 rounded-full bg-positive live-dot" />
            <span className="text-[10px] text-positive font-medium">LIVE</span>
          </div>

          <Link to="/notifications">
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] bg-negative text-white border-0">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-border overflow-hidden"
          >
            <div className="px-2 py-3 space-y-0.5 max-h-[70vh] overflow-y-auto">
              {NAV_ITEMS.map((item) =>
                item.children ? (
                  <div key={item.label}>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      <item.icon className="w-3.5 h-3.5 shrink-0" />
                      {item.label}
                    </div>
                    <div className="pl-4 space-y-0.5">
                      {item.children.map(child => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
                        >
                          <child.icon className="w-3.5 h-3.5 shrink-0" />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path!}
                    className={`flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-xs rounded-sm transition-colors ${location.pathname === item.path ? 'text-cyan bg-cyan/5' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
