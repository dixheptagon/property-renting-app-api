# Explore Properties - Complete Implementation Documentation

## Project Overview

The `src/app/(explore-properties)` directory contains a comprehensive property exploration and listing system built with Next.js. This system provides advanced filtering, sorting, pagination, and search capabilities for property listings.

## Directory Structure

```
src/app/(explore-properties)/
├── explore-properties/
│   ├── layout.tsx                    # Route layout with navbar
│   ├── page.tsx                      # Main explore properties page
│   ├── propertyList.md              # This documentation
│   ├── _components/
│   │   ├── filtering.box.tsx        # Left sidebar with filters
│   │   ├── navbar.tsx               # Top navigation bar
│   │   ├── product.list.tsx         # Main product listing orchestrator
│   │   ├── filtering-box-component/
│   │   │   ├── limit.shows.tsx      # Items per page selector
│   │   │   ├── pagination.tsx       # Pagination controls
│   │   │   ├── select.amenities.tsx # Amenities multi-select filter
│   │   │   ├── select.category.tsx  # Property category filter
│   │   │   ├── select.rules.tsx     # Property rules multi-select filter
│   │   │   └── sort.by.tsx          # Sorting dropdown
│   │   ├── navbar-component/
│   │   │   ├── auth.button.tsx      # Authentication button
│   │   │   ├── logo.tsx             # Logo component
│   │   │   ├── search.bar.tsx       # Main search bar with location/date
│   │   │   ├── user.dropdown.tsx    # User menu dropdown
│   │   │   └── searchbar-component/
│   │   │       └── date.picker.tsx  # Date range picker
│   │   └── product-list-component/
│   │       └── propety.card.tsx     # Property card component
│   ├── _constant/
│   │   ├── property.amenities.ts    # Amenities data structure
│   │   └── propety.rules.tsx        # Property rules data structure
│   ├── _dummy-data/
│   │   └── properties.ts            # Mock property data
│   ├── _hooks/
│   │   └── use.property.list.tsx    # TanStack Query hook for API integration
│   ├── _types/
│   │   ├── index.ts                 # Central type exports
│   │   ├── property.ts              # Property-related type definitions
│   │   └── api.ts                   # API request/response types
│   └── _utils/
│       ├── format.date.ts           # Date formatting utilities
│       └── format.price.ts          # Price formatting utilities
```

## Core Features Implemented

### 1. Advanced Search & Filtering System

#### Search Bar (`search.bar.tsx`)

- **Location/Destination Input**: Text input for location search
- **Date Range Picker**: Check-in/check-out date selection
- **Category Filter**: Property type selection
- **URL Integration**: All search parameters managed via URL query strings

#### Filtering Sidebar (`filtering.box.tsx`)

- **Category Filter**: Single-select property categories
- **Amenities Filter**: Multi-select amenities with search
- **Rules Filter**: Multi-select property rules
- **Real-time Updates**: Filters update URL and trigger new searches

### 2. Product Listing System

#### Product List Orchestrator (`product.list.tsx`)

- **Sort Controls**: Dropdown for sorting options
- **Items Per Page**: Configurable display limits (12, 24, 48)
- **Pagination**: Full pagination with Previous/Next and page numbers
- **Result Counter**: Shows current range and total results

#### Sorting Options (`sort.by.tsx`)

- `updated_at` - Newest properties (default)
- `price_asc` - Lowest to highest price
- `price_desc` - Highest to lowest price
- `rating_desc` - Highest rated first

#### Pagination (`pagination.tsx`)

- Responsive pagination with ellipsis for large page counts
- Previous/Next navigation
- Direct page number clicking
- Proper disabled states

### 3. URL State Management

All application state is managed through URL query parameters for:

- **Shareable URLs**: Users can bookmark and share specific searches
- **Browser Navigation**: Back/forward buttons work correctly
- **Deep Linking**: Direct links to specific filtered results

**URL Parameters:**

- `location` - Search location query
- `checkin` - Check-in date (ISO format)
- `checkout` - Check-out date (ISO format)
- `category` - Property category
- `amenities` - Comma-separated amenities list
- `rules` - Comma-separated rules list
- `sortBy` - Sorting criteria
- `page` - Current page number
- `limit` - Items per page

