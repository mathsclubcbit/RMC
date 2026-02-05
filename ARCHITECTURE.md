# RMC Architecture Guide

This document provides an overview of the project structure and organization for the RMC (Ramanujan Mathematics Club) website.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **Tailwind CSS 4** | Styling |
| **Supabase** | Database & Authentication |
| **Google APIs** | Sheets & Drive integration |
| **Framer Motion** | Animations |
| **Three.js** | 3D graphics |

---

## Directory Structure

```
d:\RMC\main\
├── src/                    # Source code
│   ├── app/                # Next.js App Router (pages & API)
│   ├── components/         # React components
│   ├── context/            # React Context providers
│   ├── constants/          # Application constants
│   ├── data/               # Static data files
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── services/           # Service layer (API clients)
│   └── types/              # Type definitions (JSDoc)
├── public/                 # Static assets
├── supabase/               # Database schemas & migrations
├── scripts/                # Utility scripts
└── middleware.js           # Next.js middleware
```

---

## `/src/app` - Pages & API Routes

Next.js App Router structure:

```
app/
├── page.jsx                # Homepage
├── layout.jsx              # Root layout
├── globals.css             # Global styles
├── about/                  # About page
├── events/                 # Events listing
├── gallery/                # Photo gallery
├── contact/                # Contact page
├── register/               # Event registration
├── hub/                    # LinkTree-style links page
├── admin/                  # Admin dashboard
│   ├── login/              # Admin login
│   ├── events/             # Event management
│   ├── gallery/            # Gallery management
│   ├── newsletter/         # Newsletter management
│   └── scan/               # Ticket scanning
├── coordinator/            # Event coordinator portal
├── network/                # Internal network (members)
└── api/                    # API routes
    ├── events/             # Events CRUD
    ├── register/           # Registration endpoint
    ├── admin/              # Admin auth & actions
    ├── coordinator/        # Coordinator auth & actions
    ├── hub/                # Hub management
    ├── newsletter/         # Newsletter endpoints
    └── notifications/      # Push notifications
```

---

## `/src/components` - React Components

Organized by feature area:

```
components/
├── ui/                     # Reusable UI primitives
│   ├── MathBackground.jsx  # Animated math symbols
│   ├── MathLoading.jsx     # Loading spinner
│   ├── EventCard.jsx       # Event display card
│   ├── Timeline.jsx        # Timeline component
│   └── ...
├── layout/                 # Page structure
│   ├── Header.jsx          # Site header/nav
│   ├── Footer.jsx          # Site footer
│   └── ConditionalShell.jsx
├── home/                   # Homepage sections
│   ├── SpotlightHero.jsx   # Hero section
│   ├── HomeEventsSection.jsx
│   └── ...
├── events/                 # Event-related components
│   ├── RegistrationClient.jsx
│   ├── EventsClient.jsx
│   └── ...
├── about/                  # About page components
├── gallery/                # Gallery components
├── team/                   # Team display
├── network/                # Internal network UI
├── newsletter/             # Newsletter signup
└── notifications/          # Push notification manager
```

---

## `/src/lib` - Utility Libraries

Core utilities and external service integrations:

| File | Purpose |
|------|---------|
| `utils.js` | Common helpers (cn, formatDate, formatCurrency, etc.) |
| `supabase/client.js` | Supabase browser client |
| `supabase/server.js` | Supabase server client |
| `google.ts` | Google Sheets & Drive API |
| `email.ts` | Nodemailer email sending |
| `qrcode.ts` | QR code generation |
| `jwt.js` | JWT token utilities |
| `rate-limiter.ts` | API rate limiting |
| `cloudinary.js` | Image CDN integration |

---

## `/src/hooks` - Custom React Hooks

Reusable React hooks:

| Hook | Purpose |
|------|---------|
| `useMediaQuery` | Detect viewport breakpoints |
| `useIsMobile` | Check if mobile viewport |
| `useLocalStorage` | Persist state to localStorage |
| `useDebounce` | Debounce rapidly changing values |

**Usage:**
```javascript
import { useIsMobile, useDebounce } from '@/hooks';

function MyComponent() {
    const isMobile = useIsMobile();
    const debouncedSearch = useDebounce(searchTerm, 300);
}
```

---

## `/src/constants` - Application Constants

Centralized configuration:

| File | Contents |
|------|----------|
| `routes.js` | Route path constants |
| `api.js` | API endpoint constants |
| `config.js` | Site config, limits, breakpoints |

**Usage:**
```javascript
import { ROUTES, API_ENDPOINTS, SITE_CONFIG } from '@/constants';

router.push(ROUTES.ADMIN_EVENTS);
fetch(API_ENDPOINTS.EVENTS);
```

---

## `/src/services` - Service Layer

API client abstractions:

| Service | Purpose |
|---------|---------|
| `api.js` | Base HTTP client with error handling |
| `events.js` | Event-specific API calls |

**Usage:**
```javascript
import { eventService } from '@/services';

const { success, data, error } = await eventService.getUpcoming();
```

---

## `/src/types` - Type Definitions

JSDoc type definitions for IDE autocomplete:

| File | Types |
|------|-------|
| `events.js` | Event, EventRegistration, EventFilters |
| `api.js` | ApiResponse, PaginatedResponse |
| `user.js` | AdminUser, Coordinator, AuthState |

---

## `/supabase` - Database

```
supabase/
├── schema.sql              # Main database schema
├── README.md               # Migration documentation
└── migrations/             # Feature-specific migrations
    ├── 001_gallery_setup.sql
    ├── 002_gallery_events.sql
    ├── 003_newsletter.sql
    ├── 004_notifications.sql
    ├── 005_resources.sql
    ├── 006_task_workflow.sql
    └── 007_team_setup.sql
```

---

## Authentication

### Admin Authentication
- JWT-based with cookie storage
- 2FA support via TOTP
- Protected by middleware

### Network (Member) Authentication
- Supabase Auth with email/password
- Session stored in cookies

### Coordinator Authentication
- Event-specific credentials
- JWT tokens with event scope

---

## Import Aliases

Configured in `tsconfig.json`:

```javascript
// Instead of relative paths
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks';
import { ROUTES } from '@/constants';
import { eventService } from '@/services';
```

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

---

## Environment Variables

See `.env.local` for required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_*`
- `EMAIL_*` (SMTP configuration)
