# Temple Meals - Deployment Guide

## Deployment Setup (Render Backend + Render Frontend)

### Step 1: Deploy Backend to Render

#### Render.com (Recommended)
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
   CORS_ORIGIN=https://temple-meals-frontend.onrender.com
   ```
7. Deploy

#### Option B: Railway.app
1. Go to [railway.app](https://railway.app)
2. Connect GitHub
3. Create new project → Select repository
4. Set root directory to `backend`
5. Add same environment variables as above
6. Deploy

### Step 2: Deploy Frontend to Render (Static Site)

1. Go to [render.com](https://render.com)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name:** temple-meals-frontend
   - **Root directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `dist`
5. Add environment variable:
   ```
   VITE_API_URL=https://<your-backend-service-name>.onrender.com
   ```
   (Replace `<your-backend-service-name>` with your actual backend service name)
6. Deploy

### Step 3: Verify Deployment

- Frontend: `https://temple-meals-frontend.onrender.com`
- Backend API: `https://temple-meals-api.onrender.com/api/health`
- Login with: `admin` / `krishna@108`

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

