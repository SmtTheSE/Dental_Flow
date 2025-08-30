// dental_backend/internal/models/user.go
package models

import (
	"time"
)

// User represents a user in the system (dentists, staff, admins)
type User struct {
	ID        int       `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Password  string    `json:"-" db:"password_hash"` // Never serialize password to JSON
	FirstName string    `json:"firstName" db:"first_name"`
	LastName  string    `json:"lastName" db:"last_name"`
	Role      string    `json:"role" db:"role"`
	Phone     string    `json:"phone" db:"phone"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

// UserRole represents the role of a user in the system
type UserRole string

const (
	UserRoleDentist   UserRole = "dentist"
	UserRoleHygienist UserRole = "hygienist"
	UserRoleAdmin     UserRole = "admin"
	UserRoleStaff     UserRole = "staff"
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
	Token string `json:"token"`
	User  User   `json:"user"`
}

// UpdateUserRequest represents the request payload for updating a user
type UpdateUserRequest struct {
	Email     string `json:"email" binding:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Role      string `json:"role" binding:"oneof=dentist hygienist admin staff"`
	Phone     string `json:"phone"`
}

// ChangePasswordRequest represents the request payload for changing password
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
}
