package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/database"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/models"
	"github.com/jm-cc-guide/puzzle-classroom/backend/pkg/utils"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=20"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=student teacher"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Register(req RegisterRequest) (*models.User, error) {
	db := database.GetDB()

	// Check if username already exists
	var existing models.User
	if err := db.Where("username = ?", req.Username).First(&existing).Error; err == nil {
		return nil, errors.New("用户名已存在")
	}

	// Hash password with bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := models.User{
		ID:       uuid.New().String(),
		Username: req.Username,
		Password: string(hashedPassword),
		Role:     req.Role,
	}

	if err := db.Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func Login(req LoginRequest) (*models.User, string, error) {
	db := database.GetDB()

	// Find user by username
	var user models.User
	if err := db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", errors.New("用户名或密码错误")
		}
		return nil, "", err
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, "", errors.New("用户名或密码错误")
	}

	// Generate JWT token
	token, err := utils.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}

func GetUserByID(userID string) (*models.User, error) {
	var user models.User
	if err := database.GetDB().Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}