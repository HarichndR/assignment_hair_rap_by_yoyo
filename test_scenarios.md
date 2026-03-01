# API Test Scenarios

The following scenarios were tested to ensure the stability and correctness of the HairRapByYoyo API.

## Services
- [x] **Fetch Availability**: Verify that the system correctly calculates available time slots for a specific service and date.

## Staff
- [x] **List Staff**: Verify that all active staff members are correctly retrieved.
- [x] **Create Staff**: Verify that new staff members can be added with valid data (name, email, Indian phone format).

## Bookings
- [x] **Create Booking**: Verify that a booking can be successfully created when:
    - User, Service, and Staff exist.
    - Staff is assigned to the service.
    - Time is within both staff and salon operational hours.
    - No overlapping bookings exist.
- [x] **Validation**: Verify that invalid data (empty query, malformed IDs) returns a 400 error.

## Analytics
- [x] **Dashboard Summary**: Verify that the admin dashboard analytics data is correctly calculated and returned.

## AI Assistant
- [x] **Intent Detection**: Verify that the AI correctly identifies user intent (e.g., revenue, bookings, staff info).
- [x] **Error Handling**: Verify that the system handles missing API keys or quota issues gracefully.
