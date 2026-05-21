# Balay Kalapihan - Database Fields Reference

## Orders Table - Complete Schema

### Core Order Information
| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT | Primary key (Order ID) |
| `customer` | TEXT | Customer name |
| `items` | INTEGER | Number of items in order |
| `status` | TEXT | Order status (pending, confirmed, preparing, ready, completed, cancelled) |
| `created_at` | TIMESTAMP | When order was created |

### Payment Information ✅ NEW
| Field | Type | Description |
|-------|------|-------------|
| `total` | REAL | Total amount to pay |
| `subtotal` | REAL | Subtotal before tax/discount |
| `discount` | REAL | Discount amount applied |
| `tax` | REAL | Tax amount |
| `paymentmethod` | TEXT | Payment method (gcash, maya) |
| `referencenumber` | TEXT | Payment reference/transaction ID |
| `payment_verified_at` | TIMESTAMP | When payment was confirmed |

### Pickup Information ✅ NEW
| Field | Type | Description |
|-------|------|-------------|
| `pickupdate` | TEXT | Date customer will pick up order |
| `pickuptime` | TEXT | Time customer will pick up order |
| `estimated_ready_time` | TIMESTAMP | When order is estimated to be ready |

### Customer Information ✅ NEW
| Field | Type | Description |
|-------|------|-------------|
| `phonenumber` | TEXT | Customer phone number |
| `customer_id` | BIGINT | Foreign key to customers table |

### Order Details ✅ NEW
| Field | Type | Description |
|-------|------|-------------|
| `orderdetails` | TEXT | Additional order details (legacy) |
| `order_notes` | TEXT | Special requests/notes for the order |

### Order Lifecycle Timestamps ✅ NEW
| Field | Type | Description |
|-------|------|-------------|
| `completed_at` | TIMESTAMP | When order was completed/picked up |
| `cancelled_at` | TIMESTAMP | When order was cancelled |
| `cancellation_reason` | TEXT | Reason why order was cancelled |
| `userid` | BIGINT | User ID (legacy field) |

---

## Order Items Table
| Field | Type | Description |
|-------|------|-------------|
| `id` | Primary Key | Item record ID |
| `orderid` | TEXT | Foreign key to orders.id |
| `menuitemid` | TEXT | Foreign key to menu_items.id |
| `quantity` | INTEGER | How many of this item |
| `price` | REAL | Price of this item |
| `notes` | TEXT | Special instructions (e.g., "less sugar", "extra ice") |

---

## Menu Items Table
| Field | Type | Description |
|-------|------|-------------|
| `id` | Primary Key | Item ID |
| `name` | TEXT | Item name (Koldbrew, Matcha Krema, etc.) |
| `price` | INTEGER | Item price |
| `description` | TEXT | Item description |
| `category` | VARCHAR | Item category |

---

## Customers Table
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID/BIGINT | Primary key |
| `username` | VARCHAR | Login username |
| `email` | VARCHAR | Email address |
| `full_name` | VARCHAR | Customer full name |
| `phone_number` | VARCHAR | Phone number |
| `password` | VARCHAR | Hashed password |
| `created_at` | TIMESTAMP | Account creation date |

---

## Data Flow for New Order Creation

### 1. **Customer Places Order** (Dashboard.tsx)
```
subtotalAmount → subtotal
discount → discount
0 → tax
userData.phoneNumber → phonenumber
paymentMethod → paymentmethod
referenceNumber → referencenumber
pickupDate → pickupdate
pickupTime → pickuptime
order_notes → order_notes
estimated_ready_time → estimated_ready_time
userData.id → customer_id
```

### 2. **Backend Processing** (backend/routes/orders.js)
- Validates payment method (only GCash/Maya allowed)
- Creates order record with all fields
- Inserts order items with customizations

### 3. **Admin Dashboard Display** (AdminDashboard.tsx)
- Shows payment method (GCash/Maya)
- Shows pickup schedule (date + time)
- Can update order status
- Tracks order completion/cancellation

---

## Enhanced Features Implemented

✅ **Payment Tracking**
- Online payment methods only (GCash/Maya)
- Reference number for payment verification
- Payment verification timestamp

✅ **Pickup Scheduling**
- Specific pickup date and time
- Estimated ready time

✅ **Customer Linking**
- Can link orders to customer accounts
- Phone number tracking

✅ **Order Notes**
- Support for special requests
- Kitchen instructions

✅ **Order Lifecycle**
- Completion timestamp
- Cancellation tracking with reason

---

## API Endpoints

### Create Order (POST /api/orders)
**Required:** customer, items, total
**Optional:** All other fields for enhanced tracking

### Get All Orders (GET /api/orders/all)
**Auth:** Admin only
**Returns:** Orders with all fields and associated items

### Update Order Status (PATCH /api/orders/:id/status)
**Auth:** Admin only
**Updates:** status field

---

## Usage Notes

1. **Backward Compatible**: All new fields are optional (NULL allowed)
2. **Payment Enforcement**: Only GCash and Maya are accepted
3. **Timestamps**: Auto-populated for created_at, manual for completion/cancellation
4. **Customization**: Order items support detailed notes for customization
5. **Analytics Ready**: All data captured supports future reporting and analytics
