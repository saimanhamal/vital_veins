# VitalVeins - Blood and Organ Donation Management System

VitalVeins is a comprehensive platform that connects donors with hospitals, streamlining the blood and organ donation process.

## Features

- **User Registration**: Register as a donor or hospital
- **Donor Dashboard**: Track donation history and upcoming appointments
- **Hospital Management**: Manage blood and organ inventory, create donation requests
- **Appointment Scheduling**: Book and manage donation appointments
- **Real-time Notifications**: Get updates on urgent donation needs and registration status
- **Search Functionality**: Find nearby hospitals or compatible donors
- **Animated UI**: Smooth transitions and visual feedback throughout the application

## Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **Real-time Communication**: Socket.io

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB

### Installation

1. Clone the repository
```

```

2. Install dependencies
```
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
```
# In the backend directory, create a .env file
cp .env.example .env
# Edit the .env file with your MongoDB URI and JWT secret
```

4. Start the application
```
# Start backend server (from backend directory)
npm run dev

# Start frontend development server (from frontend directory)
npm start
```

5. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user (donor or hospital)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile

### Donor
- `GET /api/donor/dashboard` - Get donor dashboard data
- `GET /api/donor/hospitals` - Get nearby hospitals
- `POST /api/donor/appointments` - Book an appointment

### Hospital
- `GET /api/hospital/dashboard` - Get hospital dashboard data
- `POST /api/hospital/tickets` - Create donation request ticket
- `GET /api/hospital/appointments` - Get hospital appointments

## License

This project is licensed under the MIT License - see the LICENSE file for details.