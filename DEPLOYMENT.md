# Temple Meals - Deployment Guide

## Deployment Setup (Vercel Frontend + Render/Railway Backend)

### Step 1: Deploy Backend to Render or Railway

#### Option A: Render.com (Recommended)
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** temple-meals-api
   - **Environment:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Root directory:** `backend`
6. Add environment variables:
   ```
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/templeDB?retryWrites=true&w=majority
   JWT_SECRET=<generate-strong-random-string>
   PORT=4000
   CORS_ORIGIN=https://<your-vercel-domain>.vercel.app
   ```
7. Deploy

#### Option B: Railway.app
1. Go to [railway.app](https://railway.app)
2. Connect GitHub
3. Create new project → Select repository
4. Set root directory to `backend`
5. Add same environment variables as above
6. Deploy

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - **Framework:** Vite
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://<your-backend-url>.onrender.com
   ```
   (Replace with your actual Render/Railway backend URL)
5. Deploy

### Step 3: Verify Deployment

- Frontend: `https://<your-vercel-domain>.vercel.app`
- Backend API: `https://<your-backend-url>.onrender.com/api/health`
- Login with: `admin` / `secret`

### MongoDB Atlas Setup (if not already done)

1. Create free cluster at [mongodb.com/cloud](https://mongodb.com/cloud)
2. Create database user with username/password
3. Get connection string and update `MONGO_URI`
4. Whitelist all IPs (0.0.0.0/0) for production access

### Important Notes

- Update `JWT_SECRET` to a strong random string
- Never commit `.env` files with real secrets
- Test API endpoints after deployment
- Monitor logs on Render/Railway/Vercel dashboards

