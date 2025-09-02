# Dental Practice Management System

A comprehensive dental practice management system with patient records, appointment scheduling, treatment planning, and billing capabilities.

## Features

- Patient management with medical history and dental charts
- Appointment scheduling with calendar view
- Treatment planning and procedure tracking
- Billing and insurance claim management
- Staff and user management with role-based access control
- Google OAuth integration for easy sign-in/sign-up

## Prerequisites

- Go 1.19+
- Node.js 16+
- PostgreSQL database
- Google OAuth 2.0 Client ID (for Google Sign-In)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd dental_backend
   ```

2. Install Go dependencies:
   ```bash
   go mod tidy
   ```

3. Set up your PostgreSQL database and update the connection string in `internal/database/postgres.go`

4. Create a `.env` file in the `dental_backend` directory with your JWT secret:
   ```
   JWT_SECRET=your_jwt_secret_here
   ```

5. Run the backend server:
   ```bash
   go run cmd/api/main.go
   ```

### Frontend Setup

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following:
   ```
   VITE_API_BASE_URL=http://localhost:8080
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

3. Run the frontend development server:
   ```bash
   npm run dev
   ```

### Google OAuth Setup

To enable Google Sign-In functionality, follow these steps:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project or select an existing one

3. Enable the Google+ API

4. Create OAuth 2.0 credentials:
   - Go to "Credentials" in the sidebar
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add the following authorized JavaScript origins:
     - http://localhost:5173
     - http://127.0.0.1:5173
   - Add the following authorized redirect URIs:
     - http://localhost:5173
     - http://127.0.0.1:5173
   - Click "Create"

5. Copy the Client ID and replace `your_google_client_id_here` in your `.env` file

6. For production, add your domain to the authorized origins and redirect URIs

## Usage

1. Start both the backend and frontend servers
2. Open your browser and navigate to `http://localhost:5173`
3. Sign in with your credentials or use Google Sign-In
4. Explore the dashboard and other features

## API Endpoints

- Authentication: `/api/auth/login`, `/api/auth/register`, `/api/auth/google-login`
- Patients: `/api/patients/*`
- Appointments: `/api/appointments/*`
- Treatments: `/api/treatments/*`
- Billing: `/api/billing/*`

## Security Considerations

- Always use HTTPS in production
- Store sensitive information like JWT secrets in environment variables
- Regularly update dependencies to patch security vulnerabilities
- Implement proper input validation and sanitization