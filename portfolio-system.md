# Dynamic Portfolio System

## Folder Structure

```text
/frontend
/admin-panel
/backend
```

## API Contract

- `POST /upload` - authenticated Cloudinary upload
- `POST /projects` - create project
- `GET /projects` - public project list
- `PUT /projects/:id` - update project
- `DELETE /projects/:id` - delete project

## Auth Flow

1. Admin logs in in the admin panel with Firebase Email/Password.
2. Frontend obtains the Firebase ID token with `getIdToken()`.
3. Requests to protected backend endpoints send `Authorization: Bearer <token>`.
4. Backend verifies the token with Firebase Admin and checks that the user is an allowed admin.

## Environment Variables

Use the examples in each package's `.env.example` file.