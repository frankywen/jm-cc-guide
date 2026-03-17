export type MessageType =
  | 'join_room'
  | 'leave_room'
  | 'submit_answer'
  | 'game:start'
  | 'game:result'
  | 'game:end'
  | 'room:update'
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

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message: WSMessage = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onerror = (error) => reject(error);
      this.ws.onclose = () => this.handleDisconnect(token);
    });
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
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const wsService = new WebSocketService();