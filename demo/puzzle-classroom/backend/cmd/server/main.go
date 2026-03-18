package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/database"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/handlers"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/ws"
	"github.com/jm-cc-guide/puzzle-classroom/backend/pkg/utils"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

func main() {
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.Close()

	// Create WebSocket Hub
	hub := ws.NewHub()
	go hub.Run()

	// Create router
	r := gin.Default()
	r.Use(handlers.CORSMiddleware())

	// API routes
	api := r.Group("/api")
	{
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)

		auth := api.Group("")
		auth.Use(handlers.AuthMiddleware())
		{
			auth.GET("/me", handlers.GetCurrentUser)
			auth.GET("/rooms", handlers.GetMyRooms)
			auth.POST("/rooms", handlers.TeacherOnly(), handlers.CreateRoom)
			auth.GET("/rooms/:id", handlers.GetRoom)
			auth.GET("/rooms/:id/gameState", handlers.GetCurrentGameState)
			auth.POST("/rooms/:id/join", handlers.JoinRoom)
			auth.POST("/rooms/:id/answer", handlers.SubmitAnswer)
			auth.PUT("/rooms/:id/status", handlers.UpdateRoomStatus)
			auth.DELETE("/rooms/:id", handlers.DeleteRoom)
		}

		// Game session routes (outside auth group to debug)
		game := api.Group("")
		game.Use(handlers.AuthMiddleware())
		{
			game.POST("/startGame", handlers.StartGame)
			game.GET("/gameProgress", handlers.GetGameProgress)
			game.POST("/getNextQuestion", handlers.GetNextQuestion)
		}
	}

	// WebSocket route
	r.GET("/ws", func(c *gin.Context) {
		token := c.Query("token")
		if token == "" {
			c.JSON(401, gin.H{"error": "未登录"})
			return
		}

		claims, err := utils.ParseToken(token)
		if err != nil {
			c.JSON(401, gin.H{"error": "Token无效"})
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Println("WebSocket upgrade error:", err)
			return
		}

		client := &ws.Client{
			ID:     claims.UserID + "_" + c.ClientIP(),
			UserID: claims.UserID,
			Role:   claims.Role,
			Conn:   conn,
			Hub:    hub,
			Send:   make(chan []byte, 256),
		}

		hub.RegisterClient(client)
		go client.WritePump()
		go client.ReadPump()
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}