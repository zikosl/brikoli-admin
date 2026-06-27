# AGENTS.md

## Project

This is an admin dashboard for a home services platform.

The platform has:
- Client Expo mobile app
- Worker Expo mobile app
- Admin React web dashboard

This repository is for the admin dashboard only.

## Stack

Use:
- React
- TypeScript
- Vite
- Firebase Web SDK
- Firestore
- Firebase Authentication
- Firebase Storage
- React Router DOM
- Tailwind CSS
- Lucide React
- Recharts

Do not use Expo in this repository.

## Firebase

Use environment variables only.

Expected env vars:

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

Do not hardcode real Firebase credentials.

## Auth

Only users with role "admin" in users/{uid} can access the dashboard.

There is no public signup.

If a user logs in and is not admin, sign them out.

## Important Rule

Do not create worker Firebase Auth accounts from the frontend using createUserWithEmailAndPassword.

Worker auth account creation must be handled later with a Firebase Callable Cloud Function using Firebase Admin SDK.

For now, the dashboard can create and edit worker Firestore profiles only.

## Collections

Use these Firestore collections:

- users
- services
- requests
- ratings
- settings

## Request Statuses

Allowed request statuses:

- pending
- assigned
- accepted
- on_the_way
- in_progress
- completed
- cancelled
- rejected

## Commands

Use these commands:

npm install
npm run dev
npm run build

Before finishing a task, run:

npm run build

Fix all TypeScript/build errors before final response.

## Code Style

- Use TypeScript strictly.
- Avoid any.
- Keep Firebase logic inside src/services.
- Keep pages focused on UI and page state.
- Use reusable components.
- Add loading states.
- Add empty states.
- Add error states.
- Use serverTimestamp() for createdAt and updatedAt.