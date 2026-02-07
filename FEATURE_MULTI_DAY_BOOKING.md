# Multi-Day Prasadam Booking Feature

## Overview
This feature enables users to book prasadam (meals) for multiple consecutive days with personal details and category classification.

## New User Form Fields

### Personal Information Section
- **Name**: User's full name (required)
- **Phone**: Contact number (required)
- **Temple/Department**: Location or department (required)

### Booking Period Section
- **From Date**: Start date of booking period (required)
- **To Date**: End date of booking period (required, min = from date)

### Prasadam Category Section
- **IOS (Individual)**: For individual requests
- **COMMUNITY**: For community/group requests

### Daily Meal Count (unchanged)
- Breakfast count (0-n)
- Lunch count (0-n)
- Dinner count (0-n)

## Dynamic Features

### Prasadam Schedule Display
- Automatically generates list of all days in the selected date range
- Shows morning (9:00 AM) and evening (4:30 PM) prasadam slots for each day
- Format: "YYYY-MM-DD - HH:MM Prasadam"
- Updates in real-time as user selects dates

### Cost Calculation
- **Per-day cost** = (breakfast + lunch) × morningRate + dinner × eveningRate
- **Total cost** = Per-day cost × Number of days
- Updates dynamically as dates and meal counts change

## Backend Implementation

### Database Schema (MealCount)
```javascript
{
  userPhone: String,
  userTemple: String,
  date: String,           // Individual day (YYYY-MM-DD)
  fromDate: String,       // Range start (YYYY-MM-DD)
  toDate: String,         // Range end (YYYY-MM-DD)
  category: Enum ['IOS', 'COMMUNITY'],
  // ... existing fields
}
```

### API Endpoint (POST /api/meals)
**Request Body**:
```json
{
  "name": "User Name",
  "userPhone": "9876543210",
  "userTemple": "Main Hall",
  "breakfast": 2,
  "lunch": 2,
  "dinner": 1,
  "category": "IOS",
  "fromDate": "2026-02-09",
  "toDate": "2026-02-11"
}
```

**Response**: Array of created meal records (one per day in range)
```json
[
  {
    "_id": "...",
    "date": "2026-02-09",
    "breakfast": 2,
    "lunch": 2,
    "dinner": 1,
    "billAmount": 150,
    ...
  },
  {
    "_id": "...",
    "date": "2026-02-10",
    "breakfast": 2,
    "lunch": 2,
    "dinner": 1,
    "billAmount": 150,
    ...
  },
  {
    "_id": "...",
    "date": "2026-02-11",
    "breakfast": 2,
    "lunch": 2,
    "dinner": 1,
    "billAmount": 150,
    ...
  }
]
```

### Multi-Day Processing
- Backend generates date range from fromDate to toDate
- Creates one MealCount record per day
- Skips if record already exists for that day
- All records share same meal counts and category
- Each record has individual date and can be edited/approved separately

### Billing Correction
- **Breakfast + Lunch** → 9:00 AM Prasadam Rate (morningRate)
- **Dinner** → 4:30 PM Prasadam Rate (eveningRate)

## Frontend Components

### UserDashboard Form Sections
1. **Personal Information** (3-column grid on desktop)
2. **Booking Period** (2-column date pickers)
3. **Prasadam Category** (Radio buttons)
4. **Daily Meal Count** (3-column meal inputs)
5. **Prasadam Schedule** (Green box showing generated dates, hidden until both dates selected)
6. **Cost Display** (Shows total calculated cost)

### Validation
- Required fields: name, phone, temple, fromDate, toDate
- Must select at least one meal type (breakfast, lunch, or dinner)
- fromDate and toDate both required
- toDate must be >= fromDate

### Form Reset
After successful submission, form clears all fields including:
- Personal information
- Date range
- Category selection
- Meal counts
- Date range display

## User Experience

1. User fills personal details (name, phone, temple)
2. User selects date range using date pickers
3. **Real-time Update**: Prasadam Schedule box appears showing all dates
4. User selects category (IOS or COMMUNITY)
5. User enters meal counts for each meal type
6. **Cost updates dynamically**: Total = daily cost × number of days
7. User submits the form
8. Backend creates individual records for each day
9. User can see all bookings in "Recent Requests" section
10. Each day's booking can be edited/approved separately

## Deployment Status
- ✅ Code committed to GitHub
- ✅ Ready for deployment to Render
- ✅ Frontend build successful
- ✅ Backend routes tested locally
- ✅ All new fields integrated

## Future Enhancements
- Bulk edit for multi-day bookings
- Category-specific pricing
- Advanced filters by category
- Booking templates for recurring patterns
