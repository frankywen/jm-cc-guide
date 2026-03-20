package services

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/database"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/games"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/models"
)

// CreateGameSessionRequest is the request for creating a game session
type CreateGameSessionRequest struct {
	QuestionCount int    `json:"questionCount" binding:"required,min=1,max=50"`
	GameType      string `json:"gameType"` // game24 or sudoku
	Difficulty    string `json:"difficulty"` // For Sudoku: easy, medium, hard, etc.
}

// SessionProgress represents a student's progress in a session
type SessionProgress struct {
	StudentID      string `json:"studentId"`
	Username       string `json:"username"`
	CurrentIndex   int    `json:"currentIndex"`
	CompletedCount int    `json:"completedCount"`
	TotalScore     int    `json:"totalScore"`
}

// SessionProgressResponse is the response for session progress
type SessionProgressResponse struct {
	Session  models.GameSession `json:"session"`
	Progress []SessionProgress  `json:"progress"`
}

// CreateGameSession creates a new game session with multiple questions
func CreateGameSession(roomID string, questionCount int) (*models.GameSession, error) {
	return CreateGameSessionWithType(roomID, questionCount, "game24", "")
}

// CreateGameSessionWithType creates a new game session with specific game type
func CreateGameSessionWithType(roomID string, questionCount int, gameType string, difficulty string) (*models.GameSession, error) {
	if gameType == "" {
		gameType = "game24"
	}

	var questionsJSON []byte
	var err error

	if gameType == "sudoku" {
		if difficulty == "" {
			difficulty = "easy"
		}
		// Generate Sudoku questions
		questions := make([]models.SudokuQuestion, questionCount)
		for i := 0; i < questionCount; i++ {
			puzzle := games.GenerateSudoku(difficulty)
			questions[i] = models.SudokuQuestion{
				Puzzle:   puzzle.Puzzle,
				Solution: puzzle.Solution,
			}
		}
		questionsJSON, err = json.Marshal(questions)
	} else {
		// Generate 24-point game questions with difficulty
		if difficulty == "" {
			difficulty = "medium"
		}
		questions := make([][]int, questionCount)
		for i := 0; i < questionCount; i++ {
			questions[i] = games.GenerateQuestionWithDifficulty(difficulty)
		}
		questionsJSON, err = json.Marshal(questions)
	}

	if err != nil {
		return nil, err
	}

	session := models.GameSession{
		ID:             uuid.New().String(),
		RoomID:         roomID,
		TotalQuestions: questionCount,
		Questions:      string(questionsJSON),
		Status:         "active",
		GameType:       gameType,
		Difficulty:     difficulty,
		CreatedAt:      time.Now(),
	}

	if err := database.GetDB().Create(&session).Error; err != nil {
		return nil, err
	}

	return &session, nil
}

