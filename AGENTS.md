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
- NestJS backend API
- JWT authentication
- Local backend uploads
- React Router DOM
- Tailwind CSS
- Lucide React
- Recharts

Do not use Expo in this repository.

## Backend API

Use environment variables only.

Expected env vars:

VITE_API_URL=http://localhost:3000/api/v1

Do not hardcode production API secrets or credentials.

## Auth

Only backend users with role "ADMIN" can access the dashboard.

There is no public signup.

If a user logs in and is not admin, clear the session and reject access.

## Important Rule

Create and edit worker accounts through the backend users endpoints only.

## API Resources

Use these backend resources:

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
- Keep API logic inside src/services.
- Keep pages focused on UI and page state.
- Use reusable components.
- Add loading states.
- Add empty states.
- Add error states.
- Let the backend own createdAt and updatedAt.
