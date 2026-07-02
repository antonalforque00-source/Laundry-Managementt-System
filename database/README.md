# LPDMS Database Folder 🗄️

Welcome to your dedicated, separate database directory! This folder consolidates everything related to your application's data layer, making your database architecture isolated, clean, and extremely easy to manage.

---

## 📂 Included Database Assets

1. **`local-database.json`**  
   The active offline/local file-based state. It contains pre-seeded, rich testing data including administrators (`Anton Alforque`), laundry staff (`Delima`), riders (`CidricSanchez`, `John Rider`), and customers (`ClarckBaynas`, `Alice Smith`, `Bob Johnson`). It also includes pre-made sample laundry bookings and inventory stock.

2. **`supabase_schema.sql`**  
   Your production SQL script. Run this directly in your Supabase SQL Editor to instantly provision PostgreSQL tables. All constraints, schema linkages, relationships, and permissive policies are pre-coded so they plug and play perfectly.

3. **`supabase-config.json`**  
   The system connection parameters indicating your current active database configuration.

---

## 🔗 Table Schema & Relationships

The database is built on **5 core tables**, which have direct real-time relational connections to power your main features (Booking, Admin Assignment, Rider processing, and Laundry Staff Washing):

```
       +------------------------------------+
       |               USERS                |
       +------------------------------------+
       | id (PK)                            | <-------+
       | name, email, password, role        |         |
       | points, address, phone             |         |
       +------------------------------------+         |
         |                                |           |
         | (customer_id)                  | (rider_id)|
         |                                |           |
         v                                v           |
+--------------------------------------------------+  |
|                     ORDERS                       | -+
+--------------------------------------------------+
| id (PK)                                          |
| customer_id (FK -> users.id)                     |
| rider_id (FK -> users.id)                        |
| service, status, cost, weight, created_at, address|
+--------------------------------------------------+

+--------------------+  +--------------------+  +--------------------+
|     INVENTORY      |  |     AUDIT LOGS     |  |     FEEDBACKS      |
+--------------------+  +--------------------+  +--------------------+
| id (PK), name      |  | id (PK), timestamp |  | id (PK), rating    |
| quantity, unit     |  | user_name, action  |  | customer_name, type|
+--------------------+  +--------------------+  +--------------------+
```

### Detailed Relationships:
1. **`orders.customer_id` ➔ `users.id`** (`FOREIGN KEY ... REFERENCES users(id) ON DELETE CASCADE`)
   - **Connection**: Every laundry booking must belong to an active registered customer.
   - **Cascade Behavior**: If a customer's account is deleted, their associated bookings are cleared to maintain data integrity.

2. **`orders.rider_id` ➔ `users.id`** (`FOREIGN KEY ... REFERENCES users(id) ON DELETE SET NULL`)
   - **Connection**: When an Admin assigns a rider to an order, the `rider_id` matches the unique ID of the rider.
   - **Duty/Removal Behavior**: If a rider's account is removed, the booking is not deleted; instead, the assigned rider status simply resets to `NULL` so another rider can assume duty.

---

## 💡 How the Automatic Features Work (100% Connected)

1. **Customer Books Laundry**:
   - Creates a record in the `orders` table with a state of `'pending'` and links `customer_id` automatically to the logged-in customer's ID.

2. **Admin Assigns Rider**:
   - The admin selects an active rider (e.g., `CidricSanchez` or `John Rider`) from a dynamic dropdown. This immediately updates the order's `rider_id`, `rider_name`, and changes its status automatically to `'pickup_scheduled'`.

3. **Rider Receives Order Instantly**:
   - The Rider's dashboard loads live orders matching `rider_id` of the logged-in rider and filter states. The order is immediately visible on their task panel. No more empty dashboards!

4. **Staff Processes Laundry**:
   - Once the rider delivers the bags to the laundry hub, laundry staff (like `Delima` or `Maria Staff`) instantly see the order marked for washing, weigh it, and update it.

5. **Delivered & Signature**:
   - Once washed and packed, the rider picks it up and marks it as delivered upon receiving the customer's signature. Points are automatically logged for the customer, and the order is finalized.

---

## ⚡ How to Sync Existing Tables in Supabase

If you already created your tables previously and just want to connect them using the updated foreign keys, run this script in your Supabase SQL Editor:

```sql
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE orders ADD CONSTRAINT fk_orders_rider FOREIGN KEY (rider_id) REFERENCES users(id) ON DELETE SET NULL;
```
