package services

import (
	"time"

	"github.com/google/uuid"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/database"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/games"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/models"
)

// GameQuestion represents a game question response
type GameQuestion struct {
	Numbers []int `json:"numbers"`
}

// GenerateGame24Question generates a new 24-point game question
func GenerateGame24Question() *GameQuestion {
	return &GameQuestion{
		Numbers: games.GenerateQuestion(),
	}
}

// ValidateGame24Answer validates a player's answer for the 24-point game
func ValidateGame24Answer(numbers []int, answer string) bool {
	return games.ValidateAnswer(numbers, answer)
}

// SaveGameRecord saves a game record to the database
func SaveGameRecord(roomID, studentID, gameType, question, answer string, correct bool, timeSpent int) (*models.GameRecord, error) {
	score := 0
	if correct {
		score = games.CalculateScore(timeSpent)
	}

	record := models.GameRecord{
		ID:        uuid.New().String(),
		RoomID:    roomID,
		StudentID: studentID,
		GameType:  gameType,
		Question:  question,
		Answer:    answer,
		Correct:   correct,
		TimeSpent: timeSpent,
		Score:     score,
		CreatedAt: time.Now(),
	}

	if err := database.GetDB().Create(&record).Error; err != nil {
		return nil, err
	}

	return &record, nil
}

// GetGameRecords retrieves all game records for a room
func GetGameRecords(roomID string) ([]models.GameRecord, error) {
	var records []models.GameRecord
	err := database.GetDB().Where("room_id = ?", roomID).Order("created_at desc").Find(&records).Error
	return records, err
}

// GetStudentRecords retrieves all game records for a specific student in a room
func GetStudentRecords(roomID, studentID string) ([]models.GameRecord, error) {
	var records []models.GameRecord
	err := database.GetDB().Where("room_id = ? AND student_id = ?", roomID, studentID).Order("created_at desc").Find(&records).Error
	return records, err
}