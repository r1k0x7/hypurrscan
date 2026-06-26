// WebSocket manager with auto-reconnect and subscription management

type WSMessage = {
  type: string;
  data: unknown;
  channel?: string;
};

type Subscriber = (data: unknown) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string = '';
  private subscribers = new Map<string, Set<Subscriber>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private status: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private statusListeners = new Set<(status: string) => void>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  connect(url: string) {
    this.url = url;
    this.status = 'connecting';
    this.notifyStatus();
    try {
      this.ws = new WebSocket(url);
      this.ws.onopen = this.handleOpen;
      this.ws.onmessage = this.handleMessage;
      this.ws.onclose = this.handleClose;
      this.ws.onerror = this.handleError;
    } catch {
      this.status = 'error';
      this.notifyStatus();
      this.scheduleReconnect();
    }
  }

  private handleOpen = () => {
    this.status = 'connected';
    this.reconnectAttempts = 0;
    this.notifyStatus();
    this.startPing();
  };

  private handleMessage = (event: MessageEvent) => {
    try {
      const msg: WSMessage = JSON.parse(event.data);
      const channel = msg.channel || msg.type;
      const subs = this.subscribers.get(channel);
      if (subs) subs.forEach(fn => fn(msg.data));
      // Also broadcast to wildcard subscribers
      const wildcardSubs = this.subscribers.get('*');
      if (wildcardSubs) wildcardSubs.forEach(fn => fn(msg));
    } catch {
      // ignore parse errors
    }
  };

  private handleClose = () => {
    this.status = 'disconnected';
    this.notifyStatus();
    this.stopPing();
    this.scheduleReconnect();
  };

  private handleError = () => {
    this.status = 'error';
    this.notifyStatus();
  };

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.url);
    }, delay);
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30_000);
  }

  private stopPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  private notifyStatus() {
    this.statusListeners.forEach(fn => fn(this.status));
  }

  subscribe(channel: string, fn: Subscriber): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(fn);
    return () => {
      this.subscribers.get(channel)?.delete(fn);
    };
  }

  onStatusChange(fn: (status: string) => void): () => void {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => this.statusListeners.delete(fn);
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopPing();
    this.ws?.close();
    this.status = 'disconnected';
    this.notifyStatus();
  }

  getStatus() {
    return this.status;
  }
}

export const wsManager = new WebSocketManager();

// ── Hyperliquid Real-time WebSocket Emitter ──────────────────────────────────
// Connects to wss://api.hyperliquid.xyz/ws and re-emits normalized events
// Falls back to polling-based simulation if WS fails (e.g. CORS in browser)

export interface HLWSTrade {
  coin: string;
  side: 'B' | 'A';
  px: string;
  sz: string;
  time: number;
  hash: string;
  tid: number;
}

export interface HLWSAllMids {
  mids: Record<string, string>;
}

type RealtimeEventMap = {
  trades: HLWSTrade;
  allMids: HLWSAllMids;
  activeAssetCtx: { coin: string; ctx: unknown };
};

type RealtimeChannel = keyof RealtimeEventMap;
type AnyHandler = (data: unknown) => void;

class HyperliquidRealtimeEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 8;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribers = new Map<string, Set<AnyHandler>>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private simulationIntervals: ReturnType<typeof setInterval>[] = [];
  private useSimulation = false;
  private status: 'connecting' | 'connected' | 'disconnected' | 'simulation' = 'disconnected';
  private statusListeners = new Set<(status: string) => void>();
  private activeSubscriptions = new Set<string>(); // track what we've subscribed to on WS

  private WS_URL = 'wss://api.hyperliquid.xyz/ws';

  start() {
    this.connect();
  }

  stop() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.simulationIntervals.forEach(clearInterval);
    this.simulationIntervals = [];
    this.ws?.close();
    this.ws = null;
    this.status = 'disconnected';
    this.notifyStatus();
  }

  private connect() {
    this.status = 'connecting';
    this.notifyStatus();
    try {
      this.ws = new WebSocket(this.WS_URL);
      this.ws.onopen = this.handleOpen;
      this.ws.onmessage = this.handleMessage;
      this.ws.onclose = this.handleClose;
      this.ws.onerror = this.handleError;
    } catch {
      this.fallbackToSimulation();
    }
  }

  private handleOpen = () => {
    this.status = 'connected';
    this.reconnectAttempts = 0;
    this.useSimulation = false;
    this.notifyStatus();
    // Subscribe to all mids and trades for popular coins
    this.hlSubscribe({ type: 'allMids' });
    for (const coin of ['BTC', 'ETH', 'SOL', 'AVAX', 'ARB', 'MATIC', 'LINK', 'WIF', 'PEPE', 'DOGE']) {
      this.hlSubscribe({ type: 'trades', coin });
    }
    this.startPing();
  };

  private handleMessage = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data as string) as {
        channel: string;
        data: unknown;
      };
      if (!msg.channel) return;
      if (msg.channel === 'allMids') {
        this.emit('allMids', msg.data);
      } else if (msg.channel === 'trades') {
        const trades = msg.data as HLWSTrade[];
        for (const t of trades) this.emit('trades', t);
      } else if (msg.channel === 'activeAssetCtx') {
        this.emit('activeAssetCtx', msg.data);
      }
    } catch {
      // ignore
    }
  };

  private handleClose = () => {
    this.status = 'disconnected';
    this.notifyStatus();
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.scheduleReconnect();
  };

  private handleError = () => {
    // WS failed — fall back to simulation
    this.fallbackToSimulation();
  };

  private hlSubscribe(sub: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const key = JSON.stringify(sub);
      if (!this.activeSubscriptions.has(key)) {
        this.ws.send(JSON.stringify({ method: 'subscribe', subscription: sub }));
        this.activeSubscriptions.add(key);
      }
    }
  }

  private scheduleReconnect() {
    if (this.useSimulation) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.fallbackToSimulation();
      return;
    }
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30_000);
  }

  private fallbackToSimulation() {
    if (this.useSimulation) return;
    this.useSimulation = true;
    this.status = 'simulation';
    this.notifyStatus();
    this.startSimulation();
  }

  private startSimulation() {
    const TOKENS = ['BTC', 'ETH', 'SOL', 'AVAX', 'ARB', 'MATIC', 'LINK', 'WIF', 'PEPE', 'DOGE'];
    const BASE_PRICES: Record<string, number> = {
      BTC: 67420, ETH: 3541, SOL: 185, AVAX: 42,
      ARB: 1.12, MATIC: 0.87, LINK: 17.3, WIF: 2.4,
      PEPE: 0.000013, DOGE: 0.155,
    };
    const prices = { ...BASE_PRICES };

    // Simulate allMids every 2s
    const midsInterval = setInterval(() => {
      const mids: Record<string, string> = {};
      for (const coin of TOKENS) {
        prices[coin] *= 1 + (Math.random() - 0.5) * 0.001;
        mids[coin] = prices[coin].toFixed(prices[coin] < 0.01 ? 8 : prices[coin] < 1 ? 5 : 2);
      }
      this.emit('allMids', { mids });
    }, 2000);

    // Simulate trades every 600ms
    const tradesInterval = setInterval(() => {
      const coin = TOKENS[Math.floor(Math.random() * TOKENS.length)];
      const px = prices[coin] * (1 + (Math.random() - 0.5) * 0.002);
      const sz = (Math.random() * 5 + 0.01).toFixed(4);
      this.emit('trades', {
        coin,
        side: Math.random() > 0.5 ? 'B' : 'A',
        px: px.toFixed(px < 0.01 ? 8 : px < 1 ? 5 : 2),
        sz,
        time: Date.now(),
        hash: '0x' + Math.random().toString(16).slice(2).padEnd(64, '0'),
        tid: Date.now(),
      } as HLWSTrade);
    }, 600);

    this.simulationIntervals = [midsInterval, tradesInterval];
  }

  subscribe<C extends RealtimeChannel>(channel: C, fn: (data: RealtimeEventMap[C]) => void): () => void;
  subscribe(channel: string, fn: AnyHandler): () => void;
  subscribe(channel: string, fn: AnyHandler): () => void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set());
    }
    this.subscribers.get(channel)!.add(fn);
    return () => this.subscribers.get(channel)?.delete(fn);
  }

  private emit(channel: string, data: unknown) {
    this.subscribers.get(channel)?.forEach(fn => fn(data));
  }

  onStatusChange(fn: (status: string) => void): () => void {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => this.statusListeners.delete(fn);
  }

  private notifyStatus() {
    this.statusListeners.forEach(fn => fn(this.status));
  }

  getStatus() { return this.status; }
}

export const realtimeEmitter = new HyperliquidRealtimeEmitter();
