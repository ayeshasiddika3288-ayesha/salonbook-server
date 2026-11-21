# SalonBook — Server

REST API for **SalonBook**, a role-based salon appointment booking platform. Customers browse salon services, request appointments, and pay for confirmed bookings through Stripe. Admins manage services, appointments, customers, and transactions.

## Important Features

- Better Auth authentication (email/password + JWT) with optional Google OAuth support
- Server-enforced password rule: at least 6 characters with one uppercase and one lowercase letter (sign up, change password, reset password)
- `phone` profile field stored in MongoDB and returned with the user/session
- JWT verification middleware with database-backed role and blocked-status checks on every protected API
- Role-based authorization (`admin` / `customer`) enforced on the server
- Blocked customers receive `403` immediately, even with an unexpired token
- Public service browsing with active-only filtering
- Admin service CRUD + activate/deactivate
- Appointment requests with duplicate-slot and past-date protection
- Appointment state machine: `pending → confirmed`, `pending`/`confirmed → cancelled`
  - Customers may cancel only their own `pending` appointments
  - Admins may confirm only `pending` appointments; repeated confirms return `400`
- Appointments populate the service and customer (`name`, `email`, `image`, `phone`) for both dashboards
- Customer management: list, view, block, unblock
- Admin dashboard statistics API (customer/service/appointment counts + successful payments)
- Stripe Checkout session creation and verified webhook handling
- Transaction statuses are `paid` / `failed`; a transaction starts as `failed` and flips to `paid` only after the verified `checkout.session.completed` webhook
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

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@salonbook.com` | `AdminSalon1` |
| Customer | `customer.test@example.com` | `Customer123` |

> Public registration always creates a `customer`. Change the demo admin password before sharing a public deployment.

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

The webhook verifies the signature, matches the stored transaction by session ID, appointment and customer, checks the amount and currency, then marks both the appointment (`paymentStatus: "paid"`) and the transaction (`status: "paid"`). Duplicate deliveries are safe because the appointment update is conditional.

## Live Website

- Client: https://salonbook-client-six.vercel.app
- Server: https://salonbook-server-gules.vercel.app
- Health check: https://salonbook-server-gules.vercel.app/api/health

## Repositories

- Client: https://github.com/ayeshasiddika3288-ayesha/salonbook-client
- Server: https://github.com/ayeshasiddika3288-ayesha/salonbook-server

## Deployment Notes

This API is deployed on Vercel as its own project using the **Express** backend preset: `src/app.js` exports the Express app and both database clients are cached on `globalThis`, so serverless invocations reuse the connections.

Vercel project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Express |
| Root directory | repository root |
| Build command | `npm install` |
| Runtime | Node.js 20+ / 22.x |

Any Node host (Render, Railway, Fly.io) also works with `npm start`.

Then configure the environment variables:

- `CLIENT_URL` → the deployed client URL (comma-separate preview/alternate domains; whitespace and trailing slashes are trimmed)
- `BETTER_AUTH_URL` → the public URL of this API (must match exactly, including `https://`)
- `MONGODB_URI`, `BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `IMGBB_API_KEY`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` only if Google sign-in is required

Finally:

- Register the production Stripe webhook for `https://<server-domain>/api/payments/webhook`.
- Add `https://<server-domain>/api/auth/callback/google` to the Google OAuth authorized redirect URIs.
- Keep `.env` in the host dashboard — it is git-ignored and must never be committed.

> Because the client and API are on different `vercel.app` sub-domains, the session cookie is cross-site: it is issued as `__Secure-better-auth.session_token; SameSite=None; Secure`. Chrome, Edge and Firefox accept it; Safari's third-party cookie blocking can prevent sign-in on the live demo.