### 4. UI/UX Features

#### Responsive Design

- Mobile-first approach with responsive breakpoints
- Adaptive layouts for different screen sizes
- Touch-friendly controls on mobile devices

#### Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management

#### Performance

- Client-side state management with URL persistence
- Optimized re-renders with proper React patterns
- Lazy loading considerations for large datasets

## Component Architecture

### State Management Pattern

```typescript
// URL-based state management
const searchParams = useSearchParams();
const router = useRouter();

// Read from URL
const currentPage = parseInt(searchParams.get('page') || '1');
const sortBy = searchParams.get('sortBy') || 'updated_at';

// Update URL
const updateParam = (key: string, value: string) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set(key, value);
  router.push(`/explore-properties?${params.toString()}`, { scroll: false });
};
```

### Component Communication

- **Props-based**: Parent components pass data down to children
- **URL-based**: Sibling components communicate through URL state
- **Callback props**: For imperative updates when needed

### Reusability

- Components use existing UI library (`@/components/ui`)
- Consistent styling and behavior patterns
- Modular architecture for easy maintenance

## Data Flow

1. **User Interaction** → Component updates local state
2. **URL Update** → Router pushes new URL with query parameters
3. **Page Re-render** → Components read new URL parameters
4. **API Call** → Backend receives updated parameters
5. **Data Update** → New results displayed to user

## Integration Points

### Existing Systems

- **Authentication**: User login/logout state
- **Navigation**: Consistent navbar across app
- **UI Components**: Shared design system
- **Utilities**: Date/price formatting functions

### API Integration

#### TanStack Query Hook (`usePropertyList`)

- **Location**: `src/app/(explore-properties)/explore-properties/_hooks/use.property.list.tsx`
- **Purpose**: Data fetching with caching, loading states, and error handling
- **Query Key**: Includes all URL parameters for proper cache invalidation
- **Caching**: 5-minute stale time, background refetching
- **Retry Logic**: 3 attempts with exponential backoff

#### API Endpoint Contract

```typescript
// Expected API Response Structure
interface PropertyListResponse {
  data: Property[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    applied: Record<string, any>;
    available: {
      categories: string[];
      amenities: Array<{ value: string; label: string; icon?: string }>;
      rules: Array<{ value: string; label: string; icon?: string }>;
    };
  };
}
```

#### Error Handling

- **Loading States**: Spinner with user-friendly messages
- **Error States**: Display API error messages with retry options
- **Empty States**: Helpful messages when no results found
- **Network Errors**: Automatic retry with user feedback

### Data Flow Architecture

1. **User Interaction** → Component updates URL parameters
2. **URL Change** → `usePropertyList` hook detects parameter changes
3. **Query Invalidated** → TanStack Query triggers new API call
4. **Data Fetched** → UI updates with loading/error/success states
5. **Cache Updated** → Future requests use cached data when appropriate

### Performance Optimizations

#### Frontend Caching

- **Query Caching**: Prevents duplicate API calls for same parameters
- **Background Updates**: Refetch stale data without blocking UI
- **Optimistic Updates**: Could be added for better perceived performance

#### Bundle Optimization

- **Code Splitting**: Components loaded on-demand
- **Tree Shaking**: Unused code removed during build
- **Image Optimization**: Property images lazy-loaded and optimized

### Testing Strategy

#### Unit Tests

- Component rendering and interactions
- URL parameter parsing and updates
- Hook behavior with different API responses
- Error state handling

#### Integration Tests

- Full user workflows (filter → search → paginate)
- API integration with mock responses
- URL state persistence across navigation

#### E2E Tests

- Complete user journeys
- Browser back/forward button functionality
- Mobile responsiveness
- Accessibility compliance

## Frontend Implementation Summary

### Components Created

#### 1. SortBy Component (`_components/filtering-box-component/sort.by.tsx`)

- **Purpose**: Dropdown menu for sorting property listings
- **Options**:
  - `updated_at` - Newest (default)
  - `price_asc` - Lowest Price
  - `price_desc` - Highest Price
  - `rating_desc` - Rating
