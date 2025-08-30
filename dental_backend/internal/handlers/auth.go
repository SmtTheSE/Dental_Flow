// dental_backend/internal/handlers/auth.go
package handlers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"dental_backend/internal/database"
	"dental_backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
	Role      string `json:"role" binding:"required,oneof=dentist hygienist admin staff"`
	Phone     string `json:"phone"`
}

// AuthResponse represents the response for authentication endpoints
type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// Register handles user registration
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get database connection from the shared database package
	db := database.GetDB()

	// Check if user already exists
	var existingUserID int
	err := db.QueryRow("SELECT id FROM users WHERE email = $1", req.Email).Scan(&existingUserID)
	if err != nil && err.Error() != "sql: no rows in result set" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	if existingUserID != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create the user
	var newUser models.User
	err = db.QueryRow(
		"INSERT INTO users (email, password_hash, first_name, last_name, role, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role, phone, created_at, updated_at",
		req.Email, string(hashedPassword), req.FirstName, req.LastName, req.Role, req.Phone,
	).Scan(&newUser.ID, &newUser.Email, &newUser.FirstName, &newUser.LastName, &newUser.Role, &newUser.Phone, &newUser.CreatedAt, &newUser.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Generate JWT token
	token, err := generateToken(newUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User:  newUser,
	})
}

// Login handles user login
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get database connection from the shared database package
	db := database.GetDB()

	// Find user by email
	var user models.User
	var passwordHash string
	err := db.QueryRow(
		"SELECT id, email, password_hash, first_name, last_name, role, phone, created_at, updated_at FROM users WHERE email = $1",
		req.Email,
	).Scan(&user.ID, &user.Email, &passwordHash, &user.FirstName, &user.LastName, &user.Role, &user.Phone, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := generateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User:  user,
	})
}

// GetCurrentUser returns the current authenticated user
func GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get database connection from the shared database package
	db := database.GetDB()

	var user models.User
	err := db.QueryRow(
		"SELECT id, email, first_name, last_name, role, phone, created_at, updated_at FROM users WHERE id = $1",
		userID,
	).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Role, &user.Phone, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// generateToken creates a JWT token for a user
func generateToken(user models.User) (string, error) {
	// Get the secret key from environment variables
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dental_secret_key" // fallback for development
	}

	// Create the Claims
	claims := jwt.MapClaims{
		"user_id":   user.ID,
		"user_role": user.Role,
		"exp":       time.Now().Add(time.Hour * 72).Unix(), // 72 hours
		"iat":       time.Now().Unix(),
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Generate encoded token
	return token.SignedString([]byte(secret))
}

// AuthMiddleware validates JWT tokens
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the token from the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Check if the header starts with "Bearer "
		if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
			c.Abort()
			return
		}

		// Extract the token
		tokenString := authHeader[7:]

		// Get the secret key
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "dental_secret_key" // fallback for development
		}

		// Parse the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate the alg is what we expect
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secret), nil
		})

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Check if the token is valid
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Add user ID to the context
			if userID, ok := claims["user_id"].(float64); ok {
				c.Set("userID", int(userID))
				c.Set("userRole", claims["user_role"])
				c.Next()
				return
			}
		}

		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		c.Abort()
	}
}

// RoleMiddleware checks if the user has the required role
func RoleMiddleware(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
			c.Abort()
			return
		}

		if userRole != requiredRole && userRole != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}
