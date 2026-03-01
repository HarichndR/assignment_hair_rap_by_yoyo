# Core Flow Diagram: Booking Creation

This diagram illustrates the end-to-end flow of a user booking an appointment, highlighting the interaction between the frontend, availability logic, and data persistence.

## Flowchart

```mermaid
sequenceDiagram
    participant User
    participant App as Frontend App
    participant API as Backend API
    participant SS as SlotService
    participant DB as Database

    User->>App: Selects Service & Date
    App->>API: GET /api/slots?date=...&staffId=...
    API->>SS: getAvailableSlots(date, staffId)
    SS->>DB: Fetch WorkingHours & Existing Bookings
    DB-->>SS: Staff Info & Current Schedule
    SS-->>API: List of [StartTime, EndTime] Slots
    API-->>App: Display Available Times
    
    User->>App: Chooses 14:00 - 15:00
    App->>API: POST /api/bookings {serviceId, slot...}
    API->>DB: Check for double-booking (Atomic Index)
    alt Success
        API->>DB: Save Booking
        DB-->>API: Booking Object
        API-->>App: 201 Created (Success)
        App-->>User: Show Confirmation & Add to Calendar
    else Conflict
        API-->>App: 400 Bad Request (Conflict)
        App-->>User: "Slot already taken"
    end
```

## Key Step Explanations

### 1. Dynamic Availability Check
Unlike static slot systems, BookEase calculates availability on the fly. The **SlotService** looks at the staff member's defined working hours for that specific day and subtracts any existing bookings to present a clean list of free time.

### 2. Conflict Prevention
The system uses a **Compound Unique Index** in MongoDB on `{ staffId, date, startTime }` to ensure that even if two users click "Book" at the exact same millisecond, the database handles the race condition and only allows one to succeed.

### 3. Service Duration Matching
When a user selects a service, the slots shown are filtered to ensure they are long enough to accommodate the service's `duration` (e.g., a 60-min haircut needs a 60-min gap).

## Tags
 #UserFlow #BookingLifecycle #AtomicOperations #AvailabilityLogic
