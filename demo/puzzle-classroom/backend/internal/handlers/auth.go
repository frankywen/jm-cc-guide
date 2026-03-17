package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/services"
	"github.com/jm-cc-guide/puzzle-classroom/backend/pkg/utils"
)

func Register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	user, err := services.Register(req)
	if err != nil {
		utils.Error(c, 400, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role,
	})
}

func Login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	user, token, err := services.Login(req)
	if err != nil {
		utils.Error(c, 401, err.Error())
		return
	}

	utils.Success(c, gin.H{
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
		},
		"token": token,
	})
}

func GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.Unauthorized(c, "未登录")
		return
	}

	user, err := services.GetUserByID(userID.(string))
	if err != nil {
		utils.Error(c, 404, "用户不存在")
		return
	}

	utils.Success(c, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role,
	})
}