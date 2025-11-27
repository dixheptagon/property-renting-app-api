# Auto Order Reminder Feature

## Overview

The Auto Order Reminder feature automatically sends email reminders to guests 1 day before their scheduled check-in date. This helps improve check-in readiness and reduces no-shows by ensuring guests are reminded of their upcoming stay.

## Business Logic

- **Trigger**: Daily at 00:00 server time
- **Target Bookings**: Active bookings with `check_in_date = tomorrow` and `status` in `['confirmed', 'processing']`
- **Action**: Send personalized reminder email to each eligible guest
- **Content**: Check-in reminder with booking details, property information, and support contact

## Technical Implementation

### Scheduler

- **Library**: node-cron
- **Schedule**: `'0 0 * * *'` (daily at 00:00 server time)
- **Initialization**: Called during app startup in `src/app.ts`

### Components

#### AutoOrderReminderController

**File**: `src/routers/tenant-transactions/auto-order-reminder/auto.order.reminder.controller.ts`

- Sets up daily cron job at 00:00 server time
- Queries database for bookings with `check_in_date = tomorrow` and eligible status
- Sends reminder emails using `SendReminderService.sendBookingReminderEmail()`
- Handles errors gracefully (continues with other emails if one fails)
- Minimal logging (only errors)

#### 3. SendReminderService

**File**: `src/routers/tenant-transactions/auto-order-reminder/send.reminder.service.ts`

Contains `SendReminderService` class with `sendBookingReminderEmail(bookingId: number)` method that:

- Fetches booking with property and room details
- Formats dates and currency
- Sends email using `order.reminder.html` template
- Includes private `sendEmail` utility method for email sending

### Email Template

**File**: `src/lib/template/order.reminder.html`

**Subject**: `"Reminder: Your stay begins tomorrow - [Order ID]"`

**Content Includes**:

- Personalized greeting with guest name
- Check-in reminder message
- Booking details box with:
  - Booking ID
  - Property name
  - Room type
  - Check-in and check-out dates
- Call-to-action button linking to booking details
- Important notice with check-in time
- Footer with copyright

**Template Variables**:

- `fullname`: Guest's full name
- `uid`: Booking UID (e.g., BK0000000123)
- `property_name`: Property title
- `room_name`: Room name
- `check_in_date`: Formatted check-in date
- `check_out_date`: Formatted check-out date
- `total_price`: Formatted total price in IDR
- `booking_detail_url`: Link to view booking details
- `check_in_time`: Check-in time (currently hardcoded to "14:00")
- `current_year`: Current year for footer

## Database Query

```sql
SELECT * FROM booking
WHERE check_in_date = DATEADD(day, 1, GETDATE())
  AND status IN ('confirmed', 'processing')
```

**Note**: Uses Prisma ORM with date filtering for tomorrow's date.

## Validation & Error Handling

### Eligibility Criteria

- Booking status must be `confirmed` or `processing`
- Check-in date must be exactly tomorrow
- Skips cancelled or completed bookings automatically

### Error Handling

- Individual email failures don't stop the batch process
- Logs errors for monitoring and debugging
- Continues processing remaining bookings
- Cron job runs idempotently (safe to run multiple times)

### Logging

- Minimal logging to reduce noise
- Only error details for failed email sends
- No success logging to keep logs clean

## Dependencies

- **node-cron**: `^4.2.1` - For scheduling
- **nodemailer**: `^7.0.6` - For email sending
- **handlebars**: `^4.7.8` - For template rendering
- **@prisma/client**: `^6.16.2` - For database queries

## Configuration

### Email Settings

- From: `'Staysia <admin@gmail.com>'`
- Template: `order.reminder.html`
- Attachments: None (unlike confirmation emails)

### Scheduling

- Timezone: Server timezone (UTC)
- Frequency: Daily at 00:00
- No manual trigger endpoint (runs automatically)

## Testing

### Manual Testing

1. Create bookings with check-in dates set to tomorrow
2. Set booking status to `confirmed` or `processing`
3. Monitor console logs at 00:00 or trigger manually for testing
4. Verify email delivery and content

### Unit Testing Considerations

- Mock database queries
- Mock email service
- Test date calculations
- Test error scenarios

## Monitoring

### Logs to Monitor

- Error messages for failed email sends (minimal logging)
- Database connection issues
- Cron job scheduling errors

### Performance

- Database query should be efficient with proper indexing on `check_in_date` and `status`
- Email sending is asynchronous and batched
- No blocking operations in the cron job

## Future Enhancements

1. **Configurable Check-in Time**: Make check-in time dynamic based on property settings
2. **Multiple Reminder Times**: Support for H-2, H-3 reminders
3. **Guest Preferences**: Allow guests to opt-out of reminders
4. **Analytics**: Track reminder effectiveness on no-show rates
5. **Multi-language Support**: Localized email templates
6. **Customizable Templates**: Per-property email branding

## Implementation Notes

- Follows existing codebase patterns and architecture
- Uses dedicated `SendReminderService` for email functionality
- Integrated into app startup like other cron jobs
- No API endpoints (background job only)
- Error-resilient design with comprehensive logging
