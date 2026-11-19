# SalonBook — Server

REST API for **SalonBook**, a role-based salon appointment booking platform. Customers browse salon services, request appointments, and pay for confirmed bookings through Stripe. Admins manage services, appointments, customers, and transactions.

## Important Features

- Better Auth authentication (email/password + JWT) with Google OAuth support
- JWT verification middleware with database-backed role and blocked-status checks on every protected API
- Role-based authorization (`admin` / `customer`) enforced on the server
- Public service browsing with active-only filtering
- Admin service CRUD + activate/deactivate
- Appointment requests with duplicate-slot and past-date protection
- Customer-only cancellation of their own pending appointments
- Admin appointment confirmation/cancellation
- Customer management: list, view, block, unblock
- Admin dashboard statistics API
- Stripe Checkout session creation and verified webhook handling
- Payment status is updated **only** after a verified Stripe webhook event
- Server-side image upload proxy to ImgBB (API key never exposed to the browser)
- Centralized JSON error handling and API 404 responses

## Technology Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- Better Auth (MongoDB adapter, JWT plugin)
- Stripe
- ImgBB
- JWT (`jose` + Better Auth JWKS)

## Project Structure

```
src/
├── config/          # MongoDB connection
├── controllers/     # Route handlers
├── lib/             # Better Auth and Stripe setup
├── middlewares/     # JWT + role verification
├── models/          # Mongoose models
├── routes/          # Express routers
├── app.js           # Express app, middleware, routes
└── server.js        # Server bootstrap
scripts/             # Seed / utility scripts
```

## Installation

```bash
git clone https://github.com/ayeshasiddika3288-ayesha/salonbook-server.git
cd salonbook-server
npm install
```

## How to Run the Project Locally

1. Create a `.env` file in the project root (see the variable names below).
2. Start MongoDB (or use a MongoDB Atlas connection string).
3. Start the development server:

```bash
npm run dev
```

The API runs on `http://localhost:5000` by default. Verify it with:

```bash
GET http://localhost:5000/api/health
```

For production:

```bash
npm start
```

### Seed sample services

```bash
node scripts/seed-services.js
```

### Create the first admin

Public registration always creates a `customer`. To create an admin, register normally and then set the role in the database:

```js
// MongoDB shell
db.user.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
);
```

Admin credentials for evaluation are provided in the assignment submission.

## Required Environment Variables (names only)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Allowed client origin(s), comma-separated |
| `MONGODB_URI` | MongoDB connection string |
| `BETTER_AUTH_URL` | Public base URL of this API |
| `BETTER_AUTH_SECRET` | Better Auth signing secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `IMGBB_API_KEY` | ImgBB image upload key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (for Google sign-in) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

> Never commit `.env` files or real secret values to GitHub. Only `.env.example` with placeholder values is committed.

## API Overview

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/services` | Public (active services) |
| `GET` | `/api/services/:id` | Public |
| `GET` | `/api/services/admin/all` | Admin |
| `POST` | `/api/services` | Admin |
| `PATCH` | `/api/services/:id` | Admin |
| `DELETE` | `/api/services/:id` | Admin |
| `POST` | `/api/appointments` | Customer |
| `GET` | `/api/appointments/my` | Customer |
| `PATCH` | `/api/appointments/:id/cancel` | Customer (owner) |
| `GET` | `/api/appointments` | Admin |
| `PATCH` | `/api/appointments/:id/status` | Admin |
| `GET` | `/api/appointments/:id` | Owner or Admin |
| `POST` | `/api/payments/create-checkout-session` | Customer |
| `GET` | `/api/payments/my-transactions` | Customer |
| `GET` | `/api/payments/transactions` | Admin |
| `POST` | `/api/payments/webhook` | Stripe (signature verified) |
| `GET` | `/api/users` | Admin |
| `GET` | `/api/users/:id` | Admin |
| `PATCH` | `/api/users/:id/block` | Admin |
| `PATCH` | `/api/users/:id/unblock` | Admin |
| `GET` | `/api/admin/stats` | Admin |
| `POST` | `/api/uploads` | Authenticated user |

## Stripe Webhook

In the Stripe dashboard (test mode), add an endpoint:

```
https://your-server-domain.com/api/payments/webhook
```

Subscribe to at least:

- `checkout.session.completed`
- `checkout.session.expired`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Live Website

- Client: _add your deployed client URL here_
- Server: _add your deployed server URL here_

## Repositories

- Client: https://github.com/ayeshasiddika3288-ayesha/salonbook-client
- Server: https://github.com/ayeshasiddika3288-ayesha/salonbook-server

## Deployment Notes

- Set `CLIENT_URL` to the deployed client URL (comma-separate multiple origins).
- Set `BETTER_AUTH_URL` to the deployed server URL.
- Configure the Stripe webhook for the production server URL.
- Make sure `NODE_ENV=production` is set on the host.
- `.env` is git-ignored and must be configured in the hosting dashboard.
