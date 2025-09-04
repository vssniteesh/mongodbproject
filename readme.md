# MediBooker (MERN)

## Overview
This project is a full-stack web application for booking medical appointments, built using the MERN stack (MongoDB, Express.js, React, Node.js). It provides a modern, clean, and user-friendly interface for patients and healthcare professionals to manage appointments, profiles, and more.

## Features
- User registration and login (with JWT authentication)
- Admin login and dashboard
- Doctor dashboard and management
- Patient dashboard for booking appointments
- Two-factor authentication (2FA) for enhanced security
- Password reset and account settings
- Responsive, accessible, and visually appealing UI

## Technologies Used
- **Frontend:** React, Vite, CSS (custom, modern color palette)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas)
- **Authentication:** JWT, 2FA

## Folder Structure
```
book-a-doctor-using-mern/
   client/        # React frontend
   server/        # Node.js/Express backend
```

## How It Works
1. **User Registration/Login:** Patients and healthcare professionals can register and log in securely.
2. **Admin Panel:** Admins can manage healthcare professionals and view appointments.
3. **Healthcare Professional Panel:** Healthcare professionals can manage their profile and appointments.
4. **Patient Panel:** Patients can search for healthcare professionals and book appointments.
5. **Security:** JWT-based authentication and optional 2FA for sensitive actions.

## Getting Started
1. Clone the repository.
2. Set up your `.env` files for both client and server (see `server/env.example`).
3. Install dependencies:
   - `cd client && npm install`
   - `cd ../server && npm install`
4. Start the backend:
   - `npm start` (from `server` folder)
5. Start the frontend:
   - `npm run dev` (from `client` folder)

## Customization
- The UI uses a clean, modern color palette for maximum readability and appeal.
- Easily customize colors in `client/src/App.css` and `client/src/index.css`.

## License
This project is open source and free to use for educational and personal purposes.

---
Developed and Designed by Rajesh
