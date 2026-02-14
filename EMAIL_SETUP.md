# Temple Food & Meal Management System

This project contains a **Node/Express + MongoDB backend** and a **React (Vite) frontend** for managing temple meal/prasadam counts, billing, and approvals with strict time-based rules.

## Tech Stack

- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt, helmet, cors, morgan
- Frontend: React 18, Vite, Axios, React Router

## Backend Setup

1. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Create `.env` in `backend`:

   ```bash
   MONGO_URI=mongodb://localhost:27017/temple_meals
   JWT_SECRET=change_this_secret
   CORS_ORIGIN=http://localhost:5173
   TEMPLE_TZ=Asia/Kolkata
   ```

3. Run backend in dev mode:

   ```bash
   npm run dev
   ```

4. Bootstrap the first admin (only once, when there are no users):

   ```bash
   curl -X POST http://localhost:4000/api/auth/bootstrap-admin ^
     -H "Content-Type: application/json" ^
     -d "{\"username\":\"admin\",\"password\":\"StrongPassword123\",\"templeName\":\"Main Temple\"}"
   ```

## Frontend Setup

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Run dev server:

   ```bash
   npm run dev
   ```

3. Vite dev server runs on `http://localhost:5173` and proxies `/api` to `http://localhost:4000`.

## Core Business Rules (Server-Side)

- Users can **only submit requests for the next day**, enforced using temple-local date.
- **4 PM cutoff**: if current time is after today 16:00 temple local time, next-day submissions are blocked.
- Each meal request has `createdAt` and `editableUntil = createdAt + 10 minutes` (UTC).
- Editing is only allowed when:
  - `mealStatus == "requested"` **AND**
  - `currentTime <= editableUntil`.
- Bill is calculated server-side from current `breakfastRate`, `lunchRate`, `dinnerRate` and cannot be overridden from the client.

## Main Endpoints (Summary)

- `POST /api/auth/login`: username/password → JWT.
- `POST /api/auth/bootstrap-admin`: one-time first admin creation.
- `GET /api/settings`: get current rates (auth required).
- `POST /api/settings`: set rates (admin).
- `POST /api/users`: create user (admin).
- `GET /api/users`: list users (admin).
- `POST /api/meals`: create next-day request with 4 PM cutoff check.
- `GET /api/meals/mine`: current user’s requests (includes `editingAllowed`).
- `PUT /api/meals/:id`: edit counts within 10-minute window while status is `requested`.
- `POST /api/meals/:id/mark-paid`: user marks payment done.
- `POST /api/meals/:id/admin-meal-status`: admin approves/rejects meal.
- `POST /api/meals/:id/admin-payment-status`: admin approves payment.
- `GET /api/meals/admin-summary`: admin dashboard totals by day and total collected.
- `GET /api/meals/admin-report?date=YYYY-MM-DD`: detailed daily report.

## Production Deployment (High-Level)

- **Backend**:
  - Build Docker image or deploy Node app to a server (e.g., Ubuntu VM, Render, Railway).
  - Set environment variables: `MONGO_URI`, `JWT_SECRET`, `TEMPLE_TZ`, `CORS_ORIGIN`.
  - Use reverse proxy (Nginx) to expose `/api` over HTTPS.
- **Frontend**:
  - Build static assets:

    ```bash
    cd frontend
    npm run build
    ```

  - Serve `dist/` via Nginx or a static host (Netlify, Vercel, S3+CloudFront).
  - Point frontend `baseURL` to your backend API base (update Vite proxy or use env vars).

If you want me to replace the code files too, confirm and I'll overwrite the source files accordingly.
