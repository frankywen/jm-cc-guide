package models

import "time"

type Room struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"not null"`
	TeacherID string    `json:"teacherId" gorm:"not null;index"`
	GameType  string    `json:"gameType" gorm:"default:game24"`
	Status    string    `json:"status" gorm:"default:waiting"` // waiting, playing, filled
	Students  []string  `json:"students" gorm:"-"`             // 学生ID列表，由服务层填充
	CreatedAt time.Time `json:"createdAt"`
}

func (Room) TableName() string {
	return "rooms"
}

type RoomStudent struct {
	RoomID    string    `json:"roomId" gorm:"primaryKey"`
	StudentID string    `json:"studentId" gorm:"primaryKey"`
	JoinedAt  time.Time `json:"joinedAt"`
}

func (RoomStudent) TableName() string {
	return "room_students"
}