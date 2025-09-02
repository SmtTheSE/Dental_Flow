// dental_backend/internal/handlers/auth.go
package handlers

import (
	"fmt"
	"net/http"
	"os"
	"time"
	"strings"
	"encoding/base64"
	"encoding/json"
	"io"

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

// GoogleLoginRequest represents the Google login request payload
type GoogleLoginRequest struct {
	IDToken string `json:"idToken" binding:"required"`
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

// GoogleLogin handles Google login
func GoogleLogin(c *gin.Context) {
	// Log the incoming request
	fmt.Printf("Google login request received. Method: %s, Content-Type: %s\n", c.Request.Method, c.GetHeader("Content-Type"))
	
	var req GoogleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Error binding JSON: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Log the received request for debugging
	fmt.Printf("Received Google login request with IDToken: %.50s...\n", req.IDToken) // Only log first 50 chars

	// Check if IDToken is empty
	if req.IDToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "IDToken is required"})
		return
	}

	// Get database connection from the shared database package
	db := database.GetDB()

	// Verify ID token with Google's API
	userInfo, err := verifyGoogleIDToken(req.IDToken)
	if err != nil {
		fmt.Printf("Error verifying Google ID token: %v\n", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google ID token", "details": err.Error()})
		return
	}
	
	// Log the user info for debugging
	fmt.Printf("Verified user info: %+v\n", userInfo)
	
	// Check if user already exists
	var existingUser models.User
	err = db.QueryRow(
		"SELECT id, email, first_name, last_name, role, phone, created_at, updated_at FROM users WHERE email = $1",
		userInfo.Email,
	).Scan(&existingUser.ID, &existingUser.Email, &existingUser.FirstName, &existingUser.LastName, 
		&existingUser.Role, &existingUser.Phone, &existingUser.CreatedAt, &existingUser.UpdatedAt)

	if err != nil && err.Error() != "sql: no rows in result set" {
		fmt.Printf("Database error when checking existing user: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
		return
	}

	// If user exists, log them in
	if existingUser.ID != 0 {
		fmt.Printf("Existing user found: %+v\n", existingUser)
		
		// Generate JWT token
		token, err := generateToken(existingUser)
		if err != nil {
			fmt.Printf("Error generating token: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token", "details": err.Error()})
			return
		}

		c.JSON(http.StatusOK, AuthResponse{
			Token: token,
			User:  existingUser,
		})
		return
	}
	
	// If user doesn't exist, return special response to indicate they need to register
	c.JSON(http.StatusNotFound, gin.H{
		"error": "User not found. Please complete registration.",
		"email": userInfo.Email,
		"firstName": userInfo.GivenName,
		"lastName": userInfo.FamilyName,
		"googleId": userInfo.ID,
	})
}

// GoogleRegisterRequest represents the Google registration request payload
type GoogleRegisterRequest struct {
	IDToken string `json:"IDToken" binding:"required"`
	Role    string `json:"role" binding:"required,oneof=dentist hygienist admin staff"`
	Phone   string `json:"phone"`
}

// GoogleRegister handles Google registration for new users
func GoogleRegister(c *gin.Context) {
	var req GoogleRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get database connection from the shared database package
	db := database.GetDB()

	// Verify ID token with Google's API
	userInfo, err := verifyGoogleIDToken(req.IDToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google ID token", "details": err.Error()})
		return
	}
	
	// Check if user already exists
	var existingUser models.User
	err = db.QueryRow(
		"SELECT id, email, first_name, last_name, role, phone, created_at, updated_at FROM users WHERE email = $1",
		userInfo.Email,
	).Scan(&existingUser.ID, &existingUser.Email, &existingUser.FirstName, &existingUser.LastName, 
		&existingUser.Role, &existingUser.Phone, &existingUser.CreatedAt, &existingUser.UpdatedAt)

	if err != nil && err.Error() != "sql: no rows in result set" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error", "details": err.Error()})
		return
	}

	// If user already exists, return error
	if existingUser.ID != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}
	
	// Create new user with Google info and additional fields
	var phone *string = nil
	if req.Phone != "" {
		phone = &req.Phone
	}
	
	var newUser models.User
	err = db.QueryRow(
		"INSERT INTO users (email, password_hash, first_name, last_name, role, phone, google_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name, role, phone, created_at, updated_at",
		userInfo.Email, "", userInfo.GivenName, userInfo.FamilyName, req.Role, phone, userInfo.ID,
	).Scan(&newUser.ID, &newUser.Email, &newUser.FirstName, &newUser.LastName, &newUser.Role, &newUser.Phone, &newUser.CreatedAt, &newUser.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user", "details": err.Error()})
		return
	}
	
	// Generate JWT token
	token, err := generateToken(newUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User:  newUser,
	})
}

// GetCurrentUser returns the current authenticated user
// GoogleUserInfo represents user info from Google
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
	Locale        string `json:"locale"`
}

// verifyGoogleIDToken verifies a Google ID token and returns user info
func verifyGoogleIDToken(idToken string) (*GoogleUserInfo, error) {
	// First, try to decode as a standard Google ID token
	url := "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken
	fmt.Printf("Making request to Google tokeninfo endpoint: %.100s...\n", url) // Log first 100 chars
	
	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("Error making request to Google: %v\n", err)
		// If standard verification fails, try to decode as our custom credential
		return decodeCustomCredential(idToken)
	}
	defer resp.Body.Close()

	// Check if request was successful
	fmt.Printf("Google API response status: %d\n", resp.StatusCode)
	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Google API returned non-OK status: %d\n", resp.StatusCode)
		// If standard verification fails, try to decode as our custom credential
		return decodeCustomCredential(idToken)
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response body: %v\n", err)
		return nil, err
	}
	
	fmt.Printf("Google API response body length: %d\n", len(body))

	// Parse JSON response
	var userInfo GoogleUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		fmt.Printf("Error unmarshaling JSON response: %v\n", err)
		return nil, err
	}

	// Log some info about the user
	fmt.Printf("User email from Google: %s, verified: %t\n", userInfo.Email, userInfo.VerifiedEmail)

	// Check if email is verified
	if !userInfo.VerifiedEmail {
		return nil, fmt.Errorf("email not verified")
	}

	return &userInfo, nil
}

// decodeCustomCredential decodes our custom credential format
func decodeCustomCredential(credential string) (*GoogleUserInfo, error) {
	// Decode base64
	decoded, err := base64.StdEncoding.DecodeString(credential)
	if err != nil {
		return nil, fmt.Errorf("failed to decode credential: %v", err)
	}
	
	// Parse JSON
	var userInfo GoogleUserInfo
	if err := json.Unmarshal(decoded, &userInfo); err != nil {
		return nil, fmt.Errorf("failed to parse credential JSON: %v", err)
	}
	
	// Validate required fields
	if userInfo.Email == "" {
		return nil, fmt.Errorf("credential missing email")
	}
	
	// If given_name or family_name are missing, try to extract from name
	if userInfo.GivenName == "" && userInfo.FamilyName == "" && userInfo.Name != "" {
		parts := strings.Split(userInfo.Name, " ")
		if len(parts) >= 2 {
			userInfo.GivenName = parts[0]
			userInfo.FamilyName = parts[1]
		} else {
			userInfo.GivenName = userInfo.Name
		}
	}
	
	return &userInfo, nil
}

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
