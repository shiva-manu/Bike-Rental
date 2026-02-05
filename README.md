# RollingWheels - Premium Bike Rental System

RollingWheels is a modern, full-stack bike rental application designed for a seamless booking experience. It features a robust admin dashboard for fleet management and a beautiful, responsive user interface for customers.

## 🚀 Features

### For Customers
- **Live Bike Grid**: Browse available bikes with real-time status updates.
- **Flexible Booking**: Choose between Hourly, Daily, Weekly, or Monthly rental plans.
- **Smart Conflict Detection**: Automated system to prevent double-booking of vehicles.
- **Midnight-Crossing Support**: Seamlessly book 12-hour reciprocal slots that cross into the next day.
- **Secure Authentication**: User signup and login with phone number validation.

### For Admins
- **Fleet Management**: Add, update, or remove bikes from the system.
- **Price Control**: Set dynamic pricing for different rental tiers (Hour/Day/Week/Month).
- **Booking Management**: View all reservations and mark them as "Completed" to release bikes back into the available pool.
- **Secure Auth**: Restricted admin-only portal for system control.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Shadcn UI, Lucide Icons.
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL with Prisma ORM.
- **State/Nav**: React Router, React Hooks.
- **Notifications**: Sonner (Toast notifications).

## 📦 Project Structure

```bash
rollingwheels/
├── client/          # Vite + React Frontend
└── server/          # Node.js + Express Backend
```

## ⚙️ Setup Instructions

### 1. Database Setup (Server)
Navigate to the `server` directory:
```bash
cd server
npm install
```
Configure your `.env` with your PostgreSQL connection string:
```bash
DATABASE_URL="your_postgresql_url"
JWT_SECRET="your_secret_key"
```
Run migrations:
```bash
npx prisma generate
npx prisma db push
```

### 2. Frontend Setup (Client)
Navigate to the `client` directory:
```bash
cd client
npm install
```
Set up your `.env`:
```bash
VITE_API_BASE_URL="http://localhost:5000/api"
```

### 3. Run Locally
Start the server:
```bash
# In /server
npm run dev
```
Start the client:
```bash
# In /client
npm run dev
```

## 🌐 Deployment

The application is configured for deployment on **Vercel**.
- The `client/vercel.json` handles Single Page Application (SPA) routing.
- The `client/.npmrc` includes `legacy-peer-deps=true` to resolve specific dependency conflicts during build.

---
Built with ❤️ by the RollingWheels Team.
