# Multi-Vendor E-Commerce Platform

A production-grade microservices platform built with Node.js, Express, MongoDB, RabbitMQ, WebSocket and Docker. Includes 13 backend microservices, 3 Next.js frontend applications, and full Docker orchestration.

## Live Demo

| App | URL | Credentials |
|---|---|---|
| ShopHub (Buyer) | http://localhost:3030 | Register as buyer |
| SellerHub (Seller Dashboard) | http://localhost:3031 | Register as seller |
| AdminHub (Admin Portal) | http://localhost:3032 | admin@shophub.com / password |
| API Gateway | http://localhost:3000 | — |

---

## Architecture Overview
```
Client Applications
┌─────────────────┬──────────────────┬─────────────────┐
│ ShopHub :3030   │ SellerHub :3031  │ AdminHub :3032  │
│ (Buyer App)     │ (Seller Dashboard│ (Admin Portal)  │
└────────┬────────┴────────┬─────────┴────────┬────────┘
         │                 │                  │
         └─────────────────▼──────────────────┘
                    API Gateway (port 3000)
            JWT validation · Rate limiting · Routing
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
Seller Services     Buyer Services      Shared Services
├── Seller (3002)   ├── Auth (3001)     ├── Notification (3010)
├── Inventory(3004) ├── Catalog (3003)  ├── Search (3011)
├── Shipping (3007) ├── Order (3005)    └── Analytics (3012)
└── Review (3008)   ├── Payment (3006)
                    └── Messaging (3009)
                           │
                    RabbitMQ Event Bus
                           │
                       MongoDB 7
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Frontend | Next.js 14 |
| Database | MongoDB 7 + Mongoose |
| Message Broker | RabbitMQ |
| Auth | JWT + bcrypt + OAuth2 |
| Real-time | WebSocket (ws) |
| Email | Nodemailer + Ethereal |
| Containerization | Docker + Docker Compose |

---

## Frontend Applications

### ShopHub — Buyer App (port 3030)
- Browse and search products from all sellers
- Product detail pages with reviews and ratings
- Shopping cart with multi-seller support
- Checkout with shipping address and payment processing
- Order history and order tracking
- Buyer-to-seller messaging on product pages
- Register and login as buyer

### SellerHub — Seller Dashboard (port 3031)
- Seller registration and store creation
- Product management — create, edit, delete products
- Products automatically sync to buyer catalog on creation
- Order management with status progression
- Shipment creation with carrier and tracking number
- Real-time buyer messages via WebSocket
- Sales analytics

### AdminHub — Admin Portal (port 3032)
- Platform overview with total revenue, orders, users
- Full order management with cancel capability
- User management — view all buyers, sellers, admins with role filter
- Review moderation — approve or flag pending reviews
- Analytics dashboard — daily GMV, order trends, top products by revenue

---

## Backend Services

### API Gateway (port 3000)
- JWT validation and scope enforcement on every request
- Rate limiting per client using express-rate-limit
- Request routing to all 12 downstream services
- Centralized error formatting with structured error codes

### Auth Service (port 3001)
- Full OAuth2 authorization code flow
- Three roles — buyer, seller, admin — each with distinct scopes
- JWT payload includes `sub`, `role`, `storeId`, `scopes`, `exp`
- Refresh token rotation

### Seller Service (port 3002)
- Seller registration and store profile management
- Product CRUD with flexible attributes map
- Automatic product sync to catalog-service on create/update/delete
- JWT scope enforcement — sellers can only manage their own products

### Catalog Service (port 3003)
- MongoDB text index on title and description for full-text search
- Filter by category, price range, and minimum rating
- Paginated results with total count
- Sync endpoint receives products from seller-service
- Recalculates `avgRating` when `review.approved` event fires

### Inventory Service (port 3004)
- One stock record per product per seller
- Atomic stock reservation on `order.placed`
- Reservation release on order cancellation
- Low stock threshold with event emission

### Order Service (port 3005)
- Multi-seller cart — one order spans multiple sellers
- State machine: `pending → paid → processing → shipped → delivered`
- Full timeline — every status change recorded with timestamp
- Seller order filtering by userId
- Admin endpoint for all orders
- Publishes `order.placed` on creation

### Payment Service (port 3006)
- Escrow model — holds full payment on order placement
- Per-seller payouts — each seller has their own payout entry
- Releases payout per seller when `shipment.delivered` fires
- Duplicate payment protection via unique orderId index
- Wired into buyer checkout flow

### Shipping Service (port 3007)
- Sellers create shipments with carrier and tracking number
- Carrier webhook endpoint for status updates
- Publishes `shipment.created` and `shipment.delivered` events
- Status enum: `created → in_transit → out_for_delivery → delivered`

### Review Service (port 3008)
- Verified purchase gate — cross-validates orderId + buyerId + delivered status
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
- Order confirmation, payment alerts, shipment tracking, delivery confirmation

### Search Service (port 3011)
- Full-text search with MongoDB text index
- Featured products sorted by avgRating
- Read-only — connects directly to catalog-service database

### Analytics Service (port 3012)
- Admin-only — requires `analytics:manage` scope
- Top products by revenue using aggregation pipelines
- Daily GMV for last N days
- Order volume trends by status
- Total users count via auth-service integration
- Read-only — connects directly to order-service database

---

## Event Bus

| Event | Publisher | Consumers |
|---|---|---|
| `order.placed` | Order Service | Payment (escrow), Inventory (reserve), Notification (confirm) |
| `payment.captured` | Payment Service | Order (→ processing), Notification (alert seller) |
| `shipment.created` | Shipping Service | Order (→ shipped), Notification (tracking info) |
| `shipment.delivered` | Shipping Service | Order (→ delivered), Payment (release payout) |
| `review.approved` | Review Service | Catalog (recalculate avgRating) |
| `inventory.stock_low` | Inventory Service | Notification (alert seller) |

---

## Full Order Lifecycle

1. Buyer adds product to cart — sellerId stored as product.userId for correct routing
2. Buyer fills shipping address and clicks Place Order
3. Order Service creates order, publishes `order.placed`
4. Payment Service creates escrow hold
5. Seller sees order in SellerHub Orders page
6. Seller creates shipment with carrier and tracking number
7. Order advances to `shipped`
8. Buyer sees shipment status in their orders
9. Order marked delivered — payment payout released to seller
10. Buyer can leave a verified review
11. Admin can monitor all activity in AdminHub

---

## MongoDB Schemas

Each service owns its own database. Services communicate via REST or RabbitMQ events — never direct DB access.

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
- Docker Desktop

### Run with Docker (recommended)
```bash
git clone https://github.com/osemeedeoghon/multivendor-ecommerce.git
cd multivendor-ecommerce
docker-compose up -d
```

All 19 containers start automatically — 13 backend services + 3 frontends + MongoDB + RabbitMQ.

| App | URL |
|---|---|
| Buyer App | http://localhost:3030 |
| Seller Dashboard | http://localhost:3031 |
| Admin Portal | http://localhost:3032 |
| API Gateway | http://localhost:3000 |

### Default Admin Credentials
- Email: `admin@shophub.com`
- Password: `password`

---

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login | Public |
| POST | /api/auth/refresh | Refresh token | Public |
| GET | /api/auth/me | Get current user | Bearer |
| GET | /api/auth/users | Get all users | Admin |

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
| POST | /api/catalog/sync | Sync product from seller | Internal |

### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/orders | Place order | Bearer |
| GET | /api/orders | My orders | Bearer |
| GET | /api/orders/seller | Seller orders | Bearer |
| GET | /api/orders/admin/all | All orders | Admin |
| GET | /api/orders/:id | Get order | Bearer |
| PUT | /api/orders/:id/status | Update status | Bearer |
| POST | /api/orders/:id/cancel | Cancel order | Bearer |

### Payments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/payments | Create payment hold | Bearer |
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
cd tests
npm install
npm test
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
├── seller-service/       # Port 3002 — Store, products, catalog sync
├── catalog-service/      # Port 3003 — Browse, search, sync endpoint
├── inventory-service/    # Port 3004 — Stock, reservations
├── order-service/        # Port 3005 — Cart, state machine
├── payment-service/      # Port 3006 — Escrow, payouts
├── shipping-service/     # Port 3007 — Shipments, webhooks
├── review-service/       # Port 3008 — Verified reviews
├── messaging-service/    # Port 3009 — WebSocket chat
├── notification-service/ # Port 3010 — Email notifications
├── search-service/       # Port 3011 — Full-text search
├── analytics-service/    # Port 3012 — Admin analytics
├── buyer-app/            # Port 3030 — Next.js buyer storefront
├── seller-dashboard/     # Port 3031 — Next.js seller dashboard
├── admin-portal/         # Port 3032 — Next.js admin portal
├── shared/
│   └── messageBroker.js  # RabbitMQ utility
├── tests/
│   └── order-lifecycle.test.js
├── postman-collection.json
└── docker-compose.yml
```

---

## Roles and Scopes

| Role | Scopes |
|---|---|
| buyer | catalog:read, orders:create, orders:read, reviews:write, messages:read, messages:write |
| seller | catalog:write, inventory:write, orders:fulfil, shipping:write, analytics:read |
| admin | orders:manage, sellers:manage, payments:manage, reviews:moderate, analytics:manage |

---

## Author

Oseme Edeoghon — Graduate Student, M.S. Information Systems, Northeastern University  
