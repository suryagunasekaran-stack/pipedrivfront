# Invoice Creation Page

This feature allows users to create invoices in Xero directly from Pipedrive deals.

## Overview

The invoice creation page (`/create-invoice-page`) is designed to be accessed via a redirect from Pipedrive. It validates the deal information, checks for existing quotes, and allows users to create an invoice with optional document attachments.

## URL Parameters

The page expects the following URL parameters:
- `dealId` (required): The Pipedrive deal ID
- `companyId` (required): The Pipedrive company ID
- `uiAction` (optional): Should be "createInvoice" when coming from Pipedrive

Example URL:
```
https://yourapp.com/create-invoice-page?dealId=123&companyId=456&uiAction=createInvoice
```

## Features

### 1. **Automatic Validation**
- Validates authentication status
- Checks if the deal exists
- Verifies a Xero quote exists for the deal
- Ensures no invoice has already been created

### 2. **Deal & Quote Information Display**
- Shows deal details (title, value, ID, status)
- Displays associated Xero quote information
- Clean, modern UI with card-based layout

### 3. **Document Upload**
- Optional file attachments (up to 5 files)
- Maximum 10MB per file
- Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, JPG, JPEG, PNG, GIF
- Real-time file validation and preview

### 4. **Success Handling**
- Beautiful success screen with invoice details
- Upload results summary
- Automatic redirect to Pipedrive after 5 seconds
- Manual redirect option

## User Flow

1. **Entry Point**: User clicks "Create Invoice" from Pipedrive deal view
2. **Authentication**: Automatic auth check and redirect if needed
3. **Validation**: System validates deal and quote information
4. **Form Display**: If valid, shows invoice creation form
5. **File Selection**: User can optionally attach documents
6. **Creation**: User clicks "Create Invoice" button
7. **Processing**: System creates invoice and uploads documents
8. **Success**: Shows success screen with results
9. **Redirect**: Automatically returns to Pipedrive deal

## Error Handling

The page handles various error scenarios:
- Missing URL parameters
- Authentication failures
- Deal not found
- Quote not found
- Invoice already exists
- File validation errors
- API failures

## Styling

The page uses:
- Tailwind CSS for styling
- Consistent with existing app design
- Animated transitions (fadeInUp, fadeInLeftToRight)
- Responsive layout
- Shadow effects for depth
- Color-coded status indicators

## API Integration

The page communicates with two backend endpoints:

### 1. Prepare Invoice Creation
```
POST /api/pipedrive/create-invoice
Body: { dealId, companyId }
```

### 2. Create Invoice with Documents
```
POST /api/xero/create-invoice-with-documents
Body: FormData with dealId, pipedriveCompanyId, and optional documents
```

See `api-payloads.json` for detailed API documentation.

## Components Used

- `SimpleLoader`: Loading state
- `ErrorDisplay`: Error handling
- `InvoiceCreationSuccess`: Success state
- `useAuth`: Authentication hook
- `useToast`: Toast notifications

## Development Notes

- The page is built with Next.js 13+ App Router
- Uses TypeScript for type safety
- Follows existing project patterns
- Includes proper error boundaries
- Handles edge cases gracefully 