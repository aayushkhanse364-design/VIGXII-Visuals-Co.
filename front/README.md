# Dynamic Portfolio System

Monorepo layout for a dynamic portfolio with a public frontend, a secure admin panel, and a Node.js API.

## Folder Structure

```text
frontend/
admin-panel/
backend/
```

## What’s Included

- React + Vite + TypeScript public frontend
- React + Vite + TypeScript admin panel
- Express + MongoDB backend with MVC structure
- Firebase Authentication login for admin users only
- Firebase Admin token verification on protected routes
- Cloudinary upload endpoint for images and videos
- Loading states, toasts, and form validation in the UI

## Setup

1. Install dependencies in each package.

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../admin-panel && npm install
```

2. Copy the example environment files.

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`
- `admin-panel/.env.example` -> `admin-panel/.env`

3. Fill in the required values.

- MongoDB connection string
- Cloudinary credentials
- Firebase web app config
- Firebase Admin service account JSON
- Allowed admin email list

### Environment Variables

Backend:

- `PORT`
- `MONGODB_URI`
- `NODE_ENV`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `ADMIN_EMAILS`

Admin panel:

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ADMIN_EMAILS`

### Firebase Setup

1. Create a Firebase project.
2. Enable Email/Password authentication.
3. Register the admin panel as a Web App and copy its config into `admin-panel/.env`.
4. Copy the Firebase Admin service account fields into `backend/.env` as `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
5. Add the admin email address to both `admin-panel/.env` and `backend/.env` under `VITE_ADMIN_EMAILS` and `ADMIN_EMAILS`.
6. If you prefer, you can still use `FIREBASE_SERVICE_ACCOUNT_JSON` as a fallback in the backend.

### Cloudinary Setup

1. Create a Cloudinary account.
2. Copy the cloud name, API key, and API secret into `backend/.env`.
3. Uploads from the admin panel will call `POST /upload` with a Firebase Bearer token.

4. Start the backend.

```bash
cd backend
npm run dev
```

5. Start the public frontend.

```bash
cd frontend
npm run dev
```

6. Start the admin panel.

```bash
cd admin-panel
npm run dev
```

## API Endpoints

- `POST /upload`
- `POST /projects`
- `GET /projects`
- `PUT /projects/:id`
- `DELETE /projects/:id`

## API Integration Examples

### Fetch projects from the frontend

```ts
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`);
const { data } = await response.json();
```

### Create a project from the admin panel

```ts
const token = await auth.currentUser?.getIdToken();

await fetch(`${import.meta.env.VITE_API_BASE_URL}/projects`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`,
	},
	body: JSON.stringify({
		title: 'New Project',
		description: 'Project details',
		techStack: ['React', 'Node.js'],
		githubLink: 'https://github.com/example/repo',
		imageUrl: 'https://res.cloudinary.com/...',
	}),
});
```

### Upload media before saving a project

```ts
const formData = new FormData();
formData.append('file', selectedFile);

await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, {
	method: 'POST',
	headers: { Authorization: `Bearer ${token}` },
	body: formData,
});
```

## Auth Flow

1. Admin signs in with Firebase email/password in the admin panel.
2. The client sends the Firebase ID token as a Bearer token.
3. The backend verifies the token with Firebase Admin.
4. Only an allowed admin email or custom admin claim can modify projects.

## Try It

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

```bash
cd admin-panel
npm run dev
```

## Root Scripts

- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run dev:admin`
- `npm run build`
