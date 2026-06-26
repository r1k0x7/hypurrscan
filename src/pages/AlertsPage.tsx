import React, { useState } from 'react';
import { Bell, BellOff, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Layout from '@/components/layout/Layout';
import { EmptyState, StatusBadge } from '@/components/common/UIComponents';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import type { Alert } from '@/types';

function AlertRow({ alert, onToggle, onDelete }: { alert: Alert; onToggle: () => void; onDelete: () => void }) {
  const TYPE_COLORS: Record<string, string> = {
    price: 'bg-cyan/10 text-cyan border-cyan/20',
    wallet: 'bg-positive/10 text-positive border-positive/20',
    liquidation: 'bg-negative/10 text-negative border-negative/20',
    whale: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };
  return (
    <div className={`flex items-center gap-3 p-3 border-b border-border/30 ${!alert.enabled ? 'opacity-50' : ''}`}>
      <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 border ${TYPE_COLORS[alert.type]}`}>
        <Bell className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold">{alert.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${TYPE_COLORS[alert.type]}`}>
            {alert.type}
          </span>
          {alert.triggered && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              TRIGGERED
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {alert.target} {alert.condition} ${alert.threshold.toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          {alert.enabled ? <ToggleRight className="w-5 h-5 text-positive" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-negative">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CreateAlertDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { addAlert } = useAppStore();
  const [form, setForm] = useState({ type: 'price', target: '', condition: 'above', threshold: '', label: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.target || !form.threshold || !form.label) {
      toast.error('Please fill all fields'); return;
    }
    addAlert({
      type: form.type as Alert['type'],
      target: form.target,
      condition: form.condition as Alert['condition'],
      threshold: parseFloat(form.threshold),
      enabled: true,
      label: form.label,
    });
    toast.success('Alert created!');
    onOpenChange(false);
    setForm({ type: 'price', target: '', condition: 'above', threshold: '', label: '' });
  };

  return (
    <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Alert</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Alert Type</label>
          <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price Alert</SelectItem>
              <SelectItem value="wallet">Wallet Activity</SelectItem>
              <SelectItem value="liquidation">Liquidation</SelectItem>
              <SelectItem value="whale">Whale Activity</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Label</label>
          <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="h-8 text-xs" placeholder="Alert name" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Target (token symbol or address)</label>
          <Input value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} className="h-8 text-xs font-mono" placeholder="BTC or 0x..." />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Condition</label>
            <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Above</SelectItem>
                <SelectItem value="below">Below</SelectItem>
                <SelectItem value="change">% Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Threshold</label>
            <Input value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} className="h-8 text-xs font-mono" placeholder="0.00" type="number" />
          </div>
        </div>
        <Button type="submit" className="w-full h-8 text-xs">Create Alert</Button>
      </form>
    </DialogContent>
  );
}

export default function AlertsPage() {
  const { alerts, toggleAlert, deleteAlert } = useAppStore();
  const [open, setOpen] = useState(false);

  return (
    <Layout>
      <div className="max-w-[900px] mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-balance">Alert System</h1>
            <p className="text-xs text-muted-foreground text-pretty">{alerts.length} alerts configured</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />New Alert
              </Button>
            </DialogTrigger>
            <CreateAlertDialog open={open} onOpenChange={setOpen} />
          </Dialog>
        </div>

        <div className="terminal-panel">
          {alerts.length === 0 ? (
            <div className="p-8">
              <EmptyState message="No alerts configured. Create your first alert to get notified." />
            </div>
          ) : (
            alerts.map(alert => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onToggle={() => toggleAlert(alert.id)}
                onDelete={() => { deleteAlert(alert.id); toast.info('Alert deleted'); }}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
