package models

import "time"

type User struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"not null"`
	Role      string    `json:"role" gorm:"not null"` // "student" | "teacher"
	CreatedAt time.Time `json:"createdAt"`
}

func (User) TableName() string {
	return "users"
}