# Laundry Portal Deployment System (LPDMS) - Setup Guide

Welcome to the **Laundry Portal Deployment System (LPDMS)**! This project has been carefully engineered to work both as a **Full-Stack Web Application** and as a **Mobile Application compatible with Expo Go and Expo Web**.

Follow this guide to run the system with zero errors during your presentation!

---

## 🛠️ HOW TO FIX: "npm error ERESOLVE could not resolve" (CRITICAL)

If you see an error like `ERESOLVE could not resolve` or `Conflicting peer dependency: react@18.2.0` when running `npm install`, this is because the system is configured to support Expo Go (which requires **React 18.2.0**) while your local files have leftover cached package locks.

### 🌟 Simple 2-Step Fix:
Run the following commands in your VSCode Terminal:

#### Option A (Recommended):
Delete the lock file and run install cleanly:
```bash
# On Windows (Command Prompt or PowerShell):
del package-lock.json
npm install
```
```bash
# On Mac/Linux:
rm package-lock.json
npm install
```

#### Option B (Fastest bypass):
Tell npm to install by bypassing strict React peer versions:
```bash
npm install --legacy-peer-deps
```

---

## 🛠️ HOW TO FIX: "module is not defined in ES module scope" or "ENOENT favicon.png" (SOLVED!)

If you previously encountered errors like **`AppEntry.js: module is not defined in ES module scope`** or **`ENOENT: no such file or directory, open favicon.png`** when starting Expo, they have been **100% solved and automated** in the codebase:

1. **Module Mismatch Solved:** We removed `"type": "module"` from the root `package.json`. This ensures Expo/Metro/Babel reads `.js` and config files as standard CommonJS without getting conflicts.
2. **Missing Assets Automated:** We created an automated self-healing script at `/scripts/init-assets.js`. It runs automatically every time you run `npm install`, `npm run dev`, or `npm run expo`. It checks if `favicon.png`, `icon.png`, `splash.png`, and `adaptive-icon.png` exist, and automatically creates them if they are missing!

---

## 🚀 Part 1: Running the Full-Stack Web Application

The web portal includes an Express Node.js server, local persistent storage, live Supabase connectivity, and interactive admin/customer/rider dashboards.

### Prerequisites
Make sure you have Node.js installed. Open your VSCode terminal and run:
```bash
npm install
```

### Run Command
To start the web application (with the live Express server & beautiful terminal QR code for scanning):
```bash
npm run dev
```

### Access Points
- **Local Address:** `http://localhost:3000`
- **Network Address:** `http://<your-local-ip-address>:3000` (Use this for connecting other devices on the same Wi-Fi!)

---

## 📱 Part 2: Running the Expo Go Mobile Application

If your teacher requests to see the mobile version using **Expo Go** or **Expo Web**, the project is fully pre-configured with Expo scripts and the necessary `expo-env.d.ts`, `app.json`, and `babel.config.js` configurations.

### Run Command
To start the Expo development environment:
```bash
npx expo start
```
or
```bash
npm run expo
```

### Options inside Expo:
- **Scan the QR Code:** Open the **Expo Go** app on your Android phone, or open your default camera on iPhone, and scan the QR code displayed in your terminal.
- **Run on Web:** Press `w` in the terminal to launch the web preview.
- **Run on Android Emulator:** Press `a` in the terminal.
- **Run on iOS Simulator:** Press `i` in the terminal.

---

## 🗄️ Part 3: Dual-Mode Database Persistence (Offline + Live Supabase)

LPDMS features a highly advanced, resilient **dual-mode persistence architecture**:

### 1. Local Persistent JSON File (No Configuration Needed)
By default, the server writes all registrations, bookings, staff inventory items, and action logs directly into `/local-database.json`. 
- **Benefit:** If you have no internet or Supabase configuration, the app **never crashes** and remains 100% functional, preserving users and bookings across page reloads.

### 2. Live Supabase Connection
To switch to a cloud-hosted database, simply navigate to the **Admin Dashboard** -> **Database Tab** inside the Web UI and input your credentials:
1. Copy the SQL schema from the **Admin Database Panel** or `/supabase_schema.sql`.
2. Paste and run it in the **Supabase SQL Editor** to create the tables.
3. Turn on the **"Activate Persistent Supabase Storage"** toggle in the Admin panel.
4. Click **Save Config** and then click **Seed Default Demo Data inside Supabase**!

---

## 🛠️ Folder Structure Reference

Here is how the project files are organized to support both Web and Expo Mobile development:

- `src/` - React frontend source code for the Web Portal.
- `app.json` - Expo mobile metadata configuration.
- `babel.config.js` - Compiler preset for React Native & Expo.
- `expo-env.d.ts` - TypeScript environmental definitions for Expo.
- `server.ts` - Live Express back-end proxy with database synchronization.
- `local-database.json` - Active local persistent store.
- `supabase_schema.sql` - Complete schema structure for Supabase.

---

Wishing you the best of luck on your presentation! You are fully prepared. 🌟
