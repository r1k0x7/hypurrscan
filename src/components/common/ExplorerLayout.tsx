// Shared ExplorerLayout used by all 10 explorer pages
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Layout from '@/components/layout/Layout';
import { TableSkeleton } from '@/components/common/Skeletons';
import { toast } from 'sonner';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
}

interface ExplorerLayoutProps<T> {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  onRefresh: () => void;
  rowKey: (row: T) => string;
  getRowLink?: (row: T) => string;
  extraFilters?: React.ReactNode;
  perPage?: number;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  searchValue?: string;
}

export function ExplorerLayout<T>({
  title, subtitle, columns, data, loading, onRefresh,
  rowKey, getRowLink, extraFilters, perPage = 20,
  searchPlaceholder = 'Search...', onSearch, searchValue = '',
}: ExplorerLayoutProps<T>) {
  const [page, setPage] = useState(1);
  const paginated = data.slice(0, page * perPage);
  const hasMore = paginated.length < data.length;

  const handleExport = (fmt: 'csv' | 'json') => {
    const d = fmt === 'json' ? JSON.stringify(data, null, 2)
      : columns.map(c => c.label).join(',') + '\n' +
        data.map(row => columns.map(c => {
          const val = (row as Record<string, unknown>)[c.key];
          return typeof val === 'string' || typeof val === 'number' ? val : '';
        }).join(',')).join('\n');
    const blob = new Blob([d], { type: fmt === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.${fmt}`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${fmt.toUpperCase()}`);
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-balance">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground text-pretty">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExport('csv')}>
              <Download className="w-3.5 h-3.5 mr-1" />CSV
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExport('json')}>
              <Download className="w-3.5 h-3.5 mr-1" />JSON
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onRefresh}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh
            </Button>
          </div>
        </div>

        <div className="terminal-panel">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-border flex-wrap">
            {onSearch && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={e => { onSearch(e.target.value); setPage(1); }}
                  className="h-7 pl-7 text-xs w-56 font-mono"
                />
              </div>
            )}
            {extraFilters}
            <div className="text-[11px] text-muted-foreground ml-auto shrink-0">
              {data.length.toLocaleString()} {title.toLowerCase()}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  {columns.map(col => (
                    <th key={col.key} className="text-left text-[10px] text-muted-foreground px-3 py-2 font-medium uppercase whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? null : paginated.map(row => (
                  <tr key={rowKey(row)} className="border-b border-border/30 hover:bg-accent/20 transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className="px-3 py-2.5 whitespace-nowrap">
                        {getRowLink && col === columns[0] ? (
                          <Link to={getRowLink(row)} className="hover:underline">
                            {col.render(row)}
                          </Link>
                        ) : col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <TableSkeleton rows={10} />}
          </div>

          {!loading && hasMore && (
            <div className="p-4 border-t border-border text-center">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>
                Load More ({data.length - paginated.length} remaining)
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
