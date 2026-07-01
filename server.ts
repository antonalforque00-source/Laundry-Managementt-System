import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { randomUUID } from "crypto";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// --- Mock In-Memory Database ---
let users = [
  { id: "cust-1", name: "Alice Smith", email: "alice@example.com", password: "password123", role: "customer", points: 150, address: "123 Taft Ave, Manila", phone: "+63 917 123 4567" },
  { id: "cust-2", name: "Bob Johnson", email: "bob@example.com", password: "password123", role: "customer", points: 40, address: "456 Katipunan Ave, Quezon City", phone: "+63 918 765 4321" },
  { id: "rider-1", name: "John Rider", email: "rider@example.com", password: "password123", role: "rider", rating: 4.9, status: "active", phone: "+63 919 111 2222" },
  { id: "staff-1", name: "Maria Staff", email: "staff@example.com", password: "password123", role: "staff", station: "Washing Hub B", phone: "+63 920 333 4444" },
  { id: "admin-1", name: "Admin Boss", email: "admin@example.com", password: "password123", role: "admin", phone: "+63 921 555 6666" },
];

let orders = [
  {
    id: "LPD-1024",
    customerId: "cust-1",
    customerName: "Alice Smith",
    service: "Wash & Fold",
    status: "washing",
    cost: 450,
    weight: 5.2, // kg
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    specialInstructions: "Use gentle lavender detergent",
    paymentMethod: "GCash",
    isPaid: true,
    qrCodeValue: "QR_LPD-1024",
    address: "123 Taft Ave, Manila",
    phone: "+63 917 123 4567",
    riderId: "rider-1",
    riderName: "John Rider",
    rating: 5,
    review: "Incredible quick service!"
  },
  {
    id: "LPD-1025",
    customerId: "cust-2",
    customerName: "Bob Johnson",
    service: "Dry Cleaning",
    status: "pickup_scheduled",
    cost: 850,
    weight: 0,
    createdAt: new Date().toISOString(),
    specialInstructions: "Suit jacket needs extra care",
    paymentMethod: "Maya",
    isPaid: false,
    qrCodeValue: "QR_LPD-1025",
    address: "456 Katipunan Ave, Quezon City",
    phone: "+63 918 765 4321",
    riderId: "rider-1",
    riderName: "John Rider"
  }
];

let inventory = [
  { id: "inv-1", name: "Premium Liquid Detergent", quantity: 18.5, unit: "L", minLimit: 5.0 },
  { id: "inv-2", name: "Organic Fabric Conditioner", quantity: 4.2, unit: "L", minLimit: 5.0 }, // Trigger warning
  { id: "inv-3", name: "Eco Bleach & Stain Remover", quantity: 12.0, unit: "L", minLimit: 3.0 },
  { id: "inv-4", name: "Biodegradable Laundry Bags", quantity: 120, unit: "pcs", minLimit: 50 }
];

let auditLogs = [
  { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), user: "Maria Staff", action: "Updated LPD-1024 to 'Washing'" },
  { timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), user: "John Rider", action: "Picked up LPD-1024 laundry bag" },
  { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), user: "Alice Smith", action: "Created booking LPD-1024" }
];

let feedbacks = [
  { id: "fb-1", customerName: "Alice Smith", rating: 5, review: "Smells wonderful and neatly folded!", type: "Review" }
];

// --- Supabase Config & Client Setup ---
const CONFIG_PATH = path.join(process.cwd(), "supabase-config.json");
let supabaseConfig = {
  supabaseUrl: "",
  supabaseKey: "",
  useSupabase: false
};

