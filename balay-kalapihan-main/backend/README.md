# Balay Kalapihan Backend API

A complete Node.js Express backend for the Balay Kalapihan coffee shop website with SQLite database.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

The `.env` file is already configured with defaults:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
DATABASE_PATH=./database.sqlite
```

For production, change the `JWT_SECRET` to a secure value.

### 3. Start the Server

```bash
npm start          # Production mode
npm run dev        # Development mode with auto-reload
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication

- **POST** `/api/auth/signup` - Create new user account
  - Body: `{ username, email, fullName, password, phoneNumber? }`
  - Returns: `{ token, user }`

- **POST** `/api/auth/login` - Login user
  - Body: `{ username, password }`
  - Returns: `{ token, user }`
  - Admin credentials: username: `admin`, password: `admin123`

- **GET** `/api/auth/profile` - Get user profile (authenticated)
  - Returns: User data

- **PUT** `/api/auth/profile` - Update user profile (authenticated)
  - Body: `{ email, fullName, phoneNumber }`
  - Returns: Success message

### Menu Management

- **GET** `/api/menu` - Get all menu items
  - Returns: Array of menu items

- **GET** `/api/menu/:id` - Get single menu item
  - Returns: Menu item details

- **GET** `/api/menu/category/:category` - Get items by category
  - Returns: Array of menu items in category

- **POST** `/api/menu` - Create menu item (admin only)
  - Body: `{ name, category, price, stock, description? }`
  - Returns: `{ id, item }`

- **PUT** `/api/menu/:id` - Update menu item (admin only)
  - Body: `{ name, category, price, stock, description? }`
  - Returns: Success message

- **DELETE** `/api/menu/:id` - Delete menu item (admin only)
  - Returns: Success message

- **PATCH** `/api/menu/:id/stock` - Update item stock (admin only)
  - Body: `{ stock }`
  - Returns: Success message

- **PATCH** `/api/menu/:id/sales` - Increment sales count
  - Body: `{ quantity }`
  - Returns: Success message

### Orders

- **POST** `/api/orders` - Create new order (authenticated)
  - Body: `{ customer, items, total, phoneNumber?, orderItems? }`
  - Returns: `{ orderId, order }`

- **GET** `/api/orders` - Get user's orders (authenticated)
  - Returns: Array of user orders

- **GET** `/api/orders/all` - Get all orders (admin only)
  - Returns: Array of all orders

- **GET** `/api/orders/:id` - Get order details (authenticated)
  - Returns: Order with items

- **PATCH** `/api/orders/:id/status` - Update order status (admin only)
  - Body: `{ status }` - one of: pending, preparing, ready, completed
  - Returns: Success message

- **DELETE** `/api/orders/:id` - Delete order (admin only)
  - Returns: Success message

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Admin users have the username `admin` with password `admin123`. This is hardcoded for the demo.

## Database Schema

### customers
- id (PRIMARY KEY)
- username (UNIQUE)
- email (UNIQUE)
- fullName
- password (hashed)
- phoneNumber
- createdAt

### menu_items
- id (PRIMARY KEY)
- name
- category
- price
- stock
- sales (count)
- description
- createdAt

### orders
- id (PRIMARY KEY)
- userId (FOREIGN KEY)
- customer
- items (count)
- total
- status (pending, preparing, ready, completed)
- time
- phoneNumber
- createdAt

### order_items
- id (PRIMARY KEY)
- orderId (FOREIGN KEY)
- menuItemId (FOREIGN KEY)
- quantity
- price
- notes

### notifications
- id (PRIMARY KEY)
- userId (FOREIGN KEY)
- title
- message
- type
- read
- createdAt

## Default Menu Items

The database is automatically populated with default menu items on first run:
- Koldbrew - Malto (12oz)
- Espresso Drinks
- Frappe - Caramel
- Brewed Coffee
- Pastry - Croissant
- Snacks - Cookies

## Testing the API

Use tools like:
- **Postman** - Desktop API testing tool
- **Insomnia** - REST client
- **VS Code REST Client** - Extension for testing directly in VS Code
- **cURL** - Command line tool

Example request:
```bash
curl -X GET http://localhost:5000/api/health
```

## Frontend Integration

The frontend (React app) should make requests to `http://localhost:5000/api/` endpoints.

Example in React:
```typescript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const data = await response.json();
const token = data.token;
```

Store the token and include in all authenticated requests:
```typescript
fetch('http://localhost:5000/api/orders', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| JWT_SECRET | Secret for JWT tokens | your-secret-key-change-in-production |
| DATABASE_PATH | Path to SQLite database | ./database.sqlite |

## Troubleshooting

### Port already in use
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Database errors
Delete `database.sqlite` and restart the server to reinitialize with default data.

### CORS issues
CORS is enabled for all origins by default. To restrict, modify `app.use(cors())` in `server.js`.

## License

ISC
