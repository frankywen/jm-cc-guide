package handlers

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/models"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/services"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/ws"
	"github.com/jm-cc-guide/puzzle-classroom/backend/pkg/utils"
)

func CreateRoom(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req services.CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}
	room, err := services.CreateRoom(userID.(string), req.Name, req.GameType)
	if err != nil {
		utils.InternalError(c, "创建房间失败")
		return
	}

	// Broadcast room:created to all students
	hub := ws.GetGlobalHub()
	if hub != nil {
		hub.BroadcastToRole("student", ws.Message{
			Type: "room:created",
			Data: room,
		})
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

	// Broadcast room:updated to all students
	hub := ws.GetGlobalHub()
	if hub != nil {
		// Update room status before broadcasting
		room.Status = req.Status
		hub.BroadcastToRole("student", ws.Message{
			Type: "room:updated",
			Data: map[string]interface{}{
				"roomId": roomID,
				"status": req.Status,
				"room":   room,
			},
		})
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

	// Broadcast room:deleted to all students
	hub := ws.GetGlobalHub()
	if hub != nil {
		hub.BroadcastToRole("student", ws.Message{
			Type: "room:deleted",
			Data: map[string]string{"roomId": roomID},
		})
	}

	utils.Success(c, gin.H{"message": "删除成功"})
}

func SubmitAnswer(c *gin.Context) {
	userID, _ := c.Get("userID")
	roomID := c.Param("id")

	// Get room to determine game type
	room, err := services.GetRoomByID(roomID)
	if err != nil {
		utils.NotFound(c, "房间不存在")
		return
	}

	if room.GameType == "sudoku" {
		handleSudokuAnswer(c, userID, roomID, room)
	} else {
		handleGame24Answer(c, userID, roomID)
	}
}

// handleGame24Answer handles 24-point game answer submission
func handleGame24Answer(c *gin.Context, userID interface{}, roomID string) {
	var req struct {
		Answer        string `json:"answer" binding:"required"`
		Question      string `json:"question" binding:"required"`
		TimeSpent     int    `json:"timeSpent"`
		SessionID     string `json:"sessionId"`
		QuestionIndex int    `json:"questionIndex"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	// Parse question numbers (comma-separated string like "1,2,3,4")
	var numbers []int
	for _, s := range strings.Split(req.Question, ",") {
		s = strings.TrimSpace(s)
		if s == "" {
			continue
		}
		n, err := strconv.Atoi(s)
		if err != nil {
			utils.BadRequest(c, "题目格式错误")
			return
		}
		numbers = append(numbers, n)
	}

	if len(numbers) != 4 {
		utils.BadRequest(c, "题目必须有4个数字")
		return
	}

	// Validate answer
	correct := services.ValidateGame24Answer(numbers, req.Answer)

	// Save game record
	var record *models.GameRecord
	var err error
	if req.SessionID != "" {
		record, err = services.SaveGameRecordWithSession(roomID, req.SessionID, req.QuestionIndex, userID.(string), "game24", req.Question, req.Answer, correct, req.TimeSpent)
	} else {
		record, err = services.SaveGameRecord(roomID, userID.(string), "game24", req.Question, req.Answer, correct, req.TimeSpent)
	}
	if err != nil {
		utils.InternalError(c, "保存记录失败")
		return
	}

	response := gin.H{
		"correct": correct,
		"score":   record.Score,
	}

	// If this is part of a session, update progress
	if req.SessionID != "" {
		session, err := services.GetSessionByID(req.SessionID)
		if err == nil {
			progress, err := services.UpdateProgress(req.SessionID, userID.(string), correct, record.Score, session.TotalQuestions)
			if err == nil {
				response["completed"] = progress.CompletedCount >= session.TotalQuestions
				response["totalCompleted"] = progress.CompletedCount
				response["totalQuestions"] = session.TotalQuestions
				response["totalScore"] = progress.TotalScore
				response["nextIndex"] = progress.CurrentIndex

				// Return next question if not completed
				if progress.CompletedCount < session.TotalQuestions {
					nextQuestion, err := services.GetSessionQuestionByIndex(session, progress.CurrentIndex)
					if err == nil {
						response["nextQuestion"] = nextQuestion
					}
				}

				// Broadcast progress update to teacher
				allProgress, _ := services.GetSessionProgress(req.SessionID)
				hub := ws.GetGlobalHub()
				if hub != nil {
					hub.Broadcast(roomID, ws.Message{
						Type: "progress:update",
						Data: gin.H{
							"sessionId": req.SessionID,
							"students":  allProgress,
						},
					}, "")
				}
			}
		}
	}

	utils.Success(c, response)
}

// handleSudokuAnswer handles Sudoku answer submission
func handleSudokuAnswer(c *gin.Context, userID interface{}, roomID string, room *models.Room) {
	var req struct {
		Answer        string `json:"answer" binding:"required"`   // 81-character string
		QuestionIndex int    `json:"questionIndex" binding:"min=0"`
		SessionID     string `json:"sessionId" binding:"required"`
		TimeSpent     int    `json:"timeSpent"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	// Get session
	session, err := services.GetSessionByID(req.SessionID)
	if err != nil {
		utils.NotFound(c, "游戏会话不存在")
		return
	}

	// Get the question to get the solution
	question, err := services.GetSessionSudokuQuestionByIndex(session, req.QuestionIndex)
	if err != nil {
		utils.BadRequest(c, "题目索引无效")
		return
	}

	// Validate answer against solution
	correct := services.ValidateSudokuAnswer(req.Answer, question.Solution)

	// Save game record with difficulty
	record, err := services.SaveGameRecordWithSessionAndDifficulty(roomID, req.SessionID, req.QuestionIndex, userID.(string), "sudoku", question.Puzzle, req.Answer, correct, req.TimeSpent, session.Difficulty)
	if err != nil {
		utils.InternalError(c, "保存记录失败")
		return
	}

	response := gin.H{
		"correct": correct,
		"score":   record.Score,
	}

	// Update progress
	progress, err := services.UpdateProgress(req.SessionID, userID.(string), correct, record.Score, session.TotalQuestions)
	if err == nil {
		response["completed"] = progress.CompletedCount >= session.TotalQuestions
		response["totalCompleted"] = progress.CompletedCount
		response["totalQuestions"] = session.TotalQuestions
		response["totalScore"] = progress.TotalScore
		response["nextIndex"] = progress.CurrentIndex

		// Return next question if not completed
		if progress.CompletedCount < session.TotalQuestions {
			nextQuestion, err := services.GetSessionSudokuQuestionByIndex(session, progress.CurrentIndex)
			if err == nil {
				response["nextQuestion"] = gin.H{
					"puzzle": nextQuestion.Puzzle,
				}
			}
		}

		// Broadcast progress update to teacher
		allProgress, _ := services.GetSessionProgress(req.SessionID)
		hub := ws.GetGlobalHub()
		if hub != nil {
			hub.Broadcast(roomID, ws.Message{
				Type: "progress:update",
				Data: gin.H{
					"sessionId": req.SessionID,
					"students":  allProgress,
				},
			}, "")
		}
	}

	utils.Success(c, response)
}

// SkipQuestion allows student to skip current question
func SkipQuestion(c *gin.Context) {
	userID, _ := c.Get("userID")
	roomID := c.Param("id")

	var req struct {
		SessionID     string `json:"sessionId" binding:"required"`
		QuestionIndex int    `json:"questionIndex" binding:"min=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	// Get session
	session, err := services.GetSessionByID(req.SessionID)
	if err != nil {
		utils.NotFound(c, "游戏不存在")
		return
	}

	// Update progress (skip = incorrect with 0 score)
	progress, err := services.UpdateProgress(req.SessionID, userID.(string), false, 0, session.TotalQuestions)
	if err != nil {
		utils.InternalError(c, "更新进度失败")
		return
	}

	response := gin.H{
		"skipped":        true,
		"totalCompleted": progress.CompletedCount,
		"totalQuestions": session.TotalQuestions,
		"totalScore":     progress.TotalScore,
		"nextIndex":      progress.CurrentIndex,
		"completed":      progress.CompletedCount >= session.TotalQuestions,
	}

	// Return next question if not completed
	if progress.CompletedCount < session.TotalQuestions {
		if session.GameType == "sudoku" {
			nextQuestion, err := services.GetSessionSudokuQuestionByIndex(session, progress.CurrentIndex)
			if err == nil {
				response["nextQuestion"] = gin.H{
					"puzzle": nextQuestion.Puzzle,
				}
			}
		} else {
			nextQuestion, err := services.GetSessionQuestionByIndex(session, progress.CurrentIndex)
			if err == nil {
				response["nextQuestion"] = nextQuestion
			}
		}
	}

	// Broadcast progress update to teacher
	allProgress, _ := services.GetSessionProgress(req.SessionID)
	hub := ws.GetGlobalHub()
	if hub != nil {
		hub.Broadcast(roomID, ws.Message{
			Type: "progress:update",
			Data: gin.H{
				"sessionId": req.SessionID,
				"students":  allProgress,
			},
		}, "")
	}

	utils.Success(c, response)
}

// StartGame starts a new multi-question game session
func StartGame(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		RoomID        string `json:"roomId" binding:"required"`
		QuestionCount int    `json:"questionCount" binding:"required,min=1,max=50"`
		Difficulty    string `json:"difficulty"` // For Sudoku: easy, medium, hard, etc.
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	// Verify user is the teacher
	room, err := services.GetRoomByID(req.RoomID)
	if err != nil {
		utils.NotFound(c, "房间不存在")
		return
	}
	if room.TeacherID != userID.(string) {
		utils.Error(c, 403, "无权操作")
		return
	}

	// Create game session
	session, err := services.CreateGameSessionWithType(req.RoomID, req.QuestionCount, room.GameType, req.Difficulty)
	if err != nil {
		utils.InternalError(c, "创建游戏失败")
		return
	}

	// Get first question
	if room.GameType == "sudoku" {
		questions, err := services.GetSessionSudokuQuestions(session)
		if err != nil {
			utils.InternalError(c, "获取题目失败")
			return
		}
		utils.Success(c, gin.H{
			"sessionId":      session.ID,
			"totalQuestions": session.TotalQuestions,
			"firstQuestion": gin.H{
				"puzzle": questions[0].Puzzle,
			},
			"currentIndex": 0,
			"gameType":     room.GameType,
			"difficulty":   session.Difficulty,
		})
	} else {
		questions, err := services.GetSessionQuestions(session)
		if err != nil {
			utils.InternalError(c, "获取题目失败")
			return
		}
		utils.Success(c, gin.H{
			"sessionId":      session.ID,
			"totalQuestions": session.TotalQuestions,
			"firstQuestion":  questions[0],
			"currentIndex":   0,
			"gameType":       room.GameType,
		})
	}

	// Update room status
	if err := services.UpdateRoomStatus(req.RoomID, "playing"); err != nil {
		utils.InternalError(c, "更新状态失败")
		return
	}
}

// GetGameProgress gets the progress of all students in a game session
func GetGameProgress(c *gin.Context) {
	roomID := c.Query("roomId")
	if roomID == "" {
		utils.BadRequest(c, "缺少roomId参数")
		return
	}

	// Get active session
	session, err := services.GetActiveSession(roomID)
	if err != nil {
		utils.NotFound(c, "没有进行中的游戏")
		return
	}

	// Get progress
	progress, err := services.GetSessionProgress(session.ID)
	if err != nil {
		utils.InternalError(c, "获取进度失败")
		return
	}

	utils.Success(c, gin.H{
		"session":  session,
		"progress": progress,
	})
}

// GetNextQuestion gets the next question from a session for the teacher
func GetNextQuestion(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req struct {
		RoomID string `json:"roomId" binding:"required"`
		Index  int    `json:"index" binding:"min=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	// Verify user is the teacher
	room, err := services.GetRoomByID(req.RoomID)
	if err != nil {
		utils.NotFound(c, "房间不存在")
		return
	}
	if room.TeacherID != userID.(string) {
		utils.Error(c, 403, "无权操作")
		return
	}

	// Get active session
	session, err := services.GetActiveSession(req.RoomID)
	if err != nil {
		utils.NotFound(c, "没有进行中的游戏")
		return
	}

	// Update session's current index
	if err := services.UpdateSessionCurrentIndex(session.ID, req.Index); err != nil {
		utils.InternalError(c, "更新题目索引失败")
		return
	}

	// Get question by index
	if session.GameType == "sudoku" {
		question, err := services.GetSessionSudokuQuestionByIndex(session, req.Index)
		if err != nil {
			utils.BadRequest(c, "题目索引无效")
			return
		}
		utils.Success(c, gin.H{
			"question": gin.H{
				"puzzle":   question.Puzzle,
				"solution": question.Solution,
			},
			"currentIndex": req.Index,
			"sessionId":    session.ID,
			"gameType":     session.GameType,
		})
	} else {
		question, err := services.GetSessionQuestionByIndex(session, req.Index)
		if err != nil {
			utils.BadRequest(c, "题目索引无效")
			return
		}
		utils.Success(c, gin.H{
			"question":     question,
			"currentIndex": req.Index,
			"sessionId":    session.ID,
			"gameType":     session.GameType,
		})
	}
}

// GetCurrentGameState gets the current game state for students joining mid-game
func GetCurrentGameState(c *gin.Context) {
	roomID := c.Param("id")
	userID, _ := c.Get("userID")

	// Get room
	room, err := services.GetRoomByID(roomID)
	if err != nil {
		utils.NotFound(c, "房间不存在")
		return
	}

	// If room is not playing, return room status only
	if room.Status != "playing" {
		utils.Success(c, gin.H{
			"status": room.Status,
		})
		return
	}

	// Get active session
	session, err := services.GetActiveSession(roomID)
	if err != nil {
		utils.Success(c, gin.H{
			"status": "waiting",
		})
		return
	}

	// Get student's individual progress if they have one
	studentProgress, _ := services.GetStudentProgress(session.ID, userID.(string))

	// Use student's current index if they have progress, otherwise use session's current index
	currentIndex := session.CurrentIndex
	totalScore := 0
	completedCount := 0
	if studentProgress != nil {
		currentIndex = studentProgress.CurrentIndex
		totalScore = studentProgress.TotalScore
		completedCount = studentProgress.CompletedCount
	}

	// Handle different game types
	if session.GameType == "sudoku" {
		questions, err := services.GetSessionSudokuQuestions(session)
		if err != nil || len(questions) == 0 {
			utils.Success(c, gin.H{
				"status": "waiting",
			})
			return
		}

		if currentIndex < 0 || currentIndex >= len(questions) {
			currentIndex = 0
		}

		utils.Success(c, gin.H{
			"status":         "playing",
			"sessionId":      session.ID,
			"totalQuestions": session.TotalQuestions,
			"currentIndex":   currentIndex,
			"question": gin.H{
				"puzzle": questions[currentIndex].Puzzle,
			},
			"totalScore":     totalScore,
			"completedCount": completedCount,
			"gameType":       session.GameType,
			"difficulty":     session.Difficulty,
		})
	} else {
		questions, err := services.GetSessionQuestions(session)
		if err != nil || len(questions) == 0 {
			utils.Success(c, gin.H{
				"status": "waiting",
			})
			return
		}

		if currentIndex < 0 || currentIndex >= len(questions) {
			currentIndex = 0
		}

		utils.Success(c, gin.H{
			"status":         "playing",
			"sessionId":      session.ID,
			"totalQuestions": session.TotalQuestions,
			"currentIndex":   currentIndex,
			"question":       questions[currentIndex],
			"totalScore":     totalScore,
			"completedCount": completedCount,
			"gameType":       session.GameType,
		})
	}
}

// AdminGetAllRooms gets all rooms for admin
func AdminGetAllRooms(c *gin.Context) {
	rooms, err := services.GetRoomsWithTeacherInfo()
	if err != nil {
		utils.InternalError(c, "获取房间列表失败")
		return
	}
	utils.Success(c, rooms)
}

// AdminDeleteRoom allows admin to delete any room
func AdminDeleteRoom(c *gin.Context) {
	roomID := c.Param("id")
	_, err := services.GetRoomByID(roomID)
	if err != nil {
		utils.NotFound(c, "房间不存在")
		return
	}
	if err := services.AdminDeleteRoom(roomID); err != nil {
		utils.InternalError(c, "删除房间失败")
		return
	}

	// Broadcast room:deleted to all students
	hub := ws.GetGlobalHub()
	if hub != nil {
		hub.BroadcastToRole("student", ws.Message{
			Type: "room:deleted",
			Data: map[string]string{"roomId": roomID},
		})
	}

	utils.Success(c, gin.H{"message": "删除成功"})
}

// AdminUpdateRoom allows admin to update room name and status
func AdminUpdateRoom(c *gin.Context) {
	roomID := c.Param("id")
	var req struct {
		Name   string `json:"name"`
		Status string `json:"status" binding:"omitempty,oneof=waiting playing finished"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	_, err := services.GetRoomByID(roomID)
	if err != nil {
		utils.NotFound(c, "房间不存在")
		return
	}

	if err := services.AdminUpdateRoom(roomID, req.Name, req.Status); err != nil {
		utils.InternalError(c, "更新房间失败")
		return
	}

	// Broadcast room:updated to all students if status changed
	if req.Status != "" {
		hub := ws.GetGlobalHub()
		if hub != nil {
			hub.BroadcastToRole("student", ws.Message{
				Type: "room:updated",
				Data: map[string]interface{}{
					"roomId": roomID,
					"status": req.Status,
				},
			})
		}
	}

	utils.Success(c, gin.H{"message": "更新成功"})
}

// AdminBatchDeleteRooms allows admin to delete multiple rooms
func AdminBatchDeleteRooms(c *gin.Context) {
	var req struct {
		RoomIDs []string `json:"roomIds" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	if err := services.AdminBatchDeleteRooms(req.RoomIDs); err != nil {
		utils.InternalError(c, "批量删除房间失败")
		return
	}

	// Broadcast room:deleted for each room
	hub := ws.GetGlobalHub()
	if hub != nil {
		for _, roomID := range req.RoomIDs {
			hub.BroadcastToRole("student", ws.Message{
				Type: "room:deleted",
				Data: map[string]string{"roomId": roomID},
			})
		}
	}

	utils.Success(c, gin.H{"message": "批量删除成功", "count": len(req.RoomIDs)})
}