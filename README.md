# 🌿 Herb & Spice (AKXTON POS)

> A modern, real-time smart restaurant management platform and Point of Sale (POS) system engineered for high-efficiency dining operations.

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%204-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📖 Overview

**Herb & Spice** streamlines the entire restaurant lifecycle into a unified digital experience:
- **Guests** scan a table QR code to explore the interactive menu, customize orders, interact with an AI culinary assistant, and settle payments.
- **Waiters** monitor live table occupancies, view active order statuses, and receive instant call-waiter requests.
- **Kitchen staff** view live incoming orders on a dedicated Kitchen Display System (KDS) with instant status transitions.
- **Administrators** control menu items, automate inventory deductions, forecast sales demand, and view analytical insights.

---

## ✨ Key Features

### 🍽️ Customer Dining Experience (`/table/:tableId/menu`)
- **Digital QR Menu**: Dynamic browsing with category filters, dietary tags, allergen information, and real-time out-of-stock indicators.
- **Real-Time Cart & Customization**: Modify quantities and add special cooking notes or allergy instructions.
- **Instant Waiter Calling**: Single-click "Call Waiter" button that broadcasts instant WebSocket alerts to service staff.
- **AI Dining Assistant ("Chef Akxi")**: Powered by Google Gemini to suggest pairings, dietary options, and chef recommendations.
- **Order Tracking & Billing**: Live order status timeline from placed to preparing, ready, and delivered.

### 👨‍🍳 Kitchen Display System (KDS) (`/kitchen`)
- **Live Ticket Board**: Zero-refresh real-time order arrival via WebSocket events.
- **Status Lifecycle Progression**: Seamless progression: `Pending` ➔ `Preparing` ➔ `Ready` ➔ `Completed`.
- **Special Cooking Instructions**: Highlights customer notes, spice levels, and dietary customizations.

### 🛎️ Waiter Operations (`/waiter`)
- **Visual Floor & Table Map**: Real-time statuses (`Available`, `Occupied`, `Billing`).
- **Live Call Alerts**: Instant push notifications when any table rings for assistance.
- **Order Management**: Take on-floor orders and update dining tickets directly from tablets or mobile devices.

### 📊 Admin & Back Office (`/admin`)
- **Executive Dashboard**: Live KPIs for total revenue, active orders, occupied tables, and average ticket size.
- **Menu Management**: Create, update, toggle availability, and set item pricing.
- **Smart Inventory & Auto-Deduction**: Ingredient-level tracking with automated depletion upon order placement and low-stock alerts.
- **Sales Analytics & Demand Forecasting**: Visual sales trends (Recharts) and predictive demand analysis.
- **Exportable Reports**: Generate detailed business reports in PDF, Excel (`.xlsx`), and CSV formats.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4 + Lucide React Icons
- **Animations**: Framer Motion
- **Visualizations**: Recharts
- **State & Notifications**: React Context API + React Hot Toast
- **Client Networking**: Axios + Socket.io-client

### Backend
- **Runtime**: Node.js + Express
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Engine**: Socket.io (WebSocket + Polling fallback)
- **Authentication**: JSON Web Tokens (JWT) + BcryptJS password hashing
- **Report Generation**: PDFKit, ExcelJS, json2csv
- **AI Integration**: Google Generative AI (Gemini API)
- **QR Codes**: `qrcode` generator

---

## 📁 Repository Structure

```text
Herb-And-Spice/
├── public/                 # Static assets & icons
├── src/                    # React frontend application
│   ├── components/         # Reusable UI & role components (admin, customer, ui)
│   ├── context/            # React Contexts (Cart, Auth, etc.)
│   ├── layouts/            # Dashboard & Customer Layout wrappers
│   ├── pages/              # App views (admin, auth, customer, kitchen, waiter)
│   ├── services/           # API clients & socket configurations
│   ├── App.jsx             # Route definitions & transitions
│   ├── index.css           # Global stylesheet & design tokens
│   └── main.jsx            # React root mount
│
├── server/                 # Express backend application
│   ├── config/             # Database connection setup
│   ├── controllers/        # Route business logic (auth, orders, menu, inventory, AI)
│   ├── middleware/         # JWT verification & role authorization
│   ├── models/             # Mongoose schemas (Order, MenuItem, Table, User, Inventory)
│   ├── routes/             # REST API endpoint routes
│   ├── utils/              # Helper utilities & inventory managers
│   ├── seedEnhanced.js     # Comprehensive database seed script
│   ├── server.js           # Server entry point & Socket.io handlers
│   └── .env.example        # Environment variable template
│
├── package.json            # Frontend dependencies & scripts
├── vite.config.js          # Vite build configuration
└── vercel.json             # Deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas connection URI)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

---

### 1. Installation

Clone the repository:
```bash
git clone https://github.com/AnkitSankhala07/Herb-And-Spice.git
cd Herb-And-Spice
```

Install root (frontend) dependencies:
```bash
npm install
```

Install server (backend) dependencies:
```bash
cd server
npm install
cd ..
```

---

### 2. Environment Configuration

Create a `.env` file in the `server` directory:
```bash
cp server/.env.example server/.env
```

Configure your environment variables in `server/.env`:
```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/smartresto

# JSON Web Token Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Backend Port
PORT=5000

# Frontend URL (for CORS and QR generation)
FRONTEND_URL=http://localhost:5173

# Google Gemini API Key (optional for AI Chat Assistant)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### 3. Database Initialization & Seeding

Populate the database with sample menu items, tables, categories, and test user accounts:

```bash
cd server
node seedEnhanced.js
cd ..
```

---

### 4. Running the Application

#### Start the Backend API:
```bash
cd server
npm run dev
```
*Server starts on `http://localhost:5000`.*

#### Start the Frontend Client:
In another terminal at the project root:
```bash
npm run dev
```
*Client starts on `http://localhost:5173` (or `http://localhost:5174`).*

---

## 🔑 Default Demo Credentials

| Role | Login URL | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | `/admin/login` | `admin@akxton.com` | `admin123` |
| **Chef / Kitchen** | `/kitchen/login` | `chef@akxton.com` | `chef123` |
| **Waiter / Staff** | `/waiter/login` | `waiter@akxton.com` | `waiter123` |
| **Guest / Customer**| `/table` | *No login needed — Select Table 1-10* | — |

---

## 📡 Key API Routes

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | User authentication & JWT issuance |
| `/api/menu` | `GET`, `POST` | Fetch menu items or add dishes |
| `/api/orders` | `GET`, `POST` | Retrieve active orders or create a dining order |
| `/api/orders/:id/status` | `PUT` | Update order progression status |
| `/api/tables` | `GET`, `PUT` | View table statuses or assign guests |
| `/api/inventory` | `GET`, `POST` | Manage stock, view low stock warnings |
| `/api/reports/sales/pdf` | `GET` | Export sales report in PDF |
| `/api/reports/sales/excel`| `GET` | Export sales report in Excel (`.xlsx`) |
| `/api/ai/chat` | `POST` | Query AI culinary assistant |

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
