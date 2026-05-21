# Database Setup Guide

## Quick Setup (Recommended)

Since the RPC method might not work, the easiest way is to manually run the SQL:

### Step 1: Log into Supabase
1. Go to https://supabase.com/dashboard/project/kgppeufbtrbxrbeofyqk
2. Sign in with your account

### Step 2: Open SQL Editor
1. In the left sidebar, click **SQL Editor**
2. Click **New Query**

### Step 3: Copy & Paste SQL
1. Open `backend/schema.sql` in your editor
2. Copy **all the content**
3. Paste it into the Supabase SQL Editor

### Step 4: Run the Query
1. Click the blue **Run** button (or press Ctrl+Enter)
2. Wait for "Executed successfully" message
3. You should see all tables created

### Step 5: Restart Backend
```powershell
cd backend
node server.js
```

## Verify It Worked

After running the SQL in Supabase, you should see these tables in the **Table Editor**:
- ✅ customers
- ✅ menu_items  
- ✅ orders
- ✅ order_items
- ✅ notifications

If you see all these tables, the database is ready and orders will work!

## If You Get an Error

If the SQL fails with an error like "table already exists", that's OK - it just means the tables were already partially created. The `IF NOT EXISTS` in the SQL handles this.

Simply try creating an order in the app again after running the SQL.
