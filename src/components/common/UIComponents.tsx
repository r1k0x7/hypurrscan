import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceChangeProps {
  value: number;
  suffix?: string;
  className?: string;
  showIcon?: boolean;
  iconSize?: number;
}

export function PriceChange({ value, suffix = '%', className, showIcon = true, iconSize = 12 }: PriceChangeProps) {
  const isPos = value > 0;
  const isNeg = value < 0;
  const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 font-mono text-xs font-medium',
      isPos ? 'text-positive' : isNeg ? 'text-negative' : 'text-muted-foreground',
      className
    )}>
      {showIcon && <Icon style={{ width: iconSize, height: iconSize }} />}
      {isPos ? '+' : ''}{value.toFixed(2)}{suffix}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
}

export function StatCard({ label, value, change, icon, subtitle, className, valueClassName }: StatCardProps) {
  return (
    <div className={cn('terminal-panel p-4 h-full', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
          <p className={cn('text-lg font-bold font-mono mt-1 truncate', valueClassName)}>{value}</p>
          {change !== undefined && (
            <PriceChange value={change} className="mt-0.5" />
          )}
          {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="shrink-0 w-8 h-8 rounded-sm bg-muted flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface AddressProps {
  address: string;
  chars?: number;
  className?: string;
  linkTo?: string;
  copyable?: boolean;
}

export function Address({ address, chars = 6, className, linkTo }: AddressProps) {
  const short = address && address.length > 12
    ? `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
    : address;

  const cls = cn('font-mono text-xs text-cyan hover:underline cursor-pointer', className);

  if (linkTo) {
    return <a href={linkTo} className={cls}>{short}</a>;
  }
  return <span className={cls}>{short}</span>;
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-positive/10 text-positive border-positive/20',
  failed: 'bg-negative/10 text-negative border-negative/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  active: 'bg-positive/10 text-positive border-positive/20',
  inactive: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  jailed: 'bg-negative/10 text-negative border-negative/20',
  long: 'bg-positive/10 text-positive border-positive/20',
  short: 'bg-negative/10 text-negative border-negative/20',
  buy: 'bg-positive/10 text-positive border-positive/20',
  sell: 'bg-negative/10 text-negative border-negative/20',
  filled: 'bg-positive/10 text-positive border-positive/20',
  cancelled: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  open: 'bg-cyan/10 text-cyan border-cyan/20',
  partially_filled: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium border',
      STATUS_COLORS[status] || 'bg-muted text-muted-foreground border-border',
      className
    )}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  live?: boolean;
}

export function SectionHeader({ title, subtitle, action, live }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground text-balance">{title}</h2>
          {live && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-positive/10 border border-positive/20">
              <div className="w-1 h-1 rounded-full bg-positive live-dot" />
              <span className="text-[9px] text-positive font-medium">LIVE</span>
            </div>
          )}
        </div>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 text-pretty">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center mb-3">
        <Minus className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function LiveDot() {
  return <div className="w-2 h-2 rounded-full bg-positive live-dot" />;
}