// GetActiveSession gets the active game session for a room
func GetActiveSession(roomID string) (*models.GameSession, error) {
	var session models.GameSession
	err := database.GetDB().Where("room_id = ? AND status = ?", roomID, "active").First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// GetSessionByID gets a game session by ID
func GetSessionByID(sessionID string) (*models.GameSession, error) {
	var session models.GameSession
	err := database.GetDB().Where("id = ?", sessionID).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// GetSessionQuestions parses and returns the questions for a session
func GetSessionQuestions(session *models.GameSession) ([][]int, error) {
	var questions [][]int
	err := json.Unmarshal([]byte(session.Questions), &questions)
	if err != nil {
		return nil, err
	}
	return questions, nil
}

// GetSessionSudokuQuestions parses and returns Sudoku questions for a session
func GetSessionSudokuQuestions(session *models.GameSession) ([]models.SudokuQuestion, error) {
	var questions []models.SudokuQuestion
	err := json.Unmarshal([]byte(session.Questions), &questions)
	if err != nil {
		return nil, err
	}
	return questions, nil
}

// GetSessionQuestionByIndex gets a specific question by index from a session
func GetSessionQuestionByIndex(session *models.GameSession, index int) ([]int, error) {
	questions, err := GetSessionQuestions(session)
	if err != nil {
		return nil, err
	}
	if index < 0 || index >= len(questions) {
		return nil, errors.New("question index out of range")
	}
	return questions[index], nil
}

// GetSessionSudokuQuestionByIndex gets a specific Sudoku question by index from a session
func GetSessionSudokuQuestionByIndex(session *models.GameSession, index int) (*models.SudokuQuestion, error) {
	questions, err := GetSessionSudokuQuestions(session)
	if err != nil {
		return nil, err
	}
	if index < 0 || index >= len(questions) {
		return nil, errors.New("question index out of range")
	}
	return &questions[index], nil
}

// UpdateProgress updates a student's progress in a session
func UpdateProgress(sessionID, studentID string, correct bool, score int, totalQuestions int) (*models.StudentProgress, error) {
	var progress models.StudentProgress
	err := database.GetDB().Where("session_id = ? AND student_id = ?", sessionID, studentID).First(&progress).Error

	if err != nil {
		// Create new progress record
		progress = models.StudentProgress{
			ID:             uuid.New().String(),
			SessionID:      sessionID,
			StudentID:      studentID,
			CurrentIndex:   0,
			CompletedCount: 0,
			TotalScore:     0,
			UpdatedAt:      time.Now(),
		}
	}

	// Update progress
	progress.CompletedCount++
	progress.CurrentIndex++
	if correct {
		progress.TotalScore += score
	}
	progress.UpdatedAt = time.Now()

	if err != nil {
		if err := database.GetDB().Create(&progress).Error; err != nil {
			return nil, err
		}
	} else {
		if err := database.GetDB().Save(&progress).Error; err != nil {
			return nil, err
		}
	}

	return &progress, nil
}

// GetStudentProgress gets a student's progress in a session
func GetStudentProgress(sessionID, studentID string) (*models.StudentProgress, error) {
	var progress models.StudentProgress
	err := database.GetDB().Where("session_id = ? AND student_id = ?", sessionID, studentID).First(&progress).Error
	if err != nil {
		return nil, err
	}
	return &progress, nil
}

// GetOrCreateStudentProgress gets or creates a student's progress record
func GetOrCreateStudentProgress(sessionID, studentID string) (*models.StudentProgress, error) {
	var progress models.StudentProgress
	err := database.GetDB().Where("session_id = ? AND student_id = ?", sessionID, studentID).First(&progress).Error

	if err != nil {
		// Create new progress record
		progress = models.StudentProgress{
			ID:             uuid.New().String(),
			SessionID:      sessionID,
			StudentID:      studentID,
			CurrentIndex:   0,
			CompletedCount: 0,
			TotalScore:     0,
			UpdatedAt:      time.Now(),
		}
		if err := database.GetDB().Create(&progress).Error; err != nil {
			return nil, err
		}
	}

	return &progress, nil
}

// GetSessionProgress gets all student progress for a session
func GetSessionProgress(sessionID string) ([]SessionProgress, error) {
	var progressRecords []models.StudentProgress
	err := database.GetDB().Where("session_id = ?", sessionID).Find(&progressRecords).Error
	if err != nil {
		return nil, err
	}

	// Get usernames for all students
	result := make([]SessionProgress, len(progressRecords))
	for i, p := range progressRecords {
		var user models.User
		database.GetDB().Where("id = ?", p.StudentID).First(&user)
		result[i] = SessionProgress{
			StudentID:      p.StudentID,
			Username:       user.Username,
			CurrentIndex:   p.CurrentIndex,
			CompletedCount: p.CompletedCount,
			TotalScore:     p.TotalScore,
		}
	}

	return result, nil
}

// EndSession ends a game session
func EndSession(sessionID string) error {
	return database.GetDB().Model(&models.GameSession{}).Where("id = ?", sessionID).Update("status", "ended").Error
}

// UpdateSessionCurrentIndex updates the current question index for a session
func UpdateSessionCurrentIndex(sessionID string, index int) error {
	return database.GetDB().Model(&models.GameSession{}).Where("id = ?", sessionID).Update("current_index", index).Error
}

// ValidateSessionAccess checks if a student can access a question at the given index
func ValidateSessionAccess(sessionID, studentID string, questionIndex int) error {
	session, err := GetSessionByID(sessionID)
	if err != nil {
		return err
	}

	if session.Status != "active" {
		return errors.New("session is not active")
	}

	if questionIndex < 0 || questionIndex >= session.TotalQuestions {
		return errors.New("invalid question index")
	}

	return nil
}