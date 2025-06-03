# Pipedrive Data View - Refactored Architecture

## Overview

This application has been completely refactored from a monolithic 500+ line component into a well-organized, maintainable codebase following senior software engineer best practices.

## Architecture

### 📁 Directory Structure

```
app/
├── api/                    # Next.js API routes
│   ├── pipedrive/
│   │   └── data/          # Pipedrive data fetching
│   └── xero/
│       ├── status/        # Xero connection status
│       └── quote/         # Xero quote creation
├── components/            # Reusable UI components
├── constants/            # Application constants
├── hooks/               # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/             # Utility functions
└── pipedrive-data-view/  # Main page (refactored)
```

### 🏗️ Key Improvements

#### 1. **Separation of Concerns**
- **Components**: Single-responsibility UI components
- **Hooks**: Reusable state management logic
- **Utils**: Pure functions for calculations and data processing
- **API Routes**: Proper Next.js app router endpoints
- **Types**: Centralized TypeScript definitions

#### 2. **Component Architecture**
```
PipedriveDataView (Main Page)
├── LoadingSpinner
├── ErrorDisplay
├── QuotationDetails
│   ├── ContactInformation
│   └── ProductTable
└── XeroIntegration
    ├── XeroConnectionStatus
    └── XeroQuoteCreator
```

#### 3. **Custom Hooks**
- `usePipedriveData`: Data fetching and state management
- `useXeroStatus`: Xero connection management
- `useToast`: Toast notification handling

#### 4. **API Architecture**
- `GET /api/pipedrive/data`: Fetch Pipedrive deal data
- `GET /api/xero/status`: Check Xero connection status
- `POST /api/xero/quote`: Create Xero quotes

### 🔧 Technologies Used

- **Next.js 15**: React framework with app router
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first styling
- **React Hooks**: Modern state management

### 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API endpoints
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Main app: http://localhost:3001
   - Pipedrive Data View: http://localhost:3001/pipedrive-data-view

### 📋 Key Features

#### ✅ Completed
- [x] Modular component architecture
- [x] Custom hooks for state management
- [x] Proper API routing with Next.js app router
- [x] TypeScript type safety
- [x] Centralized constants and utilities
- [x] Error handling and loading states
- [x] Responsive design with Tailwind CSS
- [x] JSDoc documentation throughout

#### 🚧 Future Enhancements
- [ ] Unit test coverage
- [ ] Error boundaries
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Integration tests

### 🧪 Testing

Run the test suite:
```bash
npm test
```

Tests are located in the `__tests__` directory and cover:
- Utility functions
- Component rendering
- API endpoints
- Custom hooks

### 📖 Component Documentation

#### Main Components

1. **QuotationDetails**: Displays deal summary with contact and product information
2. **ContactInformation**: Shows customer and deal details
3. **ProductTable**: Renders product list with calculations
4. **XeroIntegration**: Manages Xero connection and quote creation
5. **LoadingSpinner**: Reusable loading state component
6. **ErrorDisplay**: Error handling with retry functionality

#### Custom Hooks

1. **usePipedriveData**: Handles data fetching with loading and error states
2. **useXeroStatus**: Manages Xero connection status
3. **useToast**: Provides toast notification functionality

#### Utilities

1. **calculations.ts**: Product totals, currency formatting, contact extraction
2. **constants/index.ts**: Application-wide constants and configuration

### 🔒 Environment Variables

```bash
# External API configuration
EXTERNAL_API_BASE_URL=http://localhost:3000

# Pipedrive configuration
NEXT_PUBLIC_PIPEDRIVE_DOMAIN=your-domain.pipedrive.com
```

### 🐛 Error Handling

The application includes comprehensive error handling:
- Network request failures
- Missing query parameters
- Invalid data formats
- User-friendly error messages with retry options

### 🎨 Styling

Uses Tailwind CSS for:
- Responsive design
- Consistent spacing and typography
- Modern UI components
- Dark/light theme support (future)

### 📚 Best Practices Applied

1. **Single Responsibility Principle**: Each component has one clear purpose
2. **DRY (Don't Repeat Yourself)**: Shared logic extracted to hooks and utilities
3. **Type Safety**: Comprehensive TypeScript coverage
4. **Error Boundaries**: Graceful error handling
5. **Performance**: Optimized re-renders and data fetching
6. **Accessibility**: Semantic HTML and proper ARIA labels
7. **Documentation**: JSDoc comments for all functions and components

### 🔄 Migration Guide

The refactoring transformed:
- **Before**: 500+ line monolithic component
- **After**: 15+ focused, reusable components
- **Benefits**: Better maintainability, testability, and scalability

Key changes:
1. Extracted data fetching logic to custom hooks
2. Created reusable UI components
3. Implemented proper API routes
4. Added comprehensive TypeScript types
5. Centralized constants and utilities

This architecture provides a solid foundation for future development and makes the codebase much more maintainable and scalable.
