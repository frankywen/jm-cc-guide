package ws

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// writeWait is the time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// pongWait is the time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// pingPeriod is the time to send pings to peer (must be less than pongWait)
	pingPeriod = 54 * time.Second

	// maxMessageSize is the maximum message size allowed from peer
	maxMessageSize = 512
)

// upgrader is the websocket upgrader configuration
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// GetUpgrader returns the websocket upgrader
func GetUpgrader() *websocket.Upgrader {
	return &upgrader
}

// ReadPump pumps messages from the websocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err == nil {
			c.handleMessage(&msg)
		} else {
			log.Printf("Failed to unmarshal message: %v", err)
		}
	}
}

// WritePump pumps messages from the hub to the websocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub closed the channel
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Batch queued messages into single write
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage handles incoming messages from the client
func (c *Client) handleMessage(msg *Message) {
	log.Printf("[WS] handleMessage: type=%s, roomID=%s, userID=%s", msg.Type, msg.RoomID, c.UserID)
	switch msg.Type {
	case "join_room":
		c.handleJoinRoom(msg)
	case "game:start":
		c.handleGameStart(msg)
	case "game:next":
		c.handleGameNext(msg)
	case "game:result":
		c.handleGameResult(msg)
	case "game:end":
		c.handleGameEnd(msg)
	default:
		log.Printf("Unknown message type: %s", msg.Type)
	}
}

// handleJoinRoom handles a join_room message
func (c *Client) handleJoinRoom(msg *Message) {
	log.Printf("[WS] handleJoinRoom called: userID=%s, roomID=%s", c.UserID, msg.RoomID)
	if msg.RoomID == "" {
		log.Printf("[WS] handleJoinRoom error: room_id is empty")
		c.SendError("room_id is required")
		return
	}

	c.RoomID = msg.RoomID
	c.Hub.Register <- c

	// Notify others in the room
	log.Printf("[WS] Broadcasting user_joined to room %s, userID=%s", msg.RoomID, c.UserID)
	c.Hub.Broadcast(msg.RoomID, Message{
		Type: "user_joined",
		Data: map[string]string{
			"userId": c.UserID,
			"role":   c.Role,
		},
	}, c.ID)
}

// handleGameStart handles a game:start message
func (c *Client) handleGameStart(msg *Message) {
	if c.RoomID == "" {
		c.SendError("not in a room")
		return
	}

	// Broadcast game start to all clients in the room
	c.Hub.Broadcast(c.RoomID, Message{
		Type: "game:start",
		Data: msg.Data,
	}, "")
}

// handleGameNext handles a game:next message (student requests next question)
func (c *Client) handleGameNext(msg *Message) {
	if c.RoomID == "" {
		c.SendError("not in a room")
		return
	}

	// Broadcast game:next to all clients in the room
	c.Hub.Broadcast(c.RoomID, Message{
		Type: "game:next",
		Data: msg.Data,
	}, "")
}

// handleGameResult handles a game:result message
func (c *Client) handleGameResult(msg *Message) {
	if c.RoomID == "" {
		c.SendError("not in a room")
		return
	}

	// Broadcast game result to all clients in the room
	c.Hub.Broadcast(c.RoomID, Message{
		Type: "game:result",
		Data: msg.Data,
	}, "")
}

// handleGameEnd handles a game:end message
func (c *Client) handleGameEnd(msg *Message) {
	if c.RoomID == "" {
		c.SendError("not in a room")
		return
	}

	// Broadcast game end to all clients in the room
	c.Hub.Broadcast(c.RoomID, Message{
		Type: "game:end",
		Data: msg.Data,
	}, "")
}

// SendError sends an error message to the client
func (c *Client) SendError(message string) {
	errMsg, _ := json.Marshal(Message{
		Type: "error",
		Data: map[string]string{"message": message},
	})
	select {
	case c.Send <- errMsg:
	default:
		// Channel full or closed, skip
	}
}

// SendMessage sends a message to the client
func (c *Client) SendMessage(msg *Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return
	}

	select {
	case c.Send <- data:
	default:
		// Channel full or closed, skip
	}
}