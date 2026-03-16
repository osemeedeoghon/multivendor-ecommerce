# Multi-Vendor E-Commerce Platform

A production-grade microservices platform built with Node.js, Express, MongoDB, RabbitMQ, WebSocket and Docker.

## Architecture Overview
```
Client Applications
        │
        ▼
API Gateway (port 3000)
JWT validation · Rate limiting · Request routing
        │
        ├──────────────────────────────────────────────┐
        │                                              │
        ▼                                              ▼
Seller-Facing Services              Buyer-Facing Services
(Teal Tier)                         (Purple Tier)
├── Seller Service (3002)           ├── Auth Service (3001)
├── Inventory Service (3004)        ├── Catalog Service (3003)
├── Shipping Service (3007)         ├── Order Service (3005)
└── Review Service (3008)           ├── Payment Service (3006)
                                    └── Messaging Service (3009)
        │
        ▼
Shared Platform Services (Coral Tier)
├── Notification Service (3010)
├── Search Service (3011)
├── Analytics Service (3012)
└── RabbitMQ Event Bus
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Database | MongoDB 7 + Mongoose |
| Message Broker | RabbitMQ |
| Auth | JWT + bcrypt + OAuth2 |
| Real-time | WebSocket (ws) |
| Email | Nodemailer + Ethereal |
| Containerization | Docker + Docker Compose |

---

## Services

### API Gateway (port 3000)
- JWT validation and scope enforcement on every request
- Rate limiting per client using express-rate-limit
- Request routing to all 12 downstream services
- Centralized error formatting with structured error codes
- Request ID header on every response

### Auth Service (port 3001)
- Full OAuth2 authorization code flow
- Three roles — buyer, seller, admin — each with distinct scopes
- JWT payload includes `sub`, `role`, `storeId`, `scopes`, `exp`
- Refresh token rotation
- Test OAuth2 client seeded automatically on startup

### Seller Service (port 3002)
- Seller registration and store profile management
- Product CRUD with flexible attributes map
- JWT scope enforcement — sellers can only manage their own products

### Catalog Service (port 3003)
- MongoDB text index on title and description for full-text search
- Filter by category, price range, and minimum rating
- Paginated results with total count
- Recalculates `avgRating` when `review.approved` event fires

### Inventory Service (port 3004)
- One stock record per product per seller
- Atomic stock reservation on `order.placed`
- Reservation release on order cancellation
- Virtual `available` field = quantity minus reserved
- Low stock threshold with event emission

### Order Service (port 3005)
- Multi-seller cart — one order spans multiple sellers
- State machine: `pending → paid → processing → shipped → delivered`
- Full timeline — every status change recorded with timestamp
- Publishes `order.placed` on creation

### Payment Service (port 3006)
- Escrow model — holds full payment on `order.placed`
- Per-seller payouts — each seller has their own payout entry
- Releases payout per seller when `shipment.delivered` fires
- Publishes `payment.captured` after escrow hold created

### Shipping Service (port 3007)
- Sellers create shipments with carrier and tracking number
- Carrier webhook endpoint for status updates
- Publishes `shipment.created` and `shipment.delivered` events
- Status enum: `created → in_transit → out_for_delivery → delivered`

### Review Service (port 3008)
- Verified purchase gate — cross-validates orderId + buyerId + delivered status with Order Service
- Moderation queue — reviews start as `pending`
- Admin approves or flags reviews
- Publishes `review.approved` event with productId and rating

### Messaging Service (port 3009)
- Threaded buyer-seller chat scoped to a product
- Real-time delivery via WebSocket
- `readAt` tracking — null until recipient opens thread
- Thread list with unread count per thread

### Notification Service (port 3010)
- Subscribes to all major RabbitMQ events
- Sends transactional emails via Nodemailer
- Order confirmation to buyer on `order.placed`
- Payment alert to seller on `payment.captured`
- Shipment tracking to buyer on `shipment.created`
- Delivery confirmation on `shipment.delivered`
- Low stock alert to seller on `inventory.stock_low`

### Search Service (port 3011)
- Full-text search with MongoDB text index
- Faceted filtering by category, price, rating
- Featured products sorted by avgRating
- Read-only — connects directly to catalog-service database

### Analytics Service (port 3012)
- Admin-only — requires `analytics:manage` scope
- Top products by revenue using aggregation pipelines
- Daily GMV for last N days
- Order volume trends by status
- Read-only — connects directly to order-service database

---

## Event Bus

RabbitMQ sits at the center connecting all services. When a buyer places an order one event triggers an automatic chain reaction across the platform.

| Event | Publisher | Consumers |
|---|---|---|
| `order.placed` | Order Service | Payment (escrow), Inventory (reserve), Notification (confirm) |
| `payment.captured` | Payment Service | Order (→ processing), Notification (alert seller) |
| `shipment.created` | Shipping Service | Order (→ shipped), Notification (tracking info) |
| `shipment.delivered` | Shipping Service | Order (→ delivered), Payment (release payout) |
| `review.approved` | Review Service | Catalog (recalculate avgRating) |
| `inventory.stock_low` | Inventory Service | Notification (alert seller) |

---

## OAuth2 Authorization Code Flow
```
Step 1 — GET /oauth/authorize?response_type=code&client_id=...&scope=...
         Browser shows login form

