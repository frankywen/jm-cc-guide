package handlers

import (
	"github.com/gin-gonic/gin"

	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/services"
	"github.com/jm-cc-guide/puzzle-classroom/backend/pkg/utils"
)

func CreateRoom(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req services.CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}
	room, err := services.CreateRoom(userID.(string), req.Name)
	if err != nil {
		utils.InternalError(c, "创建房间失败")
		return
	}
	utils.Success(c, room)
}

func GetMyRooms(c *gin.Context) {
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	var rooms interface{}
	var err error
	if role == "teacher" {
		rooms, err = services.GetRoomsByTeacher(userID.(string))
	} else {
		rooms, err = services.GetAvailableRooms()
	}
	if err != nil {
		utils.InternalError(c, "获取房间列表失败")
		return
	}
	utils.Success(c, rooms)
}

func GetRoom(c *gin.Context) {
	roomID := c.Param("id")
	room, err := services.GetRoomByID(roomID)
	if err != nil {
		utils.NotFound(c, "房间不存在")
		return
	}
	students, _ := services.GetStudentsInRoom(roomID)
	utils.Success(c, gin.H{"room": room, "students": students})
}

func JoinRoom(c *gin.Context) {
	userID, _ := c.Get("userID")
	roomID := c.Param("id")
	if err := services.JoinRoom(roomID, userID.(string)); err != nil {
		utils.Error(c, 400, err.Error())
		return
	}
	utils.Success(c, gin.H{"message": "加入成功"})
}

func UpdateRoomStatus(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required,oneof=waiting playing finished"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}
	userID, _ := c.Get("userID")
	room, err := services.GetRoomByID(roomID)
	if err != nil {
		utils.NotFound(c, "房间不存在")
		return
	}
	if room.TeacherID != userID.(string) {
		utils.Error(c, 403, "无权操作")
		return
	}
	if err := services.UpdateRoomStatus(roomID, req.Status); err != nil {
		utils.InternalError(c, "更新状态失败")
		return
	}
	utils.Success(c, gin.H{"message": "状态更新成功"})
}

func DeleteRoom(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("userID")
	room, err := services.GetRoomByID(roomID)
	if err != nil {
		utils.NotFound(c, "房间不存在")
		return
	}
	if room.TeacherID != userID.(string) {
		utils.Error(c, 403, "无权操作")
		return
	}
	if err := services.DeleteRoom(roomID); err != nil {
		utils.InternalError(c, "删除房间失败")
		return
	}
	utils.Success(c, gin.H{"message": "删除成功"})
}