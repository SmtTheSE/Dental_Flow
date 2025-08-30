// dental_backend/internal/database/postgres.go
package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var (
	// DB is the global database connection pool
	DB *sql.DB

	// Global configuration
	config *Config
)

// Config holds database configuration parameters
type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// LoadConfig loads database configuration from environment variables
func LoadConfig() *Config {
	config = &Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "sittminthar"),
		Password: getEnv("DB_PASSWORD", ""),
		DBName:   getEnv("DB_NAME", "dental_scheduler"),
		SSLMode:  getEnv("DB_SSL_MODE", "disable"),
	}
	return config
}

// getEnv returns the value of an environment variable or a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// InitDB initializes the database connection pool
func InitDB() (*sql.DB, error) {
	// Load configuration if not already loaded
	if config == nil {
		LoadConfig()
	}

	// Create connection string
	// Handle empty password case
	var connStr string
	if config.Password == "" {
		connStr = fmt.Sprintf(
			"host=%s port=%s user=%s dbname=%s sslmode=%s",
			config.Host, config.Port, config.User, config.DBName, config.SSLMode,
		)
	} else {
		connStr = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode,
		)
	}

	log.Printf("Connecting to database: host=%s port=%s user=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.DBName, config.SSLMode)

	// Open database connection
	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Configure connection pool
	DB.SetMaxOpenConns(25)                  // Maximum number of open connections
	DB.SetMaxIdleConns(5)                   // Maximum number of idle connections
	DB.SetConnMaxLifetime(60 * time.Minute) // Maximum lifetime of a connection
	DB.SetConnMaxIdleTime(10 * time.Minute) // Maximum idle time of a connection

	// Test the connection
	if err := DB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Successfully connected to the database")

	return DB, nil
}

// GetDB returns the global database connection
func GetDB() *sql.DB {
	if DB == nil {
		log.Fatal("Database not initialized. Call InitDB() first.")
	}
	return DB
}

// CloseDB closes the database connection
func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// HealthCheck verifies database connectivity
func HealthCheck() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	return DB.Ping()
}