Step 2 — POST /oauth/authorize
         User submits credentials
         Server validates, checks scopes against user role

Step 3 — GET /callback?code=<short-lived-auth-code>
         Code delivered to client redirect_uri

Step 4 — POST /oauth/token
         Client exchanges code + client_secret for tokens
         Returns accessToken + refreshToken + granted scopes

Step 5 — All API routes
         API Gateway decodes JWT, enforces scope
         Returns 403 if scope missing
```

### Roles and Scopes

| Role | Scopes |
|---|---|
| buyer | catalog:read, orders:create, orders:read, reviews:write, messages:read, messages:write |
| seller | catalog:write, inventory:write, orders:fulfil, shipping:write, analytics:read |
| admin | orders:manage, sellers:manage, payments:manage, reviews:moderate, analytics:manage |

### JWT Payload
```json
{
  "sub": "userId123",
  "role": "seller",
  "storeId": "storeXYZ",
  "scopes": ["catalog:write", "inventory:write"],
  "exp": 1715000000
}
```

---

## Full Order Lifecycle

Here is the complete flow from buyer clicking "Place Order" to delivery:

1. Buyer sends `POST /api/orders` → API Gateway validates JWT and `orders:create` scope
2. Order Service creates order, publishes `order.placed` to RabbitMQ
3. RabbitMQ delivers to three consumers simultaneously:
   - Payment Service creates escrow hold, publishes `payment.captured`
   - Inventory Service atomically reserves stock
   - Notification Service sends order confirmation email to buyer
4. Order Service receives `payment.captured`, advances order to `processing`
5. Notification Service receives `payment.captured`, sends alert to seller
6. Seller creates shipment via Shipping Service, publishes `shipment.created`
7. Order Service advances to `shipped`
8. Notification Service sends tracking info to buyer
9. Carrier webhook hits Shipping Service, status → `delivered`, publishes `shipment.delivered`
10. Order Service advances to `delivered`
11. Payment Service releases seller payout
12. Buyer can now leave a review — Review Service cross-validates the delivered order
13. Admin approves review — Catalog Service recalculates `avgRating`

---

## MongoDB Schemas

Each service owns exactly one database. Services never read or write each other's databases directly — they communicate via REST or events.

| Service | Database | Key Collections |
|---|---|---|
| Auth Service | auth-service | users, clients, authcodes |
| Seller Service | seller-service | sellers, products |
| Catalog Service | catalog-service | products |
| Inventory Service | inventory-service | inventories |
| Order Service | order-service | orders |
| Payment Service | payment-service | payments |
| Shipping Service | shipping-service | shipments |
| Review Service | review-service | reviews |
| Messaging Service | messaging-service | messages |
| Search Service | catalog-service (read-only) | — |
| Analytics Service | order-service (read-only) | — |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- MongoDB
- RabbitMQ

### Run with Docker (recommended)
```bash
git clone https://github.com/osemeedeoghon/multivendor-ecommerce.git
cd multivendor-ecommerce
docker-compose up --build
```

All 13 services start automatically. Visit `http://localhost:3000` to verify the gateway is running.

### Run locally

