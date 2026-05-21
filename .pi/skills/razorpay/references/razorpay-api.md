# Razorpay API Reference

## Authentication

All API requests use Basic Auth:
- Username: `key_id`
- Password: `key_secret`

```bash
curl -u rzp_test_xxx:secret_xxx https://api.razorpay.com/v1/orders
```

## Base URL

```
https://api.razorpay.com/v1
```

## Core APIs

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create an order |
| GET | `/orders/:id` | Fetch order by ID |
| GET | `/orders` | List all orders |
| GET | `/orders/:id/payments` | Fetch payments for an order |

**Create Order:**
```json
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_1",
  "partial_payment": false,
  "notes": { "key": "value" }
}
```

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payments/:id` | Fetch payment |
| GET | `/payments` | List payments |
| POST | `/payments/:id/capture` | Capture payment |
| POST | `/payments/:id/refund` | Refund payment |

**Capture Payment:**
```json
{
  "amount": 50000,
  "currency": "INR"
}
```

### Refunds

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/:id/refund` | Create refund |
| GET | `/refunds/:id` | Fetch refund |
| GET | `/refunds` | List refunds |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/subscriptions` | Create subscription |
| GET | `/subscriptions/:id` | Fetch subscription |
| POST | `/subscriptions/:id/cancel` | Cancel subscription |
| PATCH | `/subscriptions/:id` | Update subscription |

**Create Subscription:**
```json
{
  "plan_id": "plan_xxx",
  "total_count": 12,
  "quantity": 1,
  "customer_notify": 1,
  "start_at": 1735689600,
  "notes": {}
}
```

### Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/plans` | Create plan |
| GET | `/plans/:id` | Fetch plan |
| GET | `/plans` | List plans |

**Create Plan:**
```json
{
  "period": "monthly",
  "interval": 1,
  "item": {
    "name": "Pro Plan",
    "amount": 99900,
    "currency": "INR",
    "description": "Monthly"
  }
}
```

### Payment Links

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payment_links` | Create payment link |
| GET | `/payment_links/:id` | Fetch payment link |
| POST | `/payment_links/:id/cancel` | Cancel payment link |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/customers` | Create customer |
| GET | `/customers/:id` | Fetch customer |
| PATCH | `/customers/:id` | Update customer |

### Settlements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settlements` | List settlements |
| GET | `/settlements/:id` | Fetch settlement |
| GET | `/settlements/recon/combined` | Settlement recon |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/invoices` | Create invoice |
| GET | `/invoices/:id` | Fetch invoice |
| PATCH | `/invoices/:id` | Update invoice |
| POST | `/invoices/:id/cancel` | Cancel invoice |

## Webhook Events

| Event | When |
|-------|------|
| `payment.authorized` | Payment authorized (before capture) |
| `payment.captured` | Payment captured successfully |
| `payment.failed` | Payment failed |
| `payment.dispute.created` | Chargeback/dispute opened |
| `order.paid` | Order fully paid |
| `subscription.activated` | Subscription started |
| `subscription.charged` | Recurring charge succeeded |
| `subscription.completed` | All charges done |
| `subscription.cancelled` | Subscription cancelled |
| `subscription.pending` | Charge pending |
| `subscription.halted` | Subscription halted after retries |
| `refund.created` | Refund initiated |
| `refund.processed` | Refund completed |
| `settlement.processed` | Settlement transferred |
| `payment_link.paid` | Payment link paid |
| `payment_link.expired` | Payment link expired |

## Error Codes

| Code | Description |
|------|-------------|
| `BAD_REQUEST_ERROR` | Invalid request parameters |
| `GATEWAY_ERROR` | Payment gateway issue |
| `SERVER_ERROR` | Razorpay server error |

Common `BAD_REQUEST_ERROR` reasons:
- `amount` not in paise
- `currency` not supported
- `order_id` already paid
- Invalid `receipt` format

## Test Cards

| Card Number | Description |
|-------------|-------------|
| `4111 1111 1111 1111` | Visa (success) |
| `5104 0155 5555 5558` | Mastercard (success) |
| `4111 1111 1111 1234` | Will fail |

Test UPI: `success@razorpay` / `failure@razorpay`

## Rate Limits

- Standard: 20 requests/second
- Bulk APIs: 5 requests/second
- Webhook retries: 24 hours, exponential backoff

## SDK (Node.js)

```bash
npm install razorpay
```

```typescript
import Razorpay from "razorpay";

const instance = new Razorpay({
  key_id: "rzp_test_xxx",
  key_secret: "xxx",
});

// All methods return Promises
const order = await instance.orders.create({ ... });
const payment = await instance.payments.fetch(paymentId);
const refund = await instance.payments.refund(paymentId, { amount });
const sub = await instance.subscriptions.create({ ... });
```
