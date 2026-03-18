export type MessageType =
  | 'join_room'
  | 'leave_room'
  | 'submit_answer'
  | 'game:start'
  | 'game:next'
  | 'game:result'
  | 'game:end'
  | 'progress:update'
  | 'room:update'
  | 'room:created'
  | 'room:deleted'
  | 'room:updated'
  | 'user_joined'
  | 'error';

export interface WSMessage {
  type: MessageType;
  roomId?: string;
  data?: unknown;
}

type MessageHandler = (message: WSMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<MessageType, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private token: string | null = null;
  private onConnectCallbacks: Array<() => void> = [];

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.token = token; // Store token for reconnection
      // In development, connect directly to backend to avoid Vite proxy issues
      const wsHost = import.meta.env.DEV ? 'localhost:8080' : window.location.host;
      const wsProtocol = import.meta.env.DEV ? 'ws:' : (window.location.protocol === 'https:' ? 'wss:' : 'ws:');
      const wsUrl = `${wsProtocol}//${wsHost}/ws?token=${token}`;
      console.log('[WS] Connecting to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WS] Connected successfully, calling', this.onConnectCallbacks.length, 'onConnect callbacks');
        this.reconnectAttempts = 0;
        // Call any registered onConnect callbacks
        this.onConnectCallbacks.forEach(cb => {
          console.log('[WS] Calling onConnect callback');
          cb();
        });
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message: WSMessage = JSON.parse(event.data);
        console.log('[WS] Received message:', message.type);
        this.handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Closed:', event.code, event.reason);
        this.handleDisconnect(token);
      };
    });
  }

  // Register a callback to be called on successful connection (including reconnection)
  onConnect(callback: () => void) {
    this.onConnectCallbacks.push(callback);
  }

  clearOnConnectCallbacks() {
    this.onConnectCallbacks = [];
  }

  private handleDisconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(token), 1000 * this.reconnectAttempts);
    }
  }

  private handleMessage(message: WSMessage) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  on(type: MessageType, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off(type: MessageType, handler: MessageHandler) {
    this.handlers.get(type)?.delete(handler);
  }

  send(message: WSMessage) {
    console.log('[WS] Sending:', message.type, message.roomId || '');
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.log('[WS] Cannot send, readyState:', this.ws?.readyState);
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const wsService = new WebSocketService();