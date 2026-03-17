package models

import "time"

type GameRecord struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	RoomID    string    `json:"roomId" gorm:"not null;index"`
	StudentID string    `json:"studentId" gorm:"not null;index"`
	GameType  string    `json:"gameType" gorm:"not null"`
	Question  string    `json:"question" gorm:"not null"`
	Answer    string    `json:"answer"`
	Correct   bool      `json:"correct"`
	TimeSpent int       `json:"timeSpent"` // seconds
	Score     int       `json:"score"`
	CreatedAt time.Time `json:"createdAt"`
}

func (GameRecord) TableName() string {
	return "game_records"
}