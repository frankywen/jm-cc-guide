package database

import (
	"log"
	"os"

	"github.com/glebarez/sqlite"
	"github.com/jm-cc-guide/puzzle-classroom/backend/internal/models"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() error {
	// 确保数据目录存在
	if err := os.MkdirAll("data", 0755); err != nil {
		return err
	}

	var err error
	// 使用GORM打开SQLite连接，配置WAL模式和busy timeout
	DB, err = gorm.Open(sqlite.Open("data/puzzle.db?_journal_mode=WAL&_busy_timeout=5000"), &gorm.Config{})
	if err != nil {
		return err
	}

	// 自动迁移
	if err := DB.AutoMigrate(
		&models.User{},
		&models.Room{},
		&models.RoomStudent{},
		&models.GameRecord{},
	); err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

func GetDB() *gorm.DB {
	return DB
}

// Close 关闭数据库连接
func Close() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}