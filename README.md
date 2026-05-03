# Aurum Hotel OS

A production-ready luxury hotel operating system and guest booking portal built with Next.js 16 (App Router), Supabase, tRPC, and Stripe.

## Architecture Highlights
- **Frontend**: Next.js App Router, Tailwind CSS, Headless UI components.
- **Backend**: tRPC + React Query for end-to-end type safety.
- **Database**: Supabase (PostgreSQL) with advanced Exclusion Constraints to guarantee zero double-bookings mathematically.
- **State Management**: Zustand with `sessionStorage` persistence for the 4-step booking wizard.
- **Concurrency**: Upstash Redis implemented for TTL "soft-locking", holding inventory for 15 minutes during checkout.
- **Payments & Emails**: Live Stripe Elements integration and Resend HTML transactional receipts.

---

## 🚀 Quick Start Guide

### 1. Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the required keys. The application **will crash** at runtime if valid keys for Supabase and Upstash Redis are missing.

### 2. Database Setup (Supabase)
Ensure Docker is running on your machine.
```bash
# Start local Supabase instance
npx supabase start

# Apply all migrations to build the schema
npx supabase db reset
```

### 3. Redis Setup
Create a free Redis database at [Upstash](https://console.upstash.com/).
Grab the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` and place them in `.env.local`.

### 4. Running the Application
Once the database is running and environment variables are set:
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit `http://localhost:3000` to view the Guest Portal.
Visit `http://localhost:3000/admin` to view the Staff/Admin Portal.

---

## Testing & Validation
The project is strictly typed and linted.
```bash
# Run TypeScript validation
npx tsc --noEmit

# Run ESLint
npx eslint src/ app/ --ext .ts,.tsx --max-warnings 0

# Create a production build
npm run build
```

## Security & Access Control
- **Guests**: Use passwordless Magic Links via Supabase Auth (`/signin`).
- **Staff**: To access the `/admin` portal, a user's `auth.users.id` must be present in the `staff` table. Use the Supabase dashboard to link an authenticated user to a `super_admin` role in the `staff` table.