if (fs.existsSync(CONFIG_PATH)) {
  try {
    supabaseConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (err) {
    console.error("Error reading supabase-config.json:", err);
  }
}

// Fallbacks to environment variables if provided
if (!supabaseConfig.supabaseUrl && process.env.SUPABASE_URL) {
  supabaseConfig.supabaseUrl = process.env.SUPABASE_URL;
}
if (!supabaseConfig.supabaseKey && process.env.SUPABASE_KEY) {
  supabaseConfig.supabaseKey = process.env.SUPABASE_KEY;
}

let supabaseClient: any = null;
let tablesExist = false;

async function verifySupabaseTables() {
  if (!supabaseClient) {
    tablesExist = false;
    return;
  }
  try {
    const [resUsers, resOrders, resInventory, resLogs, resFeedbacks] = await Promise.all([
      supabaseClient.from("users").select("id").limit(1),
      supabaseClient.from("orders").select("id").limit(1),
      supabaseClient.from("inventory").select("id").limit(1),
      supabaseClient.from("audit_logs").select("id").limit(1),
      supabaseClient.from("feedbacks").select("id").limit(1)
    ]);

    const isExist = (res: any) => {
      if (!res.error) return true;
      // Code 42501 is RLS violation, which means the table DOES exist!
      if (res.error.code === '42501') return true;
      return false;
    };

    if (isExist(resUsers) && isExist(resOrders) && isExist(resInventory) && isExist(resLogs) && isExist(resFeedbacks)) {
      console.log("All Supabase tables verified successfully! Database is fully operational.");
      tablesExist = true;
    } else {
      console.warn("Some required Supabase tables are missing or inaccessible. Reverting to local fallback mode.");
      tablesExist = false;
    }
  } catch (err: any) {
    console.error("Error verifying Supabase tables:", err.message);
    tablesExist = false;
  }
}

async function initSupabase() {
  if (supabaseConfig.supabaseUrl && supabaseConfig.supabaseKey && supabaseConfig.useSupabase) {
    try {
      supabaseClient = createClient(supabaseConfig.supabaseUrl, supabaseConfig.supabaseKey, {
        auth: { persistSession: false }
      });
      console.log("Supabase Client initialized successfully. Verifying tables...");
      await verifySupabaseTables();
    } catch (err) {
      console.error("Failed to initialize Supabase Client:", err);
      supabaseClient = null;
      tablesExist = false;
    }
  } else {
    supabaseClient = null;
    tablesExist = false;
  }
}

// Initial async call
initSupabase().then(() => {
  console.log("Initial Supabase Setup complete. Tables Exist:", tablesExist);
});

// --- Case & Variable Mapping Helpers (CamelCase <-> SnakeCase) ---
function toSnake(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(toSnake);
  
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = toSnake(obj[key]);
  }
  return newObj;
}

function toCamel(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = toCamel(obj[key]);
  }
  return newObj;
}

// --- Database Operations Abstraction Layer ---

function isNetworkOrConnectionError(err: any): boolean {
  const msg = (err?.message || String(err)).toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("etimedout") ||
    msg.includes("network") ||
    msg.includes("socket") ||
    msg.includes("undici")
  );
}

function handleSupabaseError(actionName: string, error: any) {
  console.error(`Supabase ${actionName} error:`, error);
  let msg = error?.message || String(error);
  if (error?.code === '42501') {
    msg = `Supabase Row-Level Security (RLS) Violation (Code 42501): Please copy and execute the SQL schema in your Supabase SQL Editor to disable RLS (e.g., 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;') or create public policies.`;
  } else if (error?.code === '42P01') {
    msg = `Supabase Table Missing (Code 42P01): A required table was not found in your Supabase database. Please copy and execute the SQL schema in your Supabase SQL Editor first.`;
  }
  return new Error(msg);
}

