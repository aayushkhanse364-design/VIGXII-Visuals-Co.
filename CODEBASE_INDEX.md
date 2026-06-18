# Codebase Index

## Root

- [package.json](package.json) defines monorepo scripts and workspace packages.
- [README.md](README.md) describes setup and env details.
- [CODEBASE_INDEX.md](CODEBASE_INDEX.md) (this file) maps the repository.
- [ATTRIBUTIONS.md](ATTRIBUTIONS.md) and [portfolio-system.md](portfolio-system.md) contain project notes.

## Top-level apps and folders

- [frontend/](frontend/) — public React + Vite + TypeScript application.
	- [frontend/src/App.tsx](frontend/src/App.tsx)
	- [frontend/src/main.tsx](frontend/src/main.tsx)
	- [frontend/src/lib/api.ts](frontend/src/lib/api.ts)

- [admin-panel/](admin-panel/) — admin React + Vite app for site management.
	- [admin-panel/src/App.tsx](admin-panel/src/App.tsx)
	- [admin-panel/src/main.tsx](admin-panel/src/main.tsx)
	- [admin-panel/src/lib/api.ts](admin-panel/src/lib/api.ts)
	- [admin-panel/src/lib/firebase.ts](admin-panel/src/lib/firebase.ts)

- [backend/](backend/) — Node.js + Express API and related utilities.
	- [backend/src/server.js](backend/src/server.js)
	- [backend/src/app.js](backend/src/app.js)
	- [backend/src/routes/](backend/src/routes/) (route modules)
	- [backend/src/controllers/](backend/src/controllers/) (request handlers)
	- [backend/src/models/](backend/src/models/) (data models)
	- [backend/src/middleware/](backend/src/middleware/) (auth, error handling)
	- [backend/src/config/](backend/src/config/) (db, cloudinary, firebase admin)

- [src/](src/) — shared root app used for the portfolio and local admin views.
	- [src/main.tsx](src/main.tsx)
	- [src/app/App.tsx](src/app/App.tsx)
	- [src/admin/App.tsx](src/admin/App.tsx)
	- [src/lib/api.ts](src/lib/api.ts)
	- [src/admin/lib/firebase.ts](src/admin/lib/firebase.ts)

## UI components (root app)

- [src/app/components/figma/ImageWithFallback.tsx](src/app/components/figma/ImageWithFallback.tsx)
- [src/app/components/ui/] — collection of UI primitives and composables (accordion, alert, button, card, dialog, drawer, form, input, label, menu, pagination, popover, select, sidebar, skeleton, slider, switch, table, tabs, tooltip, and helpers).
	- Notable files: [src/app/components/ui/utils.ts](src/app/components/ui/utils.ts), [src/app/components/ui/use-mobile.ts](src/app/components/ui/use-mobile.ts)

## Styles and assets

- [src/styles/](src/styles/) — global CSS, fonts, Tailwind and theme files.
	- [src/styles/globals.css](src/styles/globals.css)
	- [src/styles/index.css](src/styles/index.css)
	- [src/styles/tailwind.css](src/styles/tailwind.css)
	- [src/styles/theme.css](src/styles/theme.css)
	- [src/styles/fonts.css](src/styles/fonts.css)

- [src/imports/] contains static images used by the root app.

## Build outputs

- [dist/] and app-specific `dist/` folders contain built assets and are present for preview.

## Environment files

- Root `.env` and package-specific `.env.example` files exist: [\.env](.env), [backend/.env](backend/.env), [frontend/.env.example](frontend/.env.example), [admin-panel/.env.example](admin-panel/.env.example)

## Backend API surface (high-level)

- `GET /health`
- `GET /categories`
- `GET /projects`
- `POST /projects`
- `PUT /projects/:id`
- `DELETE /projects/:id`
- `POST /upload`

## Notes

- Admin auth integrates with Firebase for sign-in and short-lived admin sessions.
- The root app and frontend share API client code under `src/lib/api.ts` and `frontend/src/lib/api.ts`.
- To run local development, start both frontend and backend per the root `package.json` scripts.

---

If you'd like, I can: add file counts per folder, generate a navigable tree file, or open this file for review.