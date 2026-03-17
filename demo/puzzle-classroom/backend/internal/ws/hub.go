package ws

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// Message represents a WebSocket message
type Message struct {
	Type   string      `json:"type"`
	RoomID string      `json:"roomId,omitempty"`
	Data   interface{} `json:"data,omitempty"`
}

// Client represents a connected WebSocket client
type Client struct {
	ID     string
	UserID string
	Role   string
	RoomID string
	Conn   *websocket.Conn
	Hub    *Hub
	Send   chan []byte
}

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	Clients       map[string]*Client
	Rooms         map[string]map[string]*Client
	Register      chan *Client
	Unregister    chan *Client
	broadcastChan chan *BroadcastMessage
	mu            sync.RWMutex
}

// BroadcastMessage represents a message to broadcast to a room
type BroadcastMessage struct {
	RoomID  string
	Message []byte
	Exclude string
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		Clients:       make(map[string]*Client),
		Rooms:         make(map[string]map[string]*Client),
		Register:      make(chan *Client),
		Unregister:    make(chan *Client),
		broadcastChan: make(chan *BroadcastMessage),
	}
}

// Run starts the hub's main loop for handling client registration, unregistration, and broadcasting
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.ID] = client
			if client.RoomID != "" {
				if h.Rooms[client.RoomID] == nil {
					h.Rooms[client.RoomID] = make(map[string]*Client)
				}
				h.Rooms[client.RoomID][client.ID] = client
			}
			h.mu.Unlock()
			log.Printf("Client registered: %s", client.UserID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client.ID]; ok {
				delete(h.Clients, client.ID)
				if client.RoomID != "" {
					delete(h.Rooms[client.RoomID], client.ID)
					if len(h.Rooms[client.RoomID]) == 0 {
						delete(h.Rooms, client.RoomID)
					}
				}
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("Client unregistered: %s", client.UserID)

		case msg := <-h.broadcastChan:
			h.mu.RLock()
			room := h.Rooms[msg.RoomID]
			h.mu.RUnlock()
			if room != nil {
				for _, client := range room {
					if msg.Exclude == "" || client.ID != msg.Exclude {
						select {
						case client.Send <- msg.Message:
						default:
							close(client.Send)
							h.mu.Lock()
							delete(h.Clients, client.ID)
							delete(h.Rooms[msg.RoomID], client.ID)
							h.mu.Unlock()
						}
					}
				}
			}
		}
	}
}

// Broadcast sends a message to all clients in a room, optionally excluding a specific client
func (h *Hub) Broadcast(roomID string, message interface{}, exclude string) {
	data, _ := json.Marshal(message)
	h.broadcastChan <- &BroadcastMessage{RoomID: roomID, Message: data, Exclude: exclude}
}

// GetRoomClients returns all clients in a specific room
func (h *Hub) GetRoomClients(roomID string) []*Client {
	h.mu.RLock()
	defer h.mu.RUnlock()
	room := h.Rooms[roomID]
	if room == nil {
		return nil
	}
	clients := make([]*Client, 0, len(room))
	for _, c := range room {
		clients = append(clients, c)
	}
	return clients
}

// GetRoomCount returns the number of clients in a room
func (h *Hub) GetRoomCount(roomID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	room := h.Rooms[roomID]
	if room == nil {
		return 0
	}
	return len(room)
}

// GetTotalClients returns the total number of connected clients
func (h *Hub) GetTotalClients() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.Clients)
}

// RegisterClient registers a client with the hub
func (h *Hub) RegisterClient(client *Client) {
	h.Register <- client
}

// UnregisterClient unregisters a client from the hub
func (h *Hub) UnregisterClient(client *Client) {
	h.Unregister <- client
}