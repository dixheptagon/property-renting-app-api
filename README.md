# Property Renting App API

## Project Goal

This backend API handles the core logic for a property renting platform, including user authentication, payment processing, property management, booking systems, and scheduled background tasks to automate order reminders, completions, and cleanups.

## Tech Stack

- **Node.js**: Runtime environment
- **Express.js**: Web framework for building APIs
- **TypeScript**: Typed superset of JavaScript
- **Prisma**: ORM for database management
- **PostgreSQL**: Relational database
- **Cloudinary**: Cloud storage for images and files
- **Midtrans**: Payment gateway integration

## Local Setup Guide

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Set Up Environment Variables**:
   - Copy `.env.example` to `.env` and fill in the required values (see Environment Variables section below).

3. **Run Database Migrations**:

   ```bash
   npm run migrate:dev
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

The application will run on the port specified in your `.env` file (default: 2000).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=2000
NODE_ENV=development
LOCAL_DIRECT_URL=your_local_direct_url
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
DATABASE_URL=your_postgresql_database_url
SUPABASE_DIRECT_URL=your_supabase_direct_url
DOMAIN_URL=your_domain_url
ACTIVATION_ACCOUNT_URL=your_activation_account_url
NODEMAILER_APP_EMAIL=your_nodemailer_email
NODEMAILER_APP_PASSWORD=your_nodemailer_password
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
CLOUD_PAYMENT_PROOF_FOLDER_PATH=your_payment_proof_folder
CLOUD_TEMP_PROPERTIES_IMAGE_FOLDER_PATH=your_temp_properties_folder
CLOUD_TENANT_PROFILE_FOLDER_PATH=your_tenant_profile_folder
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

## Database Management

This project uses Prisma as the ORM with PostgreSQL.

- **Run Migrations** (for development):

  ```bash
  npm run migrate:dev
  ```

- **Generate Prisma Client** (after schema changes):

  ```bash
  npx prisma generate
  ```

- **View Database** (optional, requires Prisma Studio):
  ```bash
  npx prisma studio
  ```

## Cron Job Documentation

Scheduled background tasks are implemented using `node-cron` and must run as a separate service on Railway's Cron Job Service. These tasks include:

- Auto-cancel pending payments after 2 hours
- Send order reminders for upcoming check-ins
- Auto-complete orders after check-out
- Delete temporary images daily

**Important**: Do not run cron jobs in the main application process in production. Deploy them separately using Railway Cron Job Service with the following execution command:

```bash
node dist/src/cron/job.js
```

This ensures background tasks run independently without affecting the main API performance.

## Example API Endpoints

| Method | Endpoint                | Description             |
| ------ | ----------------------- | ----------------------- |
| POST   | `/auth/login`           | User login              |
| GET    | `/auth/tenant-profile`  | Get tenant profile      |
| POST   | `/booking/create-order` | Create a booking order  |
| GET    | `/booking/my-bookings`  | Get user's booking list |

## Deployment

The application is configured for deployment on Railway. Ensure all environment variables are set in your Railway project settings, and configure the separate Cron Job Service for background tasks as described above.
