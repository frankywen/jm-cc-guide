package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/database"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/models"
)

type CreateRoomRequest struct {
	Name     string `json:"name" binding:"required"`
	GameType string `json:"gameType"` // game24 or sudoku, defaults to game24
}

func CreateRoom(teacherID, name string, gameType string) (*models.Room, error) {
	if gameType == "" {
		gameType = "game24"
	}
	if gameType != "game24" && gameType != "sudoku" {
		gameType = "game24"
	}
	room := models.Room{
		ID:        uuid.New().String(),
		Name:      name,
		TeacherID: teacherID,
		GameType:  gameType,
		Status:    "waiting",
		CreatedAt: time.Now(),
	}
	if err := database.GetDB().Create(&room).Error; err != nil {
		return nil, err
	}
	return &room, nil
}

func GetRoomByID(roomID string) (*models.Room, error) {
	var room models.Room
	if err := database.GetDB().Where("id = ?", roomID).First(&room).Error; err != nil {
		return nil, err
	}
	return &room, nil
}

func GetRoomsByTeacher(teacherID string) ([]models.Room, error) {
	var rooms []models.Room
	err := database.GetDB().Where("teacher_id = ?", teacherID).Find(&rooms).Error
	return rooms, err
}

func GetAvailableRooms() ([]models.Room, error) {
	var rooms []models.Room
	// Show rooms that are waiting or playing (students can join both)
	err := database.GetDB().Where("status IN ?", []string{"waiting", "playing"}).Find(&rooms).Error
	return rooms, err
}

func JoinRoom(roomID, studentID string) error {
	db := database.GetDB()
	var room models.Room
	if err := db.Where("id = ?", roomID).First(&room).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.New("房间不存在")
		}
		return err
	}
	// Allow joining in both waiting and playing status (for late joiners)
	if room.Status == "finished" {
		return errors.New("房间已结束")
	}
	var existing models.RoomStudent
	if err := db.Where("room_id = ? AND student_id = ?", roomID, studentID).First(&existing).Error; err == nil {
		return errors.New("已经加入该房间")
	}
	roomStudent := models.RoomStudent{
		RoomID:    roomID,
		StudentID: studentID,
		JoinedAt:  time.Now(),
	}
	return db.Create(&roomStudent).Error
}

func GetStudentsInRoom(roomID string) ([]models.User, error) {
	var students []models.User
	err := database.GetDB().Table("users").
		Select("users.*").
		Joins("JOIN room_students ON users.id = room_students.student_id").
		Where("room_students.room_id = ?", roomID).
		Find(&students).Error
	return students, err
}

func UpdateRoomStatus(roomID, status string) error {
	return database.GetDB().Model(&models.Room{}).Where("id = ?", roomID).Update("status", status).Error
}

func DeleteRoom(roomID string) error {
	db := database.GetDB()
	db.Where("room_id = ?", roomID).Delete(&models.RoomStudent{})
	return db.Delete(&models.Room{}, "id = ?", roomID).Error
}

// GetAllRooms returns all rooms (admin only)
func GetAllRooms() ([]models.Room, error) {
	var rooms []models.Room
	err := database.GetDB().Find(&rooms).Error
	return rooms, err
}

// AdminDeleteRoom allows admin to delete any room
func AdminDeleteRoom(roomID string) error {
	return DeleteRoom(roomID)
}

// AdminUpdateRoom allows admin to update room name and status
func AdminUpdateRoom(roomID, name, status string) error {
	updates := map[string]interface{}{}
	if name != "" {
		updates["name"] = name
	}
	if status != "" {
		updates["status"] = status
	}
	if len(updates) == 0 {
		return nil
	}
	return database.GetDB().Model(&models.Room{}).Where("id = ?", roomID).Updates(updates).Error
}

// GetRoomsWithTeacherInfo returns all rooms with teacher information (admin only)
func GetRoomsWithTeacherInfo() ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := database.GetDB().Table("rooms").
		Select("rooms.*, users.username as teacher_name").
		Joins("LEFT JOIN users ON rooms.teacher_id = users.id").
		Find(&results).Error
	return results, err
}

// AdminBatchDeleteRooms allows admin to delete multiple rooms
func AdminBatchDeleteRooms(roomIDs []string) error {
	db := database.GetDB()
	// Delete room students first
	db.Where("room_id IN ?", roomIDs).Delete(&models.RoomStudent{})
	// Delete rooms
	return db.Delete(&models.Room{}, "id IN ?", roomIDs).Error
}