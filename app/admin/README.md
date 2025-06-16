# Admin Panel Implementation

## Overview
A comprehensive admin panel for the Pipedrive application management system with authentication, company management, project sequences, activity logging, and system health monitoring.

## Access
- **URL**: `/admin`
- **Login**: Password authentication with `admin1234`
- **Session**: Cookie-based authentication

## Pages

### 1. Login Page (`/admin/login`)
- Simple password authentication
- Error handling for invalid credentials
- Automatic redirect after successful login

### 2. Dashboard (`/admin/dashboard`)
- **System Overview**: Total companies, projects, sequences, uptime
- **Health Indicators**: Database status, memory usage, overall health score
- **Recent Activity**: Last 10 admin actions
- **Quick Stats**: Auth connections, department breakdown, current year activity

### 3. Company Management (`/admin/companies`)
- **Company List**: Paginated table with 50 items per page
- **Search**: Real-time search functionality
- **Edit Modal**: Update custom fields and Xero settings
- **Status Indicators**: Pipedrive/Xero connection status
- **Bulk Selection**: Select multiple companies for bulk operations

### 4. Project Sequences (`/admin/sequences`)
- **Current Year View**: All department sequences for current year
- **Previous Years**: Expandable sections for historical data
- **Inline Editing**: Click pencil icon to edit sequence numbers
- **Reset Function**: Reset sequences to 0 with confirmation
- **Statistics**: Project count, efficiency metrics

### 5. Activity Log (`/admin/activity`)
- **Timeline View**: Chronological list of all admin actions
- **Filtering**: By action type, date range
- **Status Indicators**: Success/failure badges
- **Detailed Metadata**: Expandable details for each action
- **Pagination**: 50 items per page

### 6. System Health (`/admin/health`)
- **Overall Score**: System health percentage
- **Database Metrics**: Connection status, response time, document counts
- **Memory Usage**: Visual progress bar with usage statistics
- **Collection Details**: Detailed breakdown of database collections
- **Auto-refresh**: Updates every 30 seconds

## Components

### Reusable Components
- **StatusBadge**: Color-coded status indicators
- **Loading**: Loading states with spinner
- **StatCard**: Dashboard statistics cards
- **Modal**: Reusable modal dialogs

### API Integration
All API calls use the `adminRequest` wrapper that:
- Automatically includes session cookies
- Handles 401 redirects to login
- Provides consistent error handling
- Supports TypeScript types

## Authentication Flow
1. User visits any admin page
2. If not authenticated, redirect to login
3. After login, session cookie is set
4. All API requests include credentials
5. 401 responses trigger re-authentication

## Color Coding
- **Green**: Healthy, connected, success
- **Yellow/Orange**: Warning, needs attention
- **Red**: Error, disconnected, failed
- **Blue**: Information, neutral actions
- **Gray**: Inactive, disabled

## Development

### File Structure
```
app/admin/
├── layout.tsx          # Admin layout with navigation
├── page.tsx           # Redirect to dashboard
├── login/
│   └── page.tsx       # Login page
├── dashboard/
│   └── page.tsx       # Dashboard overview
├── companies/
│   └── page.tsx       # Company management
├── sequences/
│   └── page.tsx       # Project numbering
├── activity/
│   └── page.tsx       # Activity log
├── health/
│   └── page.tsx       # System health
├── components/        # Reusable components
│   ├── Loading.tsx
│   ├── Modal.tsx
│   ├── StatCard.tsx
│   └── StatusBadge.tsx
└── utils/             # Utilities
    ├── api.ts         # API client
    └── types.ts       # TypeScript types
```

### Key Technologies
- Next.js 15 with App Router
- React 19
- TypeScript
- TailwindCSS 4
- Headless UI
- Hero Icons
- React Hot Toast

## Security
- Password-protected access
- Session-based authentication
- Automatic logout on 401
- Secure cookie handling 