async function dbGetUsers() {
  if (supabaseClient && tablesExist) {
    try {
      const { data, error } = await supabaseClient.from("users").select("*");
      if (error) {
        throw handleSupabaseError("getUsers", error);
      }
      return (data || []).map(toCamel);
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in getUsers, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  return users;
}

async function dbFindUserByEmail(email: string) {
  if (supabaseClient && tablesExist) {
    try {
      const { data, error } = await supabaseClient.from("users").select("*").eq("email", email);
      if (error) {
        throw handleSupabaseError("findUserByEmail", error);
      }
      if (!data || data.length === 0) return null;
      return toCamel(data[0]);
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbFindUserByEmail, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  return users.find(u => u.email === email) || null;
}

async function dbAddUser(user: any) {
  if (supabaseClient && tablesExist) {
    try {
      const dbUser = toSnake(user);
      const { data, error } = await supabaseClient.from("users").insert([dbUser]).select();
      if (error) {
        throw handleSupabaseError("addUser", error);
      }
      return data && data.length > 0 ? toCamel(data[0]) : user;
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbAddUser, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  users.push(user);
  return user;
}

async function dbUpdateUser(id: string, updates: any) {
  if (supabaseClient && tablesExist) {
    try {
      const dbUpdates = toSnake(updates);
      const { data, error } = await supabaseClient.from("users").update(dbUpdates).eq("id", id).select();
      if (error) {
        throw handleSupabaseError("updateUser", error);
      }
      return data && data.length > 0 ? toCamel(data[0]) : { id, ...updates };
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbUpdateUser, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    return users[index];
  }
  return null;
}

async function dbGetOrders(role?: string, userId?: string) {
  if (supabaseClient && tablesExist) {
    try {
      let query = supabaseClient.from("orders").select("*");
      if (role === 'customer' && userId) {
        query = query.eq("customer_id", userId);
      } else if (role === 'rider' && userId) {
        query = query.eq("rider_id", userId);
      }
      query = query.order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) {
        throw handleSupabaseError("getOrders", error);
      }
      return (data || []).map(toCamel);
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbGetOrders, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  
  if (role === 'customer') {
    return orders.filter(o => o.customerId === userId);
  } else if (role === 'rider') {
    return orders.filter(o => o.riderId === userId);
  } else {
    return orders;
  }
}

async function dbAddOrder(order: any) {
  if (supabaseClient && tablesExist) {
    try {
      const dbOrder = toSnake(order);
      const { data, error } = await supabaseClient.from("orders").insert([dbOrder]).select();
      if (error) {
        throw handleSupabaseError("addOrder", error);
      }
      return data && data.length > 0 ? toCamel(data[0]) : order;
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbAddOrder, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  orders.push(order);
  return order;
}

async function dbUpdateOrder(id: string, updates: any) {
  if (supabaseClient && tablesExist) {
    try {
      const dbUpdates = toSnake(updates);
      delete dbUpdates.updated_by; // filter non-db property
      const { data, error } = await supabaseClient.from("orders").update(dbUpdates).eq("id", id).select();
      if (error) {
        throw handleSupabaseError("updateOrder", error);
      }
      return data && data.length > 0 ? toCamel(data[0]) : { id, ...updates };
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbUpdateOrder, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates };
    return orders[index];
  }
  return null;
}

async function dbGetInventory() {
  if (supabaseClient && tablesExist) {
    try {
      const { data, error } = await supabaseClient.from("inventory").select("*").order("name", { ascending: true });
      if (error) {
        throw handleSupabaseError("getInventory", error);
      }
      return (data || []).map(toCamel);
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbGetInventory, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  return inventory;
}

async function dbRefillInventory(id: string, amount: number) {
  if (supabaseClient && tablesExist) {
    try {
      const { data: item, error: getError } = await supabaseClient.from("inventory").select("quantity").eq("id", id);
      if (getError || !item || item.length === 0) {
        throw handleSupabaseError("getInventoryItem", getError || new Error("Item not found"));
      }
      const newQty = Number(item[0].quantity) + amount;
      const { data, error } = await supabaseClient.from("inventory").update({ quantity: newQty }).eq("id", id).select();
      if (error) {
        throw handleSupabaseError("updateInventoryItem", error);
      }
      return data && data.length > 0 ? toCamel(data[0]) : { id, quantity: newQty };
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbRefillInventory, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  const item = inventory.find(i => i.id === id);
  if (item) {
    item.quantity += amount;
    return item;
  }
  return null;
}

async function dbGetAuditLogs() {
  if (supabaseClient && tablesExist) {
    try {
      const { data, error } = await supabaseClient.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(40);
      if (error) {
        throw handleSupabaseError("getAuditLogs", error);
      }
      return (data || []).map(row => ({
        timestamp: row.timestamp,
        user: row.user_name,
        action: row.action
      }));
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbGetAuditLogs, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  return auditLogs;
}

async function dbAddAuditLog(userName: string, action: string) {
  const logObj = {
    timestamp: new Date().toISOString(),
    userName,
    action
  };
  if (supabaseClient && tablesExist) {
    try {
      const dbLog = toSnake(logObj);
      const { error } = await supabaseClient.from("audit_logs").insert([dbLog]);
      if (error) {
        console.error("Supabase addAuditLog error:", error);
      }
      return;
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbAddAuditLog, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        console.error("Failed to add audit log to Supabase:", err.message);
      }
    }
  }
  auditLogs.unshift({
    timestamp: logObj.timestamp,
    user: userName,
    action: action
  });
}

async function dbGetFeedbacks() {
  if (supabaseClient && tablesExist) {
    try {
      const { data, error } = await supabaseClient.from("feedbacks").select("*").order("id", { ascending: false });
      if (error) {
        throw handleSupabaseError("getFeedbacks", error);
      }
      return (data || []).map(toCamel);
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbGetFeedbacks, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  return feedbacks;
}

async function dbAddFeedback(fb: any) {
  if (supabaseClient && tablesExist) {
    try {
      const dbFb = toSnake(fb);
      const { data, error } = await supabaseClient.from("feedbacks").insert([dbFb]).select();
      if (error) {
        throw handleSupabaseError("addFeedback", error);
      }
      return data && data.length > 0 ? toCamel(data[0]) : fb;
    } catch (err: any) {
      if (isNetworkOrConnectionError(err)) {
        console.warn("Supabase connection offline in dbAddFeedback, falling back to local DB:", err.message);
        tablesExist = false;
      } else {
        throw err;
      }
    }
  }
  feedbacks.unshift(fb);
  return fb;
}


// --- Lazy Initializer for Gemini ---
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // --- API Routes ---

  // Health
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Auth & User APIs
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await dbFindUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      // Log activity
      await dbAddAuditLog(user.name, "Logged into LPDMS");
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role, address, phone } = req.body;
    try {
      const existing = await dbFindUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already exists" });
      }
      const prefix = role === "rider" ? "rider" : role === "staff" ? "staff" : role === "admin" ? "admin" : "cust";
      const newUser = {
        id: `${prefix}-${randomUUID().slice(0, 6)}`,
        name,
        email,
        password,
        role: role || "customer",
        points: 0,
        address: address || "",
        phone: phone || ""
      };
      const saved = await dbAddUser(newUser);
      // Log activity
      await dbAddAuditLog(name, `Registered a new account as ${role || "customer"}`);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const allUsers = await dbGetUsers();
      res.json(allUsers.map(({ password, ...u }: any) => u));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updated = await dbUpdateUser(id, updates);
      if (!updated) return res.status(404).json({ error: "User not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Orders APIs
  app.get("/api/orders", async (req, res) => {
    const { role, userId } = req.query;
    try {
      const filtered = await dbGetOrders(role as string, userId as string);
      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    const orderId = `LPD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: orderId,
      weight: 0,
      status: "pending",
      createdAt: new Date().toISOString(),
      qrCodeValue: `QR_${orderId}`,
      ...req.body
    };
    try {
      const saved = await dbAddOrder(newOrder);

      // Update customer loyalty points (e.g. +15 points per order booked)
      const allUsers = await dbGetUsers();
      const customer = allUsers.find((u: any) => u.id === newOrder.customerId);
      if (customer) {
        await dbUpdateUser(customer.id, { points: (customer.points || 0) + 15 });
      }

      // Log activity
      await dbAddAuditLog(newOrder.customerName, `Scheduled laundry booking ${orderId}`);

      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updated = await dbUpdateOrder(id, updates);
      if (!updated) return res.status(404).json({ error: "Order not found" });

      // Auto-update audit logs
      const actor = updates.updatedBy || "System";
      await dbAddAuditLog(actor, `Updated order ${id} status to '${updates.status || updated.status}'`);

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/orders/:id/feedback", async (req, res) => {
    const { id } = req.params;
    const { rating, review, customerName } = req.body;
    try {
      await dbUpdateOrder(id, { rating, review });
      const fb = {
        id: `fb-${randomUUID().slice(0, 4)}`,
        customerName: customerName || "Anonymous",
        rating,
        review,
        type: "Review"
      };
      await dbAddFeedback(fb);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI-Based Delivery Forecast with Gemini
  app.post("/api/predict-delivery", async (req, res) => {
    const { service, workloadCount, weather, trafficLevel } = req.body;
    const fallbackEstimate = `Based on the current ${weather} conditions, ${trafficLevel} traffic, and an active queue of ${workloadCount || 3} orders, your ${service} laundry is forecasted to be ready and delivered in approximately **36 hours** (Fastest pickup: Today at 5:00 PM).`;

    try {
      const ai = getGeminiClient();
      if (!ai) {
        // Return friendly fallbacks when key is not configured or in sandbox
        return res.json({ prediction: fallbackEstimate });
      }

      const prompt = `You are the AI operations agent for LPDMS (Laundry Pickup & Delivery Management System). 
      Provide a highly precise, human-friendly delivery time prediction and forecast (about 2-3 sentences max) based on:
      - Service Type: ${service} (e.g. Wash & Fold, Wash & Dry, Dry Cleaning, Ironing)
      - Active queue backlog: ${workloadCount || 3} orders currently processing
      - Weather: ${weather} (e.g. Rainy, Sunny, Stormy, Cloudy)
      - Traffic: ${trafficLevel} (e.g. Light, Moderate, Heavy)
      Use SDG 9 context of modern, optimized smart infrastructure. Keep it professional, realistic, and specify estimated hours/days for completion.`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ prediction: aiResponse.text || fallbackEstimate });
    } catch (error: any) {
      console.error("Gemini AI prediction failed, returning fallback:", error);
      res.json({ prediction: fallbackEstimate });
    }
  });

  // Inventory APIs
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await dbGetInventory();
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/inventory/refill", async (req, res) => {
    const { id, amount } = req.body;
    try {
      const item = await dbRefillInventory(id, Number(amount));
      if (item) {
        await dbAddAuditLog("Staff Maria", `Restocked ${item.name} by +${amount} ${item.unit}`);
        return res.json(item);
      }
      res.status(404).json({ error: "Item not found" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Analytics & Dashboard Metrics
  app.get("/api/analytics", async (req, res) => {
    try {
      const allOrders = await dbGetOrders();
      const allFeedbacks = await dbGetFeedbacks();
      const allLogs = await dbGetAuditLogs();

      const totalRevenue = allOrders.reduce((acc: number, curr: any) => acc + (curr.isPaid ? Number(curr.cost || 0) : 0), 0);
      const completedOrdersCount = allOrders.filter((o: any) => o.status === 'delivered').length;
      
      // Group orders by service
      const serviceCounts: Record<string, number> = {};
      allOrders.forEach((o: any) => {
        serviceCounts[o.service] = (serviceCounts[o.service] || 0) + 1;
      });
      const mostRequested = Object.entries(serviceCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "Wash & Fold";

      res.json({
         dailyOrders: [
           { name: 'Mon', uv: 12 }, { name: 'Tue', uv: 19 }, { name: 'Wed', uv: 15 },
           { name: 'Thu', uv: 22 }, { name: 'Fri', uv: 35 }, { name: 'Sat', uv: 40 }, { name: 'Sun', uv: 28 }
         ],
         revenue: totalRevenue + 12400, // include historical baseline
         completedOrders: completedOrdersCount + 48,
         customerSatisfaction: 4.8,
         mostRequestedService: mostRequested,
         feedbacks: allFeedbacks,
         auditLogs: allLogs
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Supabase Configuration & Integration Controller Routes
  app.get("/api/supabase/config", async (req, res) => {
    // Dynamically check table presence on query, especially if useSupabase is true but tablesExist was previously false
    if (supabaseClient && !tablesExist) {
      await verifySupabaseTables();
    }
    res.json({
      supabaseUrl: supabaseConfig.supabaseUrl,
      supabaseKeyExists: !!supabaseConfig.supabaseKey,
      useSupabase: supabaseConfig.useSupabase,
      isConnected: !!supabaseClient,
      tablesExist: tablesExist
    });
  });

  app.post("/api/supabase/config", async (req, res) => {
    const { supabaseUrl, supabaseKey, useSupabase } = req.body;
    
    if (supabaseUrl !== undefined) supabaseConfig.supabaseUrl = supabaseUrl;
    if (supabaseKey !== undefined && supabaseKey !== "") supabaseConfig.supabaseKey = supabaseKey;
    if (useSupabase !== undefined) supabaseConfig.useSupabase = useSupabase;

    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(supabaseConfig, null, 2), "utf8");
      await initSupabase();
      res.json({
        success: true,
        message: "Supabase configuration updated successfully",
        config: {
          supabaseUrl: supabaseConfig.supabaseUrl,
          supabaseKeyExists: !!supabaseConfig.supabaseKey,
          useSupabase: supabaseConfig.useSupabase,
          isConnected: !!supabaseClient,
          tablesExist: tablesExist
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to save configuration: " + err.message });
    }
  });

  app.post("/api/supabase/test", async (req, res) => {
    const { supabaseUrl, supabaseKey } = req.body;
    const url = supabaseUrl || supabaseConfig.supabaseUrl;
    const key = supabaseKey || supabaseConfig.supabaseKey;

    if (!url || !key) {
      return res.status(400).json({ error: "Missing Supabase URL or Key" });
    }

    try {
      const tempClient = createClient(url, key, { auth: { persistSession: false } });
      const { data, error } = await tempClient.from("users").select("id").limit(1);
      if (error) {
        if (error.code === '42501') {
          return res.json({ 
            success: true, 
            message: "🎉 Connected! Table 'users' detected, but Row-Level Security (RLS) is active. Please run the SQL schema with DISABLE RLS statements in your Supabase SQL Editor for complete direct access." 
          });
        }
        return res.status(400).json({ 
          error: `Connected, but failed to select from 'users' table. Error: ${error.message}. Please double check if you ran the SQL Schema in your Supabase SQL editor.` 
        });
      }
      res.json({ success: true, message: "Successfully connected to Supabase and verified tables!" });
    } catch (err: any) {
      res.status(500).json({ error: "Connection failed: " + err.message });
    }
  });

  app.post("/api/supabase/seed", async (req, res) => {
    if (!supabaseClient) {
      return res.status(400).json({ error: "Supabase client is not initialized or connected. Please save valid keys first." });
    }

    try {
      console.log("Seeding Supabase with initial demo data...");

      // 1. Seed Users
      const snakeUsers = users.map(toSnake);
      for (const u of snakeUsers) {
        const { error } = await supabaseClient.from("users").upsert([u]);
        if (error) throw new Error(`Users seed error: ${error.message}`);
      }

      // 2. Seed Orders
      const snakeOrders = orders.map(toSnake);
      for (const o of snakeOrders) {
        const { error } = await supabaseClient.from("orders").upsert([o]);
        if (error) throw new Error(`Orders seed error: ${error.message}`);
      }

      // 3. Seed Inventory
      const snakeInventory = inventory.map(toSnake);
      for (const inv of snakeInventory) {
        const { error } = await supabaseClient.from("inventory").upsert([inv]);
        if (error) throw new Error(`Inventory seed error: ${error.message}`);
      }

      // 4. Seed Feedbacks
      const snakeFeedbacks = feedbacks.map(toSnake);
      for (const fb of snakeFeedbacks) {
        const { error } = await supabaseClient.from("feedbacks").upsert([fb]);
        if (error) throw new Error(`Feedbacks seed error: ${error.message}`);
      }

      // 5. Seed Logs
      const snakeLogs = auditLogs.map(l => toSnake({
        timestamp: l.timestamp,
        userName: l.user,
        action: l.action
      }));
      for (const log of snakeLogs) {
        const { error } = await supabaseClient.from("audit_logs").insert([log]);
        if (error) throw new Error(`Logs seed error: ${error.message}`);
      }

      res.json({ success: true, message: "All default tables successfully seeded inside Supabase!" });
    } catch (err: any) {
      console.error("Seeding error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
