import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { ArrowRight, Sparkles, ChefHat, User, Shield, Utensils } from 'lucide-react';
import CustomerLayout from './layouts/CustomerLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Menu from './pages/customer/Menu';
import Cart from './pages/customer/Cart';
import Payment from './pages/customer/Payment';
import KitchenDashboard from './pages/kitchen/KitchenDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import InventoryPage from './pages/admin/Inventory';
import Analytics from './pages/admin/Analytics';
import Forecast from './pages/admin/Forecast';
import AdminOrders from './pages/admin/AdminOrders';
import AdminTables from './pages/admin/AdminTables';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import WaiterOrders from './pages/waiter/WaiterOrders';
import OrderStatus from './pages/customer/OrderStatus';
import TableSelection from './pages/customer/TableSelection';
import Login from './pages/auth/Login';

// Modern Sage-Green Artisan Landing Page
const Landing = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#F4F6F0] text-[#222222] flex flex-col items-center justify-center relative overflow-hidden px-4 py-12"
    >
      {/* Organic Decorative Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#BCE2A3]/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#5A724A]/15 rounded-full blur-3xl" />
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03] text-[#5A724A]" viewBox="0 0 200 200" fill="currentColor">
          <path d="M47.7,-57.2C59.6,-46.3,65.6,-29.6,67.8,-12.6C70,4.4,68.4,21.8,60.2,36.5C52,51.2,37.1,63.2,20.4,68.3C3.6,73.4,-15,71.6,-31.6,64.2C-48.2,56.8,-62.8,43.8,-70.3,27.1C-77.8,10.4,-78.3,-10.1,-70.6,-26.4C-62.8,-42.6,-46.8,-54.6,-30.9,-63.3C-15,-72,-0.1,-77.4,14.6,-74.3C29.3,-71.2,35.8,-68.1,47.7,-57.2Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className="z-10 text-center space-y-8 max-w-3xl relative w-full">
        {/* Herb Tag */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-white/90 border border-[#EBEBEB] px-4 py-1.5 rounded-full shadow-xs"
        >
          <span className="text-base">🌿</span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#5A724A]">Artisan Dining Experience</span>
        </motion.div>

        {/* Main Title */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.8 }}
          className="space-y-3"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#222222]">
            Herb &amp; Spice<span className="text-[#5A724A]">.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#818181] font-normal max-w-xl mx-auto leading-relaxed">
            Elevating the art of dining through seamless botanical-inspired digital service.
          </p>
        </motion.div>

        {/* Action Roles Pill Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-col gap-6 items-center pt-4"
        >
          <div className="w-full max-w-lg p-2 border border-[#EBEBEB] rounded-3xl bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgba(90,114,74,0.06)]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href="/table"
                className="flex flex-col items-center justify-center p-3.5 bg-[#5A724A] text-white rounded-2xl shadow-sm hover:bg-[#485D3B] transition-all group"
              >
                <Utensils size={18} className="mb-1" />
                <span className="text-xs font-bold">Guest Menu</span>
              </a>
              <a
                href="/waiter/login"
                className="flex flex-col items-center justify-center p-3.5 bg-[#F8F8F8] text-[#222222] hover:bg-[#BCE2A3]/40 rounded-2xl transition-all border border-[#EBEBEB]"
              >
                <User size={18} className="text-[#5A724A] mb-1" />
                <span className="text-xs font-semibold">Staff Floor</span>
              </a>
              <a
                href="/kitchen/login"
                className="flex flex-col items-center justify-center p-3.5 bg-[#F8F8F8] text-[#222222] hover:bg-[#BCE2A3]/40 rounded-2xl transition-all border border-[#EBEBEB]"
              >
                <ChefHat size={18} className="text-[#5A724A] mb-1" />
                <span className="text-xs font-semibold">Kitchen KDS</span>
              </a>
              <a
                href="/admin/login"
                className="flex flex-col items-center justify-center p-3.5 bg-[#F8F8F8] text-[#222222] hover:bg-[#BCE2A3]/40 rounded-2xl transition-all border border-[#EBEBEB]"
              >
                <Shield size={18} className="text-[#5A724A] mb-1" />
                <span className="text-xs font-semibold">Admin OS</span>
              </a>
            </div>
          </div>

          <div className="text-[11px] font-bold text-[#818181] uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5A724A]" />
            Herb &amp; Spice Operating System • v2.4.0
          </div>

          {/* Demo Credentials Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.8 }}
            className="w-full max-w-md bg-white border border-[#EBEBEB] rounded-3xl p-6 shadow-[0_8px_30px_rgba(90,114,74,0.06)] text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A724A]">Demo Credentials</h3>
              <span className="text-[10px] bg-[#BCE2A3]/40 text-[#425934] font-bold px-2 py-0.5 rounded-full">Test Suite</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-[#F8F8F8] rounded-2xl border border-[#EBEBEB]">
                <p className="font-bold text-[#222222]">Admin</p>
                <p className="text-[11px] text-[#818181] font-mono mt-0.5">admin@akxton.com</p>
                <p className="text-[11px] text-[#5A724A] font-mono">admin123</p>
              </div>
              <div className="p-3 bg-[#F8F8F8] rounded-2xl border border-[#EBEBEB]">
                <p className="font-bold text-[#222222]">Chef</p>
                <p className="text-[11px] text-[#818181] font-mono mt-0.5">chef@akxton.com</p>
                <p className="text-[11px] text-[#5A724A] font-mono">chef123</p>
              </div>
              <div className="p-3 bg-[#F8F8F8] rounded-2xl border border-[#EBEBEB]">
                <p className="font-bold text-[#222222]">Waiter</p>
                <p className="text-[11px] text-[#818181] font-mono mt-0.5">waiter@akxton.com</p>
                <p className="text-[11px] text-[#5A724A] font-mono">waiter123</p>
              </div>
              <div className="p-3 bg-[#F8F8F8] rounded-2xl border border-[#EBEBEB]">
                <p className="font-bold text-[#222222]">Customer</p>
                <p className="text-[11px] text-[#818181] mt-0.5">Direct Access</p>
                <p className="text-[11px] text-[#5A724A] font-semibold">Select Table 1-10</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />

        <Route path="/admin/login" element={<Login role="Admin" />} />
        <Route path="/waiter/login" element={<Login role="Waiter" />} />
        <Route path="/kitchen/login" element={<Login role="Kitchen" />} />

        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="menu" element={<InventoryPage />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="forecast" element={<Forecast />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="tables" element={<AdminTables />} />
        </Route>

        <Route path="/waiter" element={<DashboardLayout role="waiter" />}>
          <Route path="dashboard" element={<WaiterDashboard />} />
          <Route path="orders" element={<WaiterOrders />} />
        </Route>

        <Route path="/kitchen" element={<DashboardLayout role="kitchen" />}>
          <Route path="dashboard" element={<KitchenDashboard />} />
        </Route>

        <Route path="/tables" element={<Navigate to="/table" replace />} />
        <Route path="/table" element={<TableSelection />} />
        <Route path="/table/:tableId/*" element={<CustomerLayout />}>
          <Route index element={<Navigate to="menu" replace />} />
          <Route path="menu" element={<Menu />} />
          <Route path="cart" element={<Cart />} />
          <Route path="payment" element={<Payment />} />
          <Route path="status" element={<OrderStatus />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={
          <div className="min-h-screen bg-[#F4F6F0] flex flex-col items-center justify-center text-[#818181] p-6 text-center">
            <span className="text-4xl mb-3">🌿</span>
            <h2 className="text-2xl font-bold text-[#222222]">Page Not Found</h2>
            <p className="text-sm mt-1 mb-6">The requested dining area could not be found.</p>
            <a href="/" className="px-6 py-2.5 bg-[#5A724A] text-white font-bold rounded-full text-sm">
              Return Home
            </a>
          </div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        style: {
          borderRadius: '9999px',
          background: '#222222',
          color: '#ffffff',
          fontSize: '13px',
          padding: '10px 18px',
        }
      }} />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
