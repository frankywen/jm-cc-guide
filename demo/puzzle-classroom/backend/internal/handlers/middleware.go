package handlers

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jm-cc-guide/puzzle-classroom/backend/pkg/utils"
)

// AuthMiddleware validates JWT token and sets user context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "未登录")
			c.Abort()
			return
		}

		// Extract Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.Unauthorized(c, "Token格式错误")
			c.Abort()
			return
		}

		// Parse and validate token
		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			utils.Unauthorized(c, "Token无效或已过期")
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// TeacherOnly ensures only teachers can access the endpoint
func TeacherOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			utils.Unauthorized(c, "未登录")
			c.Abort()
			return
		}

		if role != "teacher" {
			utils.Error(c, 403, "仅老师可访问")
			c.Abort()
			return
		}

		c.Next()
	}
}

// CORSMiddleware allows all origins for development
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}