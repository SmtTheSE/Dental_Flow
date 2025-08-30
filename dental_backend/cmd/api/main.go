// dental_backend/cmd/api/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"dental_backend/internal/database"
	"dental_backend/internal/handlers"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database connection using the shared database package
	_, err := database.InitDB()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Defer closing the database connection
	defer func() {
		if err := database.CloseDB(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}()

	// Set release mode for production
	gin.SetMode(gin.ReleaseMode)

	// Create router
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(corsMiddleware())

	// Define routes
	setupRoutes(router)

	// Create HTTP server
	srv := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		fmt.Println("Starting server on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	fmt.Println("Server exiting")
}

func setupRoutes(router *gin.Engine) {
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Dental backend is running",
		})
	})

	// API routes
	api := router.Group("/api")
	{
		// Authentication endpoints
		api.POST("/auth/register", handlers.Register)
		api.POST("/auth/login", handlers.Login)
		api.GET("/auth/user", handlers.AuthMiddleware(), handlers.GetCurrentUser)

		// Dashboard endpoints
		api.GET("/dashboard/stats", handlers.AuthMiddleware(), getDashboardStats)

		// Patient endpoints
		api.GET("/patients", handlers.AuthMiddleware(), handlers.GetPatients)
		api.POST("/patients", handlers.AuthMiddleware(), handlers.CreatePatient)
		api.GET("/patients/:id", handlers.AuthMiddleware(), handlers.GetPatient)
		api.PUT("/patients/:id", handlers.AuthMiddleware(), handlers.UpdatePatient)
		api.DELETE("/patients/:id", handlers.AuthMiddleware(), handlers.DeletePatient)

		// Appointment endpoints
		api.GET("/appointments/today", handlers.AuthMiddleware(), handlers.GetTodaysAppointments)
		api.GET("/appointments", handlers.AuthMiddleware(), handlers.GetAppointments)
		api.GET("/appointments/:id", handlers.AuthMiddleware(), handlers.GetAppointment)
		api.POST("/appointments", handlers.AuthMiddleware(), handlers.CreateAppointment)
		api.PUT("/appointments/:id", handlers.AuthMiddleware(), handlers.UpdateAppointment)
		api.DELETE("/appointments/:id", handlers.AuthMiddleware(), handlers.DeleteAppointment)

		// Treatment endpoints
		api.GET("/treatments/queue", handlers.AuthMiddleware(), handlers.GetTreatmentQueue)
		api.GET("/treatments", handlers.AuthMiddleware(), handlers.GetTreatments)
		api.GET("/treatments/:id", handlers.AuthMiddleware(), handlers.GetTreatment)
		api.POST("/treatments", handlers.AuthMiddleware(), handlers.CreateTreatment)
		api.PUT("/treatments/:id", handlers.AuthMiddleware(), handlers.UpdateTreatment)
		api.DELETE("/treatments/:id", handlers.AuthMiddleware(), handlers.DeleteTreatment)

		// Patient treatment endpoints
		api.GET("/patients/:id/treatments", handlers.AuthMiddleware(), handlers.GetPatientTreatments)
		api.POST("/patient-treatments", handlers.AuthMiddleware(), handlers.CreatePatientTreatment)
		api.PUT("/patient-treatments/:id", handlers.AuthMiddleware(), handlers.UpdatePatientTreatment)
		api.DELETE("/patient-treatments/:id", handlers.AuthMiddleware(), handlers.DeletePatientTreatment)

		// Billing endpoints
		api.GET("/billing/stats", handlers.AuthMiddleware(), handlers.GetBillingStats)
		api.GET("/billing/invoices", handlers.AuthMiddleware(), handlers.GetInvoices)
		api.GET("/billing/invoices/:id", handlers.AuthMiddleware(), handlers.GetInvoice)
		api.POST("/billing/invoices", handlers.AuthMiddleware(), handlers.CreateInvoice)
		api.PUT("/billing/invoices/:id", handlers.AuthMiddleware(), handlers.UpdateInvoice)
		api.DELETE("/billing/invoices/:id", handlers.AuthMiddleware(), handlers.DeleteInvoice)

		// Insurance claims endpoints
		api.GET("/billing/claims", handlers.AuthMiddleware(), handlers.GetInsuranceClaims)
		api.GET("/billing/claims/:id", handlers.AuthMiddleware(), handlers.GetInsuranceClaim)
		api.POST("/billing/claims", handlers.AuthMiddleware(), handlers.CreateInsuranceClaim)
		api.PUT("/billing/claims/:id", handlers.AuthMiddleware(), handlers.UpdateInsuranceClaim)
		api.DELETE("/billing/claims/:id", handlers.AuthMiddleware(), handlers.DeleteInsuranceClaim)

		// Activity endpoints
		api.GET("/activity/recent", handlers.AuthMiddleware(), getRecentActivity)
	}
}

// Middleware to handle CORS
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Dashboard stats handler
func getDashboardStats(c *gin.Context) {
	// In a real implementation, this would fetch actual dashboard stats
	c.JSON(http.StatusOK, gin.H{
		"todayAppointments": 12,
		"activePatients":    324,
		"pendingTreatments": 28,
		"monthlyRevenue":    48950.00,
	})
}

// Recent activity handler
func getRecentActivity(c *gin.Context) {
	// In a real implementation, this would fetch recent activity from the database
	c.JSON(http.StatusOK, []interface{}{})
}
