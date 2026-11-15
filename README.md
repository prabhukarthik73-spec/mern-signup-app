# MERN Stack Sign Up Application

A simple, clean, and beginner-friendly Sign Up application built with **React**, **Express.js**, **REST API**, and **MongoDB**.

## Features

- **Frontend**:
  - Clean white design matching standard modern authentication UI.
  - Custom light blue Sign Up button (`#38bdf8`).
  - Email and password input fields with input validation.
  - "Already a member? Log In" navigation link.
  - Success and error alerts with status indicators.
- **Backend**:
  - Express.js REST API with `POST /api/signup`.
  - Email uniqueness verification.
  - Secure password hashing using `bcryptjs`.
  - MongoDB integration using `mongoose`.
  - Built-in automatic fallback to in-memory MongoDB for instant zero-config testing if a local MongoDB service is not running.

---

## Project Structure

```
mern_project2/
├── backend/
│   ├── models/
│   │   └── User.js          # Mongoose schema for User (email, hashed password, timestamp)
│   ├── .env                 # Environment variables (PORT, MONGODB_URI)
│   ├── .env.example         # Example configuration
│   ├── package.json         # Backend dependencies
│   └── server.js            # Express server & /api/signup endpoint
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.css          # Form styling, clean white background, light blue button
│   │   ├── App.jsx          # Sign Up component with form validation & API call
│   │   ├── index.css        # Global layout styling
│   │   └── main.jsx         # React DOM mount point
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration with /api reverse proxy
├── package.json             # Root package scripts
└── README.md
```

---

## Quick Start Guide

### 1. Install Dependencies

In the root directory or inside `backend` and `frontend`:

```bash
# In backend directory
cd backend
npm install

# In frontend directory
cd ../frontend
npm install
```

### 2. Configure MongoDB (Optional)

The backend connects to MongoDB using the connection string in `backend/.env`:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/signup_db
```
*Note: If local MongoDB is not running on your computer, the backend automatically starts an in-memory MongoDB server so you can test immediately without any extra setup!*

### 3. Run the Application

**Start the Backend Server (Terminal 1):**
```bash
cd backend
node server.js
```
The server will run on: `http://localhost:5001`

**Start the Frontend App (Terminal 2):**
```bash
cd frontend
npm run dev
```
The React frontend will run on: `http://localhost:3000`

---

## REST API Specification

### `POST /api/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Responses:**

- **201 Created (Success):**
  ```json
  {
    "success": true,
    "message": "Sign Up successful! Your account has been created.",
    "user": {
      "id": "673752e2...",
      "email": "user@example.com",
      "createdAt": "2026-11-15T15:45:00.000Z"
    }
  }
  ```

- **400 Bad Request (Validation or Duplicate Email):**
  ```json
  {
    "success": false,
    "message": "Email already exists. Please log in or use another email."
  }
  ```
