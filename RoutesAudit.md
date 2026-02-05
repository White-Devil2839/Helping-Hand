# Backend Routes Audit (Final)

This document records the **final audit** of backend API routes for the **Helping Hand** system.

The goal of this audit is to ensure that:
- The backend API surface is intentional
- Core workflows are fully exercised by the client
- No endpoints exist accidentally or without clear purpose

---

## 1. Scope & Principles

This system is designed as a **task coordination platform**, not a free-form marketplace.

Core principles:
- All interaction is booking-driven
- Communication is contextual and auditable
- Admin actions are explicit and logged
- Unused or speculative endpoints are removed

---

## 2. Active Routes (Exercised by Mobile App)

### Authentication (`/api/auth`)
- `POST /request-otp` — Login initiation  
- `POST /verify-otp` — OTP verification and token issuance  
- `POST /refresh` — Access token refresh  

---

### User (`/api/users`)
- `GET /me` — Fetch current user profile  
- `PATCH /me` — Update user profile  

> There are no public user or helper listing endpoints.  
> User interaction is intentionally booking-scoped.

---

### Services (`/api/services`)
- `GET /services` — List available service categories  

Services are admin-managed and treated as task types, not helper offers.

---

### Bookings (`/api/bookings`)
- `POST /bookings` — Create booking (customer)  
- `GET /bookings` — List user bookings  
- `GET /bookings/available` — List available bookings (helper)  
- `GET /bookings/:id` — Booking detail  
- `PATCH /bookings/:id/accept` — Accept booking (helper)  
- `PATCH /bookings/:id/start` — Start work  
- `PATCH /bookings/:id/complete` — Mark completed  
- `PATCH /bookings/:id/close` — Close booking (customer)  
- `POST /bookings/:id/rate` — Rate completed booking  

Booking routes enforce a finite state machine with role-based transitions.

---

### Messages (`/api/messages`)
- `GET /messages/:bookingId` — Fetch booking messages  
- `POST /messages/:bookingId` — Send message  

All messaging is strictly booking-scoped.  
There is no direct user-to-user messaging.

---

### Admin (`/api/admin`)

#### User & Helper Management
- `GET /users` — List users  
- `PATCH /users/:id/activate` — Activate user  
- `PATCH /users/:id/deactivate` — Deactivate user  
- `GET /helpers/pending` — List helpers pending verification  
- `PATCH /helpers/:id/verify` — Verify helper  
- `PATCH /helpers/:id/unverify` — Unverify helper  

#### Booking Oversight
- `GET /bookings` — List all bookings  
- `PATCH /bookings/:id/cancel` — Cancel booking  
- `PATCH /bookings/:id/dispute` — Mark booking disputed  
- `PATCH /bookings/:id/force-close` — Force close booking  

#### Audit Log
- `GET /audit-log` — View admin action history  

Admin routes represent operational control, not analytics or automation.

---

## 3. Admin-Only Backend Capabilities (Not Surfaced in UI)

The following routes are intentionally implemented but not exposed in the mobile UI:

- `GET /api/admin/users/:id` — Deep user inspection  
- `POST /api/admin/services` — Create service category  
- `PATCH /api/admin/services/:id` — Update service category  

These exist to reflect realistic backend capabilities while keeping the demo UI focused on core workflows.

---

## 4. Removed Routes (Intentional)

The following routes were removed after final audit:

- `GET /api/users/helpers`  
- `GET /api/users/helpers/:id`  

Reason for removal:  
Helper discovery and communication are intentionally booking-driven.  
Allowing profile browsing or direct contact would weaken auditability and introduce non-contextual interactions.

---

## 5. Final Status

- All remaining routes are intentional  
- Core workflows are fully exercised  
- No speculative or accidental endpoints remain  
- Backend API surface is complete and locked  

This audit marks the system as finished and portfolio-ready.

---

## Why This File Exists

This document demonstrates:
- Ownership of API surface
- Architectural restraint
- Explicit trade-offs
- Completion discipline

Most projects stop at “it works.”  
This project stops at “it’s correct.”
