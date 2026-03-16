# Multi-Vendor E-Commerce Platform

A production-grade microservices platform built with Node.js, Express, MongoDB, RabbitMQ and Docker.

## Architecture

13 independent services communicate via REST and async events through RabbitMQ.
```
Client → API Gateway (3000)
           ├── Auth Service (3001)
           ├── Seller Service (3002)
           ├── Catalog Service (3003)
           ├── Inventory Service (3004)
           ├── Order Service (3005)
           ├── Payment Service (3006)
           ├── Shipping Service (3007)
           ├── Review Service (3008)
           ├── Messaging Service (3009)
           ├── Notification Service (3010)
           ├── Search Service (3011)
           └── Analytics Service (3012)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Database | MongoDB 7 + Mongoose |
| Message Broker | RabbitMQ |
| Auth | JWT + bcrypt |
| Real-time | WebSocket (ws) |
| Email | Nodemailer + Ethereal |
| Containerization | Docker + Docker Compose |

## Event Flow

| Event | Publisher | Consumers |
|---|---|---|
| order.placed | Order Service | Payment, Inventory, Notification |
| payment.captured | Payment Service | Order, Notification |
| shipment.created | Shipping Service | Order, Notification |
| shipment.delivered | Shipping Service | Order, Payment, Review |
| review.approved | Review Service | Catalog |
| inventory.stock_low | Inventory Service | Notification |

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- MongoDB
- RabbitMQ

### Run with Docker (recommended)
```bash
git clone <your-repo-url>
cd multivendor-ecommerce
docker-compose up --build
```

All services will start automatically. Visit `http://localhost:3000` to verify the gateway is running.

### Run locally

Start each service individually:
```bash
# Terminal 1 - Auth Service
cd auth-service && npm run dev

# Terminal 2 - Seller Service
cd seller-service && npm run dev

# Terminal 3 - Catalog Service
cd catalog-service && npm run dev

# ... repeat for each service
```

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login | Public |
| POST | /api/auth/refresh | Refresh token | Public |
| GET | /api/auth/me | Get current user | Bearer |

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

## Environment Variables

Each service has its own `.env` file. Key variables:
```
PORT=             # Service port
MONGO_URI=        # MongoDB connection string
JWT_SECRET=       # JWT signing secret
RABBITMQ_URL=     # RabbitMQ connection URL
```

## Roles & Scopes

| Role | Scopes |
|---|---|
| buyer | catalog:read, orders:create, orders:read, reviews:write, messages:read, messages:write |
| seller | catalog:write, inventory:write, orders:fulfil, shipping:write, analytics:read |
| admin | orders:manage, sellers:manage, payments:manage, reviews:moderate, analytics:manage |

## Project Structure
```
multivendor-ecommerce/
├── api-gateway/
├── auth-service/
├── seller-service/
├── catalog-service/
├── inventory-service/
├── order-service/
├── payment-service/
├── shipping-service/
├── review-service/
├── messaging-service/
├── notification-service/
├── search-service/
├── analytics-service/
├── shared/
│   └── messageBroker.js
└── docker-compose.yml
```

## Author

Oseme — Graduate Student, Information Systems, Northeastern University