Start MongoDB and RabbitMQ first, then run each service:
```bash
cd auth-service && npm run dev       # port 3001
cd seller-service && npm run dev     # port 3002
cd catalog-service && npm run dev    # port 3003
cd inventory-service && npm run dev  # port 3004
cd order-service && npm run dev      # port 3005
cd payment-service && npm run dev    # port 3006
cd shipping-service && npm run dev   # port 3007
cd review-service && npm run dev     # port 3008
cd messaging-service && npm run dev  # port 3009
cd notification-service && npm run dev # port 3010
cd search-service && npm run dev     # port 3011
cd analytics-service && npm run dev  # port 3012
cd api-gateway && npm run dev        # port 3000
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login | Public |
| POST | /api/auth/refresh | Refresh token | Public |
| GET | /api/auth/me | Get current user | Bearer |
| GET | /oauth/authorize | OAuth2 login form | Public |
| POST | /oauth/authorize | Submit credentials | Public |
| POST | /oauth/token | Exchange code for tokens | Public |

### Sellers
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/sellers/store | Create store | Bearer |
| GET | /api/sellers/store | Get my store | Bearer |
| PUT | /api/sellers/store | Update store | Bearer |

### Products
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/products | Create product | Bearer |
| GET | /api/products | Get my products | Bearer |
| PUT | /api/products/:id | Update product | Bearer |
| DELETE | /api/products/:id | Delete product | Bearer |

### Catalog
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/catalog/search | Search products | Public |
| GET | /api/catalog/category/:category | Browse by category | Public |
| GET | /api/catalog/:id | Get product | Public |

### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/orders | Place order | Bearer |
| GET | /api/orders | My orders | Bearer |
| GET | /api/orders/:id | Get order | Bearer |
| PUT | /api/orders/:id/status | Update status | Bearer |
| POST | /api/orders/:id/cancel | Cancel order | Bearer |

### Payments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/payments/order/:orderId | Get payment | Bearer |
| POST | /api/payments/release | Release payout | Bearer |
| POST | /api/payments/refund | Refund | Bearer |

### Shipping
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/shipping | Create shipment | Bearer |
| GET | /api/shipping/order/:orderId | Get shipment | Bearer |
| GET | /api/shipping/seller | My shipments | Bearer |
| PUT | /api/shipping/:id/status | Update status | Bearer |
| POST | /api/shipping/webhook | Carrier webhook | Public |

### Reviews
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/reviews | Submit review | Bearer |
| GET | /api/reviews/product/:productId | Get reviews | Public |
| GET | /api/reviews/pending | Pending reviews | Admin |
| PUT | /api/reviews/:id/approve | Approve review | Admin |
| PUT | /api/reviews/:id/flag | Flag review | Admin |

### Search
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/search/search | Full text search | Public |
| GET | /api/search/categories | All categories | Public |
| GET | /api/search/featured | Featured products | Public |

### Analytics
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/analytics/stats | Platform stats | Admin |
| GET | /api/analytics/top-products | Top products | Admin |
| GET | /api/analytics/revenue | Revenue by seller | Admin |
| GET | /api/analytics/gmv | Daily GMV | Admin |
| GET | /api/analytics/trends | Order trends | Admin |

---

## Integration Tests
```bash
cd tests && npm test
```

Expected output:
```
✓ Register a buyer
✓ Register a seller
✓ Login buyer returns tokens
✓ Seller can create a store
✓ Seller can create a product
✓ Anyone can search the catalog
✓ Anyone can get featured products
✓ Buyer can place an order
✓ Buyer can view their orders
✓ Buyer can get a specific order
✓ Protected route rejects request without token
✓ Health check returns ok for all services

Tests: 12 passed, 12 total
```

---

## Project Structure
```
multivendor-ecommerce/
├── api-gateway/          # Port 3000 — JWT validation, routing
├── auth-service/         # Port 3001 — OAuth2, JWT, roles
├── seller-service/       # Port 3002 — Store, products
├── catalog-service/      # Port 3003 — Browse, search
├── inventory-service/    # Port 3004 — Stock, reservations
├── order-service/        # Port 3005 — Cart, state machine
├── payment-service/      # Port 3006 — Escrow, payouts
├── shipping-service/     # Port 3007 — Shipments, webhooks
├── review-service/       # Port 3008 — Verified reviews
├── messaging-service/    # Port 3009 — WebSocket chat
├── notification-service/ # Port 3010 — Email notifications
├── search-service/       # Port 3011 — Full-text search
├── analytics-service/    # Port 3012 — Admin analytics
├── shared/
│   └── messageBroker.js  # RabbitMQ utility
├── tests/
│   └── order-lifecycle.test.js
├── postman-collection.json
└── docker-compose.yml
```

---

## Author

Oseme — Graduate Student, Information Systems, Northeastern University