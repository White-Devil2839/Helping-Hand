# Helping Hand

**Trust-Based Task Coordination Platform**

A portfolio-grade full-stack project demonstrating role-based access control, state-machine workflows, admin arbitration, and real-time communication.

---

## Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run seed      # Create test users and services
npm run dev       # Start server on :5000

# Mobile (new terminal)
cd mobile
npm install
npm start         # Expo dev server
```

### Test Accounts (OTP: `123456`)

| Role | Phone | Access |
|------|-------|--------|
| Admin | +1234567890 | Full system access, helper verification, booking oversight |
| Customer | +1234567891 | Create bookings, close, rate helpers |
| Helper (verified) | +1234567892 | Accept, start, complete bookings |
| Helper (pending) | +1234567893 | Cannot accept bookings until verified |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Customer   │  │   Helper    │  │       Admin         │  │
│  │    Stack    │  │    Stack    │  │       Stack         │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         └────────────────┼────────────────────┘              │
│                          ▼                                   │
│               ┌──────────────────┐                          │
│               │   AuthContext    │                          │
│               │  + API Service   │                          │
│               │  + Socket Client │                          │
│               └────────┬─────────┘                          │
└────────────────────────┼────────────────────────────────────┘
                         │ JWT + Socket.IO
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express Backend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │   Auth   │  │ Bookings │  │ Messages │  │   Admin    │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │   Routes   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       └─────────────┼─────────────┼──────────────┘          │
│                     ▼                                        │
│         ┌───────────────────────┐                           │
│         │     Middleware        │                           │
│         │ auth → role → validate│                           │
│         └───────────┬───────────┘                           │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   MongoDB                             │   │
│  │  User │ Service │ Booking │ Message │ AdminAction    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Booking State Machine

```
                    ┌──────────────┐
                    │   REQUESTED  │ ← Customer creates
                    └───────┬──────┘
                            │ Helper accepts
                            ▼
                    ┌──────────────┐
                    │   ACCEPTED   │
                    └───────┬──────┘
                            │ Helper starts work
                            ▼
                    ┌──────────────┐
                    │  IN_PROGRESS │
                    └───────┬──────┘
                            │ Helper completes
                            ▼
                    ┌──────────────┐
                    │  COMPLETED   │
                    └───────┬──────┘
                            │ Customer closes
                            ▼
                    ┌──────────────┐
                    │    CLOSED    │ ← Terminal
                    └──────────────┘

  ═══════════════════════════════════════════
           ADMIN OVERRIDE STATES
  ═══════════════════════════════════════════
  
  Any state ──────► CANCELLED    (Admin only)
  Any state ──────► DISPUTED     (Admin only)
  Any state ──────► FORCE_CLOSED (Admin only)
```

### State Transition Rules

| From | To | Allowed By |
|------|-----|------------|
| REQUESTED | ACCEPTED | Helper |
| ACCEPTED | IN_PROGRESS | Helper (assigned) |
| IN_PROGRESS | COMPLETED | Helper (assigned) |
| COMPLETED | CLOSED | Customer |
| Any | CANCELLED | Admin |
| Any | DISPUTED | Admin |
| Any | FORCE_CLOSED | Admin |

---

## Role Permissions

| Action | Customer | Helper | Admin |
|--------|:--------:|:------:|:-----:|
| Create booking | ✓ | | |
| View own bookings | ✓ | ✓ | |
| Accept booking | | ✓* | |
| Start/Complete booking | | ✓* | |
| Close booking | ✓ | | |
| Rate helper | ✓ | | |
| View available bookings | | ✓* | |
| Chat in booking | ✓ | ✓ | ✓ |
| View all users | | | ✓ |
| Verify/unverify helpers | | | ✓ |
| Cancel any booking | | | ✓ |
| Dispute any booking | | | ✓ |
| Force close booking | | | ✓ |
| View audit log | | | ✓ |

\* Requires verified helper status

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/request-otp` | Request OTP (mocked) |
| POST | `/api/auth/verify-otp` | Verify OTP, get tokens |
| POST | `/api/auth/refresh` | Refresh access token |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | List my bookings |
| GET | `/api/bookings/available` | List available (helper) |
| GET | `/api/bookings/:id` | Get booking details |
| PATCH | `/api/bookings/:id/accept` | Accept (helper) |
| PATCH | `/api/bookings/:id/start` | Start work |
| PATCH | `/api/bookings/:id/complete` | Mark complete |
| PATCH | `/api/bookings/:id/close` | Close (customer) |
| POST | `/api/bookings/:id/rate` | Rate helper |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/helpers/:id/verify` | Verify helper |
| PATCH | `/api/admin/bookings/:id/cancel` | Cancel booking |
| PATCH | `/api/admin/bookings/:id/dispute` | Mark disputed |
| PATCH | `/api/admin/bookings/:id/force-close` | Force close |
| GET | `/api/admin/audit-log` | View audit log |

---

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `booking:join` | `{ bookingId }` | Join booking chat room |
| `booking:leave` | `{ bookingId }` | Leave room |
| `message:send` | `{ bookingId, content }` | Send message |
| `message:read` | `{ bookingId, messageIds }` | Mark as read |
| `booking:typing` | `{ bookingId, isTyping }` | Typing indicator |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | Message object | New message in room |
| `booking:status-changed` | `{ bookingId, status }` | State transition |
| `booking:user-typing` | `{ userId, userName, isTyping }` | Typing update |
| `message:read-receipt` | `{ messageIds, readBy }` | Read confirmation |

---

## Project Structure

```
backend/
├── src/
│   ├── config/          # db.js, constants.js
│   ├── controllers/     # Business logic
│   ├── middleware/      # auth, authorize, validate, error
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── socket/          # Socket.IO handlers
│   ├── utils/           # jwt, auditLogger, validators
│   ├── seed/            # Test data
│   └── app.js           # Entry point

mobile/
├── src/
│   ├── config/          # API URLs, constants, colors
│   ├── context/         # AuthContext
│   ├── hooks/           # useApi, useSocket, useAdmin
│   ├── navigation/      # Role-based stacks
│   ├── screens/
│   │   ├── auth/        # Login, OTP, Register
│   │   ├── customer/    # Home, Bookings, Chat
│   │   ├── helper/      # Dashboard, Available, Jobs
│   │   └── admin/       # Dashboard, Helpers, Oversight
│   └── services/        # API client, Socket client
└── App.js
```

---

## Design Decisions & Trade-offs

### Embedded State History
Status transitions are stored as `statusHistory[]` within the Booking document rather than a separate collection. This simplifies queries but limits historical analysis at scale.

### Single Mobile App
All three interfaces (Customer, Helper, Admin) are consolidated into one React Native app with role-based navigation. A production system might separate admin into a web dashboard.

### Mocked OTP
Authentication uses a hardcoded OTP (`123456`) for development. Production would integrate Twilio/AWS SNS.

### No Redis
Session state is JWT-based. Socket.IO uses in-memory adapter. For horizontal scaling, Redis adapter would be needed.

### Embedded Helper Profile
Helper-specific fields (`bio`, `rating`, `isVerified`) are embedded in the User model rather than a separate collection.

---

## Production Considerations

| Area | Current | Production |
|------|---------|------------|
| OTP | Mocked (123456) | Twilio/AWS SNS |
| Tokens | In-memory | Redis session store |
| Socket | Single server | Redis adapter |
| Files | None | S3/Cloudinary |
| Payments | None | Stripe Connect |
| Notifications | None | FCM/APNs |
| Admin | Mobile | Web dashboard |

---

## License

Portfolio project — not for production use without proper authentication and infrastructure.