- **URL Parameter**: `sortBy`
- **UI**: Uses existing Select components from `@/components/ui/select`

#### 2. LimitShows Component (`_components/filtering-box-component/limit.shows.tsx`)

- **Purpose**: Controls items per page display
- **Options**: 12, 24, 48 items per page
- **URL Parameter**: `limit`
- **Critical Behavior**: When limit changes, `page` parameter resets to `1`
- **UI**: Uses existing Select components

#### 3. PaginationComponent (`_components/filtering-box-component/pagination.tsx`)

- **Purpose**: Navigation controls for paginated results
- **Features**:
  - Previous/Next buttons
  - Clickable page numbers
  - Ellipsis for large page counts
  - Disabled states for first/last pages
- **URL Parameter**: `page`
- **Props**: `totalItemCount`, `limit`, `currentPage`
- **UI**: Uses existing Pagination components from `@/components/ui/pagination`

#### 4. ProductList Component (`_components/product.list.tsx`)

- **Purpose**: Main orchestrator component
- **Features**:
  - Reads URL parameters on initialization
  - Displays result count information
  - Combines SortBy, LimitShows, and PaginationComponent
  - Provides layout structure for product grid
- **Props**: `totalItemCount`, `children` (product grid content)

### URL Parameter Management

All state is managed through URL query parameters for shareable URLs and browser navigation support:

- `sortBy`: Sorting criteria
- `page`: Current page number (1-based)
- `limit`: Items per page
- `category`: Property category filter
- `amenities`: Comma-separated amenities filter
- `rules`: Comma-separated rules filter
- `location`: Search location
- `checkin`: Check-in date
- `checkout`: Check-out date

### Integration

Components are integrated into `page.tsx` with:

- FilteringBox in left sidebar (existing functionality)
- ProductList in main content area (new functionality)
- Mock product cards for demonstration

## Backend Implementation Requirements

### 1. API Endpoint Updates

#### GET `/api/properties` (or existing endpoint)

**Current Parameters** (if any):

- Add support for new query parameters

**New Required Parameters**:

- `sortBy` (string): Sorting criteria
  - Values: `updated_at`, `price_asc`, `price_desc`, `rating_desc`
  - Default: `updated_at`
- `page` (integer): Page number (1-based)
  - Default: 1
- `limit` (integer): Items per page
  - Values: 12, 24, 48
  - Default: 12
- `category` (string): Property category filter
- `amenities` (string): Comma-separated amenities (e.g., "wifi,parking,pool")
- `rules` (string): Comma-separated rules (e.g., "no_smoking,no_pets")
- `location` (string): Location search query
- `checkin` (string): Check-in date (ISO format)
- `checkout` (string): Check-out date (ISO format)

**Response Format**:

```json
{
  "data": [
    // Array of property objects
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 12,
    "totalPages": 13,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "applied": {
      "category": "apartment",
      "amenities": ["wifi", "parking"],
      "rules": ["no_smoking"],
      "location": "Tokyo",
      "checkin": "2024-01-15",
      "checkout": "2024-01-20"
    },
    "available": {
      "categories": ["apartment", "house", "hotel"],
      "amenities": ["wifi", "parking", "pool"],
      "rules": ["no_smoking", "no_pets"]
    }
  }
}
```

### 2. Error Handling

#### Validation

- Validate `page` > 0
- Validate `limit` in allowed values [12, 24, 48]
- Validate `sortBy` in allowed options
- Validate date formats for checkin/checkout
- Ensure checkin < checkout

#### Edge Cases

- No results found
- Invalid page numbers (redirect to page 1)
- Empty filter combinations
- Date range conflicts

### 3. Testing Requirements

#### Unit Tests

- Sorting logic for each option
- Filtering combinations
- Pagination calculations
- Parameter validation

#### Integration Tests

- Full API endpoint with various parameter combinations
- Database query performance
- Error response formats

#### E2E Tests

- Frontend integration with real API
- URL parameter persistence
- Browser navigation (back/forward)

This implementation provides a complete, scalable property listing system with advanced filtering, sorting, and pagination capabilities.
