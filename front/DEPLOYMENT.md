# Deployment Guide

This project is a monorepo with two Vite apps and one Express API:

- `frontend/` - public site
- `admin-panel/` - admin dashboard
- `backend/` - Node.js API

Recommended hosting:

- Vercel for `frontend/` and `admin-panel/`
- Render for `backend/`
- MongoDB Atlas for the database
- Cloudinary for media uploads
- Firebase Authentication for admin login

## 1. Deploy the Backend on Render

### Create the Render service

1. Push the repo to GitHub.
2. In Render, create a new **Web Service** from the GitHub repo.
3. Set the service root directory to `backend`.
4. Use these build and start commands:

```bash
npm install
```

```bash
npm start
```

### Backend environment variables

Add these in Render:

```env
PORT=10000
NODE_ENV=production
MONGODB_URI=<your_mongodb_atlas_uri>
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
FIREBASE_PROJECT_ID=<your_firebase_project_id>
FIREBASE_CLIENT_EMAIL=<your_firebase_admin_client_email>
FIREBASE_PRIVATE_KEY=<your_firebase_private_key>
ADMIN_EMAILS=<admin_email_1,admin_email_2>
CORS_ORIGIN=https://your-frontend.vercel.app,https://your-admin.vercel.app
```

### Notes

- `CORS_ORIGIN` must include both Vercel domains.
- `FIREBASE_PRIVATE_KEY` must keep the `\n` line breaks in a single environment variable value.
- If you use the JSON service account fallback, keep it only on the backend.

### Backend API URLs

After deployment, Render will give you a public URL like:

```text
https://your-backend.onrender.com
```

Use that as the API base URL in both Vercel apps.

## 2. Deploy the Public Frontend on Vercel

### Create the Vercel project

1. Create a new Vercel project from the same GitHub repo.
2. Set the root directory to `frontend`.
3. Framework preset: **Vite**.
4. Build command:

```bash
npm run build
```

5. Output directory:

```text
dist
```

### Frontend environment variables

Add these in Vercel:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

### If you use a custom domain

Update `CORS_ORIGIN` in Render to include the custom frontend URL as well.

## 3. Deploy the Admin Panel on Vercel

### Create the second Vercel project

1. Create another Vercel project from the same GitHub repo.
2. Set the root directory to `admin-panel`.
3. Framework preset: **Vite**.
4. Build command:

```bash
npm run build
```

5. Output directory:

```text
dist
```

### Admin environment variables

Add these in Vercel:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_FIREBASE_API_KEY=<your_firebase_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<your_firebase_auth_domain>
VITE_FIREBASE_PROJECT_ID=<your_firebase_project_id>
VITE_FIREBASE_STORAGE_BUCKET=<your_firebase_storage_bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your_firebase_messaging_sender_id>
VITE_FIREBASE_APP_ID=<your_firebase_app_id>
VITE_ADMIN_EMAILS=<admin_email_1,admin_email_2>
```

## 4. Firebase Setup

1. Create a Firebase project.
2. Enable **Email/Password** sign-in.
3. Add the admin panel web app config values to the admin Vercel project.
4. Add the same admin email(s) to:
   - `VITE_ADMIN_EMAILS` in the admin panel
   - `ADMIN_EMAILS` in the backend

## 5. Database Setup

Use MongoDB Atlas:

1. Create a cluster.
2. Create a database user.
3. Allow network access from Render.
4. Copy the Atlas connection string into `MONGODB_URI` on Render.

## 6. Cloudinary Setup

1. Create a Cloudinary account.
2. Copy the cloud name, API key, and API secret into Render.
3. The admin panel uploads media through the backend `POST /upload` route.

## 7. Local Development Before Deploying

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Admin panel:

```bash
cd admin-panel
npm install
npm run dev
```

## 8. Deployment Checklist

- Backend is live on Render.
- Frontend Vercel project points to the Render backend URL.
- Admin Vercel project points to the same backend URL.
- Render `CORS_ORIGIN` includes both Vercel domains.
- Firebase admin email list matches in backend and admin panel.
- MongoDB Atlas and Cloudinary credentials are set on Render.

## 9. Suggested Production URLs

Example layout:

- Frontend: `https://vigxii-visuals-co.vercel.app`
- Admin: `https://vigxii-admin.vercel.app`
- API: `https://vigxii-api.onrender.com`

If you want, I can also add a `vercel.json` and a small Render-ready `README` section for one-click deployment.