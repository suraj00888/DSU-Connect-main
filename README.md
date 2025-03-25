# DSUConnect

DSUConnect is a platform for DSU students to connect, share resources, and participate in campus events.

## Setup

### Prerequisites

- Node.js (v16 or newer)
- npm (v8 or newer)

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd DSUConnect
   ```

2. Install all dependencies (server and client)
   ```bash
   npm run install-all
   ```

   This will install:
   - Root dependencies (concurrently)
   - Client dependencies
   - Server dependencies

## Running the Application

### Option 1: Using npm

You can start both the frontend and backend servers with a single command:

```bash
npm run dev
```

This will start:
- The React frontend on http://localhost:5173
- The Node.js backend on http://localhost:5001 (with Nodemon for auto-restart)

### Option 2: Using the shell script

Alternatively, you can use the provided shell script:

```bash
./run-app.sh
```

This script will start both servers and automatically shut them down when you press Ctrl+C.

## Development

### Frontend Only

To run only the frontend:

```bash
npm run client
```

### Backend Only

To run only the backend:

```bash
npm run server
```

For backend development with auto-restart on file changes:

```bash
npm run server:dev
```

## Features

- User authentication and profile management
- Campus events creation and registration
- Resource sharing and management
- Discussion forums
- And more!

## Project Structure

```
DSUConnect/
├── client/              # React frontend
├── server/              # Node.js backend
├── package.json         # Root package.json for running both services
├── run-app.sh           # Shell script to run both services
└── README.md            # This file
```

## Token Expiry and Refresh System

### Overview

The DSUConnect application implements a robust token-based authentication system with automatic refresh capabilities. This ensures user sessions remain secure while providing a smooth user experience.

### Key Features

1. **Short-lived Access Tokens**: JWT tokens with a 1-hour expiration time
2. **Refresh Token System**: Long-lived refresh tokens stored securely in the database
3. **Automatic Token Refresh**: Seamless renewal of access tokens when they expire
4. **Session Expiry Notification**: User-friendly notifications when session is about to expire
5. **Secure Logout**: Proper invalidation of tokens on all devices

### How It Works

#### Login Process
- User logs in with credentials
- Server issues:
  - Access token (JWT, expires in 1 hour)
  - Refresh token (stored in database, long-lived)
- Both tokens are stored in localStorage

#### Token Expiry Handling
1. **Automatic API Refresh**:
   - When an API call returns 401 Unauthorized
   - The system automatically tries to refresh the token
   - The original API call is retried with the new token

2. **Proactive Checks**:
   - The app periodically checks token expiration
   - Shows a warning when expiration is approaching
   - Gives users the option to extend their session

3. **Session Expiry**:
   - If refresh fails, user is logged out gracefully
   - Clear notification shown after redirecting to login

### Testing Token Expiry

For developers, the app includes test utilities to simulate various expiration scenarios:

```javascript
// Import test utilities
import { 
  simulateTokenExpiry, 
  simulateTokenExpiring,
  simulateSessionExpiry 
} from './src/test/tokenExpiry';

// Test token refresh flow
simulateTokenExpiry();

// Test expiry warning modal
simulateTokenExpiring();

// Test complete session expiry (logout)
simulateSessionExpiry();
```

Run these functions in your browser console to simulate different scenarios. 