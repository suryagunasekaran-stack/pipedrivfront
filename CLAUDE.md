# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on http://localhost:3001 with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

This is a **Next.js 15 frontend application** that serves as the interface for a Pipedrive-Xero integration system. It connects CRM data (Pipedrive) with accounting workflows (Xero).

### Core Technologies
- Next.js 15.1.6 with React 19 and TypeScript
- TailwindCSS 4 for styling
- Headless UI and Hero Icons for UI components
- App Router with server/client components

### Application Structure

The application has two main areas:

1. **Main Application** (`/app`)
   - Deal data viewing and management from Pipedrive
   - Quote creation and updates in Xero
   - Project management and tracking
   - Multi-user authentication with OAuth

2. **Admin Panel** (`/app/admin`)
   - Access via `/admin` with password `admin1234`
   - Company registration and management
   - Project sequence configuration
   - Activity logs and system monitoring
   - User authentication status tracking

### Key Architectural Patterns

#### API Proxy Layer
All API calls go through `/app/api/proxy/route.ts` which forwards requests to the Node.js backend at `https://api.exlservice.cloud`. This provides:
- Centralized error handling
- Authentication token management
- CORS handling

#### Authentication System
Multi-user OAuth implementation with:
- Automatic retry mechanism for failed API calls (401/403 errors)
- Session persistence via localStorage
- User-specific authentication flows stored in backend
- Re-authentication triggers through `/app/api/auth/check/route.ts`

#### State Management
- Server Components for initial data fetching
- Client Components with React hooks for interactive features
- No external state management library - relies on React's built-in state

### API Endpoints

Backend base URL: `https://api.exlservice.cloud`

Key endpoints accessed through proxy:
- `/api/companies` - Company management
- `/api/pipedrive/*` - Pipedrive data (deals, contacts, products)
- `/api/xero/*` - Xero operations (quotes, projects)
- `/api/auth/*` - Authentication flows
- `/api/admin/*` - Admin operations

### Error Handling

The application implements comprehensive error handling:
- API errors are caught and displayed with user-friendly messages
- Authentication failures trigger automatic re-authentication
- Network errors show appropriate fallback UI
- Detailed error logging for debugging

### Important Files

- `/app/api/proxy/route.ts` - Central API proxy
- `/app/components/AuthCheck.tsx` - Authentication verification component
- `/app/admin/components/AdminAuth.tsx` - Admin panel authentication
- `/app/utils/apiClient.ts` - API client with automatic retry
- `/app/utils/userAuth.ts` - User authentication data management
- `/middleware.ts` - Next.js middleware for route protection

### Development Notes

- The frontend expects the backend to be running at `https://api.exlservice.cloud`
- Authentication tokens are managed by the backend, frontend only handles UI flows
- All Pipedrive and Xero operations are proxied through the backend
- The admin panel has its own authentication separate from user OAuth
- User authentication data stored in localStorage includes userId and companyId