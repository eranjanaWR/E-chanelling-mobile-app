# E-Channeling Mobile App

A full-stack E-Channeling app built with React Native (Expo), Express.js, and MongoDB.

## Project Structure

- apps/mobile: Expo React Native app
- apps/server: Express + MongoDB API

## Backend Setup

```bash
cd apps/server
npm install
npm run dev
```

### Environment Variables

Create apps/server/.env (already created in this workspace):

- PORT=4000
- MONGODB_URI=your_mongodb_connection_string
- JWT_SECRET=your_secret
- JWT_EXPIRES_IN=7d

### API Routes

- GET /health
- POST /auth/register
- POST /auth/login
- GET /profile
- PATCH /profile
- GET /doctors
- POST /doctors
- GET /appointments
- POST /appointments

### Data Models

- User: name, email, password, role, contactNumber, medicalHistory
- Doctor: user, name, email, specialty, availability, fees
- Appointment: patient, doctor, appointmentDate, timeSlot, status

## Mobile Setup

```bash
cd apps/mobile
npm install
npm run start
```

### API Base URL

Update the API base URL in apps/mobile/app.json:

```json
"extra": {
  "apiBaseUrl": "http://localhost:4000"
}
```

For physical devices, use your local network IP (for example, http://192.168.1.10:4000).

## Notifications

The app schedules appointment reminders at 24 hours, 2 hours, and 15 minutes before the appointment time. It uses local notifications via expo-notifications.

## Testing

### Mobile (Jest)

```bash
cd apps/mobile
npm test
```

### API (Mocha)

```bash
cd apps/server
npm test
```

## UI Flow

- Login / Sign Up
- Dashboard
- Doctor Search
- Appointment Booking
- Patient or Doctor Profile management
