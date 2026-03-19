package models

import "time"

// GameSession represents a multi-question game session
type GameSession struct {
	ID             string    `json:"id" gorm:"primaryKey"`
	RoomID         string    `json:"roomId" gorm:"not null;index"`
	TotalQuestions int       `json:"totalQuestions" gorm:"not null"`
	CurrentIndex   int       `json:"currentIndex" gorm:"default:0"` // Current question index (teacher-controlled)
	Questions      string    `json:"questions" gorm:"not null"`     // JSON: "[[1,2,3,4],[5,6,7,8],...]" or SudokuQuestion JSON
	Status         string    `json:"status" gorm:"default:active"`
	GameType       string    `json:"gameType" gorm:"default:game24"` // game24 or sudoku
	Difficulty     string    `json:"difficulty"`                     // For Sudoku: easy, medium, hard, etc.
	CreatedAt      time.Time `json:"createdAt"`
}

func (GameSession) TableName() string {
	return "game_sessions"
}

// SudokuQuestion represents a Sudoku puzzle with solution
type SudokuQuestion struct {
	Puzzle   string `json:"puzzle"`
	Solution string `json:"solution"`
}

// StudentProgress tracks a student's progress in a game session
type StudentProgress struct {
	ID             string    `json:"id" gorm:"primaryKey"`
	SessionID      string    `json:"sessionId" gorm:"not null;index"`
	StudentID      string    `json:"studentId" gorm:"not null;index"`
	CurrentIndex   int       `json:"currentIndex" gorm:"default:0"`
	CompletedCount int       `json:"completedCount" gorm:"default:0"`
	TotalScore     int       `json:"totalScore" gorm:"default:0"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

func (StudentProgress) TableName() string {
	return "student_progress"
}

// GameRecord represents a single answer submission
type GameRecord struct {
	ID            string    `json:"id" gorm:"primaryKey"`
	RoomID        string    `json:"roomId" gorm:"not null;index"`
	SessionID     string    `json:"sessionId" gorm:"index"`
	StudentID     string    `json:"studentId" gorm:"not null;index"`
	QuestionIndex int       `json:"questionIndex"`
	GameType      string    `json:"gameType" gorm:"not null"`
	Question      string    `json:"question" gorm:"not null"`
	Answer        string    `json:"answer"`
	Correct       bool      `json:"correct"`
	TimeSpent     int       `json:"timeSpent"` // seconds
	Score         int       `json:"score"`
	CreatedAt     time.Time `json:"createdAt"`
}

func (GameRecord) TableName() string {
	return "game_records"
}