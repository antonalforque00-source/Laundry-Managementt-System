# LaundroFlow (LPDMS) - Local VSCode Setup

This project is fully ready for a manual setup inside VSCode. It uses a modern Express backend coupled with a Vite + React frontend, packaged to run perfectly in a local development environment.

## Prerequisites

1.  **Node.js**: Ensure you have Node.js 18+ installed on your system.
2.  **VSCode**: Open this project folder in Visual Studio Code.

## Getting Started

1.  **Install Dependencies**
    Open the integrated terminal in VSCode (`Ctrl + \``) and run:
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in the root directory (you can copy from `.env.example` if it exists).
    For this application, it uses an embedded mock-database or a connection if configured. If you are using Supabase or Firebase, add your credentials here.
    *(By default, the system falls back to a smart mock mode if no database is connected, so you can test immediately).*

3.  **Run the Development Server**
    Start both the frontend Vite server and the Express backend using:
    ```bash
    npm run dev
    ```
    This will start the server using `tsx`, binding to port `3000`.
    - Access the application at: `http://localhost:3000`

## Building for Production

To create a production build (bundling both frontend and backend):

```bash
npm run build
```

This compiles the React application into static files (inside `dist/`) and bundles the Express server into `dist/server.cjs`.

To run the production build locally:

```bash
npm run start
```

## Features Included

*   **100% Functional UI**: The login screen matches your minimal, clean "LaundroFlow" design exactly.
*   **Role-Based Access Control**: Fully functioning separate dashboards for Customers, Riders, Staff, and Admins.
*   **End-to-End Local Execution**: Bypasses complex cloud setups by using standard local Node.js conventions, making it perfect for running inside VSCode without extra infrastructure.
