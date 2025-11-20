# Database Seeding Documentation

This document explains the modular seeding setup for the Property Renting App API database using Prisma ORM and PostgreSQL.

## Overview

The seeding system is designed to populate the database with realistic test data for development and testing purposes. It uses JSON files stored in `prisma/seed-data/` to define the seed data, and a TypeScript script `prisma/seed.ts` to load and insert the data into the database.

## File Structure

```
prisma/
├── seed.ts                 # Main seeding script
└── seed-data/
    ├── user.json           # User data (guests and tenants)
    ├── tenant_profile.json # Tenant profile data
    ├── property.json       # Property data
    ├── room.json           # Room data
    ├── booking.json        # Booking data
    ├── room_unavailability.json # Room unavailability data
    ├── peak_season_rate.json    # Peak season rate data
    ├── review.json         # Review data
    └── wishlist.json       # Wishlist data
```

## Data Flow

1. **Users**: Created first. Passwords are hashed using bcrypt before insertion.
2. **Tenant Profiles**: Created for tenant users, linked by `tenant_uid`.
3. **Properties**: Created for tenants, linked by `tenant_uid`.
4. **Rooms**: Created for properties, linked by `property_uid`.
5. **Bookings**: Created for users, rooms, and properties, linked by respective UIDs.
6. **Room Unavailabilities**: Created for properties and rooms.
7. **Peak Season Rates**: Created for properties (and optionally rooms).
8. **Reviews**: Created for bookings, users, and properties.
9. **Wishlists**: Created for users and properties.

## Seed Data Details

### Users (10 total)

- 5 Guests: Role `guest`, password `"guest123"` (hashed)
- 5 Tenants: Role `tenant`, password `"tenant123"` (hashed)
- All users have unique UIDs, emails, and basic profile information.

### Tenant Profiles (5)

- One for each tenant user
- Includes contact info, government ID details, address, and verification status.

### Properties (15)

- 3 properties per tenant
- Various categories: house, apartment, villa, hotel, room
- Realistic addresses in Indonesian cities
- Base prices ranging from 80,000 to 320,000 IDR

### Rooms (30)

- 2 rooms per property
- Different room types with varying capacities and prices
- Highlights and amenities defined

### Bookings (2)

- Completed bookings by guest users
- Different rooms and properties
- Past dates with payment details

### Room Unavailabilities (1)

- One unavailability entry for maintenance

### Peak Season Rates (1)

- One peak season rate for holiday period (20% increase)

### Reviews (2)

- One review per booking
- Ratings and comments

### Wishlists (3)

- Sample wishlists for guests

## Running the Seeder

To run the seeding script:

```bash
npx prisma db seed
```

This command executes `prisma/seed.ts` using the configuration in `package.json`.

## Configuration

Ensure your `package.json` has the following in the `"prisma"` section:

```json
{
  "prisma": {
    "seed": "npx ts-node prisma/seed.ts"
  }
}
```

## Dependencies

The seeding script requires:

- `@prisma/client`
- `bcrypt` (for password hashing)
- `fs` (Node.js built-in for file reading)

## Error Handling

The seeding script includes:

- Try-catch blocks for error handling
- Console logging for created records
- Proper disconnection of Prisma client in `finally` block
- Process exit on errors

## Modularity

The seeding is modular:

- Each entity is seeded in a separate section
- Maps are used to store created IDs for linking
- JSON files can be easily modified to add more data
- UIDs are used for cross-references instead of IDs

## Testing

After seeding, you can verify the data:

- Check console output for created record IDs
- Query the database using Prisma Studio: `npx prisma studio`
- Use the API endpoints to retrieve seeded data

## Notes

- All monetary values are in IDR (Indonesian Rupiah)
- Dates are in ISO format
- Passwords are hashed with bcrypt (salt rounds: 10)
- Relational integrity is maintained through proper ordering and ID mapping
- The script is idempotent but designed for initial seeding; running multiple times may create duplicates
