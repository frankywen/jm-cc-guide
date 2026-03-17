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
	Name string `json:"name" binding:"required"`
}

func CreateRoom(teacherID, name string) (*models.Room, error) {
	room := models.Room{
		ID:        uuid.New().String(),
		Name:      name,
		TeacherID: teacherID,
		GameType:  "game24",
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
	err := database.GetDB().Where("status = ?", "waiting").Find(&rooms).Error
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
	if room.Status != "waiting" {
		return errors.New("房间状态不允许加入")
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