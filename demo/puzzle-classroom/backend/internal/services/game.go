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

// SudokuQuestionResponse represents a Sudoku question response
type SudokuQuestionResponse struct {
	Puzzle   string `json:"puzzle"`
	Solution string `json:"solution,omitempty"` // Only included for teacher
}

// GenerateGame24Question generates a new 24-point game question
func GenerateGame24Question() *GameQuestion {
	return &GameQuestion{
		Numbers: games.GenerateQuestion(),
	}
}

// GenerateSudokuQuestion generates a new Sudoku question
func GenerateSudokuQuestion(difficulty string) *SudokuQuestionResponse {
	puzzle := games.GenerateSudoku(difficulty)
	return &SudokuQuestionResponse{
		Puzzle:   puzzle.Puzzle,
		Solution: puzzle.Solution,
	}
}

// ValidateGame24Answer validates a player's answer for the 24-point game
func ValidateGame24Answer(numbers []int, answer string) bool {
	return games.ValidateAnswer(numbers, answer)
}

// ValidateSudokuAnswer validates a player's answer for a Sudoku puzzle
func ValidateSudokuAnswer(answer, solution string) bool {
	return games.ValidateSudokuAnswer(answer, solution)
}

// CalculateGame24Score calculates score for 24-point game
func CalculateGame24Score(timeSpent int) int {
	return games.CalculateScore(timeSpent)
}

// CalculateSudokuScore calculates score for Sudoku game
func CalculateSudokuScore(timeSpent int, difficulty string) int {
	return games.CalculateSudokuScore(timeSpent, difficulty)
}

// SaveGameRecord saves a game record to the database
func SaveGameRecord(roomID, studentID, gameType, question, answer string, correct bool, timeSpent int) (*models.GameRecord, error) {
	return SaveGameRecordWithSession(roomID, "", -1, studentID, gameType, question, answer, correct, timeSpent)
}

// SaveGameRecordWithSession saves a game record with session info to the database
func SaveGameRecordWithSession(roomID, sessionID string, questionIndex int, studentID, gameType, question, answer string, correct bool, timeSpent int) (*models.GameRecord, error) {
	return SaveGameRecordWithSessionAndDifficulty(roomID, sessionID, questionIndex, studentID, gameType, question, answer, correct, timeSpent, "")
}

// SaveGameRecordWithSessionAndDifficulty saves a game record with session info and difficulty (for Sudoku)
func SaveGameRecordWithSessionAndDifficulty(roomID, sessionID string, questionIndex int, studentID, gameType, question, answer string, correct bool, timeSpent int, difficulty string) (*models.GameRecord, error) {
	score := 0
	if correct {
		if gameType == "sudoku" {
			score = CalculateSudokuScore(timeSpent, difficulty)
		} else {
			score = CalculateGame24Score(timeSpent)
		}
	}

	record := models.GameRecord{
		ID:            uuid.New().String(),
		RoomID:        roomID,
		SessionID:     sessionID,
		QuestionIndex: questionIndex,
		StudentID:     studentID,
		GameType:      gameType,
		Question:      question,
		Answer:        answer,
		Correct:       correct,
		TimeSpent:     timeSpent,
		Score:         score,
		CreatedAt:     time.Now(),
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

// GetSessionRecords retrieves all game records for a session
func GetSessionRecords(sessionID string) ([]models.GameRecord, error) {
	var records []models.GameRecord
	err := database.GetDB().Where("session_id = ?", sessionID).Order("question_index asc").Find(&records).Error
	return records, err
}